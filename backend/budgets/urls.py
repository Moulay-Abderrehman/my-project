# backend/budgets/urls.py
from django.urls import path
from .views import (
    BudgetListCreateView,
    BudgetDetailView,
    BudgetTransactionsView,
    BudgetDepensesView,
    DepenseBudgetView,
    VerifierBudgetsExpires,
    BudgetStatsView,
)

urlpatterns = [
    path('', BudgetListCreateView.as_view(), name='budgets'),
    path('<uuid:pk>/', BudgetDetailView.as_view(), name='budget-detail'),
    path('<uuid:pk>/transactions/', BudgetTransactionsView.as_view(), name='budget-transactions'),
    path('<uuid:pk>/depenses/', BudgetDepensesView.as_view(), name='budget-depenses'),
    path('<uuid:pk>/depense/', DepenseBudgetView.as_view(), name='budget-depense'),
    path('verifier-expires/', VerifierBudgetsExpires.as_view(), name='verifier-budgets-expires'),
    path('stats/', BudgetStatsView.as_view(), name='budget-stats'),
]


'''
from django.urls import path
from .views import (
    BudgetListCreateView,
    BudgetDetailView,
    BudgetDepensesView,
    DepenseBudgetView,
    VerifierBudgetsExpires,
)

urlpatterns = [
    path('', BudgetListCreateView.as_view(), name='budgets'),
    path('<uuid:pk>/', BudgetDetailView.as_view(), name='budget-detail'),
    path('<uuid:pk>/depenses/', BudgetDepensesView.as_view(), name='budget-depenses'),
    path('<uuid:pk>/depense/', DepenseBudgetView.as_view(), name='budget-depense'),
    path('verifier-expires/', VerifierBudgetsExpires.as_view(), name='verifier-budgets-expires'),
]'''