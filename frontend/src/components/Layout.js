// frontend/src/components/Layout.js
import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import VisitorBanner from './VisitorBanner';

// ── Helper : construit l'URL correcte de la photo (évite le double préfixe) ──
const getPhotoUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `http://localhost:8000${path}`;
};

export default function Layout() {
  const { 
    user, 
    abonnement, 
    estAbonne, 
    estEnEssai, 
    estExpire, 
    estEntreprise, 
    notifNonLues, 
    deconnexion,
    isVisitor,        // 🆕 État du mode visiteur
    exitVisitorMode,  // 🆕 Fonction pour quitter le mode visiteur
  } = useAuth();
  
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [infoEssai, setInfoEssai] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // États pour la boîte de dialogue de confirmation
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState('');

  // États pour les messages (bannières)
  const [message, setMessage] = useState({ text: '', type: '', visible: false });

  const abonneActif = estAbonne();
  const enEssai = estEnEssai();
  const expire = estExpire();
  const entreprise = estEntreprise();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Charger les infos de limite quotidienne si en essai
  useEffect(() => {
    if (enEssai) {
      api.get('/transactions/dashboard/')
        .then(res => { if (res.data.info_essai) setInfoEssai(res.data.info_essai); })
        .catch(() => {});
    }
  }, [enEssai]);

  // Fonction pour afficher un message
  const showMessage = (text, type = 'success') => {
    setMessage({ text, type, visible: true });
    setTimeout(() => {
      setMessage({ text: '', type: '', visible: false });
    }, 5000);
  };

  // Gestion déconnexion avec boîte de dialogue inline
  const handleDeconnexion = () => {
    // 🆕 Si en mode visiteur, quitter simplement le mode
    if (isVisitor) {
      exitVisitorMode();
      showMessage('Mode exploration quitté', 'success');
      return;
    }
    
    setConfirmMessage('Voulez-vous vous déconnecter ?');
    setConfirmAction(() => async () => {
      try {
        await deconnexion();
        setShowConfirmDialog(false);
        showMessage('Déconnexion réussie', 'success');
        navigate('/');
      } catch (error) {
        setShowConfirmDialog(false);
        showMessage('Erreur lors de la déconnexion', 'error');
      }
    });
    setShowConfirmDialog(true);
  };

  // Fonction pour annuler la confirmation
  const cancelConfirmation = () => {
    setShowConfirmDialog(false);
    setConfirmAction(null);
    setConfirmMessage('');
  };

  const initiales = user
    ? `${(user.prenom || '')[0] || ''}${(user.nom || '')[0] || ''}`.toUpperCase()
    : '?';

  // ✅ Toutes les pages sont visibles en mode visiteur
  // ✅ La page Employés est visible pour tout le monde, mais les actions sont bloquées
  const navItems = [
    {
      path: '/dashboard', label: 'Dashboard',
      icon: <i className='bx bx-stats'></i>,
    },
    {
      path: '/transactions', label: 'Transactions',
      icon: <i className='bx bx-transfer-alt'></i>,
    },
    {
      path: '/toutes-transactions', label: 'Historique',
      icon: <i className='bx bx-history'></i>,
    },
    {
      path: '/budgets', label: 'Budgets',
      icon: <i className='bx bx-pie-chart-alt'></i>,
    },
    {
      path: '/categories', label: 'Catégories',
      icon: <i className='bx bx-category-alt'></i>,
    },
    {
      path: '/notifications', label: 'Notifications', badge: true,
      icon: <i className='bx bx-bell'></i>,
    },
    // ✅ La page Employés est TOUJOURS visible pour tout le monde
    // Mais l'accès aux actions est bloqué dans la page elle-même
    {
      path: '/employes', label: 'Employés',
      icon: <i className='bx bx-group'></i>,
    },
    {
      path: '/profil', label: 'Profil',
      icon: <i className='bx bx-user-circle'></i>,
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', fontFamily: "'Inter', 'Sora', 'Segoe UI', sans-serif" }}>

      {/* Boxicons */}
      <link rel="stylesheet" href="https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(59,130,246,0.4); }
          70% { box-shadow: 0 0 0 6px rgba(59,130,246,0); }
          100% { box-shadow: 0 0 0 0 rgba(59,130,246,0); }
        }
        .nav-item {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .nav-item:hover:not(.nav-item-active) {
          transform: translateY(-1px);
          background: #ebe7e1 !important;
          color: #10214b !important;
        }
        .nav-item-active {
          background: #356267 !important;
          color: #ffffff !important;
          box-shadow: 0 4px 12px rgba(53,98,103,0.35);
        }
        .nav-item-active:hover {
          background: #2a4f53 !important;
          transform: translateY(-1px);
        }
        .logo-icon {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          animation: pulse 2s infinite;
        }
        .logo-icon:hover {
          transform: scale(1.08) rotate(3deg);
          animation: none;
        }
        .mobile-nav-item:hover:not(.mobile-nav-item-active) {
          background: #ebe7e1 !important;
        }
        .mobile-nav-item-active {
          background: #356267 !important;
          color: #ffffff !important;
        }
        @media (max-width: 900px) {
          .desktop-nav { display: none !important; }
          .hamburger-btn { display: flex !important; }
        }
        @media (max-width: 600px) {
          main { padding: 16px !important; }
        }
      `}</style>

      {/* ═══ MESSAGE BANNIERE ═══════════════════════════════════════════════════════ */}
      {message.visible && (
        <div style={{
          position: 'fixed',
          top: 76,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          animation: 'slideUp 0.3s ease',
          width: '90%',
          maxWidth: '500px',
        }}>
          <div style={{
            padding: '10px 16px',
            borderRadius: 10,
            background: message.type === 'success' ? '#e9f8e7' : '#fdecec',
            border: `1px solid ${message.type === 'success' ? '#4ea674' : '#d55053'}`,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            boxShadow: '0 4px 16px rgba(16,33,75,0.12)',
          }}>
            <i className={`bx ${message.type === 'success' ? 'bx-check-circle' : 'bx-error-circle'}`} 
               style={{ fontSize: 18, color: message.type === 'success' ? '#459071' : '#d55053' }} />
            <span style={{ 
              fontSize: 12.5, 
              color: message.type === 'success' ? '#245c40' : '#8a2325',
              fontWeight: 600,
              flex: 1,
            }}>
              {message.text}
            </span>
            <button
              onClick={() => setMessage({ text: '', type: '', visible: false })}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: '#356267',
                fontSize: 16,
                padding: '0 4px',
              }}
            >
              <i className='bx bx-x'></i>
            </button>
          </div>
        </div>
      )}

      {/* ═══ BOÎTE DE DIALOGUE DE CONFIRMATION INLINE (TAILLE RÉDUITE) ═══════════════════════════════════════════════════════ */}
      {showConfirmDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(16,33,75,0.35)',
          backdropFilter: 'blur(3px)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'fadeIn 0.2s ease',
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 12,
            padding: '20px 24px',
            maxWidth: 340,
            width: '90%',
            boxShadow: '0 12px 40px rgba(16,33,75,0.22)',
            animation: 'slideUp 0.25s ease',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: '#fdecec',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <i className='bx bx-question-mark' style={{ fontSize: 18, color: '#d55053' }}></i>
              </div>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#10214b' }}>
                Confirmation
              </h3>
            </div>
            <p style={{ fontSize: 13, color: '#356267', marginBottom: 18, lineHeight: 1.5, fontWeight: 500 }}>
              {confirmMessage}
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={cancelConfirmation}
                style={{
                  padding: '6px 16px',
                  borderRadius: 6,
                  border: '1px solid #356267',
                  background: '#fff',
                  color: '#356267',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = '#ebe7e1';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = '#fff';
                }}
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  if (confirmAction) confirmAction();
                }}
                style={{
                  padding: '6px 16px',
                  borderRadius: 6,
                  border: 'none',
                  background: '#d55053',
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 3px 10px rgba(213,80,83,0.35)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🆕 BANNIÈRE MODE VISITEUR */}
      <VisitorBanner />

      {/* ═══ HEADER ═══════════════════════════════════════════════════════ */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        height: 64, background: 'rgba(255,255,255,0.98)',
        backdropFilter: 'blur(12px)', borderBottom: '1px solid #eef2ff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: isMobile ? '0 16px' : '0 24px',
      }}>
        {/* Logo - Moderne et fantastique (inchangé) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button 
            className="hamburger-btn" 
            onClick={() => setMobileOpen(v => !v)} 
            style={{ 
              display: 'none', 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer', 
              color: '#0c2e7c',
              padding: 8,
              borderRadius: 8,
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#f0f4ff'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <i className='bx bx-menu' style={{ fontSize: 24 }}></i>
          </button>
          
          {/* Nouveau logo moderne avec effet de brillance */}
          <div className="logo-icon" style={{ 
            width: 38, 
            height: 38, 
            borderRadius: 12, 
            background: 'linear-gradient(135deg, #0c2e7c, #1e4db7, #3b82f6)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            boxShadow: '0 4px 15px rgba(59,130,246,0.4)',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Effet de brillance */}
            <div style={{
              position: 'absolute',
              top: -15,
              left: -15,
              width: 30,
              height: 30,
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '50%',
              transform: 'rotate(45deg)',
            }} />
            <div style={{
              position: 'absolute',
              bottom: -10,
              right: -10,
              width: 25,
              height: 25,
              background: 'rgba(255,255,255,0.15)',
              borderRadius: '50%',
            }} />
            
            {/* Logo SVG - Graphique financier moderne */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 13L8 8L13 13L21 5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M21 12V19H3V5H12" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="18" cy="8" r="2" stroke="#fff" strokeWidth="1.5"/>
              <path d="M8 11L8 16" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2"/>
            </svg>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
            <span style={{ fontWeight: 800, fontSize: 18, color: '#0c2e7c', letterSpacing: '-0.3px' }}>
              Finance<span style={{ color: '#3b82f6' }}>App</span>
            </span>
            <span style={{ fontSize: 8, color: '#356267', letterSpacing: '0.3px', fontWeight: 600 }}>
              Smart Finance
            </span>
          </div>
        </div>

        {/* Navigation Desktop - ✅ Toutes les pages sont accessibles */}
        {/* Texte de navigation en couleurs franches (marine / teal), fini le gris terne */}
        <nav className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {navItems.map(item => (
            <NavLink 
              key={item.path} 
              to={item.path}
              className={({ isActive }) => `nav-item${isActive ? ' nav-item-active' : ''}`}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '9px 16px', borderRadius: 10,
                color: isActive ? '#ffffff' : '#10214b',
                background: isActive ? '#356267' : 'transparent',
                textDecoration: 'none', fontSize: 13.5, fontWeight: isActive ? 700 : 600,
                position: 'relative',
                transition: 'all 0.2s',
              })}
            >
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              <span>{item.label}</span>
              {item.badge && notifNonLues > 0 && (
                <span style={{ 
                  position: 'absolute', top: 4, right: 6, 
                  background: '#d55053', color: '#fff', 
                  borderRadius: 20, fontSize: 9, fontWeight: 700, 
                  padding: '1px 5px', minWidth: 16, textAlign: 'center',
                  border: '1.5px solid #fff',
                }}>
                  {notifNonLues > 99 ? '99+' : notifNonLues}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Section droite */}
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 12 }}>

          {/* Badge essai - version réduite pour mobile */}
          {enEssai && !expire && !isVisitor && (
            <div 
              onClick={() => navigate('/profil')}
              style={{
                display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 8,
                background: 'linear-gradient(135deg, rgba(53,98,103,0.08), rgba(78,166,116,0.10))',
                borderRadius: isMobile ? 10 : 12, 
                padding: isMobile ? '4px 10px' : '6px 14px',
                border: '1px solid rgba(53,98,103,0.22)', cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(53,98,103,0.18)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
              title={infoEssai ? `Transactions aujourd'hui : ${infoEssai.transactions_aujourd_hui}/5 — Budgets : ${infoEssai.budgets_aujourd_hui}/2` : ''}
            >
              <div style={{
                width: isMobile ? 18 : 22, height: isMobile ? 18 : 22, borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg, #356267, #4ea674)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <i className='bx bx-hourglass' style={{ fontSize: isMobile ? 10 : 12, color: '#fff' }}></i>
              </div>
              <span style={{ fontSize: isMobile ? 9 : 11, color: '#2a4f53', fontWeight: 800 }}>
                Essai {abonnement?.jours_restants}j
              </span>
              {infoEssai && !isMobile && (
                <span style={{ fontSize: 9, color: '#356267', fontWeight: 600, opacity: 0.8 }}>
                  • {infoEssai.transactions_restantes_jour} rest.
                </span>
              )}
            </div>
          )}

          {/* Badge expiré - version réduite pour mobile */}
          {expire && !isVisitor && (
            <button 
              onClick={() => navigate('/profil')} 
              style={{
                background: '#d55053', color: '#fff', border: 'none', 
                borderRadius: isMobile ? 8 : 10, 
                padding: isMobile ? '4px 10px' : '6px 14px', 
                cursor: 'pointer', 
                fontSize: isMobile ? 10 : 11, 
                fontWeight: 700, 
                display: 'flex', alignItems: 'center', gap: isMobile ? 4 : 6,
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(213,80,83,0.35)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <i className='bx bx-lock-alt' style={{ fontSize: isMobile ? 11 : 12 }}></i>
              <span>Expiré</span>
            </button>
          )}

          {/* Avatar */}
          <NavLink to="/profil" style={{ textDecoration: 'none' }}>
            <div style={{ 
              width: isMobile ? 34 : 38, 
              height: isMobile ? 34 : 38, 
              borderRadius: '50%', 
              background: isVisitor 
                ? 'linear-gradient(135deg, #f59e0b, #d97706)' 
                : 'linear-gradient(135deg, #0c2e7c, #1e4db7)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              color: '#fff', fontWeight: 700, fontSize: isMobile ? 12 : 13, 
              border: isVisitor ? '2px solid #f59e0b' : '2px solid white', 
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              cursor: 'pointer', overflow: 'hidden',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={e => { 
              e.currentTarget.style.transform = 'scale(1.08)'; 
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'; 
            }}
            onMouseLeave={e => { 
              e.currentTarget.style.transform = 'scale(1)'; 
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'; 
            }}>
              {isVisitor ? (
                <span style={{ fontSize: isMobile ? 14 : 16 }}>🔍</span>
              ) : user?.photo_profil ? (
                <img src={getPhotoUrl(user.photo_profil)} alt="profil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : user?.google_photo ? (
                <img src={user.google_photo} alt="profil Google" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: isMobile ? 12 : 14 }}>{initiales}</span>
              )}
            </div>
          </NavLink>
        </div>
      </header>

      {/* ═══ MENU MOBILE ══════════════════════════════════════════════════ */}
      {mobileOpen && (
        <div style={{ 
          position: 'fixed', top: 64, left: 0, right: 0, zIndex: 999, 
          background: '#fff', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', 
          padding: '12px 0', borderTop: '1px solid #eef2ff',
          animation: 'slideDown 0.25s ease',
        }}>
          {navItems.map(item => (
            <NavLink 
              key={item.path} 
              to={item.path} 
              className={({ isActive }) => `mobile-nav-item${isActive ? ' mobile-nav-item-active' : ''}`}
              onClick={() => setMobileOpen(false)}
              style={({ isActive }) => ({ 
                display: 'flex', alignItems: 'center', gap: 14, 
                padding: '12px 24px', 
                color: isActive ? '#ffffff' : '#10214b', 
                background: isActive ? '#356267' : 'transparent', 
                fontWeight: isActive ? 700 : 600, 
                fontSize: 14, textDecoration: 'none',
                transition: 'background 0.2s',
              })}
            >
              <span style={{ fontSize: 20 }}>{item.icon}</span>
              <span>{item.label}</span>
              {item.badge && notifNonLues > 0 && (
                <span style={{ 
                  marginLeft: 'auto', 
                  background: '#d55053', color: '#fff', 
                  borderRadius: 20, fontSize: 10, fontWeight: 700, 
                  padding: '2px 8px', minWidth: 20, textAlign: 'center'
                }}>
                  {notifNonLues > 99 ? '99+' : notifNonLues}
                </span>
              )}
            </NavLink>
          ))}
          
          {/* Déconnexion dans menu mobile - adapté pour le mode visiteur */}
          <div 
            onClick={handleDeconnexion}
            style={{ 
              display: 'flex', alignItems: 'center', gap: 14, padding: '12px 24px',
              color: isVisitor ? '#d97706' : '#d55053', 
              fontSize: 14, fontWeight: 700, cursor: 'pointer',
              borderTop: '1px solid #f1f5f9', marginTop: 8,
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = isVisitor ? '#fffbeb' : '#fdecec'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <i className={isVisitor ? 'bx bx-exit' : 'bx bx-log-out'} style={{ fontSize: 20 }}></i>
            {isVisitor ? 'Quitter le mode exploration' : 'Déconnexion'}
          </div>
        </div>
      )}

      {/* ═══ MAIN ═════════════════════════════════════════════════════════ */}
      <main style={{ 
        marginTop: 64, 
        flex: 1, 
        background: '#f8fafc', 
        padding: isMobile ? '20px 16px' : '28px 32px', 
        minHeight: 'calc(100vh - 64px)' 
      }}>

        {/* Bannière essai - Masquée en mode visiteur */}
        {enEssai && !expire && !isVisitor && (
          <div style={{
            background: 'linear-gradient(135deg, #f3faf8, #eaf6f4)',
            border: '1px solid rgba(53,98,103,0.2)', borderRadius: 14,
            padding: isMobile ? '12px 16px' : '14px 20px', marginBottom: 24,
            display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
            boxShadow: '0 1px 8px rgba(53,98,103,0.06)',
          }}>
            <div style={{
              width: isMobile ? 34 : 40, height: isMobile ? 34 : 40, borderRadius: 12, flexShrink: 0,
              background: 'linear-gradient(135deg, #356267, #4ea674)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 3px 10px rgba(53,98,103,0.3)',
            }}>
              <i className='bx bx-hourglass' style={{ fontSize: isMobile ? 16 : 20, color: '#fff' }}></i>
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#10214b' }}>
                Essai Gratuit (J-{abonnement?.jours_restants}) — Limite : 5 transactions / 2 budgets par jour
              </div>
              {infoEssai && (
                <div style={{ fontSize: 11, color: '#356267', marginTop: 4, fontWeight: 600 }}>
                  Aujourd'hui : {infoEssai.transactions_aujourd_hui}/5 trans. • {infoEssai.budgets_aujourd_hui}/2 budgets
                </div>
              )}
            </div>
            <button 
              onClick={() => navigate('/profil')} 
              style={{ 
                background: 'linear-gradient(135deg, #356267, #2a4f53)', color: '#fff', border: 'none', 
                borderRadius: 10, padding: '9px 20px', cursor: 'pointer', 
                fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 2px 8px rgba(53,98,103,0.3)',
              }}
              onMouseEnter={e => { 
                e.currentTarget.style.transform = 'translateY(-1px)'; 
                e.currentTarget.style.boxShadow = '0 5px 14px rgba(53,98,103,0.4)'; 
              }}
              onMouseLeave={e => { 
                e.currentTarget.style.transform = 'translateY(0)'; 
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(53,98,103,0.3)'; 
              }}
            >
              <i className='bx bx-crown' style={{ fontSize: 13 }}></i>
              S'abonner
            </button>
          </div>
        )}

        {/* Bannière expiration - Masquée en mode visiteur */}
        {expire && !isVisitor && (
          <div style={{ 
            background: '#fdecec', 
            border: '1px solid #d55053', borderRadius: 14, 
            padding: isMobile ? '12px 16px' : '14px 20px', marginBottom: 24, 
            display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap'
          }}>
            <i className='bx bx-lock-alt' style={{ fontSize: 20, color: '#d55053' }}></i>
            <div style={{ flex: 1 }}>
              <strong style={{ color: '#8a2325', fontSize: 13 }}>Accès terminé</strong>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#356267', fontWeight: 500 }}>
                Mode visualisation uniquement. Abonnez-vous pour continuer.
              </p>
            </div>
            <button 
              onClick={() => navigate('/profil')} 
              style={{ 
                background: '#d55053', color: '#fff', border: 'none', 
                borderRadius: 10, padding: '8px 18px', cursor: 'pointer', 
                fontSize: 12, fontWeight: 700,
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
              onMouseEnter={e => { 
                e.currentTarget.style.transform = 'translateY(-1px)'; 
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(213,80,83,0.35)'; 
              }}
              onMouseLeave={e => { 
                e.currentTarget.style.transform = 'translateY(0)'; 
                e.currentTarget.style.boxShadow = 'none'; 
              }}
            >
              <i className='bx bx-crown' style={{ fontSize: 13 }}></i>
              S'abonner
            </button>
          </div>
        )}

        {/* Alerte expiration proche - Masquée en mode visiteur */}
        {abonneActif && !enEssai && abonnement?.jours_restants <= 7 && !isVisitor && (
          <div style={{ 
            background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 12, 
            padding: isMobile ? '10px 16px' : '10px 18px', marginBottom: 24, 
            display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap'
          }}>
            <i className='bx bx-time' style={{ fontSize: 18, color: '#d97706' }}></i>
            <span style={{ fontSize: 12, color: '#92400e', flex: 1, fontWeight: 600 }}>
              Votre abonnement expire dans <strong>{abonnement.jours_restants} jour(s)</strong>
            </span>
            <button 
              onClick={() => navigate('/profil')} 
              style={{ 
                background: '#f59e0b', color: '#fff', border: 'none', 
                borderRadius: 8, padding: '6px 14px', cursor: 'pointer', 
                fontSize: 11, fontWeight: 700,
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { 
                e.currentTarget.style.transform = 'translateY(-1px)'; 
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(245,158,11,0.3)'; 
              }}
              onMouseLeave={e => { 
                e.currentTarget.style.transform = 'translateY(0)'; 
                e.currentTarget.style.boxShadow = 'none'; 
              }}
            >
              Renouveler
            </button>
          </div>
        )}

        <Outlet />
      </main>
    </div>
  );
}