# backend/config/settings_production.py
import os
import dj_database_url
from pathlib import Path
from .settings import *

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = False

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-change-me-in-production')

# Hosts autorisés
ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', '.onrender.com,localhost,127.0.0.1').split(',')

# Trusted origins for CSRF
CSRF_TRUSTED_ORIGINS = [
    'https://*.onrender.com',
    'https://*.render.com',
    'http://localhost:3000',
    'http://localhost:8000',
    os.environ.get('FRONTEND_URL', 'https://ton-frontend.netlify.app'),
]

# CORS configuration
CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://localhost:8000',
    os.environ.get('FRONTEND_URL', 'https://ton-frontend.netlify.app'),
    'https://*.onrender.com',
]

CORS_ALLOW_CREDENTIALS = True

# Database configuration
DATABASE_URL = os.environ.get('DATABASE_URL', '')
if DATABASE_URL:
    DATABASES = {
        'default': dj_database_url.config(
            default=DATABASE_URL,
            conn_max_age=600,
            ssl_require=True
        )
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.environ.get('DB_NAME', 'gestion_financiere'),
            'USER': os.environ.get('DB_USER', 'postgres'),
            'PASSWORD': os.environ.get('DB_PASSWORD', ''),
            'HOST': os.environ.get('DB_HOST', 'localhost'),
            'PORT': os.environ.get('DB_PORT', '5432'),
        }
    }

# Redis configuration
REDIS_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')

# Email configuration (Gmail)
EMAIL_BACKEND = os.environ.get('EMAIL_BACKEND', 'django.core.mail.backends.smtp.EmailBackend')
EMAIL_HOST = os.environ.get('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = int(os.environ.get('EMAIL_PORT', 465))
EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD', '')
EMAIL_USE_TLS = os.environ.get('EMAIL_USE_TLS', 'False') == 'True'
EMAIL_USE_SSL = os.environ.get('EMAIL_USE_SSL', 'True') == 'True'
DEFAULT_FROM_EMAIL = f'FinanceApp <{EMAIL_HOST_USER}>'

# Frontend URL
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'https://ton-frontend.netlify.app')

# Google OAuth
GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID', '')
GOOGLE_CLIENT_SECRET = os.environ.get('GOOGLE_CLIENT_SECRET', '')

# SSO Configuration
SSO_ENABLED = os.environ.get('SSO_ENABLED', 'False') == 'True'
SSO_CLIENT_ID = os.environ.get('SSO_CLIENT_ID', '')
SSO_CLIENT_SECRET = os.environ.get('SSO_CLIENT_SECRET', '')
SSO_AUTHORIZATION_URL = os.environ.get('SSO_AUTHORIZATION_URL', '')
SSO_TOKEN_URL = os.environ.get('SSO_TOKEN_URL', '')
SSO_API_BASE_URL = os.environ.get('SSO_API_BASE_URL', '')
SSO_REDIRECT_URI = os.environ.get('SSO_REDIRECT_URI', '')
SSO_JWKS_URL = os.environ.get('SSO_JWKS_URL', '')

# RSS SOC KIT Configuration
RSS_SOC_APP_NAME = os.environ.get('RSS_SOC_APP_NAME', 'financeapp')
RSS_SOC_URL = os.environ.get('RSS_SOC_URL', 'http://198.199.70.48:3100')
RSS_SOC_TOKEN = os.environ.get('RSS_SOC_TOKEN', '')
RSS_SOC_LOCAL_LOGS = os.environ.get('RSS_SOC_LOCAL_LOGS', './logs')
RSS_SOC_ENV = os.environ.get('RSS_SOC_ENV', 'production')
RSS_SOC_ALERT_EMAIL = os.environ.get('RSS_SOC_ALERT_EMAIL', '')

# Static and Media files
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_DIRS = [
    os.path.join(BASE_DIR, 'static'),
]

MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# WhiteNoise configuration (pour servir les fichiers statiques)
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Add WhiteNoise middleware at the correct position
MIDDLEWARE.insert(1, 'whitenoise.middleware.WhiteNoiseMiddleware')

# Security settings for production
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

# HTTPS settings (à activer en production avec SSL)
if not DEBUG:
    SECURE_SSL_REDIRECT = os.environ.get('SECURE_SSL_REDIRECT', 'False') == 'True'
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = 31536000  # 1 year
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True

# Logging configuration
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {asctime} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
        'file': {
            'class': 'logging.FileHandler',
            'filename': os.path.join(BASE_DIR, 'logs', 'django.log'),
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': os.environ.get('DJANGO_LOG_LEVEL', 'INFO'),
            'propagate': False,
        },
        'django.request': {
            'handlers': ['console'],
            'level': 'ERROR',
            'propagate': False,
        },
    },
}

# Créer le dossier logs s'il n'existe pas
os.makedirs(os.path.join(BASE_DIR, 'logs'), exist_ok=True)