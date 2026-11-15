import React from 'react'
import { 
  Globe2, 
  Leaf, 
  Waves, 
  Wind, 
  Snowflake, 
  Zap, 
  Cpu, 
  HardDrive,
  SlidersHorizontal 
} from 'lucide-react'
import Badge from '../common/Badge'

/**
 * Pro-Audio × Scientific Layer Navigation Sidebar
 */
export default function Sidebar({
  selectedCategory = 'all',
  onSelectCategory,
  className = '',
}) {
  const categories = [
    { id: 'all', label: 'All Earth Spheres', icon: Globe2, count: 12 },
    { id: 'biosphere', label: 'Biosphere & NDVI', icon: Leaf, count: 4, badge: 'VEG' },
    { id: 'hydrosphere', label: 'Ocean & Currents', icon: Waves, count: 3, badge: 'SST' },
    { id: 'atmosphere', label: 'Atmosphere & Clouds', icon: Wind, count: 2, badge: 'AOD' },
    { id: 'cryosphere', label: 'Cryosphere & Ice', icon: Snowflake, count: 2, badge: 'ICE' },
    { id: 'magnetosphere', label: 'Magnetosphere', icon: Zap, count: 1, badge: 'MAG' },
  ]

  return (
    <aside className={`w-64 shrink-0 flex flex-col justify-between glass-panel rounded-2xl p-4 border border-cyan-500/15 ${className}`}>
      {/* Category Navigation */}
      <div>
        <div className="flex items-center justify-between px-2 mb-3">
          <span className="font-mono text-[10px] uppercase tracking-wider text-cyan-400/90 font-bold">
            OBSERVATIONAL LAYERS
          </span>
          <span className="font-mono text-[9px] text-slate-500">6 ACTIVE</span>
        </div>

        <nav className="space-y-1.5">
          {categories.map((cat) => {
            const Icon = cat.icon
            const isActive = selectedCategory === cat.id

            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory && onSelectCategory(cat.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 select-none ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/10 text-cyan-300 border border-cyan-400/30 shadow-md shadow-cyan-500/10'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50 border border-transparent'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{cat.label}</span>
                </div>

                <div className="flex items-center space-x-1.5">
                  {cat.badge && (
                    <span className="font-mono text-[8px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                      {cat.badge}
                    </span>
                  )}
                  <span className={`font-mono text-[10px] ${isActive ? 'text-cyan-400 font-bold' : 'text-slate-500'}`}>
                    {cat.count}
                  </span>
                </div>
              </button>
            )
          })}
        </nav>
      </div>

      {/* DSP & Hardware Telemetry readout dock */}
      <div className="mt-6 pt-4 border-t border-slate-800/80">
        <div className="flex items-center space-x-2 mb-2 px-2 text-[10px] font-mono text-slate-400">
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          <span>AUDIO ENGINE STATUS</span>
        </div>

        <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 font-mono text-[10px] space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-500">SAMPLE RATE</span>
            <span className="text-slate-200 font-medium">48.0 kHz</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">BUFFER / LATENCY</span>
            <span className="text-emerald-400 font-medium">128 smp / 2.7 ms</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">DSP LOAD</span>
            <span className="text-cyan-400 font-medium">14%</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
