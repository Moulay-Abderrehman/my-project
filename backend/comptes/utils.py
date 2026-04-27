import random
import string
import ssl
from django.core.cache import cache
from django.core.mail import send_mail
from django.conf import settings
from django.core.mail.backends.smtp import EmailBackend

# ─── CODE RESET ──────────────────────────────────────────────────────────────
def generer_code_reset(longueur: int = 6) -> str:
    return ''.join(random.choices(string.digits, k=longueur))


def sauvegarder_code_reset(email: str, code: str, ttl: int = 300) -> None:
    cache.set(f"reset_code:{email}", code, timeout=ttl)


def verifier_code_reset(email: str, code_fourni: str) -> bool:
    code_stocke = cache.get(f"reset_code:{email}")
    if code_stocke and code_stocke == code_fourni:
        cache.delete(f"reset_code:{email}")
        return True
    return False


# ─── EMAIL RESET MOT DE PASSE (Réinitialisation uniquement) ────────────────────
def envoyer_email_reset(email: str, code: str) -> bool:
    try:
        context = ssl.create_default_context()
        context.check_hostname = False
        context.verify_mode = ssl.CERT_NONE
        
        from django.core.mail import get_connection
        connection = get_connection(
            host=settings.EMAIL_HOST,
            port=settings.EMAIL_PORT,
            username=settings.EMAIL_HOST_USER,
            password=settings.EMAIL_HOST_PASSWORD,
            use_tls=settings.EMAIL_USE_TLS,
            fail_silently=False,
        )
        
        send_mail(
            subject="FinanceApp — 🔐 Réinitialisation de votre mot de passe",
            message=f"Bonjour,\n\nVotre code de réinitialisation de mot de passe est : {code}\n\nCe code est valable 5 minutes.\n\nSi vous n'avez pas demandé cette réinitialisation, ignorez cet email.\n\nCordialement,\nL'équipe FinanceApp",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            html_message=f"""
            <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:32px;background:#f8fafc;border-radius:16px;">
                <div style="text-align:center;margin-bottom:24px;">
                    <div style="display:inline-block;background:linear-gradient(135deg,#0c2e7c,#1e4db7);border-radius:14px;padding:12px 24px;">
                        <span style="color:#fff;font-weight:900;font-size:20px;">FinanceApp</span>
                    </div>
                </div>
                <div style="background:#fff;border-radius:12px;padding:28px;box-shadow:0 2px 12px rgba(0,0,0,0.07);">
                    <h2 style="margin:0 0 12px;color:#1e293b;">🔐 Réinitialisation du mot de passe</h2>
                    <p style="color:#64748b;font-size:14px;margin:0 0 20px;">
                        Vous avez demandé à réinitialiser votre mot de passe.
                        Voici votre code de vérification :
                    </p>
                    <div style="text-align:center;background:#eef2ff;border-radius:12px;padding:24px;margin-bottom:20px;">
                        <span style="font-size:42px;font-weight:900;letter-spacing:14px;color:#0c2e7c;">{code}</span>
                    </div>
                    <p style="color:#64748b;font-size:14px;margin:0 0 10px;">
                        Ce code est <strong>valable 5 minutes</strong>.
                    </p>
                    <p style="color:#94a3b8;font-size:12px;margin:0;">
                        Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
                    </p>
                </div>
                <p style="text-align:center;margin-top:16px;color:#94a3b8;font-size:11px;">© 2025 FinanceApp - Gestion financière intelligente</p>
            </div>
            """,
            fail_silently=False,
            connection=connection,
        )
        return True
    except Exception as e:
        print(f"[EMAIL RESET ERROR] {e}")
        return False


