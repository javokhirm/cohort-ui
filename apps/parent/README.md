# Parent Web App

The self-service console for **guardians**. It will serve the **`/api/v1/portal/*`** backend
surface (plus `/api/v1/public/*` for auth) for the **PARENT** role.

> **Status: shell only.** The backend has not built the `/portal` surface yet
> (`cohort-be/src/api/` ships `manage`, `public`, `super-admin`, `teach`). This app is a
> scaffold so the shell exists when the API lands — it renders one placeholder page and
> makes **no** network calls.

`/api/v1/portal/*` serves **two** apps: this one and [`../student`](../student). One surface,
two shells — parents and students get different products, not one app branching on role. The
multi-child model (`GET /children`, `?studentId=`, a child switcher) lives here and only here.
See [CLAUDE.md](CLAUDE.md).

## Run it

```bash
pnpm install          # from the repo root
cp .env.example .env  # already done if you cloned with the app
pnpm dev --filter parent
```

Dev server: <http://localhost:5177> (student runs on 5176, teacher on 5175, admin on 5174,
internal-platform on 5173).

## What's here today

| Area   | Status                                                                       |
| ------ | ---------------------------------------------------------------------------- |
| Shell  | **Wired** — Vite + Tailwind, `@repo/ui` theme, i18n (uz/ru/en), Query client |
| Router | **Wired** — TanStack Router with a single `/` route                          |
| Home   | Placeholder — an `EmptyState`, pending the `/portal` surface                 |
| Auth   | **Not built** — no login, no session store, no token storage                 |
| API    | **Not built** — no api-client instance; the `/portal` surface does not exist |

## Adding the first real screen

When `/api/v1/portal/*` ships, follow the teacher app — it is the closest sibling (one
role-gated surface, phone-first, no `<Can>` gating):

1. Copy the auth slice from `apps/teacher` (`api/apiClient.ts`, `store/sessionStore.ts`,
   `lib/auth/*`, `features/auth/*`) and point the authed client at `${apiBase}/portal`.
   Scope the storage keys to `cohort.parent.*`.
2. Restore the boot gate in `App.tsx` so route guards see a settled session.
3. Add `/login`, `/forbidden` and a guarded layout route to `router.tsx`, rejecting any
   session without `PARENT`.
4. Add feature folders under `src/features/` named after the backend domains, and a
   namespace per feature in `src/locales/uz.ts` (then `ru`, `en`).
5. Put the selected child in Zustand and in **every** query key that sends `?studentId=` —
   leaving it out serves one child's data from another child's cache entry.

## Deployment

Image `cohort-web-parent`, served at `parent.cohort.uz` (prod, from `main`) and
`parent-dev.cohort.uz` (dev, from `dev`). See [../../deploy/README.md](../../deploy/README.md).
The placeholder page is what ships until the first real screen lands, so the hostname is live
before the product is.

See [CLAUDE.md](CLAUDE.md) for this app's conventions.
