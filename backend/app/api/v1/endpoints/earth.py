"""
NASA Earth Information Jukebox Core API Endpoints
2026 NASA Space Apps Challenge
Implements /api/earth/layers, /imagery, /region, /datasets, /analyze, /timeline, /sentinel
"""

import os
import io
import base64
import datetime
from typing import Optional, List
from fastapi import APIRouter, Query, HTTPException, UploadFile, File, Form, Response, status
from fastapi.responses import StreamingResponse
import numpy as np
import pandas as pd
import cv2

from app.core.config import settings
from app.services.cache import geo_cache
from app.services.geospatial.geospatial_engine import (
    BoundingBox, 
    extract_visual_features_from_image
)
from app.services.providers.gibs_client import gibs_client, GIBS_LAYER_SPECS
from app.services.providers.copernicus_client import copernicus_client
from app.services.earth_data_service import earth_data_service, VERIFIED_DATASET_CATALOG
from app.services.processors import process_earth_data, DOMAIN_PROCESSORS, LAYER_TO_DOMAIN
from app.services.geospatial.data_processing_engine import earth_data_engine, DOMAIN_PHYSICAL_BOUNDS
from app.schemas.earth import (
    EarthLayersResponse,
    LayerSpecSchema,
    EarthRegionAnalysisResponse,
    EarthDatasetsResponse,
    DatasetAttributionSchema,
    EarthTimelineResponse,
    TimelineFrameSchema,
    ProcessTimeseriesRequest,
)

router = APIRouter(prefix="", tags=["Earth Information Jukebox"])


# Curated Geographic Regions with Verified Lat/Lon Centerpoints
KNOWN_REGIONS = {
    "amazon_basin": {"name": "Amazon Basin Rainforest", "lat": -3.4653, "lon": -62.2159, "radius_km": 250, "default_layer": "MODIS_Terra_NDVI_8Day"},
    "greenland_ice": {"name": "Greenland Ice Sheet", "lat": 72.5796, "lon": -38.4592, "radius_km": 300, "default_layer": "MODIS_Terra_Sea_Ice"},
    "sahara_desert": {"name": "Sahara Desert Erg", "lat": 23.4162, "lon": 12.6075, "radius_km": 300, "default_layer": "MODIS_Terra_Land_Surface_Temp_Day"},
    "pacific_warm_pool": {"name": "Equatorial Pacific Warm Pool", "lat": 0.5000, "lon": -150.0000, "radius_km": 400, "default_layer": "GHRSST_L4_MUR_Sea_Surface_Temperature"},
    "congo_basin": {"name": "Congo Rainforest", "lat": -0.2280, "lon": 21.7587, "radius_km": 250, "default_layer": "MODIS_Terra_NDVI_8Day"},
    "arctic_ocean": {"name": "Arctic Ocean Sea Ice Zone", "lat": 82.0000, "lon": 0.0000, "radius_km": 350, "default_layer": "MODIS_Terra_Sea_Ice"},
    "great_barrier_reef": {"name": "Great Barrier Reef", "lat": -18.2871, "lon": 147.6992, "radius_km": 200, "default_layer": "MODIS_Terra_Chlorophyll_A"},
    "himalayas": {"name": "Himalayan Glacial Cryosphere", "lat": 27.9881, "lon": 86.9250, "radius_km": 200, "default_layer": "MODIS_Terra_Sea_Ice"},
}


# =============================================================================
# 1. GET /api/earth/layers
# =============================================================================
@router.get("/layers", response_model=EarthLayersResponse)
async def get_earth_layers():
    """
    Returns verified NASA GIBS and Copernicus satellite layers across 6 scientific domains:
    satellite_imagery, ocean_data, temperature_data, cloud_data, vegetation_data, ice_snow_data.
    """
    layer_list = []
    domains = set()

    for layer_id, spec in GIBS_LAYER_SPECS.items():
        domains.add(spec["domain"])
        layer_list.append(LayerSpecSchema(
            id=layer_id,
            title=spec["title"],
            domain=spec["domain"],
            format=spec["format"],
            matrix_set=spec["matrix_set"],
            max_zoom=spec["max_zoom"],
            cadence=spec["cadence"],
            sensor=spec["sensor"],
            description=spec["description"],
        ))

    return EarthLayersResponse(
        total_layers=len(layer_list),
        domains=sorted(list(domains)),
        layers=layer_list,
    )


