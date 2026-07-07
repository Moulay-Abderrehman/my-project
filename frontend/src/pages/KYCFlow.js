// frontend/src/pages/KYCFlow.js
// ══════════════════════════════════════════════════════════════════════════════
// Workflow KYC complet — 5 étapes
// intro (0) → type doc (1) → upload (2) → confirm (3) → face (4) → succès (5)
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Webcam from 'react-webcam';
import kycService from '../api/kycService';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
  ArrowRight,
  ChevronLeft,
  Camera,
  ImagePlus,
  Aperture,
  RefreshCw,
  Loader2,
  Lightbulb,
  User,
  Search,
  PartyPopper,
  LogIn,
  Check,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
  CreditCard,
  Globe,
  Home,
  ShieldCheck,
  Fingerprint,
  Clock,
  ScanLine,
  Lock,
  UserCheck,
} from 'lucide-react';

// ─── Police + animations (injection unique) ──────────────────────────────────
const injectAssets = () => {
  if (!document.getElementById('kyc-fonts')) {
    const link = document.createElement('link');
    link.id = 'kyc-fonts';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap';
    document.head.appendChild(link);
  }
  if (!document.getElementById('kyc-anim')) {
    const style = document.createElement('style');
    style.id = 'kyc-anim';
    style.textContent = `
      @keyframes kycFadeUp { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
      @keyframes kycPulse { 0%,100%{box-shadow:0 0 0 0 rgba(53,98,103,.18)} 50%{box-shadow:0 0 0 14px rgba(53,98,103,0)} }
      @keyframes kycBannerSlide { from { opacity:0; transform:translate(-50%,-16px); } to { opacity:1; transform:translate(-50%,0); } }
      @keyframes kycBannerFade { 0%,80%{opacity:1;transform:translate(-50%,0);} 100%{opacity:0;transform:translate(-50%,-16px);} }
      .kyc-card { animation: kycFadeUp .35s cubic-bezier(.16,1,.3,1) both; font-family: 'Sora', sans-serif; }
      .kyc-pulse { animation: kycPulse 2.5s ease infinite; }
      .kyc-banner-slide { animation: kycBannerSlide .35s ease; }
      .kyc-banner-auto { animation: kycBannerSlide .35s ease, kycBannerFade 4s ease forwards; }
    `;
    document.head.appendChild(style);
  }
};

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

// ─── Classes Tailwind partagées (thème FinanceApp) ───────────────────────────
const pageWrap = 'min-h-screen flex items-center justify-center px-4 py-8 relative overflow-hidden bg-white';
const cardBase = 'kyc-card relative w-full bg-white border border-[rgba(16,33,75,0.08)] rounded-2xl p-6 sm:p-8 shadow-[0_24px_70px_rgba(0,49,82,0.16)] overflow-hidden z-10';
const cardLine = 'absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#356267] to-[#4ea674]';
const btnPrimary = 'w-full min-h-[48px] px-5 py-3.5 bg-[#356267] text-white rounded-[10px] font-bold text-[15px] flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(53,98,103,0.3)] transition-all hover:enabled:-translate-y-0.5 hover:enabled:bg-[#2a4f53] disabled:opacity-60 disabled:cursor-not-allowed';
const btnSecondary = 'w-full min-h-[46px] px-5 py-3 bg-transparent text-[#356267]/75 border border-[rgba(16,33,75,0.08)] rounded-[10px] font-semibold text-sm flex items-center justify-center gap-2 transition-colors hover:bg-[#f8fafc]';
const backBtn = 'flex items-center gap-1 bg-[#f8fafc] border border-[rgba(16,33,75,0.08)] rounded-lg px-3 py-2 text-sm font-semibold text-[#356267]/75 transition-colors hover:bg-[#c2f2f2]/40';
const sectionLabel = 'text-[10px] font-bold text-[#356267]/45 uppercase tracking-wider mb-2.5';
const infoBox = 'bg-[#f8fafc] rounded-[10px] border border-[rgba(16,33,75,0.08)] overflow-hidden';
const infoRow = 'flex justify-between items-center gap-3 px-4 py-3';
const progressTrack = 'bg-[rgba(16,33,75,0.08)] rounded h-1.5 overflow-hidden mt-1.5';

// ─── Mapping entre les types de documents affichés au client (step 1)
//     et le paramètre document_type attendu par l'API Nova ('carte' | 'passeport') ─
const toNovaDocType = (docType) => (docType === 'passport' ? 'passeport' : 'carte');

// ─── Fond décoratif de page : cercles dégradés flous + carrés verts ─────────
function PageGlow() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -top-40 -left-32 h-[560px] w-[560px] rounded-full bg-[#003152] opacity-[0.08] blur-3xl" />
      <div className="absolute top-1/3 -right-40 h-[620px] w-[620px] rounded-full bg-[#FDBF20] opacity-[0.07] blur-3xl" />
      <div className="absolute bottom-0 left-1/4 h-[480px] w-[480px] rounded-full bg-[#356267] opacity-[0.06] blur-3xl" />

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
}

