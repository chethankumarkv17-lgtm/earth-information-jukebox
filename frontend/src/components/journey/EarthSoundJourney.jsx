import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Compass,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  RotateCcw,
  Volume2,
  VolumeX,
  MapPin,
  Globe2,
  Layers,
  Sparkles,
  Info,
  Share2,
  Download,
  CheckCircle2,
  Headphones,
  Sliders,
  Radio,
  Clock,
  Waves,
  Eye,
  Camera,
  Activity,
  ChevronRight,
  ChevronLeft
} from 'lucide-react'

import {
  earthSonificationEngine,
  MAPPING_SPECIFICATIONS,
  SONIFICATION_PRESETS,
  mapTemperatureToPitch,
  mapPrecipitationToAcousticRhythm,
  mapWindSpeedToModulation,
  mapVegetationToTimbre,
  mapOceanToFoundationDrone
} from '../../services/earthDataSonificationEngine'
import { useAccessibility } from '../../context/AccessibilityContext'
import ExportShareModal from '../common/ExportShareModal'
import GlassPanel from '../common/GlassPanel'
import Button from '../common/Button'
import Badge from '../common/Badge'

// Lazy-loaded 3D Cesium globe for guided 3D planetary camera flights
const CesiumGlobeViewer = React.lazy(() => import('../earth/CesiumGlobeViewer'))

