import secrets
import string
import random
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
from .models import Utilisateur
from .serializers import UtilisateurSerializer

from .models import Utilisateur
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
)
from logs.utils import enregistrer_log
# Ajouter:
def _est_compte_entreprise(user) -> bool:
    """
    Retourne True si l'utilisateur est de type entreprise.
    Vérifie le role ET le plan d'abonnement actif pour être robuste.
    """
    # Vérification 1 : via le champ role
    if user.role == 'entreprise':
        return True
    # Vérification 2 : via l'abonnement actif (cas où le role n'a pas encore été mis à jour)
    try:
        abo = user.abonnement
        if abo.est_actif() and abo.get_plan_nom() == 'entreprise':
            # Synchroniser le role si nécessaire
            if user.role != 'entreprise':
                user.role = 'entreprise'
                user.save(update_fields=['role'])
            return True
    except Exception:
        pass
    return False

# fin


# ─── Helpers ─────────────────────────────────────────────────────────────────
def generer_code_6chiffres():
    return ''.join(random.choices(string.digits, k=6))


def generer_token_invitation():
    return secrets.token_urlsafe(32)


def envoyer_email_confirmation(user):
    """Envoie un code de confirmation à l'email de l'utilisateur"""
    code = generer_code_6chiffres()
    user.code_confirmation = code
    user.code_confirmation_expire = timezone.now() + timedelta(minutes=5)
    user.save(update_fields=['code_confirmation', 'code_confirmation_expire'])
    
    sujet = "FinanceApp — Code de confirmation"
    message_texte = f"Votre code de confirmation est : {code}\nValable 5 minutes."
    
    message_html = f"""
    <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:30px;background:#f8fafc;border-radius:16px;">
        <div style="text-align:center;margin-bottom:24px;">
            <div style="display:inline-block;background:linear-gradient(135deg,#0c2e7c,#1e4db7);border-radius:12px;padding:12px 28px;">
                <span style="color:#fff;font-weight:800;font-size:20px;">FinanceApp</span>
            </div>
        </div>
        <div style="background:#fff;border-radius:12px;padding:28px;box-shadow:0 2px 12px rgba(0,0,0,0.07);">
            <h2 style="margin:0 0 12px;color:#1e293b;">Confirmation de votre compte</h2>
            <p style="color:#64748b;font-size:14px;margin:0 0 20px;">
                Bonjour <strong>{user.prenom} {user.nom}</strong>,<br>
                Voici votre code de confirmation :
            </p>
            <div style="text-align:center;background:#eef2ff;border-radius:12px;padding:20px;margin-bottom:20px;">
                <span style="font-size:36px;font-weight:800;letter-spacing:10px;color:#0c2e7c;">{code}</span>
            </div>
            <p style="color:#94a3b8;font-size:12px;margin:0;">
                Code valable 5 minutes. Si vous n'avez pas créé de compte, ignorez cet email.
            </p>
        </div>
        <p style="text-align:center;margin-top:16px;color:#94a3b8;font-size:11px;">© 2025 FinanceApp</p>
    </div>
    """
    
    try:
        send_mail(
            subject=sujet,
            message=message_texte,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            html_message=message_html,
            fail_silently=False,
        )
        print(f"[EMAIL] ✅ Code envoyé à {user.email}")
        return True
    except Exception as e:
        print(f"[EMAIL] ❌ Erreur envoi à {user.email}: {e}")
        return False
    

   # remplacer
'''
def envoyer_email_confirmation(user):
    code = generer_code_6chiffres()
    user.code_confirmation = code
    user.code_confirmation_expire = timezone.now() + timedelta(minutes=5)
    user.save(update_fields=['code_confirmation', 'code_confirmation_expire'])
    try:
        send_mail(
            subject='FinanceApp — Votre code de confirmation',
            message=(
                f"Bonjour {user.prenom},\n\n"
                f"Votre code de confirmation est : {code}\n"
                f"Ce code expire dans 5 minutes.\n\n"
                f"Si vous n'avez pas demandé ce code, ignorez cet email.\n\n"
                f"L'équipe FinanceApp"
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )
    except Exception as e:
        # On log mais on ne bloque pas l'inscription
        print(f"[EMAIL] Erreur envoi email confirmation: {e}")
'''

# ─── INSCRIPTION ──────────────────────────────────────────────────────────────
class InscriptionView(generics.CreateAPIView):
    queryset = Utilisateur.objects.all()
    serializer_class = InscriptionSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Créer le solde initial
        from transactions.models import Solde
        Solde.objects.get_or_create(utilisateur=user)

        # Créer l'abonnement essai gratuit 14 jours (rôle binome)
        from abonnements.models import Abonnement
        Abonnement.objects.get_or_create(
            utilisateur=user,
            defaults={
                'type': 'essai',
                'date_debut': timezone.now(),
                'date_fin': timezone.now() + timedelta(days=14),
                'statut': 'actif',
                'montant': 0,
            }
        )

        # Envoyer le code de confirmation email
        if user.email:
            envoyer_email_confirmation(user)

        enregistrer_log(user, "INSCRIPTION", "Nouveau compte créé", request)

        return Response(
            {
                "message": "Compte créé avec succès. Vérifiez votre email pour confirmer votre adresse.",
                 "user_id": str(user.id),  # <-- AJOUTER
                "user": UtilisateurSerializer(user).data,
            },
            status=status.HTTP_201_CREATED
        )


