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

// ─── Boxicons CDN (inject once) ───────────────────────────────────────────────
const injectBoxicons = () => {
  if (!document.getElementById('boxicons-css')) {
    const link = document.createElement('link');
    link.id   = 'boxicons-css';
    link.rel  = 'stylesheet';
    link.href = 'https://cdn.jsdelivr.net/npm/boxicons@2.1.4/css/boxicons.min.css';
    document.head.appendChild(link);
  }
  if (!document.getElementById('kyc-fonts')) {
    const link = document.createElement('link');
    link.id   = 'kyc-fonts';
    link.rel  = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap';
    document.head.appendChild(link);
  }
  if (!document.getElementById('kyc-anim')) {
    const style = document.createElement('style');
    style.id = 'kyc-anim';
    style.textContent = `
      @keyframes kycSpin { to { transform: rotate(360deg); } }
      @keyframes kycFadeUp { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
      @keyframes kycPulse { 0%,100%{box-shadow:0 0 0 0 rgba(255,255,255,.2)} 50%{box-shadow:0 0 0 14px rgba(255,255,255,0)} }
      @keyframes kycBannerSlide { from { opacity:0; transform:translateY(-20px); } to { opacity:1; transform:translateY(0); } }
      @keyframes kycBannerFade { 0%,80%{opacity:1;transform:translateY(0);} 100%{opacity:0;transform:translateY(-20px);} }
      .bx-spin-kyc { animation: kycSpin .8s linear infinite; display:inline-block; }
      .kyc-banner-slide { animation: kycBannerSlide .4s ease; }
      .kyc-banner-auto { animation: kycBannerSlide .4s ease, kycBannerFade 4s ease forwards; }
    `;
    document.head.appendChild(style);
  }
};

// ─── Design tokens — thème bleu FinanceApp ───────────────────────────────────
const T = {
  bg:          '#1a3a8f',
  bgGradient:  'linear-gradient(135deg, #1a3a8f 0%, #1e4db7 40%, #2563eb 100%)',
  surface:     '#ffffff',
  surfaceAlt:  '#f1f5ff',
  border:      '#dce8ff',
  accent:      '#1e4db7',
  accentHover: '#1a3a8f',
  accentBg:    'rgba(30,77,183,.08)',
  accentBdr:   'rgba(30,77,183,.25)',
  accentGlow:  '0 4px 20px rgba(30,77,183,.35)',
  blue:        '#2563eb',
  blueBg:      'rgba(37,99,235,.08)',
  blueBdr:     'rgba(37,99,235,.25)',
  text:        '#0f1e3d',
  textMuted:   '#6b7a9e',
  textSub:     '#4a5880',
  danger:      '#dc2626',
  dangerBg:    'rgba(220,38,38,.06)',
  dangerBdr:   'rgba(220,38,38,.2)',
  warn:        '#d97706',
  warnBg:      'rgba(217,119,6,.06)',
  warnBdr:     'rgba(217,119,6,.2)',
  success:     '#059669',
  successBg:   'rgba(5,150,105,.08)',
  successBdr:  'rgba(5,150,105,.2)',
  font:        "'DM Sans', sans-serif",
  fontDisplay: "'Syne', sans-serif",
  radius:      '20px',
  radiusSm:    '12px',
  radiusXs:    '8px',
};

// ─── Reusable style objects ───────────────────────────────────────────────────
const S = {
  page: {
    minHeight: '100vh',
    background: T.bgGradient,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px 16px',
    fontFamily: T.font,
  },
  card: {
    background: T.surface,
    border: `1px solid ${T.border}`,
    borderRadius: T.radius,
    padding: '36px 32px',
    maxWidth: 500,
    margin: '0 auto',
    width: '100%',
    animation: 'kycFadeUp .35s ease',
    position: 'relative',
    overflow: 'hidden',
    boxShadow: '0 20px 60px rgba(10,30,100,.25)',
  },
  cardLine: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 3,
    background: `linear-gradient(90deg, ${T.accent}, ${T.blue})`,
    borderRadius: '20px 20px 0 0',
  },
  btnPrimary: {
    width: '100%',
    padding: '14px 20px',
    background: T.accent,
    color: '#ffffff',
    border: 'none',
    borderRadius: T.radiusSm,
    fontWeight: 700,
    fontSize: 15,
    fontFamily: T.font,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    letterSpacing: '.2px',
    boxShadow: T.accentGlow,
    transition: 'transform .15s, box-shadow .15s',
  },
  btnSecondary: {
    width: '100%',
    padding: '13px 20px',
    background: 'transparent',
    color: T.textSub,
    border: `1px solid ${T.border}`,
    borderRadius: T.radiusSm,
    fontWeight: 500,
    fontSize: 14,
    fontFamily: T.font,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  backBtn: {
    background: T.surfaceAlt,
    border: `1px solid ${T.border}`,
    borderRadius: T.radiusXs,
    padding: '7px 13px',
    cursor: 'pointer',
    color: T.textSub,
    fontFamily: T.font,
    fontWeight: 500,
    fontSize: 14,
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: 700,
    color: T.textMuted,
    textTransform: 'uppercase',
    letterSpacing: '1.1px',
    margin: '0 0 10px',
    fontFamily: T.font,
  },
  infoBox: {
    background: T.surfaceAlt,
    borderRadius: T.radiusSm,
    border: `1px solid ${T.border}`,
    overflow: 'hidden',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
  },
  progressBar: {
    background: T.border,
    borderRadius: 4,
    height: 6,
    overflow: 'hidden',
    marginTop: 6,
  },
};

