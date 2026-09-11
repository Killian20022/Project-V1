# EnglishQuest

EnglishQuest est une application d'apprentissage de l'anglais du niveau A1 au niveau C2. La version 2 sépare l'interface React, l'API NestJS et les données PostgreSQL.

## Architecture

- `apps/web` : React, TypeScript et Vite
- `apps/api` : NestJS, TypeScript et Prisma
- `apps/api/prisma` : schéma et migrations PostgreSQL
- `index.html` : ancienne version autonome, conservée comme référence et source de migration
- `tools/extract-legacy-data.mjs` : extrait les cours, les phrases et les styles de la version historique

## Démarrage local

Pré-requis : Node.js 22+, pnpm 11+ et Docker Desktop.

```bash
copy .env.example .env
docker compose up -d postgres
pnpm install
pnpm db:generate
pnpm db:migrate
pnpm dev
```

L'application est disponible sur `http://localhost:5173` et l'API sur `http://localhost:3001/api`. Le contrôle de santé est `GET /api/health`.

## Variables d'environnement

- `DATABASE_URL` : connexion PostgreSQL
- `JWT_SECRET` : secret long et aléatoire pour signer les sessions
- `WEB_ORIGIN` : adresse autorisée à appeler l'API
- `VITE_API_URL` : URL publique de l'API utilisée par React

## Données existantes

La progression historique reste sous la clé `eq_v4`. La nouvelle interface la reprend automatiquement, puis la synchronise vers PostgreSQL lors de la première connexion. Les mots du dictionnaire restent compatibles avec la clé `eq_words`.

## Déploiement

Le workflow `.github/workflows/pages.yml` construit et publie le frontend sur GitHub Pages après une modification de `main`. Ajouter dans les variables GitHub du dépôt `VITE_API_URL` avec l'adresse HTTPS du backend déployé.

Le backend peut être déployé avec `apps/api/Dockerfile` sur un hébergeur acceptant les conteneurs. Il faut lui fournir `DATABASE_URL`, `JWT_SECRET`, `WEB_ORIGIN` et `PORT`. Les migrations Prisma sont appliquées au démarrage du conteneur.

## Vérifications

```bash
pnpm typecheck
pnpm build
```
