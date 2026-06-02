'''from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from abonnements.permissions import EstAbonne
from logs.utils import enregistrer_log
from .models import Budget
from .serializers import BudgetSerializer
from transactions.models import Transaction, Solde
from transactions.serializers import TransactionSerializer


class BudgetListCreateView(generics.ListCreateAPIView):
    serializer_class = BudgetSerializer
    permission_classes = [IsAuthenticated, EstAbonne]

    def get_queryset(self):
        return Budget.objects.filter(utilisateur=self.request.user, est_actif=True)

    def perform_create(self, serializer):
        # Vérifier que l'utilisateur a des catégories
        from transactions.models import Categorie
        from django.db.models import Q
        user = self.request.user
        categories = Categorie.objects.filter(
            Q(utilisateur__isnull=True) | Q(utilisateur=user),
            is_visible=True,
        )
        if not categories.exists():
            from rest_framework.exceptions import ValidationError
            raise ValidationError(
                "Il faut créer des catégories avant de créer un budget."
            )

        budget = serializer.save(utilisateur=user)
        enregistrer_log(user, "BUDGET", f"Budget créé: {budget.categorie}", self.request)

        # Si la date de fin est déjà passée, clôturer immédiatement
        if budget.date_fin < timezone.now().date():
            budget.envoyer_notification_fin()
            budget.est_actif = False
            budget.save(update_fields=['est_actif', 'notif_fin_envoyee'])


class BudgetDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = BudgetSerializer
    permission_classes = [IsAuthenticated, EstAbonne]

    def get_queryset(self):
        return Budget.objects.filter(utilisateur=self.request.user)

    def retrieve(self, request, *args, **kwargs):
        budget = self.get_object()
        data = BudgetSerializer(budget).data
        transactions = Transaction.objects.filter(
            utilisateur=request.user,
            categorie=budget.categorie,
            type='sortie',
            date__date__gte=budget.date_debut,
            date__date__lte=budget.date_fin,
        )
        data['transactions'] = TransactionSerializer(transactions, many=True).data
        return Response(data)


class BudgetTransactionsView(generics.ListAPIView):
    """Retourne toutes les transactions liées à un budget spécifique."""
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated, EstAbonne]
    pagination_class = None

    def get_queryset(self):
        pk = self.kwargs['pk']
        budget = Budget.objects.get(id=pk, utilisateur=self.request.user)
        return Transaction.objects.filter(
            utilisateur=self.request.user,
            categorie=budget.categorie,
            type='sortie',
            date__date__gte=budget.date_debut,
            date__date__lte=budget.date_fin,
        )


class DepenseBudgetView(APIView):
    """Enregistre une dépense liée à un budget."""
    permission_classes = [IsAuthenticated, EstAbonne]

    def post(self, request, pk):
        try:
            budget = Budget.objects.get(id=pk, utilisateur=request.user)
        except Budget.DoesNotExist:
            return Response({'error': 'Budget introuvable.'}, status=404)

        montant = float(request.data.get('montant', 0))
        description = request.data.get('description', '')

        if montant <= 0:
            return Response({'error': 'Montant invalide.'}, status=400)

        # Vérifier le solde
        solde, _ = Solde.objects.get_or_create(utilisateur=request.user)
        if float(solde.montant_total) < montant:
            return Response({'error': 'Solde insuffisant pour effectuer cette dépense.'}, status=400)

        # Vérifier le reste du budget
        reste = float(budget.montant_prevu) - float(budget.montant_depense)
        if reste < montant:
            return Response({
                'error': f'Budget insuffisant. Il reste {reste:.2f} MRU dans ce budget.'
            }, status=400)

        transaction = Transaction.objects.create(
            utilisateur=request.user,
            type='sortie',
            montant=montant,
            categorie=budget.categorie,
            description=description,
            source='budget',
            budget=budget,
            is_visible=True,
        )

        # Clôturer si dépassé
        if budget.pourcentage_utilise >= 100:
            budget.envoyer_notification_fin()
            budget.est_actif = False
            budget.save(update_fields=['est_actif'])

        enregistrer_log(request.user, "DEPENSE_BUDGET",
                        f"Dépense {montant} MRU sur budget {budget.categorie}", request)
        return Response(TransactionSerializer(transaction).data, status=201)


class VerifierBudgetsExpires(APIView):
    """Clôture les budgets dont la date de fin est dépassée."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        today = timezone.now().date()
        budgets_expires = Budget.objects.filter(
            utilisateur=request.user,
            est_actif=True,
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
        return Response({'budgets_clotures': count})
'''



from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from decimal import Decimal
from abonnements.permissions import EstAbonne
from logs.utils import enregistrer_log
from .models import Budget, BudgetDepense
from .serializers import BudgetSerializer, BudgetDepenseSerializer
from transactions.models import Transaction, Solde
from transactions.serializers import TransactionSerializer


