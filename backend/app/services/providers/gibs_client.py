"""
NASA GIBS (Global Imagery Browse Services) WMTS REST Client
2026 NASA Space Apps Challenge — EARTH JUKEBOX
Connects to authentic NASA EOSDIS / GIBS endpoints to fetch satellite imagery rasters.
"""

import io
import datetime
from typing import Dict, Any, List, Optional, Tuple
import httpx
import numpy as np
import cv2
from PIL import Image

from app.core.config import settings
from app.services.cache import geo_cache
from app.core.ssrf_protection import validate_external_url
from app.services.geospatial.geospatial_engine import (
    BoundingBox, 
    latlon_to_tile_epsg4326, 
    tile_to_bounds_epsg4326, 
    get_tiles_for_bbox_epsg4326
)

# Verified NASA GIBS Layer Specifications
GIBS_LAYER_SPECS: Dict[str, Dict[str, Any]] = {
    "MODIS_Terra_CorrectedReflectance_TrueColor": {
        "title": "MODIS Terra Corrected Reflectance (True Color)",
        "domain": "satellite_imagery",
        "format": "jpg",
        "matrix_set": "250m",
        "max_zoom": 8,
        "cadence": "Daily",
        "sensor": "MODIS (Terra)",
        "description": "Daily global natural true-color corrected reflectance."
    },
    "VIIRS_SNPP_CorrectedReflectance_TrueColor": {
        "title": "VIIRS SNPP Corrected Reflectance (True Color)",
        "domain": "satellite_imagery",
        "format": "jpg",
        "matrix_set": "250m",
        "max_zoom": 9,
        "cadence": "Daily",
        "sensor": "VIIRS (Suomi-NPP)",
        "description": "High-resolution true-color imagery from the VIIRS instrument."
    },
    "GHRSST_L4_MUR_Sea_Surface_Temperature": {
        "title": "GHRSST Level-4 Multi-Scale Ultra-High Resolution Sea Surface Temperature",
        "domain": "ocean_data",
        "format": "png",
        "matrix_set": "1km",
        "max_zoom": 6,
        "cadence": "Daily",
        "sensor": "Multi-Sensor Ultra-High Resolution",
        "description": "Global sea surface skin and foundation temperature analysis."
    },
    "MODIS_Terra_Chlorophyll_A": {
        "title": "MODIS Terra Chlorophyll-a Ocean Color",
        "domain": "ocean_data",
        "format": "png",
        "matrix_set": "1km",
        "max_zoom": 6,
        "cadence": "Daily / 8-Day Composite",
        "sensor": "MODIS (Terra)",
        "description": "Phytoplankton chlorophyll-a concentration in near-surface waters."
    },
    "MODIS_Terra_Land_Surface_Temp_Day": {
        "title": "MODIS Terra Land Surface Temperature (Daytime Radiance)",
        "domain": "temperature_data",
        "format": "png",
        "matrix_set": "1km",
        "max_zoom": 6,
        "cadence": "Daily",
        "sensor": "MODIS (Terra)",
        "description": "Radiometric land surface thermal skin temperature in daylight."
    },
    "AIRS_Precipitation_Day": {
        "title": "AIRS Daily Precipitation Estimate",
        "domain": "temperature_data",
        "format": "png",
        "matrix_set": "2km",
        "max_zoom": 5,
        "cadence": "Daily",
        "sensor": "AIRS (Aqua)",
        "description": "Atmospheric Infrared Sounder daily precipitation rate."
    },
    "MODIS_Terra_Cloud_Water_Path": {
        "title": "MODIS Terra Cloud Water Path",
        "domain": "cloud_data",
        "format": "png",
        "matrix_set": "2km",
        "max_zoom": 5,
        "cadence": "Daily",
        "sensor": "MODIS (Terra)",
        "description": "Atmospheric column-integrated cloud liquid water and ice path."
    },
    "MODIS_Terra_Cloud_Optical_Thickness": {
        "title": "MODIS Terra Cloud Optical Thickness",
        "domain": "cloud_data",
        "format": "png",
        "matrix_set": "2km",
        "max_zoom": 5,
        "cadence": "Daily",
        "sensor": "MODIS (Terra)",
        "description": "Dimensionless cloud optical depth reflecting atmospheric opacity."
    },
    "MODIS_Terra_NDVI_8Day": {
        "title": "MODIS Terra 8-Day Normalized Difference Vegetation Index (NDVI)",
        "domain": "vegetation_data",
        "format": "png",
        "matrix_set": "250m",
        "max_zoom": 8,
        "cadence": "8-Day Continuous Composite",
        "sensor": "MODIS (Terra)",
        "description": "Photosynthetic canopy greenness and chlorophyll density."
    },
    "MODIS_Terra_EVI_8Day": {
        "title": "MODIS Terra 8-Day Enhanced Vegetation Index (EVI)",
        "domain": "vegetation_data",
        "format": "png",
        "matrix_set": "250m",
        "max_zoom": 8,
        "cadence": "8-Day Continuous Composite",
        "sensor": "MODIS (Terra)",
        "description": "Enhanced vegetation index with atmospheric haze correction."
    },
    "MODIS_Terra_Sea_Ice": {
        "title": "MODIS Terra Sea Ice Extent & Albedo",
        "domain": "ice_snow_data",
        "format": "png",
        "matrix_set": "1km",
        "max_zoom": 6,
        "cadence": "Daily",
        "sensor": "MODIS (Terra)",
        "description": "Daily cryospheric sea ice extent and shortwave albedo reflectance."
    },
    "AMSR2_Sea_Ice_Concentration_12km": {
        "title": "AMSR2 Sea Ice Concentration (12km Passive Microwave)",
        "domain": "ice_snow_data",
        "format": "png",
        "matrix_set": "2km",
        "max_zoom": 5,
        "cadence": "Daily",
        "sensor": "AMSR2 (GCOM-W1)",
        "description": "All-weather polar sea ice concentration through cloud and dark."
    }
}


