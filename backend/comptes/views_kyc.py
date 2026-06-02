# backend/comptes/views_kyc.py
# ══════════════════════════════════════════════════════════════════════════════
# Vues KYC — OCR + Face ID (avec vraie Nova Face API)
# ══════════════════════════════════════════════════════════════════════════════

import io
import base64
import requests as req_lib

from django.utils import timezone
from django.core.files.base import ContentFile
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated

import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# ── Clés et URLs des APIs ─────────────────────────────────────────────────────
OCR_API_URL = "https://ocr-id-verifier-production.up.railway.app/api/v1/extract"
OCR_API_KEY = "wwlktweksjnfwkjekljsdjgkhkjfhgoierojnerosoreirnnkjfwopiwerutyubvawjoienejfn"

NOVA_API_BASE = "http://51.20.136.48:8000"
NOVA_API_KEY  = "nova_key_3aa656e2bac2ea102ec2c56c196bcf6d"

FACE_ENROLL_URL = f"{NOVA_API_BASE}/face/enroll"   # POST /face/enroll
FACE_VERIFY_URL = f"{NOVA_API_BASE}/face/verify"   # POST /face/verify

# ── Seuil de similarité (Nova retourne 0.0–1.0, on compare direct) ────────────
# Nova utilise son propre seuil interne (0.75), on se fie à decision: "allow"
FACE_SIMILARITY_SEUIL = 40.0  # pour affichage seulement


# ══════════════════════════════════════════════════════════════════════════════
# FONCTIONS UTILITAIRES NOVA FACE API
# ══════════════════════════════════════════════════════════════════════════════

def nova_enroll(user_id: str, image_bytes: bytes, filename: str = "face.jpg") -> dict:
    """
    Enrôle un visage dans Nova Face API.
    Endpoint: POST /face/enroll
    """
    try:
        if not image_bytes or len(image_bytes) < 100:
            raise Exception("L'image est trop petite ou vide")
        
        # ✅ Utiliser le même format que curl qui a fonctionné
        files = {
            'file': (filename, image_bytes, 'image/jpeg')
        }
        
        headers = {
            'Secure-Nova-Key': NOVA_API_KEY
        }
        
        data = {
            'user_id': str(user_id)
        }
        
        print(f"[KYC] Envoi à Nova: {FACE_ENROLL_URL}")
        print(f"[KYC] user_id: {user_id}")
        print(f"[KYC] taille image: {len(image_bytes)} bytes")
        
        resp = req_lib.post(
            FACE_ENROLL_URL,
            headers=headers,
            files=files,
            data=data,
            timeout=30,
        )
        
        print(f"[KYC] Nova response status: {resp.status_code}")
        print(f"[KYC] Nova response: {resp.text[:500]}")
        
        resp.raise_for_status()
        return resp.json()
        
    except req_lib.exceptions.Timeout:
        raise Exception("Nova Face API timeout lors de l'enrôlement")
    except req_lib.exceptions.RequestException as e:
        raise Exception(f"Erreur Nova enroll: {str(e)}")



def nova_verify(user_id: str, selfie_bytes: bytes, filename: str = "selfie.jpg") -> dict:
    """
    Vérifie un selfie contre le visage enrôlé.
    """
    try:
        # ✅ Vérifier que l'image n'est pas vide
        if not selfie_bytes or len(selfie_bytes) < 100:
            raise Exception("L'image du selfie est trop petite ou vide")
        
        # ✅ Formater correctement l'image
        from PIL import Image
        import io
        
        image = Image.open(io.BytesIO(selfie_bytes))
        if image.mode in ('RGBA', 'P'):
            image = image.convert('RGB')
        
        # Redimensionner si trop grande
        max_size = 1024
        if image.width > max_size or image.height > max_size:
            image.thumbnail((max_size, max_size), Image.LANCZOS)
        
        img_byte_arr = io.BytesIO()
        image.save(img_byte_arr, format='JPEG', quality=85)
        img_byte_arr.seek(0)
        
        files = {
            'file': (filename, img_byte_arr, 'image/jpeg') 
        }
        
        headers = {
            'Secure-Nova-Key': NOVA_API_KEY
        }
        
        data = {
            'user_id': user_id
        }
        
        print(f"[KYC] Vérification Nova pour user_id: {user_id}")
        
        resp = req_lib.post(
            FACE_VERIFY_URL,
            headers=headers,
            files=files,
            data=data,
            timeout=30,
        )
        
        print(f"[KYC] Nova verify status: {resp.status_code}")
        
        resp.raise_for_status()
        return resp.json()
        
    except req_lib.exceptions.Timeout:
        raise Exception("Nova Face API timeout lors de la vérification")
    except req_lib.exceptions.RequestException as e:
        raise Exception(f"Erreur Nova verify: {str(e)}")

