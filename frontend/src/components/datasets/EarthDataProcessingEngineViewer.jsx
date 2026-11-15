import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Cpu,
  Play,
  Pause,
  RotateCcw,
  Upload,
  FileCode,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Volume2,
  Activity,
  Layers,
  Thermometer,
  CloudRain,
  Wind,
  Trees,
  Waves,
  Calendar,
  MapPin,
  Sparkles,
  BarChart2,
  Sliders,
  ChevronRight,
  Database,
  Info
} from 'lucide-react'

import GlassPanel from '../common/GlassPanel'
import Button from '../common/Button'
import Badge from '../common/Badge'
import {
  fetchEarthDataProcessingDemo,
  processEarthTimeseries,
  uploadAndProcessScientificFile
} from '../../services/api'
import globalSonificationEngine from '../../services/sonificationEngine'
import { useAccessibility } from '../../context/AccessibilityContext'

const ENGINE_DOMAINS = [
  { id: 'temperature', label: 'Temperature', icon: Thermometer, unit: '°C', color: 'amber' },
  { id: 'precipitation', label: 'Precipitation', icon: CloudRain, unit: 'mm', color: 'cyan' },
  { id: 'wind_speed', label: 'Wind Speed', icon: Wind, unit: 'm/s', color: 'teal' },
  { id: 'vegetation', label: 'Vegetation (NDVI)', icon: Trees, unit: 'NDVI', color: 'emerald' },
  { id: 'ocean_sst', label: 'Ocean SST', icon: Waves, unit: '°C', color: 'blue' }
]

