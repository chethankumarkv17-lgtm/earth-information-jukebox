/**
 * API client configuration for Earth Jukebox
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export async function fetchBackendHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    return {
      status: 'offline',
      error: error.message,
    };
  }
}

/**
 * Upload and process satellite imagery using FastAPI, OpenCV and Pillow
 */
export async function uploadAndProcessImage(file) {
  const allowedExtensions = ['.png', '.jpg', '.jpeg'];
  const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
  
  if (!allowedExtensions.includes(ext)) {
    throw new Error(`Unsupported format '${ext}'. Please upload PNG, JPG, or JPEG imagery.`);
  }

  const maxSizeBytes = 15 * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
    throw new Error(`File size (${sizeMb} MB) exceeds maximum allowed limit of 15 MB.`);
  }

  if (file.size === 0) {
    throw new Error("File is empty (0 bytes).");
  }

  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch(`${API_BASE_URL}/image/upload`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || `Server responded with error status ${response.status}`);
    }
    return data;
  } catch (error) {
    throw new Error(error.message || "Failed to communicate with image processing backend.");
  }
}

/**
 * Advanced Computer Vision Analysis Engine (Phase 5)
 */
export async function analyzeEarthFrame(file, previousFile = null, calibration = {}) {
  const formData = new FormData();
  formData.append('file', file);

  if (previousFile) {
    formData.append('previous_frame', previousFile);
  }

  formData.append('calibration_scheme', calibration.scheme || 'None');
  if (calibration.customMin !== undefined && calibration.customMin !== null) {
    formData.append('custom_min', calibration.customMin);
  }
  if (calibration.customMax !== undefined && calibration.customMax !== null) {
    formData.append('custom_max', calibration.customMax);
  }
  if (calibration.customUnit) {
    formData.append('custom_unit', calibration.customUnit);
  }

  try {
    const response = await fetch(`${API_BASE_URL}/cv/analyze`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || `CV Engine error status ${response.status}`);
    }
    return data;
  } catch (error) {
    throw new Error(error.message || "Failed to execute computer vision analysis on backend.");
  }
}

/**
 * Fetch scientific calibration presets from backend
 */
export async function fetchCalibrationPresets() {
  try {
    const response = await fetch(`${API_BASE_URL}/cv/presets`);
    if (!response.ok) return null;
    return await response.json();
  } catch (e) {
    return null;
  }
}

/**
 * Remove an uploaded image from server storage
 */
