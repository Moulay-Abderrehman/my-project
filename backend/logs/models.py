from django.db import models
import uuid

class Log(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    # Ajout de null=True pour permettre les logs d'utilisateurs anonymes
    utilisateur = models.ForeignKey(
        'comptes.Utilisateur', 
        on_delete=models.CASCADE, 
        related_name='logs',
        null=True,
        blank=True
    )
    action = models.CharField(max_length=50)
    details = models.TextField(blank=True)
    adresse_ip = models.GenericIPAddressField(null=True, blank=True)
    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date_creation']
        verbose_name = "Log"
        verbose_name_plural = "Logs"

    def __str__(self):
        user_display = self.utilisateur if self.utilisateur else "Système/Anonyme"
        return f"[{self.action}] {user_display} — {self.date_creation.strftime('%d/%m/%Y %H:%M')}"