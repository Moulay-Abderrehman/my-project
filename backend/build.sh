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