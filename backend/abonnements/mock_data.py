# backend/abonnements/mock_data.py
"""
Données de démonstration pour le mode visiteur (backend)
Ces données sont utilisées pour afficher une interface fonctionnelle en mode exploration
"""

from datetime import datetime, timedelta

# ─── STATISTIQUES DE DÉMONSTRATION ──────────────────────────────────────────
MOCK_STATS = {
    'total_balance': 0,
    'total_revenus': 245000,
    'total_depenses': 157000,
    'economie': 88000,
    'transactions_aujourd_hui': 3,
    'budgets_actifs': 4,
    'depenses_par_categorie': [
        {'nom': 'Alimentation', 'montant': 45000, 'couleur': '#ef4444', 'pourcentage': 28.7},
        {'nom': 'Transport', 'montant': 20000, 'couleur': '#3b82f6', 'pourcentage': 12.7},
        {'nom': 'Utilités', 'montant': 60000, 'couleur': '#f59e0b', 'pourcentage': 38.2},
        {'nom': 'Divertissement', 'montant': 28000, 'couleur': '#8b5cf6', 'pourcentage': 17.8},
        {'nom': 'Autres', 'montant': 4000, 'couleur': '#ec4899', 'pourcentage': 2.6},
    ],
    'transactions_recentes': [
        {'id': 1, 'description': 'Achat alimentation', 'montant': 25000, 'categorie': 'Alimentation', 'date': '2026-06-28', 'type': 'depense'},
        {'id': 2, 'description': 'Transport en commun', 'montant': 5000, 'categorie': 'Transport', 'date': '2026-06-27', 'type': 'depense'},
        {'id': 3, 'description': 'Facture électricité', 'montant': 15000, 'categorie': 'Utilités', 'date': '2026-06-26', 'type': 'depense'},
        {'id': 4, 'description': 'Salaire mensuel', 'montant': 250000, 'categorie': 'Revenu', 'date': '2026-06-25', 'type': 'revenu'},
        {'id': 5, 'description': 'Abonnement streaming', 'montant': 8000, 'categorie': 'Divertissement', 'date': '2026-06-24', 'type': 'depense'},
    ]
}

# ─── TRANSACTIONS DE DÉMONSTRATION ──────────────────────────────────────────
MOCK_TRANSACTIONS = [
    {
        'id': 1, 
        'description': 'Achat alimentation', 
        'montant': 25000, 
        'categorie': 'Alimentation', 
        'date': '2026-06-28', 
        'type': 'depense', 
        'notes': 'Courses du mois',
        'categorie_id': 1
    },
    {
        'id': 2, 
        'description': 'Transport en commun', 
        'montant': 5000, 
        'categorie': 'Transport', 
        'date': '2026-06-27', 
        'type': 'depense', 
        'notes': 'Carte de transport',
        'categorie_id': 2
    },
    {
        'id': 3, 
        'description': 'Facture électricité', 
        'montant': 15000, 
        'categorie': 'Utilités', 
        'date': '2026-06-26', 
        'type': 'depense', 
        'notes': 'ENEO',
        'categorie_id': 3
    },
    {
        'id': 4, 
        'description': 'Abonnement streaming', 
        'montant': 8000, 
        'categorie': 'Divertissement', 
        'date': '2026-06-25', 
        'type': 'depense', 
        'notes': 'Netflix',
        'categorie_id': 4
    },
    {
        'id': 5, 
        'description': 'Restaurant', 
        'montant': 35000, 
        'categorie': 'Restaurant', 
        'date': '2026-06-24', 
        'type': 'depense', 
        'notes': 'Dîner entreprise',
        'categorie_id': 7
    },
    {
        'id': 6, 
        'description': 'Salaire mensuel', 
        'montant': 250000, 
        'categorie': 'Revenu', 
        'date': '2026-06-25', 
        'type': 'revenu', 
        'notes': 'Salaire juin',
        'categorie_id': 8
    },
    {
        'id': 7, 
        'description': 'Achat vêtements', 
        'montant': 12000, 
        'categorie': 'Habillement', 
        'date': '2026-06-23', 
        'type': 'depense', 
        'notes': '',
        'categorie_id': 6
    },
]

# ─── BUDGETS DE DÉMONSTRATION ──────────────────────────────────────────────
MOCK_BUDGETS = [
    {
        'id': 1, 
        'nom': 'Alimentation', 
        'montant': 100000, 
        'depense': 45000, 
        'reste': 55000, 
        'couleur': '#ef4444', 
        'icon': '🍽️',
        'pourcentage': 45
    },
    {
        'id': 2, 
        'nom': 'Transport', 
        'montant': 50000, 
        'depense': 20000, 
        'reste': 30000, 
        'couleur': '#3b82f6', 
        'icon': '🚗',
        'pourcentage': 40
    },
    {
        'id': 3, 
        'nom': 'Utilités', 
        'montant': 75000, 
        'depense': 60000, 
        'reste': 15000, 
        'couleur': '#f59e0b', 
        'icon': '💡',
        'pourcentage': 80
    },
    {
        'id': 4, 
        'nom': 'Divertissement', 
        'montant': 40000, 
        'depense': 28000, 
        'reste': 12000, 
        'couleur': '#8b5cf6', 
        'icon': '🎬',
        'pourcentage': 70
    },
]

