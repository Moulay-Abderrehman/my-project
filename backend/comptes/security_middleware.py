"""
RSS BANK — Security Middleware v6
Détection SQLi / XSS / Path Traversal / Brute Force
Push vers Loki + persistence DB + ban IP en mémoire

Configuration (variables d'environnement dans .env) :
  RSS_SOC_APP_NAME   → nom de l'app dans Loki  (ex: rss-bank, financeapp-moulay)
  RSS_SOC_LOKI_URL   → URL de Loki             (ex: http://198.199.70.48:3100)
  RSS_SOC_ENV        → prod / dev / staging     (défaut: prod)
  RSS_SOC_DB_TABLE   → table de log BF          (défaut: rss_soc_login_failures)

Installation :
  1. Copier ce fichier dans votre projet Django (ex: myapp/security_middleware.py)
  2. Ajouter dans settings.py :
       MIDDLEWARE = ['myapp.security_middleware.SecurityMiddleware', ...]
       RSS_SOC_APP_NAME = os.environ.get('RSS_SOC_APP_NAME', 'mon-app')
       RSS_SOC_LOKI_URL = os.environ.get('RSS_SOC_LOKI_URL', 'http://198.199.70.48:3100')
  3. Créer la table DB :
       CREATE TABLE rss_soc_login_failures (id SERIAL PRIMARY KEY, ip VARCHAR(45), ts TIMESTAMP DEFAULT NOW());
"""
import json
import logging
import os
import re
import threading
import time
from collections import defaultdict
from datetime import datetime, timezone

# ─── Configuration ──────────────────────────────────────────────────────────

APP_NAME  = os.environ.get('RSS_SOC_APP_NAME', 'rss-bank')
LOKI_URL  = os.environ.get('RSS_SOC_LOKI_URL', 'http://198.199.70.48:3100')
ENV       = os.environ.get('RSS_SOC_ENV', 'prod')
DB_TABLE  = os.environ.get('RSS_SOC_DB_TABLE', 'rss_soc_login_failures')

BRUTE_FORCE_THRESHOLD = 5    # tentatives avant ban
BRUTE_FORCE_WINDOW    = 300  # fenêtre en secondes (5 min)
BAN_DURATION          = 900  # durée du ban en secondes (15 min)

WHITELIST_IPS = {'127.0.0.1', '::1', 'localhost'}

# Endpoints de connexion — toutes langues / frameworks
LOGIN_KEYWORDS = (
    'login', 'auth', 'signin', 'sign-in',
    'connexion', 'connect', 'session',
    'token', 'jwt', 'oauth',
    'mot-de-passe', 'password', 'pwd',
    'credentials', 'authenticate',
)

# ─── Loggers ────────────────────────────────────────────────────────────────

security_logger = logging.getLogger('security')
access_logger   = logging.getLogger('access')

# ─── Patterns de détection ──────────────────────────────────────────────────

SQL_PATTERNS = re.compile(
    r"(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|CAST|CONVERT|TRUNCATE|REPLACE|MERGE)\b"
    r"|--"                          # commentaire SQL (fix bug 3: capture admin'-- et variantes)
    r"|/\*.*?\*/"                   # commentaire bloc
    r"|;(\s*(DROP|DELETE|UPDATE|INSERT|SELECT))"
    r"|('|\")(\s)*(OR|AND)(\s)*(('|\")|\d)"
    r"|\bOR\s+1\s*=\s*1\b"
    r"|SLEEP\s*\("
    r"|BENCHMARK\s*\("
    r"|WAITFOR\s+DELAY"
    r"|INTO\s+OUTFILE"
    r"|LOAD_FILE\s*\()",
    re.IGNORECASE | re.DOTALL
)

XSS_PATTERNS = re.compile(
    r"(<\s*script|<\s*/\s*script"
    r"|javascript\s*:"
    r"|on\w+\s*="
    r"|<\s*iframe|<\s*object|<\s*embed|<\s*svg"
    r"|<\s*img[^>]*onerror"
    r"|alert\s*\("
    r"|document\.(cookie|location|write)"
    r"|window\.(location|open)"
    r"|fetch\s*\("
    r"|eval\s*\("
    r"|expression\s*\()",
    re.IGNORECASE
)

