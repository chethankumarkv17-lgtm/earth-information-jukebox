import React, { useRef, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Play, 
  Pause, 
  RotateCw, 
  Sliders, 
  Volume2, 
  Layers, 
  Share2, 
  Download, 
  Info, 
  Globe2, 
  Compass, 
  Sparkles,
  Split,
  ChevronRight,
  Maximize2
} from 'lucide-react'
import globalSonificationEngine from '../../services/sonificationEngine'
import { useAccessibility } from '../../context/AccessibilityContext'

/**
 * ESA "Climate from Space" Dual-Globe Comparative Experience
 * Directly inspired by Image 2 (ESA Climate from Space dual-globe interface)
 * 
 * Features:
 * 1. Side-by-side synchronized 3D Canvas Earth Globes:
 *    - Left Globe: Land Cover / Biosphere (with vertical calibrated color legend on left)
 *    - Right Globe: Ocean Colour / Hydrosphere (with vertical calibrated color legend on right)
 * 2. Bottom Synchronized Dual Timeline Scrubber (exact match to Image 2):
 *    - Dual scrubber tracks, playback play/pause, timecodes ("Januar 2015" to 2024)
 * 3. Real-time A/B Sonification Crossfader:
 *    - Blends terrestrial modal harmonics with pelagic sub-bass drone
 */
