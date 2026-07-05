import React, { useEffect, useState, useRef } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ActionBlockedModal from '../components/ActionBlockedModal';
import {
  Tag,
  Building2,
  User,
  Plus,
  X,
  Check,
  Trash2,
  Lock,
  Star,
  PlusCircle,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
  UtensilsCrossed,
  MoreHorizontal,
  GraduationCap,
  Briefcase,
  Home,
  Gamepad2,
  Wallet,
  HeartPulse,
  Car,
  Plane,
  ShoppingBasket,
  CircleDollarSign,
  Coffee,
  ShoppingBag,
  Dumbbell,
  Laptop,
  Users,
  AlertTriangle,
  Info,
} from 'lucide-react';

const IconCategory = () => <Tag size={18} strokeWidth={2} />;
const IconBuilding = () => <Building2 size={18} strokeWidth={2} />;
const IconUser = () => <User size={18} strokeWidth={2} />;
const IconPlus = () => <Plus size={14} strokeWidth={2} />;
const IconClose = () => <X size={14} strokeWidth={2} />;
const IconCheck = () => <Check size={14} strokeWidth={2} />;
const IconTrash = () => <Trash2 size={14} strokeWidth={2} />;
const IconLock = () => <Lock size={40} strokeWidth={2} />;
const IconStar = () => <Star size={10} strokeWidth={2} />;
const IconPlusCircle = () => <PlusCircle size={18} strokeWidth={2} />;
const IconChevronDown = () => <ChevronDown size={12} strokeWidth={2} />;
const IconTrendingUp = () => <TrendingUp size={8} strokeWidth={2} />;
const IconTrendingDown = () => <TrendingDown size={8} strokeWidth={2} />;
const IconTransfer = () => <ArrowLeftRight size={8} strokeWidth={2} />;

const IconAlimentation = () => <UtensilsCrossed size={16} strokeWidth={2} />;
const IconAutres = () => <MoreHorizontal size={16} strokeWidth={2} />;
const IconEducation = () => <GraduationCap size={16} strokeWidth={2} />;
const IconFreelance = () => <Briefcase size={16} strokeWidth={2} />;
const IconLogement = () => <Home size={16} strokeWidth={2} />;
const IconLoisirs = () => <Gamepad2 size={16} strokeWidth={2} />;
const IconSalaire = () => <Wallet size={16} strokeWidth={2} />;
const IconSante = () => <HeartPulse size={16} strokeWidth={2} />;
const IconTransport = () => <Car size={16} strokeWidth={2} />;
const IconVoyage = () => <Plane size={16} strokeWidth={2} />;

const getSystemIcon = (nom) => {
  const icons = {
    'Alimentation': IconAlimentation,
    'Autres': IconAutres,
    'Éducation': IconEducation,
    'Freelance': IconFreelance,
    'Logement': IconLogement,
    'Loisirs': IconLoisirs,
    'Salaire': IconSalaire,
    'Santé': IconSante,
    'Transport': IconTransport,
    'Voyage': IconVoyage,
  };
  return icons[nom] || IconCategory;
};

const IconDefault = () => <Tag size={20} strokeWidth={2} />;
const IconCourses = () => <ShoppingBasket size={20} strokeWidth={2} />;
const IconMoney = () => <CircleDollarSign size={20} strokeWidth={2} />;
const IconHouse = () => <Home size={20} strokeWidth={2} />;
const IconHealth = () => <HeartPulse size={20} strokeWidth={2} />;
const IconCar = () => <Car size={20} strokeWidth={2} />;
const IconCoffee = () => <Coffee size={20} strokeWidth={2} />;
const IconWork = () => <Briefcase size={20} strokeWidth={2} />;
const IconStudy = () => <GraduationCap size={20} strokeWidth={2} />;
const IconEntertainment = () => <Gamepad2 size={20} strokeWidth={2} />;
const IconTravel = () => <Plane size={20} strokeWidth={2} />;
const IconShopping = () => <ShoppingBag size={20} strokeWidth={2} />;
const IconSport = () => <Dumbbell size={20} strokeWidth={2} />;
const IconTech = () => <Laptop size={20} strokeWidth={2} />;
const IconFamily = () => <Users size={20} strokeWidth={2} />;

