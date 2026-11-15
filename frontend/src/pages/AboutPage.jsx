import React from 'react'
import { motion } from 'framer-motion'
import { 
  Info, 
  Globe2, 
  Satellite, 
  ShieldCheck, 
  Code2, 
  Sparkles, 
  ExternalLink,
  Cpu,
  Layers,
  Heart
} from 'lucide-react'
import GlassPanel from '../components/common/GlassPanel'
import Badge from '../components/common/Badge'
import Button from '../components/common/Button'

/**
 * About Page — 2026 NASA Space Apps Challenge Documentation
 */
export default function AboutPage({ onNavigate }) {
  const missions = [
    { name: "Terra & Aqua (MODIS)", role: "Daily global NDVI vegetation and surface reflectance (250m)" },
    { name: "Landsat 9 (OLI-2 & TIRS-2)", role: "Multispectral visible and thermal infrared surface radiance (30m/100m)" },
    { name: "SWOT (Surface Water & Ocean)", role: "Ka-band radar interferometry for ocean eddies and rivers" },
    { name: "PACE (Plankton & Ocean Ecosystem)", role: "Hyperspectral ocean color for phytoplankton chlorophyll detection" },
    { name: "CryoSat-2 & ICESat-2", role: "Laser altimetry measuring polar sea ice thickness and glacial mass" },
    { name: "THEMIS & Van Allen Probes", role: "Geomagnetic field flux and auroral electrojet plasma waves" },
  ]

  return (
    <div className="space-y-10 py-4 max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="pb-4 border-b border-cyan-500/10">
        <div className="flex items-center space-x-2 text-cyan-400 font-mono text-xs uppercase tracking-wider mb-1.5">
          <Info className="w-4 h-4" />
          <span>PROJECT ARCHITECTURE & MISSION MANIFEST</span>
        </div>
        <h2 className="text-3xl font-extrabold text-slate-100 tracking-tight">
          About EARTH JUKEBOX
        </h2>
        <p className="text-sm text-slate-400 mt-1 max-w-2xl">
          An open-science planetary sonification platform engineered for the <strong>2026 NASA Space Apps Challenge</strong>.
        </p>
      </div>

      {/* Mission Statement */}
      <GlassPanel variant="elevated" className="p-8 space-y-4">
        <div className="flex items-center space-x-2">
          <Badge variant="cyan" size="sm">MISSION STATEMENT</Badge>
          <span className="font-mono text-xs text-slate-400">CHALLENGE 2026</span>
        </div>

        <h3 className="text-2xl font-bold text-slate-100">
          Bridging Planetary Observation with Auditory Perception
        </h3>

        <p className="text-sm text-slate-300 leading-relaxed font-light">
          Earth observation data is expanding exponentially with constellations like Landsat, Sentinel, and SWOT generating terabytes of daily multispectral imagery. While 2D graphs and heatmaps serve specialists, they fail to evoke the living, interconnected heartbeat of our planet.
        </p>

        <p className="text-sm text-slate-300 leading-relaxed font-light">
          <strong>EARTH JUKEBOX</strong> transforms NASA’s public Earth observation satellite data into continuous, calibrated acoustic soundscapes. By coupling mathematical data integrity with high-fidelity pro-audio synthesis, we provide an intuitive, emotional, and accessible gateway to understanding planetary ecological change.
        </p>
      </GlassPanel>

      {/* Scientific Satellites Employed */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Satellite className="w-4 h-4 text-cyan-400" />
          <h4 className="font-mono text-xs uppercase tracking-wider text-slate-100 font-bold">
            NASA SATELLITE MISSIONS & SENSORS
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {missions.map((m) => (
            <div key={m.name} className="p-4 rounded-xl glass-panel border border-slate-800 space-y-1">
              <h5 className="text-xs font-bold text-cyan-300 font-mono">{m.name}</h5>
              <p className="text-xs text-slate-400">{m.role}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Ethical Sonification Principles */}
      <GlassPanel className="p-6 space-y-3">
        <div className="flex items-center space-x-2 text-emerald-400">
          <ShieldCheck className="w-5 h-5" />
          <h4 className="font-mono text-xs uppercase tracking-wider font-bold">
            ETHICAL SCIENTIFIC SONIFICATION PRINCIPLES
          </h4>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          1. <strong>Spectral Proportionality:</strong> Pitch and frequency shifts are strictly tied to real physical measurements (reflectance, temperature, sea height).
        </p>
        <p className="text-xs text-slate-300 leading-relaxed">
          2. <strong>No Synthetic Deception:</strong> We do not inject misleading dramatic alarms or artificial sound effects that misrepresent climate metrics.
        </p>
        <p className="text-xs text-slate-300 leading-relaxed">
          3. <strong>Open Source & Open Data:</strong> All code and data pipelines follow NASA Open Science Guidelines and are accessible worldwide under the MIT license.
        </p>
      </GlassPanel>

      {/* Open Remote Sensing Benchmarks & Dataset Lineage */}
      <GlassPanel className="p-6 space-y-4 border border-cyan-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-cyan-400">
            <Layers className="w-5 h-5" />
            <h4 className="font-mono text-xs uppercase tracking-wider font-bold">
              OPEN REMOTE SENSING BENCHMARK ARCHIVE
            </h4>
          </div>
          <Badge variant="cyan" size="sm">AWESOME DATASETS</Badge>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          In addition to NASA SVS and EIC planetary observations, EARTH JUKEBOX integrates sensor specifications and physical ground truth from the open-source <strong>Awesome Satellite Imagery Datasets</strong> catalog (chrieke / Rob Mark Cole / Seyed Ali Ahmadi).
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2 text-xs font-mono">
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="text-cyan-300 font-bold block">SEN12MS (TUM / DLR)</span>
            <span className="text-[11px] text-slate-400 block">Sentinel-1/2 & MODIS Triplets (180k scenes)</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="text-emerald-300 font-bold block">EuroSAT (DFKI)</span>
            <span className="text-[11px] text-slate-400 block">13-Band Sentinel-2 Land Cover (27k chips)</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="text-purple-300 font-bold block">SpaceNet 6 & 7 (CosmiQ)</span>
            <span className="text-[11px] text-slate-400 block">0.3m WorldView-3 & SAR Urban Evolution</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="text-sky-300 font-bold block">PASTIS (IGN France)</span>
            <span className="text-[11px] text-slate-400 block">Sentinel-2 Agricultural Time Series (124k parcels)</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="text-amber-300 font-bold block">xView 2 & 3 (DIU / NOAA)</span>
            <span className="text-[11px] text-slate-400 block">Disaster Damage & Maritime SAR Dark Vessels</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="text-rose-300 font-bold block">BigEarthNet (TU Berlin)</span>
            <span className="text-[11px] text-slate-400 block">590k European Sentinel-2 L2A BOA Tiles</span>
          </div>
        </div>
      </GlassPanel>

      {/* Project Team & Challenge Attribution */}
      <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="font-mono text-[10px] text-cyan-400 uppercase tracking-widest block mb-1">
            PROJECT TEAM ATTRIBUTION
          </span>
          <h5 className="text-sm font-bold text-slate-200">
            Senior Full-Stack Development Engineering Team
          </h5>
          <p className="text-xs text-slate-400">
            Engineered with React 19, Vite, Tailwind CSS v4, Framer Motion, and Python FastAPI.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={Globe2}
          onClick={() => onNavigate('explore')}
        >
          Launch Explore Console
        </Button>
      </div>

    </div>
  )
}
