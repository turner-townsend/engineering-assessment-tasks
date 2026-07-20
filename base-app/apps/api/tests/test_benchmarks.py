from app.domain import calculations as calc
from tests.conftest import METRO_ID, RIVERSIDE_ID


def test_benchmark_position_buckets():
    assert calc.benchmark_position(10, 20, 30, 40) == "below_p25"
    assert calc.benchmark_position(25, 20, 30, 40) == "p25_to_median"
    assert calc.benchmark_position(35, 20, 30, 40) == "median_to_p75"
    assert calc.benchmark_position(45, 20, 30, 40) == "above_p75"


def test_riverside_benchmarks(client):
    res = client.get(f"/projects/{RIVERSIDE_ID}/benchmarks")
    assert res.status_code == 200
    by_key = {b["metricKey"]: b for b in res.json()}
    # 120m / 20000 m2 = 6000 -> between p25 (5800) and median (6500)
    assert by_key["cost_per_m2"]["projectValue"] == 6000.0
    assert by_key["cost_per_m2"]["position"] == "p25_to_median"
    # 120m / 240 beds = 500000 -> between median (450k) and p75 (520k)
    assert by_key["cost_per_bed"]["projectValue"] == 500000.0
    assert by_key["cost_per_bed"]["position"] == "median_to_p75"


def test_metro_benchmark_above_p75(client):
    res = client.get(f"/projects/{METRO_ID}/benchmarks")
    body = {b["metricKey"]: b for b in res.json()}
    # 450m / 4 km = 112.5m -> above p75 (110m)
    assert body["cost_per_km"]["projectValue"] == 112500000.0
    assert body["cost_per_km"]["position"] == "above_p75"
