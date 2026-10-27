from datetime import datetime
from typing import Optional, List
from sqlalchemy import String, Text, Float, Integer, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base, TimestampMixin, generate_uuid


class MatchingCandidate(Base, TimestampMixin):
    __tablename__ = "matching_candidates"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=generate_uuid)
    event_id: Mapped[str] = mapped_column(String(64), ForeignKey("extracted_events.id", ondelete="CASCADE"), index=True)
    activity_id: Mapped[str] = mapped_column(String(64), ForeignKey("schedule_activities.id", ondelete="CASCADE"), index=True)
    fuzzy_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    semantic_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    combined_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    rationale: Mapped[str] = mapped_column(Text, nullable=False)
    algorithm: Mapped[str] = mapped_column(String(64), default="rapidfuzz_token_set", nullable=False)
    rank: Mapped[int] = mapped_column(Integer, default=1, nullable=False)

    event: Mapped["ExtractedEvent"] = relationship("ExtractedEvent", back_populates="candidates")
    activity: Mapped["ScheduleActivity"] = relationship("ScheduleActivity")


class PlannerReview(Base, TimestampMixin):
    __tablename__ = "planner_reviews"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=generate_uuid)
    project_id: Mapped[str] = mapped_column(String(64), ForeignKey("projects.id", ondelete="CASCADE"), index=True)
    event_id: Mapped[str] = mapped_column(String(64), ForeignKey("extracted_events.id", ondelete="CASCADE"), index=True)
    suggested_activity_id: Mapped[Optional[str]] = mapped_column(String(64), ForeignKey("schedule_activities.id", ondelete="SET NULL"), nullable=True)
    final_activity_id: Mapped[Optional[str]] = mapped_column(String(64), ForeignKey("schedule_activities.id", ondelete="SET NULL"), nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="Needs Review", nullable=False)  # Needs Review, Approved, Rejected, Insufficient Context, Reassigned
    confidence: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    reviewer: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    reviewed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    comments: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    verified_quantity: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    reject_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    context_note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_overridden: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    project: Mapped["Project"] = relationship("Project", back_populates="reviews")
    event: Mapped["ExtractedEvent"] = relationship("ExtractedEvent", back_populates="reviews")
    suggested_activity: Mapped[Optional["ScheduleActivity"]] = relationship("ScheduleActivity", foreign_keys=[suggested_activity_id])
    final_activity: Mapped[Optional["ScheduleActivity"]] = relationship("ScheduleActivity", foreign_keys=[final_activity_id])
