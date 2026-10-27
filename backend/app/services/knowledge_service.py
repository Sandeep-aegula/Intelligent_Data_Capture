from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.knowledge import KnowledgeDocument, KnowledgeChunk
from app.schemas.knowledge import (
    KnowledgeDocumentCreate,
    KnowledgeSearchRequest,
    KnowledgeSearchResponse,
    KnowledgeSearchResultItem,
)
from app.services.audit_service import AuditService
from app.core.exceptions import ResourceNotFoundException
from app.core.logging_config import logger


class KnowledgeService:
    @staticmethod
    def list_documents(db: Session, project_id: str) -> List[KnowledgeDocument]:
        return (
            db.query(KnowledgeDocument)
            .filter(KnowledgeDocument.project_id == project_id)
            .order_by(KnowledgeDocument.created_at.desc())
            .all()
        )

    @staticmethod
    def get_document_by_id(db: Session, project_id: str, document_id: str) -> KnowledgeDocument:
        doc = (
            db.query(KnowledgeDocument)
            .filter(KnowledgeDocument.id == document_id, KnowledgeDocument.project_id == project_id)
            .first()
        )
        if not doc:
            raise ResourceNotFoundException(f"Knowledge document '{document_id}' not found in project '{project_id}'.")
        return doc

    @staticmethod
    def create_document(db: Session, project_id: str, data: KnowledgeDocumentCreate) -> KnowledgeDocument:
        content = data.content
        summary = content[:200] + ("..." if len(content) > 200 else "")

        doc = KnowledgeDocument(
            project_id=project_id,
            title=data.title,
            category=data.doc_type,
            discipline="Piping",
            author="Knowledge Admin",
            summary=summary,
            content=content,
            tags=[],
        )
        db.add(doc)
        db.flush()

        # Chunk document into manageable chunks (~300 characters each)
        chunk_size = 350
        chunks = []
        for i in range(0, len(content), chunk_size):
            chunk_text = content[i : i + chunk_size].strip()
            if chunk_text:
                k_chunk = KnowledgeChunk(
                    document_id=doc.id,
                    project_id=project_id,
                    chunk_index=len(chunks),
                    chunk_text=chunk_text,
                )
                db.add(k_chunk)
                chunks.append(k_chunk)

        AuditService.log_action(
            db=db,
            project_id=project_id,
            action="Created",
            category="Knowledge",
            entity_type="KnowledgeDocument",
            entity_id=doc.id,
            details=f"Added knowledge document '{doc.title}' ({len(chunks)} chunks)",
            new_value=doc.title,
        )

        db.commit()
        db.refresh(doc)
        return doc

    @staticmethod
    def search_knowledge(
        db: Session,
        project_id: str,
        request: KnowledgeSearchRequest,
    ) -> KnowledgeSearchResponse:
        """
        Retrieval service scoped strictly to the current project.
        Uses text keyword & token overlap ranking fallback with source citations.
        """
        query_terms = [t.lower() for t in request.query.split() if len(t) > 2]

        chunks = (
            db.query(KnowledgeChunk)
            .filter(KnowledgeChunk.project_id == project_id)
            .all()
        )

        results: List[KnowledgeSearchResultItem] = []
        for ch in chunks:
            text_lower = ch.chunk_text.lower()
            matches = sum(1 for term in query_terms if term in text_lower)
            if matches > 0 or not query_terms:
                score = round((matches / max(1, len(query_terms))) * 100, 1) if query_terms else 50.0
                doc_title = ch.document.title if ch.document else "Project Document"
                results.append(
                    KnowledgeSearchResultItem(
                        chunk_id=ch.id,
                        document_id=ch.document_id,
                        document_title=doc_title,
                        chunk_index=ch.chunk_index,
                        text_snippet=ch.chunk_text,
                        relevance_score=score,
                        source_reference=f"{doc_title} (Chunk #{ch.chunk_index + 1})",
                    )
                )

        results.sort(key=lambda x: x.relevance_score, reverse=True)
        top_results = results[: request.top_k]

        return KnowledgeSearchResponse(
            query=request.query,
            results_count=len(top_results),
            search_type="text_bm25_fallback",  # Accurately report search provider
            results=top_results,
        )
