from rest_framework import serializers
from .models import Transaction, Solde, Categorie


class CategorieSerializer(serializers.ModelSerializer):
    est_systeme = serializers.SerializerMethodField()

    class Meta:
        model  = Categorie
        fields = ['id', 'nom', 'icone', 'couleur', 'type', 'utilisateur', 'est_systeme']
        read_only_fields = ['utilisateur', 'est_systeme']

    def get_est_systeme(self, obj):
        return obj.utilisateur is None


class TransactionSerializer(serializers.ModelSerializer):
    categorie_detail = CategorieSerializer(source='categorie', read_only=True)

    class Meta:
        model  = Transaction
        fields = [
            'id', 'type', 'montant', 'date', 'categorie', 'categorie_detail',
            'description', 'date_creation', 'is_visible', 'source', 'budget', 'entreprise',
        ]
        read_only_fields = ['id', 'date', 'date_creation', 'is_visible', 'source', 'budget', 'entreprise']


class SoldeSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Solde
        fields = '__all__'
