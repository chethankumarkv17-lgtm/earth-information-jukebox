import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Volume2, 
  VolumeX, 
  FileText, 
  Eye, 
  Music, 
  TrendingUp, 
  CheckCircle2, 
  Headphones, 
  Sparkles,
  ChevronDown,
  ChevronUp,
  Sliders,
  ShieldCheck
} from 'lucide-react'
import { useAccessibility } from '../../context/AccessibilityContext'
import { ACCESSIBLE_DESCRIPTIONS } from '../../data/accessibleDescriptions'
import Button from '../common/Button'
import Badge from '../common/Badge'

export default function AudioDescriptionPanel({ sequenceId = 'arctic_sea_ice', className = '' }) {
  const { isSpeaking, speak, stopSpeaking, highContrast, speechRate, setSpeechRate, playEarcon } = useAccessibility()
  const [activeSection, setActiveSection] = useState('all') // 'all' | 'represents' | 'patterns' | 'sound' | 'timeline'
  const [isExpanded, setIsExpanded] = useState(false)

  const desc = ACCESSIBLE_DESCRIPTIONS[sequenceId] || ACCESSIBLE_DESCRIPTIONS.arctic_sea_ice

  const handleToggleSpeak = () => {
    if (isSpeaking) {
      stopSpeaking()
      playEarcon('pause')
    } else {
      playEarcon('play')
      speak(desc.spokenNarrative)
    }
  }

  return (
    <section
      aria-label="Accessible Earth Visualization Audio Description"
      className={`rounded-2xl border transition-all ${
        highContrast
          ? 'bg-black text-white border-2 border-cyan-400'
          : 'bg-slate-900/80 border-cyan-500/20 backdrop-blur-md text-slate-100'
      } ${className}`}
    >
      {/* Top Banner & Text-to-Speech Audio Description Trigger */}
      <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-cyan-500/10">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-xl ${highContrast ? 'bg-cyan-400 text-black' : 'bg-cyan-500/10 text-cyan-400'}`}>
            <Headphones className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-extrabold text-sm tracking-tight">
                Non-Visual Multimodal Description
              </h3>
              <Badge variant="emerald" size="sm">SCREEN-READER & TTS READY</Badge>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              Designed for blind, low-vision, and neurodivergent researchers • Section 508 Compliant
            </p>
          </div>
        </div>

        {/* Listen Action Button */}
        <div className="flex items-center space-x-2">
          <Button
            variant={isSpeaking ? 'secondary' : 'primary'}
            size="sm"
            icon={isSpeaking ? VolumeX : Volume2}
            onClick={handleToggleSpeak}
            className="font-bold"
            aria-pressed={isSpeaking}
            aria-label={isSpeaking ? "Stop spoken audio description" : "Listen to spoken audio description"}
          >
            {isSpeaking ? 'Stop Spoken Audio' : 'Play Audio Description (TTS)'}
          </Button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            aria-expanded={isExpanded}
            aria-label={isExpanded ? "Collapse detailed descriptions" : "Expand detailed descriptions"}
            className="p-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Spoken Narrative Transcript Box */}
      <div className="p-4 space-y-4">
        <div className={`p-3.5 rounded-xl border text-xs leading-relaxed font-mono ${
          highContrast
            ? 'bg-black border-white text-white'
            : 'bg-slate-950/70 border-slate-800 text-slate-200'
        }`}>
          <div className="flex items-center justify-between text-[10px] text-cyan-400 uppercase tracking-wider font-bold mb-1.5">
            <span className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              <span>SPOKEN NARRATIVE TRANSCRIPT:</span>
            </span>
            {isSpeaking && <span className="text-emerald-400 animate-pulse">● NARRATING LIVE</span>}
          </div>
          <p>{desc.spokenNarrative}</p>
        </div>

        {/* Detailed 4-Section Breakdown (Collapsible or Full View) */}
        {isExpanded && (
          <div className="space-y-4 pt-2 border-t border-slate-800">
            
            {/* Section 1: What the visualization represents */}
            <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/80 space-y-1.5">
              <div className="flex items-center space-x-2 text-xs font-mono font-bold text-cyan-400">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span>1. WHAT THE VISUALIZATION REPRESENTS:</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {desc.whatItRepresents}
              </p>
            </div>

            {/* Section 2: What patterns are visible */}
            <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/80 space-y-1.5">
              <div className="flex items-center space-x-2 text-xs font-mono font-bold text-emerald-400">
                <Eye className="w-4 h-4 text-emerald-400" />
                <span>2. WHAT PATTERNS ARE VISIBLE:</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {desc.patternsVisible}
              </p>
            </div>

            {/* Section 3: What the generated sound represents */}
            <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/80 space-y-1.5">
              <div className="flex items-center space-x-2 text-xs font-mono font-bold text-amber-400">
                <Music className="w-4 h-4 text-amber-400" />
                <span>3. WHAT THE GENERATED SOUND REPRESENTS:</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {desc.soundRepresentation}
              </p>
            </div>

            {/* Section 4: How the sound changes over time */}
            <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/80 space-y-1.5">
              <div className="flex items-center space-x-2 text-xs font-mono font-bold text-purple-400">
                <TrendingUp className="w-4 h-4 text-purple-400" />
                <span>4. HOW THE SOUND CHANGES OVER TIME:</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {desc.soundChangesOverTime}
              </p>
            </div>

            {/* Voice Speed Slider */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/80 border border-slate-800 text-xs font-mono text-slate-400">
              <span>NARRATION SPEECH RATE:</span>
              <div className="flex items-center space-x-2">
                {[0.8, 1.0, 1.25, 1.5].map((rate) => (
                  <button
                    key={rate}
                    onClick={() => setSpeechRate(rate)}
                    className={`px-2 py-0.5 rounded text-[10px] ${
                      speechRate === rate
                        ? 'bg-cyan-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>
    </section>
  )
}
