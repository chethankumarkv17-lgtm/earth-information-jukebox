import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Play, 
  Pause, 
  Square, 
  Volume2, 
  VolumeX, 
  Gauge, 
  Music, 
  Waves, 
  Sliders, 
  Activity, 
  Sparkles, 
  Wind, 
  Zap, 
  Radio, 
  Eye, 
  Layers, 
  Compass, 
  ShieldCheck, 
  RotateCcw,
  BarChart3,
  Hash
} from 'lucide-react'

import GlassPanel from '../common/GlassPanel'
import Button from '../common/Button'
import Badge from '../common/Badge'
import useSonification from '../../hooks/useSonification'
import { hashFeaturesAndSettings } from '../../services/sonificationEngine'

/**
 * Core Earth Jukebox Sonification Engine Control & Visualizer Panel (Phase 6)
 * Real-time procedural audio synthesis from NASA Earth visualization features.
 */
export default function SonificationEnginePanel({
  analysisData = null,
  compact = false,
  className = '',
}) {
  const {
    engine,
    isPlaying,
    isPaused,
    playbackTime,
    activeStep,
    settings,
    styles,
    play,
    pause,
    stop,
    setVolume,
    setTempo,
    setPitch,
    setIntensity,
    setStyle,
    loadAnalysis,
  } = useSonification(analysisData)

  const [visualizerMode, setVisualizerMode] = useState('waveform') // 'waveform' | 'frequency'
  const canvasRef = useRef(null)
  const animationFrameRef = useRef(null)

  // Update engine if parent passes new analysis
  useEffect(() => {
    if (analysisData) {
      loadAnalysis(analysisData)
    }
  }, [analysisData, loadAnalysis])

  // Real-Time Canvas Audio Visualizer
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const bufferLength = 1024
    const timeData = new Uint8Array(bufferLength)
    const freqData = new Uint8Array(bufferLength)

    const renderFrame = () => {
      animationFrameRef.current = requestAnimationFrame(renderFrame)

      const width = canvas.width
      const height = canvas.height

      // Clear with dark telemetry background
      ctx.fillStyle = 'rgba(4, 8, 22, 0.45)'
      ctx.fillRect(0, 0, width, height)

      // Draw faint grid lines
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.08)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(0, height / 2)
      ctx.lineTo(width, height)
      ctx.stroke()

      if (!engine || !engine.analyser || !isPlaying) {
        // Idle gentle breathing baseline
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.3)'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        for (let x = 0; x < width; x++) {
          const y = height / 2 + Math.sin(x * 0.03 + Date.now() * 0.002) * (isPlaying ? 8 : 2)
          if (x === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()
        return
      }

      if (visualizerMode === 'waveform') {
        // Mode 1: Oscilloscope Time-Domain Waveform
        engine.getTimeDomainData(timeData)

        ctx.lineWidth = 2
        const gradient = ctx.createLinearGradient(0, 0, width, 0)
        gradient.addColorStop(0, '#0284c7')
        gradient.addColorStop(0.5, '#22d3ee')
        gradient.addColorStop(1, '#10b981')
        ctx.strokeStyle = gradient

        ctx.beginPath()
        const sliceWidth = width / bufferLength
        let x = 0

        for (let i = 0; i < bufferLength; i++) {
          const v = timeData[i] / 128.0
          const y = (v * height) / 2

          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)

          x += sliceWidth
        }
        ctx.lineTo(width, height / 2)
        ctx.stroke()

      } else {
        // Mode 2: FFT Frequency Spectrum Bars
        engine.getFrequencyData(freqData)

        const barCount = 48
        const barWidth = (width / barCount) - 2
        let x = 1

        for (let i = 0; i < barCount; i++) {
          // Logarithmic bin sampling
          const binIndex = Math.floor(Math.pow(i / barCount, 1.8) * (bufferLength / 3))
          const val = freqData[binIndex] || 0
          const barHeight = (val / 255) * (height - 12)

          const barGrad = ctx.createLinearGradient(0, height, 0, height - barHeight)
          barGrad.addColorStop(0, 'rgba(6, 182, 212, 0.4)')
          barGrad.addColorStop(0.7, '#22d3ee')
          barGrad.addColorStop(1, '#34d399')
          ctx.fillStyle = barGrad

          ctx.fillRect(x, height - barHeight, barWidth, barHeight)
          x += barWidth + 2
        }
      }
    }

    renderFrame()

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [engine, isPlaying, visualizerMode])

  // Format playback seconds to MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Active Reproducibility Hash
  const reproducibilitySeed = hashFeaturesAndSettings(
    analysisData?.normalized_features || {},
    settings
  )

  // Style icons
  const styleIconMap = {
    ambient_earth: Sparkles,
    ocean_waves: Waves,
    atmospheric: Wind,
    electronic: Zap,
    experimental: Radio,
  }

  const norm = analysisData?.normalized_features || {}
  const optical = analysisData?.optical_features || {}

  return (
    <div className={`space-y-6 ${className}`}>
      
      {/* 1. MASTER SYNTHESIZER DECK */}
      <GlassPanel variant="elevated" className="p-6 border-cyan-400/30">
        
        {/* Top Header / Status Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-xl border transition-all ${
              isPlaying 
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50 shadow-[0_0_15px_rgba(6,182,212,0.3)] animate-pulse' 
                : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}>
              <Waves className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs uppercase tracking-wider text-cyan-400 font-bold">
                  EARTH JUKEBOX PROCEDURAL SONIFICATION ENGINE
                </span>
                <Badge variant={isPlaying ? 'cyan' : isPaused ? 'amber' : 'neutral'} size="sm">
                  {isPlaying ? 'SYNTHESIZING' : isPaused ? 'PAUSED' : 'STANDBY'}
                </Badge>
              </div>
              <h3 className="text-lg font-bold text-slate-100 tracking-tight mt-0.5">
                Dynamic Feature-to-Audio Synthesis
              </h3>
            </div>
          </div>

          {/* Clock & Deterministic Seed Badge */}
          <div className="flex items-center space-x-3 font-mono text-xs">
            <div className="bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800 flex items-center space-x-2">
              <span className="text-slate-500">PLAYHEAD:</span>
              <span className="text-cyan-400 font-bold text-sm">{formatTime(playbackTime)}</span>
              <span className="text-slate-600">/</span>
              <span className="text-slate-400">STEP {activeStep + 1}</span>
            </div>

            <div 
              className="bg-slate-950/80 px-2.5 py-1.5 rounded-xl border border-slate-800 flex items-center space-x-1.5 text-slate-400"
              title="Deterministic PRNG Seed Hash: Same image + settings produce 100% reproducible sound."
            >
              <Hash className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[10px] text-cyan-300 font-bold font-mono">
                {reproducibilitySeed.toString(16).toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* 2. REAL-TIME CANVAS VISUALIZER */}
        <div className="relative mt-4 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 p-2 shadow-inner">
          <canvas
            ref={canvasRef}
            width={720}
            height={160}
            className="w-full h-36 md:h-44 block rounded"
          />

          {/* Visualizer Mode Switcher */}
          <div className="absolute top-4 right-4 flex items-center space-x-1 bg-slate-950/80 p-1 rounded-lg border border-slate-800 font-mono text-[10px]">
            <button
              onClick={() => setVisualizerMode('waveform')}
              className={`px-2.5 py-1 rounded transition-colors ${
                visualizerMode === 'waveform' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              OSCILLOSCOPE
            </button>
            <button
              onClick={() => setVisualizerMode('frequency')}
              className={`px-2.5 py-1 rounded transition-colors ${
                visualizerMode === 'frequency' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              FFT SPECTRUM
            </button>
          </div>

          {/* Current Style & Harmonic Scale Overlay */}
          <div className="absolute bottom-4 left-4 flex items-center space-x-2 font-mono text-[10px] text-slate-400 bg-slate-950/85 px-2.5 py-1 rounded border border-slate-800/80">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-slate-300">{styles[settings.style]?.label}:</span>
            <span className="text-cyan-300 font-bold">{styles[settings.style]?.scaleName}</span>
          </div>
        </div>

        {/* 3. PRIMARY TRANSPORT CONTROLS */}
        <div className="flex flex-wrap items-center justify-between gap-4 mt-6 pt-5 border-t border-slate-800/80">
          
          {/* Transport Buttons (Play, Pause, Stop) */}
          <div className="flex items-center space-x-3">
            {!isPlaying ? (
              <Button
                variant="primary"
                icon={Play}
                size="lg"
                onClick={play}
                className="shadow-[0_0_20px_rgba(6,182,212,0.4)]"
              >
                Synthesize Audio
              </Button>
            ) : (
              <Button
                variant="secondary"
                icon={Pause}
                size="lg"
                onClick={pause}
                className="border-amber-400/40 text-amber-300"
              >
                Pause
              </Button>
            )}

            <Button
              variant="outline"
              icon={Square}
              size="md"
              onClick={stop}
              disabled={!isPlaying && !isPaused}
              title="Stop and reset playhead"
            >
              Stop
            </Button>
          </div>

          {/* Master Volume Slider */}
          <div className="flex items-center space-x-3 bg-slate-950/70 px-4 py-2 rounded-xl border border-slate-800 font-mono text-xs">
            <button 
              onClick={() => setVolume(settings.volume === 0 ? 80 : 0)}
              className="text-slate-400 hover:text-cyan-300 transition-colors"
            >
              {settings.volume === 0 ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
            </button>
            <span className="text-slate-400 w-12">VOL: {settings.volume}%</span>
            <input
              type="range"
              min="0"
              max="100"
              value={settings.volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-24 sm:w-32 accent-cyan-400 h-1.5 bg-slate-800 rounded cursor-pointer"
            />
          </div>
        </div>

      </GlassPanel>

      {/* 4. SOUND STYLE SELECTOR (5 Styles) */}
      <GlassPanel title="Earth Instrument Styles" subtitle="PROCEDURAL TIMBRE & SCALES" icon={Music}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {Object.values(styles).map((st) => {
            const Icon = styleIconMap[st.id] || Sparkles
            const isActive = settings.style === st.id

            return (
              <button
                key={st.id}
                onClick={() => setStyle(st.id)}
                className={`p-3.5 rounded-xl text-left border transition-all relative overflow-hidden ${
                  isActive
                    ? 'bg-cyan-500/15 border-cyan-400 text-cyan-200 shadow-lg shadow-cyan-500/15 ring-1 ring-cyan-400/40'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-1.5 rounded-lg border ${
                    isActive ? 'bg-cyan-400/20 text-cyan-300 border-cyan-400/30' : 'bg-slate-900 text-slate-500 border-slate-800'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  {isActive && <Badge variant="cyan" size="sm">ACTIVE</Badge>}
                </div>

                <h4 className="text-xs font-bold text-slate-100">{st.label}</h4>
                <p className="text-[10px] text-slate-400 font-mono mt-1 line-clamp-2">
                  {st.description}
                </p>

                <div className="mt-2.5 pt-2 border-t border-slate-800/80 font-mono text-[9px] text-cyan-400/90 flex justify-between">
                  <span>{st.scaleName}</span>
                </div>
              </button>
            )
          })}
        </div>
      </GlassPanel>

      {/* 5. PARAMETRIC SYNTHESIS CONTROLS (Tempo, Pitch, Intensity) */}
      <GlassPanel title="Sonification Parameter Matrix" subtitle="REAL-TIME MODULATION CONTROLS" icon={Sliders}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs">
          
          {/* Control 1: Tempo (BPM) */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Gauge className="w-4 h-4 text-cyan-400" />
                TEMPO CLOCK
              </span>
              <span className="text-cyan-300 font-bold text-sm">{settings.tempo} BPM</span>
            </div>
            <input
              type="range"
              min="40"
              max="180"
              value={settings.tempo}
              onChange={(e) => setTempo(Number(e.target.value))}
              className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>40 (Larghissimo)</span>
              <span>180 (Presto)</span>
            </div>
          </div>

          {/* Control 2: Pitch Transposition */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Music className="w-4 h-4 text-emerald-400" />
                PITCH SHIFT
              </span>
              <span className="text-emerald-300 font-bold text-sm">
                {settings.pitch > 0 ? `+${settings.pitch}` : settings.pitch} st
              </span>
            </div>
            <input
              type="range"
              min="-12"
              max="12"
              step="1"
              value={settings.pitch}
              onChange={(e) => setPitch(Number(e.target.value))}
              className="w-full accent-emerald-400 h-1.5 bg-slate-800 rounded cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>-12 st (Octave Down)</span>
              <span>+12 st (Octave Up)</span>
            </div>
          </div>

          {/* Control 3: Sound Intensity */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-400" />
                SOUND INTENSITY
              </span>
              <span className="text-amber-300 font-bold text-sm">{settings.intensity}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              value={settings.intensity}
              onChange={(e) => setIntensity(Number(e.target.value))}
              className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>Subtle / Minimal</span>
              <span>Rich / Multi-Layer</span>
            </div>
          </div>

        </div>
      </GlassPanel>

      {/* 6. SCIENTIFIC FEATURE MAPPING MATRIX (The 5 Mappings) */}
      <GlassPanel title="NASA Feature-to-Audio Mapping Architecture" subtitle="DYNAMIC TELEMETRY TRANSLATION" icon={Activity}>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5 font-mono text-xs">
          
          {/* Mapping 1: Brightness -> Volume */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-[10px] text-cyan-400 font-bold">
              <span>1. BRIGHTNESS</span>
              <Badge variant="cyan" size="sm">VOLUME</Badge>
            </div>
            <p className="text-[11px] text-slate-300 font-bold">
              {typeof optical?.brightness_metrics?.bt601_standard_luminance === 'number'
                ? `${optical.brightness_metrics.bt601_standard_luminance.toFixed(1)} / 255`
                : 'Luminance Scaled'}
            </p>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              Modulates overall gain floor and filter ceiling (400 Hz to 8 kHz).
            </p>
          </div>

          {/* Mapping 2: Dominant Colors -> Pitch */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-[10px] text-emerald-400 font-bold">
              <span>2. COLORS</span>
              <Badge variant="emerald" size="sm">PITCH</Badge>
            </div>
            <p className="text-[11px] text-slate-300 font-bold">
              {typeof optical?.color_distribution?.mean_hue === 'number'
                ? `${optical.color_distribution.mean_hue.toFixed(1)}° Hue`
                : 'K=5 Centroids'}
            </p>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              Determines root fundamental and 5-cluster chord voicing intervals.
            </p>
          </div>

          {/* Mapping 3: Pixel Density -> Rhythmic Complexity */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-[10px] text-purple-400 font-bold">
              <span>3. DENSITY</span>
              <Badge variant="purple" size="sm">RHYTHM</Badge>
            </div>
            <p className="text-[11px] text-slate-300 font-bold">
              {typeof norm?.canny_edge_density_norm === 'number'
                ? `${(norm.canny_edge_density_norm * 100).toFixed(1)}% Edges`
                : 'Arp Complexity'}
            </p>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              Canny edge density controls 1/4 vs 1/8 vs 1/16 note arpeggio rates.
            </p>
          </div>

          {/* Mapping 4: Spatial Patterns -> Sound Layers */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-[10px] text-amber-400 font-bold">
              <span>4. SPATIAL</span>
              <Badge variant="amber" size="sm">LAYERS</Badge>
            </div>
            <p className="text-[11px] text-slate-300 font-bold">
              {typeof optical?.spatial_distribution?.centroid_x_norm === 'number'
                ? `Pan: ${((optical.spatial_distribution.centroid_x_norm - 0.5) * 2).toFixed(2)}`
                : '3×3 Matrix'}
            </p>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              Centroid (X, Y) balances stereo pan; 4 quadrants balance 4 layers.
            </p>
          </div>

          {/* Mapping 5: Image Variation -> Musical Changes */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-[10px] text-rose-400 font-bold">
              <span>5. VARIATION</span>
              <Badge variant="rose" size="sm">CHANGES</Badge>
            </div>
            <p className="text-[11px] text-slate-300 font-bold">
              {typeof analysisData?.frame_difference?.mean_absolute_difference === 'number'
                ? `MAD: ${analysisData.frame_difference.mean_absolute_difference.toFixed(1)}`
                : 'Texture Energy'}
            </p>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              Temporal frame delta drives LFO sweep depth and microtonal drift.
            </p>
          </div>

        </div>
      </GlassPanel>

    </div>
  )
}
