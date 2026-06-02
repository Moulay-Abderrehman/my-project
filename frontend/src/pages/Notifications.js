import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

// ─── PARSING BUDGET TERMINÉ (message structuré) ───────────────────────────────
function parseBudgetMessage(message) {
  if (!message || !message.includes('🏁 Budget terminé')) return null;
  
  const data = {
    categorie: '',
    debut: '',
    fin: '',
    montant_prevu: 0,
    montant_depense: 0,
    statut: '',
    pourcentage: 0,
    est_depasse: false,
    depenses: [],
    nb_depenses: 0
  };
  
  const lines = message.split('\n');
  
  for (const line of lines) {
    if (line.includes('🏁 Budget terminé :')) {
      data.categorie = line.replace('🏁 Budget terminé :', '').trim();
    } 
    else if (line.includes('Période :')) {
      const periode = line.replace('Période :', '').trim();
      const parts = periode.split('→');
      data.debut = parts[0]?.trim();
      data.fin = parts[1]?.trim();
    } 
    else if (line.includes('Montant prévu :')) {
      const val = line.replace('Montant prévu :', '').replace('MRU', '').trim();
      data.montant_prevu = parseFloat(val) || 0;
    } 
    else if (line.includes('Total dépensé :')) {
      const total = line.replace('Total dépensé :', '').replace('MRU', '').trim();
      const match = total.match(/([\d.,]+)\s*\((.+)\)/);
      if (match) {
        data.montant_depense = parseFloat(match[1].replace(',', '.')) || 0;
        data.statut = match[2];
        if (data.statut.includes('DÉPASSÉ')) {
          data.est_depasse = true;
        }
        const pctMatch = data.statut.match(/(\d+(?:\.\d+)?)%/);
        if (pctMatch) {
          data.pourcentage = parseFloat(pctMatch[1]);
        }
      } else {
        data.montant_depense = parseFloat(total.replace(',', '.')) || 0;
      }
    }
    else if (line.includes('Détail des dépenses du budget')) {
      const match = line.match(/\((\d+)\)/);
      if (match) data.nb_depenses = parseInt(match[1]);
    }
    else if (line.trim().startsWith('-') && line.trim().length > 1) {
      const cleanLine = line.trim().replace(/^-\s*/, '');
      const timeMatch = cleanLine.match(/(\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2})\s*:\s*(.+)/);
      if (timeMatch) {
        data.depenses.push({
          date: timeMatch[1],
          montant: timeMatch[2].replace('MRU', '').trim()
        });
      } else {
        data.depenses.push({
          date: '',
          montant: cleanLine
        });
      }
    }
  }
  
  return data;
}

