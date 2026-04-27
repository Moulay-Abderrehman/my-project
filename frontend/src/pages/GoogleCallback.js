// frontend/src/pages/GoogleCallback.js
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function GoogleCallback() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { chargerAbonnement, chargerNotifs } = useAuth();
  const [statut, setStatut] = useState('Connexion avec Google...');
  const [erreur, setErreur] = useState('');
  const [needPassword, setNeedPassword] = useState(false);
  const [tempUserId, setTempUserId] = useState(null);
  const [tempEmail, setTempEmail] = useState('');

  useEffect(() => {
    const code = params.get('code');
    const error = params.get('error');

    if (error) {
      toast.error('Connexion Google annulée.');
      navigate('/');
      return;
    }

    if (!code) {
      toast.error('Code Google manquant.');
      navigate('/');
      return;
    }

    (async () => {
      try {
        setStatut('Vérification de votre compte Google...');

        const res = await api.post('/comptes/auth/google/', {
          code,
          redirect_uri: `${window.location.origin}/auth/google/callback`,
        });

        // Vérifier si l'utilisateur a déjà un mot de passe
        if (res.data.need_password_setup) {
          // Nouvel utilisateur Google → besoin de créer un mot de passe
          setTempUserId(res.data.user.id);
          setTempEmail(res.data.user.email);
          setNeedPassword(true);
          setStatut('Finalisez votre inscription');
        } else {
          // Utilisateur existant avec mot de passe → connexion normale
          localStorage.setItem('access_token', res.data.access);
          localStorage.setItem('refresh_token', res.data.refresh);
          localStorage.setItem('user', JSON.stringify(res.data.user));

          setStatut('Connexion réussie !');
          await chargerAbonnement();
          await chargerNotifs();

          toast.success(`✅ Connecté en tant que ${res.data.user.prenom} ${res.data.user.nom} !`);
          navigate('/dashboard');
        }
      } catch (err) {
        const msg = err.response?.data?.error || 'Erreur de connexion Google.';
        setErreur(msg);
        toast.error(msg);
        setTimeout(() => navigate('/'), 3000);
      }
    })();
  }, []);

  // Page de création de mot de passe
  if (needPassword) {
    return <GoogleSetPassword userId={tempUserId} email={tempEmail} />;
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0c2e7c, #1e4db7, #3b82f6)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 20,
      fontFamily: "'Sora', sans-serif",
    }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0c2e7c" strokeWidth="2.5">
            <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
          </svg>
        </div>
        <span style={{ fontWeight: 700, fontSize: 18, color: '#fff' }}>Finance<span style={{ color: '#dbeafe' }}>App</span></span>
      </div>

      <div style={{
        background: 'rgba(255,255,255,0.95)', borderRadius: 20,
        padding: '36px 40px', textAlign: 'center',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        minWidth: 320,
      }}>
        {!erreur ? (
          <>
            <div style={{ position: 'relative', width: 56, height: 56, margin: '0 auto 20px' }}>
              <div style={{
                width: 56, height: 56, border: '3px solid #e2e8f0',
                borderTopColor: '#0c2e7c', borderRadius: '50%',
                animation: 'spin 0.9s linear infinite',
              }} />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="24" height="24" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              </div>
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: 17, fontWeight: 600, color: '#0c2e7c' }}>
              {statut}
            </h3>
            <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
              Veuillez patienter quelques secondes...
            </p>
          </>
        ) : (
          <>
            <div style={{ fontSize: 44, marginBottom: 14 }}>❌</div>
            <h3 style={{ margin: '0 0 8px', fontSize: 17, fontWeight: 600, color: '#dc2626' }}>
              Connexion échouée
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>
              {erreur}
            </p>
            <p style={{ margin: 0, fontSize: 12, color: '#94a3b8' }}>
              Redirection dans 3 secondes...
            </p>
          </>
        )}
      </div>
    </div>
  );
}

// Composant pour créer le mot de passe après connexion Google
function GoogleSetPassword({ userId, email }) {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/comptes/google-set-password/', {
        user_id: userId,
        password: password,
        confirm_password: confirmPassword,
      });

      localStorage.setItem('access_token', res.data.access);
      localStorage.setItem('refresh_token', res.data.refresh);
      localStorage.setItem('user', JSON.stringify(res.data.user));

      toast.success('✅ Mot de passe créé avec succès ! Bienvenue sur FinanceApp !');
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.error || 'Erreur lors de la création du mot de passe.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const inp = {
    width: '100%', padding: '12px 14px', borderRadius: 11,
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    color: '#1e293b', fontSize: 13.5, outline: 'none',
    boxSizing: 'border-box', fontFamily: "'Sora',sans-serif",
  };

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
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#0c2e7c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
              </svg>
            </div>
            <span style={{ fontWeight: 700, fontSize: 18, color: '#0c2e7c' }}>
              Finance<span style={{ color: '#3b82f6' }}>App</span>
            </span>
          </div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#0c2e7c' }}>
            Créez votre mot de passe
          </h2>
          <p style={{ margin: '8px 0 0', fontSize: 13, color: '#64748b' }}>
            Connecté avec <strong>{email}</strong><br />
            Définissez un mot de passe pour vous connecter ultérieurement.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: '#475569', fontWeight: 600, marginBottom: 7, textTransform: 'uppercase' }}>
              Mot de passe * (min. 6 caractères)
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required minLength={6}
                style={{ ...inp, paddingRight: 44 }}
              />
              <button type="button" onClick={() => setShowPwd(v => !v)} style={{
                position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 16,
              }}>
                {showPwd ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, color: '#475569', fontWeight: 600, marginBottom: 7, textTransform: 'uppercase' }}>
              Confirmer le mot de passe *
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{ ...inp, paddingRight: 44 }}
              />
              <button type="button" onClick={() => setShowConfirm(v => !v)} style={{
                position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 16,
              }}>
                {showConfirm ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} style={{
            marginTop: 6, width: '100%', padding: '14px',
            fontWeight: 600, fontSize: 15,
            background: '#0c2e7c', color: '#fff', border: 'none', borderRadius: 12,
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 16px rgba(12,46,124,0.3)',
            opacity: loading ? 0.75 : 1,
          }}>
            {loading ? 'Création...' : 'Créer mon mot de passe →'}
          </button>
        </form>
      </div>
    </div>
  );
}