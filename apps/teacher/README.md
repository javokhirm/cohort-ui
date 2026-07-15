# Teacher Web App

The classroom console for teaching staff. Serves the **`/api/v1/teach/*`** backend surface
(plus `/api/v1/public/*` for auth) for the **TEACHER** role.

Mobile-first: teachers take attendance on a phone, so the shell renders a bottom tab bar
below `md` and a sidebar above it.

## Run it

```bash
pnpm install          # from the repo root
cp .env.example .env  # already done if you cloned with the app
pnpm dev --filter teacher
```

Dev server: <http://localhost:5175> (admin runs on 5174, internal-platform on 5173).
Requires the `cohort-be` API on `http://localhost:5050`.

## What's here today

| Area    | Status                                                                   |
| ------- | ------------------------------------------------------------------------ |
| Login   | **Wired** — phone + password → `POST /public/auth/login`, silent refresh |
| Shell   | **Wired** — sidebar (desktop) / bottom tabs (mobile), light + dark theme |
| Today   | Placeholder — pending `GET /teach/sessions`                              |
| Groups  | Placeholder — pending `GET /teach/groups`                                |
| Profile | **Wired** — renders the session user (there is no `/teach/me`)           |

The sign-in card is `LoginCard` from `@repo/ui`, shared with the admin console.

See [CLAUDE.md](CLAUDE.md) for the app's conventions and its auth constraints.
