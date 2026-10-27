import io
import pytest
from fastapi import status


def get_demo_project_id(client):
    res = client.get("/api/v1/projects")
    assert res.status_code == status.HTTP_200_OK
    projects = res.json()
    for p in projects:
        if p["code"] == "ABC-REF":
            return p["id"]
    return projects[0]["id"]


def test_schedule_summary_and_tree(client):
    p_id = get_demo_project_id(client)

    summary_res = client.get(f"/api/v1/projects/{p_id}/schedule")
    assert summary_res.status_code == status.HTTP_200_OK
    summary = summary_res.json()
    assert summary["total_activities"] >= 7
    assert summary["active_version"] is not None

    tree_res = client.get(f"/api/v1/projects/{p_id}/schedule/tree")
    assert tree_res.status_code == status.HTTP_200_OK
    tree = tree_res.json()
    assert len(tree) >= 1
    root = tree[0]
    assert root["level"] == "L1"
    assert len(root["children"]) >= 1


def test_schedule_activities_filtering(client):
    p_id = get_demo_project_id(client)

    # Filter by level L6
    l6_res = client.get(f"/api/v1/projects/{p_id}/schedule/activities?level=L6")
    assert l6_res.status_code == status.HTTP_200_OK
    l6_acts = l6_res.json()
    assert len(l6_acts) >= 3
    for act in l6_acts:
        assert act["level"] == "L6"


def test_schedule_activity_update(client):
    p_id = get_demo_project_id(client)
    acts_res = client.get(f"/api/v1/projects/{p_id}/schedule/activities?level=L6")
    act_id = acts_res.json()[0]["id"]

    patch_res = client.patch(
        f"/api/v1/projects/{p_id}/schedule/activities/{act_id}",
        json={"percent_complete": 75.0, "status": "In Progress"},
    )
    assert patch_res.status_code == status.HTTP_200_OK
    updated = patch_res.json()
    assert updated["progress"] == 75.0


def test_staged_schedule_import_workflow(client):
    p_id = get_demo_project_id(client)

    # 1. Upload CSV
    csv_content = (
        "activity_code,activity_name,level,parent_code,discipline,quantity,unit\n"
        "WBS-IMPORT-L1,Imported Scope L1,L1,,General,,\n"
        "WBS-IMPORT-L2,Imported Piping L2,L2,WBS-IMPORT-L1,Piping,,\n"
        "ACT-IMP-101,Install Cooling Pipe,L6,WBS-IMPORT-L2,Piping,500,Meters\n"
    )
    files = {"file": ("test_schedule.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")}
    upload_res = client.post(f"/api/v1/projects/{p_id}/schedule/imports", files=files)
    assert upload_res.status_code == status.HTTP_201_CREATED
    import_data = upload_res.json()
    import_id = import_data["import_id"]
    assert import_data["total_rows"] == 3

    # 2. Preview
    prev_res = client.get(f"/api/v1/projects/{p_id}/schedule/imports/{import_id}")
    assert prev_res.status_code == status.HTTP_200_OK
    preview = prev_res.json()
    assert preview["total_rows"] == 3
    assert len(preview["sample_rows"]) == 3

    # 3. Validate
    val_res = client.post(f"/api/v1/projects/{p_id}/schedule/imports/{import_id}/validate")
    assert val_res.status_code == status.HTTP_200_OK
    val_data = val_res.json()
    assert val_data["is_valid"] is True
    assert val_data["error_count"] == 0

    # 4. Commit
    commit_payload = {"version_name": "Revision 2 Imported Baseline"}
    com_res = client.post(f"/api/v1/projects/{p_id}/schedule/imports/{import_id}/commit", json=commit_payload)
    assert com_res.status_code == status.HTTP_201_CREATED
    assert com_res.json()["name"] == "Revision 2 Imported Baseline"


def test_staged_schedule_import_duplicate_code_validation(client):
    p_id = get_demo_project_id(client)

    # CSV with duplicate activity code
    bad_csv = (
        "activity_code,activity_name,level,parent_code\n"
        "DUP-001,Task One,L1,\n"
        "DUP-001,Duplicate Task One,L2,DUP-001\n"
    )
    files = {"file": ("dup_schedule.csv", io.BytesIO(bad_csv.encode("utf-8")), "text/csv")}
    upload_res = client.post(f"/api/v1/projects/{p_id}/schedule/imports", files=files)
    import_id = upload_res.json()["import_id"]

    val_res = client.post(f"/api/v1/projects/{p_id}/schedule/imports/{import_id}/validate")
    assert val_res.status_code == status.HTTP_200_OK
    val_data = val_res.json()
    assert val_data["is_valid"] is False
    assert val_data["error_count"] >= 1
    err_fields = [e["field"] for e in val_data["errors"]]
    assert "activity_code" in err_fields
