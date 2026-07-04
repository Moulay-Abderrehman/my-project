# backend/transactions/views.py
from rest_framework import generics, filters, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import PermissionDenied, ValidationError
from django.db.models import Sum, Q
from django.utils import timezone
from abonnements.permissions import EstAbonne, LimiteEssaiQuotidienne, EstVisiteur, AccesComplet
from logs.utils import enregistrer_log
from .models import Transaction, Solde, Categorie
from .serializers import TransactionSerializer, SoldeSerializer, CategorieSerializer


class TransactionListCreateView(generics.ListCreateAPIView):
    """
    Liste et création des transactions.
    - Lecture : accessible même si abonnement expiré ou en mode visiteur (via EstVisiteur)
    - Création : nécessite un abonnement actif (via AccesComplet)
    """
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated, EstVisiteur, LimiteEssaiQuotidienne]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['description', 'categorie__nom']
    ordering_fields = ['date_creation', 'montant']

    def get_queryset(self):
        user = self.request.user
        
        # 🆕 Si l'utilisateur est en mode visiteur, retourner des données mock
        if hasattr(user, 'est_visiteur') and user.est_visiteur:
            from abonnements.mock_data import MOCK_TRANSACTIONS
            return MOCK_TRANSACTIONS
        
        qs = Transaction.objects.filter(
            utilisateur=user, 
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
        
        # 🆕 Vérification du mode visiteur AVANT toute création
        if hasattr(user, 'est_visiteur') and user.est_visiteur:
            raise PermissionDenied({
                'error': 'mode_visiteur',
                'message': '🔍 Mode Exploration : Créez un compte pour ajouter des transactions.',
                'redirect_to': '/inscription',
                'visitor_mode': True
            })
        
        # Vérification standard de l'abonnement
        try:
            abo = user.abonnement
            if not abo:
                raise PermissionDenied({
                    'error': 'abonnement_requis',
                    'message': 'Vous devez avoir un abonnement pour créer des transactions.',
                    'redirect_to': '/abonnement'
                })
            
            # 🆕 Vérifier si c'est un abonnement de démonstration
            if abo.est_demo_mode():
                raise PermissionDenied({
                    'error': 'mode_visiteur',
                    'message': '🔍 Mode Exploration : Créez un compte pour ajouter des transactions.',
                    'redirect_to': '/inscription',
                    'visitor_mode': True
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
    - Lecture : accessible même si abonnement expiré ou en mode visiteur (via EstVisiteur)
    - Modification/Suppression : nécessite un abonnement actif (via AccesComplet)
    """
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated, EstVisiteur]

    def get_queryset(self):
        user = self.request.user
        
        # 🆕 Si l'utilisateur est en mode visiteur, retourner des données mock
        if hasattr(user, 'est_visiteur') and user.est_visiteur:
            from abonnements.mock_data import MOCK_TRANSACTIONS
            return MOCK_TRANSACTIONS
        
        return Transaction.objects.filter(
            utilisateur=user, 
            is_visible=True, 
            source='manuel'
        )

    def perform_update(self, serializer):
        user = self.request.user
        
        # 🆕 Vérification du mode visiteur
        if hasattr(user, 'est_visiteur') and user.est_visiteur:
            raise PermissionDenied({
                'error': 'mode_visiteur',
                'message': '🔍 Mode Exploration : Créez un compte pour modifier des transactions.',
                'redirect_to': '/inscription',
                'visitor_mode': True
            })
        
        # Vérification standard de l'abonnement
        try:
            abo = user.abonnement
            if not abo:
                raise PermissionDenied({
                    'error': 'abonnement_requis',
                    'message': 'Vous devez avoir un abonnement pour modifier des transactions.',
                    'redirect_to': '/abonnement'
                })
            
            # 🆕 Vérifier si c'est un abonnement de démonstration
            if abo.est_demo_mode():
                raise PermissionDenied({
                    'error': 'mode_visiteur',
                    'message': '🔍 Mode Exploration : Créez un compte pour modifier des transactions.',
                    'redirect_to': '/inscription',
                    'visitor_mode': True
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

    def perform_destroy(self, instance):
        user = self.request.user
        
        # 🆕 Vérification du mode visiteur
        if hasattr(user, 'est_visiteur') and user.est_visiteur:
            raise PermissionDenied({
                'error': 'mode_visiteur',
                'message': '🔍 Mode Exploration : Créez un compte pour supprimer des transactions.',
                'redirect_to': '/inscription',
                'visitor_mode': True
            })
        
        # Vérification standard de l'abonnement
        try:
            abo = user.abonnement
            if not abo:
                raise PermissionDenied({
                    'error': 'abonnement_requis',
                    'message': 'Vous devez avoir un abonnement pour supprimer des transactions.',
                    'redirect_to': '/abonnement'
                })
            
            # 🆕 Vérifier si c'est un abonnement de démonstration
            if abo.est_demo_mode():
                raise PermissionDenied({
                    'error': 'mode_visiteur',
                    'message': '🔍 Mode Exploration : Créez un compte pour supprimer des transactions.',
                    'redirect_to': '/inscription',
                    'visitor_mode': True
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
        
        instance.is_visible = False
        instance.save()
        enregistrer_log(user, "TRANSACTION", f"Suppression (soft): {instance.id}", self.request)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)


class ToutesTransactionsView(generics.ListAPIView):
    """
    Vue pour voir toutes les transactions (lecture seule).
    ✅ Accessible même si l'abonnement est expiré ou en mode visiteur (via EstVisiteur).
    """
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated, EstVisiteur]
    pagination_class = None

    def get_queryset(self):
        user = self.request.user
        
        # 🆕 Si l'utilisateur est en mode visiteur, retourner des données mock
        if hasattr(user, 'est_visiteur') and user.est_visiteur:
            from abonnements.mock_data import MOCK_TRANSACTIONS
            return MOCK_TRANSACTIONS
        
        return Transaction.objects.filter(utilisateur=user)


class SoldeView(generics.RetrieveAPIView):
    """
    Récupération du solde de l'utilisateur.
    ✅ Accessible même si l'abonnement est expiré ou en mode visiteur (via EstVisiteur).
    """
    serializer_class = SoldeSerializer
    permission_classes = [IsAuthenticated, EstVisiteur]

    def get_object(self):
        user = self.request.user
        
        # 🆕 Si l'utilisateur est en mode visiteur, retourner des données mock
        if hasattr(user, 'est_visiteur') and user.est_visiteur:
            from abonnements.mock_data import MOCK_STATS
            # Créer un objet factice pour le serializer
            return type('MockSolde', (), {
                'utilisateur': user,
                'montant': 0,
                'derniere_mise_a_jour': timezone.now()
            })()
        
        solde, _ = Solde.objects.get_or_create(utilisateur=user)
        return solde


class DashboardView(APIView):
    """
    Dashboard avec statistiques et informations.
    ✅ Accessible même si l'abonnement est expiré ou en mode visiteur (via EstVisiteur).
    """
    permission_classes = [IsAuthenticated, EstVisiteur]

    def get(self, request):
        user = request.user
        
        # 🆕 Si l'utilisateur est en mode visiteur, retourner des données mock
        if hasattr(user, 'est_visiteur') and user.est_visiteur:
            from abonnements.mock_data import MOCK_STATS, MOCK_TRANSACTIONS, MOCK_BUDGETS
            from budgets.serializers import BudgetSerializer
            
            return Response({
                'solde': {
                    'utilisateur': str(user.id),
                    'montant': 0,
                    'derniere_mise_a_jour': timezone.now()
                },
                'par_mois': [],
                'par_categorie': MOCK_STATS.get('depenses_par_categorie', []),
                'evolution_solde': [],
                'dernieres_transactions': TransactionSerializer(MOCK_TRANSACTIONS[:5], many=True).data,
                'derniers_budgets': BudgetSerializer(MOCK_BUDGETS[:4], many=True).data,
                'nombre_transactions': len(MOCK_TRANSACTIONS),
                'info_essai': None,
                'abonnement_expire': False,
                'abonnement_info': {
                    'statut': 'visiteur',
                    'plan': 'demo',
                    'date_fin': None,
                    'est_actif': True,
                    'jours_restants': 0,
                    'est_visiteur': True,
                    'est_lecture_seule': True,
                },
                'est_visiteur': True,
                'est_lecture_seule': True,
            })

        transactions = Transaction.objects.filter(utilisateur=request.user)

        # ── Infos essai + limites quotidiennes ───────────────────────────────
        try:
            abo = request.user.abonnement
            en_essai = abo.get_plan_nom() == 'essai' if abo else False
            # 🆕 Vérifier si c'est un abonnement de démonstration
            est_demo = abo.est_demo_mode() if abo else False
        except Exception:
            en_essai = False
            est_demo = False

        info_essai = None
        if en_essai and not est_demo:
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

        from django.db.models.functions import TruncMonth
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
                    'jours_restants': (abo.date_fin - timezone.now()).days if abo.est_actif() else 0,
                    'est_visiteur': False,
                    'est_lecture_seule': abo.est_lecture_seule,
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
            'abonnement_expire': abonnement_expire,
            'abonnement_info': abonnement_info,
            'est_visiteur': False,
            'est_lecture_seule': abonnement_expire or (abo and abo.est_lecture_seule if abo else False),
        })


class CategorieListCreateView(generics.ListCreateAPIView):
    """
    Liste et création des catégories.
    - Lecture : accessible à tous les utilisateurs authentifiés (même visiteurs)
    - Création : nécessite un abonnement Standard ou Entreprise (non essai, non visiteur)
    """
    serializer_class = CategorieSerializer
    permission_classes = [IsAuthenticated, EstVisiteur]
    pagination_class = None

    def get_queryset(self):
        user = self.request.user
        
        # 🆕 Si l'utilisateur est en mode visiteur, retourner les catégories système uniquement
        if hasattr(user, 'est_visiteur') and user.est_visiteur:
            # ✅ Solution simple : retourner les catégories système (utilisateur=None)
            return Categorie.objects.filter(
                utilisateur__isnull=True, 
                is_visible=True
            ).order_by('nom')
        
        return Categorie.objects.filter(
            Q(utilisateur__isnull=True) | Q(utilisateur=user),
            is_visible=True,
        ).order_by('utilisateur', 'nom')

    def perform_create(self, serializer):
        user = self.request.user
        
        # 🆕 Vérification du mode visiteur
        if hasattr(user, 'est_visiteur') and user.est_visiteur:
            raise PermissionDenied({
                'error': 'mode_visiteur',
                'message': '🔍 Mode Exploration : Créez un compte pour créer des catégories.',
                'redirect_to': '/inscription',
                'visitor_mode': True
            })
        
        # ✅ Vérification complète de l'abonnement pour la création
        try:
            abo = user.abonnement
            if not abo:
                raise PermissionDenied({
                    'error': 'abonnement_requis',
                    'message': 'Vous devez avoir un abonnement pour créer des catégories.',
                    'redirect_to': '/abonnement'
                })

            # 🆕 Vérifier si c'est un abonnement de démonstration
            if abo.est_demo_mode():
                raise PermissionDenied({
                    'error': 'mode_visiteur',
                    'message': '🔍 Mode Exploration : Créez un compte pour créer des catégories.',
                    'redirect_to': '/inscription',
                    'visitor_mode': True
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
    - Lecture : accessible à tous les utilisateurs authentifiés (même visiteurs)
    - Modification/Suppression : nécessite un abonnement Standard ou Entreprise
    """
    serializer_class = CategorieSerializer
    permission_classes = [IsAuthenticated, EstVisiteur]

    def get_queryset(self):
        user = self.request.user
        
        # 🆕 Si l'utilisateur est en mode visiteur, retourner les catégories système
        if hasattr(user, 'est_visiteur') and user.est_visiteur:
            return Categorie.objects.filter(
                utilisateur__isnull=True,
                is_visible=True
            ).order_by('nom')
        
        return Categorie.objects.filter(utilisateur=user, is_visible=True)

    def perform_update(self, serializer):
        user = self.request.user
        
        # 🆕 Vérification du mode visiteur
        if hasattr(user, 'est_visiteur') and user.est_visiteur:
            raise PermissionDenied({
                'error': 'mode_visiteur',
                'message': '🔍 Mode Exploration : Créez un compte pour modifier des catégories.',
                'redirect_to': '/inscription',
                'visitor_mode': True
            })
        
        # ✅ Vérification pour la modification
        try:
            abo = user.abonnement
            if not abo:
                raise PermissionDenied({
                    'error': 'abonnement_requis',
                    'message': 'Vous devez avoir un abonnement pour modifier des catégories.',
                    'redirect_to': '/abonnement'
                })

            # 🆕 Vérifier si c'est un abonnement de démonstration
            if abo.est_demo_mode():
                raise PermissionDenied({
                    'error': 'mode_visiteur',
                    'message': '🔍 Mode Exploration : Créez un compte pour modifier des catégories.',
                    'redirect_to': '/inscription',
                    'visitor_mode': True
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

    def perform_destroy(self, instance):
        user = self.request.user
        
        # 🆕 Vérification du mode visiteur
        if hasattr(user, 'est_visiteur') and user.est_visiteur:
            raise PermissionDenied({
                'error': 'mode_visiteur',
                'message': '🔍 Mode Exploration : Créez un compte pour supprimer des catégories.',
                'redirect_to': '/inscription',
                'visitor_mode': True
            })
        
        # ✅ Vérification pour la suppression
        try:
            abo = user.abonnement
            if not abo:
                raise PermissionDenied({
                    'error': 'abonnement_requis',
                    'message': 'Vous devez avoir un abonnement pour supprimer des catégories.',
                    'redirect_to': '/abonnement'
                })

            # 🆕 Vérifier si c'est un abonnement de démonstration
            if abo.est_demo_mode():
                raise PermissionDenied({
                    'error': 'mode_visiteur',
                    'message': '🔍 Mode Exploration : Créez un compte pour supprimer des catégories.',
                    'redirect_to': '/inscription',
                    'visitor_mode': True
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
        
        instance.is_visible = False
        instance.save()
        enregistrer_log(user, "CATEGORIE", f"Suppression : {instance.nom}", self.request)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)


# ─── ABONNEMENT STATUT (transactions) ─────────────────────────────────────
class AbonnementStatutView(APIView):
    """
    Vérifie le statut de l'abonnement de l'utilisateur.
    Utilisé par le frontend pour afficher des messages appropriés.
    🆕 Ajout de la gestion du mode visiteur.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        
        # 🆕 Vérifier si l'utilisateur est en mode visiteur
        if hasattr(user, 'est_visiteur') and user.est_visiteur:
            return Response({
                'statut': 'visiteur',
                'message': '🔍 Mode Exploration - Visualisation uniquement',
                'plan': 'demo',
                'est_actif': True,
                'jours_restants': 0,
                'peut_creer': False,
                'peut_modifier': False,
                'can_create_categories': False,
                'est_plan_payant': False,
                'est_visiteur': True,
                'est_lecture_seule': True,
                'redirect_to': '/inscription'
            })
        
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
                    'est_plan_payant': False,
                    'est_visiteur': False,
                    'est_lecture_seule': True,
                    'redirect_to': '/abonnement'
                })

            # 🆕 Vérifier si c'est un abonnement de démonstration
            if abonnement.est_demo_mode():
                return Response({
                    'statut': 'visiteur',
                    'message': '🔍 Mode Exploration - Visualisation uniquement',
                    'plan': 'demo',
                    'est_actif': True,
                    'jours_restants': 0,
                    'peut_creer': False,
                    'peut_modifier': False,
                    'can_create_categories': False,
                    'est_plan_payant': False,
                    'est_visiteur': True,
                    'est_lecture_seule': True,
                    'redirect_to': '/inscription'
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
                'est_visiteur': False,
                'est_lecture_seule': not est_actif,
                'message': f'Votre abonnement est {"actif" if est_actif else "expiré"}. {jours_restants if est_actif else 0} jours restants.',
                'redirect_to': '/abonnement' if not est_actif else None
            })

        except Exception as e:
            return Response({
                'statut': 'erreur',
                'message': 'Erreur lors de la vérification de l\'abonnement.',
                'est_actif': False,
                'est_visiteur': False,
                'est_lecture_seule': True,
                'redirect_to': '/abonnement'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)