import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Employes() {
  const { user } = useAuth();
  const [employes,      setEmployes]      = useState([]);
  const [emailInvit,    setEmailInvit]    = useState('');
  const [loading,       setLoading]       = useState(true);
  const [loadingInvit,  setLoadingInvit]  = useState(false);
  const [showForm,      setShowForm]      = useState(false);
  const [lienManuel,    setLienManuel]    = useState('');  // lien si SMTP non configuré

  const chargerEmployes = async () => {
    try {
      const res = await api.get('/comptes/mes-employes/');
      setEmployes(res.data);
    } catch {
      setEmployes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { chargerEmployes(); }, []);

  const handleInviter = async (e) => {
    e.preventDefault();
    if (!emailInvit.trim()) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailInvit)) {
      toast.error("Format d'email invalide.");
      return;
    }

    setLoadingInvit(true);
    setLienManuel('');
    try {
      const res = await api.post('/comptes/inviter-employe/', {
        email_employe: emailInvit.trim().toLowerCase(),
      });

      // Cas : SMTP non configuré → afficher le lien manuellement
      if (res.data.lien || res.data.warning) {
        setLienManuel(res.data.lien || '');
        toast.success(res.data.message || 'Invitation créée !', { duration: 5000 });
        if (res.data.warning) {
          toast(res.data.warning, { icon: '⚠️', duration: 8000 });
        }
      } else {
        toast.success(res.data.message || `Invitation envoyée à ${emailInvit} !`);
      }

      setEmailInvit('');
      setShowForm(false);
      chargerEmployes();
    } catch (err) {
      // Afficher le message d'erreur exact du backend
      const errMsg =
        err.response?.data?.error ||
        err.response?.data?.email_employe?.[0] ||
        err.response?.data?.detail ||
        'Erreur lors de l\'invitation.';
      toast.error(errMsg, { duration: 6000 });
    } finally {
      setLoadingInvit(false);
    }
  };

  const initiales = user
    ? `${(user.prenom || '')[0] || ''}${(user.nom || '')[0] || ''}`.toUpperCase()
    : '?';

  return (
    <div style={{ maxWidth: 780, margin: '0 auto', padding: '8px 0', fontFamily: "'Sora',sans-serif" }}>

      {/* ── En-tête ────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#0c2e7c', display: 'flex', alignItems: 'center', gap: 10 }}>
            👥 Gestion des Employés
          </h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>
            Invitez des employés à rejoindre votre espace entreprise
          </p>
        </div>
        {showForm && (
          <button onClick={() => { setShowForm(false); setLienManuel(''); }} style={{
            background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 10,
            padding: '8px 16px', cursor: 'pointer', color: '#64748b', fontWeight: 600, fontSize: 13,
          }}>
            ✕ Annuler
          </button>
        )}
      </div>

      {/* ── Info compte entreprise ─────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg,#dbeafe,#eff6ff)',
        border: '1px solid #bfdbfe', borderRadius: 14,
        padding: '16px 20px', marginBottom: 20,
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#0c2e7c', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 16, flexShrink: 0 }}>
          {user?.photo_profil
            ? <img src={`http://localhost:8000${user.photo_profil}`} alt="profil" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
            : initiales}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, color: '#0c2e7c', fontSize: 15 }}>{user?.prenom} {user?.nom}</div>
          <div style={{ fontSize: 13, color: '#64748b' }}>
            Compte Entreprise • {employes.filter(e => e.is_active).length} employé(s) actif(s)
          </div>
        </div>
        <span style={{ background: '#0c2e7c', color: '#fff', borderRadius: 20, padding: '5px 14px', fontSize: 12, fontWeight: 700 }}>
          Plan Entreprise
        </span>
      </div>

      {/* ── Formulaire d'invitation ────────────────────────────────────── */}
      <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 1px 8px rgba(0,0,0,0.06)', marginBottom: 20 }}>
        <h3 style={{ margin: '0 0 6px', color: '#0c2e7c', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
          📧 Inviter un nouvel employé
        </h3>
        <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>
          Un email d'invitation sera envoyé à l'adresse indiquée. L'employé devra cliquer sur le lien pour activer son compte et créer son mot de passe.
        </p>

        <form onSubmit={handleInviter} style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input
            type="email"
            value={emailInvit}
            onChange={e => setEmailInvit(e.target.value)}
            placeholder="email@exemple.com"
            required
            style={{
              flex: 1, minWidth: 220, padding: '12px 16px', borderRadius: 10,
              border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none',
              fontFamily: 'inherit', transition: 'border-color 0.2s',
            }}
            onFocus={e => e.target.style.borderColor = '#0c2e7c'}
            onBlur={e => e.target.style.borderColor = '#e2e8f0'}
          />
          <button
            type="submit"
            disabled={loadingInvit || !emailInvit.trim()}
            style={{
              padding: '12px 22px', background: '#0c2e7c', color: '#fff',
              border: 'none', borderRadius: 10, cursor: loadingInvit ? 'wait' : 'pointer',
              fontWeight: 700, fontSize: 14, fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', gap: 8,
              opacity: loadingInvit || !emailInvit.trim() ? 0.7 : 1,
              whiteSpace: 'nowrap',
            }}
          >
            {loadingInvit ? (
              <>
                <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                Envoi...
              </>
            ) : '📤 Envoyer l\'invitation'}
          </button>
        </form>

        {/* ── Lien manuel si SMTP non configuré ──────────────────────── */}
        {lienManuel && (
          <div style={{
            marginTop: 16, background: '#fefce8', border: '1px solid #fde047',
            borderRadius: 10, padding: '14px 16px',
          }}>
            <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: '#854d0e' }}>
              ⚠️ Email non envoyé (SMTP non configuré) — Partagez ce lien manuellement :
            </p>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <code style={{
                flex: 1, background: '#fff', border: '1px solid #fde047', borderRadius: 6,
                padding: '8px 10px', fontSize: 11, color: '#0c2e7c',
                wordBreak: 'break-all', fontFamily: 'monospace',
              }}>
                {lienManuel}
              </code>
              <button
                onClick={() => { navigator.clipboard.writeText(lienManuel); toast.success('Lien copié !'); }}
                style={{ background: '#0c2e7c', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}
              >
                📋 Copier
              </button>
            </div>
            <p style={{ margin: '8px 0 0', fontSize: 11, color: '#92400e' }}>
              Pour activer l'envoi d'emails : configurez EMAIL_HOST_USER et EMAIL_HOST_PASSWORD dans votre fichier backend/.env
            </p>
          </div>
        )}
      </div>

      {/* ── Liste des employés ─────────────────────────────────────────── */}
      <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
        <h3 style={{ margin: '0 0 16px', color: '#0c2e7c', fontWeight: 700 }}>
          📋 Liste des employés ({employes.length})
        </h3>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8' }}>
            <div style={{ width: 32, height: 32, border: '3px solid #e2e8f0', borderTopColor: '#0c2e7c', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 10px' }} />
            Chargement...
          </div>
        ) : employes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>👥</div>
            <p style={{ margin: '0 0 6px', fontWeight: 600, color: '#64748b', fontSize: 15 }}>Aucun employé encore</p>
            <p style={{ margin: '0 0 20px', fontSize: 13 }}>
              Invitez des employés pour qu'ils puissent accéder à votre espace financier.
            </p>
            <button
              onClick={() => document.querySelector('input[type="email"]')?.focus()}
              style={{ background: '#0c2e7c', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 22px', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}
            >
              📤 Inviter le premier employé
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {employes.map((emp, i) => {
              const initEmp = `${(emp.prenom || '')[0] || '?'}${(emp.nom || '')[0] || ''}`.toUpperCase();
              return (
                <div key={emp.id} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 0',
                  borderBottom: i < employes.length - 1 ? '1px solid #f1f5f9' : 'none',
                }}>
                  <div style={{ width: 42, height: 42, borderRadius: '50%', background: emp.is_active ? '#0c2e7c' : '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: emp.is_active ? '#fff' : '#94a3b8', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                    {emp.photo_profil
                      ? <img src={`http://localhost:8000${emp.photo_profil}`} alt="emp" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                      : initEmp}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#1e293b' }}>
                      {emp.prenom && emp.nom ? `${emp.prenom} ${emp.nom}` : 'En attente d\'activation'}
                    </div>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                      {emp.email || emp.invitation_email}
                    </div>
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20,
                    background: emp.is_active ? '#ecfdf5' : '#fef3c7',
                    color: emp.is_active ? '#065f46' : '#92400e',
                    border: `1px solid ${emp.is_active ? '#6ee7b7' : '#fde68a'}`,
                    whiteSpace: 'nowrap',
                  }}>
                    {emp.is_active ? '✅ Actif' : '⏳ En attente'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Info partage de données ────────────────────────────────────── */}
      <div style={{
        marginTop: 16, background: '#eff6ff', border: '1px solid #bfdbfe',
        borderRadius: 12, padding: '14px 18px',
        display: 'flex', alignItems: 'flex-start', gap: 10,
      }}>
        <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>ℹ️</span>
        <p style={{ margin: 0, fontSize: 13, color: '#1e40af', lineHeight: 1.6 }}>
          <strong>Partage de données :</strong> Toutes les transactions créées par vos employés sont visibles dans votre tableau de bord. Chaque employé a également accès à son propre espace de travail.
        </p>
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}




