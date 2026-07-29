# CLAUDE.md — `apps/portal`

App-specific guidance for the **Portal Web App**. The repo-root [CLAUDE.md](../../CLAUDE.md) and everything under [docs/](../../docs) are authoritative and apply here in full — read the relevant doc before working in an area. This file records only what is **specific to this app**.

The portal is the self-service console for **students and parents**. It targets the **`/api/v1/portal/*`** surface (plus `/api/v1/public/*` for auth), for the roles **STUDENT** and **PARENT**. React 19 + Vite SPA. Dev server runs on **port 5176**.

---

## Status: shell only — do not build ahead of the API

**The backend has not implemented `/api/v1/portal/*`.** `cohort-be/src/api/` contains `manage`, `public`, `super-admin` and `teach` only; the portal section of `cohort-be/docs/api-reference.md` (§5) is a **specification**, not shipped code.

- This app exists as a scaffold, approved by the engineer, so the shell is ready when the surface lands. It renders one placeholder route and makes **no network calls**.
- **Do not add features, api-client instances, or data hooks against §5 of the API reference.** Confirm each endpoint exists in `cohort-be/src/api/portal/` first (root CLAUDE.md: "don't build ahead of the API").
- Deployment is deliberately not wired — the app is not in `deploy/docker-compose.web.yml` nor in the `.github/workflows/deploy-web-*.yml` build matrix. It **is** in the `Dockerfile` deps stage, because `pnpm install --frozen-lockfile` needs every workspace manifest.

---

## Auth, session & tenancy (security-sensitive — see [docs/auth-and-rbac.md](../../docs/auth-and-rbac.md))

Nothing is wired yet. When it is:

- **Login** is the shared, role-agnostic `POST /public/auth/login` every console uses; the tenant is resolved by the backend from the user's single membership. Access token → memory (Zustand); refresh token → `localStorage` under a **portal-scoped** key (`cohort.portal.refreshToken`) — never reuse another app's key.
- **Login is role-agnostic; this console is not.** Reject a session whose `user.roles` holds neither `STUDENT` nor `PARENT`, and guard the authed route with the same role check — otherwise a staff user signs in and every portal request 403s.
- **Parents are multi-child.** Most portal list endpoints take an optional `?studentId=`; without it they return data for every linked child. Any child selector is **client state** (Zustand) that must be part of the query key — the same shape as admin's branch selector, not a copy of it.
- **Do not change token handling, tenant resolution, or RBAC without the engineer** (root CLAUDE.md "stop and ask").

---

## Conventions quick-reference

- Import UI/utils/client from the `@repo/*` barrels only; the `@/` alias points at `src/`. Never deep-import a package or another feature's internals.
- Components come from `@repo/ui` — no raw HTML `<button>`/`<input>`, no re-created primitives, no inline styles or hardcoded hex. Icons: `lucide-react` only. Forms: RHF + Zod + `@repo/ui` `Form`.
- **One component per file**, PascalCase; kebab-case dirs/non-component files; tabs for indentation; named exports.
- **All copy is localized.** Shell vocabulary comes from `@repo/i18n` via `useT()`; this app's screen copy lives in `src/locales/` (`uz` is the source of truth) and is reached with `useAppT()`.
- **Phone-first.** Students and parents are on phones — every screen must work at 375px.
- **Theme**: light and dark, owned by `@repo/ui` (`initTheme` in `main.tsx`, storage key `cohort.portal.theme`, mirrored by the pre-paint script in `index.html`). Never add app-local color tokens.
- Every async view handles loading / error / empty, not just success.
