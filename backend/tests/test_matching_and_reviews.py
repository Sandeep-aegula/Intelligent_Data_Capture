import pytest
from fastapi import status


def get_demo_project_id(client):
    res = client.get("/api/v1/projects")
    return res.json()[0]["id"]


def test_matching_generates_ranked_candidates(client):
    p_id = get_demo_project_id(client)

    # Get events from seeded report
    reps_res = client.get(f"/api/v1/projects/{p_id}/reports")
    assert reps_res.status_code == status.HTTP_200_OK
    rep_id = reps_res.json()[0]["id"]

    evs_res = client.get(f"/api/v1/projects/{p_id}/reports/{rep_id}/events")
    assert evs_res.status_code == status.HTTP_200_OK
    events = evs_res.json()
    assert len(events) >= 1
    ev_id = events[0]["id"]

    # Run match
    match_res = client.post(f"/api/v1/projects/{p_id}/events/{ev_id}/match")
    assert match_res.status_code == status.HTTP_200_OK
    candidates = match_res.json()
    assert len(candidates) >= 1
    best_cand = candidates[0]
    assert best_cand["rank"] == 1
    assert best_cand["fuzzy_score"] > 0
    assert best_cand["algorithm"] == "rapidfuzz_token_set_ratio"
    assert "token similarity" in best_cand["rationale"].lower()


def test_planner_review_workflow_and_reassignment(client):
    p_id = get_demo_project_id(client)

    # Get reviews
    reviews_res = client.get(f"/api/v1/projects/{p_id}/reviews")
    assert reviews_res.status_code == status.HTTP_200_OK
    reviews = reviews_res.json()
    assert len(reviews) >= 1
    rev = reviews[0]
    rev_id = rev["id"]

    # 1. Reject
    rej_res = client.post(
        f"/api/v1/projects/{p_id}/reviews/{rev_id}/reject",
        json={"reason": "Incorrect unit cited by site inspector", "planner_name": "Lead Planner"},
    )
    assert rej_res.status_code == status.HTTP_200_OK
    assert rej_res.json()["status"] == "Rejected"

    # 2. Reassign to another activity
    acts_res = client.get(f"/api/v1/projects/{p_id}/schedule/activities?level=L6")
    acts = acts_res.json()
    target_act = acts[min(1, len(acts) - 1)]

    reassign_res = client.post(
        f"/api/v1/projects/{p_id}/reviews/{rev_id}/reassign",
        json={
            "new_activity_id": target_act["id"],
            "reason": "Actual work was conducted in Unit B",
            "planner_name": "Lead Planner",
        },
    )
    assert reassign_res.status_code == status.HTTP_200_OK
    assert reassign_res.json()["status"] == "Reassigned"
    assert reassign_res.json()["final_activity_id"] == target_act["id"]

    # 3. Approve
    app_res = client.post(
        f"/api/v1/projects/{p_id}/reviews/{rev_id}/approve",
        json={"planner_name": "Lead Planner", "confirmed_quantity": 30.0},
    )
    assert app_res.status_code == status.HTTP_200_OK
    assert app_res.json()["status"] == "Approved"

    # 4. Verify progress recorded
    prog_res = client.get(f"/api/v1/projects/{p_id}/progress")
    assert prog_res.status_code == status.HTTP_200_OK
    records = prog_res.json()
    assert len(records) >= 1


def test_unified_search_and_knowledge(client):
    p_id = get_demo_project_id(client)

    # Search query "piping"
    search_res = client.get(f"/api/v1/projects/{p_id}/search?q=piping")
    assert search_res.status_code == status.HTTP_200_OK
    search_data = search_res.json()
    assert search_data["total_results"] >= 1
    categories = [item["category"] for item in search_data["results"]]
    assert "schedule" in categories or "terminology" in categories

    # Knowledge search
    k_res = client.post(f"/api/v1/projects/{p_id}/knowledge-base/search", json={"query": "laser alignment"})
    assert k_res.status_code == status.HTTP_200_OK
    k_data = k_res.json()
    assert k_data["search_type"] == "text_bm25_fallback"
    assert k_data["results_count"] >= 1


def test_audit_csv_export(client):
    p_id = get_demo_project_id(client)

    exp_res = client.get(f"/api/v1/projects/{p_id}/audit/export")
    assert exp_res.status_code == status.HTTP_200_OK
    assert exp_res.headers["content-type"] == "text/csv; charset=utf-8"
    csv_text = exp_res.text
    assert "Audit ID" in csv_text
    assert "Action" in csv_text
