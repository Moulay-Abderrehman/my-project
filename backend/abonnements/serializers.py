from rest_framework import serializers
from .models import Plan, Feature, PlanFeature, Abonnement, Paiement, CompteEncaissement
from django.utils import timezone


class PlanSerializer(serializers.ModelSerializer):
    features = serializers.SerializerMethodField()
    #  Nouveau champ pour indiquer si c'est un plan de démo
    est_demo = serializers.BooleanField(read_only=True)
    #  Nouveau champ pour l'affichage
    est_plan_demo = serializers.SerializerMethodField()
    #  Nouveau champ pour le libellé formaté
    libelle = serializers.SerializerMethodField()

    class Meta:
        model  = Plan
        fields = [
            'id', 'nom', 'prix_mensuel', 'prix_annuel', 
            'nb_categories_max', 'description', 'features',
            'est_demo', 'est_plan_demo', 'libelle', 'ordre_affichage'
        ]

    def get_features(self, obj):
        return [pf.feature.code for pf in obj.features.select_related('feature').all()]
    
    def get_est_plan_demo(self, obj):
        """Vérifie si c'est un plan de démonstration"""
        return obj.est_plan_demo()
    
    def get_libelle(self, obj):
        """Retourne un libellé formaté pour le plan"""
        if obj.est_plan_demo():
            return "🔍 Mode Exploration"
        return obj.get_nom_display()


class AbonnementSerializer(serializers.ModelSerializer):
    est_actif               = serializers.SerializerMethodField()
    jours_restants          = serializers.SerializerMethodField()
    plan_nom                = serializers.SerializerMethodField()
    nb_categories_autorisees = serializers.SerializerMethodField()
    plan_detail             = PlanSerializer(source='plan', read_only=True)
    duree_jours              = serializers.ReadOnlyField()
    
    # Nouveaux champs pour le mode visiteur
    est_demo_mode           = serializers.SerializerMethodField()
    est_visiteur            = serializers.SerializerMethodField()
    est_lecture_seule       = serializers.SerializerMethodField()
    est_expire              = serializers.SerializerMethodField()
    est_abonne              = serializers.SerializerMethodField()
    peut_creer_transaction  = serializers.SerializerMethodField()
    peut_creer_budget       = serializers.SerializerMethodField()
    peut_modifier_profil    = serializers.SerializerMethodField()
    est_entreprise          = serializers.SerializerMethodField()
    type_display            = serializers.SerializerMethodField()
    statut_display          = serializers.SerializerMethodField()
    plan_display            = serializers.SerializerMethodField()

    class Meta:
        model  = Abonnement
        fields = [
            'id', 'utilisateur', 'plan', 'plan_nom', 'plan_detail',
            'type', 'statut', 'date_debut', 'date_fin', 'montant',
            'est_actif', 'jours_restants', 'nb_categories_autorisees',
            'duree_jours', 'nb_renouvellements',
            # Nouveaux champs
            'est_demo_mode', 'est_visiteur', 'est_lecture_seule',
            'est_expire', 'est_abonne', 'peut_creer_transaction',
            'peut_creer_budget', 'peut_modifier_profil', 'est_entreprise',
            'type_display', 'statut_display', 'plan_display',
            # Champs de démonstration
            'est_demo', 'date_expiration_demo'
        ]
        read_only_fields = [
            'id', 'utilisateur', 'date_debut', 'date_fin', 'montant', 
            'statut', 'nb_renouvellements', 'est_demo', 'date_expiration_demo'
        ]

    # ── Méthodes existantes (conservées) ──────────────────────────────────
    def get_est_actif(self, obj):
        return obj.est_actif()
    
    def get_jours_restants(self, obj):
        return obj.jours_restants()
    
    def get_plan_nom(self, obj):
        return obj.get_plan_nom()
    
    def get_nb_categories_autorisees(self, obj):
        return obj.nb_categories_autorisees()
    
    # Nouvelles méthodes pour le mode visiteur
    def get_est_demo_mode(self, obj):
        """Vérifie si c'est un mode démo/visiteur"""
        return obj.est_demo_mode()
    
    def get_est_visiteur(self, obj):
        """Alias pour est_demo_mode (compatibilité frontend)"""
        return obj.est_demo_mode()
    
    def get_est_lecture_seule(self, obj):
        """Indique si l'abonnement est en lecture seule"""
        return obj.est_lecture_seule
    
    def get_est_expire(self, obj):
        """Vérifie si l'abonnement est expiré"""
        return obj.est_expire()
    
    def get_est_abonne(self, obj):
        """Vérifie si l'utilisateur est réellement abonné (hors démo)"""
        return obj.est_abonne()
    
    def get_peut_creer_transaction(self, obj):
        """Vérifie si l'utilisateur peut créer des transactions"""
        return obj.peut_creer_transaction()
    
    def get_peut_creer_budget(self, obj):
        """Vérifie si l'utilisateur peut créer des budgets"""
        return obj.peut_creer_budget()
    
    def get_peut_modifier_profil(self, obj):
        """Vérifie si l'utilisateur peut modifier son profil"""
        return obj.peut_modifier_profil()
    
    def get_est_entreprise(self, obj):
        """Vérifie si c'est un abonnement entreprise"""
        return obj.est_entreprise()
    
    def get_type_display(self, obj):
        """Retourne le libellé du type"""
        if obj.est_demo_mode():
            return "Mode Exploration"
        return dict(Abonnement.TYPE_CHOICES).get(obj.type, obj.type)
    
    def get_statut_display(self, obj):
        """Retourne le libellé du statut"""
        if obj.est_demo_mode():
            return "Exploration"
        return dict(Abonnement.STATUT_CHOICES).get(obj.statut, obj.statut)
    
    def get_plan_display(self, obj):
        """Retourne l'affichage du plan"""
        if obj.est_demo_mode():
            return "🔍 Mode Exploration"
        return obj.get_plan_display()


