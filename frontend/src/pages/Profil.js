// frontend/src/pages/Profil.js
import React, { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ActionBlockedModal from '../components/ActionBlockedModal';
import {
  User, Lock, Crown, Headphones, Image as ImageIcon, IdCard, UploadCloud, Trash2,
  Save, X, Eye, EyeOff, KeyRound, CheckCircle2, AlertCircle, LogOut, Phone, Mail,
  ShieldCheck, ShieldX, ScanLine, Info, Search, UserPlus, RefreshCw, Clock, XCircle,
  CheckCheck, ArrowRight, Gift, CreditCard, Wallet, Building2, Zap,
  MailOpen, Send, Loader2,
} from 'lucide-react';
import logoRSSBank from '../assets/logoRSSBank.jpeg';
import logoSedad from '../assets/logoSedad.jpeg';
import logoMasrivi from '../assets/logoMasrivi.jpeg';
import logoBankily from '../assets/logoBankily.jpeg';

const TARIFS = {
  standard:   { mensuel: 1500, '2_mois': 2850, '3_mois': 4200, '6_mois': 8100,  annuel: 15000 },
  entreprise: { mensuel: 2500, '2_mois': 4750, '3_mois': 7000, '6_mois': 13500, annuel: 25000 },
};
const DUREE_JOURS = {
  essai: 30, mensuel: 30, '2_mois': 60, '3_mois': 90, '6_mois': 180, annuel: 365,
};

// ---- Palette (design tokens) ----------------------------------------------
const T = {
  primary:      '#356267',
  primaryDark:  '#2a4f53',
  primarySoft:  '#c2f2f2',
  success:      '#4ea674',
  successAlt:   '#459071',
  successSoft:  '#e9f8e7',
  danger:       '#d55053',
  dangerSoft:   'rgba(213,80,83,0.08)',
  dangerBorder: 'rgba(213,80,83,0.25)',
  navy:         '#10214b',
  cream:        '#f8fafc',
  white:        '#ffffff',
  border:       'rgba(16,33,75,0.08)',
  textMid:      'rgba(53,98,103,0.75)',
  textLight:    'rgba(53,98,103,0.45)',
  radius:       16,
  radiusSm:     10,
};

export default function Profil() {
  const { user, abonnement, deconnexion, chargerAbonnement, mettreAJourUser, isVisitor, exitVisitorMode } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('informations');
  const [isMobile, setIsMobile] = useState(false);

  const [actionBlockedModal, setActionBlockedModal] = useState({ isOpen: false, message: null });

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const [msgProfil, setMsgProfil] = useState(null);
  const [msgSecurite, setMsgSecurite] = useState(null);
  const [msgAbonnement, setMsgAbonnement] = useState(null);
  const [msgContact, setMsgContact] = useState(null);

  const showMsg = (setter, type, text, duree = 4000) => {
    setter({ type, text });
    window.clearTimeout(showMsg._t);
    showMsg._t = window.setTimeout(() => setter(null), duree);
  };

  const [confirmSupprimerPhoto, setConfirmSupprimerPhoto] = useState(false);
  const [confirmDeconnexion, setConfirmDeconnexion] = useState(false);

  const [formProfil, setFormProfil] = useState({ nom: '', prenom: '', supprimer_photo: false });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [loadingProfil, setLoadingProfil] = useState(false);
  const [photoKey, setPhotoKey] = useState(Date.now());

  const [formMdp, setFormMdp] = useState({ ancien_password: '', nouveau_password: '', confirm_password: '' });
  const [loadingMdp, setLoadingMdp] = useState(false);
  const [showAncien, setShowAncien] = useState(false);
  const [showNouveau, setShowNouveau] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [typeAbo, setTypeAbo] = useState('mensuel');
  const [typeUser, setTypeUser] = useState('standard');
  const [emailAbo, setEmailAbo] = useState('');
  const [loadingCode, setLoadingCode] = useState(false);
  const [codeEnvoye, setCodeEnvoye] = useState(false);
  const [code, setCode] = useState('');
  const [loadingAbo, setLoadingAbo] = useState(false);
  const [successAbo, setSuccessAbo] = useState(null);
  const [previewRenouvellement, setPreviewRenouvellement] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [etapePaiement, setEtapePaiement] = useState('choix');
  const [methodePaiement, setMethodePaiement] = useState(null);
  const [compteEncaissement, setCompteEncaissement] = useState(null);
  const [loadingCompte, setLoadingCompte] = useState(false);
  const [captureFile, setCaptureFile] = useState(null);
  const [capturePreview, setCapturePreview] = useState(null);
  const [loadingEnvoiPaiement, setLoadingEnvoiPaiement] = useState(false);
  const [loadingTrackPay, setLoadingTrackPay] = useState(false);
  const [pollingTrackPay, setPollingTrackPay] = useState(false);
  const [trackPayTimeout, setTrackPayTimeout] = useState(false);
  const pollingIntervalRef = useRef(null);
  const pollingTimeoutRef = useRef(null);
  const [etatPaiement, setEtatPaiement] = useState(null);
  const [loadingEtatPaiement, setLoadingEtatPaiement] = useState(false);

  const [formContact, setFormContact] = useState('');
  const [loadingContact, setLoadingContact] = useState(false);

  const ouvrirActionBloquee = (actionType = 'signup') => {
    const messages = {
      signup: {
        title: '🔒 Créez un compte',
        message: 'Pour modifier votre profil ou souscrire à un abonnement, créez un compte en 30 secondes.',
        action: 'Créer un compte',
        actionType: 'signup'
      },
      login: {
        title: '🔐 Connectez-vous',
        message: 'Pour accéder à vos informations, connectez-vous à votre compte.',
        action: 'Se connecter',
        actionType: 'login'
      }
    };
    setActionBlockedModal({
      isOpen: true,
      message: messages[actionType] || messages.signup,
    });
  };

  const handleVisitorAction = (action) => {
    if (isVisitor) {
      ouvrirActionBloquee('signup');
      return;
    }
    action();
  };

  useEffect(() => {
    if (user) {
      setFormProfil({ nom: user.nom || '', prenom: user.prenom || '', supprimer_photo: false });
      setEmailAbo(user.email || '');
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'abonnement') {
      chargerEtatPaiement();
    }
  }, [activeTab]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('retour_trackpay') === '1') {
      setActiveTab('abonnement');
      setEtapePaiement('retour_trackpay');
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'abonnement' && abonnement && etapePaiement !== 'retour_trackpay') {
      if (abonnement.est_actif && (abonnement.plan_nom || '') !== 'essai') {
        if (abonnement.type_utilisateur === 'standard' || abonnement.type_utilisateur === 'entreprise') {
          setTypeUser(abonnement.type_utilisateur);
        }
        if (['mensuel', '2_mois', '3_mois', '6_mois', 'annuel'].includes(abonnement.type)) {
          setTypeAbo(abonnement.type);
        }
        setEtapePaiement('renouveler');
      } else {
        setEtapePaiement('choix');
      }
    }
  }, [activeTab, abonnement]);

  useEffect(() => {
    if (etapePaiement === 'retour_trackpay') {
      demarrerPollingTrackPay();
    }
    return () => arreterPollingTrackPay();
  }, [etapePaiement]);

  useEffect(() => {
    if ((etapePaiement === 'renouveler' || etapePaiement === 'choix') && typeUser && typeAbo) {
      chargerPreviewRenouvellement();
    }
  }, [etapePaiement, typeUser, typeAbo]);

  const chargerPreviewRenouvellement = async () => {
    setLoadingPreview(true);
    try {
      const res = await api.get('/abonnements/previsualiser-renouvellement/', {
        params: { type_utilisateur: typeUser, type_abonnement: typeAbo },
      });
      setPreviewRenouvellement(res.data);
    } catch (err) {
      setPreviewRenouvellement(null);
    } finally {
      setLoadingPreview(false);
    }
  };

  const chargerEtatPaiement = async () => {
    setLoadingEtatPaiement(true);
    try {
      const res = await api.get('/abonnements/statut-paiement-en-cours/');
      setEtatPaiement(res.data);
    } catch (err) {
      setEtatPaiement(null);
    } finally {
      setLoadingEtatPaiement(false);
    }
  };

  const montantCalc = TARIFS[typeUser]?.[typeAbo] || 500;
  const estCompteGoogle = user?.est_compte_google || (user?.telephone && user.telephone.startsWith('+222_g_'));
  const aboActif  = abonnement?.est_actif;
  const planNom   = abonnement?.plan_nom || 'essai';
  const estEssai  = planNom === 'essai';
  const joursRest = abonnement?.jours_restants ?? 0;

  const peutSouscrire = () => true;

  const getIdLabel = () => (user?.document_type === 'passport' ? 'Numéro de passeport' : 'NNI');

  const initiales = user
    ? `${(user.prenom || '')[0] || ''}${(user.nom || '')[0] || ''}`.toUpperCase()
    : '?';

  const getPhotoUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return `http://localhost:8000${path}`;
  };

  const dureeLabel = (val) => {
    const labels = {
      mensuel: 'Mensuel', '2_mois': '2 Mois', '3_mois': '3 Mois', '6_mois': '6 Mois', annuel: 'Annuel',
    };
    return labels[val] || val;
  };

  const handleSauvegarderProfil = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (isVisitor) {
      ouvrirActionBloquee('signup');
      return;
    }

    setLoadingProfil(true);
    try {
      const fd = new FormData();
      fd.append('nom', formProfil.nom);
      fd.append('prenom', formProfil.prenom);
      if (photoFile) fd.append('photo_profil', photoFile);
      if (formProfil.supprimer_photo) fd.append('supprimer_photo', 'true');
      const res = await api.patch('/comptes/profil/', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      mettreAJourUser(res.data);
      setPhotoFile(null);
      setPhotoPreview(null);
      setPhotoKey(Date.now());
      setFormProfil(prev => ({ ...prev, supprimer_photo: false }));
      showMsg(setMsgProfil, 'success', 'Photo mise à jour !');
    } catch (err) {
      showMsg(setMsgProfil, 'error', err.response?.data?.detail || 'Erreur lors de la mise à jour.');
    } finally {
      setLoadingProfil(false);
    }
  };

  const handlePhotoChange = (e) => {
    if (isVisitor) {
      ouvrirActionBloquee('signup');
      e.target.value = '';
      return;
    }
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { showMsg(setMsgProfil, 'error', 'Photo max 5 Mo.'); return; }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setFormProfil(p => ({ ...p, supprimer_photo: false }));
  };

  const demanderSuppressionPhoto = () => {
    if (isVisitor) {
      ouvrirActionBloquee('signup');
      return;
    }
    setConfirmSupprimerPhoto(true);
  };

  const annulerSuppressionPhoto = () => {
    setConfirmSupprimerPhoto(false);
  };

  const handleSupprimerPhoto = async () => {
    setConfirmSupprimerPhoto(false);
    setLoadingProfil(true);
    try {
      const fd = new FormData();
      fd.append('nom', formProfil.nom);
      fd.append('prenom', formProfil.prenom);
      fd.append('supprimer_photo', 'true');
      const res = await api.patch('/comptes/profil/', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      mettreAJourUser(res.data);
      setPhotoFile(null);
      setPhotoPreview(null);
      setPhotoKey(Date.now());
      setFormProfil(prev => ({ ...prev, supprimer_photo: false }));
      showMsg(setMsgProfil, 'success', 'Photo supprimée avec succès !');
    } catch {
      showMsg(setMsgProfil, 'error', 'Erreur lors de la suppression');
    } finally {
      setLoadingProfil(false);
    }
  };

  const handleChangerMdp = async (e) => {
    e.preventDefault();
    if (isVisitor) {
      ouvrirActionBloquee('signup');
      return;
    }
    if (formMdp.nouveau_password !== formMdp.confirm_password)
      return showMsg(setMsgSecurite, 'error', 'Les mots de passe ne correspondent pas.');
    setLoadingMdp(true);
    try {
      await api.post('/comptes/changer-mot-de-passe/', {
        ancien_password: formMdp.ancien_password,
        nouveau_password: formMdp.nouveau_password,
      });
      showMsg(setMsgSecurite, 'success', 'Mot de passe modifié !');
      setFormMdp({ ancien_password: '', nouveau_password: '', confirm_password: '' });
    } catch (err) {
      showMsg(setMsgSecurite, 'error', err.response?.data?.error || 'Mot de passe actuel incorrect.');
    } finally {
      setLoadingMdp(false);
    }
  };

  const demanderCode = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (isVisitor) {
      ouvrirActionBloquee('signup');
      return;
    }
    if (!emailAbo) return showMsg(setMsgAbonnement, 'error', "L'email est obligatoire.");
    setLoadingCode(true);
    try {
      await api.post('/abonnements/demander-code/', { email: emailAbo, type_abonnement: typeAbo, type_utilisateur: typeUser });
      showMsg(setMsgAbonnement, 'success', `Code envoyé à ${emailAbo} !`);
      setCodeEnvoye(true);
    } catch (err) {
      showMsg(setMsgAbonnement, 'error', err.response?.data?.error || "Erreur lors de l'envoi du code.");
    } finally {
      setLoadingCode(false);
    }
  };

  const confirmerAbonnement = async (e) => {
    e.preventDefault();
    if (isVisitor) {
      ouvrirActionBloquee('signup');
      return;
    }
    if (!code) return showMsg(setMsgAbonnement, 'error', 'Entrez le code reçu par email.');
    setLoadingAbo(true);
    try {
      const res = await api.post('/abonnements/souscrire/', {
        email: emailAbo, code_confirmation: code, type_abonnement: typeAbo, type_utilisateur: typeUser,
      });
      setSuccessAbo(res.data.abonnement);
      await chargerAbonnement();
      showMsg(setMsgAbonnement, 'success', 'Abonnement activé avec succès !');
    } catch (err) {
      showMsg(setMsgAbonnement, 'error', err.response?.data?.error || 'Code invalide ou expiré.');
    } finally {
      setLoadingAbo(false);
    }
  };

  const continuerVersPaiement = (e) => {
    e.preventDefault();
    if (isVisitor) {
      ouvrirActionBloquee('signup');
      return;
    }

    // Vérification spécifique pour le changement de plan
    if (previewRenouvellement && previewRenouvellement.autorise === false) {
      showMsg(setMsgAbonnement, 'error', previewRenouvellement.message || 'Ce changement de plan n\'est pas autorisé pour le moment.');
      return;
    }

    // Si on est dans le cas "renouveler" et qu'on souhaite passer à un plan différent
    if (etapePaiement === 'renouveler' && abonnement) {
      const planActuel = abonnement.type_utilisateur;
      const planChoisi = typeUser;

      // Si l'utilisateur tente de changer de plan (ex: entreprise -> standard) avec plus de 5 jours restants
      if (planActuel !== planChoisi && joursRest > 5) {
        const message = `Vous ne pouvez pas souscrire à un abonnement ${planChoisi} lorsque votre abonnement ${planActuel} est actif et qu'il reste ${joursRest} jour(s). Le changement de plan n'est possible que lorsqu'il reste 5 jours ou moins.`;
        showMsg(setMsgAbonnement, 'error', message);
        return;
      }
    }

    setEtapePaiement('email');
  };

  const verifierCodeEtContinuer = async (e) => {
    e.preventDefault();
    if (!code || code.length !== 6) return showMsg(setMsgAbonnement, 'error', 'Entrez le code à 6 chiffres reçu par email.');
    setEtapePaiement('methode');
    chargerComptesEncaissement();
  };

  const chargerComptesEncaissement = async () => {
    setLoadingCompte(true);
    try {
      const res = await api.get('/abonnements/comptes-encaissement/');
      setCompteEncaissement(res.data || []);
    } catch (err) {
      showMsg(setMsgAbonnement, 'error', 'Impossible de récupérer les informations de paiement.');
    } finally {
      setLoadingCompte(false);
    }
  };

  const choisirMethodePaiement = (val) => {
    setMethodePaiement(val);
  };

  const getCompteForMethode = (val) => {
    if (!Array.isArray(compteEncaissement)) return null;
    return compteEncaissement.find(c => c.methode === val) || null;
  };

  const handleCaptureChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { showMsg(setMsgAbonnement, 'error', 'Image max 5 Mo.'); return; }
    setCaptureFile(file);
    setCapturePreview(URL.createObjectURL(file));
  };

  const envoyerPaiement = async () => {
    if (isVisitor) {
      ouvrirActionBloquee('signup');
      return;
    }
    if (!captureFile) return showMsg(setMsgAbonnement, 'error', "Veuillez ajouter une capture d'écran de confirmation.");
    setLoadingEnvoiPaiement(true);
    try {
      const fd = new FormData();
      fd.append('type_abonnement', typeAbo);
      fd.append('type_utilisateur', typeUser);
      fd.append('methode', methodePaiement);
      fd.append('capture_ecran', captureFile);

      await api.post('/abonnements/initier-paiement/', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      showMsg(setMsgAbonnement, 'success', 'Votre abonnement est en attente de validation par notre équipe.');
      reinitialiserFlowPaiement();
      await chargerEtatPaiement();
    } catch (err) {
      const data = err.response?.data;
      if (data?.code === 'paiement_deja_en_attente' || (data?.error && data.error.includes('déjà'))) {
        showMsg(setMsgAbonnement, 'error', data.error || 'Vous avez déjà une demande en attente de validation.');
        reinitialiserFlowPaiement();
        await chargerEtatPaiement();
      } else if (data?.code === 'renouvellement_refuse') {
        showMsg(setMsgAbonnement, 'error', data.error || "Ce changement de plan n'est pas autorisé pour le moment.");
        setEtapePaiement('choix');
      } else {
        showMsg(setMsgAbonnement, 'error', data?.error || "Erreur lors de l'envoi du paiement.");
      }
    } finally {
      setLoadingEnvoiPaiement(false);
    }
  };

  const lancerPaiementTrackPay = async () => {
    if (isVisitor) {
      ouvrirActionBloquee('signup');
      return;
    }
    setLoadingTrackPay(true);
    try {
      const res = await api.post('/abonnements/initier-paiement-trackpay/', {
        type_abonnement: typeAbo,
        type_utilisateur: typeUser,
      });
      const paymentUrl = res.data?.payment_url;
      if (!paymentUrl) {
        showMsg(setMsgAbonnement, 'error', "Impossible de démarrer le paiement TrackPay.");
        setLoadingTrackPay(false);
        return;
      }
      window.location.href = paymentUrl;
    } catch (err) {
      const data = err.response?.data;
      if (data?.code === 'paiement_deja_en_attente' || (data?.error && data.error.includes('déjà'))) {
        showMsg(setMsgAbonnement, 'error', data.error || 'Vous avez déjà une demande en attente de validation.');
        reinitialiserFlowPaiement();
        await chargerEtatPaiement();
      } else if (data?.code === 'renouvellement_refuse') {
        showMsg(setMsgAbonnement, 'error', data.error || "Ce changement de plan n'est pas autorisé pour le moment.");
        setEtapePaiement('choix');
      } else {
        showMsg(setMsgAbonnement, 'error', data?.error || "Erreur lors de l'initialisation du paiement TrackPay.");
      }
      setLoadingTrackPay(false);
    }
  };

  const demarrerPollingTrackPay = () => {
    setPollingTrackPay(true);
    setTrackPayTimeout(false);

    const verifier = async () => {
      try {
        const res = await api.get('/abonnements/statut-paiement-en-cours/');
        if (res.data?.etat !== 'en_attente') {
          arreterPollingTrackPay();
          await chargerAbonnement();
          await chargerEtatPaiement();
          showMsg(setMsgAbonnement, 'success', 'Paiement traité ! Votre abonnement a été mis à jour.');
          reinitialiserFlowPaiement();
        }
      } catch {
        // En cas d'erreur réseau ponctuelle, on continue simplement le polling.
      }
    };

    verifier();
    pollingIntervalRef.current = window.setInterval(verifier, 4000);
    pollingTimeoutRef.current = window.setTimeout(() => {
      setTrackPayTimeout(true);
      arreterPollingTrackPay();
    }, 30000);
  };

  const arreterPollingTrackPay = () => {
    if (pollingIntervalRef.current) {
      window.clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    if (pollingTimeoutRef.current) {
      window.clearTimeout(pollingTimeoutRef.current);
      pollingTimeoutRef.current = null;
    }
    setPollingTrackPay(false);
  };

  const reinitialiserFlowPaiement = () => {
    setEtapePaiement('choix');
    setCodeEnvoye(false);
    setCode('');
    setMethodePaiement(null);
    setCompteEncaissement(null);
    setCaptureFile(null);
    setCapturePreview(null);
    setLoadingTrackPay(false);
    if (window.location.search.includes('retour_trackpay')) {
      const url = new URL(window.location.href);
      url.searchParams.delete('retour_trackpay');
      window.history.replaceState({}, '', url.toString());
    }
  };

  const handleContact = async (e) => {
    e.preventDefault();
    if (isVisitor) {
      ouvrirActionBloquee('signup');
      return;
    }
    setLoadingContact(true);
    try {
      await api.post('/comptes/contact/', { message: formContact });
      showMsg(setMsgContact, 'success', 'Message envoyé !');
      setFormContact('');
    } catch {
      showMsg(setMsgContact, 'error', "Erreur lors de l'envoi.");
    } finally {
      setLoadingContact(false);
    }
  };

  const demanderDeconnexion = () => {
    setConfirmDeconnexion(true);
  };

  const annulerDeconnexion = () => {
    setConfirmDeconnexion(false);
  };

  const handleDeconnexion = async () => {
    setConfirmDeconnexion(false);
    await deconnexion();
    navigate('/connexion');
  };

  const tabs = [
    { id: 'informations', label: 'Infos', Icon: User },
    { id: 'securite',     label: 'Sécurité', Icon: Lock },
    { id: 'abonnement',   label: 'Abonnement', Icon: Crown },
    { id: 'contact',      label: 'Contact', Icon: Headphones },
  ];

  const demandeEnCours = etatPaiement?.etat === 'en_attente' ? etatPaiement.paiement : null;
  const dernierRefus    = etatPaiement?.etat === 'refuse' ? etatPaiement.paiement : null;

  const methodeLabel = (m) => {
    const labels = {
      rssbank:  'RSSBank',
      sedad:    'Sedad',
      bankily:  'Bankily',
      masrivi:  'Masrivi',
      trackpay: 'TrackPay',
    };
    return labels[m] || m;
  };

  const etapesPaiement = [
    { id: 'choix',   label: 'Plan',         Icon: Crown },
    { id: 'email',   label: 'Email',        Icon: Mail },
    { id: 'methode', label: 'Paiement',     Icon: CreditCard },
    { id: 'upload',  label: 'Confirmation', Icon: ImageIcon },
  ];
  const etapePaiementIndex = etapesPaiement.findIndex(e => e.id === etapePaiement);

  // Vérification si l'utilisateur peut changer de plan
  const peutChangerDePlan = () => {
    if (!aboActif || !abonnement) return true;
    const planActuel = abonnement.type_utilisateur;
    const planChoisi = typeUser;
    if (planActuel !== planChoisi && joursRest > 5) {
      return false;
    }
    return true;
  };

  const getChangementPlanMessage = () => {
    if (!aboActif || !abonnement) return null;
    const planActuel = abonnement.type_utilisateur;
    const planChoisi = typeUser;
    if (planActuel !== planChoisi && joursRest > 5) {
      return `Vous ne pouvez pas souscrire à un abonnement ${planChoisi} lorsque votre abonnement ${planActuel} est actif et qu'il reste ${joursRest} jour(s). Le changement de plan n'est possible que lorsqu'il reste 5 jours ou moins.`;
    }
    return null;
  };

  // ---- Style helpers (inline, no CSS framework needed) --------------------
  const card = { background: T.white, borderRadius: T.radius, border: `1px solid ${T.border}`, boxShadow: '0 1px 10px rgba(16,33,75,0.04)', overflow: 'hidden' };
  const cardPad = { padding: isMobile ? 16 : 28 };
  const label = { display: 'block', fontSize: 11, fontWeight: 700, color: T.textMid, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4 };
  const input = (extra = {}) => ({
    width: '100%', borderRadius: 12, border: `1.5px solid ${T.border}`, background: 'rgba(235,231,225,0.4)',
    padding: '11px 14px', fontSize: 13, color: T.navy, fontFamily: "'DM Sans', sans-serif", ...extra,
  });
  const btnPrimary = (disabled) => ({
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12,
    background: disabled ? 'rgba(16,33,75,0.1)' : T.primary, color: disabled ? 'rgba(16,33,75,0.35)' : T.white,
    border: 'none', padding: '11px 20px', minHeight: 44, fontSize: 13, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer',
    boxShadow: disabled ? 'none' : '0 1px 6px rgba(53,98,103,0.2)',
  });
  const btnGhost = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, border: `1.5px solid ${T.border}`, background: T.white, color: T.textMid, padding: '11px 20px', minHeight: 44, fontSize: 13, fontWeight: 700, cursor: 'pointer' };
  const btnSuccess = (disabled) => ({
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12,
    background: disabled ? 'rgba(16,33,75,0.1)' : T.success, color: disabled ? 'rgba(16,33,75,0.35)' : T.white,
    border: 'none', padding: '11px 20px', minHeight: 44, fontSize: 13, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer',
  });
  const btnDanger = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 10, border: `1px solid ${T.dangerBorder}`, background: T.dangerSoft, color: T.danger, padding: '8px 16px', minHeight: 40, fontSize: 12, fontWeight: 700, cursor: 'pointer' };
  const pill = (bg, color) => ({ display: 'inline-flex', alignItems: 'center', gap: 5, borderRadius: 999, padding: '4px 10px', fontSize: 10, fontWeight: 800, background: bg, color });
  const sectionIconWrap = { width: isMobile ? 32 : 36, height: isMobile ? 32 : 36, borderRadius: 10, background: T.primarySoft, display: 'flex', alignItems: 'center', justifyContent: 'center' };
  const heading = { margin: 0, fontFamily: "'Outfit', sans-serif", fontSize: isMobile ? 15 : 18, fontWeight: 800, color: T.navy };
  const banner = (type) => ({
    marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10, borderRadius: 12,
    border: `1px solid ${type === 'success' ? 'rgba(78,166,116,0.25)' : T.dangerBorder}`,
    background: type === 'success' ? T.successSoft : T.dangerSoft,
    color: type === 'success' ? '#2e6b46' : '#b3393c',
    padding: '11px 14px', fontSize: isMobile ? 11 : 12, fontWeight: 700,
  });

  return (
    <div style={{ minHeight: '100vh', background: T.cream, padding: isMobile ? 12 : 24, fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Outfit:wght@600;700;800&display=swap" rel="stylesheet" />

      <ActionBlockedModal
        isOpen={actionBlockedModal.isOpen}
        onClose={() => setActionBlockedModal({ isOpen: false, message: null })}
        message={actionBlockedModal.message}
      />

      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes bannerIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .prof-fade { animation: fadeUp .3s ease both; }
        .prof-input:focus { border-color: ${T.primary} !important; background: #fff !important; box-shadow: 0 0 0 3px rgba(53,98,103,0.12); outline: none; }
        .btn-hover { transition: transform .15s ease, opacity .15s ease; }
        .btn-hover:active:not(:disabled) { transform: scale(0.98); }
        @media (max-width: 480px) {
          .grid-2 { grid-template-columns: 1fr !important; gap: 10px !important; }
          .plan-grid { grid-template-columns: 1fr !important; gap: 10px !important; }
          .duree-grid { grid-template-columns: 1fr 1fr !important; }
          .methode-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>

      <div style={{ maxWidth: 960, margin: '0 auto' }}>

        {/* HEADER CARTE PROFIL */}
        <div style={{ ...card, padding: isMobile ? 14 : '20px 24px', marginBottom: 16, opacity: isVisitor ? 0.9 : 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 12 : 18, flex: 1, minWidth: 0 }}>
              <div style={{
                width: isMobile ? 52 : 72, height: isMobile ? 52 : 72, borderRadius: '50%', flexShrink: 0,
                background: isVisitor ? T.successAlt : T.primary, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: isMobile ? 18 : 24, fontWeight: 800, color: T.white, overflow: 'hidden', border: `2px solid ${T.white}`,
                boxShadow: '0 2px 10px rgba(53,98,103,0.18)',
              }}>
                {isVisitor ? <Search size={isMobile ? 20 : 26} /> :
                  photoPreview ? <img src={photoPreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> :
                  user?.photo_profil ? <img src={getPhotoUrl(user.photo_profil) + '?v=' + photoKey} alt="profil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> :
                  initiales}
              </div>

              <div style={{ minWidth: 0, flex: 1 }}>
                <h2 style={{ margin: 0, fontSize: isMobile ? 15 : 20, fontWeight: 800, color: T.navy, fontFamily: "'Outfit', sans-serif", letterSpacing: -0.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {isVisitor ? 'Explorateur Démo' : `${user?.prenom} ${user?.nom}`}
                </h2>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                  {isVisitor ? (
                    <span style={{ fontSize: 10, color: T.successAlt, display: 'inline-flex', alignItems: 'center', gap: 4 }}><Crown size={11} /> Mode Exploration</span>
                  ) : !estCompteGoogle ? (
                    <span style={{ fontSize: 10, color: T.textMid, display: 'inline-flex', alignItems: 'center', gap: 4 }}><Phone size={11} /> {user?.telephone}</span>
                  ) : (
                    <span style={{ fontSize: 10, color: T.textMid }}>Google</span>
                  )}
                  {user?.email && !isVisitor && (
                    <span style={{ fontSize: 10, color: T.textLight, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Mail size={11} /> {user.email.length > 20 ? user.email.substring(0, 18) + '..' : user.email}
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                  {isVisitor ? (
                    <span style={pill(T.successSoft, '#2e6b46')}><Crown size={9} /> Démo</span>
                  ) : (
                    <span style={pill(T.primarySoft, T.primary)}><Crown size={9} /> {planNom}</span>
                  )}
                  {!isVisitor && (aboActif ? (
                    <span style={pill(T.successSoft, '#2e6b46')}><CheckCircle2 size={9} /> Actif — {joursRest}j</span>
                  ) : (
                    <span style={pill('rgba(213,80,83,0.1)', T.danger)}><XCircle size={9} /> Expiré</span>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
              <button
                onClick={isVisitor ? () => { exitVisitorMode(); navigate('/'); } : demanderDeconnexion}
                className="btn-hover"
                style={{
                  background: isVisitor ? T.successSoft : T.dangerSoft, color: isVisitor ? '#2e6b46' : T.danger,
                  border: `1px solid ${isVisitor ? 'rgba(69,144,113,0.25)' : T.dangerBorder}`, borderRadius: 999,
                  padding: isMobile ? '7px 14px' : '9px 20px', minHeight: 38, cursor: 'pointer', fontSize: isMobile ? 11 : 13,
                  fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'DM Sans', sans-serif",
                }}
              >
                <LogOut size={isMobile ? 14 : 16} />
                {isVisitor ? 'Quitter la démo' : (!isMobile && 'Déconnexion')}
              </button>

              {confirmDeconnexion && (
                <div style={{ background: T.dangerSoft, border: `1px solid ${T.dangerBorder}`, borderRadius: 12, padding: '10px 14px', maxWidth: 280, display: 'flex', flexDirection: 'column', gap: 8, animation: 'bannerIn .25s ease' }}>
                  <div style={{ fontSize: 11, color: '#b3393c', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <AlertCircle size={14} /> Voulez-vous vous déconnecter ?
                  </div>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                    <button onClick={annulerDeconnexion} style={{ background: T.white, border: `1px solid ${T.border}`, color: T.textMid, borderRadius: 999, padding: '6px 14px', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>Annuler</button>
                    <button onClick={handleDeconnexion} style={{ background: T.danger, border: 'none', color: T.white, borderRadius: 999, padding: '6px 14px', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>Confirmer</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ONGLETS */}
        <div style={{ display: 'flex', gap: isMobile ? 6 : 8, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
          {tabs.map(tab => {
            const active = activeTab === tab.id;
            const TabIcon = tab.Icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: isMobile ? '9px 16px' : '11px 22px', minHeight: 40, borderRadius: 999, border: 'none',
                  fontSize: isMobile ? 11 : 13, fontWeight: 700, background: active ? T.primary : T.white,
                  color: active ? T.white : T.textMid, display: 'flex', alignItems: 'center', gap: isMobile ? 5 : 7,
                  whiteSpace: 'nowrap', cursor: 'pointer', flexShrink: 0,
                  boxShadow: active ? '0 2px 8px rgba(53,98,103,0.25)' : '0 1px 3px rgba(16,33,75,0.04)',
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                <TabIcon size={isMobile ? 13 : 15} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* TAB — INFORMATIONS */}
        {activeTab === 'informations' && (
          <div className="prof-fade" style={{ ...card, ...cardPad }}>
            {msgProfil && (
              <div style={banner(msgProfil.type)}>
                {msgProfil.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                {msgProfil.text}
              </div>
            )}

            {isVisitor && (
              <div style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 12, background: T.successSoft, border: '1px solid rgba(69,144,113,0.25)', color: '#2e6b46', fontSize: isMobile ? 11 : 12, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 10 }}>
                <Search size={20} />
                <div style={{ flex: 1 }}>
                  <strong>Mode Exploration</strong> — Les données affichées sont des démonstrations. Créez un compte pour modifier votre profil.
                </div>
                <button onClick={() => ouvrirActionBloquee('signup')} style={{ background: T.successAlt, border: 'none', borderRadius: 10, padding: '7px 14px', color: '#fff', fontWeight: 700, fontSize: 10, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  Créer un compte
                </button>
              </div>
            )}

            {/* Section Photo */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <div style={sectionIconWrap}><ImageIcon size={isMobile ? 14 : 16} color={T.primary} /></div>
                <h3 style={heading}>Photo de profil</h3>
              </div>

              <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'center' : 'flex-start', gap: isMobile ? 14 : 20 }}>
                <div style={{
                  width: isMobile ? 64 : 80, height: isMobile ? 64 : 80, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
                  background: isVisitor ? T.successAlt : T.primary, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: isMobile ? 22 : 28, fontWeight: 800, color: T.white, border: `2px solid ${T.border}`,
                }}>
                  {isVisitor ? <Search size={22} /> :
                    photoPreview ? <img src={photoPreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> :
                    user?.photo_profil ? <img src={getPhotoUrl(user.photo_profil) + '?v=' + photoKey} alt="profil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> :
                    initiales}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <label style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6, minHeight: 40,
                      background: isVisitor ? 'rgba(16,33,75,0.1)' : T.primary, color: isVisitor ? 'rgba(16,33,75,0.4)' : T.white,
                      borderRadius: 10, padding: isMobile ? '8px 14px' : '9px 18px', cursor: isVisitor ? 'not-allowed' : 'pointer',
                      fontSize: isMobile ? 11 : 13, fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
                    }}>
                      <UploadCloud size={isMobile ? 13 : 15} />
                      Changer
                      <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} disabled={isVisitor} />
                    </label>

                    {(user?.photo_profil || photoPreview) && !isVisitor && (
                      <button onClick={demanderSuppressionPhoto} style={btnDanger}>
                        <Trash2 size={isMobile ? 13 : 15} /> Supprimer
                      </button>
                    )}
                  </div>

                  {isVisitor && (
                    <div style={{ fontSize: 11, color: T.successAlt, fontWeight: 500 }}>
                      <Lock size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                      Photo de démonstration — Modifications désactivées
                    </div>
                  )}

                  {confirmSupprimerPhoto && !isVisitor && (
                    <div style={{ background: T.dangerSoft, border: `1px solid ${T.dangerBorder}`, borderRadius: 12, padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8, animation: 'bannerIn .25s ease' }}>
                      <div style={{ fontSize: 11, color: '#b3393c', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <AlertCircle size={14} /> Voulez-vous vraiment supprimer votre photo de profil ?
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={annulerSuppressionPhoto} style={{ background: T.white, border: `1px solid ${T.border}`, color: T.textMid, borderRadius: 999, padding: '6px 14px', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>Annuler</button>
                        <button onClick={handleSupprimerPhoto} style={{ background: T.danger, border: 'none', color: T.white, borderRadius: 999, padding: '6px 14px', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>Confirmer</button>
                      </div>
                    </div>
                  )}

                  {photoFile && !isVisitor && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <button onClick={handleSauvegarderProfil} disabled={loadingProfil} className="btn-hover" style={btnSuccess(loadingProfil)}>
                        {loadingProfil ? <><Loader2 size={14} style={{ animation: 'spin .7s linear infinite' }} /> Sauvegarde...</> : <><Save size={isMobile ? 13 : 15} /> Sauvegarder</>}
                      </button>
                      <button onClick={() => { setPhotoFile(null); setPhotoPreview(null); }} style={{ background: 'none', border: 'none', color: T.textLight, cursor: 'pointer', fontSize: isMobile ? 10 : 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                        <X size={13} /> Annuler
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div style={{ height: 1, background: 'rgba(16,33,75,0.06)', margin: '20px 0' }} />

            {/* Section Données d'identité */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <div style={sectionIconWrap}><IdCard size={isMobile ? 14 : 16} color={T.primary} /></div>
                <h3 style={heading}>{isVisitor ? 'Données de démonstration' : 'Données Extraite'}</h3>
              </div>

              <div style={{
                marginBottom: 16, padding: isMobile ? '10px 12px' : '14px 18px', borderRadius: 12,
                background: isVisitor ? T.successSoft : (user?.is_kyc_verified ? T.successSoft : 'rgba(194,242,242,0.4)'),
                border: `1px solid ${isVisitor ? 'rgba(69,144,113,0.25)' : (user?.is_kyc_verified ? 'rgba(78,166,116,0.25)' : 'rgba(53,98,103,0.2)')}`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {isVisitor ? <Search size={18} color="#2e6b46" /> : user?.is_kyc_verified ? <ShieldCheck size={18} color="#2e6b46" /> : <ShieldX size={18} color={T.primary} />}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: isMobile ? 12 : 13, color: isVisitor ? '#2e6b46' : (user?.is_kyc_verified ? '#2e6b46' : T.primary) }}>
                      {isVisitor ? 'Mode Démo' : (user?.is_kyc_verified ? 'Votre compte est validée' : 'Vérification en attente')}
                    </div>
                    <div style={{ fontSize: 9, color: isVisitor ? 'rgba(46,107,70,0.7)' : (user?.is_kyc_verified ? 'rgba(46,107,70,0.7)' : T.textMid), marginTop: 2 }}>
                      {isVisitor ? 'Données de démonstration' : (user?.is_kyc_verified ? 'Confirmée' : 'Vérifiez votre identité')}
                    </div>
                  </div>
                </div>
                {!isVisitor && !user?.is_kyc_verified && (
                  <button onClick={() => navigate('/kyc')} style={{ background: T.primary, color: T.white, border: 'none', borderRadius: 999, padding: isMobile ? '7px 14px' : '9px 20px', minHeight: 36, fontWeight: 700, fontSize: isMobile ? 10 : 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <ScanLine size={isMobile ? 12 : 14} /> Vérifier
                  </button>
                )}
              </div>

              {isVisitor ? (
                <div style={{ background: 'rgba(235,231,225,0.5)', borderRadius: 12, border: `1px solid ${T.border}`, padding: isMobile ? '16px' : '20px', textAlign: 'center' }}>
                  <Info size={24} color={T.successAlt} style={{ marginBottom: 6 }} />
                  <p style={{ margin: 0, fontSize: isMobile ? 11 : 12, color: '#2e6b46' }}>
                    Données de démonstration. Créez un compte pour voir vos vraies informations.
                  </p>
                </div>
              ) : user?.is_kyc_verified ? (
                <>
                  <div style={{ background: 'rgba(235,231,225,0.5)', borderRadius: 12, border: `1px solid ${T.border}`, overflow: 'hidden', marginBottom: 12 }}>
                    <div style={{ padding: '7px 12px', background: 'rgba(16,33,75,0.03)', borderBottom: `1px solid ${T.border}` }}>
                      <span style={{ fontSize: 9, fontWeight: 700, color: T.textMid, textTransform: 'uppercase', letterSpacing: 0.5 }}>IDENTITÉ</span>
                    </div>
                    <div style={{ padding: isMobile ? '12px' : '16px' }}>
                      <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: isMobile ? 10 : 16 }}>
                        <div><div style={{ fontSize: 9, color: T.textLight, fontWeight: 600, marginBottom: 3 }}>{getIdLabel()}</div><div style={{ fontSize: isMobile ? 12 : 13, fontWeight: 700, color: T.navy }}>{user?.nni || '—'}</div></div>
                        <div><div style={{ fontSize: 9, color: T.textLight, fontWeight: 600, marginBottom: 3 }}>Nom</div><div style={{ fontSize: isMobile ? 12 : 13, fontWeight: 700, color: T.navy }}>{user?.prenom_fr || user?.prenom || '—'}</div></div>
                        <div><div style={{ fontSize: 9, color: T.textLight, fontWeight: 600, marginBottom: 3 }}>Prénom</div><div style={{ fontSize: isMobile ? 12 : 13, fontWeight: 700, color: T.navy }}>{user?.nom_fr || user?.nom || '—'}</div></div>
                        <div><div style={{ fontSize: 9, color: T.textLight, fontWeight: 600, marginBottom: 3 }}>Nom du père</div><div style={{ fontSize: isMobile ? 12 : 13, fontWeight: 700, color: T.navy }}>{user?.father_name || '—'}</div></div>
                      </div>
                    </div>
                  </div>

                  <div style={{ background: 'rgba(235,231,225,0.5)', borderRadius: 12, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
                    <div style={{ padding: '7px 12px', background: 'rgba(16,33,75,0.03)', borderBottom: `1px solid ${T.border}` }}>
                      <span style={{ fontSize: 9, fontWeight: 700, color: T.textMid, textTransform: 'uppercase', letterSpacing: 0.5 }}>ÉTAT CIVIL</span>
                    </div>
                    <div style={{ padding: isMobile ? '12px' : '16px' }}>
                      <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: isMobile ? 10 : 16 }}>
                        <div><div style={{ fontSize: 9, color: T.textLight, fontWeight: 600, marginBottom: 3 }}>Date de naissance</div><div style={{ fontSize: isMobile ? 12 : 13, fontWeight: 700, color: T.navy }}>{user?.birth_date ? new Date(user.birth_date).toLocaleDateString('fr-FR') : '—'}</div></div>
                        <div><div style={{ fontSize: 9, color: T.textLight, fontWeight: 600, marginBottom: 3 }}>Lieu de naissance</div><div style={{ fontSize: isMobile ? 12 : 13, fontWeight: 700, color: T.navy }}>{user?.birth_place || '—'}</div></div>
                        <div><div style={{ fontSize: 9, color: T.textLight, fontWeight: 600, marginBottom: 3 }}>Sexe</div><div style={{ fontSize: isMobile ? 12 : 13, fontWeight: 700, color: T.navy }}>{user?.gender === 'M' ? 'Masculin' : user?.gender === 'F' ? 'Féminin' : user?.gender || '—'}</div></div>
                        <div><div style={{ fontSize: 9, color: T.textLight, fontWeight: 600, marginBottom: 3 }}>Nationalité</div><div style={{ fontSize: isMobile ? 12 : 13, fontWeight: 700, color: T.navy }}>{user?.nationality || '—'}</div></div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ background: 'rgba(194,242,242,0.3)', borderRadius: 12, padding: isMobile ? '14px' : '18px', textAlign: 'center', border: '1px solid rgba(53,98,103,0.2)' }}>
                  <Info size={24} color={T.primary} style={{ marginBottom: 6 }} />
                  <p style={{ margin: 0, fontSize: isMobile ? 11 : 12, color: T.primary }}>Aucune donnée disponible. Vérifiez votre identité.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB — SÉCURITÉ */}
        {activeTab === 'securite' && (
          <div className="prof-fade" style={{ ...card, ...cardPad }}>
            {msgSecurite && (
              <div style={banner(msgSecurite.type)}>
                {msgSecurite.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                {msgSecurite.text}
              </div>
            )}

            {isVisitor && (
              <div style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 12, background: T.successSoft, border: '1px solid rgba(69,144,113,0.25)', color: '#2e6b46', fontSize: isMobile ? 11 : 12, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 10 }}>
                <Search size={20} />
                <div style={{ flex: 1 }}><strong>Mode Exploration</strong> — La modification du mot de passe est désactivée.</div>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
              <div style={sectionIconWrap}><Lock size={isMobile ? 14 : 16} color={T.primary} /></div>
              <h3 style={heading}>Changer le mot de passe</h3>
            </div>

            <form onSubmit={handleChangerMdp} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={label}>Mot de passe actuel</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: T.textLight }} />
                  <input
                    type={showAncien ? 'text' : 'password'}
                    value={isVisitor ? '' : formMdp.ancien_password}
                    onChange={e => !isVisitor && setFormMdp({ ...formMdp, ancien_password: e.target.value })}
                    required={!isVisitor}
                    disabled={isVisitor}
                    placeholder={isVisitor ? 'Mode Exploration' : ''}
                    className="prof-input"
                    style={input({ paddingLeft: 36, paddingRight: 36, ...(isVisitor ? { cursor: 'not-allowed', border: '1.5px solid rgba(69,144,113,0.3)', background: T.successSoft, color: '#2e6b46' } : {}) })}
                  />
                  {!isVisitor && (
                    <button type="button" onClick={() => setShowAncien(!showAncien)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: T.textLight }}>
                      {showAncien ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label style={label}>Nouveau mot de passe</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: T.textLight }} />
                  <input
                    type={showNouveau ? 'text' : 'password'}
                    value={isVisitor ? '' : formMdp.nouveau_password}
                    onChange={e => !isVisitor && setFormMdp({ ...formMdp, nouveau_password: e.target.value })}
                    required={!isVisitor}
                    minLength={6}
                    disabled={isVisitor}
                    placeholder={isVisitor ? 'Mode Exploration' : ''}
                    className="prof-input"
                    style={input({ paddingLeft: 36, paddingRight: 36, ...(isVisitor ? { cursor: 'not-allowed', border: '1.5px solid rgba(69,144,113,0.3)', background: T.successSoft, color: '#2e6b46' } : {}) })}
                  />
                  {!isVisitor && (
                    <button type="button" onClick={() => setShowNouveau(!showNouveau)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: T.textLight }}>
                      {showNouveau ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label style={label}>Confirmer</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: T.textLight }} />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={isVisitor ? '' : formMdp.confirm_password}
                    onChange={e => !isVisitor && setFormMdp({ ...formMdp, confirm_password: e.target.value })}
                    required={!isVisitor}
                    disabled={isVisitor}
                    placeholder={isVisitor ? 'Mode Exploration' : ''}
                    className="prof-input"
                    style={input({
                      paddingLeft: 36, paddingRight: 36,
                      ...(isVisitor ? { cursor: 'not-allowed', border: '1.5px solid rgba(69,144,113,0.3)', background: T.successSoft, color: '#2e6b46' } :
                        (formMdp.confirm_password && formMdp.nouveau_password !== formMdp.confirm_password ? { border: `1.5px solid ${T.danger}` } : {})),
                    })}
                  />
                  {!isVisitor && (
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: T.textLight }}>
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  )}
                </div>
                {!isVisitor && formMdp.confirm_password && formMdp.nouveau_password !== formMdp.confirm_password && (
                  <p style={{ margin: '6px 0 0', fontSize: 9, color: T.danger, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <AlertCircle size={11} /> Les mots de passe ne correspondent pas
                  </p>
                )}
              </div>

              <button type="submit" disabled={loadingMdp || isVisitor} className="btn-hover" style={{ ...btnPrimary(loadingMdp || isVisitor), width: '100%' }}>
                {isVisitor ? <><Lock size={15} /> Mode Exploration</> : loadingMdp ? <><Loader2 size={16} style={{ animation: 'spin .7s linear infinite' }} /> Modification...</> : <><KeyRound size={15} /> Modifier</>}
              </button>
            </form>
          </div>
        )}

        {/* TAB — ABONNEMENT */}
        {activeTab === 'abonnement' && (
          <div className="prof-fade">

            {msgAbonnement && (
              <div style={banner(msgAbonnement.type)}>
                {msgAbonnement.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                {msgAbonnement.text}
              </div>
            )}

            {isVisitor ? (
              <div className="prof-fade" style={{ ...card, ...cardPad, textAlign: 'center' }}>
                <div style={{ width: isMobile ? 64 : 80, height: isMobile ? 64 : 80, borderRadius: '50%', background: T.successSoft, margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Lock size={isMobile ? 28 : 36} color={T.successAlt} />
                </div>
                <h3 style={{ margin: '0 0 8px', fontSize: isMobile ? 16 : 20, fontWeight: 800, color: T.navy, fontFamily: "'Outfit', sans-serif" }}>Mode Exploration</h3>
                <p style={{ margin: '0 auto 20px', maxWidth: 380, fontSize: isMobile ? 12 : 14, color: T.textMid, lineHeight: 1.6 }}>
                  Vous êtes en mode exploration. Les abonnements et les paiements sont désactivés. Créez un compte pour souscrire à un abonnement et accéder à toutes les fonctionnalités.
                </p>
                <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 10, maxWidth: 380, margin: '0 auto' }}>
                  <button onClick={() => ouvrirActionBloquee('signup')} className="btn-hover" style={{ ...btnSuccess(false), flex: 1 }}>
                    <UserPlus size={16} /> Créer un compte
                  </button>
                  <button onClick={() => { exitVisitorMode(); navigate('/'); }} style={{ ...btnGhost, flex: 1 }}>
                    <LogOut size={16} /> Quitter
                  </button>
                </div>
                <div style={{ marginTop: 16, padding: '12px 16px', background: 'rgba(235,231,225,0.6)', borderRadius: 10, fontSize: isMobile ? 10 : 12, color: T.textLight }}>
                  <Info size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Les données affichées sont des démonstrations
                </div>
              </div>
            ) : (
              <>
                {abonnement && (
                  <div style={{ ...card, background: aboActif ? T.successSoft : T.dangerSoft, border: `1px solid ${aboActif ? 'rgba(78,166,116,0.25)' : T.dangerBorder}`, padding: isMobile ? '12px 14px' : '18px 24px', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {aboActif ? <ShieldCheck size={18} color="#2e6b46" /> : <ShieldX size={18} color={T.danger} />}
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, color: aboActif ? '#2e6b46' : '#b3393c', fontSize: isMobile ? 13 : 15 }}>
                          {aboActif ? 'Abonnement actif' : 'Abonnement expiré'}
                        </div>
                        <div style={{ fontSize: 10, color: T.textMid, marginTop: 2 }}>
                          Plan: <strong>{planNom}</strong> — Expire: <strong>{abonnement?.date_fin ? new Date(abonnement.date_fin).toLocaleDateString('fr-FR') : '—'}</strong>
                        </div>
                      </div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.6)', borderRadius: 999, height: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 999, background: joursRest <= 7 ? T.danger : aboActif ? T.success : T.textLight, width: `${Math.min((joursRest / (DUREE_JOURS[abonnement.type] || 30)) * 100, 100)}%` }} />
                    </div>
                    <p style={{ margin: '8px 0 0', fontSize: 9, color: T.textMid }}>{joursRest > 0 ? `${joursRest} jour(s) restants` : 'Abonnement terminé'}</p>
                  </div>
                )}

                {successAbo && (
                  <div style={{ ...card, background: T.successSoft, border: '1px solid rgba(78,166,116,0.25)', padding: isMobile ? '18px' : '28px', marginBottom: 16, textAlign: 'center' }}>
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.7)', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CheckCheck size={22} color="#2e6b46" />
                    </div>
                    <h3 style={{ margin: '0 0 8px', color: '#2e6b46', fontWeight: 800, fontSize: isMobile ? 15 : 17 }}>Activé !</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, margin: '14px 0' }}>
                      <div style={{ background: 'rgba(255,255,255,0.7)', borderRadius: 10, padding: 8 }}><div style={{ fontSize: 8, color: T.textMid }}>Plan</div><div style={{ fontSize: 12, fontWeight: 800 }}>{successAbo.plan_nom || 'Standard'}</div></div>
                      <div style={{ background: 'rgba(255,255,255,0.7)', borderRadius: 10, padding: 8 }}><div style={{ fontSize: 8, color: T.textMid }}>Montant</div><div style={{ fontSize: 12, fontWeight: 800 }}>{parseFloat(successAbo.montant).toLocaleString()} MRU</div></div>
                      <div style={{ background: 'rgba(255,255,255,0.7)', borderRadius: 10, padding: 8 }}><div style={{ fontSize: 8, color: T.textMid }}>Fin</div><div style={{ fontSize: 12, fontWeight: 800 }}>{successAbo.date_fin ? new Date(successAbo.date_fin).toLocaleDateString('fr-FR') : '—'}</div></div>
                    </div>
                    <button onClick={() => { setSuccessAbo(null); setCodeEnvoye(false); setCode(''); }} style={{ background: T.success, color: T.white, border: 'none', borderRadius: 10, padding: '9px 24px', cursor: 'pointer', fontWeight: 700, fontSize: isMobile ? 11 : 13 }}>OK</button>
                  </div>
                )}

                {!successAbo && etapePaiement !== 'retour_trackpay' && demandeEnCours && (
                  <div className="prof-fade" style={{ ...card, ...cardPad }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                      <div style={sectionIconWrap}><Clock size={isMobile ? 14 : 16} color={T.primary} /></div>
                      <h3 style={heading}>Demande en cours</h3>
                    </div>
                    <div style={{ background: 'rgba(194,242,242,0.4)', border: '1px solid rgba(53,98,103,0.2)', borderRadius: 12, padding: isMobile ? '12px 14px' : '16px 20px', marginBottom: 12 }}>
                      <p style={{ margin: '0 0 10px', fontSize: isMobile ? 11 : 12, color: T.primary }}>
                        {demandeEnCours.methode === 'trackpay'
                          ? "Votre paiement TrackPay est en attente de confirmation. L'activation se fait automatiquement dès réception de la confirmation."
                          : "Votre demande d'abonnement est en attente de validation par notre équipe. Vous serez notifié dès qu'elle sera traitée."}
                      </p>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                        <div><div style={{ fontSize: 9, color: T.textMid, fontWeight: 600, marginBottom: 3 }}>Plan demandé</div><div style={{ fontSize: isMobile ? 12 : 13, fontWeight: 700, color: T.navy, textTransform: 'capitalize' }}>{demandeEnCours.type_utilisateur_demande || '—'}</div></div>
                        <div><div style={{ fontSize: 9, color: T.textMid, fontWeight: 600, marginBottom: 3 }}>Méthode</div><div style={{ fontSize: isMobile ? 12 : 13, fontWeight: 700, color: T.navy }}>{methodeLabel(demandeEnCours.methode)}</div></div>
                        <div><div style={{ fontSize: 9, color: T.textMid, fontWeight: 600, marginBottom: 3 }}>Envoyée le</div><div style={{ fontSize: isMobile ? 12 : 13, fontWeight: 700, color: T.navy }}>{demandeEnCours.date_paiement ? new Date(demandeEnCours.date_paiement).toLocaleDateString('fr-FR') : '—'}</div></div>
                      </div>
                    </div>
                    {demandeEnCours.methode === 'trackpay' && (
                      <button type="button" onClick={chargerEtatPaiement} disabled={loadingEtatPaiement} style={{ ...btnGhost, width: '100%', marginBottom: 10, color: T.primary }}>
                        <RefreshCw size={14} /> Vérifier le statut
                      </button>
                    )}
                    <p style={{ margin: 0, fontSize: 10, color: T.textLight, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Info size={12} /> Une seule demande peut être en attente à la fois.
                    </p>
                  </div>
                )}

                {!successAbo && etapePaiement !== 'retour_trackpay' && !demandeEnCours && (
                  <>
                    {dernierRefus && (
                      <div className="prof-fade" style={{ ...card, background: T.dangerSoft, border: `1px solid ${T.dangerBorder}`, padding: isMobile ? '12px 14px' : '16px 20px', marginBottom: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                          <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <XCircle size={16} color={T.danger} />
                          </div>
                          <div style={{ fontWeight: 800, color: '#b3393c', fontSize: isMobile ? 12 : 14 }}>Demande précédente refusée</div>
                        </div>
                        <p style={{ margin: 0, fontSize: isMobile ? 11 : 12, color: '#b3393c' }}>{dernierRefus.raison_refus || "Aucune raison n'a été fournie."}</p>
                      </div>
                    )}

                    {etapePaiement !== 'renouveler' && (
                      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                        {etapesPaiement.map((e, idx) => {
                          const active = etapePaiement === e.id;
                          const done = idx < etapePaiementIndex;
                          const StepIcon = done ? CheckCircle2 : e.Icon;
                          return (
                            <div key={e.id} style={{
                              flex: 1, display: 'flex', alignItems: 'center', gap: 6, padding: isMobile ? '8px 6px' : '10px 12px',
                              borderRadius: 999, background: active ? T.primary : done ? T.primarySoft : T.white,
                              border: `1px solid ${active ? T.primary : T.border}`, justifyContent: 'center',
                            }}>
                              <StepIcon size={isMobile ? 13 : 14} color={active ? T.white : done ? T.primary : T.textLight} />
                              {!isMobile && <span style={{ fontSize: 11, fontWeight: 700, color: active ? T.white : done ? T.primary : T.textLight }}>{e.label}</span>}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {etapePaiement === 'renouveler' && (
                      <div className="prof-fade" style={{ ...card, ...cardPad, textAlign: 'center' }}>
                        <div style={{ width: isMobile ? 52 : 64, height: isMobile ? 52 : 64, borderRadius: '50%', background: T.primarySoft, margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Crown size={isMobile ? 24 : 28} color={T.primary} />
                        </div>
                        <h3 style={{ margin: '0 0 8px', fontSize: isMobile ? 16 : 19, fontWeight: 800, color: T.navy, fontFamily: "'Outfit', sans-serif" }}>Vous avez déjà un abonnement</h3>
                        <p style={{ margin: '0 auto 18px', maxWidth: 380, fontSize: isMobile ? 12 : 13, color: T.textMid, lineHeight: 1.5 }}>
                          Votre abonnement <strong style={{ textTransform: 'capitalize' }}>{planNom}</strong> est actif et expire le{' '}
                          <strong>{abonnement?.date_fin ? new Date(abonnement.date_fin).toLocaleDateString('fr-FR') : '—'}</strong>. Souhaitez-vous le renouveler dès maintenant ?
                        </p>
                        <div style={{ background: 'rgba(235,231,225,0.5)', border: `1px solid ${T.border}`, borderRadius: 12, padding: isMobile ? '12px 14px' : '14px 20px', margin: '0 auto 16px', maxWidth: 380, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, textAlign: 'left' }}>
                          <div><div style={{ fontSize: 9, color: T.textLight, fontWeight: 600, marginBottom: 3 }}>Plan</div><div style={{ fontSize: isMobile ? 12 : 13, fontWeight: 700, color: T.navy, textTransform: 'capitalize' }}>{planNom}</div></div>
                          <div><div style={{ fontSize: 9, color: T.textLight, fontWeight: 600, marginBottom: 3 }}>Durée</div><div style={{ fontSize: isMobile ? 12 : 13, fontWeight: 700, color: T.navy, textTransform: 'capitalize' }}>{dureeLabel(abonnement?.type) || '—'}</div></div>
                          <div><div style={{ fontSize: 9, color: T.textLight, fontWeight: 600, marginBottom: 3 }}>Jours restants</div><div style={{ fontSize: isMobile ? 12 : 13, fontWeight: 700, color: joursRest <= 7 ? T.danger : T.success }}>{joursRest}j</div></div>
                        </div>
                        <div className="duree-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6, margin: '0 auto 16px', maxWidth: 460 }}>
                          {['mensuel', '2_mois', '3_mois', '6_mois', 'annuel'].map(val => {
                            const active = typeAbo === val;
                            return (
                              <div key={val} onClick={() => setTypeAbo(val)} style={{ border: `1.5px solid ${active ? T.primary : T.border}`, borderRadius: 10, padding: '8px 4px', cursor: 'pointer', background: active ? T.primarySoft : T.white, textAlign: 'center' }}>
                                <div style={{ fontSize: isMobile ? 9 : 10, fontWeight: 700, color: active ? T.primary : T.textMid }}>{dureeLabel(val)}</div>
                              </div>
                            );
                          })}
                        </div>
                        {loadingPreview ? (
                          <div style={{ fontSize: 11, color: T.textMid, marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><Loader2 size={14} style={{ animation: 'spin .7s linear infinite' }} /> Calcul en cours...</div>
                        ) : previewRenouvellement && (
                          <div style={{ background: previewRenouvellement.autorise ? T.successSoft : T.dangerSoft, border: `1px solid ${previewRenouvellement.autorise ? 'rgba(78,166,116,0.25)' : T.dangerBorder}`, borderRadius: 12, padding: isMobile ? '12px 14px' : '14px 20px', margin: '0 auto 20px', maxWidth: 380, textAlign: 'left' }}>
                            {previewRenouvellement.autorise ? (
                              <>
                                <div style={{ fontSize: 9, color: '#2e6b46', fontWeight: 600, marginBottom: 3 }}>Nouvelle date de fin</div>
                                <div style={{ fontSize: isMobile ? 13 : 15, fontWeight: 800, color: '#2e6b46', marginBottom: 6 }}>{previewRenouvellement.nouvelle_date_fin ? new Date(previewRenouvellement.nouvelle_date_fin).toLocaleDateString('fr-FR') : '—'}</div>
                                <div style={{ fontSize: 10, color: '#2e6b46' }}>{previewRenouvellement.message}</div>
                              </>
                            ) : (
                              <div style={{ fontSize: 11, color: '#b3393c', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                                <AlertCircle size={14} style={{ marginTop: 1, flexShrink: 0 }} /><span>{previewRenouvellement.message}</span>
                              </div>
                            )}
                          </div>
                        )}
                        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 10, maxWidth: 380, margin: '0 auto' }}>
                          <button type="button" onClick={() => setEtapePaiement('choix')} className="btn-hover" style={{ ...btnPrimary(false), flex: 1 }}>
                            <RefreshCw size={16} /> Renouveler l'abonnement
                          </button>
                        </div>
                      </div>
                    )}

                    {etapePaiement === 'choix' && (
                      <div className="prof-fade" style={{ ...card, ...cardPad }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
                          <div style={sectionIconWrap}><Crown size={isMobile ? 14 : 16} color={T.primary} /></div>
                          <h3 style={heading}>{aboActif && !estEssai ? 'Renouveler' : 'Souscrire'}</h3>
                        </div>

                        {aboActif && abonnement && !estEssai && (
                          <div style={{ background: 'rgba(194,242,242,0.4)', border: '1px solid rgba(53,98,103,0.2)', borderRadius: 12, padding: isMobile ? '10px 14px' : '12px 18px', marginBottom: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                              <Info size={16} color={T.primary} style={{ marginTop: 1, flexShrink: 0 }} />
                              <div style={{ fontSize: isMobile ? 11 : 12, color: T.primary, fontWeight: 500 }}>
                                Vous avez un abonnement <strong style={{ textTransform: 'capitalize' }}>{planNom}</strong> actif avec <strong>{joursRest} jour(s)</strong> restant(s).
                                {joursRest > 5 ? (
                                  <span style={{ display: 'block', marginTop: 4, color: T.navy }}>
                                    Le changement vers un autre plan n'est possible que lorsqu'il reste 5 jours ou moins. Vous pouvez cependant <strong>renouveler votre abonnement actuel</strong> pour prolonger sa durée.
                                  </span>
                                ) : (
                                  <span style={{ display: 'block', marginTop: 4, color: T.navy }}>Vous pouvez changer de plan ou renouveler votre abonnement.</span>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        <form onSubmit={continuerVersPaiement} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                          <div>
                            <label style={label}>Type de compte</label>
                            <div className="plan-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                              {[
                                { val: 'standard', Icon: User, label: 'Standard', desc: 'Usage personnel', price: TARIFS.standard.mensuel },
                                { val: 'entreprise', Icon: Building2, label: 'Entreprise', desc: 'Multi-utilisateurs', price: TARIFS.entreprise.mensuel },
                              ].map(opt => {
                                const active = typeUser === opt.val;
                                const planBloque = aboActif && abonnement && planNom !== 'essai' && abonnement.type_utilisateur !== opt.val && joursRest > 5;
                                const OptIcon = opt.Icon;
                                return (
                                  <div key={opt.val} onClick={() => { if (!planBloque) setTypeUser(opt.val); }} style={{
                                    border: `2px solid ${active ? T.primary : (planBloque ? 'rgba(53,98,103,0.2)' : T.border)}`, borderRadius: 12,
                                    padding: isMobile ? '10px' : '14px', cursor: planBloque ? 'not-allowed' : 'pointer',
                                    background: active ? T.primarySoft : (planBloque ? 'rgba(194,242,242,0.4)' : T.white), opacity: planBloque ? 0.75 : 1, position: 'relative',
                                  }}>
                                    {planBloque && (
                                      <div style={{ position: 'absolute', top: -6, right: -6, background: T.primary, color: '#fff', fontSize: 7, fontWeight: 800, padding: '1px 6px', borderRadius: 10, textTransform: 'uppercase' }}>Bloqué</div>
                                    )}
                                    <OptIcon size={isMobile ? 18 : 20} color={active ? T.primary : (planBloque ? T.primary : T.textLight)} style={{ marginBottom: 6, display: 'block' }} />
                                    <div style={{ fontWeight: 800, fontSize: isMobile ? 12 : 13, color: active ? T.primary : (planBloque ? T.primary : T.navy) }}>{opt.label}</div>
                                    <div style={{ fontSize: 9, color: T.textLight, marginTop: 2 }}>{opt.desc}</div>
                                    <div style={{ fontSize: isMobile ? 13 : 15, fontWeight: 800, color: T.primary, marginTop: 8 }}>{opt.price.toLocaleString()} MRU/mois</div>
                                    {planBloque && <div style={{ fontSize: 8, color: T.primary, marginTop: 4 }}><Lock size={9} style={{ marginRight: 2, verticalAlign: 'middle' }} />{joursRest}j restants</div>}
                                  </div>
                                );
                              })}
                            </div>
                            {aboActif && abonnement && planNom !== 'essai' && (
                              <p style={{ marginTop: 8, fontSize: isMobile ? 10 : 11, color: T.textLight, display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Info size={12} /> Le changement de plan est disponible lorsque votre abonnement arrive à échéance (5 jours ou moins restants).
                              </p>
                            )}
                          </div>

                          <div>
                            <label style={label}>Durée</label>
                            <div className="plan-grid duree-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
                              {[
                                { val: 'mensuel', label: 'Mensuel', duree: '30j', moisEquiv: 1 },
                                { val: '2_mois',  label: '2 Mois',  duree: '60j', moisEquiv: 2 },
                                { val: '3_mois',  label: '3 Mois',  duree: '90j', moisEquiv: 3 },
                                { val: '6_mois',  label: '6 Mois',  duree: '180j', moisEquiv: 6 },
                                { val: 'annuel',  label: 'Annuel',  duree: '365j', moisEquiv: 12 },
                              ].map(opt => {
                                const active = typeAbo === opt.val;
                                const price = TARIFS[typeUser][opt.val];
                                const prixPlein = TARIFS[typeUser].mensuel * opt.moisEquiv;
                                const economiePct = opt.moisEquiv > 1 ? Math.round((1 - price / prixPlein) * 100) : 0;
                                return (
                                  <div key={opt.val} onClick={() => setTypeAbo(opt.val)} style={{ border: `2px solid ${active ? T.primary : T.border}`, borderRadius: 12, padding: isMobile ? '8px 6px' : '12px 10px', cursor: 'pointer', background: active ? T.primarySoft : T.white, textAlign: 'center' }}>
                                    <div style={{ fontWeight: 800, fontSize: isMobile ? 10 : 12, color: active ? T.primary : T.navy }}>{opt.label}</div>
                                    <div style={{ fontSize: isMobile ? 12 : 14, fontWeight: 800, color: T.navy, margin: '4px 0' }}>{price.toLocaleString()}</div>
                                    <div style={{ fontSize: 8, color: T.textLight }}>MRU · {opt.duree}</div>
                                    {economiePct > 0 && <div style={{ fontSize: 7, color: T.success, marginTop: 3, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}><Gift size={8} /> -{economiePct}%</div>}
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          <div style={{ background: 'rgba(235,231,225,0.5)', border: `1px solid ${T.border}`, borderRadius: 12, padding: isMobile ? '10px 14px' : '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: isMobile ? 11 : 12, color: T.textMid, fontWeight: 600 }}>Montant à régler</span>
                            <span style={{ fontSize: isMobile ? 15 : 17, color: T.primary, fontWeight: 800 }}>{montantCalc.toLocaleString()} MRU</span>
                          </div>

                          {previewRenouvellement && (
                            <div style={{ background: previewRenouvellement.autorise ? 'rgba(194,242,242,0.4)' : T.dangerSoft, border: `1px solid ${previewRenouvellement.autorise ? 'rgba(53,98,103,0.2)' : T.dangerBorder}`, borderRadius: 12, padding: isMobile ? '10px 14px' : '12px 18px', fontSize: 11, color: previewRenouvellement.autorise ? T.primary : '#b3393c', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                              {previewRenouvellement.autorise ? <Info size={14} style={{ marginTop: 1, flexShrink: 0 }} /> : <AlertCircle size={14} style={{ marginTop: 1, flexShrink: 0 }} />}
                              <span>
                                {previewRenouvellement.autorise
                                  ? `${previewRenouvellement.message} Nouvelle date de fin : ${previewRenouvellement.nouvelle_date_fin ? new Date(previewRenouvellement.nouvelle_date_fin).toLocaleDateString('fr-FR') : '—'}.`
                                  : previewRenouvellement.message}
                              </span>
                            </div>
                          )}

                          {aboActif && abonnement && planNom !== 'essai' && abonnement.type_utilisateur !== typeUser && joursRest > 5 && (
                            <div style={{ background: 'rgba(194,242,242,0.4)', border: '1px solid rgba(53,98,103,0.2)', borderRadius: 12, padding: isMobile ? '10px 14px' : '12px 18px', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                              <AlertCircle size={16} color={T.primary} style={{ marginTop: 1, flexShrink: 0 }} />
                              <div style={{ fontSize: isMobile ? 11 : 12, color: T.primary, fontWeight: 500 }}>
                                Vous ne pouvez pas souscrire à un abonnement <strong style={{ textTransform: 'capitalize' }}>{typeUser}</strong>{' '}
                                lorsque votre abonnement <strong style={{ textTransform: 'capitalize' }}>{planNom}</strong> est actif et qu'il reste <strong>{joursRest} jour(s)</strong>.
                                <span style={{ display: 'block', marginTop: 4 }}>Le changement de plan n'est possible que lorsqu'il reste 5 jours ou moins.</span>
                              </div>
                            </div>
                          )}

                          <div style={{ display: 'flex', gap: 8 }}>
                            <button
                              type="submit"
                              disabled={(aboActif && abonnement && planNom !== 'essai' && abonnement.type_utilisateur !== typeUser && joursRest > 5)}
                              className="btn-hover"
                              style={{ ...btnPrimary(aboActif && abonnement && planNom !== 'essai' && abonnement.type_utilisateur !== typeUser && joursRest > 5), flex: 1 }}
                            >
                              <ArrowRight size={16} />
                              {aboActif && abonnement && planNom !== 'essai' && abonnement.type_utilisateur !== typeUser && joursRest > 5 ? 'Plan bloqué' : 'Continuer vers le paiement'}
                            </button>
                            {aboActif && !estEssai && (
                              <button type="button" onClick={() => setEtapePaiement('renouveler')} style={btnGhost}>Retour</button>
                            )}
                          </div>
                        </form>
                      </div>
                    )}

                    {etapePaiement === 'email' && (
                      <div className="prof-fade" style={{ ...card, ...cardPad }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
                          <div style={sectionIconWrap}><Mail size={isMobile ? 14 : 16} color={T.primary} /></div>
                          <h3 style={heading}>Vérification de l'email</h3>
                        </div>
                        <div style={{ background: 'rgba(235,231,225,0.5)', border: `1px solid ${T.border}`, borderRadius: 12, padding: isMobile ? '10px 14px' : '12px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                          <span style={{ fontSize: isMobile ? 11 : 12, color: T.textMid, fontWeight: 700, textTransform: 'capitalize' }}>{typeUser} — {dureeLabel(typeAbo)}</span>
                          <span style={{ fontSize: isMobile ? 13 : 14, color: T.primary, fontWeight: 800 }}>{montantCalc.toLocaleString()} MRU</span>
                        </div>

                        {!codeEnvoye ? (
                          <form onSubmit={demanderCode} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div>
                              <label style={label}>Email</label>
                              <div style={{ position: 'relative' }}>
                                <Mail size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: T.textLight }} />
                                <input type="email" value={emailAbo} onChange={e => setEmailAbo(e.target.value)} required placeholder="votre@email.com" className="prof-input" style={input({ paddingLeft: 36 })} />
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button type="submit" disabled={loadingCode} className="btn-hover" style={{ ...btnPrimary(loadingCode), flex: 2 }}>
                                {loadingCode ? <><Loader2 size={16} style={{ animation: 'spin .7s linear infinite' }} /> Envoi...</> : <><Mail size={15} /> Recevoir code</>}
                              </button>
                              <button type="button" onClick={() => setEtapePaiement('choix')} style={{ ...btnGhost, flex: 1 }}>Retour</button>
                            </div>
                          </form>
                        ) : (
                          <form onSubmit={verifierCodeEtContinuer} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <div style={{ background: T.primarySoft, borderRadius: 10, padding: '8px 12px', fontSize: 11, color: T.primary, display: 'flex', alignItems: 'center', gap: 6 }}>
                              <MailOpen size={13} /> Code envoyé à <strong>{emailAbo}</strong>
                            </div>
                            <div>
                              <label style={label}>Code</label>
                              <input type="text" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} required maxLength={6} placeholder="000000" className="prof-input" style={input({ fontSize: isMobile ? 22 : 28, fontWeight: 800, textAlign: 'center', letterSpacing: isMobile ? 6 : 8, color: T.primary, fontFamily: "'Outfit', monospace", padding: isMobile ? 12 : 14, border: `2px solid ${T.border}` })} />
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button type="submit" disabled={code.length !== 6} style={{ ...btnSuccess(code.length !== 6), flex: 2 }}>Continuer</button>
                              <button type="button" onClick={() => { setCodeEnvoye(false); setCode(''); }} style={{ ...btnGhost, flex: 1 }}>Retour</button>
                            </div>
                            <button type="button" onClick={demanderCode} disabled={loadingCode} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.primary, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                              <RefreshCw size={13} /> Renvoyer
                            </button>
                          </form>
                        )}
                      </div>
                    )}

                    {etapePaiement === 'methode' && (
                      <div className="prof-fade" style={{ ...card, ...cardPad }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
                          <div style={sectionIconWrap}><CreditCard size={isMobile ? 14 : 16} color={T.primary} /></div>
                          <h3 style={heading}>Choisissez votre méthode de paiement</h3>
                        </div>

                        {loadingCompte ? (
                          <div style={{ textAlign: 'center', padding: '24px 0', color: T.textMid, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><Loader2 size={16} style={{ animation: 'spin .7s linear infinite' }} /> Chargement...</div>
                        ) : (
                          <>
                            <div className="plan-grid methode-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 18 }}>
                              {[
                                { val: 'rssbank', logo: logoRSSBank,  label: 'RSSBank',  badge: null },
                                { val: 'sedad',   logo: logoSedad,    label: 'Sedad',    badge: null },
                                { val: 'bankily', logo: logoBankily,  label: 'Bankily',  badge: null },
                                { val: 'masrivi', logo: logoMasrivi,  label: 'Masrivi',  badge: null },
                                { val: 'trackpay', Icon: Zap,         label: 'TrackPay', badge: 'Automatique' },
                              ].map(opt => {
                                const active = methodePaiement === opt.val;
                                const OptIcon = opt.Icon;
                                return (
                                  <div key={opt.val} onClick={() => choisirMethodePaiement(opt.val)} style={{ border: `2px solid ${active ? T.primary : T.border}`, borderRadius: 12, padding: isMobile ? '12px 8px' : '16px 12px', cursor: 'pointer', background: active ? T.primarySoft : T.white, textAlign: 'center', position: 'relative' }}>
                                    {opt.badge && <span style={{ position: 'absolute', top: 4, right: 4, fontSize: 7, fontWeight: 800, color: T.success, background: T.successSoft, borderRadius: 6, padding: '1px 4px' }}>{opt.badge}</span>}
                                    {opt.logo ? (
                                      <div style={{
                                        width: isMobile ? 34 : 40, height: isMobile ? 34 : 40, borderRadius: 10, overflow: 'hidden',
                                        margin: '0 auto 6px', border: `1.5px solid ${active ? T.primary : T.border}`, background: T.white,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                      }}>
                                        <img src={opt.logo} alt={opt.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                      </div>
                                    ) : (
                                      <div style={{
                                        width: isMobile ? 34 : 40, height: isMobile ? 34 : 40, borderRadius: '50%', margin: '0 auto 6px',
                                        background: active
                                          ? `linear-gradient(135deg, ${T.primary}, ${T.primaryDark})`
                                          : `linear-gradient(135deg, ${T.success}, ${T.primary})`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        boxShadow: '0 2px 8px rgba(53,98,103,0.3)',
                                      }}>
                                        <OptIcon size={isMobile ? 16 : 19} color="#fff" />
                                      </div>
                                    )}
                                    <div style={{ fontWeight: 800, fontSize: isMobile ? 10 : 12, color: active ? T.primary : T.navy, fontFamily: "'Outfit', sans-serif" }}>{opt.label}</div>
                                  </div>
                                );
                              })}
                            </div>

                            {methodePaiement && methodePaiement !== 'trackpay' && (
                              <div className="prof-fade" style={{ background: 'rgba(235,231,225,0.5)', border: `1px solid ${T.border}`, borderRadius: 12, padding: isMobile ? '14px' : '18px', marginBottom: 16 }}>
                                {(() => {
                                  const compte = getCompteForMethode(methodePaiement);
                                  if (!compte) return <div style={{ fontSize: 11, color: T.textMid, display: 'flex', alignItems: 'center', gap: 6 }}><AlertCircle size={14} /> Informations de paiement indisponibles pour le moment.</div>;
                                  return (
                                    <>
                                      <div style={{ fontSize: 11, color: T.textMid, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <Info size={14} color={T.primary} /> Allez sur <strong>{methodeLabel(methodePaiement)}</strong> pour effectuer le paiement, puis faites une capture d'écran de la confirmation.
                                      </div>
                                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                        <div><div style={{ fontSize: 9, color: T.textLight, fontWeight: 600, marginBottom: 3 }}>{methodePaiement === 'rssbank' ? 'Email' : 'Numéro de téléphone'}</div><div style={{ fontSize: isMobile ? 12 : 13, fontWeight: 700, color: T.navy }}>{compte.numero_compte}</div></div>
                                        <div><div style={{ fontSize: 9, color: T.textLight, fontWeight: 600, marginBottom: 3 }}>Titulaire</div><div style={{ fontSize: isMobile ? 12 : 13, fontWeight: 700, color: T.navy }}>{compte.nom_titulaire}</div></div>
                                      </div>
                                      {compte.instructions && <div style={{ marginTop: 10, fontSize: 11, color: T.textMid, lineHeight: 1.5 }}>{compte.instructions}</div>}
                                    </>
                                  );
                                })()}
                              </div>
                            )}

                            {methodePaiement === 'trackpay' && (
                              <div className="prof-fade" style={{ background: T.successSoft, border: '1px solid rgba(78,166,116,0.25)', borderRadius: 12, padding: isMobile ? '14px' : '18px', marginBottom: 16, fontSize: 11, color: '#2e6b46', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <ShieldCheck size={16} /> Vous allez être redirigé vers TrackPay pour effectuer le paiement. Votre abonnement sera activé automatiquement dès la confirmation, sans capture d'écran ni validation manuelle.
                              </div>
                            )}

                            <div style={{ display: 'flex', gap: 8 }}>
                              {methodePaiement === 'trackpay' ? (
                                <button type="button" disabled={loadingTrackPay} onClick={lancerPaiementTrackPay} className="btn-hover" style={{ ...btnSuccess(loadingTrackPay), flex: 2 }}>
                                  {loadingTrackPay ? <><Loader2 size={16} style={{ animation: 'spin .7s linear infinite' }} /> Redirection...</> : <><Wallet size={15} /> Payer avec TrackPay</>}
                                </button>
                              ) : (
                                <button type="button" disabled={!methodePaiement || !getCompteForMethode(methodePaiement)} onClick={() => setEtapePaiement('upload')} className="btn-hover" style={{ ...btnPrimary(!methodePaiement || !getCompteForMethode(methodePaiement)), flex: 2 }}>
                                  <ArrowRight size={16} /> Continuer
                                </button>
                              )}
                              <button type="button" onClick={() => setEtapePaiement('email')} style={{ ...btnGhost, flex: 1 }}>Retour</button>
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {etapePaiement === 'upload' && (
                      <div className="prof-fade" style={{ ...card, ...cardPad }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
                          <div style={sectionIconWrap}><ImageIcon size={isMobile ? 14 : 16} color={T.primary} /></div>
                          <h3 style={heading}>Confirmez votre paiement</h3>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                          <div>
                            <label style={label}>Capture d'écran de confirmation</label>
                            <div style={{ border: `2px dashed ${capturePreview ? T.primary : T.border}`, borderRadius: 10, padding: 20, textAlign: 'center', background: 'rgba(235,231,225,0.4)', cursor: 'pointer', position: 'relative' }} onClick={() => document.getElementById('capture-file-input-abonnement').click()}>
                              <input id="capture-file-input-abonnement" type="file" accept="image/*" onChange={handleCaptureChange} style={{ display: 'none' }} />
                              {capturePreview ? (
                                <div style={{ position: 'relative', display: 'inline-block', maxWidth: '100%' }}>
                                  <img src={capturePreview} alt="Aperçu" style={{ maxHeight: 160, borderRadius: 10, maxWidth: '100%' }} />
                                  <div style={{ fontSize: 11, color: T.textMid, marginTop: 8 }}>Cliquez pour modifier l'image</div>
                                </div>
                              ) : (
                                <>
                                  <UploadCloud size={32} color={T.textLight} style={{ marginBottom: 8 }} />
                                  <div style={{ fontSize: 12, fontWeight: 600, color: T.textMid }}>Glissez ou cliquez pour ajouter l'image</div>
                                  <div style={{ fontSize: 10, color: T.textLight, marginTop: 4 }}>Format JPG, PNG (Max 5 Mo)</div>
                                </>
                              )}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button type="button" disabled={loadingEnvoiPaiement || !captureFile} onClick={envoyerPaiement} className="btn-hover" style={{ ...btnSuccess(loadingEnvoiPaiement || !captureFile), flex: 2 }}>
                              {loadingEnvoiPaiement ? <><Loader2 size={16} style={{ animation: 'spin .7s linear infinite' }} /> Envoi...</> : <><ShieldCheck size={15} /> Valider le paiement</>}
                            </button>
                            <button type="button" onClick={() => setEtapePaiement('methode')} style={{ ...btnGhost, flex: 1 }}>Retour</button>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        )}

        {/* TAB — CONTACT */}
        {activeTab === 'contact' && (
          <div className="prof-fade" style={{ ...card, ...cardPad }}>
            {msgContact && (
              <div style={banner(msgContact.type)}>
                {msgContact.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                {msgContact.text}
              </div>
            )}
            {isVisitor && (
              <div style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 12, background: T.successSoft, border: '1px solid rgba(69,144,113,0.25)', color: '#2e6b46', fontSize: isMobile ? 11 : 12, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 10 }}>
                <Search size={20} />
                <div style={{ flex: 1 }}><strong>Mode Exploration</strong> — L'envoi de messages est désactivé.</div>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <div style={sectionIconWrap}><Headphones size={isMobile ? 14 : 16} color={T.primary} /></div>
              <h3 style={heading}>Contacter le support</h3>
            </div>
            <p style={{ margin: '0 0 16px', color: T.textMid, fontSize: isMobile ? 11 : 12 }}>
              {isVisitor ? 'Connectez-vous pour contacter le support' : 'Une question ? Écrivez-nous.'}
            </p>
            <form onSubmit={handleContact} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <textarea
                value={isVisitor ? '' : formContact}
                onChange={e => !isVisitor && setFormContact(e.target.value)}
                placeholder={isVisitor ? 'Mode Exploration - Contact désactivé' : 'Décrivez votre problème...'}
                rows={4}
                required={!isVisitor}
                disabled={isVisitor}
                className="prof-input"
                style={input({
                  resize: 'vertical', lineHeight: 1.5, fontFamily: "'DM Sans', sans-serif",
                  ...(isVisitor ? { cursor: 'not-allowed', border: '1.5px solid rgba(69,144,113,0.3)', background: T.successSoft, color: '#2e6b46' } : {}),
                })}
              />
              <button type="submit" disabled={loadingContact || isVisitor} className="btn-hover" style={{ ...btnPrimary(loadingContact || isVisitor), width: '100%' }}>
                {isVisitor ? <><Lock size={15} /> Mode Exploration</> : loadingContact ? <><Loader2 size={16} style={{ animation: 'spin .7s linear infinite' }} /> Envoi...</> : <><Send size={15} /> Envoyer</>}
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}