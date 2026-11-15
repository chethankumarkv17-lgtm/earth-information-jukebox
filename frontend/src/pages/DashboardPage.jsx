import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Globe2, 
  Activity, 
  Compass, 
  Layers, 
  Sliders, 
  Radio, 
  Sun, 
  Satellite, 
  Waves,
  Sparkles,
  Map,
  Split,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Search,
  MapPin,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Clock,
  Eye,
  EyeOff,
  Headphones,
  Info,
  Maximize2,
  Minimize2,
  ShieldCheck,
  CheckCircle2,
  Thermometer,
  CloudRain,
  Wind,
  Trees,
  Snowflake,
  ExternalLink,
  Cpu,
  Database,
  BarChart2,
  Zap
} from 'lucide-react'

// Layout & Dashboard Components
import Sidebar from '../components/layout/Sidebar'
import EarthViewport from '../components/dashboard/EarthViewport'
import InfoPanel from '../components/dashboard/InfoPanel'
import VisualizationSelector from '../components/dashboard/VisualizationSelector'
import WaveformDisplay from '../components/common/WaveformDisplay'
import AudioMeter from '../components/common/AudioMeter'
import TelemetryCard from '../components/cards/TelemetryCard'
import Badge from '../components/common/Badge'
import GlassPanel from '../components/common/GlassPanel'
import Button from '../components/common/Button'
import InteractiveMapExplorer from '../components/earth/InteractiveMapExplorer'
import SynchronizedEarthExplorer from '../components/earth/SynchronizedEarthExplorer'
import AudioFirstDataExplorer from '../components/accessibility/AudioFirstDataExplorer'
import { useAccessibility } from '../context/AccessibilityContext'
import { earthDatasets } from '../data/earthDatasets'
import { 
  earthSonificationEngine, 
  MAPPING_SPECIFICATIONS, 
  SOUND_INSTRUMENTS,
  mapTemperatureToPitch,
  mapPrecipitationToAcousticRhythm,
  mapWindSpeedToModulation,
  mapVegetationToTimbre,
  mapOceanToFoundationDrone
} from '../services/earthDataSonificationEngine'
import { fetchEarthDataProcessingDemo } from '../services/api'

// Lazy-loaded 3D Cesium globe
const CesiumGlobeViewer = React.lazy(() => import('../components/earth/CesiumGlobeViewer'))

// Curated Flagship Locations (7 Presets as specified)
const FLAGSHIP_LOCATIONS = [
  {
    id: 'amazon',
    name: 'Amazon Basin Rainforest',
    country: 'Brazil',
    lat: -3.4653,
    lon: -62.2159,
    biome: 'Tropical Rainforest',
    defaultDataset: 'temperature',
    description: 'Vital planetary carbon sink driving continental evapotranspiration.',
    sampleVal: '28.4 °C',
    climateClass: 'Köppen Af • Tropical Wet'
  },
  {
    id: 'sahara',
    name: 'Sahara Transition Zone',
    country: 'Algeria / Niger',
    lat: 23.4162,
    lon: 12.6075,
    biome: 'Hyper-Arid Subtropical Desert',
    defaultDataset: 'precipitation',
    description: 'Extreme diurnal thermal fluctuations and convective monsoonal deluges.',
    sampleVal: '0.0 mm (Dry)',
    climateClass: 'Köppen BWh • Hot Desert'
  },
  {
    id: 'svalbard',
    name: 'Svalbard Arctic Outpost',
    country: 'Norway',
    lat: 78.2232,
    lon: 15.6267,
    biome: 'Polar Tundra & Cryosphere',
    defaultDataset: 'wind_speed',
    description: 'Polar archipelago under Arctic amplification with maritime storm tracks.',
    sampleVal: '14.2 m/s',
    climateClass: 'Köppen ET • Polar Tundra'
  },
  {
    id: 'pacific',
    name: 'Equatorial Pacific Warm Pool',
    country: 'International Waters',
    lat: 0.5000,
    lon: -150.0000,
    biome: 'Oceanic Pelagic Marine',
    defaultDataset: 'ocean_sst',
    description: 'Epicenter of El Niño-Southern Oscillation ocean-atmosphere dynamics.',
    sampleVal: '29.1 °C',
    climateClass: 'Marine Pelagic • ITCZ'
  },
  {
    id: 'western_ghats',
    name: 'Western Ghats (Shivamogga)',
    country: 'India',
    lat: 13.9299,
    lon: 75.5681,
    biome: 'Tropical Montane Rainforest',
    defaultDataset: 'precipitation',
    description: 'UNESCO biodiversity hotspot with intense orographic monsoonal precipitation.',
    sampleVal: '42.8 mm',
    climateClass: 'Köppen Am • Tropical Monsoon'
  },
  {
    id: 'tokyo',
    name: 'Tokyo Megacity Basin',
    country: 'Japan',
    lat: 35.6762,
    lon: 139.6503,
    biome: 'Urban Heat Island / Coastal',
    defaultDataset: 'temperature',
    description: 'Densely built urban thermal footprint and Pacific maritime climate.',
    sampleVal: '22.6 °C',
    climateClass: 'Köppen Cfa • Humid Subtropical'
  },
  {
    id: 'great_barrier_reef',
    name: 'Great Barrier Reef',
    country: 'Australia',
    lat: -18.2871,
    lon: 147.6992,
    biome: 'Marine Coral Ecosystem',
    defaultDataset: 'ocean_sst',
    description: 'World heritage coral reef system monitored for marine heatwave stress.',
    sampleVal: '27.8 °C',
    climateClass: 'Marine Coral Reef • Tropical'
  }
]

