"""Pure domain calculations shared by routers.

These mirror the "Derived values" table in base-app/domain-model.md. Keeping them
pure (no I/O) makes them trivial to unit test and reuse.
"""

from __future__ import annotations

from datetime import date

from app.db.models import ChangeOrder, CostSnapshot, Milestone
from app.enums import BenchmarkPosition, ChangeOrderStatus


def actual_cost_to_date(snapshots: list[CostSnapshot]) -> float:
    """Sum of project-level (work_package_id is None) actual cost across periods."""
    return float(sum(s.actual_cost for s in snapshots if s.work_package_id is None))


def baseline_cost_to_date(snapshots: list[CostSnapshot]) -> float:
    return float(sum(s.baseline_cost for s in snapshots if s.work_package_id is None))


def cost_variance(snapshots: list[CostSnapshot]) -> float:
    """actual - baseline across project-level periods (positive = overspend)."""
    return actual_cost_to_date(snapshots) - baseline_cost_to_date(snapshots)


def schedule_slippage_days(milestones: list[Milestone]) -> int:
    """Worst slippage across milestones: max(forecast|actual - planned), >= 0."""
    worst = 0
    for m in milestones:
        compare_to: date | None = m.actual_date or m.forecast_date
        if compare_to is None:
            continue
        slip = (compare_to - m.planned_date).days
        worst = max(worst, slip)
    return worst


def approved_cost_delta(change_orders: list[ChangeOrder]) -> float:
    approved = (co for co in change_orders if co.status == ChangeOrderStatus.APPROVED)
    return float(sum(co.cost_delta for co in approved))


def approved_schedule_delta_days(change_orders: list[ChangeOrder]) -> int:
    approved = (co for co in change_orders if co.status == ChangeOrderStatus.APPROVED)
    return int(sum(co.schedule_delta_days for co in approved))


def open_change_order_count(change_orders: list[ChangeOrder]) -> int:
    """Open = not in a terminal state (approved/rejected)."""
    return sum(
        1
        for co in change_orders
        if co.status in (ChangeOrderStatus.DRAFT, ChangeOrderStatus.SUBMITTED)
    )


def benchmark_position(value: float, p25: float, median: float, p75: float) -> BenchmarkPosition:
    """Bucket a project metric against peer percentiles."""
    if value < p25:
        return BenchmarkPosition.BELOW_P25
    if value < median:
        return BenchmarkPosition.P25_TO_MEDIAN
    if value < p75:
        return BenchmarkPosition.MEDIAN_TO_P75
    return BenchmarkPosition.ABOVE_P75
