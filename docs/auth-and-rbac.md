# Authentication, Tenancy & RBAC

Everything about identity in the frontend: how a tenant is determined, how tokens are
obtained/stored/refreshed, and how the UI gates on roles and permissions. This area is
security-sensitive — **changes need a second reviewer** and must match the backend
(`cohort-be/docs/api-reference.md` §1.1 and the identity domain).

All of this lives in `packages/auth`. Apps consume `useAuth()`, `usePermissions()`, `<Can>`,
and the route guards.

---

## 1. Multi-tenancy = membership

- Every frontend is served from **one fixed host** per app: the staff console at
  `staff.cohort.uz`, the super-admin console at `admin.cohort.uz`.
- **A user belongs to exactly one tenant.** The client never sends (or knows about) a
  tenant id at login — the backend resolves the tenant from the user's single ACTIVE
  membership and embeds it in the JWT `tenantId` claim; every later request is scoped by
  that claim.
- **One build serves all tenants.** Never put a tenant in an env var or the bundle. The
  tenant identity is a post-login fact, not a deploy-time or host-derived one.
- **Local dev:** plain `localhost` — no host tricks needed. See
  [environments.md](environments.md).

---

## 2. The token model (matches the backend)

| Token         | Lifetime | Carries                                   | Where the backend puts it |
| ------------- | -------- | ----------------------------------------- | ------------------------- |
| access token  | 15m      | `{ sub, tenantId, roles[], branchScope }` | login/refresh JSON body   |
| refresh token | 7d       | `{ sub, tenantId }` (minimal; no authz)   | login/refresh JSON body   |

- **Permissions are NOT in the token.** The access token carries **role names** and
  `branchScope` only; fine-grained permissions are resolved server-side. The UI derives
  what it can from roles — see §5.
- `branchScope`: `null` = all branches; `[ids]` = restricted to those branch ids; `[]` =
  none (edge case).
- The login/refresh response also returns a `user` summary:
  `{ id, firstName, lastName, roles[], branchScope }` — use it for the header/profile.

### Endpoints

```
POST /api/v1/public/auth/login           { phone, password }          → AuthResult
POST /api/v1/public/auth/refresh         { refreshToken }             → AuthResult   (token in the BODY)
POST /api/v1/public/auth/forgot-password { phone }                    → 200 (always; no enumeration)
POST /api/v1/public/auth/reset-password  { phone, otp, newPassword }  → 200

// AuthResult = { accessToken, refreshToken, expiresIn /* seconds */, user }
```

> The refresh token is sent in the **JSON body** as `refreshToken` (the backend extracts it
> from the body, not the `Authorization` header). Login authenticates with `phone` +
> `password`; the tenant is derived server-side from the user's single membership.

---

## 3. Token storage (confirmed decision)

> **Access token → in memory** (Zustand session store). **Refresh token → `localStorage`.**

Rationale and the explicit trade-off:

- Works with the current API (tokens in the JSON body, Bearer scheme) — **no backend change
  needed**.
- Survives reloads/new tabs (good UX for a daily-use back-office) via the persisted refresh
  token + silent refresh.
- **Trade-off:** a successful XSS can read the refresh token from `localStorage`. We mitigate
  with a strict Content-Security-Policy, dependency hygiene, no `dangerouslySetInnerHTML` with
  untrusted input, and keeping the access token out of persistent storage. (CSP is delivered
  as static-host response headers — see [ci-cd.md](ci-cd.md) §3 hosting. If no policy is
  configured yet, treat "strict CSP" as a TODO, not a given.)

**Hardening path (when the backend can coordinate):** move the refresh token to an
`httpOnly; Secure; SameSite=Strict` cookie set by the backend, add CSRF protection, and have
the client call refresh with credentials. This is a backend change — until then, the above is
the standard. Do not change storage strategy without the engineer (CLAUDE.md "stop and ask").

```ts
// packages/auth/src/session-store.ts (shape)
interface SessionState {
	accessToken: string | null; // memory only
	user: AuthUserSummary | null;
	status: 'unknown' | 'authenticated' | 'anonymous';
	setSession(r: AuthResult): void; // stores access in memory, refresh via token-storage
	clear(): void;
}
```

---

## 4. Silent refresh

A single-flight refresh keeps sessions alive without bouncing the user to login:

- **On app boot:** if a refresh token exists, call `/auth/refresh` (token in the body) before
  rendering the authed area; success → authenticated, failure → clear + anonymous.
- **On `401`:** the `api-client` calls the injected `onUnauthorized()` (provided by `auth`),
  which refreshes **once** even under many concurrent 401s (requests queue and replay after a
  single refresh). A failed refresh → clear session → redirect to `/login`.
- **Proactive (optional):** schedule a refresh shortly before `expiresIn` elapses.

