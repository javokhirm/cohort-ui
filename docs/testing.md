# Testing

What to test, with what, and where. The goal is confidence per unit of maintenance — a small,
fast, reliable suite, not coverage theater.

---

## 1. The stack & the pyramid

| Level                   | Tool                                     | What it covers                                           |
| ----------------------- | ---------------------------------------- | -------------------------------------------------------- |
| Unit                    | **Vitest**                               | Pure logic: utils, formatters, schemas, reducers, hooks. |
| Component / integration | **Vitest + React Testing Library + MSW** | Components & feature screens with mocked network.        |
| End-to-end (few)        | **Playwright**                           | Critical user journeys against a running app + test API. |

Why Vitest (not Jest, which the backend uses): it shares Vite's transform pipeline, so there's
no second build config, and the API is Jest-compatible. The split from the backend's Jest is
acceptable and intentional.

**Most tests are component/integration with MSW.** That tier gives the best
confidence-to-effort ratio for a CRUD app: it exercises real components, real Query hooks, and
the real envelope/error mapping, with the network stubbed.

---

## 2. Network mocking with MSW

- MSW intercepts at the network layer, so tests drive the **real** `api-client` (envelope
  unwrap, `ApiError`, pagination) — not a mocked client.
- Handlers return the **real envelope shape** (`{ success, data, meta }` / failure with
  `error.code`). Keep a shared set of handlers and per-test overrides.
- Handlers live in `apps/staff/src/test/handlers/` (shared) and are typed against the
  generated OpenAPI schema so mocks can't drift from the contract.

```ts
// test/handlers/students.ts (shape)
http.get('*/api/v1/manage/students', () =>
	HttpResponse.json({
		success: true,
		data: [studentFixture()],
		meta: {
			timestamp: '2025-01-01T00:00:00+05:00',
			page: 1,
			limit: 20,
			total: 1,
			totalPages: 1,
		},
	}),
);
```

Use factory fixtures (a small `build()` per entity) rather than inline literals, mirroring the
backend's `fishery` factories.

---

## 3. What to test (and what not to)

**Do test:**

- Pure logic & money/date formatters (table-driven; include UZS + `Asia/Tashkent` cases).
- Zod schemas (valid + invalid inputs, including the backend's constraints).
- Feature behavior: list renders rows, filters update the URL and refetch, a form submits and
  shows success/field errors, a `403`/`401` is handled.
- Permission gating: `<Can>` shows/hides correctly; guarded routes redirect.
- The envelope/error mapping in `api-client` (unit).

**Don't test:**

- `packages/ui` primitives' internal behavior (that's Radix's job) — test _your_ composition.
- Implementation details (internal state, exact call counts). Assert on what the user sees.
- The backend. Contract trust comes from generated types + MSW, not by re-testing the API.

**Money/auth/payment flows are mandatory to cover** (unit + at least one integration), and a
critical-path E2E.

---

## 4. RTL guidelines

- Query by **role/label/text**, not test ids (add `data-testid` only as a last resort).
- Prefer `userEvent` over `fireEvent`.
- Wrap renders in a helper that provides the QueryClient, Router, I18n, and Auth providers
  (`renderWithProviders`). Give each test a fresh `QueryClient` (no shared cache).

---

## 5. E2E (Playwright) — keep it small

A handful of journeys, run in CI against a built app + a seeded test backend:

- **Auth:** login → land on dashboard → token refresh keeps the session → logout.
- **People:** create a student → appears in the list → edit → soft-delete.
- **Billing (when built):** create/issue an invoice → record a payment → status reflects.

E2E is for cross-cutting confidence, not breadth — breadth lives in the component tier.

---

## 6. Commands & gates

```bash
pnpm test            # vitest run (unit + component) across the workspace
pnpm test:watch      # vitest watch
pnpm test:e2e        # playwright (critical flows)
pnpm test --coverage # coverage report
```

CI runs `lint → typecheck → test → build` and the E2E job ([ci-cd.md](ci-cd.md)). A PR is not
mergeable with failing tests. New endpoint integration → new MSW handler + test
([api-integration.md](api-integration.md) §6).
