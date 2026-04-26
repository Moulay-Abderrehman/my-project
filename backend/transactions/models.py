from django.db import models
import uuid


class Categorie(models.Model):
    TYPE_CHOICES = [
        ('entree',   'Entrée'),
        ('sortie',   'Sortie'),
        ('les_deux', 'Les deux'),
    ]
    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nom         = models.CharField(max_length=100)
    icone       = models.CharField(max_length=50, blank=True, default='📦')
    couleur     = models.CharField(max_length=7, default='#6366f1')
    type        = models.CharField(max_length=10, choices=TYPE_CHOICES, default='les_deux')
    is_visible  = models.BooleanField(default=True)
    utilisateur = models.ForeignKey(
        'comptes.Utilisateur',
        on_delete=models.CASCADE,
        null=True, blank=True,
        related_name='categories_perso',
    )

    class Meta:
        unique_together = ('utilisateur', 'nom')
        verbose_name = "Catégorie"
        ordering = ['nom']

    def __str__(self):
        return f"{self.icone} {self.nom}"


class Transaction(models.Model):
    TYPE_CHOICES = [('entree', 'Entrée'), ('sortie', 'Sortie')]

    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    utilisateur = models.ForeignKey(
        'comptes.Utilisateur', on_delete=models.CASCADE, related_name='transactions'
    )
    # Pour les employés : lien vers l'entreprise mère
    entreprise  = models.ForeignKey(
        'comptes.Utilisateur',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='transactions_entreprise',
    )
    type          = models.CharField(max_length=10, choices=TYPE_CHOICES)
    montant       = models.DecimalField(max_digits=12, decimal_places=2)
    date          = models.DateTimeField(auto_now_add=True)
    categorie     = models.ForeignKey(Categorie, on_delete=models.SET_NULL, null=True, blank=True)
    description   = models.TextField(blank=True)
    date_creation = models.DateTimeField(auto_now_add=True)
    is_visible    = models.BooleanField(default=True)
    source        = models.CharField(max_length=20, default='manuel')
    budget        = models.ForeignKey(
        'budgets.Budget', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='transactions_budget',
    )

    class Meta:
        ordering = ['-date_creation']
        verbose_name = "Transaction"

    def __str__(self):
        return f"{self.type} — {self.montant} MRU"

    def save(self, *args, **kwargs):
        # Lier automatiquement à l'entreprise si l'utilisateur est un employé
        if self.utilisateur and not self.entreprise:
            if hasattr(self.utilisateur, 'entreprise') and self.utilisateur.entreprise:
                self.entreprise = self.utilisateur.entreprise
        super().save(*args, **kwargs)
        # Recalculer le solde
        solde, _ = Solde.objects.get_or_create(utilisateur=self.utilisateur)
        solde.recalculer()


class Solde(models.Model):
    utilisateur   = models.OneToOneField(
        'comptes.Utilisateur', on_delete=models.CASCADE, related_name='solde'
    )
    montant_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_entrees = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_sorties = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    derniere_maj  = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Solde"

    def recalculer(self):
        from django.db.models import Sum
        qs      = Transaction.objects.filter(utilisateur=self.utilisateur)
        entrees = qs.filter(type='entree').aggregate(t=Sum('montant'))['t'] or 0
        sorties = qs.filter(type='sortie').aggregate(t=Sum('montant'))['t'] or 0
        Solde.objects.filter(pk=self.pk).update(
            total_entrees=entrees,
            total_sorties=sorties,
            montant_total=entrees - sorties,
        )

    def __str__(self):
        return f"Solde {self.utilisateur}: {self.montant_total} MRU"

