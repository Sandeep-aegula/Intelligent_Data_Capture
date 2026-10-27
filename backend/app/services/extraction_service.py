import re
from datetime import date, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.document_and_report import DailyReport, ExtractedEvent
from app.models.knowledge import ProjectTerminology
from app.services.report_service import ReportService
from app.services.audit_service import AuditService
from app.core.logging_config import logger


class ExtractionService:
    # Common construction units
    UNIT_PATTERN = re.compile(
        r"\b(\d+(?:\.\d+)?)\s*(meters?|m\b|linear meters?|spools?|joints?|welds?|tons?|tonnes?|cubic meters?|m3\b|kg\b|sqm\b|valves?|cables?|feet|ft\b)\b",
        re.IGNORECASE,
    )

    # Explicit percentage: e.g. "45% complete", "progress: 30%"
    PERCENT_PATTERN = re.compile(
        r"\b(\d+(?:\.\d+)?)\s*%\s*(?:complete|progress|done|finished)?\b",
        re.IGNORECASE,
    )

    # Discipline keywords
    DISCIPLINE_MAP = {
        "piping": ["pipe", "piping", "spool", "flange", "weld", "welder", "valve", "hydrotest"],
        "civil": ["concrete", "excavation", "foundation", "backfill", "rebar", "trench"],
        "electrical": ["cable", "tray", "transformer", "switchgear", "conduit", "substation"],
        "mechanical": ["pump", "compressor", "vessel", "exchanger", "turbine", "alignment"],
        "structural": ["steel", "beam", "column", "trestle", "erection", "bolting"],
        "quality": ["ndt", "rt", "x-ray", "radiography", "inspection", "punchlist"],
    }

    # Delay trigger words
    DELAY_TRIGGERS = ["delay", "delayed", "hold", "stoppage", "waiting for", "awaiting", "shortage", "customs", "strike", "bad weather", "rain delay"]

    @staticmethod
    def _detect_discipline(text: str, project_terms: List[ProjectTerminology]) -> Optional[str]:
        text_lower = text.lower()
        # Check verified project terminology first
        for pt in project_terms:
            if pt.term.lower() in text_lower:
                return pt.discipline
            for alias in (pt.aliases or []):
                if alias.lower() in text_lower:
                    return pt.discipline

        for disc, keywords in ExtractionService.DISCIPLINE_MAP.items():
            for kw in keywords:
                if re.search(r"\b" + re.escape(kw) + r"\b", text_lower):
                    return disc.capitalize()
        return None

    @staticmethod
    def _detect_area(text: str) -> Optional[str]:
        # Matches "Unit A", "Unit 12", "Bay 4", "Rack Bay 3", "Substation 9"
        match = re.search(r"\b(Unit\s+[A-Z0-9]+|Bay\s+\d+|Rack\s+[A-Z0-9]+|Sector\s+\d+|Area\s+[A-Z0-9]+)\b", text, re.IGNORECASE)
        if match:
            return match.group(0).strip()
        return None

    @staticmethod
    def _resolve_event_date(text: str, report_date: date) -> tuple[date, str]:
        text_lower = text.lower()
        if "yesterday" in text_lower:
            return report_date - timedelta(days=1), "Resolved from relative term 'yesterday' based on report date"
        return report_date, f"Derived from report date {report_date}"

    @staticmethod
    def extract_events_from_report(db: Session, project_id: str, report_id: str) -> List[ExtractedEvent]:
        """
        Deterministic event extraction pipeline.
        Rule: If quantities are present but no explicit percent,
        percent completion is left 'Not specified'. Never fabricate 100% or invented percentages.
        """
        report = ReportService.get_report_by_id(db, project_id, report_id)
        raw_text = report.original_text

        # Fetch verified terminology for this project
        project_terms = (
            db.query(ProjectTerminology)
            .filter(ProjectTerminology.project_id == project_id, ProjectTerminology.is_verified == True)
            .all()
        )

        # Split text into paragraphs or numbered lines
        lines = [line.strip() for line in raw_text.splitlines() if line.strip()]
        candidate_blocks = []

        for line in lines:
            # Skip pure headers or metadata
            if line.upper().startswith("PROJECT:") or line.upper().startswith("DAILY SITE PROGRESS") or line.upper().startswith("SUMMARY OF"):
                continue
            # Strip list numbers like "1. ", "2) ", "- "
            clean_line = re.sub(r"^(\d+[\.\)]\s*|-\s*)", "", line).strip()
            if len(clean_line) >= 15:
                candidate_blocks.append((clean_line, line))

        extracted_events: List[ExtractedEvent] = []

        for clean_text, raw_evidence in candidate_blocks:
            # Check for delay indicators
            is_delay = any(trigger in clean_text.lower() for trigger in ExtractionService.DELAY_TRIGGERS)
            event_type = "DELAY" if is_delay else "IN_PROGRESS"

            # Detect quantity and unit
            quantity: Optional[float] = None
            unit: Optional[str] = None
            unit_match = ExtractionService.UNIT_PATTERN.search(clean_text)
            if unit_match:
                try:
                    quantity = float(unit_match.group(1))
                    unit = unit_match.group(2).capitalize()
                except Exception:
                    pass

            # Detect explicit percent
            percent_str = "Not specified"
            percent_match = ExtractionService.PERCENT_PATTERN.search(clean_text)
            if percent_match:
                try:
                    val = float(percent_match.group(1))
                    percent_str = f"{val:.1f}%"
                except Exception:
                    pass
            elif "completed" in clean_text.lower() and not quantity:
                # If stated "completed activity X" without a partial quantity
                event_type = "COMPLETED"

            # Detect discipline & area
            discipline = ExtractionService._detect_discipline(clean_text, project_terms)
            area = ExtractionService._detect_area(clean_text)

            # Resolve date
            event_date, _ = ExtractionService._resolve_event_date(clean_text, report.report_date)

            event = ExtractedEvent(
                project_id=project_id,
                report_id=report.id,
                event_type=event_type,
                activity_name=clean_text[:250],
                discipline=discipline,
                location=area,
                quantity=quantity,
                unit=unit,
                progress=percent_str,  # Strictly 'Not specified' unless explicit in report!
                evidence=raw_evidence,
                event_date=event_date,
            )
            db.add(event)
            extracted_events.append(event)

        # Update report status and extracted count
        report.status = "Processed"
        db.flush()

        AuditService.log_action(
            db=db,
            project_id=project_id,
            action="Extracted",
            category="Extraction",
            entity_type="DailyReport",
            entity_id=report.id,
            details=f"Extracted {len(extracted_events)} event(s) from report #{report.report_number}",
            new_value=str(len(extracted_events)),
        )

        db.commit()
        for ev in extracted_events:
            db.refresh(ev)

        logger.info(f"Extracted {len(extracted_events)} events from report {report_id} in project {project_id}")
        return extracted_events

    @staticmethod
    def list_events_for_report(db: Session, project_id: str, report_id: str) -> List[ExtractedEvent]:
        return (
            db.query(ExtractedEvent)
            .filter(ExtractedEvent.project_id == project_id, ExtractedEvent.report_id == report_id)
            .order_by(ExtractedEvent.created_at.asc())
            .all()
        )

    @staticmethod
    def get_event_by_id(db: Session, project_id: str, event_id: str) -> ExtractedEvent:
        event = (
            db.query(ExtractedEvent)
            .filter(ExtractedEvent.id == event_id, ExtractedEvent.project_id == project_id)
            .first()
        )
        if not event:
            raise ResourceNotFoundException(f"Extracted event '{event_id}' not found in project '{project_id}'.")
        return event

    @staticmethod
    def update_event(
        db: Session,
        project_id: str,
        event_id: str,
        activity_name: Optional[str] = None,
        discipline: Optional[str] = None,
        location: Optional[str] = None,
        quantity: Optional[float] = None,
        unit: Optional[str] = None,
        progress: Optional[str] = None,
    ) -> ExtractedEvent:
        event = ExtractionService.get_event_by_id(db, project_id, event_id)
        if activity_name is not None:
            event.activity_name = activity_name
        if discipline is not None:
            event.discipline = discipline
        if location is not None:
            event.location = location
        if quantity is not None:
            event.quantity = quantity
        if unit is not None:
            event.unit = unit
        if progress is not None:
            event.progress = progress

        db.commit()
        db.refresh(event)
        return event
