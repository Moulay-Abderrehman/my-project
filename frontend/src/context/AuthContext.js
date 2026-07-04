// frontend/src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [abonnement, setAbonnement] = useState(null);
  const [notifNonLues, setNotifNonLues] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // 🆕 État pour le mode visiteur
  const [isVisitor, setIsVisitor] = useState(false);
  const [visitorData, setVisitorData] = useState(null);

  const chargerAbonnement = useCallback(async () => {
    try {
      const res = await api.get('/abonnements/detail/');
      setAbonnement(res.data);
    } catch {
      setAbonnement(null);
    }
  }, []);

  const chargerNotifs = useCallback(async () => {
    try {
      const res = await api.get('/notifications/non-lues/');
      setNotifNonLues(res.data.non_lues || 0);
    } catch {
      setNotifNonLues(0);
    }
  }, []);

  // Recharger le profil depuis l'API (utile après mise à jour)
  const rechargerProfil = useCallback(async () => {
    try {
      const res = await api.get('/comptes/profil/');
      const updated = res.data;
      setUser(updated);
      localStorage.setItem('user', JSON.stringify(updated));
    } catch { /* ignore */ }
  }, []);

  // 🆕 Vérifier si l'utilisateur est en mode visiteur au chargement
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const userData = localStorage.getItem('user');
    const visitorToken = localStorage.getItem('visitor_token');
    const visitorDataStr = localStorage.getItem('visitor_data');

    // 🆕 Priorité au mode visiteur si présent
    if (visitorToken && visitorDataStr) {
      try {
        const parsed = JSON.parse(visitorDataStr);
        setVisitorData(parsed);
        setIsVisitor(true);
        // Créer un utilisateur factice pour le mode visiteur
        setUser({
          id: 'visitor',
          prenom: parsed.prenom || 'Explorateur',
          nom: parsed.nom || 'Démo',
          email: parsed.email || 'demo@exploration.com',
          role: 'visiteur',
          est_visiteur: true,
          photo_profil: null,
        });
        // Configurer l'API avec le token visiteur
        api.defaults.headers.common['Authorization'] = `Bearer ${visitorToken}`;
        setLoading(false);
        return;
      } catch {
        localStorage.removeItem('visitor_token');
        localStorage.removeItem('visitor_data');
      }
    }

    if (token && userData) {
      try {
        const parsed = JSON.parse(userData);
        setUser(parsed);
        chargerAbonnement();
        chargerNotifs();
      } catch {
        localStorage.clear();
      }
    }
    setLoading(false);
  }, [chargerAbonnement, chargerNotifs]);

  // ── Helpers — tous sont des FONCTIONS ────────────────────────────────────
  const estAbonne = () => {
    if (isVisitor) return false;
    return abonnement?.est_actif === true;
  };
  
  const estEnEssai = () => {
    if (isVisitor) return false;
    return abonnement?.est_actif === true && abonnement?.plan_nom === 'essai';
  };
  
  const estExpire = () => {
    if (isVisitor) return false;
    return !abonnement || abonnement?.est_actif === false;
  };
  
  const getPlanNom = () => {
    if (isVisitor) return 'demo';
    return abonnement?.plan_nom || 'essai';
  };

  // ── estEntreprise : vérifie user.role OU abonnement.plan_nom ─────────────
  const estEntreprise = () => {
    if (isVisitor) return false;
    if (!user) return false;
    if (user.role === 'entreprise') return true;
    if (abonnement?.plan_nom === 'entreprise') return true;
    return false;
  };

  // 🆕 Vérifier si l'utilisateur est en mode lecture seule
  const estLectureSeule = () => {
    if (isVisitor) return true;
    if (estExpire()) return true;
    return false;
  };

  // 🆕 Vérifier si l'utilisateur peut effectuer des actions
  const peutAgir = () => {
    if (isVisitor) return false;
    if (estExpire()) return false;
    return true;
  };

  // ── Connexion par email OU téléphone ─────────────────────────────────────
  const connexion = async (emailOuTelephone, password) => {
    const isEmail = emailOuTelephone.includes('@');
    const payload = isEmail
      ? { email: emailOuTelephone, password }
      : { telephone: emailOuTelephone, password };

    const res = await api.post('/comptes/connexion/', payload);
    localStorage.setItem('access_token', res.data.access);
    localStorage.setItem('refresh_token', res.data.refresh);
    localStorage.setItem('user', JSON.stringify(res.data.user));
    
    // 🆕 Si on était en mode visiteur, le nettoyer
    if (isVisitor) {
      localStorage.removeItem('visitor_token');
      localStorage.removeItem('visitor_data');
      delete api.defaults.headers.common['Authorization'];
      setIsVisitor(false);
      setVisitorData(null);
    }
    
    setUser(res.data.user);
    await chargerAbonnement();
    await chargerNotifs();
    return res.data;
  };

  // ── Déconnexion ────────────────────────────────────────────────────────────
  const deconnexion = async () => {
    try {
      const refresh = localStorage.getItem('refresh_token');
      await api.post('/comptes/deconnexion/', { refresh });
    } catch { /* ignore */ }
    
    // Nettoyer tous les tokens
    localStorage.clear();
    localStorage.removeItem('visitor_token');
    localStorage.removeItem('visitor_data');
    delete api.defaults.headers.common['Authorization'];
    
    setUser(null);
    setAbonnement(null);
    setNotifNonLues(0);
    setIsVisitor(false);
    setVisitorData(null);
  };

  // 🆕 Entrer en mode visiteur
  const enterVisitorMode = async (email = null, prenom = 'Explorateur', nom = 'Démo') => {
    try {
      const response = await api.post('/comptes/initier-visiteur/', {
        email: email || '',
        prenom: prenom,
        nom: nom,
      });
      
      const data = response.data;
      
      // Stocker les données du visiteur
      localStorage.setItem('visitor_token', data.access);
      localStorage.setItem('visitor_data', JSON.stringify(data.user));
      
      setIsVisitor(true);
      setVisitorData(data.user);
      setUser({
        id: data.user.id || 'visitor',
        prenom: data.user.prenom || prenom,
        nom: data.user.nom || nom,
        email: data.user.email || 'demo@exploration.com',
        role: 'visiteur',
        est_visiteur: true,
        photo_profil: null,
      });
      
      // Configurer l'API avec le token visiteur
      api.defaults.headers.common['Authorization'] = `Bearer ${data.access}`;
      
      return data;
    } catch (error) {
      console.error('Erreur lors de l\'entrée en mode visiteur:', error);
      throw error;
    }
  };

  // 🆕 Quitter le mode visiteur - Version corrigée SANS redirection automatique
  const exitVisitorMode = () => {
    console.log('[AuthContext] Quitter le mode visiteur');
    
    // Nettoyer localStorage
    localStorage.removeItem('visitor_token');
    localStorage.removeItem('visitor_data');
    
    // Nettoyer le header de l'API
    delete api.defaults.headers.common['Authorization'];
    
    // Réinitialiser les états
    setIsVisitor(false);
    setVisitorData(null);
    setUser(null);
    
    console.log('[AuthContext] Mode visiteur quitté avec succès');
  };

  // 🆕 Convertir le visiteur en utilisateur réel
  const convertVisitorToUser = async (userData) => {
    try {
      const response = await api.post('/comptes/convertir-visiteur/', userData);
      const data = response.data;
      
      // Nettoyer le mode visiteur
      localStorage.removeItem('visitor_token');
      localStorage.removeItem('visitor_data');
      delete api.defaults.headers.common['Authorization'];
      setIsVisitor(false);
      setVisitorData(null);
      
      // Stocker les nouvelles données
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      setUser(data.user);
      await chargerAbonnement();
      await chargerNotifs();
      
      return data;
    } catch (error) {
      console.error('Erreur lors de la conversion:', error);
      throw error;
    }
  };

  const mettreAJourUser = (infos) => {
    if (isVisitor) return; // Ne pas modifier en mode visiteur
    const updated = { ...user, ...infos };
    setUser(updated);
    localStorage.setItem('user', JSON.stringify(updated));
  };

  // ✅ Valeurs exportées
  return (
    <AuthContext.Provider value={{
      // États
      user,
      setUser,
      abonnement,
      notifNonLues,
      loading,
      
      // Mode visiteur
      isVisitor,
      setIsVisitor,
      visitorData,
      setVisitorData,
      
      // Helpers existants
      estAbonne,
      estEnEssai,
      estExpire,
      getPlanNom,
      estEntreprise,
      
      // Nouveaux helpers
      estLectureSeule,
      peutAgir,
      
      // Fonctions mode visiteur
      enterVisitorMode,
      exitVisitorMode,  // ✅ Sans redirection automatique
      convertVisitorToUser,
      
      // Fonctions existantes
      connexion,
      deconnexion,
      mettreAJourUser,
      rechargerProfil,
      chargerAbonnement,
      chargerNotifs,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être dans <AuthProvider>');
  return ctx;
}