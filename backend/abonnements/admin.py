from django.contrib import admin
from .models import Plan, Feature, PlanFeature, Abonnement, Paiement

@admin.register(Plan)
class PlanAdmin(admin.ModelAdmin):
    list_display = ['nom', 'prix_mensuel', 'prix_annuel', 'nb_categories_max']

@admin.register(Feature)
class FeatureAdmin(admin.ModelAdmin):
    list_display = ['code', 'label']

@admin.register(PlanFeature)
class PlanFeatureAdmin(admin.ModelAdmin):
    list_display = ['plan', 'feature']

@admin.register(Abonnement)
class AbonnementAdmin(admin.ModelAdmin):
    list_display = ['utilisateur', 'plan', 'type', 'statut', 'date_debut', 'date_fin']
    list_filter = ['statut', 'type', 'plan']
    search_fields = ['utilisateur__telephone', 'utilisateur__nom']

@admin.register(Paiement)
class PaiementAdmin(admin.ModelAdmin):
    list_display = ['abonnement', 'montant', 'statut', 'reference', 'date_paiement']
    list_filter = ['statut', 'methode']