const ICONES_LIST = [
  { value: 'default', label: 'Défaut', icon: IconDefault },
  { value: 'courses', label: 'Courses', icon: IconCourses },
  { value: 'money', label: 'Argent', icon: IconMoney },
  { value: 'house', label: 'Maison', icon: IconHouse },
  { value: 'health', label: 'Santé', icon: IconHealth },
  { value: 'car', label: 'Voiture', icon: IconCar },
  { value: 'coffee', label: 'Café', icon: IconCoffee },
  { value: 'work', label: 'Travail', icon: IconWork },
  { value: 'study', label: 'Éducation', icon: IconStudy },
  { value: 'entertainment', label: 'Loisirs', icon: IconEntertainment },
  { value: 'travel', label: 'Voyage', icon: IconTravel },
  { value: 'shopping', label: 'Shopping', icon: IconShopping },
  { value: 'sport', label: 'Sport', icon: IconSport },
  { value: 'tech', label: 'Technologie', icon: IconTech },
  { value: 'family', label: 'Famille', icon: IconFamily },
];

const COULEURS_LIST = [
  { value: '#3b82f6', name: 'Bleu' },
  { value: '#8b5cf6', name: 'Violet' },
  { value: '#ec4899', name: 'Rose' },
  { value: '#ef4444', name: 'Rouge' },
  { value: '#f97316', name: 'Orange' },
  { value: '#f59e0b', name: 'Ambre' },
  { value: '#10b981', name: 'Vert' },
  { value: '#06b6d4', name: 'Cyan' },
  { value: '#6366f1', name: 'Indigo' },
  { value: '#64748b', name: 'Gris' },
  { value: '#1e293b', name: 'Ardoise' },
  { value: '#14b8a6', name: 'Teal' },
  { value: '#84cc16', name: 'Lime' },
  { value: '#f472b6', name: 'Rose clair' },
  { value: '#818cf8', name: 'Indigo clair' },
  { value: '#34d399', name: 'Vert clair' },
  { value: '#fbbf24', name: 'Jaune' },
  { value: '#fb923c', name: 'Orange clair' },
];

