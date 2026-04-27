import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';

// ─── Google OAuth helper ─────────────────────────────────────────────────────
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';

export default function AuthChoix() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('choix'); // 'choix' | 'sso'
  const [domaine, setDomaine] = useState('');
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingSSO, setLoadingSSO] = useState(false);

  // ── Continuer avec Google ─────────────────────────────────────────────────
  const continuerGoogle = () => {
    if (!GOOGLE_CLIENT_ID) {
      toast.error("Google OAuth n'est pas configuré. Configurez REACT_APP_GOOGLE_CLIENT_ID.");
      return;
    }
    setLoadingGoogle(true);
    const params = new URLSearchParams({
      client_id:     GOOGLE_CLIENT_ID,
      redirect_uri:  `${window.location.origin}/auth/google/callback`,
      response_type: 'code',
      scope:         'openid email profile',
      access_type:   'offline',
      prompt:        'select_account',
    });
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  };

  // ── Continuer avec Email ──────────────────────────────────────────────────
  const continuerEmail = () => {
    navigate('/connexion');
  };

  // ── Continuer avec SSO (modifié pour utiliser l'API) ──────────────────────
  const continuerSSO = async (e) => {
    e.preventDefault();
    if (!domaine.trim()) { 
      toast.error('Entrez votre domaine ou email professionnel.'); 
      return; 
    }
    
    const d = domaine.toLowerCase().trim();
    const dom = d.includes('@') ? d.split('@')[1] : d;
    
    setLoadingSSO(true);
    
    try {
      // Appeler l'API backend pour obtenir l'URL de redirection SSO
      const response = await api.get(`/comptes/auth/sso/?domain=${dom}`);
      
      if (response.data && response.data.auth_url) {
        // Rediriger vers le serveur SSO
        window.location.href = response.data.auth_url;
      } else {
        toast.error('Erreur de configuration SSO.');
        setLoadingSSO(false);
      }
    } catch (error) {
      console.error('Erreur SSO:', error);
      toast.error(error.response?.data?.error || 'Impossible de contacter le serveur SSO. Réessayez plus tard.');
      setLoadingSSO(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0c2e7c, #1e4db7, #3b82f6)',
      display: 'flex',
      flexWrap: 'wrap',
      fontFamily: "'Sora', sans-serif",
      overflowX: 'hidden',
      position: 'relative',
    }}>

      {/* ── Fond décoratif ─────────────────────────────────────────────────── */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', width: 600, height: 600,
          borderRadius: '50%', top: -200, left: '50%', transform: 'translateX(-50%)',
          background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
          backgroundSize: '44px 44px',
        }} />
      </div>

      {/* ── Panneau gauche (Hero) ─────────────────────────────────────────── */}
      <div style={{
        flex: '1 1 500px',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', padding: '60px 80px',
        position: 'relative', zIndex: 1,
      }} className="auth-hero">
        
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 60 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0c2e7c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
            </svg>
          </div>
          <span style={{ fontWeight: 700, fontSize: 18, color: '#fff', letterSpacing: '-0.3px' }}>
            Finance<span style={{ color: '#dbeafe' }}>App</span>
          </span>
        </div>

        {/* Titre */}
        <div style={{ maxWidth: 550 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 20, padding: '5px 14px', marginBottom: 24,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: 12, color: '#fff', fontWeight: 500 }}>Gestion financière intelligente</span>
          </div>

          <h1 style={{
            fontSize: 'clamp(40px, 5vw, 56px)', fontWeight: 800, color: '#fff',
            lineHeight: 1.1, margin: '0 0 20px',
            letterSpacing: '-1.5px',
          }}>
            Prenez le<br />
            <span style={{
              background: 'linear-gradient(135deg, #fff, #bfdbfe, #60a5fa)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              contrôle
            </span>
            <br />de vos finances
          </h1>

          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.85)', lineHeight: 1.7, margin: '0 0 40px' }}>
            Gérez vos budgets, suivez vos dépenses et atteignez vos objectifs financiers en toute simplicité.
          </p>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 32 }}>
            {[
              { val: '10k+', label: 'Utilisateurs' },
              { val: '99.9%', label: 'Disponibilité' },
              { val: '256-bit', label: 'Chiffrement' },
            ].map(s => (
              <div key={s.val}>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>{s.val}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Panneau droit (Auth card) ─────────────────────────────────────── */}
      <div style={{
        flex: '1 1 450px', 
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '40px 48px', position: 'relative', zIndex: 1,
      }}>
        <div style={{
          width: '100%', maxWidth: 440,
          background: 'rgba(255, 255, 255, 0.98)',
          borderRadius: 24,
          padding: '40px 36px',
          boxShadow: '0 24px 80px rgba(0,0,0,0.25)',
        }}>

          {/* ── Vue Choix ────────────────────────────────────────────────── */}
          {mode === 'choix' && (
            <>
              <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <h2 style={{ margin: '0 0 6px', fontSize: 24, fontWeight: 700, color: '#0c2e7c' }}>
                  Commencer
                </h2>
                <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
                  Choisissez votre méthode de connexion
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                {/* Continuer avec Email */}
                <button onClick={continuerEmail} style={{
                  width: '100%', padding: '15px',
                  background: '#0c2e7c',
                  border: 'none', borderRadius: 14, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  color: '#fff', fontSize: 15, fontWeight: 600, fontFamily: "'Sora',sans-serif",
                  boxShadow: '0 4px 15px rgba(12,46,124,0.3)',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.background='#163e96'; }}
                onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.background='#0c2e7c'; }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                  </svg>
                  Continuer avec Email
                </button>

                {/* Continuer avec Google */}
                <button onClick={continuerGoogle} disabled={loadingGoogle} style={{
                  width: '100%', padding: '14px',
                  background: '#fff',
                  border: '1px solid #e2e8f0', borderRadius: 14, cursor: loadingGoogle ? 'wait' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  color: '#1e293b', fontSize: 15, fontWeight: 500, fontFamily: "'Sora',sans-serif",
                  transition: '0.2s',
                }}
                onMouseEnter={e => { if(!loadingGoogle) e.currentTarget.style.background='#f8fafc'; }}
                onMouseLeave={e => { e.currentTarget.style.background='#fff'; }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  {loadingGoogle ? 'Redirection...' : 'Continuer avec Google'}
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '8px 0' }}>
                  <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
                  <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>OU</span>
                  <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
                </div>

                {/* Continuer avec SSO */}
                <button onClick={() => setMode('sso')} style={{
                  width: '100%', padding: '14px',
                  background: 'transparent',
                  border: '1px solid #0c2e7c', borderRadius: 14, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  color: '#0c2e7c', fontSize: 15, fontWeight: 600, fontFamily: "'Sora',sans-serif",
                  transition: '0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background='rgba(12,46,124,0.05)'; }}
                onMouseLeave={e => { e.currentTarget.style.background='transparent'; }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                  </svg>
                  Continuer avec SSO
                </button>
              </div>

              {/* Pied */}
              <div style={{ marginTop: 32, textAlign: 'center' }}>
                <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
                  Pas encore de compte ?{' '}
                  <Link to="/inscription" style={{ color: '#0c2e7c', fontWeight: 700, textDecoration: 'none' }}>
                    S'inscrire
                  </Link>
                </p>
              </div>
            </>
          )}

          {/* ── Vue SSO ──────────────────────────────────────────────────── */}
          {mode === 'sso' && (
            <>
              <button onClick={() => setMode('choix')} style={{
                background: 'none', border: 'none', cursor: 'pointer', color: '#64748b',
                display: 'flex', alignItems: 'center', gap: 6, marginBottom: 24, padding: 0,
                fontSize: 13, fontWeight: 600,
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
                Retour
              </button>

              <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0c2e7c', marginBottom: 10 }}>
                Connexion SSO
              </h2>
              <p style={{ fontSize: 13, color: '#64748b', marginBottom: 24 }}>
                Entrez votre domaine ou email professionnel
              </p>

              <form onSubmit={continuerSSO} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <input
                  type="text" 
                  value={domaine} 
                  onChange={e => setDomaine(e.target.value)}
                  placeholder="exemple.com ou nom@entreprise.com"
                  required
                  style={{
                    width: '100%', padding: '14px', borderRadius: 12,
                    border: '1px solid #e2e8f0', outline: 'none',
                    fontSize: 14, boxSizing: 'border-box',
                    fontFamily: "'Sora', sans-serif",
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={e => e.target.style.borderColor = '#0c2e7c'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                />
                <button 
                  type="submit" 
                  disabled={loadingSSO}
                  style={{
                    width: '100%', padding: '14px',
                    background: loadingSSO ? '#94a3b8' : '#0c2e7c', 
                    color: '#fff',
                    border: 'none', borderRadius: 12, 
                    cursor: loadingSSO ? 'not-allowed' : 'pointer',
                    fontWeight: 600, fontSize: 15,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: 8,
                    transition: 'all 0.2s',
                    opacity: loadingSSO ? 0.7 : 1,
                  }}
                  onMouseEnter={e => { if(!loadingSSO) e.currentTarget.style.background = '#1e4db7'; }}
                  onMouseLeave={e => { if(!loadingSSO) e.currentTarget.style.background = '#0c2e7c'; }}
                >
                  {loadingSSO ? (
                    <>
                      <span style={{
                        width: 16, height: 16,
                        border: '2px solid rgba(255,255,255,0.3)',
                        borderTopColor: '#fff',
                        borderRadius: '50%',
                        display: 'inline-block',
                        animation: 'spin 0.7s linear infinite',
                      }} />
                      Redirection...
                    </>
                  ) : (
                    'Continuer →'
                  )}
                </button>
              </form>

              <p style={{ marginTop: 20, fontSize: 12, color: '#94a3b8', textAlign: 'center' }}>
                Vous serez redirigé vers le portail d'authentification de votre entreprise.
              </p>
            </>
          )}
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&display=swap');
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @media (max-width: 900px) {
          .auth-hero { 
            padding: 40px 30px !important; 
            text-align: center; 
            align-items: center; 
            flex: 1 1 100% !important;
          }
        }
      `}</style>
    </div>
  );
}