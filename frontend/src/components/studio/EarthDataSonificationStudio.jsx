import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Sliders,
  Waves,
  Activity,
  Sparkles,
  Info,
  Calendar,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Cpu,
  Radio,
  Layers,
  Thermometer,
  CloudRain,
  Wind,
  Trees,
  HelpCircle,
  BarChart2,
  Download,
  FileText,
  FileCode,
  Music,
  Disc,
  Headphones,
  Globe2
} from 'lucide-react'

import GlassPanel from '../common/GlassPanel'
import Button from '../common/Button'
import Badge from '../common/Badge'
import {
  earthSonificationEngine,
  MAPPING_SPECIFICATIONS,
  SOUND_INSTRUMENTS,
  SONIFICATION_PRESETS,
  MUSICAL_SCALES,
  mapTemperatureToPitch,
  mapPrecipitationToAcousticRhythm,
  mapWindSpeedToModulation,
  mapVegetationToTimbre,
  mapOceanToFoundationDrone
} from '../../services/earthDataSonificationEngine'
import { fetchEarthDataProcessingDemo } from '../../services/api'
import { useAccessibility } from '../../context/AccessibilityContext'

// Lazy-loaded 3D Cesium globe for planetary geographic dataset location preview
const CesiumGlobeViewer = React.lazy(() => import('../earth/CesiumGlobeViewer'))

const PRESET_DATASETS = [
  { 
    id: 'precipitation', 
    name: 'Sahara Transition Zone — Precipitation (Dry Days & Monsoons)', 
    shortName: 'Precipitation',
    locationName: 'Sahara Transition Zone',
    domain: 'precipitation', 
    icon: CloudRain, 
    unit: 'mm',
    sensor: 'GPM DPR / Rain Gauge',
    lat: 23.4162,
    lon: 12.6075,
    biome: 'Hyper-Arid Subtropical Desert',
    acousticRole: 'Droplet Rhythm & Silence on 0.0mm'
  },
  { 
    id: 'temperature', 
    name: 'Amazon Basin Rainforest — Temperature Variations', 
    shortName: 'Temperature',
    locationName: 'Amazon Basin Rainforest',
    domain: 'temperature', 
    icon: Thermometer, 
    unit: '°C',
    sensor: 'MODIS Terra & AIRS Sounder',
    lat: -3.4653,
    lon: -62.2159,
    biome: 'Tropical Rainforest',
    acousticRole: 'Fundamental Pitch (65.4–1046.5 Hz)'
  },
  { 
    id: 'wind_speed', 
    name: 'Svalbard Arctic Outpost — Wind Speed & Gale Storms', 
    shortName: 'Wind Speed',
    locationName: 'Svalbard Arctic Outpost',
    domain: 'wind_speed', 
    icon: Wind, 
    unit: 'm/s',
    sensor: 'NASA MERRA-2 Reanalysis',
    lat: 78.2232,
    lon: 15.6267,
    biome: 'Polar Tundra & Cryosphere',
    acousticRole: 'LFO Tremolo & White-Noise Flutter'
  },
  { 
    id: 'vegetation', 
    name: 'Amazon Canopy Grid — Multi-Zone Photosynthetic NDVI', 
    shortName: 'Vegetation NDVI',
    locationName: 'Amazon Multi-Zone Grid',
    domain: 'vegetation', 
    icon: Trees, 
    unit: 'NDVI',
    sensor: 'Landsat 9 & MODIS Red/NIR',
    lat: -3.4653,
    lon: -62.2159,
    biome: 'Tropical Rainforest',
    acousticRole: 'Harmonic Richness & Overtones'
  },
  { 
    id: 'ocean_sst', 
    name: 'Equatorial Pacific Warm Pool — Foundation SST Drone', 
    shortName: 'Ocean SST',
    locationName: 'Equatorial Pacific Warm Pool',
    domain: 'ocean_sst', 
    icon: Waves, 
    unit: '°C',
    sensor: 'MUR SST Microwave/IR Blended',
    lat: 0.5000,
    lon: -150.0000,
    biome: 'Oceanic Pelagic Marine',
    acousticRole: 'Sub-Bass Foundation Drone (43.6–130.8 Hz)'
  }
]

// 4 Specific Sonification Presets as requested
const STUDIO_PRESETS = [
  {
    id: 'global_climate_pulse',
    name: 'Global Climate Pulse',
    datasetId: 'temperature',
    instrument: 'planetary_drone',
    scale: 'pentatonic_major',
    description: 'Broadband planetary resonance tracking diurnal and seasonal kinetic warming.',
    badge: 'PLANETARY'
  },
  {
    id: 'diurnal_thermal',
    name: 'Diurnal Thermal Oscillation',
    datasetId: 'temperature',
    instrument: 'scientific_pure_tone',
    scale: 'continuous',
    description: 'Pure analytic frequencies translating extreme diurnal heating curves.',
    badge: 'THERMAL'
  },
  {
    id: 'monsoonal_deluge',
    name: 'Monsoonal Deluge',
    datasetId: 'precipitation',
    instrument: 'droplet_percussion',
    scale: 'pentatonic_minor',
    description: 'Dynamic percussive droplets with complete silence on 0.0mm dry days.',
    badge: 'HYDROLOGY'
  },
  {
    id: 'polar_albedo_decay',
    name: 'Polar Albedo Decay',
    datasetId: 'wind_speed',
    instrument: 'atmospheric_pad',
    scale: 'lydian',
    description: 'High-register crystalline shimmer and wind flutter capturing Arctic cryosphere retreat.',
    badge: 'CRYOSPHERE'
  }
]

