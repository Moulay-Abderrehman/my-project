import React, { useEffect, useState, useCallback } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';

// ── SHARED STYLE CONSTANTS ────────────────────────────────────────────────────

const COLORS = {
  entree: '#10b981',
  sortie: '#ef4444',
  primary: '#6366f1',
  primaryDark: '#4f46e5',
  text: '#0f172a',
  textMuted: '#64748b',
  textLight: '#94a3b8',
  border: '#e2e8f0',
  bg: '#f8fafc',
  white: '#ffffff',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
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
      background: '#ecfdf5',
      border: '1px solid #6ee7b7',
      color: '#065f46',
      icon: 'bx-check-circle',
    },
    error: {
      background: '#fef2f2',
      border: '1px solid #fca5a5',
      color: '#991b1b',
      icon: 'bx-error-circle',
    },
    warning: {
      background: '#fffbeb',
      border: '1px solid #fcd34d',
      color: '#92400e',
      icon: 'bx-error',
    },
    info: {
      background: '#eff6ff',
      border: '1px solid #93c5fd',
      color: '#1e40af',
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
      border: `1px solid ${style.border}`,
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
            padding: '0 4px',
            opacity: 0.6,
            transition: 'opacity 0.2s',
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
      background: isEntree ? '#ecfdf5' : '#fef2f2',
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
  onMessage 
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
      background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }} onClick={onClose}>
      <div style={{
        background: COLORS.white,
        borderRadius: 20, padding: '28px 24px',
        width: '100%', maxWidth: 460,
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 32px 80px rgba(0,0,0,0.22)',
        animation: 'modalIn 0.3s cubic-bezier(.16,1,.3,1)',
      }} onClick={e => e.stopPropagation()}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: isEdit ? '#fef9c3' : '#ede9fe',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <i className={isEdit ? 'bx bx-edit' : 'bx bx-plus'} style={{
                fontSize: 18,
                color: isEdit ? '#ca8a04' : COLORS.primary,
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
                background: '#fff7ed', border: '1.5px solid #fed7aa',
                color: '#c2410c', fontSize: 13,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <i className='bx bx-error' style={{ fontSize: 16, color: '#f97316' }} />
                {categories.length === 0 ? 'Aucune catégorie disponible.' : `Aucune catégorie pour le type "${form.type === 'entree' ? 'Entrée' : 'Sortie'}"`}
                {categories.length === 0 && (
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
                  style={{ ...sharedInput, background: COLORS.white, cursor: 'pointer', appearance: 'none' }}>
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
            />
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button type="submit" disabled={loading} style={{
              flex: 2,
              background: `linear-gradient(135deg, ${typeColor}, ${typeColor}cc)`,
              color: COLORS.white, border: 'none', borderRadius: 11, padding: '12px',
              cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 14,
              opacity: loading ? 0.75 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              fontFamily: "'DM Sans', sans-serif",
              boxShadow: `0 4px 14px ${typeColor}33`,
              transition: 'all 0.2s',
            }}>
              {loading
                ? <><span style={spinnerStyle} /> En cours...</>
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
  const [allTransactions, setAllTransactions] = useState([]);
  const [transactionsFiltrees, setTransactionsFiltrees] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOuvert, setModalOuvert] = useState(false);
  const [transactionEdit, setTransactionEdit] = useState(null);
  const [confirmSupprId, setConfirmSupprId] = useState(null);
  const [filtres, setFiltres] = useState({ type: '', date_debut: '', date_fin: '' });
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
  // ✅ États pour les messages
  const [pageMessage, setPageMessage] = useState(null);
  const [modalMessage, setModalMessage] = useState(null);
  
  // ✅ État pour l'abonnement expiré
  const [abonnementExpire, setAbonnementExpire] = useState(false);
  const [abonnementCharge, setAbonnementCharge] = useState(true);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ✅ Vérifier le statut de l'abonnement
  const verifierAbonnement = useCallback(async () => {
    try {
      const response = await api.get('/abonnements/statut/');
      setAbonnementExpire(!response.data.est_actif);
    } catch (error) {
      console.error('Erreur vérification abonnement:', error);
      setAbonnementExpire(true);
    } finally {
      setAbonnementCharge(false);
    }
  }, []);

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

  const chargerDonnees = useCallback(async () => {
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
  }, [filtres.type, filtrerTransactionsParPeriode, filtres.date_debut, filtres.date_fin]);

  useEffect(() => {
    if (allTransactions.length > 0) {
      const transactionsFiltreesParPeriode = filtrerTransactionsParPeriode(
        allTransactions,
        filtres.date_debut,
        filtres.date_fin
      );
      setTransactionsFiltrees(transactionsFiltreesParPeriode);
    }
  }, [filtres.date_debut, filtres.date_fin, allTransactions, filtrerTransactionsParPeriode]);

  useEffect(() => {
    verifierAbonnement();
    chargerDonnees();
  }, [verifierAbonnement, chargerDonnees]);

  useEffect(() => {
    if (allTransactions.length > 0) {
      chargerDonnees();
    }
  }, [filtres.type, chargerDonnees, allTransactions.length]);

  const ouvrirCreation = () => {
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
    setTransactionEdit(t);
    setModalOuvert(true);
  };
  
  const confirmerSuppression = (id) => setConfirmSupprId(id);

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
  };

  const transactions = transactionsFiltrees;
  
  const totalEntrees = transactions.filter(t => t.type === 'entree').reduce((s, t) => s + parseFloat(t.montant), 0);
  const totalSorties = transactions.filter(t => t.type === 'sortie').reduce((s, t) => s + parseFloat(t.montant), 0);
  const solde = totalEntrees - totalSorties;

  // ✅ Afficher un loader pendant le chargement
  if (abonnementCharge) {
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
            border: '3px solid #ede9fe',
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
          border-color: #6366f1 !important;
          background: #fff !important;
          box-shadow: 0 0 0 4px rgba(99,102,241,0.1) !important;
        }
        .tx-input::placeholder { color: #cbd5e1; }
        .btn-icon { transition: all 0.15s; }
        .btn-icon:hover { transform: translateY(-2px); filter: brightness(1.05); }
        .stat-card { animation: fadeUp 0.4s cubic-bezier(.16,1,.3,1) both; }
        .stat-card:nth-child(2) { animation-delay: 0.07s; }
        .stat-card:nth-child(3) { animation-delay: 0.14s; }
        .btn-new-tx:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(99,102,241,0.4) !important; }
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
              background: 'linear-gradient(135deg, #ede9fe, #c4b5fd)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <i className='bx bx-transfer-alt' style={{ fontSize: isMobile ? 22 : 24, color: COLORS.primary }} />
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
                Transactions
              </h1>
              <p style={{ margin: '4px 0 0', color: COLORS.textMuted, fontSize: isMobile ? 12 : 13 }}>
                Gérez vos entrées et sorties d'argent
              </p>
            </div>
          </div>
        </div>
        <button 
          onClick={ouvrirCreation} 
          className="btn-new-tx" 
          style={{
            background: abonnementExpire 
              ? '#e2e8f0' 
              : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: abonnementExpire ? '#94a3b8' : COLORS.white,
            border: 'none',
            borderRadius: 40,
            padding: isMobile ? '10px 20px' : '12px 24px',
            cursor: abonnementExpire ? 'not-allowed' : 'pointer',
            fontWeight: 700,
            fontSize: isMobile ? 13 : 14,
            boxShadow: abonnementExpire ? 'none' : '0 4px 14px rgba(99,102,241,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            whiteSpace: 'nowrap',
            fontFamily: "'DM Sans', sans-serif",
            opacity: abonnementExpire ? 0.6 : 1,
          }}
          disabled={abonnementExpire}
          title={abonnementExpire ? 'Votre abonnement a expiré' : ''}
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
          { label: 'Total Entrées', val: totalEntrees, color: COLORS.entree, bg: '#ecfdf5', icon: 'bx-trending-up', prefix: '+' },
          { label: 'Total Sorties', val: totalSorties, color: COLORS.sortie, bg: '#fef2f2', icon: 'bx-trending-down', prefix: '-' },
          { label: 'Solde', val: solde, color: solde >= 0 ? COLORS.primary : COLORS.sortie, bg: '#ede9fe', icon: 'bx-equalizer', prefix: solde >= 0 ? '+' : '' },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{
            background: COLORS.white,
            borderRadius: 16,
            padding: isMobile ? '14px 16px' : '16px 20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            border: `1px solid ${s.color}20`,
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? 12 : 14,
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
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
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
        }}>
          <i className='bx bx-reset' style={{ fontSize: 15 }} />
          Réinitialiser
        </button>
      </div>

      {/* ── LISTE DES TRANSACTIONS ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: COLORS.textLight }}>
          <div style={{
            width: 48, height: 48, border: '3px solid #ede9fe',
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
            background: '#ede9fe', display: 'flex',
            alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
          }}>
            <i className='bx bx-transfer-alt' style={{ fontSize: 32, color: COLORS.primary }} />
          </div>
          <h3 style={{ fontSize: isMobile ? 16 : 18, fontWeight: 700, color: COLORS.text, margin: '0 0 8px' }}>
            {filtres.date_debut || filtres.date_fin ? 'Aucune transaction dans cette période' : 'Aucune transaction'}
          </h3>
          <p style={{ fontSize: isMobile ? 13 : 14, color: COLORS.textMuted, margin: '0 0 24px' }}>
            {filtres.date_debut || filtres.date_fin ? 'Ajustez les dates de filtrage' : 'Commencez par enregistrer votre première transaction'}
          </p>
          <button 
            onClick={ouvrirCreation} 
            style={{
              background: abonnementExpire 
                ? '#e2e8f0' 
                : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: abonnementExpire ? '#94a3b8' : COLORS.white,
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
            }}
            disabled={abonnementExpire}
            title={abonnementExpire ? 'Votre abonnement a expiré' : ''}
          >
            <i className='bx bx-plus' style={{ fontSize: 16 }} />
            Nouvelle transaction
          </button>
        </div>
      ) : (
        <>
          {/* Version Desktop - Tableau */}
          {!isMobile && (
            <div style={{
              background: COLORS.white,
              borderRadius: 20,
              overflow: 'hidden',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              border: `1px solid ${COLORS.border}`,
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)' }}>
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
                      background: i % 2 === 0 ? COLORS.white : '#fbfaff',
                      transition: 'background 0.12s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f5f3ff'}
                    onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? COLORS.white : '#fbfaff'}>
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
                            background: '#ede9fe',
                            color: COLORS.primary,
                            border: 'none',
                            borderRadius: 8,
                            padding: '6px 12px',
                            cursor: 'pointer',
                            fontSize: 12,
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            fontFamily: "'DM Sans', sans-serif",
                          }}>
                            <i className='bx bx-edit' style={{ fontSize: 13 }} /> Modifier
                          </button>
                          <button onClick={() => confirmerSuppression(t.id)} className="btn-icon" style={{
                            background: '#fef2f2',
                            color: COLORS.sortie,
                            border: 'none',
                            borderRadius: 8,
                            padding: '6px 12px',
                            cursor: 'pointer',
                            fontSize: 12,
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            fontFamily: "'DM Sans', sans-serif",
                          }}>
                            <i className='bx bx-trash' style={{ fontSize: 13 }} /> Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  border: `1px solid ${COLORS.border}`,
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
                      background: '#ede9fe',
                      color: COLORS.primary,
                      border: 'none',
                      borderRadius: 10,
                      padding: '10px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: 13,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      fontFamily: "'DM Sans', sans-serif",
                    }}>
                      <i className='bx bx-edit' style={{ fontSize: 14 }} /> Modifier
                    </button>
                    <button onClick={() => confirmerSuppression(t.id)} style={{
                      flex: 1,
                      background: '#fef2f2',
                      color: COLORS.sortie,
                      border: 'none',
                      borderRadius: 10,
                      padding: '10px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: 13,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      fontFamily: "'DM Sans', sans-serif",
                    }}>
                      <i className='bx bx-trash' style={{ fontSize: 14 }} /> Supprimer
                    </button>
                  </div>
                </div>
              ))}
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
                padding: '8px 20px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 13,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                fontFamily: "'DM Sans', sans-serif",
                transition: 'all 0.2s',
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
          background: 'rgba(15,23,42,0.6)',
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
            boxShadow: '0 32px 64px rgba(0,0,0,0.25)',
            animation: 'modalIn 0.3s cubic-bezier(.16,1,.3,1)',
          }}>
            <div style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: '#fef2f2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <i className='bx bx-trash' style={{ fontSize: 28, color: COLORS.sortie }} />
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
                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
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
                boxShadow: '0 4px 12px rgba(239,68,68,0.3)',
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