from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from django.utils import timezone
from datetime import timedelta
from .models import Abonnement, Paiement, Plan
from .serializers import AbonnementSerializer, SouscriptionSerializer, PaiementSerializer, PlanSerializer
from logs.utils import enregistrer_log


# ─── PRIX selon type utilisateur et durée ────────────────────────────────────
TARIFS = {
    'standard':   {'mensuel': 500,  'annuel': 5000},
    'entreprise': {'mensuel': 2000, 'annuel': 20000},
}


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
                abo_essai.save()
                
                # Mettre à jour la relation OneToOne sur l'utilisateur
                user.abonnement = abo_essai
                user.save(update_fields=['abonnement'])
                
                # Notification d'expiration
                from notifications.models import Notification
                Notification.objects.create(
                    utilisateur=user,
                    type='warning',
                    message=f"ABONNEMENT EXPIRE|Votre abonnement {abo.get_plan_nom()} est expiré. Retour à votre essai gratuit."
                )
                
                return True
    except Abonnement.DoesNotExist:
        pass
    return False

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
        if type_abonnement not in ('mensuel', 'annuel'):
            return Response({'error': "Type d'abonnement invalide (mensuel ou annuel)."}, status=400)
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
                'error': "Impossible d'envoyer le code par email. Vérifiez la configuration SMTP."
            }, status=500)

        return Response({
            'message': f"Code envoyé à {email}. Valable 5 minutes.",
            'montant': montant,
            'type_abonnement': type_abonnement,
            'type_utilisateur': type_utilisateur,
        })


# ─── SOUSCRIPTION (avec vérification du code) ────────────────────────────────
class SouscriptionView(APIView):
    """
    Étape 2 : l'utilisateur saisit le code reçu par email.
    Si valide, l'abonnement est créé/mis à jour.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        email            = request.data.get('email', '').strip().lower()
        code             = request.data.get('code_confirmation', '').strip()
        type_abonnement  = request.data.get('type_abonnement', '')
        type_utilisateur = request.data.get('type_utilisateur', '')
        if not all([email, code, type_abonnement, type_utilisateur]):
            return Response({'error': 'Tous les champs sont obligatoires.'}, status=400)

        # Vérifier le code
        from comptes.utils import verifier_code_reset
        if not verifier_code_reset(f"abo:{email}", code):
            return Response({'error': 'Code invalide ou expiré. Demandez un nouveau code.'}, status=400)

        user = request.user

        # Montant selon plan
        montant = TARIFS.get(type_utilisateur, {}).get(type_abonnement, 500)

        # Durée
        date_debut = timezone.now()
        if type_abonnement == 'mensuel':
            date_fin = date_debut + timedelta(days=30)
        else:
            date_fin = date_debut + timedelta(days=365)

        # Récupérer ou créer le plan
        plans_defaults = {
            'standard':   {'prix_mensuel': 500,  'prix_annuel': 5000,  'nb_categories_max': 50,  'description': 'Plan Standard'},
            'entreprise': {'prix_mensuel': 2000, 'prix_annuel': 20000, 'nb_categories_max': 200, 'description': 'Plan Entreprise'},
        }
        plan = _get_or_create_plan(type_utilisateur, plans_defaults[type_utilisateur])

        # Créer ou mettre à jour l'abonnement
        abo, created = Abonnement.objects.update_or_create(
            utilisateur=user,
            defaults={
                'plan':       plan,
                'type':       type_abonnement,
                'date_debut': date_debut,
                'date_fin':   date_fin,
                'statut':     'actif',
                'montant':    montant,
            }
        )

        # Enregistrer le paiement
        Paiement.objects.create(
            abonnement=abo,
            montant=montant,
            methode='mobile_money',
            statut='confirme',
            reference=f"REF-{user.telephone}-{timezone.now().strftime('%Y%m%d%H%M%S')}",
        )

        # Mettre à jour le rôle utilisateur
        ancien_role = user.role
        user.role   = type_utilisateur
        user.save(update_fields=['role'])

        # Notification
        '''        
        from notifications.models import Notification
        Notification.objects.create(
            utilisateur=user,
            type='info',
            message=(
                f"✅ Abonnement {type_utilisateur.capitalize()} {type_abonnement} activé avec succès !\n"
                f"📅 Début : {date_debut.strftime('%d/%m/%Y')}\n"
                f"📅 Fin   : {date_fin.strftime('%d/%m/%Y')}\n"
                f"💰 Montant : {montant} MRU\n"
                f"⏳ Durée : {'30 jours' if type_abonnement == 'mensuel' else '365 jours'}"
            ),
        )'''
        from notifications.models import Notification

        duree_label = "30 jours" if type_abonnement == "mensuel" else "365 jours"

        Notification.objects.create(
            utilisateur=user,
            type='info',
            message=(
                f"ABONNEMENT_ACTIVE|"
                f"plan:{type_utilisateur.capitalize()}|"
                f"type:{type_abonnement.capitalize()}|"
                f"debut:{date_debut.strftime('%d/%m/%Y')}|"
                f"fin:{date_fin.strftime('%d/%m/%Y')}|"
                f"montant:{montant}|"
                f"duree:{duree_label}"
            ),
        )

        enregistrer_log(user, "ABONNEMENT", f"Souscription {type_utilisateur} {type_abonnement}", request)

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