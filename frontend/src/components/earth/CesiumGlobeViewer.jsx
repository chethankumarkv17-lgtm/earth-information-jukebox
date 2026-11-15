import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import * as Cesium from 'cesium'
import 'cesium/Build/Cesium/Widgets/widgets.css'

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
  Navigation,
  Crosshair,
  Calendar,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Sun,
  Satellite,
  Radio,
  Download,
  Check,
  Search,
  Home,
  Loader2,
  X
} from 'lucide-react'

import GlassPanel from '../common/GlassPanel'
import Button from '../common/Button'
import Badge from '../common/Badge'
import WaveformDisplay from '../common/WaveformDisplay'
import { GEOGRAPHIC_REGIONS, VISUALIZATION_LAYERS } from '../../data/geographicRegions'
import globalSonificationEngine, { MUSICAL_STYLES } from '../../services/sonificationEngine'
import { fetchEarthRegionAnalysis } from '../../services/api'

// Set Cesium base URL for static assets (Workers, Assets, Widgets)
if (typeof window !== 'undefined') {
  window.CESIUM_BASE_URL = '/cesium/'
}

// Curated searchable geographic landmarks & observatories
const SEARCHABLE_LOCATIONS = [
  { name: 'Shivamogga (India)', lat: 13.9299, lon: 75.5681, zoom: 6, category: 'Tropical Monsoon' },
  { name: 'Amazon Basin (Brazil)', lat: -3.4653, lon: -62.2159, zoom: 5, category: 'Rainforest Canopy' },
  { name: 'Svalbard Arctic (Norway)', lat: 78.2232, lon: 15.6267, zoom: 5, category: 'Polar Archipelago' },
  { name: 'Greenland Ice Sheet (Summit)', lat: 72.5796, lon: -38.4592, zoom: 4, category: 'Glacial Ice Sheet' },
  { name: 'Sahara Desert (Algeria)', lat: 28.0339, lon: 1.6596, zoom: 5, category: 'Hyper-Arid Erg' },
  { name: 'Tokyo (Japan)', lat: 35.6762, lon: 139.6503, zoom: 6, category: 'Urban Megacity' },
  { name: 'London (United Kingdom)', lat: 51.5074, lon: -0.1278, zoom: 6, category: 'Temperate Maritime' },
  { name: 'New York City (USA)', lat: 40.7128, lon: -74.0060, zoom: 6, category: 'Coastal Metropolis' },
  { name: 'Paris (France)', lat: 48.8566, lon: 2.3522, zoom: 6, category: 'Continental Basin' },
  { name: 'Cairo & Nile Delta (Egypt)', lat: 30.0444, lon: 31.2357, zoom: 6, category: 'River Delta Oasis' },
  { name: 'Sydney (Australia)', lat: -33.8688, lon: 151.2093, zoom: 6, category: 'Oceanic Margin' },
  { name: 'Mount Everest / Himalayas', lat: 27.9881, lon: 86.9250, zoom: 5, category: 'High-Altitude Cryosphere' },
  { name: 'Great Barrier Reef (Australia)', lat: -18.2871, lon: 147.6992, zoom: 5, category: 'Marine Coral Ecosystem' },
  { name: 'Congo Basin (DRC)', lat: -0.2280, lon: 21.7587, zoom: 5, category: 'Equatorial Peatland' },
  { name: 'Atacama Desert (Chile)', lat: -23.8634, lon: -69.1328, zoom: 5, category: 'Arid Plateaus' },
  { name: 'Antarctica (Amundsen-Scott)', lat: -90.0000, lon: 0.0000, zoom: 4, category: 'Polar Continental Ice' },
  { name: 'Iceland (Vatnajökull)', lat: 64.9631, lon: -19.0208, zoom: 5, category: 'Volcanic Glacier' },
]

// Parse coordinate strings like "13.93, 75.57" or "13.93 N, 75.57 E"
function parseCoordinateQuery(query) {
  if (!query || typeof query !== 'string') return null
  const clean = query.trim().replace(/[°NSEWnsew]/g, '')
  const parts = clean.split(/[, ]+/).filter(Boolean)
  if (parts.length === 2) {
    const lat = parseFloat(parts[0])
    const lon = parseFloat(parts[1])
    if (!isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
      return { lat, lon }
    }
  }
  return null
}

/**
 * Interactive 3D Cesium Globe (Google Earth Style)
 * 2026 NASA Space Apps Challenge — Earth Information Jukebox
 * 
 * Features:
 * 1. Global Sentinel-2 high-resolution satellite imagery via Cesium ion
 * 2. Progressive NASA GIBS WMTS tile streaming (EPSG:3857)
 * 3. 3D orbit, pan, pitch, and smooth fly-to navigation
 * 4. Temporal observation date selector with historic presets
 * 5. Multi-spectral scientific measurements & quality flags
 * 6. Procedural Web Audio sonification engine connection
 */
