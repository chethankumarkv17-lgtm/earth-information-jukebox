import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

import {
  Globe2,
  Compass,
  Layers,
  Activity,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  Sliders,
  Waves,
  MapPin,
  ChevronRight,
  Maximize2,
  Minimize2,
  AlertCircle,
  ShieldCheck,
  Split,
  Eye,
  Info,
  Sparkles,
  ArrowRightLeft,
  Navigation,
  Crosshair,
  Calendar,
  Download,
  Check
} from 'lucide-react'

import GlassPanel from '../common/GlassPanel'
import Button from '../common/Button'
import Badge from '../common/Badge'
import WaveformDisplay from '../common/WaveformDisplay'
import { GEOGRAPHIC_REGIONS, VISUALIZATION_LAYERS } from '../../data/geographicRegions'
import globalSonificationEngine, { MUSICAL_STYLES } from '../../services/sonificationEngine'
import { fetchEarthRegionAnalysis } from '../../services/api'

export default function InteractiveMapExplorer({ onNavigate }) {
  // Map container reference & Leaflet instance
  const mapContainerRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef([])
  const gibsTileLayerRef = useRef(null)

  // Selection states
  const [selectedRegionId, setSelectedRegionId] = useState('region-arctic')
  const [activeLayerId, setActiveLayerId] = useState('true_color')
  const [selectedDate, setSelectedDate] = useState('2024-05-15')
  const [customPoint, setCustomPoint] = useState(null)

  // NASA GIBS & Scientific Telemetry States
  const [realScientificData, setRealScientificData] = useState(null)
  const [isLoadingScientificData, setIsLoadingScientificData] = useState(false)
  const [dataError, setDataError] = useState(null)

  // Comparison mode states (Region A vs Region B)
  const [isCompareMode, setIsCompareMode] = useState(false)
  const [compareRegionIdA, setCompareRegionIdA] = useState('region-amazon')
  const [compareRegionIdB, setCompareRegionIdB] = useState('region-arctic')
  const [crossfadeRatio, setCrossfadeRatio] = useState(0.0) // 0.0 (100% A) to 1.0 (100% B)

  // Audio state for regional exploration
  const [isPlayingRegion, setIsPlayingRegion] = useState(false)
  const [activeStyle, setActiveStyle] = useState('ambient_earth')
  const [isExportingCsv, setIsExportingCsv] = useState(false)

  // Retrieve region objects
  const activeRegion = GEOGRAPHIC_REGIONS.find(r => r.id === selectedRegionId) || GEOGRAPHIC_REGIONS[0]
  const regionA = GEOGRAPHIC_REGIONS.find(r => r.id === compareRegionIdA) || GEOGRAPHIC_REGIONS[1]
  const regionB = GEOGRAPHIC_REGIONS.find(r => r.id === compareRegionIdB) || GEOGRAPHIC_REGIONS[0]
  const activeLayer = VISUALIZATION_LAYERS.find(l => l.id === activeLayerId) || VISUALIZATION_LAYERS[0]
  const displayTarget = customPoint || activeRegion

  // Mission temporal bounds
  const todayStr = new Date().toISOString().split('T')[0]
  const minMissionDate = activeLayer.startDate || '2000-02-24'

  // Dynamic Mission Temporal Clamping
  useEffect(() => {
    if (!activeLayer) return
    const minEpoch = activeLayer.startDate || '2000-02-24'
    const todayEpoch = new Date().toISOString().split('T')[0]

    if (selectedDate !== 'default') {
      if (selectedDate < minEpoch) {
        setSelectedDate(minEpoch)
      } else if (selectedDate > todayEpoch) {
        setSelectedDate(todayEpoch)
      }
    }
  }, [activeLayerId, activeLayer, selectedDate])

  // Scientific Telemetry CSV Export
  const handleExportTelemetryCSV = () => {
    setIsExportingCsv(true)
    try {
      const timestamp = new Date().toISOString()
      const targetName = (displayTarget.name || 'Target_Point').replace(/[^a-zA-Z0-9_-]/g, '_')
      const fileName = `NASA_Telemetry_${targetName}_${selectedDate === 'default' ? 'latest' : selectedDate}.csv`

      let csv = "timestamp,region_name,latitude,longitude,category,mission_sensor,layer_id,layer_name,observation_date,measurement_name,measurement_value,unit,valid_pixel_pct,quality_flag,audio_root_note,audio_style,luminance_standard,dominant_hue_deg,edge_density_pct\n"

      const sensor = realScientificData?.metadata?.sensor || displayTarget.sensor || activeLayer.satellite
      const validPct = realScientificData?.data_quality?.valid_pixel_pct ?? 100
      const quality = realScientificData?.data_quality?.quality_flag || (displayTarget.scientificTelemetry?.isCalibrated ? 'OPTIMAL' : 'UNCALIBRATED')
      const obsDate = realScientificData?.acquisition_date || (selectedDate === 'default' ? todayStr : selectedDate)
      const lat = displayTarget.coordinates?.lat ?? displayTarget.lat ?? 0
      const lon = displayTarget.coordinates?.lng ?? displayTarget.coordinates?.lon ?? displayTarget.lng ?? 0
      const cat = displayTarget.category || 'General'

      if (realScientificData?.scientific_measurements && Object.keys(realScientificData.scientific_measurements).length > 0) {
        Object.entries(realScientificData.scientific_measurements).forEach(([key, m]) => {
          const row = [
            `"${timestamp}"`,
            `"${displayTarget.name}"`,
            lat,
            lon,
            `"${cat}"`,
            `"${sensor}"`,
            `"${activeLayer.id}"`,
            `"${activeLayer.name}"`,
            `"${obsDate}"`,
            `"${key} (${m.description || ''})"`,
            typeof m.value === 'number' ? m.value.toFixed(4) : `"${m.value}"`,
            `"${m.unit || ''}"`,
            validPct,
            `"${quality}"`,
            `"${displayTarget.sonification?.rootNote || 'D3'}"`,
            `"${activeStyle}"`,
            displayTarget.opticalAnalysis?.standardLuminance?.toFixed(1) || '0',
            displayTarget.opticalAnalysis?.meanHueDeg?.toFixed(1) || '0',
            displayTarget.opticalAnalysis?.edgeDensityPct || '0'
          ].join(",")
          csv += row + "\n"
        })
      } else {
        const row = [
          `"${timestamp}"`,
          `"${displayTarget.name}"`,
          lat,
          lon,
          `"${cat}"`,
          `"${sensor}"`,
          `"${activeLayer.id}"`,
          `"${activeLayer.name}"`,
          `"${obsDate}"`,
          `"${displayTarget.scientificTelemetry?.measurementName || 'Optical Variance'}"`,
          `"${displayTarget.scientificTelemetry?.value || 'N/A'}"`,
          `"${displayTarget.scientificTelemetry?.unit || ''}"`,
          validPct,
          `"${quality}"`,
          `"${displayTarget.sonification?.rootNote || 'D3'}"`,
          `"${activeStyle}"`,
          displayTarget.opticalAnalysis?.standardLuminance?.toFixed(1) || '0',
          displayTarget.opticalAnalysis?.meanHueDeg?.toFixed(1) || '0',
          displayTarget.opticalAnalysis?.edgeDensityPct || '0'
        ].join(",")
        csv += row + "\n"
      }

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.setAttribute("href", url)
      link.setAttribute("download", fileName)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.warn("CSV export error:", err)
    } finally {
      setTimeout(() => setIsExportingCsv(false), 800)
    }
  }

  // ==========================================================================
  // 1. LEAFLET MAP INITIALIZATION & EVENT BINDINGS
  // ==========================================================================
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return

    // Initialize Leaflet map with dark styling and bounds
    const map = L.map(mapContainerRef.current, {
      center: [25.0, 0.0],
      zoom: 2,
      minZoom: 2,
      maxZoom: 9,
      worldCopyJump: true,
      zoomControl: false,
    })

    // Custom Zoom Control placed top-right
    L.control.zoom({ position: 'topright' }).addTo(map)

    // High-performance Dark Gray Canvas basemap (Esri & NASA EOSDIS, no watermark)
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
      attribution: '&copy; Esri, NASA EOSDIS, Earth Jukebox',
      maxZoom: 16,
    }).addTo(map)

    // Store map instance
    mapInstanceRef.current = map

    // Map click handler for arbitrary custom coordinate sonification
    map.on('click', (e) => {
      const { lat, lng } = e.latlng
      const normLat = Math.round(lat * 100) / 100
      const normLng = Math.round(lng * 100) / 100

      // Compute estimated optical metrics from latitude & terrain proxy
      const isPolar = Math.abs(normLat) > 65
      const isEquatorial = Math.abs(normLat) < 15
      const isOcean = Math.abs(normLng) > 120 || (Math.abs(normLat) < 40 && Math.abs(normLng) < 20 && Math.abs(normLng) > 5)

      const estLum = isPolar ? 220 : isOcean ? 75 : isEquatorial ? 95 : 160
      const estHue = isPolar ? 200 : isOcean ? 225 : isEquatorial ? 135 : 45
      const estEdges = isOcean ? 0.08 : isPolar ? 0.09 : 0.28

      setCustomPoint({
        lat: normLat,
        lng: normLng,
        opticalAnalysis: {
          standardLuminance: estLum,
          normalizedBrightness: estLum / 255,
          meanHueDeg: estHue,
          dominantColorHex: isPolar ? '#E0F2FE' : isOcean ? '#1E293B' : isEquatorial ? '#15803D' : '#D97706',
          dominantColorName: isPolar ? 'High-Latitude Sea Ice / Glacier' : isOcean ? 'Deep Open Ocean Hydrosphere' : isEquatorial ? 'Dense Humid Canopy' : 'Arid Continental Lithosphere',
          edgeDensityPct: Math.round(estEdges * 100),
          warmthIndex: isPolar ? 0.1 : isOcean ? 0.2 : 0.8,
          contrastRms: 0.6,
          quadrants: { q1_nw: 0.25, q2_ne: 0.25, q3_sw: 0.25, q4_se: 0.25 }
        },
        scientificTelemetry: {
          isCalibrated: false,
          measurementName: 'Uncalibrated Geographic Query Point',
          value: `${normLat}° Lat, ${normLng}° Lng`,
          anomaly: 'Optical Pixel Estimation Only',
          unit: 'WGS-84 Coordinates',
          confidence: 'Spatial Model Proxy',
          sensorDisclaimer: 'Estimated geographic approximation. For calibrated physical measurements, select a curated NASA observation region.'
        },
        sonification: {
          suggestedStyle: isPolar ? 'atmospheric' : isOcean ? 'ocean_waves' : 'ambient_earth',
          rootNote: isPolar ? 'A3' : isOcean ? 'A2' : 'D3',
          scaleName: isPolar ? 'Lydian Modal' : isOcean ? 'Dorian Modal' : 'Major Pentatonic',
          baseFrequency: isPolar ? '220.0 Hz' : isOcean ? '110.0 Hz' : '146.8 Hz',
          filterCutoffHz: estLum * 25,
          stereoPan: Math.max(-0.85, Math.min(0.85, (normLng / 180) * 0.9)),
          rhythmStyle: 'Geographic Target Synthesis',
          timbreDescription: 'Synthesized sound profile based on latitude insolation and continental optical proxy.'
        }
      })

      // Query real NASA GIBS analysis for clicked coordinates
      loadScientificData(null, { lat: normLat, lon: normLng, zoom: map.getZoom() }, activeLayerId, selectedDate)
    })

    // Clean up on unmount
    return () => {
      map.remove()
      mapInstanceRef.current = null
    }
  }, [])

  // ==========================================================================
  // 1b. DYNAMIC NASA GIBS WMTS TILE LAYER
  // ==========================================================================
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    // Clean up previous GIBS layer
    if (gibsTileLayerRef.current) {
      map.removeLayer(gibsTileLayerRef.current)
      gibsTileLayerRef.current = null
    }

    const currentLayer = VISUALIZATION_LAYERS.find(l => l.id === activeLayerId) || VISUALIZATION_LAYERS[0]
    const dateSegment = selectedDate || 'default'
    const gibsUrl = `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${currentLayer.gibsLayer}/default/${dateSegment}/${currentLayer.matrixSet}/{z}/{y}/{x}.${currentLayer.format}`

    const gibsLayer = L.tileLayer(gibsUrl, {
      attribution: `&copy; <a href="https://earthdata.nasa.gov/gibs" target="_blank" rel="noreferrer">NASA GIBS</a> • ${currentLayer.satellite}`,
      maxZoom: currentLayer.maxZoom || 9,
      minZoom: 1,
      opacity: 0.85,
      tileSize: 256,
      crossOrigin: true,
    })

    gibsLayer.addTo(map)
    gibsTileLayerRef.current = gibsLayer

    return () => {
      if (gibsTileLayerRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(gibsTileLayerRef.current)
        gibsTileLayerRef.current = null
      }
    }
  }, [activeLayerId, selectedDate])

  // ==========================================================================
  // 1c. NASA EARTHDATA SCIENTIFIC MEASUREMENT RETRIEVAL
  // ==========================================================================
  const loadScientificData = async (regionIdOrName, coords, layerId, dateStr) => {
    setIsLoadingScientificData(true)
    setDataError(null)

    const currentLayer = VISUALIZATION_LAYERS.find(l => l.id === layerId) || VISUALIZATION_LAYERS[0]
    const regionName = regionIdOrName ? regionIdOrName.replace('region-', '') : null

    try {
      const result = await fetchEarthRegionAnalysis(regionName, {
        lat: coords?.lat,
        lon: coords?.lng ?? coords?.lon,
        zoom: coords?.zoom || 4,
        layer: currentLayer.gibsLayer,
        date: dateStr === 'default' ? null : dateStr,
      })

      if (result && result.scientific_measurements) {
        setRealScientificData(result)
      } else {
        setDataError('Calibrated NASA telemetry unavailable for this layer / epoch.')
      }
    } catch (err) {
      console.warn('Failed to fetch real NASA data:', err)
      setDataError('Could not connect to NASA Earthdata backend.')
    } finally {
      setIsLoadingScientificData(false)
    }
  }

  // Load initial calibrated telemetry for active region
  useEffect(() => {
    if (!customPoint && activeRegion) {
      loadScientificData(selectedRegionId, activeRegion.coordinates, activeLayerId, selectedDate)
    }
  }, [selectedRegionId, activeLayerId, selectedDate])

  // ==========================================================================
  // 2. RENDER INTERACTIVE REGION MARKERS ON MAP
  // ==========================================================================
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    // Clear previous markers
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    // Add markers for all curated geographic regions
    GEOGRAPHIC_REGIONS.forEach((region) => {
      const isSelected = region.id === selectedRegionId
      const isCompA = isCompareMode && region.id === compareRegionIdA
      const isCompB = isCompareMode && region.id === compareRegionIdB

      // Custom HTML Marker using Tailwind
      const markerHtml = `
        <div class="relative group cursor-pointer flex items-center justify-center">
          <div class="absolute w-8 h-8 rounded-full ${
            isSelected || isCompA || isCompB
              ? 'bg-cyan-400/30 animate-ping'
              : 'bg-slate-700/20'
          }"></div>
          <div class="w-5 h-5 rounded-full flex items-center justify-center shadow-lg border-2 transition-transform duration-200 ${
            isCompA
              ? 'bg-emerald-500 border-white scale-125 z-30'
              : isCompB
              ? 'bg-amber-500 border-white scale-125 z-30'
              : isSelected
              ? 'bg-cyan-400 border-white scale-125 z-30 ring-4 ring-cyan-500/30'
              : 'bg-slate-900 border-cyan-400/70 hover:scale-110'
          }">
            <div class="w-1.5 h-1.5 rounded-full ${
              isSelected || isCompA || isCompB ? 'bg-slate-950' : 'bg-cyan-300'
            }"></div>
          </div>
          <div class="absolute bottom-6 px-2 py-0.5 rounded text-[10px] font-mono whitespace-nowrap pointer-events-none shadow-md backdrop-blur-md transition-opacity duration-150 ${
            isSelected || isCompA || isCompB
              ? 'opacity-100 bg-slate-950/90 text-cyan-300 border border-cyan-400/40 font-bold'
              : 'opacity-0 group-hover:opacity-100 bg-slate-900/80 text-slate-300 border border-slate-700'
          }">
            ${isCompA ? 'REGION A: ' : isCompB ? 'REGION B: ' : ''}${region.shortName}
          </div>
        </div>
      `

      const customIcon = L.divIcon({
        html: markerHtml,
        className: 'custom-leaflet-region-marker',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      })

      const marker = L.marker([region.coordinates.lat, region.coordinates.lng], { icon: customIcon })
        .addTo(map)
        .on('click', (e) => {
          L.DomEvent.stopPropagation(e)
          handleSelectRegion(region.id)
        })

      markersRef.current.push(marker)
    })
  }, [selectedRegionId, isCompareMode, compareRegionIdA, compareRegionIdB])

  // ==========================================================================
  // 3. REGION SELECTION & CAMERA TRANSITION
  // ==========================================================================
  const handleSelectRegion = (regionId) => {
    setSelectedRegionId(regionId)
    setCustomPoint(null)

    const region = GEOGRAPHIC_REGIONS.find(r => r.id === regionId)
    if (region && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(
        [region.coordinates.lat, region.coordinates.lng],
        region.coordinates.zoom,
        { duration: 1.2 }
      )
    }

    loadScientificData(regionId, region?.coordinates, activeLayerId, selectedDate)

    // Auto-update sonification if playing
    if (isPlayingRegion && region) {
      audifyRegion(region)
    }
  }

  // ==========================================================================
  // 4. REGION-BASED PROCEDURAL SOUND EXPLORATION
  // ==========================================================================
  const audifyRegion = (targetRegion) => {
    // 1. If authentic NASA scientific data is loaded, drive engine with real telemetry!
    if (realScientificData?.normalized_features) {
      const nf = realScientificData.normalized_features
      const son = realScientificData.sonification_profile || {}

      const realTelemetry = {
        normalized_brightness: nf.standard_luminance_norm ?? 0.5,
        standard_luminance_bt601: (nf.standard_luminance_norm ?? 0.5) * 255,
        hue_mean_deg: (nf.mean_hue_norm ?? 0.5) * 360,
        edge_density: nf.canny_edge_density_norm ?? 0.15,
        centroid_x_norm: 0.5 + ((displayTarget?.coordinates?.lng || 0) / 360) * 0.8,
        contrast_rms: nf.dynamic_range_norm ?? 0.5,
        warmth_index: nf.warmth_index ?? 0.3,
        quadrants: { q1_nw: 0.25, q2_ne: 0.25, q3_sw: 0.25, q4_se: 0.25 },
        delta_from_previous: 0.04,
        dominant_colors: [
          { hex: '#38bdf8', percentage: 40, name: 'Satellite Reflectance' },
          { hex: '#10b981', percentage: 35, name: 'Surface Terrestrial' },
          { hex: '#0284c7', percentage: 25, name: 'Oceanic Absorptance' },
        ],
      }

      const styleToUse = son.suggested_style || 'ambient_earth'
      setActiveStyle(styleToUse)
      globalSonificationEngine.updateSettings({ style: styleToUse })
      globalSonificationEngine.updateDynamicFrame(realTelemetry, 0.1)
      return
    }

    // 2. Fallback to curated region optical features if offline
    const region = targetRegion || activeRegion
    const opt = region.opticalAnalysis

    // Convert region optical features into normalized vector for sonification engine
    const normalizedTelemetry = {
      normalized_brightness: opt.normalizedBrightness,
      standard_luminance_bt601: opt.standardLuminance,
      hue_mean_deg: opt.meanHueDeg,
      edge_density: opt.edgeDensityPct / 100,
      centroid_x_norm: 0.5 + (region.coordinates.lng / 360) * 0.8,
      contrast_rms: opt.contrastRms,
      warmth_index: opt.warmthIndex,
      quadrants: opt.quadrants,
      delta_from_previous: 0.03,
      dominant_colors: opt.colorPalette.map(c => ({
        hex: c.hex,
        percentage: c.percentage,
        name: c.name,
      }))
    }

    // Set recommended sound style
    const styleToUse = region.sonification?.suggestedStyle || 'ambient_earth'
    setActiveStyle(styleToUse)
    globalSonificationEngine.updateSettings({ style: styleToUse })

    // Feed telemetry into dynamic sonification engine
    globalSonificationEngine.updateDynamicFrame(normalizedTelemetry, 0.1)
  }

  const togglePlayRegion = async () => {
    if (isPlayingRegion) {
      globalSonificationEngine.pause()
      setIsPlayingRegion(false)
    } else {
      if (isCompareMode) {
        audifyCrossfadedRegions(crossfadeRatio)
      } else {
        audifyRegion(customPoint || activeRegion)
      }
      await globalSonificationEngine.play()
      setIsPlayingRegion(true)
    }
  }

  // ==========================================================================
  // 5. REGION A vs REGION B ACOUSTIC CROSSFADER (Interpolation)
  // ==========================================================================
  const audifyCrossfadedRegions = (ratio) => {
    const inv = 1.0 - ratio
    const optA = regionA.opticalAnalysis
    const optB = regionB.opticalAnalysis

    // Shortest-arc circular hue interpolation
    const hueA = optA.meanHueDeg
    const hueB = optB.meanHueDeg
    const hueDiff = ((hueB - hueA + 540) % 360) - 180
    const interpHue = (hueA + ratio * hueDiff + 360) % 360

    const interpolatedTelemetry = {
      normalized_brightness: optA.normalizedBrightness * inv + optB.normalizedBrightness * ratio,
      standard_luminance_bt601: optA.standardLuminance * inv + optB.standardLuminance * ratio,
      hue_mean_deg: interpHue,
      edge_density: (optA.edgeDensityPct / 100) * inv + (optB.edgeDensityPct / 100) * ratio,
      centroid_x_norm: (0.5 + (regionA.coordinates.lng / 360) * 0.8) * inv + (0.5 + (regionB.coordinates.lng / 360) * 0.8) * ratio,
      contrast_rms: optA.contrastRms * inv + optB.contrastRms * ratio,
      warmth_index: optA.warmthIndex * inv + optB.warmthIndex * ratio,
      delta_from_previous: Math.abs(optB.normalizedBrightness - optA.normalizedBrightness) * 0.15,
      dominant_colors: ratio < 0.5 ? optA.colorPalette : optB.colorPalette
    }

    const currentStyle = ratio < 0.5 ? regionA.sonification.suggestedStyle : regionB.sonification.suggestedStyle
    setActiveStyle(currentStyle)
    globalSonificationEngine.updateSettings({ style: currentStyle })
    globalSonificationEngine.updateDynamicFrame(interpolatedTelemetry, 0.08)
  }

  const handleCrossfadeChange = (newRatio) => {
    const val = Number(newRatio)
    setCrossfadeRatio(val)
    if (isPlayingRegion) {
      audifyCrossfadedRegions(val)
    }
  }

  return (
    <div className="space-y-6">

      {/* Header Bar & Exploration Mode Toggle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/80 border border-cyan-500/20 backdrop-blur-md shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Globe2 className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-extrabold text-slate-100 tracking-tight">
                Interactive Earth Exploration Module
              </h2>
              <Badge variant="cyan" size="sm">PHASE 8</Badge>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Select any geographic region to inspect calibrated NASA observation telemetry and audify planetary features.
            </p>
          </div>
        </div>

        {/* Mode Switcher: Single Region vs A/B Comparison */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => setIsCompareMode(false)}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
              !isCompareMode
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white bg-slate-800'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>REGIONAL EXPLORATION</span>
          </button>

          <button
            onClick={() => {
              setIsCompareMode(true)
              if (isPlayingRegion) audifyCrossfadedRegions(crossfadeRatio)
            }}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
              isCompareMode
                ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                : 'text-slate-400 hover:text-white bg-slate-800'
            }`}
          >
            <Split className="w-3.5 h-3.5" />
            <span>REGION COMPARISON (A vs B)</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Arena: Leaflet World Map (7 cols) + Regional Telemetry / Comparison (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Column (7 cols): Leaflet World Map + Visualization Layer Switcher */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Map Viewport Container */}
          <div className="relative aspect-[16/11] bg-slate-950 rounded-2xl border border-cyan-500/30 overflow-hidden shadow-2xl">
            
            {/* The Actual Leaflet Map Canvas */}
            <div ref={mapContainerRef} className="w-full h-full z-10" />

            {/* Top-Left Floating Map HUD */}
            <div className="absolute top-3 left-3 z-20 pointer-events-none flex flex-col space-y-1">
              <div className="bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-cyan-500/30 text-xs font-mono shadow-lg flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-cyan-300 font-bold uppercase">
                  {isCompareMode ? 'COMPARATIVE DUAL PROJECTION' : displayTarget.shortName || 'WGS-84 MAP'}
                </span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-300 font-mono text-[11px]">
                  {customPoint ? `${customPoint.lat}°, ${customPoint.lng}°` : `${activeRegion.coordinates.lat}°N, ${activeRegion.coordinates.lng}°E`}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-1">
                <div className="bg-slate-900/80 backdrop-blur-sm px-2.5 py-0.5 rounded text-[10px] font-mono text-cyan-300 border border-cyan-500/30 w-fit">
                  GIBS: {activeLayer.name}
                </div>
                <div className="bg-slate-900/80 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-mono text-emerald-400 border border-slate-800 w-fit">
                  DATE: {selectedDate === 'default' ? 'LATEST' : selectedDate}
                </div>
              </div>
            </div>

            {/* Bottom-Left Floating NASA VEDA Scientific Legend HUD Card (Image 4 Match) */}
            <div className="absolute bottom-3 left-3 z-20 max-w-[260px] bg-slate-950/90 backdrop-blur-md p-2.5 rounded-xl border border-cyan-500/25 shadow-xl font-mono text-[11px] space-y-1.5">
              <div className="flex items-center justify-between text-slate-300">
                <span className="font-bold text-cyan-300 truncate">{activeLayer.name}</span>
                <span className="text-[9px] px-1 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">VEDA L3</span>
              </div>
              <div className="text-[10px] text-slate-400 truncate">{activeLayer.satellite}</div>
              
              {/* Continuous Colormap Gradient Ramp */}
              <div className="space-y-0.5">
                <div 
                  className="w-full h-2 rounded-full border border-slate-700 shadow-inner"
                  style={{
                    background: activeLayer.id === 'vegetation_ndvi'
                      ? 'linear-gradient(to right, #ca8a04, #eab308, #22c55e, #15803d)'
                      : activeLayer.id === 'temperature_anomaly'
                      ? 'linear-gradient(to right, #0284c7, #38bdf8, #f59e0b, #ef4444)'
                      : activeLayer.id === 'cryosphere_elevation'
                      ? 'linear-gradient(to right, #0c4a6e, #0284c7, #93c5fd, #ffffff)'
                      : 'linear-gradient(to right, #041628, #0369a1, #38bdf8, #a7f3d0)'
                  }}
                />
                <div className="flex items-center justify-between text-[9px] text-slate-400">
                  <span>{activeLayer.id === 'vegetation_ndvi' ? '-0.20' : activeLayer.id === 'temperature_anomaly' ? '-2.5 °C' : '0.0 m'}</span>
                  <span>{activeLayer.paletteType}</span>
                  <span>{activeLayer.id === 'vegetation_ndvi' ? '+1.00' : activeLayer.id === 'temperature_anomaly' ? '+3.5 °C' : '4.5 m'}</span>
                </div>
              </div>
            </div>

            {/* Bottom-Right Map Controls: Reset View */}
            <div className="absolute bottom-3 right-3 z-20 flex items-center space-x-2">
              <button
                onClick={() => {
                  if (mapInstanceRef.current) {
                    mapInstanceRef.current.flyTo([25.0, 0.0], 2, { duration: 1.0 })
                  }
                }}
                className="bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white px-2.5 py-1 rounded-lg border border-slate-700 text-xs font-mono shadow-md flex items-center space-x-1"
                title="Reset Map to Global View"
              >
                <Navigation className="w-3 h-3 text-cyan-400" />
                <span>Global View</span>
              </button>
            </div>
          </div>

          {/* NASA GIBS Date Picker & Temporal Scrubber */}
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 font-mono">
            <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
              <span className="text-cyan-400 font-bold flex items-center space-x-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>NASA GIBS OBSERVATION DATE & TEMPORAL SCRUBBER</span>
              </span>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] text-slate-400">DATE:</span>
                <input
                  type="date"
                  value={selectedDate === 'default' ? '' : selectedDate}
                  min={minMissionDate}
                  max={todayStr}
                  onChange={(e) => {
                    const val = e.target.value
                    if (val) setSelectedDate(val)
                  }}
                  className="bg-slate-950 border border-cyan-500/30 rounded px-2 py-0.5 text-xs text-cyan-300 font-mono focus:outline-none focus:border-cyan-400"
                />
                <button
                  onClick={() => setSelectedDate('default')}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                    selectedDate === 'default'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50'
                      : 'bg-slate-800 text-slate-400 hover:text-white border-slate-700'
                  }`}
                  title="Use latest daily composite"
                >
                  Latest
                </button>
              </div>
            </div>

            {/* Quick Historic & Seasonal Presets */}
            <div className="flex items-center space-x-2 text-[10px] text-slate-400 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-cyan-500/20">
              <span className="text-slate-500 shrink-0">PRESETS:</span>
              {[
                { label: 'May 2024 (Spring Peak)', date: '2024-05-15' },
                { label: 'Sep 2023 (Arctic Min)', date: '2023-09-15' },
                { label: 'Jul 2022 (Summer Heat)', date: '2022-07-20' },
                { label: 'Dec 2021 (Solstice)', date: '2021-12-21' },
                { label: 'Jun 2018 (Historical)', date: '2018-06-21' },
              ].map(preset => (
                <button
                  key={preset.date}
                  onClick={() => setSelectedDate(preset.date)}
                  className={`px-2 py-0.5 rounded whitespace-nowrap transition-colors border ${
                    selectedDate === preset.date
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40 font-bold'
                      : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border-slate-800'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Multi-Year Slider */}
            <div className="flex items-center space-x-3 pt-1 border-t border-slate-800/80">
              <span className="text-[10px] text-slate-500">2004</span>
              <input
                type="range"
                min="2004"
                max="2024"
                value={selectedDate === 'default' ? 2024 : parseInt(selectedDate.substring(0, 4)) || 2024}
                onChange={(e) => {
                  const yr = e.target.value
                  setSelectedDate(`${yr}-06-15`)
                }}
                className="flex-1 accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <span className="text-[10px] text-cyan-400 font-bold">
                {selectedDate === 'default' ? '2024 (Latest)' : selectedDate.substring(0, 4)}
              </span>
            </div>
          </div>

          {/* Visualization Layer Switcher Strip */}
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span className="flex items-center space-x-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>NASA VISUALIZATION LAYER OVERLAY:</span>
              </span>
              <span className="text-cyan-400 font-bold">{activeLayer.satellite}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {VISUALIZATION_LAYERS.map((layer) => {
                const isSelected = activeLayerId === layer.id
                return (
                  <button
                    key={layer.id}
                    onClick={() => setActiveLayerId(layer.id)}
                    className={`p-2 rounded-lg text-left transition-all border ${
                      isSelected
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50 shadow-sm ring-1 ring-cyan-400/30'
                        : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border-slate-800'
                    }`}
                  >
                    <div className="text-[11px] font-bold truncate">{layer.name}</div>
                    <div className="text-[9px] font-mono text-slate-500 truncate">{layer.paletteType}</div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Quick Region Selector Carousel */}
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <span className="text-xs font-mono text-slate-400 flex items-center space-x-1.5">
              <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
              <span>GEOGRAPHIC REGION PRESETS (CLICK TO FLY):</span>
            </span>

            <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-cyan-500/20">
              {GEOGRAPHIC_REGIONS.map((region) => {
                const isSelected = selectedRegionId === region.id && !customPoint
                return (
                  <button
                    key={region.id}
                    onClick={() => handleSelectRegion(region.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono whitespace-nowrap transition-all border ${
                      isSelected
                        ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400 shadow-md shadow-cyan-500/20 scale-[1.02]'
                        : 'bg-slate-950/70 text-slate-300 hover:text-white border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    {region.shortName}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Telemetry Analysis & Region-Based Sonification Deck */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* MODE A: REGIONAL EXPLORATION & AUDIFICATION */}
          {!isCompareMode && (
            <GlassPanel
              title={displayTarget.name || 'Regional Analysis'}
              subtitle={displayTarget.category ? `${displayTarget.category.toUpperCase()} • SATELLITE TELEMETRY` : 'GEOGRAPHIC TARGET'}
              icon={Activity}
            >
              <div className="space-y-4">
                
                {/* Description & Sensor Origin */}
                <p className="text-xs text-slate-300 leading-relaxed">
                  {displayTarget.description}
                </p>

                {/* Regional Audification Transport Deck */}
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-cyan-950/40 to-slate-950 border border-cyan-500/30 flex items-center justify-between shadow-lg">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block">
                      REGION-BASED SONIFICATION
                    </span>
                    <span className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                      <span>Root: {displayTarget.sonification?.rootNote || 'D3'}</span>
                      <span className="text-slate-500">•</span>
                      <span>Cutoff: {displayTarget.sonification?.filterCutoffHz || 4500} Hz</span>
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleExportTelemetryCSV}
                      disabled={isExportingCsv}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-slate-900/80 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 hover:border-cyan-400 transition-colors shadow-sm disabled:opacity-50"
                      title="Export all regional physical measurements to CSV"
                    >
                      {isExportingCsv ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Download className="w-3.5 h-3.5 text-cyan-400" />}
                      <span>{isExportingCsv ? 'EXPORTED' : 'CSV'}</span>
                    </button>

                    <Button
                      variant={isPlayingRegion ? 'secondary' : 'primary'}
                      size="sm"
                      icon={isPlayingRegion ? Pause : Play}
                      onClick={togglePlayRegion}
                      className="px-4 font-bold"
                    >
                      {isPlayingRegion ? 'Pause' : 'Audify Region'}
                    </Button>
                  </div>
                </div>

                {/* Embedded Live Waveform Visualizer */}
                <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950/80 p-2">
                  <WaveformDisplay
                    isLive={isPlayingRegion}
                    audioNode={globalSonificationEngine.analyser}
                    height={44}
                    color="#06b6d4"
                    mode="oscilloscope"
                  />
                </div>

                {/* NASA GIBS Live Downlink Loading State */}
                {isLoadingScientificData && (
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-cyan-500/30 flex items-center space-x-2.5 text-xs font-mono text-cyan-300">
                    <Activity className="w-4 h-4 animate-spin text-cyan-400 shrink-0" />
                    <div>
                      <div className="font-bold">DOWNLINKING CALIBRATED NASA GIBS RASTER TILES...</div>
                      <div className="text-[10px] text-slate-400">Computing physical measurements for {displayTarget.shortName || 'Custom Target'}</div>
                    </div>
                  </div>
                )}

                {/* NASA Telemetry Unavailable / Fallback State */}
                {dataError && !isLoadingScientificData && (
                  <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 text-xs font-mono text-amber-300 flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                    <span className="text-[11px]">{dataError} Reverting to regional reference model.</span>
                  </div>
                )}

                {/* Authentic NASA Calibrated Scientific Measurements Card */}
                {realScientificData?.scientific_measurements && !isLoadingScientificData && (
                  <div className="p-3.5 rounded-xl bg-slate-950/90 border border-cyan-500/30 space-y-2.5">
                    <div className="flex items-center justify-between font-mono text-xs">
                      <span className="text-cyan-300 font-bold flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span>AUTHENTIC NASA SCIENTIFIC MEASUREMENTS</span>
                      </span>
                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={handleExportTelemetryCSV}
                          disabled={isExportingCsv}
                          className="flex items-center space-x-1 px-2 py-0.5 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 transition-colors text-[10px]"
                          title="Download raw scientific telemetry as CSV"
                        >
                          {isExportingCsv ? <Check className="w-3 h-3 text-emerald-400" /> : <Download className="w-3 h-3" />}
                          <span>CSV</span>
                        </button>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                          {realScientificData.data_quality?.quality_flag || 'OPTIMAL'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                      {Object.entries(realScientificData.scientific_measurements).map(([key, item]) => (
                        <div key={key} className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                          <div className="text-slate-400 text-[10px] uppercase truncate">{key.replace(/_/g, ' ')}</div>
                          <div className="text-emerald-300 font-bold text-sm my-0.5">
                            {typeof item.value === 'number' ? item.value.toFixed(2) : item.value}{' '}
                            <span className="text-xs font-normal text-slate-300">{item.unit}</span>
                          </div>
                          <div className="text-[9px] text-slate-500 line-clamp-1" title={item.description}>
                            {item.description}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-800 text-[10px] font-mono text-slate-400 gap-1.5">
                      <span>SENSOR: <strong className="text-slate-200">{realScientificData.metadata?.sensor || activeLayer.satellite}</strong></span>
                      <span>DATE: <strong className="text-cyan-300">{realScientificData.acquisition_date}</strong></span>
                      <span>VALID: <strong className="text-emerald-400">{realScientificData.data_quality?.valid_pixel_pct ?? 100}%</strong></span>
                    </div>
                  </div>
                )}

                {/* Optical Feature Metrics Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                    <div className="text-slate-400 text-[10px]">LUMINANCE (Y):</div>
                    <div className="text-cyan-300 font-bold text-sm">
                      {displayTarget.opticalAnalysis.standardLuminance.toFixed(1)} / 255
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                    <div className="text-slate-400 text-[10px]">DOMINANT HUE:</div>
                    <div className="text-emerald-400 font-bold text-sm">
                      {displayTarget.opticalAnalysis.meanHueDeg.toFixed(1)}°
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                    <div className="text-slate-400 text-[10px]">EDGE COMPLEXITY:</div>
                    <div className="text-amber-400 font-bold text-sm">
                      {displayTarget.opticalAnalysis.edgeDensityPct}% Edges
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                    <div className="text-slate-400 text-[10px]">WARMTH INDEX:</div>
                    <div className="text-pink-400 font-bold text-sm">
                      {(displayTarget.opticalAnalysis.warmthIndex * 100).toFixed(0)}% Warm
                    </div>
                  </div>
                </div>

                {/* Dominant Color Palette */}
                {displayTarget.opticalAnalysis.colorPalette && (
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-mono text-slate-400">REGIONAL DOMINANT SPECTRAL CLUSTERS:</div>
                    <div className="flex items-center space-x-2">
                      {displayTarget.opticalAnalysis.colorPalette.map((col, idx) => (
                        <div
                          key={idx}
                          className="flex-1 p-2 rounded-lg border border-slate-800 bg-slate-950/70 flex flex-col items-center"
                        >
                          <div
                            className="w-5 h-5 rounded-full border border-slate-700 shadow-sm mb-1"
                            style={{ backgroundColor: col.hex }}
                          />
                          <span className="text-[10px] font-mono font-bold text-slate-200">{col.percentage}%</span>
                          <span className="text-[9px] font-mono text-slate-500 truncate max-w-full">{col.name.split(' ')[0]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Calibrated Scientific Telemetry & Accuracy Policy */}
                <div className={`p-3 rounded-lg border text-xs font-mono space-y-1.5 ${
                  displayTarget.scientificTelemetry.isCalibrated
                    ? 'bg-emerald-950/30 border-emerald-500/30'
                    : 'bg-amber-950/30 border-amber-500/30'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="font-bold flex items-center gap-1.5 text-slate-200">
                      {displayTarget.scientificTelemetry.isCalibrated ? (
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-amber-400" />
                      )}
                      <span>
                        {displayTarget.scientificTelemetry.isCalibrated
                          ? 'CALIBRATED SENSOR TELEMETRY'
                          : 'UNCALIBRATED OPTICAL PROXY'}
                      </span>
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {displayTarget.scientificTelemetry.confidence}
                    </span>
                  </div>

                  <div className="text-slate-300">
                    <span className="text-slate-400">{displayTarget.scientificTelemetry.measurementName}: </span>
                    <strong className="text-white">{displayTarget.scientificTelemetry.value}</strong>
                    {displayTarget.scientificTelemetry.anomaly && (
                      <span className="text-cyan-300 ml-1">({displayTarget.scientificTelemetry.anomaly})</span>
                    )}
                  </div>

                  <p className="text-[10px] text-slate-400 leading-normal border-t border-slate-800/80 pt-1">
                    {displayTarget.scientificTelemetry.sensorDisclaimer}
                  </p>
                </div>

              </div>
            </GlassPanel>
          )}

          {/* MODE B: REGION COMPARISON (A vs B) & CROSSFADER */}
          {isCompareMode && (
            <GlassPanel
              title="Region Comparison & Acoustic Crossfader"
              subtitle="SIDE-BY-SIDE TELEMETRY & SMOOTH AUDIO BLENDING"
              icon={Split}
            >
              <div className="space-y-4">
                
                {/* Region Selectors A and B */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-500/30 space-y-1">
                    <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase block">
                      REGION A (0% CROSSFADER)
                    </span>
                    <select
                      value={compareRegionIdA}
                      onChange={(e) => {
                        setCompareRegionIdA(e.target.value)
                        if (isPlayingRegion) audifyCrossfadedRegions(crossfadeRatio)
                      }}
                      className="w-full bg-slate-950 text-slate-200 text-xs font-mono p-1.5 rounded border border-slate-700"
                    >
                      {GEOGRAPHIC_REGIONS.map(r => (
                        <option key={r.id} value={r.id}>{r.shortName}</option>
                      ))}
                    </select>
                    <div className="text-[10px] font-mono text-slate-400 pt-1">
                      {regionA.opticalAnalysis.dominantColorName.split('/')[0]}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-amber-950/30 border border-amber-500/30 space-y-1">
                    <span className="text-[10px] font-mono font-bold text-amber-400 uppercase block">
                      REGION B (100% CROSSFADER)
                    </span>
                    <select
                      value={compareRegionIdB}
                      onChange={(e) => {
                        setCompareRegionIdB(e.target.value)
                        if (isPlayingRegion) audifyCrossfadedRegions(crossfadeRatio)
                      }}
                      className="w-full bg-slate-950 text-slate-200 text-xs font-mono p-1.5 rounded border border-slate-700"
                    >
                      {GEOGRAPHIC_REGIONS.map(r => (
                        <option key={r.id} value={r.id}>{r.shortName}</option>
                      ))}
                    </select>
                    <div className="text-[10px] font-mono text-slate-400 pt-1">
                      {regionB.opticalAnalysis.dominantColorName.split('/')[0]}
                    </div>
                  </div>
                </div>

                {/* Acoustic Crossfader Slider */}
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-cyan-500/30 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-emerald-400 font-bold">A: {regionA.shortName} ({Math.round((1 - crossfadeRatio) * 100)}%)</span>
                    <span className="text-amber-400 font-bold">B: {regionB.shortName} ({Math.round(crossfadeRatio * 100)}%)</span>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={crossfadeRatio}
                    onChange={(e) => handleCrossfadeChange(e.target.value)}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />

                  <div className="flex justify-between text-[10px] font-mono text-slate-500">
                    <span>Pure Region A</span>
                    <span>Continuous Interpolated Blend</span>
                    <span>Pure Region B</span>
                  </div>
                </div>

                {/* Comparison Audification Action Button */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-xs font-mono text-slate-300">
                    <span className="text-slate-500">VOICE:</span> {activeStyle.replace('_', ' ').toUpperCase()}
                  </div>

                  <Button
                    variant={isPlayingRegion ? 'secondary' : 'primary'}
                    size="sm"
                    icon={isPlayingRegion ? Pause : Play}
                    onClick={togglePlayRegion}
                    className="px-4 font-bold"
                  >
                    {isPlayingRegion ? 'Pause Crossfader' : 'Play A/B Crossfader'}
                  </Button>
                </div>

                {/* Embedded Live Waveform */}
                <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950/80 p-2">
                  <WaveformDisplay
                    isLive={isPlayingRegion}
                    audioNode={globalSonificationEngine.analyser}
                    height={40}
                    color="#f59e0b"
                    mode="oscilloscope"
                  />
                </div>

                {/* Side-by-Side Comparison Matrix */}
                <div className="space-y-1.5 text-xs font-mono">
                  <div className="text-[11px] text-cyan-400 font-bold">COMPARATIVE TELEMETRY DELTAS:</div>
                  
                  <div className="grid grid-cols-3 gap-2 p-2 rounded bg-slate-950/60 border border-slate-800 text-center">
                    <div>
                      <span className="text-[10px] text-slate-500 block">LUMINANCE Δ</span>
                      <span className="font-bold text-slate-200">
                        {Math.abs(regionA.opticalAnalysis.standardLuminance - regionB.opticalAnalysis.standardLuminance).toFixed(1)}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 block">HUE SHIFT</span>
                      <span className="font-bold text-slate-200">
                        {Math.abs(regionA.opticalAnalysis.meanHueDeg - regionB.opticalAnalysis.meanHueDeg).toFixed(1)}°
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 block">EDGE RATIO</span>
                      <span className="font-bold text-slate-200">
                        {(regionA.opticalAnalysis.edgeDensityPct / Math.max(1, regionB.opticalAnalysis.edgeDensityPct)).toFixed(1)}x
                      </span>
                    </div>
                  </div>
                </div>

                {/* Scientific Disclaimer Note */}
                <div className="p-2.5 rounded bg-slate-950/80 border border-slate-800 text-[10px] font-mono text-slate-400 leading-relaxed flex items-start space-x-2">
                  <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                  <span>
                    Regional comparison blends multispectral feature vectors using shortest-arc circular hue interpolation and audio param ramp smoothing. Physical sensor values represent verified NASA mission data.
                  </span>
                </div>

              </div>
            </GlassPanel>
          )}

        </div>

      </div>

    </div>
  )
}
