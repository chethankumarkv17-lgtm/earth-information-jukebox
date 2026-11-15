from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from typing import Optional

from app.schemas.cv_analysis import (
    CVAnalysisResponse,
    FrameDifferenceResult,
)
from app.services.cv_analysis_engine import ComputerVisionEngine
from app.services.image_processor import ImageProcessor, ImageProcessingError

router = APIRouter(prefix="/cv", tags=["Computer Vision Analysis Engine"])


@router.post("/analyze", response_model=CVAnalysisResponse)
async def analyze_earth_frame(
    file: UploadFile = File(..., description="Earth observation visualization frame"),
    previous_frame: Optional[UploadFile] = File(None, description="Optional consecutive previous frame"),
    calibration_scheme: str = Form("None", description="Scientific legend calibration scheme ('None', 'NDVI', 'SST', 'CO2', 'ICE_ALTIMETRY', 'CUSTOM')"),
    custom_min: Optional[float] = Form(None),
    custom_max: Optional[float] = Form(None),
    custom_unit: Optional[str] = Form(None),
):
    """
    Comprehensive Computer Vision Analysis for Earth Visualizations:
    - RGB channel information & correlations
    - Standard & perceptual brightness
    - Dominant color clustering (OpenCV KMeans)
    - Color distribution (HSV, warmth, Shannon entropy)
    - Pixel intensity histograms (16 and 64 bins)
    - Spatial distribution (centroid of brightness, quadrants, Laplacian texture energy)
    - Regional image statistics (3x3 grid = 9 geographical zones)
    - Differences between consecutive frames (if previous_frame provided)
    - Normalized 11D feature vector for audio synthesis
    - Legend calibration for distinguishing optical artifacts from scientific measurements
    """
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Primary image frame is required.",
        )

    try:
        primary_bytes = await file.read()
        content_type = file.content_type or "image/png"

        # Validate primary file and magic signatures
        sanitized_filename = ImageProcessor.validate_file_metadata(file.filename, content_type, len(primary_bytes))
        ext = os.path.splitext(sanitized_filename)[1].lower()
        ImageProcessor.validate_magic_bytes(primary_bytes, ext)

        # Read optional previous frame
        prev_bytes = None
        if previous_frame and previous_frame.filename:
            prev_bytes = await previous_frame.read()
            if len(prev_bytes) > 0:
                prev_ctype = previous_frame.content_type or "image/png"
                sanitized_prev = ImageProcessor.validate_file_metadata(previous_frame.filename, prev_ctype, len(prev_bytes))
                prev_ext = os.path.splitext(sanitized_prev)[1].lower()
                ImageProcessor.validate_magic_bytes(prev_bytes, prev_ext)

        result = ComputerVisionEngine.analyze_frame(
            image_bytes=primary_bytes,
            filename=file.filename,
            content_type=content_type,
            previous_frame_bytes=prev_bytes,
            calibration_scheme=calibration_scheme,
            custom_min=custom_min,
            custom_max=custom_max,
            custom_unit=custom_unit,
        )
        return result

    except ImageProcessingError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Computer vision analysis engine error: {str(e)}",
        )


@router.get("/presets")
async def get_calibration_presets():
    """
    Returns verified scientific calibration presets for Earth observations.
    """
    return {
        "presets": [
            {
                "id": "None",
                "name": "Optical Display (Uncalibrated)",
                "description": "Raw RGB render without physical unit assumptions. Pure image-derived optical features.",
                "unit": "Pixel Luminance [0-255]",
                "default_min": 0,
                "default_max": 255,
            },
            {
                "id": "NDVI",
                "name": "NASA False-Color Vegetation Index (NDVI)",
                "description": "Normalized Difference Vegetation Index tracking photosynthetic canopy density.",
                "unit": "NDVI Ratio",
                "default_min": -0.20,
                "default_max": 1.00,
            },
            {
                "id": "SST",
                "name": "Sea Surface Temperature (SST)",
                "description": "Satellite thermal infrared ocean surface kinetic temperature.",
                "unit": "Degrees Celsius (°C)",
                "default_min": 0.0,
                "default_max": 35.0,
            },
            {
                "id": "CO2",
                "name": "Atmospheric Carbon Dioxide (XCO2)",
                "description": "Column-averaged dry air mole fraction of atmospheric carbon dioxide.",
                "unit": "Parts Per Million (ppm)",
                "default_min": 395.0,
                "default_max": 435.0,
            },
            {
                "id": "ICE_ALTIMETRY",
                "name": "Ice Surface Elevation / Freeboard",
                "description": "Cryospheric laser/radar altimetric sea ice freeboard thickness.",
                "unit": "Meters (m)",
                "default_min": 0.0,
                "default_max": 4.5,
            },
            {
                "id": "CUSTOM",
                "name": "Custom Legend Colormap Range",
                "description": "User provides minimum and maximum physical bounds matching the image's scientific colorbar.",
                "unit": "User Defined",
                "default_min": 0.0,
                "default_max": 100.0,
            },
        ]
    }