export default function EarthDataProcessingEngineViewer() {
  const [selectedDomain, setSelectedDomain] = useState('precipitation')
  const [engineData, setEngineData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Sequencer Playback State
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0)
  const [playbackSpeed, setPlaybackSpeed] = useState(600) // ms per step
  const playbackTimerRef = useRef(null)

  // Upload State
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState(null)
  const fileInputRef = useRef(null)

  const { playEarcon, announce } = useAccessibility()

  // 1. Fetch domain processing data
  useEffect(() => {
    async function loadDomainData() {
      setIsLoading(true)
      setError(null)
      setIsPlaying(false)
      setCurrentFrameIndex(0)
      if (playbackTimerRef.current) clearInterval(playbackTimerRef.current)

      try {
        const res = await fetchEarthDataProcessingDemo(selectedDomain)
        if (res && res.data) {
          setEngineData(res.data)
        } else if (res && res.domains && res.domains[selectedDomain]) {
          setEngineData(res.domains[selectedDomain])
        } else {
          setError('Failed to downlink domain processing package')
        }
      } catch (err) {
        setError(`Processing engine error: ${err.message}`)
      } finally {
        setIsLoading(false)
      }
    }

    loadDomainData()
  }, [selectedDomain])

  // 2. Playback sequencer step effect
  useEffect(() => {
    const seqLength = engineData?.sonification_sequence?.length
    if (!isPlaying || !seqLength) {
      if (playbackTimerRef.current) {
        clearInterval(playbackTimerRef.current)
        playbackTimerRef.current = null
      }
      return
    }

    playbackTimerRef.current = setInterval(() => {
      setCurrentFrameIndex((prev) => (prev + 1) % seqLength)
    }, playbackSpeed)

    return () => {
      if (playbackTimerRef.current) {
        clearInterval(playbackTimerRef.current)
        playbackTimerRef.current = null
      }
    }
  }, [isPlaying, playbackSpeed, engineData?.sonification_sequence?.length])

  // 3. Audio synthesis on frame transition
  useEffect(() => {
    if (!engineData?.sonification_sequence?.length) return
    const frame = engineData.sonification_sequence[currentFrameIndex]
    if (!frame) return

    if (isPlaying) {
      const telem = frame.sonification_telemetry
      if (telem && telem.audio_event === 'NOTE_ON' && telem.acoustic_pitch_hz) {
        // Trigger synthesized oscillator note via Web Audio API
        synthesizeTone(telem.acoustic_pitch_hz, telem.filter_cutoff_hz, telem.harmonic_warmth)
      }
    }
  }, [currentFrameIndex, isPlaying])

  // Synthesize audio tone using Web Audio
  const synthesizeTone = (freqHz, cutoffHz = 1500, warmth = 0.5) => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      if (!AudioContext) return
      const ctx = globalSonificationEngine.audioContext || new AudioContext()
      if (ctx.state === 'suspended') ctx.resume()

      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      const filter = ctx.createBiquadFilter()

      osc.type = warmth > 0.5 ? 'triangle' : 'sine'
      osc.frequency.setValueAtTime(freqHz, ctx.currentTime)

      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(cutoffHz || 1500, ctx.currentTime)

      gain.gain.setValueAtTime(0.001, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.03)
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35)

      osc.connect(filter)
      filter.connect(gain)
      gain.connect(ctx.destination)

      osc.start()
      osc.stop(ctx.currentTime + 0.36)
    } catch (e) {
      // Audio context fallback
    }
  }

  const handleTogglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false)
      playEarcon('pause')
      announce('Sequencer paused')
    } else {
      setIsPlaying(true)
      playEarcon('play')
      announce(`Playing sonification sequence for ${selectedDomain}`)
    }
  }

  const handleReset = () => {
    setIsPlaying(false)
    setCurrentFrameIndex(0)
    playEarcon('navigation')
  }

  // 4. File Upload Handler (GeoTIFF, NetCDF, CSV)
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setUploadStatus(`Ingesting ${file.name}...`)
    announce(`Uploading ${file.name} to scientific processing engine`)

    try {
      const res = await uploadAndProcessScientificFile(file, selectedDomain)
      if (res && res.result) {
        setEngineData(res.result)
        setUploadStatus(`Processed ${res.file_format} (${file.name}) successfully!`)
        announce(`Successfully processed ${file.name}`)
      } else if (res && res.sonification_sequence) {
        setEngineData(res)
        setUploadStatus(`Processed CSV (${file.name}) successfully!`)
      } else {
        setUploadStatus(`Processing error: ${res?.detail || 'Unknown error'}`)
      }
    } catch (err) {
      setUploadStatus(`Upload failed: ${err.message}`)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const activeFrame = engineData?.sonification_sequence?.[currentFrameIndex]
  const stats = engineData?.statistical_summary

  return (
    <div className="space-y-6">

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/90 border border-emerald-500/25 backdrop-blur-md shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 shadow-md shadow-emerald-500/10">
            <Cpu className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-extrabold text-slate-100 tracking-tight">
                Earth Data Processing & Sonification Engine
              </h2>
              <Badge variant="emerald" size="sm">PYTHON SCIENTIFIC STACK</Badge>
              <Badge variant="cyan" size="sm">ZERO MISSING SILENT CONVERSION</Badge>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              NumPy • Pandas • Xarray • Rasterio • Domain Physical Bounds • Meaning-Preserving Normalization
            </p>
          </div>
        </div>

        {/* Upload Action */}
        <div className="flex items-center space-x-2 shrink-0">
          <input
            ref={fileInputRef}
            type="file"
            accept=".tif,.tiff,.nc,.nc4,.csv"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold text-slate-300 hover:text-white bg-slate-800 border border-slate-700 hover:border-emerald-400/40 transition-all cursor-pointer"
            title="Upload GeoTIFF, NetCDF, or CSV"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isUploading ? 'INGESTING...' : 'INGEST FILE (.TIF/.NC/.CSV)'}</span>
          </button>
        </div>
      </div>

      {uploadStatus && (
        <div className="p-2.5 rounded-xl bg-slate-950 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center justify-between">
          <span className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{uploadStatus}</span>
          </span>
          <button
            onClick={() => setUploadStatus(null)}
            className="text-[10px] text-slate-400 hover:text-slate-200"
          >
            DISMISS
          </button>
        </div>
      )}

      {/* Domain Selection Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none font-mono">
        {ENGINE_DOMAINS.map((dom) => {
          const Icon = dom.icon
          const isSelected = selectedDomain === dom.id
          return (
            <button
              key={dom.id}
              onClick={() => setSelectedDomain(dom.id)}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all border ${
                isSelected
                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-md shadow-emerald-500/10'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{dom.label}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                {dom.unit}
              </span>
            </button>
          )
        })}
      </div>

      {/* Critical Scientific Invariants Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start space-x-2.5">
          <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-slate-200">Zero Silent Null Conversion</div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Missing values & fill flags (-999, NaNs) are never converted to 0. Real 0.0 measurements (dry days) are preserved.
            </div>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start space-x-2.5">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-slate-200">Meaning-Preserving Normalization</div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Precipitation uses calibrated logarithmic S-curves. Temperature uses thermal boundary preservation.
            </div>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start space-x-2.5">
          <Layers className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-slate-200">Original Units Preserved</div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Every frame and summary retains original physical units alongside transformed acoustic telemetry.
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Telemetry Sequencer (8 cols) + Statistical Summary & Provenance (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* Left Column (8 cols): Step Sequencer & Visual Telemetry */}
        <div className="lg:col-span-8 space-y-4">

          <GlassPanel
            title="Acoustic Sonification Sequencer"
            subtitle={`${selectedDomain.toUpperCase()} TIME-SERIES & SPATIAL DECOMPOSITION`}
            icon={Volume2}
          >
            <div className="space-y-4 font-mono">
              
              {/* Playback Controls */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleTogglePlay}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      isPlaying
                        ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                        : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-md shadow-emerald-500/20'
                    }`}
                  >
                    {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    <span>{isPlaying ? 'PAUSE' : 'PLAY SEQUENCE'}</span>
                  </button>

                  <button
                    onClick={handleReset}
                    className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                    title="Reset to Frame 1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center space-x-3 text-xs text-slate-400">
                  <span>SPEED:</span>
                  {[
                    { label: '0.5x', ms: 900 },
                    { label: '1.0x', ms: 600 },
                    { label: '2.0x', ms: 300 }
                  ].map((spd) => (
                    <button
                      key={spd.label}
                      onClick={() => setPlaybackSpeed(spd.ms)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        playbackSpeed === spd.ms
                          ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {spd.label}
                    </button>
                  ))}
                </div>

                <div className="text-xs text-slate-300 font-bold">
                  FRAME {currentFrameIndex + 1} / {engineData?.sonification_sequence?.length || 0}
                </div>
              </div>

              {/* Interactive Frame Strip */}
              {engineData?.sonification_sequence && (
                <div className="space-y-1.5">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Sequence Frames</span>
                    <span className="text-emerald-400">Click any frame to jump</span>
                  </div>

                  <div className="flex items-center gap-1.5 overflow-x-auto p-1.5 rounded-xl bg-slate-950 border border-slate-800 scrollbar-none">
                    {engineData.sonification_sequence.map((item, idx) => {
                      const isCurrent = idx === currentFrameIndex
                      const isMissing = item.quality_information.is_missing
                      const norm = item.normalized_value ?? 0.0

                      return (
                        <button
                          key={idx}
                          onClick={() => {
                            setCurrentFrameIndex(idx)
                            playEarcon('navigation')
                          }}
                          className={`relative flex flex-col items-center justify-between p-1.5 rounded-lg shrink-0 w-14 h-16 border transition-all ${
                            isCurrent
                              ? 'bg-emerald-500/20 border-emerald-400 shadow-md shadow-emerald-500/20'
                              : isMissing
                              ? 'bg-rose-950/20 border-rose-900/40 opacity-70'
                              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <span className="text-[9px] text-slate-400 truncate w-full text-center">
                            {item.timestamp ? item.timestamp.slice(5) : `#${idx+1}`}
                          </span>

                          {/* Height Bar Indicator */}
                          <div className="w-3 bg-slate-800 rounded-sm h-7 relative overflow-hidden flex items-end">
                            {isMissing ? (
                              <div className="w-full h-full bg-rose-500/40 flex items-center justify-center text-[7px] text-rose-300">
                                ✕
                              </div>
                            ) : (
                              <div
                                className="w-full bg-emerald-400 rounded-sm transition-all duration-200"
                                style={{ height: `${Math.max(8, norm * 100)}%` }}
                              />
                            )}
                          </div>

                          <span className={`text-[8px] font-bold ${isMissing ? 'text-rose-400' : 'text-slate-300'}`}>
                            {isMissing ? 'MUTE' : item.original_measurement !== null ? Number(item.original_measurement).toFixed(1) : '--'}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Active Frame Telemetry Inspector */}
              {activeFrame && (
                <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="text-xs font-bold text-slate-200">
                        {activeFrame.timestamp}
                      </span>
                      {activeFrame.zone && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-emerald-400 font-bold">
                          ZONE {activeFrame.zone}
                        </span>
                      )}
                    </div>

                    <Badge
                      variant={
                        activeFrame.quality_information.is_missing
                          ? 'rose'
                          : activeFrame.quality_information.quality_flag === 'OPTIMAL'
                          ? 'emerald'
                          : 'amber'
                      }
                      size="sm"
                    >
                      {activeFrame.quality_information.quality_flag}
                    </Badge>
                  </div>

                  {/* 4-Stat Value Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/80">
                      <div className="text-[10px] text-slate-400">ORIGINAL MEASUREMENT</div>
                      <div className="text-base font-extrabold text-slate-100 mt-0.5">
                        {activeFrame.original_measurement !== null
                          ? `${Number(activeFrame.original_measurement).toFixed(2)} ${activeFrame.original_unit}`
                          : 'MISSING (NULL)'}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/80">
                      <div className="text-[10px] text-slate-400">NORMALIZED SCALE</div>
                      <div className="text-base font-extrabold text-emerald-400 mt-0.5">
                        {activeFrame.normalized_value !== null
                          ? Number(activeFrame.normalized_value).toFixed(3)
                          : 'NONE (NO PITCH)'}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/80">
                      <div className="text-[10px] text-slate-400">ACOUSTIC PITCH</div>
                      <div className="text-base font-extrabold text-cyan-300 mt-0.5">
                        {activeFrame.sonification_telemetry?.acoustic_pitch_hz
                          ? `${activeFrame.sonification_telemetry.acoustic_pitch_hz} Hz`
                          : 'SILENCE'}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/80">
                      <div className="text-[10px] text-slate-400">MIDI NOTE / EVENT</div>
                      <div className="text-base font-extrabold text-amber-300 mt-0.5">
                        {activeFrame.sonification_telemetry?.midi_note
                          ? `MIDI #${activeFrame.sonification_telemetry.midi_note}`
                          : 'REST / DROPOUT'}
                      </div>
                    </div>
                  </div>

                  {/* Sonification DSP Parameters Bar */}
                  <div className="p-2.5 rounded-lg bg-slate-900/50 border border-slate-800 text-[11px] grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <span className="text-slate-400">FILTER CUTOFF: </span>
                      <span className="text-slate-200 font-bold">
                        {activeFrame.sonification_telemetry?.filter_cutoff_hz ?? 0} Hz
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">HARMONIC WARMTH: </span>
                      <span className="text-slate-200 font-bold">
                        {activeFrame.sonification_telemetry?.harmonic_warmth ?? 0.0}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">AUDIO ACTION: </span>
                      <span className={activeFrame.sonification_telemetry?.audio_event === 'NOTE_ON' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                        {activeFrame.sonification_telemetry?.audio_event ?? 'MUTED'}
                      </span>
                    </div>
                  </div>

                  {/* Quality Notes */}
                  <div className="text-[11px] text-slate-400 flex items-center space-x-1.5">
                    <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>QC Note: {activeFrame.quality_information?.qc_notes}</span>
                  </div>
                </div>
              )}

            </div>
          </GlassPanel>

        </div>

        {/* Right Column (4 cols): Statistical Summary & Invariants */}
        <div className="lg:col-span-4 space-y-4">

          {/* Statistical Summary Card */}
          <GlassPanel
            title="Statistical Summary"
            subtitle={`PRESERVED UNITS: ${stats?.unit || '--'}`}
            icon={BarChart2}
          >
            {stats ? (
              <div className="space-y-3 font-mono text-xs">
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">MEAN</span>
                    <span className="text-base font-extrabold text-slate-100">
                      {stats.mean !== null ? `${stats.mean} ${stats.unit}` : '--'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">MEDIAN</span>
                    <span className="text-base font-extrabold text-slate-100">
                      {stats.median !== null ? `${stats.median} ${stats.unit}` : '--'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">MINIMUM</span>
                    <span className="text-base font-extrabold text-slate-100">
                      {stats.min !== null ? `${stats.min} ${stats.unit}` : '--'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">MAXIMUM</span>
                    <span className="text-base font-extrabold text-slate-100">
                      {stats.max !== null ? `${stats.max} ${stats.unit}` : '--'}
                    </span>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">STD DEVIATION:</span>
                    <span className="text-slate-200 font-bold">{stats.std_dev ?? '--'} {stats.unit}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">PHYSICAL RANGE:</span>
                    <span className="text-slate-200 font-bold">{stats.range ?? '--'} {stats.unit}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">VALID DATA POINTS:</span>
                    <span className="text-emerald-400 font-bold">{stats.valid_points} / {stats.total_points} ({stats.valid_percentage}%)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">MISSING DATA:</span>
                    <span className={stats.missing_points > 0 ? "text-amber-400 font-bold" : "text-slate-400"}>
                      {stats.missing_points} point(s)
                    </span>
                  </div>

                  {stats.dry_days_count !== undefined && (
                    <div className="pt-1.5 border-t border-slate-800/80 space-y-1">
                      <div className="flex items-center justify-between text-cyan-300">
                        <span>DRY DAYS (REAL 0.0 mm):</span>
                        <span className="font-extrabold">{stats.dry_days_count} days</span>
                      </div>
                      <div className="flex items-center justify-between text-cyan-300">
                        <span>RAINY DAYS (&gt; 0.0 mm):</span>
                        <span className="font-extrabold">{stats.rainy_days_count} days</span>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            ) : (
              <div className="py-6 text-center text-slate-400 font-mono text-xs">
                No statistical summary loaded.
              </div>
            )}
          </GlassPanel>

          {/* Dataset Metadata Card */}
          {engineData?.dataset_metadata && (
            <GlassPanel
              title="Dataset Provenance"
              subtitle={engineData.dataset_metadata.source}
              icon={Database}
            >
              <div className="space-y-2 text-[11px] font-mono text-slate-400">
                <div className="text-slate-200 font-bold">
                  {engineData.dataset_metadata.dataset_name}
                </div>
                <div className="space-y-1 pt-1 border-t border-slate-800">
                  <div className="flex justify-between">
                    <span>RESOLUTION:</span>
                    <span className="text-slate-200">{engineData.dataset_metadata.spatial_resolution}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>CADENCE:</span>
                    <span className="text-slate-200">{engineData.dataset_metadata.temporal_frequency}</span>
                  </div>
                  <div className="pt-1 text-[10px] text-slate-400">
                    {engineData.dataset_metadata.processing_information}
                  </div>
                </div>
              </div>
            </GlassPanel>
          )}

        </div>

      </div>

    </div>
  )
}
