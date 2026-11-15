import React from 'react'
import { motion } from 'framer-motion'
import { Play, Pause, Disc3, Radio, Compass, Waves } from 'lucide-react'
import Badge from '../common/Badge'

/**
 * Earth Observation Sonification Dataset / Track Card
 */
export default function EarthTrackCard({
  track,
  isPlaying = false,
  onPlayToggle,
  onSelect,
}) {
  const {
    id,
    title,
    region,
    coordinates,
    satellite,
    sensor,
    frequencyRange,
    duration,
    category, // 'biosphere' | 'hydrosphere' | 'atmosphere' | 'magnetosphere'
    spectralGradient,
  } = track

  const categoryBadge = {
    biosphere: { variant: 'emerald', label: 'BIOSPHERE' },
    hydrosphere: { variant: 'cyan', label: 'HYDROSPHERE' },
    atmosphere: { variant: 'sky', label: 'ATMOSPHERE' },
    magnetosphere: { variant: 'violet', label: 'MAGNETOSPHERE' },
    thermal: { variant: 'amber', label: 'THERMAL FLUX' },
  }[category] || { variant: 'cyan', label: 'EARTH DATA' }

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      className={`group relative rounded-2xl p-5 border transition-all duration-300 cursor-pointer overflow-hidden ${
        isPlaying
          ? 'bg-slate-900/90 border-cyan-400/50 shadow-[0_10px_35px_-5px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400/40'
          : 'bg-slate-900/50 hover:bg-slate-900/80 border-cyan-500/15 hover:border-cyan-400/35 shadow-lg shadow-black/30'
      }`}
      onClick={() => onSelect && onSelect(track)}
    >
      {/* Subtle spectral accent bar at top */}
      <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r ${spectralGradient || 'from-cyan-500 via-blue-500 to-emerald-400'}`} />

      {/* Top Meta Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Badge variant={categoryBadge.variant} size="sm" dot={isPlaying}>
            {categoryBadge.label}
          </Badge>
          <span className="font-mono text-[10px] text-slate-400">{satellite}</span>
        </div>

        <span className="font-mono text-[10px] text-cyan-400/80 bg-slate-950/60 px-2 py-0.5 rounded border border-cyan-500/10">
          {sensor}
        </span>
      </div>

      {/* Track Title & Geographic Region */}
      <div className="mb-4">
        <h4 className="text-base font-bold text-slate-100 group-hover:text-cyan-300 transition-colors line-clamp-1">
          {title}
        </h4>
        <p className="text-xs text-slate-400 flex items-center space-x-1.5 mt-0.5">
          <Compass className="w-3 h-3 text-cyan-400 shrink-0" />
          <span>{region}</span>
          <span className="text-slate-600">•</span>
          <span className="font-mono text-[10px]">{coordinates}</span>
        </p>
      </div>

      {/* Spectral Preview / Wave Simulation Strip */}
      <div className="h-10 w-full bg-slate-950/70 rounded-xl p-1.5 flex items-end justify-between gap-0.5 mb-4 border border-slate-800/80">
        {Array.from({ length: 24 }).map((_, i) => {
          const height = Math.max(15, Math.sin(i * 0.4) * 50 + 40 + (i % 3) * 10)
          return (
            <div
              key={i}
              className={`w-full rounded-t-sm transition-all duration-300 ${
                isPlaying
                  ? 'bg-gradient-to-t from-cyan-500 to-emerald-400 opacity-90'
                  : 'bg-slate-700/60 group-hover:bg-cyan-500/60'
              }`}
              style={{ height: `${height}%` }}
            />
          )
        })}
      </div>

      {/* Card Footer: Audio Telemetry & Play Button */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
        <div className="flex items-center space-x-2 text-[11px] font-mono text-slate-400">
          <Waves className="w-3.5 h-3.5 text-cyan-400" />
          <span>{frequencyRange}</span>
        </div>

        <div className="flex items-center space-x-3">
          <span className="font-mono text-xs text-slate-400">{duration}</span>
          
          <button
            onClick={(e) => {
              e.stopPropagation()
              onPlayToggle && onPlayToggle(track)
            }}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              isPlaying
                ? 'bg-cyan-400 text-slate-950 shadow-[0_0_12px_#22d3ee]'
                : 'bg-slate-800 hover:bg-cyan-500/20 text-slate-200 hover:text-cyan-300 border border-slate-700 hover:border-cyan-400/50'
            }`}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5" />
            )}
          </button>
        </div>
      </div>
    </motion.div>
  )
}
