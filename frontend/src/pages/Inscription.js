// frontend/src/pages/Inscription.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function Inscription() {
  const navigate = useNavigate();
  const [etape, setEtape] = useState(1);
  const [userId, setUserId] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  
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
  const [sessionToken, setSessionToken] = useState(null);

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
      const response = await api.post('/comptes/inscription/', {
        nom: form.nom,
        prenom: form.prenom,
        telephone: form.telephone,
        email: form.email || undefined,
        password: form.password,
        password_confirm: form.password_confirm,
      });
      
      const { status, message, session_token, user_id } = response.data;
      
      if (status === 'existing_user') {
        toast.info(message);
        navigate('/connexion');
        return;
      }
      
      if (status === 'kyc_incomplete') {
        toast.warning(message);
        navigate(`/kyc/document?session=${session_token}`);
        return;
      }
      
      if (session_token && user_id) {
        setUserId(user_id);
        setUserEmail(form.email);
        setSessionToken(session_token);
        localStorage.setItem('temp_user_id', user_id);
        localStorage.setItem('temp_session_token', session_token);
        
        toast.success('Code de confirmation envoyé à votre email !');
        setEtape(2);
      }
      
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

  const handleVerifierCode = async (e) => {
    e.preventDefault();
    if (!code || code.length !== 6) {
      toast.error('Veuillez entrer le code à 6 chiffres.');
      return;
    }
    setLoading(true);
    try {
      const response = await api.post('/comptes/verifier-email/', { code, user_id: userId });
      toast.success('Email vérifié ! Passez à la vérification d\'identité.');
      navigate('/kyc', { state: { userId: userId } });
    } catch (err) {
      const msg = err.response?.data?.error || 'Code invalide ou expiré.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

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

  const handleOk = () => {
    navigate('/connexion');
  };

  // ─── STYLES PARTAGÉS ──────────────────────────────────────────────────────────

  const pageStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0c2e7c, #1e4db7, #3b82f6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    position: 'relative',
    overflow: 'hidden',
  };

  const glowStyle = {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    overflow: 'hidden',
  };

  // ─── ÉTAPE 2 : VÉRIFICATION EMAIL ────────────────────────────────────────────
  if (etape === 2) {
    return (
      <div style={pageStyle}>
        <link rel="stylesheet" href="https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Outfit:wght@600;700;800&display=swap" rel="stylesheet" />

        <style>{`
          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(22px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes pulse-ring {
            0%   { box-shadow: 0 0 0 0 rgba(59,130,246,0.35); }
            70%  { box-shadow: 0 0 0 14px rgba(59,130,246,0); }
            100% { box-shadow: 0 0 0 0 rgba(59,130,246,0); }
          }
          .card-verify { animation: fadeUp 0.45s cubic-bezier(.16,1,.3,1) both; }
          .btn-primary { transition: all 0.22s ease; }
          .btn-primary:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 10px 32px rgba(12,46,124,0.45) !important;
            background: #163e96 !important;
          }
          .btn-ghost:hover { color: #1e4db7 !important; text-decoration: underline; }
          .code-inp {
            transition: border-color 0.2s, box-shadow 0.2s;
            caret-color: #1e4db7;
          }
          .code-inp:focus {
            border-color: #1e4db7 !important;
            box-shadow: 0 0 0 4px rgba(30,77,183,0.13) !important;
            outline: none;
          }
          .back-link { transition: color 0.2s, gap 0.2s; }
          .back-link:hover { color: #1e4db7 !important; }
          .icon-ring {
            animation: pulse-ring 2.4s ease infinite;
          }
        `}</style>

        {/* Déco fond */}
        <div style={glowStyle}>
          <div style={{
            position: 'absolute', width: 560, height: 560,
            borderRadius: '50%', top: -180, left: '50%', transform: 'translateX(-50%)',
            background: 'radial-gradient(circle, rgba(255,255,255,0.09) 0%, transparent 70%)',
            filter: 'blur(44px)',
          }} />
        </div>

        <div className="card-verify" style={{
          width: '100%', maxWidth: 420,
          position: 'relative', zIndex: 1,
          background: '#ffffff',
          borderRadius: 20,
          padding: '40px 36px',
          boxShadow: '0 32px 80px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.08)',
        }}>
          {/* Back */}
          <Link to="/" className="back-link" style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            color: '#94a3b8', textDecoration: 'none', fontSize: 12.5,
            fontWeight: 500, marginBottom: 28,
          }}>
            <i className='bx bx-arrow-back' style={{ fontSize: 15 }} />
            Retour
          </Link>

          {/* Icône */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div className="icon-ring" style={{
              width: 68, height: 68, borderRadius: '50%',
              background: 'linear-gradient(135deg, #e0f2fe, #bfdbfe)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 18px',
            }}>
              <i className='bx bx-envelope' style={{ fontSize: 30, color: '#1e4db7' }} />
            </div>
            <h2 style={{
              margin: 0, fontSize: 22, fontWeight: 800, color: '#0f172a',
              fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.4px',
            }}>
              Vérifiez votre email
            </h2>
            <p style={{ margin: '8px 0 0', fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>
              Un code de confirmation a été envoyé à<br />
              <strong style={{ color: '#1e4db7' }}>{userEmail}</strong>
            </p>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: '#f1f5f9', margin: '0 0 24px' }} />

          <form onSubmit={handleVerifierCode} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={{
                display: 'flex', alignItems: 'center', gap: 5,
                fontSize: 11, color: '#64748b', fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8,
              }}>
                <i className='bx bx-key' style={{ fontSize: 13 }} />
                Code de confirmation (6 chiffres)
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  className="code-inp"
                  type={showCode ? 'text' : 'password'}
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="• • • • • •"
                  required
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    padding: '15px 48px 15px 18px',
                    borderRadius: 12, border: '1.5px solid #e2e8f0',
                    background: '#f8fafc',
                    textAlign: 'center', fontSize: 26, fontWeight: 800,
                    letterSpacing: 10, color: '#0f172a',
                    fontFamily: "'Outfit', monospace",
                  }}
                />
                <button type="button" onClick={() => setShowCode(v => !v)} style={{
                  position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#94a3b8', display: 'flex', alignItems: 'center',
                }}>
                  <i className={showCode ? 'bx bx-hide' : 'bx bx-show'} style={{ fontSize: 19 }} />
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary" style={{
              width: '100%', padding: '14px',
              fontWeight: 700, fontSize: 14.5,
              background: 'linear-gradient(135deg, #0c2e7c, #1e4db7)',
              color: '#fff', border: 'none', borderRadius: 12,
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 18px rgba(12,46,124,0.28)',
              opacity: loading ? 0.75 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              letterSpacing: '0.2px',
            }}>
              {loading ? (
                <>
                  <span style={{
                    width: 16, height: 16,
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#fff', borderRadius: '50%',
                    display: 'inline-block', animation: 'spin 0.7s linear infinite',
                  }} />
                  Vérification...
                </>
              ) : (
                <>
                  <i className='bx bx-check-shield' style={{ fontSize: 17 }} />
                  Vérifier le code
                </>
              )}
            </button>

            <div style={{ textAlign: 'center' }}>
              <button type="button" onClick={handleRenvoyerCode} disabled={loading}
                className="btn-ghost" style={{
                  background: 'none', border: 'none', color: '#64748b',
                  cursor: 'pointer', fontSize: 13, fontWeight: 500,
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                }}>
                <i className='bx bx-refresh' style={{ fontSize: 15 }} />
                Renvoyer le code
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ─── ÉTAPE 1 : FORMULAIRE D'INSCRIPTION ──────────────────────────────────────
  return (
    <div style={pageStyle}>
      <link rel="stylesheet" href="https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css" />
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Outfit:wght@600;700;800&display=swap" rel="stylesheet" />

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .card-main {
          animation: fadeUp 0.45s cubic-bezier(.16,1,.3,1) both;
        }
        .field-input {
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
        .field-input:focus {
          border-color: #1e4db7 !important;
          background: #fff !important;
          box-shadow: 0 0 0 4px rgba(30,77,183,0.1) !important;
        }
        .field-input::placeholder { color: #cbd5e1; }
        .field-input.error { border-color: #ef4444 !important; }
        .field-input-noicon {
          width: 100%; box-sizing: border-box;
          padding: 12px 44px 12px 14px;
          border-radius: 11px;
          border: 1.5px solid #e2e8f0;
          background: #f8fafc;
          color: #0f172a; font-size: 13.5px;
          font-family: 'DM Sans', sans-serif;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
          outline: none;
        }
        .field-input-noicon:focus {
          border-color: #1e4db7 !important;
          background: #fff !important;
          box-shadow: 0 0 0 4px rgba(30,77,183,0.1) !important;
        }
        .field-input-noicon::placeholder { color: #cbd5e1; }
        .field-input-noicon.error { border-color: #ef4444 !important; }
        .btn-submit {
          transition: all 0.22s cubic-bezier(.16,1,.3,1);
        }
        .btn-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          background: linear-gradient(135deg, #163e96, #2460d4) !important;
          box-shadow: 0 10px 30px rgba(12,46,124,0.4) !important;
        }
        .back-link { transition: color 0.2s; }
        .back-link:hover { color: #1e4db7 !important; }
        .toggle-eye {
          transition: color 0.15s;
        }
        .toggle-eye:hover { color: #1e4db7 !important; }
        .step-dot { transition: all 0.3s; }
        @media (max-width: 500px) {
          .card-main { padding: 28px 18px !important; border-radius: 16px !important; }
          .name-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Déco fond */}
      <div style={glowStyle}>
        <div style={{
          position: 'absolute', width: 620, height: 620,
          borderRadius: '50%', top: -220, left: '50%', transform: 'translateX(-50%)',
          background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)',
          filter: 'blur(50px)',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)`,
          backgroundSize: '28px 28px',
        }} />
      </div>

      <div className="card-main" style={{
        width: '100%', maxWidth: 480,
        position: 'relative', zIndex: 1,
        background: '#ffffff',
        borderRadius: 20,
        padding: '36px 34px',
        boxShadow: '0 32px 80px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.07)',
      }}>

        {/* Back */}
        <Link to="/" className="back-link" style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          color: '#94a3b8', textDecoration: 'none', fontSize: 12.5,
          fontWeight: 500, marginBottom: 24,
        }}>
          <i className='bx bx-arrow-back' style={{ fontSize: 15 }} />
          Retour
        </Link>

        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'flex-start', marginBottom: 24, gap: 12,
        }}>
          <div>
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 9,
                background: 'linear-gradient(135deg, #0c2e7c, #1e4db7)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 3px 10px rgba(12,46,124,0.3)',
              }}>
                <i className='bx bx-credit-card' style={{ color: '#fff', fontSize: 16 }} />
              </div>
              <span style={{
                fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 16,
                color: '#0c2e7c', letterSpacing: '-0.3px',
              }}>
                Finance<span style={{ color: '#3b82f6' }}>App</span>
              </span>
            </div>

            <h2 style={{
              margin: 0, fontSize: 21, fontWeight: 800, color: '#0f172a',
              fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.4px',
            }}>
              Créer un compte
            </h2>

            {/* Steps */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
              {[1,2,3].map(s => (
                <React.Fragment key={s}>
                  <div className="step-dot" style={{
                    width: s === 1 ? 22 : 8, height: 8, borderRadius: 99,
                    background: s === 1
                      ? 'linear-gradient(90deg, #0c2e7c, #3b82f6)'
                      : '#e2e8f0',
                    transition: 'all 0.3s',
                  }} />
                </React.Fragment>
              ))}
              <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 4, fontWeight: 500 }}>
                Étape 1 / 3
              </span>
            </div>
          </div>

          {/* Avatar */}
          <div style={{
            width: 54, height: 54, borderRadius: '50%', flexShrink: 0,
            background: initiales === '?'
              ? '#f1f5f9'
              : `linear-gradient(135deg, ${avatarBg}, ${avatarBg}dd)`,
            border: `2.5px solid ${initiales === '?' ? '#e2e8f0' : avatarBg + '55'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 17, fontWeight: 800, color: '#fff',
            boxShadow: initiales === '?' ? 'none' : `0 4px 14px ${avatarBg}44`,
            fontFamily: "'Outfit', sans-serif",
          }}>
            {initiales === '?' ? (
              <i className='bx bx-user' style={{ fontSize: 22, color: '#cbd5e1' }} />
            ) : initiales}
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: '#f1f5f9', marginBottom: 22 }} />

        {/* Formulaire */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Prénom / Nom */}
          <div className="name-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={lblStyle}>
                <i className='bx bx-user' style={{ fontSize: 12 }} /> Prénom *
              </label>
              <div style={{ position: 'relative' }}>
                <i className='bx bx-user' style={iconLeft} />
                <input
                  value={form.prenom}
                  onChange={e => setForm({...form, prenom: e.target.value})}
                  placeholder="Votre prénom"
                  required
                  className="field-input"
                />
              </div>
            </div>
            <div>
              <label style={lblStyle}>
                <i className='bx bx-id-card' style={{ fontSize: 12 }} /> Nom *
              </label>
              <div style={{ position: 'relative' }}>
                <i className='bx bx-id-card' style={iconLeft} />
                <input
                  value={form.nom}
                  onChange={e => setForm({...form, nom: e.target.value})}
                  placeholder="Votre nom"
                  required
                  className="field-input"
                />
              </div>
            </div>
          </div>

          {/* Téléphone */}
          <div>
            <label style={lblStyle}>
              <i className='bx bx-phone' style={{ fontSize: 12 }} />
              Téléphone *{' '}
              <span style={{ color: '#b0bec5', fontWeight: 400, textTransform: 'none' }}>(+222XXXXXXXX)</span>
            </label>
            <div style={{ position: 'relative' }}>
              <i className='bx bx-phone' style={iconLeft} />
              <input
                value={form.telephone}
                onChange={e => setForm({...form, telephone: e.target.value})}
                placeholder="+222XXXXXXXX"
                required
                className="field-input"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label style={lblStyle}>
              <i className='bx bx-envelope' style={{ fontSize: 12 }} />
              Email *{' '}
              <span style={{ color: '#b0bec5', fontWeight: 400, textTransform: 'none' }}>(connexion & récupération)</span>
            </label>
            <div style={{ position: 'relative' }}>
              <i className='bx bx-envelope' style={iconLeft} />
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({...form, email: e.target.value})}
                placeholder="vous@gmail.com"
                required
                className={`field-input${form.email && !emailOk ? ' error' : ''}`}
              />
            </div>
            {form.email && !emailOk && (
              <p style={errStyle}>
                <i className='bx bx-error-circle' style={{ fontSize: 12 }} />
                Format d'email invalide
              </p>
            )}
          </div>

          {/* Mot de passe */}
          <div>
            <label style={lblStyle}>
              <i className='bx bx-lock-alt' style={{ fontSize: 12 }} />
              Mot de passe * <span style={{ color: '#b0bec5', fontWeight: 400, textTransform: 'none' }}>(min. 6 caractères)</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPwd ? 'text' : 'password'}
                value={form.password}
                onChange={e => setForm({...form, password: e.target.value})}
                placeholder="••••••••"
                required
                minLength={6}
                className="field-input-noicon"
                style={{ paddingLeft: 14 }}
              />
              <button type="button" onClick={() => setShowPwd(v => !v)}
                className="toggle-eye" style={eyeBtn}>
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
              <input
                type={showConfirm ? 'text' : 'password'}
                value={form.password_confirm}
                onChange={e => setForm({...form, password_confirm: e.target.value})}
                placeholder="••••••••"
                required
                className={`field-input-noicon${form.password_confirm && form.password !== form.password_confirm ? ' error' : ''}`}
                style={{ paddingLeft: 14 }}
              />
              <button type="button" onClick={() => setShowConfirm(v => !v)}
                className="toggle-eye" style={eyeBtn}>
                <i className={showConfirm ? 'bx bx-hide' : 'bx bx-show'} style={{ fontSize: 18 }} />
              </button>
            </div>
            {form.password_confirm && form.password !== form.password_confirm && (
              <p style={errStyle}>
                <i className='bx bx-error-circle' style={{ fontSize: 12 }} />
                Les mots de passe ne correspondent pas
              </p>
            )}
          </div>

          {/* Bouton submit */}
          <button type="submit" disabled={loading} className="btn-submit" style={{
            marginTop: 6, width: '100%', padding: '14px',
            fontWeight: 700, fontSize: 14.5,
            background: 'linear-gradient(135deg, #0c2e7c, #1e4db7)',
            color: '#fff', border: 'none', borderRadius: 12,
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 18px rgba(12,46,124,0.28)',
            opacity: loading ? 0.75 : 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            fontFamily: "'DM Sans', sans-serif", letterSpacing: '0.2px',
          }}>
            {loading ? (
              <>
                <span style={{
                  width: 16, height: 16,
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: '#fff', borderRadius: '50%',
                  display: 'inline-block', animation: 'spin 0.7s linear infinite',
                }} />
                Création en cours...
              </>
            ) : (
              <>
                Continuer
                <i className='bx bx-right-arrow-alt' style={{ fontSize: 19 }} />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div style={{
          textAlign: 'center', marginTop: 20,
          paddingTop: 16, borderTop: '1px solid #f1f5f9',
        }}>
          <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
            Déjà un compte ?{' '}
            <Link to="/connexion" style={{
              color: '#1e4db7', fontWeight: 700, textDecoration: 'none',
              display: 'inline-flex', alignItems: 'center', gap: 3,
            }}>
              <i className='bx bx-log-in' style={{ fontSize: 14 }} />
              Se connecter
            </Link>
          </p>
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