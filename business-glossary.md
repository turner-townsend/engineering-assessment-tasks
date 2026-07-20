# Business glossary — Project Controls Hub

Construction **project controls** terms used in the briefs, base app, and seed data. You are not
expected to be a domain expert; this is here so product stories and the app read clearly.

Technical field names (API / database) are **camelCase** in OpenAPI and TypeScript; the glossary
lists both where they differ.

---

## Context

| Term | Meaning |
| --- | --- |
| **Project controls** | The discipline of tracking cost, schedule, risk, and performance on construction projects so clients and contractors can see whether a job is on budget and on programme. |
| **Turner & Townsend** | The global construction consultancy this product scenario is built for — advising project owners on delivery, cost & schedule management, benchmarking, and reporting. |
| **Project Controls Hub** | The product in the base app: a web dashboard for portfolio oversight, project detail, change orders, and benchmarks. |

---

## People & personas (business roles)

These appear in user stories. They are **not** system roles or permissions in the app.

| Term | Who they are | Typical concerns |
| --- | --- | --- |
| **Controls manager** | Senior delivery / cost & schedule lead on a project or portfolio | Forecast accuracy, variance, approved change impact, board-ready numbers |
| **Planner** | Scheduler or project planner working the live programme | Raising change orders, modelling schedule impact, scenario “what-if” before approval |
| **Client / project owner** | Organisation funding the build (often off-screen in stories) | Overspend, delay, change-order exposure |
| **Board** | Governance body approving major changes | Combined cost/schedule effect of a set of change orders (see **scenario preview**) |

---

## Portfolio & project

| Term | Definition | In the app |
| --- | --- | --- |
| **Portfolio** | The set of construction projects managed at once | `GET /projects` — list with region, sector, status, headline KPIs |
| **Project** | A single construction job (e.g. hospital, metro line, logistics park) | Entity `Project`; detail view with cost, schedule, benchmarks |
| **Region** | Geographic market (e.g. UK, EU, APAC) | `region` on project; used for filtering and benchmark peer groups |
| **Sector** | Industry type of the asset (e.g. Healthcare, Transport, Industrial) | `sector` on project; drives benchmark metrics |
| **Project status** | Lifecycle stage of the job | `planning` · `in_delivery` · `on_hold` · `complete` |
| **Sanction / sanctioned budget** | Budget approved at project go-ahead | Represented as **`baselineCost`** on the project |
| **Currency** | Money unit for all costs on a project (ISO 4217, e.g. GBP, EUR, USD) | `currency` on project |

### Seed examples

| Project | Sector | Baseline | Notes |
| --- | --- | --- | --- |
| Riverside Hospital Expansion | Healthcare | GBP 120m | Two change orders in seed; one approved (+GBP 2.5m / +20 days) |
| Metro Line 4 Extension | Transport | EUR 450m | Large civil job; tunnelling work packages |
| Harbour Logistics Park | Industrial | USD 85m | Still in `planning` |

---

## Work breakdown

| Term | Definition | In the app |
| --- | --- | --- |
| **Work package (WP)** | A slice of project scope — often a trade or phase (Substructure, MEP, Tunnelling, Stations) | Entity `WorkPackage`; `code` (e.g. WP-01), `name`, `baselineCost` |
| **Scope** | The work the contract covers; changes to scope usually drive change orders | Not a separate entity; implied by work packages and change orders |
| **Roll-up** | Aggregating package-level costs or changes to project level | Cost snapshots and change orders link to `workPackageId` |

---

## Cost terms

| Term | Definition | In the app |
| --- | --- | --- |
| **Baseline cost** | Approved budget (at sanction or for a period / package) | `baselineCost` on project and work package; `baselineCost` on monthly **cost snapshot** |
| **Forecast cost** | Current best estimate of final or period cost | `forecastCost` on cost snapshot; used in cost trend chart |
| **Actual cost** | Cost recognised to date (spent or committed, depending on client rules) | `actualCost` on cost snapshot; **`actualCostToDate`** on project detail (sum of project-level actuals) |
| **Cost snapshot** | Monthly cost position for a project (optionally per work package) | Entity `CostSnapshot`; `periodMonth` |
| **Cost trend** | Time series of baseline / forecast / actual by month | `GET .../cost-trend`; Highcharts panel on project detail |
| **Cost variance** | Overspend or underspend vs baseline | **`costVariance`** = actual − baseline (positive = overspend) |
| **Variance %** | Variance as a percentage of baseline | Used in some briefs; not always stored |
| **Actual to date** | Cumulative actual cost on the project | `actualCostToDate` on project detail |
| **Forecast at completion (FAC)** | Expected final project cost after approved changes | **`forecastAtCompletion`** = `baselineCost` + sum of **`approved`** change-order `costDelta` |
| **Cost delta** | Incremental cost impact of a single change order | `costDelta` on `ChangeOrder` (can be negative in theory; seed uses positive) |

---

## Schedule terms

