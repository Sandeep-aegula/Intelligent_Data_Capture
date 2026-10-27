from typing import Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.api.deps import get_current_project
from app.models.project import Project
from app.services.extraction_service import ExtractionService
from app.schemas.report import ExtractedEventUpdate

router = APIRouter(prefix="/projects/{project_id}", tags=["Activity Extraction"])


@router.post("/reports/{report_id}/extract", status_code=status.HTTP_200_OK)
def extract_report_events(
    report_id: str,
    project: Project = Depends(get_current_project),
    db: Session = Depends(get_db),
):
    """
    Trigger deterministic extraction for daily report text.
    Extracts construction activities, quantities, units, dates, and strict progress.
    """
    events = ExtractionService.extract_events_from_report(db, project.id, report_id)
    return [
        {
            "id": e.id,
            "report_id": e.report_id,
            "activity_name": e.activity_name,
            "event_type": e.event_type,
            "discipline": e.discipline,
            "location": e.location,
            "quantity": e.quantity,
            "unit": e.unit,
            "progress": e.progress,
            "evidence": e.evidence,
            "event_date": e.event_date.isoformat() if e.event_date else None,
            "created_at": e.created_at.isoformat(),
        }
        for e in events
    ]


@router.get("/reports/{report_id}/events", status_code=status.HTTP_200_OK)
def list_report_events(
    report_id: str,
    project: Project = Depends(get_current_project),
    db: Session = Depends(get_db),
):
    """List all extracted events for a specific daily report."""
    events = ExtractionService.list_events_for_report(db, project.id, report_id)
    return [
        {
            "id": e.id,
            "report_id": e.report_id,
            "activity_name": e.activity_name,
            "event_type": e.event_type,
            "discipline": e.discipline,
            "location": e.location,
            "quantity": e.quantity,
            "unit": e.unit,
            "progress": e.progress,
            "evidence": e.evidence,
            "event_date": e.event_date.isoformat() if e.event_date else None,
        }
        for e in events
    ]


@router.patch("/events/{event_id}", status_code=status.HTTP_200_OK)
def update_extracted_event(
    event_id: str,
    data: ExtractedEventUpdate,
    project: Project = Depends(get_current_project),
    db: Session = Depends(get_db),
):
    """Update or correct an extracted event."""
    e = ExtractionService.update_event(
        db=db,
        project_id=project.id,
        event_id=event_id,
        activity_name=data.activity_description,
        discipline=data.discipline,
        location=data.area,
        quantity=data.quantity,
        unit=data.unit_of_measure,
        progress=f"{data.percent_complete:.1f}%" if data.percent_complete is not None else None,
    )
    return {
        "id": e.id,
        "activity_name": e.activity_name,
        "quantity": e.quantity,
        "unit": e.unit,
        "progress": e.progress,
    }


@router.post("/events/{event_id}/validate", status_code=status.HTTP_200_OK)
def validate_extracted_event(
    event_id: str,
    project: Project = Depends(get_current_project),
    db: Session = Depends(get_db),
):
    """Mark extracted event as validated."""
    event = ExtractionService.get_event_by_id(db, project.id, event_id)
    return {
        "id": event.id,
        "status": "Validated",
        "activity_name": event.activity_name,
    }
