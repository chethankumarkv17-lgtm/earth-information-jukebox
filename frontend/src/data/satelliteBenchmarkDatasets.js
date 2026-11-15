/**
 * EARTH JUKEBOX — Curated Remote Sensing & Satellite Imagery Benchmarks
 * Sourced and synthesized from the Open-Source Remote Sensing Archive:
 * "Awesome Satellite Imagery Datasets" (chrieke / Rob Mark Cole / Seyed Ali Ahmadi)
 * 
 * Each benchmark dataset includes:
 * - Full peer-reviewed scientific attribution & repository links
 * - Sensor platform, ground sample distance (spatial resolution), and spectral band specs
 * - Quantitative computer vision features calibrated for physical sonification
 * - Physical sensor-to-sound parameter mapping rules
 */

export const SENSOR_MODALITIES = [
  "All Modalities",
  "Optical Multispectral",
  "Synthetic Aperture Radar (SAR)",
  "Very High Resolution (VHR)",
  "Thermal & Nighttime Infrared",
  "Hyperspectral & LiDAR",
  "Drone / UAV Aerial",
];

export const BENCHMARK_TASKS = [
  "All Tasks",
  "Semantic Segmentation",
  "Instance Segmentation",
  "Object Detection",
  "Scene Classification",
  "Multi-Sensor Fusion",
];

