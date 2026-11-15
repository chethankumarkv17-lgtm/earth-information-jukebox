import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { ACCESSIBLE_DESCRIPTIONS } from '../data/accessibleDescriptions'

const AccessibilityContext = createContext(null)

/**
 * Procedural Earcon / Auditory Feedback Generator
 * Uses native Web Audio API to produce clear acoustic cues for actions,
 * allowing blind and low-vision users to confirm actions through sound.
 */
function createEarconAudio() {
  let ctx = null
  const getCtx = () => {
    if (!ctx || ctx.state === 'closed') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      if (AudioCtx) ctx = new AudioCtx()
    }
    if (ctx && ctx.state === 'suspended') {
      ctx.resume()
    }
    return ctx
  }

  return {
    playCue: (type = 'click') => {
      try {
        const audio = getCtx()
        if (!audio) return
        const now = audio.currentTime

        const osc = audio.createOscillator()
        const gain = audio.createGain()
        osc.connect(gain)
        gain.connect(audio.destination)

        if (type === 'play') {
          // Rising major third chime (440 Hz -> 554.37 Hz)
          osc.type = 'sine'
          osc.frequency.setValueAtTime(440, now)
          osc.frequency.exponentialRampToValueAtTime(554.37, now + 0.12)
          gain.gain.setValueAtTime(0.001, now)
          gain.gain.linearRampToValueAtTime(0.12, now + 0.02)
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28)
          osc.start(now)
          osc.stop(now + 0.3)
        } else if (type === 'pause') {
          // Falling soft tone (523.25 Hz -> 392 Hz)
          osc.type = 'sine'
          osc.frequency.setValueAtTime(523.25, now)
          osc.frequency.exponentialRampToValueAtTime(392, now + 0.14)
          gain.gain.setValueAtTime(0.001, now)
          gain.gain.linearRampToValueAtTime(0.10, now + 0.02)
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25)
          osc.start(now)
          osc.stop(now + 0.27)
        } else if (type === 'stop') {
          // Double descending drop (440 Hz -> 220 Hz)
          osc.type = 'triangle'
          osc.frequency.setValueAtTime(440, now)
          osc.frequency.exponentialRampToValueAtTime(220, now + 0.15)
          gain.gain.setValueAtTime(0.09, now)
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18)
          osc.start(now)
          osc.stop(now + 0.2)
        } else if (type === 'seek') {
          // Crisp subtle micro-click
          osc.type = 'triangle'
          osc.frequency.setValueAtTime(880, now)
          gain.gain.setValueAtTime(0.08, now)
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04)
          osc.start(now)
          osc.stop(now + 0.05)
        } else if (type === 'boundary') {
          // Resonant boundary ping (C6 1046.5 Hz)
          osc.type = 'sine'
          osc.frequency.setValueAtTime(1046.5, now)
          gain.gain.setValueAtTime(0.001, now)
          gain.gain.linearRampToValueAtTime(0.12, now + 0.01)
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35)
          osc.start(now)
          osc.stop(now + 0.38)
        } else if (type === 'volume') {
          // High tactile blip
          osc.type = 'sine'
          osc.frequency.setValueAtTime(700, now)
          gain.gain.setValueAtTime(0.06, now)
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06)
          osc.start(now)
          osc.stop(now + 0.07)
        } else if (type === 'high_contrast') {
          // Double confirmation blip
          osc.type = 'triangle'
          osc.frequency.setValueAtTime(600, now)
          osc.frequency.setValueAtTime(900, now + 0.08)
          gain.gain.setValueAtTime(0.08, now)
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18)
          osc.start(now)
          osc.stop(now + 0.2)
        } else if (type === 'accessibility_mode') {
          // Tri-tone harmonic welcoming chime (Major chord: C5 - E5 - G5)
          osc.type = 'sine'
          osc.frequency.setValueAtTime(523.25, now)
          osc.frequency.setValueAtTime(659.25, now + 0.08)
          osc.frequency.setValueAtTime(783.99, now + 0.16)
          gain.gain.setValueAtTime(0.001, now)
          gain.gain.linearRampToValueAtTime(0.14, now + 0.02)
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.38)
          osc.start(now)
          osc.stop(now + 0.4)
        }
      } catch (err) {
        // AudioContext not available or blocked
      }
    }
  }
}

const earconEngine = createEarconAudio()

