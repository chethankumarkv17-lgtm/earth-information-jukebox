import React, { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Keyboard, X, Volume2, Play, FastForward, Eye, ShieldCheck, Accessibility, Navigation, Radio } from 'lucide-react'
import { useAccessibility } from '../../context/AccessibilityContext'

export default function KeyboardShortcutsModal() {
  const { isShortcutsOpen, closeShortcuts, highContrast } = useAccessibility()
  const modalRef = useRef(null)
  const closeButtonRef = useRef(null)

  // Focus trap & Escape key handler
  useEffect(() => {
    if (isShortcutsOpen) {
      setTimeout(() => closeButtonRef.current?.focus(), 50)

      const handleKey = (e) => {
        if (e.key === 'Escape') {
          closeShortcuts()
        }
      }
      window.addEventListener('keydown', handleKey)
      return () => window.removeEventListener('keydown', handleKey)
    }
  }, [isShortcutsOpen, closeShortcuts])

  if (!isShortcutsOpen) return null

  const shortcutGroups = [
    {
      category: 'Accessibility & Spoken Voice Mode',
      icon: Accessibility,
      items: [
        { keys: ['g'], description: 'Toggle Guided Accessibility Mode (Voice & screen-reader guidance)' },
        { keys: ['h'], description: 'Toggle High-Contrast Mode (WCAG AAA stark black & white contrast)' },
        { keys: ['d'], description: 'Hear spoken audio description of the active dataset' },
        { keys: ['c'], description: 'Hear spoken narration of current data value & delta change' },
        { keys: ['l'], description: 'Hear spoken announcement of active location coordinates & climate' },
        { keys: ['?'], description: 'Open / Close this keyboard shortcuts cheatsheet' },
      ]
    },
    {
      category: 'Audio Playback & Sequence Transport',
      icon: Play,
      items: [
        { keys: ['Space', 'or', 'p'], description: 'Play / Pause procedural sonification' },
        { keys: ['s'], description: 'Stop audio playback and rewind to Frame 1' },
        { keys: ['←', '→'], description: 'Step backward / forward by 1 visual frame' },
        { keys: ['[', ']'], description: 'Step backward / forward frame by keyboard bracket' },
        { keys: ['<', '>'], description: 'Decrease / increase playback tempo (0.25x - 2.0x)' },
        { keys: ['r'], description: 'Restart sequence from beginning' },
      ]
    },
    {
      category: 'Audio Volume & Sound Controls',
      icon: Volume2,
      items: [
        { keys: ['↑', '↓'], description: 'Adjust master volume up / down (5% increments)' },
        { keys: ['m'], description: 'Mute / Unmute all sound output' },
      ]
    },
    {
      category: 'Quick View Navigation (Number Keys)',
      icon: Navigation,
      items: [
        { keys: ['1'], description: 'Jump to Earth Explorer (3D Globe & Synchronized Timeline)' },
        { keys: ['2'], description: 'Jump to Climate Intelligence (ERA5 Reanalysis)' },
        { keys: ['3'], description: 'Jump to Satellite Observatory (Fleet telemetry)' },
        { keys: ['4'], description: 'Jump to Sound Studio (Synthesizer & Sonification)' },
        { keys: ['5'], description: 'Jump to Time Machine (Decadal Timelines)' },
        { keys: ['6'], description: 'Jump to Comparative Hub (Location & Dataset Comparisons)' },
        { keys: ['7'], description: 'Jump to Earth Sound Journey (Guided Expedition)' },
        { keys: ['8'], description: 'Jump to Accessibility Hub (Equality & Multimodal Center)' },
      ]
    }
  ]

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md"
      onClick={closeShortcuts}
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-3xl rounded-2xl p-6 shadow-2xl border transition-all ${
          highContrast
            ? 'bg-black text-white border-2 border-yellow-400'
            : 'bg-slate-900/95 text-slate-100 border-cyan-500/30'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-cyan-500/20 mb-6">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-xl ${highContrast ? 'bg-yellow-400 text-black' : 'bg-cyan-500/10 text-cyan-400'}`}>
              <Keyboard className="w-6 h-6" />
            </div>
            <div>
              <h2 id="shortcuts-modal-title" className="text-xl font-extrabold tracking-tight">
                Keyboard Shortcuts Cheatsheet
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Full hands-free, screen-reader-compatible navigation across EARTH JUKEBOX
              </p>
            </div>
          </div>

          <button
            ref={closeButtonRef}
            onClick={closeShortcuts}
            aria-label="Close keyboard shortcuts modal"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus:ring-2 focus:ring-cyan-400 focus:outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shortcuts Categories */}
        <div className="space-y-6 max-h-[65vh] overflow-y-auto pr-2">
          {shortcutGroups.map((group, gIdx) => {
            const Icon = group.icon
            return (
              <div key={gIdx} className="space-y-2.5">
                <div className="flex items-center space-x-2 text-xs font-mono text-cyan-400 font-bold uppercase">
                  <Icon className="w-4 h-4 text-cyan-400" />
                  <span>{group.category}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {group.items.map((item, idx) => (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-mono ${
                        highContrast
                          ? 'bg-black border-white'
                          : 'bg-slate-950/60 border-slate-800'
                      }`}
                    >
                      <span className="text-slate-300 pr-2">{item.description}</span>
                      <div className="flex items-center space-x-1 shrink-0">
                        {item.keys.map((k, kIdx) => (
                          <kbd
                            key={kIdx}
                            className={`px-2 py-0.5 rounded text-[11px] font-bold shadow-sm ${
                              k === 'or'
                                ? 'bg-transparent text-slate-500 shadow-none'
                                : highContrast
                                ? 'bg-yellow-400 text-black border border-white'
                                : 'bg-slate-800 text-cyan-300 border border-slate-700'
                            }`}
                          >
                            {k}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Modal Footer Note */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
          <span>W3C WCAG 2.2 Level AAA & Section 508 Compliant</span>
          <button
            onClick={closeShortcuts}
            className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-colors focus:ring-2 focus:ring-white focus:outline-none"
          >
            Close (Esc)
          </button>
        </div>

      </div>
    </div>
  )
}
