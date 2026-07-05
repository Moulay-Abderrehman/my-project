import re
import secrets
from django.utils import timezone
from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import Utilisateur, KYCVerificationSession


# ─── INSCRIPTION ──────────────────────────────────────────────────────────────
class InscriptionSerializer(serializers.ModelSerializer):
    password         = serializers.CharField(write_only=True, min_length=6)
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model  = Utilisateur
        fields = ['nom', 'prenom', 'telephone', 'email', 'password', 'password_confirm']
        extra_kwargs = {'email': {'required': True}}  # Email obligatoire maintenant

    def validate_telephone(self, value):
        pattern = r'^\+222[234]\d{7}$'
        if not re.match(pattern, value):
            raise serializers.ValidationError(
                "Format invalide. Exemple : +222XXXXXXXX (doit commencer par 2, 3 ou 4)"
            )
        return value

    def validate_email(self, value):
        if not value:
            raise serializers.ValidationError("L'email est obligatoire.")
        pattern = r'^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$'
        if not re.match(pattern, value):
            raise serializers.ValidationError("Format d'email invalide.")
        if Utilisateur.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Cet email est déjà utilisé.")
        return value.lower()

    def validate(self, data):
        if data.get('password') != data.get('password_confirm'):
            raise serializers.ValidationError(
                {"password_confirm": "Les mots de passe ne correspondent pas."}
            )
        return data

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        email = validated_data.pop('email', None)
        user  = Utilisateur.objects.create_user(email=email, **validated_data)
        user.role = 'binome'
        user.save(update_fields=['role'])
        return user


# ─── CONNEXION (email OU téléphone) ──────────────────────────────────────────
class ConnexionSerializer(serializers.Serializer):
    """
    Accepte :
      - { "email": "...", "password": "..." }          ← connexion par email (nouveau)
      - { "telephone": "...", "password": "..." }      ← connexion par téléphone (ancien)
    """
    email     = serializers.CharField(required=False, allow_blank=True, default='')
    telephone = serializers.CharField(required=False, allow_blank=True, default='')
    password  = serializers.CharField(write_only=True)

    def validate(self, data):
        email     = (data.get('email') or '').strip().lower()
        telephone = (data.get('telephone') or '').strip()
        password  = data.get('password', '')

        if not password:
            raise serializers.ValidationError("Le mot de passe est obligatoire.")

        user = None

        # ── Connexion par email ───────────────────────────────────────────────
        if email:
            try:
                u    = Utilisateur.objects.get(email__iexact=email)
                user = authenticate(username=u.telephone, password=password)
            except Utilisateur.DoesNotExist:
                pass  # utilisateur introuvable → message générique

        # ── Connexion par téléphone (fallback / rétrocompatibilité) ──────────
        elif telephone:
            user = authenticate(username=telephone, password=password)

        else:
            raise serializers.ValidationError(
                "L'email ou le numéro de téléphone est obligatoire."
            )

        if not user:
            raise serializers.ValidationError("Identifiants incorrects.")
        if not user.is_active:
            raise serializers.ValidationError("Ce compte est désactivé.")

        data['user'] = user
        return data