const Icon = ({ name, size = 18, color = 'currentColor', isSystem = false, categoryName = '' }) => {
  let IconComponent;

  if (isSystem && categoryName) {
    IconComponent = getSystemIcon(categoryName);
  } else {
    const found = ICONES_LIST.find(i => i.value === name);
    IconComponent = found ? found.icon : IconDefault;
  }

  return (
    <div style={{ width: size, height: size, color: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <IconComponent />
    </div>
  );
};

function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirmer', cancelText = 'Annuler' }) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[99999] bg-[#10214b]/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl px-6 py-7 max-w-[400px] w-full shadow-[0_20px_60px_rgba(16,33,75,0.15)] text-center animate-[fadeIn_0.3s_ease]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-12 rounded-full bg-[rgba(213,80,83,0.08)] flex items-center justify-center mx-auto mb-3">
          <i className="bx bx-trash text-2xl text-[#d55053]" />
        </div>
        <h3 className="m-0 mb-2 text-lg font-bold text-[#10214b]">
          {title}
        </h3>
        <p className="m-0 mb-5 text-sm text-[#356267]/75 leading-relaxed">
          {message}
        </p>
        <div className="flex gap-2.5">
          <button
            onClick={onClose}
            className="flex-1 min-h-[44px] rounded-xl border border-[#10214b]/10 bg-[#f8fafc] text-[#356267]/75 text-[13px] font-semibold cursor-pointer transition-colors hover:bg-[#eef2f2]"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="flex-[2] min-h-[44px] rounded-xl border-none bg-[#d55053] text-white text-[13px] font-bold cursor-pointer transition-all shadow-[0_4px_12px_rgba(213,80,83,0.3)] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(213,80,83,0.4)]"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

function ToastMessage({ notification, onClose }) {
  if (!notification) return null;

  const { type, message } = notification;
  const isSuccess = type === 'success';
  const isError = type === 'error';

  const iconWrapClasses = isSuccess
    ? 'bg-[#356267]/10 text-[#356267]'
    : isError
    ? 'bg-[rgba(213,80,83,0.1)] text-[#d55053]'
    : 'bg-[#c98a1f]/10 text-[#c98a1f]';

  const borderClasses = isSuccess
    ? 'border-[#356267]/15'
    : isError
    ? 'border-[#d55053]/20'
    : 'border-[#c98a1f]/20';

  return (
    <div className="fixed top-3 sm:top-5 right-3 left-3 sm:left-auto sm:right-5 z-[100000] sm:max-w-[380px] animate-[fadeIn_0.25s_ease]">
      <div className={`flex items-start gap-3 px-4 py-3.5 rounded-2xl shadow-[0_10px_30px_rgba(16,33,75,0.18)] border bg-white ${borderClasses}`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${iconWrapClasses}`}>
          {isSuccess ? (
            <Check size={16} strokeWidth={2.5} />
          ) : isError ? (
            <AlertTriangle size={16} strokeWidth={2} />
          ) : (
            <Info size={16} strokeWidth={2} />
          )}
        </div>
        <p className="flex-1 text-[13px] font-medium text-[#10214b] leading-relaxed m-0 pt-0.5">
          {message}
        </p>
        <button
          onClick={onClose}
          className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[#356267]/40 hover:text-[#356267] hover:bg-[#356267]/5 transition-colors"
          aria-label="Fermer"
        >
          <X size={14} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}

// ============================================
// COMPOSANT PRINCIPAL
// ============================================
export default function Categories() {
  const { abonnement, estEnEssai, estExpire, isVisitor, exitVisitorMode } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ nom: '', icone: 'default', couleur: '#3b82f6', type: 'les_deux' });
  const [activeTab, setActiveTab] = useState('system');
  const [isMobile, setIsMobile] = useState(false);

  const [actionBlockedModal, setActionBlockedModal] = useState({ isOpen: false, message: null });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, categoryId: null, categoryName: '' });

  const [notification, setNotification] = useState(null); 
  const notifTimeoutRef = useRef(null);

  const [showIconDropdown, setShowIconDropdown] = useState(false);
  const [showColorDropdown, setShowColorDropdown] = useState(false);
  const iconDropdownRef = useRef(null);
  const colorDropdownRef = useRef(null);

  const isVisitorMode = isVisitor;

  const afficherMessage = (type, message, duree = 3500) => {
    if (notifTimeoutRef.current) {
      clearTimeout(notifTimeoutRef.current);
    }
    setNotification({ type, message });
    notifTimeoutRef.current = setTimeout(() => {
      setNotification(null);
    }, duree);
  };

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    chargerCategories();

    const handleClickOutside = (event) => {
      if (iconDropdownRef.current && !iconDropdownRef.current.contains(event.target)) {
        setShowIconDropdown(false);
      }
      if (colorDropdownRef.current && !colorDropdownRef.current.contains(event.target)) {
        setShowColorDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('resize', checkMobile);
      document.removeEventListener('mousedown', handleClickOutside);
      if (notifTimeoutRef.current) clearTimeout(notifTimeoutRef.current);
    };
  }, []);

  const enEssaiActif = estEnEssai();
  const expireActif = estExpire();
  const peutCreer = !isVisitorMode && !enEssaiActif && !expireActif && abonnement?.est_actif;

  const nbMax = abonnement?.nb_categories_autorisees ?? 200;
  const mesCats = categories.filter(c => c.utilisateur !== null);
  const sysCats = categories.filter(c => c.utilisateur === null);
  const limitAtteinte = nbMax !== -1 && mesCats.length >= nbMax;

  const chargerCategories = async () => {
    setLoading(true);
    try {
      const res = await api.get('/transactions/categories/');
      setCategories(res.data.results || res.data);
    } catch (err) {
      console.error('Erreur chargement:', err);
      afficherMessage('error', 'Erreur lors du chargement des catégories.');
    } finally {
      setLoading(false);
    }
  };

  const ouvrirActionBloquee = () => {
    setActionBlockedModal({
      isOpen: true,
      message: {
        title: ' Créez un compte',
        message: 'Pour créer ou modifier des catégories, créez un compte en 30 secondes.',
        action: 'Créer un compte',
        actionType: 'signup'
      }
    });
  };

  const getTypeLabel = (type) => {
    if (type === 'entree') return 'Entrée';
    if (type === 'sortie') return 'Sortie';
    return 'Les deux';
  };

  const getTypeBadgeClasses = (type) => {
    if (type === 'entree') return 'bg-[#e9f8e7] text-[#2a4f53]';
    if (type === 'sortie') return 'bg-[rgba(213,80,83,0.1)] text-[#d55053]';
    return 'bg-[#c2f2f2]/50 text-[#2a4f53]';
  };

  const getTypeIconComponent = (type) => {
    if (type === 'entree') return IconTrendingUp;
    if (type === 'sortie') return IconTrendingDown;
    return IconTransfer;
  };

  const ouvrirConfirmSuppression = (id, nom) => {
    setConfirmModal({
      isOpen: true,
      categoryId: id,
      categoryName: nom
    });
  };

  const confirmerSuppression = async () => {
    const { categoryId } = confirmModal;
    setConfirmModal({ isOpen: false, categoryId: null, categoryName: '' });

    if (isVisitorMode) {
      ouvrirActionBloquee();
      return;
    }

    try {
      await api.delete(`/transactions/categories/${categoryId}/`);
      afficherMessage('success', ' Catégorie supprimée avec succès !');
      chargerCategories();
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.visitor_mode) {
        ouvrirActionBloquee();
        return;
      }
      afficherMessage('error', ' Impossible de supprimer la catégorie.');
    }
  };

  const creerCategorie = async (e) => {
    e.preventDefault();
    if (isVisitorMode) {
      ouvrirActionBloquee();
      return;
    }
    if (!peutCreer) {
      afficherMessage('error', ' Abonnez-vous pour créer des catégories.');
      return;
    }
    if (limitAtteinte) {
      afficherMessage('error', ` Limite de ${nbMax} catégories atteinte.`);
      return;
    }
    if (!form.nom.trim()) {
      afficherMessage('error', ' Veuillez entrer un nom pour la catégorie.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/transactions/categories/', {
        nom: form.nom,
        icone: form.icone,
        couleur: form.couleur,
        type: form.type,
      });
      afficherMessage('success', '🎉 Catégorie créée avec succès !');
      setForm({ nom: '', icone: 'default', couleur: '#3b82f6', type: 'les_deux' });
      setShowForm(false);
      chargerCategories();
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.visitor_mode) {
        ouvrirActionBloquee();
        return;
      }
      afficherMessage('error', err.response?.data?.detail || ' Erreur lors de la création');
    } finally {
      setSubmitting(false);
    }
  };

  const supprimerCategorie = async (id) => {
    if (isVisitorMode) {
      ouvrirActionBloquee();
      return;
    }
    // ✅ Confirmation via modal personnalisé (pas de window.confirm)
    ouvrirConfirmSuppression(id, categories.find(c => c.id === id)?.nom || '');
  };

  const TypeIconRenderer = ({ type }) => {
    const IconComp = getTypeIconComponent(type);
    return <IconComp />;
  };

  const SelectedIcon = ICONES_LIST.find(i => i.value === form.icone)?.icon || IconDefault;
  const SelectedColor = COULEURS_LIST.find(c => c.value === form.couleur) || COULEURS_LIST[0];

  return (
    <div className="max-w-[1000px] mx-auto p-3 sm:p-5 font-sans bg-[#f8fafc] min-h-screen">
      {/*  Notification personnalisée remplaçant react-hot-toast */}
      <ToastMessage notification={notification} onClose={() => setNotification(null)} />

      <ActionBlockedModal
        isOpen={actionBlockedModal.isOpen}
        onClose={() => setActionBlockedModal({ isOpen: false, message: null })}
        message={actionBlockedModal.message}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, categoryId: null, categoryName: '' })}
        onConfirm={confirmerSuppression}
        title="Supprimer cette catégorie ?"
        message={`Êtes-vous sûr de vouloir supprimer la catégorie "${confirmModal.categoryName}" ? Cette action est irréversible.`}
        confirmText="Oui, supprimer"
        cancelText="Annuler"
      />

      {/* HEADER */}
      <div className="mb-4 sm:mb-6">
        <div className="flex items-center gap-2.5 sm:gap-3.5 mb-1">
          <div
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: isVisitorMode ? '#c98a1f' : '#356267' }}
          >
            <Icon name="default" size={isMobile ? 18 : 22} color="white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#10214b] flex items-center">
              Catégories
              {isVisitorMode && (
                <span className="text-xs sm:text-sm bg-[#fdf6e8] text-[#7a5410] px-2.5 py-0.5 rounded-full font-semibold ml-2"> Démo</span>
              )}
            </h1>
          </div>
        </div>
        <p className="text-[#356267]/60 text-[11px] sm:text-[13px] ml-[50px] sm:ml-[62px]">
          {isVisitorMode ? 'Visualisation des catégories de démonstration' : 'Organisez vos transactions'}
        </p>
      </div>

      {/* STATS */}
      <div className="flex gap-2 sm:gap-3 mb-4 sm:mb-5 flex-wrap">
        <div className={`bg-white rounded-2xl sm:rounded-[16px] px-3 py-2 sm:px-4 sm:py-3 flex items-center gap-2 sm:gap-2.5 flex-1 min-w-[100px] sm:min-w-[120px] border border-[#10214b]/8 ${isVisitorMode ? 'opacity-85' : ''}`}>
          <div className="w-8 h-8 sm:w-9 sm:h-9 bg-[#356267]/10 rounded-[10px] sm:rounded-xl flex items-center justify-center shrink-0 text-[#356267]">
            <Icon name="default" size={isMobile ? 14 : 16} />
          </div>
          <div className="min-w-0">
            <h4 className="text-[9px] sm:text-[10px] font-semibold text-[#356267]/60 uppercase mb-0.5 tracking-wide">Total</h4>
            <div className="text-lg sm:text-[22px] font-extrabold text-[#10214b]">{sysCats.length + mesCats.length}</div>
          </div>
        </div>
        <div className={`bg-white rounded-2xl sm:rounded-[16px] px-3 py-2 sm:px-4 sm:py-3 flex items-center gap-2 sm:gap-2.5 flex-1 min-w-[100px] sm:min-w-[120px] border border-[#10214b]/8 ${isVisitorMode ? 'opacity-85' : ''}`}>
          <div className="w-8 h-8 sm:w-9 sm:h-9 bg-[#356267]/10 rounded-[10px] sm:rounded-xl flex items-center justify-center shrink-0 text-[#356267]">
            <IconBuilding />
          </div>
          <div className="min-w-0">
            <h4 className="text-[9px] sm:text-[10px] font-semibold text-[#356267]/60 uppercase mb-0.5 tracking-wide">Système</h4>
            <div className="text-lg sm:text-[22px] font-extrabold text-[#10214b]">{sysCats.length}</div>
          </div>
        </div>
        <div className={`bg-white rounded-2xl sm:rounded-[16px] px-3 py-2 sm:px-4 sm:py-3 flex items-center gap-2 sm:gap-2.5 flex-1 min-w-[100px] sm:min-w-[120px] border border-[#10214b]/8 ${isVisitorMode ? 'opacity-85' : ''}`}>
          <div className="w-8 h-8 sm:w-9 sm:h-9 bg-[#356267]/10 rounded-[10px] sm:rounded-xl flex items-center justify-center shrink-0 text-[#356267]">
            <IconUser />
          </div>
          <div className="min-w-0">
            <h4 className="text-[9px] sm:text-[10px] font-semibold text-[#356267]/60 uppercase mb-0.5 tracking-wide">Personnelles</h4>
            <div className="text-lg sm:text-[22px] font-extrabold text-[#10214b]">
              {mesCats.length}
              {nbMax !== -1 && <span className="text-[9px] sm:text-[10px] font-normal text-[#356267]/45">/{nbMax}</span>}
            </div>
            {isVisitorMode && (
              <div className="text-[8px] text-[#c98a1f] font-semibold mt-px">
                 Démo
              </div>
            )}
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-1 sm:gap-2 mb-4 sm:mb-5 border-b-2 border-[#10214b]/8">
        <button
          className={`min-h-[44px] px-4 sm:px-5 bg-transparent border-none text-xs sm:text-[13px] font-semibold cursor-pointer flex items-center gap-1.5 rounded-t-xl relative ${activeTab === 'system' ? 'text-[#356267] bg-[#356267]/10 after:content-[""] after:absolute after:-bottom-[2px] after:left-0 after:right-0 after:h-[2px] after:bg-[#356267]' : 'text-[#356267]/60'}`}
          onClick={() => setActiveTab('system')}
        >
          <IconBuilding />
          <span>Système</span>
        </button>
        <button
          className={`min-h-[44px] px-4 sm:px-5 bg-transparent border-none text-xs sm:text-[13px] font-semibold cursor-pointer flex items-center gap-1.5 rounded-t-xl relative ${activeTab === 'personal' ? 'text-[#356267] bg-[#356267]/10 after:content-[""] after:absolute after:-bottom-[2px] after:left-0 after:right-0 after:h-[2px] after:bg-[#356267]' : 'text-[#356267]/60'}`}
          onClick={() => setActiveTab('personal')}
        >
          <IconUser />
          <span>Personnelles</span>
        </button>
      </div>

      {activeTab === 'personal' && peutCreer && !limitAtteinte && !isVisitorMode && (
        <div className="mb-3 sm:mb-4 flex justify-end">
          <button
            className={`min-h-[44px] rounded-full px-4 sm:px-5 font-semibold text-xs sm:text-[13px] cursor-pointer flex items-center gap-1.5 transition-colors ${showForm ? 'bg-[#f1f5f9] text-[#356267]/70' : 'bg-[#356267] text-white shadow-[0_2px_8px_rgba(53,98,103,0.3)] hover:bg-[#2a4f53]'}`}
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? <IconClose /> : <IconPlus />}
            {showForm ? 'Annuler' : 'Créer'}
          </button>
        </div>
      )}

      {activeTab === 'personal' && isVisitorMode && (
        <div className="mb-3 sm:mb-4 flex justify-end">
          <button
            className="min-h-[44px] rounded-full px-4 sm:px-5 font-semibold text-xs sm:text-[13px] cursor-pointer flex items-center gap-1.5 bg-[#fdf6e8] text-[#7a5410] shadow-none"
            onClick={ouvrirActionBloquee}
          >
            <IconLock />
            Créer une catégorie
          </button>
        </div>
      )}

      {showForm && activeTab === 'personal' && !isVisitorMode && (
        <div className="bg-white rounded-2xl p-3.5 sm:p-[18px] mb-3.5 sm:mb-[18px] border border-[#10214b]/8">
          <div className="flex items-center gap-2 mb-3.5">
            <span className="text-[#356267]"><IconPlusCircle /></span>
            <span className="text-sm sm:text-[15px] font-bold text-[#10214b]">Nouvelle catégorie</span>
          </div>
          <form onSubmit={creerCategorie}>
            <div className="mb-3">
              <label className="block text-[10px] font-semibold text-[#356267]/60 mb-1 uppercase tracking-wide">Nom</label>
              <input
                type="text"
                value={form.nom}
                onChange={e => setForm({ ...form, nom: e.target.value })}
                placeholder="Ex: Restaurant, Voyage..."
                required
                className="w-full min-h-[44px] px-3 border border-[#10214b]/10 rounded-xl text-[13px] outline-none bg-white focus:border-[#356267]"
              />
            </div>

            <div className="flex gap-3 flex-wrap">
              <div className="flex-1 relative min-w-[140px]" ref={iconDropdownRef}>
                <label className="block text-[10px] font-semibold text-[#356267]/60 mb-1 uppercase tracking-wide">Icône</label>
                <button
                  type="button"
                  className="w-full min-h-[44px] flex items-center justify-between gap-2.5 px-3 bg-white border border-[#10214b]/10 rounded-xl cursor-pointer text-[13px] transition-colors hover:border-[#356267]"
                  onClick={() => setShowIconDropdown(!showIconDropdown)}
                >
                  <div className="flex items-center gap-2 text-[#10214b]">
                    <span className="text-[#356267]"><SelectedIcon /></span>
                    <span>{ICONES_LIST.find(i => i.value === form.icone)?.label || 'Défaut'}</span>
                  </div>
                  <span className="text-[#356267]/50"><IconChevronDown /></span>
                </button>
                {showIconDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#10214b]/10 rounded-xl shadow-[0_4px_12px_rgba(16,33,75,0.1)] z-[100] max-h-[200px] overflow-y-auto">
                    <div className="grid grid-cols-3 gap-1.5 p-2.5">
                      {ICONES_LIST.map(icon => {
                        const IconComp = icon.icon;
                        const isSelected = form.icone === icon.value;
                        return (
                          <div
                            key={icon.value}
                            className={`flex flex-col items-center gap-1 py-2 px-1 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-[#356267]/10 border border-[#356267]' : 'hover:bg-[#356267]/5'}`}
                            onClick={() => {
                              setForm({ ...form, icone: icon.value });
                              setShowIconDropdown(false);
                            }}
                          >
                            <span className="text-[#10214b]"><IconComp /></span>
                            <span className="text-[9px] text-[#356267]/70">{icon.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex-1 relative min-w-[140px]" ref={colorDropdownRef}>
                <label className="block text-[10px] font-semibold text-[#356267]/60 mb-1 uppercase tracking-wide">Couleur</label>
                <button
                  type="button"
                  className="w-full min-h-[44px] flex items-center justify-between gap-2.5 px-3 bg-white border border-[#10214b]/10 rounded-xl cursor-pointer text-[13px] transition-colors hover:border-[#356267]"
                  onClick={() => setShowColorDropdown(!showColorDropdown)}
                >
                  <div className="flex items-center gap-2 text-[#10214b]">
                    <div className="w-5 h-5 rounded-md border border-[#10214b]/10" style={{ background: form.couleur }}></div>
                    <span>{SelectedColor.name}</span>
                  </div>
                  <span className="text-[#356267]/50"><IconChevronDown /></span>
                </button>
                {showColorDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#10214b]/10 rounded-xl shadow-[0_4px_12px_rgba(16,33,75,0.1)] z-[100] max-h-[200px] overflow-y-auto">
                    <div className="grid grid-cols-4 gap-2 p-2.5">
                      {COULEURS_LIST.map(color => (
                        <div
                          key={color.value}
                          className={`w-full aspect-square rounded-[10px] cursor-pointer transition-transform border-2 hover:scale-105 ${form.couleur === color.value ? 'border-[#10214b] scale-105' : 'border-transparent'}`}
                          style={{ background: color.value }}
                          onClick={() => {
                            setForm({ ...form, couleur: color.value });
                            setShowColorDropdown(false);
                          }}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mb-3 mt-3">
              <label className="block text-[10px] font-semibold text-[#356267]/60 mb-1 uppercase tracking-wide">Type</label>
              <div className="flex gap-2">
                {[
                  { value: 'entree', label: 'Entrée', icon: IconTrendingUp, color: '#4ea674' },
                  { value: 'sortie', label: 'Sortie', icon: IconTrendingDown, color: '#d55053' },
                  { value: 'les_deux', label: 'Les deux', icon: IconTransfer, color: '#356267' },
                ].map(type => (
                  <div
                    key={type.value}
                    className="flex-1 min-h-[44px] border border-[#10214b]/10 rounded-xl bg-[#f8fafc] cursor-pointer flex items-center justify-center gap-1.5 font-semibold text-[11px] sm:text-xs"
                    style={form.type === type.value ? { borderColor: type.color, background: `${type.color}10`, color: type.color } : { color: '#356267' }}
                    onClick={() => setForm({ ...form, type: type.value })}
                  >
                    <type.icon />
                    <span>{type.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2.5 mt-3.5">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 min-h-[44px] rounded-xl font-semibold text-[11px] sm:text-xs cursor-pointer flex items-center justify-center gap-1.5 bg-[#356267] text-white hover:bg-[#2a4f53] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {submitting ? <span className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin"></span> : <IconCheck />}
                {submitting ? 'Création...' : 'Créer'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 min-h-[44px] rounded-xl font-semibold text-[11px] sm:text-xs bg-[#f1f5f9] border border-[#10214b]/10 text-[#356267]/70 hover:bg-[#e2e8f0] transition-colors"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-10 bg-white rounded-2xl">
          <div className="w-[30px] h-[30px] border-[3px] border-[#e2e8f0] border-t-[#356267] rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-[#356267]/60 text-sm">Chargement...</p>
        </div>
      ) : activeTab === 'system' ? (
        sysCats.length === 0 ? (
          <div className="text-center py-8 sm:py-10 px-4 sm:px-5 bg-white rounded-2xl">
            <span className="text-[#cbd5e1] inline-block mb-2.5"><IconDefault /></span>
            <h3 className="text-sm sm:text-[15px] font-bold text-[#10214b] mb-1.5">Aucune catégorie</h3>
            <p className="text-[11px] sm:text-xs text-[#356267]/60 mb-3.5">Catégories système disponibles</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-2 sm:gap-2.5">
            {sysCats.map(cat => {
              const TypeIcon = getTypeIconComponent(cat.type);
              return (
                <div key={cat.id} className="bg-white rounded-xl sm:rounded-[14px] px-3 py-2.5 sm:px-4 sm:py-3 flex items-center gap-2.5 sm:gap-3 border border-[#10214b]/8 transition-transform active:scale-[0.98]">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-[10px] sm:rounded-xl flex items-center justify-center shrink-0" style={{ background: cat.couleur || '#356267' }}>
                    <Icon isSystem={true} categoryName={cat.nom} size={isMobile ? 16 : 18} color="white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] sm:text-sm font-bold text-[#10214b] mb-1 truncate">{cat.nom}</div>
                    <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-semibold ${getTypeBadgeClasses(cat.type)}`}>
                      <TypeIcon />
                      <span>{getTypeLabel(cat.type)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : !peutCreer && !isVisitorMode ? (
        <div className="text-center py-8 sm:py-10 px-4 sm:px-5 bg-white rounded-2xl">
          <span className="text-[#cbd5e1] inline-block mb-2.5"><IconLock /></span>
          <h3 className="text-sm sm:text-[15px] font-bold text-[#10214b] mb-1.5">Abonnement requis</h3>
          <p className="text-[11px] sm:text-xs text-[#356267]/60 mb-3.5">Abonnez-vous pour créer des catégories</p>
          <button
            className="min-h-[44px] rounded-full px-4 sm:px-5 font-semibold text-xs sm:text-[13px] cursor-pointer inline-flex items-center gap-1.5 bg-[#356267] text-white shadow-[0_2px_8px_rgba(53,98,103,0.3)] hover:bg-[#2a4f53] transition-colors"
            onClick={() => navigate('/profil')}
          >
            <IconStar /> Voir les offres
          </button>
        </div>
      ) : mesCats.length === 0 ? (
        <div className="text-center py-8 sm:py-10 px-4 sm:px-5 bg-white rounded-2xl">
          <span className="text-[#cbd5e1] inline-block mb-2.5"><IconDefault /></span>
          <h3 className="text-sm sm:text-[15px] font-bold text-[#10214b] mb-1.5">{isVisitorMode ? '🔍 Données de démonstration' : 'Aucune catégorie'}</h3>
          <p className="text-[11px] sm:text-xs text-[#356267]/60 mb-3.5">{isVisitorMode ? 'Créez un compte pour gérer vos catégories' : 'Créez votre première catégorie'}</p>
          {isVisitorMode ? (
            <button
              className="min-h-[44px] rounded-full px-4 sm:px-5 font-semibold text-xs sm:text-[13px] cursor-pointer inline-flex items-center gap-1.5 bg-[#c98a1f] text-white hover:bg-[#b47a1a] transition-colors"
              onClick={() => navigate('/inscription')}
            >
              <IconPlus /> Créer un compte
            </button>
          ) : (
            <button
              className="min-h-[44px] rounded-full px-4 sm:px-5 font-semibold text-xs sm:text-[13px] cursor-pointer inline-flex items-center gap-1.5 bg-[#356267] text-white shadow-[0_2px_8px_rgba(53,98,103,0.3)] hover:bg-[#2a4f53] transition-colors"
              onClick={() => setShowForm(true)}
            >
              <IconPlus /> Créer
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-2 sm:gap-2.5">
          {mesCats.map(cat => {
            const TypeIcon = getTypeIconComponent(cat.type);
            const foundIcon = ICONES_LIST.find(i => i.value === cat.icone);
            const IconComp = foundIcon ? foundIcon.icon : IconDefault;
            return (
              <div key={cat.id} className={`bg-white rounded-xl sm:rounded-[14px] px-3 py-2.5 sm:px-4 sm:py-3 flex items-center gap-2.5 sm:gap-3 border border-[#10214b]/8 transition-transform active:scale-[0.98] ${isVisitorMode ? 'opacity-85' : ''}`}>
                <div
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-[10px] sm:rounded-xl flex items-center justify-center shrink-0 text-white"
                  style={{ background: `linear-gradient(135deg, ${cat.couleur || '#356267'}, ${cat.couleur || '#356267'}cc)` }}
                >
                  <IconComp />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] sm:text-sm font-bold text-[#10214b] mb-1 truncate">{cat.nom}</div>
                  <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-semibold ${getTypeBadgeClasses(cat.type)}`}>
                    <TypeIcon />
                    <span>{getTypeLabel(cat.type)}</span>
                  </div>
                </div>
                <button
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg border-none flex items-center justify-center shrink-0 transition-opacity"
                  style={{
                    background: isVisitorMode ? '#fdf6e8' : 'rgba(213,80,83,0.08)',
                    color: isVisitorMode ? '#c98a1f' : '#d55053',
                    cursor: isVisitorMode ? 'not-allowed' : 'pointer',
                    opacity: isVisitorMode ? 0.6 : 1,
                  }}
                  onClick={() => supprimerCategorie(cat.id)}
                  title={isVisitorMode ? 'Mode exploration - Créez un compte' : ''}
                >
                  <IconTrash />
                </button>
              </div>
            );
          })}
          {isVisitorMode && (
            <div className="px-4 py-3 text-center bg-[#fdf6e8] rounded-xl text-xs text-[#7a5410] font-medium border border-[#e8c27a] mt-2 col-span-full">
               Données de démonstration - Créez un compte pour gérer vos vraies catégories
            </div>
          )}
        </div>
      )}
    </div>
  );
}