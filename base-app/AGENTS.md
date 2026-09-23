# AGENTS.md

Instructions for AI coding agents working in this project. This is the cross-tool
entry point: Codex, OpenCode, Cursor, GitHub Copilot, Gemini CLI, Aider, Zed,
Windsurf, and others read `AGENTS.md`. Claude Code reads `CLAUDE.md`, which imports
this file, so there is a single source of truth.

## What this is

**Project Controls Hub** - a web app for monitoring cost, schedule, risk, and
benchmark performance across a portfolio of construction projects. It is the
Turner & Townsend engineering take-home base app: it ships pre-built and working,
and the current work extends it with one scoped feature from
[`../briefs/mid/frontend-mid.md`](../briefs/mid/frontend-mid.md).

Nx monorepo: an Angular 21 frontend (`apps/hub`), a FastAPI service
(`apps/api`), a generated typed API client (`libs/api-client`), and shared domain
types (`libs/domain`). Read [`README.md`](README.md),
[`architecture.md`](architecture.md), and
[`domain-model.md`](domain-model.md) for the domain and layout.

This project is built with the **AI Blueprint**, a workflow layer, not an
app skeleton. To start a new project, scaffold the app first in an empty folder
(create-next-app, Vite, etc.), then overlay these files on top. Never run a
framework scaffolder inside a directory that already holds the blueprint files
(`AGENTS.md`, `CLAUDE.md`, `.agents/`, `.claude/`, `blueprint/`); it fails
because the directory isn't empty.

The workflow is defined by the local skills and context files below.

## Read these for full context

- `blueprint/config.json` - deterministic project workflow settings
- `blueprint/context/project-overview.md` - the project's source of truth
- `blueprint/context/coding-standards.md` - conventions to follow
- `blueprint/context/ai-interaction.md` - how to work with the user on this project
- `blueprint/context/current-feature.md` - the one feature, fix, or rollback being built right now

## Project configuration

`blueprint/config.json` is the user-owned, machine-readable workflow policy for
this project. Workflow skills read the relevant settings before acting. A
missing file means built-in defaults. An invalid file falls back to defaults for
read-only status reporting, but mutating workflow commands stop and point to
`/doctor` instead of guessing.

Configuration can make review or verification stricter and can tune local
branch names and automated-mode limits. It never grants permission to commit,
merge, push, deploy, publish, send, delete data, waive a failing check, or accept
a finding. Those approval and safety boundaries are not configurable.

`qualityGates.regular` controls automatic audit, check, and try-guide behavior
for the normal workflow and Autopilot. `qualityGates.continuous` controls the
same per-feature gates for Continuous Mode. Every gate defaults to `manual`, so
the named skill runs only when explicitly requested. The conditional modes are
`when-sensitive` for audit, `when-behavioral` for check, and `when-user-facing`
for try guides. `always` runs the gate for every work item in that workflow.

## Workflow

Build one feature, fix, or rollback at a time, behind review gates. Each step's instructions
are plain markdown skills any capable agent can read and follow. The workflow is
exposed through tool-specific adapters:

- Claude Code: `.claude/skills/<skill>/SKILL.md`

This project installs the Claude Code adapter only. The Blueprint also ships an
`.agents/skills/` tree for Codex, GitHub Copilot, and OpenCode; it is a byte-identical
copy of `.claude/skills/` and was removed here because nothing in this project reads
it. `AGENTS.md` stays: `CLAUDE.md` imports it, and other tools read it directly.

Core skills:

- `onboard` - tune commands, standards, visibility, ignore rules, and tool adapters after overlaying the Blueprint onto a freshly scaffolded or early project
- `discovery` - optional deep, multi-turn planning conversation that drafts the two user-owned plans only after review and approval; direct plan writing remains fully supported
- `doctor` - read-only Blueprint health check for setup, adapters, plans, overview freshness, and workflow drift
- `adopt` - bootstrap the Blueprint into an existing brownfield app with shipped features
- `overview` - distill the two planning docs into `blueprint/context/project-overview.md`
- `brief` - read-only briefing on an upcoming build-plan feature (scope, dependencies, size) before you spec it
- `feature` - turn a build-plan item into a spec, or propose a reviewed plan addition for a genuinely new feature
- `debug` - reproduce and isolate a failure without editing code, then hand the evidence to `fix` or `implement`
- `fix` - document an ad-hoc bug or change into `blueprint/context/current-feature.md`
- `tests` - add or normalize unit testing and turn on the test gate
- `ci` - explicitly set up one project-specific Verify command and matching automatic GitHub checks
- `implement` - build the current spec one small, reviewed step at a time
- `check` - prove the current spec against the running app
- `try` - read-only manual review guide: where to go, what to click, what to expect
- `audit` - branch-aware or full-project review across all concerns or a focused quality, security, performance, or tests lens; records findings with durable IDs and statuses in `blueprint/context/findings.md`, where open or fixed P0/P1 findings block `complete`
- `rollback` - plan a safe reversal of a completed feature from its archive and exact git commit, with later-dependency review before code changes
- `complete` - run the final safety pass, log features, fixes, or rollbacks under `blueprint/history/`, then merge with approval
- `release` - optional Render or Vercel deployment readiness, local config, env review, and smoke-test planning
- `prototype` - optional, pre-build static mockups to lock the look
- `status` - read-only progress summary, workflow drift warning, and suggested next action