# ─── PROFIL UTILISATEUR ───────────────────────────────────────────────────────
class UtilisateurSerializer(serializers.ModelSerializer):
    initiales         = serializers.ReadOnlyField()
    photo_profil      = serializers.ImageField(allow_null=True, required=False)
    supprimer_photo   = serializers.BooleanField(write_only=True, required=False)
    plan              = serializers.SerializerMethodField()
    limite_categories = serializers.SerializerMethodField()
    est_compte_google = serializers.SerializerMethodField()
    
    # 🆕 Nouveaux champs pour le mode visiteur
    est_visiteur      = serializers.BooleanField(read_only=True)
    est_lecture_seule = serializers.SerializerMethodField()
    nom_affichage     = serializers.SerializerMethodField()
    avatar_text       = serializers.SerializerMethodField()
    session_valide    = serializers.SerializerMethodField()

    class Meta:
        model  = Utilisateur
        fields = [
            'id', 'nom', 'prenom', 'telephone', 'email', 'email_verifie',
            'photo_profil', 'date_inscription', 'initiales', 'supprimer_photo',
            'role', 'plan', 'limite_categories', 'est_compte_google',
            #  Nouveaux champs
            'est_visiteur', 'est_lecture_seule', 'nom_affichage', 'avatar_text',
            'session_valide', 'session_visiteur_expire',
            # ── Champs KYC ajoutés ───────────────────────────────────────
            'is_kyc_verified',
            'kyc_status',
            'kyc_document_type',
            'nni',
            'nom_fr',
            'prenom_fr',
            'father_name',
            'birth_date',
            'birth_place',
            'gender',
            'nationality',
            'face_similarity_score',
            'kyc_completed_at',
            # ────────────────────────────────────────────────────────────
        ]
        read_only_fields = [
            'id', 'role', 'email_verifie', 'est_compte_google', 'initiales',
            'is_kyc_verified', 'kyc_status', 'face_similarity_score',
            'kyc_completed_at', 'nni', 'nom_fr', 'prenom_fr',
            'birth_date', 'birth_place', 'gender', 'nationality',
            'est_visiteur', 'session_visiteur_expire',
        ]
    
    def get_est_compte_google(self, obj):
        return obj.est_compte_google
    
    def get_plan(self, obj):
        return obj.get_plan()

    def get_limite_categories(self, obj):
        return obj.limite_categories()
    
    # Nouvelles méthodes
    def get_est_lecture_seule(self, obj):
        """Indique si l'utilisateur est en lecture seule"""
        return obj.est_lecture_seule
    
    def get_nom_affichage(self, obj):
        """Retourne le nom d'affichage de l'utilisateur"""
        return obj.get_display_name()
    
    def get_avatar_text(self, obj):
        """Retourne le texte pour l'avatar"""
        return obj.get_avatar_text()
    
    def get_session_valide(self, obj):
        """Vérifie si la session visiteur est valide"""
        if not obj.est_mode_visiteur:
            return True
        return obj.session_visiteur_valide

    def update(self, instance, validated_data):
        supprimer = validated_data.pop('supprimer_photo', False)
        if supprimer and instance.photo_profil:
            instance.photo_profil.delete(save=False)
            instance.photo_profil = None
        return super().update(instance, validated_data)


# ─── INVITATION EMPLOYÉ ───────────────────────────────────────────────────────
class InvitationEmployeSerializer(serializers.Serializer):
    email_employe = serializers.EmailField()

    def validate_email_employe(self, value):
        return value.lower()


# ─── ACTIVATION COMPTE EMPLOYÉ ────────────────────────────────────────────────
class ActivationEmployeSerializer(serializers.Serializer):
    token            = serializers.CharField()
    password         = serializers.CharField(min_length=6)
    confirm_password = serializers.CharField()

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError(
                {"confirm_password": "Les mots de passe ne correspondent pas."}
            )
        try:
            user = Utilisateur.objects.get(token_invitation=data['token'])
        except Utilisateur.DoesNotExist:
            raise serializers.ValidationError({"token": "Token invalide."})
        if user.token_invitation_expire and user.token_invitation_expire < timezone.now():
            raise serializers.ValidationError({"token": "Ce lien d'invitation a expiré."})
        data['user_invite'] = user
        return data


# ─── CHANGEMENT MOT DE PASSE ─────────────────────────────────────────────────
class ChangePasswordSerializer(serializers.Serializer):
    ancien_mot_de_passe    = serializers.CharField(write_only=True)
    nouveau_mot_de_passe   = serializers.CharField(write_only=True, min_length=6)
    confirmer_mot_de_passe = serializers.CharField(write_only=True)

    def validate(self, data):
        if data['nouveau_mot_de_passe'] != data['confirmer_mot_de_passe']:
            raise serializers.ValidationError(
                {"confirmer_mot_de_passe": "Les mots de passe ne correspondent pas."}
            )
        return data


# ─── CONTACT ─────────────────────────────────────────────────────────────────
class ContactSerializer(serializers.Serializer):
    message = serializers.CharField(min_length=10)


# ─── SERIALIZER MOT DE PASSE OUBLIE ──────────────────────────────────────────
class MotDePasseOublieSerializer(serializers.Serializer):
    email = serializers.EmailField()


class ReinitialisationMotDePasseSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(max_length=6)
    nouveau_password = serializers.CharField(min_length=6)
    confirmer_password = serializers.CharField()

    def validate(self, data):
        if data.get('nouveau_password') != data.get('confirmer_password'):
            raise serializers.ValidationError({
                "confirmer_password": "Les mots de passe ne correspondent pas."
            })
        return data


# ══════════════════════════════════════════════════════════════════════════════
# NOUVEAUX SÉRIALISEURS POUR LE MODE VISITEUR
# ══════════════════════════════════════════════════════════════════════════════

# ─── INITIATION MODE VISITEUR ──────────────────────────────────────────────
class InitierVisiteurSerializer(serializers.Serializer):
    """
    Sérialiseur pour initier le mode visiteur
    """
    email = serializers.EmailField(required=False, allow_blank=True)
    prenom = serializers.CharField(required=False, default="Explorateur")
    nom = serializers.CharField(required=False, default="Démo")
    
    def validate_email(self, value):
        if value:
            # Vérifier si l'email est déjà utilisé
            if Utilisateur.objects.filter(email__iexact=value).exists():
                raise serializers.ValidationError(
                    "Cet email est déjà utilisé. Veuillez vous connecter ou utiliser un autre email."
                )
        return value


