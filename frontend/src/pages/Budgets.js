import React, { useEffect, useState, useCallback } from 'react';
import api from '../api/axios';
import { categorieService } from '../api/categorieService';
import { useNavigate } from 'react-router-dom';

// ── Gestion des limites de l'abonnement d'essai (2 actions / jour) ────────────
const BUDGET_DAILY_LIMIT = 2;
const DEPENSE_DAILY_LIMIT = 2;
const BUDGET_COUNT_KEY = 'financeapp_budgets_crees_par_jour';
const DEPENSE_COUNT_KEY = 'financeapp_depenses_par_jour';

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getDailyCount(storageKey) {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return 0;
    const data = JSON.parse(raw);
    if (data.date !== getTodayKey()) return 0;
    return data.count || 0;
  } catch {
    return 0;
  }
}

function incrementDailyCount(storageKey) {
  const today = getTodayKey();
  let data = { date: today, count: 0 };
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.date === today) data = parsed;
    }
  } catch {
    // stockage illisible : on repart de zéro sans bloquer l'utilisateur
  }
  data.count += 1;
  try {
    localStorage.setItem(storageKey, JSON.stringify(data));
  } catch {
    // stockage indisponible : on ignore silencieusement
  }
  return data.count;
}

// ── COMPOSANT DE MESSAGE BANNIERE ──────────────────────────────────────────────
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

// ── MODALE SUCCÈS ─────────────────────────────────────────────────────────────
function SuccessModal({ message, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 2000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className="modal-overlay">
      <div className="success-modal">
        <i className='bx bx-check-circle'></i>
        <p>{message}</p>
      </div>
    </div>
  );
}

// ── MODALE LIMITE ─────────────────────────────────────────────────────────────
function LimitModal({ message, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container limit-confirm compact" onClick={e => e.stopPropagation()}>
        <div className="limit-icon">
          <i className='bx bx-lock-alt'></i>
        </div>
        <h3>Limite quotidienne atteinte</h3>
        <p>{message}</p>
        <div className="modal-actions compact">
          <button onClick={onClose} className="btn-primary">
            <i className='bx bx-check'></i> OK
          </button>
        </div>
      </div>
    </div>
  );
}