# =============================================================================
# 2. GET /api/earth/imagery
# =============================================================================
@router.get("/imagery")
async def get_earth_imagery(
    layer: str = Query("MODIS_Terra_CorrectedReflectance_TrueColor", description="NASA GIBS layer identifier"),
    min_lat: Optional[float] = Query(None, ge=-90.0, le=90.0),
    min_lon: Optional[float] = Query(None, ge=-180.0, le=180.0),
    max_lat: Optional[float] = Query(None, ge=-90.0, le=90.0),
    max_lon: Optional[float] = Query(None, ge=-180.0, le=180.0),
    lat: Optional[float] = Query(None, ge=-90.0, le=90.0),
    lon: Optional[float] = Query(None, ge=-180.0, le=180.0),
    radius_km: Optional[float] = Query(150.0, ge=10.0, le=2000.0),
    zoom: int = Query(4, ge=1, le=9),
    date: Optional[str] = Query(None, description="Acquisition date (YYYY-MM-DD)"),
    format: str = Query("raw", pattern="^(raw|json)$", description="raw binary image stream or JSON with base64 data"),
):
    """
    Fetch satellite imagery from NASA GIBS for a geographic bounding box or center point.
    Supports date-based imagery retrieval with automatic fallback to latest available composite.
    """
    if layer not in GIBS_LAYER_SPECS:
        raise HTTPException(
            status_code=400, 
            detail=f"Unsupported layer '{layer}'. Available: {list(GIBS_LAYER_SPECS.keys())}"
        )

    # Compute BoundingBox
    if min_lat is not None and min_lon is not None and max_lat is not None and max_lon is not None:
        bbox = BoundingBox(min_lat=min_lat, min_lon=min_lon, max_lat=max_lat, max_lon=max_lon)
    elif lat is not None and lon is not None:
        bbox = BoundingBox.from_point_and_radius(lat=lat, lon=lon, radius_km=radius_km)
    else:
        # Default to Equatorial South America / Amazon Basin
        bbox = BoundingBox(min_lat=-8.0, min_lon=-68.0, max_lat=2.0, max_lon=-56.0)

    try:
        img_bgr, resolved_date, metadata = await gibs_client.fetch_bounding_box_raster(
            layer_name=layer,
            bbox=bbox,
            zoom=zoom,
            date_str=date
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to fetch satellite imagery from NASA GIBS: {str(e)}")

    spec = gibs_client.get_layer_spec(layer)
    img_format = spec["format"].lower()
    encode_ext = ".jpg" if img_format in ("jpg", "jpeg") else ".png"
    mime_type = "image/jpeg" if img_format in ("jpg", "jpeg") else "image/png"

    success, buffer = cv2.imencode(encode_ext, img_bgr)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to encode raster imagery.")

    if format == "raw":
        return Response(content=buffer.tobytes(), media_type=mime_type)

    b64_data = base64.b64encode(buffer).decode("utf-8")
    return {
        "status": "success",
        "layer": layer,
        "acquisition_date": resolved_date,
        "bounding_box": bbox.to_dict(),
        "mime_type": mime_type,
        "metadata": metadata,
        "image_base64": f"data:{mime_type};base64,{b64_data}"
    }


# =============================================================================
# 3. GET /api/earth/region
# =============================================================================
@router.get("/region", response_model=EarthRegionAnalysisResponse)
async def get_earth_region_analysis(
    region_name: Optional[str] = Query(None, description="Predefined region name, e.g. amazon_basin, greenland_ice"),
    lat: Optional[float] = Query(None, ge=-90.0, le=90.0),
    lon: Optional[float] = Query(None, ge=-180.0, le=180.0),
    radius_km: Optional[float] = Query(150.0, ge=10.0, le=2000.0),
    min_lat: Optional[float] = Query(None, ge=-90.0, le=90.0),
    min_lon: Optional[float] = Query(None, ge=-180.0, le=180.0),
    max_lat: Optional[float] = Query(None, ge=-90.0, le=90.0),
    max_lon: Optional[float] = Query(None, ge=-180.0, le=180.0),
    layer: Optional[str] = Query(None, description="Satellite observation layer name"),
    zoom: int = Query(4, ge=1, le=8),
    date: Optional[str] = Query(None, description="Acquisition date (YYYY-MM-DD)"),
):
    """
    Extract scientific measurements and numerical features for a geographic region.
    Integrates NASA GIBS raster retrieval with domain-specific physical analysis.
    """
    # 1. Resolve Bounding Box & Layer
    if region_name and region_name.lower() in KNOWN_REGIONS:
        info = KNOWN_REGIONS[region_name.lower()]
        bbox = BoundingBox.from_point_and_radius(info["lat"], info["lon"], info["radius_km"])
        chosen_layer = layer or info["default_layer"]
    elif min_lat is not None and min_lon is not None and max_lat is not None and max_lon is not None:
        bbox = BoundingBox(min_lat=min_lat, min_lon=min_lon, max_lat=max_lat, max_lon=max_lon)
        chosen_layer = layer or "MODIS_Terra_CorrectedReflectance_TrueColor"
    elif lat is not None and lon is not None:
        bbox = BoundingBox.from_point_and_radius(lat=lat, lon=lon, radius_km=radius_km)
        chosen_layer = layer or "MODIS_Terra_CorrectedReflectance_TrueColor"
    else:
        # Default Amazon Rainforest
        info = KNOWN_REGIONS["amazon_basin"]
        bbox = BoundingBox.from_point_and_radius(info["lat"], info["lon"], info["radius_km"])
        chosen_layer = layer or info["default_layer"]

    # 2. Fetch Raster from NASA GIBS
    try:
        img_bgr, resolved_date, metadata = await gibs_client.fetch_bounding_box_raster(
            layer_name=chosen_layer,
            bbox=bbox,
            zoom=zoom,
            date_str=date
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"NASA GIBS imagery retrieval error: {str(e)}")

    # 3. Process via Domain-Specific Processing Module
    analysis = process_earth_data(
        img_bgr=img_bgr,
        layer_name=chosen_layer,
        bbox=bbox,
        acquisition_date=resolved_date
    )

    analysis["metadata"] = metadata
    return analysis


# =============================================================================
# 4. GET /api/earth/datasets
# =============================================================================
@router.get("/datasets", response_model=EarthDatasetsResponse)
async def get_earth_datasets():
    """
    Return comprehensive scientific provenance, sensor specifications, and citations
    for authentic satellite platforms (MODIS, VIIRS, SWOT, PACE, ICESat-2, Sentinel-2, Sentinel-1).
    """
    datasets = [
        DatasetAttributionSchema(
            id="modis-terra-aqua",
            name="MODIS (Moderate Resolution Imaging Spectroradiometer)",
            agency="NASA Goddard Space Flight Center (GSFC)",
            sensor="MODIS (Terra & Aqua Satellites)",
            spatial_resolution="250m, 500m, 1000m GSD",
            spectral_coverage="36 Spectral Bands (0.4 μm to 14.4 μm)",
            temporal_cadence="1 to 2 Days Daily Global Revisit",
            access_url="https://modis.gsfc.nasa.gov/",
            citation="Justice, C. O., et al. (2002). An overview of MODIS Land data products and applications. Remote Sensing of Environment, 83(1-2), 3-15.",
            sonification_acoustic_mapping="NDVI vegetation reflectance drives resonant bandpass filters (350Hz-2.4kHz); LST thermal radiance drives pitch glissando and harmonic overdrive."
        ),
        DatasetAttributionSchema(
            id="viirs-suomi-npp",
            name="VIIRS (Visible Infrared Imaging Radiometer Suite)",
            agency="NASA / NOAA",
            sensor="VIIRS (Suomi-NPP & NOAA-20/21)",
            spatial_resolution="375m (I-Bands) and 750m (M-Bands)",
            spectral_coverage="22 Spectral Bands (Visible, NIR, Thermal)",
            temporal_cadence="Daily Global Day/Night Coverage",
            access_url="https://www.star.nesdis.noaa.gov/jpss/viirs.php",
            citation="Cao, C., et al. (2014). Early on-orbit performance of the VIIRS instrument on Suomi NPP. JGR Atmospheres, 119(4), 1645-1658.",
            sonification_acoustic_mapping="Middle-infrared fire radiative power (MW) modulates tube saturation and warmth index; Day/Night Band radiance drives pitch height."
        ),
        DatasetAttributionSchema(
            id="sentinel-2-msi",
            name="Sentinel-2 MultiSpectral Instrument (MSI)",
            agency="European Space Agency (ESA) & Copernicus",
            sensor="MSI (Sentinel-2A & Sentinel-2B Constellation)",
            spatial_resolution="10m, 20m, 60m Ground Sample Distance",
            spectral_coverage="13 Spectral Bands (VNIR, Red Edge, SWIR)",
            temporal_cadence="5 Days with 2-Satellite Constellation",
            access_url="https://dataspace.copernicus.eu/",
            citation="Drusch, M., et al. (2012). Sentinel-2: ESA's Optical High-Resolution Mission for GMES Operational Services. Remote Sensing of Environment, 120, 25-36.",
            sonification_acoustic_mapping="13-band surface reflectance generates polyphonic chord clusters; Red-Edge vegetative vitality governs digital filter resonance."
        ),
        DatasetAttributionSchema(
            id="sentinel-1-sar",
            name="Sentinel-1 Synthetic Aperture Radar (C-SAR)",
            agency="European Space Agency (ESA) & Copernicus",
            sensor="C-SAR (Sentinel-1A & 1C C-Band Radar)",
            spatial_resolution="5m x 20m (Interferometric Wide Swath)",
            spectral_coverage="C-Band 5.405 GHz (VV, VH, HH, HV Polarizations)",
            temporal_cadence="6 to 12 Days All-Weather Day/Night",
            access_url="https://sentinels.copernicus.eu/web/sentinel/missions/sentinel-1",
            citation="Torres, R., et al. (2012). GMES Sentinel-1 mission. Remote Sensing of Environment, 120, 9-24.",
            sonification_acoustic_mapping="Dual-polarization VV/VH radar backscatter cross-sections map directly to sub-bass 40-90Hz FM synthesis, sonifying physical surface roughness."
        ),
        DatasetAttributionSchema(
            id="ghrsst-mur-sst",
            name="GHRSST Level-4 Multi-Scale Ultra-High Resolution SST",
            agency="NASA JPL Physical Oceanography DAAC (PO.DAAC)",
            sensor="Merged Multi-Sensor Infrared & Microwave Composite",
            spatial_resolution="0.01° Grid (~1 km Ultra-High Resolution)",
            spectral_coverage="Thermal Infrared & Microwave Radiometers",
            temporal_cadence="Daily Global High-Resolution Analysis",
            access_url="https://podaac.jpl.nasa.gov/dataset/MUR-JPL-L4-GLOB-v4.1",
            citation="Chin, T. M., et al. (2017). An ultra-high resolution global analysis of sea surface temperature. Remote Sensing of Environment, 199, 396-404.",
            sonification_acoustic_mapping="Sea surface temperatures translate to Dorian modal scales; marine thermal fronts trigger low-frequency tidal swell noise."
        ),
        DatasetAttributionSchema(
            id="swot-karin-radar",
            name="Surface Water and Ocean Topography (SWOT)",
            agency="NASA / CNES / CSA / UKSA",
            sensor="Ka-Band Radar Interferometer (KaRIn)",
            spatial_resolution="Sub-kilometer Mesoscale Ocean & 50m River Reaches",
            spectral_coverage="Ka-Band 35.75 GHz Wide-Swath Radar Interferometry",
            temporal_cadence="21-Day Repeat Orbit",
            access_url="https://swot.jpl.nasa.gov/",
            citation="Morrow, R., et al. (2019). Global observations of fine-scale ocean surface topography with the Surface Water and Ocean Topography (SWOT) mission. Frontiers in Marine Science, 6, 232.",
            sonification_acoustic_mapping="Centimeter sea surface height anomalies modulate dual microtonal drone oscillators, capturing kinetic ocean vortex eddies."
        ),
        DatasetAttributionSchema(
            id="icesat-2-atlas",
            name="ICESat-2 Advanced Topographic Laser Altimeter System (ATLAS)",
            agency="NASA Goddard Space Flight Center",
            sensor="ATLAS (Photon-Counting Micro-Pulse Laser at 532 nm)",
            spatial_resolution="11m Footprint with 0.7m Along-Track Sampling",
            spectral_coverage="Green 532 nm Laser",
            temporal_cadence="91-Day Polar Repeat",
            access_url="https://icesat-2.gsfc.nasa.gov/",
            citation="Markus, T., et al. (2017). The Ice, Cloud, and land Elevation Satellite-2 (ICESat-2): Science requirements, concept, and implementation. Remote Sensing of Environment, 190, 260-273.",
            sonification_acoustic_mapping="Sea ice freeboard height and polar ice thickness map to crystalline high-register sine bell frequencies (1.2 kHz - 4.5 kHz)."
        )
    ]

    return EarthDatasetsResponse(
        total_datasets=len(datasets),
        datasets=datasets
    )


# =============================================================================
# 5. POST /api/earth/analyze
# =============================================================================
@router.post("/analyze", response_model=EarthRegionAnalysisResponse)
async def analyze_earth_data(
    file: Optional[UploadFile] = File(None, description="Optional image file upload (PNG, JPG)"),
    domain: Optional[str] = Form(None, description="Scientific domain: satellite_imagery, ocean_data, temperature_data, cloud_data, vegetation_data, ice_snow_data"),
    layer: Optional[str] = Form(None, description="NASA GIBS layer name"),
    min_lat: Optional[float] = Form(None),
    min_lon: Optional[float] = Form(None),
    max_lat: Optional[float] = Form(None),
    max_lon: Optional[float] = Form(None),
    date: Optional[str] = Form(None),
):
    """
    Ingest satellite imagery from either a direct file upload or geographic bounding box,
    extract multi-spectral numerical features, and return sonification-ready parameters.
    """
    img_bgr = None
    bbox = None
    resolved_date = date or datetime.date.today().isoformat()

    if min_lat is not None and min_lon is not None and max_lat is not None and max_lon is not None:
        bbox = BoundingBox(min_lat=min_lat, min_lon=min_lon, max_lat=max_lat, max_lon=max_lon)

    if file:
        content = await file.read()
        nparr = np.frombuffer(content, np.uint8)
        img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img_bgr is None:
            raise HTTPException(status_code=400, detail="Uploaded file could not be decoded as a valid image.")
    elif bbox:
        chosen_layer = layer or "MODIS_Terra_CorrectedReflectance_TrueColor"
        img_bgr, resolved_date, _ = await gibs_client.fetch_bounding_box_raster(
            layer_name=chosen_layer,
            bbox=bbox,
            zoom=4,
            date_str=date
        )
    else:
        # Default analysis sample: Amazon Canopy
        info = KNOWN_REGIONS["amazon_basin"]
        bbox = BoundingBox.from_point_and_radius(info["lat"], info["lon"], info["radius_km"])
        chosen_layer = layer or info["default_layer"]
        img_bgr, resolved_date, _ = await gibs_client.fetch_bounding_box_raster(
            layer_name=chosen_layer,
            bbox=bbox,
            zoom=4,
            date_str=date
        )

    # Process using domain-specific mathematical algorithms
    analysis = process_earth_data(
        img_bgr=img_bgr,
        domain=domain,
        layer_name=layer,
        bbox=bbox,
        acquisition_date=resolved_date
    )

    return analysis


# =============================================================================
# 6. GET /api/earth/timeline
# =============================================================================
@router.get("/timeline", response_model=EarthTimelineResponse)
async def get_earth_timeline(
    phenomenon: str = Query("arctic_sea_ice", description="arctic_sea_ice, global_temperature, or pacific_elnino"),
    start_year: int = Query(1979, ge=1880, le=2026),
    end_year: int = Query(2024, ge=1880, le=2026),
):
    """
    Return chronological multi-year Earth observation time series with verified scientific measurements
    and normalized pitch trajectories for sonification.
    """
    if phenomenon == "arctic_sea_ice":
        # Verified NSIDC / NASA SVS Annual September Arctic Sea Ice Minimum Extent (Million sq km)
        historical_records = [
            (1979, 6.90, "Baseline Thick Multi-Year Polar Pack"),
            (1985, 6.49, "Stable Arctic Glacial Core"),
            (1990, 6.01, "First Decadal Thinning"),
            (1995, 6.08, "Sub-Polar Gyre Drift"),
            (2000, 5.98, "Boundary Fracture Leads Open"),
            (2005, 5.32, "Accelerated Summer Retreat"),
            (2007, 4.16, "Historic Record Low Inundation"),
            (2012, 3.39, "All-Time Historical Minimum Extent"),
            (2016, 4.17, "Extensive Open Water Absorption"),
            (2020, 3.82, "Second Lowest Sea Ice Extent Recorded"),
            (2023, 4.23, "Thin Seasonal First-Year Ice Dominance"),
            (2024, 4.28, "Near-Record Low Arctic Freeboard Volume"),
        ]
        
        frames = []
        for yr, val, desc in historical_records:
            if start_year <= yr <= end_year:
                # 6.90 M sq km = high pitch (1.0), 3.39 M sq km = deep sub-bass (0.0)
                norm_pitch = float(np.clip((val - 3.0) / 4.0, 0.0, 1.0))
                frames.append(TimelineFrameSchema(
                    date=f"{yr}-09-15",
                    year=yr,
                    month=9,
                    metric_value=val,
                    metric_unit="Million km²",
                    normalized_acoustic_pitch=round(norm_pitch, 3),
                    audio_event=desc,
                ))

        return EarthTimelineResponse(
            phenomenon="Arctic Sea Ice Annual Minimum Extent",
            region_name="Arctic Ocean Basin (82°N, 0°E)",
            time_span=f"{start_year} - {end_year}",
            total_frames=len(frames),
            frames=frames,
            timeline=frames,
            macro_trend="-12.2% per decade retreat relative to 1979-2000 average.",
            scientific_summary="Satellite microwave radiometry (SMMR, SSM/I, AMSR2) demonstrates continuous decadal loss of multi-year thick ice, resulting in acoustic transformation from high-register albedo shimmer to deep oceanic sub-bass."
        )

    elif phenomenon == "global_temperature":
        # Verified NASA GISTEMP Surface Temperature Anomalies (°C relative to 1951-1980 baseline)
        historical_records = [
            (1880, -0.16, "Late 19th Century Pre-Industrial Consonant Baseline"),
            (1910, -0.42, "Solar Minimum & Volcanic Aerosol Cooling"),
            (1940, +0.12, "Mid-Century Warm Departure"),
            (1970, +0.03, "Aerosol Plateau Phase"),
            (1980, +0.26, "Onset of Modern Rapid Warming"),
            (1990, +0.45, "Decadal Warming Semitone Ascent"),
            (2000, +0.40, "Warmest Decade of 20th Century"),
            (2010, +0.72, "High-Register Harmonic Dissonance"),
            (2016, +1.02, "First +1.0°C Global Anomaly Exceedance"),
            (2020, +1.02, "Record Thermal Radiance Plateau"),
            (2023, +1.17, "Hottest Year in Instrumental Record"),
            (2024, +1.28, "Accelerating Planetary Warming Peak"),
        ]

        frames = []
        for yr, val, desc in historical_records:
            if start_year <= yr <= end_year:
                # -0.4°C = 0.0 (low C3), +1.3°C = 1.0 (high C5)
                norm_pitch = float(np.clip((val + 0.5) / 1.8, 0.0, 1.0))
                frames.append(TimelineFrameSchema(
                    date=f"{yr}-07-01",
                    year=yr,
                    month=7,
                    metric_value=val,
                    metric_unit="°C Anomaly",
                    normalized_acoustic_pitch=round(norm_pitch, 3),
                    audio_event=desc,
                ))

        return EarthTimelineResponse(
            phenomenon="GISTEMP Global Mean Surface Temperature Anomaly",
            region_name="Global Terrestrial & Marine Average",
            time_span=f"{start_year} - {end_year}",
            total_frames=len(frames),
            frames=frames,
            timeline=frames,
            macro_trend="+0.18°C per decade warming trend accelerating over past 40 years.",
            scientific_summary="NASA GISS GISTEMP v4 meteorological station and ocean float measurements document unprecedented global warming, mapped into an ascending musical glissando where +0.1°C departure raises acoustic frequency by a musical semitone."
        )

    elif phenomenon == "carbon_dioxide":
        # Verified NOAA Global Monitoring Laboratory & NASA OCO-2 atmospheric CO2 (ppm)
        co2_records = [
            (1958, 315.71, "Mauna Loa Continuous Recording Inauguration Baseline"),
            (1965, 320.04, "Early Industrial Acceleration Phase"),
            (1975, 331.11, "Global Fossil Fuel Combustion Upsurge"),
            (1985, 346.12, "Approaching Pre-Industrial +25% Departure"),
            (1995, 360.82, "Exceeding 360 ppm Mid-Tropospheric Ceiling"),
            (2005, 379.80, "Steepening Keeling Curve Harmonic Incline"),
            (2010, 389.90, "Approaching 390 ppm Boundary"),
            (2013, 396.52, "First Discrete In-Situ Days Crossing 400 ppm"),
            (2015, 400.83, "Permanent Global Crossing of 400 ppm Threshold"),
            (2019, 411.44, "Accelerated Multi-Year Trend Incline"),
            (2022, 418.56, "Peak Planetary Greenhouse Forcing Radiance"),
            (2024, 424.50, "Current Atmospheric Historical Peak"),
        ]

        frames = []
        for yr, val, desc in co2_records:
            if start_year <= yr <= end_year:
                # 315 ppm = 0.0, 425 ppm = 1.0
                norm_pitch = float(np.clip((val - 315.0) / 110.0, 0.0, 1.0))
                frames.append(TimelineFrameSchema(
                    date=f"{yr}-05-15",
                    year=yr,
                    month=5,
                    metric_value=val,
                    metric_unit="ppm",
                    normalized_acoustic_pitch=round(norm_pitch, 3),
                    audio_event=desc,
                ))

        return EarthTimelineResponse(
            phenomenon="Atmospheric Carbon Dioxide (CO2) Concentrations",
            region_name="Mauna Loa Observatory & Global Marine Boundary Layer",
            time_span=f"{start_year} - {end_year}",
            total_frames=len(frames),
            frames=frames,
            timeline=frames,
            macro_trend="+2.4 ppm per year growth rate, 51% above pre-industrial levels (~280 ppm).",
            scientific_summary="In-situ infrared gas analyzers and NASA OCO-2/3 satellite spectrometry document relentless atmospheric CO2 accumulation, sonified as an accelerating ascending acoustic staircase."
        )

    elif phenomenon == "sea_level":
        # Verified Multi-Satellite Radar Altimetry Global Mean Sea Level (mm relative to 1993)
        sea_level_records = [
            (1993, 0.0, "TOPEX/Poseidon Radar Altimetry Mission Start Baseline"),
            (1997, 13.8, "Strong 1997-98 El Niño Ocean Thermal Expansion Pulse"),
            (2001, 24.5, "Jason-1 Altimeter Transition Continuity"),
            (2005, 37.2, "Antarctic and Greenland Ice Sheet Mass Loss Acceleration"),
            (2009, 49.1, "Decadal Acceleration Confirmation"),
            (2013, 63.8, "Jason-2 Altimeter Cross-Calibration"),
            (2016, 78.5, "Record 2015-16 Oceanic Thermal Storage"),
            (2019, 89.2, "Jason-3 Altimeter Precision Benchmark"),
            (2021, 96.8, "Sentinel-6 Michael Freilich Altimetry Era"),
            (2023, 103.4, "Triple-Dip La Niña to El Niño Surge"),
            (2024, 108.5, "Contemporary Historic Altimetry Peak"),
        ]

        frames = []
        for yr, val, desc in sea_level_records:
            if start_year <= yr <= end_year:
                # 0 mm = 0.0, 110 mm = 1.0
                norm_pitch = float(np.clip(val / 110.0, 0.0, 1.0))
                frames.append(TimelineFrameSchema(
                    date=f"{yr}-06-01",
                    year=yr,
                    month=6,
                    metric_value=val,
                    metric_unit="mm",
                    normalized_acoustic_pitch=round(norm_pitch, 3),
                    audio_event=desc,
                ))

        return EarthTimelineResponse(
            phenomenon="Global Mean Sea Level Variation",
            region_name="Global Ocean Marine Coverage (66°S - 66°N)",
            time_span=f"{start_year} - {end_year}",
            total_frames=len(frames),
            frames=frames,
            timeline=frames,
            macro_trend="+3.4 mm per year rise, accelerating from 2.1 mm/yr in the early 1990s.",
            scientific_summary="Precision microwave radar altimetry across TOPEX/Poseidon, Jason-1/2/3, and Sentinel-6 quantifies global oceanic volume expansion and cryospheric melt, sonified as an intensifying oceanic acoustic resonance."
        )

    else:
        raise HTTPException(
            status_code=400, 
            detail="Unsupported phenomenon. Supported: 'arctic_sea_ice', 'global_temperature', 'carbon_dioxide', 'sea_level'"
        )


# =============================================================================
# 7. GET /api/earth/sentinel
# =============================================================================
@router.get("/sentinel")
async def get_sentinel_granules(
    min_lat: float = Query(..., ge=-90.0, le=90.0),
    min_lon: float = Query(..., ge=-180.0, le=180.0),
    max_lat: float = Query(..., ge=-90.0, le=90.0),
    max_lon: float = Query(..., ge=-180.0, le=180.0),
    date: Optional[str] = Query(None, description="Acquisition date (YYYY-MM-DD)"),
    max_cloud_cover: float = Query(30.0, ge=0.0, le=100.0),
    limit: int = Query(5, ge=1, le=20),
):
    """
    Search authentic Sentinel-2 Level-2A imagery granules through Copernicus Data Space
    and open Sentinel STAC mirrors.
    """
    bbox = BoundingBox(min_lat=min_lat, min_lon=min_lon, max_lat=max_lat, max_lon=max_lon)
    return await copernicus_client.search_sentinel_granules(
        bbox=bbox,
        date_str=date,
        max_cloud_cover_pct=max_cloud_cover,
        limit=limit
    )


# =============================================================================
# 8. GET /api/earth/catalog
# =============================================================================
@router.get("/catalog")
async def get_earth_science_catalog(
    domain: Optional[str] = Query(None, description="Filter by domain (temperature, precipitation, wind_speed, vegetation, ocean, atmosphere, snow_ice)")
):
    """
    Return comprehensive multi-source Earth science dataset catalog preserving all 9 required provenance fields:
    dataset_name, source, units, geographic_coverage, time_coverage, resolution, temporal_frequency, processing_information, data_limitations.
    """
    items = earth_data_service.get_catalog(domain=domain)
    return {
        "total_datasets": len(items),
        "filter_domain": domain,
        "datasets": items
    }


# =============================================================================
# 9. GET /api/earth/metrics/point
# =============================================================================
@router.get("/metrics/point")
async def get_earth_point_metrics(
    lat: float = Query(..., ge=-90.0, le=90.0, description="Latitude (-90 to +90)"),
    lon: float = Query(..., ge=-180.0, le=180.0, description="Longitude (-180 to +180)"),
    date: Optional[str] = Query(None, description="Target observation date (YYYY-MM-DD)"),
):
    """
    Fetch authentic calibrated numerical measurements for any geographic coordinate across:
    - NASA POWER (MERRA-2)
    - Open-Meteo ERA5 / ERA5-Land Reanalysis
    Preserving physical units, quality flags, and missing data detection.
    """
    return await earth_data_service.get_multi_source_point_metrics(lat=lat, lon=lon, date_str=date)


# =============================================================================
# 10. GET /api/earth/process/demo
# =============================================================================
@router.get("/process/demo")
async def get_earth_data_processing_demo(
    domain: Optional[str] = Query(None, description="Domain to preview (temperature, precipitation, wind_speed, vegetation, ocean_sst)")
):
    """
    Returns authentic scientific data processing results across 5 scientific domains:
    Temperature, Precipitation, Wind Speed, Vegetation, and Ocean SST.
    Demonstrates:
    - Never converting missing values to zero.
    - Preserving physical units and scientific meaning.
    - Full 8-part sonification telemetry sequence.
    """
    # 1. Temperature Time Series (Amazon Basin, 14 days)
    loc_amazon = {"latitude": -3.4653, "longitude": -62.2159, "region_name": "Amazon Basin Rainforest", "elevation_m": 84}
    temp_records = [
        {"timestamp": "2024-08-01", "value": 26.8},
        {"timestamp": "2024-08-02", "value": 27.4},
        {"timestamp": "2024-08-03", "value": 25.9},
        {"timestamp": "2024-08-04", "value": 28.1},
        {"timestamp": "2024-08-05", "value": 29.5},
        {"timestamp": "2024-08-06", "value": None},   # Missing satellite pass
        {"timestamp": "2024-08-07", "value": 27.0},
        {"timestamp": "2024-08-08", "value": 26.2},
        {"timestamp": "2024-08-09", "value": 28.8},
        {"timestamp": "2024-08-10", "value": 30.2},
        {"timestamp": "2024-08-11", "value": -999.0}, # Standard fill value
        {"timestamp": "2024-08-12", "value": 29.1},
        {"timestamp": "2024-08-13", "value": 27.7},
        {"timestamp": "2024-08-14", "value": 28.4},
    ]
    proc_temp = earth_data_engine.process_temperature_series(temp_records, loc_amazon)

    # 2. Precipitation Time Series (Preserving real 0.0 dry days vs missing values)
    loc_sahara = {"latitude": 23.4162, "longitude": 12.6075, "region_name": "Sahara Transition Zone", "elevation_m": 450}
    precip_records = [
        {"timestamp": "2024-08-01", "value": 0.0},    # Genuine physical zero: Dry Day
        {"timestamp": "2024-08-02", "value": 0.0},    # Genuine physical zero: Dry Day
        {"timestamp": "2024-08-03", "value": 1.2},    # Light drizzle
        {"timestamp": "2024-08-04", "value": 0.0},    # Dry Day
        {"timestamp": "2024-08-05", "value": None},   # Missing data dropout
        {"timestamp": "2024-08-06", "value": 0.0},    # Dry Day
        {"timestamp": "2024-08-07", "value": 18.5},   # Monsoonal shower
        {"timestamp": "2024-08-08", "value": 42.0},   # Intense convective deluge
        {"timestamp": "2024-08-09", "value": 6.4},    # Moderate rain
        {"timestamp": "2024-08-10", "value": 0.0},    # Dry Day
        {"timestamp": "2024-08-11", "value": -9999.0},# Fill value
        {"timestamp": "2024-08-12", "value": 0.0},    # Dry Day
        {"timestamp": "2024-08-13", "value": 0.0},    # Dry Day
        {"timestamp": "2024-08-14", "value": 2.8},    # Scattered shower
    ]
    proc_precip = earth_data_engine.process_precipitation_series(precip_records, loc_sahara)

    # 3. Wind Speed Time Series
    loc_arctic = {"latitude": 78.2232, "longitude": 15.6267, "region_name": "Svalbard Arctic Outpost", "elevation_m": 12}
    wind_records = [
        {"timestamp": "2024-08-01", "value": 3.2},
        {"timestamp": "2024-08-02", "value": 4.5},
        {"timestamp": "2024-08-03", "value": 7.8},
        {"timestamp": "2024-08-04", "value": 12.4},   # Moderate breeze
        {"timestamp": "2024-08-05", "value": 18.2},   # Gale warning
        {"timestamp": "2024-08-06", "value": 24.6},   # Storm velocity
        {"timestamp": "2024-08-07", "value": 14.1},
        {"timestamp": "2024-08-08", "value": 8.0},
        {"timestamp": "2024-08-09", "value": 5.1},
        {"timestamp": "2024-08-10", "value": 2.9},
        {"timestamp": "2024-08-11", "value": None},
        {"timestamp": "2024-08-12", "value": 4.0},
        {"timestamp": "2024-08-13", "value": 6.3},
        {"timestamp": "2024-08-14", "value": 5.5},
    ]
    proc_wind = earth_data_engine.process_wind_series(wind_records, loc_arctic)

    # 4. Vegetation Canopy (16-Zone Spatial Grid from synthetic MODIS NDVI)
    ndvi_grid = np.array([
        [0.82, 0.79, 0.85, 0.88],
        [0.76, -0.08, 0.84, 0.81],  # Water body at R2C2
        [0.71, 0.74, 0.78, 0.82],
        [0.65, 0.69, 0.72, 0.77]
    ], dtype=np.float32)
    proc_veg = earth_data_engine.process_vegetation_raster(ndvi_grid, loc_amazon)

    # 5. Ocean SST Grid (Pacific Warm Pool)
    loc_pacific = {"latitude": 0.5000, "longitude": -150.0000, "region_name": "Equatorial Pacific Warm Pool", "elevation_m": 0}
    sst_grid = np.array([
        [28.9, 29.1, 29.4, 29.2],
        [29.3, 29.7, 30.1, 29.8],
        [29.0, 29.5, 29.9, 29.6],
        [28.7, 29.2, 29.4, 29.1]
    ], dtype=np.float32)
    proc_sst = earth_data_engine.process_ocean_grid(sst_grid, loc_pacific)

    all_domains = {
        "temperature": proc_temp,
        "precipitation": proc_precip,
        "wind_speed": proc_wind,
        "vegetation": proc_veg,
        "ocean_sst": proc_sst,
    }

    if domain and domain in all_domains:
        return {
            "status": "success",
            "selected_domain": domain,
            "data": all_domains[domain],
            "physical_bounds": DOMAIN_PHYSICAL_BOUNDS.get(domain)
        }

    return {
        "status": "success",
        "description": "Enterprise NASA Earth observation scientific processing demonstration",
        "total_domains": len(all_domains),
        "domains": all_domains,
        "physical_bounds": DOMAIN_PHYSICAL_BOUNDS
    }


# =============================================================================
# 11. POST /api/earth/process/timeseries
# =============================================================================
@router.post("/process/timeseries")
async def process_earth_timeseries_data(payload: ProcessTimeseriesRequest):
    """
    Process custom in-situ or satellite time series through the scientific processing engine.
    Applies physical validation, statistical summaries in original units,
    and produces structured sonification sequences.
    """
    domain = payload.domain
    if domain not in DOMAIN_PHYSICAL_BOUNDS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported domain '{domain}'. Supported: {list(DOMAIN_PHYSICAL_BOUNDS.keys())}"
        )

    location = payload.location or {"latitude": 0.0, "longitude": 0.0, "region_name": "Observation Point"}
    metadata = payload.metadata or {
        "id": f"custom-{domain}-series",
        "dataset_name": f"Custom {domain.replace('_', ' ').title()} Series",
        "source": "Client Ingest / Sensor Stream",
        "resolution": "Point Observation",
        "temporal_frequency": "Custom",
        "processing_information": "Enterprise Data Processing Engine Pipeline"
    }

    if domain == "temperature":
        return earth_data_engine.process_temperature_series(payload.series, location, metadata)
    elif domain == "precipitation":
        return earth_data_engine.process_precipitation_series(payload.series, location, metadata)
    elif domain == "wind_speed":
        return earth_data_engine.process_wind_series(payload.series, location, metadata)
    else:
        stats = earth_data_engine.calculate_statistical_summary([r.get("value") for r in payload.series], domain)
        seq = earth_data_engine.generate_sonification_sequence(payload.series, domain, metadata, location)
        return {
            "domain": domain,
            "dataset_metadata": metadata,
            "geographic_location": location,
            "statistical_summary": stats,
            "sonification_sequence": seq,
            "total_frames": len(seq)
        }


