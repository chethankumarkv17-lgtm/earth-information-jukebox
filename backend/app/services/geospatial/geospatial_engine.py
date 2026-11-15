"""
Geospatial Engine for Bounding Box Conversions, Tile Math & Array Processing
2026 NASA Space Apps Challenge — EARTH JUKEBOX
"""

import math
from dataclasses import dataclass
from typing import Tuple, List, Dict, Any, Optional
import numpy as np
import cv2
from PIL import Image

# Check for optional Rasterio & Xarray availability
try:
    import rasterio
    from rasterio.transform import from_bounds
    HAS_RASTERIO = True
except Exception:
    HAS_RASTERIO = False

try:
    import xarray as xr
    HAS_XARRAY = True
except Exception:
    HAS_XARRAY = False


@dataclass
class BoundingBox:
    min_lat: float
    min_lon: float
    max_lat: float
    max_lon: float

    def __post_init__(self):
        # Clamp latitude to [-90, 90] and longitude to [-180, 180]
        self.min_lat = max(-90.0, min(90.0, float(self.min_lat)))
        self.max_lat = max(-90.0, min(90.0, float(self.max_lat)))
        self.min_lon = max(-180.0, min(180.0, float(self.min_lon)))
        self.max_lon = max(-180.0, min(180.0, float(self.max_lon)))

        if self.min_lat > self.max_lat:
            self.min_lat, self.max_lat = self.max_lat, self.min_lat
        if self.min_lon > self.max_lon:
            self.min_lon, self.max_lon = self.max_lon, self.min_lon

    @property
    def center_lat(self) -> float:
        return (self.min_lat + self.max_lat) / 2.0

    @property
    def center_lon(self) -> float:
        return (self.min_lon + self.max_lon) / 2.0

    @property
    def width_deg(self) -> float:
        return self.max_lon - self.min_lon

    @property
    def height_deg(self) -> float:
        return self.max_lat - self.min_lat

    def to_dict(self) -> Dict[str, float]:
        return {
            "min_lat": round(self.min_lat, 4),
            "min_lon": round(self.min_lon, 4),
            "max_lat": round(self.max_lat, 4),
            "max_lon": round(self.max_lon, 4),
            "center_lat": round(self.center_lat, 4),
            "center_lon": round(self.center_lon, 4),
            "width_deg": round(self.width_deg, 4),
            "height_deg": round(self.height_deg, 4),
        }

    @classmethod
    def from_point_and_radius(cls, lat: float, lon: float, radius_km: float = 100.0) -> "BoundingBox":
        """Compute bounding box from center lat/lon and approximate radius in kilometers."""
        lat_delta = radius_km / 111.0
        # Longitude degree shrinks with cos(lat)
        lon_delta = radius_km / (111.0 * max(0.01, math.cos(math.radians(lat))))
        return cls(
            min_lat=lat - lat_delta,
            min_lon=lon - lon_delta,
            max_lat=lat + lat_delta,
            max_lon=lon + lon_delta
        )


def latlon_to_tile_epsg4326(lat: float, lon: float, zoom: int) -> Tuple[int, int]:
    """
    Convert lat/lon in WGS-84 to NASA GIBS EPSG:4326 WMTS Tile Column and Row.
    GIBS EPSG:4326 grid has 2x1 tiles at zoom 0 (each 180° x 180°).
    At zoom level Z:
      Number of columns = 2^(Z+1)
      Number of rows = 2^Z
    """
    col_count = 2 ** (zoom + 1)
    row_count = 2 ** zoom

    col = int(math.floor((lon + 180.0) / 360.0 * col_count))
    row = int(math.floor((90.0 - lat) / 180.0 * row_count))

    col = max(0, min(col_count - 1, col))
    row = max(0, min(row_count - 1, row))
    return col, row


def tile_to_bounds_epsg4326(col: int, row: int, zoom: int) -> BoundingBox:
    """Calculate geographic bounding box of a GIBS EPSG:4326 tile."""
    col_count = 2 ** (zoom + 1)
    row_count = 2 ** zoom

    col_width_deg = 360.0 / col_count
    row_height_deg = 180.0 / row_count

    min_lon = -180.0 + col * col_width_deg
    max_lon = min_lon + col_width_deg

    max_lat = 90.0 - row * row_height_deg
    min_lat = max_lat - row_height_deg

    return BoundingBox(min_lat=min_lat, min_lon=min_lon, max_lat=max_lat, max_lon=max_lon)


def get_tiles_for_bbox_epsg4326(bbox: BoundingBox, zoom: int) -> List[Tuple[int, int]]:
    """Get all (col, row) tiles covering a bounding box at a specific zoom level."""
    col_min, row_min = latlon_to_tile_epsg4326(bbox.max_lat, bbox.min_lon, zoom)
    col_max, row_max = latlon_to_tile_epsg4326(bbox.min_lat, bbox.max_lon, zoom)

    tiles = []
    for r in range(row_min, row_max + 1):
        for c in range(col_min, col_max + 1):
            tiles.append((c, r))
    return tiles