export const satelliteBenchmarkDatasets = [
  // =========================================================================
  // 1. SEN12MS (TUM, 2019) — Multi-Sensor Benchmark (SAR + Optical + Land Cover)
  // =========================================================================
  {
    id: "bench-sen12ms",
    title: "SEN12MS: Multi-Sensor Earth Observation Benchmark",
    subtitle: "Sentinel-1 SAR + Sentinel-2 Multispectral + MODIS Land Cover Triplets",
    organization: "Technical University of Munich (TUM) & DLR",
    year: 2019,
    task: "Semantic Segmentation",
    modality: "Multi-Sensor Fusion",
    sensor: "Sentinel-1 (C-SAR) & Sentinel-2 (MSI) & Terra/Aqua (MODIS)",
    spatialResolution: "10 m Ground Sample Distance (GSD)",
    resolutionTier: "moderate", // "vhr" | "high" | "moderate" | "planetary"
    spectralBands: "15 Bands (2 SAR Polarizations VV/VH + 13 Multispectral VNIR-SWIR)",
    revisitCadence: "5 Days (Constellation)",
    volume: "180,748 Corresponding Triplets (All Continents & 4 Meteorological Seasons)",
    license: "Creative Commons Attribution 4.0 International (CC-BY 4.0)",
    paperUrl: "https://arxiv.org/abs/1906.07789",
    datasetUrl: "https://mediatum.ub.tum.de/1474000",
    description: "A foundational dataset curating georeferenced triplets of all-weather Sentinel-1 radar backscatter, cloud-free Sentinel-2 13-band surface reflectance, and 17-class MODIS Land Cover across 4 meteorological seasons worldwide.",
    sonificationMapping: {
      radarToBass: "Sentinel-1 VV/VH backscatter ratio maps to 40-90 Hz sub-bass FM oscillator, sonifying ground structural roughness.",
      opticalToHarmony: "Sentinel-2 NDVI (B8 NIR / B4 Red) controls resonant bandpass filter cutoff (350 Hz to 2.4 kHz) and harmonic overtone spread.",
      landCoverToTexture: "17 MODIS land cover classes modulate chord timbre: dense forest = warm pentatonic; urban = chromatic FM bells.",
    },
    suggestedStyle: "ambient_earth",
    analysisData: {
      optical_features: {
        rgb_statistics: {
          r_mean: 42.1, g_mean: 118.4, b_mean: 68.2,
          r_std: 18.5, g_std: 32.1, b_std: 24.6,
          channel_correlation: { rg_corr: 0.51, rb_corr: 0.22, gb_corr: 0.71 }
        },
        brightness_metrics: {
          bt601_standard_luminance: 88.5,
          bt709_perceptual_luminance: 104.2,
          dynamic_range_db: 31.8,
        },
        dominant_colors: [
          { hex_code: "#2d5a27", pixel_count: 51200, percentage: 51.2, color_name: "Deciduous Canopy Green" },
          { hex_code: "#5b8c5a", pixel_count: 28400, percentage: 28.4, color_name: "Cultivated Cropland" },
          { hex_code: "#1f382b", pixel_count: 20400, percentage: 20.4, color_name: "Coniferous Woodland" },
        ],
        color_distribution: {
          mean_hue: 132.4,
          mean_saturation: 68.5,
          warmth_index: 0.12,
          color_entropy: 0.46,
        },
        pixel_intensity: { median: 84, q1_25th: 51, q3_75th: 118, iqr: 67 },
        spatial_distribution: {
          centroid_x_norm: 0.5012,
          centroid_y_norm: 0.4991,
          quadrant_energy: { q1_nw: 0.25, q2_ne: 0.25, q3_sw: 0.25, q4_se: 0.25 },
          canny_edge_density_pct: 16.8,
          laplacian_texture_energy: 92.4,
        }
      },
      regional_statistics: [
        { zone_id: "NW", zone_name: "Northwest", brightness: 34.2, contrast_rms: 36.1, edge_density_pct: 1.6, dominant_color_hex: "#2d5a27" },
        { zone_id: "N", zone_name: "North", brightness: 35.8, contrast_rms: 37.4, edge_density_pct: 1.7, dominant_color_hex: "#5b8c5a" },
        { zone_id: "NE", zone_name: "Northeast", brightness: 33.1, contrast_rms: 34.9, edge_density_pct: 1.5, dominant_color_hex: "#1f382b" },
        { zone_id: "W", zone_name: "West", brightness: 32.5, contrast_rms: 36.5, edge_density_pct: 1.6, dominant_color_hex: "#2d5a27" },
        { zone_id: "Center", zone_name: "Equatorial", brightness: 30.1, contrast_rms: 39.2, edge_density_pct: 1.9, dominant_color_hex: "#5b8c5a" },
        { zone_id: "E", zone_name: "East", brightness: 34.6, contrast_rms: 33.8, edge_density_pct: 1.4, dominant_color_hex: "#1f382b" },
        { zone_id: "SW", zone_name: "Southwest", brightness: 33.0, contrast_rms: 35.2, edge_density_pct: 1.5, dominant_color_hex: "#2d5a27" },
        { zone_id: "S", zone_name: "South", brightness: 36.4, contrast_rms: 32.9, edge_density_pct: 1.3, dominant_color_hex: "#5b8c5a" },
        { zone_id: "SE", zone_name: "Southeast", brightness: 34.0, contrast_rms: 35.8, edge_density_pct: 1.6, dominant_color_hex: "#1f382b" },
      ],
      normalized_features: {
        red_energy_norm: 0.184,
        green_energy_norm: 0.518,
        blue_energy_norm: 0.298,
        standard_luminance_norm: 0.347,
        perceptual_luminance_norm: 0.408,
        dynamic_range_norm: 0.612,
        rms_contrast_norm: 0.412,
        canny_edge_density_norm: 0.168,
        warmth_index: 0.12,
        color_entropy_norm: 0.46,
        centroid_shift_norm: 0.003,
      }
    }
  },

  // =========================================================================
  // 2. EuroSAT (DFKI, 2017) — Sentinel-2 13-Band Land Use Classification
  // =========================================================================
  {
    id: "bench-eurosat",
    title: "EuroSAT: Land Use and Land Cover Classification with Sentinel-2",
    subtitle: "27,000 Georeferenced Multispectral 13-Band Chips Across 30 European Countries",
    organization: "German Research Center for Artificial Intelligence (DFKI)",
    year: 2017,
    task: "Scene Classification",
    modality: "Optical Multispectral",
    sensor: "Sentinel-2 (MSI)",
    spatialResolution: "10 m Ground Sample Distance (GSD)",
    resolutionTier: "moderate",
    spectralBands: "13 Bands (Coastal Blue, RGB, Vegetation Red Edge, NIR, SWIR)",
    revisitCadence: "5 Days",
    volume: "27,000 Image Patches (64x64 px, 10 Land Cover Classes)",
    license: "Open Access / MIT Benchmark License",
    paperUrl: "https://arxiv.org/abs/1709.00029",
    datasetUrl: "https://github.com/phelber/EuroSAT",
    description: "Standard machine learning benchmark based on Sentinel-2 optical data covering 10 distinct classes: Forest, Residential, Industrial, River, Highway, Permanent Crop, Herbaceous Vegetation, Pasture, Annual Crop, and Sea/Lake.",
    sonificationMapping: {
      bandEnergyToChords: "13-band spectral energy profile translates into a 13-note Microtonal / Dorian harmonic chord cluster.",
      vegetationEdgeToTimbre: "Red Edge Bands (B5, B6, B7) govern acoustic brightness and digital filter resonance (Q factor = 3.2).",
      urbanVsNature: "Impervious surfaces introduce FM distortion; natural water bodies soften into smooth sine tones.",
    },
    suggestedStyle: "atmospheric",
    analysisData: {
      optical_features: {
        rgb_statistics: {
          r_mean: 62.4, g_mean: 130.8, b_mean: 94.5,
          r_std: 22.1, g_std: 38.4, b_std: 28.1,
          channel_correlation: { rg_corr: 0.48, rb_corr: 0.31, gb_corr: 0.69 }
        },
        brightness_metrics: {
          bt601_standard_luminance: 108.2,
          bt709_perceptual_luminance: 122.6,
          dynamic_range_db: 34.2,
        },
        dominant_colors: [
          { hex_code: "#3b7a57", pixel_count: 42000, percentage: 42.0, color_name: "Amazonian Green" },
          { hex_code: "#7ba05b", pixel_count: 36000, percentage: 36.0, color_name: "Herbaceous Meadow" },
          { hex_code: "#4682b4", pixel_count: 22000, percentage: 22.0, color_name: "Riparian Waterway" },
        ],
        color_distribution: {
          mean_hue: 128.0,
          mean_saturation: 58.0,
          warmth_index: 0.18,
          color_entropy: 0.52,
        },
        pixel_intensity: { median: 102, q1_25th: 68, q3_75th: 134, iqr: 66 },
        spatial_distribution: {
          centroid_x_norm: 0.502,
          centroid_y_norm: 0.498,
          quadrant_energy: { q1_nw: 0.26, q2_ne: 0.24, q3_sw: 0.25, q4_se: 0.25 },
          canny_edge_density_pct: 18.4,
          laplacian_texture_energy: 88.0,
        }
      },
      regional_statistics: [
        { zone_id: "Center", zone_name: "Equatorial", brightness: 41.2, contrast_rms: 42.0, edge_density_pct: 2.1, dominant_color_hex: "#3b7a57" },
      ],
      normalized_features: {
        red_energy_norm: 0.217,
        green_energy_norm: 0.455,
        blue_energy_norm: 0.328,
        standard_luminance_norm: 0.424,
        perceptual_luminance_norm: 0.481,
        dynamic_range_norm: 0.658,
        rms_contrast_norm: 0.440,
        canny_edge_density_norm: 0.184,
        warmth_index: 0.18,
        color_entropy_norm: 0.52,
        centroid_shift_norm: 0.004,
      }
    }
  },

  // =========================================================================
  // 3. SpaceNet 6: Multi-Sensor All-Weather Mapping (SAR + Optical)
  // =========================================================================
  {
    id: "bench-spacenet6",
    title: "SpaceNet 6: Multi-Sensor All-Weather SAR & Optical Mapping",
    subtitle: "Capella Space X-Band SAR (0.5m) + Maxar WorldView-3 (0.3m) in Rotterdam",
    organization: "CosmiQ Works, Capella Space, Maxar Technologies, AWS, Intel",
    year: 2020,
    task: "Instance Segmentation",
    modality: "Synthetic Aperture Radar (SAR)",
    sensor: "Capella Space X-Band SAR & WorldView-3",
    spatialResolution: "0.3 m - 0.5 m Very High Resolution (VHR)",
    resolutionTier: "vhr",
    spectralBands: "Quad-Polarization SAR (HH, HV, VH, VV) + 8-Band Optical VNIR",
    revisitCadence: "Rapid On-Demand Sub-Daily Revisit",
    volume: "48,000 Building Footprints with Precise Height Attributes (Rotterdam Port)",
    license: "Creative Commons Attribution-ShareAlike 4.0 (CC BY-SA 4.0)",
    paperUrl: "https://arxiv.org/abs/2004.06500",
    datasetUrl: "https://spacenet.ai/sn6-challenge/",
    description: "Evaluates automated structural mapping under cloud cover and night conditions by pairing 0.5m quad-polarization X-band radar with 0.3m optical imagery over the busy maritime and industrial port of Rotterdam, Netherlands.",
    sonificationMapping: {
      sarPolarizationToWaveform: "HH/HV cross-polarization ratios drive dual-oscillator frequency modulation (carrier 65 Hz, modulator 130 Hz).",
      vhrEdgeToArpTempo: "Sub-meter building edge density (0.3m) triggers rapid 16th-note arpeggiator clock subdivisions.",
      portAcoustics: "Industrial metallic resonances synthesized via low-pass comb filtering and short room reverberation.",
    },
    suggestedStyle: "electronic",
    analysisData: {
      optical_features: {
        rgb_statistics: {
          r_mean: 88.2, g_mean: 92.4, b_mean: 104.1,
          r_std: 38.6, g_std: 36.2, b_std: 42.0,
          channel_correlation: { rg_corr: 0.78, rb_corr: 0.81, gb_corr: 0.88 }
        },
        brightness_metrics: {
          bt601_standard_luminance: 94.1,
          bt709_perceptual_luminance: 96.8,
          dynamic_range_db: 42.5,
        },
        dominant_colors: [
          { hex_code: "#334155", pixel_count: 48000, percentage: 48.0, color_name: "Industrial Port Slate" },
          { hex_code: "#64748b", pixel_count: 32000, percentage: 32.0, color_name: "Radar Concrete Reflectance" },
          { hex_code: "#0ea5e9", pixel_count: 20000, percentage: 20.0, color_name: "North Sea Water" },
        ],
        color_distribution: {
          mean_hue: 210.5,
          mean_saturation: 28.0,
          warmth_index: 0.05,
          color_entropy: 0.68,
        },
        pixel_intensity: { median: 92, q1_25th: 56, q3_75th: 138, iqr: 82 },
        spatial_distribution: {
          centroid_x_norm: 0.514,
          centroid_y_norm: 0.488,
          quadrant_energy: { q1_nw: 0.28, q2_ne: 0.26, q3_sw: 0.22, q4_se: 0.24 },
          canny_edge_density_pct: 32.6,
          laplacian_texture_energy: 168.4,
        }
      },
      regional_statistics: [
        { zone_id: "Center", zone_name: "Equatorial", brightness: 44.5, contrast_rms: 58.2, edge_density_pct: 3.8, dominant_color_hex: "#334155" },
      ],
      normalized_features: {
        red_energy_norm: 0.309,
        green_energy_norm: 0.324,
        blue_energy_norm: 0.367,
        standard_luminance_norm: 0.369,
        perceptual_luminance_norm: 0.380,
        dynamic_range_norm: 0.817,
        rms_contrast_norm: 0.620,
        canny_edge_density_norm: 0.326,
        warmth_index: 0.05,
        color_entropy_norm: 0.68,
        centroid_shift_norm: 0.018,
      }
    }
  },

  // =========================================================================
  // 4. PASTIS (IGN, 2021) — Panoptic Agricultural Satellite Time Series
  // =========================================================================
  {
    id: "bench-pastis",
    title: "PASTIS: Panoptic Agricultural Satellite Time Series",
    subtitle: "124,422 Crop Parcels across 2,433 Sentinel-2 Multi-Temporal Stacks in France",
    organization: "Institut National de l'Information Géographique et Forestière (IGN)",
    year: 2021,
    task: "Instance Segmentation",
    modality: "Optical Multispectral",
    sensor: "Sentinel-2 (MSI)",
    spatialResolution: "10 m Ground Sample Distance (GSD)",
    resolutionTier: "moderate",
    spectralBands: "10 Multispectral Bands (10m & 20m resampled)",
    revisitCadence: "5-Day Dense Temporal Series (Full Crop Growth Cycle)",
    volume: "124,422 Agricultural Parcels, 2,433 Multi-Temporal Chip Stacks",
    license: "Open Database License (ODbL)",
    paperUrl: "https://arxiv.org/abs/2107.07933",
    datasetUrl: "https://github.com/VSainteuf/pastis-benchmark",
    description: "Benchmark for panoptic segmentation of agricultural parcels from multi-temporal satellite sequences. Unifies parcel instance identification with crop classification across winter wheat, corn, barley, rapeseed, and vineyards.",
    sonificationMapping: {
      cropCycleToTempo: "Vegetation phenological growth curves modulate sequence tempo: emergence = 60 BPM, peak bloom = 98 BPM.",
      panopticParcelsToPolyphony: "Distinct agricultural parcel boundaries trigger discrete polyphonic voices on a pentatonic scale.",
      seasonalFade: "Chlorophyll senescence shifts harmonic overtone balance from bright shimmer into warm low-pass decay.",
    },
    suggestedStyle: "ambient_earth",
    analysisData: {
      optical_features: {
        rgb_statistics: {
          r_mean: 92.4, g_mean: 148.2, b_mean: 74.0,
          r_std: 28.4, g_std: 42.1, b_std: 26.5,
          channel_correlation: { rg_corr: 0.58, rb_corr: 0.38, gb_corr: 0.74 }
        },
        brightness_metrics: {
          bt601_standard_luminance: 124.6,
          bt709_perceptual_luminance: 136.2,
          dynamic_range_db: 36.8,
        },
        dominant_colors: [
          { hex_code: "#65a30d", pixel_count: 52000, percentage: 52.0, color_name: "Spring Rapeseed & Wheat" },
          { hex_code: "#ca8a04", pixel_count: 31000, percentage: 31.0, color_name: "Maturing Cereal Golden" },
          { hex_code: "#15803d", pixel_count: 17000, percentage: 17.0, color_name: "Vineyard Canopy Dark" },
        ],
        color_distribution: {
          mean_hue: 88.0,
          mean_saturation: 62.0,
          warmth_index: 0.42,
          color_entropy: 0.54,
        },
        pixel_intensity: { median: 122, q1_25th: 84, q3_75th: 156, iqr: 72 },
        spatial_distribution: {
          centroid_x_norm: 0.505,
          centroid_y_norm: 0.495,
          quadrant_energy: { q1_nw: 0.25, q2_ne: 0.25, q3_sw: 0.25, q4_se: 0.25 },
          canny_edge_density_pct: 21.4,
          laplacian_texture_energy: 112.0,
        }
      },
      regional_statistics: [
        { zone_id: "Center", zone_name: "Equatorial", brightness: 48.0, contrast_rms: 46.2, edge_density_pct: 2.4, dominant_color_hex: "#65a30d" },
      ],
      normalized_features: {
        red_energy_norm: 0.294,
        green_energy_norm: 0.471,
        blue_energy_norm: 0.235,
        standard_luminance_norm: 0.489,
        perceptual_luminance_norm: 0.534,
        dynamic_range_norm: 0.708,
        rms_contrast_norm: 0.492,
        canny_edge_density_norm: 0.214,
        warmth_index: 0.42,
        color_entropy_norm: 0.54,
        centroid_shift_norm: 0.007,
      }
    }
  },

  // =========================================================================
  // 5. BigEarthNet (TU Berlin, 2019) — Large-Scale Sentinel-2 Benchmark
  // =========================================================================
  {
    id: "bench-bigearthnet",
    title: "BigEarthNet: Large-Scale Sentinel-2 Multi-Label Benchmark",
    subtitle: "590,326 Sentinel-2 L2A European Chips with CORINE Land Cover Ground Truth",
    organization: "Technical University of Berlin (TU Berlin)",
    year: 2019,
    task: "Scene Classification",
    modality: "Optical Multispectral",
    sensor: "Sentinel-2 (MSI)",
    spatialResolution: "10 m - 20 m Ground Sample Distance (GSD)",
    resolutionTier: "moderate",
    spectralBands: "12 Surface Reflectance Bands (Level-2A Bottom-of-Atmosphere)",
    revisitCadence: "5 Days",
    volume: "590,326 Image Patches (125 Sentinel-2 Tiles, 10 European Nations, 66 GB)",
    license: "Community Data License Agreement – Permissive (CDLA-Permissive-1.0)",
    paperUrl: "https://arxiv.org/abs/1902.06148",
    datasetUrl: "http://bigearth.net",
    description: "The gold-standard deep learning benchmark for multi-label remote sensing classification. Each Sentinel-2 L2A patch is paired with multi-label land cover annotations from the European CORINE Land Cover (CLC) inventory.",
    sonificationMapping: {
      multiLabelPolyphony: "Multiple simultaneous land cover classes generate layered polyphonic synthesizer tracks.",
      reflectanceToChroma: "Atmospherically corrected surface reflectance values map to warm analog-style subtractive synthesis.",
      spatialVariance: "Spatial entropy controls stereo pan dispersion across the binaural soundstage.",
    },
    suggestedStyle: "atmospheric",
    analysisData: {
      optical_features: {
        rgb_statistics: {
          r_mean: 78.5, g_mean: 114.2, b_mean: 92.1,
          r_std: 26.2, g_std: 34.0, b_std: 28.5,
          channel_correlation: { rg_corr: 0.62, rb_corr: 0.44, gb_corr: 0.72 }
        },
        brightness_metrics: {
          bt601_standard_luminance: 101.4,
          bt709_perceptual_luminance: 109.8,
          dynamic_range_db: 33.5,
        },
        dominant_colors: [
          { hex_code: "#2e7d32", pixel_count: 45000, percentage: 45.0, color_name: "Mixed Continental Forest" },
          { hex_code: "#81c784", pixel_count: 35000, percentage: 35.0, color_name: "Pastures and Greens" },
          { hex_code: "#546e7a", pixel_count: 20000, percentage: 20.0, color_name: "Inland Waters / Wetlands" },
        ],
        color_distribution: {
          mean_hue: 135.0,
          mean_saturation: 44.0,
          warmth_index: 0.22,
          color_entropy: 0.49,
        },
        pixel_intensity: { median: 98, q1_25th: 65, q3_75th: 126, iqr: 61 },
        spatial_distribution: {
          centroid_x_norm: 0.499,
          centroid_y_norm: 0.501,
          quadrant_energy: { q1_nw: 0.25, q2_ne: 0.25, q3_sw: 0.25, q4_se: 0.25 },
          canny_edge_density_pct: 15.2,
          laplacian_texture_energy: 82.5,
        }
      },
      regional_statistics: [
        { zone_id: "Center", zone_name: "Equatorial", brightness: 38.6, contrast_rms: 38.0, edge_density_pct: 1.6, dominant_color_hex: "#2e7d32" },
      ],
      normalized_features: {
        red_energy_norm: 0.276,
        green_energy_norm: 0.401,
        blue_energy_norm: 0.323,
        standard_luminance_norm: 0.398,
        perceptual_luminance_norm: 0.431,
        dynamic_range_norm: 0.644,
        rms_contrast_norm: 0.420,
        canny_edge_density_norm: 0.152,
        warmth_index: 0.22,
        color_entropy_norm: 0.49,
        centroid_shift_norm: 0.002,
      }
    }
  },

  // =========================================================================
  // 6. xView3 Dark Vessel Detection (xView, 2021) — Maritime SAR Radar
  // =========================================================================
  {
    id: "bench-xview3",
    title: "xView3: Maritime Dark Vessel Detection with Sentinel-1 SAR",
    subtitle: "Global Synthetic Aperture Radar (SAR) Maritime Vessel & Dark Fishing Detection",
    organization: "Defense Innovation Unit (DIU), Global Fishing Watch, NOAA",
    year: 2021,
    task: "Object Detection",
    modality: "Synthetic Aperture Radar (SAR)",
    sensor: "Sentinel-1 (C-SAR)",
    spatialResolution: "10 m Ground Sample Distance (GSD)",
    resolutionTier: "moderate",
    spectralBands: "Dual Polarization SAR (VH & VV Polarizations)",
    revisitCadence: "6-12 Days",
    volume: "1,000 Global Sentinel-1 Scenes + Bathymetry + Wind Speed / Direction Ancillary",
    license: "xView Challenge Open Data Agreement",
    paperUrl: "https://arxiv.org/abs/2208.11025",
    datasetUrl: "https://iuu.xview.us/",
    description: "Combines 1,000 all-weather Sentinel-1 radar scenes with bathymetry, ocean surface wind vectors, and AIS telemetry to detect illegal, unreported, and unregulated (IUU) dark fishing vessels across open ocean corridors.",
    sonificationMapping: {
      sarBackscatterToSonar: "High corner-reflector radar returns from metallic hulls produce clear high-frequency sonar pings (1.8 kHz).",
      oceanClutterToNoise: "Ocean sea state radar clutter synthesizes ambient pink-noise tidal swells.",
      windSpeedToModulation: "Ancillary wind speed data controls LFO chorus depth and stereo pan rate.",
    },
    suggestedStyle: "ocean_waves",
    analysisData: {
      optical_features: {
        rgb_statistics: {
          r_mean: 18.2, g_mean: 48.5, b_mean: 98.4,
          r_std: 14.5, g_std: 22.0, b_std: 38.6,
          channel_correlation: { rg_corr: 0.65, rb_corr: 0.72, gb_corr: 0.89 }
        },
        brightness_metrics: {
          bt601_standard_luminance: 46.2,
          bt709_perceptual_luminance: 52.8,
          dynamic_range_db: 46.0,
        },
        dominant_colors: [
          { hex_code: "#0f172a", pixel_count: 72000, percentage: 72.0, color_name: "Deep Ocean SAR Cavity" },
          { hex_code: "#1e3a8a", pixel_count: 22000, percentage: 22.0, color_name: "Rough Sea Surface Radar" },
          { hex_code: "#38bdf8", pixel_count: 6000, percentage: 6.0, color_name: "Vessel Metallic Corner Echo" },
        ],
        color_distribution: {
          mean_hue: 222.0,
          mean_saturation: 82.0,
          warmth_index: 0.0,
          color_entropy: 0.38,
        },
        pixel_intensity: { median: 38, q1_25th: 18, q3_75th: 68, iqr: 50 },
        spatial_distribution: {
          centroid_x_norm: 0.508,
          centroid_y_norm: 0.492,
          quadrant_energy: { q1_nw: 0.24, q2_ne: 0.26, q3_sw: 0.25, q4_se: 0.25 },
          canny_edge_density_pct: 8.4,
          laplacian_texture_energy: 64.0,
        }
      },
      regional_statistics: [
        { zone_id: "Center", zone_name: "Equatorial", brightness: 22.0, contrast_rms: 34.0, edge_density_pct: 1.0, dominant_color_hex: "#0f172a" },
      ],
      normalized_features: {
        red_energy_norm: 0.110,
        green_energy_norm: 0.294,
        blue_energy_norm: 0.596,
        standard_luminance_norm: 0.181,
        perceptual_luminance_norm: 0.207,
        dynamic_range_norm: 0.885,
        rms_contrast_norm: 0.360,
        canny_edge_density_norm: 0.084,
        warmth_index: 0.0,
        color_entropy_norm: 0.38,
        centroid_shift_norm: 0.011,
      }
    }
  },

  // =========================================================================
  // 7. LandCoverNet (Radiant Earth, 2020) — Global Land Cover Benchmark
  // =========================================================================
  {
    id: "bench-landcovernet",
    title: "LandCoverNet: Global Sentinel-2 Land Cover Classification",
    subtitle: "Curated Reference Training Dataset for Machine Learning on Sentinel-2",
    organization: "Radiant Earth Foundation & Schmidt Futures",
    year: 2020,
    task: "Semantic Segmentation",
    modality: "Optical Multispectral",
    sensor: "Sentinel-2 (MSI)",
    spatialResolution: "10 m Ground Sample Distance (GSD)",
    resolutionTier: "moderate",
    spectralBands: "13 Sentinel-2 Multispectral Surface Reflectance Bands",
    revisitCadence: "5 Days",
    volume: "1,980 Image Chips (256x256 px) spanning 66 Sentinel-2 Tiles across Africa",
    license: "Creative Commons Attribution 4.0 International (CC-BY 4.0)",
    paperUrl: "https://doi.org/10.34911/rdnt.d2ce8i",
    datasetUrl: "https://registry.mlhub.earth/10.34911/rdnt.d2ce8i/",
    description: "A meticulously validated training dataset designed to establish baseline global land cover classification models. Distinguishes 7 classes: Water, Natural Bare Ground, Artificial Bare Ground, Woody Vegetation, Cultivated Vegetation, Semi-Natural Vegetation, and Snow/Ice.",
    sonificationMapping: {
      landClassesToHarmonics: "Ratio of Woody to Cultivated Vegetation sets major vs minor scale third interval.",
      bareGroundToWhiteNoise: "High natural bare ground fractions inject subtle arid dust filter resonance into high frequencies.",
      waterBodyToDrone: "Water bodies stabilize a calm, resonant 110 Hz root drone.",
    },
    suggestedStyle: "ambient_earth",
    analysisData: {
      optical_features: {
        rgb_statistics: {
          r_mean: 112.4, g_mean: 104.2, b_mean: 78.5,
          r_std: 34.2, g_std: 28.6, b_std: 24.0,
          channel_correlation: { rg_corr: 0.72, rb_corr: 0.68, gb_corr: 0.78 }
        },
        brightness_metrics: {
          bt601_standard_luminance: 104.5,
          bt709_perceptual_luminance: 106.8,
          dynamic_range_db: 32.4,
        },
        dominant_colors: [
          { hex_code: "#a16207", pixel_count: 48000, percentage: 48.0, color_name: "Savanna Arid Earth" },
          { hex_code: "#4d7c0f", pixel_count: 32000, percentage: 32.0, color_name: "Woody Scrub Canopy" },
          { hex_code: "#d97706", pixel_count: 20000, percentage: 20.0, color_name: "Laterite Bare Ground" },
        ],
        color_distribution: {
          mean_hue: 42.0,
          mean_saturation: 52.0,
          warmth_index: 0.74,
          color_entropy: 0.51,
        },
        pixel_intensity: { median: 102, q1_25th: 72, q3_75th: 132, iqr: 60 },
        spatial_distribution: {
          centroid_x_norm: 0.501,
          centroid_y_norm: 0.502,
          quadrant_energy: { q1_nw: 0.25, q2_ne: 0.25, q3_sw: 0.25, q4_se: 0.25 },
          canny_edge_density_pct: 14.6,
          laplacian_texture_energy: 76.2,
        }
      },
      regional_statistics: [
        { zone_id: "Center", zone_name: "Equatorial", brightness: 42.0, contrast_rms: 38.4, edge_density_pct: 1.5, dominant_color_hex: "#a16207" },
      ],
      normalized_features: {
        red_energy_norm: 0.381,
        green_energy_norm: 0.353,
        blue_energy_norm: 0.266,
        standard_luminance_norm: 0.410,
        perceptual_luminance_norm: 0.419,
        dynamic_range_norm: 0.623,
        rms_contrast_norm: 0.395,
        canny_edge_density_norm: 0.146,
        warmth_index: 0.74,
        color_entropy_norm: 0.51,
        centroid_shift_norm: 0.003,
      }
    }
  },

  // =========================================================================
  // 8. xView 2 (DIU, 2019) — Post-Disaster Damage Assessment (VHR Optical)
  // =========================================================================
  {
    id: "bench-xview2",
    title: "xView 2: Satellite-Based Post-Disaster Damage Assessment",
    subtitle: "550,000 Building Footprints across 7 Disaster Types with WorldView-3 (0.3m)",
    organization: "Defense Innovation Unit (DIU) & Software Engineering Institute (CMU)",
    year: 2019,
    task: "Instance Segmentation",
    modality: "Very High Resolution (VHR)",
    sensor: "Maxar WorldView-3",
    spatialResolution: "0.3 m Very High Resolution (VHR)",
    resolutionTier: "vhr",
    spectralBands: "8-Band VNIR Multispectral + 0.3m Panchromatic",
    revisitCadence: "Rapid Revisit (<1 Day for Disaster Tasking)",
    volume: "550,000 Building Instances across 20 Global Locations (Wildfires, Tsunamis, Floods)",
    license: "Creative Commons Attribution-NonCommercial 4.0 (CC BY-NC 4.0)",
    paperUrl: "https://arxiv.org/abs/1911.09296",
    datasetUrl: "https://xview2.org",
    description: "Benchmark for building damage localization and 4-tier damage classification (no damage, minor damage, major damage, destroyed) following major earthquakes, hurricanes, floods, wildfires, and volcanic eruptions worldwide.",
    sonificationMapping: {
      damageGradientToDissonance: "Higher damage scale ratios introduce sharp microtonal dissonance and bitcrushed harmonics.",
      prePostDifference: "Temporal frame difference metric accelerates rhythmic pulsing, sonifying environmental impact shockwaves.",
      structuralCollapse: "Loss of high-frequency building edge density causes an acoustic filter low-pass drop.",
    },
    suggestedStyle: "experimental",
    analysisData: {
      optical_features: {
        rgb_statistics: {
          r_mean: 124.6, g_mean: 96.2, b_mean: 82.4,
          r_std: 44.5, g_std: 38.2, b_std: 32.1,
          channel_correlation: { rg_corr: 0.79, rb_corr: 0.74, gb_corr: 0.82 }
        },
        brightness_metrics: {
          bt601_standard_luminance: 104.8,
          bt709_perceptual_luminance: 102.5,
          dynamic_range_db: 44.0,
        },
        dominant_colors: [
          { hex_code: "#78350f", pixel_count: 42000, percentage: 42.0, color_name: "Charred Wildfire Debris" },
          { hex_code: "#9ca3af", pixel_count: 36000, percentage: 36.0, color_name: "Damaged Concrete Rubble" },
          { hex_code: "#ef4444", pixel_count: 22000, percentage: 22.0, color_name: "Thermal Hotspot Radiance" },
        ],
        color_distribution: {
          mean_hue: 24.0,
          mean_saturation: 58.0,
          warmth_index: 0.82,
          color_entropy: 0.65,
        },
        pixel_intensity: { median: 98, q1_25th: 58, q3_75th: 144, iqr: 86 },
        spatial_distribution: {
          centroid_x_norm: 0.518,
          centroid_y_norm: 0.482,
          quadrant_energy: { q1_nw: 0.30, q2_ne: 0.26, q3_sw: 0.22, q4_se: 0.22 },
          canny_edge_density_pct: 36.8,
          laplacian_texture_energy: 184.2,
        }
      },
      regional_statistics: [
        { zone_id: "Center", zone_name: "Equatorial", brightness: 46.2, contrast_rms: 62.0, edge_density_pct: 4.2, dominant_color_hex: "#78350f" },
      ],
      normalized_features: {
        red_energy_norm: 0.411,
        green_energy_norm: 0.317,
        blue_energy_norm: 0.272,
        standard_luminance_norm: 0.411,
        perceptual_luminance_norm: 0.402,
        dynamic_range_norm: 0.846,
        rms_contrast_norm: 0.680,
        canny_edge_density_norm: 0.368,
        warmth_index: 0.82,
        color_entropy_norm: 0.65,
        centroid_shift_norm: 0.025,
      }
    }
  },

  // =========================================================================
  // 9. SpaceNet 7: Multi-Temporal Urban Development (PlanetScope 4m)
  // =========================================================================
  {
    id: "bench-spacenet7",
    title: "SpaceNet 7: Multi-Temporal Urban Development Challenge",
    subtitle: "24-Month Monthly Time-Series over 100 Global Locations with PlanetScope (4m)",
    organization: "CosmiQ Works & Planet Labs",
    year: 2020,
    task: "Instance Segmentation",
    modality: "Optical Multispectral",
    sensor: "PlanetScope Constellation",
    spatialResolution: "4.0 m Ground Sample Distance (GSD)",
    resolutionTier: "high",
    spectralBands: "4-Band (RGB + Near-Infrared)",
    revisitCadence: "Monthly Composite Time-Series across 2 Full Years",
    volume: "100 Diverse Global Locations Tracking Building Footprint Evolution",
    license: "Creative Commons Attribution-ShareAlike 4.0 (CC BY-SA 4.0)",
    paperUrl: "https://arxiv.org/abs/2102.04414",
    datasetUrl: "https://spacenet.ai/sn7-challenge/",
    description: "Tracks rapid urbanization, informal settlement growth, and infrastructure development across 100 global metropolitan regions using 24 consecutive monthly PlanetScope mosaic snapshots.",
    sonificationMapping: {
      urbanGrowthToChords: "Gradual accumulation of building footprints introduces new harmonic overtones over time.",
      monthlyFrameDelta: "Temporal frame difference spikes trigger percussive snare-like impulses on newly paved surfaces.",
      spatialDensityToFilter: "Dense urban clusters raise the resonant low-pass filter cutoff from 450 Hz to 1.8 kHz.",
    },
    suggestedStyle: "electronic",
    analysisData: {
      optical_features: {
        rgb_statistics: {
          r_mean: 96.2, g_mean: 108.4, b_mean: 112.5,
          r_std: 32.1, g_std: 30.5, b_std: 34.2,
          channel_correlation: { rg_corr: 0.74, rb_corr: 0.78, gb_corr: 0.86 }
        },
        brightness_metrics: {
          bt601_standard_luminance: 104.6,
          bt709_perceptual_luminance: 107.4,
          dynamic_range_db: 35.0,
        },
        dominant_colors: [
          { hex_code: "#475569", pixel_count: 46000, percentage: 46.0, color_name: "Urban Asphalt & Concrete" },
          { hex_code: "#94a3b8", pixel_count: 34000, percentage: 34.0, color_name: "Reflective Building Roofs" },
          { hex_code: "#22c55e", pixel_count: 20000, percentage: 20.0, color_name: "Residual Urban Vegetation" },
        ],
        color_distribution: {
          mean_hue: 198.0,
          mean_saturation: 32.0,
          warmth_index: 0.15,
          color_entropy: 0.58,
        },
        pixel_intensity: { median: 104, q1_25th: 74, q3_75th: 136, iqr: 62 },
        spatial_distribution: {
          centroid_x_norm: 0.504,
          centroid_y_norm: 0.496,
          quadrant_energy: { q1_nw: 0.27, q2_ne: 0.25, q3_sw: 0.24, q4_se: 0.24 },
          canny_edge_density_pct: 26.5,
          laplacian_texture_energy: 138.0,
        }
      },
      regional_statistics: [
        { zone_id: "Center", zone_name: "Equatorial", brightness: 44.2, contrast_rms: 48.0, edge_density_pct: 2.8, dominant_color_hex: "#475569" },
      ],
      normalized_features: {
        red_energy_norm: 0.303,
        green_energy_norm: 0.342,
        blue_energy_norm: 0.355,
        standard_luminance_norm: 0.410,
        perceptual_luminance_norm: 0.421,
        dynamic_range_norm: 0.673,
        rms_contrast_norm: 0.510,
        canny_edge_density_norm: 0.265,
        warmth_index: 0.15,
        color_entropy_norm: 0.58,
        centroid_shift_norm: 0.006,
      }
    }
  },

  // =========================================================================
  // 10. So2Sat LCZ42 (TUM/DLR, 2018) — Local Climate Zones (SAR + Optical)
  // =========================================================================
  {
    id: "bench-so2sat",
    title: "So2Sat LCZ42: Global Local Climate Zone Classification",
    subtitle: "400,000 Fused Sentinel-1 SAR & Sentinel-2 Multispectral Chips Across 42 Global Megacities",
    organization: "Technical University of Munich (TUM) & German Aerospace Center (DLR)",
    year: 2018,
    task: "Scene Classification",
    modality: "Multi-Sensor Fusion",
    sensor: "Sentinel-1 (SAR) & Sentinel-2 (MSI)",
    spatialResolution: "10 m Ground Sample Distance (GSD)",
    resolutionTier: "moderate",
    spectralBands: "10 Sentinel-2 Optical Bands + 2 Sentinel-1 Dual-Pol SAR Bands",
    revisitCadence: "5-12 Days",
    volume: "400,000 Patches (32x32 px) Covering 42 Global Megacities (51 GB)",
    license: "Creative Commons Attribution 4.0 International (CC BY 4.0)",
    paperUrl: "https://arxiv.org/abs/1912.12171",
    datasetUrl: "https://mediatum.ub.tum.de/1454690",
    description: "Benchmark for classifying urban microclimates into 17 World Meteorological Organization Local Climate Zones (LCZs), distinguishing compact high-rises from open low-rises, paved districts, and natural rural land covers.",
    sonificationMapping: {
      lczUrbanHeatIslandToDrone: "High thermal mass and building density LCZs shift root pitch down to a heavy 55 Hz A1 drone.",
      openRuralToPentas: "Rural classes (LCZ A-G) dissolve into light, breathy woodwind-style synth timbres.",
      radarHeightProxy: "SAR structural building backscatter drives filter envelope attack time.",
    },
    suggestedStyle: "atmospheric",
    analysisData: {
      optical_features: {
        rgb_statistics: {
          r_mean: 104.2, g_mean: 112.5, b_mean: 96.4,
          r_std: 31.0, g_std: 28.4, b_std: 26.2,
          channel_correlation: { rg_corr: 0.71, rb_corr: 0.65, gb_corr: 0.81 }
        },
        brightness_metrics: {
          bt601_standard_luminance: 107.5,
          bt709_perceptual_luminance: 110.2,
          dynamic_range_db: 33.8,
        },
        dominant_colors: [
          { hex_code: "#475569", pixel_count: 44000, percentage: 44.0, color_name: "Urban Core LCZ 1" },
          { hex_code: "#65a30d", pixel_count: 36000, percentage: 36.0, color_name: "Urban Park Vegetated LCZ A" },
          { hex_code: "#d97706", pixel_count: 20000, percentage: 20.0, color_name: "Paved Industrial LCZ 8" },
        ],
        color_distribution: {
          mean_hue: 82.0,
          mean_saturation: 38.0,
          warmth_index: 0.35,
          color_entropy: 0.56,
        },
        pixel_intensity: { median: 106, q1_25th: 78, q3_75th: 134, iqr: 56 },
        spatial_distribution: {
          centroid_x_norm: 0.502,
          centroid_y_norm: 0.498,
          quadrant_energy: { q1_nw: 0.26, q2_ne: 0.25, q3_sw: 0.25, q4_se: 0.24 },
          canny_edge_density_pct: 22.8,
          laplacian_texture_energy: 122.4,
        }
      },
      regional_statistics: [
        { zone_id: "Center", zone_name: "Equatorial", brightness: 45.0, contrast_rms: 44.0, edge_density_pct: 2.2, dominant_color_hex: "#475569" },
      ],
      normalized_features: {
        red_energy_norm: 0.333,
        green_energy_norm: 0.359,
        blue_energy_norm: 0.308,
        standard_luminance_norm: 0.422,
        perceptual_luminance_norm: 0.432,
        dynamic_range_norm: 0.650,
        rms_contrast_norm: 0.460,
        canny_edge_density_norm: 0.228,
        warmth_index: 0.35,
        color_entropy_norm: 0.56,
        centroid_shift_norm: 0.003,
      }
    }
  },

  // =========================================================================
  // 11. NASA FIRMS (MODIS & VIIRS) — Fire Information for Resource Management
  // =========================================================================
  {
    id: "bench-nasa-firms",
    title: "NASA FIRMS: Thermal Radiative Power & Active Wildfire Detection",
    subtitle: "Global Daily Thermal Anomalies and Fire Radiative Power (MW) from VIIRS & MODIS",
    organization: "NASA Goddard Space Flight Center (GSFC) & EOSDIS",
    year: 2024,
    task: "Object Detection",
    modality: "Thermal & Nighttime Infrared",
    sensor: "VIIRS (Suomi-NPP / NOAA-20) & MODIS (Terra / Aqua)",
    spatialResolution: "375 m (VIIRS I-Band) - 1 km (MODIS)",
    resolutionTier: "planetary",
    spectralBands: "Middle-Infrared (3.9 μm) & Thermal Infrared (11.0 μm)",
    revisitCadence: "Sub-Daily Near Real-Time (3 Hours from Satellite Overpass)",
    volume: "Millions of Global Daily Fire Detection Points with Direct FRP Telemetry",
    license: "NASA Open Data Policy (Public Domain)",
    paperUrl: "https://doi.org/10.1016/j.rse.2014.01.011",
    datasetUrl: "https://firms.modaps.eosdis.nasa.gov/",
    description: "Operational NASA satellite service delivering active fire locations, brightness temperatures, and Fire Radiative Power (FRP) in megawatts worldwide within 3 hours of orbital acquisition.",
    sonificationMapping: {
      frpToHarmonicDistortion: "Fire Radiative Power (MW) drives analog tape saturation and warm tube overdrive distortion.",
      brightnessTemperatureToPitch: "Thermal radiance (Kelvin) modulates carrier pitch upwards (220 Hz to 880 Hz).",
      pulseCadence: "Active thermal clusters trigger rapid stochastic woodblock-like clicks representing combustion bursts.",
    },
    suggestedStyle: "experimental",
    analysisData: {
      optical_features: {
        rgb_statistics: {
          r_mean: 168.4, g_mean: 62.1, b_mean: 24.5,
          r_std: 52.0, g_std: 28.4, b_std: 18.2,
          channel_correlation: { rg_corr: 0.82, rb_corr: 0.76, gb_corr: 0.88 }
        },
        brightness_metrics: {
          bt601_standard_luminance: 92.4,
          bt709_perceptual_luminance: 84.1,
          dynamic_range_db: 48.2,
        },
        dominant_colors: [
          { hex_code: "#ef4444", pixel_count: 55000, percentage: 55.0, color_name: "Active Thermal Radiance" },
          { hex_code: "#f97316", pixel_count: 32000, percentage: 32.0, color_name: "Combustion Front Orange" },
          { hex_code: "#7f1d1d", pixel_count: 13000, percentage: 13.0, color_name: "Pyrogenic Char Deep" },
        ],
        color_distribution: {
          mean_hue: 14.0,
          mean_saturation: 85.0,
          warmth_index: 0.95,
          color_entropy: 0.48,
        },
        pixel_intensity: { median: 86, q1_25th: 42, q3_75th: 138, iqr: 96 },
        spatial_distribution: {
          centroid_x_norm: 0.524,
          centroid_y_norm: 0.478,
          quadrant_energy: { q1_nw: 0.32, q2_ne: 0.28, q3_sw: 0.20, q4_se: 0.20 },
          canny_edge_density_pct: 28.4,
          laplacian_texture_energy: 154.0,
        }
      },
      regional_statistics: [
        { zone_id: "Center", zone_name: "Equatorial", brightness: 52.0, contrast_rms: 68.0, edge_density_pct: 3.4, dominant_color_hex: "#ef4444" },
      ],
      normalized_features: {
        red_energy_norm: 0.660,
        green_energy_norm: 0.244,
        blue_energy_norm: 0.096,
        standard_luminance_norm: 0.362,
        perceptual_luminance_norm: 0.330,
        dynamic_range_norm: 0.927,
        rms_contrast_norm: 0.740,
        canny_edge_density_norm: 0.284,
        warmth_index: 0.95,
        color_entropy_norm: 0.48,
        centroid_shift_norm: 0.032,
      }
    }
  },

  // =========================================================================
  // 12. FloodNet (UMD, 2021) — High-Resolution UAV Post-Hurricane Flood Damage
  // =========================================================================
  {
    id: "bench-floodnet",
    title: "FloodNet: High-Resolution Aerial Flood Assessment Benchmark",
    subtitle: "2,343 UAV Image Chips Post-Hurricane Harvey with 10 Detailed Flood Classes",
    organization: "University of Maryland, Baltimore County (UMBC) & Microsoft",
    year: 2021,
    task: "Semantic Segmentation",
    modality: "Drone / UAV Aerial",
    sensor: "DJI Mavic Pro UAV High-Resolution RGB",
    spatialResolution: "0.015 m - 0.04 m Ultra-High Resolution Drone Imagery",
    resolutionTier: "vhr",
    spectralBands: "Calibrated RGB Optical",
    revisitCadence: "Post-Disaster Deployment (Hurricane Harvey)",
    volume: "2,343 Image Chips (4000x3000 px downsampled) with 10 Landcover Categories",
    license: "CC BY-NC-SA 4.0",
    paperUrl: "https://arxiv.org/abs/2012.02951",
    datasetUrl: "https://github.com/BinaLab/FloodNet-Supervised_v1.0",
    description: "Benchmark for flood extent mapping, identifying submerged vs non-submerged roadways, flooded structures, and debris fields following catastrophic storm surge events.",
    sonificationMapping: {
      submergedAreaToLowpass: "Water inundation percentage sweeps a resonant 24dB low-pass filter downwards, mimicking aquatic submersion.",
      debrisFieldToNoiseBurst: "High edge variance from structural debris triggers granular noise bursts.",
      roadPassability: "Intact roads sound clear open fourths; flooded passages shift into melancholic diminished intervals.",
    },
    suggestedStyle: "ocean_waves",
    analysisData: {
      optical_features: {
        rgb_statistics: {
          r_mean: 72.4, g_mean: 92.5, b_mean: 114.8,
          r_std: 32.4, g_std: 28.0, b_std: 34.6,
          channel_correlation: { rg_corr: 0.76, rb_corr: 0.68, gb_corr: 0.84 }
        },
        brightness_metrics: {
          bt601_standard_luminance: 89.2,
          bt709_perceptual_luminance: 94.6,
          dynamic_range_db: 38.4,
        },
        dominant_colors: [
          { hex_code: "#334155", pixel_count: 51000, percentage: 51.0, color_name: "Floodwater Inundation Slate" },
          { hex_code: "#64748b", pixel_count: 29000, percentage: 29.0, color_name: "Submerged Roadway Grey" },
          { hex_code: "#38bdf8", pixel_count: 20000, percentage: 20.0, color_name: "Clear Water Surface Sky" },
        ],
        color_distribution: {
          mean_hue: 208.0,
          mean_saturation: 38.0,
          warmth_index: 0.08,
          color_entropy: 0.52,
        },
        pixel_intensity: { median: 86, q1_25th: 54, q3_75th: 122, iqr: 68 },
        spatial_distribution: {
          centroid_x_norm: 0.506,
          centroid_y_norm: 0.494,
          quadrant_energy: { q1_nw: 0.27, q2_ne: 0.26, q3_sw: 0.24, q4_se: 0.23 },
          canny_edge_density_pct: 19.8,
          laplacian_texture_energy: 104.2,
        }
      },
      regional_statistics: [
        { zone_id: "Center", zone_name: "Equatorial", brightness: 38.0, contrast_rms: 42.0, edge_density_pct: 1.9, dominant_color_hex: "#334155" },
      ],
      normalized_features: {
        red_energy_norm: 0.259,
        green_energy_norm: 0.331,
        blue_energy_norm: 0.410,
        standard_luminance_norm: 0.350,
        perceptual_luminance_norm: 0.371,
        dynamic_range_norm: 0.738,
        rms_contrast_norm: 0.450,
        canny_edge_density_norm: 0.198,
        warmth_index: 0.08,
        color_entropy_norm: 0.52,
        centroid_shift_norm: 0.008,
      }
    }
  }
];
