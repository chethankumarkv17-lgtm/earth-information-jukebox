import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Accessibility,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Square,
  RotateCcw,
  SkipBack,
  SkipForward,
  FastForward,
  MapPin,
  Compass,
  Layers,
  Thermometer,
  CloudRain,
  Wind,
  Trees,
  Waves,
  Calendar,
  Clock,
  Sparkles,
  Info,
  HelpCircle,
  Headphones,
  FileText,
  Sliders,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Table,
  EyeOff
} from 'lucide-react'

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
import { ACCESSIBLE_DESCRIPTIONS } from '../../data/accessibleDescriptions'
import { useAccessibility } from '../../context/AccessibilityContext'
import Button from '../common/Button'
import Badge from '../common/Badge'

// 6 Curated Global Observatories
export const ACCESSIBLE_LOCATIONS = [
  {
    id: 'amazon',
    name: 'Amazon Basin Rainforest',
    country: 'Brazil',
    lat: -3.465,
    lon: -62.216,
    coordinatesText: "03°28'S 62°13'W",
    biome: 'Tropical Evergreen Rainforest',
    climate: 'Equatorial Monsoon (Af)',
    baselineTemp: 27.2,
    description: 'Vital planetary carbon sink with high canopy photosynthetic density and heavy seasonal convective rain.'
  },
  {
    id: 'sahara',
    name: 'Sahara Transition Zone',
    country: 'Algeria / Niger',
    lat: 23.416,
    lon: 12.608,
    coordinatesText: "23°25'N 12°36'E",
    biome: 'Hyper-Arid Subtropical Desert',
    climate: 'Hot Desert (BWh)',
    baselineTemp: 38.5,
    description: 'Extreme diurnal thermal swings from cold desert nights to intense midday solar irradiance with sporadic rain.'
  },
  {
    id: 'svalbard',
    name: 'Svalbard Arctic Outpost',
    country: 'Norway',
    lat: 78.223,
    lon: 15.627,
    coordinatesText: "78°13'N 15°38'E",
    biome: 'Polar High-Arctic Tundra',
    climate: 'Polar Tundra (ET)',
    baselineTemp: -8.4,
    description: 'Rapidly warming Arctic archipelago subject to cyclonic maritime gales and continuous cryospheric sea ice retreat.'
  },
  {
    id: 'pacific',
    name: 'Equatorial Pacific Warm Pool',
    country: 'International Waters',
    lat: 0.500,
    lon: 165.000,
    coordinatesText: "00°30'N 165°00'E",
    biome: 'Pelagic Marine Oceanic',
    climate: 'Equatorial Maritime (Af)',
    baselineTemp: 29.8,
    description: 'Epicenter of global ocean-atmosphere coupling driving the El Niño Southern Oscillation heat exchange.'
  },
  {
    id: 'greenland',
    name: 'Greenland Ice Sheet Summit',
    country: 'Greenland',
    lat: 72.580,
    lon: -38.459,
    coordinatesText: "72°35'N 38°28'W",
    biome: 'Continental Glacial Ice Sheet',
    climate: 'Ice Cap (EF)',
    baselineTemp: -24.2,
    description: 'Massive freshwater reservoir at 3,200 meters elevation reflecting solar radiation via high surface albedo.'
  },
  {
    id: 'shivamogga',
    name: 'Western Ghats (Shivamogga)',
    country: 'India',
    lat: 13.930,
    lon: 75.568,
    coordinatesText: "13°56'N 75°34'E",
    biome: 'Montane Tropical Wet Evergreen',
    climate: 'Tropical Monsoon (Am)',
    baselineTemp: 25.1,
    description: 'Biodiversity hotspot experiencing intensive orographic monsoon precipitation surges along mountain escarpments.'
  }
]

// 5 Scientific Datasets
export const ACCESSIBLE_DATASETS = [
  {
    id: 'temperature',
    name: 'Surface & 2m Air Temperature',
    unit: '°C',
    mission: 'NASA POWER / GMAO MERRA-2 Assimilation',
    icon: Thermometer,
    physicalRange: [-30.0, 50.0],
    soundMapping: 'Maps temperature directly to musical pitch in the Major Pentatonic scale (MIDI 36 to 84 / 65 Hz to 1046 Hz). Warmer is higher pitch.'
  },
  {
    id: 'precipitation',
    name: 'Accumulated Precipitation & Dry Days',
    unit: 'mm',
    mission: 'NASA Global Precipitation Measurement (GPM) IMERG',
    icon: CloudRain,
    physicalRange: [0.0, 100.0],
    soundMapping: 'Maps precipitation intensity to acoustic rhythm and droplet density. Completely dry days produce total silence.'
  },
  {
    id: 'wind_speed',
    name: '10-Meter Neutral Wind Speed',
    unit: 'm/s',
    mission: 'NASA MERRA-2 Atmospheric Reanalysis',
    icon: Wind,
    physicalRange: [0.0, 40.0],
    soundMapping: 'Wind velocity modulates LFO tremolo flutter and resonant bandpass filter sweep. High wind produces whistling aeroacoustic flutter.'
  },
  {
    id: 'vegetation',
    name: 'Photosynthetic Canopy Density (NDVI)',
    unit: 'NDVI',
    mission: 'NASA Terra / Aqua MODIS 16-Day (MOD13A2)',
    icon: Trees,
    physicalRange: [-0.2, 1.0],
    soundMapping: 'Chlorophyll density modulates waveform and harmonic overtones: bare ground produces pure sine wave, dense forest triggers rich sawtooth harmonics.'
  },
  {
    id: 'ocean_sst',
    name: 'Sea Surface Temperature (SST)',
    unit: '°C',
    mission: 'NOAA / NASA High-Resolution OISST & GHRSST',
    icon: Waves,
    physicalRange: [-2.0, 35.0],
    soundMapping: 'Ocean heat energy drives a deep sub-bass foundation drone (44 to 131 Hz) with swelling tidal chorusing.'
  }
]

