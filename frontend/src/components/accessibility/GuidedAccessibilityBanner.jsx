import React from 'react'
import { motion } from 'framer-motion'
import { 
  Accessibility, 
  MapPin, 
  Compass, 
  Layers, 
  TrendingUp, 
  Volume2, 
  VolumeX, 
  Keyboard, 
  X, 
  HelpCircle,
  Eye,
  Headphones,
  Music,
  Info
} from 'lucide-react'
import { useAccessibility } from '../../context/AccessibilityContext'
import Button from '../common/Button'
import Badge from '../common/Badge'

export default function GuidedAccessibilityBanner() {
  const {
    accessibilityMode,
    toggleAccessibilityMode,
    highContrast,
    activeLocation,
    activeDataset,
    currentObservation,
    speak,
    stopSpeaking,
    isSpeaking,
    openShortcuts,
    announceLocation,
    announceDataset
  } = useAccessibility()

  if (!accessibilityMode) return null

  const handleReadCurrentGuidance = () => {
    const locText = activeLocation ? `${activeLocation.name}` : 'Global observation'
    const dsText = activeDataset ? `${activeDataset.name}` : 'Surface Temperature'
    const obsText = currentObservation ? `Current value is ${currentObservation.value} ${currentObservation.unit || 'units'}.` : ''
    const guidance = `Accessibility Mode is active. Current location: ${locText}. Active dataset: ${dsText}. ${obsText} Use Tab to navigate between interactive controls, Spacebar to play or pause sonification, Left and Right arrow keys or square brackets to step through timestamps, and keys 1 through 6 to jump between sections.`
    speak(guidance)
  }

  return (
    <aside
      role="region"
      aria-label="Guided Accessibility Mode Active Status and Quick Controls"
      className={`w-full border-b transition-all ${
        highContrast
          ? 'bg-black text-white border-b-4 border-yellow-400'
          : 'bg-gradient-to-r from-slate-950 via-cyan-950/40 to-slate-950 text-slate-100 border-b border-cyan-500/40 shadow-xl'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          
          {/* Left: Mode Badge & Active Context Readout */}
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-xl flex items-center justify-center shrink-0 ${
              highContrast ? 'bg-yellow-400 text-black font-extrabold' : 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40'
            }`}>
              <Accessibility className="w-5 h-5" />
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xs tracking-wider uppercase bg-cyan-400/10 text-cyan-300 px-2 py-0.5 rounded border border-cyan-400/30">
                  GUIDED ACCESSIBILITY MODE ACTIVE
                </span>
                <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                  (Screen-Reader & Keyboard Guided)
                </span>
              </div>

              {/* Location & Dataset context */}
              <div className="flex flex-wrap items-center gap-2 mt-1 text-xs font-mono">
                {activeLocation && (
                  <button
                    onClick={() => announceLocation(activeLocation)}
                    aria-label={`Current Location: ${activeLocation.name}. Press to hear coordinates and climate profile.`}
                    className="flex items-center space-x-1 text-cyan-300 hover:text-white underline underline-offset-2 decoration-cyan-500 focus:ring-2 focus:ring-cyan-400 focus:outline-none rounded px-1"
                  >
                    <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{activeLocation.name}</span>
                  </button>
                )}

                <span className="text-slate-500">•</span>

                {activeDataset && (
                  <button
                    onClick={() => announceDataset(activeDataset)}
                    aria-label={`Current Dataset: ${activeDataset.name}. Press to hear sensor provenance and units.`}
                    className="flex items-center space-x-1 text-emerald-300 hover:text-white underline underline-offset-2 decoration-emerald-500 focus:ring-2 focus:ring-emerald-400 focus:outline-none rounded px-1"
                  >
                    <Layers className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{activeDataset.name} ({activeDataset.units || '°C'})</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right: Spoken Guidance, Shortcuts Cheatsheet, Exit Mode */}
          <div className="flex items-center flex-wrap gap-2">
            
            {/* Read Page Guidance Aloud */}
            <button
              onClick={handleReadCurrentGuidance}
              aria-label={isSpeaking ? "Stop spoken guidance" : "Listen to spoken page guidance and keyboard instructions"}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center space-x-1.5 border transition-all focus:ring-2 focus:ring-cyan-400 focus:outline-none ${
                highContrast
                  ? 'bg-yellow-400 text-black border-white'
                  : 'bg-cyan-500/20 text-cyan-200 border-cyan-400/40 hover:bg-cyan-500/30'
              }`}
            >
              <Headphones className="w-3.5 h-3.5" />
              <span>{isSpeaking ? 'STOP VOICE' : 'READ GUIDANCE (G)'}</span>
            </button>

            {/* Keyboard Shortcuts Trigger */}
            <button
              onClick={openShortcuts}
              aria-label="View keyboard shortcuts guide [Shortcut: ?]"
              className="px-2.5 py-1.5 rounded-lg text-xs font-mono text-slate-300 hover:text-white bg-slate-900/90 border border-slate-700 hover:border-cyan-500/50 flex items-center space-x-1 focus:ring-2 focus:ring-cyan-400 focus:outline-none"
            >
              <Keyboard className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">SHORTCUTS (?)</span>
            </button>

            {/* Exit Accessibility Mode */}
            <button
              onClick={() => toggleAccessibilityMode(false)}
              aria-label="Turn off Accessibility Mode"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 transition-colors focus:ring-2 focus:ring-rose-400 focus:outline-none"
              title="Turn off Accessibility Mode"
            >
              <X className="w-4 h-4" />
            </button>

          </div>

        </div>
      </div>
    </aside>
  )
}
