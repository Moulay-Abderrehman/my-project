import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

// ── Helper : construit l'URL correcte de la photo (évite le double préfixe) ──
const getPhotoUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `http://localhost:8000${path}`;
};

export default function Layout() {
  const { user, abonnement, estAbonne, estEnEssai, estExpire, estEntreprise, notifNonLues, deconnexion } = useAuth();
  const navigate     = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [infoEssai,  setInfoEssai]  = useState(null);
  const [logoutHover, setLogoutHover] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const abonneActif  = estAbonne();
  const enEssai      = estEnEssai();
  const expire       = estExpire();
  const entreprise   = estEntreprise();

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

  // Gestion déconnexion
  const handleDeconnexion = async () => {
    if (window.confirm('Voulez-vous vous déconnecter ?')) {
      await deconnexion();
      navigate('/');
    }
  };

  const initiales = user
    ? `${(user.prenom || '')[0] || ''}${(user.nom || '')[0] || ''}`.toUpperCase()
    : '?';

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
    ...(entreprise ? [{
      path: '/employes', label: 'Employés',
      icon: <i className='bx bx-group'></i>,
    }] : []),
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
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(59,130,246,0.4); }
          70% { box-shadow: 0 0 0 6px rgba(59,130,246,0); }
          100% { box-shadow: 0 0 0 0 rgba(59,130,246,0); }
        }
        .nav-item {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .nav-item:hover {
          transform: translateX(4px);
        }
        .logo-icon {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          animation: pulse 2s infinite;
        }
        .logo-icon:hover {
          transform: scale(1.08) rotate(3deg);
          animation: none;
        }
        @media (max-width: 900px) {
          .desktop-nav { display: none !important; }
          .hamburger-btn { display: flex !important; }
        }
        @media (max-width: 600px) {
          main { padding: 16px !important; }
        }
      `}</style>

      {/* ═══ HEADER ═══════════════════════════════════════════════════════ */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        height: 64, background: 'rgba(255,255,255,0.98)',
        backdropFilter: 'blur(12px)', borderBottom: '1px solid #eef2ff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: isMobile ? '0 16px' : '0 24px',
      }}>
        {/* Logo - Moderne et fantastique */}
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
            <span style={{ fontSize: 8, color: '#94a3b8', letterSpacing: '0.3px', fontWeight: 500 }}>
              Smart Finance
            </span>
          </div>
        </div>

        {/* Navigation Desktop */}
        <nav className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {navItems.map(item => (
            <NavLink 
              key={item.path} 
              to={item.path}
              className="nav-item"
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 14px', borderRadius: 10,
                color: isActive ? '#0c2e7c' : '#64748b',
                background: isActive ? '#eef2ff' : 'transparent',
                textDecoration: 'none', fontSize: 13, fontWeight: isActive ? 600 : 500,
                position: 'relative',
                transition: 'all 0.2s',
              })}
            >
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              <span>{item.label}</span>
              {item.badge && notifNonLues > 0 && (
                <span style={{ 
                  position: 'absolute', top: 4, right: 6, 
                  background: '#ef4444', color: '#fff', 
                  borderRadius: 20, fontSize: 9, fontWeight: 700, 
                  padding: '1px 5px', minWidth: 16, textAlign: 'center'
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
          {enEssai && !expire && (
            <div 
              onClick={() => navigate('/profil')}
              style={{
                display: 'flex', alignItems: 'center', gap: isMobile ? 4 : 6,
                background: '#fffbeb', borderRadius: isMobile ? 8 : 10, 
                padding: isMobile ? '4px 8px' : '6px 12px',
                border: '1px solid #fcd34d', cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(245,158,11,0.15)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
              title={infoEssai ? `Transactions aujourd'hui : ${infoEssai.transactions_aujourd_hui}/5 — Budgets : ${infoEssai.budgets_aujourd_hui}/2` : ''}
            >
              <i className='bx bx-hourglass' style={{ fontSize: isMobile ? 12 : 14, color: '#d97706' }}></i>
              <span style={{ fontSize: isMobile ? 9 : 11, color: '#92400e', fontWeight: 600 }}>
                Essai {abonnement?.jours_restants}j
              </span>
              {infoEssai && !isMobile && (
                <span style={{ fontSize: 9, color: '#b45309' }}>
                  • {infoEssai.transactions_restantes_jour} rest.
                </span>
              )}
            </div>
          )}

          {/* Badge expiré - version réduite pour mobile */}
          {expire && (
            <button 
              onClick={() => navigate('/profil')} 
              style={{
                background: '#ef4444', color: '#fff', border: 'none', 
                borderRadius: isMobile ? 8 : 10, 
                padding: isMobile ? '4px 10px' : '6px 14px', 
                cursor: 'pointer', 
                fontSize: isMobile ? 10 : 11, 
                fontWeight: 600, 
                display: 'flex', alignItems: 'center', gap: isMobile ? 4 : 6,
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(239,68,68,0.3)';
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

          {/* Badge abonné actif - COMPLÈTEMENT COMMENTÉ / MASQUÉ */}
          {/* 
          {abonneActif && !enEssai && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: isMobile ? 4 : 6,
              background: '#ecfdf5', borderRadius: isMobile ? 8 : 10, 
              padding: isMobile ? '4px 8px' : '6px 12px',
              border: '1px solid #6ee7b7'
            }}>
              <i className='bx bx-check-shield' style={{ fontSize: isMobile ? 11 : 13, color: '#059669' }}></i>
              <span style={{ fontSize: isMobile ? 9 : 11, color: '#065f46', fontWeight: 600 }}>
                {abonnement?.plan_nom === 'entreprise' ? 'Ent.' : (abonnement?.plan_nom || 'Abonné')}
                {!isMobile && ` • ${abonnement?.jours_restants}j`}
                {isMobile && abonnement?.jours_restants && ` • ${abonnement.jours_restants}j`}
              </span>
            </div>
          )}
          */}

          {/* Avatar */}
          <NavLink to="/profil" style={{ textDecoration: 'none' }}>
            <div style={{ 
              width: isMobile ? 34 : 38, 
              height: isMobile ? 34 : 38, 
              borderRadius: '50%', 
              background: 'linear-gradient(135deg, #0c2e7c, #1e4db7)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              color: '#fff', fontWeight: 600, fontSize: isMobile ? 12 : 13, 
              border: '2px solid white', 
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
              {user?.photo_profil
                ? <img src={getPhotoUrl(user.photo_profil)} alt="profil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : user?.google_photo
                  ? <img src={user.google_photo} alt="profil Google" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: isMobile ? 12 : 14 }}>{initiales}</span>}
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
              onClick={() => setMobileOpen(false)}
              style={({ isActive }) => ({ 
                display: 'flex', alignItems: 'center', gap: 14, 
                padding: '12px 24px', 
                color: isActive ? '#0c2e7c' : '#475569', 
                background: isActive ? '#eef2ff' : 'transparent', 
                fontWeight: isActive ? 600 : 500, 
                fontSize: 14, textDecoration: 'none',
                transition: 'background 0.2s',
              })}
              onMouseEnter={e => {
                if (!e.currentTarget.style.background.includes('#eef2ff')) {
                  e.currentTarget.style.background = '#f8fafc';
                }
              }}
              onMouseLeave={e => {
                if (!e.currentTarget.style.background.includes('#eef2ff')) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <span style={{ fontSize: 20 }}>{item.icon}</span>
              <span>{item.label}</span>
              {item.badge && notifNonLues > 0 && (
                <span style={{ 
                  marginLeft: 'auto', 
                  background: '#ef4444', color: '#fff', 
                  borderRadius: 20, fontSize: 10, fontWeight: 700, 
                  padding: '2px 8px', minWidth: 20, textAlign: 'center'
                }}>
                  {notifNonLues > 99 ? '99+' : notifNonLues}
                </span>
              )}
            </NavLink>
          ))}
          
          {/* Déconnexion dans menu mobile */}
          <div 
            onClick={handleDeconnexion}
            style={{ 
              display: 'flex', alignItems: 'center', gap: 14, padding: '12px 24px',
              color: '#ef4444', fontSize: 14, fontWeight: 500, cursor: 'pointer',
              borderTop: '1px solid #f1f5f9', marginTop: 8,
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <i className='bx bx-log-out' style={{ fontSize: 20 }}></i>
            Déconnexion
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

        {/* Bannière essai */}
        {enEssai && !expire && (
          <div style={{
            background: 'linear-gradient(135deg, #fffbeb, #fef3c7)',
            border: '1px solid #fcd34d', borderRadius: 14,
            padding: isMobile ? '12px 16px' : '12px 20px', marginBottom: 24,
            display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
          }}>
            <i className='bx bx-hourglass' style={{ fontSize: 20, color: '#d97706' }}></i>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#92400e' }}>
                Essai Gratuit (J-{abonnement?.jours_restants}) — Limite : 5 transactions / 2 budgets par jour
              </div>
              {infoEssai && (
                <div style={{ fontSize: 11, color: '#b45309', marginTop: 4 }}>
                  Aujourd'hui : {infoEssai.transactions_aujourd_hui}/5 trans. • {infoEssai.budgets_aujourd_hui}/2 budgets
                </div>
              )}
            </div>
            <button 
              onClick={() => navigate('/profil')} 
              style={{ 
                background: '#f59e0b', color: '#fff', border: 'none', 
                borderRadius: 10, padding: '8px 18px', cursor: 'pointer', 
                fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
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
              <i className='bx bx-crown' style={{ fontSize: 13 }}></i>
              S'abonner
            </button>
          </div>
        )}

        {/* Bannière expiration */}
        {expire && (
          <div style={{ 
            background: 'linear-gradient(135deg, #fef2f2, #fee2e2)', 
            border: '1px solid #fca5a5', borderRadius: 14, 
            padding: isMobile ? '12px 16px' : '14px 20px', marginBottom: 24, 
            display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap'
          }}>
            <i className='bx bx-lock-alt' style={{ fontSize: 20, color: '#dc2626' }}></i>
            <div style={{ flex: 1 }}>
              <strong style={{ color: '#991b1b', fontSize: 13 }}>Accès terminé</strong>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>
                Mode visualisation uniquement. Abonnez-vous pour continuer.
              </p>
            </div>
            <button 
              onClick={() => navigate('/profil')} 
              style={{ 
                background: '#dc2626', color: '#fff', border: 'none', 
                borderRadius: 10, padding: '8px 18px', cursor: 'pointer', 
                fontSize: 12, fontWeight: 600,
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
              onMouseEnter={e => { 
                e.currentTarget.style.transform = 'translateY(-1px)'; 
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(220,38,38,0.3)'; 
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

        {/* Alerte expiration proche */}
        {abonneActif && !enEssai && abonnement?.jours_restants <= 7 && (
          <div style={{ 
            background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 12, 
            padding: isMobile ? '10px 16px' : '10px 18px', marginBottom: 24, 
            display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap'
          }}>
            <i className='bx bx-time' style={{ fontSize: 18, color: '#d97706' }}></i>
            <span style={{ fontSize: 12, color: '#92400e', flex: 1 }}>
              Votre abonnement expire dans <strong>{abonnement.jours_restants} jour(s)</strong>
            </span>
            <button 
              onClick={() => navigate('/profil')} 
              style={{ 
                background: '#f59e0b', color: '#fff', border: 'none', 
                borderRadius: 8, padding: '6px 14px', cursor: 'pointer', 
                fontSize: 11, fontWeight: 600,
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