# Architecture

How `cohort-fe` is organized, why, and the rules that keep it that way. Read this before
adding an app, a package, or a cross-package dependency.

---

## 1. Principles

1. **Mirror the backend's domain boundaries — as the default, not a law.** The backend is
   domain-first with role-gated API surfaces. The frontend mirrors it for navigability: **one
   app per role-gated surface**, and inside each app, **feature folders named after the
   backend domains**. But group by _what changes together_: tightly-coupled domains may merge
   into one feature (e.g. billing/finance/payments → `features/billing`), identity lives in
   `packages/auth` (not a feature), and cross-domain dashboards get their own `features/dashboard`.
2. **Apps are thin; logic is shared or local-to-feature.** An app is a composition of
   features plus a shell (router, providers, layout). Cross-app reusable logic lives in
   `packages/*`; feature-specific logic lives in that feature's folder.
3. **Strict, one-way dependencies.** `apps → packages`, and within packages a fixed order
   (below). Never backwards, never sideways past a barrel.
4. **Packages expose a public contract.** Each package's `index.ts` (or `exports` map) is
   the only entrypoint. Internals are private — mirroring the backend's `index.ts` rule.
5. **Server state is not application state.** TanStack Query owns everything that comes from
   the API. Zustand owns the small slice of true client state. They never overlap.
6. **Build once, serve every tenant.** The tenant is a runtime fact (who logs in), never
   a build input.
7. **Don't over-engineer.** Add a package or abstraction when a _second_ consumer appears,
   not in anticipation of one. We start with the staff app; the rest follows the roadmap. We
   will **merge any package that stays trivial** rather than keep ceremony.

---

## 2. The two layers: apps and packages

```
                ┌──────────────────────────────────────────────┐
   apps/        │  staff  (teacher · portal · admin — later)    │   composition + routing
                └───────────────┬──────────────────────────────┘
                                │ imports barrels only
                ┌───────────────▼──────────────────────────────┐
   packages/    │  ui   auth   api-client   i18n   utils        │   shared, reusable
                │  config (eslint · tailwind · ts presets)      │   (build tooling)
                └──────────────────────────────────────────────┘
```

### Apps (`apps/*`)

Each app maps to **one role-gated backend surface** and the roles that use it, and also
consumes the shared `/api/v1/public/*` surface for authentication. **Today there is one app,
`staff`** (Phase-1 MVP = Staff Web App, on `/manage` + `/public`). `teacher`, `portal`, and
`admin` are added as sibling apps when their roadmap phase arrives — they reuse every package
unchanged, which is the whole point of doing the package split now.

> We deliberately did **not** scaffold empty app shells. Idle apps are maintenance cost
> (build, lint, deps) for no value. The package boundaries are what make adding an app cheap.

### Packages (`packages/*`)

We keep the package count minimal and grow it only when a second consumer appears.

| Package      | Responsibility                                                                                                                                                                 | May depend on         |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------- |
| `utils`      | Framework-agnostic pure helpers (money, dates, formatting, code parsing, guards) **and** shared cross-cutting types. The leaf.                                                 | —                     |
| `config`     | Build tooling: ESLint flat config, Tailwind preset + design tokens, base `tsconfig` — via subpath exports (`@cohort/config/eslint`, `/tailwind`, `/ts`).                       | — (leaf)              |
| `api-client` | Generated OpenAPI types, the typed HTTP client (envelope unwrap, error normalization, injected auth hook), query-key factories, pagination helpers.                            | `utils`               |
| `auth`       | Session store, token storage + silent refresh, permission catalog, `<Can>`, route guards, `useAuth`/`usePermissions`.                                                          | `api-client`, `utils` |
| `i18n`       | uz/ru/en shared message catalogs, `initI18n`/`I18nProvider`, `useT`/`useLocale`/`setLocale` (i18next + react-i18next). Region formatters (UZS, Asia/Tashkent) stay in `utils`. | `utils`               |
| `ui`         | shadcn/ui primitives + composed, app-agnostic components. No data fetching, no business logic.                                                                                 | `config`, `utils`     |

> **Why so few?** A one-app repo doesn't need nine packages. We folded standalone `types`
> into `utils` (no cross-package type earns its own package yet) and the three `config-*`
> packages into one `config` with subpath exports. Split them out later only if one grows or
> a second consumer needs it independently.
>
> **Why shadcn/ui** (a copy-in component approach) over an installed library: you own the
> source in `packages/ui` (no version lock-in), it's Tailwind-native, Radix gives a11y
> primitives for free, and CSS-variable design tokens (in `config`) enable per-tenant
> theming. Trade-off: component updates are manual copy-in, not `npm update` — acceptable for
> the control it buys.

**Dependency order (top may use anything below it; never the reverse):**

```
ui ─┐
auth ─┤→ api-client → utils
i18n ─┘
config  (leaf — build tooling, no runtime deps)
```

Rules:

- **No cycles.** `api-client` must not import `auth`; `auth` imports `api-client` (it needs
  the client to perform refresh). The client takes its token getter / refresh hook via
  **injection**, not by importing `auth` — this is what keeps the arrow one-way. See
  [api-integration.md](api-integration.md).
- **`ui` is dumb.** No API calls, no Query, no Zustand, no router. It receives data and
  callbacks as props. This keeps it usable from any app and trivially testable.
