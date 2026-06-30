import secrets
import string
import random
import uuid
import os
from datetime import timedelta
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken
from google.oauth2 import id_token
from google.auth.transport import requests
from django.contrib.auth import authenticate
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from .models import Utilisateur , KYCVerificationSession
from .serializers import UtilisateurSerializer
from django.contrib.auth.hashers import make_password
from .serializers import (
    InscriptionSerializer, ConnexionSerializer, UtilisateurSerializer,
    ChangePasswordSerializer, ContactSerializer,
    InvitationEmployeSerializer, ActivationEmployeSerializer,
    MotDePasseOublieSerializer, ReinitialisationMotDePasseSerializer,
)
from .utils import (
    generer_code_reset, sauvegarder_code_reset,
    verifier_code_reset, envoyer_email_reset,
    creer_abonnement_essai, envoyer_email_invitation,
    envoyer_email_verification_compte,
)
from logs.utils import enregistrer_log


def _est_compte_entreprise(user) -> bool:
    """
    Retourne True si l'utilisateur est de type entreprise.
    Vérifie le role ET le plan d'abonnement actif pour être robuste.
    """
    if user.role == 'entreprise':
        return True
    try:
        abo = user.abonnement
        if abo.est_actif() and abo.get_plan_nom() == 'entreprise':
            if user.role != 'entreprise':
                user.role = 'entreprise'
                user.save(update_fields=['role'])
            return True
    except Exception:
        pass
    return False


# ─── Helpers ─────────────────────────────────────────────────────────────────
def generer_code_6chiffres():
    return ''.join(random.choices(string.digits, k=6))


def generer_token_invitation():
    return secrets.token_urlsafe(32)


def envoyer_email_confirmation(user):
    """Envoie un code de confirmation à l'email de l'utilisateur pour la création de compte"""
    code = generer_code_6chiffres()
    user.code_confirmation = code
    user.code_confirmation_expire = timezone.now() + timedelta(minutes=5)
    user.save(update_fields=['code_confirmation', 'code_confirmation_expire'])
    return envoyer_email_verification_compte(user)


