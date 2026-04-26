'''from transactions.models import Categorie

categories = [
    {'nom': 'Salaire', 'type': 'entree', 'couleur': '#10b981'},
    {'nom': 'Freelance', 'type': 'entree', 'couleur': '#06b6d4'},
    {'nom': 'Alimentation', 'type': 'sortie', 'couleur': '#f59e0b'},
    {'nom': 'Transport', 'type': 'sortie', 'couleur': '#3b82f6'},
    {'nom': 'Sante', 'type': 'sortie', 'couleur': '#ef4444'},
    {'nom': 'Loisirs', 'type': 'sortie', 'couleur': '#8b5cf6'},
    {'nom': 'Logement', 'type': 'sortie', 'couleur': '#06b6d4'},
    {'nom': 'Education', 'type': 'sortie', 'couleur': '#ec4899'},
    {'nom': 'Autres', 'type': 'les_deux', 'couleur': '#64748b'},
]

for c in categories:
    Categorie.objects.get_or_create(nom=c['nom'], defaults=c)

print("Categories creees :", Categorie.objects.count())'''