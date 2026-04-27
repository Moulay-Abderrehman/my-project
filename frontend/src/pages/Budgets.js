import React, { useEffect, useState, useCallback } from 'react';
import api from '../api/axios';
import { categorieService } from '../api/categorieService';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

// ── Modale succès ─────────────────────────────────────────────────────────────
function SuccessModal({ message, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 2000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(15,23,42,0.3)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: '#fff', borderRadius: 20, padding: '40px 48px', textAlign: 'center',
        boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
      }}>
        <div style={{ fontSize: 56, marginBottom: 12 }}>✅</div>
        <p style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#1e293b' }}>{message}</p>
      </div>
    </div>
  );
}

// ── Modale dépense budget ─────────────────────────────────────────────────────
function DepenseModal({ budget, onClose, onSuccess }) {
  const [montant, setMontant] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post(`/budgets/${budget.id}/depense/`, { montant: parseFloat(montant), description });
      onSuccess('Dépense enregistrée !');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: '#fff', borderRadius: 18, padding: 32, width: 380,
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      }}>
        <h3 style={{ margin: '0 0 6px', color: '#1e293b' }}>💸 Dépense budget</h3>
        <p style={{ margin: '0 0 20px', fontSize: 13, color: '#64748b' }}>
          Budget : <strong>{budget.categorie_nom}</strong> • Reste : <strong style={{ color: '#10b981' }}>
            {(parseFloat(budget.montant_prevu) - parseFloat(budget.montant_depense)).toLocaleString()} MRU
          </strong>
        </p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input type="number" placeholder="Montant (MRU)" value={montant} onChange={e => setMontant(e.target.value)}
            required min="0.01" step="0.01"
            style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14 }} />
          <input placeholder="Description" value={description} onChange={e => setDescription(e.target.value)}
            style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14 }} />
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button type="submit" disabled={loading} style={{
              flex: 1, background: 'linear-gradient(135deg,#ef4444,#dc2626)', color: '#fff',
              border: 'none', borderRadius: 10, padding: '11px', cursor: 'pointer', fontWeight: 600, fontSize: 14,
            }}>{loading ? 'En cours...' : '✅ Confirmer la dépense'}</button>
            <button type="button" onClick={onClose} style={{
              flex: 1, background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 10,
              padding: '11px', cursor: 'pointer', fontSize: 14, color: '#64748b',
            }}>Annuler</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Modale transactions d'un budget ──────────────────────────────────────────
