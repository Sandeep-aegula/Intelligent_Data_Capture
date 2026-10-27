from fastapi import HTTPException, status


class ProjectPulseException(Exception):
    """Base exception for application errors."""
    def __init__(self, message: str, status_code: int = status.HTTP_400_BAD_REQUEST, details: dict = None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.details = details or {}


class ResourceNotFoundException(ProjectPulseException):
    def __init__(self, resource: str, resource_id: str):
        super().__init__(
            message=f"{resource} with id '{resource_id}' not found",
            status_code=status.HTTP_404_NOT_FOUND,
            details={"resource": resource, "id": resource_id}
        )


class ProjectScopeMismatchException(ProjectPulseException):
    def __init__(self, resource: str, resource_id: str, project_id: str):
        super().__init__(
            message=f"{resource} '{resource_id}' does not belong to project '{project_id}'",
            status_code=status.HTTP_404_NOT_FOUND,
            details={"resource": resource, "id": resource_id, "project_id": project_id}
        )


class ValidationException(ProjectPulseException):
    def __init__(self, message: str, errors: list = None):
        super().__init__(
            message=message,
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            details={"errors": errors or []}
        )
