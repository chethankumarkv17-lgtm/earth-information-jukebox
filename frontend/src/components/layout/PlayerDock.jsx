import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Play, 
  Pause, 
  Square,
  SkipBack, 
  SkipForward, 
  Repeat, 
  Volume2, 
  VolumeX, 
  Compass, 
  Headphones,
  Maximize2,
  Waves,
  FileText
} from 'lucide-react'
import AudioMeter from '../common/AudioMeter'
import globalSonificationEngine from '../../services/sonificationEngine'
import { useAccessibility } from '../../context/AccessibilityContext'
import { ACCESSIBLE_DESCRIPTIONS } from '../../data/accessibleDescriptions'

/**
 * Master Pro-Audio Transport & Earth Telemetry Dock
 * Connected to the Web Audio API Sonification Engine.
 */
export default function PlayerDock({
  currentTrack,
  isPlaying = false,
  onPlayToggle,
  onNext,
  onPrev,
  className = '',
}) {
  const { isSpeaking, speak, stopSpeaking, playEarcon, announce, highContrast } = useAccessibility()
  const [volume, setVolume] = useState(globalSonificationEngine.settings.volume || 80)
  const [isMuted, setIsMuted] = useState(false)
  const [spatialAudio, setSpatialAudio] = useState(true)
  const [isLooping, setIsLooping] = useState(true)
  const [currentTimeDisplay, setCurrentTimeDisplay] = useState("00:00")

  const track = currentTrack || {
    title: "Amazon Rainforest Canopy NDVI Resonance",
    region: "Amazon Basin, Brazil",
    coordinates: "03°08'40\"S 60°01'38\"W",
    satellite: "MODIS / TERRA",
    duration: "04:12",
    currentTime: "01:26",
    frequencyRange: "80 Hz - 3.8 kHz",
  }

  // Subscribe to engine tick for sample-accurate time
  useEffect(() => {
    const unsub = globalSonificationEngine.subscribe((event, data) => {
      if (event === 'tick' && data?.time !== undefined) {
        const mins = Math.floor(data.time / 60)
        const secs = Math.floor(data.time % 60)
        setCurrentTimeDisplay(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`)
      }
    })
    return () => unsub()
  }, [])

  // Sync engine when isPlaying changes
  const handleToggle = async () => {
    if (onPlayToggle) {
      onPlayToggle(track)
    } else {
      if (globalSonificationEngine.isPlaying) {
        globalSonificationEngine.pause()
      } else {
        if (track?.analysisData) {
          globalSonificationEngine.loadAnalysis(track.analysisData)
        }
        if (track?.suggestedStyle) {
          globalSonificationEngine.updateSettings({ style: track.suggestedStyle })
        }
        await globalSonificationEngine.play()
      }
    }
  }

  const handleVolumeChange = (newVol) => {
    setVolume(newVol)
    if (isMuted) setIsMuted(false)
    globalSonificationEngine.updateSettings({ volume: newVol })
  }

  const handleMuteToggle = () => {
    if (isMuted) {
      setIsMuted(false)
      globalSonificationEngine.updateSettings({ volume: volume || 80 })
    } else {
      setIsMuted(true)
      globalSonificationEngine.updateSettings({ volume: 0 })
    }
  }

  const isEngineActive = isPlaying || globalSonificationEngine.isPlaying

  return (
    <footer className={`fixed bottom-14 md:bottom-0 inset-x-0 z-40 glass-panel-elevated border-t border-cyan-500/20 backdrop-blur-2xl px-4 py-2.5 sm:px-6 shadow-2xl ${className}`}>
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* Left: Active Sonification Track Metadata */}
        <div className="flex items-center space-x-3.5 w-full md:w-1/4 min-w-[200px]">
          <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-600/30 to-blue-800/40 border border-cyan-400/30 flex items-center justify-center shrink-0 shadow-md">
            {isEngineActive && <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping absolute" />}
            <Compass className="w-5 h-5 text-cyan-300" />
          </div>

          <div className="overflow-hidden">
            <h4 className="text-sm font-bold text-slate-100 truncate tracking-wide">
              {track.title}
            </h4>
            <div className="flex items-center space-x-2 text-[11px] font-mono text-slate-400">
              <span className="text-cyan-400 font-bold">{track.satellite}</span>
              <span>•</span>
              <span className="truncate">{track.region}</span>
            </div>
          </div>
        </div>

        {/* Center: Audio Transport Controls & Timeline Scrub */}
        <div className="flex flex-col items-center w-full md:w-2/4 max-w-xl">
          <div className="flex items-center space-x-4 mb-1">
            <button
              onClick={() => setIsLooping(!isLooping)}
              className={`p-1.5 rounded-lg text-xs transition-colors ${isLooping ? 'text-cyan-400 bg-cyan-500/10' : 'text-slate-400 hover:text-white'}`}
              title="Continuous Audio Loop"
            >
              <Repeat className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                if (onPrev) onPrev()
                if (globalSonificationEngine.isPlaying) {
                  globalSonificationEngine.stop()
                  globalSonificationEngine.play()
                }
              }}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-lg transition-colors cursor-pointer"
              title="Previous Spectrum"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            {/* Main Play/Pause Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                playEarcon(isEngineActive ? 'pause' : 'play')
                announce(isEngineActive ? 'Audio paused' : 'Audio playing')
                handleToggle()
              }}
              aria-label={isEngineActive ? "Pause Audio Synthesis [Shortcut: Space]" : "Generate Dynamic Audio [Shortcut: Space]"}
              className="w-10 h-10 rounded-full bg-cyan-400 hover:bg-cyan-300 text-slate-950 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all cursor-pointer font-bold focus:ring-2 focus:ring-white focus:outline-none"
              title={isEngineActive ? "Pause Audio Synthesis [Space]" : "Generate Dynamic Audio [Space]"}
            >
              {isEngineActive ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current ml-0.5" />
              )}
            </motion.button>

            {/* Stop and Rewind Button */}
            <button
              onClick={() => {
                globalSonificationEngine.stop()
                playEarcon('stop')
                announce('Audio stopped and rewound to start')
                if (onPlayToggle && isEngineActive) {
                  onPlayToggle()
                }
              }}
              aria-label="Stop Audio Synthesis and Rewind [Shortcut: s]"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-lg transition-colors cursor-pointer focus:ring-2 focus:ring-cyan-400"
              title="Stop and Rewind [s]"
            >
              <Square className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                if (onNext) onNext()
                playEarcon('seek')
                if (globalSonificationEngine.isPlaying) {
                  globalSonificationEngine.stop()
                  globalSonificationEngine.play()
                }
              }}
              aria-label="Next Observation Track"
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-lg transition-colors cursor-pointer focus:ring-2 focus:ring-cyan-400"
              title="Next Track"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            {/* Audio Description Trigger */}
            <button
              onClick={() => {
                const desc = ACCESSIBLE_DESCRIPTIONS.arctic_sea_ice.spokenNarrative
                if (isSpeaking) {
                  stopSpeaking()
                } else {
                  speak(desc)
                }
              }}
              aria-label={isSpeaking ? "Stop Spoken Audio Description" : "Listen to Audio Description [Shortcut: a]"}
              aria-pressed={isSpeaking}
              className={`px-2 py-1 rounded-lg text-[10px] font-mono flex items-center space-x-1 border transition-colors focus:ring-2 focus:ring-cyan-400 ${
                isSpeaking
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold'
                  : 'bg-slate-800/50 text-slate-300 border-slate-700 hover:text-white'
              }`}
              title="Listen to Spoken Audio Description [Shortcut: a]"
            >
              <Headphones className="w-3 h-3 mr-0.5" />
              <span>{isSpeaking ? 'STOP TTS' : 'AUDIO DESC (a)'}</span>
            </button>
          </div>

          {/* Time & Audio Engine Indicator */}
          <div className="w-full flex items-center space-x-3 font-mono text-[10px] text-slate-400">
            <span className="text-cyan-400 font-bold w-10 text-right">{currentTimeDisplay}</span>
            <div className="relative w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-cyan-500 via-sky-400 to-emerald-400 rounded-full"
                animate={{
                  width: isEngineActive ? ['10%', '90%', '10%'] : '35%',
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </div>
            <span className="w-10">{track.duration || "04:18"}</span>
          </div>
        </div>

        {/* Right: Master Output Volume & Spectrum Preview */}
        <div className="hidden md:flex items-center justify-end space-x-3 w-1/4">
          <div className="w-20" aria-hidden="true">
            <AudioMeter active={isEngineActive} barsCount={12} compact={true} />
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                playEarcon('volume')
                handleMuteToggle()
              }}
              aria-label={isMuted || volume === 0 ? "Unmute Volume [Shortcut: m]" : "Mute Volume [Shortcut: m]"}
              aria-pressed={isMuted || volume === 0}
              className="text-slate-400 hover:text-white transition-colors cursor-pointer focus:ring-2 focus:ring-cyan-400 p-1 rounded"
              title="Toggle Mute [m]"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-cyan-400" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="100"
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                const v = Number(e.target.value)
                handleVolumeChange(v)
                announce(`Volume ${v} percent`)
              }}
              role="slider"
              aria-label="Adjust Master Volume [Shortcut: Up/Down Arrows]"
              aria-valuenow={isMuted ? 0 : volume}
              aria-valuemin="0"
              aria-valuemax="100"
              aria-valuetext={`${isMuted ? 0 : volume} percent`}
              className="w-16 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
          </div>
        </div>

      </div>
    </footer>
  )
}
