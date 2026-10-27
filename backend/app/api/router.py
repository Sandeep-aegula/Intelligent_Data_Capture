from fastapi import APIRouter
from app.api.routes import (
    health,
    projects,
    dashboard,
    schedules,
    schedule_imports,
    reports,
    extraction,
    matching,
    reviews,
    progress,
    delays,
    knowledge_base,
    terminology,
    audit,
    settings,
    search,
)

api_router = APIRouter()

# Register all modular routes
api_router.include_router(health.router)
api_router.include_router(projects.router)
api_router.include_router(dashboard.router)
api_router.include_router(schedules.router)
api_router.include_router(schedule_imports.router)
api_router.include_router(reports.router)
api_router.include_router(extraction.router)
api_router.include_router(matching.router)
api_router.include_router(reviews.router)
api_router.include_router(progress.router)
api_router.include_router(delays.router)
api_router.include_router(knowledge_base.router)
api_router.include_router(terminology.router)
api_router.include_router(audit.router)
api_router.include_router(settings.router)
api_router.include_router(search.router)