# ─── INSCRIPTION ──────────────────────────────────────────────────────────────
class InscriptionView(generics.CreateAPIView):
    queryset = Utilisateur.objects.all()
    serializer_class = InscriptionSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        try:
            email = request.data.get('email', '').lower()
            telephone = request.data.get('telephone', '')
            
            existing_user = Utilisateur.objects.filter(email=email).first()
            
            if existing_user:
                if existing_user.is_kyc_verified and existing_user.is_active:
                    return Response({
                        "status": "existing_user",
                        "message": "Un compte existe déjà avec cet email. Veuillez vous connecter.",
                        "user_id": str(existing_user.id),
                        "redirect_to": "/connexion"
                    }, status=status.HTTP_200_OK)
                else:
                    session = KYCVerificationSession.objects.filter(email=email).first()
                    if not session:
                        session_token = str(uuid.uuid4())
                        session = KYCVerificationSession.objects.create(
                            session_token=session_token,
                            email=email,
                            telephone=telephone,
                            password=make_password(request.data.get('password', '')),
                            nom=existing_user.nom,
                            prenom=existing_user.prenom,
                            auth_type='email',
                            expires_at=timezone.now() + timedelta(hours=24),
                            user_id=str(existing_user.id),
                        )
                    
                    code = generer_code_6chiffres()
                    existing_user.code_confirmation = code
                    existing_user.code_confirmation_expire = timezone.now() + timedelta(minutes=5)
                    existing_user.save(update_fields=['code_confirmation', 'code_confirmation_expire'])
                    
                    return Response({
                        "status": "kyc_incomplete",
                        "message": "Votre compte est incomplet. Veuillez compléter la vérification d'identité.",
                        "session_token": session.session_token,
                        "user_id": str(existing_user.id),
                        "redirect_to": "/kyc/document"
                    }, status=status.HTTP_200_OK)
            
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            validated_data = serializer.validated_data
            
            user = Utilisateur.objects.create(
                email=validated_data.get('email', '').lower(),
                telephone=validated_data.get('telephone', ''),
                nom=validated_data.get('nom', ''),
                prenom=validated_data.get('prenom', ''),
                role='binome',
                is_active=False,
                is_kyc_verified=False,
            )
            user.set_password(validated_data.get('password', ''))
            user.save()
            
            code = generer_code_6chiffres()
            user.code_confirmation = code
            user.code_confirmation_expire = timezone.now() + timedelta(minutes=5)
            user.save(update_fields=['code_confirmation', 'code_confirmation_expire'])
            
            envoyer_email_verification_compte(user)
            
            session_token = str(uuid.uuid4())
            session = KYCVerificationSession.objects.create(
                session_token=session_token,
                email=validated_data.get('email', '').lower(),
                telephone=validated_data.get('telephone', ''),
                password=make_password(validated_data.get('password', '')),
                nom=validated_data.get('nom', ''),
                prenom=validated_data.get('prenom', ''),
                auth_type='email',
                expires_at=timezone.now() + timedelta(hours=24),
                user_id=str(user.id),
            )
            
            enregistrer_log(None, "INSCRIPTION", f"Nouvelle inscription: {validated_data.get('email')}", request)
            
            return Response({
                "status": "new_user",
                "message": "Compte créé avec succès. Vérifiez votre email.",
                "session_token": session_token,
                "user_id": str(user.id),
                "redirect_to": "/verifier-email"
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            print(f"Erreur inscription: {e}")
            import traceback
            traceback.print_exc()
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


# ─── VERIFICATION EMAIL ────────────────────────────────────────────────────────
class VerifierEmailView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        code = request.data.get('code', '').strip()
        user_id = request.data.get('user_id')

        if not user_id:
            return Response({'error': 'User ID manquant.'}, status=400)

        try:
            user = Utilisateur.objects.get(id=user_id)
        except Utilisateur.DoesNotExist:
            return Response({'error': 'Utilisateur introuvable.'}, status=404)

        if not user.code_confirmation:
            return Response({'error': 'Aucun code en attente.'}, status=400)

        if timezone.now() > user.code_confirmation_expire:
            return Response({'error': 'Le code a expiré. Demandez un nouveau code.'}, status=400)

        if user.code_confirmation != code:
            return Response({'error': 'Code incorrect.'}, status=400)

        user.email_verifie = True
        user.is_active = True  
        user.code_confirmation_expire = None
        user.save(update_fields=['email_verifie', 'code_confirmation', 'code_confirmation_expire'])

        enregistrer_log(user, "EMAIL", "Email vérifié avec succès", request)
        return Response({'message': 'Email vérifié avec succès !'})


# ─── RENVOYER CODE CONFIRMATION ───────────────────────────────────────────────
class RenvoyerCodeView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({'error': 'Email requis.'}, status=400)

        try:
            user = Utilisateur.objects.get(email=email)
        except Utilisateur.DoesNotExist:
            return Response({'error': 'Email non trouvé.'}, status=404)

        if user.email_verifie:
            return Response({'error': 'Email déjà vérifié.'}, status=400)

        envoyer_email_confirmation(user)
        return Response({'message': 'Un nouveau code a été envoyé à votre email.'})


# ─── CONNEXION (VERSION CORRIGÉE) ─────────────────────────────────────────────
class ConnexionView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            email = request.data.get('email', '').lower()
            password = request.data.get('password', '')
            
            # ── Vérification 1 : L'email existe-t-il ? ──────────────────────
            try:
                user = Utilisateur.objects.get(email=email)
            except Utilisateur.DoesNotExist:
                return Response({
                    "error": "email_not_found",
                    "message": "Cette adresse email n'existe pas. Veuillez vérifier votre saisie ou créer un compte."
                }, status=status.HTTP_404_NOT_FOUND)
            
            # ── Vérification 2 : Le mot de passe est-il correct ? ────────────
            if not user.check_password(password):
                return Response({
                    "error": "invalid_password",
                    "message": "Le mot de passe est incorrect. Veuillez réessayer."
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            # ── Vérification 3 : Le compte est-il actif ? ─────────────────────
            if not user.is_active:
                return Response({
                    "error": "account_inactive",
                    "message": "Ce compte est désactivé. Veuillez contacter le support."
                }, status=status.HTTP_403_FORBIDDEN)
            
            # ── Vérification 4 : KYC est-il complété ? ───────────────────────
            if not user.is_kyc_verified:
                session = KYCVerificationSession.objects.filter(user_id=str(user.id)).first()
                
                if not session:
                    session_token = str(uuid.uuid4())
                    session = KYCVerificationSession.objects.create(
                        session_token=session_token,
                        email=user.email,
                        telephone=user.telephone,
                        password=user.password,
                        nom=user.nom,
                        prenom=user.prenom,
                        auth_type='email',
                        expires_at=timezone.now() + timedelta(hours=24),
                        user_id=str(user.id),
                    )
                
                return Response({
                    "error": "kyc_required",
                    "message": "Veuillez compléter la vérification d'identité avant de continuer.",
                    "session_token": session.session_token,
                    "user_id": str(user.id),
                    "redirect_to": "/kyc"
                }, status=status.HTTP_403_FORBIDDEN)
            
            # ── Connexion normale ─────────────────────────────────────────────
            refresh = RefreshToken.for_user(user)
            enregistrer_log(user, "CONNEXION", "Connexion réussie", request)
            
            return Response({
                "refresh": str(refresh),
                "access": str(refresh.access_token),
                "user": UtilisateurSerializer(user).data,
            })
            
        except Exception as e:
            print(f"Erreur connexion: {e}")
            import traceback
            traceback.print_exc()
            return Response({
                "error": "connexion_failed",
                "message": "Une erreur est survenue lors de la connexion."
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ─── DECONNEXION ──────────────────────────────────────────────────────────────
class DeconnexionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            token = RefreshToken(refresh_token)
            token.blacklist()
            enregistrer_log(request.user, "DECONNEXION", "Déconnexion", request)
            return Response({"message": "Déconnexion réussie."})
        except Exception:
            return Response({"error": "Token invalide."}, status=status.HTTP_400_BAD_REQUEST)


# ─── PROFIL ────────────────────────────────────────────────────────────────────
class ProfilView(generics.RetrieveUpdateAPIView):
    serializer_class = UtilisateurSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


# ─── CHANGER MOT DE PASSE ─────────────────────────────────────────────────────
class ChangerMotDePasseView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        ancien_password = request.data.get('ancien_password', '')
        nouveau_password = request.data.get('nouveau_password', '')

        if not ancien_password or not nouveau_password:
            return Response(
                {'error': 'Les deux mots de passe sont obligatoires.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if len(nouveau_password) < 6:
            return Response(
                {'error': 'Le nouveau mot de passe doit contenir au moins 6 caractères.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        user = authenticate(username=request.user.telephone, password=ancien_password)
        if not user:
            return Response(
                {'error': 'Mot de passe actuel incorrect.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        user.set_password(nouveau_password)
        user.save()
        enregistrer_log(request.user, "SECURITE", "Changement de mot de passe", request)
        return Response({'message': 'Mot de passe modifié avec succès.'})


# ─── MOT DE PASSE OUBLIE ──────────────────────────────────────────────────────
class MotDePasseOublieView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = MotDePasseOublieSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        try:
            user = Utilisateur.objects.get(email=email)
        except Utilisateur.DoesNotExist:
            return Response({'message': 'Si cet email est enregistré, un code vous a été envoyé.'})

        code = generer_code_6chiffres()
        user.code_confirmation = code
        user.code_confirmation_expire = timezone.now() + timedelta(minutes=5)
        user.save(update_fields=['code_confirmation', 'code_confirmation_expire'])
        
        envoyer_email_reset(email, code)
        
        enregistrer_log(user, "SECURITE", "Demande réinitialisation mot de passe", request)
        return Response({'message': 'Un code de réinitialisation a été envoyé à votre email.'})


# ─── REINITIALISATION MOT DE PASSE ────────────────────────────────────────────
class ReinitialisationMotDePasseView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ReinitialisationMotDePasseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        code = serializer.validated_data['code']
        nouveau_password = serializer.validated_data['nouveau_password']

        try:
            user = Utilisateur.objects.get(email=email)
        except Utilisateur.DoesNotExist:
            return Response({'error': 'Email non trouvé.'}, status=400)

        if not user.code_confirmation or user.code_confirmation != code:
            return Response({'error': 'Code incorrect.'}, status=400)

        if timezone.now() > user.code_confirmation_expire:
            return Response({'error': 'Le code a expiré. Demandez un nouveau code.'}, status=400)

        user.set_password(nouveau_password)
        user.code_confirmation = ''
        user.code_confirmation_expire = None
        user.save()

        enregistrer_log(user, "SECURITE", "Mot de passe réinitialisé", request)
        return Response({'message': 'Mot de passe réinitialisé avec succès. Vous pouvez vous connecter.'})


# ─── CONTACT ──────────────────────────────────────────────────────────────────
class ContactView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        message = request.data.get('message', '').strip()
        if not message:
            return Response({'error': 'Le message ne peut pas être vide.'}, status=400)

        user = request.user
        from notifications.models import Notification
        admin_users = Utilisateur.objects.filter(is_staff=True)
        for admin in admin_users:
            Notification.objects.create(
                utilisateur=admin,
                type='contact',
                message=(
                    f"📬 Nouveau message de {user.prenom} {user.nom} ({user.telephone})\n\n{message}"
                ),
            )
        Notification.objects.create(
            utilisateur=user,
            type='info',
            message=f" Votre message a bien été envoyé.\n\nVotre message : {message}",
        )
        enregistrer_log(user, "CONTACT", "Message de contact envoyé", request)
        return Response({'message': 'Message envoyé avec succès.'})


# ─── INVITATION EMPLOYÉ ───────────────────────────────────────────────────────
class InviterEmployeView(APIView):
    permission_classes = [IsAuthenticated]
 
    def post(self, request):
        if not _est_compte_entreprise(request.user):
            return Response(
                {'error': "Seul un compte Entreprise peut inviter des employés. "
                          "Abonnez-vous au plan Entreprise depuis votre Profil."},
                status=403
            )
 
        serializer = InvitationEmployeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email_employe = serializer.validated_data['email_employe']
 
        if (request.user.email or '').lower() == email_employe.lower():
            return Response({'error': "Vous ne pouvez pas vous inviter vous-même."}, status=400)
 
        compte_actif = Utilisateur.objects.filter(
            email__iexact=email_employe, is_active=True
        ).first()
        if compte_actif:
            return Response(
                {'error': (
                    f"L'adresse {email_employe} est déjà utilisée par un compte actif. "
                    "Utilisez une autre adresse email pour inviter cet employé."
                )},
                status=400
            )
 
        invitation_pending = Utilisateur.objects.filter(
            email__iexact=email_employe,
            is_active=False,
            token_invitation__isnull=False,
        ).first()
        if invitation_pending:
            invitation_pending.delete()
 
        token = secrets.token_urlsafe(32)
        employe = Utilisateur(
            telephone=f"+222_tmp_{secrets.token_hex(4)}",
            nom='', prenom='',
            email=email_employe,
            role='employe',
            entreprise=request.user,
            token_invitation=token,
            token_invitation_expire=timezone.now() + timedelta(days=7),
            invitation_email=email_employe,
            is_active=False,
        )
        employe.set_unusable_password()
        employe.save()
 
        lien = f"http://localhost:3000/activer-employe?token={token}"
        email_ok = envoyer_email_invitation(email_employe, request.user, lien)
 
        enregistrer_log(
            request.user, "INVITATION",
            f"Invitation : {email_employe} | email_envoye={email_ok}",
            request
        )
 
        if not email_ok:
            return Response({
                'message':  f"Invitation créée pour {email_employe}.",
                'lien':     lien,
                'warning':  "Email non envoyé (SMTP non configuré). Partagez ce lien manuellement.",
            }, status=201)
 
        return Response({
            'message': f"Invitation envoyée à {email_employe}. "
                       "L'employé recevra un lien valable 7 jours.",
        }, status=201)


class MesEmployesView(generics.ListAPIView):
    serializer_class = UtilisateurSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None
 
    def get_queryset(self):
        user = self.request.user
        if user.role != 'entreprise':
            return Utilisateur.objects.none()
        return Utilisateur.objects.filter(entreprise=user).order_by('-date_inscription')


class ListeEmployesView(generics.ListAPIView):
    serializer_class = UtilisateurSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role != 'entreprise':
            return Utilisateur.objects.none()
        return Utilisateur.objects.filter(entreprise=self.request.user, role='employe')


# ─── VÉRIFIER TOKEN INVITATION ──────────────────────────────────────────────
class VerifierInvitationView(APIView):
    permission_classes = [AllowAny]
 
    def get(self, request):
        token = request.query_params.get('token', '')
        try:
            user = Utilisateur.objects.get(token_invitation=token)
        except Utilisateur.DoesNotExist:
            return Response({'error': 'Token invalide.'}, status=404)
 
        if user.token_invitation_expire and user.token_invitation_expire < timezone.now():
            return Response({'error': 'Ce lien a expiré.'}, status=400)
 
        return Response({
            'email': user.invitation_email,
            'entreprise_nom': str(user.entreprise) if user.entreprise else '',
        })
 

# ─── ACTIVATION COMPTE EMPLOYE ──────────────────────────────────────────────
class ActiverCompteEmployeView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ActivationEmployeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            user = Utilisateur.objects.get(token_invitation=data['token'])
        except Utilisateur.DoesNotExist:
            return Response({'error': 'Token d\'invitation invalide.'}, status=400)

        if user.token_invitation_expire and timezone.now() > user.token_invitation_expire:
            return Response({'error': 'Ce lien d\'invitation a expiré.'}, status=400)

        user.telephone = data['telephone']
        user.nom = data['nom']
        user.prenom = data['prenom']
        user.set_password(data['password'])
        user.is_active = True
        user.token_invitation = None
        user.token_invitation_expire = None
        user.email_verifie = True
        user.save()

        from transactions.models import Solde
        Solde.objects.get_or_create(utilisateur=user)

        enregistrer_log(user, "ACTIVATION", "Compte employé activé", request)

        refresh = RefreshToken.for_user(user)
        return Response({
            "message": "Compte activé avec succès. Bienvenue !",
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "user": UtilisateurSerializer(user).data,
        })
    

# ─── CONNEXION GOOGLE OAUTH ───────────────────────────────────────────────────
class GoogleAuthView(APIView):
    permission_classes = [AllowAny]
 
    def post(self, request):
        import requests as req_lib
        import os
 
        code = request.data.get('code', '').strip()
        redirect_uri = request.data.get('redirect_uri', '').strip()
 
        if not code:
            return Response({'error': 'Code Google manquant.'}, status=400)
 
        GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID', '')
        GOOGLE_CLIENT_SECRET = os.environ.get('GOOGLE_CLIENT_SECRET', '')
 
        if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
            return Response({'error': "Google OAuth n'est pas configuré."}, status=500)
 
        token_resp = req_lib.post('https://oauth2.googleapis.com/token', data={
            'code': code,
            'client_id': GOOGLE_CLIENT_ID,
            'client_secret': GOOGLE_CLIENT_SECRET,
            'redirect_uri': redirect_uri,
            'grant_type': 'authorization_code',
        }, timeout=10)
 
        if token_resp.status_code != 200:
            return Response({'error': "Impossible d'échanger le code Google."}, status=400)
 
        token_data = token_resp.json()
        access_token = token_data.get('access_token')
 
        profile_resp = req_lib.get(
            'https://www.googleapis.com/oauth2/v2/userinfo',
            headers={'Authorization': f'Bearer {access_token}'},
            timeout=10
        )
        if profile_resp.status_code != 200:
            return Response({'error': 'Impossible de récupérer le profil Google.'}, status=400)
 
        profile = profile_resp.json()
        google_id = profile.get('id')
        email = (profile.get('email') or '').lower()
        prenom = profile.get('given_name') or profile.get('name', 'Utilisateur').split()[0]
        nom = profile.get('family_name') or (profile.get('name', '').split()[-1] if ' ' in profile.get('name', '') else 'Google')
        photo = profile.get('picture', '')
        email_ok = profile.get('verified_email', False)
 
        if not email or not google_id:
            return Response({'error': 'Profil Google incomplet.'}, status=400)
 
        user = None
        need_password_setup = False
 
        # Chercher par google_id
        try:
            user = Utilisateur.objects.get(google_id=google_id)
            user.email = email
            user.email_verifie = email_ok
            user.google_photo = photo
            user.save(update_fields=['email', 'email_verifie', 'google_photo'])
            if not user.has_usable_password():
                need_password_setup = True
        except Utilisateur.DoesNotExist:
            pass
 
        # Chercher par email
        if not user:
            existing_user = Utilisateur.objects.filter(email=email).first()
            if existing_user:
                # Email existe déjà - retourner une erreur spécifique
                return Response({
                    "email_exists": True,
                    "message": "Cette adresse email est déjà associée à un compte existant. Veuillez vous connecter avec vos identifiants habituels."
                }, status=status.HTTP_409_CONFLICT)
            else:
                user = Utilisateur.objects.create_google_user(
                    email=email, google_id=google_id, nom=nom, prenom=prenom,
                    google_photo=photo, email_verifie=email_ok,
                )
                need_password_setup = True
 
        if not user:
            user = Utilisateur.objects.create_google_user(
                email=email, google_id=google_id, nom=nom, prenom=prenom,
                google_photo=photo, email_verifie=email_ok,
            )
            need_password_setup = True
            from transactions.models import Solde
            Solde.objects.get_or_create(utilisateur=user)
            from .utils import creer_abonnement_essai
            creer_abonnement_essai(user)
 
        if need_password_setup:
            return Response({
                "need_password_setup": True,
                "user": UtilisateurSerializer(user).data,
            })
 
        if not user.is_kyc_verified:
            return Response({
                "need_password_setup": False,
                "kyc_required": True,
                "user": UtilisateurSerializer(user).data,
            })
 
        refresh = RefreshToken.for_user(user)
        enregistrer_log(user, "CONNEXION_GOOGLE", f"Connexion Google : {email}", request)
        return Response({
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "user": UtilisateurSerializer(user).data,
            "need_password_setup": False,
            "kyc_required": False,
        })


class GoogleSetPasswordView(APIView):
    permission_classes = [AllowAny]
 
    def post(self, request):
        user_id = request.data.get('user_id')
        password = request.data.get('password')
        confirm_password = request.data.get('confirm_password')
 
        if not user_id or not password:
            return Response({'error': 'Tous les champs sont obligatoires.'}, status=400)
        if password != confirm_password:
            return Response({'error': 'Les mots de passe ne correspondent pas.'}, status=400)
        if len(password) < 6:
            return Response({'error': 'Le mot de passe doit contenir au moins 6 caractères.'}, status=400)
 
        try:
            user = Utilisateur.objects.get(id=user_id, google_id__isnull=False)
            user.set_password(password)
            user.save()
 
            return Response({
                'message': 'Mot de passe créé. Passez à la vérification de kyc.',
                'user_id': str(user.id),
                'kyc_required': not user.is_kyc_verified,
            })
            
        except Utilisateur.DoesNotExist:
            return Response({'error': 'Utilisateur non trouvé.'}, status=404)