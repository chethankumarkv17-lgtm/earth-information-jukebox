import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// Layout Components
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import PlayerDock from './components/layout/PlayerDock'
import MobileNav from './components/layout/MobileNav'
import DesignSystemInspector from './components/common/DesignSystemInspector'

// Accessibility Components & Context
import { ThemeProvider } from './context/ThemeContext'
import { AccessibilityProvider, useAccessibility } from './context/AccessibilityContext'
import { AuthProvider } from './context/AuthContext'
import AuthModal from './components/auth/AuthModal'
import KeyboardShortcutsModal from './components/accessibility/KeyboardShortcutsModal'
import GuidedAccessibilityBanner from './components/accessibility/GuidedAccessibilityBanner'
import { ACCESSIBLE_DESCRIPTIONS } from './data/accessibleDescriptions'

// Page Components
import HomePage from './pages/HomePage'
import DashboardPage from './pages/DashboardPage'
import GalleryPage from './pages/GalleryPage'
import UploadPage from './pages/UploadPage'
import StudioPage from './pages/StudioPage'
import AccessibilityPage from './pages/AccessibilityPage'
import AboutPage from './pages/AboutPage'
import UserDashboardView from './components/dashboard/UserDashboardView'

// Core Mission Flagship Views
import ClimateIntelligenceView from './components/climate/ClimateIntelligenceView'
import SatelliteObservatoryView from './components/observatory/SatelliteObservatoryView'
import TimeMachineView from './components/timemachine/TimeMachineView'
import ComparativeExplorationHub from './components/comparisons/ComparativeExplorationHub'
import EarthSoundJourney from './components/journey/EarthSoundJourney'

// Data & Audio Services
import { earthDatasets } from './data/earthDatasets'
import globalSonificationEngine from './services/sonificationEngine'

