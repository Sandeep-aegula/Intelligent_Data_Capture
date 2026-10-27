from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict


class ProjectTerminologyBase(BaseModel):
    standard_term: str = Field(..., max_length=255, description="Official project / industry terminology")
    aliases: List[str] = Field(default=[], description="List of slang, site nicknames, abbreviations, or codes")
    category: Optional[str] = Field(None, max_length=100)
    discipline: Optional[str] = Field(None, max_length=100)
    definition: Optional[str] = None
    linked_activity_code: Optional[str] = Field(None, max_length=100)
    linked_schedule_activity_id: Optional[str] = None
    is_verified: bool = True


class ProjectTerminologyCreate(ProjectTerminologyBase):
    pass


class ProjectTerminologyUpdate(BaseModel):
    standard_term: Optional[str] = None
    aliases: Optional[List[str]] = None
    category: Optional[str] = None
    discipline: Optional[str] = None
    definition: Optional[str] = None
    linked_activity_code: Optional[str] = None
    linked_schedule_activity_id: Optional[str] = None
    is_verified: Optional[bool] = None


class ProjectTerminologyResponse(ProjectTerminologyBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    project_id: str
    created_at: datetime
    updated_at: datetime


class KnowledgeDocumentCreate(BaseModel):
    title: str = Field(..., max_length=255)
    doc_type: str = Field(default="Technical Specification", max_length=100)
    source_filename: Optional[str] = None
    content: str = Field(..., min_length=10)
    metadata_json: Optional[Dict[str, Any]] = None


class KnowledgeDocumentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    project_id: str
    title: str
    doc_type: str
    source_filename: Optional[str] = None
    chunk_count: int
    is_indexed: bool
    metadata_json: Optional[Dict[str, Any]] = None
    created_at: datetime


class KnowledgeChunkResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    document_id: str
    chunk_index: int
    chunk_text: str
    metadata_json: Optional[Dict[str, Any]] = None


class KnowledgeSearchRequest(BaseModel):
    query: str = Field(..., min_length=2)
    top_k: int = Field(default=5, ge=1, le=20)
    doc_type: Optional[str] = None


class KnowledgeSearchResultItem(BaseModel):
    chunk_id: str
    document_id: str
    document_title: str
    chunk_index: int
    text_snippet: str
    relevance_score: float
    source_reference: str


class KnowledgeSearchResponse(BaseModel):
    query: str
    results_count: int
    search_type: str  # 'pgvector' or 'text_bm25_fallback'
    results: List[KnowledgeSearchResultItem]
