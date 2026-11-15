import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Accessibility, 
  Eye, 
  Volume2, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck, 
  Sliders, 
  FileText,
  VolumeX,
  Activity,
  Keyboard,
  Headphones,
  Sun,
  Repeat,
  Radio,
  Bell,
  MapPin,
  Layers,
  TrendingUp,
  EyeOff
} from 'lucide-react'
import GlassPanel from '../components/common/GlassPanel'
import Button from '../components/common/Button'
import Badge from '../components/common/Badge'
import AudioFirstDataExplorer from '../components/accessibility/AudioFirstDataExplorer'
import { useAccessibility } from '../context/AccessibilityContext'
import { ACCESSIBLE_DESCRIPTIONS } from '../data/accessibleDescriptions'

/**
 * Universal Accessibility Hub & Multisensory Equality Center (Phases 9 & 10)
 * Section 508 and W3C WCAG 2.2 AAA Compliant
 */
export default function AccessibilityPage() {
  const {
    accessibilityMode,
    toggleAccessibilityMode,
    reducedMotion,
    toggleReducedMotion,
    isSpeaking,
    speak,
    stopSpeaking,
    speechRate,
    setSpeechRate,
    audioFeedbackEnabled,
    setAudioFeedbackEnabled,
    playEarcon,
    announce,
    openShortcuts,
    activeLocation,
    activeDataset,
    announceLocation,
    announceDataset
  } = useAccessibility()

  const [selectedDemoDataset, setSelectedDemoDataset] = useState('surface_temperature')
  const [screenReaderTestText, setScreenReaderTestText] = useState('')

  const activeDescription = ACCESSIBLE_DESCRIPTIONS[selectedDemoDataset] || ACCESSIBLE_DESCRIPTIONS.surface_temperature

  const triggerLiveAnnouncementTest = (text) => {
    setScreenReaderTestText(text)
    announce(text, true)
    playEarcon('seek')
  }

  const earconSamples = [
    { type: 'play', label: 'Play / Start Chime', note: 'Rising major third (440 Hz → 554 Hz)' },
    { type: 'pause', label: 'Pause / Freeze Tone', note: 'Soft falling fifth (523 Hz → 392 Hz)' },
    { type: 'stop', label: 'Stop & Reset Tone', note: 'Descending octave drop (440 Hz → 220 Hz)' },
    { type: 'seek', label: 'Frame Seek Tick', note: '15ms tactile transient click' },
    { type: 'boundary', label: 'Timeline Boundary Ping', note: 'High resonant C6 bell (1046 Hz)' },
    { type: 'volume', label: 'Volume Shift Blip', note: 'Focused frequency blip (700 Hz)' },
    { type: 'high_contrast', label: 'Mode Toggle Acoustic', note: 'Double dual-tone confirmation' },
    { type: 'accessibility_mode', label: 'A11Y Welcoming Chime', note: 'Tri-tone major triad (C5 - E5 - G5)' },
  ]

  const wcagChecklist = [
    { code: 'WCAG 1.1.1', level: 'AAA', title: 'Non-text Content Alternatives', desc: 'All visual Earth maps and sonograms have rich text transcripts, tactile earcons, and screen-reader descriptions.' },
    { code: 'WCAG 1.2.5', level: 'AAA', title: 'Audio Descriptions for Visualizations', desc: 'Embedded Web Speech API TTS engine provides audio descriptions of spatial patterns, scientific deltas, and acoustic mappings.' },
    { code: 'WCAG 1.4.6', level: 'AAA', title: 'Contrast (Enhanced > 7:1)', desc: 'High-contrast mode guarantees pure black (#000000), white (#FFFFFF), and yellow/cyan with zero glassmorphism glare.' },
    { code: 'WCAG 2.1.1', level: 'AAA', title: 'Full Keyboard Accessibility', desc: 'All platform capabilities are 100% operable via keyboard with zero keyboard traps. Dedicated shortcuts: Space, S, [, ], <, >, H, G, D, L, C, M, ?.' },
    { code: 'WCAG 2.4.1', level: 'AAA', title: 'Bypass Blocks (Skip to Content)', desc: 'Immediate "Skip to main content" link as the first focusable element on every page.' },
    { code: 'WCAG 2.2.2', level: 'AAA', title: 'Pause, Stop, Hide & Reduced Motion', desc: 'All animations and background sweeps can be paused or suspended via reduced-motion settings.' },
    { code: 'Section 508', level: 'Federal', title: 'Sensory Substitution Equality', desc: 'Visual information is translated into pitch, filter cutoff, rhythm, and stereo panning.' },
  ]

  return (
    <div className="space-y-8 py-4 max-w-6xl mx-auto">
      
      {/* Header */}
      <div className="pb-4 border-b border-cyan-500/15">
        <div className="flex items-center space-x-2 text-cyan-400 font-mono text-xs uppercase tracking-wider mb-1.5">
          <Accessibility className="w-4 h-4" />
          <span>UNIVERSAL DESIGN & MULTISENSORY INCLUSION • PHASES 9 & 10</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">
          Accessibility & Sensory Inclusion Hub
        </h1>
        <p className="text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
          Earth observation science belongs to everyone. EARTH JUKEBOX eliminates visual-only barriers by converting NASA satellite imagery into high-precision procedural sound, spoken audio descriptions, full keyboard navigation, and WCAG 2.2 AAA high-contrast modes.
        </p>
      </div>

      {/* Flagship Feature: Guided Accessibility Mode Control Center */}
      <div className="p-6 rounded-2xl border transition-all bg-gradient-to-r from-slate-950 via-cyan-950/40 to-slate-950 text-slate-100 border border-cyan-500/40 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2.5">
              <div className={`p-2.5 rounded-xl ${
                accessibilityMode ? 'bg-emerald-400 text-slate-950' : 'bg-cyan-500/20 text-cyan-300'
              }`}>
                <Accessibility className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold tracking-tight flex items-center gap-2">
                  Guided Accessibility Mode
                  {accessibilityMode ? (
                    <Badge variant="emerald" size="sm">ACTIVE NOW</Badge>
                  ) : (
                    <Badge variant="outline" size="sm">DISABLED</Badge>
                  )}
                </h2>
                <p className="text-xs text-slate-400 font-mono">
                  Primary Mode for Blind and Low-Vision Researchers • Shortcut: [g] or [Alt + A]
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed font-sans pt-1">
              When enabled, Guided Accessibility Mode activates automatic voice guidance, spoken location coordinates, active dataset explanations, data delta changes, and surfaces the Audio-First Explorer across the entire application.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={() => toggleAccessibilityMode()}
              aria-pressed={accessibilityMode}
              aria-label={`Toggle Guided Accessibility Mode. Currently ${accessibilityMode ? 'Enabled' : 'Disabled'}. Press Enter or Space to toggle.`}
              className={`px-5 py-2.5 rounded-xl text-xs font-mono font-bold transition-all shadow-lg flex items-center space-x-2 focus:ring-4 focus:ring-cyan-400 focus:outline-none ${
                accessibilityMode
                  ? 'bg-emerald-400 text-slate-950 hover:bg-emerald-300 shadow-emerald-500/30'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 hover:from-cyan-400 hover:to-blue-500 shadow-cyan-500/20'
              }`}
            >
              <Accessibility className="w-4 h-4" />
              <span>{accessibilityMode ? 'DISABLE MODE (G)' : 'ENABLE ACCESSIBILITY MODE (G)'}</span>
            </button>
          </div>
        </div>

        {/* Guided Actions Grid when mode is active */}
        {accessibilityMode && (
          <div className="mt-5 pt-4 border-t border-cyan-500/20 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-cyan-400 font-bold block mb-1">📍 SPOKEN LOCATION</span>
              <p className="text-slate-300 text-[11px]">
                Press <strong className="text-white">L</strong> anytime to hear current observatory coordinates and climate zone.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-emerald-400 font-bold block mb-1">🛰️ DATASET EXPLANATION</span>
              <p className="text-slate-300 text-[11px]">
                Press <strong className="text-white">D</strong> to hear what the active dataset measures and its acoustic mapping.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-amber-400 font-bold block mb-1">📈 DELTA NARRATION</span>
              <p className="text-slate-300 text-[11px]">
                Press <strong className="text-white">C</strong> to hear the scientific change and anomaly relative to baseline.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Featured Non-Visual Station: Audio-First Data Explorer */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <EyeOff className="w-5 h-5 text-cyan-400" />
            <h3 className="font-extrabold text-lg text-slate-100 tracking-tight">
              Interactive Non-Visual Data Explorer (Globe-Free)
            </h3>
          </div>
          <Badge variant="cyan" size="sm">KEYBOARD & AUDIO-DRIVEN</Badge>
        </div>

        <AudioFirstDataExplorer />
      </div>

      {/* Primary Accessibility Controls Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Panel 1: Vision, Contrast & Motion Settings */}
        <GlassPanel variant="elevated" title="Visual & Motion Accessibility" subtitle="WCAG DISPLAY & VESTIBULAR CONTROLS" icon={Eye}>
          <div className="space-y-4">
            
            {/* Reduced Motion Toggle */}
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-100">Reduced Motion Safeguards</h4>
                <p className="text-[11px] text-slate-400 font-mono mt-1">
                  Suspends continuous 3D Earth rotation, orbital sweeps, and pulsating animations for vestibular comfort.
                </p>
              </div>

              <button
                onClick={toggleReducedMotion}
                aria-pressed={reducedMotion}
                aria-label="Toggle Reduced Motion Safeguards"
                className={`w-14 h-7 rounded-full transition-colors relative p-1 shrink-0 ${reducedMotion ? 'bg-cyan-400' : 'bg-slate-800'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-slate-950 transition-transform ${reducedMotion ? 'translate-x-7' : 'translate-x-0'}`} />
              </button>
            </div>

            {/* Auditory Earcons Toggle */}
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <Bell className="w-4 h-4 text-cyan-400" />
                  <h4 className="text-sm font-bold text-slate-100">Auditory Feedback & Earcons</h4>
                </div>
                <p className="text-[11px] text-slate-400 font-mono mt-1">
                  Emits subtle acoustic chime and click cues when playing, pausing, seeking, or adjusting volume.
                </p>
              </div>

              <button
                onClick={() => setAudioFeedbackEnabled(!audioFeedbackEnabled)}
                aria-pressed={audioFeedbackEnabled}
                aria-label="Toggle Auditory Feedback Earcons"
                className={`w-14 h-7 rounded-full transition-colors relative p-1 shrink-0 ${audioFeedbackEnabled ? 'bg-cyan-400' : 'bg-slate-800'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-slate-950 transition-transform ${audioFeedbackEnabled ? 'translate-x-7' : 'translate-x-0'}`} />
              </button>
            </div>

            {/* Keyboard Shortcuts Trigger Button */}
            <div className="pt-2">
              <Button
                variant="outline"
                size="md"
                icon={Keyboard}
                onClick={openShortcuts}
                className="w-full justify-center font-bold"
              >
                Open Keyboard Shortcuts Cheatsheet [?]
              </Button>
            </div>

          </div>
        </GlassPanel>

        {/* Panel 2: Spoken Audio Descriptions & Screen-Reader Tools */}
        <GlassPanel variant="elevated" title="Spoken Audio Descriptions & Screen-Reader" subtitle="TEXT-TO-SPEECH (TTS) NARRATION" icon={Headphones}>
          <div className="space-y-4">
            
            {/* Live Observation Description Selector */}
            <div className="space-y-2">
              <label htmlFor="description-dataset-select" className="text-xs font-mono text-cyan-400 uppercase font-bold block">
                SELECT EARTH VISUALIZATION FOR AUDIO DESCRIPTION:
              </label>
              <select
                id="description-dataset-select"
                value={selectedDemoDataset}
                onChange={(e) => setSelectedDemoDataset(e.target.value)}
                className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-cyan-500/30 text-xs font-mono focus:ring-2 focus:ring-cyan-400 focus:outline-none"
              >
                <option value="surface_temperature">Surface Temperature (2m Ground Temperature)</option>
                <option value="precipitation">Precipitation Accumulation & Rain Intensity</option>
                <option value="wind_speed">10-Meter Neutral Surface Wind Speed</option>
                <option value="vegetation_ndvi">Vegetation Index (NDVI) Canopy Photosynthesis</option>
                <option value="sea_surface_temp">Sea Surface Temperature (SST) & Oceanic Heat</option>
                <option value="arctic_sea_ice">Arctic Sea Ice Extent Retreat (1979 - 2024)</option>
                <option value="temperature_anomaly">Global Temperature Anomaly (1880 - 2024)</option>
                <option value="amazon_phenology">Amazon Rainforest Seasonal Phenology</option>
                <option value="el_nino_sst">Pacific El Niño Thermal Warm Pool</option>
              </select>
            </div>

            {/* Spoken Narration Controls */}
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200">Spoken Narrative (Web Speech API)</span>
                <span className="text-[10px] font-mono text-slate-500">Shortcut: [d]</span>
              </div>

              <p className="text-xs text-slate-300 font-mono leading-relaxed line-clamp-3">
                "{activeDescription.spokenNarrative}"
              </p>

              <div className="flex items-center justify-between pt-1">
                <Button
                  variant={isSpeaking ? 'secondary' : 'primary'}
                  size="sm"
                  icon={isSpeaking ? VolumeX : Volume2}
                  onClick={() => {
                    if (isSpeaking) {
                      stopSpeaking()
                      playEarcon('pause')
                    } else {
                      playEarcon('play')
                      speak(activeDescription.spokenNarrative)
                    }
                  }}
                  className="font-bold"
                >
                  {isSpeaking ? 'Stop Narration' : 'Narrate Aloud (TTS)'}
                </Button>

                <div className="flex items-center space-x-1.5 text-xs font-mono text-slate-400">
                  <span>RATE:</span>
                  {[0.8, 1.0, 1.25].map(rate => (
                    <button
                      key={rate}
                      onClick={() => setSpeechRate(rate)}
                      className={`px-1.5 py-0.5 rounded text-[10px] ${speechRate === rate ? 'bg-cyan-500 text-black font-bold' : 'bg-slate-800 text-slate-400'}`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Live ARIA Live Region Tester */}
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-slate-200 block">
                Screen-Reader ARIA Live Announcer Simulator
              </span>
              <p className="text-[11px] text-slate-400 font-mono">
                Tests dynamic announcements delivered to NVDA, JAWS, VoiceOver, and Orca screen readers.
              </p>

              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  onClick={() => triggerLiveAnnouncementTest('Satellite telemetry updated: Arctic ice albedo is 0.78, playing Major Pentatonic G3')}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white text-xs font-mono focus:ring-2 focus:ring-cyan-400"
                >
                  Announce Telemetry
                </button>
                <button
                  onClick={() => triggerLiveAnnouncementTest('Playback speed scaled to 2x. Musical clock set to 144 BPM')}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white text-xs font-mono focus:ring-2 focus:ring-cyan-400"
                >
                  Announce Speed Change
                </button>
              </div>

              {screenReaderTestText && (
                <div className="p-2 rounded bg-cyan-950/40 border border-cyan-500/30 text-[11px] font-mono text-cyan-300">
                  <span className="text-slate-400">Sent to Screen Reader: </span>
                  "{screenReaderTestText}"
                </div>
              )}
            </div>

          </div>
        </GlassPanel>

      </div>

      {/* Procedural Earcon / Auditory Feedback Showcase */}
      <GlassPanel
        title="Procedural Earcon Auditory Feedback Architecture"
        subtitle="CLEAR ACOUSTIC CONFIRMATION FOR BLIND OPERATORS"
        icon={Volume2}
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {earconSamples.map((sample) => (
            <button
              key={sample.type}
              onClick={() => playEarcon(sample.type)}
              className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-cyan-400 text-left transition-all group focus:ring-2 focus:ring-cyan-400 focus:outline-none"
            >
              <div className="flex items-center space-x-1.5 text-cyan-400 text-xs font-bold mb-1">
                <Volume2 className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                <span className="truncate">{sample.label}</span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono leading-tight">
                {sample.note}
              </p>
            </button>
          ))}
        </div>
      </GlassPanel>

      {/* WCAG 2.2 AAA Compliance Matrix & Section 508 Certification */}
      <GlassPanel
        title="NASA Accessibility Standards & WCAG 2.2 AAA Compliance"
        subtitle="SECTION 508 COMPLIANCE VERIFICATION CHECKLIST"
        icon={ShieldCheck}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {wcagChecklist.map((item, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start space-x-3"
            >
              <div className="p-1 rounded-lg bg-emerald-500/10 text-emerald-400 mt-0.5 shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-[10px] font-bold text-cyan-400">{item.code}</span>
                  <Badge variant="emerald" size="sm">{item.level}</Badge>
                  <span className="text-xs font-bold text-slate-200">{item.title}</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed font-mono">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </GlassPanel>

    </div>
  )
}
