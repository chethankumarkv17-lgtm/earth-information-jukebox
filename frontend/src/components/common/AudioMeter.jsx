import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

/**
 * Pro-Audio Stereo Peak/RMS Level & Spectrum Meter
 */
export default function AudioMeter({
  active = true,
  barsCount = 28,
  compact = false,
  className = '',
}) {
  const [meterHeights, setMeterHeights] = useState(() =>
    Array.from({ length: barsCount }, () => Math.floor(Math.random() * 50) + 15)
  )

  useEffect(() => {
    if (!active) {
      setMeterHeights(Array.from({ length: barsCount }, () => 8))
      return
    }

    const interval = setInterval(() => {
      setMeterHeights(prev =>
        prev.map(() => Math.floor(Math.random() * 75) + 15)
      )
    }, 120)

    return () => clearInterval(interval)
  }, [active, barsCount])

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {/* Visualizer Frequency Bars */}
      <div className={`flex items-end justify-between gap-1 bg-slate-950/60 p-2.5 rounded-xl border border-cyan-500/10 ${compact ? 'h-16' : 'h-24'}`}>
        {meterHeights.map((height, idx) => {
          // Color gradation based on frequency index: Cyan (low) -> Sky (mid) -> Emerald (high)
          const isMid = idx > barsCount * 0.4 && idx < barsCount * 0.75
          const isHigh = idx >= barsCount * 0.75
          const barColor = isHigh
            ? 'from-emerald-400 to-teal-500'
            : isMid
            ? 'from-sky-400 to-cyan-500'
            : 'from-blue-500 to-cyan-400'

          return (
            <motion.div
              key={idx}
              className={`w-full rounded-t-sm bg-gradient-to-t ${barColor} opacity-85`}
              animate={{ height: `${height}%` }}
              transition={{ duration: 0.12, ease: "linear" }}
              style={{ minHeight: '4px' }}
            />
          )
        })}
      </div>

      {/* Telemetry labels */}
      <div className="flex justify-between items-center px-1 font-mono text-[9px] text-slate-500 tracking-wider">
        <span>20 Hz</span>
        <span>1 kHz</span>
        <span>10 kHz</span>
        <span>20 kHz</span>
      </div>
    </div>
  )
}
