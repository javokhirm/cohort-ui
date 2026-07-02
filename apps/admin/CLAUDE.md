# CLAUDE.md — `apps/admin`

App-specific guidance for the **Super Admin console**. The repo-root
[CLAUDE.md](../../CLAUDE.md) and everything under [docs/](../../docs) are authoritative and apply
here in full — read the relevant doc before working in an area. This file records only what is
**specific to this app**.

The admin app is the platform-operator console. It targets the **`/api/v1/admin/*`** surface (plus
`/api/v1/public/*` for auth) for the single role **SUPER_ADMIN**. It is **platform-wide — there is no tenant subdomain** (no `lib/tenant.ts`, no `VITE_DEV_TENANT`). React 19 + Vite SPA. Dev server runs on **port 5173**. It uses a **dark "console" theme** (`--console-*` CSS tokens) and depends on **`recharts`** for dashboard charts.

---

## ⚠️ This app is being built AHEAD of its backend — read first

This app is a prototype layer ahead of the API, which is why it looks different from the general repo rule "don't build ahead of the API." Concretely:

- Most pages call admin api against endpoints that are **planned, not shipped** (tenants,
  dashboard, users, roles, audit, plans). Some pages/tabs instead render from **`_mock.ts`
  fixtures** under `routes/` (subscriptions, profile, parts of subscription-plans) carrying a
  `TODO: replace with useQuery(...) once GET /admin/... is ready`. Either way the data is not real
  yet.
- **Before writing new feature code, confirm the endpoint ` pnpm gen:api`.** If it isn't there, treat the work as blocked or clearly mock-backed — and flag it. Do not silently invent endpoints/fields/enums.
- The admin **auth model diverges** from the tenant model and is security-sensitive (see below) — **stop and ask the engineer** before changing it.

---

## Conventions quick-reference

- Import from the `@repo/*` barrels only; `@/` alias → `src/`. No deep imports across package or feature boundaries. Components from `@repo/ui` (no raw HTML controls, no inline styles / hex).
  Icons: `lucide-react`. Forms: RHF + Zod + `@repo/ui` `Form`.
- **One component per file.** Each component gets its own PascalCase file — in the feature's
  `components/` folder, or `@repo/ui` if shared. Don't declare several components in one file
  (small private sub-components used only by that file may stay inline).
- Every async view handles loading / error / empty. Tabs for indentation; named exports; kebab-case dirs/non-component files, PascalCase components.
- Money/KPIs (MRR, revenue) go through `@repo/utils` formatters (`formatPrice`, `formatPriceAxis`, `formatNumber`) — never `toFixed`.
