from typing import Generator
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.project import Project


def get_current_project(project_id: str, db: Session = Depends(get_db)) -> Project:
    """
    Validates project existence and enforces project-level scoping.
    Returns 404 if project does not exist.
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID '{project_id}' not found.",
        )
    return project
