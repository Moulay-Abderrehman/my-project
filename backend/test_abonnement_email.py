import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from comptes.utils import envoyer_email_abonnement

# Test direct de la fonction
code = "123456"
email = "moulayabdrehman73@gmail.com"
plan_nom = "entreprise"
montant = 2000

print(f"Test d'envoi d'email à {email}...")
resultat = envoyer_email_abonnement(email, code, plan_nom, montant)

if resultat:
    print("✅ Email envoyé avec succès!")
    print(f"Vérifiez votre boîte de réception (ou spams) pour le code: {code}")
else:
    print("❌ Échec de l'envoi d'email")