# backend/transactions/urls.py
from django.urls import path
from .views import (
    TransactionListCreateView, TransactionDetailView,
    SoldeView, DashboardView,
    CategorieListCreateView, CategorieDetailView,
    ToutesTransactionsView,
    AbonnementStatutView,
)

urlpatterns = [
    path('', TransactionListCreateView.as_view(), name='transactions'),
    path('<uuid:pk>/', TransactionDetailView.as_view(), name='transaction-detail'),
    path('solde/', SoldeView.as_view(), name='solde'),
    path('dashboard/', DashboardView.as_view(), name='dashboard'),
    path('categories/', CategorieListCreateView.as_view(), name='categorie-list-create'),
    path('categories/<uuid:pk>/', CategorieDetailView.as_view(), name='categorie-detail'),
    path('toutes/', ToutesTransactionsView.as_view(), name='toutes-transactions'),
    path('abonnement-statut/', AbonnementStatutView.as_view(), name='abonnement-statut'),
]