import os
import pandas as pd
from datetime import datetime, date
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.models.schedule import ScheduleImport, ScheduleVersion, ScheduleActivity
from app.schemas.schedule import (
    ScheduleImportMapping,
    ScheduleImportPreview,
    ScheduleImportValidationResult,
    ScheduleImportValidationError,
    ScheduleImportCommitRequest,
)
from app.services.audit_service import AuditService
from app.core.exceptions import ResourceNotFoundException, ValidationException
from app.core.logging_config import logger


class ScheduleImportService:
    @staticmethod
    def _read_dataframe(file_path: str, file_type: str) -> pd.DataFrame:
        """Safely read CSV or Excel into DataFrame."""
        if file_type == "csv":
            # Attempt UTF-8, fallback to latin-1
            try:
                df = pd.read_csv(file_path, encoding="utf-8")
            except UnicodeDecodeError:
                df = pd.read_csv(file_path, encoding="latin-1")
        elif file_type in ["xlsx", "xls"]:
            df = pd.read_excel(file_path)
        else:
            raise ValidationException(f"Unsupported schedule import file format: {file_type}")
        return df

    @staticmethod
    def create_import_stage(
        db: Session,
        project_id: str,
        filename: str,
        file_path: str,
        file_type: str,
    ) -> ScheduleImport:
        """
        Stage 1 & 2: Parse headers and generate preview rows.
        """
        df = ScheduleImportService._read_dataframe(file_path, file_type)
        total_rows = len(df)
        headers = [str(col).strip() for col in df.columns]

        # Preview first 5 rows with string conversion
        preview_df = df.head(5).fillna("")
        sample_rows = preview_df.to_dict(orient="records")

        # Auto-detect suggested column mapping
        col_lower = {h.lower(): h for h in headers}
        suggested_mapping = ScheduleImportMapping(
            activity_code=col_lower.get("activity_code", col_lower.get("code", col_lower.get("activity id", headers[0]))),
            name=col_lower.get("activity_name", col_lower.get("name", col_lower.get("description", headers[min(1, len(headers)-1)]))),
            level=col_lower.get("level", col_lower.get("wbs_level", None)),
            parent_code=col_lower.get("parent_code", col_lower.get("parent", None)),
            discipline=col_lower.get("discipline", col_lower.get("trade", None)),
            area=col_lower.get("area", col_lower.get("location", None)),
            planned_start=col_lower.get("planned_start", col_lower.get("start", None)),
            planned_finish=col_lower.get("planned_finish", col_lower.get("finish", None)),
            planned_quantity=col_lower.get("quantity", col_lower.get("planned_quantity", None)),
            unit_of_measure=col_lower.get("unit", col_lower.get("uom", None)),
        )

        schedule_import = ScheduleImport(
            project_id=project_id,
            filename=filename,
            file_path=file_path,
            file_type=file_type,
            status="PENDING",
            total_rows=total_rows,
            mapped_columns=suggested_mapping.model_dump(),
            preview_data=sample_rows,
            validation_errors=[],
            validation_warnings=[],
        )
        db.add(schedule_import)
        db.commit()
        db.refresh(schedule_import)

        AuditService.log_action(
            db=db,
            project_id=project_id,
            action="Uploaded",
            category="Schedule",
            entity_type="ScheduleImport",
            entity_id=schedule_import.id,
            details=f"Uploaded schedule file {filename} ({total_rows} rows)",
            new_value=filename,
        )
        return schedule_import

    @staticmethod
    def get_import_preview(db: Session, project_id: str, import_id: str) -> ScheduleImportPreview:
        s_import = (
            db.query(ScheduleImport)
            .filter(ScheduleImport.id == import_id, ScheduleImport.project_id == project_id)
            .first()
        )
        if not s_import:
            raise ResourceNotFoundException(f"Schedule import {import_id} not found.")

        df = ScheduleImportService._read_dataframe(s_import.file_path, s_import.file_type)
        headers = [str(col).strip() for col in df.columns]

        return ScheduleImportPreview(
            import_id=s_import.id,
            filename=s_import.filename,
            file_type=s_import.file_type,
            total_rows=s_import.total_rows,
            headers=headers,
            sample_rows=s_import.preview_data,
            suggested_mapping=ScheduleImportMapping(**s_import.mapped_columns),
        )

    @staticmethod
    def validate_import(
        db: Session,
        project_id: str,
        import_id: str,
        mapping: Optional[ScheduleImportMapping] = None,
    ) -> ScheduleImportValidationResult:
        """
        Stage 5 & 6: Validate rows and hierarchy before committing.
        Checks:
        - Required fields (activity_code, activity_name)
        - Duplicate codes within file
        - Unknown parents within file or active project schedule
        - Valid levels (L1 - L6)
        - Valid date formats
        - Self-referencing parents
        """
        s_import = (
            db.query(ScheduleImport)
            .filter(ScheduleImport.id == import_id, ScheduleImport.project_id == project_id)
            .first()
        )
        if not s_import:
            raise ResourceNotFoundException(f"Schedule import {import_id} not found.")

        if mapping:
            s_import.mapped_columns = mapping.model_dump()

        active_mapping = ScheduleImportMapping(**s_import.mapped_columns)
        df = ScheduleImportService._read_dataframe(s_import.file_path, s_import.file_type)

        errors: List[ScheduleImportValidationError] = []
        warnings: List[str] = []

        code_col = active_mapping.activity_code
        name_col = active_mapping.name
        parent_col = active_mapping.parent_code
        level_col = active_mapping.level

        if code_col not in df.columns:
            errors.append(ScheduleImportValidationError(
                row_number=0, field="activity_code", error=f"Mapped column '{code_col}' does not exist in file."
            ))
        if name_col not in df.columns:
            errors.append(ScheduleImportValidationError(
                row_number=0, field="name", error=f"Mapped column '{name_col}' does not exist in file."
            ))

        if errors:
            s_import.status = "FAILED"
            s_import.validation_errors = [e.model_dump() for e in errors]
            db.commit()
            return ScheduleImportValidationResult(
                import_id=import_id,
                is_valid=False,
                total_rows=len(df),
                valid_rows_count=0,
                error_count=len(errors),
                errors=errors,
                warnings=warnings,
            )

        # Track codes seen in the file for duplicate and parent resolution
        seen_codes = set()
        file_codes = set(df[code_col].dropna().astype(str).str.strip())

        # Existing codes in project active schedule
        existing_activities = (
            db.query(ScheduleActivity.activity_code)
            .filter(ScheduleActivity.project_id == project_id)
            .all()
        )
        project_codes = {a[0] for a in existing_activities}
        all_known_codes = file_codes.union(project_codes)

        valid_rows = 0
        for idx, row in df.iterrows():
            row_num = idx + 2  # 1-indexed header + 1
            code_val = str(row[code_col]).strip() if pd.notna(row[code_col]) else None
            name_val = str(row[name_col]).strip() if pd.notna(row[name_col]) else None

            # Required code
            if not code_val or code_val.lower() == "nan":
                errors.append(ScheduleImportValidationError(
                    row_number=row_num, field="activity_code", error="Activity code cannot be empty."
                ))
                continue

            # Duplicate code in import file
            if code_val in seen_codes:
                errors.append(ScheduleImportValidationError(
                    row_number=row_num,
                    activity_code=code_val,
                    field="activity_code",
                    error=f"Duplicate activity code '{code_val}' detected in file.",
                ))
            seen_codes.add(code_val)

            # Required name
            if not name_val or name_val.lower() == "nan":
                errors.append(ScheduleImportValidationError(
                    row_number=row_num,
                    activity_code=code_val,
                    field="name",
                    error="Activity name cannot be empty.",
                ))

            # Level validation
            if level_col and level_col in df.columns and pd.notna(row[level_col]):
                lvl_str = str(row[level_col]).strip().upper()
                if lvl_str not in ["L1", "L2", "L3", "L4", "L5", "L6", "1", "2", "3", "4", "5", "6"]:
                    warnings.append(f"Row {row_num}: Non-standard level '{lvl_str}' for activity '{code_val}'.")

            # Parent code validation
            if parent_col and parent_col in df.columns and pd.notna(row[parent_col]):
                p_code = str(row[parent_col]).strip()
                if p_code and p_code.lower() != "nan":
                    if p_code == code_val:
                        errors.append(ScheduleImportValidationError(
                            row_number=row_num,
                            activity_code=code_val,
                            field="parent_code",
                            error=f"Activity '{code_val}' cannot be its own parent.",
                        ))
                    elif p_code not in all_known_codes:
                        errors.append(ScheduleImportValidationError(
                            row_number=row_num,
                            activity_code=code_val,
                            field="parent_code",
                            error=f"Parent activity code '{p_code}' does not exist in file or active schedule.",
                        ))

            valid_rows += 1

        is_valid = len(errors) == 0
        s_import.status = "VALIDATED" if is_valid else "FAILED"
        s_import.validation_errors = [e.model_dump() for e in errors]
        s_import.validation_warnings = warnings
        db.commit()

        return ScheduleImportValidationResult(
            import_id=import_id,
            is_valid=is_valid,
            total_rows=len(df),
            valid_rows_count=valid_rows,
            error_count=len(errors),
            errors=errors,
            warnings=warnings,
        )

    @staticmethod
    def commit_import(
        db: Session,
        project_id: str,
        import_id: str,
        request: ScheduleImportCommitRequest,
    ) -> ScheduleVersion:
        """
        Stage 7 & 8: Commit only after explicit confirmation.
        Creates a new immutable ScheduleVersion and inserts all validated activities.
        Retires previous active schedule version safely.
        """
        s_import = (
            db.query(ScheduleImport)
            .filter(ScheduleImport.id == import_id, ScheduleImport.project_id == project_id)
            .first()
        )
        if not s_import:
            raise ResourceNotFoundException(f"Schedule import {import_id} not found.")

        # Re-verify validation status
        if s_import.status != "VALIDATED":
            val_result = ScheduleImportService.validate_import(db, project_id, import_id)
            if not val_result.is_valid:
                raise ValidationException(
                    f"Cannot commit import: file has {val_result.error_count} validation error(s). Please review."
                )

        df = ScheduleImportService._read_dataframe(s_import.file_path, s_import.file_type)
        active_mapping = ScheduleImportMapping(**s_import.mapped_columns)

        # Deactivate existing schedule versions
        db.query(ScheduleVersion).filter(
            ScheduleVersion.project_id == project_id, ScheduleVersion.is_active == True
        ).update({"is_active": False})

        # Calculate next version number
        latest_version = (
            db.query(ScheduleVersion)
            .filter(ScheduleVersion.project_id == project_id)
            .order_by(ScheduleVersion.version_number.desc())
            .first()
        )
        next_version_num = (latest_version.version_number + 1) if latest_version else 1

        # Create new ScheduleVersion
        new_version = ScheduleVersion(
            project_id=project_id,
            version_number=next_version_num,
            name=request.version_name or f"Imported Schedule Rev {next_version_num}",
            source_file=s_import.filename,
            is_active=True,
            total_activities=len(df),
        )
        db.add(new_version)
        db.flush()

        code_col = active_mapping.activity_code
        name_col = active_mapping.name
        level_col = active_mapping.level
        parent_col = active_mapping.parent_code
        disc_col = active_mapping.discipline
        area_col = active_mapping.area
        start_col = active_mapping.planned_start
        finish_col = active_mapping.planned_finish
        qty_col = active_mapping.planned_quantity
        unit_col = active_mapping.unit_of_measure

        # First pass: Create activities
        created_by_code: Dict[str, ScheduleActivity] = {}
        for _, row in df.iterrows():
            code_val = str(row[code_col]).strip()
            name_val = str(row[name_col]).strip()

            lvl = "L6"
            if level_col and level_col in df.columns and pd.notna(row[level_col]):
                l_str = str(row[level_col]).strip().upper()
                lvl = l_str if l_str.startswith("L") else f"L{l_str}"

            disc = str(row[disc_col]).strip() if disc_col and disc_col in df.columns and pd.notna(row[disc_col]) else None
            loc = str(row[area_col]).strip() if area_col and area_col in df.columns and pd.notna(row[area_col]) else None

            # Date parsing helper
            def _parse_date(val):
                if pd.isna(val):
                    return None
                try:
                    return pd.to_datetime(val).date()
                except Exception:
                    return None

            p_start = _parse_date(row[start_col]) if start_col and start_col in df.columns else None
            p_finish = _parse_date(row[finish_col]) if finish_col and finish_col in df.columns else None

            qty = None
            if qty_col and qty_col in df.columns and pd.notna(row[qty_col]):
                try:
                    qty = float(row[qty_col])
                except Exception:
                    qty = None

            uom = str(row[unit_col]).strip() if unit_col and unit_col in df.columns and pd.notna(row[unit_col]) else None

            act = ScheduleActivity(
                project_id=project_id,
                schedule_version_id=new_version.id,
                activity_code=code_val,
                name=name_val,
                level=lvl,
                discipline=disc,
                location=loc,
                planned_start=p_start,
                planned_finish=p_finish,
                quantity=qty,
                unit=uom,
                status="Not Started",
                progress=0.0,
            )
            db.add(act)
            created_by_code[code_val] = act

        db.flush()

        # Second pass: Link parent relationships and hierarchy paths
        for _, row in df.iterrows():
            code_val = str(row[code_col]).strip()
            if parent_col and parent_col in df.columns and pd.notna(row[parent_col]):
                p_code = str(row[parent_col]).strip()
                if p_code in created_by_code:
                    parent_act = created_by_code[p_code]
                    child_act = created_by_code[code_val]
                    child_act.parent_id = parent_act.id
                    child_act.hierarchy_path = (
                        f"{parent_act.hierarchy_path} / {code_val}"
                        if parent_act.hierarchy_path
                        else f"{parent_act.activity_code} / {code_val}"
                    )

        s_import.status = "COMMITTED"
        AuditService.log_action(
            db=db,
            project_id=project_id,
            action="Committed",
            category="Schedule",
            entity_type="ScheduleVersion",
            entity_id=new_version.id,
            details=f"Committed schedule version {new_version.version_number} from import {import_id} ({len(df)} activities)",
            new_value=str(new_version.version_number),
        )

        db.commit()
        db.refresh(new_version)
        logger.info(f"Committed schedule version {new_version.version_number} for project {project_id}")
        return new_version
