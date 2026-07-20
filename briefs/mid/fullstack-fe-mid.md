# Full-Stack, Frontend-Leaning (Mid) - Take-home story

**Timebox:** max 90 minutes. Stop at 90 min and document what's left and any trade-offs in `SOLUTION.md`.

## How this fits the interview

This **take-home task is marked** as part of your application — your submission is scored as part
of the process.

AI and tooling are allowed if disclosed in `SOLUTION.md`; if you are invited to later interview
stages, you must be able to explain and change your code.

**Where the weight sits:** mostly frontend (about two-thirds), with a focused backend slice.

## The team & the ask

You've joined the squad building the **Project Controls Hub** (see
[base-app](../../base-app/README.md)). Before a planner takes a set of changes to the board, they want
to play out "what if we approve these?" without committing anything.

> **As a** planner,
> **I want** to select a set of change orders and immediately see the projected final cost and
> programme impact,
> **so that** I can compare scenarios before recommending which changes to approve.

## Why it matters

Approving change orders is a board-level decision. Letting a planner model the combined effect of a
selection - rather than approving them one by one and hoping - turns a guess into an informed
recommendation, and reduces costly reversals.

## What good looks like

- **Given** I'm on a project's detail page, **then** I see a **Scenario preview** panel listing the
  project's change orders with checkboxes, with the currently-approved ones selected by default.
- **Given** I tick or untick change orders, **then** the panel immediately recalculates: the proposed
  forecast at completion (baseline + selected cost deltas), the cost delta and percentage, and the
  total schedule impact in days.
- **Given** the panel loads, **then** it also shows the project's current **approved** position
  (baseline, approved cost impact, forecast at completion) for comparison, fetched from the API.
- Loading / error / empty states are handled.

## Things to keep in mind

- The combined backend slice is small: an endpoint that returns the project's current approved impact
  summary (reflected in the API contract, with a test). The scenario maths happens on the client.
- We care how you model the derived values: computed, memoized signals in a Signal Store, not template
  arithmetic. Current Angular idioms (standalone, signals, new control flow). Add tests for the
  computed metrics.
- Out of scope (for now): saving scenarios.

## Handing it over

Open a PR (or send a zip/patch) with a short `SOLUTION.md`: your design, trade-offs, and any
AI/tooling you used.
