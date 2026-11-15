import React from 'react'
import { motion } from 'framer-motion'
import { Activity, ArrowUpRight, ArrowDownRight } from 'lucide-react'

/**
 * NASA Scientific Telemetry Metric Card
 */
export default function TelemetryCard({
  label,
  value,
  unit,
  change,
  trend = 'up',
  status = 'nominal', // 'nominal' | 'elevated' | 'optimal'
  icon: Icon = Activity,
  graphData = [30, 45, 60, 50, 75, 85, 80],
}) {
  const statusColor = {
    nominal: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    elevated: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    optimal: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  }[status] || 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20'

  return (
    <div className="glass-panel p-4 rounded-xl border border-cyan-500/15 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
          {label}
        </span>
        <div className={`p-1 rounded-md border ${statusColor}`}>
          <Icon className="w-3.5 h-3.5" />
        </div>
      </div>

      <div className="flex items-baseline space-x-1.5 my-1">
        <span className="text-xl font-extrabold text-slate-100 tracking-tight">{value}</span>
        {unit && <span className="font-mono text-xs text-slate-400">{unit}</span>}
      </div>

      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80">
        {change && (
          <span className={`text-[10px] font-mono flex items-center ${trend === 'up' ? 'text-emerald-400' : 'text-amber-400'}`}>
            {trend === 'up' ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
            {change}
          </span>
        )}
        
        {/* Sparkline visualization */}
        <div className="flex items-end space-x-1 h-3.5">
          {graphData.map((val, idx) => (
            <div
              key={idx}
              className="w-1 bg-cyan-400/50 rounded-t-sm"
              style={{ height: `${val}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
