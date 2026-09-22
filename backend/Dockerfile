FROM python:3.12-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libjpeg62-turbo-dev zlib1g-dev libwebp-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Créer l'utilisateur
RUN useradd --create-home appuser

# Créer les dossiers utilisés par Django
# puis donner les droits à appuser
RUN mkdir -p /app/staticfiles /app/media \
    && chown -R appuser:appuser /app

USER appuser

EXPOSE 8000

# createsuperuser --noinput only runs if DJANGO_SUPERUSER_EMAIL/PASSWORD
# are set, and fails harmlessly (caught by `|| true`) once that account
# already exists — safe to leave in place across every redeploy. This
# only exists because Render's Shell tab (the normal way to run this
# interactively) is a paid feature; no other bootstrap depends on it.
CMD sh -c "python manage.py migrate --noinput && python manage.py collectstatic --noinput && (python manage.py createsuperuser --noinput || true) && gunicorn config.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers 3"