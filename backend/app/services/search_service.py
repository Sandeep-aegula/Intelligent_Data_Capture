from typing import List
from sqlalchemy.orm import Session
from app.models.schedule import ScheduleActivity
from app.models.document_and_report import DailyReport
from app.models.delay import DelayEvent
from app.models.knowledge import ProjectTerminology, KnowledgeDocument
from app.schemas.search import SearchResultItem, UnifiedSearchResponse


class SearchService:
    @staticmethod
    def unified_search(db: Session, project_id: str, query: str, limit: int = 20) -> UnifiedSearchResponse:
        """
        Search schedule activities, reports, terminology, delays, and knowledge items.
        Strictly isolated by project_id to prevent any cross-project leakage.
        """
        q = query.strip().lower()
        results: List[SearchResultItem] = []
        if not q:
            return UnifiedSearchResponse(query=query, project_id=project_id, total_results=0, results=[])

        # 1. Search Activities
        activities = (
            db.query(ScheduleActivity)
            .filter(
                ScheduleActivity.project_id == project_id,
                (
                    ScheduleActivity.name.ilike(f"%{q}%")
                    | ScheduleActivity.activity_code.ilike(f"%{q}%")
                    | ScheduleActivity.discipline.ilike(f"%{q}%")
                    | ScheduleActivity.location.ilike(f"%{q}%")
                ),
            )
            .limit(10)
            .all()
        )
        for a in activities:
            results.append(
                SearchResultItem(
                    category="schedule",
                    item_id=a.id,
                    title=f"{a.activity_code} — {a.name}",
                    snippet=f"Level: {a.level} | Discipline: {a.discipline or 'N/A'} | Status: {a.status} ({a.progress}%)",
                    match_score=0.95 if q in a.activity_code.lower() else 0.85,
                    navigation_url=f"/schedule?activity={a.id}",
                )
            )

        # 2. Search Daily Reports
        reports = (
            db.query(DailyReport)
            .filter(
                DailyReport.project_id == project_id,
                (
                    DailyReport.original_text.ilike(f"%{q}%")
                    | DailyReport.uploaded_by.ilike(f"%{q}%")
                ),
            )
            .limit(5)
            .all()
        )
        for r in reports:
            # Extract snippet containing query
            idx = r.original_text.lower().find(q)
            snippet = r.original_text[max(0, idx - 40) : min(len(r.original_text), idx + 80)] if idx != -1 else r.original_text[:100]
            results.append(
                SearchResultItem(
                    category="report",
                    item_id=r.id,
                    title=f"Daily Site Report #{r.report_number} ({r.report_date})",
                    snippet=f"...{snippet.strip()}...",
                    match_score=0.80,
                    navigation_url=f"/reports?report={r.id}",
                )
            )

        # 3. Search Terminology
        terms = (
            db.query(ProjectTerminology)
            .filter(
                ProjectTerminology.project_id == project_id,
                (
                    ProjectTerminology.term.ilike(f"%{q}%")
                    | ProjectTerminology.expansion.ilike(f"%{q}%")
                    | ProjectTerminology.definition.ilike(f"%{q}%")
                ),
            )
            .limit(5)
            .all()
        )
        for t in terms:
            results.append(
                SearchResultItem(
                    category="terminology",
                    item_id=t.id,
                    title=f"Terminology: {t.term}",
                    snippet=f"{t.expansion} ({t.discipline}) - Aliases: {', '.join(t.aliases or [])}",
                    match_score=0.90,
                    navigation_url="/knowledge-base",
                )
            )

        # 4. Search Delays
        delays = (
            db.query(DelayEvent)
            .filter(
                DelayEvent.project_id == project_id,
                (
                    DelayEvent.root_cause.ilike(f"%{q}%")
                    | DelayEvent.activity_name.ilike(f"%{q}%")
                    | DelayEvent.mitigation_plan.ilike(f"%{q}%")
                ),
            )
            .limit(5)
            .all()
        )
        for d in delays:
            results.append(
                SearchResultItem(
                    category="delay",
                    item_id=d.id,
                    title=f"Delay: {d.root_cause}",
                    snippet=f"Impact: {d.impact} | Variance: {d.variance_days} days | Activity: {d.activity_name}",
                    match_score=0.85,
                    navigation_url="/delays",
                )
            )

        # 5. Search Knowledge Documents
        kdocs = (
            db.query(KnowledgeDocument)
            .filter(
                KnowledgeDocument.project_id == project_id,
                (
                    KnowledgeDocument.title.ilike(f"%{q}%")
                    | KnowledgeDocument.content.ilike(f"%{q}%")
                ),
            )
            .limit(5)
            .all()
        )
        for kd in kdocs:
            results.append(
                SearchResultItem(
                    category="knowledge",
                    item_id=kd.id,
                    title=f"Doc: {kd.title}",
                    snippet=kd.summary or kd.content[:120],
                    match_score=0.80,
                    navigation_url="/knowledge-base",
                )
            )

        # Sort by match score and truncate to limit
        results.sort(key=lambda x: x.match_score, reverse=True)
        top_results = results[:limit]

        return UnifiedSearchResponse(
            query=query,
            project_id=project_id,
            total_results=len(top_results),
            results=top_results,
        )
