from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any


class RGBChannelInfo(BaseModel):
    mean: float
    std_dev: float
    min: int
    max: int
    median: float
    proportion: float = Field(description="Normalized proportion of total RGB energy (0.0 - 1.0)")


class RGBStatistics(BaseModel):
    red: RGBChannelInfo
    green: RGBChannelInfo
    blue: RGBChannelInfo
    dominant_channel: str
    channel_correlations: Dict[str, float] = Field(description="Correlation between R-G, G-B, R-B channels")


class DominantColor(BaseModel):
    rgb: List[int] = Field(description="[R, G, B] integer values")
    hex: str
    percentage: float = Field(description="Pixel share percentage (0 - 100%)")
    name: str = Field(description="Descriptive color identification")


class ColorDistribution(BaseModel):
    dominant_colors: List[DominantColor]
    mean_hue_deg: float = Field(description="Mean hue on 0° - 360° circle")
    mean_saturation: float = Field(description="Mean saturation (0 - 100%)")
    warmth_index: float = Field(description="Ratio of warm hues to cool hues (0.0 to 1.0)")
    color_entropy: float = Field(description="Shannon entropy of color distribution")


class BrightnessMetrics(BaseModel):
    standard_luminance_bt601: float = Field(description="ITU-R BT.601 standard luminance (0 - 255)")
    perceptual_luminance_bt709: float = Field(description="ITU-R BT.709 human perceptual luminance (0 - 255)")
    normalized_brightness: float = Field(description="Normalized brightness scale (0.0 - 1.0)")
    dynamic_range_db: float = Field(description="Decibel dynamic range between minimum and maximum non-zero pixels")
    shadow_clipping_pct: float = Field(description="Percentage of underexposed / deep shadow pixels (<= 5/255)")
    highlight_clipping_pct: float = Field(description="Percentage of overexposed / saturated pixels (>= 250/255)")


class PixelIntensity(BaseModel):
    intensity_histogram_16: List[int] = Field(description="16-bin normalized intensity distribution for charts")
    intensity_histogram_64: List[int] = Field(description="64-bin detailed distribution")
    mean_intensity: float
    median_intensity: float
    intensity_std_dev: float
    p25: float = Field(description="25th percentile intensity")
    p75: float = Field(description="75th percentile intensity")


class QuadrantEnergy(BaseModel):
    top_left: float = Field(description="Percentage energy in NW quadrant")
    top_right: float = Field(description="Percentage energy in NE quadrant")
    bottom_left: float = Field(description="Percentage energy in SW quadrant")
    bottom_right: float = Field(description="Percentage energy in SE quadrant")


class SpatialDistribution(BaseModel):
    centroid_x_norm: float = Field(description="Horizontal center of brightness (0.0 left to 1.0 right)")
    centroid_y_norm: float = Field(description="Vertical center of brightness (0.0 top to 1.0 bottom)")
    spatial_dispersion: float = Field(description="Variance of brightness distribution from center")
    quadrants: QuadrantEnergy
    laplacian_texture_energy: float = Field(description="Laplacian variance measuring surface edge density / sharpness")


class RegionalZone(BaseModel):
    zone_id: str = Field(description="e.g. 'NW', 'N', 'NE', 'W', 'Center', 'E', 'SW', 'S', 'SE'")
    zone_name: str
    grid_coords: str
    mean_rgb: List[float]
    brightness: float
    contrast_rms: float
    dominant_color_hex: str
    edge_density_pct: float


class FrameDifferenceResult(BaseModel):
    has_comparison: bool
    mean_absolute_difference: Optional[float] = None
    mean_squared_error: Optional[float] = None
    psnr_db: Optional[float] = None
    normalized_change_magnitude: Optional[float] = None
    centroid_shift_norm: Optional[float] = None
    motion_detected: Optional[bool] = None
    difference_thumbnail_base64: Optional[str] = None


class NormalizedFeatureVector(BaseModel):
    """
    11-dimensional normalized numerical feature vector (strictly scaled 0.0 to 1.0)
    for downstream parametric audio synthesis and machine learning classification.
    """
    brightness: float
    red_energy: float
    green_energy: float
    blue_energy: float
    hue_mean: float
    saturation_mean: float
    color_entropy: float
    centroid_x: float
    centroid_y: float
    edge_density: float
    contrast: float


class ScientificInterpretation(BaseModel):
    is_calibrated: bool = Field(description="Whether a scientific legend calibration was applied by user")
    calibration_scheme: str = Field(description="'None' | 'NDVI' | 'SST' | 'CO2' | 'Ice_Altimetry' | 'Custom'")
    measurement_unit: str = Field(description="e.g. 'NDVI (-0.2 to +1.0)', '°C', 'ppm', 'cm'")
    estimated_mean_physical_value: Optional[float] = None
    estimated_min_physical_value: Optional[float] = None
    estimated_max_physical_value: Optional[float] = None
    calibration_confidence: str
    disclaimers: List[str] = Field(description="Explicit distinction between optical pixels and physical sensor truth")


class CVAnalysisResponse(BaseModel):
    success: bool
    message: str
    analysis_id: str
    image_metadata: Dict[str, Any]
    optical_features: Dict[str, Any] = Field(
        description="Strictly image-derived optical features (RGB, luminance, HSV, edges, spatial)"
    )
    regional_statistics: List[RegionalZone]
    frame_difference: Optional[FrameDifferenceResult] = None
    normalized_features: NormalizedFeatureVector
    scientific_interpretation: ScientificInterpretation
    processing_diagnostics: Dict[str, Any]
    thumbnail_base64: Optional[str] = None