export const EARTH_JOURNEYS = [
  {
    id: 'thermodynamic_transect',
    title: 'The Global Thermodynamic Transect: Equator to Cryosphere',
    subtitle: 'From equatorial rainforest humidity to polar ice sublimation',
    description: 'Travel from the dense tropical carbon sink of the Amazon through the hyper-arid Sahara, across the Pacific warm pool, and into the rapidly warming Arctic cryosphere.',
    waypoints: [
      {
        id: 'amazon_canopy',
        name: 'Amazon Basin Rainforest',
        region: 'South America (Brazil)',
        coordinates: "03°28'S 62°13'W",
        lat: -3.4667,
        lon: -62.2167,
        zoom: 5,
        datasetId: 'temperature',
        layerId: 'modis',
        minVal: -10,
        maxVal: 45,
        biome: 'Tropical Evergreen Rainforest',
        primaryMetric: 'Surface Temperature & Vegetation',
        value: 27.5,
        unit: '°C',
        secondaryMetric: 'NDVI: 0.82',
        imageryUrl: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=1200&q=80',
        narrative: "We begin our journey over the Amazon Basin, Earth's largest tropical rainforest. Continuous evapotranspiration fuels cloud formation while high chlorophyll density absorbs sunlight, generating rich harmonic overtones in the acoustic mid-register.",
        soundExplanation: 'Acoustic pitch sits at 440 Hz (A4) within a lush Major Pentatonic scale, wrapped in rich sawtooth harmonics reflecting 82% canopy greenness.'
      },
      {
        id: 'western_ghats',
        name: 'Western Ghats Escarpment',
        region: 'South Asia (India)',
        coordinates: "13°56'N 75°34'E",
        lat: 13.9333,
        lon: 75.5667,
        zoom: 6,
        datasetId: 'precipitation',
        layerId: 'sentinel2',
        minVal: 0,
        maxVal: 80,
        biome: 'Tropical Wet Evergreen',
        primaryMetric: 'Monsoon Precipitation Surge',
        value: 48.5,
        unit: 'mm/day',
        secondaryMetric: 'Rainfall Intensity: Severe',
        imageryUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
        narrative: 'Traveling east, we meet the towering cliffs of the Western Ghats during the southwest monsoon. Orographic lifting forces moisture-laden Arabian Sea winds into massive convective towers, releasing torrential precipitation.',
        soundExplanation: 'Rainfall pulses accelerate into rapid polyrhythmic marimba showers, with acoustic volume swelling to reflect severe convective precipitation depth.'
      },
      {
        id: 'sahara_transition',
        name: 'Sahara Desert Transition',
        region: 'North Africa (Niger / Algeria)',
        coordinates: "23°25'N 12°36'E",
        lat: 23.4167,
        lon: 12.6000,
        zoom: 5,
        datasetId: 'wind_speed',
        layerId: 'modis',
        minVal: -10,
        maxVal: 55,
        biome: 'Hyper-Arid Subtropical Desert',
        primaryMetric: 'Extreme Diurnal Heat & Wind',
        value: 41.2,
        unit: '°C',
        secondaryMetric: 'Wind: 11.4 m/s Harmattan',
        imageryUrl: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=80',
        narrative: 'Ascending into the Sahara, atmospheric moisture drops to near zero. Clear skies permit extreme midday solar irradiance. High aerodynamic wind gusts stir the Harmattan dust plume.',
        soundExplanation: 'High surface heat pushes pitch to 740 Hz (F#5), accompanied by rapid LFO tremolo flutter and resonant whistling filters from high aerodynamic wind friction.'
      },
      {
        id: 'pacific_warm_pool',
        name: 'Equatorial Pacific Warm Pool',
        region: 'International Waters (165°E)',
        coordinates: "00°30'N 165°00'E",
        lat: 0.5000,
        lon: 165.0000,
        zoom: 4,
        datasetId: 'ocean_sst',
        layerId: 'sentinel2',
        minVal: 15,
        maxVal: 35,
        biome: 'Pelagic Marine Oceanic',
        primaryMetric: 'Sea Surface Heat Energy',
        value: 30.4,
        unit: '°C',
        secondaryMetric: 'Thermal State: ENSO Epicenter',
        imageryUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
        narrative: 'Crossing the vast Pacific Ocean, we reach the thermal engine of planetary circulation: the equatorial warm pool. Ocean heat content here drives atmospheric convection cells and global teleconnections.',
        soundExplanation: 'Ocean heat anchors the sonification as a warm sub-bass drone at 58 Hz, pulsing with tidal chorusing swells.'
      },
      {
        id: 'greenland_summit',
        name: 'Greenland Ice Sheet Summit',
        region: 'Arctic (Greenland)',
        coordinates: "72°35'N 38°28'W",
        lat: 72.5833,
        lon: -38.4667,
        zoom: 5,
        datasetId: 'temperature',
        layerId: 'modis',
        minVal: -45,
        maxVal: 10,
        biome: 'Continental Glacial Ice Cap',
        primaryMetric: 'Cryospheric Sub-Zero Freeze',
        value: -26.8,
        unit: '°C',
        secondaryMetric: 'Surface Albedo: 0.88',
        imageryUrl: 'https://images.unsplash.com/photo-1483181957632-8bda974cbc91?auto=format&fit=crop&w=1200&q=80',
        narrative: 'Ascending onto the 3,200-meter Greenland Ice Sheet, the landscape turns into a blinding expanse of high-albedo polar firn reflecting 88% of incoming solar rays back to space.',
        soundExplanation: 'Severe sub-zero cold shifts fundamental pitch down to 78 Hz (D#2), producing a crystalline sub-polar resonance with slow, open breathing filters.'
      },
      {
        id: 'svalbard_arctic',
        name: 'Svalbard Arctic Outpost',
        region: 'High-Arctic (Norway)',
        coordinates: "78°13'N 15°38'E",
        lat: 78.2167,
        lon: 15.6333,
        zoom: 6,
        datasetId: 'wind_speed',
        layerId: 'sentinel2',
        minVal: -25,
        maxVal: 20,
        biome: 'Polar Marine Tundra',
        primaryMetric: 'Arctic Amplification & Gales',
        value: 1.4,
        unit: '°C',
        secondaryMetric: 'Wind Velocity: 14.2 m/s Gale',
        imageryUrl: 'https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?auto=format&fit=crop&w=1200&q=80',
        narrative: 'We conclude our journey at 78 degrees north in Svalbard. Here, temperatures are warming at over three times the global average, causing sea ice pack to fragment into open water as cyclonic storms howl.',
        soundExplanation: 'Polar maritime thaw produces hollow sine waves with turbulent aeroacoustic bandpass sweeps from 14 m/s cyclonic gale winds.'
      }
    ]
  },
  {
    id: 'water_cycle',
    title: 'The Planetary Water Cycle & Monsoon Corridor',
    subtitle: 'Following atmospheric rivers and moisture transport',
    description: 'Track liquid and vapor moisture as it evaporates from equatorial oceans, condenses over mountain escarpments, and dissipates across arid continental interiors.',
    waypoints: [
      {
        id: 'amazon_evap',
        name: 'Amazon Rainforest Hydrological Heart',
        region: 'South America',
        coordinates: "03°28'S 62°13'W",
        lat: -3.4667,
        lon: -62.2167,
        zoom: 5,
        datasetId: 'precipitation',
        layerId: 'modis',
        minVal: 0,
        maxVal: 50,
        biome: 'Rainforest Biosphere',
        primaryMetric: 'Rainforest Evapotranspiration',
        value: 18.2,
        unit: 'mm/day',
        secondaryMetric: 'Moisture Pulse: Maximum',
        imageryUrl: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=1200&q=80',
        narrative: 'Evaporation from trillions of rainforest leaves releases immense vapor plumes termed "Flying Rivers", transporting moisture across continents.',
        soundExplanation: 'Harmonic pads and dense wooden droplets represent atmospheric water recycling.'
      },
      {
        id: 'pacific_squall',
        name: 'Intertropical Convergence Zone (ITCZ)',
        region: 'Equatorial Pacific',
        coordinates: "05°00'N 150°00'W",
        lat: 5.0000,
        lon: -150.0000,
        zoom: 4,
        datasetId: 'precipitation',
        layerId: 'sentinel2',
        minVal: 0,
        maxVal: 60,
        biome: 'Marine Atmosphere',
        primaryMetric: 'Pelagic Squall Intensity',
        value: 24.5,
        unit: 'mm/day',
        secondaryMetric: 'Convective Convergence',
        imageryUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
        narrative: 'Where northern and southern trade winds collide, immense thunderstorms rise twelve kilometers into the troposphere.',
        soundExplanation: 'Rapid cascading pulses emulate ocean squalls across a stereo field.'
      },
      {
        id: 'ghats_deluge',
        name: 'Western Ghats Cloudburst',
        region: 'South Asia (India)',
        coordinates: "13°56'N 75°34'E",
        lat: 13.9333,
        lon: 75.5667,
        zoom: 6,
        datasetId: 'precipitation',
        layerId: 'sentinel2',
        minVal: 0,
        maxVal: 80,
        biome: 'Montane Monsoon Rainforest',
        primaryMetric: 'Orographic Deluge',
        value: 52.0,
        unit: 'mm/day',
        secondaryMetric: 'Seasonal Peak',
        imageryUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
        narrative: 'Monsoon clouds slam into the steep Western Ghats escarpment, triggering torrential rainfall feeding rivers across the Indian subcontinent.',
        soundExplanation: 'Accelerated percussive downpour rhythms reach maximum acoustic density.'
      }
    ]
  }
]

