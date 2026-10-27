import os
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, status, UploadFile, File
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.api.deps import get_current_project
from app.models.project import Project
from app.services.schedule_import_service import ScheduleImportService
from app.schemas.schedule import (
    ScheduleImportMapping,
    ScheduleImportPreview,
    ScheduleImportValidationResult,
    ScheduleImportCommitRequest,
)
from app.core.config import settings
from app.core.exceptions import ValidationException

router = APIRouter(prefix="/projects/{project_id}/schedule/imports", tags=["Schedule Imports"])


@router.post("", status_code=status.HTTP_201_CREATED)
async def upload_schedule_import(
    file: UploadFile = File(...),
    project: Project = Depends(get_current_project),
    db: Session = Depends(get_db),
):
    """
    Stage 1: Upload schedule file (CSV or XLSX) to initiate staged import workflow.
    """
    filename = file.filename or "schedule.csv"
    ext = filename.split(".")[-1].lower() if "." in filename else ""
    if ext not in ["csv", "xlsx", "xls"]:
        raise ValidationException("Only CSV (.csv) and Excel (.xlsx, .xls) files are supported for schedule import.")

    # Save to staging area
    upload_dir = os.path.join(settings.UPLOAD_DIR, project.id, "imports")
    os.makedirs(upload_dir, exist_ok=True)
    temp_path = os.path.join(upload_dir, f"{uuid.uuid4().hex}_{filename}")

    content = await file.read()
    with open(temp_path, "wb") as f:
        f.write(content)

    schedule_import = ScheduleImportService.create_import_stage(
        db=db,
        project_id=project.id,
        filename=filename,
        file_path=temp_path,
        file_type=ext,
    )

    return {
        "import_id": schedule_import.id,
        "filename": schedule_import.filename,
        "total_rows": schedule_import.total_rows,
        "status": schedule_import.status,
        "suggested_mapping": schedule_import.mapped_columns,
    }


@router.get("/{import_id}", status_code=status.HTTP_200_OK, response_model=ScheduleImportPreview)
def get_import_preview(
    import_id: str,
    project: Project = Depends(get_current_project),
    db: Session = Depends(get_db),
):
    """
    Stage 2 & 3: Preview uploaded rows and retrieve suggested column mapping.
    """
    return ScheduleImportService.get_import_preview(db, project.id, import_id)


@router.post("/{import_id}/validate", status_code=status.HTTP_200_OK, response_model=ScheduleImportValidationResult)
def validate_import(
    import_id: str,
    mapping: Optional[ScheduleImportMapping] = None,
    project: Project = Depends(get_current_project),
    db: Session = Depends(get_db),
):
    """
    Stage 4 & 5: Validate rows, duplicate codes, hierarchy parent links, and date formats.
    """
    return ScheduleImportService.validate_import(db, project.id, import_id, mapping=mapping)


@router.post("/{import_id}/commit", status_code=status.HTTP_201_CREATED)
def commit_import(
    import_id: str,
    request: ScheduleImportCommitRequest,
    project: Project = Depends(get_current_project),
    db: Session = Depends(get_db),
):
    """
    Stage 7 & 8: Commit validated import to create a new ScheduleVersion and insert all activities.
    """
    new_version = ScheduleImportService.commit_import(db, project.id, import_id, request)
    return {
        "message": "Schedule version committed successfully",
        "version_id": new_version.id,
        "version_number": new_version.version_number,
        "name": new_version.name,
        "total_activities": new_version.total_activities,
    }
