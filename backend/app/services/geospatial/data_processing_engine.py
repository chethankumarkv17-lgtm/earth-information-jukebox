"""
NASA Earth Data Processing Engine
2026 NASA Space Apps Challenge — EARTH JUKEBOX

Converts real Earth science datasets into structured, validated information suitable for visualization and sonification.
Technologies: NumPy, Pandas, Xarray, Rasterio, OpenCV.

Key Invariants:
1. Never silently convert missing values to zero.
2. Never remove scientific meaning through normalization.
3. Preserve original measurements alongside transformed values.
"""

import io
import math
import datetime
from typing import Dict, Any, List, Optional, Tuple, Union
import numpy as np
import pandas as pd
import xarray as xr
import rasterio
from rasterio.io import MemoryFile
from rasterio.transform import from_origin
import cv2

# Physical domain sanity limits for data validation
DOMAIN_PHYSICAL_BOUNDS: Dict[str, Dict[str, Any]] = {
    "temperature": {
        "min": -90.0,
        "max": 65.0,
        "unit": "°C",
        "norm_min": -30.0,
        "norm_max": 50.0,
        "description": "Surface & 2-meter atmospheric kinetic temperature."
    },
    "precipitation": {
        "min": 0.0,
        "max": 1500.0,
        "unit": "mm",
        "norm_min": 0.0,
        "norm_max": 60.0,
        "description": "Accumulated liquid & solid precipitation depth."
    },
    "wind_speed": {
        "min": 0.0,
        "max": 125.0,
        "unit": "m/s",
        "norm_min": 0.0,
        "norm_max": 35.0,
        "description": "Neutral 10-meter horizontal wind speed."
    },
    "vegetation": {
        "min": -0.2,
        "max": 1.0,
        "unit": "NDVI",
        "norm_min": -0.2,
        "norm_max": 1.0,
        "description": "Normalized Difference Vegetation Index photosynthetic greenness."
    },
    "ocean_sst": {
        "min": -2.5,
        "max": 37.0,
        "unit": "°C",
        "norm_min": 0.0,
        "norm_max": 34.0,
        "description": "Foundation sea surface temperature at 1m depth."
    },
    "ocean_chlorophyll": {
        "min": 0.0,
        "max": 100.0,
        "unit": "mg/m³",
        "norm_min": 0.0,
        "norm_max": 15.0,
        "description": "Phytoplankton near-surface chlorophyll-a concentration."
    },
    "aerosol_aod": {
        "min": 0.0,
        "max": 5.0,
        "unit": "AOD",
        "norm_min": 0.0,
        "norm_max": 2.5,
        "description": "Atmospheric column aerosol optical depth extinction."
    },
    "snow_ice": {
        "min": 0.0,
        "max": 100.0,
        "unit": "%",
        "norm_min": 0.0,
        "norm_max": 100.0,
        "description": "Cryospheric sea ice or snow coverage concentration percentage."
    }
}

# Standard fill values used across NASA EOSDIS, NOAA, and ECMWF products
STANDARD_FILL_VALUES = {-999.0, -9999.0, -99999.0, 9999.0, 1e20, 1e30, 9.96921e36}


