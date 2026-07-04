// frontend/src/pages/Dashboard.js
import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

// ── Palette FinanceApp ────────────────────────────────────────────────────────
const PALETTE = {
  navy: '#003152',
  teal: '#003333',
  mint: '#02F5A1',
  black: '#07191E',
  gold: '#FDBF20',
  white: '#FFFFFF',
  bg: '#F5F7F8',
  border: '#E4E9EC',
  textSecondary: '#5B6E76',
  textMuted: '#93A3A9',
  danger: '#E5484D',
};

// ── Couleurs graphiques (dérivées de la palette de marque) ───────────────────
const COLORS = [PALETTE.navy, PALETTE.mint, PALETTE.gold, PALETTE.teal, '#4C7A94', '#6FE3BE', '#F0A400', '#0A4A73', '#B8860B', '#025E45'];

// ── COMPOSANT MESSAGE BANNIERE ───────────────────────────────────────────────
function MessageBanner({ type, message, onClose }) {
  if (!message) return null;

  const styles = {
    success: {
      background: '#EAFBF4',
      border: `1px solid ${PALETTE.mint}55`,
      color: '#02734F',
      icon: 'bx-check-circle',
    },
    error: {
      background: '#FDECEC',
      border: `1px solid ${PALETTE.danger}55`,
      color: '#A82A2E',
      icon: 'bx-error-circle',
    },
    warning: {
      background: '#FFF8E6',
      border: `1px solid ${PALETTE.gold}66`,
      color: '#8A6200',
      icon: 'bx-error',
    },
    info: {
      background: '#EAF1F5',
      border: `1px solid ${PALETTE.navy}33`,
      color: PALETTE.navy,
      icon: 'bx-info-circle',
    },
  };

  const style = styles[type] || styles.info;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      padding: '12px 16px',
      borderRadius: 10,
      background: style.background,
      border: style.border,
      marginBottom: 8,
      animation: 'fadeIn 0.3s ease-out both',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <i className={`bx ${style.icon}`} style={{ fontSize: 18, color: style.color }} />
        <span style={{ fontSize: 13, color: style.color, fontWeight: 500, lineHeight: 1.4 }}>
          {message}
        </span>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: style.color,
            fontSize: 18,
            padding: '4px',
            opacity: 0.6,
            transition: 'opacity 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: 32,
            minHeight: 32,
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '1'}
          onMouseLeave={e => e.currentTarget.style.opacity = '0.6'}
        >
          <i className='bx bx-x' />
        </button>
      )}
    </div>
  );
}

// ── Tooltip personnalisé ─────────────────────────────────────────────────────
const TooltipCustom = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: PALETTE.white,
      border: `1px solid ${PALETTE.border}`,
      borderRadius: 10,
      padding: '10px 14px',
      boxShadow: '0 8px 24px rgba(7,25,30,0.08)',
      fontSize: 11,
    }}>
      <p style={{ margin: '0 0 4px', fontWeight: 700, color: PALETTE.black }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ margin: '2px 0', color: p.color, fontWeight: 600, fontSize: 11 }}>
          {p.name} : {parseFloat(p.value).toLocaleString()} MRU
        </p>
      ))}
    </div>
  );
};

// ── Formateur personnalisé pour l'axe Y ───────────────────────────────────────
const formatYAxisMRU = (value) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M MRU`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k MRU`;
  return `${value} MRU`;
};

// ── Icônes SVG personnalisées ────────────────────────────────────────────────
const Icons = {
  solde: (color, size) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2V4M12 20V22M4 12H2M6.31412 6.31412L4.8999 4.8999M17.6859 6.31412L19.1001 4.8999M6.31412 17.69L4.8999 19.1042M17.6859 17.69L19.1001 19.1042M22 12H20M4 12H2M12 8V12L14 14" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 18C15.3137 18 18 15.3137 18 12C18 8.68629 15.3137 6 12 6C8.68629 6 6 8.68629 6 12C6 15.3137 8.68629 18 12 18Z" stroke={color} strokeWidth="1.5"/>
      <circle cx="12" cy="12" r="2" fill={color}/>
    </svg>
  ),
  entrees: (color, size) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 5V19M12 5L8 9M12 5L16 9" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M4 3H20" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  sorties: (color, size) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 19V5M12 19L8 15M12 19L16 15" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M4 21H20" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  transactions: (color, size) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="4" width="18" height="16" rx="2" stroke={color} strokeWidth="1.5"/>
      <path d="M8 2V6M16 2V6" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M3 10H21" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="12" cy="15" r="1.5" fill={color}/>
      <circle cx="16" cy="15" r="1.5" fill={color}/>
      <circle cx="8" cy="15" r="1.5" fill={color}/>
    </svg>
  )
};

