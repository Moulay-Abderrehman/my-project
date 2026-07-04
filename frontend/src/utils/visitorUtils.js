// frontend/src/utils/visitorUtils.js

/**
 * Génère des données factices pour le mode visiteur
 */
export const generateMockData = (type, count = 5) => {
  const mockTransactions = [
    { id: 1, description: 'Achat alimentation', montant: 25000, categorie: 'Alimentation', date: '2026-06-28' },
    { id: 2, description: 'Transport en commun', montant: 5000, categorie: 'Transport', date: '2026-06-27' },
    { id: 3, description: 'Facture électricité', montant: 15000, categorie: 'Utilités', date: '2026-06-26' },
    { id: 4, description: 'Abonnement streaming', montant: 8000, categorie: 'Divertissement', date: '2026-06-25' },
    { id: 5, description: 'Restaurant entreprise', montant: 35000, categorie: 'Restaurant', date: '2026-06-24' },
  ];

  const mockBudgets = [
    { id: 1, nom: 'Alimentation', montant: 100000, depense: 45000, reste: 55000 },
    { id: 2, nom: 'Transport', montant: 50000, depense: 20000, reste: 30000 },
    { id: 3, nom: 'Utilités', montant: 75000, depense: 60000, reste: 15000 },
    { id: 4, nom: 'Divertissement', montant: 40000, depense: 28000, reste: 12000 },
  ];

  const mockCategories = [
    { id: 1, nom: 'Alimentation', icon: '🍽️', color: '#ef4444' },
    { id: 2, nom: 'Transport', icon: '🚗', color: '#3b82f6' },
    { id: 3, nom: 'Utilités', icon: '💡', color: '#f59e0b' },
    { id: 4, nom: 'Divertissement', icon: '🎬', color: '#8b5cf6' },
    { id: 5, nom: 'Santé', icon: '🏥', color: '#10b981' },
  ];

  const mockStats = {
    total: 88000,
    revenus: 250000,
    depenses: 162000,
    economie: 88000,
    depensesParCategorie: [
      { nom: 'Alimentation', montant: 45000 },
      { nom: 'Transport', montant: 20000 },
      { nom: 'Utilités', montant: 60000 },
      { nom: 'Divertissement', montant: 28000 },
      { nom: 'Autres', montant: 9000 },
    ]
  };

  switch (type) {
    case 'transactions':
      return mockTransactions.slice(0, count);
    case 'budgets':
      return mockBudgets.slice(0, count);
    case 'categories':
      return mockCategories.slice(0, count);
    case 'stats':
      return mockStats;
    case 'transaction':
      return mockTransactions[0];
    case 'budget':
      return mockBudgets[0];
    default:
      return [];
  }
};

/**
 * Formate un montant en FCFA
 */
export const formatPrice = (amount) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XAF',
    minimumFractionDigits: 0,
  }).format(amount);
};

/**
 * Vérifie si une chaîne est un montant masqué
 */
export const isMaskedAmount = (value) => {
  if (typeof value !== 'string') return false;
  return value.includes('XXXX');
};

/**
 * Retourne un texte de masquage pour le mode visiteur
 */
export const getMaskedText = (type = 'default') => {
  const masks = {
    default: '••••••••',
    amount: 'XXXX FCFA',
    price: 'XXXX FCFA',
    email: '••••@••••.com',
    phone: '••••••••',
    name: 'Utilisateur ••••',
    number: '••••',
    card: '•••• •••• •••• ••••',
  };
  return masks[type] || masks.default;
};

/**
 * Retourne une couleur aléatoire pour les graphiques
 */
export const getRandomColor = () => {
  const colors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
    '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16',
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

/**
 * Vérifie si l'utilisateur est en mode visiteur
 */
export const isVisitorMode = () => {
  return !!localStorage.getItem('visitor_data') && !!localStorage.getItem('visitor_token');
};

/**
 * Nettoie toutes les données du mode visiteur
 */
export const clearVisitorData = () => {
  localStorage.removeItem('visitor_token');
  localStorage.removeItem('visitor_data');
};

/**
 * Obtient les données du visiteur depuis localStorage
 */
export const getVisitorData = () => {
  try {
    const data = localStorage.getItem('visitor_data');
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};