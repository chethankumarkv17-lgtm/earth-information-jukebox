import React from 'react'

/**
 * NASA Mission & Audio Telemetry Badge
 */
export default function Badge({
  children,
  variant = 'cyan', // 'cyan' | 'emerald' | 'amber' | 'violet' | 'neutral' | 'live'
  size = 'md',      // 'sm' | 'md'
  icon: Icon,
  className = '',
  dot = false,
}) {
  const variantStyles = {
    cyan: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/25',
    emerald: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25',
    amber: 'bg-amber-500/10 text-amber-300 border-amber-500/25',
    violet: 'bg-purple-500/10 text-purple-300 border-purple-500/25',
    neutral: 'bg-slate-800/60 text-slate-300 border-slate-700/60',
    live: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
  }

  const dotColors = {
    cyan: 'bg-cyan-400',
    emerald: 'bg-emerald-400',
    amber: 'bg-amber-400',
    violet: 'bg-purple-400',
    neutral: 'bg-slate-400',
    live: 'bg-rose-400 animate-pulse',
  }

  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5 rounded-md gap-1',
    md: 'text-xs px-2.5 py-1 rounded-lg gap-1.5',
  }

  return (
    <span
      className={`inline-flex items-center font-mono tracking-wider uppercase border font-medium select-none ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />}
      {Icon && <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />}
      {children}
    </span>
  )
}
