# Coding Standards

> Tuned to this repo by `/adopt`. These describe what the base app actually does,
> not a generic template. When the code and this file disagree, the code wins;
> fix this file.

## Stack

Nx 22 monorepo, Yarn 4 (Berry), Node 22.22.3 pinned by Volta. Angular 21
frontend, FastAPI (Python 3.11+) backend, Postgres via Docker with a SQLite
fallback for local API runs.

## TypeScript

- Strict mode on, plus `noImplicitOverride`, `noPropertyAccessFromIndexSignature`,
  `noImplicitReturns`, `noFallthroughCasesInSwitch` (`tsconfig.base.json`)
- No `any`; use `unknown` or a real type
- Path aliases only for cross-lib imports: `@pch/api-client`, `@pch/domain`. New
  aliases go in both `tsconfig.base.json` and `apps/hub/vite.config.ts` (Vitest
  resolves them separately)
- `import type` for type-only imports; the codebase is consistent about this
- Single quotes, semicolons, two-space indent, trailing commas in multiline

## Angular

- Standalone components only, `standalone: true` stated explicitly
- `changeDetection: ChangeDetectionStrategy.OnPush` on every component
- The app is **zoneless** (`provideZonelessChangeDetection()`), no `zone.js`
  polyfill is loaded. Never rely on zone-based change detection or `fakeAsync`
- Signal APIs: `input()` / `input.required()` for inputs, `computed()` for derived
  values, `inject()` instead of constructor injection
- New control flow only: `@if` / `@else if` / `@for (… ; track …)`. No `*ngIf`,
  no `*ngFor`
- Inline templates in the component file (the whole app does this); no separate
  `.html` or `.css` files per component
- `protected readonly` for template-only members, `readonly` for inputs
- Routes are lazy: `loadComponent: () => import(...)` in `app.routes.ts`
- Route params reach components as signal inputs via `withComponentInputBinding()`

## State (NgRx Signal Store)

- `signalStore({ providedIn: 'root' }, withState(...), withComputed(...), withMethods(...))`
- One store per feature area in `apps/hub/src/app/data-access/<name>.store.ts`
- State shape carries an explicit `status: 'idle' | 'loading' | 'loaded' | 'error'`
  and `error: string | null`; components read `isLoading()`, `hasError()`, `isEmpty()`
- Update state only through `patchState`
- **Derived values belong in `withComputed`, not in templates.** No arithmetic,
  filtering, or sorting in a template expression
- Methods call the API client and `subscribe` with `{ next, error }`, patching
  status on both paths. Error text: `err?.message ?? 'Failed to …'`
- Parallel loads use `forkJoin`

## API access

- HTTP only through `ApiClient` in `libs/api-client`. No hand-written `fetch` and
  no `HttpClient` calls in components or stores
- Types come from the generated OpenAPI schema. `libs/api-client/src/lib/schema.ts`
  is generated: **never hand-edit it**. `types.ts` narrows
  `components['schemas'][...]` into named exports, and `libs/domain` re-exports
  those for app code
- Endpoint changed? Update FastAPI, then run `yarn api-client:generate` (exports
  `contracts/openapi.json` and regenerates `schema.ts`), then consume in a store
- Query params via `HttpParams`, set only when a value is present

## Styling

- Tailwind v4, CSS-first (`@import 'tailwindcss'` in `styles.css`, PostCSS plugin
  in `.postcssrc.json`). There is no `tailwind.config.js` and none should be added
- Angular Material 21 with the azure-blue prebuilt theme; Material for structure
  (`mat-card`, `mat-table`, `mat-chip-set`, `mat-spinner`, `mat-icon`), Tailwind
  utilities for layout and spacing
- No inline styles, with one exception the codebase already makes: sizing the
  `highcharts-chart` host element
- Light theme only today. Do not introduce a dark mode as a side effect

## Charts

- Highcharts 12 through `highcharts-angular` v5, provided once in `app.config.ts`
  with `provideHighcharts({ instance: () => import('highcharts')... })`
- A chart component takes data as a signal input and returns
  `computed<Highcharts.Options>`; it does not fetch or hold state
- Follow `ui/cost-trend-chart.component.ts`: `credits: { enabled: false }`,
  categories on the x-axis, `type: 'line'` per series

## Python (API)

- FastAPI routers in `app/routers/`, one module per resource, each with a
  `prefix` and `tags`
- `Annotated[...]` dependency injection (`Annotated[Session, Depends(get_db)]`);
  shared lookups like `get_project_or_404` live in `routers/deps.py`
- Every route declares `response_model` and an explicit camelCase `operation_id`
  (it becomes the generated client method name)
- Pure business logic goes in `app/domain/calculations.py`: no I/O, fully typed,
  unit tested directly
- Pydantic v2 schemas in `app/schemas.py`, SQLAlchemy 2 models in `app/db/models.py`,
  enums in `app/enums.py`