- **No deep imports.** `import { Button } from '@cohort/ui'` ✅ ·
  `import { Button } from '@cohort/ui/src/button'` ❌.
- Enforced by ESLint (`no-restricted-imports` / boundary rules) and the Turbo task graph.

---

## 3. Inside an app: feature-first

```
apps/admin/src/
├── app/         # shell: providers, router wiring, root layout, error boundary
├── routes/      # TanStack Router route definitions (thin; delegate to a feature)
├── features/    # ← feature slices, named after backend domains (see mapping below)
├── components/  # app-local shared components (not generic enough for packages/ui)
├── lib/         # app-local config, the typed env, the configured query client + api client
└── styles/      # tailwind entry, global css
```

A **feature** is a vertical slice — it owns its data hooks, components, route screens,
schemas, and local state. Features do not import each other's internals; if two features
need the same thing, it moves up (to `components/`, `lib/`, or a package). Detail in
[folder-structure.md](folder-structure.md).

### Backend domain → frontend feature

The backend's domains map to staff-app features — **some consolidated**. A feature is created
only once the corresponding `/manage/*` endpoints exist:

| Backend domain(s) (cohort-be)    | Staff feature            | Covers                                                      |
| -------------------------------- | ------------------------ | ----------------------------------------------------------- |
| identity                         | (in `packages/auth`)     | login, session, roles/permissions, branch scope             |
| platform                         | `features/platform`      | branches, tenant settings                                   |
| people                           | `features/people`        | students, staff, guardians                                  |
| academics                        | `features/academics`     | courses, rooms, groups, sessions, enrollments, materials    |
| assessment                       | `features/assessment`    | grading scales, assessments, results, attendance overview   |
| **billing + finance + payments** | `features/billing`       | fee plans, invoices, payments, discounts, expenses, payroll |
| communication                    | `features/communication` | templates, notification log, reminder rules                 |
| crm                              | `features/crm`           | leads, pipeline, activities                                 |
| (cross-domain read models)       | `features/dashboard`     | analytics/dashboard views                                   |

> **Build order:** today the backend `/manage/*` surface implements **branches, students,
> staff** — so build `features/platform` (branches) and `features/people` (students, staff)
> first. Every other feature row above is **planned**: create it when its API lands. Don't
> build a feature ahead of its endpoints (same rule, same reason, as not scaffolding empty
> apps).

---

## 4. Data flow

```
   Component
     │  calls a feature hook
     ▼
   useStudents()  ── TanStack Query ──►  api-client (typed fetch)
     │                                      │  Authorization: Bearer <access token>
     │  returns {data, isLoading, error}    ▼
     │                                   cohort-be  /api/v1/manage/students
     ▼                                      │  401 → silent refresh (auth) → retry
   render                                   ▼
                                      envelope unwrapped → typed data | typed ApiError
```

- Components never call `fetch`/`axios` directly — only feature hooks built on `api-client`.
- The client returns **unwrapped** `data` and throws a normalized `ApiError` (carrying the
  backend's `error.code`/`message`) on failure. See [api-integration.md](api-integration.md).
- Auth (token attach, 401 → refresh → retry) is wired once in the client; features stay
  oblivious to it.

---

## 5. Package boundaries & ownership

Ownership is about _who reviews changes_, not exclusive write access. It is reflected in
`.github/CODEOWNERS`. **Until the org/teams are mapped, the owners below are placeholders**
(the CODEOWNERS file says the same) — treat the granularity as the intended target, not a
current reality. Note that "needs a second reviewer" is enforced by **branch protection**
(required approvals ≥ 2), not by CODEOWNERS alone.

| Area                                 | Owner (placeholder)  | Notes                                                    |
| ------------------------------------ | -------------------- | -------------------------------------------------------- |
| `packages/ui`, design tokens         | frontend / design    | Visual consistency, a11y, theming.                       |
| `packages/api-client`, shared types  | frontend / platform  | Contract fidelity; gate changes against backend OpenAPI. |
| `packages/auth`                      | frontend / platform  | Security-sensitive; **second reviewer** (branch rule).   |
| `packages/i18n`                      | frontend / platform  | Locale completeness (uz/ru/en).                          |
| `apps/admin/src/features/billing`    | frontend / billing   | Money-critical; **second reviewer**.                     |
| `apps/admin` (shell, other features) | frontend / admin-app | App composition, routing, layout.                        |
| root configs, CI, `docs/`            | frontend / platform  | Toolchain & conventions.                                 |

**Changing a boundary** (new package, new cross-package edge, new app) is an architectural
decision — open it with the engineer first (see CLAUDE.md "stop and ask").

---

## 6. Evolution path (built in, not built now)

1. **Add the next surface app.** Copy the `staff` app shell into `apps/teacher` (or
   `portal`/`admin`), point its `api-client` instance at the `/teach` surface, build its
   features. Packages are reused as-is.
2. **Promote a feature to a package** only when a second app needs it (e.g. a shared
   schedule calendar between `staff` and `teacher`).
3. **Split a package back out** (e.g. `config` → `config-tailwind`, or a dedicated `types`)
   only if it grows enough to earn its own lifecycle.
4. **PWA for teacher/portal.** Add `vite-plugin-pwa` to those apps when built — the staff
   app stays a plain SPA.

Each step is a clean addition, not a refactor — which is the return on splitting into
packages up front.
