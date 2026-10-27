from sqlalchemy import String, Float, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base, TimestampMixin, generate_uuid


class ProjectSetting(Base, TimestampMixin):
    __tablename__ = "project_settings"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=generate_uuid)
    project_id: Mapped[str] = mapped_column(String(64), ForeignKey("projects.id", ondelete="CASCADE"), unique=True, index=True)
    high_confidence_threshold: Mapped[float] = mapped_column(Float, default=85.0, nullable=False)
    low_confidence_threshold: Mapped[float] = mapped_column(Float, default=60.0, nullable=False)
    email_alerts: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    daily_digest: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    project: Mapped["Project"] = relationship("Project", back_populates="settings")