def extract_visual_features_from_image(img_bgr: np.ndarray) -> Dict[str, Any]:
    """
    Compute comprehensive computer vision features from an image array using NumPy & OpenCV.
    Extracts RGB statistics, luminance metrics, edge density, texture energy, and color distribution.
    """
    if img_bgr is None or img_bgr.size == 0:
        raise ValueError("Cannot extract visual features from empty image array.")

    # Convert to RGB and Gray
    img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
    hsv = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2HSV)
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)

    r = img_rgb[:, :, 0].astype(np.float32)
    g = img_rgb[:, :, 1].astype(np.float32)
    b = img_rgb[:, :, 2].astype(np.float32)

    total_pixels = img_bgr.shape[0] * img_bgr.shape[1]

    # RGB means and standard deviations
    r_mean = float(np.mean(r))
    g_mean = float(np.mean(g))
    b_mean = float(np.mean(b))
    r_std = float(np.std(r))
    g_std = float(np.std(g))
    b_std = float(np.std(b))

    # Standard ITU-R BT.601 and BT.709 Luminance
    bt601_lum = 0.299 * r + 0.587 * g + 0.114 * b
    bt709_lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
    mean_lum = float(np.mean(bt601_lum))

    # Canny Edge Density
    edges = cv2.Canny(gray, 50, 150)
    edge_pixel_count = int(np.count_nonzero(edges))
    edge_density_pct = float((edge_pixel_count / total_pixels) * 100.0)

    # Laplacian Texture Energy (variance of Laplacian)
    laplacian = cv2.Laplacian(gray, cv2.CV_32F)
    laplacian_variance = float(np.var(laplacian))

    # Color Distribution from HSV
    hue_mean = float(np.mean(hsv[:, :, 0]) * 2.0)  # Convert OpenCV 0-180 to 0-360 degrees
    sat_mean = float(np.mean(hsv[:, :, 1]) / 255.0 * 100.0)

    # Warmth Index: (Red - Blue) / 255
    warmth_index = float(np.clip((r_mean - b_mean) / 255.0, 0.0, 1.0))

    # Dynamic Range in dB: 20 * log10(max(1, p99 - p01))
    p01 = float(np.percentile(gray, 1))
    p99 = float(np.percentile(gray, 99))
    dynamic_range_db = float(20.0 * math.log10(max(1.0, p99 - p01)))

    # Compute Normalized 11D Sonification Features [0.0 - 1.0]
    rgb_sum = max(1.0, r_mean + g_mean + b_mean)
    norm_features = {
        "red_energy_norm": round(r_mean / rgb_sum, 4),
        "green_energy_norm": round(g_mean / rgb_sum, 4),
        "blue_energy_norm": round(b_mean / rgb_sum, 4),
        "standard_luminance_norm": round(mean_lum / 255.0, 4),
        "canny_edge_density_norm": round(edge_density_pct / 100.0, 4),
        "laplacian_texture_norm": round(min(1.0, laplacian_variance / 500.0), 4),
        "warmth_index": round(warmth_index, 4),
        "dynamic_range_norm": round(min(1.0, dynamic_range_db / 48.0), 4),
        "mean_hue_norm": round(hue_mean / 360.0, 4),
        "saturation_norm": round(sat_mean / 100.0, 4),
    }

    # Assess Missing / NoData / Alpha pixels
    # Consider near-black (0, 0, 0) as potential no-data border fill
    nodata_mask = (r < 2) & (g < 2) & (b < 2)
    nodata_count = int(np.count_nonzero(nodata_mask))
    nodata_pct = float((nodata_count / total_pixels) * 100.0)

    return {
        "optical_features": {
            "rgb_statistics": {
                "r_mean": round(r_mean, 2),
                "g_mean": round(g_mean, 2),
                "b_mean": round(b_mean, 2),
                "r_std": round(r_std, 2),
                "g_std": round(g_std, 2),
                "b_std": round(b_std, 2),
            },
            "brightness_metrics": {
                "bt601_standard_luminance": round(mean_lum, 2),
                "bt709_perceptual_luminance": round(float(np.mean(bt709_lum)), 2),
                "dynamic_range_db": round(dynamic_range_db, 2),
            },
            "color_distribution": {
                "mean_hue": round(hue_mean, 1),
                "mean_saturation": round(sat_mean, 1),
                "warmth_index": round(warmth_index, 3),
            },
            "spatial_distribution": {
                "canny_edge_density_pct": round(edge_density_pct, 2),
                "laplacian_texture_energy": round(laplacian_variance, 2),
            }
        },
        "normalized_features": norm_features,
        "data_quality": {
            "valid_pixel_pct": round(100.0 - nodata_pct, 2),
            "missing_value_pct": round(nodata_pct, 2),
            "no_data_count": nodata_count,
            "total_pixels": total_pixels,
            "has_missing_data": nodata_pct > 5.0,
            "quality_flag": "OPTIMAL" if nodata_pct < 5.0 else "PARTIAL_COVERAGE" if nodata_pct < 35.0 else "DEGRADED"
        }
    }
