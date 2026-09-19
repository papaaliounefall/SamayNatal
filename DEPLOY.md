# Déploiement sur Render

Ce dépôt contient un `render.yaml` (Blueprint) qui décrit les 4 services nécessaires : base de données Postgres, Redis, backend Django, worker Celery, et le frontend (site statique). `celery-beat` (planificateur de tâches périodiques) n'est volontairement pas déployé — aucune tâche périodique n'existe encore dans le projet ; voir le commentaire dans `render.yaml` pour le rajouter le jour où c'est utile.

**Important : Render n'offre pas de plan gratuit pour les Background Workers.** `samaynatal-celery-worker` est donc sur le plan payant le moins cher (`starter`, quelques dollars/mois) — c'est lui qui envoie réellement les emails, notifications WhatsApp et traite les retraits. Les 3 autres services restent gratuits.

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
3. Render détecte `render.yaml` et propose de créer les 4 services. Validez.
4. Le premier déploiement va échouer ou tourner en mode dégradé — c'est normal, il manque encore les variables marquées `sync: false` (secrets et URLs générées par Render lui-même).

## Étape 3 — Remplir les variables manquantes

Une fois les services créés, chacun a une URL du type `https://samaynatal-backend.onrender.com`. Dans le dashboard Render, pour **chaque service concerné** :

**`samaynatal-backend`, `samaynatal-celery-worker`** :
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

## Limites connues

- **Base de données Postgres (gratuite)** : expire après 30 jours. Surveillez l'échéance dans le dashboard Render et passez sur un plan payant avant, sinon les données sont perdues.
- **Backend (`samaynatal-backend`, gratuit)** : se met en veille après une période d'inactivité — la première requête qui le réveille peut prendre 30-60 secondes. Sans conséquence grave, juste un délai visible pour le premier visiteur après une pause.
- **Worker Celery (`samaynatal-celery-worker`, payant)** : sur plan payant, tourne en continu — pas de retard attendu sur les emails/WhatsApp/retraits.
- **Compte Render séparé** : si ce projet est sur un compte Render différent de vos autres projets (pour éviter la limite d'1 base/Redis gratuits par compte), pensez à noter les identifiants de connexion quelque part — deux comptes Render à gérer.
