import io
import csv
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from app.models.audit import AuditLog
from app.core.logging_config import logger


class AuditService:
    @staticmethod
    def log_action(
        db: Session,
        project_id: str,
        action: str,
        category: str,
        entity_type: str,
        entity_id: str,
        details: str,
        user: str = "Project Planner",
        confidence: Optional[float] = None,
        previous_value: Optional[str] = None,
        new_value: Optional[str] = None,
    ) -> AuditLog:
        """
        Record an immutable append-only audit entry.
        Never exposes edit or delete functionality.
        """
        audit_entry = AuditLog(
            project_id=project_id,
            action=action,
            category=category,
            user=user,
            entity_type=entity_type,
            entity_id=str(entity_id),
            details=details,
            confidence=confidence,
            previous_value=str(previous_value) if previous_value is not None else None,
            newValue=str(new_value) if new_value is not None else None,
            timestamp=datetime.now(timezone.utc),
        )
        db.add(audit_entry)
        # Flush to persist within caller's transaction
        db.flush()
        logger.info(f"[AUDIT] Project {project_id} | {action} on {entity_type}:{entity_id} by {user}")
        return audit_entry

    @staticmethod
    def get_audit_logs(
        db: Session,
        project_id: str,
        category: Optional[str] = None,
        entity_type: Optional[str] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> List[AuditLog]:
        query = db.query(AuditLog).filter(AuditLog.project_id == project_id)
        if category:
            query = query.filter(AuditLog.category == category)
        if entity_type:
            query = query.filter(AuditLog.entity_type == entity_type)
        return query.order_by(AuditLog.timestamp.desc()).offset(offset).limit(limit).all()

    @staticmethod
    def count_audit_logs(db: Session, project_id: str) -> int:
        return db.query(AuditLog).filter(AuditLog.project_id == project_id).count()

    @staticmethod
    def export_audit_csv(db: Session, project_id: str) -> str:
        """Export project-scoped audit trail to formatted CSV."""
        logs = (
            db.query(AuditLog)
            .filter(AuditLog.project_id == project_id)
            .order_by(AuditLog.timestamp.desc())
            .all()
        )
        output = io.StringIO()
        writer = csv.writer(output, quoting=csv.QUOTE_MINIMAL)
        writer.writerow([
            "Audit ID",
            "Timestamp (UTC)",
            "User",
            "Action",
            "Category",
            "Entity Type",
            "Entity ID",
            "Details",
            "Confidence",
            "Previous Value",
            "New Value",
        ])
        for entry in logs:
            writer.writerow([
                entry.id,
                entry.timestamp.isoformat() if entry.timestamp else "",
                entry.user,
                entry.action,
                entry.category,
                entry.entity_type,
                entry.entity_id,
                entry.details,
                f"{entry.confidence:.1f}%" if entry.confidence is not None else "",
                entry.previous_value or "",
                entry.newValue or "",
            ])
        return output.getvalue()