# =============================================================================
# 12. POST /api/earth/process/upload
# =============================================================================
@router.post("/process/upload")
async def upload_and_process_scientific_file(
    file: UploadFile = File(..., description="Scientific GeoTIFF (.tif/.tiff), NetCDF (.nc/.nc4), or CSV (.csv) file"),
    domain: Optional[str] = Form("vegetation", description="Scientific domain")
):
    """
    Ingest and process scientific data files:
    - GeoTIFF (.tif/.tiff) using Rasterio
    - NetCDF (.nc/.nc4) using Xarray
    - Tabular CSV (.csv) using Pandas
    Returns statistical summaries and sonification telemetry sequences.
    Strictly validates size, magic bytes, and path boundaries.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="Missing file in upload request.")

    # 1. Sanitize filename and prevent path traversal
    safe_filename = os.path.basename(file.filename).replace("\x00", "").strip()
    ext = os.path.splitext(safe_filename)[1].lower()
    
    allowed_scientific_exts = (".tif", ".tiff", ".nc", ".nc4", ".h5", ".csv")
    if ext not in allowed_scientific_exts:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported scientific file format '{ext}'. Supported formats: {', '.join(allowed_scientific_exts)}",
        )

    content = await file.read()
    # 2. File size ceiling check (max 15MB)
    if len(content) > settings.MAX_FILE_SIZE_BYTES:
        max_mb = settings.MAX_FILE_SIZE_MB
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Scientific dataset exceeds maximum allowed limit of {max_mb} MB (received {len(content) / (1024 * 1024):.2f} MB).",
        )

    # 3. Magic byte signature verification
    if ext in (".tif", ".tiff"):
        if not (content.startswith(b"II*\x00") or content.startswith(b"MM\x00*")):
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail="Invalid GeoTIFF file signature. File header does not match TIFF magic bytes.",
            )
    elif ext in (".nc", ".nc4", ".h5"):
        is_cdf = content.startswith(b"CDF\x01") or content.startswith(b"CDF\x02")
        is_hdf5 = content.startswith(b"\x89HDF\r\n\x1a\n")
        if not (is_cdf or is_hdf5):
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail="Invalid NetCDF/HDF5 file signature. File header does not match CDF/HDF5 magic bytes.",
            )

    loc = {"latitude": 0.0, "longitude": 0.0, "region_name": f"Uploaded File ({safe_filename})"}

    try:
        if ext in (".tif", ".tiff"):
            result = earth_data_engine.process_vegetation_raster(
                raster_data=content,
                location=loc,
                metadata={"id": "uploaded-geotiff", "dataset_name": safe_filename, "source": "Uploaded GeoTIFF"}
            )
            return {"status": "success", "file_format": "GeoTIFF", "result": result}

        elif ext in (".nc", ".nc4", ".h5"):
            result = earth_data_engine.process_ocean_grid(
                grid_data=content,
                location=loc,
                metadata={"id": "uploaded-netcdf", "dataset_name": safe_filename, "source": "Uploaded NetCDF"}
            )
            return {"status": "success", "file_format": "NetCDF", "result": result}

        elif ext == ".csv":
            csv_str = content.decode("utf-8", errors="replace")
            df = earth_data_engine.read_tabular_timeseries(io.StringIO(csv_str))
            
            # Find candidate numeric column
            numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
            if not numeric_cols:
                raise HTTPException(status_code=400, detail="No numeric observation columns found in CSV.")
            
            val_col = numeric_cols[0]
            date_col = [c for c in df.columns if any(k in c.lower() for k in ["date", "time", "timestamp"])]
            ts_col = date_col[0] if date_col else None

            records = []
            for _, row in df.iterrows():
                ts = str(row[ts_col]) if ts_col else datetime.date.today().isoformat()
                v = row[val_col]
                records.append({"timestamp": ts, "value": float(v) if pd.notnull(v) else None})

            selected_domain = domain if domain in DOMAIN_PHYSICAL_BOUNDS else "temperature"
            stats = earth_data_engine.calculate_statistical_summary([r["value"] for r in records], selected_domain)
            seq = earth_data_engine.generate_sonification_sequence(
                records,
                selected_domain,
                {"id": "uploaded-csv", "dataset_name": safe_filename, "source": f"CSV Column '{val_col}'"},
                loc
            )
            return {
                "status": "success",
                "file_format": "CSV",
                "column_analyzed": val_col,
                "domain": selected_domain,
                "statistical_summary": stats,
                "sonification_sequence": seq,
                "total_frames": len(seq)
            }
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file format '{safe_filename}'. Please upload a GeoTIFF (.tif), NetCDF (.nc), or CSV (.csv) file."
            )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process scientific file: {str(e)}")