PATH_TRAVERSAL = re.compile(
    r"\.\.[/\\]"           # ../  ..\
    r"|%2e%2e[%2f%5c]"    # URL encodé
    r"|%252e%252e"         # double encodé
    r"|\.\.[%\s]"          # variantes
)

# ─── Loki push (background worker) ─────────────────────────────────────────

_loki_queue  = []
_loki_lock   = threading.Lock()
_loki_thread = None

def _loki_worker():
    import urllib.request
    endpoint = LOKI_URL.rstrip('/') + '/loki/api/v1/push'
    while True:
        time.sleep(2)
        with _loki_lock:
            batch = _loki_queue[:]
            _loki_queue.clear()
        if not batch:
            continue
        streams = defaultdict(list)
        for entry in batch:
            key = (entry['event'], entry.get('env', ENV))
            streams[key].append(entry)
        payload_streams = []
        for (event, env), entries in streams.items():
            labels = (
                f'{{job="django-security", app="{APP_NAME}", '
                f'event="{event}", env="{env}"}}'
            )
            values = [
                [str(e['ts_ns']), json.dumps({k: v for k, v in e.items() if k != 'ts_ns'})]
                for e in entries
            ]
            payload_streams.append({'stream': {'job': 'django-security', 'app': APP_NAME, 'event': event, 'env': env}, 'values': values})
        body = json.dumps({'streams': payload_streams}).encode()
        try:
            req = urllib.request.Request(endpoint, data=body, headers={'Content-Type': 'application/json'})
            urllib.request.urlopen(req, timeout=3)
        except Exception:
            pass

def _ensure_loki_worker():
    global _loki_thread
    if _loki_thread is None or not _loki_thread.is_alive():
        _loki_thread = threading.Thread(target=_loki_worker, daemon=True)
        _loki_thread.start()

def _push_loki(event: str, ip: str, extra: dict = None):
    _ensure_loki_worker()
    entry = {
        'ts_ns': str(int(time.time() * 1e9)),
        'event': event,
        'ip': ip,
        'app': APP_NAME,
        'env': ENV,
    }
    if extra:
        entry.update(extra)
    with _loki_lock:
        _loki_queue.append(entry)

# ─── Brute-force : état en mémoire ─────────────────────────────────────────

_bf_lock      = threading.Lock()
_bf_attempts  = defaultdict(list)   # ip → [timestamp, ...]
_bf_banned    = {}                  # ip → ban_expiry_timestamp

def _record_failed_login(ip: str):
    now = time.time()
    with _bf_lock:
        _bf_attempts[ip] = [t for t in _bf_attempts[ip] if now - t < BRUTE_FORCE_WINDOW]
        _bf_attempts[ip].append(now)
        count = len(_bf_attempts[ip])
        if count >= BRUTE_FORCE_THRESHOLD:
            _bf_banned[ip] = now + BAN_DURATION
            return count, True
        return count, False

def _is_banned(ip: str) -> bool:
    with _bf_lock:
        expiry = _bf_banned.get(ip)
        if expiry is None:
            return False
        if time.time() > expiry:
            del _bf_banned[ip]
            return False
        return True

def _persist_failure_db(ip: str):
    try:
        from django.db import connection
        with connection.cursor() as cur:
            cur.execute(
                f"INSERT INTO {DB_TABLE} (ip) VALUES (%s)",
                [ip]
            )
    except Exception:
        pass

# ─── Helpers ────────────────────────────────────────────────────────────────

def _get_ip(request) -> str:
    xff = request.META.get('HTTP_X_FORWARDED_FOR', '')
    if xff:
        return xff.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR', 'unknown')

def _detect(value: str) -> list:
    threats = []
    if SQL_PATTERNS.search(value):
        threats.append('SQL_INJECTION')
    if XSS_PATTERNS.search(value):
        threats.append('XSS')
    if PATH_TRAVERSAL.search(value):
        threats.append('PATH_TRAVERSAL')
    return threats

