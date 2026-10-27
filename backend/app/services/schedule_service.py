from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.schedule import ScheduleVersion, ScheduleActivity
from app.schemas.schedule import ScheduleActivityCreate, ScheduleActivityUpdate
from app.services.audit_service import AuditService
from app.core.exceptions import ResourceNotFoundException, ValidationException
from app.core.logging_config import logger


class ScheduleService:
    @staticmethod
    def get_active_version(db: Session, project_id: str) -> Optional[ScheduleVersion]:
        return (
            db.query(ScheduleVersion)
            .filter(ScheduleVersion.project_id == project_id, ScheduleVersion.is_active == True)
            .first()
        )

    @staticmethod
    def list_versions(db: Session, project_id: str) -> List[ScheduleVersion]:
        return (
            db.query(ScheduleVersion)
            .filter(ScheduleVersion.project_id == project_id)
            .order_by(ScheduleVersion.version_number.desc())
            .all()
        )

    @staticmethod
    def list_activities(
        db: Session,
        project_id: str,
        version_id: Optional[str] = None,
        level: Optional[str] = None,
        discipline: Optional[str] = None,
        status: Optional[str] = None,
    ) -> List[ScheduleActivity]:
        query = db.query(ScheduleActivity).filter(ScheduleActivity.project_id == project_id)

        if version_id:
            query = query.filter(ScheduleActivity.schedule_version_id == version_id)
        else:
            # Default to active version if exists
            active_v = ScheduleService.get_active_version(db, project_id)
            if active_v:
                query = query.filter(ScheduleActivity.schedule_version_id == active_v.id)

        if level:
            query = query.filter(ScheduleActivity.level == level)
        if discipline:
            query = query.filter(ScheduleActivity.discipline == discipline)
        if status:
            query = query.filter(ScheduleActivity.status == status)

        return query.order_by(ScheduleActivity.activity_code.asc()).all()

    @staticmethod
    def get_activity_by_id(db: Session, project_id: str, activity_id: str) -> ScheduleActivity:
        activity = (
            db.query(ScheduleActivity)
            .filter(ScheduleActivity.id == activity_id, ScheduleActivity.project_id == project_id)
            .first()
        )
        if not activity:
            raise ResourceNotFoundException(f"Schedule activity '{activity_id}' not found in project '{project_id}'.")
        return activity

    @staticmethod
    def get_activity_by_code(db: Session, project_id: str, activity_code: str) -> Optional[ScheduleActivity]:
        return (
            db.query(ScheduleActivity)
            .filter(ScheduleActivity.project_id == project_id, ScheduleActivity.activity_code == activity_code)
            .first()
        )

    @staticmethod
    def build_schedule_tree(db: Session, project_id: str, version_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Builds a hierarchical tree representation from L1 through L6 activities.
        """
        activities = ScheduleService.list_activities(db, project_id, version_id=version_id)
        if not activities:
            return []

        # Create lookup node mapping
        nodes_by_id: Dict[str, Dict[str, Any]] = {}
        for act in activities:
            nodes_by_id[act.id] = {
                "id": act.id,
                "project_id": act.project_id,
                "schedule_version_id": act.schedule_version_id,
                "activity_code": act.activity_code,
                "name": act.name,
                "level": act.level,
                "parent_id": act.parent_id,
                "discipline": act.discipline,
                "location": act.location,
                "status": act.status,
                "progress": act.progress,
                "planned_start": act.planned_start.isoformat() if act.planned_start else None,
                "planned_finish": act.planned_finish.isoformat() if act.planned_finish else None,
                "actual_start": act.actual_start.isoformat() if act.actual_start else None,
                "actual_finish": act.actual_finish.isoformat() if act.actual_finish else None,
                "quantity": act.quantity,
                "unit": act.unit,
                "critical_path": act.critical_path,
                "hierarchy_path": act.hierarchy_path,
                "children": [],
            }

        root_nodes: List[Dict[str, Any]] = []
        for act in activities:
            node = nodes_by_id[act.id]
            if act.parent_id and act.parent_id in nodes_by_id:
                nodes_by_id[act.parent_id]["children"].append(node)
            else:
                root_nodes.append(node)

        return root_nodes

    @staticmethod
    def create_activity(db: Session, project_id: str, data: ScheduleActivityCreate) -> ScheduleActivity:
        # Check duplicate activity code in project
        existing = ScheduleService.get_activity_by_code(db, project_id, data.activity_code)
        if existing:
            raise ValidationException(f"Activity code '{data.activity_code}' already exists in this project.")

        # Validate parent belongs to same project if supplied
        parent_act = None
        if data.parent_id:
            parent_act = ScheduleService.get_activity_by_id(db, project_id, data.parent_id)

        hierarchy_path = (
            f"{parent_act.hierarchy_path} / {data.activity_code}"
            if parent_act and parent_act.hierarchy_path
            else data.activity_code
        )

        activity = ScheduleActivity(
            project_id=project_id,
            schedule_version_id=data.version_id,
            activity_code=data.activity_code.strip(),
            name=data.name.strip(),
            level=f"L{data.level}" if isinstance(data.level, int) else data.level,
            parent_id=data.parent_id,
            discipline=data.discipline,
            location=data.area,
            status=data.status or "Not Started",
            progress=data.percent_complete or 0.0,
            planned_start=data.planned_start.date() if data.planned_start else None,
            planned_finish=data.planned_finish.date() if data.planned_finish else None,
            actual_start=data.actual_start.date() if data.actual_start else None,
            actual_finish=data.actual_finish.date() if data.actual_finish else None,
            duration_days=data.planned_duration_days,
            quantity=data.planned_quantity,
            unit=data.unit_of_measure,
            critical_path=data.critical_path,
            hierarchy_path=hierarchy_path,
        )
        db.add(activity)
        db.flush()

        # Audit
        AuditService.log_action(
            db=db,
            project_id=project_id,
            action="Created",
            category="Schedule",
            entity_type="ScheduleActivity",
            entity_id=activity.id,
            details=f"Created activity {activity.activity_code}: {activity.name}",
            new_value=activity.activity_code,
        )

        db.commit()
        db.refresh(activity)
        return activity

    @staticmethod
    def update_activity(
        db: Session, project_id: str, activity_id: str, data: ScheduleActivityUpdate
    ) -> ScheduleActivity:
        activity = ScheduleService.get_activity_by_id(db, project_id, activity_id)
        update_dict = data.model_dump(exclude_unset=True)

        if not update_dict:
            return activity

        # Hierarchy cycle prevention
        if "parent_id" in update_dict and update_dict["parent_id"]:
            if update_dict["parent_id"] == activity.id:
                raise ValidationException("An activity cannot be its own parent.")
            # Verify parent belongs to same project
            parent = ScheduleService.get_activity_by_id(db, project_id, update_dict["parent_id"])
            activity.parent_id = parent.id
            if parent.hierarchy_path:
                activity.hierarchy_path = f"{parent.hierarchy_path} / {activity.activity_code}"

        if "name" in update_dict and update_dict["name"]:
            activity.name = update_dict["name"]
        if "level" in update_dict and update_dict["level"] is not None:
            lvl = update_dict["level"]
            activity.level = f"L{lvl}" if isinstance(lvl, int) else lvl
        if "discipline" in update_dict:
            activity.discipline = update_dict["discipline"]
        if "area" in update_dict:
            activity.location = update_dict["area"]
        if "status" in update_dict and update_dict["status"]:
            activity.status = update_dict["status"]
        if "percent_complete" in update_dict and update_dict["percent_complete"] is not None:
            activity.progress = update_dict["percent_complete"]
        if "planned_start" in update_dict:
            activity.planned_start = update_dict["planned_start"].date() if update_dict["planned_start"] else None
        if "planned_finish" in update_dict:
            activity.planned_finish = update_dict["planned_finish"].date() if update_dict["planned_finish"] else None
        if "critical_path" in update_dict and update_dict["critical_path"] is not None:
            activity.critical_path = update_dict["critical_path"]
        if "planned_quantity" in update_dict:
            activity.quantity = update_dict["planned_quantity"]
        if "unit_of_measure" in update_dict:
            activity.unit = update_dict["unit_of_measure"]

        db.flush()

        AuditService.log_action(
            db=db,
            project_id=project_id,
            action="Updated",
            category="Schedule",
            entity_type="ScheduleActivity",
            entity_id=activity.id,
            details=f"Updated schedule activity {activity.activity_code}",
            new_value=f"Progress: {activity.progress}%, Status: {activity.status}",
        )

        db.commit()
        db.refresh(activity)
        return activity
