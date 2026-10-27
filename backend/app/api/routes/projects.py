from typing import List
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.services.project_service import ProjectService
from app.database.init_db import seed_demo_data
from app.schemas.project import ProjectCreate, ProjectUpdate

router = APIRouter(prefix="/projects", tags=["Project Management"])


@router.get("", status_code=status.HTTP_200_OK)
def list_projects(
    include_archived: bool = Query(False, description="Include archived projects"),
    db: Session = Depends(get_db),
):
    """List all projects."""
    projects = ProjectService.list_projects(db, include_archived=include_archived)
    # Format with frontend-expected fields
    return [
        {
            "id": p.id,
            "name": p.name,
            "code": p.code,
            "location": p.location,
            "description": p.description,
            "status": p.status,
            "overall_progress": p.overall_progress,
            "planned_start": p.planned_start.isoformat() if p.planned_start else None,
            "planned_finish": p.planned_finish.isoformat() if p.planned_finish else None,
            "actual_start": p.actual_start.isoformat() if p.actual_start else None,
            "owner": p.owner,
            "is_archived": p.is_archived,
            "created_at": p.created_at.isoformat(),
            "updated_at": p.updated_at.isoformat(),
        }
        for p in projects
    ]


@router.post("", status_code=status.HTTP_201_CREATED)
def create_project(data: ProjectCreate, db: Session = Depends(get_db)):
    """Create a new independent infrastructure project."""
    project = ProjectService.create_project(db, data)
    return {
        "id": project.id,
        "name": project.name,
        "code": project.code,
        "location": project.location,
        "description": project.description,
        "status": project.status,
        "overall_progress": project.overall_progress,
        "is_archived": project.is_archived,
        "created_at": project.created_at.isoformat(),
    }


@router.get("/{project_id}", status_code=status.HTTP_200_OK)
def get_project(project_id: str, db: Session = Depends(get_db)):
    """Retrieve project metadata."""
    project = ProjectService.get_project_by_id(db, project_id)
    return {
        "id": project.id,
        "name": project.name,
        "code": project.code,
        "location": project.location,
        "description": project.description,
        "status": project.status,
        "overall_progress": project.overall_progress,
        "planned_start": project.planned_start.isoformat() if project.planned_start else None,
        "planned_finish": project.planned_finish.isoformat() if project.planned_finish else None,
        "actual_start": project.actual_start.isoformat() if project.actual_start else None,
        "owner": project.owner,
        "is_archived": project.is_archived,
        "created_at": project.created_at.isoformat(),
        "updated_at": project.updated_at.isoformat(),
    }


@router.patch("/{project_id}", status_code=status.HTTP_200_OK)
def update_project(project_id: str, data: ProjectUpdate, db: Session = Depends(get_db)):
    """Update project details."""
    project = ProjectService.update_project(db, project_id, data)
    return {
        "id": project.id,
        "name": project.name,
        "code": project.code,
        "status": project.status,
        "overall_progress": project.overall_progress,
        "updated_at": project.updated_at.isoformat(),
    }


@router.delete("/{project_id}", status_code=status.HTTP_200_OK)
def delete_or_archive_project(
    project_id: str,
    hard_delete: bool = Query(False, description="Permanently delete project record"),
    db: Session = Depends(get_db),
):
    """Safely archive or permanently delete a project."""
    ProjectService.archive_or_delete_project(db, project_id, hard_delete=hard_delete)
    return {"message": "Project archived successfully" if not hard_delete else "Project deleted permanently"}


@router.post("/seed-demo", status_code=status.HTTP_200_OK)
def seed_demo_endpoint(
    force: bool = Query(False, description="Force reseed even if data exists"),
    db: Session = Depends(get_db),
):
    """Seed initial demonstration projects, schedules, and L1-L6 WBS hierarchy."""
    seed_demo_data(db, force=force)
    return {"message": "Demo data seeded successfully"}
