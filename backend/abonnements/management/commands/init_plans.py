#backend/abonnements/management/commands/init_plans.py
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta

class Command(BaseCommand):
    help = "Initialise les plans, catégories de base, et comptes d'encaissement."

    def handle(self, *args, **kwargs):
        self._init_plans()
        self._init_categories()
        self._init_comptes_encaissement()  # NOUVEAU
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

    # ── NOUVEAU — Pré-remplissage des 2 comptes d'encaissement par défaut ───
    def _init_comptes_encaissement(self):
        from abonnements.models import CompteEncaissement

        comptes_data = [
            {
                'methode': 'rssbank',
                'numero_compte': 'À CONFIGURER',
                'nom_titulaire': 'À CONFIGURER',
                'instructions': "Effectuez le virement puis prenez une capture d'écran de la confirmation.",
                'actif': True,
            },
            {
                'methode': 'trackpay',
                'numero_compte': 'À CONFIGURER',
                'nom_titulaire': 'À CONFIGURER',
                'instructions': "Effectuez le paiement puis prenez une capture d'écran de la confirmation.",
                'actif': True,
            },
        ]
        for c in comptes_data:
            CompteEncaissement.objects.get_or_create(
                methode=c['methode'],
                defaults={
                    'numero_compte': c['numero_compte'],
                    'nom_titulaire': c['nom_titulaire'],
                    'instructions': c['instructions'],
                    'actif': c['actif'],
                },
            )