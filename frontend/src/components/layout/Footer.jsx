import React from 'react'
import { Globe2, Radio, Heart, ExternalLink, ShieldCheck, Accessibility, Sparkles } from 'lucide-react'

/**
 * Universal Global Footer for Earth Jukebox
 */
export default function Footer({ onNavigate }) {
  const handleNav = (view) => {
    onNavigate(view)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <footer className="w-full glass-panel-elevated border-t border-cyan-500/15 bg-slate-950/90 pt-12 pb-28 md:pb-16 text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pb-10 border-b border-slate-800/80">
          
          {/* Col 1: Brand & Space Apps Info */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-700 flex items-center justify-center text-slate-950 font-bold">
                <Globe2 className="w-4 h-4 text-slate-950" />
              </div>
              <span className="text-base font-bold text-slate-100 tracking-tight">
                EARTH JUKEBOX
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Developed for the <strong>2026 NASA Space Apps Challenge</strong>. Translating Earth observation satellite telemetry into immersive, scientifically grounded soundscapes.
            </p>
            <div className="flex items-center space-x-2 text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-md border border-cyan-500/20 w-fit">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>OPEN SCIENCE ACCELERATOR</span>
            </div>
          </div>

          {/* Col 2: Navigation Links */}
          <div className="space-y-3">
            <h4 className="font-mono text-xs uppercase tracking-wider text-slate-200 font-bold">
              PLATFORM WORKSPACE
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => handleNav('explore')} className="hover:text-cyan-300 transition-colors flex items-center gap-1.5">
                  <span>Earth Explorer (3D/2D)</span>
                  <span className="text-[9px] font-mono text-cyan-400 bg-cyan-950 px-1 rounded">CESIUM</span>
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('climate')} className="hover:text-cyan-300 transition-colors">
                  Climate Intelligence (ERA5)
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('observatory')} className="hover:text-cyan-300 transition-colors">
                  Satellite Observatory
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('studio')} className="hover:text-cyan-300 transition-colors">
                  Sound Studio & Synthesizer
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('timemachine')} className="hover:text-cyan-300 transition-colors">
                  Planetary Time Machine
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('accessibility')} className="hover:text-cyan-300 transition-colors">
                  Accessibility Hub (WCAG AAA)
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Accessibility & Ethics */}
          <div className="space-y-3">
            <h4 className="font-mono text-xs uppercase tracking-wider text-slate-200 font-bold">
              ACCESSIBILITY & ETHICS
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => handleNav('accessibility')} className="hover:text-cyan-300 transition-colors flex items-center gap-1">
                  <Accessibility className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Multimodal Data Perception</span>
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('accessibility')} className="hover:text-cyan-300 transition-colors">
                  Colorblind Palettes (Viridis / Cividis)
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('accessibility')} className="hover:text-cyan-300 transition-colors">
                  Deaf & Hard-of-Hearing Haptic/Visual Sync
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('about')} className="hover:text-cyan-300 transition-colors">
                  Accurate Scientific Mapping Policy
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: NASA Data Acknowledgments */}
          <div className="space-y-3">
            <h4 className="font-mono text-xs uppercase tracking-wider text-slate-200 font-bold">
              NASA DATA SOURCES
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Planetary imagery and telemetry curated from <strong>NASA EOSDIS</strong>, <strong>GIBS</strong>, <strong>Landsat 9/USGS</strong>, <strong>SWOT</strong>, <strong>PACE</strong>, and <strong>MODIS Terra/Aqua</strong>.
            </p>
            <div className="text-[11px] font-mono text-slate-500 space-y-1">
              <p>CMR API • Worldview • NASA Earthdata</p>
              <p className="text-cyan-400/90 font-medium">All scientific data used in compliance with NASA Open Data Policy.</p>
            </div>
          </div>

        </div>

        {/* Bottom copyright notice */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <p>
            © 2026 EARTH JUKEBOX • NASA Space Apps Challenge Submission.
          </p>
          <div className="flex items-center space-x-4 text-[11px] font-mono">
            <span>TERMS: OPEN SOURCE (MIT)</span>
            <span>•</span>
            <button onClick={() => handleNav('about')} className="hover:text-cyan-400">
              ABOUT PROJECT
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}
