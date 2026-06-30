from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from django.utils import timezone
from datetime import timedelta
from .models import Abonnement, Paiement, Plan, CompteEncaissement
from .serializers import (
    AbonnementSerializer, SouscriptionSerializer, PaiementSerializer, PlanSerializer,
    CompteEncaissementSerializer,
)
from logs.utils import enregistrer_log



TARIFS = {
    'standard': {
        'mensuel': 500,
        '2_mois':  950,    
        '3_mois':  1400,   
        '6_mois':  2700,   
        'annuel':  5000,
    },
    'entreprise': {
        'mensuel': 2000,
        '2_mois':  3800,  
        '3_mois':  5600,  
        '6_mois':  10800,  
        'annuel':  20000,
    },
}

# ── Définitions de plans par défaut, réutilisées par SouscriptionView,
# PaiementAdmin.accepter_paiements et activer_abonnement() ──────────────────
PLANS_DEFAULTS = {
    'standard':   {'prix_mensuel': 500,  'prix_annuel': 5000,  'nb_categories_max': 50,  'description': 'Plan Standard'},
    'entreprise': {'prix_mensuel': 2000, 'prix_annuel': 20000, 'nb_categories_max': 200, 'description': 'Plan Entreprise'},
}

# Méthodes de paiement manuelles (capture d'écran + validation admin)
METHODES_MANUELLES = ('rssbank', 'sedad', 'bankily', 'masrivi')

# NOUVEAU — types d'abonnement (durées) valides pour une demande de paiement.
TYPES_ABONNEMENT_VALIDES = ('mensuel', '2_mois', '3_mois', '6_mois', 'annuel')

# NOUVEAU — nombre de jours restants en-dessous duquel un changement de plan
SEUIL_JOURS_CHANGEMENT_PLAN = 5

# NOUVEAU — nombre maximum de renouvellements autorisés pendant une même
MAX_RENOUVELLEMENTS = 3


def _get_or_create_plan(nom_plan: str, defaults: dict) -> Plan:
    plan, _ = Plan.objects.get_or_create(nom=nom_plan, defaults=defaults)
    return plan

def get_abonnement_essai_utilisateur(user):
    """Récupère l'abonnement essai existant de l'utilisateur (celui créé à l'inscription)"""
    try:
        plan_essai = Plan.objects.get(nom='essai')
        return Abonnement.objects.filter(utilisateur=user, plan=plan_essai).first()
    except Plan.DoesNotExist:
        return None


def verifier_et_mettre_a_jour_abonnement_expire(user):
    """
    Vérifie si l'abonnement est expiré et bascule vers l'abonnement essai existant
    Retourne True si l'abonnement a été changé, False sinon
    """
    try:
        abo = user.abonnement
        if abo and abo.statut == 'actif' and abo.date_fin < timezone.now():
            # Marquer l'abonnement actuel comme expiré
            abo.statut = 'expire'
            abo.save(update_fields=['statut'])
            
            # Récupérer l'abonnement essai existant (créé à l'inscription)
            abo_essai = get_abonnement_essai_utilisateur(user)
            
            if abo_essai:
                # Réactiver l'abonnement essai existant
                abo_essai.statut = 'actif'
                abo_essai.date_debut = timezone.now()
                abo_essai.date_fin = timezone.now() + timedelta(days=30)
                abo_essai.montant = 0
                abo_essai.type = 'mensuel'
                abo_essai.nb_renouvellements = 0
                abo_essai.save()
                
                user.abonnement = abo_essai
                user.save(update_fields=['abonnement'])
                
                
                from notifications.models import Notification
                Notification.objects.create(
                    utilisateur=user,
                    type='abonnement_expire',
                    message=(
                        f"ABONNEMENT_EXPIRE|"
                        f"plan:{abo.get_plan_nom().capitalize()}|"
                        f"date:{timezone.now().strftime('%d/%m/%Y')}"
                    )
                )
                
                return True
    except Abonnement.DoesNotExist:
        pass
    return False


