# CLAUDE.md — `apps/student`

App-specific guidance for the **Student Web App**. The repo-root [CLAUDE.md](../../CLAUDE.md) and everything under [docs/](../../docs) are authoritative and apply here in full — read the relevant doc before working in an area. This file records only what is **specific to this app**.

The student app is the self-service console for **learners**. It targets the **`/api/v1/student/*`** surface (plus `/api/v1/public/*` for auth), for the single role **STUDENT**. React 19 + Vite SPA. Dev server runs on **port 5176**.

---

## The surface superseded `/portal` — this app is student-only

`cohort-be/docs/api-reference.md` §5 originally speced a shared `/api/v1/portal/*` surface gated `TenantRoleGuard(['STUDENT', 'PARENT'])`. What shipped instead is `/api/v1/student/*` (`cohort-be/src/api/student/`), gated `TenantRoleGuard(['STUDENT'])` only — see that module's own docblock for the rationale. Consequences:

- **This app is STUDENT-only**, at the API level, not just by convention. There is no `PARENT` role on this surface to reject.
- **There are no multi-child concepts** — no `?studentId=`, no `GET /children`, no child switcher. A student _is_ the subject.
- [`apps/parent`](../parent) is a separate, still-unbuilt scaffold targeting `/api/v1/portal/*` for the `PARENT` role, whenever that surface is built. It is a sibling, not a dependency — never import from it.
- **Do not build a shared "portal" package** for the two apps without the engineer (root CLAUDE.md "stop and ask"). If real duplication appears, the answer is promotion to `@repo/ui` or `@repo/utils`, decided by the engineer — not a new package invented here.

---

## Auth, session & tenancy (security-sensitive — see [docs/auth-and-rbac.md](../../docs/auth-and-rbac.md))

