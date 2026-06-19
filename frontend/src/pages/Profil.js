// frontend/src/pages/Profile.js
import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

// ── Tarifs selon type utilisateur ────────────────────────────────────────────
const TARIFS = {
  standard:   { mensuel: 1500,  annuel: 15000 },
  entreprise: { mensuel: 2500,  annuel: 25000 },
};

// ── DESIGN TOKENS ─────────────────────────────────────────────────────────────
const T = {
  primary:     '#6366f1',
  primaryDark: '#4f46e5',
  primarySoft: '#e0e7ff',
  success:     '#10b981',
  successSoft: '#d1fae5',
  danger:      '#ef4444',
  dangerSoft:  '#fee2e2',
  warning:     '#f59e0b',
  warningSoft: '#fef3c7',
  text:        '#0f172a',
  textMid:     '#475569',
  textLight:   '#94a3b8',
  border:      '#e2e8f0',
  bg:          '#f8fafc',
  white:       '#ffffff',
  radius:      14,
  radiusSm:    8,
};

export default function Profil() {
  const { user, abonnement, deconnexion, chargerAbonnement, mettreAJourUser } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('informations');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // ── Bannières de message (remplacent les toasts) ─────────────────────────
  // Chaque section a sa propre bannière : { type: 'success' | 'error', text }
  const [msgProfil, setMsgProfil] = useState(null);
  const [msgSecurite, setMsgSecurite] = useState(null);
  const [msgAbonnement, setMsgAbonnement] = useState(null);
  const [msgContact, setMsgContact] = useState(null);

  const showMsg = (setter, type, text, duree = 4000) => {
    setter({ type, text });
    window.clearTimeout(showMsg._t);
    showMsg._t = window.setTimeout(() => setter(null), duree);
  };

  // ── Boîtes de confirmation inline (remplacent window.confirm) ────────────
  const [confirmSupprimerPhoto, setConfirmSupprimerPhoto] = useState(false);
  const [confirmDeconnexion, setConfirmDeconnexion] = useState(false);

  // ── Profil ────────────────────────────────────────────────────────────────
  const [formProfil, setFormProfil] = useState({ nom: '', prenom: '', supprimer_photo: false });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [loadingProfil, setLoadingProfil] = useState(false);
  const [photoKey, setPhotoKey] = useState(Date.now());

  // ── Sécurité ──────────────────────────────────────────────────────────────
  const [formMdp, setFormMdp] = useState({ ancien_password: '', nouveau_password: '', confirm_password: '' });
  const [loadingMdp, setLoadingMdp] = useState(false);
  const [showAncien, setShowAncien] = useState(false);
  const [showNouveau, setShowNouveau] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ── Abonnement ────────────────────────────────────────────────────────────
  const [typeAbo, setTypeAbo] = useState('mensuel');
  const [typeUser, setTypeUser] = useState('standard');
  const [emailAbo, setEmailAbo] = useState('');
  const [loadingCode, setLoadingCode] = useState(false);
  const [codeEnvoye, setCodeEnvoye] = useState(false);
  const [code, setCode] = useState('');
  const [loadingAbo, setLoadingAbo] = useState(false);
  const [successAbo, setSuccessAbo] = useState(null);

  // ── Contact ───────────────────────────────────────────────────────────────
  const [formContact, setFormContact] = useState('');
  const [loadingContact, setLoadingContact] = useState(false);

  useEffect(() => {
    if (user) {
      setFormProfil({ nom: user.nom || '', prenom: user.prenom || '', supprimer_photo: false });
      setEmailAbo(user.email || '');
    }
  }, [user]);

  const montantCalc = TARIFS[typeUser]?.[typeAbo] || 500;
  const estCompteGoogle = user?.est_compte_google || (user?.telephone && user.telephone.startsWith('+222_g_'));
  const aboActif  = abonnement?.est_actif;
  const planNom   = abonnement?.plan_nom || 'essai';
  const estEssai  = planNom === 'essai';
  const joursRest = abonnement?.jours_restants ?? 0;

  const peutSouscrire = () => {
    if (!aboActif) return true;
    if (estEssai) return true;
    return joursRest <= 5;
  };

  const getIdLabel = () => (user?.document_type === 'passport' ? 'Numéro de passeport' : 'NNI');

  const initiales = user
    ? `${(user.prenom || '')[0] || ''}${(user.nom || '')[0] || ''}`.toUpperCase()
    : '?';

  const getPhotoUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return `http://localhost:8000${path}`;
  };

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSauvegarderProfil = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setLoadingProfil(true);
    try {
      const fd = new FormData();
      fd.append('nom', formProfil.nom);
      fd.append('prenom', formProfil.prenom);
      if (photoFile) fd.append('photo_profil', photoFile);
      if (formProfil.supprimer_photo) fd.append('supprimer_photo', 'true');
      const res = await api.patch('/comptes/profil/', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      mettreAJourUser(res.data);
      setPhotoFile(null);
      setPhotoPreview(null);
      setPhotoKey(Date.now());
      setFormProfil(prev => ({ ...prev, supprimer_photo: false }));
      showMsg(setMsgProfil, 'success', 'Photo mise à jour !');
    } catch (err) {
      showMsg(setMsgProfil, 'error', err.response?.data?.detail || 'Erreur lors de la mise à jour.');
    } finally {
      setLoadingProfil(false);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { showMsg(setMsgProfil, 'error', 'Photo max 5 Mo.'); return; }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setFormProfil(p => ({ ...p, supprimer_photo: false }));
  };

  const demanderSuppressionPhoto = () => {
    setConfirmSupprimerPhoto(true);
  };

  const annulerSuppressionPhoto = () => {
    setConfirmSupprimerPhoto(false);
  };

  const handleSupprimerPhoto = async () => {
    setConfirmSupprimerPhoto(false);
    setLoadingProfil(true);
    try {
      const fd = new FormData();
      fd.append('nom', formProfil.nom);
      fd.append('prenom', formProfil.prenom);
      fd.append('supprimer_photo', 'true');
      const res = await api.patch('/comptes/profil/', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      mettreAJourUser(res.data);
      setPhotoFile(null);
      setPhotoPreview(null);
      setPhotoKey(Date.now());
      setFormProfil(prev => ({ ...prev, supprimer_photo: false }));
      showMsg(setMsgProfil, 'success', 'Photo supprimée avec succès !');
    } catch {
      showMsg(setMsgProfil, 'error', 'Erreur lors de la suppression');
    } finally {
      setLoadingProfil(false);
    }
  };

  const handleChangerMdp = async (e) => {
    e.preventDefault();
    if (formMdp.nouveau_password !== formMdp.confirm_password)
      return showMsg(setMsgSecurite, 'error', 'Les mots de passe ne correspondent pas.');
    setLoadingMdp(true);
    try {
      await api.post('/comptes/changer-mot-de-passe/', {
        ancien_password: formMdp.ancien_password,
        nouveau_password: formMdp.nouveau_password,
      });
      showMsg(setMsgSecurite, 'success', 'Mot de passe modifié !');
      setFormMdp({ ancien_password: '', nouveau_password: '', confirm_password: '' });
    } catch (err) {
      showMsg(setMsgSecurite, 'error', err.response?.data?.error || 'Mot de passe actuel incorrect.');
    } finally {
      setLoadingMdp(false);
    }
  };

  const demanderCode = async (e) => {
    e.preventDefault();
    if (!emailAbo) return showMsg(setMsgAbonnement, 'error', "L'email est obligatoire.");
    if (!peutSouscrire()) { showMsg(setMsgAbonnement, 'error', `Abonnement actif. Il vous reste ${joursRest} jours.`); return; }
    setLoadingCode(true);
    try {
      await api.post('/abonnements/demander-code/', { email: emailAbo, type_abonnement: typeAbo, type_utilisateur: typeUser });
      showMsg(setMsgAbonnement, 'success', `Code envoyé à ${emailAbo} !`);
      setCodeEnvoye(true);
    } catch (err) {
      showMsg(setMsgAbonnement, 'error', err.response?.data?.error || "Erreur lors de l'envoi du code.");
    } finally {
      setLoadingCode(false);
    }
  };

  const confirmerAbonnement = async (e) => {
    e.preventDefault();
    if (!code) return showMsg(setMsgAbonnement, 'error', 'Entrez le code reçu par email.');
    if (!peutSouscrire()) { showMsg(setMsgAbonnement, 'error', `Abonnement actif. Il vous reste ${joursRest} jours.`); return; }
    setLoadingAbo(true);
    try {
      const res = await api.post('/abonnements/souscrire/', {
        email: emailAbo, code_confirmation: code, type_abonnement: typeAbo, type_utilisateur: typeUser,
      });
      setSuccessAbo(res.data.abonnement);
      await chargerAbonnement();
      showMsg(setMsgAbonnement, 'success', 'Abonnement activé avec succès !');
    } catch (err) {
      showMsg(setMsgAbonnement, 'error', err.response?.data?.error || 'Code invalide ou expiré.');
    } finally {
      setLoadingAbo(false);
    }
  };

  const handleContact = async (e) => {
    e.preventDefault();
    setLoadingContact(true);
    try {
      await api.post('/comptes/contact/', { message: formContact });
      showMsg(setMsgContact, 'success', 'Message envoyé !');
      setFormContact('');
    } catch {
      showMsg(setMsgContact, 'error', "Erreur lors de l'envoi.");
    } finally {
      setLoadingContact(false);
    }
  };

  const demanderDeconnexion = () => {
    setConfirmDeconnexion(true);
  };

  const annulerDeconnexion = () => {
    setConfirmDeconnexion(false);
  };

  const handleDeconnexion = async () => {
    setConfirmDeconnexion(false);
    await deconnexion();
    navigate('/connexion');
  };

  const tabs = [
    { id: 'informations', label: 'Infos', bxIcon: 'bx-user' },
    { id: 'securite',     label: 'Sécurité', bxIcon: 'bx-lock-alt' },
    { id: 'abonnement',   label: 'Abonnement', bxIcon: 'bx-crown' },
    { id: 'contact',      label: 'Contact', bxIcon: 'bx-support' },
  ];

  // Styles responsifs - tailles réduites pour mobile
  const cardStyle = {
    background: T.white,
    borderRadius: T.radius,
    boxShadow: '0 1px 8px rgba(0,0,0,0.04)',
    border: `1px solid ${T.border}`,
    overflow: 'hidden',
  };

  const cardPadding = isMobile ? '16px' : '28px';
  const avatarSize = isMobile ? 52 : 72;
  const avatarFontSize = isMobile ? 18 : 24;
  const titleSize = isMobile ? 15 : 18;
  const sectionIconSize = isMobile ? 28 : 34;

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f5f7fb',
      padding: isMobile ? '12px' : '24px',
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    }}>
      <link rel="stylesheet" href="https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css" />
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Outfit:wght@600;700;800&display=swap" rel="stylesheet" />

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes bannerIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .prof-fade { animation: fadeUp 0.3s ease both; }
        .msg-banner { animation: bannerIn 0.25s ease both; }
        .prof-input:focus {
          border-color: ${T.primary} !important;
          background: ${T.white} !important;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.1) !important;
          outline: none;
        }
        .prof-input::placeholder { color: #cbd5e1; }
        .btn-hover { transition: all 0.2s; }
        .btn-hover:active:not(:disabled) { transform: scale(0.98); }
        @media (max-width: 480px) {
          .grid-2 { grid-template-columns: 1fr !important; gap: 12px !important; }
          .plan-grid { grid-template-columns: 1fr !important; gap: 10px !important; }
        }
      `}</style>

      <div style={{ maxWidth: 960, margin: '0 auto' }}>

        {/* ═══════════════════════════════════════════════════════════════════
            HEADER CARTE PROFIL - Version compacte mobile
        ════════════════════════════════════════════════════════════════════ */}
        <div style={{
          ...cardStyle,
          padding: isMobile ? '14px' : '20px 24px',
          marginBottom: 16,
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}>
            {/* Avatar + Infos */}
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 12 : 18, flex: 1, minWidth: 0 }}>
              <div style={{
                width: avatarSize,
                height: avatarSize,
                borderRadius: '50%',
                flexShrink: 0,
                background: `linear-gradient(135deg, ${T.primary}, #8b5cf6)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: avatarFontSize,
                fontWeight: 800,
                color: T.white,
                overflow: 'hidden',
                boxShadow: '0 2px 10px rgba(99,102,241,0.2)',
                border: `2px solid ${T.white}`,
              }}>
                {photoPreview
                  ? <img src={photoPreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : user?.photo_profil
                    ? <img src={getPhotoUrl(user.photo_profil) + '?v=' + photoKey} alt="profil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : initiales}
              </div>

              <div style={{ minWidth: 0, flex: 1 }}>
                <h2 style={{
                  margin: 0,
                  fontSize: isMobile ? 15 : 20,
                  fontWeight: 800,
                  color: T.text,
                  fontFamily: "'Outfit', sans-serif",
                  letterSpacing: '-0.2px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {user?.prenom} {user?.nom}
                </h2>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                  {!estCompteGoogle ? (
                    <span style={{ fontSize: 10, color: T.textMid, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                      <i className='bx bx-phone' style={{ fontSize: 11 }} />
                      {user?.telephone}
                    </span>
                  ) : (
                    <span style={{ fontSize: 10, color: T.textMid, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                      <i className='bx bxl-google' style={{ fontSize: 11 }} />
                      Google
                    </span>
                  )}
                  {user?.email && (
                    <span style={{ fontSize: 10, color: T.textLight, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                      <i className='bx bx-envelope' style={{ fontSize: 11 }} />
                      {user.email.length > 20 ? user.email.substring(0, 18) + '..' : user.email}
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                  <span style={{
                    background: T.primarySoft,
                    borderRadius: 12,
                    padding: '2px 8px',
                    fontSize: 9,
                    color: T.primary,
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 3,
                  }}>
                    <i className='bx bx-crown' style={{ fontSize: 9 }} />
                    {planNom}
                  </span>
                  {aboActif ? (
                    <span style={{
                      background: T.successSoft,
                      borderRadius: 12,
                      padding: '2px 8px',
                      fontSize: 9,
                      color: '#059669',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 3,
                    }}>
                      <i className='bx bx-check-circle' style={{ fontSize: 9 }} />
                      Actif — {joursRest}j
                    </span>
                  ) : (
                    <span style={{
                      background: T.dangerSoft,
                      borderRadius: 12,
                      padding: '2px 8px',
                      fontSize: 9,
                      color: T.danger,
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 3,
                    }}>
                      <i className='bx bx-x-circle' style={{ fontSize: 9 }} />
                      Expiré
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Déconnexion - icône seulement sur mobile */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
              <button onClick={demanderDeconnexion} style={{
                background: T.dangerSoft,
                color: T.danger,
                border: `1px solid #fecaca`,
                borderRadius: 30,
                padding: isMobile ? '6px 12px' : '8px 20px',
                cursor: 'pointer',
                fontSize: isMobile ? 11 : 13,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontFamily: "'DM Sans', sans-serif",
              }}>
                <i className='bx bx-log-out' style={{ fontSize: isMobile ? 14 : 16 }} />
                {!isMobile && 'Déconnexion'}
              </button>

              {/* Boîte de confirmation inline — remplace window.confirm */}
              {confirmDeconnexion && (
                <div className="msg-banner" style={{
                  background: T.dangerSoft,
                  border: `1px solid #fecaca`,
                  borderRadius: T.radiusSm,
                  padding: '10px 14px',
                  maxWidth: 280,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}>
                  <div style={{ fontSize: 11, color: '#991b1b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <i className='bx bx-error-circle' style={{ fontSize: 14 }} />
                    Voulez-vous vous déconnecter ?
                  </div>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                    <button onClick={annulerDeconnexion} style={{
                      background: T.white, border: `1px solid ${T.border}`, color: T.textMid,
                      borderRadius: 20, padding: '5px 12px', fontSize: 10, fontWeight: 700, cursor: 'pointer',
                    }}>Annuler</button>
                    <button onClick={handleDeconnexion} style={{
                      background: T.danger, border: 'none', color: T.white,
                      borderRadius: 20, padding: '5px 12px', fontSize: 10, fontWeight: 700, cursor: 'pointer',
                    }}>Confirmer</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            ONGLETS (TABS) - Version mobile compacte
        ════════════════════════════════════════════════════════════════════ */}
        <div style={{
          display: 'flex',
          gap: isMobile ? 6 : 8,
          marginBottom: 16,
          overflowX: 'auto',
          paddingBottom: 4,
          scrollbarWidth: 'thin',
        }}>
          {tabs.map(tab => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: isMobile ? '8px 14px' : '10px 22px',
                  borderRadius: 30,
                  border: 'none',
                  fontSize: isMobile ? 11 : 13,
                  fontWeight: 700,
                  background: active ? T.primary : T.white,
                  color: active ? T.white : T.textMid,
                  display: 'flex',
                  alignItems: 'center',
                  gap: isMobile ? 5 : 7,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  boxShadow: active ? '0 2px 8px rgba(99,102,241,0.25)' : '0 1px 3px rgba(0,0,0,0.04)',
                  fontFamily: "'DM Sans', sans-serif",
                }}>
                <i className={`bx ${tab.bxIcon}`} style={{ fontSize: isMobile ? 13 : 15 }} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            TAB — INFORMATIONS (version compacte)
        ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'informations' && (
          <div className="prof-fade" style={{ ...cardStyle, padding: cardPadding }}>

            {/* Bannière de message — remplace toast pour la section Profil */}
            {msgProfil && (
              <div className="msg-banner" style={{
                marginBottom: 16,
                padding: '10px 14px',
                borderRadius: T.radiusSm,
                background: msgProfil.type === 'success' ? T.successSoft : T.dangerSoft,
                border: `1px solid ${msgProfil.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
                color: msgProfil.type === 'success' ? '#065f46' : '#991b1b',
                fontSize: isMobile ? 11 : 12,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}>
                <i className={msgProfil.type === 'success' ? 'bx bx-check-circle' : 'bx bx-error-circle'} style={{ fontSize: 15 }} />
                {msgProfil.text}
              </div>
            )}

            {/* Section Photo */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <div style={{
                  width: sectionIconSize,
                  height: sectionIconSize,
                  borderRadius: 8,
                  background: 'linear-gradient(135deg, #ede9fe, #c4b5fd)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <i className='bx bx-image' style={{ fontSize: isMobile ? 14 : 16, color: '#6366f1' }} />
                </div>
                <h3 style={{
                  margin: 0,
                  fontSize: titleSize,
                  fontWeight: 800,
                  color: T.text,
                  fontFamily: "'Outfit', sans-serif",
                }}>
                  Photo de profil
                </h3>
              </div>

              <div style={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                alignItems: isMobile ? 'center' : 'flex-start',
                gap: isMobile ? 14 : 20,
              }}>
                <div style={{
                  width: isMobile ? 64 : 80,
                  height: isMobile ? 64 : 80,
                  borderRadius: '50%',
                  flexShrink: 0,
                  overflow: 'hidden',
                  background: `linear-gradient(135deg, ${T.primary}, #8b5cf6)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: isMobile ? 22 : 28,
                  fontWeight: 800,
                  color: T.white,
                  border: `2px solid ${T.border}`,
                }}>
                  {photoPreview
                    ? <img src={photoPreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : user?.photo_profil
                      ? <img src={getPhotoUrl(user.photo_profil) + '?v=' + photoKey} alt="profil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : initiales}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <label style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      background: T.primary,
                      color: T.white,
                      borderRadius: T.radiusSm,
                      padding: isMobile ? '6px 12px' : '8px 18px',
                      cursor: 'pointer',
                      fontSize: isMobile ? 11 : 13,
                      fontWeight: 700,
                      fontFamily: "'DM Sans', sans-serif",
                    }}>
                      <i className='bx bx-cloud-upload' style={{ fontSize: isMobile ? 13 : 15 }} />
                      {photoPreview ? 'Changer' : 'Changer'}
                      <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
                    </label>

                    {(user?.photo_profil || photoPreview) && (
                      <button onClick={demanderSuppressionPhoto} style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        background: T.dangerSoft,
                        color: T.danger,
                        border: `1px solid #fecaca`,
                        borderRadius: T.radiusSm,
                        padding: isMobile ? '6px 12px' : '8px 18px',
                        cursor: 'pointer',
                        fontSize: isMobile ? 11 : 13,
                        fontWeight: 700,
                      }}>
                        <i className='bx bx-trash' style={{ fontSize: isMobile ? 13 : 15 }} />
                        Supprimer
                      </button>
                    )}
                  </div>

                  {/* Boîte de confirmation inline — remplace window.confirm */}
                  {confirmSupprimerPhoto && (
                    <div className="msg-banner" style={{
                      background: T.dangerSoft,
                      border: `1px solid #fecaca`,
                      borderRadius: T.radiusSm,
                      padding: '10px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                    }}>
                      <div style={{ fontSize: 11, color: '#991b1b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <i className='bx bx-error-circle' style={{ fontSize: 14 }} />
                        Voulez-vous vraiment supprimer votre photo de profil ?
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={annulerSuppressionPhoto} style={{
                          background: T.white, border: `1px solid ${T.border}`, color: T.textMid,
                          borderRadius: 20, padding: '5px 12px', fontSize: 10, fontWeight: 700, cursor: 'pointer',
                        }}>Annuler</button>
                        <button onClick={handleSupprimerPhoto} style={{
                          background: T.danger, border: 'none', color: T.white,
                          borderRadius: 20, padding: '5px 12px', fontSize: 10, fontWeight: 700, cursor: 'pointer',
                        }}>Confirmer</button>
                      </div>
                    </div>
                  )}

                  {photoFile && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <button
                        onClick={handleSauvegarderProfil}
                        disabled={loadingProfil}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          background: loadingProfil ? T.textLight : 'linear-gradient(135deg, #10b981, #059669)',
                          color: T.white,
                          border: 'none',
                          borderRadius: T.radiusSm,
                          padding: isMobile ? '6px 12px' : '8px 18px',
                          cursor: loadingProfil ? 'not-allowed' : 'pointer',
                          fontSize: isMobile ? 11 : 13,
                          fontWeight: 700,
                          opacity: loadingProfil ? 0.7 : 1,
                        }}>
                        {loadingProfil ? <><Spinner /> Sauvegarde...</> : <><i className='bx bx-save' style={{ fontSize: isMobile ? 13 : 15 }} /> Sauvegarder</>}
                      </button>
                      <button
                        onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: T.textLight,
                          cursor: 'pointer',
                          fontSize: isMobile ? 10 : 11,
                          fontWeight: 600,
                        }}>
                        <i className='bx bx-x' style={{ fontSize: 13 }} /> Annuler
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div style={{ height: 1, background: '#f1f5f9', margin: '20px 0' }} />

            {/* Section Données d'identité */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <div style={{
                  width: sectionIconSize,
                  height: sectionIconSize,
                  borderRadius: 8,
                  background: 'linear-gradient(135deg, #ede9fe, #c4b5fd)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <i className='bx bx-id-card' style={{ fontSize: isMobile ? 14 : 16, color: '#6366f1' }} />
                </div>
                <h3 style={{
                  margin: 0,
                  fontSize: titleSize,
                  fontWeight: 800,
                  color: T.text,
                  fontFamily: "'Outfit', sans-serif",
                }}>
                  Données d'identité
                </h3>
              </div>

              {/* Statut vérification */}
              <div style={{
                marginBottom: 16,
                padding: isMobile ? '10px 12px' : '14px 18px',
                borderRadius: 12,
                background: user?.is_kyc_verified ? '#f0fdf4' : '#fffbeb',
                border: `1px solid ${user?.is_kyc_verified ? '#bbf7d0' : '#fde68a'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 10,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: user?.is_kyc_verified ? '#dcfce7' : '#fef9c3',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <i className={user?.is_kyc_verified ? 'bx bx-shield-quarter' : 'bx bx-shield-x'}
                      style={{ fontSize: 18, color: user?.is_kyc_verified ? '#059669' : '#b45309' }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: isMobile ? 12 : 13, color: user?.is_kyc_verified ? '#065f46' : '#92400e' }}>
                      {user?.is_kyc_verified ? 'Identité vérifiée' : 'Vérification en attente'}
                    </div>
                    <div style={{ fontSize: 9, color: user?.is_kyc_verified ? '#047857' : '#b45309', marginTop: 2 }}>
                      {user?.is_kyc_verified ? 'Confirmée' : 'Vérifiez votre identité'}
                    </div>
                  </div>
                </div>
                {!user?.is_kyc_verified && (
                  <button onClick={() => navigate('/kyc')} style={{
                    background: `linear-gradient(135deg, ${T.primary}, #8b5cf6)`,
                    color: T.white,
                    border: 'none',
                    borderRadius: 30,
                    padding: isMobile ? '6px 14px' : '8px 20px',
                    fontWeight: 700,
                    fontSize: isMobile ? 10 : 12,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                  }}>
                    <i className='bx bx-scan' style={{ fontSize: isMobile ? 12 : 14 }} />
                    Vérifier
                  </button>
                )}
              </div>

              {/* Données KYC */}
              {user?.is_kyc_verified && (
                <>
                  <div style={{
                    background: '#f8fafc',
                    borderRadius: 12,
                    border: `1px solid ${T.border}`,
                    overflow: 'hidden',
                    marginBottom: 12,
                  }}>
                    <div style={{
                      padding: '7px 12px',
                      background: '#f1f5f9',
                      borderBottom: `1px solid ${T.border}`,
                    }}>
                      <span style={{ fontSize: 9, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        IDENTITÉ
                      </span>
                    </div>
                    <div style={{ padding: isMobile ? '12px' : '16px' }}>
                      <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: isMobile ? 10 : 16 }}>
                        <div>
                          <div style={{ fontSize: 9, color: T.textLight, fontWeight: 600, marginBottom: 3 }}>{getIdLabel()}</div>
                          <div style={{ fontSize: isMobile ? 12 : 13, fontWeight: 700, color: T.text }}>{user?.nni || '—'}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 9, color: T.textLight, fontWeight: 600, marginBottom: 3 }}>Nom</div>
                          <div style={{ fontSize: isMobile ? 12 : 13, fontWeight: 700, color: T.text }}>{user?.nom_fr || user?.nom || '—'}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 9, color: T.textLight, fontWeight: 600, marginBottom: 3 }}>Prénom</div>
                          <div style={{ fontSize: isMobile ? 12 : 13, fontWeight: 700, color: T.text }}>{user?.prenom_fr || user?.prenom || '—'}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 9, color: T.textLight, fontWeight: 600, marginBottom: 3 }}>Nom du père</div>
                          <div style={{ fontSize: isMobile ? 12 : 13, fontWeight: 700, color: T.text }}>{user?.father_name || '—'}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{
                    background: '#f8fafc',
                    borderRadius: 12,
                    border: `1px solid ${T.border}`,
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      padding: '7px 12px',
                      background: '#f1f5f9',
                      borderBottom: `1px solid ${T.border}`,
                    }}>
                      <span style={{ fontSize: 9, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        ÉTAT CIVIL
                      </span>
                    </div>
                    <div style={{ padding: isMobile ? '12px' : '16px' }}>
                      <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: isMobile ? 10 : 16 }}>
                        <div>
                          <div style={{ fontSize: 9, color: T.textLight, fontWeight: 600, marginBottom: 3 }}>Date de naissance</div>
                          <div style={{ fontSize: isMobile ? 12 : 13, fontWeight: 700, color: T.text }}>{user?.birth_date ? new Date(user.birth_date).toLocaleDateString('fr-FR') : '—'}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 9, color: T.textLight, fontWeight: 600, marginBottom: 3 }}>Lieu de naissance</div>
                          <div style={{ fontSize: isMobile ? 12 : 13, fontWeight: 700, color: T.text }}>{user?.birth_place || '—'}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 9, color: T.textLight, fontWeight: 600, marginBottom: 3 }}>Sexe</div>
                          <div style={{ fontSize: isMobile ? 12 : 13, fontWeight: 700, color: T.text }}>{user?.gender === 'M' ? 'Masculin' : user?.gender === 'F' ? 'Féminin' : user?.gender || '—'}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 9, color: T.textLight, fontWeight: 600, marginBottom: 3 }}>Nationalité</div>
                          <div style={{ fontSize: isMobile ? 12 : 13, fontWeight: 700, color: T.text }}>{user?.nationality || '—'}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {!user?.is_kyc_verified && (
                <div style={{
                  background: '#fefce8',
                  borderRadius: 12,
                  padding: isMobile ? '14px' : '18px',
                  textAlign: 'center',
                  border: '1px solid #fef08a',
                }}>
                  <i className='bx bx-info-circle' style={{ fontSize: 24, color: '#ca8a04', marginBottom: 6, display: 'block' }} />
                  <p style={{ margin: 0, fontSize: isMobile ? 11 : 12, color: '#854d0e' }}>
                    Aucune donnée disponible. Vérifiez votre identité.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            TAB — SÉCURITÉ (version compacte)
        ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'securite' && (
          <div className="prof-fade" style={{ ...cardStyle, padding: cardPadding }}>

            {/* Bannière de message — remplace toast pour la section Sécurité */}
            {msgSecurite && (
              <div className="msg-banner" style={{
                marginBottom: 16,
                padding: '10px 14px',
                borderRadius: T.radiusSm,
                background: msgSecurite.type === 'success' ? T.successSoft : T.dangerSoft,
                border: `1px solid ${msgSecurite.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
                color: msgSecurite.type === 'success' ? '#065f46' : '#991b1b',
                fontSize: isMobile ? 11 : 12,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}>
                <i className={msgSecurite.type === 'success' ? 'bx bx-check-circle' : 'bx bx-error-circle'} style={{ fontSize: 15 }} />
                {msgSecurite.text}
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
              <div style={{
                width: sectionIconSize,
                height: sectionIconSize,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #ede9fe, #c4b5fd)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <i className='bx bx-lock-alt' style={{ fontSize: isMobile ? 14 : 16, color: '#6366f1' }} />
              </div>
              <h3 style={{
                margin: 0,
                fontSize: titleSize,
                fontWeight: 800,
                color: T.text,
                fontFamily: "'Outfit', sans-serif",
              }}>
                Changer le mot de passe
              </h3>
            </div>

            <form onSubmit={handleChangerMdp} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: T.textMid, marginBottom: 5 }}>Mot de passe actuel</label>
                <div style={{ position: 'relative' }}>
                  <i className='bx bx-lock-alt' style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: '#94a3b8' }} />
                  <input
                    type={showAncien ? 'text' : 'password'}
                    value={formMdp.ancien_password}
                    onChange={e => setFormMdp({ ...formMdp, ancien_password: e.target.value })}
                    required
                    className="prof-input"
                    style={{
                      width: '100%',
                      padding: isMobile ? '9px 30px 9px 32px' : '10px 40px 10px 36px',
                      borderRadius: T.radiusSm,
                      border: `1.5px solid ${T.border}`,
                      background: T.bg,
                      fontSize: isMobile ? 12 : 13,
                    }}
                  />
                  <button type="button" onClick={() => setShowAncien(!showAncien)} style={{
                    position: 'absolute',
                    right: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#94a3b8',
                  }}>
                    <i className={showAncien ? 'bx bx-hide' : 'bx bx-show'} style={{ fontSize: 16 }} />
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: T.textMid, marginBottom: 5 }}>Nouveau mot de passe</label>
                <div style={{ position: 'relative' }}>
                  <i className='bx bx-lock-alt' style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: '#94a3b8' }} />
                  <input
                    type={showNouveau ? 'text' : 'password'}
                    value={formMdp.nouveau_password}
                    onChange={e => setFormMdp({ ...formMdp, nouveau_password: e.target.value })}
                    required
                    minLength={6}
                    className="prof-input"
                    style={{
                      width: '100%',
                      padding: isMobile ? '9px 30px 9px 32px' : '10px 40px 10px 36px',
                      borderRadius: T.radiusSm,
                      border: `1.5px solid ${T.border}`,
                      background: T.bg,
                      fontSize: isMobile ? 12 : 13,
                    }}
                  />
                  <button type="button" onClick={() => setShowNouveau(!showNouveau)} style={{
                    position: 'absolute',
                    right: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#94a3b8',
                  }}>
                    <i className={showNouveau ? 'bx bx-hide' : 'bx bx-show'} style={{ fontSize: 16 }} />
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: T.textMid, marginBottom: 5 }}>Confirmer</label>
                <div style={{ position: 'relative' }}>
                  <i className='bx bx-lock-alt' style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: '#94a3b8' }} />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={formMdp.confirm_password}
                    onChange={e => setFormMdp({ ...formMdp, confirm_password: e.target.value })}
                    required
                    className="prof-input"
                    style={{
                      width: '100%',
                      padding: isMobile ? '9px 30px 9px 32px' : '10px 40px 10px 36px',
                      borderRadius: T.radiusSm,
                      border: `1.5px solid ${formMdp.confirm_password && formMdp.nouveau_password !== formMdp.confirm_password ? T.danger : T.border}`,
                      background: T.bg,
                      fontSize: isMobile ? 12 : 13,
                    }}
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={{
                    position: 'absolute',
                    right: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#94a3b8',
                  }}>
                    <i className={showConfirm ? 'bx bx-hide' : 'bx bx-show'} style={{ fontSize: 16 }} />
                  </button>
                </div>
                {formMdp.confirm_password && formMdp.nouveau_password !== formMdp.confirm_password && (
                  <p style={{ margin: '5px 0 0', fontSize: 9, color: T.danger, display: 'flex', alignItems: 'center', gap: 3 }}>
                    <i className='bx bx-error-circle' style={{ fontSize: 11 }} />
                    Les mots de passe ne correspondent pas
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loadingMdp}
                className="btn-hover"
                style={{
                  width: '100%',
                  padding: isMobile ? '10px' : '12px',
                  background: loadingMdp ? T.textLight : `linear-gradient(135deg, ${T.primary}, #8b5cf6)`,
                  color: T.white,
                  border: 'none',
                  borderRadius: T.radiusSm,
                  fontWeight: 700,
                  fontSize: isMobile ? 12 : 13,
                  cursor: loadingMdp ? 'not-allowed' : 'pointer',
                  opacity: loadingMdp ? 0.65 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  fontFamily: "'DM Sans', sans-serif",
                }}>
                {loadingMdp ? <><Spinner /> Modification...</> : <><i className='bx bx-key' style={{ fontSize: 15 }} /> Modifier</>}
              </button>
            </form>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            TAB — ABONNEMENT (version compacte)
        ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'abonnement' && (
          <div className="prof-fade">

            {/* Bannière de message — remplace toast pour la section Abonnement */}
            {msgAbonnement && (
              <div className="msg-banner" style={{
                marginBottom: 16,
                padding: '10px 14px',
                borderRadius: T.radiusSm,
                background: msgAbonnement.type === 'success' ? T.successSoft : T.dangerSoft,
                border: `1px solid ${msgAbonnement.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
                color: msgAbonnement.type === 'success' ? '#065f46' : '#991b1b',
                fontSize: isMobile ? 11 : 12,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}>
                <i className={msgAbonnement.type === 'success' ? 'bx bx-check-circle' : 'bx bx-error-circle'} style={{ fontSize: 15 }} />
                {msgAbonnement.text}
              </div>
            )}

            {abonnement && (
              <div style={{
                ...cardStyle,
                background: aboActif ? '#f0fdf4' : T.dangerSoft,
                border: `1px solid ${aboActif ? '#bbf7d0' : '#fecaca'}`,
                padding: isMobile ? '12px 14px' : '18px 24px',
                marginBottom: 16,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: aboActif ? '#dcfce7' : T.dangerSoft,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <i className={aboActif ? 'bx bx-check-shield' : 'bx bx-shield-x'}
                      style={{ fontSize: 18, color: aboActif ? '#059669' : T.danger }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, color: aboActif ? '#065f46' : '#991b1b', fontSize: isMobile ? 13 : 15 }}>
                      {aboActif ? 'Abonnement actif' : 'Abonnement expiré'}
                    </div>
                    <div style={{ fontSize: 10, color: T.textMid, marginTop: 2 }}>
                      Plan: <strong>{planNom}</strong> — Expire: <strong>{abonnement?.date_fin ? new Date(abonnement.date_fin).toLocaleDateString('fr-FR') : '—'}</strong>
                    </div>
                  </div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.6)', borderRadius: 99, height: 4, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    borderRadius: 99,
                    background: joursRest <= 7 ? T.danger : aboActif ? '#059669' : T.textLight,
                    width: `${Math.min((joursRest / (abonnement.type === 'mensuel' ? 30 : abonnement.type === 'essai' ? 15 : 365)) * 100, 100)}%`,
                  }} />
                </div>
                <p style={{ margin: '8px 0 0', fontSize: 9, color: T.textMid }}>
                  {joursRest > 0 ? `${joursRest} jour(s) restants` : 'Abonnement terminé'}
                </p>
              </div>
            )}

            {successAbo && (
              <div style={{
                ...cardStyle,
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                padding: isMobile ? '18px' : '28px',
                marginBottom: 16,
                textAlign: 'center',
              }}>
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: '#dcfce7',
                  margin: '0 auto 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <i className='bx bx-check-double' style={{ fontSize: 22, color: '#059669' }} />
                </div>
                <h3 style={{ margin: '0 0 8px', color: '#065f46', fontWeight: 800, fontSize: isMobile ? 15 : 17 }}>Activé !</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, margin: '14px 0' }}>
                  <div style={{ background: 'rgba(255,255,255,0.7)', borderRadius: T.radiusSm, padding: '8px' }}>
                    <div style={{ fontSize: 8, color: T.textMid }}>Plan</div>
                    <div style={{ fontSize: 12, fontWeight: 800 }}>{successAbo.plan_nom || 'Standard'}</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.7)', borderRadius: T.radiusSm, padding: '8px' }}>
                    <div style={{ fontSize: 8, color: T.textMid }}>Montant</div>
                    <div style={{ fontSize: 12, fontWeight: 800 }}>{parseFloat(successAbo.montant).toLocaleString()} MRU</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.7)', borderRadius: T.radiusSm, padding: '8px' }}>
                    <div style={{ fontSize: 8, color: T.textMid }}>Fin</div>
                    <div style={{ fontSize: 12, fontWeight: 800 }}>{successAbo.date_fin ? new Date(successAbo.date_fin).toLocaleDateString('fr-FR') : '—'}</div>
                  </div>
                </div>
                <button onClick={() => { setSuccessAbo(null); setCodeEnvoye(false); setCode(''); }} style={{
                  background: '#059669', color: T.white, border: 'none',
                  borderRadius: T.radiusSm, padding: '8px 24px', cursor: 'pointer',
                  fontWeight: 700, fontSize: isMobile ? 11 : 13,
                }}>OK</button>
              </div>
            )}

            {!successAbo && (
              <div style={{ ...cardStyle, padding: cardPadding }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
                  <div style={{ width: sectionIconSize, height: sectionIconSize, borderRadius: 8, background: 'linear-gradient(135deg, #ede9fe, #c4b5fd)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className='bx bx-crown' style={{ fontSize: isMobile ? 14 : 16, color: '#6366f1' }} />
                  </div>
                  <h3 style={{ margin: 0, fontSize: titleSize, fontWeight: 800, color: T.text, fontFamily: "'Outfit', sans-serif" }}>
                    {aboActif && !estEssai ? 'Renouveler' : 'Souscrire'}
                  </h3>
                </div>

                {!codeEnvoye ? (
                  <form onSubmit={demanderCode} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                    <div>
                      <label style={{ fontSize: 10, fontWeight: 600, color: T.textMid, marginBottom: 6, display: 'block' }}>Type de compte</label>
                      <div className="plan-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                        {[
                          { val: 'standard', icon: 'bx-user', label: 'Standard', desc: 'Usage personnel', price: TARIFS.standard.mensuel },
                          { val: 'entreprise', icon: 'bx-buildings', label: 'Entreprise', desc: 'Multi-utilisateurs', price: TARIFS.entreprise.mensuel },
                        ].map(opt => {
                          const active = typeUser === opt.val;
                          return (
                            <div key={opt.val} onClick={() => setTypeUser(opt.val)} style={{
                              border: `2px solid ${active ? T.primary : T.border}`,
                              borderRadius: 12,
                              padding: isMobile ? '10px' : '14px',
                              cursor: 'pointer',
                              background: active ? T.primarySoft : T.white,
                            }}>
                              <i className={`bx ${opt.icon}`} style={{ fontSize: isMobile ? 18 : 20, color: active ? T.primary : T.textLight, display: 'block', marginBottom: 6 }} />
                              <div style={{ fontWeight: 800, fontSize: isMobile ? 12 : 13, color: active ? T.primary : T.text }}>{opt.label}</div>
                              <div style={{ fontSize: 9, color: T.textLight, marginTop: 2 }}>{opt.desc}</div>
                              <div style={{ fontSize: isMobile ? 13 : 15, fontWeight: 800, color: T.primary, marginTop: 8 }}>{opt.price.toLocaleString()} MRU/mois</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: 10, fontWeight: 600, color: T.textMid, marginBottom: 6, display: 'block' }}>Durée</label>
                      <div className="plan-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                        {[
                          { val: 'mensuel', label: 'Mensuel', duree: '30j', price: TARIFS[typeUser].mensuel },
                          { val: 'annuel', label: 'Annuel', duree: '365j', price: TARIFS[typeUser].annuel, saving: '2 mois off' },
                        ].map(opt => {
                          const active = typeAbo === opt.val;
                          return (
                            <div key={opt.val} onClick={() => setTypeAbo(opt.val)} style={{
                              border: `2px solid ${active ? T.primary : T.border}`,
                              borderRadius: 12,
                              padding: isMobile ? '10px' : '14px',
                              cursor: 'pointer',
                              background: active ? T.primarySoft : T.white,
                            }}>
                              <div style={{ fontWeight: 800, fontSize: isMobile ? 12 : 13, color: active ? T.primary : T.text }}>{opt.label}</div>
                              <div style={{ fontSize: isMobile ? 15 : 18, fontWeight: 800, color: T.text, margin: '4px 0' }}>{opt.price.toLocaleString()} MRU</div>
                              <div style={{ fontSize: 9, color: T.textLight }}>{opt.duree}</div>
                              {opt.saving && <div style={{ fontSize: 8, color: T.success, marginTop: 3 }}><i className='bx bx-gift' style={{ fontSize: 9 }} /> {opt.saving}</div>}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: 10, fontWeight: 600, color: T.textMid, marginBottom: 6, display: 'block' }}>Email</label>
                      <div style={{ position: 'relative' }}>
                        <i className='bx bx-envelope' style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: T.textLight }} />
                        <input type="email" value={emailAbo} onChange={e => setEmailAbo(e.target.value)} required placeholder="votre@email.com" className="prof-input" style={{
                          width: '100%', padding: isMobile ? '9px 9px 9px 32px' : '10px 12px 10px 36px',
                          borderRadius: T.radiusSm, border: `1.5px solid ${T.border}`, background: T.bg,
                          fontSize: isMobile ? 12 : 13,
                        }} />
                      </div>
                    </div>

                    <button type="submit" disabled={loadingCode || (aboActif && !peutSouscrire())} className="btn-hover" style={{
                      width: '100%', padding: isMobile ? '10px' : '12px',
                      background: (loadingCode || (aboActif && !peutSouscrire())) ? T.textLight : `linear-gradient(135deg, ${T.primary}, #8b5cf6)`,
                      color: T.white, border: 'none', borderRadius: T.radiusSm,
                      fontWeight: 700, fontSize: isMobile ? 12 : 13,
                      cursor: (loadingCode || (aboActif && !peutSouscrire())) ? 'not-allowed' : 'pointer',
                      opacity: (loadingCode || (aboActif && !peutSouscrire())) ? 0.65 : 1,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    }}>
                      {loadingCode ? <><Spinner /> Envoi...</> : (aboActif && !peutSouscrire()) ? <><i className='bx bx-lock' /> Non dispo</> : <><i className='bx bx-envelope' /> Recevoir code</>}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={confirmerAbonnement} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ background: T.primarySoft, borderRadius: T.radiusSm, padding: '8px 12px', fontSize: 11, color: '#4338ca', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <i className='bx bx-envelope-open' style={{ fontSize: 13 }} />
                      Code envoyé à <strong>{emailAbo}</strong>
                    </div>

                    <div>
                      <label style={{ fontSize: 10, fontWeight: 600, color: T.textMid, marginBottom: 6, display: 'block' }}>Code</label>
                      <input type="text" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} required maxLength={6} placeholder="000000" className="prof-input" style={{
                        width: '100%', fontSize: isMobile ? 22 : 28, fontWeight: 800, textAlign: 'center',
                        letterSpacing: isMobile ? 6 : 8, color: T.primary, fontFamily: "'Outfit', monospace",
                        padding: isMobile ? '12px' : '14px', borderRadius: T.radiusSm, border: `2px solid ${T.border}`, background: T.bg,
                      }} />
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                      <button type="submit" disabled={loadingAbo || code.length !== 6 || (aboActif && !peutSouscrire())} style={{
                        flex: 2, padding: isMobile ? '10px' : '12px',
                        background: (loadingAbo || code.length !== 6 || (aboActif && !peutSouscrire())) ? T.textLight : T.success,
                        color: T.white, border: 'none', borderRadius: T.radiusSm,
                        fontWeight: 700, fontSize: isMobile ? 11 : 13,
                        cursor: (loadingAbo || code.length !== 6 || (aboActif && !peutSouscrire())) ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                      }}>{loadingAbo ? <><Spinner />...</> : `Confirmer — ${montantCalc} MRU`}</button>
                      <button type="button" onClick={() => { setCodeEnvoye(false); setCode(''); }} style={{
                        flex: 1, background: T.bg, border: `1.5px solid ${T.border}`, borderRadius: T.radiusSm,
                        padding: isMobile ? '10px' : '12px', cursor: 'pointer', fontSize: isMobile ? 11 : 12,
                        color: T.textMid, fontWeight: 600,
                      }}>Retour</button>
                    </div>

                    <button type="button" onClick={demanderCode} disabled={loadingCode} style={{
                      background: 'none', border: 'none', cursor: 'pointer', color: T.primary, fontSize: 11,
                      fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                    }}><i className='bx bx-refresh' /> Renvoyer</button>
                  </form>
                )}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            TAB — CONTACT (version compacte)
        ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'contact' && (
          <div className="prof-fade" style={{ ...cardStyle, padding: cardPadding }}>

            {/* Bannière de message — remplace toast pour la section Contact */}
            {msgContact && (
              <div className="msg-banner" style={{
                marginBottom: 16,
                padding: '10px 14px',
                borderRadius: T.radiusSm,
                background: msgContact.type === 'success' ? T.successSoft : T.dangerSoft,
                border: `1px solid ${msgContact.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
                color: msgContact.type === 'success' ? '#065f46' : '#991b1b',
                fontSize: isMobile ? 11 : 12,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}>
                <i className={msgContact.type === 'success' ? 'bx bx-check-circle' : 'bx bx-error-circle'} style={{ fontSize: 15 }} />
                {msgContact.text}
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <div style={{ width: sectionIconSize, height: sectionIconSize, borderRadius: 8, background: 'linear-gradient(135deg, #ede9fe, #c4b5fd)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className='bx bx-support' style={{ fontSize: isMobile ? 14 : 16, color: '#6366f1' }} />
              </div>
              <h3 style={{ margin: 0, fontSize: titleSize, fontWeight: 800, color: T.text, fontFamily: "'Outfit', sans-serif" }}>
                Contacter le support
              </h3>
            </div>
            <p style={{ margin: '0 0 16px', color: T.textMid, fontSize: isMobile ? 11 : 12 }}>Une question ? Écrivez-nous.</p>
            <form onSubmit={handleContact} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <textarea value={formContact} onChange={e => setFormContact(e.target.value)} placeholder="Décrivez votre problème..." rows={4} required minLength={10} className="prof-input" style={{
                width: '100%', padding: '10px 12px', borderRadius: T.radiusSm,
                border: `1.5px solid ${T.border}`, background: T.bg, fontSize: isMobile ? 12 : 13,
                resize: 'vertical', lineHeight: 1.5, fontFamily: "'DM Sans', sans-serif",
              }} />
              <button type="submit" disabled={loadingContact} className="btn-hover" style={{
                width: '100%', padding: isMobile ? '10px' : '12px',
                background: loadingContact ? T.textLight : `linear-gradient(135deg, ${T.primary}, #8b5cf6)`,
                color: T.white, border: 'none', borderRadius: T.radiusSm,
                fontWeight: 700, fontSize: isMobile ? 12 : 13,
                cursor: loadingContact ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}>{loadingContact ? <><Spinner /> Envoi...</> : <><i className='bx bx-send' /> Envoyer</>}</button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}

// ── COMPOSANTS UTILITAIRES ────────────────────────────────────────────────────

function Spinner() {
  return (
    <span style={{
      width: 12, height: 12,
      border: '2px solid rgba(255,255,255,0.3)',
      borderTopColor: '#fff', borderRadius: '50%',
      display: 'inline-block', animation: 'spin 0.7s linear infinite',
    }} />
  );
}