In Codex, invoke these as skills (`$onboard`, `$discovery`, `$overview`, `$feature`,
`$implement`, and so on) or ask naturally, such as "run the overview." In Claude
Code, use the slash commands (`/onboard`, `/discovery`, `/overview`, `/feature`,
and so on). In OpenCode or other tools without a dedicated invocation syntax,
ask the agent to run the matching skill or follow its `SKILL.md` manually. The
conventions in `blueprint/context/` apply however a step is invoked. `/discovery`
is never required: users may write detailed plans directly or develop them
through any conversation before running `/overview`.

Optional explicit-only skill: `autopilot` can run one bounded spec/build pass
when directly invoked, including the configured regular quality gates. It may
create checkpoint commits on the feature or fix branch after passing steps and
repair confirmed P0/P1 findings when its audit gate runs. It stops before
`/complete`, merge, push, deploy, or destructive actions.

Optional explicit-only skill: `continuous` can resume or select the next planned
feature and repeat the complete local feature lifecycle through the configured
limit or end of the build plan. It creates one branch and one local main commit
per feature, applies the Continuous quality gates, archives and merges serially,
and stops on decisions or failed safety gates. It never pushes, deploys,
publishes, sends, or performs destructive actions.

Deployment is also explicit. `/release` can prepare local Render or Vercel config
and run readiness checks, but it must stop before deploy, remote service changes,
push, or publish unless the user gives a separate yes in the current chat.

## Automatic verification

Automatic GitHub checks are a separate explicit setup. `/onboard` and `/adopt`
only report existing checks and point to `/ci` or `$ci` when none exist. Running
`/ci` inspects the real project and defines one `Verify` command from checks that
already exist. Use this order when available: typecheck, tests, then build. Never
invent a test runner or another check just to fill the command.

For JavaScript and TypeScript projects, prefer a package script such as `verify`
and use the detected package manager. For other stacks, use the native task
runner or exact combined command. Record the exact command under Commands below.

The optional `.github/workflows/verify.yml` must run that same command for pull
requests and pushes to the default branch. Preserve existing workflows, use the
project's real runtime and install command, and grant only `contents: read` by
default. This setup does not add local git hooks, coverage, browser tests,
security scans, or version matrices. Those remain later project choices.

GitHub branch protection or a ruleset can require the check after the repository
is pushed, but that is a separate remote setting. Missing automatic GitHub
checks do not make the Blueprint unusable.

## Commands

Run everything from `base-app/`. Yarn 4 with Node 22.22.3, pinned by Volta.

Frontend (Angular 21 + Nx):

- Install: `yarn install`
- Dev server: `yarn nx serve hub` (http://localhost:4200)
- Build: `yarn nx build hub`
- Test: `yarn nx test hub` (Vitest)
- E2E: `yarn nx e2e hub-e2e` (Cypress; needs the app and API running)

API (FastAPI + uv, from `apps/api` unless noted):

- Stack with Postgres: `docker compose -f infra/docker-compose.yml up --build`
  (API on http://localhost:8000, Postgres on host port 5433)
- Standalone (SQLite, auto-seeds): `uv sync && uv run uvicorn app.main:app --reload`
- Test: `uv run pytest`
- Lint + typecheck: `yarn api:lint` from the repo root (Ruff + mypy)
- Regenerate the typed client after an API change: `yarn api-client:generate`

There is no combined `Verify` command and no frontend ESLint config. Run `/ci` or
`$ci` if you want one Verify command defined; do not invent either mid-feature.

The test gate is **on**: `yarn nx test hub` is the frontend test command. API
changes must also pass `uv run pytest` and `yarn api:lint`.
