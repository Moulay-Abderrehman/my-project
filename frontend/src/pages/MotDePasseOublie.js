import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  LockKeyhole,
  ShieldCheck,
  Mail,
  Send,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  RefreshCw,
  LogIn,
  Loader2,
  XCircle,
} from 'lucide-react';

// Styles de toast réutilisables, cohérents avec la charte graphique de l'app
const toastSuccessStyle = {
  icon: <ShieldCheck size={18} color="#356267" />,
  style: {
    background: '#ffffff',
    color: '#10214b',
    border: '1px solid #356267',
    borderRadius: '12px',
    padding: '12px 16px',
    fontSize: '13px',
    fontWeight: 600,
    boxShadow: '0 8px 24px rgba(53,98,103,0.15)',
  },
  iconTheme: {
    primary: '#356267',
    secondary: '#ffffff',
  },
};

const toastErrorStyle = {
  icon: <XCircle size={18} color="#d55053" />,
  style: {
    background: '#ffffff',
    color: '#10214b',
    border: '1px solid #d55053',
    borderRadius: '12px',
    padding: '12px 16px',
    fontSize: '13px',
    fontWeight: 600,
    boxShadow: '0 8px 24px rgba(213,80,83,0.15)',
  },
  iconTheme: {
    primary: '#d55053',
    secondary: '#ffffff',
  },
};

