// frontend/src/pages/Inscription.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function Inscription() {
  const navigate = useNavigate();
  const [etape, setEtape] = useState(1); // 1: formulaire | 2: code email | 3: invitation KYC
  const [userId, setUserId] = useState(null);
  const [userEmail, setUserEmail] = useState('');

  const [form, setForm] = useState({
    nom: '', prenom: '', telephone: '+222', email: '',
    password: '', password_confirm: '',
  });

  // ── États pour les erreurs de validation ──────────────────────────────────
  const [errors, setErrors] = useState({
    nom: '',
    prenom: '',
    telephone: '',
    email: '',
    password: '',
    password_confirm: '',
  });

  const [touched, setTouched] = useState({
    nom: false,
    prenom: false,
    telephone: false,
    email: false,
    password: false,
    password_confirm: false,
  });

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showCode, setShowCode] = useState(false);

  // ── États pour les messages personnalisés ──────────────────────────────────
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showMessage, setShowMessage] = useState(false);

  const showCustomMessage = (type, text) => {
    setMessage({ type, text });
    setShowMessage(true);
    setTimeout(() => setShowMessage(false), 5000);
  };

  const initiales = `${(form.prenom[0]||'').toUpperCase()}${(form.nom[0]||'').toUpperCase()}` || '?';
  const bgColors = ['#0c2e7c','#1e4db7','#3b82f6','#1d4ed8','#2563eb','#1e40af'];
  const avatarBg = bgColors[(form.prenom.charCodeAt(0)||0) % bgColors.length];
  const emailOk = !form.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
  const [sessionToken, setSessionToken] = useState(null);

  // ─── Regex lettres uniquement (accents, espaces, tiret, apostrophe acceptés) ──
  const NAME_REGEX = /^[A-Za-zÀ-ÖØ-öø-ÿ\s'-]+$/;
  const NAME_FILTER_REGEX = /[^A-Za-zÀ-ÖØ-öø-ÿ\s'-]/g;

  // ─── Fonctions de validation ──────────────────────────────────────────────

  const validateNom = (value) => {
    if (!value || value.trim() === '') return 'Le nom est obligatoire.';
    if (value.length < 3) return 'Le nom doit contenir au moins 3 caractères.';
    if (!NAME_REGEX.test(value)) return 'Le nom ne doit contenir que des lettres.';
    return '';
  };

  const validatePrenom = (value) => {
    if (!value || value.trim() === '') return 'Le prénom est obligatoire.';
    if (value.length < 3) return 'Le prénom doit contenir au moins 3 caractères.';
    if (!NAME_REGEX.test(value)) return 'Le prénom ne doit contenir que des lettres.';
    return '';
  };

  const validateTelephone = (value) => {
    if (!value || value.trim() === '') return 'Le téléphone est obligatoire.';
    // Format: +222 suivi de 8 chiffres, le premier chiffre après +222 doit être 2, 3 ou 4
    const phoneRegex = /^\+222[234][0-9]{7}$/;
    if (!phoneRegex.test(value)) {
      return 'Le téléphone doit être au format +222 suivi de 8 chiffres, le premier chiffre après +222 doit être 2, 3 ou 4.';
    }
    if (value.length > 12) return 'Le téléphone ne peut pas dépasser 12 caractères.';
    return '';
  };

  const validateEmail = (value) => {
    if (!value || value.trim() === '') return 'L\'email est obligatoire.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return 'Format d\'email invalide.';
    }
    return '';
  };

  const validatePassword = (value) => {
    if (!value || value.trim() === '') return 'Le mot de passe est obligatoire.';
    if (value.length < 6) return 'Le mot de passe doit contenir au moins 6 caractères.';
    return '';
  };

  const validatePasswordConfirm = (value, password) => {
    if (!value || value.trim() === '') return 'La confirmation du mot de passe est obligatoire.';
    if (value !== password) return 'Les mots de passe ne correspondent pas.';
    return '';
  };

  // ─── Gestion des changements avec validation ──────────────────────────────

  const handleFieldChange = (field, value) => {
    // Nom / Prénom : on filtre directement les caractères non autorisés (lettres uniquement)
    if (field === 'nom' || field === 'prenom') {
      value = value.replace(NAME_FILTER_REGEX, '');
    }

    setForm({...form, [field]: value});
    setTouched({...touched, [field]: true});
    
    let error = '';
    switch(field) {
      case 'nom':
        error = validateNom(value);
        break;
      case 'prenom':
        error = validatePrenom(value);
        break;
      case 'telephone':
        // Ne permettre que +222 et les chiffres
        if (value && !value.startsWith('+222')) {
          if (value.length > 0 && !value.startsWith('+')) {
            // Si c'est un chiffre, ajouter +222 automatiquement
            if (/^\d/.test(value)) {
              const cleanValue = value.replace(/\D/g, '');
              const limitedValue = cleanValue.slice(0, 8);
              value = `+222${limitedValue}`;
              setForm({...form, telephone: value});
              error = validateTelephone(value);
            } else {
              error = 'Le téléphone doit commencer par +222.';
            }
          } else {
            error = validateTelephone(value);
          }
        } else {
          // Limiter à 12 caractères (+222 + 8 chiffres)
          if (value.length > 12) {
            value = value.slice(0, 12);
            setForm({...form, telephone: value});
          }
          // Ne permettre que les chiffres après +222
          if (value.startsWith('+222')) {
            const prefix = '+222';
            const digits = value.slice(4).replace(/\D/g, '');
            const limitedDigits = digits.slice(0, 8);
            value = `${prefix}${limitedDigits}`;
            setForm({...form, telephone: value});
          }
          error = validateTelephone(value);
        }
        break;
      case 'email':
        error = validateEmail(value);
        break;
      case 'password':
        error = validatePassword(value);
        // Revalider la confirmation si elle existe
        if (form.password_confirm) {
          const confirmError = validatePasswordConfirm(form.password_confirm, value);
          setErrors({...errors, password_confirm: confirmError});
        }
        break;
      case 'password_confirm':
        error = validatePasswordConfirm(value, form.password);
        break;
      default:
        break;
    }
    
    setErrors({...errors, [field]: error});
  };

  // ─── Vérification de la validité du formulaire ────────────────────────────

  const isFormValid = () => {
    const nomError = validateNom(form.nom);
    const prenomError = validatePrenom(form.prenom);
    const telephoneError = validateTelephone(form.telephone);
    const emailError = validateEmail(form.email);
    const passwordError = validatePassword(form.password);
    const passwordConfirmError = validatePasswordConfirm(form.password_confirm, form.password);
    
    setErrors({
      nom: nomError,
      prenom: prenomError,
      telephone: telephoneError,
      email: emailError,
      password: passwordError,
      password_confirm: passwordConfirmError,
    });
    
    return !nomError && !prenomError && !telephoneError && !emailError && !passwordError && !passwordConfirmError;
  };

  // ─── HANDLE SUBMIT - VERSION CORRIGÉE ──────────────────────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Marquer tous les champs comme touchés
    setTouched({
      nom: true,
      prenom: true,
      telephone: true,
      email: true,
      password: true,
      password_confirm: true,
    });
    
    // Valider tous les champs
    if (!isFormValid()) {
      showCustomMessage('error', 'Veuillez corriger les erreurs dans le formulaire.');
      return;
    }
    
    setLoading(true);
    try {
      const response = await api.post('/comptes/inscription/', {
        nom: form.nom.trim(),
        prenom: form.prenom.trim(),
        telephone: form.telephone,
        email: form.email.trim(),
        password: form.password,
        password_confirm: form.password_confirm,
      });
      console.log('Réponse complète:', response.data);
      const { status, message, session_token, user_id } = response.data;
      
      // ✅ CAS 1 : Compte existant et complet
      if (status === 'existing_user') {
        setTouched(prev => ({ ...prev, email: true }));
        setErrors(prev => ({
          ...prev,
          email: message || 'Un compte existe déjà avec cet email. Modifiez l\'email ou connectez-vous.',
        }));
        showCustomMessage('info', message || 'Un compte existe déjà avec cet email. Veuillez vous connecter.');
        setLoading(false);
        return;
      }
      
      // ✅ CAS 2 : Compte existant mais KYC incomplet - AFFICHE LE MESSAGE EXACT
      if (status === 'kyc_incomplete') {
        setTouched(prev => ({ ...prev, email: true }));
        setErrors(prev => ({
          ...prev,
          email: message || 'Votre compte est incomplet. Veuillez compléter la vérification d\'identité.',
        }));
        showCustomMessage('warning', message || 'Votre compte est incomplet. Veuillez compléter la vérification d\'identité.');
        setLoading(false);
        return;
      }
      
      // ✅ CAS 3 : Nouvel utilisateur
      if (session_token && user_id) {
        setUserId(user_id);
        setUserEmail(form.email);
        setSessionToken(session_token);
        localStorage.setItem('temp_user_id', user_id);
        localStorage.setItem('temp_session_token', session_token);
        
        showCustomMessage('success', 'Code de confirmation envoyé à votre email !');
        setEtape(2);
      }
      
    } catch (err) {
      const errors = err.response?.data;
      if (errors && typeof errors === 'object') {
        Object.entries(errors).forEach(([k, v]) => {
          const msg = Array.isArray(v) ? v[0] : v;
          showCustomMessage('error', `${k}: ${msg}`);
        });
      } else {
        showCustomMessage('error', 'Erreur lors de l\'inscription.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifierCode = async (e) => {
    e.preventDefault();
    if (!code || code.length !== 6) {
      showCustomMessage('error', 'Veuillez entrer le code à 6 chiffres.');
      return;
    }
    setLoading(true);
    try {
      const response = await api.post('/comptes/verifier-email/', { code, user_id: userId });
      showCustomMessage('success', 'Email vérifié avec succès !');
      // ✅ On passe à l'étape 3 (information KYC) au lieu de naviguer directement.
      setEtape(3);
    } catch (err) {
      const msg = err.response?.data?.error || 'Code invalide ou expiré.';
      showCustomMessage('error', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRenvoyerCode = async () => {
    setLoading(true);
    try {
      await api.post('/comptes/renvoyer-code/', { email: userEmail });
      showCustomMessage('success', 'Un nouveau code a été envoyé à votre email.');
    } catch (err) {
      showCustomMessage('error', 'Erreur lors du renvoi du code.');
    } finally {
      setLoading(false);
    }
  };

  const handleAccederKYC = () => {
    navigate('/kyc', { state: { userId: userId } });
  };

  // ─── STYLES PARTAGÉS ──────────────────────────────────────────────────────────

  const pageStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0c2e7c, #1e4db7, #3b82f6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    fontFamily: "'Sora', sans-serif",
    position: 'relative',
    overflow: 'hidden',
  };

  const glowStyle = {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    overflow: 'hidden',
  };

  // ─── Indicateur d'étapes (1/3, 2/3, 3/3) réutilisable ──────────────────────
  const renderSteps = (current) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
      {[1, 2, 3].map(s => (
        <div key={s} className="step-dot" style={{
          width: s === current ? 22 : 8, height: 8, borderRadius: 99,
          background: s <= current
            ? 'linear-gradient(90deg, #0c2e7c, #3b82f6)'
            : '#e2e8f0',
        }} />
      ))}
      <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 4, fontWeight: 500 }}>
        Étape {current} / 3
      </span>
    </div>
  );

  const sharedHead = (
    <>
      <link rel="stylesheet" href="https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css" />
      <link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideDown {
          from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes pulse-ring {
          0%   { box-shadow: 0 0 0 0 rgba(255,255,255,0.25); }
          70%  { box-shadow: 0 0 0 14px rgba(255,255,255,0); }
          100% { box-shadow: 0 0 0 0 rgba(255,255,255,0); }
        }
        .card-main, .card-verify, .card-kyc {
          animation: fadeUp 0.45s cubic-bezier(.16,1,.3,1) both;
        }
        .field-input {
          width: 100%; box-sizing: border-box;
          padding: 14px 14px 14px 42px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          color: #0f172a; font-size: 14px;
          font-family: 'Sora', sans-serif;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
          outline: none;
        }
        .field-input:focus {
          border-color: #0c2e7c !important;
          background: #fff !important;
          box-shadow: 0 0 0 4px rgba(12,46,124,0.10) !important;
        }
        .field-input::placeholder { color: #cbd5e1; }
        .field-input.error { border-color: #ef4444 !important; }
        .field-input-noicon {
          width: 100%; box-sizing: border-box;
          padding: 14px 44px 14px 14px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          color: #0f172a; font-size: 14px;
          font-family: 'Sora', sans-serif;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
          outline: none;
        }
        .field-input-noicon:focus {
          border-color: #0c2e7c !important;
          background: #fff !important;
          box-shadow: 0 0 0 4px rgba(12,46,124,0.10) !important;
        }
        .field-input-noicon::placeholder { color: #cbd5e1; }
        .field-input-noicon.error { border-color: #ef4444 !important; }
        .btn-submit, .btn-primary, .btn-kyc {
          transition: all 0.2s;
        }
        .btn-submit:hover:not(:disabled),
        .btn-primary:hover:not(:disabled),
        .btn-kyc:hover:not(:disabled) {
          transform: translateY(-2px);
          background: #163e96 !important;
        }
        .back-link { transition: color 0.2s; }
        .back-link:hover { color: #0c2e7c !important; }
        .toggle-eye { transition: color 0.15s; }
        .toggle-eye:hover { color: #0c2e7c !important; }
        .btn-ghost:hover { color: #163e96 !important; text-decoration: underline; }
        .icon-ring { animation: pulse-ring 2.6s ease infinite; }
        .code-inp {
          transition: border-color 0.2s, box-shadow 0.2s;
          caret-color: #0c2e7c;
        }
        .code-inp:focus {
          border-color: #0c2e7c !important;
          box-shadow: 0 0 0 4px rgba(12,46,124,0.10) !important;
          outline: none;
        }
        @media (max-width: 500px) {
          .card-main, .card-verify, .card-kyc { padding: 28px 18px !important; border-radius: 16px !important; }
          .name-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  );

  const renderToast = () => showMessage && (
    <div style={{
      position: 'fixed',
      top: 20,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 9999,
      padding: '16px 24px',
      borderRadius: 12,
      backgroundColor: message.type === 'error' ? '#fee2e2' : message.type === 'success' ? '#d1fae5' : message.type === 'warning' ? '#fef3c7' : '#dbeafe',
      color: message.type === 'error' ? '#991b1b' : message.type === 'success' ? '#065f46' : message.type === 'warning' ? '#92400e' : '#1e3a8a',
      border: `1px solid ${message.type === 'error' ? '#fecaca' : message.type === 'success' ? '#a7f3d0' : message.type === 'warning' ? '#fde68a' : '#bfdbfe'}`,
      boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
      maxWidth: '90%',
      width: 'auto',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      animation: 'slideDown 0.3s ease-out',
    }}>
      <i className={`bx ${
        message.type === 'error' ? 'bx-error-circle' :
        message.type === 'success' ? 'bx-check-circle' :
        message.type === 'warning' ? 'bx-error' : 'bx-info-circle'
      }`} style={{ fontSize: 20 }} />
      <span style={{ fontSize: 14, fontWeight: 500, fontFamily: "'Sora', sans-serif" }}>
        {message.text}
      </span>
      <button
        onClick={() => setShowMessage(false)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: 18,
          color: message.type === 'error' ? '#991b1b' : message.type === 'success' ? '#065f46' : message.type === 'warning' ? '#92400e' : '#1e3a8a',
          opacity: 0.7,
          padding: '0 4px',
          display: 'flex', alignItems: 'center',
        }}
      >
        <i className='bx bx-x' />
      </button>
    </div>
  );

  const renderGlow = (size = 560, top = -180, blur = 44) => (
    <div style={glowStyle}>
      <div style={{
        position: 'absolute', width: size, height: size,
        borderRadius: '50%', top, left: '50%', transform: 'translateX(-50%)',
        background: 'radial-gradient(circle, rgba(255,255,255,0.09) 0%, transparent 70%)',
        filter: `blur(${blur}px)`,
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)`,
        backgroundSize: '28px 28px',
      }} />
    </div>
  );

  // ─── ÉTAPE 3 : INVITATION À LA VÉRIFICATION KYC ──────────────────────────────
  if (etape === 3) {
    return (
      <div style={pageStyle}>
        {sharedHead}
        {renderToast()}
        {renderGlow()}

        <div className="card-kyc" style={{
          width: '100%', maxWidth: 440,
          position: 'relative', zIndex: 1,
          background: '#ffffff',
          borderRadius: 20,
          padding: '40px 36px',
          boxShadow: '0 32px 80px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.08)',
          textAlign: 'center',
        }}>
          {renderSteps(3)}

          <div className="icon-ring" style={{
            width: 76, height: 76, borderRadius: '50%',
            background: 'linear-gradient(135deg, #0c2e7c, #1e4db7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '24px auto 22px',
            boxShadow: '0 10px 26px rgba(12,46,124,0.32)',
          }}>
            <i className='bx bxs-shield-alt-2' style={{ fontSize: 34, color: '#fff' }} />
          </div>

          <h2 style={{
            margin: 0, fontSize: 22, fontWeight: 800, color: '#0f172a',
            fontFamily: "'Sora', sans-serif", letterSpacing: '-0.3px',
          }}>
            Validez votre compte via la vérification KYC
          </h2>

          <p style={{ margin: '14px 0 0', fontSize: 13.5, color: '#64748b', lineHeight: 1.75 }}>
            Pour protéger votre compte et garantir la sécurité de vos transactions financières,
            cette étape rapide consiste à scanner une pièce d'identité ou un passeport 
            et confirmer votre visage — elle nous permet de prévenir
            la fraude et de respecter les normes bancaires en vigueur.
          </p>

          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            background: '#eff6ff', border: '1px solid #dbeafe',
            borderRadius: 12, padding: '14px 16px', margin: '20px 0',
            textAlign: 'left',
          }}>
            <i className='bx bx-lock-alt' style={{ fontSize: 18, color: '#0c2e7c', marginTop: 1, flexShrink: 0 }} />
            <span style={{ fontSize: 12.5, color: '#1e3a8a', lineHeight: 1.6 }}>
              Vos données sont chiffrées et utilisées uniquement à des fins de vérification.
              Cette étape ne prend que quelques minutes.
            </span>
          </div>

          <button onClick={handleAccederKYC} className="btn-primary" style={{
            width: '100%', padding: '15px',
            fontWeight: 700, fontSize: 14.5,
            background: '#0c2e7c',
            color: '#fff', border: 'none', borderRadius: 12,
            cursor: 'pointer',
            boxShadow: '0 4px 18px rgba(12,46,124,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            <i className='bx bxs-shield-alt-2' style={{ fontSize: 17 }} />
            Accéder à la vérification KYC
          </button>

          <p style={{ margin: '16px 0 0', fontSize: 11.5, color: '#94a3b8' }}>
            Connecté avec <strong style={{ color: '#0c2e7c' }}>{userEmail}</strong>
          </p>
        </div>
      </div>
    );
  }

  // ─── ÉTAPE 2 : VÉRIFICATION EMAIL ────────────────────────────────────────────
  if (etape === 2) {
    return (
      <div style={pageStyle}>
        {sharedHead}
        {renderToast()}
        {renderGlow()}

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
            fontWeight: 500, marginBottom: 18,
          }}>
            <i className='bx bx-arrow-back' style={{ fontSize: 15 }} />
            Retour
          </Link>

          {renderSteps(2)}

          {/* Icône */}
          <div style={{ textAlign: 'center', margin: '22px 0 28px' }}>
            <div className="icon-ring" style={{
              width: 68, height: 68, borderRadius: '50%',
              background: 'linear-gradient(135deg, #0c2e7c, #1e4db7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 18px',
              boxShadow: '0 8px 22px rgba(12,46,124,0.3)',
            }}>
              <i className='bx bx-envelope' style={{ fontSize: 30, color: '#fff' }} />
            </div>
            <h2 style={{
              margin: 0, fontSize: 22, fontWeight: 800, color: '#0f172a',
              fontFamily: "'Sora', sans-serif", letterSpacing: '-0.3px',
            }}>
              Vérifiez votre email
            </h2>
            <p style={{ margin: '8px 0 0', fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>
              Un code de confirmation a été envoyé à<br />
              <strong style={{ color: '#0c2e7c' }}>{userEmail}</strong>
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
                    padding: '16px 48px 16px 18px',
                    borderRadius: 12, border: '1px solid #e2e8f0',
                    background: '#f8fafc',
                    textAlign: 'center', fontSize: 26, fontWeight: 800,
                    letterSpacing: 9, color: '#0c2e7c',
                    fontFamily: "'Sora', monospace",
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
              width: '100%', padding: '15px',
              fontWeight: 700, fontSize: 14.5,
              background: '#0c2e7c',
              color: '#fff', border: 'none', borderRadius: 12,
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 18px rgba(12,46,124,0.3)',
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
      {sharedHead}
      {renderToast()}
      {renderGlow(620, -220, 50)}

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

        {/* Header avec le nouveau logo */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'flex-start', marginBottom: 24, gap: 12,
        }}>
          <div>
            {/* Logo - Moderne et fantastique */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              {/* Nouveau logo moderne avec effet de brillance */}
              <div className="logo-icon" style={{ 
                width: 38, 
                height: 38, 
                borderRadius: 12, 
                background: 'linear-gradient(135deg, #0c2e7c, #1e4db7, #3b82f6)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                boxShadow: '0 4px 15px rgba(59,130,246,0.4)',
                position: 'relative',
                overflow: 'hidden',
              }}>
                {/* Effet de brillance */}
                <div style={{
                  position: 'absolute',
                  top: -15,
                  left: -15,
                  width: 30,
                  height: 30,
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: '50%',
                  transform: 'rotate(45deg)',
                }} />
                <div style={{
                  position: 'absolute',
                  bottom: -10,
                  right: -10,
                  width: 25,
                  height: 25,
                  background: 'rgba(255,255,255,0.15)',
                  borderRadius: '50%',
                }} />
                
                {/* Logo SVG - Graphique financier moderne */}
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 13L8 8L13 13L21 5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M21 12V19H3V5H12" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="18" cy="8" r="2" stroke="#fff" strokeWidth="1.5"/>
                  <path d="M8 11L8 16" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2"/>
                </svg>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                <span style={{ fontWeight: 800, fontSize: 18, color: '#0c2e7c', letterSpacing: '-0.3px' }}>
                  Finance<span style={{ color: '#3b82f6' }}>App</span>
                </span>
                <span style={{ fontSize: 8, color: '#94a3b8', letterSpacing: '0.3px', fontWeight: 500 }}>
                  Smart Finance
                </span>
              </div>
            </div>

            <h2 style={{
              margin: 0, fontSize: 21, fontWeight: 800, color: '#0f172a',
              fontFamily: "'Sora', sans-serif", letterSpacing: '-0.3px',
            }}>
              Créer un compte
            </h2>

            {renderSteps(1)}
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
            fontFamily: "'Sora', sans-serif",
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
                <i className='bx bx-user' style={{ fontSize: 12 }} /> Prénom 
              </label>
              <div style={{ position: 'relative' }}>
                <i className='bx bx-user' style={iconLeft} />
                <input
                  value={form.prenom}
                  onChange={e => handleFieldChange('prenom', e.target.value)}
                  onBlur={() => setTouched({...touched, prenom: true})}
                  placeholder="Votre prénom"
                  required
                  className={`field-input ${touched.prenom && errors.prenom ? 'error' : ''}`}
                />
              </div>
              {touched.prenom && errors.prenom && (
                <p style={errStyle}>
                  <i className='bx bx-error-circle' style={{ fontSize: 12 }} />
                  {errors.prenom}
                </p>
              )}
            </div>
            <div>
              <label style={lblStyle}>
                <i className='bx bx-id-card' style={{ fontSize: 12 }} /> Nom 
              </label>
              <div style={{ position: 'relative' }}>
                <i className='bx bx-id-card' style={iconLeft} />
                <input
                  value={form.nom}
                  onChange={e => handleFieldChange('nom', e.target.value)}
                  onBlur={() => setTouched({...touched, nom: true})}
                  placeholder="Votre nom"
                  required
                  className={`field-input ${touched.nom && errors.nom ? 'error' : ''}`}
                />
              </div>
              {touched.nom && errors.nom && (
                <p style={errStyle}>
                  <i className='bx bx-error-circle' style={{ fontSize: 12 }} />
                  {errors.nom}
                </p>
              )}
            </div>
          </div>

          {/* Téléphone */}
          <div>
            <label style={lblStyle}>
              <i className='bx bx-phone' style={{ fontSize: 12 }} />
              Téléphone
            </label>
            <div style={{ position: 'relative' }}>
              <i className='bx bx-phone' style={iconLeft} />
              <input
                value={form.telephone}
                onChange={e => handleFieldChange('telephone', e.target.value)}
                onBlur={() => setTouched({...touched, telephone: true})}
                placeholder="+222XXXXXXXX"
                required
                maxLength={12}
                className={`field-input ${touched.telephone && errors.telephone ? 'error' : ''}`}
              />
            </div>
            {touched.telephone && errors.telephone && (
              <p style={errStyle}>
                <i className='bx bx-error-circle' style={{ fontSize: 12 }} />
                {errors.telephone}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label style={lblStyle}>
              <i className='bx bx-envelope' style={{ fontSize: 12 }} />
              Email
            </label>
            <div style={{ position: 'relative' }}>
              <i className='bx bx-envelope' style={iconLeft} />
              <input
                type="email"
                value={form.email}
                onChange={e => handleFieldChange('email', e.target.value)}
                onBlur={() => setTouched({...touched, email: true})}
                placeholder="vous@gmail.com"
                required
                className={`field-input ${touched.email && errors.email ? 'error' : ''}`}
              />
            </div>
            {touched.email && errors.email && (
              <p style={errStyle}>
                <i className='bx bx-error-circle' style={{ fontSize: 12 }} />
                {errors.email}
              </p>
            )}
          </div>

          {/* Mot de passe */}
          <div>
            <label style={lblStyle}>
              <i className='bx bx-lock-alt' style={{ fontSize: 12 }} />
              Mot de passe
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPwd ? 'text' : 'password'}
                value={form.password}
                onChange={e => handleFieldChange('password', e.target.value)}
                onBlur={() => setTouched({...touched, password: true})}
                placeholder="••••••••"
                required
                minLength={6}
                className={`field-input-noicon ${touched.password && errors.password ? 'error' : ''}`}
              />
              <button type="button" onClick={() => setShowPwd(v => !v)}
                className="toggle-eye" style={eyeBtn}>
                <i className={showPwd ? 'bx bx-hide' : 'bx bx-show'} style={{ fontSize: 18 }} />
              </button>
            </div>
            {touched.password && errors.password && (
              <p style={errStyle}>
                <i className='bx bx-error-circle' style={{ fontSize: 12 }} />
                {errors.password}
              </p>
            )}
          </div>

          {/* Confirmer mot de passe */}
          <div>
            <label style={lblStyle}>
              <i className='bx bx-lock' style={{ fontSize: 12 }} />
              Confirmer le mot de passe 
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirm ? 'text' : 'password'}
                value={form.password_confirm}
                onChange={e => handleFieldChange('password_confirm', e.target.value)}
                onBlur={() => setTouched({...touched, password_confirm: true})}
                placeholder="••••••••"
                required
                className={`field-input-noicon ${touched.password_confirm && errors.password_confirm ? 'error' : ''}`}
              />
              <button type="button" onClick={() => setShowConfirm(v => !v)}
                className="toggle-eye" style={eyeBtn}>
                <i className={showConfirm ? 'bx bx-hide' : 'bx bx-show'} style={{ fontSize: 18 }} />
              </button>
            </div>
            {touched.password_confirm && errors.password_confirm && (
              <p style={errStyle}>
                <i className='bx bx-error-circle' style={{ fontSize: 12 }} />
                {errors.password_confirm}
              </p>
            )}
          </div>

          {/* Bouton submit */}
          <button type="submit" disabled={loading} className="btn-submit" style={{
            marginTop: 6, width: '100%', padding: '15px',
            fontWeight: 700, fontSize: 14.5,
            background: '#0c2e7c',
            color: '#fff', border: 'none', borderRadius: 12,
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 18px rgba(12,46,124,0.3)',
            opacity: loading ? 0.75 : 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            fontFamily: "'Sora', sans-serif", letterSpacing: '0.2px',
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
              color: '#0c2e7c', fontWeight: 700, textDecoration: 'none',
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
  position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
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