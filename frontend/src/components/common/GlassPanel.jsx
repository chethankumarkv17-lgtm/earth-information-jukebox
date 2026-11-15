import React from 'react'
import { motion } from 'framer-motion'

/**
 * Scientific Glassmorphism Panel
 */
export default function GlassPanel({
  children,
  variant = 'default', // 'default' | 'subtle' | 'elevated' | 'interactive'
  className = '',
  title,
  subtitle,
  badge,
  icon: Icon,
  action,
  glow = false,
  scanLine = false,
  ...props
}) {
  const variantClass = {
    default: 'glass-panel',
    subtle: 'glass-panel-subtle',
    elevated: 'glass-panel-elevated',
    interactive: 'glass-panel glass-panel-interactive cursor-pointer',
  }[variant] || 'glass-panel'

  const glowEffect = glow ? 'shadow-[0_0_25px_-5px_rgba(6,182,212,0.25)] border-cyan-400/30' : ''

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`relative rounded-2xl overflow-hidden ${variantClass} ${glowEffect} ${className}`}
      {...props}
    >
      {/* Radar scanning line effect if enabled */}
      {scanLine && <div className="radar-scan-line pointer-events-none" />}

      {/* Header if title is provided */}
      {(title || Icon || badge || action) && (
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-cyan-500/10 bg-slate-950/30">
          <div className="flex items-center space-x-2.5">
            {Icon && (
              <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Icon className="w-4 h-4" />
              </div>
            )}
            <div>
              {title && <h3 className="text-sm font-semibold tracking-wide text-slate-100">{title}</h3>}
              {subtitle && <p className="text-[11px] font-mono tracking-wider text-slate-400">{subtitle}</p>}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {badge && (
              <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                {badge}
              </span>
            )}
            {action}
          </div>
        </div>
      )}

      {/* Panel Body */}
      <div className="p-5">{children}</div>
    </motion.div>
  )
}
