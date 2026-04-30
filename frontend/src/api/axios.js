// frontend/src/api/axios.js
import axios from 'axios';

// Utiliser la variable d'environnement pour l'URL de l'API
// En développement: fallback vers localhost
// En production: utilise REACT_APP_API_URL du fichier .env.production
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

console.log('[API] Base URL configurée:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  // 🔥 Désactiver toute tentative de HTTPS
  withCredentials: false,
});

// Debug: afficher l'URL utilisée (utile pour vérifier la configuration)
console.log(`[API] Configurée avec: ${API_URL}`);

// ── Intercepteur requête : injecte le token JWT ──────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Log pour déboguer
    console.log('[API Request]', config.method?.toUpperCase(), config.baseURL + config.url);
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
            `${API_URL}/token/refresh/`,
            { refresh },
          );
          localStorage.setItem('access_token', data.access);
          original.headers.Authorization = `Bearer ${data.access}`;
          return api(original);
        } catch (refreshError) {
          // Refresh expiré → déconnexion forcée
          console.error('Refresh token invalide, déconnexion...');
          localStorage.clear();
          sessionStorage.clear();
          window.location.href = '/';
          return Promise.reject(refreshError);
        }
      } else {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '/';
      }
    }

    return Promise.reject(error);
  },
);

export default api;