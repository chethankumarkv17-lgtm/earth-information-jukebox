"""
Automated Test Suite for Multi-Source Earth Science Datasets
2026 NASA Space Apps Challenge — EARTH JUKEBOX

Tests:
1. Master Dataset Catalog (/api/earth/catalog) with 9 preserved metadata fields
2. Domain Filtering (Temperature, Precipitation, Wind, Vegetation, Ocean, Atmosphere, Snow/Ice)
3. Live Multi-Source Point Telemetry (/api/earth/metrics/point) from NASA POWER & Open-Meteo ERA5
4. Quality Flags, Physical Units, and Missing Value Handling
"""

import sys
import os
from fastapi.testclient import TestClient

from app.main import app
from app.services.earth_data_service import VERIFIED_DATASET_CATALOG

client = TestClient(app)

print("\n======================================================================")
print("  NASA EARTH SCIENCE DATA SOURCES — AUTOMATED TEST SUITE")
print("======================================================================\n")

passed = 0
failed = 0

def test(name, fn):
    global passed, failed
    try:
        fn()
        print(f"  ✓ {name}")
        passed += 1
    except Exception as e:
        print(f"  ✗ {name}: {e}")
        failed += 1

# -----------------------------------------------------------------------------
# 1. GET /api/earth/catalog
# -----------------------------------------------------------------------------
print("[1] GET /api/earth/catalog (Master Scientific Catalog)")

def test_catalog_all():
    resp = client.get("/api/earth/catalog")
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
    data = resp.json()
    assert data["total_datasets"] >= 10, f"Expected >=10 datasets, got {data['total_datasets']}"
    
    required_fields = [
        "dataset_name",
        "source",
        "units",
        "geographic_coverage",
        "time_coverage",
        "resolution",
        "temporal_frequency",
        "processing_information",
        "data_limitations"
    ]
    
    domains_found = set()
    for d in data["datasets"]:
        domains_found.add(d["domain"])
        for f in required_fields:
            assert f in d and d[f], f"Dataset {d.get('id')} missing required metadata field: '{f}'"
            
    required_domains = {"temperature", "precipitation", "wind_speed", "vegetation", "ocean", "atmosphere", "snow_ice"}
    missing_domains = required_domains - domains_found
    assert not missing_domains, f"Missing required domains: {missing_domains}"

test("Catalog returns all 10 datasets with all 9 required metadata fields", test_catalog_all)

def test_catalog_filtering():
    resp = client.get("/api/earth/catalog?domain=temperature")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_datasets"] >= 2
    for d in data["datasets"]:
        assert d["domain"] == "temperature", f"Expected domain 'temperature', got {d['domain']}"

test("Catalog supports domain filtering (temperature)", test_catalog_filtering)


# -----------------------------------------------------------------------------
# 2. GET /api/earth/metrics/point
# -----------------------------------------------------------------------------
print("\n[2] GET /api/earth/metrics/point (Live Multi-Source In-Situ & Reanalysis)")

def test_point_metrics():
    # Query Shivamogga coordinates for May 2, 2024
    resp = client.get("/api/earth/metrics/point?lat=13.9299&lon=75.5681&date=2024-05-02")
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
    data = resp.json()
    
    # Coordinates & elevation
    assert "coordinates" in data
    assert abs(data["coordinates"]["latitude"] - 13.9299) < 0.001
    
    # Sources present
    assert "sources" in data
    assert "nasa_power" in data["sources"]
    assert "open_meteo_era5" in data["sources"]
    
    # Quality flags & missing data info
    assert "data_quality" in data
    dq = data["data_quality"]
    assert "valid_percentage" in dq
    assert "quality_flag" in dq
    assert dq["valid_measurements"] > 0
    
    # Scientific measurements with units
    meas = data["scientific_measurements"]
    assert "temperature" in meas
    assert "precipitation" in meas
    assert "wind_speed" in meas
    assert "atmospheric" in meas
    
    # Check physical units
    t_meas = meas["temperature"]
    assert t_meas["nasa_power_t2m"]["unit"] == "°C"
    assert t_meas["era5_temperature_mean"]["unit"] == "°C"
    
    p_meas = meas["precipitation"]
    assert "mm" in p_meas["era5_precipitation_sum"]["unit"]
    
    w_meas = meas["wind_speed"]
    assert "m/s" in w_meas["nasa_power_wind_speed_10m"]["unit"]
    assert "km/h" in w_meas["era5_wind_speed_max"]["unit"]

test("Point metrics returns calibrated measurements from NASA POWER & ERA5 with units and quality flags", test_point_metrics)

def test_point_metrics_invalid_coords():
    resp = client.get("/api/earth/metrics/point?lat=95.0&lon=75.5681")
    assert resp.status_code == 422, f"Expected 422 Unprocessable Entity, got {resp.status_code}"

test("Invalid latitude (>90) returns 422 validation error", test_point_metrics_invalid_coords)


# -----------------------------------------------------------------------------
# 3. Existing Endpoints Preservation
# -----------------------------------------------------------------------------
print("\n[3] Existing Endpoint Preservation")

def test_preservation():
    r1 = client.get("/health")
    assert r1.status_code == 200
    r2 = client.get("/api/earth/layers")
    assert r2.status_code == 200
    r3 = client.get("/api/earth/timeline?phenomenon=global_temperature")
    assert r3.status_code == 200

test("Health, Layers, and Timeline endpoints remain operational", test_preservation)

print("\n======================================================================")
print(f"  Results: {passed} passed, {failed} failed")
if failed == 0:
    print("  ✓ ALL EARTH DATA SOURCE TESTS PASSED SUCCESSFULLY!")
print("======================================================================\n")

if failed > 0:
    sys.exit(1)
