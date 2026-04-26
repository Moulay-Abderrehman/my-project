from django.db import models
import uuid
 
 
class Notification(models.Model):
    TYPE_CHOICES = [
        ('alerte_budget', 'Alerte Budget'),
        ('depassement_budget', 'Dépassement Budget'),
        ('budget_termine', 'Budget Terminé'),
        ('expiration_abonnement', 'Expiration Abonnement'),
        ('info', 'Information'),
        ('contact', 'Contact'),
    ]
 
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    utilisateur = models.ForeignKey('comptes.Utilisateur', on_delete=models.CASCADE, related_name='notifications')
    type = models.CharField(max_length=30, choices=TYPE_CHOICES, default='info')
    message = models.TextField()
    est_lue = models.BooleanField(default=False)
    date_creation = models.DateTimeField(auto_now_add=True)
    date_lecture = models.DateTimeField(null=True, blank=True)


    class Meta:
        ordering = ['-date_creation']
        verbose_name = "Notification"
        verbose_name_plural = "Notifications"
 
    def __str__(self):
        return f"[{self.type}] {self.utilisateur} - {self.date_creation.strftime('%d/%m/%Y')}"