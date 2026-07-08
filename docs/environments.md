# Environments & Configuration

How configuration flows into the apps, and how to run the apps locally.

---

## 1. Principles

- **SPA env is public.** Anything in `import.meta.env` ships in the bundle — **never put a
  secret in it.** Secrets belong to the backend.
- **Build once, run anywhere.** Per-environment values (API origin, feature flags) are read at
  build time per target; the **tenant is a post-login runtime fact** (the backend derives it
  from the user's single membership), never baked in — each app is served from one fixed host
  (`admin.cohort.uz`, `internal.cohort.uz`).
- **Fail fast.** Env is validated against a Zod schema at app boot; a missing/invalid var
  crashes startup with a clear message rather than failing mysteriously later.

---

## 2. Variables

Vite only exposes vars prefixed `VITE_`. Per-app `.env` files; document them in
`apps/<app>/.env.example`.

| Var               | Required | Example                                    | Purpose                                                 |
| ----------------- | -------- | ------------------------------------------ | ------------------------------------------------------- |
| `VITE_API_ORIGIN` | yes      | `https://api.cohort.uz`                    | Backend origin; the client appends `/api/v1/<surface>`. |
| `VITE_APP_ENV`    | yes      | `development` \| `staging` \| `production` | Drives logging/telemetry behavior.                      |
| `VITE_SENTRY_DSN` | no       | `https://…`                                | Error reporting (if enabled).                           |

> The API base path (`/api/v1`) and the surface prefix (`/manage`) are **constants in code**,
> not env vars — they're part of the contract, not the environment.

---

## 3. The typed env module

```ts
// apps/admin/src/lib/env.ts (shape)
const Env = z.object({
	VITE_API_ORIGIN: z.string().url(),
	VITE_APP_ENV: z.enum(['development', 'staging', 'production']),
	VITE_SENTRY_DSN: z.string().url().optional(),
});
export const env = Env.parse(import.meta.env); // throws at boot if misconfigured
```

Always read config through `env`, never `import.meta.env.*` directly — so every consumer gets
validated, typed values.

---

## 4. Local development

The tenant comes from whoever logs in, so local dev is
plain `localhost`:

- Run the app on `http://localhost:5174` (admin) / `http://localhost:5173` (internal-platform).
- Point `VITE_API_ORIGIN` at your local backend (default `http://localhost:5050`). Ensure the
  backend's `CORS_ORIGINS` allows the dev origin.
- To test as a specific education center, log in with a user belonging to that center.

---

## 5. Environments

| Environment | Hosting                                                           | Domain                                                           | Notes                                                        |
| ----------- | ----------------------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------ |
| development | local Vite dev server                                              | `localhost:5174` (admin) / `localhost:5173` (internal-platform)    | HMR; local or shared-dev backend.                             |
| preview     | PR deploy (optional, per [ci-cd.md](ci-cd.md) §3)                  | per-PR URL                                                         | Built artifact; dev API.                                      |
| staging     | VPS `web-dev` stack ([deploy/README.md](../deploy/README.md))      | `admin-dev.cohort.uz` / `internal-dev.cohort.uz`                   | Deploys from `dev`; `VITE_APP_ENV=staging`, `api-dev` backend. |
| production  | VPS `web-prod` stack — nginx behind the edge Caddy                 | `admin.cohort.uz` / `internal.cohort.uz`                           | Deploys from `main`; one fixed host per app.                  |

Each app needs one DNS record + TLS cert per environment — no wildcard DNS, since tenants are
not encoded in the hostname. Both are hands-off: an A record to the VPS, and the edge Caddy
issues/renews the Let's Encrypt cert automatically.

**Preview (PR) deploys are optional** (free on hosts like Vercel/Netlify/Cloudflare Pages) and
not part of the required baseline — staging + production are. A preview build needs no tenant
configuration; log in as a user of the center you want to test. See [ci-cd.md](ci-cd.md) §3.
