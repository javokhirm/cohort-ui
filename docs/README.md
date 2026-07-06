# EduCore Frontend — Documentation

The architecture and conventions for **educore-fe**, the frontend monorepo for the EduCore
education-center SaaS. Start with [../CLAUDE.md](../CLAUDE.md) for the working agreement and
stack, then dive into the area you're working in.

## Read order for a new contributor

1. [../CLAUDE.md](../CLAUDE.md) — working agreement, stack, commands, ground rules.
2. [architecture.md](architecture.md) — apps & packages, dependency rules, backend-domain →
   feature mapping.
3. [folder-structure.md](folder-structure.md) — where every file lives.
4. [conventions.md](conventions.md) — naming, components, state, forms, i18n, styling, the
   enforced architecture rules.
5. The area-specific docs as needed:
    - [api-integration.md](api-integration.md) — codegen, the typed client, Query hooks.
    - [auth-and-rbac.md](auth-and-rbac.md) — tenancy, tokens, silent refresh, permission gating.
    - [testing.md](testing.md) — Vitest, RTL, MSW, Playwright.
    - [environments.md](environments.md) — env vars, typed env, local multi-tenant dev.
    - [ci-cd.md](ci-cd.md) — pipeline, caching, deployment.
6. [contributing.md](contributing.md) — workflow, PRs, the review checklist.

## The one-paragraph summary

Turborepo + pnpm monorepo of React 19 + Vite SPAs — one app per backend API surface (today:
the **staff** app for `/api/v1/manage`). Routing via TanStack Router; server state via
TanStack Query over a typed client generated from the backend's OpenAPI spec; client state via
Zustand; UI from a shared shadcn/ui + Tailwind package; forms via React Hook Form + Zod.
Multi-tenant by **subdomain** (one build, all tenants); auth is JWT access (memory) + refresh
(localStorage) with silent refresh; UI is permission/role-gated for UX while the **server
enforces** authorization. Features mirror the backend's domains. Keep it simple, keep
boundaries clean, don't build ahead of the API.

## Source of truth

- **This repo's architecture & conventions:** these docs (docs win over code on conflict).
- **The API contract & domain model:** `educore-be/docs/` — never invent endpoints or fields.
