"""
Pydantic v2 Schemas for NASA Earth Information Jukebox Endpoints
2026 NASA Space Apps Challenge
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class CoordinatesSchema(BaseModel):
    min_lat: float = Field(..., ge=-90.0, le=90.0)
    min_lon: float = Field(..., ge=-180.0, le=180.0)
    max_lat: float = Field(..., ge=-90.0, le=90.0)
    max_lon: float = Field(..., ge=-180.0, le=180.0)
    center_lat: Optional[float] = None
    center_lon: Optional[float] = None
    width_deg: Optional[float] = None
    height_deg: Optional[float] = None


class LayerSpecSchema(BaseModel):
    id: str
    title: str
    domain: str
    format: str
    matrix_set: str
    max_zoom: int
    cadence: str
    sensor: str
    description: str


class EarthLayersResponse(BaseModel):
    total_layers: int
    domains: List[str]
    layers: List[LayerSpecSchema]


class ScientificMeasurementSchema(BaseModel):
    value: float
    unit: str
    description: str


class SonificationProfileSchema(BaseModel):
    suggested_style: str
    base_frequency_hz: float
    frequency_range: str
    harmonic_timbre: str
    acoustic_parameters: Dict[str, Any]


class DataQualitySchema(BaseModel):
    valid_pixel_pct: float
    missing_value_pct: float
    no_data_count: int
    total_pixels: int
    has_missing_data: bool
    quality_flag: str


class EarthRegionAnalysisResponse(BaseModel):
    dataset_name: str
    domain: str
    acquisition_date: str
    coordinates: Optional[CoordinatesSchema] = None
    scientific_measurements: Dict[str, ScientificMeasurementSchema]
    visual_features: Dict[str, Any]
    normalized_features: Dict[str, float]
    data_quality: Dict[str, Any]
    sonification_profile: SonificationProfileSchema
    metadata: Optional[Dict[str, Any]] = None


class DatasetAttributionSchema(BaseModel):
    id: str
    name: str
    agency: str
    sensor: str
    spatial_resolution: str
    spectral_coverage: str
    temporal_cadence: str
    access_url: str
    citation: str
    sonification_acoustic_mapping: str


class EarthDatasetsResponse(BaseModel):
    total_datasets: int
    datasets: List[DatasetAttributionSchema]


class TimelineFrameSchema(BaseModel):
    date: str
    year: int
    month: Optional[int] = None
    metric_value: float
    metric_unit: str
    normalized_acoustic_pitch: float
    audio_event: str
    thumbnail_url: Optional[str] = None


class EarthTimelineResponse(BaseModel):
    phenomenon: str
    region_name: str
    time_span: str
    total_frames: int
    frames: List[TimelineFrameSchema]
    timeline: Optional[List[TimelineFrameSchema]] = None
    macro_trend: str
    scientific_summary: str


class ProcessTimeseriesRequest(BaseModel):
    domain: str = Field(..., description="Scientific domain: temperature, precipitation, wind_speed, vegetation, ocean_sst")
    series: List[Dict[str, Any]] = Field(..., description="List of observation records with timestamp/date and value")
    location: Optional[Dict[str, Any]] = Field(default_factory=lambda: {"latitude": 0.0, "longitude": 0.0, "region_name": "Global Observation Point"})
    metadata: Optional[Dict[str, Any]] = None
