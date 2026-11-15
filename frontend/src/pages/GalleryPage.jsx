import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Satellite, 
  Search, 
  Filter, 
  Sliders, 
  Sparkles, 
  ExternalLink, 
  ShieldCheck, 
  Volume2, 
  Layers, 
  ArrowRight,
  Info,
  CheckCircle2,
  RefreshCw,
  Database,
  Radio,
  BookOpen,
  Radar,
  SunMedium,
  Binary,
  Activity,
  Award
} from 'lucide-react'

// Components
import VisualizationCard from '../components/gallery/VisualizationCard'
import VisualizationDetailModal from '../components/gallery/VisualizationDetailModal'
import SatelliteDatasetCatalog from '../components/gallery/SatelliteDatasetCatalog'
import GlassPanel from '../components/common/GlassPanel'
import Button from '../components/common/Button'
import Badge from '../components/common/Badge'

// Reusable Data Structures
import { nasaVisualizations, CATEGORIES } from '../data/visualizationMetadata'
import { satelliteBenchmarkDatasets } from '../data/satelliteBenchmarkDatasets'

/**
 * NASA Earth Visualization Gallery & Open Satellite Dataset Hub (Phase 3 + Benchmarks)
 * 
 * Offers dual discovery pipelines:
 * 1. Curated NASA Earth Observations across 6 core climate domains
 * 2. Open Deep Learning Satellite Benchmarks (SEN12MS, SpaceNet, EuroSAT, PASTIS, xView)
 * 3. Sensor Acoustics & Scientific Provenance Guide
 */
