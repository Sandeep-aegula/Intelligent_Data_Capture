from datetime import date
from typing import Optional, List
from sqlalchemy import String, Text, Float, Integer, Date, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base, TimestampMixin, generate_uuid


class ProjectDocument(Base, TimestampMixin):
    __tablename__ = "project_documents"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=generate_uuid)
    project_id: Mapped[str] = mapped_column(String(64), ForeignKey("projects.id", ondelete="CASCADE"), index=True)
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    file_type: Mapped[str] = mapped_column(String(32), nullable=False)  # pdf, docx, xlsx, txt
    file_size_bytes: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    storage_path: Mapped[str] = mapped_column(String(512), nullable=False)
    extracted_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    project: Mapped["Project"] = relationship("Project", back_populates="documents")
    reports: Mapped[List["DailyReport"]] = relationship("DailyReport", back_populates="document")


class DailyReport(Base, TimestampMixin):
    __tablename__ = "daily_reports"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=generate_uuid)
    project_id: Mapped[str] = mapped_column(String(64), ForeignKey("projects.id", ondelete="CASCADE"), index=True)
    report_number: Mapped[int] = mapped_column(Integer, nullable=False)
    report_date: Mapped[date] = mapped_column(Date, nullable=False)
    source_type: Mapped[str] = mapped_column(String(64), default="Direct Text", nullable=False)  # Direct Text, PDF, Excel, Word
    uploaded_by: Mapped[str] = mapped_column(String(128), default="John Mitchell", nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="Processed", nullable=False)  # Processed, Verified, Pending Review
    original_text: Mapped[str] = mapped_column(Text, nullable=False)
    document_id: Mapped[Optional[str]] = mapped_column(String(64), ForeignKey("project_documents.id", ondelete="SET NULL"), nullable=True)

    project: Mapped["Project"] = relationship("Project", back_populates="reports")
    document: Mapped[Optional["ProjectDocument"]] = relationship("ProjectDocument", back_populates="reports")
    events: Mapped[List["ExtractedEvent"]] = relationship("ExtractedEvent", back_populates="report", cascade="all, delete-orphan")


class ExtractedEvent(Base, TimestampMixin):
    __tablename__ = "extracted_events"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=generate_uuid)
    report_id: Mapped[str] = mapped_column(String(64), ForeignKey("daily_reports.id", ondelete="CASCADE"), index=True)
    project_id: Mapped[str] = mapped_column(String(64), ForeignKey("projects.id", ondelete="CASCADE"), index=True)
    event_type: Mapped[str] = mapped_column(String(32), default="IN_PROGRESS", nullable=False)
    activity_name: Mapped[str] = mapped_column(String(255), nullable=False)
    discipline: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    location: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    quantity: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    unit: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    progress: Mapped[str] = mapped_column(String(64), default="Not specified", nullable=False)
    evidence: Mapped[str] = mapped_column(Text, nullable=False)
    event_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

    report: Mapped["DailyReport"] = relationship("DailyReport", back_populates="events")
    candidates: Mapped[List["MatchingCandidate"]] = relationship("MatchingCandidate", back_populates="event", cascade="all, delete-orphan")
    reviews: Mapped[List["PlannerReview"]] = relationship("PlannerReview", back_populates="event", cascade="all, delete-orphan")
