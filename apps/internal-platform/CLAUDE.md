# CLAUDE.md — `apps/super-admin`

App-specific guidance for the **Super Internal platform**. The repo-root
[CLAUDE.md](../../CLAUDE.md) and everything under [docs/](../../docs) are authoritative and apply
here in full — read the relevant doc before working in an area. This file records only what is
**specific to this app**.

The internal platform app is the platform-operator console. It targets the **`/api/v1/super-admin/*`** surface (plus
`/api/v1/public/*` for auth) for the single role **SUPER_ADMIN**. React 19 + Vite SPA. Dev server runs on **port 5173**. It uses a **"console" theme** (`--console-*` CSS tokens, both a light and dark value) and depends on **`recharts`** for dashboard charts.

---

## Theme

- Both light and dark are supported, switchable via the `<ThemeToggle />` icon in `layouts/Header.tsx`. Owned by `@repo/ui` (`initTheme` in `main.tsx`); first visit follows the OS `prefers-color-scheme`, then an explicit toggle persists to `cohort.internal.theme` in `localStorage` and wins from then on.
- The console chrome (topbar, sidebar) layers its own `--console-*` tokens on top of `@repo/ui`'s — both palettes are defined in `styles/globals.css`. Extend that pattern for new chrome; never hardcode `white`/`slate-*`/hex for chrome surfaces. Route recharts colors through CSS vars too (see `features/dashboard/constants.ts`) rather than hex, so charts follow the theme.

---

## ⚠️ This app is being built AHEAD of its backend — read first

This app is a prototype layer ahead of the API, which is why it looks different from the general repo rule "don't build ahead of the API." Concretely:

- Most pages call super admin api against endpoints that are **planned, not shipped** (tenants,
  dashboard, users, roles, audit, plans). Some pages/tabs instead render from **`_mock.ts`
  fixtures** under `routes/` (subscriptions, profile, parts of subscription-plans) carrying a
  `TODO: replace with useQuery(...) once GET /super-admin/... is ready`. Either way the data is not real
  yet.
- **Before writing new feature code, confirm the endpoint ` pnpm gen:api`.** If it isn't there, treat the work as blocked or clearly mock-backed — and flag it. Do not silently invent endpoints/fields/enums.
- The super admin **auth model diverges** from the tenant model and is security-sensitive (see below) — **stop and ask the engineer** before changing it.

---

## Conventions quick-reference

- Import from the `@repo/*` barrels only; `@/` alias → `src/`. No deep imports across package or feature boundaries. Components from `@repo/ui` (no raw HTML controls, no inline styles / hex).
  Icons: `lucide-react`. Forms: RHF + Zod + `@repo/ui` `Form`.
- **One component per file.** Each component gets its own PascalCase file — in the feature's
  `components/` folder, or `@repo/ui` if shared. Don't declare several components in one file
  (small private sub-components used only by that file may stay inline).
- Every async view handles loading / error / empty. Tabs for indentation; named exports; kebab-case dirs/non-component files, PascalCase components.
- Money/KPIs (MRR, revenue) go through `@repo/utils` formatters (`formatPrice`, `formatPriceAxis`, `formatNumber`) — never `toFixed`.