export default function EarthSoundJourney({ className = '' }) {
  const { playEarcon, announce, speak, stopSpeaking, isSpeaking, highContrast, reducedMotion } = useAccessibility()

  const [selectedJourneyId, setSelectedJourneyId] = useState('thermodynamic_transect')
  const [currentWaypointIdx, setCurrentWaypointIdx] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [dwellSeconds, setDwellSeconds] = useState(8)
  const [dwellProgressPct, setDwellProgressPct] = useState(0)
  const [activePresetId, setActivePresetId] = useState('ambient_documentary')
  const [viewportMode, setViewportMode] = useState('3d_cesium') // '3d_cesium' | 'photo'
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)

  // Audio & Animation refs
  const timerRef = useRef(null)
  const progressAnimRef = useRef(null)
  const pulseIntervalRef = useRef(null)
  const canvasRef = useRef(null)
  const animFrameRef = useRef(null)
  const startTimeRef = useRef(null)

  const activeJourney = EARTH_JOURNEYS.find(j => j.id === selectedJourneyId) || EARTH_JOURNEYS[0]
  const currentWaypoint = activeJourney.waypoints[currentWaypointIdx] || activeJourney.waypoints[0]

  // Audition current waypoint audio tone (preserves required signature)
  const auditionWaypoint = useCallback((wp) => {
    try {
      if (earthSonificationEngine.ctx?.state === 'suspended') {
        earthSonificationEngine.ctx.resume()
      }

      // Calculate calibrated frequency based on scientific value
      const freq = 200 + (wp.value * 10)
      const clampedFreq = Math.max(65, Math.min(1000, freq))

      earthSonificationEngine.playTone(clampedFreq, 0.75, {
        type: wp.datasetId === 'ocean_sst' ? 'sine' : wp.datasetId === 'precipitation' ? 'triangle' : 'sawtooth',
        gainMultiplier: 0.85
      })
    } catch (e) {
      console.warn('Audition playback error:', e)
    }
  }, [])

  // Start continuous rhythmic / harmonic sonification pulses while dwelling
  const startJourneySonificationPulse = useCallback((wp) => {
    if (pulseIntervalRef.current) clearInterval(pulseIntervalRef.current)

    // Immediate tone on arrival
    auditionWaypoint(wp)

    // Subtle rhythmic pulse every 2.4s to maintain live acoustic presence
    pulseIntervalRef.current = setInterval(() => {
      try {
        if (!earthSonificationEngine.ctx) return
        const baseFreq = 200 + (wp.value * 10)
        const clampedFreq = Math.max(65, Math.min(1000, baseFreq))
        
        // Gentle overtone accompaniment
        earthSonificationEngine.playTone(clampedFreq * 1.5, 0.35, {
          type: 'sine',
          gainMultiplier: 0.45
        })
      } catch (err) {}
    }, 2400)
  }, [auditionWaypoint])

  // Stop rhythmic pulse
  const stopJourneySonificationPulse = useCallback(() => {
    if (pulseIntervalRef.current) {
      clearInterval(pulseIntervalRef.current)
      pulseIntervalRef.current = null
    }
  }, [])

  // Waypoint Switch Handler
  const handleSelectWaypoint = useCallback((idx) => {
    setCurrentWaypointIdx(idx)
    setDwellProgressPct(0)
    startTimeRef.current = Date.now()

    const wp = activeJourney.waypoints[idx]
    if (wp) {
      if (isPlaying) {
        startJourneySonificationPulse(wp)
      } else {
        auditionWaypoint(wp)
      }
      playEarcon('seek')
      announce(`Arrived at Waypoint ${idx + 1}: ${wp.name}. ${wp.primaryMetric}: ${wp.value} ${wp.unit}.`)
    }
  }, [activeJourney.waypoints, isPlaying, startJourneySonificationPulse, auditionWaypoint, playEarcon, announce])

  // Handle Autoplay & Synchronized Timeline Progression
  useEffect(() => {
    if (!isPlaying) {
      setDwellProgressPct(0)
      stopJourneySonificationPulse()
      if (progressAnimRef.current) cancelAnimationFrame(progressAnimRef.current)
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }

    // Start sonification for initial active waypoint
    startJourneySonificationPulse(currentWaypoint)
    startTimeRef.current = Date.now()
    const dwellMs = dwellSeconds * 1000

    // Smooth frame-by-frame progress bar animation
    const updateProgress = () => {
      const elapsed = Date.now() - startTimeRef.current
      const pct = Math.min(100, (elapsed / dwellMs) * 100)
      setDwellProgressPct(pct)

      if (pct < 100) {
        progressAnimRef.current = requestAnimationFrame(updateProgress)
      } else {
        // Advance to next waypoint
        setCurrentWaypointIdx(prev => {
          const next = (prev + 1) % activeJourney.waypoints.length
          const nextWp = activeJourney.waypoints[next]
          announce(`Arrived at Waypoint ${next + 1}: ${nextWp.name}`)
          startTimeRef.current = Date.now()
          startJourneySonificationPulse(nextWp)
          progressAnimRef.current = requestAnimationFrame(updateProgress)
          return next
        })
      }
    }

    progressAnimRef.current = requestAnimationFrame(updateProgress)

    return () => {
      if (progressAnimRef.current) cancelAnimationFrame(progressAnimRef.current)
      stopJourneySonificationPulse()
    }
  }, [isPlaying, dwellSeconds, activeJourney.waypoints, currentWaypoint, startJourneySonificationPulse, stopJourneySonificationPulse, announce])

  // Oscilloscope canvas renderer for real-time waveform visualization
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

      // Zero baseline
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.18)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(0, h / 2)
      ctx.lineTo(w, h / 2)
      ctx.stroke()

      if (!isPlaying) {
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
      ctx.strokeStyle = '#06b6d4'
      ctx.shadowColor = '#06b6d4'
      ctx.shadowBlur = Math.round(5 * decay)

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
  }, [isPlaying])

  // Read Waypoint Narrative Aloud
  const handleSpeakNarrative = () => {
    if (isSpeaking) {
      stopSpeaking()
      return
    }
    const text = `${currentWaypoint.name}, located at ${currentWaypoint.region}. Coordinates: ${currentWaypoint.coordinates}. ${currentWaypoint.narrative} Sound explanation: ${currentWaypoint.soundExplanation}`
    speak(text)
  }

  // Radiometric range calculation
  const minV = currentWaypoint.minVal ?? 0
  const maxV = currentWaypoint.maxVal ?? 100
  const gaugePct = Math.max(0, Math.min(100, ((currentWaypoint.value - minV) / (maxV - minV)) * 100))

  return (
    <div className={`space-y-6 ${className}`}>
      
      {/* Top Banner & Journey Selector */}
      <div className="pb-4 border-b border-cyan-500/15 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-cyan-400 uppercase tracking-wider mb-1">
            <Compass className="w-4 h-4" />
            <span>MULTIMODAL GUIDED EXPEDITION • FEATURE 4</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2">
            Earth Sound Journey
            <Badge variant="emerald" size="sm">CINEMATIC EXPLORATION</Badge>
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Synchronized 3D satellite camera flight, authentic telemetry, procedural sonification, and scientific storytelling.
          </p>
        </div>

        {/* Journey Dropdown & View Mode Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedJourneyId}
            onChange={(e) => {
              setSelectedJourneyId(e.target.value)
              setCurrentWaypointIdx(0)
              setIsPlaying(false)
              setDwellProgressPct(0)
            }}
            className="bg-slate-900 text-slate-100 p-2 rounded-xl border border-slate-700 text-xs font-mono font-bold focus:ring-2 focus:ring-cyan-400 focus:outline-none"
          >
            {EARTH_JOURNEYS.map(j => (
              <option key={j.id} value={j.id}>{j.title}</option>
            ))}
          </select>

          {/* Viewport Display Switcher: 3D Cesium vs Photo Composite */}
          <div className="flex items-center space-x-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs font-mono">
            <button
              onClick={() => setViewportMode('3d_cesium')}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                viewportMode === '3d_cesium'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Globe2 className="w-3 h-3" />
              <span>3D SATELLITE GLOBE</span>
            </button>

            <button
              onClick={() => setViewportMode('photo')}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                viewportMode === 'photo'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Camera className="w-3 h-3" />
              <span>HIGH-RES PHOTO</span>
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            icon={Share2}
            onClick={() => setIsExportModalOpen(true)}
            className="text-xs font-mono"
          >
            Share Journey
          </Button>
        </div>
      </div>

      {/* Main Guided Expedition Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left / Center: Synchronized Viewport (7 Cols) */}
        <div className="lg:col-span-7 rounded-2xl overflow-hidden bg-slate-950 border border-cyan-500/30 shadow-2xl relative flex flex-col">
          
          {/* Main Stage: 3D Cesium Globe or High-Res Imagery */}
          <div className="relative h-80 sm:h-[440px] w-full overflow-hidden bg-slate-900 flex items-center justify-center">
            {viewportMode === '3d_cesium' ? (
              <React.Suspense
                fallback={
                  <div className="flex flex-col items-center justify-center space-y-3 font-mono text-cyan-400">
                    <Globe2 className="w-8 h-8 animate-spin" />
                    <span className="text-xs">STREAMING 3D SATELLITE FLIGHT PATH...</span>
                  </div>
                }
              >
                <CesiumGlobeViewer
                  mode="embedded"
                  targetLocation={{
                    lat: currentWaypoint.lat,
                    lon: currentWaypoint.lon,
                    zoom: currentWaypoint.zoom || 5
                  }}
                  selectedLayerId={currentWaypoint.layerId || 'modis'}
                />
              </React.Suspense>
            ) : (
              <div className="relative w-full h-full overflow-hidden">
                <img
                  src={currentWaypoint.imageryUrl}
                  alt={currentWaypoint.name}
                  className={`w-full h-full object-cover transition-transform duration-700 ease-out ${
                    reducedMotion ? '' : 'hover:scale-105'
                  }`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
              </div>
            )}

            {/* Waypoint Coordinates & Biome HUD Badge */}
            <div className="absolute top-4 left-4 z-20 flex flex-wrap gap-2 pointer-events-none">
              <span className="px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-md text-cyan-300 font-mono text-xs border border-cyan-500/40 flex items-center gap-1.5 font-bold shadow-lg">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                <span>{currentWaypoint.coordinates}</span>
              </span>

              <span className="px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-md text-emerald-300 font-mono text-xs border border-emerald-500/40 font-bold shadow-lg">
                {currentWaypoint.biome}
              </span>

              <span className="px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-md text-slate-300 font-mono text-xs border border-slate-700 font-bold shadow-lg">
                LAYER: {currentWaypoint.layerId ? currentWaypoint.layerId.toUpperCase() : 'MODIS'}
              </span>
            </div>

            {/* Active Sonification Indicator */}
            {isPlaying && (
              <div className="absolute top-4 right-4 z-20 px-3 py-1 rounded-full bg-emerald-500/20 backdrop-blur-md text-emerald-400 font-mono text-[10px] font-bold uppercase border border-emerald-500/40 flex items-center gap-1.5 shadow-lg">
                <span className={`w-2 h-2 rounded-full bg-emerald-400 ${reducedMotion ? '' : 'animate-ping'}`} />
                EXPEDITION IN MOTION
              </div>
            )}

            {/* Bottom Floating Title Overlay */}
            <div className="absolute bottom-4 left-4 right-4 z-20 pointer-events-none">
              <div className="bg-slate-950/80 backdrop-blur-md p-3 rounded-xl border border-slate-800">
                <div className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider mb-0.5">
                  WAYPOINT {currentWaypointIdx + 1} OF {activeJourney.waypoints.length} • CAMERA TARGET FLIGHT
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  {currentWaypoint.name}
                </h3>
                <p className="text-xs text-slate-300 font-mono">
                  {currentWaypoint.region}
                </p>
              </div>
            </div>
          </div>

          {/* Calibrated Radiometric Measurement & Gauge */}
          <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-3 font-mono">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                  PRIMARY OBSERVATION:
                </span>
                <div className="text-sm font-bold text-slate-100">
                  {currentWaypoint.primaryMetric}
                </div>
              </div>

              <div className="text-right">
                <div className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-300">
                  {currentWaypoint.value} {currentWaypoint.unit}
                </div>
                <div className="text-[10px] text-slate-400">
                  {currentWaypoint.secondaryMetric}
                </div>
              </div>
            </div>

            {/* Radiometric Gauge Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[9px] text-slate-500">
                <span>{minV} {currentWaypoint.unit}</span>
                <span className="text-cyan-400">RADIOMETRIC INTENSITY RANGE</span>
                <span>{maxV} {currentWaypoint.unit}</span>
              </div>
              <div className="relative w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${gaugePct}%` }}
                />
              </div>
            </div>
          </div>

        </div>

        {/* Right: Narrative Storytelling & Sound Explanation (5 Cols) */}
        <div className="lg:col-span-5 space-y-4 font-mono">
          
          {/* Narrative Storytelling Card */}
          <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <span className="text-xs text-cyan-400 font-bold uppercase flex items-center gap-1.5">
                <Headphones className="w-4 h-4" />
                <span>EXPEDITION NARRATIVE:</span>
              </span>

              <button
                onClick={handleSpeakNarrative}
                aria-label="Narrate waypoint description aloud"
                className="px-2 py-0.5 rounded text-[11px] text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 transition-colors"
              >
                {isSpeaking ? 'Stop Voice' : 'Hear Narrative'}
              </button>
            </div>

            <p className="text-xs text-slate-200 leading-relaxed font-sans">
              {currentWaypoint.narrative}
            </p>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-emerald-400 font-bold uppercase block">
                  HOW THIS LOCATION SOUNDS:
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-bold">
                  ACOUSTIC PHYSICS
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {currentWaypoint.soundExplanation}
              </p>
            </div>
          </div>

          {/* Real-time Oscilloscope Waveform */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-400 uppercase font-bold flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                <span>REAL-TIME ACOUSTIC WAVEFORM:</span>
              </span>
              <span className={`text-[9px] px-2 py-0.5 rounded ${isPlaying ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-500'}`}>
                {isPlaying ? 'DSP SYNTHESIZING' : 'STANDBY'}
              </span>
            </div>

            <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
              <canvas
                ref={canvasRef}
                width={380}
                height={54}
                className="w-full h-14 block"
              />
              <div className="absolute top-1 left-2 flex items-center space-x-1.5 text-[8px] text-slate-400">
                <span className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-cyan-400 animate-ping' : 'bg-slate-600'}`} />
                <span>256-BIN REALTIME OSCILLOSCOPE TRACE</span>
              </div>
            </div>
          </div>

          {/* Autoplay & Journey Transport Controls */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 uppercase font-bold">
                EXPEDITION CONTROLS:
              </span>
              <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                <span>Dwell:</span>
                {[6, 8, 12].map(sec => (
                  <button
                    key={sec}
                    onClick={() => setDwellSeconds(sec)}
                    className={`px-1.5 py-0.5 rounded text-[10px] transition-colors ${
                      dwellSeconds === sec ? 'bg-cyan-500 text-black font-bold' : 'bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    {sec}s
                  </button>
                ))}
              </div>
            </div>

            {/* Dwell Progress Indicator */}
            {isPlaying && (
              <div className="space-y-1">
                <div className="flex justify-between text-[9px] text-slate-400">
                  <span>TRANSITIONING TO NEXT WAYPOINT</span>
                  <span className="text-cyan-300">{Math.round(dwellProgressPct)}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-cyan-400 rounded-full transition-all duration-75"
                    style={{ width: `${dwellProgressPct}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Button
                variant="primary"
                size="sm"
                icon={isPlaying ? Pause : Play}
                onClick={() => {
                  const nextPlaying = !isPlaying
                  setIsPlaying(nextPlaying)
                  if (nextPlaying) {
                    playEarcon('play')
                    auditionWaypoint(currentWaypoint)
                  } else {
                    playEarcon('pause')
                  }
                }}
                className="font-bold text-xs flex-1 justify-center"
              >
                {isPlaying ? 'PAUSE GUIDED JOURNEY' : 'START GUIDED JOURNEY'}
              </Button>

              <button
                onClick={() => {
                  const prev = (currentWaypointIdx - 1 + activeJourney.waypoints.length) % activeJourney.waypoints.length
                  handleSelectWaypoint(prev)
                }}
                aria-label="Previous Waypoint"
                className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  const next = (currentWaypointIdx + 1) % activeJourney.waypoints.length
                  handleSelectWaypoint(next)
                }}
                aria-label="Next Waypoint"
                className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* Waypoint Steps Scrubber */}
      <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 font-mono">
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span>EXPEDITION WAYPOINTS:</span>
          <span>{currentWaypointIdx + 1} of {activeJourney.waypoints.length} complete</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {activeJourney.waypoints.map((wp, idx) => {
            const isCurrent = idx === currentWaypointIdx
            return (
              <button
                key={wp.id}
                onClick={() => handleSelectWaypoint(idx)}
                className={`p-2.5 rounded-xl text-left border transition-all ${
                  isCurrent
                    ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-lg ring-1 ring-cyan-400'
                    : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <div className="text-[10px] text-cyan-400 font-bold flex items-center justify-between">
                  <span>STEP {idx + 1}</span>
                  {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />}
                </div>
                <div className="text-xs font-bold text-slate-100 truncate mt-0.5">
                  {wp.name}
                </div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5">
                  {wp.value} {wp.unit}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Export / Share Modal */}
      <ExportShareModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        explorationState={{
          mode: 'journey',
          journeyId: activeJourney.id,
          waypointIdx: currentWaypointIdx,
          location: { id: currentWaypoint.id, name: currentWaypoint.name, coordinatesText: currentWaypoint.coordinates },
          dataset: { name: currentWaypoint.primaryMetric, unit: currentWaypoint.unit, id: 'journey_metric' },
          presetName: 'Ambient Documentary',
          timeSeries: [{ date: '2024-07-15', value: currentWaypoint.value, frequencyHz: 200 + (currentWaypoint.value * 10) }]
        }}
      />

    </div>
  )
}
