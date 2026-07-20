from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.base import get_db
from app.db.models import ChangeOrder, Project
from app.enums import ChangeOrderStatus
from app.routers.deps import get_project_or_404
from app.schemas import ChangeOrder as ChangeOrderSchema

router = APIRouter(prefix="/projects", tags=["change-orders"])


@router.get(
    "/{project_id}/change-orders",
    response_model=list[ChangeOrderSchema],
    operation_id="listChangeOrders",
)
def list_change_orders(
    project: Annotated[Project, Depends(get_project_or_404)],
    db: Annotated[Session, Depends(get_db)],
    status: Annotated[ChangeOrderStatus | None, Query()] = None,
) -> list[ChangeOrder]:
    """Return change orders for a project, optionally filtered by status."""
    stmt = select(ChangeOrder).where(ChangeOrder.project_id == project.id)
    if status:
        stmt = stmt.where(ChangeOrder.status == status)
    return list(db.scalars(stmt.order_by(ChangeOrder.raised_date)))
