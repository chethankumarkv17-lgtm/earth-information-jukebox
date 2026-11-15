import { useState, useEffect, useRef, useCallback } from 'react'
import { globalSonificationEngine } from '../services/sonificationEngine'

/**
 * useSequenceSonification (Phase 7: Dynamic Sequence Sonification Hook)
 * 
 * Synchronizes multi-frame animated Earth visualizations with the procedural
 * sonification engine. Provides timeline scrubbing, frame-by-frame navigation,
 * playback speed scaling, and continuous sub-frame parameter interpolation.
 */
export default function useSequenceSonification(initialSequence = null) {
  const [sequence, setSequence] = useState(initialSequence)
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0)
  const [currentTimestamp, setCurrentTimestamp] = useState(0.0)
  const [progress, setProgress] = useState(0.0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0)
  const [isLooping, setIsLooping] = useState(true)
  const [interpolatedTelemetry, setInterpolatedTelemetry] = useState(null)

  // Animation frame request & timing references
  const rafIdRef = useRef(null)
  const lastTimeRef = useRef(null)
  const isPlayingRef = useRef(false)
  const isPausedRef = useRef(false)
  const speedRef = useRef(1.0)
  const sequenceRef = useRef(initialSequence)
  const loopRef = useRef(true)
  const timeRef = useRef(0.0)

  // Keep refs in sync with state
  useEffect(() => {
    sequenceRef.current = sequence
    if (sequence && sequence.frames && sequence.frames.length > 0) {
      const f0 = sequence.frames[0]
      setInterpolatedTelemetry(f0)
      globalSonificationEngine.updateDynamicFrame(f0, 0.05)
    }
  }, [sequence])

  useEffect(() => {
    speedRef.current = playbackSpeed
  }, [playbackSpeed])

  useEffect(() => {
    loopRef.current = isLooping
  }, [isLooping])

  /**
   * Linear & circular shortest-arc interpolation between frame A and frame B
   */
  const interpolateTelemetry = useCallback((frameA, frameB, alpha) => {
    if (!frameA) return null
    if (!frameB || alpha <= 0.001) return frameA
    if (alpha >= 0.999) return frameB

    const inv = 1.0 - alpha

    // Circular shortest-arc interpolation for hue (0° - 360°)
    const hueA = frameA.hue_mean_deg ?? 180.0
    const hueB = frameB.hue_mean_deg ?? 180.0
    const hueDiff = ((hueB - hueA + 540) % 360) - 180
    const interpHue = (hueA + alpha * hueDiff + 360) % 360

    return {
      frame_index: frameA.frame_index,
      timestamp_sec: (frameA.timestamp_sec ?? 0) * inv + (frameB.timestamp_sec ?? 0) * alpha,
      thumbnail_base64: alpha > 0.5 ? frameB.thumbnail_base64 : frameA.thumbnail_base64,
      normalized_brightness: (frameA.normalized_brightness ?? 0.5) * inv + (frameB.normalized_brightness ?? 0.5) * alpha,
      standard_luminance_bt601: (frameA.standard_luminance_bt601 ?? 128) * inv + (frameB.standard_luminance_bt601 ?? 128) * alpha,
      hue_mean_deg: interpHue,
      edge_density: (frameA.edge_density ?? 0.2) * inv + (frameB.edge_density ?? 0.2) * alpha,
      centroid_x_norm: (frameA.centroid_x_norm ?? 0.5) * inv + (frameB.centroid_x_norm ?? 0.5) * alpha,
      centroid_y_norm: (frameA.centroid_y_norm ?? 0.5) * inv + (frameB.centroid_y_norm ?? 0.5) * alpha,
      contrast_rms: (frameA.contrast_rms ?? 0.5) * inv + (frameB.contrast_rms ?? 0.5) * alpha,
      color_entropy: (frameA.color_entropy ?? 0.5) * inv + (frameB.color_entropy ?? 0.5) * alpha,
      warmth_index: (frameA.warmth_index ?? 0.5) * inv + (frameB.warmth_index ?? 0.5) * alpha,
      delta_from_previous: (frameA.delta_from_previous ?? 0) * inv + (frameB.delta_from_previous ?? 0) * alpha,
      dominant_colors: alpha > 0.5 ? (frameB.dominant_colors || frameA.dominant_colors) : frameA.dominant_colors,
      quadrants: {
        top_left: ((frameA.quadrants?.top_left ?? 0.25) * inv) + ((frameB.quadrants?.top_left ?? 0.25) * alpha),
        top_right: ((frameA.quadrants?.top_right ?? 0.25) * inv) + ((frameB.quadrants?.top_right ?? 0.25) * alpha),
        bottom_left: ((frameA.quadrants?.bottom_left ?? 0.25) * inv) + ((frameB.quadrants?.bottom_left ?? 0.25) * alpha),
        bottom_right: ((frameA.quadrants?.bottom_right ?? 0.25) * inv) + ((frameB.quadrants?.bottom_right ?? 0.25) * alpha),
      },
      motion_detected: alpha > 0.5 ? frameB.motion_detected : frameA.motion_detected,
    }
  }, [])

  /**
   * Synchronized frame animation tick loop
   */
  const animationTick = useCallback((now) => {
    if (!isPlayingRef.current) return

    if (lastTimeRef.current === null) {
      lastTimeRef.current = now
    }

    const deltaMs = now - lastTimeRef.current
    lastTimeRef.current = now

    const seq = sequenceRef.current
    if (!seq || !seq.frames || seq.frames.length === 0) {
      rafIdRef.current = requestAnimationFrame(animationTick)
      return
    }

    const totalFrames = seq.frames.length
    const fps = seq.fps || 3.0
    const frameDurationSec = 1.0 / fps
    const totalDurationSec = seq.duration_sec || (totalFrames / fps)

    // Advance timeline based on real clock delta & speed multiplier
    const speed = speedRef.current
    let nextTime = timeRef.current + (deltaMs / 1000.0) * speed

    // Handle end of sequence
    if (nextTime >= totalDurationSec) {
      if (loopRef.current) {
        nextTime = nextTime % totalDurationSec
      } else {
        nextTime = totalDurationSec
        isPlayingRef.current = false
        setIsPlaying(false)
        setIsPaused(false)
        globalSonificationEngine.pause()
      }
    }

    timeRef.current = nextTime
    const ratio = Math.max(0, Math.min(1, nextTime / totalDurationSec))

    // Calculate fractional frame
    const rawFrame = (nextTime / frameDurationSec)
    const idxA = Math.min(totalFrames - 1, Math.max(0, Math.floor(rawFrame)))
    const idxB = Math.min(totalFrames - 1, idxA + 1)
    const alpha = Math.max(0, Math.min(1, rawFrame - idxA))

    const frameA = seq.frames[idxA]
    const frameB = seq.frames[idxB]
    const interpolated = interpolateTelemetry(frameA, frameB, alpha)

    // Push smooth dynamic parameters into the Web Audio API engine
    if (interpolated) {
      globalSonificationEngine.updateDynamicFrame(interpolated, 0.08)
      setInterpolatedTelemetry(interpolated)
    }

    setCurrentFrameIndex(idxA)
    setCurrentTimestamp(nextTime)
    setProgress(ratio)

    if (isPlayingRef.current) {
      rafIdRef.current = requestAnimationFrame(animationTick)
    }
  }, [interpolateTelemetry])

  /**
   * Play / Resume
   */
  const play = useCallback(async () => {
    if (!sequenceRef.current || !sequenceRef.current.frames?.length) return

    isPlayingRef.current = true
    isPausedRef.current = false
    setIsPlaying(true)
    setIsPaused(false)
    lastTimeRef.current = null

    // Ensure initial frame telemetry is applied to audio engine
    const currentFrame = sequenceRef.current.frames[currentFrameIndex] || sequenceRef.current.frames[0]
    globalSonificationEngine.updateDynamicFrame(currentFrame, 0.05)

    // Start Web Audio procedural sound generation
    await globalSonificationEngine.play()

    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current)
    rafIdRef.current = requestAnimationFrame(animationTick)
  }, [currentFrameIndex, animationTick])

  /**
   * Pause
   */
  const pause = useCallback(() => {
    isPlayingRef.current = false
    isPausedRef.current = true
    setIsPlaying(false)
    setIsPaused(true)

    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current)
      rafIdRef.current = null
    }
    lastTimeRef.current = null

    globalSonificationEngine.pause()
  }, [])

  /**
   * Toggle Play / Pause
   */
  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause()
    } else {
      play()
    }
  }, [isPlaying, play, pause])

  /**
   * Restart from Frame 0
   */
  const restart = useCallback(() => {
    timeRef.current = 0.0
    setCurrentTimestamp(0.0)
    setCurrentFrameIndex(0)
    setProgress(0.0)

    if (sequenceRef.current && sequenceRef.current.frames?.length > 0) {
      const f0 = sequenceRef.current.frames[0]
      setInterpolatedTelemetry(f0)
      globalSonificationEngine.updateDynamicFrame(f0, 0.05)
    }

    if (isPlayingRef.current) {
      lastTimeRef.current = null
      globalSonificationEngine.stop()
      globalSonificationEngine.play()
    } else {
      globalSonificationEngine.stop()
    }
  }, [])

  /**
   * Seek directly to a specific frame index
   */
  const seekToFrame = useCallback((targetIndex) => {
    const seq = sequenceRef.current
    if (!seq || !seq.frames || seq.frames.length === 0) return

    const clampedIndex = Math.max(0, Math.min(seq.frames.length - 1, targetIndex))
    const fps = seq.fps || 3.0
    const newTime = clampedIndex / fps
    const totalDuration = seq.duration_sec || (seq.frames.length / fps)

    timeRef.current = newTime
    setCurrentFrameIndex(clampedIndex)
    setCurrentTimestamp(newTime)
    setProgress(Math.max(0, Math.min(1, newTime / totalDuration)))

    const frame = seq.frames[clampedIndex]
    setInterpolatedTelemetry(frame)
    globalSonificationEngine.updateDynamicFrame(frame, 0.05)
  }, [])

  /**
   * Seek by normalized progress (0.0 to 1.0)
   */
  const seekToProgress = useCallback((ratio) => {
    const seq = sequenceRef.current
    if (!seq || !seq.frames || seq.frames.length === 0) return

    const clampedRatio = Math.max(0, Math.min(1, ratio))
    const totalDuration = seq.duration_sec || (seq.frames.length / (seq.fps || 3.0))
    const targetTime = clampedRatio * totalDuration
    const fps = seq.fps || 3.0
    const frameIdx = Math.min(seq.frames.length - 1, Math.floor(targetTime * fps))

    timeRef.current = targetTime
    setCurrentTimestamp(targetTime)
    setCurrentFrameIndex(frameIdx)
    setProgress(clampedRatio)

    const frame = seq.frames[frameIdx]
    setInterpolatedTelemetry(frame)
    globalSonificationEngine.updateDynamicFrame(frame, 0.05)
  }, [])

  /**
   * Step backward by 1 frame
   */
  const stepBackward = useCallback(() => {
    seekToFrame(currentFrameIndex - 1)
  }, [currentFrameIndex, seekToFrame])

  /**
   * Step forward by 1 frame
   */
  const stepForward = useCallback(() => {
    seekToFrame(currentFrameIndex + 1)
  }, [currentFrameIndex, seekToFrame])

  /**
   * Jump to Start (Frame 0)
   */
  const jumpToStart = useCallback(() => {
    seekToFrame(0)
  }, [seekToFrame])

  /**
   * Jump to End (Last frame)
   */
  const jumpToEnd = useCallback(() => {
    if (sequenceRef.current && sequenceRef.current.frames?.length) {
      seekToFrame(sequenceRef.current.frames.length - 1)
    }
  }, [seekToFrame])

  /**
   * Set Playback Speed (0.25x - 4x)
   */
  const changeSpeed = useCallback((newSpeed) => {
    const valid = Math.max(0.25, Math.min(4.0, Number(newSpeed) || 1.0))
    setPlaybackSpeed(valid)
    speedRef.current = valid

    // Modulate sonification tempo clock proportionally
    const baseTempo = globalSonificationEngine.settings.tempo || 72
    const targetTempo = Math.max(40, Math.min(180, Math.round(baseTempo * Math.sqrt(valid))))
    globalSonificationEngine.updateSettings({ tempo: targetTempo })
  }, [])

  /**
   * Toggle Looping
   */
  const toggleLoop = useCallback(() => {
    setIsLooping(prev => !prev)
  }, [])

  /**
   * Load and initialize new sequence
   */
  const loadSequence = useCallback((newSequence) => {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current)
      rafIdRef.current = null
    }
    isPlayingRef.current = false
    setIsPlaying(false)
    setIsPaused(false)
    timeRef.current = 0.0
    setCurrentTimestamp(0.0)
    setCurrentFrameIndex(0)
    setProgress(0.0)
    setSequence(newSequence)

    if (newSequence && newSequence.frames && newSequence.frames.length > 0) {
      const f0 = newSequence.frames[0]
      setInterpolatedTelemetry(f0)
      globalSonificationEngine.updateDynamicFrame(f0, 0.05)
    }
  }, [])

  // Clean up RAF on unmount
  useEffect(() => {
    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current)
    }
  }, [])

  const currentFrameData = sequence?.frames?.[currentFrameIndex] || null

  return {
    sequence,
    currentFrameIndex,
    totalFrames: sequence?.frames?.length || 0,
    currentTimestamp,
    totalDuration: sequence?.duration_sec || 0,
    fps: sequence?.fps || 3.0,
    progress,
    isPlaying,
    isPaused,
    playbackSpeed,
    isLooping,
    currentFrameData,
    interpolatedTelemetry: interpolatedTelemetry || currentFrameData,
    trends: sequence?.trends || null,
    // Actions
    play,
    pause,
    togglePlay,
    restart,
    seekToFrame,
    seekToProgress,
    stepBackward,
    stepForward,
    jumpToStart,
    jumpToEnd,
    changeSpeed,
    toggleLoop,
    loadSequence,
  }
}
