from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.api.deps import get_current_project
from app.models.project import Project
from app.services.knowledge_service import KnowledgeService
from app.schemas.knowledge import KnowledgeDocumentCreate, KnowledgeSearchRequest, KnowledgeSearchResponse

router = APIRouter(prefix="/projects/{project_id}/knowledge-base", tags=["Knowledge Base & RAG"])


@router.get("", status_code=status.HTTP_200_OK)
def list_knowledge_docs(
    project: Project = Depends(get_current_project),
    db: Session = Depends(get_db),
):
    """List technical specs and project knowledge documents."""
    docs = KnowledgeService.list_documents(db, project.id)
    return [
        {
            "id": d.id,
            "project_id": d.project_id,
            "title": d.title,
            "category": d.category,
            "discipline": d.discipline,
            "author": d.author,
            "summary": d.summary,
            "tags": d.tags,
            "chunk_count": len(d.chunks) if d.chunks else 0,
            "created_at": d.created_at.isoformat(),
        }
        for d in docs
    ]


@router.post("/documents", status_code=status.HTTP_201_CREATED)
def create_knowledge_doc(
    data: KnowledgeDocumentCreate,
    project: Project = Depends(get_current_project),
    db: Session = Depends(get_db),
):
    """Add technical document and automatically generate index chunks."""
    doc = KnowledgeService.create_document(db, project.id, data)
    return {
        "id": doc.id,
        "title": doc.title,
        "chunks_created": len(doc.chunks) if doc.chunks else 0,
    }


@router.get("/documents/{document_id}", status_code=status.HTTP_200_OK)
def get_knowledge_doc(
    document_id: str,
    project: Project = Depends(get_current_project),
    db: Session = Depends(get_db),
):
    """Get knowledge document with chunks."""
    doc = KnowledgeService.get_document_by_id(db, project.id, document_id)
    return {
        "id": doc.id,
        "title": doc.title,
        "category": doc.category,
        "discipline": doc.discipline,
        "summary": doc.summary,
        "content": doc.content,
        "chunks": [
            {
                "id": ch.id,
                "chunk_index": ch.chunk_index,
                "text": ch.chunk_text,
            }
            for ch in doc.chunks
        ],
    }


@router.post("/search", status_code=status.HTTP_200_OK, response_model=KnowledgeSearchResponse)
def search_knowledge(
    request: KnowledgeSearchRequest,
    project: Project = Depends(get_current_project),
    db: Session = Depends(get_db),
):
    """Search project knowledge base chunks with source citations."""
    return KnowledgeService.search_knowledge(db, project.id, request)
