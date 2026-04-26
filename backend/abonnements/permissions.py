from rest_framework.permissions import BasePermission
from rest_framework.exceptions import PermissionDenied
from django.utils import timezone


class EstAbonne(BasePermission):
    """
    Autorise l'accès si l'utilisateur a un abonnement actif (essai OU payant).
    """
    message = "Votre période d'essai est terminée. Abonnez-vous pour accéder à cette fonctionnalité."

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        try:
            abo = user.abonnement
            return abo.statut == 'actif' and abo.date_fin > timezone.now()
        except Exception:
            return False


class LimiteEssaiQuotidienne(BasePermission):

    # ── Limites quotidiennes pour le plan essai ────────────────────────────
    LIMITE_TRANSACTIONS = 5
    LIMITE_BUDGETS      = 2

    def has_permission(self, request, view):
        # Méthodes de lecture → toujours autorisées
        if request.method in ('GET', 'HEAD', 'OPTIONS'):
            return True

        user = request.user
        if not user or not user.is_authenticated:
            return False

        # Récupérer l'abonnement
        try:
            abo = user.abonnement
        except Exception:
            return True  # Pas d'abonnement → laisser passer (géré par EstAbonne)

        # Pas en essai → aucune limite
        if abo.get_plan_nom() != 'essai':
            return True

        # ── Détecter le type de ressource ────────────────────────────────
        request_path = request.path

        if '/transactions/' in request_path and '/budgets/' not in request_path:
            return self._verifier_limite_transactions(user, request)

        if '/budgets/' in request_path:
            return self._verifier_limite_budgets(user, request)

        return True

    def _verifier_limite_transactions(self, user, request):
        from transactions.models import Transaction
        from django.db.models import Count

        aujourd_hui = timezone.now().date()
        nb_aujourd_hui = Transaction.objects.filter(
            utilisateur=user,
            source='manuel',
            date__date=aujourd_hui,
        ).count()

        if nb_aujourd_hui >= self.LIMITE_TRANSACTIONS:
            raise PermissionDenied(
                f"Limite quotidienne atteinte. "
                f"Votre limite gratuite de {self.LIMITE_TRANSACTIONS} transactions "
                f"pour aujourd'hui est épuisée. "
                f"Vous pouvez consulter vos statistiques et autres pages, "
                f"ou revenir demain pour de nouvelles saisies !"
            )
        return True

    def _verifier_limite_budgets(self, user, request):
        from budgets.models import Budget

        aujourd_hui = timezone.now().date()
        nb_aujourd_hui = Budget.objects.filter(
            utilisateur=user,
            date_creation__date=aujourd_hui,
        ).count()

        if nb_aujourd_hui >= self.LIMITE_BUDGETS:
            raise PermissionDenied(
                f"Limite quotidienne atteinte. "
                f"Votre limite gratuite de {self.LIMITE_BUDGETS} budgets "
                f"pour aujourd'hui est épuisée. "
                f"Revenez demain ou abonnez-vous pour un accès illimité !"
            )
        return True


class PeutCreerCategorie(BasePermission):

    message = "La création de catégories personnalisées nécessite un abonnement Standard ou Entreprise."

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        # Lecture autorisée pour tous les abonnés (essai inclus)
        if request.method in ('GET', 'HEAD', 'OPTIONS'):
            return True
        # Écriture : uniquement standard ou entreprise
        try:
            abo = user.abonnement
            if not abo.est_actif():
                return False
            return abo.get_plan_nom() in ('standard', 'entreprise')
        except Exception:
            return False





