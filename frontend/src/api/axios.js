// frontend/src/api/axios.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

console.log('[API] Base URL configurée:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: false,
});

console.log(`[API] Configurée avec: ${API_URL}`);

// ── Intercepteur requête : injecte le token JWT ──────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('[API Request]', config.method?.toUpperCase(), config.baseURL + config.url);
    return config;
  },
  (error) => {
    console.error('[API] Erreur de requête:', error);
    return Promise.reject(error);
  }
);

// ── Intercepteur réponse : refresh automatique du token si 401 ───────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    // 🔥 EXCEPTION: Si c'est la route de connexion, on ne fait rien
    // On laisse le composant gérer l'erreur 401
    if (original?.url?.includes('/comptes/connexion/')) {
      console.log('[API Interceptor] ⚠️ Erreur sur route de connexion - Transmission au composant');
      return Promise.reject(error);
    }

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
          console.error('[API Interceptor] Refresh token expiré');
          localStorage.clear();
          sessionStorage.clear();
          // ⚠️ NE PAS REDIRIGER - laisser le composant gérer
          return Promise.reject(refreshError);
        }
      } else {
        // Pas de refresh token
        console.log('[API Interceptor] Pas de refresh token');
        // ⚠️ NE PAS REDIRIGER
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);

export default api;