"""
Service d'envoi d'emails via le microservice Email Microservice API.
Remplace l'ancien système SMTP Gmail.
"""

import json
import ssl
import requests
from django.conf import settings
from django.core.mail import get_connection

# Configuration du microservice
EMAIL_MICROSERVICE_URL = getattr(settings, 'EMAIL_MICROSERVICE_URL', 'https://bmnext.pythonanywhere.com')
EMAIL_MICROSERVICE_API_KEY = getattr(settings, 'EMAIL_MICROSERVICE_API_KEY', '')
EMAIL_MICROSERVICE_SENDER_ID = getattr(settings, 'EMAIL_MICROSERVICE_SENDER_ID', 'financeapp')
EMAIL_MICROSERVICE_TIMEOUT = getattr(settings, 'EMAIL_MICROSERVICE_TIMEOUT', 30)


def envoyer_email_microservice(
    to: str,
    subject: str,
    message: str,
    html_message: str = None,
    sender_name: str = "FinanceApp",
    sender_color: str = "#0c2e7c",
    sender_logo: str = None,
    template_name: str = None,
    custom_sender: dict = None,
) -> bool:
    """
    Envoie un email via le microservice Email Microservice API.
    
    Args:
        to: Adresse email du destinataire
        subject: Sujet de l'email
        message: Version texte du message
        html_message: Version HTML du message (optionnel)
        sender_name: Nom de l'expéditeur
        sender_color: Couleur de l'expéditeur (hex)
        sender_logo: URL du logo (optionnel)
        template_name: Nom du template HTML (optionnel)
        custom_sender: Configuration SMTP personnalisée (optionnel)
    
    Returns:
        bool: True si l'email a été envoyé avec succès, False sinon
    """
    if not EMAIL_MICROSERVICE_API_KEY:
        print("[EMAIL MICROSERVICE ERROR] API_KEY non configurée")
        return False
    
    # Construction du payload
    payload = {
        "api_key": EMAIL_MICROSERVICE_API_KEY,
        "to": to,
        "subject": subject,
        "message": message,
        "sender": {
            "name": sender_name,
            "color": sender_color,
        }
    }
    
    # Ajout du logo si fourni
    if sender_logo:
        payload["sender"]["logo"] = sender_logo
    else:
        # Logo par défaut (vous pouvez mettre votre propre logo)
        payload["sender"]["logo"] = "https://i.ibb.co/G4Shb0Xq/finance.png" #"https://votre-domaine.com/logo.png"
    
    # Si un template est spécifié
    if template_name:
        payload["template_name"] = template_name
    
    # Si un contenu HTML personnalisé est fourni
    if html_message:
        payload["html_message"] = html_message
    
    # Si un expéditeur personnalisé est fourni (pour les emails d'entreprise)
    if custom_sender:
        payload["custom_email"] = custom_sender
    
    try:
        response = requests.post(
            f"{EMAIL_MICROSERVICE_URL}/senders/send-email",
            json=payload,
            timeout=EMAIL_MICROSERVICE_TIMEOUT,
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success', False):
                print(f"[EMAIL MICROSERVICE] Email envoyé avec succès à {to}")
                return True
            else:
                print(f"[EMAIL MICROSERVICE] Erreur: {data.get('message', 'Unknown error')}")
                return False
        else:
            print(f"[EMAIL MICROSERVICE] HTTP {response.status_code}: {response.text}")
            return False
            
    except requests.exceptions.Timeout:
        print(f"[EMAIL MICROSERVICE] Timeout lors de l'envoi à {to}")
        return False
    except requests.exceptions.ConnectionError:
        print(f"[EMAIL MICROSERVICE] Erreur de connexion")
        return False
    except Exception as e:
        print(f"[EMAIL MICROSERVICE] Erreur inattendue: {e}")
        return False


def envoyer_email_avec_template(
    to: str,
    subject: str,
    message: str,
    template_name: str = "welcome",
    sender_name: str = "FinanceApp",
    sender_color: str = "#0c2e7c",
    sender_logo: str = None,
) -> bool:
    """
    Envoie un email en utilisant un template HTML pré-défini.
    
    Args:
        to: Adresse email du destinataire
        subject: Sujet de l'email
        message: Message (sera utilisé comme contenu du template)
        template_name: Nom du template (ex: "welcome", "notification", "invoice")
        sender_name: Nom de l'expéditeur
        sender_color: Couleur de l'expéditeur
        sender_logo: URL du logo
    
    Returns:
        bool: True si l'email a été envoyé avec succès, False sinon
    """
    return envoyer_email_microservice(
        to=to,
        subject=subject,
        message=message,
        sender_name=sender_name,
        sender_color=sender_color,
        sender_logo=sender_logo,
        template_name=template_name,
    )


def envoyer_email_avec_contenu_html(
    to: str,
    subject: str,
    message: str,
    html_message: str,
    sender_name: str = "FinanceApp",
    sender_color: str = "#0c2e7c",
    sender_logo: str = None,
) -> bool:
    """
    Envoie un email avec un contenu HTML personnalisé.
    
    Args:
        to: Adresse email du destinataire
        subject: Sujet de l'email
        message: Version texte du message (fallback)
        html_message: Version HTML complète du message
        sender_name: Nom de l'expéditeur
        sender_color: Couleur de l'expéditeur
        sender_logo: URL du logo
    
    Returns:
        bool: True si l'email a été envoyé avec succès, False sinon
    """
    return envoyer_email_microservice(
        to=to,
        subject=subject,
        message=message,
        html_message=html_message,
        sender_name=sender_name,
        sender_color=sender_color,
        sender_logo=sender_logo,
    )


def envoyer_email_avec_smtp_personnalise(
    to: str,
    subject: str,
    message: str,
    email_sender: str,
    email_app_password: str,
    sender_name: str = None,
    sender_color: str = "#0c2e7c",
    sender_logo: str = None,
) -> bool:
    """
    Envoie un email via un serveur SMTP personnalisé.
    Utile pour les emails d'entreprise avec leur propre domaine.
    
    Args:
        to: Adresse email du destinataire
        subject: Sujet de l'email
        message: Message
        email_sender: Email de l'expéditeur (ex: "reports@entreprise.com")
        email_app_password: Mot de passe d'application SMTP
        sender_name: Nom de l'expéditeur (optionnel)
        sender_color: Couleur de l'expéditeur
        sender_logo: URL du logo
    
    Returns:
        bool: True si l'email a été envoyé avec succès, False sinon
    """
    custom_sender = {
        "email_sender": email_sender,
        "email_app_password": email_app_password,
    }
    
    return envoyer_email_microservice(
        to=to,
        subject=subject,
        message=message,
        sender_name=sender_name or "FinanceApp",
        sender_color=sender_color,
        sender_logo=sender_logo,
        custom_sender=custom_sender,
    )