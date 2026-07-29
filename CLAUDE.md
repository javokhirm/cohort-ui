# CLAUDE.md

Guidance for Claude Code (and any AI assistant) working in this repository.

**cohort-fe** is the frontend monorepo for **Cohort** — a multi-tenant B2B SaaS for
managing education centers (CRM, students, scheduling, attendance, assessments, billing,
payroll, notifications). It consumes the **cohort-be** NestJS API. Target market:
education centers in Uzbekistan (UZS, Click/Payme/Uzum payments, Telegram-first
communication, uz/ru/en locales). The backend lives in the sibling `cohort-be/` repo and
its `docs/` are the source of truth for the API contract and domain model.

---

## Working agreement — read this first

These rules are non-negotiable. The goal is **correctness and consistency, not speed**. A
slower, correct implementation that follows the conventions is always preferable to a fast
one that diverges.

- **Read before you write.** Read the relevant `docs/` and the existing code before
  changing anything. Follow the documented conventions. When the docs and the code
  disagree, **the docs win** — fix the code or flag it.
- **The backend contract is authoritative.** Never invent endpoints, fields, statuses, or
  enums. Cross-check against `cohort-be/docs/api-reference.md` and the generated OpenAPI
  types (see [docs/api-integration.md](docs/api-integration.md)). If a type is missing,
  regenerate from the spec — do not hand-write it.
- **Don't build ahead of the API.** Build a feature/screen only once its backend endpoints
  exist. No speculative features, no empty folders for future work.
- **Reuse the shared packages before writing anything new.** All cross-cutting code lives
  in the `@repo/*` packages — `@repo/ui` (components + primitives), `@repo/utils`
  (formatters, guards, shared types), `@repo/api-client` (generated types, typed client,
  query-key + pagination helpers), and the rest. Look there **first** and use what fits —
  never duplicate a component, helper, formatter, or type that already exists, and never
  hand-roll money/date formatting when `@repo/utils` provides it. If you need something
  shareable across apps that doesn't exist yet, **stop and ask the engineer** before adding
  it to a package (see the promotion rule under _Repository structure_).
- **Respect package boundaries.** Apps import from package _barrels_ (`@repo/*`) only;
  packages never import apps; dependency direction is enforced (see
  [docs/architecture.md](docs/architecture.md)). No deep imports past a package's public
  entrypoint.
- **Server state lives in TanStack Query. Client state lives in Zustand.** Do not put
  server data in Zustand or React state, and do not build a Redux-style global store.
- **All user-facing text is localized.** Never hardcode a string in a component — use `useT()`
  from `@repo/i18n` and add the key to **all three catalogs** (`uz` is the source of truth, then
  `ru`, `en`). Interpolate (`t('greeting', { name })`), never concatenate. Details in
  [docs/conventions.md](docs/conventions.md) §7.
- **Anything touching money, invoices, or payments is critical.** Format money via the
  shared helpers (never raw `toFixed`), show invoice/payment status explicitly, and never
  assume a mutation succeeded without server confirmation.
- **Test what matters, not coverage theater.** Cover logic, schemas, and formatters; cover
  each feature's happy path plus its error/empty handling; money/auth/payment paths are
  mandatory. The tiered rule lives in [docs/testing.md](docs/testing.md); add MSW handlers
  for any new endpoint.
- **Do NOT add new dependencies** without the engineer's explicit approval.
- **When in doubt, ask the engineer for clarification rather than guessing.**

### Stop and ask the engineer before proceeding if you encounter:

- Ambiguous requirements or unclear expected behavior.
- Changes to **authentication, token handling, tenant resolution, or RBAC gating**.
- Anything affecting **payment, invoice, or payroll** UI flows.
- A **new shared package** or a change to package boundaries / dependency direction.
- A **new third-party dependency**, or replacing an approved one.
- A backend contract that seems wrong or missing — confirm with the backend before working
  around it.
- Any situation where you're choosing between multiple valid approaches — let the engineer
  decide.

---

## Documentation — read the relevant doc before working in that area

`docs/` is the source of truth for this repo's architecture and conventions.

