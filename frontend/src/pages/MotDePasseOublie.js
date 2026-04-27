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

  const inp = {
    width: '100%', padding: '12px 14px', borderRadius: 10,
    border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none',
    boxSizing: 'border-box', fontFamily: 'inherit',
    transition: 'border-color 0.2s',
  };

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
      minHeight: '100vh', background: 'linear-gradient(135deg,#667eea,#764ba2)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{
        background: '#fff', borderRadius: 24, padding: '40px 48px',
        maxWidth: 460, width: '100%',
        boxShadow: '0 24px 60px rgba(0,0,0,0.2)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>🔑</div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#1e293b' }}>
            {etape === 'email' ? 'Mot de passe oublié' : 'Réinitialisation'}
          </h2>
          <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: 14 }}>
            {etape === 'email'
              ? 'Entrez votre email pour recevoir un code de réinitialisation'
              : `Un code à 6 chiffres a été envoyé à ${email}`
            }
          </p>
        </div>

        {etape === 'email' ? (
          <form onSubmit={handleEnvoyerCode} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 6, textTransform: 'uppercase' }}>
                Adresse Email *
              </label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="nom@domaine.com" style={inp} required
                onFocus={e => e.target.style.borderColor = '#6366f1'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>

            <button type="submit" disabled={loading} style={{
              width: '100%', background: 'linear-gradient(135deg,#667eea,#764ba2)',
              color: '#fff', border: 'none', borderRadius: 12, padding: '14px',
              cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 15,
              opacity: loading ? 0.8 : 1,
            }}>
              {loading ? '⏳ Envoi en cours...' : '📧 Envoyer le code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleReinitialiser} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 6, textTransform: 'uppercase' }}>
                Code de vérification (6 chiffres) *
              </label>
              <input value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456" style={{ ...inp, letterSpacing: 6, fontSize: 20, textAlign: 'center' }}
                maxLength={6} required
                onFocus={e => e.target.style.borderColor = '#6366f1'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 6, textTransform: 'uppercase' }}>
                Nouveau mot de passe *
              </label>
              <input type="password" value={nouveauPassword} onChange={e => setNouveauPassword(e.target.value)}
                placeholder="••••••••" style={inp} required minLength={6}
                onFocus={e => e.target.style.borderColor = '#6366f1'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 6, textTransform: 'uppercase' }}>
                Confirmer le mot de passe *
              </label>
              <input type="password" value={confirmerPassword} onChange={e => setConfirmerPassword(e.target.value)}
                placeholder="••••••••" style={inp} required
                onFocus={e => e.target.style.borderColor = '#6366f1'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>

            <button type="submit" disabled={loading} style={{
              width: '100%', background: 'linear-gradient(135deg,#10b981,#059669)',
              color: '#fff', border: 'none', borderRadius: 12, padding: '14px',
              cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 15,
              opacity: loading ? 0.8 : 1,
            }}>
              {loading ? '⏳ En cours...' : '✅ Réinitialiser le mot de passe'}
            </button>

            <button type="button" onClick={() => setEtape('email')} style={{
              background: 'none', border: 'none', color: '#6366f1',
              cursor: 'pointer', fontSize: 13, fontWeight: 600,
            }}>
              ← Renvoyer un nouveau code
            </button>
          </form>
        )}

        <p style={{ textAlign: 'center', marginTop: 20, color: '#64748b', fontSize: 14 }}>
          <Link to="/connexion" style={{ color: '#6366f1', fontWeight: 600, textDecoration: 'none' }}>
            ← Retour à la connexion
          </Link>
        </p>
      </div>
    </div>
  );
}