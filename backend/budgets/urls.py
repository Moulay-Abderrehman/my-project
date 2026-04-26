from django.urls import path
from .views import (
    BudgetListCreateView,
    BudgetDetailView,
    BudgetTransactionsView,
    DepenseBudgetView,
    VerifierBudgetsExpires,
)

urlpatterns = [
    path('', BudgetListCreateView.as_view(), name='budgets'),
    path('<uuid:pk>/', BudgetDetailView.as_view(), name='budget-detail'),
    path('<uuid:pk>/transactions/', BudgetTransactionsView.as_view(), name='budget-transactions'),
    path('<uuid:pk>/depense/', DepenseBudgetView.as_view(), name='budget-depense'),
    path('verifier-expires/', VerifierBudgetsExpires.as_view(), name='verifier-budgets-expires'),
]