// ─── PARSING ABONNEMENT ───────────────────────────────────────────────────────
function parseAbonnementMessage(message) {
  if (!message || !message.startsWith('ABONNEMENT_ACTIVE|')) return null;
  return Object.fromEntries(
    message.split('|').slice(1).map(p => p.split(':'))
  );
}

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtre, setFiltre] = useState('toutes');
  const [selectedNotif, setSelectedNotif] = useState(null);
  const [expandedDepenses, setExpandedDepenses] = useState(null);

  const charger = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications/');
      setNotifications(res.data.results || res.data);
    } catch {
      toast.error('Erreur chargement notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { charger(); }, []);

  const marquerLue = async (id) => {
    await api.patch(`/notifications/${id}/lue/`);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, est_lue: true } : n));
    toast.success('Notification marquée comme lue');
  };

  const marquerToutes = async () => {
    await api.patch('/notifications/toutes-lues/');
    setNotifications(prev => prev.map(n => ({ ...n, est_lue: true })));
    toast.success('Toutes les notifications sont lues');
  };

  const openModal = async (n) => {
    setSelectedNotif(n);
    if (!n.est_lue) await marquerLue(n.id);
  };

  const closeModal = () => {
    setSelectedNotif(null);
    setExpandedDepenses(null);
  };

  const toggleDepenses = (id) => {
    setExpandedDepenses(expandedDepenses === id ? null : id);
  };

  const filtrees = notifications.filter(n => {
    if (filtre === 'non_lues') return !n.est_lue;
    if (filtre !== 'toutes') return n.type === filtre;
    return true;
  });

  const nonLues = notifications.filter(n => !n.est_lue).length;
  const types = [...new Set(notifications.map(n => n.type))];

  const getTypeConfig = (type) => {
    const configs = {
      budget_termine: {
        icon: 'bx-flag',
        color: '#6366f1',
        bg: '#eef2ff',
        border: '#c7d2fe',
        label: 'Budget',
        gradient: 'linear-gradient(135deg, #6366f1, #4f46e5)',
      },
      alerte_budget: {
        icon: 'bx-bell',
        color: '#f59e0b',
        bg: '#fef3c7',
        border: '#fde68a',
        label: 'Alerte',
        gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
      },
      depassement_budget: {
        icon: 'bx-error-circle',
        color: '#ef4444',
        bg: '#fef2f2',
        border: '#fecaca',
        label: 'Dépassement',
        gradient: 'linear-gradient(135deg, #ef4444, #dc2626)',
      },
      expiration_abonnement: {
        icon: 'bx-hourglass',
        color: '#3b82f6',
        bg: '#eff6ff',
        border: '#bfdbfe',
        label: 'Abonnement',
        gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)',
      },
      info: {
        icon: 'bx-info-circle',
        color: '#10b981',
        bg: '#ecfdf5',
        border: '#a7f3d0',
        label: 'Info',
        gradient: 'linear-gradient(135deg, #10b981, #059669)',
      },
    };
    return configs[type] || {
      icon: 'bx-bell',
      color: '#64748b',
      bg: '#f8fafc',
      border: '#e2e8f0',
      label: 'Notif',
      gradient: 'linear-gradient(135deg, #64748b, #475569)',
    };
  };

  const formatMontant = (val) => {
    if (!val && val !== 0) return '0';
    return Math.round(val).toLocaleString('fr-FR');
  };

  const getPourcentage = (depense, prevu) => {
    if (!prevu || prevu === 0) return 0;
    return Math.min(Math.round((depense / prevu) * 100), 100);
  };

  return (
    <div style={{
      padding: '12px',
      maxWidth: 800,
      margin: '0 auto',
      minHeight: '100vh',
      background: '#f5f7fb',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      <link rel="stylesheet" href="https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .notif-card {
          transition: all 0.2s ease;
          cursor: pointer;
        }
        .notif-card:active {
          transform: scale(0.98);
        }
        .filter-btn {
          transition: all 0.2s ease;
        }
        .progress-bar {
          transition: width 0.4s ease;
        }
        .modal-overlay {
          animation: fadeIn 0.2s ease;
        }
        @media (max-width: 640px) {
          .stats-row {
            flex-direction: column !important;
            gap: 8px !important;
          }
          .period-row {
            flex-direction: column !important;
            gap: 6px !important;
          }
          .depense-item {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 6px !important;
          }
          .modal-content {
            width: 95% !important;
            margin: 16px !important;
            padding: 16px !important;
          }
        }
      `}</style>

      {/* ── EN-TÊTE ── */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
        paddingBottom: 12,
        borderBottom: '1px solid #e2e8f0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 40,
            height: 40,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(99,102,241,0.2)',
            color: '#fff',
          }}>
            <i className='bx bx-bell' style={{ fontSize: 20 }} />
          </div>
          <div>
            <h1 style={{
              margin: 0,
              color: '#0f172a',
              fontWeight: 700,
              fontSize: '18px',
              letterSpacing: '-0.3px',
            }}>
              Notifications
            </h1>
            <p style={{ margin: '2px 0 0', color: '#64748b', fontSize: '11px' }}>
              Restez informé de vos activités
            </p>
          </div>
          {nonLues > 0 && (
            <div style={{
              background: '#ef4444',
              color: '#fff',
              borderRadius: 20,
              padding: '2px 8px',
              fontSize: 10,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}>
              <i className='bx bx-circle' style={{ fontSize: 6 }} />
              {nonLues}
            </div>
          )}
        </div>

        {nonLues > 0 && (
          <button onClick={marquerToutes} style={{
            background: 'transparent',
            border: `1px solid #6366f1`,
            borderRadius: 20,
            padding: '5px 12px',
            cursor: 'pointer',
            fontSize: 11,
            fontWeight: 500,
            color: '#6366f1',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}>
            <i className='bx bx-check-double' style={{ fontSize: 12 }} />
            Tout lire
          </button>
        )}
      </div>

      {/* ── FILTRES ── */}
      <div style={{
        display: 'flex',
        gap: 8,
        marginBottom: 16,
        flexWrap: 'wrap',
      }}>
        <button onClick={() => setFiltre('toutes')} className="filter-btn" style={{
          padding: '5px 12px',
          borderRadius: 20,
          border: filtre === 'toutes' ? 'none' : '1px solid #e2e8f0',
          cursor: 'pointer',
          fontSize: 11,
          fontWeight: 500,
          background: filtre === 'toutes' ? '#1e293b' : '#fff',
          color: filtre === 'toutes' ? '#fff' : '#64748b',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}>
          <i className='bx bx-list-ul' style={{ fontSize: 12 }} />
          Toutes ({notifications.length})
        </button>
        <button onClick={() => setFiltre('non_lues')} className="filter-btn" style={{
          padding: '5px 12px',
          borderRadius: 20,
          border: filtre === 'non_lues' ? 'none' : '1px solid #e2e8f0',
          cursor: 'pointer',
          fontSize: 11,
          fontWeight: 500,
          background: filtre === 'non_lues' ? '#1e293b' : '#fff',
          color: filtre === 'non_lues' ? '#fff' : '#64748b',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}>
          <i className='bx bx-envelope-open' style={{ fontSize: 12 }} />
          Non lues ({nonLues})
        </button>
        {types.filter(t => t !== 'toutes' && t !== 'non_lues').slice(0, 3).map(t => {
          const cfg = getTypeConfig(t);
          return (
            <button key={t} onClick={() => setFiltre(t)} className="filter-btn" style={{
              padding: '5px 12px',
              borderRadius: 20,
              border: filtre === t ? 'none' : `1px solid ${cfg.border}`,
              cursor: 'pointer',
              fontSize: 11,
              fontWeight: 500,
              background: filtre === t ? cfg.gradient : '#fff',
              color: filtre === t ? '#fff' : cfg.color,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}>
              <i className={`bx ${cfg.icon}`} style={{ fontSize: 12 }} />
              {cfg.label}
            </button>
          );
        })}
      </div>

      {/* ── LISTE DES NOTIFICATIONS ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', background: '#fff', borderRadius: 16 }}>
          <div style={{
            width: 40, height: 40,
            margin: '0 auto 12px',
            border: '3px solid #e2e8f0',
            borderTopColor: '#6366f1',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }} />
          <p style={{ color: '#64748b', fontSize: 12 }}>Chargement...</p>
        </div>
      ) : filtrees.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', background: '#fff', borderRadius: 16 }}>
          <i className='bx bx-bell-off' style={{ fontSize: 48, color: '#cbd5e1' }} />
          <h3 style={{ margin: '8px 0 4px', fontSize: 16, color: '#1e293b' }}>Aucune notification</h3>
          <p style={{ fontSize: 12, color: '#64748b' }}>
            {filtre === 'non_lues' ? 'Toutes vos notifications sont lues.' : 'Aucune notification pour le moment.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtrees.map((n, index) => {
            const cfg = getTypeConfig(n.type);
            const budgetData = parseBudgetMessage(n.message);
            const aboData = parseAbonnementMessage(n.message);
            
            return (
              <div
                key={n.id}
                className="notif-card"
                onClick={() => openModal(n)}
                style={{
                  background: n.est_lue ? '#fff' : cfg.bg,
                  borderRadius: 14,
                  border: `1px solid ${n.est_lue ? '#e2e8f0' : cfg.border}`,
                  padding: '12px',
                  boxShadow: n.est_lue ? '0 1px 2px rgba(0,0,0,0.03)' : `0 2px 8px ${cfg.color}15`,
                  opacity: n.est_lue ? 0.85 : 1,
                  animation: `slideIn 0.2s ease ${index * 0.03}s both`,
                  position: 'relative',
                }}
              >
                {!n.est_lue && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: 0,
                    height: 0,
                    borderStyle: 'solid',
                    borderWidth: '0 30px 30px 0',
                    borderColor: `transparent ${cfg.color} transparent transparent`,
                  }} />
                )}

                <div style={{ display: 'flex', gap: 10 }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: `${cfg.color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    color: cfg.color,
                  }}>
                    <i className={`bx ${cfg.icon}`} style={{ fontSize: 18 }} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: 9,
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.3px',
                        color: cfg.color,
                        background: `${cfg.color}10`,
                        borderRadius: 10,
                        padding: '2px 8px',
                      }}>
                        {cfg.label}
                      </span>
                      {!n.est_lue && (
                        <span style={{ fontSize: 9, color: cfg.color, display: 'flex', alignItems: 'center', gap: 3 }}>
                          <i className='bx bx-circle' style={{ fontSize: 6 }} />
                          Nouveau
                        </span>
                      )}
                    </div>

                    {budgetData && budgetData.categorie ? (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
                          <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#1e293b' }}>
                            {budgetData.categorie}
                          </h3>
                          {budgetData.est_depasse && (
                            <span style={{ fontSize: 9, color: '#ef4444', background: '#fef2f2', padding: '2px 6px', borderRadius: 8 }}>
                              Dépassé
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                          <div style={{ flex: 1 }}>
                            <span style={{ fontSize: 8, color: '#64748b' }}>Prévu</span>
                            <div style={{ fontSize: 11, fontWeight: 700 }}>{formatMontant(budgetData.montant_prevu)} MRU</div>
                          </div>
                          <div style={{ flex: 1 }}>
                            <span style={{ fontSize: 8, color: '#64748b' }}>Dépensé</span>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#ef4444' }}>{formatMontant(budgetData.montant_depense)} MRU</div>
                          </div>
                          <div style={{ flex: 1 }}>
                            <span style={{ fontSize: 8, color: '#64748b' }}>Utilisé</span>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#10b981' }}>
                              {budgetData.pourcentage || getPourcentage(budgetData.montant_depense, budgetData.montant_prevu)}%
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : aboData ? (
                      <div>
                        <h3 style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#1e293b' }}>
                          Abonnement {aboData.plan} {aboData.type}
                        </h3>
                        <p style={{ margin: '2px 0 0', fontSize: 10, color: cfg.color }}>Activé avec succès</p>
                      </div>
                    ) : (
                      <p style={{ margin: 0, fontSize: 12, color: '#334155', lineHeight: 1.4 }}>
                        {n.message.length > 100 ? n.message.slice(0, 100) + '...' : n.message}
                      </p>
                    )}

                    <div style={{
                      marginTop: 8,
                      fontSize: 9,
                      color: '#94a3b8',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}>
                      <i className='bx bx-time' style={{ fontSize: 9 }} />
                      {new Date(n.date_creation).toLocaleDateString('fr-FR', {
                        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                      })}
                    </div>
                  </div>

                  <i className='bx bx-chevron-right' style={{ fontSize: 18, color: '#94a3b8' }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── MODAL DÉTAIL ── */}
      {selectedNotif && (() => {
        const cfg = getTypeConfig(selectedNotif.type);
        const budgetData = parseBudgetMessage(selectedNotif.message);
        const aboData = parseAbonnementMessage(selectedNotif.message);
        
        return (
          <div
            className="modal-overlay"
            onClick={closeModal}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(4px)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
            }}
          >
            <div
              className="modal-content"
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#fff',
                borderRadius: 20,
                maxWidth: 500,
                width: '100%',
                maxHeight: '85vh',
                overflow: 'auto',
                padding: '20px',
                animation: 'fadeIn 0.2s ease',
              }}
            >
              {/* En-tête modal */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: `${cfg.color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: cfg.color,
                  }}>
                    <i className={`bx ${cfg.icon}`} style={{ fontSize: 22 }} />
                  </div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1e293b' }}>
                      {cfg.label}
                    </h2>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: '#64748b' }}>
                      {new Date(selectedNotif.date_creation).toLocaleDateString('fr-FR', {
                        day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  style={{
                    background: '#f1f5f9',
                    border: 'none',
                    borderRadius: 8,
                    width: 32,
                    height: 32,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#64748b',
                  }}
                >
                  <i className='bx bx-x' style={{ fontSize: 18 }} />
                </button>
              </div>

              {/* Contenu modal */}
              {budgetData && budgetData.categorie ? (
                <div>
                  <div style={{
                    background: `linear-gradient(135deg, ${cfg.color}10, ${cfg.color}05)`,
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 16,
                  }}>
                    <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 800, color: '#1e293b' }}>
                      {budgetData.categorie}
                    </h3>
                    <p style={{ margin: 0, fontSize: 12, color: cfg.color }}>
                      Période du {budgetData.debut} au {budgetData.fin}
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                    <div style={{ flex: 1, background: '#f8fafc', borderRadius: 12, padding: 12, textAlign: 'center' }}>
                      <i className='bx bx-target-lock' style={{ fontSize: 18, color: '#6366f1' }} />
                      <p style={{ margin: '8px 0 4px', fontSize: 11, color: '#64748b' }}>Montant prévu</p>
                      <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#1e293b' }}>
                        {formatMontant(budgetData.montant_prevu)} MRU
                      </p>
                    </div>
                    <div style={{ flex: 1, background: '#f8fafc', borderRadius: 12, padding: 12, textAlign: 'center' }}>
                      <i className='bx bx-trending-down' style={{ fontSize: 18, color: '#ef4444' }} />
                      <p style={{ margin: '8px 0 4px', fontSize: 11, color: '#64748b' }}>Total dépensé</p>
                      <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#ef4444' }}>
                        {formatMontant(budgetData.montant_depense)} MRU
                      </p>
                    </div>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 11, color: '#64748b' }}>Utilisation</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: cfg.color }}>
                        {budgetData.pourcentage || getPourcentage(budgetData.montant_depense, budgetData.montant_prevu)}%
                      </span>
                    </div>
                    <div style={{ height: 8, background: '#e2e8f0', borderRadius: 20, overflow: 'hidden' }}>
                      <div style={{
                        width: `${getPourcentage(budgetData.montant_depense, budgetData.montant_prevu)}%`,
                        height: '100%',
                        background: budgetData.est_depasse ? '#ef4444' : cfg.color,
                        borderRadius: 20,
                      }} />
                    </div>
                  </div>

                  {budgetData.depenses && budgetData.depenses.length > 0 && (
                    <div style={{ borderTop: `1px solid ${cfg.color}20`, paddingTop: 12 }}>
                      <div 
                        onClick={() => toggleDepenses(selectedNotif.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          marginBottom: expandedDepenses === selectedNotif.id ? 12 : 0,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <i className='bx bx-list-ul' style={{ fontSize: 16, color: cfg.color }} />
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>
                            Détail des dépenses ({budgetData.depenses.length})
                          </span>
                        </div>
                        <i className={`bx ${expandedDepenses === selectedNotif.id ? 'bx-chevron-up' : 'bx-chevron-down'}`} style={{ fontSize: 18, color: '#64748b' }} />
                      </div>
                      {expandedDepenses === selectedNotif.id && (
                        <div>
                          {budgetData.depenses.map((dep, idx) => (
                            <div key={idx} style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '10px 0',
                              borderBottom: idx < budgetData.depenses.length - 1 ? '1px solid #e2e8f0' : 'none',
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <i className='bx bx-money' style={{ fontSize: 14, color: '#ef4444' }} />
                                <span style={{ fontSize: 12, color: '#475569' }}>
                                  {dep.date ? dep.date.split(' ')[0] : `Dépense ${idx + 1}`}
                                </span>
                              </div>
                              <span style={{ fontSize: 12, fontWeight: 600, color: '#1e293b' }}>
                                -{dep.montant?.replace(/\s*MRU/, '').trim() || dep.montant} MRU
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : aboData ? (
                <div>
                  <div style={{
                    background: `linear-gradient(135deg, ${cfg.color}10, ${cfg.color}05)`,
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 16,
                    textAlign: 'center',
                  }}>
                    <div style={{
                      width: 60,
                      height: 60,
                      background: `linear-gradient(135deg, ${cfg.color}, ${cfg.color}cc)`,
                      borderRadius: 20,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 12px',
                    }}>
                      <i className='bx bx-crown' style={{ fontSize: 28, color: '#fff' }} />
                    </div>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1e293b' }}>
                      Abonnement {aboData.plan} {aboData.type}
                    </h3>
                    <p style={{ margin: '4px 0 0', fontSize: 12, color: cfg.color }}>Activé avec succès</p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                    <div style={{ background: '#f8fafc', borderRadius: 12, padding: 12 }}>
                      <i className='bx bx-calendar' style={{ fontSize: 16, color: cfg.color }} />
                      <p style={{ margin: '8px 0 4px', fontSize: 11, color: '#64748b' }}>Date de début</p>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>{aboData.debut}</p>
                    </div>
                    <div style={{ background: '#f8fafc', borderRadius: 12, padding: 12 }}>
                      <i className='bx bx-calendar-check' style={{ fontSize: 16, color: cfg.color }} />
                      <p style={{ margin: '8px 0 4px', fontSize: 11, color: '#64748b' }}>Date de fin</p>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>{aboData.fin}</p>
                    </div>
                    <div style={{ background: '#f8fafc', borderRadius: 12, padding: 12 }}>
                      <i className='bx bx-coin' style={{ fontSize: 16, color: cfg.color }} />
                      <p style={{ margin: '8px 0 4px', fontSize: 11, color: '#64748b' }}>Montant</p>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>{aboData.montant} MRU</p>
                    </div>
                    <div style={{ background: '#f8fafc', borderRadius: 12, padding: 12 }}>
                      <i className='bx bx-time' style={{ fontSize: 16, color: cfg.color }} />
                      <p style={{ margin: '8px 0 4px', fontSize: 11, color: '#64748b' }}>Durée</p>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>{aboData.duree}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <p style={{ fontSize: 14, color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-wrap', margin: 0 }}>
                    {selectedNotif.message}
                  </p>
                </div>
              )}

              <button
                onClick={closeModal}
                style={{
                  width: '100%',
                  marginTop: 20,
                  background: cfg.gradient,
                  color: '#fff',
                  border: 'none',
                  borderRadius: 12,
                  padding: '12px',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                Fermer
              </button>
            </div>
          </div>
        );
      })()}

      {/* ── Footer ── */}
      {filtrees.length > 0 && (
        <div style={{
          marginTop: 16,
          paddingTop: 12,
          borderTop: '1px solid #e2e8f0',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: 10, color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <i className='bx bx-show' style={{ fontSize: 10 }} />
            {filtrees.length} notification{filtrees.length > 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );
}