class SouscriptionSerializer(serializers.Serializer):
    email              = serializers.EmailField()
    type_abonnement    = serializers.ChoiceField(choices=['mensuel', '2_mois', '3_mois', '6_mois', 'annuel'])
    type_utilisateur   = serializers.ChoiceField(choices=['standard', 'entreprise'])
    code_confirmation  = serializers.CharField(required=False, allow_blank=True)
    
    # Nouveaux champs pour la souscription depuis le mode visiteur
    from_visitor_mode  = serializers.BooleanField(required=False, default=False)
    visitor_data       = serializers.JSONField(required=False, allow_null=True)


class PaiementSerializer(serializers.ModelSerializer):
    capture_ecran_url = serializers.SerializerMethodField()
    
    # Nouveaux champs pour le suivi des paiements en mode visiteur
    est_paiement_demo = serializers.SerializerMethodField()
    statut_display    = serializers.SerializerMethodField()
    methode_display   = serializers.SerializerMethodField()

    class Meta:
        model  = Paiement
        fields = '__all__'
        read_only_fields = ['id', 'date_paiement', 'date_validation']

    def get_capture_ecran_url(self, obj):
        if obj.capture_ecran:
            try:
                return obj.capture_ecran.url
            except ValueError:
                return None
        return None
    
    def get_est_paiement_demo(self, obj):
        """Vérifie si le paiement est lié à un abonnement de démonstration"""
        try:
            return obj.abonnement.est_demo_mode()
        except:
            return False
    
    def get_statut_display(self, obj):
        """Retourne le libellé du statut"""
        return dict(Paiement.STATUT_CHOICES).get(obj.statut, obj.statut)
    
    def get_methode_display(self, obj):
        """Retourne le libellé de la méthode"""
        return dict(Paiement.METHODE_CHOICES).get(obj.methode, obj.methode)


# ─── Serializer pour les comptes d'encaissement ─────────────────────────────
class CompteEncaissementSerializer(serializers.ModelSerializer):
    methode_display = serializers.SerializerMethodField()

    class Meta:
        model  = CompteEncaissement
        fields = ['id', 'methode', 'methode_display', 'numero_compte', 'nom_titulaire', 'instructions', 'actif']
        read_only_fields = ['id']

    def get_methode_display(self, obj):
        return obj.get_methode_display()


