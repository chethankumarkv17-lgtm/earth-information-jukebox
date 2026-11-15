from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List


class ChannelStatistics(BaseModel):
    mean: float
    std_dev: float
    min: int
    max: int


class ColorBreakdown(BaseModel):
    red: ChannelStatistics
    green: ChannelStatistics
    blue: ChannelStatistics
    dominant_channel: str
    brightness_index: float
    estimated_vegetation_index: float
    contrast_ratio: float
    edge_complexity_entropy: float


class ImageMetadata(BaseModel):
    filename: str
    original_size_bytes: int
    formatted_size: str
    content_type: str
    format: str
    color_mode: str
    original_width: int
    original_height: int
    aspect_ratio: str
    is_resized_for_processing: bool
    processed_width: int
    processed_height: int
    sha256_hash: str
    color_channels: int


class ImageProcessingResponse(BaseModel):
    success: bool
    message: str
    image_id: str
    metadata: ImageMetadata
    color_analysis: ColorBreakdown
    histogram: List[int] = Field(description="256-bin grayscale intensity distribution")
    thumbnail_base64: Optional[str] = None
    processed_timestamp: str
