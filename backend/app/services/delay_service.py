from datetime import date
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.delay import DelayEvent
from app.models.schedule import ScheduleActivity
from app.schemas.delay import DelayEventCreate, DelayEventUpdate, DelayCloseRequest
from app.services.audit_service import AuditService
from app.services.schedule_service import ScheduleService
from app.core.exceptions import ResourceNotFoundException, ValidationException


class DelayService:
    @staticmethod
    def list_delays(
        db: Session,
        project_id: str,
        status: Optional[str] = None,
        critical_only: bool = False,
    ) -> List[DelayEvent]:
        query = db.query(DelayEvent).filter(DelayEvent.project_id == project_id)
        if status:
            query = query.filter(DelayEvent.mitigation_status == status)
        if critical_only:
            query = query.filter(DelayEvent.critical_path == True)
        return query.order_by(DelayEvent.logged_date.desc()).all()

    @staticmethod
    def get_delay_by_id(db: Session, project_id: str, delay_id: str) -> DelayEvent:
        delay = (
            db.query(DelayEvent)
            .filter(DelayEvent.id == delay_id, DelayEvent.project_id == project_id)
            .first()
        )
        if not delay:
            raise ResourceNotFoundException(f"Delay event '{delay_id}' not found in project '{project_id}'.")
        return delay

    @staticmethod
    def create_delay(db: Session, project_id: str, data: DelayEventCreate) -> DelayEvent:
        act_name = data.title
        discipline = None
        is_cp = data.is_critical_path_impact

        if data.schedule_activity_id:
            act = ScheduleService.get_activity_by_id(db, project_id, data.schedule_activity_id)
            act_name = act.name
            discipline = act.discipline
            is_cp = act.critical_path

        delay = DelayEvent(
            project_id=project_id,
            activity_id=data.schedule_activity_id or "GENERAL",
            activity_name=act_name,
            discipline=discipline,
            critical_path=is_cp,
            variance_days=data.delay_days or 0,
            root_cause=f"{data.category}: {data.title}",
            impact=data.severity,
            mitigation_status="Under Review",
            mitigation_plan=data.mitigation_action,
            logged_date=data.reported_date,
            owner="Project Planner",
        )
        db.add(delay)
        db.flush()

        AuditService.log_action(
            db=db,
            project_id=project_id,
            action="Logged",
            category="Delay",
            entity_type="DelayEvent",
            entity_id=delay.id,
            details=f"Logged delay '{delay.root_cause}' ({delay.variance_days} days variance)",
            new_value=str(delay.variance_days),
        )

        db.commit()
        db.refresh(delay)
        return delay

    @staticmethod
    def update_delay(db: Session, project_id: str, delay_id: str, data: DelayEventUpdate) -> DelayEvent:
        delay = DelayService.get_delay_by_id(db, project_id, delay_id)
        update_dict = data.model_dump(exclude_unset=True)

        if "mitigation_plan" in update_dict:
            delay.mitigation_plan = update_dict["mitigation_plan"]
        if "severity" in update_dict and update_dict["severity"]:
            delay.impact = update_dict["severity"]
        if "status" in update_dict and update_dict["status"]:
            delay.mitigation_status = update_dict["status"]
        if "delay_days" in update_dict and update_dict["delay_days"] is not None:
            delay.variance_days = update_dict["delay_days"]

        db.commit()
        db.refresh(delay)
        return delay

    @staticmethod
    def close_delay(db: Session, project_id: str, delay_id: str, request: DelayCloseRequest) -> DelayEvent:
        delay = DelayService.get_delay_by_id(db, project_id, delay_id)
        delay.mitigation_status = "Mitigated"
        delay.mitigation_plan = request.mitigation_action

        AuditService.log_action(
            db=db,
            project_id=project_id,
            action="Closed",
            category="Delay",
            entity_type="DelayEvent",
            entity_id=delay.id,
            details=f"Closed delay {delay.root_cause}. Mitigation: {request.mitigation_action}",
            new_value="Mitigated",
        )

        db.commit()
        db.refresh(delay)
        return delay
