from django.db import models
from django.utils import timezone
import uuid


# ─── PLAN ────────────────────────────────────────────────────────────────────
class Plan(models.Model):
    NOM_CHOICES = [
        ('essai',      'Essai Gratuit'),
        ('standard',   'Standard'),
        ('entreprise', 'Entreprise'),
    ]
    id                = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nom               = models.CharField(max_length=20, choices=NOM_CHOICES, unique=True)
    prix_mensuel      = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    prix_annuel       = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    nb_categories_max = models.IntegerField(default=2)   # -1 = illimité
    description       = models.TextField(blank=True)

    class Meta:
        verbose_name = "Plan"

    def __str__(self):
        return self.get_nom_display()


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
        ('annuel',  'Annuel'),
    ]
    STATUT_CHOICES = [
        ('actif',      'Actif'),
        ('expire',     'Expiré'),
        ('en_attente', 'En attente'),
    ]

    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    utilisateur = models.OneToOneField(
        'comptes.Utilisateur', on_delete=models.CASCADE, related_name='abonnement'
    )
    plan = models.ForeignKey(
        Plan, on_delete=models.SET_NULL, null=True, blank=True, related_name='abonnements'
    )
    type        = models.CharField(max_length=10, choices=TYPE_CHOICES, default='essai')
    date_debut  = models.DateTimeField(default=timezone.now)
    date_fin    = models.DateTimeField()
    statut      = models.CharField(max_length=15, choices=STATUT_CHOICES, default='actif')
    montant     = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    # ── méthodes utilitaires ─────────────────────────────────────────────────
    def est_actif(self):
        return self.statut == 'actif' and self.date_fin > timezone.now()

    def jours_restants(self):
        if self.date_fin > timezone.now():
            return (self.date_fin - timezone.now()).days
        return 0

    def get_plan_nom(self):
        return self.plan.nom if self.plan else 'essai'

    def nb_categories_autorisees(self):
        """Retourne le nombre max de catégories perso selon le plan."""
        if self.plan:
            return self.plan.nb_categories_max
        return 2   # défaut essai

    def __str__(self):
        return f"{self.utilisateur} — {self.type} ({self.statut})"

    class Meta:
        verbose_name = "Abonnement"


# ─── PAIEMENT ────────────────────────────────────────────────────────────────
class Paiement(models.Model):
    STATUT_CHOICES = [
        ('en_attente', 'En attente'),
        ('confirme',   'Confirmé'),
        ('echoue',     'Échoué'),
    ]

    id            = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    abonnement    = models.ForeignKey(
        Abonnement, on_delete=models.CASCADE, related_name='paiements'
    )
    montant       = models.DecimalField(max_digits=10, decimal_places=2)
    date_paiement = models.DateTimeField(auto_now_add=True)
    methode       = models.CharField(max_length=50, default='mobile_money')
    statut        = models.CharField(max_length=15, choices=STATUT_CHOICES, default='en_attente')
    reference     = models.CharField(max_length=100, blank=True)

    def __str__(self):
        return f"Paiement {self.reference} — {self.statut}"

    class Meta:
        verbose_name = "Paiement"

