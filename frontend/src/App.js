import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// ── Pages Auth ────────────────────────────────────────────────────────────────
import AuthChoix        from './pages/AuthChoix';
import Connexion        from './pages/Connexion';
import Inscription      from './pages/Inscription';
import MotDePasseOublie from './pages/MotDePasseOublie';
import ActiverEmploye   from './pages/ActiverEmploye';
import GoogleCallback   from './pages/GoogleCallback';
import SSOCallback      from './pages/SSOCallback';

// ── Pages App ─────────────────────────────────────────────────────────────────
import Dashboard          from './pages/Dashboard';
import Transactions       from './pages/Transactions';
import ToutesTransactions from './pages/ToutesTransactions';
import Budgets            from './pages/Budgets';
import Categories         from './pages/Categories';
import Profil             from './pages/Profil';
import Notifications      from './pages/Notifications';
import Employes           from './pages/Employes';
import Layout             from './components/Layout';

// ─── Écran de chargement ──────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div style={{
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      height: '100vh', flexDirection: 'column', gap: 12,
      background: 'linear-gradient(135deg, #0c2e7c, #1e4db7, #3b82f6)',
    }}>
      <div style={{
        width: 40, height: 40,
        border: '3px solid rgba(255,255,255,0.2)',
        borderTopColor: '#fff', borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <p style={{ color: '#fff', fontSize: 14, margin: 0 }}>Chargement...</p>
    </div>
  );
}

// ─── Route privée : doit être connecté ───────────────────────────────────────
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return user ? children : <Navigate to="/" replace />;
};

// ─── Route publique : redirige si déjà connecté ───────────────────────────────
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return user ? <Navigate to="/dashboard" replace /> : children;
};

// ─── Route Entreprise : accessible uniquement aux comptes entreprise ──────────
// Recharge le profil depuis l'API pour avoir le role à jour
const EntrepriseRoute = ({ children }) => {
  const { user, loading, estEntreprise, rechargerProfil } = useAuth();

  useEffect(() => {
    // Recharger le profil depuis l'API pour s'assurer que role est à jour
    if (user) rechargerProfil();
  }, []); // eslint-disable-line

  if (loading) return <LoadingScreen />;

  if (!user) return <Navigate to="/" replace />;

  // Vérification : role === 'entreprise' OU plan_nom === 'entreprise'
  if (!estEntreprise()) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '80vh', flexDirection: 'column', gap: 16, textAlign: 'center',
        fontFamily: "'Sora',sans-serif",
      }}>
        <div style={{ fontSize: 48 }}>🔒</div>
        <h2 style={{ margin: 0, color: '#0c2e7c', fontSize: 20 }}>Accès réservé aux entreprises</h2>
        <p style={{ color: '#64748b', fontSize: 14 }}>
          Cette page est uniquement accessible aux comptes de type <strong>Entreprise</strong>.
        </p>
        <button onClick={() => window.history.back()} style={{
          background: '#0c2e7c', color: '#fff', border: 'none', borderRadius: 10,
          padding: '10px 24px', cursor: 'pointer', fontWeight: 700, fontSize: 14,
        }}>
          Retour
        </button>
      </div>
    );
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster position="top-right" toastOptions={{
          style: {
            borderRadius: 10, background: '#1e293b', color: '#f1f5f9',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)', fontSize: 14,
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }} />

        <Routes>
          {/* ── Routes publiques ────────────────────────────────────────── */}
          <Route path="/"                    element={<PublicRoute><AuthChoix /></PublicRoute>} />
          <Route path="/connexion"           element={<PublicRoute><Connexion /></PublicRoute>} />
          <Route path="/inscription"         element={<PublicRoute><Inscription /></PublicRoute>} />
          <Route path="/mot-de-passe-oublie" element={<MotDePasseOublie />} />
          <Route path="/activer-employe"     element={<ActiverEmploye />} />
          <Route path="/auth/google/callback" element={<GoogleCallback />} />
          {/*} Dans les routes*/}
          <Route path="/auth/sso/callback" element={<SSOCallback />} />
          

          {/* ── Routes protégées ────────────────────────────────────────── */}
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route path="dashboard"           element={<Dashboard />} />
            <Route path="transactions"        element={<Transactions />} />
            <Route path="toutes-transactions" element={<ToutesTransactions />} />
            <Route path="budgets"             element={<Budgets />} />
            <Route path="categories"          element={<Categories />} />
            <Route path="notifications"       element={<Notifications />} />
            <Route path="profil"              element={<Profil />} />

            {/* ── Page Employés : entreprise uniquement ─────────────────── */}
            <Route path="employes" element={
              <EntrepriseRoute><Employes /></EntrepriseRoute>
            } />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;


