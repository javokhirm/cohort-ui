# Coding Conventions & Architecture Rules

The rules that keep the codebase consistent enough that any contributor — or AI agent — can
work in any corner. Conventions are enforced by ESLint/Prettier/TypeScript where possible;
the rest is review discipline.

---

## 1. Architecture rules (enforced — non-negotiable)

1. **Dependency direction.** `apps → packages`; within packages: `ui/auth/i18n → api-client
→ utils → types` (configs are leaves). No cycles, no backward edges.
   ([architecture.md](architecture.md))
2. **Barrels only.** Import a package via its name (`@cohort/ui`), never a deep path. Import
   a feature via its `index.ts`, never another feature's internals.
3. **No `fetch`/`axios` in components.** Network access goes through feature Query hooks built
   on `api-client`. ([api-integration.md](api-integration.md))
4. **Server state → TanStack Query; client state → Zustand.** Never store API data in Zustand
   or `useState`; never store ephemeral UI state in Query.
5. **No hand-written API types.** Generate from OpenAPI. ([api-integration.md](api-integration.md))
6. **`ui` is presentational.** No data fetching, routing, Query, Zustand, or business logic in
   `packages/ui`.
7. **Money/dates go through shared formatters.** Never `toFixed`, never `new
Date().toLocaleString()` ad hoc. (§7)
8. **No tenant, no secret in the bundle.** Tenant is runtime (who logs in); SPA env is public.

ESLint enforces 1–3 via import/boundary rules; reviewers enforce the rest.

---

## 2. Language & TypeScript

- **TypeScript strict** everywhere (`strict`, `noUncheckedIndexedAccess`,
  `noImplicitOverride`). No `any` — use `unknown` + narrowing. `// @ts-expect-error` must
  carry a reason comment.
- **IDs are `number`** (backend uses integer PKs, never UUID).
- Prefer **type inference**; annotate exported/public function signatures and props.
- Model unions explicitly; derive types from Zod schemas (`z.infer`) and from the generated
  API schema rather than restating them.
- No default exports except where a tool requires it (route modules). Named exports
  everywhere — they keep imports greppable and refactors safe.

---

## 3. Naming & files

| Thing                         | Convention                | Example                             |
| ----------------------------- | ------------------------- | ----------------------------------- |
| Directory                     | `kebab-case`              | `features/billing/`                 |
| React component file + symbol | `PascalCase`              | `StudentTable.tsx` → `StudentTable` |
| Hook                          | `useX` in `use-x.ts`      | `use-students.ts` → `useStudents`   |
| Non-component module          | `kebab-case`              | `students.queries.ts`               |
| shadcn primitive (in `ui`)    | `kebab-case` (per CLI)    | `button.tsx`                        |
| Zod schema                    | `*-form.schema.ts`        | `student-form.schema.ts`            |
| Test                          | `*.test.ts(x)` co-located | `StudentTable.test.tsx`             |
| Constant values               | `SCREAMING_SNAKE_CASE`    | `MAX_PAGE_LIMIT`                    |
| Type / interface              | `PascalCase`              | `StudentListFilters`                |

Booleans read as predicates (`isLoading`, `hasError`, `canEdit`). Event handlers are
`handleX`; props that take them are `onX`.

**Hook files** are kebab-case (`use-students.ts`). **Exception:** data hooks are grouped per
feature in `*.queries.ts` / `*.mutations.ts`, and one such file may export several `useX`
hooks (e.g. `students.queries.ts` → `useStudents`, `useStudent`). See
[api-integration.md](api-integration.md) §4.

---

## 4. Components

- **Function components + hooks only.** No classes (except an error boundary if needed).
- **Composition over configuration.** Prefer small components and `children` over giant prop
  objects and boolean flags.
