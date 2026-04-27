// frontend/src/api/axios.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: { 'Content-Type': 'application/json' },
});

// ── Intercepteur requête : injecte le token JWT ──────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Intercepteur réponse : refresh automatique du token si 401 ───────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    // Éviter la boucle infinie sur la route de refresh elle-même
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refresh = localStorage.getItem('refresh_token');

      if (refresh) {
        try {
          const { data } = await axios.post(
            'http://localhost:8000/api/token/refresh/',
            { refresh },
          );
          localStorage.setItem('access_token', data.access);
          original.headers.Authorization = `Bearer ${data.access}`;
          return api(original); // Rejouer la requête originale
        } catch (refreshError) {
          // Refresh expiré → déconnexion forcée
          localStorage.clear();
          window.location.href = '/connexion';
          return Promise.reject(refreshError);
        }
      } else {
        // Pas de refresh token → déconnexion
        localStorage.clear();
        window.location.href = '/connexion';
      }
    }

    return Promise.reject(error);
  },
);

export default api;