export async function removeUploadedImage(imageId) {
  try {
    const response = await fetch(`${API_BASE_URL}/image/${imageId}`, {
      method: 'DELETE',
    });
    return await response.json();
  } catch (error) {
    console.error("Failed to delete image on server:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Fetch processor status and version specs (OpenCV, Pillow)
 */
export async function fetchProcessorStatus() {
  try {
    const response = await fetch(`${API_BASE_URL}/image/status`);
    if (!response.ok) throw new Error("Status unavailable");
    return await response.json();
  } catch (error) {
    return null;
  }
}

/**
 * Fetch list of curated authentic NASA Earth visualization sequence presets
 */
export async function fetchSequencePresets() {
  try {
    const response = await fetch(`${API_BASE_URL}/sequence/presets`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.warn("Failed to fetch sequence presets from backend:", error);
    return null;
  }
}

/**
 * Fetch a specific precomputed NASA sequence with full frame telemetry & thumbnails
 */
export async function fetchSequencePreset(presetId) {
  try {
    const response = await fetch(`${API_BASE_URL}/sequence/preset/${presetId}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.warn(`Failed to fetch preset sequence ${presetId}:`, error);
    return null;
  }
}

/**
 * Upload an animated GIF or image sequence for frame-by-frame analysis
 */
export async function analyzeSequenceFile(file, targetFps = 3.0, maxFrames = 36) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('target_fps', targetFps);
  formData.append('max_frames', maxFrames);

  try {
    const response = await fetch(`${API_BASE_URL}/sequence/analyze`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || `Server error ${response.status}`);
    }
    return data;
  } catch (error) {
    throw new Error(error.message || "Failed to analyze animated sequence.");
  }
}

// =============================================================================
// NASA Earth Information Jukebox - GIBS & Copernicus APIs
// =============================================================================

/**
 * Fetch verified NASA GIBS satellite observation layers
 */
export async function fetchEarthLayers() {
  try {
    const response = await fetch('/api/earth/layers');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.warn("Failed to fetch Earth layers:", error);
    return null;
  }
}

/**
 * Fetch satellite mission provenances & scientific citations
 */
export async function fetchEarthDatasets() {
  try {
    const response = await fetch('/api/earth/datasets');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.warn("Failed to fetch Earth datasets attribution:", error);
    return null;
  }
}

/**
 * Fetch chronological multi-year Earth observation time series
 */
export async function fetchEarthTimeline(phenomenon = 'arctic_sea_ice', startYear = 1979, endYear = 2024) {
  try {
    const response = await fetch(`/api/earth/timeline?phenomenon=${encodeURIComponent(phenomenon)}&start_year=${startYear}&end_year=${endYear}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (data && data.frames) {
      data.timeline = data.frames.map(f => ({
        year: f.year,
        value: f.metric_value !== undefined ? f.metric_value : f.value,
        metric_value: f.metric_value !== undefined ? f.metric_value : f.value,
        metric_unit: f.metric_unit,
        normalized_pitch: f.normalized_acoustic_pitch !== undefined ? f.normalized_acoustic_pitch : (f.normalized_pitch ?? 0.5),
        audio_event: f.audio_event,
        date: f.date
      }));
    }
    return data;
  } catch (error) {
    console.warn(`Failed to fetch timeline for ${phenomenon}:`, error);
    return null;
  }
}

/**
 * Fetch live NASA GIBS analysis for a geographic region
 */
export async function fetchEarthRegionAnalysis(regionName, options = {}) {
  try {
    const params = new URLSearchParams();
    if (regionName) params.append('region_name', regionName);
    if (options.zoom) params.append('zoom', options.zoom);
    if (options.layer) params.append('layer', options.layer);
    if (options.lat !== undefined) params.append('lat', options.lat);
    if (options.lon !== undefined) params.append('lon', options.lon);
    if (options.radiusKm !== undefined) params.append('radius_km', options.radiusKm);
    if (options.date) params.append('date', options.date);

    const response = await fetch(`/api/earth/region?${params.toString()}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.warn(`Failed to fetch region analysis for ${regionName}:`, error);
    return null;
  }
}

/**
 * Fetch NASA GIBS satellite raster metadata / base64 preview
 */
export async function fetchEarthImagery(options = {}) {
  try {
    const params = new URLSearchParams();
    if (options.layer) params.append('layer', options.layer);
    if (options.lat !== undefined) params.append('lat', options.lat);
    if (options.lon !== undefined) params.append('lon', options.lon);
    if (options.zoom) params.append('zoom', options.zoom);
    if (options.date) params.append('date', options.date);
    params.append('format', options.format || 'json');

    const response = await fetch(`/api/earth/imagery?${params.toString()}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.warn("Failed to fetch Earth imagery metadata:", error);
    return null;
  }
}

/**
 * Send satellite image or coordinates for multi-spectral numerical analysis & sonification
 */
export async function postEarthAnalyze(file = null, options = {}) {
  try {
    const formData = new FormData();
    if (file) formData.append('file', file);
    if (options.domain) formData.append('domain', options.domain);
    if (options.layer) formData.append('layer', options.layer);
    if (options.date) formData.append('date', options.date);
    if (options.minLat !== undefined) formData.append('min_lat', options.minLat);
    if (options.minLon !== undefined) formData.append('min_lon', options.minLon);
    if (options.maxLat !== undefined) formData.append('max_lat', options.maxLat);
    if (options.maxLon !== undefined) formData.append('max_lon', options.maxLon);

    const response = await fetch('/api/earth/analyze', {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.warn("Failed to analyze Earth data:", error);
    return null;
  }
}

/**
 * Search Sentinel-2 L2A granules via Copernicus STAC
 */
export async function fetchSentinelGranules(minLat, minLon, maxLat, maxLon, maxCloud = 30) {
  try {
    const params = new URLSearchParams({
      min_lat: minLat,
      min_lon: minLon,
      max_lat: maxLat,
      max_lon: maxLon,
      max_cloud_cover: maxCloud,
    });
    const response = await fetch(`/api/earth/sentinel?${params.toString()}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.warn("Failed to query Sentinel-2 STAC:", error);
    return null;
  }
}

/**
 * Fetch master Earth science dataset catalog preserving all 9 provenance metadata fields
 */
export async function fetchEarthCatalog(domain = null) {
  try {
    const url = domain ? `/api/earth/catalog?domain=${encodeURIComponent(domain)}` : '/api/earth/catalog';
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.warn("Failed to fetch Earth science catalog:", error);
    return null;
  }
}

/**
 * Fetch real numerical multi-source point telemetry (NASA POWER & Open-Meteo ERA5)
 */
export async function fetchEarthPointMetrics(lat, lon, date = null) {
  try {
    const params = new URLSearchParams({
      lat: Number(lat).toFixed(4),
      lon: Number(lon).toFixed(4),
    });
    if (date) params.append('date', date);
    const response = await fetch(`/api/earth/metrics/point?${params.toString()}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.warn(`Failed to fetch point metrics for (${lat}, ${lon}):`, error);
    return null;
  }
}

/**
 * Fetch Earth Data Processing Engine demonstration data across 5 scientific domains
 */
export async function fetchEarthDataProcessingDemo(domain = null) {
  try {
    const url = domain ? `/api/earth/process/demo?domain=${encodeURIComponent(domain)}` : '/api/earth/process/demo';
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.warn("Failed to fetch Earth data processing demo:", error);
    return null;
  }
}

/**
 * Send custom in-situ or satellite timeseries to the scientific processing engine
 */
export async function processEarthTimeseries(payload) {
  try {
    const response = await fetch('/api/earth/process/timeseries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Failed to process Earth timeseries:", error);
    return null;
  }
}

/**
 * Ingest and process a scientific file (GeoTIFF, NetCDF, CSV) through the processing engine
 */
export async function uploadAndProcessScientificFile(file, domain = 'vegetation') {
  try {
    const formData = new FormData();
    formData.append('file', file);
    if (domain) formData.append('domain', domain);

    const response = await fetch('/api/earth/process/upload', {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Failed to upload and process scientific file:", error);
    return null;
  }
}




