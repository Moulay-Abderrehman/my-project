import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const EMOJIS = ['📦','💰','💻','🛒','🚌','🏥','🎉','🏠','📚','✈️','🍽️','💡','👔','🎮','🏋️','🎓','💊','🏦','🛠️','🎵','🌿','🔧','📱','🚀','⭐'];
const COULEURS_PRESET = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899','#14b8a6','#f97316','#84cc16'];

export default function Categories() {
  const { abonnement, estEnEssai, estExpire } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showForm,   setShowForm]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ nom: '', icone: '📦', couleur: '#6366f1', type: 'les_deux' });

  // Droits selon plan
  // const planNom  = abonnement?.plan_nom || 'essai';
  const enEssai  = estEnEssai();
  const expire   = estExpire();
  const peutCreer = !enEssai && !expire && abonnement?.est_actif;

  const nbMax    = abonnement?.nb_categories_autorisees ?? 2;
  const mesCats  = categories.filter(c => c.utilisateur !== null);
  const sysCats  = categories.filter(c => c.utilisateur === null);
  const limitAtteinte = nbMax !== -1 && mesCats.length >= nbMax;

  const charger = async () => {
    setLoading(true);
    try {
      const res = await api.get('/transactions/categories/');
      setCategories(res.data.results || res.data);
    } catch {
      toast.error('Erreur lors du chargement des catégories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { charger(); }, []);

  const creer = async (e) => {
    e.preventDefault();
    if (!peutCreer) {
      toast.error("Abonnez-vous pour créer des catégories personnalisées.");
      return;
    }
    if (limitAtteinte) {
      toast.error(`Limite de ${nbMax} catégories atteinte. Passez à un plan supérieur.`);
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/transactions/categories/', form);
      toast.success('✅ Catégorie créée avec succès !');
      setForm({ nom: '', icone: '📦', couleur: '#6366f1', type: 'les_deux' });
      setShowForm(false);
      charger();
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.error || 'Erreur lors de la création';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const supprimer = async (id) => {
    if (!window.confirm('Supprimer cette catégorie ?')) return;
    try {
      await api.delete(`/transactions/categories/${id}/`);
      toast.success('Catégorie supprimée');
      charger();
    } catch {
      toast.error('Impossible de supprimer cette catégorie');
    }
  };

  const inp = {
    padding: '10px 14px', borderRadius: 8, border: '1.5px solid #e2e8f0',
    fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box',
    fontFamily: 'inherit',
  };

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>

      {/* ── En-tête ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#1e293b' }}>🏷️ Catégories</h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>
            {peutCreer
              ? `${mesCats.length} catégorie(s) personnelle(s)${nbMax !== -1 ? ` sur ${nbMax} max` : ' (illimitées)'}`
              : enEssai
                ? `Mode essai — 2 catégories système disponibles`
                : `Abonnez-vous pour créer des catégories`}
          </p>
        </div>

        {/* Bouton créer */}
        {peutCreer && !limitAtteinte && (
          <button onClick={() => setShowForm(v => !v)} style={{
            background: showForm ? '#f1f5f9' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
            color: showForm ? '#64748b' : '#fff', border: 'none', borderRadius: 10,
            padding: '10px 20px', cursor: 'pointer', fontWeight: 700, fontSize: 14,
            boxShadow: showForm ? 'none' : '0 4px 14px rgba(99,102,241,0.3)',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            {showForm ? '✕ Annuler' : '➕ Nouvelle catégorie'}
          </button>
        )}
        {peutCreer && limitAtteinte && (
          <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: 8, padding: '8px 14px', fontSize: 13, color: '#92400e' }}>
            ⚠️ Limite de {nbMax} catégories atteinte
          </div>
        )}
      </div>

      {/* ── Alerte si essai ou expiré ────────────────────────────────────── */}
      {(enEssai || expire) && (
        <div style={{
          background: enEssai ? '#fef3c7' : '#fef2f2',
          border: `1px solid ${enEssai ? '#f59e0b' : '#ef4444'}`,
          borderRadius: 12, padding: '16px 20px', marginBottom: 24,
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <span style={{ fontSize: 28 }}>{enEssai ? '⏳' : '⛔'}</span>
          <div style={{ flex: 1 }}>
            <strong style={{ color: enEssai ? '#92400e' : '#991b1b', fontSize: 15 }}>
              {enEssai ? 'Période d\'essai active' : 'Abonnement expiré'}
            </strong>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
              {enEssai
                ? 'Vous pouvez utiliser les catégories système. Pour créer vos propres catégories, abonnez-vous.'
                : 'Votre accès est en mode lecture seule. Abonnez-vous pour reprendre l\'accès complet.'}
            </p>
          </div>
          <button onClick={() => navigate('/profil')} style={{
            background: enEssai ? '#f59e0b' : '#ef4444', color: '#fff',
            border: 'none', borderRadius: 8, padding: '8px 16px',
            cursor: 'pointer', fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap',
          }}>
            S'abonner
          </button>
        </div>
      )}

      {/* ── Formulaire de création ───────────────────────────────────────── */}
      {showForm && peutCreer && (
        <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 2px 16px rgba(0,0,0,0.07)', marginBottom: 24, border: '1px solid #e0e7ff' }}>
          <h3 style={{ margin: '0 0 18px', fontSize: 16, color: '#1e293b', fontWeight: 700 }}>
            ➕ Créer une nouvelle catégorie
          </h3>
          <form onSubmit={creer} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 12, alignItems: 'end' }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 4, textTransform: 'uppercase' }}>Nom *</label>
                <input value={form.nom} onChange={e => setForm({...form, nom: e.target.value})}
                  placeholder="Ex : Épargne, Loyer..." required style={inp} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 4, textTransform: 'uppercase' }}>Icône</label>
                <select value={form.icone} onChange={e => setForm({...form, icone: e.target.value})}
                  style={{ ...inp, width: 80, textAlign: 'center', fontSize: 18 }}>
                  {EMOJIS.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 4, textTransform: 'uppercase' }}>Couleur</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', maxWidth: 180 }}>
                  {COULEURS_PRESET.map(c => (
                    <div key={c} onClick={() => setForm({...form, couleur: c})}
                      style={{ width: 24, height: 24, borderRadius: '50%', background: c, cursor: 'pointer', border: form.couleur === c ? '3px solid #1e293b' : '2px solid transparent', transition: 'border 0.15s' }} />
                  ))}
                </div>
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 4, textTransform: 'uppercase' }}>Type</label>
              <div style={{ display: 'flex', gap: 10 }}>
                {[['entree','↑ Entrée','#10b981'],['sortie','↓ Sortie','#ef4444'],['les_deux','↕ Les deux','#6366f1']].map(([val, label, color]) => (
                  <button key={val} type="button" onClick={() => setForm({...form, type: val})} style={{
                    flex: 1, padding: '9px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13,
                    border: form.type === val ? `2px solid ${color}` : '2px solid #e2e8f0',
                    background: form.type === val ? `${color}15` : '#f8fafc',
                    color: form.type === val ? color : '#64748b',
                  }}>{label}</button>
                ))}
              </div>
            </div>

            {/* Aperçu */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#f8fafc', borderRadius: 10, padding: '10px 14px', border: `2px solid ${form.couleur}33` }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: form.couleur, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{form.icone}</div>
              <span style={{ fontWeight: 600, color: '#1e293b' }}>{form.nom || 'Aperçu...'}</span>
              <span style={{ fontSize: 11, marginLeft: 'auto', background: `${form.couleur}22`, borderRadius: 4, padding: '2px 8px', color: form.couleur }}>
                {form.type === 'entree' ? '↑ Entrée' : form.type === 'sortie' ? '↓ Sortie' : '↕ Les deux'}
              </span>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" disabled={submitting} style={{
                flex: 1, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff',
                border: 'none', borderRadius: 10, padding: '12px', cursor: 'pointer', fontWeight: 700, fontSize: 14,
                opacity: submitting ? 0.7 : 1,
              }}>
                {submitting ? '⏳ Création...' : '✅ Créer la catégorie'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} style={{
                padding: '12px 20px', background: '#f1f5f9', border: '1px solid #e2e8f0',
                borderRadius: 10, cursor: 'pointer', fontSize: 14, color: '#64748b', fontWeight: 600,
              }}>Annuler</button>
            </div>
          </form>
        </div>
      )}

      {/* ── Catégories système ───────────────────────────────────────────── */}
      <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: 20 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 15, color: '#1e293b', fontWeight: 700 }}>
          🏛️ Catégories système <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 400 }}>(disponibles pour tous)</span>
        </h3>
        {loading ? (
          <p style={{ color: '#94a3b8', textAlign: 'center' }}>Chargement...</p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {sysCats.map(cat => (
              <div key={cat.id} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: '#f8fafc', borderRadius: 10, padding: '8px 14px',
                border: `2px solid ${cat.couleur}33`,
              }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: cat.couleur }} />
                <span style={{ fontSize: 16 }}>{cat.icone}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{cat.nom}</span>
                <span style={{ fontSize: 10, color: cat.couleur, background: `${cat.couleur}15`, borderRadius: 4, padding: '1px 6px' }}>
                  {cat.type === 'entree' ? '↑' : cat.type === 'sortie' ? '↓' : '↕'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Mes catégories personnelles ──────────────────────────────────── */}
      <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 15, color: '#1e293b', fontWeight: 700 }}>
            👤 Mes catégories personnelles
          </h3>
          {!peutCreer && (
            <button onClick={() => navigate('/profil')} style={{
              background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff',
              border: 'none', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 700,
            }}>⭐ S'abonner pour créer</button>
          )}
        </div>

        {loading ? (
          <p style={{ color: '#94a3b8', textAlign: 'center' }}>Chargement...</p>
        ) : !peutCreer ? (
          <div style={{ textAlign: 'center', padding: '36px 0', color: '#94a3b8' }}>
            <div style={{ fontSize: 44, marginBottom: 10 }}>🔒</div>
            <p style={{ fontSize: 15, fontWeight: 600, color: '#64748b' }}>Fonctionnalité réservée aux abonnés</p>
            <p style={{ fontSize: 13, margin: '6px 0 16px' }}>
              {enEssai ? 'Abonnez-vous (Standard ou Entreprise) pour créer vos propres catégories.' : 'Renouvelez votre abonnement pour accéder à cette fonctionnalité.'}
            </p>
            <button onClick={() => navigate('/profil')} style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 24px', cursor: 'pointer', fontWeight: 700 }}>
              Voir les plans
            </button>
          </div>
        ) : mesCats.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px 0', color: '#94a3b8' }}>
            <div style={{ fontSize: 44, marginBottom: 10 }}>🏷️</div>
            <p>Aucune catégorie personnelle créée</p>
            <button onClick={() => setShowForm(true)} style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', cursor: 'pointer', fontWeight: 700, marginTop: 8 }}>
              ➕ Créer ma première catégorie
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {mesCats.map(cat => (
              <div key={cat.id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                background: '#f8fafc', borderRadius: 12, padding: '12px 16px',
                border: `2px solid ${cat.couleur}33`,
                transition: 'box-shadow 0.15s',
              }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: cat.couleur, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{cat.icone}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#1e293b' }}>{cat.nom}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                    {cat.type === 'entree' ? '↑ Entrée' : cat.type === 'sortie' ? '↓ Sortie' : '↕ Les deux'}
                  </div>
                </div>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: cat.couleur }} />
                <button onClick={() => supprimer(cat.id)} style={{
                  background: '#fef2f2', color: '#ef4444', border: 'none',
                  borderRadius: 8, padding: '7px 13px', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                }}>🗑 Supprimer</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}



