#backend/abonnements/serializers.py
from rest_framework import serializers
from .models import Plan, Feature, PlanFeature, Abonnement, Paiement, CompteEncaissement


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
    duree_jours              = serializers.ReadOnlyField()

    class Meta:
        model  = Abonnement
        fields = [
            'id', 'utilisateur', 'plan', 'plan_nom', 'plan_detail',
            'type', 'statut', 'date_debut', 'date_fin', 'montant',
            'est_actif', 'jours_restants', 'nb_categories_autorisees',
            'duree_jours', 'nb_renouvellements',
        ]
        read_only_fields = ['id', 'utilisateur', 'date_debut', 'date_fin', 'montant', 'statut', 'nb_renouvellements']

    def get_est_actif(self, obj):               return obj.est_actif()
    def get_jours_restants(self, obj):          return obj.jours_restants()
    def get_plan_nom(self, obj):                return obj.get_plan_nom()
    def get_nb_categories_autorisees(self, obj): return obj.nb_categories_autorisees()


class SouscriptionSerializer(serializers.Serializer):
    email              = serializers.EmailField()
    type_abonnement    = serializers.ChoiceField(choices=['mensuel', '2_mois', '3_mois', '6_mois', 'annuel'])
    type_utilisateur   = serializers.ChoiceField(choices=['standard', 'entreprise'])
    code_confirmation  = serializers.CharField(required=False, allow_blank=True)


class PaiementSerializer(serializers.ModelSerializer):
    capture_ecran_url = serializers.SerializerMethodField()

    class Meta:
        model  = Paiement
        fields = '__all__'

    def get_capture_ecran_url(self, obj):
        if obj.capture_ecran:
            try:
                return obj.capture_ecran.url
            except ValueError:
                return None
        return None


# ─── Serializer pour les comptes d'encaissement ─────────────────────────────
class CompteEncaissementSerializer(serializers.ModelSerializer):
    class Meta:
        model  = CompteEncaissement
        fields = ['id', 'methode', 'numero_compte', 'nom_titulaire', 'instructions', 'actif']