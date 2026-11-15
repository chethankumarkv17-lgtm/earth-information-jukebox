import io
import os
import re
import uuid
import hashlib
import base64
from datetime import datetime
from typing import Tuple, Dict, Any, List

import numpy as np
from PIL import Image, ImageOps
import cv2

# Set Pillow decompression bomb threshold (max 16 megapixels)
Image.MAX_IMAGE_PIXELS = 16_000_000

from app.core.config import settings
from app.schemas.image import (
    ImageMetadata,
    ColorBreakdown,
    ChannelStatistics,
    ImageProcessingResponse,
)


class ImageProcessingError(Exception):
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class ImageProcessor:
    MAGIC_SIGNATURES = {
        ".png": [b"\x89PNG\r\n\x1a\n"],
        ".jpg": [b"\xff\xd8\xff"],
        ".jpeg": [b"\xff\xd8\xff"],
        ".tif": [b"II*\x00", b"MM\x00*"],
        ".tiff": [b"II*\x00", b"MM\x00*"],
    }

    @classmethod
    def validate_magic_bytes(cls, file_bytes: bytes, ext: str) -> None:
        """
        Validates file signature / magic bytes against declared extension.
        Rejects disguised executables, scripts, or polyglots.
        """
        signatures = cls.MAGIC_SIGNATURES.get(ext.lower())
        if not signatures:
            return

        has_valid_signature = any(file_bytes.startswith(sig) for sig in signatures)
        if not has_valid_signature:
            raise ImageProcessingError(
                f"Invalid file signature. File contents do not match declared image format '{ext}'.",
                status_code=415,
            )

    @staticmethod
    def validate_file_metadata(filename: str, content_type: str, file_size: int) -> str:
        """
        Secure validation of file extension, MIME type, size bounds, and path traversal.
        Returns sanitized basename.
        """
        # 1. Path Traversal & Name Sanitization
        sanitized_filename = os.path.basename(filename).replace("\x00", "").strip()
        if not sanitized_filename or sanitized_filename in (".", ".."):
            raise ImageProcessingError("Invalid filename provided.", status_code=400)

        # 2. Size Validation
        if file_size > settings.MAX_FILE_SIZE_BYTES:
            max_mb = settings.MAX_FILE_SIZE_MB
            raise ImageProcessingError(
                f"File size exceeds maximum allowed limit of {max_mb} MB (received {file_size / (1024 * 1024):.2f} MB).",
                status_code=413,
            )
        
        if file_size == 0:
            raise ImageProcessingError("Uploaded file is empty (0 bytes).", status_code=400)

        # 3. Extension Validation
        ext = os.path.splitext(sanitized_filename)[1].lower()
        if ext not in settings.ALLOWED_EXTENSIONS:
            allowed = ", ".join(settings.ALLOWED_EXTENSIONS)
            raise ImageProcessingError(
                f"Unsupported file extension '{ext}'. Only {allowed} formats are supported.",
                status_code=415,
            )

        # 4. Content Type Validation
        if content_type.lower() not in settings.ALLOWED_MIME_TYPES:
            allowed_mimes = ", ".join(settings.ALLOWED_MIME_TYPES)
            raise ImageProcessingError(
                f"Unsupported MIME content-type '{content_type}'. Must be one of: {allowed_mimes}.",
                status_code=415,
            )

        return sanitized_filename

    @staticmethod
    def verify_image_integrity(file_bytes: bytes) -> Image.Image:
        """
        Verifies that file bytes constitute a valid, uncorrupted image using Pillow.
        Enforces pixel dimension bounds to protect against decompression bombs.
        """
        try:
            # First pass: Pillow verify
            stream = io.BytesIO(file_bytes)
            with Image.open(stream) as img:
                img.verify()
            
            # Reopen to load actual image data after verify
            stream.seek(0)
            loaded_img = Image.open(stream)
            
            # Check maximum pixel dimension
            pixel_count = loaded_img.size[0] * loaded_img.size[1]
            if pixel_count > 16_000_000:
                raise ImageProcessingError(
                    f"Image raster dimensions ({loaded_img.size[0]}x{loaded_img.size[1]} = {pixel_count:,} pixels) exceed safe processing ceiling of 16 megapixels.",
                    status_code=413,
                )

            loaded_img.load()
            return loaded_img
        except ImageProcessingError:
            raise
        except Exception as e:
            raise ImageProcessingError(
                f"Corrupted or invalid image structure: {str(e)}", status_code=400
            )

    @classmethod
    def process_image(
        cls, filename: str, content_type: str, file_bytes: bytes
    ) -> ImageProcessingResponse:
        """
        Complete processing workflow:
        1. Validate metadata and byte integrity.
        2. Keep original image completely unchanged.
        3. Resize large image to processing dimension to avoid expensive computations.
        4. Execute OpenCV channel and histogram analysis.
        5. Return comprehensive metadata and preview.
        """
        file_size = len(file_bytes)
        sanitized_name = cls.validate_file_metadata(filename, content_type, file_size)
        ext = os.path.splitext(sanitized_name)[1].lower() or ".png"

        # Validate magic bytes / file signature
        cls.validate_magic_bytes(file_bytes, ext)

        # Calculate SHA-256 hash for provenance
        sha256 = hashlib.sha256(file_bytes).hexdigest()

        # Integrity verification
        pil_image = cls.verify_image_integrity(file_bytes)

        # Extract Original Dimensions
        orig_width, orig_height = pil_image.size
        color_mode = pil_image.mode
        image_format = pil_image.format or ext.replace(".", "").upper()

        # Save Original Image Unchanged
        image_id = str(uuid.uuid4())
        original_filename = f"{image_id}_original{ext}"
        original_filepath = os.path.join(settings.UPLOAD_DIR, original_filename)
        
        with open(original_filepath, "wb") as f:
            f.write(file_bytes)

        # Standardize color mode for OpenCV (convert RGBA/Grayscale to RGB)
        if pil_image.mode != "RGB":
            rgb_image = pil_image.convert("RGB")
        else:
            rgb_image = pil_image

        # Image Resizing: Ensure large images are resized before expensive processing
        max_dim = settings.MAX_PROCESSING_DIMENSION
        is_resized = False
        proc_width, proc_height = orig_width, orig_height

        if orig_width > max_dim or orig_height > max_dim:
            is_resized = True
            scaling_factor = max_dim / max(orig_width, orig_height)
            proc_width = int(orig_width * scaling_factor)
            proc_height = int(orig_height * scaling_factor)
            processing_copy = rgb_image.resize((proc_width, proc_height), Image.Resampling.LANCZOS)
        else:
            processing_copy = rgb_image.copy()

        # Generate lightweight Thumbnail in Base64 for instant frontend preview
        thumb_copy = rgb_image.copy()
        thumb_copy.thumbnail((settings.THUMBNAIL_DIMENSION, settings.THUMBNAIL_DIMENSION), Image.Resampling.LANCZOS)
        thumb_buffer = io.BytesIO()
        thumb_copy.save(thumb_buffer, format="JPEG", quality=85)
        thumbnail_b64 = f"data:image/jpeg;base64,{base64.b64encode(thumb_buffer.getvalue()).decode('utf-8')}"

        # OpenCV Processing on the resized processing copy
        np_image = np.array(processing_copy)  # RGB array
        cv2_bgr = cv2.cvtColor(np_image, cv2.COLOR_RGB2BGR)

        # Split channels: B, G, R
        b_channel, g_channel, r_channel = cv2.split(cv2_bgr)

        # Channel Statistics
        def calc_stats(channel: np.ndarray) -> ChannelStatistics:
            return ChannelStatistics(
                mean=round(float(np.mean(channel)), 2),
                std_dev=round(float(np.std(channel)), 2),
                min=int(np.min(channel)),
                max=int(np.max(channel)),
            )

        r_stats = calc_stats(r_channel)
        g_stats = calc_stats(g_channel)
        b_stats = calc_stats(b_channel)

        # Determine dominant channel
        means = {"Red": r_stats.mean, "Green": g_stats.mean, "Blue": b_stats.mean}
        dominant_channel = max(means, key=means.get)

        # Grayscale & Histogram Analysis (256 bins)
        gray = cv2.cvtColor(cv2_bgr, cv2.COLOR_BGR2GRAY)
        hist = cv2.calcHist([gray], [0], None, [256], [0, 256])
        # Normalize histogram to 0 - 100 for clean visualization
        hist_flat = hist.flatten()
        max_hist_val = np.max(hist_flat) if np.max(hist_flat) > 0 else 1
        normalized_hist = [int((val / max_hist_val) * 100) for val in hist_flat]

        # Brightness index (0 - 100)
        brightness_index = round(float(np.mean(gray)) / 255.0 * 100.0, 2)

        # Estimated Vegetation Index (Green vs Red ratio proxy for NDVI)
        g_float = g_channel.astype(np.float32)
        r_float = r_channel.astype(np.float32)
        veg_index_map = (g_float - r_float) / (g_float + r_float + 1e-6)
        estimated_vegetation_index = round(float(np.clip(np.mean(veg_index_map), -1.0, 1.0)), 3)

        # Contrast ratio via standard deviation
        contrast_ratio = round(float(np.std(gray)) / 128.0, 2)

        # Edge Complexity & Spatial Entropy using OpenCV Canny
        edges = cv2.Canny(gray, 100, 200)
        edge_density = round(float(np.count_nonzero(edges)) / float(edges.size) * 100.0, 2)

        # Format original size
        if file_size < 1024:
            formatted_size = f"{file_size} B"
        elif file_size < 1024 * 1024:
            formatted_size = f"{file_size / 1024:.1f} KB"
        else:
            formatted_size = f"{file_size / (1024 * 1024):.2f} MB"

        # Aspect ratio computation
        import math
        gcd = math.gcd(orig_width, orig_height)
        aspect_ratio = f"{orig_width // gcd}:{orig_height // gcd}"

        # Construct Response
        metadata = ImageMetadata(
            filename=filename,
            original_size_bytes=file_size,
            formatted_size=formatted_size,
            content_type=content_type,
            format=image_format,
            color_mode=color_mode,
            original_width=orig_width,
            original_height=orig_height,
            aspect_ratio=aspect_ratio,
            is_resized_for_processing=is_resized,
            processed_width=proc_width,
            processed_height=proc_height,
            sha256_hash=sha256,
            color_channels=len(pil_image.getbands()),
        )

        color_analysis = ColorBreakdown(
            red=r_stats,
            green=g_stats,
            blue=b_stats,
            dominant_channel=dominant_channel,
            brightness_index=brightness_index,
            estimated_vegetation_index=estimated_vegetation_index,
            contrast_ratio=contrast_ratio,
            edge_complexity_entropy=edge_density,
        )

        return ImageProcessingResponse(
            success=True,
            message="Image successfully verified, resized, and processed.",
            image_id=image_id,
            metadata=metadata,
            color_analysis=color_analysis,
            histogram=normalized_hist,
            thumbnail_base64=thumbnail_b64,
            processed_timestamp=datetime.utcnow().isoformat() + "Z",
        )