// ─── Banner component ─────────────────────────────────────────────────────────
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

  const styles = {
    success: { bg: T.successBg, border: T.successBdr, icon: 'bx-check-circle', color: T.success },
    error:   { bg: T.dangerBg,  border: T.dangerBdr,  icon: 'bx-error-circle', color: T.danger },
    warning: { bg: T.warnBg,    border: T.warnBdr,    icon: 'bx-error',       color: T.warn },
    info:    { bg: T.accentBg,  border: T.accentBdr,  icon: 'bx-info-circle', color: T.accent },
  };

  const style = styles[type] || styles.info;

  return (
    <div className="kyc-banner-slide" style={{
      background: style.bg,
      border: `1px solid ${style.border}`,
      borderRadius: T.radiusXs,
      padding: '12px 16px',
      marginBottom: 16,
      display: 'flex',
      alignItems: 'flex-start',
      gap: 10,
      position: 'relative',
    }}>
      <i className={`bx ${style.icon}`} style={{ fontSize: 20, color: style.color, flexShrink: 0, marginTop: 1 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, color: style.color, lineHeight: 1.5, fontFamily: T.font }}>
          {message}
        </div>
      </div>
      {!autoDismiss && (
        <button
          onClick={() => { setVisible(false); if (onDismiss) onDismiss(); }}
          style={{
            background: 'transparent',
            border: 'none',
            color: style.color,
            cursor: 'pointer',
            fontSize: 18,
            padding: '0 0 0 8px',
            flexShrink: 0,
          }}
        >
          <i className="bx bx-x" />
        </button>
      )}
    </div>
  );
}

