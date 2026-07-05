import requests
from django.conf import settings


class TrackPayError(Exception):
    """Levée si l'appel à l'API TrackPay échoue (réseau, réponse invalide, etc.)."""
    pass

_PLAN_ID_ENV_MAP = {
    ('standard', 'mensuel'):    'TRACKPAY_PLAN_ID_STANDARD_MENSUEL',
    ('standard', '2_mois'):     'TRACKPAY_PLAN_ID_STANDARD_2_MOIS',
    ('standard', '3_mois'):     'TRACKPAY_PLAN_ID_STANDARD_3_MOIS',
    ('standard', '6_mois'):     'TRACKPAY_PLAN_ID_STANDARD_6_MOIS',
    ('standard', 'annuel'):     'TRACKPAY_PLAN_ID_STANDARD_ANNUEL',
    ('entreprise', 'mensuel'):  'TRACKPAY_PLAN_ID_ENTREPRISE_MENSUEL',
    ('entreprise', '2_mois'):   'TRACKPAY_PLAN_ID_ENTREPRISE_2_MOIS',
    ('entreprise', '3_mois'):   'TRACKPAY_PLAN_ID_ENTREPRISE_3_MOIS',
    ('entreprise', '6_mois'):   'TRACKPAY_PLAN_ID_ENTREPRISE_6_MOIS',
    ('entreprise', 'annuel'):   'TRACKPAY_PLAN_ID_ENTREPRISE_ANNUEL',
}


def get_plan_id(type_utilisateur: str, type_abonnement: str) -> str | None:
    """
    Retourne le plan_id TrackPay correspondant à la combinaison
    (type_utilisateur, type_abonnement), ou None si introuvable
    (combinaison invalide ou variable d'environnement manquante).
    """
    env_var_name = _PLAN_ID_ENV_MAP.get((type_utilisateur, type_abonnement))
    if not env_var_name:
        return None
    return getattr(settings, env_var_name, None)


# ─── Création d'un paiement côté TrackPay ───────────────────────────────────
def creer_paiement_trackpay(plan_id: str, callback_url: str, reference: str) -> str:
    """
    Appelle l'API TrackPay pour créer un paiement et retourne le payment_url
    vers lequel rediriger l'utilisateur.

    Lève TrackPayError en cas d'échec (réseau, statut HTTP non 2xx,
    réponse sans payment_url).
    """
    try:
        response = requests.post(
            settings.TRACKPAY_API_URL,
            headers={
                "Content-Type": "application/json",
                "X-API-Key": settings.TRACKPAY_API_KEY,
            },
            json={
                "plan_id": plan_id,
                "callback_url": callback_url,
                "reference": reference,
            },
            timeout=15,
        )
    except requests.RequestException as exc:
        raise TrackPayError(f"Erreur réseau lors de l'appel à TrackPay : {exc}")

    if response.status_code >= 400:
        raise TrackPayError(
            f"TrackPay a répondu avec le statut {response.status_code} : {response.text}"
        )

    try:
        data = response.json()
    except ValueError:
        raise TrackPayError("Réponse TrackPay invalide (JSON attendu).")

    payment_url = data.get("payment_url")
    if not payment_url:
        raise TrackPayError("Réponse TrackPay sans payment_url.")

    return payment_url


# ─── Vérification de la signature du webhook ────────────────────────────────
def verifier_signature_webhook(request) -> bool:
    """
    Vérifie que le header X-Webhook-Secret de la requête entrante correspond
    bien au TRACKPAY_WEBHOOK_SECRET configuré côté serveur.
    """
    secret_recu = request.headers.get("X-Webhook-Secret", "")
    secret_attendu = getattr(settings, "TRACKPAY_WEBHOOK_SECRET", "")
    if not secret_attendu:
        return False
    return secret_recu == secret_attendu