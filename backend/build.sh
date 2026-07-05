#!/bin/bash
# backend/build.sh - Script de build pour Render

set -o errexit
set -o pipefail
set -o nounset

echo "========================================="
echo "🚀 Démarrage du build de FinanceApp"
echo "========================================="

# Créer le dossier logs
mkdir -p logs

# Installer les dépendances
echo "📦 Installation des dépendances Python..."
pip install --upgrade pip
pip install -r requirements.txt

# Collecter les fichiers statiques
echo "📁 Collecte des fichiers statiques..."
python manage.py collectstatic --noinput --clear

# Appliquer les migrations
echo "🗄️ Application des migrations..."
python manage.py makemigrations --noinput
python manage.py migrate --noinput

echo "👤 Création du superutilisateur..."
python manage.py shell -c "
from django.contrib.auth import get_user_model;
User = get_user_model();
if not User.objects.filter(is_superuser=True).exists():
    #  Correction: telephone en premier paramètre, puis password
    User.objects.create_superuser(
        telephone='+22231234567',  # Numéro valide (commence par +222 suivi de 2,3,4)
        password='Admin123!',
        nom='Admin',
        prenom='Super',
        email='admin@financeapp.com',
        is_active=True
    )
    print(' Superutilisateur créé avec succès')
else:
    print('ℹ Superutilisateur existe déjà')
"

echo "========================================="
echo " Build terminé avec succès !"
echo "========================================="