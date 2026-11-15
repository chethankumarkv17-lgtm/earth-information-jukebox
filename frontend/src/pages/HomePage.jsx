import React from 'react'
import { motion } from 'framer-motion'
import { 
  Compass, 
  Radio, 
  Waves, 
  Cpu, 
  Accessibility, 
  Sparkles, 
  ArrowRight, 
  Satellite, 
  Globe2, 
  Volume2, 
  ShieldCheck, 
  Layers, 
  Sliders,
  CheckCircle2,
  Eye,
  Info,
  Split,
  Thermometer,
  CloudRain,
  Wind,
  Trees,
  Snowflake,
  ExternalLink,
  Database,
  Activity,
  Headphones
} from 'lucide-react'
import Button from '../components/common/Button'
import Badge from '../components/common/Badge'
import GlassPanel from '../components/common/GlassPanel'
import { nasaGalleryData } from '../data/nasaGallery'

// Google Earth 3D Cesium Globe
const CesiumGlobeViewer = React.lazy(() => import('../components/earth/CesiumGlobeViewer'))

/**
 * Flagship Landing Page — EARTH INFORMATION JUKEBOX
 * 2026 NASA Space Apps Challenge
 * 
 * Aesthetic: Apple product elegance + NASA scientific visualizations + Pro audio workstation
 */