# ─── EMAIL CONFIRMATION CREATION DE COMPTE ─────────────────────────────────────
def envoyer_email_verification_compte(user) -> bool:
    """Envoie un email avec le code de vérification pour la création de compte"""
    code = user.code_confirmation
    email = user.email
    
    if not email or not code:
        return False
    
    try:
        context = ssl.create_default_context()
        context.check_hostname = False
        context.verify_mode = ssl.CERT_NONE
        
        from django.core.mail import get_connection
        connection = get_connection(
            host=settings.EMAIL_HOST,
            port=settings.EMAIL_PORT,
            username=settings.EMAIL_HOST_USER,
            password=settings.EMAIL_HOST_PASSWORD,
            use_tls=settings.EMAIL_USE_TLS,
            fail_silently=False,
        )
        
        send_mail(
            subject="FinanceApp — 🎉 Bienvenue ! Vérifiez votre adresse email",
            message=f"Bonjour {user.prenom},\n\nMerci d'avoir créé un compte sur FinanceApp !\n\nVotre code de vérification est : {code}\n\nCe code est valable 5 minutes.\n\nPour finaliser votre inscription, saisissez ce code sur la page de vérification.\n\nCordialement,\nL'équipe FinanceApp",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            html_message=f"""
            <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:32px;background:#f8fafc;border-radius:16px;">
                <div style="text-align:center;margin-bottom:24px;">
                    <div style="display:inline-block;background:linear-gradient(135deg,#0c2e7c,#1e4db7);border-radius:14px;padding:12px 24px;">
                        <span style="color:#fff;font-weight:900;font-size:20px;">FinanceApp</span>
                    </div>
                </div>
                <div style="background:#fff;border-radius:12px;padding:28px;box-shadow:0 2px 12px rgba(0,0,0,0.07);">
                    <h2 style="margin:0 0 12px;color:#1e293b;">🎉 Bienvenue sur FinanceApp !</h2>
                    <p style="color:#64748b;font-size:14px;margin:0 0 10px;">
                        Bonjour <strong>{user.prenom} {user.nom}</strong>,
                    </p>
                    <p style="color:#64748b;font-size:14px;margin:0 0 20px;">
                        Merci d'avoir créé un compte. Pour finaliser votre inscription,
                        veuillez saisir le code de vérification ci-dessous :
                    </p>
                    <div style="text-align:center;background:#eef2ff;border-radius:12px;padding:24px;margin-bottom:20px;">
                        <span style="font-size:42px;font-weight:900;letter-spacing:14px;color:#0c2e7c;">{code}</span>
                    </div>
                    <p style="color:#64748b;font-size:14px;margin:0 0 10px;">
                        Ce code est <strong>valable 5 minutes</strong>.
                    </p>
                    <p style="color:#94a3b8;font-size:12px;margin:0;">
                        Une fois vérifié, vous pourrez profiter de votre essai gratuit de 14 jours !
                    </p>
                </div>
                <p style="text-align:center;margin-top:16px;color:#94a3b8;font-size:11px;">© 2025 FinanceApp - Gestion financière intelligente</p>
            </div>
            """,
            fail_silently=False,
            connection=connection,
        )
        return True
    except Exception as e:
        print(f"[EMAIL VERIFICATION ERROR] {e}")
        return False


# ─── EMAIL CONFIRMATION ABONNEMENT ────────────────────────────────────────────
def envoyer_email_abonnement(email: str, code: str, plan_nom: str, montant: float) -> bool:
    """Envoie un email avec le code de confirmation pour l'abonnement"""
    try:
        context = ssl.create_default_context()
        context.check_hostname = False
        context.verify_mode = ssl.CERT_NONE
        
        from django.core.mail import get_connection
        connection = get_connection(
            host=settings.EMAIL_HOST,
            port=settings.EMAIL_PORT,
            username=settings.EMAIL_HOST_USER,
            password=settings.EMAIL_HOST_PASSWORD,
            use_tls=settings.EMAIL_USE_TLS,
            fail_silently=False,
        )
        
        montant_str = f"{montant:,.0f} MRU".replace(",", " ")
        
        send_mail(
            subject=f"FinanceApp — ⭐ Confirmation de votre abonnement {plan_nom.capitalize()}",
            message=f"Bonjour,\n\nVous êtes sur le point de souscrire à l'abonnement {plan_nom.capitalize()} au prix de {montant_str}.\n\nVotre code de confirmation est : {code}\n\nCe code est valable 5 minutes.\n\nSi vous n'êtes pas à l'origine de cette demande, ignorez cet email.\n\nCordialement,\nL'équipe FinanceApp",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            html_message=f"""
            <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:32px;background:#f8fafc;border-radius:16px;">
                <div style="text-align:center;margin-bottom:24px;">
                    <div style="display:inline-block;background:linear-gradient(135deg,#0c2e7c,#1e4db7);border-radius:14px;padding:12px 24px;">
                        <span style="color:#fff;font-weight:900;font-size:20px;">FinanceApp</span>
                    </div>
                </div>
                <div style="background:#fff;border-radius:12px;padding:28px;box-shadow:0 2px 12px rgba(0,0,0,0.07);">
                    <h2 style="margin:0 0 12px;color:#1e293b;">⭐ Confirmation de votre abonnement</h2>
                    <p style="color:#64748b;font-size:14px;margin:0 0 10px;">
                        Vous êtes sur le point de souscrire à l'abonnement :
                    </p>
                    <div style="background:#ecfdf5;border-radius:10px;padding:16px;margin-bottom:20px;text-align:center;">
                        <span style="font-size:18px;font-weight:700;color:#065f46;">{plan_nom.capitalize()}</span>
                        <span style="font-size:16px;color:#047857;margin-left:10px;">→ {montant_str}</span>
                    </div>
                    <p style="color:#64748b;font-size:14px;margin:0 0 20px;">
                        Voici votre code de confirmation :
                    </p>
                    <div style="text-align:center;background:#eef2ff;border-radius:12px;padding:24px;margin-bottom:20px;">
                        <span style="font-size:42px;font-weight:900;letter-spacing:14px;color:#0c2e7c;">{code}</span>
                    </div>
                    <p style="color:#64748b;font-size:14px;margin:0 0 10px;">
                        Ce code est <strong>valable 5 minutes</strong>.
                    </p>
                    <p style="color:#94a3b8;font-size:12px;margin:0;">
                        Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.
                    </p>
                </div>
                <p style="text-align:center;margin-top:16px;color:#94a3b8;font-size:11px;">© 2025 FinanceApp - Gestion financière intelligente</p>
            </div>
            """,
            fail_silently=False,
            connection=connection,
        )
        return True
    except Exception as e:
        print(f"[EMAIL ABONNEMENT ERROR] {e}")
        return False


