-- Project Controls Hub - PostgreSQL schema (base app, pre-built)
-- Source of truth for the domain model in ../domain-model.md.
-- Candidate migrations build on top of this (e.g. add columns/tables for change-order impact).

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE project (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT        NOT NULL,
    region          TEXT        NOT NULL,
    sector          TEXT        NOT NULL,
    status          TEXT        NOT NULL CHECK (status IN ('planning','in_delivery','on_hold','complete')),
    start_date      DATE        NOT NULL,
    planned_end_date DATE       NOT NULL,
    baseline_cost   NUMERIC(14,2) NOT NULL,
    currency        CHAR(3)     NOT NULL DEFAULT 'GBP',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE work_package (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID        NOT NULL REFERENCES project(id) ON DELETE CASCADE,
    code            TEXT        NOT NULL,
    name            TEXT        NOT NULL,
    baseline_cost   NUMERIC(14,2) NOT NULL,
    UNIQUE (project_id, code)
);

CREATE TABLE cost_snapshot (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID        NOT NULL REFERENCES project(id) ON DELETE CASCADE,
    work_package_id UUID        REFERENCES work_package(id) ON DELETE CASCADE,
    period_month    DATE        NOT NULL, -- first day of month
    baseline_cost   NUMERIC(14,2) NOT NULL,
    forecast_cost   NUMERIC(14,2) NOT NULL,
    actual_cost     NUMERIC(14,2) NOT NULL,
    UNIQUE (project_id, work_package_id, period_month)
);

CREATE TABLE milestone (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID        NOT NULL REFERENCES project(id) ON DELETE CASCADE,
    name            TEXT        NOT NULL,
    planned_date    DATE        NOT NULL,
    forecast_date   DATE,
    actual_date     DATE,
    rag_status      TEXT        NOT NULL CHECK (rag_status IN ('red','amber','green'))
);

CREATE TABLE change_order (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id        UUID      NOT NULL REFERENCES project(id) ON DELETE CASCADE,
    work_package_id   UUID      REFERENCES work_package(id) ON DELETE SET NULL,
    reference         TEXT      NOT NULL,
    title             TEXT      NOT NULL,
    status            TEXT      NOT NULL CHECK (status IN ('draft','submitted','approved','rejected')),
    cost_delta        NUMERIC(14,2) NOT NULL DEFAULT 0,
    schedule_delta_days INT     NOT NULL DEFAULT 0,
    raised_date       DATE      NOT NULL DEFAULT CURRENT_DATE,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (project_id, reference)
);

CREATE TABLE risk_event (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id          UUID    NOT NULL REFERENCES project(id) ON DELETE CASCADE,
    change_order_id     UUID    REFERENCES change_order(id) ON DELETE SET NULL,
    title               TEXT    NOT NULL,
    severity            TEXT    NOT NULL CHECK (severity IN ('low','medium','high','critical')),
    probability         NUMERIC(3,2) NOT NULL CHECK (probability >= 0 AND probability <= 1),
    cost_impact         NUMERIC(14,2) NOT NULL DEFAULT 0,
    schedule_impact_days INT    NOT NULL DEFAULT 0
);

CREATE TABLE benchmark_metric (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sector      TEXT          NOT NULL,
    region      TEXT          NOT NULL,
    metric_key  TEXT          NOT NULL, -- e.g. 'cost_per_m2', 'cost_per_bed'
    peer_median NUMERIC(14,4) NOT NULL,
    peer_p25    NUMERIC(14,4) NOT NULL,
    peer_p75    NUMERIC(14,4) NOT NULL,
    unit        TEXT          NOT NULL,
    UNIQUE (sector, region, metric_key)
);

CREATE INDEX idx_cost_snapshot_project_period ON cost_snapshot (project_id, period_month);
CREATE INDEX idx_change_order_project_status  ON change_order (project_id, status);
CREATE INDEX idx_milestone_project            ON milestone (project_id);
CREATE INDEX idx_risk_event_project           ON risk_event (project_id);