- **Login** is a **dedicated** `POST /public/auth/student/login` — student code + password, not the shared phone-based `/auth/login` the staff consoles use (many students share a guardian's phone number, so the code is what the center prints and hands them). Refresh (`POST /public/auth/refresh`) is the shared endpoint every console uses. The tenant is resolved by the backend from the user's single membership. Access token → memory (Zustand); refresh token → `localStorage` under a **student-scoped** key (`cohort.student.refreshToken`) — never reuse another app's key.
- **This endpoint is student-only by contract** — it always returns `roles: ["STUDENT"]` (unlike the shared `/auth/login`, which is role-agnostic). Unlike `apps/teacher`/`apps/admin`, `useLogin()` does **not** re-check the role after login — there's no mismatch to guard against once the endpoint itself only ever authenticates students. `requireRole(['STUDENT'])` still guards the authed route for sessions restored via refresh.
- **The sign-in UI is NOT the shared `@repo/ui` `LoginCard`.** That component is phone-only (built for the staff consoles' `PhoneInput`); the student credential is a student code, a plain text field with its own shape (`STUDENT_CODE_REGEX` in `features/auth/schemas.ts`). This app owns its own `LoginForm` composed from `@repo/ui` primitives (`Form`, `FieldGroup`, `FormInput`, `FormPasswordInput`, `Alert`, `Button`) instead of forcing the shared card's phone shape.
- **There is no `/student/me` boot fetch.** `StudentApi()` mirrors `TeachApi()` exactly: the signed-in student's identity comes **only** from the `user` summary on the login/refresh response (`id`, `firstName`, `lastName`, `roles`, `branchScope`, `preferredLanguage`) — do not add a profile fetch on boot. `GET /student/me` is read in exactly one place, `features/profile` (contact fields, student code, branch, center), and the shell's one call to it is **route-scoped** (`useMe({ enabled: pathname === '/profile' })`, for the Profile app bar's subtitle) sharing that same cache entry — keep it that way rather than letting it become a boot fetch.
- **`PATCH /student/me` accepts `phone`, `email`, `avatarUrl` and `preferredLanguage`.** Unlike the teacher/admin `/me` endpoints, `phone` is writable here — it is not this role's login identifier (students authenticate with `studentCode`), so there's no auth-identity reason to keep it operator-only. Both `phone` and `email` are required-not-optional in `features/profile/schemas.ts`: the endpoint has no way to _clear_ either (`phone` isn't nullable on the backend's `UpdateIdentityInput`; `email`'s validator rejects `''`), so an emptied field is a client-side validation error, not a request. A phone already in use by another user comes back `409 USER_PHONE_ALREADY_EXISTS`. `preferredLanguage` is written solely by `useLocalePreference`; `features/profile/api/profile.mutations.ts` owns the phone/email write. Never widen either without the engineer.
- **The student surface is gated by role only** — it carries no permission codes (`SystemRole.STUDENT` has an empty permission set). Gate with `hasRole()` / `requireRole()`; there is no `requirePermission` / `<Can>` here, and the session store holds no `permissions`.
- **No branch selector.** A student has exactly one branch (on their `/student/me` profile, not on the login session); there is no multi-branch concept to pick between, unlike the staff consoles.
- **Silent refresh**: `runRefresh()` in `api/apiClient.ts` is both the boot check and the `studentApi` 401 hook (single-flight lives inside `@repo/api-client`).
- **Do not change token handling, tenant resolution, or RBAC without the engineer** (root CLAUDE.md "stop and ask").

---

## Shell & responsiveness

- The shell is composed from `@repo/ui` shell primitives — **`AppSidebar`, `AppTopbar`, `BottomTabBar`**. Do not hand-roll nav chrome; extend the primitives in `@repo/ui` instead (that's where `AppTopbar`'s `trailing` slot and `BottomTabBar`'s `showActiveIndicator` came from — both opt-in, so the other consoles' chrome is unchanged).
- **One nav list drives both chromes.** `layouts/nav.ts` is the single source: the desktop sidebar (`md:` and up) and the mobile bottom tabs render from it, so they cannot drift. It holds the four tabbed destinations — Home, Schedule, Progress, Billing. `/inbox` and `/profile` are deliberately **not** tabs: the app bar's bell and account menu reach them, and `BAR_COPY` (same file) supplies their app-bar titles.
- **Identity lives in the app bar's trailing account menu (`layouts/UserMenu.tsx`), on every screen.** It holds the page title/subtitle, the bell, and — in the trailing slot — the `UserMenu`: an avatar (avatar-only below `md`, avatar + name + role from `md` up), whose dropdown carries the profile link, the language switch and sign-out. Because the app bar is shown on both chromes, the **desktop sidebar carries no identity footer** (`AppSidebar` is rendered without a `user` prop) — identity is not duplicated. The **Profile screen** still owns the theme switch, language select and sign-out too (it is a full settings surface, not the only route to them); keep sign-out reachable there even in Profile's loading and error states.
- **Home has no page heading.** The greeting and today's date are the app bar's title and subtitle (`authed-layout.tsx`), not markup inside `routes/home.tsx`.
- **Phone-first.** Students are on phones — every screen must work at 375px.
- **Theme**: light and dark, owned by `@repo/ui` (`initTheme` in `main.tsx`, storage key `cohort.student.theme`, mirrored by the pre-paint script in `index.html`). Never add app-local color tokens. There is no `<ThemeToggle />` in this app's chrome — the design puts that control on the Profile screen.

---

## Login is not shared

Unlike `admin`/`teacher` (which both render the shared `@repo/ui` `LoginCard`), this app has its own `LoginForm` (`features/auth/components/LoginForm.tsx`) because the student credential — a student code — doesn't fit that card's phone-only field. Change the visual here, not in `@repo/ui`.

---

## Conventions quick-reference

- Import UI/utils/client from the `@repo/*` barrels only; the `@/` alias points at `src/`. Never deep-import a package, another feature's internals, or **anything from `apps/parent`** — apps never import apps.
- Components come from `@repo/ui` — no raw HTML `<button>`/`<input>`, no re-created primitives, no inline styles or hardcoded hex. Icons: `lucide-react` only. Forms: RHF + Zod + `@repo/ui` `Form`.
- **One component per file**, PascalCase; kebab-case dirs/non-component files; tabs for indentation; named exports.
- **All copy is localized.** Shell vocabulary comes from `@repo/i18n` via `useT()`; this app's screen copy lives in `src/locales/` (`uz` is the source of truth) and is reached with `useAppT()`.
- Every async view handles loading / error / empty, not just success.
