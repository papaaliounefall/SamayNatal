from .base import *  # noqa: F401,F403

DEBUG = True
ALLOWED_HOSTS = ["localhost", "127.0.0.1"]

CORS_ALLOWED_ORIGINS = env.list(  # noqa: F405
    "CORS_ALLOWED_ORIGINS",
    default=["http://localhost:5173", "http://127.0.0.1:5173"],
)
CSRF_TRUSTED_ORIGINS = env.list(  # noqa: F405
    "CSRF_TRUSTED_ORIGINS",
    default=["http://localhost:5173"],
)

EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

# Convenient locally, never in production: refresh cookie without Secure flag
# only when actually running over plain http on localhost.
AUTH_COOKIE_SECURE = False

# Until MinIO is running (via docker-compose), fall back to local disk so
# the upload -> thumbnail -> watermark pipeline can still be exercised
# end-to-end. Set USE_LOCAL_FILE_STORAGE=False once MinIO is up to test
# against the real S3-compatible path before deploying.
if env.bool("USE_LOCAL_FILE_STORAGE", default=True):  # noqa: F405
    STORAGES["default"] = {"BACKEND": "django.core.files.storage.FileSystemStorage"}  # noqa: F405
    MEDIA_URL = "/media/"
    MEDIA_ROOT = BASE_DIR / "media"  # noqa: F405

# Redis isn't running until docker-compose is up (see docker-compose.yml
# at the repo root) — fall back to in-process backends so auth/CRUD/photo
# upload can all be exercised locally without it. Flip
# USE_REDIS=True once `docker compose up redis` works.
if not env.bool("USE_REDIS", default=False):  # noqa: F405
    CACHES = {"default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"}}  # noqa: F405
    CELERY_TASK_ALWAYS_EAGER = True  # noqa: F405
    CELERY_TASK_EAGER_PROPAGATES = True  # noqa: F405
