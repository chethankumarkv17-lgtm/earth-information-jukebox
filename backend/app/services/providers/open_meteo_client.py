"""
Open-Meteo Historical Weather & ERA5 Reanalysis Client
2026 NASA Space Apps Challenge — EARTH JUKEBOX
Provides authentic hourly and daily atmospheric reanalysis data derived from ECMWF ERA5 and ERA5-Land.
Documentation: https://open-meteo.com/en/docs/historical-weather-api
"""

import datetime
from typing import Dict, Any, Optional
import httpx

from app.core.config import settings
from app.services.cache import geo_cache
from app.core.ssrf_protection import validate_external_url

OPEN_METEO_ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive"


class OpenMeteoClient:
    """Client for Open-Meteo ERA5 Historical Weather Reanalysis API."""

    def __init__(self, base_url: str = OPEN_METEO_ARCHIVE_URL, timeout_sec: float = 12.0):
        self.base_url = base_url
        self.timeout_sec = timeout_sec

    async def get_historical_point_metrics(
        self,
        lat: float,
        lon: float,
        date_str: Optional[str] = None,
        days_window: int = 3
    ) -> Dict[str, Any]:
        """
        Fetch real daily meteorological reanalysis measurements for a geographic coordinate.
        """
        if date_str:
            try:
                target_dt = datetime.date.fromisoformat(date_str.replace('/', '-'))
            except ValueError:
                target_dt = datetime.date.today() - datetime.timedelta(days=5)
        else:
            target_dt = datetime.date.today() - datetime.timedelta(days=5)

        # ERA5 reanalysis has nominal 5-day latency
        max_dt = datetime.date.today() - datetime.timedelta(days=5)
        if target_dt > max_dt:
            target_dt = max_dt

        start_dt = target_dt - datetime.timedelta(days=max(0, days_window - 1))
        start_str = start_dt.isoformat()
        end_str = target_dt.isoformat()

        cache_key = f"open_meteo_era5_{round(lat, 3)}_{round(lon, 3)}_{start_str}_{end_str}"
        cached = geo_cache.get(cache_key)
        if cached:
            return cached

        params = {
            "latitude": f"{lat:.4f}",
            "longitude": f"{lon:.4f}",
            "start_date": start_str,
            "end_date": end_str,
            "daily": [
                "temperature_2m_mean",
                "temperature_2m_max",
                "temperature_2m_min",
                "precipitation_sum",
                "windspeed_10m_max",
                "relative_humidity_2m_mean",
                "shortwave_radiation_sum"
            ],
            "timezone": "auto"
        }

        try:
            safe_url = validate_external_url(self.base_url)
            timeout = httpx.Timeout(settings.EXTERNAL_REQUEST_TIMEOUT_SECONDS, connect=settings.EXTERNAL_CONNECT_TIMEOUT_SECONDS)
            async with httpx.AsyncClient(timeout=timeout) as client:
                resp = await client.get(safe_url, params=params)
                
                if resp.status_code == 200:
                    payload = resp.json()
                    daily = payload.get("daily", {})
                    times = daily.get("time", [])

                    target_iso = target_dt.isoformat()
                    target_idx = times.index(target_iso) if target_iso in times else (len(times) - 1 if times else -1)

                    metrics = {}
                    if target_idx >= 0:
                        def get_daily_val(param_name):
                            vals = daily.get(param_name, [])
                            return float(vals[target_idx]) if target_idx < len(vals) and vals[target_idx] is not None else None

                        metrics = {
                            "temperature_2m_mean_c": get_daily_val("temperature_2m_mean"),
                            "temperature_2m_max_c": get_daily_val("temperature_2m_max"),
                            "temperature_2m_min_c": get_daily_val("temperature_2m_min"),
                            "precipitation_sum_mm": get_daily_val("precipitation_sum"),
                            "wind_speed_10m_max_kmh": get_daily_val("windspeed_10m_max"),
                            "wind_speed_10m_max_ms": round(get_daily_val("windspeed_10m_max") / 3.6, 2) if get_daily_val("windspeed_10m_max") is not None else None,
                            "relative_humidity_pct": get_daily_val("relative_humidity_2m_mean"),
                            "solar_radiation_mj_m2": get_daily_val("shortwave_radiation_sum"),
                        }

                    result = {
                        "source": "ECMWF ERA5 / ERA5-Land Reanalysis (via Open-Meteo)",
                        "provider_url": "https://open-meteo.com/en/docs/historical-weather-api",
                        "latitude": lat,
                        "longitude": lon,
                        "elevation_m": payload.get("elevation"),
                        "requested_date": target_dt.isoformat(),
                        "resolved_date": times[target_idx] if target_idx >= 0 else None,
                        "measurements": metrics,
                        "raw_time_series": daily,
                        "spatial_resolution": "0.1° × 0.1° (~9 km) ERA5-Land Surface Grid",
                        "temporal_resolution": "Daily & Hourly Reanalysis (1940 to present)",
                        "quality_flags": {
                            "missing_data_detected": any(v is None for v in metrics.values()),
                            "assimilation_model": "ECMWF Integrated Forecasting System (IFS) Cy41r2",
                            "status": "CALIBRATED_REANALYSIS"
                        },
                        "data_limitations": "Model grid values represent 9 km spatial averages rather than microclimate point sensor readings; subject to ECMWF 5-day publication latency."
                    }

                    geo_cache.set(cache_key, result, ttl=settings.CACHE_TTL_SECONDS)
                    return result

        except Exception as e:
            return {
                "source": "ECMWF ERA5 Reanalysis (via Open-Meteo)",
                "error": f"Failed to downlink ERA5 reanalysis: {str(e)}",
                "latitude": lat,
                "longitude": lon,
                "measurements": {},
                "quality_flags": {"status": "SERVICE_UNREACHABLE"}
            }

        return {
            "source": "ECMWF ERA5 Reanalysis (via Open-Meteo)",
            "error": "Open-Meteo returned non-200 HTTP response.",
            "latitude": lat,
            "longitude": lon,
            "measurements": {},
            "quality_flags": {"status": "UNAVAILABLE"}
        }


# Singleton instance
open_meteo_client = OpenMeteoClient()
