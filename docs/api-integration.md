# API Integration

How the frontend talks to **cohort-be**. This is the layer where contract fidelity matters
most — get it right and the rest of the app inherits type-safety for free.

The backend contract this doc encodes is authoritative in `cohort-be/docs/api-reference.md`.
When they disagree, the backend doc wins — update this and regenerate types.

---

## 1. The contract, in brief

- **Base URL:** `<api-origin>/api/v1`. Surfaces are path prefixes: `/public`, `/manage`,
  `/teach`, `/portal`, `/admin`. The staff app uses `/public` (auth) + `/manage`.
- **Tenant:** resolved by the backend from the request **subdomain** (Host header),
  cross-checked against the JWT `tenantId`. The frontend does not send a tenant id; it just
  runs on the tenant's subdomain. (See [auth-and-rbac.md](auth-and-rbac.md).)
- **Auth:** `Authorization: Bearer <accessToken>` on every authenticated request.
- **Response envelope (every response):**

    ```jsonc
    // success (single resource)
    { "success": true, "data": { /* T */ }, "meta": { "timestamp": "2025-03-15T10:30:00+05:00" } }

    // success (list) — pagination fields added to meta
    { "success": true, "data": [ /* T[] */ ],
      "meta": { "timestamp": "...", "page": 1, "limit": 20, "total": 137, "totalPages": 7 } }

    // failure
    { "success": false,
      "error": { "code": "INVOICE_ALREADY_VOID", "message": "…", "details": { } },
      "meta": { "timestamp": "..." } }
    ```

- **Pagination (offset):** request `?page=<1-based>&limit=<≤100>` (default `page=1`,
  `limit=20`, hard max `100`). Totals come back in `meta`.
- **204 No Content** for deletes — an **empty body** (no envelope). The client normalizes
  this to `null` for the caller; don't expect an envelope on a 204.
- **Validation errors** arrive as a failure envelope; field detail (when present) is in
  `error.details`.

---

## 2. Type generation (`openapi-typescript`)

We **generate types, not clients**. The backend exposes the OpenAPI document (Swagger UI at
`/api-docs`, JSON at `/api-docs-json`). `pnpm gen:api` runs `openapi-typescript` against it
and writes `packages/api-client/src/generated/schema.d.ts`.

```bash
# packages/api-client — gen:api script (illustrative)
openapi-typescript http://localhost:5050/api-docs-json -o src/generated/schema.d.ts
# or against a committed spec file for reproducible CI builds:
openapi-typescript ./openapi.json -o src/generated/schema.d.ts
```

Rules:

- **Never hand-edit `generated/`.** Regenerate. The file is committed so CI/typecheck don't
  need a running backend, but it is owned by the generator.
- Prefer generating from a **committed `openapi.json`** snapshot (updated via `gen:api`
  against a running backend) so builds are reproducible and contract changes show up as a
  reviewable diff.
- A contract change → regenerate → the compiler shows you every call site that must change.
  That red is the feature, not a nuisance.

We generate **types**, then hand-write thin Query hooks (decision: control + readability over
full codegen like Orval). The generated types make the hooks fully typed without the opaque
generated hook layer.

> **Trade-off (be honest about it):** hand-written hooks are per-endpoint boilerplate — a
> key + a query/mutation + an MSW handler each (see §6). We accept that for readability and
> control on a moderate API. **Revisit trigger:** if the endpoint count grows enough that the
> boilerplate dominates, switch the data layer to full codegen (Orval) — the generated types
> and query-key conventions already make that a contained change.

---

## 3. The typed client (`packages/api-client`)

A small wrapper (built on `openapi-fetch`, which consumes the generated `schema.d.ts`) that:

1. prefixes the surface base URL,
2. attaches the `Authorization` header from an **injected token getter** (so `api-client`
   never imports `auth` — keeps the dependency one-way),
3. **unwraps the envelope** — returns `data` on success (and `null` for a 204),
4. **normalizes errors** — throws a typed `ApiError` carrying `code`, `message`, `details`,
   `status`,
5. runs the **401 → refresh → retry** hook (the refresh implementation is injected by
   `auth`; single-flight so concurrent 401s share one refresh).

```ts
// packages/api-client — shape (illustrative)
export interface ApiClientOptions {
	baseUrl: string; // e.g. `${env.apiOrigin}/api/v1/manage`
	getAccessToken: () => string | null; // injected by auth
	onUnauthorized: () => Promise<boolean>; // injected by auth: refresh; true = retry
}

export class ApiError extends Error {
	constructor(
		readonly code: string,
		message: string,
		readonly status: number,
		readonly details?: Record<string, unknown>,
	) {
		super(message);
	}
}

export function createApiClient(opts: ApiClientOptions) {
	/* ...openapi-fetch + middleware... */
}
```

