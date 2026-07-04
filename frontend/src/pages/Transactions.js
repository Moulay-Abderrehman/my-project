// frontend/src/pages/Transactions.js
import React, { useEffect, useState, useCallback } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ActionBlockedModal from '../components/ActionBlockedModal';

// ── SHARED STYLE CONSTANTS ────────────────────────────────────────────────────
// Palette FinanceApp : navy #003152 · teal #003333 · mint #02F5A1 · near-black #07191E · gold #FDBF20
// Le rouge (danger) est réservé exclusivement aux actions destructrices / erreurs système,
// distinct de la sémantique "sortie" (gold) pour ne pas mélanger alerte système et logique métier.

const COLORS = {
  entree: '#02734F',      // texte/accent "entrée" (lisible sur fond clair)
  entreeBg: '#E8FBF3',    // fond clair "entrée"
  entreeAccent: '#02F5A1',// mint pur (accents graphiques, points, barres)
  sortie: '#8A6200',      // texte/accent "sortie" (lisible sur fond clair)
  sortieBg: '#FFF6E0',    // fond clair "sortie"
  sortieAccent: '#FDBF20',// gold pur (accents graphiques, points, barres)
  primary: '#003152',     // navy
  primaryDark: '#003333', // teal
  primaryBg: '#EAF1F5',   // fond clair navy
  primaryBgStrong: '#B9CBD6',
  text: '#07191E',
  textMuted: '#5B6E76',
  textLight: '#93A3A9',
  border: '#E4E9EC',
  bg: '#F5F7F8',
  white: '#ffffff',
  success: '#02734F',
  successBg: '#E8FBF3',
  warning: '#8A6200',
  warningBg: '#FFF6E0',
  error: '#E5484D',
  errorBg: '#FDECEC',
  errorBorder: '#E5484D55',
  info: '#003152',
  infoBg: '#EAF1F5',
  disabledBg: '#EDF1F2',
  disabledText: '#93A3A9',
};

const sharedInput = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '10px 12px 10px 36px',
  borderRadius: 10,
  border: `1.5px solid ${COLORS.border}`,
  background: COLORS.bg,
  fontSize: 14,
  color: COLORS.text,
  fontFamily: "'DM Sans', sans-serif",
  outline: 'none',
  transition: 'border-color 0.2s, box-shadow 0.2s, background 0.2s',
};

const lblStyle = {
  display: 'flex', alignItems: 'center', gap: 4,
  fontSize: 11, color: COLORS.textMuted, fontWeight: 600,
  textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6,
};

const iconLeft = {
  position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
  fontSize: 16, color: COLORS.textLight, pointerEvents: 'none',
};

