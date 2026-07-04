// frontend/src/components/ActionBlockedModal.js
import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Modal d'action bloquée pour le mode visiteur
 * Affiche un pop-up avec des options pour s'inscrire ou se connecter
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Contrôle l'ouverture du modal
 * @param {Function} props.onClose - Fonction pour fermer le modal
 * @param {Object} props.message - Message personnalisé
 * @param {string} props.message.title - Titre du modal
 * @param {string} props.message.message - Message principal
 * @param {string} props.message.action - Texte du bouton principal
 * @param {string} props.message.actionType - Type d'action ('signup', 'login', 'subscribe')
 */
export default function ActionBlockedModal({ isOpen, onClose, message, onAction }) {
  const navigate = useNavigate();
  const { exitVisitorMode } = useAuth();
  const modalRef = useRef(null);

  // Fermer avec Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Empêcher le scroll du body
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const defaultMessage = {
    title: '🔒 Action bloquée',
    message: 'Cette action nécessite un compte. Créez-le en 30 secondes pour profiter de tous nos services.',
    action: 'Créer un compte',
    actionType: 'signup',
  };

  const finalMessage = { ...defaultMessage, ...message };

  const handlePrimaryAction = () => {
    if (onAction) {
      onAction(finalMessage.actionType);
    } else {
      // Actions par défaut
      switch (finalMessage.actionType) {
        case 'signup':
          navigate('/inscription');
          break;
        case 'login':
          navigate('/connexion');
          break;
        case 'subscribe':
          navigate('/profil');
          break;
        default:
          navigate('/inscription');
      }
    }
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(8px)',
        animation: 'fadeIn 0.3s ease',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      <div
        ref={modalRef}
        style={{
          background: '#ffffff',
          borderRadius: 20,
          maxWidth: 420,
          width: '92%',
          padding: 0,
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          animation: 'slideUp 0.35s ease',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête avec icône */}
        <div style={{
          background: 'linear-gradient(135deg, #0c2e7c, #1e4db7)',
          padding: '32px 24px 24px',
          textAlign: 'center',
          position: 'relative',
        }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            fontSize: 32,
          }}>
            {finalMessage.title.split(' ')[0] || '🔒'}
          </div>
          <h3 style={{
            margin: 0,
            color: '#fff',
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: '-0.3px',
          }}>
            {finalMessage.title}
          </h3>
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: 12,
              right: 16,
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#fff',
              fontSize: 18,
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.25)';
              e.currentTarget.style.transform = 'rotate(90deg)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
              e.currentTarget.style.transform = 'rotate(0)';
            }}
          >
            ✕
          </button>
        </div>

        {/* Corps du modal */}
        <div style={{ padding: '24px 24px 0' }}>
          <p style={{
            margin: 0,
            color: '#475569',
            fontSize: 14,
            lineHeight: 1.6,
            textAlign: 'center',
          }}>
            {finalMessage.message}
          </p>
        </div>

        {/* Actions */}
        <div style={{
          padding: '20px 24px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}>
          <button
            onClick={handlePrimaryAction}
            style={{
              padding: '12px',
              borderRadius: 12,
              border: 'none',
              background: 'linear-gradient(135deg, #0c2e7c, #1e4db7)',
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(12,46,124,0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <span>{finalMessage.action}</span>
            <span style={{ fontSize: 16 }}>→</span>
          </button>

          <div style={{
            display: 'flex',
            gap: 10,
          }}>
            <button
              onClick={() => {
                if (finalMessage.actionType !== 'login') {
                  navigate('/connexion');
                } else {
                  navigate('/inscription');
                }
                onClose();
              }}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: 10,
                border: '1px solid #d1d5db',
                background: 'transparent',
                color: '#4b5563',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f3f4f6';
                e.currentTarget.style.borderColor = '#9ca3af';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = '#d1d5db';
              }}
            >
              {finalMessage.actionType === 'login' ? 'Créer un compte' : 'Se connecter'}
            </button>

            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: 10,
                border: '1px solid #e5e7eb',
                background: 'transparent',
                color: '#6b7280',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f9fafb';
                e.currentTarget.style.borderColor = '#d1d5db';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = '#e5e7eb';
              }}
            >
              Continuer à explorer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}