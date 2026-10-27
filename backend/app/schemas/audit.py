from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict


class AuditLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    project_id: str
    entity_type: str
    entity_id: str
    action: str
    performed_by: Optional[str] = None
    old_values: Optional[Dict[str, Any]] = None
    new_values: Optional[Dict[str, Any]] = None
    change_summary: Optional[str] = None
    client_ip: Optional[str] = None
    timestamp: datetime


class AuditLogListResponse(BaseModel):
    total_count: int
    items: List[AuditLogResponse]