The app wires one client per surface in `apps/staff/src/lib/api.ts` and passes the token
getter / refresh function from `packages/auth`.

### Pagination helper

```ts
export interface PaginatedResult<T> {
	rows: T[];
	page: number;
	limit: number;
	total: number;
	totalPages: number;
}
// the client maps a list envelope { data, meta:{page,limit,total,totalPages} } → PaginatedResult<T>
```

List **filters live in the URL** search params (TanStack Router) and are passed straight
through to the query string — see [auth-and-rbac.md](auth-and-rbac.md) for why state-in-URL,
and [conventions.md](conventions.md) for the filter/sort param names.

### Responses are not runtime-validated

The client trusts the **generated OpenAPI types** for response shapes — it does **not** run
Zod (or any schema) over responses at runtime. Contract correctness stays honest via two
cheap mechanisms: regenerating types on every contract change, and MSW handlers typed against
the same schema (so mocks can't drift). This is deliberate — runtime-validating every
response would duplicate the generated types for little gain. If a _specific_ response is
high-risk (money/auth), you may Zod-parse it at that one call site; that's opt-in, not a
blanket layer. (Zod's job here is **forms, env, and client-side parsing** — not API
responses.)

---

## 4. Query & mutation hooks (in features, not packages)

Surface-specific hooks live in `apps/staff/src/features/<domain>/api/`. They are the **only**
thing components use to reach the network. `api-client` provides the typed client + helpers;
the hooks provide the React Query bindings.

### Query keys — one factory per domain

```ts
// features/people/api/keys.ts
export const peopleKeys = {
	all: ['people'] as const,
	students: () => [...peopleKeys.all, 'students'] as const,
	studentList: (filters: StudentListFilters) =>
		[...peopleKeys.students(), 'list', filters] as const,
	student: (id: number) => [...peopleKeys.students(), 'detail', id] as const,
};
```

Rules: keys are **structured arrays**, derived from a factory (never inline string keys);
list keys include the full filter object so each filter combination caches independently.

### A list query

```ts
// features/people/api/students.queries.ts
export function useStudents(filters: StudentListFilters) {
	return useQuery({
		queryKey: peopleKeys.studentList(filters),
		queryFn: () => api.GET('/students', { params: { query: filters } }), // typed by generated schema
		placeholderData: keepPreviousData, // smooth pagination
	});
}
```

### A mutation with cache invalidation

```ts
// features/people/api/students.mutations.ts
export function useCreateStudent() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (input: CreateStudentInput) => api.POST('/students', { body: input }),
		onSuccess: () => qc.invalidateQueries({ queryKey: peopleKeys.students() }),
	});
}
```

- **Invalidate, don't manually rewrite the cache**, unless you have a measured reason.
- **Optimistic updates** are allowed for low-risk, high-frequency actions (e.g. toggling a
  flag). **Never optimistic for money** (invoices, payments, payroll, discounts) — wait for
  the server and reflect its returned state.
- IDs are **integers** (the backend never uses UUIDs); type them as `number`.

---

## 5. Error handling

- The client throws `ApiError`; React Query surfaces it as `error`.
- Map `error.code` to a localized, user-facing message via `packages/i18n` (the backend's
  codes are stable identifiers, e.g. `INVOICE_ALREADY_VOID`). Fall back to `error.message`.
- A global handler (in `lib/query-client.ts`) handles cross-cutting cases: `401` after a
  failed refresh → log out + redirect to `/login`; `403` → a "not permitted" toast; `5xx` →
  a generic error toast + Sentry/log.
- **Field-level form errors:** if `error.details` carries per-field messages, map them onto
  the React Hook Form fields via `setError`. See [conventions.md](conventions.md).

---

## 6. Adding a new endpoint integration — checklist

1. Confirm the endpoint in `cohort-be/docs/api-reference.md` (path, params, DTO, status).
2. `pnpm gen:api` to refresh types (regenerate the committed spec if needed).
3. Add/extend the domain's `keys.ts`.
4. Write the query/mutation hook in `features/<domain>/api/`.
5. Add an MSW handler in `src/test/handlers/` and a test ([testing.md](testing.md)).
6. Consume the hook from a screen/component — no `fetch` in components.
