from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.matching import MatchingCandidateResponse


class PlannerReviewResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    project_id: str
    extracted_event_id: str
    daily_report_id: Optional[str] = None
    suggested_activity_id: Optional[str] = None
    suggested_candidate_id: Optional[str] = None
    status: str
    decision: Optional[str] = None
    decision_timestamp: Optional[datetime] = None
    reviewed_by: Optional[str] = None
    planner_notes: Optional[str] = None
    reassigned_activity_id: Optional[str] = None
    reassignment_reason: Optional[str] = None
    clarification_request: Optional[str] = None
    context_response: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    # Included details for frontend planner UI
    event_description: Optional[str] = None
    evidence_text: Optional[str] = None
    event_date: Optional[str] = None
    event_quantity: Optional[float] = None
    event_unit: Optional[str] = None
    suggested_activity_code: Optional[str] = None
    suggested_activity_name: Optional[str] = None
    confidence_score: Optional[float] = None
    candidates: List[MatchingCandidateResponse] = []


class ReviewApproveRequest(BaseModel):
    planner_name: Optional[str] = Field("Project Planner", max_length=255)
    notes: Optional[str] = Field(None, max_length=1000)
    confirmed_quantity: Optional[float] = None
    confirmed_unit: Optional[str] = None
    confirmed_percent_complete: Optional[float] = Field(None, ge=0.0, le=100.0)


class ReviewRejectRequest(BaseModel):
    planner_name: Optional[str] = Field("Project Planner", max_length=255)
    reason: str = Field(..., min_length=3, max_length=1000, description="Reason for rejecting link")


class ReviewReassignRequest(BaseModel):
    new_activity_id: str = Field(..., description="Target schedule activity ID in the same project")
    planner_name: Optional[str] = Field("Project Planner", max_length=255)
    reason: str = Field(..., min_length=3, max_length=1000, description="Reason for reassigning")
    confirmed_quantity: Optional[float] = None
    confirmed_unit: Optional[str] = None
    confirmed_percent_complete: Optional[float] = Field(None, ge=0.0, le=100.0)


class ReviewContextRequest(BaseModel):
    planner_name: Optional[str] = Field("Project Planner", max_length=255)
    question: str = Field(..., min_length=5, max_length=1000, description="Context or question requested from site team")
