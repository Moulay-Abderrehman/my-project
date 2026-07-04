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

// ── Intercepteur requête : injecte le token JWT ou token visiteur ──────────
api.interceptors.request.use(
  (config) => {
    // 🆕 Priorité au token visiteur si présent
    const visitorToken = localStorage.getItem('visitor_token');
    const token = localStorage.getItem('access_token');
    
    // 🆕 Vérifier si l'utilisateur est en mode visiteur
    const isVisitor = !!localStorage.getItem('visitor_data');
    
    if (visitorToken && isVisitor) {
      config.headers.Authorization = `Bearer ${visitorToken}`;
      console.log('[API Request - Visitor Mode]', config.method?.toUpperCase(), config.baseURL + config.url);
    } else if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('[API Request]', config.method?.toUpperCase(), config.baseURL + config.url);
    } else {
      console.log('[API Request - No Auth]', config.method?.toUpperCase(), config.baseURL + config.url);
    }
    
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

    // 🆕 EXCEPTION: Routes du mode visiteur
    if (original?.url?.includes('/initier-visiteur/') || 
        original?.url?.includes('/convertir-visiteur/') ||
        original?.url?.includes('/statut-visiteur/') ||
        original?.url?.includes('/visiteur-')) {
      console.log('[API Interceptor] ⚠️ Erreur sur route visiteur - Transmission au composant');
      return Promise.reject(error);
    }

    // 🆕 Vérifier si l'erreur est liée au mode visiteur
    if (error.response?.status === 403 && error.response?.data?.visitor_mode) {
      console.log('[API Interceptor] 🔍 Mode visiteur détecté - Action bloquée');
      // Propager l'erreur pour que le composant affiche le modal
      return Promise.reject(error);
    }

    // Éviter la boucle infinie sur la route de refresh elle-même
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      
      // 🆕 Vérifier si on est en mode visiteur
      const isVisitor = !!localStorage.getItem('visitor_data');
      if (isVisitor) {
        console.log('[API Interceptor] ⚠️ Token visiteur expiré - Nettoyage');
        localStorage.removeItem('visitor_token');
        localStorage.removeItem('visitor_data');
        // Rediriger vers la page d'accueil
        window.location.href = '/';
        return Promise.reject(new Error('Session visiteur expirée'));
      }
      
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

// 🆕 Fonction utilitaire pour vérifier si l'utilisateur est en mode visiteur
export const isVisitorMode = () => {
  return !!localStorage.getItem('visitor_data') && !!localStorage.getItem('visitor_token');
};

// 🆕 Fonction utilitaire pour obtenir le token actif
export const getActiveToken = () => {
  const visitorToken = localStorage.getItem('visitor_token');
  const token = localStorage.getItem('access_token');
  return visitorToken || token || null;
};

// 🆕 Fonction utilitaire pour nettoyer les tokens
export const clearAllTokens = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('visitor_token');
  localStorage.removeItem('visitor_data');
  localStorage.removeItem('user');
};

export default api;