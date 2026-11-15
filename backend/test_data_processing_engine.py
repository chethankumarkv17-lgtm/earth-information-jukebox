"""
Test Suite for NASA Earth Data Processing Engine
2026 NASA Space Apps Challenge — Earth Information Jukebox

Tests:
1. GeoTIFF reading via Rasterio with real NDVI raster and nodata masks.
2. NetCDF reading via Xarray with 2D Sea Surface Temperature (SST) grid and fill values.
3. Tabular time-series reading via Pandas with date sorting and missing values.
4. Physical sanity validation and fill-value detection.
5. Missing values preservation: NEVER silently convert missing values to zero.
6. Scientific meaning preservation in normalization (logarithmic for precipitation, linear for temperature/wind).
7. Statistical summary calculations preserving original physical units.
8. Sonification sequence generation with exact 8-part schema.
9. Domain processing for Temperature, Precipitation, Wind Speed, Vegetation, and Ocean SST.
"""

import sys
import io
import datetime
import numpy as np
import pandas as pd
import xarray as xr
import rasterio
from rasterio.transform import from_origin
from rasterio.io import MemoryFile

from app.services.geospatial.data_processing_engine import (
    earth_data_engine,
    EarthDataProcessingEngine,
    DOMAIN_PHYSICAL_BOUNDS,
    STANDARD_FILL_VALUES
)


def create_sample_geotiff_bytes() -> bytes:
    """Generate in-memory GeoTIFF raster with realistic NDVI values and nodata."""
    width, height = 32, 32
    # Spatial transform: centered on Amazon Rainforest (-3.5 lat, -62.0 lon)
    transform = from_origin(-62.5, -3.0, 0.03125, 0.03125)
    crs = "EPSG:4326"

    # NDVI values between 0.1 and 0.88, with some water/bare soil (-0.1) and nodata (-9999.0)
    data = np.linspace(0.2, 0.85, width * height, dtype=np.float32).reshape((height, width))
    data[0:4, 0:4] = -9999.0  # Missing/NoData fill
    data[10:14, 10:14] = -0.05  # River/water surface

    memfile = MemoryFile()
    with memfile.open(
        driver="GTiff",
        height=height,
        width=width,
        count=1,
        dtype=np.float32,
        crs=crs,
        transform=transform,
        nodata=-9999.0
    ) as dataset:
        dataset.write(data, 1)

    return memfile.read()


def create_sample_netcdf_bytes() -> bytes:
    """Generate in-memory NetCDF with multi-dimensional Sea Surface Temperature grid."""
    lats = np.linspace(-10.0, 10.0, 8)
    lons = np.linspace(140.0, 170.0, 8)
    time = pd.date_range("2024-01-01", periods=3, freq="D")

    # Equatorial Pacific SST between 27.5°C and 30.5°C
    sst_values = np.zeros((3, 8, 8), dtype=np.float32)
    for t in range(3):
        sst_values[t, :, :] = 28.5 + 0.5 * t + np.random.uniform(-0.4, 0.4, (8, 8))

    # Add fill values
    sst_values[0, 0, 0] = -999.0
    sst_values[1, 7, 7] = 1e20

    ds = xr.Dataset(
        data_vars={
            "sst": (["time", "lat", "lon"], sst_values, {
                "units": "°C",
                "long_name": "Sea Surface Foundation Temperature",
                "_FillValue": -999.0
            })
        },
        coords={
            "lat": (["lat"], lats, {"units": "degrees_north"}),
            "lon": (["lon"], lons, {"units": "degrees_east"}),
            "time": time
        },
        attrs={
            "title": "GHRSST Level 4 SST Synthetic Grid",
            "institution": "NASA JPL / PO.DAAC",
            "source": "Satellite microwave and infrared fusion"
        }
    )

    nc_bytes = ds.to_netcdf()
    ds.close()
    return nc_bytes


