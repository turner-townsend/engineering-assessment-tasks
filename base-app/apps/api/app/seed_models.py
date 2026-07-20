"""Typed models for contracts/seed-data.json."""

from datetime import date

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class SeedModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
    )


class SeedProject(SeedModel):
    id: str
    name: str
    region: str
    sector: str
    status: str
    start_date: date
    planned_end_date: date
    baseline_cost: float
    currency: str


class SeedWorkPackage(SeedModel):
    id: str
    project_id: str
    code: str
    name: str
    baseline_cost: float


class SeedCostSnapshot(SeedModel):
    project_id: str
    work_package_id: str | None = None
    period_month: date
    baseline_cost: float
    forecast_cost: float
    actual_cost: float


class SeedMilestone(SeedModel):
    id: str
    project_id: str
    name: str
    planned_date: date
    forecast_date: date | None = None
    actual_date: date | None = None
    rag_status: str


class SeedChangeOrder(SeedModel):
    id: str
    project_id: str
    work_package_id: str | None = None
    reference: str
    title: str
    status: str
    cost_delta: float
    schedule_delta_days: int
    raised_date: date


class SeedRiskEvent(SeedModel):
    id: str
    project_id: str
    change_order_id: str | None = None
    title: str
    severity: str
    probability: float
    cost_impact: float
    schedule_impact_days: int


class SeedBenchmarkMetric(SeedModel):
    sector: str
    region: str
    metric_key: str
    peer_median: float
    peer_p25: float
    peer_p75: float
    unit: str


class SeedData(SeedModel):
    projects: list[SeedProject]
    work_packages: list[SeedWorkPackage]
    cost_snapshots: list[SeedCostSnapshot]
    milestones: list[SeedMilestone]
    change_orders: list[SeedChangeOrder]
    risk_events: list[SeedRiskEvent]
    benchmark_metrics: list[SeedBenchmarkMetric]