// ── MODALE DÉPENSE BUDGET ─────────────────────────────────────────────────────
function DepenseModal({ budget, onClose, onSuccess, canSubmit, onLimitReached, onMessage }) {
  const [montant, setMontant] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (canSubmit === false) {
      onLimitReached();
      return;
    }

    const montantValue = parseFloat(montant);
    if (isNaN(montantValue) || montantValue <= 0) {
      setMessage({ type: 'error', text: 'Veuillez entrer un montant valide.' });
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const response = await api.post(`/budgets/${budget.id}/depense/`, {
        montant: montantValue,
        description: description.trim() || ''
      });
      
      if (response.data) {
        incrementDailyCount(DEPENSE_COUNT_KEY);
        if (onMessage) onMessage('success', 'Dépense enregistrée avec succès !');
        onSuccess('Dépense enregistrée !');
      }
    } catch (err) {
      const errorData = err.response?.data;
      const status = err.response?.status;
      
      if (status === 403) {
        if (errorData?.error === 'abonnement_expire') {
          setMessage({ 
            type: 'error', 
            text: 'Votre abonnement a expiré. Veuillez le renouveler pour ajouter des dépenses.' 
          });
          if (onMessage) onMessage('error', 'Votre abonnement a expiré.');
          return;
        }
        if (errorData?.error === 'abonnement_requis') {
          setMessage({ 
            type: 'error', 
            text: 'Vous devez avoir un abonnement actif pour ajouter des dépenses.' 
          });
          return;
        }
        if (errorData?.error === 'limite_essai') {
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
      
      const msg = errorData?.message || errorData?.detail || 'Erreur lors de l\'enregistrement.';
      setMessage({ type: 'error', text: msg });
    } finally {
      setLoading(false);
    }
  };

  const reste = parseFloat(budget.montant_prevu) - parseFloat(budget.montant_depense);
  const isDepasse = reste < 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container compact" onClick={e => e.stopPropagation()}>
        <div className="modal-header compact">
          <div className="modal-header-icon" style={{ background: '#ef444415', color: '#ef4444' }}>
            <i className='bx bx-money'></i>
          </div>
          <div>
            <h3>Nouvelle dépense de budget</h3>
            <p>{budget.categorie_nom}</p>
          </div>
          <button onClick={onClose} className="modal-close">
            <i className='bx bx-x'></i>
          </button>
        </div>

        {message && (
          <MessageBanner 
            type={message.type} 
            message={message.text} 
            onClose={() => setMessage(null)}
          />
        )}

        <div className="budget-info-row compact">
          <div className="budget-info-item">
            <span className="info-label">Budget restant</span>
            <span className="info-value" style={{ color: isDepasse ? '#ef4444' : '#10b981' }}>
              {Math.abs(reste).toLocaleString()} MRU {isDepasse ? '(dépassé)' : ''}
            </span>
          </div>
          <div className="budget-info-item">
            <span className="info-label">Budget total</span>
            <span className="info-value">{parseFloat(budget.montant_prevu).toLocaleString()} MRU</span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group compact">
            <div className="input-with-icon">
              <i className='bx bx-pound'></i>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={montant}
                onChange={e => setMontant(e.target.value)}
                placeholder="Montant de la dépense"
                required
                autoFocus
              />
            </div>
          </div>

          <div className="form-group compact">
            <div className="input-with-icon">
              <i className='bx bx-note'></i>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Description (optionnel)"
                maxLength="200"
              />
            </div>
          </div>

          <div className="modal-actions compact">
            <button 
              type="submit" 
              disabled={loading || !montant} 
              className="btn-primary" 
              style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)' }}
            >
              {loading ? (
                <><div className="spinner"></div> Enregistrement...</>
              ) : (
                <><i className='bx bx-check'></i> Enregistrer la dépense</>
              )}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary" disabled={loading}>
              Annuler
            </button>
          </div>
        </form>

        <div className="info-banner compact" style={{ marginTop: '12px', background: '#f0fdf4', borderColor: '#bbf7d0', borderRadius: 10, padding: 8, fontSize: 11, color: '#166534' }}>
          <i className='bx bx-info-circle'></i>
          <span>Cette dépense est propre à ce budget et n'affecte pas vos transactions manuelles.</span>
        </div>

        {isDepasse && (
          <div className="warning-banner compact" style={{ marginTop: '12px', background: '#fef2f2', borderColor: '#fecaca' }}>
            <i className='bx bx-error-circle' style={{ color: '#ef4444' }}></i>
            <span style={{ color: '#dc2626', fontSize: '0.7rem' }}>Attention : Budget déjà dépassé !</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── MODALE DÉPENSES D'UN BUDGET ─────────────────────────────────────────────
function BudgetDepensesModal({ budget, onClose }) {
  const [depenses, setDepenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/budgets/${budget.id}/depenses/`)
      .then(res => setDepenses(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [budget.id]);

  const couleur = budget.couleur || '#6366f1';
  const reste = parseFloat(budget.montant_prevu) - parseFloat(budget.montant_depense);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container large" onClick={e => e.stopPropagation()}>
        <div className="modal-header" style={{ borderBottomColor: couleur }}>
          <div className="modal-header-icon" style={{ background: `${couleur}15`, color: couleur }}>
            <i className='bx bx-list-ul'></i>
          </div>
          <div>
            <h3>{budget.categorie_nom}</h3>
            <p>Dépenses du budget (indépendantes des transactions)</p>
          </div>
          <button onClick={onClose} className="modal-close">
            <i className='bx bx-x'></i>
          </button>
        </div>

        <div className="stats-row compact">
          <div className="stat-card-mini">
            <i className='bx bx-target-lock' style={{ color: '#1e293b' }}></i>
            <div>
              <span className="stat-mini-label">Prévu</span>
              <span className="stat-mini-value">{parseFloat(budget.montant_prevu).toLocaleString()} MRU</span>
            </div>
          </div>
          <div className="stat-card-mini">
            <i className='bx bx-trending-down' style={{ color: couleur }}></i>
            <div>
              <span className="stat-mini-label">Dépensé (budget)</span>
              <span className="stat-mini-value">{parseFloat(budget.montant_depense).toLocaleString()} MRU</span>
            </div>
          </div>
          <div className="stat-card-mini">
            <i className='bx bx-wallet' style={{ color: '#10b981' }}></i>
            <div>
              <span className="stat-mini-label">Reste</span>
              <span className="stat-mini-value">{reste.toLocaleString()} MRU</span>
            </div>
          </div>
        </div>

        <div className="transactions-list">
          <div className="transactions-header">
            <i className='bx bx-history'></i>
            <span>Historique des dépenses du budget</span>
          </div>
          
          {loading ? (
            <div className="loading-state">
              <div className="spinner large"></div>
              <p>Chargement...</p>
            </div>
          ) : depenses.length === 0 ? (
            <div className="empty-transactions compact">
              <i className='bx bx-receipt'></i>
              <p>Aucune dépense enregistrée pour ce budget</p>
              <span>Cliquez sur "Dépenser" pour ajouter une dépense</span>
            </div>
          ) : (
            depenses.map(d => (
              <div key={d.id} className="transaction-row compact">
                <div className="transaction-icon">
                  <i className='bx bx-shopping-bag'></i>
                </div>
                <div className="transaction-info">
                  <div className="transaction-desc">{d.description || 'Dépense budget'}</div>
                  <div className="transaction-date">
                    <i className='bx bx-calendar'></i>
                    {new Date(d.date_creation).toLocaleDateString('fr-FR', { 
                      day: '2-digit', 
                      month: 'short', 
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
                <div className="transaction-amount negative">
                  -{parseFloat(d.montant).toLocaleString()} MRU
                </div>
              </div>
            ))
          )}
        </div>

        <div className="info-banner compact" style={{ 
          marginTop: 16, 
          background: '#eff6ff', 
          borderColor: '#bfdbfe', 
          borderRadius: 10, 
          padding: 10, 
          fontSize: 11, 
          color: '#1e40af',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <i className='bx bx-info-circle'></i>
          <span>Les dépenses affichées sont uniquement celles effectuées depuis ce budget. Les transactions manuelles ne sont pas prises en compte.</span>
        </div>
      </div>
    </div>
  );
}

// ── MODALE CRÉATION/MODIFICATION BUDGET ─────────────────────────────────────
function BudgetModal({ budget, categories, onClose, onSuccess, canCreate, onLimitReached, onMessage }) {
  const [form, setForm] = useState({
    categorie: budget?.categorie || '',
    montant_prevu: budget?.montant_prevu || '',
    date_debut: budget?.date_debut || '',
    date_fin: budget?.date_fin || '',
    couleur: budget?.couleur || '#6366f1',
  });
  const [loading, setLoading] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [message, setMessage] = useState(null);

  const isEdit = !!budget;

  const categoriesSortie = categories.filter(cat => cat.type === 'sortie' || cat.type === 'depense' || cat.type === 'expense');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isEdit && canCreate === false) {
      onLimitReached();
      return;
    }
    
    if (!form.categorie) {
      setMessage({ type: 'error', text: 'Veuillez sélectionner une catégorie.' });
      return;
    }
    if (!form.montant_prevu || parseFloat(form.montant_prevu) <= 0) {
      setMessage({ type: 'error', text: 'Le montant doit être supérieur à 0.' });
      return;
    }
    if (!form.date_debut || !form.date_fin) {
      setMessage({ type: 'error', text: 'Veuillez sélectionner une période.' });
      return;
    }
    if (new Date(form.date_fin) <= new Date(form.date_debut)) {
      setMessage({ type: 'error', text: 'La date de fin doit être postérieure à la date de début.' });
      return;
    }
    
    setLoading(true);
    setMessage(null);
    try {
      if (isEdit) {
        await api.patch(`/budgets/${budget.id}/`, form);
        if (onMessage) onMessage('success', 'Budget modifié avec succès !');
        onSuccess();
      } else {
        await api.post('/budgets/', form);
        incrementDailyCount(BUDGET_COUNT_KEY);
        if (onMessage) onMessage('success', 'Budget créé avec succès !');
        onSuccess();
      }
    } catch (err) {
      const errorData = err.response?.data;
      const status = err.response?.status;
      
      if (status === 403) {
        if (errorData?.error === 'abonnement_expire') {
          setMessage({ 
            type: 'error', 
            text: 'Votre abonnement a expiré. Veuillez le renouveler pour créer/modifier des budgets.' 
          });
          if (onMessage) onMessage('error', 'Votre abonnement a expiré.');
          return;
        }
        if (errorData?.error === 'abonnement_requis') {
          setMessage({ 
            type: 'error', 
            text: 'Vous devez avoir un abonnement actif pour créer/modifier des budgets.' 
          });
          return;
        }
        if (errorData?.error === 'limite_essai') {
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
      
      const msg = errorData?.detail || errorData?.non_field_errors?.[0] || 'Erreur lors de l\'opération.';
      setMessage({ type: 'error', text: msg });
    } finally {
      setLoading(false);
    }
  };

  const COULEURS = ['#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6', '#64748b'];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container compact" onClick={e => e.stopPropagation()}>
        <div className="modal-header compact">
          <div className="modal-header-icon" style={{ background: '#6366f115', color: '#6366f1' }}>
            <i className='bx bx-wallet'></i>
          </div>
          <div>
            <h3>{isEdit ? 'Modifier le budget' : 'Nouveau budget'}</h3>
          </div>
          <button onClick={onClose} className="modal-close">
            <i className='bx bx-x'></i>
          </button>
        </div>

        {message && (
          <MessageBanner 
            type={message.type} 
            message={message.text} 
            onClose={() => setMessage(null)}
          />
        )}

        {categoriesSortie.length === 0 && (
          <div className="warning-banner compact">
            <i className='bx bx-error-circle'></i>
            <span>Aucune catégorie de dépense disponible</span>
            <button onClick={() => window.location.href = '/categories'} className="warning-link">
              Créer <i className='bx bx-right-arrow-alt'></i>
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group compact">
            <select
              value={form.categorie}
              onChange={e => setForm(prev => ({ ...prev, categorie: e.target.value }))}
              required
              disabled={categoriesSortie.length === 0}
            >
              <option value="">Sélectionner une catégorie de dépense</option>
              {categoriesSortie.map(c => (
                <option key={c.id} value={c.id}>{c.nom}</option>
              ))}
            </select>
          </div>

          <div className="form-group compact">
            <input
              type="number"
              step="0.01"
              min="1"
              value={form.montant_prevu}
              onChange={e => setForm(prev => ({ ...prev, montant_prevu: e.target.value }))}
              placeholder="Montant prévu (MRU)"
              required
            />
          </div>

          <div className="form-row compact">
            <div className="form-group compact">
              <input
                type="date"
                value={form.date_debut}
                onChange={e => setForm(prev => ({ ...prev, date_debut: e.target.value }))}
                required
              />
            </div>
            <div className="form-group compact">
              <input
                type="date"
                value={form.date_fin}
                onChange={e => setForm(prev => ({ ...prev, date_fin: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="color-row compact">
            <button 
              type="button" 
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="color-trigger"
              style={{ background: form.couleur }}
              title="Choisir une couleur"
            >
              <i className='bx bx-palette'></i>
            </button>
            {showColorPicker && (
              <div className="color-picker compact">
                {COULEURS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => { setForm(prev => ({ ...prev, couleur: c })); setShowColorPicker(false); }}
                    className={`color-option ${form.couleur === c ? 'active' : ''}`}
                    style={{ background: c }}
                    title={c}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="modal-actions compact">
            <button type="submit" disabled={loading || categoriesSortie.length === 0} className="btn-primary">
              {loading ? <div className="spinner"></div> : <><i className='bx bx-check'></i> {isEdit ? 'Valider' : 'Créer'}</>}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">Annuler</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── PAGE PRINCIPALE BUDGETS ───────────────────────────────────────────────────
export default function Budgets() {
  const navigate = useNavigate();
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');
  const [depenseModal, setDepenseModal] = useState(null);
  const [depensesModal, setDepensesModal] = useState(null);
  const [budgetModal, setBudgetModal] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [confirmSupprId, setConfirmSupprId] = useState(null);
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [limitMessage, setLimitMessage] = useState(null);
  const [filterType, setFilterType] = useState('all');
  
  // États pour l'abonnement
  const [abonnementExpire, setAbonnementExpire] = useState(false);
  const [abonnementCharge, setAbonnementCharge] = useState(true);
  
  // État pour les messages de la page
  const [pageMessage, setPageMessage] = useState(null);

  const categoriesSortie = categories.filter(cat => cat.type === 'sortie' || cat.type === 'depense' || cat.type === 'expense');
  const hasCategoriesSortie = categoriesSortie.length > 0;

  const peutCreerBudget = () => getDailyCount(BUDGET_COUNT_KEY) < BUDGET_DAILY_LIMIT;
  const peutAjouterDepense = () => getDailyCount(DEPENSE_COUNT_KEY) < DEPENSE_DAILY_LIMIT;

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

  const chargerDonnees = useCallback(async () => {
    setLoading(true);
    setPageMessage(null);
    try {
      const [bRes, cRes] = await Promise.all([
        api.get('/budgets/'),
        categorieService.getAll(),
      ]);
      setBudgets(bRes.data.results || bRes.data || []);
      setCategories(cRes.data || []);
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
          text: 'Votre abonnement a expiré. Vous ne pouvez pas créer de nouveaux budgets.' 
        });
        return;
      }
      
      console.error('Erreur:', err);
      setPageMessage({ 
        type: 'error', 
        text: 'Erreur lors du chargement des budgets. Veuillez réessayer.' 
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    verifierAbonnement();
    chargerDonnees();
  }, [verifierAbonnement, chargerDonnees]);

  const handleModalMessage = (type, text) => {
    if (type === 'success') {
      setPageMessage({ type: 'success', text });
      setTimeout(() => setPageMessage(null), 3000);
    } else if (type === 'error') {
      setPageMessage({ type: 'error', text });
    }
  };

  const handleLimitReached = (message) => {
    setLimitMessage(message);
  };

  const handleSupprimerBudget = async () => {
    try {
      const budget = budgets.find(b => b.id === confirmSupprId);
      if (budget && estBudgetTermine(budget)) {
        setPageMessage({ 
          type: 'error', 
          text: 'Impossible de supprimer un budget terminé.' 
        });
        setConfirmSupprId(null);
        return;
      }
      await api.delete(`/budgets/${confirmSupprId}/`);
      setPageMessage({ 
        type: 'success', 
        text: 'Budget supprimé avec succès.' 
      });
      setTimeout(() => setPageMessage(null), 3000);
      setConfirmSupprId(null);
      chargerDonnees();
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
      
      const msg = errorData?.message || errorData?.detail || 'Erreur lors de la suppression.';
      setPageMessage({ type: 'error', text: msg });
    }
  };

  const estBudgetEncours = (budget) => {
    const aujourdHui = new Date();
    aujourdHui.setHours(0, 0, 0, 0);
    const dateDebut = new Date(budget.date_debut);
    const dateFin = new Date(budget.date_fin);
    dateDebut.setHours(0, 0, 0, 0);
    dateFin.setHours(0, 0, 0, 0);
    return dateDebut <= aujourdHui && dateFin >= aujourdHui;
  };

  const estBudgetDepasse = (budget) => {
    const aujourdHui = new Date();
    aujourdHui.setHours(0, 0, 0, 0);
    const dateFin = new Date(budget.date_fin);
    dateFin.setHours(0, 0, 0, 0);
    const pct = parseFloat(budget.pourcentage_utilise || 0);
    return dateFin < aujourdHui && pct < 100;
  };

  const estBudgetTermine = (budget) => {
    const pct = parseFloat(budget.pourcentage_utilise || 0);
    return pct >= 100;
  };

  const estBudgetModifiable = (budget) => {
    const aujourdHui = new Date();
    aujourdHui.setHours(0, 0, 0, 0);
    const dateFin = new Date(budget.date_fin);
    dateFin.setHours(0, 0, 0, 0);
    return dateFin >= aujourdHui && !estBudgetTermine(budget);
  };

  const budgetsFiltresParRecherche = budgets.filter(budget => {
    if (!searchTerm.trim()) return true;
    const categorieNom = budget.categorie_nom?.toLowerCase() || '';
    const searchLower = searchTerm.toLowerCase().trim();
    return categorieNom.includes(searchLower);
  });

  const budgetsFiltres = budgetsFiltresParRecherche.filter(budget => {
    const estEncours = estBudgetEncours(budget);
    const estDepasse = estBudgetDepasse(budget);
    const estTermine = estBudgetTermine(budget);

    if (filterType === 'encours') {
      return estEncours && !estDepasse && !estTermine;
    }
    if (filterType === 'termine') {
      return estTermine;
    }
    if (filterType === 'depasse') {
      return estDepasse && !estTermine;
    }
    return true;
  });

  const budgetsEncoursCount = budgets.filter(b => {
    const estEncours = estBudgetEncours(b);
    const estDepasse = estBudgetDepasse(b);
    const estTermine = estBudgetTermine(b);
    return estEncours && !estDepasse && !estTermine;
  }).length;

  const budgetsTerminesCount = budgets.filter(b => estBudgetTermine(b)).length;
  const budgetsDepasseCount = budgets.filter(b => {
    const estDepasse = estBudgetDepasse(b);
    const estTermine = estBudgetTermine(b);
    return estDepasse && !estTermine;
  }).length;

  const totalPrevu = budgetsFiltres.reduce((s, b) => s + parseFloat(b.montant_prevu || 0), 0);
  const totalDepense = budgetsFiltres.reduce((s, b) => s + parseFloat(b.montant_depense || 0), 0);
  const totalReste = totalPrevu - totalDepense;

  if (abonnementCharge) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: '#f8fafc',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 48, height: 48,
            border: '3px solid #ede9fe',
            borderTopColor: '#6366f1',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 16px',
          }} />
          <p style={{ color: '#64748b' }}>Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="budgets-page">
      {successMsg && <SuccessModal message={successMsg} onClose={() => setSuccessMsg('')} />}
      {limitMessage && <LimitModal message={limitMessage} onClose={() => setLimitMessage(null)} />}
      
      <MessageBanner 
        type={pageMessage?.type} 
        message={pageMessage?.text} 
        onClose={() => setPageMessage(null)}
      />

      <div className="page-header">
        <div className="header-left">
          <div className="header-icon">
            <i className='bx bx-target-lock'></i>
          </div>
          <div>
            <h1>Budgets</h1>
            <p>{budgets.length} budget(s) • {budgetsEncoursCount} en cours • {budgetsTerminesCount} terminés • {budgetsDepasseCount} dépassés</p>
          </div>
        </div>
        {hasCategoriesSortie && (
          <button 
            onClick={() => {
              if (abonnementExpire) {
                setPageMessage({ 
                  type: 'error', 
                  text: 'Votre abonnement a expiré. Vous ne pouvez pas créer de nouveaux budgets.' 
                });
                return;
              }
              if (!peutCreerBudget()) {
                setLimitMessage(`Votre abonnement d'essai est limité à ${BUDGET_DAILY_LIMIT} budgets créés par jour. Vous avez atteint cette limite aujourd'hui. Revenez demain ou passez à un abonnement supérieur pour créer plus de budgets.`);
                return;
              }
              setBudgetModal({}); 
              setIsCreating(true);
            }} 
            className="create-btn"
            style={{
              opacity: abonnementExpire ? 0.6 : 1,
              cursor: abonnementExpire ? 'not-allowed' : 'pointer',
            }}
            title={abonnementExpire ? 'Votre abonnement a expiré' : ''}
          >
            <i className='bx bx-plus'></i>
            <span>Nouveau budget</span>
          </button>
        )}
      </div>

      {budgets.length > 0 && (
        <>
          <div className="filter-tabs">
            <button onClick={() => setFilterType('all')} className={`filter-btn ${filterType === 'all' ? 'active' : ''}`}>
              <i className='bx bx-list-ul'></i>
              <span>Tous ({budgets.length})</span>
            </button>
            <button onClick={() => setFilterType('encours')} className={`filter-btn ${filterType === 'encours' ? 'active' : ''}`}>
              <i className='bx bx-time'></i>
              <span>En cours ({budgetsEncoursCount})</span>
            </button>
            <button onClick={() => setFilterType('termine')} className={`filter-btn ${filterType === 'termine' ? 'active' : ''}`}>
              <i className='bx bx-check-circle'></i>
              <span>Terminés ({budgetsTerminesCount})</span>
            </button>
            <button onClick={() => setFilterType('depasse')} className={`filter-btn ${filterType === 'depasse' ? 'active' : ''}`}>
              <i className='bx bx-error-circle'></i>
              <span>Dépassés ({budgetsDepasseCount})</span>
            </button>
          </div>

          <div className="search-container">
            <div className="search-input-wrapper">
              <i className='bx bx-search'></i>
              <input
                type="text"
                placeholder="Rechercher un budget par catégorie..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="search-clear">
                  <i className='bx bx-x'></i>
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {!loading && hasCategoriesSortie && budgets.length === 0 && !showQuickCreate && (
        <button 
          onClick={() => {
            if (abonnementExpire) {
              setPageMessage({ 
                type: 'error', 
                text: 'Votre abonnement a expiré. Vous ne pouvez pas créer de nouveaux budgets.' 
              });
              return;
            }
            if (!peutCreerBudget()) {
              setLimitMessage(`Votre abonnement d'essai est limité à ${BUDGET_DAILY_LIMIT} budgets créés par jour. Vous avez atteint cette limite aujourd'hui. Revenez demain ou passez à un abonnement supérieur pour créer plus de budgets.`);
              return;
            }
            setShowQuickCreate(true);
          }} 
          className="quick-create-btn"
          style={{
            opacity: abonnementExpire ? 0.6 : 1,
          }}
        >
          <i className='bx bx-plus-circle'></i>
          <span>Créer mon premier budget</span>
        </button>
      )}

      {showQuickCreate && (
        <div className="quick-create-card">
          <div className="quick-create-header">
            <i className='bx bx-wallet'></i>
            <span>Nouveau budget</span>
            <button onClick={() => setShowQuickCreate(false)} className="quick-close">
              <i className='bx bx-x'></i>
            </button>
          </div>
          <form onSubmit={async (e) => {
            e.preventDefault();
            if (abonnementExpire) {
              setPageMessage({ 
                type: 'error', 
                text: 'Votre abonnement a expiré. Vous ne pouvez pas créer de nouveaux budgets.' 
              });
              setShowQuickCreate(false);
              return;
            }
            if (!peutCreerBudget()) {
              setShowQuickCreate(false);
              setLimitMessage(`Votre abonnement d'essai est limité à ${BUDGET_DAILY_LIMIT} budgets créés par jour. Vous avez atteint cette limite aujourd'hui. Revenez demain ou passez à un abonnement supérieur pour créer plus de budgets.`);
              return;
            }
            const formData = new FormData(e.target);
            const data = {
              categorie: formData.get('categorie'),
              montant_prevu: parseFloat(formData.get('montant_prevu')),
              date_debut: formData.get('date_debut'),
              date_fin: formData.get('date_fin'),
            };
            try {
              await api.post('/budgets/', data);
              incrementDailyCount(BUDGET_COUNT_KEY);
              setShowQuickCreate(false);
              setPageMessage({ 
                type: 'success', 
                text: 'Budget créé avec succès !' 
              });
              setTimeout(() => setPageMessage(null), 3000);
              chargerDonnees();
            } catch (err) {
              const errorData = err.response?.data;
              const status = err.response?.status;
              
              if (status === 403 && errorData?.error === 'abonnement_expire') {
                setPageMessage({ 
                  type: 'error', 
                  text: 'Votre abonnement a expiré. Vous ne pouvez pas créer de budgets.' 
                });
                setShowQuickCreate(false);
                return;
              }
              
              const msg = errorData?.detail || 'Erreur lors de la création.';
              setPageMessage({ type: 'error', text: msg });
            }
          }} className="quick-create-form">
            <select name="categorie" required>
              <option value="">Catégorie de dépense</option>
              {categoriesSortie.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
            <input type="number" name="montant_prevu" placeholder="Montant (MRU)" required step="0.01" min="1" />
            <input type="date" name="date_debut" required />
            <input type="date" name="date_fin" required />
            <button type="submit" className="quick-submit">
              <i className='bx bx-check'></i> Créer
            </button>
          </form>
        </div>
      )}

      {!loading && !hasCategoriesSortie && (
        <div className="warning-card compact">
          <i className='bx bx-category'></i>
          <div>
            <strong>Créez des catégories de dépense</strong>
            <p>Pour créer un budget, vous devez d'abord créer une catégorie de type "Sortie" (dépense).</p>
          </div>
          <button onClick={() => navigate('/categories')} className="warning-action-btn">
            Créer une catégorie <i className='bx bx-right-arrow-alt'></i>
          </button>
        </div>
      )}

      {budgetsFiltres.length > 0 && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#6366f115', color: '#6366f1' }}>
              <i className='bx bx-chart'></i>
            </div>
            <div>
              <span className="stat-label">Total prévu</span>
              <span className="stat-value">{totalPrevu.toLocaleString('fr-FR')} MRU</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#ef444415', color: '#ef4444' }}>
              <i className='bx bx-trending-down'></i>
            </div>
            <div>
              <span className="stat-label">Total dépensé</span>
              <span className="stat-value">{totalDepense.toLocaleString('fr-FR')} MRU</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#10b98115', color: '#10b981' }}>
              <i className='bx bx-wallet'></i>
            </div>
            <div>
              <span className="stat-label">Reste total</span>
              <span className="stat-value">{totalReste.toLocaleString('fr-FR')} MRU</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#f59e0b15', color: '#f59e0b' }}>
              <i className='bx bx-target-lock'></i>
            </div>
            <div>
              <span className="stat-label">Total budgets</span>
              <span className="stat-value">{budgetsFiltres.length}</span>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading-container">
          <div className="spinner large"></div>
          <p>Chargement des budgets...</p>
        </div>
      ) : budgetsFiltres.length === 0 && budgets.length > 0 && filterType !== 'all' ? (
        <div className="empty-state">
          <i className='bx bx-filter-alt'></i>
          <h3>Aucun budget {filterType === 'encours' ? 'en cours' : filterType === 'termine' ? 'terminé' : 'dépassé'}</h3>
          <p>Aucun budget ne correspond à ce filtre.</p>
          {filterType !== 'termine' && (
            <button onClick={() => { setFilterType('all'); setSearchTerm(''); }} className="primary-btn">
              <i className='bx bx-list-ul'></i> Voir tous les budgets
            </button>
          )}
        </div>
      ) : budgetsFiltres.length === 0 && searchTerm ? (
        <div className="empty-state">
          <i className='bx bx-search-alt'></i>
          <h3>Aucun budget trouvé</h3>
          <p>Aucun budget ne correspond à la recherche "{searchTerm}"</p>
          <button onClick={() => setSearchTerm('')} className="primary-btn">
            <i className='bx bx-reset'></i> Réinitialiser la recherche
          </button>
        </div>
      ) : budgetsFiltres.length === 0 && !showQuickCreate ? (
        <div className="empty-state">
          <i className='bx bx-target-lock'></i>
          <h3>Aucun budget</h3>
          <p>Créez votre premier budget pour contrôler vos dépenses</p>
        </div>
      ) : (
        <div className="budgets-grid">
          {budgetsFiltres.map(budget => {
            const pct = Math.min(parseFloat(budget.pourcentage_utilise || 0), 100);
            const couleur = budget.couleur || '#6366f1';
            const reste = parseFloat(budget.montant_prevu) - parseFloat(budget.montant_depense);
            
            const estEncours = estBudgetEncours(budget);
            const estDepasse = estBudgetDepasse(budget);
            const estTermine = estBudgetTermine(budget);
            const estModifiable = estBudgetModifiable(budget);

            let badgeType = '';
            let badgeLabel = '';
            let badgeClass = '';

            if (estTermine) {
              badgeType = 'termine';
              badgeLabel = 'Terminé';
              badgeClass = 'termine-badge';
            } else if (estDepasse) {
              badgeType = 'depasse';
              badgeLabel = 'Dépassé';
              badgeClass = 'depasse-badge';
            } else if (estEncours) {
              badgeType = 'encours';
              badgeLabel = 'En cours';
              badgeClass = 'encours-badge';
            }

            return (
              <div key={budget.id} className={`budget-card ${estDepasse ? 'depasse' : ''} ${estTermine ? 'termine' : ''}`} style={{ borderTopColor: couleur }}>
                <div className="budget-card-header">
                  <div className="budget-category" style={{ color: couleur }}>
                    <i className='bx bx-category'></i>
                    <span>{budget.categorie_nom}</span>
                  </div>
                  <div className="budget-status-badges">
                    {badgeType && (
                      <div className={badgeClass} title={`Budget ${badgeLabel.toLowerCase()}`}>
                        <i className={`bx ${badgeType === 'termine' ? 'bx-check-circle' : badgeType === 'depasse' ? 'bx-error-circle' : 'bx-time'}`}></i>
                        <span>{badgeLabel}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="budget-card-stats">
                  <div className="stat-item">
                    <span className="stat-label-small">{parseFloat(budget.montant_prevu).toLocaleString()} MRU</span>
                    <span className="stat-sub">prévu</span>
                  </div>
                  <div className="stat-divider"></div>
                  <div className="stat-item">
                    <span className="stat-label-small" style={{ color: estDepasse || estTermine ? '#ef4444' : couleur }}>
                      {parseFloat(budget.montant_depense).toLocaleString()} MRU
                    </span>
                    <span className="stat-sub">dépensé</span>
                  </div>
                </div>

                <div className="progress-bar">
                  <div className="progress-fill" style={{ 
                    width: `${pct}%`, 
                    background: estDepasse || estTermine ? '#ef4444' : (pct > 80 ? '#f59e0b' : couleur) 
                  }}></div>
                </div>

                <div className="budget-card-footer">
                  <div className="reste-info" style={{ 
                    color: estDepasse || estTermine ? '#ef4444' : (reste > 0 ? '#10b981' : '#f59e0b') 
                  }}>
                    <i className='bx bx-wallet'></i>
                    <span>Reste: {reste.toLocaleString()} MRU</span>
                  </div>
                  <span className="pourcentage">{budget.pourcentage_utilise}% utilisé</span>
                </div>

                <div className="budget-actions">
                  <button 
                    onClick={() => {
                      if (abonnementExpire) {
                        setPageMessage({ 
                          type: 'error', 
                          text: 'Votre abonnement a expiré. Vous ne pouvez pas ajouter de dépenses.' 
                        });
                        return;
                      }
                      if (!peutAjouterDepense()) {
                        setLimitMessage(`Votre abonnement d'essai est limité à ${DEPENSE_DAILY_LIMIT} dépenses de budget par jour. Vous avez atteint cette limite aujourd'hui. Revenez demain ou passez à un abonnement supérieur pour ajouter plus de dépenses.`);
                        return;
                      }
                      setDepenseModal(budget);
                    }} 
                    className="action-btn-depense" 
                    style={{ 
                      background: (estDepasse || estTermine || !estModifiable || abonnementExpire) ? '#94a3b8' : couleur,
                      opacity: (estDepasse || estTermine || !estModifiable || abonnementExpire) ? 0.6 : 1,
                    }}
                    disabled={estDepasse || estTermine || !estModifiable || abonnementExpire}
                    title={(estDepasse || estTermine || !estModifiable) ? "Ce budget n'est plus actif" : "Ajouter une dépense au budget"}
                  >
                    <i className='bx bx-money'></i>
                    <span>Dépenser</span>
                  </button>
                  <button onClick={() => setDepensesModal(budget)} className="action-btn-view" title="Voir les dépenses du budget">
                    <i className='bx bx-list-ul'></i>
                  </button>
                  <button 
                    onClick={() => { 
                      if (abonnementExpire) {
                        setPageMessage({ 
                          type: 'error', 
                          text: 'Votre abonnement a expiré. Vous ne pouvez pas modifier de budgets.' 
                        });
                        return;
                      }
                      if (!estModifiable) {
                        setPageMessage({ 
                          type: 'error', 
                          text: 'Ce budget n\'est plus modifiable car la période est dépassée.' 
                        });
                        return;
                      }
                      setBudgetModal(budget); 
                      setIsCreating(false); 
                    }} 
                    className="action-btn-edit" 
                    style={{ 
                      opacity: (estModifiable && !abonnementExpire) ? 1 : 0.5, 
                      cursor: (estModifiable && !abonnementExpire) ? 'pointer' : 'not-allowed' 
                    }}
                    disabled={!estModifiable || abonnementExpire}
                    title={!estModifiable ? "Ce budget n'est plus modifiable" : abonnementExpire ? "Votre abonnement a expiré" : "Modifier"}
                  >
                    <i className='bx bx-edit-alt'></i>
                  </button>
                  <button 
                    onClick={() => setConfirmSupprId(budget.id)} 
                    className="action-btn-delete" 
                    style={{ 
                      opacity: (estTermine || abonnementExpire) ? 0.5 : 1, 
                      cursor: (estTermine || abonnementExpire) ? 'not-allowed' : 'pointer' 
                    }}
                    disabled={estTermine || abonnementExpire}
                    title={estTermine ? "Impossible de supprimer un budget terminé" : abonnementExpire ? "Votre abonnement a expiré" : "Supprimer"}
                  >
                    <i className='bx bx-trash'></i>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {depenseModal && (
        <DepenseModal
          budget={depenseModal}
          onClose={() => setDepenseModal(null)}
          onSuccess={msg => { setDepenseModal(null); setSuccessMsg(msg); chargerDonnees(); }}
          canSubmit={peutAjouterDepense() && !abonnementExpire}
          onLimitReached={() => {
            setDepenseModal(null);
            setLimitMessage(`Votre abonnement d'essai est limité à ${DEPENSE_DAILY_LIMIT} dépenses de budget par jour. Vous avez atteint cette limite aujourd'hui. Revenez demain ou passez à un abonnement supérieur pour ajouter plus de dépenses.`);
          }}
          onMessage={handleModalMessage}
        />
      )}
      {depensesModal && (
        <BudgetDepensesModal budget={depensesModal} onClose={() => setDepensesModal(null)} />
      )}
      {budgetModal !== null && (
        <BudgetModal
          budget={isCreating ? null : budgetModal}
          categories={categories}
          onClose={() => { setBudgetModal(null); setIsCreating(false); }}
          onSuccess={() => { setBudgetModal(null); setIsCreating(false); chargerDonnees(); }}
          canCreate={isCreating ? (peutCreerBudget() && !abonnementExpire) : true}
          onLimitReached={() => {
            setBudgetModal(null);
            setIsCreating(false);
            setLimitMessage(`Votre abonnement d'essai est limité à ${BUDGET_DAILY_LIMIT} budgets créés par jour. Vous avez atteint cette limite aujourd'hui. Revenez demain ou passez à un abonnement supérieur pour créer plus de budgets.`);
          }}
          onMessage={handleModalMessage}
        />
      )}

      {confirmSupprId && (
        <div className="modal-overlay" onClick={() => setConfirmSupprId(null)}>
          <div className="modal-container delete-confirm compact" onClick={e => e.stopPropagation()}>
            <div className="delete-icon">
              <i className='bx bx-trash'></i>
            </div>
            <h3>Supprimer ce budget ?</h3>
            <p>Cette action est irréversible.</p>
            <div className="modal-actions compact">
              <button onClick={handleSupprimerBudget} className="btn-danger">
                <i className='bx bx-trash'></i> Supprimer
              </button>
              <button onClick={() => setConfirmSupprId(null)} className="btn-secondary">Annuler</button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @import url('https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css');

        .budgets-page {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px 16px;
          font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: rgba(15, 23, 42, 0.5);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal-container {
          background: white;
          border-radius: 20px;
          padding: 20px;
          width: 90%;
          max-width: 380px;
          max-height: 85vh;
          overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
        }

        .modal-container.compact {
          max-width: 340px;
          padding: 16px;
        }

        .modal-container.large {
          max-width: 600px;
        }

        .modal-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .modal-header.compact {
          margin-bottom: 12px;
        }

        .modal-header-icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          flex-shrink: 0;
        }

        .modal-header h3 {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 700;
          color: #1e293b;
        }

        .modal-header p {
          margin: 2px 0 0;
          font-size: 0.75rem;
          color: #64748b;
        }

        .modal-close {
          margin-left: auto;
          background: #f1f5f9;
          border: none;
          border-radius: 8px;
          width: 30px;
          height: 30px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
          transition: all 0.2s;
        }

        .modal-close:hover {
          background: #e2e8f0;
        }

        .success-modal {
          background: white;
          border-radius: 28px;
          padding: 40px 56px;
          text-align: center;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.18);
        }

        .success-modal i {
          font-size: 64px;
          color: #10b981;
          margin-bottom: 16px;
        }

        .success-modal p {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 600;
          color: #1e293b;
        }

        .input-with-icon {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-with-icon i {
          position: absolute;
          left: 12px;
          color: #94a3b8;
          font-size: 1rem;
          pointer-events: none;
        }

        .input-with-icon input {
          width: 100%;
          padding: 10px 12px 10px 36px;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          font-size: 0.85rem;
          outline: none;
          background: white;
          box-sizing: border-box;
        }

        .input-with-icon input:focus {
          border-color: #ef4444;
          box-shadow: 0 0 0 2px #ef444420;
        }

        .form-group.compact {
          margin-bottom: 10px;
        }

        .form-group.compact label {
          display: none;
        }

        .form-group.compact input,
        .form-group.compact select {
          width: 100%;
          padding: 10px 12px;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          font-size: 0.85rem;
          outline: none;
          background: white;
          box-sizing: border-box;
        }

        .form-group.compact input:focus,
        .form-group.compact select:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 2px #6366f120;
        }

        .form-row.compact {
          display: flex;
          gap: 8px;
        }

        .form-row.compact .form-group.compact {
          flex: 1;
        }

        .color-row.compact {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }

        .color-trigger {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          border: 2px solid #e2e8f0;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 18px;
          transition: all 0.2s;
        }

        .color-trigger:hover {
          transform: scale(1.02);
        }

        .color-picker.compact {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          flex: 1;
        }

        .color-option {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          border: 2px solid transparent;
          cursor: pointer;
          transition: all 0.15s;
        }

        .color-option:hover {
          transform: scale(1.1);
        }

        .color-option.active {
          border-color: #1e293b;
          transform: scale(1.1);
        }

        .modal-actions.compact {
          display: flex;
          gap: 8px;
          margin-top: 12px;
        }

        .btn-primary, .btn-secondary, .btn-danger {
          flex: 1;
          padding: 10px;
          border: none;
          border-radius: 10px;
          font-weight: 600;
          font-size: 0.8rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: all 0.2s;
        }

        .btn-primary {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.35);
        }

        .btn-secondary {
          background: #f1f5f9;
          color: #64748b;
          border: 1px solid #e2e8f0;
        }

        .btn-secondary:hover {
          background: #e2e8f0;
        }

        .btn-danger {
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: white;
        }

        .btn-danger:hover {
          transform: translateY(-1px);
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .budget-info-row.compact {
          display: flex;
          gap: 12px;
          padding: 10px;
          background: #f8fafc;
          border-radius: 10px;
          margin-bottom: 16px;
        }

        .budget-info-item {
          flex: 1;
          text-align: center;
        }

        .info-label {
          display: block;
          font-size: 0.6rem;
          font-weight: 600;
          color: #94a3b8;
          text-transform: uppercase;
          margin-bottom: 4px;
        }

        .info-value {
          font-size: 0.9rem;
          font-weight: 700;
        }

        .stats-row.compact {
          display: flex;
          gap: 12px;
          padding: 12px;
          background: #f8fafc;
          border-radius: 14px;
          margin-bottom: 20px;
        }

        .stat-card-mini {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .stat-card-mini i {
          font-size: 22px;
        }

        .stat-mini-label {
          display: block;
          font-size: 0.6rem;
          font-weight: 600;
          color: #94a3b8;
          text-transform: uppercase;
        }

        .stat-mini-value {
          display: block;
          font-size: 0.8rem;
          font-weight: 700;
          color: #1e293b;
        }

        .filter-tabs {
          display: flex;
          gap: 10px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }

        .filter-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border-radius: 40px;
          border: 1.5px solid #e2e8f0;
          background: white;
          color: #64748b;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .filter-btn i {
          font-size: 1.1rem;
        }

        .filter-btn:hover {
          border-color: #6366f1;
          color: #6366f1;
          transform: translateY(-1px);
        }

        .filter-btn.active {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          border-color: transparent;
          color: white;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        }

        .search-container {
          margin-bottom: 20px;
        }

        .search-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          background: white;
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          padding: 0 12px;
          transition: all 0.2s;
        }

        .search-input-wrapper:focus-within {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .search-input-wrapper i {
          color: #94a3b8;
          font-size: 1.2rem;
        }

        .search-input {
          flex: 1;
          padding: 12px 8px;
          border: none;
          outline: none;
          font-size: 0.9rem;
          background: transparent;
          color: #1e293b;
        }

        .search-input::placeholder {
          color: #94a3b8;
        }

        .search-clear {
          background: none;
          border: none;
          cursor: pointer;
          color: #94a3b8;
          padding: 4px 8px;
          font-size: 1.2rem;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.2s;
        }

        .search-clear:hover {
          color: #ef4444;
        }

        .transactions-list {
          margin-top: 8px;
        }

        .transactions-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding-bottom: 12px;
          border-bottom: 1px solid #eef2f8;
          font-size: 0.8rem;
          font-weight: 600;
          color: #64748b;
        }

        .empty-transactions.compact {
          text-align: center;
          padding: 40px 20px;
        }

        .empty-transactions.compact i {
          font-size: 40px;
          color: #cbd5e1;
          margin-bottom: 12px;
        }

        .empty-transactions.compact p {
          margin: 0;
          font-weight: 500;
          font-size: 0.85rem;
          color: #64748b;
        }

        .empty-transactions.compact span {
          font-size: 0.7rem;
          color: #94a3b8;
        }

        .transaction-row.compact {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 0;
          border-bottom: 1px solid #f1f5f9;
        }

        .transaction-icon {
          width: 36px;
          height: 36px;
          background: #fef2f2;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ef4444;
          font-size: 16px;
          flex-shrink: 0;
        }

        .transaction-info {
          flex: 1;
        }

        .transaction-desc {
          font-weight: 600;
          font-size: 0.85rem;
          color: #1e293b;
        }

        .transaction-date {
          font-size: 0.65rem;
          color: #94a3b8;
          display: flex;
          align-items: center;
          gap: 4px;
          margin-top: 4px;
        }

        .transaction-amount {
          font-weight: 700;
          font-size: 0.85rem;
        }

        .transaction-amount.negative {
          color: #ef4444;
        }

        .page-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
          margin-bottom: 24px;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .header-icon {
          width: 56px;
          height: 56px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 28px;
          box-shadow: 0 8px 20px rgba(99, 102, 241, 0.3);
        }

        .page-header h1 {
          margin: 0;
          font-size: 1.6rem;
          font-weight: 800;
          color: #1e293b;
          letter-spacing: -0.3px;
        }

        .page-header p {
          margin: 4px 0 0;
          color: #64748b;
          font-size: 0.85rem;
        }

        .create-btn {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          border: none;
          border-radius: 40px;
          padding: 12px 24px;
          color: white;
          font-weight: 600;
          font-size: 0.85rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        }

        .create-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
        }

        .quick-create-btn {
          width: 100%;
          background: white;
          border: 2px dashed #cbd5e1;
          border-radius: 20px;
          padding: 18px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          color: #6366f1;
          font-weight: 600;
          font-size: 0.9rem;
          margin-bottom: 24px;
          transition: all 0.2s;
        }

        .quick-create-btn:hover:not(:disabled) {
          border-color: #6366f1;
          background: #f8fafc;
          transform: translateY(-2px);
        }

        .quick-create-card {
          background: white;
          border-radius: 20px;
          padding: 20px;
          margin-bottom: 24px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }

        .quick-create-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 16px;
          font-weight: 700;
          font-size: 0.9rem;
          color: #1e293b;
        }

        .quick-close {
          margin-left: auto;
          background: none;
          border: none;
          cursor: pointer;
          color: #94a3b8;
          font-size: 1.2rem;
        }

        .quick-create-form {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .quick-create-form select,
        .quick-create-form input {
          padding: 12px 14px;
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          font-size: 0.85rem;
          outline: none;
        }

        .quick-create-form select:focus,
        .quick-create-form input:focus {
          border-color: #6366f1;
        }

        .quick-submit {
          background: #6366f1;
          color: white;
          border: none;
          border-radius: 12px;
          padding: 12px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 4px;
        }

        .quick-submit:hover {
          background: #4f46e5;
        }

        .warning-card.compact {
          background: #fffbeb;
          border: 1px solid #fde68a;
          border-radius: 16px;
          padding: 16px 20px;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        .warning-card.compact i {
          font-size: 28px;
          color: #f59e0b;
        }

        .warning-card.compact div {
          flex: 1;
        }

        .warning-card.compact strong {
          color: #b45309;
          font-size: 0.85rem;
        }

        .warning-card.compact p {
          margin: 2px 0 0;
          font-size: 0.75rem;
          color: #92400e;
        }

        .warning-action-btn {
          background: #6366f1;
          border: none;
          border-radius: 40px;
          padding: 8px 18px;
          color: white;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
        }

        .warning-action-btn:hover {
          background: #4f46e5;
        }

        .warning-banner.compact {
          background: #fffbeb;
          border: 1px solid #fde68a;
          border-radius: 10px;
          padding: 8px 12px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .info-banner.compact {
          display: flex;
          align-items: center;
          gap: 8px;
          border: 1px solid;
          border-radius: 10px;
          padding: 8px 12px;
          font-size: 0.7rem;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 28px;
        }

        .stat-card {
          background: white;
          border-radius: 20px;
          padding: 16px 20px;
          display: flex;
          align-items: center;
          gap: 14px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
          border: 1px solid #eef2f8;
        }

        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
        }

        .stat-card .stat-label {
          display: block;
          font-size: 0.7rem;
          font-weight: 600;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .stat-card .stat-value {
          display: block;
          font-size: 1.2rem;
          font-weight: 800;
          color: #1e293b;
        }

        .budgets-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 20px;
        }

        .budget-card {
          background: white;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
          border: 1px solid #eef2f8;
          border-top: 4px solid;
          transition: all 0.2s;
        }

        .budget-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.12);
        }

        .budget-card.depasse {
          border-top-color: #ef4444;
          background: #fef2f2;
        }

        .budget-card.termine {
          opacity: 0.85;
          filter: grayscale(0.05);
        }

        .budget-card-header {
          padding: 18px 20px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 1px solid #f1f5f9;
          flex-wrap: wrap;
          gap: 10px;
        }

        .budget-category {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 700;
          font-size: 1rem;
        }

        .budget-category i {
          font-size: 1.1rem;
        }

        .budget-status-badges {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .encours-badge {
          background: #e0e7ff;
          color: #4338ca;
          border-radius: 20px;
          padding: 4px 10px;
          font-size: 0.65rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .termine-badge {
          background: #dcfce7;
          color: #15803d;
          border-radius: 20px;
          padding: 4px 10px;
          font-size: 0.65rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .depasse-badge {
          background: #fee2e2;
          color: #ef4444;
          border-radius: 20px;
          padding: 4px 10px;
          font-size: 0.65rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .budget-card-stats {
          padding: 16px 20px;
          display: flex;
          align-items: center;
          justify-content: space-around;
          background: #fafcff;
        }

        .stat-item {
          text-align: center;
          flex: 1;
        }

        .stat-label-small {
          display: block;
          font-size: 1.1rem;
          font-weight: 800;
          color: #1e293b;
        }

        .stat-sub {
          font-size: 0.65rem;
          font-weight: 600;
          color: #94a3b8;
          text-transform: uppercase;
          margin-top: 2px;
        }

        .stat-divider {
          width: 1px;
          height: 40px;
          background: #e2e8f0;
        }

        .progress-bar {
          margin: 0 20px 12px 20px;
          background: #f1f5f9;
          border-radius: 20px;
          height: 8px;
          overflow: hidden;
        }

        .progress-fill {
          height: 8px;
          border-radius: 20px;
          transition: width 0.3s;
        }

        .budget-card-footer {
          padding: 0 20px 16px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .reste-info {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.8rem;
          font-weight: 600;
          color: #10b981;
        }

        .pourcentage {
          font-size: 0.7rem;
          font-weight: 600;
          color: #94a3b8;
        }

        .budget-actions {
          padding: 16px 20px 20px;
          display: flex;
          gap: 8px;
          border-top: 1px solid #f1f5f9;
        }

        .action-btn-depense {
          flex: 2;
          border: none;
          border-radius: 12px;
          padding: 10px;
          color: white;
          font-weight: 600;
          font-size: 0.8rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: all 0.2s;
        }

        .action-btn-depense:hover:not(:disabled) {
          filter: brightness(0.9);
        }

        .action-btn-depense:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .action-btn-view,
        .action-btn-edit,
        .action-btn-delete {
          flex: 1;
          border: none;
          border-radius: 12px;
          padding: 10px;
          cursor: pointer;
          font-size: 1rem;
          transition: all 0.2s;
        }

        .action-btn-view {
          background: #f1f5f9;
          color: #475569;
        }

        .action-btn-edit {
          background: #eef2ff;
          color: #6366f1;
        }

        .action-btn-edit:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .action-btn-delete {
          background: #fef2f2;
          color: #ef4444;
        }

        .action-btn-delete:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .action-btn-view:hover,
        .action-btn-edit:hover:not(:disabled),
        .action-btn-delete:hover:not(:disabled) {
          transform: scale(0.95);
        }

        .loading-container {
          text-align: center;
          padding: 80px 20px;
          color: #94a3b8;
        }

        .empty-state {
          text-align: center;
          padding: 80px 20px;
          color: #94a3b8;
        }

        .empty-state i {
          font-size: 64px;
          color: #cbd5e1;
          margin-bottom: 16px;
        }

        .empty-state h3 {
          margin: 0 0 8px;
          font-size: 1.1rem;
          color: #1e293b;
        }

        .empty-state p {
          margin: 0 0 24px;
          font-size: 0.85rem;
        }

        .primary-btn {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          border: none;
          border-radius: 40px;
          padding: 12px 28px;
          color: white;
          font-weight: 600;
          font-size: 0.85rem;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .primary-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        }

        .delete-confirm.compact {
          text-align: center;
          max-width: 320px;
        }

        .delete-icon {
          width: 64px;
          height: 64px;
          background: #fef2f2;
          border-radius: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
          color: #ef4444;
          font-size: 32px;
        }

        .delete-confirm h3 {
          margin: 0 0 8px;
          font-size: 1.1rem;
          color: #1e293b;
        }

        .delete-confirm p {
          margin: 0 0 24px;
          font-size: 0.8rem;
          color: #64748b;
        }

        .limit-confirm.compact {
          text-align: center;
          max-width: 320px;
        }

        .limit-icon {
          width: 64px;
          height: 64px;
          background: #fff7ed;
          border-radius: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
          color: #f59e0b;
          font-size: 32px;
        }

        .limit-confirm h3 {
          margin: 0 0 8px;
          font-size: 1.1rem;
          color: #1e293b;
        }

        .limit-confirm p {
          margin: 0 0 24px;
          font-size: 0.8rem;
          color: #64748b;
          line-height: 1.5;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        .spinner.large {
          width: 40px;
          height: 40px;
          margin: 0 auto 16px;
          border: 3px solid #e2e8f0;
          border-top-color: #6366f1;
        }

        @media (max-width: 768px) {
          .budgets-page {
            padding: 16px 12px;
          }

          .page-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .create-btn {
            width: 100%;
            justify-content: center;
          }

          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }

          .filter-tabs {
            flex-wrap: wrap;
          }

          .filter-btn {
            flex: 1;
            justify-content: center;
            font-size: 0.7rem;
            padding: 8px 12px;
          }

          .search-input-wrapper {
            padding: 0 10px;
          }

          .search-input {
            font-size: 0.8rem;
            padding: 10px 6px;
          }

          .budgets-grid {
            grid-template-columns: 1fr;
          }

          .modal-container {
            padding: 16px;
            width: 95%;
          }

          .form-row.compact {
            flex-direction: column;
          }

          .stats-row.compact {
            flex-direction: column;
          }

          .budget-card-stats {
            flex-direction: column;
            gap: 8px;
          }

          .stat-divider {
            display: none;
          }

          .stat-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 4px 0;
          }
        }

        @media (min-width: 769px) and (max-width: 1024px) {
          .budgets-page {
            max-width: 960px;
          }

          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .budgets-grid {
            grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          }
        }
      `}</style>
    </div>
  );
}