import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Radio, Globe, Layers, Sparkles, Terminal, Sliders, Moon } from 'lucide-react'
import Badge from '../common/Badge'
import Button from '../common/Button'

/**
 * NASA Mission Command & Audio Navigation Header
 */
export default function Header({
  activeView = 'jukebox',
  onViewChange,
  onToggleInspector,
  isInspectorOpen = false,
}) {
  const [utcTime, setUtcTime] = useState('')

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setUtcTime(now.toUTCString().replace('GMT', 'UTC'))
    }
    updateTime()
    const timer = setInterval(updateTime, 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-cyan-500/15 backdrop-blur-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Mission Badge */}
        <div className="flex items-center space-x-3.5">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-700 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-cyan-500/30 border border-cyan-300/40">
              <Globe className="w-5 h-5 text-slate-950" />
            </div>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-950 animate-ping" />
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <span className="text-base font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 via-sky-200 to-emerald-300 bg-clip-text text-transparent">
                EARTH JUKEBOX
              </span>
              <span className="hidden sm:inline-block font-mono text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 uppercase tracking-wider">
                SPACE APPS 2026
              </span>
            </div>
            <p className="hidden md:block font-mono text-[10px] text-slate-400 tracking-wider">
              ORBITAL SONIFICATION CONSOLE
            </p>
          </div>
        </div>

        {/* Center Live Telemetry / Clock */}
        <div className="hidden lg:flex items-center space-x-4 bg-slate-950/60 px-4 py-1.5 rounded-xl border border-cyan-500/15 font-mono text-xs">
          <div className="flex items-center space-x-1.5 text-cyan-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-[10px] uppercase tracking-wider text-slate-400">TELEMETRY:</span>
            <span className="text-emerald-400 font-bold">ONLINE</span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="text-slate-300 text-[11px] tracking-wider">
            {utcTime || "CALCULATING ORBIT..."}
          </div>
        </div>

        {/* Right Action Tools */}
        <div className="flex items-center space-x-2.5">
          {/* Mode Switcher Tabs */}
          <div className="hidden sm:flex bg-slate-950/70 p-1 rounded-xl border border-cyan-500/15">
            <button
              onClick={() => onViewChange && onViewChange('jukebox')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeView === 'jukebox'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Soundscapes
            </button>
            <button
              onClick={() => onViewChange && onViewChange('orbit')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeView === 'orbit'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Orbit Matrix
            </button>
          </div>

          {/* Design System Inspector Trigger */}
          <Button
            variant={isInspectorOpen ? 'primary' : 'secondary'}
            size="sm"
            icon={Sliders}
            onClick={onToggleInspector}
          >
            <span className="hidden sm:inline">Design System</span>
            <span className="sm:hidden">DS</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
