# Better Auth Implementation Plan — Reverse Proxy (Same-Origin)

Status: **Approved** — implementation ready to start.

## Decision

- **Auth server:** `apps/api` (Express 5) — Better Auth `toNodeHandler` mounted at `/api/auth/{*any}`.
- **Auth client:** `apps/web` (SvelteKit) — `createAuthClient` from `better-auth/svelte`, same-origin via proxy.
- **Session cookie:** set on the web origin (`http://localhost:5173` dev) because `/api/auth/*` is proxied through the web origin.
- **Data requests:** keep the `.remote.ts` server-fetch pattern; forward the browser `Cookie` header manually.

## Why this approach

- Credentials and the encryption key live in `apps/api` → auth enforcement must be co-located with the protected resource.
- Same-origin proxying keeps cookies simple: no CORS-with-credentials, no `SameSite=None`, no cross-origin cookie juggling.
- Preserves the SvelteKit remote-functions pattern (server-side `fetch` to the API) instead of rewriting forms client-side.

## Flow (after implementation)

```
Sign-in:  Browser → POST /api/auth/sign-in/email (5173) → proxy → API (8000)
          ← Set-Cookie (stored under 5173)

Add form: Browser → remote fn endpoint (5173, cookie sent)
          SvelteKit server → fetch API /add (cookie header manually forwarded)
          API requireAuth: getSession(cookie) → 200
```

## Phases

### Phase 1 — Dependencies & env

- `apps/api`: add `better-auth`, `@better-auth/prisma-adapter`.
- `apps/web`: add `better-auth`.
- `apps/api/src/env.ts`: add `BETTER_AUTH_SECRET` (min 32 chars, `openssl rand -base64 32`) and `BETTER_AUTH_URL` (`http://localhost:5173` dev, public origin prod). Update `.env` / `.env.example`.

### Phase 2 — Database schema (`packages/db/prisma/schema.prisma`)

- Generate auth models: `pnpm dlx auth@latest generate` in `packages/db`, then merge the generated models (`User`, `Session`, `Account`, `Verification`) into the existing schema (or hand-write them per Better Auth core schema docs).
- Add to `Credential`: `userId String`, `user User @relation(...)`, index on `userId`.
- Run `pnpm db:migrate -- --name add_auth_and_credential_owner`.

### Phase 3 — Auth instance (`apps/api/src/lib/auth.ts`)

```ts
import { prisma } from "@packages/db";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { env } from "../env.js";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  trustedOrigins: [env.BETTER_AUTH_URL],
  emailAndPassword: { enabled: true },
});
```

### Phase 4 — Mount handler in Express (`apps/api/src/main.ts`)

- Mount **before** `express.json()` (Better Auth requirement):

```ts
app.all("/api/auth/{*any}", toNodeHandler(auth)); // Express 5 syntax
app.use(express.json());
```

- Keep `helmet`; CORS can be simplified (browser path is same-origin via proxy; the SvelteKit server fetch ignores CORS).

### Phase 5 — Protect credential routes (`apps/api`)

- New `src/middlewares/requireAuth.ts`: `auth.api.getSession({ headers: fromNodeHeaders(req.headers) })` → `401` if null; attach `req.userId`.
- Apply to `/add`, `/search`, `/show` in `src/routes.ts`.
- Scope all queries: `where: { userId }`; set `userId` on create.

### Phase 6 — Vite dev proxy (`apps/web/vite.config.ts`)

```ts
server: {
  proxy: { '/api': { target: 'http://localhost:8000', changeOrigin: false } }
}
```

This makes `/api/auth/*` same-origin to the browser, so `Set-Cookie` lands on `:5173`.

### Phase 7 — SvelteKit auth client (`apps/web/src/lib/auth-client.ts`)

```ts
import { createAuthClient } from "better-auth/svelte";
export const authClient = createAuthClient(); // baseURL omitted → same origin via proxy
```

### Phase 8 — Forward cookies in remote functions

In `add.remote.ts` and `search.remote.ts`, call `getRequestEvent()` (synchronously, before any `await`) and add the forwarded cookie header:

```ts
const event = getRequestEvent();
fetch(`${apiUrl}/add`, {
  method: "POST",
  headers: {
    "content-type": "application/json",
    cookie: event.request.headers.get("cookie") ?? "",
  },
  body: JSON.stringify(data),
});
```

### Phase 9 — Auth UI (`apps/web/src/routes`)

- New `/login` page: `authClient.signUp.email()` / `signIn.email()`; sign-out button.
- Gate pages with `authClient.useSession()`.
- Optional: in `hooks.server.ts`, forward the cookie to `/api/auth/get-session` to populate `event.locals` for server-side redirects.

### Phase 10 — Production reverse proxy

- Nginx/Caddy: route `/api/*` → Express container, `/*` → adapter-node container. Set `BETTER_AUTH_URL` to the public origin; add `trustedProxies` to Better Auth's `advanced.ipAddress` config.

## Validation

- `pnpm --filter api typecheck` + `pnpm --filter web check`.
- Manual: sign up → cookie set on `:5173`; add/search works while logged in; unauthenticated `/show` → 401; two users can't see each other's credentials.

## Gotchas

- Express 5 catch-all syntax: `/api/auth/{*any}`.
- `express.json()` must come after the auth handler.
- `getRequestEvent()` must be called before any `await` in `.remote.ts`.
- Every new `.remote.ts` must repeat the cookie-forward line.
- Keep `localhost` out of `trustedOrigins` in production.

## Rollback

- Revert the migration, remove `requireAuth`, drop the proxy block. Endpoints return to the (unauthenticated) prior state.
