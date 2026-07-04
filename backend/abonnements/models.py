# backend/abonnements/models.py
from django.db import models
from django.conf import settings
from django.utils import timezone
import uuid


# ─── PLAN ────────────────────────────────────────────────────────────────────
class Plan(models.Model):
    NOM_CHOICES = [
        ('essai',      'Essai Gratuit'),
        ('standard',   'Standard'),
        ('entreprise', 'Entreprise'),
        ('demo',       'Démo / Visiteur'),  # 🆕 Nouveau plan pour le mode visiteur
    ]
    id                = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nom               = models.CharField(max_length=20, choices=NOM_CHOICES, unique=True)
    prix_mensuel      = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    prix_annuel       = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    nb_categories_max = models.IntegerField(default=2)   # -1 = illimité
    description       = models.TextField(blank=True)
    
    # 🆕 Nouveaux champs pour le mode visiteur
    est_demo          = models.BooleanField(default=False, help_text="Plan réservé à la démonstration")
    ordre_affichage   = models.PositiveIntegerField(default=0, help_text="Ordre d'affichage dans l'interface")

    class Meta:
        verbose_name = "Plan"
        ordering = ['ordre_affichage', 'nom']

    def __str__(self):
        return self.get_nom_display()
    
    def est_plan_demo(self):
        """Vérifie si c'est un plan de démonstration"""
        return self.nom == 'demo' or self.est_demo


# ─── FEATURE ─────────────────────────────────────────────────────────────────
class Feature(models.Model):
    id    = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code  = models.CharField(max_length=50, unique=True)
    label = models.CharField(max_length=100)

    class Meta:
        verbose_name = "Fonctionnalité"

    def __str__(self):
        return self.label


# ─── PLAN ↔ FEATURE ──────────────────────────────────────────────────────────
class PlanFeature(models.Model):
    plan    = models.ForeignKey(Plan, on_delete=models.CASCADE, related_name='features')
    feature = models.ForeignKey(Feature, on_delete=models.CASCADE)

    class Meta:
        unique_together = ('plan', 'feature')


# ─── ABONNEMENT ──────────────────────────────────────────────────────────────
class Abonnement(models.Model):
    TYPE_CHOICES = [
        ('essai',   'Essai'),
        ('mensuel', 'Mensuel'),
        ('2_mois',  '2 Mois'),
        ('3_mois',  '3 Mois'),
        ('6_mois',  '6 Mois'),
        ('annuel',  'Annuel'),
        ('demo',    'Démo / Visiteur'),  # 🆕 Nouveau type pour la démo
    ]
    STATUT_CHOICES = [
        ('actif',      'Actif'),
        ('expire',     'Expiré'),
        ('en_attente', 'En attente'),
        ('demo',       'Démo / Visiteur'),  # 🆕 Statut pour le mode visiteur
    ]


    DUREE_JOURS_MAP = {
        'essai':   30,
        'mensuel': 30,
        '2_mois':  60,
        '3_mois':  90,
        '6_mois':  180,
        'annuel':  365,
        'demo':    0,  # 🆕 La démo n'a pas de durée (permanente)
    }

    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    utilisateur = models.OneToOneField(
        'comptes.Utilisateur', on_delete=models.CASCADE, related_name='abonnement'
    )
    plan = models.ForeignKey(
        Plan, on_delete=models.SET_NULL, null=True, blank=True, related_name='abonnements'
    )
    type        = models.CharField(max_length=10, choices=TYPE_CHOICES, default='essai')
    date_debut  = models.DateTimeField(default=timezone.now)
    date_fin    = models.DateTimeField(null=True, blank=True)  # 🆕 Peut être null pour la démo
    statut      = models.CharField(max_length=15, choices=STATUT_CHOICES, default='actif')
    montant     = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    nb_renouvellements = models.PositiveIntegerField(default=0)
    
    # 🆕 Nouveaux champs pour le mode visiteur
    est_demo    = models.BooleanField(default=False, help_text="Indique si c'est un abonnement de démonstration")
    date_expiration_demo = models.DateTimeField(null=True, blank=True, help_text="Date d'expiration de la démo (si limitée dans le temps)")

    # ── méthodes utilitaires ─────────────────────────────────────────────────
    def est_actif(self):
        """Vérifie si l'abonnement est actif"""
        if self.statut == 'demo':
            # La démo est toujours considérée comme active (mais en lecture seule)
            return True
        if self.statut == 'actif' and self.date_fin:
            return self.date_fin > timezone.now()
        return False
    
    def est_demo_mode(self):
        """Vérifie si c'est un mode démo/visiteur"""
        return self.statut == 'demo' or self.type == 'demo' or self.est_demo
    
    def est_expire(self):
        """Vérifie si l'abonnement est expiré (hors démo)"""
        if self.est_demo_mode():
            return False  # La démo n'expire jamais
        return not self.est_actif()

    def jours_restants(self):
        """Retourne le nombre de jours restants (0 pour la démo)"""
        if self.est_demo_mode():
            return 0
        if self.date_fin and self.date_fin > timezone.now():
            return (self.date_fin - timezone.now()).days
        return 0

    def get_plan_nom(self):
        """Retourne le nom du plan"""
        if self.plan:
            return self.plan.nom
        return 'essai'
    
    def get_plan_display(self):
        """Retourne l'affichage du plan"""
        if self.est_demo_mode():
            return "Mode Exploration"
        return self.get_type_display()

    def nb_categories_autorisees(self):
        """Retourne le nombre max de catégories perso selon le plan."""
        if self.est_demo_mode():
            return 0  # 🆕 La démo ne permet pas de catégories personnalisées
        if self.plan:
            return self.plan.nb_categories_max
        return 2  
    
    def est_abonne(self):
        """Vérifie si l'utilisateur est réellement abonné (hors démo)"""
        if self.est_demo_mode():
            return False  # La démo n'est pas un abonnement réel
        return self.est_actif()
    
    def peut_creer_transaction(self):
        """Vérifie si l'utilisateur peut créer des transactions"""
        if self.est_demo_mode():
            return False  # La démo est en lecture seule
        return self.est_actif()
    
    def peut_creer_budget(self):
        """Vérifie si l'utilisateur peut créer des budgets"""
        if self.est_demo_mode():
            return False  # La démo est en lecture seule
        return self.est_actif()
    
    def peut_modifier_profil(self):
        """Vérifie si l'utilisateur peut modifier son profil"""
        if self.est_demo_mode():
            return False  # La démo est en lecture seule
        return True  # Même expiré, on peut modifier son profil
    
    def est_entreprise(self):
        """Vérifie si c'est un abonnement entreprise"""
        if self.est_demo_mode():
            return False
        return self.plan and self.plan.nom == 'entreprise'
    
    @property
    def duree_jours(self):
        """Retourne la durée en jours"""
        if self.est_demo_mode():
            return 0
        return self.DUREE_JOURS_MAP.get(self.type, 30)
    
    @property
    def est_visiteur(self):
        """Alias pour est_demo_mode (compatibilité frontend)"""
        return self.est_demo_mode()
    
    @property
    def est_lecture_seule(self):
        """Indique si l'abonnement est en lecture seule (démo ou expiré)"""
        return self.est_demo_mode() or self.est_expire()

    def __str__(self):
        if self.est_demo_mode():
            return f"{self.utilisateur} — Mode Exploration"
        return f"{self.utilisateur} — {self.type} ({self.statut})"

    class Meta:
        verbose_name = "Abonnement"


