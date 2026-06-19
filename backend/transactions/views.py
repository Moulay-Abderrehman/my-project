from rest_framework import generics, filters, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import PermissionDenied, ValidationError
from django.db.models import Sum, Q
from django.utils import timezone
from abonnements.permissions import EstAbonne, LimiteEssaiQuotidienne
from logs.utils import enregistrer_log
from .models import Transaction, Solde, Categorie
from .serializers import TransactionSerializer, SoldeSerializer, CategorieSerializer


class TransactionListCreateView(generics.ListCreateAPIView):
    """
    Liste et création des transactions.
    - Lecture : accessible même si abonnement expiré (via EstAbonne)
    - Création : nécessite un abonnement actif
    """
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated, EstAbonne, LimiteEssaiQuotidienne]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['description', 'categorie__nom']
    ordering_fields = ['date_creation', 'montant']

    def get_queryset(self):
        qs = Transaction.objects.filter(
            utilisateur=self.request.user, 
            is_visible=True, 
            source='manuel'
        )
        type_filtre = self.request.query_params.get('type')
        categorie_filtre = self.request.query_params.get('categorie')
        if type_filtre:
            qs = qs.filter(type=type_filtre)
        if categorie_filtre:
            qs = qs.filter(categorie__id=categorie_filtre)
        return qs

    def perform_create(self, serializer):
        user = self.request.user
        
        # ✅ Vérification explicite pour la création
        try:
            abo = user.abonnement
            if not abo:
                raise PermissionDenied({
                    'error': 'abonnement_requis',
                    'message': 'Vous devez avoir un abonnement pour créer des transactions.',
                    'redirect_to': '/abonnement'
                })
            
            if abo.statut != 'actif' or abo.date_fin <= timezone.now():
                raise PermissionDenied({
                    'error': 'abonnement_expire',
                    'message': 'Votre abonnement a expiré. Vous ne pouvez pas créer de nouvelles transactions.',
                    'redirect_to': '/abonnement'
                })
                
        except PermissionDenied:
            raise
        except Exception:
            raise PermissionDenied({
                'error': 'abonnement_requis',
                'message': 'Vous devez avoir un abonnement actif pour créer des transactions.',
                'redirect_to': '/abonnement'
            })
        
        transaction = serializer.save(utilisateur=user, source='manuel', is_visible=True)
        enregistrer_log(
            user, "TRANSACTION",
            f"Création: {transaction.type} {transaction.montant} MRU", self.request
        )


class TransactionDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Détail, modification et suppression d'une transaction.
    - Lecture : accessible même si abonnement expiré (via EstAbonne)
    - Modification/Suppression : nécessite un abonnement actif
    """
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated, EstAbonne]

    def get_queryset(self):
        return Transaction.objects.filter(
            utilisateur=self.request.user, 
            is_visible=True, 
            source='manuel'
        )

    def perform_update(self, serializer):
        user = self.request.user
        
        # ✅ Vérification explicite pour la modification
        try:
            abo = user.abonnement
            if not abo:
                raise PermissionDenied({
                    'error': 'abonnement_requis',
                    'message': 'Vous devez avoir un abonnement pour modifier des transactions.',
                    'redirect_to': '/abonnement'
                })
            
            if abo.statut != 'actif' or abo.date_fin <= timezone.now():
                raise PermissionDenied({
                    'error': 'abonnement_expire',
                    'message': 'Votre abonnement a expiré. Vous ne pouvez pas modifier de transactions.',
                    'redirect_to': '/abonnement'
                })
                
        except PermissionDenied:
            raise
        except Exception:
            raise PermissionDenied({
                'error': 'abonnement_requis',
                'message': 'Vous devez avoir un abonnement actif pour modifier des transactions.',
                'redirect_to': '/abonnement'
            })
        
        serializer.save()
        enregistrer_log(user, "TRANSACTION", f"Modification: {serializer.instance.id}", self.request)

    def destroy(self, request, *args, **kwargs):
        user = request.user
        
        # ✅ Vérification explicite pour la suppression
        try:
            abo = user.abonnement
            if not abo:
                raise PermissionDenied({
                    'error': 'abonnement_requis',
                    'message': 'Vous devez avoir un abonnement pour supprimer des transactions.',
                    'redirect_to': '/abonnement'
                })
            
            if abo.statut != 'actif' or abo.date_fin <= timezone.now():
                raise PermissionDenied({
                    'error': 'abonnement_expire',
                    'message': 'Votre abonnement a expiré. Vous ne pouvez pas supprimer de transactions.',
                    'redirect_to': '/abonnement'
                })
                
        except PermissionDenied:
            raise
        except Exception:
            raise PermissionDenied({
                'error': 'abonnement_requis',
                'message': 'Vous devez avoir un abonnement actif pour supprimer des transactions.',
                'redirect_to': '/abonnement'
            })
        
        transaction = self.get_object()
        transaction.is_visible = False
        transaction.save()
        enregistrer_log(user, "TRANSACTION", f"Suppression (soft): {transaction.id}", request)
        return Response(status=status.HTTP_204_NO_CONTENT)


class ToutesTransactionsView(generics.ListAPIView):
    """
    Vue pour voir toutes les transactions (lecture seule).
    ✅ Accessible même si l'abonnement est expiré (via EstAbonne).
    """
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated, EstAbonne]
    pagination_class = None

    def get_queryset(self):
        return Transaction.objects.filter(utilisateur=self.request.user)


class SoldeView(generics.RetrieveAPIView):
    """
    Récupération du solde de l'utilisateur.
    ✅ Accessible même si l'abonnement est expiré (via EstAbonne).
    """
    serializer_class = SoldeSerializer
    permission_classes = [IsAuthenticated, EstAbonne]

    def get_object(self):
        solde, _ = Solde.objects.get_or_create(utilisateur=self.request.user)
        return solde


class DashboardView(APIView):
    """
    Dashboard avec statistiques et informations.
    ✅ Accessible même si l'abonnement est expiré (via EstAbonne).
    """
    permission_classes = [IsAuthenticated, EstAbonne]

    def get(self, request):
        from django.db.models.functions import TruncMonth

        transactions = Transaction.objects.filter(utilisateur=request.user)

        # ── Infos essai + limites quotidiennes ───────────────────────────────
        try:
            abo = request.user.abonnement
            en_essai = abo.get_plan_nom() == 'essai' if abo else False
        except Exception:
            en_essai = False

        info_essai = None
        if en_essai:
            aujourd_hui = timezone.now().date()
            nb_trans_jour = Transaction.objects.filter(
                utilisateur=request.user, source='manuel', date__date=aujourd_hui
            ).count()
            from budgets.models import Budget
            nb_budgets_jour = Budget.objects.filter(
                utilisateur=request.user, date_creation__date=aujourd_hui
            ).count()
            info_essai = {
                'transactions_aujourd_hui': nb_trans_jour,
                'transactions_limite_jour': 5,
                'budgets_aujourd_hui': nb_budgets_jour,
                'budgets_limite_jour': 2,
                'transactions_restantes_jour': max(0, 5 - nb_trans_jour),
                'budgets_restants_jour': max(0, 2 - nb_budgets_jour),
            }

        par_mois = (
            transactions
            .annotate(mois=TruncMonth('date_creation'))
            .values('mois', 'type')
            .annotate(total=Sum('montant'))
            .order_by('mois')
        )
        par_categorie = (
            transactions.filter(type='sortie')
            .values('categorie__nom', 'categorie__couleur')
            .annotate(total=Sum('montant'))
            .order_by('-total')
        )

        solde, _ = Solde.objects.get_or_create(utilisateur=request.user)

        toutes = transactions.order_by('date_creation')
        evolution = []
        cumul = 0
        for t in toutes:
            cumul += float(t.montant) if t.type == 'entree' else -float(t.montant)
            evolution.append({
                'date': t.date_creation,
                'solde': round(cumul, 2),
                'type': t.type,
                'montant': float(t.montant),
                'description': t.description
            })

        dernieres_5 = Transaction.objects.filter(
            utilisateur=request.user, is_visible=True, source='manuel'
        ).order_by('-date_creation')[:5]

        from budgets.models import Budget
        from budgets.serializers import BudgetSerializer
        derniers_budgets = Budget.objects.filter(
            utilisateur=request.user, est_actif=True
        ).order_by('-date_creation')[:4]

        # ✅ Vérifier le statut de l'abonnement pour le frontend
        abonnement_expire = False
        abonnement_info = None
        try:
            abo = request.user.abonnement
            if abo:
                abonnement_expire = abo.statut == 'expire' or abo.date_fin <= timezone.now()
                abonnement_info = {
                    'statut': abo.statut,
                    'plan': abo.get_plan_nom(),
                    'date_fin': abo.date_fin,
                    'est_actif': abo.est_actif(),
                    'jours_restants': (abo.date_fin - timezone.now()).days if abo.est_actif() else 0
                }
        except Exception:
            pass

        return Response({
            'solde': SoldeSerializer(solde).data,
            'par_mois': list(par_mois),
            'par_categorie': list(par_categorie),
            'evolution_solde': evolution,
            'dernieres_transactions': TransactionSerializer(dernieres_5, many=True).data,
            'derniers_budgets': BudgetSerializer(derniers_budgets, many=True).data,
            'nombre_transactions': transactions.count(),
            'info_essai': info_essai,
            'abonnement_expire': abonnement_expire,  # ✅ Indicateur pour le frontend
            'abonnement_info': abonnement_info,      # ✅ Informations complètes
        })


class CategorieListCreateView(generics.ListCreateAPIView):
    """
    Liste et création des catégories.
    - Lecture : accessible à tous les utilisateurs authentifiés
    - Création : nécessite un abonnement Standard ou Entreprise (non essai)
    """
    serializer_class = CategorieSerializer
    permission_classes = [IsAuthenticated]  # La vérification est faite dans perform_create
    pagination_class = None

    def get_queryset(self):
        return Categorie.objects.filter(
            Q(utilisateur__isnull=True) | Q(utilisateur=self.request.user),
            is_visible=True,
        ).order_by('utilisateur', 'nom')

    def perform_create(self, serializer):
        user = self.request.user
        
        # ✅ Vérification complète de l'abonnement pour la création
        try:
            abo = user.abonnement
            if not abo:
                raise PermissionDenied({
                    'error': 'abonnement_requis',
                    'message': 'Vous devez avoir un abonnement pour créer des catégories.',
                    'redirect_to': '/abonnement'
                })

            if abo.statut != 'actif' or abo.date_fin <= timezone.now():
                raise PermissionDenied({
                    'error': 'abonnement_expire',
                    'message': 'Votre abonnement a expiré. Vous ne pouvez pas créer de catégories.',
                    'redirect_to': '/abonnement'
                })

            plan_nom = abo.get_plan_nom()
            if plan_nom == 'essai':
                raise PermissionDenied({
                    'error': 'abonnement_essai',
                    'message': 'La création de catégories personnalisées n\'est pas disponible en période d\'essai. Passez à un plan Standard ou Entreprise.',
                    'redirect_to': '/abonnement'
                })

            # Vérifier la limite de catégories
            nb_max = abo.nb_categories_autorisees()
            if nb_max != -1:
                nb_actuel = Categorie.objects.filter(utilisateur=user, is_visible=True).count()
                if nb_actuel >= nb_max:
                    raise PermissionDenied({
                        'error': 'limite_categories',
                        'message': f'Limite de {nb_max} catégories atteinte. Passez à un plan supérieur.',
                        'redirect_to': '/abonnement'
                    })

        except PermissionDenied:
            raise
        except Exception as e:
            raise PermissionDenied({
                'error': 'abonnement_requis',
                'message': 'Vous devez avoir un abonnement actif pour créer des catégories.',
                'redirect_to': '/abonnement'
            })

        serializer.save(utilisateur=user)
        enregistrer_log(user, "CATEGORIE", f"Création : {serializer.validated_data.get('nom')}", self.request)


class CategorieDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Détail, modification et suppression d'une catégorie.
    - Lecture : accessible à tous les utilisateurs authentifiés
    - Modification/Suppression : nécessite un abonnement Standard ou Entreprise
    """
    serializer_class = CategorieSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Categorie.objects.filter(utilisateur=self.request.user, is_visible=True)

    def perform_update(self, serializer):
        user = self.request.user
        
        # ✅ Vérification pour la modification
        try:
            abo = user.abonnement
            if not abo:
                raise PermissionDenied({
                    'error': 'abonnement_requis',
                    'message': 'Vous devez avoir un abonnement pour modifier des catégories.',
                    'redirect_to': '/abonnement'
                })

            if abo.statut != 'actif' or abo.date_fin <= timezone.now():
                raise PermissionDenied({
                    'error': 'abonnement_expire',
                    'message': 'Votre abonnement a expiré. Vous ne pouvez pas modifier de catégories.',
                    'redirect_to': '/abonnement'
                })

            plan_nom = abo.get_plan_nom()
            if plan_nom == 'essai':
                raise PermissionDenied({
                    'error': 'abonnement_essai',
                    'message': 'La modification de catégories personnalisées n\'est pas disponible en période d\'essai.',
                    'redirect_to': '/abonnement'
                })

        except PermissionDenied:
            raise
        except Exception:
            raise PermissionDenied({
                'error': 'abonnement_requis',
                'message': 'Vous devez avoir un abonnement actif pour modifier des catégories.',
                'redirect_to': '/abonnement'
            })
        
        serializer.save()
        enregistrer_log(user, "CATEGORIE", f"Modification : {serializer.instance.nom}", self.request)

    def destroy(self, request, *args, **kwargs):
        user = request.user
        
        # ✅ Vérification pour la suppression
        try:
            abo = user.abonnement
            if not abo:
                raise PermissionDenied({
                    'error': 'abonnement_requis',
                    'message': 'Vous devez avoir un abonnement pour supprimer des catégories.',
                    'redirect_to': '/abonnement'
                })

            if abo.statut != 'actif' or abo.date_fin <= timezone.now():
                raise PermissionDenied({
                    'error': 'abonnement_expire',
                    'message': 'Votre abonnement a expiré. Vous ne pouvez pas supprimer de catégories.',
                    'redirect_to': '/abonnement'
                })

            plan_nom = abo.get_plan_nom()
            if plan_nom == 'essai':
                raise PermissionDenied({
                    'error': 'abonnement_essai',
                    'message': 'La suppression de catégories personnalisées n\'est pas disponible en période d\'essai.',
                    'redirect_to': '/abonnement'
                })

        except PermissionDenied:
            raise
        except Exception:
            raise PermissionDenied({
                'error': 'abonnement_requis',
                'message': 'Vous devez avoir un abonnement actif pour supprimer des catégories.',
                'redirect_to': '/abonnement'
            })
        
        categorie = self.get_object()
        categorie.is_visible = False
        categorie.save()
        enregistrer_log(user, "CATEGORIE", f"Suppression : {categorie.nom}", request)
        return Response(status=status.HTTP_204_NO_CONTENT)


