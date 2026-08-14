import os
from datetime import timedelta
from pathlib import Path

import dj_database_url
from django.core.exceptions import ImproperlyConfigured

BASE_DIR = Path(__file__).resolve().parent.parent

PRODUCTION = os.getenv("DJANGO_PRODUCTION", "false").lower() == "true"
_secret_key = os.getenv("DJANGO_SECRET_KEY", "").strip()
if PRODUCTION and (len(_secret_key) < 50 or _secret_key.startswith("unsafe-")):
    raise ImproperlyConfigured(
        "DJANGO_SECRET_KEY must be a unique production secret of at least 50 characters."
    )
SECRET_KEY = _secret_key or "unsafe-local-only-key-change-before-sharing"
DEBUG = os.getenv("DJANGO_DEBUG", "false").lower() == "true"
if PRODUCTION and DEBUG:
    raise ImproperlyConfigured("DJANGO_DEBUG must be false when DJANGO_PRODUCTION=true.")
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "").strip()
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "").strip()
_allowed_hosts_default = "" if PRODUCTION else "localhost,127.0.0.1,testserver"
ALLOWED_HOSTS = [
    value.strip()
    for value in os.getenv("DJANGO_ALLOWED_HOSTS", _allowed_hosts_default).split(",")
    if value.strip()
]
if PRODUCTION and not ALLOWED_HOSTS:
    raise ImproperlyConfigured("DJANGO_ALLOWED_HOSTS is required in production.")

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "corsheaders",
    "rest_framework",
    "rest_framework_simplejwt.token_blacklist",
    "drf_spectacular",
    "accounts",
    "catalog",
    "commerce",
    "prescriptions",
    "operations",
    "cms",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "pharmacy.urls"
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    }
]
WSGI_APPLICATION = "pharmacy.wsgi.application"
ASGI_APPLICATION = "pharmacy.asgi.application"

_use_sqlite = os.getenv("DJANGO_USE_SQLITE", "false").lower() == "true"
_database_url = os.getenv("DATABASE_URL", "").strip()
if PRODUCTION and (_use_sqlite or not _database_url):
    raise ImproperlyConfigured("Production requires a PostgreSQL DATABASE_URL.")
if _use_sqlite or not _database_url:
    DATABASES = {
        "default": {"ENGINE": "django.db.backends.sqlite3", "NAME": BASE_DIR / "db.sqlite3"}
    }
else:
    DATABASES = {
        "default": dj_database_url.config(
            conn_max_age=int(os.getenv("DATABASE_CONN_MAX_AGE", "60")),
            conn_health_checks=True,
        )
    }

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]
AUTH_USER_MODEL = "accounts.User"

LANGUAGE_CODE = "en-us"
TIME_ZONE = "Asia/Kabul"
USE_I18N = True
USE_TZ = True

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_DIRS = [BASE_DIR / "static"]
STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    "staticfiles": {"BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage"},
}
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"
PRIVATE_MEDIA_ROOT = BASE_DIR / "private_media"
PRESCRIPTION_MAX_UPLOAD_BYTES = int(
    os.getenv("PRESCRIPTION_MAX_UPLOAD_BYTES", str(10 * 1024 * 1024))
)
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

_browser_origin_default = "" if PRODUCTION else "http://localhost:3000"
CORS_ALLOWED_ORIGINS = [
    value.strip()
    for value in os.getenv("DJANGO_CORS_ALLOWED_ORIGINS", _browser_origin_default).split(",")
    if value.strip()
]
CSRF_TRUSTED_ORIGINS = [
    value.strip()
    for value in os.getenv("DJANGO_CSRF_TRUSTED_ORIGINS", _browser_origin_default).split(",")
    if value.strip()
]
if PRODUCTION and (not CORS_ALLOWED_ORIGINS or not CSRF_TRUSTED_ORIGINS):
    raise ImproperlyConfigured(
        "DJANGO_CORS_ALLOWED_ORIGINS and DJANGO_CSRF_TRUSTED_ORIGINS are required in production."
    )

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.IsAuthenticated",),
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 12,
    "EXCEPTION_HANDLER": "pharmacy.exceptions.api_exception_handler",
}
if PRODUCTION:
    REST_FRAMEWORK.update(
        {
            "DEFAULT_THROTTLE_CLASSES": (
                "rest_framework.throttling.AnonRateThrottle",
                "rest_framework.throttling.UserRateThrottle",
            ),
            "DEFAULT_THROTTLE_RATES": {
                "anon": os.getenv("DJANGO_ANON_THROTTLE_RATE", "120/min"),
                "user": os.getenv("DJANGO_USER_THROTTLE_RATE", "600/min"),
            },
        }
    )
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=int(os.getenv("ACCESS_TOKEN_MINUTES", "15"))),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=int(os.getenv("REFRESH_TOKEN_DAYS", "7"))),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "UPDATE_LAST_LOGIN": True,
}
SPECTACULAR_SETTINGS = {
    "TITLE": "Online Pharmacy API",
    "DESCRIPTION": "Darmalton customer commerce and prescription review API",
    "VERSION": "2.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
    "ENUM_NAME_OVERRIDES": {
        "OrderStatusEnum": "commerce.models.Order.Status",
        "OrderPaymentStatusEnum": "commerce.models.Order.PaymentStatus",
        "CatalogRecordStatusEnum": "catalog.models.RecordStatus",
        "PrescriptionStatusEnum": "prescriptions.models.Prescription.Status",
        "PurchaseOrderStatusEnum": "operations.models.PurchaseOrder.Status",
        "PurchasePaymentStatusEnum": "operations.models.PurchaseOrder.PaymentStatus",
        "InventoryQualityStatusEnum": "catalog.models.InventoryBatch.QualityStatus",
        "InventoryTransactionTypeEnum": ("operations.models.InventoryTransaction.TransactionType"),
        "InventoryDirectionEnum": "operations.models.InventoryTransaction.Direction",
        "ReturnStatusEnum": "operations.models.ReturnRequest.Status",
        "ReturnRefundStatusEnum": "operations.models.ReturnRequest.RefundStatus",
        "ReturnPickupStatusEnum": "operations.models.ReturnRequest.PickupStatus",
        "ReturnItemConditionEnum": "operations.models.ReturnItem.Condition",
        "CmsPublicationStatusEnum": "cms.models.PublicationStatus",
    },
}

SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
USE_X_FORWARDED_HOST = PRODUCTION
SECURE_SSL_REDIRECT = PRODUCTION
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_HTTPONLY = True
SESSION_COOKIE_SECURE = PRODUCTION
CSRF_COOKIE_SECURE = PRODUCTION
SECURE_HSTS_SECONDS = int(
    os.getenv("DJANGO_SECURE_HSTS_SECONDS", "31536000" if PRODUCTION else "0")
)
SECURE_HSTS_INCLUDE_SUBDOMAINS = PRODUCTION
SECURE_HSTS_PRELOAD = PRODUCTION
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = "same-origin"
X_FRAME_OPTIONS = "DENY"

LOG_LEVEL = os.getenv("DJANGO_LOG_LEVEL", "INFO").upper()
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {"console": {"class": "logging.StreamHandler"}},
    "root": {"handlers": ["console"], "level": LOG_LEVEL},
}
