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
  const planNom  = abonnement?.plan_nom || 'essai';
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
              <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 'auto', background: `${form.couleur}22`, borderRadius: 4, padding: '2px 8px', color: form.couleur }}>
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




/*import React, { useEffect, useState, useCallback } from 'react';
import { categorieService } from '../api/categorieService';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const ICONES = ['🏠', '🍔', '🚗', '💊', '🎮', '📚', '✈️', '💼', '💰', '🛒',
  '🎵', '🏋️', '👕', '💡', '📱', '🐶', '🎁', '🏦', '🍕', '☕',
  '🚌', '⚽', '🎯', '💻', '🌿', '🎨', '🏥', '📦', '💳', '🔧'];

const COULEURS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316',
  '#f59e0b', '#10b981', '#06b6d4', '#3b82f6', '#64748b',
  '#84cc16', '#14b8a6', '#a855f7', '#e11d48', '#0ea5e9',
];

function ModalCategorie({ onClose, onSuccess, categorie = null }) {
  const [nom, setNom] = useState(categorie?.nom || '');
  const [icone, setIcone] = useState(categorie?.icone || '📦');
  const [couleur, setCouleur] = useState(categorie?.couleur || '#6366f1');
  const [type, setType] = useState(categorie?.type || 'les_deux');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nom.trim()) return toast.error('Le nom est obligatoire.');
    setLoading(true);
    try {
      if (categorie) {
        await categorieService.update(categorie.id, { nom, icone, couleur, type });
        toast.success('Catégorie modifiée !');
      } else {
        await categorieService.create({ nom, icone, couleur, type });
        toast.success('Catégorie créée !');
      }
      onSuccess();
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.nom?.[0] || 'Erreur';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const inp = {
    width: '100%', padding: '10px 12px', borderRadius: 8,
    border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none',
    boxSizing: 'border-box', transition: 'border-color 0.2s',
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div style={{
        background: '#fff', borderRadius: 20, padding: 32, width: 460,
        boxShadow: '0 24px 80px rgba(0,0,0,0.22)',
      }} onClick={e => e.stopPropagation()}>
        <h3 style={{ margin: '0 0 20px', color: '#1e293b', fontWeight: 700, fontSize: 18 }}>
          {categorie ? '✏️ Modifier la catégorie' : '➕ Nouvelle catégorie'}
        </h3>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Nom *//*}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 6, textTransform: 'uppercase' }}>
              Nom de la catégorie *
            </label>
            <input value={nom} onChange={e => setNom(e.target.value)}
              placeholder="Ex: Épicerie, Loyer, Salaire..."
              style={inp} required
              onFocus={e => e.target.style.borderColor = '#6366f1'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>

          {/* Type *//*}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 6, textTransform: 'uppercase' }}>
              Type
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { val: 'entree', label: '↑ Entrée', color: '#10b981' },
                { val: 'sortie', label: '↓ Sortie', color: '#ef4444' },
                { val: 'les_deux', label: '⇅ Les deux', color: '#6366f1' },
              ].map(opt => (
                <button key={opt.val} type="button"
                  onClick={() => setType(opt.val)}
                  style={{
                    flex: 1, padding: '8px 4px', borderRadius: 8, border: `2px solid`,
                    borderColor: type === opt.val ? opt.color : '#e2e8f0',
                    background: type === opt.val ? opt.color + '15' : '#fff',
                    color: type === opt.val ? opt.color : '#64748b',
                    cursor: 'pointer', fontSize: 12, fontWeight: 600, transition: 'all 0.15s',
                  }}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Icône *//*}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 6, textTransform: 'uppercase' }}>
              Icône — sélectionnée : <span style={{ fontSize: 18 }}>{icone}</span>
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {ICONES.map(ic => (
                <button key={ic} type="button" onClick={() => setIcone(ic)}
                  style={{
                    width: 38, height: 38, borderRadius: 8, border: `2px solid`,
                    borderColor: icone === ic ? '#6366f1' : '#e2e8f0',
                    background: icone === ic ? '#eef2ff' : '#f8fafc',
                    fontSize: 18, cursor: 'pointer', transition: 'all 0.12s',
                  }}>
                  {ic}
                </button>
              ))}
            </div>
          </div>

          {/* Couleur *//*}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 6, textTransform: 'uppercase' }}>
              Couleur
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
              {COULEURS.map(c => (
                <button key={c} type="button" onClick={() => setCouleur(c)}
                  style={{
                    width: 28, height: 28, borderRadius: '50%', border: `3px solid`,
                    borderColor: couleur === c ? '#1e293b' : 'transparent',
                    background: c, cursor: 'pointer', transition: 'transform 0.12s',
                    transform: couleur === c ? 'scale(1.2)' : 'scale(1)',
                  }} />
              ))}
              {/* Couleur personnalisée *//*}
              <input type="color" value={couleur} onChange={e => setCouleur(e.target.value)}
                style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', cursor: 'pointer', padding: 0 }} />
            </div>
          </div>

          {/* Preview *//*}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: '#f8fafc', borderRadius: 10, padding: '10px 14px',
            border: '1px dashed #e2e8f0',
          }}>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>Aperçu :</span>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '4px 12px', borderRadius: 20,
              background: couleur + '20', color: couleur,
              fontWeight: 600, fontSize: 14,
              border: `1px solid ${couleur}40`,
            }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: couleur, display: 'inline-block' }} />
              {icone} {nom || 'Nom de la catégorie'}
            </span>
          </div>

          {/* Boutons *//*}
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button type="submit" disabled={loading} style={{
              flex: 2, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
              color: '#fff', border: 'none', borderRadius: 10, padding: '12px',
              cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 14,
              opacity: loading ? 0.7 : 1,
            }}>
              {loading ? '⏳ En cours...' : (categorie ? '✅ Modifier' : '✅ Créer')}
            </button>
            <button type="button" onClick={onClose} style={{
              flex: 1, background: '#f1f5f9', border: '1px solid #e2e8f0',
              borderRadius: 10, padding: '12px', cursor: 'pointer', fontSize: 14, color: '#64748b',
            }}>
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Categories() {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOuvert, setModalOuvert] = useState(false);
  const [categorieEdit, setCategorieEdit] = useState(null);
  const [confirmSupprId, setConfirmSupprId] = useState(null);
  const [filtreType, setFiltreType] = useState('');

  const plan = user?.role || 'visiteur';
  const limite = user?.limite_categories || 0;
  const peutCreer = user?.peut_creer_categorie;

  const chargerCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await categorieService.getAll(filtreType);
      setCategories(res.data || []);
    } catch {
      toast.error('Erreur chargement des catégories');
    } finally {
      setLoading(false);
    }
  }, [filtreType]);

  useEffect(() => {
    chargerCategories();
  }, [chargerCategories]);

  const handleSupprimer = async (id) => {
    try {
      await categorieService.delete(id);
      toast.success('Catégorie supprimée.');
      setConfirmSupprId(null);
      chargerCategories();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Erreur lors de la suppression.';
      toast.error(msg);
    }
  };

  const categoriesPerso = categories.filter(c => c.utilisateur !== null);
  const categoriesSysteme = categories.filter(c => c.utilisateur === null);
  const nbPerso = categoriesPerso.length;

  const planLabel = {
    visiteur: 'Visiteur (lecture seule)',
    binome: 'Binôme — Essai gratuit',
    standard: 'Standard',
    entreprise: 'Entreprise',
    employe: 'Employé',
  }[plan] || plan;

  const planColor = {
    visiteur: '#64748b',
    binome: '#f59e0b',
    standard: '#10b981',
    entreprise: '#6366f1',
    employe: '#06b6d4',
  }[plan] || '#64748b';

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '8px 0' }}>
      {/* En-tête *//*}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#1e293b' }}>
            🗂️ Mes Catégories
          </h2>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>
            Organisez vos transactions et budgets avec des catégories personnalisées
          </p>
        </div>

        {peutCreer ? (
          <button
            onClick={() => { setCategorieEdit(null); setModalOuvert(true); }}
            style={{
              background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
              color: '#fff', border: 'none', borderRadius: 12,
              padding: '11px 22px', cursor: 'pointer', fontWeight: 700, fontSize: 14,
              boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(99,102,241,0.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 12px rgba(99,102,241,0.3)'; }}
          >
            ➕ Nouvelle catégorie
          </button>
        ) : (
          <div style={{
            background: '#fef3c7', border: '1px solid #f59e0b',
            borderRadius: 10, padding: '10px 16px', maxWidth: 260,
            color: '#92400e', fontSize: 13,
          }}>
            ⚠️ Votre plan <strong>Visiteur</strong> ne permet pas de créer des catégories. Abonnez-vous pour commencer.
          </div>
        )}
      </div>

      {/* Info plan + quota *//*}
      <div style={{
        display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap',
      }}>
        <div style={{
          flex: 1, minWidth: 200,
          background: '#fff', borderRadius: 14, padding: '16px 20px',
          boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
          border: `2px solid ${planColor}30`,
        }}>
          <p style={{ margin: 0, fontSize: 11, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Votre plan</p>
          <p style={{ margin: '4px 0 0', fontWeight: 800, fontSize: 18, color: planColor }}>
            {planLabel}
          </p>
        </div>

        {peutCreer && (
          <div style={{
            flex: 1, minWidth: 200,
            background: '#fff', borderRadius: 14, padding: '16px 20px',
            boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
          }}>
            <p style={{ margin: 0, fontSize: 11, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>
              Catégories personnelles
            </p>
            <p style={{ margin: '4px 0 0', fontWeight: 800, fontSize: 18, color: nbPerso >= limite ? '#ef4444' : '#1e293b' }}>
              {nbPerso} / {limite}
            </p>
            <div style={{ marginTop: 8, background: '#f1f5f9', borderRadius: 20, height: 6 }}>
              <div style={{
                height: 6, borderRadius: 20,
                width: `${Math.min((nbPerso / limite) * 100, 100)}%`,
                background: nbPerso >= limite ? '#ef4444' : 'linear-gradient(90deg,#6366f1,#8b5cf6)',
                transition: 'width 0.4s',
              }} />
            </div>
          </div>
        )}

        <div style={{
          flex: 1, minWidth: 200,
          background: '#fff', borderRadius: 14, padding: '16px 20px',
          boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
        }}>
          <p style={{ margin: 0, fontSize: 11, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Catégories système</p>
          <p style={{ margin: '4px 0 0', fontWeight: 800, fontSize: 18, color: '#1e293b' }}>
            {categoriesSysteme.length} disponibles
          </p>
        </div>
      </div>

      {/* Filtre type *//*}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[
          { val: '', label: 'Toutes' },
          { val: 'entree', label: '↑ Entrées' },
          { val: 'sortie', label: '↓ Sorties' },
          { val: 'les_deux', label: '⇅ Les deux' },
        ].map(f => (
          <button key={f.val} onClick={() => setFiltreType(f.val)} style={{
            padding: '7px 16px', borderRadius: 8,
            border: `1.5px solid ${filtreType === f.val ? '#6366f1' : '#e2e8f0'}`,
            background: filtreType === f.val ? '#eef2ff' : '#fff',
            color: filtreType === f.val ? '#6366f1' : '#64748b',
            cursor: 'pointer', fontSize: 13, fontWeight: 600,
            transition: 'all 0.15s',
          }}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>⏳</div>
          <p>Chargement des catégories...</p>
        </div>
      ) : (
        <>
          {/* Catégories personnelles *//*}
          <div style={{ marginBottom: 32 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>⭐ Mes catégories personnelles</span>
              <span style={{ background: '#eef2ff', color: '#6366f1', borderRadius: 20, padding: '2px 10px', fontSize: 12 }}>
                {nbPerso}
              </span>
            </h3>

            {nbPerso === 0 ? (
              <div style={{
                textAlign: 'center', padding: '40px 20px',
                background: '#f8fafc', borderRadius: 14,
                border: '2px dashed #e2e8f0', color: '#94a3b8',
              }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>🗂️</div>
                {peutCreer ? (
                  <>
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Aucune catégorie personnelle</p>
                    <p style={{ margin: '6px 0 14px', fontSize: 13 }}>Créez votre première catégorie pour organiser vos finances</p>
                    <button onClick={() => { setCategorieEdit(null); setModalOuvert(true); }}
                      style={{
                        background: '#6366f1', color: '#fff', border: 'none',
                        borderRadius: 10, padding: '10px 22px', cursor: 'pointer', fontWeight: 600, fontSize: 13,
                      }}>
                      ➕ Créer ma première catégorie
                    </button>
                  </>
                ) : (
                  <p style={{ margin: 0, fontSize: 14 }}>Abonnez-vous pour créer vos propres catégories</p>
                )}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                {categoriesPerso.map(cat => (
                  <CategorieCard
                    key={cat.id}
                    cat={cat}
                    perso
                    onEdit={() => { setCategorieEdit(cat); setModalOuvert(true); }}
                    onDelete={() => setConfirmSupprId(cat.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Catégories système *//*}
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>🏛️ Catégories système</span>
              <span style={{ background: '#f1f5f9', color: '#64748b', borderRadius: 20, padding: '2px 10px', fontSize: 12 }}>
                {categoriesSysteme.length}
              </span>
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
              {categoriesSysteme.map(cat => (
                <CategorieCard key={cat.id} cat={cat} />
              ))}
            </div>
          </div>
        </>
      )}

      {/* Modal création/modification *//*}
      {modalOuvert && (
        <ModalCategorie
          categorie={categorieEdit}
          onClose={() => { setModalOuvert(false); setCategorieEdit(null); }}
          onSuccess={() => { setModalOuvert(false); setCategorieEdit(null); chargerCategories(); }}
        />
      )}

      {/* Confirmation suppression *//*}
      {confirmSupprId && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: '#fff', borderRadius: 18, padding: 32, width: 380, textAlign: 'center',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🗑️</div>
            <h3 style={{ margin: '0 0 8px', color: '#1e293b', fontWeight: 700 }}>Supprimer la catégorie ?</h3>
            <p style={{ margin: '0 0 24px', color: '#64748b', fontSize: 14 }}>
              Cette action est irréversible. Les transactions liées garderont une référence à cette catégorie.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => handleSupprimer(confirmSupprId)} style={{
                flex: 1, background: 'linear-gradient(135deg,#ef4444,#dc2626)',
                color: '#fff', border: 'none', borderRadius: 10, padding: '12px',
                cursor: 'pointer', fontWeight: 700,
              }}>
                🗑️ Supprimer
              </button>
              <button onClick={() => setConfirmSupprId(null)} style={{
                flex: 1, background: '#f1f5f9', border: '1px solid #e2e8f0',
                borderRadius: 10, padding: '12px', cursor: 'pointer', color: '#64748b',
              }}>
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CategorieCard({ cat, perso = false, onEdit, onDelete }) {
  const typeColor = { entree: '#10b981', sortie: '#ef4444', les_deux: '#6366f1' }[cat.type] || '#64748b';
  const typeLabel = { entree: '↑ Entrée', sortie: '↓ Sortie', les_deux: '⇅ Les deux' }[cat.type] || cat.type;

  return (
    <div style={{
      background: '#fff', borderRadius: 14, padding: 16,
      boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
      border: `1.5px solid ${cat.couleur}30`,
      transition: 'transform 0.15s, box-shadow 0.15s',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.1)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 1px 8px rgba(0,0,0,0.06)'; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: cat.couleur + '20',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, flexShrink: 0,
        }}>
          {cat.icone || '📦'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {cat.nom}
          </p>
          <span style={{
            display: 'inline-block', marginTop: 2,
            fontSize: 11, fontWeight: 600, color: typeColor,
            background: typeColor + '15', borderRadius: 4, padding: '1px 6px',
          }}>
            {typeLabel}
          </span>
        </div>
      </div>

      {/* Barre couleur *//*}
      <div style={{ height: 3, borderRadius: 10, background: cat.couleur, marginBottom: perso ? 12 : 0 }} />

      {perso && (
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={onEdit} style={{
            flex: 1, background: '#eef2ff', color: '#6366f1', border: 'none',
            borderRadius: 8, padding: '7px', cursor: 'pointer', fontSize: 12, fontWeight: 600,
          }}>
            ✏️ Modifier
          </button>
          <button onClick={onDelete} style={{
            flex: 1, background: '#fef2f2', color: '#ef4444', border: 'none',
            borderRadius: 8, padding: '7px', cursor: 'pointer', fontSize: 12, fontWeight: 600,
          }}>
            🗑️ Supprimer
          </button>
        </div>
      )}
    </div>
  );
}*/