// ── COMPOSANT DE MESSAGE ──────────────────────────────────────────────────────
function MessageBanner({ type, message, onClose }) {
  if (!message) return null;

  const styles = {
    success: {
      background: COLORS.successBg,
      border: `1px solid ${COLORS.entreeAccent}55`,
      color: COLORS.success,
      icon: 'bx-check-circle',
    },
    error: {
      background: COLORS.errorBg,
      border: `1px solid ${COLORS.errorBorder}`,
      color: '#A82A2E',
      icon: 'bx-error-circle',
    },
    warning: {
      background: COLORS.warningBg,
      border: `1px solid ${COLORS.sortieAccent}66`,
      color: COLORS.warning,
      icon: 'bx-error',
    },
    info: {
      background: COLORS.infoBg,
      border: `1px solid ${COLORS.primary}33`,
      color: COLORS.info,
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
      borderRadius: 12,
      background: style.background,
      border: style.border,
      marginBottom: 16,
      animation: 'fadeUp 0.3s cubic-bezier(.16,1,.3,1) both',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <i className={`bx ${style.icon}`} style={{ fontSize: 20, color: style.color }} />
        <span style={{ fontSize: 13, color: style.color, fontWeight: 500 }}>
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
            padding: '6px',
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

// ── SPINNER ───────────────────────────────────────────────────────────────────
const spinnerStyle = {
  width: 15, height: 15,
  border: '2px solid rgba(255,255,255,0.3)',
  borderTopColor: '#fff', borderRadius: '50%',
  display: 'inline-block', animation: 'spin 0.7s linear infinite',
};

// ── COMPOSANT BADGE TYPE ──────────────────────────────────────────────────────
function TypeBadge({ type }) {
  const isEntree = type === 'entree';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 700,
      background: isEntree ? COLORS.entreeBg : COLORS.sortieBg,
      color: isEntree ? COLORS.entree : COLORS.sortie,
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <i className={isEntree ? 'bx bx-trending-up' : 'bx bx-trending-down'} style={{ fontSize: 13 }} />
      {isEntree ? 'Entrée' : 'Sortie'}
    </span>
  );
}

// ── MODAL CRÉATION / MODIFICATION ─────────────────────────────────
function TransactionModal({ 
  transaction, 
  onClose, 
  onSuccess, 
  categories,
  onMessage,
  isVisitorMode, // 🆕
}) {
  const [form, setForm] = useState({
    type: transaction?.type || 'entree',
    montant: transaction?.montant || '',
    description: transaction?.description || '',
    categorie: transaction?.categorie || '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const isEdit = !!transaction;

  const categoriesFiltrees = (categories || []).filter(c => {
    if (!c || !c.nom || c.nom.trim() === '') return false;
    return c.type === 'les_deux' || c.type === form.type;
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value,
    }));
    setMessage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 🆕 Vérification du mode visiteur
    if (isVisitorMode) {
      setMessage({ 
        type: 'error', 
        text: '🔍 Mode Exploration : Créez un compte pour ajouter ou modifier des transactions.' 
      });
      if (onMessage) onMessage('visitor_mode');
      return;
    }
    
    if (!form.montant || parseFloat(form.montant) <= 0) {
      setMessage({ type: 'error', text: 'Le montant doit être supérieur à 0.' });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const payload = {
        type: form.type,
        montant: parseFloat(form.montant),
        description: form.description,
        categorie: form.categorie || null,
      };
      if (isEdit) {
        await api.patch(`/transactions/${transaction.id}/`, payload);
        setMessage({ type: 'success', text: 'Transaction modifiée avec succès !' });
        setTimeout(() => {
          onSuccess();
        }, 1000);
      } else {
        await api.post('/transactions/', payload);
        setMessage({ type: 'success', text: 'Transaction créée avec succès !' });
        setTimeout(() => {
          onSuccess();
        }, 1000);
      }
    } catch (err) {
      const errorData = err.response?.data;
      const status = err.response?.status;
      
      // 🆕 Gestion du mode visiteur
      if (status === 403 && errorData?.visitor_mode) {
        setMessage({ 
          type: 'error', 
          text: '🔍 Mode Exploration : Créez un compte pour effectuer cette action.' 
        });
        if (onMessage) onMessage('visitor_mode');
        return;
      }
      
      if (status === 403) {
        if (errorData?.error === 'abonnement_expire') {
          setMessage({ 
            type: 'error', 
            text: 'Votre abonnement a expiré. Veuillez le renouveler pour effectuer cette action.' 
          });
          if (onMessage) onMessage('abonnement_expire');
          return;
        }
        if (errorData?.error === 'abonnement_requis') {
          setMessage({ 
            type: 'error', 
            text: 'Vous devez avoir un abonnement actif pour effectuer cette action.' 
          });
          return;
        }
        if (errorData?.error === 'limite_essai' || errorData?.error === 'limite' || 
            (errorData?.detail && errorData.detail.toLowerCase().includes('limite'))) {
          setMessage({ 
            type: 'warning', 
            text: 'Limite quotidienne atteinte. Revenez demain ou passez à un abonnement payant.' 
          });
          return;
        }
      }
      
      if (status === 401) {
        setMessage({ 
          type: 'error', 
          text: 'Session expirée. Veuillez vous reconnecter.' 
        });
        setTimeout(() => {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          window.location.href = '/connexion';
        }, 2000);
        return;
      }
      
      const msg = errorData?.message || errorData?.detail || 'Une erreur est survenue. Veuillez réessayer.';
      setMessage({ type: 'error', text: msg });
    } finally {
      setLoading(false);
    }
  };

  const typeColor = form.type === 'entree' ? COLORS.entree : COLORS.sortie;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(7,25,30,0.6)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }} onClick={onClose}>
      <div style={{
        background: COLORS.white,
        borderRadius: 20, padding: '28px 24px',
        width: '100%', maxWidth: 460,
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 32px 80px rgba(7,25,30,0.24)',
        animation: 'modalIn 0.3s cubic-bezier(.16,1,.3,1)',
      }} onClick={e => e.stopPropagation()}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: isEdit ? COLORS.sortieBg : COLORS.primaryBg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <i className={isEdit ? 'bx bx-edit' : 'bx bx-plus'} style={{
                fontSize: 18,
                color: isEdit ? COLORS.sortie : COLORS.primary,
              }} />
            </div>
            <h3 style={{ margin: 0, color: COLORS.text, fontWeight: 800, fontSize: 18, fontFamily: "'Outfit', sans-serif" }}>
              {isEdit ? 'Modifier la transaction' : 'Nouvelle transaction'}
            </h3>
          </div>
          <button onClick={onClose} style={{
            background: COLORS.bg, border: `1px solid ${COLORS.border}`,
            borderRadius: 8, width: 32, height: 32, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: COLORS.textLight, transition: 'all 0.15s',
          }}>
            <i className='bx bx-x' style={{ fontSize: 18 }} />
          </button>
        </div>

        <div style={{ height: 1, background: COLORS.border, marginBottom: 20 }} />

        {/* Message dans le modal */}
        {message && (
          <MessageBanner 
            type={message.type} 
            message={message.text} 
            onClose={() => setMessage(null)}
          />
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          <div>
            <label style={lblStyle}>
              <i className='bx bx-transfer' style={{ fontSize: 12 }} /> Type
            </label>
            <div style={{ display: 'flex', gap: 10 }}>
              {[
                { val: 'entree', label: 'Entrée', icon: 'bx-trending-up', color: COLORS.entree },
                { val: 'sortie', label: 'Sortie', icon: 'bx-trending-down', color: COLORS.sortie },
              ].map(opt => (
                <button key={opt.val} type="button"
                  onClick={() => setForm(prev => ({ ...prev, type: opt.val, categorie: '' }))}
                  style={{
                    flex: 1, padding: '11px 10px', borderRadius: 11,
                    border: `2px solid ${form.type === opt.val ? opt.color : COLORS.border}`,
                    background: form.type === opt.val ? opt.color + '14' : COLORS.white,
                    color: form.type === opt.val ? opt.color : COLORS.textMuted,
                    cursor: 'pointer', fontWeight: 700, fontSize: 14,
                    transition: 'all 0.18s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    fontFamily: "'DM Sans', sans-serif",
                    minHeight: 44,
                  }}>
                  <i className={`bx ${opt.icon}`} style={{ fontSize: 16 }} />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={lblStyle}>
              <i className='bx bx-coin-stack' style={{ fontSize: 12 }} /> Montant (MRU) *
            </label>
            <div style={{ position: 'relative' }}>
              <i className='bx bx-money' style={iconLeft} />
              <input name="montant" type="number" step="0.01" min="0.01"
                value={form.montant} onChange={handleChange}
                placeholder="0.00"
                className="tx-input"
                style={{ ...sharedInput }}
                required
                disabled={isVisitorMode}
              />
            </div>
          </div>

          <div>
            <label style={lblStyle}>
              <i className='bx bx-category' style={{ fontSize: 12 }} />
              Catégorie{' '}
              <span style={{ color: COLORS.textLight, fontWeight: 400, textTransform: 'none' }}>(optionnel)</span>
            </label>
            {categoriesFiltrees.length === 0 ? (
              <div style={{
                padding: '12px 14px', borderRadius: 10,
                background: COLORS.sortieBg, border: `1.5px solid ${COLORS.sortieAccent}66`,
                color: COLORS.sortie, fontSize: 13,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <i className='bx bx-error' style={{ fontSize: 16, color: COLORS.sortieAccent }} />
                {categories.length === 0 ? 'Aucune catégorie disponible.' : `Aucune catégorie pour le type "${form.type === 'entree' ? 'Entrée' : 'Sortie'}"`}
                {categories.length === 0 && !isVisitorMode && (
                  <a href="/categories" style={{ color: COLORS.primary, fontWeight: 600 }}>
                    Créer
                  </a>
                )}
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                <i className='bx bx-category-alt' style={iconLeft} />
                <select name="categorie" value={form.categorie || ''} onChange={handleChange}
                  className="tx-input"
                  style={{ ...sharedInput, background: COLORS.white, cursor: 'pointer', appearance: 'none' }}
                  disabled={isVisitorMode}>
                  <option value="">— Sans catégorie —</option>
                  {categoriesFiltrees.map(c => (
                    <option key={c.id} value={c.id}>{c.nom}</option>
                  ))}
                </select>
                <i className='bx bx-chevron-down' style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  fontSize: 16, color: COLORS.textLight, pointerEvents: 'none',
                }} />
              </div>
            )}
          </div>

          <div>
            <label style={lblStyle}>
              <i className='bx bx-text' style={{ fontSize: 12 }} /> Description
            </label>
            <textarea name="description" value={form.description} onChange={handleChange}
              placeholder="Description optionnelle..."
              rows={3}
              className="tx-input"
              style={{
                ...sharedInput, paddingLeft: 14, resize: 'vertical',
                fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5,
              }}
              disabled={isVisitorMode}
            />
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button type="submit" disabled={loading || isVisitorMode} style={{
              flex: 2,
              background: isVisitorMode ? COLORS.disabledBg : `linear-gradient(135deg, ${typeColor}, ${typeColor}dd)`,
              color: isVisitorMode ? COLORS.disabledText : COLORS.white,
              border: 'none', borderRadius: 11, padding: '12px',
              cursor: (loading || isVisitorMode) ? 'not-allowed' : 'pointer', 
              fontWeight: 700, fontSize: 14,
              opacity: (loading || isVisitorMode) ? 0.75 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              fontFamily: "'DM Sans', sans-serif",
              boxShadow: isVisitorMode ? 'none' : `0 4px 14px ${typeColor}33`,
              transition: 'all 0.2s',
              minHeight: 44,
            }}>
              {loading
                ? <><span style={spinnerStyle} /> En cours...</>
                : isVisitorMode
                  ? <><i className='bx bx-lock' style={{ fontSize: 16 }} /> Mode Exploration</>
                  : <><i className={isEdit ? 'bx bx-save' : 'bx bx-check'} style={{ fontSize: 16 }} />
                      {isEdit ? 'Modifier' : 'Créer'}</>
              }
            </button>
            <button type="button" onClick={onClose} style={{
              flex: 1, background: COLORS.bg,
              border: `1.5px solid ${COLORS.border}`,
              borderRadius: 11, padding: '12px', cursor: 'pointer',
              fontSize: 14, color: COLORS.textMuted, fontWeight: 600,
              fontFamily: "'DM Sans', sans-serif",
              transition: 'all 0.15s',
              minHeight: 44,
            }}>
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── PAGE PRINCIPALE ───────────────────────────────────────────────────────────
export default function Transactions() {
  const navigate = useNavigate();
  const { isVisitor, exitVisitorMode } = useAuth(); // 🆕
  const [allTransactions, setAllTransactions] = useState([]);
  const [transactionsFiltrees, setTransactionsFiltrees] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOuvert, setModalOuvert] = useState(false);
  const [transactionEdit, setTransactionEdit] = useState(null);
  const [confirmSupprId, setConfirmSupprId] = useState(null);
  const [filtres, setFiltres] = useState({ type: '', date_debut: '', date_fin: '' });
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
  // 🆕 État pour le modal d'action bloquée
  const [actionBlockedModal, setActionBlockedModal] = useState({ isOpen: false, message: null, actionType: 'signup' });
  
  // ✅ États pour les messages
  const [pageMessage, setPageMessage] = useState(null);
  const [modalMessage, setModalMessage] = useState(null);
  
  // ✅ État pour l'abonnement expiré
  const [abonnementExpire, setAbonnementExpire] = useState(false);
  const [abonnementCharge, setAbonnementCharge] = useState(true);

  const isVisitorMode = isVisitor; // 🆕

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ✅ Vérifier le statut de l'abonnement
  const verifierAbonnement = useCallback(async () => {
    if (isVisitorMode) {
      setAbonnementCharge(false);
      return;
    }
    try {
      const response = await api.get('/abonnements/statut/');
      setAbonnementExpire(!response.data.est_actif);
    } catch (error) {
      console.error('Erreur vérification abonnement:', error);
      setAbonnementExpire(true);
    } finally {
      setAbonnementCharge(false);
    }
  }, [isVisitorMode]);

  const filtrerTransactionsParPeriode = useCallback((transactions, dateDebut, dateFin) => {
    if (!dateDebut && !dateFin) return transactions;
    
    return transactions.filter(t => {
      const dateTransaction = new Date(t.date);
      dateTransaction.setHours(0, 0, 0, 0);
      
      if (dateDebut) {
        const debut = new Date(dateDebut);
        debut.setHours(0, 0, 0, 0);
        if (dateTransaction < debut) return false;
      }
      
      if (dateFin) {
        const fin = new Date(dateFin);
        fin.setHours(23, 59, 59, 999);
        if (dateTransaction > fin) return false;
      }
      
      return true;
    });
  }, []);

  // 🆕 Charger les données mock en mode visiteur
  const chargerDonneesMock = useCallback(() => {
    const mockTransactions = [
      { id: 1, type: 'sortie', montant: 25000, date: new Date(2026, 5, 28).toISOString(), description: 'Achat alimentation', categorie_detail: { nom: 'Alimentation', couleur: '#ef4444' } },
      { id: 2, type: 'sortie', montant: 5000, date: new Date(2026, 5, 27).toISOString(), description: 'Transport en commun', categorie_detail: { nom: 'Transport', couleur: '#3b82f6' } },
      { id: 3, type: 'sortie', montant: 15000, date: new Date(2026, 5, 26).toISOString(), description: 'Facture électricité', categorie_detail: { nom: 'Utilités', couleur: '#f59e0b' } },
      { id: 4, type: 'entree', montant: 250000, date: new Date(2026, 5, 25).toISOString(), description: 'Salaire mensuel', categorie_detail: { nom: 'Salaire', couleur: '#10b981' } },
      { id: 5, type: 'sortie', montant: 8000, date: new Date(2026, 5, 24).toISOString(), description: 'Abonnement streaming', categorie_detail: { nom: 'Divertissement', couleur: '#8b5cf6' } },
      { id: 6, type: 'sortie', montant: 35000, date: new Date(2026, 5, 23).toISOString(), description: 'Restaurant', categorie_detail: { nom: 'Restaurant', couleur: '#f97316' } },
      { id: 7, type: 'sortie', montant: 12000, date: new Date(2026, 5, 22).toISOString(), description: 'Achat vêtements', categorie_detail: { nom: 'Habillement', couleur: '#ec4899' } },
    ];
    
    const mockCategories = [
      { id: 1, nom: 'Alimentation', type: 'sortie', couleur: '#ef4444' },
      { id: 2, nom: 'Transport', type: 'sortie', couleur: '#3b82f6' },
      { id: 3, nom: 'Utilités', type: 'sortie', couleur: '#f59e0b' },
      { id: 4, nom: 'Divertissement', type: 'sortie', couleur: '#8b5cf6' },
      { id: 5, nom: 'Salaire', type: 'entree', couleur: '#10b981' },
      { id: 6, nom: 'Restaurant', type: 'sortie', couleur: '#f97316' },
      { id: 7, nom: 'Habillement', type: 'sortie', couleur: '#ec4899' },
    ];
    
    setAllTransactions(mockTransactions);
    setTransactionsFiltrees(mockTransactions);
    setCategories(mockCategories);
    setLoading(false);
    setPageMessage({
      type: 'info',
      text: '🔍 Mode Exploration - Visualisation des données de démonstration. Créez un compte pour vos vraies transactions.'
    });
  }, []);

  const chargerDonnees = useCallback(async () => {
    // 🆕 Si mode visiteur, charger les données mock
    if (isVisitorMode) {
      chargerDonneesMock();
      return;
    }
    
    setLoading(true);
    setPageMessage(null);
    try {
      const params = {};
      if (filtres.type) params.type = filtres.type;

      const [txRes, catRes] = await Promise.all([
        api.get('/transactions/', { params }),
        api.get('/transactions/categories/'),
      ]);

      const transactionsRecues = txRes.data.results || txRes.data;
      setAllTransactions(transactionsRecues);
      
      const transactionsFiltreesParPeriode = filtrerTransactionsParPeriode(
        transactionsRecues,
        filtres.date_debut,
        filtres.date_fin
      );
      setTransactionsFiltrees(transactionsFiltreesParPeriode);
      
      let cats = [];
      if (Array.isArray(catRes.data)) {
        cats = catRes.data;
      } else if (catRes.data?.results) {
        cats = catRes.data.results;
      } else if (catRes.data && typeof catRes.data === 'object') {
        cats = Object.values(catRes.data);
      }
      
      const validCats = cats.filter(c => c && c.id && c.nom && c.nom.trim() !== '');
      setCategories(validCats);
      
    } catch (err) {
      const status = err.response?.status;
      const errorData = err.response?.data;
      
      if (status === 401) {
        setPageMessage({ 
          type: 'error', 
          text: 'Session expirée. Veuillez vous reconnecter.' 
        });
        setTimeout(() => {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          window.location.href = '/connexion';
        }, 2000);
        return;
      }
      
      if (status === 403 && errorData?.error === 'abonnement_expire') {
        setAbonnementExpire(true);
        setPageMessage({ 
          type: 'error', 
          text: 'Votre abonnement a expiré. Vous ne pouvez pas créer de nouvelles transactions.' 
        });
        return;
      }
      
      console.error('Erreur:', err);
      setPageMessage({ 
        type: 'error', 
        text: 'Erreur lors du chargement des données. Veuillez réessayer.' 
      });
    } finally {
      setLoading(false);
    }
  }, [filtres.type, filtrerTransactionsParPeriode, filtres.date_debut, filtres.date_fin, isVisitorMode, chargerDonneesMock]);

  useEffect(() => {
    if (allTransactions.length > 0 && !isVisitorMode) {
      const transactionsFiltreesParPeriode = filtrerTransactionsParPeriode(
        allTransactions,
        filtres.date_debut,
        filtres.date_fin
      );
      setTransactionsFiltrees(transactionsFiltreesParPeriode);
    }
  }, [filtres.date_debut, filtres.date_fin, allTransactions, filtrerTransactionsParPeriode, isVisitorMode]);

  useEffect(() => {
    verifierAbonnement();
    chargerDonnees();
  }, [verifierAbonnement, chargerDonnees]);

  useEffect(() => {
    if (allTransactions.length > 0 && !isVisitorMode) {
      chargerDonnees();
    }
  }, [filtres.type, chargerDonnees, allTransactions.length, isVisitorMode]);

  // 🆕 Fonction pour ouvrir le modal d'action bloquée
  const ouvrirActionBloquee = (actionType = 'signup') => {
    const messages = {
      signup: {
        title: '🔒 Créez un compte',
        message: 'Pour ajouter ou modifier des transactions, créez un compte en 30 secondes.',
        action: 'Créer un compte',
        actionType: 'signup'
      },
      login: {
        title: '🔐 Connectez-vous',
        message: 'Pour accéder à vos transactions, connectez-vous à votre compte.',
        action: 'Se connecter',
        actionType: 'login'
      }
    };
    setActionBlockedModal({
      isOpen: true,
      message: messages[actionType] || messages.signup,
      actionType: actionType
    });
  };

  const ouvrirCreation = () => {
    // 🆕 Si mode visiteur, afficher le modal d'action bloquée
    if (isVisitorMode) {
      ouvrirActionBloquee('signup');
      return;
    }
    if (abonnementExpire) {
      setPageMessage({ 
        type: 'error', 
        text: 'Votre abonnement a expiré. Vous ne pouvez pas créer de nouvelles transactions.' 
      });
      return;
    }
    setTransactionEdit(null);
    setModalOuvert(true);
  };
  
  const ouvrirModification = (t) => {
    // 🆕 Si mode visiteur, afficher le modal d'action bloquée
    if (isVisitorMode) {
      ouvrirActionBloquee('signup');
      return;
    }
    setTransactionEdit(t);
    setModalOuvert(true);
  };
  
  const confirmerSuppression = (id) => {
    // 🆕 Si mode visiteur, afficher le modal d'action bloquée
    if (isVisitorMode) {
      ouvrirActionBloquee('signup');
      return;
    }
    setConfirmSupprId(id);
  };

  const handleSupprimer = async () => {
    try {
      await api.delete(`/transactions/${confirmSupprId}/`);
      setConfirmSupprId(null);
      chargerDonnees();
      setPageMessage({ 
        type: 'success', 
        text: 'Transaction supprimée avec succès.' 
      });
      setTimeout(() => setPageMessage(null), 3000);
    } catch (err) {
      const status = err.response?.status;
      const errorData = err.response?.data;
      
      if (status === 401) {
        setPageMessage({ 
          type: 'error', 
          text: 'Session expirée. Veuillez vous reconnecter.' 
        });
        setTimeout(() => {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          window.location.href = '/connexion';
        }, 2000);
        return;
      }
      
      const msg = errorData?.message || errorData?.detail || 'Erreur lors de la suppression. Veuillez réessayer.';
      setPageMessage({ type: 'error', text: msg });
    }
  };

  // ✅ Gestion de la limite quotidienne
  const handleDailyLimitExceeded = () => {
    setPageMessage({ 
      type: 'warning', 
      text: 'Limite quotidienne atteinte. Revenez demain ou passez à un abonnement payant.' 
    });
  };

  // ✅ Gestion des messages depuis le modal
  const handleModalMessage = (type) => {
    if (type === 'abonnement_expire') {
      setAbonnementExpire(true);
      setPageMessage({ 
        type: 'error', 
        text: 'Votre abonnement a expiré. Veuillez le renouveler pour effectuer cette action.' 
      });
    }
    if (type === 'visitor_mode') {
      ouvrirActionBloquee('signup');
    }
  };

  const transactions = transactionsFiltrees;
  
  const totalEntrees = transactions.filter(t => t.type === 'entree').reduce((s, t) => s + parseFloat(t.montant), 0);
  const totalSorties = transactions.filter(t => t.type === 'sortie').reduce((s, t) => s + parseFloat(t.montant), 0);
  const solde = totalEntrees - totalSorties;

  // ✅ Afficher un loader pendant le chargement
  if (abonnementCharge && !isVisitorMode) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: COLORS.bg,
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 48, height: 48,
            border: `3px solid ${COLORS.primaryBg}`,
            borderTopColor: COLORS.primary,
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 16px',
          }} />
          <p style={{ color: COLORS.textMuted }}>Chargement...</p>
        </div>
      </div>
    );
  }

  // 🆕 Si mode visiteur et que les données ne sont pas encore chargées
  if (isVisitorMode && loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: COLORS.bg,
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 48, height: 48,
            border: `3px solid ${COLORS.primaryBg}`,
            borderTopColor: COLORS.primary,
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 16px',
          }} />
          <p style={{ color: COLORS.textMuted }}>Chargement des données de démonstration...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      maxWidth: 1200, 
      margin: '0 auto', 
      padding: isMobile ? '16px 12px' : '20px 24px', 
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      minHeight: '100vh',
      background: COLORS.bg,
    }}>

      <link rel="stylesheet" href="https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css" />
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Outfit:wght@600;700;800&display=swap" rel="stylesheet" />

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .tx-input:focus {
          border-color: ${COLORS.primary} !important;
          background: #fff !important;
          box-shadow: 0 0 0 4px rgba(0,49,82,0.10) !important;
        }
        .tx-input::placeholder { color: #cbd5e1; }
        .btn-icon { transition: all 0.15s; }
        .btn-icon:hover { transform: translateY(-2px); filter: brightness(1.05); }
        .stat-card { animation: fadeUp 0.4s cubic-bezier(.16,1,.3,1) both; }
        .stat-card:nth-child(2) { animation-delay: 0.07s; }
        .stat-card:nth-child(3) { animation-delay: 0.14s; }
        .btn-new-tx:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(0,49,82,0.32) !important; }
        .btn-new-tx { transition: all 0.2s cubic-bezier(.16,1,.3,1); }
        .transaction-card {
          transition: all 0.2s ease;
        }
        .transaction-card:active {
          transform: scale(0.98);
        }
      `}</style>

      {/* ── MESSAGE PAGE ── */}
      <MessageBanner 
        type={pageMessage?.type} 
        message={pageMessage?.text} 
        onClose={() => setPageMessage(null)}
      />

      {/* 🆕 MODAL ACTION BLOQUÉE */}
      <ActionBlockedModal
        isOpen={actionBlockedModal.isOpen}
        onClose={() => setActionBlockedModal({ isOpen: false, message: null, actionType: 'signup' })}
        message={actionBlockedModal.message}
      />

      {/* ── EN-TÊTE ── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: isMobile ? 20 : 24,
        flexWrap: 'wrap',
        gap: 12,
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <div style={{
              width: isMobile ? 44 : 48,
              height: isMobile ? 44 : 48,
              borderRadius: 14,
              background: isVisitorMode ? `linear-gradient(135deg, ${COLORS.sortieBg}, ${COLORS.sortieAccent})` : `linear-gradient(135deg, ${COLORS.primaryBg}, ${COLORS.primaryBgStrong})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <i className='bx bx-transfer-alt' style={{ fontSize: isMobile ? 22 : 24, color: isVisitorMode ? COLORS.sortie : COLORS.primary }} />
            </div>
            <div>
              <h1 style={{
                margin: 0,
                fontSize: isMobile ? 22 : 26,
                fontWeight: 800,
                color: COLORS.text,
                fontFamily: "'Outfit', sans-serif",
                letterSpacing: '-0.5px',
              }}>
                Transactions {isVisitorMode && <span style={{ fontSize: isMobile ? 12 : 14, background: COLORS.sortieBg, color: COLORS.sortie, padding: '2px 10px', borderRadius: 12, fontWeight: 600 }}>🔍 Démo</span>}
              </h1>
              <p style={{ margin: '4px 0 0', color: COLORS.textMuted, fontSize: isMobile ? 12 : 13 }}>
                {isVisitorMode ? 'Visualisation des données de démonstration' : 'Gérez vos entrées et sorties d\'argent'}
              </p>
            </div>
          </div>
        </div>
        <button 
          onClick={ouvrirCreation} 
          className="btn-new-tx" 
          style={{
            background: (isVisitorMode || abonnementExpire) 
              ? COLORS.disabledBg
              : `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})`,
            color: (isVisitorMode || abonnementExpire) ? COLORS.disabledText : COLORS.white,
            border: 'none',
            borderRadius: 40,
            padding: isMobile ? '10px 20px' : '12px 24px',
            cursor: (isVisitorMode || abonnementExpire) ? 'not-allowed' : 'pointer',
            fontWeight: 700,
            fontSize: isMobile ? 13 : 14,
            boxShadow: (isVisitorMode || abonnementExpire) ? 'none' : '0 4px 14px rgba(0,49,82,0.28)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            whiteSpace: 'nowrap',
            fontFamily: "'DM Sans', sans-serif",
            opacity: (isVisitorMode || abonnementExpire) ? 0.6 : 1,
            minHeight: 44,
          }}
          disabled={isVisitorMode || abonnementExpire}
          title={isVisitorMode ? 'Mode exploration - Créez un compte' : abonnementExpire ? 'Votre abonnement a expiré' : ''}
        >
          <i className='bx bx-plus' style={{ fontSize: isMobile ? 16 : 18 }} />
          {!isMobile && 'Nouvelle '}Transaction
        </button>
      </div>

      {/* ── STATS ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
        gap: isMobile ? 12 : 16,
        marginBottom: isMobile ? 20 : 24,
      }}>
        {[
          { label: 'Total Entrées', val: totalEntrees, color: COLORS.entree, bg: COLORS.entreeBg, icon: 'bx-trending-up', prefix: '+' },
          { label: 'Total Sorties', val: totalSorties, color: COLORS.sortie, bg: COLORS.sortieBg, icon: 'bx-trending-down', prefix: '-' },
          { label: 'Solde', val: solde, color: solde >= 0 ? COLORS.primary : COLORS.sortie, bg: COLORS.primaryBg, icon: 'bx-equalizer', prefix: solde >= 0 ? '+' : '' },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{
            background: COLORS.white,
            borderRadius: 16,
            padding: isMobile ? '14px 16px' : '16px 20px',
            boxShadow: '0 2px 8px rgba(7,25,30,0.04)',
            border: `1px solid ${s.color}20`,
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? 12 : 14,
            opacity: isVisitorMode ? 0.85 : 1,
          }}>
            <div style={{
              width: isMobile ? 44 : 48,
              height: isMobile ? 44 : 48,
              borderRadius: 12,
              background: s.bg,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <i className={`bx ${s.icon}`} style={{ fontSize: isMobile ? 22 : 24, color: s.color }} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: isMobile ? 11 : 12, fontWeight: 700, color: COLORS.textLight, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {s.label}
              </p>
              <p style={{ margin: '4px 0 0', fontWeight: 800, fontSize: isMobile ? 18 : 20, color: s.color, fontFamily: "'Outfit', sans-serif" }}>
                {s.prefix}{s.val.toLocaleString('fr-FR')} MRU
              </p>
              {isVisitorMode && (
                <p style={{ margin: '2px 0 0', fontSize: isMobile ? 8 : 10, color: COLORS.sortie, fontWeight: 500 }}>
                  🔍 Données de démonstration
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── FILTRES ── */}
      <div style={{
        display: 'flex',
        gap: isMobile ? 8 : 12,
        marginBottom: isMobile ? 16 : 20,
        flexWrap: 'wrap',
        alignItems: 'flex-end',
        background: COLORS.white,
        padding: isMobile ? '14px' : '16px 20px',
        borderRadius: 16,
        boxShadow: '0 2px 8px rgba(7,25,30,0.04)',
        border: `1px solid ${COLORS.border}`,
      }}>
        <div style={{ flex: 2, minWidth: isMobile ? '100%' : 140 }}>
          <label style={lblStyle}>
            <i className='bx bx-filter' style={{ fontSize: 11 }} /> Type
          </label>
          <div style={{ position: 'relative' }}>
            <i className='bx bx-transfer' style={iconLeft} />
            <select value={filtres.type}
              onChange={e => setFiltres({ ...filtres, type: e.target.value })}
              className="tx-input"
              style={{ ...sharedInput, background: COLORS.white, cursor: 'pointer', appearance: 'none' }}>
              <option value="">Tous</option>
              <option value="entree">Entrées</option>
              <option value="sortie">Sorties</option>
            </select>
            <i className='bx bx-chevron-down' style={{
              position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
              fontSize: 16, color: COLORS.textLight, pointerEvents: 'none',
            }} />
          </div>
        </div>
        <div style={{ flex: 3, minWidth: isMobile ? '100%' : 160 }}>
          <label style={lblStyle}>
            <i className='bx bx-calendar' style={{ fontSize: 11 }} /> Période
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <i className='bx bx-calendar-minus' style={iconLeft} />
              <input type="date" value={filtres.date_debut}
                onChange={e => setFiltres({ ...filtres, date_debut: e.target.value })}
                className="tx-input"
                style={sharedInput}
                placeholder="Du"
              />
            </div>
            <div style={{ position: 'relative', flex: 1 }}>
              <i className='bx bx-calendar-plus' style={iconLeft} />
              <input type="date" value={filtres.date_fin}
                onChange={e => setFiltres({ ...filtres, date_fin: e.target.value })}
                className="tx-input"
                style={sharedInput}
                placeholder="Au"
              />
            </div>
          </div>
        </div>
        <button onClick={() => setFiltres({ type: '', date_debut: '', date_fin: '' })} style={{
          background: COLORS.bg,
          border: `1.5px solid ${COLORS.border}`,
          borderRadius: 10,
          padding: '10px 16px',
          cursor: 'pointer',
          fontSize: 13,
          color: COLORS.textMuted,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontFamily: "'DM Sans', sans-serif",
          transition: 'all 0.15s',
          whiteSpace: 'nowrap',
          marginTop: isMobile ? 0 : 22,
          minHeight: 44,
        }}>
          <i className='bx bx-reset' style={{ fontSize: 15 }} />
          Réinitialiser
        </button>
      </div>

      {/* ── LISTE DES TRANSACTIONS ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: COLORS.textLight }}>
          <div style={{
            width: 48, height: 48, border: `3px solid ${COLORS.primaryBg}`,
            borderTopColor: COLORS.primary, borderRadius: '50%',
            animation: 'spin 0.8s linear infinite', margin: '0 auto 16px',
          }} />
          <p style={{ fontSize: 14, margin: 0 }}>Chargement des transactions...</p>
        </div>
      ) : transactions.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: isMobile ? '48px 20px' : '64px 32px',
          background: COLORS.white,
          borderRadius: 20,
          border: `1.5px dashed ${COLORS.border}`,
        }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: isVisitorMode ? COLORS.sortieBg : COLORS.primaryBg, 
            display: 'flex',
            alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
          }}>
            <i className='bx bx-transfer-alt' style={{ fontSize: 32, color: isVisitorMode ? COLORS.sortie : COLORS.primary }} />
          </div>
          <h3 style={{ fontSize: isMobile ? 16 : 18, fontWeight: 700, color: COLORS.text, margin: '0 0 8px' }}>
            {filtres.date_debut || filtres.date_fin ? 'Aucune transaction dans cette période' : 'Aucune transaction'}
          </h3>
          <p style={{ fontSize: isMobile ? 13 : 14, color: COLORS.textMuted, margin: '0 0 24px' }}>
            {isVisitorMode 
              ? '🔍 Mode Exploration - Les données de démonstration seront bientôt disponibles'
              : 'Commencez par enregistrer votre première transaction'
            }
          </p>
          {!isVisitorMode && (
            <button 
              onClick={ouvrirCreation} 
              style={{
                background: abonnementExpire 
                  ? COLORS.disabledBg
                  : `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})`,
                color: abonnementExpire ? COLORS.disabledText : COLORS.white,
                border: 'none',
                borderRadius: 40,
                padding: '12px 28px',
                cursor: abonnementExpire ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                fontSize: 14,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                fontFamily: "'DM Sans', sans-serif",
                opacity: abonnementExpire ? 0.6 : 1,
                minHeight: 44,
              }}
              disabled={abonnementExpire}
              title={abonnementExpire ? 'Votre abonnement a expiré' : ''}
            >
              <i className='bx bx-plus' style={{ fontSize: 16 }} />
              Nouvelle transaction
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Version Desktop - Tableau */}
          {!isMobile && (
            <div style={{
              background: COLORS.white,
              borderRadius: 20,
              overflow: 'hidden',
              boxShadow: '0 2px 12px rgba(7,25,30,0.06)',
              border: `1px solid ${COLORS.border}`,
              opacity: isVisitorMode ? 0.9 : 1,
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: isVisitorMode ? `linear-gradient(135deg, ${COLORS.sortieBg}, #FFF0BF)` : `linear-gradient(135deg, ${COLORS.bg}, #EEF2F3)` }}>
                    <th style={{ padding: '14px 18px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: `2px solid ${COLORS.border}` }}>Type</th>
                    <th style={{ padding: '14px 18px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: `2px solid ${COLORS.border}` }}>Montant</th>
                    <th style={{ padding: '14px 18px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: `2px solid ${COLORS.border}` }}>Catégorie</th>
                    <th style={{ padding: '14px 18px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: `2px solid ${COLORS.border}` }}>Date</th>
                    <th style={{ padding: '14px 18px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: `2px solid ${COLORS.border}` }}>Description</th>
                    <th style={{ padding: '14px 18px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: `2px solid ${COLORS.border}` }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t, i) => (
                    <tr key={t.id} style={{
                      borderTop: `1px solid ${COLORS.border}`,
                      background: i % 2 === 0 ? COLORS.white : '#F9FAFB',
                      transition: 'background 0.12s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = isVisitorMode ? COLORS.sortieBg : COLORS.primaryBg}
                    onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? COLORS.white : '#F9FAFB'}>
                      <td style={{ padding: '14px 18px' }}>
                        <TypeBadge type={t.type} />
                      </td>
                      <td style={{ padding: '14px 18px', fontWeight: 800, fontSize: 14, color: t.type === 'entree' ? COLORS.entree : COLORS.sortie, fontFamily: "'Outfit', sans-serif" }}>
                        {t.type === 'entree' ? '+' : '-'}{parseFloat(t.montant).toLocaleString()} MRU
                      </td>
                      <td style={{ padding: '14px 18px', fontSize: 13, color: COLORS.textMuted }}>
                        {t.categorie_detail ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ width: 10, height: 10, borderRadius: '50%', background: t.categorie_detail.couleur || COLORS.primary, display: 'inline-block' }} />
                            {t.categorie_detail.nom}
                          </span>
                        ) : <span style={{ color: COLORS.textLight }}>—</span>}
                      </td>
                      <td style={{ padding: '14px 18px', fontSize: 13, color: COLORS.textMuted }}>
                        {new Date(t.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td style={{ padding: '14px 18px', fontSize: 13, color: COLORS.textMuted, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {t.description || <span style={{ color: COLORS.textLight }}>—</span>}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => ouvrirModification(t)} className="btn-icon" style={{
                            background: isVisitorMode ? COLORS.sortieBg : COLORS.primaryBg,
                            color: isVisitorMode ? COLORS.sortie : COLORS.primary,
                            border: 'none',
                            borderRadius: 8,
                            padding: '8px 12px',
                            cursor: isVisitorMode ? 'not-allowed' : 'pointer',
                            fontSize: 12,
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            fontFamily: "'DM Sans', sans-serif",
                            opacity: isVisitorMode ? 0.6 : 1,
                            minHeight: 32,
                          }}
                          disabled={isVisitorMode}
                          title={isVisitorMode ? 'Mode exploration - Créez un compte' : ''}>
                            <i className='bx bx-edit' style={{ fontSize: 13 }} /> Modifier
                          </button>
                          <button onClick={() => confirmerSuppression(t.id)} className="btn-icon" style={{
                            background: isVisitorMode ? COLORS.sortieBg : COLORS.errorBg,
                            color: isVisitorMode ? COLORS.sortie : COLORS.error,
                            border: 'none',
                            borderRadius: 8,
                            padding: '8px 12px',
                            cursor: isVisitorMode ? 'not-allowed' : 'pointer',
                            fontSize: 12,
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            fontFamily: "'DM Sans', sans-serif",
                            opacity: isVisitorMode ? 0.6 : 1,
                            minHeight: 32,
                          }}
                          disabled={isVisitorMode}
                          title={isVisitorMode ? 'Mode exploration - Créez un compte' : ''}>
                            <i className='bx bx-trash' style={{ fontSize: 13 }} /> Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {isVisitorMode && (
                <div style={{
                  padding: '12px 20px',
                  textAlign: 'center',
                  background: COLORS.sortieBg,
                  borderTop: `1px solid ${COLORS.sortieAccent}66`,
                  fontSize: isMobile ? 11 : 13,
                  color: COLORS.sortie,
                  fontWeight: 500,
                }}>
                  🔍 Données de démonstration - Créez un compte pour gérer vos vraies transactions
                </div>
              )}
            </div>
          )}

          {/* Version Mobile - Cartes */}
          {isMobile && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {transactions.map(t => (
                <div key={t.id} className="transaction-card" style={{
                  background: COLORS.white,
                  borderRadius: 16,
                  padding: 16,
                  boxShadow: '0 2px 8px rgba(7,25,30,0.06)',
                  border: `1px solid ${COLORS.border}`,
                  opacity: isVisitorMode ? 0.9 : 1,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <TypeBadge type={t.type} />
                    <span style={{
                      fontWeight: 800,
                      fontSize: 18,
                      color: t.type === 'entree' ? COLORS.entree : COLORS.sortie,
                      fontFamily: "'Outfit', sans-serif",
                    }}>
                      {t.type === 'entree' ? '+' : '-'}{parseFloat(t.montant).toLocaleString()} MRU
                    </span>
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                      <i className='bx bx-calendar' style={{ fontSize: 14, color: COLORS.textLight }} />
                      <span style={{ fontSize: 12, color: COLORS.textMuted }}>
                        {new Date(t.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </span>
                    </div>

                    {t.categorie_detail && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: t.categorie_detail.couleur || COLORS.primary }} />
                        <span style={{ fontSize: 13, color: COLORS.text, fontWeight: 500 }}>
                          {t.categorie_detail.nom}
                        </span>
                      </div>
                    )}

                    {t.description && (
                      <div style={{ background: COLORS.bg, borderRadius: 10, padding: 10, marginTop: 8 }}>
                        <p style={{ margin: 0, fontSize: 12, color: COLORS.textMuted, lineHeight: 1.4 }}>
                          {t.description}
                        </p>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 10, borderTop: `1px solid ${COLORS.border}`, paddingTop: 12, marginTop: 4 }}>
                    <button onClick={() => ouvrirModification(t)} style={{
                      flex: 1,
                      background: isVisitorMode ? COLORS.sortieBg : COLORS.primaryBg,
                      color: isVisitorMode ? COLORS.sortie : COLORS.primary,
                      border: 'none',
                      borderRadius: 10,
                      padding: '11px',
                      cursor: isVisitorMode ? 'not-allowed' : 'pointer',
                      fontWeight: 600,
                      fontSize: 13,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      fontFamily: "'DM Sans', sans-serif",
                      opacity: isVisitorMode ? 0.6 : 1,
                      minHeight: 44,
                    }}
                    disabled={isVisitorMode}
                    title={isVisitorMode ? 'Mode exploration - Créez un compte' : ''}>
                      <i className='bx bx-edit' style={{ fontSize: 14 }} /> Modifier
                    </button>
                    <button onClick={() => confirmerSuppression(t.id)} style={{
                      flex: 1,
                      background: isVisitorMode ? COLORS.sortieBg : COLORS.errorBg,
                      color: isVisitorMode ? COLORS.sortie : COLORS.error,
                      border: 'none',
                      borderRadius: 10,
                      padding: '11px',
                      cursor: isVisitorMode ? 'not-allowed' : 'pointer',
                      fontWeight: 600,
                      fontSize: 13,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      fontFamily: "'DM Sans', sans-serif",
                      opacity: isVisitorMode ? 0.6 : 1,
                      minHeight: 44,
                    }}
                    disabled={isVisitorMode}
                    title={isVisitorMode ? 'Mode exploration - Créez un compte' : ''}>
                      <i className='bx bx-trash' style={{ fontSize: 14 }} /> Supprimer
                    </button>
                  </div>
                </div>
              ))}
              {isVisitorMode && (
                <div style={{
                  padding: '12px 16px',
                  textAlign: 'center',
                  background: COLORS.sortieBg,
                  borderRadius: 12,
                  fontSize: 12,
                  color: COLORS.sortie,
                  fontWeight: 500,
                  border: `1px solid ${COLORS.sortieAccent}66`,
                }}>
                  🔍 Données de démonstration - Créez un compte pour vos vraies transactions
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div style={{
            marginTop: 20,
            padding: '16px 20px',
            textAlign: 'center',
            background: COLORS.white,
            borderRadius: 14,
            border: `1px solid ${COLORS.border}`,
          }}>
            <p style={{ margin: 0, fontSize: 13, color: COLORS.textMuted }}>
              {transactions.length} transaction(s) affichée(s)
              {isVisitorMode && ' (données de démonstration)'}
              {(filtres.date_debut || filtres.date_fin) && (
                <span style={{ display: 'block', marginTop: 4, fontSize: 12, color: COLORS.primary }}>
                  {filtres.date_debut && `Du ${new Date(filtres.date_debut).toLocaleDateString('fr-FR')}`}
                  {filtres.date_debut && filtres.date_fin && ' au '}
                  {filtres.date_fin && `${new Date(filtres.date_fin).toLocaleDateString('fr-FR')}`}
                </span>
              )}
            </p>
            <button 
              onClick={() => navigate('/toutes-transactions')}
              style={{
                marginTop: 12,
                background: 'transparent',
                color: COLORS.primary,
                border: `1.5px solid ${COLORS.primary}`,
                borderRadius: 40,
                padding: '10px 20px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 13,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                fontFamily: "'DM Sans', sans-serif",
                transition: 'all 0.2s',
                minHeight: 44,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = COLORS.primary;
                e.currentTarget.style.color = COLORS.white;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = COLORS.primary;
              }}
            >
              <i className='bx bx-history' style={{ fontSize: 14 }} />
              Voir toutes les transactions
            </button>
          </div>
        </>
      )}

      {/* ── MODAL TRANSACTION ── */}
      {modalOuvert && (
        <TransactionModal
          transaction={transactionEdit}
          categories={categories}
          isVisitorMode={isVisitorMode}
          onClose={() => { setModalOuvert(false); setTransactionEdit(null); }}
          onSuccess={() => { setModalOuvert(false); setTransactionEdit(null); chargerDonnees(); }}
          onMessage={handleModalMessage}
        />
      )}

      {/* ── CONFIRMATION SUPPRESSION ── */}
      {confirmSupprId && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          background: 'rgba(7,25,30,0.62)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
        }}>
          <div style={{
            background: COLORS.white,
            borderRadius: 24,
            padding: isMobile ? '24px 20px' : '32px 28px',
            width: '100%',
            maxWidth: 360,
            textAlign: 'center',
            boxShadow: '0 32px 64px rgba(7,25,30,0.26)',
            animation: 'modalIn 0.3s cubic-bezier(.16,1,.3,1)',
          }}>
            <div style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: COLORS.errorBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <i className='bx bx-trash' style={{ fontSize: 28, color: COLORS.error }} />
            </div>
            <h3 style={{ margin: '0 0 8px', color: COLORS.text, fontWeight: 800, fontFamily: "'Outfit', sans-serif", fontSize: 18 }}>
              Supprimer cette transaction ?
            </h3>
            <p style={{ margin: '0 0 24px', color: COLORS.textMuted, fontSize: 13, lineHeight: 1.5 }}>
              Cette action est irréversible. Êtes-vous sûr de vouloir continuer ?
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={handleSupprimer} style={{
                flex: 1,
                background: `linear-gradient(135deg, ${COLORS.error}, #C53030)`,
                color: COLORS.white,
                border: 'none',
                borderRadius: 12,
                padding: '12px',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: 14,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                fontFamily: "'DM Sans', sans-serif",
                boxShadow: `0 4px 12px ${COLORS.error}4D`,
                minHeight: 44,
              }}>
                <i className='bx bx-trash' style={{ fontSize: 15 }} /> Oui, supprimer
              </button>
              <button onClick={() => setConfirmSupprId(null)} style={{
                flex: 1,
                background: COLORS.bg,
                border: `1.5px solid ${COLORS.border}`,
                borderRadius: 12,
                padding: '12px',
                cursor: 'pointer',
                color: COLORS.textMuted,
                fontWeight: 600,
                fontSize: 14,
                fontFamily: "'DM Sans', sans-serif",
                minHeight: 44,
              }}>
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}