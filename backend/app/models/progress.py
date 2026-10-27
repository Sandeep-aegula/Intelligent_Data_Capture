from datetime import date
from typing import Optional
from sqlalchemy import String, Text, Float, Date, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base, TimestampMixin, generate_uuid


class VerifiedProgress(Base, TimestampMixin):
    __tablename__ = "verified_progress"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=generate_uuid)
    project_id: Mapped[str] = mapped_column(String(64), ForeignKey("projects.id", ondelete="CASCADE"), index=True)
    activity_id: Mapped[str] = mapped_column(String(64), ForeignKey("schedule_activities.id", ondelete="CASCADE"), index=True)
    report_id: Mapped[Optional[str]] = mapped_column(String(64), ForeignKey("daily_reports.id", ondelete="SET NULL"), nullable=True)
    verified_date: Mapped[date] = mapped_column(Date, nullable=False)
    quantity_installed: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    physical_percent: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    verified_by: Mapped[str] = mapped_column(String(128), default="John Mitchell", nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    activity: Mapped["ScheduleActivity"] = relationship("ScheduleActivity", back_populates="verified_records")
