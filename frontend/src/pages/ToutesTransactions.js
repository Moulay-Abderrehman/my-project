import React, { useEffect, useState, useRef } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';

// ── SHARED STYLE CONSTANTS ──
const COLORS = {
  entree: '#10b981',
  sortie: '#ef4444',
  primary: '#6366f1',
  primaryDark: '#4f46e5',
  text: '#0f172a',
  textMuted: '#64748b',
  textLight: '#94a3b8',
  border: '#e2e8f0',
  bg: '#f8fafc',
  white: '#ffffff',
};

// ── COMPOSANT DE MESSAGE BANNIERE ──
function MessageBanner({ type, message, onClose }) {
  if (!message) return null;

  const styles = {
    success: {
      background: '#ecfdf5',
      border: '1px solid #6ee7b7',
      color: '#065f46',
      icon: 'bx-check-circle',
    },
    error: {
      background: '#fef2f2',
      border: '1px solid #fca5a5',
      color: '#991b1b',
      icon: 'bx-error-circle',
    },
    warning: {
      background: '#fffbeb',
      border: '1px solid #fcd34d',
      color: '#92400e',
      icon: 'bx-error',
    },
    info: {
      background: '#eff6ff',
      border: '1px solid #93c5fd',
      color: '#1e40af',
      icon: 'bx-info-circle',
    },
  };

  const style = styles[type] || styles.info;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      padding: '12px 16px',
      borderRadius: 12,
      background: style.background,
      border: `1px solid ${style.border}`,
      marginBottom: 16,
      animation: 'fadeUp 0.3s cubic-bezier(.16,1,.3,1) both',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <i className={`bx ${style.icon}`} style={{ fontSize: 20, color: style.color }} />
        <span style={{ fontSize: 13, color: style.color, fontWeight: 500 }}>
          {message}
        </span>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: style.color,
            fontSize: 18,
            padding: '0 4px',
            opacity: 0.6,
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '1'}
          onMouseLeave={e => e.currentTarget.style.opacity = '0.6'}
        >
          <i className='bx bx-x' />
        </button>
      )}
    </div>
  );
}

// ── COMPOSANT BADGE TYPE ──
function TypeBadge({ type }) {
  const isEntree = type === 'entree';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700,
      background: isEntree ? '#ecfdf5' : '#fef2f2',
      color: isEntree ? COLORS.entree : COLORS.sortie,
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <i className={isEntree ? 'bx bx-trending-up' : 'bx bx-trending-down'} style={{ fontSize: 12 }} />
      {isEntree ? 'Entrée' : 'Sortie'}
    </span>
  );
}

