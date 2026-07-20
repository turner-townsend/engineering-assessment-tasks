from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.base import get_db
from app.db.models import BenchmarkMetric, Project
from app.domain import calculations as calc
from app.routers.deps import get_project_or_404
from app.schemas import BenchmarkComparison

router = APIRouter(prefix="/projects", tags=["benchmarks"])

# Base-app demo logic: notional project quantities used to turn a project's total
# baseline cost into a unit metric (e.g. cost per m2). Kept in code (not the schema)
# to leave the domain model minimal; the Mid benchmark task replaces/extends this.
_NOTIONAL_QUANTITY: dict[tuple[str, str], float] = {
    # (project_id, metric_key): quantity
    ("11111111-1111-1111-1111-111111111111", "cost_per_m2"): 20000.0,
    ("11111111-1111-1111-1111-111111111111", "cost_per_bed"): 240.0,
    ("22222222-2222-2222-2222-222222222222", "cost_per_km"): 4.0,
    ("33333333-3333-3333-3333-333333333333", "cost_per_m2"): 70000.0,
}


def _compute_comparisons(project: Project, db: Session) -> list[BenchmarkComparison]:
    """Compute unit-cost metrics for a project and rank against sector/region peers."""
    metrics = list(
        db.scalars(
            select(BenchmarkMetric)
            .where(BenchmarkMetric.sector == project.sector)
            .where(BenchmarkMetric.region == project.region)
            .order_by(BenchmarkMetric.metric_key)
        )
    )
    out: list[BenchmarkComparison] = []
    for m in metrics:
        quantity = _NOTIONAL_QUANTITY.get((project.id, m.metric_key))
        if not quantity:
            continue
        project_value = round(float(project.baseline_cost) / quantity, 2)
        out.append(
            BenchmarkComparison(
                metric_key=m.metric_key,
                unit=m.unit,
                project_value=project_value,
                peer_median=float(m.peer_median),
                peer_p25=float(m.peer_p25),
                peer_p75=float(m.peer_p75),
                position=calc.benchmark_position(
                    project_value,
                    float(m.peer_p25),
                    float(m.peer_median),
                    float(m.peer_p75),
                ),
            )
        )
    return out


@router.get(
    "/{project_id}/benchmarks",
    response_model=list[BenchmarkComparison],
    operation_id="getProjectBenchmarks",
)
def get_project_benchmarks(
    project: Annotated[Project, Depends(get_project_or_404)],
    db: Annotated[Session, Depends(get_db)],
) -> list[BenchmarkComparison]:
    """Return benchmark comparisons for a project."""
    return _compute_comparisons(project, db)
