// frontend/src/pages/Inscription.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import {
  ArrowLeft,
  ArrowRight,
  User,
  CreditCard,
  Phone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  KeyRound,
  RefreshCw,
  LogIn,
  Loader2,
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle2,
  X,
  ShieldAlert,
  LockKeyhole,
} from 'lucide-react';

// ─── Carrés décoratifs (mêmes tons que AuthChoix.js, dominante verte/mint,
//     un peu plus visibles pour rester lisibles sur un fond clair) ──────────
const CARRES_FOND = [
  { top: '6%', left: '8%', size: 70, rotate: 12 },
  { top: '14%', left: '82%', size: 46, rotate: -8 },
  { top: '28%', left: '22%', size: 34, rotate: 20 },
  { top: '38%', left: '68%', size: 90, rotate: -14 },
  { top: '52%', left: '4%', size: 52, rotate: 6 },
  { top: '62%', left: '90%', size: 40, rotate: -20 },
  { top: '74%', left: '35%', size: 64, rotate: 10 },
  { top: '86%', left: '60%', size: 48, rotate: -6 },
  { top: '92%', left: '15%', size: 36, rotate: 18 },
  { top: '18%', left: '48%', size: 30, rotate: -10 },
  { top: '10%', left: '32%', size: 42, rotate: 22 },
  { top: '24%', left: '92%', size: 34, rotate: -16 },
  { top: '34%', left: '12%', size: 56, rotate: 8 },
  { top: '46%', left: '58%', size: 38, rotate: -12 },
  { top: '58%', left: '24%', size: 46, rotate: 15 },
  { top: '68%', left: '76%', size: 60, rotate: -18 },
  { top: '80%', left: '42%', size: 32, rotate: 24 },
  { top: '96%', left: '78%', size: 44, rotate: -9 },
  { top: '4%', left: '58%', size: 28, rotate: 14 },
  { top: '44%', left: '2%', size: 36, rotate: -22 },
];

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
  const bgColors = ['#356267', '#2a4f53', '#4ea674', '#459071', '#10214b', '#1e4db7'];
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

  // ─── HELPERS DE PRÉSENTATION (pas de logique métier) ───────────────────────

  const inputBase =
    'w-full box-border py-3.5 rounded-[10px] bg-[#f8fafc] text-[#10214b] text-sm font-medium outline-none transition-colors duration-150 placeholder:text-[#94a3b8]/70 border';

  const inputBorder = (hasError) =>
    hasError
      ? 'border-[#d55053] focus:border-[#d55053] focus:ring-4 focus:ring-[#d55053]/10 focus:bg-white'
      : 'border-[rgba(16,33,75,0.08)] focus:border-[#356267] focus:ring-4 focus:ring-[#356267]/10 focus:bg-white';

  const fieldLabel =
    'flex items-center gap-1.5 text-[11px] text-[#356267]/75 font-semibold uppercase tracking-wide mb-2';

  const fieldError = (msg) => msg && (
    <p className="mt-1.5 flex items-center gap-1.5 text-[12px] font-medium text-[#d55053]">
      <AlertCircle size={13} className="flex-shrink-0" />
      {msg}
    </p>
  );

  // ─── Indicateur d'étapes (1/3, 2/3, 3/3) réutilisable ──────────────────────
  const renderSteps = (current) => (
    <div className="flex items-center gap-1.5 mt-3">
      {[1, 2, 3].map(s => (
        <div
          key={s}
          className={`h-[6px] rounded-full transition-all duration-300 ${
            s === current ? 'w-6 bg-[#356267]' : s < current ? 'w-[6px] bg-[#4ea674]' : 'w-[6px] bg-[#e2e8f0]'
          }`}
        />
      ))}
      <span className="ml-2 text-[11px] font-semibold text-[#356267]/45">
        Étape {current}/3
      </span>
    </div>
  );

  const sharedHead = (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideDown { from { opacity: 0; transform: translate(-50%, -16px); } to { opacity: 1; transform: translate(-50%, 0); } }
        .card-anim { animation: fadeUp 0.4s cubic-bezier(.16,1,.3,1) both; font-family: 'Sora', sans-serif; }
        .toast-anim { animation: slideDown 0.3s cubic-bezier(.16,1,.3,1) both; }
      `}</style>
    </>
  );

  // ── Thème des toasts : pop-up carte professionnelle avec badge icône ───────
  const toastTheme = {
    error: {
      border: '#fecaca',
      badgeBg: '#fee2e2',
      iconColor: '#d55053',
      title: 'Erreur',
      icon: AlertCircle,
    },
    success: {
      border: '#bbf0cf',
      badgeBg: '#e9f8e7',
      iconColor: '#2f9e5b',
      title: 'Succès',
      icon: CheckCircle2,
    },
    warning: {
      border: '#fde3b8',
      badgeBg: '#fef3e2',
      iconColor: '#c2872e',
      title: 'Attention',
      icon: AlertTriangle,
    },
    info: {
      border: '#c2e0e2',
      badgeBg: '#e7f4f4',
      iconColor: '#356267',
      title: 'Information',
      icon: Info,
    },
  };

  const renderToast = () => {
    if (!showMessage) return null;
    const theme = toastTheme[message.type] || toastTheme.info;
    const Icon = theme.icon;
    return (
      <div
        className="toast-anim fixed top-5 left-1/2 z-[9999] w-[calc(100%-32px)] max-w-sm -translate-x-1/2"
        role="alert"
      >
        <div
          className="flex items-start gap-3 rounded-2xl border bg-white px-4 py-4 shadow-[0_18px_45px_rgba(16,33,75,0.16)]"
          style={{ borderColor: theme.border }}
        >
          <div
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full"
            style={{ background: theme.badgeBg }}
          >
            <Icon size={18} style={{ color: theme.iconColor }} />
          </div>
          <div className="flex-1 pt-0.5">
            <p className="text-[13px] font-bold leading-none text-[#10214b]">
              {theme.title}
            </p>
            <p className="mt-1.5 text-[13px] leading-snug text-[#356267]/85">
              {message.text}
            </p>
          </div>
          <button
            onClick={() => setShowMessage(false)}
            aria-label="Fermer le message"
            className="flex-shrink-0 rounded-full p-1 text-[#94a3b8] transition-colors hover:bg-[#f1f5f9] hover:text-[#10214b]"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    );
  };

  // Logo réutilisé sur les 3 écrans (inchangé : même icône, même nom "FinanceApp")
  const renderLogo = () => (
    <div className="flex items-center gap-3">
      <div
        className="relative flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center overflow-hidden rounded-xl"
        style={{
          background: 'linear-gradient(135deg, #0c2e7c, #1e4db7, #3b82f6)',
          boxShadow: '0 4px 15px rgba(59,130,246,0.4)',
        }}
      >
        <div
          className="pointer-events-none absolute h-[30px] w-[30px] rounded-full"
          style={{ top: -15, left: -15, background: 'rgba(255,255,255,0.2)', transform: 'rotate(45deg)' }}
        />
        <div
          className="pointer-events-none absolute h-[25px] w-[25px] rounded-full"
          style={{ bottom: -10, right: -10, background: 'rgba(255,255,255,0.15)' }}
        />
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 13L8 8L13 13L21 5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M21 12V19H3V5H12" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="18" cy="8" r="2" stroke="#fff" strokeWidth="1.5"/>
          <path d="M8 11L8 16" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2"/>
        </svg>
      </div>
      <div className="flex flex-col leading-tight">
        <span className="text-[18px] font-extrabold tracking-tight text-[#0c2e7c]">
          Finance<span className="text-[#3b82f6]">App</span>
        </span>
        <span className="text-[8px] font-medium uppercase tracking-[0.3px] text-[#94a3b8]">
          Smart Finance
        </span>
      </div>
    </div>
  );

  // ── Fond de page harmonisé avec AuthChoix.js : blanc + carrés verts ────────
  const pageWrap = 'min-h-screen flex items-center justify-center px-4 py-10 sm:py-16 relative overflow-hidden bg-white';

  const renderGlow = () => (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Cercles dégradés flous, identiques dans l'esprit à AuthChoix.js */}
      <div className="absolute -top-40 -left-32 h-[560px] w-[560px] rounded-full bg-[#003152] opacity-[0.08] blur-3xl" />
      <div className="absolute top-1/3 -right-40 h-[620px] w-[620px] rounded-full bg-[#FDBF20] opacity-[0.07] blur-3xl" />
      <div className="absolute bottom-0 left-1/4 h-[480px] w-[480px] rounded-full bg-[#356267] opacity-[0.06] blur-3xl" />

      {/* Carrés verts décoratifs, un peu plus visibles pour rester lisibles */}
      {CARRES_FOND.map((c, i) => (
        <div
          key={i}
          className="absolute rounded-lg"
          style={{
            top: c.top,
            left: c.left,
            width: c.size,
            height: c.size,
            background: '#02F5A1',
            opacity: 0.09,
            transform: `rotate(${c.rotate}deg)`,
          }}
        />
      ))}
    </div>
  );

  // ─── ÉTAPE 3 : INVITATION À LA VÉRIFICATION KYC ──────────────────────────────
  if (etape === 3) {
    return (
      <div className={pageWrap}>
        {sharedHead}
        {renderToast()}
        {renderGlow()}

        <div className="card-anim relative z-10 w-full max-w-[440px] rounded-3xl bg-white px-6 py-10 text-center shadow-[0_24px_80px_rgba(0,49,82,0.16)] border border-[#E4E9EC] sm:px-9">
          <div className="flex justify-center">{renderSteps(3)}</div>

          <div className="mx-auto my-6 flex h-[76px] w-[76px] items-center justify-center rounded-full bg-[#356267] shadow-[0_10px_26px_rgba(53,98,103,0.32)]">
            <ShieldAlert size={34} className="text-white" strokeWidth={2} />
          </div>

          <h2 className="text-[22px] font-extrabold tracking-tight text-[#10214b]">
            Validez votre compte via la vérification KYC
          </h2>

          <p className="mt-3.5 text-[13.5px] leading-relaxed text-[#356267]/75">
            Pour protéger votre compte et garantir la sécurité de vos transactions financières,
            cette étape rapide consiste à scanner une pièce d'identité ou un passeport
            et confirmer votre visage — elle nous permet de prévenir
            la fraude et de respecter les normes bancaires en vigueur.
          </p>

          <div className="my-5 flex items-start gap-2.5 rounded-xl border border-[#c2f2f2] bg-[#e9f8e7]/40 px-4 py-3.5 text-left">
            <LockKeyhole size={18} className="mt-0.5 flex-shrink-0 text-[#356267]" />
            <span className="text-[12.5px] leading-relaxed text-[#356267]">
              Vos données sont chiffrées et utilisées uniquement à des fins de vérification.
              Cette étape ne prend que quelques minutes.
            </span>
          </div>

          <button
            onClick={handleAccederKYC}
            className="flex w-full min-h-[52px] items-center justify-center gap-2 rounded-2xl bg-[#356267] px-4 text-[15px] font-bold text-white shadow-[0_4px_15px_rgba(53,98,103,0.3)] transition-all hover:-translate-y-0.5 hover:bg-[#2a4f53]"
          >
            <ShieldCheck size={18} />
            Accéder à la vérification KYC
          </button>

          <p className="mt-4 text-[11.5px] text-[#356267]/45">
            Connecté avec <strong className="font-bold text-[#356267]">{userEmail}</strong>
          </p>
        </div>
      </div>
    );
  }

  // ─── ÉTAPE 2 : VÉRIFICATION EMAIL ────────────────────────────────────────────
  if (etape === 2) {
    return (
      <div className={pageWrap}>
        {sharedHead}
        {renderToast()}
        {renderGlow()}

        <div className="card-anim relative z-10 w-full max-w-[420px] rounded-3xl bg-white px-6 py-10 shadow-[0_24px_80px_rgba(0,49,82,0.16)] border border-[#E4E9EC] sm:px-9">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#94a3b8] transition-colors hover:text-[#356267]"
          >
            <ArrowLeft size={15} />
            Retour
          </Link>

          <div className="mb-2 mt-5 text-center">
            <div className="mx-auto mb-4 flex h-[68px] w-[68px] items-center justify-center rounded-full bg-[#356267] shadow-[0_8px_22px_rgba(53,98,103,0.3)]">
              <Mail size={28} className="text-white" />
            </div>
            <h2 className="text-[22px] font-extrabold tracking-tight text-[#10214b]">
              Vérifiez votre email
            </h2>
            <p className="mt-2 text-[13px] leading-relaxed text-[#356267]/75">
              Un code de confirmation a été envoyé à<br />
              <strong className="font-bold text-[#356267]">{userEmail}</strong>
            </p>
            <div className="mt-4 flex justify-center">{renderSteps(2)}</div>
          </div>

          <div className="my-6 h-px bg-[#f1f5f9]" />

          <form onSubmit={handleVerifierCode} className="flex flex-col gap-5">
            <div>
              <label className={fieldLabel}>
                <KeyRound size={12} />
                Code de confirmation (6 chiffres)
              </label>
              <div className="relative">
                <input
                  type={showCode ? 'text' : 'password'}
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="• • • • • •"
                  required
                  className="w-full box-border rounded-[10px] border border-[rgba(16,33,75,0.08)] bg-[#f8fafc] py-4 pl-5 pr-12 text-center font-mono text-2xl font-extrabold tracking-[9px] text-[#356267] outline-none transition-colors duration-150 placeholder:tracking-[6px] placeholder:text-[#cbd5e1] focus:border-[#356267] focus:bg-white focus:ring-4 focus:ring-[#356267]/10"
                />
                <button
                  type="button"
                  onClick={() => setShowCode(v => !v)}
                  className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center text-[#94a3b8] transition-colors hover:text-[#356267]"
                >
                  {showCode ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full min-h-[52px] items-center justify-center gap-2 rounded-2xl bg-[#356267] px-4 text-[15px] font-bold text-white shadow-[0_4px_15px_rgba(53,98,103,0.3)] transition-all hover:enabled:-translate-y-0.5 hover:enabled:bg-[#2a4f53] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Vérification...
                </>
              ) : (
                <>
                  <ShieldCheck size={17} />
                  Vérifier le code
                </>
              )}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={handleRenvoyerCode}
                disabled={loading}
                className="inline-flex items-center gap-1.5 border-none bg-transparent text-[13px] font-semibold text-[#356267] transition-colors hover:text-[#2a4f53] hover:underline disabled:opacity-60"
              >
                <RefreshCw size={15} />
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
    <div className={pageWrap}>
      {sharedHead}
      {renderToast()}
      {renderGlow()}

      <div className="card-anim relative z-10 w-full max-w-[480px] rounded-3xl bg-white px-6 py-9 shadow-[0_24px_80px_rgba(0,49,82,0.16)] border border-[#E4E9EC] sm:px-8">

        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#94a3b8] transition-colors hover:text-[#356267]"
        >
          <ArrowLeft size={15} />
          Retour
        </Link>

        <div className="mt-5 flex items-start justify-between gap-3">
          <div>
            {renderLogo()}
            <h2 className="mt-4 text-[21px] font-extrabold tracking-tight text-[#10214b]">
              Créer un compte
            </h2>
            {renderSteps(1)}
          </div>

          <div
            className="flex h-[54px] w-[54px] flex-shrink-0 items-center justify-center rounded-full border-2 text-[17px] font-extrabold text-white"
            style={{
              background: initiales === '?' ? '#f8fafc' : avatarBg,
              borderColor: initiales === '?' ? '#e2e8f0' : `${avatarBg}55`,
              boxShadow: initiales === '?' ? 'none' : `0 4px 14px ${avatarBg}44`,
            }}
          >
            {initiales === '?' ? <User size={22} className="text-[#cbd5e1]" /> : initiales}
          </div>
        </div>

        <div className="my-6 h-px bg-[#f1f5f9]" />

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          {/* Prénom / Nom */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={fieldLabel}>
                <User size={12} /> Prénom
              </label>
              <div className="relative">
                <User size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                <input
                  value={form.prenom}
                  onChange={e => handleFieldChange('prenom', e.target.value)}
                  onBlur={() => setTouched({...touched, prenom: true})}
                  placeholder="Votre prénom"
                  required
                  className={`${inputBase} ${inputBorder(touched.prenom && errors.prenom)} pl-11 pr-3.5`}
                />
              </div>
              {fieldError(touched.prenom && errors.prenom)}
            </div>
            <div>
              <label className={fieldLabel}>
                <CreditCard size={12} /> Nom
              </label>
              <div className="relative">
                <CreditCard size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                <input
                  value={form.nom}
                  onChange={e => handleFieldChange('nom', e.target.value)}
                  onBlur={() => setTouched({...touched, nom: true})}
                  placeholder="Votre nom"
                  required
                  className={`${inputBase} ${inputBorder(touched.nom && errors.nom)} pl-11 pr-3.5`}
                />
              </div>
              {fieldError(touched.nom && errors.nom)}
            </div>
          </div>

          {/* Téléphone */}
          <div>
            <label className={fieldLabel}>
              <Phone size={12} />
              Téléphone
            </label>
            <div className="relative">
              <Phone size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
              <input
                value={form.telephone}
                onChange={e => handleFieldChange('telephone', e.target.value)}
                onBlur={() => setTouched({...touched, telephone: true})}
                placeholder="+222XXXXXXXX"
                required
                maxLength={12}
                className={`${inputBase} ${inputBorder(touched.telephone && errors.telephone)} pl-11 pr-3.5`}
              />
            </div>
            {fieldError(touched.telephone && errors.telephone)}
          </div>

          {/* Email */}
          <div>
            <label className={fieldLabel}>
              <Mail size={12} />
              Email
            </label>
            <div className="relative">
              <Mail size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
              <input
                type="email"
                value={form.email}
                onChange={e => handleFieldChange('email', e.target.value)}
                onBlur={() => setTouched({...touched, email: true})}
                placeholder="vous@gmail.com"
                required
                className={`${inputBase} ${inputBorder(touched.email && errors.email)} pl-11 pr-3.5`}
              />
            </div>
            {fieldError(touched.email && errors.email)}
          </div>

          {/* Mot de passe */}
          <div>
            <label className={fieldLabel}>
              <Lock size={12} />
              Mot de passe
            </label>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                value={form.password}
                onChange={e => handleFieldChange('password', e.target.value)}
                onBlur={() => setTouched({...touched, password: true})}
                placeholder="••••••••"
                required
                minLength={6}
                className={`${inputBase} ${inputBorder(touched.password && errors.password)} pl-4 pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowPwd(v => !v)}
                className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center text-[#94a3b8] transition-colors hover:text-[#356267]"
              >
                {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {fieldError(touched.password && errors.password)}
          </div>

          {/* Confirmer mot de passe */}
          <div>
            <label className={fieldLabel}>
              <Lock size={12} />
              Confirmer le mot de passe
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={form.password_confirm}
                onChange={e => handleFieldChange('password_confirm', e.target.value)}
                onBlur={() => setTouched({...touched, password_confirm: true})}
                placeholder="••••••••"
                required
                className={`${inputBase} ${inputBorder(touched.password_confirm && errors.password_confirm)} pl-4 pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(v => !v)}
                className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center text-[#94a3b8] transition-colors hover:text-[#356267]"
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {fieldError(touched.password_confirm && errors.password_confirm)}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex w-full min-h-[52px] items-center justify-center gap-2 rounded-2xl bg-[#356267] px-4 text-[15px] font-bold text-white shadow-[0_4px_15px_rgba(53,98,103,0.3)] transition-all hover:enabled:-translate-y-0.5 hover:enabled:bg-[#2a4f53] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Création en cours...
              </>
            ) : (
              <>
                Continuer
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 border-t border-[#f1f5f9] pt-4 text-center">
          <p className="text-[13px] text-[#356267]/75">
            Déjà un compte ?{' '}
            <Link
              to="/connexion"
              className="inline-flex items-center gap-1 font-bold text-[#356267] transition-colors hover:text-[#2a4f53]"
            >
              <LogIn size={14} />
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}