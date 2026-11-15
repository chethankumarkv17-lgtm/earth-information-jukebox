"""
Unified Processor Registry for NASA Earth Observation Domains
2026 NASA Space Apps Challenge — EARTH JUKEBOX
"""

from typing import Dict, Any, Optional
import numpy as np

from app.services.processors.satellite_processor import satellite_processor, SatelliteImageryProcessor
from app.services.processors.ocean_processor import ocean_processor, OceanDataProcessor
from app.services.processors.temperature_processor import temperature_processor, TemperatureDataProcessor
from app.services.processors.cloud_processor import cloud_processor, CloudDataProcessor
from app.services.processors.vegetation_processor import vegetation_processor, VegetationDataProcessor
from app.services.processors.ice_processor import ice_processor, IceSnowDataProcessor
from app.services.geospatial.geospatial_engine import BoundingBox

DOMAIN_PROCESSORS = {
    "satellite_imagery": satellite_processor,
    "ocean_data": ocean_processor,
    "temperature_data": temperature_processor,
    "cloud_data": cloud_processor,
    "vegetation_data": vegetation_processor,
    "ice_snow_data": ice_processor,
}

# Mapping layer names to appropriate domain processor
LAYER_TO_DOMAIN = {
    "MODIS_Terra_CorrectedReflectance_TrueColor": "satellite_imagery",
    "VIIRS_SNPP_CorrectedReflectance_TrueColor": "satellite_imagery",
    "GHRSST_L4_MUR_Sea_Surface_Temperature": "ocean_data",
    "MODIS_Terra_Chlorophyll_A": "ocean_data",
    "MODIS_Terra_Land_Surface_Temp_Day": "temperature_data",
    "AIRS_Precipitation_Day": "temperature_data",
    "MODIS_Terra_Cloud_Water_Path": "cloud_data",
    "MODIS_Terra_Cloud_Optical_Thickness": "cloud_data",
    "MODIS_Terra_NDVI_8Day": "vegetation_data",
    "MODIS_Terra_EVI_8Day": "vegetation_data",
    "MODIS_Terra_Sea_Ice": "ice_snow_data",
    "AMSR2_Sea_Ice_Concentration_12km": "ice_snow_data",
}


def get_processor_for_layer(layer_name: str):
    domain = LAYER_TO_DOMAIN.get(layer_name, "satellite_imagery")
    return DOMAIN_PROCESSORS.get(domain, satellite_processor)


def process_earth_data(
    img_bgr: np.ndarray,
    domain: Optional[str] = None,
    layer_name: Optional[str] = None,
    bbox: Optional[BoundingBox] = None,
    acquisition_date: Optional[str] = None,
) -> Dict[str, Any]:
    """Execute domain-specific analysis on an Earth observation raster."""
    if domain and domain in DOMAIN_PROCESSORS:
        proc = DOMAIN_PROCESSORS[domain]
    elif layer_name and layer_name in LAYER_TO_DOMAIN:
        proc = get_processor_for_layer(layer_name)
    else:
        proc = satellite_processor

    return proc.process(
        img_bgr=img_bgr,
        bbox=bbox,
        acquisition_date=acquisition_date,
        layer_name=layer_name or proc.DEFAULT_LAYER
    )
