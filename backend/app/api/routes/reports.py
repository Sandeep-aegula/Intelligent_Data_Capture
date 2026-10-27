from typing import Optional, List
from datetime import date
from fastapi import APIRouter, Depends, status, Query, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.api.deps import get_current_project
from app.models.project import Project
from app.models.document_and_report import ProjectDocument
from app.services.report_service import ReportService
from app.services.document_service import DocumentService
from app.schemas.report import DailyReportCreate, DailyReportUpdate

router = APIRouter(prefix="/projects/{project_id}", tags=["Documents & Reports"])


@router.get("/reports", status_code=status.HTTP_200_OK)
def list_reports(
    status_filter: Optional[str] = Query(None, alias="status"),
    project: Project = Depends(get_current_project),
    db: Session = Depends(get_db),
):
    """List all daily site reports for the project."""
    reports = ReportService.list_reports(db, project.id, status=status_filter)
    return [
        {
            "id": r.id,
            "project_id": r.project_id,
            "report_number": r.report_number,
            "report_date": r.report_date.isoformat(),
            "source_type": r.source_type,
            "uploaded_by": r.uploaded_by,
            "status": r.status,
            "original_text": r.original_text,
            "document_id": r.document_id,
            "extracted_event_count": len(r.events) if r.events else 0,
            "created_at": r.created_at.isoformat(),
        }
        for r in reports
    ]


@router.post("/reports", status_code=status.HTTP_201_CREATED)
def create_report(
    data: DailyReportCreate,
    project: Project = Depends(get_current_project),
    db: Session = Depends(get_db),
):
    """Create a new daily report from raw narrative text."""
    report = ReportService.create_direct_report(db, project.id, data)
    return {
        "id": report.id,
        "report_number": report.report_number,
        "report_date": report.report_date.isoformat(),
        "status": report.status,
        "source_type": report.source_type,
    }


@router.get("/reports/{report_id}", status_code=status.HTTP_200_OK)
def get_report(
    report_id: str,
    project: Project = Depends(get_current_project),
    db: Session = Depends(get_db),
):
    """Get single daily report details."""
    r = ReportService.get_report_by_id(db, project.id, report_id)
    return {
        "id": r.id,
        "project_id": r.project_id,
        "report_number": r.report_number,
        "report_date": r.report_date.isoformat(),
        "source_type": r.source_type,
        "uploaded_by": r.uploaded_by,
        "status": r.status,
        "original_text": r.original_text,
        "document_id": r.document_id,
        "extracted_event_count": len(r.events) if r.events else 0,
        "created_at": r.created_at.isoformat(),
    }


@router.patch("/reports/{report_id}", status_code=status.HTTP_200_OK)
def update_report(
    report_id: str,
    data: DailyReportUpdate,
    project: Project = Depends(get_current_project),
    db: Session = Depends(get_db),
):
    """Update report metadata or text."""
    r = ReportService.update_report(db, project.id, report_id, data)
    return {
        "id": r.id,
        "status": r.status,
        "report_date": r.report_date.isoformat(),
    }


@router.post("/reports/upload", status_code=status.HTTP_201_CREATED)
async def upload_report_document(
    file: UploadFile = File(...),
    report_date: Optional[str] = Form(None),
    author: Optional[str] = Form(None),
    project: Project = Depends(get_current_project),
    db: Session = Depends(get_db),
):
    """Upload a report document (PDF, Word, Excel, TXT) and auto-create DailyReport."""
    parsed_date = None
    if report_date:
        try:
            parsed_date = date.fromisoformat(report_date)
        except Exception:
            pass

    content = await file.read()
    report = ReportService.create_report_from_upload(
        db=db,
        project_id=project.id,
        filename=file.filename or "uploaded_report",
        file_bytes=content,
        report_date=parsed_date,
        author=author,
    )
    return {
        "id": report.id,
        "report_number": report.report_number,
        "report_date": report.report_date.isoformat(),
        "source_type": report.source_type,
        "status": report.status,
        "preview_text": report.original_text[:300],
    }


@router.get("/documents", status_code=status.HTTP_200_OK)
def list_project_documents(
    project: Project = Depends(get_current_project),
    db: Session = Depends(get_db),
):
    """List all stored project documents and uploaded files."""
    docs = db.query(ProjectDocument).filter(ProjectDocument.project_id == project.id).all()
    return [
        {
            "id": d.id,
            "filename": d.filename,
            "file_type": d.file_type,
            "file_size_bytes": d.file_size_bytes,
            "created_at": d.created_at.isoformat(),
        }
        for d in docs
    ]


@router.get("/documents/{document_id}", status_code=status.HTTP_200_OK)
def get_project_document(
    document_id: str,
    project: Project = Depends(get_current_project),
    db: Session = Depends(get_db),
):
    """Retrieve document metadata and extracted text preview."""
    doc = DocumentService.get_document(db, project.id, document_id)
    return {
        "id": doc.id,
        "filename": doc.filename,
        "file_type": doc.file_type,
        "file_size_bytes": doc.file_size_bytes,
        "extracted_text": doc.extracted_text,
        "created_at": doc.created_at.isoformat(),
    }
