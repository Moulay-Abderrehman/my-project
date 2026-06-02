import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';

// ── SHARED STYLE CONSTANTS (identique à Transactions.js) ──
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
};

// ── COMPOSANT BADGE TYPE ──
function TypeBadge({ type }) {
  const isEntree = type === 'entree';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700,
      background: isEntree ? '#ecfdf5' : '#fef2f2',
      color: isEntree ? COLORS.entree : COLORS.sortie,
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <i className={isEntree ? 'bx bx-trending-up' : 'bx bx-trending-down'} style={{ fontSize: 12 }} />
      {isEntree ? 'Entrée' : 'Sortie'}
    </span>
  );
}

export default function ToutesTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtreType, setFiltreType] = useState('');
  const [filtreSource, setFiltreSource] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
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

  // Détection mobile pour ajustements supplémentaires
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 700);
  
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 700);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={{ 
      maxWidth: 1200, 
      margin: '0 auto', 
      padding: isMobile ? '12px 12px' : '8px 16px', 
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif" 
    }}>
      
      {/* Boxicons et Fonts */}
      <link rel="stylesheet" href="https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css" />
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Outfit:wght@600;700;800&display=swap" rel="stylesheet" />

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .stat-card { animation: fadeUp 0.4s cubic-bezier(.16,1,.3,1) both; }
        .stat-card:nth-child(2) { animation-delay: 0.07s; }
        .stat-card:nth-child(3) { animation-delay: 0.14s; }
        .tx-row { transition: background 0.12s; }
        .tx-row:hover { background: #f5f3ff !important; }
        
        @media (max-width: 700px) {
          .tx-table-wrap { display: none !important; }
          .tx-cards-wrap { display: flex !important; }
          .filters-row { flex-direction: column !important; gap: 8px !important; }
          .filters-row > div, .filters-row > button { width: 100% !important; min-width: unset !important; }
          .stats-row { flex-direction: column !important; gap: 10px !important; }
        }
        @media (min-width: 701px) {
          .tx-cards-wrap { display: none !important; }
          .tx-table-wrap { display: block !important; }
        }
      `}</style>

      {/* ── BOUTON RETOUR EN HAUT À GAUCHE ── */}
      <div style={{
        marginBottom: isMobile ? 16 : 20,
      }}>
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            background: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)',
            border: 'none', 
            borderRadius: 10, 
            padding: isMobile ? '8px 14px' : '10px 20px',
            cursor: 'pointer', 
            fontSize: isMobile ? 12 : 13, 
            fontWeight: 600, 
            color: '#475569',
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: 6,
            transition: 'all 0.2s',
            fontFamily: "'DM Sans', sans-serif",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateX(-4px)';
            e.currentTarget.style.background = 'linear-gradient(135deg, #e2e8f0, #cbd5e1)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateX(0)';
            e.currentTarget.style.background = 'linear-gradient(135deg, #f1f5f9, #e2e8f0)';
          }}
        >
          <i className='bx bx-arrow-back' style={{ fontSize: isMobile ? 16 : 18 }} />
          Retour
        </button>
      </div>

      {/* ── EN-TÊTE ── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'flex-start' : 'center',
        marginBottom: isMobile ? 16 : 22,
        gap: isMobile ? 12 : 12,
        flexDirection: isMobile ? 'column' : 'row',
        flexWrap: 'wrap'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
            <div style={{
              width: isMobile ? 28 : 36, 
              height: isMobile ? 28 : 36, 
              borderRadius: 8,
              background: 'linear-gradient(135deg, #ede9fe, #c4b5fd)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <i className='bx bx-transfer-alt' style={{ fontSize: isMobile ? 16 : 19, color: COLORS.primary }} />
            </div>
            <h2 style={{
              margin: 0, 
              fontSize: isMobile ? 18 : 22, 
              fontWeight: 800, 
              color: COLORS.text,
              fontFamily: "'Outfit', sans-serif", 
              letterSpacing: '-0.3px',
            }}>
              Toutes les transactions
            </h2>
            <span style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: COLORS.white, 
              borderRadius: 16, 
              padding: '2px 8px',
              fontSize: isMobile ? 10 : 12, 
              fontWeight: 700
            }}>
              {filtrees.length}
            </span>
          </div>
          <p style={{ margin: 0, color: COLORS.textMuted, fontSize: isMobile ? 11 : 13 }}>
            Archive complète — transactions masquées et budgets inclus
          </p>
        </div>
      </div>

      {/* ── INFO BANNER ── */}
      <div style={{
        background: 'linear-gradient(135deg, #eff6ff, #e0e7ff)',
        borderRadius: 12, 
        padding: isMobile ? '10px 12px' : '14px 20px', 
        marginBottom: isMobile ? 16 : 24,
        borderLeft: `3px solid ${COLORS.primary}`,
        display: 'flex', 
        alignItems: 'flex-start', 
        gap: 10,
      }}>
        <i className='bx bx-info-circle' style={{ fontSize: isMobile ? 16 : 20, color: COLORS.primary, marginTop: 2 }} />
        <span style={{ fontSize: isMobile ? 11 : 13, color: '#1e40af', lineHeight: 1.4 }}>
          <strong>Info :</strong> Toutes les transactions sans exception — transactions masquées et budgets inclus.
        </span>
      </div>

      {/* ── STATS CARDS ── */}
      <div className="stats-row" style={{ 
        display: 'flex', 
        gap: isMobile ? 10 : 14, 
        marginBottom: isMobile ? 16 : 22, 
        flexWrap: 'wrap' 
      }}>
        {[
          { label: 'Total', val: filtrees.length, suffix: '', color: COLORS.primary, bg: '#ede9fe', icon: 'bx-grid-alt' },
          { label: 'Entrées', val: totalEntrees, suffix: ' MRU', color: COLORS.entree, bg: '#ecfdf5', icon: 'bx-trending-up' },
          { label: 'Sorties', val: totalSorties, suffix: ' MRU', color: COLORS.sortie, bg: '#fef2f2', icon: 'bx-trending-down' },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{
            flex: 1, minWidth: isMobile ? 'auto' : 180,
            background: COLORS.white, 
            borderRadius: 12, 
            padding: isMobile ? '10px 12px' : '16px 18px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            border: `1px solid ${s.color}22`,
            display: 'flex', 
            alignItems: 'center', 
            gap: isMobile ? 10 : 14,
          }}>
            <div style={{
              width: isMobile ? 32 : 42, 
              height: isMobile ? 32 : 42, 
              borderRadius: 9, 
              background: s.bg, 
              flexShrink: 0,
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
            }}>
              <i className={`bx ${s.icon}`} style={{ fontSize: isMobile ? 16 : 20, color: s.color }} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ 
                margin: 0, 
                fontSize: isMobile ? 9 : 10.5, 
                fontWeight: 700, 
                color: COLORS.textLight, 
                textTransform: 'uppercase', 
                letterSpacing: '0.3px' 
              }}>
                {s.label}
              </p>
              <p style={{ 
                margin: '2px 0 0', 
                fontWeight: 800, 
                fontSize: isMobile ? 14 : 17, 
                color: s.color, 
                fontFamily: "'Outfit', sans-serif",
                wordBreak: 'break-word'
              }}>
                {s.val.toLocaleString('fr-FR')}{s.suffix}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── FILTRES ── */}
      <div className="filters-row" style={{
        display: 'flex', 
        gap: isMobile ? 8 : 10, 
        marginBottom: isMobile ? 14 : 18,
        flexWrap: 'wrap', 
        alignItems: 'flex-end',
        background: COLORS.white, 
        padding: isMobile ? '12px' : '16px 18px',
        borderRadius: 12, 
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        border: `1px solid ${COLORS.border}`,
      }}>
        <div style={{ flex: 1, minWidth: isMobile ? 'auto' : 140 }}>
          <label style={{
            display: 'flex', 
            alignItems: 'center', 
            gap: 4,
            fontSize: isMobile ? 9 : 10.5, 
            color: COLORS.textMuted, 
            fontWeight: 600,
            textTransform: 'uppercase', 
            letterSpacing: '0.5px', 
            marginBottom: 4,
          }}>
            <i className='bx bx-filter' style={{ fontSize: isMobile ? 10 : 11 }} /> 
            Type
          </label>
          <div style={{ position: 'relative' }}>
            <i className='bx bx-transfer' style={{
              position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
              fontSize: isMobile ? 13 : 16, color: COLORS.textLight, pointerEvents: 'none',
            }} />
            <select
              value={filtreType}
              onChange={e => setFiltreType(e.target.value)}
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: isMobile ? '8px 28px 8px 32px' : '10px 32px 10px 36px', 
                borderRadius: 8,
                border: `1.5px solid ${COLORS.border}`, 
                background: COLORS.bg,
                fontSize: isMobile ? 12 : 13.5, 
                color: COLORS.text, 
                fontFamily: "'DM Sans', sans-serif",
                outline: 'none', 
                cursor: 'pointer', 
                appearance: 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
              onFocus={e => {
                e.currentTarget.style.borderColor = COLORS.primary;
                e.currentTarget.style.background = COLORS.white;
              }}
              onBlur={e => {
                e.currentTarget.style.borderColor = COLORS.border;
                e.currentTarget.style.background = COLORS.bg;
              }}
            >
              <option value="">Tous</option>
              <option value="entree">Entrées</option>
              <option value="sortie">Sorties</option>
            </select>
            <i className='bx bx-chevron-down' style={{
              position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
              fontSize: isMobile ? 13 : 15, color: COLORS.textLight, pointerEvents: 'none',
            }} />
          </div>
        </div>

        <div style={{ flex: 1, minWidth: isMobile ? 'auto' : 140 }}>
          <label style={{
            display: 'flex', 
            alignItems: 'center', 
            gap: 4,
            fontSize: isMobile ? 9 : 10.5, 
            color: COLORS.textMuted, 
            fontWeight: 600,
            textTransform: 'uppercase', 
            letterSpacing: '0.5px', 
            marginBottom: 4,
          }}>
            <i className='bx bx-source' style={{ fontSize: isMobile ? 10 : 11 }} /> 
            Source
          </label>
          <div style={{ position: 'relative' }}>
            <i className='bx bx-category' style={{
              position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
              fontSize: isMobile ? 13 : 16, color: COLORS.textLight, pointerEvents: 'none',
            }} />
            <select
              value={filtreSource}
              onChange={e => setFiltreSource(e.target.value)}
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: isMobile ? '8px 28px 8px 32px' : '10px 32px 10px 36px', 
                borderRadius: 8,
                border: `1.5px solid ${COLORS.border}`, 
                background: COLORS.bg,
                fontSize: isMobile ? 12 : 13.5, 
                color: COLORS.text, 
                fontFamily: "'DM Sans', sans-serif",
                outline: 'none', 
                cursor: 'pointer', 
                appearance: 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
              onFocus={e => {
                e.currentTarget.style.borderColor = COLORS.primary;
                e.currentTarget.style.background = COLORS.white;
              }}
              onBlur={e => {
                e.currentTarget.style.borderColor = COLORS.border;
                e.currentTarget.style.background = COLORS.bg;
              }}
            >
              <option value="">Toutes</option>
              <option value="manuel">Manuel</option>
              <option value="budget">Budget</option>
            </select>
            <i className='bx bx-chevron-down' style={{
              position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
              fontSize: isMobile ? 13 : 15, color: COLORS.textLight, pointerEvents: 'none',
            }} />
          </div>
        </div>

        <button
          onClick={() => { setFiltreType(''); setFiltreSource(''); }}
          style={{
            background: COLORS.bg, 
            border: `1.5px solid ${COLORS.border}`,
            borderRadius: 8, 
            padding: isMobile ? '8px 12px' : '10px 16px', 
            cursor: 'pointer',
            fontSize: isMobile ? 12 : 13, 
            color: COLORS.textMuted, 
            fontWeight: 600,
            display: 'flex', 
            alignItems: 'center', 
            gap: 5,
            fontFamily: "'DM Sans', sans-serif", 
            transition: 'all 0.15s',
            whiteSpace: 'nowrap',
            justifyContent: 'center',
            width: isMobile ? '100%' : 'auto'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = COLORS.border;
            e.currentTarget.style.color = COLORS.text;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = COLORS.bg;
            e.currentTarget.style.color = COLORS.textMuted;
          }}
        >
          <i className='bx bx-reset' style={{ fontSize: isMobile ? 13 : 15 }} />
          Réinitialiser
        </button>
      </div>

      {/* ── ÉTAT CHARGEMENT ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: isMobile ? '40px 0' : '56px 0', color: COLORS.textLight }}>
          <div style={{
            width: isMobile ? 36 : 44, 
            height: isMobile ? 36 : 44, 
            border: '3px solid #ede9fe',
            borderTopColor: COLORS.primary, 
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite', 
            margin: '0 auto 12px',
          }} />
          <p style={{ fontSize: isMobile ? 12 : 14, margin: 0 }}>Chargement...</p>
        </div>

      /* ── ÉTAT VIDE ── */
      ) : filtrees.length === 0 ? (
        <div style={{
          textAlign: 'center', 
          padding: isMobile ? '40px 16px' : '64px 20px',
          background: COLORS.white, 
          borderRadius: 14,
          border: `1.5px dashed ${COLORS.border}`,
        }}>
          <div style={{
            width: isMobile ? 48 : 64, 
            height: isMobile ? 48 : 64, 
            borderRadius: '50%',
            background: '#ede9fe', 
            display: 'flex',
            alignItems: 'center', 
            justifyContent: 'center', 
            margin: '0 auto 12px',
          }}>
            <i className='bx bx-folder-open' style={{ fontSize: isMobile ? 22 : 28, color: COLORS.primary }} />
          </div>
          <p style={{ fontSize: isMobile ? 14 : 16, fontWeight: 700, color: COLORS.text, margin: '0 0 4px' }}>
            Aucune transaction
          </p>
          <p style={{ fontSize: isMobile ? 11 : 13, color: COLORS.textMuted, margin: 0 }}>
            Aucune transaction ne correspond à vos filtres
          </p>
        </div>

      ) : (
        <>
          {/* ── TABLE (desktop/tablet) ── */}
          <div className="tx-table-wrap" style={{
            background: COLORS.white, 
            borderRadius: 14, 
            overflow: 'hidden',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            border: `1px solid ${COLORS.border}`,
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)' }}>
                  {[
                    { label: 'Type', icon: 'bx-transfer' },
                    { label: 'Montant', icon: 'bx-money' },
                    { label: 'Catégorie', icon: 'bx-category' },
                    { label: 'Description', icon: 'bx-text' },
                    { label: 'Source', icon: 'bx-source' },
                    { label: 'Date', icon: 'bx-calendar' },
                    { label: 'Statut', icon: 'bx-check-shield' },
                  ].map(h => (
                    <th key={h.label} style={{
                      padding: '10px 12px', 
                      textAlign: 'left',
                      fontSize: 10, 
                      fontWeight: 700, 
                      color: COLORS.textMuted,
                      textTransform: 'uppercase', 
                      letterSpacing: '0.5px',
                      borderBottom: `2px solid ${COLORS.border}`,
                    }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <i className={`bx ${h.icon}`} style={{ fontSize: 11 }} />
                        {h.label}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtrees.map((t, i) => (
                  <tr key={t.id} className="tx-row" style={{
                    borderTop: `1px solid ${COLORS.border}`,
                    background: i % 2 === 0 ? COLORS.white : '#fbfaff',
                    opacity: t.is_visible ? 1 : 0.65,
                  }}>
                    <td style={{ padding: '10px 12px' }}>
                      <TypeBadge type={t.type} />
                    </td>
                    <td style={{
                      padding: '10px 12px', 
                      fontWeight: 700, 
                      fontSize: 13,
                      color: t.type === 'entree' ? COLORS.entree : COLORS.sortie,
                      fontFamily: "'Outfit', sans-serif",
                      whiteSpace: 'nowrap'
                    }}>
                      {t.type === 'entree' ? '+' : '-'}{parseFloat(t.montant).toLocaleString()} MRU
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: 12, color: COLORS.textMuted }}>
                      {t.categorie_detail ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                          <span style={{
                            width: 6, height: 6, borderRadius: '50%',
                            background: t.categorie_detail.couleur || COLORS.primary,
                            display: 'inline-block', flexShrink: 0
                          }} />
                          <span style={{ fontSize: 11 }}>{t.categorie_detail.nom}</span>
                        </span>
                      ) : <span style={{ color: COLORS.border, fontSize: 11 }}>—</span>}
                    </td>
                    <td style={{
                      padding: '10px 12px', 
                      fontSize: 11, 
                      color: COLORS.textMuted,
                      maxWidth: 150, 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis', 
                      whiteSpace: 'nowrap'
                    }}>
                      {t.description || <span style={{ color: COLORS.border }}>—</span>}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: 4,
                        padding: '3px 8px', 
                        borderRadius: 6,
                        fontSize: 10, 
                        fontWeight: 600,
                        background: t.source === 'budget' ? '#fffbeb' : '#ede9fe',
                        color: t.source === 'budget' ? '#d97706' : COLORS.primary,
                        whiteSpace: 'nowrap'
                      }}>
                        <i className={`bx ${t.source === 'budget' ? 'bx-target' : 'bx-edit'}`} style={{ fontSize: 11 }} />
                        {t.source === 'budget' ? 'Budget' : 'Manuel'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: 11, color: COLORS.textMuted, whiteSpace: 'nowrap' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <i className='bx bx-calendar-event' style={{ fontSize: 11, color: COLORS.textLight }} />
                        {new Date(t.date_creation).toLocaleDateString('fr-FR', {
                          day: '2-digit', month: 'short', year: 'numeric'
                        })}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: 4,
                        padding: '3px 8px', 
                        borderRadius: 6,
                        fontSize: 10, 
                        fontWeight: 600,
                        background: t.is_visible ? '#ecfdf5' : '#f1f5f9',
                        color: t.is_visible ? '#059669' : '#94a3b8',
                        whiteSpace: 'nowrap'
                      }}>
                        <i className={`bx ${t.is_visible ? 'bx-check-circle' : 'bx-hide'}`} style={{ fontSize: 11 }} />
                        {t.is_visible ? 'Active' : 'Masquée'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── CARDS (mobile) ── */}
          <div className="tx-cards-wrap" style={{ flexDirection: 'column', gap: 10 }}>
            {filtrees.map(t => (
              <div key={t.id} style={{
                background: COLORS.white, 
                borderRadius: 12,
                padding: '12px', 
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                border: `1px solid ${COLORS.border}`,
                opacity: t.is_visible ? 1 : 0.65,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <TypeBadge type={t.type} />
                  <span style={{
                    fontWeight: 700, 
                    fontSize: 14,
                    color: t.type === 'entree' ? COLORS.entree : COLORS.sortie,
                    fontFamily: "'Outfit', sans-serif"
                  }}>
                    {t.type === 'entree' ? '+' : '-'}{parseFloat(t.montant).toLocaleString()} MRU
                  </span>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 8 }}>
                  <span style={{
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: 4,
                    fontSize: 11, 
                    color: COLORS.textMuted
                  }}>
                    <i className='bx bx-category' style={{ fontSize: 12 }} />
                    {t.categorie_detail?.nom || '—'}
                  </span>
                  <span style={{
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: 4,
                    fontSize: 11, 
                    color: COLORS.textMuted
                  }}>
                    <i className={`bx ${t.source === 'budget' ? 'bx-target' : 'bx-edit'}`} style={{ fontSize: 12 }} />
                    {t.source === 'budget' ? 'Budget' : 'Manuel'}
                  </span>
                  <span style={{
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: 4,
                    fontSize: 11, 
                    color: COLORS.textMuted
                  }}>
                    <i className='bx bx-calendar' style={{ fontSize: 12 }} />
                    {new Date(t.date_creation).toLocaleDateString('fr-FR', {
                      day: '2-digit', month: 'short', year: 'numeric'
                    })}
                  </span>
                </div>

                {t.description && (
                  <p style={{
                    margin: '0 0 8px', 
                    fontSize: 11,
                    color: COLORS.textMuted, 
                    lineHeight: 1.4
                  }}>
                    {t.description}
                  </p>
                )}

                <div style={{
                  borderTop: `1px solid ${COLORS.border}`,
                  paddingTop: 8, 
                  marginTop: 4
                }}>
                  <span style={{
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: 4,
                    padding: '3px 8px', 
                    borderRadius: 6,
                    fontSize: 10, 
                    fontWeight: 600,
                    background: t.is_visible ? '#ecfdf5' : '#f1f5f9',
                    color: t.is_visible ? '#059669' : '#94a3b8',
                  }}>
                    <i className={`bx ${t.is_visible ? 'bx-check-circle' : 'bx-hide'}`} style={{ fontSize: 11 }} />
                    {t.is_visible ? 'Active' : 'Masquée'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}