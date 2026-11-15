import { useState, useEffect, useCallback, useRef } from 'react'
import globalSonificationEngine, { MUSICAL_STYLES } from '../services/sonificationEngine'

/**
 * Custom React Hook for controlling the Earth Jukebox Sonification Engine
 */
export function useSonification(initialAnalysis = null) {
  const [isPlaying, setIsPlaying] = useState(globalSonificationEngine.isPlaying)
  const [isPaused, setIsPaused] = useState(globalSonificationEngine.isPaused)
  const [playbackTime, setPlaybackTime] = useState(globalSonificationEngine.playbackTime)
  const [activeStep, setActiveStep] = useState(0)
  const [settings, setSettings] = useState(globalSonificationEngine.settings)
  
  // Keep analysis data ref in sync
  useEffect(() => {
    if (initialAnalysis) {
      globalSonificationEngine.loadAnalysis(initialAnalysis)
    }
  }, [initialAnalysis])

  // Subscribe to engine events
  useEffect(() => {
    const unsubscribe = globalSonificationEngine.subscribe((event, data) => {
      switch (event) {
        case 'play':
          setIsPlaying(true)
          setIsPaused(false)
          break
        case 'pause':
          setIsPlaying(false)
          setIsPaused(true)
          if (data?.playbackTime !== undefined) {
            setPlaybackTime(data.playbackTime)
          }
          break
        case 'stop':
          setIsPlaying(false)
          setIsPaused(false)
          setPlaybackTime(0)
          setActiveStep(0)
          break
        case 'tick':
          if (data?.time !== undefined) setPlaybackTime(data.time)
          if (data?.step !== undefined) setActiveStep(data.step)
          break
        case 'settings_change':
          setSettings({ ...globalSonificationEngine.settings })
          break
        default:
          break
      }
    })

    return () => unsubscribe()
  }, [])

  const play = useCallback(async () => {
    await globalSonificationEngine.play()
  }, [])

  const pause = useCallback(() => {
    globalSonificationEngine.pause()
  }, [])

  const stop = useCallback(() => {
    globalSonificationEngine.stop()
  }, [])

  const togglePlay = useCallback(async () => {
    if (globalSonificationEngine.isPlaying) {
      globalSonificationEngine.pause()
    } else {
      await globalSonificationEngine.play()
    }
  }, [])

  const setVolume = useCallback((volume) => {
    globalSonificationEngine.updateSettings({ volume })
  }, [])

  const setTempo = useCallback((tempo) => {
    globalSonificationEngine.updateSettings({ tempo })
  }, [])

  const setPitch = useCallback((pitch) => {
    globalSonificationEngine.updateSettings({ pitch })
  }, [])

  const setIntensity = useCallback((intensity) => {
    globalSonificationEngine.updateSettings({ intensity })
  }, [])

  const setStyle = useCallback((style) => {
    globalSonificationEngine.updateSettings({ style })
  }, [])

  const loadAnalysis = useCallback((analysis) => {
    globalSonificationEngine.loadAnalysis(analysis)
  }, [])

  return {
    engine: globalSonificationEngine,
    isPlaying,
    isPaused,
    playbackTime,
    activeStep,
    settings,
    styles: MUSICAL_STYLES,
    play,
    pause,
    stop,
    togglePlay,
    setVolume,
    setTempo,
    setPitch,
    setIntensity,
    setStyle,
    loadAnalysis,
  }
}

export default useSonification
