from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict


class ScheduleVersionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    project_id: str
    version_number: int
    name: str
    description: Optional[str] = None
    is_active: bool
    source_filename: Optional[str] = None
    activity_count: int
    created_at: datetime


class ScheduleActivityBase(BaseModel):
    activity_code: str = Field(..., max_length=100)
    name: str = Field(..., max_length=500)
    description: Optional[str] = None
    level: int = Field(default=1, ge=1, le=6, description="WBS Level from 1 to 6")
    wbs_code: Optional[str] = Field(None, max_length=100)
    parent_id: Optional[str] = None
    discipline: Optional[str] = Field(None, max_length=100)
    area: Optional[str] = Field(None, max_length=100)
    planned_start: Optional[datetime] = None
    planned_finish: Optional[datetime] = None
    actual_start: Optional[datetime] = None
    actual_finish: Optional[datetime] = None
    planned_duration_days: Optional[int] = None
    actual_duration_days: Optional[int] = None
    planned_quantity: Optional[float] = None
    unit_of_measure: Optional[str] = Field(None, max_length=50)
    earned_value_weight: Optional[float] = None
    status: str = Field(default="Not Started", max_length=50)
    critical_path: bool = False
    percent_complete: float = Field(default=0.0, ge=0.0, le=100.0)


class ScheduleActivityCreate(ScheduleActivityBase):
    project_id: str
    version_id: str


class ScheduleActivityUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    level: Optional[int] = Field(None, ge=1, le=6)
    parent_id: Optional[str] = None
    discipline: Optional[str] = None
    area: Optional[str] = None
    planned_start: Optional[datetime] = None
    planned_finish: Optional[datetime] = None
    actual_start: Optional[datetime] = None
    actual_finish: Optional[datetime] = None
    planned_duration_days: Optional[int] = None
    actual_duration_days: Optional[int] = None
    planned_quantity: Optional[float] = None
    unit_of_measure: Optional[str] = None
    status: Optional[str] = None
    critical_path: Optional[bool] = None
    percent_complete: Optional[float] = Field(None, ge=0.0, le=100.0)


class ScheduleActivityResponse(ScheduleActivityBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    project_id: str
    version_id: str
    created_at: datetime
    updated_at: datetime


class ScheduleActivityTreeNode(ScheduleActivityResponse):
    children: List["ScheduleActivityTreeNode"] = []


# Schedule Staged Import Schemas
class ScheduleImportMapping(BaseModel):
    activity_code: str = "activity_code"
    name: str = "activity_name"
    level: Optional[str] = "level"
    parent_code: Optional[str] = "parent_code"
    discipline: Optional[str] = "discipline"
    area: Optional[str] = "area"
    planned_start: Optional[str] = "planned_start"
    planned_finish: Optional[str] = "planned_finish"
    planned_quantity: Optional[str] = "quantity"
    unit_of_measure: Optional[str] = "unit"


class ScheduleImportPreview(BaseModel):
    import_id: str
    filename: str
    file_type: str
    total_rows: int
    headers: List[str]
    sample_rows: List[Dict[str, Any]]
    suggested_mapping: ScheduleImportMapping


class ScheduleImportValidationError(BaseModel):
    row_number: int
    activity_code: Optional[str] = None
    field: str
    error: str


class ScheduleImportValidationResult(BaseModel):
    import_id: str
    is_valid: bool
    total_rows: int
    valid_rows_count: int
    error_count: int
    errors: List[ScheduleImportValidationError]
    warnings: List[str] = []


class ScheduleImportCommitRequest(BaseModel):
    version_name: Optional[str] = None
    description: Optional[str] = None
    column_mapping: Optional[ScheduleImportMapping] = None


class ScheduleImportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    project_id: str
    filename: str
    file_size_bytes: int
    status: str
    total_rows: Optional[int] = None
    valid_rows: Optional[int] = None
    error_count: Optional[int] = None
    error_details: Optional[List[Dict[str, Any]]] = None
    created_at: datetime
    committed_at: Optional[datetime] = None
