# SOLUTION.md

Cumulative change-order cost delta panel, for the frontend mid brief.

## What was built

A panel on the project detail page showing a running total of change-order cost
deltas by month, with an all vs approved-only filter that recomputes on the
client.

| File | Role |
| --- | --- |
| `apps/hub/src/app/data-access/change-order-delta.store.ts` | Signal Store: fetch, filter state, derived series |
| `apps/hub/src/app/data-access/change-order-delta.store.spec.ts` | 8 unit tests over the derived logic |
| `apps/hub/src/app/ui/cumulative-cost-delta-chart.component.ts` | Presentational Highcharts line chart |
| `apps/hub/src/app/features/project-detail/change-order-delta-panel.component.ts` | Panel: card, filter, four view states |
| `apps/hub/src/app/features/project-detail/project-detail.component.ts` | Three lines to place the panel |

No backend change, no new endpoint, no regenerated client.

## Design

**The filter never touches the network.** `load(projectId)` calls
`listChangeOrders(projectId)` once, with no `status` argument. Everything after
that is derived:

```
changeOrders + filter
  -> filteredOrders      (status === 'approved', or all)
  -> bucket by month     (raisedDate.slice(0, 7))
  -> sum costDelta       (per month)
  -> running total       (months ascending, gaps carried forward)
```

All four live in `withComputed`, so switching the filter re-runs the chain from
memoized signals and the chart redraws with zero requests. Nothing is computed
in a template.

**A dedicated store, not an addition to `ProjectDetailStore`.** That store loads
its four calls through `forkJoin`, so a fifth call would mean a change-order
failure blanks the entire page. The brief asks for the panel's own loading,
error, and empty states, which only works if the panel owns its own request.

**Month keys by string slice, not `Date`.** `new Date('2025-03-01')` parses as
UTC; formatting it back in a negative-offset timezone yields February. Slicing
`raisedDate` to `YYYY-MM` sidesteps a bug that would only appear for reviewers
west of Greenwich.

**`mat-button-toggle-group` for the filter.** Single-select button toggles cannot
be deselected (`_onButtonClick` forces `newChecked = true`), so the control can
never emit a null filter. `mat-chip-listbox` allows deselection and would need a
guard. It also renders as a real `radiogroup`.

## Decisions the brief left open

| Question | Call | Reasoning |
| --- | --- | --- |
| Months with no change orders | Carry the previous cumulative forward, flat line | A running total is continuous by definition. A gap reads as "value unknown", which is a different claim. Riverside has nothing in `2025-02` and the line stays flat there. |
| Default filter | All | The brief's example flow is "all -> approved only", so all is the starting view. |
| What "all" includes | Every change order, `rejected` included | The brief contrasts "all requested changes" with "only approved". Seed data has only `approved` and `submitted`, so this never surfaces in the demo, but it is a real product question: a controls manager may want rejected changes excluded from "all". Worth confirming. |
| Month range | First to last change-order month for the current filter | Self-contained. No dependency on cost-snapshot periods or project dates, so the panel cannot disagree with the cost trend chart above it. |
| `isEmpty` semantics | "No change orders matched the filter", not "the total is zero" | A project whose deltas cancel out has a real series to draw. One test covers exactly this. |

## Tests

`yarn nx test hub` - 11 passing, 8 of them new. They cover the logic where a
wrong answer is possible, not the markup:

- accumulation across all orders, with an empty month carried forward
- recomputation when the filter flips to approved-only
- a series spanning a year boundary (the `month > 12` rollover)
- empty result, and empty because the filter excluded everything
- a series whose deltas cancel to zero but is still drawable
- API error captured into `status: 'error'` with a message
- previous project's orders dropped when loading another (the store is
  `providedIn: 'root'` and survives navigation)

The chart and the panel markup are not unit tested. They were verified in the
browser instead: the panel renders `2025-01`..`2025-09` for Riverside ending near
13.6M, the approved-only filter redraws to `2025-03`..`2025-09` ending near 7.6M
with an unchanged network log, and Harbour Logistics Park (zero change orders)
shows the empty state.

## Trade-offs and what I would do next

- **The filter is not in the URL.** Persisting was explicitly out of scope, but a
  controls manager who wants to share "the approved-only view" with the board
  currently cannot. A query param would be the first thing I add.
- **The panel is not linked to the numbers around it.** The KPI row already shows
  `openChangeOrderCount`; the panel's final cumulative value and that count tell
  one story and are presented as two. A short summary line above the chart would
  connect them.
- **Currency is ignored.** `costDelta` is summed raw and the axis is unitless.
  Every seeded project is single-currency so it does not bite, but the axis
  should carry the project's currency.
- **Highcharts appears twice in the bundle.** The build emits two ~275 kB
  Highcharts chunks even though `app.config.ts` has a single
  `import('highcharts')`. The build also warns that Highcharts is not ESM, which
  is the likely cause. I did not chase it inside the timebox, but roughly 90 kB
  transferred twice is worth a look.
- **The Cypress suite does not compile**, and did not before this work:
  `apps/hub-e2e/tsconfig.json` sets `"module": "commonjs"` against the base
  config's `"moduleResolution": "bundler"` (TS5095). Both files date from the
  initial commit. I left it alone rather than fix an unrelated break inside a
  timeboxed feature, but it means the e2e regression check could not be run.
- **`rejected` in "all"** is the one product decision above that I would want a
  real answer to before shipping.

## AI and tooling disclosure

Claude Code (Opus) wrote the code in this feature, with me directing and
reviewing each step. Everything here is code I can explain and change.

The work ran through **AI Blueprint**, a workflow layer I have started using
recently, and honestly the main reason I wanted to share this submission rather
than just hand in the diff. It is not an app skeleton or a framework. It is a set
of plain-markdown skills plus a few context files that hold a project's
conventions, and it forces an AI-assisted build through the same gates a human
code review would apply:

- `blueprint/context/` holds the project overview, coding standards, and the one
  feature being built, and those files are loaded into every session. The agent
  works from written conventions rather than guessing from surrounding code.
- `/feature` turns a plan item into a spec with explicit build steps and
  done-when criteria, and stops for review before any code is written.
- `/implement` builds one step at a time. Each step shows a diff, an explanation,
  and evidence that its done-when holds. Nothing is committed without approval.
- `/complete` archives the spec to `blueprint/history/`, checks the plan item
  off, makes one squashed commit, and asks separately before merging and before
  pushing.

The visible artifacts in this repo: `base-app/blueprint/` holds the plans and the
archived spec for this feature at
`blueprint/history/features/06-cumulative-change-order-cost-delta-panel.md`, which
records the decisions above as they were made rather than reconstructed
afterwards. `AGENTS.md` and `CLAUDE.md` are the entry points.

What I get out of it is the thing the brief cares about: the spec was written and
argued over before any code existed, so the decisions table above is a record,
not a rationalization. The trade-off is real setup cost, and it is overkill for a
one-file change. For a 90-minute scoped feature it was roughly break-even on time
and clearly ahead on defensibility.

Happy to walk through it if it is interesting to you, and equally happy to be
told it is more ceremony than a feature this size deserves.
