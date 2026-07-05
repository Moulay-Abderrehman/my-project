import React, { useEffect, useState, useCallback } from 'react';
import api from '../api/axios';
import { categorieService } from '../api/categorieService';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ActionBlockedModal from '../components/ActionBlockedModal';

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
  }
  data.count += 1;
  try {
    localStorage.setItem(storageKey, JSON.stringify(data));
  } catch {
  }
  return data.count;
}

// ── COMPOSANT DE MESSAGE BANNIERE ──────────────────────────────────────────────
function MessageBanner({ type, message, onClose }) {
  if (!message) return null;

  const styles = {
    success: {
      wrap: 'bg-[#e9f8e7] border-[#4ea674]/30 text-[#2a4f53]',
      icon: 'bx-check-circle text-[#4ea674]',
    },
    error: {
      wrap: 'bg-[rgba(213,80,83,0.08)] border-[rgba(213,80,83,0.25)] text-[#8f2f31]',
      icon: 'bx-error-circle text-[#d55053]',
    },
    warning: {
      wrap: 'bg-[#fdf6e8] border-[#e8c27a] text-[#7a5410]',
      icon: 'bx-error text-[#c98a1f]',
    },
    info: {
      wrap: 'bg-[#c2f2f2]/40 border-[#356267]/25 text-[#2a4f53]',
      icon: 'bx-info-circle text-[#356267]',
    },
  };

  const style = styles[type] || styles.info;

  return (
    <div className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border mb-4 animate-[fadeUp_0.3s_cubic-bezier(.16,1,.3,1)_both] ${style.wrap}`}>
      <div className="flex items-center gap-2.5 min-w-0">
        <i className={`bx ${style.icon} text-xl shrink-0`} />
        <span className="text-[13px] font-medium leading-snug">{message}</span>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="shrink-0 bg-transparent border-none cursor-pointer text-lg px-1 opacity-60 hover:opacity-100 transition-opacity"
        >
          <i className="bx bx-x" />
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
    <div className="fixed inset-0 z-[9999] bg-[#10214b]/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl px-14 py-10 text-center shadow-[0_20px_60px_rgba(16,33,75,0.18)]">
        <i className="bx bx-check-circle text-6xl text-[#4ea674] mb-4 block"></i>
        <p className="m-0 text-lg font-semibold text-[#10214b]">{message}</p>
      </div>
    </div>
  );
}

// ── MODALE LIMITE ─────────────────────────────────────────────────────────────
function LimitModal({ message, onClose }) {
  return (
    <div className="fixed inset-0 z-[9999] bg-[#10214b]/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-[90%] max-w-[340px] text-center shadow-[0_20px_60px_rgba(16,33,75,0.15)]" onClick={e => e.stopPropagation()}>
        <div className="w-16 h-16 bg-[#fdf6e8] rounded-full flex items-center justify-center mx-auto mb-4 text-[#c98a1f] text-3xl">
          <i className="bx bx-lock-alt"></i>
        </div>
        <h3 className="m-0 mb-2 text-lg font-bold text-[#10214b]">Limite quotidienne atteinte</h3>
        <p className="m-0 mb-6 text-sm text-[#356267]/75 leading-relaxed">{message}</p>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 min-h-[44px] rounded-xl font-semibold text-sm bg-[#356267] text-white flex items-center justify-center gap-1.5 hover:bg-[#2a4f53] transition-colors">
            <i className="bx bx-check"></i> OK
          </button>
        </div>
      </div>
    </div>
  );
}

// ── MODALE DÉPENSE BUDGET ─────────────────────────────────────────────────────
function DepenseModal({ budget, onClose, onSuccess, canSubmit, onLimitReached, onMessage, isVisitorMode }) {
  const [montant, setMontant] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 🆕 Vérification du mode visiteur
    if (isVisitorMode) {
      if (onMessage) onMessage('visitor_mode');
      return;
    }

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

      // 🆕 Gestion du mode visiteur
      if (status === 403 && errorData?.visitor_mode) {
        if (onMessage) onMessage('visitor_mode');
        return;
      }

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
    <div className="fixed inset-0 z-[9999] bg-[#10214b]/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-4 w-[90%] max-w-[340px] max-h-[85vh] overflow-y-auto shadow-[0_20px_60px_rgba(16,33,75,0.15)]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 bg-[#d55053]/10 text-[#d55053]">
            <i className="bx bx-money"></i>
          </div>
          <div className="min-w-0">
            <h3 className="m-0 text-[1.05rem] font-bold text-[#10214b]">Nouvelle dépense de budget</h3>
            <p className="m-0 mt-0.5 text-xs text-[#356267]/70 truncate">{budget.categorie_nom}</p>
          </div>
          <button onClick={onClose} className="ml-auto bg-[#f1f5f9] border-none rounded-lg w-8 h-8 shrink-0 cursor-pointer flex items-center justify-center text-[#356267]/70 hover:bg-[#e2e8f0] transition-colors">
            <i className="bx bx-x"></i>
          </button>
        </div>

        {message && (
          <MessageBanner
            type={message.type}
            message={message.text}
            onClose={() => setMessage(null)}
          />
        )}

        <div className="flex gap-3 p-2.5 bg-[#f8fafc] rounded-xl mb-4">
          <div className="flex-1 text-center">
            <span className="block text-[0.6rem] font-semibold text-[#356267]/45 uppercase mb-1 tracking-wide">Budget restant</span>
            <span className="text-sm font-bold" style={{ color: isDepasse ? '#d55053' : '#4ea674' }}>
              {Math.abs(reste).toLocaleString()} MRU {isDepasse ? '(dépassé)' : ''}
            </span>
          </div>
          <div className="flex-1 text-center">
            <span className="block text-[0.6rem] font-semibold text-[#356267]/45 uppercase mb-1 tracking-wide">Budget total</span>
            <span className="text-sm font-bold text-[#10214b]">{parseFloat(budget.montant_prevu).toLocaleString()} MRU</span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-2.5">
            <div className="relative flex items-center">
              <i className="bx bx-pound absolute left-3 text-[#356267]/40 text-base pointer-events-none"></i>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={montant}
                onChange={e => setMontant(e.target.value)}
                placeholder="Montant de la dépense"
                required
                autoFocus
                disabled={isVisitorMode}
                className="w-full min-h-[44px] py-2.5 pl-9 pr-3 border border-[#10214b]/10 rounded-xl text-sm outline-none bg-white box-border focus:border-[#d55053] focus:ring-2 focus:ring-[#d55053]/15 disabled:bg-[#f8fafc] disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <div className="mb-2.5">
            <div className="relative flex items-center">
              <i className="bx bx-note absolute left-3 text-[#356267]/40 text-base pointer-events-none"></i>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Description (optionnel)"
                maxLength="200"
                disabled={isVisitorMode}
                className="w-full min-h-[44px] py-2.5 pl-9 pr-3 border border-[#10214b]/10 rounded-xl text-sm outline-none bg-white box-border focus:border-[#d55053] focus:ring-2 focus:ring-[#d55053]/15 disabled:bg-[#f8fafc] disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <div className="flex gap-2 mt-3">
            <button
              type="submit"
              disabled={loading || !montant || isVisitorMode}
              className="flex-1 min-h-[44px] rounded-xl font-semibold text-sm flex items-center justify-center gap-1.5 transition-all disabled:cursor-not-allowed disabled:opacity-70"
              style={{
                background: isVisitorMode ? '#e2e8f0' : '#d55053',
                color: isVisitorMode ? '#94a3b8' : 'white',
              }}
            >
              {loading ? (
                <><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></span> Enregistrement...</>
              ) : isVisitorMode ? (
                <><i className='bx bx-lock'></i> Mode Exploration</>
              ) : (
                <><i className='bx bx-check'></i> Enregistrer la dépense</>
              )}
            </button>
            <button type="button" onClick={onClose} disabled={loading} className="flex-1 min-h-[44px] rounded-xl font-semibold text-sm bg-[#f1f5f9] text-[#356267] border border-[#10214b]/10 hover:bg-[#e2e8f0] transition-colors">
              Annuler
            </button>
          </div>
        </form>

        <div className="flex items-start gap-2 mt-3 bg-[#e9f8e7] border border-[#4ea674]/25 rounded-xl p-2.5 text-[11px] text-[#2a4f53] leading-relaxed">
          <i className="bx bx-info-circle mt-0.5"></i>
          <span>Cette dépense est propre à ce budget et n'affecte pas vos transactions manuelles.</span>
        </div>

        {isDepasse && (
          <div className="flex items-start gap-2 mt-3 bg-[rgba(213,80,83,0.08)] border border-[rgba(213,80,83,0.25)] rounded-xl p-2.5">
            <i className="bx bx-error-circle text-[#d55053] mt-0.5"></i>
            <span className="text-[#8f2f31] text-[0.7rem] leading-relaxed">Attention : Budget déjà dépassé !</span>
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

  const couleur = budget.couleur || '#356267';
  const reste = parseFloat(budget.montant_prevu) - parseFloat(budget.montant_depense);

  return (
    <div className="fixed inset-0 z-[9999] bg-[#10214b]/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-5 w-[90%] max-w-[600px] max-h-[85vh] overflow-y-auto shadow-[0_20px_60px_rgba(16,33,75,0.15)]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4 pb-4 border-b-2" style={{ borderBottomColor: couleur }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ background: `${couleur}18`, color: couleur }}>
            <i className="bx bx-list-ul"></i>
          </div>
          <div className="min-w-0">
            <h3 className="m-0 text-[1.05rem] font-bold text-[#10214b] truncate">{budget.categorie_nom}</h3>
            <p className="m-0 mt-0.5 text-xs text-[#356267]/70">Dépenses du budget (indépendantes des transactions)</p>
          </div>
          <button onClick={onClose} className="ml-auto bg-[#f1f5f9] border-none rounded-lg w-8 h-8 shrink-0 cursor-pointer flex items-center justify-center text-[#356267]/70 hover:bg-[#e2e8f0] transition-colors">
            <i className="bx bx-x"></i>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 p-3 bg-[#f8fafc] rounded-2xl mb-5">
          <div className="flex-1 flex items-center gap-2">
            <i className="bx bx-target-lock text-2xl text-[#10214b]"></i>
            <div>
              <span className="block text-[0.6rem] font-semibold text-[#356267]/45 uppercase">Prévu</span>
              <span className="block text-sm font-bold text-[#10214b]">{parseFloat(budget.montant_prevu).toLocaleString()} MRU</span>
            </div>
          </div>
          <div className="flex-1 flex items-center gap-2">
            <i className="bx bx-trending-down text-2xl" style={{ color: couleur }}></i>
            <div>
              <span className="block text-[0.6rem] font-semibold text-[#356267]/45 uppercase">Dépensé (budget)</span>
              <span className="block text-sm font-bold text-[#10214b]">{parseFloat(budget.montant_depense).toLocaleString()} MRU</span>
            </div>
          </div>
          <div className="flex-1 flex items-center gap-2">
            <i className="bx bx-wallet text-2xl text-[#4ea674]"></i>
            <div>
              <span className="block text-[0.6rem] font-semibold text-[#356267]/45 uppercase">Reste</span>
              <span className="block text-sm font-bold text-[#10214b]">{reste.toLocaleString()} MRU</span>
            </div>
          </div>
        </div>

        <div className="mt-2">
          <div className="flex items-center gap-2 pb-3 border-b border-[#eef2f8] text-sm font-semibold text-[#356267]">
            <i className="bx bx-history"></i>
            <span>Historique des dépenses du budget</span>
          </div>

          {loading ? (
            <div className="text-center py-16 text-[#356267]/50">
              <div className="w-10 h-10 mx-auto mb-4 rounded-full border-[3px] border-[#e2e8f0] border-t-[#356267] animate-spin"></div>
              <p>Chargement...</p>
            </div>
          ) : depenses.length === 0 ? (
            <div className="text-center py-10 px-5">
              <i className="bx bx-receipt text-4xl text-[#cbd5e1] mb-3 block"></i>
              <p className="m-0 font-medium text-sm text-[#356267]/70">Aucune dépense enregistrée pour ce budget</p>
              <span className="text-xs text-[#356267]/45">Cliquez sur "Dépenser" pour ajouter une dépense</span>
            </div>
          ) : (
            depenses.map(d => (
              <div key={d.id} className="flex items-center gap-3 py-3 border-b border-[#f1f5f9]">
                <div className="w-9 h-9 bg-[rgba(213,80,83,0.08)] rounded-xl flex items-center justify-center text-[#d55053] text-base shrink-0">
                  <i className="bx bx-shopping-bag"></i>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-[#10214b] truncate">{d.description || 'Dépense budget'}</div>
                  <div className="text-[0.65rem] text-[#356267]/45 flex items-center gap-1 mt-1">
                    <i className="bx bx-calendar"></i>
                    {new Date(d.date_creation).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
                <div className="font-bold text-sm text-[#d55053] shrink-0">
                  -{parseFloat(d.montant).toLocaleString()} MRU
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex items-center gap-2 mt-4 bg-[#c2f2f2]/30 border border-[#356267]/20 rounded-xl p-2.5 text-[11px] text-[#2a4f53] leading-relaxed">
          <i className="bx bx-info-circle"></i>
          <span>Les dépenses affichées sont uniquement celles effectuées depuis ce budget. Les transactions manuelles ne sont pas prises en compte.</span>
        </div>
      </div>
    </div>
  );
}

// ── MODALE CRÉATION/MODIFICATION BUDGET ─────────────────────────────────────
function BudgetModal({ budget, categories, onClose, onSuccess, canCreate, onLimitReached, onMessage, isVisitorMode }) {
  const [form, setForm] = useState({
    categorie: budget?.categorie || '',
    montant_prevu: budget?.montant_prevu || '',
    date_debut: budget?.date_debut || '',
    date_fin: budget?.date_fin || '',
    couleur: budget?.couleur || '#356267',
  });
  const [loading, setLoading] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [message, setMessage] = useState(null);

  const isEdit = !!budget;

  const categoriesSortie = categories.filter(cat => cat.type === 'sortie' || cat.type === 'depense' || cat.type === 'expense');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isVisitorMode) {
      if (onMessage) onMessage('visitor_mode');
      return;
    }

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

      // 🆕 Gestion du mode visiteur
      if (status === 403 && errorData?.visitor_mode) {
        if (onMessage) onMessage('visitor_mode');
        return;
      }

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

  const COULEURS = ['#356267', '#2a4f53', '#4ea674', '#459071', '#d55053', '#10214b', '#c2f2f2', '#6b7280', '#3b82f6', '#8b5cf6'];

  return (
    <div className="fixed inset-0 z-[9999] bg-[#10214b]/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-4 w-[90%] max-w-[340px] max-h-[85vh] overflow-y-auto shadow-[0_20px_60px_rgba(16,33,75,0.15)]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 bg-[#356267]/10 text-[#356267]">
            <i className="bx bx-wallet"></i>
          </div>
          <div className="min-w-0">
            <h3 className="m-0 text-[1.05rem] font-bold text-[#10214b]">{isEdit ? 'Modifier le budget' : 'Nouveau budget'}</h3>
            {isVisitorMode && (
              <p className="m-0 mt-0.5 text-[0.65rem] text-[#c98a1f]">🔍 Mode Exploration - Visualisation uniquement</p>
            )}
          </div>
          <button onClick={onClose} className="ml-auto bg-[#f1f5f9] border-none rounded-lg w-8 h-8 shrink-0 cursor-pointer flex items-center justify-center text-[#356267]/70 hover:bg-[#e2e8f0] transition-colors">
            <i className="bx bx-x"></i>
          </button>
        </div>

        {message && (
          <MessageBanner
            type={message.type}
            message={message.text}
            onClose={() => setMessage(null)}
          />
        )}

        {categoriesSortie.length === 0 && !isVisitorMode && (
          <div className="flex items-center gap-2 bg-[#fdf6e8] border border-[#e8c27a] rounded-xl p-2.5 mb-3">
            <i className="bx bx-error-circle text-[#c98a1f]"></i>
            <span className="text-xs text-[#7a5410] flex-1">Aucune catégorie de dépense disponible</span>
            <button onClick={() => window.location.href = '/categories'} className="text-xs font-semibold text-[#356267] flex items-center gap-1 whitespace-nowrap">
              Créer <i className="bx bx-right-arrow-alt"></i>
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-2.5">
            <select
              value={form.categorie}
              onChange={e => setForm(prev => ({ ...prev, categorie: e.target.value }))}
              required
              disabled={categoriesSortie.length === 0 || isVisitorMode}
              className="w-full min-h-[44px] px-3 border border-[#10214b]/10 rounded-xl text-sm outline-none bg-white box-border focus:border-[#356267] focus:ring-2 focus:ring-[#356267]/15 disabled:bg-[#f8fafc] disabled:cursor-not-allowed"
            >
              <option value="">Sélectionner une catégorie de dépense</option>
              {categoriesSortie.map(c => (
                <option key={c.id} value={c.id}>{c.nom}</option>
              ))}
            </select>
          </div>

          <div className="mb-2.5">
            <input
              type="number"
              step="0.01"
              min="1"
              value={form.montant_prevu}
              onChange={e => setForm(prev => ({ ...prev, montant_prevu: e.target.value }))}
              placeholder="Montant prévu (MRU)"
              required
              disabled={isVisitorMode}
              className="w-full min-h-[44px] px-3 border border-[#10214b]/10 rounded-xl text-sm outline-none bg-white box-border focus:border-[#356267] focus:ring-2 focus:ring-[#356267]/15 disabled:bg-[#f8fafc] disabled:cursor-not-allowed"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2 mb-2.5">
            <div className="flex-1">
              <input
                type="date"
                value={form.date_debut}
                onChange={e => setForm(prev => ({ ...prev, date_debut: e.target.value }))}
                required
                disabled={isVisitorMode}
                className="w-full min-h-[44px] px-3 border border-[#10214b]/10 rounded-xl text-sm outline-none bg-white box-border focus:border-[#356267] focus:ring-2 focus:ring-[#356267]/15 disabled:bg-[#f8fafc] disabled:cursor-not-allowed"
              />
            </div>
            <div className="flex-1">
              <input
                type="date"
                value={form.date_fin}
                onChange={e => setForm(prev => ({ ...prev, date_fin: e.target.value }))}
                required
                disabled={isVisitorMode}
                className="w-full min-h-[44px] px-3 border border-[#10214b]/10 rounded-xl text-sm outline-none bg-white box-border focus:border-[#356267] focus:ring-2 focus:ring-[#356267]/15 disabled:bg-[#f8fafc] disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <button
              type="button"
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="w-[38px] h-[38px] rounded-xl border-2 border-[#10214b]/10 cursor-pointer flex items-center justify-center text-white text-lg transition-transform hover:scale-105 disabled:cursor-not-allowed"
              style={{ background: form.couleur }}
              title="Choisir une couleur"
              disabled={isVisitorMode}
            >
              <i className="bx bx-palette"></i>
            </button>
            {showColorPicker && !isVisitorMode && (
              <div className="flex gap-1.5 flex-wrap flex-1">
                {COULEURS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => { setForm(prev => ({ ...prev, couleur: c })); setShowColorPicker(false); }}
                    className={`w-[30px] h-[30px] rounded-full cursor-pointer transition-transform hover:scale-110 ${form.couleur === c ? 'ring-2 ring-offset-1 ring-[#10214b] scale-110' : 'ring-0'}`}
                    style={{ background: c }}
                    title={c}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-3">
            <button
              type="submit"
              disabled={loading || categoriesSortie.length === 0 || isVisitorMode}
              className="flex-1 min-h-[44px] rounded-xl font-semibold text-sm flex items-center justify-center gap-1.5 transition-all disabled:cursor-not-allowed disabled:opacity-70"
              style={{
                background: isVisitorMode ? '#e2e8f0' : '#356267',
                color: isVisitorMode ? '#94a3b8' : 'white',
              }}
            >
              {loading ? <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></span> : isVisitorMode ? <><i className='bx bx-lock'></i> Mode Exploration</> : <><i className='bx bx-check'></i> {isEdit ? 'Valider' : 'Créer'}</>}
            </button>
            <button type="button" onClick={onClose} className="flex-1 min-h-[44px] rounded-xl font-semibold text-sm bg-[#f1f5f9] text-[#356267] border border-[#10214b]/10 hover:bg-[#e2e8f0] transition-colors">Annuler</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── PAGE PRINCIPALE BUDGETS ───────────────────────────────────────────────────
export default function Budgets() {
  const navigate = useNavigate();
  const { isVisitor, exitVisitorMode } = useAuth(); // 🆕
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

  const [actionBlockedModal, setActionBlockedModal] = useState({ isOpen: false, message: null });

  const [abonnementExpire, setAbonnementExpire] = useState(false);
  const [abonnementCharge, setAbonnementCharge] = useState(true);

  const [pageMessage, setPageMessage] = useState(null);

  const isVisitorMode = isVisitor; // 🆕

  const categoriesSortie = categories.filter(cat => cat.type === 'sortie' || cat.type === 'depense' || cat.type === 'expense');
  const hasCategoriesSortie = categoriesSortie.length > 0;

  const peutCreerBudget = () => getDailyCount(BUDGET_COUNT_KEY) < BUDGET_DAILY_LIMIT;
  const peutAjouterDepense = () => getDailyCount(DEPENSE_COUNT_KEY) < DEPENSE_DAILY_LIMIT;

  const ouvrirActionBloquee = (actionType = 'signup') => {
    const messages = {
      signup: {
        title: '🔒 Créez un compte',
        message: 'Pour créer ou modifier des budgets, créez un compte en 30 secondes.',
        action: 'Créer un compte',
        actionType: 'signup'
      },
      login: {
        title: '🔐 Connectez-vous',
        message: 'Pour accéder à vos budgets, connectez-vous à votre compte.',
        action: 'Se connecter',
        actionType: 'login'
      }
    };
    setActionBlockedModal({
      isOpen: true,
      message: messages[actionType] || messages.signup,
    });
  };

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

  //  Données mock pour le mode visiteur
  const mockBudgets = [
    { id: 1, categorie_nom: 'Alimentation', montant_prevu: 100000, montant_depense: 45000, couleur: '#d55053', date_debut: '2026-06-01', date_fin: '2026-06-30', pourcentage_utilise: 45 },
    { id: 2, categorie_nom: 'Transport', montant_prevu: 50000, montant_depense: 20000, couleur: '#356267', date_debut: '2026-06-01', date_fin: '2026-06-30', pourcentage_utilise: 40 },
    { id: 3, categorie_nom: 'Utilités', montant_prevu: 75000, montant_depense: 60000, couleur: '#c98a1f', date_debut: '2026-06-01', date_fin: '2026-06-30', pourcentage_utilise: 80 },
    { id: 4, categorie_nom: 'Divertissement', montant_prevu: 40000, montant_depense: 28000, couleur: '#459071', date_debut: '2026-06-01', date_fin: '2026-06-30', pourcentage_utilise: 70 },
  ];

  const chargerDonnees = useCallback(async () => {
    setLoading(true);
    setPageMessage(null);

    //  Si mode visiteur, utiliser les données mock
    if (isVisitorMode) {
      setBudgets(mockBudgets);
      setCategories([
        { id: 1, nom: 'Alimentation', type: 'sortie' },
        { id: 2, nom: 'Transport', type: 'sortie' },
        { id: 3, nom: 'Utilités', type: 'sortie' },
        { id: 4, nom: 'Divertissement', type: 'sortie' },
        { id: 5, nom: 'Salaire', type: 'entree' },
      ]);
      setPageMessage({
        type: 'info',
        text: ' Mode Exploration - Visualisation des budgets de démonstration. Créez un compte pour vos vrais budgets.'
      });
      setLoading(false);
      return;
    }

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
  }, [isVisitorMode]);

  useEffect(() => {
    verifierAbonnement();
    chargerDonnees();
  }, [verifierAbonnement, chargerDonnees]);

  const handleModalMessage = (type, text) => {
    if (type === 'visitor_mode') {
      ouvrirActionBloquee('signup');
      return;
    }
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
    if (isVisitorMode) {
      ouvrirActionBloquee('signup');
      return;
    }
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

  if (abonnementCharge && !isVisitorMode) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#f8fafc]">
        <div className="text-center">
          <div className="w-12 h-12 border-[3px] border-[#c2f2f2] border-t-[#356267] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#356267]/60">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-5 sm:px-6 font-sans">
      {successMsg && <SuccessModal message={successMsg} onClose={() => setSuccessMsg('')} />}
      {limitMessage && <LimitModal message={limitMessage} onClose={() => setLimitMessage(null)} />}

      {/* 🆕 MODAL ACTION BLOQUÉE */}
      <ActionBlockedModal
        isOpen={actionBlockedModal.isOpen}
        onClose={() => setActionBlockedModal({ isOpen: false, message: null })}
        message={actionBlockedModal.message}
      />

      <MessageBanner
        type={pageMessage?.type}
        message={pageMessage?.text}
        onClose={() => setPageMessage(null)}
      />

      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-[28px] shrink-0"
            style={{ background: isVisitorMode ? '#c98a1f' : '#356267' }}
          >
            <i className="bx bx-target-lock"></i>
          </div>
          <div>
            <h1 className="m-0 text-2xl font-extrabold text-[#10214b] tracking-tight flex items-center">
              Budgets
              {isVisitorMode && <span className="text-xs bg-[#fdf6e8] text-[#7a5410] px-2.5 py-0.5 rounded-full font-semibold ml-2">🔍 Démo</span>}
            </h1>
            <p className="m-0 mt-1 text-[#356267]/70 text-sm">{isVisitorMode ? 'Visualisation des budgets de démonstration' : `${budgets.length} budget(s) • ${budgetsEncoursCount} en cours • ${budgetsTerminesCount} terminés • ${budgetsDepasseCount} dépassés`}</p>
          </div>
        </div>
        {hasCategoriesSortie && !isVisitorMode && (
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
            className="bg-[#356267] border-none rounded-full min-h-[44px] px-6 text-white font-semibold text-sm cursor-pointer flex items-center gap-2 transition-all shadow-[0_4px_12px_rgba(53,98,103,0.25)] hover:not(:disabled):-translate-y-0.5 hover:not(:disabled):shadow-[0_6px_20px_rgba(53,98,103,0.35)] disabled:cursor-not-allowed"
            style={{ opacity: abonnementExpire ? 0.6 : 1, cursor: abonnementExpire ? 'not-allowed' : 'pointer' }}
            title={abonnementExpire ? 'Votre abonnement a expiré' : ''}
          >
            <i className="bx bx-plus"></i>
            <span>Nouveau budget</span>
          </button>
        )}
        {isVisitorMode && (
          <button
            onClick={() => ouvrirActionBloquee('signup')}
            className="bg-[#fdf6e8] text-[#7a5410] border-none rounded-full min-h-[44px] px-6 font-semibold text-sm cursor-pointer flex items-center gap-2 hover:bg-[#faedcf] transition-colors"
          >
            <i className="bx bx-lock"></i>
            <span>Créer un compte</span>
          </button>
        )}
      </div>

      {budgets.length > 0 && (
        <>
          <div className="flex gap-2 mb-4 flex-wrap">
            <button onClick={() => setFilterType('all')} className={`flex items-center gap-2 min-h-[44px] px-5 rounded-full border text-sm font-semibold cursor-pointer transition-all ${filterType === 'all' ? 'bg-[#356267] border-transparent text-white shadow-[0_4px_12px_rgba(53,98,103,0.3)]' : 'bg-white border-[#10214b]/10 text-[#356267]/70 hover:border-[#356267] hover:text-[#356267]'}`}>
              <i className="bx bx-list-ul"></i>
              <span>Tous ({budgets.length})</span>
            </button>
            <button onClick={() => setFilterType('encours')} className={`flex items-center gap-2 min-h-[44px] px-5 rounded-full border text-sm font-semibold cursor-pointer transition-all ${filterType === 'encours' ? 'bg-[#356267] border-transparent text-white shadow-[0_4px_12px_rgba(53,98,103,0.3)]' : 'bg-white border-[#10214b]/10 text-[#356267]/70 hover:border-[#356267] hover:text-[#356267]'}`}>
              <i className="bx bx-time"></i>
              <span>En cours ({budgetsEncoursCount})</span>
            </button>
            <button onClick={() => setFilterType('termine')} className={`flex items-center gap-2 min-h-[44px] px-5 rounded-full border text-sm font-semibold cursor-pointer transition-all ${filterType === 'termine' ? 'bg-[#356267] border-transparent text-white shadow-[0_4px_12px_rgba(53,98,103,0.3)]' : 'bg-white border-[#10214b]/10 text-[#356267]/70 hover:border-[#356267] hover:text-[#356267]'}`}>
              <i className="bx bx-check-circle"></i>
              <span>Terminés ({budgetsTerminesCount})</span>
            </button>
            <button onClick={() => setFilterType('depasse')} className={`flex items-center gap-2 min-h-[44px] px-5 rounded-full border text-sm font-semibold cursor-pointer transition-all ${filterType === 'depasse' ? 'bg-[#356267] border-transparent text-white shadow-[0_4px_12px_rgba(53,98,103,0.3)]' : 'bg-white border-[#10214b]/10 text-[#356267]/70 hover:border-[#356267] hover:text-[#356267]'}`}>
              <i className="bx bx-error-circle"></i>
              <span>Dépassés ({budgetsDepasseCount})</span>
            </button>
          </div>

          <div className="mb-5">
            <div className="relative flex items-center bg-white border border-[#10214b]/10 rounded-xl px-3 focus-within:border-[#356267] focus-within:ring-2 focus-within:ring-[#356267]/10 transition-all">
              <i className="bx bx-search text-[#356267]/40 text-xl"></i>
              <input
                type="text"
                placeholder={isVisitorMode ? "Rechercher dans les budgets de démonstration..." : "Rechercher un budget par catégorie..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 min-h-[44px] py-3 px-2 border-none outline-none text-sm bg-transparent text-[#10214b] placeholder:text-[#356267]/40"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="bg-transparent border-none cursor-pointer text-[#356267]/40 px-2 text-xl flex items-center justify-center hover:text-[#d55053] transition-colors">
                  <i className="bx bx-x"></i>
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {!loading && hasCategoriesSortie && budgets.length === 0 && !showQuickCreate && !isVisitorMode && (
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
          className="w-full bg-white border-2 border-dashed border-[#10214b]/15 rounded-2xl min-h-[44px] p-5 cursor-pointer flex items-center justify-center gap-3 text-[#356267] font-semibold text-sm mb-6 transition-all hover:not(:disabled):border-[#356267] hover:not(:disabled):bg-[#f8fafc] hover:not(:disabled):-translate-y-0.5"
          style={{ opacity: abonnementExpire ? 0.6 : 1 }}
        >
          <i className="bx bx-plus-circle text-xl"></i>
          <span>Créer mon premier budget</span>
        </button>
      )}

      {showQuickCreate && !isVisitorMode && (
        <div className="bg-white rounded-2xl p-5 mb-6 border border-[#10214b]/10 shadow-[0_2px_8px_rgba(16,33,75,0.04)]">
          <div className="flex items-center gap-2.5 mb-4 font-bold text-sm text-[#10214b]">
            <i className="bx bx-wallet"></i>
            <span>Nouveau budget</span>
            <button onClick={() => setShowQuickCreate(false)} className="ml-auto bg-transparent border-none cursor-pointer text-[#356267]/50 text-xl">
              <i className="bx bx-x"></i>
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
          }} className="flex flex-col gap-2.5">
            <select name="categorie" required className="min-h-[44px] px-3.5 border border-[#10214b]/10 rounded-xl text-sm outline-none focus:border-[#356267]">
              <option value="">Catégorie de dépense</option>
              {categoriesSortie.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
            <input type="number" name="montant_prevu" placeholder="Montant (MRU)" required step="0.01" min="1" className="min-h-[44px] px-3.5 border border-[#10214b]/10 rounded-xl text-sm outline-none focus:border-[#356267]" />
            <input type="date" name="date_debut" required className="min-h-[44px] px-3.5 border border-[#10214b]/10 rounded-xl text-sm outline-none focus:border-[#356267]" />
            <input type="date" name="date_fin" required className="min-h-[44px] px-3.5 border border-[#10214b]/10 rounded-xl text-sm outline-none focus:border-[#356267]" />
            <button type="submit" className="bg-[#356267] text-white border-none rounded-xl min-h-[44px] font-semibold cursor-pointer flex items-center justify-center gap-2 mt-1 hover:bg-[#2a4f53] transition-colors">
              <i className="bx bx-check"></i> Créer
            </button>
          </form>
        </div>
      )}

      {!loading && !hasCategoriesSortie && !isVisitorMode && (
        <div className="bg-[#fdf6e8] border border-[#e8c27a] rounded-2xl px-5 py-4 mb-6 flex items-center gap-4 flex-wrap">
          <i className="bx bx-category text-[28px] text-[#c98a1f]"></i>
          <div className="flex-1 min-w-[200px]">
            <strong className="text-[#7a5410] text-sm">Créez des catégories de dépense</strong>
            <p className="m-0 mt-0.5 text-xs text-[#7a5410]">Pour créer un budget, vous devez d'abord créer une catégorie de type "Sortie" (dépense).</p>
          </div>
          <button onClick={() => navigate('/categories')} className="bg-[#356267] border-none rounded-full min-h-[44px] px-4.5 text-white text-xs font-semibold cursor-pointer flex items-center gap-1.5 whitespace-nowrap hover:bg-[#2a4f53] transition-colors">
            Créer une catégorie <i className="bx bx-right-arrow-alt"></i>
          </button>
        </div>
      )}

      {budgetsFiltres.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
          <div className="bg-white rounded-2xl px-5 py-4 flex items-center gap-3.5 shadow-[0_2px_8px_rgba(16,33,75,0.04)] border border-[#10214b]/5">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl bg-[#356267]/10 text-[#356267] shrink-0">
              <i className="bx bx-chart"></i>
            </div>
            <div className="min-w-0">
              <span className="block text-[0.7rem] font-semibold text-[#356267]/45 uppercase tracking-wide">Total prévu</span>
              <span className="block text-lg font-extrabold text-[#10214b] truncate">{totalPrevu.toLocaleString('fr-FR')} MRU</span>
            </div>
          </div>
          <div className="bg-white rounded-2xl px-5 py-4 flex items-center gap-3.5 shadow-[0_2px_8px_rgba(16,33,75,0.04)] border border-[#10214b]/5">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl bg-[#d55053]/10 text-[#d55053] shrink-0">
              <i className="bx bx-trending-down"></i>
            </div>
            <div className="min-w-0">
              <span className="block text-[0.7rem] font-semibold text-[#356267]/45 uppercase tracking-wide">Total dépensé</span>
              <span className="block text-lg font-extrabold text-[#10214b] truncate">{totalDepense.toLocaleString('fr-FR')} MRU</span>
            </div>
          </div>
          <div className="bg-white rounded-2xl px-5 py-4 flex items-center gap-3.5 shadow-[0_2px_8px_rgba(16,33,75,0.04)] border border-[#10214b]/5">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl bg-[#4ea674]/10 text-[#4ea674] shrink-0">
              <i className="bx bx-wallet"></i>
            </div>
            <div className="min-w-0">
              <span className="block text-[0.7rem] font-semibold text-[#356267]/45 uppercase tracking-wide">Reste total</span>
              <span className="block text-lg font-extrabold text-[#10214b] truncate">{totalReste.toLocaleString('fr-FR')} MRU</span>
            </div>
          </div>
          <div className="bg-white rounded-2xl px-5 py-4 flex items-center gap-3.5 shadow-[0_2px_8px_rgba(16,33,75,0.04)] border border-[#10214b]/5">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl bg-[#c98a1f]/10 text-[#c98a1f] shrink-0">
              <i className="bx bx-target-lock"></i>
            </div>
            <div className="min-w-0">
              <span className="block text-[0.7rem] font-semibold text-[#356267]/45 uppercase tracking-wide">Total budgets</span>
              <span className="block text-lg font-extrabold text-[#10214b]">{budgetsFiltres.length}</span>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-[#356267]/50">
          <div className="w-10 h-10 mx-auto mb-4 rounded-full border-[3px] border-[#e2e8f0] border-t-[#356267] animate-spin"></div>
          <p>Chargement des budgets...</p>
        </div>
      ) : budgetsFiltres.length === 0 && budgets.length > 0 && filterType !== 'all' ? (
        <div className="text-center py-20 px-5 text-[#356267]/50">
          <i className="bx bx-filter-alt text-6xl text-[#cbd5e1] mb-4 block"></i>
          <h3 className="m-0 mb-2 text-lg text-[#10214b]">Aucun budget {filterType === 'encours' ? 'en cours' : filterType === 'termine' ? 'terminé' : 'dépassé'}</h3>
          <p className="m-0 mb-6 text-sm">Aucun budget ne correspond à ce filtre.</p>
          {filterType !== 'termine' && (
            <button onClick={() => { setFilterType('all'); setSearchTerm(''); }} className="bg-[#356267] border-none rounded-full min-h-[44px] px-7 text-white font-semibold text-sm cursor-pointer inline-flex items-center gap-2 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(53,98,103,0.3)] transition-all">
              <i className="bx bx-list-ul"></i> Voir tous les budgets
            </button>
          )}
        </div>
      ) : budgetsFiltres.length === 0 && searchTerm ? (
        <div className="text-center py-20 px-5 text-[#356267]/50">
          <i className="bx bx-search-alt text-6xl text-[#cbd5e1] mb-4 block"></i>
          <h3 className="m-0 mb-2 text-lg text-[#10214b]">Aucun budget trouvé</h3>
          <p className="m-0 mb-6 text-sm">Aucun budget ne correspond à la recherche "{searchTerm}"</p>
          <button onClick={() => setSearchTerm('')} className="bg-[#356267] border-none rounded-full min-h-[44px] px-7 text-white font-semibold text-sm cursor-pointer inline-flex items-center gap-2 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(53,98,103,0.3)] transition-all">
            <i className="bx bx-reset"></i> Réinitialiser la recherche
          </button>
        </div>
      ) : budgetsFiltres.length === 0 && !showQuickCreate && !isVisitorMode ? (
        <div className="text-center py-20 px-5 text-[#356267]/50">
          <i className="bx bx-target-lock text-6xl text-[#cbd5e1] mb-4 block"></i>
          <h3 className="m-0 mb-2 text-lg text-[#10214b]">Aucun budget</h3>
          <p className="m-0 mb-6 text-sm">Créez votre premier budget pour contrôler vos dépenses</p>
        </div>
      ) : budgetsFiltres.length === 0 && isVisitorMode ? (
        <div className="text-center py-20 px-5 text-[#356267]/50">
          <i className="bx bx-target-lock text-6xl text-[#cbd5e1] mb-4 block"></i>
          <h3 className="m-0 mb-2 text-lg text-[#10214b]">🔍 Données de démonstration</h3>
          <p className="m-0 mb-6 text-sm">Les budgets de démonstration seront bientôt disponibles</p>
          <button onClick={() => ouvrirActionBloquee('signup')} className="border-none rounded-full min-h-[44px] px-7 text-white font-semibold text-sm cursor-pointer inline-flex items-center gap-2 bg-[#c98a1f] hover:-translate-y-0.5 transition-all">
            <i className="bx bx-user-plus"></i> Créer un compte
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {budgetsFiltres.map(budget => {
            const pct = Math.min(parseFloat(budget.pourcentage_utilise || 0), 100);
            const couleur = budget.couleur || '#356267';
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
              badgeClass = 'bg-[#e9f8e7] text-[#2a4f53]';
            } else if (estDepasse) {
              badgeType = 'depasse';
              badgeLabel = 'Dépassé';
              badgeClass = 'bg-[rgba(213,80,83,0.12)] text-[#d55053]';
            } else if (estEncours) {
              badgeType = 'encours';
              badgeLabel = 'En cours';
              badgeClass = 'bg-[#c2f2f2]/50 text-[#2a4f53]';
            }

            return (
              <div
                key={budget.id}
                className={`bg-white rounded-2xl overflow-hidden shadow-[0_2px_12px_rgba(16,33,75,0.06)] border border-[#10214b]/5 border-t-4 transition-all hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(16,33,75,0.12)] ${estDepasse ? 'bg-[rgba(213,80,83,0.03)]' : ''} ${estTermine ? 'opacity-85' : ''}`}
                style={{ borderTopColor: couleur, opacity: isVisitorMode ? 0.9 : undefined }}
              >
                <div className="px-5 pt-[18px] pb-[18px] flex justify-between items-start border-b border-[#f1f5f9] flex-wrap gap-2.5">
                  <div className="flex items-center gap-2 font-bold text-base" style={{ color: couleur }}>
                    <i className="bx bx-category text-lg"></i>
                    <span>{budget.categorie_nom}</span>
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {badgeType && (
                      <div className={`rounded-full px-2.5 py-1 text-[0.65rem] font-semibold flex items-center gap-1 ${badgeClass}`} title={`Budget ${badgeLabel.toLowerCase()}`}>
                        <i className={`bx ${badgeType === 'termine' ? 'bx-check-circle' : badgeType === 'depasse' ? 'bx-error-circle' : 'bx-time'}`}></i>
                        <span>{badgeLabel}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="px-5 py-4 flex items-center justify-around bg-[#fafcff]">
                  <div className="text-center flex-1">
                    <span className="block text-[1.1rem] font-extrabold text-[#10214b]">{parseFloat(budget.montant_prevu).toLocaleString()} MRU</span>
                    <span className="text-[0.65rem] font-semibold text-[#356267]/45 uppercase mt-0.5 block">prévu</span>
                  </div>
                  <div className="w-px h-10 bg-[#e2e8f0]"></div>
                  <div className="text-center flex-1">
                    <span className="block text-[1.1rem] font-extrabold" style={{ color: estDepasse || estTermine ? '#d55053' : couleur }}>
                      {parseFloat(budget.montant_depense).toLocaleString()} MRU
                    </span>
                    <span className="text-[0.65rem] font-semibold text-[#356267]/45 uppercase mt-0.5 block">dépensé</span>
                  </div>
                </div>

                <div className="mx-5 mb-3 bg-[#f1f5f9] rounded-full h-2 overflow-hidden">
                  <div className="h-2 rounded-full transition-all" style={{
                    width: `${pct}%`,
                    background: estDepasse || estTermine ? '#d55053' : (pct > 80 ? '#c98a1f' : couleur)
                  }}></div>
                </div>

                <div className="px-5 pb-4 flex justify-between items-center">
                  <div className="flex items-center gap-1.5 text-sm font-semibold" style={{
                    color: estDepasse || estTermine ? '#d55053' : (reste > 0 ? '#4ea674' : '#c98a1f')
                  }}>
                    <i className="bx bx-wallet"></i>
                    <span>Reste: {reste.toLocaleString()} MRU</span>
                  </div>
                  <span className="text-xs font-semibold text-[#356267]/45">{budget.pourcentage_utilise}% utilisé</span>
                </div>

                <div className="px-5 pt-4 pb-5 flex gap-2 border-t border-[#f1f5f9]">
                  <button
                    onClick={() => {
                      if (isVisitorMode) {
                        ouvrirActionBloquee('signup');
                        return;
                      }
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
                    className="flex-[2] min-h-[44px] border-none rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-1.5 transition-all"
                    style={{
                      background: (isVisitorMode || estDepasse || estTermine || !estModifiable || abonnementExpire) ? '#94a3b8' : couleur,
                      opacity: (isVisitorMode || estDepasse || estTermine || !estModifiable || abonnementExpire) ? 0.6 : 1,
                      cursor: (isVisitorMode || estDepasse || estTermine || !estModifiable || abonnementExpire) ? 'not-allowed' : 'pointer',
                    }}
                    disabled={isVisitorMode || estDepasse || estTermine || !estModifiable || abonnementExpire}
                    title={(isVisitorMode) ? "Mode exploration" : (estDepasse || estTermine || !estModifiable) ? "Ce budget n'est plus actif" : "Ajouter une dépense au budget"}
                  >
                    <i className="bx bx-money"></i>
                    <span>Dépenser</span>
                  </button>
                  <button onClick={() => setDepensesModal(budget)} className="flex-1 min-h-[44px] border-none rounded-xl cursor-pointer text-base bg-[#f1f5f9] text-[#475569] hover:scale-95 transition-transform" title="Voir les dépenses du budget">
                    <i className="bx bx-list-ul"></i>
                  </button>
                  <button
                    onClick={() => {
                      if (isVisitorMode) {
                        ouvrirActionBloquee('signup');
                        return;
                      }
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
                    className="flex-1 min-h-[44px] border-none rounded-xl text-base bg-[#356267]/10 text-[#356267] hover:not(:disabled):scale-95 transition-transform"
                    style={{
                      opacity: (isVisitorMode || !estModifiable || abonnementExpire) ? 0.5 : 1,
                      cursor: (isVisitorMode || !estModifiable || abonnementExpire) ? 'not-allowed' : 'pointer'
                    }}
                    disabled={isVisitorMode || !estModifiable || abonnementExpire}
                    title={isVisitorMode ? "Mode exploration" : !estModifiable ? "Ce budget n'est plus modifiable" : abonnementExpire ? "Votre abonnement a expiré" : "Modifier"}
                  >
                    <i className="bx bx-edit-alt"></i>
                  </button>
                  <button
                    onClick={() => {
                      if (isVisitorMode) {
                        ouvrirActionBloquee('signup');
                        return;
                      }
                      setConfirmSupprId(budget.id);
                    }}
                    className="flex-1 min-h-[44px] border-none rounded-xl text-base bg-[rgba(213,80,83,0.08)] text-[#d55053] hover:not(:disabled):scale-95 transition-transform"
                    style={{
                      opacity: (isVisitorMode || estTermine || abonnementExpire) ? 0.5 : 1,
                      cursor: (isVisitorMode || estTermine || abonnementExpire) ? 'not-allowed' : 'pointer'
                    }}
                    disabled={isVisitorMode || estTermine || abonnementExpire}
                    title={isVisitorMode ? "Mode exploration" : estTermine ? "Impossible de supprimer un budget terminé" : abonnementExpire ? "Votre abonnement a expiré" : "Supprimer"}
                  >
                    <i className="bx bx-trash"></i>
                  </button>
                </div>
              </div>
            );
          })}
          {isVisitorMode && budgetsFiltres.length > 0 && (
            <div className="px-4 py-3 text-center bg-[#fdf6e8] rounded-2xl text-xs text-[#7a5410] font-medium border border-[#e8c27a] col-span-full">
               Données de démonstration - Créez un compte pour gérer vos vrais budgets
            </div>
          )}
        </div>
      )}

      {depenseModal && (
        <DepenseModal
          budget={depenseModal}
          onClose={() => setDepenseModal(null)}
          onSuccess={msg => { setDepenseModal(null); setSuccessMsg(msg); chargerDonnees(); }}
          canSubmit={peutAjouterDepense() && !abonnementExpire}
          isVisitorMode={isVisitorMode}
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
          isVisitorMode={isVisitorMode}
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

      {confirmSupprId && !isVisitorMode && (
        <div className="fixed inset-0 z-[9999] bg-[#10214b]/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setConfirmSupprId(null)}>
          <div className="bg-white rounded-2xl p-6 w-[90%] max-w-[320px] text-center shadow-[0_20px_60px_rgba(16,33,75,0.15)]" onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 bg-[rgba(213,80,83,0.08)] rounded-full flex items-center justify-center mx-auto mb-4 text-[#d55053] text-3xl">
              <i className="bx bx-trash"></i>
            </div>
            <h3 className="m-0 mb-2 text-lg text-[#10214b] font-bold">Supprimer ce budget ?</h3>
            <p className="m-0 mb-6 text-sm text-[#356267]/70">Cette action est irréversible.</p>
            <div className="flex gap-2">
              <button onClick={handleSupprimerBudget} className="flex-1 min-h-[44px] rounded-xl font-semibold text-sm bg-[#d55053] text-white flex items-center justify-center gap-1.5 hover:bg-[#c23e41] transition-colors">
                <i className="bx bx-trash"></i> Supprimer
              </button>
              <button onClick={() => setConfirmSupprId(null)} className="flex-1 min-h-[44px] rounded-xl font-semibold text-sm bg-[#f1f5f9] text-[#356267] border border-[#10214b]/10 hover:bg-[#e2e8f0] transition-colors">Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}