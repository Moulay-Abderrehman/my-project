// frontend/src/components/VisitorBanner.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useVisitor } from '../context/VisitorContext';

export default function VisitorBanner() {
  const { isVisitor } = useAuth();
  const { exitVisitorMode } = useVisitor();
  const navigate = useNavigate();
  const [isMinimized, setIsMinimized] = useState(false);

  if (!isVisitor) return null;

  // ✅ QUITTER LE MODE VISITEUR avec un timeout pour garantir l'ordre
  const handleSignup = () => {
    console.log('🔄 Bouton "S\'inscrire" cliqué - Quitter le mode visiteur');
    
    // 1. D'abord quitter le mode visiteur
    exitVisitorMode();
    
    console.log('✅ Mode visiteur quitté, redirection vers /inscription');
    
    // 2. Utiliser un petit timeout pour laisser le temps au nettoyage
    setTimeout(() => {
      // 3. Utiliser window.location pour forcer la navigation
      window.location.href = '/inscription';
    }, 100);
  };

  const handleLogin = () => {
    console.log('🔄 Bouton "Se connecter" cliqué - Quitter le mode visiteur');
    
    // 1. D'abord quitter le mode visiteur
    exitVisitorMode();
    
    console.log('✅ Mode visiteur quitté, redirection vers /connexion');
    
    // 2. Utiliser un petit timeout pour laisser le temps au nettoyage
    setTimeout(() => {
      // 3. Utiliser window.location pour forcer la navigation
      window.location.href = '/connexion';
    }, 100);
  };

  // ==================== DESIGN TOKENS ====================
  const colors = {
    bgBase: '#0d1b2a',
    bgElevated: '#14263b',
    border: 'rgba(255,255,255,0.08)',
    borderStrong: 'rgba(255,255,255,0.14)',
    teal: '#2dd4bf',
    mint: '#5eead4',
    gold: '#e8c375',
    textPrimary: '#f1f5f9',
    textSecondary: '#94a3b8',
    textMuted: '#64748b',
  };

  const fontBody = "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif";
  const fontHeading = "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif";

  // Version réduite
  if (isMinimized) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsMinimized(false)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setIsMinimized(false); }}
        style={{
          position: 'sticky',
          top: 64,
          zIndex: 998,
          background: colors.bgElevated,
          borderBottom: `1px solid ${colors.border}`,
          padding: '8px 20px',
          minHeight: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          fontFamily: fontBody,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <i className="bx bx-search-alt-2" style={{ fontSize: 14, color: colors.teal }} />
          <span style={{ color: colors.textSecondary, fontSize: 12, fontWeight: 500, letterSpacing: '0.1px' }}>
            Mode Exploration
          </span>
        </div>
        <i className="bx bx-chevron-down" style={{ fontSize: 16, color: colors.textMuted }} />
      </div>
    );
  }

  // Version complète
  return (
    <div
      style={{
        position: 'sticky',
        top: 64,
        zIndex: 998,
        background: colors.bgElevated,
        borderBottom: `1px solid ${colors.border}`,
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
        fontFamily: fontBody,
      }}
    >
      {/* Partie gauche */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flex: 1,
          minWidth: 220,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'rgba(45,212,191,0.12)',
            border: `1px solid rgba(45,212,191,0.25)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <i className="bx bx-search-alt-2" style={{ fontSize: 18, color: colors.teal }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span
            style={{
              fontFamily: fontHeading,
              color: colors.textPrimary,
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: '-0.1px',
            }}
          >
            Mode Exploration
          </span>
          <span
            style={{
              color: colors.textSecondary,
              fontSize: 12,
              fontWeight: 400,
            }}
          >
            Visualisez l'application en avant-première
          </span>
        </div>
      </div>

      {/* Partie droite : boutons */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexWrap: 'wrap',
        }}
      >
        {/* ✅ Bouton S'inscrire - QUITTE LE MODE VISITEUR puis redirige */}
        <button
          onClick={handleSignup}
          style={{
            padding: '0 18px',
            height: 40,
            minHeight: 44,
            borderRadius: 8,
            border: 'none',
            background: colors.teal,
            color: '#0d1b2a',
            fontFamily: fontBody,
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'background 0.15s ease, transform 0.15s ease',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = colors.mint;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = colors.teal;
          }}
        >
          <i className="bx bx-sparkles" style={{ fontSize: 14 }} />
          S'inscrire gratuitement
        </button>

        {/* ✅ Bouton Se connecter - QUITTE LE MODE VISITEUR puis redirige */}
        <button
          onClick={handleLogin}
          style={{
            padding: '0 16px',
            height: 40,
            minHeight: 44,
            borderRadius: 8,
            border: `1px solid ${colors.borderStrong}`,
            background: 'transparent',
            color: colors.textPrimary,
            fontFamily: fontBody,
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
            e.currentTarget.style.borderColor = colors.teal;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.borderColor = colors.borderStrong;
          }}
        >
          Se connecter
        </button>

        {/* ✅ Bouton Réduire */}
        <button
          onClick={() => setIsMinimized(true)}
          aria-label="Réduire la bannière"
          style={{
            width: 40,
            height: 40,
            minHeight: 44,
            borderRadius: 8,
            border: 'none',
            background: 'transparent',
            color: colors.textMuted,
            fontSize: 16,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 0.15s ease, background 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = colors.textPrimary;
            e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = colors.textMuted;
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <i className="bx bx-chevron-up" />
        </button>
      </div>
    </div>
  );
}