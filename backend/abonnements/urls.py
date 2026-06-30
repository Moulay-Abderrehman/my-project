from django.urls import path
from .views import (
    PlanListView,
    DemanderCodeSouscriptionView,
    SouscriptionView,
    AbonnementDetailView,
    PaiementListView,
    AbonnementStatutView,
    ComptesEncaissementView,
    InitierPaiementView,
    StatutPaiementEnCoursView,
    InitierPaiementTrackPayView,    
    TrackPayWebhookView,            
    PrevisualiserRenouvellementView,  
)

urlpatterns = [
    path('plans/',             PlanListView.as_view(),                  name='plans'),
    path('demander-code/',     DemanderCodeSouscriptionView.as_view(),  name='demander-code-abo'),
    path('souscrire/',         SouscriptionView.as_view(),              name='souscrire'),
    path('detail/',            AbonnementDetailView.as_view(),          name='abonnement-detail'),
    path('paiements/',         PaiementListView.as_view(),              name='paiements'),

    path('statut/', AbonnementStatutView.as_view(), name='abonnement-statut'),

    # ── Flux de paiement avec validation manuelle admin ──────────────────────
    path('comptes-encaissement/',       ComptesEncaissementView.as_view(),    name='comptes-encaissement'),
    path('initier-paiement/',           InitierPaiementView.as_view(),        name='initier-paiement'),
    path('statut-paiement-en-cours/',   StatutPaiementEnCoursView.as_view(),  name='statut-paiement-en-cours'),

    # ── NOUVEAU — Flux de paiement automatique TrackPay ──────────────────────
    path('initier-paiement-trackpay/',  InitierPaiementTrackPayView.as_view(), name='initier-paiement-trackpay'),
    path('webhook-trackpay/',           TrackPayWebhookView.as_view(),         name='webhook-trackpay'),
    path('previsualiser-renouvellement/', PrevisualiserRenouvellementView.as_view(), name='previsualiser-renouvellement'),
]