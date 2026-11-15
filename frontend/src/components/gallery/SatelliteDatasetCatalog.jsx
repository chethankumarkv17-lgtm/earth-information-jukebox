import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Satellite, 
  Search, 
  Filter, 
  Sliders, 
  Volume2, 
  ExternalLink, 
  ShieldCheck, 
  Radio, 
  Layers, 
  Sparkles, 
  CheckCircle2, 
  Table, 
  Grid3X3, 
  Cpu, 
  BookOpen, 
  Eye, 
  Radar, 
  SunMedium, 
  Activity, 
  Binary, 
  ChevronRight,
  Info
} from 'lucide-react'

import GlassPanel from '../common/GlassPanel'
import Button from '../common/Button'
import Badge from '../common/Badge'

import { 
  satelliteBenchmarkDatasets, 
  SENSOR_MODALITIES, 
  BENCHMARK_TASKS 
} from '../../data/satelliteBenchmarkDatasets'

/**
 * Satellite Dataset & Benchmark Knowledge Catalog
 * Engineered from the "Awesome Satellite Imagery Datasets" Open Remote Sensing Archive.
 * 
 * Provides scientific clarity on sensor ground truth, spatial GSD, spectral bands,
 * and direct quantitative mappings into the Web Audio procedural sonification engine.
 */