export default function CesiumGlobeViewer({
  onNavigate,
  targetLocation = null,
  selectedLayerId = null,
  mode = 'full', // 'full' | 'embedded' | 'compact' | 'climate' | 'observatory'
  onLocationSelect = null,
  enableLighting = false,
  showAtmosphere = true,
  height = null,
  className = '',
}) {
  // Container & Cesium instance refs
  const cesiumContainerRef = useRef(null)
  const viewerRef = useRef(null)
  const gibsLayerRef = useRef(null)
  const baseLayerRef = useRef(null)
  const regionEntitiesRef = useRef([])
  const customMarkerEntityRef = useRef(null)

  // Selection states
  const [selectedRegionId, setSelectedRegionId] = useState('region-arctic')
  const [activeLayerId, setActiveLayerId] = useState(selectedLayerId || 'true_color')
  const [selectedDate, setSelectedDate] = useState('2024-05-15')
  const [overlayOpacity, setOverlayOpacity] = useState(0.85)
  const [customPoint, setCustomPoint] = useState(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isWebglLost, setIsWebglLost] = useState(false)

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  // Globe loading & error states
  const [isGlobeLoading, setIsGlobeLoading] = useState(true)
  const [tileErrorCount, setTileErrorCount] = useState(0)

  // Camera telemetry HUD
  const [cameraInfo, setCameraInfo] = useState({
    altitudeKm: 12500,
    lat: 78.5,
    lon: 0.0,
    headingDeg: 0,
    pitchDeg: -90,
  })

  // NASA GIBS & Scientific Data States
  const [realScientificData, setRealScientificData] = useState(null)
  const [isLoadingScientificData, setIsLoadingScientificData] = useState(false)
  const [dataError, setDataError] = useState(null)
  const [isGlobeReady, setIsGlobeReady] = useState(false)

  // Audio sonification states
  const [isPlayingRegion, setIsPlayingRegion] = useState(false)
  const [activeStyle, setActiveStyle] = useState('ambient_earth')
  const [baseImagerySource, setBaseImagerySource] = useState('Sentinel-2 (Cesium ion)')
  const [isExportingCsv, setIsExportingCsv] = useState(false)

  // Retrieve active layer & region objects
  const activeRegion = GEOGRAPHIC_REGIONS.find(r => r.id === selectedRegionId) || GEOGRAPHIC_REGIONS[0]
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

  // Sync layer prop if provided by parent (Dashboard / Journey)
  useEffect(() => {
    if (selectedLayerId && VISUALIZATION_LAYERS.some(l => l.id === selectedLayerId)) {
      setActiveLayerId(selectedLayerId)
    }
  }, [selectedLayerId])

  const lastTargetCoordRef = useRef({ lat: null, lon: null })

  // Animated globe camera movement when selecting an external location
  useEffect(() => {
    if (!targetLocation || !viewerRef.current || viewerRef.current.isDestroyed() || !isGlobeReady) return
    const lat = targetLocation.lat
    const lon = targetLocation.lon ?? targetLocation.lng
    if (lat !== undefined && lon !== undefined) {
      if (lastTargetCoordRef.current.lat === lat && lastTargetCoordRef.current.lon === lon) {
        return
      }
      lastTargetCoordRef.current = { lat, lon }
      const zoom = targetLocation.zoom || 5
      const targetHeight = Math.max(1200000, 22000000 / Math.pow(2, zoom - 1))
      viewerRef.current.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(lon, lat, targetHeight),
        duration: 2.2,
        easingFunction: Cesium.EasingFunction.QUADRATIC_IN_OUT,
      })
      handlePickCustomCoordinates(lat, lon, false)
    }
  }, [targetLocation?.lat, targetLocation?.lon, targetLocation?.lng, isGlobeReady])

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
  // 1. INITIALIZE CESIUMJS 3D VIEWER
  // ==========================================================================
  useEffect(() => {
    if (!cesiumContainerRef.current || viewerRef.current) return

    let viewer = null
    try {
      viewer = new Cesium.Viewer(cesiumContainerRef.current, {
        animation: false,
        baseLayerPicker: false,
        fullscreenButton: false,
        geocoder: false,
        homeButton: false,
        infoBox: false,
        sceneModePicker: false,
        selectionIndicator: false,
        timeline: false,
        navigationHelpButton: false,
        navigationInstructionsInitiallyVisible: false,
        scene3DOnly: true,
        shouldAnimate: true,
        skyAtmosphere: new Cesium.SkyAtmosphere(),
      })

      // Aerospace styling: Dark space background and atmosphere glow
      viewer.scene.globe.enableLighting = enableLighting
      viewer.scene.globe.showGroundAtmosphere = showAtmosphere
      if (viewer.scene.skyAtmosphere) {
        viewer.scene.skyAtmosphere.show = showAtmosphere
      }
      viewer.scene.globe.depthTestAgainstTerrain = true
      viewer.scene.globe.tileCacheSize = 1000
      viewer.scene.backgroundColor = Cesium.Color.fromCssColorString('#020617')

      viewerRef.current = viewer

      // Setup WebGL Context Loss Handler
      const canvas = viewer.scene.canvas
      const onContextLost = (e) => {
        e.preventDefault()
        setIsWebglLost(true)
        console.warn('Cesium WebGL Context Lost (gracefully caught)')
      }
      const onContextRestored = () => {
        setIsWebglLost(false)
        console.log('Cesium WebGL Context Restored')
      }
      if (canvas) {
        canvas.addEventListener('webglcontextlost', onContextLost)
        canvas.addEventListener('webglcontextrestored', onContextRestored)
      }

      // Setup base layer (Sentinel-2 via Cesium ion with graceful ArcGis fallback)
      const setupBaseImagery = async () => {
        try {
          // Remove default imagery
          viewer.imageryLayers.removeAll()

          let baseProvider = null
          try {
            // Cesium ion Asset 3954 is Sentinel-2 Cloudless Global Satellite Imagery
            baseProvider = await Cesium.IonImageryProvider.fromAssetId(3954)
            setBaseImagerySource('Sentinel-2 (Cesium ion)')
          } catch (ionErr) {
            console.warn('Sentinel-2 Ion provider fallback:', ionErr)
            // Fallback: High-resolution ArcGis World Imagery
            baseProvider = await Cesium.ArcGisMapServerImageryProvider.fromUrl(
              'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer'
            )
            setBaseImagerySource('ArcGIS World Imagery')
          }

          if (baseProvider && viewer && !viewer.isDestroyed()) {
            baseProvider.errorEvent.addEventListener((err) => {
              console.warn('Base imagery tile load failure (gracefully handled):', err)
            })
            const layer = viewer.imageryLayers.addImageryProvider(baseProvider)
            baseLayerRef.current = layer
          }
        } catch (err) {
          console.warn('Base imagery initialization error:', err)
        } finally {
          setIsGlobeLoading(false)
        }
      }

      setupBaseImagery()

      // Add 3D Region markers onto the globe
      const entities = []
      GEOGRAPHIC_REGIONS.forEach((region) => {
        const entity = viewer.entities.add({
          id: region.id,
          name: region.name,
          position: Cesium.Cartesian3.fromDegrees(
            region.coordinates.lng,
            region.coordinates.lat,
            25000
          ),
          point: {
            pixelSize: 10,
            color: Cesium.Color.fromCssColorString('#06b6d4'),
            outlineColor: Cesium.Color.WHITE,
            outlineWidth: 2,
            scaleByDistance: new Cesium.NearFarScalar(1.5e6, 1.2, 2.5e7, 0.75),
          },
          label: {
            text: region.shortName,
            font: 'bold 11px monospace',
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            fillColor: Cesium.Color.fromCssColorString('#38bdf8'),
            outlineColor: Cesium.Color.fromCssColorString('#020617'),
            outlineWidth: 3,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            pixelOffset: new Cesium.Cartesian2(0, -12),
            scaleByDistance: new Cesium.NearFarScalar(1.5e6, 1.0, 2.5e7, 0.6),
          },
        })
        entities.push(entity)
      })
      regionEntitiesRef.current = entities

      // Setup Click Event Handler for Region Selection and Coordinate Picking
      const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)
      handler.setInputAction((click) => {
        const picked = viewer.scene.pick(click.position)
        if (Cesium.defined(picked) && picked.id && picked.id.id) {
          handleSelectRegion(picked.id.id)
          return
        }

        const ray = viewer.camera.getPickRay(click.position)
        if (!ray) return
        const cartesian = viewer.scene.globe.pick(ray, viewer.scene)
        if (cartesian) {
          const cartographic = Cesium.Cartographic.fromCartesian(cartesian)
          const lat = Cesium.Math.toDegrees(cartographic.latitude)
          const lon = Cesium.Math.toDegrees(cartographic.longitude)
          handlePickCustomCoordinates(lat, lon)
        }
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

      // Listen to Camera Movement to update Live Telemetry HUD
      viewer.camera.changed.addEventListener(() => {
        if (!viewer || viewer.isDestroyed()) return
        const carto = viewer.camera.positionCartographic
        if (carto) {
          setCameraInfo({
            altitudeKm: Math.round(carto.height / 1000),
            lat: Math.round(Cesium.Math.toDegrees(carto.latitude) * 100) / 100,
            lon: Math.round(Cesium.Math.toDegrees(carto.longitude) * 100) / 100,
            headingDeg: Math.round(Cesium.Math.toDegrees(viewer.camera.heading)),
            pitchDeg: Math.round(Cesium.Math.toDegrees(viewer.camera.pitch)),
          })
        }
      })

      // Initial Fly-to Arctic Sea Ice
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(0.0, 78.5, 9500000),
        duration: 2.0,
      })

      setIsGlobeReady(true)
    } catch (e) {
      console.error('Cesium Viewer initialization error:', e)
    }

    return () => {
      if (viewer && !viewer.isDestroyed()) {
        try {
          const canvas = viewer.scene.canvas
          if (canvas) {
            canvas.removeEventListener('webglcontextlost', onContextLost)
            canvas.removeEventListener('webglcontextrestored', onContextRestored)
          }
        } catch (e) {}
        viewer.destroy()
        viewerRef.current = null
      }
    }
  }, [])

  // ==========================================================================
  // 2. DYNAMIC NASA GIBS WMTS OVERLAY LAYER WITH SMOOTH CROSS-FADE
  // ==========================================================================
  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer || viewer.isDestroyed() || !isGlobeReady) return

    const oldLayer = gibsLayerRef.current
    const currentLayer = VISUALIZATION_LAYERS.find(l => l.id === activeLayerId) || VISUALIZATION_LAYERS[0]
    const dateSegment = selectedDate || 'default'

    try {
      // Build authentic NASA GIBS WMTS tile URL (EPSG:3857)
      const gibsUrl = `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${currentLayer.gibsLayer}/default/${dateSegment}/${currentLayer.matrixSet}/{z}/{y}/{x}.${currentLayer.format}`

      const gibsProvider = new Cesium.UrlTemplateImageryProvider({
        url: gibsUrl,
        tilingScheme: new Cesium.WebMercatorTilingScheme(),
        maximumLevel: currentLayer.maxZoom || 9,
        credit: new Cesium.Credit(`NASA GIBS - ${currentLayer.satellite}`),
        hasAlphaChannel: currentLayer.format === 'png',
      })

      // Gracefully handle failed tile requests without crashing
      gibsProvider.errorEvent.addEventListener((tileErr) => {
        setTileErrorCount(prev => prev + 1)
        console.warn(`NASA GIBS tile load failure for layer ${currentLayer.id} (gracefully handled):`, tileErr)
      })

      const newLayer = viewer.imageryLayers.addImageryProvider(gibsProvider)
      newLayer.alpha = 0.0
      gibsLayerRef.current = newLayer

      // Smooth layer cross-fade animation (450ms cubic ease-out)
      const startTime = performance.now()
      const fadeDuration = 450
      let animId

      const stepFade = (time) => {
        const elapsed = time - startTime
        const progress = Math.min(1.0, elapsed / fadeDuration)
        const eased = 1.0 - Math.pow(1.0 - progress, 3)

        if (newLayer && !viewer.isDestroyed()) {
          newLayer.alpha = eased * overlayOpacity
        }
        if (oldLayer && !viewer.isDestroyed()) {
          oldLayer.alpha = (1.0 - eased) * overlayOpacity
        }

        if (progress < 1.0) {
          animId = requestAnimationFrame(stepFade)
        } else {
          if (oldLayer && !viewer.isDestroyed()) {
            viewer.imageryLayers.remove(oldLayer, true)
          }
        }
      }

      animId = requestAnimationFrame(stepFade)

      return () => {
        if (animId) cancelAnimationFrame(animId)
      }
    } catch (err) {
      console.warn('Failed to load NASA GIBS layer into Cesium:', err)
    }
  }, [activeLayerId, selectedDate, overlayOpacity, isGlobeReady])

  // Update opacity dynamically
  useEffect(() => {
    if (gibsLayerRef.current) {
      gibsLayerRef.current.alpha = overlayOpacity
    }
  }, [overlayOpacity])

  // ==========================================================================
  // 3. SCIENTIFIC DATA RETRIEVAL (NASA EARTHDATA / FASTAPI)
  // ==========================================================================
  const loadScientificData = useCallback(async (regionIdOrName, coords, layerId, dateStr) => {
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
  }, [])

  // Sync scientific telemetry when region, layer, or date changes
  useEffect(() => {
    if (!customPoint && activeRegion) {
      loadScientificData(selectedRegionId, activeRegion.coordinates, activeLayerId, selectedDate)
    }
  }, [selectedRegionId, activeLayerId, selectedDate, customPoint, activeRegion, loadScientificData])

  // ==========================================================================
  // 4. INTERACTIVE SELECTION & 3D CAMERA FLIGHT
  // ==========================================================================
  const handleSelectRegion = (regionId) => {
    setSelectedRegionId(regionId)
    setCustomPoint(null)
    if (customMarkerEntityRef.current && viewerRef.current && !viewerRef.current.isDestroyed()) {
      viewerRef.current.entities.remove(customMarkerEntityRef.current)
      customMarkerEntityRef.current = null
    }

    const region = GEOGRAPHIC_REGIONS.find(r => r.id === regionId)
    if (region && viewerRef.current && !viewerRef.current.isDestroyed()) {
      const targetHeight = Math.max(1200000, 22000000 / Math.pow(2, region.coordinates.zoom - 1))
      viewerRef.current.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(
          region.coordinates.lng,
          region.coordinates.lat,
          targetHeight
        ),
        duration: 1.8,
      })
    }

    loadScientificData(regionId, region?.coordinates, activeLayerId, selectedDate)

    if (isPlayingRegion && region) {
      audifyRegion(region)
    }

    if (onLocationSelect && region) {
      onLocationSelect({
        id: region.id,
        name: region.name,
        lat: region.coordinates.lat,
        lon: region.coordinates.lng,
        category: region.category,
        description: region.description
      })
    }
    if (onNavigate && region) {
      onNavigate(region)
    }
  }

  const handlePickCustomCoordinates = (lat, lon, triggerCallback = true) => {
    const normLat = Math.round(lat * 100) / 100
    const normLon = Math.round(lon * 100) / 100

    const isPolar = Math.abs(normLat) > 65
    const isEquatorial = Math.abs(normLat) < 15
    const isOcean = Math.abs(normLon) > 120 || (Math.abs(normLat) < 40 && Math.abs(normLon) < 20 && Math.abs(normLon) > 5)

    const estLum = isPolar ? 220 : isOcean ? 75 : isEquatorial ? 95 : 160
    const estHue = isPolar ? 200 : isOcean ? 225 : isEquatorial ? 135 : 45
    const estEdges = isOcean ? 0.08 : isPolar ? 0.09 : 0.28

    // Update or add 3D Pin Entity on Cesium globe
    if (viewerRef.current && !viewerRef.current.isDestroyed()) {
      if (customMarkerEntityRef.current) {
        viewerRef.current.entities.remove(customMarkerEntityRef.current)
      }
      customMarkerEntityRef.current = viewerRef.current.entities.add({
        name: `Selected: ${normLat}°, ${normLon}°`,
        position: Cesium.Cartesian3.fromDegrees(normLon, normLat, 25000),
        point: {
          pixelSize: 12,
          color: Cesium.Color.fromCssColorString('#f43f5e'),
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2,
          scaleByDistance: new Cesium.NearFarScalar(1.5e6, 1.2, 2.5e7, 0.75),
        },
        label: {
          text: `TARGET [${normLat}°, ${normLon}°]`,
          font: 'bold 11px monospace',
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          fillColor: Cesium.Color.fromCssColorString('#f43f5e'),
          outlineColor: Cesium.Color.fromCssColorString('#020617'),
          outlineWidth: 3,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -14),
          scaleByDistance: new Cesium.NearFarScalar(1.5e6, 1.0, 2.5e7, 0.6),
        }
      })
    }

    setCustomPoint({
      lat: normLat,
      lng: normLon,
      coordinates: { lat: normLat, lng: normLon, zoom: 4 },
      name: `Target Coordinates (${normLat}°, ${normLon}°)`,
      shortName: `${normLat}°N, ${normLon}°E`,
      category: isPolar ? 'Cryosphere' : isOcean ? 'Hydrosphere' : isEquatorial ? 'Biosphere' : 'Lithosphere',
      description: `User-selected coordinate target on 3D planetary ellipsoid. Latitude insolation: ${Math.cos((normLat * Math.PI) / 180).toFixed(2)} insolation index.`,
      opticalAnalysis: {
        standardLuminance: estLum,
        normalizedBrightness: estLum / 255,
        meanHueDeg: estHue,
        dominantColorHex: isPolar ? '#E0F2FE' : isOcean ? '#1E293B' : isEquatorial ? '#15803D' : '#D97706',
        dominantColorName: isPolar ? 'Polar Ice / Firn' : isOcean ? 'Ocean Water' : isEquatorial ? 'Tropical Canopy' : 'Arid Ground',
        edgeDensityPct: Math.round(estEdges * 100),
        warmthIndex: isPolar ? 0.1 : isOcean ? 0.2 : 0.8,
        contrastRms: 0.6,
        quadrants: { q1_nw: 0.25, q2_ne: 0.25, q3_sw: 0.25, q4_se: 0.25 },
        colorPalette: [
          { hex: isPolar ? '#E0F2FE' : '#1E293B', percentage: 60, name: 'Primary Surface' },
          { hex: '#0284c7', percentage: 40, name: 'Atmospheric Aerosol' },
        ],
      },
      scientificTelemetry: {
        isCalibrated: false,
        measurementName: 'Ellipsoid Target Point',
        value: `${normLat}° Lat, ${normLon}° Lon`,
        anomaly: 'Spatial Raycast Intersection',
        unit: 'WGS-84 Coordinates',
        confidence: 'Geometric Precision',
        sensorDisclaimer: 'Direct raycast on 3D WGS-84 ellipsoid surface. Calibrated telemetry requested from NASA GIBS.',
      },
      sonification: {
        suggestedStyle: isPolar ? 'atmospheric' : isOcean ? 'ocean_waves' : 'ambient_earth',
        rootNote: isPolar ? 'A3' : isOcean ? 'A2' : 'D3',
        scaleName: isPolar ? 'Lydian Modal' : isOcean ? 'Dorian Modal' : 'Major Pentatonic',
        baseFrequency: isPolar ? '220.0 Hz' : isOcean ? '110.0 Hz' : '146.8 Hz',
        filterCutoffHz: estLum * 25,
        stereoPan: Math.max(-0.85, Math.min(0.85, (normLon / 180) * 0.9)),
        rhythmStyle: 'Ellipsoid Target Synthesis',
        timbreDescription: 'Procedural synthesis from 3D camera coordinates and solar insolation.',
      },
    })

    loadScientificData(null, { lat: normLat, lon: normLon, zoom: 4 }, activeLayerId, selectedDate)

    if (triggerCallback && onLocationSelect) {
      onLocationSelect({
        id: 'custom_point',
        name: `Target (${normLat}°, ${normLon}°)`,
        lat: normLat,
        lon: normLon,
        biome: isPolar ? 'Polar Tundra' : isOcean ? 'Oceanic Pelagic' : isEquatorial ? 'Tropical Rainforest' : 'Continental Temperate',
        coordinates: { lat: normLat, lng: normLon, lon: normLon }
      })
    }
    if (triggerCallback && onNavigate) {
      onNavigate({
        id: 'custom_point',
        name: `Target (${normLat}°, ${normLon}°)`,
        lat: normLat,
        lon: normLon
      })
    }
  }

  // ==========================================================================
  // 5. CAMERA NAVIGATION HELPERS (3D CONTROLS)
  // ==========================================================================
  const handleZoomIn = () => {
    if (!viewerRef.current) return
    viewerRef.current.camera.zoomIn(viewerRef.current.camera.positionCartographic.height * 0.4)
  }

  const handleZoomOut = () => {
    if (!viewerRef.current) return
    viewerRef.current.camera.zoomOut(viewerRef.current.camera.positionCartographic.height * 0.4)
  }

  const handleResetHome = () => {
    if (!viewerRef.current || viewerRef.current.isDestroyed()) return
    setCustomPoint(null)
    if (customMarkerEntityRef.current) {
      viewerRef.current.entities.remove(customMarkerEntityRef.current)
      customMarkerEntityRef.current = null
    }
    viewerRef.current.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(0.0, 20.0, 20000000),
      orientation: {
        heading: 0.0,
        pitch: Cesium.Math.toRadians(-90),
        roll: 0.0,
      },
      duration: 2.0,
    })
  }

  const handleResetNorth = () => {
    if (!viewerRef.current) return
    viewerRef.current.camera.setView({
      orientation: {
        heading: 0.0,
        pitch: Cesium.Math.toRadians(-90),
        roll: 0.0,
      },
    })
  }

  const handleTilt3D = () => {
    if (!viewerRef.current) return
    const currentPitch = viewerRef.current.camera.pitch
    const newPitch = currentPitch < Cesium.Math.toRadians(-50)
      ? Cesium.Math.toRadians(-35)
      : Cesium.Math.toRadians(-90)
    
    viewerRef.current.camera.flyTo({
      destination: viewerRef.current.camera.position,
      orientation: {
        heading: viewerRef.current.camera.heading,
        pitch: newPitch,
        roll: 0.0,
      },
      duration: 1.0,
    })
  }

  // Location search handlers
  const handleSearchChange = (query) => {
    setSearchQuery(query)
    if (!query || !query.trim()) {
      setSearchResults([])
      setIsSearchOpen(false)
      return
    }

    const q = query.toLowerCase().trim()
    const matches = SEARCHABLE_LOCATIONS.filter(loc => 
      loc.name.toLowerCase().includes(q) || loc.category.toLowerCase().includes(q)
    )

    const coords = parseCoordinateQuery(query)
    if (coords) {
      matches.unshift({
        name: `Target Coordinates: ${coords.lat.toFixed(2)}°, ${coords.lon.toFixed(2)}°`,
        lat: coords.lat,
        lon: coords.lon,
        zoom: 6,
        category: 'Custom Geographic Target',
        isCoordinate: true
      })
    }

    setSearchResults(matches.slice(0, 6))
    setIsSearchOpen(matches.length > 0)
  }

  const handleSelectSearchResult = (loc) => {
    setSearchQuery(loc.name)
    setIsSearchOpen(false)

    if (viewerRef.current && !viewerRef.current.isDestroyed()) {
      const height = Math.max(1200000, 22000000 / Math.pow(2, (loc.zoom || 5) - 1))
      viewerRef.current.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(loc.lon, loc.lat, height),
        duration: 2.0,
      })
    }

    handlePickCustomCoordinates(loc.lat, loc.lon)
  }

  // ==========================================================================
  // 6. PROCEDURAL SONIFICATION ENGINE CONNECTION
  // ==========================================================================
  const audifyRegion = (targetRegion) => {
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

    const region = targetRegion || activeRegion
    const opt = region.opticalAnalysis

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
      })),
    }

    const styleToUse = region.sonification?.suggestedStyle || 'ambient_earth'
    setActiveStyle(styleToUse)
    globalSonificationEngine.updateSettings({ style: styleToUse })
    globalSonificationEngine.updateDynamicFrame(normalizedTelemetry, 0.1)
  }

  const togglePlayRegion = async () => {
    if (isPlayingRegion) {
      globalSonificationEngine.pause()
      setIsPlayingRegion(false)
    } else {
      audifyRegion(customPoint || activeRegion)
      await globalSonificationEngine.play()
      setIsPlayingRegion(true)
    }
  }

  // ==========================================================================
  // 7. CORE 3D GLOBE VIEWPORT RENDERER (UNIFIED ACROSS ALL APPLICATION VIEWS)
  // ==========================================================================
  const renderGlobeCanvas = (customStyle = 'aspect-[16/11]') => (
    <div className={`relative ${customStyle} bg-slate-950 rounded-2xl border border-cyan-500/30 overflow-hidden shadow-2xl`}>
      {/* WebGL Context Loss Recovery Banner */}
      {isWebglLost && (
        <div className="absolute inset-0 z-50 bg-slate-950/95 flex flex-col items-center justify-center space-y-3 font-mono p-6 text-center border border-rose-500/40 rounded-2xl">
          <AlertCircle className="w-8 h-8 text-rose-400 animate-pulse" />
          <div className="text-sm font-bold text-slate-100 uppercase">WebGL Hardware Context Reset</div>
          <p className="text-xs text-slate-400 max-w-sm">
            The browser graphics hardware context was temporarily recycled. Click below to reinitialize the 3D planetary engine.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-3 py-1.5 rounded-lg bg-cyan-500 text-slate-950 text-xs font-bold hover:bg-cyan-400"
          >
            RE-INITIALIZE 3D ENGINE
          </button>
        </div>
      )}

      {/* Globe Loading Overlay */}
      <AnimatePresence>
        {isGlobeLoading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-md text-cyan-400 font-mono"
          >
            <div className="relative w-16 h-16 mb-4">
              <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20 animate-ping" />
              <div className="absolute inset-0 rounded-full border-2 border-t-cyan-400 border-r-transparent border-b-cyan-500/40 border-l-transparent animate-spin" />
              <Globe2 className="w-8 h-8 text-cyan-300 absolute inset-0 m-auto" />
            </div>
            <div className="text-sm font-bold tracking-wider text-slate-100">
              INITIALIZING 3D PLANETARY ELLIPSOID
            </div>
            <div className="text-[11px] text-cyan-400/80 mt-1 flex items-center space-x-1.5">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Streaming CesiumJS & NASA GIBS orbital tiles...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cesium Canvas Mount Point */}
      <div ref={cesiumContainerRef} className="w-full h-full z-10" />

      {/* Top-Left Floating HUD: Active Target & Camera Telemetry */}
      <div className="absolute top-3 left-3 z-20 pointer-events-none flex flex-col space-y-1.5 font-mono">
        <div className="bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-cyan-500/30 text-xs shadow-lg flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-cyan-300 font-bold uppercase">
            {displayTarget.shortName || '3D ORBITAL ELLIPSOID'}
          </span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-300 text-[11px]">
            ALT: {cameraInfo.altitudeKm} km
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1">
          <div className="bg-slate-900/85 backdrop-blur-sm px-2.5 py-0.5 rounded text-[10px] text-cyan-300 border border-cyan-500/30 w-fit">
            BASE: {baseImagerySource.toUpperCase()}
          </div>
          <div className="bg-slate-900/85 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] text-emerald-400 border border-slate-800 w-fit">
            NASA: {activeLayer.name}
          </div>
          <div className="bg-slate-900/85 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] text-amber-300 border border-slate-800 w-fit">
            DATE: {selectedDate === 'default' ? 'LATEST' : selectedDate}
          </div>
          {tileErrorCount > 0 && (
            <div className="bg-amber-950/80 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] text-amber-400 border border-amber-600/40 w-fit">
              TILES RETRYING ({tileErrorCount})
            </div>
          )}
        </div>
      </div>

      {/* Top-Right On-Screen 3D Flight Controls (Google Earth Style) */}
      <div className="absolute top-3 right-3 z-20 flex flex-col space-y-1.5 bg-slate-950/85 backdrop-blur-md p-1.5 rounded-xl border border-cyan-500/25 shadow-xl">
        <button
          onClick={handleZoomIn}
          className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          title="Zoom In (+)"
        >
          <ZoomIn className="w-4 h-4 text-cyan-400" />
        </button>

        <button
          onClick={handleZoomOut}
          className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          title="Zoom Out (-)"
        >
          <ZoomOut className="w-4 h-4 text-cyan-400" />
        </button>

        <div className="h-px bg-slate-800 my-0.5" />

        <button
          onClick={handleResetHome}
          className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          title="Reset to Home View"
        >
          <Home className="w-4 h-4 text-sky-400" />
        </button>

        <button
          onClick={handleTilt3D}
          className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          title="Toggle 3D Horizon Tilt"
        >
          <Compass className="w-4 h-4 text-emerald-400" />
        </button>

        <button
          onClick={handleResetNorth}
          className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          title="Reset to North-Up"
        >
          <Navigation className="w-4 h-4 text-amber-400" />
        </button>
      </div>

      {/* Bottom-Left Scientific Colormap Legend */}
      <div className="absolute bottom-3 left-3 z-20 max-w-[270px] bg-slate-950/90 backdrop-blur-md p-2.5 rounded-xl border border-cyan-500/25 shadow-xl font-mono text-[11px] space-y-1.5">
        <div className="flex items-center justify-between text-slate-300">
          <span className="font-bold text-cyan-300 truncate">{activeLayer.name}</span>
          <span className="text-[9px] px-1 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">L3/L4</span>
        </div>
        <div className="text-[10px] text-slate-400 truncate">{activeLayer.satellite}</div>

        {/* Colormap Gradient */}
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
                : activeLayer.id === 'precipitation_daily'
                ? 'linear-gradient(to right, #041628, #0369a1, #818cf8, #c084fc)'
                : 'linear-gradient(to right, #041628, #0369a1, #38bdf8, #a7f3d0)'
            }}
          />
          <div className="flex items-center justify-between text-[9px] text-slate-400">
            <span>{activeLayer.id === 'vegetation_ndvi' ? '-0.20' : activeLayer.id === 'temperature_anomaly' ? '-2.5 °C' : '0.0'}</span>
            <span>{activeLayer.paletteType}</span>
            <span>{activeLayer.id === 'vegetation_ndvi' ? '+1.00' : activeLayer.id === 'temperature_anomaly' ? '+3.5 °C' : 'Max'}</span>
          </div>
        </div>
      </div>

      {/* Bottom-Right Coordinates Readout */}
      <div className="absolute bottom-3 right-3 z-20 font-mono text-[10px] text-slate-300 bg-slate-950/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-cyan-500/30 pointer-events-none flex items-center space-x-2 shadow-lg">
        <Crosshair className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
        <span>
          {displayTarget?.coordinates ? (
            <span className="text-cyan-300 font-bold">
              TARGET: {Number(displayTarget.coordinates.lat).toFixed(2)}°N, {Number(displayTarget.coordinates.lng ?? displayTarget.coordinates.lon).toFixed(2)}°E •{' '}
            </span>
          ) : null}
          <span className="text-slate-400">
            CAMERA: {cameraInfo.lat}°N, {cameraInfo.lon}°E (ALT {cameraInfo.altitudeKm} km)
          </span>
        </span>
      </div>
    </div>
  )

  // ==========================================================================
  // SECTION-SPECIFIC SPECIALIZED 3D GLOBE LAYOUT MODES
  // ==========================================================================

  // 1. Embedded Mode (Earth Explorer Center Workspace, Home Hero)
  if (mode === 'embedded') {
    return (
      <div className={`w-full h-full min-h-[460px] relative ${className}`}>
        {renderGlobeCanvas(height || 'w-full h-full min-h-[460px]')}
      </div>
    )
  }

  // 2. Compact Mode (Sound Studio Dataset Location Preview)
  if (mode === 'compact') {
    return (
      <div className={`w-full h-full min-h-[320px] max-h-[380px] relative ${className}`}>
        {renderGlobeCanvas(height || 'w-full h-[340px]')}
      </div>
    )
  }

  // 3. Climate Intelligence Mode (ERA5 & Anomaly Telemetry)
  if (mode === 'climate') {
    return (
      <div className={`w-full space-y-3 font-mono ${className}`}>
        {renderGlobeCanvas(height || 'w-full aspect-[16/11] min-h-[440px]')}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-cyan-500/20">
          <span className="text-[10px] text-slate-400 shrink-0 uppercase font-bold">FLY TO CLIMATE REGION:</span>
          {GEOGRAPHIC_REGIONS.map((region) => (
            <button
              key={region.id}
              onClick={() => handleSelectRegion(region.id)}
              className={`px-2.5 py-1 rounded-lg text-[10px] whitespace-nowrap transition-all border ${
                selectedRegionId === region.id && !customPoint
                  ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400 shadow-sm'
                  : 'bg-slate-950 text-slate-300 hover:text-white border-slate-800'
              }`}
            >
              {region.shortName}
            </button>
          ))}
        </div>
      </div>
    )
  }

  // 4. Satellite Observatory Mode (NASA Imagery Layers & LEO/GEO Constellations)
  if (mode === 'observatory') {
    return (
      <div className={`w-full space-y-4 font-mono ${className}`}>
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-slate-900/90 border border-cyan-500/20">
          <div className="flex items-center space-x-2 text-xs">
            <Satellite className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span className="font-bold text-slate-100">NASA OBSERVATORY SATELLITE TILES:</span>
            <Badge variant="cyan" size="sm">{activeLayer.name.toUpperCase()}</Badge>
          </div>
          <div className="flex flex-wrap gap-1 text-[10px]">
            {VISUALIZATION_LAYERS.map(l => (
              <button
                key={l.id}
                onClick={() => setActiveLayerId(l.id)}
                className={`px-2 py-0.5 rounded border transition-all ${
                  activeLayerId === l.id
                    ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400'
                    : 'bg-slate-950 text-slate-400 hover:text-white border-slate-800'
                }`}
              >
                {l.name}
              </button>
            ))}
          </div>
        </div>
        {renderGlobeCanvas(height || 'w-full h-[520px]')}
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${isFullscreen ? 'fixed inset-0 z-50 bg-slate-950 p-6 overflow-y-auto' : ''}`}>

      {/* Header Bar: Status & Mode Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/80 border border-cyan-500/20 backdrop-blur-md shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-md shadow-cyan-500/10">
            <Globe2 className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-extrabold text-slate-100 tracking-tight">
                Google Earth 3D Planetary Console
              </h2>
              <Badge variant="cyan" size="sm">CESIUMJS + SENTINEL-2</Badge>
              <Badge variant="emerald" size="sm">NASA GIBS WMTS</Badge>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Photorealistic 3D WGS-84 Earth globe combining global Sentinel-2 imagery with authentic NASA Earth science layers.
            </p>
          </div>
        </div>

        {/* Quick View Controls */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold text-slate-300 hover:text-white bg-slate-800 border border-slate-700 hover:border-cyan-400/40 transition-all"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 text-cyan-400" /> : <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />}
            <span>{isFullscreen ? 'EXIT FULLSCREEN' : 'EXPAND 3D'}</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Grid: 3D Cesium Viewport (7 cols) + Telemetry & Audio Deck (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Column (7 cols): CesiumJS 3D Globe + Location Search + Layer Switcher + Date Picker */}
        <div className="lg:col-span-7 space-y-4">

          {/* Location & Coordinate Geographic Search Bar */}
          <div className="relative z-30">
            <div className="relative flex items-center bg-slate-900/90 border border-cyan-500/30 rounded-xl px-3.5 py-2.5 shadow-lg backdrop-blur-md focus-within:ring-2 focus-within:ring-cyan-400/50">
              <Search className="w-4 h-4 text-cyan-400 mr-2.5 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => searchQuery.trim() && setIsSearchOpen(true)}
                placeholder="Search global location or coordinates (e.g. Tokyo, Sahara, Shivamogga, 13.93, 75.57)..."
                className="w-full bg-transparent text-xs font-mono text-slate-100 placeholder-slate-400 focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setIsSearchOpen(false)
                  }}
                  className="p-1 text-slate-400 hover:text-white transition-colors"
                  title="Clear Search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Autocomplete Dropdown */}
            <AnimatePresence>
              {isSearchOpen && searchResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute top-full mt-1.5 inset-x-0 bg-slate-950/95 border border-cyan-500/40 rounded-xl shadow-2xl backdrop-blur-xl overflow-hidden z-40 max-h-60 overflow-y-auto"
                >
                  {searchResults.map((loc, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectSearchResult(loc)}
                      className="w-full text-left px-3.5 py-2.5 hover:bg-cyan-500/15 border-b border-slate-800/80 last:border-b-0 flex items-center justify-between text-xs font-mono transition-colors group cursor-pointer"
                    >
                      <div className="flex items-center space-x-2.5">
                        <MapPin className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
                        <div>
                          <div className="text-slate-100 font-bold">{loc.name}</div>
                          <div className="text-[10px] text-slate-400">{loc.category}</div>
                        </div>
                      </div>
                      <div className="text-[10px] text-cyan-300 font-mono">
                        {loc.lat.toFixed(2)}°, {loc.lon.toFixed(2)}°
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 3D Cesium Globe Container */}
          {renderGlobeCanvas('aspect-[16/11]')}

          {/* NASA GIBS Date Picker & Temporal Scrubber */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2.5 font-mono">
            <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
              <span className="text-cyan-400 font-bold flex items-center space-x-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>NASA GIBS HISTORICAL OBSERVATION EPOCH</span>
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

            {/* Layer Opacity Slider */}
            <div className="flex items-center space-x-3 pt-1 border-t border-slate-800/80 text-[11px]">
              <span className="text-slate-400 shrink-0 flex items-center gap-1">
                <Sliders className="w-3 h-3 text-cyan-400" />
                <span>OVERLAY BLEND:</span>
              </span>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={overlayOpacity}
                onChange={(e) => setOverlayOpacity(parseFloat(e.target.value))}
                className="flex-1 accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <span className="text-cyan-400 font-bold font-mono">
                {Math.round(overlayOpacity * 100)}%
              </span>
            </div>
          </div>

          {/* NASA Visualization Layer Switcher */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span className="flex items-center space-x-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>SELECT NASA EARTH OBSERVATION LAYER:</span>
              </span>
              <span className="text-cyan-400 font-bold">{activeLayer.satellite}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
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

          {/* Quick Region Presets (Click to Fly in 3D) */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <span className="text-xs font-mono text-slate-400 flex items-center space-x-1.5">
              <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
              <span>GEOGRAPHIC REGION PRESETS (CLICK TO FLY IN 3D):</span>
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

        {/* Right Column (5 cols): Scientific Telemetry & 3D Sonification Deck */}
        <div className="lg:col-span-5 space-y-4">
          <GlassPanel
            title={displayTarget.name || 'Planetary Analysis'}
            subtitle={displayTarget.category ? `${displayTarget.category.toUpperCase()} • 3D CESIUM SATELLITE TELEMETRY` : 'GEOGRAPHIC TARGET'}
            icon={Activity}
          >
            <div className="space-y-4">
              
              {/* Target Description */}
              <p className="text-xs text-slate-300 leading-relaxed">
                {displayTarget.description}
              </p>

              {/* 3D Audification Transport Deck */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-cyan-950/40 to-slate-950 border border-cyan-500/30 flex items-center justify-between shadow-lg">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block">
                    3D REGION SONIFICATION
                  </span>
                  <span className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                    <span>Root: {displayTarget.sonification?.rootNote || 'D3'}</span>
                    <span className="text-slate-500">•</span>
                    <span>Style: {activeStyle.replace('_', ' ').toUpperCase()}</span>
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
                    {isPlayingRegion ? 'Pause' : 'Audify 3D Region'}
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

              {/* Loading Indicator */}
              {isLoadingScientificData && (
                <div className="p-3 rounded-xl bg-slate-950/80 border border-cyan-500/30 flex items-center space-x-2.5 text-xs font-mono text-cyan-300">
                  <Activity className="w-4 h-4 animate-spin text-cyan-400 shrink-0" />
                  <div>
                    <div className="font-bold">DOWNLINKING NASA EARTHDATA & GIBS TILES...</div>
                    <div className="text-[10px] text-slate-400">Computing physical parameters for 3D coordinates</div>
                  </div>
                </div>
              )}

              {/* Error Banner */}
              {dataError && !isLoadingScientificData && (
                <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 text-xs font-mono text-amber-300 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                  <span className="text-[11px]">{dataError} Displaying regional sensor reference.</span>
                </div>
              )}

              {/* Authentic NASA Calibrated Scientific Measurements */}
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

              {/* Optical Features Grid */}
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

              {/* Regional Dominant Spectral Clusters */}
              {displayTarget.opticalAnalysis.colorPalette && (
                <div className="space-y-1.5">
                  <div className="text-[11px] font-mono text-slate-400">SPECTRAL COLOR PALETTE:</div>
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

              {/* Sensor Telemetry Disclaimer */}
              <div className={`p-3 rounded-lg border text-xs font-mono space-y-1.5 ${
                displayTarget.scientificTelemetry?.isCalibrated
                  ? 'bg-emerald-950/30 border-emerald-500/30'
                  : 'bg-amber-950/30 border-amber-500/30'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold flex items-center gap-1.5 text-slate-200">
                    {displayTarget.scientificTelemetry?.isCalibrated ? (
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-400" />
                    )}
                    <span>
                      {displayTarget.scientificTelemetry?.isCalibrated
                        ? 'CALIBRATED MISSION TELEMETRY'
                        : 'UNCALIBRATED SPATIAL MODEL'}
                    </span>
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {displayTarget.scientificTelemetry?.confidence}
                  </span>
                </div>

                <div className="text-slate-300">
                  <span className="text-slate-400">{displayTarget.scientificTelemetry?.measurementName}: </span>
                  <strong className="text-white">{displayTarget.scientificTelemetry?.value}</strong>
                  {displayTarget.scientificTelemetry?.anomaly && (
                    <span className="text-cyan-300 ml-1">({displayTarget.scientificTelemetry?.anomaly})</span>
                  )}
                </div>

                <p className="text-[10px] text-slate-400 leading-normal border-t border-slate-800/80 pt-1">
                  {displayTarget.scientificTelemetry?.sensorDisclaimer}
                </p>
              </div>

            </div>
          </GlassPanel>
        </div>

      </div>

    </div>
  )
}
