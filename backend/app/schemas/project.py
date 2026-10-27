from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict


class ProjectBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255, description="Project title")
    code: str = Field(..., min_length=2, max_length=50, description="Unique project code (e.g. ABC-REF)")
    description: Optional[str] = Field(None, max_length=2000)
    client_name: Optional[str] = Field(None, max_length=255)
    contractor_name: Optional[str] = Field(None, max_length=255)
    location: Optional[str] = Field(None, max_length=255)
    project_type: str = Field(default="Infrastructure", max_length=100)
    status: str = Field(default="Active", max_length=50)
    planned_start_date: Optional[datetime] = None
    planned_end_date: Optional[datetime] = None
    actual_start_date: Optional[datetime] = None
    actual_end_date: Optional[datetime] = None
    total_budget: Optional[float] = None
    currency: str = Field(default="USD", max_length=10)


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    description: Optional[str] = None
    client_name: Optional[str] = None
    contractor_name: Optional[str] = None
    location: Optional[str] = None
    project_type: Optional[str] = None
    status: Optional[str] = None
    planned_start_date: Optional[datetime] = None
    planned_end_date: Optional[datetime] = None
    actual_start_date: Optional[datetime] = None
    actual_end_date: Optional[datetime] = None
    total_budget: Optional[float] = None
    currency: Optional[str] = None


class ProjectResponse(ProjectBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    is_archived: bool
    created_at: datetime
    updated_at: datetime
