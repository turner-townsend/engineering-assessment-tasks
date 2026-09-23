# Build Plan

> One of the two planning docs you provide. Write it directly, develop it through
> any AI conversation, or optionally run `/discovery`. Keep the items high-level
> even when `project-plan.md` is detailed; later `/feature` specs hold the depth
> for each build item.

Items 1-5 shipped with the base app before this branch existed. They are checked
because they already work, not because they were built through this loop. Item 6
is the take-home brief; item 7 is the write-up that ships with it.

## Shipped in the base app

- [x] 1. **Project portfolio** - project list with region, sector, status, and headline KPIs
- [x] 2. **Project detail** - baseline vs actuals-to-date, cost variance, schedule slippage
- [x] 3. **Cost trend chart** - monthly baseline/forecast/actual time series in Highcharts
- [x] 4. **Schedule milestones** - milestone table with planned/forecast/actual dates and RAG status
- [x] 5. **Benchmark panel** - project unit metrics compared against peer percentiles

## Take-home brief

- [x] 6. **Cumulative change-order cost delta panel** - running total of change-order
  cost deltas by month on the project detail page, with a client-side status filter
  (all vs approved only) and explicit loading, error, and empty states
- [x] 7. **SOLUTION.md** - design, trade-offs, what's next, and AI/tooling disclosure

> TODO (confirm): item 6 is one feature-sized outcome but has two distinct halves
> (the store's derived signals, then the chart panel). Expect `/feature` to split
> it into 6a and 6b.
