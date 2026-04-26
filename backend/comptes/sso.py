# backend/comptes/sso.py
import requests
import jwt
from django.conf import settings
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
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

        # Construire l'URL d'autorisation SSO selon la doc
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

    def post(self, request):
        code = request.data.get('code')
        domain = request.data.get('domain')

        if not code:
            return Response({'error': 'Code SSO manquant'}, status=400)

        # Étape 1 : Échanger le code contre des tokens
        token_data = {
            'grant_type': 'authorization_code',
            'code': code,
            'redirect_uri': settings.SSO_REDIRECT_URI,
            'client_id': settings.SSO_CLIENT_ID,
            'client_secret': settings.SSO_CLIENT_SECRET,
        }

        try:
            token_resp = requests.post(
                settings.SSO_TOKEN_URL,
                data=token_data,
                timeout=10,
                verify=False  # Pour les tests (à enlever en production)
            )
            
            if token_resp.status_code != 200:
                print(f"SSO Token error: {token_resp.text}")
                return Response(
                    {'error': 'Échange de code échoué', 'details': token_resp.text},
                    status=400
                )

            tokens = token_resp.json()
            access_token = tokens.get('access_token')
            id_token = tokens.get('id_token')

            # Étape 2 : Récupérer les informations utilisateur
            userinfo_resp = requests.get(
                settings.SSO_USERINFO_URL,
                headers={'Authorization': f'Bearer {access_token}'},
                timeout=10,
                verify=False
            )

            if userinfo_resp.status_code != 200:
                print(f"SSO Userinfo error: {userinfo_resp.text}")
                return Response(
                    {'error': 'Impossible de récupérer le profil utilisateur'},
                    status=400
                )

            userinfo = userinfo_resp.json()
            
            # Extraire les informations
            email = userinfo.get('email', '').lower()
            prenom = userinfo.get('given_name', '')
            nom = userinfo.get('family_name', '')
            email_verifie = userinfo.get('email_verified', False)

            if not email:
                return Response({'error': 'Email non fourni par le SSO'}, status=400)

            # Étape 3 : Vérifier si l'utilisateur existe déjà dans FinanceApp
            user = None
            is_new = False

            # Chercher par email
            try:
                user = Utilisateur.objects.get(email__iexact=email)
            except Utilisateur.DoesNotExist:
                pass

            # Créer un nouvel utilisateur si nécessaire
            if not user:
                is_new = True
                # Générer un numéro de téléphone unique pour le compte SSO
                import uuid
                phone = f"+222_sso_{uuid.uuid4().hex[:8]}"
                
                user = Utilisateur.objects.create_user(
                    telephone=phone,
                    nom=nom or 'SSO',
                    prenom=prenom or 'Utilisateur',
                    email=email,
                    is_active=True
                )
                user.email_verifie = email_verifie
                user.save(update_fields=['email_verifie'])
                
                # Créer le solde et l'abonnement essai
                from transactions.models import Solde
                from .utils import creer_abonnement_essai
                Solde.objects.get_or_create(utilisateur=user)
                creer_abonnement_essai(user)

            # Étape 4 : Générer les tokens JWT FinanceApp
            refresh = RefreshToken.for_user(user)
            
            # Enregistrer le log
            action = "CONNEXION_SSO" + ("_NOUVEAU" if is_new else "")
            enregistrer_log(user, action, f"Connexion via SSO : {email}", request)

            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': UtilisateurSerializer(user).data,
                'is_new': is_new,
            })

        except requests.exceptions.Timeout:
            return Response({'error': 'Timeout de connexion au serveur SSO'}, status=504)
        except requests.exceptions.ConnectionError:
            return Response({'error': 'Impossible de contacter le serveur SSO'}, status=503)
        except Exception as e:
            print(f"SSO Exception: {str(e)}")
            return Response({'error': 'Erreur interne lors de la connexion SSO'}, status=500)

