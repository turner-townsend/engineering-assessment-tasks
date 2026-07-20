from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.base import get_db
from app.db.models import CostSnapshot, Milestone, Project
from app.domain import calculations as calc
from app.routers.deps import get_project_or_404
from app.schemas import CostSnapshot as CostSnapshotSchema
from app.schemas import Milestone as MilestoneSchema
from app.schemas import Project as ProjectSchema
from app.schemas import ProjectDetail

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("", response_model=list[ProjectSchema], operation_id="listProjects")
def list_projects(
    db: Annotated[Session, Depends(get_db)],
    region: str | None = Query(default=None),
    sector: str | None = Query(default=None),
    status: str | None = Query(default=None),
) -> list[Project]:
    """Return all projects, optionally filtered by region, sector, or status."""
    stmt = select(Project)
    if region:
        stmt = stmt.where(Project.region == region)
    if sector:
        stmt = stmt.where(Project.sector == sector)
    if status:
        stmt = stmt.where(Project.status == status)
    return list(db.scalars(stmt.order_by(Project.name)))


@router.get("/{project_id}", response_model=ProjectDetail, operation_id="getProject")
def get_project(
    project: Annotated[Project, Depends(get_project_or_404)],
    db: Annotated[Session, Depends(get_db)],
) -> ProjectDetail:
    """Return a single project with computed headline KPIs."""
    snapshots = list(db.scalars(select(CostSnapshot).where(CostSnapshot.project_id == project.id)))
    milestones = list(db.scalars(select(Milestone).where(Milestone.project_id == project.id)))

    return ProjectDetail(
        id=project.id,
        name=project.name,
        region=project.region,
        sector=project.sector,
        status=project.status,
        start_date=project.start_date,
        planned_end_date=project.planned_end_date,
        baseline_cost=float(project.baseline_cost),
        currency=project.currency,
        actual_cost_to_date=calc.actual_cost_to_date(snapshots),
        cost_variance=calc.cost_variance(snapshots),
        schedule_slippage_days=calc.schedule_slippage_days(milestones),
        open_change_order_count=calc.open_change_order_count(project.change_orders),
    )


@router.get(
    "/{project_id}/cost-trend",
    response_model=list[CostSnapshotSchema],
    operation_id="getCostTrend",
)
def get_cost_trend(
    project: Annotated[Project, Depends(get_project_or_404)],
    db: Annotated[Session, Depends(get_db)],
    work_package_id: str | None = Query(default=None, alias="workPackageId"),
) -> list[CostSnapshot]:
    """Return monthly cost time-series for a project, optionally scoped to a work package."""
    stmt = select(CostSnapshot).where(CostSnapshot.project_id == project.id)
    if work_package_id is not None:
        stmt = stmt.where(CostSnapshot.work_package_id == work_package_id)
    else:
        stmt = stmt.where(CostSnapshot.work_package_id.is_(None))
    return list(db.scalars(stmt.order_by(CostSnapshot.period_month)))


@router.get(
    "/{project_id}/milestones",
    response_model=list[MilestoneSchema],
    operation_id="listMilestones",
)
def list_milestones(
    project: Annotated[Project, Depends(get_project_or_404)],
    db: Annotated[Session, Depends(get_db)],
) -> list[Milestone]:
    """Return schedule milestones for a project, ordered by planned date."""
    return list(
        db.scalars(
            select(Milestone)
            .where(Milestone.project_id == project.id)
            .order_by(Milestone.planned_date)
        )
    )
