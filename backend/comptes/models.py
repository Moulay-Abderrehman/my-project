import re
import uuid
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.db import models
from django.utils import timezone


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
    
    # 🆕 Créer un utilisateur visiteur (mode démo)
    def create_visitor_user(self, email=None, **extra_fields):
        """
        Crée un utilisateur en mode visiteur/démo.
        Utilisé pour le mode exploration sans compte.
        """
        import uuid
        visitor_id = str(uuid.uuid4())[:8]
        telephone = f"+222_visitor_{visitor_id}"
        
        # Si aucun email fourni, en générer un temporaire
        if not email:
            email = f"visitor_{visitor_id}@demo.com"
        
        user = self.model(
            telephone=telephone,
            email=email.lower(),
            nom='Démo',
            prenom='Explorateur',
            role='visiteur',
            est_visiteur=True,
            is_active=True,
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
    
    # 🆕 Nouveau champ pour le mode visiteur
    est_visiteur = models.BooleanField(
        default=False, 
        help_text="Indique si l'utilisateur est en mode exploration (visiteur)"
    )
    
    # 🆕 Date d'expiration de la session visiteur
    session_visiteur_expire = models.DateTimeField(
        null=True, 
        blank=True,
        help_text="Date d'expiration de la session visiteur"
    )

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

    # ── KYC (Know Your Customer) ─────────────────────────────────────────────
    is_kyc_verified          = models.BooleanField(default=False)
    kyc_document_type        = models.CharField(
        max_length=20,
        choices=[('cni', 'Carte Nationale'), ('passport', 'Passeport'), ('sejour', 'Carte de Séjour')],
        blank=True
    )
    # Données extraites par OCR
    nni                      = models.CharField(max_length=50, blank=True)
    nom_fr                   = models.CharField(max_length=100, blank=True)
    prenom_fr                = models.CharField(max_length=100, blank=True)
    father_name              = models.CharField(max_length=100, blank=True, null=True)
    father_name_ar           = models.CharField(max_length=100, blank=True, null=True)
    nom_ar                   = models.CharField(max_length=100, blank=True)
    prenom_ar                = models.CharField(max_length=100, blank=True)
    birth_date               = models.DateField(null=True, blank=True)
    birth_place              = models.CharField(max_length=100, blank=True)
    gender                   = models.CharField(max_length=10, blank=True)
    nationality              = models.CharField(max_length=10, blank=True, default='MRT')
    # Image du visage extraite du document (base64 ou URL)
    face_image_document      = models.TextField(blank=True)   # base64 du visage sur document
    # Selfie pris lors de la vérification Face ID
    selfie_profil            = models.ImageField(upload_to='media/selfies/', null=True, blank=True)
    # Score de similarité faciale
    face_similarity_score    = models.FloatField(null=True, blank=True)
    # Stocke l'image complète en base64
    document_full_image = models.TextField(blank=True, null=True)
    # Statut KYC détaillé
    kyc_status               = models.CharField(
        max_length=20,
        choices=[
            ('pending',   'En attente'),
            ('ocr_done',  'OCR terminé'),
            ('face_done', 'Face ID vérifié'),
            ('approved',  'Approuvé'),
            ('rejected',  'Rejeté'),
        ],
        default='pending'
    )
    kyc_completed_at         = models.DateTimeField(null=True, blank=True)

    is_active        = models.BooleanField(default=True)
    is_staff         = models.BooleanField(default=False)
    date_inscription = models.DateTimeField(auto_now_add=True)

    USERNAME_FIELD  = 'telephone'
    REQUIRED_FIELDS = ['nom', 'prenom']

    objects = UtilisateurManager()

    def clean(self):
        from django.core.exceptions import ValidationError
        # Ne pas valider les comptes Google ou visiteurs
        if self.telephone.startswith('+222_g_') or self.telephone.startswith('+222_visitor_'):
            return
        # Valider seulement les vrais numéros mauritaniens
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
    
    @property
    def est_mode_visiteur(self):
        """Vérifie si l'utilisateur est en mode visiteur"""
        return self.est_visiteur or self.role == 'visiteur'
    
    @property
    def est_lecture_seule(self):
        """Vérifie si l'utilisateur est en lecture seule (visiteur)"""
        return self.est_mode_visiteur
    
    @property
    def session_visiteur_valide(self):
        """Vérifie si la session visiteur est toujours valide"""
        if not self.est_mode_visiteur:
            return False
        if not self.session_visiteur_expire:
            return True  # Pas de date d'expiration = illimité
        return timezone.now() <= self.session_visiteur_expire

    def get_plan(self):
        role_to_plan = {
            'visiteur': 'visiteur', 
            'binome': 'binome',
            'standard': 'standard', 
            'entreprise': 'entreprise', 
            'employe': 'standard',
        }
        return role_to_plan.get(self.role, 'visiteur')
    
    # 🆕 Méthode pour obtenir le statut de l'abonnement
    def get_abonnement_status(self):
        """
        Retourne le statut de l'abonnement de l'utilisateur
        """
        try:
            abo = self.abonnement
            if abo:
                return {
                    'est_actif': abo.est_actif(),
                    'est_demo': abo.est_demo_mode(),
                    'est_expire': abo.est_expire(),
                    'est_abonne': abo.est_abonne(),
                    'jours_restants': abo.jours_restants(),
                    'plan_nom': abo.get_plan_nom(),
                    'type': abo.type,
                    'statut': abo.statut,
                }
        except:
            pass
        
        # Si l'utilisateur est visiteur
        if self.est_mode_visiteur:
            return {
                'est_actif': True,
                'est_demo': True,
                'est_expire': False,
                'est_abonne': False,
                'jours_restants': 0,
                'plan_nom': 'demo',
                'type': 'demo',
                'statut': 'demo',
            }
        
        # Par défaut
        return {
            'est_actif': False,
            'est_demo': False,
            'est_expire': True,
            'est_abonne': False,
            'jours_restants': 0,
            'plan_nom': None,
            'type': None,
            'statut': None,
        }

    def peut_creer_categorie(self):
        """Vérifie si l'utilisateur peut créer des catégories"""
        if self.est_mode_visiteur:
            return False
        return self.role in ('binome', 'standard', 'entreprise', 'employe')
    
    # 🆕 Méthodes de permissions pour le mode visiteur
    def peut_creer_transaction(self):
        """Vérifie si l'utilisateur peut créer des transactions"""
        if self.est_mode_visiteur:
            return False
        return self.role in ('binome', 'standard', 'entreprise', 'employe')
    
    def peut_modifier_transaction(self):
        """Vérifie si l'utilisateur peut modifier des transactions"""
        if self.est_mode_visiteur:
            return False
        return self.role in ('binome', 'standard', 'entreprise', 'employe')
    
    def peut_supprimer_transaction(self):
        """Vérifie si l'utilisateur peut supprimer des transactions"""
        if self.est_mode_visiteur:
            return False
        return self.role in ('binome', 'standard', 'entreprise', 'employe')
    
    def peut_creer_budget(self):
        """Vérifie si l'utilisateur peut créer des budgets"""
        if self.est_mode_visiteur:
            return False
        return self.role in ('binome', 'standard', 'entreprise', 'employe')
    
    def peut_modifier_profil(self):
        """Vérifie si l'utilisateur peut modifier son profil"""
        if self.est_mode_visiteur:
            return False
        return True  # Même expiré, on peut modifier son profil
    
    def peut_voir_donnees_sensibles(self):
        """Vérifie si l'utilisateur peut voir des données sensibles"""
        if self.est_mode_visiteur:
            return False
        return True
    
    def get_display_name(self):
        """Retourne le nom d'affichage de l'utilisateur"""
        if self.est_mode_visiteur:
            return "🔍 Explorateur ••••"
        return f"{self.prenom} {self.nom}"
    
    def get_avatar_text(self):
        """Retourne le texte pour l'avatar"""
        if self.est_mode_visiteur:
            return "👤"
        return self.initiales or "?"

    def limite_categories(self):
        limites = {'visiteur': 0, 'binome': 5, 'standard': 50, 'entreprise': 200, 'employe': 50}
        return limites.get(self.role, 0)
    
    # 🆕 Méthode pour convertir un visiteur en utilisateur réel
    def convertir_visiteur_en_utilisateur(self, email, password, prenom, nom, telephone):
        """
        Convertit un utilisateur visiteur en utilisateur réel
        """
        if not self.est_mode_visiteur:
            raise ValueError("L'utilisateur n'est pas en mode visiteur")
        
        self.email = email
        self.prenom = prenom
        self.nom = nom
        self.telephone = telephone
        self.est_visiteur = False
        self.role = 'binome'  # Par défaut, passe en binôme (essai)
        self.session_visiteur_expire = None
        self.is_active = True
        
        if password:
            self.set_password(password)
        else:
            self.set_unusable_password()
        
        self.save()
        return self

    def __str__(self):
        if self.est_mode_visiteur:
            return f"🔍 Visiteur - {self.email or self.telephone}"
        return f"{self.prenom} {self.nom} ({self.email or self.telephone}) [{self.role}]"

    class Meta:
        verbose_name = "Utilisateur"
        verbose_name_plural = "Utilisateurs"


class KYCVerificationSession(models.Model):
    """Session temporaire avant création du compte (stockée en base)"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session_token = models.CharField(max_length=100, unique=True)
    email = models.EmailField()
    user_id = models.CharField(max_length=100, blank=True, null=True)
    telephone = models.CharField(max_length=50)
    password = models.CharField(max_length=128)  # hashé
    nom = models.CharField(max_length=100, blank=True)
    prenom = models.CharField(max_length=100, blank=True)
    auth_type = models.CharField(max_length=20, default='email')  # email, google
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    # 🆕 Champ pour indiquer si la session vient du mode visiteur
    from_visitor_mode = models.BooleanField(default=False)
    visitor_session_token = models.CharField(max_length=100, blank=True, null=True)
    
    def is_valid(self):
        return timezone.now() <= self.expires_at
    
    def __str__(self):
        return f"Session {self.session_token[:8]} - {self.email}"