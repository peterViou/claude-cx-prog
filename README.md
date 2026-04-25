# Proquiymsa ODT — Socle technique

MVP — fondation backend/auth. **Aucune logique ODT métier ici** (volontaire).

## Stack

- **Next.js 15** (App Router) + **TypeScript strict**
- **React 19**
- **Prisma 6** + **PostgreSQL 16**
- **Auth.js / NextAuth v5 stable** (adapter Prisma)
- **Tailwind CSS 3.4**
- **Vitest** pour les tests
- **Python 3.11+** pour les scripts de maintenance (`scripts/doctor.py`)

---

## Environnement requis

Versions testées sur macOS :

| Outil          | Version cible | Vérifier            | Installer                 |
| -------------- | ------------- | ------------------- | ------------------------- |
| Node           | ≥ 22 (24 OK)  | `node -v`           | `brew install node`       |
| pnpm           | ≥ 10          | `pnpm -v`           | `npm install -g pnpm`     |
| Docker Desktop | ≥ 28          | `docker info`       | https://docker.com        |
| Git            | ≥ 2.40        | `git --version`     | `brew install git`        |
| GitHub CLI     | ≥ 2.50        | `gh --version`      | `brew install gh`         |
| Python         | ≥ 3.11        | `python3 --version` | `brew install python@3.12`|

> ⚠️ **Pas de Postgres natif sur cette machine.** Si tu as déjà installé
> `postgresql@14` ou `postgresql@16` via Homebrew, désinstalle-les :
> ils entreraient en conflit avec le container Docker sur le port 5432.
> ```bash
> brew services stop postgresql@16 && brew uninstall postgresql@16
> ```
>
> ⚠️ **Pas de `NODE_ENV` dans ton shell.** Vérifie :
> ```bash
> grep NODE_ENV ~/.zshrc ~/.bash_profile 2>/dev/null
> ```
> Si une ligne `export NODE_ENV=...` apparaît, **supprime-la**. Next/Node
> définissent `NODE_ENV` automatiquement (`development` pour `next dev`,
> `production` pour `next build`, `test` pour Vitest). Une valeur fixée
> à la main casse `next build` au prerender (`<Html> outside _document`).

---

## Démarrer (5 commandes)

```bash
# 1. Dépendances JS
pnpm install

# 2. Postgres local via Docker
docker compose up -d

# 3. Variables d'environnement
cp .env.example .env
echo "AUTH_SECRET=\"$(openssl rand -base64 32)\"" >> .env

# 4. Migration + seed
pnpm prisma migrate dev          # crée la migration initiale
pnpm db:seed                     # 4 rôles : admin / manager / operator / viewer

# 5. Vérification
pnpm doctor                      # diagnostic d'environnement (Python)
pnpm typecheck && pnpm test && pnpm build
pnpm dev                         # http://localhost:3000
```

---

## Structure

```
src/
  app/                       # Next.js App Router
    layout.tsx               # racine
    page.tsx                 # accueil
    error.tsx                # error boundary global
    not-found.tsx            # 404 App Router
    api/auth/[...nextauth]/  # handler Auth.js
  auth.ts                    # config NextAuth (Prisma adapter)
  lib/
    env.ts                   # validation .env via Zod
    prisma.ts                # singleton PrismaClient
  server/
    permissions.ts           # catalogue de permissions
    services/
      permissionService.ts   # hasPermission / loadUserPermissions / assertPermission
      auditService.ts        # recordAuditEvent / listAuditEvents
    repositories/
      userRepository.ts
      roleRepository.ts
      externalReferenceRepository.ts
    integrations/            # vide en MVP — Zoho/Drive viendront ici
prisma/
  schema.prisma              # User, Role, UserRole, AuditEvent,
                             # ExternalReference, IntegrationSyncRun, IntegrationSyncError
  seed.ts                    # seed des rôles
scripts/
  doctor.py                  # diagnostic d'environnement
docker-compose.yml           # Postgres 16
.github/workflows/ci.yml     # CI : install + typecheck + test + build
```

---

## Modèle d'autorisation

Permissions stockées en JSON par rôle, agrégées à la connexion (callback JWT)
puis lues côté serveur via `permissionService.hasPermission()`.

Convention : `domaine:action` (ex : `user:read`, `role:manage`).
Wildcard `*` = super-admin (rôle `admin`).

## Audit

`auditService.recordAuditEvent()` est **best-effort** : une erreur de log
ne fait jamais échouer l'action métier. Indexé par `action`, `(targetType,
targetId)`, `actorUserId`, `createdAt`.

## Référencement externe (Zoho / Drive / Creator)

`ExternalReference` mappe toute entité interne (`internalType`, `internalId`)
vers une ressource externe `(provider, resource, externalId)`. Les runs sont
tracés via `IntegrationSyncRun` / `IntegrationSyncError`. Les adapters concrets
iront sous `src/server/integrations/<provider>/`.

---

## Troubleshooting

- **Port 5432 occupé / `role X does not exist`**
  Un Postgres natif tourne en parallèle. `brew services stop postgresql@16`.
- **`pnpm install` n'installe pas Prisma Client**
  pnpm 10 ignore les `postinstall`. Le `package.json` autorise déjà
  `@prisma/client`/`prisma`/`@prisma/engines` via `pnpm.onlyBuiltDependencies`.
  Sinon `pnpm install --force` puis `pnpm prisma generate`.
- **P1010 schema public denied**
  Postgres 15+ verrouille le schema `public`. Le `docker-compose.yml` accorde
  directement la propriété au user `proquiymsa`. Si tu utilises un autre
  Postgres, voir `docs/SETUP.md` (à venir).
- **Erreur prerender `<Html>`**
  Bug Next 14 avec Auth.js v5 beta — résolu en passant à Next 15 stable.

---

## CI

GitHub Actions exécute à chaque push/PR :
`pnpm install` → `prisma generate` → `lint` → `typecheck` → `test` →
`prisma migrate deploy` (sur DB éphémère) → `build`.

Cf. `.github/workflows/ci.yml`.
