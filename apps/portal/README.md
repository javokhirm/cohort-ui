# Portal Web App

The self-service console for **students and parents**. It will serve the
**`/api/v1/portal/*`** backend surface (plus `/api/v1/public/*` for auth) for the **STUDENT**
and **PARENT** roles.

> **Status: shell only.** The backend has not built the `/portal` surface yet
> (`cohort-be/src/api/` ships `manage`, `public`, `super-admin`, `teach`). This app is a
> scaffold so the shell exists when the API lands — it renders one placeholder page and
> makes **no** network calls.

## Run it

```bash
pnpm install          # from the repo root
cp .env.example .env  # already done if you cloned with the app
pnpm dev --filter portal
```

Dev server: <http://localhost:5176> (teacher runs on 5175, admin on 5174, internal-platform
on 5173).

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
   Scope the storage keys to `cohort.portal.*`.
2. Restore the boot gate in `App.tsx` so route guards see a settled session.
3. Add `/login`, `/forbidden` and a guarded layout route to `router.tsx`.
4. Add feature folders under `src/features/` named after the backend domains, and a
   namespace per feature in `src/locales/uz.ts` (then `ru`, `en`).

Deployment is **not** wired: the app is absent from `deploy/docker-compose.web.yml` and the
GitHub Actions build matrix on purpose — add it when there is something to ship.

See [CLAUDE.md](CLAUDE.md) for this app's conventions.
