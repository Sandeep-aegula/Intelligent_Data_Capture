from datetime import date
from typing import Optional, List
from sqlalchemy import String, Text, Float, Integer, Date, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base, TimestampMixin, generate_uuid


class Project(Base, TimestampMixin):
    __tablename__ = "projects"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=generate_uuid)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    code: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    location: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="In Progress", nullable=False)
    overall_progress: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    planned_start: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    planned_finish: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    actual_start: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    owner: Mapped[Optional[str]] = mapped_column(String(128), default="John Mitchell", nullable=True)
    is_archived: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Relationships
    schedule_versions: Mapped[List["ScheduleVersion"]] = relationship("ScheduleVersion", back_populates="project", cascade="all, delete-orphan")
    activities: Mapped[List["ScheduleActivity"]] = relationship("ScheduleActivity", back_populates="project", cascade="all, delete-orphan")
    reports: Mapped[List["DailyReport"]] = relationship("DailyReport", back_populates="project", cascade="all, delete-orphan")
    documents: Mapped[List["ProjectDocument"]] = relationship("ProjectDocument", back_populates="project", cascade="all, delete-orphan")
    reviews: Mapped[List["PlannerReview"]] = relationship("PlannerReview", back_populates="project", cascade="all, delete-orphan")
    delays: Mapped[List["DelayEvent"]] = relationship("DelayEvent", back_populates="project", cascade="all, delete-orphan")
    terminology: Mapped[List["ProjectTerminology"]] = relationship("ProjectTerminology", back_populates="project", cascade="all, delete-orphan")
    knowledge_docs: Mapped[List["KnowledgeDocument"]] = relationship("KnowledgeDocument", back_populates="project", cascade="all, delete-orphan")
    audit_logs: Mapped[List["AuditLog"]] = relationship("AuditLog", back_populates="project", cascade="all, delete-orphan")
    settings: Mapped[Optional["ProjectSetting"]] = relationship("ProjectSetting", back_populates="project", uselist=False, cascade="all, delete-orphan")
