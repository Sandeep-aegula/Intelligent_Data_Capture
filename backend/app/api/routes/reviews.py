from typing import Optional, List
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.api.deps import get_current_project
from app.models.project import Project
from app.services.review_service import ReviewService
from app.schemas.review import (
    ReviewApproveRequest,
    ReviewRejectRequest,
    ReviewReassignRequest,
    ReviewContextRequest,
)

router = APIRouter(prefix="/projects/{project_id}/reviews", tags=["Planner Review"])


@router.get("", status_code=status.HTTP_200_OK)
def list_planner_reviews(
    status_filter: Optional[str] = Query(None, alias="status"),
    project: Project = Depends(get_current_project),
    db: Session = Depends(get_db),
):
    """List all review items in the planner queue for this project."""
    reviews = ReviewService.list_reviews(db, project.id, status=status_filter)
    result = []
    for r in reviews:
        event = r.event
        sugg_act = r.suggested_activity
        final_act = r.final_activity

        candidates_data = []
        if event and event.candidates:
            for c in event.candidates:
                candidates_data.append({
                    "id": c.id,
                    "activity_id": c.activity_id,
                    "activity_code": c.activity.activity_code if c.activity else None,
                    "activity_name": c.activity.name if c.activity else None,
                    "wbs_level": c.activity.level if c.activity else None,
                    "fuzzy_score": c.fuzzy_score,
                    "combined_score": c.combined_score,
                    "rationale": c.rationale,
                    "rank": c.rank,
                })

        result.append({
            "id": r.id,
            "project_id": r.project_id,
            "event_id": r.event_id,
            "suggested_activity_id": r.suggested_activity_id,
            "final_activity_id": r.final_activity_id,
            "status": r.status,
            "confidence": r.confidence,
            "reviewer": r.reviewer,
            "reviewed_at": r.reviewed_at.isoformat() if r.reviewed_at else None,
            "comments": r.comments,
            "verified_quantity": r.verified_quantity,
            "reject_reason": r.reject_reason,
            "context_note": r.context_note,
            "is_overridden": r.is_overridden,
            # Flattened event fields for frontend convenience
            "event_description": event.activity_name if event else None,
            "evidence_text": event.evidence if event else None,
            "event_date": event.event_date.isoformat() if event and event.event_date else None,
            "quantity": event.quantity if event else None,
            "unit": event.unit if event else None,
            "discipline": event.discipline if event else None,
            "location": event.location if event else None,
            "suggested_activity_code": sugg_act.activity_code if sugg_act else None,
            "suggested_activity_name": sugg_act.name if sugg_act else None,
            "final_activity_code": final_act.activity_code if final_act else None,
            "candidates": candidates_data,
        })
    return result


@router.get("/{review_id}", status_code=status.HTTP_200_OK)
def get_planner_review(
    review_id: str,
    project: Project = Depends(get_current_project),
    db: Session = Depends(get_db),
):
    """Get single review item details."""
    r = ReviewService.get_review_by_id(db, project.id, review_id)
    event = r.event
    return {
        "id": r.id,
        "project_id": r.project_id,
        "event_id": r.event_id,
        "suggested_activity_id": r.suggested_activity_id,
        "final_activity_id": r.final_activity_id,
        "status": r.status,
        "confidence": r.confidence,
        "reviewer": r.reviewer,
        "comments": r.comments,
        "event_description": event.activity_name if event else None,
        "evidence_text": event.evidence if event else None,
    }


@router.post("/{review_id}/approve", status_code=status.HTTP_200_OK)
def approve_review(
    review_id: str,
    request: ReviewApproveRequest,
    project: Project = Depends(get_current_project),
    db: Session = Depends(get_db),
):
    """Approve a suggested schedule link."""
    review = ReviewService.approve_review(
        db=db,
        project_id=project.id,
        review_id=review_id,
        reviewer=request.planner_name or "Project Planner",
        comments=request.notes,
        confirmed_quantity=request.confirmed_quantity,
        confirmed_percent=request.confirmed_percent_complete,
    )
    return {
        "id": review.id,
        "status": review.status,
        "final_activity_id": review.final_activity_id,
        "message": "Review approved successfully",
    }


@router.post("/{review_id}/reject", status_code=status.HTTP_200_OK)
def reject_review(
    review_id: str,
    request: ReviewRejectRequest,
    project: Project = Depends(get_current_project),
    db: Session = Depends(get_db),
):
    """Reject a suggested schedule link with reason."""
    review = ReviewService.reject_review(
        db=db,
        project_id=project.id,
        review_id=review_id,
        reason=request.reason,
        reviewer=request.planner_name or "Project Planner",
    )
    return {
        "id": review.id,
        "status": review.status,
        "message": "Review rejected successfully",
    }


@router.post("/{review_id}/reassign", status_code=status.HTTP_200_OK)
def reassign_review(
    review_id: str,
    request: ReviewReassignRequest,
    project: Project = Depends(get_current_project),
    db: Session = Depends(get_db),
):
    """Reassign event to a different schedule activity in the same project."""
    review = ReviewService.reassign_review(
        db=db,
        project_id=project.id,
        review_id=review_id,
        new_activity_id=request.new_activity_id,
        reviewer=request.planner_name or "Project Planner",
        reason=request.reason,
    )
    return {
        "id": review.id,
        "status": review.status,
        "final_activity_id": review.final_activity_id,
        "message": "Review reassigned successfully",
    }


@router.post("/{review_id}/request-context", status_code=status.HTTP_200_OK)
def request_context_review(
    review_id: str,
    request: ReviewContextRequest,
    project: Project = Depends(get_current_project),
    db: Session = Depends(get_db),
):
    """Flag review item as requiring more context from site team."""
    review = ReviewService.request_context(
        db=db,
        project_id=project.id,
        review_id=review_id,
        note=request.question,
        reviewer=request.planner_name or "Project Planner",
    )
    return {
        "id": review.id,
        "status": review.status,
        "message": "Additional context requested",
    }
