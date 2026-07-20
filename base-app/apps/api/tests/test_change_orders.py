from tests.conftest import RIVERSIDE_ID


def test_list_change_orders(client):
    res = client.get(f"/projects/{RIVERSIDE_ID}/change-orders")
    assert res.status_code == 200
    orders = res.json()
    assert {o["reference"] for o in orders} == {
        "CO-001",
        "CO-002",
        "CO-003",
        "CO-004",
        "CO-005",
        "CO-006",
        "CO-007",
        "CO-008",
    }
    assert "costDelta" in orders[0]
    assert "scheduleDeltaDays" in orders[0]


def test_list_change_orders_filter_status(client):
    res = client.get(f"/projects/{RIVERSIDE_ID}/change-orders", params={"status": "approved"})
    assert res.status_code == 200
    orders = res.json()
    assert len(orders) == 4
    assert orders[0]["reference"] == "CO-001"
    assert orders[0]["costDelta"] == 2500000.0


def test_list_change_orders_unknown_project_404(client):
    res = client.get("/projects/nope/change-orders")
    assert res.status_code == 404


def test_list_change_orders_filter_invalid_status_422(client):
    res = client.get(
        f"/projects/{RIVERSIDE_ID}/change-orders",
        params={"status": "not-a-status"},
    )
    assert res.status_code == 422
