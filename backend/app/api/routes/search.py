from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.api.deps import get_current_project
from app.models.project import Project
from app.services.search_service import SearchService
from app.schemas.search import UnifiedSearchResponse

router = APIRouter(prefix="/projects/{project_id}/search", tags=["Global Search"])


@router.get("", status_code=status.HTTP_200_OK, response_model=UnifiedSearchResponse)
def search_project(
    q: str = Query(..., min_length=1, description="Search term"),
    limit: int = Query(20, ge=1, le=50),
    project: Project = Depends(get_current_project),
    db: Session = Depends(get_db),
):
    """
    Unified project-scoped search across schedule activities, daily reports, terminology, delays, and knowledge items.
    """
    return SearchService.unified_search(db, project.id, query=q, limit=limit)
