from tests.conftest import METRO_ID, RIVERSIDE_ID


def test_list_projects(client):
    res = client.get("/projects")
    assert res.status_code == 200
    projects = res.json()
    assert len(projects) == 3
    assert {p["name"] for p in projects} == {
        "Riverside Hospital Expansion",
        "Metro Line 4 Extension",
        "Harbour Logistics Park",
    }
    # camelCase serialization from the contract
    assert "baselineCost" in projects[0]
    assert "plannedEndDate" in projects[0]


def test_list_projects_filter_by_region(client):
    res = client.get("/projects", params={"region": "UK"})
    assert res.status_code == 200
    assert [p["name"] for p in res.json()] == ["Riverside Hospital Expansion"]


def test_get_project_detail_kpis(client):
    res = client.get(f"/projects/{RIVERSIDE_ID}")
    assert res.status_code == 200
    body = res.json()
    assert body["baselineCost"] == 120000000.0
    # Riverside snapshots: actual 17.4m, baseline 16m -> variance 1.4m
    assert body["actualCostToDate"] == 17400000.0
    assert body["costVariance"] == 1400000.0
    # Worst milestone slippage: superstructure forecast 2026-04-15 vs planned 2026-02-28 = 46 days
    assert body["scheduleSlippageDays"] == 46
    # CO-002 is submitted (open); CO-001 approved (closed)
    assert body["openChangeOrderCount"] == 4


def test_get_project_404(client):
    res = client.get("/projects/does-not-exist")
    assert res.status_code == 404
    assert res.json()["detail"] == "Project not found"


def test_cost_trend_project_level(client):
    res = client.get(f"/projects/{METRO_ID}/cost-trend")
    assert res.status_code == 200
    series = res.json()
    assert len(series) == 3
    # ordered by period_month
    assert series[0]["periodMonth"] == "2024-06-01"
    assert series[0]["actualCost"] == 7800000.0


def test_milestones_ordered(client):
    res = client.get(f"/projects/{RIVERSIDE_ID}/milestones")
    assert res.status_code == 200
    milestones = res.json()
    assert [m["ragStatus"] for m in milestones] == ["amber", "red"]
