from datetime import datetime, date
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict


class DelayEventCreate(BaseModel):
    category: str = Field(..., max_length=100, description="Weather, Material Delay, Permit, Manpower, etc.")
    title: str = Field(..., max_length=255)
    description: str = Field(...)
    reported_date: date
    schedule_activity_id: Optional[str] = None
    daily_report_id: Optional[str] = None
    extracted_event_id: Optional[str] = None
    severity: str = Field(default="Medium", max_length=50)
    delay_days: Optional[int] = Field(None, ge=0)
    is_critical_path_impact: bool = False
    status: str = Field(default="Open", max_length=50)
    mitigation_action: Optional[str] = None
    evidence_text: Optional[str] = None


class DelayEventUpdate(BaseModel):
    category: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    schedule_activity_id: Optional[str] = None
    severity: Optional[str] = None
    delay_days: Optional[int] = Field(None, ge=0)
    is_critical_path_impact: Optional[bool] = None
    status: Optional[str] = None
    mitigation_action: Optional[str] = None
    resolved_date: Optional[date] = None
    evidence_text: Optional[str] = None


class DelayCloseRequest(BaseModel):
    resolved_date: Optional[date] = None
    mitigation_action: str = Field(..., min_length=3, description="Summary of action taken to resolve or mitigate delay")


class DelayEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    project_id: str
    schedule_activity_id: Optional[str] = None
    activity_code: Optional[str] = None
    activity_name: Optional[str] = None
    daily_report_id: Optional[str] = None
    extracted_event_id: Optional[str] = None
    category: str
    title: str
    description: str
    severity: str
    status: str
    reported_date: date
    resolved_date: Optional[date] = None
    delay_days: Optional[int] = None
    is_critical_path_impact: bool
    mitigation_action: Optional[str] = None
    evidence_text: Optional[str] = None
    created_at: datetime
    updated_at: datetime
