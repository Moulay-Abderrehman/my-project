// frontend/src/api/kycService.js
// ══════════════════════════════════════════════════════════════════════════════
// Service KYC — synchronisé avec les vrais endpoints du backend
//
// ❌ PROBLÈME dans ton code original:
//   uploadDocument()  → appelait /kyc/upload-document/   (n'existe pas)
//   confirmDocument() → appelait /kyc/confirm-document/  (n'existe pas)
//   uploadSelfie()    → appelait /kyc/selfie-capture/    (n'existe pas)
//   verifyFace()      → appelait /kyc/face-verify/       (n'existe pas)
//
// ✅ CORRECTION — Les vrais endpoints sont:
//   OCR extract  → POST /api/comptes/kyc/ocr/
//   Confirm data → POST /api/comptes/kyc/confirm/
//   Face verify  → POST /api/comptes/kyc/face/
//   Status       → GET  /api/comptes/kyc/status/
// ══════════════════════════════════════════════════════════════════════════════

import api from './axios';  // ← Utilise ton instance axios configurée, pas axios brut

const kycService = {
  /**
   * Étape 2: Envoyer l'image du document à l'API OCR
   * Backend: POST /api/comptes/kyc/ocr/
   * 
   * @param {File} documentFile - Le fichier image (JPG/PNG)
   * @returns {Object} { status, nni, nom_fr, prenom_fr, birth_date, gender, nationality, face_image_base64, ... }
   */
  extractDocument: async (documentFile) => {
    const formData = new FormData();
    // ✅ Le backend attend le champ 'file' (request.FILES.get('file'))
    formData.append('file', documentFile);

    const response = await api.post(
      '/comptes/kyc/ocr/',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,  // 60s car l'API OCR Railway peut être lente
      }
    );
    return response.data;
  },

  /**
   * Étape 3: Confirmer les données OCR extraites
   * Backend: POST /api/comptes/kyc/confirm/
   * 
   * @param {string} userId - L'ID de l'utilisateur (temp_user_id depuis localStorage)
   * @param {Object} extractedData - Les données retournées par extractDocument()
   * @returns {Object} { status, message, has_face_reference }
   */
  confirmData: async (userId, extractedData) => {
    const response = await api.post(
      '/comptes/kyc/confirm/',
      {
        user_id:           userId,
        nni:               extractedData.nni || '',
        nom_fr:            extractedData.nom_fr || '',
        prenom_fr:         extractedData.prenom_fr || '',
        birth_date:        extractedData.birth_date || '',
        birth_place:       extractedData.birth_place || '',
        gender:            extractedData.gender || '',
        nationality:       extractedData.nationality || 'MRT',
        document_type:     extractedData.document_type || 'cni',
        face_image_base64: extractedData.face_image_base64 || '',
        document_full_image_base64: extractedData.document_full_image_base64 || '',
      },
      { timeout: 15000 }
    );
    return response.data;
  },

  /**
   * Étape 4: Envoyer le selfie pour vérification faciale (Nova Face API)
   * Backend: POST /api/comptes/kyc/face/
   * 
   * Le backend gère en interne:
   *   1. Enrôlement du visage du document dans Nova (/face/enroll)
   *   2. Vérification du selfie (/face/verify)
   *   3. Si decision == "allow" → compte activé + tokens JWT retournés
   * 
   * @param {string} userId - L'ID de l'utilisateur
   * @param {Blob}   selfieBlob - Le selfie capturé (Blob image/jpeg)
   * @returns {Object} { verified, similarity_score, liveness_score, access_token, refresh_token, ... }
   */
  verifyFace: async (userId, selfieBlob) => {
    const formData = new FormData();
    // ✅ Le backend attend 'user_id' (form data) + 'selfie' (file)
    formData.append('user_id', userId);
    formData.append('selfie', selfieBlob, 'selfie.jpg');

    const response = await api.post(
      '/comptes/kyc/face/',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 45000,  // 45s pour Nova API
      }
    );
    return response.data;
  },

  /**
   * Obtenir le statut KYC de l'utilisateur connecté
   * Backend: GET /api/comptes/kyc/status/
   * Nécessite un token JWT (utilisateur connecté)
   * 
   * @returns {Object} { is_kyc_verified, kyc_status, can_proceed_to_face, ... }
   */
  getStatus: async () => {
    const response = await api.get(
      '/comptes/kyc/status/',
      { timeout: 10000 }
    );
    return response.data;
  },
};

export default kycService;