import os
import re
from pathlib import Path
from datetime import timedelta
from dotenv import load_dotenv
import dj_database_url

# Build paths
BASE_DIR = Path(__file__).resolve().parent.parent

# Charger .env (développement local uniquement)
if os.path.exists(BASE_DIR / '.env'):
    load_dotenv(BASE_DIR / '.env')

# ========== SÉCURITÉ ==========
SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-default-key-for-render')
DEBUG = os.getenv('DEBUG', 'False') == 'True'

# ALLOWED_HOSTS - CORRECTION
ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1,.onrender.com,.render.com').split(',')

# ========== APPLICATIONS ==========
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'cloudinary_storage',
    'django.contrib.staticfiles',
    'cloudinary',
    # Third-party
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'django_celery_beat',
    # Local apps
    'comptes',
    'abonnements',
    'transactions',
    'budgets',
    'notifications',
    'logs',
]

# ========== MIDDLEWARE ==========
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'
AUTH_USER_MODEL = 'comptes.Utilisateur'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# ========== BASE DE DONNÉES - CORRECTION FINALE ==========
import dj_database_url

DATABASE_URL = os.environ.get('DATABASE_URL')

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
            'NAME': os.getenv('DB_NAME', 'gestion_financiere'),
            'USER': os.getenv('DB_USER', 'postgres'),
            'PASSWORD': os.getenv('DB_PASSWORD', ''),
            'HOST': os.getenv('DB_HOST', 'localhost'),
            'PORT': os.getenv('DB_PORT', '5432'),
        }
    }

# ========== REST FRAMEWORK ==========
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 10,
    'DEFAULT_PARSER_CLASSES': [
        'rest_framework.parsers.JSONParser',
        'rest_framework.parsers.MultiPartParser',
        'rest_framework.parsers.FormParser',
    ],
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=24),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
}

DATA_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024
FILE_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024

# ========== CORS ==========
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://tresorery-finance-app.netlify.app",
    "https://financeapp-frontend.onrender.com",
]
CORS_ALLOWED_ORIGIN_REGEXES = [r"^https://.*\.onrender\.com$"]
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = [
    'accept', 'accept-encoding', 'authorization', 'content-type',
    'dnt', 'origin', 'user-agent', 'x-csrftoken', 'x-requested-with',
]
CORS_ALLOW_METHODS = ['DELETE', 'GET', 'OPTIONS', 'PATCH', 'POST', 'PUT']

# ========== CELERY ==========
CELERY_BROKER_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
CELERY_RESULT_BACKEND = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
CELERY_BEAT_SCHEDULER = 'django_celery_beat.schedulers:DatabaseScheduler'

# ========== MEDIA & STATIC ==========
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Configuration des fichiers statiques
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
WHITENOISE_MANIFEST_STRICT = False

# Cloudinary pour les médias
DEFAULT_FILE_STORAGE = 'cloudinary_storage.storage.MediaCloudinaryStorage'

# ========== DEFAULT AUTO FIELD ==========
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ========== INTERNATIONALISATION ==========
LANGUAGE_CODE = 'fr-fr'
TIME_ZONE = 'Africa/Nouakchott'
USE_I18N = True
USE_TZ = True

# ========== GOOGLE OAUTH ==========
GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID', '')
GOOGLE_CLIENT_SECRET = os.getenv('GOOGLE_CLIENT_SECRET', '')

# ========== VALIDATION MOTS DE PASSE ==========
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# ========== EMAIL MICROSERVICE ==========
EMAIL_MICROSERVICE_URL = os.getenv('EMAIL_MICROSERVICE_URL', 'https://bmnext.pythonanywhere.com')
EMAIL_MICROSERVICE_API_KEY = os.getenv('EMAIL_MICROSERVICE_API_KEY', '')
EMAIL_MICROSERVICE_SENDER_ID = os.getenv('EMAIL_MICROSERVICE_SENDER_ID', 'financeapp')
EMAIL_MICROSERVICE_TIMEOUT = int(os.getenv('EMAIL_MICROSERVICE_TIMEOUT', 30))

