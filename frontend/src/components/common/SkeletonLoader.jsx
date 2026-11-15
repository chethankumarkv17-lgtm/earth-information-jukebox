import React from 'react'
import { motion } from 'framer-motion'
import { Radio } from 'lucide-react'

/**
 * NASA Scientific Telemetry & Card Skeleton Loader
 */
export default function SkeletonLoader({ type = 'card', count = 1 }) {
  if (type === 'satellite-scan') {
    return (
      <div className="flex flex-col items-center justify-center p-8 rounded-2xl glass-panel relative overflow-hidden text-center">
        <div className="radar-scan-line" />
        
        <div className="relative mb-4">
          <div className="w-16 h-16 rounded-full border-2 border-dashed border-cyan-500/40 animate-spin" style={{ animationDuration: '8s' }} />
          <div className="absolute inset-0 flex items-center justify-center text-cyan-400">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
        </div>

        <h4 className="text-sm font-semibold text-slate-200 tracking-wide mb-1">
          ACQUIRING ORBITAL TELEMETRY
        </h4>
        <p className="font-mono text-xs text-slate-400">
          Connecting to NASA EOSDIS & Landsat Downlink...
        </p>

        <div className="w-48 h-1 bg-slate-800 rounded-full mt-4 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: ["0%", "70%", "100%"] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 w-full">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="p-5 rounded-2xl glass-panel border border-slate-800 animate-pulse relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-slate-800" />
              <div className="space-y-1.5">
                <div className="w-32 h-3.5 bg-slate-800 rounded" />
                <div className="w-20 h-2.5 bg-slate-850 rounded" />
              </div>
            </div>
            <div className="w-16 h-5 bg-slate-800 rounded-full" />
          </div>

          <div className="h-14 bg-slate-850/80 rounded-xl mb-3" />

          <div className="flex justify-between items-center pt-2">
            <div className="w-24 h-3 bg-slate-800 rounded" />
            <div className="w-14 h-3 bg-slate-800 rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}
