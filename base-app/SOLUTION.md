# Solution

- New NgRx Signal Store added to `app/data-access` to store state for the new table in style of the other 2 stores (`project-change-order-cost.store.ts`)
- Store allows filtering by all / approved and computes changes by month (which was not part of the raw data)
- New `cost-delta-chart.component.ts` created. Highchart component in the style of the existing `cost-trend-chart.component.ts`
- The new component along with template controls for loading and error states added to `project-detail.component.ts`

TODO

- Ran out of time to add tests. Would have added a `project-change-order-cost.store.spec.ts` file to test the filtering and monthly grouping against dummy data

TOOLS

- Zed IDE with autocompletes enabled. Opencode running GLM 5.2 for brainstorming, validation, some code generation in plan mode. Code copied / edited / checked by hand.
