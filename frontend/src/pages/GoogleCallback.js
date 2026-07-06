// frontend/src/pages/GoogleCallback.js
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

// ─── Carrés décoratifs (mêmes tons/valeurs que Connexion.js) ──────────────
const CARRES_FOND = [
  { top: '6%', left: '8%', size: 70, color: 'var(--mint)', rotate: 12 },
  { top: '14%', left: '82%', size: 46, color: 'var(--mint)', rotate: -8 },
  { top: '28%', left: '22%', size: 34, color: 'var(--mint)', rotate: 20 },
  { top: '38%', left: '68%', size: 90, color: 'var(--mint)', rotate: -14 },
  { top: '52%', left: '4%', size: 52, color: 'var(--mint)', rotate: 6 },
  { top: '62%', left: '90%', size: 40, color: 'var(--mint)', rotate: -20 },
  { top: '74%', left: '35%', size: 64, color: 'var(--mint)', rotate: 10 },
  { top: '86%', left: '60%', size: 48, color: 'var(--mint)', rotate: -6 },
  { top: '92%', left: '15%', size: 36, color: 'var(--mint)', rotate: 18 },
  { top: '18%', left: '48%', size: 30, color: 'var(--mint)', rotate: -10 },
  { top: '10%', left: '32%', size: 42, color: 'var(--mint)', rotate: 22 },
  { top: '24%', left: '92%', size: 34, color: 'var(--mint)', rotate: -16 },
  { top: '34%', left: '12%', size: 56, color: 'var(--mint)', rotate: 8 },
  { top: '46%', left: '58%', size: 38, color: 'var(--mint)', rotate: -12 },
  { top: '58%', left: '24%', size: 46, color: 'var(--mint)', rotate: 15 },
  { top: '68%', left: '76%', size: 60, color: 'var(--mint)', rotate: -18 },
  { top: '80%', left: '42%', size: 32, color: 'var(--mint)', rotate: 24 },
  { top: '96%', left: '78%', size: 44, color: 'var(--mint)', rotate: -9 },
  { top: '4%', left: '58%', size: 28, color: 'var(--mint)', rotate: 14 },
  { top: '44%', left: '2%', size: 36, color: 'var(--mint)', rotate: -22 },
];

// ─── Styles partagés (mêmes règles, design uniquement) ─────────────────────
const PageBg = ({ children }) => (
  <div style={{
    minHeight: '100vh',
    background: '#ffffff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '20px',
    position: 'relative',
    fontFamily: "'Sora', sans-serif",
    overflow: 'hidden',
  }}>
    {/* Boxicons + Police */}
    <link rel="stylesheet" href="https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css" />
    <link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

    {/* Fond décoratif : cercles + carrés verts, identique à Connexion.js */}
    <div className="pointer-events-none" style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 0 }}>
      <div style={{
        position: 'absolute', top: '-10rem', left: '-8rem', width: 560, height: 560,
        borderRadius: '50%', background: 'var(--navy)', opacity: 0.08, filter: 'blur(90px)',
      }} />
      <div style={{
        position: 'absolute', top: '33%', right: '-10rem', width: 620, height: 620,
        borderRadius: '50%', background: 'var(--gold)', opacity: 0.07, filter: 'blur(90px)',
      }} />
      <div style={{
        position: 'absolute', bottom: 0, left: '25%', width: 480, height: 480,
        borderRadius: '50%', background: 'var(--primary)', opacity: 0.06, filter: 'blur(90px)',
      }} />

      {CARRES_FOND.map((c, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: c.top,
            left: c.left,
            width: c.size,
            height: c.size,
            background: c.color,
            opacity: 0.09,
            borderRadius: 10,
            transform: `rotate(${c.rotate}deg)`,
          }}
        />
      ))}
    </div>

    <style>{`
      :root {
        --navy: #003152;
        --teal: #003333;
        --mint: #02F5A1;
        --black: #07191E;
        --gold: #FDBF20;
        --primary: #356267;
        --border: #E4E9EC;
      }
      @keyframes spin { to { transform: rotate(360deg); } }
      @keyframes slideDown {
        from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
        to   { opacity: 1; transform: translateX(-50%) translateY(0); }
      }
      @keyframes fadeUp {
        from { opacity: 0; transform: translateY(24px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes pulse-ring {
        0%   { box-shadow: 0 0 0 0 rgba(255,255,255,0.25); }
        70%  { box-shadow: 0 0 0 14px rgba(255,255,255,0); }
        100% { box-shadow: 0 0 0 0 rgba(255,255,255,0); }
      }
      .gc-card { animation: fadeUp 0.45s cubic-bezier(.16,1,.3,1) both; position: relative; z-index: 1; }
      .gc-icon-ring { animation: pulse-ring 2.6s ease infinite; }

      .gc-input {
        width: 100%; box-sizing: border-box;
        padding: 14px 44px 14px 42px;
        border-radius: 12px;
        border: 1px solid #e2e8f0;
        background: #f8fafc;
        color: #0f172a; font-size: 14px;
        font-family: 'Sora', sans-serif;
        transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
        outline: none;
      }
      .gc-input:focus {
        border-color: #0c2e7c !important;
        background: #fff !important;
        box-shadow: 0 0 0 4px rgba(12,46,124,0.10) !important;
      }
      .gc-input::placeholder { color: #cbd5e1; }

      .gc-toggle-eye { transition: color 0.15s; }
      .gc-toggle-eye:hover { color: #0c2e7c !important; }

      .gc-btn-primary { transition: all 0.2s; }
      .gc-btn-primary:hover:not(:disabled) {
        transform: translateY(-2px);
        background: #163e96 !important;
      }

      @media (max-width: 480px) {
        .gc-card { padding: 32px 22px !important; border-radius: 20px !important; }
      }
    `}</style>

    {children}
  </div>
);

