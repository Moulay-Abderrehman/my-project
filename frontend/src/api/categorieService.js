import api from './axios';

export const categorieService = {
  // Récupère les catégories système + celles de l'utilisateur
  getAll: (type = '') => api.get('/transactions/categories/' + (type ? `?type=${type}` : '')),

  // Crée une nouvelle catégorie perso
  create: (data) => api.post('/transactions/categories/', data),

  // Supprime (soft delete) une catégorie perso
  delete: (id) => api.delete(`/transactions/categories/${id}/`),

  // Modifie une catégorie perso
  update: (id, data) => api.patch(`/transactions/categories/${id}/`, data),
};