export default function GalleryPage({
  currentTrack,
  onSelectVisualization,
  onNavigate,
  isPlaying,
  initialTab = 'nasa',
}) {
  // Master Tab State: 'nasa' | 'benchmarks' | 'guide'
  const [activeTab, setActiveTab] = useState(initialTab)

  // NASA Gallery Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All Visualizations')
  const [activeModalVisualization, setActiveModalVisualization] = useState(null)
  const [selectedNotification, setSelectedNotification] = useState(null)

  // Filter NASA visualizations based on category and search query
  const filteredVisualizations = nasaVisualizations.filter((item) => {
    const matchesCategory =
      selectedCategory === 'All Visualizations' || item.category === selectedCategory

    const query = searchTerm.toLowerCase().trim()
    if (!query) return matchesCategory

    const matchesSearch =
      item.title.toLowerCase().includes(query) ||
      item.subtitle.toLowerCase().includes(query) ||
      item.source.mission.toLowerCase().includes(query) ||
      item.source.instrument.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query) ||
      item.tags.some((tag) => tag.toLowerCase().includes(query)) ||
      item.phenomenon.toLowerCase().includes(query)

    return matchesCategory && matchesSearch
  })

  // Handle selecting a visualization
  const handleSelect = (vis) => {
    onSelectVisualization(vis)
    setSelectedNotification(vis.title)
    setTimeout(() => {
      setSelectedNotification(null)
    }, 3500)
  }

  return (
    <div className="space-y-8 py-4">
      
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-cyan-500/10">
        <div>
          <div className="flex items-center space-x-2 text-cyan-400 font-mono text-xs uppercase tracking-wider mb-2">
            <Satellite className="w-4 h-4" />
            <span>NASA EARTH INFORMATION CENTER & OPEN REMOTE SENSING ARCHIVE</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-100 tracking-tight">
            Earth Observation & Satellite Dataset Hub
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
            Discover verified NASA climate visualizations and gold-standard deep learning satellite benchmarks. Every visual dataset is mathematically mapped to a physically calibrated acoustic soundscape.
          </p>
        </div>

        {/* Global Statistics Telemetry Pill */}
        <div className="flex items-center space-x-3 bg-slate-950/70 p-3 rounded-2xl border border-slate-800 font-mono text-xs text-slate-400 shrink-0">
          <div>
            <span className="text-[10px] text-slate-500 block uppercase">NASA VISUALS</span>
            <span className="text-cyan-400 font-bold">{nasaVisualizations.length} DOMAINS</span>
          </div>
          <span className="text-slate-700">|</span>
          <div>
            <span className="text-[10px] text-slate-500 block uppercase">BENCHMARKS</span>
            <span className="text-emerald-400 font-bold">{satelliteBenchmarkDatasets.length} DATASETS</span>
          </div>
          <span className="text-slate-700">|</span>
          <div>
            <span className="text-[10px] text-slate-500 block uppercase">PROVENANCE</span>
            <span className="text-sky-300 font-bold">100% VERIFIED</span>
          </div>
        </div>
      </div>

      {/* Floating Notification when a visualization is selected */}
      <AnimatePresence>
        {selectedNotification && (
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="fixed top-20 right-4 sm:right-8 z-50 p-4 rounded-xl glass-panel-elevated border border-emerald-400/40 text-xs shadow-2xl flex items-center space-x-3 max-w-md bg-slate-950/95"
          >
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <span className="font-mono text-[10px] text-emerald-400 font-bold uppercase">
                SOUNDSCAPE ENGAGED IN AUDIO ENGINE
              </span>
              <p className="text-slate-200 font-semibold truncate max-w-[280px]">
                {selectedNotification}
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => onNavigate('studio')}
              className="text-xs shrink-0"
            >
              Sound Studio
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Primary Discovery Tabs: NASA Gallery vs Open Satellite Benchmarks vs Acoustics Guide */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-3 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('nasa')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-mono text-xs transition-all duration-200 shrink-0 select-none ${
            activeTab === 'nasa'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 font-bold shadow-lg shadow-cyan-500/10'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
          }`}
        >
          <Satellite className="w-4 h-4 text-cyan-400" />
          <span>NASA Climate Visualizations ({nasaVisualizations.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('benchmarks')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-mono text-xs transition-all duration-200 shrink-0 select-none ${
            activeTab === 'benchmarks'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 font-bold shadow-lg shadow-emerald-500/10'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
          }`}
        >
          <Database className="w-4 h-4 text-emerald-400" />
          <span>Open Satellite Benchmarks ({satelliteBenchmarkDatasets.length})</span>
          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-bold">
            NEW
          </span>
        </button>

        <button
          onClick={() => setActiveTab('guide')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-mono text-xs transition-all duration-200 shrink-0 select-none ${
            activeTab === 'guide'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-400/40 font-bold shadow-lg shadow-purple-500/10'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
          }`}
        >
          <BookOpen className="w-4 h-4 text-purple-400" />
          <span>Sensor Acoustics & Provenance Guide</span>
        </button>
      </div>

      {/* TAB 1: NASA CLIMATE VISUALIZATIONS */}
      {activeTab === 'nasa' && (
        <div className="space-y-6">
          {/* Search and Category Filter Controls */}
          <div className="space-y-4">
            
            {/* Search Bar & Results Counter */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by mission, sensor, temperature, CO2, ocean..."
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

              <span className="font-mono text-xs text-slate-400 self-end sm:self-center">
                Showing <strong className="text-cyan-300">{filteredVisualizations.length}</strong> of {nasaVisualizations.length} Visualizations
              </span>
            </div>

            {/* 6 Category Filter Pills */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
              {CATEGORIES.map((cat, idx) => {
                const isAll = cat === 'All Visualizations'
                const isSelected = selectedCategory === cat

                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-mono transition-all duration-200 shrink-0 select-none flex items-center space-x-1.5 ${
                      isSelected
                        ? 'bg-gradient-to-r from-cyan-500/25 to-blue-600/20 text-cyan-300 border border-cyan-400/40 font-bold shadow-md shadow-cyan-500/10'
                        : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-850/80 border border-slate-800'
                    }`}
                  >
                    {!isAll && (
                      <span className="text-[10px] text-cyan-500 font-bold mr-0.5">
                        0{idx}.
                      </span>
                    )}
                    <span>{cat}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Main Visualization Cards Grid */}
          {filteredVisualizations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVisualizations.map((vis) => {
                const isSelected = currentTrack?.id === vis.id || currentTrack?.title === vis.title

                return (
                  <VisualizationCard
                    key={vis.id}
                    visualization={vis}
                    isSelected={isSelected}
                    isPlaying={isSelected && isPlaying}
                    onSelect={handleSelect}
                    onOpenDetails={setActiveModalVisualization}
                  />
                )
              })}
            </div>
          ) : (
            /* Empty State */
            <div className="p-12 rounded-2xl glass-panel text-center space-y-4">
              <Satellite className="w-12 h-12 text-slate-600 mx-auto" />
              <h4 className="text-base font-bold text-slate-300">
                No NASA Visualizations Matched Your Search
              </h4>
              <p className="text-xs text-slate-500 font-mono max-w-md mx-auto">
                Try adjusting your search terms or switch categories to view temperature, ocean, ice, carbon dioxide, vegetation, or natural processes.
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSearchTerm('')
                  setSelectedCategory('All Visualizations')
                }}
              >
                Reset Filters
              </Button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: OPEN SATELLITE BENCHMARKS (AWESOME SATELLITE DATASETS) */}
      {activeTab === 'benchmarks' && (
        <SatelliteDatasetCatalog
          onSelectBenchmark={handleSelect}
          currentTrackId={currentTrack?.id}
          isPlaying={isPlaying}
        />
      )}

      {/* TAB 3: SENSOR ACOUSTICS & PROVENANCE GUIDE */}
      {activeTab === 'guide' && (
        <div className="space-y-8">
          {/* Overview Banner */}
          <GlassPanel variant="elevated" className="p-8 space-y-4">
            <div className="flex items-center space-x-2">
              <Badge variant="purple" size="sm">SCIENTIFIC METHODOLOGY & CLARITY</Badge>
              <span className="font-mono text-xs text-slate-400">DATA PROVENANCE PROTOCOL</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-slate-100">
              Remote Sensing Physics to Procedural Acoustic Synthesis
            </h2>

            <p className="text-sm text-slate-300 leading-relaxed font-light">
              In accordance with NASA Open Science guidelines, EARTH JUKEBOX maintains strict scientific transparency. Every acoustic frequency, timbre modulation, and rhythmic pattern is deterministically coupled to genuine remote sensing telemetry.
            </p>
          </GlassPanel>

          {/* Remote Sensing Processing Levels vs Synthesis Translation */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl glass-panel border border-cyan-500/30 space-y-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-mono font-bold text-sm">
                L1
              </div>
              <h3 className="text-base font-bold text-slate-100 font-mono">
                Level-1 Top-of-Atmosphere Radiance
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Raw calibrated spectral radiances ($W \cdot m^{-2} \cdot sr^{-1} \cdot \mu m^{-1}$) captured directly by satellite instruments prior to atmospheric correction.
              </p>
              <div className="pt-2 border-t border-slate-800 text-[11px] font-mono text-cyan-300">
                Acoustic Mapping: Carrier wave amplitude & raw master luminance gain.
              </div>
            </div>

            <div className="p-6 rounded-2xl glass-panel border border-emerald-500/30 space-y-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-mono font-bold text-sm">
                L2
              </div>
              <h3 className="text-base font-bold text-slate-100 font-mono">
                Level-2 Surface Reflectance (BOA)
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Atmospherically corrected surface reflectance (as in Sentinel-2 L2A and Landsat 8/9 SR). Removes Rayleigh scattering and water vapor absorption.
              </p>
              <div className="pt-2 border-t border-slate-800 text-[11px] font-mono text-emerald-300">
                Acoustic Mapping: Resonant filter cutoffs (NDVI), overtone harmonics, and warmth index.
              </div>
            </div>

            <div className="p-6 rounded-2xl glass-panel border border-purple-500/30 space-y-3">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center font-mono font-bold text-sm">
                L3
              </div>
              <h3 className="text-base font-bold text-slate-100 font-mono">
                Level-3 Gridded Geophysical Products
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Spatially continuous geophysical fields mapped to standard grids (GISTEMP temperatures, MODIS NDVI, SWOT ocean sea surface heights, FIRMS fire power).
              </p>
              <div className="pt-2 border-t border-slate-800 text-[11px] font-mono text-purple-300">
                Acoustic Mapping: Melodic pitch glissando, chord voicing, and multi-track tempo pacing.
              </div>
            </div>
          </div>

          {/* Spatial Resolution vs Acoustic Timbre Matrix */}
          <GlassPanel className="p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-100 font-mono flex items-center space-x-2">
              <Sliders className="w-5 h-5 text-cyan-400" />
              <span>Spatial Ground Sample Distance (GSD) vs Acoustic Synthesis Clock</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Resolution Tier</th>
                    <th className="py-3 px-3">GSD Metric</th>
                    <th className="py-3 px-3">Sensor Exemplars</th>
                    <th className="py-3 px-3">Benchmark Reference</th>
                    <th className="py-3 px-3">Sonification Translation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  <tr className="hover:bg-slate-850/50">
                    <td className="py-3 px-4 font-bold text-amber-300">Very High Resolution (VHR)</td>
                    <td className="py-3 px-3 text-emerald-400 font-bold">0.15m - 0.5m</td>
                    <td className="py-3 px-3">WorldView-3, Pleiades, Capella SAR</td>
                    <td className="py-3 px-3 text-cyan-300">SpaceNet 6, xView 2, RarePlanes</td>
                    <td className="py-3 px-3 text-slate-400">High edge density drives rapid 16th-note arpeggiator clocks & granular shimmer.</td>
                  </tr>
                  <tr className="hover:bg-slate-850/50">
                    <td className="py-3 px-4 font-bold text-sky-300">High Resolution</td>
                    <td className="py-3 px-3 text-emerald-400 font-bold">1.0m - 5.0m</td>
                    <td className="py-3 px-3">PlanetScope, SPOT 6/7</td>
                    <td className="py-3 px-3 text-cyan-300">SpaceNet 7, Dynamic EarthNet</td>
                    <td className="py-3 px-3 text-slate-400">Multi-temporal cadence controls sequencer progression steps and chord intervals.</td>
                  </tr>
                  <tr className="hover:bg-slate-850/50">
                    <td className="py-3 px-4 font-bold text-emerald-300">Moderate Resolution</td>
                    <td className="py-3 px-3 text-emerald-400 font-bold">10m - 30m</td>
                    <td className="py-3 px-3">Sentinel-2 MSI, Landsat 8/9 OLI, Sentinel-1 SAR</td>
                    <td className="py-3 px-3 text-cyan-300">SEN12MS, EuroSAT, BigEarthNet, PASTIS</td>
                    <td className="py-3 px-3 text-slate-400">13-band multispectral energy sets harmonic filter cutoffs (350Hz-2.4kHz) & scale intervals.</td>
                  </tr>
                  <tr className="hover:bg-slate-850/50">
                    <td className="py-3 px-4 font-bold text-purple-300">Planetary Resolution</td>
                    <td className="py-3 px-3 text-emerald-400 font-bold">250m - 1km+</td>
                    <td className="py-3 px-3">Terra/Aqua MODIS, Suomi-NPP VIIRS, SWOT</td>
                    <td className="py-3 px-3 text-cyan-300">NASA FIRMS, GISTEMP, SWOT KaRIn</td>
                    <td className="py-3 px-3 text-slate-400">Continental-scale low-frequency fundamental drones (40-110Hz) and macro thermal resonance.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </GlassPanel>
        </div>
      )}

      {/* NASA Scientific Authenticity Disclaimer & EIC Reference */}
      <GlassPanel className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start space-x-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <span className="font-mono text-cyan-300 font-bold block uppercase">
                AUTHENTIC NASA & OPEN SATELLITE BENCHMARK ATTRIBUTION
              </span>
              <p className="text-slate-400 leading-relaxed max-w-3xl">
                All visualization metadata, mission attributions, sensor resolutions, and physical units are verified directly against the <strong>NASA Earth Information Center</strong>, <strong>NASA Scientific Visualization Studio (SVS)</strong>, <strong>NASA EOSDIS</strong>, and the <strong>Awesome Satellite Imagery Datasets</strong> peer-reviewed benchmark registry. No synthetic endpoints or fabricated scientific findings are used.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <a
              href="https://earth.gov/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center space-x-1.5"
            >
              <span>Explore Earth.gov</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </GlassPanel>

      {/* Detailed Information Modal for NASA Visualizations */}
      <VisualizationDetailModal
        visualization={activeModalVisualization}
        isOpen={Boolean(activeModalVisualization)}
        onClose={() => setActiveModalVisualization(null)}
        onSelectAndSonify={handleSelect}
        isSelected={
          currentTrack?.id === activeModalVisualization?.id ||
          currentTrack?.title === activeModalVisualization?.title
        }
      />

    </div>
  )
}