| Doc                                                  | Read it when you need…                                                               |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------ |
| [docs/architecture.md](docs/architecture.md)         | The big picture: apps, packages, dependency rules, backend-domain → feature mapping. |
| [docs/folder-structure.md](docs/folder-structure.md) | Where every kind of file lives, in apps and packages.                                |
| [docs/api-integration.md](docs/api-integration.md)   | The API client: codegen, the typed client, envelope/error handling, Query hooks.     |
| [docs/auth-and-rbac.md](docs/auth-and-rbac.md)       | Tenant resolution, token lifecycle, silent refresh, permission gating, branch scope. |
| [docs/conventions.md](docs/conventions.md)           | Naming, imports, components, forms, validation, state, i18n, money/date formatting.  |
| [docs/testing.md](docs/testing.md)                   | What to test and how (Vitest, RTL, MSW, Playwright).                                 |
| [docs/environments.md](docs/environments.md)         | Env vars, the typed env schema, local multi-tenant dev.                              |
| [docs/ci-cd.md](docs/ci-cd.md)                       | The CI pipeline, Turbo caching, and deployment model.                                |
| [docs/contributing.md](docs/contributing.md)         | Branching, commits, PRs, the review checklist.                                       |

---

## Tech stack

- **Monorepo:** Turborepo + pnpm workspaces
- **App framework:** React 19 + Vite + TypeScript (SPA), one app per backend API surface
- **Routing:** TanStack Router (type-safe routes + search params)
- **Server state:** TanStack Query · **Client state:** Zustand
- **Forms:** React Hook Form · **Validation:** Zod (forms, env, and client-side parsing).
  API _responses_ are trusted via the generated OpenAPI types + MSW, not re-validated at
  runtime — see [docs/api-integration.md](docs/api-integration.md).
- **UI:** shadcn/ui + Tailwind CSS + Radix primitives (owned in `packages/ui`)
- **API client:** `openapi-typescript` types from the backend's OpenAPI spec + a thin typed
  client + hand-written TanStack Query hooks
- **i18n:** uz (default), ru, en · **Region:** UZS currency, `Asia/Tashkent` timezone
- **Testing:** Skip writing any tests for now
- **Quality:** ESLint (flat config) + Prettier + `prettier-plugin-tailwindcss`, husky +
  lint-staged

---

## UI Design System

- Import every component from `@repo/ui` (shadcn/ui primitives + composed Cohort components). Never write raw HTML buttons, inputs, etc., and never re-create a primitive that the barrel already exports.
- Theme tokens live in `tailwind.config.ts` and `globals.css` (CSS variables)
- Forms: always use `FieldGroup` + React Hook Form + Zod
- Icons: use `lucide-react` only

## Component Rules

- Buttons: use `<Button variant="...">` — variants: default, outline, ghost, destructive
- Layout: use `Card`, `Separator`, `Sheet` for structure
- No inline styles. No hardcoded hex colors.

---

## Commands

> These are the standard scripts. They run through Turbo at the repo root and scope to the
> affected packages. (Scaffolding of the toolchain itself is a separate, approved step.)

Package manager is **pnpm**; See @package.json for available npm commands.

A pre-commit hook (husky + lint-staged) runs prettier/eslint on staged files. See
[docs/contributing.md](docs/contributing.md).

---

## Repository structure

- **Always check the shared packages first — for everything, not just UI.** Before writing any component, formatter, helper, guard, shared type, or API-client code, look for it in the `@repo/*` packages: `@repo/ui` (components + primitives), `@repo/utils` (money/date formatters, guards, cross-cutting types), `@repo/api-client` (generated types, typed client, query-key + pagination helpers). Use what fits — do not duplicate.
- **Flag candidates for promotion.** If you find yourself building anything — a component, helper, formatter, or type — that would logically be useful across more than one app (`admin`, `super admin`, and the future `teacher`/`portal`), **stop and ask the engineer** whether it belongs in the relevant `@repo/*` package instead of the app. Do not place it in the app and do not create or expand the shared package yourself — that decision belongs to the engineer.

