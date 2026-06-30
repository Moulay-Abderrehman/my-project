#backend/abonnements/admin.pya
from django.contrib import admin
from django.contrib import messages
from django.utils.html import format_html
from django.utils import timezone

from .models import Plan, Feature, PlanFeature, Abonnement, Paiement, CompteEncaissement
from .views import TARIFS, activer_abonnement, METHODES_MANUELLES


@admin.register(Plan)
class PlanAdmin(admin.ModelAdmin):
    list_display = ['nom', 'prix_mensuel', 'prix_annuel', 'nb_categories_max']

@admin.register(Feature)
class FeatureAdmin(admin.ModelAdmin):
    list_display = ['code', 'label']

@admin.register(PlanFeature)
class PlanFeatureAdmin(admin.ModelAdmin):
    list_display = ['plan', 'feature']

@admin.register(Abonnement)
class AbonnementAdmin(admin.ModelAdmin):
    list_display = ['utilisateur', 'plan', 'type', 'statut', 'date_debut', 'date_fin', 'nb_renouvellements']
    list_filter = ['statut', 'type', 'plan']
    search_fields = ['utilisateur__telephone', 'utilisateur__nom']


@admin.register(Paiement)
class PaiementAdmin(admin.ModelAdmin):
    list_display = [
        'abonnement', 'montant', 'statut', 'methode', 'reference', 'date_paiement',
        'type_utilisateur_demande', 'type_abonnement_demande', 'mode_renouvellement',
    ]
    list_filter = ['statut', 'methode', 'mode_renouvellement']
    readonly_fields = ['apercu_capture_ecran', 'date_paiement']
    actions = ['accepter_paiements', 'refuser_paiements']

    fields = [
        'abonnement', 'montant', 'methode', 'statut', 'reference', 'date_paiement',
        'type_utilisateur_demande', 'type_abonnement_demande', 'mode_renouvellement',
        'capture_ecran', 'apercu_capture_ecran',
        'raison_refus', 'valide_par', 'date_validation',
        'reference_trackpay',  # visible/éditable pour debug si besoin
    ]

    # ── Aperçu visuel de la capture d'écran directement dans la fiche ───────
    def apercu_capture_ecran(self, obj):
        if obj.capture_ecran:
            try:
                return format_html(
                    '<img src="{}" style="max-width: 420px; max-height: 420px; border-radius: 8px; border: 1px solid #e2e8f0;" />',
                    obj.capture_ecran.url,
                )
            except ValueError:
                return "(fichier indisponible)"
        return "(aucune capture d'écran)"
    apercu_capture_ecran.short_description = "Aperçu de la capture d'écran"

    # ── Action Accepter ──────────────────────────────────────────────────────
    def accepter_paiements(self, request, queryset):
        traites = 0
        for paiement in queryset:
            if paiement.statut != 'en_attente':
                self.message_user(
                    request,
                    f"Paiement {paiement.reference} ignoré (statut actuel : {paiement.get_statut_display()}).",
                    level=messages.WARNING,
                )
                continue

            if paiement.methode not in METHODES_MANUELLES:
                self.message_user(
                    request,
                    f"Paiement {paiement.reference} ignoré : la méthode '{paiement.get_methode_display()}' "
                    f"est validée automatiquement (TrackPay), pas manuellement.",
                    level=messages.WARNING,
                )
                continue

            type_utilisateur = paiement.type_utilisateur_demande
            type_abonnement  = paiement.type_abonnement_demande

            durees_valides = [choice[0] for choice in Paiement.TYPE_ABONNEMENT_DEMANDE_CHOICES]
            if type_utilisateur not in ('standard', 'entreprise') or type_abonnement not in durees_valides:
                self.message_user(
                    request,
                    f"Paiement {paiement.reference} ignoré : type_utilisateur_demande / "
                    f"type_abonnement_demande manquant ou invalide.",
                    level=messages.ERROR,
                )
                continue

            montant = TARIFS.get(type_utilisateur, {}).get(type_abonnement, paiement.montant)

            activer_abonnement(
                paiement.abonnement.utilisateur,
                type_utilisateur,
                type_abonnement,
                montant,
                mode=paiement.mode_renouvellement,
            )

            # Mise à jour du Paiement
            paiement.statut          = 'confirme'
            paiement.valide_par      = request.user
            paiement.date_validation = timezone.now()
            paiement.save()

            traites += 1

        if traites:
            self.message_user(request, f"{traites} paiement(s) accepté(s) avec succès.", level=messages.SUCCESS)
    accepter_paiements.short_description = "✅ Accepter les paiements sélectionnés"

    # ── Action Refuser ───────────────────────────────────────────────────────
    def refuser_paiements(self, request, queryset):
        traites = 0
        for paiement in queryset:
            if paiement.statut != 'en_attente':
                self.message_user(
                    request,
                    f"Paiement {paiement.reference} ignoré (statut actuel : {paiement.get_statut_display()}).",
                    level=messages.WARNING,
                )
                continue

            if paiement.methode not in METHODES_MANUELLES:
                self.message_user(
                    request,
                    f"Paiement {paiement.reference} ignoré : la méthode '{paiement.get_methode_display()}' "
                    f"est gérée automatiquement (TrackPay), pas manuellement.",
                    level=messages.WARNING,
                )
                continue

            if not paiement.raison_refus or not paiement.raison_refus.strip():
                self.message_user(
                    request,
                    f"Paiement {paiement.reference} ignoré : veuillez d'abord renseigner le champ "
                    f"'raison_refus' sur la fiche du paiement avant de lancer cette action.",
                    level=messages.ERROR,
                )
                continue

            paiement.statut = 'refuse'
            paiement.valide_par = request.user
            paiement.date_validation = timezone.now()
            paiement.save()

            user = paiement.abonnement.utilisateur

            from notifications.models import Notification
            Notification.objects.create(
                utilisateur=user,
                type='abonnement_refuse',
                message=(
                    f"ABONNEMENT_REFUSE|"
                    f"plan:{(paiement.type_utilisateur_demande or '').capitalize()}|"
                    f"type:{(paiement.type_abonnement_demande or '').capitalize()}|"
                    f"methode:{paiement.methode}|"
                    f"date:{timezone.now().strftime('%d/%m/%Y')}|"
                    f"raison:{paiement.raison_refus}"
                ),
            )

            traites += 1

        if traites:
            self.message_user(request, f"{traites} paiement(s) refusé(s).", level=messages.SUCCESS)
    refuser_paiements.short_description = " Refuser les paiements sélectionnés (raison_refus requise)"


@admin.register(CompteEncaissement)
class CompteEncaissementAdmin(admin.ModelAdmin):
    list_display = ['methode', 'numero_compte', 'nom_titulaire', 'actif']
    list_filter = ['actif', 'methode']
    search_fields = ['numero_compte', 'nom_titulaire']