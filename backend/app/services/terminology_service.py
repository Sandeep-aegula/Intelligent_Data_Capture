from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.knowledge import ProjectTerminology
from app.schemas.knowledge import ProjectTerminologyCreate, ProjectTerminologyUpdate
from app.services.audit_service import AuditService
from app.core.exceptions import ResourceNotFoundException, ValidationException


class TerminologyService:
    @staticmethod
    def list_terms(db: Session, project_id: str, discipline: Optional[str] = None) -> List[ProjectTerminology]:
        query = db.query(ProjectTerminology).filter(ProjectTerminology.project_id == project_id)
        if discipline:
            query = query.filter(ProjectTerminology.discipline == discipline)
        return query.order_by(ProjectTerminology.term.asc()).all()

    @staticmethod
    def get_term_by_id(db: Session, project_id: str, term_id: str) -> ProjectTerminology:
        term = (
            db.query(ProjectTerminology)
            .filter(ProjectTerminology.id == term_id, ProjectTerminology.project_id == project_id)
            .first()
        )
        if not term:
            raise ResourceNotFoundException(f"Terminology '{term_id}' not found in project '{project_id}'.")
        return term

    @staticmethod
    def create_term(db: Session, project_id: str, data: ProjectTerminologyCreate) -> ProjectTerminology:
        # Check duplicate term in project
        existing = (
            db.query(ProjectTerminology)
            .filter(ProjectTerminology.project_id == project_id, ProjectTerminology.term == data.standard_term)
            .first()
        )
        if existing:
            raise ValidationException(f"Terminology '{data.standard_term}' already exists in this project.")

        term = ProjectTerminology(
            project_id=project_id,
            term=data.standard_term.strip(),
            expansion=data.definition or data.standard_term,
            discipline=data.discipline or "Piping",
            definition=data.definition,
            aliases=data.aliases or [],
            usage_count=1,
            is_verified=data.is_verified,
        )
        db.add(term)
        db.flush()

        AuditService.log_action(
            db=db,
            project_id=project_id,
            action="Created",
            category="Terminology",
            entity_type="ProjectTerminology",
            entity_id=term.id,
            details=f"Added terminology '{term.term}' -> '{term.expansion}'",
            new_value=term.term,
        )

        db.commit()
        db.refresh(term)
        return term

    @staticmethod
    def update_term(
        db: Session, project_id: str, term_id: str, data: ProjectTerminologyUpdate
    ) -> ProjectTerminology:
        term = TerminologyService.get_term_by_id(db, project_id, term_id)
        update_dict = data.model_dump(exclude_unset=True)

        if "standard_term" in update_dict and update_dict["standard_term"]:
            term.term = update_dict["standard_term"]
        if "definition" in update_dict:
            term.definition = update_dict["definition"]
            term.expansion = update_dict["definition"] or term.term
        if "discipline" in update_dict and update_dict["discipline"]:
            term.discipline = update_dict["discipline"]
        if "aliases" in update_dict and update_dict["aliases"] is not None:
            term.aliases = update_dict["aliases"]
        if "is_verified" in update_dict and update_dict["is_verified"] is not None:
            term.is_verified = update_dict["is_verified"]

        db.commit()
        db.refresh(term)
        return term

    @staticmethod
    def delete_term(db: Session, project_id: str, term_id: str) -> bool:
        term = TerminologyService.get_term_by_id(db, project_id, term_id)
        db.delete(term)
        db.commit()
        return True
