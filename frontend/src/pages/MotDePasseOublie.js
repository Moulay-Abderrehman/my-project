import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function MotDePasseOublie() {
  const navigate = useNavigate();
  const [etape, setEtape] = useState('email'); // 'email' | 'code'
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [nouveauPassword, setNouveauPassword] = useState('');
  const [confirmerPassword, setConfirmerPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleEnvoyerCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/comptes/mot-de-passe-oublie/', { email }, { headers: { Authorization: undefined } });
      toast.success('Code envoyé à votre email !');
      setEtape('code');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  const handleReinitialiser = async (e) => {
    e.preventDefault();
    if (nouveauPassword !== confirmerPassword) {
      return toast.error('Les mots de passe ne correspondent pas.');
    }
    if (nouveauPassword.length < 6) {
      return toast.error('Le mot de passe doit contenir au moins 6 caractères.');
    }
    setLoading(true);
    try {
      await api.post('/comptes/reinitialiser-mot-de-passe/', {
        email,
        code,
        nouveau_password: nouveauPassword,
        confirmer_password: confirmerPassword,
      }, { headers: { Authorization: undefined } });
      toast.success('Mot de passe réinitialisé !');
      navigate('/connexion');
    } catch (err) {
      toast.error(err.response?.data?.detail || err.response?.data?.error || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg,#667eea,#764ba2)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20, fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Boxicons + Google Fonts */}
      <link rel="stylesheet" href="https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css" />
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Outfit:wght@600;700;800&display=swap" rel="stylesheet" />

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse-ring {
          0%   { box-shadow: 0 0 0 0 rgba(102,126,234,0.35); }
          70%  { box-shadow: 0 0 0 14px rgba(102,126,234,0); }
          100% { box-shadow: 0 0 0 0 rgba(102,126,234,0); }
        }
        .mdp-card { animation: fadeUp 0.45s cubic-bezier(.16,1,.3,1) both; }

        .mdp-input {
          width: 100%; box-sizing: border-box;
          padding: 12px 14px 12px 40px;
          border-radius: 11px;
          border: 1.5px solid #e2e8f0;
          background: #f8fafc;
          color: #0f172a; font-size: 13.5px;
          font-family: 'DM Sans', sans-serif;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
          outline: none;
        }
        .mdp-input:focus {
          border-color: #667eea !important;
          background: #fff !important;
          box-shadow: 0 0 0 4px rgba(102,126,234,0.12) !important;
        }
        .mdp-input::placeholder { color: #cbd5e1; }

        .mdp-input-pwd {
          width: 100%; box-sizing: border-box;
          padding: 12px 44px 12px 40px;
          border-radius: 11px;
          border: 1.5px solid #e2e8f0;
          background: #f8fafc;
          color: #0f172a; font-size: 13.5px;
          font-family: 'DM Sans', sans-serif;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
          outline: none;
        }
        .mdp-input-pwd:focus {
          border-color: #667eea !important;
          background: #fff !important;
          box-shadow: 0 0 0 4px rgba(102,126,234,0.12) !important;
        }
        .mdp-input-pwd::placeholder { color: #cbd5e1; }

        .mdp-input-code {
          width: 100%; box-sizing: border-box;
          padding: 15px 14px;
          border-radius: 12px;
          border: 1.5px solid #e2e8f0;
          background: #f8fafc;
          color: #0f172a;
          font-size: 28px; font-weight: 800;
          font-family: 'Outfit', monospace;
          text-align: center; letter-spacing: 10px;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
          outline: none;
        }
        .mdp-input-code:focus {
          border-color: #667eea !important;
          background: #fff !important;
          box-shadow: 0 0 0 4px rgba(102,126,234,0.12) !important;
        }
        .mdp-input-code::placeholder { color: #cbd5e1; letter-spacing: 6px; }

        .btn-primary-mdp {
          transition: all 0.22s cubic-bezier(.16,1,.3,1);
        }
        .btn-primary-mdp:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 32px rgba(102,126,234,0.45) !important;
          filter: brightness(1.08);
        }
        .btn-success-mdp {
          transition: all 0.22s cubic-bezier(.16,1,.3,1);
        }
        .btn-success-mdp:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 28px rgba(16,185,129,0.4) !important;
          filter: brightness(1.08);
        }
        .btn-ghost-mdp {
          transition: color 0.18s;
        }
        .btn-ghost-mdp:hover { color: #764ba2 !important; text-decoration: underline; }
        .back-link-mdp { transition: color 0.2s; }
        .back-link-mdp:hover { color: #764ba2 !important; }
        .icon-ring-mdp { animation: pulse-ring 2.6s ease infinite; }
        .toggle-eye-mdp { transition: color 0.15s; }
        .toggle-eye-mdp:hover { color: #667eea !important; }

        @media (max-width: 480px) {
          .mdp-card { padding: 28px 18px !important; border-radius: 16px !important; }
        }
      `}</style>

      {/* Déco fond */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', width: 560, height: 560,
          borderRadius: '50%', top: -180, left: '50%', transform: 'translateX(-50%)',
          background: 'radial-gradient(circle, rgba(255,255,255,0.09) 0%, transparent 70%)',
          filter: 'blur(44px)',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }} />
      </div>

      <div className="mdp-card" style={{
        background: '#fff',
        borderRadius: 20,
        padding: '40px 36px',
        maxWidth: 460, width: '100%',
        boxShadow: '0 32px 80px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.07)',
        position: 'relative', zIndex: 1,
      }}>

        {/* Back link */}
        <Link to="/connexion" className="back-link-mdp" style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          color: '#94a3b8', textDecoration: 'none', fontSize: 12.5,
          fontWeight: 500, marginBottom: 28,
        }}>
          <i className='bx bx-arrow-back' style={{ fontSize: 15 }} />
          Retour à la connexion
        </Link>

        {/* Icône + Titre */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div className="icon-ring-mdp" style={{
            width: 68, height: 68, borderRadius: '50%',
            background: etape === 'email'
              ? 'linear-gradient(135deg, #ede9fe, #ddd6fe)'
              : 'linear-gradient(135deg, #d1fae5, #a7f3d0)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 18px',
          }}>
            <i
              className={etape === 'email' ? 'bx bx-lock-open-alt' : 'bx bx-shield-quarter'}
              style={{
                fontSize: 30,
                color: etape === 'email' ? '#7c3aed' : '#059669',
              }}
            />
          </div>

          <h2 style={{
            margin: 0, fontSize: 22, fontWeight: 800, color: '#0f172a',
            fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.4px',
          }}>
            {etape === 'email' ? 'Mot de passe oublié' : 'Réinitialisation'}
          </h2>
          <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: 13, lineHeight: 1.6 }}>
            {etape === 'email'
              ? 'Entrez votre email pour recevoir un code de réinitialisation'
              : <>Un code à 6 chiffres a été envoyé à<br /><strong style={{ color: '#7c3aed' }}>{email}</strong></>
            }
          </p>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: '#f1f5f9', marginBottom: 24 }} />

        {/* ── ÉTAPE EMAIL ── */}
        {etape === 'email' ? (
          <form onSubmit={handleEnvoyerCode} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={lblStyle}>
                <i className='bx bx-envelope' style={{ fontSize: 12 }} />
                Adresse Email *
              </label>
              <div style={{ position: 'relative' }}>
                <i className='bx bx-envelope' style={iconLeft} />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="nom@domaine.com"
                  className="mdp-input"
                  required
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary-mdp" style={{
              width: '100%',
              background: 'linear-gradient(135deg,#667eea,#764ba2)',
              color: '#fff', border: 'none', borderRadius: 12, padding: '14px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 700, fontSize: 14.5,
              opacity: loading ? 0.8 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: '0 4px 18px rgba(102,126,234,0.28)',
              fontFamily: "'DM Sans', sans-serif",
            }}>
              {loading ? (
                <>
                  <span style={spinnerStyle} />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <i className='bx bx-send' style={{ fontSize: 17 }} />
                  Envoyer le code
                </>
              )}
            </button>
          </form>

        ) : (
          /* ── ÉTAPE CODE + NOUVEAU MDP ── */
          <form onSubmit={handleReinitialiser} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Code */}
            <div>
              <label style={lblStyle}>
                <i className='bx bx-key' style={{ fontSize: 12 }} />
                Code de vérification (6 chiffres) *
              </label>
              <input
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="• • • • • •"
                className="mdp-input-code"
                maxLength={6}
                required
              />
            </div>

            {/* Nouveau mot de passe */}
            <div>
              <label style={lblStyle}>
                <i className='bx bx-lock-alt' style={{ fontSize: 12 }} />
                Nouveau mot de passe *
              </label>
              <div style={{ position: 'relative' }}>
                <i className='bx bx-lock-alt' style={iconLeft} />
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={nouveauPassword}
                  onChange={e => setNouveauPassword(e.target.value)}
                  placeholder="••••••••"
                  className="mdp-input-pwd"
                  required
                  minLength={6}
                />
                <button type="button" onClick={() => setShowPwd(v => !v)}
                  className="toggle-eye-mdp" style={eyeBtn}>
                  <i className={showPwd ? 'bx bx-hide' : 'bx bx-show'} style={{ fontSize: 18 }} />
                </button>
              </div>
            </div>

            {/* Confirmer mot de passe */}
            <div>
              <label style={lblStyle}>
                <i className='bx bx-lock' style={{ fontSize: 12 }} />
                Confirmer le mot de passe *
              </label>
              <div style={{ position: 'relative' }}>
                <i className='bx bx-lock' style={iconLeft} />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmerPassword}
                  onChange={e => setConfirmerPassword(e.target.value)}
                  placeholder="••••••••"
                  className="mdp-input-pwd"
                  required
                />
                <button type="button" onClick={() => setShowConfirm(v => !v)}
                  className="toggle-eye-mdp" style={eyeBtn}>
                  <i className={showConfirm ? 'bx bx-hide' : 'bx bx-show'} style={{ fontSize: 18 }} />
                </button>
              </div>
              {confirmerPassword && nouveauPassword !== confirmerPassword && (
                <p style={errStyle}>
                  <i className='bx bx-error-circle' style={{ fontSize: 12 }} />
                  Les mots de passe ne correspondent pas
                </p>
              )}
            </div>

            {/* Bouton réinitialiser */}
            <button type="submit" disabled={loading} className="btn-success-mdp" style={{
              marginTop: 4,
              width: '100%',
              background: 'linear-gradient(135deg,#10b981,#059669)',
              color: '#fff', border: 'none', borderRadius: 12, padding: '14px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 700, fontSize: 14.5,
              opacity: loading ? 0.8 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: '0 4px 18px rgba(16,185,129,0.28)',
              fontFamily: "'DM Sans', sans-serif",
            }}>
              {loading ? (
                <>
                  <span style={spinnerStyle} />
                  En cours...
                </>
              ) : (
                <>
                  <i className='bx bx-check-shield' style={{ fontSize: 17 }} />
                  Réinitialiser le mot de passe
                </>
              )}
            </button>

            {/* Renvoyer code */}
            <div style={{ textAlign: 'center' }}>
              <button type="button" onClick={() => setEtape('email')}
                className="btn-ghost-mdp" style={{
                  background: 'none', border: 'none', color: '#667eea',
                  cursor: 'pointer', fontSize: 13, fontWeight: 600,
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                }}>
                <i className='bx bx-refresh' style={{ fontSize: 15 }} />
                Renvoyer un nouveau code
              </button>
            </div>
          </form>
        )}

        {/* Footer */}
        <div style={{
          textAlign: 'center', marginTop: 22,
          paddingTop: 16, borderTop: '1px solid #f1f5f9',
        }}>
          <Link to="/connexion" className="back-link-mdp" style={{
            color: '#667eea', fontWeight: 700, textDecoration: 'none',
            fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 5,
          }}>
            <i className='bx bx-log-in' style={{ fontSize: 15 }} />
            Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── MINI STYLES CONSTANTS ───────────────────────────────────────────────────

const lblStyle = {
  display: 'flex', alignItems: 'center', gap: 4,
  fontSize: 10.5, color: '#475569', fontWeight: 600,
  textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6,
};

const iconLeft = {
  position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)',
  fontSize: 16, color: '#94a3b8', pointerEvents: 'none',
};

const eyeBtn = {
  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
  background: 'none', border: 'none', cursor: 'pointer',
  color: '#94a3b8', display: 'flex', alignItems: 'center',
};

const errStyle = {
  margin: '4px 0 0', fontSize: 11, color: '#ef4444',
  display: 'flex', alignItems: 'center', gap: 4,
};

const spinnerStyle = {
  width: 16, height: 16,
  border: '2px solid rgba(255,255,255,0.3)',
  borderTopColor: '#fff', borderRadius: '50%',
  display: 'inline-block', animation: 'spin 0.7s linear infinite',
};