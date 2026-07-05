# backend/abonnements/urls.py
from django.urls import path
from .views import (
    # ── Vues existantes ──────────────────────────────────────────────────────
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
    PlanPublicListView,
    InitierModeVisiteurView,
    VisitorDemoDataView,
    VisitorStatsView,
    ConvertVisitorToUserView,
    VisitorInvitationMessagesView,
    VisitorSessionExpirationView,
)

urlpatterns = [
    
    path('plans/',             PlanListView.as_view(),                  name='plans'),
    path('demander-code/',     DemanderCodeSouscriptionView.as_view(),  name='demander-code-abo'),
    path('souscrire/',         SouscriptionView.as_view(),              name='souscrire'),
    path('detail/',            AbonnementDetailView.as_view(),          name='abonnement-detail'),
    path('paiements/',         PaiementListView.as_view(),              name='paiements'),
    path('statut/',            AbonnementStatutView.as_view(),          name='abonnement-statut'),
    path('comptes-encaissement/',       ComptesEncaissementView.as_view(),    name='comptes-encaissement'),
    path('initier-paiement/',           InitierPaiementView.as_view(),        name='initier-paiement'),
    path('statut-paiement-en-cours/',   StatutPaiementEnCoursView.as_view(),  name='statut-paiement-en-cours'),

    # ── Flux de paiement automatique TrackPay ─────────────────────────────────
    path('initier-paiement-trackpay/',  InitierPaiementTrackPayView.as_view(), name='initier-paiement-trackpay'),
    path('webhook-trackpay/',           TrackPayWebhookView.as_view(),         name='webhook-trackpay'),
    path('previsualiser-renouvellement/', PrevisualiserRenouvellementView.as_view(), name='previsualiser-renouvellement'),

    path('plans-publics/',              PlanPublicListView.as_view(),          name='plans-publics'),
    path('initier-visiteur/',           InitierModeVisiteurView.as_view(),     name='initier-visiteur'),
    path('visiteur-demo-data/',         VisitorDemoDataView.as_view(),         name='visiteur-demo-data'),
    path('visiteur-stats/',             VisitorStatsView.as_view(),            name='visiteur-stats'),
    path('convertir-visiteur/',         ConvertVisitorToUserView.as_view(),    name='convertir-visiteur'),
    path('visiteur-invitations/',       VisitorInvitationMessagesView.as_view(), name='visiteur-invitations'),
    path('visiteur-session/',           VisitorSessionExpirationView.as_view(), name='visiteur-session'),
]