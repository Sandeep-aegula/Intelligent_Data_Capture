from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict


class ProjectSettingCreate(BaseModel):
    setting_key: str = Field(..., max_length=100)
    setting_value: Dict[str, Any]
    description: Optional[str] = None


class ProjectSettingUpdate(BaseModel):
    setting_value: Dict[str, Any]
    description: Optional[str] = None


class ProjectSettingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    project_id: str
    setting_key: str
    setting_value: Dict[str, Any]
    description: Optional[str] = None
    created_at: datetime
    updated_at: datetime
