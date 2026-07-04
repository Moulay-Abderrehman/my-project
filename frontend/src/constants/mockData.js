// frontend/src/constants/mockData.js

/**
 * Données factices pour le mode visiteur
 * Ces données sont utilisées pour montrer l'interface sans données réelles
 */

export const MOCK_USER = {
  id: 999,
  prenom: 'Explorateur',
  nom: 'Démo',
  email: 'demo@exploration.com',
  telephone: '••••••••',
  photo_profil: null,
  role: 'visiteur',
  date_inscription: '2026-06-01',
};

export const MOCK_ABONNEMENT = {
  id: 999,
  plan_nom: 'demo',
  plan_id: 0,
  est_actif: false,
  date_debut: '2026-06-01',
  date_fin: null,
  jours_restants: 0,
};

// Statistiques de démonstration
export const MOCK_STATS = {
  total_balance: 0,
  total_revenus: 245000,
  total_depenses: 157000,
  economie: 88000,
  transactions_aujourd_hui: 3,
  budgets_actifs: 4,
  depenses_par_categorie: [
    { nom: 'Alimentation', montant: 45000, couleur: '#ef4444' },
    { nom: 'Transport', montant: 20000, couleur: '#3b82f6' },
    { nom: 'Utilités', montant: 60000, couleur: '#f59e0b' },
    { nom: 'Divertissement', montant: 28000, couleur: '#8b5cf6' },
    { nom: 'Santé', montant: 4000, couleur: '#10b981' },
  ],
  transactions_recentes: [
    { id: 1, description: 'Achat alimentation', montant: 25000, categorie: 'Alimentation', date: '2026-06-28', type: 'depense' },
    { id: 2, description: 'Transport en commun', montant: 5000, categorie: 'Transport', date: '2026-06-27', type: 'depense' },
    { id: 3, description: 'Facture électricité', montant: 15000, categorie: 'Utilités', date: '2026-06-26', type: 'depense' },
    { id: 4, description: 'Salaire mensuel', montant: 250000, categorie: 'Revenu', date: '2026-06-25', type: 'revenu' },
  ],
};

// Transactions de démonstration
export const MOCK_TRANSACTIONS = [
  { id: 1, description: 'Achat alimentation', montant: 25000, categorie: 'Alimentation', date: '2026-06-28', type: 'depense', notes: '' },
  { id: 2, description: 'Transport en commun', montant: 5000, categorie: 'Transport', date: '2026-06-27', type: 'depense', notes: 'Carte de transport' },
  { id: 3, description: 'Facture électricité', montant: 15000, categorie: 'Utilités', date: '2026-06-26', type: 'depense', notes: 'ENEO' },
  { id: 4, description: 'Abonnement streaming', montant: 8000, categorie: 'Divertissement', date: '2026-06-25', type: 'depense', notes: 'Netflix' },
  { id: 5, description: 'Restaurant', montant: 35000, categorie: 'Restaurant', date: '2026-06-24', type: 'depense', notes: 'Dîner entreprise' },
  { id: 6, description: 'Salaire mensuel', montant: 250000, categorie: 'Revenu', date: '2026-06-25', type: 'revenu', notes: 'Salaire juin' },
  { id: 7, description: 'Achat vêtements', montant: 12000, categorie: 'Habillement', date: '2026-06-23', type: 'depense', notes: '' },
];

// Budgets de démonstration
export const MOCK_BUDGETS = [
  { id: 1, nom: 'Alimentation', montant: 100000, depense: 45000, reste: 55000, couleur: '#ef4444', icon: '🍽️' },
  { id: 2, nom: 'Transport', montant: 50000, depense: 20000, reste: 30000, couleur: '#3b82f6', icon: '🚗' },
  { id: 3, nom: 'Utilités', montant: 75000, depense: 60000, reste: 15000, couleur: '#f59e0b', icon: '💡' },
  { id: 4, nom: 'Divertissement', montant: 40000, depense: 28000, reste: 12000, couleur: '#8b5cf6', icon: '🎬' },
];

// Catégories de démonstration
export const MOCK_CATEGORIES = [
  { id: 1, nom: 'Alimentation', icon: '🍽️', couleur: '#ef4444' },
  { id: 2, nom: 'Transport', icon: '🚗', couleur: '#3b82f6' },
  { id: 3, nom: 'Utilités', icon: '💡', couleur: '#f59e0b' },
  { id: 4, nom: 'Divertissement', icon: '🎬', couleur: '#8b5cf6' },
  { id: 5, nom: 'Santé', icon: '🏥', couleur: '#10b981' },
  { id: 6, nom: 'Habillement', icon: '👔', couleur: '#ec4899' },
  { id: 7, nom: 'Restaurant', icon: '🍴', couleur: '#f97316' },
  { id: 8, nom: 'Revenu', icon: '💰', couleur: '#22c55e' },
];

// Notifications de démonstration
export const MOCK_NOTIFICATIONS = [
  { id: 1, titre: 'Bienvenue sur FinanceApp !', message: 'Explorez notre application et découvrez toutes ses fonctionnalités.', date: '2026-06-01', lue: true },
  { id: 2, titre: '💡 Astuce', message: 'Créez votre premier budget pour mieux gérer vos finances.', date: '2026-06-02', lue: false },
  { id: 3, titre: '📊 Statistiques', message: 'Visualisez vos dépenses par catégorie dans le tableau de bord.', date: '2026-06-03', lue: false },
];

// Employés de démonstration
export const MOCK_EMPLOYES = [
  { id: 1, prenom: 'Marie', nom: 'Dupont', email: 'marie.dupont@demo.com', is_active: true, invitation_email: 'marie.dupont@demo.com' },
  { id: 2, prenom: 'Jean', nom: 'Martin', email: 'jean.martin@demo.com', is_active: true, invitation_email: 'jean.martin@demo.com' },
  { id: 3, prenom: '', nom: '', email: '', is_active: false, invitation_email: 'invitation@demo.com' },
];

// Messages d'incitation à s'inscrire
export const MOCK_INVITATION_MESSAGES = {
  transaction: {
    title: '💳 Gérez vos transactions',
    message: 'Créez un compte pour ajouter, modifier et supprimer vos transactions en temps réel.',
  },
  budget: {
    title: '📊 Budgets personnalisés',
    message: 'Créez des budgets sur mesure et suivez vos dépenses automatiquement.',
  },
  category: {
    title: '🏷️ Catégories',
    message: 'Organisez vos finances avec des catégories personnalisées.',
  },
  profile: {
    title: '👤 Profil complet',
    message: 'Personnalisez votre profil et gérez vos préférences.',
  },
  subscribe: {
    title: '🚀 Passez à la vitesse supérieure',
    message: 'Abonnez-vous pour débloquer toutes les fonctionnalités premium !',
  },
};