| Term | Definition | In the app |
| --- | --- | --- |
| **Milestone** | A named checkpoint on the programme (e.g. “Superstructure topped out”) | Entity `Milestone`; planned / forecast / actual dates |
| **Planned date** | Original schedule date for the milestone | `plannedDate` |
| **Forecast date** | Current expected date | `forecastDate` |
| **Actual date** | Date the milestone was achieved (if complete) | `actualDate` |
| **Schedule slippage** | Delay vs plan, in days | **`scheduleSlippageDays`** on project detail — worst slip across milestones |
| **Schedule delta (days)** | Programme impact of a change order | `scheduleDeltaDays` on `ChangeOrder` |
| **Programme** | The project schedule (UK English: *programme*; US: *schedule*) | Used interchangeably with schedule in stories |
| **RAG status** | Red / Amber / Green health indicator for a milestone | `ragStatus`: `red` · `amber` · `green` |

---

## Change orders

| Term | Definition | In the app |
| --- | --- | --- |
| **Change order (CO)** | Formal record of a scope, cost, or schedule change | Entity `ChangeOrder`; `reference` (e.g. CO-001), `title` |
| **Change order register** | List of all change orders on a project | `GET .../change-orders`; optional `status` filter |
| **Raised date** | When the change order was logged | `raisedDate` |
| **Reference** | Human-readable unique id per project (e.g. CO-001, CO-002) | `reference` — must be unique within a project |
| **Change order status** | Approval workflow state | `draft` · `submitted` · `approved` · `rejected` |
| **Approved change** | Change order that has passed approval — counts toward official forecast | Only `approved` rows sum into `approvedCostDelta`, `approvedScheduleDeltaDays`, FAC |
| **Open change order** | Not yet finally approved or rejected | In domain helpers: `draft` or `submitted` |
| **Scenario / what-if** | Temporary selection of change orders to preview combined impact before approval | Full-stack FE brief; not persisted in base app |
| **Impact summary** | Roll-up of baseline, approved deltas, FAC, counts by status | `GET .../impact-summary` |

---

## Risk

| Term | Definition | In the app |
| --- | --- | --- |
| **Risk event** | A identified risk or issue with cost/schedule consequences | Entity `RiskEvent` |
| **Severity** | How serious the risk is if it happens | `low` · `medium` · `high` · `critical` |
| **Probability** | Likelihood (0–1) | `probability` |
| **Cost impact** | Estimated cost if risk materialises | `costImpact` |
| **Schedule impact (days)** | Estimated programme effect | `scheduleImpactDays` |
| **Link to change order** | Risk raised or driven by a specific CO | Optional `changeOrderId` |

---

## Benchmarking

| Term | Definition | In the app |
| --- | --- | --- |
| **Benchmark** | Comparison of this project’s unit metrics against similar projects | Benchmark panel on project detail |
| **Peer project** | Other jobs in the same sector/region used as a comparison set | Not stored individually — only aggregate stats |
| **Metric key** | What is being compared (e.g. cost per m², cost per bed, cost per km) | `metricKey` |
| **Peer median** | Middle value of the peer group | `peerMedian` |
| **P25 / P75** | 25th and 75th percentiles of peers | `peerP25`, `peerP75` |
| **Benchmark position** | Where this project sits vs peers | `below_p25` · `p25_to_median` · `median_to_p75` · `above_p75` |
| **Unit** | Measurement unit for the metric (GBP/m², EUR/km, etc.) | `unit` on benchmark metric |

---

## Derived metrics (computed, not stored)

| Term | Formula (simplified) | Used in |
| --- | --- | --- |
| **Cost variance** | actual − baseline (project-level periods) | Project detail KPIs |
| **Forecast at completion** | baseline + Σ approved `costDelta` | Impact summary, scenario preview |
| **Approved cost delta** | Σ `costDelta` where status = approved | Impact summary, FE summaries |
| **Approved schedule delta** | Σ `scheduleDeltaDays` where status = approved | Impact summary |
| **Open change order count** | Count where status ∈ {draft, submitted} | Project detail |
| **Counts by status** | Count of COs per status | Impact summary |
| **Cumulative cost impact** | Running sum of `costDelta` over time (often by `raisedDate` month) | Frontend chart brief |
| **Cost summary** | baseline, actual to date, variance for a project | Full-stack FE brief |

---

## Abbreviations

| Abbrev | Expansion |
| --- | --- |
| **CO** | Change order |
| **FAC** | Forecast at completion |
| **WP** | Work package |
| **MEP** | Mechanical, electrical & plumbing (building services package) |
| **KPI** | Key performance indicator (headline numbers on portfolio/detail) |
| **RAG** | Red / Amber / Green status |
| **APAC** | Asia-Pacific (region label in seed data) |

---

## API & UI naming quirks

| Business term | API / code name | Note |
| --- | --- | --- |
| Work package | `workPackageId` | Optional on change orders and cost trend filter |
| Raised date | `raisedDate` | Used for time-series grouping in charts |
| Cost delta | `costDelta` | Not `costImpact` (that's on risk events) |
| Schedule slip (headline) | `scheduleSlippageDays` | Project-level worst case, not sum of COs |
| Period | `periodMonth` | First day of month (date) |

---

## Related docs

| Doc | Purpose |
| --- | --- |
| [Domain model](base-app/domain-model.md) | Entity relationships and ERD |
| [Seed data](base-app/contracts/seed-data.json) | Deterministic example numbers |
| [Briefs](briefs/README.md) | Take-home tasks |
| [README](README.md) | Candidate package overview |
