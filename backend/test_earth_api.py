"""
Automated Test Suite for NASA Earth Information Jukebox API
2026 NASA Space Apps Challenge
Run: cd backend && .\venv\Scripts\python test_earth_api.py
"""

import sys
import json
import time
import traceback


def run_tests():
    """Run all Earth API endpoint tests using FastAPI TestClient."""
    try:
        from fastapi.testclient import TestClient
        from app.main import app
    except ImportError as e:
        print(f"[IMPORT ERROR] {e}")
        print("Ensure you are running from the backend/ directory with the venv activated.")
        return False

    client = TestClient(app)
    passed = 0
    failed = 0
    results = []

    def test(name, fn):
        nonlocal passed, failed
        try:
            fn()
            passed += 1
            results.append(("PASS", name))
            print(f"  ✓ {name}")
        except Exception as e:
            failed += 1
            results.append(("FAIL", name, str(e)))
            print(f"  ✗ {name}")
            traceback.print_exc()

    print("\n" + "=" * 70)
    print("  NASA EARTH JUKEBOX API — Automated Test Suite")
    print("=" * 70)

    # ---------------------------------------------------------------
    # 1. GET /api/earth/layers
    # ---------------------------------------------------------------
    print("\n[1] GET /api/earth/layers")

    def test_layers():
        r = client.get("/api/earth/layers")
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        data = r.json()
        assert data["total_layers"] == 12, f"Expected 12 layers, got {data['total_layers']}"
        assert len(data["domains"]) == 6, f"Expected 6 domains, got {len(data['domains'])}"
        expected_domains = {"cloud_data", "ice_snow_data", "ocean_data", "satellite_imagery", "temperature_data", "vegetation_data"}
        assert set(data["domains"]) == expected_domains, f"Missing domains: {expected_domains - set(data['domains'])}"
        for layer in data["layers"]:
            assert "id" in layer and "title" in layer and "domain" in layer

    test("Layers endpoint returns 12 layers across 6 domains", test_layers)

    def test_layers_v1():
        r = client.get("/api/v1/earth/layers")
        assert r.status_code == 200
        assert r.json()["total_layers"] == 12

    test("Layers also accessible at /api/v1/earth/layers", test_layers_v1)

    # ---------------------------------------------------------------
    # 2. GET /api/earth/datasets
    # ---------------------------------------------------------------
    print("\n[2] GET /api/earth/datasets")

    def test_datasets():
        r = client.get("/api/earth/datasets")
        assert r.status_code == 200
        data = r.json()
        assert data["total_datasets"] == 7, f"Expected 7 datasets, got {data['total_datasets']}"
        ids = {d["id"] for d in data["datasets"]}
        assert "modis-terra-aqua" in ids
        assert "sentinel-2-msi" in ids
        assert "ghrsst-mur-sst" in ids
        for ds in data["datasets"]:
            assert ds["citation"], f"Dataset {ds['id']} missing citation"
            assert ds["access_url"].startswith("http"), f"Dataset {ds['id']} invalid URL"

    test("Datasets endpoint returns 7 satellite platforms with citations", test_datasets)

    # ---------------------------------------------------------------
    # 3. GET /api/earth/timeline
    # ---------------------------------------------------------------
    print("\n[3] GET /api/earth/timeline")

    def test_timeline_arctic():
        r = client.get("/api/earth/timeline?phenomenon=arctic_sea_ice")
        assert r.status_code == 200
        data = r.json()
        assert data["total_frames"] >= 10, f"Expected >=10 frames, got {data['total_frames']}"
        assert "Million" in data["frames"][0]["metric_unit"]
        for f in data["frames"]:
            assert 0.0 <= f["normalized_acoustic_pitch"] <= 1.0, f"Pitch out of range: {f['normalized_acoustic_pitch']}"
        assert "-12.2%" in data["macro_trend"]

    test("Arctic sea ice timeline with normalized pitches", test_timeline_arctic)

    def test_timeline_temperature():
        r = client.get("/api/earth/timeline?phenomenon=global_temperature&start_year=1880&end_year=2024")
        assert r.status_code == 200
        data = r.json()
        assert data["total_frames"] >= 10
        assert "Anomaly" in data["frames"][0]["metric_unit"]
        pitches = [f["normalized_acoustic_pitch"] for f in data["frames"]]
        assert pitches[-1] > pitches[0], "Temperature pitches should trend upward"

    test("Global temperature timeline with ascending pitch trend", test_timeline_temperature)

    def test_timeline_invalid():
        r = client.get("/api/earth/timeline?phenomenon=invalid_thing")
        assert r.status_code == 400

    test("Invalid phenomenon returns 400", test_timeline_invalid)

    # ---------------------------------------------------------------
    # 4. GET /api/earth/region
    # ---------------------------------------------------------------
    print("\n[4] GET /api/earth/region")

    def test_region_amazon():
        r = client.get("/api/earth/region?region_name=amazon_basin&zoom=3")
        assert r.status_code == 200
        data = r.json()
        assert data["domain"] == "vegetation_data"
        assert "mean_ndvi" in data["scientific_measurements"]
        ndvi = data["scientific_measurements"]["mean_ndvi"]
        assert ndvi["unit"].startswith("NDVI")
        assert data["data_quality"]["quality_flag"] in ("OPTIMAL", "GOOD", "DEGRADED")
        assert data["sonification_profile"]["base_frequency_hz"] > 0

    test("Amazon Basin vegetation analysis with NDVI + sonification", test_region_amazon)

    def test_region_greenland():
        r = client.get("/api/earth/region?region_name=greenland_ice&zoom=3")
        assert r.status_code == 200
        data = r.json()
        assert data["domain"] == "ice_snow_data"
        assert "sea_ice_concentration" in data["scientific_measurements"]
        assert "surface_albedo" in data["scientific_measurements"]

    test("Greenland ice sheet analysis with albedo + ice concentration", test_region_greenland)

    def test_region_custom_bbox():
        r = client.get("/api/earth/region?min_lat=35&min_lon=-5&max_lat=45&max_lon=10&zoom=3")
        assert r.status_code == 200
        data = r.json()
        assert data["coordinates"]["min_lat"] == 35.0
        assert data["metadata"]["source"] == "NASA Global Imagery Browse Services (GIBS)"

    test("Custom bounding box region analysis", test_region_custom_bbox)

    # ---------------------------------------------------------------
    # 5. GET /api/earth/imagery
    # ---------------------------------------------------------------
    print("\n[5] GET /api/earth/imagery")

    def test_imagery_json():
        r = client.get("/api/earth/imagery?lat=40.7&lon=-74.0&radius_km=100&zoom=3&format=json")
        assert r.status_code == 200
        data = r.json()
        assert data["status"] == "success"
        assert data["layer"] == "MODIS_Terra_CorrectedReflectance_TrueColor"
        assert data["image_base64"].startswith("data:image/")
        assert len(data["image_base64"]) > 1000, "Image base64 too small"

    test("Imagery JSON format returns base64 satellite image", test_imagery_json)

    def test_imagery_raw():
        r = client.get("/api/earth/imagery?lat=0&lon=0&zoom=3&format=raw")
        assert r.status_code == 200
        assert r.headers["content-type"].startswith("image/")
        assert len(r.content) > 500, "Raw image too small"

    test("Imagery raw format returns binary image stream", test_imagery_raw)

    def test_imagery_invalid_layer():
        r = client.get("/api/earth/imagery?layer=FAKE_LAYER_NAME")
        assert r.status_code == 400

    test("Invalid layer returns 400", test_imagery_invalid_layer)

    # ---------------------------------------------------------------
    # 6. GET /api/earth/sentinel
    # ---------------------------------------------------------------
    print("\n[6] GET /api/earth/sentinel")

    def test_sentinel_search():
        r = client.get("/api/earth/sentinel?min_lat=48&min_lon=2&max_lat=49&max_lon=3")
        assert r.status_code == 200
        data = r.json()
        assert "constellation" in data
        assert "Sentinel-2" in data["constellation"]
        assert data["bounding_box"]["min_lat"] == 48.0

    test("Sentinel-2 STAC search executes successfully", test_sentinel_search)

    # ---------------------------------------------------------------
    # 7. Existing endpoints still work
    # ---------------------------------------------------------------
    print("\n[7] Existing endpoint preservation")

    def test_health():
        r = client.get("/api/v1/health")
        assert r.status_code == 200
        assert r.json()["status"] == "online"

    test("Health endpoint still operational", test_health)

    def test_root():
        r = client.get("/")
        assert r.status_code == 200
        assert "EARTH JUKEBOX" in r.json()["message"]

    test("Root endpoint still operational", test_root)

    # ---------------------------------------------------------------
    # Summary
    # ---------------------------------------------------------------
    print("\n" + "=" * 70)
    total = passed + failed
    print(f"  Results: {passed}/{total} passed, {failed} failed")
    if failed == 0:
        print("  ✓ ALL TESTS PASSED — Earth API is production-ready")
    else:
        print(f"  ✗ {failed} test(s) failed — review errors above")
    print("=" * 70 + "\n")

    return failed == 0


if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
