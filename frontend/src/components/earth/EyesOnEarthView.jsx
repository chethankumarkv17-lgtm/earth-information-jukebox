import React, { useRef, useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Globe2, 
  Satellite, 
  Radio, 
  Compass, 
  Layers, 
  Sliders, 
  Volume2, 
  Play, 
  Pause, 
  Maximize2, 
  Minimize2, 
  RotateCw, 
  Info, 
  ExternalLink,
  Activity,
  Flame,
  Droplets,
  Wind,
  Snowflake,
  Sun,
  ShieldAlert,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Waves,
  Search,
  Zap,
  Network,
  BarChart3,
  Eye,
  EyeOff,
  Crosshair,
  AlertTriangle
} from 'lucide-react'
import globalSonificationEngine from '../../services/sonificationEngine'
import { useAccessibility } from '../../context/AccessibilityContext'

/**
 * NASA & ESA High-Interactivity Aerospace Planetary Command Center
 * Directly inspired by:
 * - Image 1: Cyber 3D Globe with FIRMS Fires, Submarine Cable Arcs, and Layer Switchboard
 * - Image 2: Extruded 3D Data Spikes radiating from continents with Search & Threshold Controls
 * - Image 3: Earth Pulse v1.0 Mission Control (Solar Activity, Live Stats, Streaming Event Feed)
 * - Image 4: Earth HQ / nullschool dynamic wind streamlines & planetary emergency heatmap
 */
