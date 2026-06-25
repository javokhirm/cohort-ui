# Contributing & Development Workflow

How we work day to day. Read [CLAUDE.md](../CLAUDE.md) and the architecture/conventions docs
first; this doc is the process around them.

---

## 1. Prerequisites

- **Node** — the version in `.nvmrc` (`nvm use`).
- **pnpm** — the package manager (`corepack enable` to get the pinned version).
- A running **educore-be** (local at `http://localhost:5050`) or access to a shared dev API.

```bash
pnpm install
cp apps/staff/.env.example apps/staff/.env   # fill in VITE_API_ORIGIN, etc.
pnpm gen:api                                  # generate API types from the backend spec
pnpm dev                                       # http://zabon.localhost:5173
```

See [environments.md](environments.md) for local multi-tenant setup.

---

## 2. Day-to-day commands

```bash
pnpm dev               # run the staff app (HMR)
pnpm --filter staff dev
pnpm lint              # eslint
pnpm typecheck         # tsc --noEmit
pnpm test              # vitest (unit + component)
pnpm test:watch        # vitest in watch mode
pnpm format            # prettier --write
pnpm build             # turbo build (cached)
pnpm gen:api           # refresh OpenAPI types after a backend contract change
```

---

## 3. Branching & commits

- Branch off `main`: `feat/<area>-<short-desc>`, `fix/...`, `chore/...`, `docs/...`.
- **Conventional Commits**: `feat(people): add student create form`,
  `fix(billing): correct UZS rounding in invoice total`. Scope = the feature or package.
- Keep commits focused; keep PRs small and single-purpose.

---

## 4. Pull requests

A PR should:
- Be scoped to one feature/fix and stay reviewable.
- Pass all CI gates (lint, typecheck, test, build).
- Include tests and (for new endpoints) MSW handlers.
- Update docs when behavior, conventions, or structure change.
- Get a **second reviewer** when it touches auth, tenancy, money/billing/payroll, package
  boundaries, or dependencies (CODEOWNERS routes these automatically).

### Review checklist (author self-checks; reviewer verifies)

- [ ] Follows the layering & barrel rules ([architecture.md](architecture.md)); no boundary
      violation, no deep import.
- [ ] No `fetch` in components; data via feature Query hooks on `api-client`.
- [ ] Server state in Query, client state in Zustand, view state in URL search params.
- [ ] No hand-written API types; `pnpm gen:api` run if the contract changed.
- [ ] Loading / error / empty states handled.
- [ ] All user-facing text translated in uz/ru/en; money/dates via shared formatters.
- [ ] Tests added/updated and green; MSW handler for any new endpoint.
- [ ] No new dependency without explicit approval.
- [ ] Money/auth/payment change → second reviewer + extra care.
- [ ] Accessibility not regressed (labels, roles, focus).

---

## 5. Adding things — quick recipes

| Task                         | Steps                                                                                  |
| ---------------------------- | -------------------------------------------------------------------------------------- |
| New screen                   | route in `routes/` → screen in `features/<domain>/screens/` → wire nav + guard.        |
| New endpoint integration     | `gen:api` → keys → query/mutation hook → MSW handler + test → consume. ([api-integration.md](api-integration.md) §6) |
| New form                     | Zod schema in `schemas/` → RHF + `<Form/>` → map server field errors. ([conventions.md](conventions.md) §6) |
| New shared UI component      | discuss → add to `packages/ui` (presentational only) → add a usage/render test.         |
| New shared package           | **stop and ask the engineer** — it's an architecture change.                           |
| New dependency               | **stop and ask the engineer.**                                                         |
| New app (teacher/portal/...) | follow the evolution path in [architecture.md](architecture.md) §6 — with the engineer. |

---

## 6. Working with AI agents

This repo is set up so AI agents can contribute safely:
- The agent must **read the relevant `docs/` first** (CLAUDE.md enforces this).
- The same gates apply: conventions, tests, no new deps, no boundary breaks, no invented
  contract.
- The agent **stops and asks** on the triggers in CLAUDE.md (auth, tenancy, money, boundaries,
  dependencies, ambiguity) rather than guessing.
- Generated/`*.d.ts` API types are never hand-edited — regenerate.

---

## 7. Getting help

- Architecture/convention questions → the relevant `docs/` file, then the area owner
  (`.github/CODEOWNERS`).
- API contract questions → `educore-be/docs/api-reference.md`, then the backend team.