// 5 Core Datasets
const FLAGSHIP_DATASETS = [
  {
    id: 'temperature',
    name: 'Surface Temperature',
    sensor: 'MODIS / AIRS & MERRA-2',
    unit: '°C',
    range: [-30, 50],
    icon: Thermometer,
    color: 'amber',
    glowColor: 'rgba(245, 158, 11, 0.12)',
    accentHex: '#f59e0b',
    acousticParameter: 'Acoustic Pitch: 65.4 Hz to 1046.5 Hz (MIDI 36–84)',
    sensorDetails: 'NASA Terra/Aqua MODIS Thermal IR band 31/32 combined with AIRS sounder sounding profiles.'
  },
  {
    id: 'precipitation',
    name: 'Precipitation',
    sensor: 'GPM & GPCP Rain Gauge',
    unit: 'mm',
    range: [0, 100],
    icon: CloudRain,
    color: 'cyan',
    glowColor: 'rgba(6, 182, 212, 0.12)',
    accentHex: '#06b6d4',
    acousticParameter: 'Droplet Rhythm: Silence on 0.0mm dry days',
    sensorDetails: 'Dual-frequency Precipitation Radar (DPR) and GPM Microwave Imager (GMI) constellation.'
  },
  {
    id: 'wind_speed',
    name: 'Wind Speed',
    sensor: 'NASA MERRA-2 Reanalysis',
    unit: 'm/s',
    range: [0, 40],
    icon: Wind,
    color: 'teal',
    glowColor: 'rgba(20, 184, 166, 0.12)',
    accentHex: '#14b8a6',
    acousticParameter: 'LFO Tremolo & Sweep: 0.2 Hz to 8.5 Hz',
    sensorDetails: 'Goddard Earth Observing System (GEOS-5) atmospheric model assimilating satellite scatterometer winds.'
  },
  {
    id: 'vegetation',
    name: 'Vegetation Canopy (NDVI)',
    sensor: 'Landsat 9 & MODIS Terra',
    unit: 'NDVI',
    range: [-0.2, 1.0],
    icon: Trees,
    color: 'emerald',
    glowColor: 'rgba(16, 185, 129, 0.12)',
    accentHex: '#10b981',
    acousticParameter: 'Harmonic Richness: Sine to Multi-Overtone',
    sensorDetails: 'Normalized Difference Vegetation Index from Red (0.64 µm) and Near-Infrared (0.86 µm) reflectance.'
  },
  {
    id: 'ocean_sst',
    name: 'Ocean SST',
    sensor: 'MUR SST & JPL Altimetry',
    unit: '°C',
    range: [0, 35],
    icon: Waves,
    color: 'blue',
    glowColor: 'rgba(59, 130, 246, 0.12)',
    accentHex: '#3b82f6',
    acousticParameter: 'Sub-Bass Drone: 43.6 Hz to 130.8 Hz Swell',
    sensorDetails: 'Multi-scale Ultra-high Resolution (MUR) Sea Surface Temperature from blended microwave and infrared radiometers.'
  }
]

// Satellite Layer Toggles
const SATELLITE_LAYERS = [
  { id: 'sentinel2', name: 'Sentinel-2 (10m Optical)', mission: 'ESA Copernicus', badge: 'OPTICAL', resolution: '10m Multi-spectral', revisit: '5-Day Global' },
  { id: 'modis', name: 'MODIS Terra (True Color)', mission: 'NASA EOSDIS', badge: 'DAILY', resolution: '250m Daily Swath', revisit: '1-2 Days Global' },
  { id: 'landsat', name: 'Landsat 9 (OLI-2 / TIRS)', mission: 'USGS / NASA', badge: '30M', resolution: '30m Multi-spectral / 100m Thermal', revisit: '16-Day Orbit' },
  { id: 'era5', name: 'ECMWF ERA5 (Atmosphere)', mission: 'Copernicus Climate', badge: 'REANALYSIS', resolution: '31km Global Grid', revisit: 'Hourly Global' }
]

const SPEED_PRESETS = [
  { label: '0.25x', ms: 1200 },
  { label: '0.5x', ms: 800 },
  { label: '1.0x', ms: 450 },
  { label: '1.5x', ms: 300 },
  { label: '2.0x', ms: 180 }
]

