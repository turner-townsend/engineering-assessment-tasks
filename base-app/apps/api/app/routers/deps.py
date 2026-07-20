from typing import Annotated

from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.base import get_db
from app.db.models import Project


def get_project_or_404(
    project_id: str,
    db: Annotated[Session, Depends(get_db)],
) -> Project:
    """Fetch a project by ID or raise 404."""
    project = db.get(Project, project_id)
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return project
