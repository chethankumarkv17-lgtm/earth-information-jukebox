import React from 'react'
import { motion } from 'framer-motion'
import { 
  Thermometer, 
  Waves, 
  Snowflake, 
  CloudFog, 
  Leaf, 
  Zap, 
  Wind,
  Flame,
  Activity
} from 'lucide-react'

/**
 * Authentic Scientific Visual Preview & Diagram Renderer
 * Renders physically accurate diagrammatic representations for each NASA phenomenon.
 */
export default function VisualizationPreview({
  type,
  gradient = "from-cyan-500 to-blue-600",
  className = "",
  interactive = false,
}) {
  return (
    <div className={`relative w-full h-44 rounded-xl overflow-hidden bg-slate-950/80 border border-slate-800 flex items-center justify-center telemetry-grid select-none ${className}`}>
      
      {/* Background Spectral Gradient Glow */}
      <div className={`absolute inset-0 bg-gradient-to-tr ${gradient} opacity-15`} />

      {/* 1. TEMPERATURE SPIRAL */}
      {type === 'temperature-spiral' && (
        <svg viewBox="0 0 160 120" className="w-full h-full p-2">
          {/* Circular spiral temperature rings from 1880 to 2024 */}
          <circle cx="80" cy="60" r="18" fill="none" stroke="#3b82f6" strokeWidth="1.2" strokeDasharray="3 3" opacity="0.6" />
          <circle cx="80" cy="60" r="30" fill="none" stroke="#06b6d4" strokeWidth="1.2" opacity="0.7" />
          <circle cx="80" cy="60" r="42" fill="none" stroke="#f59e0b" strokeWidth="1.5" opacity="0.8" />
          <circle cx="80" cy="60" r="50" fill="none" stroke="#ef4444" strokeWidth="2.2" strokeDasharray="6 2" />

          {/* Radial outward spiral curve */}
          <path
            d="M 80 60 Q 95 50 90 35 T 60 20 T 40 55 T 75 105 T 125 70 T 132 40"
            fill="none"
            stroke="url(#tempGrad)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <defs>
            <linearGradient id="tempGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
          </defs>
          <text x="80" y="63" textAnchor="middle" fill="#f8fafc" fontSize="7" fontFamily="monospace" fontWeight="bold">+1.36°C</text>
          <text x="14" y="16" fill="#94a3b8" fontSize="6" fontFamily="monospace">GISTEMP SPIRAL</text>
          <text x="142" y="112" textAnchor="end" fill="#ef4444" fontSize="6" fontFamily="monospace">2024 PEAK</text>
        </svg>
      )}

      {/* 2. MARINE HEATWAVE */}
      {type === 'marine-heatwave' && (
        <svg viewBox="0 0 160 120" className="w-full h-full p-2">
          {/* Ocean temperature contour isotherms */}
          <path d="M 10 30 Q 50 15 90 40 T 150 25" fill="none" stroke="#0ea5e9" strokeWidth="1.2" opacity="0.5" />
          <path d="M 10 55 Q 55 40 100 65 T 150 50" fill="none" stroke="#06b6d4" strokeWidth="1.5" opacity="0.7" />
          <path d="M 10 80 Q 60 70 105 90 T 150 75" fill="none" stroke="#f59e0b" strokeWidth="1.8" opacity="0.8" />
          {/* Heatwave hotspot blob */}
          <ellipse cx="95" cy="62" rx="32" ry="18" fill="rgba(239, 68, 68, 0.22)" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4 2" />
          <text x="95" y="65" textAnchor="middle" fill="#f87171" fontSize="7" fontFamily="monospace" fontWeight="bold">+3.8°C SST HOTSPOT</text>
          <text x="14" y="16" fill="#94a3b8" fontSize="6" fontFamily="monospace">MUR ULTRA-HIGH RES SST</text>
        </svg>
      )}

      {/* 3. OCEAN VECTORS (PERPETUAL OCEAN) */}
      {type === 'ocean-vectors' && (
        <svg viewBox="0 0 160 120" className="w-full h-full p-2">
          {/* Turbulent streamline spirals */}
          <path d="M 20 85 Q 45 40 80 50 T 140 30" fill="none" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" />
          <path d="M 25 95 Q 50 50 85 60 T 145 40" fill="none" stroke="#38bdf8" strokeWidth="1.2" strokeLinecap="round" />
          {/* Vortex eddy 1 */}
          <ellipse cx="65" cy="50" rx="14" ry="10" fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 2" />
          <circle cx="65" cy="50" r="3" fill="#22d3ee" />
          {/* Vortex eddy 2 */}
          <ellipse cx="115" cy="70" rx="18" ry="12" fill="none" stroke="#0284c7" strokeWidth="1.5" strokeDasharray="4 2" />
          <text x="14" y="16" fill="#94a3b8" fontSize="6" fontFamily="monospace">ECCO GULF STREAM VORTICES</text>
          <text x="142" y="112" textAnchor="end" fill="#38bdf8" fontSize="6" fontFamily="monospace">VELOCITY: 1.8 m/s</text>
        </svg>
      )}

      {/* 4. TOPOGRAPHY MESH (SWOT) */}
      {type === 'topography-mesh' && (
        <svg viewBox="0 0 160 120" className="w-full h-full p-2">
          {/* Radar interferometer mesh lines */}
          <path d="M 20 40 L 140 40 M 20 60 L 140 60 M 20 80 L 140 80 M 20 100 L 140 100" stroke="rgba(6, 182, 212, 0.25)" strokeWidth="1" />
          <path d="M 40 20 L 40 105 M 70 20 L 70 105 M 100 20 L 100 105 M 130 20 L 130 105" stroke="rgba(6, 182, 212, 0.25)" strokeWidth="1" />
          {/* Elevation topography contours */}
          <path d="M 20 70 Q 55 35 90 65 T 140 55" fill="none" stroke="#22d3ee" strokeWidth="2.2" strokeLinecap="round" />
          <text x="14" y="16" fill="#94a3b8" fontSize="6" fontFamily="monospace">SWOT KaRIn ALTIMETRY</text>
          <text x="142" y="112" textAnchor="end" fill="#22d3ee" fontSize="6" fontFamily="monospace">SSH: ±14.2 cm</text>
        </svg>
      )}

      {/* 5. ICE MASS DECAY (GRACE) */}
      {type === 'ice-mass-decay' && (
        <svg viewBox="0 0 160 120" className="w-full h-full p-2">
          {/* Zero baseline */}
          <line x1="20" y1="35" x2="145" y2="35" stroke="#475569" strokeWidth="1" strokeDasharray="3 3" />
          {/* Downward trend line of ice mass loss */}
          <path
            d="M 20 35 L 45 42 L 70 55 L 95 72 L 120 90 L 145 105"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {/* Fill under the curve */}
          <path
            d="M 20 35 L 45 42 L 70 55 L 95 72 L 120 90 L 145 105 L 145 110 L 20 110 Z"
            fill="rgba(56, 189, 248, 0.12)"
          />
          <text x="14" y="16" fill="#94a3b8" fontSize="6" fontFamily="monospace">GRACE-FO MASS BALANCE</text>
          <text x="25" y="32" fill="#64748b" fontSize="6" fontFamily="monospace">2002 BASELINE</text>
          <text x="145" y="100" textAnchor="end" fill="#f87171" fontSize="6.5" fontFamily="monospace" fontWeight="bold">-270 Gt / YEAR</text>
        </svg>
      )}

      {/* 6. ICE EXTENT CURVE (ICESat-2) */}
      {type === 'ice-extent-curve' && (
        <svg viewBox="0 0 160 120" className="w-full h-full p-2">
          {/* Seasonal Arctic extent cycle */}
          <path d="M 20 40 Q 55 100 85 100 T 145 50" fill="none" stroke="#38bdf8" strokeWidth="2" />
          <circle cx="85" cy="100" r="3.5" fill="#ef4444" />
          <text x="14" y="16" fill="#94a3b8" fontSize="6" fontFamily="monospace">ARCTIC SUMMER MINIMUM</text>
          <text x="85" y="112" textAnchor="middle" fill="#ef4444" fontSize="6" fontFamily="monospace">SEPTEMBER MINIMUM: -12.2%/DEC</text>
        </svg>
      )}

      {/* 7. CO2 SAWTOOTH (OCO-2 / GEOS) */}
      {type === 'co2-sawtooth' && (
        <svg viewBox="0 0 160 120" className="w-full h-full p-2">
          {/* Sawtooth annual curve with rising linear baseline */}
          <path
            d="M 20 90 L 32 82 L 40 92 L 52 75 L 60 85 L 75 68 L 83 78 L 98 60 L 106 70 L 122 50 L 130 60 L 145 42"
            fill="none"
            stroke="url(#co2Grad)"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <defs>
            <linearGradient id="co2Grad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
          </defs>
          <text x="14" y="16" fill="#94a3b8" fontSize="6" fontFamily="monospace">OCO-2 XCO2 SAWTOOTH CYCLE</text>
          <text x="145" y="38" textAnchor="end" fill="#f87171" fontSize="7" fontFamily="monospace" fontWeight="bold">426.8 PPM</text>
          <text x="20" y="102" fill="#64748b" fontSize="6" fontFamily="monospace">SPRING INHALE / AUTUMN EXHALE</text>
        </svg>
      )}

      {/* 8. METHANE PLUME (EMIT) */}
      {type === 'methane-plume' && (
        <svg viewBox="0 0 160 120" className="w-full h-full p-2">
          {/* Point source origin */}
          <circle cx="35" cy="65" r="4" fill="#a855f7" />
          <circle cx="35" cy="65" r="8" fill="none" stroke="#a855f7" strokeWidth="1" strokeDasharray="2 2" />
          {/* Expanding dispersion plume */}
          <path
            d="M 35 65 Q 60 45 95 40 T 145 35 L 145 95 Q 95 85 60 80 Z"
            fill="url(#methaneGrad)"
            opacity="0.7"
          />
          <defs>
            <linearGradient id="methaneGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="50%" stopColor="#10b981" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          </defs>
          <text x="14" y="16" fill="#94a3b8" fontSize="6" fontFamily="monospace">EMIT CH4 SPECTROSCOPY</text>
          <text x="142" y="112" textAnchor="end" fill="#a855f7" fontSize="6" fontFamily="monospace">SUPER-EMITTER: 1,850 kg/h</text>
        </svg>
      )}

      {/* 9. NDVI SPECTRUM (MODIS) */}
      {type === 'ndvi-spectrum' && (
        <svg viewBox="0 0 160 120" className="w-full h-full p-2">
          {/* Chlorophyll Red absorption dip (660nm) and NIR reflectance plateau (850nm) */}
          <path
            d="M 20 85 C 40 85 55 105 75 105 C 85 105 90 35 110 35 L 145 35"
            fill="none"
            stroke="#10b981"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M 20 85 C 40 85 55 105 75 105 C 85 105 90 35 110 35 L 145 35 L 145 110 L 20 110 Z"
            fill="rgba(16, 185, 129, 0.12)"
          />
          <text x="14" y="16" fill="#94a3b8" fontSize="6" fontFamily="monospace">MODIS CANOPY NDVI (RED vs NIR)</text>
          <text x="75" y="113" textAnchor="middle" fill="#64748b" fontSize="5.5" fontFamily="monospace">RED ABSORPTION</text>
          <text x="125" y="30" textAnchor="middle" fill="#34d399" fontSize="6" fontFamily="monospace" fontWeight="bold">NIR PLATEAU: 0.84</text>
        </svg>
      )}

      {/* 10. CHLOROPHYLL SWIRL (PACE) */}
      {type === 'chlorophyll-swirl' && (
        <svg viewBox="0 0 160 120" className="w-full h-full p-2">
          {/* Spiraling ocean phytoplankton bloom swirls */}
          <path d="M 30 60 Q 60 20 100 45 T 145 75" fill="none" stroke="#2dd4bf" strokeWidth="2" strokeLinecap="round" />
          <path d="M 40 80 Q 75 100 115 70 T 135 30" fill="none" stroke="#10b981" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="85" cy="55" r="16" fill="none" stroke="#22d3ee" strokeWidth="1.2" strokeDasharray="3 3" />
          <text x="14" y="16" fill="#94a3b8" fontSize="6" fontFamily="monospace">PACE OCI OCEAN COLOR</text>
          <text x="142" y="112" textAnchor="end" fill="#2dd4bf" fontSize="6" fontFamily="monospace">CHL-A: 4.8 mg/m³</text>
        </svg>
      )}

      {/* 11. WILDFIRE SMOKE (FIRMS) */}
      {type === 'wildfire-smoke' && (
        <svg viewBox="0 0 160 120" className="w-full h-full p-2">
          {/* Thermal fire hot points */}
          <circle cx="35" cy="85" r="4" fill="#ef4444" />
          <circle cx="45" cy="90" r="3" fill="#f59e0b" />
          {/* Rising pyrocumulonimbus plume */}
          <path
            d="M 35 85 Q 50 45 80 35 T 145 25 L 145 85 Q 90 75 45 90 Z"
            fill="url(#fireGrad)"
            opacity="0.65"
          />
          <defs>
            <linearGradient id="fireGrad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#64748b" />
            </linearGradient>
          </defs>
          <text x="14" y="16" fill="#94a3b8" fontSize="6" fontFamily="monospace">FIRMS VIIRS THERMAL AOD</text>
          <text x="142" y="112" textAnchor="end" fill="#f59e0b" fontSize="6" fontFamily="monospace">FRP: 1,420 MW</text>
        </svg>
      )}

      {/* 12. DUST TRAJECTORY (CALIPSO) */}
      {type === 'dust-trajectory' && (
        <svg viewBox="0 0 160 120" className="w-full h-full p-2">
          {/* Trans-Atlantic trajectory arc */}
          <path d="M 140 70 Q 80 40 25 80" fill="none" stroke="#d97706" strokeWidth="2.5" strokeDasharray="5 3" />
          <polygon points="25,80 35,76 33,85" fill="#d97706" />
          <text x="14" y="16" fill="#94a3b8" fontSize="6" fontFamily="monospace">SAHARAN TRANS-ATLANTIC DUST</text>
          <text x="140" y="82" textAnchor="end" fill="#94a3b8" fontSize="5.5" fontFamily="monospace">SAHARA (AFRICA)</text>
          <text x="25" y="93" fill="#10b981" fontSize="5.5" fontFamily="monospace">AMAZON (SOUTH AMERICA)</text>
          <text x="142" y="112" textAnchor="end" fill="#d97706" fontSize="6" fontFamily="monospace">180M TONS / YR</text>
        </svg>
      )}

      {/* 13. AURORAL WAVES (THEMIS) */}
      {type === 'auroral-waves' && (
        <svg viewBox="0 0 160 120" className="w-full h-full p-2">
          {/* Oscillating geomagnetic wave pulses */}
          <path d="M 15 60 Q 30 25 45 60 T 75 60 T 105 60 T 135 60" fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" />
          <path d="M 15 60 Q 30 95 45 60 T 75 60 T 105 60 T 135 60" fill="none" stroke="#10b981" strokeWidth="1.5" strokeDasharray="3 2" />
          <text x="14" y="16" fill="#94a3b8" fontSize="6" fontFamily="monospace">THEMIS ALFVÉN PLASMA WAVES</text>
          <text x="142" y="112" textAnchor="end" fill="#a855f7" fontSize="6" fontFamily="monospace">FIELD FLUX: 420 nT</text>
        </svg>
      )}

    </div>
  )
}
