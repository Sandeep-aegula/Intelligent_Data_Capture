from datetime import date
from typing import Optional, List
from sqlalchemy import String, Text, Float, Integer, Date, Boolean, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base, TimestampMixin, generate_uuid


class ScheduleVersion(Base, TimestampMixin):
    __tablename__ = "schedule_versions"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=generate_uuid)
    project_id: Mapped[str] = mapped_column(String(64), ForeignKey("projects.id", ondelete="CASCADE"), index=True)
    version_number: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    source_file: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    total_activities: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    project: Mapped["Project"] = relationship("Project", back_populates="schedule_versions")
    activities: Mapped[List["ScheduleActivity"]] = relationship("ScheduleActivity", back_populates="schedule_version", cascade="all, delete-orphan")


class ScheduleActivity(Base, TimestampMixin):
    __tablename__ = "schedule_activities"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=generate_uuid)
    project_id: Mapped[str] = mapped_column(String(64), ForeignKey("projects.id", ondelete="CASCADE"), index=True)
    schedule_version_id: Mapped[Optional[str]] = mapped_column(String(64), ForeignKey("schedule_versions.id", ondelete="SET NULL"), nullable=True, index=True)
    activity_code: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    level: Mapped[str] = mapped_column(String(8), default="L6", nullable=False)  # L1, L2, L3, L4, L5, L6
    parent_id: Mapped[Optional[str]] = mapped_column(String(64), ForeignKey("schedule_activities.id", ondelete="SET NULL"), nullable=True, index=True)
    discipline: Mapped[Optional[str]] = mapped_column(String(64), nullable=True, index=True)
    location: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="Not Started", nullable=False)
    progress: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    planned_start: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    planned_finish: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    actual_start: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    actual_finish: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    duration_days: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    quantity: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    unit: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    hierarchy_path: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    critical_path: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    project: Mapped["Project"] = relationship("Project", back_populates="activities")
    schedule_version: Mapped[Optional["ScheduleVersion"]] = relationship("ScheduleVersion", back_populates="activities")
    parent: Mapped[Optional["ScheduleActivity"]] = relationship("ScheduleActivity", remote_side=[id], back_populates="children")
    children: Mapped[List["ScheduleActivity"]] = relationship("ScheduleActivity", back_populates="parent", cascade="all, delete-orphan")
    verified_records: Mapped[List["VerifiedProgress"]] = relationship("VerifiedProgress", back_populates="activity", cascade="all, delete-orphan")


class ScheduleImport(Base, TimestampMixin):
    __tablename__ = "schedule_imports"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=generate_uuid)
    project_id: Mapped[str] = mapped_column(String(64), ForeignKey("projects.id", ondelete="CASCADE"), index=True)
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(String(512), nullable=False)
    file_type: Mapped[str] = mapped_column(String(16), nullable=False)  # csv, xlsx, xer
    status: Mapped[str] = mapped_column(String(32), default="PENDING", nullable=False)  # PENDING, VALIDATED, COMMITTED, FAILED
    total_rows: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    mapped_columns: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    preview_data: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    validation_errors: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    validation_warnings: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
