import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Database,
  Thermometer,
  CloudRain,
  Wind,
  Trees,
  Waves,
  Sun,
  Snowflake,
  Activity,
  Layers,
  MapPin,
  Calendar,
  Download,
  Play,
  Pause,
  Info,
  Check,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Radio
} from 'lucide-react'

import GlassPanel from '../common/GlassPanel'
import Button from '../common/Button'
import Badge from '../common/Badge'
import { fetchEarthCatalog, fetchEarthPointMetrics } from '../../services/api'
import globalSonificationEngine from '../../services/sonificationEngine'
import { useAccessibility } from '../../context/AccessibilityContext'
import EarthDataProcessingEngineViewer from './EarthDataProcessingEngineViewer'

// Curated reference observatory presets
const OBSERVATORY_PRESETS = [
  { id: 'shivamogga', name: 'Shivamogga (India)', lat: 13.9299, lon: 75.5681, description: 'Western Ghats transition zone with tropical monsoonal variance' },
  { id: 'amazon', name: 'Amazon Basin (Brazil)', lat: -3.4653, lon: -62.2159, description: 'Equatorial rainforest with high evapotranspiration' },
  { id: 'svalbard', name: 'Svalbard Arctic (Norway)', lat: 78.2232, lon: 15.6267, description: 'High-latitude polar archipelago experiencing rapid warming' },
  { id: 'sahara', name: 'Sahara Erg (Algeria)', lat: 28.0339, lon: 1.6596, description: 'Hyper-arid subtropical desert with extreme surface heating' },
  { id: 'greenland', name: 'Summit Camp (Greenland)', lat: 72.5796, lon: -38.4592, description: 'Interior glacial ice sheet experiencing summer surface melt' },
  { id: 'pacific', name: 'Equatorial Pacific (Warm Pool)', lat: 0.0, lon: 160.0, description: 'El Niño-Southern Oscillation (ENSO) ocean-atmosphere convective core' },
  { id: 'tokyo', name: 'Tokyo Metropolis (Japan)', lat: 35.6762, lon: 139.6503, description: 'Temperate coastal megacity urban heat island' },
  { id: 'himalayas', name: 'Mount Everest (Himalayas)', lat: 27.9881, lon: 86.9250, description: 'Third Pole alpine cryosphere with glacier retreat' }
]

const DOMAIN_FILTERS = [
  { id: 'all', label: 'All Domains', icon: Database },
  { id: 'temperature', label: 'Temperature', icon: Thermometer },
  { id: 'precipitation', label: 'Precipitation', icon: CloudRain },
  { id: 'wind_speed', label: 'Wind Speed', icon: Wind },
  { id: 'vegetation', label: 'Vegetation', icon: Trees },
  { id: 'ocean', label: 'Ocean', icon: Waves },
  { id: 'atmosphere', label: 'Atmosphere', icon: Sun },
  { id: 'snow_ice', label: 'Snow & Ice', icon: Snowflake }
]

