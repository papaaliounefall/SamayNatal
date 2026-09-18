# Déploiement sur Render

Ce dépôt contient un `render.yaml` (Blueprint) qui décrit les 5 services nécessaires : base de données Postgres, Redis, backend Django, worker Celery, planificateur Celery beat, et le frontend (site statique).

## Ce que le déploiement donne, et ce qu'il ne donne pas

Une fois déployé, l'application est réellement utilisable : inscription/connexion, dashboards, galeries, PIN, comptes clients, notifications. **Les paiements et les messages WhatsApp restent en mode simulation** tant que vous n'avez pas vos propres identifiants (Wave/Orange Money/carte pour les paiements, Twilio pour WhatsApp) — c'est indépendant de l'hébergeur.

## Étape 1 — Stockage des photos (obligatoire avant le premier déploiement)

Render n'a pas de service de stockage d'objets intégré. Créez un compte sur un fournisseur S3-compatible :
- **Cloudflare R2** (recommandé — pas de frais de sortie, généreux tier gratuit)
- Ou AWS S3 / Backblaze B2

Notez : clé d'accès, clé secrète, nom du bucket, endpoint, région. Vous en aurez besoin à l'étape 3.

## Étape 2 — Lancer le Blueprint sur Render

1. Connectez-vous sur [render.com](https://render.com), **New > Blueprint**.
2. Connectez le dépôt GitHub `papaaliounefall/SamayNatal`.
3. Render détecte `render.yaml` et propose de créer les 5 services. Validez.
4. Le premier déploiement va échouer ou tourner en mode dégradé — c'est normal, il manque encore les variables marquées `sync: false` (secrets et URLs générées par Render lui-même).

## Étape 3 — Remplir les variables manquantes

Une fois les services créés, chacun a une URL du type `https://samaynatal-backend.onrender.com`. Dans le dashboard Render, pour **chaque service concerné** :

**`samaynatal-backend`, `samaynatal-celery-worker`, `samaynatal-celery-beat`** :
- `SECRET_KEY` — générez une seule valeur aléatoire et collez-la **identique** dans les trois services :
  ```
  python -c "import secrets; print(secrets.token_urlsafe(50))"
  ```
- `ALLOWED_HOSTS` — le domaine du backend sans `https://`, ex. `samaynatal-backend.onrender.com`

**`samaynatal-backend`** uniquement :
- `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET`, `S3_ENDPOINT`, `S3_REGION` — depuis l'étape 1
- `FRONTEND_BASE_URL` — URL complète du frontend, ex. `https://samaynatal-frontend.onrender.com`
- `CORS_ALLOWED_ORIGINS` — même URL
- `CSRF_TRUSTED_ORIGINS` — même URL
- `EMAIL_HOST`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD` — vos identifiants SMTP réels (Resend, SendGrid, Mailgun...) ; sans ça, les emails (confirmation de commande, réinitialisation de mot de passe) ne partiront pas
- `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_WHATSAPP_FROM` — laissez vide pour rester en mode simulation WhatsApp, ou remplissez une fois votre compte Twilio créé

**`samaynatal-frontend`** :
- `VITE_API_BASE_URL` — URL complète du backend, ex. `https://samaynatal-backend.onrender.com`
- Après avoir rempli cette variable, il faut redéployer manuellement ce service ("Manual Deploy") — Vite fige cette valeur au moment du build, pas au lancement.

## Étape 4 — Vérifier

- `https://samaynatal-backend.onrender.com/api/admin/health/` doit répondre avec la base de données, le cache et le stockage tous "up".
- Ouvrir le frontend, se connecter avec le compte admin existant, confirmer que les dashboards chargent des vraies données.
- Créer une commande de test et vérifier dans les logs de `samaynatal-celery-worker` que l'email part (ou apparaît dans les logs si `EMAIL_HOST` n'est pas encore configuré) et que le message WhatsApp simulé apparaît.

## Limites connues du plan gratuit Render

Tous les services de ce Blueprint sont en plan gratuit (`free`). Ce que ça implique concrètement :

- **Base de données Postgres** : expire après 30 jours. Surveillez l'échéance dans le dashboard Render et passez sur un plan payant avant, sinon les données sont perdues.
- **Backend (`samaynatal-backend`)** : se met en veille après une période d'inactivité — la première requête qui le réveille peut prendre 30-60 secondes. Sans conséquence grave, juste un délai visible pour le premier visiteur après une pause.
- **Workers Celery (`samaynatal-celery-worker`, `samaynatal-celery-beat`)** : c'est le point le plus incertain. Contrairement au backend, un worker ne reçoit pas de requêtes HTTP pour se "réveiller" — s'il est mis en veille par Render pendant une inactivité, les emails/notifications WhatsApp/traitements de retrait mis en file d'attente pendant ce temps risquent de ne partir qu'au redémarrage du worker, pas immédiatement. À surveiller dans les premiers jours : si les notifications arrivent avec un vrai retard systématique, ce sera le signe qu'il faut passer ces deux services sur un plan payant (`starter` suffit) pour qu'ils tournent en continu.
