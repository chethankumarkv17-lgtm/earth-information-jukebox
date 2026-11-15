import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Globe2, 
  Radio, 
  Menu, 
  X, 
  Compass, 
  Sliders, 
  Upload, 
  Eye, 
  Info, 
  Sparkles, 
  Layers, 
  ChevronRight, 
  Keyboard, 
  Accessibility,
  User, 
  Lock, 
  Shield 
} from 'lucide-react'
import Button from '../common/Button'
import Badge from '../common/Badge'
import { useAccessibility } from '../../context/AccessibilityContext'
import { useAuth } from '../../context/AuthContext'

/**
 * Universal Navigation Bar for Earth Jukebox
 */
export default function Navbar({
  currentView = 'home',
  onNavigate,
  onOpenDesignSystem,
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [missionsOpen, setMissionsOpen] = useState(false)
  const { 
    accessibilityMode, 
    toggleAccessibilityMode, 
    openShortcuts 
  } = useAccessibility()
  const { user, isAuthenticated, isAdmin, openAuthModal } = useAuth()

  // Phase B: 5 Simplified Primary Navigation Destinations
  const primaryNavItems = [
    { id: 'home', label: 'Home' },
    { id: 'explore', label: 'Earth Explorer', badge: '3D' },
    { id: 'studio', label: 'Sound Studio', badge: 'SYNTH' },
    { id: 'datasets', label: 'Datasets', badge: 'DATA' },
    { id: 'about', label: 'About' },
    ...(isAuthenticated ? [{ id: 'account', label: 'Dashboard', badge: isAdmin ? 'ADMIN' : 'PRO' }] : [])
  ]

  // Secondary Contextual Exploration Missions (Preserved & accessible via contextual panel)
  const secondaryMissions = [
    { id: 'climate', label: 'Climate Intelligence', badge: 'ERA5' },
    { id: 'observatory', label: 'Satellite Observatory', badge: 'FLEET' },
    { id: 'timemachine', label: 'Time Machine', badge: 'DECIBEL' },
    { id: 'compare', label: 'Comparisons', badge: 'DUAL' },
    { id: 'journey', label: 'Sound Journey', badge: 'EXPEDITION' },
    { id: 'accessibility', label: 'Accessibility Hub', badge: 'AAA' }
  ]

  const isSecondaryActive = secondaryMissions.some(m => m.id === currentView)

  const handleNavClick = (id) => {
    onNavigate(id)
    setMobileMenuOpen(false)
    setMissionsOpen(false)
    window.scrollTo({ top: 0, behavior: 'instant' })
  }

  return (
    <nav className="sticky top-0 z-50 w-full glass-panel-elevated border-b border-cyan-500/15 backdrop-blur-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <button
          onClick={() => handleNavClick('home')}
          className="flex items-center space-x-3 text-left group focus:outline-none focus:ring-2 focus:ring-cyan-400 rounded-lg p-1"
          aria-label="Earth Jukebox Home"
        >
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 via-sky-600 to-blue-700 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-cyan-500/25 border border-cyan-300/40 group-hover:scale-105 transition-transform">
              <Globe2 className="w-5 h-5 text-slate-950" />
            </div>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-950 animate-ping" />
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <span className="text-base font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 via-sky-200 to-emerald-300 bg-clip-text text-transparent">
                EARTH JUKEBOX
              </span>
              <span className="hidden sm:inline-block font-mono text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 uppercase tracking-wider">
                SPACE APPS 2026
              </span>
            </div>
            <p className="hidden md:block font-mono text-[10px] text-slate-400 tracking-wider">
              NASA EARTH DATA SONIFICATION PLATFORM
            </p>
          </div>
        </button>

        {/* Desktop Simplified 5-Item Navigation + Missions Dropdown */}
        <div className="hidden lg:flex items-center space-x-1" role="menubar">
          {primaryNavItems.map((item) => {
            const isActive = currentView === item.id || (item.id === 'datasets' && ['observatory', 'eyes', 'datasources', 'catalog', 'gallery', 'benchmarks'].includes(currentView))
            return (
              <button
                key={item.id}
                role="menuitem"
                aria-current={isActive ? 'page' : undefined}
                onClick={() => handleNavClick(item.id)}
                className={`relative px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 focus:ring-2 focus:ring-cyan-400 focus:outline-none ${
                  isActive
                    ? 'text-cyan-300 font-bold bg-cyan-500/15 border border-cyan-500/30 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <span>{item.label}</span>
                {item.badge && (
                  <span className="font-mono text-[8px] px-1 py-0.2 rounded bg-cyan-400/20 text-cyan-300 border border-cyan-400/30">
                    {item.badge}
                  </span>
                )}
              </button>
            )
          })}

          {/* Secondary Contextual Missions Dropdown */}
          <div className="relative">
            <button
              onClick={() => setMissionsOpen(!missionsOpen)}
              onBlur={() => setTimeout(() => setMissionsOpen(false), 200)}
              aria-haspopup="true"
              aria-expanded={missionsOpen}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1 border focus:ring-2 focus:ring-cyan-400 focus:outline-none ${
                isSecondaryActive
                  ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border-transparent'
              }`}
            >
              <span>Missions</span>
              <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 ${missionsOpen ? 'rotate-90' : ''}`} />
            </button>

            <AnimatePresence>
              {missionsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 mt-1.5 w-56 rounded-xl bg-slate-950/95 border border-cyan-500/30 backdrop-blur-2xl p-1.5 shadow-2xl z-50 space-y-1"
                >
                  <div className="px-2.5 py-1 text-[9px] font-mono text-cyan-400 uppercase tracking-widest font-bold border-b border-slate-800">
                    EXPLORATION MISSIONS
                  </div>
                  {secondaryMissions.map((m) => {
                    const isMActive = currentView === m.id
                    return (
                      <button
                        key={m.id}
                        onClick={() => handleNavClick(m.id)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-mono transition-colors flex items-center justify-between ${
                          isMActive
                            ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                            : 'text-slate-300 hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        <span>{m.label}</span>
                        <span className="text-[8px] px-1 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                          {m.badge}
                        </span>
                      </button>
                    )
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Desktop Right Action CTAs */}
        <div className="hidden lg:flex items-center space-x-2">
          
          {/* Guided Accessibility Mode Toggle */}
          <button
            onClick={() => toggleAccessibilityMode()}
            aria-label={`Toggle Guided Accessibility Mode [Shortcut: g] - Currently ${accessibilityMode ? 'Enabled' : 'Disabled'}`}
            aria-pressed={accessibilityMode}
            title="Toggle Guided Accessibility Mode (Voice & Guidance) [Shortcut: g]"
            className={`px-2.5 py-1.5 rounded-xl text-xs font-mono transition-all border flex items-center space-x-1.5 focus:ring-2 focus:ring-cyan-400 focus:outline-none ${
              accessibilityMode
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/60 font-bold shadow-md shadow-emerald-500/20'
                : 'bg-slate-900/90 text-slate-300 hover:text-white border-slate-700/60 hover:bg-slate-800'
            }`}
          >
            <Accessibility className="w-4 h-4 text-emerald-400" />
            <span className="hidden xl:inline">{accessibilityMode ? 'A11Y MODE ON' : 'A11Y MODE'}</span>
          </button>

          {/* Keyboard Shortcuts Trigger */}
          <button
            onClick={openShortcuts}
            aria-label="Open Keyboard Shortcuts Cheatsheet [Shortcut: ?]"
            title="Keyboard Shortcuts Cheatsheet [?]"
            className="p-2 rounded-xl bg-slate-900/90 text-slate-300 hover:text-cyan-300 border border-slate-700/60 hover:border-cyan-500/40 transition-colors focus:ring-2 focus:ring-cyan-400 focus:outline-none"
          >
            <Keyboard className="w-4 h-4" />
          </button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenDesignSystem}
            className="font-mono text-xs text-slate-400"
          >
            Design System
          </Button>

          {/* User Account / Sign In Action */}
          {isAuthenticated ? (
            <button
              onClick={() => handleNavClick('account')}
              aria-label="Open User Dashboard & Saved Explorations"
              className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-cyan-500/30 hover:border-cyan-400 text-xs font-mono text-cyan-300 transition-all focus:ring-2 focus:ring-cyan-400"
            >
              <User className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-bold truncate max-w-[110px]">
                {user?.full_name?.split(' ')[0] || user?.email?.split('@')[0]}
              </span>
              {isAdmin && (
                <span className="px-1 py-0.2 rounded bg-amber-400/20 text-amber-300 text-[8px] font-bold border border-amber-400/30">
                  ADMIN
                </span>
              )}
            </button>
          ) : (
            <button
              onClick={() => openAuthModal('login')}
              aria-label="Sign In or Create Account"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs font-mono shadow-md shadow-cyan-500/20 transition-all focus:ring-2 focus:ring-cyan-400"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>SIGN IN</span>
            </button>
          )}

        </div>

        {/* Mobile Menu Toggle Button */}
        <div className="flex lg:hidden items-center space-x-2">
          <button
            onClick={() => toggleAccessibilityMode()}
            aria-label="Toggle Accessibility Mode"
            aria-pressed={accessibilityMode}
            className={`p-2 rounded-xl border ${
              accessibilityMode ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400' : 'bg-slate-900 text-slate-300 border-slate-700'
            }`}
          >
            <Accessibility className="w-4 h-4" />
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open navigation menu"}
            aria-expanded={mobileMenuOpen}
            className="p-2 rounded-xl bg-slate-900 text-slate-300 hover:text-white border border-slate-700 focus:ring-2 focus:ring-cyan-400 focus:outline-none"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden border-t border-cyan-500/20 bg-slate-950/98 backdrop-blur-2xl px-4 py-4 space-y-2 max-h-[80vh] overflow-y-auto"
          >
            <div className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider px-1">
              PRIMARY WORKSPACE
            </div>
            {primaryNavItems.map((item) => {
              const isActive = currentView === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="font-mono text-[9px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      {item.badge}
                    </span>
                  )}
                </button>
              )
            })}

            <div className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider px-1 pt-3 border-t border-slate-800">
              EXPLORATION MISSIONS
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {secondaryMissions.map((item) => {
                const isActive = currentView === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`p-2 rounded-xl text-left border text-xs font-mono transition-colors ${
                      isActive
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 font-bold'
                        : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="font-bold truncate">{item.label}</div>
                    <div className="text-[8px] text-slate-400">{item.badge}</div>
                  </button>
                )
              })}
            </div>

            {/* Mobile Auth Button */}
            <div className="pt-2 border-t border-slate-800">
              {isAuthenticated ? (
                <button
                  onClick={() => handleNavClick('account')}
                  className="w-full flex items-center justify-between p-3 rounded-xl text-sm font-mono font-bold bg-slate-900 border border-cyan-500/40 text-cyan-300"
                >
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-cyan-400" />
                    <span>{user?.full_name || user?.email}</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 border border-cyan-500/30">
                    {isAdmin ? 'ADMIN' : 'PRO'}
                  </span>
                </button>
              ) : (
                <button
                  onClick={() => { setMobileMenuOpen(false); openAuthModal('login'); }}
                  className="w-full flex items-center justify-center gap-2 p-3 rounded-xl text-sm font-mono font-bold bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20"
                >
                  <Lock className="w-4 h-4" />
                  <span>SIGN IN TO EARTH JUKEBOX</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
