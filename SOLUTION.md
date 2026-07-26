# SOLUTION

A chart on the project detail page showing the cumulative change-order cost delta by month, with an
All / Approved filter. The filter works on data already in the browser, so it never calls the server.

## Design

Added a chart `app-cost-delta-chart` to the `app-project-detail` page, with an All / Approved toggle above it. The chart gets its data from `cumulativeCostDelta()`, which is built in `project-detail.store.ts` like this:

Call `listChangeOrders` inside the `forkJoin` that was already there, so the change orders arrive with the rest of the page data. One request, on page load.

`visibleCostDelta` filters those orders by status. The toggle only sets a `showOnlyApproved` boolean, so this is where "All vs Approved" happens.

`cumulativeCostDelta` takes the filtered orders, groups them by month, and adds each month onto the running total.

For the month I take the first 7 characters of `raisedDate` (`YYYY-MM`) and sort as text. I did this instead of parsing a `Date` because time zones can push an order dated the 1st into the month before, which would put the cost in the wrong period.

## Tests

`getVisibleChangeOrders` and `getCumulativeByMonth` are plain exported functions, so they are tested directly without TestBed.

## Trade-offs

No empty state for this panel. Loading and error are handled at page level, but a project with no change orders shows an empty chart instead of a message. This is the part of the brief I did not finish, and the first thing I would fix.

## With more time

Add the empty state that the toggle redraws the chart. Add proper labels on the toggle for screen readers.

## AI / tooling

Used Claude Code as an assistant during the task, and to review this write-up.
