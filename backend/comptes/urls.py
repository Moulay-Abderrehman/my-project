from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    InscriptionView, ConnexionView, DeconnexionView, ProfilView,
    ChangerMotDePasseView, ContactView,
    VerifierEmailView, RenvoyerCodeView,
    MotDePasseOublieView, ReinitialisationMotDePasseView,
    InviterEmployeView, ListeEmployesView, MesEmployesView, ActiverCompteEmployeView, GoogleAuthView,GoogleSetPasswordView,
)
from .sso import SSOCallbackView, SSORedirectView



urlpatterns = [
    # Auth de base
    path('inscription/', InscriptionView.as_view(), name='inscription'),
    path('connexion/', ConnexionView.as_view(), name='connexion'),
    path('deconnexion/', DeconnexionView.as_view(), name='deconnexion'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('profil/', ProfilView.as_view(), name='profil'),
    path('changer-mot-de-passe/', ChangerMotDePasseView.as_view(), name='changer-mdp'),
    path('contact/', ContactView.as_view(), name='contact'),

    # Email
    path('verifier-email/', VerifierEmailView.as_view(), name='verifier-email'),
    path('renvoyer-code/', RenvoyerCodeView.as_view(), name='renvoyer-code'),

    # Mot de passe oublié
    path('mot-de-passe-oublie/', MotDePasseOublieView.as_view(), name='mdp-oublie'),
    path('reinitialiser-mot-de-passe/', ReinitialisationMotDePasseView.as_view(), name='reinit-mdp'),

    # Entreprise / Employés
    path('inviter-employe/', InviterEmployeView.as_view(), name='inviter-employe'),
     path('mes-employes/', MesEmployesView.as_view(), name='mes-employes'),
    path('mes-employes/', ListeEmployesView.as_view(), name='mes-employes'),
    path('activer-employe/', ActiverCompteEmployeView.as_view(), name='activer-employe'),
    # ... autres URLs ...
    path('google-set-password/', GoogleSetPasswordView.as_view(), name='google-set-password'),
    # ... reste des URLs ...
    # Google:
    path('auth/google/', GoogleAuthView.as_view(), name='google-auth'),


    path('auth/sso/', SSORedirectView.as_view(), name='sso-redirect'),
    path('auth/sso/callback/', SSOCallbackView.as_view(), name='sso-callback'),
    
    ]