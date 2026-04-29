import os
from pathlib import Path
from decouple import config
from datetime import timedelta
from dotenv import load_dotenv #ajoute

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / '.env') #ajoute

SECRET_KEY = os.getenv('SECRET_KEY')     #remplacer  #SECRET_KEY = config('SECRET_KEY')
DEBUG = os.getenv('DEBUG', 'False') == 'True' #remplace    #DEBUG = config('DEBUG', default=True, cast=bool)
ALLOWED_HOSTS = ['localhost', '127.0.0.1']      #ALLOWED_HOSTS = ['*']

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Third-party
    'rest_framework',
    'rest_framework_simplejwt',  # ajoute
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

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'comptes.security_middleware.SecurityMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

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

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': config('DB_NAME'),
        'USER': config('DB_USER'),
        'PASSWORD': config('DB_PASSWORD'),
        'HOST': config('DB_HOST', default='localhost'),
        'PORT': config('DB_PORT', default='5432'),
    }
}

AUTH_USER_MODEL = 'comptes.Utilisateur'

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
    'USER_ID_FIELD': 'id',  # ← Important : 'id' pas 'user_id'
    'USER_ID_CLAIM': 'user_id',   # ← Le claim dans le token
}

CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
CORS_ALLOW_CREDENTIALS = False #True

# ── CELERY ────────────────────────────────────────────────────────────────────
CELERY_BROKER_URL = config('REDIS_URL', default='redis://localhost:6379/0')
CELERY_RESULT_BACKEND = config('REDIS_URL', default='redis://localhost:6379/0')
CELERY_BEAT_SCHEDULER = 'django_celery_beat.schedulers:DatabaseScheduler'

# ── MEDIA & STATIC ────────────────────────────────────────────────────────────
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

LANGUAGE_CODE = 'fr-fr'
TIME_ZONE = 'Africa/Nouakchott'
USE_I18N = True
USE_TZ = True

# ── Google OAuth (lire depuis .env) ─────────────────────────────────────────
GOOGLE_CLIENT_ID     = config('GOOGLE_CLIENT_ID', default='')
GOOGLE_CLIENT_SECRET = config('GOOGLE_CLIENT_SECRET', default='')

# ── Email SMTP ──────────────
# ── EMAIL - Configuration SMTP (CRITIQUE POUR ENVOI D'EMAILS) ─────────────────
EMAIL_BACKEND = os.getenv('EMAIL_BACKEND', 'django.core.mail.backends.smtp.EmailBackend')
EMAIL_HOST = os.getenv('EMAIL_HOST')
EMAIL_PORT = int(os.getenv('EMAIL_PORT', 587))
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD')
EMAIL_USE_TLS = os.getenv('EMAIL_USE_TLS', 'True') == 'True'
EMAIL_USE_SSL = os.getenv('EMAIL_USE_SSL', 'False') == 'True'
DEFAULT_FROM_EMAIL = os.getenv('DEFAULT_FROM_EMAIL', f"FinanceApp <{EMAIL_HOST_USER}>")

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


# ── URL FRONTEND (pour les liens d'invitation) ────────────────────────────────
FRONTEND_URL = config('FRONTEND_URL', default='http://localhost:3000')

'''
# ── SSL Fix pour Django EmailBackend ─────────────────────────────────────────
import ssl
from django.core.mail.backends import smtp as django_smtp

# Créer un contexte SSL permissif
_ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
_ssl_context.check_hostname = False
_ssl_context.verify_mode = ssl.CERT_NONE

# Patcher le EmailBackend de Django pour utiliser ce contexte
_original_open = django_smtp.EmailBackend.open

def _patched_open(self):
    if self.connection:
        return False
    import smtplib
    self.connection = smtplib.SMTP_SSL(
        self.host, self.port,
        context=_ssl_context,
        timeout=self.timeout,
    )
    self.connection.ehlo()
    if self.username and self.password:
        self.connection.login(self.username, self.password)
    return True

django_smtp.EmailBackend.open = _patched_open'''



# backend/config/settings.py

# ========== CORRECTION SSL POUR GMAIL (PORT 587 STARTTLS) ==========
import ssl
import smtplib
from django.core.mail.backends import smtp as django_smtp

# Sauvegarder la méthode originale
_original_open = django_smtp.EmailBackend.open

def _patched_open(self):
    if self.connection:
        return False
    
    # Connexion normale (pas SSL direct)
    self.connection = smtplib.SMTP(self.host, self.port, timeout=self.timeout)
    self.connection.ehlo()
    
    # Si TLS est activé (STARTTLS)
    if self.use_tls:
        # Créer un contexte SSL permissif pour le développement
        context = ssl.create_default_context()
        context.check_hostname = False
        context.verify_mode = ssl.CERT_NONE
        self.connection.starttls(context=context)
        self.connection.ehlo()
    
    # Authentification
    if self.username and self.password:
        self.connection.login(self.username, self.password)
    
    return True

# Appliquer le patch
django_smtp.EmailBackend.open = _patched_open

print("✅ Patch SSL appliqué pour Gmail (STARTTLS port 587)")