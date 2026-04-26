from rest_framework import serializers
from .models import Plan, Feature, PlanFeature, Abonnement, Paiement


class PlanSerializer(serializers.ModelSerializer):
    features = serializers.SerializerMethodField()

    class Meta:
        model  = Plan
        fields = ['id', 'nom', 'prix_mensuel', 'prix_annuel', 'nb_categories_max', 'description', 'features']

    def get_features(self, obj):
        return [pf.feature.code for pf in obj.features.select_related('feature').all()]


class AbonnementSerializer(serializers.ModelSerializer):
    est_actif               = serializers.SerializerMethodField()
    jours_restants          = serializers.SerializerMethodField()
    plan_nom                = serializers.SerializerMethodField()
    nb_categories_autorisees = serializers.SerializerMethodField()
    plan_detail             = PlanSerializer(source='plan', read_only=True)

    class Meta:
        model  = Abonnement
        fields = [
            'id', 'utilisateur', 'plan', 'plan_nom', 'plan_detail',
            'type', 'statut', 'date_debut', 'date_fin', 'montant',
            'est_actif', 'jours_restants', 'nb_categories_autorisees',
        ]
        read_only_fields = ['id', 'utilisateur', 'date_debut', 'date_fin', 'montant', 'statut']

    def get_est_actif(self, obj):               return obj.est_actif()
    def get_jours_restants(self, obj):          return obj.jours_restants()
    def get_plan_nom(self, obj):                return obj.get_plan_nom()
    def get_nb_categories_autorisees(self, obj): return obj.nb_categories_autorisees()


class SouscriptionSerializer(serializers.Serializer):
    email              = serializers.EmailField()
    type_abonnement    = serializers.ChoiceField(choices=['mensuel', 'annuel'])
    type_utilisateur   = serializers.ChoiceField(choices=['standard', 'entreprise'])
    code_confirmation  = serializers.CharField(required=False, allow_blank=True)


class PaiementSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Paiement
        fields = '__all__'