# ─── PAIEMENT ────────────────────────────────────────────────────────────────
class Paiement(models.Model):
    STATUT_CHOICES = [
        ('en_attente', 'En attente'),
        ('confirme',   'Confirmé'),
        ('echoue',     'Échoué'),
        ('refuse',     'Refusé'),  
    ]

    METHODE_CHOICES = [
        ('mobile_money', 'Mobile Money'),
        ('rssbank',      'RSSBank'),
        ('sedad',        'Sedad'),        
        ('bankily',      'Bankily'),      
        ('masrivi',      'Masrivi'),      
        ('trackpay',     'TrackPay'),
    ]

    TYPE_ABONNEMENT_DEMANDE_CHOICES = [
        ('mensuel', 'Mensuel'),
        ('2_mois',  '2 Mois'),
        ('3_mois',  '3 Mois'),
        ('6_mois',  '6 Mois'),
        ('annuel',  'Annuel'),
    ]
    TYPE_UTILISATEUR_DEMANDE_CHOICES = [
        ('standard',   'Standard'),
        ('entreprise', 'Entreprise'),
    ]

    MODE_RENOUVELLEMENT_CHOICES = [
        ('nouveau',      'Nouveau (depuis essai/expiré)'),
        ('prolongation', 'Prolongation (même plan)'),
        ('changement',   'Changement de plan autorisé'),
    ]

    id            = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    abonnement    = models.ForeignKey(
        Abonnement, on_delete=models.CASCADE, related_name='paiements'
    )
    montant       = models.DecimalField(max_digits=10, decimal_places=2)
    date_paiement = models.DateTimeField(auto_now_add=True)
    methode       = models.CharField(max_length=50, default='mobile_money', choices=METHODE_CHOICES)
    statut        = models.CharField(max_length=15, choices=STATUT_CHOICES, default='en_attente')
    reference     = models.CharField(max_length=100, blank=True)

    # ── Champs flux de paiement avec validation manuelle admin ──────────────
    capture_ecran = models.ImageField(upload_to='paiements/', null=True, blank=True)
    raison_refus  = models.TextField(blank=True, null=True)
    valide_par    = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='paiements_valides',
    )
    date_validation = models.DateTimeField(null=True, blank=True)

    type_abonnement_demande  = models.CharField(
        max_length=10, choices=TYPE_ABONNEMENT_DEMANDE_CHOICES, blank=True, null=True
    )
    type_utilisateur_demande = models.CharField(
        max_length=20, choices=TYPE_UTILISATEUR_DEMANDE_CHOICES, blank=True, null=True
    )
    mode_renouvellement = models.CharField(
        max_length=20, choices=MODE_RENOUVELLEMENT_CHOICES, blank=True, null=True
    )


    reference_trackpay = models.CharField(max_length=100, blank=True, null=True, db_index=True)

    def __str__(self):
        return f"Paiement {self.reference} — {self.statut}"

    class Meta:
        verbose_name = "Paiement"


# ─── COMPTE D'ENCAISSEMENT ───────────────────────────────────────────────────
class CompteEncaissement(models.Model):
    METHODE_CHOICES = [
        ('rssbank',  'RSSBank'),
        ('sedad',    'Sedad'),     
        ('bankily',  'Bankily'),   
        ('masrivi',  'Masrivi'),   
        ('trackpay', 'TrackPay'),
    ]

    id             = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    methode        = models.CharField(max_length=20, choices=METHODE_CHOICES, db_index=True)
    numero_compte  = models.CharField(max_length=100)
    nom_titulaire  = models.CharField(max_length=150)
    instructions   = models.TextField(blank=True, null=True)
    actif          = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Compte d'encaissement"
        verbose_name_plural = "Comptes d'encaissement"

    def __str__(self):
        return f"{self.get_methode_display()} — {self.numero_compte}"