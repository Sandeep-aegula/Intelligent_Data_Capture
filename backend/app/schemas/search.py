from typing import Optional, List, Dict, Any
from pydantic import BaseModel


class SearchResultItem(BaseModel):
    category: str  # 'schedule', 'report', 'delay', 'terminology', 'knowledge'
    item_id: str
    title: str
    snippet: str
    match_score: float = 1.0
    navigation_url: Optional[str] = None
    extra_metadata: Optional[Dict[str, Any]] = None


class UnifiedSearchResponse(BaseModel):
    query: str
    project_id: str
    total_results: int
    results: List[SearchResultItem]