# ─── CONVERSION VISITEUR → UTILISATEUR ─────────────────────────────────────
class ConvertirVisiteurSerializer(serializers.Serializer):
    """
    Sérialiseur pour convertir un visiteur en utilisateur réel
    """
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, min_length=6)
    confirm_password = serializers.CharField(write_only=True)
    prenom = serializers.CharField(max_length=100, required=True)
    nom = serializers.CharField(max_length=100, required=True)
    telephone = serializers.CharField(max_length=50, required=True)
    conserver_donnees_demo = serializers.BooleanField(default=False)
    
    def validate_email(self, value):
        if Utilisateur.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Cet email est déjà utilisé.")
        return value.lower()
    
    def validate_telephone(self, value):
        # Valider le numéro de téléphone
        pattern = r'^\+222[234]\d{7}$'
        if not re.match(pattern, value):
            raise serializers.ValidationError(
                "Format invalide. Exemple : +222XXXXXXXX (doit commencer par 2, 3 ou 4)"
            )
        if Utilisateur.objects.filter(telephone=value).exists():
            raise serializers.ValidationError("Ce numéro de téléphone est déjà utilisé.")
        return value
    
    def validate(self, data):
        if data.get('password') != data.get('confirm_password'):
            raise serializers.ValidationError({
                "confirm_password": "Les mots de passe ne correspondent pas."
            })
        return data


# ─── STATUT VISITEUR ────────────────────────────────────────────────────────
class StatutVisiteurSerializer(serializers.Serializer):
    """
    Sérialiseur pour le statut du mode visiteur
    """
    est_visiteur = serializers.BooleanField()
    est_lecture_seule = serializers.BooleanField()
    session_valide = serializers.BooleanField()
    est_expire = serializers.BooleanField()
    message = serializers.CharField()
    redirect_to = serializers.CharField(required=False)
    temps_restant = serializers.CharField(required=False)
    
    # Données de l'utilisateur
    utilisateur = serializers.DictField(required=False)
    
    # Données de l'abonnement
    abonnement = serializers.DictField(required=False)


# ─── DONNÉES DE DÉMONSTRATION VISITEUR ──────────────────────────────────────
class DonneesDemoVisiteurSerializer(serializers.Serializer):
    """
    Sérialiseur pour les données de démonstration du mode visiteur
    """
    # Informations utilisateur
    user = serializers.DictField()
    
    # Informations abonnement
    abonnement = serializers.DictField()
    
    # Données de démonstration
    stats = serializers.DictField()
    transactions = serializers.ListField()
    budgets = serializers.ListField()
    categories = serializers.ListField()
    notifications = serializers.ListField()
    
    # Messages d'incitation
    messages = serializers.DictField()
    
    # Métadonnées
    mode = serializers.CharField(default="visiteur")
    version = serializers.CharField(default="1.0")


# ─── SESSION KYC POUR VISITEUR ─────────────────────────────────────────────
class KYCSessionVisiteurSerializer(serializers.ModelSerializer):
    """
    Sérialiseur pour les sessions KYC des visiteurs
    """
    class Meta:
        model = KYCVerificationSession
        fields = [
            'id', 'session_token', 'email', 'telephone', 
            'nom', 'prenom', 'auth_type', 'from_visitor_mode',
            'visitor_session_token', 'expires_at', 'created_at'
        ]
        read_only_fields = ['id', 'session_token', 'created_at', 'expires_at']


# ─── MESSAGE D'INCITATION ──────────────────────────────────────────────────
class MessageIncitationSerializer(serializers.Serializer):
    """
    Sérialiseur pour les messages d'incitation à s'inscrire
    """
    titre = serializers.CharField()
    message = serializers.CharField()
    action = serializers.CharField()
    action_type = serializers.ChoiceField(choices=['signup', 'login', 'subscribe'])
    icone = serializers.CharField(default='🚀')
    priorite = serializers.IntegerField(default=0)
    est_actif = serializers.BooleanField(default=True)


# ─── LISTE DES MESSAGES D'INCITATION ──────────────────────────────────────
class MessagesIncitationSerializer(serializers.Serializer):
    """
    Sérialiseur pour la liste des messages d'incitation
    """
    dashboard = MessageIncitationSerializer()
    transactions = MessageIncitationSerializer()
    budgets = MessageIncitationSerializer()
    categories = MessageIncitationSerializer()
    profil = MessageIncitationSerializer()
    subscribe = MessageIncitationSerializer()