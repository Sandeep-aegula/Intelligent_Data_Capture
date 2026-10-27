from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.api.deps import get_current_project
from app.models.project import Project
from app.services.dashboard_service import DashboardService

router = APIRouter(prefix="/projects/{project_id}/dashboard", tags=["Dashboard"])


@router.get("", status_code=status.HTTP_200_OK)
def get_dashboard(
    project: Project = Depends(get_current_project),
    db: Session = Depends(get_db),
):
    """Retrieve database-derived dashboard metrics, trends, and KPIs for the project."""
    return DashboardService.get_project_dashboard(db, project.id)
