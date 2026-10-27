from typing import Optional, List
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.api.deps import get_current_project
from app.models.project import Project
from app.services.progress_service import ProgressService
from app.schemas.progress import VerifiedProgressCreate

router = APIRouter(prefix="/projects/{project_id}/progress", tags=["Progress Tracking"])


@router.get("", status_code=status.HTTP_200_OK)
def list_verified_progress(
    activity_id: Optional[str] = Query(None),
    project: Project = Depends(get_current_project),
    db: Session = Depends(get_db),
):
    """List verified progress records for the project."""
    records = ProgressService.list_progress_records(db, project.id, activity_id=activity_id)
    return [
        {
            "id": r.id,
            "project_id": r.project_id,
            "activity_id": r.activity_id,
            "activity_code": r.activity.activity_code if r.activity else None,
            "activity_name": r.activity.name if r.activity else None,
            "verified_date": r.verified_date.isoformat(),
            "quantity_installed": r.quantity_installed,
            "physical_percent": r.physical_percent,
            "verified_by": r.verified_by,
            "notes": r.notes,
            "created_at": r.created_at.isoformat(),
        }
        for r in records
    ]


@router.get("/activities/{activity_id}", status_code=status.HTTP_200_OK)
def get_activity_progress(
    activity_id: str,
    project: Project = Depends(get_current_project),
    db: Session = Depends(get_db),
):
    """Get cumulative progress summary and history for a specific activity."""
    return ProgressService.get_activity_progress_summary(db, project.id, activity_id)


@router.post("/records", status_code=status.HTTP_201_CREATED)
def create_progress_record(
    data: VerifiedProgressCreate,
    project: Project = Depends(get_current_project),
    db: Session = Depends(get_db),
):
    """Explicitly record verified progress."""
    rec = ProgressService.create_progress_record(db, project.id, data)
    return {
        "id": rec.id,
        "activity_id": rec.activity_id,
        "verified_date": rec.verified_date.isoformat(),
        "quantity_installed": rec.quantity_installed,
        "physical_percent": rec.physical_percent,
    }