export function AccessibilityProvider({ children }) {
  // 1. Accessibility Mode (Dedicated guided experience for blind and low-vision users)
  const [accessibilityMode, setAccessibilityMode] = useState(() => {
    try {
      const saved = localStorage.getItem('earth_jukebox_accessibility_mode')
      return saved === 'true'
    } catch (e) {
      return false
    }
  })

  // 2. High-Contrast Mode (Feature Removed)
  const [highContrast, setHighContrast] = useState(false)

  // 3. Reduced Motion
  const [reducedMotion, setReducedMotion] = useState(() => {
    try {
      const saved = localStorage.getItem('earth_jukebox_reduced_motion')
      if (saved !== null) return saved === 'true'
      return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    } catch (e) {
      return false
    }
  })

  // 4. Audio Descriptions & Text-to-Speech (TTS)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [speechRate, setSpeechRate] = useState(1.0)
  const [speechVolume, setSpeechVolume] = useState(1.0)
  const [audioFeedbackEnabled, setAudioFeedbackEnabled] = useState(true)

  // 5. Active Location, Dataset & Scientific Telemetry
  const [activeLocation, setActiveLocation] = useState({
    id: 'amazon_basin',
    name: 'Amazon Basin Rainforest',
    lat: -3.1,
    lon: -60.0,
    coordinatesText: "03°06'S 60°00'W",
    biome: 'Tropical Evergreen Rainforest',
    climate: 'Equatorial Monsoon (Af)'
  })

  const [activeDataset, setActiveDataset] = useState({
    id: 'surface_temperature',
    name: 'Land & Atmospheric Surface Temperature (2m)',
    units: '°C',
    mission: 'NASA MERRA-2 Reanalysis'
  })

  const [currentObservation, setCurrentObservation] = useState(null)

  // 6. Screen-Reader ARIA Live Announcements
  const [politeAnnouncement, setPoliteAnnouncement] = useState('')
  const [assertiveAnnouncement, setAssertiveAnnouncement] = useState('')

  // 7. Keyboard Shortcuts Modal
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false)

  // Sync accessibilityMode in localStorage
  useEffect(() => {
    try {
      localStorage.setItem('earth_jukebox_accessibility_mode', accessibilityMode ? 'true' : 'false')
      if (accessibilityMode) {
        document.documentElement.classList.add('accessibility-mode')
      } else {
        document.documentElement.classList.remove('accessibility-mode')
      }
    } catch (e) {}
  }, [accessibilityMode])

  // Ensure high-contrast is removed from root DOM element
  useEffect(() => {
    try {
      document.documentElement.classList.remove('high-contrast')
      localStorage.removeItem('earth_jukebox_high_contrast')
    } catch (e) {}
  }, [])

  // Sync reduced-motion class on root DOM element
  useEffect(() => {
    try {
      if (reducedMotion) {
        document.documentElement.classList.add('reduce-motion')
        localStorage.setItem('earth_jukebox_reduced_motion', 'true')
      } else {
        document.documentElement.classList.remove('reduce-motion')
      }
    } catch (e) {}
  }, [reducedMotion])

  // ARIA Live Announce
  const announce = useCallback((message, assertive = false) => {
    if (!message) return
    if (assertive) {
      setAssertiveAnnouncement('')
      setTimeout(() => setAssertiveAnnouncement(message), 40)
    } else {
      setPoliteAnnouncement('')
      setTimeout(() => setPoliteAnnouncement(message), 40)
    }
  }, [])

  // Play auditory earcon cue
  const playEarcon = useCallback((type) => {
    if (!audioFeedbackEnabled) return
    earconEngine.playCue(type)
  }, [audioFeedbackEnabled])

  // Web Speech API Text-to-Speech Engine
  const speak = useCallback((text, onEnd = null) => {
    if (!text) return
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      announce(text, true)
      if (onEnd) onEnd()
      return
    }

    try {
      window.speechSynthesis.cancel() // Stop prior speech
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = speechRate
      utterance.volume = speechVolume

      // Try selecting an English natural voice
      const voices = window.speechSynthesis.getVoices()
      const naturalVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('David') || v.name.includes('Zira')))
      if (naturalVoice) utterance.voice = naturalVoice

      utterance.onstart = () => setIsSpeaking(true)
      utterance.onend = () => {
        setIsSpeaking(false)
        if (onEnd) onEnd()
      }
      utterance.onerror = () => setIsSpeaking(false)

      window.speechSynthesis.speak(utterance)
    } catch (err) {
      setIsSpeaking(false)
      announce(text, true)
    }
  }, [speechRate, speechVolume, announce])

  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    setIsSpeaking(false)
  }, [])

  // Toggle Accessibility Mode
  const toggleAccessibilityMode = useCallback((forcedState) => {
    setAccessibilityMode(prev => {
      const next = typeof forcedState === 'boolean' ? forcedState : !prev
      if (audioFeedbackEnabled) earconEngine.playCue('accessibility_mode')
      
      const announcement = next
        ? 'Guided Accessibility Mode enabled. Voice guidance, audio descriptions, keyboard navigation, and non-visual data explorer active. Press G to toggle off, Question Mark for shortcuts.'
        : 'Guided Accessibility Mode disabled.'
      
      announce(announcement, true)
      if (next) {
        speak(announcement)
      }
      return next
    })
  }, [audioFeedbackEnabled, announce, speak])

  // Toggle High Contrast (Feature Retired)
  const toggleHighContrast = useCallback(() => {
    // Feature disabled per user specification
  }, [])

  // Toggle Reduced Motion
  const toggleReducedMotion = useCallback(() => {
    setReducedMotion(prev => {
      const next = !prev
      announce(next ? 'Reduced motion enabled. Background and rotating animations suspended.' : 'Reduced motion disabled.')
      return next
    })
  }, [announce])

  // Announce Selected Location
  const announceLocation = useCallback((loc) => {
    if (!loc) return
    setActiveLocation(loc)
    const latStr = `${Math.abs(loc.lat).toFixed(1)} degrees ${loc.lat >= 0 ? 'North' : 'South'}`
    const lonStr = `${Math.abs(loc.lon).toFixed(1)} degrees ${loc.lon >= 0 ? 'East' : 'West'}`
    const text = `Selected location: ${loc.name}. Coordinates: ${latStr}, ${lonStr}. Biome: ${loc.biome || 'Terrestrial'}. Climate: ${loc.climate || 'Varied'}.`
    announce(text, true)
    if (accessibilityMode) {
      speak(text)
    }
    playEarcon('seek')
  }, [accessibilityMode, announce, speak, playEarcon])

  // Explain Active Dataset
  const announceDataset = useCallback((ds) => {
    if (!ds) return
    setActiveDataset(ds)
    const desc = ACCESSIBLE_DESCRIPTIONS[ds.id] || ACCESSIBLE_DESCRIPTIONS.surface_temperature
    const text = `Active dataset: ${ds.name || desc.title}. Sourced from ${ds.mission || desc.mission}. Native units: ${ds.units || desc.units}. ${desc.whatItRepresents}`
    announce(text, true)
    if (accessibilityMode) {
      speak(text)
    }
    playEarcon('seek')
  }, [accessibilityMode, announce, speak, playEarcon])

  // Describe Changes in the Data (Delta Narration)
  const announceDataChange = useCallback((prevVal, newVal, unit = '°C', label = 'measurement') => {
    if (newVal === null || newVal === undefined) return
    let text = ''
    if (prevVal === null || prevVal === undefined) {
      text = `Current ${label} is ${typeof newVal === 'number' ? newVal.toFixed(1) : newVal} ${unit}.`
    } else {
      const delta = newVal - prevVal
      const absDelta = Math.abs(delta).toFixed(1)
      if (Math.abs(delta) < 0.05) {
        text = `${label} held steady at ${newVal.toFixed(1)} ${unit}.`
      } else if (delta > 0) {
        text = `${label} increased by ${absDelta} to ${newVal.toFixed(1)} ${unit}.`
      } else {
        text = `${label} decreased by ${absDelta} to ${newVal.toFixed(1)} ${unit}.`
      }
    }
    announce(text, false)
    if (accessibilityMode) {
      speak(text)
    }
  }, [accessibilityMode, announce, speak])

  // Explain Relationship Between Data Values and Sound
  const announceSoundRelationship = useCallback((datasetId, value, pitchHz, timbreDesc) => {
    const desc = ACCESSIBLE_DESCRIPTIONS[datasetId] || ACCESSIBLE_DESCRIPTIONS.surface_temperature
    const text = `Sound translation for ${value}: Acoustic pitch is ${Math.round(pitchHz)} Hertz. ${timbreDesc || desc.soundRepresentation}`
    announce(text, true)
    speak(text)
  }, [announce, speak])

  // Haptic feedback (Vibration API for mobile/tablets where supported)
  const triggerHaptic = useCallback((pattern = 25) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(pattern)
      } catch (e) {}
    }
  }, [])

  return (
    <AccessibilityContext.Provider
      value={{
        // Accessibility Mode (Phase 10 Flagship)
        accessibilityMode,
        setAccessibilityMode,
        toggleAccessibilityMode,

        // High Contrast & Reduced Motion
        highContrast,
        toggleHighContrast,
        reducedMotion,
        toggleReducedMotion,

        // Text-to-Speech & Audio Descriptions
        isSpeaking,
        speak,
        stopSpeaking,
        speechRate,
        setSpeechRate,
        speechVolume,
        setSpeechVolume,

        // Auditory Cues & Earcons
        audioFeedbackEnabled,
        setAudioFeedbackEnabled,
        playEarcon,
        triggerHaptic,

        // Telemetry Context & Guided Announcements
        activeLocation,
        setActiveLocation,
        announceLocation,
        activeDataset,
        setActiveDataset,
        announceDataset,
        currentObservation,
        setCurrentObservation,
        announceDataChange,
        announceSoundRelationship,

        // ARIA Live Regions
        announce,

        // Keyboard Shortcuts Modal
        isShortcutsOpen,
        setIsShortcutsOpen,
        openShortcuts: () => setIsShortcutsOpen(true),
        closeShortcuts: () => setIsShortcutsOpen(false),
        toggleShortcuts: () => setIsShortcutsOpen(prev => !prev),
      }}
    >
      {/* Hidden ARIA Live Announcer Elements for Screen Readers */}
      <div
        id="aria-live-polite-region"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {politeAnnouncement}
      </div>

      <div
        id="aria-live-assertive-region"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      >
        {assertiveAnnouncement}
      </div>

      {children}
    </AccessibilityContext.Provider>
  )
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext)
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider')
  }
  return context
}
