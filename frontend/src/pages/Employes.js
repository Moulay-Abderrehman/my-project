import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Employes() {
  const { user } = useAuth();
  const [employes, setEmployes] = useState([]);
  const [emailInvit, setEmailInvit] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingInvit, setLoadingInvit] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [lienManuel, setLienManuel] = useState('');

  const chargerEmployes = async () => {
    try {
      const res = await api.get('/comptes/mes-employes/');
      setEmployes(res.data);
    } catch {
      setEmployes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { chargerEmployes(); }, []);

  const handleInviter = async (e) => {
    e.preventDefault();
    if (!emailInvit.trim()) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailInvit)) {
      toast.error("Format d'email invalide.");
      return;
    }

    setLoadingInvit(true);
    setLienManuel('');
    try {
      const res = await api.post('/comptes/inviter-employe/', {
        email_employe: emailInvit.trim().toLowerCase(),
      });

      if (res.data.lien || res.data.warning) {
        setLienManuel(res.data.lien || '');
        toast.success(res.data.message || 'Invitation créée !', { duration: 5000 });
        if (res.data.warning) {
          toast(res.data.warning, { icon: '⚠️', duration: 8000 });
        }
      } else {
        toast.success(res.data.message || `Invitation envoyée à ${emailInvit} !`);
      }

      setEmailInvit('');
      setShowForm(false);
      chargerEmployes();
    } catch (err) {
      const errMsg =
        err.response?.data?.error ||
        err.response?.data?.email_employe?.[0] ||
        err.response?.data?.detail ||
        'Erreur lors de l\'invitation.';
      toast.error(errMsg, { duration: 6000 });
    } finally {
      setLoadingInvit(false);
    }
  };

  // Helper: construit l'URL correcte de la photo
  const getPhotoUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return `http://localhost:8000${path}`;
  };

  const initiales = user
    ? `${(user.prenom || '')[0] || ''}${(user.nom || '')[0] || ''}`.toUpperCase()
    : '?';

  const activeCount = employes.filter(e => e.is_active).length;

  return (
    <div className="employes-container">
      {/* Header compact */}
      <div className="employes-header">
        <div className="header-content">
          <div className="header-icon">
            <i className='bx bx-group'></i>
          </div>
          <div>
            <h1>Employés</h1>
            <p>{employes.length} employé(s) • {activeCount} actif(s)</p>
          </div>
        </div>
      </div>

      {/* User Profile Card - compact */}
      <div className="profile-card">
        <div className="profile-avatar">
          {user?.photo_profil
            ? <img src={getPhotoUrl(user.photo_profil)} alt="profil" />
            : <span>{initiales}</span>
          }
        </div>
        <div className="profile-info">
          <h3>{user?.prenom} {user?.nom}</h3>
          <p><i className='bx bx-building'></i> Compte Entreprise</p>
        </div>
        <div className="profile-badge">
          <i className='bx bx-trophy'></i> Plan pro
        </div>
      </div>

      {/* Invitation Section - réduite et compacte */}
      <div className="invitation-section">
        {!showForm ? (
          <button onClick={() => setShowForm(true)} className="show-invite-btn">
            <i className='bx bx-user-plus'></i>
            <span>Inviter un employé</span>
            <i className='bx bx-chevron-right'></i>
          </button>
        ) : (
          <div className="invitation-card compact">
            <div className="card-header">
              <i className='bx bx-mail-send'></i>
              <div>
                <h3>Nouvelle invitation</h3>
              </div>
              <button onClick={() => { setShowForm(false); setLienManuel(''); }} className="close-form">
                <i className='bx bx-x'></i>
              </button>
            </div>

            <form onSubmit={handleInviter} className="invitation-form">
              <div className="input-group">
                <i className='bx bx-envelope'></i>
                <input
                  type="email"
                  value={emailInvit}
                  onChange={e => setEmailInvit(e.target.value)}
                  placeholder="email@exemple.com"
                  required
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={loadingInvit || !emailInvit.trim()}
                className="invite-btn"
              >
                {loadingInvit ? (
                  <>
                    <div className="spinner"></div>
                    Envoi...
                  </>
                ) : (
                  <>
                    <i className='bx bx-send'></i> Envoyer
                  </>
                )}
              </button>
            </form>

            {lienManuel && (
              <div className="manual-link-card">
                <div className="manual-header">
                  <i className='bx bx-link-alt'></i>
                  <span>Lien manuel</span>
                </div>
                <div className="link-container">
                  <code>{lienManuel}</code>
                  <button onClick={() => { navigator.clipboard.writeText(lienManuel); toast.success('Lien copié !'); }}>
                    <i className='bx bx-copy'></i>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Employees List Card */}
      <div className="employes-list-card">
        <div className="card-header">
          <i className='bx bx-user-check'></i>
          <div>
            <h3>Tous les employés</h3>
          </div>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner large"></div>
            <p>Chargement...</p>
          </div>
        ) : employes.length === 0 ? (
          <div className="empty-state">
            <i className='bx bx-user-plus'></i>
            <h4>Aucun employé</h4>
            <p>Invitez votre premier employé pour commencer</p>
          </div>
        ) : (
          <div className="employes-table">
            {employes.map((emp, i) => {
              const initEmp = `${(emp.prenom || '')[0] || '?'}${(emp.nom || '')[0] || ''}`.toUpperCase();
              return (
                <div key={emp.id} className="employe-row">
                  <div className="employe-avatar">
                    {emp.photo_profil
                      ? <img src={getPhotoUrl(emp.photo_profil)} alt="emp" />
                      : <span>{initEmp}</span>
                    }
                  </div>
                  <div className="employe-info">
                    <div className="employe-name">
                      {emp.prenom && emp.nom ? `${emp.prenom} ${emp.nom}` : 'En attente'}
                    </div>
                    <div className="employe-email">
                      <i className='bx bx-envelope'></i> {emp.email || emp.invitation_email}
                    </div>
                  </div>
                  <div className={`status-badge ${emp.is_active ? 'active' : 'pending'}`}>
                    <i className={`bx ${emp.is_active ? 'bx-check-circle' : 'bx-time'}`}></i>
                    {emp.is_active ? 'Actif' : 'Attente'}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Info Card - compact */}
      <div className="info-card">
        <i className='bx bx-data'></i>
        <span>Les transactions des employés sont visibles dans votre tableau de bord</span>
      </div>

      <style jsx>{`
        @import url('https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css');
        
        .employes-container {
          max-width: 780px;
          margin: 0 auto;
          padding: 20px 16px;
          font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
        }

        /* Header compact */
        .employes-header {
          margin-bottom: 20px;
        }
        .header-content {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .header-icon {
          width: 44px;
          height: 44px;
          background: linear-gradient(135deg, #0c2e7c 0%, #1a4a9e 100%);
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 24px;
        }
        .employes-header h1 {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 700;
          color: #0c2e7c;
        }
        .employes-header p {
          margin: 2px 0 0;
          color: #6c7f9c;
          font-size: 0.8rem;
        }

        /* Profile Card compact */
        .profile-card {
          background: white;
          border-radius: 20px;
          padding: 14px 20px;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
          border: 1px solid #eef2f8;
        }
        .profile-avatar {
          width: 44px;
          height: 44px;
          border-radius: 30px;
          background: linear-gradient(145deg, #0c2e7c, #143d8c);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          font-size: 1rem;
          flex-shrink: 0;
          overflow: hidden;
        }
        .profile-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .profile-info h3 {
          margin: 0;
          font-size: 0.95rem;
          font-weight: 700;
          color: #1e2a44;
        }
        .profile-info p {
          margin: 2px 0 0;
          font-size: 0.7rem;
          color: #6c7f9c;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .profile-badge {
          margin-left: auto;
          background: #0c2e7c10;
          border: 1px solid #0c2e7c20;
          padding: 4px 12px;
          border-radius: 30px;
          font-size: 0.7rem;
          font-weight: 600;
          color: #0c2e7c;
          display: flex;
          align-items: center;
          gap: 5px;
        }

        /* Invitation section réduite */
        .invitation-section {
          margin-bottom: 20px;
        }
        .show-invite-btn {
          width: 100%;
          background: white;
          border: 1px dashed #cbd5e1;
          border-radius: 16px;
          padding: 14px 20px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          color: #0c2e7c;
          font-weight: 600;
          font-size: 0.9rem;
          transition: all 0.2s;
        }
        .show-invite-btn:hover {
          background: #f8fafd;
          border-color: #0c2e7c;
          gap: 12px;
        }
        .invitation-card.compact {
          background: white;
          border-radius: 20px;
          padding: 16px 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
          border: 1px solid #eef2f8;
        }
        .card-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 14px;
        }
        .card-header i:first-child {
          font-size: 20px;
          color: #0c2e7c;
          background: #eef3ff;
          padding: 6px;
          border-radius: 12px;
        }
        .card-header h3 {
          margin: 0;
          font-size: 0.9rem;
          font-weight: 600;
          color: #1e2a44;
        }
        .close-form {
          margin-left: auto;
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
          color: #94a3b8;
          display: flex;
          align-items: center;
          padding: 4px;
        }
        .invitation-form {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        .input-group {
          flex: 1;
          display: flex;
          align-items: center;
          background: #f8fafd;
          border: 1px solid #e2edf5;
          border-radius: 40px;
          padding: 0 14px;
        }
        .input-group i {
          color: #8a9bb5;
          font-size: 1rem;
        }
        .input-group input {
          flex: 1;
          padding: 12px 8px;
          border: none;
          background: transparent;
          font-size: 0.85rem;
          outline: none;
        }
        .invite-btn {
          background: #0c2e7c;
          border: none;
          border-radius: 40px;
          padding: 0 20px;
          color: white;
          font-weight: 600;
          font-size: 0.8rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
        }
        .invite-btn:disabled {
          opacity: 0.6;
        }
        .manual-link-card {
          margin-top: 14px;
          background: #fff9e8;
          border-radius: 14px;
          padding: 10px 14px;
        }
        .manual-header {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.7rem;
          color: #a66400;
          margin-bottom: 8px;
        }
        .link-container {
          display: flex;
          gap: 8px;
        }
        .link-container code {
          flex: 1;
          background: white;
          padding: 6px 10px;
          border-radius: 10px;
          font-size: 0.65rem;
          word-break: break-all;
        }
        .link-container button {
          background: #0c2e7c;
          border: none;
          border-radius: 10px;
          padding: 0 14px;
          color: white;
          cursor: pointer;
        }

        /* Employes list */
        .employes-list-card {
          background: white;
          border-radius: 20px;
          padding: 20px;
          margin-bottom: 16px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
          border: 1px solid #eef2f8;
        }
        .employes-list-card .card-header {
          margin-bottom: 16px;
        }
        .employes-table {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .employe-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 0;
          border-bottom: 1px solid #f0f4fa;
        }
        .employe-row:last-child {
          border-bottom: none;
        }
        .employe-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #eef3ff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          color: #0c2e7c;
          flex-shrink: 0;
          overflow: hidden;
        }
        .employe-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .employe-info {
          flex: 1;
        }
        .employe-name {
          font-weight: 600;
          color: #1e2a44;
          font-size: 0.85rem;
        }
        .employe-email {
          font-size: 0.7rem;
          color: #7a8aaa;
          margin-top: 2px;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .status-badge {
          font-size: 0.65rem;
          font-weight: 600;
          padding: 3px 10px;
          border-radius: 30px;
          display: flex;
          align-items: center;
          gap: 4px;
          white-space: nowrap;
        }
        .status-badge.active {
          background: #e0f7ea;
          color: #1f7840;
        }
        .status-badge.pending {
          background: #fff0db;
          color: #b45b0a;
        }

        /* Empty & loading */
        .empty-state, .loading-state {
          text-align: center;
          padding: 32px 16px;
          color: #8a9bb5;
        }
        .empty-state i {
          font-size: 40px;
          color: #cbdbe0;
          margin-bottom: 8px;
        }
        .empty-state h4 {
          margin: 6px 0;
          font-size: 0.9rem;
          color: #3a4d6e;
        }
        .empty-state p {
          font-size: 0.75rem;
        }
        .spinner {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255,255,255,0.2);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        .spinner.large {
          width: 28px;
          height: 28px;
          margin: 0 auto 8px;
          border: 2px solid #e2e8f0;
          border-top-color: #0c2e7c;
        }

        /* Info card */
        .info-card {
          background: #eef3ff;
          border-radius: 16px;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 0.7rem;
          color: #1e4880;
        }
        .info-card i {
          font-size: 18px;
          flex-shrink: 0;
        }

        /* Responsive */
        @media (max-width: 560px) {
          .employes-container {
            padding: 12px;
          }
          .profile-card {
            flex-direction: column;
            text-align: center;
          }
          .profile-badge {
            margin-left: 0;
          }
          .invitation-form {
            flex-direction: column;
          }
          .invite-btn {
            justify-content: center;
            padding: 10px;
          }
          .employe-row {
            flex-wrap: wrap;
          }
          .status-badge {
            margin-left: 52px;
          }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}