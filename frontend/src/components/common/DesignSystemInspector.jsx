import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  Palette, 
  Type, 
  Square, 
  Layers, 
  Loader2, 
  Radio, 
  Sliders, 
  CheckCircle2, 
  Waves,
  Play,
  RotateCcw,
  Sparkles
} from 'lucide-react'
import Button from './Button'
import Badge from './Badge'
import GlassPanel from './GlassPanel'
import AudioMeter from './AudioMeter'
import SkeletonLoader from './SkeletonLoader'
import { tokens } from '../../design-system/tokens'

/**
 * Interactive Design System Drawer / Modal Inspector
 */
export default function DesignSystemInspector({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('colors')

  const tabs = [
    { id: 'colors', label: 'Color Palette', icon: Palette },
    { id: 'typography', label: 'Typography', icon: Type },
    { id: 'buttons', label: 'Buttons & Controls', icon: Square },
    { id: 'glass', label: 'Glass & Panels', icon: Layers },
    { id: 'loaders', label: 'Loading States', icon: Loader2 },
  ]

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="w-full max-w-4xl max-h-[90vh] glass-panel-elevated rounded-2xl flex flex-col overflow-hidden border border-cyan-400/30 shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-500/20 bg-slate-950/50">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  EARTH JUKEBOX Design System
                  <Badge variant="cyan" size="sm">Phase 1</Badge>
                </h3>
                <p className="font-mono text-[10px] text-slate-400">
                  NASA Scientific Visualization × Pro-Audio Production Specification
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Pills */}
          <div className="flex space-x-2 px-6 py-3 border-b border-slate-800 bg-slate-950/30 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-mono transition-all shrink-0 ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850/50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>

          {/* Content Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* COLORS TAB */}
            {activeTab === 'colors' && (
              <div className="space-y-6">
                <div>
                  <h4 className="font-mono text-xs uppercase text-cyan-400 tracking-wider mb-3">
                    Deep Cosmic & Space Navy (Base Backgrounds)
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { name: 'Cosmic Void', hex: '#02040a', desc: 'Space Abyss' },
                      { name: 'Space Obsidian', hex: '#040816', desc: 'Main Page Canvas' },
                      { name: 'Deep Navy', hex: '#070e24', desc: 'Glass Surface' },
                      { name: 'Elevated Navy', hex: '#0b1638', desc: 'Modal & Cards' },
                    ].map((c) => (
                      <div key={c.name} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
                        <div className="w-full h-12 rounded-lg mb-2 border border-white/5" style={{ backgroundColor: c.hex }} />
                        <span className="text-xs font-bold text-slate-200">{c.name}</span>
                        <div className="flex justify-between font-mono text-[10px] text-slate-400 mt-1">
                          <span>{c.hex}</span>
                          <span>{c.desc}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-mono text-xs uppercase text-cyan-400 tracking-wider mb-3">
                    Earth Observation & Scientific Accents
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { name: 'Oceanic Cyan', hex: '#06b6d4', desc: 'Troposphere / Focus' },
                      { name: 'Atmosphere Sky', hex: '#38bdf8', desc: 'Telemetry Data' },
                      { name: 'Biosphere Emerald', hex: '#10b981', desc: 'NDVI Vegetation' },
                      { name: 'Solar Amber', hex: '#f59e0b', desc: 'Thermal Flux' },
                    ].map((c) => (
                      <div key={c.name} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
                        <div className="w-full h-12 rounded-lg mb-2 shadow" style={{ backgroundColor: c.hex }} />
                        <span className="text-xs font-bold text-slate-200">{c.name}</span>
                        <div className="flex justify-between font-mono text-[10px] text-slate-400 mt-1">
                          <span>{c.hex}</span>
                          <span>{c.desc}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TYPOGRAPHY TAB */}
            {activeTab === 'typography' && (
              <div className="space-y-6">
                <div className="glass-panel p-5 rounded-xl space-y-4">
                  <div>
                    <span className="font-mono text-[10px] text-cyan-400 uppercase tracking-widest">DISPLAY / HERO</span>
                    <p className="text-3xl sm:text-4xl font-black text-slate-100 tracking-tight">
                      Earth Observation Sonification
                    </p>
                  </div>
                  <hr className="border-slate-800" />
                  <div>
                    <span className="font-mono text-[10px] text-cyan-400 uppercase tracking-widest">H1 SECTION TITLE</span>
                    <p className="text-2xl font-extrabold text-slate-100 tracking-tight">
                      Atmospheric Ozone Spectral Density
                    </p>
                  </div>
                  <hr className="border-slate-800" />
                  <div>
                    <span className="font-mono text-[10px] text-cyan-400 uppercase tracking-widest">BODY COPY</span>
                    <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
                      EARTH JUKEBOX translates NASA multispectral Earth observation satellite imagery into dynamic, high-fidelity acoustic frequencies, enabling researchers and listeners to perceive planetary shifts through sound.
                    </p>
                  </div>
                  <hr className="border-slate-800" />
                  <div>
                    <span className="font-mono text-[10px] text-cyan-400 uppercase tracking-widest">NASA TELEMETRY / MONOSPACE</span>
                    <p className="font-mono text-xs text-cyan-300 tracking-wider">
                      ORBIT: ISS 418 KM // INCLINATION: 51.6° // SENSOR: MODIS TERRA // LAT: 03°08'40"S LON: 60°01'38"W
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* BUTTONS TAB */}
            {activeTab === 'buttons' && (
              <div className="space-y-6">
                <div>
                  <h4 className="font-mono text-xs uppercase text-cyan-400 tracking-wider mb-3">
                    Button Variants
                  </h4>
                  <div className="flex flex-wrap gap-3 items-center">
                    <Button variant="primary">Primary Holographic</Button>
                    <Button variant="secondary">Secondary Stealth</Button>
                    <Button variant="biosphere">Biosphere Action</Button>
                    <Button variant="ghost">Ghost Trigger</Button>
                    <Button variant="danger" size="sm">Signal Cut</Button>
                  </div>
                </div>

                <div>
                  <h4 className="font-mono text-xs uppercase text-cyan-400 tracking-wider mb-3">
                    Pro-Audio Transport & Icon Buttons
                  </h4>
                  <div className="flex flex-wrap gap-3 items-center">
                    <Button variant="transport" active={true} icon={Play}>Playing</Button>
                    <Button variant="transport" active={false} icon={RotateCcw}>Rewind</Button>
                    <Button variant="primary" size="icon" icon={Sparkles} />
                    <Button variant="secondary" size="icon" icon={Waves} />
                  </div>
                </div>

                <div>
                  <h4 className="font-mono text-xs uppercase text-cyan-400 tracking-wider mb-3">
                    Mission Telemetry Badges
                  </h4>
                  <div className="flex flex-wrap gap-2.5">
                    <Badge variant="cyan" dot={true}>NASA MODIS</Badge>
                    <Badge variant="emerald" dot={true}>BIOSPHERE NDVI</Badge>
                    <Badge variant="amber">THERMAL FLUX</Badge>
                    <Badge variant="violet">SOLAR WIND</Badge>
                    <Badge variant="live" dot={true}>LIVE DOWNLINK</Badge>
                  </div>
                </div>
              </div>
            )}

            {/* GLASS TAB */}
            {activeTab === 'glass' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <GlassPanel
                  title="Standard Telemetry Glass"
                  subtitle="PANEL-01 // DEFAULT"
                  badge="STABLE"
                  icon={Layers}
                >
                  <p className="text-xs text-slate-300">
                    Precision frosted glass with subtle cyan border, 16px backdrop blur, and top hairline reflection.
                  </p>
                </GlassPanel>

                <GlassPanel
                  variant="elevated"
                  title="Elevated Pro-Audio Console"
                  subtitle="PANEL-02 // ELEVATED"
                  badge="ACTIVE"
                  icon={Radio}
                  glow={true}
                >
                  <p className="text-xs text-slate-300">
                    High-contrast elevated glass panel with targeted focal glow and 20px blur.
                  </p>
                </GlassPanel>

                <GlassPanel
                  title="Radar Scan Beam Panel"
                  subtitle="TELEMETRY SWEEP"
                  badge="SCANNING"
                  scanLine={true}
                  className="md:col-span-2"
                >
                  <p className="text-xs text-slate-300 mb-3">
                    Subtle radar sweep beam simulating satellite swath detection across coordinates.
                  </p>
                  <AudioMeter active={true} barsCount={32} />
                </GlassPanel>
              </div>
            )}

            {/* LOADERS TAB */}
            {activeTab === 'loaders' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-mono text-xs uppercase text-cyan-400 tracking-wider mb-3">
                    Satellite Downlink Acquisition Loader
                  </h4>
                  <SkeletonLoader type="satellite-scan" />
                </div>

                <div>
                  <h4 className="font-mono text-xs uppercase text-cyan-400 tracking-wider mb-3">
                    Telemetry Card Skeleton
                  </h4>
                  <SkeletonLoader type="card" count={1} />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/70 flex justify-between items-center text-[11px] font-mono text-slate-400">
            <span>TAILWIND CSS v4 × FRAMER MOTION</span>
            <Button variant="secondary" size="sm" onClick={onClose}>Close Inspector</Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
