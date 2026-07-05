from rest_framework import serializers
from .models import Budget, BudgetDepense


class BudgetDepenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = BudgetDepense
        fields = ['id', 'montant', 'description', 'date_creation']


class BudgetSerializer(serializers.ModelSerializer):
    montant_depense = serializers.ReadOnlyField()
    pourcentage_utilise = serializers.ReadOnlyField()
    est_depasse = serializers.ReadOnlyField()
    categorie_nom = serializers.CharField(source='categorie.nom', read_only=True)

    class Meta:
        model = Budget
        fields = [
            'id', 'categorie', 'categorie_nom', 'montant_prevu',
            'montant_depense', 'pourcentage_utilise', 'est_depasse',
            'date_debut', 'date_fin', 'est_actif', 'date_creation',
            'couleur',
        ]
        read_only_fields = ['id', 'date_creation']