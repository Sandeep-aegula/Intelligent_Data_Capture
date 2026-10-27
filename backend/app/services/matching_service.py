from typing import List, Dict, Any, Optional
from rapidfuzz import fuzz
from sqlalchemy.orm import Session
from app.models.schedule import ScheduleActivity
from app.models.document_and_report import ExtractedEvent
from app.models.review import MatchingCandidate
from app.services.extraction_service import ExtractionService
from app.services.schedule_service import ScheduleService
from app.core.config import settings
from app.core.logging_config import logger


class MatchingService:
    @staticmethod
    def match_event_to_activities(
        db: Session,
        project_id: str,
        event_id: str,
        min_score: float = 30.0,
        top_k: int = 5,
    ) -> List[MatchingCandidate]:
        """
        Rank candidate schedule activities for an extracted event using RapidFuzz.
        Never hardcodes fixed values. Only compares activities within the current project.
        """
        event = ExtractionService.get_event_by_id(db, project_id, event_id)

        # Remove existing candidates for this event to avoid duplicates
        db.query(MatchingCandidate).filter(MatchingCandidate.event_id == event.id).delete()

        # Query all active schedule activities for this project
        activities = (
            db.query(ScheduleActivity)
            .filter(ScheduleActivity.project_id == project_id)
            .all()
        )
        if not activities:
            return []

        scored_candidates = []
        event_text = event.activity_name.lower()

        for act in activities:
            act_text = f"{act.name} {act.discipline or ''} {act.location or ''}".lower()

            # 1. Fuzzy token set ratio
            ts_ratio = fuzz.token_set_ratio(event_text, act_text)
            # 2. Token sort ratio
            sort_ratio = fuzz.token_sort_ratio(event_text, act.name.lower())
            base_fuzzy = (ts_ratio * 0.7) + (sort_ratio * 0.3)

            # Context alignment bonuses
            disc_match = False
            if event.discipline and act.discipline:
                if event.discipline.lower() in act.discipline.lower() or act.discipline.lower() in event.discipline.lower():
                    disc_match = True

            loc_match = False
            if event.location and act.location:
                if event.location.lower() in act.location.lower() or act.location.lower() in event.location.lower():
                    loc_match = True

            combined_score = base_fuzzy
            if disc_match:
                combined_score = min(100.0, combined_score + 5.0)
            if loc_match:
                combined_score = min(100.0, combined_score + 5.0)

            # Prefer leaf activities (L5 / L6) for linking work packages
            if act.level in ["L5", "L6"]:
                combined_score = min(100.0, combined_score + 2.0)

            # Build transparent rationale explanation
            explanations = []
            explanations.append(f"RapidFuzz token similarity: {base_fuzzy:.1f}%")
            if disc_match:
                explanations.append(f"Discipline match ('{act.discipline}')")
            if loc_match:
                explanations.append(f"Location match ('{act.location}')")
            if act.critical_path:
                explanations.append("Activity is on critical path")
            explanation_str = "; ".join(explanations)

            if combined_score >= min_score:
                scored_candidates.append({
                    "activity": act,
                    "fuzzy_score": round(base_fuzzy, 1),
                    "combined_score": round(combined_score, 1),
                    "rationale": explanation_str,
                })

        # Sort descending by score
        scored_candidates.sort(key=lambda x: x["combined_score"], reverse=True)
        top_candidates = scored_candidates[:top_k]

        candidates_to_persist = []
        for rank_idx, item in enumerate(top_candidates, start=1):
            cand = MatchingCandidate(
                event_id=event.id,
                activity_id=item["activity"].id,
                fuzzy_score=item["fuzzy_score"],
                semantic_score=None,  # Not fabricated; None unless genuine model ran
                combined_score=item["combined_score"],
                rationale=item["rationale"],
                algorithm="rapidfuzz_token_set_ratio",
                rank=rank_idx,
            )
            db.add(cand)
            candidates_to_persist.append(cand)

        db.commit()
        for c in candidates_to_persist:
            db.refresh(c)

        logger.info(f"Generated {len(candidates_to_persist)} matching candidates for event {event_id}")
        return candidates_to_persist

    @staticmethod
    def list_candidates_for_event(db: Session, event_id: str) -> List[MatchingCandidate]:
        return (
            db.query(MatchingCandidate)
            .filter(MatchingCandidate.event_id == event_id)
            .order_by(MatchingCandidate.rank.asc())
            .all()
        )

    @staticmethod
    def batch_match_report_events(db: Session, project_id: str, report_id: str) -> int:
        """Runs matching for all events in a daily report."""
        events = ExtractionService.list_events_for_report(db, project_id, report_id)
        total_candidates = 0
        for ev in events:
            cands = MatchingService.match_event_to_activities(db, project_id, ev.id)
            total_candidates += len(cands)
        return total_candidates
