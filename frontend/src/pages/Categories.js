import React, { useEffect, useState, useRef } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

// ============================================
// COMPOSANT ICÔNES SVG
// ============================================

// Icônes principales
const IconCategory = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
    <line x1="7" y1="7" x2="7.01" y2="7"/>
  </svg>
);

const IconBuilding = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="4" y="2" width="16" height="20" rx="2" ry="2"/>
    <line x1="9" y1="22" x2="9" y2="18"/>
    <line x1="15" y1="22" x2="15" y2="18"/>
  </svg>
);

const IconUser = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

// Icônes d'action
const IconPlus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const IconClose = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
  </svg>
);

const IconLock = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

const IconStar = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

const IconPlusCircle = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="16"/>
    <line x1="8" y1="12" x2="16" y2="12"/>
  </svg>
);

const IconChevronDown = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

// Icônes de type
const IconTrendingUp = () => (
  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
    <polyline points="17 6 23 6 23 12"/>
  </svg>
);

const IconTrendingDown = () => (
  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/>
    <polyline points="17 18 23 18 23 12"/>
  </svg>
);

const IconTransfer = () => (
  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

// ============================================
// ICÔNES SPÉCIFIQUES POUR CATÉGORIES SYSTÈME
// ============================================

const IconAlimentation = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
    <line x1="3" y1="6" x2="21" y2="6"/>
    <path d="M16 10a4 4 0 0 1-8 0"/>
  </svg>
);

const IconAutres = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <circle cx="12" cy="8" r="1"/>
    <circle cx="12" cy="12" r="1"/>
    <circle cx="12" cy="16" r="1"/>
  </svg>
);

const IconEducation = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
  </svg>
);

const IconFreelance = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
  </svg>
);

const IconLogement = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2h-5v-7H9v7H5a2 2 0 0 1-2-2z"/>
  </svg>
);

const IconLoisirs = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M6 11h4M8 9v4"/>
    <rect x="2" y="6" width="20" height="12" rx="2"/>
    <circle cx="17" cy="12" r="2"/>
    <circle cx="12" cy="12" r="2"/>
  </svg>
);

const IconSalaire = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <path d="M12 6v6l4 2"/>
  </svg>
);

const IconSante = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);

const IconTransport = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="4" y="4" width="16" height="16" rx="2"/>
    <circle cx="8" cy="18" r="2"/>
    <circle cx="16" cy="18" r="2"/>
    <line x1="8" y1="8" x2="16" y2="8"/>
    <line x1="8" y1="12" x2="16" y2="12"/>
  </svg>
);

const IconVoyage = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
    <line x1="8" y1="2" x2="8" y2="18"/>
    <line x1="16" y1="6" x2="16" y2="22"/>
  </svg>
);

// Mapping des icônes système par nom
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

// ============================================
// ICÔNES POUR LE SÉLECTEUR
// ============================================

const IconDefault = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
    <line x1="7" y1="7" x2="7.01" y2="7"/>
  </svg>
);

const IconCourses = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
    <line x1="3" y1="6" x2="21" y2="6"/>
    <path d="M16 10a4 4 0 0 1-8 0"/>
  </svg>
);

const IconMoney = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <path d="M12 6v6l4 2"/>
  </svg>
);

const IconHouse = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2h-5v-7H9v7H5a2 2 0 0 1-2-2z"/>
  </svg>
);

const IconHealth = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);

const IconCar = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M5 10l1-4h12l1 4"/>
    <rect x="3" y="10" width="18" height="8" rx="2"/>
    <circle cx="7" cy="16" r="2"/>
    <circle cx="17" cy="16" r="2"/>
  </svg>
);

const IconCoffee = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 8h1a4 4 0 0 1 0 8h-1"/>
    <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
    <line x1="6" y1="1" x2="6" y2="4"/>
    <line x1="10" y1="1" x2="10" y2="4"/>
    <line x1="14" y1="1" x2="14" y2="4"/>
  </svg>
);

const IconWork = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
  </svg>
);

const IconStudy = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
  </svg>
);

const IconEntertainment = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M6 11h4M8 9v4"/>
    <rect x="2" y="6" width="20" height="12" rx="2"/>
    <circle cx="17" cy="12" r="2"/>
    <circle cx="12" cy="12" r="2"/>
  </svg>
);

const IconTravel = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
    <line x1="8" y1="2" x2="8" y2="18"/>
    <line x1="16" y1="6" x2="16" y2="22"/>
  </svg>
);

