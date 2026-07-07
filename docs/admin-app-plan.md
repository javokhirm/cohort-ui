# Super Admin (ADMIN) App — Development Plan

A phased plan for the platform **Super Admin** app (`/api/v1/admin/*`, role `SUPER_ADMIN`).
Source of the UI: the `Cohort ADMIN` claude.ai/design prototype (see the project memory for
the project id). This plan follows the repo rules in [architecture.md](architecture.md),
[auth-and-rbac.md](auth-and-rbac.md), [api-integration.md](api-integration.md), and
[folder-structure.md](folder-structure.md), and the working agreement in `CLAUDE.md`.

---

## 0. Gating reality — read first

- The committed OpenAPI spec (`packages/api-client/openapi.json`) currently exposes only
  **`/public`** (3 auth paths) and **`/manage`** (25 paths). **There is no `/api/v1/admin/*`
  surface yet.**
- The roadmap (`cohort-be` `project-overview.md` §10) places the Super Admin panel in
  **Phase 4**, after the current Staff (Phase 1) work.
- Per `CLAUDE.md`: _"Don't build ahead of the API."_ → **No ADMIN feature code until its
  backend endpoints exist.** What we build now is the **shared foundation** (justified because
  the Staff app needs it today); ADMIN then becomes mostly composition.

Each phase below (A–D) is **gated on its backend `/api/v1/admin/*` endpoints shipping** —
confirm against `cohort-be/docs/api-reference.md`, then `pnpm gen:api`.

---

## 1. Decisions required before ADMIN starts (CLAUDE.md "stop and ask")

| #   | Decision                 | Why                                                                                                                                                                                                                                                                                                                                                                                                |
| --- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Admin auth model**     | The design diverges from the tenant model in [auth-and-rbac.md](auth-and-rbac.md): work-email login, **Google Workspace SSO + 2FA**, **no tenant subdomain** (platform-wide), **SUPER_ADMIN**, **BYPASSRLS**, and **impersonation**. `packages/auth` today is tenant-centric (subdomain→tenant, phone+password, branchScope). Security-sensitive **and** needs backend endpoints that don't exist. |
| 2   | **New app `apps/admin`** | Adding an app is an architectural change ([architecture.md](architecture.md) §5).                                                                                                                                                                                                                                                                                                                  |
| 3   | **Charts dependency**    | ADMIN + Staff dashboards need line/bar/sparkline charts → a new dep (e.g. `recharts`).                                                                                                                                                                                                                                                                                                             |
| 4   | **Shell sharing**        | Whether sidebar/topbar become shared `ui` primitives or stay app-local.                                                                                                                                                                                                                                                                                                                            |

---

## 2. DRY — shared vs. ADMIN-specific components

**Already shared & built** (`packages/ui`, ADMIN reuses as-is): Button, Input, Textarea,
Label, Card, Badge, **StatusBadge** (includes the `tenant` map active/trialing/past_due/
suspended/cancelled and `system` healthy/degraded/down), **StatCard** (MRR/tenant/churn KPIs),
Dialog, Sheet, DropdownMenu, Popover, Select, Checkbox, RadioGroup, Switch, Tabs, Table,
Tooltip, Toaster, EmptyState, PageHeader, Spinner, Skeleton, Separator, Avatar, Alert.

**Should be shared — build for Staff now, ADMIN inherits free:**

| Component                             | Consumers                                             | Notes                                                                                                                |
| ------------------------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **Form / FieldGroup** (RHF-aware)     | every app/form                                        | `CLAUDE.md` mandates `FieldGroup + RHF + Zod`; `packages/ui/form.tsx` is in the planned layout. **(building first)** |
| **DataTable + Pagination**            | ADMIN (tenants/users/subs), Staff (students/invoices) | sortable, paginated, row actions, selection, loading/empty. Highest-leverage DRY win.                                |
| **ConfirmDialog** (+ type-to-confirm) | ADMIN (suspend/cancel), Staff (void/delete)           | one component, two modes.                                                                                            |
| **CommandPalette (⌘K)**               | ADMIN + MANAGE                                        | identical pattern in both designs.                                                                                   |
| **Theme provider + ThemeToggle**      | ADMIN/TEACH/PORTAL dark mode                          | tokens already in `globals.css`.                                                                                     |
| **Stepper / Wizard**                  | ADMIN onboarding, Staff multi-step                    | drives the onboard wizard.                                                                                           |
| **Chart primitives**                  | ADMIN + Staff dashboards                              | blocked on decision #3.                                                                                              |

**ADMIN-specific** (live in `apps/admin/src/features/*`): dark "console" topbar +
impersonation banner (shell), subscription tier/pricing cards, feature-flag matrix,
permission-template matrix, audit-log diff rows, onboard-wizard screens.

---

## 3. Phases

**Phase 0 — Foundation (now; serves Staff, unblocks ADMIN)**

- Build the "should be shared" components above.
- Finish `packages/auth` (tenant model), `packages/i18n`, `packages/utils`; wire the Staff
  shell + `lib/api.ts` / `lib/query-client.ts`.
- Resolve decisions #1–#3 with backend.

**Phase A — Shell & access** _(gated: admin auth + base endpoints)_
Scaffold `apps/admin` (copy the staff shell), implement the admin auth model (SSO/2FA/
impersonation per decision #1), the dark console layout, `requireRole(['SUPER_ADMIN'])`.

**Phase B — Tenants** _(gated: `/admin/tenants_`)\*
Directory (DataTable + status filters), tenant detail (tabs: overview/subscription/branches/
members/audit/danger), lifecycle (suspend/cancel via type-to-confirm), onboard wizard (Stepper).

**Phase C — Revenue** _(gated: `/admin/subscription-tiers_`, `/admin/subscriptions*`)*
Plans/tiers, feature-flag matrix + toggles, subscriptions table + drawer (billing lifecycle).

**Phase D — Platform ops** _(gated: `/admin/dashboard`, `/admin/audit_`, `/admin/users*`, `/admin/roles*`)\*
Dashboard (StatCard + charts), audit log (diff rows), user directory, role/permission
templates, console settings, impersonation banner.

---

## 4. Immediate next steps (actionable now, not blocked)

1. ✅ **Form / FieldGroup** (RHF-aware) — built (`packages/ui/src/components/form.tsx`; added `react-hook-form`).
2. ✅ **DataTable + Pagination** — built on TanStack Table (`data-table.tsx`, `pagination.tsx`; added `@tanstack/react-table`). Server-driven by default (manual sorting; sort/filter/page via URL).
3. **Theme provider + ThemeToggle** — activates the dark-mode tokens already in place. **(next)**
4. **ConfirmDialog** (+ type-to-confirm), **CommandPalette**, **Stepper** — remaining shared items.

All three are pure `packages/ui` work that serve the Staff app immediately and make ADMIN a
composition exercise later.
