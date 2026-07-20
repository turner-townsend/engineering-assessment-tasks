from datetime import date

from sqlalchemy import Date, ForeignKey, Integer, Numeric, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

# UUIDs are stored as text so the same models work on SQLite (local/tests) and Postgres.


class Project(Base):
    """A construction or infrastructure project in the portfolio."""

    __tablename__ = "project"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    region: Mapped[str] = mapped_column(String, nullable=False)
    sector: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[str] = mapped_column(String, nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    planned_end_date: Mapped[date] = mapped_column(Date, nullable=False)
    baseline_cost: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="GBP")

    work_packages: Mapped[list["WorkPackage"]] = relationship(
        back_populates="project", cascade="all, delete-orphan"
    )
    cost_snapshots: Mapped[list["CostSnapshot"]] = relationship(
        back_populates="project", cascade="all, delete-orphan"
    )
    milestones: Mapped[list["Milestone"]] = relationship(
        back_populates="project", cascade="all, delete-orphan"
    )
    change_orders: Mapped[list["ChangeOrder"]] = relationship(
        back_populates="project", cascade="all, delete-orphan"
    )


class WorkPackage(Base):
    """A scoped unit of work within a project, used to break down costs."""

    __tablename__ = "work_package"
    __table_args__ = (UniqueConstraint("project_id", "code"),)

    id: Mapped[str] = mapped_column(String, primary_key=True)
    project_id: Mapped[str] = mapped_column(
        ForeignKey("project.id", ondelete="CASCADE"), nullable=False
    )
    code: Mapped[str] = mapped_column(String, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    baseline_cost: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)

    project: Mapped[Project] = relationship(back_populates="work_packages")
    change_orders: Mapped[list["ChangeOrder"]] = relationship(back_populates="work_package")


class CostSnapshot(Base):
    """Monthly baseline, forecast, and actual cost for a project or work package."""

    __tablename__ = "cost_snapshot"
    __table_args__ = (UniqueConstraint("project_id", "work_package_id", "period_month"),)

    id: Mapped[str] = mapped_column(String, primary_key=True)
    project_id: Mapped[str] = mapped_column(
        ForeignKey("project.id", ondelete="CASCADE"), nullable=False
    )
    work_package_id: Mapped[str | None] = mapped_column(
        ForeignKey("work_package.id", ondelete="CASCADE"), nullable=True
    )
    period_month: Mapped[date] = mapped_column(Date, nullable=False)
    baseline_cost: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    forecast_cost: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    actual_cost: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)

    project: Mapped[Project] = relationship(back_populates="cost_snapshots")


class Milestone(Base):
    """A schedule milestone with planned, forecast, and actual dates plus RAG status."""

    __tablename__ = "milestone"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    project_id: Mapped[str] = mapped_column(
        ForeignKey("project.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String, nullable=False)
    planned_date: Mapped[date] = mapped_column(Date, nullable=False)
    forecast_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    actual_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    rag_status: Mapped[str] = mapped_column(String, nullable=False)

    project: Mapped[Project] = relationship(back_populates="milestones")


class ChangeOrder(Base):
    """A formal request to change scope, cost, or schedule on a project."""

    __tablename__ = "change_order"
    __table_args__ = (UniqueConstraint("project_id", "reference"),)

    id: Mapped[str] = mapped_column(String, primary_key=True)
    project_id: Mapped[str] = mapped_column(
        ForeignKey("project.id", ondelete="CASCADE"), nullable=False
    )
    work_package_id: Mapped[str | None] = mapped_column(
        ForeignKey("work_package.id", ondelete="SET NULL"), nullable=True
    )
    reference: Mapped[str] = mapped_column(String, nullable=False)
    title: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[str] = mapped_column(String, nullable=False, default="draft")
    cost_delta: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False, default=0)
    schedule_delta_days: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    raised_date: Mapped[date] = mapped_column(Date, nullable=False)

    project: Mapped[Project] = relationship(back_populates="change_orders")
    work_package: Mapped["WorkPackage | None"] = relationship(back_populates="change_orders")

    @property
    def work_package_code(self) -> str | None:
        if self.work_package is None:
            return None
        return self.work_package.code


class RiskEvent(Base):
    """A risk event with severity, probability, and estimated cost/schedule impact."""

    __tablename__ = "risk_event"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    project_id: Mapped[str] = mapped_column(
        ForeignKey("project.id", ondelete="CASCADE"), nullable=False
    )
    change_order_id: Mapped[str | None] = mapped_column(
        ForeignKey("change_order.id", ondelete="SET NULL"), nullable=True
    )
    title: Mapped[str] = mapped_column(String, nullable=False)
    severity: Mapped[str] = mapped_column(String, nullable=False)
    probability: Mapped[float] = mapped_column(Numeric(3, 2), nullable=False)
    cost_impact: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False, default=0)
    schedule_impact_days: Mapped[int] = mapped_column(Integer, nullable=False, default=0)


class BenchmarkMetric(Base):
    """Peer-group cost metrics (median, P25, P75) for a sector/region combination."""

    __tablename__ = "benchmark_metric"
    __table_args__ = (UniqueConstraint("sector", "region", "metric_key"),)

    id: Mapped[str] = mapped_column(String, primary_key=True)
    sector: Mapped[str] = mapped_column(String, nullable=False)
    region: Mapped[str] = mapped_column(String, nullable=False)
    metric_key: Mapped[str] = mapped_column(String, nullable=False)
    peer_median: Mapped[float] = mapped_column(Numeric(14, 4), nullable=False)
    peer_p25: Mapped[float] = mapped_column(Numeric(14, 4), nullable=False)
    peer_p75: Mapped[float] = mapped_column(Numeric(14, 4), nullable=False)
    unit: Mapped[str] = mapped_column(String, nullable=False)