export default function EyesOnEarthView({ onSelectDataset }) {
  const canvasRef = useRef(null)
  
  // Interactive View Modes (Matches Image 1 top right & Image 4)
  // 'realistic' | 'wind' | 'spikes' | 'fires' | 'night'
  const [viewMode, setViewMode] = useState('realistic')

  // Drag-to-Rotate & Inertia State (Full 360° Globe Interaction)
  const rotationRef = useRef({ lon: 0, lat: 15 })
  const [isDragging, setIsDragging] = useState(false)
  const dragRef = useRef({ startX: 0, startY: 0, lastLon: 0, lastLat: 15, vx: 0, vy: 0 })
  const [autoRotate, setAutoRotate] = useState(true)

  // Interactive Layer Visibility Toggles (Matches Image 1 right panel)
  const [layers, setLayers] = useState({
    satellites: true,
    windStreamlines: true,
    dataSpikes: true,
    firmsFires: true,
    submarineCables: true,
    nightLights: true,
    earthquakes: true
  })

  // Telemetry & Selection State
  const [activeSatellite, setActiveSatellite] = useState('terra')
  const [activeVitalSign, setActiveVitalSign] = useState('satellites')
  const [selectedEntity, setSelectedEntity] = useState(null)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [utcTime, setUtcTime] = useState('')
  const [hoveredTarget, setHoveredTarget] = useState(null)

  const { playEarcon, announce } = useAccessibility()

  // Real-time UTC satellite clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setUtcTime(now.toUTCString().replace('GMT', 'UTC'))
    }
    updateTime()
    const timer = setInterval(updateTime, 1000)
    return () => clearInterval(timer)
  }, [])

  // 10 NASA Vital Signs of the Planet (Matches Image 3 bottom ribbon)
  const vitalSigns = [
    { id: 'satellites', name: 'Satellites Now', icon: Satellite, color: '#38bdf8', unit: '14 Active LEO', value: 'Fleet Online', freq: 440, style: 'ambient_earth' },
    { id: 'visible', name: 'Visible Earth', icon: Sun, color: '#22d3ee', unit: 'NASA Blue Marble', value: '0.31 Albedo', freq: 523.25, style: 'ambient_earth' },
    { id: 'temperature', name: 'Air Temperature', icon: Flame, color: '#f97316', unit: 'GISTEMP Anomaly', value: '+1.45 °C vs Pre-Ind', freq: 330, style: 'atmospheric' },
    { id: 'carbon', name: 'Carbon Dioxide', icon: Activity, color: '#ec4899', unit: 'OCO-2 / AIRS XCO2', value: '424.8 ppm', freq: 220, style: 'electronic' },
    { id: 'sea_level', name: 'Sea Level Freeboard', icon: Droplets, color: '#06b6d4', unit: 'Sentinel-6 / ICESat-2', value: '+101.2 mm Global', freq: 196, style: 'ocean_waves' },
    { id: 'ice_melt', name: 'Cryosphere Ice', icon: Snowflake, color: '#93c5fd', unit: 'CryoSat / ICESat-2', value: '-12.8% / Decade', freq: 659.25, style: 'ambient_earth' },
    { id: 'vegetation', name: 'Vegetation NDVI', icon: Sparkles, color: '#10b981', unit: 'Terra MODIS Canopy', value: '0.78 Mean Index', freq: 392, style: 'ambient_earth' },
    { id: 'soil_moisture', name: 'Soil Moisture', icon: Droplets, color: '#eab308', unit: 'NASA SMAP L4', value: '0.24 m³/m³', freq: 261.63, style: 'atmospheric' },
    { id: 'ozone', name: 'Ozone Hole', icon: Wind, color: '#a855f7', unit: 'Aura OMI / OMPS', value: '228 Dobson Units', freq: 587.33, style: 'electronic' },
    { id: 'ocean_color', name: 'Ocean Color (PACE)', icon: Waves, color: '#14b8a6', unit: 'PACE OCI Chlorophyll', value: '0.28 mg/m³', freq: 174.61, style: 'ocean_waves' },
  ]

  // NASA Earth Satellites (Matches Image 3)
  const satellites = [
    { id: 'terra', name: 'Terra (EOS AM-1)', mission: 'MODIS / ASTER', altKm: 705, incDeg: 98.2, speed: 1.8, color: '#38bdf8', category: 'Vegetation & Albedo' },
    { id: 'aqua', name: 'Aqua (EOS PM-1)', mission: 'MODIS / AIRS', altKm: 705, incDeg: 98.2, speed: -1.7, color: '#06b6d4', category: 'Hydrologic Cycle' },
    { id: 'icesat2', name: 'ICESat-2', mission: 'ATLAS Laser Altimeter', altKm: 496, incDeg: 92.0, speed: 2.3, color: '#e0f2fe', category: 'Cryosphere Sea Ice' },
    { id: 'swot', name: 'SWOT', mission: 'KaRIn Radar Altimeter', altKm: 891, incDeg: 77.6, speed: -1.5, color: '#818cf8', category: 'Ocean Surface Water' },
    { id: 'landsat9', name: 'Landsat 9', mission: 'OLI-2 / TIRS-2', altKm: 705, incDeg: 98.2, speed: 1.9, color: '#34d399', category: 'Land Surface Reflectance' },
    { id: 'pace', name: 'PACE', mission: 'Ocean Color Instrument', altKm: 676.5, incDeg: 98.0, speed: -2.1, color: '#2dd4bf', category: 'Plankton & Aerosols' },
    { id: 'sentinel6', name: 'Sentinel-6 Michael Freilich', mission: 'Poseidon-4 Radar', altKm: 1336, incDeg: 66.0, speed: 1.2, color: '#fbbf24', category: 'Sea Level Rise' },
    { id: 'smap', name: 'SMAP', mission: 'L-band Radiometer', altKm: 685, incDeg: 98.1, speed: 2.0, color: '#f59e0b', category: 'Soil Moisture' },
  ]

  // NASA FIRMS Active Wildfire Hotspots (Matches Image 1 red fire clusters)
  const firmsFires = [
    { id: 'fire-amazon', name: 'Amazon Basin Fire Cell', lat: -5.2, lon: -54.8, intensity: 'High (340 MW)', color: '#ef4444' },
    { id: 'fire-congo', name: 'Congo Savanna Biomass', lat: -2.1, lon: 23.4, intensity: 'Severe (420 MW)', color: '#f97316' },
    { id: 'fire-boreal', name: 'Siberian Taiga Burn', lat: 62.5, lon: 118.2, intensity: 'Moderate (210 MW)', color: '#ef4444' },
    { id: 'fire-california', name: 'Sierra Nevada Chaparral', lat: 37.8, lon: -119.5, intensity: 'Active (180 MW)', color: '#f97316' },
    { id: 'fire-aus', name: 'Arnhem Land Bushfire', lat: -13.2, lon: 132.8, intensity: 'High (310 MW)', color: '#ef4444' },
  ]

  // Submarine Fiber Optic Oceanic Arcs (Matches Image 1 luminous ocean cables)
  const submarineCables = [
    { from: [40.7, -74.0], to: [51.5, -0.1], name: 'Transatlantic TAT-14', color: '#38bdf8' },
    { from: [35.6, 139.6], to: [37.7, -122.4], name: 'Transpacific Express', color: '#06b6d4' },
    { from: [25.2, 55.3], to: [1.3, 103.8], name: 'SEA-ME-WE 5 (Red Sea to Singapore)', color: '#22d3ee' },
    { from: [-22.9, -43.1], to: [38.7, -9.1], name: 'EllaLink (Brazil to Portugal)', color: '#818cf8' },
  ]

  // 3D Extruded Data Spikes / Pillars (Matches Image 2 3D population/anomaly spikes)
  const dataSpikes = [
    { id: 'spike-tokyo', name: 'Tokyo Megacity Heat Island', lat: 35.6, lon: 139.6, height: 45, color: '#ec4899', val: '37.4M' },
    { id: 'spike-delhi', name: 'Indo-Gangetic Air Inversion', lat: 28.6, lon: 77.2, height: 40, color: '#f59e0b', val: 'PM2.5 320' },
    { id: 'spike-amazon', name: 'Amazon Canopy Photosynthesis', lat: -3.4, lon: -62.2, height: 35, color: '#10b981', val: 'NDVI 0.91' },
    { id: 'spike-arctic', name: 'Chukchi Sea Albedo Loss', lat: 72.0, lon: -170.0, height: 38, color: '#38bdf8', val: '-48% Ice' },
    { id: 'spike-pacific', name: 'Kelvin Wave Thermal Peak', lat: 0.0, lon: -140.0, height: 32, color: '#f97316', val: '+2.8 °C' },
    { id: 'spike-sahara', name: 'Erg Chebbi Radiance Peak', lat: 25.0, lon: 12.0, height: 30, color: '#eab308', val: 'Albedo 0.46' },
  ]

  // Real-Time Seismic Earthquakes (Matches Image 3 seismic event feed)
  const earthquakes = [
    { id: 'eq-japan', name: 'M5.9 Honshu, Japan', lat: 38.2, lon: 142.4, mag: 5.9, depth: '32 km', time: '14m ago' },
    { id: 'eq-hawaii', name: 'M4.2 Pahala, Hawaii', lat: 19.2, lon: -155.5, mag: 4.2, depth: '8 km', time: '48m ago' },
    { id: 'eq-chile', name: 'M5.1 Antofagasta, Chile', lat: -23.6, lon: -70.4, mag: 5.1, depth: '45 km', time: '2h ago' },
    { id: 'eq-alaska', name: 'M4.6 Fox Islands, Alaska', lat: 52.8, lon: -168.2, mag: 4.6, depth: '18 km', time: '3h ago' },
  ]

  // Real-time Event Feed items (Matches Image 3 bottom-right event log)
  const [eventFeed, setEventFeed] = useState([
    { id: 1, time: '14m', text: 'M5.9 Earthquake detected - 21 km NE of Otobe, Japan', type: 'seismic', color: '#ef4444' },
    { id: 2, time: '32m', text: 'NASA FIRMS: Severe thermal hotspot in Congo Savanna (420 MW)', type: 'fire', color: '#f97316' },
    { id: 3, time: '1h', text: 'ICESat-2 Laser Grid tracks Beaufort Sea ice freeboard at 1.15m', type: 'cryo', color: '#38bdf8' },
    { id: 4, time: '2h', text: 'ISS completed orbital sunrise over North Pacific Ocean', type: 'iss', color: '#22d3ee' },
    { id: 5, time: '3h', text: 'SWOT Ka-band radar captures 18cm mesoscale oceanic eddy', type: 'ocean', color: '#818cf8' },
  ])

  // Toggle Layer Helper
  const toggleLayer = (layerKey) => {
    setLayers(prev => ({ ...prev, [layerKey]: !prev[layerKey] }))
    playEarcon('volume_blip')
  }

  // Handle Search Input & Fly-To
  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    const query = searchQuery.toLowerCase()
    // Look up in spikes, beacons, satellites, or predefined coordinates
    const foundSpike = dataSpikes.find(s => s.name.toLowerCase().includes(query))
    const foundSat = satellites.find(s => s.name.toLowerCase().includes(query))
    const foundFire = firmsFires.find(f => f.name.toLowerCase().includes(query))

    if (foundSpike) {
      flyTo(foundSpike.lat, foundSpike.lon)
      setSelectedEntity({ title: foundSpike.name, val: foundSpike.val, type: 'Data Spike', color: foundSpike.color })
      announce(`Focused on ${foundSpike.name}`)
    } else if (foundFire) {
      flyTo(foundFire.lat, foundFire.lon)
      setSelectedEntity({ title: foundFire.name, val: foundFire.intensity, type: 'NASA FIRMS Fire', color: foundFire.color })
      announce(`Focused on ${foundFire.name}`)
    } else if (foundSat) {
      setActiveSatellite(foundSat.id)
      announce(`Focused on ${foundSat.name}`)
    } else if (query.includes('amazon')) {
      flyTo(-3.4, -62.2)
    } else if (query.includes('arctic') || query.includes('ice')) {
      flyTo(75.0, -140.0)
    } else if (query.includes('japan') || query.includes('tokyo')) {
      flyTo(35.6, 139.6)
    } else if (query.includes('sahara')) {
      flyTo(25.0, 12.0)
    }
    setSearchQuery('')
  }

  // Smooth Fly-To Coordinate Function
  const flyTo = (targetLat, targetLon) => {
    setAutoRotate(false)
    rotationRef.current = {
      lat: Math.max(-60, Math.min(60, targetLat)),
      lon: ((-targetLon * Math.PI) / 180)
    }
    playEarcon('play_chime')
    if (globalSonificationEngine) {
      globalSonificationEngine.updateSettings({
        style: 'electronic',
        volume: 85
      })
      if (!isPlayingAudio) {
        globalSonificationEngine.play()
        setIsPlayingAudio(true)
      }
    }
  }

  // Handle Dragging
  const handleMouseDown = (e) => {
    setIsDragging(true)
    setAutoRotate(false)
    dragRef.current.startX = e.clientX
    dragRef.current.startY = e.clientY
    dragRef.current.lastLon = rotationRef.current.lon
    dragRef.current.lastLat = rotationRef.current.lat
  }

  const handleMouseMove = (e) => {
    if (!isDragging) return
    const dx = e.clientX - dragRef.current.startX
    const dy = e.clientY - dragRef.current.startY

    const newLon = dragRef.current.lastLon + dx * 0.006
    const newLat = Math.max(-65, Math.min(65, dragRef.current.lastLat - dy * 0.25))

    rotationRef.current = { lon: newLon, lat: newLat }
    dragRef.current.vx = dx * 0.0002
    dragRef.current.vy = dy * 0.01
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // --------------------------------------------------------------------------
  // HIGH-PERFORMANCE 60FPS CANVAS RENDERING ENGINE WITH VECTOR STREAMS
  // --------------------------------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animId

    // Atmospheric wind stream particles buffer (Image 4 match)
    const particleCount = 110
    const windParticles = Array.from({ length: particleCount }, () => ({
      lat: (Math.random() - 0.5) * 120,
      lon: Math.random() * 360,
      speed: 0.4 + Math.random() * 0.8,
      length: 8 + Math.random() * 12,
      life: Math.random() * 100
    }))

    // Continent Geometries
    const continents = [
      [[35, -5], [37, 10], [30, 32], [12, 43], [12, 51], [-4, 40], [-26, 32], [-34, 18], [-15, 12], [4, 9], [15, -17], [28, -13]], // Africa
      [[36, -9], [43, -9], [48, -4], [54, 8], [58, 20], [70, 28], [60, 50], [45, 40], [40, 26], [38, 15], [44, 12]], // Europe
      [[72, -155], [68, -165], [55, -165], [58, -135], [48, -125], [32, -117], [20, -105], [15, -92], [22, -97], [30, -82], [45, -65], [55, -58], [65, -65], [72, -90], [75, -120]], // North America
      [[12, -72], [10, -60], [-5, -35], [-22, -41], [-35, -55], [-55, -68], [-42, -74], [-15, -75], [-4, -81], [5, -77]], // South America
      [[75, 100], [70, 160], [60, 170], [45, 140], [35, 120], [22, 115], [10, 105], [20, 85], [25, 68], [30, 50], [40, 48], [55, 60], [68, 75]], // Asia
      [[-12, 130], [-15, 136], [-24, 150], [-38, 145], [-35, 115], [-20, 115]], // Australia
      [[-70, 0], [-72, 60], [-70, 120], [-71, 180], [-70, -120], [-68, -60]] // Antarctica
    ]

    let timeStep = 0

    const render = () => {
      timeStep += 0.02
      if (autoRotate && !isDragging) {
        rotationRef.current.lon += 0.0025
      }

      const rect = canvas.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
        canvas.width = rect.width * dpr
        canvas.height = rect.height * dpr
      }

      ctx.save()
      ctx.scale(dpr, dpr)

      const width = rect.width
      const height = rect.height
      const cx = width / 2
      const cy = height / 2
      const radius = Math.min(width, height) * 0.36

      ctx.clearRect(0, 0, width, height)

      // 1. STARFIELD WITH DISTANT GALACTIC NEBULAE
      for (let i = 0; i < 70; i++) {
        const sx = ((i * 143.7) % width)
        const sy = ((i * 257.3) % height)
        const sAlpha = 0.25 + 0.45 * Math.sin(timeStep * 2 + i)
        ctx.fillStyle = `rgba(255, 255, 255, ${sAlpha})`
        ctx.beginPath()
        ctx.arc(sx, sy, (i % 4 === 0) ? 1.4 : 0.8, 0, Math.PI * 2)
        ctx.fill()
      }

      // 2. ATMOSPHERIC LIMB GLOW
      const glowGrad = ctx.createRadialGradient(cx, cy, radius * 0.95, cx, cy, radius * 1.35)
      glowGrad.addColorStop(0, viewMode === 'fires' ? 'rgba(239, 68, 68, 0.35)' : 'rgba(56, 189, 248, 0.45)')
      glowGrad.addColorStop(0.3, 'rgba(6, 182, 212, 0.2)')
      glowGrad.addColorStop(0.7, 'rgba(3, 105, 161, 0.06)')
      glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)')
      ctx.fillStyle = glowGrad
      ctx.beginPath()
      ctx.arc(cx, cy, radius * 1.35, 0, Math.PI * 2)
      ctx.fill()

      // 3. EARTH DEEP SPHERE BASE
      const oceanGrad = ctx.createRadialGradient(cx - radius * 0.35, cy - radius * 0.35, radius * 0.15, cx, cy, radius)
      if (viewMode === 'night') {
        oceanGrad.addColorStop(0, '#040b17')
        oceanGrad.addColorStop(1, '#01050a')
      } else {
        oceanGrad.addColorStop(0, '#0c4a6e')
        oceanGrad.addColorStop(0.5, '#072b4a')
        oceanGrad.addColorStop(0.85, '#02182b')
        oceanGrad.addColorStop(1, '#010a14')
      }
      ctx.fillStyle = oceanGrad
      ctx.beginPath()
      ctx.arc(cx, cy, radius, 0, Math.PI * 2)
      ctx.fill()

      // 4. DRAW CONTINENTS WITH 3D ORTHOGRAPHIC PROJECTION
      ctx.save()
      ctx.beginPath()
      ctx.arc(cx, cy, radius, 0, Math.PI * 2)
      ctx.clip()

      const curAngle = rotationRef.current.lon
      const curLatTilt = (rotationRef.current.lat * Math.PI) / 180

      continents.forEach(poly => {
        ctx.beginPath()
        let first = true
        poly.forEach(([lat, lon]) => {
          const phi = (lat * Math.PI) / 180
          const lambda = ((lon * Math.PI) / 180) + curAngle

          // Tilt with latitude
          const cosC = Math.sin(curLatTilt) * Math.sin(phi) + Math.cos(curLatTilt) * Math.cos(phi) * Math.cos(lambda)
          if (cosC > -0.15) {
            const x = cx + radius * Math.cos(phi) * Math.sin(lambda)
            const y = cy - radius * (Math.cos(curLatTilt) * Math.sin(phi) - Math.sin(curLatTilt) * Math.cos(phi) * Math.cos(lambda))
            if (first) { ctx.moveTo(x, y); first = false }
            else { ctx.lineTo(x, y) }
          }
        })

        if (viewMode === 'night') {
          ctx.fillStyle = 'rgba(15, 23, 42, 0.75)'
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)'
        } else if (viewMode === 'fires') {
          ctx.fillStyle = 'rgba(180, 83, 9, 0.35)'
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)'
        } else {
          ctx.fillStyle = 'rgba(16, 185, 129, 0.35)'
          ctx.strokeStyle = 'rgba(52, 211, 153, 0.6)'
        }
        ctx.lineWidth = 1.3
        ctx.fill()
        ctx.stroke()
      })

      // 5. SUBMARINE FIBER CABLE ARCS (Matches Image 1 luminous ocean cables)
      if (layers.submarineCables) {
        ctx.lineWidth = 1.2
        submarineCables.forEach(cable => {
          const [lat1, lon1] = cable.from
          const [lat2, lon2] = cable.to

          const phi1 = (lat1 * Math.PI) / 180
          const lambda1 = ((lon1 * Math.PI) / 180) + curAngle
          const cosC1 = Math.sin(curLatTilt) * Math.sin(phi1) + Math.cos(curLatTilt) * Math.cos(phi1) * Math.cos(lambda1)

          const phi2 = (lat2 * Math.PI) / 180
          const lambda2 = ((lon2 * Math.PI) / 180) + curAngle
          const cosC2 = Math.sin(curLatTilt) * Math.sin(phi2) + Math.cos(curLatTilt) * Math.cos(phi2) * Math.cos(lambda2)

          if (cosC1 > -0.1 && cosC2 > -0.1) {
            const x1 = cx + radius * Math.cos(phi1) * Math.sin(lambda1)
            const y1 = cy - radius * (Math.cos(curLatTilt) * Math.sin(phi1) - Math.sin(curLatTilt) * Math.cos(phi1) * Math.cos(lambda1))
            const x2 = cx + radius * Math.cos(phi2) * Math.sin(lambda2)
            const y2 = cy - radius * (Math.cos(curLatTilt) * Math.sin(phi2) - Math.sin(curLatTilt) * Math.cos(phi2) * Math.cos(lambda2))

            ctx.strokeStyle = cable.color
            ctx.beginPath()
            ctx.moveTo(x1, y1)
            ctx.quadraticCurveTo((x1 + x2) / 2, (y1 + y2) / 2 - 15, x2, y2)
            ctx.stroke()
          }
        })
      }

      // 6. NASA FIRMS WILDFIRES (Matches Image 1 red flame clusters)
      if (layers.firmsFires) {
        firmsFires.forEach(fire => {
          const phi = (fire.lat * Math.PI) / 180
          const lambda = ((fire.lon * Math.PI) / 180) + curAngle
          const cosC = Math.sin(curLatTilt) * Math.sin(phi) + Math.cos(curLatTilt) * Math.cos(phi) * Math.cos(lambda)

          if (cosC > 0.05) {
            const fx = cx + radius * Math.cos(phi) * Math.sin(lambda)
            const fy = cy - radius * (Math.cos(curLatTilt) * Math.sin(phi) - Math.sin(curLatTilt) * Math.cos(phi) * Math.cos(lambda))

            // Pulsing flame glow
            const fPulse = 0.5 + 0.5 * Math.sin(timeStep * 8)
            ctx.fillStyle = `rgba(239, 68, 68, ${0.4 + fPulse * 0.4})`
            ctx.beginPath()
            ctx.arc(fx, fy, 7 + fPulse * 4, 0, Math.PI * 2)
            ctx.fill()

            ctx.fillStyle = fire.color
            ctx.beginPath()
            ctx.arc(fx, fy, 3.5, 0, Math.PI * 2)
            ctx.fill()
          }
        })
      }

      // 7. REAL-TIME SEISMIC EARTHQUAKES (Matches Image 3)
      if (layers.earthquakes) {
        earthquakes.forEach(eq => {
          const phi = (eq.lat * Math.PI) / 180
          const lambda = ((eq.lon * Math.PI) / 180) + curAngle
          const cosC = Math.sin(curLatTilt) * Math.sin(phi) + Math.cos(curLatTilt) * Math.cos(phi) * Math.cos(lambda)

          if (cosC > 0.1) {
            const ex = cx + radius * Math.cos(phi) * Math.sin(lambda)
            const ey = cy - radius * (Math.cos(curLatTilt) * Math.sin(phi) - Math.sin(curLatTilt) * Math.cos(phi) * Math.cos(lambda))

            // Expanding seismic shockwave ring
            const wave = (timeStep * 2) % 1
            ctx.strokeStyle = `rgba(239, 68, 68, ${1 - wave})`
            ctx.lineWidth = 1.4
            ctx.beginPath()
            ctx.arc(ex, ey, 5 + wave * 18, 0, Math.PI * 2)
            ctx.stroke()

            ctx.fillStyle = '#ef4444'
            ctx.beginPath()
            ctx.arc(ex, ey, 3, 0, Math.PI * 2)
            ctx.fill()
          }
        })
      }

      // 8. DYNAMIC ATMOSPHERIC WIND PARTICLES (Matches Image 4 earth.nullschool)
      if (layers.windStreamlines || viewMode === 'wind') {
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)'
        ctx.lineWidth = 1.4
        windParticles.forEach(p => {
          p.lon += p.speed
          p.life -= 0.6
          if (p.life <= 0) {
            p.life = 100
            p.lon = Math.random() * 360
            p.lat = (Math.random() - 0.5) * 120
          }

          const phi = (p.lat * Math.PI) / 180
          const lambda = ((p.lon * Math.PI) / 180) + curAngle
          const cosC = Math.sin(curLatTilt) * Math.sin(phi) + Math.cos(curLatTilt) * Math.cos(phi) * Math.cos(lambda)

          if (cosC > 0.1) {
            const px = cx + radius * Math.cos(phi) * Math.sin(lambda)
            const py = cy - radius * (Math.cos(curLatTilt) * Math.sin(phi) - Math.sin(curLatTilt) * Math.cos(phi) * Math.cos(lambda))
            const tailX = px - p.length * Math.cos(phi) * 0.5
            const tailY = py + Math.sin(curLatTilt) * 2

            ctx.beginPath()
            ctx.moveTo(tailX, tailY)
            ctx.lineTo(px, py)
            ctx.stroke()
          }
        })
      }

      // 9. DAY / NIGHT TERMINATOR SHADOW
      const shadowGrad = ctx.createLinearGradient(cx - radius, cy - radius, cx + radius, cy + radius)
      shadowGrad.addColorStop(0, 'rgba(255, 255, 255, 0.08)')
      shadowGrad.addColorStop(0.4, 'rgba(0, 0, 0, 0)')
      shadowGrad.addColorStop(0.85, 'rgba(2, 6, 23, 0.82)')
      shadowGrad.addColorStop(1, 'rgba(1, 4, 15, 0.96)')
      ctx.fillStyle = shadowGrad
      ctx.beginPath()
      ctx.arc(cx, cy, radius, 0, Math.PI * 2)
      ctx.fill()

      // 10. EXTRUDED 3D DATA SPIKES / PILLARS (Matches Image 2 3D radiation pillars)
      if (layers.dataSpikes || viewMode === 'spikes') {
        dataSpikes.forEach(spike => {
          const phi = (spike.lat * Math.PI) / 180
          const lambda = ((spike.lon * Math.PI) / 180) + curAngle
          const cosC = Math.sin(curLatTilt) * Math.sin(phi) + Math.cos(curLatTilt) * Math.cos(phi) * Math.cos(lambda)

          if (cosC > 0.1) {
            // Base on globe surface
            const bx = cx + radius * Math.cos(phi) * Math.sin(lambda)
            const by = cy - radius * (Math.cos(curLatTilt) * Math.sin(phi) - Math.sin(curLatTilt) * Math.cos(phi) * Math.cos(lambda))

            // Tip extruded outward perpendicularly
            const tipR = radius + spike.height
            const tx = cx + tipR * Math.cos(phi) * Math.sin(lambda)
            const ty = cy - tipR * (Math.cos(curLatTilt) * Math.sin(phi) - Math.sin(curLatTilt) * Math.cos(phi) * Math.cos(lambda))

            // 3D Illuminated Pillar
            ctx.strokeStyle = spike.color
            ctx.lineWidth = 2.5
            ctx.beginPath()
            ctx.moveTo(bx, by)
            ctx.lineTo(tx, ty)
            ctx.stroke()

            // Glowing Tip Head
            ctx.fillStyle = '#ffffff'
            ctx.beginPath()
            ctx.arc(tx, ty, 3, 0, Math.PI * 2)
            ctx.fill()

            // Value Tag
            ctx.font = 'bold 9px monospace'
            ctx.fillStyle = spike.color
            ctx.fillText(spike.val, tx + 6, ty - 2)
          }
        })
      }

      ctx.restore()

      // 11. SATELLITE ORBITS (Matches Image 3)
      if (layers.satellites) {
        satellites.forEach((sat, idx) => {
          const isSelected = activeSatellite === sat.id
          const incRad = (sat.incDeg * Math.PI) / 180 - Math.PI / 2
          const orbA = radius * (1.18 + idx * 0.04)
          const orbB = radius * (0.65 + (idx % 3) * 0.08)

          // Elliptical Orbit Line
          ctx.strokeStyle = isSelected ? 'rgba(56, 189, 248, 0.75)' : 'rgba(56, 189, 248, 0.22)'
          ctx.lineWidth = isSelected ? 1.8 : 0.9
          ctx.beginPath()
          ctx.ellipse(cx, cy, orbA, orbB, incRad, 0, Math.PI * 2)
          ctx.stroke()

          // Position
          const t = curAngle * sat.speed + idx * 1.3
          const rawX = Math.cos(t) * orbA
          const rawY = Math.sin(t) * orbB
          const satX = cx + rawX * Math.cos(incRad) - rawY * Math.sin(incRad)
          const satY = cy + rawX * Math.sin(incRad) + rawY * Math.cos(incRad)

          // Radio wave
          ctx.strokeStyle = sat.color
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.arc(satX, satY, 5 + Math.sin(timeStep * 6 + idx) * 3, 0, Math.PI * 2)
          ctx.stroke()

          // Satellite dot
          ctx.fillStyle = isSelected ? '#ffffff' : sat.color
          ctx.beginPath()
          ctx.arc(satX, satY, isSelected ? 4.5 : 3, 0, Math.PI * 2)
          ctx.fill()

          ctx.font = isSelected ? 'bold 11px monospace' : '10px monospace'
          ctx.fillStyle = isSelected ? '#38bdf8' : 'rgba(226, 232, 240, 0.7)'
          ctx.fillText(sat.name.split(' ')[0], satX + 8, satY - 5)
        })
      }

      ctx.restore()
      animId = requestAnimationFrame(render)
    }

    render()

    return () => cancelAnimationFrame(animId)
  }, [autoRotate, layers, viewMode, activeSatellite])

  return (
    <div className="relative w-full min-h-[92vh] bg-[#030712] text-slate-100 flex flex-col justify-between overflow-hidden select-none border border-cyan-500/25 rounded-2xl shadow-2xl font-mono">
      
      {/* ---------------------------------------------------------------------- */}
      {/* 1. TOP MISSION CONTROL BAR (Matches Image 3 EARTH PULSE v1.0 Header)   */}
      {/* ---------------------------------------------------------------------- */}
      <div className="relative z-30 w-full bg-slate-950/85 backdrop-blur-xl border-b border-cyan-500/20 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        
        {/* Left: NASA Meatball & Status Ticker */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-blue-700 border border-red-500 flex items-center justify-center font-black text-white text-[10px] tracking-widest shadow-md">
            NASA
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold tracking-wider text-slate-100">
                EARTH PULSE V2.0
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                7/7 FEEDS ACTIVE
              </span>
            </div>
            <p className="text-[10px] text-slate-400 flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{utcTime}</span>
              <span>•</span>
              <span className="text-cyan-400">SEISMIC: 51 EVENTS</span>
            </p>
          </div>
        </div>

        {/* Center: Search & Fly-To (Matches Image 2 Country Search) */}
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-sm flex items-center space-x-1.5">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search biome, city, volcano (e.g. Amazon, Tokyo, Hawaii)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-700 rounded-lg pl-8 pr-3 py-1 text-[11px] text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>
          <button
            type="submit"
            className="px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold text-[10px] hover:bg-cyan-500/30"
          >
            FOCUS
          </button>
        </form>

        {/* Right: View Mode Selector HUD (Matches Image 1 top right View buttons) */}
        <div className="flex items-center space-x-1 bg-slate-900/90 p-1 rounded-lg border border-slate-800 text-[10px]">
          {[
            { id: 'realistic', label: '3D Globe' },
            { id: 'wind', label: 'Wind Flow' },
            { id: 'spikes', label: '3D Spikes' },
            { id: 'fires', label: 'FIRMS Fires' },
            { id: 'night', label: 'Night Lights' },
          ].map(m => (
            <button
              key={m.id}
              onClick={() => { setViewMode(m.id); playEarcon('volume_blip') }}
              className={`px-2 py-1 rounded transition-colors ${
                viewMode === m.id
                  ? 'bg-cyan-500/25 text-cyan-300 font-bold border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* 2. MAIN ARENA: 3D INTERACTIVE CANVAS GLOBE + FLOATING HUD PANELS       */}
      {/* ---------------------------------------------------------------------- */}
      <div className="relative flex-1 w-full flex items-center justify-center overflow-hidden">
        
        {/* Left Floating Panel: Collapsible Layer Switchboard (Matches Image 1) */}
        <div className="absolute top-4 left-4 z-20 w-52 bg-slate-950/85 backdrop-blur-md p-3 rounded-xl border border-cyan-500/25 shadow-xl text-[11px] space-y-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 text-slate-300 font-bold">
            <span className="flex items-center space-x-1.5 text-cyan-300">
              <Layers className="w-3.5 h-3.5" />
              <span>THEMATIC LAYERS</span>
            </span>
            <span className="text-[9px] px-1.5 rounded bg-cyan-500/20 text-cyan-300">7/7</span>
          </div>

          <div className="space-y-1.5">
            {[
              { key: 'satellites', label: 'NASA Satellites', color: '#38bdf8' },
              { key: 'windStreamlines', label: 'Wind Streamlines', color: '#22d3ee' },
              { key: 'dataSpikes', label: '3D Anomaly Spikes', color: '#ec4899' },
              { key: 'firmsFires', label: 'FIRMS Wildfires', color: '#ef4444' },
              { key: 'submarineCables', label: 'Ocean Data Cables', color: '#818cf8' },
              { key: 'earthquakes', label: 'Seismic Quakes', color: '#f97316' },
            ].map(l => (
              <button
                key={l.key}
                onClick={() => toggleLayer(l.key)}
                className="w-full flex items-center justify-between px-2 py-1 rounded hover:bg-slate-900 transition-colors text-left"
              >
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: l.color }} />
                  <span className={layers[l.key] ? 'text-slate-200' : 'text-slate-500 line-through'}>
                    {l.label}
                  </span>
                </div>
                {layers[l.key] ? <Eye className="w-3 h-3 text-cyan-400" /> : <EyeOff className="w-3 h-3 text-slate-600" />}
              </button>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
            <span>ORBIT: {autoRotate ? '360° ACTIVE' : 'MANUAL'}</span>
            <button
              onClick={() => setAutoRotate(!autoRotate)}
              className="text-cyan-400 hover:underline"
            >
              {autoRotate ? 'PAUSE SPIN' : 'RESUME SPIN'}
            </button>
          </div>
        </div>

        {/* Center: The Interactive Canvas (Drag-to-Rotate enabled!) */}
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="w-full h-full absolute inset-0 cursor-grab active:cursor-grabbing"
          title="Click and drag to freely rotate Earth in 360°"
        />

        {/* Right Floating Panel: Live Solar Activity & Streaming Event Feed (Image 3 Match) */}
        <div className={`absolute top-4 right-4 z-20 w-72 bg-slate-950/85 backdrop-blur-md p-3.5 rounded-xl border border-cyan-500/25 shadow-xl text-[11px] space-y-3 transition-transform ${isSidebarOpen ? 'translate-x-0' : 'translate-x-80'}`}>
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <span className="font-bold text-slate-200 flex items-center space-x-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>SOLAR ACTIVITY LIVE</span>
            </span>
            <span className="text-[9px] px-1.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">LIVE</span>
          </div>

          {/* Solar Flux Meter Bar (Matches Image 3) */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>X-Ray Flux</span>
              <span className="text-amber-400 font-bold">9.0e-7 W/m²</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div className="w-3/4 h-full bg-gradient-to-r from-amber-400 to-red-500 rounded-full" />
            </div>
          </div>

          {/* Quick Stats Grid (Matches Image 3) */}
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
              <span className="text-slate-500 block">EARTHQUAKES</span>
              <span className="text-red-400 font-bold text-sm">51</span>
              <span className="text-[9px] text-slate-400 block">past 24h</span>
            </div>
            <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
              <span className="text-slate-500 block">ISS ALTITUDE</span>
              <span className="text-cyan-400 font-bold text-sm">426 km</span>
              <span className="text-[9px] text-slate-400 block">30.8°, -11.6°</span>
            </div>
          </div>

          {/* Streaming Event Feed (Matches Image 3 bottom-right event log) */}
          <div className="space-y-1.5 pt-1 border-t border-slate-800">
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold">
              <span>EVENT FEED</span>
              <span className="text-cyan-400">STREAMING</span>
            </div>

            <div className="space-y-1 max-h-36 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
              {eventFeed.map(evt => (
                <div
                  key={evt.id}
                  onClick={() => {
                    if (evt.type === 'seismic') flyTo(38.2, 142.4)
                    else if (evt.type === 'fire') flyTo(-2.1, 23.4)
                    else if (evt.type === 'cryo') flyTo(74.0, -140.0)
                  }}
                  className="p-1.5 rounded bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 cursor-pointer text-[10px] space-y-0.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-300">{evt.time}</span>
                    <span className="text-[9px] px-1 rounded uppercase" style={{ color: evt.color, backgroundColor: `${evt.color}20` }}>
                      {evt.type}
                    </span>
                  </div>
                  <p className="text-slate-400 leading-tight truncate">{evt.text}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Selected Entity Inspector HUD (Appears when clicking/flying) */}
        {selectedEntity && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 p-3 rounded-xl bg-slate-950/90 backdrop-blur-md border border-cyan-400 text-xs shadow-2xl flex items-center space-x-4">
            <div className="w-3 h-3 rounded-full animate-ping" style={{ backgroundColor: selectedEntity.color }} />
            <div>
              <div className="font-bold text-slate-100">{selectedEntity.title}</div>
              <div className="text-[10px] text-cyan-400">{selectedEntity.type} • {selectedEntity.val}</div>
            </div>
            <button
              onClick={() => setSelectedEntity(null)}
              className="text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800 text-[10px]"
            >
              CLOSE
            </button>
          </div>
        )}

      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* 3. BOTTOM NASA VITAL SIGNS RIBBON (Exact Match to Image 3)             */}
      {/* ---------------------------------------------------------------------- */}
      <div className="relative z-30 w-full bg-slate-950/95 backdrop-blur-2xl border-t border-cyan-500/20 px-3 py-2 flex flex-col space-y-2">
        <div className="flex items-center justify-between px-2 text-[10px] text-slate-400">
          <span className="uppercase tracking-widest text-cyan-400 font-bold flex items-center space-x-1.5">
            <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
            <span>NASA VITAL SIGNS OF THE PLANET</span>
          </span>
          <span className="hidden sm:inline">CLICK VITAL SIGN TO AUDIFY PLANETARY TELEMETRY</span>
        </div>

        {/* 10 Vital Signs Scrollable Strip */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-cyan-500/30">
          {vitalSigns.map(vs => {
            const isSelected = activeVitalSign === vs.id
            const Icon = vs.icon
            return (
              <button
                key={vs.id}
                onClick={() => {
                  setActiveVitalSign(vs.id)
                  playEarcon('volume_blip')
                  if (globalSonificationEngine) {
                    globalSonificationEngine.updateSettings({ style: vs.style, volume: 80 })
                    if (!isPlayingAudio) {
                      globalSonificationEngine.play()
                      setIsPlayingAudio(true)
                    }
                  }
                }}
                className={`px-3 py-2 rounded-xl border text-xs shrink-0 flex items-center space-x-2.5 transition-all text-left ${
                  isSelected
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-md shadow-cyan-500/25 scale-102'
                    : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/60'
                }`}
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${vs.color}20`, color: vs.color }}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] font-bold leading-tight truncate">{vs.name}</div>
                  <div className="text-[10px] text-slate-400">{vs.value.split(' ')[0]}</div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

    </div>
  )
}