# ─── EMAIL INVITATION EMPLOYÉ ─────────────────────────────────────────────────
def envoyer_email_invitation(email_employe: str, admin_user, lien: str) -> bool:
    try:
        send_mail(
            subject=f"FinanceApp — Invitation de {admin_user.prenom} {admin_user.nom}",
            message=f"Vous avez été invité(e). Cliquez ici pour activer votre compte : {lien}",
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@financeapp.com'),
            recipient_list=[email_employe],
            html_message=f"""
            <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f8fafc;border-radius:16px;">
              <div style="text-align:center;margin-bottom:24px;">
                <div style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:14px;padding:12px 24px;">
                  <span style="color:#fff;font-weight:900;font-size:20px;">FinanceApp</span>
                </div>
              </div>
              <div style="background:#fff;border-radius:12px;padding:28px;box-shadow:0 2px 12px rgba(0,0,0,0.07);">
                <h2 style="margin:0 0 12px;color:#1e293b;">🎉 Vous avez été invité(e) !</h2>
                <p style="color:#64748b;font-size:14px;margin:0 0 16px;">
                  <strong>{admin_user.prenom} {admin_user.nom}</strong> vous invite à rejoindre
                  son espace <strong>FinanceApp Entreprise</strong>.
                </p>
                <p style="color:#64748b;font-size:14px;margin:0 0 24px;">
                  Cliquez sur le bouton ci-dessous pour créer votre mot de passe et activer votre compte.
                  Ce lien est valable <strong>7 jours</strong>.
                </p>
                <div style="text-align:center;margin-bottom:20px;">
                  <a href="{lien}" style="
                    display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);
                    color:#fff;text-decoration:none;border-radius:10px;
                    padding:14px 32px;font-weight:700;font-size:15px;
                    box-shadow:0 4px 16px rgba(99,102,241,0.35);
                  ">✅ Activer mon compte</a>
                </div>
                <p style="color:#94a3b8;font-size:11px;word-break:break-all;">
                  Lien direct : {lien}
                </p>
              </div>
              <p style="text-align:center;margin-top:16px;color:#94a3b8;font-size:11px;">© 2025 FinanceApp</p>
            </div>
            """,
            fail_silently=False,
        )
        return True
    except Exception as e:
        print(f"[EMAIL INVITATION ERROR] {e}")
        return False


# ─── CRÉATION ABONNEMENT ESSAI ────────────────────────────────────────────────
def creer_abonnement_essai(user) -> None:
    from abonnements.models import Abonnement, Plan
    from django.utils import timezone
    from datetime import timedelta

    plan_essai, _ = Plan.objects.get_or_create(
        nom='essai',
        defaults={
            'prix_mensuel': 0, 'prix_annuel': 0,
            'nb_categories_max': 5,
            'description': 'Essai gratuit 14 jours.',
        }
    )
    Abonnement.objects.get_or_create(
        utilisateur=user,
        defaults={
            'plan': plan_essai,
            'type': 'essai',
            'date_fin': timezone.now() + timedelta(days=14),
            'statut': 'actif',
            'montant': 0,
        }
    )