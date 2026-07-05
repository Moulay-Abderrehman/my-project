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

# Créer un superutilisateur automatiquement (optionnel)
echo "👤 Création du superutilisateur..."
python manage.py shell -c "
from django.contrib.auth import get_user_model;
User = get_user_model();
if not User.objects.filter(is_superuser=True).exists():
    User.objects.create_superuser('admin', 'admin@financeapp.com', 'Admin123!')
    print('Superutilisateur créé avec succès')
else:
    print('Superutilisateur existe déjà')
"

echo "========================================="
echo "✅ Build terminé avec succès !"
echo "========================================="