// ─── Banner — pop-up professionnel avec badge icône et bouton X ─────────────
function Banner({ type = 'info', message, onDismiss, autoDismiss = false }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (autoDismiss) {
      const timer = setTimeout(() => {
        setVisible(false);
        if (onDismiss) onDismiss();
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [autoDismiss, onDismiss]);

  if (!visible || !message) return null;

  const themes = {
    success: { border: '#bbf0cf', badgeBg: '#e9f8e7', iconColor: '#2f9e5b', title: 'Succès',    Icon: CheckCircle2 },
    error:   { border: '#fecaca', badgeBg: '#fee2e2', iconColor: '#d55053', title: 'Erreur',     Icon: AlertCircle },
    warning: { border: '#fde3b8', badgeBg: '#fef3e2', iconColor: '#c2872e', title: 'Attention',  Icon: AlertTriangle },
    info:    { border: '#c2e0e2', badgeBg: '#e7f4f4', iconColor: '#356267', title: 'Information', Icon: Info },
  };
  const theme = themes[type] || themes.info;
  const { Icon } = theme;

  return (
    <div
      className="kyc-banner-slide fixed top-5 left-1/2 z-[9999] w-[calc(100%-32px)] max-w-sm -translate-x-1/2"
      role="alert"
    >
      <div
        className="flex items-start gap-3 rounded-2xl border bg-white px-4 py-4 shadow-[0_18px_45px_rgba(16,33,75,0.18)]"
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
            {message}
          </p>
        </div>
        <button
          onClick={() => { setVisible(false); if (onDismiss) onDismiss(); }}
          aria-label="Fermer le message"
          className="flex-shrink-0 rounded-full p-1 text-[#94a3b8] transition-colors hover:bg-[#f1f5f9] hover:text-[#10214b]"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

// ─── StepBar ──────────────────────────────────────────────────────────────
function StepBar({ currentStep, totalSteps = 4 }) {
  const labels = ['Document', 'Scan', 'Données', 'Selfie'];
  return (
    <div className="mb-7 flex items-center">
      {Array.from({ length: totalSteps }, (_, i) => (
        <React.Fragment key={i}>
          <div className="flex flex-col items-center gap-1.5">
            <div
              className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
                i < currentStep
                  ? 'bg-[#356267] text-white'
                  : i === currentStep
                  ? 'border-2 border-[#356267] bg-white text-[#356267] shadow-[0_0_0_4px_rgba(53,98,103,0.1)]'
                  : 'border-2 border-[rgba(16,33,75,0.08)] bg-[#f8fafc] text-[#356267]/40'
              }`}
            >
              {i < currentStep ? <Check size={15} /> : i + 1}
            </div>
            <span
              className={`whitespace-nowrap text-[9px] font-bold uppercase tracking-wide ${
                i <= currentStep ? 'text-[#356267]' : 'text-[#356267]/40'
              }`}
            >
              {labels[i]}
            </span>
          </div>
          {i < totalSteps - 1 && (
            <div
              className={`mx-1 mb-[18px] h-[2px] flex-1 rounded transition-colors duration-300 ${
                i < currentStep ? 'bg-gradient-to-r from-[#356267] to-[#4ea674]' : 'bg-[rgba(16,33,75,0.08)]'
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════
export default function KYCFlow() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { connexion } = useAuth();

  const [userId,           setUserId]           = useState(null);
  const [isLoading,        setIsLoading]        = useState(true);
  const [step,             setStep]             = useState(0);
  const [docType,          setDocType]          = useState('cni'); // 'passport' | 'cni' | 'sejour'
  const [extractedData,    setExtractedData]    = useState(null);
  const [capturedImage,    setCapturedImage]    = useState(null);
  const [capturedFile,     setCapturedFile]     = useState(null);
  const [selfieBlob,       setSelfieBlob]       = useState(null);
  const [selfiePreview,    setSelfiePreview]    = useState(null);
  const [loading,          setLoading]          = useState(false);
  const [faceResult,       setFaceResult]       = useState(null);
  const [showCamera,       setShowCamera]       = useState(false);
  const [showSelfieCamera, setShowSelfieCamera] = useState(false);
  const [banner,           setBanner]           = useState(null);

  const webcamRef    = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => { injectAssets(); }, []);

  const showBanner = (message, type = 'info', autoDismiss = false) => {
    setBanner({ message, type, autoDismiss });
  };

  const clearBanner = () => setBanner(null);

  // ── Load userId ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const loadUserId = async () => {
      setIsLoading(true);
      let id = location.state?.userId;
      if (!id) id = localStorage.getItem('temp_user_id');
      if (!id) {
        const params = new URLSearchParams(location.search);
        id = params.get('userId');
      }
      if (!id) {
        const token = localStorage.getItem('access_token');
        if (token) {
          try {
            const response = await api.get('/comptes/profil/');
            if (response.data?.id) {
              id = response.data.id;
              localStorage.setItem('temp_user_id', id);
            }
          } catch (err) { console.error('[KYCFlow] Erreur chargement profil:', err); }
        }
      }
      if (!id) {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          try {
            const user = JSON.parse(userStr);
            if (user?.id) { id = user.id; localStorage.setItem('temp_user_id', id); }
          } catch (e) { console.error('[KYCFlow] Erreur parsing user:', e); }
        }
      }
      if (id) {
        setUserId(id);
        setIsLoading(false);
      } else {
        showBanner('Session expirée. Veuillez vous reconnecter.', 'error');
        setTimeout(() => navigate('/connexion'), 2000);
        setIsLoading(false);
      }
    };
    loadUserId();
  }, [location.state, location.search, navigate]);

  // ── Capture handlers ────────────────────────────────────────────────────────
  const handleCaptureDoc = useCallback(() => {
    if (!webcamRef.current) return;
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;
    fetch(imageSrc).then(r => r.blob()).then(blob => {
      const file = new File([blob], 'document.jpg', { type: 'image/jpeg' });
      setCapturedFile(file);
      setCapturedImage(imageSrc);
      setShowCamera(false);
    }).catch(() => showBanner('Erreur lors de la capture', 'error'));
  }, []);

  const handleCaptureSelfie = useCallback(() => {
    if (!webcamRef.current) return;
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;
    fetch(imageSrc).then(r => r.blob()).then(blob => {
      setSelfieBlob(blob);
      setSelfiePreview(imageSrc);
      setShowSelfieCamera(false);
    }).catch(() => showBanner('Erreur lors de la capture', 'error'));
  }, []);

  // ── Loading screen ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className={pageWrap}>
        <PageGlow />
        <div className="relative z-10 text-center" style={{ fontFamily: "'Sora', sans-serif" }}>
          <div className="mx-auto mb-4 h-11 w-11 animate-spin rounded-full border-[3px] border-[#356267]/20 border-t-[#356267]" />
          <p className="text-[14px] text-[#356267]/75">Chargement de votre session…</p>
        </div>
      </div>
    );
  }

  // ── No userId ───────────────────────────────────────────────────────────────
  if (!userId) {
    return (
      <div className={pageWrap}>
        <PageGlow />
        <div className={`${cardBase} max-w-[480px] p-10 text-center`}>
          <div className={cardLine} />
          <AlertTriangle size={52} className="mx-auto mb-4 text-[#c2872e]" />
          <p className="mb-6 text-[14px] text-[#356267]/75">
            Session expirée. Veuillez recommencer.
          </p>
          <button onClick={() => navigate('/connexion')} className={`${btnPrimary} w-auto px-7`}>
            <LogIn size={18} /> Retour à la connexion
          </button>
        </div>
      </div>
    );
  }

  // ── Shared handlers ─────────────────────────────────────────────────────────
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showBanner('Le fichier ne doit pas dépasser 5 Mo', 'error');
      return;
    }
    setCapturedFile(file);
    setCapturedImage(URL.createObjectURL(file));
  };

  const handleSendOCR = async () => {
    if (!capturedFile) return;
    setLoading(true);
    clearBanner();
    try {
      // On transmet le type de document choisi aux étapes 1 & 2 ('carte' | 'passeport')
      const novaDocType = toNovaDocType(docType);
      const result = await kycService.extractDocument(capturedFile, novaDocType);

      if (result.status === 'success') {
        if (result.confidence_score <= 25) {
          showBanner('❌ Document illisible. Veuillez prendre une photo plus claire et mieux éclairée.', 'error');
          setLoading(false);
          return;
        }
        setExtractedData({ ...result, document_type: novaDocType });
        setStep(3);
        showBanner(`Document analysé avec succès ! (Confiance: ${result.confidence_score}%)`, 'success');
      } else {
        const errorMsg = result.message || result.error || "Erreur lors de l'extraction";
        showBanner(errorMsg, 'error');
        setLoading(false);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message ||
                          err.response?.data?.error ||
                          "Erreur lors de l'extraction OCR. Veuillez réessayer.";
      if (err.response?.status === 422 && err.response?.data?.error === 'DOCUMENT_ILLISIBLE') {
        showBanner('❌ ' + err.response?.data?.message, 'error');
      } else {
        showBanner(errorMessage, 'error');
      }
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmData = async () => {
    setLoading(true);
    clearBanner();
    try {
      const confirmPayload = {
        user_id: userId,
        nni: extractedData?.nni || '',
        numero_passeport: extractedData?.numero_passeport || '',
        nom_fr: extractedData?.nom_fr || '',
        prenom_fr: extractedData?.prenom_fr || '',
        birth_date: extractedData?.birth_date || '',
        birth_place: extractedData?.birth_place || '',
        gender: extractedData?.gender || '',
        nationality: extractedData?.nationality || 'MRT',
        document_type: extractedData?.document_type || 'carte',
        face_image_base64: extractedData?.face_image_base64 || '',
        document_full_image_base64: extractedData?.document_full_image_base64 || '',
      };

      console.log("[KYC] Envoi confirmation avec:", {
        document_type: confirmPayload.document_type,
        has_full_image: !!confirmPayload.document_full_image_base64,
        full_image_length: confirmPayload.document_full_image_base64?.length || 0
      });

      await kycService.confirmData(userId, confirmPayload);
      setStep(4);
      showBanner('Données confirmées !', 'success');
    } catch (err) {
      showBanner(err.response?.data?.error || 'Erreur lors de la confirmation.', 'error');
    } finally { setLoading(false); }
  };

  // ════════════════════════════════════════════════════════════════════════════
  // ⚡ FIX: handleVerifyFace — le catch distingue maintenant :
  //   1) une vraie réponse du backend disant "non vérifié" (err.response présent)
  //   2) une coupure réseau / timeout côté client (err.response absent), auquel
  //      cas le backend a très bien pu terminer le traitement de son côté et
  //      valider le KYC (c'est exactement ce qui causait le bug rapporté :
  //      le "Broken pipe" côté serveur alors que le KYC était déjà "approved").
  //   Dans ce 2e cas on ne montre plus "Visage non reconnu" (message trompeur),
  //   on informe l'utilisateur de vérifier son statut ou de réessayer.
  // ════════════════════════════════════════════════════════════════════════════
  const handleVerifyFace = async () => {
    if (!selfieBlob) return;
    setLoading(true);
    clearBanner();
    try {
      const result = await kycService.verifyFace(userId, selfieBlob);

      if (result && typeof result === 'object') {
        result.document_type = docType;
        setFaceResult(result);

        if (result.verified) {
          if (result.access_token) {
            localStorage.setItem('access_token', result.access_token);
            localStorage.setItem('refresh_token', result.refresh_token);
            if (result.user) {
              localStorage.setItem('user', JSON.stringify(result.user));
              await connexion(result.user.email, null, true);
            }
          }
          localStorage.removeItem('temp_user_id');
          localStorage.removeItem('temp_session_token');
          setStep(5);
          showBanner('✅ Identité vérifiée avec succès !', 'success');
        }
      } else {
        console.warn('[KYC] Résultat de vérification invalide:', result);
        showBanner('Erreur de vérification: réponse invalide du serveur', 'error');
        setFaceResult({
          verified: false,
          similarity_score: 0,
          message: 'Réponse invalide du serveur'
        });
      }
    } catch (err) {
      // Pas de err.response => la requête n'a jamais reçu de réponse HTTP
      // (timeout, connexion coupée, "Broken pipe" serveur, etc.). Le backend
      // peut très bien avoir terminé et validé le KYC malgré tout : on ne
      // doit surtout pas afficher "visage non reconnu" dans ce cas, car cela
      // induit l'utilisateur en erreur alors que son compte est déjà validé.
      if (!err.response) {
        console.warn('[KYC] Requête de vérification interrompue (pas de réponse reçue):', err);
        showBanner(
          "La connexion a été interrompue pendant la vérification. Si votre compte a bien été validé, reconnectez-vous ; sinon, réessayez le selfie.",
          'warning'
        );
        setFaceResult({
          verified: false,
          similarity_score: 0,
          message: "La connexion a été interrompue avant la fin de la vérification. Réessayez, ou reconnectez-vous si votre compte est déjà validé.",
          connection_interrupted: true,
        });
      } else {
        const errData = err.response?.data;
        if (errData && typeof errData === 'object') {
          errData.document_type = docType;
        }
        setFaceResult(errData || {
          verified: false,
          similarity_score: 0,
          message: 'Erreur de vérification.'
        });
        showBanner(errData?.message || 'Visage non reconnu. Réessayez.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };
  // ════════════════════════════════════════════════════════════════════════════
  // FIN DU FIX
  // ════════════════════════════════════════════════════════════════════════════

  // ════════════════════════════════════════════════════════════════════════════
  // ÉTAPE 0 — Introduction
  // ════════════════════════════════════════════════════════════════════════════
  if (step === 0) {
    return (
      <div className={pageWrap}>
        <PageGlow />
        <div className={`${cardBase} max-w-[500px]`}>
          <div className={cardLine} />

          {banner && (
            <Banner type={banner.type} message={banner.message} onDismiss={clearBanner} autoDismiss={banner.autoDismiss} />
          )}

          <div className="mb-7 text-center">
            <div className="kyc-pulse mx-auto mb-4 flex h-[72px] w-[72px] items-center justify-center rounded-full border-2 border-[#356267]/25 bg-[#c2f2f2]/40">
              <Fingerprint size={34} className="text-[#356267]" />
            </div>
            <h2 className="text-[22px] font-extrabold text-[#10214b]">
              Vérification de KYC
            </h2>
            <p className="mt-2 text-[14px] leading-relaxed text-[#356267]/75">
              Complétez ces étapes pour activer votre compte.
            </p>
          </div>

          <div className="mb-5 flex items-center gap-3 rounded-[10px] border border-[rgba(16,33,75,0.08)] bg-[#f8fafc] px-4 py-3">
            <Clock size={22} className="flex-shrink-0 text-[#356267]" />
            <div>
              <div className="text-[14px] font-semibold text-[#10214b]">Temps estimé</div>
              <div className="text-[12px] text-[#356267]/60">2 – 5 minutes</div>
            </div>
          </div>

          <div className="mb-6 flex flex-col gap-2.5">
            {[
              { Icon: CreditCard, title: 'Scannez votre document',     desc: "Carte d'identité nationale ou passeport" },
              { Icon: ShieldCheck, title: 'Confirmez vos informations', desc: 'Vérifiez les données extraites automatiquement' },
              { Icon: UserCheck,  title: 'Vérification faciale',       desc: 'Un selfie pour confirmer votre identité' },
            ].map((item, i) => (
              <div key={i} className="flex gap-3.5 rounded-[10px] border border-[rgba(16,33,75,0.08)] bg-[#f8fafc] px-4 py-3.5">
                <div className="flex h-[42px] w-[42px] flex-shrink-0 items-center justify-center rounded-xl border border-[#356267]/20 bg-[#c2f2f2]/40">
                  <item.Icon size={22} className="text-[#356267]" />
                </div>
                <div>
                  <div className="text-[14px] font-semibold text-[#10214b]">{item.title}</div>
                  <div className="mt-0.5 text-[12px] text-[#356267]/60">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="mb-6 flex items-start gap-2.5 rounded-lg border border-[#356267]/20 bg-[#c2f2f2]/30 px-3.5 py-2.5">
            <Lock size={17} className="mt-0.5 flex-shrink-0 text-[#356267]" />
            <span className="text-[12px] leading-relaxed text-[#356267]">
              Vos données sont traitées de façon sécurisée et chiffrée.
            </span>
          </div>

          <button onClick={() => setStep(1)} className={btnPrimary}>
            Commencer la vérification
            <ArrowRight size={19} />
          </button>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ÉTAPE 1 — Choisir le type de document
  // ════════════════════════════════════════════════════════════════════════════
  if (step === 1) {
    const documents = [
      { val: 'passport', label: 'Passeport',                   desc: 'Document de voyage international',            Icon: Globe },
      { val: 'cni',      label: "Carte d'identité nationale",  desc: "Pièce d'identité officielle mauritanienne",   Icon: CreditCard },
      { val: 'sejour',   label: 'Carte de séjour',             desc: 'Pour les résidents étrangers',                Icon: Home },
    ];
    return (
      <div className={pageWrap}>
        <PageGlow />
        <div className={`${cardBase} max-w-[520px]`}>
          <div className={cardLine} />

          {banner && (
            <Banner type={banner.type} message={banner.message} onDismiss={clearBanner} autoDismiss={banner.autoDismiss} />
          )}

          <div className="mb-5 flex items-center gap-3">
            <button onClick={() => setStep(0)} className={backBtn}>
              <ChevronLeft size={18} />
            </button>
            <h3 className="text-[16px] font-bold text-[#10214b]">Type de document</h3>
          </div>
          <StepBar currentStep={0} />
          <h2 className="mb-1.5 text-[20px] font-extrabold text-[#10214b]">
            Choisissez votre document
          </h2>
          <p className="mb-5 text-[13px] text-[#356267]/60">
            Sélectionnez le document à utiliser.
          </p>

          <div className="mb-5 flex flex-col gap-2.5">
            {documents.map(doc => {
              const active = docType === doc.val;
              return (
                <div
                  key={doc.val}
                  onClick={() => setDocType(doc.val)}
                  className={`flex cursor-pointer items-center gap-3.5 rounded-[10px] border-[1.5px] p-4 transition-all ${
                    active ? 'border-[#356267] bg-[#c2f2f2]/30 shadow-[0_0_0_4px_rgba(53,98,103,0.08)]' : 'border-[rgba(16,33,75,0.08)] bg-[#f8fafc]'
                  }`}
                >
                  <div className={`flex h-[46px] w-[46px] flex-shrink-0 items-center justify-center rounded-xl border ${
                    active ? 'border-[#356267]/30 bg-white' : 'border-[rgba(16,33,75,0.08)] bg-white'
                  }`}>
                    <doc.Icon size={23} className={active ? 'text-[#356267]' : 'text-[#356267]/40'} />
                  </div>
                  <div className="flex-1">
                    <div className="text-[14px] font-bold text-[#10214b]">{doc.label}</div>
                    <div className="text-[12px] text-[#356267]/60">{doc.desc}</div>
                  </div>
                  {active && (
                    <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#356267]">
                      <Check size={15} className="text-white" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <button onClick={() => setStep(2)} className={btnPrimary}>
            Suivant <ArrowRight size={19} />
          </button>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ÉTAPE 2 — Upload / Capture du document
  // ════════════════════════════════════════════════════════════════════════════
  if (step === 2) {
    const docLabel = docType === 'passport' ? 'passeport' : docType === 'cni' ? "carte d'identité" : 'carte de séjour';
    return (
      <div className={pageWrap}>
        <PageGlow />
        <div className={`${cardBase} max-w-[520px]`}>
          <div className={cardLine} />

          {banner && (
            <Banner type={banner.type} message={banner.message} onDismiss={clearBanner} autoDismiss={banner.autoDismiss} />
          )}

          <div className="mb-5 flex items-center gap-3">
            <button onClick={() => setStep(1)} className={backBtn}>
              <ChevronLeft size={18} />
            </button>
            <h3 className="text-[16px] font-bold text-[#10214b]">Scanner le document</h3>
          </div>
          <StepBar currentStep={1} />
          <h2 className="mb-5 text-[20px] font-extrabold text-[#10214b]">
            Photographiez votre {docLabel}
          </h2>

          {!capturedImage && !showCamera && (
            <div className="mb-5 flex flex-col gap-2.5">
              <div
                onClick={() => setShowCamera(true)}
                className="cursor-pointer rounded-[10px] border-2 border-dashed border-[#356267]/25 bg-[#c2f2f2]/20 px-5 py-7 text-center transition-colors hover:bg-[#c2f2f2]/35"
              >
                <Camera size={40} className="mx-auto mb-2.5 text-[#356267]" />
                <div className="mb-1 text-[15px] font-semibold text-[#10214b]">Prendre une photo</div>
                <div className="text-[12px] text-[#356267]/60">Ouvrir la caméra de l'appareil</div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="h-px flex-1 bg-[rgba(16,33,75,0.08)]" />
                <span className="text-[12px] text-[#356267]/45">ou</span>
                <div className="h-px flex-1 bg-[rgba(16,33,75,0.08)]" />
              </div>

              <button onClick={() => fileInputRef.current?.click()} className={btnSecondary}>
                <ImagePlus size={18} /> Choisir depuis la galerie
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
            </div>
          )}

          {showCamera && !capturedImage && (
            <div className="mb-5">
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                className="w-full rounded-[10px] border-2 border-[#356267]/25"
              />
              <div className="mt-3 flex gap-2.5">
                <button onClick={handleCaptureDoc} className={`${btnPrimary} flex-[2]`}>
                  <Aperture size={18} /> Capturer
                </button>
                <button onClick={() => setShowCamera(false)} className={`${btnSecondary} flex-1`}>
                  Annuler
                </button>
              </div>
            </div>
          )}

          {capturedImage && (
            <div className="mb-5">
              <h4 className="mb-3 font-semibold text-[#10214b]">Vérifiez la photo</h4>
              <img
                src={capturedImage}
                alt="document"
                className="max-h-[300px] w-full rounded-[10px] border-2 border-[#356267]/25 object-cover"
              />
              <div className="my-3 rounded-[10px] border border-[#356267]/20 bg-[#c2f2f2]/20 px-4 py-3">
                {['Texte clairement lisible', "Pas de reflets ni d'ombres", 'Les quatre coins visibles', 'Image nette et non floue'].map((item, i) => (
                  <div key={i} className={`flex items-center gap-2.5 ${i < 3 ? 'mb-1.5' : ''}`}>
                    <CheckCircle2 size={17} className="flex-shrink-0 text-[#356267]" />
                    <span className="text-[13px] text-[#356267]">{item}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2.5">
                <button onClick={handleSendOCR} disabled={loading} className={`${btnPrimary} flex-[2]`}>
                  {loading
                    ? <><Loader2 size={16} className="animate-spin" /> Analyse en cours…</>
                    : <><ScanLine size={16} /> Analyser le document</>
                  }
                </button>
                <button
                  onClick={() => { setCapturedImage(null); setCapturedFile(null); }}
                  className={`${btnSecondary} flex-1`}
                >
                  <RefreshCw size={16} /> Reprendre
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ÉTAPE 3 — Confirmation des données extraites
  // ════════════════════════════════════════════════════════════════════════════
  if (step === 3) {
    const confidence = extractedData?.confidence_score
      ? Math.round(extractedData.confidence_score) : null;
    const isPasseport = extractedData?.document_type === 'passeport';

    // Lignes d'identité affichées dynamiquement selon le type de document :
    // - 'carte'     -> uniquement NNI
    // - 'passeport' -> Numéro de Passeport + NNI
    const identiteRows = isPasseport
      ? [
          ['Numéro de Passeport', extractedData?.numero_passeport],
          ['NNI',                 extractedData?.nni],
          ['Nom',                 extractedData?.nom_fr],
          ['Prénom',              extractedData?.prenom_fr],
        ]
      : [
          ['NNI',    extractedData?.nni],
          ['Nom',    extractedData?.nom_fr],
          ['Prénom', extractedData?.prenom_fr],
        ];

    return (
      <div className={pageWrap}>
        <PageGlow />
        <div className={`${cardBase} max-w-[520px]`}>
          <div className={cardLine} />

          {banner && (
            <Banner type={banner.type} message={banner.message} onDismiss={clearBanner} autoDismiss={banner.autoDismiss} />
          )}

          <div className="mb-5 flex items-center gap-3">
            <button onClick={() => setStep(2)} className={backBtn}>
              <ChevronLeft size={18} />
            </button>
            <h3 className="text-[16px] font-bold text-[#10214b]">Confirmer vos informations</h3>
          </div>
          <StepBar currentStep={2} />
          <h2 className="mb-1 text-[20px] font-extrabold text-[#10214b]">
            Informations extraites
          </h2>
          <p className="mb-3.5 text-[13px] text-[#356267]/60">
            Vérifiez que ces informations sont correctes
          </p>

          {confidence && (
            <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-[#356267]/25 bg-[#c2f2f2]/30 px-3.5 py-1.5 text-[13px] font-bold text-[#356267]">
              <ShieldCheck size={16} />
              Confiance : {confidence}%
            </div>
          )}

          {confidence && confidence <= 50 && confidence > 25 && (
            <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-[rgba(194,135,46,0.3)] bg-[#fdf3e3] px-3.5 py-2.5">
              <AlertTriangle size={18} className="flex-shrink-0 text-[#b4791f]" />
              <div>
                <div className="mb-1 text-[12px] font-semibold text-[#b4791f]">
                  ⚠️ Confiance limitée ({confidence}%)
                </div>
                <div className="text-[11px] leading-snug text-[#b4791f]">
                  Certaines informations n'ont pas pu être lues correctement.
                  Veuillez vérifier et corriger les champs ci-dessus avant de continuer.
                </div>
              </div>
            </div>
          )}

          {!extractedData?.face_image_base64 && (
            <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-[rgba(194,135,46,0.3)] bg-[#fdf3e3] px-3.5 py-2.5">
              <Info size={18} className="mt-0.5 flex-shrink-0 text-[#b4791f]" />
              <span className="text-[12px] leading-relaxed text-[#b4791f]">
                Aucun visage extrait du document. La vérification faciale sera plus stricte.
              </span>
            </div>
          )}

          <div className="mb-3.5">
            <p className={sectionLabel}>IDENTITÉ</p>
            <div className={infoBox}>
              {identiteRows.map(([label, value], i, arr) => (
                <div key={label} className={`${infoRow} ${i < arr.length - 1 ? 'border-b border-[rgba(16,33,75,0.08)]' : ''}`}>
                  <span className="text-[14px] text-[#356267]/60">{label}</span>
                  <span className={`text-[14px] font-semibold ${value ? 'text-[#10214b]' : 'text-[#356267]/40'}`}>
                    {value || '—'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-5">
            <p className={sectionLabel}>ÉTAT CIVIL</p>
            <div className={infoBox}>
              {[
                ['Lieu de naissance', extractedData?.birth_place],
                ['Date de naissance', extractedData?.birth_date],
                ['Sexe',              extractedData?.gender === 'M' ? 'Masculin' : extractedData?.gender === 'F' ? 'Féminin' : extractedData?.gender || '—'],
                ['Nationalité',       extractedData?.nationality],
              ].map(([label, value], i, arr) => (
                <div key={label} className={`${infoRow} ${i < arr.length - 1 ? 'border-b border-[rgba(16,33,75,0.08)]' : ''}`}>
                  <span className="text-[14px] text-[#356267]/60">{label}</span>
                  <span className={`text-[14px] font-semibold ${value ? 'text-[#10214b]' : 'text-[#356267]/40'}`}>
                    {value || '—'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button onClick={handleConfirmData} disabled={loading} className={btnPrimary}>
            {loading
              ? <><Loader2 size={16} className="animate-spin" /> En cours…</>
              : <><Check size={18} /> Confirmer et continuer</>
            }
          </button>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ÉTAPE 4 — Vérification Face ID
  // ════════════════════════════════════════════════════════════════════════════
  if (step === 4) {
    return (
      <div className={pageWrap}>
        <PageGlow />
        <div className={`${cardBase} max-w-[520px]`}>
          <div className={cardLine} />

          {banner && (
            <Banner type={banner.type} message={banner.message} onDismiss={clearBanner} autoDismiss={banner.autoDismiss} />
          )}

          <div className="mb-5 flex items-center gap-3">
            <button onClick={() => setStep(3)} className={backBtn}>
              <ChevronLeft size={18} /> Retour
            </button>
            <h3 className="text-[16px] font-bold text-[#10214b]">Reconnaissance faciale</h3>
          </div>
          <StepBar currentStep={3} />
          <h2 className="mb-1.5 text-[20px] font-extrabold text-[#10214b]">
            Prenez un selfie
          </h2>
          <p className="mb-5 text-[13px] leading-relaxed text-[#356267]/60">
            Positionnez votre visage dans le cercle, dans un endroit bien éclairé
          </p>

          {!selfiePreview && !showSelfieCamera && (
            <div className="mb-5 text-center">
              <div className="mx-auto mb-5 flex h-[200px] w-[200px] items-center justify-center rounded-full border-[3px] border-dashed border-[#356267]/25 bg-[#c2f2f2]/20">
                <User size={68} className="text-[#356267]/30" />
              </div>
              <button onClick={() => setShowSelfieCamera(true)} className={`${btnPrimary} w-auto px-7`}>
                <Camera size={18} /> Ouvrir la caméra
              </button>
            </div>
          )}

          {showSelfieCamera && !selfiePreview && (
            <div className="mb-5">
              <div className="mx-auto mb-4 h-[240px] w-[240px] overflow-hidden rounded-full border-[3px] border-[#356267] shadow-[0_0_0_6px_rgba(53,98,103,0.12)]">
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  videoConstraints={{ facingMode: 'user' }}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="mb-3 flex items-center gap-2.5 rounded-lg border border-[#356267]/20 bg-[#c2f2f2]/25 px-3.5 py-2.5">
                <Lightbulb size={18} className="flex-shrink-0 text-[#356267]" />
                <span className="text-[12px] leading-relaxed text-[#356267]">
                  Retirez lunettes, regardez la caméra, bonne lumière
                </span>
              </div>
              <div className="flex gap-2.5">
                <button onClick={handleCaptureSelfie} className={`${btnPrimary} flex-[2]`}>
                  <Aperture size={18} /> Prendre le selfie
                </button>
                <button onClick={() => setShowSelfieCamera(false)} className={`${btnSecondary} flex-1`}>
                  Annuler
                </button>
              </div>
            </div>
          )}

          {selfiePreview && (
            <div className="mb-5">
              <div className="mx-auto mb-4 h-[200px] w-[200px] overflow-hidden rounded-full border-[3px] border-[#356267] shadow-[0_0_0_6px_rgba(53,98,103,0.12)]">
                <img src={selfiePreview} alt="selfie" className="h-full w-full object-cover" />
              </div>

              {faceResult && !faceResult.verified && (
                <div className="mb-4 rounded-[10px] border border-[rgba(213,80,83,0.25)] bg-[rgba(213,80,83,0.08)] p-4">
                  <div className="mb-3 flex items-start gap-3">
                    <AlertCircle size={23} className="flex-shrink-0 text-[#d55053]" />
                    <div>
                      <div className="mb-1 text-[14px] font-bold text-[#d55053]">
                        {faceResult.connection_interrupted
                          ? 'Connexion interrompue'
                          : (faceResult.document_type === 'passport' && 'Vérification passeport échouée') ||
                            (faceResult.document_type === 'cni' && "Vérification carte d'identité échouée") ||
                            (faceResult.document_type === 'sejour' && 'Vérification carte de séjour échouée') ||
                            'Échec de la vérification'}
                      </div>
                      <div className="text-[13px] leading-snug text-[#d55053]">
                        {faceResult.message || (
                          faceResult.document_type === 'passport' ? 'Le visage ne correspond pas à la photo du passeport.' :
                          faceResult.document_type === 'cni' ? "Le visage ne correspond pas à la photo de la carte d'identité nationale." :
                          faceResult.document_type === 'sejour' ? 'Le visage ne correspond pas à la photo de la carte de séjour.' :
                          "Le visage ne correspond pas au document d'identité."
                        )}
                      </div>
                    </div>
                  </div>

                  {faceResult.similarity_score !== undefined && !faceResult.connection_interrupted && (
                    <div className="mb-3">
                      <div className="mb-1 flex justify-between">
                        <span className="text-[12px] text-[#356267]/60">Similarité faciale</span>
                        <span className={`text-[12px] font-semibold ${faceResult.similarity_score >= 75 ? 'text-[#459071]' : 'text-[#d55053]'}`}>
                          {faceResult.similarity_score}%
                        </span>
                      </div>
                      <div className={progressTrack}>
                        <div
                          className="h-full rounded"
                          style={{
                            width: `${Math.min(faceResult.similarity_score, 100)}%`,
                            background: `linear-gradient(90deg, ${faceResult.similarity_score >= 75 ? '#459071' : '#d55053'}, #356267)`,
                          }}
                        />
                      </div>
                      {faceResult.similarity_score < 75 && (
                        <div className="mt-1 text-[11px] text-[#356267]/45">
                          Seuil minimum requis : 75%
                        </div>
                      )}
                    </div>
                  )}

                  {faceResult.liveness_score !== undefined && !faceResult.connection_interrupted && (
                    <div className="mb-3">
                      <div className="mb-1 flex justify-between">
                        <span className="text-[12px] text-[#356267]/60">Anti-spoofing (liveness)</span>
                        <span className={`text-[12px] font-semibold ${faceResult.liveness_score >= 50 ? 'text-[#459071]' : 'text-[#d55053]'}`}>
                          {faceResult.liveness_score}%
                        </span>
                      </div>
                      <div className={progressTrack}>
                        <div
                          className="h-full rounded"
                          style={{
                            width: `${Math.min(faceResult.liveness_score, 100)}%`,
                            background: `linear-gradient(90deg, ${faceResult.liveness_score >= 50 ? '#459071' : '#d55053'}, #356267)`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {faceResult.nova_decision && (
                    <div className="mt-2 rounded-lg bg-[#c2f2f2]/30 px-3 py-2">
                      <span className="text-[11px] text-[#356267]/60">Décision du système : </span>
                      <span className={`text-[11px] font-semibold ${faceResult.nova_decision === 'allow' ? 'text-[#459071]' : 'text-[#d55053]'}`}>
                        {faceResult.nova_decision === 'allow' ? 'Autorisé ' : 'Refusé '}
                      </span>
                    </div>
                  )}

                  {faceResult.connection_interrupted && (
                    <div className="mt-3 flex items-start gap-2 rounded-lg bg-[#c2f2f2]/30 px-3 py-2.5">
                      <Info size={16} className="flex-shrink-0 text-[#356267]" />
                      <span className="text-[11px] leading-snug text-[#356267]">
                        Si vous pensez que votre identité a déjà été vérifiée, essayez de vous reconnecter.
                        Sinon, reprenez un nouveau selfie.
                      </span>
                    </div>
                  )}

                  {!faceResult.connection_interrupted && !faceResult.suggestion && (
                    <div className="mt-3 flex items-start gap-2 rounded-lg bg-[#c2f2f2]/30 px-3 py-2.5">
                      <Info size={16} className="flex-shrink-0 text-[#356267]" />
                      <span className="text-[11px] leading-snug text-[#356267]">
                        {faceResult.document_type === 'passport' && 'Assurez-vous que la photo du passeport est visible et que vous êtes bien éclairé.'}
                        {faceResult.document_type === 'cni' && 'Prenez un selfie bien éclairé, de face, sans lunettes ni masque.'}
                        {faceResult.document_type === 'sejour' && 'Placez-vous face à la caméra, dans un endroit bien éclairé.'}
                        {!faceResult.document_type && 'Prenez un selfie bien éclairé, de face, sans lunettes ni masque.'}
                      </span>
                    </div>
                  )}

                  {!faceResult.connection_interrupted && faceResult.suggestion && (
                    <div className="mt-3 flex items-start gap-2 rounded-lg bg-[#c2f2f2]/30 px-3 py-2.5">
                      <Info size={16} className="flex-shrink-0 text-[#356267]" />
                      <span className="text-[11px] leading-snug text-[#356267]">
                        {faceResult.suggestion}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {faceResult && faceResult.verified && (
                <div className="mb-4 flex items-center gap-2.5 rounded-[10px] border border-[rgba(78,166,116,0.3)] bg-[#e9f8e7] px-4 py-3">
                  <CheckCircle2 size={22} className="text-[#459071]" />
                  <span className="text-[13px] text-[#459071]">
                    {faceResult.message || 'Identité vérifiée avec succès !'}
                  </span>
                </div>
              )}

              <div className="flex gap-2.5">
                <button onClick={handleVerifyFace} disabled={loading} className={`${btnPrimary} flex-[2]`}>
                  {loading
                    ? <><Loader2 size={16} className="animate-spin" /> Vérification…</>
                    : <><Search size={16} /> Vérifier mon identité</>
                  }
                </button>
                <button
                  onClick={() => { setSelfiePreview(null); setSelfieBlob(null); setFaceResult(null); setShowSelfieCamera(true); }}
                  className={`${btnSecondary} flex-1`}
                >
                  <RefreshCw size={16} /> Reprendre
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ÉTAPE 5 — Succès
  // ════════════════════════════════════════════════════════════════════════════
  if (step === 5) {
    return (
      <div className={pageWrap}>
        <PageGlow />
        <div className={`${cardBase} max-w-[480px] text-center`}>
          <div className={cardLine} />

          {banner && (
            <Banner type={banner.type} message={banner.message} onDismiss={clearBanner} autoDismiss={banner.autoDismiss} />
          )}

          <div className="mx-auto mb-6 flex h-[100px] w-[100px] items-center justify-center rounded-full border-2 border-[#356267]/25 bg-[#c2f2f2]/30 shadow-[0_0_0_6px_rgba(53,98,103,0.08)]">
            <div className="flex h-[74px] w-[74px] items-center justify-center rounded-full bg-gradient-to-br from-[#356267] to-[#4ea674]">
              <Check size={36} className="text-white" />
            </div>
          </div>

          <div className="mb-4 rounded-[10px] border border-[rgba(78,166,116,0.3)] bg-[#e9f8e7] px-5 py-4 text-left">
            <div className="flex items-start gap-3">
              <PartyPopper size={27} className="flex-shrink-0 text-[#459071]" />
              <div>
                <div className="mb-1 text-[16px] font-extrabold text-[#459071]">
                  Bienvenue sur FinanceApp !
                </div>
                <div className="text-[14px] leading-relaxed text-[#459071]">
                  Votre compte a été vérifié avec succès. Vous pouvez dès maintenant vous connecter avec votre adresse email pour profiter de tous nos services financiers.
                </div>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {['Compte vérifié', 'Sécurisé', 'Prêt à utiliser'].map(label => (
                    <span
                      key={label}
                      className="inline-flex items-center gap-1 rounded-full bg-white/60 px-2.5 py-1 text-[11px] font-semibold text-[#459071]"
                    >
                      <CheckCircle2 size={12} />
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <h2 className="mb-2 text-[24px] font-extrabold text-[#10214b]">
            Vérification réussie !
          </h2>
          <p className="mb-6 text-[14px] leading-relaxed text-[#356267]/60">
            Votre identité a été vérifiée. Toutes les fonctionnalités sont maintenant disponibles.
          </p>

          {faceResult && (
            <div className="mb-6 rounded-[10px] border border-[rgba(16,33,75,0.08)] bg-[#f8fafc] p-5 text-left">
              <p className="mb-3.5 text-[14px] font-bold text-[#10214b]">
                Résultats biométriques
              </p>
              <div className="mb-3">
                <div className="mb-1 flex justify-between">
                  <span className="text-[14px] text-[#356267]/60">Similarité faciale</span>
                  <span className="font-bold text-[#356267]">
                    {faceResult.similarity_score || 100}%
                  </span>
                </div>
                <div className={progressTrack}>
                  <div
                    className="h-full rounded bg-gradient-to-r from-[#356267] to-[#4ea674]"
                    style={{ width: `${Math.min(faceResult.similarity_score || 100, 100)}%` }}
                  />
                </div>
              </div>
              {faceResult.liveness_score !== undefined && (
                <div>
                  <div className="mb-1 flex justify-between">
                    <span className="text-[14px] text-[#356267]/60">Score liveness</span>
                    <span className="font-bold text-[#356267]">
                      {faceResult.liveness_score}%
                    </span>
                  </div>
                  <div className={progressTrack}>
                    <div
                      className="h-full rounded bg-gradient-to-r from-[#356267] to-[#4ea674]"
                      style={{ width: `${Math.min(faceResult.liveness_score || 0, 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <button
            onClick={() => {
              clearBanner();
              // 🆕 Redirection vers le tableau de bord au lieu de /authchoix
              navigate('/dashboard');
            }}
            className={`${btnPrimary} bg-gradient-to-br from-[#356267] to-[#4ea674] hover:enabled:bg-none hover:enabled:bg-[#2a4f53]`}
          >
            <LogIn size={18} />
            OK — Accéder à mon compte
          </button>
        </div>
      </div>
    );
  }

  return null;
}