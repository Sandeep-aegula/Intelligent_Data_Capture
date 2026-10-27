import pytest
from fastapi import status


def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["status"] == "healthy"


def test_readiness_check(client):
    response = client.get("/ready")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["status"] == "ready"


def test_list_projects(client):
    response = client.get("/api/v1/projects")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 3
    codes = [p["code"] for p in data]
    assert "ABC-REF" in codes
    assert "NPP-002" in codes
    assert "CUU-003" in codes


def test_create_project_and_validation(client):
    # Success create
    payload = {
        "name": "Harbor Water Desalination Facility",
        "code": "HWD-004",
        "description": "Marine intake pipeline and reverse osmosis unit",
        "location": "Coastal Basin 2",
        "status": "In Progress",
    }
    create_res = client.post("/api/v1/projects", json=payload)
    assert create_res.status_code == status.HTTP_201_CREATED
    new_proj = create_res.json()
    assert new_proj["code"] == "HWD-004"

    # Duplicate code rejection
    dup_res = client.post("/api/v1/projects", json=payload)
    assert dup_res.status_code == status.HTTP_400_BAD_REQUEST

    # Retrieve created project
    get_res = client.get(f"/api/v1/projects/{new_proj['id']}")
    assert get_res.status_code == status.HTTP_200_OK
    assert get_res.json()["name"] == "Harbor Water Desalination Facility"


def test_cross_project_isolation(client):
    # Non-existent project returns 404
    res = client.get("/api/v1/projects/non-existent-id-999/dashboard")
    assert res.status_code == status.HTTP_404_NOT_FOUND


def test_project_archive_and_audit(client):
    # Create temp project
    payload = {
        "name": "Temporary Solar Array",
        "code": "TSA-999",
        "location": "Roof West",
    }
    c_res = client.post("/api/v1/projects", json=payload)
    p_id = c_res.json()["id"]

    # Archive project
    del_res = client.delete(f"/api/v1/projects/{p_id}")
    assert del_res.status_code == status.HTTP_200_OK

    # Verify audit log recorded creation and archive
    audit_res = client.get(f"/api/v1/projects/{p_id}/audit")
    assert audit_res.status_code == status.HTTP_200_OK
    audit_data = audit_res.json()
    assert audit_data["total_count"] >= 2
    actions = [item["action"] for item in audit_data["items"]]
    assert "Created" in actions
    assert "Archived" in actions
