import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play,
  Pause,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Repeat,
  Gauge,
  Sliders,
  Waves,
  Eye,
  Activity,
  Compass,
  Layers,
  Sparkles,
  Upload,
  Clock,
  Volume2,
  Radio,
  FileCheck,
  Flame,
  Snowflake,
  Trees,
  Droplets,
  AlertCircle,
  HelpCircle
} from 'lucide-react'

import GlassPanel from '../common/GlassPanel'
import Button from '../common/Button'
import Badge from '../common/Badge'
import WaveformDisplay from '../common/WaveformDisplay'
import AudioDescriptionPanel from '../accessibility/AudioDescriptionPanel'
import useSequenceSonification from '../../hooks/useSequenceSonification'
import { globalSonificationEngine, MUSICAL_STYLES } from '../../services/sonificationEngine'
import { fetchSequencePresets, fetchSequencePreset, analyzeSequenceFile } from '../../services/api'

// Preset configurations for one-click authentic NASA time-series
const PRESET_ICONS = {
  arctic_sea_ice: Snowflake,
  temperature_anomaly: Flame,
  amazon_phenology: Trees,
  el_nino_sst: Droplets,
}

const SPEED_OPTIONS = [0.25, 0.5, 1.0, 1.5, 2.0, 4.0]

export default function DynamicSequenceWorkstation({ initialPresetId = 'arctic_sea_ice', onSelectTrack }) {
  const [activePresetId, setActivePresetId] = useState(initialPresetId)
  const [isLoading, setIsLoading] = useState(false)
  const [presetList, setPresetList] = useState([])
  const [uploadError, setUploadError] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [activeStyle, setActiveStyle] = useState('ambient_earth')
  const fileInputRef = useRef(null)

  const {
    sequence,
    currentFrameIndex,
    totalFrames,
    currentTimestamp,
    totalDuration,
    fps,
    progress,
    isPlaying,
    isPaused,
    playbackSpeed,
    isLooping,
    currentFrameData,
    interpolatedTelemetry,
    trends,
    play,
    pause,
    togglePlay,
    restart,
    seekToFrame,
    seekToProgress,
    stepBackward,
    stepForward,
    jumpToStart,
    jumpToEnd,
    changeSpeed,
    toggleLoop,
    loadSequence,
  } = useSequenceSonification(null)

  // 1. Load presets list and initial sequence on mount
  useEffect(() => {
    async function init() {
      setIsLoading(true)
      const presetsResp = await fetchSequencePresets()
      if (presetsResp?.presets) {
        setPresetList(presetsResp.presets)
      }

      // Load initial preset
      const seqData = await fetchSequencePreset(initialPresetId)
      if (seqData) {
        loadSequence(seqData)
      }
      setIsLoading(false)
    }
    init()
  }, [initialPresetId, loadSequence])

  // 2. Switch preset
  const handleSelectPreset = async (presetId) => {
    if (presetId === activePresetId && sequence) return
    setIsLoading(true)
    setActivePresetId(presetId)
    setUploadError(null)

    // Set recommended sound style based on preset phenomenon
    if (presetId === 'arctic_sea_ice') {
      setActiveStyle('ambient_earth')
      globalSonificationEngine.updateSettings({ style: 'ambient_earth' })
    } else if (presetId === 'temperature_anomaly') {
      setActiveStyle('electronic')
      globalSonificationEngine.updateSettings({ style: 'electronic' })
    } else if (presetId === 'amazon_phenology') {
      setActiveStyle('ambient_earth')
      globalSonificationEngine.updateSettings({ style: 'ambient_earth' })
    } else if (presetId === 'el_nino_sst') {
      setActiveStyle('ocean_waves')
      globalSonificationEngine.updateSettings({ style: 'ocean_waves' })
    }

    const seqData = await fetchSequencePreset(presetId)
    if (seqData) {
      loadSequence(seqData)
    }
    setIsLoading(false)
  }

  // 3. Handle custom animated GIF or multi-frame sequence upload
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadError(null)
    setIsUploading(true)

    try {
      const result = await analyzeSequenceFile(file, 3.0, 36)
      if (result && result.frames?.length > 0) {
        setActivePresetId('custom_upload')
        loadSequence(result)
      } else {
        throw new Error('Could not extract valid visual frames from sequence.')
      }
    } catch (err) {
      setUploadError(err.message || 'Failed to process animated sequence.')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // Handle style switch
  const handleStyleChange = (styleKey) => {
    setActiveStyle(styleKey)
    globalSonificationEngine.updateSettings({ style: styleKey })
  }

  // Formatting helpers
  const formatTime = (sec = 0) => {
    const m = Math.floor(sec / 60)
    const s = Math.floor(sec % 60)
    const ms = Math.floor((sec % 1) * 10)
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms}`
  }

  // Live dynamic telemetry metrics
  const lum = interpolatedTelemetry?.normalized_brightness ?? 0.5
  const hue = interpolatedTelemetry?.hue_mean_deg ?? 180.0
  const edges = interpolatedTelemetry?.edge_density ?? 0.2
  const pan = (interpolatedTelemetry?.centroid_x_norm ?? 0.5) - 0.5
  const delta = interpolatedTelemetry?.delta_from_previous ?? 0.0

  // Filter cutoff approximation for HUD
  const filterCutoffHz = Math.round(400 + Math.pow(lum, 1.35) * 8100)

  // Musical note approximation from hue
  const chromaticNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
  const noteIndex = Math.floor((hue / 360) * 12) % 12
  const currentNote = `${chromaticNotes[noteIndex]}3`

  return (
    <div className="space-y-6">

      {/* Preset Selector & Upload Header Strip */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/60 border border-cyan-500/20 backdrop-blur-md">
        
        {/* Preset Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider mr-2 flex items-center">
            <Layers className="w-3.5 h-3.5 mr-1" />
            NASA Time-Series:
          </span>

          {presetList.map((preset) => {
            const Icon = PRESET_ICONS[preset.id] || Activity
            const isSelected = activePresetId === preset.id

            return (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset.id)}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/20 scale-[1.02]'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 hover:text-white border border-slate-700/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{preset.title.split('(')[0].trim()}</span>
              </button>
            )
          })}
        </div>

        {/* Upload Custom Sequence Button */}
        <div className="flex items-center space-x-2 shrink-0">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/gif,image/apng"
            className="hidden"
            onChange={handleFileUpload}
          />
          <Button
            variant="outline"
            size="sm"
            icon={Upload}
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? 'Extracting Frames...' : 'Upload Animated Sequence'}
          </Button>
        </div>
      </div>

      {uploadError && (
        <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-lg text-red-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Main Studio Arena: Visual Animation Viewport + Real-Time Telemetry HUD */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Visual Animation Player (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="relative aspect-[16/10] bg-slate-950 rounded-2xl border border-cyan-500/30 overflow-hidden shadow-2xl flex items-center justify-center group">
            
            {/* Visual Frame Render */}
            {currentFrameData?.thumbnail_base64 ? (
              <img
                src={currentFrameData.thumbnail_base64}
                alt={`Earth Visualization Frame ${currentFrameIndex + 1}`}
                className="w-full h-full object-contain select-none"
              />
            ) : (
              <div className="text-center text-slate-500 text-sm font-mono flex flex-col items-center">
                <Activity className="w-8 h-8 text-cyan-400 animate-spin mb-2" />
                <span>Loading Planetary Sequence...</span>
              </div>
            )}

            {/* Top-Left Live HUD Badge */}
            <div className="absolute top-4 left-4 flex flex-col space-y-1.5 z-10 pointer-events-none">
              <div className="flex items-center space-x-2 bg-slate-900/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-cyan-500/30 text-xs font-mono shadow-lg">
                <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                <span className="text-cyan-300 font-bold">
                  FRAME {currentFrameIndex + 1} / {totalFrames}
                </span>
                <span className="text-slate-500">|</span>
                <span className="text-slate-300">
                  {formatTime(currentTimestamp)} / {formatTime(totalDuration)}
                </span>
                <span className="text-slate-500">|</span>
                <span className="text-amber-400 font-semibold">{playbackSpeed}x SPEED</span>
              </div>

              {sequence?.filename && (
                <div className="bg-slate-900/70 backdrop-blur-sm px-2.5 py-1 rounded text-[11px] font-mono text-slate-400 border border-slate-700/50 w-fit">
                  {sequence.filename}
                </div>
              )}
            </div>

            {/* Top-Right Soundscape Status HUD */}
            <div className="absolute top-4 right-4 z-10 pointer-events-none">
              <div className="bg-slate-900/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-cyan-500/30 text-xs font-mono shadow-lg flex items-center space-x-2">
                <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span className="text-slate-300">VOICING:</span>
                <span className="text-emerald-400 font-bold">{currentNote}</span>
                <span className="text-slate-500">•</span>
                <span className="text-cyan-300">{filterCutoffHz} Hz</span>
              </div>
            </div>

            {/* Bottom-Center Big Play/Pause Overlay On Hover */}
            <button
              onClick={togglePlay}
              className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-cyan-500/90 hover:bg-cyan-400 text-slate-950 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 transform scale-90 group-hover:scale-100 shadow-xl shadow-cyan-500/30 z-20 cursor-pointer"
              title={isPlaying ? 'Pause Animation' : 'Play Synchronized Animation'}
            >
              {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
            </button>

            {/* Dynamic Waveform Overlay along Bottom of Viewport */}
            <div className="absolute bottom-0 inset-x-0 h-16 pointer-events-none z-10 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent">
              <WaveformDisplay
                isLive={isPlaying}
                audioNode={globalSonificationEngine.analyser}
                height={50}
                color="#06b6d4"
                mode="oscilloscope"
              />
            </div>
          </div>

          {/* Interactive Timeline Scrubber & Transport Controls */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-cyan-500/20 backdrop-blur-md space-y-4 shadow-xl">
            
            {/* Scrubber Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span>{formatTime(currentTimestamp)}</span>
                <span className="text-cyan-400 font-bold">
                  INTERPOLATED FRAME {((currentTimestamp * (fps || 3.0)) + 1).toFixed(1)} / {totalFrames}
                </span>
                <span>{formatTime(totalDuration)}</span>
              </div>

              <div
                className="relative h-4 bg-slate-800 rounded-full cursor-pointer overflow-hidden border border-slate-700/60 group"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  const clickX = e.clientX - rect.left
                  const ratio = Math.max(0, Math.min(1, clickX / rect.width))
                  seekToProgress(ratio)
                }}
              >
                {/* Frame Tick Marks */}
                <div className="absolute inset-0 flex justify-between px-1 pointer-events-none opacity-30">
                  {Array.from({ length: totalFrames }).map((_, i) => (
                    <div key={i} className="w-px h-full bg-slate-500" />
                  ))}
                </div>

                {/* Progress Fill */}
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 transition-all duration-75 relative"
                  style={{ width: `${progress * 100}%` }}
                >
                  <div className="absolute right-0 top-0 bottom-0 w-2 bg-white shadow-md rounded-full transform translate-x-1" />
                </div>
              </div>
            </div>

            {/* Main Transport Control Strip */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-800">
              
              {/* Left Transport: Restart, Step Back, Play, Step Fwd */}
              <div className="flex items-center space-x-1 sm:space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  icon={RotateCcw}
                  onClick={restart}
                  title="Restart Sequence (Frame 0)"
                />

                <Button
                  variant="ghost"
                  size="sm"
                  icon={ChevronsLeft}
                  onClick={jumpToStart}
                  title="Jump to First Frame"
                />

                <Button
                  variant="outline"
                  size="sm"
                  icon={ChevronLeft}
                  onClick={stepBackward}
                  title="Step Backward (-1 Frame)"
                />

                <Button
                  variant="primary"
                  size="md"
                  icon={isPlaying ? Pause : Play}
                  onClick={togglePlay}
                  className="px-5 font-bold shadow-lg shadow-cyan-500/20"
                >
                  {isPlaying ? 'Pause' : 'Play'}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  icon={ChevronRight}
                  onClick={stepForward}
                  title="Step Forward (+1 Frame)"
                />

                <Button
                  variant="ghost"
                  size="sm"
                  icon={ChevronsRight}
                  onClick={jumpToEnd}
                  title="Jump to Last Frame"
                />

                <button
                  onClick={toggleLoop}
                  className={`p-2 rounded-lg text-xs transition-colors ${
                    isLooping
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                  title={isLooping ? 'Looping Enabled' : 'Single Pass (Loop Disabled)'}
                >
                  <Repeat className="w-4 h-4" />
                </button>
              </div>

              {/* Speed Multiplier Pills */}
              <div className="flex items-center space-x-1 bg-slate-950/60 p-1 rounded-lg border border-slate-800">
                <Clock className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-1" />
                {SPEED_OPTIONS.map((speed) => (
                  <button
                    key={speed}
                    onClick={() => changeSpeed(speed)}
                    className={`px-2 py-1 rounded text-[11px] font-mono transition-all ${
                      playbackSpeed === speed
                        ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>

              {/* Sound Style Selector */}
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">STYLE:</span>
                <select
                  value={activeStyle}
                  onChange={(e) => handleStyleChange(e.target.value)}
                  className="bg-slate-950 text-cyan-300 text-xs font-mono px-2.5 py-1.5 rounded-lg border border-cyan-500/30 focus:outline-none focus:border-cyan-400"
                >
                  {Object.entries(MUSICAL_STYLES).map(([key, style]) => (
                    <option key={key} value={key}>
                      {style.label} ({style.scaleName})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Real-Time Optical-to-Acoustic Telemetry Deck (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <GlassPanel
            title="Dynamic Telemetry Modulation"
            subtitle="CONTINUOUS AUDIO PARAMETER GLIDE"
            icon={Gauge}
          >
            <div className="space-y-4">

              {/* Metric 1: Brightness -> Filter Cutoff */}
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-400">1. BRIGHTNESS → FILTER</span>
                  <span className="font-mono text-cyan-400 font-bold">{filterCutoffHz} Hz</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-400 transition-all duration-75"
                    style={{ width: `${Math.round(lum * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-mono text-slate-500">
                  <span>Muted (400 Hz)</span>
                  <span>Luminance: {(lum * 255).toFixed(1)}</span>
                  <span>Open (8.5 kHz)</span>
                </div>
              </div>

              {/* Metric 2: Dominant Hue -> Musical Pitch */}
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-400">2. DOMINANT HUE → ROOT</span>
                  <div className="flex items-center space-x-1.5">
                    <span className="font-mono text-emerald-400 font-bold">{currentNote}</span>
                    <span className="text-[11px] font-mono text-slate-500">({hue.toFixed(1)}°)</span>
                  </div>
                </div>
                <div className="w-full bg-gradient-to-r from-red-500 via-green-500 via-blue-500 to-red-500 h-2 rounded-full relative">
                  <div
                    className="absolute top-0 bottom-0 w-2 bg-white rounded-full border border-slate-950 shadow-md transform -translate-x-1 transition-all duration-75"
                    style={{ left: `${(hue / 360) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-mono text-slate-500">
                  <span>0° Red</span>
                  <span>120° Green</span>
                  <span>240° Blue</span>
                  <span>360°</span>
                </div>
              </div>

              {/* Metric 3: Edge Density -> Arpeggio Subdivision */}
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-400">3. EDGE DENSITY → RHYTHM</span>
                  <span className="font-mono text-amber-400 font-bold">
                    {(edges * 100).toFixed(1)}% Edges
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 transition-all duration-75"
                    style={{ width: `${Math.min(100, Math.round(edges * 200))}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-mono text-slate-500">
                  <span>1/4 Notes (Smooth)</span>
                  <span>1/8 Notes</span>
                  <span>1/16 Syncopated</span>
                </div>
              </div>

              {/* Metric 4: Spatial Centroid -> Stereo Pan */}
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-400">4. SPATIAL CENTROID → PAN</span>
                  <span className="font-mono text-purple-400 font-bold">
                    {pan < -0.05 ? `Left ${Math.abs(pan * 2).toFixed(2)}` : pan > 0.05 ? `Right ${(pan * 2).toFixed(2)}` : 'Center'}
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full relative">
                  <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-slate-600" />
                  <div
                    className="absolute top-0 bottom-0 w-2.5 bg-purple-400 rounded-full shadow-sm transform -translate-x-1.5 transition-all duration-75"
                    style={{ left: `${(pan + 0.5) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-mono text-slate-500">
                  <span>100% Left</span>
                  <span>Center</span>
                  <span>100% Right</span>
                </div>
              </div>

              {/* Metric 5: Temporal Delta -> Dynamic Swell */}
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-400">5. FRAME DELTA → SWELL</span>
                  <span className="font-mono text-pink-400 font-bold">
                    {(delta * 100).toFixed(1)}% Motion
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-pink-500 transition-all duration-75"
                    style={{ width: `${Math.min(100, Math.round(delta * 400))}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-mono text-slate-500">
                  <span>Static State</span>
                  <span>LFO Sweep</span>
                  <span>Dynamic Surge</span>
                </div>
              </div>

              {/* Macro Planetary Trends Card */}
              {trends && (
                <div className="p-3 rounded-lg bg-cyan-950/30 border border-cyan-500/20 text-xs font-mono space-y-1">
                  <div className="text-cyan-400 font-bold">PLANETARY SEQUENCE TRENDS:</div>
                  <div className="text-slate-300">
                    • Brightness Shift: <span className="text-white font-semibold">{trends.brightness_trend} ({trends.brightness_delta_total > 0 ? '+' : ''}{(trends.brightness_delta_total * 100).toFixed(1)}%)</span>
                  </div>
                  <div className="text-slate-300">
                    • Dominant Hue Drift: <span className="text-white font-semibold">{trends.dominant_hue_drift_deg > 0 ? '+' : ''}{trends.dominant_hue_drift_deg}°</span>
                  </div>
                  <div className="text-slate-300">
                    • Peak Dynamic Event: <span className="text-amber-400 font-semibold">Frame {trends.peak_motion_frame + 1}</span>
                  </div>
                </div>
              )}

            </div>
          </GlassPanel>
        </div>
      </div>

      {/* Non-Visual Multimodal & Audio Description Panel (Phase 9) */}
      <AudioDescriptionPanel sequenceId={activePresetId} />

      {/* Frame Filmstrip Navigation */}
      <GlassPanel
        title="Sequential Frame Decomposition & Instant Navigation"
        subtitle={`CLICK ANY FRAME TO SCRUB • ${totalFrames} KEYFRAMES EXTRACTED`}
        icon={Layers}
      >
        <div className="flex items-center space-x-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-cyan-500/20">
          {sequence?.frames?.map((frm, idx) => {
            const isCurrent = idx === currentFrameIndex
            return (
              <button
                key={idx}
                onClick={() => seekToFrame(idx)}
                className={`relative shrink-0 w-24 sm:w-28 rounded-xl overflow-hidden border transition-all text-left group ${
                  isCurrent
                    ? 'border-cyan-400 shadow-lg shadow-cyan-500/30 scale-105 z-10 ring-2 ring-cyan-400/50'
                    : 'border-slate-800 hover:border-slate-600 opacity-70 hover:opacity-100'
                }`}
              >
                <div className="aspect-[4/3] bg-slate-950 relative">
                  <img
                    src={frm.thumbnail_base64}
                    alt={`Frame ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {isCurrent && (
                    <div className="absolute inset-0 bg-cyan-500/15 pointer-events-none" />
                  )}
                </div>

                <div className="p-1.5 bg-slate-900/90 text-[10px] font-mono flex items-center justify-between">
                  <span className={isCurrent ? 'text-cyan-300 font-bold' : 'text-slate-400'}>
                    #{idx + 1}
                  </span>
                  <span className="text-slate-500">
                    {formatTime(frm.timestamp_sec)}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </GlassPanel>

    </div>
  )
}
