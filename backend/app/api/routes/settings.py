from fastapi import APIRouter, Depends, status
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.api.deps import get_current_project
from app.models.project import Project
from app.models.setting import ProjectSetting

router = APIRouter(prefix="/projects/{project_id}/settings", tags=["Project Settings"])


class SettingsUpdateSchema(BaseModel):
    high_confidence_threshold: Optional[float] = None
    low_confidence_threshold: Optional[float] = None
    email_alerts: Optional[bool] = None
    daily_digest: Optional[bool] = None


@router.get("", status_code=status.HTTP_200_OK)
def get_project_settings(
    project: Project = Depends(get_current_project),
    db: Session = Depends(get_db),
):
    """Get project configuration settings and matching thresholds."""
    settings = db.query(ProjectSetting).filter(ProjectSetting.project_id == project.id).first()
    if not settings:
        settings = ProjectSetting(
            project_id=project.id,
            high_confidence_threshold=85.0,
            low_confidence_threshold=60.0,
            email_alerts=True,
            daily_digest=True,
        )
        db.add(settings)
        db.commit()
        db.refresh(settings)

    return {
        "id": settings.id,
        "project_id": settings.project_id,
        "high_confidence_threshold": settings.high_confidence_threshold,
        "low_confidence_threshold": settings.low_confidence_threshold,
        "email_alerts": settings.email_alerts,
        "daily_digest": settings.daily_digest,
    }


@router.patch("", status_code=status.HTTP_200_OK)
def update_project_settings(
    data: SettingsUpdateSchema,
    project: Project = Depends(get_current_project),
    db: Session = Depends(get_db),
):
    """Update confidence thresholds and notification settings."""
    settings = db.query(ProjectSetting).filter(ProjectSetting.project_id == project.id).first()
    if not settings:
        settings = ProjectSetting(project_id=project.id)
        db.add(settings)

    if data.high_confidence_threshold is not None:
        settings.high_confidence_threshold = data.high_confidence_threshold
    if data.low_confidence_threshold is not None:
        settings.low_confidence_threshold = data.low_confidence_threshold
    if data.email_alerts is not None:
        settings.email_alerts = data.email_alerts
    if data.daily_digest is not None:
        settings.daily_digest = data.daily_digest

    db.commit()
    db.refresh(settings)
    return {
        "id": settings.id,
        "high_confidence_threshold": settings.high_confidence_threshold,
        "low_confidence_threshold": settings.low_confidence_threshold,
        "email_alerts": settings.email_alerts,
        "daily_digest": settings.daily_digest,
    }