# ─── VERIFICATION EMAIL ────────────────────────────────────────────────────────
'''class VerifierEmailView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        code = request.data.get('code', '').strip()
        user = request.user

        if not user.code_confirmation:
            return Response({'error': 'Aucun code en attente.'}, status=400)

        if timezone.now() > user.code_confirmation_expire:
            return Response({'error': 'Le code a expiré. Demandez un nouveau code.'}, status=400)

        if user.code_confirmation != code:
            return Response({'error': 'Code incorrect.'}, status=400)

        user.email_verifie = True
        user.code_confirmation = ''
        user.code_confirmation_expire = None
        user.save(update_fields=['email_verifie', 'code_confirmation', 'code_confirmation_expire'])

        enregistrer_log(user, "EMAIL", "Email vérifié avec succès", request)
        return Response({'message': 'Email vérifié avec succès !'})
'''
# backend/comptes/views.py - Modifier VerifierEmailView

class VerifierEmailView(APIView):
    permission_classes = [AllowAny]  # Changé de IsAuthenticated à AllowAny

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
        user.code_confirmation = ''
        user.code_confirmation_expire = None
        user.save(update_fields=['email_verifie', 'code_confirmation', 'code_confirmation_expire'])

        enregistrer_log(user, "EMAIL", "Email vérifié avec succès", request)
        return Response({'message': 'Email vérifié avec succès !'})
    


# ─── RENVOYER CODE CONFIRMATION ───────────────────────────────────────────────
class RenvoyerCodeView(APIView):
    permission_classes = [AllowAny]  # Changé de IsAuthenticated à AllowAny permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        if not user.email:
            return Response({'error': 'Aucun email associé à ce compte.'}, status=400)
        if user.email_verifie:
            return Response({'error': 'Email déjà vérifié.'}, status=400)
        envoyer_email_confirmation(user)
        return Response({'message': 'Un nouveau code a été envoyé à votre email.'})


# ─── CONNEXION ─────────────────────────────────────────────────────────────────
class ConnexionView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ConnexionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        refresh = RefreshToken.for_user(user)
        enregistrer_log(user, "CONNEXION", "Connexion réussie", request)
        return Response({
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "user": UtilisateurSerializer(user).data,
        })


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


# ─── MOT DE PASSE OUBLIE (envoi code par email) ───────────────────────────────
class MotDePasseOublieView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = MotDePasseOublieSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        try:
            user = Utilisateur.objects.get(email=email)
        except Utilisateur.DoesNotExist:
            # Sécurité : ne pas révéler si l'email existe
            return Response({'message': 'Si cet email est enregistré, un code vous a été envoyé.'})

        envoyer_email_confirmation(user)
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
            message=f"✅ Votre message a bien été envoyé.\n\nVotre message : {message}",
        )
        enregistrer_log(user, "CONTACT", "Message de contact envoyé", request)
        return Response({'message': 'Message envoyé avec succès.'})


# Ajoute:
# ─── INVITATION EMPLOYÉ ───────────────────────────────────────────────────────
class InviterEmployeView(APIView):
    permission_classes = [IsAuthenticated]
 
    def post(self, request):
        # ── Vérification entreprise ───────────────────────────────────────────
        if not _est_compte_entreprise(request.user):
            return Response(
                {'error': "Seul un compte Entreprise peut inviter des employés. "
                          "Abonnez-vous au plan Entreprise depuis votre Profil."},
                status=403
            )
 
        serializer = InvitationEmployeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email_employe = serializer.validated_data['email_employe']
 
        # ── Cas : se-même ────────────────────────────────────────────────────
        if (request.user.email or '').lower() == email_employe.lower():
            return Response({'error': "Vous ne pouvez pas vous inviter vous-même."}, status=400)
 
        # ── Cas : email déjà associé à un compte actif ───────────────────────
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
 
        # ── Cas : invitation déjà en attente → supprimer et renvoyer ─────────
        invitation_pending = Utilisateur.objects.filter(
            email__iexact=email_employe,
            is_active=False,
            token_invitation__isnull=False,
        ).first()
        if invitation_pending:
            # Supprimer l'ancienne invitation pour en créer une nouvelle
            invitation_pending.delete()
 
        # ── Créer l'invitation ────────────────────────────────────────────────
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
 
        # ── Envoyer l'email ───────────────────────────────────────────────────
        lien = f"http://localhost:3000/activer-employe?token={token}"
        email_ok = envoyer_email_invitation(email_employe, request.user, lien)
 
        enregistrer_log(
            request.user, "INVITATION",
            f"Invitation : {email_employe} | email_envoye={email_ok}",
            request
        )
 
        if not email_ok:
            # Invitation créée mais email non envoyé (SMTP non configuré)
            # On retourne le lien pour permettre un partage manuel
            return Response({
                'message':  f"Invitation créée pour {email_employe}.",
                'lien':     lien,
                'warning':  "Email non envoyé (SMTP non configuré). Partagez ce lien manuellement.",
            }, status=201)
 
        return Response({
            'message': f"Invitation envoyée à {email_employe}. "
                       "L'employé recevra un lien valable 7 jours.",
        }, status=201)
