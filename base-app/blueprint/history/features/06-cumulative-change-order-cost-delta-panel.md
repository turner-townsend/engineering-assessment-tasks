# Feature: Cumulative change-order cost delta panel

**From build-plan:** feature 6
**Status:** complete (2026-08-26)

## Goal

Give controls managers a panel on the project detail page showing how
change-order cost deltas accumulate month by month, with a status filter that
switches between all change orders and approved-only without going back to the
server. A single "current total" hides when control slipped; a cumulative line
shows exactly which quarter to explain to the board.

## Decisions taken (change these here before building if you disagree)

The brief leaves four things open. These are the calls this spec makes:

| Decision | Choice | Why |
| --- | --- | --- |
| Store placement | New dedicated `ChangeOrderDeltaStore`, not an addition to `ProjectDetailStore` | `ProjectDetailStore` loads via `forkJoin`; adding a fifth call means a change-order failure blanks the whole page. The brief requires the panel to show its own loading, error, and empty states. |
| Filtering | Fetch once unfiltered, filter in `withComputed` | The brief is explicit: the chart updates "without the app going back to the server". Never pass `status` to `listChangeOrders` here. |
| Months with no change orders | Carry the previous cumulative value forward (flat line) | A running total is continuous by definition; a gap would read as "value unknown". Seed data exercises this: Riverside has no change orders in 2025-02, and Metro has none approved in 2024-03/04. |
| Default filter | All change orders | The brief's example flow is "all -> approved only", implying all is the starting view. |
| Month range | First to last change-order month for the selected filter, inclusive | Self-contained: no dependency on cost-snapshot periods or project dates. |
| What "all" includes | Every change order, `rejected` ones included | The brief contrasts "all requested changes" with "only approved", so "all" means all requested. Seed data has only `approved` and `submitted`, so this never shows up in the demo. Worth a line in `SOLUTION.md`. |

## In scope

- A `ChangeOrderDeltaStore` signal store: loads a project's change orders once,
  holds the status filter, exposes memoized derived series.
- Derived logic: filter by status, bucket by `raisedDate` month, sum `costDelta`
  per month, running total across months, gap months carried forward.
- A presentational Highcharts component rendering the cumulative series.
- A panel on the project detail page with the filter control and explicit
  loading, error, and empty states.
- Unit tests for the derived logic (filtering, bucketing, cumulative sum, gaps).

## Out of scope

- Any backend change. No new endpoint, no schema change, no
  `yarn api-client:generate` run.
- Persisting the filter choice (URL, localStorage, or server).
- Schedule delta accumulation. Cost only, per the brief.
- Currency conversion or per-work-package breakdown.
- A new Cypress spec. The existing e2e must keep passing; browser evidence for
  this feature is a screenshot.
- Fixing the unused `ChangeOrderList` paginated schema in the API.

## Build loop

Build one step at a time, never the whole feature at once.

1. Plan mode lays out the step before any code.
2. The AI implements just that step.
3. It shows the diff (not full files); you read it and understand it.
4. You approve, then choose whether to commit a checkpoint or roll straight on.
   Checkpoints are optional; `/complete` makes the real feature-level commit at the end.

Never accept a step you haven't read. If a diff is too big to review, the step was too big, so split it.

## Build steps

- [x] **Step 1 - `ChangeOrderDeltaStore` with derived series and tests** - new
  store at `apps/hub/src/app/data-access/change-order-delta.store.ts`, plus
  `change-order-delta.store.spec.ts`. State: `changeOrders`, `status`
  (`idle | loading | loaded | error`), `error`, `filter` (`'all' | 'approved'`).
  Methods: `load(projectId)` calling `api.listChangeOrders(projectId)` with no
  status argument, and `setFilter(filter)`. Computed: `isLoading`, `hasError`,
  `isEmpty`, `filteredOrders`, `cumulativeSeries`.
  `load()` must clear any previously loaded orders, since the store is
  `providedIn: 'root'` and is reused when navigating between projects.
  *Done when:* `yarn nx test hub` passes with new tests proving, against
  Riverside-shaped fixtures: (a) `filter: 'all'` yields months `2025-01` through
  `2025-09` with cumulative `4.5M, 4.5M, 7.0M, 8.2M, 10.7M, 10.82M, 12.92M,
  13.12M, 13.62M` (note `2025-02` carried forward); (b) `filter: 'approved'`
  yields `2025-03` through `2025-09` with cumulative `2.5M, 2.5M, 5.0M, 5.0M,
  7.1M, 7.1M, 7.6M`; (c) no change orders gives `isEmpty() === true` and an empty
  series; (d) a failing API call sets `status: 'error'` and the message;
  (e) loading project B after project A shows only B's orders.

  `isEmpty` means "no change orders matched the filter", not "the total is zero".
  A project whose deltas cancel out has a real series to draw.

- [x] **Step 2 - Cumulative delta chart component** - new
  `apps/hub/src/app/ui/cumulative-cost-delta-chart.component.ts`, presentational
  only: `points = input.required<CumulativePoint[]>()` and a
  `computed<Highcharts.Options>`, mirroring `cost-trend-chart.component.ts`
  (single line series, month categories, `credits: { enabled: false }`, fixed
  height, no fetching and no store injection).
  *Done when:* `yarn nx build hub` passes and the component renders a line chart
  when handed a fixture array, with months on the x-axis and cumulative values on
  the y-axis.

