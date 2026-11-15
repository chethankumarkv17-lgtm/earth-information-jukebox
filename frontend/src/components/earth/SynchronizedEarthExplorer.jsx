import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Globe2,
  Calendar,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Sliders,
  Waves,
  Activity,
  Layers,
  MapPin,
  Clock,
  Compass,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Thermometer,
  CloudRain,
  Wind,
  Trees,
  Snowflake,
  Sun,
  Database,
  Sparkles,
  Info,
  Maximize2,
  Minimize2,
  RefreshCw,
  Eye,
  Radio
} from 'lucide-react'

import GlassPanel from '../common/GlassPanel'
import Button from '../common/Button'
import Badge from '../common/Badge'
import {
  earthSonificationEngine,
  MAPPING_SPECIFICATIONS,
  SOUND_INSTRUMENTS,
  mapTemperatureToPitch,
  mapPrecipitationToAcousticRhythm,
  mapWindSpeedToModulation,
  mapVegetationToTimbre,
  mapOceanToFoundationDrone
} from '../../services/earthDataSonificationEngine'
import { fetchEarthDataProcessingDemo, fetchEarthTimeline } from '../../services/api'
import { useAccessibility } from '../../context/AccessibilityContext'

// Curated Locations across key Earth climate systems
export const SYNCHRONIZED_LOCATIONS = [
  {
    id: 'amazon',
    name: 'Amazon Basin Rainforest',
    country: 'Brazil',
    lat: -3.4653,
    lon: -62.2159,
    biome: 'Tropical Rainforest',
    defaultDataset: 'temperature',
    imageryUrl: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=1000&q=80',
    description: 'Vital carbon sink and high evapotranspiration biosphere driving global moisture transport.'
  },
  {
    id: 'sahara',
    name: 'Sahara Transition Zone',
    country: 'Algeria / Niger',
    lat: 23.4162,
    lon: 12.6075,
    biome: 'Hyper-Arid Subtropical Desert',
    defaultDataset: 'precipitation',
    imageryUrl: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1000&q=80',
    description: 'Extreme thermal diurnal swings and sporadic monsoonal convective deluges amidst dry spells.'
  },
  {
    id: 'svalbard',
    name: 'Svalbard Arctic Outpost',
    country: 'Norway',
    lat: 78.2232,
    lon: 15.6267,
    biome: 'Polar Tundra & Cryosphere',
    defaultDataset: 'wind_speed',
    imageryUrl: 'https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?auto=format&fit=crop&w=1000&q=80',
    description: 'High-latitude polar archipelago experiencing rapid Arctic amplification and maritime storm gales.'
  },
  {
    id: 'pacific',
    name: 'Equatorial Pacific Warm Pool',
    country: 'International Waters',
    lat: 0.5000,
    lon: -150.0000,
    biome: 'Oceanic Pelagic Marine',
    defaultDataset: 'ocean_sst',
    imageryUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80',
    description: 'Convective epicenter of the El Niño-Southern Oscillation (ENSO) ocean-atmosphere system.'
  },
  {
    id: 'greenland',
    name: 'Greenland Ice Sheet Summit',
    country: 'Greenland',
    lat: 72.5796,
    lon: -38.4592,
    biome: 'Continental Ice Sheet',
    defaultDataset: 'temperature',
    imageryUrl: 'https://images.unsplash.com/photo-1483181957632-8bda974cbc91?auto=format&fit=crop&w=1000&q=80',
    description: 'Massive cryospheric freshwater reservoir subject to summer albedo feedback melt cycles.'
  },
  {
    id: 'shivamogga',
    name: 'Western Ghats (Shivamogga)',
    country: 'India',
    lat: 13.9299,
    lon: 75.5681,
    biome: 'Tropical Montane Rainforest',
    defaultDataset: 'precipitation',
    imageryUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1000&q=80',
    description: 'UNESCO biodiversity hotspot experiencing intensive southwest monsoonal orographic precipitation.'
  }
]

