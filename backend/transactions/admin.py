from django.contrib import admin
from .models import Transaction, Solde, Categorie


@admin.register(Categorie)
class CategorieAdmin(admin.ModelAdmin):
    list_display = ['nom', 'type', 'couleur', 'utilisateur', 'is_visible']
    list_filter = ['type', 'is_visible']
    search_fields = ['nom', 'utilisateur__telephone']
    list_editable = ['is_visible']


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ['utilisateur', 'type', 'montant', 'categorie', 'date', 'is_visible', 'source', 'entreprise']
    list_filter = ['type', 'categorie', 'is_visible', 'source']
    search_fields = ['utilisateur__telephone', 'description']
    ordering = ['-date_creation']
    list_editable = ['is_visible']


@admin.register(Solde)
class SoldeAdmin(admin.ModelAdmin):
    list_display = ['utilisateur', 'montant_total', 'total_entrees', 'total_sorties', 'derniere_maj']
    readonly_fields = ['montant_total', 'total_entrees', 'total_sorties', 'derniere_maj']
