from rest_framework import generics, filters, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import PermissionDenied, ValidationError
from django.db.models import Sum, Q
from abonnements.permissions import EstAbonne, LimiteEssaiQuotidienne
from logs.utils import enregistrer_log
from .models import Transaction, Solde, Categorie
from .serializers import TransactionSerializer, SoldeSerializer, CategorieSerializer


class TransactionListCreateView(generics.ListCreateAPIView):
    serializer_class   = TransactionSerializer
    # ← LimiteEssaiQuotidienne ajoutée ici
    permission_classes = [IsAuthenticated, EstAbonne, LimiteEssaiQuotidienne]
    filter_backends    = [filters.SearchFilter, filters.OrderingFilter]
    search_fields      = ['description', 'categorie__nom']
    ordering_fields    = ['date_creation', 'montant']

    def get_queryset(self):
        qs = Transaction.objects.filter(
            utilisateur=self.request.user, is_visible=True, source='manuel'
        )
        type_filtre      = self.request.query_params.get('type')
        categorie_filtre = self.request.query_params.get('categorie')
        if type_filtre:
            qs = qs.filter(type=type_filtre)
        if categorie_filtre:
            qs = qs.filter(categorie__id=categorie_filtre)
        return qs

    def perform_create(self, serializer):
        transaction = serializer.save(utilisateur=self.request.user, source='manuel', is_visible=True)
        enregistrer_log(
            self.request.user, "TRANSACTION",
            f"Création: {transaction.type} {transaction.montant} MRU", self.request
        )


class TransactionDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class   = TransactionSerializer
    permission_classes = [IsAuthenticated, EstAbonne]

    def get_queryset(self):
        return Transaction.objects.filter(
            utilisateur=self.request.user, is_visible=True, source='manuel'
        )

    def destroy(self, request, *args, **kwargs):
        transaction = self.get_object()
        transaction.is_visible = False
        transaction.save()
        enregistrer_log(request.user, "TRANSACTION", f"Suppression (soft): {transaction.id}", request)
        return Response(status=status.HTTP_204_NO_CONTENT)


class ToutesTransactionsView(generics.ListAPIView):
    serializer_class   = TransactionSerializer
    permission_classes = [IsAuthenticated, EstAbonne]
    pagination_class   = None

    def get_queryset(self):
        return Transaction.objects.filter(utilisateur=self.request.user)


class SoldeView(generics.RetrieveAPIView):
    serializer_class   = SoldeSerializer
    permission_classes = [IsAuthenticated, EstAbonne]

    def get_object(self):
        solde, _ = Solde.objects.get_or_create(utilisateur=self.request.user)
        return solde


class DashboardView(APIView):
    permission_classes = [IsAuthenticated, EstAbonne]

    def get(self, request):
        from django.db.models.functions import TruncMonth
        from django.utils import timezone

        transactions = Transaction.objects.filter(utilisateur=request.user)

        # ── Infos essai + limites quotidiennes ───────────────────────────────
        try:
            abo       = request.user.abonnement
            en_essai  = abo.get_plan_nom() == 'essai'
        except Exception:
            en_essai  = False

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
                'transactions_aujourd_hui':      nb_trans_jour,
                'transactions_limite_jour':      5,
                'budgets_aujourd_hui':           nb_budgets_jour,
                'budgets_limite_jour':           2,
                'transactions_restantes_jour':   max(0, 5 - nb_trans_jour),
                'budgets_restants_jour':         max(0, 2 - nb_budgets_jour),
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

        toutes    = transactions.order_by('date_creation')
        evolution = []
        cumul     = 0
        for t in toutes:
            cumul += float(t.montant) if t.type == 'entree' else -float(t.montant)
            evolution.append({'date': t.date_creation, 'solde': round(cumul, 2), 'type': t.type, 'montant': float(t.montant), 'description': t.description})

        dernieres_5 = Transaction.objects.filter(
            utilisateur=request.user, is_visible=True, source='manuel'
        ).order_by('-date_creation')[:5]

        from budgets.models import Budget
        from budgets.serializers import BudgetSerializer
        derniers_budgets = Budget.objects.filter(
            utilisateur=request.user, est_actif=True
        ).order_by('-date_creation')[:4]

        return Response({
            'solde':                  SoldeSerializer(solde).data,
            'par_mois':               list(par_mois),
            'par_categorie':          list(par_categorie),
            'evolution_solde':        evolution,
            'dernieres_transactions': TransactionSerializer(dernieres_5, many=True).data,
            'derniers_budgets':       BudgetSerializer(derniers_budgets, many=True).data,
            'nombre_transactions':    transactions.count(),
            'info_essai':             info_essai,  # ← Nouvelles infos essai
        })


class CategorieListCreateView(generics.ListCreateAPIView):
    serializer_class   = CategorieSerializer
    permission_classes = [IsAuthenticated]
    pagination_class   = None

    def get_queryset(self):
        return Categorie.objects.filter(
            Q(utilisateur__isnull=True) | Q(utilisateur=self.request.user),
            is_visible=True,
        ).order_by('utilisateur', 'nom')

    def perform_create(self, serializer):
        user = self.request.user
        try:
            abo = user.abonnement
        except Exception:
            raise PermissionDenied("Vous n'avez pas d'abonnement actif.")

        if not abo.est_actif():
            raise PermissionDenied("Votre abonnement est expiré.")

        plan_nom = abo.get_plan_nom()
        if plan_nom == 'essai':
            raise PermissionDenied(
                "La création de catégories personnalisées n'est pas disponible en période d'essai. "
                "Passez à un plan Standard ou Entreprise."
            )

        nb_max = abo.nb_categories_autorisees()
        if nb_max != -1:
            nb_actuel = Categorie.objects.filter(utilisateur=user, is_visible=True).count()
            if nb_actuel >= nb_max:
                raise PermissionDenied(f"Limite de {nb_max} catégories atteinte.")

        serializer.save(utilisateur=user)
        enregistrer_log(user, "CATEGORIE", f"Création : {serializer.validated_data.get('nom')}", self.request)


class CategorieDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class   = CategorieSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Categorie.objects.filter(utilisateur=self.request.user, is_visible=True)

    def destroy(self, request, *args, **kwargs):
        categorie = self.get_object()
        categorie.is_visible = False
        categorie.save()
        enregistrer_log(request.user, "CATEGORIE", f"Suppression : {categorie.nom}", request)
        return Response(status=status.HTTP_204_NO_CONTENT)

