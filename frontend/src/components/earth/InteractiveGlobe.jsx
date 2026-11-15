import React, { useRef, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Globe2 } from 'lucide-react'

// Lazy load 3D Cesium Google Earth Globe
const CesiumGlobeViewer = React.lazy(() => import('./CesiumGlobeViewer'))

/**
 * Google Earth 3D Cesium Globe
 * Replaces legacy 2D canvas with full 3D WGS-84 Cesium globe with Sentinel-2 10m imagery,
 * NASA GIBS tile streaming, and interactive 3D camera controls.
 */
export default function InteractiveGlobe({
  activePoint = null,
  targetLocation = null,
  onPointSelect = null,
  size = 'lg',
  showSatellites = true,
  interactive = true,
  activeOverlay = 'ndvi',
}) {
  const target = targetLocation || (activePoint ? { lat: activePoint.lat, lon: activePoint.lon, zoom: 5 } : null)
  const heightClasses = size === 'sm' ? 'h-[320px]' : size === 'md' ? 'h-[420px]' : 'h-[500px]'

  return (
    <div className={`w-full ${heightClasses} relative rounded-3xl overflow-hidden bg-slate-950 border border-cyan-500/25 shadow-2xl`}>
      <React.Suspense
        fallback={
          <div className="w-full h-full flex flex-col items-center justify-center space-y-3 font-mono text-cyan-400 p-8 text-center bg-slate-950">
            <Globe2 className="w-8 h-8 animate-spin" />
            <span className="text-xs">STREAMING 3D SENTINEL-2 & NASA GIBS TILES...</span>
          </div>
        }
      >
        <CesiumGlobeViewer targetLocation={target} onNavigate={onPointSelect} />
      </React.Suspense>
    </div>
  )
}
