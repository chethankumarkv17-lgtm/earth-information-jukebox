import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

import { 
  CloudRain, 
  Thermometer, 
  TrendingUp, 
  Compass, 
  MapPin, 
  Calendar, 
  Play, 
  Pause, 
  Download, 
  Activity, 
  ShieldCheck, 
  AlertCircle, 
  Sliders, 
  Volume2, 
  Waves, 
  Sparkles, 
  RotateCcw, 
  Info,
  Check,
  Split,
  Globe2
} from 'lucide-react'

import GlassPanel from '../common/GlassPanel'
import Button from '../common/Button'
import Badge from '../common/Badge'
import WaveformDisplay from '../common/WaveformDisplay'
import DualGlobeClimateView from '../earth/DualGlobeClimateView'
import globalSonificationEngine from '../../services/sonificationEngine'
import { useAccessibility } from '../../context/AccessibilityContext'

const CesiumGlobeViewer = React.lazy(() => import('../earth/CesiumGlobeViewer'))

// Curated reference locations for instant exploration
const CLIMATE_PRESETS = [
  { id: 'shivamogga', name: 'Shivamogga (India)', lat: 13.9299, lon: 75.5681, description: 'Western Ghats transition zone experiencing tropical monsoonal variance.' },
  { id: 'amazon', name: 'Amazon Basin (Brazil)', lat: -3.4653, lon: -62.2159, description: 'Equatorial rainforest basin vulnerable to extended drought and deforestation.' },
  { id: 'svalbard', name: 'Svalbard Arctic (Norway)', lat: 78.2232, lon: 15.6267, description: 'High-latitude polar archipelago warming 4x faster than the global average.' },
  { id: 'sahara', name: 'Sahara Erg (Algeria)', lat: 28.0339, lon: 1.6596, description: 'Hyper-arid desert plateau exhibiting extreme daytime surface heating.' },
  { id: 'greenland', name: 'Summit Camp (Greenland)', lat: 72.5796, lon: -38.4592, description: 'Interior glacial ice sheet experiencing summer melt acceleration.' },
  { id: 'pacific', name: 'Equatorial Pacific (Warm Pool)', lat: 0.0, lon: 160.0, description: 'El Niño-Southern Oscillation (ENSO) ocean-atmosphere convective core.' },
]

const START_YEAR = 1991
const END_YEAR = 2025

function mean(values) {
  if (!values.length) return 0
  return values.reduce((sum, v) => sum + v, 0) / values.length
}

function daysInYear(year) {
  return (Date.UTC(year + 1, 0, 1) - Date.UTC(year, 0, 1)) / 86400000
}

function signed(value, decimals = 2) {
  return (value >= 0 ? '+' : '') + value.toFixed(decimals)
}

function colourForDifference(value) {
  const fraction = Math.min(Math.abs(value) / 2.5, 1.0)
  const target = value < 0 ? [33, 102, 172] : [220, 38, 38] // Blue to Red
  const channels = target.map(channel => Math.round(240 + (channel - 240) * fraction))
  return `rgb(${channels.join(',')})`
}

/**
 * Climate Intelligence Workstation
 * Integrates Open-Meteo ERA5 1991–2025 Historical Reanalysis & Dual-Globe Climate Analysis
 */
