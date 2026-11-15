import React from 'react'
import { motion } from 'framer-motion'

/**
 * Pro-Audio × NASA Scientific Button Primitives
 */
export default function Button({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'ghost' | 'transport' | 'danger'
  size = 'md',        // 'sm' | 'md' | 'lg' | 'icon'
  active = false,
  disabled = false,
  onClick,
  className = '',
  icon: Icon,
  iconPosition = 'left',
  ...props
}) {
  const baseStyles = "relative inline-flex items-center justify-center font-medium transition-all duration-200 select-none outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"

  const sizeStyles = {
    sm: "text-xs px-3 py-1.5 rounded-lg gap-1.5",
    md: "text-sm px-4 py-2 rounded-xl gap-2",
    lg: "text-base px-6 py-3 rounded-xl gap-2.5",
    icon: "p-2.5 rounded-xl aspect-square",
  }

  const variantStyles = {
    primary: "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-semibold shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 border border-cyan-300/40",
    
    secondary: "bg-slate-900/70 hover:bg-slate-800/80 text-slate-200 border border-cyan-500/20 hover:border-cyan-400/40 shadow-sm backdrop-blur-md",
    
    ghost: "bg-transparent hover:bg-slate-800/50 text-slate-400 hover:text-slate-200 border border-transparent hover:border-slate-700/50",
    
    transport: active
      ? "bg-cyan-500 text-slate-950 font-bold border border-cyan-300 shadow-[0_0_18px_rgba(6,182,212,0.5)]"
      : "bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 shadow-md",
      
    danger: "bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 hover:border-rose-500/50",
    
    biosphere: "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-semibold shadow-lg shadow-emerald-500/20 border border-emerald-300/40",
  }

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.96 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {Icon && iconPosition === 'left' && (
        <Icon className={`${size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} shrink-0`} />
      )}
      {children}
      {Icon && iconPosition === 'right' && (
        <Icon className={`${size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} shrink-0`} />
      )}
    </motion.button>
  )
}
