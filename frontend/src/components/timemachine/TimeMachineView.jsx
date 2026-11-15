import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  History, 
  Play, 
  Pause, 
  RotateCcw, 
  Download, 
  Activity, 
  ShieldCheck, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Sliders, 
  Volume2, 
  Waves, 
  Compass, 
  Film, 
  Check, 
  Layers, 
  Radio, 
  AlertCircle,
  Share2 
} from 'lucide-react'

import GlassPanel from '../common/GlassPanel'
import Button from '../common/Button'
import Badge from '../common/Badge'
import WaveformDisplay from '../common/WaveformDisplay'
import DynamicSequenceWorkstation from '../studio/DynamicSequenceWorkstation'
import ExportShareModal from '../common/ExportShareModal'
import { SONIFICATION_PRESETS } from '../../services/earthDataSonificationEngine'
import { fetchEarthTimeline } from '../../services/api'
import globalSonificationEngine from '../../services/sonificationEngine'
import { useAccessibility } from '../../context/AccessibilityContext'

const PHENOMENA = [
  {
    id: 'arctic_sea_ice',
    title: 'Arctic Sea Ice Minimum Extent',
    mission: 'NASA / NSIDC Satellite Microwave Radiometers & ICESat-2',
    unit: 'Million km²',
    startYear: 1979,
    endYear: 2024,
    defaultYear: 2024,
    description: 'Annual minimum sea ice area in the Arctic Ocean observed every September since the launch of the Nimbus-7 Scanning Multichannel Microwave Radiometer.',
    trendDirection: 'decreasing',
    baselineText: '1979-2000 Average: ~7.05 Million km²',
  },
  {
    id: 'global_temperature',
    title: 'Global Surface Temperature Anomaly',
    mission: 'NASA Goddard Institute for Space Studies (GISTEMP v4)',
    unit: '°C Anomaly',
    startYear: 1880,
    endYear: 2024,
    defaultYear: 2024,
    description: 'Global land and ocean temperature anomalies compared against the 1951-1980 climatological baseline from the NASA GISTEMP meteorological network.',
    trendDirection: 'increasing',
    baselineText: 'Baseline 1951-1980: 0.00 °C Normal',
  },
  {
    id: 'carbon_dioxide',
    title: 'Atmospheric CO2 Concentration',
    mission: 'NOAA Global Monitoring Laboratory & NASA OCO-2/3',
    unit: 'ppm (Parts Per Million)',
    startYear: 1958,
    endYear: 2024,
    defaultYear: 2024,
    description: 'Direct continuous atmospheric carbon dioxide measurements from Mauna Loa Observatory supplemented by NASA Orbiting Carbon Observatory spectrometers.',
    trendDirection: 'increasing',
    baselineText: 'Pre-Industrial Baseline: ~280 ppm',
  },
  {
    id: 'sea_level',
    title: 'Global Mean Sea Level Rise',
    mission: 'NASA / CNES TOPEX/Poseidon, Jason-1/2/3 & Sentinel-6',
    unit: 'mm Variation',
    startYear: 1993,
    endYear: 2024,
    defaultYear: 2024,
    description: 'Multi-satellite precision radar altimetry tracking global mean sea level changes caused by thermal expansion and continental glacial melt.',
    trendDirection: 'increasing',
    baselineText: '1993 Baseline: 0.0 mm Reference',
  },
]

/**
 * Planetary Time Machine Console
 * Connects to FastAPI /api/earth/timeline & Dynamic Sequence Workstation
 */