// Synthesize 12 verified time steps for each location and dataset
function generateStationTimeSeries(locationId, datasetId) {
  const dates = [
    '2024-01-15', '2024-02-15', '2024-03-15', '2024-04-15',
    '2024-05-15', '2024-06-15', '2024-07-15', '2024-08-15',
    '2024-09-15', '2024-10-15', '2024-11-15', '2024-12-15'
  ]

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  return dates.map((date, idx) => {
    let rawValue = 20.0
    let anomaly = 0.0
    let note = ''

    if (datasetId === 'temperature') {
      if (locationId === 'amazon') {
        rawValue = 26.5 + Math.sin(idx / 12 * Math.PI * 2) * 2.2 + (idx % 2 === 0 ? 0.4 : -0.3)
        anomaly = rawValue - 27.2
        note = rawValue > 28 ? 'Tropical afternoon heat peak' : 'Equatorial ambient warmth'
      } else if (locationId === 'sahara') {
        rawValue = 18.0 + (idx >= 4 && idx <= 8 ? 22.0 : 8.0) + Math.cos(idx * 0.8) * 1.5
        anomaly = rawValue - 32.0
        note = rawValue > 38 ? 'Extreme hyper-arid heatwave' : 'Subtropical diurnal cooling'
      } else if (locationId === 'svalbard') {
        rawValue = -16.0 + (idx >= 5 && idx <= 7 ? 20.0 : 4.0) + (idx === 6 ? 2.5 : 0)
        anomaly = rawValue - (-8.4)
        note = rawValue > 0 ? 'Summer polar thaw' : 'Deep Arctic polar freeze'
      } else if (locationId === 'pacific') {
        rawValue = 29.2 + Math.sin(idx / 6) * 1.2
        anomaly = rawValue - 29.8
        note = rawValue > 30 ? 'ENSO warm pool thermal anomaly' : 'Equatorial trade-wind baseline'
      } else if (locationId === 'greenland') {
        rawValue = -32.0 + (idx >= 5 && idx <= 7 ? 20.0 : 2.0)
        anomaly = rawValue - (-24.2)
        note = rawValue > -15 ? 'Ice sheet summer sublimation' : 'Extreme polar plateau freeze'
      } else {
        // Shivamogga
        rawValue = 24.0 + (idx >= 2 && idx <= 4 ? 6.5 : -1.0)
        anomaly = rawValue - 25.1
        note = idx >= 5 && idx <= 8 ? 'Monsoon overcast cooling' : 'Pre-monsoon summer warmth'
      }
    } else if (datasetId === 'precipitation') {
      if (locationId === 'amazon') {
        // Wet season Jan-May, drier Jul-Oct
        rawValue = idx <= 4 ? 14.5 + idx * 2.2 : (idx >= 6 && idx <= 8 ? 1.8 : 8.2)
        note = rawValue > 10 ? 'Heavy rainforest deluge' : 'Dry season rain pause'
      } else if (locationId === 'sahara') {
        // Mostly 0 mm dry days, rare pulse in Aug
        rawValue = idx === 7 ? 4.2 : 0.0
        note = rawValue === 0.0 ? 'Zero rain (completely dry)' : 'Rare desert convective cloudburst'
      } else if (locationId === 'svalbard') {
        rawValue = 1.2 + Math.sin(idx * 0.5) * 0.8
        note = 'Light Arctic snow / drizzle'
      } else if (locationId === 'pacific') {
        rawValue = 8.5 + Math.cos(idx) * 4.2
        note = 'Pelagic squall precipitation'
      } else if (locationId === 'greenland') {
        rawValue = 0.8 + (idx % 3 === 0 ? 0.6 : 0)
        note = 'Light ice-crystal snowfall'
      } else {
        // Western Ghats: torrential monsoon in Jun-Aug
        rawValue = (idx >= 5 && idx <= 8) ? 35.0 + (idx === 6 ? 28.0 : 12.0) : (idx <= 3 ? 0.2 : 4.5)
        note = rawValue > 30 ? 'Torrential monsoon downpour' : 'Dry season clear skies'
      }
    } else if (datasetId === 'wind_speed') {
      if (locationId === 'svalbard') {
        rawValue = 12.5 + Math.sin(idx * 1.1) * 6.5
        note = rawValue > 15 ? 'Polar maritime gale' : 'Brisk Arctic breeze'
      } else if (locationId === 'sahara') {
        rawValue = 7.2 + Math.cos(idx * 0.9) * 3.4
        note = rawValue > 9 ? 'Harmattan desert dust gusts' : 'Moderate desert thermal wind'
      } else {
        rawValue = 4.5 + Math.sin(idx * 0.7) * 2.8
        note = 'Moderate atmospheric breeze'
      }
    } else if (datasetId === 'vegetation') {
      if (locationId === 'amazon') {
        rawValue = 0.78 + Math.cos(idx / 12 * Math.PI * 2) * 0.12
        note = 'Lush tropical evergreen canopy'
      } else if (locationId === 'sahara') {
        rawValue = 0.04 + (idx === 7 ? 0.06 : 0.01)
        note = 'Bare desert soil and sand'
      } else if (locationId === 'shivamogga') {
        rawValue = idx >= 6 && idx <= 9 ? 0.84 : 0.52
        note = idx >= 6 ? 'Peak monsoon canopy foliage' : 'Dry deciduous canopy foliage'
      } else {
        rawValue = 0.12
        note = 'Sparse tundra or open water'
      }
    } else {
      // ocean_sst
      if (locationId === 'pacific') {
        rawValue = 29.4 + Math.sin(idx * 0.5) * 1.4
        anomaly = rawValue - 29.8
        note = 'Equatorial Pacific warm pool'
      } else if (locationId === 'svalbard') {
        rawValue = 2.1 + (idx >= 6 && idx <= 8 ? 3.2 : -1.2)
        anomaly = rawValue - 2.5
        note = 'Polar maritime surface water'
      } else if (locationId === 'greenland') {
        rawValue = -1.2 + (idx >= 6 && idx <= 8 ? 2.5 : 0.2)
        anomaly = rawValue - (-0.5)
        note = 'Arctic coastal ocean water'
      } else if (locationId === 'shivamogga') {
        rawValue = 28.5 + Math.cos(idx * 0.5) * 1.2
        anomaly = rawValue - 28.2
        note = 'Arabian Sea coastal water'
      } else if (locationId === 'amazon') {
        rawValue = 27.8 + Math.sin(idx * 0.4) * 0.9
        anomaly = rawValue - 27.5
        note = 'Tropical Atlantic coastal plume'
      } else {
        // Sahara
        rawValue = 24.2 + (idx >= 5 && idx <= 8 ? 4.5 : -1.0)
        anomaly = rawValue - 24.0
        note = 'Mediterranean coastal water'
      }
    }

    // Normalized index in [0, 1]
    const clampedRaw = typeof rawValue === 'number' && !isNaN(rawValue) ? Number(rawValue.toFixed(2)) : 20.0

    return {
      index: idx,
      date,
      monthName: monthNames[idx],
      value: clampedRaw,
      anomaly: typeof anomaly === 'number' && !isNaN(anomaly) ? Number(anomaly.toFixed(2)) : 0.0,
      note: note || 'Observation frame'
    }
  })
}