# ══════════════════════════════════════════════════════════════════════════════
# NOUVEAU — Règles de renouvellement / changement de plan.
# ══════════════════════════════════════════════════════════════════════════════
def verifier_regles_renouvellement(user, nouveau_type_utilisateur: str, nouvelle_duree: str) -> str:
    """
    Vérifie les règles de renouvellement / changement de plan pour `user`.
    Retourne le mode à appliquer : 'nouveau', 'prolongation' ou 'changement'.
    Lève ValueError(message) si la demande doit être refusée.
    """
    try:
        abo = user.abonnement
    except Abonnement.DoesNotExist:
        abo = None

    if not abo or not abo.est_actif() or abo.get_plan_nom() == 'essai':
        return 'nouveau'

    ancien_type_utilisateur = abo.get_plan_nom()  
    jours_restants = abo.jours_restants()

    if ancien_type_utilisateur == nouveau_type_utilisateur:
        mode = 'prolongation'
    else:
        if jours_restants > SEUIL_JOURS_CHANGEMENT_PLAN:
            raise ValueError(
                f"Vous avez déjà un abonnement {ancien_type_utilisateur} actif avec "
                f"{jours_restants} jour(s) restant(s). Le changement vers "
                f"{nouveau_type_utilisateur} n'est possible que lorsqu'il reste "
                f"{SEUIL_JOURS_CHANGEMENT_PLAN} jour(s) ou moins."
            )
        mode = 'changement'

    if abo.nb_renouvellements >= MAX_RENOUVELLEMENTS:
        raise ValueError(
            f"Vous avez déjà renouvelé votre abonnement {MAX_RENOUVELLEMENTS} fois "
            f"pendant cette période active. Veuillez attendre la fin de votre "
            f"abonnement actuel avant de renouveler à nouveau."
        )

    return mode


def activer_abonnement(user, type_utilisateur: str, type_abonnement: str, montant, mode: str = None) -> Abonnement:
    """
    Active (crée ou met à jour) l'Abonnement de `user` pour le plan
    `type_utilisateur` / `type_abonnement`, met à jour son rôle, et envoie
    la notification ABONNEMENT_ACTIVE. Retourne l'Abonnement mis à jour.
    """
    maintenant = timezone.now()
    duree_jours = Abonnement.DUREE_JOURS_MAP.get(type_abonnement, 30)

    try:
        abo_existant = user.abonnement
    except Abonnement.DoesNotExist:
        abo_existant = None

    if mode == 'prolongation' and abo_existant is not None:
        date_debut = abo_existant.date_debut
        base_date_fin = abo_existant.date_fin if abo_existant.date_fin > maintenant else maintenant
        date_fin = base_date_fin + timedelta(days=duree_jours)
        nouveau_compteur = abo_existant.nb_renouvellements + 1
    elif mode == 'changement' and abo_existant is not None:
        # Changement de plan autorisé : pas de cumul, on repart d'aujourd'hui.
        date_debut = maintenant
        date_fin = maintenant + timedelta(days=duree_jours)
        nouveau_compteur = abo_existant.nb_renouvellements + 1
    else:
        date_debut = maintenant
        date_fin = maintenant + timedelta(days=duree_jours)
        nouveau_compteur = 0

    plan = _get_or_create_plan(type_utilisateur, PLANS_DEFAULTS[type_utilisateur])

    abo, _created = Abonnement.objects.update_or_create(
        utilisateur=user,
        defaults={
            'plan':                plan,
            'type':                type_abonnement,
            'date_debut':          date_debut,
            'date_fin':            date_fin,
            'statut':              'actif',
            'montant':             montant,
            'nb_renouvellements':  nouveau_compteur,
        }
    )

    # Mettre à jour le rôle utilisateur
    user.role = type_utilisateur
    user.save(update_fields=['role'])

    from notifications.models import Notification
    duree_labels = {
        'mensuel': "30 jours", '2_mois': "60 jours", '3_mois': "90 jours",
        '6_mois': "180 jours", 'annuel': "365 jours",
    }
    duree_label = duree_labels.get(type_abonnement, f"{duree_jours} jours")
    mode_label = {
        'nouveau': 'Nouveau', 'prolongation': 'Prolongation', 'changement': 'Changement de plan',
    }.get(mode, 'Nouveau')
    Notification.objects.create(
        utilisateur=user,
        type='abonnement_active',
        message=(
            f"ABONNEMENT_ACTIVE|"
            f"plan:{type_utilisateur.capitalize()}|"
            f"type:{type_abonnement.capitalize()}|"
            f"debut:{date_debut.strftime('%d/%m/%Y')}|"
            f"fin:{date_fin.strftime('%d/%m/%Y')}|"
            f"montant:{montant}|"
            f"duree:{duree_label}|"
            f"mode:{mode_label}"
        ),
    )

    return abo