export default function ClimateIntelligenceView({ onSelectTrack }) {
  const [activeSubMode, setActiveSubMode] = useState('reanalysis') // 'reanalysis' | 'dualglobe'
  
  // Map and Marker State
  const mapContainerRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markerRef = useRef(null)
  const chartCanvasRef = useRef(null)

  // Location and Data State
  const [selectedLocation, setSelectedLocation] = useState(CLIMATE_PRESETS[0])
  const [selectedYear, setSelectedYear] = useState(2024)
  const [annualData, setAnnualData] = useState({})
  const [baselineTemp, setBaselineTemp] = useState(null)
  const [baselinePrecip, setBaselinePrecip] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)
  const [isSonifyingTrajectory, setIsSonifyingTrajectory] = useState(false)
  const [isExportingCsv, setIsExportingCsv] = useState(false)

  const { playEarcon, announce } = useAccessibility()
  const cacheRef = useRef(new Map())
  const activeAbortRef = useRef(null)

  // ==========================================================================
  // 1. INITIALIZE LEAFLET MAP
  // ==========================================================================
  useEffect(() => {
    if (activeSubMode !== 'reanalysis' || !mapContainerRef.current || mapInstanceRef.current) return

    const map = L.map(mapContainerRef.current, {
      center: [selectedLocation.lat, selectedLocation.lon],
      zoom: 4,
      minZoom: 2,
      maxZoom: 12,
      zoomControl: true,
      worldCopyJump: true,
    })

    // High performance dark canvas basemap
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
      attribution: '&copy; Esri, Open-Meteo ERA5, NASA Earth Jukebox',
      maxZoom: 16,
    }).addTo(map)

    // Boundaries & Labels overlay
    L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Labels &copy; Esri',
      maxZoom: 16,
      opacity: 0.75,
    }).addTo(map)

    // Map Click Listener to load any point on Earth
    map.on('click', (e) => {
      const { lat, lng } = e.latlng
      const normLat = Math.round(lat * 1000) / 1000
      const normLng = Math.round(lng * 1000) / 1000
      const customLoc = {
        id: `custom-${normLat}-${normLng}`,
        name: `Coordinates (${normLat}°, ${normLng}°)`,
        lat: normLat,
        lon: normLng,
        description: 'User-selected coordinates for ERA5 1991–2025 climate reanalysis.',
      }
      setSelectedLocation(customLoc)
    })

    mapInstanceRef.current = map

    return () => {
      map.remove()
      mapInstanceRef.current = null
    }
  }, [activeSubMode])

  // ==========================================================================
  // 2. FETCH ERA5 HISTORICAL REANALYSIS DATA (1991–2025)
  // ==========================================================================
  const fetchClimateReanalysis = async (lat, lon, label) => {
    if (activeAbortRef.current) activeAbortRef.current.abort()
    const controller = new AbortController()
    activeAbortRef.current = controller

    setIsLoading(true)
    setErrorMessage(null)

    const cacheKey = `${lat.toFixed(3)},${lon.toFixed(3)}`
    if (cacheRef.current.has(cacheKey)) {
      const cached = cacheRef.current.get(cacheKey)
      setAnnualData(cached.annual)
      setBaselineTemp(cached.baselineTemperature)
      setBaselinePrecip(cached.baselinePrecipitation)
      setIsLoading(false)
      updateMarker(lat, lon, cached.annual[selectedYear], cached.baselineTemperature, label)
      return
    }

    try {
      const params = new URLSearchParams({
        latitude: lat.toString(),
        longitude: lon.toString(),
        start_date: `${START_YEAR}-01-01`,
        end_date: `${END_YEAR}-12-31`,
        daily: 'temperature_2m_mean,precipitation_sum',
        models: 'era5',
        timezone: 'auto',
      })

      const response = await fetch(`https://archive-api.open-meteo.com/v1/archive?${params.toString()}`, {
        signal: controller.signal,
      })

      if (!response.ok) {
        throw new Error(`Open-Meteo ERA5 API responded with status HTTP ${response.status}`)
      }

      const data = await response.json()
      if (data.error) {
        throw new Error(data.reason || 'Open-Meteo ERA5 API error')
      }

      // Process daily readings into annual means
      const daily = data.daily
      if (!daily || !daily.time || !daily.temperature_2m_mean || !daily.precipitation_sum) {
        throw new Error('Unexpected ERA5 payload format received.')
      }

      const grouped = {}
      daily.time.forEach((dateStr, idx) => {
        const yr = parseInt(dateStr.substring(0, 4))
        if (!grouped[yr]) {
          grouped[yr] = { temps: [], precips: [] }
        }
        const temp = daily.temperature_2m_mean[idx]
        const prec = daily.precipitation_sum[idx]
        if (Number.isFinite(temp)) grouped[yr].temps.push(temp)
        if (Number.isFinite(prec)) grouped[yr].precips.push(prec)
      })

      const annual = {}
      for (const [yrText, vals] of Object.entries(grouped)) {
        const yr = parseInt(yrText)
        const expectedDays = daysInYear(yr)
        if (vals.temps.length !== expectedDays || vals.precips.length !== expectedDays) {
          continue
        }
        annual[yr] = {
          temperature: mean(vals.temps),
          precipitation: vals.precips.reduce((sum, v) => sum + v, 0),
        }
      }

      // 30-Year Climatological Baseline (1991–2020)
      const baselineYears = Array.from({ length: 30 }, (_, i) => 1991 + i)
      const validBaseline = baselineYears.every(y => annual[y])
      if (!validBaseline) {
        throw new Error('Complete 1991–2020 baseline readings unavailable for this maritime/polar coordinate.')
      }

      const bTemp = mean(baselineYears.map(y => annual[y].temperature))
      const bPrecip = mean(baselineYears.map(y => annual[y].precipitation))

      const result = {
        annual,
        baselineTemperature: bTemp,
        baselinePrecipitation: bPrecip,
      }

      cacheRef.current.set(cacheKey, result)
      setAnnualData(annual)
      setBaselineTemp(bTemp)
      setBaselinePrecip(bPrecip)
      updateMarker(lat, lon, annual[selectedYear], bTemp, label)
      announce(`Loaded 35 years of ERA5 climate reanalysis for ${label}`)
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.warn('ERA5 Fetch Error:', err)
        setErrorMessage(err.message || 'Failed to downlink ERA5 reanalysis data.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Update map marker
  const updateMarker = (lat, lon, record, baseT, label) => {
    const map = mapInstanceRef.current
    if (!map) return

    if (markerRef.current) {
      map.removeLayer(markerRef.current)
      markerRef.current = null
    }

    const diff = record && baseT !== null ? record.temperature - baseT : 0
    const color = colourForDifference(diff)

    const marker = L.circleMarker([lat, lon], {
      radius: 14,
      color: '#38bdf8',
      fillColor: color,
      fillOpacity: 0.9,
      weight: 2,
    }).addTo(map)

    marker.bindPopup(`
      <div style="font-family: monospace; font-size: 11px; color: #020617;">
        <strong>${label} (${selectedYear})</strong><br/>
        Mean Temp: <b>${record ? record.temperature.toFixed(2) : '--'} °C</b><br/>
        Anomaly: <b style="color: ${diff >= 0 ? '#b91c1c' : '#0369a1'};">${signed(diff)} °C</b> vs 1991–2020<br/>
        Precipitation: <b>${record ? record.precipitation.toFixed(0) : '--'} mm</b>
      </div>
    `)

    markerRef.current = marker
  }

  // Handle location picking from Cesium 3D Globe
  const handleGlobeLocationSelect = (loc) => {
    if (!loc || typeof loc.lat !== 'number' || typeof loc.lon !== 'number') return
    const normLat = Math.round(loc.lat * 1000) / 1000
    const normLng = Math.round(loc.lon * 1000) / 1000
    setSelectedLocation(prev => {
      if (prev && Math.abs(prev.lat - normLat) < 0.001 && Math.abs(prev.lon - normLng) < 0.001) {
        return prev
      }
      return {
        id: loc.id || `custom-${normLat}-${normLng}`,
        name: loc.name || `Coordinates (${normLat}°, ${normLng}°)`,
        lat: normLat,
        lon: normLng,
        description: 'Picked from 3D Earth Globe for ERA5 1991–2025 climate reanalysis.',
      }
    })
  }

  // Memoized 3D globe camera target to prevent reference thrashing
  const globeTarget = React.useMemo(() => ({
    lat: selectedLocation.lat,
    lon: selectedLocation.lon,
    zoom: 4,
  }), [selectedLocation.lat, selectedLocation.lon])

  // Reload when location changes
  useEffect(() => {
    if (activeSubMode === 'reanalysis' || activeSubMode === 'globe3d') {
      fetchClimateReanalysis(selectedLocation.lat, selectedLocation.lon, selectedLocation.name)
      if (mapInstanceRef.current && activeSubMode === 'reanalysis') {
        mapInstanceRef.current.flyTo([selectedLocation.lat, selectedLocation.lon], 4, { duration: 1.2 })
      }
    }
  }, [selectedLocation, activeSubMode])

  // Update marker on year change
  useEffect(() => {
    if (annualData[selectedYear] && baselineTemp !== null) {
      updateMarker(selectedLocation.lat, selectedLocation.lon, annualData[selectedYear], baselineTemp, selectedLocation.name)
    }
  }, [selectedYear, annualData, baselineTemp])

  // ==========================================================================
  // 3. DRAW HTML5 CANVAS TREND CHART
  // ==========================================================================
  useEffect(() => {
    const canvas = chartCanvasRef.current
    if (!canvas || !annualData || Object.keys(annualData).length === 0) return

    const ctx = canvas.getContext('2d')
    const width = canvas.clientWidth
    const height = 180
    const scale = window.devicePixelRatio || 1

    canvas.width = Math.round(width * scale)
    canvas.height = Math.round(height * scale)
    ctx.setTransform(scale, 0, 0, scale, 0, 0)
    ctx.clearRect(0, 0, width, height)

    const records = Object.entries(annualData)
      .map(([yr, rec]) => ({ year: parseInt(yr), temp: rec.temperature }))
      .sort((a, b) => a.year - b.year)

    if (!records.length) return

    const padding = { left: 45, right: 15, top: 22, bottom: 28 }
    const minTemp = Math.min(...records.map(r => r.temp)) - 0.4
    const maxTemp = Math.max(...records.map(r => r.temp)) + 0.4

    const getX = (yr) => padding.left + ((yr - START_YEAR) / (END_YEAR - START_YEAR)) * (width - padding.left - padding.right)
    const getY = (t) => padding.top + ((maxTemp - t) / (maxTemp - minTemp)) * (height - padding.top - padding.bottom)

    // Horizontal reference grid lines
    ctx.font = '10px monospace'
    ctx.lineWidth = 1

    for (let i = 0; i <= 3; i++) {
      const val = minTemp + ((maxTemp - minTemp) * i) / 3
      const py = getY(val)

      ctx.strokeStyle = '#1e293b'
      ctx.beginPath()
      ctx.moveTo(padding.left, py)
      ctx.lineTo(width - padding.right, py)
      ctx.stroke()

      ctx.fillStyle = '#64748b'
      ctx.textAlign = 'right'
      ctx.fillText(`${val.toFixed(1)}°`, padding.left - 6, py + 3)
    }

    // 1991–2020 Baseline Reference Line
    if (baselineTemp !== null) {
      const bY = getY(baselineTemp)
      ctx.strokeStyle = '#06b6d4'
      ctx.setLineDash([4, 4])
      ctx.beginPath()
      ctx.moveTo(padding.left, bY)
      ctx.lineTo(width - padding.right, bY)
      ctx.stroke()
      ctx.setLineDash([])

      ctx.fillStyle = '#06b6d4'
      ctx.textAlign = 'right'
      ctx.fillText('Baseline (1991-2020)', width - padding.right, bY - 4)
    }

    // Year labels on X axis
    ctx.fillStyle = '#94a3b8'
    ctx.textAlign = 'center'
    ctx.fillText('1991', getX(1991), height - 8)
    ctx.fillText('2008', getX(2008), height - 8)
    ctx.fillText('2025', getX(2025), height - 8)

    // Annual Temperature Trajectory Path
    ctx.strokeStyle = '#38bdf8'
    ctx.lineWidth = 2.5
    ctx.beginPath()
    records.forEach((r, idx) => {
      const px = getX(r.year)
      const py = getY(r.temp)
      if (idx === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    })
    ctx.stroke()

    // Highlight Selected Year Point
    const activeRec = annualData[selectedYear]
    if (activeRec) {
      const hX = getX(selectedYear)
      const hY = getY(activeRec.temp)
      const diff = baselineTemp !== null ? activeRec.temp - baselineTemp : 0

      // Glowing halo
      ctx.fillStyle = diff >= 0 ? 'rgba(239, 68, 68, 0.35)' : 'rgba(56, 189, 248, 0.35)'
      ctx.beginPath()
      ctx.arc(hX, hY, 9, 0, Math.PI * 2)
      ctx.fill()

      // Core point
      ctx.fillStyle = diff >= 0 ? '#ef4444' : '#38bdf8'
      ctx.beginPath()
      ctx.arc(hX, hY, 4.5, 0, Math.PI * 2)
      ctx.fill()
    }
  }, [annualData, selectedYear, baselineTemp])

  // ==========================================================================
  // 4. ACOUSTIC SONIFICATION OF CLIMATE ANOMALY TRAJECTORY
  // ==========================================================================
  const handleSonifyTrajectory = async () => {
    if (isSonifyingTrajectory) {
      setIsSonifyingTrajectory(false)
      globalSonificationEngine.pause()
      return
    }

    const records = Object.entries(annualData)
      .map(([yr, rec]) => ({ year: parseInt(yr), temp: rec.temperature }))
      .sort((a, b) => a.year - b.year)

    if (!records.length || baselineTemp === null) return

    setIsSonifyingTrajectory(true)
    if (onSelectTrack) {
      onSelectTrack({
        id: `era5-${selectedLocation.id}`,
        title: `ERA5 Reanalysis: ${selectedLocation.name}`,
        region: selectedLocation.description,
        coordinates: `${Math.abs(selectedLocation.lat).toFixed(1)}°${selectedLocation.lat >= 0 ? 'N' : 'S'} ${Math.abs(selectedLocation.lon).toFixed(1)}°${selectedLocation.lon >= 0 ? 'E' : 'W'}`,
        satellite: "ECMWF / ERA5 Reanalysis",
        sensor: "Atmospheric & Surface Ensemble",
        category: "climate",
        frequencyRange: "100 Hz - 2.8 kHz",
        duration: "00:08",
        currentTime: "00:00",
      })
    }
    playEarcon('play')
    announce(`Sonifying 35-year climate trajectory for ${selectedLocation.name}`)

    const minDiff = -2.5
    const maxDiff = +3.0

    // Play consecutive years sequentially
    for (let i = 0; i < records.length; i++) {
      if (!isSonifyingTrajectory && i > 0 && !globalSonificationEngine.isPlaying) break

      const r = records[i]
      setSelectedYear(r.year)
      const diff = r.temp - baselineTemp
      const normDiff = Math.max(0.0, Math.min(1.0, (diff - minDiff) / (maxDiff - minDiff)))

      const telemetry = {
        normalized_brightness: normDiff,
        standard_luminance_bt601: normDiff * 255,
        hue_mean_deg: diff >= 0 ? 30 : 210, // Warm amber vs cold azure
        edge_density: 0.15 + normDiff * 0.35,
        centroid_x_norm: 0.5,
        contrast_rms: 0.6,
        warmth_index: normDiff,
        quadrants: { q1_nw: 0.25, q2_ne: 0.25, q3_sw: 0.25, q4_se: 0.25 },
        delta_from_previous: 0.05,
        dominant_colors: [
          { hex: diff >= 0 ? '#ef4444' : '#0284c7', percentage: 70, name: 'Thermal Anomaly' },
          { hex: '#1e293b', percentage: 30, name: 'Baseline Normal' },
        ],
      }

      globalSonificationEngine.updateSettings({
        style: diff >= 0 ? 'atmospheric' : 'ambient_earth',
        tempo: 96,
      })
      globalSonificationEngine.updateDynamicFrame(telemetry, 0.1)

      if (!globalSonificationEngine.isPlaying) {
        await globalSonificationEngine.play()
      }

      await new Promise(resolve => setTimeout(resolve, 220))
    }

    setIsSonifyingTrajectory(false)
  }

  // ==========================================================================
  // 5. EXPORT CLIMATE REANALYSIS CSV
  // ==========================================================================
  const handleExportCSV = () => {
    setIsExportingCsv(true)
    try {
      const records = Object.entries(annualData)
        .map(([yr, rec]) => ({
          year: parseInt(yr),
          temp: rec.temperature,
          precip: rec.precipitation,
        }))
        .sort((a, b) => a.year - b.year)

      if (!records.length) return

      let csv = 'timestamp,location_name,latitude,longitude,year,annual_mean_temp_c,temp_anomaly_vs_1991_2020_c,annual_precipitation_mm,baseline_temp_c,baseline_precip_mm\n'
      const now = new Date().toISOString()

      records.forEach(r => {
        const diff = baselineTemp !== null ? (r.temp - baselineTemp).toFixed(3) : '0'
        csv += `"${now}","${selectedLocation.name}",${selectedLocation.lat},${selectedLocation.lon},${r.year},${r.temp.toFixed(2)},${diff},${r.precip.toFixed(1)},${baselineTemp ? baselineTemp.toFixed(2) : ''},${baselinePrecip ? baselinePrecip.toFixed(1) : ''}\n`
      })

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ERA5_Climate_Trajectory_${selectedLocation.id}_1991_2025.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } finally {
      setTimeout(() => setIsExportingCsv(false), 800)
    }
  }

  const currentRecord = annualData[selectedYear]
  const currentDiff = currentRecord && baselineTemp !== null ? currentRecord.temperature - baselineTemp : null
  const currentPrecipDiff = currentRecord && baselinePrecip && baselinePrecip > 0
    ? ((currentRecord.precipitation - baselinePrecip) / baselinePrecip) * 100
    : null

  return (
    <div className="space-y-6">
      
      {/* Workspace Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-cyan-500/15">
        <div>
          <div className="flex items-center space-x-2 text-cyan-400 font-mono text-xs uppercase tracking-wider mb-1">
            <CloudRain className="w-4 h-4" />
            <span>CLIMATE REANALYSIS & PLANETARY THERMODYNAMICS</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2.5">
            Climate Intelligence Platform
            <Badge variant="cyan" size="sm">ERA5 1991–2025</Badge>
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            ECMWF / OPEN-METEO GLOBAL REANALYSIS & ESA COMPARATIVE DUAL GLOBES
          </p>
        </div>

        {/* Mode Toggle: ERA5 Reanalysis Map vs 3D Climate Globe vs Dual-Globe Climate View */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveSubMode('reanalysis')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
              activeSubMode === 'reanalysis'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Thermometer className="w-3.5 h-3.5" />
            <span>ERA5 REANALYSIS MAP</span>
          </button>

          <button
            onClick={() => setActiveSubMode('globe3d')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
              activeSubMode === 'globe3d'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Globe2 className="w-3.5 h-3.5" />
            <span>3D CLIMATE GLOBE</span>
          </button>

          <button
            onClick={() => setActiveSubMode('dualglobe')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
              activeSubMode === 'dualglobe'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Split className="w-3.5 h-3.5" />
            <span>COMPARATIVE DUAL GLOBE</span>
          </button>
        </div>
      </div>

      {/* Render Selected Climate Sub-Mode */}
      {activeSubMode === 'dualglobe' ? (
        <DualGlobeClimateView />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column (7 cols): Leaflet Interactive Climate Map / 3D Cesium Globe & Location Presets */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Viewport Card: 2D Leaflet Map or 3D Cesium Globe */}
            <div className="relative aspect-[16/11] min-h-[420px] bg-slate-950 rounded-2xl border border-cyan-500/30 overflow-hidden shadow-2xl">
              {activeSubMode === 'globe3d' ? (
                <React.Suspense
                  fallback={
                    <div className="flex flex-col items-center justify-center h-full min-h-[420px] space-y-3 font-mono text-cyan-400">
                      <Globe2 className="w-8 h-8 animate-spin" />
                      <span className="text-xs">INITIALIZING 3D CLIMATE GLOBE...</span>
                    </div>
                  }
                >
                  <CesiumGlobeViewer
                    mode="climate"
                    targetLocation={globeTarget}
                    selectedLayerId="temperature_anomaly"
                    onLocationSelect={handleGlobeLocationSelect}
                  />
                </React.Suspense>
              ) : (
                <>
                  <div ref={mapContainerRef} className="w-full h-full z-10" />

                  {/* Top-Left Location Indicator Overlay */}
                  <div className="absolute top-3 left-3 z-20 pointer-events-none font-mono">
                    <div className="bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-cyan-500/30 text-xs shadow-lg flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-cyan-300 font-bold uppercase truncate max-w-[200px]">
                        {selectedLocation.name}
                      </span>
                      <span className="text-slate-500">•</span>
                      <span className="text-slate-300 text-[11px]">
                        {selectedLocation.lat}°, {selectedLocation.lon}°
                      </span>
                    </div>
                  </div>

                  {/* Bottom-Left Divergent Temperature Scale Legend */}
                  <div className="absolute bottom-3 left-3 z-20 max-w-[260px] bg-slate-950/90 backdrop-blur-md p-2.5 rounded-xl border border-cyan-500/25 shadow-xl font-mono text-[10px] space-y-1">
                    <div className="flex justify-between text-slate-300 font-bold">
                      <span>TEMPERATURE ANOMALY</span>
                      <span className="text-cyan-400">vs 1991–2020</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-gradient-to-r from-blue-600 via-slate-100 to-red-600 border border-slate-700" />
                    <div className="flex justify-between text-slate-400 text-[9px]">
                      <span>−2.5 °C (Cooler)</span>
                      <span>0.0 °C</span>
                      <span>+2.5 °C (Warmer)</span>
                    </div>
                  </div>

                  {/* Loading Overlay */}
                  {isLoading && (
                    <div className="absolute inset-0 z-30 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center space-x-2.5 text-xs font-mono text-cyan-300">
                      <Activity className="w-5 h-5 animate-spin text-cyan-400" />
                      <span>DOWNLINKING 35 YEARS OF ERA5 HISTORICAL REANALYSIS...</span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Curated Global Climate Observatory Presets */}
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <span className="text-xs font-mono text-slate-400 flex items-center space-x-1.5">
                <Compass className="w-3.5 h-3.5 text-cyan-400" />
                <span>OBSERVATORY PRESETS (OR CLICK ANYWHERE ON MAP):</span>
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CLIMATE_PRESETS.map((p) => {
                  const isSelected = selectedLocation.id === p.id
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedLocation(p)}
                      className={`p-2 rounded-lg text-left transition-all border font-mono ${
                        isSelected
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50 shadow-sm ring-1 ring-cyan-400/30'
                          : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      <div className="text-[11px] font-bold truncate">{p.name.split(' ')[0]}</div>
                      <div className="text-[9px] text-slate-500 truncate">{p.lat}°, {p.lon}°</div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Year Scrubber & Temporal Playback Deck */}
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2.5 font-mono">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="text-cyan-400 font-bold flex items-center space-x-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>HISTORICAL CLIMATE REANALYSIS YEAR:</span>
                </span>
                <span className="text-cyan-300 font-extrabold text-sm">{selectedYear}</span>
              </div>

              <div className="flex items-center space-x-3">
                <span className="text-[10px] text-slate-500">{START_YEAR}</span>
                <input
                  type="range"
                  min={START_YEAR}
                  max={END_YEAR}
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="flex-1 accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
                <span className="text-[10px] text-slate-500">{END_YEAR}</span>
              </div>
            </div>

          </div>

          {/* Right Column (5 cols): Scientific Telemetry, Canvas Chart, Sonification Deck */}
          <div className="lg:col-span-5 space-y-4">
            
            <GlassPanel
              title={selectedLocation.name}
              subtitle="ERA5 CLIMATOLOGICAL REANALYSIS (1991–2025)"
              icon={TrendingUp}
            >
              <div className="space-y-4">
                
                {/* Description */}
                <p className="text-xs text-slate-300 leading-relaxed font-light">
                  {selectedLocation.description}
                </p>

                {/* Error Banner */}
                {errorMessage && (
                  <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 text-xs font-mono text-amber-300 flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Live Anomaly Metric Cards */}
                <div className="grid grid-cols-2 gap-2.5 font-mono">
                  
                  {/* Mean Temperature */}
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block uppercase">ANNUAL MEAN TEMP</span>
                    <div className="text-lg font-bold text-white mt-0.5">
                      {currentRecord ? `${currentRecord.temperature.toFixed(2)} °C` : '--'}
                    </div>
                    <div className={`text-[11px] font-bold mt-1 ${
                      currentDiff && currentDiff >= 0 ? 'text-red-400' : 'text-blue-400'
                    }`}>
                      {currentDiff !== null ? `${signed(currentDiff)} °C vs Baseline` : '--'}
                    </div>
                  </div>

                  {/* Annual Precipitation */}
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block uppercase">ANNUAL PRECIPITATION</span>
                    <div className="text-lg font-bold text-white mt-0.5">
                      {currentRecord ? `${currentRecord.precipitation.toFixed(0)} mm` : '--'}
                    </div>
                    <div className={`text-[11px] font-bold mt-1 ${
                      currentPrecipDiff && currentPrecipDiff >= 0 ? 'text-emerald-400' : 'text-amber-400'
                    }`}>
                      {currentPrecipDiff !== null ? `${signed(currentPrecipDiff, 1)}% vs Baseline` : '--'}
                    </div>
                  </div>

                </div>

                {/* 35-Year Canvas Trend Graph */}
                <div className="p-3 rounded-xl bg-slate-950/90 border border-cyan-500/25 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-cyan-300 font-bold flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                      <span>ANNUAL TEMPERATURE TREND (1991–2025)</span>
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Normal: {baselineTemp ? `${baselineTemp.toFixed(1)} °C` : '--'}
                    </span>
                  </div>

                  <canvas
                    ref={chartCanvasRef}
                    className="w-full h-[180px] block rounded-lg bg-slate-900/60"
                  />
                </div>

                {/* Sonification & CSV Actions Deck */}
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-cyan-950/40 to-slate-950 border border-cyan-500/30 flex items-center justify-between shadow-lg">
                  <div className="space-y-0.5 font-mono">
                    <span className="text-[10px] text-cyan-400 uppercase tracking-wider block font-bold">
                      CLIMATE SONIFICATION
                    </span>
                    <span className="text-xs font-bold text-slate-100 flex items-center gap-1">
                      <span>Root: {currentDiff && currentDiff >= 0 ? 'E4 (Warm)' : 'A3 (Cool)'}</span>
                      <span className="text-slate-500">•</span>
                      <span>35-Year Sweep</span>
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleExportCSV}
                      disabled={isExportingCsv || !annualData || Object.keys(annualData).length === 0}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-slate-900/80 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 hover:border-cyan-400 transition-colors shadow-sm disabled:opacity-50"
                      title="Download 35-year climate trajectory as CSV"
                    >
                      {isExportingCsv ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Download className="w-3.5 h-3.5 text-cyan-400" />}
                      <span>{isExportingCsv ? 'EXPORTED' : 'CSV'}</span>
                    </button>

                    <Button
                      variant={isSonifyingTrajectory ? 'secondary' : 'primary'}
                      size="sm"
                      icon={isSonifyingTrajectory ? Pause : Play}
                      onClick={handleSonifyTrajectory}
                      disabled={!annualData || Object.keys(annualData).length === 0}
                      className="px-4 font-bold"
                    >
                      {isSonifyingTrajectory ? 'Pause' : 'Sonify 1991–2025'}
                    </Button>
                  </div>
                </div>

                {/* Embedded Real-Time Oscilloscope */}
                <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950/80 p-2">
                  <WaveformDisplay
                    isLive={isSonifyingTrajectory}
                    audioNode={globalSonificationEngine.analyser}
                    height={40}
                    color="#06b6d4"
                    mode="oscilloscope"
                  />
                </div>

                {/* Climatological Methodology Disclaimer */}
                <div className="p-3 rounded-lg border border-cyan-500/20 bg-cyan-950/20 text-[10px] font-mono text-cyan-300/90 leading-relaxed flex items-start space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    Climate reanalysis values are sourced from the ECMWF ERA5 global gridded model. Anomaly calculations compare each annual mean directly against the World Meteorological Organization (WMO) 30-year baseline normal (1991–2020).
                  </span>
                </div>

              </div>
            </GlassPanel>

          </div>

        </div>
      )}

    </div>
  )
}
