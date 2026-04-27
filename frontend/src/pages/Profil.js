// frontend/src/pages/profile.js
import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

// ── Tarifs selon type utilisateur ────────────────────────────────────────────
const TARIFS = {
  standard:   { mensuel: 1500,  annuel: 15000  },
  entreprise: { mensuel: 2500, annuel: 25000 },
};

export default function Profil() {
  const { user, abonnement, deconnexion, chargerAbonnement, mettreAJourUser } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('profil');

  // ── Profil ────────────────────────────────────────────────────────────────
  const [formProfil,   setFormProfil]   = useState({ nom: '', prenom: '', supprimer_photo: false });
  const [photoFile,    setPhotoFile]    = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [loadingProfil, setLoadingProfil] = useState(false);

  // ── Sécurité ──────────────────────────────────────────────────────────────
  const [formMdp, setFormMdp] = useState({ ancien_password: '', nouveau_password: '', confirm_password: '' });
  const [loadingMdp, setLoadingMdp] = useState(false);
  const [showAncien,  setShowAncien]  = useState(false);
  const [showNouveau, setShowNouveau] = useState(false);

  // ── Abonnement — étape 1 ─────────────────────────────────────────────────
  const [typeAbo,    setTypeAbo]    = useState('mensuel');    // mensuel | annuel
  const [typeUser,   setTypeUser]   = useState('standard');   // standard | entreprise
  const [emailAbo,   setEmailAbo]   = useState('');
  const [loadingCode, setLoadingCode] = useState(false);
  const [codeEnvoye,  setCodeEnvoye]  = useState(false);

  // ── Abonnement — étape 2 ─────────────────────────────────────────────────
  const [code,        setCode]       = useState('');
  const [loadingAbo,  setLoadingAbo] = useState(false);
  const [successAbo,  setSuccessAbo] = useState(null);  // données succès

  // ── Contact ───────────────────────────────────────────────────────────────
  const [formContact,    setFormContact]    = useState('');
  const [loadingContact, setLoadingContact] = useState(false);

  useEffect(() => {
    if (user) {
      setFormProfil({ nom: user.nom || '', prenom: user.prenom || '', supprimer_photo: false });
      setEmailAbo(user.email || '');
    }
  }, [user]);

  const montantCalc = TARIFS[typeUser]?.[typeAbo] || 500;

  // Vérifier si l'utilisateur vient de Google (compte sans numéro de téléphone valide)
  const estCompteGoogle = user?.est_compte_google || (user?.telephone && user.telephone.startsWith('+222_g_'));

  // Vérifier si l'utilisateur peut souscrire un nouvel abonnement
  const peutSouscrire = () => {
    if (!aboActif) return true; // Pas d'abonnement actif
    if (estEssai) return true; // En période d'essai
    return joursRest <= 5; // Peut souscrire seulement si <= 5 jours restants
  };

  // ─────────────────────────────────────────────────────────────────────────
  // PROFIL
  // ─────────────────────────────────────────────────────────────────────────
  const handleSauvegarderProfil = async (e) => {
    e.preventDefault();
    setLoadingProfil(true);
    try {
      const fd = new FormData();
      fd.append('nom',    formProfil.nom);
      fd.append('prenom', formProfil.prenom);
      if (photoFile) {
        fd.append('photo_profil', photoFile);
      }
      if (formProfil.supprimer_photo) {
        fd.append('supprimer_photo', 'true');
      }
      const res = await api.patch('/comptes/profil/', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      mettreAJourUser(res.data);
      setPhotoFile(null);
      setPhotoPreview(null);
      setFormProfil(prev => ({ ...prev, supprimer_photo: false }));
      toast.success('✅ Profil mis à jour !');
    } catch (err) {
      console.error('Erreur:', err);
      toast.error(err.response?.data?.detail || 'Erreur lors de la mise à jour.');
    } finally {
      setLoadingProfil(false);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Photo max 5 Mo.'); return; }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setFormProfil(p => ({ ...p, supprimer_photo: false }));
  };

  const handleSupprimerPhoto = async () => {
    if (!window.confirm('Voulez-vous vraiment supprimer votre photo de profil ?')) return;
    
    setLoadingProfil(true);
    try {
      const fd = new FormData();
      fd.append('nom', formProfil.nom);
      fd.append('prenom', formProfil.prenom);
      fd.append('supprimer_photo', 'true');
      
      const res = await api.patch('/comptes/profil/', fd, { 
        headers: { 'Content-Type': 'multipart/form-data' } 
      });
      mettreAJourUser(res.data);
      setPhotoFile(null);
      setPhotoPreview(null);
      setFormProfil(prev => ({ ...prev, supprimer_photo: false }));
      toast.success('Photo supprimée avec succès !');
    } catch (err) {
      toast.error('Erreur lors de la suppression');
    } finally {
      setLoadingProfil(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // SÉCURITÉ
  // ─────────────────────────────────────────────────────────────────────────
  const handleChangerMdp = async (e) => {
    e.preventDefault();
    if (formMdp.nouveau_password !== formMdp.confirm_password)
      return toast.error('Les mots de passe ne correspondent pas.');
    setLoadingMdp(true);
    try {
      await api.post('/comptes/changer-mot-de-passe/', {
        ancien_password: formMdp.ancien_password,
        nouveau_password: formMdp.nouveau_password,
      });
      toast.success('🔑 Mot de passe modifié !');
      setFormMdp({ ancien_password: '', nouveau_password: '', confirm_password: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Mot de passe actuel incorrect.');
    } finally {
      setLoadingMdp(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // ABONNEMENT — Étape 1 : Demander le code
  // ─────────────────────────────────────────────────────────────────────────
  const demanderCode = async (e) => {
    e.preventDefault();
    if (!emailAbo) return toast.error("L'email est obligatoire.");
    
    // Vérifier si l'utilisateur peut souscrire
    if (!peutSouscrire()) {
      toast.error(`Vous avez déjà un abonnement actif. Il vous reste ${joursRest} jours. Vous pourrez changer de plan uniquement dans les 5 derniers jours.`);
      return;
    }
    
    setLoadingCode(true);
    try {
      const res = await api.post('/abonnements/demander-code/', {
        email: emailAbo,
        type_abonnement: typeAbo,
        type_utilisateur: typeUser,
      });
      toast.success(`📧 Code envoyé à ${emailAbo} !`);
      setCodeEnvoye(true);
    } catch (err) {
      toast.error(err.response?.data?.error || "Erreur lors de l'envoi du code.");
    } finally {
      setLoadingCode(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // ABONNEMENT — Étape 2 : Confirmer avec le code
  // ─────────────────────────────────────────────────────────────────────────
  const confirmerAbonnement = async (e) => {
    e.preventDefault();
    if (!code) return toast.error('Entrez le code reçu par email.');
    
    // Vérifier si l'utilisateur peut souscrire
    if (!peutSouscrire()) {
      toast.error(`Vous avez déjà un abonnement actif. Il vous reste ${joursRest} jours.`);
      return;
    }
    
    setLoadingAbo(true);
    try {
      const res = await api.post('/abonnements/souscrire/', {
        email: emailAbo,
        code_confirmation: code,
        type_abonnement: typeAbo,
        type_utilisateur: typeUser,
      });
      
      setSuccessAbo(res.data.abonnement);
      await chargerAbonnement();
      toast.success('🎉 Abonnement activé avec succès !');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Code invalide ou expiré.');
    } finally {
      setLoadingAbo(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // CONTACT
  // ─────────────────────────────────────────────────────────────────────────
  const handleContact = async (e) => {
    e.preventDefault();
    setLoadingContact(true);
    try {
      await api.post('/comptes/contact/', { message: formContact });
      toast.success('✅ Message envoyé !');
      setFormContact('');
    } catch {
      toast.error("Erreur lors de l'envoi.");
    } finally {
      setLoadingContact(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // DÉCONNEXION MODERNE
  // ─────────────────────────────────────────────────────────────────────────
  const handleDeconnexion = async () => {
    if (!window.confirm('Voulez-vous vous déconnecter ?')) return;
    await deconnexion();
    navigate('/connexion');
  };

  const initiales = user
    ? `${(user.prenom || '')[0] || ''}${(user.nom || '')[0] || ''}`.toUpperCase()
    : '?';

  const inp = {
    width: '100%', padding: '11px 14px', borderRadius: 10,
    border: '1.5px solid #e2e8f0', fontSize: 14, boxSizing: 'border-box',
    outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.2s',
  };

  const tabs = [
    { id: 'profil',      label: '👤 Profil'      },
    { id: 'securite',    label: '🔒 Sécurité'    },
    { id: 'abonnement',  label: '⭐ Abonnement'  },
    { id: 'contact',     label: '📬 Contact'     },
  ];

  // Statut abonnement
  const aboActif   = abonnement?.est_actif;
  const planNom    = abonnement?.plan_nom || 'essai';
  const estEssai   = planNom === 'essai';
  const joursRest  = abonnement?.jours_restants ?? 0;

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '8px 0' }}>
      <style>{`
        .inp-p:focus { border-color:#6366f1!important; box-shadow:0 0 0 3px rgba(99,102,241,0.12); }
        .btn-s:hover { transform:translateY(-1px); box-shadow:0 6px 20px rgba(99,102,241,0.35)!important; }
        .plan-card:hover { transform:translateY(-3px); box-shadow:0 8px 28px rgba(0,0,0,0.12)!important; }
        .btn-logout {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .btn-logout:hover {
          background: rgba(239, 68, 68, 0.9) !important;
          border-color: #ef4444 !important;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(239, 68, 68, 0.3) !important;
        }
      `}</style>

      {/* ── En-tête ─────────────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
        borderRadius: 20, padding: '28px 32px', marginBottom: 22,
        display: 'flex', alignItems: 'center', gap: 20,
        boxShadow: '0 8px 32px rgba(99,102,241,0.3)',
      }}>
        <div style={{
          width: 76, height: 76, borderRadius: '50%',
          background: 'rgba(255,255,255,0.2)',
          border: '3px solid rgba(255,255,255,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 26, fontWeight: 800, color: '#fff', overflow: 'hidden', flexShrink: 0,
        }}>
          {user?.photo_profil
            ? <img src={`http://localhost:8000${user.photo_profil}`} alt="profil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : initiales}
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0, color: '#fff', fontWeight: 800, fontSize: 20 }}>{user?.prenom} {user?.nom}</h2>
          
          {/* ── AFFICHAGE TÉLÉPHONE : masqué pour les comptes Google ── */}
          {!estCompteGoogle ? (
            <p style={{ margin: '3px 0 0', color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>{user?.telephone}</p>
          ) : (
            <p style={{ margin: '3px 0 0', color: 'rgba(255,255,255,0.8)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 10v-4a4 4 0 0 0-4-4h-4a4 4 0 0 0-4 4v4m-1 0h10a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V11a1 1 0 0 1 1-1z"/>
              </svg>
              Compte Google
            </p>
          )}
          
          {user?.email && (
            <p style={{ margin: '2px 0 0', color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>
              {user.email}
            </p>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 20, padding: '3px 10px', fontSize: 12, color: '#fff', fontWeight: 600 }}>
              Plan : {planNom}
            </span>
            {aboActif && (
              <span style={{ background: '#10b981', borderRadius: 20, padding: '3px 10px', fontSize: 12, color: '#fff', fontWeight: 600 }}>
                ✅ Actif — {joursRest}j restants
              </span>
            )}
            {!aboActif && (
              <span style={{ background: '#ef4444', borderRadius: 20, padding: '3px 10px', fontSize: 12, color: '#fff', fontWeight: 600 }}>
                ⛔ Expiré
              </span>
            )}
          </div>
        </div>
        
        {/* ── BOUTON DÉCONNEXION MODERNE ── */}
        <button 
          onClick={handleDeconnexion} 
          className="btn-logout"
          style={{
            background: 'rgba(0,0,0,0.2)',
            backdropFilter: 'blur(10px)',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: 40,
            padding: '10px 20px',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Déconnexion
        </button>
      </div>

      {/* ── Onglets ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: '#fff', borderRadius: 14, padding: 5, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            flex: 1, padding: '9px 6px', borderRadius: 10, border: 'none', cursor: 'pointer',
            fontSize: 12.5, fontWeight: activeTab === tab.id ? 700 : 500,
            background: activeTab === tab.id ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'transparent',
            color: activeTab === tab.id ? '#fff' : '#64748b',
            transition: 'all 0.2s',
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* TAB PROFIL                                                        */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'profil' && (
        <div style={{ background: '#fff', borderRadius: 16, padding: 28, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
          <h3 style={{ margin: '0 0 22px', color: '#1e293b', fontWeight: 700 }}>👤 Informations personnelles</h3>
          
          {/* ── Message pour les comptes Google ── */}
          {estCompteGoogle && (
            <div style={{
              background: '#eff6ff', borderRadius: 10, padding: '12px 16px',
              border: '1px solid #bfdbfe', marginBottom: 20,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span style={{ fontSize: 13, color: '#1e40af' }}>
                  Vous êtes connecté avec Google. Vous pouvez vous connecter avec votre email Google et votre mot de passe.
                </span>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSauvegarderProfil} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: '#475569', fontWeight: 700, marginBottom: 5, textTransform: 'uppercase' }}>Prénom</label>
                <input value={formProfil.prenom} onChange={e => setFormProfil({...formProfil, prenom: e.target.value})}
                  className="inp-p" style={inp} placeholder="Prénom" required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: '#475569', fontWeight: 700, marginBottom: 5, textTransform: 'uppercase' }}>Nom</label>
                <input value={formProfil.nom} onChange={e => setFormProfil({...formProfil, nom: e.target.value})}
                  className="inp-p" style={inp} placeholder="Nom" required />
              </div>
            </div>

            {/* ── Champ téléphone : visible uniquement pour les comptes non-Google ── */}
            {!estCompteGoogle && (
              <div>
                <label style={{ display: 'block', fontSize: 11, color: '#475569', fontWeight: 700, marginBottom: 5, textTransform: 'uppercase' }}>
                  Téléphone
                </label>
                <input 
                  value={user?.telephone || ''} 
                  disabled 
                  style={{ ...inp, background: '#f1f5f9', cursor: 'not-allowed' }} 
                />
                <p style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>Le numéro de téléphone ne peut pas être modifié.</p>
              </div>
            )}

            {/* Photo */}
            <div>
              <label style={{ display: 'block', fontSize: 11, color: '#475569', fontWeight: 700, marginBottom: 10, textTransform: 'uppercase' }}>Photo de profil</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 68, height: 68, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: '#fff', overflow: 'hidden', flexShrink: 0, border: '3px solid #e2e8f0' }}>
                  {photoPreview
                    ? <img src={photoPreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : user?.photo_profil
                      ? <img src={`http://localhost:8000${user.photo_profil}`} alt="profil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : initiales}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#eef2ff', color: '#6366f1', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600, border: '1px solid #c7d2fe' }}>
                    📷 Choisir une photo
                    <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
                  </label>
                  {(user?.photo_profil || photoPreview) && (
                    <button 
                      type="button" 
                      onClick={handleSupprimerPhoto}
                      style={{
                        background: '#fef2f2', 
                        color: '#ef4444', 
                        border: '1px solid #fca5a5', 
                        borderRadius: 8, 
                        padding: '8px 14px', 
                        cursor: 'pointer', 
                        fontSize: 13, 
                        fontWeight: 600,
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = '#fee2e2';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = '#fef2f2';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      🗑️ Supprimer la photo
                    </button>
                  )}
                </div>
              </div>
            </div>

            <button type="submit" disabled={loadingProfil} className="btn-s" style={{ padding: '12px', fontWeight: 700, fontSize: 14, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer', boxShadow: '0 4px 16px rgba(99,102,241,0.3)' }}>
              {loadingProfil ? '⏳ Mise à jour...' : '💾 Sauvegarder les modifications'}
            </button>
          </form>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* TAB SÉCURITÉ                                                      */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'securite' && (
        <div style={{ background: '#fff', borderRadius: 16, padding: 28, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
          <h3 style={{ margin: '0 0 22px', color: '#1e293b', fontWeight: 700 }}>🔒 Changer le mot de passe</h3>
          <form onSubmit={handleChangerMdp} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { label: 'Mot de passe actuel', key: 'ancien_password', show: showAncien, toggle: () => setShowAncien(v => !v) },
              { label: 'Nouveau mot de passe', key: 'nouveau_password', show: showNouveau, toggle: () => setShowNouveau(v => !v), min: 6 },
            ].map(f => (
              <div key={f.key}>
                <label style={{ display: 'block', fontSize: 11, color: '#475569', fontWeight: 700, marginBottom: 5, textTransform: 'uppercase' }}>{f.label}</label>
                <div style={{ position: 'relative' }}>
                  <input type={f.show ? 'text' : 'password'} value={formMdp[f.key]}
                    onChange={e => setFormMdp({ ...formMdp, [f.key]: e.target.value })}
                    required minLength={f.min}
                    className="inp-p" style={{ ...inp, paddingRight: 44 }} />
                  <button type="button" onClick={f.toggle} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#94a3b8' }}>
                    {f.show ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
            ))}
            <div>
              <label style={{ display: 'block', fontSize: 11, color: '#475569', fontWeight: 700, marginBottom: 5, textTransform: 'uppercase' }}>Confirmer le nouveau mot de passe</label>
              <input type="password" value={formMdp.confirm_password}
                onChange={e => setFormMdp({ ...formMdp, confirm_password: e.target.value })}
                required className="inp-p" style={inp} />
              {formMdp.confirm_password && formMdp.nouveau_password !== formMdp.confirm_password && (
                <p style={{ margin: '4px 0 0', fontSize: 11, color: '#ef4444' }}>⚠️ Les mots de passe ne correspondent pas</p>
              )}
            </div>
            <button type="submit" disabled={loadingMdp} className="btn-s" style={{ padding: '12px', fontWeight: 700, fontSize: 14, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer', boxShadow: '0 4px 16px rgba(99,102,241,0.3)' }}>
              {loadingMdp ? '⏳ Modification...' : '🔑 Modifier le mot de passe'}
            </button>
          </form>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* TAB ABONNEMENT                                                    */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'abonnement' && (
        <div>
          {/* ── Statut actuel ──────────────────────────────────────────── */}
          {abonnement && (
            <div style={{
              background: aboActif ? 'linear-gradient(135deg,#ecfdf5,#d1fae5)' : 'linear-gradient(135deg,#fef2f2,#fee2e2)',
              border: `2px solid ${aboActif ? '#6ee7b7' : '#fca5a5'}`,
              borderRadius: 16, padding: '20px 24px', marginBottom: 24,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <span style={{ fontSize: 28 }}>{aboActif ? '✅' : '❌'}</span>
                <div>
                  <h3 style={{ margin: 0, color: aboActif ? '#065f46' : '#991b1b', fontWeight: 800, fontSize: 17 }}>
                    {aboActif ? 'Abonnement actif' : 'Abonnement expiré'}
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: 13, color: '#475569' }}>
                    Plan : <strong style={{ textTransform: 'capitalize' }}>{planNom}</strong> •
                    Type : <strong>{abonnement.type}</strong> •
                    Expire le : <strong>{new Date(abonnement.date_fin).toLocaleDateString('fr-FR')}</strong>
                  </p>
                </div>
              </div>
              {/* Barre de progression */}
              <div style={{ background: 'rgba(255,255,255,0.5)', borderRadius: 8, height: 8, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 8,
                  background: joursRest <= 7 ? '#ef4444' : aboActif ? '#10b981' : '#94a3b8',
                  width: `${Math.min((joursRest / (abonnement.type === 'mensuel' ? 30 : abonnement.type === 'essai' ? 15 : 365)) * 100, 100)}%`,
                  transition: 'width 0.4s',
                }}/>
              </div>
              <p style={{ margin: '8px 0 0', fontSize: 12, color: '#64748b' }}>
                {joursRest > 0 ? `⏳ ${joursRest} jour(s) restants` : '⛔ Abonnement terminé'}
              </p>
            </div>
          )}

          {/* ── Modale succès ───────────────────────────────────────────── */}
          {successAbo && (
            <div style={{
              background: 'linear-gradient(135deg,#ecfdf5,#d1fae5)',
              border: '2px solid #10b981', borderRadius: 16, padding: '24px 28px', marginBottom: 24,
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 52, marginBottom: 8 }}>🎉</div>
              <h3 style={{ margin: '0 0 8px', color: '#065f46', fontSize: 18, fontWeight: 800 }}>Abonnement activé avec succès !</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, margin: '16px 0', textAlign: 'left' }}>
                {[
                  ['Plan',          `${successAbo.plan_nom || 'Standard'}`],
                  ['Type',          successAbo.type],
                  ['Début',         new Date(successAbo.date_debut).toLocaleDateString('fr-FR')],
                  ['Fin',           new Date(successAbo.date_fin).toLocaleDateString('fr-FR')],
                  ['Montant',       `${parseFloat(successAbo.montant).toLocaleString()} MRU`],
                  ['Jours restants', `${successAbo.jours_restants}j`],
                ].map(([label, val]) => (
                  <div key={label} style={{ background: 'rgba(255,255,255,0.6)', borderRadius: 10, padding: '10px 14px' }}>
                    <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>{label}</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', textTransform: 'capitalize' }}>{val}</div>
                  </div>
                ))}
              </div>
              <button onClick={() => { setSuccessAbo(null); setCodeEnvoye(false); setCode(''); }}
                style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 28px', cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>
                ✅ OK
              </button>
            </div>
          )}

          {/* ── Formulaire abonnement ──────────────────────────────────── */}
          {!successAbo && (
            <div style={{ background: '#fff', borderRadius: 16, padding: 28, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
              <h3 style={{ margin: '0 0 6px', color: '#1e293b', fontWeight: 800, fontSize: 17 }}>
                {aboActif && !estEssai ? '🔄 Renouveler / Changer de plan' : '🚀 Souscrire à un abonnement'}
              </h3>
              
              {/* ── Message si abonnement actif et reste > 5 jours ── */}
              {aboActif && !peutSouscrire() && (
                <div style={{
                  background: '#fef3c7',
                  border: '1px solid #f59e0b',
                  borderRadius: 12,
                  padding: '16px 20px',
                  marginBottom: 20,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}>
                  <span style={{ fontSize: 24 }}>⏳</span>
                  <div style={{ flex: 1 }}>
                    <strong style={{ color: '#92400e' }}>Vous avez déjà un abonnement actif</strong>
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: '#78350f' }}>
                      Il vous reste <strong>{joursRest} jours</strong> d'abonnement. 
                      Vous pourrez changer de plan uniquement lorsque votre abonnement sera expiré 
                      ou dans les 5 derniers jours.
                    </p>
                  </div>
                </div>
              )}
              
              {/* ── Message si dans les 5 derniers jours ── */}
              {aboActif && joursRest <= 5 && joursRest > 0 && !estEssai && (
                <div style={{
                  background: '#fed7aa',
                  border: '1px solid #f97316',
                  borderRadius: 12,
                  padding: '16px 20px',
                  marginBottom: 20,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}>
                  <span style={{ fontSize: 24 }}>⚠️</span>
                  <div style={{ flex: 1 }}>
                    <strong style={{ color: '#9a3412' }}>Votre abonnement expire bientôt</strong>
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: '#7c2d12' }}>
                      Il vous reste <strong>{joursRest} jours</strong>. Vous pouvez dès maintenant 
                      renouveler ou changer votre plan.
                    </p>
                  </div>
                </div>
              )}
              
              <p style={{ margin: '0 0 22px', fontSize: 13, color: '#64748b' }}>
                Choisissez votre plan, entrez votre email et recevez un code de confirmation.
              </p>

              {/* Étape 1 */}
              {!codeEnvoye ? (
                <form onSubmit={demanderCode} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                  {/* Type utilisateur */}
                  <div>
                    <label style={{ display: 'block', fontSize: 11, color: '#475569', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase' }}>
                      Type de compte
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      {[
                        { val: 'standard',   icon: '👤', label: 'Standard', desc: 'Usage personnel' },
                        { val: 'entreprise', icon: '🏢', label: 'Entreprise', desc: 'Multi-utilisateurs' },
                      ].map(opt => (
                        <div key={opt.val} onClick={() => setTypeUser(opt.val)} style={{
                          border: `2px solid ${typeUser === opt.val ? '#6366f1' : '#e2e8f0'}`,
                          borderRadius: 12, padding: '14px 16px', cursor: 'pointer',
                          background: typeUser === opt.val ? '#eef2ff' : '#f8fafc',
                          transition: 'all 0.15s',
                        }}>
                          <div style={{ fontSize: 22, marginBottom: 4 }}>{opt.icon}</div>
                          <div style={{ fontWeight: 700, fontSize: 14, color: typeUser === opt.val ? '#6366f1' : '#1e293b' }}>{opt.label}</div>
                          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{opt.desc}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Type abonnement */}
                  <div>
                    <label style={{ display: 'block', fontSize: 11, color: '#475569', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase' }}>
                      Durée
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      {[
                        { val: 'mensuel', label: '🗓️ Mensuel', duree: '30 jours' },
                        { val: 'annuel',  label: '🏆 Annuel',  duree: '365 jours — 2 mois offerts' },
                      ].map(opt => (
                        <div key={opt.val} onClick={() => setTypeAbo(opt.val)} style={{
                          border: `2px solid ${typeAbo === opt.val ? '#6366f1' : '#e2e8f0'}`,
                          borderRadius: 12, padding: '14px 16px', cursor: 'pointer',
                          background: typeAbo === opt.val ? '#eef2ff' : '#f8fafc',
                          transition: 'all 0.15s',
                        }}>
                          <div style={{ fontWeight: 700, fontSize: 14, color: typeAbo === opt.val ? '#6366f1' : '#1e293b' }}>{opt.label}</div>
                          <div style={{ fontSize: 26, fontWeight: 800, color: '#1e293b', margin: '6px 0' }}>
                            {(TARIFS[typeUser]?.[opt.val] || 0).toLocaleString()} MRU
                          </div>
                          <div style={{ fontSize: 11, color: '#94a3b8' }}>{opt.duree}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label style={{ display: 'block', fontSize: 11, color: '#475569', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase' }}>
                      Email (doit correspondre à votre compte)
                    </label>
                    <input type="email" value={emailAbo} onChange={e => setEmailAbo(e.target.value)}
                      required placeholder="votre@email.com"
                      className="inp-p" style={inp} />
                    <p style={{ margin: '4px 0 0', fontSize: 11, color: '#94a3b8' }}>
                      Un code de confirmation sera envoyé à cet email
                    </p>
                  </div>

                  {/* Résumé */}
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>Récapitulatif</div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: '#1e293b', textTransform: 'capitalize' }}>
                        {typeUser} — {typeAbo}
                      </div>
                    </div>
                    <div style={{ fontWeight: 800, fontSize: 22, color: '#6366f1' }}>
                      {montantCalc.toLocaleString()} MRU
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={loadingCode || (aboActif && !peutSouscrire())} 
                    className="btn-s" 
                    style={{
                      padding: '13px', fontWeight: 700, fontSize: 15,
                      background: (aboActif && !peutSouscrire()) 
                        ? '#94a3b8' 
                        : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                      color: '#fff',
                      border: 'none', 
                      borderRadius: 12, 
                      cursor: (aboActif && !peutSouscrire()) ? 'not-allowed' : 'pointer',
                      boxShadow: (aboActif && !peutSouscrire()) 
                        ? 'none' 
                        : '0 4px 16px rgba(99,102,241,0.3)',
                      opacity: (aboActif && !peutSouscrire()) ? 0.6 : 1,
                    }}>
                    {loadingCode 
                      ? '⏳ Envoi du code...' 
                      : (aboActif && !peutSouscrire()) 
                        ? '🔒 Non disponible pour le moment' 
                        : '📧 Recevoir le code de confirmation'}
                  </button>
                </form>
              ) : (
                /* Étape 2 : Saisie du code */
                <form onSubmit={confirmerAbonnement} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, padding: '14px 18px', fontSize: 13, color: '#1e40af' }}>
                    📧 Code envoyé à <strong>{emailAbo}</strong>. Vérifiez votre boîte mail (et les spams).
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 11, color: '#475569', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase' }}>
                      Code de confirmation (6 chiffres)
                    </label>
                    <input type="text" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      required maxLength={6} placeholder="000000"
                      style={{ ...inp, textAlign: 'center', fontSize: 28, fontWeight: 800, letterSpacing: 10, color: '#6366f1' }} />
                    <p style={{ margin: '4px 0 0', fontSize: 11, color: '#94a3b8', textAlign: 'center' }}>
                      Le code expire dans 5 minutes
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: 10 }}>
                    <button 
                      type="submit" 
                      disabled={loadingAbo || code.length !== 6 || (aboActif && !peutSouscrire())} 
                      className="btn-s" 
                      style={{
                        flex: 2, padding: '13px', fontWeight: 700, fontSize: 15,
                        background: (aboActif && !peutSouscrire()) ? '#94a3b8' : 'linear-gradient(135deg,#10b981,#059669)',
                        color: '#fff',
                        border: 'none', 
                        borderRadius: 12, 
                        cursor: (aboActif && !peutSouscrire()) ? 'not-allowed' : 'pointer',
                        boxShadow: (aboActif && !peutSouscrire()) ? 'none' : '0 4px 16px rgba(16,185,129,0.3)',
                        opacity: (loadingAbo || code.length !== 6 || (aboActif && !peutSouscrire())) ? 0.6 : 1,
                      }}>
                      {loadingAbo ? '⏳ Activation...' : `✅ Confirmer — ${montantCalc.toLocaleString()} MRU`}
                    </button>
                    <button type="button" onClick={() => { setCodeEnvoye(false); setCode(''); }} style={{
                      flex: 1, padding: '13px', background: '#f1f5f9', border: '1px solid #e2e8f0',
                      borderRadius: 12, cursor: 'pointer', fontSize: 13, color: '#64748b', fontWeight: 600,
                    }}>
                      ← Retour
                    </button>
                  </div>

                  <button type="button" onClick={demanderCode} disabled={loadingCode} style={{
                    background: 'none', border: 'none', cursor: 'pointer', color: '#6366f1',
                    fontSize: 13, fontWeight: 600, textDecoration: 'underline',
                  }}>
                    Renvoyer un nouveau code
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* TAB CONTACT                                                       */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'contact' && (
        <div style={{ background: '#fff', borderRadius: 16, padding: 28, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
          <h3 style={{ margin: '0 0 8px', color: '#1e293b', fontWeight: 700 }}>📬 Contacter le support</h3>
          <p style={{ margin: '0 0 20px', color: '#64748b', fontSize: 14 }}>Une question ? Un problème ? Écrivez-nous.</p>
          <form onSubmit={handleContact} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <textarea value={formContact} onChange={e => setFormContact(e.target.value)}
              placeholder="Décrivez votre problème ou question..." rows={5} required minLength={10}
              className="inp-p" style={{ ...inp, resize: 'vertical' }} />
            <button type="submit" disabled={loadingContact} className="btn-s" style={{ padding: '12px', fontWeight: 700, fontSize: 14, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer', boxShadow: '0 4px 16px rgba(99,102,241,0.3)' }}>
              {loadingContact ? '⏳ Envoi...' : '📤 Envoyer le message'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}