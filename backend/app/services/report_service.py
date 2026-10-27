from datetime import date, datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.document_and_report import DailyReport, ProjectDocument
from app.schemas.report import DailyReportCreate, DailyReportUpdate
from app.services.audit_service import AuditService
from app.services.document_service import DocumentService
from app.core.exceptions import ResourceNotFoundException, ValidationException
from app.core.logging_config import logger


class ReportService:
    @staticmethod
    def list_reports(
        db: Session,
        project_id: str,
        status: Optional[str] = None,
        from_date: Optional[date] = None,
        to_date: Optional[date] = None,
    ) -> List[DailyReport]:
        query = db.query(DailyReport).filter(DailyReport.project_id == project_id)
        if status:
            query = query.filter(DailyReport.status == status)
        if from_date:
            query = query.filter(DailyReport.report_date >= from_date)
        if to_date:
            query = query.filter(DailyReport.report_date <= to_date)
        return query.order_by(DailyReport.report_date.desc(), DailyReport.report_number.desc()).all()

    @staticmethod
    def get_report_by_id(db: Session, project_id: str, report_id: str) -> DailyReport:
        report = (
            db.query(DailyReport)
            .filter(DailyReport.id == report_id, DailyReport.project_id == project_id)
            .first()
        )
        if not report:
            raise ResourceNotFoundException(f"Daily report '{report_id}' not found in project '{project_id}'.")
        return report

    @staticmethod
    def create_direct_report(db: Session, project_id: str, data: DailyReportCreate) -> DailyReport:
        # Determine next report number if not given
        if data.report_number and data.report_number.isdigit():
            rep_num = int(data.report_number)
        else:
            latest = (
                db.query(DailyReport)
                .filter(DailyReport.project_id == project_id)
                .order_by(DailyReport.report_number.desc())
                .first()
            )
            rep_num = (latest.report_number + 1) if latest else 1

        report = DailyReport(
            project_id=project_id,
            report_number=rep_num,
            report_date=data.report_date,
            source_type="Direct Text",
            uploaded_by=data.author_name or "Site Inspector",
            status="Processed",
            original_text=data.raw_text,
        )
        db.add(report)
        db.flush()

        AuditService.log_action(
            db=db,
            project_id=project_id,
            action="Created",
            category="Report",
            entity_type="DailyReport",
            entity_id=report.id,
            details=f"Logged Daily Site Report #{report.report_number} for {report.report_date}",
            new_value=str(report.report_number),
        )

        db.commit()
        db.refresh(report)
        return report

    @staticmethod
    def create_report_from_upload(
        db: Session,
        project_id: str,
        filename: str,
        file_bytes: bytes,
        report_date: Optional[date] = None,
        author: Optional[str] = None,
    ) -> DailyReport:
        # Save file and extract text
        doc = DocumentService.save_and_process_upload(db, project_id, filename, file_bytes)

        # Next report number
        latest = (
            db.query(DailyReport)
            .filter(DailyReport.project_id == project_id)
            .order_by(DailyReport.report_number.desc())
            .first()
        )
        rep_num = (latest.report_number + 1) if latest else 1

        report = DailyReport(
            project_id=project_id,
            report_number=rep_num,
            report_date=report_date or date.today(),
            source_type=f"File: {doc.file_type.upper()}",
            uploaded_by=author or "Site Team",
            status="Processed",
            original_text=doc.extracted_text or f"Uploaded file: {filename}",
            document_id=doc.id,
        )
        db.add(report)
        db.flush()

        AuditService.log_action(
            db=db,
            project_id=project_id,
            action="Uploaded",
            category="Report",
            entity_type="DailyReport",
            entity_id=report.id,
            details=f"Uploaded report document '{filename}' as Daily Report #{report.report_number}",
            new_value=str(report.report_number),
        )

        db.commit()
        db.refresh(report)
        return report

    @staticmethod
    def update_report(db: Session, project_id: str, report_id: str, data: DailyReportUpdate) -> DailyReport:
        report = ReportService.get_report_by_id(db, project_id, report_id)
        update_dict = data.model_dump(exclude_unset=True)

        if not update_dict:
            return report

        if "raw_text" in update_dict and update_dict["raw_text"]:
            report.original_text = update_dict["raw_text"]
        if "report_date" in update_dict and update_dict["report_date"]:
            report.report_date = update_dict["report_date"]
        if "processing_status" in update_dict and update_dict["processing_status"]:
            report.status = update_dict["processing_status"]
        if "author_name" in update_dict and update_dict["author_name"]:
            report.uploaded_by = update_dict["author_name"]

        db.commit()
        db.refresh(report)
        return report
