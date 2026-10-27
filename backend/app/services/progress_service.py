from datetime import date
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.progress import VerifiedProgress
from app.models.schedule import ScheduleActivity
from app.schemas.progress import VerifiedProgressCreate, VerifiedProgressUpdate
from app.services.audit_service import AuditService
from app.services.schedule_service import ScheduleService
from app.core.exceptions import ResourceNotFoundException


class ProgressService:
    @staticmethod
    def list_progress_records(
        db: Session,
        project_id: str,
        activity_id: Optional[str] = None,
    ) -> List[VerifiedProgress]:
        query = db.query(VerifiedProgress).filter(VerifiedProgress.project_id == project_id)
        if activity_id:
            query = query.filter(VerifiedProgress.activity_id == activity_id)
        return query.order_by(VerifiedProgress.verified_date.desc()).all()

    @staticmethod
    def get_progress_by_id(db: Session, project_id: str, progress_id: str) -> VerifiedProgress:
        rec = (
            db.query(VerifiedProgress)
            .filter(VerifiedProgress.id == progress_id, VerifiedProgress.project_id == project_id)
            .first()
        )
        if not rec:
            raise ResourceNotFoundException(f"Verified progress record '{progress_id}' not found.")
        return rec

    @staticmethod
    def create_progress_record(db: Session, project_id: str, data: VerifiedProgressCreate) -> VerifiedProgress:
        activity = ScheduleService.get_activity_by_id(db, project_id, data.schedule_activity_id)

        rec = VerifiedProgress(
            project_id=project_id,
            activity_id=activity.id,
            report_id=data.planner_review_id,
            verified_date=data.progress_date,
            quantity_installed=data.actual_quantity,
            physical_percent=data.percent_complete,
            verified_by=data.verified_by or "Project Planner",
            notes=data.evidence_notes,
        )
        db.add(rec)
        db.flush()

        # Update activity progress if supplied
        if data.percent_complete is not None:
            activity.progress = data.percent_complete
            if activity.status == "Not Started":
                activity.status = "In Progress"

        AuditService.log_action(
            db=db,
            project_id=project_id,
            action="Created",
            category="Progress",
            entity_type="VerifiedProgress",
            entity_id=rec.id,
            details=f"Recorded verified progress for activity {activity.activity_code}",
            new_value=f"Quantity: {data.actual_quantity}, %: {data.percent_complete}",
        )

        db.commit()
        db.refresh(rec)
        return rec

    @staticmethod
    def get_activity_progress_summary(db: Session, project_id: str, activity_id: str) -> Dict[str, Any]:
        activity = ScheduleService.get_activity_by_id(db, project_id, activity_id)
        records = ProgressService.list_progress_records(db, project_id, activity_id=activity.id)

        total_quantity_installed = sum(r.quantity_installed for r in records if r.quantity_installed is not None)
        latest_pct = activity.progress

        return {
            "activity_id": activity.id,
            "activity_code": activity.activity_code,
            "activity_name": activity.name,
            "level": activity.level,
            "planned_quantity": activity.quantity,
            "unit": activity.unit,
            "total_verified_quantity": total_quantity_installed,
            "current_progress_percent": latest_pct,
            "status": activity.status,
            "records_count": len(records),
            "recent_records": [
                {
                    "id": r.id,
                    "date": r.verified_date.isoformat(),
                    "quantity": r.quantity_installed,
                    "physical_percent": r.physical_percent,
                    "verified_by": r.verified_by,
                    "notes": r.notes,
                }
                for r in records[:5]
            ],
        }
