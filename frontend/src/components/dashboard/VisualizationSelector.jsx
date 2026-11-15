import React from 'react'
import { motion } from 'framer-motion'
import { Play, Volume2, Satellite, CheckCircle2, Waves, Eye } from 'lucide-react'
import Badge from '../common/Badge'

/**
 * Visualization Selection Panel for Dashboard
 * Fast switcher between active satellite visualizations & sonification streams
 */
export default function VisualizationSelector({
  datasets,
  activeDataset,
  onSelectDataset,
  isPlaying,
}) {
  return (
    <div className="glass-panel p-4 rounded-2xl border border-cyan-500/15">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center space-x-2">
          <Eye className="w-4 h-4 text-cyan-400" />
          <h4 className="font-mono text-xs uppercase tracking-wider text-slate-100 font-bold">
            VISUALIZATION SELECTION MATRIX
          </h4>
        </div>
        <span className="font-mono text-[10px] text-slate-400">
          SELECT STREAM TO ENGAGE SONIFICATION
        </span>
      </div>

      {/* Horizontal Scrollable Carousel / Grid of Datasets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {datasets.map((item) => {
          const isSelected = activeDataset?.id === item.id

          return (
            <motion.button
              key={item.id}
              whileHover={{ y: -2 }}
              onClick={() => onSelectDataset(item)}
              className={`p-3 rounded-xl text-left transition-all duration-200 border flex flex-col justify-between select-none relative overflow-hidden ${
                isSelected
                  ? 'bg-slate-900/95 border-cyan-400/50 shadow-md shadow-cyan-500/20 ring-1 ring-cyan-400/40'
                  : 'bg-slate-950/60 hover:bg-slate-900/80 border-slate-800/90 hover:border-cyan-500/30'
              }`}
            >
              {/* Top Accent Strip */}
              <div className={`absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r ${item.spectralGradient || 'from-cyan-400 to-blue-500'}`} />

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-cyan-300 font-bold truncate max-w-[90px]">
                    {item.satellite}
                  </span>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  )}
                </div>

                <h5 className="text-xs font-bold text-slate-200 line-clamp-2 mb-1">
                  {item.title}
                </h5>

                <p className="font-mono text-[9px] text-slate-400 truncate mb-2">
                  {item.region}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono">
                <span className="text-emerald-400">{item.sensor.split(' ')[0]}</span>
                <span className="text-slate-400">{item.duration}</span>
              </div>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
