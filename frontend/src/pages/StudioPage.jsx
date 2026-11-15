import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Sliders, 
  Waves, 
  Radio, 
  Volume2, 
  Headphones, 
  Cpu, 
  RotateCcw, 
  Play, 
  Pause,
  Sparkles,
  Save,
  Layers,
  Activity,
  Compass,
  ArrowRight,
  Info,
  Film,
  Database,
  Radar,
  CheckCircle2
} from 'lucide-react'

import GlassPanel from '../components/common/GlassPanel'
import Button from '../components/common/Button'
import Badge from '../components/common/Badge'
import SonificationEnginePanel from '../components/studio/SonificationEnginePanel'
import DynamicSequenceWorkstation from '../components/studio/DynamicSequenceWorkstation'
import EarthDataSonificationStudio from '../components/studio/EarthDataSonificationStudio'
import { earthDatasets } from '../data/earthDatasets'
import { satelliteBenchmarkDatasets } from '../data/satelliteBenchmarkDatasets'
import useSonification from '../hooks/useSonification'

/**
 * Earth Sound Studio & Synthesizer (Phases 6 & 7 + Open Benchmarks)
 * Real-time procedural audio synthesis converting NASA satellite telemetry,
 * remote sensing deep learning benchmarks (SEN12MS, EuroSAT, SpaceNet, PASTIS, xView),
 * and animated Earth visualization sequences into dynamic, evolving soundscapes.
 */
