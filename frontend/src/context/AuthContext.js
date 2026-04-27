import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,         setUser]         = useState(null);
  const [abonnement,   setAbonnement]   = useState(null);
  const [notifNonLues, setNotifNonLues] = useState(0);
  const [loading,      setLoading]      = useState(true);

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

  useEffect(() => {
    const token    = localStorage.getItem('access_token');
    const userData = localStorage.getItem('user');
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
  const estAbonne     = () => abonnement?.est_actif === true;
  const estEnEssai    = () => abonnement?.est_actif === true && abonnement?.plan_nom === 'essai';
  const estExpire     = () => !abonnement || abonnement?.est_actif === false;
  const getPlanNom    = () => abonnement?.plan_nom || 'essai';

  // ── estEntreprise : vérifie user.role OU abonnement.plan_nom ─────────────
  // Robuste : fonctionne même si le role n'est pas dans localStorage
  const estEntreprise = () => {
    if (!user) return false;
    // Vérifier le role stocké en localStorage
    if (user.role === 'entreprise') return true;
    // Vérifier aussi via l'abonnement (plan actif entreprise)
    if (abonnement?.plan_nom === 'entreprise') return true;
    return false;
  };

  // ── Connexion par email OU téléphone ─────────────────────────────────────
  const connexion = async (emailOuTelephone, password) => {
    const isEmail = emailOuTelephone.includes('@');
    const payload = isEmail
      ? { email: emailOuTelephone, password }
      : { telephone: emailOuTelephone, password };

    const res = await api.post('/comptes/connexion/', payload);
    localStorage.setItem('access_token',  res.data.access);
    localStorage.setItem('refresh_token', res.data.refresh);
    localStorage.setItem('user',          JSON.stringify(res.data.user));
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
    localStorage.clear();
    setUser(null);
    setAbonnement(null);
    setNotifNonLues(0);
  };

  const mettreAJourUser = (infos) => {
    const updated = { ...user, ...infos };
    setUser(updated);
    localStorage.setItem('user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{
      user,
      abonnement,
      notifNonLues,
      loading,
      estAbonne,        // FONCTION → appeler estAbonne()
      estEnEssai,       // FONCTION → appeler estEnEssai()
      estExpire,        // FONCTION → appeler estExpire()
      getPlanNom,       // FONCTION → appeler getPlanNom()
      estEntreprise,    // FONCTION → appeler estEntreprise()
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
