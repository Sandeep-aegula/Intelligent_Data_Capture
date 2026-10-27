from datetime import datetime, date
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class DisciplineSummary(BaseModel):
    discipline: str
    total_activities: int
    completed_activities: int
    in_progress_activities: int
    average_progress: float
    planned_quantity_total: Optional[float] = 0.0
    actual_quantity_total: Optional[float] = 0.0


class PlannedVsActualTrend(BaseModel):
    period: str  # e.g., '2026-W40' or '2026-10-15'
    planned_progress: float
    actual_progress: float
    verified_events_count: int = 0


class ScheduleStatusSummary(BaseModel):
    not_started: int = 0
    in_progress: int = 0
    completed: int = 0
    delayed: int = 0
    critical_path_delayed: int = 0


class DashboardKPIs(BaseModel):
    total_activities: int = 0
    completed_activities: int = 0
    in_progress_activities: int = 0
    not_started_activities: int = 0
    critical_path_activities: int = 0
    overall_progress_percent: float = 0.0
    pending_reviews_count: int = 0
    approved_reviews_count: int = 0
    total_reports_count: int = 0
    processed_reports_count: int = 0
    active_delays_count: int = 0
    critical_delays_count: int = 0


class DashboardResponse(BaseModel):
    project_id: str
    project_name: str
    project_code: str
    kpis: DashboardKPIs
    status_distribution: ScheduleStatusSummary
    discipline_summaries: List[DisciplineSummary] = []
    progress_trends: List[PlannedVsActualTrend] = []
    recent_delays: List[Dict[str, Any]] = []
    recent_reports: List[Dict[str, Any]] = []
    generated_at: datetime
