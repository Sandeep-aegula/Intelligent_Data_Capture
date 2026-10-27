from datetime import datetime, timezone, date
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.review import PlannerReview, MatchingCandidate
from app.models.document_and_report import ExtractedEvent
from app.models.schedule import ScheduleActivity
from app.models.progress import VerifiedProgress
from app.services.audit_service import AuditService
from app.services.schedule_service import ScheduleService
from app.core.exceptions import ResourceNotFoundException, ValidationException
from app.core.logging_config import logger


class ReviewService:
    @staticmethod
    def list_reviews(
        db: Session,
        project_id: str,
        status: Optional[str] = None,
    ) -> List[PlannerReview]:
        query = db.query(PlannerReview).filter(PlannerReview.project_id == project_id)
        if status:
            query = query.filter(PlannerReview.status == status)
        return query.order_by(PlannerReview.created_at.desc()).all()

    @staticmethod
    def get_review_by_id(db: Session, project_id: str, review_id: str) -> PlannerReview:
        review = (
            db.query(PlannerReview)
            .filter(PlannerReview.id == review_id, PlannerReview.project_id == project_id)
            .first()
        )
        if not review:
            raise ResourceNotFoundException(f"Planner review '{review_id}' not found in project '{project_id}'.")
        return review

    @staticmethod
    def create_review_for_event(
        db: Session,
        project_id: str,
        event_id: str,
        suggested_activity_id: Optional[str] = None,
        confidence: float = 0.0,
    ) -> PlannerReview:
        # Check if review already exists
        existing = (
            db.query(PlannerReview)
            .filter(PlannerReview.project_id == project_id, PlannerReview.event_id == event_id)
            .first()
        )
        if existing:
            return existing

        review = PlannerReview(
            project_id=project_id,
            event_id=event_id,
            suggested_activity_id=suggested_activity_id,
            final_activity_id=suggested_activity_id,
            status="Needs Review",
            confidence=confidence,
        )
        db.add(review)
        db.commit()
        db.refresh(review)
        return review

    @staticmethod
    def approve_review(
        db: Session,
        project_id: str,
        review_id: str,
        reviewer: str = "Project Planner",
        comments: Optional[str] = None,
        confirmed_quantity: Optional[float] = None,
        confirmed_percent: Optional[float] = None,
    ) -> PlannerReview:
        """
        Approve link between extracted event and suggested schedule activity.
        Persists decision, updates activity if appropriate, and logs audit record.
        Strict rule: Does NOT invent progress percent.
        """
        review = ReviewService.get_review_by_id(db, project_id, review_id)
        if not review.suggested_activity_id:
            raise ValidationException("Cannot approve review without a linked schedule activity.")

        target_activity_id = review.final_activity_id or review.suggested_activity_id
        activity = ScheduleService.get_activity_by_id(db, project_id, target_activity_id)
        event = db.query(ExtractedEvent).filter(ExtractedEvent.id == review.event_id).first()

        review.status = "Approved"
        review.reviewer = reviewer
        review.reviewed_at = datetime.now(timezone.utc)
        review.comments = comments
        review.final_activity_id = activity.id

        qty_to_credit = confirmed_quantity if confirmed_quantity is not None else (event.quantity if event else None)
        review.verified_quantity = qty_to_credit

        # Calculate or assign progress percentage safely without inventing
        physical_pct = confirmed_percent
        if physical_pct is None and qty_to_credit is not None and activity.quantity and activity.quantity > 0:
            # Derived mathematically from verified quantity / planned scope
            prior_verified = (
                db.query(VerifiedProgress.quantity_installed)
                .filter(VerifiedProgress.activity_id == activity.id)
                .all()
            )
            prior_total = sum(p[0] for p in prior_verified if p[0] is not None)
            total_after = prior_total + qty_to_credit
            physical_pct = min(100.0, round((total_after / activity.quantity) * 100.0, 1))

        # Create VerifiedProgress record
        verified_rec = VerifiedProgress(
            project_id=project_id,
            activity_id=activity.id,
            report_id=event.report_id if event else None,
            verified_date=event.event_date if (event and event.event_date) else date.today(),
            quantity_installed=qty_to_credit,
            physical_percent=physical_pct,
            verified_by=reviewer,
            notes=f"Approved in review {review_id}. {comments or ''}".strip(),
        )
        db.add(verified_rec)

        # Update activity status
        if activity.status == "Not Started":
            activity.status = "In Progress"
        if physical_pct is not None:
            activity.progress = physical_pct

        AuditService.log_action(
            db=db,
            project_id=project_id,
            action="Approved",
            category="Review",
            entity_type="PlannerReview",
            entity_id=review.id,
            user=reviewer,
            details=f"Approved match to activity {activity.activity_code} ({activity.name})",
            confidence=review.confidence,
            new_value=activity.activity_code,
        )

        db.commit()
        db.refresh(review)
        return review

    @staticmethod
    def reject_review(
        db: Session,
        project_id: str,
        review_id: str,
        reason: str,
        reviewer: str = "Project Planner",
    ) -> PlannerReview:
        review = ReviewService.get_review_by_id(db, project_id, review_id)
        review.status = "Rejected"
        review.reject_reason = reason
        review.reviewer = reviewer
        review.reviewed_at = datetime.now(timezone.utc)

        AuditService.log_action(
            db=db,
            project_id=project_id,
            action="Rejected",
            category="Review",
            entity_type="PlannerReview",
            entity_id=review.id,
            user=reviewer,
            details=f"Rejected suggested link. Reason: {reason}",
            previous_value=review.suggested_activity_id,
            new_value="Rejected",
        )

        db.commit()
        db.refresh(review)
        return review

    @staticmethod
    def reassign_review(
        db: Session,
        project_id: str,
        review_id: str,
        new_activity_id: str,
        reviewer: str = "Project Planner",
        reason: Optional[str] = None,
    ) -> PlannerReview:
        """
        Reassign the extracted event to a different schedule activity.
        Validates target activity belongs to the current project.
        """
        review = ReviewService.get_review_by_id(db, project_id, review_id)
        # Validation: target activity must exist in this project!
        new_activity = ScheduleService.get_activity_by_id(db, project_id, new_activity_id)

        old_activity_id = review.final_activity_id or review.suggested_activity_id
        review.final_activity_id = new_activity.id
        review.status = "Reassigned"
        review.is_overridden = True
        review.reviewer = reviewer
        review.reviewed_at = datetime.now(timezone.utc)
        review.comments = f"Reassigned: {reason}" if reason else "Reassigned by planner"

        AuditService.log_action(
            db=db,
            project_id=project_id,
            action="Reassigned",
            category="Review",
            entity_type="PlannerReview",
            entity_id=review.id,
            user=reviewer,
            details=f"Reassigned event to activity {new_activity.activity_code} ({new_activity.name})",
            previous_value=str(old_activity_id),
            new_value=new_activity.activity_code,
        )

        db.commit()
        db.refresh(review)
        return review

    @staticmethod
    def request_context(
        db: Session,
        project_id: str,
        review_id: str,
        note: str,
        reviewer: str = "Project Planner",
    ) -> PlannerReview:
        review = ReviewService.get_review_by_id(db, project_id, review_id)
        review.status = "Insufficient Context"
        review.context_note = note
        review.reviewer = reviewer
        review.reviewed_at = datetime.now(timezone.utc)

        AuditService.log_action(
            db=db,
            project_id=project_id,
            action="Requested Context",
            category="Review",
            entity_type="PlannerReview",
            entity_id=review.id,
            user=reviewer,
            details=f"Requested additional site context: {note}",
            new_value="Insufficient Context",
        )

        db.commit()
        db.refresh(review)
        return review