export default function DualGlobeClimateView() {
  const leftCanvasRef = useRef(null)
  const rightCanvasRef = useRef(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [timelineYear, setTimelineYear] = useState(2015)
  const [timelineMonth, setTimelineMonth] = useState('Januar')
  const [crossfadeRatio, setCrossfadeRatio] = useState(0.5) // 0.0 (Land) to 1.0 (Ocean)
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0)
  const [is3DMode, setIs3DMode] = useState(true)

  const { playEarcon, announce } = useAccessibility()

  // Timeline years available for decadal climate progression
  const years = [1980, 1985, 1990, 1995, 2000, 2005, 2010, 2015, 2020, 2024]

  // Playback timer for animated timeline
  useEffect(() => {
    let interval
    if (isPlaying) {
      interval = setInterval(() => {
        setTimelineYear(prev => {
          const next = prev >= 2024 ? 1980 : prev + 1
          return next
        })
      }, 1500 / playbackSpeed)
    }
    return () => clearInterval(interval)
  }, [isPlaying, playbackSpeed])

  // Toggle Play / Pause with procedural audio
  const handleTogglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false)
      globalSonificationEngine.pause()
      playEarcon('pause_tone')
    } else {
      setIsPlaying(true)
      globalSonificationEngine.play()
      playEarcon('play_chime')
      announce(`Playing synchronized climate comparison at ${playbackSpeed}x speed`)
    }
  }

  // Crossfader adjustment
  const handleCrossfadeChange = (e) => {
    const val = parseFloat(e.target.value)
    setCrossfadeRatio(val)
    if (globalSonificationEngine) {
      globalSonificationEngine.updateSettings({
        stereoPan: (val - 0.5) * 1.6, // -0.8 left (Land) to +0.8 right (Ocean)
        style: val < 0.4 ? 'ambient_earth' : val > 0.6 ? 'ocean_waves' : 'atmospheric',
      })
    }
  }

  // Render Dual 3D Globes on Canvas
  useEffect(() => {
    const leftCanvas = leftCanvasRef.current
    const rightCanvas = rightCanvasRef.current
    if (!leftCanvas || !rightCanvas) return

    const leftCtx = leftCanvas.getContext('2d')
    const rightCtx = rightCanvas.getContext('2d')
    let animId
    let angle = 0

    const render = () => {
      angle += isPlaying ? 0.005 : 0.002

      const drawGlobe = (ctx, canvas, mode) => {
        const rect = canvas.getBoundingClientRect()
        canvas.width = rect.width * 1.5
        canvas.height = rect.height * 1.5
        ctx.scale(1.5, 1.5)

        const w = rect.width
        const h = rect.height
        const cx = w / 2
        const cy = h / 2
        const r = Math.min(w, h) * 0.42

        ctx.clearRect(0, 0, w, h)

        // 1. Atmosphere Halo
        const haloColor = mode === 'land' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(6, 182, 212, 0.3)'
        const halo = ctx.createRadialGradient(cx, cy, r * 0.9, cx, cy, r * 1.25)
        halo.addColorStop(0, haloColor)
        halo.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.fillStyle = halo
        ctx.beginPath()
        ctx.arc(cx, cy, r * 1.25, 0, Math.PI * 2)
        ctx.fill()

        // 2. Base Sphere
        const baseColor = mode === 'land' ? '#061a14' : '#041628'
        ctx.fillStyle = baseColor
        ctx.beginPath()
        ctx.arc(cx, cy, r, 0, Math.PI * 2)
        ctx.fill()

        // 3. Orthographic Continents with Specialized Climate Shaders
        ctx.save()
        ctx.beginPath()
        ctx.arc(cx, cy, r, 0, Math.PI * 2)
        ctx.clip()

        // Polygons for Africa & Eurasia
        const landPoly = [
          [-30, 20], [0, 10], [15, -15], [35, -5], [38, 15], [45, 25], [35, 35], [10, 45], [0, 35], [-20, 30]
        ]

        ctx.beginPath()
        let first = true
        landPoly.forEach(([lat, lon]) => {
          const phi = (lat * Math.PI) / 180
          const lambda = ((lon * Math.PI) / 180) + angle
          const cosC = Math.cos(phi) * Math.cos(lambda)
          if (cosC > -0.1) {
            const x = cx + r * Math.cos(phi) * Math.sin(lambda)
            const y = cy - r * Math.sin(phi)
            if (first) { ctx.moveTo(x, y); first = false }
            else { ctx.lineTo(x, y) }
          }
        })

        if (mode === 'land') {
          // Land Cover: Pale ochre desert + deep green canopy (Matches Image 2 Left Globe)
          const landGrad = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r)
          landGrad.addColorStop(0, '#fef08a') // Sahara Ochre
          landGrad.addColorStop(0.4, '#ca8a04') // Sahel Semiarid
          landGrad.addColorStop(0.7, '#15803d') // Congo Tropical Green
          landGrad.addColorStop(1, '#166534') // Deep Forest
          ctx.fillStyle = landGrad
        } else {
          // Ocean Colour: Chlorophyll-a blue/cyan wash (Matches Image 2 Right Globe)
          ctx.fillStyle = 'rgba(148, 163, 184, 0.65)' // Land is muted grey in ocean mode
        }
        ctx.fill()

        if (mode === 'ocean') {
          // Dynamic swirling plankton bloom waves in oceans
          const oceanWaveGrad = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r)
          oceanWaveGrad.addColorStop(0, '#0284c7') // Atlantic Cyan
          oceanWaveGrad.addColorStop(0.6, '#0369a1') // Subpolar Azure
          oceanWaveGrad.addColorStop(1, '#0c4a6e') // Deep Ocean
          ctx.fillStyle = oceanWaveGrad
          ctx.beginPath()
          ctx.arc(cx - 20, cy + 20, r * 0.7, 0, Math.PI * 2)
          ctx.fill()
        }

        // Day/Night Terminator
        const shadow = ctx.createLinearGradient(cx - r, cy, cx + r, cy)
        shadow.addColorStop(0, 'rgba(0,0,0,0)')
        shadow.addColorStop(0.6, 'rgba(0,0,0,0.1)')
        shadow.addColorStop(1, 'rgba(2, 6, 23, 0.85)')
        ctx.fillStyle = shadow
        ctx.beginPath()
        ctx.arc(cx, cy, r, 0, Math.PI * 2)
        ctx.fill()

        ctx.restore()
      }

      drawGlobe(leftCtx, leftCanvas, 'land')
      drawGlobe(rightCtx, rightCanvas, 'ocean')

      animId = requestAnimationFrame(render)
    }

    render()

    return () => cancelAnimationFrame(animId)
  }, [isPlaying])

  return (
    <div className="relative w-full min-h-[90vh] bg-[#070b12] text-slate-100 flex flex-col justify-between overflow-hidden select-none border border-cyan-500/20 rounded-2xl shadow-2xl">
      
      {/* ---------------------------------------------------------------------- */}
      {/* 1. TOP HEADER (Exact Match to Image 2: ESA Climate from Space) */}
      {/* ---------------------------------------------------------------------- */}
      <div className="relative z-20 w-full bg-slate-950/80 backdrop-blur-xl border-b border-cyan-500/20 px-6 py-3 flex items-center justify-between">
        
        {/* Left: ESA / NASA Climate from Space Branding */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="w-6 h-6 rounded bg-emerald-500/20 border border-emerald-400 text-emerald-400 font-mono text-xs flex items-center justify-center font-bold">
              ESA
            </span>
            <span className="font-bold text-sm tracking-wide text-slate-100">
              Climate from Space
            </span>
            <span className="text-slate-500 text-xs">|</span>
            <span className="font-mono text-xs text-cyan-400">
              DUAL-GLOBE COMPARATIVE MATRIX
            </span>
          </div>
        </div>

        {/* Right Menu: Stories, Data Layers, Share (Matches Image 2) */}
        <div className="flex items-center space-x-4 font-mono text-xs text-slate-300">
          <button className="flex items-center space-x-1 hover:text-cyan-300 transition-colors">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Geschichten / Stories</span>
          </button>
          <button className="flex items-center space-x-1 hover:text-cyan-300 transition-colors">
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span>Daten Layers</span>
          </button>
          <button className="hover:text-cyan-300 transition-colors p-1 rounded hover:bg-slate-800">
            <Share2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* 2. DUAL-GLOBE COMPARATIVE DISPLAY (Matches Image 2) */}
      {/* ---------------------------------------------------------------------- */}
      <div className="relative flex-1 w-full grid grid-cols-1 md:grid-cols-2 items-center justify-center gap-6 p-4">
        
        {/* LEFT GLOBE: Land Cover (with Vertical Legend Bar on the Left) */}
        <div className="relative flex flex-col items-center justify-center h-full">
          {/* Vertical Color Legend Bar (Matches Image 2 Left Legend) */}
          <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 flex items-center space-x-2 font-mono text-[10px]">
            <div className="w-2.5 h-48 rounded-full bg-gradient-to-b from-[#fef08a] via-[#ca8a04] via-[#15803d] to-[#14532d] border border-slate-700 shadow-lg" />
            <div className="flex flex-col justify-between h-48 text-slate-400 py-0.5">
              <span>Arid Sand</span>
              <span>Sahel Steppe</span>
              <span>Shrubland</span>
              <span>Canopy Green</span>
              <span>Rainforest</span>
            </div>
          </div>

          {/* Left Canvas Globe */}
          <canvas
            ref={leftCanvasRef}
            className="w-full max-w-[420px] aspect-square"
          />

          {/* Left Globe Label (Matches Image 2) */}
          <div className="mt-2 font-mono text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
            <span>Land Cover</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          </div>
        </div>

        {/* RIGHT GLOBE: Ocean Colour (with Vertical Legend Bar on the Right) */}
        <div className="relative flex flex-col items-center justify-center h-full">
          {/* Right Canvas Globe */}
          <canvas
            ref={rightCanvasRef}
            className="w-full max-w-[420px] aspect-square"
          />

          {/* Vertical Color Legend Bar (Matches Image 2 Right Legend with 30 mg/m³ to 0.03) */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10 flex items-center space-x-2 font-mono text-[10px]">
            <div className="flex flex-col justify-between h-48 text-slate-400 text-right py-0.5">
              <span>30 mg/m³</span>
              <span>3.0</span>
              <span>0.3</span>
              <span>0.03 mg/m³</span>
            </div>
            <div className="w-2.5 h-48 rounded-full bg-gradient-to-b from-[#a7f3d0] via-[#38bdf8] to-[#0c4a6e] border border-slate-700 shadow-lg" />
          </div>

          {/* Right Globe Label (Matches Image 2) */}
          <div className="mt-2 font-mono text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
            <span>Ocean Colour – Chlorophyll-a Concentration</span>
            <Info className="w-3.5 h-3.5 text-slate-400 cursor-pointer" />
          </div>
        </div>

      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* 3. DUAL SYNCHRONIZED TIMELINE SCRUBBER (Exact Match to Image 2) */}
      {/* ---------------------------------------------------------------------- */}
      <div className="relative z-20 w-full bg-slate-950/90 backdrop-blur-2xl border-t border-cyan-500/20 px-8 py-4 flex flex-col space-y-3">
        
        {/* Top Timecode Badge: "Januar 2015" */}
        <div className="flex items-center justify-center">
          <div className="font-mono text-xs font-bold text-cyan-300 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20">
            {timelineMonth} {timelineYear}
          </div>
        </div>

        {/* Dual Progress Bars & Transport (Matches Image 2 Timeline UI) */}
        <div className="flex items-center space-x-4 max-w-4xl mx-auto w-full">
          {/* Play/Pause Button */}
          <button
            onClick={handleTogglePlay}
            className="w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-400 text-cyan-300 flex items-center justify-center hover:scale-105 transition-transform shrink-0 shadow-lg shadow-cyan-500/20"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>

          {/* Dual Sliders Container */}
          <div className="flex-1 flex flex-col space-y-1.5">
            {/* Top Slider: Primary Decadal Timeline */}
            <input
              type="range"
              min="1980"
              max="2024"
              step="1"
              value={timelineYear}
              onChange={(e) => setTimelineYear(parseInt(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
            {/* Bottom Slider: Secondary Comparison Track */}
            <input
              type="range"
              min="1980"
              max="2024"
              step="1"
              value={timelineYear}
              onChange={(e) => setTimelineYear(parseInt(e.target.value))}
              className="w-full accent-emerald-400 cursor-pointer h-1 bg-slate-800/80 rounded-lg"
            />
          </div>

          {/* 2D / 3D & Download Buttons (Matches Image 2 right corner) */}
          <div className="flex items-center space-x-2 font-mono text-xs">
            <button
              onClick={() => setIs3DMode(!is3DMode)}
              className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-slate-300 hover:text-cyan-300 font-bold"
            >
              {is3DMode ? '2D' : '3D'}
            </button>
            <button className="p-1.5 rounded bg-slate-900 border border-slate-700 text-slate-300 hover:text-cyan-300">
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Real-time A/B Audio Crossfader Blend */}
        <div className="max-w-md mx-auto w-full pt-1 flex items-center justify-between font-mono text-[10px] text-slate-400 space-x-3">
          <span className="text-emerald-400 font-bold">100% LAND</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={crossfadeRatio}
            onChange={handleCrossfadeChange}
            className="flex-1 accent-sky-400 cursor-pointer h-1.5 bg-slate-800 rounded-full"
          />
          <span className="text-cyan-400 font-bold">100% OCEAN</span>
        </div>

      </div>

    </div>
  )
}
