from typing import Optional
from fastapi import APIRouter, Depends, status, Query, Response
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.api.deps import get_current_project
from app.models.project import Project
from app.services.audit_service import AuditService

router = APIRouter(prefix="/projects/{project_id}/audit", tags=["Audit Trail"])


@router.get("", status_code=status.HTTP_200_OK)
def list_audit_trail(
    category: Optional[str] = Query(None),
    entity_type: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    project: Project = Depends(get_current_project),
    db: Session = Depends(get_db),
):
    """
    Retrieve immutable append-only audit trail logs.
    Edit and delete endpoints are strictly forbidden.
    """
    logs = AuditService.get_audit_logs(
        db, project.id, category=category, entity_type=entity_type, limit=limit, offset=offset
    )
    total = AuditService.count_audit_logs(db, project.id)

    return {
        "total_count": total,
        "items": [
            {
                "id": entry.id,
                "project_id": entry.project_id,
                "timestamp": entry.timestamp.isoformat(),
                "action": entry.action,
                "category": entry.category,
                "user": entry.user,
                "entity_type": entry.entity_type,
                "entity_id": entry.entity_id,
                "details": entry.details,
                "confidence": entry.confidence,
                "previous_value": entry.previous_value,
                "newValue": entry.newValue,
            }
            for entry in logs
        ],
    }


@router.get("/export", status_code=status.HTTP_200_OK)
def export_audit_csv(
    project: Project = Depends(get_current_project),
    db: Session = Depends(get_db),
):
    """Export project audit logs to downloadable CSV."""
    csv_content = AuditService.export_audit_csv(db, project.id)
    filename = f"audit_trail_{project.code}_{project.id[:8]}.csv"
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
