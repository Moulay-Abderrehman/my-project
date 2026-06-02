'''from django.db import models
import uuid


class Budget(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    utilisateur = models.ForeignKey('comptes.Utilisateur', on_delete=models.CASCADE, related_name='budgets')
    categorie = models.ForeignKey('transactions.Categorie', on_delete=models.CASCADE)
    montant_prevu = models.DecimalField(max_digits=10, decimal_places=2)
    date_debut = models.DateField()
    date_fin = models.DateField()
    est_actif = models.BooleanField(default=True)
    date_creation = models.DateTimeField(auto_now_add=True)
    couleur = models.CharField(max_length=20, default='#6366f1', blank=True)

    @property
    def montant_depense(self):
        from transactions.models import Transaction
        from django.db.models import Sum
        total = Transaction.objects.filter(
            utilisateur=self.utilisateur,
            categorie=self.categorie,
            type='sortie',
            date__gte=self.date_debut,
            date__lte=self.date_fin
        ).aggregate(total=Sum('montant'))['total']
        return total or 0

    @property
    def pourcentage_utilise(self):
        if self.montant_prevu > 0:
            return round((float(self.montant_depense) / float(self.montant_prevu)) * 100, 2)
        return 0

    @property
    def est_depasse(self):
        return self.montant_depense > self.montant_prevu

    def __str__(self):
        return f"Budget {self.categorie} - {self.utilisateur}"

    def envoyer_notification_fin(self):
        """Envoie une notification de fin de budget avec toutes les dépenses."""
        from notifications.models import Notification
        from transactions.models import Transaction

        # Récupère toutes les transactions de ce budget
        transactions = Transaction.objects.filter(
            utilisateur=self.utilisateur,
            categorie=self.categorie,
            type='sortie',
            date__gte=self.date_debut,
            date__lte=self.date_fin
        ).order_by('date')

        # Construit le détail des transactions
        details = "\n".join([
            f"  - {t.date.strftime('%d/%m/%Y %H:%M')} : {float(t.montant):.2f} MRU"
            + (f" ({t.description})" if t.description else "")
            for t in transactions
        ])

        message = (
            f"🏁 Budget terminé : {self.categorie.nom}\n"
            f"Période : {self.date_debut.strftime('%d/%m/%Y')} → {self.date_fin.strftime('%d/%m/%Y')}\n"
            f"Montant prévu : {float(self.montant_prevu):.2f} MRU\n"
            f"Total dépensé : {float(self.montant_depense):.2f} MRU "
            f"({'DÉPASSÉ 🚨' if self.est_depasse else f'{self.pourcentage_utilise}% utilisé'})\n"
            f"\nDétail des dépenses ({transactions.count()}) :\n"
            f"{details if details else '  Aucune dépense enregistrée'}"
        )

        Notification.objects.create(
            utilisateur=self.utilisateur,
            type='budget_termine',
            message=message,
        )

#ajoute
    notif_fin_envoyee = models.BooleanField(default=False)'''




from django.db import models
import uuid


class Budget(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    utilisateur = models.ForeignKey('comptes.Utilisateur', on_delete=models.CASCADE, related_name='budgets')
    categorie = models.ForeignKey('transactions.Categorie', on_delete=models.CASCADE)
    montant_prevu = models.DecimalField(max_digits=10, decimal_places=2)
    date_debut = models.DateField()
    date_fin = models.DateField()
    est_actif = models.BooleanField(default=True)
    date_creation = models.DateTimeField(auto_now_add=True)
    couleur = models.CharField(max_length=20, default='#6366f1', blank=True)
    notif_fin_envoyee = models.BooleanField(default=False)

    @property
    def montant_depense(self):
        """Calcule le total des dépenses PROPRE au budget (indépendant des transactions manuelles)"""
        return self.depenses.aggregate(total=models.Sum('montant'))['total'] or 0

    @property
    def pourcentage_utilise(self):
        if self.montant_prevu > 0:
            return round((float(self.montant_depense) / float(self.montant_prevu)) * 100, 2)
        return 0

    @property
    def est_depasse(self):
        return self.montant_depense > self.montant_prevu

    def __str__(self):
        return f"Budget {self.categorie} - {self.utilisateur}"

    def envoyer_notification_fin(self):
        """Envoie une notification de fin de budget avec toutes les dépenses du budget."""
        from notifications.models import Notification

        depenses = self.depenses.all().order_by('date_creation')
        details = "\n".join([
            f"  - {d.date_creation.strftime('%d/%m/%Y %H:%M')} : {float(d.montant):.2f} MRU"
            + (f" ({d.description})" if d.description else "")
            for d in depenses
        ])

        message = (
            f"🏁 Budget terminé : {self.categorie.nom}\n"
            f"Période : {self.date_debut.strftime('%d/%m/%Y')} → {self.date_fin.strftime('%d/%m/%Y')}\n"
            f"Montant prévu : {float(self.montant_prevu):.2f} MRU\n"
            f"Total dépensé : {float(self.montant_depense):.2f} MRU "
            f"({'DÉPASSÉ 🚨' if self.est_depasse else f'{self.pourcentage_utilise}% utilisé'})\n"
            f"\nDétail des dépenses du budget ({depenses.count()}) :\n"
            f"{details if details else '  Aucune dépense enregistrée'}"
        )

        Notification.objects.create(
            utilisateur=self.utilisateur,
            type='budget_termine',
            message=message,
        )


class BudgetDepense(models.Model):
    """Modèle dédié aux dépenses des budgets (indépendant des transactions manuelles)"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    budget = models.ForeignKey(Budget, on_delete=models.CASCADE, related_name='depenses')
    montant = models.DecimalField(max_digits=12, decimal_places=2)
    description = models.TextField(blank=True)
    date_creation = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Dépense budget {self.budget.categorie.nom} - {self.montant} MRU"

    class Meta:
        ordering = ['-date_creation']