function BudgetTransactionsModal({ budget, onClose }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/budgets/${budget.id}/`)
      .then(res => setTransactions(res.data.transactions || []))
      .catch(() => toast.error('Erreur chargement transactions'))
      .finally(() => setLoading(false));
  }, [budget.id]);

  const couleur = budget.couleur || '#6366f1';

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: '#fff', borderRadius: 20, padding: 0, width: '90%', maxWidth: 540, maxHeight: '80vh',
        boxShadow: '0 24px 80px rgba(0,0,0,0.22)', display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        <div style={{
          background: `linear-gradient(135deg, ${couleur}22, ${couleur}11)`,
          borderBottom: `3px solid ${couleur}`,
          padding: '22px 28px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <h3 style={{ margin: 0, color: '#1e293b', fontWeight: 800, fontSize: 18 }}>📋 {budget.categorie_nom}</h3>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>Dépenses effectuées dans ce budget</p>
          </div>
          <button onClick={onClose} style={{
            background: '#f1f5f9', border: 'none', borderRadius: 10, padding: '8px 12px',
            cursor: 'pointer', fontSize: 18, color: '#64748b',
          }}>✕</button>
        </div>

        <div style={{ display: 'flex', padding: '14px 28px', gap: 16, borderBottom: '1px solid #f1f5f9' }}>
          {[
            { l: 'Prévu', v: `${parseFloat(budget.montant_prevu).toLocaleString()} MRU`, c: '#1e293b' },
            { l: 'Dépensé', v: `${parseFloat(budget.montant_depense).toLocaleString()} MRU`, c: couleur },
            { l: 'Reste', v: `${(parseFloat(budget.montant_prevu) - parseFloat(budget.montant_depense)).toLocaleString()} MRU`, c: '#10b981' },
          ].map(s => (
            <div key={s.l} style={{ flex: 1, textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>{s.l}</p>
              <p style={{ margin: '4px 0 0', fontWeight: 700, fontSize: 15, color: s.c }}>{s.v}</p>
            </div>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>⏳ Chargement...</div>
          ) : transactions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>💤</div>
              <p>Aucune dépense pour ce budget</p>
            </div>
          ) : transactions.map(t => (
            <div key={t.id} style={{
              display: 'flex', alignItems: 'center', padding: '12px 28px',
              borderBottom: '1px solid #f8fafc', gap: 12,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, flexShrink: 0,
              }}>💸</div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontWeight: 600, fontSize: 13, color: '#1e293b' }}>
                  {t.description || 'Dépense budget'}
                </p>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#94a3b8' }}>
                  {new Date(t.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <span style={{ fontWeight: 700, color: '#ef4444', fontSize: 15 }}>
                -{parseFloat(t.montant).toLocaleString()} MRU
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Modale création/modification budget ───────────────────────────────────────
function BudgetModal({ budget, categories, onClose, onSuccess }) {
  const [form, setForm] = useState({
    categorie: budget?.categorie || '',
    montant_prevu: budget?.montant_prevu || '',
    date_debut: budget?.date_debut || '',
    date_fin: budget?.date_fin || '',
    couleur: budget?.couleur || '#6366f1',
  });
  const [loading, setLoading] = useState(false);

  const isEdit = !!budget;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.categorie) return toast.error('Veuillez sélectionner une catégorie.');
    setLoading(true);
    try {
      if (isEdit) {
        await api.patch(`/budgets/${budget.id}/`, form);
        toast.success('Budget modifié !');
      } else {
        await api.post('/budgets/', form);
        toast.success('Budget créé !');
      }
      onSuccess();
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.non_field_errors?.[0] || 'Erreur';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const inp = {
    width: '100%', padding: '10px 12px', borderRadius: 8,
    border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none',
    boxSizing: 'border-box',
  };

  const COULEURS = ['#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6', '#64748b'];

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div style={{
        background: '#fff', borderRadius: 20, padding: 32, width: 460,
        boxShadow: '0 24px 80px rgba(0,0,0,0.22)',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, color: '#1e293b', fontWeight: 700, fontSize: 18 }}>
            {isEdit ? '✏️ Modifier le budget' : '➕ Nouveau budget'}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#94a3b8' }}>✕</button>
        </div>

        {/* Avertissement si pas de catégories */}
        {categories.length === 0 && (
          <div style={{
            padding: '14px 16px', borderRadius: 10,
            background: '#fff7ed', border: '1.5px solid #fed7aa',
            color: '#c2410c', fontSize: 14, marginBottom: 20,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{ fontSize: 20 }}>⚠️</span>
            <div>
              <strong>Il faut créer des catégories</strong>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: '#92400e' }}>
                Un budget doit être lié à une catégorie.{' '}
                <a href="/categories" style={{ color: '#6366f1', fontWeight: 600 }}>
                  Créer une catégorie →
                </a>
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Catégorie */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 6, textTransform: 'uppercase' }}>
              Catégorie *
            </label>
            <select name="categorie" value={form.categorie}
              onChange={e => setForm(prev => ({ ...prev, categorie: e.target.value }))}
              style={{ ...inp, background: '#fff', cursor: 'pointer' }} required
              disabled={categories.length === 0}
            >
              <option value="">— Sélectionner une catégorie —</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>
                  {c.icone} {c.nom}
                </option>
              ))}
            </select>
          </div>

          {/* Montant prévu */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 6, textTransform: 'uppercase' }}>
              Montant prévu (MRU) *
            </label>
            <input type="number" step="0.01" min="1"
              value={form.montant_prevu}
              onChange={e => setForm(prev => ({ ...prev, montant_prevu: e.target.value }))}
              placeholder="0.00" style={inp} required
              onFocus={e => e.target.style.borderColor = '#6366f1'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>

          {/* Dates */}
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 6, textTransform: 'uppercase' }}>Du *</label>
              <input type="date" value={form.date_debut}
                onChange={e => setForm(prev => ({ ...prev, date_debut: e.target.value }))}
                style={inp} required
                onFocus={e => e.target.style.borderColor = '#6366f1'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 6, textTransform: 'uppercase' }}>Au *</label>
              <input type="date" value={form.date_fin}
                onChange={e => setForm(prev => ({ ...prev, date_fin: e.target.value }))}
                style={inp} required
                onFocus={e => e.target.style.borderColor = '#6366f1'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>
          </div>

          {/* Couleur */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 8, textTransform: 'uppercase' }}>Couleur</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {COULEURS.map(c => (
                <button key={c} type="button" onClick={() => setForm(prev => ({ ...prev, couleur: c }))}
                  style={{
                    width: 28, height: 28, borderRadius: '50%', border: `3px solid`,
                    borderColor: form.couleur === c ? '#1e293b' : 'transparent',
                    background: c, cursor: 'pointer',
                    transform: form.couleur === c ? 'scale(1.2)' : 'scale(1)',
                    transition: 'transform 0.12s',
                  }} />
              ))}
            </div>
          </div>

          {/* Boutons */}
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button type="submit" disabled={loading || categories.length === 0} style={{
              flex: 2, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
              color: '#fff', border: 'none', borderRadius: 10, padding: '12px',
              cursor: (loading || categories.length === 0) ? 'not-allowed' : 'pointer',
              fontWeight: 700, fontSize: 14, opacity: (loading || categories.length === 0) ? 0.6 : 1,
            }}>
              {loading ? '⏳ En cours...' : (isEdit ? '✅ Modifier' : '✅ Créer le budget')}
            </button>
            <button type="button" onClick={onClose} style={{
              flex: 1, background: '#f1f5f9', border: '1px solid #e2e8f0',
              borderRadius: 10, padding: '12px', cursor: 'pointer', fontSize: 14, color: '#64748b',
            }}>Annuler</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Page principale Budgets ───────────────────────────────────────────────────
export default function Budgets() {
  const navigate = useNavigate();
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');
  const [depenseModal, setDepenseModal] = useState(null);
  const [txModal, setTxModal] = useState(null);
  const [budgetModal, setBudgetModal] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [confirmSupprId, setConfirmSupprId] = useState(null);

  const chargerDonnees = useCallback(async () => {
    setLoading(true);
    try {
      const [bRes, cRes] = await Promise.all([
        api.get('/budgets/'),
        categorieService.getAll(),
      ]);
      setBudgets(bRes.data.results || bRes.data);
      setCategories(cRes.data || []);
    } catch (err) {
      if (err.response?.status !== 403) {
        toast.error('Erreur lors du chargement des budgets.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    chargerDonnees();
  }, [chargerDonnees]);

  const handleSupprimerBudget = async () => {
    try {
      await api.delete(`/budgets/${confirmSupprId}/`);
      toast.success('Budget supprimé.');
      setConfirmSupprId(null);
      chargerDonnees();
    } catch {
      toast.error('Erreur lors de la suppression.');
    }
  };

  const totalPrevu = budgets.reduce((s, b) => s + parseFloat(b.montant_prevu || 0), 0);
  const totalDepense = budgets.reduce((s, b) => s + parseFloat(b.montant_depense || 0), 0);

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '8px 0' }}>
      {successMsg && <SuccessModal message={successMsg} onClose={() => setSuccessMsg('')} />}

      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#1e293b' }}>🎯 Mes Budgets</h2>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>
            Planifiez et contrôlez vos dépenses par catégorie
          </p>
        </div>
        <button onClick={() => { setBudgetModal({}); setIsCreating(true); }} style={{
          background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
          color: '#fff', border: 'none', borderRadius: 12, padding: '11px 22px',
          cursor: 'pointer', fontWeight: 700, fontSize: 14,
          boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
        }}>
          ➕ Nouveau budget
        </button>
      </div>

      {/* Avertissement si pas de catégories */}
      {!loading && categories.length === 0 && (
        <div style={{
          background: '#fff7ed', border: '1.5px solid #fed7aa',
          borderRadius: 14, padding: '18px 22px', marginBottom: 24,
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <span style={{ fontSize: 28 }}>⚠️</span>
          <div style={{ flex: 1 }}>
            <strong style={{ color: '#c2410c', fontSize: 15 }}>Il faut créer des catégories</strong>
            <p style={{ margin: '4px 0 0', color: '#92400e', fontSize: 13 }}>
              Pour créer un budget, vous devez d'abord créer au moins une catégorie. Les catégories permettent d'organiser vos dépenses.
            </p>
          </div>
          <button onClick={() => navigate('/categories')} style={{
            background: '#6366f1', color: '#fff', border: 'none',
            borderRadius: 10, padding: '10px 18px', cursor: 'pointer', fontWeight: 700, fontSize: 13,
            whiteSpace: 'nowrap',
          }}>
            🗂️ Créer des catégories →
          </button>
        </div>
      )}

      {/* Stats globales */}
      {budgets.length > 0 && (
        <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
          {[
            { label: 'Total prévu', val: totalPrevu, color: '#6366f1', icon: '📋' },
            { label: 'Total dépensé', val: totalDepense, color: '#ef4444', icon: '💸' },
            { label: 'Restant', val: totalPrevu - totalDepense, color: '#10b981', icon: '💰' },
          ].map(s => (
            <div key={s.label} style={{
              flex: 1, minWidth: 160, background: '#fff', borderRadius: 14, padding: '16px 20px',
              boxShadow: '0 1px 8px rgba(0,0,0,0.06)', border: `1.5px solid ${s.color}20`,
            }}>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
                {s.icon} {s.label}
              </p>
              <p style={{ margin: '4px 0 0', fontWeight: 800, fontSize: 20, color: s.color }}>
                {s.val.toLocaleString('fr-FR')} MRU
              </p>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>⏳</div><p>Chargement...</p>
        </div>
      ) : budgets.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>🎯</div>
          <p style={{ fontSize: 16, fontWeight: 600, color: '#1e293b' }}>Aucun budget actif</p>
          <p style={{ fontSize: 13, marginBottom: 20 }}>Créez votre premier budget pour contrôler vos dépenses</p>
          {categories.length > 0 && (
            <button onClick={() => { setBudgetModal({}); setIsCreating(true); }} style={{
              background: '#6366f1', color: '#fff', border: 'none', borderRadius: 10,
              padding: '12px 24px', cursor: 'pointer', fontWeight: 600, fontSize: 14,
            }}>
              ➕ Créer mon premier budget
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
          {budgets.map(budget => {
            const pct = Math.min(parseFloat(budget.pourcentage_utilise || 0), 100);
            const couleur = budget.couleur || '#6366f1';
            const depasse = budget.est_depasse;

            return (
              <div key={budget.id} style={{
                background: '#fff', borderRadius: 18, overflow: 'hidden',
                boxShadow: '0 2px 16px rgba(0,0,0,0.07)',
                border: depasse ? '2px solid #fee2e2' : `1.5px solid ${couleur}20`,
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 2px 16px rgba(0,0,0,0.07)'; }}
              >
                {/* Header budget */}
                <div style={{
                  background: `linear-gradient(135deg, ${couleur}22, ${couleur}11)`,
                  borderBottom: `3px solid ${couleur}`,
                  padding: '18px 22px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                }}>
                  <div>
                    <h3 style={{ margin: 0, fontWeight: 800, fontSize: 17, color: '#1e293b' }}>
                      {budget.categorie_nom}
                    </h3>
                    <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>
                      {budget.date_debut} → {budget.date_fin}
                    </p>
                  </div>
                  {depasse && (
                    <span style={{
                      background: '#fee2e2', color: '#ef4444', borderRadius: 8,
                      padding: '4px 10px', fontSize: 12, fontWeight: 700,
                    }}>🚨 Dépassé</span>
                  )}
                </div>

                {/* Corps budget */}
                <div style={{ padding: '18px 22px' }}>
                  {/* Stats */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                    <div>
                      <p style={{ margin: 0, fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Prévu</p>
                      <p style={{ margin: '2px 0 0', fontWeight: 700, fontSize: 16, color: '#1e293b' }}>
                        {parseFloat(budget.montant_prevu).toLocaleString()} MRU
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: 0, fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Dépensé</p>
                      <p style={{ margin: '2px 0 0', fontWeight: 700, fontSize: 16, color: depasse ? '#ef4444' : couleur }}>
                        {parseFloat(budget.montant_depense).toLocaleString()} MRU
                      </p>
                    </div>
                  </div>

                  {/* Barre de progression */}
                  <div style={{ background: '#f1f5f9', borderRadius: 20, height: 10, marginBottom: 10 }}>
                    <div style={{
                      height: 10, borderRadius: 20,
                      width: `${pct}%`,
                      background: depasse
                        ? 'linear-gradient(90deg,#ef4444,#dc2626)'
                        : pct > 80
                          ? 'linear-gradient(90deg,#f59e0b,#d97706)'
                          : `linear-gradient(90deg,${couleur},${couleur}bb)`,
                      transition: 'width 0.5s',
                    }} />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                    <span style={{ fontSize: 12, color: '#94a3b8' }}>
                      {budget.pourcentage_utilise}% utilisé
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#10b981' }}>
                      Reste : {(parseFloat(budget.montant_prevu) - parseFloat(budget.montant_depense)).toLocaleString()} MRU
                    </span>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button onClick={() => setDepenseModal(budget)} style={{
                      flex: 1, background: `linear-gradient(135deg,${couleur},${couleur}bb)`,
                      color: '#fff', border: 'none', borderRadius: 10, padding: '9px',
                      cursor: 'pointer', fontSize: 13, fontWeight: 600,
                    }}>💸 Dépenser</button>
                    <button onClick={() => setTxModal(budget)} style={{
                      flex: 1, background: '#f1f5f9', color: '#475569', border: 'none',
                      borderRadius: 10, padding: '9px', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                    }}>📋 Voir dépenses</button>
                    <button onClick={() => { setBudgetModal(budget); setIsCreating(false); }} style={{
                      background: '#eef2ff', color: '#6366f1', border: 'none',
                      borderRadius: 10, padding: '9px 12px', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                    }}>✏️</button>
                    <button onClick={() => setConfirmSupprId(budget.id)} style={{
                      background: '#fef2f2', color: '#ef4444', border: 'none',
                      borderRadius: 10, padding: '9px 12px', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                    }}>🗑</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modales */}
      {depenseModal && (
        <DepenseModal
          budget={depenseModal}
          onClose={() => setDepenseModal(null)}
          onSuccess={msg => { setDepenseModal(null); setSuccessMsg(msg); chargerDonnees(); }}
        />
      )}
      {txModal && (
        <BudgetTransactionsModal budget={txModal} onClose={() => setTxModal(null)} />
      )}
      {budgetModal !== null && (
        <BudgetModal
          budget={isCreating ? null : budgetModal}
          categories={categories}
          onClose={() => { setBudgetModal(null); setIsCreating(false); }}
          onSuccess={() => { setBudgetModal(null); setIsCreating(false); chargerDonnees(); }}
        />
      )}

      {/* Confirmation suppression */}
      {confirmSupprId && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: '#fff', borderRadius: 18, padding: 32, width: 380, textAlign: 'center',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🗑️</div>
            <h3 style={{ margin: '0 0 8px', color: '#1e293b', fontWeight: 700 }}>Supprimer le budget ?</h3>
            <p style={{ margin: '0 0 24px', color: '#64748b', fontSize: 14 }}>Cette action est irréversible.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={handleSupprimerBudget} style={{
                flex: 1, background: 'linear-gradient(135deg,#ef4444,#dc2626)',
                color: '#fff', border: 'none', borderRadius: 10, padding: '12px',
                cursor: 'pointer', fontWeight: 700,
              }}>🗑️ Supprimer</button>
              <button onClick={() => setConfirmSupprId(null)} style={{
                flex: 1, background: '#f1f5f9', border: '1px solid #e2e8f0',
                borderRadius: 10, padding: '12px', cursor: 'pointer', color: '#64748b',
              }}>Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}