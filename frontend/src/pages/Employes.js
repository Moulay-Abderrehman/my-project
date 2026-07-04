// frontend/src/pages/Employes.js
import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import ActionBlockedModal from '../components/ActionBlockedModal';
import {
  Users,
  Search,
  Building2,
  Trophy,
  UserPlus,
  ChevronRight,
  Mail,
  X,
  Send,
  Link as LinkIcon,
  Copy,
  UserCheck,
  Clock,
  CheckCircle2,
  Crown,
  Lock,
  Info,
  Loader2,
} from 'lucide-react';

export default function Employes() {
  const { user, isVisitor, exitVisitorMode } = useAuth(); // 🆕
  const [employes, setEmployes] = useState([]);
  const [emailInvit, setEmailInvit] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingInvit, setLoadingInvit] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [lienManuel, setLienManuel] = useState('');

  // 🆕 Modal d'action bloquée
  const [actionBlockedModal, setActionBlockedModal] = useState({ isOpen: false, message: null });

  const isVisitorMode = isVisitor; // 🆕

  const chargerEmployes = async () => {
    // 🆕 Si mode visiteur, ne pas charger les employés réels
    if (isVisitorMode) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.get('/comptes/mes-employes/');
      setEmployes(res.data);
    } catch {
      setEmployes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { chargerEmployes(); }, [isVisitorMode]);

  // 🆕 Fonction pour ouvrir le modal d'action bloquée
  const ouvrirActionBloquee = (actionType = 'signup') => {
    const messages = {
      signup: {
        title: '🔒 Créez un compte',
        message: 'Pour inviter des employés, créez un compte en 30 secondes et passez à l\'abonnement Entreprise.',
        action: 'Créer un compte',
        actionType: 'signup'
      },
      subscribe: {
        title: '🚀 Abonnement Entreprise',
        message: 'La gestion des employés est réservée aux comptes Entreprise. Abonnez-vous pour y accéder.',
        action: 'Voir les offres',
        actionType: 'subscribe'
      }
    };
    setActionBlockedModal({
      isOpen: true,
      message: messages[actionType] || messages.signup,
    });
  };

  const handleInviter = async (e) => {
    e.preventDefault();

    // 🆕 Vérification du mode visiteur
    if (isVisitorMode) {
      ouvrirActionBloquee('signup');
      return;
    }

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
      // 🆕 Gestion du mode visiteur
      if (err.response?.status === 403 && err.response?.data?.visitor_mode) {
        ouvrirActionBloquee('signup');
        return;
      }
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

  // Helper: construit l'URL correcte de la photo
  const getPhotoUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return `http://localhost:8000${path}`;
  };

  const initiales = user
    ? `${(user.prenom || '')[0] || ''}${(user.nom || '')[0] || ''}`.toUpperCase()
    : '?';

  const activeCount = employes.filter(e => e.is_active).length;

  // 🆕 Données mock pour le mode visiteur
  const mockEmployes = [
    { id: 1, prenom: 'Marie', nom: 'Dupont', email: 'marie.dupont@demo.com', is_active: true, invitation_email: 'marie.dupont@demo.com' },
    { id: 2, prenom: 'Jean', nom: 'Martin', email: 'jean.martin@demo.com', is_active: true, invitation_email: 'jean.martin@demo.com' },
    { id: 3, prenom: '', nom: '', email: '', is_active: false, invitation_email: 'invitation@demo.com' },
  ];

  // Si mode visiteur, afficher les données mock
  const employesDisplay = isVisitorMode ? mockEmployes : employes;
  const activeCountDisplay = isVisitorMode ? 2 : activeCount;

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* 🆕 MODAL ACTION BLOQUÉE */}
      <ActionBlockedModal
        isOpen={actionBlockedModal.isOpen}
        onClose={() => setActionBlockedModal({ isOpen: false, message: null })}
        message={actionBlockedModal.message}
      />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-10 pb-12 space-y-4">

        {/* Header */}
        <div className="flex items-center gap-4 mb-2">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-white ${
              isVisitorMode ? 'bg-[#d55053]' : 'bg-[#356267]'
            }`}
          >
            {isVisitorMode ? <Search size={22} /> : <Users size={22} />}
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-[#10214b] tracking-tight flex items-center gap-2">
              Employés
              {isVisitorMode && (
                <span className="text-[11px] font-semibold bg-[rgba(213,80,83,0.08)] text-[#d55053] border border-[rgba(213,80,83,0.25)] px-2.5 py-0.5 rounded-full">
                  Démo
                </span>
              )}
            </h1>
            <p className="text-sm text-[rgba(53,98,103,0.75)] mt-1">
              {isVisitorMode
                ? 'Visualisation des données de démonstration'
                : `${employesDisplay.length} employé(s) · ${activeCountDisplay} actif(s)`}
            </p>
          </div>
        </div>

        {/* User Profile Card */}
        <div
          className={`bg-white rounded-2xl border px-6 py-4 flex items-center gap-4 flex-wrap shadow-[0_1px_2px_rgba(16,33,75,0.03)] ${
            isVisitorMode ? 'border-[rgba(213,80,83,0.25)]' : 'border-[rgba(16,33,75,0.08)]'
          }`}
        >
          <div className="w-12 h-12 rounded-xl bg-[#356267] text-white flex items-center justify-center font-semibold text-base flex-shrink-0 overflow-hidden">
            {isVisitorMode ? (
              <Search size={20} />
            ) : user?.photo_profil ? (
              <img src={getPhotoUrl(user.photo_profil)} alt="profil" className="w-full h-full object-cover" />
            ) : (
              <span>{initiales}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[15px] font-semibold text-[#10214b]">
              {isVisitorMode ? 'Explorateur Démo' : `${user?.prenom} ${user?.nom}`}
            </h3>
            <p className="text-xs text-[rgba(53,98,103,0.75)] mt-1 flex items-center gap-1.5">
              <Building2 size={13} />
              {isVisitorMode ? 'Mode Exploration' : 'Compte Entreprise'}
            </p>
          </div>
          <div
            className={`ml-auto flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border ${
              isVisitorMode
                ? 'bg-[rgba(213,80,83,0.08)] text-[#d55053] border-[rgba(213,80,83,0.25)]'
                : 'bg-[#c2f2f2] text-[#356267] border-[rgba(53,98,103,0.2)]'
            }`}
          >
            <Trophy size={13} />
            {isVisitorMode ? 'Démo' : 'Plan pro'}
          </div>
        </div>

        {/* Invitation Section */}
        {!isVisitorMode ? (
          <div>
            {!showForm ? (
              <button
                onClick={() => setShowForm(true)}
                className="w-full min-h-[56px] bg-white border border-dashed border-[rgba(16,33,75,0.16)] rounded-2xl px-6 flex items-center justify-center gap-2.5 text-[#356267] font-semibold text-[15px] transition-colors hover:bg-[#c2f2f2]/30 hover:border-[#356267]"
              >
                <UserPlus size={18} />
                <span>Inviter un employé</span>
                <ChevronRight size={18} />
              </button>
            ) : (
              <div className="bg-white rounded-2xl p-6 border border-[rgba(16,33,75,0.08)] shadow-[0_1px_2px_rgba(16,33,75,0.03)]">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-[10px] bg-[#c2f2f2] text-[#356267] flex items-center justify-center flex-shrink-0">
                    <Mail size={18} />
                  </div>
                  <h3 className="text-[15px] font-semibold text-[#10214b]">Nouvelle invitation</h3>
                  <button
                    onClick={() => { setShowForm(false); setLienManuel(''); }}
                    className="ml-auto w-8 h-8 rounded-lg flex items-center justify-center text-[rgba(53,98,103,0.45)] hover:bg-[#f8fafc] hover:text-[#10214b] transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleInviter} className="flex gap-3 flex-wrap">
                  <div className="flex-1 min-w-[200px] flex items-center gap-2.5 bg-[#f8fafc] border border-[rgba(16,33,75,0.08)] rounded-[10px] px-3.5 min-h-[44px]">
                    <Mail size={16} className="text-[rgba(53,98,103,0.45)] flex-shrink-0" />
                    <input
                      type="email"
                      value={emailInvit}
                      onChange={e => setEmailInvit(e.target.value)}
                      placeholder="email@exemple.com"
                      required
                      autoFocus
                      className="flex-1 bg-transparent border-none outline-none text-sm text-[#10214b] py-3"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loadingInvit || !emailInvit.trim()}
                    className="bg-[#356267] min-h-[44px] rounded-[10px] px-5 text-white font-semibold text-[13px] flex items-center justify-center gap-2 whitespace-nowrap transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loadingInvit ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Envoi...
                      </>
                    ) : (
                      <>
                        <Send size={16} /> Envoyer
                      </>
                    )}
                  </button>
                </form>

                {lienManuel && (
                  <div className="mt-4 bg-[#f8fafc] border border-[rgba(16,33,75,0.08)] rounded-[10px] px-4 py-3">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-[rgba(53,98,103,0.75)] mb-2">
                      <LinkIcon size={14} />
                      <span>Lien manuel</span>
                    </div>
                    <div className="flex gap-2">
                      <code className="flex-1 bg-white border border-[rgba(16,33,75,0.08)] px-3 py-2 rounded-lg text-[11px] break-all text-[rgba(53,98,103,0.75)]">
                        {lienManuel}
                      </code>
                      <button
                        onClick={() => { navigator.clipboard.writeText(lienManuel); toast.success('Lien copié !'); }}
                        className="bg-[#356267] rounded-lg px-3.5 text-white min-h-[36px] flex items-center justify-center hover:opacity-90 transition-opacity"
                      >
                        <Copy size={15} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          // 🆕 Mode visiteur - message d'incitation
          <div className="bg-white rounded-2xl p-6 border border-[rgba(213,80,83,0.25)]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-[10px] bg-[rgba(213,80,83,0.08)] text-[#d55053] flex items-center justify-center flex-shrink-0">
                <Lock size={18} />
              </div>
              <h3 className="text-[15px] font-semibold text-[#10214b]">Mode Exploration</h3>
            </div>
            <p className="text-sm text-[#d55053] mb-4 leading-relaxed">
              La gestion des employés est réservée aux comptes Entreprise. Créez un compte et abonnez-vous pour inviter vos employés.
            </p>
            <button
              onClick={() => ouvrirActionBloquee('subscribe')}
              className="w-full bg-[#d55053] min-h-[44px] rounded-[10px] px-5 text-white font-semibold text-[13px] flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
            >
              <Crown size={16} /> Créer un compte
            </button>
          </div>
        )}

        {/* Employees List Card */}
        <div
          className={`bg-white rounded-2xl p-6 border shadow-[0_1px_2px_rgba(16,33,75,0.03)] ${
            isVisitorMode ? 'border-[rgba(213,80,83,0.25)]' : 'border-[rgba(16,33,75,0.08)]'
          }`}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-[10px] bg-[#c2f2f2] text-[#356267] flex items-center justify-center flex-shrink-0">
              <UserCheck size={18} />
            </div>
            <h3 className="text-[15px] font-semibold text-[#10214b] flex items-center">
              Tous les employés
              {isVisitorMode && (
                <span className="ml-1.5 text-[10px] font-semibold bg-[rgba(213,80,83,0.08)] text-[#d55053] border border-[rgba(213,80,83,0.25)] px-2 py-0.5 rounded-full">
                  Démo
                </span>
              )}
            </h3>
          </div>

          {loading ? (
            <div className="text-center py-10 px-4 text-[rgba(53,98,103,0.45)]">
              <Loader2 size={24} className="animate-spin mx-auto mb-3 text-[#356267]" />
              <p>Chargement...</p>
            </div>
          ) : employesDisplay.length === 0 ? (
            <div className="text-center py-10 px-4 text-[rgba(53,98,103,0.45)]">
              <UserPlus size={36} className="mx-auto mb-2 text-[rgba(16,33,75,0.15)]" />
              <h4 className="mt-2 mb-1 text-[15px] font-semibold text-[#10214b]">Aucun employé</h4>
              <p className="text-[13px] mb-4">
                {isVisitorMode ? 'Créez un compte pour gérer vos employés' : 'Invitez votre premier employé pour commencer'}
              </p>
              {isVisitorMode && (
                <button
                  onClick={() => ouvrirActionBloquee('subscribe')}
                  className="bg-[#d55053] min-h-[44px] rounded-[10px] px-5 text-white font-semibold text-[13px] inline-flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                >
                  <Crown size={16} /> Créer un compte
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col">
              {employesDisplay.map((emp) => {
                const initEmp = `${(emp.prenom || '')[0] || '?'}${(emp.nom || '')[0] || ''}`.toUpperCase();
                const isPending = !emp.is_active;
                return (
                  <div
                    key={emp.id}
                    className={`flex items-center gap-3 py-3.5 border-b border-[#f8fafc] last:border-b-0 flex-wrap sm:flex-nowrap ${
                      isPending ? 'opacity-65' : ''
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-[10px] flex items-center justify-center font-semibold flex-shrink-0 overflow-hidden text-[15px] ${
                        isPending ? 'bg-[#f8fafc] text-[rgba(53,98,103,0.45)]' : 'bg-[#c2f2f2] text-[#356267]'
                      }`}
                    >
                      {emp.photo_profil ? (
                        <img src={getPhotoUrl(emp.photo_profil)} alt="emp" className="w-full h-full object-cover" />
                      ) : isPending ? (
                        <Clock size={17} />
                      ) : (
                        <span>{initEmp}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-[#10214b] text-sm">
                        {emp.prenom && emp.nom ? `${emp.prenom} ${emp.nom}` : 'En attente'}
                      </div>
                      <div className="text-xs text-[rgba(53,98,103,0.75)] mt-0.5 flex items-center gap-1.5 overflow-hidden text-ellipsis whitespace-nowrap">
                        <Mail size={13} className="flex-shrink-0" />
                        {emp.email || emp.invitation_email || 'Invitation en attente'}
                      </div>
                    </div>
                    <div
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 whitespace-nowrap flex-shrink-0 ml-[52px] sm:ml-0 ${
                        emp.is_active ? 'bg-[#e9f8e7] text-[#459071]' : 'bg-[#fef3c7] text-[#b45309]'
                      }`}
                    >
                      {emp.is_active ? <CheckCircle2 size={13} /> : <Clock size={13} />}
                      {emp.is_active ? 'Actif' : 'Attente'}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {isVisitorMode && employesDisplay.length > 0 && (
            <div className="mt-4 px-4 py-3 text-center bg-[rgba(213,80,83,0.08)] border border-[rgba(213,80,83,0.25)] rounded-[10px] text-xs text-[#d55053] font-medium">
              Données de démonstration — Créez un compte pour gérer vos vrais employés
            </div>
          )}
        </div>

        {/* Info Card */}
        <div
          className={`rounded-xl px-4 py-3.5 flex items-center gap-2.5 text-xs border ${
            isVisitorMode
              ? 'bg-[rgba(213,80,83,0.08)] text-[#d55053] border-[rgba(213,80,83,0.25)]'
              : 'bg-[#c2f2f2] text-[#356267] border-[rgba(53,98,103,0.2)]'
          }`}
        >
          <Info size={16} className="flex-shrink-0" />
          <span>
            {isVisitorMode
              ? 'Données de démonstration — les employés affichés sont fictifs'
              : 'Les transactions des employés sont visibles dans votre tableau de bord'}
          </span>
        </div>
      </div>
    </div>
  );
}