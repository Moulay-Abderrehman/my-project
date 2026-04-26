from celery import shared_task
from django.utils import timezone
from .models import Budget
from notifications.models import Notification


@shared_task
def verifier_budgets():
    """Tâche Celery: vérifie tous les budgets actifs et envoie des alertes"""
    budgets = Budget.objects.filter(est_actif=True)
    today = timezone.now().date()

    for budget in budgets:
        pct = budget.pourcentage_utilise

        # ─── Alerte à 80% ───
        if 80 <= pct < 100:
            Notification.objects.get_or_create(
                utilisateur=budget.utilisateur,
                type='alerte_budget',
                message=f"⚠️ Budget {budget.categorie.nom} utilisé à {pct}%.",
                defaults={'date_creation': timezone.now()}
            )

        # ─── Alerte dépassement ───
        elif pct >= 100:
            Notification.objects.get_or_create(
                utilisateur=budget.utilisateur,
                type='depassement_budget',
                message=f"🚨 Budget {budget.categorie.nom} DÉPASSÉ ({pct}%).",
                defaults={'date_creation': timezone.now()}
            )

        # ─── Notification FIN DE BUDGET (budget terminé = date_fin dépassée) ───
        if today > budget.date_fin and not budget.notif_fin_envoyee:
            _envoyer_notif_fin_budget(budget)
            budget.notif_fin_envoyee = True
            budget.save(update_fields=['notif_fin_envoyee'])


def _envoyer_notif_fin_budget(budget):
    """Construit et envoie la notification de fin de budget avec le détail des dépenses"""
    from transactions.models import Transaction

    transactions = Transaction.objects.filter(
        utilisateur=budget.utilisateur,
        budget=budget,
        type='sortie'
    ).order_by('date')

    # Construire la liste des transactions
    lignes = []
    for t in transactions:
        date_str = t.date.strftime('%d/%m/%Y %H:%M') if t.date else '—'
        desc = t.description or 'Sans description'
        lignes.append(f"  • {date_str} | {float(t.montant):.2f} MRU — {desc}")

    detail = "\n".join(lignes) if lignes else "  Aucune dépense enregistrée."

    message = (
        f"📋 Budget terminé : {budget.categorie.nom}\n"
        f"Période : {budget.date_debut.strftime('%d/%m/%Y')} → {budget.date_fin.strftime('%d/%m/%Y')}\n"
        f"Montant prévu : {float(budget.montant_prevu):.2f} MRU\n"
        f"Montant dépensé : {float(budget.montant_depense):.2f} MRU\n"
        f"Utilisation : {budget.pourcentage_utilise}%\n\n"
        f"Détail des dépenses :\n{detail}"
    )

    Notification.objects.create(
        utilisateur=budget.utilisateur,
        type='budget_termine',
        message=message,
    )


@shared_task
def verifier_abonnements():
    """Tâche Celery: alertes d'expiration d'abonnement"""
    from abonnements.models import Abonnement
    abonnements = Abonnement.objects.filter(statut='actif')
    for abo in abonnements:
        jours = abo.jours_restants()
        if jours <= 5 and jours > 0:
            Notification.objects.create(
                utilisateur=abo.utilisateur,
                type='expiration_abonnement',
                message=f"⏰ Attention ! Votre abonnement expire dans {jours} jour(s). Vous pouvez le renouveler dès maintenant."
            )