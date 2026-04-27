import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

// ── Couleurs graphiques ───────────────────────────────────────────────────────
const COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899','#14b8a6','#f97316','#84cc16'];

// ── Tooltip personnalisé ─────────────────────────────────────────────────────
const TooltipCustom = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 14px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', fontSize: 13 }}>
      <p style={{ margin: '0 0 4px', fontWeight: 700, color: '#1e293b' }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ margin: '2px 0', color: p.color, fontWeight: 600 }}>
          {p.name} : {parseFloat(p.value).toLocaleString()} MRU
        </p>
      ))}
    </div>
  );
};

// ── Carte stat ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, color, sub }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 16, padding: '20px 24px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      borderLeft: `4px solid ${color}`,
      display: 'flex', alignItems: 'center', gap: 16,
    }}>
      <div style={{ width: 48, height: 48, borderRadius: 14, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
        <div style={{ fontSize: 22, fontWeight: 800, color, marginTop: 2 }}>{value}</div>
        {sub && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { estExpire } = useAuth();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const expire = estExpire();

  useEffect(() => {
    api.get('/transactions/dashboard/')
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, flexDirection: 'column', gap: 12 }}>
      <div style={{ width: 40, height: 40, border: '3px solid #e2e8f0', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <p style={{ color: '#94a3b8', fontSize: 14 }}>Chargement du tableau de bord...</p>
    </div>
  );

  if (!data) return (
    <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>📊</div>
      <p style={{ fontSize: 16 }}>Impossible de charger le tableau de bord</p>
      <button onClick={() => window.location.reload()} style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', cursor: 'pointer', fontWeight: 700, marginTop: 12 }}>
        Réessayer
      </button>
    </div>
  );

  const solde    = data.solde || {};
  const entrees  = parseFloat(solde.total_entrees || 0);
  const sorties  = parseFloat(solde.total_sorties || 0);
  const balance  = parseFloat(solde.montant_total || 0);
  const nbTrans  = data.nombre_transactions || 0;

  // Préparer données graphique barres (par mois)
  const moisMap = {};
  (data.par_mois || []).forEach(item => {
    const mois = item.mois ? new Date(item.mois).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }) : '?';
    if (!moisMap[mois]) moisMap[mois] = { mois, entrees: 0, sorties: 0 };
    if (item.type === 'entree') moisMap[mois].entrees += parseFloat(item.total || 0);
    else moisMap[mois].sorties += parseFloat(item.total || 0);
  });
  const barData = Object.values(moisMap).slice(-6);

  // Évolution solde
  const evoData = (data.evolution_solde || []).slice(-20).map((e, i) => ({
    index: i,
    solde: parseFloat(e.solde || 0),
    date:  e.date ? new Date(e.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : '',
  }));

  // Par catégorie (dépenses)
  const pieData = (data.par_categorie || []).slice(0, 6).map(c => ({
    name:  c.categorie__nom || 'Autre',
    value: parseFloat(c.total || 0),
    couleur: c.categorie__couleur || '#6366f1',
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Bannière mode lecture seule ────────────────────────────────── */}
      {expire && (
        <div style={{ background: 'linear-gradient(135deg,#fef2f2,#fee2e2)', border: '1px solid #ef4444', borderRadius: 12, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 22 }}>⛔</span>
          <p style={{ margin: 0, fontSize: 14, color: '#991b1b', fontWeight: 600 }}>
            Mode lecture seule — Abonnez-vous pour créer des transactions et budgets.
          </p>
          <button onClick={() => navigate('/profil')} style={{ marginLeft: 'auto', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 16px', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
            S'abonner
          </button>
        </div>
      )}

      {/* ── Titre ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#1e293b' }}>📊 Tableau de bord</h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>{nbTrans} transaction(s) au total</p>
        </div>
        {!expire && (
          <button onClick={() => navigate('/transactions')} style={{
            background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff',
            border: 'none', borderRadius: 12, padding: '10px 20px',
            cursor: 'pointer', fontWeight: 700, fontSize: 14,
            boxShadow: '0 4px 14px rgba(99,102,241,0.3)',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            ➕ Nouvelle transaction
          </button>
        )}
      </div>

      {/* ── Cartes statistiques ────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        <StatCard label="Solde total"    value={`${balance.toLocaleString()} MRU`}  icon="💰" color={balance >= 0 ? '#10b981' : '#ef4444'} sub="Entrées − Sorties" />
        <StatCard label="Total entrées"  value={`${entrees.toLocaleString()} MRU`}  icon="↑"  color="#10b981" />
        <StatCard label="Total sorties"  value={`${sorties.toLocaleString()} MRU`}  icon="↓"  color="#ef4444" />
        <StatCard label="Transactions"   value={nbTrans}                             icon="📋" color="#6366f1" sub="au total" />
      </div>

      {/* ── Graphique barres (entrées vs sorties par mois) ─────────────── */}
      {barData.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 16, padding: '24px 20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700, color: '#1e293b' }}>
            📈 Entrées vs Sorties par mois
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={barData} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="mois" tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<TooltipCustom />} />
              <Legend />
              <Bar dataKey="entrees" name="Entrées" fill="#10b981" radius={[6,6,0,0]} />
              <Bar dataKey="sorties" name="Sorties" fill="#ef4444" radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: evoData.length > 0 ? '1.6fr 1fr' : '1fr', gap: 20 }}>

        {/* ── Évolution solde ─────────────────────────────────────────── */}
        {evoData.length > 0 && (
          <div style={{ background: '#fff', borderRadius: 16, padding: '24px 20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700, color: '#1e293b' }}>📉 Évolution du solde</h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={evoData}>
                <defs>
                  <linearGradient id="gradSolde" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => [`${parseFloat(v).toLocaleString()} MRU`, 'Solde']} />
                <Area type="monotone" dataKey="solde" stroke="#6366f1" strokeWidth={2.5} fill="url(#gradSolde)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* ── Dépenses par catégorie ──────────────────────────────────── */}
        {pieData.length > 0 && (
          <div style={{ background: '#fff', borderRadius: 16, padding: '24px 20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: '#1e293b' }}>🍕 Dépenses par catégorie</h3>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                  dataKey="value" nameKey="name" paddingAngle={3}>
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.couleur || COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [`${parseFloat(v).toLocaleString()} MRU`]} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
              {pieData.map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: c.couleur || COLORS[i % COLORS.length], flexShrink: 0 }} />
                  <span style={{ flex: 1, color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                  <span style={{ fontWeight: 700, color: '#1e293b', whiteSpace: 'nowrap' }}>{parseFloat(c.value).toLocaleString()} MRU</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── 5 dernières transactions ────────────────────────────────────── */}
      <div style={{ background: '#fff', borderRadius: 16, padding: '24px 28px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1e293b' }}>💰 Dernières transactions</h3>
          <button onClick={() => navigate('/transactions')} style={{ background: '#eef2ff', color: '#6366f1', border: 'none', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
            Voir toutes →
          </button>
        </div>

        {(data.dernieres_transactions || []).length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>💸</div>
            <p>Aucune transaction récente</p>
            {!expire && (
              <button onClick={() => navigate('/transactions')} style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 20px', cursor: 'pointer', fontWeight: 700, fontSize: 13, marginTop: 8 }}>
                Créer ma première transaction
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {(data.dernieres_transactions || []).map((t, i) => (
              <div key={t.id} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '13px 0',
                borderBottom: i < (data.dernieres_transactions.length - 1) ? '1px solid #f1f5f9' : 'none',
                transition: 'background 0.12s', borderRadius: 8,
              }}>
                {/* Icône */}
                <div style={{
                  width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                  background: t.type === 'entree' ? '#ecfdf5' : '#fef2f2',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                }}>
                  {t.categorie_detail?.icone || (t.type === 'entree' ? '↑' : '↓')}
                </div>

                {/* Infos */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.categorie_detail?.nom || (t.type === 'entree' ? 'Entrée' : 'Dépense')}
                  </div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                    {t.description
                      ? t.description.length > 30 ? t.description.slice(0, 30) + '...' : t.description
                      : new Date(t.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                </div>

                {/* Date */}
                <div style={{ fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  {new Date(t.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                </div>

                {/* Montant */}
                <div style={{ fontWeight: 800, fontSize: 15, color: t.type === 'entree' ? '#10b981' : '#ef4444', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  {t.type === 'entree' ? '+' : '−'}{parseFloat(t.montant).toLocaleString()} MRU
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Budgets actifs ──────────────────────────────────────────────── */}
      {(data.derniers_budgets || []).length > 0 && (
        <div style={{ background: '#fff', borderRadius: 16, padding: '24px 28px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1e293b' }}>🎯 Budgets actifs</h3>
            <button onClick={() => navigate('/budgets')} style={{ background: '#eef2ff', color: '#6366f1', border: 'none', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
              Voir tous →
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
            {(data.derniers_budgets || []).map(b => {
              const pct    = Math.min(b.pourcentage_utilise || 0, 100);
              const couleur = b.couleur || (b.est_depasse ? '#ef4444' : pct >= 80 ? '#f59e0b' : '#10b981');
              return (
                <div key={b.id} onClick={() => navigate('/budgets')} style={{
                  background: '#f8fafc', borderRadius: 12, padding: '16px 18px',
                  cursor: 'pointer', border: `1px solid ${couleur}22`,
                  borderLeft: `4px solid ${couleur}`, transition: 'box-shadow 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: couleur }} />
                    <span style={{ fontWeight: 700, fontSize: 14, color: '#1e293b' }}>{b.categorie_nom}</span>
                    {b.est_depasse && <span style={{ marginLeft: 'auto', fontSize: 10, background: '#fef2f2', color: '#ef4444', borderRadius: 4, padding: '1px 6px', fontWeight: 700 }}>DÉPASSÉ</span>}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 12 }}>
                    <span style={{ color: couleur, fontWeight: 700 }}>{parseFloat(b.montant_depense || 0).toLocaleString()} MRU</span>
                    <span style={{ color: '#94a3b8' }}>{parseFloat(b.montant_prevu || 0).toLocaleString()} MRU</span>
                  </div>
                  <div style={{ background: '#e2e8f0', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: couleur, borderRadius: 4, transition: 'width 0.4s' }} />
                  </div>
                  <p style={{ margin: '6px 0 0', fontSize: 11, color: couleur, fontWeight: 600, textAlign: 'right' }}>
                    {pct.toFixed(0)}% utilisé
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}