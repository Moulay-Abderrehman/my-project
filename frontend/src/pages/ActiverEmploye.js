import React, { useState, /*useEffect*/ } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';

const TEL_REGEX = /^\+222[234]\d{7}$/;

export default function ActiverEmploye() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [form, setForm] = useState({
    token,
    nom: '', prenom: '', telephone: '',
    password: '', password_confirm: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validerChamp = (name, value) => {
    if (name === 'telephone' && value && !TEL_REGEX.test(value))
      return "Format invalide. Exemple : +222XXXXXXXX";
    if (name === 'password' && value.length > 0 && value.length < 6)
      return "Minimum 6 caractères.";
    if (name === 'password_confirm' && value !== form.password)
      return "Les mots de passe ne correspondent pas.";
    return '';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: validerChamp(name, value) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/comptes/activer-employe/', form, { headers: { Authorization: undefined } });
      localStorage.setItem('access_token', res.data.access);
      localStorage.setItem('refresh_token', res.data.refresh);
      toast.success('Compte activé avec succès ! Bienvenue !');
      navigate('/dashboard');
      window.location.reload();
    } catch (err) {
      const data = err.response?.data;
      if (data) {
        const msgs = Object.entries(data).map(([k, v]) => `${Array.isArray(v) ? v.join(' ') : v}`).join('\n');
        toast.error(msgs);
      } else {
        toast.error('Erreur lors de l\'activation.');
      }
    } finally {
      setLoading(false);
    }
  };

  const inp = (hasError) => ({
    width: '100%', padding: '12px 14px', borderRadius: 10,
    border: `1.5px solid ${hasError ? '#ef4444' : '#e2e8f0'}`,
    fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
  });

  if (!token) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>❌</div>
          <h2 style={{ color: '#1e293b' }}>Lien d'invitation invalide</h2>
          <p style={{ color: '#64748b' }}>Ce lien d'invitation est invalide ou a expiré.</p>
          <Link to="/connexion" style={{ color: '#6366f1', fontWeight: 600 }}>Se connecter →</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(135deg,#667eea,#764ba2)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{
        background: '#fff', borderRadius: 24, padding: '40px 48px',
        maxWidth: 500, width: '100%',
        boxShadow: '0 24px 60px rgba(0,0,0,0.2)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>🤝</div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#1e293b' }}>
            Activation de votre compte
          </h2>
          <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: 14 }}>
            Vous avez été invité à rejoindre une entreprise sur FinanceApp. Complétez votre profil pour commencer.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 6, textTransform: 'uppercase' }}>Nom *</label>
              <input name="nom" value={form.nom} onChange={handleChange} placeholder="Diallo" style={inp(errors.nom)} required />
              {errors.nom && <p style={{ margin: '4px 0 0', fontSize: 12, color: '#ef4444' }}>{errors.nom}</p>}
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 6, textTransform: 'uppercase' }}>Prénom *</label>
              <input name="prenom" value={form.prenom} onChange={handleChange} placeholder="Mamadou" style={inp(errors.prenom)} required />
              {errors.prenom && <p style={{ margin: '4px 0 0', fontSize: 12, color: '#ef4444' }}>{errors.prenom}</p>}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 6, textTransform: 'uppercase' }}>
              Téléphone * (+222XXXXXXXX)
            </label>
            <input name="telephone" value={form.telephone} onChange={handleChange}
              placeholder="+222XXXXXXXX" style={inp(errors.telephone)} required />
            {errors.telephone && <p style={{ margin: '4px 0 0', fontSize: 12, color: '#ef4444' }}>{errors.telephone}</p>}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 6, textTransform: 'uppercase' }}>
              Code de l'application * (min. 6 caractères)
            </label>
            <input name="password" type="password" value={form.password} onChange={handleChange}
              placeholder="••••••••" style={inp(errors.password)} required minLength={6} />
            {errors.password && <p style={{ margin: '4px 0 0', fontSize: 12, color: '#ef4444' }}>{errors.password}</p>}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 6, textTransform: 'uppercase' }}>
              Confirmer le code *
            </label>
            <input name="password_confirm" type="password" value={form.password_confirm} onChange={handleChange}
              placeholder="••••••••" style={inp(errors.password_confirm)} required />
            {errors.password_confirm && <p style={{ margin: '4px 0 0', fontSize: 12, color: '#ef4444' }}>{errors.password_confirm}</p>}
          </div>

          <button type="submit" disabled={loading} style={{
            width: '100%', background: 'linear-gradient(135deg,#667eea,#764ba2)',
            color: '#fff', border: 'none', borderRadius: 12, padding: '14px',
            cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 16,
            opacity: loading ? 0.8 : 1, marginTop: 4,
          }}>
            {loading ? '⏳ Activation...' : '🚀 Activer mon compte'}
          </button>
        </form>
      </div>
    </div>
  );
}


