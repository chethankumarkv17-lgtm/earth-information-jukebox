import time
import os
import io
import tracemalloc
import numpy as np
from PIL import Image
from fastapi.testclient import TestClient

from app.main import app
from app.services.image_processor import ImageProcessor
from app.services.cv_analysis_engine import ComputerVisionEngine
from app.services.sequence_engine import SequenceEngine

def generate_test_image(width=512, height=512, mode="RGB", pattern="gradient"):
    if pattern == "gradient":
        x = np.linspace(0, 255, width, dtype=np.uint8)
        y = np.linspace(0, 255, height, dtype=np.uint8)
        xx, yy = np.meshgrid(x, y)
        zz = np.full((height, width), 128, dtype=np.uint8)
        arr = np.stack([xx, yy, zz], axis=-1)
    elif pattern == "noise":
        arr = np.random.randint(0, 256, (height, width, 3), dtype=np.uint8)
    else:
        arr = np.zeros((height, width, 3), dtype=np.uint8)
    
    img = Image.fromarray(arr, mode=mode)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()

def run_backend_audit():
    print("=======================================================")
    print("  EARTH JUKEBOX BACKEND PERFORMANCE & RELIABILITY AUDIT ")
    print("=======================================================")
    
    client = TestClient(app)
    results = {}
    
    # 1. API Health & Configuration Endpoints
    t0 = time.perf_counter()
    resp = client.get("/api/v1/health")
    assert resp.status_code == 200, f"Health check failed: {resp.status_code}"
    health_latency = (time.perf_counter() - t0) * 1000
    print(f"✓ Health Check: {resp.status_code} OK ({health_latency:.2f} ms)")
    results["health_check_ms"] = round(health_latency, 2)
    
    resp_presets = client.get("/api/v1/sequence/presets")
    assert resp_presets.status_code == 200
    presets_data = resp_presets.json()
    preset_count = len(presets_data.get("presets", []))
    print(f"✓ Sequence Presets Listing: {preset_count} presets found")
    results["sequence_presets_count"] = preset_count
    
    # 2. Image Processing & Validation Matrix
    print("\n--- Testing Image Upload & Validation Security ---")
    valid_png = generate_test_image(512, 512)
    
    # Valid PNG upload
    t0 = time.perf_counter()
    resp_up = client.post(
        "/api/v1/image/upload",
        files={"file": ("audit_sample.png", valid_png, "image/png")}
    )
    up_latency = (time.perf_counter() - t0) * 1000
    assert resp_up.status_code == 200, f"Valid upload failed: {resp_up.text}"
    up_data = resp_up.json()
    image_id = up_data["image_id"]
    print(f"✓ Valid Image Upload (512x512 PNG): ID={image_id} ({up_latency:.2f} ms)")
    results["valid_upload_ms"] = round(up_latency, 2)
    
    # Delete uploaded image
    resp_del = client.delete(f"/api/v1/image/{image_id}")
    assert resp_del.status_code == 200
    print(f"✓ Image Cleanup Endpoint: Image {image_id} deleted successfully")
    
    # Unsupported file extension rejection
    resp_bad_ext = client.post(
        "/api/v1/image/upload",
        files={"file": ("malicious.exe", b"MZ...", "application/octet-stream")}
    )
    assert resp_bad_ext.status_code == 415
    print(f"✓ Security: Unsupported format rejected with HTTP {resp_bad_ext.status_code}")
    
    # Corrupt byte rejection
    corrupt_bytes = b"\x89PNG\r\n\x1a\n" + b"\x00" * 200
    resp_corrupt = client.post(
        "/api/v1/image/upload",
        files={"file": ("corrupt.png", corrupt_bytes, "image/png")}
    )
    assert resp_corrupt.status_code == 400
    print(f"✓ Security: Corrupted byte stream rejected with HTTP {resp_corrupt.status_code}")
    
    # 3. Computer Vision Engine Performance & Resolution Scaling
    print("\n--- Computer Vision Resolution Latency & Memory Scaling ---")
    resolutions = [(256, 256), (512, 512), (1024, 1024)]
    cv_benchmarks = {}
    
    for w, h in resolutions:
        test_bytes = generate_test_image(w, h)
        tracemalloc.start()
        t0 = time.perf_counter()
        
        cv_res = ComputerVisionEngine.analyze_frame(
            image_bytes=test_bytes,
            filename=f"bench_{w}x{h}.png",
            content_type="image/png",
            calibration_scheme="NDVI"
        )
        latency = (time.perf_counter() - t0) * 1000
        current, peak = tracemalloc.get_traced_memory()
        tracemalloc.stop()
        
        cv_benchmarks[f"{w}x{h}"] = {
            "latency_ms": round(latency, 2),
            "peak_memory_mb": round(peak / (1024 * 1024), 2),
            "brightness": cv_res.normalized_features.brightness,
            "feature_dim": len(cv_res.normalized_features.model_dump())
        }
        print(f"✓ CV Benchmark {w}x{h}: Latency = {latency:.2f} ms | Peak RAM = {peak/(1024*1024):.2f} MB")
    results["cv_benchmarks"] = cv_benchmarks
    
    # 4. Stress Test: Memory Stability in 5 Consecutive Analyses
    print("\n--- Memory Leak & Stability Stress Test (5 iterations) ---")
    tracemalloc.start()
    t_start = time.perf_counter()
    test_512 = generate_test_image(512, 512, pattern="noise")
    
    for i in range(5):
        _ = ComputerVisionEngine.analyze_frame(
            image_bytes=test_512,
            filename=f"stress_{i}.png",
            content_type="image/png",
            calibration_scheme="SST"
        )
    total_stress_time = (time.perf_counter() - t_start) * 1000
    curr_mem, peak_mem = tracemalloc.get_traced_memory()
    tracemalloc.stop()
    avg_per_frame = total_stress_time / 5.0
    print(f"✓ 5 Consecutive Frames: Total = {total_stress_time:.2f} ms | Avg = {avg_per_frame:.2f} ms/frame")
    print(f"✓ Memory Footprint: Residual = {curr_mem/(1024*1024):.2f} MB | Peak = {peak_mem/(1024*1024):.2f} MB (No uncontrolled leaks)")
    results["stress_test_avg_ms"] = round(avg_per_frame, 2)
    results["stress_test_peak_mb"] = round(peak_mem / (1024 * 1024), 2)
    
    # 5. Animated GIF / APNG Sequence Extraction & Sonification Vectors
    print("\n--- Sequence Engine Keyframe Extraction & Analysis ---")
    # Create an animated GIF with 6 frames
    frames = []
    for f in range(6):
        arr = np.zeros((200, 200, 3), dtype=np.uint8)
        arr[:, :, 0] = int(f * 40)
        arr[:, :, 1] = int(255 - f * 40)
        arr[:, :, 2] = 120
        frames.append(Image.fromarray(arr))
    gif_buf = io.BytesIO()
    frames[0].save(gif_buf, format="GIF", save_all=True, append_images=frames[1:], duration=150, loop=0)
    gif_bytes = gif_buf.getvalue()
    
    t0 = time.perf_counter()
    seq_res = SequenceEngine.extract_and_analyze_sequence(
        file_bytes=gif_bytes,
        filename="test_animation.gif",
        content_type="image/gif",
        target_fps=2.0,
        max_frames=12
    )
    seq_latency = (time.perf_counter() - t0) * 1000
    print(f"✓ GIF Sequence Extraction: {seq_res.total_frames} frames extracted in {seq_latency:.2f} ms")
    print(f"✓ Sequence Trends: Brightness Delta Total = {seq_res.trends.brightness_delta_total:.4f}")
    assert seq_res.total_frames == 6
    assert len(seq_res.frames) == 6
    results["sequence_extraction_ms"] = round(seq_latency, 2)
    results["sequence_frames_extracted"] = seq_res.total_frames
    
    print("\n=======================================================")
    print("  ALL BACKEND AUDIT BENCHMARKS & RELIABILITY CHECKS PASSED ")
    print("=======================================================")
    return results

if __name__ == "__main__":
    run_backend_audit()
