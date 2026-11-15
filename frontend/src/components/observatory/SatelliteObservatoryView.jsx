import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Satellite, 
  Globe2, 
  Database, 
  Layers, 
  Compass, 
  Radio, 
  Activity, 
  Search, 
  Sparkles, 
  Sun, 
  Flame, 
  Wind, 
  Droplets,
  ExternalLink,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react'

import Badge from '../common/Badge'
import Button from '../common/Button'
import EyesOnEarthView from '../earth/EyesOnEarthView'
import GalleryPage from '../../pages/GalleryPage'
import EarthDataExplorer from '../datasets/EarthDataExplorer'

const CesiumGlobeViewer = React.lazy(() => import('../earth/CesiumGlobeViewer'))

/**
 * Satellite Observatory Console
 * Unites Planetary Orbits & 10 Vital Signs, Open Remote Sensing Catalog, and Multi-Source Scientific Data
 */
export default function SatelliteObservatoryView({
  currentTrack,
  onSelectVisualization,
  onNavigate,
  isPlaying,
  initialMode = 'orbits'
}) {
  // Sub-mode: 'orbits' | 'catalog' | 'datasources'
  const [observatoryMode, setObservatoryMode] = useState(initialMode)

  return (
    <div className="space-y-6">
      
      {/* Workspace Header & Observatory Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-cyan-500/15">
        <div>
          <div className="flex items-center space-x-2 text-cyan-400 font-mono text-xs uppercase tracking-wider mb-1">
            <Satellite className="w-4 h-4" />
            <span>GLOBAL SATELLITE CONSTELLATIONS & PLANETARY TELEMETRY</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2.5">
            Satellite Observatory
            <Badge variant="cyan" size="sm">ACTIVE CONSTELLATIONS</Badge>
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            LEO/GEO FLEET TRACKING, 10 VITAL SIGNS, DATASET CATALOG & SCIENTIFIC IN-SITU DATA
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800 font-mono">
          <button
            onClick={() => setObservatoryMode('orbits')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              observatoryMode === 'orbits'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Globe2 className="w-3.5 h-3.5" />
            <span>ORBITS & VITAL SIGNS</span>
          </button>

          <button
            onClick={() => setObservatoryMode('globe3d')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              observatoryMode === 'globe3d'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Satellite className="w-3.5 h-3.5" />
            <span>3D SATELLITE GLOBE</span>
          </button>

          <button
            onClick={() => setObservatoryMode('datasources')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              observatoryMode === 'datasources'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>SCIENTIFIC DATA SOURCES</span>
          </button>

          <button
            onClick={() => setObservatoryMode('catalog')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              observatoryMode === 'catalog'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>DATASET CATALOG</span>
          </button>
        </div>
      </div>

      {/* Render Mode */}
      {observatoryMode === 'globe3d' && (
        <React.Suspense
          fallback={
            <div className="flex flex-col items-center justify-center p-16 space-y-3 font-mono text-cyan-400">
              <Globe2 className="w-8 h-8 animate-spin" />
              <span className="text-xs">STREAMING 3D SATELLITE OBSERVATORY GLOBE...</span>
            </div>
          }
        >
          <CesiumGlobeViewer mode="observatory" />
        </React.Suspense>
      )}

      {observatoryMode === 'orbits' && (
        <EyesOnEarthView onSelectDataset={onSelectVisualization} />
      )}

      {observatoryMode === 'datasources' && (
        <EarthDataExplorer />
      )}

      {observatoryMode === 'catalog' && (
        <GalleryPage
          currentTrack={currentTrack}
          onSelectVisualization={onSelectVisualization}
          onNavigate={onNavigate}
          isPlaying={isPlaying}
          initialTab="nasa"
        />
      )}

    </div>
  )
}