`auth` owns this; `api-client` only calls the injected hook. This is the one allowed
direction: `auth → api-client` (never the reverse).

---

## 5. Roles & permissions in the UI

The backend has system roles `OWNER, ADMIN, MANAGER, TEACHER, STUDENT, PARENT, SUPER_ADMIN`
(tenants may add custom roles — **don't assume the role set is closed**) and a stable catalog
of permission codes (e.g. `student.create`, `invoice.void`, `attendance.mark`,
`payroll.approve`, …).

> **Reminder:** UI gating is **cosmetic**. The server enforces every rule; the UI must handle
> a `403` gracefully ([api-integration.md](api-integration.md) §5). Gating only improves UX by
> hiding what the user can't do.

### Today: gate by role (the default mechanism)

Roles are in the access token, so role-based gating works **now** and is the default. Use
`<Can>` (renders children only when the check passes; optional `fallback`) and `hasRole`:

```tsx
const { user, hasRole } = useAuth();

<Can role={['OWNER', 'ADMIN']}>
	<PayrollNavItem />
</Can>;

if (!hasRole(['OWNER', 'ADMIN'])) {
	/* hide the action */
}
```

### Later: permission-based gating — NOT YET (blocked on the backend)

Fine-grained gating by permission code — `<Can permission="invoice.void">`,
`usePermissions().can(...)`, `requirePermission(...)`, and a mirrored `PERMISSION` catalog in
`packages/auth` — is the intended end state. But **today the access token carries no
permission codes and there is no endpoint that returns the resolved set.** (The backend's
existing `GET /api/v1/portal/me` is a portal-scoped _profile_, not resolved permissions — they
are different things.)

- **Recommended backend addition:** `GET /api/v1/manage/me` returning the session's resolved
  permission codes; fetch it on boot into the session store.
- **Until it ships: do not build permission-code gates** — gate by role. When the endpoint
  lands, the `permission=` path activates without changing how call sites are written.

This follows the repo rule: don't build ahead of the API.

---

## 6. Branch scope

- The backend derives a **surface-specific branch scope** for staff users: `GET
/manage/branches` returns only the branches the user can access with a back-office
  role (OWNER/ADMIN/MANAGER; a tenant-wide assignment grants all). The UI never
  computes access from the token's `branchScope` claim — the branches endpoint is
  the source of truth for the selector.
- The **active branch selection** is a client-state value (Zustand branch store,
  persisted to `localStorage` under `cohort.staff.activeBranchIds`) shown in a
  global header **branch selector**. It is **multi-select**: the user can view one
  branch, several, or all accessible branches at once.
- Every list query injects the selection as `?branchIds=<id>,<id>` through its
  query filters (so it's part of the query key — changing the selection refetches).
  Selecting _all_ accessible branches sends no `branchIds` param; the backend
  auto-narrows to the user's scope. An id outside the scope → 403
  `BRANCH_FORBIDDEN`.
- A single-branch user has no selector; the active branch is fixed.
- On boot the persisted selection is reconciled against the freshly fetched
  branches; ids that are no longer accessible are dropped (falling back to "all").
- Create/edit forms default their `branchId` field to the active branch when
  exactly one branch is selected; otherwise the user picks explicitly.

---

## 7. Route protection (TanStack Router)

- A public route group (`/login`, password reset) renders without a session.
- An `_authed` layout route guards everything else: in `beforeLoad`, if `status !==
'authenticated'` (after boot refresh resolves), redirect to `/login` preserving the intended
  destination.
- Role requirements can be attached per-route via the guard helpers
  (`requireRole(['OWNER','ADMIN'])`), redirecting or rendering a "not permitted" screen on
  failure — cosmetic; the API enforces. (`requirePermission(...)` is added when the
  resolved-permissions endpoint exists — see §5.)

```ts
// route-guards.ts (shape)
export const requireAuth = (location) => {
	if (!isAuthed()) throw redirect({ to: '/login', search: { next: location.href } });
};
export const requireRole = (roles: string[]) => () => {
	if (!hasRole(roles)) throw redirect({ to: '/forbidden' });
};
// requirePermission(code) — added when GET /manage/me (resolved permissions) exists (§5)
```

---

## 8. Login → app, end to end

1. User lands on `staff.cohort.uz` → boot refresh runs; no token → `/login`.
2. Login form posts `{ phone, password }` to `/public/auth/login` (the backend resolves the
   tenant from the user's single membership).
3. On success: store access (memory) + refresh (localStorage) + `user`; redirect to `next`
   or the dashboard.
4. Header shows product branding + (if multi-branch) the branch switcher; nav is filtered by
   role.
5. Requests carry the Bearer access token; a `401` triggers one silent refresh (refresh token
   in the body) + replay.
6. Logout clears the session store + refresh token and redirects to `/login`.
