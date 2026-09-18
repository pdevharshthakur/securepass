# AGENTS.md — securepass

Full-stack password manager (cryptography college project). pnpm + Turborepo monorepo with a
SvelteKit 5 web app and an Express 5 API. Credentials are encrypted at rest with AES-256-GCM;
authentication is Better Auth (client/server split across the two apps).

## Stack fingerprint

- Runtime: Node 24 (`engines`, `.nvmrc`), pnpm 11 (`packageManager`), Turborepo 2 (`turbo.json`), TypeScript 6.
- Web (`apps/web`): Svelte 5 (runes forced), SvelteKit 2.70, Vite 8, Tailwind CSS 4, shadcn-svelte + bits-ui, `@tanstack/svelte-form`, adapter-node.
- API (`apps/api`): Express 5, helmet, cors, zod 4. Built with tsdown (Node ESM in `build/`), dev via nodemon + tsc watch.
- DB (`packages/db`): Prisma 7 (`prisma-client` generator → `generated/prisma`, `@prisma/adapter-pg` driver), PostgreSQL.
- Shared (`packages/shared`): zod 4 schemas for request/response contracts.
- Auth: better-auth 1.7 (`better-auth`, `@better-auth/prisma-adapter`).
- Testing: none configured (`Unknown` — no test framework or test files found).

## Important paths

| Path                                                   | Why                                                         |
| ------------------------------------------------------ | ----------------------------------------------------------- |
| `apps/web/`                                            | SvelteKit UI; HTTP client to API only                       |
| `apps/api/`                                            | Express API; owns validation, auth, encryption, persistence |
| `packages/db/`                                         | Prisma schema + migrations + generated client               |
| `packages/shared/`                                     | Shared zod schemas (`add`, `search`) used by both apps      |
| `packages/eslint-config/`, `packages/prettier-config/` | Shared lint/format configs (tooling only)                   |
| `scripts/`                                             | Root helper scripts (`check.sh`)                            |
| `docker-compose.yml`, `dockerfile`                     | Production stack (db + api + web); multi-stage image        |

## Source-of-truth files

- Manifests: root `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `apps/*/package.json`, `packages/*/package.json`.
- Env validation (authoritative env var list): `apps/api/src/env.ts`, `apps/web/src/env.ts`.
- Env examples: `apps/api/.env.example`, `apps/web/.env.example`, `packages/db/.env.example`.
- Bootstrap: `apps/api/src/main.ts`, `apps/api/src/routes.ts`, `apps/web/src/hooks.server.ts`, `apps/web/vite.config.ts` (SvelteKit config lives here — there is no `svelte.config.js`).
- Routes: `apps/api/src/routes/*.ts`, `apps/web/src/routes/**` (incl. `*.remote.ts`).
- Contracts: `packages/shared/src/schemas/*.ts`.
- DB: `packages/db/prisma/schema.prisma`, `packages/db/prisma.config.ts`, `packages/db/prisma/migrations/*`.
- Build: `apps/api/tsdown.config.ts`, `apps/api/nodemon.json`.
- Docs (may drift): `README.md`, `ARCHITECTURE.md`, `apps/*/README.md`.

## Better Auth — client/server split (read this before touching auth)

Better Auth is split across the two apps; the browser talks to one origin via a Vite proxy.

**Server (Express)** — `apps/api/src/lib/auth.ts`:

- `betterAuth()` with `prismaAdapter(prisma, { provider: 'postgresql' })`, `secret: BETTER_AUTH_SECRET`, `baseURL: BETTER_AUTH_URL`, `trustedOrigins: [BETTER_AUTH_URL]`.
- `emailAndPassword.enabled`, plus optional Google/GitHub social providers (only enabled when their env vars are present).

**Client (Svelte)** — `apps/web/src/lib/auth/client.ts`:

- `createAuthClient()` from `better-auth/svelte` (must import from `better-auth/svelte`, not `better-auth`).
- No config passed because the Vite dev proxy forwards auth traffic (see below).

**Wiring / request flow:**

- `apps/api/src/main.ts` mounts the handler: `app.all('/api/auth/*splat', toNodeHandler(auth))` — before `express.json()` and `cors`.
- `apps/web/vite.config.ts` proxies `/api` → `http://localhost:8000` so the browser hits a single origin (`:5173`), keeping the session cookie same-site and avoiding CORS.
- Web server-side session: `apps/web/src/lib/server/session.ts` (`getSession`) fetches `{api}/api/auth/get-session`, forwarding the request cookie. `hooks.server.ts` sets `event.locals.userId` from it.
- Route guard: `apps/web/src/routes/(protected)/+layout.server.ts` redirects to `/auth/login` when `locals.userId` is absent (500 when `authUnavailable`).
- API guard: `apps/api/src/middlewares/requireAuth.ts` calls `auth.api.getSession()` (from `better-auth/node`), sets `req.userId`; applied to all non-health routes in `routes.ts`.

Key env facts: `BETTER_AUTH_URL` is the **web** origin (`http://localhost:5173`), not the API port. `BETTER_AUTH_SECRET` ≥ 32 chars. OAuth callbacks resolve to `{BETTER_AUTH_URL}/api/auth/callback/{google|github}`.

## Read first by task