def base64_to_bytes(b64_string: str) -> bytes | None:
    """
    Convertit une chaîne base64 (avec ou sans header data URI) en bytes.
    Retourne None si la chaîne est vide ou invalide.
    """
    if not b64_string:
        return None
    try:
        # Supprimer le header data URI si présent
        if "," in b64_string:
            b64_string = b64_string.split(",", 1)[1]
        return base64.b64decode(b64_string)
    except Exception:
        return None


# ══════════════════════════════════════════════════════════════════════════════
# VUE 1 : Extraction OCR du document
# ══════════════════════════════════════════════════════════════════════════════
class KYCOCRExtractView(APIView):
    permission_classes = [AllowAny]
    
    # Seuil minimum de confiance pour accepter le document
    CONFIDENCE_MIN = 25

    def calculate_confidence_score(self, ocr_data, face_b64):
        """Calcule le score de confiance (0-100) basé sur les données extraites"""
        score = 0
        
        # 1. NNI (30 pts - le plus important)
        nni = ocr_data.get('nni', '')
        if nni and len(nni) >= 10:
            score += 30
        elif nni and len(nni) >= 8:
            score += 20
        elif nni:
            score += 10
        
        # 2. Nom (15 pts)
        nom = ocr_data.get('last_name_fl', '')
        if nom and len(nom) >= 3 and not any(c.isdigit() for c in nom):
            score += 15
        elif nom and len(nom) >= 2:
            score += 8
        
        # 3. Prénom (15 pts)
        prenom = ocr_data.get('first_name_fl', '')
        if prenom and len(prenom) >= 3 and not any(c.isdigit() for c in prenom):
            score += 15
        elif prenom and len(prenom) >= 2:
            score += 8
        
        # 4. Nom du père (10 pts) ← NOUVEAU
        father_name = ocr_data.get('father_name', '') or ocr_data.get('father_given_name', '')
        if father_name and len(father_name) >= 3:
            score += 10
        elif father_name:
            score += 5
        
        # 5. Date de naissance (10 pts)
        birth_date = ocr_data.get('birth_date', '')
        if birth_date:
            import re
            if re.match(r'\d{4}-\d{2}-\d{2}', birth_date):
                score += 10
            elif re.match(r'\d{2}/\d{2}/\d{4}', birth_date):
                score += 7
            else:
                score += 3
        
        # 6. Lieu de naissance (8 pts)
        birth_place = ocr_data.get('birth_place_fl', '')
        if birth_place and len(birth_place) >= 3:
            score += 8
        elif birth_place:
            score += 4
        
        # 7. Sexe (4 pts)
        gender = ocr_data.get('gender', '')
        if gender in ['M', 'F', 'Masculin', 'Féminin', 'Male', 'Female']:
            score += 4
        
        # 8. Visage extrait (3 pts)
        if face_b64:
            score += 3
        
        return min(score, 100)

    def get_confidence_message(self, score):
        """Retourne un message adapté au score de confiance"""
        if score >= 85:
            return "✅ Document parfaitement reconnu"
        elif score >= 60:
            return "⚠️ Document correctement reconnu, vérifiez les données"
        elif score >= self.CONFIDENCE_MIN:
            return "⚠️ Lecture partielle, veuillez vérifier et corriger"
        else:
            return "❌ Document illisible, veuillez prendre une meilleure photo"

    def post(self, request):
        # Récupérer l'image
        image_file = request.FILES.get('file')
        
        if not image_file:
            return Response({'error': 'Aucune image fournie.'}, status=400)
        
        if image_file.size > 10 * 1024 * 1024:
            return Response({'error': 'L\'image ne doit pas dépasser 10 Mo.'}, status=400)
        
        NOVA_OCR_URL = "https://cheikhabdelkader.pythonanywhere.com/ocr"
        
        try:
            image_data = image_file.read()
            files = {'id_card': (image_file.name, image_data, image_file.content_type)}
            
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': '*/*',
                'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
                'Origin': 'https://cheikhabdelkader.pythonanywhere.com',
                'Referer': 'https://cheikhabdelkader.pythonanywhere.com/'
            }
            
            resp = req_lib.post(NOVA_OCR_URL, files=files, headers=headers, timeout=60, verify=False)
            
            if resp.status_code != 200:
                return Response({'error': f"L'API OCR a refusé l'image: {resp.text}"}, status=resp.status_code)
            
            data = resp.json()
            
        except req_lib.exceptions.Timeout:
            return Response({'error': "L'API OCR ne répond pas. Réessayez."}, status=504)
        except req_lib.exceptions.ConnectionError as e:
            return Response({'error': f"Impossible de contacter l'API OCR: {str(e)}"}, status=502)
        except Exception as e:
            return Response({'error': f'Erreur OCR: {str(e)}'}, status=500)
        
        # Extraire les données
        ocr_data = data.get('data', {})
        images_data = data.get('images', {})
        
        def clean(value):
            return str(value).strip() if value else ''
        
        nni         = clean(ocr_data.get('nni'))
        nom         = clean(ocr_data.get('last_name_fl'))
        prenom      = clean(ocr_data.get('first_name_fl'))
        birth_date  = clean(ocr_data.get('birth_date'))
        birth_place = clean(ocr_data.get('birth_place_fl'))
        gender      = clean(ocr_data.get('gender'))
        nationality = clean(ocr_data.get('nationality_iso', 'MRT'))
        face_b64    = images_data.get('base64', '')
        father_name = clean(ocr_data.get('father_name')) or clean(ocr_data.get('father_given_name'))
        father_name_ar = clean(ocr_data.get('father_name_ar')) or clean(ocr_data.get('father_given_name_ar'))
        
        # Stocker l'image complète du document pour la vérification faciale
        document_full_image_b64 = base64.b64encode(image_data).decode()
        
        # Normaliser le sexe
        if gender:
            gender = 'M' if gender.upper() == 'M' else 'F' if gender.upper() == 'F' else gender
        
        # ═══════════════════════════════════════════════════════════════════
        # CALCUL ET VÉRIFICATION DU SCORE DE CONFIANCE
        # ═══════════════════════════════════════════════════════════════════
        confidence_score = self.calculate_confidence_score(ocr_data, face_b64)
        confidence_message = self.get_confidence_message(confidence_score)
        
        print(f"[Nova OCR] Score de confiance: {confidence_score}%")
        print(f"[Nova OCR] NNI={nni}, Nom={nom}, Prénom={prenom}")
        print(f"[Nova OCR] Visage extrait: {'OUI' if face_b64 else 'NON'}")
        
        # ═══════════════════════════════════════════════════════════════════
        # ❌ SI CONFIDENCE ≤ 25% → BLOQUER ET DEMANDER UNE MEILLEURE PHOTO
        # ═══════════════════════════════════════════════════════════════════
        if confidence_score <= self.CONFIDENCE_MIN:
            return Response({
                'status': 'error',
                'confidence_score': confidence_score,
                'confidence_message': confidence_message,
                'error': 'DOCUMENT_ILLISIBLE',
                'message': '❌ La qualité de l\'image est insuffisante. Veuillez prendre une photo plus claire et mieux éclairée.',
                'suggestion': 'Assurez-vous que le document est bien cadré, sans reflets ni ombres, et que le texte est net.',
                'can_retry': True
            }, status=422)
        
        # ═══════════════════════════════════════════════════════════════════
        # ✅ SI CONFIDENCE > 25% → CONTINUER NORMALEMENT
        # ═══════════════════════════════════════════════════════════════════
        return Response({
            'status': 'success',
            'confidence_score': confidence_score,
            'confidence_message': confidence_message,
            'document_type': 'cni',
            'nni': nni,
            'nom_fr': nom,
            'prenom_fr': prenom,
            'nom_ar': '',
            'prenom_ar': '',
            'father_name': father_name,           
            'father_name_ar': father_name_ar, 
            'birth_date': birth_date,
            'birth_place': birth_place,
            'gender': gender,
            'nationality': nationality,
            'face_image_base64': face_b64,
            'document_full_image_base64': document_full_image_b64,  
            'has_face_image': bool(face_b64),
            'raw_data': ocr_data,
        })

# ══════════════════════════════════════════════════════════════════════════════
# VUE 2 : Confirmation des données OCR
# ══════════════════════════════════════════════════════════════════════════════
class KYCConfirmDataView(APIView):
    """
    Enregistre les données OCR sur le profil utilisateur.
    Appelé après que l'utilisateur a confirmé ses informations.

    """
    permission_classes = [AllowAny]

    def post(self, request):
        from .models import Utilisateur

        user_id = request.data.get('user_id')
        if not user_id:
            return Response({'error': 'user_id requis.'}, status=400)

        try:
            user = Utilisateur.objects.get(id=user_id)
        except Utilisateur.DoesNotExist:
            return Response({'error': 'Utilisateur introuvable.'}, status=404)

        # Enregistrer les données OCR
        user.nni               = request.data.get('nni', '') or ''
        user.nom_fr            = request.data.get('nom_fr', '') or ''
        user.prenom_fr         = request.data.get('prenom_fr', '') or ''
        user.father_name       = request.data.get('father_name', '') or ''
        user.father_name_ar    = request.data.get('father_name_ar', '') or ''
        user.gender            = request.data.get('gender', '') or ''
        user.nationality       = request.data.get('nationality', 'MRT') or 'MRT'
        user.birth_place       = request.data.get('birth_place', '') or ''
        user.kyc_document_type = request.data.get('document_type', 'cni') or 'cni'

        # Stocker le visage base64 (référence pour Nova enroll)
        face_b64 = (
            request.data.get('face_image_base64', '') or
            request.data.get('fallback_crop_base64', '') or ''
        )
        user.face_image_document = face_b64
        # Stocker l'image complète du document
        document_full_b64 = request.data.get('document_full_image_base64', '')
        if document_full_b64:
            user.document_full_image = document_full_b64
            print(f"[KYC] Image complète du document stockée: {len(document_full_b64)} caractères")
        else:
            print("[KYC] Aucune image complète du document reçue")

        # Date de naissance
        birth_date_str = request.data.get('birth_date', '') or ''
        if birth_date_str:
            from datetime import datetime
            for fmt in ('%Y-%m-%d', '%d/%m/%Y', '%d-%m-%Y', '%Y/%m/%d'):
                try:
                    user.birth_date = datetime.strptime(birth_date_str.strip(), fmt).date()
                    break
                except ValueError:
                    continue

        user.kyc_status = 'data_confirmed'
        user.save()

        return Response({
            'status':  'success',
            'message': 'Données KYC confirmées. Passez à la vérification faciale.',
            'has_face_reference': bool(face_b64),
        })


# ══════════════════════════════════════════════════════════════════════════════
# VUE 3 : Vérification Face ID (selfie)
# ══════════════════════════════════════════════════════════════════════════════
class KYCFaceVerifyView(APIView):
    """
    Reçoit le selfie de l'utilisateur.
    
    Logique complète:
    1. Convertir face_image_document (base64) en bytes
    2. Enrôler le visage du document dans Nova (/face/enroll)
    3. Vérifier le selfie contre le visage enrôlé (/face/verify)
    4. Si decision == "allow" → activer le compte
    5. Sinon → rejeter et demander un nouveau selfie

    """
    permission_classes = [AllowAny]
    def extract_and_enhance_face_from_image(self, document_image_bytes, face_bbox=None):
        """
        Extrait et améliore le visage depuis l'image complète du document
        """
        try:
            from PIL import Image, ImageEnhance
            import io
            import cv2
            import numpy as np
            
            # Ouvrir l'image complète
            image = Image.open(io.BytesIO(document_image_bytes))
            
            # Convertir en RGB
            if image.mode in ('RGBA', 'P'):
                image = image.convert('RGB')
            
            # Convertir en array OpenCV
            img_cv = np.array(image)
            img_cv = cv2.cvtColor(img_cv, cv2.COLOR_RGB2BGR)
            
            # Détecter le visage avec Haar Cascade
            face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
            gray = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)
            faces = face_cascade.detectMultiScale(gray, 1.1, 5)
            
            if len(faces) == 0:
                # Essayer avec un autre classifieur
                face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_alt2.xml')
                faces = face_cascade.detectMultiScale(gray, 1.1, 5)
            
            if len(faces) > 0:
                # Prendre le plus grand visage
                x, y, w, h = max(faces, key=lambda rect: rect[2] * rect[3])
                
                # Ajouter une marge de 20%
                margin = int(max(w, h) * 0.2)
                x = max(0, x - margin)
                y = max(0, y - margin)
                w = min(image.width - x, w + 2 * margin)
                h = min(image.height - y, h + 2 * margin)
                
                # Extraire le visage
                face_img = image.crop((x, y, x + w, y + h))
                
                # Redimensionner à 512x512
                face_img = face_img.resize((512, 512), Image.LANCZOS)
                
                # Améliorer la qualité
                enhancer = ImageEnhance.Contrast(face_img)
                face_img = enhancer.enhance(1.8)
                enhancer = ImageEnhance.Sharpness(face_img)
                face_img = enhancer.enhance(1.5)
                
                # Sauvegarder
                img_byte_arr = io.BytesIO()
                face_img.save(img_byte_arr, format='JPEG', quality=95)
                img_byte_arr.seek(0)
                
                print(f"[KYC] Visage détecté et extrait: {face_img.width}x{face_img.height}")
                return img_byte_arr.getvalue()
            
            print("[KYC] Aucun visage détecté dans l'image")
            return None
            
        except Exception as e:
            print(f"[KYC] Erreur extraction visage: {e}")
            return None

    def post(self, request):
        from .models import Utilisateur

        user_id     = request.data.get('user_id')
        selfie_file = request.FILES.get('selfie')

        if not user_id:
            return Response({'error': 'user_id requis.'}, status=400)
        if not selfie_file:
            return Response({'error': 'Selfie requis.'}, status=400)

        try:
            user = Utilisateur.objects.get(id=user_id)
        except Utilisateur.DoesNotExist:
            return Response({'error': 'Utilisateur introuvable.'}, status=404)

        # ── Vérif 1: étape OCR complétée ─────────────────────────────────────
        if user.kyc_status not in ('ocr_done', 'data_confirmed'):
            return Response({
                'error': 'Veuillez d\'abord confirmer les données de votre document.',
                'kyc_status': user.kyc_status,
            }, status=400)

        # ── Vérif 2: image de référence présente ─────────────────────────────
        # Récupérer depuis le champ document_full_image
        document_full_b64 = getattr(user, 'document_full_image', None) or user.face_image_document
        
        if not document_full_b64:
            return Response({
                'error': 'Aucune image du document trouvée. Recommencez l\'OCR.',
                'verified': False,
            }, status=400)

        # Convertir l'image complète du document en bytes
        document_bytes = base64_to_bytes(document_full_b64)
        
        if not document_bytes:
            return Response({
                'error': 'Image du document invalide. Recommencez l\'OCR.',
                'verified': False,
            }, status=400)

        print(f"[KYC] Image document: {len(document_bytes)} bytes")

        # Vérifier la qualité de l'image
        try:
            from PIL import Image
            import io
            test_image = Image.open(io.BytesIO(document_bytes))
            print(f"[KYC] Image document: {test_image.width}x{test_image.height}, mode: {test_image.mode}")
            
            if test_image.width < 300 or test_image.height < 200:
                return Response({
                    'error': 'La qualité de l\'image du document est insuffisante.',
                    'verified': False,
                    'suggestion': 'Veuillez recommencer avec une meilleure photo.'
                }, status=400)
                
        except Exception as e:
            print(f"[KYC] Erreur lecture image: {e}")

        selfie_bytes = selfie_file.read()
        
        # Sauvegarder le selfie
        selfie_file.seek(0)
        user.selfie_profil = ContentFile(selfie_bytes, name=f'selfie_{user_id}.jpg')
        user.save(update_fields=['selfie_profil'])

        # ── Étape 1: Enrôler le visage du document dans Nova ─────────────────
        try:
            # Envoyer l'image COMPLÈTE du document (pas le crop)
            enroll_result = nova_enroll(
                user_id=str(user_id),
                image_bytes=document_bytes,  # ← Image complète
                filename=f"document_{user_id}.jpg"
            )
            print(f"[KYC] Nova enroll result: {enroll_result}")
            
        except Exception as e:
            print(f"[KYC] Erreur Nova enroll: {e}")
            
            if "failed to extract features" in str(e):
                return Response({
                    'error': 'Le visage sur le document n\'a pas pu être détecté.',
                    'verified': False,
                    'can_retry': True,
                    'suggestion': 'Assurez-vous que la photo du document montre clairement le visage, sans reflets ni ombres.',
                    'code': 'FACE_NOT_DETECTED'
                }, status=400)
            else:
                return Response({
                    'error': f'Service de vérification faciale indisponible: {str(e)}',
                    'verified': False,
                    'can_retry': True,
                }, status=503)

        # ── Étape 2: Vérifier le selfie contre le visage enrôlé ──────────────
        try:
            verify_result = nova_verify(
                user_id=str(user_id),
                selfie_bytes=selfie_bytes,
                filename=f"selfie_{user_id}.jpg"
            )
            print(f"[KYC] Nova verify result: {verify_result}")
        except Exception as e:
            print(f"[KYC] Erreur Nova verify: {e}")
            return Response({
                'error': f'Erreur lors de la vérification: {str(e)}',
                'verified': False,
                'can_retry': True,
            }, status=503)

        # ── Extraire les résultats Nova ───────────────────────────────────────
        nova_status   = verify_result.get('status', '')
        nova_decision = verify_result.get('decision', '')
        scores        = verify_result.get('scores', {})
        similarity    = scores.get('similarity_score', 0.0)
        liveness      = scores.get('liveness_score', 0.0)
        
        similarity_pct = round(similarity * 100, 1)
        
        # Sauvegarder le score
        user.face_similarity_score = similarity_pct
        user.save(update_fields=['face_similarity_score'])

        is_valid = (nova_status == 'verified' and nova_decision == 'allow')

        # ══════════════════════════════════════════════════════════════════════
        # CAS 1: VALIDÉ → activer le compte
        # ══════════════════════════════════════════════════════════════════════
        if is_valid:
            user.photo_profil = ContentFile(selfie_bytes, name=f'profil_{user_id}.jpg')
            user.is_kyc_verified    = True
            user.kyc_status         = 'approved'
            user.is_active          = True
            user.kyc_completed_at   = timezone.now()
            user.save()

            try:
                from .utils import creer_abonnement_essai
                creer_abonnement_essai(user)
            except Exception as e:
                print(f"[KYC] Warning abonnement: {e}")

            try:
                from transactions.models import Solde
                Solde.objects.get_or_create(utilisateur=user)
            except Exception as e:
                print(f"[KYC] Warning solde: {e}")

            from rest_framework_simplejwt.tokens import RefreshToken
            refresh = RefreshToken.for_user(user)

            return Response({
                'status':           'success',
                'verified':         True,
                'similarity_score': similarity_pct,
                'liveness_score':   round(liveness * 100, 1),
                'nova_decision':    nova_decision,
                'message':          '✅ Identité vérifiée ! Votre compte est maintenant actif.',
                'access_token':     str(refresh.access_token),
                'refresh_token':    str(refresh),
                'redirect_to':      '/dashboard',
            })

        # ══════════════════════════════════════════════════════════════════════
        # CAS 2: REFUSÉ → bloquer
        # ══════════════════════════════════════════════════════════════════════
        else:
            risk_flags = verify_result.get('explainability', {}).get('risk_flags', [])
            
            if liveness < 0.2:
                reason = 'Vérification anti-spoofing échouée. Assurez-vous d\'utiliser une vraie caméra.'
            elif similarity < 0.75:
                reason = 'Le visage ne correspond pas au document d\'identité.'
            else:
                reason = 'Vérification refusée par le système de sécurité.'

            user.kyc_status = 'rejected'
            user.save(update_fields=['kyc_status'])

            return Response({
                'status':           'failed',
                'verified':         False,
                'similarity_score': similarity_pct,
                'liveness_score':   round(liveness * 100, 1),
                'nova_decision':    nova_decision,
                'risk_flags':       risk_flags,
                'message':          f'❌ {reason}',
                'suggestion':       'Prenez un selfie bien éclairé, de face, sans lunettes ni masque.',
                'can_retry':        True,
            }, status=400)

# ══════════════════════════════════════════════════════════════════════════════
# VUE 4 : Statut KYC de l'utilisateur connecté
# ══════════════════════════════════════════════════════════════════════════════
class KYCStatusView(APIView):
    """
    Retourne les données KYC de l'utilisateur connecté.
    Inchangé par rapport à ton code original (c'était correct).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        selfie_url = None
        profil_url = None

        if user.selfie_profil:
            try:
                selfie_url = request.build_absolute_uri(user.selfie_profil.url)
            except Exception:
                pass

        if user.photo_profil:
            try:
                profil_url = request.build_absolute_uri(user.photo_profil.url)
            except Exception:
                pass

        essential_fields = {
            'nom':        user.nom_fr or '',
            'prenom':     user.prenom_fr or '',
            'father_name': user.father_name or '',
            'nni':        user.nni or '',
            'birth_date': str(user.birth_date) if user.birth_date else '',
            'gender':     user.gender or '',
        }
        filled_fields  = {k: bool(v and str(v).strip()) for k, v in essential_fields.items()}
        fields_count   = sum(filled_fields.values())
        missing_fields = [k for k, v in filled_fields.items() if not v]

        can_proceed_to_face = (
            user.kyc_status == 'data_confirmed' and
            fields_count >= 2 and
            bool(user.face_image_document)
        )

        return Response({
            'is_kyc_verified':      user.is_kyc_verified,
            'kyc_status':           user.kyc_status,
            'can_proceed_to_face':  can_proceed_to_face,
            'has_minimum_fields':   fields_count >= 2,
            'fields_count':         fields_count,
            'filled_fields':        filled_fields,
            'missing_fields':       missing_fields,
            'has_face_reference':   bool(user.face_image_document),
            'nni':                  user.nni or '',
            'nom_fr':               user.nom_fr or '',
            'father_name':          user.father_name or '',
            'prenom_fr':            user.prenom_fr or '',
            'birth_date':           str(user.birth_date) if user.birth_date else '',
            'birth_place':          user.birth_place or '',
            'gender':               user.gender or '',
            'nationality':          user.nationality or 'MRT',
            'document_type':        user.kyc_document_type or '',
            'face_similarity_score': user.face_similarity_score,
            'selfie_url':           selfie_url or profil_url,
            'kyc_completed_at':     str(user.kyc_completed_at) if user.kyc_completed_at else '',
        })