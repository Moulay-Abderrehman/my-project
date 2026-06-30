from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.html import format_html
from .models import Utilisateur


@admin.register(Utilisateur)
class UtilisateurAdmin(UserAdmin):
    list_display = ['telephone', 'nom', 'prenom', 'email', 'is_active', 'is_staff', 'date_inscription',
                     'kyc_status', 'is_kyc_verified']  
    list_filter = ['is_active', 'is_staff', 'kyc_status', 'is_kyc_verified']  
    search_fields = ['telephone', 'nom', 'prenom', 'email', 'nni']  
    ordering = ['-date_inscription']

    readonly_fields = [
        'date_inscription', 'last_login',
        'apercu_document_kyc', 'apercu_selfie_kyc',
        'kyc_completed_at', 'face_similarity_score',
    ]

    fieldsets = (
        (None, {'fields': ('telephone', 'password')}),
        ('Informations personnelles', {'fields': ('nom', 'prenom', 'email', 'photo_profil')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Dates', {'fields': ('last_login', 'date_inscription')}),

        ('Vérification KYC — Statut', {
            'fields': (
                'is_kyc_verified',
                'kyc_status',
                'kyc_document_type',
                'face_similarity_score',
                'kyc_completed_at',
            ),
            'description': "Statut global de la vérification d'identité de l'utilisateur.",
        }),
        ('Vérification KYC — Documents envoyés', {
            'fields': (
                'apercu_document_kyc',
                'apercu_selfie_kyc',
            ),
            'description': "Aperçu du document d'identité scanné et du selfie pris lors de la vérification faciale.",
        }),
        ('Vérification KYC — Données extraites (modifiables)', {
            'fields': (
                'nni',
                'nom_fr',
                'prenom_fr',
                'father_name',
                'father_name_ar',
                'nom_ar',
                'prenom_ar',
                'birth_date',
                'birth_place',
                'gender',
                'nationality',
            ),
            'description': (
                "Données extraites automatiquement par l'OCR depuis le document d'identité. "
                "Si une information est incorrecte, corrigez-la ici puis enregistrez : "
                "la correction sera immédiatement reflétée sur le compte de l'utilisateur."
            ),
        }),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('telephone', 'nom', 'prenom', 'email', 'password1', 'password2'),
        }),
    )

    # ── AJOUTÉ : méthodes d'affichage pour les aperçus image en lecture seule ──
    def apercu_document_kyc(self, obj):
        """
        Affiche une miniature du document d'identité (base64) stocké dans
        document_full_image, avec un lien pour l'ouvrir en taille réelle
        dans un nouvel onglet.
        """
        b64 = getattr(obj, 'document_full_image', None) or obj.face_image_document
        if not b64:
            return "Aucun document envoyé."
        # Si le champ contient déjà un header data URI, ne pas le dupliquer
        src = b64 if b64.startswith('data:') else f"data:image/jpeg;base64,{b64}"
        return format_html(
            '<a href="{0}" target="_blank" rel="noopener noreferrer">'
            '<img src="{0}" style="max-height:220px;max-width:320px;border-radius:8px;'
            'border:1px solid #ddd;object-fit:contain;" />'
            '</a><br><a href="{0}" target="_blank" rel="noopener noreferrer">'
            'Voir le document en taille réelle ↗</a>',
            src,
        )
    apercu_document_kyc.short_description = "Document d'identité envoyé"

    def apercu_selfie_kyc(self, obj):
        """
        Affiche une miniature du selfie pris lors de la vérification Face ID
        (ImageField selfie_profil), avec un lien vers la taille réelle.
        """
        if not obj.selfie_profil:
            return "Aucun selfie envoyé."
        try:
            url = obj.selfie_profil.url
        except Exception:
            return "Aucun selfie envoyé."
        return format_html(
            '<a href="{0}" target="_blank" rel="noopener noreferrer">'
            '<img src="{0}" style="max-height:220px;max-width:320px;border-radius:8px;'
            'border:1px solid #ddd;object-fit:contain;" />'
            '</a><br><a href="{0}" target="_blank" rel="noopener noreferrer">'
            'Voir le selfie en taille réelle ↗</a>',
            url,
        )
    apercu_selfie_kyc.short_description = "Selfie de vérification"