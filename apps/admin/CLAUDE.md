# CLAUDE.md — `apps/admin`

App-specific guidance for the **Admin Web App**. The repo-root [CLAUDE.md](../../CLAUDE.md) and everything under [docs/](../../docs) are authoritative and apply here in full — read the relevant doc before working in an area. This file records only what is **specific to this app** and, where the shipped code diverges from the docs, **what the code actually does**.

The admin app is the back-office console for education-center admins. It serves the **`/api/v1/manage/*`** surface (plus `/api/v1/public/*` for auth), for roles **OWNER, ADMIN, MANAGER**. It is a React 19 + Vite SPA. Dev server runs on **port 5174**.

---

## Auth, session & tenancy (security-sensitive — see [docs/auth-and-rbac.md](../../docs/auth-and-rbac.md))

- **Login**: phone + password → `POST /public/auth/login`. The tenant is resolved by the
  backend from the user's single membership (one user = one business) — the client never
  sends it. Access token → memory (Zustand); refresh token → `localStorage` under the
  admin-scoped key in `lib/auth/tokenStorage.ts`.
- **Silent refresh**: `runRefresh()` in `api/apiClient.ts` is both the boot check and the
  `manageApi` 401 hook (single-flight lives inside `@repo/api-client`).
- **Gating is cosmetic.** Use `hasRole()` / `requireRole()` for UX only. Permission-code gating is
  **not built** (the token carries roles only) — gate by role until the backend ships resolved
  permissions.
- Multi-tenant: one build serves all tenants from the single fixed host `admin.cohort.uz`; never bake a tenant into the bundle. The tenant identity is
  known only after login.
- **Do not change token handling, tenant resolution, or RBAC without the engineer** (root CLAUDE.md
  "stop and ask").

---

## Money is critical

Some features are money-critical. Format all amounts through `@repo/utils` (`formatPrice`/`formatMoney`/`formatNumber`) — never `toFixed` or string-concatenated currency.
Show status explicitly (`DRAFT`/`APPROVED`/`PAID`) via the `@repo/ui` `StatusBadge`, never assume a mutation (approve, mark-paid) succeeded without server confirmation, and never use optimistic
updates on payroll.

---

## Conventions quick-reference

- Import UI/utils/client from the `@repo/*` barrels only; the `@/` alias points at `src/`. Never
  deep-import a package or another feature's internals.
- Components come from `@repo/ui` — no raw HTML `<button>`/`<input>`, no re-created primitives, no
  inline styles or hardcoded hex. Icons: `lucide-react` only. Forms: RHF + Zod + `@repo/ui` `Form`.
- **One component per file.** Each component gets its own PascalCase file — in the feature's
  `components/` folder, or `@repo/ui` if shared. Don't declare several components in one file
  (small private sub-components used only by that file may stay inline).
- Every async view handles loading / error / empty, not just success.
- Tabs for indentation; named exports; kebab-case dirs/non-component files, PascalCase components.
