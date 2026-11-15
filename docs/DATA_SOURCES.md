# Earth Science Data Sources & Provenance Documentation

The **Earth Information Jukebox** integrates authentic Earth observation datasets, numerical reanalysis products, and curated multi-decadal climate time series. This document records data provenance, physical units, sensor platforms, temporal ranges, resolutions, and known scientific limitations.

---

## 1. Real-Time Satellite Imagery (NASA GIBS)

**Provider**: NASA Global Imagery Browse Services (GIBS)  
**Standard**: OGC Web Map Tile Service (WMTS)  
**Projection**: EPSG:3857 (Web Mercator / Spherical Mercator)  
**Endpoint**: `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/{Layer}/default/{Time}/{TileMatrixSet}/{z}/{y}/{x}.{Format}`

| Layer Identifier | Mission / Sensor | Temporal Coverage | Native Resolution | Tile Format | Scientific Representation |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `MODIS_Terra_CorrectedReflectance_TrueColor` | Terra (EOS AM-1) / MODIS | 2000-02-24 to Present | 250 m | JPEG | Calibrated Red-Green-Blue (Bands 1, 4, 3) surface reflectance. |
| `VIIRS_SNPP_CorrectedReflectance_TrueColor` | Suomi NPP / VIIRS | 2012-05-08 to Present | 250 m | JPEG | High-resolution true-color imagery from the VIIRS radiometer. |
| `MODIS_Terra_NDVI_8Day` | Terra / MODIS | 2000-02-24 to Present | 250 m | PNG (indexed) | Normalized Difference Vegetation Index: $\text{NDVI} = \frac{\text{NIR} - \text{Red}}{\text{NIR} + \text{Red}}$. |
| `MODIS_Terra_SurfaceTemp_Daily_Day` | Terra / MODIS | 2000-02-24 to Present | 1 km | PNG (indexed) | Radiometric land surface skin temperature (Kelvin, converted to °C). |
| `VIIRS_SNPP_Thermal_Anomalies_375m_All` | Suomi NPP / VIIRS | 2012-01-20 to Present | 375 m | PNG (alpha) | Active fire and thermal radiation anomaly detection. |
| `AIRS_Precipitation_Day` | Aqua (EOS PM-1) / AIRS | 2002-08-30 to Present | 25 km | PNG (alpha) | Infrared & microwave atmospheric sounding precipitation rate. |
| `GHRSST_L4_MUR_Sea_Surface_Temperature` | Multi-Sensor Blend (MUR) | 2002-06-01 to Present | 1 km | PNG (indexed) | Ultra-high-resolution global foundation Sea Surface Temperature. |

---

## 2. In-Situ & Reanalysis Physical Data Services

### 2.1 NASA POWER Project
- **Full Name**: Prediction Of Worldwide Energy Resources
- **Managing Center**: NASA Langley Research Center (LaRC)
- **Model / Satellite Base**: MERRA-2 (Modern-Era Retrospective analysis for Research and Applications, Version 2) and GEOS-5 FP-IT.
- **Geographic Coverage**: Global ($90^\circ\text{S}$ to $90^\circ\text{N}$, $-180^\circ$ to $+180^\circ$).
- **Spatial Resolution**: $0.5^\circ \times 0.625^\circ$ grid.
- **Parameters Ingested**:
  - `T2M`: Temperature at 2 Meters above ground (°C).
  - `PRECTOTCORR`: Bias-corrected total precipitation (mm/day).
  - `WS2M`: Wind speed at 2 Meters above ground (m/s).
  - `ALLSKY_SFC_SW_DWN`: All-sky surface downward shortwave irradiance ($\text{kW/m}^2/\text{day}$).

### 2.2 Open-Meteo Historical Weather API & Copernicus ERA5
- **Underlying Source**: ECMWF ERA5 Global Reanalysis & ERA5-Land.
- **Managing Entity**: European Centre for Medium-Range Weather Forecasts (ECMWF) via Copernicus Climate Change Service (C3S).
- **Spatial Resolution**: $0.1^\circ \times 0.1^\circ$ ($\approx 11 \text{ km}$ at the equator).
- **Temporal Resolution**: Hourly reanalysis aggregated to daily climatological means.
- **Coverage**: 1940-01-01 to present (near real-time 5-day latency).
- **Parameters Ingested**:
  - Surface Temperature: Hourly and Daily 2m Air Temperature (°C).
  - Precipitation Sum: Daily liquid water equivalent (mm).
  - Wind Speed: Maximum daily 10m wind gust and mean speed (km/h and m/s).
  - Soil Moisture: Volumetric fraction ($0\text{--}7\text{ cm}$, $\text{m}^3/\text{m}^3$).

