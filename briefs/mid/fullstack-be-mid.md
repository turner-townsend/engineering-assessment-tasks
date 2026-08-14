# Full-Stack, Backend-Leaning (Mid) - Take-home story

**Timebox:** max 90 minutes. Stop at 90 min and document what's left and any trade-offs in `SOLUTION.md`.

## How this fits the interview

This **take-home task is marked** as part of your application — your submission is scored as part
of the process.

AI and tooling are allowed if disclosed in `SOLUTION.md`; if you are invited to later interview
stages, you must be able to explain and change your code.

**Where the weight sits:** mostly backend (about two-thirds), with a thin UI slice.

## The team & the ask

You've joined the squad building the **Project Controls Hub** (see
[base-app](../../base-app/README.md)). Change orders can be seen but not yet created in the product;
planners need to raise them directly from the project page.

> **As a** planner working a live project,
> **I want** to raise a change order from the project page,
> **so that** proposed scope changes are captured in the system the moment we identify them.

## Why it matters

A change order is a controlled financial event that can move millions and shift the programme. The
product must validate submissions strictly, and the planner needs immediate, honest feedback when
something is wrong — not a silent failure or a generic error page.

## What good looks like

- **Given** a planner submits a valid change order for a project, **then** it is saved and returned
  with its reference, title, cost and schedule impact, status, and the date it was raised.
- **Given** the planner names a work package code that belongs to the project, **then** the change order is
  linked to that package.
- **Given** the project does not exist, a duplicate reference on the same project, a work package that
  does not belong to that project, invalid cost or schedule impact, or a status that is not
  appropriate for a newly raised change, **when** a planner submits from the project page, **then**
  they see a clear, specific error.
- **Given** I'm on the project detail page, **then** I can fill a small **New change order** form and
  submit it; on success the new change order appears in the UI, and on failure I see a clear error.
- Planners can raise change orders through the product, and the API contract reflects the new
  capability.

## Things to keep in mind

- Your slice is enabling **raise** end-to-end: a validated API and a thin create form on the project
  detail page.
- Validation, sensible error responses, and failure-path tests are the priority; explain your validation in `SOLUTION.md`
- All new and existing tests must pass

## Handing it over

Fork the repo, make your changes, and send us a zip file with a short `SOLUTION.md`: your design, decisions, trade-offs, and any
AI/tooling you used.