export default function StudioPage({ onNavigate, userUploadedAnalysis = null }) {
  // Studio Mode: 'earth_data' (Core Real-Time Earth Data Sonification Engine) | 'sequence' | 'static'
  const [studioMode, setStudioMode] = useState('earth_data')

  // Telemetry Preset Category in Static Mode: 'nasa' | 'benchmarks'
  const [presetCategory, setPresetCategory] = useState('nasa')

  // Active dataset profile for static mode
  const [selectedDatasetId, setSelectedDatasetId] = useState('track-1')
  
  // Find dataset in either NASA tracks or remote sensing benchmarks
  const currentDataset = 
    earthDatasets.find(d => d.id === selectedDatasetId) ||
    satelliteBenchmarkDatasets.find(d => d.id === selectedDatasetId) ||
    earthDatasets[0]

  const activeAnalysisData = userUploadedAnalysis || currentDataset.analysisData

  const {
    isPlaying,
    settings,
    play,
    pause,
    stop,
    setStyle,
    loadAnalysis,
  } = useSonification(activeAnalysisData)

  const handleSelectDataset = (dataset) => {
    setSelectedDatasetId(dataset.id)
    if (dataset.suggestedStyle) {
      setStyle(dataset.suggestedStyle)
    }
    loadAnalysis(dataset.analysisData)
  }

  return (
    <div className="space-y-8 py-4 max-w-7xl mx-auto">
      
      {/* Studio Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-cyan-500/10">
        <div>
          <div className="flex items-center space-x-2 text-cyan-400 font-mono text-xs uppercase tracking-wider mb-1.5">
            <Sliders className="w-4 h-4" />
            <span>PARAMETRIC SOUND ARCHITECTURE • PHASES 6 & 7</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">
            Earth Sound Studio & Synthesizer
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Real-time Web Audio API procedural synthesis converting NASA satellite telemetry and remote sensing benchmarks into calibrated, dynamically generated soundscapes.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            icon={Database}
            onClick={() => onNavigate && onNavigate('benchmarks')}
          >
            Open Benchmarks Hub
          </Button>
          <Button
            variant="secondary"
            icon={ArrowRight}
            onClick={() => onNavigate && onNavigate('upload')}
          >
            Analyze Custom Image
          </Button>
        </div>
      </div>

      {/* Mode Selector Strip */}
      <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/80 border border-cyan-500/20 backdrop-blur-md">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setStudioMode('earth_data')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all ${
              studioMode === 'earth_data'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>CORE EARTH DATA SONIFIER</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-950 text-emerald-300 font-extrabold ml-1 border border-emerald-400/40">
              REAL-TIME
            </span>
          </button>

          <button
            onClick={() => setStudioMode('sequence')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all ${
              studioMode === 'sequence'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Film className="w-4 h-4" />
            <span>DYNAMIC SEQUENCE SYNCHRONIZER</span>
          </button>

          <button
            onClick={() => setStudioMode('static')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all ${
              studioMode === 'static'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>STATIC TELEMETRY SYNTHESIZER</span>
          </button>
        </div>

        <div className="hidden md:flex items-center space-x-2 text-xs font-mono text-slate-400 pr-2">
          <Radio className="w-3.5 h-3.5 text-cyan-400" />
          <span>PORTAMENTO & SMOOTHING ACTIVE</span>
        </div>
      </div>

      {/* Mode View: Earth Data Sonifier vs Dynamic Sequence vs Static Telemetry */}
      {studioMode === 'earth_data' ? (
        <EarthDataSonificationStudio />
      ) : studioMode === 'sequence' ? (
        <DynamicSequenceWorkstation />
      ) : (
        <div className="space-y-6">
          {/* Observation Telemetry Preset Strip with Category Tabs */}
          <GlassPanel 
            title="Select Observation Telemetry Profile" 
            subtitle="AUTHENTIC SATELLITE SENSOR FOUNDATION" 
            icon={Layers}
          >
            {/* Category Toggle: NASA Curated vs Remote Sensing Benchmarks */}
            <div className="flex items-center space-x-2 mb-4 pb-2 border-b border-slate-800 font-mono text-xs">
              <button
                onClick={() => setPresetCategory('nasa')}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 ${
                  presetCategory === 'nasa'
                    ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-400/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>NASA Planetary Tracks ({earthDatasets.length})</span>
              </button>
              <button
                onClick={() => setPresetCategory('benchmarks')}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 ${
                  presetCategory === 'benchmarks'
                    ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-400/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                <span>Remote Sensing Benchmarks ({satelliteBenchmarkDatasets.length})</span>
              </button>
            </div>

            {/* Presets Grid */}
            {presetCategory === 'nasa' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {earthDatasets.map((dataset) => {
                  const isSelected = dataset.id === selectedDatasetId

                  return (
                    <button
                      key={dataset.id}
                      onClick={() => handleSelectDataset(dataset)}
                      className={`p-3 rounded-xl text-left border transition-all relative overflow-hidden select-none ${
                        isSelected
                          ? 'border-cyan-400 bg-cyan-950/40 text-cyan-200 shadow-md ring-1 ring-cyan-400/40'
                          : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:bg-slate-900'
                      }`}
                    >
                      <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1 flex items-center justify-between">
                        <span>{(dataset.satellite || dataset.mission || "NASA").split(' ')[0]}</span>
                        {isSelected && <span className="text-cyan-400 font-bold">ACTIVE</span>}
                      </div>
                      <div className="font-semibold text-xs text-slate-100 truncate mb-1">
                        {dataset.title}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono truncate">
                        {dataset.sensor || dataset.spectralBand}
                      </div>
                    </button>
                  )
                })}
              </div>
            ) : (
              /* Remote Sensing Benchmarks Grid */
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {satelliteBenchmarkDatasets.slice(0, 8).map((bench) => {
                  const isSelected = bench.id === selectedDatasetId

                  return (
                    <button
                      key={bench.id}
                      onClick={() => handleSelectDataset(bench)}
                      className={`p-3 rounded-xl text-left border transition-all relative overflow-hidden select-none ${
                        isSelected
                          ? 'border-emerald-400 bg-emerald-950/40 text-emerald-200 shadow-md ring-1 ring-emerald-400/40'
                          : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:bg-slate-900'
                      }`}
                    >
                      <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1 flex items-center justify-between">
                        <span className="text-emerald-400 font-bold">{bench.spatialResolution.split(' ')[0]}</span>
                        {isSelected && <span className="text-emerald-400 font-bold">ACTIVE</span>}
                      </div>
                      <div className="font-semibold text-xs text-slate-100 truncate mb-1">
                        {bench.title}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono truncate">
                        {bench.sensor}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </GlassPanel>

          {/* Static Sonification Engine Deck */}
          <SonificationEnginePanel analysisData={activeAnalysisData} />
        </div>
      )}

    </div>
  )
}