def _scan_request(request) -> list:
    threats = []

    # FIX BUG 2 — vérifier le RAW URI avant normalisation Django
    # Django/WSGI normalise request.path et supprime les séquences ../
    # RAW_URI ou REQUEST_URI conserve la forme originale de l'URL
    raw_uri = request.META.get('RAW_URI') or request.META.get('REQUEST_URI', '')
    if raw_uri:
        threats += _detect(raw_uri)

    # Path normalisé (double-check)
    threats += _detect(request.path)

    # Query string
    qs = request.META.get('QUERY_STRING', '')
    if qs:
        threats += _detect(qs)

    # Corps de la requête
    try:
        body = request.body.decode('utf-8', errors='ignore')
        if body:
            threats += _detect(body)
    except Exception:
        pass

    return list(set(threats))

def _log_security(event: str, ip: str, request=None, extra: dict = None):
    entry = {
        'ts': datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
        'event': event,
        'ip': ip,
        'app': APP_NAME,
    }
    if request:
        entry['method'] = request.method
        entry['path'] = request.path
        user = getattr(request, 'user', None)
        if user and hasattr(user, 'email') and getattr(user, 'is_authenticated', False):
            entry['user'] = user.email
    if extra:
        entry.update(extra)
    security_logger.warning(json.dumps(entry))
    _push_loki(event, ip, {k: v for k, v in entry.items() if k not in ('event', 'ip')})

# ─── Middleware ──────────────────────────────────────────────────────────────

class SecurityMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
        _ensure_loki_worker()

    def __call__(self, request):
        start = time.time()
        ip    = _get_ip(request)

        # ── 1. IP bannie → 429 immédiat ────────────────────────────
        if ip not in WHITELIST_IPS and _is_banned(ip):
            from django.http import JsonResponse
            _log_security('IP_BANNED', ip, request)
            return JsonResponse({'detail': 'Too many requests. Try again later.'}, status=429)

        # ── 2. Détection de menaces AVANT traitement ───────────────
        if ip not in WHITELIST_IPS:
            threats = _scan_request(request)
            for threat in threats:
                _log_security(threat, ip, request)

        # ── 3. Traitement de la requête ────────────────────────────
        response = self.get_response(request)
        duration = int((time.time() - start) * 1000)

        # ── 4. Détection brute force sur les endpoints de connexion
        # FIX BUG 1 — LOGIN_KEYWORDS couvre les endpoints français et anglais
        is_login = (
            request.method == 'POST'
            and any(kw in request.path.lower() for kw in LOGIN_KEYWORDS)
        )
        if ip not in WHITELIST_IPS and is_login and response.status_code in (400, 401, 403):
            count, just_banned = _record_failed_login(ip)
            _persist_failure_db(ip)
            if just_banned:
                _log_security('BRUTE_FORCE', ip, request, {
                    'attempts': count,
                    'ban_duration': BAN_DURATION,
                })
            elif count >= 3:
                _log_security('LOGIN_FAILURE', ip, request, {'attempt': count})

        # ── 5. Log d'accès ─────────────────────────────────────────
        user = getattr(request, 'user', None)
        user_email = (
            user.email
            if (user and hasattr(user, 'email') and getattr(user, 'is_authenticated', False))
            else 'anonymous'
        )
        access_entry = {
            'ts': datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
            'method': request.method,
            'path': request.path,
            'status': response.status_code,
            'ip': ip,
            'user': user_email,
            'duration_ms': duration,
            'app': APP_NAME,
        }
        access_logger.info(json.dumps(access_entry))

        # ── 6. Alertes codes HTTP ───────────────────────────────────
        if ip not in WHITELIST_IPS:
            if response.status_code == 401:
                _log_security('UNAUTHORIZED', ip, request, {'user': user_email})
            elif response.status_code == 403:
                _log_security('FORBIDDEN', ip, request, {'user': user_email})

        return response