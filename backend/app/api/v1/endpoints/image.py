import os
import re
import glob
from fastapi import APIRouter, UploadFile, File, HTTPException, status
from app.core.config import settings
from app.schemas.image import ImageProcessingResponse
from app.services.image_processor import ImageProcessor, ImageProcessingError

router = APIRouter(prefix="/image", tags=["Image Upload & Processing"])


@router.post("/upload", response_model=ImageProcessingResponse)
async def upload_and_process_image(file: UploadFile = File(...)):
    """
    Secure Image Upload & Processing Pipeline:
    - Validates file format (PNG, JPG, JPEG) and size (<= 15MB)
    - Verifies byte integrity to prevent malicious/corrupt files
    - Keeps original image completely unchanged in storage
    - Resizes large images to max processing dimensions before expensive analysis
    - Executes OpenCV channel, histogram, and spectral entropy decomposition
    """
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No filename provided in upload request.",
        )

    try:
        file_bytes = await file.read()
        content_type = file.content_type or "application/octet-stream"
        
        response = ImageProcessor.process_image(
            filename=file.filename,
            content_type=content_type,
            file_bytes=file_bytes,
        )
        return response

    except ImageProcessingError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        error_detail = f"Internal image processing failure: {str(e)}" if settings.DEBUG else "Internal image processing failure. Please try another image."
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=error_detail,
        )


@router.delete("/{image_id}")
async def remove_image(image_id: str):
    """
    Removes uploaded image files associated with image_id from server storage.
    Enforces strict identifier syntax and path traversal defenses.
    """
    # 1. Reject path traversal sequences, null bytes, and malicious characters
    if not re.match(r"^[a-zA-Z0-9_\-]+$", image_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image ID format. Only alphanumeric characters, dashes, and underscores are permitted.",
        )

    upload_dir_canonical = os.path.realpath(settings.UPLOAD_DIR)
    pattern = os.path.join(settings.UPLOAD_DIR, f"{image_id}*")
    matched_files = glob.glob(pattern)

    if not matched_files:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No image files found for ID '{image_id}'.",
        )

    deleted_count = 0
    for filepath in matched_files:
        canonical_filepath = os.path.realpath(filepath)
        # 2. Enforce directory boundary invariant
        if not canonical_filepath.startswith(upload_dir_canonical):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Security violation: Path traversal detected outside upload storage directory.",
            )

        try:
            if os.path.isfile(canonical_filepath):
                os.remove(canonical_filepath)
                deleted_count += 1
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to delete '{filepath}': {str(e)}",
            )

    return {
        "success": True,
        "message": f"Successfully removed {deleted_count} file(s) for image ID '{image_id}'.",
        "image_id": image_id,
    }


@router.get("/status")
async def get_processor_status():
    """
    Returns image processor operational specifications and libraries status.
    """
    import cv2
    import PIL
    import numpy as np

    return {
        "status": "operational",
        "pillow_version": PIL.__version__,
        "opencv_version": cv2.__version__,
        "numpy_version": np.__version__,
        "max_file_size_mb": settings.MAX_FILE_SIZE_MB,
        "max_processing_dimension": settings.MAX_PROCESSING_DIMENSION,
        "allowed_formats": settings.ALLOWED_EXTENSIONS,
    }