# NOUVEAU SERIALIZER : Données de démonstration pour le mode visiteur
class VisitorDemoDataSerializer(serializers.Serializer):
    """
    Serializer pour les données de démonstration en mode visiteur
    """
    # Informations de l'utilisateur démo
    prenom = serializers.CharField(default="Explorateur")
    nom = serializers.CharField(default="Démo")
    email = serializers.CharField(default="demo@exploration.com")
    
    # Statistiques de démonstration
    stats = serializers.DictField(default={
        'total_balance': 0,
        'total_revenus': 245000,
        'total_depenses': 157000,
        'economie': 88000,
        'transactions_aujourd_hui': 3,
        'budgets_actifs': 4,
    })
    
    # Données de démonstration
    transactions = serializers.ListField(default=[])
    budgets = serializers.ListField(default=[])
    categories = serializers.ListField(default=[])
    notifications = serializers.ListField(default=[])
    
    # Messages d'incitation
    messages = serializers.DictField(default={
        'inscription': '✨ Créez un compte pour débloquer toutes les fonctionnalités !',
        'abonnement': '🚀 Passez à la vitesse supérieure avec un abonnement premium !',
    })
    
    # Indicateur de mode
    est_visiteur = serializers.BooleanField(default=True)
    mode_lecture_seule = serializers.BooleanField(default=True)


# NOUVEAU SERIALIZER : Statistiques de démonstration
class VisitorStatsSerializer(serializers.Serializer):
    """
    Serializer pour les statistiques de démonstration en mode visiteur
    """
    total_transactions = serializers.IntegerField(default=7)
    total_budgets = serializers.IntegerField(default=4)
    total_categories = serializers.IntegerField(default=8)
    total_revenus = serializers.DecimalField(max_digits=15, decimal_places=2, default=250000)
    total_depenses = serializers.DecimalField(max_digits=15, decimal_places=2, default=157000)
    balance = serializers.DecimalField(max_digits=15, decimal_places=2, default=93000)
    depenses_par_categorie = serializers.ListField(default=[
        {'nom': 'Alimentation', 'montant': 45000, 'pourcentage': 28.7},
        {'nom': 'Utilités', 'montant': 60000, 'pourcentage': 38.2},
        {'nom': 'Transport', 'montant': 20000, 'pourcentage': 12.7},
        {'nom': 'Divertissement', 'montant': 28000, 'pourcentage': 17.8},
        {'nom': 'Autres', 'montant': 4000, 'pourcentage': 2.6},
    ])
    transactions_recentes = serializers.ListField(default=[])
    budgets_actifs = serializers.ListField(default=[])
    
    # Métadonnées
    mise_a_jour = serializers.DateTimeField(default=timezone.now)
    mode = serializers.CharField(default="visiteur")


# NOUVEAU SERIALIZER : Conversion visiteur -> utilisateur réel
class VisitorToUserSerializer(serializers.Serializer):
    """
    Serializer pour la conversion d'un visiteur en utilisateur réel
    """
    email = serializers.EmailField(required=True)
    password = serializers.CharField(min_length=8, required=True)
    prenom = serializers.CharField(max_length=50, required=True)
    nom = serializers.CharField(max_length=50, required=True)
    telephone = serializers.CharField(max_length=20, required=True)
    
    # Données optionnelles à conserver de la session visiteur
    conserver_donnees_demo = serializers.BooleanField(default=False)
    
    # Plan d'abonnement choisi
    type_abonnement = serializers.ChoiceField(
        choices=['mensuel', '2_mois', '3_mois', '6_mois', 'annuel'],
        required=False,
        allow_blank=True
    )
    type_utilisateur = serializers.ChoiceField(
        choices=['standard', 'entreprise'],
        default='standard'
    )


# NOUVEAU SERIALIZER : Message d'incitation personnalisé
class VisitorInvitationSerializer(serializers.Serializer):
    """
    Serializer pour les messages d'incitation à s'inscrire
    """
    titre = serializers.CharField()
    message = serializers.CharField()
    action = serializers.CharField()
    action_type = serializers.ChoiceField(choices=['signup', 'login', 'subscribe'])
    icone = serializers.CharField(required=False, default='🚀')
    priorite = serializers.IntegerField(default=0)
    est_actif = serializers.BooleanField(default=True)