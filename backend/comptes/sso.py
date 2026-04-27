# backend/comptes/sso.py
import requests
import uuid
from django.conf import settings
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.http import HttpResponseRedirect
from urllib.parse import urlencode
from .models import Utilisateur
from .serializers import UtilisateurSerializer
from logs.utils import enregistrer_log


class SSORedirectView(APIView):
    """Endpoint qui renvoie l'URL de redirection vers le serveur SSO"""
    permission_classes = [AllowAny]

    def get(self, request):
        domain = request.query_params.get('domain', '')
        if not domain:
            return Response({'error': 'Domaine requis'}, status=400)

        auth_url = (
            f"{settings.SSO_AUTHORIZATION_URL}"
            f"?response_type=code"
            f"&client_id={settings.SSO_CLIENT_ID}"
            f"&redirect_uri={settings.SSO_REDIRECT_URI}"
            f"&scope=openid%20profile%20email"
            f"&state={domain}"
        )
        
        return Response({'auth_url': auth_url})


class SSOCallbackView(APIView):
    """Endpoint qui reçoit le code SSO et échange contre des tokens"""
    permission_classes = [AllowAny]

    def get(self, request):
        code = request.GET.get('code')
        if not code:
            return Response({'error': 'Code manquant'}, status=400)

        print(f"[SSO] Code reçu: {code}")

        # Étape 1 : Échanger le code contre des tokens
        try:
            token_resp = requests.post(
                settings.SSO_TOKEN_URL,
                data={
                    'grant_type': 'authorization_code',
                    'code': code,
                    'redirect_uri': settings.SSO_REDIRECT_URI,
                    'client_id': settings.SSO_CLIENT_ID,
                    'client_secret': settings.SSO_CLIENT_SECRET,
                },
                verify=False
            )

            if token_resp.status_code != 200:
                print(f"[SSO] Erreur échange code: {token_resp.text}")
                return Response({'error': 'Échange de code échoué'}, status=400)

            tokens = token_resp.json()
            access_token = tokens.get('access_token')
            print(f"[SSO] Access token obtenu: {access_token[:20]}...")

        except Exception as e:
            print(f"[SSO] Exception échange code: {str(e)}")
            return Response({'error': 'Erreur lors de l\'échange du code'}, status=500)

        # Étape 2 : Récupérer les informations utilisateur
        try:
            userinfo_resp = requests.get(
                f"{settings.SSO_API_BASE_URL}/api/user/me/",
                headers={'Authorization': f'Bearer {access_token}'},
                verify=False
            )

            if userinfo_resp.status_code != 200:
                print(f"[SSO] Erreur userinfo: {userinfo_resp.text}")
                return Response({'error': 'Impossible de récupérer le profil'}, status=400)

            userinfo = userinfo_resp.json()
            print(f"[SSO] Userinfo reçu: {userinfo}")

        except Exception as e:
            print(f"[SSO] Exception userinfo: {str(e)}")
            return Response({'error': 'Erreur lors de la récupération du profil'}, status=500)
        
        email = userinfo.get('email')
        prenom = userinfo.get('first_name', '')
        nom = userinfo.get('last_name', '')
        telephone = userinfo.get('phone')
        is_new = False

        if not email:
            return Response({'error': 'Email non fourni par le SSO'}, status=400)

        # Étape 3 : Créer ou récupérer l'utilisateur dans FinanceApp
        try:
            user = Utilisateur.objects.get(email__iexact=email)
            print(f"[SSO] Utilisateur existant trouvé: {user.email}")
        except Utilisateur.DoesNotExist:
            is_new = True
            if not telephone:
                telephone = f"+222_sso_{uuid.uuid4().hex[:8]}"
            
            user = Utilisateur.objects.create(
                telephone=telephone,
                nom=nom or 'SSO',
                prenom=prenom or 'Utilisateur',
                email=email,
                is_active=True
            )
            user.set_unusable_password()
            user.email_verifie = True
            user.save()
            print(f"[SSO] Nouvel utilisateur créé: {user.email}")
            
            # Créer le solde et l'abonnement essai
            from transactions.models import Solde
            from .utils import creer_abonnement_essai
            Solde.objects.get_or_create(utilisateur=user)
            creer_abonnement_essai(user)

        # Étape 4 : Générer les tokens JWT FinanceApp
        refresh = RefreshToken.for_user(user)
        access = str(refresh.access_token)
        refresh_token = str(refresh)
        
        enregistrer_log(user, "CONNEXION_SSO" + ("_NOUVEAU" if is_new else ""), f"Connexion via SSO : {email}", request)

        # Étape 5 : Rediriger vers le frontend avec les tokens
        frontend_url = f"{settings.FRONTEND_URL}/auth/sso/callback"
        params = {
            'access': access,
            'refresh': refresh_token,
            'user': UtilisateurSerializer(user).data
        }
        
        # Convertir l'objet user en JSON sérialisé
        import json
        params['user'] = json.dumps(UtilisateurSerializer(user).data)
        
        redirect_url = f"{frontend_url}?{urlencode(params)}"
        print(f"[SSO] Redirection vers: {redirect_url[:100]}...")
        
        return HttpResponseRedirect(redirect_url)