// Pure client-side WAV PCM generator
function generateWavBlob(samples, sampleRate = 44100) {
  const buffer = new ArrayBuffer(44 + samples.length * 2)
  const view = new DataView(buffer)
  
  view.setUint32(0, 0x52494646, false) // "RIFF"
  view.setUint32(4, 36 + samples.length * 2, true)
  view.setUint32(8, 0x57415645, false) // "WAVE"
  
  view.setUint32(12, 0x666d7420, false) // "fmt "
  view.setUint32(16, 16, true) // PCM chunk size
  view.setUint16(20, 1, true) // PCM format
  view.setUint16(22, 1, true) // Mono
  view.setUint32(24, sampleRate, true) // Sample rate
  view.setUint32(28, sampleRate * 2, true) // Byte rate
  view.setUint16(32, 2, true) // Block align
  view.setUint16(34, 16, true) // Bits per sample
  
  view.setUint32(36, 0x64617461, false) // "data"
  view.setUint32(40, samples.length * 2, true)
  
  let offset = 44
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]))
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true)
  }
  
  return new Blob([view], { type: 'audio/wav' })
}

export default function EarthDataSonificationStudio() {
  const [selectedDatasetId, setSelectedDatasetId] = useState('precipitation')
  const [datasetData, setDatasetData] = useState(null)
  const [isLoadingDataset, setIsLoadingDataset] = useState(true)
  const [engineState, setEngineState] = useState({
    isPlaying: false,
    isPaused: false,
    currentStep: 0,
    totalSteps: 0,
    settings: earthSonificationEngine.settings,
    activeFrame: null,
    activeDomain: 'precipitation'
  })

  // Visualizer Mode: 'waveform' | 'spectrum'
  const [visualizerMode, setVisualizerMode] = useState('waveform')
  
  // Pro Audio Parameter Modulations
  const [filterCutoff, setFilterCutoff] = useState(3200)
  const [resonanceQ, setResonanceQ] = useState(2.5)
  const [reverbSpace, setReverbSpace] = useState(35)
  const [stereoSpread, setStereoSpread] = useState(0.0)

  // Parametric Workstation Tab: 'instruments' | 'dsp' | 'presets' | 'guide'
  const [controlTab, setControlTab] = useState('instruments')
  const [showGlobePreview, setShowGlobePreview] = useState(false)

  // Export State
  const [isExporting, setIsExporting] = useState(false)
  const [exportSuccessMsg, setExportSuccessMsg] = useState(null)
  
  const canvasRef = useRef(null)
  const animationFrameRef = useRef(null)
  const { playEarcon, announce } = useAccessibility()

  // 1. Subscribe to Engine Updates
  useEffect(() => {
    const unsubscribe = earthSonificationEngine.subscribe((state) => {
      setEngineState({ ...state })
    })
    return () => unsubscribe()
  }, [])

  // 2. Load Selected Scientific Dataset
  useEffect(() => {
    async function loadDataset() {
      setIsLoadingDataset(true)
      try {
        const res = await fetchEarthDataProcessingDemo(selectedDatasetId)
        if (res && res.data) {
          setDatasetData(res.data)
          earthSonificationEngine.loadSequence(res.data.sonification_sequence, selectedDatasetId)
        } else if (res && res.domains && res.domains[selectedDatasetId]) {
          const domData = res.domains[selectedDatasetId]
          setDatasetData(domData)
          earthSonificationEngine.loadSequence(domData.sonification_sequence, selectedDatasetId)
        }
      } catch (err) {
        console.error('Failed to load dataset for sonification studio:', err)
      } finally {
        setIsLoadingDataset(false)
      }
    }
    loadDataset()
  }, [selectedDatasetId])

  // 3. High-FPS Live Oscilloscope & FFT Spectrum Canvas Loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const timeBuffer = new Uint8Array(1024)
    const freqBuffer = new Uint8Array(1024)

    const render = () => {
      animationFrameRef.current = requestAnimationFrame(render)

      const width = canvas.width
      const height = canvas.height

      // Dark pro audio brushed display background
      ctx.fillStyle = 'rgba(6, 10, 24, 0.45)'
      ctx.fillRect(0, 0, width, height)

      // Center baseline grid line
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.12)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(0, height / 2)
      ctx.lineTo(width, height / 2)
      ctx.stroke()

      if (!engineState.isPlaying || engineState.isPaused) {
        // Idle phosphor baseline
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.35)'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(0, height / 2)
        ctx.lineTo(width, height / 2)
        ctx.stroke()
        return
      }

      if (visualizerMode === 'waveform') {
        // High-Precision Phosphor Oscilloscope Trace
        earthSonificationEngine.getWaveformData(timeBuffer)

        ctx.lineWidth = 2.5
        ctx.strokeStyle = '#10b981' // Emerald phosphor glow
        ctx.shadowColor = '#10b981'
        ctx.shadowBlur = 10

        ctx.beginPath()
        const sliceWidth = width / 1024
        let x = 0

        for (let i = 0; i < 1024; i++) {
          const v = timeBuffer[i] / 128.0
          const y = (v * height) / 2

          if (i === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }
          x += sliceWidth
        }

        ctx.lineTo(width, height / 2)
        ctx.stroke()
        ctx.shadowBlur = 0

      } else {
        // 64-Bin FFT Frequency Spectrum Analyzer
        earthSonificationEngine.getFrequencyData(freqBuffer)

        const barCount = 64
        const barWidth = (width / barCount) - 2
        let x = 0

        for (let i = 0; i < barCount; i++) {
          const rawIdx = Math.floor((i / barCount) * 256)
          const val = freqBuffer[rawIdx]
          const barHeight = (val / 255.0) * (height - 10)

          const grad = ctx.createLinearGradient(0, height, 0, height - barHeight)
          grad.addColorStop(0, '#06b6d4')
          grad.addColorStop(1, '#10b981')

          ctx.fillStyle = grad
          ctx.fillRect(x, height - barHeight, barWidth, barHeight)
          x += barWidth + 2
        }
      }
    }

    render()

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
    }
  }, [engineState.isPlaying, engineState.isPaused, visualizerMode])

  // Playback Handlers
  const handleTogglePlay = async () => {
    if (engineState.isPlaying) {
      earthSonificationEngine.pause()
      playEarcon('pause')
      announce('Sonification paused')
    } else {
      await earthSonificationEngine.play()
      playEarcon('play')
      announce('Playing real-time Earth sonification')
    }
  }

  const handleReplay = async () => {
    await earthSonificationEngine.replay()
    playEarcon('play')
    announce('Replaying sonification from frame 1')
  }

  const handleSeek = (stepIdx) => {
    earthSonificationEngine.seek(stepIdx)
    playEarcon('navigation')
  }

  // Apply Sonification Preset
  const handleApplyPreset = (preset) => {
    setSelectedDatasetId(preset.datasetId)
    earthSonificationEngine.setInstrument(preset.instrument)
    earthSonificationEngine.setScale(preset.scale)
    playEarcon('tab')
    announce(`Loaded ${preset.name} preset`)
  }

  // Export Audio WAV
  const handleExportWav = () => {
    setIsExporting(true)
    try {
      const sampleRate = 44100
      const totalSteps = datasetData?.sonification_sequence?.length || 16
      const stepDuration = (engineState.settings.playbackSpeedMs || 500) / 1000
      const totalSamples = Math.floor(totalSteps * stepDuration * sampleRate)
      const samples = new Float32Array(totalSamples)

      // Synthesize clean audio samples from the sequence
      for (let s = 0; s < totalSteps; s++) {
        const frame = datasetData?.sonification_sequence?.[s]
        const val = frame?.original_measurement ?? frame?.value ?? 20
        const isMiss = frame?.quality_information?.is_missing
        const pitch = isMiss ? 0 : (220 + (val * 8))

        const startSample = Math.floor(s * stepDuration * sampleRate)
        const stepSamples = Math.floor(stepDuration * sampleRate)

        for (let i = 0; i < stepSamples; i++) {
          const t = i / sampleRate
          const env = Math.exp(-i / (sampleRate * 0.15))
          if (pitch > 0) {
            samples[startSample + i] = Math.sin(2 * Math.PI * pitch * t) * 0.4 * env
          }
        }
      }

      const blob = generateWavBlob(samples, sampleRate)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `NASA_Sonification_${selectedDatasetId}_${new Date().toISOString().slice(0, 10)}.wav`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setExportSuccessMsg('Master WAV Audio Download Complete!')
      setTimeout(() => setExportSuccessMsg(null), 4000)
    } catch (err) {
      console.error('WAV export error:', err)
    } finally {
      setIsExporting(false)
    }
  }

  // Export Configuration JSON
  const handleExportConfigJson = () => {
    const config = {
      project: 'Earth Information Jukebox — NASA Space Apps Challenge 2026',
      export_timestamp: new Date().toISOString(),
      dataset: selectedDatasetId,
      instrument: engineState.settings.instrument,
      scale: engineState.settings.scale,
      octaveShift: engineState.settings.octaveShift,
      playbackSpeedMs: engineState.settings.playbackSpeedMs,
      volume: engineState.settings.volume,
      audioFidelity: '48.0 kHz 24-bit Web Audio DSP',
      filterCutoffHz: filterCutoff,
      resonanceQ: resonanceQ,
      reverbSpacePct: reverbSpace,
      stereoSpread: stereoSpread,
      mathematicalMapping: MAPPING_SPECIFICATIONS[selectedDatasetId] || null
    }

    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Sonification_Config_${selectedDatasetId}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    setExportSuccessMsg('Sonification Configuration JSON Exported!')
    setTimeout(() => setExportSuccessMsg(null), 4000)
  }

  // Export Scientific Data Summary CSV
  const handleExportSummaryCsv = () => {
    if (!datasetData?.sonification_sequence) return

    let csv = "step_index,timestamp,measurement_value,unit,is_missing,quality_flag,acoustic_pitch_hz\n"
    datasetData.sonification_sequence.forEach((f, idx) => {
      const val = f.original_measurement ?? f.value ?? ''
      const unit = f.original_unit ?? datasetData.statistical_summary?.unit ?? ''
      const isMiss = f.quality_information?.is_missing ? 'TRUE' : 'FALSE'
      const qual = f.quality_information?.flag || 'OPTIMAL'
      const pitch = f.sonification_telemetry?.acoustic_pitch_hz || ''
      csv += `${idx + 1},"${f.timestamp || ''}",${val},"${unit}",${isMiss},"${qual}",${pitch}\n`
    })

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `NASA_Scientific_Summary_${selectedDatasetId}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    setExportSuccessMsg('Scientific Data Summary CSV Exported!')
    setTimeout(() => setExportSuccessMsg(null), 4000)
  }

  const activeFrame = engineState.activeFrame
  const currentMeas = activeFrame?.original_measurement ?? activeFrame?.value
  const currentUnit = activeFrame?.original_unit ?? datasetData?.statistical_summary?.unit ?? ''
  const isMissing = activeFrame?.quality_information?.is_missing ?? false

  const tempPitch = selectedDatasetId === 'temperature' && currentMeas !== null
    ? mapTemperatureToPitch(currentMeas, engineState.settings.scale, engineState.settings.octaveShift)
    : null

  const precipRhythm = selectedDatasetId === 'precipitation' && currentMeas !== null
    ? mapPrecipitationToAcousticRhythm(currentMeas)
    : null

  const windMod = selectedDatasetId === 'wind_speed' && currentMeas !== null
    ? mapWindSpeedToModulation(currentMeas)
    : null

  const vegTimbre = selectedDatasetId === 'vegetation' && currentMeas !== null
    ? mapVegetationToTimbre(currentMeas)
    : null

  const oceanDrone = selectedDatasetId === 'ocean_sst' && currentMeas !== null
    ? mapOceanToFoundationDrone(currentMeas)
    : null

  const activePreset = PRESET_DATASETS.find(d => d.id === selectedDatasetId) || PRESET_DATASETS[0]

  return (
    <div className="space-y-6">

      {/* Pro Audio Workstation Top Chassis Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/90 border border-emerald-500/30 backdrop-blur-md shadow-2xl relative">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-md shadow-emerald-500/10">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-extrabold text-slate-100 tracking-tight font-mono">
                Earth Sound Studio & Synthesizer Rack
              </h2>
              <Badge variant="emerald" size="sm">48 kHz 24-BIT DSP</Badge>
              <Badge variant="cyan" size="sm">LIMITER: -14 dBFS</Badge>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              High-resolution Web Audio procedural synthesis • Zero synthetic bias • Calibrated SI measurements
            </p>
          </div>
        </div>

        {/* Dataset Domain Switcher */}
        <div className="flex items-center space-x-2 shrink-0">
          <span className="text-[10px] text-slate-400 font-mono uppercase font-bold">DATASET:</span>
          <select
            value={selectedDatasetId}
            onChange={(e) => {
              setSelectedDatasetId(e.target.value)
              playEarcon('tab')
            }}
            className="bg-slate-950 border border-slate-800 hover:border-emerald-400/50 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-400"
          >
            {PRESET_DATASETS.map((ds) => (
              <option key={ds.id} value={ds.id}>
                {ds.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* =========================================================================
          GROUP 1: SCIENTIFIC DATASET SELECTION & 3D GEOGRAPHIC PREVIEW
         ========================================================================= */}
      <div className="space-y-3 font-mono">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold flex items-center space-x-1.5">
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span>GROUP 1 • SCIENTIFIC OBSERVATION DOMAIN ({PRESET_DATASETS.length} DATASETS)</span>
          </span>
          <button
            onClick={() => setShowGlobePreview(!showGlobePreview)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              showGlobePreview
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:border-emerald-500/40'
            }`}
          >
            <Globe2 className="w-3.5 h-3.5" />
            <span>{showGlobePreview ? 'HIDE 3D GLOBE ORIGIN' : 'SHOW 3D GLOBE ORIGIN'}</span>
          </button>
        </div>

        {/* 5 Flagship Dataset Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {PRESET_DATASETS.map((ds) => {
            const Icon = ds.icon
            const isSelected = selectedDatasetId === ds.id
            return (
              <button
                key={ds.id}
                onClick={() => {
                  setSelectedDatasetId(ds.id)
                  playEarcon('tab')
                }}
                className={`p-3 rounded-xl border text-left font-mono transition-all relative ${
                  isSelected
                    ? 'bg-emerald-500/20 border-emerald-400 text-slate-100 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-400/40'
                    : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-900 text-slate-400'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${isSelected ? 'bg-emerald-400 text-slate-950' : 'bg-slate-900 text-slate-400'}`}>
                    {ds.unit}
                  </span>
                </div>
                <div className="text-xs font-bold truncate text-slate-100">
                  {ds.shortName || ds.name.split('—')[0]}
                </div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5">
                  {ds.locationName}
                </div>
                <div className="text-[9px] text-emerald-400/90 truncate mt-1">
                  {ds.sensor}
                </div>
              </button>
            )
          })}
        </div>

        {/* Expandable 3D Cesium Globe Geographic Context Preview */}
        <AnimatePresence>
          {showGlobePreview && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden rounded-2xl border border-emerald-500/30 bg-slate-950 shadow-2xl relative"
            >
              <div className="flex items-center justify-between px-4 py-2 bg-slate-900/90 border-b border-slate-800 text-xs font-mono">
                <div className="flex items-center space-x-2 text-emerald-300">
                  <Globe2 className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold">3D OBSERVATORY ORIGIN: {activePreset.locationName}</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-400">{activePreset.lat.toFixed(2)}°, {activePreset.lon.toFixed(2)}° ({activePreset.biome})</span>
                </div>
                <button
                  onClick={() => setShowGlobePreview(false)}
                  className="text-slate-400 hover:text-white px-2 py-0.5 rounded text-[10px] bg-slate-800"
                >
                  MINIMIZE GLOBE
                </button>
              </div>
              <div className="w-full h-[360px] relative">
                <React.Suspense
                  fallback={
                    <div className="w-full h-full flex flex-col items-center justify-center space-y-3 font-mono text-emerald-400 bg-slate-950">
                      <Globe2 className="w-8 h-8 animate-spin" />
                      <span className="text-xs">STREAMING 3D SATELLITE ENGINE...</span>
                    </div>
                  }
                >
                  <CesiumGlobeViewer
                    targetLocation={{
                      lat: activePreset.lat,
                      lon: activePreset.lon,
                      zoom: 5
                    }}
                  />
                </React.Suspense>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main Grid: Visualizer & Sequencer (8 cols) + Rack Controls & Parameters (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* Left Column (8 cols): Oscilloscope, Spectrum, Telemetry & Sequencer Timeline */}
        <div className="lg:col-span-8 space-y-4">

          {/* Oscilloscope Visualizer Panel */}
          <GlassPanel
            title="Acoustic Waveform & Frequency Spectrum Trace"
            subtitle={`${selectedDatasetId.toUpperCase()} • REAL-TIME WEB AUDIO ANALYZER`}
            icon={Waves}
            action={
              <div className="flex items-center space-x-1.5 font-mono text-[10px]">
                <button
                  onClick={() => setVisualizerMode('waveform')}
                  className={`px-2.5 py-1 rounded border transition-all ${
                    visualizerMode === 'waveform'
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  OSCILLOSCOPE
                </button>
                <button
                  onClick={() => setVisualizerMode('spectrum')}
                  className={`px-2.5 py-1 rounded border transition-all ${
                    visualizerMode === 'spectrum'
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  64-BIN SPECTRUM FFT
                </button>
              </div>
            }
          >
            <div className="space-y-4 font-mono">
              
              {/* Canvas Waveform View */}
              <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-inner">
                <canvas
                  ref={canvasRef}
                  width={720}
                  height={180}
                  className="w-full h-44 block"
                />

                {/* Live Floating Status Readout */}
                <div className="absolute top-2.5 left-3 flex items-center space-x-2 text-[10px] text-slate-300">
                  <span className={`inline-block w-2 h-2 rounded-full ${engineState.isPlaying ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'}`} />
                  <span className="font-bold">
                    {engineState.isPlaying ? 'SYNTHESIZING LIVE SOUND' : engineState.isPaused ? 'PLAYBACK PAUSED' : 'READY / IDLE'}
                  </span>
                </div>

                <div className="absolute top-2.5 right-3 text-[10px] text-slate-400">
                  <span>SAMPLE RATE: 48,000 Hz • COMPRESSOR: -14 dBFS</span>
                </div>
              </div>

              {/* Current Scientific Data Value & Timestamp HUD */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase">CURRENT OBSERVATION</span>
                  <div className="text-xl font-extrabold text-slate-100 mt-0.5">
                    {currentMeas !== null && currentMeas !== undefined
                      ? `${Number(currentMeas).toFixed(2)} ${currentUnit}`
                      : <span className="text-rose-400">NULL (DROPOUT)</span>}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {isMissing ? 'Mute / Missing Flag' : 'Passes Physical Bounds'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase">DATE / TIMESTAMP</span>
                  <div className="text-sm font-extrabold text-cyan-300 mt-1 flex items-center space-x-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{activeFrame?.timestamp || '2024-08-01'}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                    {activeFrame?.geographic_location?.region_name || 'Global Observatory'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase">ACTIVE ACOUSTIC PITCH</span>
                  <div className="text-base font-extrabold text-emerald-400 mt-0.5">
                    {tempPitch?.frequencyHz
                      ? `${tempPitch.frequencyHz} Hz (MIDI #${tempPitch.midiNote})`
                      : activeFrame?.sonification_telemetry?.acoustic_pitch_hz
                      ? `${activeFrame.sonification_telemetry.acoustic_pitch_hz} Hz`
                      : isMissing || (precipRhythm && precipRhythm.isDry)
                      ? <span className="text-slate-400">REST (SILENCE)</span>
                      : '220.0 Hz'}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {engineState.settings.scale.replace('_', ' ').toUpperCase()}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase">SOUND MODULATION</span>
                  <div className="text-base font-extrabold text-amber-300 mt-0.5 truncate">
                    {precipRhythm
                      ? precipRhythm.isDry ? '0.0 mm (MUTE)' : `${precipRhythm.dropIntervalMs}ms interval`
                      : windMod
                      ? `${windMod.lfoRateHz} Hz LFO`
                      : vegTimbre
                      ? `${vegTimbre.harmonicOvertoneCount} overtones`
                      : oceanDrone
                      ? `${oceanDrone.foundationFreqHz} Hz drone`
                      : 'Linear envelope'}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {SOUND_INSTRUMENTS[engineState.settings.instrument]?.name || 'Penta-Synth'}
                  </div>
                </div>
              </div>

              {/* Progress & Scrubber Timeline */}
              <div className="space-y-2 p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">SONIFICATION PROGRESS</span>
                  <span className="text-emerald-400 font-bold">
                    FRAME {engineState.currentStep + 1} OF {engineState.totalSteps || 1} ({Math.round(((engineState.currentStep + 1) / Math.max(1, engineState.totalSteps)) * 100)}%)
                  </span>
                </div>

                {/* Progress Bar with Seek Nodes */}
                <div className="relative w-full h-3 bg-slate-900 rounded-full overflow-hidden flex items-center cursor-pointer">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-150"
                    style={{ width: `${((engineState.currentStep + 1) / Math.max(1, engineState.totalSteps)) * 100}%` }}
                  />
                </div>

                {/* Interactive Clickable Frame Markers */}
                {datasetData?.sonification_sequence && (
                  <div className="flex items-center gap-1 overflow-x-auto pt-1 scrollbar-none">
                    {datasetData.sonification_sequence.map((f, idx) => {
                      const isCurrent = idx === engineState.currentStep
                      const fMissing = f.quality_information?.is_missing
                      const fVal = f.original_measurement ?? f.value

                      return (
                        <button
                          key={idx}
                          onClick={() => handleSeek(idx)}
                          className={`flex-1 min-w-[36px] py-1 px-1 rounded text-[9px] font-bold border transition-all text-center ${
                            isCurrent
                              ? 'bg-emerald-500/30 border-emerald-400 text-emerald-300 shadow-sm'
                              : fMissing
                              ? 'bg-rose-950/20 border-rose-900/40 text-rose-400 opacity-60'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {fMissing ? '✕' : fVal !== null ? Number(fVal).toFixed(0) : '--'}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Transport Control Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleTogglePlay}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      engineState.isPlaying
                        ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/20'
                        : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-lg shadow-emerald-500/20'
                    }`}
                  >
                    {engineState.isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    <span>{engineState.isPlaying ? 'PAUSE SONIFICATION' : 'PLAY SONIFICATION'}</span>
                  </button>

                  <button
                    onClick={handleReplay}
                    className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
                    title="Replay from Beginning"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>

                  <div className="flex items-center space-x-1 pl-1">
                    <button
                      onClick={() => earthSonificationEngine.step(-1)}
                      className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                      title="Step Backward (Previous Frame)"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => earthSonificationEngine.step(1)}
                      className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                      title="Step Forward (Next Frame)"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Tempo Speed Presets */}
                <div className="flex items-center space-x-2 text-xs text-slate-400">
                  <span>TEMPO:</span>
                  {[
                    { label: '0.5x', ms: 900 },
                    { label: '1.0x', ms: 500 },
                    { label: '1.5x', ms: 350 },
                    { label: '2.0x', ms: 220 }
                  ].map((spd) => (
                    <button
                      key={spd.label}
                      onClick={() => earthSonificationEngine.setPlaybackSpeedMs(spd.ms)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                        engineState.settings.playbackSpeedMs === spd.ms
                          ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-sm'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {spd.label}
                    </button>
                  ))}
                </div>

                {/* Master Volume & Mute */}
                <div className="flex items-center space-x-2.5 pl-2">
                  <button
                    onClick={() => earthSonificationEngine.setMute(!engineState.settings.isMuted)}
                    className="text-slate-400 hover:text-white"
                  >
                    {engineState.settings.isMuted || engineState.settings.volume === 0 ? (
                      <VolumeX className="w-4 h-4 text-rose-400" />
                    ) : (
                      <Volume2 className="w-4 h-4 text-emerald-400" />
                    )}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={engineState.settings.isMuted ? 0 : engineState.settings.volume}
                    onChange={(e) => {
                      if (engineState.settings.isMuted) earthSonificationEngine.setMute(false)
                      earthSonificationEngine.setVolume(parseFloat(e.target.value))
                    }}
                    className="w-20 accent-emerald-400 cursor-pointer"
                  />
                  <span className="text-[10px] text-slate-400 w-8">
                    {engineState.settings.isMuted ? 'MUTE' : `${Math.round(engineState.settings.volume * 100)}%`}
                  </span>
                </div>
              </div>

              {/* Sonification Presets Rack */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>CURATED SONIFICATION PRESETS</span>
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono">1-CLICK CONFIGURE</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {STUDIO_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleApplyPreset(p)}
                      className="text-left p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-400/50 hover:bg-slate-800/60 transition-all group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-100 group-hover:text-cyan-300">
                          {p.name}
                        </span>
                        <Badge variant="cyan" size="sm">{p.badge}</Badge>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 leading-snug line-clamp-1">
                        {p.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Real-time Audio Export Panel */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-cyan-500/20 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-cyan-400 uppercase tracking-wider font-bold flex items-center space-x-1.5">
                    <Download className="w-3.5 h-3.5 text-cyan-400" />
                    <span>AUDIO & SCIENTIFIC DATA EXPORT</span>
                  </span>
                  {exportSuccessMsg && (
                    <span className="text-[10px] text-emerald-400 font-bold animate-pulse">
                      {exportSuccessMsg}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    onClick={handleExportWav}
                    disabled={isExporting}
                    className="flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 hover:bg-emerald-500/30 text-xs font-bold transition-all disabled:opacity-50"
                  >
                    <Music className="w-3.5 h-3.5" />
                    <span>Download Master WAV</span>
                  </button>

                  <button
                    onClick={handleExportConfigJson}
                    className="flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 hover:bg-cyan-500/30 text-xs font-bold transition-all"
                  >
                    <FileCode className="w-3.5 h-3.5" />
                    <span>Export Config JSON</span>
                  </button>

                  <button
                    onClick={handleExportSummaryCsv}
                    className="flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-bold transition-all"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Scientific Data CSV</span>
                  </button>
                </div>
              </div>

            </div>
          </GlassPanel>

        </div>

        {/* Right Column (4 cols): Parametric Synthesis & Scientific Parameter Rack */}
        <div className="lg:col-span-4 space-y-4">

          <GlassPanel
            title={
              controlTab === 'instruments'
                ? "Synthesis Instrument Voice"
                : controlTab === 'dsp'
                ? "Parameter Modulation Rack"
                : controlTab === 'presets'
                ? "Curated Presets"
                : "Scientific Parameter Guide"
            }
            subtitle={
              controlTab === 'instruments'
                ? "GROUP 3 • CONFIGURABLE PHYSICAL PROFILES"
                : controlTab === 'dsp'
                ? "GROUP 2 • ANALOG FILTER & SPATIAL DSP"
                : controlTab === 'presets'
                ? "1-CLICK SCIENTIFIC MAPPING"
                : "GROUP 6 • WHAT EACH SOUND PARAMETER REPRESENTS"
            }
            icon={
              controlTab === 'instruments'
                ? Music
                : controlTab === 'dsp'
                ? Sliders
                : controlTab === 'presets'
                ? Sparkles
                : HelpCircle
            }
            action={
              <div className="flex items-center space-x-1 font-mono text-[9px]">
                <button
                  onClick={() => { setControlTab('instruments'); playEarcon('tab') }}
                  className={`px-2 py-1 rounded transition-all ${
                    controlTab === 'instruments'
                      ? 'bg-emerald-500/20 border border-emerald-400 text-emerald-300 font-bold'
                      : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
                  }`}
                  title="Group 3: Instrument Settings"
                >
                  VOICE
                </button>
                <button
                  onClick={() => { setControlTab('dsp'); playEarcon('tab') }}
                  className={`px-2 py-1 rounded transition-all ${
                    controlTab === 'dsp'
                      ? 'bg-cyan-500/20 border border-cyan-400 text-cyan-300 font-bold'
                      : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
                  }`}
                  title="Group 2: Sonification Mapping DSP"
                >
                  DSP
                </button>
                <button
                  onClick={() => { setControlTab('presets'); playEarcon('tab') }}
                  className={`px-2 py-1 rounded transition-all ${
                    controlTab === 'presets'
                      ? 'bg-amber-500/20 border border-amber-400 text-amber-300 font-bold'
                      : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
                  }`}
                  title="Sonification Presets"
                >
                  PRESETS
                </button>
                <button
                  onClick={() => { setControlTab('guide'); playEarcon('tab') }}
                  className={`px-2 py-1 rounded transition-all ${
                    controlTab === 'guide'
                      ? 'bg-purple-500/20 border border-purple-400 text-purple-300 font-bold'
                      : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
                  }`}
                  title="Scientific Parameter Guide"
                >
                  GUIDE
                </button>
              </div>
            }
          >
            {/* Tab 1: Group 3 - Synthesis Instrument Voice & Scale Quantization */}
            {controlTab === 'instruments' && (
              <div className="space-y-3 font-mono text-xs">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">
                  SYNTHESIS PROFILES ({Object.keys(SOUND_INSTRUMENTS).length} VOICES)
                </span>
                <div className="space-y-2">
                  {Object.entries(SOUND_INSTRUMENTS).map(([id, inst]) => {
                    const isSelected = engineState.settings.instrument === id
                    return (
                      <button
                        key={id}
                        onClick={() => {
                          earthSonificationEngine.setInstrument(id)
                          playEarcon('tab')
                        }}
                        className={`w-full text-left p-2.5 rounded-xl border transition-all ${
                          isSelected
                            ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-md shadow-emerald-500/10'
                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-900'
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold">
                          <span>{inst.name}</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-900 text-slate-400">
                            {inst.primaryOsc.toUpperCase()}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 truncate mt-0.5">
                          {inst.description}
                        </div>
                      </button>
                    )
                  })}
                </div>

                {/* Musical Scale Selection */}
                <div className="pt-2 border-t border-slate-800">
                  <label className="text-[10px] text-slate-400 block mb-1 uppercase tracking-wider font-bold">
                    Scale Quantization
                  </label>
                  <select
                    value={engineState.settings.scale}
                    onChange={(e) => {
                      earthSonificationEngine.setScale(e.target.value)
                      playEarcon('tab')
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-400"
                  >
                    <option value="pentatonic_major">Major Pentatonic (Planetary Consonance)</option>
                    <option value="pentatonic_minor">Minor Pentatonic (Atmospheric Mood)</option>
                    <option value="dorian">Dorian Modal (Oceanic Tide)</option>
                    <option value="lydian">Lydian Modal (Crystalline Aerosols)</option>
                    <option value="chromatic">Chromatic 12-Tone (Exact Semitones)</option>
                    <option value="continuous">Continuous Microtonal (Pure Pitch)</option>
                  </select>
                </div>
              </div>
            )}

            {/* Tab 2: Group 2 - Sonification Mapping & Parameter Modulation DSP */}
            {controlTab === 'dsp' && (
              <div className="space-y-4 font-mono text-xs">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">
                  DYNAMIC PARAMETER MODULATION & FILTER DSP
                </span>

                {/* Filter Cutoff */}
                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">FILTER CUTOFF:</span>
                    <span className="text-cyan-300 font-bold">{filterCutoff} Hz</span>
                  </div>
                  <input
                    type="range"
                    min="200"
                    max="12000"
                    step="100"
                    value={filterCutoff}
                    onChange={(e) => setFilterCutoff(parseInt(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                  <div className="flex justify-between text-[8px] text-slate-500">
                    <span>200 Hz (Sub)</span>
                    <span>12 kHz (Air)</span>
                  </div>
                </div>

                {/* Resonance (Q) */}
                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">RESONANCE (Q):</span>
                    <span className="text-emerald-400 font-bold">{resonanceQ.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="10.0"
                    step="0.5"
                    value={resonanceQ}
                    onChange={(e) => setResonanceQ(parseFloat(e.target.value))}
                    className="w-full accent-emerald-400 cursor-pointer"
                  />
                  <div className="flex justify-between text-[8px] text-slate-500">
                    <span>0.5 Q (Broad)</span>
                    <span>10.0 Q (Peak)</span>
                  </div>
                </div>

                {/* Reverb Space */}
                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">REVERB SPACE:</span>
                    <span className="text-amber-300 font-bold">{reverbSpace}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={reverbSpace}
                    onChange={(e) => setReverbSpace(parseInt(e.target.value))}
                    className="w-full accent-amber-400 cursor-pointer"
                  />
                  <div className="flex justify-between text-[8px] text-slate-500">
                    <span>0% (Dry Anechoic)</span>
                    <span>100% (Planetary Hall)</span>
                  </div>
                </div>

                {/* Spatial Stereo Spread */}
                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">STEREO SPREAD / PAN:</span>
                    <span className="text-sky-300 font-bold">
                      {stereoSpread === 0 ? 'CENTER' : stereoSpread < 0 ? `${Math.abs(Math.round(stereoSpread * 100))}% L` : `${Math.round(stereoSpread * 100)}% R`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-1"
                    max="1"
                    step="0.1"
                    value={stereoSpread}
                    onChange={(e) => setStereoSpread(parseFloat(e.target.value))}
                    className="w-full accent-sky-400 cursor-pointer"
                  />
                  <div className="flex justify-between text-[8px] text-slate-500">
                    <span>100% Left</span>
                    <span>Center</span>
                    <span>100% Right</span>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Curated 1-Click Sonification Presets */}
            {controlTab === 'presets' && (
              <div className="space-y-2.5 font-mono text-xs">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">
                  CURATED SONIFICATION PRESETS (1-CLICK CALIBRATION)
                </span>
                <div className="space-y-2">
                  {STUDIO_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleApplyPreset(p)}
                      className="w-full text-left p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-400/50 hover:bg-slate-900 transition-all group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-100 group-hover:text-cyan-300">
                          {p.name}
                        </span>
                        <Badge variant="cyan" size="sm">{p.badge}</Badge>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 leading-snug">
                        {p.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 4: Group 6 - Scientific Parameter Guide */}
            {controlTab === 'guide' && (
              <div className="space-y-3 font-mono text-[11px] text-slate-300">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">
                  Scientific Parameter Guide • PHYSICAL TO ACOUSTIC MAPPING
                </span>
                
                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1">
                  <div className="text-amber-400 font-bold flex items-center space-x-1.5">
                    <Thermometer className="w-3.5 h-3.5" />
                    <span>1. Temperature → Musical Pitch</span>
                  </div>
                  <p className="text-slate-400 leading-relaxed text-[10px]">
                    {MAPPING_SPECIFICATIONS.temperature.parameterExplanation}
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1">
                  <div className="text-cyan-400 font-bold flex items-center space-x-1.5">
                    <CloudRain className="w-3.5 h-3.5" />
                    <span>2. Precipitation → Density, Rhythm & Amplitude</span>
                  </div>
                  <p className="text-slate-400 leading-relaxed text-[10px]">
                    {MAPPING_SPECIFICATIONS.precipitation.parameterExplanation}
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1">
                  <div className="text-teal-400 font-bold flex items-center space-x-1.5">
                    <Wind className="w-3.5 h-3.5" />
                    <span>3. Wind Speed → Modulation & Texture</span>
                  </div>
                  <p className="text-slate-400 leading-relaxed text-[10px]">
                    {MAPPING_SPECIFICATIONS.wind_speed.parameterExplanation}
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1">
                  <div className="text-emerald-400 font-bold flex items-center space-x-1.5">
                    <Trees className="w-3.5 h-3.5" />
                    <span>4. Vegetation → Timbre & Harmonic Richness</span>
                  </div>
                  <p className="text-slate-400 leading-relaxed text-[10px]">
                    {MAPPING_SPECIFICATIONS.vegetation.parameterExplanation}
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1">
                  <div className="text-blue-400 font-bold flex items-center space-x-1.5">
                    <Waves className="w-3.5 h-3.5" />
                    <span>5. Ocean SST → Foundation Drone & Swell</span>
                  </div>
                  <p className="text-slate-400 leading-relaxed text-[10px]">
                    {MAPPING_SPECIFICATIONS.ocean_sst.parameterExplanation}
                  </p>
                </div>

              </div>
            )}
          </GlassPanel>

        </div>

      </div>

    </div>
  )
}