import React, { useState, /*useEffect*/ } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import {
  Handshake,
  UserRound,
  Phone,
  KeyRound,
  ShieldCheck,
  Loader2,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Sparkles,
} from 'lucide-react';

const TEL_REGEX = /^\+222[234]\d{7}$/;

const notifySuccess = (message) => {
  toast.custom(
    (t) => (
      <div
        className={`${
          t.visible ? 'animate-in fade-in slide-in-from-top-2' : 'opacity-0'
        } flex w-full max-w-sm items-start gap-3 rounded-2xl border border-[#4ea674]/20 bg-white p-4 shadow-xl shadow-black/10 transition-all duration-300`}
      >
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e9f8e7]">
          <CheckCircle2 className="h-5 w-5 text-[#459071]" strokeWidth={2.25} />
        </div>
        <div className="flex-1 pt-0.5">
          <p className="text-sm font-semibold text-[#10214b]">Succès</p>
          <p className="mt-0.5 whitespace-pre-line text-[13px] leading-snug text-[#356267]/80">
            {message}
          </p>
        </div>
      </div>
    ),
    { duration: 3500 }
  );
};

const notifyError = (message) => {
  toast.custom(
    (t) => (
      <div
        className={`${
          t.visible ? 'animate-in fade-in slide-in-from-top-2' : 'opacity-0'
        } flex w-full max-w-sm items-start gap-3 rounded-2xl border border-[#d55053]/20 bg-white p-4 shadow-xl shadow-black/10 transition-all duration-300`}
      >
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#d55053]/10">
          <XCircle className="h-5 w-5 text-[#d55053]" strokeWidth={2.25} />
        </div>
        <div className="flex-1 pt-0.5">
          <p className="text-sm font-semibold text-[#10214b]">Une erreur est survenue</p>
          <p className="mt-0.5 whitespace-pre-line text-[13px] leading-snug text-[#356267]/80">
            {message}
          </p>
        </div>
      </div>
    ),
    { duration: 4500 }
  );
};

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
      notifySuccess('Compte activé avec succès ! Bienvenue !');
      navigate('/dashboard');
      window.location.reload();
    } catch (err) {
      const data = err.response?.data;
      if (data) {
        const msgs = Object.entries(data).map(([k, v]) => `${Array.isArray(v) ? v.join(' ') : v}`).join('\n');
        notifyError(msgs);
      } else {
        notifyError("Erreur lors de l'activation.");
      }
    } finally {
      setLoading(false);
    }
  };

  const fieldWrapper = 'flex flex-col gap-1.5';
  const labelClass = 'text-[11px] font-bold uppercase tracking-wider text-[#356267]/70';
  const inputBase =
    'w-full min-h-[46px] rounded-xl border bg-white px-4 py-3 text-[15px] text-[#10214b] outline-none transition-all duration-300 placeholder:text-[#356267]/30 focus:ring-4';
  const inputState = (hasError) =>
    hasError
      ? 'border-[#d55053] focus:border-[#d55053] focus:ring-[#d55053]/10'
      : 'border-[#ebe7e1] focus:border-[#356267] focus:ring-[#c2f2f2]/60';
  const errorText = 'flex items-center gap-1 text-xs font-medium text-[#d55053]';

  /* ---------------------------------------------------------------- */
  /* Shared page shell: deep-blue gradient, blur orbs, subtle grid     */
  /* ---------------------------------------------------------------- */
  const PageShell = ({ children }) => (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#10214b] px-4 py-10 sm:px-6">
      {/* textured grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
          backgroundSize: '44px 44px',
        }}
      />
      {/* blur orbs */}
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#356267] opacity-40 blur-[100px]" />
      <div className="pointer-events-none absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-[#c2f2f2] opacity-20 blur-[120px]" />
      <div className="pointer-events-none absolute right-1/4 top-1/3 h-56 w-56 rounded-full bg-[#4ea674] opacity-10 blur-[100px]" />
      <div className="relative z-10 w-full">{children}</div>
    </div>
  );

  if (!token) {
    return (
      <PageShell>
        <div className="mx-auto flex w-full max-w-md flex-col items-center rounded-3xl bg-white p-10 text-center shadow-2xl shadow-black/30 sm:p-12">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#d55053]/10">
            <AlertTriangle className="h-8 w-8 text-[#d55053]" strokeWidth={2} />
          </div>
          <h2 className="text-xl font-extrabold text-[#10214b]">
            Lien d'invitation invalide
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#356267]/70">
            Ce lien d'invitation est invalide ou a expiré. Demandez un nouveau lien à votre administrateur.
          </p>
          <Link
            to="/connexion"
            className="group mt-8 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#356267] px-6 text-sm font-bold text-white transition-all duration-300 hover:scale-[1.02] hover:bg-[#2a4f53] hover:shadow-lg hover:shadow-[#356267]/30"
          >
            Se connecter
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="mx-auto w-full max-w-xl">
        <div className="overflow-hidden rounded-3xl bg-white shadow-2xl shadow-black/30">
          {/* header band */}
          <div className="relative border-b border-[#ebe7e1] bg-gradient-to-br from-[#10214b] to-[#356267] px-8 py-10 text-center sm:px-12">
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.08]"
              style={{
                backgroundImage:
                  'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
                backgroundSize: '28px 28px',
              }}
            />
            <div className="relative z-10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#c2f2f2]/20 backdrop-blur-sm">
              <Handshake className="h-8 w-8 text-[#c2f2f2]" strokeWidth={2} />
            </div>
            <h2 className="relative z-10 text-2xl font-extrabold tracking-tight text-white">
              Activation de votre compte
            </h2>
            <p className="relative z-10 mx-auto mt-2 max-w-sm text-sm leading-relaxed text-[#c2f2f2]/80">
              Vous avez été invité à rejoindre une entreprise sur FinanceApp. Complétez votre profil pour commencer.
            </p>
          </div>

          {/* form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-8 py-8 sm:px-12 sm:py-10">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className={fieldWrapper}>
                <label className={labelClass}>Nom *</label>
                <div className="relative">
                  <UserRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#356267]/40" />
                  <input
                    name="nom"
                    value={form.nom}
                    onChange={handleChange}
                    placeholder="Diallo"
                    className={`${inputBase} ${inputState(errors.nom)} pl-10`}
                    required
                  />
                </div>
                {errors.nom && (
                  <p className={errorText}>
                    <AlertTriangle className="h-3.5 w-3.5" /> {errors.nom}
                  </p>
                )}
              </div>

              <div className={fieldWrapper}>
                <label className={labelClass}>Prénom *</label>
                <div className="relative">
                  <UserRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#356267]/40" />
                  <input
                    name="prenom"
                    value={form.prenom}
                    onChange={handleChange}
                    placeholder="Mamadou"
                    className={`${inputBase} ${inputState(errors.prenom)} pl-10`}
                    required
                  />
                </div>
                {errors.prenom && (
                  <p className={errorText}>
                    <AlertTriangle className="h-3.5 w-3.5" /> {errors.prenom}
                  </p>
                )}
              </div>
            </div>

            <div className={fieldWrapper}>
              <label className={labelClass}>Téléphone (+222XXXXXXXX)</label>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#356267]/40" />
                <input
                  name="telephone"
                  value={form.telephone}
                  onChange={handleChange}
                  placeholder="+222XXXXXXXX"
                  className={`${inputBase} ${inputState(errors.telephone)} pl-10`}
                  required
                />
              </div>
              {errors.telephone && (
                <p className={errorText}>
                  <AlertTriangle className="h-3.5 w-3.5" /> {errors.telephone}
                </p>
              )}
            </div>

            <div className={fieldWrapper}>
              <label className={labelClass}>Code de l'application (min. 6 caractères)</label>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#356267]/40" />
                <input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`${inputBase} ${inputState(errors.password)} pl-10`}
                  required
                  minLength={6}
                />
              </div>
              {errors.password && (
                <p className={errorText}>
                  <AlertTriangle className="h-3.5 w-3.5" /> {errors.password}
                </p>
              )}
            </div>

            <div className={fieldWrapper}>
              <label className={labelClass}>Confirmer le code</label>
              <div className="relative">
                <ShieldCheck className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#356267]/40" />
                <input
                  name="password_confirm"
                  type="password"
                  value={form.password_confirm}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`${inputBase} ${inputState(errors.password_confirm)} pl-10`}
                  required
                />
              </div>
              {errors.password_confirm && (
                <p className={errorText}>
                  <AlertTriangle className="h-3.5 w-3.5" /> {errors.password_confirm}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`group relative mt-2 flex min-h-[48px] w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-[#10214b] to-[#356267] text-[15px] font-bold text-white transition-all duration-300 ${
                loading
                  ? 'cursor-not-allowed opacity-80'
                  : 'hover:scale-[1.01] hover:shadow-lg hover:shadow-[#356267]/30 active:scale-[0.99]'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4.5 w-4.5 animate-spin" />
                  Activation...
                </>
              ) : (
                <>
                  <Sparkles className="h-4.5 w-4.5 transition-transform duration-300 group-hover:rotate-12" />
                  Activer mon compte
                </>
              )}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-[#c2f2f2]/60">
          Vos informations sont chiffrées et protégées.
        </p>
      </div>
    </PageShell>
  );
}