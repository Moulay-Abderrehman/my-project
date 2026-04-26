from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta

class Command(BaseCommand):
    help = "Initialise les plans et catégories de base."

    def handle(self, *args, **kwargs):
        self._init_plans()
        self._init_categories()
        self.stdout.write(self.style.SUCCESS("✅ Initialisation terminée."))

    def _init_plans(self):
        from abonnements.models import Plan, Feature, PlanFeature

        plans_data = [
            {'nom': 'essai', 'prix_mensuel': 0, 'prix_annuel': 0, 'nb_categories_max': 5, 'description': 'Essai gratuit 14 jours.'},
            {'nom': 'standard', 'prix_mensuel': 500, 'prix_annuel': 5000, 'nb_categories_max': -1, 'description': 'Accès complet.'},
            {'nom': 'entreprise', 'prix_mensuel': 2000, 'prix_annuel': 20000, 'nb_categories_max': -1, 'description': 'Multi-utilisateurs.'},
        ]
        for p in plans_data:
            Plan.objects.update_or_create(nom=p['nom'], defaults=p)

        features_data = [
            {'code': 'transactions', 'label': 'Gestion des transactions'},
            {'code': 'budgets', 'label': 'Gestion des budgets'},
            {'code': 'categories_illimitees', 'label': 'Catégories illimitées'},
            {'code': 'export_pdf', 'label': 'Export PDF'},
            {'code': 'invitation_employes', 'label': "Invitation d'employés"},
        ]
        for f in features_data:
            Feature.objects.get_or_create(code=f['code'], defaults=f)

        assoc = {
            'essai': ['transactions', 'budgets'],
            'standard': ['transactions', 'budgets', 'categories_illimitees', 'export_pdf'],
            'entreprise': ['transactions', 'budgets', 'categories_illimitees', 'export_pdf', 'invitation_employes'],
        }
        for nom_plan, codes in assoc.items():
            plan = Plan.objects.get(nom=nom_plan)
            for code in codes:
                feat = Feature.objects.get(code=code)
                PlanFeature.objects.get_or_create(plan=plan, feature=feat)

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
            Categorie.objects.get_or_create(nom=c['nom'], utilisateur=None, defaults=c)