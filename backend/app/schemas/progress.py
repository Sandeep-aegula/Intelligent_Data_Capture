from datetime import datetime, date
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict


class VerifiedProgressCreate(BaseModel):
    schedule_activity_id: str
    extracted_event_id: Optional[str] = None
    planner_review_id: Optional[str] = None
    progress_date: date
    actual_quantity: Optional[float] = None
    cumulative_quantity: Optional[float] = None
    unit_of_measure: Optional[str] = None
    percent_complete: Optional[float] = Field(None, ge=0.0, le=100.0)
    actual_start_date: Optional[date] = None
    actual_finish_date: Optional[date] = None
    status: str = Field(default="In Progress", max_length=50)
    verification_method: str = Field(default="Planner Review", max_length=100)
    verified_by: Optional[str] = Field(None, max_length=255)
    evidence_notes: Optional[str] = None
    site_conditions: Optional[str] = None


class VerifiedProgressUpdate(BaseModel):
    progress_date: Optional[date] = None
    actual_quantity: Optional[float] = None
    cumulative_quantity: Optional[float] = None
    unit_of_measure: Optional[str] = None
    percent_complete: Optional[float] = Field(None, ge=0.0, le=100.0)
    actual_start_date: Optional[date] = None
    actual_finish_date: Optional[date] = None
    status: Optional[str] = None
    evidence_notes: Optional[str] = None


class VerifiedProgressResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    project_id: str
    schedule_activity_id: str
    activity_code: Optional[str] = None
    activity_name: Optional[str] = None
    extracted_event_id: Optional[str] = None
    planner_review_id: Optional[str] = None
    progress_date: date
    actual_quantity: Optional[float] = None
    cumulative_quantity: Optional[float] = None
    unit_of_measure: Optional[str] = None
    percent_complete: Optional[float] = None
    actual_start_date: Optional[date] = None
    actual_finish_date: Optional[date] = None
    status: str
    verification_method: str
    verified_by: Optional[str] = None
    evidence_notes: Optional[str] = None
    site_conditions: Optional[str] = None
    created_at: datetime
    updated_at: datetime