export default function SatelliteDatasetCatalog({
  onSelectBenchmark,
  currentTrackId,
  isPlaying,
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedModality, setSelectedModality] = useState('All Modalities')
  const [selectedTask, setSelectedTask] = useState('All Tasks')
  const [resolutionFilter, setResolutionFilter] = useState('all') // 'all' | 'vhr' | 'high' | 'moderate' | 'planetary'
  const [viewMode, setViewMode] = useState('cards') // 'cards' | 'table'
  const [activeModalBenchmark, setActiveModalBenchmark] = useState(null)
  const [activeNotification, setActiveNotification] = useState(null)

  // Filter datasets based on search, modality, task, and resolution tier
  const filteredDatasets = satelliteBenchmarkDatasets.filter((item) => {
    const matchesModality =
      selectedModality === 'All Modalities' || item.modality === selectedModality

    const matchesTask =
      selectedTask === 'All Tasks' || item.task === selectedTask

    const matchesResolution =
      resolutionFilter === 'all' || item.resolutionTier === resolutionFilter

    const query = searchTerm.toLowerCase().trim()
    const matchesSearch =
      !query ||
      item.title.toLowerCase().includes(query) ||
      item.subtitle.toLowerCase().includes(query) ||
      item.organization.toLowerCase().includes(query) ||
      item.sensor.toLowerCase().includes(query) ||
      item.spatialResolution.toLowerCase().includes(query) ||
      item.spectralBands.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query)

    return matchesModality && matchesTask && matchesResolution && matchesSearch
  })

  // Trigger procedural sonification of benchmark sensor telemetry
  const handleAudify = (benchmark) => {
    if (onSelectBenchmark) {
      onSelectBenchmark({
        id: benchmark.id,
        title: `${benchmark.title} (Sensor Profile)`,
        region: benchmark.organization,
        coordinates: "Global Remote Sensing Benchmark",
        satellite: benchmark.sensor,
        sensor: benchmark.sensor,
        category: benchmark.task,
        suggestedStyle: benchmark.suggestedStyle || "ambient_earth",
        frequencyRange: "30 Hz - 4.2 kHz",
        description: benchmark.description,
        analysisData: benchmark.analysisData,
      })
    }
    setActiveNotification(benchmark.title)
    setTimeout(() => {
      setActiveNotification(null)
    }, 3800)
  }

  return (
    <div className="space-y-8">
      
      {/* Floating Audio Engagement Pill */}
      <AnimatePresence>
        {activeNotification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-4 sm:right-8 z-50 p-4 rounded-xl glass-panel-elevated border border-cyan-400/50 text-xs shadow-2xl flex items-center space-x-3 max-w-md bg-slate-950/95"
          >
            <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="font-mono text-[10px] text-cyan-300 font-bold uppercase block">
                BENCHMARK TELEMETRY LOADED IN AUDIO SYNTHESIZER
              </span>
              <p className="text-slate-100 font-semibold truncate max-w-[280px]">
                {activeNotification}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scientific Clarity & Acoustic Mapping HUD Banner */}
      <GlassPanel variant="elevated" className="p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center space-x-2">
              <Badge variant="cyan" size="sm">OPEN REMOTE SENSING BENCHMARKS</Badge>
              <span className="font-mono text-xs text-slate-400">
                CURATED FROM AWESOME-SATELLITE-IMAGERY-DATASETS
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
              Open Satellite Datasets & Sensor Clarity Hub
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-light">
              Explore gold-standard deep learning and remote sensing benchmark datasets (SEN12MS, EuroSAT, SpaceNet, PASTIS, xView, BigEarthNet). Each entry provides verified sensor ground truth, spatial resolution tiers, and mathematical rules mapping physical spectral bands to acoustic synthesis.
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/70 p-3 rounded-2xl border border-slate-800/80 font-mono text-xs shrink-0 w-full lg:w-auto">
            <div className="p-2">
              <span className="text-[10px] text-slate-500 uppercase block">BENCHMARKS</span>
              <span className="text-cyan-400 font-bold text-base">{satelliteBenchmarkDatasets.length} ACTIVE</span>
            </div>
            <div className="p-2">
              <span className="text-[10px] text-slate-500 uppercase block">MODALITIES</span>
              <span className="text-emerald-400 font-bold text-base">5 SENSOR TYPES</span>
            </div>
            <div className="p-2">
              <span className="text-[10px] text-slate-500 uppercase block">RESOLUTION</span>
              <span className="text-sky-300 font-bold text-base">0.02m - 1km</span>
            </div>
            <div className="p-2">
              <span className="text-[10px] text-slate-500 uppercase block">AUDIFICATION</span>
              <span className="text-purple-300 font-bold text-base">PROCEDURAL</span>
            </div>
          </div>
        </div>

        {/* Remote Sensing to Acoustic Physics Principles */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">
          <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/60 space-y-1">
            <div className="flex items-center space-x-1.5 text-cyan-400 font-bold">
              <Radar className="w-3.5 h-3.5" />
              <span>SAR RADAR (C/X-BAND)</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              VV/VH microwave backscatter maps to 40–90 Hz sub-bass FM synthesis, revealing structural roughness under all weather.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/60 space-y-1">
            <div className="flex items-center space-x-1.5 text-emerald-400 font-bold">
              <SunMedium className="w-3.5 h-3.5" />
              <span>MULTISPECTRAL (10M-30M)</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              NDVI (NIR/Red) and Red-Edge reflectance drive resonant bandpass filters (350 Hz - 2.4 kHz) and harmonic overtone spread.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/60 space-y-1">
            <div className="flex items-center space-x-1.5 text-amber-400 font-bold">
              <Binary className="w-3.5 h-3.5" />
              <span>VHR OPTICAL (0.3M-1M)</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              Sub-meter building footprints and high edge density trigger rapid 16th-note arpeggiator clock subdivisions.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/60 space-y-1">
            <div className="flex items-center space-x-1.5 text-rose-400 font-bold">
              <Activity className="w-3.5 h-3.5" />
              <span>THERMAL RADIANCE (MW)</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              Middle-infrared fire radiative power drives tube saturation, analog warmth index, and pyrogenic stochastic clicks.
            </p>
          </div>
        </div>
      </GlassPanel>

      {/* Filter and View Controls */}
      <div className="space-y-4">
        
        {/* Search Bar, Resolution Tier Filter & View Mode Switch */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search benchmarks by sensor (Sentinel, SAR, WorldView), task, or author..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono shadow-inner"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 font-mono text-xs"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {/* Resolution Selector */}
            <select
              value={resolutionFilter}
              onChange={(e) => setResolutionFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 font-mono focus:outline-none focus:border-cyan-400"
            >
              <option value="all">All Spatial Resolutions</option>
              <option value="vhr">VHR Sub-Meter (&le; 1m)</option>
              <option value="high">High Resolution (1m - 10m)</option>
              <option value="moderate">Moderate Resolution (10m - 30m)</option>
              <option value="planetary">Planetary Scale (&gt; 30m)</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-900/80 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-lg text-xs font-mono transition-colors ${
                  viewMode === 'cards'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Card Grid View"
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs font-mono transition-colors ${
                  viewMode === 'table'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Scientific Comparison Table"
              >
                <Table className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Modality Filter Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
          {SENSOR_MODALITIES.map((mod) => {
            const isSelected = selectedModality === mod
            return (
              <button
                key={mod}
                onClick={() => setSelectedModality(mod)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono whitespace-nowrap transition-all duration-200 shrink-0 ${
                  isSelected
                    ? 'bg-gradient-to-r from-cyan-500/25 to-blue-600/20 text-cyan-300 border border-cyan-400/40 font-bold shadow-md shadow-cyan-500/10'
                    : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-850/80 border border-slate-800'
                }`}
              >
                {mod}
              </button>
            )
          })}
        </div>

        {/* Task Filter Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
          {BENCHMARK_TASKS.map((tsk) => {
            const isSelected = selectedTask === tsk
            return (
              <button
                key={tsk}
                onClick={() => setSelectedTask(tsk)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono whitespace-nowrap transition-all duration-200 shrink-0 ${
                  isSelected
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 font-bold'
                    : 'bg-slate-900/40 text-slate-400 hover:text-slate-200 border border-slate-800/80'
                }`}
              >
                {tsk}
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Content Area: Cards or Table */}
      {filteredDatasets.length > 0 ? (
        viewMode === 'cards' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDatasets.map((bench) => {
              const isSelected = currentTrackId === bench.id

              return (
                <GlassPanel
                  key={bench.id}
                  className={`p-6 flex flex-col justify-between transition-all duration-300 space-y-4 hover:border-cyan-500/40 ${
                    isSelected ? 'ring-2 ring-cyan-400/60 border-cyan-400 bg-slate-900/95' : ''
                  }`}
                >
                  <div className="space-y-3">
                    {/* Top Row: Year, Task Badge, and Spatial GSD */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <Badge variant="cyan" size="sm">
                          {bench.year}
                        </Badge>
                        <Badge variant="outline" size="sm">
                          {bench.task}
                        </Badge>
                      </div>
                      <span className="font-mono text-[10px] text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                        {bench.spatialResolution.split(' ')[0]} {bench.spatialResolution.split(' ')[1]}
                      </span>
                    </div>

                    {/* Title & Organization */}
                    <div>
                      <h3 className="text-base font-bold text-slate-100 group-hover:text-cyan-300 transition-colors leading-snug">
                        {bench.title}
                      </h3>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">
                        {bench.organization}
                      </p>
                    </div>

                    {/* Sensor Specifications Grid */}
                    <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/70 font-mono text-[11px] space-y-1.5">
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-slate-500">SENSOR:</span>
                        <span className="text-cyan-300 font-semibold truncate max-w-[180px]">
                          {bench.sensor}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-slate-500">BANDS:</span>
                        <span className="text-slate-300 truncate max-w-[180px]">
                          {bench.spectralBands}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-slate-500">CADENCE:</span>
                        <span className="text-slate-300">
                          {bench.revisitCadence}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-slate-500">VOLUME:</span>
                        <span className="text-emerald-300 font-medium truncate max-w-[180px]">
                          {bench.volume}
                        </span>
                      </div>
                    </div>

                    {/* Sonification Mapping Highlight */}
                    <div className="p-2.5 rounded-xl bg-cyan-950/20 border border-cyan-800/30 text-[11px] font-mono space-y-1">
                      <div className="flex items-center space-x-1.5 text-cyan-400 font-bold">
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>ACOUSTIC SYNTHESIS MAPPING</span>
                      </div>
                      <p className="text-slate-300 text-[10.5px] leading-relaxed line-clamp-2">
                        {bench.sonificationMapping.radarToBass || 
                         bench.sonificationMapping.bandEnergyToChords || 
                         bench.sonificationMapping.vhrEdgeToArpTempo || 
                         bench.sonificationMapping.frpToHarmonicDistortion ||
                         bench.sonificationMapping.cropCycleToTempo ||
                         Object.values(bench.sonificationMapping)[0]}
                      </p>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <Button
                      variant={isSelected ? "success" : "primary"}
                      size="sm"
                      onClick={() => handleAudify(bench)}
                      className="text-xs flex items-center space-x-1.5 flex-1"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>{isSelected && isPlaying ? "Synthesizing" : "Audify Profile"}</span>
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveModalBenchmark(bench)}
                      className="text-xs px-2.5"
                      title="Inspect Scientific Calibration & Papers"
                    >
                      <Info className="w-4 h-4 text-slate-400 hover:text-cyan-300" />
                    </Button>

                    <a
                      href={bench.datasetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-cyan-300 hover:border-cyan-500/30 transition-colors"
                      title="Open Official Dataset Repository"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </GlassPanel>
              )
            })}
          </div>
        ) : (
          /* Scientific Comparison Table View */
          <div className="overflow-x-auto rounded-2xl glass-panel border border-slate-800">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Benchmark & Organization</th>
                  <th className="py-3 px-3">Modality & Sensor</th>
                  <th className="py-3 px-3">GSD Resolution</th>
                  <th className="py-3 px-3">Spectral Bands</th>
                  <th className="py-3 px-3">Cadence & Volume</th>
                  <th className="py-3 px-3">Sonification Translation</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredDatasets.map((bench) => {
                  const isSelected = currentTrackId === bench.id
                  return (
                    <tr 
                      key={bench.id}
                      className={`hover:bg-slate-850/50 transition-colors ${
                        isSelected ? 'bg-cyan-950/20' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-100">{bench.title}</div>
                        <div className="text-[11px] text-slate-500">{bench.organization} ({bench.year})</div>
                      </td>
                      <td className="py-3.5 px-3">
                        <Badge variant="cyan" size="sm">{bench.modality}</Badge>
                        <div className="text-[10px] text-slate-400 mt-1">{bench.sensor}</div>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="text-emerald-400 font-bold">{bench.spatialResolution}</span>
                      </td>
                      <td className="py-3.5 px-3 text-[11px] text-slate-300 max-w-[160px] truncate">
                        {bench.spectralBands}
                      </td>
                      <td className="py-3.5 px-3 text-[11px]">
                        <div>{bench.revisitCadence}</div>
                        <div className="text-slate-500 text-[10px] truncate max-w-[140px]">{bench.volume}</div>
                      </td>
                      <td className="py-3.5 px-3 text-[11px] text-slate-400 max-w-[220px]">
                        <p className="line-clamp-2">
                          {Object.values(bench.sonificationMapping)[0]}
                        </p>
                      </td>
                      <td className="py-3.5 px-3 text-right space-x-2 whitespace-nowrap">
                        <button
                          onClick={() => handleAudify(bench)}
                          className="px-2.5 py-1.5 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/30 text-[11px] font-bold inline-flex items-center space-x-1"
                        >
                          <Volume2 className="w-3 h-3" />
                          <span>Audify</span>
                        </button>
                        <button
                          onClick={() => setActiveModalBenchmark(bench)}
                          className="px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
                          title="Details"
                        >
                          <Info className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )
      ) : (
        /* Empty State */
        <div className="p-12 rounded-2xl glass-panel text-center space-y-4">
          <Satellite className="w-12 h-12 text-slate-600 mx-auto" />
          <h4 className="text-base font-bold text-slate-300">
            No Remote Sensing Benchmarks Matched Your Criteria
          </h4>
          <p className="text-xs text-slate-500 font-mono max-w-md mx-auto">
            Try resetting your search query or switching modality and spatial resolution filters.
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setSearchTerm('')
              setSelectedModality('All Modalities')
              setSelectedTask('All Tasks')
              setResolutionFilter('all')
            }}
          >
            Reset Benchmark Filters
          </Button>
        </div>
      )}

      {/* Benchmark Detail & Scientific Provenance Modal */}
      <AnimatePresence>
        {activeModalBenchmark && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-3xl glass-panel-elevated p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto border border-cyan-500/30 shadow-2xl rounded-2xl"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between pb-4 border-b border-slate-800">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Badge variant="cyan" size="sm">{activeModalBenchmark.year}</Badge>
                    <Badge variant="outline" size="sm">{activeModalBenchmark.modality}</Badge>
                    <Badge variant="success" size="sm">{activeModalBenchmark.task}</Badge>
                  </div>
                  <h3 className="text-xl font-bold text-slate-100">
                    {activeModalBenchmark.title}
                  </h3>
                  <p className="text-xs text-cyan-400 font-mono">
                    {activeModalBenchmark.organization}
                  </p>
                </div>
                <button
                  onClick={() => setActiveModalBenchmark(null)}
                  className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800 text-sm font-mono"
                >
                  ✕
                </button>
              </div>

              {/* Description */}
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-light">
                {activeModalBenchmark.description}
              </p>

              {/* Technical Specifications Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950/70 p-4 rounded-xl border border-slate-800 font-mono text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">PLATFORM & SENSOR</span>
                  <span className="text-slate-200 font-bold">{activeModalBenchmark.sensor}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">SPATIAL RESOLUTION (GSD)</span>
                  <span className="text-emerald-400 font-bold">{activeModalBenchmark.spatialResolution}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">SPECTRAL BANDS</span>
                  <span className="text-slate-200">{activeModalBenchmark.spectralBands}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">REVISIT CADENCE</span>
                  <span className="text-slate-200">{activeModalBenchmark.revisitCadence}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">VOLUME / EXTENT</span>
                  <span className="text-slate-200">{activeModalBenchmark.volume}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">DATASET LICENSE</span>
                  <span className="text-sky-300">{activeModalBenchmark.license}</span>
                </div>
              </div>

              {/* Sonification Acoustic Mapping Physics */}
              <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-800/40 space-y-2 font-mono text-xs">
                <div className="flex items-center space-x-2 text-cyan-300 font-bold">
                  <Volume2 className="w-4 h-4" />
                  <span>ACOUSTIC TRANSLATION PROTOCOL</span>
                </div>
                <div className="space-y-1.5 text-slate-300 text-[11px] leading-relaxed">
                  {Object.entries(activeModalBenchmark.sonificationMapping).map(([key, val]) => (
                    <div key={key} className="flex items-start space-x-2">
                      <ChevronRight className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-slate-200 uppercase">{key.replace(/([A-Z])/g, ' $1')}:</strong>{' '}
                        <span>{val}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Attribution and Action Links */}
              <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <a
                    href={activeModalBenchmark.paperUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center space-x-1.5"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Scientific Paper / ArXiv</span>
                    <ExternalLink className="w-3 h-3 ml-0.5" />
                  </a>

                  <a
                    href={activeModalBenchmark.datasetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 hover:text-slate-100 flex items-center space-x-1.5"
                  >
                    <span>Download Repository</span>
                    <ExternalLink className="w-3 h-3 ml-0.5" />
                  </a>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    handleAudify(activeModalBenchmark)
                    setActiveModalBenchmark(null)
                  }}
                  className="text-xs flex items-center space-x-1.5"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Audify in Sound Studio</span>
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}