export const SYNCHRONIZED_DATASETS = [
  {
    id: 'temperature',
    name: 'Surface & 2m Air Temperature',
    unit: '°C',
    source: 'NASA POWER / GMAO MERRA-2 Assimilation',
    icon: Thermometer,
    color: 'amber',
    physicalRange: [-30.0, 50.0],
    visualRepresentation: 'Thermal Infrared Radiometric Composite & Kinetic Heat Index',
    acousticParameter: 'Acoustic Pitch (MIDI 36 to 84 / 65.4 Hz to 1046.5 Hz)'
  },
  {
    id: 'precipitation',
    name: 'Accumulated Precipitation & Dry Days',
    unit: 'mm',
    source: 'NASA POWER / GPCP Rain Gauge Corrected',
    icon: CloudRain,
    color: 'cyan',
    physicalRange: [0.0, 100.0],
    visualRepresentation: 'Doppler Radar Reflectivity & Cloud Water Equivalent',
    acousticParameter: 'Droplet Pulse Density & Rhythm (Silence on 0.0 mm dry days)'
  },
  {
    id: 'wind_speed',
    name: '10-Meter Neutral Wind Speed',
    unit: 'm/s',
    source: 'NASA MERRA-2 Atmospheric Reanalysis',
    icon: Wind,
    color: 'teal',
    physicalRange: [0.0, 40.0],
    visualRepresentation: 'Atmospheric Vector Streamlines & Velocity Vectors',
    acousticParameter: 'LFO Tremolo Rate (0.2 Hz to 8.5 Hz) & Resonant Filter Sweep'
  },
  {
    id: 'vegetation',
    name: 'Photosynthetic Canopy Density (NDVI)',
    unit: 'NDVI',
    source: 'NASA LP DAAC / MODIS Terra 8-Day',
    icon: Trees,
    color: 'emerald',
    physicalRange: [-0.2, 1.0],
    visualRepresentation: 'Normalized Difference Vegetation Canopy False-Color Ratio',
    acousticParameter: 'Harmonic Richness & Waveform (Sine to Rich Sawtooth Overtones)'
  },
  {
    id: 'ocean_sst',
    name: 'Sea Surface Foundation Temperature',
    unit: '°C',
    source: 'NASA PO.DAAC / JPL GHRSST MUR Altimetry',
    icon: Waves,
    color: 'blue',
    physicalRange: [0.0, 35.0],
    visualRepresentation: 'Microwave & Infrared SST Composite Contour',
    acousticParameter: 'Sub-Bass Foundation Drone (43.6 Hz to 130.8 Hz) & Tidal Swell'
  }
]

const SPEED_PRESETS = [
  { label: '0.25x', ms: 1200 },
  { label: '0.5x', ms: 800 },
  { label: '1.0x', ms: 450 },
  { label: '1.5x', ms: 300 },
  { label: '2.0x', ms: 180 }
]

