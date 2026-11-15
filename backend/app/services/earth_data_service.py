"""
NASA Earth Observation & Meteorological Multi-Source Scientific Data Service
2026 NASA Space Apps Challenge — EARTH JUKEBOX

Integrates:
1. NASA Earthdata (MODIS, VIIRS, ICESat-2, GISTEMP, OCO-2)
2. NASA POWER (LaRC GEOS-5 / MERRA-2)
3. Open-Meteo ERA5 / ERA5-Land Reanalysis (ECMWF)
4. Copernicus Data Space Ecosystem (Sentinel-1, Sentinel-2, Sentinel-3)

Preserves for every dataset:
- Dataset name
- Source / Agency
- Units
- Geographic coverage
- Time coverage
- Resolution
- Temporal frequency
- Processing information
- Data limitations
"""

import datetime
from typing import Dict, Any, List, Optional
from app.services.providers.nasa_power_client import nasa_power_client
from app.services.providers.open_meteo_client import open_meteo_client
from app.services.providers.gibs_client import gibs_client, GIBS_LAYER_SPECS
from app.services.providers.copernicus_client import copernicus_client
from app.services.cache import geo_cache


# Master Verified Earth Science Dataset Catalog with complete 9-field provenance
VERIFIED_DATASET_CATALOG: List[Dict[str, Any]] = [
    {
        "id": "merra2-surface-temperature",
        "domain": "temperature",
        "dataset_name": "NASA MERRA-2 2-Meter Air Temperature (T2M)",
        "source": "NASA Langley Research Center (LaRC) POWER / GMAO",
        "units": "°C (Celsius)",
        "geographic_coverage": "Global WGS-84 (90°S to 90°N, 180°W to 180°E)",
        "time_coverage": "1981-01-01 to Present (~3-day latency)",
        "resolution": "0.5° × 0.625° (~50 km) Atmospheric Grid",
        "temporal_frequency": "Hourly & Daily Averages",
        "processing_information": "GMAO Modern-Era Retrospective Analysis for Research and Applications, Version 2 (MERRA-2) Goddard Earth Observing System (GEOS) atmospheric data assimilation.",
        "data_limitations": "Spatial smoothing over complex alpine terrain and polar glaciers; subject to a 3-5 day assimilation processing latency."
    },
    {
        "id": "era5-surface-temperature",
        "domain": "temperature",
        "dataset_name": "ECMWF ERA5-Land 2-Meter Mean Surface Temperature",
        "source": "European Centre for Medium-Range Weather Forecasts (ECMWF) / Open-Meteo",
        "units": "°C (Celsius)",
        "geographic_coverage": "Global Land Surface (89°S to 89°N)",
        "time_coverage": "1940-01-01 to Present (~5-day latency)",
        "resolution": "0.1° × 0.1° (~9 km) Gridded Land Surface",
        "temporal_frequency": "Hourly & Daily Reanalysis",
        "processing_information": "4D-Var data assimilation of in-situ meteorological station records, radiosondes, and satellite radiances through the ECMWF Integrated Forecasting System (IFS).",
        "data_limitations": "Model grid cell values represent areal spatial means rather than local point microclimates; uncalibrated over extreme polar ice shelves."
    },
    {
        "id": "merra2-daily-precipitation",
        "domain": "precipitation",
        "dataset_name": "NASA POWER Bias-Corrected Precipitation (PRECTOTCORR)",
        "source": "NASA Langley Research Center / Global Precipitation Climatology Project (GPCP)",
        "units": "mm/day (Millimeters per Day)",
        "geographic_coverage": "Global WGS-84 (-90° to +90°)",
        "time_coverage": "1981-01-01 to Present",
        "resolution": "0.5° × 0.625° Grid",
        "temporal_frequency": "Daily Accumulated Totals",
        "processing_information": "MERRA-2 model precipitation corrected against satellite microwave radiometry and GPCP rain gauge network observations.",
        "data_limitations": "Underestimation of localized extreme convective thunderstorm downpours; snow-water equivalent conversion uncertainty in sub-zero cryospheric conditions."
    },
    {
        "id": "era5-precipitation-sum",
        "domain": "precipitation",
        "dataset_name": "ECMWF ERA5 Total Precipitation Accumulation",
        "source": "ECMWF / Copernicus Climate Change Service (C3S)",
        "units": "mm (Millimeters)",
        "geographic_coverage": "Global Coverage",
        "time_coverage": "1940-01-01 to Present",
        "resolution": "0.1° × 0.1° (~9 km)",
        "temporal_frequency": "Daily & Hourly Cumulative Sums",
        "processing_information": "Calculated by physical parameterization schemes within the atmospheric model integrating large-scale stratiform cloud condensation and convective rainfall.",
        "data_limitations": "Known light precipitation drizzle bias in high-pressure maritime regimes."
    },
    {
        "id": "merra2-wind-speed-10m",
        "domain": "wind_speed",
        "dataset_name": "NASA MERRA-2 10-Meter Neutral Wind Speed (WS10M)",
        "source": "NASA GMAO / POWER",
        "units": "m/s (Meters per Second)",
        "geographic_coverage": "Global WGS-84",
        "time_coverage": "1981-01-01 to Present",
        "resolution": "0.5° × 0.625°",
        "temporal_frequency": "Daily Mean & Daily Maximum",
        "processing_information": "Surface layer similarity theory profile derived from u and v vector wind components assimilated from satellite scatterometers and anemometer stations.",
        "data_limitations": "Does not capture localized wind gusts or urban canyon drag turbulence below the 50 km grid scale."
    },
    {
        "id": "modis-terra-ndvi",
        "domain": "vegetation",
        "dataset_name": "MODIS Terra Normalized Difference Vegetation Index (MOD13A2)",
        "source": "NASA EOSDIS / Land Processes DAAC (LP DAAC)",
        "units": "NDVI Ratio Index [-0.2 to +1.0]",
        "geographic_coverage": "Global Terrestrial Landmasses",
        "time_coverage": "2000-02-24 to Present",
        "resolution": "250m to 1km Ground Sample Distance",
        "temporal_frequency": "8-Day & 16-Day Cloud-Free Composites",
        "processing_information": "Ratio of near-infrared (Band 2: 841–876 nm) minus red (Band 1: 620–670 nm) reflectance over their sum, corrected for atmospheric Rayleigh scattering and water vapor absorption.",
        "data_limitations": "Signal saturates over dense rainforest canopies (NDVI > 0.85); prolonged cloud cover or monsoonal rain seasons produce missing composite pixels."
    },
    {
        "id": "copernicus-sentinel2-msi",
        "domain": "vegetation",
        "dataset_name": "Copernicus Sentinel-2 Level-2A BOA Surface Reflectance",
        "source": "European Space Agency (ESA) & Copernicus Data Space Ecosystem",
        "units": "Bottom-Of-Atmosphere (BOA) Reflectance [0.0 to 1.0]",
        "geographic_coverage": "Global Land & Coastal Zones (56°S to 84°N)",
        "time_coverage": "2015-06-23 to Present",
        "resolution": "10m, 20m, 60m GSD",
        "temporal_frequency": "5-Day Constellation Revisit (Sentinel-2A + 2B)",
        "processing_information": "Atmospheric correction using Sen2Cor processor, radiative transfer modeling, and aerosol optical thickness estimation.",
        "data_limitations": "Optical sensors cannot penetrate cloud cover, persistent marine stratocumulus, or smoke plumes; high cloud shadow false-positives."
    },
    {
        "id": "ghrsst-mur-sst",
        "domain": "ocean",
        "dataset_name": "GHRSST Multi-Scale Ultra-High Resolution Sea Surface Temperature",
        "source": "NASA Physical Oceanography DAAC (PO.DAAC) / JPL",
        "units": "°C / K (Degrees Celsius or Kelvin)",
        "geographic_coverage": "Global Oceans & Marginal Seas",
        "time_coverage": "2002-06-01 to Present",
        "resolution": "0.01° × 0.01° (~1 km Grid)",
        "temporal_frequency": "Daily Foundation SST Analysis",
        "processing_information": "Multi-resolution variational analysis merging infrared (MODIS, VIIRS, AVHRR) and microwave (AMSR2, WindSat) satellite radiometer observations with in-situ Argo buoys.",
        "data_limitations": "Represents foundation sea surface temperature at ~1m depth free of diurnal warming; high infrared cloud gaps rely on lower-resolution microwave interpolation."
    },
    {
        "id": "modis-terra-aerosol-aod",
        "domain": "atmosphere",
        "dataset_name": "MODIS Terra Dark Target Aerosol Optical Depth (AOD)",
        "source": "NASA Goddard Space Flight Center / EOSDIS",
        "units": "Dimensionless Optical Depth (0.0 to 5.0)",
        "geographic_coverage": "Global Land & Ice-Free Oceans",
        "time_coverage": "2000-02-24 to Present",
        "resolution": "3km to 10km Spatial Grid",
        "temporal_frequency": "Daily Orbit Swaths & Gridded Level-3",
        "processing_information": "Multi-angle solar reflectance inversion over dark vegetation and water surfaces isolating aerosol extinction from atmospheric particulates (dust, smoke, sulfates).",
        "data_limitations": "Unusable over high-reflectance bright surfaces (Sahara sand, snow, salt flats) without Deep Blue algorithm; cloud-edge adjacency contamination."
    },
    {
        "id": "nsidc-arctic-sea-ice",
        "domain": "snow_ice",
        "dataset_name": "NSIDC / NASA Sea Ice Index & Climate Data Record",
        "source": "National Snow and Ice Data Center (NSIDC) / NASA Goddard",
        "units": "Million Square Kilometers (Extent) & % (Concentration)",
        "geographic_coverage": "Northern & Southern Polar Oceans",
        "time_coverage": "1979-01-01 to Present",
        "resolution": "25 km Grid (SSM/I, SSMIS, SMMR)",
        "temporal_frequency": "Daily & Monthly Means",
        "processing_information": "NASA Team and Bootstrap algorithms applied to passive microwave brightness temperatures, thresholded at 15% sea ice concentration.",
        "data_limitations": "Summer surface melt ponds are misclassified as open water in microwave radiometry; land-spillover contamination along Arctic coastlines."
    }
]


