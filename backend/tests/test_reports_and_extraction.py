import io
import pytest
from fastapi import status


def get_demo_project_id(client):
    res = client.get("/api/v1/projects")
    return res.json()[0]["id"]


def test_create_daily_report_direct(client):
    p_id = get_demo_project_id(client)

    payload = {
        "report_date": "2026-10-19",
        "author_name": "Site Engineer Alex",
        "raw_text": "Completed 45 meters of 8-inch CS pipeline installation in Unit C. All bolts torqued.",
    }
    res = client.post(f"/api/v1/projects/{p_id}/reports", json=payload)
    assert res.status_code == status.HTTP_201_CREATED
    data = res.json()
    assert data["report_number"] is not None
    assert data["status"] == "Processed"


def test_upload_daily_report_file(client):
    p_id = get_demo_project_id(client)

    doc_text = "DAILY SITE LOG: Welded 12 joints on Unit B bypass line. Weather: Sunny."
    files = {"file": ("site_log_105.txt", io.BytesIO(doc_text.encode("utf-8")), "text/plain")}
    res = client.post(f"/api/v1/projects/{p_id}/reports/upload", files=files, data={"author": "Field Inspector"})
    assert res.status_code == status.HTTP_201_CREATED
    data = res.json()
    assert "file" in data["source_type"].lower() or "txt" in data["source_type"].lower()


def test_extraction_strict_progress_rule(client):
    p_id = get_demo_project_id(client)

    # Report stating quantity without total scope %
    report_text = (
        "DAILY REPORT\n"
        "1. Installed 30 meters of 10-inch CS pipeline in Unit A rack bay 4.\n"
        "2. Unit B valve delivery delayed due to shipping customs hold.\n"
    )
    rep_res = client.post(
        f"/api/v1/projects/{p_id}/reports",
        json={"report_date": "2026-10-18", "raw_text": report_text},
    )
    rep_id = rep_res.json()["id"]

    # Trigger extraction
    ext_res = client.post(f"/api/v1/projects/{p_id}/reports/{rep_id}/extract")
    assert ext_res.status_code == status.HTTP_200_OK
    events = ext_res.json()
    assert len(events) >= 2

    # Check Event 1: Quantity is 30 meters, progress is 'Not specified'
    ev1 = events[0]
    assert ev1["quantity"] == 30.0
    assert ev1["unit"] == "Meters"
    assert ev1["progress"] == "Not specified"  # Strict rule: not invented!
    assert "30 meters" in ev1["evidence"]

    # Check Event 2: Delay indicated
    ev2 = events[1]
    assert ev2["event_type"] == "DELAY"
