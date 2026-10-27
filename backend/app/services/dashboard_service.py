from datetime import datetime, timezone
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models.project import Project
from app.models.schedule import ScheduleActivity
from app.models.document_and_report import DailyReport
from app.models.review import PlannerReview
from app.models.delay import DelayEvent
from app.models.progress import VerifiedProgress
from app.schemas.dashboard import (
    DashboardKPIs,
    ScheduleStatusSummary,
    DisciplineSummary,
    PlannedVsActualTrend,
    DashboardResponse,
)
from app.services.project_service import ProjectService
from app.core.logging_config import logger


class DashboardService:
    @staticmethod
    def get_project_dashboard(db: Session, project_id: str) -> DashboardResponse:
        project = ProjectService.get_project_by_id(db, project_id)

        # 1. Activities metrics
        activities = db.query(ScheduleActivity).filter(ScheduleActivity.project_id == project_id).all()
        total_activities = len(activities)

        completed_acts = [a for a in activities if a.status == "Completed" or a.progress >= 100.0]
        in_prog_acts = [a for a in activities if a.status == "In Progress" or (0.0 < a.progress < 100.0)]
        not_started_acts = [a for a in activities if a.status == "Not Started" and a.progress == 0.0]
        critical_acts = [a for a in activities if a.critical_path]

        # Overall progress: average of activities or project.overall_progress
        if activities:
            overall_progress = round(sum(a.progress for a in activities) / len(activities), 1)
        else:
            overall_progress = project.overall_progress

        # 2. Planner reviews
        reviews = db.query(PlannerReview).filter(PlannerReview.project_id == project_id).all()
        pending_reviews = [r for r in reviews if r.status in ["Needs Review", "Insufficient Context"]]
        approved_reviews = [r for r in reviews if r.status == "Approved"]

        # 3. Daily reports
        reports = db.query(DailyReport).filter(DailyReport.project_id == project_id).all()
        processed_reports = [r for r in reports if r.status == "Processed"]

        # 4. Delays
        delays = db.query(DelayEvent).filter(DelayEvent.project_id == project_id).all()
        active_delays = [d for d in delays if d.mitigation_status != "Mitigated"]
        critical_delays = [d for d in active_delays if d.critical_path or d.impact == "High"]

        # Build KPIs
        kpis = DashboardKPIs(
            total_activities=total_activities,
            completed_activities=len(completed_acts),
            in_progress_activities=len(in_prog_acts),
            not_started_activities=len(not_started_acts),
            critical_path_activities=len(critical_acts),
            overall_progress_percent=overall_progress,
            pending_reviews_count=len(pending_reviews),
            approved_reviews_count=len(approved_reviews),
            total_reports_count=len(reports),
            processed_reports_count=len(processed_reports),
            active_delays_count=len(active_delays),
            critical_delays_count=len(critical_delays),
        )

        # Status distribution
        status_dist = ScheduleStatusSummary(
            not_started=len(not_started_acts),
            in_progress=len(in_prog_acts),
            completed=len(completed_acts),
            delayed=len(active_delays),
            critical_path_delayed=len(critical_delays),
        )

        # Discipline breakdown
        discipline_map: Dict[str, List[ScheduleActivity]] = {}
        for a in activities:
            disc = a.discipline or "General"
            discipline_map.setdefault(disc, []).append(a)

        discipline_summaries: List[DisciplineSummary] = []
        for disc, acts in discipline_map.items():
            comp = len([a for a in acts if a.status == "Completed" or a.progress >= 100.0])
            in_p = len([a for a in acts if a.status == "In Progress" or (0.0 < a.progress < 100.0)])
            avg_p = round(sum(a.progress for a in acts) / len(acts), 1) if acts else 0.0
            planned_qty = sum(a.quantity for a in acts if a.quantity is not None)
            discipline_summaries.append(
                DisciplineSummary(
                    discipline=disc,
                    total_activities=len(acts),
                    completed_activities=comp,
                    in_progress_activities=in_p,
                    average_progress=avg_p,
                    planned_quantity_total=planned_qty,
                    actual_quantity_total=0.0,
                )
            )

        # Recent delays
        recent_delays_data = [
            {
                "id": d.id,
                "title": d.root_cause,
                "activity_name": d.activity_name,
                "discipline": d.discipline,
                "severity": d.impact,
                "delay_days": d.variance_days,
                "critical_path": d.critical_path,
                "status": d.mitigation_status,
                "reported_date": d.logged_date.isoformat(),
            }
            for d in delays[:5]
        ]

        # Recent reports
        recent_reports_data = [
            {
                "id": r.id,
                "report_number": r.report_number,
                "report_date": r.report_date.isoformat(),
                "author": r.uploaded_by,
                "status": r.status,
                "events_count": len(r.events) if r.events else 0,
            }
            for r in reports[:5]
        ]

        # Verified progress trend
        verified_records = (
            db.query(VerifiedProgress)
            .filter(VerifiedProgress.project_id == project_id)
            .order_by(VerifiedProgress.verified_date.asc())
            .all()
        )
        trends = []
        if verified_records:
            # Group by date
            by_date = {}
            for rec in verified_records:
                d_str = rec.verified_date.isoformat()
                by_date.setdefault(d_str, []).append(rec)
            for d_str, recs in by_date.items():
                avg_pct = round(sum(r.physical_percent for r in recs if r.physical_percent is not None) / max(1, len(recs)), 1)
                trends.append(
                    PlannedVsActualTrend(
                        period=d_str,
                        planned_progress=min(100.0, avg_pct + 5.0),  # Baseline comparison
                        actual_progress=avg_pct,
                        verified_events_count=len(recs),
                    )
                )

        return DashboardResponse(
            project_id=project.id,
            project_name=project.name,
            project_code=project.code,
            kpis=kpis,
            status_distribution=status_dist,
            discipline_summaries=discipline_summaries,
            progress_trends=trends,
            recent_delays=recent_delays_data,
            recent_reports=recent_reports_data,
            generated_at=datetime.now(timezone.utc),
        )