def test_1_geotiff_reader_and_vegetation_processing():
    print("[TEST 1] Testing GeoTIFF reader via Rasterio and Vegetation Processing...")
    tif_bytes = create_sample_geotiff_bytes()

    parsed = earth_data_engine.read_geotiff(tif_bytes)
    assert parsed["format"] == "GeoTIFF", f"Expected GeoTIFF format, got {parsed['format']}"
    assert parsed["width"] == 32 and parsed["height"] == 32, "Raster dimensions mismatch"
    assert parsed["count"] == 1, "Expected 1 band"
    assert "bounds" in parsed and "transform" in parsed, "Missing spatial metadata"
    assert parsed["nodata_value"] == -9999.0, f"Expected nodata -9999.0, got {parsed['nodata_value']}"

    # Verify that nodata was masked to np.nan and NOT converted to zero
    band = parsed["bands"][0]
    assert np.isnan(band[0, 0]), "Fill value was not properly converted to np.nan"
    assert not np.isnan(band[20, 20]), "Valid NDVI data should remain valid"

    # Process vegetation
    result = earth_data_engine.process_vegetation_raster(
        raster_data=tif_bytes,
        location={"latitude": -3.5, "longitude": -62.0, "region_name": "Amazon Basin"},
        metadata={"id": "test-ndvi", "dataset_name": "MODIS Terra NDVI"}
    )
    assert result["domain"] == "vegetation"
    assert result["statistical_summary"]["unit"] == "NDVI"
    assert result["statistical_summary"]["valid_points"] > 0
    assert result["statistical_summary"]["missing_points"] == 16  # 4x4 block
    assert len(result["sonification_sequence"]) == 16  # 4x4 zonal subdivisions
    print("  -> PASSED: GeoTIFF read, nodata masked correctly, vegetation processed with 16 zones.")


def test_2_netcdf_reader_and_ocean_processing():
    print("[TEST 2] Testing NetCDF reader via Xarray and Ocean SST Processing...")
    nc_bytes = create_sample_netcdf_bytes()

    parsed = earth_data_engine.read_netcdf(nc_bytes)
    assert parsed["format"] == "NetCDF"
    assert "sst" in parsed["variables"], "Variable 'sst' missing from NetCDF"
    sst_info = parsed["variables"]["sst"]
    assert sst_info["units"] == "°C"
    assert sst_info["dims"] == ["time", "lat", "lon"]
    assert sst_info["shape"] == [3, 8, 8]

    # Process ocean grid
    result = earth_data_engine.process_ocean_grid(
        grid_data=nc_bytes,
        location={"latitude": 0.0, "longitude": 155.0, "region_name": "Pacific Warm Pool"},
        variable_name="sst"
    )
    assert result["domain"] == "ocean_sst"
    assert result["statistical_summary"]["unit"] == "°C"
    assert result["statistical_summary"]["mean"] > 25.0 and result["statistical_summary"]["mean"] < 35.0
    assert result["statistical_summary"]["missing_points"] >= 2  # -999 and 1e20 fill values
    assert len(result["sonification_sequence"]) == 16
    print("  -> PASSED: NetCDF read, variables extracted, ocean SST processed with acoustic parameters.")


def test_3_tabular_timeseries_reader():
    print("[TEST 3] Testing Tabular Time-Series reader via Pandas...")
    csv_data = io.StringIO(
        "date,temperature,precipitation,wind_speed\n"
        "2024-01-01,15.2,0.0,5.4\n"
        "2024-01-02,16.8,4.2,7.1\n"
        "2024-01-03,14.0,-999.0,3.2\n"
        "2024-01-04,18.5,12.0,8.0\n"
    )
    df = earth_data_engine.read_tabular_timeseries(csv_data)
    assert len(df) == 4
    assert pd.api.types.is_datetime64_any_dtype(df["date"]), "Date column should be parsed as datetime"
    print("  -> PASSED: Tabular CSV parsed, datetime column converted.")


def test_4_physical_bounds_validation():
    print("[TEST 4] Testing physical domain bounds validation and fill-value detection...")
    # Valid temperature
    res_valid = earth_data_engine.validate_measurement(24.5, "temperature")
    assert res_valid["is_valid"] is True
    assert res_valid["quality_flag"] == "OPTIMAL"

    # Extreme temperature out of physical bounds
    res_high = earth_data_engine.validate_measurement(95.0, "temperature")
    assert res_high["is_valid"] is False
    assert res_high["quality_flag"] == "OUT_OF_BOUNDS"

    # Fill value -999.0
    res_fill = earth_data_engine.validate_measurement(-999.0, "temperature")
    assert res_fill["is_valid"] is False
    assert res_fill["is_missing"] is True
    assert res_fill["quality_flag"] == "FILL_VALUE"
    assert res_fill["clean_value"] is None

    # None / NaN
    res_nan = earth_data_engine.validate_measurement(np.nan, "wind_speed")
    assert res_nan["is_valid"] is False
    assert res_nan["is_missing"] is True
    assert res_nan["clean_value"] is None
    print("  -> PASSED: Physical bounds and fill values detected accurately.")