# ─── LISTE DES PLANS ─────────────────────────────────────────────────────────
class PlanListView(generics.ListAPIView):
    serializer_class   = PlanSerializer
    permission_classes = [IsAuthenticated]
    queryset           = Plan.objects.all()
    pagination_class   = None


# ─── DEMANDE DE CODE DE CONFIRMATION avant souscription ─────────────────────
class DemanderCodeSouscriptionView(APIView):
    """
    Étape 1 : l'utilisateur choisit son plan et son email.
    Le système vérifie que l'email correspond à celui du compte,
    génère un code à 6 chiffres et l'envoie par email.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        email            = request.data.get('email', '').strip().lower()
        type_abonnement  = request.data.get('type_abonnement', '')
        type_utilisateur = request.data.get('type_utilisateur', '')

        # Validations
        if not email:
            return Response({'error': "L'email est obligatoire."}, status=400)
        # NOUVEAU — type_abonnement accepte désormais les 5 durées.
        if type_abonnement not in TYPES_ABONNEMENT_VALIDES:
            return Response({'error': "Type d'abonnement invalide (mensuel, 2_mois, 3_mois, 6_mois ou annuel)."}, status=400)
        if type_utilisateur not in ('standard', 'entreprise'):
            return Response({'error': "Type d'utilisateur invalide (standard ou entreprise)."}, status=400)

        user = request.user
        # Vérifier que l'email correspond au compte
        user_email = (user.email or '').lower()
        if user_email != email:
            return Response({
                'error': "L'email ne correspond pas à celui de votre compte. "
                         "Utilisez l'email enregistré lors de l'inscription."
            }, status=400)

        # Générer le code
        from comptes.utils import generer_code_reset, sauvegarder_code_reset
        code = generer_code_reset(6)
        sauvegarder_code_reset(f"abo:{email}", code, ttl=300)

        montant = TARIFS[type_utilisateur][type_abonnement]
        
        # Utiliser la nouvelle fonction email dédiée à l'abonnement
        from comptes.utils import envoyer_email_abonnement
        ok = envoyer_email_abonnement(email, code, type_utilisateur, montant)

        if not ok:
            return Response({
                'error': "Impossible d'envoyer le code par email. essayer plus tard"
            }, status=500)

        return Response({
            'message': f"Code envoyé à {email}. Valable 5 minutes.",
            'montant': montant,
            'type_abonnement': type_abonnement,
            'type_utilisateur': type_utilisateur,
        })


# ─── SOUSCRIPTION (avec vérification du code) ────────────────────────────────
class SouscriptionView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request):
        email            = request.data.get('email', '').strip().lower()
        code             = request.data.get('code_confirmation', '').strip()
        type_abonnement  = request.data.get('type_abonnement', '')
        type_utilisateur = request.data.get('type_utilisateur', '')
        if not all([email, code, type_abonnement, type_utilisateur]):
            return Response({'error': 'Tous les champs sont obligatoires.'}, status=400)

        # NOUVEAU — validation des durées étendues, cohérente avec
        # DemanderCodeSouscriptionView.
        if type_abonnement not in TYPES_ABONNEMENT_VALIDES:
            return Response({'error': "Type d'abonnement invalide (mensuel, 2_mois, 3_mois, 6_mois ou annuel)."}, status=400)
        if type_utilisateur not in ('standard', 'entreprise'):
            return Response({'error': "Type d'utilisateur invalide (standard ou entreprise)."}, status=400)

        # Vérifier le code
        from comptes.utils import verifier_code_reset
        if not verifier_code_reset(f"abo:{email}", code):
            return Response({'error': 'Code invalide ou expiré. Demandez un nouveau code.'}, status=400)

        user = request.user

        # NOUVEAU — vérification des règles de renouvellement / changement de
        # plan avant toute activation.
        try:
            mode = verifier_regles_renouvellement(user, type_utilisateur, type_abonnement)
        except ValueError as exc:
            return Response({'error': str(exc), 'code': 'renouvellement_refuse'}, status=400)

        # Montant selon plan
        montant = TARIFS.get(type_utilisateur, {}).get(type_abonnement, 500)

        # Activation de l'abonnement via la fonction utilitaire partagée
        abo = activer_abonnement(user, type_utilisateur, type_abonnement, montant, mode=mode)

        # Enregistrer le paiement
        Paiement.objects.create(
            abonnement=abo,
            montant=montant,
            methode='mobile_money',
            statut='confirme',
            reference=f"REF-{user.telephone}-{timezone.now().strftime('%Y%m%d%H%M%S')}",
            type_abonnement_demande=type_abonnement,
            type_utilisateur_demande=type_utilisateur,
            mode_renouvellement=mode,
        )

        enregistrer_log(user, "ABONNEMENT", f"Souscription {type_utilisateur} {type_abonnement} (mode={mode})", request)

        return Response({
            'success': True,
            'message': f"Abonnement {type_utilisateur.capitalize()} {type_abonnement} activé !",
            'abonnement': AbonnementSerializer(abo).data,
        }, status=status.HTTP_201_CREATED)


# ─── DÉTAIL ABONNEMENT ────────────────────────────────────────────────────────
class AbonnementDetailView(generics.RetrieveAPIView):
    serializer_class   = AbonnementSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        try:
            return self.request.user.abonnement
        except Abonnement.DoesNotExist:
            return None

    def retrieve(self, request, *args, **kwargs):
        obj = self.get_object()
        if obj is None:
            return Response({'detail': 'Aucun abonnement.'}, status=404)
        return Response(AbonnementSerializer(obj).data)


# ─── LISTE PAIEMENTS ─────────────────────────────────────────────────────────
class PaiementListView(generics.ListAPIView):
    serializer_class   = PaiementSerializer
    permission_classes = [IsAuthenticated]
    pagination_class   = None

    def get_queryset(self):
        try:
            return self.request.user.abonnement.paiements.all().order_by('-date_paiement')
        except Abonnement.DoesNotExist:
            return Paiement.objects.none()
        
# abonnements/views.py - Ajouter cette classe

class AbonnementStatutView(APIView):
    """
    Vérifie le statut de l'abonnement de l'utilisateur.
    Utilisé par le frontend pour afficher des messages appropriés.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        try:
            abonnement = user.abonnement
            if not abonnement:
                return Response({
                    'statut': 'aucun',
                    'message': 'Vous n\'avez pas d\'abonnement actif.',
                    'plan': None,
                    'est_actif': False,
                    'jours_restants': 0,
                    'redirect_to': '/abonnement'
                })

            est_actif = abonnement.statut == 'actif' and abonnement.date_fin > timezone.now()
            
            # Calcul des jours restants
            if est_actif:
                jours_restants = (abonnement.date_fin - timezone.now()).days
            else:
                jours_restants = 0

            response_data = {
                'statut': abonnement.statut,
                'plan': abonnement.get_plan_nom(),
                'date_debut': abonnement.date_debut,
                'date_fin': abonnement.date_fin,
                'est_actif': est_actif,
                'jours_restants': jours_restants,
                'peut_creer': est_actif,
                'peut_modifier': est_actif,
            }

            if not est_actif:
                response_data['message'] = 'Votre abonnement a expiré. Veuillez le renouveler pour continuer à créer/modifier des données.'
                response_data['redirect_to'] = '/abonnement'
            else:
                response_data['message'] = f'Votre abonnement est actif. {jours_restants} jours restants.'

            return Response(response_data)

        except Exception as e:
            return Response({
                'statut': 'erreur',
                'message': 'Erreur lors de la vérification de l\'abonnement.',
                'est_actif': False,
                'redirect_to': '/abonnement'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PrevisualiserRenouvellementView(APIView):
    """
    GET /abonnements/previsualiser-renouvellement/?type_utilisateur=...&type_abonnement=...
    Retourne {autorise, mode, nouvelle_date_fin, message} sans effet de bord.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        type_utilisateur = request.query_params.get('type_utilisateur', '')
        type_abonnement  = request.query_params.get('type_abonnement', '')

        if type_utilisateur not in ('standard', 'entreprise'):
            return Response({'error': "Type d'utilisateur invalide (standard ou entreprise)."}, status=400)
        if type_abonnement not in TYPES_ABONNEMENT_VALIDES:
            return Response({'error': "Type d'abonnement invalide (mensuel, 2_mois, 3_mois, 6_mois ou annuel)."}, status=400)

        user = request.user
        duree_jours = Abonnement.DUREE_JOURS_MAP.get(type_abonnement, 30)

        try:
            mode = verifier_regles_renouvellement(user, type_utilisateur, type_abonnement)
        except ValueError as exc:
            return Response({
                'autorise': False,
                'mode': None,
                'nouvelle_date_fin': None,
                'message': str(exc),
            })

        maintenant = timezone.now()
        try:
            abo_existant = user.abonnement
        except Abonnement.DoesNotExist:
            abo_existant = None

        if mode == 'prolongation' and abo_existant is not None:
            base = abo_existant.date_fin if abo_existant.date_fin > maintenant else maintenant
            nouvelle_date_fin = base + timedelta(days=duree_jours)
        else:
            nouvelle_date_fin = maintenant + timedelta(days=duree_jours)

        messages_mode = {
            'nouveau':      "Votre abonnement démarrera dès l'activation.",
            'prolongation': "Votre abonnement sera prolongé à partir de sa date de fin actuelle.",
            'changement':   "Votre changement de plan sera appliqué dès l'activation (la date repart d'aujourd'hui).",
        }

        return Response({
            'autorise': True,
            'mode': mode,
            'nouvelle_date_fin': nouvelle_date_fin,
            'message': messages_mode.get(mode, ''),
        })


# ══════════════════════════════════════════════════════════════════════════════
# Flux de paiement avec validation manuelle par l'admin
# ══════════════════════════════════════════════════════════════════════════════

# ─── LISTE DES COMPTES D'ENCAISSEMENT ACTIFS ────────────────────────────────
class ComptesEncaissementView(generics.ListAPIView):

    serializer_class   = CompteEncaissementSerializer
    permission_classes = [IsAuthenticated]
    pagination_class   = None

    def get_queryset(self):
        return CompteEncaissement.objects.filter(actif=True).order_by('methode')



def get_or_create_abonnement_utilisateur(user):

    try:
        abo = user.abonnement
        return abo
    except Abonnement.DoesNotExist:
        plan_essai, _ = Plan.objects.get_or_create(
            nom='essai',
            defaults={
                'prix_mensuel': 0,
                'prix_annuel': 0,
                'nb_categories_max': 5,
                'description': "Période d'essai"
            }
        )
        abo = Abonnement.objects.create(
            utilisateur=user,
            plan=plan_essai,
            statut='expire',
            date_debut=timezone.now(),
            date_fin=timezone.now(),
            montant=0,
            type='mensuel',
            nb_renouvellements=0
        )
        user.abonnement = abo
        user.save(update_fields=['abonnement'])
        return abo


class InitierPaiementView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        user = request.user

        type_abonnement  = request.data.get('type_abonnement', '')
        type_utilisateur = request.data.get('type_utilisateur', '')
        methode          = request.data.get('methode', '')
        capture_ecran    = request.data.get('capture_ecran', None)

        if type_abonnement not in TYPES_ABONNEMENT_VALIDES:
            return Response({'error': "Type d'abonnement invalide (mensuel, 2_mois, 3_mois, 6_mois ou annuel)."}, status=400)
        if type_utilisateur not in ('standard', 'entreprise'):
            return Response({'error': "Type d'utilisateur invalide (standard ou entreprise)."}, status=400)
        
        if methode not in METHODES_MANUELLES:
            return Response({
                'error': "Méthode de paiement invalide (rssbank, sedad, bankily ou masrivi)."
            }, status=400)
        if not capture_ecran:
            return Response({'error': "La capture d'écran de confirmation est obligatoire."}, status=400)

        abo = get_or_create_abonnement_utilisateur(user)
        deja_en_attente = Paiement.objects.filter(
            abonnement__utilisateur=user, statut='en_attente'
        ).exists()
        if deja_en_attente:
            return Response({
                'error': "Vous avez déjà une demande en attente de validation.",
                'code': 'paiement_deja_en_attente',
            }, status=400)

        # NOUVEAU — vérification des règles de renouvellement / changement de
        # plan AVANT toute création de Paiement.
        try:
            mode = verifier_regles_renouvellement(user, type_utilisateur, type_abonnement)
        except ValueError as exc:
            return Response({'error': str(exc), 'code': 'renouvellement_refuse'}, status=400)

        # Calcul du montant selon TARIFS existant
        montant = TARIFS.get(type_utilisateur, {}).get(type_abonnement, 500)

        paiement = Paiement.objects.create(
            abonnement=abo,
            montant=montant,
            methode=methode,
            statut='en_attente',
            reference=f"REQ-{user.telephone}-{timezone.now().strftime('%Y%m%d%H%M%S')}",
            capture_ecran=capture_ecran,
            type_abonnement_demande=type_abonnement,
            type_utilisateur_demande=type_utilisateur,
            mode_renouvellement=mode,
        )

        from notifications.models import Notification
        Notification.objects.create(
            utilisateur=user,
            type='abonnement_attente',
            message=(
                f"ABONNEMENT_EN_ATTENTE|"
                f"plan:{type_utilisateur.capitalize()}|"
                f"type:{type_abonnement.capitalize()}|"
                f"methode:{methode}|"
                f"montant:{montant}|"
                f"date:{timezone.now().strftime('%d/%m/%Y')}"
            ),
        )

        enregistrer_log(
            user, "ABONNEMENT",
            f"Demande de paiement initiée ({type_utilisateur} {type_abonnement} via {methode}, mode={mode})",
            request,
        )

        return Response({
            'success': True,
            'message': "Votre abonnement est en attente de validation par notre équipe.",
            'paiement': PaiementSerializer(paiement).data,
        }, status=status.HTTP_201_CREATED)


# ─── STATUT DU PAIEMENT EN COURS (en_attente OU refusé) ─────────────────────
class StatutPaiementEnCoursView(APIView):
    """
    Retourne le dernier Paiement de l'utilisateur s'il est au statut 'en_attente'
    ou 'refuse', afin que le frontend puisse afficher :
      - "Demande en cours" si en_attente (méthode manuelle OU TrackPay)
      - la raison du refus si refuse (et aucun en_attente plus récent)
      - rien si le dernier paiement pertinent est confirmé / inexistant
    Ne touche à aucune vue existante.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        # Priorité à un paiement en_attente (la règle centrale garantit qu'il n'y en a qu'un)
        paiement_en_attente = Paiement.objects.filter(
            abonnement__utilisateur=user, statut='en_attente'
        ).order_by('-date_paiement').first()

        if paiement_en_attente:
            return Response({
                'etat': 'en_attente',
                'paiement': PaiementSerializer(paiement_en_attente).data,
            })

        # Sinon, le dernier paiement refusé (le plus récent, peu importe les confirmés plus anciens)
        dernier_paiement = Paiement.objects.filter(
            abonnement__utilisateur=user
        ).order_by('-date_paiement').first()

        if dernier_paiement and dernier_paiement.statut == 'refuse':
            return Response({
                'etat': 'refuse',
                'paiement': PaiementSerializer(dernier_paiement).data,
            })

        return Response({
            'etat': 'aucun',
            'paiement': None,
        })


# ══════════════════════════════════════════════════════════════════════════════
# NOUVEAU — Flux de paiement automatique via TrackPay
# ══════════════════════════════════════════════════════════════════════════════

# ─── INITIER UN PAIEMENT TRACKPAY (automatique) ─────────────────────────────
class InitierPaiementTrackPayView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        from .trackpay_service import get_plan_id, creer_paiement_trackpay, TrackPayError

        user = request.user

        type_abonnement  = request.data.get('type_abonnement', '')
        type_utilisateur = request.data.get('type_utilisateur', '')

        # Mêmes validations que pour le flux manuel
        # NOUVEAU — type_abonnement accepte désormais les 5 durées.
        if type_abonnement not in TYPES_ABONNEMENT_VALIDES:
            return Response({'error': "Type d'abonnement invalide (mensuel, 2_mois, 3_mois, 6_mois ou annuel)."}, status=400)
        if type_utilisateur not in ('standard', 'entreprise'):
            return Response({'error': "Type d'utilisateur invalide (standard ou entreprise)."}, status=400)

        abo = get_or_create_abonnement_utilisateur(user)

        # ── Règle centrale : un seul Paiement 'en_attente' à la fois ────────
        deja_en_attente = Paiement.objects.filter(
            abonnement__utilisateur=user, statut='en_attente'
        ).exists()
        if deja_en_attente:
            return Response({
                'error': "Vous avez déjà une demande en attente de validation.",
                'code': 'paiement_deja_en_attente',
            }, status=400)

        # NOUVEAU — vérification des règles de renouvellement / changement de
        # plan AVANT toute création de Paiement / appel réseau à TrackPay.
        try:
            mode = verifier_regles_renouvellement(user, type_utilisateur, type_abonnement)
        except ValueError as exc:
            return Response({'error': str(exc), 'code': 'renouvellement_refuse'}, status=400)

        # Résolution du plan_id TrackPay correspondant
        plan_id = get_plan_id(type_utilisateur, type_abonnement)
        if not plan_id:
            return Response({
                'error': "Configuration TrackPay manquante pour ce plan. Veuillez contacter le support."
            }, status=500)

        montant = TARIFS.get(type_utilisateur, {}).get(type_abonnement, 500)

        # Référence unique pour relier ce Paiement au webhook qui reviendra
        reference_trackpay = f"TP-{user.id}-{timezone.now().strftime('%Y%m%d%H%M%S')}"

        # Création du Paiement en_attente AVANT l'appel à TrackPay : si l'appel
        # réseau échoue, on supprime le Paiement créé pour ne pas laisser une
        # demande fantôme bloquer la règle "un seul en_attente à la fois".
        paiement = Paiement.objects.create(
            abonnement=abo,
            montant=montant,
            methode='trackpay',
            statut='en_attente',
            reference=reference_trackpay,
            reference_trackpay=reference_trackpay,
            type_abonnement_demande=type_abonnement,
            type_utilisateur_demande=type_utilisateur,
            mode_renouvellement=mode,
        )


        from django.conf import settings as dj_settings
        callback_url = f"{dj_settings.TRACKPAY_CALLBACK_BASE_URL}/api/abonnements/webhook-trackpay/"

        try:
            payment_url = creer_paiement_trackpay(
                plan_id=plan_id,
                callback_url=callback_url,
                reference=reference_trackpay,
            )
        except TrackPayError as exc:
            # On annule la demande en_attente créée juste avant, pour ne pas
            # bloquer l'utilisateur avec une demande qui n'a jamais démarré.
            paiement.delete()
            return Response({
                'error': "Impossible de contacter TrackPay pour le moment. Veuillez réessayer.",
                'detail': str(exc),
            }, status=502)

        enregistrer_log(
            user, "ABONNEMENT",
            f"Paiement TrackPay initié ({type_utilisateur} {type_abonnement}, mode={mode})",
            request,
        )

        return Response({
            'success': True,
            'payment_url': payment_url,
            'paiement': PaiementSerializer(paiement).data,
        }, status=status.HTTP_201_CREATED)


# ─── WEBHOOK TRACKPAY (réception du résultat, activation automatique) ──────
class TrackPayWebhookView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        from .trackpay_service import verifier_signature_webhook

        if not verifier_signature_webhook(request):
            return Response({'error': 'Signature invalide.'}, status=403)

        data = request.data
        reference = data.get('reference', '')
        statut_trackpay = data.get('status', '')

        if not reference:
            # On répond 200 quand même : TrackPay ne doit pas reessayer
            # indéfiniment sur une charge utile malformée de son côté.
            return Response({'detail': 'reference manquante.'}, status=200)

        paiement = Paiement.objects.filter(
            methode='trackpay', reference_trackpay=reference
        ).order_by('-date_paiement').first()

        if not paiement:
            return Response({'detail': 'Paiement introuvable pour cette référence.'}, status=200)

        # Idempotence : si ce paiement a déjà été traité (confirme/echoue/refuse),
        # on ne refait rien, même si TrackPay renvoie le webhook plusieurs fois.
        if paiement.statut != 'en_attente':
            return Response({'detail': 'Paiement déjà traité.'}, status=200)

        if statut_trackpay == 'COMPLETED':
            user = paiement.abonnement.utilisateur
            type_utilisateur = paiement.type_utilisateur_demande
            type_abonnement  = paiement.type_abonnement_demande

            if type_utilisateur not in ('standard', 'entreprise') or type_abonnement not in TYPES_ABONNEMENT_VALIDES:
                # Données incohérentes côté Paiement : on marque échoué plutôt
                # que d'activer un abonnement avec des valeurs invalides.
                paiement.statut = 'echoue'
                paiement.date_validation = timezone.now()
                paiement.save()
                return Response({'detail': 'type_utilisateur_demande/type_abonnement_demande invalide.'}, status=200)

            montant = TARIFS.get(type_utilisateur, {}).get(type_abonnement, paiement.montant)

            # NOUVEAU — applique le mode figé au moment de la demande
            # (mode_renouvellement), au lieu de recalculer ici.
            activer_abonnement(user, type_utilisateur, type_abonnement, montant, mode=paiement.mode_renouvellement)

            paiement.statut = 'confirme'
            paiement.date_validation = timezone.now()
            paiement.save()

            enregistrer_log(
                user, "ABONNEMENT",
                f"Paiement TrackPay confirmé ({type_utilisateur} {type_abonnement}, mode={paiement.mode_renouvellement})",
                request,
            )
        else:
            # Tout statut différent de COMPLETED (FAILED, CANCELLED, etc.)
            # est traité comme un échec : l'Abonnement existant n'est pas touché.
            paiement.statut = 'echoue'
            paiement.date_validation = timezone.now()
            paiement.save()

            from notifications.models import Notification
            Notification.objects.create(
                utilisateur=paiement.abonnement.utilisateur,
                type='abonnement_refuse',
                message=(
                    f"ABONNEMENT_PAIEMENT_ECHOUE|"
                    f"plan:{(paiement.type_utilisateur_demande or '').capitalize()}|"
                    f"type:{(paiement.type_abonnement_demande or '').capitalize()}|"
                    f"methode:trackpay|"
                    f"date:{timezone.now().strftime('%d/%m/%Y')}"
                ),
            )

        # Toujours répondre 200 rapidement, comme attendu par la doc TrackPay,
        # pour éviter des réessais inutiles côté TrackPay.
        return Response({'detail': 'ok'}, status=200)