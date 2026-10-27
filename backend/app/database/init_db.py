from datetime import datetime, date, timezone
from sqlalchemy.orm import Session
from app.database.session import engine, SessionLocal
from app.database.base import Base
from app.models.project import Project
from app.models.schedule import ScheduleVersion, ScheduleActivity
from app.models.document_and_report import DailyReport, ExtractedEvent
from app.models.review import MatchingCandidate, PlannerReview
from app.models.progress import VerifiedProgress
from app.models.delay import DelayEvent
from app.models.knowledge import ProjectTerminology, KnowledgeDocument, KnowledgeChunk
from app.models.audit import AuditLog
from app.models.setting import ProjectSetting
from app.core.logging_config import logger


def init_database() -> None:
    """Create all tables in the active database engine (PostgreSQL or SQLite fallback)."""
    logger.info("Initializing database schema...")
    Base.metadata.create_all(bind=engine)
    logger.info("Database schema initialized successfully.")


def seed_demo_data(db: Session, force: bool = False) -> None:
    """
    Seed initial infrastructure demonstration projects and L1-L6 WBS hierarchy.
    Preserves user data: only seeds when no projects exist or force=True.
    """
    existing_count = db.query(Project).count()
    if existing_count > 0 and not force:
        logger.info(f"Database already contains {existing_count} project(s). Skipping automatic seed.")
        return

    logger.info("Seeding demonstration infrastructure projects and L1-L6 schedule hierarchy...")

    # 1. Project 1: ABC Refinery Expansion
    p1 = Project(
        name="ABC Refinery Expansion",
        code="ABC-REF",
        description="Expansion of processing units and utility tie-ins at the ABC Coastal Refinery.",
        location="Jurong Industrial Sector",
        status="In Progress",
        overall_progress=28.5,
        planned_start=date(2026, 1, 15),
        planned_finish=date(2027, 8, 30),
        actual_start=date(2026, 1, 20),
        owner="John Mitchell",
        is_archived=False,
    )

    # 2. Project 2: North Plant Pipeline Project
    p2 = Project(
        name="North Plant Pipeline Project",
        code="NPP-002",
        description="Cross-country 36-inch carbon steel gas pipeline and metering stations.",
        location="Northern Corridor Sector 4",
        status="In Progress",
        overall_progress=15.0,
        planned_start=date(2026, 3, 1),
        planned_finish=date(2027, 3, 31),
        actual_start=date(2026, 3, 10),
        owner="Sarah Jenkins",
        is_archived=False,
    )

    # 3. Project 3: Central Utilities Upgrade
    p3 = Project(
        name="Central Utilities Upgrade",
        code="CUU-003",
        description="High-voltage substation and cooling water pump house retrofit.",
        location="Sector 9 Substation",
        status="In Progress",
        overall_progress=42.0,
        planned_start=date(2026, 2, 1),
        planned_finish=date(2026, 12, 15),
        actual_start=date(2026, 2, 1),
        owner="Marcus Vance",
        is_archived=False,
    )

    db.add_all([p1, p2, p3])
    db.flush()

    # Create Baseline Schedule Version for ABC Refinery Expansion
    v1 = ScheduleVersion(
        project_id=p1.id,
        version_number=1,
        name="Revision 0 Baseline Schedule",
        source_file="ABC_Refinery_Rev0.xlsx",
        is_active=True,
        total_activities=8,
    )
    db.add(v1)
    db.flush()

    # Build L1-L6 WBS Hierarchy
    # L1
    l1 = ScheduleActivity(
        project_id=p1.id,
        schedule_version_id=v1.id,
        activity_code="WBS-L1-01",
        name="ABC Refinery Expansion",
        level="L1",
        discipline="General",
        location="All Facility",
        status="In Progress",
        progress=28.5,
        planned_start=date(2026, 1, 15),
        planned_finish=date(2027, 8, 30),
        hierarchy_path="WBS-L1-01",
    )
    db.add(l1)
    db.flush()

    # L2
    l2 = ScheduleActivity(
        project_id=p1.id,
        schedule_version_id=v1.id,
        activity_code="WBS-L2-01",
        name="Process Plant",
        level="L2",
        parent_id=l1.id,
        discipline="Processing",
        location="Unit A & B Area",
        status="In Progress",
        progress=32.0,
        planned_start=date(2026, 2, 1),
        planned_finish=date(2027, 5, 30),
        hierarchy_path="WBS-L1-01 / WBS-L2-01",
    )
    db.add(l2)
    db.flush()

    # L3
    l3 = ScheduleActivity(
        project_id=p1.id,
        schedule_version_id=v1.id,
        activity_code="WBS-L3-01",
        name="Piping",
        level="L3",
        parent_id=l2.id,
        discipline="Piping",
        location="Process Area",
        status="In Progress",
        progress=35.0,
        planned_start=date(2026, 3, 1),
        planned_finish=date(2027, 2, 28),
        hierarchy_path="WBS-L1-01 / WBS-L2-01 / WBS-L3-01",
    )
    db.add(l3)
    db.flush()

    # L4
    l4 = ScheduleActivity(
        project_id=p1.id,
        schedule_version_id=v1.id,
        activity_code="WBS-L4-01",
        name="Above Ground Piping",
        level="L4",
        parent_id=l3.id,
        discipline="Piping",
        location="Pipe Racks",
        status="In Progress",
        progress=40.0,
        planned_start=date(2026, 3, 15),
        planned_finish=date(2026, 12, 15),
        hierarchy_path="WBS-L1-01 / WBS-L2-01 / WBS-L3-01 / WBS-L4-01",
    )
    db.add(l4)
    db.flush()

    # L5
    l5 = ScheduleActivity(
        project_id=p1.id,
        schedule_version_id=v1.id,
        activity_code="WBS-L5-01",
        name="Carbon Steel Pipeline Installation",
        level="L5",
        parent_id=l4.id,
        discipline="Piping",
        location="Unit A & B Pipe Racks",
        status="In Progress",
        progress=45.0,
        planned_start=date(2026, 4, 1),
        planned_finish=date(2026, 11, 30),
        quantity=4500.0,
        unit="Meters",
        hierarchy_path="WBS-L1-01 / WBS-L2-01 / WBS-L3-01 / WBS-L4-01 / WBS-L5-01",
    )
    db.add(l5)
    db.flush()

    # L6 - Discrete Activities
    l6_101 = ScheduleActivity(
        project_id=p1.id,
        schedule_version_id=v1.id,
        activity_code="L6-101",
        name="Install 10-inch CS Pipeline — Unit A",
        level="L6",
        parent_id=l5.id,
        discipline="Piping",
        location="Unit A",
        status="In Progress",
        critical_path=True,
        progress=65.0,
        planned_start=date(2026, 5, 1),
        planned_finish=date(2026, 7, 30),
        actual_start=date(2026, 5, 3),
        duration_days=90,
        quantity=1200.0,
        unit="Meters",
        hierarchy_path="WBS-L1-01 / WBS-L2-01 / WBS-L3-01 / WBS-L4-01 / WBS-L5-01 / L6-101",
    )

    l6_102 = ScheduleActivity(
        project_id=p1.id,
        schedule_version_id=v1.id,
        activity_code="L6-102",
        name="Install 12-inch CS Pipeline — Unit B",
        level="L6",
        parent_id=l5.id,
        discipline="Piping",
        location="Unit B",
        status="Not Started",
        critical_path=True,
        progress=0.0,
        planned_start=date(2026, 8, 1),
        planned_finish=date(2026, 10, 15),
        duration_days=75,
        quantity=1500.0,
        unit="Meters",
        hierarchy_path="WBS-L1-01 / WBS-L2-01 / WBS-L3-01 / WBS-L4-01 / WBS-L5-01 / L6-102",
    )

    l6_103 = ScheduleActivity(
        project_id=p1.id,
        schedule_version_id=v1.id,
        activity_code="L6-103",
        name="Install 8-inch CS Pipeline — Unit C",
        level="L6",
        parent_id=l5.id,
        discipline="Piping",
        location="Unit C",
        status="In Progress",
        critical_path=False,
        progress=30.0,
        planned_start=date(2026, 6, 1),
        planned_finish=date(2026, 8, 30),
        actual_start=date(2026, 6, 5),
        duration_days=90,
        quantity=800.0,
        unit="Meters",
        hierarchy_path="WBS-L1-01 / WBS-L2-01 / WBS-L3-01 / WBS-L4-01 / WBS-L5-01 / L6-103",
    )

    db.add_all([l6_101, l6_102, l6_103])
    db.flush()

    # Project Terminology
    terms = [
        ProjectTerminology(
            project_id=p1.id,
            term="CS Pipeline",
            expansion="Carbon Steel Pipeline Installation",
            discipline="Piping",
            definition="Piping fabrication and field erection using ASTM A106/A53 Grade B materials",
            aliases=["CS Line", "Black Pipe", "Carbon Spools"],
            usage_count=42,
            is_verified=True,
        ),
        ProjectTerminology(
            project_id=p1.id,
            term="AGP",
            expansion="Above Ground Piping",
            discipline="Piping",
            definition="Piping installed above grade on steel trestles and concrete supports",
            aliases=["Rack Piping", "Topside Pipe"],
            usage_count=28,
            is_verified=True,
        ),
        ProjectTerminology(
            project_id=p1.id,
            term="NDT",
            expansion="Non-Destructive Testing",
            discipline="Quality",
            definition="Radiographic or ultrasonic examination of circumferential butt welds",
            aliases=["RT", "X-Ray Testing", "Radiography"],
            usage_count=19,
            is_verified=True,
        ),
    ]
    db.add_all(terms)

    # Demo Daily Report #104
    report_text = (
        "DAILY SITE PROGRESS REPORT #104\n"
        "Project: ABC Refinery Expansion (ABC-REF)\n"
        "Date: 2026-10-18 | Shift: Day | Weather: Clear, 28°C\n"
        "Contractor: Apex Engineering & Construction\n\n"
        "Summary of Daily Activities:\n"
        "1. Piping Team A completed installation of 30 meters of 10-inch CS pipeline in Unit A rack bay 4.\n"
        "2. Welder squad performed butt welds on joints W-104-01 through W-104-04. Visual inspection accepted.\n"
        "3. Material staging: Unit B valves delivery delayed due to shipping customs hold at port.\n"
        "4. Safety: Toolbox talk conducted at 07:00. Zero incidents recorded."
    )

    r104 = DailyReport(
        project_id=p1.id,
        report_number=104,
        report_date=date(2026, 10, 18),
        source_type="Direct Text",
        uploaded_by="John Mitchell",
        status="Processed",
        original_text=report_text,
    )
    db.add(r104)
    db.flush()

    # Extracted Event 1: 30m of 10-inch CS pipeline
    # Strict Progress Rule: quantity=30m, progress is left 'Not specified' because total scope % was not in the report.
    ev1 = ExtractedEvent(
        project_id=p1.id,
        report_id=r104.id,
        event_type="IN_PROGRESS",
        activity_name="Installation of 30 meters of 10-inch CS pipeline in Unit A rack bay 4",
        discipline="Piping",
        location="Unit A",
        quantity=30.0,
        unit="Meters",
        progress="Not specified",
        evidence="Piping Team A completed installation of 30 meters of 10-inch CS pipeline in Unit A rack bay 4.",
        event_date=date(2026, 10, 18),
    )

    # Extracted Event 2: Unit B Valve Delay
    ev2 = ExtractedEvent(
        project_id=p1.id,
        report_id=r104.id,
        event_type="DELAY",
        activity_name="Unit B valves delivery delayed due to shipping customs hold at port",
        discipline="Piping",
        location="Unit B",
        progress="Not specified",
        evidence="Material staging: Unit B valves delivery delayed due to shipping customs hold at port.",
        event_date=date(2026, 10, 18),
    )
    db.add_all([ev1, ev2])
    db.flush()

    # Matching Candidates for Event 1
    c1 = MatchingCandidate(
        event_id=ev1.id,
        activity_id=l6_101.id,
        fuzzy_score=91.5,
        semantic_score=None,
        combined_score=91.5,
        rationale="Exact discipline 'Piping', unit 'Unit A', and pipe specification '10-inch CS' matched L6-101.",
        algorithm="rapidfuzz_token_set",
        rank=1,
    )

    c2 = MatchingCandidate(
        event_id=ev1.id,
        activity_id=l6_102.id,
        fuzzy_score=68.0,
        semantic_score=None,
        combined_score=68.0,
        rationale="Same discipline and line type, but targets Unit B (12-inch) instead of Unit A (10-inch).",
        algorithm="rapidfuzz_token_set",
        rank=2,
    )
    db.add_all([c1, c2])
    db.flush()

    # Planner Review: Event 1 -> Approved
    pr1 = PlannerReview(
        project_id=p1.id,
        event_id=ev1.id,
        suggested_activity_id=l6_101.id,
        final_activity_id=l6_101.id,
        status="Approved",
        confidence=91.5,
        reviewer="David Kim (Senior Planner)",
        reviewed_at=datetime(2026, 10, 18, 17, 30, tzinfo=timezone.utc),
        comments="Verified against daily welding log W-104. 30 meters credited to L6-101 progress.",
        verified_quantity=30.0,
        is_overridden=False,
    )
    db.add(pr1)
    db.flush()

    # Verified Progress Record for Event 1
    prog1 = VerifiedProgress(
        project_id=p1.id,
        activity_id=l6_101.id,
        report_id=r104.id,
        verified_date=date(2026, 10, 18),
        quantity_installed=30.0,
        physical_percent=65.0,
        verified_by="David Kim",
        notes="Site Report #104 bay 4 installation",
    )
    db.add(prog1)

    # Delay Event
    del1 = DelayEvent(
        project_id=p1.id,
        activity_id=l6_102.id,
        activity_name="Install 12-inch CS Pipeline — Unit B",
        discipline="Piping",
        location="Unit B",
        critical_path=True,
        variance_days=10,
        root_cause="Material Delay: Customs Hold",
        impact="High",
        mitigation_status="Under Review",
        mitigation_plan="Procurement expediter deployed to customs clearance agent to release shipment on expedited bond.",
        baseline_start=date(2026, 8, 1),
        baseline_finish=date(2026, 10, 15),
        forecast_finish=date(2026, 10, 25),
        logged_date=date(2026, 10, 18),
        owner="John Mitchell",
    )
    db.add(del1)

    # Knowledge Document & Chunks
    kdoc = KnowledgeDocument(
        project_id=p1.id,
        title="ABC Refinery Piping Construction Specification (SEC-301)",
        category="Technical Specification",
        discipline="Piping",
        author="Engineering Standards Board",
        summary="Engineering specification for carbon steel process piping erection, laser alignment, and torque guidelines.",
        content="Section 4.2 - Carbon Steel Spool Erection: All 10-inch and 12-inch carbon steel spools shall be aligned with laser leveling. Flange torque tightening must strictly follow ASME PCC-1 guidelines.",
        tags=["piping", "spools", "torque", "ASME"],
    )
    db.add(kdoc)
    db.flush()

    kchunk1 = KnowledgeChunk(
        document_id=kdoc.id,
        project_id=p1.id,
        chunk_index=0,
        chunk_text="Section 4.2 - Carbon Steel Spool Erection: All 10-inch and 12-inch carbon steel spools shall be aligned with laser leveling. Flange torque tightening must strictly follow ASME PCC-1 guidelines.",
    )
    kchunk2 = KnowledgeChunk(
        document_id=kdoc.id,
        project_id=p1.id,
        chunk_index=1,
        chunk_text="Section 5.1 - Weld Inspection Acceptance Criteria: 100% visual examination and minimum 10% random radiographic testing (RT) required for all process hydrocarbon piping welds.",
    )
    db.add_all([kchunk1, kchunk2])

    # Initial Audit Trail Entries
    a1 = AuditLog(
        project_id=p1.id,
        action="Created",
        category="Project",
        user="System Initializer",
        entity_type="Project",
        entity_id=p1.id,
        details="Initial project setup and baseline creation for ABC Refinery Expansion",
        newValue="ABC-REF",
    )
    a2 = AuditLog(
        project_id=p1.id,
        action="Approved",
        category="Review",
        user="David Kim (Senior Planner)",
        entity_type="PlannerReview",
        entity_id=pr1.id,
        details="Approved candidate match for 30m of 10-inch CS pipeline to L6-101",
        confidence=91.5,
        newValue="L6-101",
    )
    db.add_all([a1, a2])

    # Default Project Settings
    sett1 = ProjectSetting(
        project_id=p1.id,
        high_confidence_threshold=85.0,
        low_confidence_threshold=60.0,
        email_alerts=True,
        daily_digest=True,
    )
    db.add(sett1)

    db.commit()
    logger.info("Successfully seeded demo data for ABC Refinery Expansion, North Plant Pipeline, and Central Utilities Upgrade.")