def test_5_never_silently_convert_missing_values_to_zero():
    print("[TEST 5] Testing critical invariant: NEVER convert missing values to zero...")
    # Test precipitation series:
    # Day 1: 0.0 mm (REAL ZERO - dry day)
    # Day 2: None (MISSING)
    # Day 3: -9999.0 (FILL VALUE)
    # Day 4: 15.0 mm (RAINY DAY)
    series = [
        {"timestamp": "2024-05-01", "value": 0.0},
        {"timestamp": "2024-05-02", "value": None},
        {"timestamp": "2024-05-03", "value": -9999.0},
        {"timestamp": "2024-05-04", "value": 15.0},
    ]

    loc = {"latitude": 40.71, "longitude": -74.00, "region_name": "New York"}
    result = earth_data_engine.process_precipitation_series(series, loc)

    stats = result["statistical_summary"]
    seq = result["sonification_sequence"]

    # 1. Total points = 4, Valid points = 2 (0.0 and 15.0), Missing = 2
    assert stats["total_points"] == 4, f"Expected 4 points, got {stats['total_points']}"
    assert stats["valid_points"] == 2, f"Expected 2 valid points, got {stats['valid_points']}"
    assert stats["missing_points"] == 2, f"Expected 2 missing points, got {stats['missing_points']}"

    # 2. Dry day count should be exactly 1, rainy day count should be exactly 1
    assert stats["dry_days_count"] == 1, f"Expected 1 dry day, got {stats['dry_days_count']}"
    assert stats["rainy_days_count"] == 1, f"Expected 1 rainy day, got {stats['rainy_days_count']}"

    # 3. Mean should be (0.0 + 15.0) / 2 = 7.5 mm, NOT (0.0 + 0.0 + 0.0 + 15.0) / 4 = 3.75 mm!
    assert stats["mean"] == 7.5, f"Mean should be 7.5 mm, got {stats['mean']}"

    # 4. Check sequence items:
    # Day 1: real 0.0 -> normalized_value = 0.0, audio_event = NOTE_ON
    assert seq[0]["original_measurement"] == 0.0
    assert seq[0]["normalized_value"] == 0.0
    assert seq[0]["quality_information"]["is_missing"] is False
    assert seq[0]["sonification_telemetry"]["audio_event"] == "NOTE_ON"

    # Day 2: None -> original_measurement = None, normalized_value = None, REST_SILENCE_DROPOUT
    assert seq[1]["original_measurement"] is None
    assert seq[1]["normalized_value"] is None
    assert seq[1]["quality_information"]["is_missing"] is True
    assert seq[1]["sonification_telemetry"]["audio_event"] == "REST_SILENCE_DROPOUT"

    # Day 3: -9999.0 -> original_measurement = None, normalized_value = None, REST_SILENCE_DROPOUT
    assert seq[2]["original_measurement"] is None
    assert seq[2]["normalized_value"] is None
    assert seq[2]["quality_information"]["is_missing"] is True
    assert seq[2]["quality_information"]["quality_flag"] == "FILL_VALUE"
    assert seq[2]["sonification_telemetry"]["audio_event"] == "REST_SILENCE_DROPOUT"

    # Day 4: 15.0 -> valid rain
    assert seq[3]["original_measurement"] == 15.0
    assert seq[3]["normalized_value"] > 0.0
    assert seq[3]["quality_information"]["is_valid"] is True
    print("  -> PASSED: Missing values are never converted to zero, real zeros are preserved accurately.")


def test_6_scientific_meaning_preserved_in_normalization():
    print("[TEST 6] Testing scientific meaning preservation in normalization...")
    # Precipitation: Logarithmic S-curve
    norm_0 = earth_data_engine.normalize_measurement(0.0, "precipitation")
    norm_5 = earth_data_engine.normalize_measurement(5.0, "precipitation")
    norm_20 = earth_data_engine.normalize_measurement(20.0, "precipitation")
    norm_60 = earth_data_engine.normalize_measurement(60.0, "precipitation")

    assert norm_0 == 0.0, "Zero precipitation must normalize to 0.0"
    assert 0.0 < norm_5 < norm_20 < norm_60 <= 1.0, "Precipitation must preserve monotonic scale"
    # Drizzle (5mm) should occupy a distinct audible band, not be flattened against 0:
    assert norm_5 > 0.35, f"Drizzle should have sufficient acoustic resolution: got {norm_5}"

    # Temperature: Linear within calibrated limits (-30 to +50 °C)
    norm_t_freeze = earth_data_engine.normalize_measurement(0.0, "temperature")
    norm_t_body = earth_data_engine.normalize_measurement(37.0, "temperature")
    assert 0.35 < norm_t_freeze < 0.40, f"0°C freezing point should be around 0.375, got {norm_t_freeze}"
    assert 0.80 < norm_t_body < 0.85, f"37°C body temp should be around 0.837, got {norm_t_body}"

    # Missing value normalization should return None
    assert earth_data_engine.normalize_measurement(None, "temperature") is None
    print("  -> PASSED: Domain normalization preserves nuanced scientific physical meaning.")


