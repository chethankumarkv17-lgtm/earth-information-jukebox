import io
import os
from PIL import Image
import numpy as np
from app.services.image_processor import ImageProcessor, ImageProcessingError
from app.core.config import settings


def create_test_image(width=600, height=400, color=(100, 200, 50), fmt="PNG"):
    img = Image.new("RGB", (width, height), color=color)
    buf = io.BytesIO()
    img.save(buf, format=fmt)
    return buf.getvalue()


def test_valid_image_processing():
    img_bytes = create_test_image(800, 600, color=(50, 180, 220), fmt="PNG")
    res = ImageProcessor.process_image(
        filename="test_satellite.png",
        content_type="image/png",
        file_bytes=img_bytes,
    )

    assert res.success is True
    assert res.metadata.original_width == 800
    assert res.metadata.original_height == 600
    assert res.metadata.is_resized_for_processing is False
    assert res.metadata.format == "PNG"
    assert res.color_analysis.dominant_channel == "Blue"
    assert len(res.histogram) == 256
    assert res.thumbnail_base64.startswith("data:image/jpeg;base64,")

    # Check original image preserved unchanged in upload dir
    orig_path = os.path.join(settings.UPLOAD_DIR, f"{res.image_id}_original.png")
    assert os.path.exists(orig_path)
    with open(orig_path, "rb") as f:
        saved_bytes = f.read()
    assert saved_bytes == img_bytes
    print("PASS: Valid image processing and original file preservation verified.")


def test_large_image_resizing():
    # 2400 x 1600 image (exceeds MAX_PROCESSING_DIMENSION 1200)
    large_bytes = create_test_image(2400, 1600, color=(30, 220, 80), fmt="JPEG")
    res = ImageProcessor.process_image(
        filename="large_landsat_scene.jpg",
        content_type="image/jpeg",
        file_bytes=large_bytes,
    )

    assert res.metadata.original_width == 2400
    assert res.metadata.original_height == 1600
    assert res.metadata.is_resized_for_processing is True
    assert res.metadata.processed_width == 1200
    assert res.metadata.processed_height == 800
    print("PASS: Large image downsampling before expensive processing verified.")


def test_unsupported_format():
    try:
        ImageProcessor.validate_file_metadata("malicious.gif", "image/gif", 1024)
        assert False, "Should have raised ImageProcessingError"
    except ImageProcessingError as e:
        assert e.status_code == 415
        assert "Unsupported file extension" in e.message
        print("PASS: Unsupported extension rejection verified.")


def test_oversized_file():
    huge_size = 16 * 1024 * 1024  # 16 MB (> 15 MB)
    try:
        ImageProcessor.validate_file_metadata("huge_raw.png", "image/png", huge_size)
        assert False, "Should have raised ImageProcessingError"
    except ImageProcessingError as e:
        assert e.status_code == 413
        assert "exceeds maximum allowed limit" in e.message
        print("PASS: Oversized file validation verified.")


def test_corrupted_file():
    corrupted_bytes = b"NOT_A_VALID_IMAGE_HEADER_BYTES_RANDOM_DATA"
    try:
        ImageProcessor.verify_image_integrity(corrupted_bytes)
        assert False, "Should have raised ImageProcessingError"
    except ImageProcessingError as e:
        assert e.status_code == 400
        assert "Corrupted or invalid image structure" in e.message
        print("PASS: Corrupted image byte rejection verified.")


if __name__ == "__main__":
    test_valid_image_processing()
    test_large_image_resizing()
    test_unsupported_format()
    test_oversized_file()
    test_corrupted_file()
    print("\nALL IMAGE PROCESSOR BACKEND TESTS PASSED SUCCESSFULLY!")
