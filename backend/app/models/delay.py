from datetime import date
from typing import Optional
from sqlalchemy import String, Text, Integer, Date, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base, TimestampMixin, generate_uuid


class DelayEvent(Base, TimestampMixin):
    __tablename__ = "delay_events"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=generate_uuid)
    project_id: Mapped[str] = mapped_column(String(64), ForeignKey("projects.id", ondelete="CASCADE"), index=True)
    activity_id: Mapped[str] = mapped_column(String(64), ForeignKey("schedule_activities.id", ondelete="CASCADE"), index=True)
    activity_name: Mapped[str] = mapped_column(String(255), nullable=False)
    discipline: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    location: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    critical_path: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    variance_days: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    root_cause: Mapped[str] = mapped_column(String(128), nullable=False)
    impact: Mapped[str] = mapped_column(String(32), default="Medium", nullable=False)
    mitigation_status: Mapped[str] = mapped_column(String(32), default="Under Review", nullable=False)
    mitigation_plan: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    baseline_start: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    baseline_finish: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    forecast_finish: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    logged_date: Mapped[date] = mapped_column(Date, default=date.today, nullable=False)
    owner: Mapped[str] = mapped_column(String(128), default="John Mitchell", nullable=False)

    project: Mapped["Project"] = relationship("Project", back_populates="delays")
    activity: Mapped["ScheduleActivity"] = relationship("ScheduleActivity")
