"""Deterministic seed loader.

Reads contracts/seed-data.json (the shared seed contract) and populates the database.
Idempotent: it only seeds when the project table is empty. UUIDs not present in the seed
(cost snapshots, benchmark metrics) are derived deterministically with uuid5 so repeated
seeds produce identical rows.
"""

from __future__ import annotations

import uuid
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.db.models import (
    BenchmarkMetric,
    ChangeOrder,
    CostSnapshot,
    Milestone,
    Project,
    RiskEvent,
    WorkPackage,
)
from app.seed_models import SeedData

_NS = uuid.UUID("00000000-0000-0000-0000-0000000000aa")


def _det_id(*parts: str) -> str:
    return str(uuid.uuid5(_NS, "|".join(parts)))


def load_seed(path: str | Path) -> SeedData:
    return SeedData.model_validate_json(Path(path).read_text())


def seed_database(db: Session, seed_path: str | Path | None = None) -> bool:
    """Seed the DB if empty. Returns True if data was inserted, False if skipped."""
    if db.scalar(select(Project).limit(1)) is not None:
        return False

    data = load_seed(seed_path or get_settings().seed_path)

    for p in data.projects:
        db.add(
            Project(
                id=p.id,
                name=p.name,
                region=p.region,
                sector=p.sector,
                status=p.status,
                start_date=p.start_date,
                planned_end_date=p.planned_end_date,
                baseline_cost=p.baseline_cost,
                currency=p.currency,
            )
        )
    db.flush()  # parents must exist before FK-bearing children (enforced on Postgres)

    for w in data.work_packages:
        db.add(
            WorkPackage(
                id=w.id,
                project_id=w.project_id,
                code=w.code,
                name=w.name,
                baseline_cost=w.baseline_cost,
            )
        )
    db.flush()

    for c in data.cost_snapshots:
        db.add(
            CostSnapshot(
                id=_det_id(
                    "cs",
                    c.project_id,
                    str(c.work_package_id),
                    c.period_month.isoformat(),
                ),
                project_id=c.project_id,
                work_package_id=c.work_package_id,
                period_month=c.period_month,
                baseline_cost=c.baseline_cost,
                forecast_cost=c.forecast_cost,
                actual_cost=c.actual_cost,
            )
        )

    for m in data.milestones:
        db.add(
            Milestone(
                id=m.id,
                project_id=m.project_id,
                name=m.name,
                planned_date=m.planned_date,
                forecast_date=m.forecast_date,
                actual_date=m.actual_date,
                rag_status=m.rag_status,
            )
        )

    for co in data.change_orders:
        db.add(
            ChangeOrder(
                id=co.id,
                project_id=co.project_id,
                work_package_id=co.work_package_id,
                reference=co.reference,
                title=co.title,
                status=co.status,
                cost_delta=co.cost_delta,
                schedule_delta_days=co.schedule_delta_days,
                raised_date=co.raised_date,
            )
        )
    db.flush()  # change orders must exist before risk_event.change_order_id FK

    for r in data.risk_events:
        db.add(
            RiskEvent(
                id=r.id,
                project_id=r.project_id,
                change_order_id=r.change_order_id,
                title=r.title,
                severity=r.severity,
                probability=r.probability,
                cost_impact=r.cost_impact,
                schedule_impact_days=r.schedule_impact_days,
            )
        )

    for b in data.benchmark_metrics:
        db.add(
            BenchmarkMetric(
                id=_det_id("bm", b.sector, b.region, b.metric_key),
                sector=b.sector,
                region=b.region,
                metric_key=b.metric_key,
                peer_median=b.peer_median,
                peer_p25=b.peer_p25,
                peer_p75=b.peer_p75,
                unit=b.unit,
            )
        )

    db.commit()
    return True
