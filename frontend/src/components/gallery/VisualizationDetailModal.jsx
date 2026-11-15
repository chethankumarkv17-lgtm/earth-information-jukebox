import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  Satellite, 
  Compass, 
  ExternalLink, 
  Volume2, 
  Cpu, 
  Sliders, 
  ShieldCheck, 
  Sparkles,
  Layers,
  Activity,
  Calendar,
  MapPin
} from 'lucide-react'
import Badge from '../common/Badge'
import Button from '../common/Button'
import VisualizationPreview from './VisualizationPreview'

/**
 * Detailed Information Modal for NASA Earth Visualizations
 */
export default function VisualizationDetailModal({
  visualization,
  isOpen,
  onClose,
  onSelectAndSonify,
  isSelected = false,
}) {
  if (!isOpen || !visualization) return null

  const {
    title,
    subtitle,
    category,
    phenomenon,
    timeRange,
    spatialResolution,
    measurementUnits,
    keyFinding,
    description,
    visualizationType,
    previewGradient,
    source,
    sonification,
    coordinates,
    tags,
  } = visualization

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="w-full max-w-4xl max-h-[92vh] glass-panel-elevated rounded-2xl flex flex-col overflow-hidden border border-cyan-400/30 shadow-2xl"
        >
          {/* Top Modal Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-500/20 bg-slate-950/60">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Satellite className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <Badge variant="cyan" size="sm">{category}</Badge>
                  <span className="font-mono text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    NASA SVS ID: {source.svsId}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-100 tracking-wide mt-0.5">
                  {title}
                </h3>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Content Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Visual Preview Banner & Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-7">
                <VisualizationPreview
                  type={visualizationType}
                  gradient={previewGradient}
                  className="h-52"
                />
              </div>

              <div className="md:col-span-5 space-y-2.5 font-mono text-xs">
                <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">TEMPORAL RANGE:</span>
                    <span className="text-slate-200 font-bold">{timeRange}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">RESOLUTION:</span>
                    <span className="text-emerald-400">{spatialResolution}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">MEASUREMENT:</span>
                    <span className="text-cyan-300 truncate max-w-[140px]">{measurementUnits}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">REGION:</span>
                    <span className="text-slate-200">{coordinates.name}</span>
                  </div>
                </div>

                {/* Key Finding Callout */}
                <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/20 text-[11px] leading-relaxed">
                  <span className="font-bold text-cyan-300 block mb-0.5">KEY OBSERVATIONAL FINDING:</span>
                  <p className="text-slate-300">{keyFinding}</p>
                </div>
              </div>
            </div>

            {/* Scientific Explanation */}
            <div>
              <h4 className="font-mono text-xs uppercase text-cyan-400 tracking-wider font-bold mb-2 flex items-center gap-1.5">
                <Activity className="w-4 h-4" />
                <span>SCIENTIFIC PHENOMENON & METHODOLOGY</span>
              </h4>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                {description}
              </p>
            </div>

            {/* Sonification Mapping Matrix */}
            <div className="space-y-3">
              <h4 className="font-mono text-xs uppercase text-emerald-400 tracking-wider font-bold flex items-center gap-1.5">
                <Sliders className="w-4 h-4" />
                <span>MATHEMATICAL SONIFICATION MAPPING RULES</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                  <span className="text-slate-500 text-[10px] uppercase block">ACOUSTIC PARAMETER ASSIGNMENT</span>
                  <p className="text-slate-200 text-[11px] leading-relaxed">
                    {sonification.parameterMapping}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-500">FREQUENCY BAND:</span>
                    <span className="text-cyan-400 font-bold">{sonification.baseFrequency}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-500">OSCILLATOR SHAPE:</span>
                    <span className="text-emerald-400 uppercase">{sonification.waveform}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-500">AUDIO FORMAT:</span>
                    <span className="text-slate-300">{sonification.sampleRate}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-500">TIMBRE:</span>
                    <span className="text-slate-300 truncate max-w-[150px]">{sonification.harmonicTimbre.split(' ')[0]} Harmonic</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Official Source Attribution */}
            <div className="space-y-2">
              <h4 className="font-mono text-xs uppercase text-slate-400 tracking-wider font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>OFFICIAL NASA SOURCE ATTRIBUTION</span>
              </h4>

              <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 font-mono text-xs space-y-2">
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                  <span className="text-slate-500">MISSION & INSTRUMENT:</span>
                  <span className="text-slate-200 font-bold">{source.mission} • {source.instrument}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                  <span className="text-slate-500">NASA CENTER:</span>
                  <span className="text-slate-300">{source.center}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                  <span className="text-slate-500">EIC TOPIC:</span>
                  <span className="text-cyan-300">{source.eicReference}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                  <span className="text-slate-500">DATASET IDENTIFIER:</span>
                  <span className="text-emerald-400">{source.datasetId}</span>
                </div>
              </div>
            </div>

            {/* Search Tags */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {tags.map((t) => (
                <span key={t} className="font-mono text-[9px] uppercase px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                  #{t}
                </span>
              ))}
            </div>

          </div>

          {/* Modal Footer Actions */}
          <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex flex-col sm:flex-row items-center justify-between gap-3">
            <a
              href={source.officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center space-x-1.5"
            >
              <span>Visit Official NASA Repository</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <Button variant="secondary" size="sm" onClick={onClose}>
                Close
              </Button>
              <Button
                variant={isSelected ? 'biosphere' : 'primary'}
                size="sm"
                icon={Volume2}
                onClick={() => {
                  onSelectAndSonify(visualization)
                  onClose()
                }}
              >
                {isSelected ? "Currently Playing" : "Select & Experience Soundscape"}
              </Button>
            </div>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  )
}
