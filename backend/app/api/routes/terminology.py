from typing import Optional, List
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.api.deps import get_current_project
from app.models.project import Project
from app.services.terminology_service import TerminologyService
from app.schemas.knowledge import ProjectTerminologyCreate, ProjectTerminologyUpdate

router = APIRouter(prefix="/projects/{project_id}/terminology", tags=["Terminology"])


@router.get("", status_code=status.HTTP_200_OK)
def list_terminology(
    discipline: Optional[str] = Query(None),
    project: Project = Depends(get_current_project),
    db: Session = Depends(get_db),
):
    """List project terminology, abbreviations, and verified aliases."""
    terms = TerminologyService.list_terms(db, project.id, discipline=discipline)
    return [
        {
            "id": t.id,
            "project_id": t.project_id,
            "term": t.term,
            "expansion": t.expansion,
            "discipline": t.discipline,
            "definition": t.definition,
            "aliases": t.aliases,
            "usage_count": t.usage_count,
            "is_verified": t.is_verified,
            "created_at": t.created_at.isoformat(),
        }
        for t in terms
    ]


@router.post("", status_code=status.HTTP_201_CREATED)
def create_terminology(
    data: ProjectTerminologyCreate,
    project: Project = Depends(get_current_project),
    db: Session = Depends(get_db),
):
    """Register verified term or site alias."""
    term = TerminologyService.create_term(db, project.id, data)
    return {
        "id": term.id,
        "term": term.term,
        "expansion": term.expansion,
        "discipline": term.discipline,
        "aliases": term.aliases,
    }


@router.patch("/{term_id}", status_code=status.HTTP_200_OK)
def update_terminology(
    term_id: str,
    data: ProjectTerminologyUpdate,
    project: Project = Depends(get_current_project),
    db: Session = Depends(get_db),
):
    """Update term or add aliases."""
    term = TerminologyService.update_term(db, project.id, term_id, data)
    return {
        "id": term.id,
        "term": term.term,
        "expansion": term.expansion,
    }


@router.delete("/{term_id}", status_code=status.HTTP_200_OK)
def delete_terminology(
    term_id: str,
    project: Project = Depends(get_current_project),
    db: Session = Depends(get_db),
):
    """Delete a terminology record."""
    TerminologyService.delete_term(db, project.id, term_id)
    return {"message": "Terminology deleted successfully"}
