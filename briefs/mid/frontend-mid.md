# Frontend Engineer (Mid) - Take-home story

**Timebox:** max 90 minutes. Stop at 90 min and document what's left and any trade-offs in `SOLUTION.md`.

## How this fits the interview

This **take-home task is marked** as part of your application — your submission is scored as part
of the process.

AI and tooling are allowed if disclosed in `SOLUTION.md`; if you are invited to later interview
stages, you must be able to explain and change your code.

For pre-requisites regarding tooling and how to run the app, please see [the base-app README](../../base-app/README.md). Note that you will need Docker, despite this being a FE exercise. This is so that you can run the entire app locally. But you shouldn't need to install Python.

## The team & the ask

You've joined the squad building the **Project Controls Hub** (see
[base-app](../../base-app/README.md)). Controls managers struggle to see the the cost deltas of their change orders over the life of the project. Further, they struggle to differentiate between all requested changes and only the approved changes.

This is the product goal of the new feature:

> **As a** controls manager,
> **I want** to see how change-order cost deltas accumulates over time, and to focus on just the
> approved ones,
> **so that** I can understand the cost trend when I brief the project board.

To build this feature, you can refer to the [business glossary](../../business-glossary.md) - though the main term that might be unfamiliar to you that you can check here is **Cost delta** in the **Cost terms** section

## Why it matters

A "current total" number hides the story and doesn't indicate when drastic changes happen. Whereas a chart can show changing data over time. For example, a line that climbs steeply in one quarter tells a manager exactly when
control slipped. Further, being able to flip between "all" and "only approved" changes lets them separate
noise (early drafts) from committed costs.

## What good looks like

- **Given** I'm on the homepage of the app, **and** I click on a project tile to navigate to a project's detail page, **then** I see a panel with a chart of **cumulative cost
  delta by month** (a running total of change-order cost deltas over time).
- **Given** I change the status filter (e.g. all -> approved only), **then** the chart updates immediately, **without** the app going back
  to the server.
- **Given** data is loading / fails / is empty, **then** each of those states is displayed clearly **so that** the user understands when data is loading, when it fails, or when there are no results.

## Things to keep in mind

- The change-order data comes from the existing API (`listChangeOrders`, as seen in the `api-client.service.ts` file); recompute the filtered view on the client.
- We care about _how_ you model this: derived values should be computed, memoized signals in a
  Signal Store - not recalculated ad hoc in the template.
- Use current Angular features and standards (standalone components, signals, new control flow). Charts use Highcharts. See the pre-existing chart as an example.
- Tests should cover the interesting logic: the cumulative sum and the filtering.
- Out of scope: persisting anything, new backend endpoints.

## Handing it over

Open a PR (or send a zip/patch) with a short `SOLUTION.md`: your design, trade-offs, what you'd
improve with more time, and any AI/tooling you used.