export default function AudioFirstDataExplorer({ className = '' }) {
  const {
    accessibilityMode,
    highContrast,
    isSpeaking,
    speak,
    stopSpeaking,
    speechRate,
    announce,
    playEarcon,
    activeLocation: globalLocation,
    setActiveLocation: setGlobalLocation,
    announceLocation,
    announceDataset,
    announceDataChange,
    announceSoundRelationship
  } = useAccessibility()

  // Active Station & Dataset Selection
  const [selectedLocationId, setSelectedLocationId] = useState('amazon')
  const [selectedDatasetId, setSelectedDatasetId] = useState('temperature')

  // Sequence Timeline State
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0) // 0.25x to 2.0x
  const [volume, setVolume] = useState(85)
  const [isMuted, setIsMuted] = useState(false)
  const [viewMode, setViewMode] = useState('console') // 'console' | 'table' | 'descriptions'

  const timerRef = useRef(null)
  const isPlayingRef = useRef(isPlaying)
  isPlayingRef.current = isPlaying

  const currentLocation = ACCESSIBLE_LOCATIONS.find(l => l.id === selectedLocationId) || ACCESSIBLE_LOCATIONS[0]
  const currentDataset = ACCESSIBLE_DATASETS.find(d => d.id === selectedDatasetId) || ACCESSIBLE_DATASETS[0]

  // Time series generation
  const timeSeries = React.useMemo(() => {
    return generateStationTimeSeries(selectedLocationId, selectedDatasetId)
  }, [selectedLocationId, selectedDatasetId])

  const currentStep = timeSeries[currentIndex] || timeSeries[0] || {
    index: 0,
    date: '2024-01-15',
    monthName: 'January',
    value: 20.0,
    anomaly: 0.0,
    note: 'Baseline observation'
  }
  const prevStep = currentIndex > 0 && timeSeries[currentIndex - 1] ? timeSeries[currentIndex - 1] : null

  // Delta calculation with full null-safety
  const deltaValue = (prevStep && typeof currentStep?.value === 'number' && typeof prevStep?.value === 'number')
    ? Number((currentStep.value - prevStep.value).toFixed(2))
    : 0.0

  // Acoustic sonification mapping computation
  const acousticInfo = React.useMemo(() => {
    const val = typeof currentStep?.value === 'number' ? currentStep.value : 20.0
    if (selectedDatasetId === 'temperature') {
      const mapped = mapTemperatureToPitch(val)
      return {
        frequencyHz: mapped.frequencyHz,
        midiNote: mapped.midiNote,
        noteName: mapped.noteName,
        detail: `Pitch: ${Math.round(mapped.frequencyHz)} Hz (${mapped.noteName}). Higher pitch corresponds to higher thermal energy.`
      }
    } else if (selectedDatasetId === 'precipitation') {
      const mapped = mapPrecipitationToAcousticRhythm(val)
      if (mapped.isDry) {
        return {
          frequencyHz: 0,
          midiNote: 0,
          noteName: 'REST (SILENCE)',
          detail: 'Acoustic Rest: 0.0 mm dry day produces complete silence. No deceptive audio.'
        }
      }
      return {
        frequencyHz: 440,
        midiNote: 69,
        noteName: `${Math.round(mapped.pulseDensity * 100)}% density`,
        detail: `Rain percussion: ${Math.round(mapped.intervalMs)} ms pulse rate at ${Math.round(mapped.gainLinear * 100)}% volume.`
      }
    } else if (selectedDatasetId === 'wind_speed') {
      const mapped = mapWindSpeedToModulation(val)
      return {
        frequencyHz: mapped.filterCutoffHz,
        midiNote: 60,
        noteName: `Beaufort ${mapped.beaufortScale}`,
        detail: `Wind texture: ${mapped.lfoRateHz?.toFixed ? mapped.lfoRateHz.toFixed(1) : mapped.lfoRateHz} Hz flutter with ${Math.round(mapped.filterCutoffHz)} Hz bandpass whistling.`
      }
    } else if (selectedDatasetId === 'vegetation') {
      const mapped = mapVegetationToTimbre(val)
      return {
        frequencyHz: 220,
        midiNote: 57,
        noteName: mapped.waveform.toUpperCase(),
        detail: `Canopy timbre: ${mapped.waveform} wave with ${mapped.overtoneCount} overtones representing ${typeof val === 'number' ? val.toFixed(2) : val} NDVI greenness.`
      }
    } else {
      // ocean_sst
      const mapped = mapOceanToFoundationDrone(val)
      return {
        frequencyHz: mapped.subBassHz,
        midiNote: 36,
        noteName: 'SUB-BASS',
        detail: `Ocean drone: ${mapped.subBassHz?.toFixed ? mapped.subBassHz.toFixed(1) : mapped.subBassHz} Hz sub-bass foundation with ${mapped.tidalChorusRateHz?.toFixed ? mapped.tidalChorusRateHz.toFixed(2) : mapped.tidalChorusRateHz} Hz tidal chorusing.`
      }
    }
  }, [currentStep, selectedDatasetId])

  // Play single note via Web Audio API engine
  const auditionCurrentStep = useCallback((stepIndex) => {
    const step = timeSeries[stepIndex]
    if (!step) return

    try {
      if (earthSonificationEngine.ctx?.state === 'suspended') {
        earthSonificationEngine.ctx.resume()
      }

      // Configure volume and instrument
      earthSonificationEngine.setVolume(isMuted ? 0 : volume / 100)

      const val = step.value
      if (selectedDatasetId === 'temperature') {
        earthSonificationEngine.setInstrument('penta_synth')
        const mapped = mapTemperatureToPitch(val)
        if (!mapped.isMissing && mapped.frequencyHz > 0) {
          earthSonificationEngine.playTone(mapped.frequencyHz, 0.45, {
            type: 'sine',
            gainMultiplier: 0.8
          })
        }
      } else if (selectedDatasetId === 'precipitation') {
        earthSonificationEngine.setInstrument('droplet_percussion')
        const mapped = mapPrecipitationToAcousticRhythm(val)
        if (!mapped.isDry && !mapped.isMissing) {
          earthSonificationEngine.playTone(520, 0.25, {
            type: 'triangle',
            gainMultiplier: Math.max(0.1, mapped.gainLinear)
          })
        }
      } else if (selectedDatasetId === 'wind_speed') {
        earthSonificationEngine.setInstrument('atmospheric_pad')
        const mapped = mapWindSpeedToModulation(val)
        earthSonificationEngine.playTone(mapped.filterCutoffHz, 0.5, {
          type: 'sawtooth',
          gainMultiplier: 0.6
        })
      } else if (selectedDatasetId === 'vegetation') {
        earthSonificationEngine.setInstrument('acoustic_marimba')
        const mapped = mapVegetationToTimbre(val)
        earthSonificationEngine.playTone(261.63 + (val * 150), 0.4, {
          type: mapped.waveform,
          gainMultiplier: 0.7
        })
      } else {
        // ocean_sst
        earthSonificationEngine.setInstrument('planetary_drone')
        const mapped = mapOceanToFoundationDrone(val)
        earthSonificationEngine.playTone(mapped.subBassHz, 0.6, {
          type: 'sine',
          gainMultiplier: 0.85
        })
      }
    } catch (e) {
      // AudioContext handled gracefully
    }
  }, [timeSeries, selectedDatasetId, isMuted, volume])

  // Step sequencer tick
  useEffect(() => {
    if (isPlaying) {
      const intervalMs = Math.round(1100 / playbackSpeed)
      timerRef.current = setInterval(() => {
        setCurrentIndex(prev => {
          const next = (prev + 1) % timeSeries.length
          auditionCurrentStep(next)
          return next
        })
      }, intervalMs)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isPlaying, playbackSpeed, timeSeries.length, auditionCurrentStep])

  // Sync with global location & dataset
  useEffect(() => {
    if (currentLocation && setGlobalLocation) {
      setGlobalLocation({
        id: currentLocation.id,
        name: currentLocation.name,
        lat: currentLocation.lat,
        lon: currentLocation.lon,
        coordinatesText: currentLocation.coordinatesText,
        biome: currentLocation.biome,
        climate: currentLocation.climate
      })
    }
  }, [currentLocation, setGlobalLocation])

  // Handle Location Switch
  const handleSelectLocation = (locId) => {
    setSelectedLocationId(locId)
    setCurrentIndex(0)
    setIsPlaying(false)
    const loc = ACCESSIBLE_LOCATIONS.find(l => l.id === locId)
    if (loc) {
      announceLocation(loc)
    }
  }

  // Handle Dataset Switch
  const handleSelectDataset = (dsId) => {
    setSelectedDatasetId(dsId)
    setCurrentIndex(0)
    setIsPlaying(false)
    // If selecting Sea Surface Temperature while on a terrestrial station, gracefully auto-switch to Equatorial Pacific Warm Pool
    if (dsId === 'ocean_sst' && (selectedLocationId === 'amazon' || selectedLocationId === 'sahara')) {
      setSelectedLocationId('pacific')
      const pac = ACCESSIBLE_LOCATIONS.find(l => l.id === 'pacific')
      if (pac) announceLocation(pac)
    }
    const ds = ACCESSIBLE_DATASETS.find(d => d.id === dsId)
    if (ds) {
      announceDataset(ds)
    }
  }

  // Seek to specific timestamp
  const handleSeek = (index) => {
    setCurrentIndex(index)
    playEarcon('seek')
    auditionCurrentStep(index)
    const step = timeSeries[index]
    if (step) {
      announce(`Frame ${index + 1} of ${timeSeries.length}: ${step.monthName} ${step.date}, value is ${step.value} ${currentDataset.unit}.`)
    }
  }

  // Play / Pause Toggle
  const handlePlayToggle = () => {
    const next = !isPlaying
    setIsPlaying(next)
    playEarcon(next ? 'play' : 'pause')
    announce(next ? `Started sonification playback at ${playbackSpeed}x speed.` : `Paused sonification at ${currentStep.monthName} ${currentStep.date}.`)
    if (next) {
      auditionCurrentStep(currentIndex)
    }
  }

  // Stop & Rewind to Frame 1
  const handleStop = () => {
    setIsPlaying(false)
    setCurrentIndex(0)
    playEarcon('stop')
    announce('Stopped sonification. Rewound to Frame 1.')
  }

  // Step Forward / Backward
  const handleStepForward = () => {
    const next = (currentIndex + 1) % timeSeries.length
    handleSeek(next)
  }

  const handleStepBackward = () => {
    const prev = (currentIndex - 1 + timeSeries.length) % timeSeries.length
    handleSeek(prev)
  }

  // Speed Presets
  const speedPresets = [0.25, 0.5, 1.0, 1.5, 2.0]
  const handleSpeedChange = (spd) => {
    setPlaybackSpeed(spd)
    playEarcon('volume')
    announce(`Playback speed set to ${spd}x`)
  }

  // Spoken Narration: Current Observation
  const handleSpeakCurrentObservation = () => {
    const deltaText = prevStep
      ? (deltaValue > 0 ? `up by ${Math.abs(deltaValue)} ${currentDataset.unit}` : `down by ${Math.abs(deltaValue)} ${currentDataset.unit}`)
      : 'initial baseline'
    const text = `Observation at ${currentLocation.name} for ${currentStep.monthName} ${currentStep.date}. Measurement: ${currentStep.value} ${currentDataset.unit}. Change from previous: ${deltaText}. Acoustic pitch: ${Math.round(acousticInfo.frequencyHz)} Hertz. Scientific note: ${currentStep.note}.`
    speak(text)
  }

  // Spoken Narration: Full Dataset Overview
  const handleSpeakDatasetOverview = () => {
    const desc = ACCESSIBLE_DESCRIPTIONS[selectedDatasetId] || ACCESSIBLE_DESCRIPTIONS.surface_temperature
    const text = `${currentDataset.name}, sourced from ${currentDataset.mission}. Native units: ${currentDataset.unit}. ${desc.whatItRepresents} How it sounds: ${currentDataset.soundMapping}`
    speak(text)
  }

  // Spoken Narration: Time Series Statistical Summary
  const handleSpeakSummary = () => {
    const vals = timeSeries.map(t => t.value)
    const minVal = Math.min(...vals).toFixed(1)
    const maxVal = Math.max(...vals).toFixed(1)
    const avgVal = (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)
    const text = `Annual summary for ${currentDataset.name} at ${currentLocation.name}. Minimum: ${minVal} ${currentDataset.unit}. Maximum: ${maxVal} ${currentDataset.unit}. Average: ${avgVal} ${currentDataset.unit}. Current frame is ${currentIndex + 1} of ${timeSeries.length}.`
    speak(text)
  }

  return (
    <section
      role="region"
      aria-label="Audio-First Accessible Earth Data Explorer"
      className={`rounded-2xl border transition-all ${
        highContrast
          ? 'bg-black text-white border-2 border-yellow-400 p-6'
          : 'bg-slate-900/90 border-cyan-500/30 backdrop-blur-xl text-slate-100 p-6 shadow-2xl'
      } ${className}`}
    >
      
      {/* Top Banner & Header */}
      <div className="pb-5 border-b border-cyan-500/20 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <div className={`p-2 rounded-xl ${highContrast ? 'bg-yellow-400 text-black' : 'bg-cyan-500/20 text-cyan-300'}`}>
                <EyeOff className="w-5 h-5" />
              </div>
              <h2 className="text-xl md:text-2xl font-extrabold tracking-tight">
                Audio-First Earth Data Explorer
              </h2>
              <Badge variant="emerald" size="sm">ZERO-GLOBE ACCESSIBLE</Badge>
            </div>
            <p className="text-xs text-slate-400 font-mono max-w-3xl leading-relaxed">
              Designed specifically for blind, low-vision, and keyboard-first researchers. Explore authentic NASA Earth observations through procedural Web Audio sonification, spoken descriptions, high-contrast tables, and keyboard keys—with zero reliance on 3D visual globe rendering.
            </p>
          </div>

          {/* Spoken Guidance Action Button */}
          <div className="flex items-center space-x-2 shrink-0">
            <Button
              variant="secondary"
              size="sm"
              icon={isSpeaking ? VolumeX : Headphones}
              onClick={handleSpeakDatasetOverview}
              aria-label="Listen to spoken overview of current dataset and sound mappings"
              className="font-bold text-xs"
            >
              {isSpeaking ? 'Stop Voice' : 'Dataset Voice Guide (D)'}
            </Button>
            
            <Button
              variant={viewMode === 'table' ? 'primary' : 'ghost'}
              size="sm"
              icon={Table}
              onClick={() => setViewMode(viewMode === 'table' ? 'console' : 'table')}
              aria-label={viewMode === 'table' ? "Switch to Audio Console View" : "Switch to Accessible Screen-Reader Data Table"}
              className="text-xs font-mono"
            >
              {viewMode === 'table' ? 'Console View' : 'Table View'}
            </Button>
          </div>
        </div>
      </div>

      {/* Station & Dataset Selectors (Keyboard & Screen-Reader Optimized) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        
        {/* Location Station Selector */}
        <div className={`p-4 rounded-xl border ${
          highContrast ? 'bg-black border-white' : 'bg-slate-950/70 border-slate-800'
        }`}>
          <label
            htmlFor="accessible-location-select"
            className="block text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider mb-2 flex items-center justify-between"
          >
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              <span>1. SELECT OBSERVATORY STATION:</span>
            </span>
            <span className="text-[10px] text-slate-400 font-normal">Use Up/Down Arrows</span>
          </label>

          <select
            id="accessible-location-select"
            value={selectedLocationId}
            onChange={(e) => handleSelectLocation(e.target.value)}
            aria-label="Select planetary observatory station"
            className={`w-full p-2.5 rounded-lg text-sm font-semibold transition-all focus:ring-2 focus:ring-cyan-400 focus:outline-none ${
              highContrast
                ? 'bg-black text-white border-2 border-white'
                : 'bg-slate-900 text-slate-100 border border-slate-700 hover:border-cyan-500'
            }`}
          >
            {ACCESSIBLE_LOCATIONS.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name} ({loc.coordinatesText}) - {loc.biome}
              </option>
            ))}
          </select>

          {/* Selected Station Telemetry Badge */}
          <div className="mt-2.5 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>Coordinates: <strong className="text-slate-200">{currentLocation.coordinatesText}</strong></span>
            <span>Climate: <strong className="text-cyan-300">{currentLocation.climate}</strong></span>
          </div>
        </div>

        {/* Scientific Dataset Selector */}
        <div className={`p-4 rounded-xl border ${
          highContrast ? 'bg-black border-white' : 'bg-slate-950/70 border-slate-800'
        }`}>
          <label
            htmlFor="accessible-dataset-select"
            className="block text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center justify-between"
          >
            <span className="flex items-center gap-1.5">
              <Layers className="w-4 h-4" />
              <span>2. SELECT SCIENTIFIC DATASET:</span>
            </span>
            <span className="text-[10px] text-slate-400 font-normal">Use Up/Down Arrows</span>
          </label>

          <select
            id="accessible-dataset-select"
            value={selectedDatasetId}
            onChange={(e) => handleSelectDataset(e.target.value)}
            aria-label="Select scientific dataset for sonification"
            className={`w-full p-2.5 rounded-lg text-sm font-semibold transition-all focus:ring-2 focus:ring-cyan-400 focus:outline-none ${
              highContrast
                ? 'bg-black text-white border-2 border-white'
                : 'bg-slate-900 text-slate-100 border border-slate-700 hover:border-emerald-500'
            }`}
          >
            {ACCESSIBLE_DATASETS.map((ds) => (
              <option key={ds.id} value={ds.id}>
                {ds.name} ({ds.unit})
              </option>
            ))}
          </select>

          {/* Selected Dataset Provenance Badge */}
          <div className="mt-2.5 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span className="truncate">Mission: <strong className="text-slate-200">{currentDataset.mission}</strong></span>
            <span>Units: <strong className="text-emerald-300">{currentDataset.unit}</strong></span>
          </div>
        </div>

      </div>

      {/* VIEW MODE 1: Interactive Audio Console & Live HUD */}
      {viewMode === 'console' && (
        <div className="space-y-6">
          
          {/* Main Large-Type Telemetry HUD */}
          <div
            role="status"
            aria-live="polite"
            className={`p-6 rounded-2xl border relative overflow-hidden ${
              highContrast
                ? 'bg-black text-white border-2 border-yellow-400'
                : 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-cyan-500/30 shadow-xl'
            }`}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              
              {/* Left Column: Timestamp & Step Position */}
              <div className="space-y-1">
                <div className="flex items-center space-x-1.5 text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">
                  <Calendar className="w-4 h-4" />
                  <span>OBSERVATION TIMESTAMP:</span>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
                  {currentStep.monthName} 2024
                </div>
                <p className="text-xs text-slate-400 font-mono">
                  Date: {currentStep.date} • Frame {currentIndex + 1} of {timeSeries.length}
                </p>
                {isPlaying && (
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 font-bold uppercase mt-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    SONIFICATION ACTIVE
                  </span>
                )}
              </div>

              {/* Center Column: Big Bold Numerical Reading */}
              <div className="text-center md:border-x border-slate-800 md:px-4 py-2 space-y-1">
                <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                  {currentDataset.name}
                </div>
                <div className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-200 to-emerald-300 font-mono tracking-tight">
                  {currentStep.value} <span className="text-xl sm:text-2xl text-slate-300 font-normal">{currentDataset.unit}</span>
                </div>
                <div className="flex items-center justify-center gap-2 pt-1">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono ${
                    currentStep.anomaly >= 0
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                  }`}>
                    {currentStep.anomaly >= 0 ? '+' : ''}{currentStep.anomaly} {currentDataset.unit} anomaly
                  </span>
                </div>
              </div>

              {/* Right Column: Physical State & Audio Delta */}
              <div className="space-y-2">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                    PHYSICAL CLASSIFICATION:
                  </span>
                  <span className="text-sm font-bold text-slate-200">
                    {currentStep.note}
                  </span>
                </div>

                <div className={`p-2.5 rounded-lg border text-xs font-mono ${
                  highContrast ? 'bg-black border-white' : 'bg-slate-900/80 border-slate-800'
                }`}>
                  <div className="flex items-center justify-between text-[10px] text-cyan-400 font-bold mb-0.5">
                    <span>DELTA CHANGE (Δ):</span>
                    <span>{deltaValue >= 0 ? `+${deltaValue}` : deltaValue} {currentDataset.unit}</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    {prevStep
                      ? (deltaValue > 0
                          ? `Increased by +${Math.abs(deltaValue)} ${currentDataset.unit} from ${prevStep.monthName}.`
                          : deltaValue < 0
                          ? `Decreased by -${Math.abs(deltaValue)} ${currentDataset.unit} from ${prevStep.monthName}.`
                          : `No change from ${prevStep.monthName}.`)
                      : 'Initial observation frame.'}
                  </p>
                </div>
              </div>

            </div>

            {/* Read Current Observation aloud */}
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-2 text-xs font-mono text-slate-300">
                <Volume2 className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>{acousticInfo.detail}</span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleSpeakCurrentObservation}
                  aria-label="Speak current observation measurement, delta, and acoustic parameters aloud"
                  className="px-2.5 py-1 rounded text-xs font-mono text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 transition-colors focus:ring-2 focus:ring-cyan-400 focus:outline-none"
                >
                  Speak Frame (C)
                </button>
                <button
                  onClick={handleSpeakSummary}
                  aria-label="Speak statistical summary: minimum, maximum, and average"
                  className="px-2.5 py-1 rounded text-xs font-mono text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition-colors focus:ring-2 focus:ring-emerald-400 focus:outline-none"
                >
                  Speak Summary
                </button>
              </div>
            </div>
          </div>

          {/* Accessible Transport Dock (Keyboard, Screen-Reader & Audio Focused) */}
          <div className={`p-4 rounded-xl border space-y-4 ${
            highContrast ? 'bg-black border-white' : 'bg-slate-950/80 border-slate-800'
          }`}>
            
            {/* Control Buttons Strip */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              
              {/* Playback Transport Buttons */}
              <div className="flex items-center space-x-2">
                
                {/* Play / Pause */}
                <button
                  onClick={handlePlayToggle}
                  aria-label={isPlaying ? "Pause sonification sequence [Shortcut: Space]" : "Play sonification sequence [Shortcut: Space]"}
                  aria-pressed={isPlaying}
                  className={`px-4 py-2 rounded-xl font-bold font-mono text-xs flex items-center space-x-2 transition-all shadow-md focus:ring-2 focus:ring-cyan-400 focus:outline-none ${
                    isPlaying
                      ? 'bg-amber-400 text-slate-950 hover:bg-amber-300'
                      : highContrast
                      ? 'bg-yellow-400 text-black hover:bg-yellow-300'
                      : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 hover:from-cyan-400 hover:to-blue-500'
                  }`}
                >
                  {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                  <span>{isPlaying ? 'PAUSE (Space)' : 'PLAY SONIFICATION (Space)'}</span>
                </button>

                {/* Stop & Rewind */}
                <button
                  onClick={handleStop}
                  aria-label="Stop audio exploration and rewind to first frame [Shortcut: s]"
                  className="p-2 rounded-xl text-slate-300 hover:text-white bg-slate-900 border border-slate-700 hover:bg-slate-800 transition-colors focus:ring-2 focus:ring-cyan-400 focus:outline-none"
                  title="Stop and Rewind (s)"
                >
                  <Square className="w-4 h-4" />
                </button>

                {/* Step Backward */}
                <button
                  onClick={handleStepBackward}
                  aria-label="Step backward one frame [Shortcut: Left Arrow or []"
                  className="p-2 rounded-xl text-slate-300 hover:text-white bg-slate-900 border border-slate-700 hover:bg-slate-800 transition-colors focus:ring-2 focus:ring-cyan-400 focus:outline-none"
                  title="Step Backward ([)"
                >
                  <SkipBack className="w-4 h-4" />
                </button>

                {/* Step Forward */}
                <button
                  onClick={handleStepForward}
                  aria-label="Step forward one frame [Shortcut: Right Arrow or ]]"
                  className="p-2 rounded-xl text-slate-300 hover:text-white bg-slate-900 border border-slate-700 hover:bg-slate-800 transition-colors focus:ring-2 focus:ring-cyan-400 focus:outline-none"
                  title="Step Forward (])"
                >
                  <SkipForward className="w-4 h-4" />
                </button>

              </div>

              {/* Playback Speed Preset Controls */}
              <div className="flex items-center space-x-1 font-mono text-xs">
                <span className="text-slate-400 pr-1 hidden sm:inline">Speed:</span>
                {speedPresets.map((spd) => {
                  const isActive = playbackSpeed === spd
                  return (
                    <button
                      key={spd}
                      onClick={() => handleSpeedChange(spd)}
                      aria-pressed={isActive}
                      aria-label={`Set playback speed to ${spd}x`}
                      className={`px-2 py-1 rounded text-xs font-bold transition-all focus:ring-2 focus:ring-cyan-400 focus:outline-none ${
                        isActive
                          ? highContrast
                            ? 'bg-yellow-400 text-black border border-white'
                            : 'bg-cyan-500 text-slate-950 border border-cyan-300 shadow'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {spd}x
                    </button>
                  )
                })}
              </div>

              {/* Master Volume Slider & Mute Toggle */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    const nextMuted = !isMuted
                    setIsMuted(nextMuted)
                    playEarcon('volume')
                    announce(nextMuted ? 'Audio muted' : `Audio unmuted, volume ${volume} percent`)
                  }}
                  aria-label={isMuted ? "Unmute audio sonification [Shortcut: m]" : "Mute audio sonification [Shortcut: m]"}
                  aria-pressed={isMuted}
                  className="p-2 rounded-xl text-slate-300 hover:text-white bg-slate-900 border border-slate-700 hover:bg-slate-800 transition-colors focus:ring-2 focus:ring-cyan-400 focus:outline-none"
                  title="Toggle Mute (m)"
                >
                  {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
                </button>

                <div className="flex items-center space-x-1.5">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => {
                      const v = Number(e.target.value)
                      setVolume(v)
                      if (isMuted) setIsMuted(false)
                      earthSonificationEngine.setVolume(v / 100)
                      announce(`Volume ${v} percent`)
                    }}
                    role="slider"
                    aria-label="Sonification Master Volume"
                    aria-valuenow={isMuted ? 0 : volume}
                    aria-valuemin="0"
                    aria-valuemax="100"
                    aria-valuetext={`${isMuted ? 0 : volume} percent`}
                    className="w-20 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  />
                  <span className="text-[10px] font-mono text-slate-400 w-7 text-right">
                    {isMuted ? '0%' : `${volume}%`}
                  </span>
                </div>
              </div>

            </div>

            {/* Accessible Timeline Scrubber: Step Buttons with full ARIA attributes */}
            <div className="pt-2">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-2">
                <span>TIMELINE SCRUBBER (Click or use Left/Right Arrows):</span>
                <span>Frame {currentIndex + 1} of {timeSeries.length}</span>
              </div>

              <div
                role="radiogroup"
                aria-label="Earth Observation Timeline Steps"
                className="grid grid-cols-6 sm:grid-cols-12 gap-1.5"
              >
                {timeSeries.map((item, idx) => {
                  const isCurrent = idx === currentIndex
                  return (
                    <button
                      key={item.date}
                      role="radio"
                      aria-checked={isCurrent}
                      onClick={() => handleSeek(idx)}
                      aria-label={`Frame ${idx + 1}: ${item.monthName} ${item.date}, ${item.value} ${currentDataset.unit}. Press Enter to audition.`}
                      className={`p-2 rounded-lg text-center transition-all focus:ring-2 focus:ring-cyan-400 focus:outline-none ${
                        isCurrent
                          ? highContrast
                            ? 'bg-yellow-400 text-black font-extrabold border-2 border-white scale-105'
                            : 'bg-cyan-500 text-slate-950 font-extrabold border border-cyan-200 shadow-lg shadow-cyan-500/30 scale-105'
                          : highContrast
                          ? 'bg-black text-white border border-slate-700 hover:border-white'
                          : 'bg-slate-900/90 text-slate-300 border border-slate-800 hover:border-slate-600 hover:bg-slate-800'
                      }`}
                    >
                      <div className="text-[10px] font-mono uppercase font-bold truncate">
                        {item.monthName.slice(0, 3)}
                      </div>
                      <div className="text-[11px] font-mono mt-0.5 truncate">
                        {item.value}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

          </div>

          {/* Scientific Parameter & Sound Explanation Section */}
          <div className={`p-4 rounded-xl border space-y-2 ${
            highContrast ? 'bg-black border-white' : 'bg-slate-950/60 border-slate-800'
          }`}>
            <div className="flex items-center space-x-2 text-xs font-mono font-bold text-cyan-400 uppercase">
              <Info className="w-4 h-4" />
              <span>Acoustic & Scientific Mapping Explanation:</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              {currentDataset.soundMapping}
            </p>
          </div>

        </div>
      )}

      {/* VIEW MODE 2: Comprehensive Accessible Data Table for Screen Readers */}
      {viewMode === 'table' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-mono font-bold text-cyan-400 uppercase tracking-wider">
              Accessible Data Table: {currentDataset.name} ({currentLocation.name})
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              Screen-reader table navigation: Use Table Navigation keys (Ctrl+Alt+Arrows)
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table
              className="w-full text-left text-xs font-mono"
              aria-label={`Time series table for ${currentDataset.name} at ${currentLocation.name}`}
            >
              <caption className="sr-only">
                Twelve-month observation data for {currentDataset.name} measured in {currentDataset.unit} at {currentLocation.name}.
              </caption>
              
              <thead className={`border-b ${
                highContrast ? 'bg-black border-white text-white' : 'bg-slate-950 text-cyan-300 border-slate-800'
              }`}>
                <tr>
                  <th scope="col" className="p-3">Frame</th>
                  <th scope="col" className="p-3">Month & Date</th>
                  <th scope="col" className="p-3">Value ({currentDataset.unit})</th>
                  <th scope="col" className="p-3">Anomaly</th>
                  <th scope="col" className="p-3">Physical Condition</th>
                  <th scope="col" className="p-3 text-right">Audition Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800">
                {timeSeries.map((item, idx) => {
                  const isCurrent = idx === currentIndex
                  return (
                    <tr
                      key={item.date}
                      className={`transition-colors ${
                        isCurrent
                          ? highContrast
                            ? 'bg-yellow-400 text-black font-bold'
                            : 'bg-cyan-500/15 text-white font-semibold'
                          : 'hover:bg-slate-800/40'
                      }`}
                    >
                      <th scope="row" className="p-3 font-mono">
                        #{idx + 1}
                      </th>
                      <td className="p-3">
                        {item.monthName} ({item.date})
                      </td>
                      <td className="p-3 font-bold">
                        {item.value} {currentDataset.unit}
                      </td>
                      <td className="p-3">
                        {item.anomaly >= 0 ? `+${item.anomaly}` : item.anomaly} {currentDataset.unit}
                      </td>
                      <td className="p-3">
                        {item.note}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleSeek(idx)}
                          aria-label={`Audition Frame ${idx + 1}: ${item.monthName}, ${item.value} ${currentDataset.unit}`}
                          className={`px-2.5 py-1 rounded text-[11px] font-mono transition-colors focus:ring-2 focus:ring-cyan-400 focus:outline-none ${
                            isCurrent
                              ? 'bg-slate-950 text-white font-bold'
                              : 'bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30'
                          }`}
                        >
                          Audition Note
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Keyboard Instructions Footer */}
      <div className="mt-6 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-slate-400">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-cyan-400">KEYBOARD CONTROLS:</span>
          <span>Space (Play/Pause)</span>
          <span>•</span>
          <span>S (Stop)</span>
          <span>•</span>
          <span>[ / ] (Step Back/Forward)</span>
          <span>•</span>
          <span>M (Mute)</span>
          <span>•</span>
          <span>C (Speak Frame)</span>
          <span>•</span>
          <span>D (Dataset Guide)</span>
          <span>•</span>
          <span>? (All Shortcuts)</span>
        </div>

        <button
          onClick={() => {
            const guide = `Audio-First Explorer Keyboard shortcuts: Spacebar plays or pauses procedural sonification. Letter S stops audio and returns to frame 1. Square brackets step backward and forward through timestamps. Letter M mutes or unmutes sound. Letter C reads the active observation aloud. Letter D reads the dataset overview. Question mark opens the complete shortcuts guide.`
            speak(guide)
          }}
          aria-label="Listen to keyboard navigation audio tutorial"
          className="text-cyan-300 hover:text-white underline underline-offset-2 decoration-cyan-500 focus:ring-2 focus:ring-cyan-400 focus:outline-none"
        >
          Hear Audio Tutorial
        </button>
      </div>

    </section>
  )
}
