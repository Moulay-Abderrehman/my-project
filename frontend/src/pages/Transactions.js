import React, { useEffect, useState, useCallback } from 'react';
import api from '../api/axios';
import { categorieService } from '../api/categorieService';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

// ── Modal de création/modification ────────────────────────────────────────────
function TransactionModal({ transaction, onClose, onSuccess, categories }) {
  const [form, setForm] = useState({
    type: transaction?.type || 'entree',
    montant: transaction?.montant || '',
    description: transaction?.description || '',
    categorie: transaction?.categorie || '',
  });
  const [loading, setLoading] = useState(false);

  const isEdit = !!transaction;

  // Filtrer les catégories selon le type sélectionné
  const categoriesFiltrees = categories.filter(c =>
    c.type === form.type || c.type === 'les_deux'
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value,
      // Réinitialiser la catégorie si le type change
      ...(name === 'type' ? { categorie: '' } : {}),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.montant || parseFloat(form.montant) <= 0) {
      return toast.error('Le montant doit être positif.');
    }
    setLoading(true);
    try {
      const payload = {
        type: form.type,
        montant: parseFloat(form.montant),
        description: form.description,
        categorie: form.categorie || null,
      };
      if (isEdit) {
        await api.patch(`/transactions/${transaction.id}/`, payload);
        toast.success('Transaction modifiée !');
      } else {
        await api.post('/transactions/', payload);
        toast.success('Transaction créée !');
      }
      onSuccess();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Erreur lors de l\'opération.';
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
            {isEdit ? '✏️ Modifier la transaction' : '➕ Nouvelle transaction'}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#94a3b8' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Type */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 8, textTransform: 'uppercase' }}>Type</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { val: 'entree', label: '↑ Entrée', color: '#10b981' },
                { val: 'sortie', label: '↓ Sortie', color: '#ef4444' },
              ].map(opt => (
                <button key={opt.val} type="button"
                  onClick={() => setForm(prev => ({ ...prev, type: opt.val, categorie: '' }))}
                  style={{
                    flex: 1, padding: '10px', borderRadius: 10,
                    border: `2px solid ${form.type === opt.val ? opt.color : '#e2e8f0'}`,
                    background: form.type === opt.val ? opt.color + '15' : '#fff',
                    color: form.type === opt.val ? opt.color : '#64748b',
                    cursor: 'pointer', fontWeight: 700, fontSize: 14, transition: 'all 0.15s',
                  }}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Montant */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 6, textTransform: 'uppercase' }}>Montant (MRU) *</label>
            <input name="montant" type="number" step="0.01" min="0.01"
              value={form.montant} onChange={handleChange}
              placeholder="0.00" style={inp} required
              onFocus={e => e.target.style.borderColor = '#6366f1'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>

          {/* Catégorie */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 6, textTransform: 'uppercase' }}>
              Catégorie <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optionnel)</span>
            </label>
            {categories.length === 0 ? (
              <div style={{
                padding: '12px 14px', borderRadius: 8,
                background: '#fff7ed', border: '1.5px solid #fed7aa',
                color: '#c2410c', fontSize: 13,
              }}>
                ⚠️ Aucune catégorie disponible.{' '}
                <a href="/categories" style={{ color: '#6366f1', fontWeight: 600 }}>
                  Créez une catégorie
                </a>{' '}
                pour organiser vos transactions.
              </div>
            ) : (
              <select name="categorie" value={form.categorie} onChange={handleChange}
                style={{ ...inp, background: '#fff', cursor: 'pointer' }}>
                <option value="">— Sans catégorie —</option>
                {categoriesFiltrees.length === 0 ? (
                  <option disabled>Aucune catégorie pour ce type</option>
                ) : (
                  categoriesFiltrees.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.icone} {c.nom}
                    </option>
                  ))
                )}
              </select>
            )}
          </div>

          {/* Description */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 6, textTransform: 'uppercase' }}>Description</label>
            <textarea name="description" value={form.description} onChange={handleChange}
              placeholder="Description optionnelle..."
              rows={3}
              style={{ ...inp, resize: 'vertical', fontFamily: 'inherit' }}
              onFocus={e => e.target.style.borderColor = '#6366f1'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>

          {/* Boutons */}
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button type="submit" disabled={loading} style={{
              flex: 2,
              background: form.type === 'entree'
                ? 'linear-gradient(135deg,#10b981,#059669)'
                : 'linear-gradient(135deg,#ef4444,#dc2626)',
              color: '#fff', border: 'none', borderRadius: 10, padding: '12px',
              cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 14,
              opacity: loading ? 0.7 : 1,
            }}>
              {loading ? '⏳ En cours...' : (isEdit ? '✅ Modifier' : '✅ Créer')}
            </button>
            <button type="button" onClick={onClose} style={{
              flex: 1, background: '#f1f5f9', border: '1px solid #e2e8f0',
              borderRadius: 10, padding: '12px', cursor: 'pointer', fontSize: 14, color: '#64748b',
            }}>
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Page principale ────────────────────────────────────────────────────────────
export default function Transactions() {
 // const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOuvert, setModalOuvert] = useState(false);
  const [transactionEdit, setTransactionEdit] = useState(null);
  const [confirmSupprId, setConfirmSupprId] = useState(null);
  const [filtres, setFiltres] = useState({ type: '', date_debut: '', date_fin: '' });

  const chargerDonnees = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filtres.type) params.type = filtres.type;
      if (filtres.date_debut) params.date_debut = filtres.date_debut;
      if (filtres.date_fin) params.date_fin = filtres.date_fin;

      const [txRes, catRes] = await Promise.all([
        api.get('/transactions/', { params }),
        categorieService.getAll(),
      ]);

      setTransactions(txRes.data.results || txRes.data);
      setCategories(catRes.data || []);
    } catch (err) {
      toast.error('Erreur lors du chargement des transactions.');
    } finally {
      setLoading(false);
    }
  }, [filtres]);

  useEffect(() => {
    chargerDonnees();
  }, [chargerDonnees]);

  const ouvrirCreation = () => {
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
      toast.success('Transaction supprimée (déplacée dans l\'historique).');
      setConfirmSupprId(null);
      chargerDonnees();
    } catch {
      toast.error('Erreur lors de la suppression.');
    }
  };

  const totalEntrees = transactions.filter(t => t.type === 'entree').reduce((s, t) => s + parseFloat(t.montant), 0);
  const totalSorties = transactions.filter(t => t.type === 'sortie').reduce((s, t) => s + parseFloat(t.montant), 0);

  const inp = {
    padding: '10px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0',
    fontSize: 13, outline: 'none', background: '#fff',
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '8px 0' }}>
      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#1e293b' }}>💸 Mes Transactions</h2>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>
            Gérez vos entrées et sorties • Les suppressions restent dans l'historique
          </p>
        </div>
        <button onClick={ouvrirCreation} style={{
          background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
          color: '#fff', border: 'none', borderRadius: 12, padding: '11px 22px',
          cursor: 'pointer', fontWeight: 700, fontSize: 14,
          boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
        }}>
          ➕ Nouvelle transaction
        </button>
      </div>

      {/* Stats rapides */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { label: 'Entrées visibles', val: totalEntrees, color: '#10b981', icon: '↑' },
          { label: 'Sorties visibles', val: totalSorties, color: '#ef4444', icon: '↓' },
          { label: 'Solde visible', val: totalEntrees - totalSorties, color: '#6366f1', icon: '=' },
        ].map(s => (
          <div key={s.label} style={{
            flex: 1, minWidth: 160,
            background: '#fff', borderRadius: 14, padding: '16px 20px',
            boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
            border: `1.5px solid ${s.color}20`,
          }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>{s.label}</p>
            <p style={{ margin: '4px 0 0', fontWeight: 800, fontSize: 20, color: s.color }}>
              {s.icon} {Math.abs(s.val).toLocaleString('fr-FR')} MRU
            </p>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: 1, minWidth: 140 }}>
          <label style={{ display: 'block', fontSize: 11, color: '#64748b', fontWeight: 600, marginBottom: 5, textTransform: 'uppercase' }}>Type</label>
          <select value={filtres.type} onChange={e => setFiltres({ ...filtres, type: e.target.value })}
            style={{ ...inp, width: '100%' }}>
            <option value="">Tous</option>
            <option value="entree">↑ Entrées</option>
            <option value="sortie">↓ Sorties</option>
          </select>
        </div>
        <div style={{ flex: 1, minWidth: 140 }}>
          <label style={{ display: 'block', fontSize: 11, color: '#64748b', fontWeight: 600, marginBottom: 5, textTransform: 'uppercase' }}>Du</label>
          <input type="date" value={filtres.date_debut} onChange={e => setFiltres({ ...filtres, date_debut: e.target.value })} style={inp} />
        </div>
        <div style={{ flex: 1, minWidth: 140 }}>
          <label style={{ display: 'block', fontSize: 11, color: '#64748b', fontWeight: 600, marginBottom: 5, textTransform: 'uppercase' }}>Au</label>
          <input type="date" value={filtres.date_fin} onChange={e => setFiltres({ ...filtres, date_fin: e.target.value })} style={inp} />
        </div>
        <button onClick={() => setFiltres({ type: '', date_debut: '', date_fin: '' })} style={{
          background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 8,
          padding: '10px 16px', cursor: 'pointer', fontSize: 13, color: '#64748b', fontWeight: 600,
        }}>
          ↺ Réinitialiser
        </button>
      </div>

      {/* Tableau */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#94a3b8' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>⏳</div>
          <p>Chargement...</p>
        </div>
      ) : transactions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>💸</div>
          <p style={{ fontSize: 16 }}>Aucune transaction trouvée</p>
          <button onClick={ouvrirCreation} style={{
            background: '#6366f1', color: '#fff', border: 'none', borderRadius: 10,
            padding: '10px 24px', cursor: 'pointer', fontWeight: 600, fontSize: 14,
          }}>
            Créer ma première transaction
          </button>
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'linear-gradient(135deg,#f8fafc,#f1f5f9)' }}>
                {['Type', 'Montant', 'Catégorie', 'Date', 'Description', 'Actions'].map(h => (
                  <th key={h} style={{
                    padding: '12px 16px', textAlign: 'left',
                    fontSize: 11, fontWeight: 700, color: '#64748b',
                    textTransform: 'uppercase', letterSpacing: '0.5px',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transactions.map((t, i) => (
                <tr key={t.id} style={{
                  borderTop: '1px solid #f1f5f9',
                  background: i % 2 === 0 ? '#fff' : '#fafbff',
                  transition: 'background 0.12s',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f0f4ff'}
                  onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#fafbff'}
                >
                  <td style={{ padding: '13px 16px' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                      background: t.type === 'entree' ? '#ecfdf5' : '#fef2f2',
                      color: t.type === 'entree' ? '#10b981' : '#ef4444',
                    }}>
                      {t.type === 'entree' ? '↑' : '↓'} {t.type === 'entree' ? 'Entrée' : 'Sortie'}
                    </span>
                  </td>
                  <td style={{ padding: '13px 16px', fontWeight: 700, fontSize: 15, color: t.type === 'entree' ? '#10b981' : '#ef4444' }}>
                    {t.type === 'entree' ? '+' : '-'}{parseFloat(t.montant).toLocaleString()} MRU
                  </td>
                  <td style={{ padding: '13px 16px', fontSize: 13, color: '#475569' }}>
                    {t.categorie_detail
                      ? <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: t.categorie_detail.couleur || '#6366f1', display: 'inline-block' }} />
                          {t.categorie_detail.icone || ''} {t.categorie_detail.nom}
                        </span>
                      : <span style={{ color: '#cbd5e1' }}>—</span>}
                  </td>
                  <td style={{ padding: '13px 16px', fontSize: 13, color: '#64748b' }}>
                    {new Date(t.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td style={{ padding: '13px 16px', fontSize: 13, color: '#64748b', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.description || <span style={{ color: '#cbd5e1' }}>—</span>}
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => ouvrirModification(t)} style={{
                        background: '#f0f4ff', color: '#6366f1', border: 'none', borderRadius: 7,
                        padding: '6px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                      }}>✏️ Modifier</button>
                      <button onClick={() => confirmerSuppression(t.id)} style={{
                        background: '#fef2f2', color: '#ef4444', border: 'none', borderRadius: 7,
                        padding: '6px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                      }}>🗑 Supprimer</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: '#94a3b8' }}>
        {transactions.length} transaction(s) affichée(s) • Les transactions supprimées restent dans{' '}
        <a href="/toutes-transactions" style={{ color: '#6366f1' }}>Toutes les transactions</a>
      </p>

      {/* Modal transaction */}
      {modalOuvert && (
        <TransactionModal
          transaction={transactionEdit}
          categories={categories}
          onClose={() => { setModalOuvert(false); setTransactionEdit(null); }}
          onSuccess={() => { setModalOuvert(false); setTransactionEdit(null); chargerDonnees(); }}
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
            <h3 style={{ margin: '0 0 8px', color: '#1e293b', fontWeight: 700 }}>Supprimer la transaction ?</h3>
            <p style={{ margin: '0 0 24px', color: '#64748b', fontSize: 14 }}>
              Elle sera masquée ici mais restera visible dans <strong>Toutes les transactions</strong>.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={handleSupprimer} style={{
                flex: 1, background: 'linear-gradient(135deg,#ef4444,#dc2626)',
                color: '#fff', border: 'none', borderRadius: 10, padding: '12px',
                cursor: 'pointer', fontWeight: 700,
              }}>🗑️ Confirmer</button>
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