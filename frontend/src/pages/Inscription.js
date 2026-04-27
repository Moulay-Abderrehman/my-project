// frontend/src/pages/Inscription.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function Inscription() {
  const navigate = useNavigate();
  const [etape, setEtape] = useState(1); // 1: formulaire, 2: vérification email, 3: bienvenue
  const [userId, setUserId] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const [userData, setUserData] = useState(null);
  
  const [form, setForm] = useState({
    nom: '', prenom: '', telephone: '+222', email: '',
    password: '', password_confirm: '',
  });
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showCode, setShowCode] = useState(false);

  const initiales = `${(form.prenom[0]||'').toUpperCase()}${(form.nom[0]||'').toUpperCase()}` || '?';
  const bgColors = ['#0c2e7c','#1e4db7','#3b82f6','#1d4ed8','#2563eb','#1e40af'];
  const avatarBg = bgColors[(form.prenom.charCodeAt(0)||0) % bgColors.length];
  const emailOk = !form.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);

  // Étape 1: Envoi du formulaire d'inscription
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.password_confirm) {
      toast.error('Les mots de passe ne correspondent pas.');
      return;
    }
    if (form.email && !emailOk) {
      toast.error("Format d'email invalide.");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/comptes/inscription/', {
        nom: form.nom, prenom: form.prenom, telephone: form.telephone,
        email: form.email,
        password: form.password, password_confirm: form.password_confirm,
      });
      
      setUserId(res.data.user_id);
      setUserEmail(form.email);
      setUserData(res.data.user);
      setEtape(2);
      toast.success('Code de confirmation envoyé à votre email !');
    } catch (err) {
      const errors = err.response?.data;
      if (errors && typeof errors === 'object') {
        Object.entries(errors).forEach(([k, v]) => {
          (Array.isArray(v) ? v : [v]).forEach(m => toast.error(`${k !== 'non_field_errors' ? k + ' : ' : ''}${m}`));
        });
      } else {
        toast.error('Erreur lors de l\'inscription.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Étape 2: Vérification du code email
  const handleVerifierCode = async (e) => {
    e.preventDefault();
    if (!code || code.length !== 6) {
      toast.error('Veuillez entrer le code à 6 chiffres.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/comptes/verifier-email/', { code, user_id: userId });
      setEtape(3);
    } catch (err) {
      const msg = err.response?.data?.error || 'Code invalide ou expiré.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Renvoyer le code
  const handleRenvoyerCode = async () => {
    setLoading(true);
    try {
      await api.post('/comptes/renvoyer-code/', { email: userEmail });
      toast.success('Un nouveau code a été envoyé à votre email.');
    } catch (err) {
      toast.error('Erreur lors du renvoi du code.');
    } finally {
      setLoading(false);
    }
  };

  // Étape 3: Redirection vers connexion
  const handleOk = () => {
    navigate('/connexion');
  };

  const inp = {
    width: '100%', padding: '12px 14px', borderRadius: 11,
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    color: '#1e293b', fontSize: 13.5, outline: 'none',
    boxSizing: 'border-box', fontFamily: "'Sora',sans-serif",
    transition: 'border-color 0.2s, box-shadow 0.2s',
  };
  
  const lbl = {
    display: 'block', fontSize: 10.5, color: '#475569',
    fontWeight: 600, marginBottom: 5,
    textTransform: 'uppercase', letterSpacing: '0.5px',
  };

  // ──────────────────────────────────────────────────────────────────────────────
  // ÉTAPE 3: Message de bienvenue
  // ──────────────────────────────────────────────────────────────────────────────
  if (etape === 3) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0c2e7c, #1e4db7, #3b82f6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', width: 600, height: 600,
            borderRadius: '50%', top: -200, left: '50%', transform: 'translateX(-50%)',
            background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }} />
        </div>

        <div style={{
          width: '100%', maxWidth: 500, position: 'relative', zIndex: 1,
          background: 'rgba(255,255,255,0.98)',
          borderRadius: 24, padding: '48px 40px',
          boxShadow: '0 24px 80px rgba(0,0,0,0.25)',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 72, marginBottom: 20 }}>🎉</div>
          <h2 style={{ margin: '0 0 12px', fontSize: 26, fontWeight: 800, color: '#0c2e7c' }}>
            Bienvenue sur FinanceApp !
          </h2>
          <p style={{ fontSize: 15, color: '#475569', lineHeight: 1.6, marginBottom: 16 }}>
            <strong>{userData?.prenom} {userData?.nom}</strong>, votre compte a été créé avec succès.
          </p>
          <div style={{
            background: '#ecfdf5', borderRadius: 12, padding: '20px',
            margin: '20px 0', textAlign: 'left',
            border: '1px solid #a7f3d0',
          }}>
            <p style={{ margin: '0 0 8px', fontSize: 14, color: '#065f46', fontWeight: 600 }}>
              📧 Email : {userEmail}
            </p>
            <p style={{ margin: '0 0 8px', fontSize: 14, color: '#065f46', fontWeight: 600 }}>
              📱 Téléphone : {form.telephone}
            </p>
            <p style={{ margin: 0, fontSize: 13, color: '#065f46' }}>
              ✨ Vous bénéficiez de <strong>14 jours d'essai gratuit</strong> pour découvrir toutes nos fonctionnalités.
            </p>
          </div>
          <p style={{ fontSize: 13, color: '#64748b', marginBottom: 24 }}>
            Connectez-vous dès maintenant pour gérer vos finances.
          </p>
          <button onClick={handleOk} style={{
            width: '100%', padding: '14px',
            background: 'linear-gradient(135deg,#0c2e7c,#1e4db7)',
            color: '#fff', border: 'none', borderRadius: 12,
            fontWeight: 700, fontSize: 16, cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(12,46,124,0.3)',
          }}>
            Se connecter →
          </button>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // ÉTAPE 2: Vérification email
  // ──────────────────────────────────────────────────────────────────────────────
  if (etape === 2) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0c2e7c, #1e4db7, #3b82f6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', width: 600, height: 600,
            borderRadius: '50%', top: -200, left: '50%', transform: 'translateX(-50%)',
            background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }} />
        </div>

        <div style={{
          width: '100%', maxWidth: 420, position: 'relative', zIndex: 1,
          background: 'rgba(255,255,255,0.98)',
          borderRadius: 24, padding: '40px 36px',
          boxShadow: '0 24px 80px rgba(0,0,0,0.25)',
        }}>
          <Link to="/" style={{
            display: 'flex', alignItems: 'center', gap: 6,
            color: '#64748b', textDecoration: 'none', fontSize: 12, marginBottom: 22,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Retour
          </Link>

          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📧</div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#0c2e7c' }}>
              Vérifiez votre email
            </h2>
            <p style={{ margin: '8px 0 0', fontSize: 13, color: '#64748b' }}>
              Un code de confirmation a été envoyé à<br />
              <strong>{userEmail}</strong>
            </p>
          </div>

          <form onSubmit={handleVerifierCode} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={lbl}>Code de confirmation (6 chiffres)</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showCode ? 'text' : 'password'}
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  required
                  style={{
                    ...inp, textAlign: 'center', fontSize: 24, fontWeight: 700,
                    letterSpacing: 8, padding: '14px',
                  }}
                />
                <button type="button" onClick={() => setShowCode(v => !v)} style={{
                  position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8',
                }}>
                  {showCode ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '14px',
              fontWeight: 600, fontSize: 15,
              background: '#0c2e7c', color: '#fff', border: 'none', borderRadius: 12,
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 16px rgba(12,46,124,0.3)',
              opacity: loading ? 0.75 : 1,
            }}>
              {loading ? 'Vérification...' : 'Vérifier le code →'}
            </button>

            <button type="button" onClick={handleRenvoyerCode} disabled={loading} style={{
              background: 'none', border: 'none', color: '#6366f1',
              cursor: 'pointer', fontSize: 13, fontWeight: 600,
              marginTop: 4,
            }}>
              Renvoyer le code
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // ÉTAPE 1: Formulaire d'inscription
  // ──────────────────────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0c2e7c, #1e4db7, #3b82f6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px', position: 'relative', overflow: 'hidden',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap');
        .inp-r:focus { border-color: #0c2e7c !important; box-shadow: 0 0 0 3px rgba(12,46,124,0.12) !important; }
        .btn-r:hover:not(:disabled) { transform: translateY(-2px); background: #163e96 !important; box-shadow: 0 8px 28px rgba(12,46,124,0.5) !important; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

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

      <div style={{
        width: '100%', maxWidth: 460, position: 'relative', zIndex: 1,
        background: 'rgba(255,255,255,0.98)',
        borderRadius: 24, padding: '36px 34px',
        boxShadow: '0 24px 80px rgba(0,0,0,0.25)',
      }}>
        <Link to="/" style={{
          display: 'flex', alignItems: 'center', gap: 6,
          color: '#64748b', textDecoration: 'none', fontSize: 12, marginBottom: 22,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Retour
        </Link>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 7,
                background: '#0c2e7c',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                  <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
                </svg>
              </div>
              <span style={{ fontWeight: 700, fontSize: 15, color: '#0c2e7c' }}>
                Finance<span style={{ color: '#3b82f6' }}>App</span>
              </span>
            </div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#0c2e7c' }}>Créer un compte</h2>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: '#64748b' }}>14 jours gratuits — Étape 1/3</p>
          </div>

          <div style={{
            width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
            background: initiales === '?' ? '#f1f5f9' : avatarBg,
            border: `2px solid ${initiales === '?' ? '#e2e8f0' : avatarBg}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontWeight: 800, color: '#fff',
          }}>
            {initiales === '?' ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            ) : initiales}
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={lbl}>Prénom *</label>
              <input value={form.prenom} onChange={e => setForm({...form, prenom: e.target.value})}
                placeholder="saisir votre prénom" required className="inp-r" style={inp} />
            </div>
            <div>
              <label style={lbl}>Nom *</label>
              <input value={form.nom} onChange={e => setForm({...form, nom: e.target.value})}
                placeholder="saisir votre nom" required className="inp-r" style={inp} />
            </div>
          </div>

          <div>
            <label style={lbl}>
              Téléphone *
              <span style={{ color: '#94a3b8', fontWeight: 400, textTransform: 'none', marginLeft: 4 }}>(+222XXXXXXXX)</span>
            </label>
            <input value={form.telephone} onChange={e => setForm({...form, telephone: e.target.value})}
              placeholder="+222XXXXXXXX" required className="inp-r" style={inp} />
          </div>

          <div>
            <label style={lbl}>
              Email *
              <span style={{ color: '#94a3b8', fontWeight: 400, textTransform: 'none', marginLeft: 4 }}>(pour connexion & récupération)</span>
            </label>
            <input
              type="email" value={form.email}
              onChange={e => setForm({...form, email: e.target.value})}
              placeholder="vous@gmail.com" required className="inp-r"
              style={{
                ...inp,
                borderColor: form.email && !emailOk ? '#ef4444' : '#e2e8f0',
              }}
            />
            {form.email && !emailOk && (
              <p style={{ margin: '3px 0 0', fontSize: 11, color: '#ef4444' }}>⚠️ Format invalide</p>
            )}
          </div>

          <div>
            <label style={lbl}>Mot de passe * (min. 6 caractères)</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPwd ? 'text' : 'password'} value={form.password}
                onChange={e => setForm({...form, password: e.target.value})}
                placeholder="••••••••" required minLength={6}
                className="inp-r" style={{ ...inp, paddingRight: 44 }}
              />
              <button type="button" onClick={() => setShowPwd(v => !v)} style={{
                position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 15,
              }}>
                {showPwd ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <div>
            <label style={lbl}>Confirmer le mot de passe *</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirm ? 'text' : 'password'} value={form.password_confirm}
                onChange={e => setForm({...form, password_confirm: e.target.value})}
                placeholder="••••••••" required className="inp-r"
                style={{
                  ...inp, paddingRight: 44,
                  borderColor: form.password_confirm && form.password !== form.password_confirm ? '#ef4444' : '#e2e8f0',
                }}
              />
              <button type="button" onClick={() => setShowConfirm(v => !v)} style={{
                position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 15,
              }}>
                {showConfirm ? '🙈' : '👁️'}
              </button>
            </div>
            {form.password_confirm && form.password !== form.password_confirm && (
              <p style={{ margin: '3px 0 0', fontSize: 11, color: '#ef4444' }}>⚠️ Les mots de passe ne correspondent pas</p>
            )}
          </div>

          <button type="submit" disabled={loading} className="btn-r" style={{
            marginTop: 4, width: '100%', padding: '13px',
            fontWeight: 600, fontSize: 14,
            background: '#0c2e7c', color: '#fff', border: 'none', borderRadius: 12,
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 16px rgba(12,46,124,0.3)',
            opacity: loading ? 0.75 : 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            {loading ? (
              <>
                <span style={{
                  width: 15, height: 15,
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: '#fff', borderRadius: '50%',
                  display: 'inline-block', animation: 'spin 0.7s linear infinite',
                }}/>
                Création...
              </>
            ) : 'Continuer →'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 18, fontSize: 13, color: '#64748b' }}>
          Déjà un compte ?{' '}
          <Link to="/connexion" style={{ color: '#0c2e7c', fontWeight: 700, textDecoration: 'none' }}>
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}