# ─── CATÉGORIES DE DÉMONSTRATION ──────────────────────────────────────────
MOCK_CATEGORIES = [
    {'id': 1, 'nom': 'Alimentation', 'icon': '🍽️', 'couleur': '#ef4444', 'type': 'depense'},
    {'id': 2, 'nom': 'Transport', 'icon': '🚗', 'couleur': '#3b82f6', 'type': 'depense'},
    {'id': 3, 'nom': 'Utilités', 'icon': '💡', 'couleur': '#f59e0b', 'type': 'depense'},
    {'id': 4, 'nom': 'Divertissement', 'icon': '🎬', 'couleur': '#8b5cf6', 'type': 'depense'},
    {'id': 5, 'nom': 'Santé', 'icon': '🏥', 'couleur': '#10b981', 'type': 'depense'},
    {'id': 6, 'nom': 'Habillement', 'icon': '👔', 'couleur': '#ec4899', 'type': 'depense'},
    {'id': 7, 'nom': 'Restaurant', 'icon': '🍴', 'couleur': '#f97316', 'type': 'depense'},
    {'id': 8, 'nom': 'Revenu', 'icon': '💰', 'couleur': '#22c55e', 'type': 'revenu'},
]

# ─── NOTIFICATIONS DE DÉMONSTRATION ────────────────────────────────────────
MOCK_NOTIFICATIONS = [
    {
        'id': 1, 
        'titre': 'Bienvenue sur FinanceApp !', 
        'message': 'Explorez notre application et découvrez toutes ses fonctionnalités.', 
        'date': '2026-06-01', 
        'lue': True,
        'type': 'information'
    },
    {
        'id': 2, 
        'titre': '💡 Astuce du jour', 
        'message': 'Créez votre premier budget pour mieux gérer vos finances personnelles.', 
        'date': '2026-06-02', 
        'lue': False,
        'type': 'conseil'
    },
    {
        'id': 3, 
        'titre': '📊 Statistiques disponibles', 
        'message': 'Visualisez vos dépenses par catégorie dans le tableau de bord.', 
        'date': '2026-06-03', 
        'lue': False,
        'type': 'information'
    },
    {
        'id': 4, 
        'titre': '🎯 Objectif du mois', 
        'message': 'Définissez vos objectifs financiers pour le mois de juillet.', 
        'date': '2026-06-04', 
        'lue': False,
        'type': 'objectif'
    },
]

# ─── MESSAGES D'INCITATION À S'INSCRIRE ────────────────────────────────────
MOCK_INVITATION_MESSAGES = {
    'transaction': {
        'title': '💳 Gérez vos transactions',
        'message': 'Créez un compte pour ajouter, modifier et supprimer vos transactions en temps réel.',
        'action': 'Créer un compte',
        'action_type': 'signup',
        'icone': '💳'
    },
    'budget': {
        'title': '📊 Budgets personnalisés',
        'message': 'Créez des budgets sur mesure et suivez vos dépenses automatiquement.',
        'action': 'Commencer maintenant',
        'action_type': 'signup',
        'icone': '📊'
    },
    'category': {
        'title': '🏷️ Catégories personnalisées',
        'message': 'Organisez vos finances avec des catégories personnalisées.',
        'action': 'Créer un compte',
        'action_type': 'signup',
        'icone': '🏷️'
    },
    'profile': {
        'title': '👤 Profil complet',
        'message': 'Personnalisez votre profil et gérez vos préférences.',
        'action': 'S\'inscrire',
        'action_type': 'signup',
        'icone': '👤'
    },
    'subscribe': {
        'title': '🚀 Passez à la vitesse supérieure',
        'message': 'Abonnez-vous pour débloquer toutes les fonctionnalités premium !',
        'action': 'Voir les offres',
        'action_type': 'subscribe',
        'icone': '🚀'
    },
    'dashboard': {
        'title': '📊 Tableau de bord',
        'message': 'Visualisez vos finances en un coup d\'œil avec des graphiques interactifs.',
        'action': 'Commencer',
        'action_type': 'signup',
        'icone': '📊'
    }
}

# ─── STATISTIQUES DES VISITEURS ────────────────────────────────────────────
VISITOR_STATS = {
    'total_visiteurs': 0,
    'visiteurs_aujourd_hui': 0,
    'taux_conversion': 0,
    'pages_populaires': [
        {'page': 'Dashboard', 'visites': 0},
        {'page': 'Transactions', 'visites': 0},
        {'page': 'Budgets', 'visites': 0},
    ]
}