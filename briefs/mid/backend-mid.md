# Backend Engineer (Mid) - Take-home story

**Timebox:** max 90 minutes. Stop at 90 min and document what's left and any trade-offs in `SOLUTION.md`.

## How this fits the interview

This **take-home task is marked** as part of your application — your submission is scored as part
of the process.

AI and tooling are allowed if disclosed in `SOLUTION.md`; if you are invited to later interview
stages, you must be able to explain and change your code.

## The team & the ask

You've joined the squad building the **Project Controls Hub** API (see
[base-app](../../base-app/README.md)). Until now change orders have only been seeded; planners need to
actually raise them from the product.

> **As a** planner working a live project,
> **I want** to raise a change order against the project and the right work package,
> **so that** proposed scope changes are captured in the system instead of in spreadsheets and email.

## Why it matters

A change order is a controlled financial event — it can move millions and shift the programme. A bad
or duplicate record undermines every downstream forecast and report, so the product has to be strict
about what gets saved.

## What good looks like

- **Given** a planner submits a valid change order for a project, **then** it is saved and returned
  with its reference, title, cost and schedule impact, status, and the date it was raised.
- **Given** the planner names a work package code that belongs to the project (e.g. structural, MEP),
  **then** the change order is linked to that package.
- **Given** the project does not exist, **when** a planner tries to raise a change order against it,
  **then** they receive a clear not-found response.
- **Given** a duplicate reference on the same project, a work package that does not belong to that
  project, cost or schedule impact that is zero or negative, or a status that is not appropriate for
  a newly raised change, **when** a planner submits, **then** creation fails with a clear validation
  error.
- **Given** the date raised is not supplied, **then** either a sensible default is applied or the
  planner is asked to provide one — explain your choice in `SOLUTION.md`.
- Planners can raise change orders through the API, and the contract reflects the new capability.

## Things to keep in mind

- Change orders can already be viewed in the product; your slice is **raising** them, not viewing
  them.
- Validation, sensible error responses, and failure-path tests are the priority; explain your validation in `SOLUTION.md`
- All new and existing tests must pass

## Handing it over

Fork the repo, make your changes, and send us a zip file with a short `SOLUTION.md`: your design, decisions, trade-offs, and any
AI/tooling you used.
