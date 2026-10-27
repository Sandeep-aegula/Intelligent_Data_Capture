from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.project import Project
from app.models.setting import ProjectSetting
from app.schemas.project import ProjectCreate, ProjectUpdate
from app.services.audit_service import AuditService
from app.core.exceptions import ResourceNotFoundException, ValidationException
from app.core.logging_config import logger


class ProjectService:
    @staticmethod
    def list_projects(db: Session, include_archived: bool = False) -> List[Project]:
        query = db.query(Project)
        if not include_archived:
            query = query.filter(Project.is_archived == False)
        return query.order_by(Project.created_at.asc()).all()

    @staticmethod
    def get_project_by_id(db: Session, project_id: str) -> Project:
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise ResourceNotFoundException(f"Project with ID '{project_id}' not found.")
        return project

    @staticmethod
    def get_project_by_code(db: Session, code: str) -> Optional[Project]:
        return db.query(Project).filter(Project.code == code).first()

    @staticmethod
    def create_project(db: Session, data: ProjectCreate) -> Project:
        # Check uniqueness of code
        existing = ProjectService.get_project_by_code(db, data.code)
        if existing:
            raise ValidationException(f"Project code '{data.code}' is already in use.")

        project = Project(
            name=data.name,
            code=data.code.upper().strip(),
            description=data.description,
            location=data.location,
            status=data.status or "In Progress",
            overall_progress=0.0,
            planned_start=data.planned_start_date.date() if data.planned_start_date else None,
            planned_finish=data.planned_end_date.date() if data.planned_end_date else None,
            actual_start=data.actual_start_date.date() if data.actual_start_date else None,
            owner=data.client_name or "Project Manager",
            is_archived=False,
        )
        db.add(project)
        db.flush()

        # Initialize default project settings
        default_settings = ProjectSetting(
            project_id=project.id,
            high_confidence_threshold=85.0,
            low_confidence_threshold=60.0,
            email_alerts=True,
            daily_digest=True,
        )
        db.add(default_settings)

        # Audit
        AuditService.log_action(
            db=db,
            project_id=project.id,
            action="Created",
            category="Project",
            entity_type="Project",
            entity_id=project.id,
            details=f"Created new infrastructure project: {project.name} ({project.code})",
            new_value=project.code,
        )

        db.commit()
        db.refresh(project)
        logger.info(f"Created project {project.name} ({project.id})")
        return project

    @staticmethod
    def update_project(db: Session, project_id: str, data: ProjectUpdate) -> Project:
        project = ProjectService.get_project_by_id(db, project_id)

        update_dict = data.model_dump(exclude_unset=True)
        if not update_dict:
            return project

        old_values = f"Name: {project.name}, Status: {project.status}"

        if "name" in update_dict and update_dict["name"]:
            project.name = update_dict["name"]
        if "description" in update_dict:
            project.description = update_dict["description"]
        if "location" in update_dict:
            project.location = update_dict["location"]
        if "status" in update_dict and update_dict["status"]:
            project.status = update_dict["status"]
        if "planned_start_date" in update_dict:
            project.planned_start = update_dict["planned_start_date"].date() if update_dict["planned_start_date"] else None
        if "planned_end_date" in update_dict:
            project.planned_finish = update_dict["planned_end_date"].date() if update_dict["planned_end_date"] else None
        if "actual_start_date" in update_dict:
            project.actual_start = update_dict["actual_start_date"].date() if update_dict["actual_start_date"] else None

        db.flush()

        new_values = f"Name: {project.name}, Status: {project.status}"
        AuditService.log_action(
            db=db,
            project_id=project.id,
            action="Updated",
            category="Project",
            entity_type="Project",
            entity_id=project.id,
            details=f"Updated project details: {new_values}",
            previous_value=old_values,
            new_value=new_values,
        )

        db.commit()
        db.refresh(project)
        return project

    @staticmethod
    def archive_or_delete_project(db: Session, project_id: str, hard_delete: bool = False) -> bool:
        project = ProjectService.get_project_by_id(db, project_id)

        if hard_delete:
            db.delete(project)
            db.commit()
            logger.info(f"Permanently deleted project {project_id}")
            return True
        else:
            project.is_archived = True
            AuditService.log_action(
                db=db,
                project_id=project.id,
                action="Archived",
                category="Project",
                entity_type="Project",
                entity_id=project.id,
                details=f"Archived project: {project.name}",
            )
            db.commit()
            logger.info(f"Archived project {project.name} ({project_id})")
            return True
