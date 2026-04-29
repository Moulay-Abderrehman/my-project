<<<<<<< HEAD
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

# Créer un superutilisateur si nécessaire (optionnel)
# echo "👤 Création du superutilisateur..."
# python manage.py shell -c "from django.contrib.auth import get_user_model; User = get_user_model(); User.objects.create_superuser('admin', 'admin@example.com', 'admin123') if not User.objects.filter(is_superuser=True).exists() else None"

echo "========================================="
echo "✅ Build terminé avec succès !"
echo "========================================="
=======
#!/usr/bin/env bash
# backend/build.sh — exécuté par Render à chaque déploiement
set -o errexit

echo "==> Installation des dépendances..."
pip install -r requirements.txt

echo "==> Migrations base de données..."
python manage.py migrate --no-input

echo "==> Collecte fichiers statiques..."
python manage.py collectstatic --no-input

echo "==> Build terminé ✓"
>>>>>>> travail-email
