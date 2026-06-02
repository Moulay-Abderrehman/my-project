import re
import secrets
from django.utils import timezone
from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import Utilisateur


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

    class Meta:
        model  = Utilisateur
        fields = [
            'id', 'nom', 'prenom', 'telephone', 'email', 'email_verifie',
            'photo_profil', 'date_inscription', 'initiales', 'supprimer_photo',
            'role', 'plan', 'limite_categories','est_compte_google',  
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
                ]
    def get_est_compte_google(self, obj):
        return obj.est_compte_google  # <-- AJOUTER
    
    def get_plan(self, obj):
        return obj.get_plan()

    def get_limite_categories(self, obj):
        return obj.limite_categories()

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
