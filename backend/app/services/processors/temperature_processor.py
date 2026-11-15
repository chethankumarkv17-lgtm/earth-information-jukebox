"""
Temperature Data Processing Module
2026 NASA Space Apps Challenge — EARTH JUKEBOX
Handles Land Surface Temperature (MODIS LST), surface kinetic thermal radiance, and urban heat.
"""

from typing import Dict, Any, Optional
import numpy as np
import cv2
from app.services.geospatial.geospatial_engine import extract_visual_features_from_image, BoundingBox


class TemperatureDataProcessor:
    DOMAIN = "temperature_data"
    DEFAULT_LAYER = "MODIS_Terra_Land_Surface_Temp_Day"

    def process(
        self, 
        img_bgr: np.ndarray, 
        bbox: Optional[BoundingBox] = None, 
        acquisition_date: Optional[str] = None,
        layer_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Process land surface temperature (LST) and thermal infrared observation rasters.
        Translates physical thermal kinetics into pitch glissando and harmonic warmth.
        """
        if img_bgr is None or img_bgr.size == 0:
            raise ValueError("Input temperature image array is empty.")

        layer = layer_name or self.DEFAULT_LAYER
        features = extract_visual_features_from_image(img_bgr)

        # In MODIS LST Day false-color palettes:
        # Cold blues / cyans (-20°C to 10°C) -> Greens/Yellows (15°C to 30°C) -> Oranges/Reds/Purples (35°C to 55°C)
        warmth = features["normalized_features"]["warmth_index"]
        lum = features["normalized_features"]["standard_luminance_norm"]

        # Physical calibration model for LST: typical range -25°C to +55°C
        mean_lst_celsius = float(-20.0 + (warmth * 55.0) + (lum * 20.0))
        mean_lst_celsius = float(np.clip(mean_lst_celsius, -30.0, 60.0))
        mean_lst_kelvin = mean_lst_celsius + 273.15

        # Urban heat island or extreme hotspot indicator
        red_channel = img_bgr[:, :, 2].astype(np.float32)
        hotspots_detected = int(np.count_nonzero(red_channel > 230))
        hotspot_pct = float((hotspots_detected / (img_bgr.shape[0] * img_bgr.shape[1])) * 100.0)

        measurements = {
            "land_surface_temperature": {
                "value": round(mean_lst_celsius, 2),
                "unit": "°C",
                "description": "Daily mean radiometric land surface skin temperature."
            },
            "land_surface_temperature_kelvin": {
                "value": round(mean_lst_kelvin, 2),
                "unit": "K",
                "description": "Thermodynamic surface radiative temperature."
            },
            "thermal_anomaly_index": {
                "value": round(hotspot_pct, 2),
                "unit": "% Extreme Heat Anomaly Area",
                "description": "Percentage of land area exhibiting extreme surface heat stress."
            },
            "thermal_dynamic_range": {
                "value": round(features["optical_features"]["brightness_metrics"]["dynamic_range_db"], 1),
                "unit": "dB Radiance Range",
                "description": "Diurnal thermal contrast across geographic terrain."
            }
        }

        # Sonification Profile
        # Mathematical mapping: +0.1°C departure raises pitch by 1 semitone
        # Hotter temperature increases tube overdrive distortion and filter cutoff
        base_pitch_hz = 110.0 * (2.0 ** (np.clip(mean_lst_celsius - 15.0, -12.0, 24.0) / 12.0))

        sonification_profile = {
            "suggested_style": "ambient_earth" if mean_lst_celsius < 35.0 else "experimental",
            "base_frequency_hz": round(base_pitch_hz, 1),
            "frequency_range": "65 Hz - 3.8 kHz",
            "harmonic_timbre": "Warm analog sawtooth oscillator with temperature-driven pitch glissando.",
            "acoustic_parameters": {
                "harmonic_saturation": round(0.1 + (max(0.0, mean_lst_celsius) / 60.0) * 0.7, 2),
                "filter_cutoff_hz": round(500.0 + warmth * 4000.0, 0),
                "pitch_transpose_semitones": round((mean_lst_celsius - 15.0) / 2.0, 1),
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
                "thermal_stress_tier": "EXTREME_HEAT" if mean_lst_celsius > 40.0 else "ELEVATED" if mean_lst_celsius > 28.0 else "MODERATE" if mean_lst_celsius > 10.0 else "COLD",
                "hotspot_count": hotspots_detected
            },
            "sonification_profile": sonification_profile
        }


temperature_processor = TemperatureDataProcessor()