- [x] **Step 3 - Panel on the project detail page** - new
  `apps/hub/src/app/features/project-detail/change-order-delta-panel.component.ts`
  holding the `mat-card`, the filter control, the four view states, and the chart;
  wired into `project-detail.component.ts` below the existing cost trend card. The
  panel calls `store.load(projectId)` on init and `store.setFilter(...)` on filter
  change.
  *Done when:* with the API running, `/projects/11111111-1111-1111-1111-111111111111`
  shows the panel with a climbing line; switching the filter to approved-only
  redraws immediately with **no new network request** (verified in the Network
  tab); `/projects/33333333-3333-3333-3333-333333333333` (Harbour, zero change
  orders) shows the empty state; `yarn nx test hub` and `yarn nx build hub` both
  pass; a screenshot of the panel is captured.

## Files / areas

| File | Change |
| --- | --- |
| `apps/hub/src/app/data-access/change-order-delta.store.ts` | new - store and derived series |
| `apps/hub/src/app/data-access/change-order-delta.store.spec.ts` | new - unit tests for the derived logic |
| `apps/hub/src/app/ui/cumulative-cost-delta-chart.component.ts` | new - presentational Highcharts component |
| `apps/hub/src/app/features/project-detail/change-order-delta-panel.component.ts` | new - panel, filter, view states |
| `apps/hub/src/app/features/project-detail/project-detail.component.ts` | edit - import and place the panel |

No changes under `apps/api/`, `libs/`, or `contracts/`.

## Data / contracts

Consumed, unchanged: `ChangeOrder` from `@pch/domain`, via
`ApiClient.listChangeOrders(projectId)`. Fields used: `raisedDate` (ISO date
string), `costDelta` (number), `status` (`draft | submitted | approved |
rejected`).

**Load-bearing new type**, exported from the store file and consumed by the chart
component:

```ts
export interface CumulativePoint {
  month: string;      // 'YYYY-MM'
  monthlyDelta: number;
  cumulative: number;
}
```

The filter type is `'all' | 'approved'`, not `ChangeOrderStatus`. The panel
filters to a *view*, not to a single status, so reusing the API enum here would
misrepresent it.

Nothing is stored. `contracts/openapi.json` and
`libs/api-client/src/lib/schema.ts` are generated and must not be touched.

## Testing

The test gate is **on**: `AGENTS.md` declares `yarn nx test hub`.

**In-scope logic that must ship tests (Step 1):** the filter, the month bucketing
from `raisedDate`, the per-month sum, the running total, and gap carry-forward.
These are pure functions over a fixture array with real edge cases, so they carry
the coverage for this feature.

**Not unit tested:** the chart component and the panel's Material markup. Those
ride on `yarn nx build hub` plus a screenshot, per the Testing section of
`coding-standards.md`.

Follow `portfolio.store.spec.ts` exactly: `TestBed.configureTestingModule` with
`provideZonelessChangeDetection()` and a `Partial<ApiClient>` fake returning
`of(...)` or `throwError(...)`. Vitest globals are on, so no imports for
`describe` / `it` / `expect`.

Manual path for Step 3:

1. `docker compose -f infra/docker-compose.yml up --build` (or the SQLite uvicorn path)
2. `yarn nx serve hub`, open http://localhost:4200
3. Riverside Hospital Expansion -> panel shows a rising line across 2025-01..09
4. Switch to approved-only -> line redraws, Network tab shows no new request
5. Harbour Logistics Park -> empty state, no chart, no error

Regression check: the existing Cypress spec (`yarn nx e2e hub-e2e`) must still
pass, and the existing cost trend, milestones, and benchmark cards must be
unchanged.

## Notes for the AI

- **Client-side only.** No `status` parameter on the API call. Refetching on
  filter change fails the brief's acceptance criterion.
- **Derived values live in `withComputed`.** No arithmetic, filtering, or sorting
  in a template expression. This is the thing the brief says it cares about most.
- **Angular idiom is being graded:** standalone, `ChangeDetectionStrategy.OnPush`,
  `inject()`, `input.required()`, `@if` / `@for (… ; track …)`. The app is
  zoneless, so no `fakeAsync` and no zone-dependent tests.
- Month key from `raisedDate.slice(0, 7)`. Do not construct a `Date` for
  bucketing: `new Date('2025-03-01')` parses as UTC and can shift the month in
  a negative-offset timezone.
- Match existing view-state markup: `mat-spinner` for loading, red-text
  `mat-card` for error, muted `mat-card` for empty, each with `data-testid`
  (`loading`, `error`, `empty`) as in `portfolio.component.ts`.
- Sum in the order months appear; do not reduce over floats out of order. Seed
  values are whole currency units, so exact equality in tests is safe.
- Do not touch `libs/api-client/src/lib/schema.ts` or `contracts/openapi.json`.
- Existing tests must stay green: 3 Vitest specs today, 13 pytest tests untouched.
