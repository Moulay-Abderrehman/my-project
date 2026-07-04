import React, { useEffect, useState } from 'react';
import api from '../api/axios';

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
const ABONNEMENT_PREFIXES = {
  'ABONNEMENT_ACTIVE':          'active',
  'ABONNEMENT_EN_ATTENTE':      'attente',
  'ABONNEMENT_REFUSE':          'refuse',
  'ABONNEMENT_PAIEMENT_ECHOUE': 'echoue',
  'ABONNEMENT_EXPIRE':          'expire',
};

function parseAbonnementMessage(message) {
  if (!message) return null;

  const prefix = Object.keys(ABONNEMENT_PREFIXES).find(p => message.startsWith(p + '|'));
  if (!prefix) return null;

  const etat = ABONNEMENT_PREFIXES[prefix];
  const reste = message.slice(prefix.length + 1);
  const segments = reste.split('|');

  const data = { etat };
  segments.forEach(seg => {
    const idx = seg.indexOf(':');
    if (idx === -1) return;
    const key = seg.slice(0, idx).trim();
    const value = seg.slice(idx + 1).trim();
    data[key] = value;
  });

  return data;
}

// ─── Libellés méthode de paiement (cohérent avec Profile.js) ─────────────────
function methodeLabel(m) {
  const labels = {
    rssbank: 'RSSBank',
    sedad: 'Sedad',
    bankily: 'Bankily',
    masrivi: 'Masrivi',
    trackpay: 'TrackPay',
    mobile_money: 'Mobile Money',
  };
  return labels[m] || m || '—';
}

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtre, setFiltre] = useState('toutes');
  const [selectedNotif, setSelectedNotif] = useState(null);
  const [expandedDepenses, setExpandedDepenses] = useState(null);

  const [feedback, setFeedback] = useState({ show: false, message: '', type: '' });

  const [confirmDialog, setConfirmDialog] = useState({
    show: false,
    message: '',
    onConfirm: null,
    onCancel: null
  });

  const charger = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications/');
      setNotifications(res.data.results || res.data);
    } catch (error) {
      console.error('Erreur chargement:', error);
      showFeedback('Erreur chargement notifications', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { charger(); }, []);

  const showFeedback = (message, type = 'success') => {
    setFeedback({ show: true, message, type });
    setTimeout(() => {
      setFeedback({ show: false, message: '', type: '' });
    }, 5000);
  };

  const showConfirmDialog = (message, onConfirm, onCancel) => {
    setConfirmDialog({
      show: true,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmDialog({ show: false, message: '', onConfirm: null, onCancel: null });
      },
      onCancel: () => {
        if (onCancel) onCancel();
        setConfirmDialog({ show: false, message: '', onConfirm: null, onCancel: null });
      }
    });
  };

  const marquerLue = async (id) => {
    try {
      await api.patch(`/notifications/${id}/lue/`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, est_lue: true } : n));
      showFeedback('Notification marquée comme lue', 'success');
    } catch (error) {
      console.error('Erreur marquage:', error);
      showFeedback('Erreur lors du marquage', 'error');
    }
  };

  const marquerToutes = async () => {
    try {
      await api.patch('/notifications/toutes-lues/');
      setNotifications(prev => prev.map(n => ({ ...n, est_lue: true })));
      showFeedback('Toutes les notifications sont lues', 'success');
    } catch (error) {
      console.error('Erreur marquage toutes:', error);
      showFeedback('Erreur lors du marquage', 'error');
    }
  };

  const supprimerUne = async (id) => {
    if (!id) {
      showFeedback('ID de notification invalide', 'error');
      return;
    }

    try {
      console.log('Suppression de la notification:', id);
      const response = await api.delete(`/notifications/${id}/`);
      console.log('Réponse suppression:', response);

      setNotifications(prev => prev.filter(n => n.id !== id));
      showFeedback('Notification supprimée avec succès', 'success');
    } catch (error) {
      console.error('Erreur suppression détaillée:', error);

      if (error.response) {
        console.error('Erreur réponse:', error.response.status, error.response.data);
        if (error.response.status === 404) {
          showFeedback('Notification non trouvée (peut-être déjà supprimée)', 'error');
          charger();
        } else {
          showFeedback(`Erreur serveur: ${error.response.data?.detail || 'Erreur inconnue'}`, 'error');
        }
      } else if (error.request) {
        console.error('Pas de réponse du serveur');
        showFeedback('Impossible de contacter le serveur', 'error');
      } else {
        showFeedback('Erreur lors de la suppression', 'error');
      }
    }
  };

  const handleDeleteClick = (e, id) => {
    e.stopPropagation();
    showConfirmDialog(
      'Voulez-vous vraiment supprimer cette notification ?',
      () => supprimerUne(id)
    );
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

  // ─── Palette de marque FinanceApp ──────────────────────────────────────────
  const BRAND = '#356267';
  const BRAND_LIGHT = '#c2f2f2';
  const NEUTRAL = '#ebe7e1';
  const NAVY = '#10214b';
  const SUCCESS = '#4ea674';
  const SUCCESS_BG = '#e9f8e7';
  const SUCCESS_DARK = '#459071';
  const DANGER = '#d55053';
  const DANGER_BG = '#fbe9e9';
  const GOLD = '#c99a3f';
  const GOLD_BG = '#fbf3e1';

  const getTypeConfig = (type) => {
    const configs = {
      budget_termine: {
        icon: 'bx-flag',
        color: BRAND,
        bg: BRAND_LIGHT,
        border: '#9fdede',
        label: 'Budget',
        gradient: `linear-gradient(135deg, ${BRAND}, #244548)`,
      },
      alerte_budget: {
        icon: 'bx-bell',
        color: GOLD,
        bg: GOLD_BG,
        border: '#eeddb3',
        label: 'Alerte',
        gradient: `linear-gradient(135deg, ${GOLD}, #a97e2c)`,
      },
      depassement_budget: {
        icon: 'bx-error-circle',
        color: DANGER,
        bg: DANGER_BG,
        border: '#f2c3c4',
        label: 'Dépassement',
        gradient: `linear-gradient(135deg, ${DANGER}, #b83f42)`,
      },
      expiration_abonnement: {
        icon: 'bx-hourglass',
        color: BRAND,
        bg: BRAND_LIGHT,
        border: '#9fdede',
        label: 'Abonnement',
        gradient: `linear-gradient(135deg, ${BRAND}, #244548)`,
      },
      abonnement_active: {
        icon: 'bx-crown',
        color: SUCCESS,
        bg: SUCCESS_BG,
        border: '#bfe8b6',
        label: 'Activé',
        gradient: `linear-gradient(135deg, ${SUCCESS}, ${SUCCESS_DARK})`,
      },
      abonnement_attente: {
        icon: 'bx-time-five',
        color: GOLD,
        bg: GOLD_BG,
        border: '#eeddb3',
        label: 'En attente',
        gradient: `linear-gradient(135deg, ${GOLD}, #a97e2c)`,
      },
      abonnement_refuse: {
        icon: 'bx-x-circle',
        color: DANGER,
        bg: DANGER_BG,
        border: '#f2c3c4',
        label: 'Refusé',
        gradient: `linear-gradient(135deg, ${DANGER}, #b83f42)`,
      },
      abonnement_expire: {
        icon: 'bx-calendar-x',
        color: '#7a7267',
        bg: NEUTRAL,
        border: '#d8d2c7',
        label: 'Expiré',
        gradient: 'linear-gradient(135deg, #8a8378, #6b6459)',
      },
      info: {
        icon: 'bx-info-circle',
        color: SUCCESS,
        bg: SUCCESS_BG,
        border: '#bfe8b6',
        label: 'Info',
        gradient: `linear-gradient(135deg, ${SUCCESS}, ${SUCCESS_DARK})`,
      },
    };
    return configs[type] || {
      icon: 'bx-bell',
      color: '#7a7267',
      bg: NEUTRAL,
      border: '#d8d2c7',
      label: 'Notif',
      gradient: 'linear-gradient(135deg, #8a8378, #6b6459)',
    };
  };

  const getAboEtatConfig = (etat) => {
    const configs = {
      active: {
        icon: 'bx-check-shield',
        color: SUCCESS,
        bg: SUCCESS_BG,
        border: '#bfe8b6',
        gradient: `linear-gradient(135deg, ${SUCCESS}, ${SUCCESS_DARK})`,
        titre: 'Abonnement activé',
      },
      attente: {
        icon: 'bx-time-five',
        color: GOLD,
        bg: GOLD_BG,
        border: '#eeddb3',
        gradient: `linear-gradient(135deg, ${GOLD}, #a97e2c)`,
        titre: 'Demande en attente',
      },
      refuse: {
        icon: 'bx-x-circle',
        color: DANGER,
        bg: DANGER_BG,
        border: '#f2c3c4',
        gradient: `linear-gradient(135deg, ${DANGER}, #b83f42)`,
        titre: 'Demande refusée',
      },
      echoue: {
        icon: 'bx-error-circle',
        color: DANGER,
        bg: DANGER_BG,
        border: '#f2c3c4',
        gradient: `linear-gradient(135deg, ${DANGER}, #b83f42)`,
        titre: 'Paiement échoué',
      },
      expire: {
        icon: 'bx-calendar-x',
        color: '#7a7267',
        bg: NEUTRAL,
        border: '#d8d2c7',
        gradient: 'linear-gradient(135deg, #8a8378, #6b6459)',
        titre: 'Abonnement expiré',
      },
    };
    return configs[etat];
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
      fontFamily: "'DM Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      <link rel="stylesheet" href="https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css" />
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Outfit:wght@600;700;800&display=swap" rel="stylesheet" />

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .notif-card {
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
        }
        .notif-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(16,33,75,0.08) !important;
        }
        .notif-card:active {
          transform: scale(0.98);
        }
        .filter-btn {
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .filter-btn:hover {
          transform: translateY(-1px);
        }
        .icon-btn {
          transition: all 0.2s ease;
        }
        .icon-btn:hover {
          transform: scale(1.08);
        }
        .action-btn {
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .action-btn:hover {
          transform: translateY(-1px) scale(1.01);
          filter: brightness(1.04);
          box-shadow: 0 6px 18px rgba(16,33,75,0.12);
        }
        .action-btn:active {
          transform: translateY(0) scale(0.99);
        }
        .progress-bar {
          transition: width 0.4s ease;
        }
        .modal-overlay {
          animation: fadeIn 0.2s ease;
        }
        .feedback-banner {
          animation: slideDown 0.3s ease;
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
          .action-buttons {
            flex-wrap: wrap !important;
          }
          .confirm-dialog {
            width: 90% !important;
            margin: 16px !important;
          }
          .abo-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* ── BANNIÈRE DE FEEDBACK ── */}
      {feedback.show && (
        <div className="feedback-banner" style={{
          position: 'fixed',
          top: '16px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          background: feedback.type === 'success' ? SUCCESS : DANGER,
          color: '#fff',
          padding: '12px 24px',
          borderRadius: 12,
          boxShadow: '0 10px 30px rgba(16,33,75,0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          maxWidth: '90%',
          fontWeight: 600,
          fontSize: 13,
        }}>
          <i className={`bx ${feedback.type === 'success' ? 'bx-check-circle' : 'bx-error-circle'}`} style={{ fontSize: 20 }} />
          {feedback.message}
          <button
            onClick={() => setFeedback({ show: false, message: '', type: '' })}
            className="icon-btn"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              fontSize: 18,
              display: 'flex',
              alignItems: 'center',
              padding: '0 4px',
            }}
          >
            <i className='bx bx-x' />
          </button>
        </div>
      )}

      {/* ── BOÎTE DE DIALOGUE DE CONFIRMATION ── */}
      {confirmDialog.show && (
        <div
          className="modal-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(16,33,75,0.55)',
            backdropFilter: 'blur(4px)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div className="confirm-dialog" style={{
            background: '#ffffff',
            borderRadius: 18,
            maxWidth: 400,
            width: '100%',
            padding: '24px',
            animation: 'fadeIn 0.2s ease',
            boxShadow: '0 24px 60px rgba(16,33,75,0.28)',
          }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{
                width: 48,
                height: 48,
                background: DANGER_BG,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
                color: DANGER,
              }}>
                <i className='bx bx-error' style={{ fontSize: 24 }} />
              </div>
              <h3 style={{
                margin: '0 0 8px',
                fontSize: 16,
                fontWeight: 700,
                color: NAVY,
                fontFamily: "'Outfit', sans-serif",
              }}>
                Confirmation
              </h3>
              <p style={{
                margin: 0,
                fontSize: 14,
                color: '#5b6472',
                lineHeight: 1.5
              }}>
                {confirmDialog.message}
              </p>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={confirmDialog.onCancel}
                className="action-btn"
                style={{
                  flex: 1,
                  padding: '11px',
                  background: NEUTRAL,
                  border: 'none',
                  borderRadius: 10,
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#5b6472',
                  minHeight: 44,
                }}
              >
                Annuler
              </button>
              <button
                onClick={confirmDialog.onConfirm}
                className="action-btn"
                style={{
                  flex: 1,
                  padding: '11px',
                  background: DANGER,
                  border: 'none',
                  borderRadius: 10,
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#fff',
                  minHeight: 44,
                }}
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── EN-TÊTE ── */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
        paddingBottom: 12,
        borderBottom: `1px solid ${NEUTRAL}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 40,
            height: 40,
            background: `linear-gradient(135deg, ${BRAND}, #1f3a3d)`,
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 6px 16px ${BRAND}33`,
            color: '#fff',
          }}>
            <i className='bx bx-bell' style={{ fontSize: 20 }} />
          </div>
          <div>
            <h1 style={{
              margin: 0,
              color: NAVY,
              fontWeight: 800,
              fontSize: '18px',
              letterSpacing: '-0.3px',
              fontFamily: "'Outfit', sans-serif",
            }}>
              Notifications
            </h1>
            <p style={{ margin: '2px 0 0', color: '#5b6472', fontSize: '11px' }}>
              Restez informé de vos activités
            </p>
          </div>
          {nonLues > 0 && (
            <div style={{
              background: DANGER,
              color: '#fff',
              borderRadius: 20,
              padding: '2px 8px',
              fontSize: 10,
              fontWeight: 700,
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
          <button onClick={marquerToutes} className="action-btn" style={{
            background: 'transparent',
            border: `1.5px solid ${BRAND}`,
            borderRadius: 20,
            padding: '7px 14px',
            cursor: 'pointer',
            fontSize: 11,
            fontWeight: 600,
            color: BRAND,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            minHeight: 36,
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
        alignItems: 'center',
      }}>
        <button onClick={() => setFiltre('toutes')} className="filter-btn" style={{
          padding: '6px 14px',
          borderRadius: 20,
          border: filtre === 'toutes' ? 'none' : `1px solid ${NEUTRAL}`,
          cursor: 'pointer',
          fontSize: 11,
          fontWeight: 600,
          background: filtre === 'toutes' ? NAVY : '#fff',
          color: filtre === 'toutes' ? '#fff' : '#5b6472',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}>
          <i className='bx bx-list-ul' style={{ fontSize: 12 }} />
          Toutes ({notifications.length})
        </button>
        <button onClick={() => setFiltre('non_lues')} className="filter-btn" style={{
          padding: '6px 14px',
          borderRadius: 20,
          border: filtre === 'non_lues' ? 'none' : `1px solid ${NEUTRAL}`,
          cursor: 'pointer',
          fontSize: 11,
          fontWeight: 600,
          background: filtre === 'non_lues' ? NAVY : '#fff',
          color: filtre === 'non_lues' ? '#fff' : '#5b6472',
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
              padding: '6px 14px',
              borderRadius: 20,
              border: filtre === t ? 'none' : `1px solid ${cfg.border}`,
              cursor: 'pointer',
              fontSize: 11,
              fontWeight: 600,
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
        <div style={{ textAlign: 'center', padding: '40px 20px', background: '#ffffff', borderRadius: 16, border: `1px solid ${NEUTRAL}` }}>
          <div style={{
            width: 40, height: 40,
            margin: '0 auto 12px',
            border: `3px solid ${NEUTRAL}`,
            borderTopColor: BRAND,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }} />
          <p style={{ color: '#5b6472', fontSize: 12 }}>Chargement...</p>
        </div>
      ) : filtrees.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', background: '#ffffff', borderRadius: 16, border: `1px solid ${NEUTRAL}` }}>
          <i className='bx bx-bell-off' style={{ fontSize: 48, color: '#c7c1b4' }} />
          <h3 style={{ margin: '8px 0 4px', fontSize: 16, color: NAVY, fontFamily: "'Outfit', sans-serif" }}>Aucune notification</h3>
          <p style={{ fontSize: 12, color: '#5b6472' }}>
            {filtre === 'non_lues' ? 'Toutes vos notifications sont lues.' : 'Aucune notification pour le moment.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtrees.map((n, index) => {
            const cfg = getTypeConfig(n.type);
            const budgetData = parseBudgetMessage(n.message);
            const aboData = parseAbonnementMessage(n.message);
            const aboCfg = aboData ? getAboEtatConfig(aboData.etat) : null;
            const displayCfg = aboCfg || cfg;

            return (
              <div
                key={n.id}
                className="notif-card"
                onClick={() => openModal(n)}
                style={{
                  background: '#ffffff',
                  borderRadius: 14,
                  border: `1px solid ${n.est_lue ? NEUTRAL : displayCfg.border}`,
                  padding: '12px',
                  boxShadow: n.est_lue ? '0 1px 3px rgba(16,33,75,0.04)' : `0 3px 12px ${displayCfg.color}22`,
                  opacity: n.est_lue ? 0.9 : 1,
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
                    borderColor: `transparent ${displayCfg.color} transparent transparent`,
                    borderTopRightRadius: 14,
                  }} />
                )}

                <div style={{ display: 'flex', gap: 10 }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: `${displayCfg.color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    color: displayCfg.color,
                  }}>
                    <i className={`bx ${displayCfg.icon}`} style={{ fontSize: 18 }} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: 9,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.3px',
                        color: displayCfg.color,
                        background: `${displayCfg.color}12`,
                        borderRadius: 10,
                        padding: '2px 8px',
                      }}>
                        {aboCfg ? aboCfg.titre : cfg.label}
                      </span>
                      {!n.est_lue && (
                        <span style={{ fontSize: 9, color: displayCfg.color, display: 'flex', alignItems: 'center', gap: 3, fontWeight: 600 }}>
                          <i className='bx bx-circle' style={{ fontSize: 6 }} />
                          Nouveau
                        </span>
                      )}
                    </div>

                    {budgetData && budgetData.categorie ? (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
                          <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: NAVY }}>
                            {budgetData.categorie}
                          </h3>
                          {budgetData.est_depasse && (
                            <span style={{ fontSize: 9, color: DANGER, background: DANGER_BG, padding: '2px 6px', borderRadius: 8, fontWeight: 600 }}>
                              Dépassé
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                          <div style={{ flex: 1 }}>
                            <span style={{ fontSize: 8, color: '#8a92a0' }}>Prévu</span>
                            <div style={{ fontSize: 11, fontWeight: 700, color: NAVY }}>{formatMontant(budgetData.montant_prevu)} MRU</div>
                          </div>
                          <div style={{ flex: 1 }}>
                            <span style={{ fontSize: 8, color: '#8a92a0' }}>Dépensé</span>
                            <div style={{ fontSize: 11, fontWeight: 700, color: DANGER }}>{formatMontant(budgetData.montant_depense)} MRU</div>
                          </div>
                          <div style={{ flex: 1 }}>
                            <span style={{ fontSize: 8, color: '#8a92a0' }}>Utilisé</span>
                            <div style={{ fontSize: 11, fontWeight: 700, color: SUCCESS }}>
                              {budgetData.pourcentage || getPourcentage(budgetData.montant_depense, budgetData.montant_prevu)}%
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : aboData ? (
                      <div>
                        <h3 style={{ margin: 0, fontSize: 12, fontWeight: 700, color: NAVY }}>
                          {aboData.plan && aboData.type ? `${aboData.plan} ${aboData.type}` : 'Abonnement'}
                        </h3>

                        {aboData.etat === 'active' && (
                          <p style={{ margin: '2px 0 0', fontSize: 10, color: displayCfg.color, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <i className='bx bx-check-circle' style={{ fontSize: 11 }} />
                            Activé avec succès
                          </p>
                        )}

                        {aboData.etat === 'attente' && (
                          <p style={{ margin: '2px 0 0', fontSize: 10, color: displayCfg.color, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <i className='bx bx-loader-circle' style={{ fontSize: 11 }} />
                            Via {methodeLabel(aboData.methode)} — en attente de validation
                          </p>
                        )}

                        {aboData.etat === 'refuse' && (
                          <p style={{ margin: '2px 0 0', fontSize: 10, color: displayCfg.color, lineHeight: 1.4, display: 'flex', alignItems: 'flex-start', gap: 4 }}>
                            <i className='bx bx-error-circle' style={{ fontSize: 11, marginTop: 1, flexShrink: 0 }} />
                            <span>
                              {aboData.raison
                                ? (aboData.raison.length > 70 ? aboData.raison.slice(0, 70) + '...' : aboData.raison)
                                : 'Demande refusée'}
                            </span>
                          </p>
                        )}

                        {aboData.etat === 'echoue' && (
                          <p style={{ margin: '2px 0 0', fontSize: 10, color: displayCfg.color, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <i className='bx bx-x-circle' style={{ fontSize: 11 }} />
                            Paiement TrackPay non confirmé
                          </p>
                        )}

                        {aboData.etat === 'expire' && (
                          <p style={{ margin: '2px 0 0', fontSize: 10, color: displayCfg.color, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <i className='bx bx-refresh' style={{ fontSize: 11 }} />
                            Retour à l'essai gratuit
                          </p>
                        )}
                      </div>
                    ) : (
                      <p style={{ margin: 0, fontSize: 12, color: '#3a4150', lineHeight: 1.4 }}>
                        {n.message.length > 100 ? n.message.slice(0, 100) + '...' : n.message}
                      </p>
                    )}

                    <div style={{
                      marginTop: 8,
                      fontSize: 9,
                      color: '#a0a6b0',
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

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button
                      onClick={(e) => handleDeleteClick(e, n.id)}
                      className="icon-btn"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#a0a6b0',
                        cursor: 'pointer',
                        padding: '6px',
                        borderRadius: 8,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: 32,
                        minHeight: 32,
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.color = DANGER}
                      onMouseLeave={(e) => e.currentTarget.style.color = '#a0a6b0'}
                    >
                      <i className='bx bx-trash' style={{ fontSize: 16 }} />
                    </button>
                    <i className='bx bx-chevron-right' style={{ fontSize: 18, color: '#a0a6b0' }} />
                  </div>
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
        const aboCfg = aboData ? getAboEtatConfig(aboData.etat) : null;
        const displayCfg = aboCfg || cfg;

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
              background: 'rgba(16,33,75,0.55)',
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
                background: '#ffffff',
                borderRadius: 20,
                maxWidth: 500,
                width: '100%',
                maxHeight: '85vh',
                overflow: 'auto',
                padding: '20px',
                animation: 'fadeIn 0.2s ease',
                boxShadow: '0 24px 60px rgba(16,33,75,0.3)',
              }}
            >
              {/* En-tête modal */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: `${displayCfg.color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: displayCfg.color,
                  }}>
                    <i className={`bx ${displayCfg.icon}`} style={{ fontSize: 22 }} />
                  </div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: NAVY, fontFamily: "'Outfit', sans-serif" }}>
                      {aboCfg ? aboCfg.titre : cfg.label}
                    </h2>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: '#5b6472' }}>
                      {new Date(selectedNotif.date_creation).toLocaleDateString('fr-FR', {
                        day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="icon-btn"
                  style={{
                    background: NEUTRAL,
                    border: 'none',
                    borderRadius: 8,
                    width: 32,
                    height: 32,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#5b6472',
                  }}
                >
                  <i className='bx bx-x' style={{ fontSize: 18 }} />
                </button>
              </div>

              {/* Contenu modal */}
              {budgetData && budgetData.categorie ? (
                <div>
                  <div style={{
                    background: `linear-gradient(135deg, ${cfg.color}12, ${cfg.color}04)`,
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 16,
                  }}>
                    <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 800, color: NAVY, fontFamily: "'Outfit', sans-serif" }}>
                      {budgetData.categorie}
                    </h3>
                    <p style={{ margin: 0, fontSize: 12, color: cfg.color, fontWeight: 600 }}>
                      Période du {budgetData.debut} au {budgetData.fin}
                    </p>
                  </div>

                  <div className="stats-row" style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                    <div style={{ flex: 1, background: NEUTRAL, borderRadius: 12, padding: 12, textAlign: 'center' }}>
                      <i className='bx bx-target-lock' style={{ fontSize: 18, color: BRAND }} />
                      <p style={{ margin: '8px 0 4px', fontSize: 11, color: '#5b6472' }}>Montant prévu</p>
                      <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: NAVY }}>
                        {formatMontant(budgetData.montant_prevu)} MRU
                      </p>
                    </div>
                    <div style={{ flex: 1, background: NEUTRAL, borderRadius: 12, padding: 12, textAlign: 'center' }}>
                      <i className='bx bx-trending-down' style={{ fontSize: 18, color: DANGER }} />
                      <p style={{ margin: '8px 0 4px', fontSize: 11, color: '#5b6472' }}>Total dépensé</p>
                      <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: DANGER }}>
                        {formatMontant(budgetData.montant_depense)} MRU
                      </p>
                    </div>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 11, color: '#5b6472' }}>Utilisation</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color }}>
                        {budgetData.pourcentage || getPourcentage(budgetData.montant_depense, budgetData.montant_prevu)}%
                      </span>
                    </div>
                    <div style={{ height: 8, background: NEUTRAL, borderRadius: 20, overflow: 'hidden' }}>
                      <div className="progress-bar" style={{
                        width: `${getPourcentage(budgetData.montant_depense, budgetData.montant_prevu)}%`,
                        height: '100%',
                        background: budgetData.est_depasse ? DANGER : cfg.color,
                        borderRadius: 20,
                      }} />
                    </div>
                  </div>

                  {budgetData.depenses && budgetData.depenses.length > 0 && (
                    <div style={{ borderTop: `1px solid ${NEUTRAL}`, paddingTop: 12 }}>
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
                          <span style={{ fontSize: 13, fontWeight: 700, color: NAVY }}>
                            Détail des dépenses ({budgetData.depenses.length})
                          </span>
                        </div>
                        <i className={`bx ${expandedDepenses === selectedNotif.id ? 'bx-chevron-up' : 'bx-chevron-down'}`} style={{ fontSize: 18, color: '#5b6472' }} />
                      </div>
                      {expandedDepenses === selectedNotif.id && (
                        <div>
                          {budgetData.depenses.map((dep, idx) => (
                            <div key={idx} className="depense-item" style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '10px 0',
                              borderBottom: idx < budgetData.depenses.length - 1 ? `1px solid ${NEUTRAL}` : 'none',
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <i className='bx bx-money' style={{ fontSize: 14, color: DANGER }} />
                                <span style={{ fontSize: 12, color: '#3a4150' }}>
                                  {dep.date ? dep.date.split(' ')[0] : `Dépense ${idx + 1}`}
                                </span>
                              </div>
                              <span style={{ fontSize: 12, fontWeight: 700, color: NAVY }}>
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
                    background: `linear-gradient(135deg, ${displayCfg.color}12, ${displayCfg.color}04)`,
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 16,
                    textAlign: 'center',
                  }}>
                    <div style={{
                      width: 60,
                      height: 60,
                      background: displayCfg.gradient,
                      borderRadius: 20,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 12px',
                      boxShadow: `0 8px 20px ${displayCfg.color}33`,
                    }}>
                      <i className={`bx ${displayCfg.icon}`} style={{ fontSize: 28, color: '#fff' }} />
                    </div>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: NAVY, fontFamily: "'Outfit', sans-serif" }}>
                      {aboData.plan && aboData.type ? `Abonnement ${aboData.plan} ${aboData.type}` : 'Abonnement'}
                    </h3>
                    <p style={{ margin: '4px 0 0', fontSize: 12, color: displayCfg.color, fontWeight: 700 }}>
                      {aboCfg?.titre}
                    </p>
                  </div>

                  {/* ── État : ACTIVÉ ── */}
                  {aboData.etat === 'active' && (
                    <div className="abo-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                      <div style={{ background: NEUTRAL, borderRadius: 12, padding: 12 }}>
                        <i className='bx bx-calendar' style={{ fontSize: 16, color: displayCfg.color }} />
                        <p style={{ margin: '8px 0 4px', fontSize: 11, color: '#5b6472' }}>Date de début</p>
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: NAVY }}>{aboData.debut || '—'}</p>
                      </div>
                      <div style={{ background: NEUTRAL, borderRadius: 12, padding: 12 }}>
                        <i className='bx bx-calendar-check' style={{ fontSize: 16, color: displayCfg.color }} />
                        <p style={{ margin: '8px 0 4px', fontSize: 11, color: '#5b6472' }}>Date de fin</p>
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: NAVY }}>{aboData.fin || '—'}</p>
                      </div>
                      <div style={{ background: NEUTRAL, borderRadius: 12, padding: 12 }}>
                        <i className='bx bx-coin' style={{ fontSize: 16, color: displayCfg.color }} />
                        <p style={{ margin: '8px 0 4px', fontSize: 11, color: '#5b6472' }}>Montant</p>
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: NAVY }}>{aboData.montant ? `${aboData.montant} MRU` : '—'}</p>
                      </div>
                      <div style={{ background: NEUTRAL, borderRadius: 12, padding: 12 }}>
                        <i className='bx bx-time' style={{ fontSize: 16, color: displayCfg.color }} />
                        <p style={{ margin: '8px 0 4px', fontSize: 11, color: '#5b6472' }}>Durée</p>
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: NAVY }}>{aboData.duree || '—'}</p>
                      </div>
                    </div>
                  )}

                  {/* ── État : EN ATTENTE ── */}
                  {aboData.etat === 'attente' && (
                    <>
                      <div style={{
                        background: GOLD_BG, border: '1px solid #eeddb3', borderRadius: 12,
                        padding: 14, marginBottom: 14, display: 'flex', alignItems: 'flex-start', gap: 10,
                      }}>
                        <i className='bx bx-info-circle' style={{ fontSize: 18, color: '#9c7526', flexShrink: 0, marginTop: 1 }} />
                        <p style={{ margin: 0, fontSize: 12, color: '#7a5c1d', lineHeight: 1.5 }}>
                          {aboData.methode === 'trackpay'
                            ? "Votre paiement TrackPay est en attente de confirmation. L'activation se fera automatiquement dès réception."
                            : "Votre demande est en attente de validation par notre équipe. Vous serez notifié dès qu'elle sera traitée."}
                        </p>
                      </div>
                      <div className="abo-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                        <div style={{ background: NEUTRAL, borderRadius: 12, padding: 12 }}>
                          <i className='bx bx-credit-card' style={{ fontSize: 16, color: displayCfg.color }} />
                          <p style={{ margin: '8px 0 4px', fontSize: 11, color: '#5b6472' }}>Méthode</p>
                          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: NAVY }}>{methodeLabel(aboData.methode)}</p>
                        </div>
                        <div style={{ background: NEUTRAL, borderRadius: 12, padding: 12 }}>
                          <i className='bx bx-coin' style={{ fontSize: 16, color: displayCfg.color }} />
                          <p style={{ margin: '8px 0 4px', fontSize: 11, color: '#5b6472' }}>Montant</p>
                          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: NAVY }}>{aboData.montant ? `${aboData.montant} MRU` : '—'}</p>
                        </div>
                        <div style={{ background: NEUTRAL, borderRadius: 12, padding: 12, gridColumn: '1 / -1' }}>
                          <i className='bx bx-calendar' style={{ fontSize: 16, color: displayCfg.color }} />
                          <p style={{ margin: '8px 0 4px', fontSize: 11, color: '#5b6472' }}>Envoyée le</p>
                          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: NAVY }}>{aboData.date || '—'}</p>
                        </div>
                      </div>
                    </>
                  )}

                  {/* ── État : REFUSÉ ── */}
                  {aboData.etat === 'refuse' && (
                    <>
                      <div style={{
                        background: DANGER_BG, border: '1px solid #f2c3c4', borderRadius: 12,
                        padding: 14, marginBottom: 14,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <i className='bx bx-message-square-error' style={{ fontSize: 16, color: '#b83f42' }} />
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#8f2f32' }}>Motif du refus</span>
                        </div>
                        <p style={{ margin: 0, fontSize: 13, color: '#8f2f32', lineHeight: 1.6 }}>
                          {aboData.raison || "Aucune raison n'a été fournie."}
                        </p>
                      </div>
                      <div className="abo-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                        <div style={{ background: NEUTRAL, borderRadius: 12, padding: 12 }}>
                          <i className='bx bx-credit-card' style={{ fontSize: 16, color: displayCfg.color }} />
                          <p style={{ margin: '8px 0 4px', fontSize: 11, color: '#5b6472' }}>Méthode</p>
                          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: NAVY }}>{methodeLabel(aboData.methode)}</p>
                        </div>
                        <div style={{ background: NEUTRAL, borderRadius: 12, padding: 12 }}>
                          <i className='bx bx-calendar' style={{ fontSize: 16, color: displayCfg.color }} />
                          <p style={{ margin: '8px 0 4px', fontSize: 11, color: '#5b6472' }}>Refusée le</p>
                          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: NAVY }}>{aboData.date || '—'}</p>
                        </div>
                      </div>
                      <div style={{
                        marginTop: 12, padding: 12, background: BRAND_LIGHT, border: '1px solid #9fdede',
                        borderRadius: 12, display: 'flex', alignItems: 'center', gap: 8,
                      }}>
                        <i className='bx bx-refresh' style={{ fontSize: 16, color: BRAND }} />
                        <p style={{ margin: 0, fontSize: 11, color: '#1f3a3d' }}>
                          Vous pouvez soumettre une nouvelle demande depuis votre profil, onglet Abonnement.
                        </p>
                      </div>
                    </>
                  )}

                  {/* ── État : ÉCHEC TRACKPAY ── */}
                  {aboData.etat === 'echoue' && (
                    <>
                      <div style={{
                        background: DANGER_BG, border: '1px solid #f2c3c4', borderRadius: 12,
                        padding: 14, marginBottom: 14, display: 'flex', alignItems: 'flex-start', gap: 10,
                      }}>
                        <i className='bx bx-error-circle' style={{ fontSize: 18, color: '#b83f42', flexShrink: 0, marginTop: 1 }} />
                        <p style={{ margin: 0, fontSize: 12, color: '#8f2f32', lineHeight: 1.5 }}>
                          Le paiement via TrackPay n'a pas pu être confirmé. Aucun montant n'a été activé sur votre compte.
                        </p>
                      </div>
                      <div style={{
                        padding: 12, background: BRAND_LIGHT, border: '1px solid #9fdede',
                        borderRadius: 12, display: 'flex', alignItems: 'center', gap: 8,
                      }}>
                        <i className='bx bx-refresh' style={{ fontSize: 16, color: BRAND }} />
                        <p style={{ margin: 0, fontSize: 11, color: '#1f3a3d' }}>
                          Vous pouvez retenter le paiement depuis votre profil, onglet Abonnement.
                        </p>
                      </div>
                    </>
                  )}

                  {/* ── État : EXPIRÉ ── */}
                  {aboData.etat === 'expire' && (
                    <div style={{
                      background: NEUTRAL, border: '1px solid #d8d2c7', borderRadius: 12,
                      padding: 14, display: 'flex', alignItems: 'flex-start', gap: 10,
                    }}>
                      <i className='bx bx-info-circle' style={{ fontSize: 18, color: '#7a7267', flexShrink: 0, marginTop: 1 }} />
                      <p style={{ margin: 0, fontSize: 12, color: '#4d473e', lineHeight: 1.5 }}>
                        Votre abonnement <strong>{aboData.plan}</strong> est arrivé à expiration le {aboData.date}.
                        Vous êtes repassé à l'essai gratuit. Renouvelez depuis votre profil pour retrouver l'accès complet.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <p style={{ fontSize: 14, color: '#3a4150', lineHeight: 1.6, whiteSpace: 'pre-wrap', margin: 0 }}>
                    {selectedNotif.message}
                  </p>
                </div>
              )}

              <div className="action-buttons" style={{ display: 'flex', gap: 8, marginTop: 20 }}>
                <button
                  onClick={() => {
                    showConfirmDialog(
                      'Voulez-vous vraiment supprimer cette notification ?',
                      () => {
                        supprimerUne(selectedNotif.id);
                        closeModal();
                      }
                    );
                  }}
                  className="action-btn"
                  style={{
                    flex: 1,
                    background: DANGER,
                    color: '#fff',
                    border: 'none',
                    borderRadius: 12,
                    padding: '12px',
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    minHeight: 44,
                  }}
                >
                  <i className='bx bx-trash' style={{ fontSize: 16 }} />
                  Supprimer
                </button>
                <button
                  onClick={closeModal}
                  className="action-btn"
                  style={{
                    flex: 1,
                    background: displayCfg.gradient,
                    color: '#fff',
                    border: 'none',
                    borderRadius: 12,
                    padding: '12px',
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: 700,
                    minHeight: 44,
                  }}
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Footer ── */}
      {filtrees.length > 0 && (
        <div style={{
          marginTop: 16,
          paddingTop: 12,
          borderTop: `1px solid ${NEUTRAL}`,
          textAlign: 'center',
        }}>
          <p style={{ fontSize: 10, color: '#a0a6b0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <i className='bx bx-show' style={{ fontSize: 10 }} />
            {filtrees.length} notification{filtrees.length > 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );
}