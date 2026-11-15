"""
Cloud Data Processing Module
2026 NASA Space Apps Challenge — EARTH JUKEBOX
Handles Cloud Optical Thickness (COT), Cloud Water Path, and atmospheric acoustics.
"""

from typing import Dict, Any, Optional
import numpy as np
import cv2
from app.services.geospatial.geospatial_engine import extract_visual_features_from_image, BoundingBox


class CloudDataProcessor:
    DOMAIN = "cloud_data"
    DEFAULT_LAYER = "MODIS_Terra_Cloud_Water_Path"

    def process(
        self, 
        img_bgr: np.ndarray, 
        bbox: Optional[BoundingBox] = None, 
        acquisition_date: Optional[str] = None,
        layer_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Process atmospheric cloud rasters.
        Translates atmospheric scattering, cloud density, and water path to high-frequency shimmer and diffusion.
        """
        if img_bgr is None or img_bgr.size == 0:
            raise ValueError("Input cloud image array is empty.")

        layer = layer_name or self.DEFAULT_LAYER
        features = extract_visual_features_from_image(img_bgr)
        hsv = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2HSV)

        # Cloud fraction: pixels with significant brightness and low saturation
        val = hsv[:, :, 2]
        sat = hsv[:, :, 1]
        cloud_pixels = (val > 150) & (sat < 60)
        total_px = img_bgr.shape[0] * img_bgr.shape[1]
        cloud_fraction_pct = float((np.count_nonzero(cloud_pixels) / total_px) * 100.0)

        # Optical thickness / Water path proxy (calibrated from brightness intensity)
        mean_cloud_val = float(np.mean(val[cloud_pixels])) if np.count_nonzero(cloud_pixels) > 0 else 0.0
        cloud_optical_thickness = float(np.clip((mean_cloud_val / 255.0) * 65.0, 0.0, 100.0))
        cloud_water_path_g_m2 = float(cloud_optical_thickness * 12.5)

        measurements = {
            "cloud_fraction": {
                "value": round(cloud_fraction_pct, 1),
                "unit": "% Cloud Cover",
                "description": "Area percentage obscured by atmospheric cloud formations."
            },
            "cloud_optical_thickness": {
                "value": round(cloud_optical_thickness, 2),
                "unit": "τ (Dimensionless Optical Depth)",
                "description": "Atmospheric opacity to visible radiation."
            },
            "cloud_water_path": {
                "value": round(cloud_water_path_g_m2, 1),
                "unit": "g/m²",
                "description": "Column-integrated liquid water and ice crystal mass in clouds."
            },
            "atmospheric_diffuse_index": {
                "value": round(features["normalized_features"]["standard_luminance_norm"], 3),
                "unit": "Scattering Factor (0.0 - 1.0)",
                "description": "Rayleigh and aerosol light scattering multiplier."
            }
        }

        # Sonification Profile
        # Atmospheric aesthetics: Ethereal high-register shimmer, noise bursts, Lydian modal chords
        sonification_profile = {
            "suggested_style": "atmospheric",
            "base_frequency_hz": round(220.0 + (cloud_fraction_pct / 100.0) * 440.0, 1),
            "frequency_range": "150 Hz - 8.5 kHz",
            "harmonic_timbre": "Crystalline Lydian modal chime with white-noise aerosol breath sweeps.",
            "acoustic_parameters": {
                "noise_generator_mix": round(0.1 + (cloud_fraction_pct / 100.0) * 0.45, 2),
                "resonant_bandpass_q": round(2.0 + (cloud_optical_thickness / 100.0) * 6.0, 1),
                "stereo_reverb_decay": 5.2,
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
                "cloud_regime": "OVERCAST" if cloud_fraction_pct > 75.0 else "SCATTERED" if cloud_fraction_pct > 30.0 else "CLEAR_SKY",
                "atmospheric_opacity": "DENSE_DEEP_CONVECTIVE" if cloud_optical_thickness > 40.0 else "CIRRUS_STRATIFORM"
            },
            "sonification_profile": sonification_profile
        }


cloud_processor = CloudDataProcessor()
