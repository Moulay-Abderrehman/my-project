import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';

export default function ToutesTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtreType, setFiltreType] = useState('');
  const [filtreSource, setFiltreSource] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Récupère TOUTES les transactions sans filtre is_visible
    api.get('/transactions/toutes/').then(res => {
      setTransactions(res.data.results || res.data);
    }).finally(() => setLoading(false));
  }, []);

  const filtrees = transactions.filter(t => {
    if (filtreType && t.type !== filtreType) return false;
    if (filtreSource && t.source !== filtreSource) return false;
    return true;
  });

  const totalEntrees = filtrees.filter(t => t.type === 'entree').reduce((s, t) => s + parseFloat(t.montant), 0);
  const totalSorties = filtrees.filter(t => t.type === 'sortie').reduce((s, t) => s + parseFloat(t.montant), 0);

  return (
    <div>
      <style>{`
        tr.t-row:hover td { background: #fafbff; }
      `}</style>

      {/* Entête */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <button onClick={() => navigate('/dashboard')} style={{
          background: '#f1f5f9', border: 'none', borderRadius: 10,
          padding: '8px 16px', cursor: 'pointer', fontSize: 14, color: '#475569',
          display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600,
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.background='#e2e8f0'}
        onMouseLeave={e => e.currentTarget.style.background='#f1f5f9'}
        >← Retour</button>
        <h2 style={{ margin: 0, color: '#1e293b', fontWeight: 800, fontSize: 24 }}>📋 Toutes les transactions</h2>
        <span style={{ background: '#eef2ff', color: '#6366f1', borderRadius: 20, padding: '4px 14px', fontSize: 13, fontWeight: 700 }}>
          {filtrees.length} au total
        </span>
      </div>

      {/* Info */}
      <div style={{ background: '#eff6ff', borderRadius: 10, padding: '12px 18px', marginBottom: 20, fontSize: 13, color: '#1d4ed8', border: '1px solid #bfdbfe' }}>
        ℹ️ Cette page affiche <strong>toutes</strong> les transactions sans exception — y compris celles supprimées de la page Transactions (masquées) et les dépenses budgets. Aucune modification possible ici.
      </div>

      {/* Cartes résumé */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { l: 'Total transactions', v: filtrees.length, suffix: '', c: '#6366f1', bg: '#eef2ff' },
          { l: 'Total entrées', v: totalEntrees.toLocaleString(), suffix: ' MRU', c: '#10b981', bg: '#ecfdf5' },
          { l: 'Total sorties', v: totalSorties.toLocaleString(), suffix: ' MRU', c: '#ef4444', bg: '#fef2f2' },
        ].map(card => (
          <div key={card.l} style={{ background: card.bg, borderRadius: 12, padding: '16px 20px', borderLeft: `4px solid ${card.c}` }}>
            <p style={{ margin: 0, fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>{card.l}</p>
            <p style={{ margin: '6px 0 0', fontWeight: 700, fontSize: 20, color: card.c }}>{card.v}{card.suffix}</p>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div style={{ background: '#fff', borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>Filtrer :</span>
        <select value={filtreType} onChange={e => setFiltreType(e.target.value)}
          style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }}>
          <option value="">Tous les types</option>
          <option value="entree">↑ Entrées</option>
          <option value="sortie">↓ Sorties</option>
        </select>
        <select value={filtreSource} onChange={e => setFiltreSource(e.target.value)}
          style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }}>
          <option value="">Toutes sources</option>
          <option value="manuel">✏️ Manuel</option>
          <option value="budget">🎯 Budget</option>
        </select>
        <button onClick={() => { setFiltreType(''); setFiltreSource(''); }}
          style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontSize: 13 }}>✕ Réinitialiser</button>
      </div>

      {/* Tableau */}
      <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'linear-gradient(135deg,#f8fafc,#f1f5f9)' }}>
              {['Type', 'Montant', 'Catégorie', 'Description', 'Source', 'Date', 'Statut'].map(h => (
                <th key={h} style={{ padding: '13px 16px', textAlign: 'left', fontSize: 12, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 50, color: '#94a3b8' }}>
                <div style={{ fontSize: 32 }}>⏳</div><p>Chargement...</p>
              </td></tr>
            ) : filtrees.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
                <div style={{ fontSize: 40 }}>📋</div><p>Aucune transaction</p>
              </td></tr>
            ) : filtrees.map((t, idx) => (
              <tr key={t.id} className="t-row" style={{
                borderTop: idx > 0 ? '1px solid #f1f5f9' : 'none',
                opacity: t.is_visible ? 1 : 0.65,
              }}>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{
                    background: t.type === 'entree' ? '#ecfdf5' : '#fef2f2',
                    color: t.type === 'entree' ? '#10b981' : '#ef4444',
                    borderRadius: 8, padding: '3px 10px', fontSize: 12, fontWeight: 700,
                  }}>
                    {t.type === 'entree' ? '↑ Entrée' : '↓ Sortie'}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', fontWeight: 700, fontSize: 14, color: t.type === 'entree' ? '#10b981' : '#ef4444' }}>
                  {t.type === 'entree' ? '+' : '-'}{parseFloat(t.montant).toLocaleString()} MRU
                </td>
                <td style={{ padding: '12px 16px', fontSize: 13 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: t.categorie_detail?.couleur || '#6366f1', flexShrink: 0 }}/>
                    {t.categorie_detail ? `${t.categorie_detail.icone || ''} ${t.categorie_detail.nom}` : '—'}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', fontSize: 13, color: '#64748b', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {t.description || '—'}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{
                    background: t.source === 'budget' ? '#fef3c7' : '#eef2ff',
                    color: t.source === 'budget' ? '#d97706' : '#6366f1',
                    borderRadius: 8, padding: '3px 10px', fontSize: 12, fontWeight: 600,
                  }}>
                    {t.source === 'budget' ? '🎯 Budget' : '✏️ Manuel'}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', fontSize: 13, color: '#64748b' }}>
                  {new Date(t.date_creation).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  {t.is_visible ? (
                    <span style={{ background: '#ecfdf5', color: '#10b981', borderRadius: 8, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>✅ Active</span>
                  ) : (
                    <span style={{ background: '#f1f5f9', color: '#94a3b8', borderRadius: 8, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>🗑 Masquée</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}