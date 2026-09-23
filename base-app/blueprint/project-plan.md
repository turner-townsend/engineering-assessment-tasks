# Project Plan

> One of the two planning docs you provide. Use as much detail as the project
> needs, including rationale, constraints, examples, edge cases, and explicit
> exclusions that should guide later feature work. Draft it directly, develop it
> through any AI conversation, or optionally run `/discovery` for a guided deep
> planning session. The content is always yours to direct. When it is filled in,
> run `/overview` to generate the project overview from this plus `build-plan.md`.

## 1. Problem - What problem are we solving?

Two layers, and both matter.

**The deliverable.** This repo is the Turner & Townsend engineering take-home. The
base app (`Project Controls Hub`) ships pre-built and working; the task is to
extend it with one scoped feature from a brief, inside a 90-minute timebox,
without breaking anything that already works. The submission is marked, and it is
reviewed by humans who will ask the author to explain and change the code in a
live session. So the work has to be readable and defensible, not just green.

The chosen brief is [`briefs/mid/frontend-mid.md`](../../briefs/mid/frontend-mid.md)
(Frontend, mid). Its user story:

> **As a** controls manager, **I want** to see how change-order cost deltas
> accumulate over time, and to focus on just the approved ones, **so that** I can
> understand the cost trend when I brief the project board.

**The product problem the brief encodes.** A single "current total" change-order
number hides when control slipped. A cumulative line by month shows the quarter
where costs ran away, and a status filter separates committed cost (approved)
from noise (drafts and submissions that may never land).

Constraints that shape every decision here:

- 90 minutes, hard stop. Anything unfinished gets documented in `SOLUTION.md`
  rather than rushed in.
- Existing features must keep working; all existing tests must stay green.
- Use the existing stack. This is not the place to introduce a new charting
  library, a new state approach, or a new test runner.
- AI and tooling are allowed but must be disclosed in `SOLUTION.md`.

## 2. Users - Who is this for?

- **Controls managers** (the in-fiction user): brief the project board, need to
  see cost-delta accumulation over the life of a project and flip between all
  change orders and approved-only.
- **Planners**: raise and track change orders; consumers of the same project
  detail page.
- **The reviewer** (the real reader): a Turner & Townsend engineer reading the
  diff and the `SOLUTION.md`, then interviewing on it. They are looking for
  current Angular idiom, derived state modelled properly, and tests on the
  interesting logic.

## 3. Features - What does the MVP need?

Already shipped in the base app (do not rebuild):

- Project portfolio list with region, sector, status, and headline KPIs.
- Project detail: baseline vs actuals, cost variance, schedule slippage.
- Cost trend chart (baseline, forecast, actual) via Highcharts.
- Schedule milestone table with RAG status.
- Benchmark panel comparing project metrics against peer percentiles.

To build:

- Cumulative change-order cost delta panel on the project detail page: a running
  total by month, plus a status filter that recomputes on the client with no
  extra server round trip, with explicit loading, error, and empty states.
- `SOLUTION.md`: design, trade-offs, what would come next, AI/tooling disclosure.

## 4. Data - What are we storing?

Nothing new is stored. The feature is read-only and derives everything on the
client from data the API already serves.

Existing entities (full detail in [`../domain-model.md`](../domain-model.md)):
`Project`, `WorkPackage`, `CostSnapshot`, `Milestone`, `RiskEvent`,
`ChangeOrder`, `BenchmarkMetric`.

The feature reads `ChangeOrder` records for one project via the existing
`listChangeOrders` endpoint, and uses `raisedDate`, `costDelta`, and `status`
(`draft` | `submitted` | `approved` | `rejected`).

Derived, not stored:

| Value | Definition |
| --- | --- |
| Monthly cost delta | Sum of `costDelta` for change orders raised in that month, after the status filter. |
| Cumulative cost delta | Running total of monthly cost delta across months in ascending order. |

> TODO (confirm): months with no change orders. Carrying the previous cumulative
> value forward (a flat line) reads better on a chart than a gap, but the brief
> does not say. Decide when spec'ing the feature and note it in `SOLUTION.md`.

## 5. Tech - What stack are we using?

Fixed by the base app; the brief requires using it as-is.

| Layer | Choice |
| --- | --- |
| Monorepo | Nx 22, Yarn 4 (Berry), Node 22.22.3 pinned via Volta |
| Frontend | Angular 21 standalone, zoneless, signals, new control flow |
| State | NgRx Signal Store (`@ngrx/signals`), `providedIn: 'root'` |
| UI | Angular Material 21 (azure-blue prebuilt theme) + Tailwind v4 (CSS-first) |
| Charts | Highcharts 12 via `highcharts-angular` v5, provided with `provideHighcharts` |
| API access | Generated typed client in `libs/api-client`, OpenAPI-first |
| Backend | FastAPI (Python 3.11+), SQLAlchemy 2, Pydantic 2, uv |
| Database | Postgres via Docker Compose; SQLite fallback for local API runs |
| Tests | Vitest (hub), pytest (api), Cypress (hub-e2e) |
| Lint/typecheck | Ruff + mypy on the API. No ESLint config is present for the frontend. |

The whole stack is intentional and stays. The one gap worth knowing: `@nx/eslint`
is a dependency but no ESLint config exists, so there is no frontend lint command.

## 6. Monetize - How will this make money?

Not applicable. This is an assessment deliverable, not a commercial product. The
underlying product is internal Turner & Townsend tooling.

## 7. UI/UX - How should this look and feel?

Match the existing project detail page exactly; a panel that looks bolted on is a
worse answer than a plain one that fits.

- The new panel is a `mat-card` in the project detail layout, alongside the
  existing cost trend, milestones, and benchmark cards.
- Chart styling follows `cost-trend-chart.component.ts`: a `highcharts-chart` with
  `credits: { enabled: false }`, months as x-axis categories, full width, fixed
  height.
- Status filter as a Material control (chips or a select), defaulting to
  > TODO (confirm): "all" or "approved only" as the default view.
- Loading, error, and empty states use the same shape as the existing pages:
  `mat-spinner` for loading, a red-text `mat-card` for errors, a muted `mat-card`
  for empty, each with a `data-testid` hook.
- Tailwind utility classes for layout, no inline styles, no new theme work.

## 8. Deployment - Where and how will this ship?

Not deployed. The submission ships as a branch or PR plus `SOLUTION.md`.

Local run (from `base-app/`):

- API + Postgres: `docker compose -f infra/docker-compose.yml up --build` (API on
  `:8000`, Postgres published on host `:5433`)
- Frontend: `yarn install && yarn nx serve hub` (`:4200`)
- API without Docker (SQLite, auto-seeds): `cd apps/api && uv sync && uv run
  uvicorn app.main:app --reload`

Run the API and the frontend in separate terminals. `infra/` holds only
`docker-compose.yml` and `Dockerfile.api`; the `infra/k8s/` reference manifests
mentioned in `README.md` and `architecture.md` do not exist in this repo.
