# Folder Structure

Where every kind of file lives. When you create a file, match this layout. When something
doesn't fit, that's a signal to discuss — not to invent a new location.

---

## Repository root

```
cohort-fe/
├── apps/
│   └── staff/                      # Phase-1 Staff Web App
├── packages/
│   ├── ui/
│   ├── api-client/
│   ├── auth/
│   ├── i18n/
│   ├── utils/                      # helpers + shared cross-cutting types
│   └── config/                     # eslint / tailwind / ts presets (subpath exports)
├── docs/                           # this documentation
├── .github/
│   ├── workflows/ci.yml            # (planned — see ci-cd.md; not created yet)
│   └── CODEOWNERS
├── .husky/                         # git hooks (pre-commit: lint-staged)
├── turbo.json                      # task pipeline + caching
├── pnpm-workspace.yaml             # workspace globs: apps/*, packages/*
├── package.json                    # root scripts (delegate to turbo), shared devDeps
├── tsconfig.json                   # references the packages; base from @cohort/config/ts
├── .nvmrc                          # pinned Node version
├── .prettierrc / .prettierignore
└── CLAUDE.md
```

Naming: **directories and non-component files are `kebab-case`**; **React components and
their files are `PascalCase`** (`StudentTable.tsx`); hooks follow the rule in
[conventions.md](conventions.md) §3 (`use-students.ts`, kebab-case). See
[conventions.md](conventions.md).

---

## An app — `apps/admin/`

```
apps/admin/
├── index.html
├── vite.config.ts
├── tsconfig.json                   # extends @cohort/config/ts
├── package.json                    # depends on workspace packages via "workspace:*"
├── .env.example                    # documents required VITE_* vars (see environments.md)
└── src/
    ├── main.tsx                    # entry: mounts <App/>
    │
    ├── app/                        # the shell — wiring only, no feature logic
    │   ├── App.tsx                 # providers + <RouterProvider/>
    │   ├── providers.tsx           # QueryClientProvider, AuthProvider, I18nProvider, Theme
    │   ├── router.tsx              # TanStack Router instance (route tree assembly)
    │   ├── RootLayout.tsx          # app chrome: nav, header (tenant + branch switcher)
    │   └── error-boundary.tsx
    │
    ├── routes/                     # TanStack Router route objects (thin)
    │   ├── __root.tsx              # root route: auth gate, layout
    │   ├── login.tsx               # public route
    │   ├── _authed.tsx             # layout route guarding the authenticated area
    │   ├── _authed.students.tsx    # → renders features/people StudentListPage
    │   └── ...                     # one route module per page; delegates to a feature
    │
    ├── features/                   # ← feature slices, named after backend domains
    │   ├── people/                 # ✅ build now (students, staff, guardians)
    │   │   ├── api/                # TanStack Query hooks + query keys for this domain
    │   │   │   ├── students.queries.ts     # useStudents, useStudent (may hold several hooks)
    │   │   │   ├── students.mutations.ts   # useCreateStudent, useUpdateStudent, ...
    │   │   │   └── keys.ts                  # peopleKeys factory
    │   │   ├── components/         # presentational + composed components for the feature
    │   │   │   ├── StudentTable.tsx
    │   │   │   └── StudentForm.tsx
    │   │   ├── pages/            # route-level pages (what a route renders)
    │   │   │   ├── StudentListPage.tsx
    │   │   │   └── StudentDetailPage.tsx
    │   │   ├── schemas/            # zod schemas for this feature's forms
    │   │   │   └── student-form.schema.ts
    │   │   ├── hooks/              # feature-local hooks (non-data)
    │   │   └── index.ts           # the feature's internal barrel (what routes import)
    │   └── platform/              # ✅ build now (branches, tenant settings)
    │
    │   # PLANNED — create each only when its /manage API lands (don't scaffold empty):
    │   #   academics/  assessment/  billing/  communication/  crm/  dashboard/
    │
    ├── components/                 # app-local shared components (cross-feature, not generic
    │                               # enough for packages/ui) — e.g. <PageHeader/>, <DataTable/>
    ├── lib/
    │   ├── env.ts                  # typed, Zod-validated import.meta.env
    │   ├── query-client.ts         # configured QueryClient (defaults, retry, error mapping)
    │   ├── api.ts                  # configured api-client instance for the /manage surface
    └── styles/
        └── globals.css             # tailwind entry + base layer
```

### Where things go (app-level)