// ─── StepBar ──────────────────────────────────────────────────────────────────
function StepBar({ currentStep, totalSteps = 4 }) {
  const labels = ['Document', 'Scan', 'Données', 'Selfie'];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 28 }}>
      {Array.from({ length: totalSteps }, (_, i) => (
        <React.Fragment key={i}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 12, fontFamily: T.font,
              background: i < currentStep
                ? T.accent
                : i === currentStep ? 'transparent' : T.surfaceAlt,
              color: i < currentStep ? '#fff' : i === currentStep ? T.accent : T.textMuted,
              border: i === currentStep
                ? `2px solid ${T.accent}`
                : i < currentStep ? 'none' : `2px solid ${T.border}`,
              boxShadow: i === currentStep ? T.accentGlow : 'none',
              flexShrink: 0,
              transition: 'all .3s',
            }}>
              {i < currentStep
                ? <i className="bx bx-check" style={{ fontSize: 16 }} />
                : i + 1}
            </div>
            <span style={{
              fontSize: 9, fontWeight: 700, letterSpacing: '.6px',
              textTransform: 'uppercase', whiteSpace: 'nowrap',
              color: i <= currentStep ? T.accent : T.textMuted,
              fontFamily: T.font,
            }}>
              {labels[i]}
            </span>
          </div>
          {i < totalSteps - 1 && (
            <div style={{
              flex: 1, height: 2, borderRadius: 1, margin: '0 3px',
              marginBottom: 18,
              background: i < currentStep
                ? `linear-gradient(90deg, ${T.accent}, ${T.blue})`
                : T.border,
              transition: 'background .3s',
            }} />
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
  const [docType,          setDocType]          = useState('cni');
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

  useEffect(() => { injectBoxicons(); }, []);

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
      <div style={S.page}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 44, height: 44,
            border: '3px solid rgba(255,255,255,.3)',
            borderTopColor: '#fff',
            borderRadius: '50%',
            animation: 'kycSpin .8s linear infinite',
            margin: '0 auto 16px',
          }} />
          <p style={{ color: 'rgba(255,255,255,.8)', fontSize: 14, fontFamily: T.font }}>
            Chargement de votre session…
          </p>
        </div>
      </div>
    );
  }

  // ── No userId ───────────────────────────────────────────────────────────────
  if (!userId) {
    return (
      <div style={S.page}>
        <div style={{ ...S.card, textAlign: 'center', padding: '48px 32px' }}>
          <div style={S.cardLine} />
          <i className="bx bx-error-circle" style={{ fontSize: 56, color: T.warn, marginBottom: 16 }} />
          <p style={{ color: T.textSub, marginBottom: 24, fontFamily: T.font }}>
            Session expirée. Veuillez recommencer.
          </p>
          <button
            onClick={() => navigate('/connexion')}
            style={{ ...S.btnPrimary, width: 'auto', padding: '12px 28px' }}
          >
            <i className="bx bx-log-in" style={{ fontSize: 18 }} /> Retour à la connexion
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
      const result = await kycService.extractDocument(capturedFile);
      
      if (result.status === 'success') {
        if (result.confidence_score <= 25) {
          showBanner('❌ Document illisible. Veuillez prendre une photo plus claire et mieux éclairée.', 'error');
          setLoading(false);
          return;
        }
        setExtractedData({ ...result, document_type: docType });
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
        nom_fr: extractedData?.nom_fr || '',
        prenom_fr: extractedData?.prenom_fr || '',
        birth_date: extractedData?.birth_date || '',
        birth_place: extractedData?.birth_place || '',
        gender: extractedData?.gender || '',
        nationality: extractedData?.nationality || 'MRT',
        document_type: extractedData?.document_type || 'cni',
        face_image_base64: extractedData?.face_image_base64 || '',
        document_full_image_base64: extractedData?.document_full_image_base64 || '',
      };
      
      console.log("[KYC] Envoi confirmation avec:", {
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

  const handleVerifyFace = async () => {
    if (!selfieBlob) return;
    setLoading(true);
    clearBanner();
    try {
      const result = await kycService.verifyFace(userId, selfieBlob);
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
    } catch (err) {
      const errData = err.response?.data;
      errData.document_type = docType;
      setFaceResult(errData || { verified: false, similarity_score: 0, message: 'Erreur de vérification.' });
      showBanner(errData?.message || 'Visage non reconnu. Réessayez.', 'error');
    } finally { setLoading(false); }
  };

  // ════════════════════════════════════════════════════════════════════════════
  // ÉTAPE 0 — Introduction
  // ════════════════════════════════════════════════════════════════════════════
  if (step === 0) {
    return (
      <div style={S.page}>
        <div style={S.card}>
          <div style={S.cardLine} />

          {banner && (
            <Banner
              type={banner.type}
              message={banner.message}
              onDismiss={clearBanner}
              autoDismiss={banner.autoDismiss}
            />
          )}

          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: T.accentBg, border: `2px solid ${T.accentBdr}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 18px',
              animation: 'kycPulse 2.5s ease infinite',
            }}>
              <i className="bx bx-shield-quarter" style={{ fontSize: 36, color: T.accent }} />
            </div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: T.text, fontFamily: T.fontDisplay }}>
              Vérification d'identité
            </h2>
            <p style={{ margin: '8px 0 0', color: T.textMuted, fontSize: 14, lineHeight: 1.65, fontFamily: T.font }}>
              Complétez ces étapes pour activer votre compte.
            </p>
          </div>

          <div style={{
            background: T.surfaceAlt, border: `1px solid ${T.border}`,
            borderRadius: T.radiusSm, padding: '12px 16px', marginBottom: 20,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <i className="bx bx-time-five" style={{ fontSize: 22, color: T.accent, flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: T.text, fontFamily: T.font }}>Temps estimé</div>
              <div style={{ fontSize: 12, color: T.textMuted, fontFamily: T.font }}>2 – 5 minutes</div>
            </div>
          </div>

          <div style={{ marginBottom: 22 }}>
            {[
              { icon: 'bx-id-card',      title: 'Scannez votre document',     desc: "Carte d'identité nationale ou passeport" },
              { icon: 'bx-check-shield', title: 'Confirmez vos informations', desc: 'Vérifiez les données extraites automatiquement' },
              { icon: 'bx-face',         title: 'Vérification faciale',       desc: 'Un selfie pour confirmer votre identité' },
            ].map((item, i) => (
              <div key={i} style={{
                display: 'flex', gap: 14, marginBottom: 10,
                background: T.surfaceAlt, border: `1px solid ${T.border}`,
                borderRadius: T.radiusSm, padding: '13px 15px',
              }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 11, flexShrink: 0,
                  background: T.accentBg, border: `1px solid ${T.accentBdr}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <i className={`bx ${item.icon}`} style={{ fontSize: 22, color: T.accent }} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: T.text, fontFamily: T.font }}>{item.title}</div>
                  <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2, fontFamily: T.font }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{
            background: T.accentBg, border: `1px solid ${T.accentBdr}`,
            borderRadius: T.radiusXs, padding: '10px 14px', marginBottom: 22,
            display: 'flex', gap: 10, alignItems: 'flex-start',
          }}>
            <i className="bx bx-lock-alt" style={{ fontSize: 17, color: T.accent, marginTop: 1, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: T.accent, lineHeight: 1.6, fontFamily: T.font }}>
              Vos données sont traitées de façon sécurisée et chiffrée.
            </span>
          </div>

          <button onClick={() => setStep(1)} style={S.btnPrimary}>
            Commencer la vérification
            <i className="bx bx-right-arrow-alt" style={{ fontSize: 20 }} />
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
      { val: 'passport', label: 'Passeport',                   desc: 'Document de voyage international',            icon: 'bx-globe' },
      { val: 'cni',      label: "Carte d'identité nationale",  desc: "Pièce d'identité officielle mauritanienne",   icon: 'bx-id-card' },
      { val: 'sejour',   label: 'Carte de séjour',             desc: 'Pour les résidents étrangers',                icon: 'bx-home' },
    ];
    return (
      <div style={S.page}>
        <div style={{ ...S.card, maxWidth: 520 }}>
          <div style={S.cardLine} />
          
          {banner && (
            <Banner
              type={banner.type}
              message={banner.message}
              onDismiss={clearBanner}
              autoDismiss={banner.autoDismiss}
            />
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <button onClick={() => setStep(0)} style={S.backBtn}>
              <i className="bx bx-chevron-left" style={{ fontSize: 18 }} />
            </button>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.text, fontFamily: T.fontDisplay }}>
              Type de document
            </h3>
          </div>
          <StepBar currentStep={0} />
          <h2 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 800, color: T.text, fontFamily: T.fontDisplay }}>
            Choisissez votre document
          </h2>
          <p style={{ margin: '0 0 20px', color: T.textMuted, fontSize: 13, fontFamily: T.font }}>
            Sélectionnez le document à utiliser.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
            {documents.map(doc => (
              <div key={doc.val} onClick={() => setDocType(doc.val)} style={{
                border: `1.5px solid ${docType === doc.val ? T.accent : T.border}`,
                borderRadius: T.radiusSm, padding: '16px', cursor: 'pointer',
                background: docType === doc.val ? T.accentBg : T.surfaceAlt,
                display: 'flex', alignItems: 'center', gap: 14,
                transition: 'all .15s',
                boxShadow: docType === doc.val ? T.accentGlow : 'none',
              }}>
                <div style={{
                  width: 46, height: 46, borderRadius: 12, flexShrink: 0,
                  background: docType === doc.val ? T.accentBg : T.surface,
                  border: `1px solid ${docType === doc.val ? T.accentBdr : T.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <i className={`bx ${doc.icon}`} style={{ fontSize: 24, color: docType === doc.val ? T.accent : T.textMuted }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: T.text, fontFamily: T.font }}>{doc.label}</div>
                  <div style={{ fontSize: 12, color: T.textMuted, fontFamily: T.font }}>{doc.desc}</div>
                </div>
                {docType === doc.val && (
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                    background: T.accent,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <i className="bx bx-check" style={{ fontSize: 15, color: '#fff' }} />
                  </div>
                )}
              </div>
            ))}
          </div>

          <button onClick={() => setStep(2)} style={S.btnPrimary}>
            Suivant <i className="bx bx-right-arrow-alt" style={{ fontSize: 20 }} />
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
      <div style={S.page}>
        <div style={{ ...S.card, maxWidth: 520 }}>
          <div style={S.cardLine} />
          
          {banner && (
            <Banner
              type={banner.type}
              message={banner.message}
              onDismiss={clearBanner}
              autoDismiss={banner.autoDismiss}
            />
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <button onClick={() => setStep(1)} style={S.backBtn}>
              <i className="bx bx-chevron-left" style={{ fontSize: 18 }} />
            </button>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.text, fontFamily: T.fontDisplay }}>
              Scanner le document
            </h3>
          </div>
          <StepBar currentStep={1} />
          <h2 style={{ margin: '0 0 20px', fontSize: 20, fontWeight: 800, color: T.text, fontFamily: T.fontDisplay }}>
            Photographiez votre {docLabel}
          </h2>

          {!capturedImage && !showCamera && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              <div
                onClick={() => setShowCamera(true)}
                style={{
                  border: `2px dashed ${T.accentBdr}`,
                  borderRadius: T.radiusSm, padding: '28px 20px',
                  textAlign: 'center', cursor: 'pointer',
                  background: T.accentBg,
                }}
              >
                <i className="bx bx-camera" style={{ fontSize: 42, color: T.accent, display: 'block', marginBottom: 10 }} />
                <div style={{ fontWeight: 600, fontSize: 15, color: T.text, fontFamily: T.font, marginBottom: 4 }}>
                  Prendre une photo
                </div>
                <div style={{ fontSize: 12, color: T.textMuted, fontFamily: T.font }}>
                  Ouvrir la caméra de l'appareil
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ flex: 1, height: 1, background: T.border }} />
                <span style={{ fontSize: 12, color: T.textMuted, fontFamily: T.font }}>ou</span>
                <div style={{ flex: 1, height: 1, background: T.border }} />
              </div>

              <button onClick={() => fileInputRef.current?.click()} style={S.btnSecondary}>
                <i className="bx bx-image-add" style={{ fontSize: 18 }} /> Choisir depuis la galerie
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} style={{ display: 'none' }} />
            </div>
          )}

          {showCamera && !capturedImage && (
            <div style={{ marginBottom: 20 }}>
              <Webcam ref={webcamRef} audio={false} screenshotFormat="image/jpeg"
                style={{ width: '100%', borderRadius: T.radiusSm, border: `2px solid ${T.accentBdr}` }} />
              <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                <button onClick={handleCaptureDoc} style={{ ...S.btnPrimary, flex: 2 }}>
                  <i className="bx bx-aperture" style={{ fontSize: 18 }} /> Capturer
                </button>
                <button onClick={() => setShowCamera(false)} style={{ ...S.btnSecondary, flex: 1 }}>
                  Annuler
                </button>
              </div>
            </div>
          )}

          {capturedImage && (
            <div style={{ marginBottom: 20 }}>
              <h4 style={{ margin: '0 0 12px', color: T.text, fontFamily: T.font }}>Vérifiez la photo</h4>
              <img src={capturedImage} alt="document" style={{
                width: '100%', borderRadius: T.radiusSm,
                border: `2px solid ${T.accentBdr}`,
                objectFit: 'cover', maxHeight: 300,
              }} />
              <div style={{
                background: T.accentBg, border: `1px solid ${T.accentBdr}`,
                borderRadius: T.radiusSm, padding: '12px 16px', margin: '12px 0',
              }}>
                {['Texte clairement lisible', "Pas de reflets ni d'ombres", 'Les quatre coins visibles', 'Image nette et non floue'].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: i < 3 ? 7 : 0 }}>
                    <i className="bx bx-check-circle" style={{ fontSize: 18, color: T.accent, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: T.accent, fontFamily: T.font }}>{item}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={handleSendOCR} disabled={loading} style={{ ...S.btnPrimary, flex: 2, opacity: loading ? .6 : 1 }}>
                  {loading
                    ? <><i className="bx bx-loader-alt bx-spin-kyc" style={{ fontSize: 16 }} /> Analyse en cours…</>
                    : <><i className="bx bx-scan" style={{ fontSize: 16 }} /> Analyser le document</>
                  }
                </button>
                <button onClick={() => { setCapturedImage(null); setCapturedFile(null); }}
                  style={{ ...S.btnSecondary, flex: 1 }}>
                  <i className="bx bx-refresh" style={{ fontSize: 16 }} /> Reprendre
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
      ? Math.round(extractedData.confidence_score * 100) : null;
    return (
      <div style={S.page}>
        <div style={{ ...S.card, maxWidth: 520 }}>
          <div style={S.cardLine} />
          
          {banner && (
            <Banner
              type={banner.type}
              message={banner.message}
              onDismiss={clearBanner}
              autoDismiss={banner.autoDismiss}
            />
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <button onClick={() => setStep(2)} style={S.backBtn}>
              <i className="bx bx-chevron-left" style={{ fontSize: 18 }} />
            </button>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.text, fontFamily: T.fontDisplay }}>
              Confirmer vos informations
            </h3>
          </div>
          <StepBar currentStep={2} />
          <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 800, color: T.text, fontFamily: T.fontDisplay }}>
            Informations extraites
          </h2>
          <p style={{ margin: '0 0 14px', fontSize: 13, color: T.textMuted, fontFamily: T.font }}>
            Vérifiez que ces informations sont correctes
          </p>

          {confidence && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              background: T.accentBg, border: `1px solid ${T.accentBdr}`,
              borderRadius: 20, padding: '5px 14px', marginBottom: 16,
              fontSize: 13, color: T.accent, fontWeight: 700, fontFamily: T.font,
            }}>
              <i className="bx bx-check-shield" style={{ fontSize: 16 }} />
              Confiance : {confidence}%
            </div>
          )}

          {confidence && confidence <= 50 && confidence > 25 && (
            <div style={{
              background: T.warnBg,
              border: `1px solid ${T.warnBdr}`,
              borderRadius: T.radiusXs,
              padding: '10px 14px',
              marginBottom: 16,
              display: 'flex',
              gap: 10,
              alignItems: 'flex-start',
            }}>
              <i className="bx bx-error" style={{ fontSize: 18, color: T.warn, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 12, color: T.warn, fontWeight: 600, marginBottom: 4 }}>
                  ⚠️ Confiance limitée ({confidence}%)
                </div>
                <div style={{ fontSize: 11, color: T.warn, lineHeight: 1.4 }}>
                  Certaines informations n'ont pas pu être lues correctement.
                  Veuillez vérifier et corriger les champs ci-dessus avant de continuer.
                </div>
              </div>
            </div>
          )}

          {!extractedData?.face_image_base64 && (
            <div style={{
              background: T.warnBg, border: `1px solid ${T.warnBdr}`,
              borderRadius: T.radiusXs, padding: '10px 14px', marginBottom: 16,
              display: 'flex', gap: 10, alignItems: 'flex-start',
            }}>
              <i className="bx bx-info-circle" style={{ fontSize: 18, color: T.warn, marginTop: 1, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: T.warn, lineHeight: 1.6, fontFamily: T.font }}>
                Aucun visage extrait du document. La vérification faciale sera plus stricte.
              </span>
            </div>
          )}

          <div style={{ marginBottom: 14 }}>
            <p style={S.sectionLabel}>IDENTITÉ</p>
            <div style={S.infoBox}>
              {[
                ['NNI',         extractedData?.nni],
                ['Nom ',     extractedData?.nom_fr],
                ['Prénom ', extractedData?.prenom_fr],
                ['Nom du père', extractedData?.father_name]
              ].map(([label, value], i, arr) => (
                <div key={label} style={{ ...S.infoRow, borderBottom: i < arr.length - 1 ? `1px solid ${T.border}` : 'none' }}>
                  <span style={{ fontSize: 14, color: T.textMuted, fontFamily: T.font }}>{label}</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: value ? T.text : T.textMuted, fontFamily: T.font }}>
                    {value || '—'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <p style={S.sectionLabel}>ÉTAT CIVIL</p>
            <div style={S.infoBox}>
              {[
                ['Lieu de naissance', extractedData?.birth_place],
                ['Date de naissance', extractedData?.birth_date],
                ['Sexe',              extractedData?.gender === 'M' ? 'Masculin' : extractedData?.gender === 'F' ? 'Féminin' : extractedData?.gender || '—'],
                ['Nationalité',       extractedData?.nationality],
              ].map(([label, value], i, arr) => (
                <div key={label} style={{ ...S.infoRow, borderBottom: i < arr.length - 1 ? `1px solid ${T.border}` : 'none' }}>
                  <span style={{ fontSize: 14, color: T.textMuted, fontFamily: T.font }}>{label}</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: value ? T.text : T.textMuted, fontFamily: T.font }}>
                    {value || '—'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button onClick={handleConfirmData} disabled={loading} style={{ ...S.btnPrimary, opacity: loading ? .6 : 1 }}>
            {loading
              ? <><i className="bx bx-loader-alt bx-spin-kyc" style={{ fontSize: 16 }} /> En cours…</>
              : <><i className="bx bx-check" style={{ fontSize: 18 }} /> Confirmer et continuer</>
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
      <div style={S.page}>
        <div style={{ ...S.card, maxWidth: 520 }}>
          <div style={S.cardLine} />
          
          {banner && (
            <Banner
              type={banner.type}
              message={banner.message}
              onDismiss={clearBanner}
              autoDismiss={banner.autoDismiss}
            />
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <button onClick={() => setStep(3)} style={S.backBtn}>
              <i className="bx bx-chevron-left" style={{ fontSize: 18 }} /> Retour
            </button>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.text, fontFamily: T.fontDisplay }}>
              Reconnaissance faciale
            </h3>
          </div>
          <StepBar currentStep={3} />
          <h2 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 800, color: T.text, fontFamily: T.fontDisplay }}>
            Prenez un selfie
          </h2>
          <p style={{ margin: '0 0 20px', fontSize: 13, color: T.textMuted, lineHeight: 1.65, fontFamily: T.font }}>
            Positionnez votre visage dans le cercle, dans un endroit bien éclairé
          </p>

          {!selfiePreview && !showSelfieCamera && (
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{
                width: 200, height: 200, borderRadius: '50%',
                border: `3px dashed ${T.accentBdr}`,
                background: T.accentBg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 22px',
              }}>
                <i className="bx bx-user" style={{ fontSize: 72, color: T.accentBdr }} />
              </div>
              <button onClick={() => setShowSelfieCamera(true)}
                style={{ ...S.btnPrimary, width: 'auto', padding: '13px 28px' }}>
                <i className="bx bx-camera" style={{ fontSize: 18 }} /> Ouvrir la caméra
              </button>
            </div>
          )}

          {showSelfieCamera && !selfiePreview && (
            <div style={{ marginBottom: 20 }}>
              <div style={{
                position: 'relative', overflow: 'hidden', borderRadius: '50%',
                width: 240, height: 240, margin: '0 auto 16px',
                border: `3px solid ${T.accent}`,
                boxShadow: T.accentGlow,
              }}>
                <Webcam ref={webcamRef} audio={false} screenshotFormat="image/jpeg"
                  videoConstraints={{ facingMode: 'user' }}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{
                background: T.blueBg, border: `1px solid ${T.blueBdr}`,
                borderRadius: T.radiusXs, padding: '10px 14px', marginBottom: 12,
                display: 'flex', gap: 10, alignItems: 'center',
              }}>
                <i className="bx bx-bulb" style={{ fontSize: 18, color: T.blue, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: T.blue, lineHeight: 1.6, fontFamily: T.font }}>
                  Retirez lunettes, regardez la caméra, bonne lumière
                </span>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={handleCaptureSelfie} style={{ ...S.btnPrimary, flex: 2 }}>
                  <i className="bx bx-aperture" style={{ fontSize: 18 }} /> Prendre le selfie
                </button>
                <button onClick={() => setShowSelfieCamera(false)} style={{ ...S.btnSecondary, flex: 1 }}>
                  Annuler
                </button>
              </div>
            </div>
          )}

          {selfiePreview && (
            <div style={{ marginBottom: 20 }}>
              <div style={{
                width: 200, height: 200, borderRadius: '50%', overflow: 'hidden',
                margin: '0 auto 16px',
                border: `3px solid ${T.accent}`,
                boxShadow: T.accentGlow,
              }}>
                <img src={selfiePreview} alt="selfie" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>

              {faceResult && !faceResult.verified && (
                <div style={{
                  background: T.dangerBg,
                  border: `1px solid ${T.dangerBdr}`,
                  borderRadius: T.radiusSm,
                  padding: '16px',
                  marginBottom: 16,
                }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 12 }}>
                    <i className="bx bx-error-circle" style={{ fontSize: 24, color: T.danger, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: T.danger, marginBottom: 4 }}>
                        {faceResult.document_type === 'passport' && 'Vérification passeport échouée'}
                        {faceResult.document_type === 'cni' && 'Vérification carte d\'identité échouée'}
                        {faceResult.document_type === 'sejour' && 'Vérification carte de séjour échouée'}
                        {!faceResult.document_type && 'Échec de la vérification'}
                      </div>
                      <div style={{ fontSize: 13, color: T.danger, lineHeight: 1.4 }}>
                        {faceResult.message || (
                          faceResult.document_type === 'passport' ? 'Le visage ne correspond pas à la photo du passeport.' :
                          faceResult.document_type === 'cni' ? 'Le visage ne correspond pas à la photo de la carte d\'identité nationale.' :
                          faceResult.document_type === 'sejour' ? 'Le visage ne correspond pas à la photo de la carte de séjour.' :
                          'Le visage ne correspond pas au document d\'identité.'
                        )}
                      </div>
                    </div>
                  </div>

                  {faceResult.similarity_score !== undefined && (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 12, color: T.textMuted }}>Similarité faciale</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: faceResult.similarity_score >= 75 ? T.success : T.danger }}>
                          {faceResult.similarity_score}%
                        </span>
                      </div>
                      <div style={S.progressBar}>
                        <div style={{
                          width: `${Math.min(faceResult.similarity_score, 100)}%`,
                          height: '100%',
                          borderRadius: 4,
                          background: `linear-gradient(90deg, ${faceResult.similarity_score >= 75 ? T.success : T.danger}, ${T.accent})`,
                        }} />
                      </div>
                      {faceResult.similarity_score < 75 && (
                        <div style={{ fontSize: 11, color: T.textMuted, marginTop: 4 }}>
                          Seuil minimum requis : 75%
                        </div>
                      )}
                    </div>
                  )}

                  {faceResult.liveness_score !== undefined && (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 12, color: T.textMuted }}>Anti-spoofing (liveness)</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: faceResult.liveness_score >= 50 ? T.success : T.danger }}>
                          {faceResult.liveness_score}%
                        </span>
                      </div>
                      <div style={S.progressBar}>
                        <div style={{
                          width: `${Math.min(faceResult.liveness_score, 100)}%`,
                          height: '100%',
                          borderRadius: 4,
                          background: `linear-gradient(90deg, ${faceResult.liveness_score >= 50 ? T.success : T.danger}, ${T.accent})`,
                        }} />
                      </div>
                    </div>
                  )}

                  {faceResult.nova_decision && (
                    <div style={{
                      background: T.accentBg,
                      borderRadius: T.radiusXs,
                      padding: '8px 12px',
                      marginTop: 8,
                    }}>
                      <span style={{ fontSize: 11, color: T.textMuted }}>Décision du système : </span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: faceResult.nova_decision === 'allow' ? T.success : T.danger }}>
                        {faceResult.nova_decision === 'allow' ? 'Autorisé ✅' : 'Refusé ❌'}
                      </span>
                    </div>
                  )}

                  {!faceResult.suggestion && (
                    <div style={{
                      background: T.blueBg,
                      borderRadius: T.radiusXs,
                      padding: '10px 12px',
                      marginTop: 12,
                      display: 'flex',
                      gap: 8,
                      alignItems: 'flex-start',
                    }}>
                      <i className="bx bx-info-circle" style={{ fontSize: 16, color: T.blue }} />
                      <span style={{ fontSize: 11, color: T.blue, lineHeight: 1.4 }}>
                        {faceResult.document_type === 'passport' && 'Assurez-vous que la photo du passeport est visible et que vous êtes bien éclairé.'}
                        {faceResult.document_type === 'cni' && 'Prenez un selfie bien éclairé, de face, sans lunettes ni masque.'}
                        {faceResult.document_type === 'sejour' && 'Placez-vous face à la caméra, dans un endroit bien éclairé.'}
                        {!faceResult.document_type && 'Prenez un selfie bien éclairé, de face, sans lunettes ni masque.'}
                      </span>
                    </div>
                  )}

                  {faceResult.suggestion && (
                    <div style={{
                      background: T.blueBg,
                      borderRadius: T.radiusXs,
                      padding: '10px 12px',
                      marginTop: 12,
                      display: 'flex',
                      gap: 8,
                      alignItems: 'flex-start',
                    }}>
                      <i className="bx bx-info-circle" style={{ fontSize: 16, color: T.blue }} />
                      <span style={{ fontSize: 11, color: T.blue, lineHeight: 1.4 }}>
                        {faceResult.suggestion}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {faceResult && faceResult.verified && (
                <div style={{
                  background: T.successBg,
                  border: `1px solid ${T.successBdr}`,
                  borderRadius: T.radiusSm,
                  padding: '12px 16px',
                  marginBottom: 16,
                  display: 'flex',
                  gap: 10,
                  alignItems: 'center',
                }}>
                  <i className="bx bx-check-circle" style={{ fontSize: 22, color: T.success }} />
                  <span style={{ fontSize: 13, color: T.success }}>
                    ✅ {faceResult.message || 'Identité vérifiée avec succès !'}
                  </span>
                </div>
              )}

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={handleVerifyFace} disabled={loading}
                  style={{ ...S.btnPrimary, flex: 2, opacity: loading ? .7 : 1 }}>
                  {loading
                    ? <><i className="bx bx-loader-alt bx-spin-kyc" style={{ fontSize: 16 }} /> Vérification…</>
                    : <><i className="bx bx-search-alt" style={{ fontSize: 16 }} /> Vérifier mon identité</>
                  }
                </button>
                <button
                  onClick={() => { setSelfiePreview(null); setSelfieBlob(null); setFaceResult(null); setShowSelfieCamera(true); }}
                  style={{ ...S.btnSecondary, flex: 1 }}>
                  <i className="bx bx-refresh" style={{ fontSize: 16 }} /> Reprendre
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
      <div style={S.page}>
        <div style={{ ...S.card, textAlign: 'center', maxWidth: 480 }}>
          <div style={S.cardLine} />
          
          {banner && (
            <Banner
              type={banner.type}
              message={banner.message}
              onDismiss={clearBanner}
              autoDismiss={banner.autoDismiss}
            />
          )}

          <div style={{
            width: 100, height: 100, borderRadius: '50%',
            background: T.accentBg, border: `2px solid ${T.accentBdr}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 22px',
            boxShadow: T.accentGlow,
          }}>
            <div style={{
              width: 74, height: 74, borderRadius: '50%',
              background: `linear-gradient(135deg, ${T.accent}, ${T.blue})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <i className="bx bx-check" style={{ fontSize: 38, color: '#fff' }} />
            </div>
          </div>

          <div style={{
            background: T.successBg,
            border: `1px solid ${T.successBdr}`,
            borderRadius: T.radiusSm,
            padding: '16px 20px',
            marginBottom: 16,
            textAlign: 'left',
          }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <i className="bx bx-party" style={{ fontSize: 28, color: T.success, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: T.success, marginBottom: 4, fontFamily: T.fontDisplay }}>
                  Bienvenue sur FinanceApp !
                </div>
                <div style={{ fontSize: 14, color: T.success, lineHeight: 1.6, fontFamily: T.font }}>
                  Votre compte a été vérifié avec succès. Vous pouvez dès maintenant vous connecter avec votre adresse email pour profiter de tous nos services financiers.
                </div>
                <div style={{
                  marginTop: 8,
                  display: 'flex',
                  gap: 6,
                  flexWrap: 'wrap',
                }}>
                  <span style={{
                    background: T.successBg,
                    padding: '2px 10px',
                    borderRadius: 12,
                    fontSize: 11,
                    fontWeight: 600,
                    color: T.success,
                    fontFamily: T.font,
                  }}>
                    <i className="bx bx-check-circle" style={{ fontSize: 12, marginRight: 4 }} />
                    Compte vérifié
                  </span>
                  <span style={{
                    background: T.successBg,
                    padding: '2px 10px',
                    borderRadius: 12,
                    fontSize: 11,
                    fontWeight: 600,
                    color: T.success,
                    fontFamily: T.font,
                  }}>
                    <i className="bx bx-check-circle" style={{ fontSize: 12, marginRight: 4 }} />
                    Sécurisé
                  </span>
                  <span style={{
                    background: T.successBg,
                    padding: '2px 10px',
                    borderRadius: 12,
                    fontSize: 11,
                    fontWeight: 600,
                    color: T.success,
                    fontFamily: T.font,
                  }}>
                    <i className="bx bx-check-circle" style={{ fontSize: 12, marginRight: 4 }} />
                    Prêt à utiliser
                  </span>
                </div>
              </div>
            </div>
          </div>

          <h2 style={{ margin: '0 0 8px', fontSize: 24, fontWeight: 800, color: T.text, fontFamily: T.fontDisplay }}>
            Vérification réussie !
          </h2>
          <p style={{ margin: '0 0 24px', color: T.textMuted, fontSize: 14, lineHeight: 1.7, fontFamily: T.font }}>
            Votre identité a été vérifiée. Toutes les fonctionnalités sont maintenant disponibles.
          </p>

          {faceResult && (
            <div style={{
              background: T.surfaceAlt, border: `1px solid ${T.border}`,
              borderRadius: T.radiusSm, padding: 20, marginBottom: 24, textAlign: 'left',
            }}>
              <p style={{ margin: '0 0 14px', fontWeight: 700, fontSize: 14, color: T.text, fontFamily: T.fontDisplay }}>
                Résultats biométriques
              </p>
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 14, color: T.textMuted, fontFamily: T.font }}>Similarité faciale</span>
                  <span style={{ fontWeight: 700, color: T.accent, fontFamily: T.font }}>
                    {faceResult.similarity_score || 100}%
                  </span>
                </div>
                <div style={S.progressBar}>
                  <div style={{
                    width: `${Math.min(faceResult.similarity_score || 100, 100)}%`,
                    height: '100%', borderRadius: 4,
                    background: `linear-gradient(90deg, ${T.accent}, ${T.blue})`,
                  }} />
                </div>
              </div>
              {faceResult.liveness_score !== undefined && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 14, color: T.textMuted, fontFamily: T.font }}>Score liveness</span>
                    <span style={{ fontWeight: 700, color: T.accent, fontFamily: T.font }}>
                      {faceResult.liveness_score}%
                    </span>
                  </div>
                  <div style={S.progressBar}>
                    <div style={{
                      width: `${Math.min(faceResult.liveness_score || 0, 100)}%`,
                      height: '100%', borderRadius: 4,
                      background: `linear-gradient(90deg, ${T.accent}, ${T.blue})`,
                    }} />
                  </div>
                </div>
              )}
            </div>
          )}

          <button 
            onClick={() => {
              clearBanner();
              navigate('/authchoix');
            }} 
            style={{
              ...S.btnPrimary,
              background: `linear-gradient(135deg, ${T.accent}, ${T.blue})`,
            }}
          >
            <i className="bx bx-log-in-circle" style={{ fontSize: 18 }} /> 
            OK — Accéder à mon compte
          </button>
        </div>
      </div>
    );
  }

  return null;
}