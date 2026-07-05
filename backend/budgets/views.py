# backend/budgets/views.py
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import PermissionDenied, ValidationError
from django.utils import timezone
from decimal import Decimal
from abonnements.permissions import EstAbonne, LimiteEssaiQuotidienne, EstVisiteur
from logs.utils import enregistrer_log
from .models import Budget, BudgetDepense
from .serializers import BudgetSerializer, BudgetDepenseSerializer
from transactions.models import Transaction, Solde, Categorie
from transactions.serializers import TransactionSerializer


class BudgetListCreateView(generics.ListCreateAPIView):
    """
    Liste et création des budgets.
    - Lecture : accessible même si abonnement expiré ou en mode visiteur (via EstVisiteur)
    - Création : nécessite un abonnement actif
    """
    serializer_class = BudgetSerializer
    permission_classes = [IsAuthenticated, EstVisiteur, LimiteEssaiQuotidienne]

    def get_queryset(self):
        user = self.request.user
        
        # 🆕 Si l'utilisateur est en mode visiteur, retourner des données mock
        if user.est_visiteur:
            from abonnements.mock_data import MOCK_BUDGETS
            return MOCK_BUDGETS
        
        # 🆕 Retourne TOUS les budgets non supprimés (actifs, terminés, dépassés).
        # est_actif n'est plus utilisé comme filtre ici : un budget terminé/dépassé
        # doit rester visible et filtrable côté frontend (onglet "Terminé").
        # Seul est_supprime=True fait disparaître un budget de la liste.
        return Budget.objects.filter(
            utilisateur=user,
            est_supprime=False
        ).order_by('-date_creation')

    def perform_create(self, serializer):
        user = self.request.user
        
        # 🆕 Vérification du mode visiteur AVANT toute création
        if user.est_visiteur:
            raise PermissionDenied({
                'error': 'mode_visiteur',
                'message': '🔍 Mode Exploration : Créez un compte pour créer des budgets.',
                'redirect_to': '/inscription',
                'visitor_mode': True
            })
        
        # ✅ Vérification explicite de l'abonnement
        try:
            abo = user.abonnement
            if not abo:
                raise PermissionDenied({
                    'error': 'abonnement_requis',
                    'message': 'Vous devez avoir un abonnement pour créer des budgets.',
                    'redirect_to': '/abonnement'
                })
            
            # 🆕 Vérifier si c'est un abonnement de démonstration
            if abo.est_demo_mode():
                raise PermissionDenied({
                    'error': 'mode_visiteur',
                    'message': '🔍 Mode Exploration : Créez un compte pour créer des budgets.',
                    'redirect_to': '/inscription',
                    'visitor_mode': True
                })
            
            if abo.statut != 'actif' or abo.date_fin <= timezone.now():
                raise PermissionDenied({
                    'error': 'abonnement_expire',
                    'message': 'Votre abonnement a expiré. Vous ne pouvez pas créer de budgets.',
                    'redirect_to': '/abonnement'
                })
                
        except PermissionDenied:
            raise
        except Exception:
            raise PermissionDenied({
                'error': 'abonnement_requis',
                'message': 'Vous devez avoir un abonnement actif pour créer des budgets.',
                'redirect_to': '/abonnement'
            })

        # ✅ Vérifier que l'utilisateur a des catégories
        categories = Categorie.objects.filter(
            utilisateur=user, 
            is_visible=True
        )
        if not categories.exists():
            raise ValidationError({
                'error': 'categorie_requise',
                'message': 'Il faut créer des catégories avant de créer un budget.',
                'redirect_to': '/categories'
            })

        # ✅ Vérifier que le montant est valide
        montant_prevu = serializer.validated_data.get('montant_prevu', 0)
        if montant_prevu <= 0:
            raise ValidationError({
                'error': 'montant_invalide',
                'message': 'Le montant prévu doit être supérieur à 0.'
            })

        # ✅ Vérifier que la date de fin est après la date de début
        date_debut = serializer.validated_data.get('date_debut', timezone.now().date())
        date_fin = serializer.validated_data.get('date_fin')
        if date_fin <= date_debut:
            raise ValidationError({
                'error': 'date_invalide',
                'message': 'La date de fin doit être postérieure à la date de début.'
            })

        # ✅ Vérifier les limites pour les utilisateurs en essai
        try:
            abo = user.abonnement
            if abo and abo.get_plan_nom() == 'essai':
                aujourd_hui = timezone.now().date()
                nb_budgets_jour = Budget.objects.filter(
                    utilisateur=user,
                    date_creation__date=aujourd_hui
                ).count()
                if nb_budgets_jour >= 2:  # Limite essai = 2 budgets par jour
                    raise PermissionDenied({
                        'error': 'limite_essai',
                        'message': 'Limite quotidienne atteinte. Vous ne pouvez créer que 2 budgets par jour en période d\'essai.',
                        'redirect_to': '/abonnement'
                    })
        except PermissionDenied:
            raise
        except Exception:
            pass

        # ✅ Créer le budget
        budget = serializer.save(utilisateur=user)
        enregistrer_log(user, "BUDGET", f"Budget créé: {budget.categorie.nom}", self.request)

        # ✅ Si la date de fin est déjà passée, clôturer immédiatement
        if budget.date_fin < timezone.now().date():
            budget.envoyer_notification_fin()
            budget.est_actif = False
            budget.save(update_fields=['est_actif', 'notif_fin_envoyee'])


class BudgetDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Détail, modification et suppression d'un budget.
    - Lecture : accessible même si abonnement expiré ou en mode visiteur (via EstVisiteur)
    - Modification/Suppression : nécessite un abonnement actif
    """
    serializer_class = BudgetSerializer
    permission_classes = [IsAuthenticated, EstVisiteur]

    def get_queryset(self):
        user = self.request.user
        
        # 🆕 Si l'utilisateur est en mode visiteur, retourner des données mock
        if user.est_visiteur:
            from abonnements.mock_data import MOCK_BUDGETS
            return MOCK_BUDGETS
        
        # 🆕 Exclure les budgets supprimés logiquement
        return Budget.objects.filter(utilisateur=user, est_supprime=False)

    def retrieve(self, request, *args, **kwargs):
        """Récupère un budget avec toutes ses informations."""
        user = request.user
        
        # 🆕 Si l'utilisateur est en mode visiteur, retourner des données mock
        if user.est_visiteur:
            from abonnements.mock_data import MOCK_BUDGETS, MOCK_TRANSACTIONS
            budget_data = MOCK_BUDGETS[0] if MOCK_BUDGETS else {}
            return Response({
                'id': budget_data.get('id', 1),
                'nom': budget_data.get('nom', 'Budget démo'),
                'montant_prevu': budget_data.get('montant', 100000),
                'montant_depense': budget_data.get('depense', 45000),
                'categorie': {'nom': 'Alimentation'},
                'date_debut': timezone.now().date().isoformat(),
                'date_fin': (timezone.now() + timezone.timedelta(days=30)).date().isoformat(),
                'est_actif': True,
                'pourcentage_utilise': 45,
                'reste': 55000,
                'jours_restants': 30,
                'transactions': TransactionSerializer(MOCK_TRANSACTIONS[:3], many=True).data,
                'depenses': [],
            })
        
        budget = self.get_object()
        data = BudgetSerializer(budget).data
        
        # ✅ Récupérer les transactions liées à ce budget
        transactions = Transaction.objects.filter(
            utilisateur=request.user,
            budget=budget,
            type='sortie',
            is_visible=True,
        )
        data['transactions'] = TransactionSerializer(transactions, many=True).data
        
        # ✅ Récupérer les dépenses du budget (suivi interne)
        depenses = BudgetDepense.objects.filter(budget=budget)
        data['depenses'] = BudgetDepenseSerializer(depenses, many=True).data
        
        # ✅ Ajouter des informations supplémentaires
        data['pourcentage_utilise'] = budget.pourcentage_utilise
        data['reste'] = float(budget.montant_prevu) - float(budget.montant_depense)
        data['jours_restants'] = (budget.date_fin - timezone.now().date()).days if budget.est_actif else 0
        
        return Response(data)

    def perform_update(self, serializer):
        user = self.request.user
        
        # 🆕 Vérification du mode visiteur
        if user.est_visiteur:
            raise PermissionDenied({
                'error': 'mode_visiteur',
                'message': '🔍 Mode Exploration : Créez un compte pour modifier des budgets.',
                'redirect_to': '/inscription',
                'visitor_mode': True
            })
        
        # ✅ Vérification explicite pour la modification
        try:
            abo = user.abonnement
            if not abo:
                raise PermissionDenied({
                    'error': 'abonnement_requis',
                    'message': 'Vous devez avoir un abonnement pour modifier des budgets.',
                    'redirect_to': '/abonnement'
                })
            
            # 🆕 Vérifier si c'est un abonnement de démonstration
            if abo.est_demo_mode():
                raise PermissionDenied({
                    'error': 'mode_visiteur',
                    'message': '🔍 Mode Exploration : Créez un compte pour modifier des budgets.',
                    'redirect_to': '/inscription',
                    'visitor_mode': True
                })
            
            if abo.statut != 'actif' or abo.date_fin <= timezone.now():
                raise PermissionDenied({
                    'error': 'abonnement_expire',
                    'message': 'Votre abonnement a expiré. Vous ne pouvez pas modifier de budgets.',
                    'redirect_to': '/abonnement'
                })
                
        except PermissionDenied:
            raise
        except Exception:
            raise PermissionDenied({
                'error': 'abonnement_requis',
                'message': 'Vous devez avoir un abonnement actif pour modifier des budgets.',
                'redirect_to': '/abonnement'
            })
        
        # ✅ Vérifier les dates
        date_debut = serializer.validated_data.get('date_debut')
        date_fin = serializer.validated_data.get('date_fin')
        if date_debut and date_fin and date_fin <= date_debut:
            raise ValidationError({
                'error': 'date_invalide',
                'message': 'La date de fin doit être postérieure à la date de début.'
            })
        
        # ✅ Vérifier que le budget est actif
        budget = self.get_object()
        if not budget.est_actif:
            raise ValidationError({
                'error': 'budget_inactif',
                'message': 'Ce budget est déjà clôturé. Vous ne pouvez pas le modifier.'
            })
        
        budget = serializer.save()
        enregistrer_log(user, "BUDGET", f"Budget modifié: {budget.categorie.nom}", self.request)

    def destroy(self, request, *args, **kwargs):
        user = request.user
        
        # 🆕 Vérification du mode visiteur
        if user.est_visiteur:
            raise PermissionDenied({
                'error': 'mode_visiteur',
                'message': '🔍 Mode Exploration : Créez un compte pour supprimer des budgets.',
                'redirect_to': '/inscription',
                'visitor_mode': True
            })
        
        # ✅ Vérification explicite pour la suppression
        try:
            abo = user.abonnement
            if not abo:
                raise PermissionDenied({
                    'error': 'abonnement_requis',
                    'message': 'Vous devez avoir un abonnement pour supprimer des budgets.',
                    'redirect_to': '/abonnement'
                })
            
            # 🆕 Vérifier si c'est un abonnement de démonstration
            if abo.est_demo_mode():
                raise PermissionDenied({
                    'error': 'mode_visiteur',
                    'message': '🔍 Mode Exploration : Créez un compte pour supprimer des budgets.',
                    'redirect_to': '/inscription',
                    'visitor_mode': True
                })
            
            if abo.statut != 'actif' or abo.date_fin <= timezone.now():
                raise PermissionDenied({
                    'error': 'abonnement_expire',
                    'message': 'Votre abonnement a expiré. Vous ne pouvez pas supprimer de budgets.',
                    'redirect_to': '/abonnement'
                })
                
        except PermissionDenied:
            raise
        except Exception:
            raise PermissionDenied({
                'error': 'abonnement_requis',
                'message': 'Vous devez avoir un abonnement actif pour supprimer des budgets.',
                'redirect_to': '/abonnement'
            })
        
        budget = self.get_object()

        # 🆕 Un budget terminé (100% utilisé) ne doit JAMAIS être supprimé.
        # Il doit rester consultable et filtrable dans l'onglet "Terminé".
        if budget.pourcentage_utilise >= 100:
            raise ValidationError({
                'error': 'budget_termine',
                'message': 'Ce budget est terminé et ne peut pas être supprimé. Il reste visible dans l\'onglet "Terminé".'
            })

        # 🆕 Suppression logique dédiée : n'affecte plus est_actif,
        # qui reste réservé au statut "en cours / clôturé".
        budget.est_supprime = True
        budget.save(update_fields=['est_supprime'])
        enregistrer_log(user, "BUDGET", f"Budget supprimé: {budget.categorie.nom}", request)
        return Response(status=status.HTTP_204_NO_CONTENT)


class BudgetTransactionsView(generics.ListAPIView):
    """
    Retourne toutes les transactions liées à un budget spécifique.
    ✅ Accessible même si l'abonnement est expiré ou en mode visiteur (lecture seule)
    """
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated, EstVisiteur]
    pagination_class = None

    def get_queryset(self):
        user = self.request.user
        pk = self.kwargs['pk']
        
        # 🆕 Si l'utilisateur est en mode visiteur, retourner des données mock
        if user.est_visiteur:
            from abonnements.mock_data import MOCK_TRANSACTIONS
            return MOCK_TRANSACTIONS[:5]
        
        # 🆕 est_supprime=False : un budget supprimé ne doit plus exposer ses transactions
        budget = Budget.objects.get(id=pk, utilisateur=user, est_supprime=False)
        return Transaction.objects.filter(
            utilisateur=user,
            budget=budget,
            type='sortie',
            is_visible=True,
        ).order_by('-date_creation')


class BudgetDepensesView(generics.ListAPIView):
    """
    Retourne toutes les dépenses d'un budget spécifique.
    ✅ Accessible même si l'abonnement est expiré ou en mode visiteur (lecture seule)
    """
    serializer_class = BudgetDepenseSerializer
    permission_classes = [IsAuthenticated, EstVisiteur]
    pagination_class = None

    def get_queryset(self):
        user = self.request.user
        pk = self.kwargs['pk']
        
        # 🆕 Si l'utilisateur est en mode visiteur, retourner des données mock
        if user.est_visiteur:
            from abonnements.mock_data import MOCK_BUDGETS
            return []
        
        # 🆕 est_supprime=False : un budget supprimé ne doit plus exposer ses dépenses
        budget = Budget.objects.get(id=pk, utilisateur=user, est_supprime=False)
        return BudgetDepense.objects.filter(budget=budget).order_by('-date_creation')


class DepenseBudgetView(APIView):
    """
    Enregistre une dépense liée à un budget.
    Nécessite un abonnement actif.
    🆕 Bloque le mode visiteur.
    """
    permission_classes = [IsAuthenticated, EstAbonne]

    def post(self, request, pk):
        user = request.user
        
        # 🆕 Vérification du mode visiteur
        if user.est_visiteur:
            return Response({
                'error': 'mode_visiteur',
                'message': '🔍 Mode Exploration : Créez un compte pour enregistrer des dépenses.',
                'redirect_to': '/inscription',
                'visitor_mode': True
            }, status=403)

        try:
            # 🆕 est_supprime=False : impossible d'ajouter une dépense sur un budget supprimé
            budget = Budget.objects.get(id=pk, utilisateur=user, est_supprime=False)
        except Budget.DoesNotExist:
            return Response({
                'error': 'budget_introuvable',
                'message': 'Budget introuvable.'
            }, status=404)

        # ✅ Vérifier que le budget est actif
        if not budget.est_actif:
            return Response({
                'error': 'budget_inactif',
                'message': 'Ce budget est déjà clôturé ou expiré. Vous ne pouvez pas ajouter de dépenses.'
            }, status=400)

        # ✅ Vérifier que l'abonnement est actif
        try:
            abo = user.abonnement
            if not abo:
                return Response({
                    'error': 'abonnement_requis',
                    'message': 'Vous devez avoir un abonnement pour enregistrer des dépenses.',
                    'redirect_to': '/abonnement'
                }, status=403)
            
            # 🆕 Vérifier si c'est un abonnement de démonstration
            if abo.est_demo_mode():
                return Response({
                    'error': 'mode_visiteur',
                    'message': '🔍 Mode Exploration : Créez un compte pour enregistrer des dépenses.',
                    'redirect_to': '/inscription',
                    'visitor_mode': True
                }, status=403)
            
            if abo.statut != 'actif' or abo.date_fin <= timezone.now():
                return Response({
                    'error': 'abonnement_expire',
                    'message': 'Votre abonnement a expiré. Vous ne pouvez pas enregistrer de dépenses.',
                    'redirect_to': '/abonnement'
                }, status=403)
        except Exception:
            return Response({
                'error': 'abonnement_requis',
                'message': 'Vous devez avoir un abonnement actif pour enregistrer des dépenses.',
                'redirect_to': '/abonnement'
            }, status=403)

        # ✅ Valider les données
        montant = Decimal(str(request.data.get('montant', 0)))
        description = request.data.get('description', '')

        if montant <= 0:
            return Response({
                'error': 'montant_invalide',
                'message': 'Le montant doit être supérieur à 0.'
            }, status=400)

        # ✅ Vérifier le solde
        solde, _ = Solde.objects.get_or_create(utilisateur=user)
        if solde.montant_total < montant:
            return Response({
                'error': 'solde_insuffisant',
                'message': f'Solde insuffisant. Solde actuel: {float(solde.montant_total):.2f} MRU'
            }, status=400)

        # ✅ Vérifier le reste du budget
        reste = Decimal(str(budget.montant_prevu)) - Decimal(str(budget.montant_depense))
        if reste < montant:
            return Response({
                'error': 'budget_insuffisant',
                'message': f'Budget insuffisant. Il reste {float(reste):.2f} MRU dans ce budget.'
            }, status=400)

        # ✅ 1. Créer une dépense de budget (suivi interne)
        depense = BudgetDepense.objects.create(
            budget=budget,
            montant=montant,
            description=description,
        )

        # ✅ 2. Créer une transaction (historique global)
        transaction = Transaction.objects.create(
            utilisateur=user,
            type='sortie',
            montant=montant,
            categorie=budget.categorie,
            description=f"[BUDGET] {description}" if description else f"Dépense du budget {budget.categorie.nom}",
            source='budget',
            budget=budget,
            is_visible=True,
        )

        # ✅ Mettre à jour le solde
        solde.montant_total = solde.montant_total - montant
        solde.save()

        # ✅ Clôturer si dépassé ou si la date de fin est atteinte
        if budget.pourcentage_utilise >= 100 or budget.date_fin <= timezone.now().date():
            if not budget.notif_fin_envoyee:
                budget.envoyer_notification_fin()
                budget.notif_fin_envoyee = True
            budget.est_actif = False
            budget.save(update_fields=['est_actif', 'notif_fin_envoyee'])

        enregistrer_log(user, "DEPENSE_BUDGET",
                        f"Dépense {float(montant)} MRU sur budget {budget.categorie.nom}", request)
        
        # ✅ Retourner les deux objets créés
        return Response({
            'message': 'Dépense enregistrée avec succès.',
            'depense_budget': BudgetDepenseSerializer(depense).data,
            'transaction': TransactionSerializer(transaction).data,
            'budget': {
                'montant_depense': float(budget.montant_depense),
                'montant_prevu': float(budget.montant_prevu),
                'pourcentage_utilise': budget.pourcentage_utilise,
                'reste': float(reste) - float(montant),
                'est_actif': budget.est_actif
            }
        }, status=201)


class VerifierBudgetsExpires(APIView):
    """
    Clôture les budgets dont la date de fin est dépassée.
    ✅ Accessible en lecture même si abonnement expiré ou en mode visiteur
    """
    permission_classes = [IsAuthenticated, EstVisiteur]

    def post(self, request):
        user = request.user
        
        # 🆕 Si l'utilisateur est en mode visiteur, rien à faire
        if user.est_visiteur:
            return Response({
                'message': '0 budget(s) clôturé(s) (mode visiteur)',
                'budgets_clotures': 0
            })
        
        today = timezone.now().date()
        # 🆕 est_supprime=False : ne pas ré-agir sur des budgets déjà supprimés
        budgets_expires = Budget.objects.filter(
            utilisateur=user,
            est_actif=True,
            est_supprime=False,
            date_fin__lt=today,
        )
        count = 0
        for budget in budgets_expires:
            if not budget.notif_fin_envoyee:
                budget.envoyer_notification_fin()
                budget.notif_fin_envoyee = True
            budget.est_actif = False
            budget.save(update_fields=['est_actif', 'notif_fin_envoyee'])
            count += 1
        
        enregistrer_log(user, "BUDGET", f"{count} budgets clôturés automatiquement", request)
        return Response({
            'message': f'{count} budget(s) clôturé(s)',
            'budgets_clotures': count
        })


# ✅ NOUVEAU ENDPOINT : Statistiques des budgets
class BudgetStatsView(APIView):
    """
    Retourne des statistiques sur les budgets de l'utilisateur.
    ✅ Accessible même si l'abonnement est expiré ou en mode visiteur (lecture seule)
    """
    permission_classes = [IsAuthenticated, EstVisiteur]

    def get(self, request):
        user = request.user
        
        # 🆕 Si l'utilisateur est en mode visiteur, retourner des données mock
        if user.est_visiteur:
            from abonnements.mock_data import MOCK_BUDGETS, MOCK_STATS
            return Response({
                'total_budgets': len(MOCK_BUDGETS),
                'budgets_actifs': len([b for b in MOCK_BUDGETS if b.get('est_actif', True)]),
                'total_prevu': sum(b.get('montant', 0) for b in MOCK_BUDGETS),
                'total_depense': sum(b.get('depense', 0) for b in MOCK_BUDGETS),
                'pourcentage_global': 45,
                'budgets_par_categorie': {
                    'Alimentation': {'total_prevu': 100000, 'total_depense': 45000, 'count': 1},
                    'Transport': {'total_prevu': 50000, 'total_depense': 20000, 'count': 1},
                    'Utilités': {'total_prevu': 75000, 'total_depense': 60000, 'count': 1},
                    'Divertissement': {'total_prevu': 40000, 'total_depense': 28000, 'count': 1},
                },
                'budgets_actifs_details': MOCK_BUDGETS,
                'est_visiteur': True,
                'est_lecture_seule': True,
            })
        
        # 🆕 Budgets actifs et total : exclure les budgets supprimés logiquement
        budgets_actifs = Budget.objects.filter(utilisateur=user, est_actif=True, est_supprime=False)
        budgets_total = Budget.objects.filter(utilisateur=user, est_supprime=False)
        
        # Calculs
        total_prevu = sum(b.montant_prevu for b in budgets_actifs)
        total_depense = sum(b.montant_depense for b in budgets_actifs)
        
        # Budgets par catégorie
        budgets_par_categorie = {}
        for budget in budgets_actifs:
            nom_categorie = budget.categorie.nom if budget.categorie else 'Sans catégorie'
            if nom_categorie not in budgets_par_categorie:
                budgets_par_categorie[nom_categorie] = {
                    'total_prevu': 0,
                    'total_depense': 0,
                    'count': 0
                }
            budgets_par_categorie[nom_categorie]['total_prevu'] += float(budget.montant_prevu)
            budgets_par_categorie[nom_categorie]['total_depense'] += float(budget.montant_depense)
            budgets_par_categorie[nom_categorie]['count'] += 1
        
        return Response({
            'total_budgets': budgets_total.count(),
            'budgets_actifs': budgets_actifs.count(),
            'total_prevu': float(total_prevu),
            'total_depense': float(total_depense),
            'pourcentage_global': float((total_depense / total_prevu * 100)) if total_prevu > 0 else 0,
            'budgets_par_categorie': budgets_par_categorie,
            'budgets_actifs_details': BudgetSerializer(budgets_actifs, many=True).data,
            'est_visiteur': False,
            'est_lecture_seule': False,
        })