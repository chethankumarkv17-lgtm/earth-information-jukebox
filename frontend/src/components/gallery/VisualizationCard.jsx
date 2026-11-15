import React from 'react'
import { motion } from 'framer-motion'
import { 
  Play, 
  Pause, 
  Info, 
  Satellite, 
  Waves, 
  CheckCircle2, 
  Sliders, 
  Compass, 
  ArrowRight,
  ExternalLink
} from 'lucide-react'
import Badge from '../common/Badge'
import Button from '../common/Button'
import VisualizationPreview from './VisualizationPreview'

/**
 * NASA Earth Visualization Card
 */
export default function VisualizationCard({
  visualization,
  isSelected = false,
  isPlaying = false,
  onSelect,
  onOpenDetails,
}) {
  const {
    id,
    title,
    subtitle,
    category,
    phenomenon,
    timeRange,
    measurementUnits,
    keyFinding,
    visualizationType,
    previewGradient,
    source,
    sonification,
    coordinates,
  } = visualization

  const categoryColor = {
    "Global Temperature": "amber",
    "Ocean Circulation": "cyan",
    "Ice Sheet Changes": "violet",
    "Atmospheric Carbon Dioxide": "amber",
    "Vegetation Changes": "emerald",
    "Natural Earth Processes": "live",
  }[category] || "cyan"

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className={`group relative rounded-2xl p-5 border flex flex-col justify-between transition-all duration-300 overflow-hidden ${
        isSelected
          ? 'bg-slate-900/95 border-cyan-400/50 shadow-[0_12px_40px_-5px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400/40'
          : 'bg-slate-900/50 hover:bg-slate-900/80 border-cyan-500/15 hover:border-cyan-400/35 shadow-lg shadow-black/30'
      }`}
    >
      {/* Top Accent Gradient Bar */}
      <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r ${previewGradient || 'from-cyan-500 to-blue-500'}`} />

      <div>
        {/* Top Badges & Mission Telemetry */}
        <div className="flex items-center justify-between mb-3 gap-2">
          <Badge variant={categoryColor} size="sm">
            {category}
          </Badge>

          <span className="font-mono text-[10px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 truncate max-w-[130px]">
            {source.svsId}
          </span>
        </div>

        {/* Authentic Phenomenon Diagram Preview */}
        <div className="mb-4 relative">
          <VisualizationPreview
            type={visualizationType}
            gradient={previewGradient}
          />

          {/* Active Soundwave Indicator if currently selected */}
          {isSelected && (
            <div className="absolute top-2.5 right-2.5 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-cyan-400/40 font-mono text-[9px] text-cyan-300 flex items-center space-x-1.5 shadow-md">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>ACTIVE AUDIO STREAM</span>
            </div>
          )}
        </div>

        {/* Title & Subtitle */}
        <div className="mb-3">
          <h3 className="text-base font-extrabold text-slate-100 group-hover:text-cyan-300 transition-colors line-clamp-2 leading-snug">
            {title}
          </h3>
          <p className="text-xs text-slate-400 mt-1 line-clamp-1 font-mono">
            {subtitle}
          </p>
        </div>

        {/* Satellite Sensor & Physical Unit Telemetry */}
        <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 font-mono text-[11px] space-y-1.5 mb-3">
          <div className="flex justify-between">
            <span className="text-slate-500">MISSION:</span>
            <span className="text-slate-200 font-bold truncate max-w-[150px]">{source.mission}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">INSTRUMENT:</span>
            <span className="text-cyan-300 truncate max-w-[150px]">{source.instrument}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">MEASUREMENT:</span>
            <span className="text-emerald-400 truncate max-w-[150px]">{measurementUnits}</span>
          </div>
        </div>

        {/* Key Observation Quote */}
        <p className="text-xs text-slate-300 line-clamp-2 mb-4 leading-relaxed italic border-l-2 border-cyan-500/40 pl-2.5">
          "{keyFinding}"
        </p>
      </div>

      {/* Card Footer: Source Attribution & Select Visualization Button */}
      <div className="pt-3 border-t border-slate-800/80 space-y-2.5">
        
        {/* Acoustic mapping preview */}
        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
          <span className="flex items-center space-x-1">
            <Waves className="w-3 h-3 text-cyan-400" />
            <span>FREQ: <strong className="text-slate-200">{sonification.baseFrequency}</strong></span>
          </span>
          <span className="text-emerald-400 uppercase">{sonification.waveform}</span>
        </div>

        {/* Buttons: Inspect Telemetry & Select Visualization */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <Button
            variant="secondary"
            size="sm"
            icon={Info}
            onClick={() => onOpenDetails(visualization)}
            className="text-xs w-full"
          >
            Telemetry Info
          </Button>

          <Button
            variant={isSelected ? 'biosphere' : 'primary'}
            size="sm"
            icon={isSelected ? CheckCircle2 : Play}
            onClick={() => onSelect(visualization)}
            className="text-xs w-full"
          >
            {isSelected ? "Selected" : "Select Visualization"}
          </Button>
        </div>

      </div>
    </motion.div>
  )
}
