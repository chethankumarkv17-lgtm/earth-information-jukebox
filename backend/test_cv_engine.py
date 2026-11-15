import io
from PIL import Image
import numpy as np
from app.services.cv_analysis_engine import ComputerVisionEngine


def create_gradient_frame(w=400, h=300, offset=0):
    img = Image.new("RGB", (w, h))
    arr = np.zeros((h, w, 3), dtype=np.uint8)
    for y in range(h):
        for x in range(w):
            arr[y, x, 0] = int((x / w) * 200 + offset) % 256  # Red
            arr[y, x, 1] = int((y / h) * 180 + offset) % 256  # Green
            arr[y, x, 2] = int(((x + y) / (w + h)) * 220) % 256  # Blue
    return Image.fromarray(arr)


def test_cv_engine_comprehensive():
    # Create Frame 1 & Frame 2
    f1 = create_gradient_frame(400, 300, offset=10)
    buf1 = io.BytesIO()
    f1.save(buf1, format="PNG")
    bytes1 = buf1.getvalue()

    f2 = create_gradient_frame(400, 300, offset=50)
    buf2 = io.BytesIO()
    f2.save(buf2, format="PNG")
    bytes2 = buf2.getvalue()

    print("Running Computer Vision Analysis Engine...")
    res = ComputerVisionEngine.analyze_frame(
        image_bytes=bytes1,
        filename="earth_observation_frame_01.png",
        content_type="image/png",
        previous_frame_bytes=bytes2,
        calibration_scheme="NDVI",
    )

    assert res.success is True
    print("[1] RGB channel stats:", res.optical_features["rgb_statistics"]["dominant_channel"])
    assert "red" in res.optical_features["rgb_statistics"]
    assert "channel_correlations" in res.optical_features["rgb_statistics"]

    print("[2] Brightness metrics: BT.601 =", res.optical_features["brightness_metrics"]["standard_luminance_bt601"])
    assert res.optical_features["brightness_metrics"]["normalized_brightness"] <= 1.0

    print("[3] Dominant colors count:", len(res.optical_features["color_distribution"]["dominant_colors"]))
    assert len(res.optical_features["color_distribution"]["dominant_colors"]) == 5

    print("[4] Color distribution: Warmth =", res.optical_features["color_distribution"]["warmth_index"], "Entropy =", res.optical_features["color_distribution"]["color_entropy"])

    print("[5] Pixel intensity: 16-bin hist length =", len(res.optical_features["pixel_intensity"]["intensity_histogram_16"]))
    assert len(res.optical_features["pixel_intensity"]["intensity_histogram_16"]) == 16

    print("[6] Spatial distribution: Centroid =", res.optical_features["spatial_distribution"]["centroid_x_norm"], res.optical_features["spatial_distribution"]["centroid_y_norm"])
    assert "quadrants" in res.optical_features["spatial_distribution"]
    assert "laplacian_texture_energy" in res.optical_features["spatial_distribution"]

    print("[7] Regional zones count (3x3 grid):", len(res.regional_statistics))
    assert len(res.regional_statistics) == 9

    print("[8] Consecutive frame differences: MAD =", res.frame_difference.mean_absolute_difference, "MSE =", res.frame_difference.mean_squared_error)
    assert res.frame_difference.has_comparison is True
    assert res.frame_difference.motion_detected is True

    print("[9] Normalized feature vector (11D):", res.normalized_features.model_dump())
    assert 0.0 <= res.normalized_features.brightness <= 1.0
    assert 0.0 <= res.normalized_features.contrast <= 1.0

    print("[10] Scientific Calibration Distinction: Is Calibrated =", res.scientific_interpretation.is_calibrated)
    print("     Calibration Scheme =", res.scientific_interpretation.calibration_scheme)
    print("     Estimated Value =", res.scientific_interpretation.estimated_mean_physical_value, res.scientific_interpretation.measurement_unit)
    assert len(res.scientific_interpretation.disclaimers) >= 2

    print("\nALL 10 COMPUTER VISION ENGINE EXTRACTION TESTS PASSED!")


if __name__ == "__main__":
    test_cv_engine_comprehensive()
