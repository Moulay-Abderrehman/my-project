import os
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
ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1,.onrender.com,.render.com').split(',')

# ========== APPLICATIONS ==========
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
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
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# Ajouter SecurityMiddleware uniquement si le fichier existe (optionnel)
try:
    from comptes import security_middleware
    MIDDLEWARE.insert(1, 'comptes.security_middleware.SecurityMiddleware')
except ImportError:
    pass

ROOT_URLCONF = 'config.urls'

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

# ========== BASE DE DONNÉES ==========
if 'DATABASE_URL' in os.environ:
    # Production sur Render
    DATABASES = {
        'default': dj_database_url.config(
            conn_max_age=600,
            ssl_require=True
        )
    }
else:
    # Développement local
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

AUTH_USER_MODEL = 'comptes.Utilisateur'

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
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=24),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
}

# ========== CORS ==========
CORS_ALLOWED_ORIGINS = os.getenv('CORS_ALLOWED_ORIGINS', 'http://localhost:3000,https://*.onrender.com').split(',')
CORS_ALLOW_CREDENTIALS = True

# ========== CELERY ==========
CELERY_BROKER_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
CELERY_RESULT_BACKEND = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
CELERY_BEAT_SCHEDULER = 'django_celery_beat.schedulers:DatabaseScheduler'

# ========== MEDIA & STATIC ==========
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ========== INTERNATIONALISATION ==========
LANGUAGE_CODE = 'fr-fr'
TIME_ZONE = 'Africa/Nouakchott'
USE_I18N = True
USE_TZ = True

# ========== GOOGLE OAUTH ==========
GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID', '')
GOOGLE_CLIENT_SECRET = os.getenv('GOOGLE_CLIENT_SECRET', '')

# ========== EMAIL ==========
EMAIL_BACKEND = os.getenv('EMAIL_BACKEND', 'django.core.mail.backends.smtp.EmailBackend')
EMAIL_HOST = os.getenv('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = int(os.getenv('EMAIL_PORT', 587))
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD', '')
EMAIL_USE_TLS = os.getenv('EMAIL_USE_TLS', 'True') == 'True'
EMAIL_USE_SSL = os.getenv('EMAIL_USE_SSL', 'False') == 'True'
DEFAULT_FROM_EMAIL = os.getenv('DEFAULT_FROM_EMAIL', f'FinanceApp <{EMAIL_HOST_USER}>')

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