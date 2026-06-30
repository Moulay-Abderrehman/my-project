"""
Script de test pour le microservice email.
Exécutez avec : python manage.py shell < test_email.py
Ou : python manage.py runscript test_email (si django-extensions installé)
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from comptes.email_service import (
    envoyer_email_microservice,
    envoyer_email_avec_contenu_html,
    envoyer_email_avec_template,
)
from comptes.utils import envoyer_email_reset, envoyer_email_verification_compte

def test_envoyer_email_simple():
    """Test d'envoi d'email simple"""
    print("Test d'envoi d'email simple...")
    result = envoyer_email_microservice(
        to="moulayabdrehman73@gmail.com",
        subject="Test Email Microservice",
        message="Ceci est un test de l'intégration du microservice email.",
        sender_name="FinanceApp Test",
        sender_color="#FF5733",
    )
    print(f"Résultat: {result}")
    return result

def test_envoyer_email_html():
    """Test d'envoi d'email avec HTML"""
    print("\nTest d'envoi d'email avec HTML...")
    html = """
    <div style="font-family:Arial,sans-serif;padding:20px;background:#f0f0f0;">
        <h1 style="color:#0c2e7c;">Test HTML</h1>
        <p>Ceci est un <strong>test</strong> avec du contenu HTML.</p>
        <div style="background:#eef2ff;padding:16px;border-radius:8px;">
            <span style="font-size:24px;">✅ Test réussi</span>
        </div>
    </div>
    """
    result = envoyer_email_avec_contenu_html(
        to="moulayabdrehman73@gmail.com",
        subject="Test HTML - Email Microservice",
        message="Ceci est un test avec HTML.",
        html_message=html,
        sender_name="FinanceApp Test",
        sender_color="#0c2e7c",
    )
    print(f"Résultat: {result}")
    return result

def test_envoyer_email_avec_template():
    """Test d'envoi d'email avec template"""
    print("\nTest d'envoi d'email avec template...")
    result = envoyer_email_avec_template(
        to="moulayabdrehman73@gmail.com",
        subject="Test Template - Email Microservice",
        message="Ceci est un test avec le template 'welcome'.",
        template_name="welcome",
        sender_name="FinanceApp Test",
        sender_color="#0c2e7c",
    )
    print(f"Résultat: {result}")
    return result

if __name__ == "__main__":
    print("=== TESTS EMAIL MICROSERVICE ===\n")
    
    success = True
    
    # Test 1: Email simple
    if not test_envoyer_email_simple():
        success = False
    
    # Test 2: Email HTML
    if not test_envoyer_email_html():
        success = False
    
    # Test 3: Email avec template
    if not test_envoyer_email_avec_template():
        success = False
    
    print(f"\n=== RÉSULTAT GLOBAL: {'✅ SUCCÈS' if success else '❌ ÉCHEC'} ===")