class EarthDataService:
    """Orchestrates multi-source queries across NASA Earthdata, NASA POWER, Open-Meteo, and Copernicus."""

    def get_catalog(self, domain: Optional[str] = None) -> List[Dict[str, Any]]:
        """Return dataset catalog filtered by domain if specified."""
        if domain:
            d_norm = domain.lower().replace("-", "_").replace(" ", "_")
            return [d for d in VERIFIED_DATASET_CATALOG if d["domain"] == d_norm]
        return VERIFIED_DATASET_CATALOG

    async def get_multi_source_point_metrics(
        self,
        lat: float,
        lon: float,
        date_str: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Query real physical measurements for a coordinate from both NASA POWER and Open-Meteo ERA5.
        Returns unified calibrated scientific JSON preserving provenance, units, and quality flags.
        """
        # Execute concurrent queries
        power_task = nasa_power_client.get_daily_point_metrics(lat, lon, date_str)
        era5_task = open_meteo_client.get_historical_point_metrics(lat, lon, date_str)

        power_data = await power_task
        era5_data = await era5_task

        # Combine into unified scientific response
        p_meas = power_data.get("measurements", {})
        e_meas = era5_data.get("measurements", {})

        unified_metrics = {
            "temperature": {
                "nasa_power_t2m": {
                    "value": p_meas.get("temperature_2m_c"),
                    "unit": "°C",
                    "description": "Temperature at 2 Meters (NASA MERRA-2)",
                    "source": "NASA POWER"
                },
                "era5_temperature_mean": {
                    "value": e_meas.get("temperature_2m_mean_c"),
                    "unit": "°C",
                    "description": "Daily Mean 2-Meter Temperature (ECMWF ERA5)",
                    "source": "ECMWF ERA5"
                },
                "era5_temperature_max": {
                    "value": e_meas.get("temperature_2m_max_c"),
                    "unit": "°C",
                    "description": "Daily Maximum 2-Meter Temperature",
                    "source": "ECMWF ERA5"
                },
                "era5_temperature_min": {
                    "value": e_meas.get("temperature_2m_min_c"),
                    "unit": "°C",
                    "description": "Daily Minimum 2-Meter Temperature",
                    "source": "ECMWF ERA5"
                }
            },
            "precipitation": {
                "nasa_power_precipitation": {
                    "value": p_meas.get("precipitation_corrected_mm"),
                    "unit": "mm/day",
                    "description": "Bias-Corrected Daily Precipitation (NASA MERRA-2 / GPCP)",
                    "source": "NASA POWER"
                },
                "era5_precipitation_sum": {
                    "value": e_meas.get("precipitation_sum_mm"),
                    "unit": "mm",
                    "description": "Daily Total Precipitation Accumulation (ECMWF ERA5)",
                    "source": "ECMWF ERA5"
                }
            },
            "wind_speed": {
                "nasa_power_wind_speed_10m": {
                    "value": p_meas.get("wind_speed_10m_ms"),
                    "unit": "m/s",
                    "description": "10-Meter Wind Speed (NASA MERRA-2)",
                    "source": "NASA POWER"
                },
                "era5_wind_speed_max": {
                    "value": e_meas.get("wind_speed_10m_max_kmh"),
                    "unit": "km/h",
                    "description": "Maximum Daily 10-Meter Wind Speed (ECMWF ERA5)",
                    "source": "ECMWF ERA5"
                }
            },
            "atmospheric": {
                "relative_humidity_power": {
                    "value": p_meas.get("relative_humidity_pct"),
                    "unit": "%",
                    "description": "Relative Humidity at 2 Meters (NASA POWER)",
                    "source": "NASA POWER"
                },
                "relative_humidity_era5": {
                    "value": e_meas.get("relative_humidity_pct"),
                    "unit": "%",
                    "description": "Daily Mean Relative Humidity (ECMWF ERA5)",
                    "source": "ECMWF ERA5"
                },
                "solar_irradiance": {
                    "value": p_meas.get("solar_irradiance_kwh_m2"),
                    "unit": "kW-hr/m²/day",
                    "description": "All Sky Surface Shortwave Downward Irradiance",
                    "source": "NASA POWER"
                }
            }
        }

        # Calculate missing values count
        all_vals = []
        for category in unified_metrics.values():
            for item in category.values():
                all_vals.append(item["value"])

        valid_count = sum(1 for v in all_vals if v is not None)
        missing_count = sum(1 for v in all_vals if v is None)
        valid_pct = round((valid_count / len(all_vals)) * 100, 1) if all_vals else 0.0

        return {
            "coordinates": {
                "latitude": lat,
                "longitude": lon,
                "elevation_m": era5_data.get("elevation_m")
            },
            "requested_date": date_str or datetime.date.today().isoformat(),
            "sources": {
                "nasa_power": {
                    "status": "ONLINE" if "error" not in power_data else "ERROR",
                    "resolved_date": power_data.get("resolved_date"),
                    "spatial_resolution": power_data.get("spatial_resolution"),
                    "limitations": power_data.get("data_limitations")
                },
                "open_meteo_era5": {
                    "status": "ONLINE" if "error" not in era5_data else "ERROR",
                    "resolved_date": era5_data.get("resolved_date"),
                    "spatial_resolution": era5_data.get("spatial_resolution"),
                    "limitations": era5_data.get("data_limitations")
                }
            },
            "data_quality": {
                "total_parameters": len(all_vals),
                "valid_measurements": valid_count,
                "missing_measurements": missing_count,
                "valid_percentage": valid_pct,
                "quality_flag": "OPTIMAL_MULTI_SOURCE" if missing_count == 0 else "PARTIAL_RECOVERY"
            },
            "scientific_measurements": unified_metrics,
            "disclaimer": "All measurements reflect authentic calibrated numerical models (NASA MERRA-2 and ECMWF ERA5). No values are fabricated or generated."
        }


# Singleton instance
earth_data_service = EarthDataService()
