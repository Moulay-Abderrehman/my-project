import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function Connexion() {
  const navigate = useNavigate();
  const { connexion } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  
  // ── États pour les erreurs de champ ──────────────────────────────────
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');

  // ── États pour les messages personnalisés ──────────────────────────────────
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showMessage, setShowMessage] = useState(false);

  const showCustomMessage = (type, text) => {
    setMessage({ type, text });
    setShowMessage(true);
    setTimeout(() => setShowMessage(false), 5000);
  };

  // ── Réinitialiser les erreurs lors de la saisie ──────────────────────────
  const handleEmailChange = (e) => {
    setForm({...form, email: e.target.value});
    setEmailError('');
    setGeneralError('');
  };

  const handlePasswordChange = (e) => {
    setForm({...form, password: e.target.value});
    setPasswordError('');
    setGeneralError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Réinitialiser les erreurs
    setEmailError('');
    setPasswordError('');
    setGeneralError('');
    
    setLoading(true);
    try {
      const response = await api.post('/comptes/connexion/', {
        email: form.email,
        password: form.password
      });
      
      console.log('[Connexion] Réponse:', response.data);
      
      // ═══════════════════════════════════════════════════════════════════
      // CAS 1: KYC requis (compte existe mais KYC non complété)
      // ═══════════════════════════════════════════════════════════════════
      if (response.data.error === 'kyc_required') {
        showCustomMessage('error', response.data.message || 'Veuillez compléter la vérification d\'identité.');
        
        const userId = response.data.user_id;
        
        if (userId) {
          localStorage.setItem('temp_user_id', userId);
          setTimeout(() => {
            navigate('/kyc', { state: { userId: userId } });
          }, 1500);
        } else {
          setTimeout(() => navigate('/inscription'), 1500);
        }
        return;
      }
      
      // ═══════════════════════════════════════════════════════════════════
      // CAS 2: Connexion normale (KYC déjà fait)
      // ═══════════════════════════════════════════════════════════════════
      if (response.data.access && response.data.refresh) {
        localStorage.setItem('access_token', response.data.access);
        localStorage.setItem('refresh_token', response.data.refresh);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        // Nettoyer les données temporaires
        localStorage.removeItem('temp_user_id');
        localStorage.removeItem('temp_session_token');

        await connexion(form.email, form.password);
        showCustomMessage('success', 'Connexion réussie !');
        setTimeout(() => navigate('/dashboard'), 1500);
        return;
      }
      
    } catch (err) {
      const errorData = err.response?.data;
      console.error('[Connexion] Erreur:', errorData);
      
      // ✅ Gestion des différents cas d'erreur
      
      // Cas 1: KYC requis (erreur 403)
      if (err.response?.status === 403 && errorData?.error === 'kyc_required') {
        showCustomMessage('error', errorData.message || 'Veuillez compléter la vérification d\'identité.');
        
        const userId = errorData.user_id;
        
        if (userId) {
          localStorage.setItem('temp_user_id', userId);
          setTimeout(() => {
            navigate('/kyc', { state: { userId: userId } });
          }, 1500);
        } else {
          setTimeout(() => navigate('/inscription'), 1500);
        }
        return;
      }
      
      // Cas 2: Email non trouvé → Afficher sous le champ email
      if (errorData?.error === 'email_not_found' || 
          errorData?.message?.toLowerCase().includes('email') && 
          errorData?.message?.toLowerCase().includes('existe pas')) {
        setEmailError('Cette adresse email n\'existe pas. Veuillez vérifier votre saisie ou créer un compte.');
        setLoading(false);
        return;
      }
      
      // Cas 3: Mot de passe incorrect → Afficher sous le champ password
      if (errorData?.error === 'invalid_password' || 
          errorData?.message?.toLowerCase().includes('mot de passe') ||
          errorData?.detail?.toLowerCase().includes('mot de passe')) {
        setPasswordError('Le mot de passe est incorrect. Veuillez réessayer.');
        setLoading(false);
        return;
      }
      
      // Cas 4: Autres erreurs
      if (errorData) {
        const msgs = errorData.non_field_errors || errorData.detail || Object.values(errorData).flat();
        const msgArray = Array.isArray(msgs) ? msgs : [msgs];
        setGeneralError(msgArray[0] || 'Email ou mot de passe incorrect.');
      } else {
        setGeneralError('Email ou mot de passe incorrect.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Styles champs (fond blanc, texte sombre) ──────────────────────────────
  const inp = {
    width: '100%', padding: '13px 14px', borderRadius: 12,
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    color: '#1e293b', fontSize: 14, outline: 'none',
    boxSizing: 'border-box', fontFamily: "'Sora',sans-serif",
    transition: 'border-color 0.2s, box-shadow 0.2s',
  };

  const inpError = {
    ...inp,
    borderColor: '#ef4444',
    boxShadow: '0 0 0 3px rgba(239,68,68,0.12)',
  };

  const errorStyle = {
    margin: '6px 0 0',
    fontSize: 12,
    color: '#ef4444',
    display: 'flex',
    alignItems: 'flex-start',
    gap: 4,
    fontWeight: 500,
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0c2e7c, #1e4db7, #3b82f6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Sora', sans-serif",
      padding: '20px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap');
        .inp-cx:focus { border-color: #0c2e7c !important; box-shadow: 0 0 0 3px rgba(12,46,124,0.12) !important; }
        .inp-cx-error:focus { border-color: #ef4444 !important; box-shadow: 0 0 0 3px rgba(239,68,68,0.12) !important; }
        .btn-cx:hover:not(:disabled) { transform: translateY(-2px); background: #163e96 !important; box-shadow: 0 8px 28px rgba(12,46,124,0.5) !important; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
        .shake-animation {
          animation: shake 0.4s ease;
        }
      `}</style>

      {/* ── Message personnalisé (succès uniquement) ──────────────────────────── */}
      {showMessage && message.type === 'success' && (
        <div style={{
          position: 'fixed',
          top: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          padding: '16px 24px',
          borderRadius: 12,
          backgroundColor: '#d1fae5',
          color: '#065f46',
          border: '1px solid #a7f3d0',
          boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
          maxWidth: '90%',
          width: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          animation: 'slideDown 0.3s ease-out',
        }}>
          <span style={{ fontSize: 20 }}>✅</span>
          <span style={{ fontSize: 14, fontWeight: 500, fontFamily: "'Sora', sans-serif" }}>
            {message.text}
          </span>
          <button
            onClick={() => setShowMessage(false)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 18,
              color: '#065f46',
              opacity: 0.7,
              padding: '0 4px',
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Fond décoratif ──────────────────────────────────────────────── */}
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

      {/* ── Card BLANC ────────────────────────────────────────────────────── */}
      <div style={{
        width: '100%', maxWidth: 420, position: 'relative', zIndex: 1,
        background: 'rgba(255,255,255,0.98)',
        borderRadius: 24,
        padding: '40px 36px',
        boxShadow: '0 24px 80px rgba(0,0,0,0.25)',
      }}>

        {/* Retour */}
        <Link to="/" style={{
          display: 'flex', alignItems: 'center', gap: 6,
          color: '#64748b', textDecoration: 'none', fontSize: 12, marginBottom: 28,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Retour aux options
        </Link>

        {/* Logo - Moderne et fantastique (agrandi) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
          {/* Nouveau logo moderne avec effet de brillance - TAILLE AGRANDIE */}
          <div className="logo-icon" style={{ 
            width: 44, 
            height: 44, 
            borderRadius: 13, 
            background: 'linear-gradient(135deg, #0c2e7c, #1e4db7, #3b82f6)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            boxShadow: '0 6px 20px rgba(59,130,246,0.4)',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Effet de brillance */}
            <div style={{
              position: 'absolute',
              top: -15,
              left: -15,
              width: 30,
              height: 30,
              background: 'rgba(255,255,255,0.25)',
              borderRadius: '50%',
              transform: 'rotate(45deg)',
            }} />
            <div style={{
              position: 'absolute',
              bottom: -10,
              right: -10,
              width: 25,
              height: 25,
              background: 'rgba(255,255,255,0.15)',
              borderRadius: '50%',
            }} />
            
            {/* Logo SVG - Graphique financier moderne (agrandi) */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 13L8 8L13 13L21 5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M21 12V19H3V5H12" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="18" cy="8" r="2" stroke="#fff" strokeWidth="1.5"/>
              <path d="M8 11L8 16" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2"/>
            </svg>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
            <span style={{ fontWeight: 800, fontSize: 20, color: '#0c2e7c', letterSpacing: '-0.3px' }}>
              Finance<span style={{ color: '#3b82f6' }}>App</span>
            </span>
            <span style={{ fontSize: 9, color: '#94a3b8', letterSpacing: '0.4px', fontWeight: 500 }}>
              Smart Finance
            </span>
          </div>
        </div>

        <h2 style={{ margin: '0 0 6px', fontSize: 24, fontWeight: 700, color: '#0c2e7c' }}>
          Connexion
        </h2>
        <p style={{ margin: '0 0 28px', fontSize: 13, color: '#64748b' }}>
          Bienvenue ! Connectez-vous pour continuer.
        </p>

        {/* Message d'erreur général */}
        {generalError && (
          <div style={{
            background: '#fee2e2',
            border: '1px solid #fecaca',
            borderRadius: 10,
            padding: '12px 14px',
            marginBottom: 20,
            color: '#991b1b',
            fontSize: 13,
            fontWeight: 500,
          }}>
            {generalError}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Email */}
          <div>
            <label style={{
              display: 'block', fontSize: 11, color: '#475569',
              fontWeight: 600, marginBottom: 7,
              textTransform: 'uppercase', letterSpacing: '0.5px',
            }}>
              Adresse email
            </label>
            <input
              type="email"
              value={form.email}
              onChange={handleEmailChange}
              placeholder="vous@exemple.com"
              required
              className={`${emailError ? 'inp-cx-error shake-animation' : 'inp-cx'}`}
              style={emailError ? inpError : inp}
            />
            {emailError && (
              <div style={errorStyle}>
                <span>{emailError}</span>
              </div>
            )}
          </div>

          {/* Mot de passe */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
              <label style={{
                fontSize: 11, color: '#475569', fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.5px',
              }}>
                Mot de passe
              </label>
              <Link to="/mot-de-passe-oublie" style={{ fontSize: 12, color: '#1e4db7', textDecoration: 'none', fontWeight: 600 }}>
                Mot de passe oublié ?
              </Link>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type={showPwd ? 'text' : 'password'}
                value={form.password}
                onChange={handlePasswordChange}
                placeholder="••••••••"
                required
                className={`${passwordError ? 'inp-cx-error shake-animation' : 'inp-cx'}`}
                style={passwordError ? { ...inpError, paddingRight: 46 } : { ...inp, paddingRight: 46 }}
              />
              <button type="button" onClick={() => setShowPwd(v => !v)} style={{
                position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#94a3b8', fontSize: 16, lineHeight: 1,
              }}>
                {showPwd ? '👁️' : '🙈'}
              </button>
            </div>
            {passwordError && (
              <div style={errorStyle}>
                <span>{passwordError}</span>
              </div>
            )}
          </div>

          {/* Submit */}
          <button type="submit" disabled={loading} className="btn-cx" style={{
            marginTop: 6, width: '100%', padding: '14px',
            fontWeight: 600, fontSize: 15, fontFamily: "'Sora',sans-serif",
            background: '#0c2e7c',
            color: '#fff', border: 'none', borderRadius: 12,
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 16px rgba(12,46,124,0.3)',
            transition: 'transform 0.15s, box-shadow 0.15s, background 0.15s',
            opacity: loading ? 0.75 : 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            {loading ? (
              <>
                <span style={{
                  width: 16, height: 16,
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: '#fff', borderRadius: '50%',
                  display: 'inline-block', animation: 'spin 0.7s linear infinite',
                }} />
                Connexion...
              </>
            ) : 'Continuer →'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 22, fontSize: 13, color: '#64748b' }}>
          Pas encore de compte ?{' '}
          <Link to="/inscription" style={{ color: '#0c2e7c', fontWeight: 700, textDecoration: 'none' }}>
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  );
}