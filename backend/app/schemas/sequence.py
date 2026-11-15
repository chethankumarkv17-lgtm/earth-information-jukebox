from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from app.schemas.cv_analysis import (
    DominantColor,
    QuadrantEnergy,
    NormalizedFeatureVector,
)


class FrameTelemetry(BaseModel):
    """
    Extracted telemetry and computer vision metrics for a single frame
    in an animated Earth visualization time-series.
    """
    frame_index: int = Field(description="Zero-indexed sequential frame number")
    timestamp_sec: float = Field(description="Calculated presentation time in seconds")
    thumbnail_base64: str = Field(description="Data URI image of the resized frame (JPEG)")
    
    # Core optical metrics
    standard_luminance_bt601: float = Field(description="Luminance (0 - 255)")
    normalized_brightness: float = Field(description="Brightness (0.0 - 1.0)")
    hue_mean_deg: float = Field(description="Mean hue on 0° - 360° circle")
    dominant_colors: List[DominantColor] = Field(description="Top dominant color clusters")
    edge_density: float = Field(description="Canny edge pixel density (0.0 - 1.0)")
    centroid_x_norm: float = Field(description="Spatial brightness centroid X (0.0 left to 1.0 right)")
    centroid_y_norm: float = Field(description="Spatial brightness centroid Y (0.0 top to 1.0 bottom)")
    quadrants: QuadrantEnergy = Field(description="Energy split across 4 quadrants")
    contrast_rms: float = Field(description="RMS contrast (0.0 - 1.0)")
    color_entropy: float = Field(description="Shannon color entropy")
    warmth_index: float = Field(description="Warm vs cool hue ratio (0.0 - 1.0)")
    
    # Frame-to-frame delta metrics
    delta_from_previous: Optional[float] = Field(None, description="Normalized MAD compared to frame t-1 (0.0 - 1.0)")
    motion_detected: bool = Field(False, description="Whether significant change occurred")
    
    # 11-dimensional normalized numerical vector for audio engine
    normalized_features: NormalizedFeatureVector


class SequenceTrends(BaseModel):
    """
    Macro-level planetary trends detected across the complete time-series.
    """
    brightness_trend: str = Field(description="'Increasing', 'Decreasing', or 'Stable'")
    brightness_delta_total: float = Field(description="Net change in normalized brightness across sequence")
    dominant_hue_drift_deg: float = Field(description="Net circular shift in dominant hue")
    mean_edge_density: float = Field(description="Average topological complexity")
    peak_motion_frame: int = Field(description="Frame index of highest dynamic variation")
    peak_motion_magnitude: float = Field(description="Maximum normalized delta between frames")


class SequenceAnalysisResponse(BaseModel):
    """
    Complete response payload for an animated Earth visualization sequence.
    """
    success: bool
    sequence_id: str
    filename: str
    total_frames: int
    duration_sec: float
    fps: float
    width: int
    height: int
    frames: List[FrameTelemetry]
    trends: SequenceTrends
    processing_time_ms: float