def test_7_sonification_sequence_schema_completeness():
    print("[TEST 7] Testing exact 8-part sonification sequence schema completeness...")
    time_series = [
        {"timestamp": "2024-07-01", "value": 28.5},
        {"timestamp": "2024-07-02", "value": 31.2},
    ]
    loc = {"latitude": 28.61, "longitude": 77.20, "region_name": "New Delhi", "elevation_m": 216}
    meta = {
        "id": "delhi-heat-index",
        "dataset_name": "NASA MERRA-2 2-Meter Temperature",
        "source": "NASA POWER / GMAO",
        "resolution": "0.5° × 0.625°",
        "temporal_frequency": "Daily",
        "processing_information": "GMAO assimilation"
    }

    result = earth_data_engine.process_temperature_series(time_series, loc, meta)
    seq = result["sonification_sequence"]
    assert len(seq) == 2

    required_keys = [
        "timestamp",
        "original_measurement",
        "original_unit",
        "normalized_value",
        "geographic_location",
        "dataset_metadata",
        "quality_information",
        "sonification_telemetry"
    ]

    for item in seq:
        for k in required_keys:
            assert k in item, f"Missing required sonification sequence key: {k}"

        # Verify geographic fields
        assert item["geographic_location"]["latitude"] == 28.61
        assert item["geographic_location"]["region_name"] == "New Delhi"

        # Verify dataset metadata fields
        assert item["dataset_metadata"]["dataset_id"] == "delhi-heat-index"
        assert item["dataset_metadata"]["source"] == "NASA POWER / GMAO"

        # Verify sonification telemetry fields
        st = item["sonification_telemetry"]
        assert "acoustic_pitch_hz" in st
        assert "midi_note" in st
        assert "filter_cutoff_hz" in st
        assert "harmonic_warmth" in st
        assert st["acoustic_pitch_hz"] > 100.0, "Audible pitch frequency must be > 100 Hz"

    print("  -> PASSED: All 8 required schema components verified with full telemetry.")


def test_8_all_five_domains_processing():
    print("[TEST 8] Testing processing across all 5 scientific domains...")
    loc = {"latitude": 0.0, "longitude": 0.0, "region_name": "Null Island"}

    # 1. Temperature
    res_temp = earth_data_engine.process_temperature_series(
        [{"timestamp": "2024-01-01", "value": 22.0}, {"timestamp": "2024-01-02", "value": 23.5}],
        loc
    )
    assert res_temp["domain"] == "temperature"
    assert res_temp["statistical_summary"]["unit"] == "°C"

    # 2. Precipitation
    res_precip = earth_data_engine.process_precipitation_series(
        [{"timestamp": "2024-01-01", "value": 0.0}, {"timestamp": "2024-01-02", "value": 12.4}],
        loc
    )
    assert res_precip["domain"] == "precipitation"
    assert res_precip["statistical_summary"]["unit"] == "mm"

    # 3. Wind Speed
    res_wind = earth_data_engine.process_wind_series(
        [{"timestamp": "2024-01-01", "value": 4.5}, {"timestamp": "2024-01-02", "value": 11.2}],
        loc
    )
    assert res_wind["domain"] == "wind_speed"
    assert res_wind["statistical_summary"]["unit"] == "m/s"

    # 4. Vegetation
    arr_veg = np.full((16, 16), 0.72, dtype=np.float32)
    res_veg = earth_data_engine.process_vegetation_raster(arr_veg, loc)
    assert res_veg["domain"] == "vegetation"
    assert res_veg["statistical_summary"]["unit"] == "NDVI"

    # 5. Ocean SST
    arr_sst = np.full((16, 16), 29.1, dtype=np.float32)
    res_sst = earth_data_engine.process_ocean_grid(arr_sst, loc)
    assert res_sst["domain"] == "ocean_sst"
    assert res_sst["statistical_summary"]["unit"] == "°C"

    print("  -> PASSED: All 5 scientific domains processed successfully.")


if __name__ == "__main__":
    print("=================================================================")
    print("RUNNING NASA EARTH DATA PROCESSING ENGINE TEST SUITE")
    print("=================================================================")
    test_1_geotiff_reader_and_vegetation_processing()
    test_2_netcdf_reader_and_ocean_processing()
    test_3_tabular_timeseries_reader()
    test_4_physical_bounds_validation()
    test_5_never_silently_convert_missing_values_to_zero()
    test_6_scientific_meaning_preserved_in_normalization()
    test_7_sonification_sequence_schema_completeness()
    test_8_all_five_domains_processing()
    print("=================================================================")
    print("ALL 8 VERIFICATION TESTS PASSED SUCCESSFULLY! (100% SUCCESS)")
    print("=================================================================")