const Toast = ({ show, message, onClose }) => {
  if (!show) return null;
  const colors = {
    error:   { bg: '#fee2e2', fg: '#991b1b', border: '#fecaca', icon: 'bx-error-circle' },
    success: { bg: '#d1fae5', fg: '#065f46', border: '#a7f3d0', icon: 'bx-check-circle' },
    info:    { bg: '#dbeafe', fg: '#1e3a8a', border: '#bfdbfe', icon: 'bx-info-circle' },
  };
  const c = colors[message.type] || colors.info;
  return (
    <div style={{
      position: 'fixed',
      top: 20,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 9999,
      padding: '16px 24px',
      borderRadius: 12,
      backgroundColor: c.bg,
      color: c.fg,
      border: `1px solid ${c.border}`,
      boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
      maxWidth: '90%',
      width: 'auto',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      animation: 'slideDown 0.3s ease-out',
    }}>
      <i className={`bx ${c.icon}`} style={{ fontSize: 20 }} />
      <span style={{ fontSize: 14, fontWeight: 500, fontFamily: "'Sora', sans-serif" }}>
        {message.text}
      </span>
      <button
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: 18,
          color: c.fg,
          opacity: 0.7,
          padding: '0 4px',
          display: 'flex', alignItems: 'center',
        }}
      >
        <i className='bx bx-x' />
      </button>
    </div>
  );
};