export default function SynchronizedEarthExplorer() {
  // 1. User Selections: Location, Dataset, Date Range
  const [selectedLocation, setSelectedLocation] = useState(SYNCHRONIZED_LOCATIONS[0])
  const [selectedDatasetId, setSelectedDatasetId] = useState('temperature')
  const [timelineSequence, setTimelineSequence] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // 2. Synchronized Timeline State (Single source of truth)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackSpeedMs, setPlaybackSpeedMs] = useState(450) // 1.0x default
  const [volume, setVolume] = useState(0.75)
  const [isMuted, setIsMuted] = useState(false)
  const [showExplanation, setShowExplanation] = useState(true)

  // Canvas visualizer refs
  const canvasRef = useRef(null)
  const animFrameRef = useRef(null)
  const syncTimerRef = useRef(null)

  const { playEarcon, announce } = useAccessibility()

  const currentDatasetSpec = SYNCHRONIZED_DATASETS.find(d => d.id === selectedDatasetId) || SYNCHRONIZED_DATASETS[0]

  // ==========================================================================
  // A. FETCH REAL SYNCHRONIZED DATASET FROM SCIENTIFIC ENGINE
  // ==========================================================================
  const loadSynchronizedData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    setIsPlaying(false)
    setCurrentIndex(0)
    if (syncTimerRef.current) clearInterval(syncTimerRef.current)

    try {
      announce(`Loading synchronized ${currentDatasetSpec.name} for ${selectedLocation.name}`)
      const res = await fetchEarthDataProcessingDemo(selectedDatasetId)
      
      let seq = []
      if (res && res.data && Array.isArray(res.data.sonification_sequence)) {
        seq = res.data.sonification_sequence
      } else if (res && res.domains && res.domains[selectedDatasetId]) {
        seq = res.domains[selectedDatasetId].sonification_sequence || []
      }

      if (seq.length > 0) {
        // Stamp location details onto the sequence
        const enhancedSeq = seq.map((item, idx) => ({
          ...item,
          geographic_location: {
            latitude: selectedLocation.lat,
            longitude: selectedLocation.lon,
            region_name: selectedLocation.name,
            country: selectedLocation.country,
            biome: selectedLocation.biome,
          }
        }))

        setTimelineSequence(enhancedSeq)
        earthSonificationEngine.loadSequence(enhancedSeq, selectedDatasetId)
        earthSonificationEngine.seek(0)
        announce(`Synchronized timeline loaded with ${enhancedSeq.length} observations`)
      } else {
        setError('No synchronized observations available for this dataset.')
      }
    } catch (err) {
      setError(`Failed to downlink synchronized observations: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }, [selectedLocation, selectedDatasetId, currentDatasetSpec, announce])

  useEffect(() => {
    loadSynchronizedData()
  }, [loadSynchronizedData])

  // ==========================================================================
  // B. SYNCHRONIZED PLAYBACK SEQUENCER (Audio + Visuals in Lockstep)
  // ==========================================================================
  useEffect(() => {
    if (!isPlaying || !timelineSequence.length) {
      if (syncTimerRef.current) {
        clearInterval(syncTimerRef.current)
        syncTimerRef.current = null
      }
      return
    }

    const total = timelineSequence.length
    syncTimerRef.current = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = (prev + 1) % total
        earthSonificationEngine.seek(next)
        return next
      })
    }, playbackSpeedMs)

    return () => {
      if (syncTimerRef.current) {
        clearInterval(syncTimerRef.current)
        syncTimerRef.current = null
      }
    }
  }, [isPlaying, playbackSpeedMs, timelineSequence])

  // Sync engine volume and speed
  useEffect(() => {
    earthSonificationEngine.setVolume(volume)
    earthSonificationEngine.setMute(isMuted)
  }, [volume, isMuted])

  useEffect(() => {
    earthSonificationEngine.setPlaybackSpeedMs(playbackSpeedMs)
  }, [playbackSpeedMs])

  // ==========================================================================
  // C. LIVE OSCILLOSCOPE WAVEFORM RENDERER
  // ==========================================================================
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const timeBuffer = new Uint8Array(512)

    const render = () => {
      animFrameRef.current = requestAnimationFrame(render)
      const w = canvas.width
      const h = canvas.height

      // Subtle dark telemetry fade
      ctx.fillStyle = 'rgba(4, 8, 22, 0.4)'
      ctx.fillRect(0, 0, w, h)

      // Center baseline
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.15)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(0, h / 2)
      ctx.lineTo(w, h / 2)
      ctx.stroke()

      if (!isPlaying) {
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.3)'
        ctx.beginPath()
        ctx.moveTo(0, h / 2)
        ctx.lineTo(w, h / 2)
        ctx.stroke()
        return
      }

      earthSonificationEngine.getWaveformData(timeBuffer)

      ctx.lineWidth = 2
      ctx.strokeStyle = '#10b981' // Emerald phosphor glow
      ctx.shadowColor = '#10b981'
      ctx.shadowBlur = 8

      ctx.beginPath()
      const sliceWidth = w / 512
      let x = 0

      for (let i = 0; i < 512; i++) {
        const v = timeBuffer[i] / 128.0
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
  }, [isPlaying])

  // ==========================================================================
  // D. TRANSPORT CONTROLS (Play, Pause, Replay, Seek, Step)
  // ==========================================================================
  const handleTogglePlay = async () => {
    if (isPlaying) {
      setIsPlaying(false)
      earthSonificationEngine.pause()
      playEarcon('pause')
      announce('Playback paused')
    } else {
      setIsPlaying(true)
      await earthSonificationEngine.play()
      earthSonificationEngine.seek(currentIndex)
      playEarcon('play')
      announce('Synchronized playback active')
    }
  }

  const handleReplay = async () => {
    setIsPlaying(false)
    setCurrentIndex(0)
    earthSonificationEngine.seek(0)
    await earthSonificationEngine.play()
    setIsPlaying(true)
    playEarcon('play')
    announce('Replaying synchronized observation timeline from beginning')
  }

  const handleSeek = (idx) => {
    const validIdx = Math.max(0, Math.min(timelineSequence.length - 1, idx))
    setCurrentIndex(validIdx)
    earthSonificationEngine.seek(validIdx)
    playEarcon('navigation')
  }

  const handleStep = (delta) => {
    if (!timelineSequence.length) return
    const next = (currentIndex + delta + timelineSequence.length) % timelineSequence.length
    handleSeek(next)
  }

  // Active frame data
  const activeFrame = timelineSequence[currentIndex] || null
  const activeMeasurement = activeFrame?.original_measurement ?? activeFrame?.value ?? null
  const activeDate = activeFrame?.timestamp || '2024-08-01'
  const isMissing = activeFrame?.quality_information?.is_missing ?? false
  const isDry = selectedDatasetId === 'precipitation' && activeMeasurement === 0.0

  // Calculate live acoustic parameters
  const tempPitch = selectedDatasetId === 'temperature' && activeMeasurement !== null
    ? mapTemperatureToPitch(activeMeasurement)
    : null

  const precipRhythm = selectedDatasetId === 'precipitation' && activeMeasurement !== null
    ? mapPrecipitationToAcousticRhythm(activeMeasurement)
    : null

  const windMod = selectedDatasetId === 'wind_speed' && activeMeasurement !== null
    ? mapWindSpeedToModulation(activeMeasurement)
    : null

  const vegTimbre = selectedDatasetId === 'vegetation' && activeMeasurement !== null
    ? mapVegetationToTimbre(activeMeasurement)
    : null

  const oceanDrone = selectedDatasetId === 'ocean_sst' && activeMeasurement !== null
    ? mapOceanToFoundationDrone(activeMeasurement)
    : null

  return (
    <div className="space-y-6">

      {/* Universal Synchronized Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/90 border border-cyan-500/30 backdrop-blur-md shadow-2xl">
        <div className="flex items-center space-x-3.5">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-md shadow-cyan-500/10">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-extrabold text-slate-100 tracking-tight font-mono">
                Synchronized Earth Visualization & Sonification
              </h2>
              <Badge variant="cyan" size="sm">TIMELINE LOCKSTEP</Badge>
              <Badge variant="emerald" size="sm">ZERO MISLEADING NOISE</Badge>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Earth imagery composite, spatial telemetry, and generated audio execute on the exact same underlying timestamp.
            </p>
          </div>
        </div>

        {/* Global Lockstep Status */}
        <div className="flex items-center space-x-3 font-mono text-xs">
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">TIMESTAMP:</span>
            <span className="text-cyan-300 font-bold">{activeDate}</span>
          </div>

          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'}`} />
            <span className="text-slate-300 font-bold">
              {isPlaying ? 'SYNCHRONIZED' : 'PAUSED'}
            </span>
          </div>
        </div>
      </div>

      {/* Selection Control Strip: Location Picker & Dataset Switcher */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
        
        {/* Location Selector */}
        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
          <label className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center space-x-1.5 text-cyan-400 font-bold">
              <MapPin className="w-3.5 h-3.5" />
              <span>SELECT GEOGRAPHIC OBSERVATORY</span>
            </span>
            <span className="text-slate-400">{selectedLocation.lat.toFixed(2)}°, {selectedLocation.lon.toFixed(2)}°</span>
          </label>

          <select
            value={selectedLocation.id}
            onChange={(e) => {
              const loc = SYNCHRONIZED_LOCATIONS.find(l => l.id === e.target.value)
              if (loc) {
                setSelectedLocation(loc)
                playEarcon('tab')
              }
            }}
            className="w-full bg-slate-900 border border-slate-700 hover:border-cyan-400/50 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-400"
          >
            {SYNCHRONIZED_LOCATIONS.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name} ({loc.country}) — {loc.biome}
              </option>
            ))}
          </select>
        </div>

        {/* Dataset Selector */}
        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
          <label className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center space-x-1.5 text-emerald-400 font-bold">
              <Database className="w-3.5 h-3.5" />
              <span>SELECT SCIENTIFIC OBSERVATION DATASET</span>
            </span>
            <span className="text-slate-400">{currentDatasetSpec.unit}</span>
          </label>

          <select
            value={selectedDatasetId}
            onChange={(e) => {
              setSelectedDatasetId(e.target.value)
              playEarcon('tab')
            }}
            className="w-full bg-slate-900 border border-slate-700 hover:border-emerald-400/50 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-400"
          >
            {SYNCHRONIZED_DATASETS.map((ds) => (
              <option key={ds.id} value={ds.id}>
                {ds.name} ({ds.unit}) • {ds.source.split('/')[0]}
              </option>
            ))}
          </select>
        </div>

      </div>

      {/* Main Dual-View Matrix: Earth Visualization (6 cols) + Synchronized Acoustic Telemetry (6 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* Left Column (6 cols): Earth Visualization Viewport & Spatial Imagery */}
        <div className="lg:col-span-6 space-y-4">

          <GlassPanel
            title="Earth Observation Visualization"
            subtitle={`${selectedLocation.name.toUpperCase()} • ${activeDate}`}
            icon={Globe2}
          >
            <div className="space-y-4 font-mono">
              
              {/* Dynamic Satellite Imagery & Spatial Viewport */}
              <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl aspect-video flex items-center justify-center">
                <img
                  src={selectedLocation.imageryUrl}
                  alt={`${selectedLocation.name} satellite composite`}
                  className="w-full h-full object-cover filter brightness-90 contrast-110 transition-all duration-300"
                />

                {/* Overlaid Coordinate HUD Grid */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-slate-950/50 pointer-events-none" />

                {/* Dynamic Radiometric Thermal / Precipitation / Canopy Heatmap Bar */}
                <div className="absolute bottom-3 left-3 right-3 p-3 rounded-xl bg-slate-950/85 border border-slate-800 backdrop-blur-md">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-400 flex items-center space-x-1">
                      <currentDatasetSpec.icon className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{currentDatasetSpec.visualRepresentation}</span>
                    </span>
                    <span className="font-extrabold text-slate-100">
                      {activeMeasurement !== null
                        ? `${Number(activeMeasurement).toFixed(2)} ${currentDatasetSpec.unit}`
                        : <span className="text-rose-400">DATA GAP (NULL)</span>}
                    </span>
                  </div>

                  {/* Radiometric Gauge Level Bar */}
                  <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden flex items-center">
                    {isMissing ? (
                      <div className="w-full h-full bg-rose-500/30 flex items-center justify-center text-[8px] text-rose-300 font-bold">
                        SENSOR DROPOUT / MISSING
                      </div>
                    ) : (
                      <div
                        className={`h-full rounded-full transition-all duration-200 ${
                          isDry
                            ? 'bg-slate-600'
                            : selectedDatasetId === 'temperature'
                            ? 'bg-gradient-to-r from-blue-500 via-amber-400 to-rose-500'
                            : 'bg-gradient-to-r from-cyan-500 to-emerald-400'
                        }`}
                        style={{
                          width: `${Math.min(100, Math.max(8, ((activeMeasurement - currentDatasetSpec.physicalRange[0]) / (currentDatasetSpec.physicalRange[1] - currentDatasetSpec.physicalRange[0])) * 100))}%`
                        }}
                      />
                    )}
                  </div>
                </div>

                {/* Top Overlay Badge */}
                <div className="absolute top-3 left-3 flex items-center space-x-2">
                  <Badge variant="cyan" size="sm">
                    {selectedLocation.biome}
                  </Badge>
                  <span className="text-[10px] text-slate-300 bg-slate-950/80 px-2 py-0.5 rounded-md border border-slate-800 font-bold">
                    FRAME {currentIndex + 1} / {timelineSequence.length || 1}
                  </span>
                </div>

                <div className="absolute top-3 right-3">
                  <Badge variant={isMissing ? "rose" : isDry ? "slate" : "emerald"} size="sm">
                    {isMissing ? "MISSING OBSERVATION" : isDry ? "DRY DAY (0.0 mm)" : "VALID PASS"}
                  </Badge>
                </div>
              </div>

              {/* Geographic Metadata Deck */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1.5">
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-400">OBSERVATORY COORDINATES:</span>
                  <span className="text-cyan-300 font-bold">
                    {selectedLocation.lat > 0 ? `${selectedLocation.lat.toFixed(4)}°N` : `${Math.abs(selectedLocation.lat).toFixed(4)}°S`},{' '}
                    {selectedLocation.lon > 0 ? `${selectedLocation.lon.toFixed(4)}°E` : `${Math.abs(selectedLocation.lon).toFixed(4)}°W`}
                  </span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-400">PROVENANCE / SENSOR:</span>
                  <span className="text-slate-200">{currentDatasetSpec.source}</span>
                </div>
                <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                  {selectedLocation.description}
                </div>
              </div>

            </div>
          </GlassPanel>

        </div>

        {/* Right Column (6 cols): Synchronized Acoustic Telemetry & Waveform HUD */}
        <div className="lg:col-span-6 space-y-4">

          <GlassPanel
            title="Synchronized Acoustic Sonification"
            subtitle={`${currentDatasetSpec.acousticParameter}`}
            icon={Waves}
          >
            <div className="space-y-4 font-mono">
              
              {/* Synchronized Oscilloscope Canvas */}
              <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-inner">
                <canvas
                  ref={canvasRef}
                  width={540}
                  height={130}
                  className="w-full h-32 block"
                />

                <div className="absolute top-2 left-3 flex items-center space-x-2 text-[10px]">
                  <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'}`} />
                  <span className="text-slate-300 font-bold">
                    {isPlaying ? 'SYNTHESIZING SOUND FROM CURRENT FRAME' : 'SYNCHRONIZED AUDITION IDLE'}
                  </span>
                </div>

                <div className="absolute bottom-2 right-3 text-[10px] text-slate-400">
                  <span>LIMITER: -14 dBFS • ANTI-CLICK ADSR</span>
                </div>
              </div>

              {/* 4-Stat Synchronized Telemetry Cards */}
              <div className="grid grid-cols-2 gap-2.5">
                
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase">PHYSICAL OBSERVATION</span>
                  <div className="text-lg font-extrabold text-slate-100 mt-0.5">
                    {activeMeasurement !== null
                      ? `${Number(activeMeasurement).toFixed(2)} ${currentDatasetSpec.unit}`
                      : <span className="text-rose-400">NULL (DATA GAP)</span>}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {isMissing ? 'Muted (Zero Misleading Sound)' : 'Authentic NASA Downlink'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase">ACOUSTIC PITCH (HZ)</span>
                  <div className="text-lg font-extrabold text-emerald-400 mt-0.5">
                    {tempPitch?.frequencyHz
                      ? `${tempPitch.frequencyHz} Hz (#${tempPitch.midiNote})`
                      : activeFrame?.sonification_telemetry?.acoustic_pitch_hz
                      ? `${activeFrame.sonification_telemetry.acoustic_pitch_hz} Hz`
                      : isMissing || isDry
                      ? <span className="text-slate-400">SILENT REST</span>
                      : '220.0 Hz'}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {isDry ? '0.0 mm Dry Day Mute' : isMissing ? 'Data Dropout Silence' : 'Major Pentatonic Scale'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase">SOUND DENSITY / RHYTHM</span>
                  <div className="text-base font-extrabold text-cyan-300 mt-0.5 truncate">
                    {precipRhythm
                      ? precipRhythm.isDry ? '0.0 mm (MUTE)' : `${precipRhythm.dropIntervalMs}ms interval`
                      : windMod
                      ? `${windMod.lfoRateHz} Hz LFO Flutter`
                      : vegTimbre
                      ? `${vegTimbre.harmonicOvertoneCount} Overtones`
                      : oceanDrone
                      ? `${oceanDrone.foundationFreqHz} Hz Swell`
                      : 'Active Envelope'}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Dynamic Parameter Modulation
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase">SYNTHESIS VOICE</span>
                  <div className="text-base font-extrabold text-amber-300 mt-0.5">
                    {SOUND_INSTRUMENTS[earthSonificationEngine.settings.instrument]?.name || 'Planetary Synth'}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Anti-Clipping WaveShaper Active
                  </div>
                </div>

              </div>

              {/* Explanatory Scientific Mapping Note */}
              <div className="p-2.5 rounded-lg bg-cyan-950/20 border border-cyan-800/40 text-[11px] text-slate-300 flex items-start space-x-2">
                <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-bold text-cyan-200">What this sound represents: </span>
                  {MAPPING_SPECIFICATIONS[selectedDatasetId]?.parameterExplanation || currentDatasetSpec.acousticParameter}
                </div>
              </div>

            </div>
          </GlassPanel>

        </div>

      </div>

      {/* Synchronized Timeline & Transport Control Dock */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-cyan-500/20 backdrop-blur-md space-y-3 font-mono">
        
        {/* Timeline Header & Date Highlight */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-cyan-400" />
            <span className="text-slate-400">SYNCHRONIZED TIMELINE:</span>
            <span className="text-base font-extrabold text-cyan-300 bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-800">
              {activeDate}
            </span>
          </div>

          <div className="flex items-center space-x-3 text-slate-400">
            <span>OBSERVATION {currentIndex + 1} OF {timelineSequence.length || 1}</span>
            <span className="text-emerald-400 font-bold">
              ({Math.round(((currentIndex + 1) / Math.max(1, timelineSequence.length)) * 100)}%)
            </span>
          </div>
        </div>

        {/* Scrubber Timeline Bar */}
        <div className="space-y-1.5">
          <div className="relative w-full h-3.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800 flex items-center cursor-pointer">
            <div
              className="h-full bg-cyan-500 rounded-full transition-all duration-150"
              style={{ width: `${((currentIndex + 1) / Math.max(1, timelineSequence.length)) * 100}%` }}
            />
          </div>

          {/* Interactive Date Nodes Strip */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
            {timelineSequence.map((f, idx) => {
              const isCurrent = idx === currentIndex
              const fMissing = f.quality_information?.is_missing
              const fVal = f.original_measurement ?? f.value
              const fDate = f.timestamp ? f.timestamp.slice(5) : `#${idx+1}`

              return (
                <button
                  key={idx}
                  onClick={() => handleSeek(idx)}
                  className={`flex-1 min-w-[48px] py-1 px-1 rounded-lg text-[9px] font-bold border transition-all text-center ${
                    isCurrent
                      ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200 shadow-md shadow-cyan-500/20 ring-1 ring-cyan-400'
                      : fMissing
                      ? 'bg-rose-950/20 border-rose-900/40 text-rose-400 opacity-60'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                  title={`${f.timestamp || 'Frame ' + (idx + 1)}: ${fVal !== null ? fVal + ' ' + currentDatasetSpec.unit : 'Missing Data Gap'}`}
                >
                  <div className="text-[8px] text-slate-500 truncate">{fDate}</div>
                  <div className={fMissing ? 'text-rose-400' : 'text-slate-200'}>
                    {fMissing ? 'GAP' : fVal !== null ? Number(fVal).toFixed(1) : '--'}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Synchronized Transport Actions Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80 text-xs">
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleTogglePlay}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                isPlaying
                  ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                  : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-md shadow-cyan-500/20'
              }`}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isPlaying ? 'PAUSE TIMELINE' : 'PLAY SYNCHRONIZED TIMELINE'}</span>
            </button>

            <button
              onClick={handleReplay}
              className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
              title="Replay Period from Timestamp 0"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-1 pl-1">
              <button
                onClick={() => handleStep(-1)}
                className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
                title="Step Backward (Previous Timestamp)"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleStep(1)}
                className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
                title="Step Forward (Next Timestamp)"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Speed Preset Selector */}
          <div className="flex items-center space-x-2 text-slate-400">
            <span>SPEED:</span>
            {SPEED_PRESETS.map((spd) => (
              <button
                key={spd.label}
                onClick={() => setPlaybackSpeedMs(spd.ms)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                  playbackSpeedMs === spd.ms
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {spd.label}
              </button>
            ))}
          </div>

          {/* Volume & Mute */}
          <div className="flex items-center space-x-2 pl-2">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="text-slate-400 hover:text-white"
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
              className="w-20 accent-cyan-400 cursor-pointer"
              title={`Volume: ${Math.round(volume * 100)}%`}
            />
            <span className="text-[10px] text-slate-400 w-8">
              {isMuted ? 'MUTE' : `${Math.round(volume * 100)}%`}
            </span>
          </div>

        </div>

      </div>

    </div>
  )
}