const IconShopping = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
    <line x1="3" y1="6" x2="21" y2="6"/>
    <path d="M16 10a4 4 0 0 1-8 0"/>
  </svg>
);

const IconSport = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <path d="M12 8v4l3 3M12 2v2M12 20v2"/>
  </svg>
);

const IconTech = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="4" y="4" width="16" height="12" rx="2" ry="2"/>
    <line x1="8" y1="20" x2="16" y2="20"/>
    <line x1="12" y1="16" x2="12" y2="20"/>
  </svg>
);

const IconFamily = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
    <circle cx="20" cy="5" r="2"/>
    <circle cx="4" cy="5" r="2"/>
  </svg>
);

// Liste complète des icônes
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

// ============================================
// COULEURS
// ============================================
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

// Composant renderer d'icône
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

// ============================================
// COMPOSANT PRINCIPAL
// ============================================
export default function Categories() {
  const { abonnement, estEnEssai, estExpire } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ nom: '', icone: 'default', couleur: '#3b82f6', type: 'les_deux' });
  const [activeTab, setActiveTab] = useState('system');
  const [isMobile, setIsMobile] = useState(false);
  
  // États pour les dropdowns
  const [showIconDropdown, setShowIconDropdown] = useState(false);
  const [showColorDropdown, setShowColorDropdown] = useState(false);
  const iconDropdownRef = useRef(null);
  const colorDropdownRef = useRef(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    chargerCategories();
    
    // Fermer les dropdowns quand on clique en dehors
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
    };
  }, []);

  const enEssaiActif = estEnEssai();
  const expireActif = estExpire();
  const peutCreer = !enEssaiActif && !expireActif && abonnement?.est_actif;

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
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const getTypeLabel = (type) => {
    if (type === 'entree') return 'Entrée';
    if (type === 'sortie') return 'Sortie';
    return 'Les deux';
  };

  const getTypeBadgeClass = (type) => {
    if (type === 'entree') return 'badge-income';
    if (type === 'sortie') return 'badge-expense';
    return 'badge-both';
  };

  const getTypeIconComponent = (type) => {
    if (type === 'entree') return IconTrendingUp;
    if (type === 'sortie') return IconTrendingDown;
    return IconTransfer;
  };

  const creerCategorie = async (e) => {
    e.preventDefault();
    if (!peutCreer) {
      toast.error("Abonnez-vous pour créer des catégories.");
      return;
    }
    if (limitAtteinte) {
      toast.error(`Limite de ${nbMax} catégories atteinte.`);
      return;
    }
    if (!form.nom.trim()) {
      toast.error('Veuillez entrer un nom');
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
      toast.success('Catégorie créée !');
      setForm({ nom: '', icone: 'default', couleur: '#3b82f6', type: 'les_deux' });
      setShowForm(false);
      chargerCategories();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur lors de la création');
    } finally {
      setSubmitting(false);
    }
  };

  const supprimerCategorie = async (id) => {
    if (!window.confirm('Supprimer cette catégorie ?')) return;
    try {
      await api.delete(`/transactions/categories/${id}/`);
      toast.success('Catégorie supprimée');
      chargerCategories();
    } catch {
      toast.error('Impossible de supprimer');
    }
  };

  const TypeIconRenderer = ({ type }) => {
    const IconComp = getTypeIconComponent(type);
    return <IconComp />;
  };

  const SelectedIcon = ICONES_LIST.find(i => i.value === form.icone)?.icon || IconDefault;
  const SelectedColor = COULEURS_LIST.find(c => c.value === form.couleur) || COULEURS_LIST[0];

  return (
    <div className="categories-container">
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        .categories-container {
          max-width: 1000px;
          margin: 0 auto;
          padding: ${isMobile ? '12px' : '20px'};
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: #f8fafc;
          min-height: 100vh;
        }
        
        /* Header */
        .page-header {
          margin-bottom: ${isMobile ? '16px' : '24px'};
        }
        
        .header-title {
          display: flex;
          align-items: center;
          gap: ${isMobile ? '10px' : '14px'};
          margin-bottom: 4px;
        }
        
        .header-icon {
          width: ${isMobile ? '40px' : '48px'};
          height: ${isMobile ? '40px' : '48px'};
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          border-radius: ${isMobile ? '12px' : '16px'};
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .header-icon svg {
          stroke: white;
          width: ${isMobile ? '18px' : '22px'};
          height: ${isMobile ? '18px' : '22px'};
        }
        
        .header-title h1 {
          font-size: ${isMobile ? '20px' : '24px'};
          font-weight: 700;
          color: #0f172a;
        }
        
        .header-subtitle {
          color: #64748b;
          font-size: ${isMobile ? '11px' : '13px'};
          margin-left: ${isMobile ? '50px' : '62px'};
        }
        
        /* Stats Bar */
        .stats-bar {
          display: flex;
          gap: ${isMobile ? '8px' : '12px'};
          margin-bottom: ${isMobile ? '16px' : '20px'};
          flex-wrap: wrap;
        }
        
        .stat-card {
          background: white;
          border-radius: ${isMobile ? '14px' : '16px'};
          padding: ${isMobile ? '8px 12px' : '12px 16px'};
          display: flex;
          align-items: center;
          gap: ${isMobile ? '8px' : '10px'};
          flex: 1;
          min-width: ${isMobile ? '100px' : '120px'};
          border: 1px solid #e2e8f0;
        }
        
        .stat-icon {
          width: ${isMobile ? '32px' : '36px'};
          height: ${isMobile ? '32px' : '36px'};
          background: #eef2ff;
          border-radius: ${isMobile ? '10px' : '12px'};
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .stat-icon svg {
          stroke: #6366f1;
          width: ${isMobile ? '14px' : '16px'};
          height: ${isMobile ? '14px' : '16px'};
        }
        
        .stat-info h4 {
          font-size: ${isMobile ? '9px' : '10px'};
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          margin-bottom: 2px;
        }
        
        .stat-number {
          font-size: ${isMobile ? '18px' : '22px'};
          font-weight: 800;
          color: #0f172a;
        }
        
        .stat-limit {
          font-size: ${isMobile ? '9px' : '10px'};
          color: #94a3b8;
        }
        
        /* Tabs */
        .tabs-container {
          display: flex;
          gap: ${isMobile ? '4px' : '8px'};
          margin-bottom: ${isMobile ? '16px' : '20px'};
          border-bottom: 2px solid #e2e8f0;
        }
        
        .tab-btn {
          padding: ${isMobile ? '8px 16px' : '10px 20px'};
          background: transparent;
          border: none;
          font-size: ${isMobile ? '12px' : '13px'};
          font-weight: 600;
          color: #64748b;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          border-radius: 10px 10px 0 0;
        }
        
        .tab-btn svg {
          width: 14px;
          height: 14px;
        }
        
        .tab-btn.active {
          color: #6366f1;
          background: #eef2ff;
          position: relative;
        }
        
        .tab-btn.active::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          right: 0;
          height: 2px;
          background: #6366f1;
        }
        
        /* Categories Grid */
        .categories-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: ${isMobile ? '8px' : '10px'};
        }
        
        .category-item {
          background: white;
          border-radius: ${isMobile ? '12px' : '14px'};
          padding: ${isMobile ? '10px 12px' : '12px 16px'};
          display: flex;
          align-items: center;
          gap: ${isMobile ? '10px' : '12px'};
          border: 1px solid #e2e8f0;
          transition: all 0.2s;
        }
        
        .category-item:active {
          transform: scale(0.98);
        }
        
        .category-icon {
          width: ${isMobile ? '36px' : '40px'};
          height: ${isMobile ? '36px' : '40px'};
          border-radius: ${isMobile ? '10px' : '12px'};
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        
        .category-icon svg {
          width: ${isMobile ? '16px' : '18px'};
          height: ${isMobile ? '16px' : '18px'};
          stroke: white;
        }
        
        .category-content {
          flex: 1;
          min-width: 0;
        }
        
        .category-name {
          font-size: ${isMobile ? '13px' : '14px'};
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 4px;
        }
        
        .category-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 8px;
          border-radius: 16px;
          font-size: ${isMobile ? '9px' : '10px'};
          font-weight: 600;
        }
        
        .category-badge svg {
          width: 8px;
          height: 8px;
        }
        
        .badge-income {
          background: #d1fae5;
          color: #059669;
        }
        
        .badge-expense {
          background: #fee2e2;
          color: #dc2626;
        }
        
        .badge-both {
          background: #e0e7ff;
          color: #4f46e5;
        }
        
        .btn-delete {
          width: ${isMobile ? '28px' : '32px'};
          height: ${isMobile ? '28px' : '32px'};
          border-radius: 8px;
          background: #fef2f2;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        
        .btn-delete svg {
          stroke: #ef4444;
          width: 12px;
          height: 12px;
        }
        
        /* Create Button */
        .create-btn-wrapper {
          margin-bottom: ${isMobile ? '12px' : '16px'};
          display: flex;
          justify-content: flex-end;
        }
        
        .btn-create {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          border: none;
          border-radius: 30px;
          padding: ${isMobile ? '8px 16px' : '10px 20px'};
          color: white;
          font-weight: 600;
          font-size: ${isMobile ? '12px' : '13px'};
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          box-shadow: 0 2px 8px rgba(99,102,241,0.3);
        }
        
        .btn-create svg {
          width: 12px;
          height: 12px;
          stroke: white;
        }
        
        .btn-create.cancel {
          background: #f1f5f9;
          color: #64748b;
          box-shadow: none;
        }
        
        .btn-create.cancel svg {
          stroke: #64748b;
        }
        
        /* Form Modal */
        .form-modal {
          background: white;
          border-radius: ${isMobile ? '14px' : '16px'};
          padding: ${isMobile ? '14px' : '18px'};
          margin-bottom: ${isMobile ? '14px' : '18px'};
          border: 1px solid #e2e8f0;
        }
        
        .form-title {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 14px;
        }
        
        .form-title svg {
          width: 16px;
          height: 16px;
          stroke: #7f809a;
        }
        
        .form-title span {
          font-size: ${isMobile ? '14px' : '15px'};
          font-weight: 700;
          color: #0f172a;
        }
        
        .form-group {
          margin-bottom: 12px;
        }
        
        .form-group label {
          display: block;
          font-size: 10px;
          font-weight: 600;
          color: #64748b;
          margin-bottom: 4px;
          text-transform: uppercase;
        }
        
        .form-group input {
          width: 100%;
          padding: ${isMobile ? '8px 10px' : '9px 12px'};
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          font-size: ${isMobile ? '12px' : '13px'};
          outline: none;
          background: white;
        }
        
        .form-group input:focus {
          border-color: #6366f1;
        }
        
        /* Dropdown Selector Styles */
        .selector-row {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        
        .selector-item {
          flex: 1;
          position: relative;
        }
        
        .selector-button {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: ${isMobile ? '8px 10px' : '9px 12px'};
          background: white;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          cursor: pointer;
          font-size: ${isMobile ? '12px' : '13px'};
          transition: all 0.2s;
        }
        
        .selector-button:hover {
          border-color: #6366f1;
        }
        
        .selector-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .color-preview {
          width: 20px;
          height: 20px;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
        }
        
        /* Dropdown Menu */
        .dropdown-menu {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          margin-top: 4px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          z-index: 100;
          max-height: 200px;
          overflow-y: auto;
        }
        
        .icon-grid-dropdown {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 6px;
          padding: 10px;
        }
        
        .icon-dropdown-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 8px 4px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .icon-dropdown-item:hover {
          background: #eef2ff;
        }
        
        .icon-dropdown-item.selected {
          background: #eef2ff;
          border: 1px solid #6366f1;
        }
        
        .icon-dropdown-item svg {
          width: 20px;
          height: 20px;
          stroke: #1e293b;
        }
        
        .icon-dropdown-item span {
          font-size: 9px;
          color: #64748b;
        }
        
        .color-grid-dropdown {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          padding: 10px;
        }
        
        .color-dropdown-item {
          width: 100%;
          aspect-ratio: 1;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s;
          border: 2px solid transparent;
        }
        
        .color-dropdown-item:hover {
          transform: scale(1.05);
          border-color: #1e293b;
        }
        
        .color-dropdown-item.selected {
          border-color: #1e293b;
          transform: scale(1.05);
        }
        
        .type-group {
          display: flex;
          gap: 8px;
        }
        
        .type-option {
          flex: 1;
          padding: ${isMobile ? '6px' : '8px'};
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          background: #f8fafc;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-weight: 600;
          font-size: ${isMobile ? '11px' : '12px'};
        }
        
        .type-option svg {
          width: 10px;
          height: 10px;
        }
        
        .form-actions {
          display: flex;
          gap: 10px;
          margin-top: 14px;
        }
        
        .btn-submit, .btn-cancel {
          flex: 1;
          padding: ${isMobile ? '8px' : '10px'};
          border-radius: 10px;
          font-weight: 600;
          font-size: ${isMobile ? '11px' : '12px'};
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }
        
        .btn-submit {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          border: none;
          color: white;
        }
        
        .btn-submit svg {
          stroke: white;
          width: 12px;
          height: 12px;
        }
        
        .btn-cancel {
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          color: #64748b;
        }
        
        .empty-state {
          text-align: center;
          padding: ${isMobile ? '30px 16px' : '40px 20px'};
          background: white;
          border-radius: 14px;
        }
        
        .empty-state svg {
          width: 40px;
          height: 40px;
          stroke: #cbd5e1;
          margin-bottom: 10px;
        }
        
        .empty-state h3 {
          font-size: ${isMobile ? '14px' : '15px'};
          margin-bottom: 6px;
        }
        
        .empty-state p {
          font-size: ${isMobile ? '11px' : '12px'};
          margin-bottom: 14px;
        }
        
        .loading-state {
          text-align: center;
          padding: 40px;
          background: white;
          border-radius: 14px;
        }
        
        .spinner {
          width: 30px;
          height: 30px;
          border: 3px solid #e2e8f0;
          border-top-color: #6366f1;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin: 0 auto 12px;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        /* Responsive Desktop */
        @media (min-width: 641px) {
          .categories-grid {
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          }
        }
      `}</style>

      {/* Header */}
      <div className="page-header">
        <div className="header-title">
          <div className="header-icon">
            <Icon name="default" size={isMobile ? 18 : 22} color="white" />
          </div>
          <div>
            <h1>Catégories</h1>
          </div>
        </div>
        <p className="header-subtitle">Organisez vos transactions</p>
      </div>

      {/* Stats */}
      <div className="stats-bar">
        <div className="stat-card">
          <div className="stat-icon"><Icon name="default" size={isMobile ? 14 : 16} /></div>
          <div className="stat-info">
            <h4>Total</h4>
            <div className="stat-number">{sysCats.length + mesCats.length}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><IconBuilding /></div>
          <div className="stat-info">
            <h4>Système</h4>
            <div className="stat-number">{sysCats.length}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><IconUser /></div>
          <div className="stat-info">
            <h4>Personnelles</h4>
            <div className="stat-number">
              {mesCats.length}
              {nbMax !== -1 && <span className="stat-limit">/{nbMax}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-container">
        <button className={`tab-btn ${activeTab === 'system' ? 'active' : ''}`} onClick={() => setActiveTab('system')}>
          <IconBuilding />
          <span>Système</span>
        </button>
        <button className={`tab-btn ${activeTab === 'personal' ? 'active' : ''}`} onClick={() => setActiveTab('personal')}>
          <IconUser />
          <span>Personnelles</span>
        </button>
      </div>

      {/* Create Button */}
      {activeTab === 'personal' && peutCreer && !limitAtteinte && (
        <div className="create-btn-wrapper">
          <button className={`btn-create ${showForm ? 'cancel' : ''}`} onClick={() => setShowForm(!showForm)}>
            {showForm ? <IconClose /> : <IconPlus />}
            {showForm ? 'Annuler' : 'Créer'}
          </button>
        </div>
      )}

      {/* Form */}
      {showForm && activeTab === 'personal' && (
        <div className="form-modal">
          <div className="form-title">
            <IconPlusCircle />
            <span>Nouvelle catégorie</span>
          </div>
          <form onSubmit={creerCategorie}>
            <div className="form-group">
              <label>Nom</label>
              <input
                type="text"
                value={form.nom}
                onChange={e => setForm({ ...form, nom: e.target.value })}
                placeholder="Ex: Restaurant, Voyage..."
                required
              />
            </div>
            
            <div className="selector-row">
              <div className="selector-item" ref={iconDropdownRef}>
                <label>Icône</label>
                <button 
                  type="button" 
                  className="selector-button"
                  onClick={() => setShowIconDropdown(!showIconDropdown)}
                >
                  <div className="selector-left">
                    <SelectedIcon />
                    <span>{ICONES_LIST.find(i => i.value === form.icone)?.label || 'Défaut'}</span>
                  </div>
                  <IconChevronDown />
                </button>
                {showIconDropdown && (
                  <div className="dropdown-menu">
                    <div className="icon-grid-dropdown">
                      {ICONES_LIST.map(icon => {
                        const IconComp = icon.icon;
                        const isSelected = form.icone === icon.value;
                        return (
                          <div
                            key={icon.value}
                            className={`icon-dropdown-item ${isSelected ? 'selected' : ''}`}
                            onClick={() => {
                              setForm({ ...form, icone: icon.value });
                              setShowIconDropdown(false);
                            }}
                          >
                            <IconComp />
                            <span>{icon.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="selector-item" ref={colorDropdownRef}>
                <label>Couleur</label>
                <button 
                  type="button" 
                  className="selector-button"
                  onClick={() => setShowColorDropdown(!showColorDropdown)}
                >
                  <div className="selector-left">
                    <div className="color-preview" style={{ background: form.couleur }}></div>
                    <span>{SelectedColor.name}</span>
                  </div>
                  <IconChevronDown />
                </button>
                {showColorDropdown && (
                  <div className="dropdown-menu">
                    <div className="color-grid-dropdown">
                      {COULEURS_LIST.map(color => (
                        <div
                          key={color.value}
                          className={`color-dropdown-item ${form.couleur === color.value ? 'selected' : ''}`}
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
            
            <div className="form-group">
              <label>Type</label>
              <div className="type-group">
                {[
                  { value: 'entree', label: 'Entrée', icon: IconTrendingUp, color: '#10b981' },
                  { value: 'sortie', label: 'Sortie', icon: IconTrendingDown, color: '#ef4444' },
                  { value: 'les_deux', label: 'Les deux', icon: IconTransfer, color: '#6366f1' },
                ].map(type => (
                  <div
                    key={type.value}
                    className={`type-option ${form.type === type.value ? 'active' : ''}`}
                    style={form.type === type.value ? { borderColor: type.color, background: `${type.color}08` } : {}}
                    onClick={() => setForm({ ...form, type: type.value })}
                  >
                    <type.icon />
                    <span>{type.label}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="form-actions">
              <button type="submit" disabled={submitting} className="btn-submit">
                {submitting ? <div className="spinner" style={{ width: 12, height: 12 }}></div> : <IconCheck />}
                {submitting ? 'Création...' : 'Créer'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-cancel">
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Chargement...</p>
        </div>
      ) : activeTab === 'system' ? (
        sysCats.length === 0 ? (
          <div className="empty-state">
            <IconDefault />
            <h3>Aucune catégorie</h3>
            <p>Catégories système disponibles</p>
          </div>
        ) : (
          <div className="categories-grid">
            {sysCats.map(cat => {
              const TypeIcon = getTypeIconComponent(cat.type);
              return (
                <div key={cat.id} className="category-item">
                  <div className="category-icon" style={{ background: cat.couleur || '#6366f1' }}>
                    <Icon isSystem={true} categoryName={cat.nom} size={isMobile ? 16 : 18} color="white" />
                  </div>
                  <div className="category-content">
                    <div className="category-name">{cat.nom}</div>
                    <div className={`category-badge ${getTypeBadgeClass(cat.type)}`}>
                      <TypeIcon />
                      <span>{getTypeLabel(cat.type)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : !peutCreer ? (
        <div className="empty-state">
          <IconLock />
          <h3>Abonnement requis</h3>
          <p>Abonnez-vous pour créer des catégories</p>
          <button className="btn-create" onClick={() => navigate('/profil')}>
            <IconStar /> Voir les offres
          </button>
        </div>
      ) : mesCats.length === 0 ? (
        <div className="empty-state">
          <IconDefault />
          <h3>Aucune catégorie</h3>
          <p>Créez votre première catégorie</p>
          <button className="btn-create" onClick={() => setShowForm(true)}>
            <IconPlus /> Créer
          </button>
        </div>
      ) : (
        <div className="categories-grid">
          {mesCats.map(cat => {
            const TypeIcon = getTypeIconComponent(cat.type);
            const foundIcon = ICONES_LIST.find(i => i.value === cat.icone);
            const IconComp = foundIcon ? foundIcon.icon : IconDefault;
            return (
              <div key={cat.id} className="category-item">
                <div className="category-icon" style={{ background: `linear-gradient(135deg, ${cat.couleur || '#6366f1'}, ${cat.couleur || '#6366f1'}cc)` }}>
                  <IconComp />
                </div>
                <div className="category-content">
                  <div className="category-name">{cat.nom}</div>
                  <div className={`category-badge ${getTypeBadgeClass(cat.type)}`}>
                    <TypeIcon />
                    <span>{getTypeLabel(cat.type)}</span>
                  </div>
                </div>
                <button className="btn-delete" onClick={() => supprimerCategorie(cat.id)}>
                  <IconTrash />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}