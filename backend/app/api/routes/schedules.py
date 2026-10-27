from typing import Optional, List
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.api.deps import get_current_project
from app.models.project import Project
from app.services.schedule_service import ScheduleService
from app.schemas.schedule import ScheduleActivityCreate, ScheduleActivityUpdate

router = APIRouter(prefix="/projects/{project_id}/schedule", tags=["Schedule Management"])


@router.get("", status_code=status.HTTP_200_OK)
def get_schedule_summary(
    project: Project = Depends(get_current_project),
    db: Session = Depends(get_db),
):
    """Retrieve schedule metadata and active baseline version."""
    active_version = ScheduleService.get_active_version(db, project.id)
    all_versions = ScheduleService.list_versions(db, project.id)
    activities = ScheduleService.list_activities(db, project.id)

    return {
        "project_id": project.id,
        "active_version": {
            "id": active_version.id,
            "version_number": active_version.version_number,
            "name": active_version.name,
            "source_file": active_version.source_file,
            "total_activities": active_version.total_activities,
            "created_at": active_version.created_at.isoformat(),
        } if active_version else None,
        "total_versions": len(all_versions),
        "total_activities": len(activities),
    }


@router.get("/tree", status_code=status.HTTP_200_OK)
def get_schedule_tree(
    version_id: Optional[str] = Query(None, description="Specific schedule version ID"),
    project: Project = Depends(get_current_project),
    db: Session = Depends(get_db),
):
    """Retrieve full nested L1-L6 WBS tree for interactive Explorer."""
    return ScheduleService.build_schedule_tree(db, project.id, version_id=version_id)


@router.get("/activities", status_code=status.HTTP_200_OK)
def list_schedule_activities(
    level: Optional[str] = Query(None, description="Filter by WBS level (e.g. L6)"),
    discipline: Optional[str] = Query(None, description="Filter by discipline"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status"),
    project: Project = Depends(get_current_project),
    db: Session = Depends(get_db),
):
    """List flattened schedule activities."""
    activities = ScheduleService.list_activities(
        db, project.id, level=level, discipline=discipline, status=status_filter
    )
    return [
        {
            "id": a.id,
            "project_id": a.project_id,
            "activity_code": a.activity_code,
            "name": a.name,
            "level": a.level,
            "parent_id": a.parent_id,
            "discipline": a.discipline,
            "location": a.location,
            "status": a.status,
            "progress": a.progress,
            "planned_start": a.planned_start.isoformat() if a.planned_start else None,
            "planned_finish": a.planned_finish.isoformat() if a.planned_finish else None,
            "actual_start": a.actual_start.isoformat() if a.actual_start else None,
            "actual_finish": a.actual_finish.isoformat() if a.actual_finish else None,
            "quantity": a.quantity,
            "unit": a.unit,
            "critical_path": a.critical_path,
            "hierarchy_path": a.hierarchy_path,
        }
        for a in activities
    ]


@router.post("/activities", status_code=status.HTTP_201_CREATED)
def create_schedule_activity(
    data: ScheduleActivityCreate,
    project: Project = Depends(get_current_project),
    db: Session = Depends(get_db),
):
    """Create a discrete schedule activity in the project."""
    activity = ScheduleService.create_activity(db, project.id, data)
    return {
        "id": activity.id,
        "activity_code": activity.activity_code,
        "name": activity.name,
        "level": activity.level,
        "status": activity.status,
    }


@router.get("/activities/{activity_id}", status_code=status.HTTP_200_OK)
def get_schedule_activity(
    activity_id: str,
    project: Project = Depends(get_current_project),
    db: Session = Depends(get_db),
):
    """Get single schedule activity."""
    a = ScheduleService.get_activity_by_id(db, project.id, activity_id)
    return {
        "id": a.id,
        "activity_code": a.activity_code,
        "name": a.name,
        "level": a.level,
        "parent_id": a.parent_id,
        "discipline": a.discipline,
        "location": a.location,
        "status": a.status,
        "progress": a.progress,
        "planned_start": a.planned_start.isoformat() if a.planned_start else None,
        "planned_finish": a.planned_finish.isoformat() if a.planned_finish else None,
        "quantity": a.quantity,
        "unit": a.unit,
        "critical_path": a.critical_path,
        "hierarchy_path": a.hierarchy_path,
    }


@router.patch("/activities/{activity_id}", status_code=status.HTTP_200_OK)
def update_schedule_activity(
    activity_id: str,
    data: ScheduleActivityUpdate,
    project: Project = Depends(get_current_project),
    db: Session = Depends(get_db),
):
    """Update schedule activity details."""
    a = ScheduleService.update_activity(db, project.id, activity_id, data)
    return {
        "id": a.id,
        "activity_code": a.activity_code,
        "name": a.name,
        "status": a.status,
        "progress": a.progress,
        "critical_path": a.critical_path,
    }
