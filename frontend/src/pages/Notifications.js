import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const TYPE_CONFIG = {
  alerte_budget: {
    icone: '⚠️',
    couleur: '#f59e0b',
    bg: '#fef3c7',
    border: '#fde68a',
    label: 'Alerte budget',
  },
  depassement_budget: {
    icone: '🚨',
    couleur: '#ef4444',
    bg: '#fef2f2',
    border: '#fecaca',
    label: 'Dépassement budget',
  },
  budget_termine: {
    icone: '🏁',
    couleur: '#6366f1',
    bg: '#eef2ff',
    border: '#c7d2fe',
    label: 'Budget terminé',
  },
  expiration_abonnement: {
    icone: '⏰',
    couleur: '#3b82f6',
    bg: '#eff6ff',
    border: '#bfdbfe',
    label: 'Abonnement',
  },
  info: {
    icone: 'ℹ️',
    couleur: '#10b981',
    bg: '#ecfdf5',
    border: '#a7f3d0',
    label: 'Info',
  },
  contact: {
    icone: '📬',
    couleur: '#8b5cf6',
    bg: '#f5f3ff',
    border: '#ddd6fe',
    label: 'Contact',
  },
};

const DEFAULT_CONFIG = {
  icone: 'ℹ️',
  couleur: '#64748b',
  bg: '#f8fafc',
  border: '#e2e8f0',
  label: 'Notification',
};

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtre, setFiltre] = useState('toutes'); // 'toutes' | 'non_lues' | type spécifique
  const [expanded, setExpanded] = useState(null); // id de la notif développée

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
  };

  const marquerToutes = async () => {
    await api.patch('/notifications/toutes-lues/');
    setNotifications(prev => prev.map(n => ({ ...n, est_lue: true })));
    toast.success('Toutes marquées comme lues');
  };

  const toggleExpand = async (n) => {
    setExpanded(expanded === n.id ? null : n.id);
    if (!n.est_lue) await marquerLue(n.id);
  };

  // Filtrage
  const filtrees = notifications.filter(n => {
    if (filtre === 'non_lues') return !n.est_lue;
    if (filtre !== 'toutes') return n.type === filtre;
    return true;
  });

  const nonLues = notifications.filter(n => !n.est_lue).length;
  const types = [...new Set(notifications.map(n => n.type))];

  return (
    <div>
      <style>{`
        .notif-card { transition: transform 0.15s, box-shadow 0.15s; }
        .notif-card:hover { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(0,0,0,0.1) !important; }
        .filtre-btn:hover { opacity: 0.85; }
        @keyframes slideIn { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h2 style={{ margin: 0, color: '#1e293b', fontWeight: 800, fontSize: 24 }}>🔔 Notifications</h2>
          {nonLues > 0 && (
            <span style={{
              background: 'linear-gradient(135deg,#ef4444,#dc2626)',
              color: '#fff', borderRadius: 20, padding: '3px 12px',
              fontSize: 13, fontWeight: 700,
              boxShadow: '0 2px 8px rgba(239,68,68,0.3)',
            }}>
              {nonLues} non lue{nonLues > 1 ? 's' : ''}
            </span>
          )}
        </div>
        {nonLues > 0 && (
          <button onClick={marquerToutes} style={{
            background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff',
            border: 'none', borderRadius: 10, padding: '9px 18px', cursor: 'pointer',
            fontSize: 13, fontWeight: 600,
            boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
            transition: 'transform 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.transform='translateY(-1px)'}
          onMouseLeave={e => e.currentTarget.style.transform=''}
          >
            ✓ Tout marquer comme lu
          </button>
        )}
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { id: 'toutes', label: `Toutes (${notifications.length})` },
          { id: 'non_lues', label: `Non lues (${nonLues})` },
          ...types.map(t => ({
            id: t,
            label: `${(TYPE_CONFIG[t] || DEFAULT_CONFIG).icone} ${(TYPE_CONFIG[t] || DEFAULT_CONFIG).label}`,
          })),
        ].map(f => (
          <button key={f.id} className="filtre-btn" onClick={() => setFiltre(f.id)} style={{
            padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
            background: filtre === f.id ? '#1e293b' : '#f1f5f9',
            color: filtre === f.id ? '#fff' : '#64748b',
            boxShadow: filtre === f.id ? '0 2px 8px rgba(30,41,59,0.2)' : 'none',
          }}>{f.label}</button>
        ))}
      </div>

      {/* Liste */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>⏳</div>
          <p>Chargement...</p>
        </div>
      ) : filtrees.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#94a3b8' }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>🔔</div>
          <p style={{ fontSize: 16, fontWeight: 500 }}>Aucune notification</p>
          <p style={{ fontSize: 13 }}>
            {filtre === 'non_lues' ? 'Toutes vos notifications sont lues.' : 'Rien ici pour l\'instant.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtrees.map(n => {
            const cfg = TYPE_CONFIG[n.type] || DEFAULT_CONFIG;
            const isOpen = expanded === n.id;
            const isLong = n.message.length > 120;
            const messageAffiche = isLong && !isOpen
              ? n.message.slice(0, 120) + '...'
              : n.message;

            return (
              <div key={n.id} className="notif-card" style={{
                background: n.est_lue ? '#fff' : cfg.bg,
                borderRadius: 14,
                border: `1px solid ${n.est_lue ? '#e2e8f0' : cfg.border}`,
                padding: '16px 20px',
                boxShadow: n.est_lue ? '0 1px 4px rgba(0,0,0,0.04)' : `0 2px 10px ${cfg.couleur}15`,
                opacity: n.est_lue ? 0.8 : 1,
                cursor: isLong ? 'pointer' : 'default',
                animation: 'slideIn 0.2s ease',
              }}
              onClick={() => isLong && toggleExpand(n)}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  {/* Icône */}
                  <div style={{
                    width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                    background: cfg.couleur + '18',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 20,
                  }}>
                    {cfg.icone}
                  </div>

                  {/* Contenu */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{
                        fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px',
                        color: cfg.couleur,
                        background: cfg.couleur + '18',
                        borderRadius: 6, padding: '2px 8px',
                      }}>{cfg.label}</span>
                      {!n.est_lue && (
                        <span style={{
                          width: 8, height: 8, borderRadius: '50%',
                          background: cfg.couleur, flexShrink: 0,
                        }}/>
                      )}
                    </div>

                    {/* Message — multiligne si budget terminé */}
                    <pre style={{
                      margin: 0, fontSize: 13.5, color: '#1e293b', lineHeight: 1.6,
                      fontFamily: 'inherit', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                    }}>
                      {messageAffiche}
                    </pre>

                    {isLong && (
                      <button onClick={(e) => { e.stopPropagation(); toggleExpand(n); }} style={{
                        background: 'none', border: 'none', color: cfg.couleur,
                        cursor: 'pointer', fontSize: 12, fontWeight: 600, padding: '4px 0', marginTop: 4,
                      }}>
                        {isOpen ? '▲ Voir moins' : '▼ Voir plus'}
                      </button>
                    )}

                    <p style={{ margin: '8px 0 0', fontSize: 11, color: '#94a3b8' }}>
                      {new Date(n.date_creation).toLocaleDateString('fr-FR', {
                        day: '2-digit', month: 'long', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  </div>

                  {/* Bouton marquer lu */}
                  {!n.est_lue && (
                    <button
                      onClick={(e) => { e.stopPropagation(); marquerLue(n.id); }}
                      style={{
                        flexShrink: 0, background: '#fff', border: `1px solid ${cfg.couleur}40`,
                        borderRadius: 8, padding: '5px 12px', cursor: 'pointer',
                        fontSize: 11, color: cfg.couleur, fontWeight: 600,
                        transition: 'background 0.15s, border-color 0.15s',
                        whiteSpace: 'nowrap',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background=cfg.bg; e.currentTarget.style.borderColor=cfg.couleur; }}
                      onMouseLeave={e => { e.currentTarget.style.background='#fff'; e.currentTarget.style.borderColor=cfg.couleur+'40'; }}
                    >
                      ✓ Lu
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      {filtrees.length > 0 && (
        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: '#cbd5e1' }}>
          {filtrees.length} notification{filtrees.length > 1 ? 's' : ''} affichée{filtrees.length > 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}