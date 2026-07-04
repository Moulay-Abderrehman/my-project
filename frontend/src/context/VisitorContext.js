// frontend/src/context/VisitorContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import api from '../api/axios';

const VisitorContext = createContext(null);

export function VisitorProvider({ children }) {
  const { user, isVisitor, setUser, setIsVisitor } = useAuth();
  const [visitorData, setVisitorData] = useState(null);
  const [visitorToken, setVisitorToken] = useState(null);
  const [loading, setLoading] = useState(false);

  // Vérifier si le mode visiteur est actif au chargement
  useEffect(() => {
    const token = localStorage.getItem('visitor_token');
    const data = localStorage.getItem('visitor_data');
    
    if (token && data) {
      try {
        const parsedData = JSON.parse(data);
        setVisitorToken(token);
        setVisitorData(parsedData);
        // Le mode visiteur est déjà géré par AuthContext
      } catch (error) {
        console.error('[VisitorContext] Erreur chargement données:', error);
        localStorage.removeItem('visitor_token');
        localStorage.removeItem('visitor_data');
      }
    }
  }, []);

  // Entrer en mode visiteur
  const enterVisitorMode = useCallback(async (email = '', prenom = 'Explorateur', nom = 'Démo') => {
    setLoading(true);
    try {
      const response = await api.post('/comptes/initier-visiteur/', {
        email: email || '',
        prenom: prenom,
        nom: nom,
      });

      const data = response.data;
      
      // Stocker les données du visiteur
      if (data.access) {
        localStorage.setItem('visitor_token', data.access);
        localStorage.setItem('visitor_data', JSON.stringify(data.user));
        setVisitorToken(data.access);
        setVisitorData(data.user);
        
        // Mettre à jour le contexte Auth
        if (setIsVisitor) setIsVisitor(true);
        if (setUser) {
          setUser({
            id: data.user?.id || 'visitor',
            prenom: data.user?.prenom || prenom,
            nom: data.user?.nom || nom,
            email: data.user?.email || 'demo@exploration.com',
            role: 'visiteur',
            est_visiteur: true,
            photo_profil: null,
          });
        }
        
        // Configurer l'API avec le token visiteur
        api.defaults.headers.common['Authorization'] = `Bearer ${data.access}`;
        
        return data;
      } else {
        throw new Error('Token non reçu');
      }
    } catch (error) {
      console.error('[VisitorContext] Erreur entrée mode visiteur:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setIsVisitor, setUser]);

  // ✅ Quitter le mode visiteur - Version corrigée avec log
  const exitVisitorMode = useCallback(() => {
    console.log('[VisitorContext] Quitter le mode visiteur');
    
    // Nettoyer localStorage
    localStorage.removeItem('visitor_token');
    localStorage.removeItem('visitor_data');
    
    // Nettoyer les états
    setVisitorToken(null);
    setVisitorData(null);
    
    // Nettoyer le header de l'API
    delete api.defaults.headers.common['Authorization'];
    
    // Mettre à jour le contexte Auth
    if (setIsVisitor) setIsVisitor(false);
    if (setUser) setUser(null);
    
    console.log('[VisitorContext] Mode visiteur quitté avec succès');
  }, [setIsVisitor, setUser]);

  // Convertir le visiteur en utilisateur réel
  const convertVisitorToUser = useCallback(async (userData) => {
    setLoading(true);
    try {
      const response = await api.post('/comptes/convertir-visiteur/', userData);
      const data = response.data;
      
      // Nettoyer le mode visiteur
      localStorage.removeItem('visitor_token');
      localStorage.removeItem('visitor_data');
      setVisitorToken(null);
      setVisitorData(null);
      delete api.defaults.headers.common['Authorization'];
      
      // Stocker les nouvelles données
      if (data.access) {
        localStorage.setItem('access_token', data.access);
        localStorage.setItem('refresh_token', data.refresh);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Mettre à jour le contexte Auth
        if (setIsVisitor) setIsVisitor(false);
        if (setUser) setUser(data.user);
        
        // Configurer l'API avec le nouveau token
        api.defaults.headers.common['Authorization'] = `Bearer ${data.access}`;
        
        return data;
      } else {
        throw new Error('Token non reçu');
      }
    } catch (error) {
      console.error('[VisitorContext] Erreur conversion:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setIsVisitor, setUser]);

  // Vérifier si la session visiteur est toujours valide
  const checkVisitorSession = useCallback(async () => {
    if (!isVisitor) return { valid: false, message: 'Non en mode visiteur' };
    
    try {
      const response = await api.get('/comptes/statut-visiteur/');
      return response.data;
    } catch (error) {
      console.error('[VisitorContext] Erreur vérification session:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        // Session expirée, nettoyer
        exitVisitorMode();
        return { valid: false, expired: true, message: 'Session visiteur expirée' };
      }
      return { valid: false, message: 'Erreur de vérification' };
    }
  }, [isVisitor, exitVisitorMode]);

  // Obtenir les données de démonstration
  const getDemoData = useCallback(async () => {
    if (!isVisitor) return null;
    
    try {
      const response = await api.get('/abonnements/visiteur-demo-data/');
      return response.data;
    } catch (error) {
      console.error('[VisitorContext] Erreur chargement données démo:', error);
      return null;
    }
  }, [isVisitor]);

  // ✅ Valeurs exportées
  const value = {
    visitorData,
    visitorToken,
    loading,
    enterVisitorMode,
    exitVisitorMode,  // ✅ Fonction corrigée
    convertVisitorToUser,
    checkVisitorSession,
    getDemoData,
    isVisitor,
  };

  return (
    <VisitorContext.Provider value={value}>
      {children}
    </VisitorContext.Provider>
  );
}

export function useVisitor() {
  const context = useContext(VisitorContext);
  if (!context) {
    throw new Error('useVisitor doit être utilisé à l\'intérieur d\'un VisitorProvider');
  }
  return context;
}