export default function EarthDataExplorer() {
  const [selectedDomain, setSelectedDomain] = useState('all')
  const [catalog, setCatalog] = useState([])
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(true)

  // Point query state
  const [selectedLocation, setSelectedLocation] = useState(OBSERVATORY_PRESETS[0])
  const [inputLat, setInputLat] = useState(OBSERVATORY_PRESETS[0].lat.toString())
  const [inputLon, setInputLon] = useState(OBSERVATORY_PRESETS[0].lon.toString())
  const [selectedDate, setSelectedDate] = useState('2024-05-02')

  const [pointData, setPointData] = useState(null)
  const [isLoadingPoint, setIsLoadingPoint] = useState(false)
  const [pointError, setPointError] = useState(null)

  // Expanded dataset metadata drawer
  const [expandedDatasetId, setExpandedDatasetId] = useState(null)
  const [isSonifying, setIsSonifying] = useState(false)
  const [isExportingCsv, setIsExportingCsv] = useState(false)
  const [explorerMode, setExplorerMode] = useState('processing_engine') // 'processing_engine' | 'observatory'

  const { playEarcon, announce } = useAccessibility()

  // 1. Fetch Master Dataset Catalog
  useEffect(() => {
    async function loadCatalog() {
      setIsLoadingCatalog(true)
      try {
        const domainParam = selectedDomain === 'all' ? null : selectedDomain
        const res = await fetchEarthCatalog(domainParam)
        if (res && res.datasets) {
          setCatalog(res.datasets)
        }
      } catch (err) {
        console.warn('Failed to load catalog:', err)
      } finally {
        setIsLoadingCatalog(false)
      }
    }
    loadCatalog()
  }, [selectedDomain])

  // 2. Fetch Point Metrics
  const handleQueryPoint = async (lat, lon, date) => {
    setIsLoadingPoint(true)
    setPointError(null)
    try {
      announce(`Querying NASA POWER and Open-Meteo ERA5 for ${lat}, ${lon}`)
      const res = await fetchEarthPointMetrics(lat, lon, date)
      if (res && res.scientific_measurements) {
        setPointData(res)
        announce('Loaded calibrated multi-source scientific measurements')
      } else {
        setPointError('No measurements returned for this coordinate and date.')
      }
    } catch (err) {
      setPointError('Failed to downlink scientific data from NASA & Open-Meteo services.')
    } finally {
      setIsLoadingPoint(false)
    }
  }

  // Load initial location
  useEffect(() => {
    handleQueryPoint(selectedLocation.lat, selectedLocation.lon, selectedDate)
  }, [])

  const handleSelectPreset = (preset) => {
    setSelectedLocation(preset)
    setInputLat(preset.lat.toString())
    setInputLon(preset.lon.toString())
    handleQueryPoint(preset.lat, preset.lon, selectedDate)
  }

  const handleManualCoordinateSubmit = (e) => {
    e.preventDefault()
    const lat = parseFloat(inputLat)
    const lon = parseFloat(inputLon)
    if (!isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
      setSelectedLocation({
        id: 'custom',
        name: `Target (${lat.toFixed(2)}°, ${lon.toFixed(2)}°)`,
        lat,
        lon,
        description: 'User-selected geographic coordinate'
      })
      handleQueryPoint(lat, lon, selectedDate)
    } else {
      setPointError('Please enter valid coordinates: Latitude (-90 to +90), Longitude (-180 to +180).')
    }
  }

  // 3. Sonify Multi-Variable State
  const handleSonifyMetrics = async () => {
    if (isSonifying) {
      globalSonificationEngine.pause()
      setIsSonifying(false)
      return
    }

    if (!pointData?.scientific_measurements) return

    setIsSonifying(true)
    playEarcon('play')
    announce('Sonifying calibrated physical measurements')

    const meas = pointData.scientific_measurements
    const tempC = meas.temperature?.era5_temperature_mean?.value ?? meas.temperature?.nasa_power_t2m?.value ?? 20.0
    const precipMm = meas.precipitation?.era5_precipitation_sum?.value ?? meas.precipitation?.nasa_power_precipitation?.value ?? 0.0
    const windKmh = meas.wind_speed?.era5_wind_speed_max?.value ?? (meas.wind_speed?.nasa_power_wind_speed_10m?.value ? meas.wind_speed.nasa_power_wind_speed_10m.value * 3.6 : 10.0)

    // Normalize parameters for Web Audio
    const normTemp = Math.max(0.0, Math.min(1.0, (tempC + 20.0) / 60.0)) // -20°C to +40°C
    const normWind = Math.max(0.0, Math.min(1.0, windKmh / 80.0))

    const telemetry = {
      normalized_brightness: normTemp,
      standard_luminance_bt601: normTemp * 255,
      hue_mean_deg: tempC >= 25 ? 30 : tempC <= 5 ? 210 : 120,
      edge_density: 0.1 + normWind * 0.4,
      centroid_x_norm: 0.5,
      contrast_rms: 0.6,
      warmth_index: normTemp,
      quadrants: { q1_nw: 0.25, q2_ne: 0.25, q3_sw: 0.25, q4_se: 0.25 },
      delta_from_previous: 0.04,
      dominant_colors: [
        { hex: tempC >= 25 ? '#ef4444' : '#0284c7', percentage: 65, name: 'Thermal Vector' },
        { hex: precipMm > 1 ? '#06b6d4' : '#1e293b', percentage: 35, name: 'Precipitation Envelope' }
      ]
    }

    globalSonificationEngine.updateSettings({
      style: tempC >= 25 ? 'atmospheric' : 'ambient_earth',
      tempo: Math.round(70 + normWind * 50)
    })
    globalSonificationEngine.updateDynamicFrame(telemetry, 0.1)

    if (!globalSonificationEngine.isPlaying) {
      await globalSonificationEngine.play()
    }
  }

  // 4. Export Calibrated CSV
  const handleExportCSV = () => {
    setIsExportingCsv(true)
    try {
      if (!pointData?.scientific_measurements) return
      const timestamp = new Date().toISOString()
      const meas = pointData.scientific_measurements

      let csv = 'timestamp,location_name,latitude,longitude,elevation_m,observation_date,domain,variable,value,unit,source,description\n'
      const lat = pointData.coordinates.latitude
      const lon = pointData.coordinates.longitude
      const elev = pointData.coordinates.elevation_m || ''
      const obsDate = pointData.requested_date

      Object.entries(meas).forEach(([domainName, group]) => {
        Object.entries(group).forEach(([varKey, item]) => {
          csv += `"${timestamp}","${selectedLocation.name}",${lat},${lon},${elev},"${obsDate}","${domainName}","${varKey}",${item.value !== null ? item.value : '""'},"${item.unit}","${item.source}","${item.description}"\n`
        })
      })

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `NASA_EarthData_${selectedLocation.id}_${obsDate}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } finally {
      setTimeout(() => setIsExportingCsv(false), 800)
    }
  }

  return (
    <div className="space-y-6">
      
      {/* Primary Mode Switcher */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-950/80 border border-slate-800 font-mono">
        <button
          onClick={() => {
            setExplorerMode('processing_engine')
            playEarcon('tab')
          }}
          className={`flex-1 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${
            explorerMode === 'processing_engine'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400 shadow-lg shadow-emerald-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
          }`}
        >
          <Activity className="w-4 h-4 text-emerald-400" />
          <span>DATA PROCESSING & SONIFICATION ENGINE</span>
          <Badge variant="emerald" size="sm">PYTHON ENGINE</Badge>
        </button>

        <button
          onClick={() => {
            setExplorerMode('observatory')
            playEarcon('tab')
          }}
          className={`flex-1 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${
            explorerMode === 'observatory'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400 shadow-lg shadow-cyan-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
          }`}
        >
          <Database className="w-4 h-4 text-cyan-400" />
          <span>IN-SITU OBSERVATORY & MASTER CATALOG</span>
          <Badge variant="cyan" size="sm">10 DATASETS</Badge>
        </button>
      </div>

      {explorerMode === 'processing_engine' ? (
        <EarthDataProcessingEngineViewer />
      ) : (
        <>
          {/* Workspace Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/80 border border-cyan-500/20 backdrop-blur-md shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-md shadow-cyan-500/10">
            <Database className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-extrabold text-slate-100 tracking-tight">
                Earth Science Datasets & Multi-Source Telemetry
              </h2>
              <Badge variant="cyan" size="sm">NASA POWER</Badge>
              <Badge variant="emerald" size="sm">ECMWF ERA5</Badge>
              <Badge variant="blue" size="sm">COPERNICUS</Badge>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Calibrated numerical observations preserving official provenance, units, and quality flags.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={handleSonifyMetrics}
            disabled={!pointData || isLoadingPoint}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
              isSonifying
                ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-md shadow-cyan-500/20'
            }`}
            title="Sonify Physical Measurements"
          >
            {isSonifying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isSonifying ? 'PAUSE SONIFICATION' : 'SONIFY MEASUREMENTS'}</span>
          </button>

          <button
            onClick={handleExportCSV}
            disabled={!pointData || isExportingCsv}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold text-slate-300 hover:text-white bg-slate-800 border border-slate-700 hover:border-cyan-400/40 transition-all cursor-pointer"
            title="Export Calibrated CSV"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>{isExportingCsv ? 'EXPORTING...' : 'EXPORT CSV'}</span>
          </button>
        </div>
      </div>

      {/* Domain Filters Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none font-mono">
        {DOMAIN_FILTERS.map((df) => {
          const Icon = df.icon
          const isSelected = selectedDomain === df.id
          return (
            <button
              key={df.id}
              onClick={() => setSelectedDomain(df.id)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all border ${
                isSelected
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-md shadow-cyan-500/10'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{df.label}</span>
            </button>
          )
        })}
      </div>

      {/* Main Grid: Location Query (4 cols) + Multi-Source Measurements & Catalog (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* Left Column (4 cols): Location & Date Selection */}
        <div className="lg:col-span-4 space-y-4">
          
          <GlassPanel
            title="Geographic Location"
            subtitle="IN-SITU & REANALYSIS QUERY"
            icon={MapPin}
          >
            <div className="space-y-3 font-mono">
              
              {/* Presets Grid */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider">
                  Curated Observatories
                </label>
                <div className="grid grid-cols-1 gap-1.5 max-h-52 overflow-y-auto pr-1">
                  {OBSERVATORY_PRESETS.map((p) => {
                    const isSelected = selectedLocation.id === p.id
                    return (
                      <button
                        key={p.id}
                        onClick={() => handleSelectPreset(p)}
                        className={`w-full text-left p-2 rounded-lg text-xs transition-all border ${
                          isSelected
                            ? 'bg-cyan-500/20 border-cyan-400/60 text-cyan-300'
                            : 'bg-slate-950/60 hover:bg-slate-800/60 border-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="font-bold flex items-center justify-between">
                          <span>{p.name}</span>
                          <span className="text-[10px] text-slate-400">{p.lat.toFixed(1)}°, {p.lon.toFixed(1)}°</span>
                        </div>
                        <div className="text-[10px] text-slate-400 truncate mt-0.5">{p.description}</div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Manual Lat/Lon Coordinates Form */}
              <form onSubmit={handleManualCoordinateSubmit} className="space-y-2 pt-2 border-t border-slate-800">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider">
                  Custom Coordinate Selection
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-1">LATITUDE (°N)</span>
                    <input
                      type="number"
                      step="0.0001"
                      min="-90"
                      max="90"
                      value={inputLat}
                      onChange={(e) => setInputLat(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-1">LONGITUDE (°E)</span>
                    <input
                      type="number"
                      step="0.0001"
                      min="-180"
                      max="180"
                      value={inputLon}
                      onChange={(e) => setInputLon(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Date Picker */}
                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">OBSERVATION DATE</span>
                  <input
                    type="date"
                    value={selectedDate}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => {
                      setSelectedDate(e.target.value)
                      handleQueryPoint(parseFloat(inputLat), parseFloat(inputLon), e.target.value)
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  className="w-full mt-2"
                  disabled={isLoadingPoint}
                >
                  {isLoadingPoint ? 'DOWNLINKING DATA...' : 'QUERY POINT TELEMETRY'}
                </Button>
              </form>

              {pointError && (
                <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{pointError}</span>
                </div>
              )}

            </div>
          </GlassPanel>

          {/* Provenance & Citation Card */}
          <GlassPanel
            title="Scientific Integrity"
            subtitle="DATA SOURCE NOTICE"
            icon={ShieldCheck}
          >
            <div className="space-y-2 text-[11px] font-mono text-slate-400">
              <p>
                All measurements are downlinked directly from official NASA and ECMWF APIs.
                Numerical measurements are never interpolated or replaced with synthetic imagery.
              </p>
              <div className="pt-2 border-t border-slate-800/80 space-y-1">
                <div className="flex items-center justify-between text-slate-300">
                  <span>NASA POWER API:</span>
                  <span className="text-cyan-400">LaRC GEOS-5 / MERRA-2</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Open-Meteo ERA5:</span>
                  <span className="text-emerald-400">ECMWF IFS Cy41r2</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Copernicus STAC:</span>
                  <span className="text-blue-400">Sentinel-2 L2A BOA</span>
                </div>
              </div>
            </div>
          </GlassPanel>

        </div>

        {/* Right Column (8 cols): Calibrated Multi-Source Measurements & Complete Catalog */}
        <div className="lg:col-span-8 space-y-4">

          {/* Section 1: Live Multi-Source Comparison Deck */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-cyan-500/20 backdrop-blur-md space-y-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-2 font-mono">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <span>Calibrated In-Situ & Reanalysis Telemetry</span>
                </h3>
                <p className="text-[11px] text-slate-400 font-mono">
                  {selectedLocation.name} • {selectedDate} • ELEVATION: {pointData?.coordinates?.elevation_m ?? '--'} m
                </p>
              </div>

              {pointData?.data_quality && (
                <div className="flex items-center space-x-2 font-mono text-xs">
                  <Badge variant={pointData.data_quality.missing_measurements === 0 ? "emerald" : "amber"} size="sm">
                    {pointData.data_quality.quality_flag} ({pointData.data_quality.valid_percentage}% VALID)
                  </Badge>
                </div>
              )}
            </div>

            {isLoadingPoint ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-2 text-cyan-400 font-mono">
                <div className="w-8 h-8 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin" />
                <span className="text-xs">Querying NASA POWER and Open-Meteo ERA5 APIs...</span>
              </div>
            ) : pointData?.scientific_measurements ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono">
                
                {/* Temperature Comparison Card */}
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-300 font-bold">
                    <span className="flex items-center space-x-1.5 text-amber-400">
                      <Thermometer className="w-4 h-4" />
                      <span>TEMPERATURE (°C)</span>
                    </span>
                    <span className="text-[10px] text-slate-400">2-METER AIR & SURFACE</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="text-[10px] text-slate-400">NASA POWER (T2M)</div>
                      <div className="text-lg font-extrabold text-amber-300">
                        {pointData.scientific_measurements.temperature?.nasa_power_t2m?.value !== null
                          ? `${pointData.scientific_measurements.temperature.nasa_power_t2m.value.toFixed(1)} °C`
                          : '--'}
                      </div>
                      <div className="text-[9px] text-slate-400">MERRA-2 Assimilation</div>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="text-[10px] text-slate-400">ECMWF ERA5 (MEAN)</div>
                      <div className="text-lg font-extrabold text-amber-300">
                        {pointData.scientific_measurements.temperature?.era5_temperature_mean?.value !== null
                          ? `${pointData.scientific_measurements.temperature.era5_temperature_mean.value.toFixed(1)} °C`
                          : '--'}
                      </div>
                      <div className="text-[9px] text-slate-400">
                        MIN {pointData.scientific_measurements.temperature?.era5_temperature_min?.value?.toFixed(1) || '--'}° / 
                        MAX {pointData.scientific_measurements.temperature?.era5_temperature_max?.value?.toFixed(1) || '--'}°
                      </div>
                    </div>
                  </div>
                </div>

                {/* Precipitation Comparison Card */}
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-300 font-bold">
                    <span className="flex items-center space-x-1.5 text-cyan-400">
                      <CloudRain className="w-4 h-4" />
                      <span>PRECIPITATION (MM)</span>
                    </span>
                    <span className="text-[10px] text-slate-400">DAILY ACCUMULATION</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="text-[10px] text-slate-400">NASA POWER (CORR)</div>
                      <div className="text-lg font-extrabold text-cyan-300">
                        {pointData.scientific_measurements.precipitation?.nasa_power_precipitation?.value !== null
                          ? `${pointData.scientific_measurements.precipitation.nasa_power_precipitation.value.toFixed(2)} mm`
                          : '--'}
                      </div>
                      <div className="text-[9px] text-slate-400">GPCP Gauge Corrected</div>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="text-[10px] text-slate-400">ECMWF ERA5 (TOTAL)</div>
                      <div className="text-lg font-extrabold text-cyan-300">
                        {pointData.scientific_measurements.precipitation?.era5_precipitation_sum?.value !== null
                          ? `${pointData.scientific_measurements.precipitation.era5_precipitation_sum.value.toFixed(2)} mm`
                          : '--'}
                      </div>
                      <div className="text-[9px] text-slate-400">IFS Model Surface Flux</div>
                    </div>
                  </div>
                </div>

                {/* Wind Speed Comparison Card */}
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-300 font-bold">
                    <span className="flex items-center space-x-1.5 text-emerald-400">
                      <Wind className="w-4 h-4" />
                      <span>WIND SPEED (10M)</span>
                    </span>
                    <span className="text-[10px] text-slate-400">SURFACE LAYER</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="text-[10px] text-slate-400">NASA POWER</div>
                      <div className="text-lg font-extrabold text-emerald-300">
                        {pointData.scientific_measurements.wind_speed?.nasa_power_wind_speed_10m?.value !== null
                          ? `${pointData.scientific_measurements.wind_speed.nasa_power_wind_speed_10m.value.toFixed(2)} m/s`
                          : '--'}
                      </div>
                      <div className="text-[9px] text-slate-400">Neutral Stability (WS10M)</div>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="text-[10px] text-slate-400">ECMWF ERA5 (MAX)</div>
                      <div className="text-lg font-extrabold text-emerald-300">
                        {pointData.scientific_measurements.wind_speed?.era5_wind_speed_max?.value !== null
                          ? `${pointData.scientific_measurements.wind_speed.era5_wind_speed_max.value.toFixed(1)} km/h`
                          : '--'}
                      </div>
                      <div className="text-[9px] text-slate-400">
                        ~{pointData.scientific_measurements.wind_speed?.era5_wind_speed_max?.value ? (pointData.scientific_measurements.wind_speed.era5_wind_speed_max.value / 3.6).toFixed(1) : '--'} m/s
                      </div>
                    </div>
                  </div>
                </div>

                {/* Atmospheric & Solar Card */}
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-300 font-bold">
                    <span className="flex items-center space-x-1.5 text-sky-400">
                      <Sun className="w-4 h-4" />
                      <span>ATMOSPHERE & SOLAR</span>
                    </span>
                    <span className="text-[10px] text-slate-400">SURFACE FLUX</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="text-[10px] text-slate-400">RELATIVE HUMIDITY</div>
                      <div className="text-lg font-extrabold text-sky-300">
                        {pointData.scientific_measurements.atmospheric?.relative_humidity_era5?.value !== null
                          ? `${pointData.scientific_measurements.atmospheric.relative_humidity_era5.value.toFixed(1)} %`
                          : (pointData.scientific_measurements.atmospheric?.relative_humidity_power?.value?.toFixed(1) || '--')}
                      </div>
                      <div className="text-[9px] text-slate-400">RH at 2 Meters</div>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="text-[10px] text-slate-400">SOLAR IRRADIANCE</div>
                      <div className="text-lg font-extrabold text-sky-300">
                        {pointData.scientific_measurements.atmospheric?.solar_irradiance?.value !== null
                          ? `${pointData.scientific_measurements.atmospheric.solar_irradiance.value.toFixed(2)}`
                          : '--'}
                      </div>
                      <div className="text-[9px] text-slate-400">kW-hr/m²/day (All Sky)</div>
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400 font-mono">
                Select a coordinate or observatory preset to view calibrated measurements.
              </div>
            )}
          </div>

          {/* Section 2: Master Scientific Dataset Catalog with 9 Metadata Fields */}
          <div className="space-y-3 font-mono">
            <div className="flex items-center justify-between pt-2">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Database className="w-4 h-4 text-cyan-400" />
                <span>Verified Scientific Dataset Catalog ({catalog.length} Available)</span>
              </h3>
              <span className="text-[10px] text-slate-400">
                Preserving 9 Official Provenance Fields
              </span>
            </div>

            {isLoadingCatalog ? (
              <div className="py-8 text-center text-xs text-slate-400 font-mono">
                Loading scientific catalog...
              </div>
            ) : (
              <div className="space-y-2.5">
                {catalog.map((ds) => {
                  const isExpanded = expandedDatasetId === ds.id
                  return (
                    <div
                      key={ds.id}
                      className="rounded-xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/30 transition-all overflow-hidden"
                    >
                      {/* Dataset Header Bar */}
                      <button
                        onClick={() => setExpandedDatasetId(isExpanded ? null : ds.id)}
                        className="w-full text-left p-3.5 flex items-center justify-between cursor-pointer focus:outline-none"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-slate-100">{ds.dataset_name}</span>
                            <Badge variant="cyan" size="sm">{ds.domain.toUpperCase()}</Badge>
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {ds.source} • <span className="text-cyan-400 font-bold">{ds.units}</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 text-slate-400">
                          <span className="text-[10px] hidden sm:inline">{ds.resolution}</span>
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </button>

                      {/* Expanded 9-Field Provenance Panel */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="px-4 pb-4 pt-1 border-t border-slate-800 text-[11px] text-slate-300 space-y-2.5 bg-slate-950/60"
                          >
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                              <div>
                                <span className="text-[10px] text-slate-500 block">SOURCE / AGENCY</span>
                                <span className="text-slate-200 font-bold">{ds.source}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-500 block">MEASUREMENT UNITS</span>
                                <span className="text-cyan-300 font-bold">{ds.units}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-500 block">GEOGRAPHIC COVERAGE</span>
                                <span className="text-slate-300">{ds.geographic_coverage}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-500 block">TIME COVERAGE & FREQUENCY</span>
                                <span className="text-slate-300">{ds.time_coverage} • {ds.temporal_frequency}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-500 block">SPATIAL RESOLUTION</span>
                                <span className="text-slate-300">{ds.resolution}</span>
                              </div>
                            </div>

                            <div>
                              <span className="text-[10px] text-slate-500 block">PROCESSING & ASSIMILATION INFORMATION</span>
                              <p className="text-slate-300 mt-0.5 leading-relaxed bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                                {ds.processing_information}
                              </p>
                            </div>

                            <div>
                              <span className="text-[10px] text-amber-500/90 block">DATA LIMITATIONS & UNCERTAINTIES</span>
                              <p className="text-slate-400 mt-0.5 leading-relaxed bg-amber-500/5 p-2 rounded-lg border border-amber-500/20 text-[10px]">
                                {ds.data_limitations}
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                    </div>
                  )
                })}
              </div>
            )}

          </div>

        </div>

      </div>
    </>
  )}

    </div>
  )
}
