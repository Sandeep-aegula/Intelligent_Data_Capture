from datetime import datetime, date
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict


class ProjectDocumentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    project_id: str
    filename: str
    original_filename: str
    file_type: str
    mime_type: Optional[str] = None
    file_size_bytes: int
    storage_path: str
    document_type: str
    title: Optional[str] = None
    description: Optional[str] = None
    extracted_text_preview: Optional[str] = None
    created_at: datetime


class DailyReportBase(BaseModel):
    report_number: Optional[str] = Field(None, max_length=100)
    report_date: date = Field(..., description="Date of the field work")
    author_name: Optional[str] = Field(None, max_length=255)
    contractor_name: Optional[str] = Field(None, max_length=255)
    site_location: Optional[str] = Field(None, max_length=255)
    weather_summary: Optional[str] = Field(None, max_length=255)
    shift: str = Field(default="Day", max_length=50)
    raw_text: str = Field(..., min_length=5, description="Full report text or extracted content")


class DailyReportCreate(DailyReportBase):
    pass


class DailyReportUpdate(BaseModel):
    report_number: Optional[str] = None
    report_date: Optional[date] = None
    author_name: Optional[str] = None
    contractor_name: Optional[str] = None
    site_location: Optional[str] = None
    weather_summary: Optional[str] = None
    shift: Optional[str] = None
    raw_text: Optional[str] = None
    processing_status: Optional[str] = None


class DailyReportResponse(DailyReportBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    project_id: str
    document_id: Optional[str] = None
    processing_status: str
    extracted_event_count: int = 0
    created_at: datetime
    updated_at: datetime


class ExtractedEventBase(BaseModel):
    activity_description: str = Field(..., description="Action description as reported on site")
    raw_evidence_text: str = Field(..., description="Exact snippet of report text citing this activity")
    event_date: Optional[date] = None
    date_resolution_basis: Optional[str] = None
    quantity: Optional[float] = None
    unit_of_measure: Optional[str] = None
    percent_complete: Optional[float] = Field(None, ge=0.0, le=100.0, description="Leave None if not explicitly stated in report")
    discipline: Optional[str] = None
    area: Optional[str] = None
    subcontractor: Optional[str] = None
    manpower_count: Optional[int] = None
    equipment_used: Optional[str] = None
    status: str = Field(default="In Progress", max_length=50)
    is_delay_indicated: bool = False
    delay_notes: Optional[str] = None
    confidence_score: Optional[float] = Field(None, ge=0.0, le=1.0)
    extraction_method: str = Field(default="deterministic", max_length=50)


class ExtractedEventCreate(ExtractedEventBase):
    pass


class ExtractedEventUpdate(BaseModel):
    activity_description: Optional[str] = None
    raw_evidence_text: Optional[str] = None
    event_date: Optional[date] = None
    date_resolution_basis: Optional[str] = None
    quantity: Optional[float] = None
    unit_of_measure: Optional[str] = None
    percent_complete: Optional[float] = Field(None, ge=0.0, le=100.0)
    discipline: Optional[str] = None
    area: Optional[str] = None
    subcontractor: Optional[str] = None
    manpower_count: Optional[int] = None
    equipment_used: Optional[str] = None
    status: Optional[str] = None
    is_delay_indicated: Optional[bool] = None
    delay_notes: Optional[str] = None
    is_validated: Optional[bool] = None


class ExtractedEventResponse(ExtractedEventBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    project_id: str
    daily_report_id: str
    is_validated: bool
    created_at: datetime
    updated_at: datetime
