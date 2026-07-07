# Environments & Configuration

How configuration flows into the apps, and how to run a multi-tenant app locally.

---

## 1. Principles

- **SPA env is public.** Anything in `import.meta.env` ships in the bundle — **never put a
  secret in it.** Secrets belong to the backend.
- **Build once, run anywhere.** Per-environment values (API origin, feature flags) are read at
  build time per target; the **tenant is read at runtime** from the subdomain, never baked in.
- **Fail fast.** Env is validated against a Zod schema at app boot; a missing/invalid var
  crashes startup with a clear message rather than failing mysteriously later.

---

## 2. Variables

Vite only exposes vars prefixed `VITE_`. Per-app `.env` files; document them in
`apps/<app>/.env.example`.

| Var               | Required | Example                                    | Purpose                                                 |
| ----------------- | -------- | ------------------------------------------ | ------------------------------------------------------- |
| `VITE_API_ORIGIN` | yes      | `https://api.cohort.uz`                   | Backend origin; the client appends `/api/v1/<surface>`. |
| `VITE_APP_ENV`    | yes      | `development` \| `staging` \| `production` | Drives logging/telemetry behavior.                      |
| `VITE_SENTRY_DSN` | no       | `https://…`                                | Error reporting (if enabled).                           |
| `VITE_DEV_TENANT` | dev only | `zabon`                                    | Local tenant override when not using `*.localhost`.     |

> The API base path (`/api/v1`) and the surface prefix (`/manage`) are **constants in code**,
> not env vars — they're part of the contract, not the environment.

---

## 3. The typed env module

```ts
// apps/staff/src/lib/env.ts (shape)
const Env = z.object({
	VITE_API_ORIGIN: z.string().url(),
	VITE_APP_ENV: z.enum(['development', 'staging', 'production']),
	VITE_SENTRY_DSN: z.string().url().optional(),
	VITE_DEV_TENANT: z.string().optional(),
});
export const env = Env.parse(import.meta.env); // throws at boot if misconfigured
```

Always read config through `env`, never `import.meta.env.*` directly — so every consumer gets
validated, typed values.

---

## 4. Local multi-tenant development

Because the tenant is the subdomain, local dev needs a subdomain too:

- **Preferred:** browse `http://<tenant>.localhost:5173` (e.g. `zabon.localhost:5173`).
  `*.localhost` resolves to loopback in modern browsers — no hosts-file edits. `lib/tenant.ts`
  parses the leftmost label.
- **Fallback:** set `VITE_DEV_TENANT=zabon` and run on `localhost:5173`; `lib/tenant.ts` uses
  the override when no subdomain is present.
- Point `VITE_API_ORIGIN` at your local backend (default `http://localhost:5050`). Ensure the
  backend's `CORS_ORIGINS` allows the dev origin and that its tenant-resolution accepts the dev
  Host (coordinate with backend for local subdomain handling).

---

## 5. Environments

| Environment | Hosting                              | Domain                 | Notes                               |
| ----------- | ------------------------------------ | ---------------------- | ----------------------------------- |
| development | local Vite dev server                | `*.localhost:5173`     | HMR; local or shared-dev backend.   |
| preview     | PR deploy (per [ci-cd.md](ci-cd.md)) | per-PR URL             | Built artifact; staging API.        |
| staging     | static host + wildcard domain        | `*.staging.cohort.uz` | Mirrors prod; staging backend.      |
| production  | static host + CDN                    | `*.cohort.uz`         | Wildcard TLS for tenant subdomains. |

A **wildcard DNS + TLS** for `*.cohort.uz` (and staging) is required so every tenant subdomain
resolves to the same SPA build. Confirm this hosting/DNS model with infra — it's an assumption
of the architecture.

**Preview (PR) deploys are optional** (free on hosts like Vercel/Netlify/Cloudflare Pages) and
not part of the required baseline — staging + production are. Because a per-PR URL is **not** a
`*.cohort.uz` subdomain, there's no tenant in the hostname, so a preview build sets a
`VITE_DEV_TENANT` default (or accepts a `?tenant=` override) for `lib/tenant.ts` to resolve
against. See [ci-cd.md](ci-cd.md) §3.
