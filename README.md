# Samay Natal — Plateforme SaaS de photographie professionnelle

Plateforme permettant aux photographes de gérer leurs événements (mariages, sport,
cérémonies, entreprise...), d'y publier des galeries privées ou publiques, et à
leurs clients de retrouver, consulter et acheter leurs photos en HD.

## Structure du dépôt

```
frontend/   React 19 + Vite + TypeScript + Tailwind — l'interface (dashboard
            photographe, galerie client, admin). Actuellement branchée sur des
            données simulées en mémoire (voir "État actuel" ci-dessous).
backend/    Django 5 + DRF + PostgreSQL + Redis + Celery — l'API, le stockage
            privé des photos, l'authentification, les paiements et le wallet.
docker-compose.yml   Postgres, Redis, MinIO, backend, Celery worker/beat, frontend.
```

## État actuel (2026-09-12)

- **Frontend** : prototype visuel complet (écrans photographe/client/admin), mais
  encore branché sur un état simulé en mémoire (`frontend/src/context/AppContext.tsx`)
  plutôt que sur l'API réelle. C'est la référence de design (charte de couleurs,
  composants) à réutiliser en branchant progressivement chaque écran sur le backend.
- **Backend** : fondations posées et testées de bout en bout — inscription
  photographe → validation admin → connexion → création d'événement → upload
  photo → génération thumbnail/preview/watermark (Celery) → galerie publique/PIN
  → commande → confirmation de paiement (webhook) → crédit du wallet → accès HD.
  24 tests automatisés couvrent en particulier l'isolation multi-photographe
  (un photographe ne doit jamais voir les données d'un autre) et la gestion du PIN.
  **Le frontend n'est pas encore reconnecté à cette API.**

## Démarrage rapide (sans Docker, pour développer vite)

### Backend

```bash
cd backend
python -m venv .venv
source .venv/Scripts/activate   # ou .venv\Scripts\activate.bat sous cmd
pip install -r requirements.txt
cp .env.example .env            # puis générer un SECRET_KEY (voir ci-dessous)
python manage.py migrate
python manage.py seed_plans     # crée les plans d'abonnement Free/Pro/Studio
python manage.py createsuperuser
python manage.py runserver 8000
```

Générer une `SECRET_KEY` :
```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

Sans `DATABASE_URL` dans `.env`, le backend bascule automatiquement sur SQLite ;
sans Redis, le cache passe en mémoire locale et Celery s'exécute en synchrone
(`CELERY_TASK_ALWAYS_EAGER`) — pratique pour développer sans installer quoi que
ce soit d'autre. Documentation API interactive : `http://localhost:8000/api/docs/`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Démarrage avec Docker (stack cible : Postgres, Redis, MinIO)

```bash
docker compose up --build
```

Une fois `USE_REDIS=True` et MinIO en place, régénérer les migrations n'est pas
nécessaire — seules les variables d'environnement changent (voir
`backend/.env.example`).

## Tests

```bash
cd backend
python manage.py test apps
```

## Sécurité — ce qui est déjà en place

- Mots de passe hashés en Argon2 ; verrouillage de compte après tentatives échouées.
- Access token JWT courte durée (10 min) gardé en mémoire côté frontend (jamais
  `localStorage`) ; refresh token en cookie `HttpOnly` + `Secure` (prod) + rotation.
- Code PIN des événements hashé (jamais stocké ni renvoyé en clair).
- Fichiers originaux toujours privés — servis uniquement via URL signée temporaire ;
  le watermark est appliqué côté serveur (Pillow), jamais en overlay CSS.
- Téléchargement HD vérifié à chaque requête via un droit d'accès explicite
  (`PhotoAccess`), jamais déduit de l'état du panier ou de la session.
- Paiement validé uniquement via un webhook serveur-à-serveur (jamais via ce que
  le client renvoie) ; clé d'idempotence pour éviter le double débit.
- Isolation stricte entre photographes (testée automatiquement).

Voir `backend/.env.example` pour la liste complète des variables d'environnement.
