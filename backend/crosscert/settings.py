"""
Django settings for CROSSCERT project.
"""
import os
from pathlib import Path

# Apply runtime monkeypatches (safe no-op if Django not available yet)
try:
    # This module replaces a fragile Context.__copy__ implementation on some
    # Python/Django combinations that can raise "'super' object has no
    # attribute 'dicts'" during admin form rendering.
    from . import patch_template_context  # noqa: F401
except Exception:
    pass

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = 'django-insecure-your-secret-key-change-in-production'

DEBUG = True

ALLOWED_HOSTS = ['*', 'localhost', '127.0.0.1']

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'events',
    'participants',
    'certificates',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'crosscert.urls'

# Build paths inside the project like this: BASE_DIR / 'subdir'.
TEMPLATE_DIR = os.path.join(BASE_DIR, 'templates')

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [TEMPLATE_DIR],
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

WSGI_APPLICATION = 'crosscert.wsgi.application'

# Use SQLite as the primary database (no Supabase/Postgres required)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_DIRS = [os.path.join(BASE_DIR, 'static')]

# Media files configuration
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# Certificate settings
CERTIFICATE_UPLOAD_TO = 'certificates/'
CERTIFICATE_TEMPLATE_UPLOAD_TO = 'certificate_templates/'
DEFAULT_FONT = os.path.join(BASE_DIR, 'static/fonts/OpenSans-Regular.ttf')

# Create required directories
os.makedirs(os.path.join(MEDIA_ROOT, CERTIFICATE_UPLOAD_TO), exist_ok=True)
os.makedirs(os.path.join(MEDIA_ROOT, CERTIFICATE_TEMPLATE_UPLOAD_TO), exist_ok=True)
os.makedirs(os.path.dirname(DEFAULT_FONT), exist_ok=True)

# Email Configuration (Brevo SMTP)
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp-relay.brevo.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = '9d3a64001@smtp-brevo.com'
# Note: In production, use environment variables for sensitive data
EMAIL_HOST_PASSWORD = os.getenv('BREVO_SMTP_PASSWORD', 'your_brevo_smtp_password')
DEFAULT_FROM_EMAIL = 'crosscert.dvo@gmail.com'

# REST Framework configuration
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
        'rest_framework.authentication.TokenAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_FILTER_BACKENDS': [
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
}

# CORS Configuration
FRONTEND_BASE_URL = os.getenv('FRONTEND_BASE_URL', os.getenv('FRONTEND_URL', 'http://localhost:3000'))

CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    FRONTEND_BASE_URL,
]

CORS_ALLOW_CREDENTIALS = True

# CSRF Configuration for CORS
CSRF_TRUSTED_ORIGINS = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    FRONTEND_BASE_URL,
]

CSRF_COOKIE_SECURE = False  # Set to True in production with HTTPS
CSRF_COOKIE_HTTPONLY = False  # Must be False to access via JavaScript
CSRF_COOKIE_SAMESITE = 'Lax'