export default function HomePage({ onNavigate, onSelectTrack }) {
  const featuredVisualizations = nasaGalleryData.slice(0, 4)

  // 6 Curated Flagship Datasets with strict scientific and sonification specifications
  const featuredEarthDatasets = [
    {
      id: 'temperature',
      title: 'Surface & 2m Air Temperature',
      sensor: 'MODIS / AIRS & MERRA-2',
      badge: 'THERMAL INFRARED',
      badgeVariant: 'amber',
      unit: '°C (Celsius)',
      range: '-30.0°C to +50.0°C',
      frequencyMapping: 'Acoustic Pitch: 65.4 Hz – 1046.5 Hz (MIDI 36–84 Pentatonic)',
      description: 'Global diurnal thermal oscillation and continental heating cycles captured by satellite radiometers.',
      icon: Thermometer,
      accent: 'amber'
    },
    {
      id: 'precipitation',
      title: 'Accumulated Precipitation & Dry Days',
      sensor: 'GPM Dual-Freq Radar & GPCP',
      badge: 'MICROWAVE RADIOMETER',
      badgeVariant: 'cyan',
      unit: 'mm / day',
      range: '0.0 mm to 120.0 mm/day',
      frequencyMapping: 'Droplet Pulse Rhythm: Silence on 0.0 mm dry days, accelerating percussive pulses on rainfall.',
      description: 'Convective rainfall deluges and seasonal drought rhythms measured by the Global Precipitation Measurement constellation.',
      icon: CloudRain,
      accent: 'cyan'
    },
    {
      id: 'wind_speed',
      title: '10-Meter Neutral Wind Velocity',
      sensor: 'NASA MERRA-2 Atmospheric Reanalysis',
      badge: 'ATMOSPHERIC DYNAMICS',
      badgeVariant: 'teal',
      unit: 'm/s (Meters / Second)',
      range: '0.0 m/s to 45.0 m/s',
      frequencyMapping: 'LFO Tremolo & Resonant Filter: 0.2 Hz gentle breeze flutter to 8.5 Hz gale oscillation.',
      description: 'Zonal jet stream velocities, maritime storm tracks, and tropospheric circulation patterns.',
      icon: Wind,
      accent: 'teal'
    },
    {
      id: 'vegetation',
      title: 'Vegetation Canopy Density (NDVI)',
      sensor: 'Landsat 9 & MODIS Terra 8-Day',
      badge: 'OPTICAL REFLECTANCE',
      badgeVariant: 'emerald',
      unit: 'NDVI Ratio (-0.2 to 1.0)',
      range: '0.00 to 0.95 Index',
      frequencyMapping: 'Harmonic Richness & Timbre: Pure sine wave on barren ground to rich multi-overtone saw on dense canopy.',
      description: 'Continental photosynthetic vitality, Amazon rainforest density, and agricultural greening seasons.',
      icon: Trees,
      accent: 'emerald'
    },
    {
      id: 'ocean_sst',
      title: 'Ocean SST & Thermal Current Drift',
      sensor: 'MUR SST Altimetry & JPL GHRSST',
      badge: 'OCEANOGRAPHIC HYDROLOGY',
      badgeVariant: 'blue',
      unit: '°C (Sea Surface Foundation)',
      range: '0.0°C to 34.0°C',
      frequencyMapping: 'Sub-Bass Foundation Drone: 43.6 Hz (F1) to 130.8 Hz (C3) with tidal amplitude swell.',
      description: 'El Niño-Southern Oscillation warm pools, Gulf Stream thermal boundaries, and thermohaline circulation.',
      icon: Waves,
      accent: 'blue'
    },
    {
      id: 'cryosphere',
      title: 'Cryosphere & Sea Ice Margin',
      sensor: 'NSIDC / Sentinel-1 SAR & ICESat-2',
      badge: 'POLAR RADAR ALTIMETRY',
      badgeVariant: 'indigo',
      unit: '10⁶ km² / Albedo Ratio',
      range: 'Polar ice extent & melt anomaly',
      frequencyMapping: 'Crystalline Bell Chime & Pitch Dispersion: High harmonic sparkle mirroring ice albedo reflectivity.',
      description: 'Greenland ice sheet summits, Antarctic shelf stability, and multi-decadal Arctic sea ice margin retreat.',
      icon: Snowflake,
      accent: 'indigo'
    }
  ]

  // 4-Step Scientific Sonification Pipeline
  const sonificationSteps = [
    {
      step: "01",
      title: "NASA Satellite Earth Observation",
      desc: "Multispectral sensors (MODIS, Landsat 9, GPM, SWOT) collect electromagnetic radiation across visible, infrared, microwave, and radar wavelengths from Low Earth Orbit.",
      icon: Satellite,
      badge: "DATA ACQUISITION",
    },
    {
      step: "02",
      title: "Scientific Matrix Calibration",
      desc: "Raw radiance measurements are calibrated into standard SI physical units: kinetic temperature (°C), precipitation (mm/day), wind velocity (m/s), and NDVI canopy index.",
      icon: Cpu,
      badge: "CALIBRATION",
    },
    {
      step: "03",
      title: "Acoustic & Frequency Mapping",
      desc: "Physical observations map mathematically to acoustic variables: temperature sets pitch frequency (Hz), precipitation controls droplet rhythm, and vegetation richness shapes harmonic timbre.",
      icon: Sliders,
      badge: "SONIC ALGORITHM",
    },
    {
      step: "04",
      title: "Universal Auditory Perception",
      desc: "Listeners discern ecological trends, diurnal oscillations, and climatic anomalies through auditory cognition — enabling both sighted and visually impaired researchers to experience planetary data.",
      icon: Waves,
      badge: "HUMAN EXPERIENCE",
    },
  ]

  // Data Source Attribution Matrix
  const dataSourceMatrix = [
    {
      name: "NASA GIBS",
      fullName: "Global Imagery Browse Services",
      coverage: "Near real-time full-resolution satellite imagery tiles (MODIS, VIIRS, Landsat 9)",
      latency: "< 3 hours",
      license: "Open Public Domain (NASA EOSDIS)"
    },
    {
      name: "NASA POWER",
      fullName: "Prediction of Worldwide Energy Resources",
      coverage: "Solar irradiance, surface meteorology, 2m temperature, relative humidity",
      latency: "Daily Synoptic",
      license: "Open Data Policy (NASA LaRC)"
    },
    {
      name: "ECMWF ERA5",
      fullName: "Fifth Generation Atmospheric Reanalysis",
      coverage: "Global hourly atmospheric reanalysis, wind velocity vectors, surface pressure from 1940 to present",
      latency: "Climatological",
      license: "Copernicus Open Access"
    },
    {
      name: "Copernicus Sentinel-2",
      fullName: "European Space Agency Optical Constellation",
      coverage: "10m to 60m high-resolution multispectral imagery for vegetation, coastal, and land cover monitoring",
      latency: "5-day revisit",
      license: "CC-BY 4.0 Open Data"
    },
    {
      name: "NSIDC Cryosphere",
      fullName: "National Snow and Ice Data Center",
      coverage: "Polar sea ice index, glacier velocity, snow water equivalent, and ice shelf albedo",
      latency: "Monthly / Daily",
      license: "NASA Distributed Active Archive"
    },
    {
      name: "NOAA Coral Reef Watch",
      fullName: "Satellite Bleaching & Ocean Thermal Monitoring",
      coverage: "Sea surface temperature anomalies, degree heating weeks, and global reef thermal stress",
      latency: "5km Daily",
      license: "NOAA NESDIS Public Data"
    }
  ]

  return (
    <div className="space-y-24 py-4">
      
      {/* =========================================================================
          HERO SECTION: PRODUCT LAUNCH AESTHETIC
          Clear Title, Subtitle Badge, Description, CTAs, Globe & Live Telemetry
         ========================================================================= */}
      <section className="relative min-h-[85vh] flex items-center justify-center pt-2 overflow-hidden">
        {/* Subtle atmospheric backdrop glow (pro audio / space aesthetic) */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[720px] bg-gradient-to-b from-cyan-500/10 via-blue-600/5 to-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Headlines & Call to Action */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="lg:col-span-7 space-y-6 text-center lg:text-left"
            >
              {/* Product Subtitle Badge */}
              <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full glass-panel border-cyan-400/30 text-cyan-300 text-xs font-mono tracking-wider uppercase shadow-md">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-bold text-slate-100">NASA SPACE APPS CHALLENGE 2026</span>
                <span className="text-slate-500">•</span>
                <span className="text-cyan-400">OPEN SCIENCE PLATFORM</span>
              </div>

              {/* Exact Flagship Title */}
              <div>
                <span className="block font-mono text-xs uppercase tracking-widest text-cyan-400 font-bold mb-2">
                  PLANETARY DATA SONIFICATION ENGINE
                </span>
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.08] text-slate-100">
                  EARTH INFORMATION<br />
                  <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-emerald-400 bg-clip-text text-transparent">
                    JUKEBOX
                  </span>
                </h1>
              </div>

              {/* Refined Scientific Description */}
              <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-light">
                Planetary satellite observations transformed into an auditory living symphony. From Amazon canopy photosynthesis to Arctic sea ice margins and Pacific ocean currents, experience calibrated NASA scientific datasets converted directly into living soundscapes.
              </p>

              {/* Primary & Secondary Call to Actions */}
              <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-3.5">
                <Button
                  variant="primary"
                  size="lg"
                  icon={Compass}
                  onClick={() => onNavigate('explore')}
                  className="w-full sm:w-auto shadow-xl shadow-cyan-500/25 bg-gradient-to-r from-cyan-500 to-blue-600 font-bold text-sm tracking-wide"
                >
                  EXPLORE EARTH
                </Button>

                <Button
                  variant="secondary"
                  size="lg"
                  icon={Headphones}
                  onClick={() => onNavigate('studio')}
                  className="w-full sm:w-auto font-bold text-sm border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10 tracking-wide"
                >
                  EXPERIENCE THE SOUND
                </Button>

                <Button
                  variant="secondary"
                  size="lg"
                  icon={Compass}
                  onClick={() => onNavigate('journey')}
                  className="w-full sm:w-auto text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/10 font-bold text-sm tracking-wide"
                >
                  Sound Journey
                </Button>

                <Button
                  variant="ghost"
                  size="lg"
                  icon={Split}
                  onClick={() => onNavigate('compare')}
                  className="w-full sm:w-auto text-slate-300 hover:text-cyan-300 font-bold text-sm"
                >
                  Compare Regions
                </Button>
              </div>

              {/* Live Scientific Telemetry Counters */}
              <div className="pt-6 grid grid-cols-3 gap-3 border-t border-slate-800/80 max-w-lg mx-auto lg:mx-0 text-left font-mono">
                <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">CONSTELLATION</span>
                  <p className="text-sm font-bold text-cyan-300">12 SATELLITES</p>
                  <span className="text-[9px] text-slate-400">MODIS, Landsat, GPM</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">AUDIO FIDELITY</span>
                  <p className="text-sm font-bold text-emerald-400">48.0 kHz 24-BIT</p>
                  <span className="text-[9px] text-slate-400">Web Audio API DSP</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">OPEN DATA</span>
                  <p className="text-sm font-bold text-sky-400">100% NASA EOSDIS</p>
                  <span className="text-[9px] text-slate-400">Zero Synthetic Bias</span>
                </div>
              </div>
            </motion.div>

            {/* Right Column: Google Earth 3D Cesium Globe Visual */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="lg:col-span-5 flex justify-center w-full"
            >
              <div className="relative w-full h-[480px] sm:h-[540px] rounded-3xl overflow-hidden border border-cyan-500/30 shadow-2xl bg-slate-950">
                <React.Suspense
                  fallback={
                    <div className="w-full h-full flex flex-col items-center justify-center space-y-3 font-mono text-cyan-400 bg-slate-950 p-6 text-center">
                      <Globe2 className="w-8 h-8 animate-spin" />
                      <span className="text-xs">INITIALIZING GOOGLE EARTH 3D CESIUM GLOBE...</span>
                    </div>
                  }
                >
                  <CesiumGlobeViewer onNavigate={onNavigate} mode="embedded" />
                </React.Suspense>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* =========================================================================
          FEATURED EARTH DATASETS SECTION (All 6 Datasets with Specs & Actions)
         ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center space-x-2 text-cyan-400 font-mono text-xs uppercase tracking-wider mb-2">
              <Database className="w-4 h-4" />
              <span>AUTHENTIC SATELLITE MEASUREMENTS</span>
            </div>
            <h2 className="text-3xl font-extrabold text-slate-100 tracking-tight">
              Featured Earth Datasets
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Six foundational Earth observation domains converted mathematically from NASA sensor matrices into acoustic spectral variables.
            </p>
          </div>

          <Button
            variant="secondary"
            size="sm"
            icon={Compass}
            iconPosition="right"
            onClick={() => onNavigate('explore')}
          >
            Launch Full Explorer
          </Button>
        </div>

        {/* 6 Dataset Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {featuredEarthDatasets.map((ds) => {
            const Icon = ds.icon
            return (
              <GlassPanel
                key={ds.id}
                variant="interactive"
                className="flex flex-col justify-between h-full p-5 group"
                onClick={() => onNavigate('explore')}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant={ds.badgeVariant} size="sm">{ds.badge}</Badge>
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-cyan-400 group-hover:scale-110 transition-transform">
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-slate-100 group-hover:text-cyan-300 transition-colors">
                      {ds.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {ds.description}
                    </p>
                  </div>

                  {/* Scientific & Sonification Specs */}
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 font-mono text-[11px] space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">SENSOR:</span>
                      <span className="text-slate-200 font-bold">{ds.sensor}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">PHYSICAL UNIT:</span>
                      <span className="text-emerald-400 font-bold">{ds.unit}</span>
                    </div>
                    <div className="pt-1 border-t border-slate-800/80">
                      <span className="text-slate-400 block text-[10px] mb-0.5">ACOUSTIC MAPPING:</span>
                      <span className="text-cyan-300 text-[10px] leading-tight block">{ds.frequencyMapping}</span>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="pt-4 border-t border-slate-800/80 flex items-center gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    className="flex-1 text-xs"
                    icon={Volume2}
                    onClick={(e) => {
                      e.stopPropagation()
                      onNavigate('studio')
                    }}
                  >
                    Sonify
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1 text-xs"
                    icon={Compass}
                    onClick={(e) => {
                      e.stopPropagation()
                      onNavigate('explore')
                    }}
                  >
                    Explore
                  </Button>
                </div>
              </GlassPanel>
            )
          })}
        </div>
      </section>

      {/* =========================================================================
          FEATURED NASA IMAGERY GALLERY PREVIEW
         ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center space-x-2 text-cyan-400 font-mono text-xs uppercase tracking-wider mb-2">
              <Satellite className="w-4 h-4" />
              <span>CURATED SATELLITE IMAGERY</span>
            </div>
            <h2 className="text-3xl font-extrabold text-slate-100 tracking-tight">
              Featured NASA Imagery
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Authentic high-resolution satellite imagery composites paired with multi-spectral sonification previews.
            </p>
          </div>

          <Button
            variant="secondary"
            size="sm"
            icon={ArrowRight}
            iconPosition="right"
            onClick={() => onNavigate('gallery')}
          >
            View Complete Gallery
          </Button>
        </div>

        {/* Visualizations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {featuredVisualizations.map((item) => (
            <GlassPanel
              key={item.id}
              variant="interactive"
              className="flex flex-col justify-between h-full p-4 group"
              onClick={() => onNavigate('explore')}
            >
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <Badge variant="cyan" size="sm">{item.category}</Badge>
                  <span className="font-mono text-[10px] text-slate-400">{item.mission}</span>
                </div>

                <h3 className="text-base font-bold text-slate-100 group-hover:text-cyan-300 transition-colors line-clamp-2 mb-2">
                  {item.title}
                </h3>

                <p className="text-xs text-slate-400 line-clamp-3 mb-3 leading-relaxed">
                  {item.imageDescription}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 space-y-2">
                <div className="flex justify-between items-center text-[11px] font-mono">
                  <span className="text-slate-400">SENSOR:</span>
                  <span className="text-slate-300 truncate max-w-[140px]">{item.instrument}</span>
                </div>
                <div className="flex justify-between items-center text-[11px] font-mono">
                  <span className="text-slate-400">MEASUREMENT:</span>
                  <span className="text-emerald-400 font-semibold">{item.sampleValue}</span>
                </div>

                <div className="pt-2">
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full text-xs"
                    icon={Volume2}
                    onClick={(e) => {
                      e.stopPropagation()
                      onNavigate('explore')
                    }}
                  >
                    Sonify Dataset
                  </Button>
                </div>
              </div>
            </GlassPanel>
          ))}
        </div>
      </section>

      {/* =========================================================================
          HOW EARTH SONIFICATION WORKS: 4-STEP PIPELINE
         ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <GlassPanel variant="elevated" className="p-8 sm:p-12 relative overflow-hidden">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-3xl mb-12 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start space-x-2 text-cyan-400 font-mono text-xs uppercase tracking-wider mb-2">
              <Cpu className="w-4 h-4" />
              <span>SCIENTIFIC METHODOLOGY</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-100 tracking-tight">
              How Earth Sonification Works
            </h2>
            <p className="text-sm sm:text-base text-slate-300 mt-2 leading-relaxed">
              Sonification translates non-speech planetary data into acoustic signals. Rather than arbitrary sound effects, every frequency, rhythm, and overtone is mathematically mapped to authentic NASA Earth observation measurements.
            </p>
          </div>

          {/* 4-Step Scientific Pipeline */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {sonificationSteps.map((s) => {
              const Icon = s.icon
              return (
                <div
                  key={s.step}
                  className="bg-slate-950/60 p-6 rounded-2xl border border-cyan-500/15 relative flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-2xl font-black text-cyan-400/40">
                      {s.step}
                    </span>
                    <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  <div>
                    <span className="font-mono text-[9px] uppercase tracking-wider text-emerald-400 font-bold block mb-1">
                      {s.badge}
                    </span>
                    <h3 className="text-base font-bold text-slate-100 mb-2">
                      {s.title}
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {s.desc}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Scientific Validation Banner */}
          <div className="mt-8 p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-3 text-cyan-300">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>
                <strong>Zero Synthetic Bias:</strong> All sonification mappings preserve mathematical proportion and spectral truth without deceptive sonic alteration.
              </span>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onNavigate('studio')}
            >
              Explore Studio Parameters
            </Button>
          </div>
        </GlassPanel>
      </section>

      {/* =========================================================================
          UNIVERSAL ACCESSIBILITY MISSION SECTION
         ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center space-x-2 text-cyan-400 font-mono text-xs uppercase tracking-wider">
              <Accessibility className="w-4 h-4" />
              <span>UNIVERSAL INCLUSION</span>
            </div>
            <h2 className="text-3xl font-extrabold text-slate-100 tracking-tight">
              Science for Every Sensory Modality
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              NASA planetary visualizations are predominantly visual graphs and satellite images, excluding millions of blind and visually impaired science enthusiasts. EARTH INFORMATION JUKEBOX democratizes Earth data through an audio-first multisensory architecture.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-start space-x-3 text-xs text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Auditory Sensory Substitution:</strong> Blind users perceive deforestation patterns, hurricane wind speeds, and glacial melt through pitch contours and stereo panning.
                </span>
              </div>
              <div className="flex items-start space-x-3 text-xs text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Deaf & Hard-of-Hearing Visualization:</strong> High-contrast real-time oscilloscope wave tracks and multi-band frequency equalizers provide visual acoustic rhythm.
                </span>
              </div>
              <div className="flex items-start space-x-3 text-xs text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Full WCAG 2.2 AAA Compliance:</strong> Colorblind-safe palettes (Viridis / Cividis), keyboard navigation, semantic ARIA landmarks, and screen-reader announcements.
                </span>
              </div>
            </div>

            <div className="pt-2">
              <Button
                variant="primary"
                size="md"
                icon={Accessibility}
                onClick={() => onNavigate('accessibility')}
              >
                Open Accessibility Center
              </Button>
            </div>
          </div>

          <div className="lg:col-span-7">
            <GlassPanel variant="elevated" className="p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <Eye className="w-4 h-4 text-cyan-400" />
                  <h4 className="text-sm font-bold text-slate-100">Live Sensory Modality Options</h4>
                </div>
                <Badge variant="emerald" size="sm">WCAG AAA READY</Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                  <span className="font-mono text-[10px] text-cyan-400 block mb-1 font-bold">SCREEN READER TRANSCRIPTS</span>
                  <p className="text-slate-400 leading-relaxed">Semantic ARIA landmarks and dynamic live-region announcements for every frequency shift.</p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                  <span className="font-mono text-[10px] text-emerald-400 block mb-1 font-bold">REDUCED MOTION SAFEGUARDS</span>
                  <p className="text-slate-400 leading-relaxed">Respects system prefers-reduced-motion to prevent vestibular disorientation.</p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                  <span className="font-mono text-[10px] text-sky-400 block mb-1 font-bold">VIRIDIS COLORBLIND SPECTRA</span>
                  <p className="text-slate-400 leading-relaxed">Perceptually uniform color progressions optimized for deuteranopia and protanopia.</p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                  <span className="font-mono text-[10px] text-amber-400 block mb-1 font-bold">AUDITORY GRAPHING ENGINE</span>
                  <p className="text-slate-400 leading-relaxed">Step-by-step sonified data cursor allowing non-visual data trend inspection.</p>
                </div>
              </div>
            </GlassPanel>
          </div>

        </div>
      </section>

      {/* =========================================================================
          DATA-SOURCE ATTRIBUTION MATRIX
         ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <GlassPanel className="p-8 sm:p-10 relative overflow-hidden">
          <div className="mb-8">
            <div className="flex items-center space-x-2 text-cyan-400 font-mono text-xs uppercase tracking-wider mb-2">
              <Layers className="w-4 h-4" />
              <span>OPEN SCIENTIFIC DATA CITATIONS</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
              Data-Source Attribution Matrix
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Authentic scientific provenance across NASA, ESA, ECMWF, and NOAA observation networks.
            </p>
          </div>

          {/* Attribution Table / Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dataSourceMatrix.map((src) => (
              <div
                key={src.name}
                className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-sm text-cyan-300">{src.name}</span>
                  <span className="text-[10px] font-mono text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                    {src.latency}
                  </span>
                </div>
                <div className="text-[11px] font-bold text-slate-200">{src.fullName}</div>
                <p className="text-slate-400 text-[11px] leading-relaxed">{src.coverage}</p>
                <div className="pt-2 border-t border-slate-800/80 text-[10px] font-mono text-slate-400">
                  LICENSE: {src.license}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-2 text-xs font-mono text-slate-400">
              <Globe2 className="w-4 h-4 text-cyan-400" />
              <span>PROJECT LEAD: 2026 NASA SPACE APPS CHALLENGE FULL-STACK DEVELOPMENT TEAM</span>
            </div>
            <Button
              variant="secondary"
              size="sm"
              icon={Info}
              onClick={() => onNavigate('about')}
            >
              Read Architecture & Research Documentation
            </Button>
          </div>
        </GlassPanel>
      </section>

    </div>
  )
}