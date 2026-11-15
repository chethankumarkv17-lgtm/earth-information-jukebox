/**
 * EARTH JUKEBOX — Curated NASA Earth Observation Datasets & Soundscape Profiles
 * Augmented with quantitative computer vision analysis features for procedural sonification.
 */

export const earthDatasets = [
  {
    id: "track-1",
    title: "Amazon Rainforest Canopy NDVI Resonance",
    region: "Amazon Basin, Brazil",
    coordinates: "03°08'40\"S 60°01'38\"W",
    satellite: "TERRA / AQUA",
    sensor: "MODIS (NDVI)",
    category: "biosphere",
    suggestedStyle: "ambient_earth",
    frequencyRange: "60 Hz - 3.4 kHz",
    duration: "04:18",
    currentTime: "01:42",
    spectralGradient: "from-emerald-400 via-teal-400 to-cyan-500",
    description: "Normalized Difference Vegetation Index tracking photosynthetic canopy density converted to rich harmonic acoustic undertones.",
    analysisData: {
      optical_features: {
        rgb_statistics: {
          r_mean: 28.4, g_mean: 142.1, b_mean: 72.8,
          r_std: 14.2, g_std: 38.6, b_std: 22.1,
          channel_correlation: { rg_corr: 0.42, rb_corr: 0.18, gb_corr: 0.65 }
        },
        brightness_metrics: {
          bt601_standard_luminance: 92.4,
          bt709_perceptual_luminance: 110.2,
          dynamic_range_db: 28.4,
        },
        dominant_colors: [
          { hex_code: "#054d3b", pixel_count: 63140, percentage: 63.14, color_name: "Sub-Canopy Deep Green" },
          { hex_code: "#10b880", pixel_count: 35850, percentage: 35.85, color_name: "Photosynthetic Canopy Green" },
          { hex_code: "#065f46", pixel_count: 810, percentage: 0.81, color_name: "Riparian Forest Green" },
        ],
        color_distribution: {
          mean_hue: 148.5,
          mean_saturation: 76.2,
          warmth_index: 0.0,
          color_entropy: 0.41,
        },
        pixel_intensity: {
          median: 88,
          q1_25th: 55,
          q3_75th: 124,
          iqr: 69,
        },
        spatial_distribution: {
          centroid_x_norm: 0.5069,
          centroid_y_norm: 0.4982,
          quadrant_energy: { q1_nw: 0.26, q2_ne: 0.24, q3_sw: 0.25, q4_se: 0.25 },
          canny_edge_density_pct: 14.2,
          laplacian_texture_energy: 85.8,
        }
      },
      regional_statistics: [
        { zone_id: "NW", zone_name: "Northwest", brightness: 32.5, contrast_rms: 34.5, edge_density_pct: 1.4, dominant_color_hex: "#064e3b" },
        { zone_id: "N", zone_name: "North", brightness: 34.1, contrast_rms: 36.2, edge_density_pct: 1.6, dominant_color_hex: "#065f46" },
        { zone_id: "NE", zone_name: "Northeast", brightness: 31.8, contrast_rms: 33.8, edge_density_pct: 1.3, dominant_color_hex: "#047857" },
        { zone_id: "W", zone_name: "West", brightness: 30.2, contrast_rms: 35.1, edge_density_pct: 1.5, dominant_color_hex: "#064e3b" },
        { zone_id: "Center", zone_name: "Equatorial", brightness: 28.6, contrast_rms: 37.9, edge_density_pct: 1.8, dominant_color_hex: "#10b981" },
        { zone_id: "E", zone_name: "East", brightness: 33.4, contrast_rms: 32.4, edge_density_pct: 1.2, dominant_color_hex: "#059669" },
        { zone_id: "SW", zone_name: "Southwest", brightness: 31.0, contrast_rms: 34.0, edge_density_pct: 1.4, dominant_color_hex: "#064e3b" },
        { zone_id: "S", zone_name: "South", brightness: 35.2, contrast_rms: 31.8, edge_density_pct: 1.1, dominant_color_hex: "#047857" },
        { zone_id: "SE", zone_name: "Southeast", brightness: 32.8, contrast_rms: 34.5, edge_density_pct: 1.4, dominant_color_hex: "#065f46" },
      ],
      normalized_features: {
        red_energy_norm: 0.117,
        green_energy_norm: 0.584,
        blue_energy_norm: 0.299,
        standard_luminance_norm: 0.362,
        perceptual_luminance_norm: 0.432,
        dynamic_range_norm: 0.592,
        rms_contrast_norm: 0.385,
        canny_edge_density_norm: 0.142,
        warmth_index: 0.0,
        color_entropy_norm: 0.41,
        centroid_shift_norm: 0.007,
      },
      frame_difference: {
        has_comparison: true,
        mean_absolute_difference: 4.8,
        mean_squared_error: 124.5,
        psnr_db: 27.2,
        normalized_change_magnitude: 0.019,
        motion_detected: false,
      }
    }
  },
  {
    id: "track-2",
    title: "North Pacific Equatorial Gyre Acoustic Drift",
    region: "Pacific Ocean Basin",
    coordinates: "14°12'00\"N 155°48'00\"W",
    satellite: "SWOT",
    sensor: "KaRIn Radar",
    category: "hydrosphere",
    suggestedStyle: "ocean_waves",
    frequencyRange: "35 Hz - 1.8 kHz",
    duration: "05:12",
    currentTime: "00:00",
    spectralGradient: "from-cyan-500 via-blue-500 to-indigo-500",
    description: "High-resolution sea surface height elevation waves sonified into sub-bass oceanic drone vibrations.",
    analysisData: {
      optical_features: {
        rgb_statistics: {
          r_mean: 12.2, g_mean: 58.4, b_mean: 164.8,
          r_std: 6.4, g_std: 18.2, b_std: 42.1,
          channel_correlation: { rg_corr: 0.81, rb_corr: 0.52, gb_corr: 0.74 }
        },
        brightness_metrics: {
          bt601_standard_luminance: 56.7,
          bt709_perceptual_luminance: 68.4,
          dynamic_range_db: 22.8,
        },
        dominant_colors: [
          { hex_code: "#034078", pixel_count: 58000, percentage: 58.0, color_name: "Deep Pelagic Blue" },
          { hex_code: "#001f54", pixel_count: 28000, percentage: 28.0, color_name: "Abyssal Trench Navy" },
          { hex_code: "#1282a2", pixel_count: 14000, percentage: 14.0, color_name: "Equatorial Gyre Cyan" },
        ],
        color_distribution: {
          mean_hue: 215.2,
          mean_saturation: 84.5,
          warmth_index: 0.0,
          color_entropy: 0.32,
        },
        pixel_intensity: { median: 52, q1_25th: 34, q3_75th: 78, iqr: 44 },
        spatial_distribution: {
          centroid_x_norm: 0.485,
          centroid_y_norm: 0.512,
          quadrant_energy: { q1_nw: 0.24, q2_ne: 0.26, q3_sw: 0.25, q4_se: 0.25 },
          canny_edge_density_pct: 6.4,
          laplacian_texture_energy: 42.1,
        }
      },
      regional_statistics: [
        { zone_id: "NW", zone_name: "Northwest", brightness: 21.0, contrast_rms: 18.2, edge_density_pct: 0.6, dominant_color_hex: "#001f54" },
        { zone_id: "N", zone_name: "North", brightness: 22.5, contrast_rms: 19.4, edge_density_pct: 0.7, dominant_color_hex: "#034078" },
        { zone_id: "NE", zone_name: "Northeast", brightness: 23.0, contrast_rms: 20.1, edge_density_pct: 0.8, dominant_color_hex: "#1282a2" },
        { zone_id: "W", zone_name: "West", brightness: 20.5, contrast_rms: 17.5, edge_density_pct: 0.5, dominant_color_hex: "#001f54" },
        { zone_id: "Center", zone_name: "Equatorial", brightness: 24.0, contrast_rms: 22.0, edge_density_pct: 0.9, dominant_color_hex: "#1282a2" },
        { zone_id: "E", zone_name: "East", brightness: 22.0, contrast_rms: 18.9, edge_density_pct: 0.6, dominant_color_hex: "#034078" },
        { zone_id: "SW", zone_name: "Southwest", brightness: 19.8, contrast_rms: 16.4, edge_density_pct: 0.5, dominant_color_hex: "#001f54" },
        { zone_id: "S", zone_name: "South", brightness: 21.2, contrast_rms: 17.8, edge_density_pct: 0.6, dominant_color_hex: "#034078" },
        { zone_id: "SE", zone_name: "Southeast", brightness: 22.8, contrast_rms: 19.2, edge_density_pct: 0.7, dominant_color_hex: "#034078" },
      ],
      normalized_features: {
        red_energy_norm: 0.052,
        green_energy_norm: 0.248,
        blue_energy_norm: 0.700,
        standard_luminance_norm: 0.222,
        perceptual_luminance_norm: 0.268,
        dynamic_range_norm: 0.475,
        rms_contrast_norm: 0.210,
        canny_edge_density_norm: 0.064,
        warmth_index: 0.0,
        color_entropy_norm: 0.32,
        centroid_shift_norm: 0.018,
      },
      frame_difference: {
        has_comparison: true,
        mean_absolute_difference: 9.6,
        mean_squared_error: 240.2,
        psnr_db: 24.3,
        normalized_change_magnitude: 0.038,
        motion_detected: true,
      }
    }
  },
  {
    id: "track-3",
    title: "Sahara Thermal Radiance Harmonic Spectrum",
    region: "Erg Chebbi, Morocco",
    coordinates: "31°10'48\"N 03°58'48\"W",
    satellite: "LANDSAT 9",
    sensor: "TIRS-2 Thermal",
    category: "thermal",
    suggestedStyle: "electronic",
    frequencyRange: "120 Hz - 5.6 kHz",
    duration: "03:55",
    currentTime: "00:00",
    spectralGradient: "from-amber-400 via-orange-500 to-rose-500",
    description: "Diurnal surface temperature radiance captured by long-wave infrared sensors transposed into shimmering metallic frequencies.",
    analysisData: {
      optical_features: {
        rgb_statistics: {
          r_mean: 188.5, g_mean: 96.2, b_mean: 24.8,
          r_std: 32.4, g_std: 24.1, b_std: 10.5,
          channel_correlation: { rg_corr: 0.92, rb_corr: 0.78, gb_corr: 0.88 }
        },
        brightness_metrics: {
          bt601_standard_luminance: 115.6,
          bt709_perceptual_luminance: 128.4,
          dynamic_range_db: 34.2,
        },
        dominant_colors: [
          { hex_code: "#90400d", pixel_count: 72000, percentage: 72.0, color_name: "Saharan Mineral Ochre" },
          { hex_code: "#f59e0b", pixel_count: 22000, percentage: 22.0, color_name: "Thermal Radiance Amber" },
          { hex_code: "#b45309", pixel_count: 6000, percentage: 6.0, color_name: "Dune Crest Copper" },
        ],
        color_distribution: {
          mean_hue: 24.5,
          mean_saturation: 86.8,
          warmth_index: 1.0,
          color_entropy: 0.44,
        },
        pixel_intensity: { median: 112, q1_25th: 88, q3_75th: 148, iqr: 60 },
        spatial_distribution: {
          centroid_x_norm: 0.524,
          centroid_y_norm: 0.488,
          quadrant_energy: { q1_nw: 0.28, q2_ne: 0.26, q3_sw: 0.22, q4_se: 0.24 },
          canny_edge_density_pct: 28.5,
          laplacian_texture_energy: 142.6,
        }
      },
      regional_statistics: [
        { zone_id: "NW", zone_name: "Northwest", brightness: 44.5, contrast_rms: 42.0, edge_density_pct: 2.8, dominant_color_hex: "#90400d" },
        { zone_id: "N", zone_name: "North", brightness: 46.2, contrast_rms: 44.5, edge_density_pct: 3.1, dominant_color_hex: "#f59e0b" },
        { zone_id: "NE", zone_name: "Northeast", brightness: 45.0, contrast_rms: 43.1, edge_density_pct: 2.9, dominant_color_hex: "#90400d" },
        { zone_id: "W", zone_name: "West", brightness: 42.1, contrast_rms: 40.2, edge_density_pct: 2.5, dominant_color_hex: "#90400d" },
        { zone_id: "Center", zone_name: "Equatorial", brightness: 48.9, contrast_rms: 48.6, edge_density_pct: 3.5, dominant_color_hex: "#f59e0b" },
        { zone_id: "E", zone_name: "East", brightness: 44.8, contrast_rms: 41.8, edge_density_pct: 2.7, dominant_color_hex: "#90400d" },
        { zone_id: "SW", zone_name: "Southwest", brightness: 41.0, contrast_rms: 38.5, edge_density_pct: 2.2, dominant_color_hex: "#90400d" },
        { zone_id: "S", zone_name: "South", brightness: 43.5, contrast_rms: 40.8, edge_density_pct: 2.6, dominant_color_hex: "#90400d" },
        { zone_id: "SE", zone_name: "Southeast", brightness: 45.2, contrast_rms: 42.5, edge_density_pct: 2.8, dominant_color_hex: "#f59e0b" },
      ],
      normalized_features: {
        red_energy_norm: 0.610,
        green_energy_norm: 0.311,
        blue_energy_norm: 0.079,
        standard_luminance_norm: 0.453,
        perceptual_luminance_norm: 0.503,
        dynamic_range_norm: 0.712,
        rms_contrast_norm: 0.485,
        canny_edge_density_norm: 0.285,
        warmth_index: 1.0,
        color_entropy_norm: 0.44,
        centroid_shift_norm: 0.026,
      },
      frame_difference: {
        has_comparison: true,
        mean_absolute_difference: 14.2,
        mean_squared_error: 420.5,
        psnr_db: 21.9,
        normalized_change_magnitude: 0.056,
        motion_detected: true,
      }
    }
  },
  {
    id: "track-4",
    title: "Aurora Borealis Ionospheric Field Harmonics",
    region: "Tromsø, Norway",
    coordinates: "69°38'56\"N 18°57'18\"E",
    satellite: "THEMIS",
    sensor: "Fluxgate Mag",
    category: "magnetosphere",
    suggestedStyle: "atmospheric",
    frequencyRange: "200 Hz - 8.2 kHz",
    duration: "06:04",
    currentTime: "00:00",
    spectralGradient: "from-purple-400 via-violet-500 to-cyan-400",
    description: "Solar wind geomagnetic disturbances and ultra-low-frequency Alfvén waves mapped to ethereal electronic chord clusters.",
    analysisData: {
      optical_features: {
        rgb_statistics: {
          r_mean: 92.4, g_mean: 44.8, b_mean: 182.1,
          r_std: 28.5, g_std: 19.4, b_std: 46.2,
          channel_correlation: { rg_corr: 0.62, rb_corr: 0.85, gb_corr: 0.71 }
        },
        brightness_metrics: {
          bt601_standard_luminance: 74.5,
          bt709_perceptual_luminance: 89.2,
          dynamic_range_db: 31.8,
        },
        dominant_colors: [
          { hex_code: "#7c3aed", pixel_count: 55000, percentage: 55.0, color_name: "Ionospheric Violet" },
          { hex_code: "#06b6d4", pixel_count: 32000, percentage: 32.0, color_name: "Auroral Cyan Filament" },
          { hex_code: "#1e1b4b", pixel_count: 13000, percentage: 13.0, color_name: "Magnetospheric Night" },
        ],
        color_distribution: {
          mean_hue: 268.4,
          mean_saturation: 82.1,
          warmth_index: 0.25,
          color_entropy: 0.48,
        },
        pixel_intensity: { median: 72, q1_25th: 42, q3_75th: 114, iqr: 72 },
        spatial_distribution: {
          centroid_x_norm: 0.492,
          centroid_y_norm: 0.534,
          quadrant_energy: { q1_nw: 0.22, q2_ne: 0.24, q3_sw: 0.28, q4_se: 0.26 },
          canny_edge_density_pct: 32.4,
          laplacian_texture_energy: 165.2,
        }
      },
      regional_statistics: [
        { zone_id: "NW", zone_name: "Northwest", brightness: 26.2, contrast_rms: 31.4, edge_density_pct: 2.8, dominant_color_hex: "#1e1b4b" },
        { zone_id: "N", zone_name: "North", brightness: 31.5, contrast_rms: 38.6, edge_density_pct: 3.5, dominant_color_hex: "#7c3aed" },
        { zone_id: "NE", zone_name: "Northeast", brightness: 29.8, contrast_rms: 35.2, edge_density_pct: 3.1, dominant_color_hex: "#06b6d4" },
        { zone_id: "W", zone_name: "West", brightness: 28.0, contrast_rms: 33.0, edge_density_pct: 2.9, dominant_color_hex: "#7c3aed" },
        { zone_id: "Center", zone_name: "Equatorial", brightness: 36.4, contrast_rms: 44.8, edge_density_pct: 4.2, dominant_color_hex: "#06b6d4" },
        { zone_id: "E", zone_name: "East", brightness: 32.1, contrast_rms: 36.9, edge_density_pct: 3.4, dominant_color_hex: "#7c3aed" },
        { zone_id: "SW", zone_name: "Southwest", brightness: 30.5, contrast_rms: 34.2, edge_density_pct: 3.0, dominant_color_hex: "#7c3aed" },
        { zone_id: "S", zone_name: "South", brightness: 34.0, contrast_rms: 39.1, edge_density_pct: 3.8, dominant_color_hex: "#7c3aed" },
        { zone_id: "SE", zone_name: "Southeast", brightness: 31.8, contrast_rms: 35.5, edge_density_pct: 3.2, dominant_color_hex: "#06b6d4" },
      ],
      normalized_features: {
        red_energy_norm: 0.289,
        green_energy_norm: 0.140,
        blue_energy_norm: 0.571,
        standard_luminance_norm: 0.292,
        perceptual_luminance_norm: 0.350,
        dynamic_range_norm: 0.662,
        rms_contrast_norm: 0.448,
        canny_edge_density_norm: 0.324,
        warmth_index: 0.25,
        color_entropy_norm: 0.48,
        centroid_shift_norm: 0.035,
      },
      frame_difference: {
        has_comparison: true,
        mean_absolute_difference: 18.6,
        mean_squared_error: 580.4,
        psnr_db: 20.5,
        normalized_change_magnitude: 0.073,
        motion_detected: true,
      }
    }
  },
  {
    id: "track-5",
    title: "Greenland Glacial Margin Micro-Fracture Drone",
    region: "Jakobshavn Glacier, Greenland",
    coordinates: "69°10'00\"N 49°50'00\"W",
    satellite: "CRYOSAT-2",
    sensor: "SIRAL Altimeter",
    category: "cryosphere",
    suggestedStyle: "experimental",
    frequencyRange: "40 Hz - 2.1 kHz",
    duration: "04:47",
    currentTime: "00:00",
    spectralGradient: "from-sky-300 via-cyan-400 to-blue-600",
    description: "Ice sheet elevation differentials and calving velocity translated into spatial granular acoustic textures.",
    analysisData: {
      optical_features: {
        rgb_statistics: {
          r_mean: 18.4, g_mean: 92.1, b_mean: 178.6,
          r_std: 8.5, g_std: 24.8, b_std: 38.4,
          channel_correlation: { rg_corr: 0.72, rb_corr: 0.64, gb_corr: 0.89 }
        },
        brightness_metrics: {
          bt601_standard_luminance: 79.4,
          bt709_perceptual_luminance: 96.2,
          dynamic_range_db: 24.1,
        },
        dominant_colors: [
          { hex_code: "#072f48", pixel_count: 70000, percentage: 70.0, color_name: "Deep Glacial Ocean" },
          { hex_code: "#38bdf8", pixel_count: 22000, percentage: 22.0, color_name: "CryoSat Cyan Albedo" },
          { hex_code: "#e0f2fe", pixel_count: 8000, percentage: 8.0, color_name: "Calved Iceberg White" },
        ],
        color_distribution: {
          mean_hue: 204.8,
          mean_saturation: 85.0,
          warmth_index: 0.0,
          color_entropy: 0.36,
        },
        pixel_intensity: { median: 74, q1_25th: 48, q3_75th: 108, iqr: 60 },
        spatial_distribution: {
          centroid_x_norm: 0.518,
          centroid_y_norm: 0.495,
          quadrant_energy: { q1_nw: 0.27, q2_ne: 0.25, q3_sw: 0.23, q4_se: 0.25 },
          canny_edge_density_pct: 18.6,
          laplacian_texture_energy: 94.2,
        }
      },
      regional_statistics: [
        { zone_id: "NW", zone_name: "Northwest", brightness: 28.5, contrast_rms: 26.4, edge_density_pct: 1.8, dominant_color_hex: "#072f48" },
        { zone_id: "N", zone_name: "North", brightness: 32.1, contrast_rms: 29.8, edge_density_pct: 2.1, dominant_color_hex: "#38bdf8" },
        { zone_id: "NE", zone_name: "Northeast", brightness: 30.4, contrast_rms: 27.5, edge_density_pct: 1.9, dominant_color_hex: "#072f48" },
        { zone_id: "W", zone_name: "West", brightness: 27.8, contrast_rms: 25.1, edge_density_pct: 1.6, dominant_color_hex: "#072f48" },
        { zone_id: "Center", zone_name: "Equatorial", brightness: 35.6, contrast_rms: 34.2, edge_density_pct: 2.6, dominant_color_hex: "#38bdf8" },
        { zone_id: "E", zone_name: "East", brightness: 31.0, contrast_rms: 28.6, edge_density_pct: 2.0, dominant_color_hex: "#072f48" },
        { zone_id: "SW", zone_name: "Southwest", brightness: 26.5, contrast_rms: 24.2, edge_density_pct: 1.5, dominant_color_hex: "#072f48" },
        { zone_id: "S", zone_name: "South", brightness: 29.4, contrast_rms: 27.0, edge_density_pct: 1.8, dominant_color_hex: "#072f48" },
        { zone_id: "SE", zone_name: "Southeast", brightness: 33.2, contrast_rms: 31.5, edge_density_pct: 2.2, dominant_color_hex: "#38bdf8" },
      ],
      normalized_features: {
        red_energy_norm: 0.064,
        green_energy_norm: 0.318,
        blue_energy_norm: 0.618,
        standard_luminance_norm: 0.311,
        perceptual_luminance_norm: 0.377,
        dynamic_range_norm: 0.502,
        rms_contrast_norm: 0.342,
        canny_edge_density_norm: 0.186,
        warmth_index: 0.0,
        color_entropy_norm: 0.36,
        centroid_shift_norm: 0.019,
      },
      frame_difference: {
        has_comparison: true,
        mean_absolute_difference: 8.5,
        mean_squared_error: 280.6,
        psnr_db: 23.6,
        normalized_change_magnitude: 0.033,
        motion_detected: true,
      }
    }
  },
  {
    id: "track-6",
    title: "Gulf of Mexico Phytoplankton Chlorophyll Bloom",
    region: "Gulf of Mexico",
    coordinates: "25°42'00\"N 88°30'00\"W",
    satellite: "PACE",
    sensor: "OCI Spectrometer",
    category: "biosphere",
    suggestedStyle: "ambient_earth",
    frequencyRange: "95 Hz - 4.8 kHz",
    duration: "03:38",
    currentTime: "00:00",
    spectralGradient: "from-teal-300 via-emerald-400 to-sky-400",
    description: "Multispectral ocean color chlorophyll absorption indices rendered as fluid undulating arpeggiated frequencies.",
    analysisData: {
      optical_features: {
        rgb_statistics: {
          r_mean: 22.4, g_mean: 156.8, b_mean: 138.2,
          r_std: 10.2, g_std: 34.5, b_std: 28.1,
          channel_correlation: { rg_corr: 0.55, rb_corr: 0.42, gb_corr: 0.88 }
        },
        brightness_metrics: {
          bt601_standard_luminance: 106.2,
          bt709_perceptual_luminance: 124.5,
          dynamic_range_db: 29.8,
        },
        dominant_colors: [
          { hex_code: "#14b8a6", pixel_count: 52000, percentage: 52.0, color_name: "PACE Chlorophyll Teal" },
          { hex_code: "#0f766e", pixel_count: 36000, percentage: 36.0, color_name: "Pelagic Phytoplankton Emerald" },
          { hex_code: "#0284c7", pixel_count: 12000, percentage: 12.0, color_name: "Shelf Ocean Blue" },
        ],
        color_distribution: {
          mean_hue: 174.5,
          mean_saturation: 81.2,
          warmth_index: 0.1,
          color_entropy: 0.38,
        },
        pixel_intensity: { median: 104, q1_25th: 78, q3_75th: 136, iqr: 58 },
        spatial_distribution: {
          centroid_x_norm: 0.504,
          centroid_y_norm: 0.508,
          quadrant_energy: { q1_nw: 0.25, q2_ne: 0.26, q3_sw: 0.24, q4_se: 0.25 },
          canny_edge_density_pct: 19.8,
          laplacian_texture_energy: 102.4,
        }
      },
      regional_statistics: [
        { zone_id: "NW", zone_name: "Northwest", brightness: 38.5, contrast_rms: 32.1, edge_density_pct: 1.8, dominant_color_hex: "#0f766e" },
        { zone_id: "N", zone_name: "North", brightness: 42.4, contrast_rms: 36.4, edge_density_pct: 2.2, dominant_color_hex: "#14b8a6" },
        { zone_id: "NE", zone_name: "Northeast", brightness: 40.8, contrast_rms: 34.0, edge_density_pct: 2.0, dominant_color_hex: "#0f766e" },
        { zone_id: "W", zone_name: "West", brightness: 37.2, contrast_rms: 30.8, edge_density_pct: 1.7, dominant_color_hex: "#0f766e" },
        { zone_id: "Center", zone_name: "Equatorial", brightness: 45.6, contrast_rms: 40.5, edge_density_pct: 2.8, dominant_color_hex: "#14b8a6" },
        { zone_id: "E", zone_name: "East", brightness: 39.5, contrast_rms: 33.2, edge_density_pct: 1.9, dominant_color_hex: "#0284c7" },
        { zone_id: "SW", zone_name: "Southwest", brightness: 36.0, contrast_rms: 29.5, edge_density_pct: 1.6, dominant_color_hex: "#0f766e" },
        { zone_id: "S", zone_name: "South", brightness: 38.8, contrast_rms: 32.0, edge_density_pct: 1.8, dominant_color_hex: "#0f766e" },
        { zone_id: "SE", zone_name: "Southeast", brightness: 41.2, contrast_rms: 35.0, edge_density_pct: 2.1, dominant_color_hex: "#14b8a6" },
      ],
      normalized_features: {
        red_energy_norm: 0.071,
        green_energy_norm: 0.494,
        blue_energy_norm: 0.435,
        standard_luminance_norm: 0.416,
        perceptual_luminance_norm: 0.488,
        dynamic_range_norm: 0.620,
        rms_contrast_norm: 0.405,
        canny_edge_density_norm: 0.198,
        warmth_index: 0.1,
        color_entropy_norm: 0.38,
        centroid_shift_norm: 0.009,
      },
      frame_difference: {
        has_comparison: true,
        mean_absolute_difference: 6.4,
        mean_squared_error: 168.2,
        psnr_db: 25.8,
        normalized_change_magnitude: 0.025,
        motion_detected: false,
      }
    }
  },
]
