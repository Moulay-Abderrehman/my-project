import re
import uuid
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.db import models


class UtilisateurManager(BaseUserManager):
    def create_user(self, telephone, password=None, **extra_fields):
        if not telephone:
            raise ValueError("Le numéro de téléphone est obligatoire")
        user = self.model(telephone=telephone, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, telephone, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'entreprise')
        return self.create_user(telephone, password, **extra_fields)

    def create_google_user(self, email, google_id, nom, prenom, **extra_fields):
        """Crée un utilisateur via Google OAuth sans mot de passe."""
        # Générer un téléphone temporaire unique pour les comptes Google
        telephone = f"+222_g_{uuid.uuid4().hex[:8]}"
        user = self.model(
            telephone=telephone,
            email=email.lower(),
            nom=nom,
            prenom=prenom,
            google_id=google_id,
            role='binome',
            **extra_fields
        )
        user.set_unusable_password()
        user.save(using=self._db)
        return user


class Utilisateur(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = [
        ('visiteur',   'Visiteur'),
        ('binome',     'Binôme (Essai gratuit)'),
        ('standard',   'Standard'),
        ('entreprise', 'Entreprise (Admin)'),
        ('employe',    'Employé'),
    ]

    id        = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nom       = models.CharField(max_length=100)
    prenom    = models.CharField(max_length=100)
    telephone = models.CharField(max_length=50, unique=True)   # max_length=50 pour les comptes Google

    # Email + vérification
    email                    = models.EmailField(unique=True, null=True, blank=True)
    email_verifie            = models.BooleanField(default=False)
    code_confirmation        = models.CharField(max_length=6, blank=True)
    code_confirmation_expire = models.DateTimeField(null=True, blank=True)

    # Google OAuth
    google_id    = models.CharField(max_length=128, unique=True, null=True, blank=True)
    google_photo = models.URLField(max_length=500, blank=True)  # URL photo Google

    # Rôle / Plan
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='binome')

    # Entreprise liée (pour les employés)
    entreprise = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='employes',
        limit_choices_to={'role': 'entreprise'},
    )

    # Token d'invitation employé
    token_invitation        = models.CharField(max_length=64, blank=True, unique=True, null=True)
    token_invitation_expire = models.DateTimeField(null=True, blank=True)
    invitation_email        = models.EmailField(blank=True)

    photo_profil     = models.ImageField(upload_to='media/profile/', null=True, blank=True)
    is_active        = models.BooleanField(default=True)
    is_staff         = models.BooleanField(default=False)
    date_inscription = models.DateTimeField(auto_now_add=True)

    USERNAME_FIELD  = 'telephone'
    REQUIRED_FIELDS = ['nom', 'prenom']

    objects = UtilisateurManager()

    def clean(self):
        from django.core.exceptions import ValidationError
        # Valider seulement les vrais numéros mauritaniens (pas les comptes Google)
        if not self.telephone.startswith('+222_g_'):
            pattern = r'^\+222[234]\d{7}$'
            if not re.match(pattern, self.telephone):
                raise ValidationError(
                    "Le numéro doit commencer par +222 suivi de 2, 3 ou 4 puis 7 chiffres."
                )

    @property
    def initiales(self):
        p = self.prenom[0].upper() if self.prenom else ''
        n = self.nom[0].upper() if self.nom else ''
        return f"{p}{n}"

    @property
    def est_compte_google(self):
        return bool(self.google_id)

    def get_plan(self):
        role_to_plan = {
            'visiteur': 'visiteur', 'binome': 'binome',
            'standard': 'standard', 'entreprise': 'entreprise', 'employe': 'standard',
        }
        return role_to_plan.get(self.role, 'visiteur')

    def peut_creer_categorie(self):
        return self.role in ('binome', 'standard', 'entreprise', 'employe')

    def limite_categories(self):
        limites = {'visiteur': 0, 'binome': 5, 'standard': 50, 'entreprise': 200, 'employe': 50}
        return limites.get(self.role, 0)

    def __str__(self):
        return f"{self.prenom} {self.nom} ({self.email or self.telephone}) [{self.role}]"

    class Meta:
        verbose_name = "Utilisateur"
        verbose_name_plural = "Utilisateurs"