| Task                                     | Read first                                                                                                                                                                     |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Add/edit a route / feature               | `apps/api/src/routes.ts` + matching `apps/api/src/routes/*.ts`; web `apps/web/src/routes/**`                                                                                   |
| API/backend change                       | `apps/api/src/main.ts`, `routes.ts`, `services/credential.ts`, `env.ts`                                                                                                        |
| Frontend/UI change                       | `apps/web/src/routes/**`, `apps/web/src/lib/components/**`, `vite.config.ts`                                                                                                   |
| Auth (login/signup/session/providers)    | `apps/api/src/lib/auth.ts`, `apps/web/src/lib/auth/client.ts`, `apps/web/src/lib/server/session.ts`, `apps/api/src/middlewares/requireAuth.ts`, `apps/web/src/hooks.server.ts` |
| DB/schema/data change                    | `packages/db/prisma/schema.prisma`, `prisma.config.ts`, `packages/db/src/*.ts`, then run `pnpm db:generate`                                                                    |
| Shared contract (request/response shape) | `packages/shared/src/schemas/*.ts` (used by both apps)                                                                                                                         |
| Env/config change                        | `apps/*/src/env.ts` + corresponding `.env.example`                                                                                                                             |
| Build/deploy/tooling                     | `turbo.json`, `apps/api/tsdown.config.ts`, `apps/web/vite.config.ts`, `docker-compose.yml`, `dockerfile`                                                                       |

## Architecture & boundaries

- Web is a pure HTTP client to the API. It never encrypts/decrypts or touches secrets; the API is the sole owner of encryption and persistence. Shared code is types/schemas only (`@packages/shared`).
- Encryption: `apps/api/src/services/credential.ts` is the only place secrets are encrypted/decrypted (AES-256-GCM, per-entry random IV + auth tag, ciphertext stored as JSON `{iv, tag, data}`).
- `packages/db` exports a `prisma` singleton (`src/client.ts`) for the API and `createPrismaClient(url)` for callers managing their own lifecycle.
- Prisma schema is owned in `packages/db`; the API and web apps consume the generated client. Turbo makes `dev`/`build` depend on `^db:generate`.

## Commands

Run from repo root with `pnpm`:

| Command                             | Purpose                                         |
| ----------------------------------- | ----------------------------------------------- |
| `pnpm install`                      | Install all workspace deps                      |
| `pnpm dev`                          | Watch + hot-reload web (:5173) and API (:8000)  |
| `pnpm build`                        | Build all apps (web → `build/`, api → `build/`) |
| `pnpm check`                        | Typecheck + lint every package                  |
| `pnpm typecheck`                    | Typecheck only                                  |
| `pnpm lint`                         | ESLint only                                     |
| `pnpm format`                       | Prettier (also `pnpm format:root`)              |
| `pnpm db:start` / `db:stop`         | Dev Postgres (compose in `packages/db/`)        |
| `pnpm db:generate`                  | `prisma generate` (client)                      |
| `pnpm db:migrate`                   | `prisma migrate dev`                            |
| `pnpm db:deploy`                    | `prisma migrate deploy` (prod)                  |
| `pnpm db:studio`                    | Prisma Studio                                   |
| `pnpm docker:start` / `docker:stop` | Full prod stack via root compose                |

Single-package (e.g. `pnpm --filter api typecheck`, `--filter web check`). Node version pinned via `.nvmrc`/`.node-version`.

## Search rules

- Read `AGENTS.md` first, then the "Read first by task" files above, then targeted `grep`/`read`.
- Avoid broad repo-wide grep/tree/subagents unless `AGENTS.md` is stale or insufficient.
- Ignore: `node_modules/`, `build/`, `.svelte-kit/`, `generated/`, `.turbo/`, `.git/`, caches.

## Risks / gotchas

- `ENCRYPTION_KEY` (API) is base64 of 32 bytes; changing it makes all stored credentials unreadable. Never written to the DB.
- `BETTER_AUTH_URL` must be the web origin, not the API port — it drives URL generation and CSRF trusted-origin checks.
- In `apps/api/src/main.ts`, the auth handler MUST be mounted before `express.json()`/`cors`. Mounting `express.json()` first makes the Better Auth client hang on "pending".
- `apps/web/src/env.ts` declares `PRIVATE_API_URL`, but `apps/web/.env.example` still lists `PUBLIC_API_URL` — `.env.example` is stale (code imports `PRIVATE_API_URL` from `$app/env/private`).
- `apps/web/src/lib/server/db.ts` + web `DATABASE_URL` exist but are unused (web talks to API only). Candidate for removal.
- `GET /show` returns raw encrypted blobs without decryption (unlike `/search`) — known inconsistency.
- Login/signup form submission is TODO: email/password `onSubmit` handlers `void value` and do nothing; only social sign-in is wired (`authClient.signIn.social`).
- `@better-auth/prisma-adapter` is listed in `apps/api/package.json` but `auth.ts` uses `better-auth/adapters/prisma` — possibly an unused dependency.
- SvelteKit runs experimental flags (`vite.config.ts`): `explicitEnvironmentVariables`, `remoteFunctions` (`.remote.ts` files), `async`, plus forced runes. Env vars must be declared via `defineEnvVars` in `apps/web/src/env.ts`.
- `ARCHITECTURE.md` predates the Better Auth layer and the `Credential.userId` owner column; auth facts in this file are authoritative over it.

## Unknowns / open questions

- No test framework or CI config detected — only Husky/lint-staged pre-commit hooks.
- No `.svelte-kit/`-level alias config file; path aliases come from `tsconfig.json` (`api`) and SvelteKit defaults (`web`).