function AppContent() {
  // Navigation State: initialized from current URL hash for cold-start sync
  const [currentView, setCurrentView] = useState(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const raw = window.location.hash.replace('#', '').split('?')[0]
      if (raw === 'dashboard') return 'explore'
      if (raw === 'profile') return 'account'
      const valid = [
        'home', 'explore', 'climate', 'observatory', 'eyes', 'datasources',
        'catalog', 'datasets', 'studio', 'timemachine', 'compare', 'journey',
        'accessibility', 'account', 'about', 'gallery', 'benchmarks', 'upload'
      ]
      if (valid.includes(raw)) return raw
    }
    return 'home'
  })
  
  // Audio Player State (Global across all views)
  const [currentTrack, setCurrentTrack] = useState(earthDatasets[0])
  const [isPlaying, setIsPlaying] = useState(false)
  
  // Design System Inspector Modal State
  const [isInspectorOpen, setIsInspectorOpen] = useState(false)

  // Accessibility Hooks
  const { 
    accessibilityMode,
    toggleAccessibilityMode,
    highContrast, 
    toggleHighContrast, 
    isSpeaking, 
    speak, 
    stopSpeaking, 
    announce, 
    playEarcon,
    toggleShortcuts,
    activeLocation,
    activeDataset,
    announceLocation,
    announceDataset
  } = useAccessibility()

  // Always scroll to top immediately upon changing routes to eliminate blank screens
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    }
  }, [currentView])

  // Listen to browser hash changes for seamless URL navigation
  useEffect(() => {
    const handleHash = () => {
      const rawHash = window.location.hash.replace('#', '')
      const hash = rawHash.split('?')[0]
      if (hash === 'dashboard') {
        setCurrentView('explore')
        return
      }
      if (hash === 'profile') {
        setCurrentView('account')
        return
      }
      const validRoutes = [
        'home', 
        'explore', 
        'climate', 
        'observatory', 
        'eyes', 
        'datasources',
        'catalog',
        'datasets',
        'studio', 
        'timemachine', 
        'compare',
        'journey',
        'accessibility', 
        'account',
        'about', 
        'gallery', 
        'benchmarks', 
        'upload'
      ]
      if (validRoutes.includes(hash)) {
        setCurrentView(hash)
      }
    }
    handleHash()
    window.addEventListener('hashchange', handleHash)
    return () => window.removeEventListener('hashchange', handleHash)
  }, [])

  // Subscribe to Sonification Engine events
  useEffect(() => {
    const unsub = globalSonificationEngine.subscribe((event) => {
      if (event === 'play') setIsPlaying(true)
      if (event === 'pause' || event === 'stop') setIsPlaying(false)
    })
    return () => unsub()
  }, [])

  // Sync active track telemetry into sonification engine
  useEffect(() => {
    if (currentTrack?.analysisData) {
      globalSonificationEngine.loadAnalysis(currentTrack.analysisData)
      if (currentTrack.suggestedStyle) {
        globalSonificationEngine.updateSettings({ style: currentTrack.suggestedStyle })
      }
    }
  }, [currentTrack])

  // Programmatic navigation handler with screen-reader focus management
  const handleNavigate = (viewId) => {
    setCurrentView(viewId)
    window.location.hash = viewId
    window.scrollTo({ top: 0, behavior: 'smooth' })
    announce(`Navigated to ${viewId} view`)

    // Shift screen-reader focus to main content container
    setTimeout(() => {
      const mainEl = document.getElementById('main-content')
      if (mainEl) mainEl.focus()
    }, 120)
  }

  // Audio Playback Transport Handlers
  const handlePlayToggle = async (track = null) => {
    if (track && track.id !== currentTrack.id) {
      setCurrentTrack(track)
      setIsPlaying(true)
      playEarcon('play')
      announce(`Playing ${track.title}`)
    } else {
      const nextPlaying = !isPlaying
      setIsPlaying(nextPlaying)
      playEarcon(nextPlaying ? 'play' : 'pause')
      announce(nextPlaying ? 'Sonification playing' : 'Sonification paused')

      if (globalSonificationEngine.isPlaying) {
        globalSonificationEngine.pause()
      } else {
        await globalSonificationEngine.play()
      }
    }
  }

  const handleNextTrack = () => {
    const currentIndex = earthDatasets.findIndex(d => d.id === currentTrack.id)
    const nextIndex = (currentIndex + 1) % earthDatasets.length
    setCurrentTrack(earthDatasets[nextIndex])
    setIsPlaying(true)
    playEarcon('seek')
    announce(`Switched to next observation: ${earthDatasets[nextIndex].title}`)
  }

  const handlePrevTrack = () => {
    const currentIndex = earthDatasets.findIndex(d => d.id === currentTrack.id)
    const prevIndex = (currentIndex - 1 + earthDatasets.length) % earthDatasets.length
    setCurrentTrack(earthDatasets[prevIndex])
    setIsPlaying(true)
    playEarcon('seek')
    announce(`Switched to previous observation: ${earthDatasets[prevIndex].title}`)
  }

  // Handle selecting any NASA Visualization from Gallery
  const handleSelectVisualization = (vis) => {
    const trackObj = {
      id: vis.id,
      title: vis.title,
      region: vis.coordinates?.name || "Global Observation",
      coordinates: vis.coordinates ? `${Math.abs(vis.coordinates.lat).toFixed(1)}°${vis.coordinates.lat >= 0 ? 'N' : 'S'} ${Math.abs(vis.coordinates.lon).toFixed(1)}°${vis.coordinates.lon >= 0 ? 'E' : 'W'}` : "Global WGS-84",
      satellite: vis.source?.mission || "NASA Earth Observation",
      sensor: vis.source?.instrument || "Optical / Radar Sensor",
      category: vis.category?.toLowerCase().split(' ')[0] || "earth",
      frequencyRange: vis.sonification?.baseFrequency || "60 Hz - 3.4 kHz",
      duration: "04:30",
      currentTime: "01:15",
      spectralGradient: vis.previewGradient || "from-cyan-400 to-blue-600",
      description: vis.description,
      keyFinding: vis.keyFinding,
      measurementUnits: vis.measurementUnits,
      visualizationType: vis.visualizationType,
    }
    setCurrentTrack(trackObj)
    setIsPlaying(true)
    playEarcon('play')
    announce(`Selected visualization: ${vis.title}`)
  }

  // ==========================================================================
  // FULL APPLICATION-WIDE ACCESSIBLE KEYBOARD NAVIGATION
  // ==========================================================================
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      // Ignore shortcut keys if user is currently typing in an input field
      const activeTag = document.activeElement?.tagName?.toLowerCase()
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
        return
      }

      // 'g' or 'G' or Alt+A: Toggle Guided Accessibility Mode
      if (e.key === 'g' || e.key === 'G' || (e.altKey && (e.key === 'a' || e.key === 'A'))) {
        e.preventDefault()
        toggleAccessibilityMode()
      }
      // '1' to '6': Direct Section Navigation
      else if (e.key === '1') {
        e.preventDefault()
        handleNavigate('explore')
      } else if (e.key === '2') {
        e.preventDefault()
        handleNavigate('climate')
      } else if (e.key === '3') {
        e.preventDefault()
        handleNavigate('observatory')
      } else if (e.key === '4') {
        e.preventDefault()
        handleNavigate('studio')
      } else if (e.key === '5') {
        e.preventDefault()
        handleNavigate('timemachine')
      } else if (e.key === '6') {
        e.preventDefault()
        handleNavigate('compare')
      } else if (e.key === '7') {
        e.preventDefault()
        handleNavigate('journey')
      } else if (e.key === '8') {
        e.preventDefault()
        handleNavigate('accessibility')
      }
      // Space or 'k' or 'p': Play / Pause
      else if (e.key === ' ' || e.key === 'k' || e.key === 'p' || e.key === 'P') {
        e.preventDefault()
        handlePlayToggle()
      }
      // 's' or 'S': Stop Playback
      else if (e.key === 's' || e.key === 'S') {
        e.preventDefault()
        globalSonificationEngine.stop()
        setIsPlaying(false)
        playEarcon('stop')
        announce('Playback stopped and returned to Frame 1')
      }
      // 'd' or 'D': Spoken Dataset Audio Description
      else if (e.key === 'd' || e.key === 'D') {
        e.preventDefault()
        const descId = activeDataset?.id || 'surface_temperature'
        const desc = ACCESSIBLE_DESCRIPTIONS[descId] || ACCESSIBLE_DESCRIPTIONS.surface_temperature
        if (isSpeaking) {
          stopSpeaking()
          announce('Dataset description voice paused')
        } else {
          speak(desc.spokenNarrative)
          announce(`Narrating ${desc.title}`)
        }
      }
      // 'l' or 'L': Spoken Location Announcement
      else if (e.key === 'l' || e.key === 'L') {
        e.preventDefault()
        if (activeLocation) {
          announceLocation(activeLocation)
        }
      }
      // 'm': Mute / Unmute
      else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault()
        const currentVol = globalSonificationEngine.settings.volume
        if (currentVol > 0) {
          globalSonificationEngine.updateSettings({ volume: 0 })
          announce('Audio muted')
        } else {
          globalSonificationEngine.updateSettings({ volume: 80 })
          announce('Audio unmuted, volume 80 percent')
        }
        playEarcon('volume')
      }
      // ArrowUp: Volume Up (+5%)
      else if (e.key === 'ArrowUp') {
        e.preventDefault()
        const currentVol = globalSonificationEngine.settings.volume ?? 80
        const newVol = Math.min(100, currentVol + 5)
        globalSonificationEngine.updateSettings({ volume: newVol })
        announce(`Volume ${newVol} percent`)
        playEarcon('volume')
      }
      // ArrowDown: Volume Down (-5%)
      else if (e.key === 'ArrowDown') {
        e.preventDefault()
        const currentVol = globalSonificationEngine.settings.volume ?? 80
        const newVol = Math.max(0, currentVol - 5)
        globalSonificationEngine.updateSettings({ volume: newVol })
        announce(`Volume ${newVol} percent`)
        playEarcon('volume')
      }
      // 'h': Toggle High-Contrast Mode
      else if (e.key === 'h' || e.key === 'H') {
        e.preventDefault()
        toggleHighContrast()
      }
      // 'a' or 'A': Audio Description Spoken Narration
      else if (e.key === 'a' || e.key === 'A') {
        e.preventDefault()
        const spoken = ACCESSIBLE_DESCRIPTIONS.arctic_sea_ice.spokenNarrative
        if (isSpeaking) {
          stopSpeaking()
          announce('Audio description stopped')
        } else {
          speak(spoken)
          announce('Speaking audio description')
        }
      }
      // '?' or Shift + '/': Toggle Keyboard Shortcuts Modal
      else if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
        e.preventDefault()
        toggleShortcuts()
      }
      // 'r' or 'R': Restart sequence
      else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault()
        globalSonificationEngine.stop()
        playEarcon('boundary')
        announce('Sequence restarted to Frame 1')
      }
    }

    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [isPlaying, isSpeaking, speak, stopSpeaking, toggleHighContrast, toggleShortcuts, playEarcon, announce])

  return (
    <div className={`min-h-screen flex flex-col telemetry-grid ${
      highContrast
        ? 'bg-black text-white'
        : 'bg-[#040816] text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200'
    }`}>
      
      {/* WCAG 2.4.1 Skip to Main Content Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2.5 focus:bg-cyan-400 focus:text-slate-950 focus:font-extrabold focus:rounded-xl focus:shadow-2xl focus:ring-4 focus:ring-white focus:outline-none"
      >
        Skip to main content
      </a>

      {/* Universal Top Navigation Bar */}
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
        onOpenDesignSystem={() => setIsInspectorOpen(true)}
      />

      {/* Guided Accessibility Mode Top Banner (When Enabled) */}
      <GuidedAccessibilityBanner />

      {/* Main Content Area Landmark with Generous Top/Bottom Clearance */}
      <main
        id="main-content"
        tabIndex="-1"
        className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-36 sm:pb-44 focus:outline-none"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            {/* View 1: Complete Homepage */}
            {currentView === 'home' && (
              <HomePage
                onNavigate={handleNavigate}
                onSelectTrack={(track) => {
                  setCurrentTrack(track)
                  setIsPlaying(true)
                  handleNavigate('explore')
                }}
              />
            )}

            {/* View 1: Earth Explorer (3D Cesium Globe, 2D Leaflet, Orbital Console) */}
            {currentView === 'explore' && (
              <DashboardPage
                currentTrack={currentTrack}
                setCurrentTrack={setCurrentTrack}
                isPlaying={isPlaying}
                setIsPlaying={setIsPlaying}
              />
            )}

            {/* View 2: Climate Intelligence (ERA5 Reanalysis 1991–2025 & Dual Globe) */}
            {currentView === 'climate' && (
              <ClimateIntelligenceView
                onSelectTrack={(track) => {
                  setCurrentTrack(track)
                  setIsPlaying(true)
                }}
              />
            )}

            {/* View 3: Datasets & Satellite Observatory (Planetary Orbits, Vital Signs, Data Sources & Catalog) */}
            {(currentView === 'datasets' || currentView === 'observatory' || currentView === 'eyes' || currentView === 'datasources' || currentView === 'catalog' || currentView === 'gallery' || currentView === 'benchmarks') && (
              <SatelliteObservatoryView
                currentTrack={currentTrack}
                onSelectVisualization={handleSelectVisualization}
                onNavigate={handleNavigate}
                isPlaying={isPlaying}
                initialMode={currentView === 'datasources' ? 'datasources' : (currentView === 'datasets' || currentView === 'gallery' || currentView === 'benchmarks' || currentView === 'catalog') ? 'catalog' : 'orbits'}
              />
            )}

            {/* View 4: Sound Studio (Parametric Synthesizer & Image Ingestion) */}
            {(currentView === 'studio' || currentView === 'upload') && (
              <StudioPage
                onNavigate={handleNavigate}
                userUploadedAnalysis={currentTrack?.analysisData}
              />
            )}

            {/* View 5: Planetary Time Machine (Multi-Decadal Timelines & Sequential Keyframes) */}
            {currentView === 'timemachine' && (
              <TimeMachineView
                onSelectTrack={(track) => {
                  setCurrentTrack(track)
                  setIsPlaying(true)
                }}
              />
            )}

            {/* View 6: Comparative Earth Exploration Hub (Features 2 & 3) */}
            {currentView === 'compare' && (
              <ComparativeExplorationHub />
            )}

            {/* View 7: Earth Sound Journey (Feature 4) */}
            {currentView === 'journey' && (
              <EarthSoundJourney />
            )}

            {/* View 8: Accessibility Hub (Section 508 & WCAG 2.2 AAA Equality Center) */}
            {currentView === 'accessibility' && (
              <AccessibilityPage />
            )}

            {/* View 9: Protected User Profile & Saved Explorations Dashboard */}
            {currentView === 'account' && (
              <UserDashboardView onNavigate={handleNavigate} />
            )}

            {/* View 10: Project Mission Manifest & Architecture */}
            {currentView === 'about' && (
              <AboutPage
                onNavigate={handleNavigate}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Global Bottom Audio Player Dock (Persistent across all views) */}
      <PlayerDock
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        onPlayToggle={() => handlePlayToggle()}
        onNext={handleNextTrack}
        onPrev={handlePrevTrack}
      />

      {/* Mobile Bottom Quick Navigation Bar */}
      <MobileNav
        activeTab={currentView}
        onTabChange={handleNavigate}
        onToggleInspector={() => setIsInspectorOpen(true)}
        isInspectorOpen={isInspectorOpen}
      />

      {/* Global Universal Footer */}
      <Footer onNavigate={handleNavigate} />

      {/* Interactive Design System Inspector Modal */}
      <DesignSystemInspector
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
      />

      {/* Accessible Keyboard Shortcuts Cheatsheet Dialog */}
      <KeyboardShortcutsModal />

      {/* Global Authentication & User Access Modal */}
      <AuthModal />

    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AccessibilityProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </AccessibilityProvider>
    </ThemeProvider>
  )
}
