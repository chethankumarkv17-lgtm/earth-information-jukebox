from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from typing import Optional, List, Dict, Any

from app.schemas.sequence import (
    SequenceAnalysisResponse,
)
from app.services.sequence_engine import SequenceEngine
from app.services.image_processor import ImageProcessor, ImageProcessingError

router = APIRouter(prefix="/sequence", tags=["Earth Visualization Sequence Engine"])


@router.post("/analyze", response_model=SequenceAnalysisResponse)
async def analyze_sequence(
    file: UploadFile = File(..., description="Animated GIF, APNG, or Earth sequence frame series"),
    target_fps: float = Form(3.0, description="Target playback frame rate"),
    max_frames: int = Form(36, description="Maximum keyframes to extract for smooth laptop performance"),
):
    """
    Extracts frames from an animated Earth visualization (GIF/APNG) or time-series,
    downsamples and analyzes each frame sequentially, and generates normalized
    feature vectors and macro planetary trends for synchronized sonification.
    """
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Valid sequence file is required.",
        )

    try:
        content_bytes = await file.read()
        content_type = file.content_type or "image/gif"

        # Validate maximum size (up to 25MB for multi-frame animated sequences)
        if len(content_bytes) > 25 * 1024 * 1024:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="Animated sequence exceeds 25MB limit. Please upload an optimized file.",
            )

        result = SequenceEngine.extract_and_analyze_sequence(
            file_bytes=content_bytes,
            filename=file.filename,
            content_type=content_type,
            target_fps=target_fps,
            max_frames=max_frames,
        )
        return result

    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Sequence extraction and analysis error: {str(e)}",
        )


@router.get("/presets")
async def list_sequence_presets():
    """
    Returns the list of authentic curated NASA Earth visualization time-series presets.
    """
    return {
        "presets": [
            {
                "id": "arctic_sea_ice",
                "title": "Arctic Sea Ice Minimum Retreat (1979 - 2024)",
                "mission": "NASA SVS / NSIDC Cryospheric Altimetry",
                "phenomenon": "Decadal polar ice pack shrinkage: high-albedo white ice melts into dark open ocean.",
                "duration": "6.67s (20 frames @ 3 fps)",
                "sonic_narrative": "Shimmering high-frequency ice arpeggio glides into deep, resonant oceanic sub-bass.",
                "features": {
                    "primary_driver": "Brightness drop (-48%) & hue transition to navy indigo",
                    "scale": "Major Pentatonic → Dorian Modal",
                    "panning": "Central Arctic Convergence"
                }
            },
            {
                "id": "temperature_anomaly",
                "title": "Global Surface Temperature Anomaly Decade Sweep (1880 - 2024)",
                "mission": "NASA GISS GISTEMP v4 Climate Telemetry",
                "phenomenon": "Chromatic warming transition from 1880 cool blue anomalies to 2020s extreme amber/red.",
                "duration": "6.00s (18 frames @ 3 fps)",
                "sonic_narrative": "Fundamental root note smoothly ascends the chromatic circle as warmth index climbs to 92%.",
                "features": {
                    "primary_driver": "Hue migration (210° Cool Blue → 15° Crimson Red)",
                    "scale": "Lydian Modal → Phrygian Dominant",
                    "panning": "Northern Polar Amplification"
                }
            },
            {
                "id": "amazon_phenology",
                "title": "Amazon Rainforest Seasonal Phenology & Drought Cycle",
                "mission": "NASA Terra / Aqua MODIS (NDVI Vegetation Index)",
                "phenomenon": "Seasonal canopy oscillation: wet-season green flush vs dry-season logging roads and fires.",
                "duration": "6.00s (12 frames @ 2 fps)",
                "sonic_narrative": "Dry season edge density spikes trigger rapid, syncopated 1/16th-note rhythmic subdivisions.",
                "features": {
                    "primary_driver": "Edge density surge (12% → 38%) & NDVI green-to-ochre drift",
                    "scale": "Major Pentatonic",
                    "panning": "Equatorial River Basin"
                }
            },
            {
                "id": "el_nino_sst",
                "title": "Pacific El Niño Thermal Warm Pool Migration",
                "mission": "NOAA / NASA OISST Satellite Telemetry",
                "phenomenon": "Equatorial sea surface temperature thermal tongue surges from Western Pacific to South America.",
                "duration": "5.33s (16 frames @ 3 fps)",
                "sonic_narrative": "Spatial centroid sweep causes the entire audio soundscape to pan audibly from Left to Right.",
                "features": {
                    "primary_driver": "Centroid X shift (0.22 West → 0.81 East)",
                    "scale": "Dorian Modal",
                    "panning": "Dynamic Left-to-Right Stereo Sweep"
                }
            }
        ]
    }


@router.get("/preset/{preset_id}", response_model=SequenceAnalysisResponse)
async def get_sequence_preset(preset_id: str):
    """
    Returns full precomputed frame sequence with base64 preview thumbnails and
    frame-by-frame telemetry for instant zero-latency playback.
    """
    result = SequenceEngine.get_preset_sequence(preset_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sequence preset '{preset_id}' not found.",
        )
    return result
