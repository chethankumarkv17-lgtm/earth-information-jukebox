"""
Vegetation Data Processing Module
2026 NASA Space Apps Challenge — EARTH JUKEBOX
Handles Normalized Difference Vegetation Index (NDVI), canopy phenology, and biosphere harmonics.
"""

from typing import Dict, Any, Optional
import numpy as np
import cv2
from app.services.geospatial.geospatial_engine import extract_visual_features_from_image, BoundingBox


class VegetationDataProcessor:
    DOMAIN = "vegetation_data"
    DEFAULT_LAYER = "MODIS_Terra_NDVI_8Day"

    def process(
        self, 
        img_bgr: np.ndarray, 
        bbox: Optional[BoundingBox] = None, 
        acquisition_date: Optional[str] = None,
        layer_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Process vegetative canopy rasters (NDVI / EVI).
        Translates photosynthetic density and chlorophyll vitality into rich resonant harmonics.
        """
        if img_bgr is None or img_bgr.size == 0:
            raise ValueError("Input vegetation image array is empty.")

        layer = layer_name or self.DEFAULT_LAYER
        features = extract_visual_features_from_image(img_bgr)
        
        # NDVI color scaling in NASA GIBS MODIS NDVI 8-day:
        # Arid brown / sand (-0.1 to 0.1) -> Yellows (0.2 to 0.4) -> Deep Greens (0.6 to 0.9)
        green_energy = features["normalized_features"]["green_energy_norm"]
        red_energy = features["normalized_features"]["red_energy_norm"]
        
        # Calibrate NDVI from green/red ratio and warmth
        ndvi_proxy = float(np.clip(-0.1 + (green_energy * 1.6) - (red_energy * 0.4), -0.1, 0.92))
        
        # Estimate dense canopy fraction (NDVI > 0.6)
        dense_canopy_pct = float(np.clip((ndvi_proxy - 0.2) / 0.7 * 100.0, 0.0, 100.0))
        bare_soil_pct = float(max(0.0, 100.0 - dense_canopy_pct - (features["normalized_features"]["blue_energy_norm"] * 100.0)))

        measurements = {
            "mean_ndvi": {
                "value": round(ndvi_proxy, 3),
                "unit": "NDVI Index (-1.0 to +1.0)",
                "description": "Normalized Difference Vegetation Index tracking photosynthetic chlorophyll canopy density."
            },
            "dense_canopy_fraction": {
                "value": round(dense_canopy_pct, 1),
                "unit": "% Dense Forest / Agriculture",
                "description": "Area fraction with high photosynthetic vigor (NDVI > 0.6)."
            },
            "bare_soil_fraction": {
                "value": round(bare_soil_pct, 1),
                "unit": "% Arid / Bare Ground",
                "description": "Area fraction of un-vegetated rock, soil, or urban impervious surfaces."
            },
            "canopy_heterogeneity": {
                "value": round(features["optical_features"]["spatial_distribution"]["canny_edge_density_pct"], 2),
                "unit": "% Canopy Boundary Complexity",
                "description": "Spatial fragmentation and parcel boundary edge density."
            }
        }

        # Sonification Profile
        # Biosphere harmonics: Major Pentatonic root, warm resonant bandpass filter tracking NDVI
        bandpass_cutoff_hz = round(350.0 + (max(0.0, ndvi_proxy) * 2100.0), 0)

        sonification_profile = {
            "suggested_style": "ambient_earth",
            "base_frequency_hz": round(130.81 + (ndvi_proxy * 65.0), 1),  # C3 fundamental
            "frequency_range": "60 Hz - 3.4 kHz",
            "harmonic_timbre": "Rich pentatonic organ and acoustic undertones with resonant bandpass tracking canopy health.",
            "acoustic_parameters": {
                "bandpass_cutoff_hz": bandpass_cutoff_hz,
                "harmonic_resonance_q": round(2.2 + (dense_canopy_pct / 100.0) * 2.0, 2),
                "polyphony_voice_count": 5 if dense_canopy_pct > 50 else 3,
            }
        }

        return {
            "dataset_name": layer,
            "domain": self.DOMAIN,
            "acquisition_date": acquisition_date or "Latest Available Composite",
            "coordinates": bbox.to_dict() if bbox else None,
            "scientific_measurements": measurements,
            "visual_features": features["optical_features"],
            "normalized_features": features["normalized_features"],
            "data_quality": {
                **features["data_quality"],
                "phenology_status": "PEAK_BLOOM" if ndvi_proxy > 0.65 else "GROWTH_SEASON" if ndvi_proxy > 0.35 else "SENESCENCE_DORMANCY",
                "vegetation_integrity": "CONTINUOUS_CANOPY" if dense_canopy_pct > 60 else "FRAGMENTED_MOSAIC"
            },
            "sonification_profile": sonification_profile
        }


vegetation_processor = VegetationDataProcessor()