```
cohort-fe/
├── apps/
│   ├── internal-platform/       # Internal Platform Web App (/api/v1/super-admin/* surface)
│   ├── admin/       # Admin Web App (/api/v1/manage/* surface)
│   ├── teacher/     # Teacher Web App (/api/v1/teach/* surface)
│   ├── student/     # Student Web App — shell only; /api/v1/portal/* is unbuilt
│   └── parent/      # Parent Web App  — shell only; /api/v1/portal/* is unbuilt
├── packages/
│   ├── ui/           # shadcn primitives + composed components
│   ├── api-client/   # generated types, typed HTTP client, query-key + pagination helpers
│   ├── auth/         # session store, refresh logic, permission catalog, <Can>, guards
│   ├── i18n/         # uz/ru/en messages + money/date formatters
│   ├── utils/        # framework-agnostic helpers + shared cross-cutting types
│   └── config/       # shared eslint / tailwind / ts presets (subpath exports)
└── docs/             # this repo's architecture & conventions
```

Full detail in [docs/folder-structure.md](docs/folder-structure.md).

### Apps mirror backend surfaces; features mirror backend domains

The backend exposes **four role-gated API surfaces** (plus a shared, unauthenticated
`/public` surface used by every app for auth). A surface becomes an app **when its roadmap
phase arrives** — today `admin`, `internal-platform` and `teacher` are built, and `student`
and `parent` exist as empty shells:

| App                       | Backend surface         | Roles                 | Host                 |
| ------------------------- | ----------------------- | --------------------- | -------------------- |
| `admin` (now)             | `/api/v1/manage/*`      | OWNER, ADMIN, MANAGER | `admin.cohort.uz`    |
| `internal-platform` (now) | `/api/v1/super-admin/*` | SUPER_ADMIN           | `internal.cohort.uz` |
| `teacher` (now)           | `/api/v1/teach/*`       | TEACHER               | `teach.cohort.uz`    |
| `student` (shell only)    | `/api/v1/portal/*`      | STUDENT               | `student.cohort.uz`  |
| `parent` (shell only)     | `/api/v1/portal/*`      | PARENT                | `parent.cohort.uz`   |

> The `/api/v1/teach/*` surface is **shipped** (schedule, groups, attendance,
> assessments, materials, student profiles, grading scales) — the teacher app is
> not building ahead of it. Note there is **no `/teach/me`**: a teacher's identity
> comes from the login/refresh `user` summary.
>
> **One surface, two apps.** `/api/v1/portal/*` is gated
> `TenantRoleGuard(['STUDENT', 'PARENT'])` and backs **both** `student` and `parent` —
> a deliberate exception to "one app per surface", because the two audiences want
> different products rather than one app branching on role. Each app must reject the
> other's role at login and in its route guard.
>
> **Both are scaffolds, not features.** The backend has **not** built
> `/api/v1/portal/*` (`cohort-be/src/api/` ships `manage`, `public`, `super-admin`,
> `teach` only — §5 of the API reference is a spec). Each app holds the shell and one
> placeholder page, with no auth and no api-client. Do not add screens or data hooks
> until the endpoints exist — see [apps/student/CLAUDE.md](apps/student/CLAUDE.md) and
> [apps/parent/CLAUDE.md](apps/parent/CLAUDE.md).

Every app also talks to `/api/v1/public/*` for login/refresh. Inside an app, `src/features/*`
folders mirror the backend domains (`people`, `academics`, `billing`, …) — grouped by what
changes together, so tightly-coupled backend domains may share one feature
([docs/architecture.md](docs/architecture.md)).

---

## Multi-tenancy (important context)

Cohort is multi-tenant: one education-center _business_ (tenant) with one or many
_branches_. **A user belongs to exactly one tenant**, and every frontend is served from one
fixed host (admin console → `admin.cohort.uz`, super admin console → `internal.cohort.uz`,
teacher app → `teach.cohort.uz`). The backend resolves the tenant from the user's single membership at
login and scopes every request by the JWT `tenantId`. The frontend serves **one build for
all tenants** — never bake a tenant into the build. Multi-branch
users pick their view in a global, multi-select **branch selector**; the selection is
client state injected into list queries as `branchIds` (part of the query key). The
selectable set comes from `GET /manage/branches`, already scoped per user by the
backend. See [docs/auth-and-rbac.md](docs/auth-and-rbac.md).

**Authorization in the UI is cosmetic.** The server is the source of truth for permissions.
Gate navigation and actions with `<Can>` / `usePermissions()` for UX, but never rely on client gating for security.
