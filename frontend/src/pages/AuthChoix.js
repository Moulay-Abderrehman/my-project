import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
  Menu,
  X,
  Sun,
  Moon,
  ArrowRight,
  ArrowLeft,
  Mail,
  Search,
  Loader2,
  AlertTriangle,
  Info,
  Building2,
  ShieldCheck,
  Lock,
  Fingerprint,
  Server,
  TrendingUp,
  TrendingDown,
  Wallet,
  PieChart,
  Users,
  CheckCircle2,
  Sparkles,
  LayoutDashboard,
  BarChart3,
  Coins,
  Layers,
  ArrowUpRight,
  UserPlus,
  Target,
  LineChart,
  BadgeCheck,
  ArrowLeftRight,
  Clock,
  Smile,
  Bell,
  FileDown,
  LogIn,
} from 'lucide-react';

// ─── Google OAuth helper (inchangé) ──────────────────────────────────────────
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';

function LogoMark({ dark = false, small = false }) {
  const size = small ? 32 : 38;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      {/* Logo — Moderne et fantastique */}
      <div
        className="logo-icon"
        style={{
          width: size,
          height: size,
          borderRadius: 12,
          background: 'linear-gradient(135deg, #0c2e7c, #1e4db7, #3b82f6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 15px rgba(59,130,246,0.4)',
          position: 'relative',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        {/* Effet de brillance */}
        <div
          style={{
            position: 'absolute',
            top: -15,
            left: -15,
            width: 30,
            height: 30,
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '50%',
            transform: 'rotate(45deg)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -10,
            right: -10,
            width: 25,
            height: 25,
            background: 'rgba(255,255,255,0.15)',
            borderRadius: '50%',
          }}
        />
        {/* Logo SVG — Graphique financier moderne */}
        <svg width={small ? 18 : 22} height={small ? 18 : 22} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 13L8 8L13 13L21 5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M21 12V19H3V5H12" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="18" cy="8" r="2" stroke="#fff" strokeWidth="1.5" />
          <path d="M8 11L8 16" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2" />
        </svg>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
        <span
          className="fp-display"
          style={{ fontWeight: 800, fontSize: small ? 16 : 18, letterSpacing: '-0.3px', color: dark ? '#ffffff' : '#0c2e7c' }}
        >
          Finance<span style={{ color: '#3b82f6' }}>App</span>
        </span>
        <span
          className="fp-body"
          style={{ fontSize: 8, letterSpacing: '0.3px', fontWeight: 600, color: dark ? 'rgba(255,255,255,0.65)' : '#356267' }}
        >
          Smart Finance
        </span>
      </div>
    </div>
  );
}

// ─── Modules FinanceApp présentés dans le Bento Grid ─────────────────────────
const MODULES = [
  {
    icon: TrendingUp,
    titre: 'Trésorerie en temps réel',
    texte: "Visualisez vos flux entrants et sortants à l'instant T, sans latence de rapprochement bancaire.",
    taille: 'grand',
  },
  {
    icon: ArrowLeftRight,
    titre: 'Création de transactions',
    texte: 'Enregistrez chaque entrée et chaque sortie en quelques secondes, avec catégorie et description.',
    taille: 'moyen',
  },
  {
    icon: PieChart,
    titre: 'Budgets par département',
    texte: 'Plafonds, alertes de dépassement et suivi de complétion pour chaque équipe.',
    taille: 'moyen',
  },
  {
    icon: Layers,
    titre: 'Catégorisation intelligente',
    texte: 'Chaque dépense est classée automatiquement pour une lecture instantanée de vos postes de coût.',
    taille: 'moyen',
  },
  {
    icon: FileDown,
    titre: 'Export des transactions',
    texte: "Générez un export PDF de votre historique — global, par période ou par employé.",
    taille: 'moyen',
  },
  {
    icon: Bell,
    titre: 'Notifications & alertes',
    texte: 'Soyez prévenu en temps réel dès qu’un budget approche ou dépasse son plafond.',
    taille: 'moyen',
  },
  {
    icon: BarChart3,
    titre: 'Graphiques financiers',
    texte: 'Entrées vs sorties, évolution du solde, répartition par catégorie : tout est visuel.',
    taille: 'moyen',
  },
  {
    icon: Users,
    titre: 'Employés & plafonds',
    texte: "Gérez les accès et les limites de paiement de chaque collaborateur depuis un seul tableau de bord.",
    taille: 'grand',
  },
];

// ─── Offres tarifaires (référencées par l'ancre "Tarification" de la navbar) ─
const OFFRES = [
  {
    nom: 'Essai',
    prix: 'Gratuit',
    periode: '14 jours',
    avantages: ['Suivi des transactions', '2 budgets actifs', 'Support communautaire'],
    mise_en_avant: false,
  },
  {
    nom: 'Standard',
    prix: '—',
    periode: 'à partir de',
    avantages: ['Budgets illimités', 'Export PDF des transactions', 'Paiement TrackPay automatique'],
    mise_en_avant: true,
  },
  {
    nom: 'Entreprise',
    prix: '—',
    periode: 'sur devis',
    avantages: ['Gestion des employés', 'Plafonds de paiement par rôle', 'Export comptable avancé'],
    mise_en_avant: false,
  },
];

// ─── Étapes "Votre parcours FinanceApp" (spécifique à l'application) ─────────
const ETAPES = [
  {
    n: '01',
    icon: UserPlus,
    titre: 'Créez votre profil',
    texte: 'Inscrivez-vous et vérifiez votre identité (KYC) en quelques minutes pour activer votre compte.',
  },
  {
    n: '02',
    icon: ArrowLeftRight,
    titre: 'Enregistrez vos transactions',
    texte: 'Saisissez vos entrées et vos sorties d’argent : votre solde se met à jour automatiquement.',
  },
  {
    n: '03',
    icon: Target,
    titre: 'Définissez vos budgets',
    texte: "Fixez des plafonds par catégorie et recevez une alerte dès qu'un seuil est approché.",
  },
  {
    n: '04',
    icon: LineChart,
    titre: 'Analysez et optimisez',
    texte: 'Suivez votre trésorerie en temps réel sur des tableaux de bord clairs et ajustez votre stratégie.',
  },
];

// ─── Ce que FinanceApp garantit (exigences non fonctionnelles clés) ─────────
const GARANTIES = [
  {
    icon: Clock,
    titre: 'Disponibilité',
    texte: 'Une plateforme accessible 24h/24 et 7j/7, pour consulter votre solde où que vous soyez.',
  },
  {
    icon: Smile,
    titre: 'Convivialité',
    texte: 'Une interface ergonomique, pensée pour être utilisée sans compétences en comptabilité.',
  },
  {
    icon: BadgeCheck,
    titre: 'Fiabilité',
    texte: 'Des calculs de soldes et de budgets exacts, mis à jour automatiquement à chaque transaction.',
  },
];

// ─── Carrés décoratifs très discrets pour le fond en mode clair ─────────────
const CARRES_FOND = [
  { top: '6%', left: '8%', size: 70, color: 'var(--mint)', rotate: 12 },
  { top: '14%', left: '82%', size: 46, color: 'var(--gold)', rotate: -8 },
  { top: '28%', left: '22%', size: 34, color: 'var(--primary)', rotate: 20 },
  { top: '38%', left: '68%', size: 90, color: 'var(--navy)', rotate: -14 },
  { top: '52%', left: '4%', size: 52, color: 'var(--gold)', rotate: 6 },
  { top: '62%', left: '90%', size: 40, color: 'var(--mint)', rotate: -20 },
  { top: '74%', left: '35%', size: 64, color: 'var(--primary)', rotate: 10 },
  { top: '86%', left: '60%', size: 48, color: 'var(--navy)', rotate: -6 },
  { top: '92%', left: '15%', size: 36, color: 'var(--gold)', rotate: 18 },
  { top: '18%', left: '48%', size: 30, color: 'var(--mint)', rotate: -10 },
  { top: '10%', left: '32%', size: 42, color: 'var(--mint)', rotate: 22 },
  { top: '24%', left: '92%', size: 34, color: 'var(--mint)', rotate: -16 },
  { top: '34%', left: '12%', size: 56, color: 'var(--mint)', rotate: 8 },
  { top: '46%', left: '58%', size: 38, color: 'var(--mint)', rotate: -12 },
  { top: '58%', left: '24%', size: 46, color: 'var(--mint)', rotate: 15 },
  { top: '68%', left: '76%', size: 60, color: 'var(--mint)', rotate: -18 },
  { top: '80%', left: '42%', size: 32, color: 'var(--mint)', rotate: 24 },
  { top: '96%', left: '78%', size: 44, color: 'var(--mint)', rotate: -9 },
  { top: '4%', left: '58%', size: 28, color: 'var(--mint)', rotate: 14 },
  { top: '44%', left: '2%', size: 36, color: 'var(--mint)', rotate: -22 },
];

export default function AuthChoix() {
  // ═══════════════════════════════════════════════════════════════════════
  // LOGIQUE MÉTIER EXISTANTE — STRICTEMENT INCHANGÉE
  // ═══════════════════════════════════════════════════════════════════════
  const navigate = useNavigate();
  const { enterVisitorMode } = useAuth();
  const [mode, setMode] = useState('choix'); // 'choix' | 'sso'
  const [domaine, setDomaine] = useState('financeapp.com');
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingSSO, setLoadingSSO] = useState(false);
  const [loadingVisitor, setLoadingVisitor] = useState(false);

  // ── États pour les messages personnalisés (inchangé) ─────────────────────
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showMessage, setShowMessage] = useState(false);

  const showCustomMessage = (type, text) => {
    setMessage({ type, text });
    setShowMessage(true);
    setTimeout(() => {
      setShowMessage(false);
    }, 5000);
  };

  const continuerGoogle = () => {
    if (!GOOGLE_CLIENT_ID) {
      showCustomMessage('error', "Google OAuth n'est pas configuré. Configurez REACT_APP_GOOGLE_CLIENT_ID.");
      return;
    }
    setLoadingGoogle(true);
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: `${window.location.origin}/auth/google/callback`,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'select_account',
    });
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  };

  const continuerEmail = () => {
    navigate('/connexion');
  };

  const continuerSSO = async (e) => {
    e.preventDefault();
    if (!domaine.trim()) {
      showCustomMessage('error', 'Entrez votre domaine ou email professionnel.');
      return;
    }

    const d = domaine.toLowerCase().trim();
    const dom = d.includes('@') ? d.split('@')[1] : d;

    setLoadingSSO(true);

    try {
      const response = await api.get(`/comptes/auth/sso/?domain=${dom}`);
      console.log('[SSO] Réponse:', response.data);
      if (response.data && response.data.auth_url) {
        window.location.href = response.data.auth_url;
      } else {
        showCustomMessage('error', 'Erreur de configuration SSO.');
        setLoadingSSO(false);
      }
    } catch (error) {
      console.error('[SSO] Erreur détaillée:', error);
      console.error('[SSO] Response:', error.response);
      showCustomMessage('error', error.response?.data?.error || 'Impossible de contacter le serveur SSO. Réessayez plus tard.');
      setLoadingSSO(false);
    }
  };

  const explorerSansCompte = async () => {
    setLoadingVisitor(true);
    try {
      await enterVisitorMode();
      navigate('/dashboard');
    } catch (error) {
      console.error('[Visiteur] Erreur:', error);
      showCustomMessage('error', error.response?.data?.message || "Impossible d'activer le mode exploration. Réessayez.");
      setLoadingVisitor(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════
  // ÉTATS UI — LANDING PAGE UNIQUEMENT (aucune logique métier ici)
  // ═══════════════════════════════════════════════════════════════════════
  const [darkMode, setDarkMode] = useState(false);
  const [menuMobileOuvert, setMenuMobileOuvert] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Ouvre la modale d'authentification en réinitialisant sa vue interne
  const ouvrirAuthModal = () => {
    setMode('choix');
    setMenuMobileOuvert(false);
    setShowAuthModal(true);
  };
  const fermerAuthModal = () => setShowAuthModal(false);

  // Bloque le scroll du body pendant que la modale est ouverte
  useEffect(() => {
    document.body.style.overflow = showAuthModal ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [showAuthModal]);

  // Effet "navbar solide au scroll"
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Défilement fluide vers une section ancrée
  const scrollVers = (id) => {
    setMenuMobileOuvert(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Redirection vers la page de connexion
  const allerVersConnexion = () => {
    setMenuMobileOuvert(false);
    navigate('/connexion');
  };

  // ── Classes conditionnelles réutilisables (dark / light) ────────────────
  const rootBg = darkMode ? 'bg-[var(--black)] text-white' : 'bg-white text-[var(--navy)]';
  const surfaceBg = darkMode
    ? 'bg-[var(--teal)]/40 border border-white/10'
    : 'bg-white border border-[var(--border)]';
  const mutedText = darkMode ? 'text-white/50' : 'text-[var(--textSecondary)]';
  const navBg = scrolled
    ? darkMode
      ? 'bg-[var(--black)]/85 border-b border-white/10 backdrop-blur-md'
      : 'bg-white/85 border-b border-[var(--border)] backdrop-blur-md'
    : 'bg-transparent border-b border-transparent';

  return (
    <div className={`${rootBg} min-h-screen w-full relative overflow-x-hidden transition-colors duration-500`}>
      {/* ── Polices + variables de design (palette FinanceApp) ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Outfit:wght@500;600;700;800&display=swap');
        :root {
          --navy: #003152;
          --teal: #003333;
          --mint: #02F5A1;
          --black: #07191E;
          --gold: #FDBF20;
          --bg: #F5F7F8;
          --border: #E4E9EC;
          --textSecondary: #5B6E76;
          --textMuted: #93A3A9;
          --danger: #E5484D;
          --dangerSoft: rgba(213,80,83,0.08);
          --dangerBorder: rgba(213,80,83,0.25);
          --primary: #356267;
          --primaryDark: #2a4f53;
          --primarySoft: #c2f2f2;
          --success: #4ea674;
          --successAlt: #459071;
          --successSoft: #e9f8e7;
          --navyDeep: #10214b;
          --cream: #f8fafc;
          --radius: 16px;
          --radiusSm: 10px;
        }
        .fp-display { font-family: 'Outfit', sans-serif; }
        .fp-body { font-family: 'DM Sans', sans-serif; }
      `}</style>

      {/* ── Fond décoratif : dégradés circulaires flous (pas de grille clichée) ── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div
          className={`absolute -top-40 -left-32 w-[560px] h-[560px] rounded-full blur-3xl opacity-[0.08] ${
            darkMode ? 'bg-[var(--mint)]' : 'bg-[var(--navy)]'
          }`}
        />
        <div
          className={`absolute top-1/3 -right-40 w-[620px] h-[620px] rounded-full blur-3xl opacity-[0.07] ${
            darkMode ? 'bg-[var(--gold)]' : 'bg-[var(--gold)]'
          }`}
        />
        <div
          className={`absolute bottom-0 left-1/4 w-[480px] h-[480px] rounded-full blur-3xl opacity-[0.06] ${
            darkMode ? 'bg-[var(--primary)]' : 'bg-[var(--primary)]'
          }`}
        />

        {/* Carrés discrets de couleurs variées — uniquement en mode clair */}
        {!darkMode &&
          CARRES_FOND.map((c, i) => (
            <div
              key={i}
              className="absolute rounded-lg"
              style={{
                top: c.top,
                left: c.left,
                width: c.size,
                height: c.size,
                background: c.color,
                opacity: 0.05,
                transform: `rotate(${c.rotate}deg)`,
              }}
            />
          ))}
      </div>

      {/* ── Toast de message personnalisé (logique inchangée) ─────────────── */}
      <AnimatePresence>
        {showMessage && (
          <motion.div
            initial={{ opacity: 0, y: -24, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -16, x: '-50%' }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed top-5 left-1/2 z-[9999] w-[92%] max-w-md"
          >
            <div
              className="flex items-center gap-3 rounded-2xl px-4 py-3.5 shadow-2xl border fp-body"
              style={
                message.type === 'error'
                  ? { background: 'var(--dangerSoft)', borderColor: 'var(--dangerBorder)', color: 'var(--danger)' }
                  : { background: 'var(--primarySoft)', borderColor: 'var(--primary)', color: 'var(--navy)' }
              }
            >
              {message.type === 'error' ? (
                <AlertTriangle size={20} className="shrink-0" style={{ color: 'var(--danger)' }} />
              ) : (
                <Info size={20} className="shrink-0" style={{ color: 'var(--primary)' }} />
              )}
              <span className="flex-1 text-sm font-semibold">{message.text}</span>
              <button
                onClick={() => setShowMessage(false)}
                className="p-1 rounded-full hover:bg-black/5 transition-colors"
                aria-label="Fermer le message"
              >
                <X size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════════════
          NAVBAR FIXE
      ═══════════════════════════════════════════════════════════════════ */}
      <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${navBg}`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
          {/* Logo — identique partout, toujours clair et lisible */}
          <LogoMark dark={darkMode} />

          {/* Liens d'ancrage (desktop) */}
          <nav className="hidden md:flex items-center gap-8 fp-body text-sm font-medium">
            {[
              { id: 'fonctionnalites', label: 'Fonctionnalités' },
              { id: 'securite', label: 'Sécurité' },
              { id: 'tarification', label: 'Tarification' },
              { id: 'contact', label: 'Contact' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => scrollVers(item.id)}
                className={`transition-colors hover:!text-[var(--primary)] ${mutedText}`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Actions à droite */}
          <div className="flex items-center gap-2">
            {/* Se connecter */}
            <button
              onClick={allerVersConnexion}
              className={`h-10 px-4 rounded-full flex items-center gap-1.5 text-sm font-semibold fp-body transition-colors ${
                darkMode ? 'hover:bg-white/10 text-white' : 'hover:bg-slate-100 text-[var(--textSecondary)]'
              }`}
            >
              <LogIn size={16} />
              Se connecter
            </button>

            {/* CTA principal */}
            <button
              onClick={ouvrirAuthModal}
              className="ml-1 h-10 px-5 rounded-full text-white text-sm font-semibold fp-body shadow-lg transition-all hover:-translate-y-0.5 hidden sm:inline-flex items-center gap-1.5"
              style={{ background: 'linear-gradient(90deg, var(--navy), var(--primary))', boxShadow: '0 10px 25px -8px rgba(0,49,82,0.45)' }}
            >
              Démarrer
              <ArrowRight size={15} />
            </button>

            {/* Menu mobile */}
            <button
              onClick={() => setMenuMobileOuvert((v) => !v)}
              className="md:hidden w-10 h-10 rounded-full flex items-center justify-center"
              aria-label="Ouvrir le menu"
            >
              {menuMobileOuvert ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Panneau mobile */}
        <AnimatePresence>
          {menuMobileOuvert && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className={`md:hidden overflow-hidden border-t ${darkMode ? 'border-white/10 bg-[var(--black)]' : 'border-[var(--border)] bg-white'}`}
            >
              <div className="px-6 py-4 flex flex-col gap-3 fp-body text-sm font-medium">
                {[
                  { id: 'fonctionnalites', label: 'Fonctionnalités' },
                  { id: 'securite', label: 'Sécurité' },
                  { id: 'tarification', label: 'Tarification' },
                  { id: 'contact', label: 'Contact' },
                ].map((item) => (
                  <button key={item.id} onClick={() => scrollVers(item.id)} className={`text-left py-1.5 ${mutedText}`}>
                    {item.label}
                  </button>
                ))}
                <button
                  onClick={allerVersConnexion}
                  className={`mt-1 h-11 rounded-full font-semibold flex items-center justify-center gap-1.5 border ${
                    darkMode ? 'border-white/15 text-white' : 'border-[var(--border)] text-[var(--navy)]'
                  }`}
                >
                  <LogIn size={16} />
                  Se connecter
                </button>
                <button
                  onClick={ouvrirAuthModal}
                  className="mt-2 h-11 rounded-full text-white font-semibold flex items-center justify-center gap-1.5"
                  style={{ background: 'linear-gradient(90deg, var(--navy), var(--primary))' }}
                >
                  Démarrer
                  <ArrowRight size={15} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION HERO — disposition asymétrique
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10 pt-36 pb-24 grid lg:grid-cols-[1.1fr_0.9fr] gap-16 items-center">
        {/* Colonne texte */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          {/*<div
            className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 mb-6 text-xs font-semibold fp-body border"
            style={{ background: darkMode ? 'rgba(253,191,32,0.08)' : '#FFF7E3', color: '#8a6300', borderColor: darkMode ? 'rgba(253,191,32,0.25)' : '#FBE7B2' }}
          >
            <Sparkles size={13} />
            Gestion financière intelligente
          </div>*/}

          <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.5 }}
              className="flex items-center gap-2.5 rounded-2xl p-3.5 border"
              style={{ background: 'var(--successSoft)', borderColor: 'var(--success)' }}
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: 'var(--success)' }} />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ background: 'var(--success)' }} />
              </span>
              <span className="text-xs fp-body font-medium" style={{ color: 'var(--successAlt)' }}>
                Gestion financière intelligente
              </span>
          </motion.div>

          <h1 className="fp-display font-extrabold tracking-tight text-[clamp(2.4rem,5vw,3.6rem)] leading-[1.05] mb-6">
            La gestion de votre trésorerie,
            <span
              className="block bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(90deg, var(--navy), var(--primary), var(--mint))' }}
            >
              clarifiée et automatisée
            </span>
            pour demain.
          </h1>

          <p className={`text-lg leading-relaxed max-w-xl mb-9 fp-body ${mutedText}`}>
            FinanceApp centralise le suivi de vos flux, la gestion de vos budgets et la prévision de vos soldes —
            pour que chaque décision financière s'appuie sur des chiffres à jour, pas sur des estimations.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={ouvrirAuthModal}
              className="h-13 px-7 py-3.5 rounded-full text-white font-semibold fp-body shadow-xl transition-all hover:-translate-y-0.5 flex items-center gap-2"
              style={{ background: 'linear-gradient(90deg, var(--navy), var(--primary))', boxShadow: '0 14px 30px -10px rgba(0,49,82,0.5)' }}
            >
              Démarrer gratuitement
              <ArrowRight size={17} />
            </button>
            <button
              onClick={allerVersConnexion}
              className={`h-13 px-7 py-3.5 rounded-full font-semibold fp-body border transition-colors flex items-center gap-2 ${
                darkMode ? 'border-white/15 hover:bg-white/5 text-white' : 'border-[var(--border)] hover:bg-slate-50 text-[var(--navy)]'
              }`}
            >
              <LogIn size={17} />
              Se connecter
            </button>
            <button
              onClick={() => scrollVers('fonctionnalites')}
              className={`px-6 py-3.5 rounded-full font-semibold fp-body border transition-colors ${
                darkMode ? 'border-white/15 hover:bg-white/5 text-white' : 'border-[var(--border)] hover:bg-slate-50 text-[var(--navy)]'
              }`}
            >
              Découvrir les modules
            </button>
          </div>

          <div className="flex items-center gap-8 mt-12">
            {[
              { val: '10k+', label: 'Utilisateurs' },
              { val: '99.9%', label: 'Disponibilité' },
              { val: '256-bit', label: 'Chiffrement' },
            ].map((s) => (
              <div key={s.val}>
                <div className="fp-display font-bold text-2xl">{s.val}</div>
                <div className={`text-xs mt-0.5 fp-body ${mutedText}`}>{s.label}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Colonne "aperçu du tableau de bord" — inspiré du dashboard réel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="relative"
        >
          <div className={`rounded-3xl p-6 shadow-2xl ${surfaceBg}`}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <LayoutDashboard size={16} style={{ color: 'var(--primary)' }} />
                <span className="fp-body font-semibold text-sm">Aperçu du tableau de bord</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: 'var(--mint)' }} />
                  <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: 'var(--mint)' }} />
                </span>
                <span className={`text-xs fp-body ${mutedText}`}>En direct</span>
              </div>
            </div>

            {/* Ligne de mini-statistiques */}
            <div className="grid grid-cols-3 gap-2.5 mb-4">
              {[
                { label: 'Solde', val: '92 750 MRU', icon: Wallet },
                { label: 'Entrées', val: '412 400', icon: TrendingUp },
                { label: 'Sorties', val: '319 650', icon: TrendingDown },
              ].map((s) => (
                <div key={s.label} className={`rounded-xl p-2.5 ${darkMode ? 'bg-white/5' : 'bg-[var(--bg)]'}`}>
                  <div className="flex items-center gap-1 mb-1">
                    <s.icon size={11} style={{ color: 'var(--primary)' }} />
                    <span className={`text-[10px] fp-body ${mutedText}`}>{s.label}</span>
                  </div>
                  <div className="fp-display font-bold text-xs">{s.val}</div>
                </div>
              ))}
            </div>

            {/* Mini bar chart — Entrées vs Sorties */}
            <div className={`rounded-2xl p-4 mb-4 ${darkMode ? 'bg-white/5' : 'bg-[var(--bg)]'}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs fp-body font-semibold flex items-center gap-1.5">
                  <BarChart3 size={13} style={{ color: 'var(--primary)' }} />
                  Entrées vs Sorties
                </span>
                <span className={`text-[10px] fp-body ${mutedText}`}>3 derniers mois</span>
              </div>
              <div className="flex items-end justify-between gap-3 h-20">
                {[
                  { in: 60, out: 35 },
                  { in: 95, out: 55 },
                  { in: 78, out: 62 },
                ].map((bar, i) => (
                  <div key={i} className="flex-1 flex items-end justify-center gap-1 h-full">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${bar.in}%` }}
                      transition={{ duration: 0.8, delay: 0.3 + i * 0.1 }}
                      className="w-2.5 rounded-full"
                      style={{ background: 'var(--mint)' }}
                    />
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${bar.out}%` }}
                      transition={{ duration: 0.8, delay: 0.4 + i * 0.1 }}
                      className="w-2.5 rounded-full"
                      style={{ background: 'var(--gold)' }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Ligne : évolution du solde + dépenses par catégorie */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className={`rounded-2xl p-3.5 ${darkMode ? 'bg-white/5' : 'bg-[var(--bg)]'}`}>
                <span className="text-[10px] fp-body font-semibold flex items-center gap-1 mb-2">
                  <LineChart size={12} style={{ color: 'var(--primary)' }} />
                  Évolution du solde
                </span>
                <svg viewBox="0 0 100 36" className="w-full h-9">
                  <motion.polyline
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.2, delay: 0.5 }}
                    fill="none"
                    stroke="var(--primary)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points="0,24 20,14 40,26 60,10 80,18 100,6"
                  />
                </svg>
              </div>
              <div className={`rounded-2xl p-3.5 flex flex-col items-center justify-center ${darkMode ? 'bg-white/5' : 'bg-[var(--bg)]'}`}>
                <span className="text-[10px] fp-body font-semibold self-start mb-1 flex items-center gap-1">
                  <PieChart size={12} style={{ color: 'var(--primary)' }} />
                  Catégories
                </span>
                <svg viewBox="0 0 36 36" className="w-12 h-12">
                  <circle cx="18" cy="18" r="15.5" fill="none" stroke={darkMode ? 'rgba(255,255,255,0.1)' : 'var(--border)'} strokeWidth="4" />
                  <motion.circle
                    initial={{ strokeDasharray: '0 100' }}
                    animate={{ strokeDasharray: '42 100' }}
                    transition={{ duration: 1, delay: 0.6 }}
                    cx="18"
                    cy="18"
                    r="15.5"
                    fill="none"
                    stroke="var(--navy)"
                    strokeWidth="4"
                    strokeDashoffset="25"
                  />
                  <motion.circle
                    initial={{ strokeDasharray: '0 100' }}
                    animate={{ strokeDasharray: '28 100' }}
                    transition={{ duration: 1, delay: 0.7 }}
                    cx="18"
                    cy="18"
                    r="15.5"
                    fill="none"
                    stroke="var(--mint)"
                    strokeWidth="4"
                    strokeDashoffset="-17"
                  />
                </svg>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.5 }}
              className="flex items-center gap-2.5 rounded-2xl p-3.5 border"
              style={{ background: 'var(--successSoft)', borderColor: 'var(--success)' }}
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: 'var(--success)' }} />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ background: 'var(--success)' }} />
              </span>
              <span className="text-xs fp-body font-medium" style={{ color: 'var(--successAlt)' }}>
                Gérez votre Finance en toute simplicité.
              </span>
            </motion.div>
          </div>

          {/* Badge flottant */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className={`absolute -bottom-6 -left-6 rounded-2xl px-4 py-3 shadow-xl hidden sm:flex items-center gap-2.5 ${surfaceBg}`}
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--gold), #e0a400)' }}>
              <Coins size={15} className="text-white" />
            </div>
            <div>
              <div className="fp-display font-bold text-sm leading-none">+18%</div>
              <div className={`text-[11px] fp-body ${mutedText}`}>vs mois dernier</div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          CHIFFRES CLÉS
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10 py-16">
        <div className="grid sm:grid-cols-3 gap-5">
          {[
            { icon: Building2, val: '500+', label: 'Entreprises actives' },
            { icon: BarChart3, val: '2,4 Mds MRU', label: 'de flux analysés' },
            { icon: Server, val: '99.9%', label: 'de disponibilité SLA' },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              whileHover={{ y: -4 }}
              className={`rounded-3xl p-6 ${surfaceBg}`}
            >
              <s.icon size={20} className="mb-4" style={{ color: 'var(--primary)' }} />
              <div className="fp-display font-extrabold text-2xl mb-1">{s.val}</div>
              <div className={`text-sm fp-body ${mutedText}`}>{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          FONCTIONNALITÉS — Bento Grid
      ═══════════════════════════════════════════════════════════════════ */}
      <section id="fonctionnalites" className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10 py-20 scroll-mt-20">
        <div className="max-w-2xl mb-12">
          <span className="text-xs font-bold tracking-widest uppercase fp-body" style={{ color: 'var(--primary)' }}>Modules</span>
          <h2 className="fp-display font-extrabold text-3xl sm:text-4xl tracking-tight mt-3 mb-4">
            Tout votre pilotage financier, réuni
          </h2>
          <p className={`fp-body leading-relaxed ${mutedText}`}>
            Chaque module de FinanceApp couvre une étape concrète de la gestion de votre trésorerie d'entreprise.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {MODULES.map((m, i) => (
            <motion.div
              key={m.titre}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.08 }}
              whileHover={{ y: -3 }}
              className={`rounded-3xl p-8 ${surfaceBg} ${m.taille === 'grand' ? 'md:row-span-1 md:p-10' : ''}`}
            >
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center mb-5"
                style={{ background: 'linear-gradient(135deg, var(--navy), var(--primary))' }}
              >
                <m.icon size={19} className="text-white" />
              </div>
              <h3 className="fp-display font-bold text-lg mb-2">{m.titre}</h3>
              <p className={`text-sm leading-relaxed fp-body ${mutedText}`}>{m.texte}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SÉCURITÉ & CONFORMITÉ
      ═══════════════════════════════════════════════════════════════════ */}
      <section id="securite" className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10 py-20 scroll-mt-20">
        <div
          className="relative overflow-hidden rounded-3xl p-10 lg:p-14"
          style={{ background: 'linear-gradient(135deg, var(--navy), var(--black))' }}
        >
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl" style={{ background: 'rgba(2,245,161,0.12)' }} />
          <div className="relative grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-xs font-bold tracking-widest uppercase fp-body" style={{ color: 'var(--gold)' }}>Sécurité</span>
              <h2 className="fp-display font-extrabold text-3xl sm:text-4xl tracking-tight mt-3 mb-4 text-white">
                Vos données, protégées à chaque étape
              </h2>
              <p className="fp-body leading-relaxed text-white/70">
                FinanceApp applique des standards de sécurité bancaire — chiffrement, authentification forte et
                vérification d'identité (KYC) — pour garantir l'intégrité et la confidentialité de vos informations
                financières.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { icon: Lock, titre: 'Chiffrement AES-256', texte: 'De bout en bout, au repos et en transit.' },
                { icon: Fingerprint, titre: 'Authentification 2FA', texte: 'Une couche de vérification supplémentaire.' },
                { icon: BadgeCheck, titre: 'Vérification KYC', texte: "Contrôle d'identité en cinq étapes avant activation." },
                { icon: Server, titre: 'Sauvegardes automatisées', texte: 'Réplication régulière de vos données.' },
              ].map((f) => (
                <div key={f.titre} className="rounded-2xl p-5 bg-white/5 border border-white/10 backdrop-blur-sm">
                  <f.icon size={18} className="mb-3" style={{ color: 'var(--mint)' }} />
                  <div className="fp-display font-semibold text-sm text-white mb-1">{f.titre}</div>
                  <div className="text-xs fp-body text-white/60 leading-relaxed">{f.texte}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          TARIFICATION
      ═══════════════════════════════════════════════════════════════════ */}
      <section id="tarification" className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10 py-20 scroll-mt-20">
        <div className="max-w-2xl mb-12">
          <span className="text-xs font-bold tracking-widest uppercase fp-body" style={{ color: 'var(--primary)' }}>Tarification</span>
          <h2 className="fp-display font-extrabold text-3xl sm:text-4xl tracking-tight mt-3 mb-4">
            Une offre adaptée à chaque étape
          </h2>
          <p className={`fp-body leading-relaxed ${mutedText}`}>
            Commencez gratuitement, puis évoluez vers l'offre qui correspond à la taille de votre structure.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {OFFRES.map((o) => (
            <div
              key={o.nom}
              className={`rounded-3xl p-8 ${o.mise_en_avant ? 'text-white shadow-2xl' : surfaceBg}`}
              style={o.mise_en_avant ? { background: 'linear-gradient(135deg, var(--navy), var(--primary))', boxShadow: '0 20px 45px -18px rgba(0,49,82,0.5)' } : undefined}
            >
              {o.mise_en_avant && (
                <span
                  className="inline-block text-[11px] font-bold uppercase tracking-wider rounded-full px-3 py-1 mb-4"
                  style={{ background: 'var(--gold)', color: 'var(--navy)' }}
                >
                  Le plus choisi
                </span>
              )}
              <h3 className="fp-display font-bold text-lg mb-1">{o.nom}</h3>
              <div className="flex items-baseline gap-1.5 mb-6">
                <span className="fp-display font-extrabold text-2xl">{o.prix}</span>
                <span className={`text-xs fp-body ${o.mise_en_avant ? 'text-white/70' : mutedText}`}>{o.periode}</span>
              </div>
              <ul className="space-y-2.5 mb-7">
                {o.avantages.map((a) => (
                  <li key={a} className="flex items-start gap-2 text-sm fp-body">
                    <CheckCircle2
                      size={16}
                      className="shrink-0 mt-0.5"
                      style={{ color: o.mise_en_avant ? 'var(--gold)' : 'var(--primary)' }}
                    />
                    <span className={o.mise_en_avant ? 'text-white/90' : mutedText}>{a}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={ouvrirAuthModal}
                className={`w-full h-11 rounded-full font-semibold text-sm fp-body flex items-center justify-center gap-1.5 transition-colors ${
                  o.mise_en_avant
                    ? 'bg-white hover:bg-slate-100'
                    : darkMode
                    ? 'bg-white/5 hover:bg-white/10 text-white'
                    : 'bg-slate-100 hover:bg-slate-200'
                }`}
                style={o.mise_en_avant ? { color: 'var(--navy)' } : darkMode ? undefined : { color: 'var(--navy)' }}
              >
                Choisir cette offre
                <ArrowUpRight size={14} />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          VOTRE PARCOURS FINANCEAPP — de l'inscription au pilotage financier
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10 py-20">
        <div className="max-w-2xl mb-14">
          <span className="text-xs font-bold tracking-widest uppercase fp-body" style={{ color: 'var(--primary)' }}>Votre parcours FinanceApp</span>
          <h2 className="fp-display font-extrabold text-3xl sm:text-4xl tracking-tight mt-3">
            De l'inscription au pilotage financier
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {ETAPES.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              whileHover={{ y: -6 }}
              transition={{ duration: 0.45, delay: i * 0.1 }}
              className={`relative rounded-3xl p-7 ${surfaceBg}`}
            >
              <div className="flex items-center justify-between mb-6">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, var(--navy), var(--primary))' }}
                >
                  <s.icon size={20} className="text-white" />
                </div>
                <span
                  className="fp-display font-extrabold text-3xl"
                  style={{ color: darkMode ? 'rgba(255,255,255,0.08)' : 'var(--border)' }}
                >
                  {s.n}
                </span>
              </div>
              <h3 className="fp-display font-bold text-lg mb-2">{s.titre}</h3>
              <p className={`text-sm leading-relaxed fp-body ${mutedText}`}>{s.texte}</p>
              {i < ETAPES.length - 1 && (
                <div className="hidden lg:flex absolute top-1/2 -right-3 -translate-y-1/2 z-10">
                  <ArrowRight size={18} style={{ color: 'var(--mint)' }} />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          CE QUE FINANCEAPP GARANTIT
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10 py-20">
        <div className="max-w-2xl mb-12">
          <span className="text-xs font-bold tracking-widest uppercase fp-body" style={{ color: 'var(--primary)' }}>Engagements</span>
          <h2 className="fp-display font-extrabold text-3xl sm:text-4xl tracking-tight mt-3 mb-4">
            FinanceApp garantit
          </h2>
          <p className={`fp-body leading-relaxed ${mutedText}`}>
            Trois exigences non négociables pour que votre gestion de trésorerie reste sereine au quotidien.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-5">
          {GARANTIES.map((g, i) => (
            <motion.div
              key={g.titre}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className={`rounded-3xl p-8 ${surfaceBg}`}
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
                style={{ background: 'linear-gradient(135deg, var(--mint), var(--success))' }}
              >
                <g.icon size={20} style={{ color: 'var(--navy)' }} />
              </div>
              <h3 className="fp-display font-bold text-lg mb-2">{g.titre}</h3>
              <p className={`text-sm leading-relaxed fp-body ${mutedText}`}>{g.texte}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          CLÔTURE + FOOTER
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10 py-20">
        <div
          className="relative overflow-hidden rounded-3xl text-center py-16 px-8"
          style={{ background: 'linear-gradient(135deg, var(--navy), var(--teal))' }}
        >
          <div className="absolute -bottom-20 -left-10 w-64 h-64 rounded-full blur-3xl" style={{ background: 'rgba(2,245,161,0.15)' }} />
          <div className="relative">
            <span
              className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 mb-5 text-xs font-semibold fp-body"
              style={{ background: 'rgba(2,245,161,0.12)', color: 'var(--mint)' }}
            >
              <ShieldCheck size={13} />
              Sécurisé, conforme et prêt en quelques minutes
            </span>
            <h2 className="fp-display font-extrabold text-3xl sm:text-4xl tracking-tight text-white mb-4">
              Votre trésorerie, sous contrôle, jour après jour
            </h2>
            <p className="fp-body text-white/70 max-w-xl mx-auto mb-8">
              Flux suivis en temps réel, budgets sous surveillance automatique et vérification d'identité sécurisée :
              FinanceApp accompagne aussi bien les indépendants que les équipes financières les plus exigeantes.
            </p>
            <button
              onClick={ouvrirAuthModal}
              className="h-13 px-8 py-3.5 rounded-full font-semibold fp-body shadow-xl hover:-translate-y-0.5 transition-transform inline-flex items-center gap-2"
              style={{ background: 'var(--mint)', color: 'var(--navy)' }}
            >
              Démarrer gratuitement
              <ArrowRight size={17} />
            </button>
          </div>
        </div>
      </section>

      <footer id="contact" className={`relative z-10 border-t ${darkMode ? 'border-white/10' : 'border-[var(--border)]'} scroll-mt-20`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-10">
          <div>
            <div className="mb-4">
              <LogoMark dark={darkMode} small />
            </div>
            <p className={`text-sm fp-body leading-relaxed ${mutedText}`}>
              La plateforme de gestion financière pour les entreprises et les particuliers qui recherchent l'excellence.
            </p>
          </div>

          {[
            {
              titre: 'Produit',
              liens: [
                { label: 'Fonctionnalités', id: 'fonctionnalites' },
                { label: 'Sécurité', id: 'securite' },
                { label: 'Tarification', id: 'tarification' },
              ],
            },
            {
              titre: 'Ressources',
              liens: [
                { label: "financeapp_service@gmail.com", id: 'contact' },
                { label: '+222 26320097', id: 'contact' },
                { label: 'Plateforme mauritanienne', id: 'contact' },
              ],
            },
          ].map((col) => (
            <div key={col.titre}>
              <h4 className="fp-display font-semibold text-sm mb-4">{col.titre}</h4>
              <ul className="space-y-2.5">
                {col.liens.map((l) => (
                  <li key={l.label}>
                    <button
                      onClick={() => scrollVers(l.id)}
                      className={`text-sm fp-body cursor-pointer transition-colors hover:!text-[var(--primary)] ${mutedText}`}
                    >
                      {l.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className={`border-t ${darkMode ? 'border-white/10' : 'border-[var(--border)]'} py-6`}>
          <div className="max-w-7xl mx-auto px-6 lg:px-10 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className={`text-xs fp-body ${mutedText}`}>© {new Date().getFullYear()} FinanceApp. Tous droits réservés.</span>
            <div className="flex items-center gap-5">
              <span className={`text-xs fp-body cursor-pointer hover:!text-[var(--primary)] ${mutedText}`}>Confidentialité</span>
              <span className={`text-xs fp-body cursor-pointer hover:!text-[var(--primary)] ${mutedText}`}>Mentions légales</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ── Signature — style d'écriture différent (police cursive) ── */}
      <div className={`relative z-10 text-center py-5 border-t ${darkMode ? 'border-white/10' : 'border-[var(--border)]'}`}>
        <span
          style={{
            fontFamily: "'Brush Script MT', 'Segoe Script', cursive",
            fontSize: 15,
            color: darkMode ? 'rgba(255,255,255,0.55)' : 'var(--textSecondary)',
          }}
        >
          Développé par Moulay Abderrahman 
        </span>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          MODALE D'AUTHENTIFICATION
          (contient le formulaire original — logique 100% inchangée)
      ═══════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showAuthModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm"
            onClick={fermerAuthModal}
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.97 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-md rounded-3xl p-8 shadow-2xl relative fp-body ${
                darkMode ? 'bg-[var(--teal)] text-white' : 'bg-white text-[var(--navy)]'
              }`}
            >
              <button
                onClick={fermerAuthModal}
                className={`absolute top-5 right-5 p-1.5 rounded-full transition-colors ${
                  darkMode ? 'hover:bg-white/10 text-white/60' : 'hover:bg-slate-100 text-[var(--textMuted)]'
                }`}
                aria-label="Fermer"
              >
                <X size={18} />
              </button>

              {/* ── Vue Choix (logique inchangée) ────────────────────────── */}
              {mode === 'choix' && (
                <>
                  <div className="text-center mb-8">
                    <h2 className="fp-display font-bold text-2xl mb-1.5">Commencer</h2>
                    <p className={`text-sm ${mutedText}`}>Choisissez votre méthode de connexion</p>
                  </div>

                  <div className="flex flex-col gap-3.5">
                    {/* Explorer sans compte */}
                    <button
                      onClick={explorerSansCompte}
                      disabled={loadingVisitor}
                      className="w-full h-13 py-3.5 rounded-2xl disabled:opacity-70 text-white font-semibold flex items-center justify-center gap-2.5 shadow-lg transition-colors"
                      style={{ background: 'var(--navy)' }}
                    >
                      {loadingVisitor ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          Chargement...
                        </>
                      ) : (
                        <>
                          <Search size={18} />
                          Explorer sans compte
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-3 my-0.5">
                      <div className={`flex-1 h-px ${darkMode ? 'bg-white/10' : 'bg-[var(--border)]'}`} />
                      <span className={`text-[11px] font-semibold ${mutedText}`}>OU</span>
                      <div className={`flex-1 h-px ${darkMode ? 'bg-white/10' : 'bg-[var(--border)]'}`} />
                    </div>

                    {/* Continuer avec Email */}
                    <button
                      onClick={continuerEmail}
                      className="w-full h-13 py-3.5 rounded-2xl text-white font-semibold flex items-center justify-center gap-2.5 shadow-lg transition-colors"
                      style={{ background: 'var(--black)' }}
                    >
                      <Mail size={18} />
                      Continuer avec Email
                    </button>

                    {/* Continuer avec Google */}
                    <button
                      onClick={continuerGoogle}
                      disabled={loadingGoogle}
                      className={`w-full h-13 py-3.5 rounded-2xl font-medium flex items-center justify-center gap-2.5 border transition-colors disabled:opacity-70 ${
                        darkMode ? 'bg-white/5 border-white/10 hover:bg-white/10 text-white' : 'bg-white border-[var(--border)] hover:bg-slate-50 text-[var(--navy)]'
                      }`}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                      </svg>
                      {loadingGoogle ? 'Redirection...' : 'Continuer avec Google'}
                    </button>

                    <div className="flex items-center gap-3 my-1">
                      <div className={`flex-1 h-px ${darkMode ? 'bg-white/10' : 'bg-[var(--border)]'}`} />
                      <span className={`text-[11px] font-semibold ${mutedText}`}>OU</span>
                      <div className={`flex-1 h-px ${darkMode ? 'bg-white/10' : 'bg-[var(--border)]'}`} />
                    </div>

                    {/* Continuer avec SSO */}
                    <button
                      onClick={() => setMode('sso')}
                      className="w-full h-13 py-3.5 rounded-2xl border-2 font-semibold flex items-center justify-center gap-2.5 transition-colors hover:!bg-[var(--primarySoft)]"
                      style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}
                    >
                      <Building2 size={18} />
                      Continuer avec NovaSSO
                    </button>
                  </div>

                  <div className="mt-7 text-center">
                    <p className={`text-sm ${mutedText}`}>
                      Pas encore de compte ?{' '}
                      <Link to="/inscription" className="font-bold" style={{ color: 'var(--primary)' }}>
                        S'inscrire
                      </Link>
                    </p>
                  </div>
                </>
              )}

              {/* ── Vue SSO (logique inchangée) ─────────────────────────── */}
              {mode === 'sso' && (
                <>
                  <button
                    onClick={() => setMode('choix')}
                    className="flex items-center gap-1.5 mb-6 text-sm font-semibold"
                    style={{ color: 'var(--primary)' }}
                  >
                    <ArrowLeft size={14} />
                    Retour
                  </button>

                  <h2 className="fp-display font-bold text-xl mb-2">Connexion SSO</h2>
                  <p className={`text-sm mb-6 ${mutedText}`}>
                    Connexion sécurisée via <strong>financeapp.com</strong>
                  </p>

                  <form onSubmit={continuerSSO} className="flex flex-col gap-4">
                    <input
                      type="text"
                      value={domaine}
                      onChange={(e) => setDomaine(e.target.value)}
                      placeholder="exemple.com ou nom@entreprise.com"
                      required
                      className={`w-full px-4 py-3.5 rounded-xl border outline-none text-sm transition-colors focus:!border-[var(--primary)] ${
                        darkMode ? 'bg-white/5 border-white/10 text-white placeholder:text-white/40' : 'bg-white border-[var(--border)] text-[var(--navy)]'
                      }`}
                    />
                    <button
                      type="submit"
                      disabled={loadingSSO}
                      className="w-full h-13 py-3.5 rounded-xl disabled:opacity-70 text-white font-semibold flex items-center justify-center gap-2 transition-colors"
                      style={{ background: 'var(--black)' }}
                    >
                      {loadingSSO ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Redirection...
                        </>
                      ) : (
                        <>
                          Continuer
                          <ArrowRight size={16} />
                        </>
                      )}
                    </button>
                  </form>

                  <p className={`mt-5 text-xs text-center flex items-center justify-center gap-1.5 ${darkMode ? 'text-white/40' : 'text-[var(--textMuted)]'}`}>
                    <ShieldCheck size={13} />
                    Vous serez redirigé vers le portail d'authentification de FinanceApp.
                  </p>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}