"""
Pydantic Models for EARTH JUKEBOX Backend Foundation (Phase 1).
Provides structured JSON response schemas for:
- GET /
- GET /health
- GET /api/earth/layers
"""
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class RootResponse(BaseModel):
    """Structured response model for root GET / endpoint."""
    message: str = Field(..., description="Service welcome and orientation message")
    app: str = Field(..., description="Application name")
    version: str = Field(..., description="Application semantic version")
    docs_url: str = Field("/docs", description="Interactive OpenAPI Swagger documentation path")
    health_url: str = Field("/health", description="System health status check path")
    endpoints: Dict[str, str] = Field(default_factory=dict, description="Key discoverable API endpoints")


class HealthResponse(BaseModel):
    """Structured response model for GET /health heartbeat endpoint."""
    status: str = Field("online", description="Service availability status")
    app: str = Field(..., description="Application name")
    version: str = Field(..., description="Current application version")
    environment: str = Field(..., description="Execution environment (development, staging, production)")
    timestamp: str = Field(..., description="ISO 8601 UTC timestamp of health check")


class LayerCategorySchema(BaseModel):
    """Schema for a scientific observation layer category."""
    id: str = Field(..., description="Category domain identifier", example="vegetation_data")
    name: str = Field(..., description="Human-readable category name", example="Vegetation & Canopy Dynamics")
    description: str = Field(..., description="Scientific scope of this category")
    total_layers: int = Field(..., description="Number of supported layers in this category")
    sample_layers: List[str] = Field(default_factory=list, description="Representative layer identifiers")


class LayerSpecSchema(BaseModel):
    """Schema for verified NASA GIBS satellite observation layer specification."""
    id: str = Field(..., description="Unique GIBS layer identifier", example="MODIS_Terra_NDVI_8Day")
    title: str = Field(..., description="Descriptive title of the data product")
    domain: str = Field(..., description="Scientific domain / category")
    format: str = Field(..., description="Tile image encoding format (jpg, png)")
    matrix_set: str = Field(..., description="Tile resolution matrix set (250m, 1km, 2km)")
    max_zoom: int = Field(..., description="Maximum native zoom level")
    cadence: str = Field(..., description="Temporal acquisition revisit cadence")
    sensor: str = Field(..., description="Satellite sensor instrument")
    description: str = Field(..., description="Brief description of physical measurements")


class EarthLayersResponse(BaseModel):
    """Structured response model for GET /api/earth/layers."""
    status: str = Field("success", description="Response status")
    total_layers: int = Field(..., description="Total count of verified supported satellite layers")
    domains: List[str] = Field(..., description="List of supported scientific domain keys")
    categories: List[LayerCategorySchema] = Field(..., description="Clearly labelled list of supported layer categories")
    layers: List[LayerSpecSchema] = Field(..., description="Verified specifications for each supported observation layer")
    data_provenance: str = Field(
        "NASA EOSDIS Global Imagery Browse Services (GIBS) & Copernicus Sentinel Data Space. Real satellite layer specifications — no fabricated observations.",
        description="Scientific data provenance statement"
    )