export default function DashboardPage({
  currentTrack,
  setCurrentTrack,
  isPlaying,
  setIsPlaying,
}) {
  const { accessibilityMode, playEarcon, announce, speak, isSpeaking, stopSpeaking, reducedMotion } = useAccessibility()
  
  // High-level workspace view mode: 'explorer3p' | 'globe3d' | 'sync' | 'audio'
  const [explorerMode, setExplorerMode] = useState(() => accessibilityMode ? 'audio' : 'explorer3p')
  
  // Center View Toggle: '3d_cesium' | '2d_vector'
  const [centerDisplayMode, setCenterDisplayMode] = useState('3d_cesium')

  // 3-Panel Collapsible States
  const [isLeftOpen, setIsLeftOpen] = useState(true)
  const [isRightOpen, setIsRightOpen] = useState(true)
  const [isBottomOpen, setIsBottomOpen] = useState(true)

  // Selections
  const [activeLocation, setActiveLocation] = useState(FLAGSHIP_LOCATIONS[0])
  const [activeDatasetId, setActiveDatasetId] = useState('temperature')
  const [activeLayerId, setActiveLayerId] = useState('sentinel2')
  const [searchFilter, setSearchFilter] = useState('')

  // Cinematic Interaction States
  const [isCameraFlying, setIsCameraFlying] = useState(false)
  const [isLayerBlending, setIsLayerBlending] = useState(false)
  const [hoveredPreset, setHoveredPreset] = useState(null)
  const [hoveredDataset, setHoveredDataset] = useState(null)
  const [hoveredLayer, setHoveredLayer] = useState(null)
  const cameraTimerRef = useRef(null)
  const layerTimerRef = useRef(null)

  // Synchronized Timeline State
  const [timelineSequence, setTimelineSequence] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTimelinePlaying, setIsTimelinePlaying] = useState(false)
  const [playbackSpeedMs, setPlaybackSpeedMs] = useState(450)
  const [volume, setVolume] = useState(0.75)
  const [isMuted, setIsMuted] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(false)

  // Canvas ref for live oscilloscope
  const canvasRef = useRef(null)
  const animFrameRef = useRef(null)
  const timerRef = useRef(null)

  const activeDataset = FLAGSHIP_DATASETS.find(d => d.id === activeDatasetId) || FLAGSHIP_DATASETS[0]

  // Filtered locations
  const filteredLocations = FLAGSHIP_LOCATIONS.filter(l => 
    l.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    l.country.toLowerCase().includes(searchFilter.toLowerCase()) ||
    l.biome.toLowerCase().includes(searchFilter.toLowerCase())
  )

  // Camera flight handler on location selection
  const handleSelectLocation = useCallback((loc) => {
    setActiveLocation(loc)
    setIsCameraFlying(true)
    if (cameraTimerRef.current) clearTimeout(cameraTimerRef.current)
    cameraTimerRef.current = setTimeout(() => {
      setIsCameraFlying(false)
    }, 2200)

    playEarcon('tab')
    announce(`Camera flying to ${loc.name}, coordinates: ${loc.lat.toFixed(2)}°, ${loc.lon.toFixed(2)}°`)
  }, [playEarcon, announce])

  // Satellite layer switch handler with crossfade feedback
  const handleSelectLayer = useCallback((layerId) => {
    setActiveLayerId(layerId)
    setIsLayerBlending(true)
    if (layerTimerRef.current) clearTimeout(layerTimerRef.current)
    layerTimerRef.current = setTimeout(() => {
      setIsLayerBlending(false)
    }, 450)

    playEarcon('tab')
    const layer = SATELLITE_LAYERS.find(l => l.id === layerId)
    if (layer) announce(`Crossfading to ${layer.name} imagery`)
  }, [playEarcon, announce])

  // Load dataset observations
  const loadDatasetSequence = useCallback(async () => {
    setIsLoadingData(true)
    setIsTimelinePlaying(false)
    setCurrentIndex(0)
    if (timerRef.current) clearInterval(timerRef.current)

    try {
      announce(`Loading ${activeDataset.name} for ${activeLocation.name}`)
      const res = await fetchEarthDataProcessingDemo(activeDatasetId)
      let seq = []
      if (res && res.data && Array.isArray(res.data.sonification_sequence)) {
        seq = res.data.sonification_sequence
      } else if (res && res.domains && res.domains[activeDatasetId]) {
        seq = res.domains[activeDatasetId].sonification_sequence || []
      }

      if (seq.length > 0) {
        setTimelineSequence(seq)
        earthSonificationEngine.loadSequence(seq, activeDatasetId)
        earthSonificationEngine.seek(0)
      }
    } catch (err) {
      console.error('Failed to load dataset sequence:', err)
    } finally {
      setIsLoadingData(false)
    }
  }, [activeDatasetId, activeDataset, activeLocation, announce])

  useEffect(() => {
    loadDatasetSequence()
  }, [loadDatasetSequence])

  // Sequencer loop
  useEffect(() => {
    if (!isTimelinePlaying || !timelineSequence.length) {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      return
    }

    const total = timelineSequence.length
    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = (prev + 1) % total
        earthSonificationEngine.seek(next)
        return next
      })
    }, playbackSpeedMs)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isTimelinePlaying, playbackSpeedMs, timelineSequence])

  // Volume & speed sync
  useEffect(() => {
    earthSonificationEngine.setVolume(volume)
    earthSonificationEngine.setMute(isMuted)
  }, [volume, isMuted])

  useEffect(() => {
    earthSonificationEngine.setPlaybackSpeedMs(playbackSpeedMs)
  }, [playbackSpeedMs])

  // Oscilloscope canvas renderer with realistic analogue phosphor decay
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const timeBuffer = new Uint8Array(256)
    let decay = 1.0

    const render = () => {
      animFrameRef.current = requestAnimationFrame(render)
      const w = canvas.width
      const h = canvas.height

      ctx.fillStyle = 'rgba(4, 8, 22, 0.45)'
      ctx.fillRect(0, 0, w, h)

      // Baseline grid line
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.15)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(0, h / 2)
      ctx.lineTo(w, h / 2)
      ctx.stroke()

      // Smooth dampening decay physics
      if (!isTimelinePlaying) {
        decay = Math.max(0, decay - 0.05)
      } else {
        decay = Math.min(1.0, decay + 0.1)
      }

      if (decay <= 0.01) {
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.25)'
        ctx.beginPath()
        ctx.moveTo(0, h / 2)
        ctx.lineTo(w, h / 2)
        ctx.stroke()
        return
      }

      earthSonificationEngine.getWaveformData(timeBuffer)
      ctx.lineWidth = 2.2
      ctx.strokeStyle = '#10b981'
      ctx.shadowColor = '#10b981'
      ctx.shadowBlur = Math.round(6 * decay)

      ctx.beginPath()
      const sliceWidth = w / 256
      let x = 0
      for (let i = 0; i < 256; i++) {
        const rawV = (timeBuffer[i] / 128.0) - 1.0
        const v = 1.0 + (rawV * decay)
        const y = (v * h) / 2
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
        x += sliceWidth
      }
      ctx.lineTo(w, h / 2)
      ctx.stroke()
      ctx.shadowBlur = 0
    }

    render()
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [isTimelinePlaying])

  // Active observation data
  const activeFrame = timelineSequence[currentIndex] || null
  const activeVal = activeFrame?.original_measurement ?? activeFrame?.value ?? null
  const activeDate = activeFrame?.timestamp || '2024-08-01'
  const isMissing = activeFrame?.quality_information?.is_missing ?? false

  // Radiometric range calculation
  const dsMin = activeDataset.range[0]
  const dsMax = activeDataset.range[1]
  const currentGaugePct = activeVal !== null
    ? Math.max(0, Math.min(100, ((activeVal - dsMin) / (dsMax - dsMin)) * 100))
    : 0

  // Volume in decibels
  const volumeDb = isMuted || volume === 0 ? '-∞ dBFS' : `${(20 * Math.log10(volume)).toFixed(1)} dBFS`

  const handlePlayToggle = async () => {
    if (isTimelinePlaying) {
      setIsTimelinePlaying(false)
      earthSonificationEngine.pause()
      playEarcon('pause')
    } else {
      setIsTimelinePlaying(true)
      await earthSonificationEngine.play()
      earthSonificationEngine.seek(currentIndex)
      playEarcon('play')
    }
  }

  const handleReplay = async () => {
    setIsTimelinePlaying(false)
    setCurrentIndex(0)
    earthSonificationEngine.seek(0)
    await earthSonificationEngine.play()
    setIsTimelinePlaying(true)
    playEarcon('play')
  }

  const handleSeek = (idx) => {
    const valid = Math.max(0, Math.min(timelineSequence.length - 1, idx))
    setCurrentIndex(valid)
    earthSonificationEngine.seek(valid)
    playEarcon('navigation')
  }

  const handleStep = (delta) => {
    if (!timelineSequence.length) return
    const next = (currentIndex + delta + timelineSequence.length) % timelineSequence.length
    handleSeek(next)
  }

  // Interactive Audition Acoustic Signature
  const handleAuditionAcoustics = () => {
    try {
      if (earthSonificationEngine.ctx?.state === 'suspended') {
        earthSonificationEngine.ctx.resume()
      }
      const val = activeVal !== null ? activeVal : (dsMin + dsMax) / 2
      const freq = activeDatasetId === 'temperature'
        ? mapTemperatureToPitch(val)
        : activeDatasetId === 'ocean_sst'
        ? mapOceanToFoundationDrone(val)
        : 220 + (val * 8)
      
      earthSonificationEngine.playTone(Math.max(65, Math.min(1000, freq)), 0.45, {
        type: activeDatasetId === 'temperature' ? 'sine' : 'triangle',
        gainMultiplier: 0.9
      })
      playEarcon('play')
    } catch (err) {}
  }

  // Framer Motion entry variants
  const pageVariants = {
    hidden: { opacity: 0, y: reducedMotion ? 0 : 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: reducedMotion ? 0.05 : 0.45,
        ease: [0.16, 1, 0.3, 1]
      }
    }
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="w-full space-y-4 relative"
    >
      
      {/* Background Atmospheric Limb Glow reflecting active dataset theme */}
      <div
        className="absolute -inset-10 pointer-events-none rounded-3xl transition-all duration-700 blur-3xl opacity-60 z-0"
        style={{
          background: `radial-gradient(ellipse at 50% 30%, ${activeDataset.glowColor}, transparent 70%)`
        }}
      />

      {/* =========================================================================
          WORKSPACE NAVIGATION BAR & VIEW SWITCHER
         ========================================================================= */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-cyan-500/10">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2">
              Earth Exploration Console
              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                WGS-84 ACTIVE
              </span>
            </h2>
            <p className="font-mono text-xs text-slate-400">
              NASA EARTH SCIENCE DIVISION • SYNCHRONIZED MULTI-SPECTRAL WORKSPACE
            </p>
          </div>
        </div>

        {/* View Mode Toggle: 3-Panel Explorer vs 3D Cesium vs Synchronized Timeline vs Audio-First */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800 font-mono" role="tablist">
          <button
            role="tab"
            aria-selected={explorerMode === 'explorer3p'}
            onClick={() => setExplorerMode('explorer3p')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all focus:ring-2 focus:ring-cyan-400 focus:outline-none ${
              explorerMode === 'explorer3p'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>3-PANEL WORKSPACE</span>
          </button>

          <button
            role="tab"
            aria-selected={explorerMode === 'globe3d'}
            onClick={() => setExplorerMode('globe3d')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all focus:ring-2 focus:ring-cyan-400 focus:outline-none ${
              explorerMode === 'globe3d'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Globe2 className="w-3.5 h-3.5" />
            <span>3D CESIUM GLOBE</span>
          </button>

          <button
            role="tab"
            aria-selected={explorerMode === 'sync'}
            onClick={() => setExplorerMode('sync')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all focus:ring-2 focus:ring-cyan-400 focus:outline-none ${
              explorerMode === 'sync'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>SYNCHRONIZED TIMELINE</span>
          </button>

          <button
            role="tab"
            aria-selected={explorerMode === 'audio'}
            onClick={() => setExplorerMode('audio')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all focus:ring-2 focus:ring-cyan-400 focus:outline-none ${
              explorerMode === 'audio'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <EyeOff className="w-3.5 h-3.5" />
            <span>AUDIO-FIRST</span>
            <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-400 text-slate-950 font-extrabold ml-0.5">
              A11Y
            </span>
          </button>
        </div>
      </div>

      {/* Mode Render: Audio-First vs Synchronized vs 3D Cesium vs 3-Panel Flagship */}
      {explorerMode === 'audio' ? (
        <AudioFirstDataExplorer />
      ) : explorerMode === 'sync' ? (
        <SynchronizedEarthExplorer />
      ) : explorerMode === 'globe3d' ? (
        <React.Suspense
          fallback={
            <div className="w-full h-[650px] rounded-2xl bg-slate-950/90 border border-cyan-500/30 flex flex-col items-center justify-center space-y-4 p-8 text-center shadow-2xl">
              <Globe2 className="w-8 h-8 text-cyan-400 animate-spin" />
              <div className="text-sm font-mono text-slate-200">INITIALIZING 3D CESIUM SATELLITE ENGINE</div>
            </div>
          }
        >
          <CesiumGlobeViewer targetLocation={activeLocation} selectedLayerId={activeLayerId} mode="full" onLocationSelect={handleSelectLocation} />
        </React.Suspense>
      ) : (
        /* =======================================================================
            FLAGSHIP 3-PANEL EXPLORER INTERFACE
            - Left Panel: Locations, Datasets, Satellite Layers (Collapsible)
            - Center: 3D Cesium Earth / 2D Vector Map with HUD
            - Right Panel: Active Telemetry, Physical Units, Audio Translation (Collapsible)
            - Bottom Panel: Timeline Scrubber, Transport, Waveform, Meters (Collapsible)
           ======================================================================= */
        <div className="space-y-4 relative z-10">
          
          {/* Main Upper Workspace: Left Panel + Center + Right Panel */}
          <div className="relative flex flex-col lg:flex-row gap-4 items-stretch min-h-[640px]">
            
            {/* -------------------------------------------------------------------
                LEFT PANEL: Location Presets, Datasets, Satellite Layers
               ------------------------------------------------------------------- */}
            <AnimatePresence initial={false}>
              {isLeftOpen ? (
                <motion.aside
                  key="left-panel"
                  initial={{ opacity: 0, width: 0, x: -20 }}
                  animate={{ opacity: 1, width: 250, x: 0 }}
                  exit={{ opacity: 0, width: 0, x: -20 }}
                  transition={{ duration: reducedMotion ? 0.05 : 0.25, ease: 'easeInOut' }}
                  className="shrink-0 flex flex-col space-y-4 overflow-hidden z-20"
                >
                  <GlassPanel className="p-4 flex flex-col h-full space-y-4">
                    {/* Header with Collapse Button */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div className="flex items-center space-x-2 text-cyan-400 font-mono text-xs font-bold uppercase tracking-wider">
                        <MapPin className="w-4 h-4" />
                        <span>EXPLORER NAVIGATOR</span>
                      </div>
                      <button
                        onClick={() => setIsLeftOpen(false)}
                        className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        title="Collapse Left Panel"
                        aria-label="Collapse Left Panel"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Location Search Bar */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      <input
                        type="text"
                        value={searchFilter}
                        onChange={(e) => setSearchFilter(e.target.value)}
                        placeholder="Filter 7 observatory presets..."
                        className="w-full bg-slate-950/80 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-400 font-mono"
                      />
                    </div>

                    {/* Location Presets List with Context-Aware Tooltips */}
                    <div className="space-y-1.5 overflow-y-auto max-h-48 pr-1 scrollbar-none font-mono">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">
                        OBSERVATORY PRESETS ({filteredLocations.length})
                      </span>
                      {filteredLocations.map((loc) => {
                        const isSelected = activeLocation.id === loc.id
                        return (
                          <div key={loc.id} className="relative group">
                            <button
                              onClick={() => handleSelectLocation(loc)}
                              onMouseEnter={() => setHoveredPreset(loc)}
                              onMouseLeave={() => setHoveredPreset(null)}
                              className={`w-full text-left p-2 rounded-lg text-xs transition-all flex items-center justify-between ${
                                isSelected
                                  ? 'bg-cyan-500/20 border border-cyan-400/50 text-cyan-200'
                                  : 'bg-slate-950/40 border border-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800/50'
                              }`}
                            >
                              <div className="truncate pr-2">
                                <div className="font-bold truncate">{loc.name}</div>
                                <div className="text-[9px] text-slate-400 truncate">{loc.country}</div>
                              </div>
                              <span className="text-[9px] font-bold text-emerald-400 shrink-0">
                                {loc.sampleVal}
                              </span>
                            </button>

                            {/* Context-aware Hover Tooltip */}
                            {hoveredPreset?.id === loc.id && (
                              <div className="absolute left-full ml-2 top-0 z-50 w-52 p-2.5 rounded-xl bg-slate-950/95 border border-cyan-500/40 text-[10px] shadow-2xl backdrop-blur-md pointer-events-none hidden md:block">
                                <div className="font-bold text-cyan-300">{loc.name}</div>
                                <div className="text-slate-400 mt-0.5">{loc.lat.toFixed(2)}°, {loc.lon.toFixed(2)}°</div>
                                <div className="text-emerald-400 mt-1">{loc.biome}</div>
                                <div className="text-slate-300 text-[9px] mt-0.5">{loc.climateClass}</div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    {/* Dataset Selector with Mission Provenance */}
                    <div className="space-y-1.5 font-mono pt-2 border-t border-slate-800">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">
                        SCIENTIFIC DATASET
                      </span>
                      <div className="space-y-1">
                        {FLAGSHIP_DATASETS.map((ds) => {
                          const Icon = ds.icon
                          const isSelected = activeDatasetId === ds.id
                          return (
                            <div key={ds.id} className="relative group">
                              <button
                                onClick={() => {
                                  setActiveDatasetId(ds.id)
                                  playEarcon('tab')
                                }}
                                onMouseEnter={() => setHoveredDataset(ds)}
                                onMouseLeave={() => setHoveredDataset(null)}
                                className={`w-full text-left p-2 rounded-lg text-xs transition-all flex items-center space-x-2.5 ${
                                  isSelected
                                    ? 'bg-cyan-500/25 border border-cyan-400 text-cyan-200 font-bold'
                                    : 'bg-slate-950/40 border border-slate-800/80 text-slate-400 hover:text-white'
                                }`}
                              >
                                <Icon className="w-3.5 h-3.5 shrink-0 text-cyan-400" />
                                <div className="truncate flex-1">
                                  <div className="truncate">{ds.name}</div>
                                  <div className="text-[9px] text-slate-400">{ds.unit} • {ds.sensor.split('/')[0]}</div>
                                </div>
                              </button>

                              {/* Dataset Context Tooltip */}
                              {hoveredDataset?.id === ds.id && (
                                <div className="absolute left-full ml-2 top-0 z-50 w-60 p-2.5 rounded-xl bg-slate-950/95 border border-cyan-500/40 text-[10px] shadow-2xl backdrop-blur-md pointer-events-none hidden md:block">
                                  <div className="font-bold text-cyan-300">{ds.name}</div>
                                  <div className="text-slate-300 text-[9px] mt-1 leading-snug">{ds.sensorDetails}</div>
                                  <div className="text-emerald-400 mt-1 font-mono text-[9px]">
                                    Range: {ds.range[0]} to {ds.range[1]} {ds.unit}
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Satellite Layer Toggles with Resolution Info */}
                    <div className="space-y-1.5 font-mono pt-2 border-t border-slate-800">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">
                          SATELLITE SENSOR LAYER
                        </span>
                        {isLayerBlending && (
                          <span className="text-[9px] text-cyan-400 font-bold animate-pulse">
                            BLENDING...
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {SATELLITE_LAYERS.map((layer) => {
                          const isSelected = activeLayerId === layer.id
                          return (
                            <div key={layer.id} className="relative group">
                              <button
                                onClick={() => handleSelectLayer(layer.id)}
                                onMouseEnter={() => setHoveredLayer(layer)}
                                onMouseLeave={() => setHoveredLayer(null)}
                                className={`w-full p-1.5 rounded-lg text-[10px] text-left border transition-all ${
                                  isSelected
                                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold'
                                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-white'
                                }`}
                              >
                                <div className="truncate font-bold">{layer.badge}</div>
                                <div className="text-[8px] text-slate-400 truncate">{layer.mission.split(' ')[0]}</div>
                              </button>

                              {/* Layer Context Tooltip */}
                              {hoveredLayer?.id === layer.id && (
                                <div className="absolute left-0 bottom-full mb-1 z-50 w-48 p-2 rounded-xl bg-slate-950/95 border border-cyan-500/40 text-[9px] shadow-2xl backdrop-blur-md pointer-events-none hidden md:block">
                                  <div className="font-bold text-cyan-300">{layer.name}</div>
                                  <div className="text-slate-300 mt-0.5">Res: {layer.resolution}</div>
                                  <div className="text-emerald-400 mt-0.5">Cycle: {layer.revisit}</div>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </GlassPanel>
                </motion.aside>
              ) : null}
            </AnimatePresence>

            {/* Collapsed Left Panel Re-open Pill */}
            {!isLeftOpen && (
              <button
                onClick={() => setIsLeftOpen(true)}
                className="absolute left-2 top-4 z-30 flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-slate-950/90 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold shadow-xl backdrop-blur-md hover:bg-slate-900 transition-all"
                title="Expand Left Navigator"
                aria-label="Expand Left Navigator"
              >
                <ChevronRight className="w-4 h-4 text-cyan-400" />
                <span>NAVIGATOR</span>
              </button>
            )}

            {/* -------------------------------------------------------------------
                CENTER WORKSPACE: 3D Cesium Globe or 2D Vector Map with HUD
               ------------------------------------------------------------------- */}
            <div className="flex-1 relative flex flex-col rounded-2xl overflow-hidden border border-cyan-500/20 bg-slate-950 shadow-2xl min-h-[520px]">
              
              {/* Center Floating Header HUD */}
              <div className="absolute top-3 inset-x-3 z-30 flex items-center justify-between pointer-events-none gap-2 font-mono">
                <div className="pointer-events-auto flex items-center space-x-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-cyan-500/30 text-xs shadow-lg">
                  <span className={`w-2 h-2 rounded-full ${isCameraFlying ? 'bg-cyan-400 animate-ping' : 'bg-emerald-400 animate-pulse'}`} />
                  <span className="text-cyan-300 font-bold uppercase truncate max-w-[180px]">
                    {activeLocation.name}
                  </span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-300 text-[11px]">
                    {activeLocation.lat.toFixed(2)}°, {activeLocation.lon.toFixed(2)}°
                  </span>

                  {/* 3D Camera Flight Indicator */}
                  {isCameraFlying && (
                    <span className="ml-2 px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold text-[9px] border border-cyan-400/40 animate-pulse flex items-center gap-1">
                      <Compass className="w-3 h-3 animate-spin" />
                      <span>3D CAMERA IN TRANSIT</span>
                    </span>
                  )}
                </div>

                {/* View Switcher: 3D Cesium vs 2D Map & Immersion Maximize */}
                <div className="pointer-events-auto flex items-center space-x-1 bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-cyan-500/30 text-xs">
                  <button
                    onClick={() => setCenterDisplayMode('3d_cesium')}
                    className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                      centerDisplayMode === '3d_cesium'
                        ? 'bg-cyan-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Globe2 className="w-3 h-3" />
                    <span>3D CESIUM</span>
                  </button>
                  <button
                    onClick={() => setCenterDisplayMode('2d_vector')}
                    className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                      centerDisplayMode === '2d_vector'
                        ? 'bg-cyan-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Map className="w-3 h-3" />
                    <span>2D VECTOR</span>
                  </button>
                  <button
                    onClick={() => {
                      if (!isLeftOpen && !isRightOpen) {
                        setIsLeftOpen(true)
                        setIsRightOpen(true)
                      } else {
                        setIsLeftOpen(false)
                        setIsRightOpen(false)
                      }
                    }}
                    className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                      !isLeftOpen && !isRightOpen
                        ? 'bg-emerald-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                    title={!isLeftOpen && !isRightOpen ? "Restore Side Panels" : "Maximize 3D Globe (Immersion Mode)"}
                    aria-label={!isLeftOpen && !isRightOpen ? "Restore Side Panels" : "Maximize 3D Globe"}
                  >
                    {!isLeftOpen && !isRightOpen ? (
                      <>
                        <Minimize2 className="w-3 h-3" />
                        <span>RESTORE</span>
                      </>
                    ) : (
                      <>
                        <Maximize2 className="w-3 h-3" />
                        <span>MAX GLOBE</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Main View Render */}
              <div className="w-full h-full flex-1 min-h-[500px] flex items-center justify-center relative">
                {/* Animated Dataset Loading State Overlay */}
                {isLoadingData && (
                  <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm z-30 flex flex-col items-center justify-center space-y-3 font-mono">
                    <div className="relative w-16 h-16 rounded-full border border-cyan-500/30 flex items-center justify-center">
                      <div className="absolute inset-0 rounded-full border-t-2 border-cyan-400 animate-spin" />
                      <Radio className="w-6 h-6 text-cyan-400 animate-pulse" />
                    </div>
                    <div className="text-xs text-cyan-300 font-bold uppercase tracking-wider">
                      DOWNLINKING NASA EOSDIS TELEMETRY...
                    </div>
                  </div>
                )}

                {centerDisplayMode === '3d_cesium' ? (
                  <React.Suspense
                    fallback={
                      <div className="flex flex-col items-center justify-center space-y-3 font-mono text-cyan-400">
                        <Globe2 className="w-10 h-10 animate-spin" />
                        <span className="text-xs">STREAMING 3D SENTINEL-2 & NASA TILES...</span>
                      </div>
                    }
                  >
                    <CesiumGlobeViewer targetLocation={activeLocation} selectedLayerId={activeLayerId} mode="embedded" onLocationSelect={handleSelectLocation} />
                  </React.Suspense>
                ) : (
                  <InteractiveMapExplorer />
                )}
              </div>

              {/* Floating Bottom HUD Overlay */}
              <div className="absolute bottom-3 inset-x-3 z-30 pointer-events-none flex items-center justify-between font-mono text-[10px]">
                <div className="bg-slate-900/85 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-800 text-slate-300 flex items-center gap-1.5">
                  <span>LAYER:</span>
                  <span className="text-cyan-300 font-bold">{activeLayerId.toUpperCase()}</span>
                  {isLayerBlending && <span className="text-cyan-400 animate-pulse">• CROSSFADING</span>}
                </div>
                <div className="bg-slate-900/85 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-800 text-slate-300">
                  OBSERVATORY BIOME: <span className="text-emerald-400 font-bold">{activeLocation.biome}</span>
                </div>
              </div>
            </div>

            {/* Collapsed Right Panel Re-open Pill */}
            {!isRightOpen && (
              <button
                onClick={() => setIsRightOpen(true)}
                className="absolute right-2 top-4 z-30 flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-slate-950/90 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold shadow-xl backdrop-blur-md hover:bg-slate-900 transition-all"
                title="Expand Right Telemetry"
                aria-label="Expand Right Telemetry"
              >
                <span>TELEMETRY</span>
                <ChevronLeft className="w-4 h-4 text-cyan-400" />
              </button>
            )}

            {/* -------------------------------------------------------------------
                RIGHT PANEL: Active Telemetry, Units, Audio Description
               ------------------------------------------------------------------- */}
            <AnimatePresence initial={false}>
              {isRightOpen ? (
                <motion.aside
                  key="right-panel"
                  initial={{ opacity: 0, width: 0, x: 20 }}
                  animate={{ opacity: 1, width: 260, x: 0 }}
                  exit={{ opacity: 0, width: 0, x: 20 }}
                  transition={{ duration: reducedMotion ? 0.05 : 0.25, ease: 'easeInOut' }}
                  className="shrink-0 flex flex-col space-y-4 overflow-hidden z-20"
                >
                  <GlassPanel className="p-4 flex flex-col h-full space-y-4 font-mono">
                    {/* Header with Collapse Button */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div className="flex items-center space-x-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
                        <Activity className="w-4 h-4" />
                        <span>SCIENTIFIC TELEMETRY</span>
                      </div>
                      <button
                        onClick={() => setIsRightOpen(false)}
                        className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        title="Collapse Right Panel"
                        aria-label="Collapse Right Panel"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Active Observation Metric with Smooth Count-Up & Transitions */}
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                          CALIBRATED VALUE ({activeDataset.unit})
                        </span>
                        {isLoadingData && (
                          <span className="text-[9px] text-cyan-400 animate-pulse">DOWNLINK</span>
                        )}
                      </div>

                      <motion.div
                        key={`${activeDatasetId}-${currentIndex}-${activeVal}`}
                        initial={{ opacity: 0.4, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: reducedMotion ? 0.05 : 0.2 }}
                        className="text-2xl font-black text-slate-100 flex items-baseline gap-1.5"
                      >
                        {activeVal !== null
                          ? `${Number(activeVal).toFixed(2)}`
                          : <span className="text-rose-400 text-lg">GAP (NULL)</span>}
                        <span className="text-xs text-emerald-400 font-bold">{activeDataset.unit}</span>
                      </motion.div>

                      {/* Radiometric Range Scale Gauge */}
                      <div className="space-y-1 pt-1">
                        <div className="flex justify-between text-[8px] text-slate-500">
                          <span>{dsMin} {activeDataset.unit}</span>
                          <span className="text-cyan-400 uppercase">DYNAMIC SCALE</span>
                          <span>{dsMax} {activeDataset.unit}</span>
                        </div>
                        <div className="relative w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full transition-all duration-300 ease-out"
                            style={{ width: `${currentGaugePct}%` }}
                          />
                        </div>
                      </div>

                      <div className="text-[10px] text-slate-400 pt-0.5">
                        {isMissing ? 'Data Dropout (Muted)' : 'Authentic NASA Satellite Sensor'}
                      </div>
                    </div>

                    {/* Acoustic Sonification Translation & Audition Button */}
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">
                          SONIC PARAMETER
                        </span>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={handleAuditionAcoustics}
                            title="Audition current acoustic mapping"
                            aria-label="Audition current acoustic mapping"
                            className="px-2 py-0.5 rounded text-[9px] font-bold bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-400/40 flex items-center gap-1 transition-all"
                          >
                            <Zap className="w-2.5 h-2.5" />
                            <span>TEST TONE</span>
                          </button>
                          <Badge variant="cyan" size="sm">ACTIVE DSP</Badge>
                        </div>
                      </div>
                      <p className="text-xs text-cyan-300 font-bold leading-snug">
                        {activeDataset.acousticParameter}
                      </p>
                      <div className="pt-1.5 border-t border-slate-800/80 text-[10px] text-slate-400 space-y-1">
                        <div className="flex justify-between">
                          <span>SYNTH INSTRUMENT:</span>
                          <span className="text-slate-200">Planetary Pure Tone</span>
                        </div>
                        <div className="flex justify-between">
                          <span>LIMITER:</span>
                          <span className="text-emerald-400 font-bold">-14 dBFS Safe</span>
                        </div>
                      </div>
                    </div>

                    {/* Spoken Scientific Audio Description */}
                    <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-800/30 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-cyan-400 uppercase tracking-wider font-bold">
                          AUDIO DESCRIPTION
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Volume2}
                          onClick={() => {
                            if (isSpeaking) stopSpeaking()
                            else speak(`${activeLocation.name}, observing ${activeDataset.name}: currently reading ${activeVal || 'uncalibrated'} ${activeDataset.unit}. ${activeLocation.description}`)
                          }}
                          className="h-6 px-2 text-[10px]"
                        >
                          {isSpeaking ? 'Stop' : 'Read Out'}
                        </Button>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                        {activeLocation.description}
                      </p>
                    </div>

                    {/* Sensor Attribution Deck */}
                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[10px] space-y-1 text-slate-400 mt-auto">
                      <div className="flex justify-between">
                        <span>DATA SOURCE:</span>
                        <span className="text-slate-200 font-bold">{activeDataset.sensor}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>COORDINATES:</span>
                        <span className="text-slate-200 font-bold">{activeLocation.lat.toFixed(2)}°, {activeLocation.lon.toFixed(2)}°</span>
                      </div>
                      <div className="flex justify-between">
                        <span>LICENSE:</span>
                        <span className="text-emerald-400">Open NASA EOSDIS</span>
                      </div>
                    </div>
                  </GlassPanel>
                </motion.aside>
              ) : null}
            </AnimatePresence>

          </div>

          {/* -------------------------------------------------------------------
              BOTTOM PANEL: Timeline Scrubber, Playback Controls, Waveform, Meters
             ------------------------------------------------------------------- */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-cyan-500/20 backdrop-blur-md space-y-3 font-mono shadow-2xl">
            
            {/* Header with Timeline Date & Collapse Toggle */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span className="text-slate-400">SYNCHRONIZED TIMELINE:</span>
                <span className="text-sm font-extrabold text-cyan-300 bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-800">
                  {activeDate}
                </span>
                <Badge variant={isTimelinePlaying ? 'emerald' : 'slate'} size="sm">
                  {isTimelinePlaying ? 'LOCKSTEP ACTIVE' : 'PAUSED'}
                </Badge>
              </div>

              <div className="flex items-center space-x-3">
                <span className="text-slate-400 text-[11px]">
                  OBSERVATION {currentIndex + 1} / {timelineSequence.length || 1}
                </span>
                <button
                  onClick={() => setIsBottomOpen(!isBottomOpen)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  title={isBottomOpen ? "Collapse Bottom Controls" : "Expand Bottom Controls"}
                >
                  {isBottomOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Collapsible Content */}
            <AnimatePresence initial={false}>
              {isBottomOpen ? (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: reducedMotion ? 0.05 : 0.2 }}
                  className="space-y-3 pt-1"
                >
                  {/* Timeline Progress Bar with Glowing Playhead Bead */}
                  <div
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect()
                      const pct = (e.clientX - rect.left) / rect.width
                      const idx = Math.floor(pct * timelineSequence.length)
                      handleSeek(idx)
                    }}
                    className="relative w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800 cursor-pointer"
                  >
                    <div
                      className="h-full bg-cyan-500 rounded-full transition-all duration-200 relative"
                      style={{ width: `${((currentIndex + 1) / Math.max(1, timelineSequence.length)) * 100}%` }}
                    >
                      {/* Animated Playhead Glowing Edge */}
                      <span className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-cyan-300 shadow-md shadow-cyan-400/80 animate-pulse" />
                    </div>
                  </div>

                  {/* Scrubber Nodes Strip */}
                  <div className="flex items-center gap-1 overflow-x-auto py-1 scrollbar-none">
                    {timelineSequence.map((f, idx) => {
                      const isCurrent = idx === currentIndex
                      const fMissing = f.quality_information?.is_missing
                      const fVal = f.original_measurement ?? f.value
                      const fDate = f.timestamp ? f.timestamp.slice(5) : `#${idx+1}`

                      return (
                        <button
                          key={idx}
                          onClick={() => handleSeek(idx)}
                          className={`flex-1 min-w-[42px] py-1 px-1 rounded-lg text-[9px] font-bold border transition-all text-center ${
                            isCurrent
                              ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200 shadow-md ring-1 ring-cyan-400'
                              : fMissing
                              ? 'bg-rose-950/20 border-rose-900/40 text-rose-400 opacity-60'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                          }`}
                        >
                          <div className="text-[8px] text-slate-500 truncate">{fDate}</div>
                          <div className={fMissing ? 'text-rose-400' : 'text-slate-200'}>
                            {fMissing ? 'GAP' : fVal !== null ? Number(fVal).toFixed(1) : '--'}
                          </div>
                        </button>
                      )
                    })}
                  </div>

                  {/* Dual Grid: Transport Actions + Oscilloscope Waveform */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center pt-2 border-t border-slate-800/80">
                    
                    {/* Left: Transport Controls & Speed */}
                    <div className="lg:col-span-7 flex flex-wrap items-center gap-3">
                      <button
                        onClick={handlePlayToggle}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                          isTimelinePlaying
                            ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                            : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-md shadow-cyan-500/20'
                        }`}
                      >
                        {isTimelinePlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        <span>{isTimelinePlaying ? 'PAUSE TIMELINE' : 'PLAY TIMELINE'}</span>
                      </button>

                      <button
                        onClick={handleReplay}
                        className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
                        title="Replay from start"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>

                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleStep(-1)}
                          className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
                          title="Previous Frame"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleStep(1)}
                          className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
                          title="Next Frame"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Speed Presets */}
                      <div className="flex items-center space-x-1 text-slate-400 pl-2">
                        <span className="text-[10px]">SPEED:</span>
                        {SPEED_PRESETS.map((spd) => (
                          <button
                            key={spd.label}
                            onClick={() => setPlaybackSpeedMs(spd.ms)}
                            className={`px-2 py-0.5 rounded text-[9px] font-bold border transition-all ${
                              playbackSpeedMs === spd.ms
                                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                            }`}
                          >
                            {spd.label}
                          </button>
                        ))}
                      </div>

                      {/* Interactive Volume & dBFS Level Readout */}
                      <div className="flex items-center space-x-2 pl-2">
                        <button
                          onClick={() => setIsMuted(!isMuted)}
                          className="text-slate-400 hover:text-white"
                          title={isMuted ? "Unmute" : "Mute"}
                        >
                          {isMuted || volume === 0 ? (
                            <VolumeX className="w-4 h-4 text-rose-400" />
                          ) : (
                            <Volume2 className="w-4 h-4 text-cyan-400" />
                          )}
                        </button>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={isMuted ? 0 : volume}
                          onChange={(e) => {
                            if (isMuted) setIsMuted(false)
                            setVolume(parseFloat(e.target.value))
                          }}
                          className="w-16 accent-cyan-400 cursor-pointer"
                        />
                        <span className="text-[9px] text-slate-400 w-12 font-mono">{volumeDb}</span>
                      </div>
                    </div>

                    {/* Right: Real-time Oscilloscope Waveform Canvas */}
                    <div className="lg:col-span-5 relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                      <canvas
                        ref={canvasRef}
                        width={380}
                        height={48}
                        className="w-full h-12 block"
                      />
                      <div className="absolute top-1 left-2 flex items-center space-x-1.5 text-[9px] text-slate-400">
                        <span className={`w-1.5 h-1.5 rounded-full ${isTimelinePlaying ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'}`} />
                        <span>LIVE OSCILLOSCOPE TRACE</span>
                      </div>
                    </div>

                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>

          </div>

        </div>
      )}

    </motion.div>
  )
}
