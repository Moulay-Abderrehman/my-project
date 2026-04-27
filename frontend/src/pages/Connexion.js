import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Connexion() {
  const navigate = useNavigate();
  const { connexion } = useAuth();
  const [form,    setForm]    = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await connexion(form.email, form.password);
      toast.success('Connexion réussie !');
      navigate('/dashboard');
    } catch (err) {
      const errors = err.response?.data;
      if (errors) {
        const msgs = errors.non_field_errors || errors.detail || Object.values(errors).flat();
        (Array.isArray(msgs) ? msgs : [msgs]).forEach(m => toast.error(String(m)));
      } else {
        toast.error('Email ou mot de passe incorrect.');
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

  return (
    <div style={{
      minHeight: '100vh',
      // ── Même background qu'AuthChoix ──────────────────────────────────────
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
        .btn-cx:hover:not(:disabled) { transform: translateY(-2px); background: #163e96 !important; box-shadow: 0 8px 28px rgba(12,46,124,0.5) !important; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* ── Fond décoratif identique à AuthChoix ──────────────────────── */}
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

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: '#0c2e7c',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
            </svg>
          </div>
          <span style={{ fontWeight: 700, fontSize: 16, color: '#0c2e7c' }}>
            Finance<span style={{ color: '#3b82f6' }}>App</span>
          </span>
        </div>

        <h2 style={{ margin: '0 0 6px', fontSize: 24, fontWeight: 700, color: '#0c2e7c' }}>
          Connexion
        </h2>
        <p style={{ margin: '0 0 28px', fontSize: 13, color: '#64748b' }}>
          Bienvenue ! Connectez-vous pour continuer.
        </p>

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
              type="email" value={form.email}
              onChange={e => setForm({...form, email: e.target.value})}
              placeholder="vous@exemple.com"
              required className="inp-cx" style={inp}
            />
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
                type={showPwd ? 'text' : 'password'} value={form.password}
                onChange={e => setForm({...form, password: e.target.value})}
                placeholder="••••••••"
                required className="inp-cx" style={{ ...inp, paddingRight: 46 }}
              />
              <button type="button" onClick={() => setShowPwd(v => !v)} style={{
                position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#94a3b8', fontSize: 16, lineHeight: 1,
              }}>
                {showPwd ? '🙈' : '👁️'}
              </button>
            </div>
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