// ── MODAL EXPORT PDF ──
function ExportPDFModal({ transactions, onClose, isMobile, userEmail, userProfileImage, onLogoChange }) {
  const [option, setOption] = useState('');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [toutesLesDates, setToutesLesDates] = useState(false);
  const [employeId, setEmployeId] = useState('');
  const [employes, setEmployes] = useState([]);
  const [generating, setGenerating] = useState(false);
  // const [customLogo, setCustomLogo] = useState(null); // ← COMMENTÉ : Logo personnalisé désactivé
  const [entrepriseEmail, setEntrepriseEmail] = useState(userEmail || 'contact@financeapp.com');
  // const fileInputRef = useRef(null); // ← COMMENTÉ : Référence du fichier désactivée

  useEffect(() => {
    const ids = {};
    transactions.forEach(t => {
      if (t.user && !ids[t.user]) {
        ids[t.user] = {
          nom: t.user_nom || t.user_email || `Employé #${t.user}`,
          email: t.user_email || ''
        };
      }
    });
    setEmployes(Object.entries(ids).map(([id, data]) => ({ id, nom: data.nom, email: data.email })));
  }, [transactions]);

  // ── FONCTION DE CHANGEMENT DE LOGO COMMENTÉE ──
  /*
  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCustomLogo(event.target.result);
        if (onLogoChange) onLogoChange(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };
  */

  const filtrerTransactions = () => {
    let result = [...transactions];
    if (option === '1') {
      result = result.filter(t => t.type === 'entree');
    } else if (option === '2') {
      result = result.filter(t => t.type === 'sortie');
    } else if (option === '4') {
      if (employeId) result = result.filter(t => String(t.user) === String(employeId));
    }
    if (!toutesLesDates && dateDebut && dateFin) {
      const debut = new Date(dateDebut);
      const fin = new Date(dateFin);
      fin.setHours(23, 59, 59, 999);
      result = result.filter(t => {
        const d = new Date(t.date_creation);
        return d >= debut && d <= fin;
      });
    }
    return result;
  };

  const generatePDF = () => {
    if (!option) return;
    if (option === '4' && !employeId) return;
    if (!toutesLesDates && (!dateDebut || !dateFin)) return;

    setGenerating(true);
    const data = filtrerTransactions();

    const totalEntrees = data.filter(t => t.type === 'entree').reduce((s, t) => s + parseFloat(t.montant || 0), 0);
    const totalSorties = data.filter(t => t.type === 'sortie').reduce((s, t) => s + parseFloat(t.montant || 0), 0);
    const soldeFinal = totalEntrees - totalSorties;

    const selectedEmploye = employes.find(e => String(e.id) === String(employeId));
    const finalEmployeEmail = option === '4' && selectedEmploye ? selectedEmploye.email : '';

    const optionLabels = {
      '1': 'Rapport — Transactions Entrées',
      '2': 'Rapport — Transactions Sorties',
      '3': 'Rapport — Toutes les Transactions',
      '4': `Rapport — Transactions de ${selectedEmploye?.nom || 'Employé'}`,
    };

    const periodeLabel = toutesLesDates
      ? 'Toutes les dates'
      : `Du ${new Date(dateDebut).toLocaleDateString('fr-FR')} au ${new Date(dateFin).toLocaleDateString('fr-FR')}`;

    const generatedAt = `${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })} à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;

    // ── LOGO SIMPLIFIÉ FIXE POUR LE PDF (sans personnalisation) ──
    // const logoHTML = (customLogo || userProfileImage)
    //   ? `<img src="${customLogo || userProfileImage}" style="height:52px;width:auto;max-width:150px;object-fit:contain;border-radius:10px;" alt="Logo" />`
    //   : `<div style="display:flex;align-items:center;gap:12px;"> ... </div>`;
    
    // Logo fixe sans personnalisation
    const logoHTML = `<div style="display:flex;align-items:center;gap:12px;">
        <div style="width:48px;height:48px;background:linear-gradient(135deg, #0c2e7c, #1e4db7, #3b82f6);border-radius:14px;display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 4px 15px rgba(59,130,246,0.4);">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 13L8 8L13 13L21 5" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M21 12V19H3V5H12" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="18" cy="8" r="2" stroke="#ffffff" stroke-width="1.5"/>
            <path d="M8 11L8 16" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-dasharray="2 2"/>
          </svg>
        </div>
        <div>
          <div style="font-size:22px;font-weight:900;color:#0f172a;letter-spacing:-0.5px;line-height:1;">Finance<span style="color:#3b82f6;">App</span></div>
          <div style="font-size:11px;color:#64748b;margin-top:3px;display:flex;align-items:center;gap:4px;">
            <i class="bx bx-check-shield" style="font-size:11px;color:#6366f1;"></i>
            Smart Finance
          </div>
        </div>
      </div>`;

    const showSolde = option === '1'
      ? `<tr class="solde-row"><td colspan="5" style="text-align:right;font-weight:700;font-size:12px;padding:13px 16px;color:#0f172a;">Total Entrées</td><td style="font-weight:800;font-size:13px;color:#059669;padding:13px 16px;white-space:nowrap;">+${totalEntrees.toLocaleString('fr-FR')} MRU</td></tr>`
      : option === '2'
        ? `<tr class="solde-row"><td colspan="5" style="text-align:right;font-weight:700;font-size:12px;padding:13px 16px;color:#0f172a;">Total Sorties</td><td style="font-weight:800;font-size:13px;color:#dc2626;padding:13px 16px;white-space:nowrap;">-${totalSorties.toLocaleString('fr-FR')} MRU</td></tr>`
        : `<tr class="solde-row"><td colspan="5" style="text-align:right;font-weight:700;font-size:12px;padding:13px 16px;color:#0f172a;">Solde Net</td><td style="font-weight:800;font-size:13px;color:${soldeFinal >= 0 ? '#059669' : '#dc2626'};padding:13px 16px;white-space:nowrap;">${soldeFinal >= 0 ? '+' : ''}${soldeFinal.toLocaleString('fr-FR')} MRU</td></tr>`;

    const rows = data.map((t, i) => `
      <tr style="background:${i % 2 === 0 ? '#ffffff' : '#f8fafc'};">
        <td style="padding:10px 16px;">
          <span style="display:inline-flex;align-items:center;gap:5px;padding:3px 9px;border-radius:5px;font-size:11px;font-weight:700;background:${t.type === 'entree' ? '#ecfdf5' : '#fef2f2'};color:${t.type === 'entree' ? '#059669' : '#dc2626'};">
            <i class="bx ${t.type === 'entree' ? 'bx-trending-up' : 'bx-trending-down'}" style="font-size:11px;"></i>
            ${t.type === 'entree' ? 'Entrée' : 'Sortie'}
          </span>
        </td>
        <td style="padding:10px 16px;font-size:12px;font-weight:700;color:${t.type === 'entree' ? '#059669' : '#dc2626'};white-space:nowrap;">
          ${t.type === 'entree' ? '+' : '-'}${parseFloat(t.montant || 0).toLocaleString('fr-FR')} MRU
        </td>
        <td style="padding:10px 16px;font-size:11px;color:#374151;">
          <span style="display:inline-flex;align-items:center;gap:4px;">
            <i class="bx bx-category" style="font-size:11px;color:#6366f1;"></i>
            ${t.categorie_detail?.nom || '—'}
          </span>
        </td>
        <td style="padding:10px 16px;font-size:11px;color:#374151;max-width:180px;">${t.description || '—'}</td>
        <td style="padding:10px 16px;font-size:11px;color:#374151;">
          <span style="display:inline-flex;align-items:center;gap:4px;padding:2px 7px;border-radius:4px;background:${t.source === 'budget' ? '#fffbeb' : '#ede9fe'};color:${t.source === 'budget' ? '#92400e' : '#4338ca'};">
            <i class="bx ${t.source === 'budget' ? 'bx-target' : 'bx-edit'}" style="font-size:10px;"></i>
            ${t.source === 'budget' ? 'Budget' : 'Manuel'}
          </span>
        </td>
        <td style="padding:10px 16px;font-size:11px;color:#374151;white-space:nowrap;">
          <span style="display:inline-flex;align-items:center;gap:4px;">
            <i class="bx bx-calendar" style="font-size:11px;color:#6366f1;"></i>
            ${new Date(t.date_creation).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
        </td>
      </tr>
    `).join('');

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>FinanceApp — ${optionLabels[option]}</title>
  <link rel="stylesheet" href="https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: #f1f5f9;
      color: #0f172a;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page {
      max-width: 1050px;
      margin: 28px auto;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 32px rgba(0,0,0,0.10);
    }
    .header {
      background: #ffffff;
      border-bottom: 2px solid #e2e8f0;
      padding: 28px 36px 22px;
    }
    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 24px;
      flex-wrap: wrap;
    }
    .meta-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 12px 18px;
      font-size: 11.5px;
      color: #374151;
      line-height: 1.8;
      min-width: 240px;
    }
    .meta-box .meta-row {
      display: flex;
      align-items: center;
      gap: 7px;
      color: #0f172a;
    }
    .meta-box .meta-row i {
      font-size: 13px;
      color: #6366f1;
      width: 16px;
      text-align: center;
    }
    .meta-box .meta-label {
      font-weight: 700;
      color: #374151;
      min-width: 110px;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .header-divider {
      border: none;
      border-top: 1px solid #e2e8f0;
      margin: 18px 0 14px;
    }
    .report-title {
      font-size: 17px;
      font-weight: 800;
      color: #0f172a;
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 5px;
    }
    .report-title i { font-size: 19px; color: #6366f1; }
    .report-sub {
      font-size: 12px;
      color: #64748b;
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }
    .report-sub span { display: flex; align-items: center; gap: 5px; }
    .report-sub i { font-size: 12px; color: #6366f1; }
    .stats-bar {
      display: flex;
      border-bottom: 1px solid #e2e8f0;
      background: #fafafa;
    }
    .stat-cell {
      flex: 1;
      padding: 16px 22px;
      border-right: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .stat-cell:last-child { border-right: none; }
    .stat-icon-wrap {
      width: 38px; height: 38px;
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .stat-icon-wrap i { font-size: 20px; }
    .stat-lbl {
      font-size: 9.5px; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.5px;
      color: #64748b; margin-bottom: 3px;
    }
    .stat-val {
      font-size: 18px; font-weight: 800; line-height: 1;
    }
    .content { padding: 24px 36px; overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; min-width: 600px; }
    thead tr { background: #f8fafc; }
    th {
      padding: 11px 16px;
      text-align: left;
      font-size: 10px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 2px solid #e2e8f0;
    }
    th i { font-size: 11px; margin-right: 4px; vertical-align: middle; color: #6366f1; }
    tbody tr { border-bottom: 1px solid #f1f5f9; }
    .solde-row { background: #f8fafc !important; border-top: 2px solid #6366f1 !important; }
    td { vertical-align: middle; }
    .empty-row td {
      text-align: center;
      padding: 48px;
      color: #94a3b8;
      font-size: 13px;
    }
    .footer {
      padding: 14px 36px;
      border-top: 1px solid #e2e8f0;
      background: #f8fafc;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 10px;
    }
    .footer-col {
      font-size: 10.5px;
      color: #64748b;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .footer-col i { font-size: 12px; color: #6366f1; }
    .footer-col strong { color: #0f172a; }
    @media print {
      body { background: #fff; }
      .page { margin: 0; border-radius: 0; box-shadow: none; max-width: 100%; }
      .no-print { display: none !important; }
      tr { break-inside: avoid; }
      .stats-bar { break-inside: avoid; }
    }
  </style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="header-top">
      <div class="logo-area">${logoHTML}</div>
      <div class="meta-box">
        <div class="meta-row">
          <i class="bx bx-envelope"></i>
          <span class="meta-label">Email entreprise</span>
          <span style="color:#0f172a;font-weight:600;">${entrepriseEmail}</span>
        </div>
        ${option === '4' && finalEmployeEmail ? `
        <div class="meta-row" style="margin-top:5px;">
          <i class="bx bx-user-circle"></i>
          <span class="meta-label">Email employé</span>
          <span style="color:#0f172a;font-weight:600;">${finalEmployeEmail}</span>
        </div>` : ''}
        <div class="meta-row" style="margin-top:5px;">
          <i class="bx bx-calendar-event"></i>
          <span class="meta-label">Généré le</span>
          <span style="color:#0f172a;font-weight:600;">${generatedAt}</span>
        </div>
        <div class="meta-row" style="margin-top:5px;">
          <i class="bx bx-spreadsheet"></i>
          <span class="meta-label">Transactions</span>
          <span style="color:#6366f1;font-weight:700;">${data.length} enregistrement(s)</span>
        </div>
      </div>
    </div>
    <hr class="header-divider" />
    <div class="report-title">
      <i class="bx bx-file-find"></i>
      ${optionLabels[option]}
    </div>
    <div class="report-sub">
      <span><i class="bx bx-calendar-week"></i> Période : ${periodeLabel}</span>
      ${option === '4' && selectedEmploye ? `<span><i class="bx bx-user"></i> Employé : ${selectedEmploye.nom}</span>` : ''}
    </div>
  </div>
  <div class="stats-bar">
    <div class="stat-cell">
      <div class="stat-icon-wrap" style="background:#ede9fe;">
        <i class="bx bx-list-ul" style="color:#6366f1;"></i>
      </div>
      <div>
        <div class="stat-lbl"><i class="bx bx-grid" style="font-size:9px;"></i> Transactions</div>
        <div class="stat-val" style="color:#0f172a;">${data.length}</div>
      </div>
    </div>
    ${option !== '2' ? `
    <div class="stat-cell">
      <div class="stat-icon-wrap" style="background:#ecfdf5;">
        <i class="bx bx-trending-up" style="color:#059669;"></i>
      </div>
      <div>
        <div class="stat-lbl">Total Entrées</div>
        <div class="stat-val" style="color:#059669;">+${totalEntrees.toLocaleString('fr-FR')} MRU</div>
      </div>
    </div>` : ''}
    ${option !== '1' ? `
    <div class="stat-cell">
      <div class="stat-icon-wrap" style="background:#fef2f2;">
        <i class="bx bx-trending-down" style="color:#dc2626;"></i>
      </div>
      <div>
        <div class="stat-lbl">Total Sorties</div>
        <div class="stat-val" style="color:#dc2626;">-${totalSorties.toLocaleString('fr-FR')} MRU</div>
      </div>
    </div>` : ''}
    ${option === '3' || option === '4' ? `
    <div class="stat-cell">
      <div class="stat-icon-wrap" style="background:${soldeFinal >= 0 ? '#ecfdf5' : '#fef2f2'};">
        <i class="bx bx-calculator" style="color:${soldeFinal >= 0 ? '#059669' : '#dc2626'};"></i>
      </div>
      <div>
        <div class="stat-lbl">Solde Net</div>
        <div class="stat-val" style="color:${soldeFinal >= 0 ? '#059669' : '#dc2626'};">${soldeFinal >= 0 ? '+' : ''}${soldeFinal.toLocaleString('fr-FR')} MRU</div>
      </div>
    </div>` : ''}
  </div>
  <div class="content">
    <table>
      <thead>
        <tr>
          <th><i class="bx bx-transfer"></i>Type</th>
          <th><i class="bx bx-money"></i>Montant</th>
          <th><i class="bx bx-category"></i>Catégorie</th>
          <th><i class="bx bx-text"></i>Description</th>
          <th><i class="bx bx-source"></i>Source</th>
          <th><i class="bx bx-calendar"></i>Date</th>
        </tr>
      </thead>
      <tbody>
        ${data.length > 0
          ? rows + showSolde
          : `<tr class="empty-row"><td colspan="6"><i class="bx bx-folder-open" style="font-size:28px;display:block;margin-bottom:8px;color:#94a3b8;"></i>Aucune transaction trouvée</td></tr>`
        }
      </tbody>
    </table>
  </div>
  <div class="footer">
    <div class="footer-col">
      <i class="bx bx-lock-alt"></i>
      <span>Document <strong>confidentiel</strong> — FinanceApp</span>
    </div>
    <div class="footer-col">
      <i class="bx bx-file-blank"></i>
      <span>${data.length} transaction(s) • </span>
      <i class="bx bx-calendar"></i>
      <span>${new Date().toLocaleDateString('fr-FR')}</span>
    </div>
  </div>
</div>
<script>
  window.onload = () => {
    setTimeout(() => { window.print(); }, 350);
  };
</script>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    if (!win) {
      const a = document.createElement('a');
      a.href = url;
      a.download = `financeapp-rapport-${Date.now()}.html`;
      a.click();
    }
    setGenerating(false);
    onClose();
  };

  const canGenerate = option &&
    (toutesLesDates || (dateDebut && dateFin)) &&
    (option !== '4' || employeId);

  const inputStyle = {
    width: '100%',
    padding: isMobile ? '9px 12px' : '10px 14px',
    borderRadius: 8,
    border: `1.5px solid ${COLORS.border}`,
    background: COLORS.bg,
    fontSize: isMobile ? 12 : 13,
    color: COLORS.text,
    fontFamily: "'DM Sans', sans-serif",
    outline: 'none',
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(15,23,42,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: isMobile ? 12 : 24,
      overflowY: 'auto',
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: COLORS.white,
        borderRadius: 16,
        width: '100%',
        maxWidth: 520,
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
        padding: isMobile ? 20 : 32,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: 'linear-gradient(135deg, #ede9fe, #c4b5fd)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <i className='bx bx-file-pdf' style={{ fontSize: 20, color: COLORS.primary }} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: COLORS.text, fontFamily: "'Outfit', sans-serif" }}>
                Export PDF
              </h3>
              <p style={{ margin: 0, fontSize: 11, color: COLORS.textMuted }}>Abonnement Entreprise</p>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: COLORS.bg, border: `1.5px solid ${COLORS.border}`,
            borderRadius: 8, width: 32, height: 32, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: COLORS.textMuted,
          }}>
            <i className='bx bx-x' style={{ fontSize: 18 }} />
          </button>
        </div>

        {/* ── SECTION LOGO PERSONNALISÉ COMMENTÉE ── */}
        {/*
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 10 }}>
            <i className='bx bx-image' style={{ marginRight: 4 }} /> Logo personnalisé
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            {(customLogo || userProfileImage) && (
              <div style={{
                width: 50, height: 50, borderRadius: 8,
                background: COLORS.bg, border: `1px solid ${COLORS.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden'
              }}>
                <img src={customLogo || userProfileImage} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                padding: '8px 16px', borderRadius: 8,
                border: `1.5px solid ${COLORS.primary}`,
                background: 'transparent',
                cursor: 'pointer', fontSize: 12, fontWeight: 600,
                color: COLORS.primary, fontFamily: "'DM Sans', sans-serif",
              }}
            >
              <i className='bx bx-image-add' style={{ marginRight: 6 }} />
              {customLogo ? 'Changer le logo' : 'Ajouter un logo'}
            </button>
            {customLogo && (
              <button
                onClick={() => setCustomLogo(null)}
                style={{
                  padding: '8px 16px', borderRadius: 8,
                  border: `1.5px solid ${COLORS.border}`,
                  background: 'transparent', cursor: 'pointer',
                  fontSize: 12, fontWeight: 600, color: COLORS.textMuted,
                }}
              >
                <i className='bx bx-trash' style={{ marginRight: 6 }} />
                Supprimer
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoChange}
              style={{ display: 'none' }}
            />
          </div>
        </div>
        */}

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 8 }}>
            <i className='bx bx-envelope' style={{ marginRight: 4 }} /> Email de l'entreprise
          </label>
          <input
            type="email"
            value={entrepriseEmail}
            onChange={e => setEntrepriseEmail(e.target.value)}
            placeholder="contact@entreprise.com"
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 10 }}>
            <i className='bx bx-filter' style={{ marginRight: 4 }} /> Type d'export
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { val: '1', icon: 'bx-trending-up', label: 'Entrées uniquement', desc: 'Toutes les transactions de type entrée', color: COLORS.entree },
              { val: '2', icon: 'bx-trending-down', label: 'Sorties uniquement', desc: 'Toutes les transactions de type sortie', color: COLORS.sortie },
              { val: '3', icon: 'bx-transfer-alt', label: 'Toutes les transactions', desc: 'Entrées + Sorties combinées', color: COLORS.primary },
              { val: '4', icon: 'bx-user', label: 'Par employé', desc: 'Transactions d\'un employé spécifique', color: '#8b5cf6' },
            ].map(opt => (
              <div
                key={opt.val}
                onClick={() => setOption(opt.val)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px',
                  borderRadius: 10,
                  border: `2px solid ${option === opt.val ? opt.color : COLORS.border}`,
                  background: option === opt.val ? `${opt.color}08` : COLORS.white,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                  background: option === opt.val ? `${opt.color}18` : COLORS.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <i className={`bx ${opt.icon}`} style={{ fontSize: 18, color: option === opt.val ? opt.color : COLORS.textLight }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: option === opt.val ? opt.color : COLORS.text }}>{opt.label}</div>
                  <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 1 }}>{opt.desc}</div>
                </div>
                <div style={{
                  width: 18, height: 18, borderRadius: '50%',
                  border: `2px solid ${option === opt.val ? opt.color : COLORS.border}`,
                  background: option === opt.val ? opt.color : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {option === opt.val && <i className='bx bx-check' style={{ fontSize: 12, color: '#fff' }} />}
                </div>
              </div>
            ))}
          </div>
        </div>

        {option === '4' && (
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 8 }}>
              <i className='bx bx-user' style={{ marginRight: 4 }} /> Sélectionner un employé
            </label>
            <div style={{ position: 'relative' }}>
              <i className='bx bx-user' style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: COLORS.textLight, pointerEvents: 'none' }} />
              <select
                value={employeId}
                onChange={e => setEmployeId(e.target.value)}
                style={{ ...inputStyle, paddingLeft: 36, appearance: 'none', paddingRight: 36 }}
              >
                <option value="">-- Choisir un employé --</option>
                {employes.map(e => (
                  <option key={e.id} value={e.id}>
                    {e.nom} {e.email ? `(${e.email})` : ''}
                  </option>
                ))}
              </select>
              <i className='bx bx-chevron-down' style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 15, color: COLORS.textLight, pointerEvents: 'none' }} />
            </div>
            {employes.length === 0 && (
              <p style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 6 }}>
                <i className='bx bx-info-circle' style={{ fontSize: 12, marginRight: 4 }} />
                Aucun employé trouvé dans les transactions actuelles.
              </p>
            )}
            {employeId && employes.find(e => String(e.id) === String(employeId))?.email && (
              <p style={{ fontSize: 11, color: COLORS.primary, marginTop: 6 }}>
                <i className='bx bx-envelope' style={{ fontSize: 12, marginRight: 4 }} />
                Email employé : {employes.find(e => String(e.id) === String(employeId))?.email}
              </p>
            )}
          </div>
        )}

        {option && (
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 10 }}>
              <i className='bx bx-calendar' style={{ marginRight: 4 }} /> Période
            </label>
            <label style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 14px', borderRadius: 10,
              border: `2px solid ${toutesLesDates ? COLORS.primary : COLORS.border}`,
              background: toutesLesDates ? '#ede9fe' : COLORS.white,
              cursor: 'pointer', marginBottom: 12, transition: 'all 0.15s',
            }}>
              <input
                type="checkbox"
                checked={toutesLesDates}
                onChange={e => setToutesLesDates(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: COLORS.primary, cursor: 'pointer' }}
              />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: toutesLesDates ? COLORS.primary : COLORS.text }}>Toutes les dates</div>
                <div style={{ fontSize: 11, color: COLORS.textMuted }}>Inclure toutes les transactions sans filtre de date</div>
              </div>
            </label>

            {!toutesLesDates && (
              <div style={{ display: 'flex', gap: 10, flexDirection: isMobile ? 'column' : 'row' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: COLORS.textMuted, display: 'block', marginBottom: 6 }}>
                    Date début
                  </label>
                  <input
                    type="date"
                    value={dateDebut}
                    onChange={e => setDateDebut(e.target.value)}
                    style={inputStyle}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: COLORS.textMuted, display: 'block', marginBottom: 6 }}>
                    Date fin
                  </label>
                  <input
                    type="date"
                    value={dateFin}
                    onChange={e => setDateFin(e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {canGenerate && (
          <div style={{
            background: 'linear-gradient(135deg, #eff6ff, #e0e7ff)',
            borderRadius: 10, padding: '12px 16px', marginBottom: 20,
            borderLeft: `3px solid ${COLORS.primary}`,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <i className='bx bx-info-circle' style={{ fontSize: 18, color: COLORS.primary, flexShrink: 0 }} />
            <div style={{ fontSize: 12, color: '#1e40af', lineHeight: 1.5 }}>
              <strong>{filtrerTransactions().length}</strong> transaction(s) seront exportées
              {!toutesLesDates && dateDebut && dateFin && (
                <span> du <strong>{new Date(dateDebut).toLocaleDateString('fr-FR')}</strong> au <strong>{new Date(dateFin).toLocaleDateString('fr-FR')}</strong></span>
              )}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, flexDirection: isMobile ? 'column' : 'row' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '12px', borderRadius: 10,
              border: `1.5px solid ${COLORS.border}`,
              background: COLORS.bg, cursor: 'pointer',
              fontSize: 13, fontWeight: 600, color: COLORS.textMuted,
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            <i className='bx bx-x' style={{ marginRight: 4 }} /> Annuler
          </button>
          <button
            onClick={generatePDF}
            disabled={!canGenerate || generating}
            style={{
              flex: 2, padding: '12px', borderRadius: 10, border: 'none',
              background: canGenerate
                ? 'linear-gradient(135deg, #6366f1, #4f46e5)'
                : COLORS.border,
              cursor: canGenerate ? 'pointer' : 'not-allowed',
              fontSize: 13, fontWeight: 700, color: canGenerate ? '#fff' : COLORS.textLight,
              fontFamily: "'DM Sans', sans-serif",
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'all 0.2s',
            }}
          >
            {generating ? (
              <>
                <div style={{
                  width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)',
                  borderTopColor: '#fff', borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }} />
                Génération...
              </>
            ) : (
              <>
                <i className='bx bx-file-pdf' style={{ fontSize: 16 }} />
                Générer le PDF
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── PAGE PRINCIPALE ───────────────────────────────────────────────────────────
export default function ToutesTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtreType, setFiltreType] = useState('');
  const [filtreSource, setFiltreSource] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filtrePeriode, setFiltrePeriode] = useState('');
  const [showExportModal, setShowExportModal] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userProfileImage, setUserProfileImage] = useState(null);
  const [subscriptionPlan, setSubscriptionPlan] = useState(null);
  const navigate = useNavigate();

  // ✅ État pour les messages
  const [pageMessage, setPageMessage] = useState(null);
  const [abonnementExpire, setAbonnementExpire] = useState(false);
  const [abonnementCharge, setAbonnementCharge] = useState(true);

  // ✅ Vérifier l'abonnement
  const verifierAbonnement = async () => {
    try {
      const response = await api.get('/abonnements/statut/');
      setAbonnementExpire(!response.data.est_actif);
      setSubscriptionPlan(response.data.plan || '');
    } catch (error) {
      console.error('Erreur vérification abonnement:', error);
      setAbonnementExpire(true);
      setSubscriptionPlan('');
    } finally {
      setAbonnementCharge(false);
    }
  };

  useEffect(() => {
    verifierAbonnement();
  }, []);

  useEffect(() => {
    setLoading(true);
    // Charger les transactions
    api.get('/transactions/toutes/')
      .then(res => {
        setTransactions(res.data.results || res.data);
        setPageMessage(null);
      })
      .catch(err => {
        const status = err.response?.status;
        const errorData = err.response?.data;
        
        if (status === 401) {
          setPageMessage({ 
            type: 'error', 
            text: 'Session expirée. Veuillez vous reconnecter.' 
          });
          setTimeout(() => {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user');
            window.location.href = '/connexion';
          }, 2000);
          return;
        }
        
        if (status === 403 && errorData?.error === 'abonnement_expire') {
          setAbonnementExpire(true);
          setPageMessage({ 
            type: 'error', 
            text: 'Votre abonnement a expiré. Veuillez le renouveler pour accéder à toutes les transactions.' 
          });
          return;
        }
        
        setPageMessage({ 
          type: 'error', 
          text: 'Erreur lors du chargement des transactions. Veuillez réessayer.' 
        });
      })
      .finally(() => setLoading(false));

    // Charger les infos utilisateur
    api.get('/comptes/profil/')
      .then(res => {
        if (res.data) {
          setUserEmail(res.data.email || '');
          setUserProfileImage(res.data.profile_image || null);
        }
      })
      .catch(err => {
        console.error('Erreur chargement profil:', err);
        if (err.response?.status === 401) {
          setPageMessage({ 
            type: 'error', 
            text: 'Session expirée. Veuillez vous reconnecter.' 
          });
          setTimeout(() => {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user');
            window.location.href = '/connexion';
          }, 2000);
        }
      });
  }, []);

  const isEntreprise = subscriptionPlan === 'entreprise';

  // Fonction pour filtrer par période
  const filtrerParPeriode = (transactions, periode) => {
    if (!periode) return transactions;

    const maintenant = new Date();
    const debut = new Date();

    switch (periode) {
      case 'ce-mois':
        debut.setDate(1);
        debut.setHours(0, 0, 0, 0);
        break;
      case '7-jours':
        debut.setDate(maintenant.getDate() - 7);
        debut.setHours(0, 0, 0, 0);
        break;
      case '30-jours':
        debut.setDate(maintenant.getDate() - 30);
        debut.setHours(0, 0, 0, 0);
        break;
      case 'grosses-revenus':
        return transactions.filter(t => t.type === 'entree' && parseFloat(t.montant) > 25000);
      case 'grosses-depenses':
        return transactions.filter(t => t.type === 'sortie' && parseFloat(t.montant) > 25000);
      default:
        return transactions;
    }

    return transactions.filter(t => {
      const dateTrans = new Date(t.date_creation);
      return dateTrans >= debut && dateTrans <= maintenant;
    });
  };

  // Application des filtres de base
  const filtreesBase = transactions.filter(t => {
    if (filtreType && t.type !== filtreType) return false;
    if (filtreSource && t.source !== filtreSource) return false;
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchDescription = t.description?.toLowerCase().includes(searchLower);
      const matchCategorie = t.categorie_detail?.nom?.toLowerCase().includes(searchLower);
      if (!matchDescription && !matchCategorie) return false;
    }
    return true;
  });

  // Application du filtre de période
  const filtrees = filtrerParPeriode(filtreesBase, filtrePeriode);

  const totalEntrees = filtrees.filter(t => t.type === 'entree').reduce((s, t) => s + parseFloat(t.montant), 0);
  const totalSorties = filtrees.filter(t => t.type === 'sortie').reduce((s, t) => s + parseFloat(t.montant), 0);

  // Détection mobile pour ajustements supplémentaires
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 700);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 700);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fonction handleLogoChange commentée car plus utilisée
  // const handleLogoChange = (newLogo) => {
  //   setUserProfileImage(newLogo);
  // };

  return (
    <div style={{
      maxWidth: 1200,
      margin: '0 auto',
      padding: isMobile ? '12px 12px' : '8px 16px',
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif"
    }}>

      <link rel="stylesheet" href="https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css" />
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Outfit:wght@600;700;800&display=swap" rel="stylesheet" />

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .stat-card { animation: fadeUp 0.4s cubic-bezier(.16,1,.3,1) both; }
        .stat-card:nth-child(2) { animation-delay: 0.07s; }
        .stat-card:nth-child(3) { animation-delay: 0.14s; }
        .tx-row { transition: background 0.12s; }
        .tx-row:hover { background: #f5f3ff !important; }
        
        @media (max-width: 700px) {
          .tx-table-wrap { display: none !important; }
          .tx-cards-wrap { display: flex !important; }
          .filters-row { flex-direction: column !important; gap: 8px !important; }
          .filters-row > div, .filters-row > button { width: 100% !important; min-width: unset !important; }
          .stats-row { flex-direction: column !important; gap: 10px !important; }
        }
        @media (min-width: 701px) {
          .tx-cards-wrap { display: none !important; }
          .tx-table-wrap { display: block !important; }
        }
      `}</style>

      {/* ── MESSAGE PAGE ── */}
      <MessageBanner 
        type={pageMessage?.type} 
        message={pageMessage?.text} 
        onClose={() => setPageMessage(null)}
      />

      {/* ── BOUTON RETOUR ── */}
      <div style={{
        marginBottom: isMobile ? 16 : 20,
      }}>
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            background: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)',
            border: 'none',
            borderRadius: 10,
            padding: isMobile ? '8px 14px' : '10px 20px',
            cursor: 'pointer',
            fontSize: isMobile ? 12 : 13,
            fontWeight: 600,
            color: '#475569',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            transition: 'all 0.2s',
            fontFamily: "'DM Sans', sans-serif",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateX(-4px)';
            e.currentTarget.style.background = 'linear-gradient(135deg, #e2e8f0, #cbd5e1)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateX(0)';
            e.currentTarget.style.background = 'linear-gradient(135deg, #f1f5f9, #e2e8f0)';
          }}
        >
          <i className='bx bx-arrow-back' style={{ fontSize: isMobile ? 16 : 18 }} />
          Retour
        </button>
      </div>

      {/* ── EN-TÊTE ── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'flex-start' : 'center',
        marginBottom: isMobile ? 16 : 22,
        gap: isMobile ? 12 : 12,
        flexDirection: isMobile ? 'column' : 'row',
        flexWrap: 'wrap'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
            <div style={{
              width: isMobile ? 28 : 36,
              height: isMobile ? 28 : 36,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #ede9fe, #c4b5fd)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <i className='bx bx-transfer-alt' style={{ fontSize: isMobile ? 16 : 19, color: COLORS.primary }} />
            </div>
            <h2 style={{
              margin: 0,
              fontSize: isMobile ? 18 : 22,
              fontWeight: 800,
              color: COLORS.text,
              fontFamily: "'Outfit', sans-serif",
              letterSpacing: '-0.3px',
            }}>
              Toutes les transactions
            </h2>
            <span style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: COLORS.white,
              borderRadius: 16,
              padding: '2px 8px',
              fontSize: isMobile ? 10 : 12,
              fontWeight: 700
            }}>
              {filtrees.length}
            </span>
          </div>
          <p style={{ margin: 0, color: COLORS.textMuted, fontSize: isMobile ? 11 : 13 }}>
            Archive complète — transactions masquées et budgets inclus
          </p>
        </div>

        {/* ── BOUTON EXPORT PDF ── */}
        <div style={{ position: 'relative', alignSelf: isMobile ? 'stretch' : 'auto' }}>
          <button
            onClick={() => {
              if (abonnementExpire) {
                setPageMessage({ 
                  type: 'error', 
                  text: 'Votre abonnement a expiré. Veuillez le renouveler pour exporter en PDF.' 
                });
                return;
              }
              if (isEntreprise) {
                setShowExportModal(true);
              } else {
                setPageMessage({ 
                  type: 'warning', 
                  text: 'L\'export PDF est réservé à l\'abonnement Entreprise. Passez à l\'offre Entreprise pour y accéder.' 
                });
              }
            }}
            disabled={!isEntreprise && !abonnementExpire}
            title={!isEntreprise && !abonnementExpire ? "Réservé à l'abonnement Entreprise" : abonnementExpire ? "Votre abonnement a expiré" : undefined}
            style={{
              background: (isEntreprise && !abonnementExpire)
                ? 'linear-gradient(135deg, #6366f1, #4f46e5)'
                : '#e2e8f0',
              border: 'none',
              borderRadius: 10,
              padding: isMobile ? '10px 16px' : '11px 22px',
              cursor: (isEntreprise && !abonnementExpire) ? 'pointer' : 'not-allowed',
              fontSize: isMobile ? 12 : 13,
              fontWeight: 700,
              color: (isEntreprise && !abonnementExpire) ? '#fff' : '#94a3b8',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              transition: 'all 0.2s',
              fontFamily: "'DM Sans', sans-serif",
              boxShadow: (isEntreprise && !abonnementExpire) ? '0 4px 14px rgba(99,102,241,0.35)' : 'none',
              whiteSpace: 'nowrap',
              width: isMobile ? '100%' : 'auto',
              justifyContent: 'center',
              opacity: (isEntreprise && !abonnementExpire) ? 1 : 0.7,
            }}
            onMouseEnter={e => {
              if (isEntreprise && !abonnementExpire) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(99,102,241,0.45)';
              }
            }}
            onMouseLeave={e => {
              if (isEntreprise && !abonnementExpire) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 14px rgba(99,102,241,0.35)';
              }
            }}
          >
            <i className={`bx ${(isEntreprise && !abonnementExpire) ? 'bx-file-pdf' : 'bx-lock-alt'}`} style={{ fontSize: isMobile ? 16 : 18 }} />
            Exporter en PDF
            <span style={{
              background: (isEntreprise && !abonnementExpire) ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.08)',
              borderRadius: 6,
              padding: '1px 6px',
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.3px',
              color: (isEntreprise && !abonnementExpire) ? '#fff' : '#94a3b8',
            }}>
              ENTREPRISE
            </span>
          </button>
        </div>
      </div>

      {/* ── BANNIÈRE si abonnement non-entreprise ── */}
      {!isEntreprise && subscriptionPlan !== null && !abonnementExpire && (
        <div style={{
          background: 'linear-gradient(135deg, #fefce8, #fef9c3)',
          borderRadius: 12,
          padding: isMobile ? '10px 14px' : '13px 20px',
          marginBottom: isMobile ? 14 : 20,
          borderLeft: '3px solid #eab308',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <i className='bx bx-lock-alt' style={{ fontSize: isMobile ? 16 : 18, color: '#ca8a04', flexShrink: 0 }} />
          <div style={{ fontSize: isMobile ? 11 : 12.5, color: '#713f12', lineHeight: 1.45 }}>
            <strong>Export PDF désactivé</strong> — Cette fonctionnalité est réservée à l'abonnement <strong>Entreprise</strong>.
            Mettez à niveau votre abonnement pour accéder à l'export PDF complet.
          </div>
        </div>
      )}

      {/* ── BANNIÈRE si abonnement expiré ── */}
      {abonnementExpire && (
        <div style={{
          background: 'linear-gradient(135deg, #fef2f2, #fee2e2)',
          borderRadius: 12,
          padding: isMobile ? '10px 14px' : '13px 20px',
          marginBottom: isMobile ? 14 : 20,
          borderLeft: '3px solid #ef4444',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <i className='bx bx-time' style={{ fontSize: isMobile ? 16 : 18, color: '#dc2626', flexShrink: 0 }} />
          <div style={{ fontSize: isMobile ? 11 : 12.5, color: '#991b1b', lineHeight: 1.45 }}>
            <strong>Abonnement expiré</strong> — Votre abonnement a expiré. Veuillez le renouveler pour continuer à utiliser toutes les fonctionnalités.
          </div>
        </div>
      )}

      {/* ── INFO BANNER ── */}
      <div style={{
        background: 'linear-gradient(135deg, #eff6ff, #e0e7ff)',
        borderRadius: 12,
        padding: isMobile ? '10px 12px' : '14px 20px',
        marginBottom: isMobile ? 16 : 24,
        borderLeft: `3px solid ${COLORS.primary}`,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
      }}>
        <i className='bx bx-info-circle' style={{ fontSize: isMobile ? 16 : 20, color: COLORS.primary, marginTop: 2 }} />
        <span style={{ fontSize: isMobile ? 11 : 13, color: '#1e40af', lineHeight: 1.4 }}>
          <strong>Info :</strong> Toutes les transactions sans exception — transactions masquées et budgets inclus.
        </span>
      </div>

      {/* ── STATS CARDS ── */}
      <div className="stats-row" style={{
        display: 'flex',
        gap: isMobile ? 10 : 14,
        marginBottom: isMobile ? 16 : 22,
        flexWrap: 'wrap'
      }}>
        {[
          { label: 'Total', val: filtrees.length, suffix: '', color: COLORS.primary, bg: '#ede9fe', icon: 'bx-grid-alt' },
          { label: 'Entrées', val: totalEntrees, suffix: ' MRU', color: COLORS.entree, bg: '#ecfdf5', icon: 'bx-trending-up' },
          { label: 'Sorties', val: totalSorties, suffix: ' MRU', color: COLORS.sortie, bg: '#fef2f2', icon: 'bx-trending-down' },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{
            flex: 1, minWidth: isMobile ? 'auto' : 180,
            background: COLORS.white,
            borderRadius: 12,
            padding: isMobile ? '10px 12px' : '16px 18px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            border: `1px solid ${s.color}22`,
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? 10 : 14,
          }}>
            <div style={{
              width: isMobile ? 32 : 42,
              height: isMobile ? 32 : 42,
              borderRadius: 9,
              background: s.bg,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <i className={`bx ${s.icon}`} style={{ fontSize: isMobile ? 16 : 20, color: s.color }} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{
                margin: 0,
                fontSize: isMobile ? 9 : 10.5,
                fontWeight: 700,
                color: COLORS.textLight,
                textTransform: 'uppercase',
                letterSpacing: '0.3px'
              }}>
                {s.label}
              </p>
              <p style={{
                margin: '2px 0 0',
                fontWeight: 800,
                fontSize: isMobile ? 14 : 17,
                color: s.color,
                fontFamily: "'Outfit', sans-serif",
                wordBreak: 'break-word'
              }}>
                {s.val.toLocaleString('fr-FR')}{s.suffix}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── FILTRES RAPIDES ── */}
      <div style={{
        display: 'flex',
        gap: 8,
        marginBottom: 16,
        flexWrap: 'wrap'
      }}>
        {[
          { value: '', label: 'Toutes', icon: 'bx-calendar-week' },
          { value: 'ce-mois', label: 'Ce mois-ci', icon: 'bx-calendar' },
          { value: '7-jours', label: '7 derniers jours', icon: 'bx-time' },
          { value: '30-jours', label: '30 derniers jours', icon: 'bx-calendar-check' },
          { value: 'grosses-revenus', label: 'Grosses revenus', icon: 'bx-trending-up' },
          { value: 'grosses-depenses', label: 'Grosses dépenses', icon: 'bx-trending-down' }
        ].map(f => (
          <button
            key={f.value}
            onClick={() => setFiltrePeriode(f.value)}
            style={{
              background: filtrePeriode === f.value ? `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})` : COLORS.white,
              border: `1.5px solid ${filtrePeriode === f.value ? COLORS.primary : COLORS.border}`,
              borderRadius: 20,
              padding: isMobile ? '6px 12px' : '8px 16px',
              cursor: 'pointer',
              fontSize: isMobile ? 11 : 12,
              fontWeight: 600,
              color: filtrePeriode === f.value ? COLORS.white : COLORS.textMuted,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              fontFamily: "'DM Sans', sans-serif",
              transition: 'all 0.2s'
            }}
          >
            <i className={`bx ${f.icon}`} style={{ fontSize: isMobile ? 12 : 13 }} />
            {f.label}
          </button>
        ))}
      </div>

      {/* ── BARRE DE RECHERCHE ── */}
      <div style={{ marginBottom: 16 }}>
        <div style={{
          position: 'relative',
          background: COLORS.white,
          borderRadius: 12,
          border: `1.5px solid ${COLORS.border}`,
          transition: 'all 0.2s'
        }}>
          <i className='bx bx-search' style={{
            position: 'absolute',
            left: 14,
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: isMobile ? 16 : 18,
            color: COLORS.textLight
          }} />
          <input
            type="text"
            placeholder="Rechercher par description ou catégorie..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: isMobile ? '12px 16px 12px 42px' : '14px 18px 14px 46px',
              fontSize: isMobile ? 12 : 13,
              border: 'none',
              borderRadius: 12,
              outline: 'none',
              fontFamily: "'DM Sans', sans-serif",
              background: 'transparent'
            }}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              style={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: COLORS.textLight,
                fontSize: 16
              }}
            >
              <i className='bx bx-x' />
            </button>
          )}
        </div>
      </div>

      {/* ── FILTRES ── */}
      <div className="filters-row" style={{
        display: 'flex',
        gap: isMobile ? 8 : 10,
        marginBottom: isMobile ? 14 : 18,
        flexWrap: 'wrap',
        alignItems: 'flex-end',
        background: COLORS.white,
        padding: isMobile ? '12px' : '16px 18px',
        borderRadius: 12,
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        border: `1px solid ${COLORS.border}`,
      }}>
        <div style={{ flex: 1, minWidth: isMobile ? 'auto' : 140 }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: isMobile ? 9 : 10.5,
            color: COLORS.textMuted,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: 4,
          }}>
            <i className='bx bx-filter' style={{ fontSize: isMobile ? 10 : 11 }} />
            Type
          </label>
          <div style={{ position: 'relative' }}>
            <i className='bx bx-transfer' style={{
              position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
              fontSize: isMobile ? 13 : 16, color: COLORS.textLight, pointerEvents: 'none',
            }} />
            <select
              value={filtreType}
              onChange={e => setFiltreType(e.target.value)}
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: isMobile ? '8px 28px 8px 32px' : '10px 32px 10px 36px',
                borderRadius: 8,
                border: `1.5px solid ${COLORS.border}`,
                background: COLORS.bg,
                fontSize: isMobile ? 12 : 13.5,
                color: COLORS.text,
                fontFamily: "'DM Sans', sans-serif",
                outline: 'none',
                cursor: 'pointer',
                appearance: 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
              onFocus={e => {
                e.currentTarget.style.borderColor = COLORS.primary;
                e.currentTarget.style.background = COLORS.white;
              }}
              onBlur={e => {
                e.currentTarget.style.borderColor = COLORS.border;
                e.currentTarget.style.background = COLORS.bg;
              }}
            >
              <option value="">Tous</option>
              <option value="entree">Entrées</option>
              <option value="sortie">Sorties</option>
            </select>
            <i className='bx bx-chevron-down' style={{
              position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
              fontSize: isMobile ? 13 : 15, color: COLORS.textLight, pointerEvents: 'none',
            }} />
          </div>
        </div>

        <div style={{ flex: 1, minWidth: isMobile ? 'auto' : 140 }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: isMobile ? 9 : 10.5,
            color: COLORS.textMuted,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: 4,
          }}>
            <i className='bx bx-source' style={{ fontSize: isMobile ? 10 : 11 }} />
            Source
          </label>
          <div style={{ position: 'relative' }}>
            <i className='bx bx-category' style={{
              position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
              fontSize: isMobile ? 13 : 16, color: COLORS.textLight, pointerEvents: 'none',
            }} />
            <select
              value={filtreSource}
              onChange={e => setFiltreSource(e.target.value)}
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: isMobile ? '8px 28px 8px 32px' : '10px 32px 10px 36px',
                borderRadius: 8,
                border: `1.5px solid ${COLORS.border}`,
                background: COLORS.bg,
                fontSize: isMobile ? 12 : 13.5,
                color: COLORS.text,
                fontFamily: "'DM Sans', sans-serif",
                outline: 'none',
                cursor: 'pointer',
                appearance: 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
              onFocus={e => {
                e.currentTarget.style.borderColor = COLORS.primary;
                e.currentTarget.style.background = COLORS.white;
              }}
              onBlur={e => {
                e.currentTarget.style.borderColor = COLORS.border;
                e.currentTarget.style.background = COLORS.bg;
              }}
            >
              <option value="">Toutes</option>
              <option value="manuel">Manuel</option>
              <option value="budget">Budget</option>
            </select>
            <i className='bx bx-chevron-down' style={{
              position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
              fontSize: isMobile ? 13 : 15, color: COLORS.textLight, pointerEvents: 'none',
            }} />
          </div>
        </div>

        <button
          onClick={() => { setFiltreType(''); setFiltreSource(''); setSearchTerm(''); setFiltrePeriode(''); }}
          style={{
            background: COLORS.bg,
            border: `1.5px solid ${COLORS.border}`,
            borderRadius: 8,
            padding: isMobile ? '8px 12px' : '10px 16px',
            cursor: 'pointer',
            fontSize: isMobile ? 12 : 13,
            color: COLORS.textMuted,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            fontFamily: "'DM Sans', sans-serif",
            transition: 'all 0.15s',
            whiteSpace: 'nowrap',
            justifyContent: 'center',
            width: isMobile ? '100%' : 'auto'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = COLORS.border;
            e.currentTarget.style.color = COLORS.text;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = COLORS.bg;
            e.currentTarget.style.color = COLORS.textMuted;
          }}
        >
          <i className='bx bx-reset' style={{ fontSize: isMobile ? 13 : 15 }} />
          Réinitialiser
        </button>
      </div>

      {/* ── ÉTAT CHARGEMENT ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: isMobile ? '40px 0' : '56px 0', color: COLORS.textLight }}>
          <div style={{
            width: isMobile ? 36 : 44,
            height: isMobile ? 36 : 44,
            border: '3px solid #ede9fe',
            borderTopColor: COLORS.primary,
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 12px',
          }} />
          <p style={{ fontSize: isMobile ? 12 : 14, margin: 0 }}>Chargement...</p>
        </div>

      ) : filtrees.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: isMobile ? '40px 16px' : '64px 20px',
          background: COLORS.white,
          borderRadius: 14,
          border: `1.5px dashed ${COLORS.border}`,
        }}>
          <div style={{
            width: isMobile ? 48 : 64,
            height: isMobile ? 48 : 64,
            borderRadius: '50%',
            background: '#ede9fe',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
          }}>
            <i className='bx bx-folder-open' style={{ fontSize: isMobile ? 22 : 28, color: COLORS.primary }} />
          </div>
          <p style={{ fontSize: isMobile ? 14 : 16, fontWeight: 700, color: COLORS.text, margin: '0 0 4px' }}>
            Aucune transaction
          </p>
          <p style={{ fontSize: isMobile ? 11 : 13, color: COLORS.textMuted, margin: 0 }}>
            Aucune transaction ne correspond à vos filtres
          </p>
        </div>

      ) : (
        <>
          {/* ── TABLE ── */}
          <div className="tx-table-wrap" style={{
            background: COLORS.white,
            borderRadius: 14,
            overflow: 'hidden',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            border: `1px solid ${COLORS.border}`,
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)' }}>
                  {[
                    { label: 'Type', icon: 'bx-transfer' },
                    { label: 'Montant', icon: 'bx-money' },
                    { label: 'Catégorie', icon: 'bx-category' },
                    { label: 'Description', icon: 'bx-text' },
                    { label: 'Source', icon: 'bx-source' },
                    { label: 'Date', icon: 'bx-calendar' },
                    { label: 'Statut', icon: 'bx-check-shield' },
                  ].map(h => (
                    <th key={h.label} style={{
                      padding: '10px 12px',
                      textAlign: 'left',
                      fontSize: 10,
                      fontWeight: 700,
                      color: COLORS.textMuted,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      borderBottom: `2px solid ${COLORS.border}`,
                    }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <i className={`bx ${h.icon}`} style={{ fontSize: 11 }} />
                        {h.label}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtrees.map((t, i) => (
                  <tr key={t.id} className="tx-row" style={{
                    borderTop: `1px solid ${COLORS.border}`,
                    background: i % 2 === 0 ? COLORS.white : '#fbfaff',
                    opacity: t.is_visible ? 1 : 0.65,
                  }}>
                    <td style={{ padding: '10px 12px' }}>
                      <TypeBadge type={t.type} />
                    </td>
                    <td style={{
                      padding: '10px 12px',
                      fontWeight: 700,
                      fontSize: 13,
                      color: t.type === 'entree' ? COLORS.entree : COLORS.sortie,
                      fontFamily: "'Outfit', sans-serif",
                      whiteSpace: 'nowrap'
                    }}>
                      {t.type === 'entree' ? '+' : '-'}{parseFloat(t.montant).toLocaleString()} MRU
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: 12, color: COLORS.textMuted }}>
                      {t.categorie_detail ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                          <span style={{
                            width: 6, height: 6, borderRadius: '50%',
                            background: t.categorie_detail.couleur || COLORS.primary,
                            display: 'inline-block', flexShrink: 0
                          }} />
                          <span style={{ fontSize: 11 }}>{t.categorie_detail.nom}</span>
                        </span>
                      ) : <span style={{ color: COLORS.border, fontSize: 11 }}>—</span>}
                    </td>
                    <td style={{
                      padding: '10px 12px',
                      fontSize: 11,
                      color: COLORS.textMuted,
                      maxWidth: 150,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {t.description || <span style={{ color: COLORS.border }}>—</span>}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '3px 8px',
                        borderRadius: 6,
                        fontSize: 10,
                        fontWeight: 600,
                        background: t.source === 'budget' ? '#fffbeb' : '#ede9fe',
                        color: t.source === 'budget' ? '#d97706' : COLORS.primary,
                        whiteSpace: 'nowrap'
                      }}>
                        <i className={`bx ${t.source === 'budget' ? 'bx-target' : 'bx-edit'}`} style={{ fontSize: 11 }} />
                        {t.source === 'budget' ? 'Budget' : 'Manuel'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: 11, color: COLORS.textMuted, whiteSpace: 'nowrap' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <i className='bx bx-calendar-event' style={{ fontSize: 11, color: COLORS.textLight }} />
                        {new Date(t.date_creation).toLocaleDateString('fr-FR', {
                          day: '2-digit', month: 'short', year: 'numeric'
                        })}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '3px 8px',
                        borderRadius: 6,
                        fontSize: 10,
                        fontWeight: 600,
                        background: t.is_visible ? '#ecfdf5' : '#f1f5f9',
                        color: t.is_visible ? '#059669' : '#94a3b8',
                        whiteSpace: 'nowrap'
                      }}>
                        <i className={`bx ${t.is_visible ? 'bx-check-circle' : 'bx-hide'}`} style={{ fontSize: 11 }} />
                        {t.is_visible ? 'Active' : 'Masquée'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── CARDS (mobile) ── */}
          <div className="tx-cards-wrap" style={{ flexDirection: 'column', gap: 10 }}>
            {filtrees.map(t => (
              <div key={t.id} style={{
                background: COLORS.white,
                borderRadius: 12,
                padding: '12px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                border: `1px solid ${COLORS.border}`,
                opacity: t.is_visible ? 1 : 0.65,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <TypeBadge type={t.type} />
                  <span style={{
                    fontWeight: 700,
                    fontSize: 14,
                    color: t.type === 'entree' ? COLORS.entree : COLORS.sortie,
                    fontFamily: "'Outfit', sans-serif"
                  }}>
                    {t.type === 'entree' ? '+' : '-'}{parseFloat(t.montant).toLocaleString()} MRU
                  </span>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 8 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: COLORS.textMuted }}>
                    <i className='bx bx-category' style={{ fontSize: 12 }} />
                    {t.categorie_detail?.nom || '—'}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: COLORS.textMuted }}>
                    <i className={`bx ${t.source === 'budget' ? 'bx-target' : 'bx-edit'}`} style={{ fontSize: 12 }} />
                    {t.source === 'budget' ? 'Budget' : 'Manuel'}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: COLORS.textMuted }}>
                    <i className='bx bx-calendar' style={{ fontSize: 12 }} />
                    {new Date(t.date_creation).toLocaleDateString('fr-FR', {
                      day: '2-digit', month: 'short', year: 'numeric'
                    })}
                  </span>
                </div>

                {t.description && (
                  <p style={{ margin: '0 0 8px', fontSize: 11, color: COLORS.textMuted, lineHeight: 1.4 }}>
                    {t.description}
                  </p>
                )}

                <div style={{ borderTop: `1px solid ${COLORS.border}`, paddingTop: 8, marginTop: 4 }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '3px 8px',
                    borderRadius: 6,
                    fontSize: 10,
                    fontWeight: 600,
                    background: t.is_visible ? '#ecfdf5' : '#f1f5f9',
                    color: t.is_visible ? '#059669' : '#94a3b8',
                  }}>
                    <i className={`bx ${t.is_visible ? 'bx-check-circle' : 'bx-hide'}`} style={{ fontSize: 11 }} />
                    {t.is_visible ? 'Active' : 'Masquée'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── MODAL EXPORT PDF ── */}
      {showExportModal && isEntreprise && !abonnementExpire && (
        <ExportPDFModal
          transactions={transactions}
          onClose={() => setShowExportModal(false)}
          isMobile={isMobile}
          userEmail={userEmail}
          userProfileImage={userProfileImage}
          // onLogoChange={handleLogoChange} // ← COMMENTÉ : Logo personnalisé désactivé
        />
      )}
    </div>
  );
}