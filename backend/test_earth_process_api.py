"""
Integration Test for Earth Data Processing API Endpoints
2026 NASA Space Apps Challenge
Tests:
1. GET /api/earth/process/demo (multi-domain and single domain)
2. POST /api/earth/process/timeseries (custom in-situ series with real zero and missing values)
3. POST /api/earth/process/upload (synthetic CSV with precipitation)
"""

import sys
import io
import json
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_api_process_demo():
    print("[API TEST 1] Testing GET /api/earth/process/demo...")
    resp = client.get("/api/earth/process/demo")
    assert resp.status_code == 200, f"Failed with {resp.status_code}: {resp.text}"
    data = resp.json()
    assert data["status"] == "success"
    assert data["total_domains"] == 5
    assert "temperature" in data["domains"]
    assert "precipitation" in data["domains"]
    assert "wind_speed" in data["domains"]
    assert "vegetation" in data["domains"]
    assert "ocean_sst" in data["domains"]

    # Verify precipitation preserves dry days
    precip = data["domains"]["precipitation"]
    assert precip["statistical_summary"]["dry_days_count"] > 0
    assert precip["statistical_summary"]["unit"] == "mm"
    print("  -> PASSED: /api/earth/process/demo returned all 5 domains with accurate statistics.")


def test_api_process_demo_single_domain():
    print("[API TEST 2] Testing GET /api/earth/process/demo?domain=wind_speed...")
    resp = client.get("/api/earth/process/demo?domain=wind_speed")
    assert resp.status_code == 200
    data = resp.json()
    assert data["selected_domain"] == "wind_speed"
    assert len(data["data"]["sonification_sequence"]) == 14
    print("  -> PASSED: Single domain filter returned wind speed sequence.")


def test_api_process_timeseries():
    print("[API TEST 3] Testing POST /api/earth/process/timeseries...")
    payload = {
        "domain": "precipitation",
        "series": [
            {"timestamp": "2024-06-01", "value": 0.0},
            {"timestamp": "2024-06-02", "value": None},
            {"timestamp": "2024-06-03", "value": 25.4},
        ],
        "location": {"latitude": -3.5, "longitude": -62.0, "region_name": "Amazon Basin"}
    }
    resp = client.post("/api/earth/process/timeseries", json=payload)
    assert resp.status_code == 200, f"Failed: {resp.text}"
    res = resp.json()
    assert res["domain"] == "precipitation"
    assert res["statistical_summary"]["dry_days_count"] == 1
    assert res["statistical_summary"]["rainy_days_count"] == 1
    assert res["statistical_summary"]["missing_points"] == 1
    assert len(res["sonification_sequence"]) == 3
    # Check that day 1 real zero has normalized_value == 0.0 and day 2 has None
    assert res["sonification_sequence"][0]["normalized_value"] == 0.0
    assert res["sonification_sequence"][1]["normalized_value"] is None
    print("  -> PASSED: Timeseries endpoint validated data and preserved dry zero vs missing.")


def test_api_process_upload_csv():
    print("[API TEST 4] Testing POST /api/earth/process/upload with CSV...")
    csv_bytes = b"Date,Rainfall_mm\n2024-07-01,0.0\n2024-07-02,15.2\n2024-07-03,3.4\n"
    files = {"file": ("rainfall_log.csv", csv_bytes, "text/csv")}
    data = {"domain": "precipitation"}
    resp = client.post("/api/earth/process/upload", files=files, data=data)
    assert resp.status_code == 200, f"Failed: {resp.text}"
    res = resp.json()
    assert res["file_format"] == "CSV"
    assert res["domain"] == "precipitation"
    assert res["total_frames"] == 3
    print("  -> PASSED: CSV upload processed and sonification sequence returned.")


if __name__ == "__main__":
    print("=================================================================")
    print("RUNNING FASTAPI EARTH DATA PROCESSING ENGINE INTEGRATION TESTS")
    print("=================================================================")
    test_api_process_demo()
    test_api_process_demo_single_domain()
    test_api_process_timeseries()
    test_api_process_upload_csv()
    print("=================================================================")
    print("ALL API INTEGRATION TESTS PASSED (100% SUCCESS)!")
    print("=================================================================")
