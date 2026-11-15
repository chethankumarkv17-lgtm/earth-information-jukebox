import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import globalSonificationEngine from '../../services/sonificationEngine'

/**
 * NASA Earth Sonification Waveform / Oscilloscope Display
 * Powered by Web Audio API AnalyserNode or procedural telemetry fallback.
 */
export default function WaveformDisplay({
  isPlaying = false,
  trackTitle = "MODIS NDVI Biosphere Oscillation",
  coordinates = "03°08'40\"S 60°01'38\"W",
  satellite = "TERRA / AQUA",
  sampleRate = "48.0 kHz",
  bitDepth = "24-bit PCM",
  duration = "03:42",
  currentTime = "01:14",
  className = "",
}) {
  const canvasRef = useRef(null)
  const animFrameRef = useRef(null)

  // Real-time canvas rendering from global sonification engine analyser
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const bufferLength = 512
    const timeData = new Uint8Array(bufferLength)

    const render = () => {
      animFrameRef.current = requestAnimationFrame(render)
      const width = canvas.width
      const height = canvas.height

      ctx.clearRect(0, 0, width, height)

      // Center zero line
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.15)'
      ctx.lineWidth = 1
      ctx.setLineDash([4, 4])
      ctx.beginPath()
      ctx.moveTo(0, height / 2)
      ctx.lineTo(width, height / 2)
      ctx.stroke()
      ctx.setLineDash([])

      const hasLiveAudio = isPlaying && globalSonificationEngine?.analyser

      if (hasLiveAudio) {
        globalSonificationEngine.getTimeDomainData(timeData)

        ctx.lineWidth = 1.8
        const grad = ctx.createLinearGradient(0, 0, width, 0)
        grad.addColorStop(0, '#0284c7')
        grad.addColorStop(0.5, '#22d3ee')
        grad.addColorStop(1, '#10b981')
        ctx.strokeStyle = grad

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

        // Fill under curve
        ctx.fillStyle = 'rgba(6, 182, 212, 0.08)'
        ctx.lineTo(width, height)
        ctx.lineTo(0, height)
        ctx.closePath()
        ctx.fill()

      } else {
        // Idle gentle waveform
        ctx.lineWidth = 1.2
        ctx.strokeStyle = isPlaying ? 'rgba(34, 211, 238, 0.6)' : 'rgba(71, 85, 105, 0.5)'
        ctx.beginPath()

        for (let x = 0; x < width; x++) {
          const factor = isPlaying ? 16 : 4
          const y = height / 2 + Math.sin(x * 0.04 + Date.now() * (isPlaying ? 0.003 : 0.0008)) * factor
          if (x === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()
      }
    }

    render()

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [isPlaying])

  return (
    <div className={`relative rounded-2xl bg-slate-950/80 border border-cyan-500/20 overflow-hidden p-5 flex flex-col justify-between ${className}`}>
      
      {/* Top Telemetry Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cyan-500/10 pb-3 z-10">
        <div>
          <div className="flex items-center space-x-2">
            <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'}`} />
            <span className="font-mono text-[10px] text-cyan-400 tracking-widest uppercase">
              ORBITAL SONIC SPECTROGRAM
            </span>
            <span className="text-slate-600">/</span>
            <span className="font-mono text-[10px] text-slate-400">{satellite}</span>
          </div>
          <h4 className="text-sm font-bold text-slate-100 tracking-wide mt-0.5">{trackTitle}</h4>
        </div>

        <div className="flex items-center space-x-3 font-mono text-[10px] text-slate-400">
          <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">{coordinates}</span>
          <span className="text-cyan-300 font-medium">{sampleRate}</span>
        </div>
      </div>

      {/* Real-time Oscilloscope Canvas */}
      <div 
        role="img"
        aria-label={`Real-time audio waveform oscilloscope for ${trackTitle}. Playback status: ${isPlaying ? 'Actively synthesizing' : 'Paused'}. Coordinates: ${coordinates}.`}
        className="relative h-36 md:h-44 w-full flex items-center justify-center my-3 telemetry-grid rounded-xl overflow-hidden bg-slate-950/70 border border-slate-800/80"
      >
        <span className="sr-only">
          Live acoustic waveform and frequency spectrum for {trackTitle}. Coordinates: {coordinates}. Current time: {currentTime} of {duration}.
        </span>
        <canvas
          ref={canvasRef}
          width={640}
          height={160}
          className="w-full h-full block"
          aria-hidden="true"
        />
      </div>

      {/* Bottom Telemetry Footer */}
      <div className="flex items-center justify-between font-mono text-[11px] text-slate-400 border-t border-cyan-500/10 pt-3 z-10">
        <div className="flex items-center space-x-4">
          <span className="text-cyan-400">{bitDepth}</span>
          <span>•</span>
          <span>WEBAUDIO ACCELERATED</span>
        </div>

        <div className="flex items-center space-x-2 text-slate-300">
          <span className="text-cyan-300 font-bold">{currentTime}</span>
          <span className="text-slate-600">/</span>
          <span>{duration}</span>
        </div>
      </div>

    </div>
  )
}
