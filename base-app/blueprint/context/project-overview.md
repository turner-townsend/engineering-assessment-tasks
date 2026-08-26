# Project Controls Hub - Project Overview

> Portfolio-wide cost, schedule, risk, and benchmark monitoring for construction
> projects. Shipped and working; the current work adds a cumulative change-order
> cost delta panel from the Turner & Townsend frontend take-home brief.

## Problem

Controls managers cannot see how change-order cost deltas accumulate over the
life of a project. The product shows change orders as records, but a single
"current total" hides when control slipped: a line that climbs steeply in one
quarter tells a manager exactly which quarter to explain to the board. Managers
also cannot separate committed cost (approved change orders) from noise (drafts
and submissions that may never land).

This repo is also an assessment deliverable. The base app ships pre-built; the
task is one scoped feature from
[`briefs/mid/frontend-mid.md`](../../../briefs/mid/frontend-mid.md), inside a
90-minute timebox, without breaking existing features or tests. It is marked, and
the author must be able to explain and change the code live. Readable and
defensible beats clever.

## Users

- **Controls managers** (headline user) - brief the project board; need cost-delta
  accumulation over time and a filter between all change orders and approved-only.
- **Planners** - raise and track change orders against projects and work packages;
  share the project detail page.
- **The reviewer** - a Turner & Townsend engineer reading the diff and
  `SOLUTION.md`, looking for current Angular idiom, derived state modelled in a
  Signal Store, and tests on the interesting logic.

No authentication or access tiers exist. Every user sees the same portfolio.

## Features

In `build-plan.md` order. Items 1-5 shipped with the base app.

1. **Project portfolio** (done) - project list with region, sector, status, and
   baseline cost; links into detail.
2. **Project detail** (done) - baseline vs actuals-to-date, cost variance,
   schedule slippage, open change order count.
3. **Cost trend chart** (done) - monthly baseline/forecast/actual line chart in
   Highcharts.
4. **Schedule milestones** (done) - milestone table with planned/forecast/actual
   dates and RAG status.
5. **Benchmark panel** (done) - project unit metrics against peer p25/median/p75.
6. **Cumulative change-order cost delta panel** (headline, next) - running total of
   change-order cost deltas by month on the project detail page, with a status
   filter (all vs approved only) that recomputes on the client with no extra
   server round trip, plus explicit loading, error, and empty states.
7. **SOLUTION.md** - design, trade-offs, what's next, and AI/tooling disclosure.

## Data model

Feature 6 stores nothing. It derives everything from `ChangeOrder` records the
API already serves. The shapes below are **locked**: they come from
`contracts/schema.sql`, the generated OpenAPI client, and seeded data that must
stay deterministic. Do not change them for this feature.

### ChangeOrder (the one feature 6 reads)

- `id` (string, uuid)
- `workPackageId` (string | null) - the package the change is scoped to
- `workPackageCode` (string | null) - denormalized code, e.g. `SUB`, `MEP`
- `reference` (string) - human reference, e.g. `CO-001`, unique per project
- `title` (string)
- `status` (`draft` | `submitted` | `approved` | `rejected`)
- `costDelta` (number) - cost impact; the value that accumulates
- `scheduleDeltaDays` (integer)
- `raisedDate` (string, ISO date) - the month bucket comes from this
- belongs to one `Project`, optionally to one `WorkPackage`

Seed reality worth knowing: 13 change orders, statuses only `approved` (7) and
`submitted` (6), spread across two of the three projects. **Harbour Logistics
Park has none**, which is the natural empty-state case to verify.

### Project

- `id` (string, uuid), `name`, `region`, `sector`
- `status` (`planning` | `in_delivery` | `on_hold` | `complete`)
- `startDate`, `plannedEndDate` (ISO dates)
- `baselineCost` (number), `currency` (ISO 4217)
- has many `WorkPackage`, `CostSnapshot`, `Milestone`, `RiskEvent`, `ChangeOrder`

### ProjectDetail (extends Project)

- `actualCostToDate`, `costVariance` (numbers)
- `scheduleSlippageDays`, `openChangeOrderCount` (integers)

### Supporting models

- **WorkPackage** - `id`, `projectId`, `code`, `name`, `baselineCost`
- **CostSnapshot** - `periodMonth`, `workPackageId` (null = project level),
  `baselineCost`, `forecastCost`, `actualCost`
- **Milestone** - `id`, `name`, `plannedDate`, `forecastDate`, `actualDate`,
  `ragStatus` (`red` | `amber` | `green`)
- **BenchmarkComparison** - `metricKey`, `unit`, `projectValue`, `peerMedian`,
  `peerP25`, `peerP75`, `position`
- **RiskEvent** - seeded and in the schema, but no UI or endpoint reads it today

### Derived values (feature 6, computed client-side)

| Value | Definition |
| --- | --- |
| Filtered change orders | All change orders, or only `status === 'approved'` |
| Monthly cost delta | Sum of `costDelta` for change orders whose `raisedDate` falls in that month |
| Cumulative cost delta | Running total of monthly cost delta, months ascending |

