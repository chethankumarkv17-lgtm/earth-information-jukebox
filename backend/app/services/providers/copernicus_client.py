"""
Copernicus Data Space Ecosystem (CDSE) & Sentinel-2 STAC Client
2026 NASA Space Apps Challenge — EARTH JUKEBOX
Connects to legitimate Copernicus and open Sentinel-2 Level-2A catalogs.
"""

from typing import Dict, Any, List, Optional
import datetime
import httpx
from app.core.config import settings
from app.services.cache import geo_cache
from app.services.geospatial.geospatial_engine import BoundingBox
from app.core.ssrf_protection import validate_external_url


class CopernicusSentinelClient:
    """Client for Copernicus Data Space Ecosystem and Open Sentinel-2 STAC API."""

    def __init__(
        self,
        client_id: str = settings.COPERNICUS_CLIENT_ID,
        client_secret: str = settings.COPERNICUS_CLIENT_SECRET,
        catalogue_url: str = settings.COPERNICUS_CATALOGUE_URL,
        stac_url: str = settings.SENTINEL_STAC_API_URL
    ):
        self.client_id = client_id
        self.client_secret = client_secret
        self.catalogue_url = catalogue_url
        self.stac_url = stac_url.rstrip("/")

    async def get_access_token(self) -> Optional[str]:
        """Fetch OAuth2 bearer token from Copernicus CDSE if client credentials are provided."""
        if not self.client_id or not self.client_secret:
            return None

        cache_key = "copernicus_oauth_token"
        cached_token = geo_cache.get(cache_key)
        if cached_token:
            return cached_token

        try:
            auth_url = validate_external_url(settings.COPERNICUS_AUTH_URL)
            timeout = httpx.Timeout(settings.EXTERNAL_REQUEST_TIMEOUT_SECONDS, connect=settings.EXTERNAL_CONNECT_TIMEOUT_SECONDS)
            async with httpx.AsyncClient(timeout=timeout) as client:
                resp = await client.post(
                    auth_url,
                    data={
                        "grant_type": "client_credentials",
                        "client_id": self.client_id,
                        "client_secret": self.client_secret,
                    },
                )
                if resp.status_code == 200:
                    data = resp.json()
                    token = data.get("access_token")
                    expires_in = data.get("expires_in", 3600)
                    if token:
                        geo_cache.set(cache_key, token, ttl=max(60, expires_in - 120))
                        return token
        except Exception:
            return None
        return None

    async def search_sentinel_granules(
        self,
        bbox: BoundingBox,
        date_str: Optional[str] = None,
        max_cloud_cover_pct: float = 30.0,
        limit: int = 5
    ) -> Dict[str, Any]:
        """
        Query real Sentinel-2 Level-2A granules for a geographic bounding box and date.
        Uses Copernicus CDSE Catalogue with automatic fallback to Earth Search Open STAC API.
        """
        cache_key = f"sentinel_search_{bbox.min_lat}_{bbox.min_lon}_{bbox.max_lat}_{bbox.max_lon}_{date_str}_{limit}"
        cached = geo_cache.get(cache_key)
        if cached:
            return cached

        target_date = date_str or (datetime.date.today() - datetime.timedelta(days=3)).isoformat()
        
        # Try Earth Search Open STAC API (Public, High-Speed, Zero Auth Barrier)
        granules = await self._search_stac_api(bbox, target_date, max_cloud_cover_pct, limit)
        
        # If STAC didn't return or was unreachable, query Copernicus CDSE
        if not granules:
            granules = await self._search_copernicus_catalogue(bbox, target_date, limit)

        result = {
            "provider": "Copernicus Data Space Ecosystem / Sentinel-2 STAC",
            "constellation": "Sentinel-2 (MSI Level-2A Bottom-of-Atmosphere Reflectance)",
            "bounding_box": bbox.to_dict(),
            "target_date": target_date,
            "max_cloud_cover_filter": max_cloud_cover_pct,
            "granules_found": len(granules),
            "granules": granules,
            "integration_status": "AUTHENTICATED_CDSE" if self.client_id else "OPEN_STAC_PUBLIC_MIRROR"
        }

        geo_cache.set(cache_key, result, ttl=settings.CACHE_TTL_SECONDS)
        return result

    async def _search_stac_api(
        self, 
        bbox: BoundingBox, 
        date_str: str, 
        max_cloud_cover: float, 
        limit: int
    ) -> List[Dict[str, Any]]:
        """Query open Earth Search AWS Sentinel-2 L2A STAC items."""
        try:
            # Query interval: +/- 15 days around target date
            center_dt = datetime.date.fromisoformat(date_str)
            start_date = (center_dt - datetime.timedelta(days=15)).isoformat()
            end_date = (center_dt + datetime.timedelta(days=5)).isoformat()
            date_range = f"{start_date}/{end_date}"
        except Exception:
            date_range = f"{date_str}/{date_str}"

        stac_search_url = f"{self.stac_url}/collections/sentinel-2-l2a/items"
        params = {
            "bbox": f"{bbox.min_lon},{bbox.min_lat},{bbox.max_lon},{bbox.max_lat}",
            "datetime": date_range,
            "limit": limit
        }

        granules = []
        try:
            safe_stac_url = validate_external_url(stac_search_url)
            timeout = httpx.Timeout(settings.EXTERNAL_REQUEST_TIMEOUT_SECONDS, connect=settings.EXTERNAL_CONNECT_TIMEOUT_SECONDS)
            async with httpx.AsyncClient(timeout=timeout) as client:
                resp = await client.get(safe_stac_url, params=params)
                if resp.status_code == 200:
                    data = resp.json()
                    for item in data.get("features", []):
                        props = item.get("properties", {})
                        cloud_cover = props.get("eo:cloud_cover", 0.0)
                        if cloud_cover <= max_cloud_cover:
                            assets = item.get("assets", {})
                            thumb_url = assets.get("thumbnail", {}).get("href") or assets.get("visual", {}).get("href")
                            granules.append({
                                "id": item.get("id"),
                                "platform": props.get("platform", "Sentinel-2"),
                                "datetime": props.get("datetime"),
                                "cloud_cover_pct": round(float(cloud_cover), 2),
                                "sun_elevation_deg": round(float(props.get("view:sun_elevation", 0.0)), 1),
                                "grid_tile_id": props.get("grid:code") or props.get("s2:mgrs_tile"),
                                "spatial_resolution": "10m - 20m GSD (13 Spectral Bands)",
                                "thumbnail_url": thumb_url,
                                "stac_item_url": item.get("links", [{}])[0].get("href", ""),
                            })
        except Exception:
            pass

        return granules

    async def _search_copernicus_catalogue(
        self, 
        bbox: BoundingBox, 
        date_str: str, 
        limit: int
    ) -> List[Dict[str, Any]]:
        """Query Copernicus Data Space Ecosystem (CDSE) OpenSearch Resto API."""
        params = {
            "box": f"{bbox.min_lon},{bbox.min_lat},{bbox.max_lon},{bbox.max_lat}",
            "startDate": f"{date_str}T00:00:00Z",
            "maxRecords": limit
        }

        granules = []
        try:
            safe_cat_url = validate_external_url(self.catalogue_url)
            token = await self.get_access_token()
            headers = {"Authorization": f"Bearer {token}"} if token else {}
            timeout = httpx.Timeout(settings.EXTERNAL_REQUEST_TIMEOUT_SECONDS, connect=settings.EXTERNAL_CONNECT_TIMEOUT_SECONDS)
            async with httpx.AsyncClient(timeout=timeout) as client:
                resp = await client.get(safe_cat_url, params=params, headers=headers)
                if resp.status_code == 200:
                    data = resp.json()
                    for feature in data.get("features", []):
                        props = feature.get("properties", {})
                        granules.append({
                            "id": feature.get("id"),
                            "title": props.get("title"),
                            "platform": props.get("platform", "Sentinel-2"),
                            "datetime": props.get("startDate"),
                            "cloud_cover_pct": round(float(props.get("cloudCover", 0.0)), 2),
                            "spatial_resolution": "10m - 20m GSD",
                            "thumbnail_url": props.get("thumbnail"),
                            "product_type": props.get("productType", "S2MSI2A"),
                        })
        except Exception:
            pass

        return granules


copernicus_client = CopernicusSentinelClient()