class EarthDataProcessingEngine:
    """Enterprise-grade scientific processor for Earth observation rasters, NetCDFs, and time-series."""

    def __init__(self):
        self.bounds = DOMAIN_PHYSICAL_BOUNDS

    # =========================================================================
    # 1. SCIENTIFIC DATA INGESTION & READERS
    # =========================================================================

    def read_geotiff(
        self,
        file_source: Union[str, bytes, bytearray, memoryview]
    ) -> Dict[str, Any]:
        """
        Read scientific GeoTIFF raster using Rasterio.
        Extracts spatial metadata, affine transform, coordinate reference system (CRS), and band arrays.
        """
        if isinstance(file_source, (bytes, bytearray, memoryview)):
            with MemoryFile(bytes(file_source)) as memfile:
                with memfile.open() as src:
                    return self._extract_rasterio_dataset(src)
        else:
            with rasterio.open(file_source) as src:
                return self._extract_rasterio_dataset(src)

    def _extract_rasterio_dataset(self, src: rasterio.io.DatasetReader) -> Dict[str, Any]:
        bounds = src.bounds
        nodata = src.nodata
        bands_data = []

        for i in range(1, src.count + 1):
            band = src.read(i).astype(np.float32)
            # Mask out nodata values if defined
            if nodata is not None:
                band[band == nodata] = np.nan
            bands_data.append(band)

        return {
            "format": "GeoTIFF",
            "crs": str(src.crs),
            "width": src.width,
            "height": src.height,
            "count": src.count,
            "bounds": {
                "min_lon": float(bounds.left),
                "min_lat": float(bounds.bottom),
                "max_lon": float(bounds.right),
                "max_lat": float(bounds.top),
            },
            "transform": [float(x) for x in src.transform][:6],
            "nodata_value": float(nodata) if nodata is not None else None,
            "bands": bands_data,
        }

    def read_netcdf(
        self,
        file_source: Union[str, bytes, bytearray, memoryview]
    ) -> Dict[str, Any]:
        """
        Read multi-dimensional NetCDF / Climate grid using Xarray.
        Extracts data variables, dimensions, coordinates, and metadata attributes.
        """
        if isinstance(file_source, (bytes, bytearray, memoryview)):
            ds = xr.open_dataset(io.BytesIO(bytes(file_source)))
        else:
            ds = xr.open_dataset(file_source)

        variables = {}
        for var_name in ds.data_vars:
            da = ds[var_name]
            # Replace fill values with np.nan without converting real zeros
            arr = da.values.astype(np.float32)
            for fv in STANDARD_FILL_VALUES:
                if abs(fv) > 1e5:
                    arr[arr > 1e10] = np.nan
                    arr[arr < -1e10] = np.nan
                else:
                    arr[np.isclose(arr, fv, atol=1e-2)] = np.nan

            variables[str(var_name)] = {
                "dims": list(da.dims),
                "shape": list(da.shape),
                "units": da.attrs.get("units", "Dimensionless"),
                "long_name": da.attrs.get("long_name", str(var_name)),
                "array": arr,
            }

        coords = {}
        for c in ds.coords:
            c_vals = ds[c].values
            if np.issubdtype(c_vals.dtype, np.datetime64):
                coords[str(c)] = [pd.to_datetime(t).isoformat() for t in c_vals]
            else:
                coords[str(c)] = [float(x) for x in c_vals]

        ds_dims = dict(ds.sizes) if hasattr(ds, "sizes") else dict(ds.dims)
        ds_attrs = dict(ds.attrs)
        ds.close()

        return {
            "format": "NetCDF",
            "dims": ds_dims,
            "coords": coords,
            "variables": variables,
            "attrs": ds_attrs,
        }

    def read_tabular_timeseries(
        self,
        source: Union[str, io.StringIO, pd.DataFrame, List[Dict[str, Any]]]
    ) -> pd.DataFrame:
        """Read in-situ, reanalysis, or tabular scientific data using Pandas."""
        if isinstance(source, pd.DataFrame):
            df = source.copy()
        elif isinstance(source, list):
            df = pd.DataFrame(source)
        else:
            df = pd.read_csv(source)

        # Ensure date/timestamp parsing if present
        date_cols = [c for c in df.columns if any(k in c.lower() for k in ["date", "time", "timestamp", "datetime", "epoch"])]
        if date_cols:
            df[date_cols[0]] = pd.to_datetime(df[date_cols[0]])
            df = df.sort_values(by=date_cols[0])

        return df

    # =========================================================================
    # 2. VALIDATION & QUALITY CONTROL
    # =========================================================================

    def validate_measurement(
        self,
        value: Optional[float],
        domain: str
    ) -> Dict[str, Any]:
        """
        Validate single scientific measurement against domain physical bounds.
        Distinguishes real physical zeros from missing data.
        """
        if value is None or (isinstance(value, float) and (np.isnan(value) or np.isinf(value))):
            return {
                "is_valid": False,
                "is_missing": True,
                "quality_flag": "MISSING_DATA",
                "clean_value": None,
                "notes": "Null, NaN, or infinite value received."
            }

        # Check standard fill values (with floating point tolerance and extreme order of magnitude)
        val = float(value)
        for fv in STANDARD_FILL_VALUES:
            if abs(fv) > 1e5:
                if abs(val) > 1e10:
                    return {
                        "is_valid": False,
                        "is_missing": True,
                        "quality_flag": "FILL_VALUE",
                        "clean_value": None,
                        "notes": f"Standard scientific fill value {val:.2e} detected."
                    }
            elif abs(val - fv) < 1e-2:
                return {
                    "is_valid": False,
                    "is_missing": True,
                    "quality_flag": "FILL_VALUE",
                    "clean_value": None,
                    "notes": f"Standard scientific fill value {val} detected."
                }
        spec = self.bounds.get(domain)
        if not spec:
            return {
                "is_valid": True,
                "is_missing": False,
                "quality_flag": "OPTIMAL",
                "clean_value": val,
                "notes": "No domain physical bounds specified."
            }

        if val < spec["min"] or val > spec["max"]:
            return {
                "is_valid": False,
                "is_missing": False,
                "quality_flag": "OUT_OF_BOUNDS",
                "clean_value": val,
                "notes": f"Value {val} violates physical limits [{spec['min']}, {spec['max']} {spec['unit']}]."
            }

        return {
            "is_valid": True,
            "is_missing": False,
            "quality_flag": "OPTIMAL",
            "clean_value": val,
            "notes": "Passes scientific sanity bounds."
        }

    # =========================================================================
    # 3. SCIENTIFIC STATISTICAL SUMMARIES
    # =========================================================================

    def calculate_statistical_summary(
        self,
        values: Union[List[Optional[float]], np.ndarray, pd.Series],
        domain: str
    ) -> Dict[str, Any]:
        """
        Calculate statistical summaries preserving original physical units.
        Handles missing values gracefully without converting them to zero.
        """
        if isinstance(values, pd.Series):
            arr = values.to_numpy(dtype=np.float64)
        elif isinstance(values, list):
            cleaned = []
            for v in values:
                if v is None:
                    cleaned.append(np.nan)
                else:
                    fv_found = False
                    fval = float(v)
                    for fv in STANDARD_FILL_VALUES:
                        if (abs(fv) > 1e5 and abs(fval) > 1e10) or abs(fval - fv) < 1e-2:
                            cleaned.append(np.nan)
                            fv_found = True
                            break
                    if not fv_found:
                        cleaned.append(fval)
            arr = np.array(cleaned, dtype=np.float64)
        else:
            arr = np.array(values, dtype=np.float64).flatten()

        # Mask standard fill values with numeric tolerance
        for fv in STANDARD_FILL_VALUES:
            if abs(fv) > 1e5:
                arr[arr > 1e10] = np.nan
                arr[arr < -1e10] = np.nan
            else:
                arr[np.isclose(arr, fv, atol=1e-2)] = np.nan

        total_count = int(arr.size)
        valid_mask = ~np.isnan(arr)
        valid_count = int(np.count_nonzero(valid_mask))
        missing_count = total_count - valid_count
        valid_pct = round((valid_count / total_count * 100.0), 2) if total_count > 0 else 0.0

        spec = self.bounds.get(domain, {"unit": "Units"})

        if valid_count == 0:
            return {
                "domain": domain,
                "unit": spec["unit"],
                "total_points": total_count,
                "valid_points": 0,
                "missing_points": missing_count,
                "valid_percentage": 0.0,
                "mean": None,
                "median": None,
                "std_dev": None,
                "min": None,
                "max": None,
                "range": None,
                "quality_flag": "ALL_DATA_MISSING"
            }

        valid_arr = arr[valid_mask]
        mean_val = float(np.mean(valid_arr))
        median_val = float(np.median(valid_arr))
        std_val = float(np.std(valid_arr))
        min_val = float(np.min(valid_arr))
        max_val = float(np.max(valid_arr))
        range_val = float(max_val - min_val)

        return {
            "domain": domain,
            "unit": spec["unit"],
            "total_points": total_count,
            "valid_points": valid_count,
            "missing_points": missing_count,
            "valid_percentage": valid_pct,
            "mean": round(mean_val, 3),
            "median": round(median_val, 3),
            "std_dev": round(std_val, 3),
            "min": round(min_val, 3),
            "max": round(max_val, 3),
            "range": round(range_val, 3),
            "quality_flag": "OPTIMAL" if missing_count == 0 else "PARTIAL_VALID"
        }

    # =========================================================================
    # 4. MEANING-PRESERVING NORMALIZATION
    # =========================================================================

    def normalize_measurement(
        self,
        value: Optional[float],
        domain: str
    ) -> Optional[float]:
        """
        Normalize physical measurement to [0.0, 1.0] preserving scientific meaning.
        Returns None for missing data (never converts missing to zero).
        """
        if value is None or np.isnan(value):
            return None

        val = float(value)
        spec = self.bounds.get(domain)
        if not spec:
            return float(np.clip(val, 0.0, 1.0))

        norm_min = spec["norm_min"]
        norm_max = spec["norm_max"]

        if norm_max <= norm_min:
            return 0.5

        # Domain-specific curve mapping
        if domain == "precipitation":
            # Precipitation follows power-law / log distribution: preserve zero as 0.0
            if val <= 0.0:
                return 0.0
            # S-curve log compression so light rain (1-5mm) is distinct from torrential rain (50mm+)
            normalized = math.log1p(val) / math.log1p(norm_max)
            return float(np.clip(normalized, 0.0, 1.0))

        # Linear mapping within calibrated reference bounds
        normalized = (val - norm_min) / (norm_max - norm_min)
        return float(np.clip(normalized, 0.0, 1.0))

    # =========================================================================
    # 5. SONIFICATION SEQUENCE GENERATION
    # =========================================================================

    def generate_sonification_sequence(
        self,
        records: List[Dict[str, Any]],
        domain: str,
        dataset_meta: Dict[str, Any],
        geo_location: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Produce structured numerical sequences for the Web Audio sonification engine.
        Every record contains:
        - Timestamp
        - Original measurement
        - Original unit
        - Normalized value
        - Geographic location
        - Dataset metadata
        - Quality information
        """
        spec = self.bounds.get(domain, {"unit": "Units"})
        unit_str = spec["unit"]

        sequence = []
        for rec in records:
            raw_val = rec.get("value")
            ts = rec.get("timestamp") or rec.get("date") or datetime.date.today().isoformat()
            if isinstance(ts, pd.Timestamp):
                ts = ts.isoformat()

            # Validate input
            val_info = self.validate_measurement(raw_val, domain)
            norm_val = self.normalize_measurement(val_info["clean_value"], domain) if val_info["is_valid"] else None

            # Calculate acoustic synthesis parameters
            if norm_val is not None:
                # Map [0.0, 1.0] to audible frequency (MIDI 36 = C2 65.4 Hz to MIDI 84 = C6 1046.5 Hz)
                midi_note = round(36.0 + norm_val * 48.0)
                pitch_hz = round(440.0 * (2.0 ** ((midi_note - 69.0) / 12.0)), 2)
                cutoff_hz = round(350.0 + norm_val * 5000.0)
                warmth = round(norm_val * 0.8, 2)
            else:
                # Missing data receives mute acoustic event
                midi_note = None
                pitch_hz = None
                cutoff_hz = 0
                warmth = 0.0

            seq_item = {
                "timestamp": str(ts),
                "original_measurement": val_info["clean_value"],
                "original_unit": unit_str,
                "normalized_value": norm_val,
                "geographic_location": {
                    "latitude": geo_location.get("latitude", 0.0),
                    "longitude": geo_location.get("longitude", 0.0),
                    "region_name": geo_location.get("region_name", "Global Observatory"),
                    "elevation_m": geo_location.get("elevation_m"),
                },
                "dataset_metadata": {
                    "dataset_id": dataset_meta.get("id", "dataset-generic"),
                    "dataset_name": dataset_meta.get("dataset_name", "Earth Science Dataset"),
                    "source": dataset_meta.get("source", "NASA / Open-Meteo"),
                    "spatial_resolution": dataset_meta.get("resolution", "Gridded"),
                    "temporal_frequency": dataset_meta.get("temporal_frequency", "Daily"),
                    "processing_information": dataset_meta.get("processing_information", "Standard calibrated pipeline"),
                },
                "quality_information": {
                    "quality_flag": val_info["quality_flag"],
                    "is_valid": val_info["is_valid"],
                    "is_missing": val_info["is_missing"],
                    "qc_notes": val_info["notes"],
                },
                "sonification_telemetry": {
                    "acoustic_pitch_hz": pitch_hz,
                    "midi_note": midi_note,
                    "timbre_brightness": norm_val,
                    "filter_cutoff_hz": cutoff_hz,
                    "harmonic_warmth": warmth,
                    "audio_event": "NOTE_ON" if norm_val is not None else "REST_SILENCE_DROPOUT"
                }
            }
            sequence.append(seq_item)

        return sequence

    # =========================================================================
    # 6. SPECIALIZED DOMAIN PROCESSORS
    # =========================================================================

    def process_temperature_series(
        self,
        time_series: List[Dict[str, Any]],
        location: Dict[str, Any],
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Process multi-year or daily temperature time series."""
        meta = metadata or {
            "id": "merra2-surface-temperature",
            "dataset_name": "NASA MERRA-2 2-Meter Air Temperature (T2M)",
            "source": "NASA POWER / GMAO",
            "resolution": "0.5° × 0.625°",
            "temporal_frequency": "Daily",
            "processing_information": "GMAO MERRA-2 assimilation"
        }

        stats = self.calculate_statistical_summary([r.get("value") for r in time_series], "temperature")
        sequence = self.generate_sonification_sequence(time_series, "temperature", meta, location)

        return {
            "domain": "temperature",
            "dataset_metadata": meta,
            "geographic_location": location,
            "statistical_summary": stats,
            "sonification_sequence": sequence,
            "total_frames": len(sequence)
        }

    def process_precipitation_series(
        self,
        time_series: List[Dict[str, Any]],
        location: Dict[str, Any],
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Process precipitation time series.
        Preserves real zero precipitation events while flagging missing values.
        """
        meta = metadata or {
            "id": "merra2-daily-precipitation",
            "dataset_name": "NASA POWER Bias-Corrected Precipitation (PRECTOTCORR)",
            "source": "NASA POWER / GPCP",
            "resolution": "0.5° × 0.625°",
            "temporal_frequency": "Daily",
            "processing_information": "GPCP rain gauge corrected"
        }

        stats = self.calculate_statistical_summary([r.get("value") for r in time_series], "precipitation")
        sequence = self.generate_sonification_sequence(time_series, "precipitation", meta, location)

        # Count zero-rain dry days vs rainy days
        valid_vals = [r.get("value") for r in time_series if r.get("value") is not None and not np.isnan(r.get("value"))]
        dry_days = sum(1 for v in valid_vals if v == 0.0)
        rainy_days = sum(1 for v in valid_vals if v > 0.0)

        stats["dry_days_count"] = dry_days
        stats["rainy_days_count"] = rainy_days

        return {
            "domain": "precipitation",
            "dataset_metadata": meta,
            "geographic_location": location,
            "statistical_summary": stats,
            "sonification_sequence": sequence,
            "total_frames": len(sequence)
        }

    def process_wind_series(
        self,
        time_series: List[Dict[str, Any]],
        location: Dict[str, Any],
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Process 10-meter wind speed series with Beaufort scale classification."""
        meta = metadata or {
            "id": "merra2-wind-speed-10m",
            "dataset_name": "NASA MERRA-2 10-Meter Wind Speed (WS10M)",
            "source": "NASA POWER / GMAO",
            "resolution": "0.5° × 0.625°",
            "temporal_frequency": "Daily",
            "processing_information": "Surface layer similarity theory"
        }

        stats = self.calculate_statistical_summary([r.get("value") for r in time_series], "wind_speed")
        sequence = self.generate_sonification_sequence(time_series, "wind_speed", meta, location)

        return {
            "domain": "wind_speed",
            "dataset_metadata": meta,
            "geographic_location": location,
            "statistical_summary": stats,
            "sonification_sequence": sequence,
            "total_frames": len(sequence)
        }

    def process_vegetation_raster(
        self,
        raster_data: Union[str, bytes, bytearray, memoryview, np.ndarray],
        location: Dict[str, Any],
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Process vegetation canopy raster (e.g. MODIS NDVI or Sentinel-2).
        Calculates vegetation health statistics and zonal spatial sequence.
        """
        meta = metadata or {
            "id": "modis-terra-ndvi",
            "dataset_name": "MODIS Terra 8-Day NDVI (MOD13A2)",
            "source": "NASA LP DAAC",
            "resolution": "250m",
            "temporal_frequency": "8-Day",
            "processing_information": "Red and NIR surface reflectance ratio"
        }

        if isinstance(raster_data, (str, bytes, bytearray, memoryview)):
            parsed = self.read_geotiff(raster_data)
            ndvi_arr = parsed["bands"][0]
        else:
            ndvi_arr = raster_data.astype(np.float32)

        stats = self.calculate_statistical_summary(ndvi_arr, "vegetation")

        # Extract 16 zonal subdivisions across the raster for dynamic spatial sonification
        h, w = ndvi_arr.shape[:2]
        grid_rows, grid_cols = 4, 4
        zonal_records = []

        now_iso = datetime.date.today().isoformat()
        for r in range(grid_rows):
            for c in range(grid_cols):
                sub = ndvi_arr[r*(h//grid_rows):(r+1)*(h//grid_rows), c*(w//grid_cols):(c+1)*(w//grid_cols)]
                mean_zonal = float(np.nanmean(sub)) if np.count_nonzero(~np.isnan(sub)) > 0 else None
                zonal_records.append({
                    "timestamp": now_iso,
                    "value": mean_zonal,
                    "zone": f"R{r+1}C{c+1}"
                })

        sequence = self.generate_sonification_sequence(zonal_records, "vegetation", meta, location)

        return {
            "domain": "vegetation",
            "dataset_metadata": meta,
            "geographic_location": location,
            "statistical_summary": stats,
            "sonification_sequence": sequence,
            "total_frames": len(sequence)
        }

    def process_ocean_grid(
        self,
        grid_data: Union[str, bytes, bytearray, memoryview, xr.Dataset, np.ndarray],
        location: Dict[str, Any],
        variable_name: str = "sst",
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Process ocean grid (e.g. GHRSST MUR Sea Surface Temperature).
        Uses Xarray to extract spatial and temporal slices.
        """
        meta = metadata or {
            "id": "ghrsst-mur-sst",
            "dataset_name": "GHRSST Multi-Scale Ultra-High Resolution Sea Surface Temperature",
            "source": "NASA PO.DAAC / JPL",
            "resolution": "0.01° (~1 km)",
            "temporal_frequency": "Daily",
            "processing_information": "Multi-resolution variational analysis"
        }

        if isinstance(grid_data, (str, bytes, bytearray, memoryview)):
            parsed = self.read_netcdf(grid_data)
            sst_data = parsed["variables"].get(variable_name, {}).get("array")
            if sst_data is None:
                # Fallback to first available variable
                first_var = list(parsed["variables"].keys())[0]
                sst_data = parsed["variables"][first_var]["array"]
        elif isinstance(grid_data, xr.Dataset):
            sst_data = grid_data[variable_name].values.astype(np.float32)
        else:
            sst_data = np.array(grid_data, dtype=np.float32)

        stats = self.calculate_statistical_summary(sst_data, "ocean_sst")

        # Generate spatial sequence points across the grid
        flat_valid = sst_data.flatten()
        stride = max(1, len(flat_valid) // 16)
        samples = flat_valid[::stride][:16]

        sample_records = [
            {"timestamp": datetime.date.today().isoformat(), "value": float(v) if not np.isnan(v) else None}
            for v in samples
        ]
        sequence = self.generate_sonification_sequence(sample_records, "ocean_sst", meta, location)

        return {
            "domain": "ocean_sst",
            "dataset_metadata": meta,
            "geographic_location": location,
            "statistical_summary": stats,
            "sonification_sequence": sequence,
            "total_frames": len(sequence)
        }


# Singleton instance
earth_data_engine = EarthDataProcessingEngine()
