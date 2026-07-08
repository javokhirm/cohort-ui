# CI/CD

Continuous integration and deployment for the monorepo. Optimized for a small team: fast,
cached, affected-only.

---

## 1. CI — GitHub Actions

GitHub Actions (consistent with the backend). One workflow, jobs scoped to what changed via
Turbo's task graph + remote cache.

**Pipeline on every PR and on `main`:**

```
install  →  lint  →  typecheck  →  test  →  build        (turbo, affected-only, cached)
                                      └────────────────►  e2e (Playwright)  [main + labeled PRs]
```

```yaml
# .github/workflows/ci.yml (sketch)
jobs:
    verify:
        steps:
            - uses: actions/checkout@v4
            - uses: pnpm/action-setup@v4
            - uses: actions/setup-node@v4
              with: { node-version-file: '.nvmrc', cache: 'pnpm' }
            - run: pnpm install --frozen-lockfile
            - run: pnpm turbo run lint typecheck test build --cache-dir=.turbo
            # TURBO_TOKEN / TURBO_TEAM (or self-hosted cache) set via secrets
```

Principles:

- **`--frozen-lockfile`** — the lockfile is the source of truth; CI never mutates deps.
- **Turbo remote cache** (Vercel Remote Cache or self-hosted) so unchanged packages aren't
  rebuilt/retested across runs and machines.
- **Affected-only**: Turbo skips tasks whose inputs didn't change. Keep task `inputs`/`outputs`
  in `turbo.json` accurate so caching stays correct.
- **`pnpm gen:api` is not run in CI against a live backend.** The generated OpenAPI types are
  **committed**; a separate, explicit step regenerates and commits them when the contract
  changes, so CI is hermetic. CI may add a check that the committed types match a pinned spec.

**Required status checks to merge:** lint, typecheck, test, build (and e2e where it runs).

---

## 2. Quality gates outside CI

- **Pre-commit** (husky + lint-staged): prettier + eslint on staged files — fast local
  feedback so CI rarely fails on formatting.
- Pre-commit does **not** run the full test suite (too slow); CI is the gate for tests.

---

## 3. CD — deployment

The apps are **static SPAs** → each builds to static assets, packaged into a tiny nginx
image ([Dockerfile](../Dockerfile)) and served from the project VPS behind the shared edge
Caddy (TLS via Let's Encrypt). Server layout, bootstrap, secrets and rollback:
[deploy/README.md](../deploy/README.md).

- **Hosts:** `admin.cohort.uz` / `internal.cohort.uz` (prod, from `main`) and
  `admin-dev.cohort.uz` / `internal-dev.cohort.uz` (dev, from `dev`) — one fixed host per
  app (see [environments.md](environments.md)).
- **SPA routing:** [deploy/nginx.conf](../deploy/nginx.conf) rewrites unknown paths to
  `index.html` (client-side router owns routing); hashed `/assets` are cached immutable,
  `index.html` is never cached.
- **Pipelines:** `.github/workflows/deploy-web-prod.yml` / `deploy-web-dev.yml` build both
  apps (Docker matrix → GHCR, tagged `latest`|`dev` + git SHA) and roll the matching web
  stack over SSH — same pattern as the backend.
- **Env baking:** `VITE_*` values are compile-time and public; they come from GitHub
  repository **variables** (`PROD_API_ORIGIN` / `DEV_API_ORIGIN`) passed as Docker
  build-args. Changing one means re-running the workflow (`workflow_dispatch`), not editing
  the server.
- **Zero-downtime:** compose healthchecks + `up -d --wait`, with the edge Caddy retrying
  (`lb_try_duration`) across the ~1s container swap.
- **PR previews (optional):** not wired; if ever needed, deploy the built artifact to a
  per-PR URL against the dev API. No tenant configuration is needed on a preview URL — the
  tenant comes from whoever logs in (see [environments.md](environments.md) §4/§5).
- **Promotion:** `dev` branch → dev stack automatically; `main` → production. Keep frontend
  and backend deploys in lockstep when a contract changes.

---

## 4. Caching & secrets

- `.turbo` local cache + remote cache; never cache `node_modules` contents in app outputs.
- CI secrets: `TURBO_TOKEN`/`TURBO_TEAM` (or self-hosted cache creds), the VPS SSH deploy
  key (`VPS_HOST`/`DEPLOY_USER`/`DEPLOY_SSH_KEY`). **No backend secrets** — the SPA holds
  none, and `VITE_*` values are public repository variables, not secrets.

---

## 5. Versioning

Single-version monorepo (apps deploy from `main`); packages are internal (`workspace:*`), not
published. If a package is ever published externally, introduce Changesets then — not before.