- Full type annotations. Ruff (line length 100, rules `E,W,F,I,UP,B`) and mypy
  must pass: `yarn api:lint`

## File organization

| What | Where |
| --- | --- |
| Feature components | `apps/hub/src/app/features/<feature>/<name>.component.ts` |
| Presentational components | `apps/hub/src/app/ui/<name>.component.ts` |
| Signal Stores | `apps/hub/src/app/data-access/<name>.store.ts` |
| Shared domain types | `libs/domain/src/lib/models.ts` |
| Generated API client | `libs/api-client/src/lib/` |
| API routes | `apps/api/app/routers/<resource>.py` |
| API logic | `apps/api/app/domain/calculations.py` |

`architecture.md` describes a richer target layout (`libs/feature-*`,
`libs/data-access`, `libs/ui`). The real repo keeps those inside `apps/hub`.
Follow the real layout.

## Naming

- Component classes PascalCase with a `Component` suffix; files kebab-case ending
  `.component.ts`. Stores: `PortfolioStore` in `portfolio.store.ts`
- Selectors prefixed `app-`
- TypeScript: camelCase members, PascalCase types, no `I` prefix
- Python: snake_case functions and fields, PascalCase classes
- The API speaks camelCase over the wire (Pydantic aliases) while Python stays
  snake_case. Do not "fix" either side

## Error handling

- Frontend: catch in the store's `subscribe` error callback, patch
  `status: 'error'` and a message; the component renders it. No `alert`, no
  silent swallow
- Every data-driven view handles loading, error, and empty explicitly, each with a
  `data-testid` (`loading`, `error`, `empty`) so Cypress and unit tests can find it
- API: raise `HTTPException` with a real status code and a specific message

## Testing

The test gate is **on**: `AGENTS.md` declares `yarn nx test hub`.

Three suites already exist:

| Suite | Command | Scope |
| --- | --- | --- |
| Vitest | `yarn nx test hub` | Frontend units, mainly stores |
| pytest | `cd apps/api && uv run pytest` | API routes and calculations (13 tests) |
| Cypress | `yarn nx e2e hub-e2e` | One portfolio-to-detail e2e; needs app + API running |

- **What to test:** pure logic where a wrong answer is possible - derived store
  values (cumulative sums, filters, aggregates), mappers, and API calculations
- **What not to test:** template markup and Material rendering. Prove those with a
  screenshot, the e2e spec, and the build
- **The gate:** a step adding in-scope logic ships a passing test in the same
  diff. `yarn nx test hub` must be green before a step is approved, before any
  checkpoint commit, and before `/complete` merges. API changes must also pass
  `uv run pytest` and `yarn api:lint`
- Test files sit next to source: `portfolio.store.spec.ts` beside
  `portfolio.store.ts`. Vitest only picks up `src/**/*.spec.ts` under `apps/hub`
- Store tests use `TestBed.configureTestingModule` with
  `provideZonelessChangeDetection()` and a `Partial<ApiClient>` fake returning
  `of(...)` or `throwError(...)`. Follow `portfolio.store.spec.ts`; no HTTP
  mocking layer is needed
- Vitest globals are on (`globals: true`), so `describe` / `it` / `expect` need no
  import
- API tests use the pytest fixtures in `apps/api/tests/conftest.py`

There is no combined `verify` script and no frontend ESLint config. Do not invent
either mid-feature; `/ci` owns Verify setup.

## Browser verification

Playwright is not installed and should not be added for this work. Cypress is the
browser tool here (`apps/hub-e2e`). For UI evidence, run the app
(`yarn nx serve hub` with the API up) and screenshot, or extend the existing
Cypress spec.

## Code quality

- No commented-out code
- No unused imports or variables
- Keep functions under 50 lines
- Preserve existing patterns over introducing better ones mid-task
- Do not hand-edit generated files: `libs/api-client/src/lib/schema.ts`,
  `contracts/openapi.json`

## Comments

Write code that explains itself; comment only what the code cannot say.
Over-commenting is a common AI tell, so resist it.

- Comment the **why**, not the **what**. Delete any comment that restates the code.
- No banner/header blocks, section dividers, or step-by-step narration of obvious
  code. A file does not need a comment announcing each region.
- A comment earns its place only when it captures something the code can't: a
  non-obvious decision, a gotcha or workaround, why a value is what it is, or a
  link to a spec or issue.
- Prefer self-documenting names and small functions over explanatory comments.
- Keep doc comments minimal: a one-line purpose on an exported type or function is
  plenty; don't write JSDoc that just repeats the signature. Python modules follow
  the same rule: a short module docstring where it earns its place, as in
  `calculations.py`.
- When in doubt, leave the comment out.

## Writing

- No em dashes (U+2014) in generated content: docs, comments, commit messages,
  READMEs, specs. They read as AI-generated.
- Use a hyphen for `term - description` separators; rephrase prose with commas,
  parentheses, or a colon. Avoid en dashes and the ellipsis character too.
