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

The apps are **static SPAs** → build to static assets, serve from a CDN.

- **Hosting options:** Vercel / Netlify / Cloudflare Pages, or S3 + CloudFront. Any static
  host works — each app lives on one fixed host (`staff.cohort.uz`, `internal.cohort.uz`; see
  [environments.md](environments.md)).
- **SPA routing:** configure the host to rewrite unknown paths to `index.html` (client-side
  router owns routing).
- **Per-app:** each `apps/*` builds and deploys independently (today only `staff`). Turbo
  builds only the affected app.
- **PR previews (optional):** if the host offers them for free (Vercel/Netlify/CF Pages),
  deploy the built artifact to a per-PR URL against the **staging** API. Not required —
  staging + production are the baseline. No tenant configuration is needed on a preview URL —
  the tenant comes from whoever logs in (see [environments.md](environments.md) §4/§5).
- **Promotion:** `main` → staging automatically; production via a tagged release / manual
  approval. Keep this in lockstep with backend deploys when a contract changes.

---

## 4. Caching & secrets

- `.turbo` local cache + remote cache; never cache `node_modules` contents in app outputs.
- CI secrets: `TURBO_TOKEN`/`TURBO_TEAM` (or self-hosted cache creds), deploy host token,
  `VITE_SENTRY_DSN` if used. **No backend secrets** — the SPA holds none.

---

## 5. Versioning

Single-version monorepo (apps deploy from `main`); packages are internal (`workspace:*`), not
published. If a package is ever published externally, introduce Changesets then — not before.