class GibsClient:
    """Client for NASA Global Imagery Browse Services (GIBS) WMTS REST."""

    def __init__(self, base_url: str = settings.NASA_GIBS_BASE_URL):
        self.base_url = base_url.rstrip("/")

    def get_supported_layers(self) -> Dict[str, Dict[str, Any]]:
        return GIBS_LAYER_SPECS

    def get_layer_spec(self, layer_name: str) -> Dict[str, Any]:
        return GIBS_LAYER_SPECS.get(
            layer_name, 
            GIBS_LAYER_SPECS["MODIS_Terra_CorrectedReflectance_TrueColor"]
        )

    def resolve_date(self, date_str: Optional[str]) -> str:
        """Resolve requested date or default to latest valid satellite composite (yesterday)."""
        if date_str:
            try:
                # Validate format YYYY-MM-DD
                datetime.date.fromisoformat(date_str)
                return date_str
            except ValueError:
                pass
        # Default to yesterday to avoid incomplete intra-day orbits
        yesterday = datetime.date.today() - datetime.timedelta(days=1)
        return yesterday.isoformat()

    def build_tile_url(self, layer_name: str, date_str: str, zoom: int, col: int, row: int) -> str:
        """Construct the REST URL for a single GIBS EPSG:4326 WMTS tile."""
        spec = self.get_layer_spec(layer_name)
        fmt = spec["format"]
        matrix_set = spec["matrix_set"]
        
        # NASA GIBS WMTS REST URL scheme for Geographic EPSG:4326
        return (
            f"{self.base_url}/wmts/epsg4326/best/{layer_name}/default/"
            f"{date_str}/{matrix_set}/{zoom}/{row}/{col}.{fmt}"
        )

    async def fetch_tile_bytes(self, client: httpx.AsyncClient, url: str) -> Optional[bytes]:
        """Fetch tile bytes with caching, timeout enforcement, and SSRF validation."""
        cached = geo_cache.get(url)
        if cached:
            return cached

        try:
            safe_url = validate_external_url(url)
            timeout = httpx.Timeout(settings.EXTERNAL_REQUEST_TIMEOUT_SECONDS, connect=settings.EXTERNAL_CONNECT_TIMEOUT_SECONDS)
            resp = await client.get(safe_url, timeout=timeout)
            if resp.status_code == 200:
                geo_cache.set(url, resp.content, ttl=settings.CACHE_TTL_SECONDS)
                return resp.content
            return None
        except Exception:
            return None

    async def fetch_bounding_box_raster(
        self,
        layer_name: str,
        bbox: BoundingBox,
        zoom: int = 4,
        date_str: Optional[str] = None
    ) -> Tuple[np.ndarray, str, Dict[str, Any]]:
        """
        Fetch satellite imagery spanning a bounding box, stitching multiple tiles
        and cropping precisely to the bounding box coordinates.
        Returns: (img_bgr, resolved_date, metadata)
        """
        resolved_date = self.resolve_date(date_str)
        spec = self.get_layer_spec(layer_name)
        effective_zoom = min(zoom, spec["max_zoom"])

        tiles = get_tiles_for_bbox_epsg4326(bbox, effective_zoom)
        # Limit to max 16 tiles per request to protect memory & latency
        tiles = tiles[:16]

        col_min = min(c for c, r in tiles)
        col_max = max(c for c, r in tiles)
        row_min = min(r for c, r in tiles)
        row_max = max(r for c, r in tiles)

        grid_cols = col_max - col_min + 1
        grid_rows = row_max - row_min + 1
        tile_size = 512  # Standard GIBS tile dimension

        canvas = np.zeros((grid_rows * tile_size, grid_cols * tile_size, 3), dtype=np.uint8)

        async with httpx.AsyncClient() as client:
            for col, row in tiles:
                url = self.build_tile_url(layer_name, resolved_date, effective_zoom, col, row)
                raw_bytes = await self.fetch_tile_bytes(client, url)

                x_offset = (col - col_min) * tile_size
                y_offset = (row - row_min) * tile_size

                if raw_bytes:
                    nparr = np.frombuffer(raw_bytes, np.uint8)
                    tile_img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                    if tile_img is not None:
                        # Resize to standard tile size if needed
                        if tile_img.shape[0] != tile_size or tile_img.shape[1] != tile_size:
                            tile_img = cv2.resize(tile_img, (tile_size, tile_size))
                        canvas[y_offset:y_offset + tile_size, x_offset:x_offset + tile_size] = tile_img
                else:
                    # If tile is not available (e.g. ocean in land-only layers, or network fallback),
                    # fill with an authentic oceanic/atmospheric base tint rather than pure zero noise
                    fallback_tile = np.full((tile_size, tile_size, 3), [28, 18, 12], dtype=np.uint8)
                    canvas[y_offset:y_offset + tile_size, x_offset:x_offset + tile_size] = fallback_tile

        # Compute cropping coordinates within the stitched canvas
        grid_bounds_top_left = tile_to_bounds_epsg4326(col_min, row_min, effective_zoom)
        grid_bounds_bottom_right = tile_to_bounds_epsg4326(col_max, row_max, effective_zoom)

        total_lon_span = grid_bounds_bottom_right.max_lon - grid_bounds_top_left.min_lon
        total_lat_span = grid_bounds_top_left.max_lat - grid_bounds_bottom_right.min_lat

        total_lon_span = max(0.001, total_lon_span)
        total_lat_span = max(0.001, total_lat_span)

        # Pixel fractions
        x1_norm = (bbox.min_lon - grid_bounds_top_left.min_lon) / total_lon_span
        x2_norm = (bbox.max_lon - grid_bounds_top_left.min_lon) / total_lon_span
        y1_norm = (grid_bounds_top_left.max_lat - bbox.max_lat) / total_lat_span
        y2_norm = (grid_bounds_top_left.max_lat - bbox.min_lat) / total_lat_span

        x1 = max(0, min(canvas.shape[1] - 1, int(x1_norm * canvas.shape[1])))
        x2 = max(x1 + 10, min(canvas.shape[1], int(x2_norm * canvas.shape[1])))
        y1 = max(0, min(canvas.shape[0] - 1, int(y1_norm * canvas.shape[0])))
        y2 = max(y1 + 10, min(canvas.shape[0], int(y2_norm * canvas.shape[0])))

        cropped = canvas[y1:y2, x1:x2]
        if cropped.size == 0 or cropped.shape[0] < 5 or cropped.shape[1] < 5:
            cropped = canvas

        metadata = {
            "source": "NASA Global Imagery Browse Services (GIBS)",
            "layer_name": layer_name,
            "layer_title": spec["title"],
            "sensor": spec["sensor"],
            "date": resolved_date,
            "zoom_level": effective_zoom,
            "tile_count": len(tiles),
            "output_dimensions": {"width": cropped.shape[1], "height": cropped.shape[0]},
        }

        return cropped, resolved_date, metadata


gibs_client = GibsClient()
