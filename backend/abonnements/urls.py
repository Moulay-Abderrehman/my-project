from django.urls import path
from .views import (
    PlanListView,
    DemanderCodeSouscriptionView,
    SouscriptionView,
    AbonnementDetailView,
    PaiementListView,
    AbonnementStatutView, #Nouveau
)

urlpatterns = [
    path('plans/',             PlanListView.as_view(),                  name='plans'),
    path('demander-code/',     DemanderCodeSouscriptionView.as_view(),  name='demander-code-abo'),
    path('souscrire/',         SouscriptionView.as_view(),              name='souscrire'),
    path('detail/',            AbonnementDetailView.as_view(),          name='abonnement-detail'),
    path('paiements/',         PaiementListView.as_view(),              name='paiements'),

    path('statut/', AbonnementStatutView.as_view(), name='abonnement-statut'),  # Nouveau

]



