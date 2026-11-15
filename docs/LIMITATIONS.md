# Earth Information Jukebox — Known Scientific & Technical Limitations

In accordance with NASA scientific integrity standards, this document explicitly details the observational, technical, and computational limitations of the platform, as well as the future development roadmap.

---

## 1. Observational & Remote Sensing Limitations

### 1.1 Temporal Resolution & Sensor Latency
- **Satellite Revisit Periods**: While geostationary satellites (GOES, Himawari) provide sub-hourly views, polar-orbiting scientific instruments operate on fixed repeat cycles:
  - **Terra & Aqua (MODIS)**: 1 to 2 days global revisit.
  - **Sentinel-2 (MSI)**: 5 days at the equator with twin satellites (2A/2B).
  - **Landsat 8/9 (OLI/TIRS)**: 8 to 16 days repeat cycle.
- **Processing Latency**: Level-2 and Level-3 NASA products typically require between 3 hours (Near Real-Time / NRT) and 3 to 5 days (Standard Science Quality) for ground calibration and ephemeris post-processing.
- **Platform Response**: The application transparently displays observation timestamps and data quality flags (`OPTIMAL`, `INTERPOLATED`, or `UNCALIBRATED`) rather than presenting historical snapshots as instantaneous live feeds.

### 1.2 Cloud Obscuration & Atmospheric Masking
- **Optical Limitations**: Multi-spectral optical and thermal instruments (Sentinel-2, Landsat, MODIS) cannot penetrate cloud cover. Over cloudy areas, true-color and NDVI reflectances represent cloud tops rather than ground vegetation.
- **Platform Response**: The data processing engine marks cloud-contaminated pixels as `NODATA` / `NaN` instead of computing misleading terrestrial indices, maintaining complete silence rather than generating false musical tones.

### 1.3 Spatial Resolution Tradeoffs
- Coarse planetary instruments (e.g., AIRS atmospheric sounders at $25\text{ km}$, MERRA-2 reanalysis at $\approx 50\text{ km}$) cannot capture hyper-local microclimates such as urban heat islands or mountain ravines.
- Conversely, ultra-high-resolution imagery ($10\text{ m}$ Sentinel-2) produces multi-gigabyte data volumes unsuitable for instant real-time global streaming without pyramid tiling.

### 1.4 Derived Indices vs. Physical Ground Truth
- **NDVI**: The Normalized Difference Vegetation Index is a radiometric ratio of near-infrared and red surface reflectance. While strongly correlated with green chlorophyll density, it is not a direct physical measurement of kilograms of biomass or timber volume.
- **Reanalysis Datasets (ERA5 & MERRA-2)**: Reanalysis combines physical numerical weather prediction models with billions of historical observations. While optimal for consistent global coverage, reanalysis values in observation-sparse regions (e.g. interior Antarctica or deep Southern Ocean) carry higher model uncertainty than calibrated airport weather stations.

---

## 2. Audio & Browser Technical Limitations

### 2.1 Browser Audio Autoplay Security Policy
- Modern web browsers (Chrome, Edge, Firefox, Safari) enforce strict autoplay policies that suspend `AudioContext` until the user interacts with the page (via click, touch, or keypress).
- **Platform Response**: The audio engine starts in a suspended state and smoothly awakens upon the user's first playback trigger (`Play`, `Space`, or preset selection), preventing browser console blocking warnings.

### 2.2 Mobile Web Audio & WebGL Memory Constraints
- On mobile devices with $<4\text{ GB}$ of RAM or integrated low-power GPUs, high WebGL tile caches in CesiumJS can lead to browser tab memory pressure.
- **Platform Response**: The Cesium viewer caps tile caching at `1000` tiles and provides automatic fallbacks to 2D Leaflet and Audio-First explorer modes.

### 2.3 Audio Export Rendering Limits
- Browser `OfflineAudioContext` WAV generation operates in system memory. Exporting multi-year, millisecond-resolution continuous audio could generate files exceeding browser memory bounds ($>500\text{ MB}$).
- **Platform Response**: The export engine partitions timeline exports into sampled observation frames with configurable step durations ($0.15\text{ s}$ per observation), producing compact, standard $\approx 2\text{--}10\text{ MB}$ uncompressed 16-bit WAV files.

---

## 3. Future Development Roadmap

1. **NASA SWOT Ka-Band Radar Hydrology**:
   Integrate high-resolution water surface elevation and river discharge data from the newly operational Surface Water and Ocean Topography (SWOT) satellite mission.
2. **WebXR / VR Immersive Sonification**:
   Extend the CesiumJS 3D viewport into WebXR headsets (Meta Quest, Apple Vision Pro) allowing researchers to physically walk across Earth's topographic elevation while surrounded by 3D spatialized binaural soundscapes.
3. **Tactile Haptic Feedback Integration**:
   Connect Web Haptics / Gamepad API vibration motors to allow low-vision and deaf-blind users to feel physical frequency vibrations corresponding to Earth data changes.
4. **Machine Learning Anomaly Detection**:
   Incorporate on-device WebAssembly autoencoders to automatically flag and acoustic-alert abrupt climate anomalies (e.g. sudden ocean heat waves or rapid ice-shelf calving events).
