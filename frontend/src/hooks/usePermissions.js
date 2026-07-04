// frontend/src/hooks/usePermissions.js
import { useAuth } from '../context/AuthContext';

/**
 * Hook de vérification des permissions
 * Combine les états d'authentification et de mode visiteur
 * 
 * @returns {Object} - Objet contenant les vérifications de permissions
 */
export function usePermissions() {
  const { user, estAbonne, estEnEssai, estExpire, estEntreprise, isVisitor, visitorData } = useAuth();

  // Vérification de base : l'utilisateur peut-il effectuer des actions ?
  const canPerformActions = () => {
    // En mode visiteur, JAMAIS d'actions
    if (isVisitor) return false;
    
    // Si pas d'utilisateur, pas d'actions
    if (!user) return false;
    
    // Si l'abonnement est expiré, pas d'actions (sauf lecture)
    if (estExpire()) return false;
    
    // Tout va bien, on peut agir
    return true;
  };

  // Vérification spécifique pour les abonnements
  const canSubscribe = () => {
    // En mode visiteur, on bloque mais on affiche le pop-up
    if (isVisitor) return { allowed: false, reason: 'visitor' };
    
    // Si déjà abonné, on permet
    if (estAbonne()) return { allowed: true };
    
    // Si en essai, on permet de voir les offres mais pas de souscrire (déjà en essai)
    if (estEnEssai()) return { allowed: true, warning: 'Vous êtes déjà en essai' };
    
    // Si expiré, on permet de souscrire
    if (estExpire()) return { allowed: true };
    
    // Par défaut, on permet
    return { allowed: true };
  };

  // Vérification pour les données sensibles
  const canViewSensitiveData = () => {
    // En mode visiteur, on masque
    if (isVisitor) return false;
    
    // Si authentifié, on montre tout
    return true;
  };

  // Vérification pour les actions de modification
  const canModify = (resource = '') => {
    // En mode visiteur, JAMAIS
    if (isVisitor) return false;
    
    // Si pas d'utilisateur, JAMAIS
    if (!user) return false;
    
    // Si abonnement expiré, JAMAIS (sauf pour les actions de base)
    if (estExpire()) {
      // On permet quand même de voir le profil et les paramètres
      if (resource === 'profile' || resource === 'settings') {
        return true;
      }
      return false;
    }
    
    // Tout va bien
    return true;
  };

  // Récupérer le message d'erreur approprié
  const getBlockedMessage = (action = 'effectuer cette action') => {
    if (isVisitor) {
      return {
        title: '🔒 Mode Exploration',
        message: `Pour ${action}, créez un compte en 30 secondes et profitez de tous nos services !`,
        action: 'Créer un compte',
        actionType: 'signup'
      };
    }
    
    if (estExpire()) {
      return {
        title: '⏳ Abonnement expiré',
        message: `Votre abonnement a expiré. Pour ${action}, veuillez souscrire à un nouvel abonnement.`,
        action: 'Souscrire',
        actionType: 'subscribe'
      };
    }
    
    if (!user) {
      return {
        title: '🔐 Connexion requise',
        message: `Veuillez vous connecter pour ${action}.`,
        action: 'Se connecter',
        actionType: 'login'
      };
    }
    
    return null;
  };

  // Helper pour masquer les données sensibles
  const maskData = (data, type = 'text') => {
    if (!isVisitor && canViewSensitiveData()) {
      return data;
    }
    
    // En mode visiteur, on masque
    switch (type) {
      case 'amount':
      case 'price':
      case 'money':
        return 'XXXX FCFA';
      case 'email':
      case 'phone':
        return '••••••••';
      case 'name':
        return 'Utilisateur ••••';
      case 'number':
        return '••••';
      default:
        return '••••';
    }
  };

  // Indicateur de mode lecture seule
  const isReadOnly = () => {
    return isVisitor || estExpire();
  };

  return {
    // États simples
    isVisitor,
    isReadOnly: isReadOnly(),
    isExpired: estExpire(),
    isAuthenticated: !!user,
    isSubscribed: estAbonne(),
    isEnterprise: estEntreprise(),
    isTrial: estEnEssai(),
    
    // Fonctions de vérification
    canPerformActions: canPerformActions(),
    canSubscribe: canSubscribe(),
    canViewSensitiveData: canViewSensitiveData(),
    canModify: canModify,
    getBlockedMessage: getBlockedMessage,
    
    // Helpers
    maskData: maskData,
    
    // Mode visiteur spécifique
    visitorData: isVisitor ? visitorData : null,
  };
}