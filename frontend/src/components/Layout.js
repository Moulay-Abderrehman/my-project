import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function Layout() {
  const { user, abonnement, estAbonne, estEnEssai, estExpire, estEntreprise, notifNonLues, deconnexion } = useAuth();
  const navigate     = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [infoEssai,  setInfoEssai]  = useState(null);
  const [logoutHover, setLogoutHover] = useState(false);

  const abonneActif  = estAbonne();
  const enEssai      = estEnEssai();
  const expire       = estExpire();
  const entreprise   = estEntreprise();

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
      icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
    },
    {
      path: '/transactions', label: 'Transactions',
      icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
    },
    {
      path: '/toutes-transactions', label: 'Historique',
      icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
    },
    {
      path: '/budgets', label: 'Budgets',
      icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49"/></svg>,
    },
    {
      path: '/categories', label: 'Catégories',
      icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
    },
    {
      path: '/notifications', label: 'Notifications', badge: true,
      icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
    },
    // ── Page Employés : visible uniquement pour les entreprises ──────────────
    ...(entreprise ? [{
      path: '/employes', label: 'Employés',
      icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    }] : []),
    {
      path: '/profil', label: 'Profil',
      icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', fontFamily: "'Sora','Segoe UI',sans-serif" }}>

      {/* ═══ HEADER ═══════════════════════════════════════════════════════ */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        height: 64, background: 'rgba(255,255,255,0.97)',
        backdropFilter: 'blur(12px)', borderBottom: '1px solid #e2e8f0',
        boxShadow: '0 2px 16px rgba(12,46,124,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button className="hamburger-btn" onClick={() => setMobileOpen(v => !v)} style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', color: '#0c2e7c' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: '#0c2e7c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
          </div>
          <span style={{ fontWeight: 800, fontSize: 17, color: '#0c2e7c', letterSpacing: '-0.3px' }}>
            Finance<span style={{ color: '#3b82f6' }}>App</span>
          </span>
        </div>

        {/* Navigation Desktop */}
        <nav className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {navItems.map(item => (
            <NavLink key={item.path} to={item.path}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '6px 10px', borderRadius: 8,
                color: isActive ? '#0c2e7c' : '#64748b',
                background: isActive ? '#dbeafe' : 'transparent',
                textDecoration: 'none', fontSize: 12.5, fontWeight: isActive ? 700 : 500,
                position: 'relative', whiteSpace: 'nowrap',
                transition: 'all 0.2s ease',
              })}
            >
              <span style={{ fontSize: 14 }}>{item.icon}</span>
              <span>{item.label}</span>
              {item.badge && notifNonLues > 0 && (
                <span style={{ position: 'absolute', top: 2, right: 2, background: '#ef4444', color: '#fff', borderRadius: 20, fontSize: 9, fontWeight: 700, padding: '1px 4px', minWidth: 14, textAlign: 'center' }}>
                  {notifNonLues > 99 ? '99+' : notifNonLues}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Section droite avec badges et déconnexion */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Badge essai avec compteur quotidien */}
          {enEssai && !expire && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: '#fef3c7', borderRadius: 8, padding: '5px 10px',
              border: '1px solid #f59e0b', cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }} onClick={() => navigate('/profil')}
               onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'; }}
               onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
               title={infoEssai ? `Transactions aujourd'hui : ${infoEssai.transactions_aujourd_hui}/5 — Budgets : ${infoEssai.budgets_aujourd_hui}/2` : ''}>
              <span style={{ fontSize: 12 }}>⏳</span>
              <span style={{ fontSize: 11, color: '#92400e', fontWeight: 700 }}>
                Essai — J-{abonnement?.jours_restants}
              </span>
              {infoEssai && (
                <span style={{ fontSize: 10, color: '#92400e', opacity: 0.8 }}>
                  • {infoEssai.transactions_restantes_jour} trans.
                </span>
              )}
            </div>
          )}

          {expire && (
            <button onClick={() => navigate('/profil')} style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 13px', cursor: 'pointer', fontSize: 11, fontWeight: 700, transition: 'transform 0.2s, box-shadow 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(239,68,68,0.3)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
              ⛔ Expiré
            </button>
          )}

          {abonneActif && !enEssai && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#ecfdf5', borderRadius: 8, padding: '5px 10px', border: '1px solid #6ee7b7' }}>
              <span style={{ fontSize: 11, color: '#065f46', fontWeight: 700 }}>
                ✅ {abonnement?.plan_nom} • {abonnement?.jours_restants}j
              </span>
            </div>
          )}

          {/* ── BOUTON DÉCONNEXION MODERNE ── */}
          <button 
            onClick={handleDeconnexion}
            onMouseEnter={() => setLogoutHover(true)}
            onMouseLeave={() => setLogoutHover(false)}
            style={{
              background: logoutHover ? 'rgba(239, 68, 68, 0.9)' : 'rgba(0,0,0,0.05)',
              backdropFilter: 'blur(10px)',
              color: logoutHover ? '#fff' : '#64748b',
              border: logoutHover ? '1px solid #ef4444' : '1px solid rgba(0,0,0,0.1)',
              borderRadius: 40,
              padding: '8px 16px',
              cursor: 'pointer',
              fontSize: 12.5,
              fontWeight: 600,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: logoutHover ? '0 4px 12px rgba(239,68,68,0.3)' : 'none',
              transform: logoutHover ? 'translateY(-1px)' : 'translateY(0)',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Déconnexion
          </button>

          {/* Avatar */}
          <NavLink to="/profil" style={{ textDecoration: 'none' }}>
            <div style={{ 
              width: 36, height: 36, borderRadius: '50%', 
              background: 'linear-gradient(135deg,#0c2e7c,#1e4db7)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              color: '#fff', fontWeight: 700, fontSize: 13, 
              border: '2px solid #e2e8f0', overflow: 'hidden', 
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}>
              {user?.photo_profil
                ? <img src={`http://localhost:8000${user.photo_profil}`} alt="profil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : user?.google_photo
                  ? <img src={user.google_photo} alt="profil Google" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span>{initiales}</span>}
            </div>
          </NavLink>
        </div>
      </header>

      {/* ═══ MENU MOBILE ══════════════════════════════════════════════════ */}
      {mobileOpen && (
        <div style={{ 
          position: 'fixed', top: 64, left: 0, right: 0, zIndex: 999, 
          background: '#fff', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', 
          padding: '8px 0', borderTop: '1px solid #e0e7ff',
          animation: 'slideDown 0.2s ease',
        }}>
          {navItems.map(item => (
            <NavLink key={item.path} to={item.path} onClick={() => setMobileOpen(false)}
              style={({ isActive }) => ({ 
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 24px', 
                color: isActive ? '#0c2e7c' : '#475569', 
                background: isActive ? '#dbeafe' : 'transparent', 
                fontWeight: isActive ? 700 : 400, fontSize: 14, textDecoration: 'none',
                transition: 'background 0.2s',
              })}
            >
              <span>{item.icon}</span>{item.label}
            </NavLink>
          ))}
          {/* Bouton déconnexion dans le menu mobile */}
          <div 
            onClick={handleDeconnexion}
            style={{ 
              display: 'flex', alignItems: 'center', gap: 12, padding: '12px 24px',
              color: '#ef4444', fontSize: 14, fontWeight: 500, cursor: 'pointer',
              borderTop: '1px solid #f1f5f9', marginTop: 8,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Déconnexion
          </div>
        </div>
      )}

      {/* ═══ MAIN ═════════════════════════════════════════════════════════ */}
      <main style={{ marginTop: 64, flex: 1, background: '#f8fafc', padding: '28px 32px', minHeight: 'calc(100vh - 64px)' }}>

        {/* Bannière essai avec limite quotidienne */}
        {enEssai && !expire && (
          <div style={{
            background: 'linear-gradient(135deg,#fef3c7,#fde68a)',
            border: '1px solid #f59e0b', borderRadius: 12,
            padding: '12px 20px', marginBottom: 20,
            display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
          }}>
            <span style={{ fontSize: 20 }}>⏳</span>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#92400e' }}>
                Essai Gratuit (J-{abonnement?.jours_restants}) — Limite quotidienne : 5 transactions et 2 budgets
              </div>
              {infoEssai && (
                <div style={{ fontSize: 12, color: '#a16207', marginTop: 3 }}>
                  Aujourd'hui : {infoEssai.transactions_aujourd_hui}/5 transactions •{' '}
                  {infoEssai.budgets_aujourd_hui}/2 budgets.{' '}
                  Profitez de l'exploration complète !
                </div>
              )}
            </div>
            <button onClick={() => navigate('/profil')} style={{ 
              background: '#f59e0b', color: '#fff', border: 'none', 
              borderRadius: 8, padding: '7px 16px', cursor: 'pointer', 
              fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(245,158,11,0.3)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
              S'abonner
            </button>
          </div>
        )}

        {/* Bannière expiration */}
        {expire && (
          <div style={{ background: 'linear-gradient(135deg,#fef2f2,#fee2e2)', border: '1px solid #ef4444', borderRadius: 12, padding: '14px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: 22 }}>⛔</span>
            <div style={{ flex: 1 }}>
              <strong style={{ color: '#991b1b', fontSize: 14 }}>Votre période d'accès est terminée.</strong>
              <p style={{ margin: '2px 0 0', fontSize: 13, color: '#64748b' }}>
                Vous êtes en mode visualisation uniquement. Abonnez-vous pour reprendre l'accès complet.
              </p>
            </div>
            <button onClick={() => navigate('/profil')} style={{ 
              background: '#ef4444', color: '#fff', border: 'none', 
              borderRadius: 8, padding: '8px 18px', cursor: 'pointer', 
              fontSize: 13, fontWeight: 700,
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(239,68,68,0.3)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
              S'abonner
            </button>
          </div>
        )}

        {/* Alerte expiration proche */}
        {abonneActif && !enEssai && abonnement?.jours_restants <= 7 && (
          <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: 10, padding: '10px 18px', marginBottom: 20, color: '#92400e', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>⚠️</span>
            <span style={{ fontSize: 13 }}>Votre abonnement expire dans <strong>{abonnement.jours_restants} jour(s)</strong>.</span>
            <button onClick={() => navigate('/profil')} style={{ 
              marginLeft: 'auto', background: '#f59e0b', color: '#fff', 
              border: 'none', borderRadius: 6, padding: '5px 14px', 
              cursor: 'pointer', fontSize: 12, fontWeight: 700,
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(245,158,11,0.3)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
              Renouveler
            </button>
          </div>
        )}

        <Outlet />
      </main>

      <style>{`
        @media(max-width:900px){.desktop-nav{display:none!important}.hamburger-btn{display:flex!important}}
        @media(max-width:600px){main{padding:14px!important}}
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}