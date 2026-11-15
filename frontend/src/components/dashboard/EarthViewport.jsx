import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Globe2, 
  Layers, 
  Compass, 
  Satellite, 
  Eye, 
  MapPin, 
  Maximize2,
  Minimize2,
  RotateCw,
  Sun
} from 'lucide-react'
import Badge from '../common/Badge'

// Google Earth 3D Cesium Globe
const CesiumGlobeViewer = React.lazy(() => import('../earth/CesiumGlobeViewer'))

/**
 * Central Earth Visualization Area for Dashboard
 * Provides interactive planetary sphere, layer filters, and geographic HUD
 */
export default function EarthViewport({
  activeDataset,
  onSelectPoint,
  activeLayers = ['ndvi', 'grid'],
  onToggleLayer,
}) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [selectedOverlay, setSelectedOverlay] = useState('ndvi')

  const overlayOptions = [
    { id: 'ndvi', label: 'Vegetation NDVI', color: 'text-emerald-400 border-emerald-500/30' },
    { id: 'sst', label: 'Sea Surface Temp', color: 'text-cyan-400 border-cyan-500/30' },
    { id: 'thermal', label: 'Thermal Infrared', color: 'text-amber-400 border-amber-500/30' },
    { id: 'clouds', label: 'Cloud Optical Depth', color: 'text-sky-300 border-sky-400/30' },
  ]

  return (
    <div className={`relative glass-panel rounded-2xl overflow-hidden border border-cyan-500/20 ${isFullscreen ? 'fixed inset-4 z-50 bg-slate-950/95' : 'h-full'}`}>
      
      {/* Top Controls & Telemetry Header */}
      <div className="absolute top-0 inset-x-0 z-20 flex flex-wrap items-center justify-between p-4 bg-gradient-to-b from-slate-950/90 via-slate-950/60 to-transparent">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Globe2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold text-slate-100 uppercase tracking-wider">
                PLANETARY OBSERVATION VIEWPORT
              </span>
              <Badge variant="cyan" size="sm">LIVE ORTHOGRAPHIC</Badge>
            </div>
            <p className="font-mono text-[10px] text-slate-400">
              TARGET: {activeDataset?.region || "GLOBAL COMPOSITE"} • {activeDataset?.coordinates || "00°00'N 00°00'E"}
            </p>
          </div>
        </div>

        {/* Layer Filter Buttons */}
        <div className="hidden sm:flex items-center space-x-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
          {overlayOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setSelectedOverlay(opt.id)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono transition-all ${
                selectedOverlay === opt.id
                  ? `bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-sm font-bold`
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1 text-slate-400 hover:text-white rounded"
            title="Toggle Viewport Size"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Central Google Earth 3D Cesium Globe */}
      <div className={`w-full ${isFullscreen ? 'h-[85vh]' : 'h-[440px] md:h-[500px]'} flex items-center justify-center relative`}>
        <React.Suspense
          fallback={
            <div className="w-full h-full flex flex-col items-center justify-center space-y-3 font-mono text-cyan-400 bg-slate-950 p-6 text-center">
              <Globe2 className="w-8 h-8 animate-spin" />
              <span className="text-xs">INITIALIZING GOOGLE EARTH 3D CESIUM GLOBE...</span>
            </div>
          }
        >
          <CesiumGlobeViewer onNavigate={onSelectPoint} />
        </React.Suspense>
      </div>

      {/* Bottom HUD Coordinates & Satellite Telemetry Readout */}
      <div className="absolute bottom-0 inset-x-0 z-20 flex items-center justify-between p-3.5 bg-gradient-to-t from-slate-950/95 via-slate-950/70 to-transparent border-t border-cyan-500/10 font-mono text-[10px] text-slate-400">
        <div className="flex items-center space-x-4">
          <span className="flex items-center gap-1.5 text-cyan-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            DOWNLINK: <strong>NASA EOSDIS GIBS</strong>
          </span>
          <span className="hidden md:inline text-slate-600">|</span>
          <span className="hidden md:inline">
            PROJECTION: <strong className="text-slate-200">ORTHOGRAPHIC WGS-84</strong>
          </span>
        </div>

        <div className="flex items-center space-x-3">
          <span className="text-slate-500">SUN ANGLE: <strong className="text-amber-400">48.2°</strong></span>
          <span className="text-cyan-400 font-bold">{activeDataset?.satellite || "TERRA"}</span>
        </div>
      </div>

    </div>
  )
}