# fin

class MesEmployesView(generics.ListAPIView):
    """
    Retourne la liste des employés liés au compte entreprise connecté.
    Accessible uniquement aux utilisateurs de type 'entreprise'.
    """
    serializer_class   = UtilisateurSerializer
    permission_classes = [IsAuthenticated]
    pagination_class   = None
 
    def get_queryset(self):
        user = self.request.user
        if user.role != 'entreprise':
            return Utilisateur.objects.none()
        return Utilisateur.objects.filter(entreprise=user).order_by('-date_inscription')
 

# ─── LISTE EMPLOYES (par l'entreprise) ───────────────────────────────────────
class ListeEmployesView(generics.ListAPIView):
    serializer_class = UtilisateurSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role != 'entreprise':
            return Utilisateur.objects.none()
        return Utilisateur.objects.filter(entreprise=self.request.user, role='employe')


# ─── VÉRIFIER TOKEN INVITATION ────────────────────────────
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
 
# ─── ACTIVATION COMPTE EMPLOYE (via lien invitation) ─────────────────────────
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

        # Activer le compte
        user.telephone = data['telephone']
        user.nom = data['nom']
        user.prenom = data['prenom']
        user.set_password(data['password'])
        user.is_active = True
        user.token_invitation = None
        user.token_invitation_expire = None
        user.email_verifie = True
        user.save()

        # Créer le solde
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
            return Response(
                {'error': 'Google OAuth n\'est pas configuré sur le serveur.'},
                status=500
            )

        token_resp = req_lib.post('https://oauth2.googleapis.com/token', data={
            'code': code,
            'client_id': GOOGLE_CLIENT_ID,
            'client_secret': GOOGLE_CLIENT_SECRET,
            'redirect_uri': redirect_uri,
            'grant_type': 'authorization_code',
        }, timeout=10)

        if token_resp.status_code != 200:
            return Response({'error': 'Impossible d\'échanger le code Google.'}, status=400)

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
            # Vérifier si l'utilisateur a déjà un mot de passe
            if not user.has_usable_password():
                need_password_setup = True
        except Utilisateur.DoesNotExist:
            pass

        # Chercher par email
        if not user:
            try:
                user = Utilisateur.objects.get(email__iexact=email)
                user.google_id = google_id
                user.email_verifie = email_ok
                user.google_photo = photo
                user.save(update_fields=['google_id', 'email_verifie', 'google_photo'])
                if not user.has_usable_password():
                    need_password_setup = True
            except Utilisateur.DoesNotExist:
                pass

        # Créer un nouvel utilisateur
        if not user:
            user = Utilisateur.objects.create_google_user(
                email=email,
                google_id=google_id,
                nom=nom,
                prenom=prenom,
                google_photo=photo,
                email_verifie=email_ok,
            )
            # Nouvel utilisateur → besoin de définir un mot de passe
            need_password_setup = True
            
            # Solde + abonnement essai
            from transactions.models import Solde
            Solde.objects.get_or_create(utilisateur=user)
            from .utils import creer_abonnement_essai
            creer_abonnement_essai(user)

        # Si l'utilisateur n'a pas de mot de passe, on demande d'en créer un
        if need_password_setup:
            return Response({
                "need_password_setup": True,
                "user": UtilisateurSerializer(user).data,
            })

        # Sinon connexion normale
        refresh = RefreshToken.for_user(user)
        enregistrer_log(user, "CONNEXION_GOOGLE", f"Connexion Google : {email}", request)

        return Response({
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "user": UtilisateurSerializer(user).data,
            "need_password_setup": False,
        })


class GoogleSetPasswordView(APIView):
    """
    Permet à un utilisateur connecté via Google de définir un mot de passe
    pour pouvoir se connecter avec email + mot de passe par la suite.
    """
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
        except Utilisateur.DoesNotExist:
            return Response({'error': 'Utilisateur Google introuvable.'}, status=404)

        # Définir le mot de passe
        user.set_password(password)
        user.save()

        # Générer les tokens JWT
        refresh = RefreshToken.for_user(user)

        enregistrer_log(user, "GOOGLE_PASSWORD", "Mot de passe défini après connexion Google", request)

        return Response({
            "message": "Mot de passe créé avec succès.",
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "user": UtilisateurSerializer(user).data,
        })