// ─── Composant pour créer le mot de passe après connexion Google ──────────
function GoogleSetPassword({ userId, email, onComplete, onError }) {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showMessage, setShowMessage] = useState(false);

  const showCustomMessage = (type, text) => {
    setMessage({ type, text });
    setShowMessage(true);
    setTimeout(() => setShowMessage(false), 5000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password.length < 6) {
      showCustomMessage('error', 'Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    
    if (password !== confirmPassword) {
      showCustomMessage('error', 'Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/comptes/google-set-password/', {
        user_id: userId,
        password: password,
        confirm_password: confirmPassword,
      });

      console.log('[GoogleSetPassword] Réponse:', res.data);

      if (res.data.kyc_required) {
        showCustomMessage('success', 'Mot de passe créé ! Maintenant, vérifiez votre identité.');
        setTimeout(() => {
          navigate('/kyc-verification');
        }, 1500);
      } else if (res.data.access) {
        localStorage.setItem('access_token', res.data.access);
        localStorage.setItem('refresh_token', res.data.refresh);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        showCustomMessage('success', '✅ Mot de passe créé avec succès !');
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      } else {
        showCustomMessage('success', 'Mot de passe créé ! Vous pouvez maintenant vous connecter.');
        setTimeout(() => {
          navigate('/connexion');
        }, 1500);
      }
      
      if (onComplete) onComplete();
    } catch (err) {
      console.error('[GoogleSetPassword] Erreur:', err);
      const msg = err.response?.data?.error || 'Erreur lors de la création du mot de passe.';
      showCustomMessage('error', msg);
      if (onError) onError();
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageBg>
      <Toast show={showMessage} message={message} onClose={() => setShowMessage(false)} />

      <div className="gc-card" style={{
        width: '100%', maxWidth: 420,
        background: 'rgba(255,255,255,0.98)',
        borderRadius: 24, padding: '40px 36px',
        boxShadow: '0 24px 80px rgba(0,49,82,0.14)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div className="gc-icon-ring" style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'linear-gradient(135deg, #0c2e7c, #1e4db7)',
            margin: '0 auto 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 22px rgba(12,46,124,0.3)',
          }}>
            <i className='bx bx-lock-alt' style={{ fontSize: 30, color: '#fff' }} />
          </div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#0c2e7c', fontFamily: "'Sora', sans-serif" }}>
            Créez votre mot de passe
          </h2>
          <p style={{ margin: '8px 0 0', fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>
            Connecté avec <strong style={{ color: '#0c2e7c' }}>{email}</strong><br />
            Définissez un mot de passe pour vous connecter ultérieurement.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={lblStyle}>
              <i className='bx bx-lock-alt' style={{ fontSize: 12 }} />
              Mot de passe  (min. 6 caractères)
            </label>
            <div style={{ position: 'relative' }}>
              <i className='bx bx-lock-alt' style={iconLeft} />
              <input
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="gc-input"
              />
              <button type="button" onClick={() => setShowPwd(v => !v)} className="gc-toggle-eye" style={eyeBtn}>
                <i className={showPwd ? 'bx bx-hide' : 'bx bx-show'} style={{ fontSize: 18 }} />
              </button>
            </div>
          </div>

          <div>
            <label style={lblStyle}>
              <i className='bx bx-lock' style={{ fontSize: 12 }} />
              Confirmer le mot de passe 
            </label>
            <div style={{ position: 'relative' }}>
              <i className='bx bx-lock' style={iconLeft} />
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="gc-input"
              />
              <button type="button" onClick={() => setShowConfirm(v => !v)} className="gc-toggle-eye" style={eyeBtn}>
                <i className={showConfirm ? 'bx bx-hide' : 'bx bx-show'} style={{ fontSize: 18 }} />
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="gc-btn-primary" style={{
            marginTop: 6, width: '100%', padding: '15px',
            fontWeight: 700, fontSize: 15,
            background: loading ? '#94a3b8' : '#0c2e7c',
            color: '#fff', border: 'none', borderRadius: 14,
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: '0 4px 15px rgba(12,46,124,0.3)',
            fontFamily: "'Sora', sans-serif",
          }}>
            {loading ? (
              <>
                <span style={spinnerStyle} />
                Création en cours...
              </>
            ) : (
              <>
                <i className='bx bx-check-shield' style={{ fontSize: 17 }} />
                Créer mon mot de passe
              </>
            )}
          </button>
        </form>
      </div>
    </PageBg>
  );
}

// ─── Composant principal GoogleCallback ──────────────────────────────────
export default function GoogleCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { chargerAbonnement, chargerNotifs } = useAuth();
  const [statut, setStatut] = useState('Connexion avec Google...');
  const [needPassword, setNeedPassword] = useState(false);
  const [tempUserId, setTempUserId] = useState(null);
  const [tempEmail, setTempEmail] = useState('');
  
  // ── États pour les messages personnalisés ──────────────────────────────────
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showMessage, setShowMessage] = useState(false);
  const [showEmailExistsModal, setShowEmailExistsModal] = useState(false);
  const [showKycRequiredModal, setShowKycRequiredModal] = useState(false);

  const showCustomMessage = (type, text) => {
    setMessage({ type, text });
    setShowMessage(true);
    setTimeout(() => setShowMessage(false), 5000);
  };

  // ✅ Ref pour empêcher les appels multiples du useEffect
  const hasProcessed = useRef(false);

  useEffect(() => {
    // ✅ Si déjà traité, ne rien faire
    if (hasProcessed.current) {
      console.log('[GoogleCallback] Déjà traité, ignoré');
      return;
    }

    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      showCustomMessage('error', 'Connexion Google annulée.');
      setTimeout(() => navigate('/'), 1500);
      return;
    }

    if (!code) {
      showCustomMessage('error', 'Code Google manquant.');
      setTimeout(() => navigate('/'), 1500);
      return;
    }

    // ✅ Marquer comme traité immédiatement
    hasProcessed.current = true;

    const handleGoogleAuth = async () => {
      try {
        setStatut('Vérification de votre compte Google...');

        const res = await api.post('/comptes/auth/google/', {
          code,
          redirect_uri: `${window.location.origin}/auth/google/callback`,
        });

        console.log('[GoogleCallback] Réponse complète:', res);
        console.log('[GoogleCallback] Données:', res.data);

        // ═══════════════════════════════════════════════════════════════════
        // CAS 1: Email déjà existant
        // ═══════════════════════════════════════════════════════════════════
        if (res.data.email_exists === true || 
            res.data.error === 'email_exists' || 
            res.data.message === 'Email already exists' ||
            res.data.status === 'email_exists') {
          console.log('📧 Email déjà existant - Affichage modal');
          setShowEmailExistsModal(true);
          return;
        }

        // ═══════════════════════════════════════════════════════════════════
        // CAS 2: Nouvel utilisateur Google → besoin de créer un mot de passe
        // ═══════════════════════════════════════════════════════════════════
        if (res.data.need_password_setup === true) {
          console.log('✅ Affichage formulaire mot de passe');
          setTempUserId(res.data.user.id);
          setTempEmail(res.data.user.email);
          setNeedPassword(true);
          return;
        }
        
        // ═══════════════════════════════════════════════════════════════════
        // CAS 3: Utilisateur existant mais KYC non complété
        // ═══════════════════════════════════════════════════════════════════
        if (res.data.kyc_required === true) {
          console.log('🪪 KYC requis - Affichage modal personnalisé');
          setShowKycRequiredModal(true);
          return;
        }
        
        // ═══════════════════════════════════════════════════════════════════
        // CAS 4: Utilisateur complet → connexion normale
        // ═══════════════════════════════════════════════════════════════════
        if (res.data.access && res.data.refresh) {
          console.log('✅ Connexion normale');
          localStorage.setItem('access_token', res.data.access);
          localStorage.setItem('refresh_token', res.data.refresh);
          localStorage.setItem('user', JSON.stringify(res.data.user));

          await chargerAbonnement();
          await chargerNotifs();

          showCustomMessage('success', '✅ Connecté avec succès !');
          setTimeout(() => navigate('/dashboard'), 1500);
          return;
        }
        
        // ═══════════════════════════════════════════════════════════════════
        // CAS 5: Vérifier si c'est une erreur "email exists" dans l'erreur
        // ═══════════════════════════════════════════════════════════════════
        if (res.data.error && res.data.error.includes('existe')) {
          console.log('📧 Email déjà existant (détecté dans error)');
          setShowEmailExistsModal(true);
          return;
        }
        
        console.warn('⚠️ Réponse inattendue:', res.data);
        showCustomMessage('error', 'Réponse inattendue du serveur.');
        setTimeout(() => navigate('/'), 3000);
        
      } catch (err) {
        console.error('[GoogleCallback] Erreur complète:', err);
        console.error('[GoogleCallback] Response:', err.response);
        console.error('[GoogleCallback] Data:', err.response?.data);
        
        // Vérifier si l'erreur contient "email exists"
        const errorMsg = err.response?.data?.error || err.response?.data?.message || '';
        if (errorMsg.toLowerCase().includes('email') && 
            (errorMsg.toLowerCase().includes('existe') || errorMsg.toLowerCase().includes('exists'))) {
          console.log('📧 Email déjà existant (détecté dans l\'erreur)');
          setShowEmailExistsModal(true);
          return;
        }
        
        const msg = errorMsg || 'Erreur de connexion Google.';
        showCustomMessage('error', msg);
        setTimeout(() => navigate('/'), 3000);
      }
    };

    handleGoogleAuth();
  }, [chargerAbonnement, chargerNotifs, navigate, searchParams]);

  // ─── Modal KYC Requis ────────────────────────────────────────────────────
  if (showKycRequiredModal) {
    return (
      <PageBg>
        <div className="gc-card" style={{
          width: '100%', maxWidth: 420,
          background: 'rgba(255,255,255,0.98)',
          borderRadius: 24, padding: '40px 36px',
          boxShadow: '0 24px 80px rgba(0,49,82,0.14)',
          textAlign: 'center',
        }}>
          <div className="gc-icon-ring" style={{
            width: 68, height: 68, borderRadius: '50%',
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
            boxShadow: '0 8px 22px rgba(217,119,6,0.3)',
          }}>
            <i className='bx bxs-shield-alt-2' style={{ fontSize: 30, color: '#fff' }} />
          </div>
          <h2 style={{ margin: '0 0 10px', fontSize: 22, fontWeight: 700, color: '#0c2e7c', fontFamily: "'Sora', sans-serif" }}>
            Vérification d'identité requise
          </h2>
          <p style={{ margin: '0 0 24px', fontSize: 14, color: '#64748b', lineHeight: 1.6 }}>
            Cette adresse email est déjà associée à un compte existant mais ce compte 
            n'est pas encore validé. Veuillez vous connecter avec vos identifiants 
            habituels et compléter la vérification d'identité (KYC).
          </p>
          <button
            onClick={() => {
              setShowKycRequiredModal(false);
              navigate('/');
            }}
            className="gc-btn-primary"
            style={{
              width: '100%', padding: '15px',
              background: '#0c2e7c',
              color: '#fff',
              border: 'none', borderRadius: 14,
              fontWeight: 700, fontSize: 15,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: '0 4px 15px rgba(12,46,124,0.3)',
              fontFamily: "'Sora', sans-serif",
            }}
          >
            <i className='bx bx-check' style={{ fontSize: 18 }} />
            OK
          </button>
        </div>
      </PageBg>
    );
  }

  // ─── Modal Email Existe Déjà ────────────────────────────────────────────
  if (showEmailExistsModal) {
    return (
      <PageBg>
        <div className="gc-card" style={{
          width: '100%', maxWidth: 420,
          background: 'rgba(255,255,255,0.98)',
          borderRadius: 24, padding: '40px 36px',
          boxShadow: '0 24px 80px rgba(0,49,82,0.14)',
          textAlign: 'center',
        }}>
          <div className="gc-icon-ring" style={{
            width: 68, height: 68, borderRadius: '50%',
            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
            boxShadow: '0 8px 22px rgba(220,38,38,0.3)',
          }}>
            <i className='bx bx-error-circle' style={{ fontSize: 30, color: '#fff' }} />
          </div>
          <h2 style={{ margin: '0 0 10px', fontSize: 22, fontWeight: 700, color: '#0c2e7c', fontFamily: "'Sora', sans-serif" }}>
            Email déjà existant
          </h2>
          <p style={{ margin: '0 0 24px', fontSize: 14, color: '#64748b', lineHeight: 1.6 }}>
            Cette adresse email est déjà associée à un compte existant.<br />
            Veuillez vous connecter avec votre email et votre mot de passe.
          </p>
          <button
            onClick={() => {
              setShowEmailExistsModal(false);
              navigate('/');
            }}
            className="gc-btn-primary"
            style={{
              width: '100%', padding: '15px',
              background: '#0c2e7c',
              color: '#fff',
              border: 'none', borderRadius: 14,
              fontWeight: 700, fontSize: 15,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: '0 4px 15px rgba(12,46,124,0.3)',
              fontFamily: "'Sora', sans-serif",
            }}
          >
            <i className='bx bx-check' style={{ fontSize: 18 }} />
            OK
          </button>
        </div>
      </PageBg>
    );
  }

  // ✅ Afficher le formulaire de mot de passe si nécessaire
  if (needPassword) {
    return <GoogleSetPassword 
      userId={tempUserId} 
      email={tempEmail} 
      onComplete={() => {
        setNeedPassword(false);
      }}
      onError={() => {
        setNeedPassword(false);
        navigate('/');
      }}
    />;
  }

  // ─── Écran de chargement ────────────────────────────────────────────────
  return (
    <PageBg>
      <Toast show={showMessage} message={message} onClose={() => setShowMessage(false)} />

      <div className="gc-card" style={{
        background: 'rgba(255,255,255,0.98)', borderRadius: 24,
        padding: '44px 48px', textAlign: 'center',
        boxShadow: '0 24px 80px rgba(0,49,82,0.14)',
        maxWidth: 380, width: '100%',
      }}>
        <div className="gc-icon-ring" style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'linear-gradient(135deg, #0c2e7c, #1e4db7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 22px',
          boxShadow: '0 8px 22px rgba(12,46,124,0.3)',
        }}>
          <i className='bx bxl-google' style={{ fontSize: 28, color: '#fff' }} />
        </div>
        <div style={{
          width: 38, height: 38,
          border: '3px solid #e2e8f0',
          borderTopColor: '#0c2e7c',
          borderRadius: '50%',
          margin: '0 auto 18px',
          animation: 'spin 0.8s linear infinite'
        }} />
        <h3 style={{ margin: 0, color: '#0c2e7c', fontSize: 16, fontWeight: 700, fontFamily: "'Sora', sans-serif" }}>
          {statut}
        </h3>
      </div>
    </PageBg>
  );
}

// ─── MINI STYLES CONSTANTS ───────────────────────────────────────────────────

const lblStyle = {
  display: 'flex', alignItems: 'center', gap: 4,
  fontSize: 10.5, color: '#475569', fontWeight: 600,
  textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6,
};

const iconLeft = {
  position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
  fontSize: 16, color: '#94a3b8', pointerEvents: 'none',
};

const eyeBtn = {
  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
  background: 'none', border: 'none', cursor: 'pointer',
  color: '#94a3b8', display: 'flex', alignItems: 'center',
};

const spinnerStyle = {
  width: 16, height: 16,
  border: '2px solid rgba(255,255,255,0.3)',
  borderTopColor: '#fff', borderRadius: '50%',
  display: 'inline-block', animation: 'spin 0.7s linear infinite',
};