These belong in `withComputed` on a Signal Store, memoized, never in a template.

## Tech stack

Fixed by the base app; the brief requires using it as-is.

- **Nx 22 monorepo** - `apps/hub`, `apps/hub-e2e`, `apps/api`, `libs/api-client`, `libs/domain`
- **Yarn 4 (Berry) + Volta** - Node 22.22.3 and Yarn 4.5.0 pinned per project
- **Angular 21** - standalone, zoneless, signals, new control flow, lazy routes
- **NgRx Signal Store** (`@ngrx/signals`) - all feature state and derived values
- **Angular Material 21 + Tailwind v4** - Material for structure, Tailwind utilities for layout; CSS-first Tailwind, no `tailwind.config.js`
- **Highcharts 12** via `highcharts-angular` v5, provided with `provideHighcharts`
- **`libs/api-client`** - typed client over the FastAPI OpenAPI export; the only HTTP path
- **FastAPI + SQLAlchemy 2 + Pydantic 2** (Python 3.11+, uv) - the API, camelCase over the wire
- **Postgres via Docker Compose**, SQLite fallback for local API runs
- **Vitest** (hub), **pytest** (api, 13 tests), **Cypress** (hub-e2e)
- **Ruff + mypy** on the API. No frontend ESLint config exists.

## API surface

All endpoints exist today; feature 6 adds none.

| Operation | Endpoint |
| --- | --- |
| `listProjects` | `GET /projects` (filters: region, sector, status) |
| `getProject` | `GET /projects/{projectId}` |
| `getCostTrend` | `GET /projects/{projectId}/cost-trend` |
| `listMilestones` | `GET /projects/{projectId}/milestones` |
| `listChangeOrders` | `GET /projects/{projectId}/change-orders?status=` |
| `getProjectBenchmarks` | `GET /projects/{projectId}/benchmarks` |

Feature 6 fetches change orders **once**, unfiltered, and applies the status
filter client-side. Do not pass `status` to the server on filter change; the
brief calls out "without the app going back to the server".

## Monetization

Not applicable. Internal Turner & Townsend tooling, delivered as an assessment.

## UI/UX

Match the existing project detail page. A panel that looks bolted on is a worse
answer than a plain one that fits.

Routes:

- `/` - portfolio grid of project cards (`data-testid="project-card"`)
- `/projects/:projectId` - project detail: KPI cards, cost trend chart, milestone
  table, benchmark panel, and the new cost delta panel
- `**` - redirects to `/`

Conventions the new panel follows:

- A `mat-card` alongside the existing detail cards
- Chart mirrors `ui/cost-trend-chart.component.ts`: `highcharts-chart`,
  `credits: { enabled: false }`, months as x-axis categories, full width, fixed height
- Status filter as a Material control (chips or select)
- Loading = `mat-spinner`, error = red-text `mat-card`, empty = muted `mat-card`,
  each with a `data-testid` (`loading`, `error`, `empty`)
- Tailwind utilities for layout, no inline styles, light theme only

## Deployment

Not deployed. The submission ships as a branch or PR plus `SOLUTION.md`.

Local run, from `base-app/`:

- API + Postgres: `docker compose -f infra/docker-compose.yml up --build`
  (API `:8000`, Postgres on host `:5433`)
- Frontend: `yarn install && yarn nx serve hub` (`:4200`)
- API without Docker (SQLite, auto-seeds): `cd apps/api && uv sync && uv run uvicorn app.main:app --reload`

Run API and frontend in separate terminals. CORS allows only
`http://localhost:4200`. Env vars: `HUB_DATABASE_URL`, `HUB_SEED_ON_STARTUP`.
CI already runs on pull requests from `.github/workflows/ci.yml` at the repo root
(one level above `base-app/`): Ruff, mypy, pytest, `yarn nx test hub`,
`yarn nx build hub`.

## Open questions

> Resolve in the plans, then re-run `/overview`.

1. **Empty months in the chart** - carry the previous cumulative value forward (a
   flat line) or leave a gap? The brief does not say. Flat carry-forward reads
   better for a running total; decide when spec'ing and note it in `SOLUTION.md`.
2. **Default filter state** - does the panel open on "all" or "approved only"? The
   brief's example flow is "all -> approved only", which implies all is the
   default, but it is not stated.
3. **Feature 6 sizing** - one feature-sized outcome with two halves (store derived
   signals, then the chart panel). Expect `/feature` to split it into 6a/6b.
4. **Doc drift in the base app** - `architecture.md` describes `libs/feature-*`,
   `libs/data-access`, and `libs/ui` that live inside `apps/hub` in reality, and
   both `README.md` and `architecture.md` reference an `infra/k8s/` directory that
   does not exist. `coding-standards.md` follows the real layout.
5. **Unused API shape** - `ChangeOrderList` (a paginated wrapper) is defined in
   `app/schemas.py` but `listChangeOrders` returns a plain array. The client types
   match the array. Nothing to do for feature 6; do not "fix" it mid-task.
