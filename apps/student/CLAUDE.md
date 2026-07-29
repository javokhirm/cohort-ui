# CLAUDE.md — `apps/student`

App-specific guidance for the **Student Web App**. The repo-root [CLAUDE.md](../../CLAUDE.md) and everything under [docs/](../../docs) are authoritative and apply here in full — read the relevant doc before working in an area. This file records only what is **specific to this app**.

The student app is the self-service console for **learners**. It targets the **`/api/v1/portal/*`** surface (plus `/api/v1/public/*` for auth), for the single role **STUDENT**. React 19 + Vite SPA. Dev server runs on **port 5176**.

---

## One surface, two apps — the split that makes this app unusual

`/api/v1/portal/*` is gated `TenantRoleGuard(['STUDENT', 'PARENT'])` and serves **both** this app and [`apps/parent`](../parent). That is a deliberate exception to the repo's "one app per role-gated surface" default: the two audiences want different products (a learner sees _their_ schedule; a parent watches _their children's_), so they get different shells rather than one app full of role branches.

Consequences to respect:

- **This app is STUDENT-only.** Reject a session whose `user.roles` lacks `STUDENT`, even though the API would happily answer a PARENT here. The parent app owns the parent experience.
- **Never add the multi-child concepts** — `?studentId=`, `GET /children`, a child switcher. A student _is_ the subject; those belong to the parent app only.
- **Do not build a shared "portal" package** for the two apps without the engineer (root CLAUDE.md "stop and ask"). If real duplication appears, the answer is promotion to `@repo/ui` or `@repo/utils`, decided by the engineer — not a new package invented here.

---

## Status: shell only — do not build ahead of the API

**The backend has not implemented `/api/v1/portal/*`.** `cohort-be/src/api/` contains `manage`, `public`, `super-admin` and `teach` only; §5 of `cohort-be/docs/api-reference.md` is a **specification**, not shipped code.

- This app exists as a scaffold, approved by the engineer, so the shell is ready when the surface lands. It renders one placeholder route and makes **no network calls**.
- **Do not add features, api-client instances, or data hooks against §5 of the API reference.** Confirm each endpoint exists in `cohort-be/src/api/portal/` first (root CLAUDE.md: "don't build ahead of the API").
- **It is deployed anyway**, at `student.cohort.uz` / `student-dev.cohort.uz` (image `cohort-web-student`) — the hostname, cert and pipeline exist ahead of the product. What ships today is the placeholder, so treat any change here as publicly visible.

---

## Auth, session & tenancy (security-sensitive — see [docs/auth-and-rbac.md](../../docs/auth-and-rbac.md))

Nothing is wired yet. When it is:

- **Login** is the shared, role-agnostic `POST /public/auth/login` every console uses; the tenant is resolved by the backend from the user's single membership. Access token → memory (Zustand); refresh token → `localStorage` under a **student-scoped** key (`cohort.student.refreshToken`) — never reuse another app's key, and note the parent app is a sibling origin with its own.
- **Login is role-agnostic; this console is not.** Reject a session without `STUDENT` at login _and_ in the authed route guard (sessions restored via refresh skip the login path).
- **Do not change token handling, tenant resolution, or RBAC without the engineer** (root CLAUDE.md "stop and ask").

---

## Conventions quick-reference

- Import UI/utils/client from the `@repo/*` barrels only; the `@/` alias points at `src/`. Never deep-import a package, another feature's internals, or **anything from `apps/parent`** — apps never import apps.
- Components come from `@repo/ui` — no raw HTML `<button>`/`<input>`, no re-created primitives, no inline styles or hardcoded hex. Icons: `lucide-react` only. Forms: RHF + Zod + `@repo/ui` `Form`.
- **One component per file**, PascalCase; kebab-case dirs/non-component files; tabs for indentation; named exports.
- **All copy is localized.** Shell vocabulary comes from `@repo/i18n` via `useT()`; this app's screen copy lives in `src/locales/` (`uz` is the source of truth) and is reached with `useAppT()`.
- **Phone-first.** Students are on phones — every screen must work at 375px.
- **Theme**: light and dark, owned by `@repo/ui` (`initTheme` in `main.tsx`, storage key `cohort.student.theme`, mirrored by the pre-paint script in `index.html`). Never add app-local color tokens.
- Every async view handles loading / error / empty, not just success.
