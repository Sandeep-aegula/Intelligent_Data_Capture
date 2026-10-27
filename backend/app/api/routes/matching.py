from typing import List, Optional
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.api.deps import get_current_project
from app.models.project import Project
from app.services.matching_service import MatchingService
from app.schemas.matching import MatchRequest, BatchMatchRequest

router = APIRouter(prefix="/projects/{project_id}", tags=["Activity Matching"])


@router.post("/events/{event_id}/match", status_code=status.HTTP_200_OK)
def match_single_event(
    event_id: str,
    request: Optional[MatchRequest] = None,
    project: Project = Depends(get_current_project),
    db: Session = Depends(get_db),
):
    """
    Run RapidFuzz token matching against schedule activities in current project.
    Returns ranked candidates with explanations and fuzzy scores.
    """
    min_score = request.min_score_threshold if request else 30.0
    top_k = request.top_k if request else 5

    candidates = MatchingService.match_event_to_activities(
        db, project.id, event_id, min_score=min_score, top_k=top_k
    )
    return [
        {
            "id": c.id,
            "event_id": c.event_id,
            "activity_id": c.activity_id,
            "activity_code": c.activity.activity_code if c.activity else None,
            "activity_name": c.activity.name if c.activity else None,
            "wbs_level": c.activity.level if c.activity else None,
            "rank": c.rank,
            "fuzzy_score": c.fuzzy_score,
            "combined_score": c.combined_score,
            "rationale": c.rationale,
            "algorithm": c.algorithm,
        }
        for c in candidates
    ]


@router.get("/events/{event_id}/matches", status_code=status.HTTP_200_OK)
def list_event_matches(
    event_id: str,
    project: Project = Depends(get_current_project),
    db: Session = Depends(get_db),
):
    """Get persisted matching candidates for an extracted event."""
    candidates = MatchingService.list_candidates_for_event(db, event_id)
    return [
        {
            "id": c.id,
            "event_id": c.event_id,
            "activity_id": c.activity_id,
            "activity_code": c.activity.activity_code if c.activity else None,
            "activity_name": c.activity.name if c.activity else None,
            "wbs_level": c.activity.level if c.activity else None,
            "rank": c.rank,
            "fuzzy_score": c.fuzzy_score,
            "combined_score": c.combined_score,
            "rationale": c.rationale,
            "algorithm": c.algorithm,
        }
        for c in candidates
    ]


@router.post("/matching/batch", status_code=status.HTTP_200_OK)
def batch_match(
    request: BatchMatchRequest,
    project: Project = Depends(get_current_project),
    db: Session = Depends(get_db),
):
    """Batch compute schedule matches for all events in a report."""
    if not request.report_id:
        return {"matched_count": 0, "message": "report_id is required for batch matching"}

    total = MatchingService.batch_match_report_events(db, project.id, request.report_id)
    return {
        "report_id": request.report_id,
        "total_candidates_generated": total,
        "message": f"Successfully generated {total} candidate match links.",
    }
