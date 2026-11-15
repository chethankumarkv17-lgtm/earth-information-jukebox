import io
from PIL import Image
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_api_status_endpoint():
    response = client.get("/api/v1/image/status")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "operational"
    assert "pillow_version" in data
    assert "opencv_version" in data
    print("PASS: /api/v1/image/status endpoint operational.")


def test_api_upload_endpoint():
    # Create test in-memory image
    img = Image.new("RGB", (500, 300), color=(80, 160, 240))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)

    files = {"file": ("satellite_tile.png", buf, "image/png")}
    response = client.post("/api/v1/image/upload", files=files)
    assert response.status_code == 200, f"Error: {response.text}"
    data = response.json()
    assert data["success"] is True
    assert data["metadata"]["original_width"] == 500
    assert data["metadata"]["original_height"] == 300
    assert data["color_analysis"]["dominant_channel"] == "Blue"
    assert "thumbnail_base64" in data
    image_id = data["image_id"]
    print("PASS: /api/v1/image/upload endpoint processed valid file successfully.")

    # Test removal endpoint
    del_res = client.delete(f"/api/v1/image/{image_id}")
    assert del_res.status_code == 200
    assert del_res.json()["success"] is True
    print("PASS: /api/v1/image/{image_id} deletion endpoint verified.")


def test_api_unsupported_format_rejected():
    files = {"file": ("invalid_script.sh", b"echo hello", "text/x-shellscript")}
    response = client.post("/api/v1/image/upload", files=files)
    assert response.status_code == 415
    print("PASS: API correctly rejects unsupported MIME/format with 415.")


if __name__ == "__main__":
    test_api_status_endpoint()
    test_api_upload_endpoint()
    test_api_unsupported_format_rejected()
    print("\nALL FASTAPI IMAGE ENDPOINT INTEGRATION TESTS PASSED!")
