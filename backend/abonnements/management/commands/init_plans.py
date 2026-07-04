# backend/abonnements/management/commands/init_plans.py
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta

class Command(BaseCommand):
    help = "Initialise les plans, catégories de base, comptes d'encaissement et données de démonstration."

    def handle(self, *args, **kwargs):
        self.stdout.write("🚀 Début de l'initialisation...")
        
        self._init_plans()
        self._init_categories()
        self._init_comptes_encaissement()
        self._init_plan_features()
        self._init_visitor_demo_data()  # 🆕 Données de démonstration pour le mode visiteur
        
        self.stdout.write(self.style.SUCCESS("✅ Initialisation terminée avec succès."))

    def _init_plans(self):
        from abonnements.models import Plan

        plans_data = [
            {
                'nom': 'essai', 
                'prix_mensuel': 0, 
                'prix_annuel': 0, 
                'nb_categories_max': 5, 
                'description': 'Essai gratuit 30 jours.',
                'est_demo': False,
                'ordre_affichage': 1,
            },
            {
                'nom': 'standard', 
                'prix_mensuel': 500, 
                'prix_annuel': 5000, 
                'nb_categories_max': -1,  # -1 = illimité
                'description': 'Accès complet à toutes les fonctionnalités.',
                'est_demo': False,
                'ordre_affichage': 2,
            },
            {
                'nom': 'entreprise', 
                'prix_mensuel': 2000, 
                'prix_annuel': 20000, 
                'nb_categories_max': -1,  # -1 = illimité
                'description': 'Multi-utilisateurs avec gestion d\'équipe.',
                'est_demo': False,
                'ordre_affichage': 3,
            },
            # 🆕 Nouveau plan de démonstration pour le mode visiteur
            {
                'nom': 'demo', 
                'prix_mensuel': 0, 
                'prix_annuel': 0, 
                'nb_categories_max': 0,  # Pas de catégories personnalisables
                'description': '🔍 Mode Exploration - Visualisation uniquement. Créez un compte pour débloquer toutes les fonctionnalités.',
                'est_demo': True,
                'ordre_affichage': 0,  # Affiché en premier
            },
        ]
        
        for p in plans_data:
            plan, created = Plan.objects.update_or_create(
                nom=p['nom'], 
                defaults={
                    'prix_mensuel': p['prix_mensuel'],
                    'prix_annuel': p['prix_annuel'],
                    'nb_categories_max': p['nb_categories_max'],
                    'description': p['description'],
                    'est_demo': p['est_demo'],
                    'ordre_affichage': p['ordre_affichage'],
                }
            )
            if created:
                self.stdout.write(f"  ✅ Plan créé : {plan.get_nom_display()}")
            else:
                self.stdout.write(f"  🔄 Plan mis à jour : {plan.get_nom_display()}")

    def _init_categories(self):
        from transactions.models import Categorie
        
        categories = [
            {'nom': 'Salaire', 'type': 'entree', 'couleur': '#10b981', 'icone': '💰'},
            {'nom': 'Freelance', 'type': 'entree', 'couleur': '#06b6d4', 'icone': '💻'},
            {'nom': 'Alimentation', 'type': 'sortie', 'couleur': '#f59e0b', 'icone': '🛒'},
            {'nom': 'Transport', 'type': 'sortie', 'couleur': '#3b82f6', 'icone': '🚌'},
            {'nom': 'Santé', 'type': 'sortie', 'couleur': '#ef4444', 'icone': '🏥'},
            {'nom': 'Loisirs', 'type': 'sortie', 'couleur': '#8b5cf6', 'icone': '🎉'},
            {'nom': 'Logement', 'type': 'sortie', 'couleur': '#06b6d4', 'icone': '🏠'},
            {'nom': 'Éducation', 'type': 'sortie', 'couleur': '#ec4899', 'icone': '📚'},
            {'nom': 'Autres', 'type': 'les_deux', 'couleur': '#64748b', 'icone': '📦'},
        ]
        
        for c in categories:
            cat, created = Categorie.objects.get_or_create(
                nom=c['nom'], 
                utilisateur=None, 
                defaults={
                    'type': c['type'],
                    'couleur': c['couleur'],
                    'icone': c['icone'],
                }
            )
            if created:
                self.stdout.write(f"  ✅ Catégorie créée : {cat.nom}")
            else:
                self.stdout.write(f"  🔄 Catégorie déjà existante : {cat.nom}")

    def _init_comptes_encaissement(self):
        from abonnements.models import CompteEncaissement

        comptes_data = [
            {
                'methode': 'rssbank',
                'numero_compte': 'À CONFIGURER',
                'nom_titulaire': 'À CONFIGURER',
                'instructions': "Effectuez le virement vers ce compte puis prenez une capture d'écran de la confirmation.",
                'actif': True,
            },
            {
                'methode': 'sedad',
                'numero_compte': 'À CONFIGURER',
                'nom_titulaire': 'À CONFIGURER',
                'instructions': "Effectuez le virement vers ce compte puis prenez une capture d'écran de la confirmation.",
                'actif': True,
            },
            {
                'methode': 'bankily',
                'numero_compte': 'À CONFIGURER',
                'nom_titulaire': 'À CONFIGURER',
                'instructions': "Effectuez le virement vers ce compte puis prenez une capture d'écran de la confirmation.",
                'actif': True,
            },
            {
                'methode': 'masrivi',
                'numero_compte': 'À CONFIGURER',
                'nom_titulaire': 'À CONFIGURER',
                'instructions': "Effectuez le virement vers ce compte puis prenez une capture d'écran de la confirmation.",
                'actif': True,
            },
            {
                'methode': 'trackpay',
                'numero_compte': 'À CONFIGURER',
                'nom_titulaire': 'À CONFIGURER',
                'instructions': "Paiement automatique via TrackPay. Aucune action manuelle requise.",
                'actif': True,
            },
        ]
        
        for c in comptes_data:
            compte, created = CompteEncaissement.objects.get_or_create(
                methode=c['methode'],
                defaults={
                    'numero_compte': c['numero_compte'],
                    'nom_titulaire': c['nom_titulaire'],
                    'instructions': c['instructions'],
                    'actif': c['actif'],
                }
            )
            if created:
                self.stdout.write(f"  ✅ Compte d'encaissement créé : {compte.get_methode_display()}")
            else:
                self.stdout.write(f"  🔄 Compte d'encaissement déjà existant : {compte.get_methode_display()}")

    def _init_plan_features(self):
        from abonnements.models import Plan, Feature, PlanFeature

        # ── Création des fonctionnalités ──────────────────────────────────────
        features_data = [
            {'code': 'transactions', 'label': 'Gestion des transactions'},
            {'code': 'budgets', 'label': 'Gestion des budgets'},
            {'code': 'categories_illimitees', 'label': 'Catégories illimitées'},
            {'code': 'export_pdf', 'label': 'Export PDF'},
            {'code': 'invitation_employes', 'label': "Invitation d'employés"},
            # 🆕 Nouvelles fonctionnalités
            {'code': 'visiteur_mode', 'label': 'Mode Exploration'},
            {'code': 'support_prioritaire', 'label': 'Support prioritaire'},
            {'code': 'analyses_avancees', 'label': 'Analyses avancées'},
        ]
        
        for f in features_data:
            feature, created = Feature.objects.get_or_create(
                code=f['code'], 
                defaults={'label': f['label']}
            )
            if created:
                self.stdout.write(f"  ✅ Fonctionnalité créée : {feature.label}")

        # ── Association des fonctionnalités aux plans ────────────────────────
        assoc = {
            'essai': ['transactions', 'budgets', 'visiteur_mode'],
            'standard': ['transactions', 'budgets', 'categories_illimitees', 'export_pdf', 'analyses_avancees'],
            'entreprise': ['transactions', 'budgets', 'categories_illimitees', 'export_pdf', 'invitation_employes', 'analyses_avancees', 'support_prioritaire'],
            'demo': ['visiteur_mode'],  # 🆕 Le plan demo n'a que la fonctionnalité visiteur
        }
        
        for nom_plan, codes in assoc.items():
            try:
                plan = Plan.objects.get(nom=nom_plan)
                for code in codes:
                    try:
                        feat = Feature.objects.get(code=code)
                        plan_feature, created = PlanFeature.objects.get_or_create(
                            plan=plan, 
                            feature=feat
                        )
                        if created:
                            self.stdout.write(f"  ✅ Feature {code} associée au plan {nom_plan}")
                    except Feature.DoesNotExist:
                        self.stdout.write(f"  ⚠️ Feature {code} non trouvée pour le plan {nom_plan}")
            except Plan.DoesNotExist:
                self.stdout.write(f"  ⚠️ Plan {nom_plan} non trouvé")

    # 🆕 NOUVELLE MÉTHODE : Initialisation des données de démonstration
    def _init_visitor_demo_data(self):
        """
        Initialise les données de démonstration pour le mode visiteur.
        Ces données sont utilisées par VisitorDemoDataView.
        """
        self.stdout.write("📊 Initialisation des données de démonstration...")
        
        # Les données de démonstration sont stockées dans mock_data.py
        # Cette méthode crée juste un indicateur que les données sont disponibles
        from abonnements import mock_data
        
        self.stdout.write("  ✅ Données de démonstration disponibles")
        self.stdout.write(f"     - {len(mock_data.MOCK_TRANSACTIONS)} transactions")
        self.stdout.write(f"     - {len(mock_data.MOCK_BUDGETS)} budgets")
        self.stdout.write(f"     - {len(mock_data.MOCK_CATEGORIES)} catégories")
        self.stdout.write(f"     - {len(mock_data.MOCK_NOTIFICATIONS)} notifications")

    # 🆕 MÉTHODE UTILITAIRE : Créer un utilisateur de démonstration (optionnel)
    def _create_demo_user(self):
        """
        Crée un utilisateur de démonstration pour les tests.
        À utiliser uniquement en développement.
        """
        from django.contrib.auth import get_user_model
        from abonnements.models import Abonnement, Plan
        
        User = get_user_model()
        
        # Vérifier si l'utilisateur existe déjà
        demo_email = "demo@financeapp.com"
        if User.objects.filter(email=demo_email).exists():
            self.stdout.write("  ℹ️ L'utilisateur de démonstration existe déjà")
            return
        
        # Créer l'utilisateur
        user = User.objects.create_user(
            username="demo_user",
            email=demo_email,
            password="DemoPassword123!",
            prenom="Démo",
            nom="Utilisateur",
            role="standard",
            is_active=True,
        )
        
        # Créer l'abonnement
        try:
            plan_standard = Plan.objects.get(nom='standard')
            maintenant = timezone.now()
            abonnement = Abonnement.objects.create(
                utilisateur=user,
                plan=plan_standard,
                type='mensuel',
                statut='actif',
                date_debut=maintenant,
                date_fin=maintenant + timedelta(days=365),
                montant=500,
                nb_renouvellements=0,
            )
            self.stdout.write(f"  ✅ Utilisateur de démonstration créé : {demo_email}")
        except Plan.DoesNotExist:
            self.stdout.write("  ⚠️ Plan standard non trouvé, utilisateur créé sans abonnement")