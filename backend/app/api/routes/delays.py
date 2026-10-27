from typing import Optional, List
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.api.deps import get_current_project
from app.models.project import Project
from app.services.delay_service import DelayService
from app.schemas.delay import DelayEventCreate, DelayEventUpdate, DelayCloseRequest

router = APIRouter(prefix="/projects/{project_id}/delays", tags=["Delay Analysis"])


@router.get("", status_code=status.HTTP_200_OK)
def list_delays(
    status_filter: Optional[str] = Query(None, alias="status"),
    critical_only: bool = Query(False),
    project: Project = Depends(get_current_project),
    db: Session = Depends(get_db),
):
    """List schedule delay events with impact and critical-path indicator."""
    delays = DelayService.list_delays(db, project.id, status=status_filter, critical_only=critical_only)
    return [
        {
            "id": d.id,
            "project_id": d.project_id,
            "activity_id": d.activity_id,
            "activity_name": d.activity_name,
            "discipline": d.discipline,
            "location": d.location,
            "critical_path": d.critical_path,
            "variance_days": d.variance_days,
            "root_cause": d.root_cause,
            "impact": d.impact,
            "mitigation_status": d.mitigation_status,
            "mitigation_plan": d.mitigation_plan,
            "baseline_start": d.baseline_start.isoformat() if d.baseline_start else None,
            "baseline_finish": d.baseline_finish.isoformat() if d.baseline_finish else None,
            "forecast_finish": d.forecast_finish.isoformat() if d.forecast_finish else None,
            "logged_date": d.logged_date.isoformat(),
            "owner": d.owner,
            "created_at": d.created_at.isoformat(),
        }
        for d in delays
    ]


@router.post("", status_code=status.HTTP_201_CREATED)
def create_delay(
    data: DelayEventCreate,
    project: Project = Depends(get_current_project),
    db: Session = Depends(get_db),
):
    """Log a new delay event."""
    delay = DelayService.create_delay(db, project.id, data)
    return {
        "id": delay.id,
        "root_cause": delay.root_cause,
        "variance_days": delay.variance_days,
        "critical_path": delay.critical_path,
        "impact": delay.impact,
    }


@router.patch("/{delay_id}", status_code=status.HTTP_200_OK)
def update_delay(
    delay_id: str,
    data: DelayEventUpdate,
    project: Project = Depends(get_current_project),
    db: Session = Depends(get_db),
):
    """Update delay information or mitigation progress."""
    delay = DelayService.update_delay(db, project.id, delay_id, data)
    return {
        "id": delay.id,
        "status": delay.mitigation_status,
        "mitigation_plan": delay.mitigation_plan,
    }


@router.post("/{delay_id}/close", status_code=status.HTTP_200_OK)
def close_delay(
    delay_id: str,
    request: DelayCloseRequest,
    project: Project = Depends(get_current_project),
    db: Session = Depends(get_db),
):
    """Close and mark delay as mitigated."""
    delay = DelayService.close_delay(db, project.id, delay_id, request)
    return {
        "id": delay.id,
        "status": delay.mitigation_status,
        "message": "Delay marked as mitigated",
    }
