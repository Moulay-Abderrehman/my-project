// frontend/src/pages/SSOCallback.js
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function SSOCallback() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { chargerAbonnement, chargerNotifs } = useAuth();
  const [statut, setStatut] = useState('Finalisation de la connexion...');
  const [erreur, setErreur] = useState('');
  const [succes, setSucces] = useState('');

  useEffect(() => {
    // Récupérer les paramètres d'URL
    const accessToken = params.get('access');
    const refreshToken = params.get('refresh');
    const userParam = params.get('user');
    const error = params.get('error');

    console.log('[SSOCallback] Paramètres reçus:', { accessToken: !!accessToken, refreshToken: !!refreshToken, userParam: !!userParam, error });

    if (error) {
      setErreur('Connexion SSO annulée.');
      setTimeout(() => navigate('/'), 3000);
      return;
    }

    if (accessToken && refreshToken && userParam) {
      try {
        // Décoder le user JSON
        const user = JSON.parse(decodeURIComponent(userParam));
        console.log('[SSOCallback] Utilisateur reçu:', user);
        
        localStorage.setItem('access_token', accessToken);
        localStorage.setItem('refresh_token', refreshToken);
        localStorage.setItem('user', JSON.stringify(user));
        
        // Recharger l'abonnement et les notifications
        chargerAbonnement();
        chargerNotifs();
        
        setSucces(`✅ Bienvenue ${user.prenom || user.nom || '!'}`);
        setStatut('Connexion réussie, redirection...');
        navigate('/dashboard');
      } catch (err) {
        console.error('[SSOCallback] Erreur parsing:', err);
        setErreur('Les données utilisateur sont corrompues.'); //ajoute
        setTimeout(() => navigate('/'), 3000);  //navigate('/');
      }
      return;
    }

    // Si pas de tokens, afficher une erreur
    setErreur('Connexion SSO incomplète. Veuillez réessayer.');
    setTimeout(() => navigate('/'), 3000);
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0c2e7c, #1e4db7, #3b82f6)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 20,
      fontFamily: "'Sora', sans-serif",
    }}>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0c2e7c" strokeWidth="2.5">
            <rect x="2" y="5" width="20" height="14" rx="2"/>
            <line x1="2" y1="10" x2="22" y2="10"/>
          </svg>
        </div>
        <span style={{ fontWeight: 700, fontSize: 18, color: '#fff' }}>
          Finance<span style={{ color: '#dbeafe' }}>App</span>
        </span>
      </div>

      {/* Message personnalisé (remplace les toasts) */}
      {(erreur || succes) && (
        <div style={{
          animation: 'fadeIn 0.3s ease-out',
          background: erreur ? 'rgba(254, 226, 226, 0.95)' : 'rgba(220, 252, 231, 0.95)',
          border: `1px solid ${erreur ? '#fca5a5' : '#86efac'}`,
          color: erreur ? '#b91c1c' : '#15803d',
          padding: '10px 18px',
          borderRadius: 12,
          fontSize: 13,
          fontWeight: 600,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          maxWidth: 380,
          textAlign: 'center',
        }}>
          {erreur || succes}
        </div>
      )}

      <div style={{
        background: 'rgba(255,255,255,0.95)', borderRadius: 20,
        padding: '36px 40px', textAlign: 'center',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        minWidth: 320,
      }}>
        {!erreur ? (
          <>
            <div style={{ position: 'relative', width: 56, height: 56, margin: '0 auto 20px' }}>
              <div style={{
                width: 56, height: 56, border: '3px solid #e2e8f0',
                borderTopColor: '#0c2e7c', borderRadius: '50%',
                animation: 'spin 0.9s linear infinite',
              }} />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0c2e7c" strokeWidth="2">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
              </div>
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: 17, fontWeight: 600, color: '#0c2e7c' }}>
              {statut}
            </h3>
            <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
              Veuillez patienter quelques secondes...
            </p>
          </>
        ) : (
          <>
            <div style={{ fontSize: 44, marginBottom: 14 }}>❌</div>
            <h3 style={{ margin: '0 0 8px', fontSize: 17, fontWeight: 600, color: '#dc2626' }}>
              Connexion SSO échouée
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>
              {erreur}
            </p>
            <p style={{ margin: 0, fontSize: 12, color: '#94a3b8' }}>
              Redirection dans 3 secondes...
            </p>
          </>
        )}
      </div>
    </div>
  );
}