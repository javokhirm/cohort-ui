# CLAUDE.md — `apps/teacher`

App-specific guidance for the **Teacher Web App**. The repo-root [CLAUDE.md](../../CLAUDE.md) and everything under [docs/](../../docs) are authoritative and apply here in full — read the relevant doc before working in an area. This file records only what is **specific to this app**.

The teacher app is the classroom console for teaching staff. It serves the **`/api/v1/teach/*`** surface (plus `/api/v1/public/*` for auth), for the single role **TEACHER**. React 19 + Vite SPA. Dev server runs on **port 5175**.

---

## Auth, session & tenancy (security-sensitive — see [docs/auth-and-rbac.md](../../docs/auth-and-rbac.md))

- **Login**: phone + password → `POST /public/auth/login`, the same shared endpoint every console uses. The tenant is resolved by the backend from the user's single membership. Access token → memory (Zustand); refresh token → `localStorage` under the teacher-scoped key in `lib/auth/tokenStorage.ts` (`cohort.teacher.refreshToken`).
- **Login is role-agnostic; this console is not.** The backend happily authenticates an OWNER/ADMIN/MANAGER here, and the teach surface would then 403 every request. `useLogin()` therefore rejects a session whose `user.roles` lacks `TEACHER` (`RoleNotAllowedError`), and `requireRole(['TEACHER'])` guards the authed route for sessions restored via refresh.
- **There is no `/teach/me`.** `/manage/me` is gated to OWNER/ADMIN/MANAGER and 403s for a teacher. The signed-in teacher's identity comes **only** from the `user` summary on the login/refresh response — do not add a profile fetch, and do not copy admin's `loadPermissions()` boot step.
- **The teach surface is gated by role only** — it carries no permission codes. Gate with `hasRole()` / `requireRole()`; there is no `requirePermission` / `<Can>` here, and the session store holds no `permissions`.
- **Silent refresh**: `runRefresh()` in `api/apiClient.ts` is both the boot check and the `teachApi` 401 hook (single-flight lives inside `@repo/api-client`).
- **Do not change token handling, tenant resolution, or RBAC without the engineer** (root CLAUDE.md "stop and ask").

---

## Shell & responsiveness

- The shell is composed from `@repo/ui` shell primitives — **`AppSidebar`, `AppTopbar`, `BottomTabBar`**. Do not hand-roll nav chrome; extend the primitives in `@repo/ui` instead.
- **One nav list drives both chromes.** `layouts/nav.ts` is the single source: the desktop sidebar (`md:` and up) and the mobile bottom tabs render from it, so they cannot drift.
- Mobile-first matters here — teachers take attendance on a phone. Every screen must work at 375px.
- **Theme**: light by default, dark via the `dark` class on `<html>` (`lib/theme.ts`, persisted). Both palettes already exist in `@repo/ui`; never add app-local color tokens.

---

## Login is shared

The sign-in UI is **`LoginCard` from `@repo/ui`** — shared with the admin console. This app owns only the mutation, the session, and the branding props. Change the visual there, not here, and remember admin renders the same component.

---

## Conventions quick-reference

- Import UI/utils/client from the `@repo/*` barrels only; the `@/` alias points at `src/`. Never deep-import a package or another feature's internals.
- Components come from `@repo/ui` — no raw HTML `<button>`/`<input>`, no re-created primitives, no inline styles or hardcoded hex. Icons: `lucide-react` only. Forms: RHF + Zod + `@repo/ui` `Form`.
- **One component per file**, PascalCase; kebab-case dirs/non-component files; tabs for indentation; named exports.
- Every async view handles loading / error / empty, not just success.
