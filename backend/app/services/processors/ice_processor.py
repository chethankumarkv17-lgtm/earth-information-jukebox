"""
Ice and Snow Data Processing Module
2026 NASA Space Apps Challenge — EARTH JUKEBOX
Handles Sea Ice Concentration (SIC), surface albedo reflectance, and cryospheric acoustics.
"""

from typing import Dict, Any, Optional
import numpy as np
import cv2
from app.services.geospatial.geospatial_engine import extract_visual_features_from_image, BoundingBox


class IceSnowDataProcessor:
    DOMAIN = "ice_snow_data"
    DEFAULT_LAYER = "MODIS_Terra_Sea_Ice"

    def process(
        self, 
        img_bgr: np.ndarray, 
        bbox: Optional[BoundingBox] = None, 
        acquisition_date: Optional[str] = None,
        layer_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Process polar sea ice and glacial snow rasters.
        Translates optical albedo, melt ponds, and polar freeboard into crystalline tones and deep sub-bass.
        """
        if img_bgr is None or img_bgr.size == 0:
            raise ValueError("Input ice/snow image array is empty.")

        layer = layer_name or self.DEFAULT_LAYER
        features = extract_visual_features_from_image(img_bgr)
        hsv = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2HSV)

        # High-albedo polar ice detection (high brightness, high cyan/blue reflectance)
        val = hsv[:, :, 2]
        sat = hsv[:, :, 1]
        
        # Ice pixels: High value > 180, low to moderate saturation
        ice_mask = (val > 180) & (sat < 50)
        total_px = img_bgr.shape[0] * img_bgr.shape[1]
        ice_concentration_pct = float((np.count_nonzero(ice_mask) / total_px) * 100.0)

        # Surface albedo estimate (fraction of reflected solar irradiance)
        surface_albedo = float(np.clip(0.08 + (features["normalized_features"]["standard_luminance_norm"] * 0.78), 0.08, 0.90))

        # Open water fraction within cryosphere
        open_water_pct = float(max(0.0, 100.0 - ice_concentration_pct))

        measurements = {
            "sea_ice_concentration": {
                "value": round(ice_concentration_pct, 1),
                "unit": "% Sea Ice Concentration",
                "description": "Area fraction of ocean surface covered by floating pack ice."
            },
            "surface_albedo": {
                "value": round(surface_albedo, 3),
                "unit": "Albedo Fraction (0.0 - 1.0)",
                "description": "Shortwave broadband hemispherical surface reflectance."
            },
            "open_water_fraction": {
                "value": round(open_water_pct, 1),
                "unit": "% Open Polar Ocean",
                "description": "Area fraction of dark ice-free ocean absorbing solar heat."
            },
            "ice_edge_fracture_density": {
                "value": round(features["optical_features"]["spatial_distribution"]["canny_edge_density_pct"], 2),
                "unit": "% Melt Lead & Fracture Density",
                "description": "Mechanical fracturing, ice leads, and marginal ice zone roughness."
            }
        }

        # Sonification Profile
        # Cryospheric aesthetics: Pristine high-register sine bell overtones when ice is thick,
        # transitioning to deep low-frequency sub-bass drones as ice retreats.
        fundamental_hz = 65.41 if ice_concentration_pct < 30.0 else 130.81 if ice_concentration_pct < 70.0 else 261.63

        sonification_profile = {
            "suggested_style": "ocean_waves" if ice_concentration_pct < 40 else "ambient_earth",
            "base_frequency_hz": round(fundamental_hz, 1),
            "frequency_range": "40 Hz - 6.5 kHz",
            "harmonic_timbre": "Crystalline high-overtone triangle/sine bells with low polar drone.",
            "acoustic_parameters": {
                "albedo_shimmer_cutoff_hz": round(1200.0 + (surface_albedo * 6000.0), 0),
                "fracture_noise_rate_hz": round(features["normalized_features"]["canny_edge_density_norm"] * 8.0, 2),
                "deep_drone_weight": round(open_water_pct / 100.0, 2),
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
                "pack_ice_stability": "CONSOLIDATED_PACK" if ice_concentration_pct > 85.0 else "MARGINAL_ICE_ZONE" if ice_concentration_pct > 30.0 else "OPEN_WATER_MELT",
                "polar_freeboard_estimate_m": round(0.2 + (surface_albedo * 1.8), 2)
            },
            "sonification_profile": sonification_profile
        }


ice_processor = IceSnowDataProcessor()