- **Presentational vs container:** components in `packages/ui` and `features/*/components`
  are presentational (props in, callbacks out). Data binding happens in `screens/` (which call
  the feature's Query hooks) or thin container components.
- **Every async UI handles three states:** loading, error, empty — plus success. Use shared
  `ui` primitives (`<Skeleton/>`, `<ErrorState/>`, `<EmptyState/>`); don't render a bare
  spinner-or-nothing.
- **Lists:** virtualize only when measured necessary; otherwise paginate (the API is
  offset-paginated). On small screens a table must stay usable — horizontal scroll is
  acceptable; collapse to a card list only where a table is a primary mobile workflow (§8).
- **Accessibility:** use Radix-backed `ui` primitives (focus, ARIA handled). Label every
  input, every icon-only button has an `aria-label`. Don't regress a11y for visuals.

---

## 5. State management

| Kind of state                                      | Tool                        |
| -------------------------------------------------- | --------------------------- |
| Anything from the API                              | **TanStack Query**          |
| Session/tokens/user, active branch, theme, locale  | **Zustand** (in `auth`/app) |
| URL-shareable view state: filters, sort, page, tab | **Router search params**    |
| Form field state                                   | **React Hook Form**         |
| Local ephemeral (open/hover, input draft)          | `useState`/`useReducer`     |

- **List filters, sort, and page live in the URL** (TanStack Router typed search params), not
  in component state — so views are shareable, back/forward works, and the query key is the
  search object. ([auth-and-rbac.md](auth-and-rbac.md) for the pattern.)
- Zustand stores are **small and purposeful** (one store per concern). No giant global store,
  no Redux. Select narrow slices to avoid re-renders.

---

## 6. Forms & validation

- **React Hook Form + Zod** via `@hookform/resolvers/zod`, rendered with the shadcn `<Form/>`
  primitives from `packages/ui`.
- The **Zod schema is the single source of truth** for a form's shape and rules; derive the
  TS type with `z.infer`. Keep schemas in `features/<domain>/schemas/`.
- **Mirror, don't guess, the backend's validation.** Client validation is for UX; the server
  re-validates. Don't invent constraints the API doesn't have.
- **Server field errors:** on a failed mutation, if `error.details` has per-field messages,
  map them to fields with `form.setError`; show a form-level message otherwise.
- Submit buttons disable + show pending state during the mutation; never double-submit.

```tsx
const schema = z.object({
	firstName: z.string().min(1),
	phone: z.string().regex(/^\+998\d{9}$/),
	dateOfBirth: z.coerce.date().optional(),
});
type StudentForm = z.infer<typeof schema>;

const form = useForm<StudentForm>({ resolver: zodResolver(schema) });
```

---

## 7. i18n, money, dates, numbers

- **All user-facing text is translated.** No hardcoded strings in components — use `useT()`
  from `packages/i18n`. Add keys to **all three locales** (`uz` default, `ru`, `en`); where a
  string corresponds to a backend message/error code, key it by that code.
- **Money:** `numeric(14,2)`, default **UZS**. Always format via `formatMoney(amount,
currency)` from `i18n`/`utils`. Never `toFixed`, never string-concat a currency symbol.
  Treat amounts as numbers from the API (the backend transforms `numeric` → JS number).
- **Dates/times:** default timezone **`Asia/Tashkent`**. Format via the shared
  `formatDate`/`formatDateTime` helpers; parse API timestamps (ISO with offset) — don't
  `new Date(str)` and render raw.
- **Locale selection:** from the user's preference when available, else tenant default, else
  `uz`. Persist the chosen locale in client state.

---

## 8. Styling & responsiveness

- **Tailwind utility classes**, composed via the `cn()` helper (clsx + tailwind-merge). No
  ad-hoc CSS files except `globals.css`; no inline `style` except truly dynamic values.
- **Design tokens** (color, spacing, radius, typography) come from `config` (the Tailwind preset) as CSS
  variables — this is what enables per-tenant theming. Use token-backed classes, not raw hex.
- **Mobile-first.** Default styles target small screens; layer `sm: md: lg:` up. The staff app
  is information-dense (desktop-first in practice) but must remain usable on a tablet/phone —
  tables may scroll horizontally; collapse a table to a card list only where it's a primary
  mobile workflow (don't pre-build card layouts for every table). The teacher/portal PWAs are
  genuinely mobile-first.
- **Class order** is auto-sorted by `prettier-plugin-tailwindcss` — don't fight it.

---

## 9. Imports & module hygiene

- Order: external → `@cohort/*` packages → `@/` app aliases → relative. (Auto-organized by
  the import plugin.)
- No deep/relative reaches across feature or package boundaries (rule §1.2).
- Side-effect-free modules; no top-level network or `Date.now()` in module scope.

---

## 10. Comments & docs

- Comment the **why**, not the **what**. Match the surrounding density.
- Public package APIs (anything in an `index.ts`) get a one-line TSDoc.
- Anything money/auth/tenant-related that isn't obvious gets a short note explaining the
  invariant being upheld.

---

## 11. Definition of done (per change)

- Types pass (`pnpm typecheck`), lint clean (`pnpm lint`), formatted.
- Tests added/updated and green ([testing.md](testing.md)); MSW handler for any new endpoint.
- Loading/error/empty states handled; text translated in all three locales.
- No new dependency without approval; no boundary violation; no hand-written API type.
- For money/auth/payment changes: a second reviewer.
