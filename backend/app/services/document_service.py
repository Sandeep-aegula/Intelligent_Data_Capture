import os
import re
import uuid
from typing import Tuple, Optional
from sqlalchemy.orm import Session
from app.models.document_and_report import ProjectDocument
from app.core.config import settings
from app.core.exceptions import ValidationException, ResourceNotFoundException
from app.core.logging_config import logger


class DocumentService:
    ALLOWED_EXTENSIONS = {"pdf", "docx", "xlsx", "xls", "txt", "csv"}

    @staticmethod
    def _sanitize_filename(filename: str) -> str:
        """Prevent path traversal and sanitize filename."""
        clean = os.path.basename(filename)
        clean = re.sub(r"[^\w\.-]", "_", clean)
        return clean or f"doc_{uuid.uuid4().hex[:8]}"

    @staticmethod
    def extract_text_from_file(file_path: str, ext: str) -> str:
        """
        Extract clean text content from supported file types: PDF, DOCX, XLSX, TXT, CSV.
        """
        ext = ext.lower().lstrip(".")
        extracted_text = ""

        try:
            if ext == "pdf":
                import fitz  # PyMuPDF
                doc = fitz.open(file_path)
                pages = []
                for page in doc:
                    pages.append(page.get_text())
                extracted_text = "\n".join(pages).strip()

            elif ext == "docx":
                import docx
                doc = docx.Document(file_path)
                paragraphs = [p.text for p in doc.paragraphs if p.text]
                extracted_text = "\n".join(paragraphs).strip()

            elif ext in ["xlsx", "xls"]:
                import openpyxl
                wb = openpyxl.load_workbook(file_path, data_only=True)
                lines = []
                for sheet in wb.worksheets:
                    lines.append(f"--- Sheet: {sheet.title} ---")
                    for row in sheet.iter_rows(values_only=True):
                        row_vals = [str(cell) for cell in row if cell is not None]
                        if row_vals:
                            lines.append(" | ".join(row_vals))
                extracted_text = "\n".join(lines).strip()

            elif ext in ["txt", "csv"]:
                with open(file_path, "r", encoding="utf-8", errors="replace") as f:
                    extracted_text = f.read().strip()

        except Exception as e:
            logger.error(f"Error parsing file {file_path}: {e}")
            extracted_text = f"[Text extraction error: {e}]"

        return extracted_text

    @staticmethod
    def save_and_process_upload(
        db: Session,
        project_id: str,
        original_filename: str,
        file_bytes: bytes,
    ) -> ProjectDocument:
        """
        Validates, saves to disk, extracts text, and registers ProjectDocument.
        """
        # Validate size
        max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
        if len(file_bytes) > max_bytes:
            raise ValidationException(
                f"File size exceeds maximum allowed limit of {settings.MAX_UPLOAD_SIZE_MB}MB."
            )

        # Validate extension
        clean_name = DocumentService._sanitize_filename(original_filename)
        ext = clean_name.split(".")[-1].lower() if "." in clean_name else ""
        if ext not in DocumentService.ALLOWED_EXTENSIONS:
            raise ValidationException(
                f"File type '{ext}' is not supported. Supported formats: {', '.join(sorted(DocumentService.ALLOWED_EXTENSIONS))}"
            )

        # Ensure project upload folder exists
        upload_dir = os.path.join(settings.UPLOAD_DIR, project_id)
        os.makedirs(upload_dir, exist_ok=True)

        stored_filename = f"{uuid.uuid4().hex}_{clean_name}"
        storage_path = os.path.join(upload_dir, stored_filename)

        with open(storage_path, "wb") as f:
            f.write(file_bytes)

        # Extract text preview
        extracted_text = DocumentService.extract_text_from_file(storage_path, ext)

        doc = ProjectDocument(
            project_id=project_id,
            filename=clean_name,
            file_type=ext,
            file_size_bytes=len(file_bytes),
            storage_path=storage_path,
            extracted_text=extracted_text,
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)
        logger.info(f"Uploaded and processed document {doc.id} ({clean_name}) for project {project_id}")
        return doc

    @staticmethod
    def get_document(db: Session, project_id: str, document_id: str) -> ProjectDocument:
        doc = (
            db.query(ProjectDocument)
            .filter(ProjectDocument.id == document_id, ProjectDocument.project_id == project_id)
            .first()
        )
        if not doc:
            raise ResourceNotFoundException(f"Document {document_id} not found in project {project_id}.")
        return doc
