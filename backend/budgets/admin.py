from django.contrib import admin
from .models import Budget


@admin.register(Budget)
class BudgetAdmin(admin.ModelAdmin):
    list_display = ['utilisateur', 'categorie', 'montant_prevu', 'date_debut', 'date_fin', 'est_actif']
    list_filter = ['est_actif', 'categorie']
    search_fields = ['utilisateur__telephone']
    