# ========== SSO CONFIGURATION ==========
SSO_ENABLED = os.getenv('SSO_ENABLED', 'False') == 'True'
SSO_CLIENT_ID = os.getenv('SSO_CLIENT_ID', '')
SSO_CLIENT_SECRET = os.getenv('SSO_CLIENT_SECRET', '')
SSO_AUTHORIZATION_URL = os.getenv('SSO_AUTHORIZATION_URL', '')
SSO_TOKEN_URL = os.getenv('SSO_TOKEN_URL', '')
SSO_API_BASE_URL = os.getenv('SSO_API_BASE_URL', '')
SSO_REDIRECT_URI = os.getenv('SSO_REDIRECT_URI', '')
SSO_JWKS_URL = os.getenv('SSO_JWKS_URL', '')
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:3000')

# ========== TRACKPAY ==========
TRACKPAY_API_KEY = os.environ.get('TRACKPAY_API_KEY', '')
TRACKPAY_WEBHOOK_SECRET = os.environ.get('TRACKPAY_WEBHOOK_SECRET', '')
TRACKPAY_API_URL = os.environ.get('TRACKPAY_API_URL', 'https://config-ap28-1mhk.onrender.com/api/payments/create/')

TRACKPAY_PLAN_ID_STANDARD_MENSUEL = os.environ.get('TRACKPAY_PLAN_ID_STANDARD_MENSUEL', '')
TRACKPAY_PLAN_ID_STANDARD_2_MOIS = os.environ.get('TRACKPAY_PLAN_ID_STANDARD_2_MOIS', '')
TRACKPAY_PLAN_ID_STANDARD_3_MOIS = os.environ.get('TRACKPAY_PLAN_ID_STANDARD_3_MOIS', '')
TRACKPAY_PLAN_ID_STANDARD_6_MOIS = os.environ.get('TRACKPAY_PLAN_ID_STANDARD_6_MOIS', '')
TRACKPAY_PLAN_ID_STANDARD_ANNUEL = os.environ.get('TRACKPAY_PLAN_ID_STANDARD_ANNUEL', '')
TRACKPAY_PLAN_ID_ENTREPRISE_MENSUEL = os.environ.get('TRACKPAY_PLAN_ID_ENTREPRISE_MENSUEL', '')
TRACKPAY_PLAN_ID_ENTREPRISE_2_MOIS = os.environ.get('TRACKPAY_PLAN_ID_ENTREPRISE_2_MOIS', '')
TRACKPAY_PLAN_ID_ENTREPRISE_3_MOIS = os.environ.get('TRACKPAY_PLAN_ID_ENTREPRISE_3_MOIS', '')
TRACKPAY_PLAN_ID_ENTREPRISE_6_MOIS = os.environ.get('TRACKPAY_PLAN_ID_ENTREPRISE_6_MOIS', '')
TRACKPAY_PLAN_ID_ENTREPRISE_ANNUEL = os.environ.get('TRACKPAY_PLAN_ID_ENTREPRISE_ANNUEL', '')

TRACKPAY_CALLBACK_BASE_URL = os.environ.get('TRACKPAY_CALLBACK_BASE_URL', 'https://PLACEHOLDER-A-REMPLACER.exemple.mr')

# ========== KYC / OCR / FACE CONFIG ==========
OCR_API_URL = os.getenv("OCR_API_URL", '')
OCR_API_KEY = os.getenv("OCR_API_KEY", '')
NOVA_API_BASE = os.getenv("NOVA_API_BASE", '')
NOVA_API_KEY = os.getenv("NOVA_API_KEY", '')

# ========== CLOUDINARY ==========
import cloudinary

CLOUDINARY_STORAGE = {
    'CLOUD_NAME': os.environ.get('CLOUDINARY_CLOUD_NAME'),
    'API_KEY': os.environ.get('CLOUDINARY_API_KEY'),
    'API_SECRET': os.environ.get('CLOUDINARY_API_SECRET'),
}

cloudinary.config(
    cloud_name=os.environ.get('CLOUDINARY_CLOUD_NAME'),
    api_key=os.environ.get('CLOUDINARY_API_KEY'),
    api_secret=os.environ.get('CLOUDINARY_API_SECRET'),
    secure=True
)