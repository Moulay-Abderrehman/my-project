from rest_framework.permissions import BasePermission
from rest_framework.exceptions import PermissionDenied
from django.utils import timezone


class EstAbonne(BasePermission):
    """
    Autorise l'accès si l'utilisateur a un abonnement actif (essai OU payant).
    Permet la lecture même si l'abonnement est expiré.
    """
    message = "Votre période d'essai est terminée. Abonnez-vous pour accéder à cette fonctionnalité."

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        
        try:
            abo = user.abonnement
            if not abo:
                # Si pas d'abonnement, autoriser la lecture
                return request.method in ('GET', 'HEAD', 'OPTIONS')
            
            # Vérifier si l'abonnement est actif
            est_actif = abo.statut == 'actif' and abo.date_fin > timezone.now()
            
            # Si actif → autoriser tout
            if est_actif:
                return True
            
            # Si expiré → autoriser seulement la lecture
            if request.method in ('GET', 'HEAD', 'OPTIONS'):
                # Ajouter un indicateur pour le frontend
                request.subscription_expired = True
                return True
            
            # Bloquer les écritures si expiré
            raise PermissionDenied({
                'error': 'abonnement_expire',
                'message': 'Votre abonnement a expiré. Veuillez le renouveler pour effectuer cette action.',
                'redirect_to': '/abonnement'
            })
            
        except Exception as e:
            # En cas d'erreur, autoriser la lecture
            if request.method in ('GET', 'HEAD', 'OPTIONS'):
                return True
            raise PermissionDenied({
                'error': 'abonnement_requis',
                'message': 'Vous devez avoir un abonnement actif pour effectuer cette action.',
                'redirect_to': '/abonnement'
            })


class LimiteEssaiQuotidienne(BasePermission):
    """
    Limite les actions quotidiennes pour les utilisateurs en essai.
    Lecture toujours autorisée.
    """
    LIMITE_TRANSACTIONS = 5
    LIMITE_BUDGETS = 2

    def has_permission(self, request, view):
        # ✅ Méthodes de lecture toujours autorisées
        if request.method in ('GET', 'HEAD', 'OPTIONS'):
            return True

        user = request.user
        if not user or not user.is_authenticated:
            return False

        # Récupérer l'abonnement
        try:
            abo = user.abonnement
            if not abo or abo.statut != 'actif':
                # Si abonnement expiré ou inexistant, bloquer les écritures
                raise PermissionDenied({
                    'error': 'abonnement_expire',
                    'message': 'Votre abonnement est expiré. Vous ne pouvez pas créer/modifier de données.',
                    'redirect_to': '/abonnement'
                })
        except Exception:
            return False

        # Si pas en essai → pas de limite
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
    """
    Permet la création de catégories uniquement pour les abonnés Standard ou Entreprise.
    Lecture autorisée pour tous.
    """
    message = "La création de catégories personnalisées nécessite un abonnement Standard ou Entreprise."

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        
        # ✅ Lecture autorisée pour tous
        if request.method in ('GET', 'HEAD', 'OPTIONS'):
            return True
        
        # Écriture : uniquement standard ou entreprise
        try:
            abo = user.abonnement
            if not abo or abo.statut != 'actif':
                raise PermissionDenied({
                    'error': 'abonnement_expire',
                    'message': 'Votre abonnement a expiré. Vous ne pouvez pas créer de catégories.',
                    'redirect_to': '/abonnement'
                })
            
            plan_nom = abo.get_plan_nom()
            if plan_nom in ('standard', 'entreprise'):
                return True
            
            raise PermissionDenied({
                'error': 'abonnement_insuffisant',
                'message': 'La création de catégories personnalisées nécessite un abonnement Standard ou Entreprise.',
                'redirect_to': '/abonnement'
            })
            
        except Exception as e:
            raise PermissionDenied({
                'error': 'abonnement_requis',
                'message': 'Vous devez avoir un abonnement actif pour créer des catégories.',
                'redirect_to': '/abonnement'
            })