# ✅ NOUVEAU ENDPOINT : Vérification du statut de l'abonnement
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
                    'peut_creer': False,
                    'peut_modifier': False,
                    'can_create_categories': False,
                    'redirect_to': '/abonnement'
                })

            est_actif = abonnement.statut == 'actif' and abonnement.date_fin > timezone.now()
            jours_restants = (abonnement.date_fin - timezone.now()).days if est_actif else 0
            plan_nom = abonnement.get_plan_nom()
            est_plan_payant = plan_nom in ('standard', 'entreprise')

            return Response({
                'statut': abonnement.statut,
                'plan': plan_nom,
                'date_debut': abonnement.date_debut,
                'date_fin': abonnement.date_fin,
                'est_actif': est_actif,
                'jours_restants': jours_restants,
                'peut_creer': est_actif,
                'peut_modifier': est_actif,
                'can_create_categories': est_actif and est_plan_payant,
                'est_plan_payant': est_plan_payant,
                'message': f'Votre abonnement est {"actif" if est_actif else "expiré"}. {jours_restants if est_actif else 0} jours restants.',
                'redirect_to': '/abonnement' if not est_actif else None
            })

        except Exception as e:
            return Response({
                'statut': 'erreur',
                'message': 'Erreur lors de la vérification de l\'abonnement.',
                'est_actif': False,
                'redirect_to': '/abonnement'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)