export default function MotDePasseOublie() {
  const navigate = useNavigate();
  const [etape, setEtape] = useState('email'); // 'email' | 'code'
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [nouveauPassword, setNouveauPassword] = useState('');
  const [confirmerPassword, setConfirmerPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleEnvoyerCode = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      return toast.error('Veuillez saisir votre adresse email.', toastErrorStyle);
    }
    setLoading(true);
    try {
      await api.post('/comptes/mot-de-passe-oublie/', { email }, { headers: { Authorization: undefined } });
      toast.success('Code envoyé à votre email !', {
        ...toastSuccessStyle,
        icon: <Mail size={18} color="#356267" />,
      });
      setEtape('code');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur', toastErrorStyle);
    } finally {
      setLoading(false);
    }
  };

  const handleReinitialiser = async (e) => {
    e.preventDefault();
    if (!code.trim()) {
      return toast.error('Veuillez saisir le code de vérification.', toastErrorStyle);
    }
    if (!nouveauPassword.trim() || !confirmerPassword.trim()) {
      return toast.error('Veuillez remplir tous les champs.', toastErrorStyle);
    }
    if (nouveauPassword !== confirmerPassword) {
      return toast.error('Les mots de passe ne correspondent pas.', toastErrorStyle);
    }
    if (nouveauPassword.length < 6) {
      return toast.error('Le mot de passe doit contenir au moins 6 caractères.', toastErrorStyle);
    }
    setLoading(true);
    try {
      await api.post('/comptes/reinitialiser-mot-de-passe/', {
        email,
        code,
        nouveau_password: nouveauPassword,
        confirmer_password: confirmerPassword,
      }, { headers: { Authorization: undefined } });
      toast.success('Mot de passe réinitialisé !', toastSuccessStyle);
      navigate('/connexion');
    } catch (err) {
      toast.error(err.response?.data?.detail || err.response?.data?.error || 'Erreur', toastErrorStyle);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10 sm:py-16 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0c2e7c, #1e4db7, #3b82f6)' }}
    >
      {/* Fond décoratif discret */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-40 left-1/2 -translate-x-1/2 w-[560px] h-[560px] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(194,242,242,0.12) 0%, transparent 70%)' }}
        />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
            backgroundSize: '44px 44px',
          }}
        />
      </div>

      {/* Carte */}
      <div className="relative z-10 w-full max-w-[440px] bg-white rounded-3xl px-6 py-10 sm:px-9 sm:py-10 shadow-[0_24px_80px_rgba(0,0,0,0.25)]">

        {/* Back link */}
        <Link
          to="/connexion"
          className="inline-flex items-center gap-1.5 text-[#94a3b8] hover:text-[#356267] transition-colors text-xs font-semibold mb-6"
        >
          <ArrowLeft size={15} />
          Retour à la connexion
        </Link>

        {/* Icône + Titre */}
        <div className="text-center mb-7">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
              etape === 'email' ? 'bg-[#356267]' : 'bg-[#459071]'
            }`}
          >
            {etape === 'email' ? (
              <LockKeyhole size={26} className="text-white" />
            ) : (
              <ShieldCheck size={26} className="text-white" />
            )}
          </div>

          <h2 className="text-xl font-bold text-[#10214b] tracking-tight">
            {etape === 'email' ? 'Mot de passe oublié' : 'Réinitialisation'}
          </h2>
          <p className="mt-2 text-[13px] text-[rgba(53,98,103,0.75)] leading-relaxed">
            {etape === 'email' ? (
              'Entrez votre email pour recevoir un code de réinitialisation'
            ) : (
              <>
                Un code à 6 chiffres a été envoyé à
                <br />
                <strong className="text-[#10214b]">{email}</strong>
              </>
            )}
          </p>
        </div>

        <div className="h-px bg-[#f1f5f9] mb-6" />

        {/* ── ÉTAPE EMAIL ── */}
        {etape === 'email' ? (
          <form onSubmit={handleEnvoyerCode} className="flex flex-col gap-5">
            <div>
              <label className="flex items-center gap-1.5 text-[10.5px] text-[#475569] font-semibold uppercase tracking-wide mb-1.5">
                <Mail size={12} />
                Adresse Email
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="nom@domaine.com"
                  className="w-full box-border pl-11 pr-3.5 py-3.5 rounded-xl border border-[rgba(16,33,75,0.08)] bg-[#f8fafc] text-[#10214b] text-sm outline-none transition-colors focus:border-[#356267] focus:bg-white focus:ring-4 focus:ring-[rgba(53,98,103,0.1)] placeholder:text-[#cbd5e1]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[52px] bg-[#356267] text-white rounded-2xl px-4 font-bold text-[15px] flex items-center justify-center gap-2 transition-all hover:enabled:-translate-y-0.5 hover:enabled:bg-[#2a4f53] disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_4px_15px_rgba(53,98,103,0.25)]"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Send size={17} />
                  Envoyer le code
                </>
              )}
            </button>
          </form>
        ) : (
          /* ── ÉTAPE CODE + NOUVEAU MDP ── */
          <form onSubmit={handleReinitialiser} className="flex flex-col gap-4">

            {/* Code */}
            <div>
              <label className="flex items-center gap-1.5 text-[10.5px] text-[#475569] font-semibold uppercase tracking-wide mb-1.5">
                <KeyRound size={12} />
                Code de vérification (6 chiffres)
              </label>
              <input
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="• • • • • •"
                maxLength={6}
                className="w-full box-border px-3 py-2.5 rounded-xl border border-[rgba(16,33,75,0.08)] bg-[#f8fafc] text-[#356267] text-lg font-extrabold text-center tracking-[6px] outline-none transition-colors focus:border-[#356267] focus:bg-white focus:ring-4 focus:ring-[rgba(53,98,103,0.1)] placeholder:tracking-[4px] placeholder:text-[#cbd5e1]"
              />
            </div>

            {/* Nouveau mot de passe */}
            <div>
              <label className="flex items-center gap-1.5 text-[10.5px] text-[#475569] font-semibold uppercase tracking-wide mb-1.5">
                <Lock size={12} />
                Nouveau mot de passe
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none" />
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={nouveauPassword}
                  onChange={e => setNouveauPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                  className="w-full box-border pl-11 pr-11 py-3.5 rounded-xl border border-[rgba(16,33,75,0.08)] bg-[#f8fafc] text-[#10214b] text-sm outline-none transition-colors focus:border-[#356267] focus:bg-white focus:ring-4 focus:ring-[rgba(53,98,103,0.1)] placeholder:text-[#cbd5e1]"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#356267] transition-colors flex items-center"
                >
                  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirmer mot de passe */}
            <div>
              <label className="flex items-center gap-1.5 text-[10.5px] text-[#475569] font-semibold uppercase tracking-wide mb-1.5">
                <Lock size={12} />
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none" />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmerPassword}
                  onChange={e => setConfirmerPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full box-border pl-11 pr-11 py-3.5 rounded-xl border border-[rgba(16,33,75,0.08)] bg-[#f8fafc] text-[#10214b] text-sm outline-none transition-colors focus:border-[#356267] focus:bg-white focus:ring-4 focus:ring-[rgba(53,98,103,0.1)] placeholder:text-[#cbd5e1]"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#356267] transition-colors flex items-center"
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {confirmerPassword && nouveauPassword !== confirmerPassword && (
                <p className="mt-1.5 text-[11px] text-[#d55053] flex items-center gap-1">
                  <AlertCircle size={12} />
                  Les mots de passe ne correspondent pas
                </p>
              )}
            </div>

            {/* Bouton réinitialiser */}
            <button
              type="submit"
              disabled={loading}
              className="mt-1 w-full min-h-[52px] bg-[#4ea674] text-white rounded-2xl px-4 font-bold text-[15px] flex items-center justify-center gap-2 transition-all hover:enabled:-translate-y-0.5 hover:enabled:bg-[#459071] disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_4px_15px_rgba(78,166,116,0.25)]"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  En cours...
                </>
              ) : (
                <>
                  <ShieldCheck size={17} />
                  Réinitialiser le mot de passe
                </>
              )}
            </button>

            {/* Renvoyer code */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => setEtape('email')}
                className="inline-flex items-center gap-1.5 bg-transparent border-none text-[#356267] hover:text-[#2a4f53] hover:underline cursor-pointer text-[13px] font-semibold"
              >
                <RefreshCw size={15} />
                Renvoyer un nouveau code
              </button>
            </div>
          </form>
        )}

        {/* Footer */}
        <div className="text-center mt-6 pt-4 border-t border-[#f1f5f9]">
          <Link
            to="/connexion"
            className="inline-flex items-center gap-1.5 text-[#356267] hover:text-[#2a4f53] transition-colors font-bold text-[13px]"
          >
            <LogIn size={15} />
            Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  );
}