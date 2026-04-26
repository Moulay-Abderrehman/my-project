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

#remplacer
def envoyer_email_reset(email: str, code: str) -> bool:
    try:
        # Créer un contexte SSL qui ignore la vérification
        context = ssl.create_default_context()
        context.check_hostname = False
        context.verify_mode = ssl.CERT_NONE
        
        # Configuration email avec SSL personnalisé
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
            subject="FinanceApp — Code de réinitialisation",
            message=f"Votre code : {code}\nValable 5 minutes.",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            html_message=f"""
            <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f8fafc;border-radius:16px;">
                <div style="text-align:center;margin-bottom:24px;">
                    <div style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:14px;padding:12px 24px;">
                        <span style="color:#fff;font-weight:900;font-size:20px;">FinanceApp</span>
                    </div>
                </div>
                <div style="background:#fff;border-radius:12px;padding:28px;box-shadow:0 2px 12px rgba(0,0,0,0.07);">
                    <h2 style="margin:0 0 12px;color:#1e293b;">Réinitialisation du mot de passe</h2>
                    <p style="color:#64748b;font-size:14px;margin:0 0 20px;">
                        Voici votre code de réinitialisation. Il est valable <strong>5 minutes</strong>.
                    </p>
                    <div style="text-align:center;background:#eef2ff;border-radius:12px;padding:24px;margin-bottom:20px;">
                        <span style="font-size:42px;font-weight:900;letter-spacing:14px;color:#6366f1;">{code}</span>
                    </div>
                    <p style="color:#94a3b8;font-size:12px;margin:0;">
                        Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
                    </p>
                </div>
                <p style="text-align:center;margin-top:16px;color:#94a3b8;font-size:11px;">© 2025 FinanceApp</p>
            </div>
            """,
            fail_silently=False,
            connection=connection,
        )
        return True
    except Exception as e:
        print(f"[EMAIL RESET ERROR] {e}")
        return False
# ─── EMAIL RESET MOT DE PASSE ────────────────────────────────────────────────
'''
def envoyer_email_reset(email: str, code: str) -> bool:
    try:
        send_mail(
            subject="FinanceApp — Code de réinitialisation",
            message=f"Votre code : {code}\nValable 5 minutes.",
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@financeapp.com'),
            recipient_list=[email],
            html_message=f"""
            <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f8fafc;border-radius:16px;">
              <div style="text-align:center;margin-bottom:24px;">
                <div style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:14px;padding:12px 24px;">
                  <span style="color:#fff;font-weight:900;font-size:20px;">FinanceApp</span>
                </div>
              </div>
              <div style="background:#fff;border-radius:12px;padding:28px;box-shadow:0 2px 12px rgba(0,0,0,0.07);">
                <h2 style="margin:0 0 12px;color:#1e293b;">Réinitialisation du mot de passe</h2>
                <p style="color:#64748b;font-size:14px;margin:0 0 20px;">
                  Voici votre code de réinitialisation. Il est valable <strong>5 minutes</strong>.
                </p>
                <div style="text-align:center;background:#eef2ff;border-radius:12px;padding:24px;margin-bottom:20px;">
                  <span style="font-size:42px;font-weight:900;letter-spacing:14px;color:#6366f1;">{code}</span>
                </div>
                <p style="color:#94a3b8;font-size:12px;margin:0;">
                  Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
                </p>
              </div>
              <p style="text-align:center;margin-top:16px;color:#94a3b8;font-size:11px;">© 2025 FinanceApp</p>
            </div>
            """,
            fail_silently=False,
        )
        return True
    except Exception as e:
        print(f"[EMAIL RESET ERROR] {e}")
        return False

'''
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