### 2.3 Copernicus Data Space Ecosystem (Sentinel-2 STAC)
- **Sensor**: MultiSpectral Instrument (MSI) on Sentinel-2A and Sentinel-2B.
- **Product**: Level-2A Bottom-Of-Atmosphere (BOA) surface reflectance.
- **API Standard**: SpatioTemporal Asset Catalog (STAC) v1.0.0.
- **Bands**: Band 4 (Red: 665 nm), Band 3 (Green: 560 nm), Band 2 (Blue: 490 nm), Band 8 (NIR: 842 nm).
- **Spatial Resolution**: 10 m native pixel size.

---

## 3. Multi-Decadal Historical Climate Baselines (Planetary Time Machine)

To ensure uncompromised scientific integrity, all historical trends utilized in the **Planetary Time Machine** are taken directly from peer-reviewed, calibrated international observational repositories. **No synthetic extrapolation or artificial smoothing is applied.**

### 3.1 Arctic Sea Ice Minimum Extent (1979–2024)
- **Source**: National Snow and Ice Data Center (NSIDC) / NASA Goddard Space Flight Center.
- **Sensors**: Nimbus-7 SMMR (Scanning Multichannel Microwave Radiometer), DMSP SSM/I and SSMIS.
- **Units**: Million Square Kilometers ($\text{Million km}^2$).
- **Metric**: Annual September minimum extent (ocean area with $\ge 15\%$ sea ice concentration).
- **Finding**: Declining trend from $7.05 \text{ Mkm}^2$ (1979) to $4.28 \text{ Mkm}^2$ (2024), with record minimum in 2012 ($3.41 \text{ Mkm}^2$).

### 3.2 Global Surface Temperature Anomaly (1880–2024)
- **Source**: NASA Goddard Institute for Space Studies (GISS) Surface Temperature Analysis (GISTEMP v4).
- **Reference Period**: 1951–1980 baseline.
- **Units**: Degrees Celsius Anomaly ($^\circ\text{C}$).
- **Coverage**: Global land and ocean surface temperature blend.
- **Finding**: Sustained warming departure exceeding $+1.17^\circ\text{C}$ in 2023–2024.

### 3.3 Atmospheric Carbon Dioxide ($\text{CO}_2$) Concentration (1958–2024)
- **Source**: NOAA Global Monitoring Laboratory (GML) & Scripps Institution of Oceanography.
- **Station**: Mauna Loa Observatory, Hawaii ($19.536^\circ\text{N, 155.576}^\circ\text{W}$, elevation 3,397 m).
- **Units**: Parts Per Million (ppm) dry air mole fraction.
- **Methodology**: In-situ non-dispersive infrared (NDIR) gas analysis.
- **Finding**: Steady accumulation from $315.2 \text{ ppm}$ (1958) to $>424.5 \text{ ppm}$ (2024).

### 3.4 Global Mean Sea Level Rise (1993–2024)
- **Source**: NASA GSFC Sea Level Change Team.
- **Satellite Radar Altimetry**: TOPEX/Poseidon, Jason-1, Jason-2 (OSTM), Jason-3, Sentinel-6 Michael Freilich.
- **Units**: Millimeters (mm) relative to 1993 baseline.
- **Finding**: Cumulative rise of $\approx 105 \text{ mm}$ over the 31-year satellite altimetry record, reflecting thermal expansion and land ice discharge.

---

## 4. Scientific Invariants & Data Handling Policies

1. **Strict Distinction Between Imagery and Physical Data**:
   Satellite true-color imagery (e.g. RGB reflectance) is never represented as numerical physical measurements. Computer vision features derived from optical pixels are explicitly labeled as **Derived Optical Telemetry** rather than in-situ sensor measurements.
2. **Missing Observation Policy**:
   Missing values (e.g., cloudy pixels, sensor outages, or polar night) are flagged with scientific `NaN` / `None` markers. The processing and audio engines **never silently replace missing values with zero**, as zero has distinct physical meaning (e.g., $0.0^\circ\text{C}$ or $0.0\text{ mm}$ rainfall).
3. **Physical Compatibility Enforcement**:
   Comparative subtraction ($\Delta = A - B$) is only permitted when physical dimensions and units are identical (e.g., °C vs °C). Comparisons across disparate domains (e.g., Temperature vs Precipitation) are explicitly marked as **Bivariate Correlation** with dual independent axes and scientific association disclaimers.