export default function TimeMachineView({ onSelectTrack }) {
  const [activeMode, setActiveMode] = useState('timeseries') // 'timeseries' | 'sequence'
  const [selectedPhenomenonId, setSelectedPhenomenonId] = useState('arctic_sea_ice')
  const [timelineData, setTimelineData] = useState(null)
  const [selectedYear, setSelectedYear] = useState(2024)
  const [isLoading, setIsLoading] = useState(false)
  const [isSonifying, setIsSonifying] = useState(false)
  const isSonifyingRef = useRef(false)
  const [isExportingCsv, setIsExportingCsv] = useState(false)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [activePresetId, setActivePresetId] = useState('scientific_analytic')
  const [errorMessage, setErrorMessage] = useState(null)

  const canvasRef = useRef(null)
  const animationTimerRef = useRef(null)
  const { playEarcon, announce } = useAccessibility()

  const currentPhenomenon = PHENOMENA.find(p => p.id === selectedPhenomenonId) || PHENOMENA[0]

  // ==========================================================================
  // 1. FETCH SCIENTIFIC TIMELINE FROM FASTAPI BACKEND
  // ==========================================================================
  useEffect(() => {
    let isSubscribed = true
    setIsLoading(true)
    setErrorMessage(null)

    async function loadTimeline() {
      try {
        const result = await fetchEarthTimeline(
          currentPhenomenon.id,
          currentPhenomenon.startYear,
          currentPhenomenon.endYear
        )

        if (isSubscribed) {
          const points = result?.timeline || (result?.frames ? result.frames.map(f => ({
            year: f.year,
            value: f.metric_value !== undefined ? f.metric_value : f.value,
            metric_unit: f.metric_unit,
            normalized_pitch: f.normalized_acoustic_pitch !== undefined ? f.normalized_acoustic_pitch : 0.5,
            audio_event: f.audio_event
          })) : null)

          if (points && points.length > 0) {
            setTimelineData({
              ...result,
              timeline: points
            })
            setSelectedYear(points[points.length - 1].year)
            announce(`Loaded timeline for ${currentPhenomenon.title}`)
          } else {
            setErrorMessage('Unable to downlink scientific time series.')
          }
        }
      } catch (err) {
        if (isSubscribed) {
          setErrorMessage('Failed to connect to backend timeline service.')
        }
      } finally {
        if (isSubscribed) setIsLoading(false)
      }
    }

    loadTimeline()
    return () => {
      isSubscribed = false
      if (animationTimerRef.current) clearInterval(animationTimerRef.current)
    }
  }, [selectedPhenomenonId, currentPhenomenon])

  // ==========================================================================
  // 2. DRAW TIME SERIES CANVAS CHART
  // ==========================================================================
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !timelineData?.timeline || timelineData.timeline.length === 0) return

    const ctx = canvas.getContext('2d')
    const width = canvas.clientWidth
    const height = 220
    const scale = window.devicePixelRatio || 1

    canvas.width = Math.round(width * scale)
    canvas.height = Math.round(height * scale)
    ctx.setTransform(scale, 0, 0, scale, 0, 0)
    ctx.clearRect(0, 0, width, height)

    const points = timelineData.timeline
    const padding = { left: 55, right: 20, top: 25, bottom: 32 }

    const minYear = points[0].year
    const maxYear = points[points.length - 1].year
    const values = points.map(p => p.value)
    const minValue = Math.min(...values)
    const maxValue = Math.max(...values)
    const valSpan = Math.max(0.001, maxValue - minValue)

    const getX = (yr) => padding.left + ((yr - minYear) / (maxYear - minYear)) * (width - padding.left - padding.right)
    const getY = (val) => padding.top + ((maxValue - val) / valSpan) * (height - padding.top - padding.bottom)

    // Gridlines & Value Axis
    ctx.font = '10px monospace'
    ctx.lineWidth = 1

    for (let i = 0; i <= 4; i++) {
      const v = minValue + (valSpan * i) / 4
      const py = getY(v)

      ctx.strokeStyle = '#1e293b'
      ctx.beginPath()
      ctx.moveTo(padding.left, py)
      ctx.lineTo(width - padding.right, py)
      ctx.stroke()

      ctx.fillStyle = '#64748b'
      ctx.textAlign = 'right'
      ctx.fillText(v >= 100 ? v.toFixed(0) : v.toFixed(2), padding.left - 6, py + 3)
    }

    // Time Axis Labels
    ctx.fillStyle = '#94a3b8'
    ctx.textAlign = 'center'
    const step = Math.ceil((maxYear - minYear) / 5)
    for (let yr = minYear; yr <= maxYear; yr += step) {
      ctx.fillText(yr.toString(), getX(yr), height - 10)
    }

    // Trajectory Area Fill (Gradient)
    const grad = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom)
    if (currentPhenomenon.trendDirection === 'increasing') {
      grad.addColorStop(0, 'rgba(239, 68, 68, 0.25)')
      grad.addColorStop(1, 'rgba(56, 189, 248, 0.02)')
    } else {
      grad.addColorStop(0, 'rgba(6, 182, 212, 0.25)')
      grad.addColorStop(1, 'rgba(2, 6, 23, 0.02)')
    }

    ctx.fillStyle = grad
    ctx.beginPath()
    points.forEach((p, idx) => {
      const px = getX(p.year)
      const py = getY(p.value)
      if (idx === 0) {
        ctx.moveTo(px, height - padding.bottom)
        ctx.lineTo(px, py)
      } else {
        ctx.lineTo(px, py)
      }
    })
    ctx.lineTo(getX(points[points.length - 1].year), height - padding.bottom)
    ctx.closePath()
    ctx.fill()

    // Trajectory Line
    ctx.strokeStyle = currentPhenomenon.trendDirection === 'increasing' ? '#f43f5e' : '#06b6d4'
    ctx.lineWidth = 2.5
    ctx.beginPath()
    points.forEach((p, idx) => {
      const px = getX(p.year)
      const py = getY(p.value)
      if (idx === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    })
    ctx.stroke()

    // Highlight Selected Year Point
    const activePoint = points.find(p => p.year === selectedYear)
    if (activePoint) {
      const hX = getX(activePoint.year)
      const hY = getY(activePoint.value)

      // Glowing Halo
      ctx.fillStyle = 'rgba(56, 189, 248, 0.35)'
      ctx.beginPath()
      ctx.arc(hX, hY, 11, 0, Math.PI * 2)
      ctx.fill()

      // Core point
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.arc(hX, hY, 5, 0, Math.PI * 2)
      ctx.fill()
    }
  }, [timelineData, selectedYear, currentPhenomenon])

  // ==========================================================================
  // 3. AUDIFY MULTI-DECADAL SCIENTIFIC TRAJECTORY
  // ==========================================================================
  const handleAudifyTimeline = async () => {
    if (isSonifying) {
      isSonifyingRef.current = false
      setIsSonifying(false)
      globalSonificationEngine.pause()
      return
    }

    if (!timelineData?.timeline || timelineData.timeline.length === 0) return

    isSonifyingRef.current = true
    setIsSonifying(true)
    if (onSelectTrack) {
      onSelectTrack({
        id: `timeline-${currentPhenomenon.id}`,
        title: currentPhenomenon.title,
        region: currentPhenomenon.mission,
        coordinates: "Global Planetary Coverage",
        satellite: currentPhenomenon.mission.split('&')[0].trim(),
        sensor: currentPhenomenon.unit,
        category: "timeline",
        frequencyRange: "80 Hz - 3.2 kHz",
        duration: "00:10",
        currentTime: "00:00",
      })
    }
    playEarcon('play')
    announce(`Sonifying ${currentPhenomenon.title} across ${timelineData.timeline.length} years`)

    const points = timelineData.timeline

    for (let i = 0; i < points.length; i++) {
      if (!isSonifyingRef.current) break

      const pt = points[i]
      setSelectedYear(pt.year)

      const norm = pt.normalized_pitch ?? 0.5
      const telemetry = {
        normalized_brightness: norm,
        standard_luminance_bt601: norm * 255,
        hue_mean_deg: currentPhenomenon.trendDirection === 'increasing' ? 30 + norm * 30 : 200 - norm * 60,
        edge_density: 0.1 + norm * 0.3,
        centroid_x_norm: (i / points.length),
        contrast_rms: 0.6,
        warmth_index: norm,
        quadrants: { q1_nw: 0.25, q2_ne: 0.25, q3_sw: 0.25, q4_se: 0.25 },
        delta_from_previous: 0.05,
        dominant_colors: [
          { hex: currentPhenomenon.trendDirection === 'increasing' ? '#f43f5e' : '#06b6d4', percentage: 70, name: 'Temporal Trajectory' },
          { hex: '#0f172a', percentage: 30, name: 'Deep Space' },
        ],
      }

      globalSonificationEngine.updateSettings({
        style: currentPhenomenon.trendDirection === 'increasing' ? 'atmospheric' : 'ambient_earth',
        tempo: 104,
      })
      globalSonificationEngine.updateDynamicFrame(telemetry, 0.1)

      if (!globalSonificationEngine.isPlaying) {
        await globalSonificationEngine.play()
      }

      await new Promise(resolve => setTimeout(resolve, 180))
    }

    isSonifyingRef.current = false
    setIsSonifying(false)
  }

  // ==========================================================================
  // 4. EXPORT TIME SERIES CSV
  // ==========================================================================
  const handleExportCSV = () => {
    setIsExportingCsv(true)
    try {
      if (!timelineData?.timeline) return

      let csv = 'timestamp,phenomenon_id,phenomenon_name,satellite_mission,year,scientific_value,unit,normalized_pitch\n'
      const now = new Date().toISOString()

      timelineData.timeline.forEach(pt => {
        csv += `"${now}","${currentPhenomenon.id}","${currentPhenomenon.title}","${currentPhenomenon.mission}",${pt.year},${pt.value},"${currentPhenomenon.unit}",${pt.normalized_pitch || ''}\n`
      })

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `NASA_Timeline_${currentPhenomenon.id}_${currentPhenomenon.startYear}_${currentPhenomenon.endYear}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } finally {
      setTimeout(() => setIsExportingCsv(false), 800)
    }
  }

  const activeRecord = timelineData?.timeline?.find(p => p.year === selectedYear)

  return (
    <div className="space-y-6">
      
      {/* Workspace Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-cyan-500/15">
        <div>
          <div className="flex items-center space-x-2 text-cyan-400 font-mono text-xs uppercase tracking-wider mb-1">
            <History className="w-4 h-4" />
            <span>DECIMAL-ACCURATE TEMPORAL CHRONOLOGY</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2.5">
            Planetary Time Machine
            <Badge variant="cyan" size="sm">MULTI-DECADAL</Badge>
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            NASA SVS, GISTEMP, NSIDC & RADAR ALTIMETRY CHRONOLOGIES
          </p>
        </div>

        {/* View Mode: Scientific Timeline vs Sequential Animation Workstation */}
        <div className="flex items-center gap-1.5 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800 font-mono">
          <button
            onClick={() => setActiveMode('timeseries')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeMode === 'timeseries'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>SCIENTIFIC TIMELINE</span>
          </button>

          <button
            onClick={() => setActiveMode('sequence')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeMode === 'sequence'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>SEQUENTIAL ANIMATOR</span>
          </button>
        </div>
      </div>

      {activeMode === 'sequence' ? (
        <DynamicSequenceWorkstation />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column (4 cols): Phenomenon Selector & Metadata */}
          <div className="lg:col-span-4 space-y-4">
            
            <GlassPanel
              title="Earth Vital Signs"
              subtitle="CALIBRATED CHRONOLOGIES"
              icon={Activity}
            >
              <div className="space-y-2">
                {PHENOMENA.map((ph) => {
                  const isSelected = selectedPhenomenonId === ph.id
                  return (
                    <button
                      key={ph.id}
                      onClick={() => setSelectedPhenomenonId(ph.id)}
                      className={`w-full p-3 rounded-xl text-left transition-all border font-mono ${
                        isSelected
                          ? 'bg-cyan-500/20 border-cyan-400/60 shadow-md shadow-cyan-500/10 ring-1 ring-cyan-400/30'
                          : 'bg-slate-950/60 hover:bg-slate-800/60 border-slate-800/80 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold ${isSelected ? 'text-cyan-300' : 'text-slate-200'}`}>
                          {ph.title}
                        </span>
                        {ph.trendDirection === 'increasing' ? (
                          <TrendingUp className="w-3.5 h-3.5 text-red-400" />
                        ) : (
                          <TrendingDown className="w-3.5 h-3.5 text-cyan-400" />
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">
                        {ph.startYear} – {ph.endYear} • {ph.unit}
                      </div>
                    </button>
                  )
                })}
              </div>
            </GlassPanel>

            {/* Mission Manifest Card */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2.5 font-mono text-xs">
              <span className="text-slate-400 text-[10px] uppercase font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>MISSION SATELLITE SENSORS:</span>
              </span>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                {currentPhenomenon.mission}
              </p>
              <div className="pt-2 border-t border-slate-800 text-[10px] text-cyan-400">
                {currentPhenomenon.baselineText}
              </div>
            </div>

          </div>

          {/* Right Column (8 cols): Trajectory Canvas, Scrubber, Sonification */}
          <div className="lg:col-span-8 space-y-4">
            
            <GlassPanel
              title={currentPhenomenon.title}
              subtitle={`${currentPhenomenon.startYear} TO ${currentPhenomenon.endYear} OBSERVATION SPAN`}
              icon={TrendingUp}
            >
              <div className="space-y-4">
                
                {/* Description */}
                <p className="text-xs text-slate-300 leading-relaxed font-light">
                  {currentPhenomenon.description}
                </p>

                {/* Error Banner */}
                {errorMessage && (
                  <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 text-xs font-mono text-amber-300 flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Active Year Readout Bar */}
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-cyan-500/30 flex items-center justify-between font-mono">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                      SELECTED YEAR ({selectedYear})
                    </span>
                    <span className="text-xl font-bold text-white flex items-center gap-2">
                      <span>{activeRecord ? activeRecord.value : '--'}</span>
                      <span className="text-xs font-normal text-cyan-300">{currentPhenomenon.unit}</span>
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                      TRAJECTORY TREND
                    </span>
                    <span className={`text-xs font-bold ${
                      currentPhenomenon.trendDirection === 'increasing' ? 'text-red-400' : 'text-cyan-400'
                    }`}>
                      {currentPhenomenon.trendDirection === 'increasing' ? '▲ ASCENDING WARMTH' : '▼ DECLINING ALBEDO'}
                    </span>
                  </div>
                </div>

                {/* Multi-Decadal Canvas Line Graph */}
                <div className="p-3.5 rounded-xl bg-slate-950/90 border border-cyan-500/25 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-cyan-300 font-bold flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                      <span>NASA OBSERVATION TRAJECTORY</span>
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Points: {timelineData?.timeline?.length || 0} Years
                    </span>
                  </div>

                  <canvas
                    ref={canvasRef}
                    className="w-full h-[220px] block rounded-lg bg-slate-900/60"
                  />
                </div>

                {/* Year Scrubber Slider */}
                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 font-mono">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1.5 text-cyan-400 font-bold">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>TIMELINE EPOCH SCRUBBER:</span>
                    </span>
                    <span className="text-white font-bold text-sm">{selectedYear}</span>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className="text-[10px] text-slate-500">{currentPhenomenon.startYear}</span>
                    <input
                      type="range"
                      min={currentPhenomenon.startYear}
                      max={currentPhenomenon.endYear}
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                      className="flex-1 accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                    />
                    <span className="text-[10px] text-slate-500">{currentPhenomenon.endYear}</span>
                  </div>
                </div>

                {/* Sonification & CSV Actions Deck */}
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-cyan-950/40 to-slate-950 border border-cyan-500/30 flex items-center justify-between shadow-lg font-mono">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-cyan-400 uppercase tracking-wider block font-bold">
                      TIMELINE SONIFICATION
                    </span>
                    <span className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                      <span>Root: {currentPhenomenon.trendDirection === 'increasing' ? 'C4 → G5' : 'G4 → D3'}</span>
                      <span className="text-slate-500">•</span>
                      <span>Decadal Sweeper</span>
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleExportCSV}
                      disabled={isExportingCsv || !timelineData?.timeline}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900/80 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 hover:border-cyan-400 transition-colors shadow-sm disabled:opacity-50"
                      title="Export scientific time series to CSV"
                    >
                      {isExportingCsv ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Download className="w-3.5 h-3.5 text-cyan-400" />}
                      <span>{isExportingCsv ? 'EXPORTED' : 'CSV'}</span>
                    </button>

                    <Button
                      variant="outline"
                      size="sm"
                      icon={Share2}
                      onClick={() => setIsExportModalOpen(true)}
                      className="text-xs font-bold font-mono"
                    >
                      Export & Share
                    </Button>

                    <Button
                      variant={isSonifying ? 'secondary' : 'primary'}
                      size="sm"
                      icon={isSonifying ? Pause : Play}
                      onClick={handleAudifyTimeline}
                      disabled={!timelineData?.timeline}
                      className="px-4 font-bold"
                    >
                      {isSonifying ? 'Pause' : 'Audify Timeline'}
                    </Button>
                  </div>
                </div>

                {/* Live Oscilloscope */}
                <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950/80 p-2">
                  <WaveformDisplay
                    isLive={isSonifying}
                    audioNode={globalSonificationEngine.analyser}
                    height={40}
                    color="#06b6d4"
                    mode="oscilloscope"
                  />
                </div>

              </div>
            </GlassPanel>

          </div>

        </div>
      )}

      {/* Export & Share Modal (Features 6 & 7) */}
      <ExportShareModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        explorationState={{
          mode: 'timemachine',
          dataset: {
            id: currentPhenomenon.id,
            name: currentPhenomenon.title,
            unit: currentPhenomenon.unit,
            mission: currentPhenomenon.mission,
            description: currentPhenomenon.description
          },
          location: {
            id: 'global',
            name: 'Global Earth Climate Telemetry',
            coordinatesText: 'Global Terrestrial & Oceanic WGS-84'
          },
          presetName: 'Scientific Analytic',
          timeSeries: (timelineData?.timeline || []).map(p => ({
            date: p.year?.toString() || '2024',
            value: p.value,
            frequencyHz: 160 + (p.normalized_pitch ? p.normalized_pitch * 500 : 200)
          }))
        }}
      />

    </div>
  )
}
