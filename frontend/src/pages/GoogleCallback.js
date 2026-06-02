// frontend/src/pages/GoogleCallback.js
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

// Composant pour créer le mot de passe après connexion Google
function GoogleSetPassword({ userId, email, onComplete }) {
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

      console.log('[GoogleSetPassword] Réponse:', res.data);

      if (res.data.kyc_required) {
        toast.success('Mot de passe créé ! Maintenant, vérifiez votre identité.');
        navigate('/kyc-verification');
      } else if (res.data.access) {
        localStorage.setItem('access_token', res.data.access);
        localStorage.setItem('refresh_token', res.data.refresh);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        toast.success('✅ Mot de passe créé avec succès !');
        navigate('/dashboard');
      } else {
        toast.success('Mot de passe créé ! Vous pouvez maintenant vous connecter.');
        navigate('/connexion');
      }
      
      if (onComplete) onComplete();
    } catch (err) {
      console.error('[GoogleSetPassword] Erreur:', err);
      const msg = err.response?.data?.error || 'Erreur lors de la création du mot de passe.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0c2e7c, #1e4db7, #3b82f6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px',
    }}>
      <div style={{
        width: '100%', maxWidth: 420,
        background: 'rgba(255,255,255,0.98)',
        borderRadius: 24, padding: '40px 36px',
        boxShadow: '0 24px 80px rgba(0,0,0,0.25)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 60, height: 60, borderRadius: '50%',
            background: '#0c2e7c', margin: '0 auto 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
              <rect x="2" y="5" width="20" height="14" rx="2"/>
              <line x1="2" y1="10" x2="22" y2="10"/>
            </svg>
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
            <label style={{ display: 'block', fontSize: 11, color: '#475569', fontWeight: 600, marginBottom: 7 }}>
              Mot de passe * (min. 6 caractères)
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: 11,
                  background: '#f8fafc', border: '1px solid #e2e8f0',
                  paddingRight: 44, outline: 'none',
                }}
              />
              <button type="button" onClick={() => setShowPwd(v => !v)} style={{
                position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer',
              }}>
                {showPwd ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, color: '#475569', fontWeight: 600, marginBottom: 7 }}>
              Confirmer le mot de passe *
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: 11,
                  background: '#f8fafc', border: '1px solid #e2e8f0',
                  paddingRight: 44, outline: 'none',
                }}
              />
              <button type="button" onClick={() => setShowConfirm(v => !v)} style={{
                position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer',
              }}>
                {showConfirm ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} style={{
            marginTop: 6, width: '100%', padding: '14px',
            fontWeight: 600, fontSize: 15,
            background: loading ? '#94a3b8' : '#0c2e7c',
            color: '#fff', border: 'none', borderRadius: 12,
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
          }}>
            {loading ? 'Création en cours...' : 'Créer mon mot de passe →'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function GoogleCallback() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { chargerAbonnement, chargerNotifs } = useAuth();
  const [statut, setStatut] = useState('Connexion avec Google...');
  const [erreur, setErreur] = useState('');
  const [needPassword, setNeedPassword] = useState(false);
  const [tempUserId, setTempUserId] = useState(null);
  const [tempEmail, setTempEmail] = useState('');
  
  // ✅ Ref pour empêcher les appels multiples du useEffect
  const hasProcessed = useRef(false);

  useEffect(() => {
    // ✅ Si déjà traité, ne rien faire
    if (hasProcessed.current) {
      console.log('[GoogleCallback] Déjà traité, ignoré');
      return;
    }

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

    // ✅ Marquer comme traité immédiatement
    hasProcessed.current = true;

    (async () => {
      try {
        setStatut('Vérification de votre compte Google...');

        const res = await api.post('/comptes/auth/google/', {
          code,
          redirect_uri: `${window.location.origin}/auth/google/callback`,
        });

        console.log('[GoogleCallback] Réponse:', res.data);

        // ═══════════════════════════════════════════════════════════════════
        // CAS 1: Nouvel utilisateur Google → besoin de créer un mot de passe
        // ═══════════════════════════════════════════════════════════════════
        if (res.data.need_password_setup === true) {
          console.log('✅ Affichage formulaire mot de passe');
          setTempUserId(res.data.user.id);
          setTempEmail(res.data.user.email);
          setNeedPassword(true);
          return;
        }
        
        // ═══════════════════════════════════════════════════════════════════
        // CAS 2: Utilisateur existant mais KYC non complété
        // ═══════════════════════════════════════════════════════════════════
        if (res.data.kyc_required === true) {
          console.log('🪪 Redirection vers KYC');
          toast('Veuillez compléter la vérification d\'identité.');
          navigate('/kyc-verification');
          return;
        }
        
        // ═══════════════════════════════════════════════════════════════════
        // CAS 3: Utilisateur complet → connexion normale
        // ═══════════════════════════════════════════════════════════════════
        if (res.data.access && res.data.refresh) {
          console.log('✅ Connexion normale');
          localStorage.setItem('access_token', res.data.access);
          localStorage.setItem('refresh_token', res.data.refresh);
          localStorage.setItem('user', JSON.stringify(res.data.user));

          await chargerAbonnement();
          await chargerNotifs();

          toast.success(`✅ Connecté !`);
          navigate('/dashboard');
          return;
        }
        
        console.warn('⚠️ Réponse inattendue');
        toast.error('Réponse inattendue du serveur.');
        
      } catch (err) {
        console.error('[GoogleCallback] Erreur:', err);
        const msg = err.response?.data?.error || 'Erreur de connexion Google.';
        setErreur(msg);
        toast.error(msg);
        setTimeout(() => navigate('/'), 3000);
      }
    })();
  }, [chargerAbonnement, chargerNotifs, navigate, params]);

  // ✅ Afficher le formulaire de mot de passe si nécessaire
  if (needPassword) {
    return <GoogleSetPassword 
      userId={tempUserId} 
      email={tempEmail} 
      onComplete={() => {
        setNeedPassword(false);
        navigate('/kyc-verification');
      }}
    />;
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0c2e7c, #1e4db7, #3b82f6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.95)', borderRadius: 20,
        padding: '36px 40px', textAlign: 'center',
      }}>
        {!erreur ? (
          <>
            <div style={{ width: 50, height: 50, border: '3px solid #e2e8f0', borderTopColor: '#0c2e7c', borderRadius: '50%', margin: '0 auto 20px', animation: 'spin 0.8s linear infinite' }} />
            <h3 style={{ margin: 0, color: '#0c2e7c' }}>{statut}</h3>
          </>
        ) : (
          <>
            <div style={{ fontSize: 44, marginBottom: 14 }}>❌</div>
            <h3 style={{ margin: 0, color: '#dc2626' }}>Connexion échouée</h3>
            <p style={{ marginTop: 16, fontSize: 13, color: '#64748b' }}>{erreur}</p>
          </>
        )}
      </div>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}