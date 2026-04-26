from django.contrib import admin
from .models import Log


@admin.register(Log)
class LogActiviteAdmin(admin.ModelAdmin):
    list_display = ['utilisateur', 'action', 'adresse_ip', 'date_creation']
    list_filter = ['action', 'date_creation', 'utilisateur']
    # Barre de recherche
    search_fields = ['utilisateur__telephone', 'action', 'details']
    readonly_fields = ['utilisateur', 'action', 'details', 'adresse_ip', 'date_creation']
    # Organisation de l'affichage détaillé (optionnel)
    fieldsets = (
        (None, {
            'fields': ('utilisateur', 'action', 'adresse_ip')
        }),
        ('Détails', {
            'fields': ('details', 'date_creation')
        }),
    )

    def has_add_permission(self, request):
        """Empêche l'ajout manuel de logs via l'admin (lecture seule)"""
        return False