| You're adding…                               | Put it in…                                              |
| -------------------------------------------- | ------------------------------------------------------- |
| A new screen reachable by URL                | `routes/` (route) + `features/<domain>/screens/`        |
| A data hook for a `/manage` endpoint         | `features/<domain>/api/*.queries.ts` / `*.mutations.ts` |
| A form's validation schema                   | `features/<domain>/schemas/`                            |
| A component used only in one feature         | `features/<domain>/components/`                         |
| A component used across features in this app | `apps/admin/src/components/`                            |
| A component reusable across **apps**         | `packages/ui` (discuss first)                           |
| App-wide config / clients                    | `apps/admin/src/lib/`                                   |

**Feature isolation:** a feature imports from `packages/*`, from `apps/admin/src/lib` and
`components`, and from its own folder — **not** from another feature's internals. Need to
share between features? Lift it to `components/`, `lib/`, or a package.

---

## A package — shapes

All packages expose a single public entrypoint and keep internals private.

```
packages/ui/
├── package.json            # "exports": { ".": "./src/index.ts" }
├── src/
│   ├── index.ts            # public barrel — the ONLY import surface
│   ├── button.tsx          # shadcn primitives (kebab-case filenames, per shadcn convention)
│   ├── dialog.tsx
│   ├── form.tsx            # RHF-aware shadcn form wrappers
│   ├── data-table/         # composed component
│   └── lib/
│       └── cn.ts           # class-name util (clsx + tailwind-merge)
└── components.json         # shadcn config (where the CLI drops components)
```

```
packages/api-client/
├── src/
│   ├── index.ts            # public barrel
│   ├── generated/
│   │   └── schema.d.ts     # openapi-typescript output (DO NOT hand-edit; pnpm gen:api)
│   ├── client.ts           # createApiClient(): typed fetch, envelope unwrap, ApiError
│   ├── errors.ts           # ApiError + isApiError + error-code constants
│   ├── pagination.ts       # PaginatedResult<T>, paginationToSearch(), helpers
│   └── query-keys.ts       # shared query-key helpers/factories
```

```
packages/auth/
├── src/
│   ├── index.ts
│   ├── session-store.ts    # Zustand store: access token (memory), user summary
│   ├── token-storage.ts    # refresh token persistence (localStorage) + read/clear
│   ├── refresh.ts          # silent-refresh logic, single-flight queue
│   ├── permissions.ts      # PERMISSION catalog (mirrors backend codes) + types
│   ├── Can.tsx             # <Can role=... permission=...> guard component
│   ├── use-auth.ts         # useAuth(), usePermissions()
│   └── route-guards.ts     # requireAuth / requireRole helpers for the router
```

```
packages/i18n/
├── src/
│   ├── index.ts                  # barrel: initI18n, I18nProvider, useT, useLocale, setLocale, …
│   ├── config.ts                 # initI18n({storageKey}) + locale state (mirrors ui/theme.ts)
│   ├── hooks.ts                  # useT(ns), useLocale()
│   ├── provider.tsx              # I18nProvider (wraps react-i18next's I18nextProvider)
│   ├── types.ts                  # i18next module augmentation → typed t() keys (uz = source of truth)
│   └── messages/{uz,ru,en}.ts    # shared catalogs: common, auth, nav, enums, validation
```

Region formatters (money/UZS, date/Asia/Tashkent) live in `packages/utils`, not here — `i18n`
is message translation only. App-specific/feature strings stay in the app
(`apps/<app>/src/locales/…`, registered via `i18n.addResourceBundle`), not in this package.

```
packages/utils/   src/index.ts + pure helpers (money.ts, date.ts, codes.ts, ...) + shared types
packages/config/  src/eslint.js · src/tailwind.ts (preset + tokens.css) · src/ts/base.json
                  exported via "exports": { "./eslint": ..., "./tailwind": ..., "./ts": ... }
```

---

## Test file placement

- **Unit/component tests** are co-located: `StudentTable.test.tsx` next to `StudentTable.tsx`.
- **MSW handlers** live in `apps/admin/src/test/handlers/` (or `packages/api-client` test
  fixtures for shared ones).
- **E2E (Playwright)** live in `apps/admin/e2e/`.

See [testing.md](testing.md).

---

## Import path aliases

Each app sets a `@/` alias to its own `src/` (via `vite.config.ts` + `tsconfig`). Packages
are imported by their workspace name, never by relative path:

```ts
import { Button } from '@cohort/ui';
import { useStudents } from '@/features/people';
// ❌ never: import { Button } from '../../../packages/ui/src/button';
```

(The `@cohort/*` scope is the working convention; confirm the npm scope at scaffold time.)