class BudgetListCreateView(generics.ListCreateAPIView):
    serializer_class = BudgetSerializer
    permission_classes = [IsAuthenticated, EstAbonne]

    def get_queryset(self):
        return Budget.objects.filter(utilisateur=self.request.user, est_actif=True)

    def perform_create(self, serializer):
        from transactions.models import Categorie
        from django.db.models import Q
        user = self.request.user
        categories = Categorie.objects.filter(
            Q(utilisateur__isnull=True) | Q(utilisateur=user),
            is_visible=True,
        )
        if not categories.exists():
            from rest_framework.exceptions import ValidationError
            raise ValidationError(
                "Il faut créer des catégories avant de créer un budget."
            )

        budget = serializer.save(utilisateur=user)
        enregistrer_log(user, "BUDGET", f"Budget créé: {budget.categorie}", self.request)

        # Si la date de fin est déjà passée, clôturer immédiatement
        if budget.date_fin < timezone.now().date():
            budget.envoyer_notification_fin()
            budget.est_actif = False
            budget.save(update_fields=['est_actif', 'notif_fin_envoyee'])


class BudgetDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = BudgetSerializer
    permission_classes = [IsAuthenticated, EstAbonne]

    def get_queryset(self):
        return Budget.objects.filter(utilisateur=self.request.user)


class BudgetDepensesView(generics.ListAPIView):
    """Retourne toutes les dépenses d'un budget spécifique (indépendantes des transactions)."""
    serializer_class = BudgetDepenseSerializer
    permission_classes = [IsAuthenticated, EstAbonne]
    pagination_class = None

    def get_queryset(self):
        pk = self.kwargs['pk']
        budget = Budget.objects.get(id=pk, utilisateur=self.request.user)
        return BudgetDepense.objects.filter(budget=budget)


class DepenseBudgetView(APIView):
    """Enregistre une dépense liée à un budget (indépendante des transactions manuelles)."""
    permission_classes = [IsAuthenticated, EstAbonne]

    def post(self, request, pk):
        try:
            budget = Budget.objects.get(id=pk, utilisateur=request.user)
        except Budget.DoesNotExist:
            return Response({'error': 'Budget introuvable.'}, status=404)

        montant = Decimal(str(request.data.get('montant', 0)))
        description = request.data.get('description', '')

        if montant <= 0:
            return Response({'error': 'Montant invalide.'}, status=400)

        # Vérifier le solde
        solde, _ = Solde.objects.get_or_create(utilisateur=request.user)
        if solde.montant_total < montant:
            return Response({'error': 'Solde insuffisant pour effectuer cette dépense.'}, status=400)

        # Vérifier le reste du budget
        reste = Decimal(str(budget.montant_prevu)) - Decimal(str(budget.montant_depense))
        if reste < montant:
            return Response({
                'error': f'Budget insuffisant. Il reste {float(reste):.2f} MRU dans ce budget.'
            }, status=400)

        # 1. Créer une dépense de budget (pour le suivi interne du budget)
        depense = BudgetDepense.objects.create(
            budget=budget,
            montant=montant,
            description=description,
        )

        # 2. Créer une transaction (pour l'historique global)
        transaction = Transaction.objects.create(
            utilisateur=request.user,
            type='sortie',
            montant=montant,
            categorie=budget.categorie,
            description=f"[BUDGET] {description}" if description else f"Dépense du budget {budget.categorie.nom}",
            source='budget',
            budget=budget,
            is_visible=True,
        )

        # Mettre à jour le solde
        solde.montant_total = solde.montant_total - montant
        solde.save()

        # Clôturer si dépassé ou si la date de fin est atteinte
        if budget.pourcentage_utilise >= 100 or budget.date_fin <= timezone.now().date():
            if not budget.notif_fin_envoyee:
                budget.envoyer_notification_fin()
                budget.notif_fin_envoyee = True
            budget.est_actif = False
            budget.save(update_fields=['est_actif', 'notif_fin_envoyee'])

        enregistrer_log(request.user, "DEPENSE_BUDGET",
                        f"Dépense {float(montant)} MRU sur budget {budget.categorie.nom}", request)
        
        # Retourner les deux objets créés
        return Response({
            'depense_budget': BudgetDepenseSerializer(depense).data,
            'transaction': TransactionSerializer(transaction).data
        }, status=201)


class VerifierBudgetsExpires(APIView):
    """Clôture les budgets dont la date de fin est dépassée."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        today = timezone.now().date()
        budgets_expires = Budget.objects.filter(
            utilisateur=request.user,
            est_actif=True,
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
        return Response({'budgets_clotures': count})