// ── Carte stat avec icônes SVG ───────────────────────────────────────────────
function StatCard({ label, value, iconType, color, sub }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const iconSize = isMobile ? 18 : 22;
  const IconComponent = Icons[iconType];

  return (
    <div style={{
      background: PALETTE.white,
      borderRadius: 16,
      padding: isMobile ? '16px' : '20px 24px',
      boxShadow: '0 1px 2px rgba(7,25,30,0.04)',
      border: `1px solid ${PALETTE.border}`,
      display: 'flex',
      alignItems: 'center',
      gap: isMobile ? 12 : 16,
      transition: 'box-shadow 0.2s, border-color 0.2s',
    }}
    onMouseEnter={e => {
      e.currentTarget.style.boxShadow = '0 8px 20px rgba(7,25,30,0.06)';
      e.currentTarget.style.borderColor = `${color}44`;
    }}
    onMouseLeave={e => {
      e.currentTarget.style.boxShadow = '0 1px 2px rgba(7,25,30,0.04)';
      e.currentTarget.style.borderColor = PALETTE.border;
    }}>
      <div style={{
        width: isMobile ? 40 : 48,
        height: isMobile ? 40 : 48,
        borderRadius: 12,
        background: `${color}14`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        {IconComponent(color, iconSize)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: isMobile ? 10 : 11, color: PALETTE.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{label}</div>
        <div style={{ fontSize: isMobile ? 16 : 21, fontWeight: 800, color: PALETTE.black, marginTop: 4, wordBreak: 'break-word' }}>{value}</div>
        {sub && <div style={{ fontSize: isMobile ? 9 : 10, color: PALETTE.textMuted, marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

// ── Modal pour afficher les transactions ─────────────────────────────────────
function TransactionsModal({ isOpen, onClose, transactions, title }) {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(7,25,30,0.55)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: isMobile ? 16 : 24,
    }} onClick={onClose}>
      <div style={{
        background: PALETTE.white,
        borderRadius: 16,
        maxWidth: 600,
        width: '100%',
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 24px 48px rgba(7,25,30,0.24)',
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{
          padding: isMobile ? '14px 16px' : '18px 24px',
          borderBottom: `1px solid ${PALETTE.border}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: `linear-gradient(135deg, ${PALETTE.navy}, ${PALETTE.teal})`,
          color: PALETTE.white,
        }}>
          <h3 style={{ margin: 0, fontSize: isMobile ? 14 : 16, fontWeight: 700 }}>{title}</h3>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.12)',
            border: 'none',
            color: PALETTE.white,
            fontSize: isMobile ? 18 : 20,
            cursor: 'pointer',
            padding: 0,
            width: 32,
            height: 32,
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <i className='bx bx-x' />
          </button>
        </div>
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: isMobile ? 14 : 20,
        }}>
          {transactions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: isMobile ? 30 : 40, color: PALETTE.textMuted }}>
              <i className='bx bx-folder-open' style={{ fontSize: isMobile ? 32 : 40, marginBottom: 8 }} />
              <p style={{ margin: 0, fontSize: isMobile ? 12 : 14 }}>Aucune transaction trouvée</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {transactions.map((t, i) => (
                <div key={t.id} style={{
                  padding: isMobile ? 12 : 14,
                  background: PALETTE.bg,
                  borderRadius: 12,
                  border: `1px solid ${PALETTE.border}`,
                  borderLeft: `3px solid ${t.type === 'entree' ? PALETTE.mint : PALETTE.gold}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onClick={() => {
                  onClose();
                  navigate('/transactions');
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: isMobile ? 12 : 13, color: PALETTE.black }}>
                      {t.categorie_detail?.nom || 'Transaction'}
                    </span>
                    <span style={{
                      fontWeight: 700,
                      fontSize: isMobile ? 11 : 12,
                      color: t.type === 'entree' ? '#02734F' : '#8A6200'
                    }}>
                      {t.type === 'entree' ? '+' : '-'}{parseFloat(t.montant).toLocaleString()} MRU
                    </span>
                  </div>
                  {t.description && (
                    <p style={{ margin: '4px 0 0', fontSize: isMobile ? 10 : 11, color: PALETTE.textSecondary }}>
                      {t.description.length > 50 ? t.description.slice(0, 50) + '...' : t.description}
                    </p>
                  )}
                  <p style={{ margin: '4px 0 0', fontSize: isMobile ? 9 : 10, color: PALETTE.textMuted }}>
                    {new Date(t.date_creation).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── PAGE PRINCIPALE ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();
  const { estExpire, isVisitor, exitVisitorMode } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const expire = estExpire();
  const isVisitorMode = isVisitor;

  const [pageMessage, setPageMessage] = useState(null);
  const [abonnementCharge, setAbonnementCharge] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTransactions, setModalTransactions] = useState([]);
  const [modalTitle, setModalTitle] = useState('');
  const [allTransactions, setAllTransactions] = useState([]);

  // 🆕 Données mock pour le mode visiteur
  const mockData = {
    solde: {
      montant_total: 0,
      total_entrees: 245000,
      total_sorties: 157000,
    },
    nombre_transactions: 7,
    par_mois: [
      { mois: new Date(2026, 5, 1).toISOString(), type: 'entree', total: 250000 },
      { mois: new Date(2026, 5, 1).toISOString(), type: 'sortie', total: 157000 },
      { mois: new Date(2026, 4, 1).toISOString(), type: 'entree', total: 230000 },
      { mois: new Date(2026, 4, 1).toISOString(), type: 'sortie', total: 140000 },
      { mois: new Date(2026, 3, 1).toISOString(), type: 'entree', total: 210000 },
      { mois: new Date(2026, 3, 1).toISOString(), type: 'sortie', total: 130000 },
    ],
    par_categorie: [
      { categorie__nom: 'Alimentation', total: 45000, categorie__couleur: PALETTE.gold },
      { categorie__nom: 'Utilités', total: 60000, categorie__couleur: PALETTE.navy },
      { categorie__nom: 'Transport', total: 20000, categorie__couleur: PALETTE.teal },
      { categorie__nom: 'Divertissement', total: 28000, categorie__couleur: PALETTE.mint },
      { categorie__nom: 'Autres', total: 4000, categorie__couleur: '#4C7A94' },
    ],
    evolution_solde: [
      { date: new Date(2026, 5, 1).toISOString(), solde: 88000 },
      { date: new Date(2026, 5, 10).toISOString(), solde: 63000 },
      { date: new Date(2026, 5, 15).toISOString(), solde: 93000 },
      { date: new Date(2026, 5, 20).toISOString(), solde: 78000 },
      { date: new Date(2026, 5, 28).toISOString(), solde: 88000 },
    ],
    dernieres_transactions: [
      { id: 1, type: 'sortie', montant: 25000, categorie_detail: { nom: 'Alimentation' }, description: 'Achat alimentation', date: new Date(2026, 5, 28).toISOString() },
      { id: 2, type: 'sortie', montant: 5000, categorie_detail: { nom: 'Transport' }, description: 'Transport en commun', date: new Date(2026, 5, 27).toISOString() },
      { id: 3, type: 'sortie', montant: 15000, categorie_detail: { nom: 'Utilités' }, description: 'Facture électricité', date: new Date(2026, 5, 26).toISOString() },
      { id: 4, type: 'entree', montant: 250000, categorie_detail: { nom: 'Salaire' }, description: 'Salaire mensuel', date: new Date(2026, 5, 25).toISOString() },
      { id: 5, type: 'sortie', montant: 8000, categorie_detail: { nom: 'Divertissement' }, description: 'Abonnement streaming', date: new Date(2026, 5, 24).toISOString() },
    ],
    derniers_budgets: [
      { id: 1, categorie_nom: 'Alimentation', montant_prevu: 100000, montant_depense: 45000, est_depasse: false, couleur: PALETTE.gold, pourcentage_utilise: 45 },
      { id: 2, categorie_nom: 'Transport', montant_prevu: 50000, montant_depense: 20000, est_depasse: false, couleur: PALETTE.teal, pourcentage_utilise: 40 },
      { id: 3, categorie_nom: 'Utilités', montant_prevu: 75000, montant_depense: 60000, est_depasse: false, couleur: PALETTE.navy, pourcentage_utilise: 80 },
      { id: 4, categorie_nom: 'Divertissement', montant_prevu: 40000, montant_depense: 28000, est_depasse: false, couleur: PALETTE.mint, pourcentage_utilise: 70 },
    ],
  };

  // 🆕 Si en mode visiteur, utiliser les données mock
  useEffect(() => {
    if (isVisitorMode) {
      setData(mockData);
      setAllTransactions(mockData.dernieres_transactions);
      setLoading(false);
      // ✅ Message unique en haut de page
      setPageMessage({
        type: 'info',
        text: '🔍 Mode Exploration - Visualisation des données de démonstration. Créez un compte pour utiliser vos vraies données.'
      });
    }
  }, [isVisitorMode]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ✅ Vérifier l'abonnement
  const verifierAbonnement = async () => {
    if (isVisitorMode) {
      setAbonnementCharge(false);
      return;
    }
    try {
      await api.get('/abonnements/statut/');
    } catch (error) {
      // Silencieux - le contexte Auth gère déjà
    } finally {
      setAbonnementCharge(false);
    }
  };

  // ✅ Charger les données
  const chargerDonnees = async () => {
    if (isVisitorMode) return;

    setLoading(true);
    setPageMessage(null);
    try {
      const [dashboardRes, transactionsRes] = await Promise.all([
        api.get('/transactions/dashboard/'),
        api.get('/transactions/toutes/')
      ]);

      setData(dashboardRes.data);
      setAllTransactions(transactionsRes.data.results || transactionsRes.data);

    } catch (err) {
      const status = err.response?.status;
      const errorData = err.response?.data;

      if (status === 401) {
        setPageMessage({
          type: 'error',
          text: 'Session expirée. Veuillez vous reconnecter.'
        });
        setTimeout(() => {
          navigate('/connexion');
        }, 2000);
        return;
      }

      if (status === 403 && errorData?.error === 'abonnement_expire') {
        console.log('Abonnement expiré - mode lecture seule');
        return;
      }

      setPageMessage({
        type: 'error',
        text: 'Erreur lors du chargement du tableau de bord. Veuillez réessayer.'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    verifierAbonnement();
    if (!isVisitorMode) {
      chargerDonnees();
    }
  }, []);

  // Fonction pour gérer le clic sur une barre du graphique
  const handleBarClick = (mois, type) => {
    if (!allTransactions.length) return;

    const [moisNom, annee] = mois.split(' ');
    const moisIndex = { 'Jan': 0, 'Fév': 1, 'Mar': 2, 'Avr': 3, 'Mai': 4, 'Jun': 5,
                       'Jul': 6, 'Aoû': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Déc': 11 }[moisNom];

    if (moisIndex === undefined) return;

    const anneeComplete = 2000 + parseInt(annee);

    const filtered = allTransactions.filter(t => {
      const dateTrans = new Date(t.date_creation);
      const moisTrans = dateTrans.getMonth();
      const anneeTrans = dateTrans.getFullYear();
      return t.type === type && moisTrans === moisIndex && anneeTrans === anneeComplete;
    });

    setModalTransactions(filtered);
    setModalTitle(`${type === 'entree' ? 'Entrées' : 'Sorties'} - ${mois} ${annee}`);
    setModalOpen(true);
  };

  // Fonction pour gérer le clic sur une catégorie du pie chart
  const handlePieClick = (categorie) => {
    if (!allTransactions.length) return;

    const filtered = allTransactions.filter(t =>
      t.type === 'sortie' &&
      t.categorie_detail?.nom === categorie
    );

    setModalTransactions(filtered);
    setModalTitle(`Dépenses - ${categorie}`);
    setModalOpen(true);
  };

  // ✅ Composant personnalisé pour les barres cliquables
  const CustomBar = (props) => {
    const { x, y, width, height, payload, type } = props;
    const value = payload[type];

    if (!value || value === 0) return null;

    return (
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={type === 'entrees' ? PALETTE.mint : PALETTE.gold}
        rx={4}
        style={{ cursor: 'pointer', transition: 'opacity 0.2s' }}
        onClick={() => handleBarClick(payload.mois, type === 'entrees' ? 'entree' : 'sortie')}
        onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
        onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
      />
    );
  };

  // ✅ Afficher le loader pendant le chargement
  if (abonnementCharge && !isVisitorMode) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        flexDirection: 'column',
        gap: 12
      }}>
        <div style={{
          width: 32,
          height: 32,
          border: `2.5px solid ${PALETTE.border}`,
          borderTopColor: PALETTE.navy,
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <p style={{ color: PALETTE.textMuted, fontSize: 12 }}>Chargement...</p>
      </div>
    );
  }

  if (loading && !isVisitorMode) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 250, flexDirection: 'column', gap: 12 }}>
      <div style={{ width: 32, height: 32, border: `2.5px solid ${PALETTE.border}`, borderTopColor: PALETTE.navy, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ color: PALETTE.textMuted, fontSize: 12 }}>Chargement...</p>
    </div>
  );

  if (!data && !isVisitorMode) return (
    <div style={{ textAlign: 'center', padding: '40px 16px', color: PALETTE.textMuted }}>
      <i className='bx bx-error-circle' style={{ fontSize: 40, marginBottom: 10, color: PALETTE.danger }} />
      <p style={{ fontSize: 13 }}>Impossible de charger le tableau de bord</p>
      <button
        onClick={() => { setLoading(true); chargerDonnees(); }}
        style={{
          background: PALETTE.navy, color: PALETTE.white, border: 'none', borderRadius: 10,
          padding: '10px 18px', cursor: 'pointer', fontWeight: 600, fontSize: 13, marginTop: 12,
          minHeight: 40,
        }}
      >
        <i className='bx bx-refresh' style={{ marginRight: 6 }} /> Réessayer
      </button>
    </div>
  );

  const currentData = data || mockData;
  const solde = currentData.solde || {};
  const entrees = parseFloat(solde.total_entrees || 0);
  const sorties = parseFloat(solde.total_sorties || 0);
  const balance = parseFloat(solde.montant_total || 0);
  const nbTrans = currentData.nombre_transactions || 0;

  // Préparer données graphique barres
  const moisMap = {};
  (currentData.par_mois || []).forEach(item => {
    const mois = item.mois ? new Date(item.mois).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }) : '?';
    if (!moisMap[mois]) moisMap[mois] = { mois, entrees: 0, sorties: 0 };
    if (item.type === 'entree') moisMap[mois].entrees += parseFloat(item.total || 0);
    else moisMap[mois].sorties += parseFloat(item.total || 0);
  });
  const barData = Object.values(moisMap).slice(-6);

  // Évolution solde - TRI PAR DATE CROISSANTE
  const evoData = (currentData.evolution_solde || [])
    .map((e) => ({
      solde: parseFloat(e.solde || 0),
      date: e.date ? new Date(e.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : '',
      dateObj: e.date ? new Date(e.date) : null,
    }))
    .filter(e => e.dateObj !== null)
    .sort((a, b) => a.dateObj - b.dateObj)
    .map((e, index) => ({
      ...e,
      index: index,
    }));

  // Par catégorie (dépenses)
  const pieData = (currentData.par_categorie || []).slice(0, 6).map(c => ({
    name: c.categorie__nom || 'Autre',
    value: parseFloat(c.total || 0),
    couleur: c.categorie__couleur || '#6366f1',
  }));

  // ✅ Vérifier si l'utilisateur a des transactions
  const hasTransactions = nbTrans > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 16 : 24, padding: 0, fontFamily: "'DM Sans', sans-serif" }}>

      <link rel="stylesheet" href="https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css" />
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Outfit:wght@600;700;800&display=swap" rel="stylesheet" />

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .dashboard-card {
          animation: fadeIn 0.3s ease-out both;
        }
        .dashboard-card:nth-child(2) { animation-delay: 0.05s; }
        .dashboard-card:nth-child(3) { animation-delay: 0.1s; }
        .dashboard-card:nth-child(4) { animation-delay: 0.15s; }
      `}</style>

      {/* ── Message page ── */}
      <MessageBanner
        type={pageMessage?.type}
        message={pageMessage?.text}
        onClose={() => setPageMessage(null)}
      />

      {/* ── Modal des transactions ── */}
      <TransactionsModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        transactions={modalTransactions}
        title={modalTitle}
      />

      {/* ── Titre avec bouton Nouvelle transaction ── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: isMobile ? 12 : 16
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 12, marginBottom: 4 }}>
            <div style={{
              width: isMobile ? 36 : 42,
              height: isMobile ? 36 : 42,
              borderRadius: 12,
              background: `${PALETTE.navy}12`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <i className='bx bx-stats' style={{ fontSize: isMobile ? 18 : 22, color: PALETTE.navy }} />
            </div>
            <h1 style={{
              margin: 0,
              fontSize: isMobile ? 20 : 26,
              fontWeight: 800,
              color: PALETTE.black,
              fontFamily: "'Outfit', sans-serif"
            }}>
              Tableau de bord
            </h1>
          </div>
          <p style={{ margin: 0, color: PALETTE.textSecondary, fontSize: isMobile ? 11 : 13, display: 'flex', alignItems: 'center' }}>
            <i className='bx bx-transfer' style={{ marginRight: 4, fontSize: 12 }} />
            {nbTrans} transaction(s)
          </p>
        </div>

        {/* ✅ Bouton Nouvelle transaction - désactivé si abonnement expiré ou mode visiteur */}
        <button
          onClick={() => {
            if (isVisitorMode) {
              setPageMessage({
                type: 'warning',
                text: '🔍 Mode Exploration : Créez un compte pour ajouter des transactions.'
              });
              return;
            }
            if (expire) {
              setPageMessage({
                type: 'warning',
                text: 'Votre abonnement a expiré. Vous ne pouvez pas créer de nouvelles transactions.'
              });
              return;
            }
            navigate('/transactions');
          }}
          style={{
            background: (isVisitorMode || expire) ? '#EDF1F2' : PALETTE.navy,
            color: (isVisitorMode || expire) ? PALETTE.textMuted : PALETTE.white,
            border: 'none',
            borderRadius: 10,
            padding: isMobile ? '10px 16px' : '11px 20px',
            cursor: (isVisitorMode || expire) ? 'not-allowed' : 'pointer',
            fontWeight: 600,
            fontSize: isMobile ? 12 : 13,
            boxShadow: (isVisitorMode || expire) ? 'none' : '0 4px 12px rgba(0,49,82,0.18)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            whiteSpace: 'nowrap',
            minHeight: 44,
            transition: 'all 0.2s',
          }}
          title={isVisitorMode ? 'Mode exploration - Créez un compte' : expire ? 'Votre abonnement a expiré' : ''}
        >
          <i className='bx bx-plus' style={{ fontSize: isMobile ? 15 : 16 }} />
          Nouvelle transaction
        </button>
      </div>

      {/* ── Cartes statistiques ── */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fit, minmax(180px, 1fr))', gap: isMobile ? 12 : 16 }}>
        <StatCard
          label="Solde"
          value={`${balance.toLocaleString()} MRU`}
          iconType="solde"
          color={balance >= 0 ? PALETTE.mint : PALETTE.gold}
          sub="Entrées − Sorties"
        />
        <StatCard
          label="Entrées"
          value={`${entrees.toLocaleString()} MRU`}
          iconType="entrees"
          color={PALETTE.mint}
        />
        <StatCard
          label="Sorties"
          value={`${sorties.toLocaleString()} MRU`}
          iconType="sorties"
          color={PALETTE.gold}
        />
        <StatCard
          label="Transactions"
          value={nbTrans}
          iconType="transactions"
          color={PALETTE.navy}
          sub="au total"
        />
      </div>

      {/* ── Message si aucune transaction ── */}
      {!hasTransactions && (
        <div style={{
          background: `linear-gradient(135deg, ${PALETTE.navy}, ${PALETTE.teal})`,
          borderRadius: 16,
          padding: isMobile ? '20px 20px' : '32px 40px',
          textAlign: 'center',
        }}>
          <i className='bx bx-info-circle' style={{ fontSize: isMobile ? 28 : 36, color: PALETTE.mint, marginBottom: 10 }} />
          <h3 style={{ margin: 0, fontSize: isMobile ? 16 : 20, color: PALETTE.white, fontFamily: "'Outfit', sans-serif" }}>Bienvenue sur FinanceApp !</h3>
          <p style={{ margin: '8px 0 0', color: 'rgba(255,255,255,0.75)', fontSize: isMobile ? 12 : 14 }}>
            {isVisitorMode
              ? '🔍 Explorez l\'application avec des données de démonstration. Créez un compte pour utiliser vos vraies données.'
              : 'Commencez par créer votre première transaction pour voir vos statistiques ici.'
            }
          </p>
          {isVisitorMode ? (
            <button
              onClick={() => navigate('/inscription')}
              style={{
                background: PALETTE.gold,
                color: PALETTE.black,
                border: 'none',
                borderRadius: 10,
                padding: '10px 24px',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: isMobile ? 12 : 14,
                marginTop: 16,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                minHeight: 44,
              }}
            >
              <i className='bx bx-user-plus' style={{ fontSize: isMobile ? 14 : 16 }} /> Créer un compte
            </button>
          ) : (
            !expire && (
              <button
                onClick={() => navigate('/transactions')}
                style={{
                  background: PALETTE.mint,
                  color: PALETTE.black,
                  border: 'none',
                  borderRadius: 10,
                  padding: '10px 24px',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: isMobile ? 12 : 14,
                  marginTop: 16,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  minHeight: 44,
                }}
              >
                <i className='bx bx-plus' style={{ fontSize: isMobile ? 14 : 16 }} /> Créer ma première transaction
              </button>
            )
          )}
        </div>
      )}

      {/* ── Graphique barres (entrées vs sorties par mois) ── */}
      {barData.length > 0 && (
        <div className="dashboard-card" style={{ background: PALETTE.white, borderRadius: 16, padding: isMobile ? '16px' : '24px 24px', boxShadow: '0 1px 2px rgba(7,25,30,0.04)', border: `1px solid ${PALETTE.border}` }}>
          <h3 style={{ margin: '0 0 16px', fontSize: isMobile ? 13 : 15, fontWeight: 700, color: PALETTE.black, display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className='bx bx-bar-chart-alt-2' style={{ fontSize: isMobile ? 15 : 17, color: PALETTE.navy }} />
            Entrées vs Sorties par mois
          </h3>
          <ResponsiveContainer width="100%" height={isMobile ? 180 : 240}>
            <BarChart data={barData} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F3" />
              <XAxis dataKey="mois" tick={{ fontSize: isMobile ? 9 : 12, fill: PALETTE.textMuted }} />
              <YAxis
                tick={{ fontSize: isMobile ? 8 : 11, fill: PALETTE.textMuted }}
                tickFormatter={formatYAxisMRU}
                width={isMobile ? 50 : 65}
              />
              <Tooltip content={<TooltipCustom />} />
              <Legend wrapperStyle={{ fontSize: isMobile ? 10 : 12 }} />
              <Bar
                dataKey="entrees"
                name="Entrées"
                fill={PALETTE.mint}
                radius={[4,4,0,0]}
                shape={(props) => <CustomBar {...props} type="entrees" payload={props.payload} />}
              />
              <Bar
                dataKey="sorties"
                name="Sorties"
                fill={PALETTE.gold}
                radius={[4,4,0,0]}
                shape={(props) => <CustomBar {...props} type="sorties" payload={props.payload} />}
              />
            </BarChart>
          </ResponsiveContainer>
          <p style={{ margin: '8px 0 0', fontSize: isMobile ? 9 : 11, color: PALETTE.textMuted, textAlign: 'center' }}>
            Cliquez sur une barre pour voir les détails
          </p>
        </div>
      )}

      {/* ── Graphiques : Évolution et Dépenses ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : (evoData.length > 0 ? '1.6fr 1fr' : '1fr'),
        gap: isMobile ? 16 : 20
      }}>

        {/* Évolution solde */}
        {evoData.length > 0 && (
          <div className="dashboard-card" style={{ background: PALETTE.white, borderRadius: 16, padding: isMobile ? '16px' : '24px 24px', boxShadow: '0 1px 2px rgba(7,25,30,0.04)', border: `1px solid ${PALETTE.border}` }}>
            <h3 style={{ margin: '0 0 16px', fontSize: isMobile ? 13 : 15, fontWeight: 700, color: PALETTE.black, display: 'flex', alignItems: 'center', gap: 8 }}>
              <i className='bx bx-line-chart' style={{ fontSize: isMobile ? 15 : 17, color: PALETTE.navy }} />
              Évolution du solde
            </h3>
            <ResponsiveContainer width="100%" height={isMobile ? 160 : 200}>
              <AreaChart data={evoData}>
                <defs>
                  <linearGradient id="gradSolde" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={PALETTE.mint} stopOpacity={0.28} />
                    <stop offset="95%" stopColor={PALETTE.mint} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F3" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: isMobile ? 8 : 10, fill: PALETTE.textMuted }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: isMobile ? 8 : 10, fill: PALETTE.textMuted }}
                  tickFormatter={formatYAxisMRU}
                  width={isMobile ? 55 : 70}
                />
                <Tooltip
                  formatter={(value) => [`${parseFloat(value).toLocaleString()} MRU`, 'Solde']}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Area
                  type="monotone"
                  dataKey="solde"
                  stroke={PALETTE.navy}
                  strokeWidth={2}
                  fill="url(#gradSolde)"
                  dot={{ r: 3, fill: PALETTE.navy }}
                  activeDot={{ r: 5, fill: PALETTE.mint }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Dépenses par catégorie */}
        {pieData.length > 0 && (
          <div className="dashboard-card" style={{ background: PALETTE.white, borderRadius: 16, padding: isMobile ? '16px' : '24px 24px', boxShadow: '0 1px 2px rgba(7,25,30,0.04)', border: `1px solid ${PALETTE.border}` }}>
            <h3 style={{ margin: '0 0 8px', fontSize: isMobile ? 13 : 15, fontWeight: 700, color: PALETTE.black, display: 'flex', alignItems: 'center', gap: 8 }}>
              <i className='bx bx-pie-chart-alt' style={{ fontSize: isMobile ? 15 : 17, color: PALETTE.gold }} />
              Dépenses par catégorie
            </h3>
            <ResponsiveContainer width="100%" height={isMobile ? 140 : 180}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={isMobile ? 30 : 50}
                  outerRadius={isMobile ? 50 : 80}
                  dataKey="value"
                  nameKey="name"
                  paddingAngle={2}
                >
                  {pieData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.couleur || COLORS[i % COLORS.length]}
                      style={{ cursor: 'pointer' }}
                      onClick={() => handlePieClick(entry.name)}
                      onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
                      onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${parseFloat(value).toLocaleString()} MRU`, 'Montant']} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: isMobile ? 8 : 12 }}>
              {pieData.map((c, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: isMobile ? 10 : 12,
                    cursor: 'pointer',
                    padding: '6px 8px',
                    borderRadius: 8,
                    transition: 'background 0.2s'
                  }}
                  onClick={() => handlePieClick(c.name)}
                  onMouseEnter={e => e.currentTarget.style.background = PALETTE.bg}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.couleur || COLORS[i % COLORS.length], flexShrink: 0 }} />
                  <span style={{ flex: 1, color: PALETTE.textSecondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: isMobile ? 10 : 12 }}>{c.name}</span>
                  <span style={{ fontWeight: 700, color: PALETTE.black, whiteSpace: 'nowrap', fontSize: isMobile ? 10 : 12 }}>{parseFloat(c.value).toLocaleString()} MRU</span>
                </div>
              ))}
            </div>
            <p style={{ margin: '8px 0 0', fontSize: isMobile ? 9 : 11, color: PALETTE.textMuted, textAlign: 'center' }}>
              Cliquez sur une catégorie pour voir les détails
            </p>
          </div>
        )}
      </div>

      {/* ── 5 dernières transactions ── */}
      <div className="dashboard-card" style={{ background: PALETTE.white, borderRadius: 16, padding: isMobile ? '16px' : '24px 28px', boxShadow: '0 1px 2px rgba(7,25,30,0.04)', border: `1px solid ${PALETTE.border}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isMobile ? 12 : 16, flexWrap: 'wrap', gap: 8 }}>
          <h3 style={{ margin: 0, fontSize: isMobile ? 13 : 15, fontWeight: 700, color: PALETTE.black, display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className='bx bx-history' style={{ fontSize: isMobile ? 15 : 17, color: PALETTE.navy }} />
            Dernières transactions
          </h3>
          <button
            onClick={() => navigate('/transactions')}
            style={{
              background: `${PALETTE.navy}0F`,
              color: PALETTE.navy,
              border: 'none',
              borderRadius: 8,
              padding: isMobile ? '6px 12px' : '8px 16px',
              cursor: 'pointer',
              fontSize: isMobile ? 10 : 12,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              minHeight: 36,
            }}
          >
            Voir toutes <i className='bx bx-right-arrow-alt' style={{ fontSize: isMobile ? 12 : 14 }} />
          </button>
        </div>

        {((currentData.dernieres_transactions || []).length === 0) ? (
          <div style={{ textAlign: 'center', padding: isMobile ? '28px 12px' : '32px 0', color: PALETTE.textMuted }}>
            <i className='bx bx-folder-open' style={{ fontSize: isMobile ? 32 : 40, marginBottom: 6, color: PALETTE.border }} />
            <p style={{ margin: 0, fontSize: isMobile ? 12 : 14 }}>Aucune transaction récente</p>
            {!isVisitorMode && !expire && (
              <button
                onClick={() => navigate('/transactions')}
                style={{
                  background: PALETTE.navy,
                  color: PALETTE.white,
                  border: 'none',
                  borderRadius: 8,
                  padding: '8px 18px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: isMobile ? 11 : 13,
                  marginTop: 12,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  minHeight: 40,
                }}
              >
                <i className='bx bx-plus' /> Créer
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {((currentData.dernieres_transactions || [])).map((t, i) => (
              <div key={t.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: isMobile ? 10 : 14,
                padding: isMobile ? '10px 0' : '14px 0',
                borderBottom: i < ((currentData.dernieres_transactions || []).length - 1) ? `1px solid ${PALETTE.bg}` : 'none',
                opacity: isVisitorMode ? 0.85 : 1,
              }}>
                <div style={{
                  width: isMobile ? 34 : 40,
                  height: isMobile ? 34 : 40,
                  borderRadius: 10,
                  flexShrink: 0,
                  background: t.type === 'entree' ? `${PALETTE.mint}18` : `${PALETTE.gold}1A`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <i className={`bx ${t.type === 'entree' ? 'bx-up-arrow-alt' : 'bx-down-arrow-alt'}`} style={{ fontSize: isMobile ? 15 : 18, color: t.type === 'entree' ? '#02734F' : '#8A6200' }} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: isMobile ? 12 : 14, color: PALETTE.black, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.categorie_detail?.nom || (t.type === 'entree' ? 'Entrée' : 'Dépense')}
                  </div>
                  <div style={{ fontSize: isMobile ? 9 : 12, color: PALETTE.textMuted, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.description
                      ? t.description.length > 25 ? t.description.slice(0, 25) + '...' : t.description
                      : new Date(t.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                  </div>
                </div>

                <div style={{
                  fontWeight: 700,
                  fontSize: isMobile ? 12 : 15,
                  color: t.type === 'entree' ? '#02734F' : '#8A6200',
                  whiteSpace: 'nowrap',
                  flexShrink: 0
                }}>
                  {t.type === 'entree' ? '+' : '−'}{parseFloat(t.montant).toLocaleString()} MRU
                </div>
              </div>
            ))}
            {/* ✅ Message unique en bas des transactions */}
            {isVisitorMode && (
              <div style={{
                padding: '12px 0 0',
                textAlign: 'center',
                fontSize: isMobile ? 10 : 12,
                color: PALETTE.gold,
                fontWeight: 600,
                borderTop: `1px solid ${PALETTE.bg}`,
                marginTop: 4,
              }}>
                🔍 Données de démonstration - Créez un compte pour vos vraies transactions
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Budgets actifs ── */}
      {(currentData.derniers_budgets || []).length > 0 && (
        <div className="dashboard-card" style={{ background: PALETTE.white, borderRadius: 16, padding: isMobile ? '16px' : '24px 28px', boxShadow: '0 1px 2px rgba(7,25,30,0.04)', border: `1px solid ${PALETTE.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isMobile ? 12 : 16, flexWrap: 'wrap', gap: 8 }}>
            <h3 style={{ margin: 0, fontSize: isMobile ? 13 : 15, fontWeight: 700, color: PALETTE.black, display: 'flex', alignItems: 'center', gap: 8 }}>
              <i className='bx bx-target-lock' style={{ fontSize: isMobile ? 15 : 17, color: PALETTE.gold }} />
              Budgets actifs
            </h3>
            <button
              onClick={() => navigate('/budgets')}
              style={{
                background: `${PALETTE.navy}0F`,
                color: PALETTE.navy,
                border: 'none',
                borderRadius: 8,
                padding: isMobile ? '6px 12px' : '8px 16px',
                cursor: 'pointer',
                fontSize: isMobile ? 10 : 12,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                minHeight: 36,
              }}
            >
              Voir tous <i className='bx bx-right-arrow-alt' style={{ fontSize: isMobile ? 12 : 14 }} />
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(220px, 1fr))', gap: isMobile ? 12 : 16 }}>
            {((currentData.derniers_budgets || [])).map(b => {
              const pct = Math.min(b.pourcentage_utilise || 0, 100);
              const couleur = b.couleur || (b.est_depasse ? PALETTE.gold : pct >= 80 ? PALETTE.gold : PALETTE.mint);
              return (
                <div key={b.id}
                  onClick={() => navigate('/budgets')}
                  style={{
                    background: PALETTE.bg,
                    borderRadius: 12,
                    padding: isMobile ? '14px' : '16px 18px',
                    cursor: 'pointer',
                    border: `1px solid ${PALETTE.border}`,
                    borderLeft: `3px solid ${couleur}`,
                    transition: 'all 0.2s',
                    opacity: isVisitorMode ? 0.85 : 1,
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(7,25,30,0.06)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: couleur }} />
                    <span style={{ fontWeight: 700, fontSize: isMobile ? 12 : 14, color: PALETTE.black, flex: 1 }}>{b.categorie_nom}</span>
                    {b.est_depasse && (
                      <span style={{
                        fontSize: 9,
                        background: `${PALETTE.gold}22`,
                        color: '#8A6200',
                        borderRadius: 6,
                        padding: '2px 7px',
                        fontWeight: 700
                      }}>
                        DÉPASSÉ
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: isMobile ? 10 : 12 }}>
                    <span style={{ color: PALETTE.black, fontWeight: 700 }}>{parseFloat(b.montant_depense || 0).toLocaleString()} MRU</span>
                    <span style={{ color: PALETTE.textMuted }}>{parseFloat(b.montant_prevu || 0).toLocaleString()} MRU</span>
                  </div>
                  <div style={{ background: PALETTE.border, borderRadius: 3, height: 6, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: couleur, borderRadius: 3, transition: 'width 0.4s' }} />
                  </div>
                  <p style={{ margin: '6px 0 0', fontSize: isMobile ? 9 : 11, color: PALETTE.textSecondary, fontWeight: 600, textAlign: 'right' }}>
                    {pct.toFixed(0)}% utilisé
                  </p>
                </div>
              );
            })}
          </div>
          {/* ✅ Message unique en bas des budgets */}
          {isVisitorMode && (
            <div style={{
              padding: '12px 0 0',
              textAlign: 'center',
              fontSize: isMobile ? 10 : 12,
              color: PALETTE.gold,
              fontWeight: 600,
              borderTop: `1px solid ${PALETTE.bg}`,
              marginTop: 14,
            }}>
              🔍 Données de démonstration - Créez un compte pour vos vrais budgets
            </div>
          )}
        </div>
      )}
    </div>
  );
}