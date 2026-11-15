"""
NASA POWER (Prediction of Worldwide Energy Resources) API Client
2026 NASA Space Apps Challenge — EARTH JUKEBOX
Provides authentic daily meteorological and solar observations derived from NASA GEOS-5 / MERRA-2.
Documentation: https://power.larc.nasa.gov/docs/services/api/temporal/
"""

import datetime
from typing import Dict, Any, Optional
import httpx

from app.core.config import settings
from app.services.cache import geo_cache
from app.core.ssrf_protection import validate_external_url

NASA_POWER_BASE_URL = "https://power.larc.nasa.gov/api/temporal/daily/point"

# Verified NASA POWER meteorological parameters
POWER_PARAMETERS = [
    "T2M",               # Temperature at 2 Meters (°C)
    "T2M_MAX",           # Maximum Temperature at 2 Meters (°C)
    "T2M_MIN",           # Minimum Temperature at 2 Meters (°C)
    "PRECTOTCORR",       # Precipitation Corrected (mm/day)
    "WS10M",             # Wind Speed at 10 Meters (m/s)
    "WS10M_MAX",         # Maximum Wind Speed at 10 Meters (m/s)
    "RH2M",              # Relative Humidity at 2 Meters (%)
    "ALLSKY_SFC_SW_DWN"  # All Sky Surface Shortwave Downward Irradiance (kW-hr/m²/day)
]


class NasaPowerClient:
    """Client for NASA POWER open meteorological REST API."""

    def __init__(self, base_url: str = NASA_POWER_BASE_URL, timeout_sec: float = 12.0):
        self.base_url = base_url
        self.timeout_sec = timeout_sec

    async def get_daily_point_metrics(
        self,
        lat: float,
        lon: float,
        date_str: Optional[str] = None,
        days_window: int = 3
    ) -> Dict[str, Any]:
        """
        Fetch real daily meteorological measurements for a geographic coordinate.
        
        Args:
            lat: Latitude (-90 to +90)
            lon: Longitude (-180 to +180)
            date_str: Target date in YYYY-MM-DD or YYYYMMDD format. Defaults to 7 days ago.
            days_window: Number of days to retrieve around the target date.
        """
        # Parse or default target date
        if date_str:
            try:
                target_dt = datetime.date.fromisoformat(date_str.replace('/', '-'))
            except ValueError:
                target_dt = datetime.date.today() - datetime.timedelta(days=7)
        else:
            target_dt = datetime.date.today() - datetime.timedelta(days=7)

        # NASA POWER data has a latency of ~3-5 days. Ensure we don't query tomorrow
        max_dt = datetime.date.today() - datetime.timedelta(days=3)
        if target_dt > max_dt:
            target_dt = max_dt

        start_dt = target_dt - datetime.timedelta(days=max(0, days_window - 1))
        start_str = start_dt.strftime("%Y%m%d")
        end_str = target_dt.strftime("%Y%m%d")

        cache_key = f"nasa_power_daily_{round(lat, 3)}_{round(lon, 3)}_{start_str}_{end_str}"
        cached = geo_cache.get(cache_key)
        if cached:
            return cached

        params = {
            "parameters": ",".join(POWER_PARAMETERS),
            "community": "RE",
            "longitude": f"{lon:.4f}",
            "latitude": f"{lat:.4f}",
            "start": start_str,
            "end": end_str,
            "format": "JSON"
        }

        try:
            safe_url = validate_external_url(self.base_url)
            timeout = httpx.Timeout(settings.EXTERNAL_REQUEST_TIMEOUT_SECONDS, connect=settings.EXTERNAL_CONNECT_TIMEOUT_SECONDS)
            async with httpx.AsyncClient(timeout=timeout) as client:
                resp = await client.get(safe_url, params=params)
                
                if resp.status_code == 200:
                    payload = resp.json()
                    properties = payload.get("properties", {})
                    raw_params = properties.get("parameter", {})

                    # Extract primary metrics for target date or last available date
                    target_key = target_dt.strftime("%Y%m%d")
                    available_dates = sorted(list(raw_params.get("T2M", {}).keys()))
                    resolved_date = target_key if target_key in available_dates else (available_dates[-1] if available_dates else None)

                    metrics = {}
                    if resolved_date:
                        t2m = raw_params.get("T2M", {}).get(resolved_date)
                        precip = raw_params.get("PRECTOTCORR", {}).get(resolved_date)
                        wind = raw_params.get("WS10M", {}).get(resolved_date)
                        rh = raw_params.get("RH2M", {}).get(resolved_date)
                        solar = raw_params.get("ALLSKY_SFC_SW_DWN", {}).get(resolved_date)

                        # Filter NASA missing values (-999.0)
                        def clean_val(val):
                            return None if val is None or val <= -900 else float(val)

                        metrics = {
                            "temperature_2m_c": clean_val(t2m),
                            "precipitation_corrected_mm": clean_val(precip),
                            "wind_speed_10m_ms": clean_val(wind),
                            "relative_humidity_pct": clean_val(rh),
                            "solar_irradiance_kwh_m2": clean_val(solar),
                        }

                    result = {
                        "source": "NASA POWER (LaRC / GEOS-5 & MERRA-2)",
                        "provider_url": "https://power.larc.nasa.gov/",
                        "latitude": lat,
                        "longitude": lon,
                        "requested_date": target_dt.isoformat(),
                        "resolved_date": f"{resolved_date[:4]}-{resolved_date[4:6]}-{resolved_date[6:]}" if resolved_date else None,
                        "measurements": metrics,
                        "raw_time_series": raw_params,
                        "spatial_resolution": "0.5° × 0.625° Global Latitude/Longitude Grid",
                        "temporal_resolution": "Daily Averages",
                        "quality_flags": {
                            "missing_data_detected": any(v is None for v in metrics.values()),
                            "model_assimilation": "NASA Global Modeling and Assimilation Office (GMAO) MERRA-2",
                            "status": "CALIBRATED_METEOROLOGY"
                        },
                        "data_limitations": "Model reanalysis uncertainty increases over complex mountainous terrain and polar ice sheets; nominal 3-5 day latency."
                    }

                    geo_cache.set(cache_key, result, ttl=settings.CACHE_TTL_SECONDS)
                    return result

        except Exception as e:
            # Return structured error envelope preserving provenance
            return {
                "source": "NASA POWER (LaRC / GEOS-5 & MERRA-2)",
                "error": f"Failed to downlink NASA POWER telemetry: {str(e)}",
                "latitude": lat,
                "longitude": lon,
                "measurements": {},
                "quality_flags": {"status": "SERVICE_UNREACHABLE"}
            }

        return {
            "source": "NASA POWER (LaRC / GEOS-5 & MERRA-2)",
            "error": "NASA POWER returned non-200 HTTP response.",
            "latitude": lat,
            "longitude": lon,
            "measurements": {},
            "quality_flags": {"status": "UNAVAILABLE"}
        }


# Singleton instance
nasa_power_client = NasaPowerClient()
