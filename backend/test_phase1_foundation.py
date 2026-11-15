"""
PHASE 1: BACKEND FOUNDATION TEST SUITE
NASA Space Apps Challenge 2026

Tests:
1. GET / (Root discovery endpoint)
2. GET /health (Heartbeat status endpoint)
3. GET /api/earth/layers (NASA GIBS observation categories & layer specs)
4. Structured Error Handling (404 and validation)
5. CORS Headers Verification
6. OpenAPI Swagger Documentation (/docs, /openapi.json)
7. Existing API Preservation (/api/v1/health)
"""
import sys
import traceback


def run_phase1_tests():
    try:
        from fastapi.testclient import TestClient
        from app.main import app
    except ImportError as e:
        print(f"[IMPORT ERROR] {e}")
        return False

    client = TestClient(app)
    passed = 0
    failed = 0

    def assert_test(name, fn):
        nonlocal passed, failed
        try:
            fn()
            passed += 1
            print(f"  ✓ {name}")
        except Exception as e:
            failed += 1
            print(f"  ✗ {name}: {str(e)}")
            traceback.print_exc()

    print("\n" + "=" * 70)
    print("  PHASE 1: BACKEND FOUNDATION — TEST SUITE")
    print("=" * 70)

    # -----------------------------------------------------------------
    # Test 1: GET / (Root Endpoint)
    # -----------------------------------------------------------------
    print("\n[Test 1] GET / (Root Endpoint)")
    def test_root():
        res = client.get("/")
        assert res.status_code == 200, f"Expected 200, got {res.status_code}"
        data = res.json()
        assert "message" in data and "EARTH JUKEBOX" in data["message"]
        assert data["app"] == "EARTH JUKEBOX API"
        assert data["version"] == "1.0.0"
        assert data["docs_url"] == "/docs"
        assert data["health_url"] == "/health"
        assert "endpoints" in data
        assert data["endpoints"]["earth_layers"] == "/api/earth/layers"
    assert_test("Root endpoint returns structured JSON with docs and health links", test_root)

    # -----------------------------------------------------------------
    # Test 2: GET /health (Heartbeat Health Check)
    # -----------------------------------------------------------------
    print("\n[Test 2] GET /health (Health Check)")
    def test_health():
        res = client.get("/health")
        assert res.status_code == 200, f"Expected 200, got {res.status_code}"
        data = res.json()
        assert data["status"] == "online"
        assert data["app"] == "EARTH JUKEBOX API"
        assert data["version"] == "1.0.0"
        assert data["environment"] in ("development", "staging", "production")
        assert "timestamp" in data
    assert_test("Health endpoint returns status 'online' and ISO timestamp", test_health)

    # -----------------------------------------------------------------
    # Test 3: GET /api/earth/layers (NASA GIBS Layers & Categories)
    # -----------------------------------------------------------------
    print("\n[Test 3] GET /api/earth/layers (NASA Observation Layers)")
    def test_layers():
        res = client.get("/api/earth/layers")
        assert res.status_code == 200, f"Expected 200, got {res.status_code}"
        data = res.json()
        assert data["status"] == "success"
        assert data["total_layers"] == 12
        assert len(data["domains"]) == 6
        expected_domains = {
            "satellite_imagery",
            "ocean_data",
            "temperature_data",
            "cloud_data",
            "vegetation_data",
            "ice_snow_data"
        }
        assert set(data["domains"]) == expected_domains
        # Categories check
        assert len(data["categories"]) == 6
        cat_ids = [c["id"] for c in data["categories"]]
        assert "satellite_imagery" in cat_ids
        assert "vegetation_data" in cat_ids
        for cat in data["categories"]:
            assert cat["name"]
            assert cat["description"]
            assert cat["total_layers"] > 0
            assert len(cat["sample_layers"]) > 0
        # Layers specifications check
        assert len(data["layers"]) == 12
        for layer in data["layers"]:
            assert layer["id"]
            assert layer["title"]
            assert layer["domain"] in expected_domains
            assert layer["format"] in ("jpg", "png")
            assert layer["matrix_set"] in ("250m", "1km", "2km")
            assert layer["sensor"]
            assert layer["description"]
        # Provenance check (authenticity statement, no fabricated data)
        assert "no fabricated observations" in data["data_provenance"].lower()
    assert_test("Layers endpoint returns 12 verified layers across 6 scientific categories", test_layers)

    # -----------------------------------------------------------------
    # Test 4: Structured Error Handling
    # -----------------------------------------------------------------
    print("\n[Test 4] Structured Error Handling")
    def test_404_error():
        res = client.get("/nonexistent-endpoint-404")
        assert res.status_code == 404
        data = res.json()
        assert data["status"] == "error"
        assert data["code"] == 404
        assert "message" in data
        assert data["path"] == "/nonexistent-endpoint-404"
    assert_test("404 errors return uniform structured JSON with status and path", test_404_error)

    # -----------------------------------------------------------------
    # Test 5: OpenAPI Swagger UI
    # -----------------------------------------------------------------
    print("\n[Test 5] OpenAPI Swagger Documentation")
    def test_swagger_docs():
        res_docs = client.get("/docs")
        assert res_docs.status_code == 200
        assert "swagger-ui" in res_docs.text.lower()

        res_openapi = client.get("/openapi.json")
        assert res_openapi.status_code == 200
        schema = res_openapi.json()
        assert "paths" in schema
        assert "/" in schema["paths"]
        assert "/health" in schema["paths"]
        assert "/api/earth/layers" in schema["paths"]
    assert_test("Swagger UI (/docs) and OpenAPI JSON (/openapi.json) are functional", test_swagger_docs)

    # -----------------------------------------------------------------
    # Test 6: CORS Configuration
    # -----------------------------------------------------------------
    print("\n[Test 6] CORS Configuration")
    def test_cors():
        headers = {
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "GET",
        }
        res = client.options("/api/earth/layers", headers=headers)
        assert res.status_code == 200
        assert res.headers.get("access-control-allow-origin") == "http://localhost:5173"
    assert_test("CORS allows origin http://localhost:5173 with proper headers", test_cors)

    # -----------------------------------------------------------------
    # Test 7: Existing API Preservation
    # -----------------------------------------------------------------
    print("\n[Test 7] Existing Frontend & API V1 Preservation")
    def test_v1_preservation():
        res_health = client.get("/api/v1/health")
        assert res_health.status_code == 200
        assert res_health.json()["status"] == "online"

        res_presets = client.get("/api/v1/sequence/presets")
        assert res_presets.status_code == 200
        assert len(res_presets.json()["presets"]) >= 3
    assert_test("Existing /api/v1 endpoints preserved without breaking frontend", test_v1_preservation)

    # -----------------------------------------------------------------
    # Summary
    # -----------------------------------------------------------------
    print("\n" + "=" * 70)
    total = passed + failed
    print(f"  Phase 1 Results: {passed}/{total} Passed, {failed} Failed")
    if failed == 0:
        print("  ✓ ALL PHASE 1 FOUNDATION TESTS PASSED SUCCESSFULLY!")
    else:
        print(f"  ✗ {failed} test(s) failed.")
    print("=" * 70 + "\n")

    return failed == 0


if __name__ == "__main__":
    success = run_phase1_tests()
    sys.exit(0 if success else 1)
