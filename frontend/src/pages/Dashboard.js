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
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 11 }}>
      <p style={{ margin: '0 0 3px', fontWeight: 700, color: '#1e293b' }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ margin: '2px 0', color: p.color, fontWeight: 600, fontSize: 10 }}>
          {p.name} : {parseFloat(p.value).toLocaleString()} MRU
        </p>
      ))}
    </div>
  );
};

// ── Formateur personnalisé pour l'axe Y (MRU sans 'k') ───────────────────────
const formatYAxisMRU = (value) => {
  return `${value.toLocaleString()} MRU`;
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

  const iconSize = isMobile ? 20 : 24;
  const IconComponent = Icons[iconType];

  return (
    <div style={{
      background: '#fff', 
      borderRadius: isMobile ? 12 : 16, 
      padding: isMobile ? '12px 14px' : '18px 20px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      borderLeft: `3px solid ${color}`,
      display: 'flex', 
      alignItems: 'center', 
      gap: isMobile ? 10 : 14,
      transition: 'transform 0.2s, box-shadow 0.2s',
    }}
    onMouseEnter={e => {
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.08)';
    }}
    onMouseLeave={e => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)';
    }}>
      <div style={{ 
        width: isMobile ? 36 : 48, 
        height: isMobile ? 36 : 48, 
        borderRadius: isMobile ? 10 : 14, 
        background: `${color}12`, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        flexShrink: 0 
      }}>
        {IconComponent(color, iconSize)}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: isMobile ? 9 : 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px' }}>{label}</div>
        <div style={{ fontSize: isMobile ? 15 : 20, fontWeight: 800, color, marginTop: 2, wordBreak: 'break-word' }}>{value}</div>
        {sub && <div style={{ fontSize: isMobile ? 8 : 10, color: '#94a3b8', marginTop: 1 }}>{sub}</div>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { estExpire } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const expire = estExpire();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    api.get('/transactions/dashboard/')
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 250, flexDirection: 'column', gap: 10 }}>
      <div style={{ width: 32, height: 32, border: '2.5px solid #e2e8f0', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <p style={{ color: '#94a3b8', fontSize: 12 }}>Chargement...</p>
    </div>
  );

  if (!data) return (
    <div style={{ textAlign: 'center', padding: '40px 16px', color: '#94a3b8' }}>
      <i className='bx bx-error-circle' style={{ fontSize: 40, marginBottom: 10, color: '#ef4444' }} />
      <p style={{ fontSize: 13 }}>Impossible de charger le tableau de bord</p>
      <button onClick={() => window.location.reload()} style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontWeight: 600, fontSize: 12, marginTop: 10 }}>
        <i className='bx bx-refresh' style={{ marginRight: 4 }} /> Réessayer
      </button>
    </div>
  );

  const solde = data.solde || {};
  const entrees = parseFloat(solde.total_entrees || 0);
  const sorties = parseFloat(solde.total_sorties || 0);
  const balance = parseFloat(solde.montant_total || 0);
  const nbTrans = data.nombre_transactions || 0;

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
    date: e.date ? new Date(e.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : '',
  }));

  // Par catégorie (dépenses)
  const pieData = (data.par_categorie || []).slice(0, 6).map(c => ({
    name: c.categorie__nom || 'Autre',
    value: parseFloat(c.total || 0),
    couleur: c.categorie__couleur || '#6366f1',
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 14 : 20, padding: 0 }}>

      {/* Boxicons et Fonts */}
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

      {/* ── Bannière mode lecture seule ────────────────────────────────── */}
      {expire && (
        <div style={{ 
          background: 'linear-gradient(135deg, #fef2f2, #fee2e2)', 
          border: '1px solid #ef4444', 
          borderRadius: 10, 
          padding: isMobile ? '10px 14px' : '14px 20px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: 10,
          flexWrap: 'wrap'
        }}>
          <i className='bx bx-lock-alt' style={{ fontSize: isMobile ? 16 : 20, color: '#ef4444' }} />
          <p style={{ margin: 0, fontSize: isMobile ? 11 : 14, color: '#991b1b', fontWeight: 600, flex: 1 }}>
            Mode lecture seule
          </p>
          <button 
            onClick={() => navigate('/profil')} 
            style={{ 
              background: '#ef4444', 
              color: '#fff', 
              border: 'none', 
              borderRadius: 7, 
              padding: isMobile ? '5px 12px' : '7px 16px', 
              cursor: 'pointer', 
              fontWeight: 600, 
              fontSize: isMobile ? 11 : 13,
              display: 'flex',
              alignItems: 'center',
              gap: 5
            }}
          >
            <i className='bx bx-crown' style={{ fontSize: 12 }} /> S'abonner
          </button>
        </div>
      )}

      {/* ── Titre avec bouton Nouvelle transaction en haut à droite ────── */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        flexWrap: 'wrap', 
        gap: isMobile ? 10 : 12 
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 12, marginBottom: 2 }}>
            <i className='bx bx-stats' style={{ fontSize: isMobile ? 22 : 28, color: '#6366f1' }} />
            <h1 style={{ 
              margin: 0, 
              fontSize: isMobile ? 20 : 26, 
              fontWeight: 800, 
              color: '#1e293b',
              fontFamily: "'Outfit', sans-serif"
            }}>
              Tableau de bord
            </h1>
          </div>
          <p style={{ margin: 0, color: '#64748b', fontSize: isMobile ? 11 : 14 }}>
            <i className='bx bx-transfer' style={{ marginRight: 3, fontSize: 11 }} />
            {nbTrans} transaction(s)
          </p>
        </div>
        
        {/* Bouton Nouvelle transaction en haut à droite - taille réduite */}
        {!expire && (
          <button 
            onClick={() => navigate('/transactions')} 
            style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', 
              color: '#fff',
              border: 'none', 
              borderRadius: isMobile ? 8 : 10, 
              padding: isMobile ? '6px 12px' : '8px 16px',
              cursor: 'pointer', 
              fontWeight: 600, 
              fontSize: isMobile ? 11 : 13,
              boxShadow: '0 2px 8px rgba(99,102,241,0.25)',
              display: 'flex', 
              alignItems: 'center', 
              gap: 5,
              whiteSpace: 'nowrap'
            }}
          >
            <i className='bx bx-plus' style={{ fontSize: isMobile ? 14 : 16 }} />
            Nouvelle transaction
          </button>
        )}
      </div>

      {/* ── Cartes statistiques avec icônes SVG ────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: isMobile ? 10 : 16 }}>
        <StatCard 
          label="Solde"    
          value={`${balance.toLocaleString()} MRU`}  
          iconType="solde"
          color={balance >= 0 ? '#10b981' : '#ef4444'} 
          sub="Entrées − Sorties" 
        />
        <StatCard 
          label="Entrées"  
          value={`${entrees.toLocaleString()} MRU`}  
          iconType="entrees"
          color="#10b981" 
        />
        <StatCard 
          label="Sorties"  
          value={`${sorties.toLocaleString()} MRU`}  
          iconType="sorties"
          color="#ef4444" 
        />
        <StatCard 
          label="Transactions"   
          value={nbTrans}                             
          iconType="transactions"
          color="#6366f1" 
          sub="au total" 
        />
      </div>

      {/* ── Graphique barres (entrées vs sorties par mois) ─────────────── */}
      {barData.length > 0 && (
        <div className="dashboard-card" style={{ background: '#fff', borderRadius: isMobile ? 12 : 16, padding: isMobile ? '14px' : '24px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: isMobile ? 13 : 16, fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 6 }}>
            <i className='bx bx-bar-chart-alt-2' style={{ fontSize: isMobile ? 14 : 18, color: '#6366f1' }} />
            Entrées vs Sorties par mois
          </h3>
          <ResponsiveContainer width="100%" height={isMobile ? 180 : 240}>
            <BarChart data={barData} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="mois" tick={{ fontSize: isMobile ? 9 : 12, fill: '#94a3b8' }} />
              <YAxis 
                tick={{ fontSize: isMobile ? 8 : 11, fill: '#94a3b8' }} 
                tickFormatter={formatYAxisMRU}
                width={isMobile ? 50 : 65}
              />
              <Tooltip content={<TooltipCustom />} />
              <Legend wrapperStyle={{ fontSize: isMobile ? 10 : 12 }} />
              <Bar dataKey="entrees" name="Entrées" fill="#10b981" radius={[4,4,0,0]} />
              <Bar dataKey="sorties" name="Sorties" fill="#ef4444" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Graphiques : Évolution et Dépenses ──────────────────────────── */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: isMobile ? '1fr' : (evoData.length > 0 ? '1.6fr 1fr' : '1fr'), 
        gap: isMobile ? 14 : 20 
      }}>

        {/* Évolution solde */}
        {evoData.length > 0 && (
          <div className="dashboard-card" style={{ background: '#fff', borderRadius: isMobile ? 12 : 16, padding: isMobile ? '14px' : '24px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: isMobile ? 13 : 16, fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 6 }}>
              <i className='bx bx-line-chart' style={{ fontSize: isMobile ? 14 : 18, color: '#6366f1' }} />
              Évolution du solde
            </h3>
            <ResponsiveContainer width="100%" height={isMobile ? 160 : 200}>
              <AreaChart data={evoData}>
                <defs>
                  <linearGradient id="gradSolde" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: isMobile ? 8 : 10, fill: '#94a3b8' }} 
                />
                <YAxis 
                  tick={{ fontSize: isMobile ? 8 : 10, fill: '#94a3b8' }} 
                  tickFormatter={formatYAxisMRU}
                  width={isMobile ? 55 : 70}
                />
                <Tooltip 
                  formatter={(value) => [`${parseFloat(value).toLocaleString()} MRU`, 'Solde']}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Area type="monotone" dataKey="solde" stroke="#6366f1" strokeWidth={2} fill="url(#gradSolde)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Dépenses par catégorie */}
        {pieData.length > 0 && (
          <div className="dashboard-card" style={{ background: '#fff', borderRadius: isMobile ? 12 : 16, padding: isMobile ? '14px' : '24px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: isMobile ? 13 : 16, fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 6 }}>
              <i className='bx bx-pie-chart-alt' style={{ fontSize: isMobile ? 14 : 18, color: '#f59e0b' }} />
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
                    <Cell key={i} fill={entry.couleur || COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${parseFloat(value).toLocaleString()} MRU`, 'Montant']} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: isMobile ? 8 : 12 }}>
              {pieData.map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: isMobile ? 10 : 12 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.couleur || COLORS[i % COLORS.length], flexShrink: 0 }} />
                  <span style={{ flex: 1, color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: isMobile ? 10 : 12 }}>{c.name}</span>
                  <span style={{ fontWeight: 700, color: '#1e293b', whiteSpace: 'nowrap', fontSize: isMobile ? 10 : 12 }}>{parseFloat(c.value).toLocaleString()} MRU</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── 5 dernières transactions ────────────────────────────────────── */}
      <div className="dashboard-card" style={{ background: '#fff', borderRadius: isMobile ? 12 : 16, padding: isMobile ? '14px' : '24px 28px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isMobile ? 12 : 16, flexWrap: 'wrap', gap: 8 }}>
          <h3 style={{ margin: 0, fontSize: isMobile ? 13 : 16, fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 6 }}>
            <i className='bx bx-history' style={{ fontSize: isMobile ? 14 : 18, color: '#6366f1' }} />
            Dernières transactions
          </h3>
          <button 
            onClick={() => navigate('/transactions')} 
            style={{ 
              background: '#eef2ff', 
              color: '#6366f1', 
              border: 'none', 
              borderRadius: 7, 
              padding: isMobile ? '4px 10px' : '6px 14px', 
              cursor: 'pointer', 
              fontSize: isMobile ? 10 : 12, 
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 3
            }}
          >
            Voir toutes <i className='bx bx-right-arrow-alt' style={{ fontSize: isMobile ? 12 : 14 }} />
          </button>
        </div>

        {(data.dernieres_transactions || []).length === 0 ? (
          <div style={{ textAlign: 'center', padding: isMobile ? '28px 12px' : '32px 0', color: '#94a3b8' }}>
            <i className='bx bx-folder-open' style={{ fontSize: isMobile ? 32 : 40, marginBottom: 6, color: '#cbd5e1' }} />
            <p style={{ margin: 0, fontSize: isMobile ? 12 : 14 }}>Aucune transaction récente</p>
            {!expire && (
              <button 
                onClick={() => navigate('/transactions')} 
                style={{ 
                  background: '#6366f1', 
                  color: '#fff', 
                  border: 'none', 
                  borderRadius: 8, 
                  padding: '6px 16px', 
                  cursor: 'pointer', 
                  fontWeight: 600, 
                  fontSize: isMobile ? 11 : 13, 
                  marginTop: 10,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5
                }}
              >
                <i className='bx bx-plus' /> Créer
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {(data.dernieres_transactions || []).map((t, i) => (
              <div key={t.id} style={{
                display: 'flex', 
                alignItems: 'center', 
                gap: isMobile ? 8 : 12,
                padding: isMobile ? '8px 0' : '13px 0',
                borderBottom: i < (data.dernieres_transactions.length - 1) ? '1px solid #f1f5f9' : 'none',
              }}>
                <div style={{
                  width: isMobile ? 32 : 40, 
                  height: isMobile ? 32 : 40, 
                  borderRadius: 8, 
                  flexShrink: 0,
                  background: t.type === 'entree' ? '#ecfdf5' : '#fef2f2',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                }}>
                  <i className={`bx ${t.type === 'entree' ? 'bx-up-arrow-alt' : 'bx-down-arrow-alt'}`} style={{ fontSize: isMobile ? 14 : 18, color: t.type === 'entree' ? '#10b981' : '#ef4444' }} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: isMobile ? 12 : 14, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.categorie_detail?.nom || (t.type === 'entree' ? 'Entrée' : 'Dépense')}
                  </div>
                  <div style={{ fontSize: isMobile ? 9 : 12, color: '#94a3b8', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.description
                      ? t.description.length > 25 ? t.description.slice(0, 25) + '...' : t.description
                      : new Date(t.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                  </div>
                </div>

                <div style={{ 
                  fontWeight: 700, 
                  fontSize: isMobile ? 12 : 15, 
                  color: t.type === 'entree' ? '#10b981' : '#ef4444', 
                  whiteSpace: 'nowrap', 
                  flexShrink: 0 
                }}>
                  {t.type === 'entree' ? '+' : '−'}{parseFloat(t.montant).toLocaleString()} MRU
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Budgets actifs ──────────────────────────────────────────────── */}
      {(data.derniers_budgets || []).length > 0 && (
        <div className="dashboard-card" style={{ background: '#fff', borderRadius: isMobile ? 12 : 16, padding: isMobile ? '14px' : '24px 28px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isMobile ? 12 : 16, flexWrap: 'wrap', gap: 8 }}>
            <h3 style={{ margin: 0, fontSize: isMobile ? 13 : 16, fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 6 }}>
              <i className='bx bx-target' style={{ fontSize: isMobile ? 14 : 18, color: '#f59e0b' }} />
              Budgets actifs
            </h3>
            <button 
              onClick={() => navigate('/budgets')} 
              style={{ 
                background: '#eef2ff', 
                color: '#6366f1', 
                border: 'none', 
                borderRadius: 7, 
                padding: isMobile ? '4px 10px' : '6px 14px', 
                cursor: 'pointer', 
                fontSize: isMobile ? 10 : 12, 
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 3
              }}
            >
              Voir tous <i className='bx bx-right-arrow-alt' style={{ fontSize: isMobile ? 12 : 14 }} />
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(210px, 1fr))', gap: isMobile ? 10 : 12 }}>
            {(data.derniers_budgets || []).map(b => {
              const pct = Math.min(b.pourcentage_utilise || 0, 100);
              const couleur = b.couleur || (b.est_depasse ? '#ef4444' : pct >= 80 ? '#f59e0b' : '#10b981');
              return (
                <div key={b.id} 
                  onClick={() => navigate('/budgets')} 
                  style={{
                    background: '#f8fafc', 
                    borderRadius: 10, 
                    padding: isMobile ? '12px' : '14px 16px',
                    cursor: 'pointer', 
                    border: `1px solid ${couleur}22`,
                    borderLeft: `3px solid ${couleur}`, 
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.06)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: couleur }} />
                    <span style={{ fontWeight: 700, fontSize: isMobile ? 12 : 14, color: '#1e293b', flex: 1 }}>{b.categorie_nom}</span>
                    {b.est_depasse && (
                      <span style={{ 
                        fontSize: 8, 
                        background: '#fef2f2', 
                        color: '#ef4444', 
                        borderRadius: 4, 
                        padding: '1px 5px', 
                        fontWeight: 700 
                      }}>
                        DÉPASSÉ
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: isMobile ? 10 : 12 }}>
                    <span style={{ color: couleur, fontWeight: 700 }}>{parseFloat(b.montant_depense || 0).toLocaleString()} MRU</span>
                    <span style={{ color: '#94a3b8' }}>{parseFloat(b.montant_prevu || 0).toLocaleString()} MRU</span>
                  </div>
                  <div style={{ background: '#e2e8f0', borderRadius: 3, height: 5, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: couleur, borderRadius: 3, transition: 'width 0.4s' }} />
                  </div>
                  <p style={{ margin: '5px 0 0', fontSize: isMobile ? 9 : 11, color: couleur, fontWeight: 600, textAlign: 'right' }}>
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