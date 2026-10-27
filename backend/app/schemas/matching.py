from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict


class MatchingCandidateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    extracted_event_id: str
    schedule_activity_id: str
    activity_code: str
    activity_name: str
    wbs_level: int
    rank: int
    fuzzy_score: float = Field(..., ge=0.0, le=100.0, description="RapidFuzz ratio score 0-100")
    semantic_score: Optional[float] = Field(None, ge=0.0, le=1.0, description="Cosine similarity score 0-1 if provider enabled")
    combined_score: float = Field(..., ge=0.0, le=100.0)
    score_breakdown: Optional[Dict[str, Any]] = None
    explanation: str
    algorithm_info: str
    is_auto_suggested: bool
    created_at: datetime


class MatchRequest(BaseModel):
    min_score_threshold: Optional[float] = Field(default=40.0, ge=0.0, le=100.0)
    top_k: int = Field(default=5, ge=1, le=20)
    use_semantic: bool = False


class BatchMatchRequest(BaseModel):
    event_ids: Optional[List[str]] = None
    report_id: Optional[str] = None
    min_score_threshold: Optional[float] = Field(default=40.0, ge=0.0, le=100.0)
    top_k: int = Field(default=5, ge=1, le=20)


class MatchResultResponse(BaseModel):
    event_id: str
    event_description: str
    candidates_count: int
    candidates: List[MatchingCandidateResponse]
    best_match_id: Optional[str] = None
    best_score: Optional[float] = None
    requires_review: bool = True
