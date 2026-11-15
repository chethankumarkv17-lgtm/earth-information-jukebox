import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Palette, 
  Sun, 
  BarChart3, 
  Grid3X3, 
  Sliders, 
  Layers, 
  ShieldCheck, 
  Activity, 
  Cpu, 
  Eye, 
  Sparkles, 
  FileDiff, 
  Info,
  Maximize2,
  CheckCircle2,
  AlertTriangle,
  Waves,
  Play
} from 'lucide-react'

import GlassPanel from '../common/GlassPanel'
import Badge from '../common/Badge'
import Button from '../common/Button'
import SonificationEnginePanel from '../studio/SonificationEnginePanel'

/**
 * Computer Vision Analysis Dashboard (Phase 5)
 * Displays dominant colors, brightness, pixel distributions, regional statistics,
 * consecutive frame differences, and scientific legend calibration.
 */
export default function AnalysisDashboard({
  analysisData,
  onRecalibrate,
  isRecalibrating = false,
  onCompareWithPreviousFrame,
  hasPreviousFrame = false,
}) {
  const [selectedTab, setSelectedTab] = useState('optical') // 'optical' | 'regional' | 'frame-diff' | 'features'
  const [selectedZone, setSelectedZone] = useState(null)
  
  // Calibration Local State
  const [calibrationPreset, setCalibrationPreset] = useState(
    analysisData?.scientific_interpretation?.calibration_scheme?.includes('NDVI') ? 'NDVI' :
    analysisData?.scientific_interpretation?.calibration_scheme?.includes('SST') ? 'SST' :
    analysisData?.scientific_interpretation?.calibration_scheme?.includes('CO2') ? 'CO2' :
    analysisData?.scientific_interpretation?.calibration_scheme?.includes('Ice') ? 'ICE_ALTIMETRY' :
    analysisData?.scientific_interpretation?.calibration_scheme?.includes('Custom') ? 'CUSTOM' : 'None'
  )
  const [customMin, setCustomMin] = useState(0)
  const [customMax, setCustomMax] = useState(100)
  const [customUnit, setCustomUnit] = useState('Units')

  if (!analysisData) return null

  const {
    optical_features,
    regional_statistics,
    frame_difference,
    normalized_features,
    scientific_interpretation,
    processing_diagnostics,
    image_metadata,
    thumbnail_base64,
  } = analysisData

  const rgb = optical_features.rgb_statistics
  const brightness = optical_features.brightness_metrics
  const colorDist = optical_features.color_distribution
  const intensity = optical_features.pixel_intensity
  const spatial = optical_features.spatial_distribution

  // Handle calibration change trigger
  const handleApplyCalibration = (scheme) => {
    setCalibrationPreset(scheme)
    if (onRecalibrate) {
      onRecalibrate({
        scheme,
        customMin: scheme === 'CUSTOM' ? customMin : undefined,
        customMax: scheme === 'CUSTOM' ? customMax : undefined,
        customUnit: scheme === 'CUSTOM' ? customUnit : undefined,
      })
    }
  }

  return (
    <div className="space-y-6">
      
      {/* 1. SCIENTIFIC LEGEND CALIBRATION & PHYSICAL DISTINCTION BANNER */}
      <GlassPanel variant="elevated" className="p-5 border-cyan-400/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-start space-x-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shrink-0">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs uppercase tracking-wider text-cyan-400 font-bold">
                  SCIENTIFIC LEGEND CALIBRATION
                </span>
                <Badge variant={scientific_interpretation.is_calibrated ? 'emerald' : 'neutral'} size="sm">
                  {scientific_interpretation.is_calibrated ? 'CALIBRATED SCALE' : 'OPTICAL ONLY'}
                </Badge>
              </div>
              <h3 className="text-sm font-bold text-slate-100 mt-0.5">
                Physical Measurement vs Optical Artifact Separation
              </h3>
            </div>
          </div>

          {/* Calibration Presets Selector */}
          <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px]">
            {[
              { id: 'None', label: 'Optical (Uncalibrated)' },
              { id: 'NDVI', label: 'NASA NDVI' },
              { id: 'SST', label: 'Ocean SST (°C)' },
              { id: 'CO2', label: 'CO2 (ppm)' },
              { id: 'ICE_ALTIMETRY', label: 'Ice Freeboard (m)' },
              { id: 'CUSTOM', label: 'Custom Range' },
            ].map((preset) => (
              <button
                key={preset.id}
                onClick={() => handleApplyCalibration(preset.id)}
                disabled={isRecalibrating}
                className={`px-2.5 py-1.5 rounded-lg transition-all ${
                  calibrationPreset === preset.id
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 font-bold shadow-sm'
                    : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Bounds Input if CUSTOM is active */}
        {calibrationPreset === 'CUSTOM' && (
          <div className="py-3 px-4 mt-3 rounded-xl bg-slate-950/70 border border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-3 items-center font-mono text-xs">
            <div>
              <span className="text-slate-500 text-[10px] block mb-1">MIN VALUE:</span>
              <input
                type="number"
                value={customMin}
                onChange={(e) => setCustomMin(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200"
              />
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block mb-1">MAX VALUE:</span>
              <input
                type="number"
                value={customMax}
                onChange={(e) => setCustomMax(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200"
              />
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block mb-1">UNIT LABEL:</span>
              <input
                type="text"
                value={customUnit}
                onChange={(e) => setCustomUnit(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200"
              />
            </div>
            <div className="pt-4 sm:pt-0">
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleApplyCalibration('CUSTOM')}
                className="w-full text-xs"
              >
                Apply Custom Range
              </Button>
            </div>
          </div>
        )}

        {/* Scientific Interpretation Output Readout */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          <div className="md:col-span-8 space-y-1">
            <span className="font-mono text-[10px] text-slate-400 uppercase tracking-wider block font-bold">
              SCIENTIFIC TRANSFER FUNCTION:
            </span>
            <p className="text-xs text-slate-200 font-mono">
              {scientific_interpretation.calibration_scheme} • {scientific_interpretation.calibration_confidence}
            </p>
            {scientific_interpretation.is_calibrated && (
              <div className="flex items-center space-x-3 pt-1 text-xs font-mono">
                <span className="text-slate-400">ESTIMATED MEAN:</span>
                <span className="text-emerald-400 font-bold text-sm">
                  {scientific_interpretation.estimated_mean_physical_value} {scientific_interpretation.measurement_unit}
                </span>
                <span className="text-slate-500">
                  (Range: {scientific_interpretation.estimated_min_physical_value} to {scientific_interpretation.estimated_max_physical_value})
                </span>
              </div>
            )}
          </div>

          <div className="md:col-span-4 bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-[10px] font-mono text-slate-400 space-y-1">
            <div className="flex items-center space-x-1 text-amber-400 font-bold">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>PHYSICAL TRUTH DISTINCTION</span>
            </div>
            <p className="leading-relaxed">
              Image pixel values are optical renderings and do not replace Level-1 calibrated scientific sensor products.
            </p>
          </div>
        </div>
      </GlassPanel>

      {/* 2. SUB-NAVIGATION TABS */}
      <div className="flex space-x-2 border-b border-slate-800 pb-2 overflow-x-auto">
        {[
          { id: 'sonification', label: 'Procedural Sonification Engine', icon: Waves },
          { id: 'optical', label: 'Color & Brightness Charts', icon: Palette },
          { id: 'regional', label: '3×3 Regional Spatial Analysis', icon: Grid3X3 },
          { id: 'frame-diff', label: 'Consecutive Frame Differences', icon: FileDiff },
          { id: 'features', label: '11D Normalized Feature Vector', icon: Cpu },
        ].map((tab) => {
          const Icon = tab.icon
          const isActive = selectedTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-mono transition-all shrink-0 select-none ${
                isActive
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* 2.5 TAB CONTENT: PROCEDURAL SONIFICATION ENGINE */}
      {selectedTab === 'sonification' && (
        <SonificationEnginePanel
          analysisData={analysisData}
        />
      )}

      {/* 3. TAB CONTENT: COLOR & BRIGHTNESS CHARTS */}
      {selectedTab === 'optical' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Dominant Colors Chart */}
          <GlassPanel title="Dominant Colors (OpenCV K-Means Clustering)" subtitle="K=5 SPECTRAL CENTROIDS" icon={Palette}>
            {/* Proportional Segmented Color Bar */}
            <div className="h-6 w-full rounded-xl overflow-hidden flex border border-slate-800 mb-4 shadow-inner">
              {colorDist.dominant_colors.map((c, i) => (
                <div
                  key={i}
                  style={{ width: `${c.percentage}%`, backgroundColor: c.hex }}
                  className="h-full relative group transition-all"
                  title={`${c.name}: ${c.percentage}% (${c.hex})`}
                />
              ))}
            </div>

            {/* Dominant Color Swatches List */}
            <div className="space-y-2 mb-4">
              {colorDist.dominant_colors.map((c, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs font-mono"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-5 h-5 rounded-lg border border-white/20 shadow-sm shrink-0"
                      style={{ backgroundColor: c.hex }}
                    />
                    <div>
                      <span className="text-slate-200 font-bold block">{c.name}</span>
                      <span className="text-slate-500 text-[10px]">RGB({c.rgb.join(', ')}) • {c.hex}</span>
                    </div>
                  </div>
                  <span className="text-cyan-300 font-bold">{c.percentage}%</span>
                </div>
              ))}
            </div>

            {/* Color Distribution Indices */}
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800 font-mono text-[11px] text-center">
              <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800">
                <span className="text-slate-500 text-[9px] block">MEAN HUE</span>
                <span className="text-cyan-300 font-bold">{colorDist.mean_hue_deg}°</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800">
                <span className="text-slate-500 text-[9px] block">WARMTH INDEX</span>
                <span className="text-amber-400 font-bold">{colorDist.warmth_index}</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800">
                <span className="text-slate-500 text-[9px] block">COLOR ENTROPY</span>
                <span className="text-emerald-400 font-bold">{colorDist.color_entropy}</span>
              </div>
            </div>
          </GlassPanel>

          {/* Brightness & Pixel Distribution Chart */}
          <GlassPanel title="Brightness & Pixel Intensity Distribution" subtitle="LUMINANCE & 16-BIN HISTOGRAM" icon={Sun}>
            
            {/* Luminance Metrics Bar */}
            <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 font-mono text-xs space-y-2 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">BT.601 STANDARD LUMINANCE:</span>
                <span className="text-slate-200 font-bold">{brightness.standard_luminance_bt601} / 255</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 via-cyan-400 to-amber-300 rounded-full"
                  style={{ width: `${brightness.normalized_brightness * 100}%` }}
                />
              </div>

              <div className="flex justify-between items-center pt-1 text-[11px]">
                <span className="text-slate-500">PERCEPTUAL LUMINANCE (BT.709):</span>
                <span className="text-cyan-300 font-bold">{brightness.perceptual_luminance_bt709}</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-500">DYNAMIC RANGE:</span>
                <span className="text-emerald-400 font-bold">{brightness.dynamic_range_db} dB</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-500">SHADOW / HIGHLIGHT CLIPPING:</span>
                <span className="text-amber-400">{brightness.shadow_clipping_pct}% / {brightness.highlight_clipping_pct}%</span>
              </div>
            </div>

            {/* 16-Bin Intensity Histogram Chart */}
            <div className="space-y-1 mb-4">
              <div className="flex justify-between font-mono text-[10px] text-slate-400 mb-1">
                <span>INTENSITY HISTOGRAM (16 BINS)</span>
                <span>MEDIAN: {intensity.median_intensity} • P25: {intensity.p25} • P75: {intensity.p75}</span>
              </div>
              
              <div className="h-28 w-full bg-slate-950 p-2 rounded-xl border border-slate-800 flex items-end gap-1 overflow-hidden">
                {intensity.intensity_histogram_16.map((val, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                    <div
                      className="w-full bg-gradient-to-t from-cyan-600 to-sky-300 rounded-t-sm transition-all group-hover:from-emerald-500 group-hover:to-cyan-300"
                      style={{ height: `${Math.max(4, val)}%` }}
                    />
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-7 bg-slate-900 border border-cyan-500/30 px-1 py-0.5 rounded text-[8px] font-mono text-cyan-300 z-10 pointer-events-none">
                      {val}%
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between font-mono text-[9px] text-slate-500 px-1">
                <span>0 (Deep Shadow)</span>
                <span>128 (Mid-Tone)</span>
                <span>255 (Full Saturation)</span>
              </div>
            </div>

            {/* RGB Energy Proportions & Correlations */}
            <div className="grid grid-cols-3 gap-2 font-mono text-[10px] text-center pt-2 border-t border-slate-800">
              <div className="p-2 rounded-lg bg-slate-950/70 border border-red-500/20">
                <span className="text-red-400 font-bold block">RED ENERGY</span>
                <span className="text-slate-200">{(rgb.red.proportion * 100).toFixed(1)}%</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-950/70 border border-emerald-500/20">
                <span className="text-emerald-400 font-bold block">GREEN ENERGY</span>
                <span className="text-slate-200">{(rgb.green.proportion * 100).toFixed(1)}%</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-950/70 border border-blue-500/20">
                <span className="text-sky-400 font-bold block">BLUE ENERGY</span>
                <span className="text-slate-200">{(rgb.blue.proportion * 100).toFixed(1)}%</span>
              </div>
            </div>

          </GlassPanel>

        </div>
      )}

      {/* 4. TAB CONTENT: 3x3 REGIONAL SPATIAL ANALYSIS */}
      {selectedTab === 'regional' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Interactive 3x3 Spatial Grid (7 cols) */}
          <div className="lg:col-span-7">
            <GlassPanel title="3×3 Spatial Partitioning Matrix" subtitle="GEOGRAPHIC REGIONAL STATISTICS" icon={Grid3X3}>
              <p className="text-xs text-slate-400 mb-4 font-mono">
                Click any geographical quadrant to inspect localized spectral brightness, RMS contrast, and edge entropy.
              </p>

              {/* 3x3 Grid */}
              <div className="grid grid-cols-3 gap-2.5 aspect-square max-w-md mx-auto p-2 bg-slate-950 rounded-2xl border border-slate-800">
                {regional_statistics.map((reg) => {
                  const isZoneActive = selectedZone?.zone_id === reg.zone_id

                  return (
                    <button
                      key={reg.zone_id}
                      onClick={() => setSelectedZone(reg)}
                      className={`p-3 rounded-xl border flex flex-col justify-between text-left transition-all relative overflow-hidden select-none ${
                        isZoneActive
                          ? 'border-cyan-400 bg-cyan-950/50 shadow-lg shadow-cyan-500/20 ring-2 ring-cyan-400/50'
                          : 'border-slate-800 bg-slate-900/60 hover:border-cyan-500/40 hover:bg-slate-900'
                      }`}
                    >
                      {/* Top Swatch Dot & ID */}
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-cyan-300">{reg.zone_id}</span>
                        <div
                          className="w-3.5 h-3.5 rounded-full border border-white/20 shadow"
                          style={{ backgroundColor: reg.dominant_color_hex }}
                        />
                      </div>

                      {/* Zone Name */}
                      <span className="text-[10px] text-slate-300 font-bold truncate mt-2">
                        {reg.zone_name}
                      </span>

                      {/* Brightness & Contrast */}
                      <div className="mt-2 pt-1 border-t border-slate-800/80 font-mono text-[9px] text-slate-400 flex justify-between">
                        <span>Bri: {reg.brightness}%</span>
                        <span>σ {reg.contrast_rms}</span>
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Spatial Centroid Telemetry */}
              <div className="mt-4 p-3 rounded-xl bg-slate-950/70 border border-slate-800 font-mono text-[11px] flex justify-between items-center text-slate-400">
                <span>CENTROID MOMENTS: X={spatial.centroid_x_norm} • Y={spatial.centroid_y_norm}</span>
                <span>TEXTURE VARIANCE: <strong className="text-cyan-400">{spatial.laplacian_texture_energy}</strong></span>
              </div>
            </GlassPanel>
          </div>

          {/* Detailed Selected Regional Inspector (5 cols) */}
          <div className="lg:col-span-5">
            <GlassPanel variant="elevated" title="Regional Inspector" subtitle="LOCALIZED SECTOR TELEMETRY" icon={Maximize2}>
              {selectedZone ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div>
                      <h4 className="text-base font-bold text-slate-100">{selectedZone.zone_name} Sector ({selectedZone.zone_id})</h4>
                      <p className="font-mono text-xs text-cyan-400">{selectedZone.grid_coords}</p>
                    </div>
                    <div
                      className="w-8 h-8 rounded-xl border border-white/20 shadow-md"
                      style={{ backgroundColor: selectedZone.dominant_color_hex }}
                    />
                  </div>

                  <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 font-mono text-xs space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-500">LOCAL BRIGHTNESS:</span>
                      <span className="text-slate-200 font-bold">{selectedZone.brightness}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">RMS CONTRAST:</span>
                      <span className="text-cyan-300 font-bold">σ {selectedZone.contrast_rms}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">EDGE DENSITY:</span>
                      <span className="text-amber-400 font-bold">{selectedZone.edge_density_pct}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">MEAN RGB:</span>
                      <span className="text-slate-300">[{selectedZone.mean_rgb.join(', ')}]</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">DOMINANT HEX:</span>
                      <span className="text-emerald-400 font-bold">{selectedZone.dominant_color_hex}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed font-mono">
                    Sector statistics are computed using OpenCV region-of-interest (ROI) bounding masks without altering original image data.
                  </p>
                </div>
              ) : (
                <div className="py-16 text-center text-xs font-mono text-slate-500 space-y-2">
                  <p>Click any quadrant on the 3×3 matrix to inspect localized spectral data.</p>
                </div>
              )}
            </GlassPanel>
          </div>

        </div>
      )}

      {/* 5. TAB CONTENT: CONSECUTIVE FRAME DIFFERENCES */}
      {selectedTab === 'frame-diff' && (
        <GlassPanel title="Temporal Frame Difference Analysis" subtitle="OPENCV cv2.absdiff & MOTION DELTA" icon={FileDiff}>
          {frame_difference && frame_difference.has_comparison ? (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              
              {/* Difference Heatmap Thumbnail */}
              <div className="md:col-span-5 flex flex-col items-center">
                {frame_difference.difference_thumbnail_base64 && (
                  <div className="w-full h-52 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 p-2 flex items-center justify-center">
                    <img
                      src={frame_difference.difference_thumbnail_base64}
                      alt="Temporal difference heatmap"
                      className="max-h-full max-w-full object-contain rounded"
                    />
                  </div>
                )}
                <span className="font-mono text-[10px] text-slate-400 mt-2">
                  MAGMA COLORMAP: Absolute Pixel Difference Heatmap
                </span>
              </div>

              {/* Quantitative Difference Metrics */}
              <div className="md:col-span-7 space-y-3 font-mono text-xs">
                <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-2.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">MEAN ABSOLUTE DIFFERENCE (MAD):</span>
                    <span className="text-cyan-400 font-bold">{frame_difference.mean_absolute_difference} / 255</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">MEAN SQUARED ERROR (MSE):</span>
                    <span className="text-slate-200">{frame_difference.mean_squared_error}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">PSNR (SIGNAL-TO-NOISE):</span>
                    <span className="text-emerald-400 font-bold">{frame_difference.psnr_db} dB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">NORMALIZED CHANGE MAGNITUDE:</span>
                    <span className="text-amber-400 font-bold">{(frame_difference.normalized_change_magnitude * 100).toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">CENTROID SHIFT:</span>
                    <span className="text-slate-300">{frame_difference.centroid_shift_norm}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-800">
                    <span className="text-slate-500">MOTION DETECTED:</span>
                    <span className={frame_difference.motion_detected ? "text-rose-400 font-bold" : "text-emerald-400"}>
                      {frame_difference.motion_detected ? "SIGNIFICANT PHENOMENON DRIFT" : "STABLE / QUASI-STATIC"}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-400 font-mono leading-relaxed">
                  Calculated by comparing the active observation frame against the preceding temporal swath to isolate dynamic geophysical transformations.
                </p>
              </div>

            </div>
          ) : (
            <div className="py-12 text-center text-xs font-mono text-slate-400 space-y-3">
              <FileDiff className="w-10 h-10 text-slate-600 mx-auto" />
              <p>No secondary temporal frame was uploaded for comparative delta analysis.</p>
              <p className="text-slate-500 text-[11px]">
                To analyze consecutive changes (such as seasonal vegetation flux or sea ice retreat), upload a second comparison frame in the Upload Studio.
              </p>
            </div>
          )}
        </GlassPanel>
      )}

      {/* 6. TAB CONTENT: 11D NORMALIZED NUMERICAL FEATURE VECTOR */}
      {selectedTab === 'features' && (
        <GlassPanel title="Normalized 11-Dimensional Feature Vector" subtitle="PARAMETRIC AUDIO SYNTHESIS MAPPING VECTOR" icon={Cpu}>
          <p className="text-xs text-slate-400 font-mono mb-4">
            These 11 numerical features are normalized strictly to <strong className="text-cyan-300">[0.0, 1.0]</strong> to modulate downstream sound synthesis oscillators, filter cutoffs, and spatial panning.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
            {[
              { label: 'BRIGHTNESS (Luminance)', val: normalized_features.brightness, color: 'bg-cyan-400' },
              { label: 'RED ENERGY PROPORTION', val: normalized_features.red_energy, color: 'bg-red-400' },
              { label: 'GREEN ENERGY PROPORTION', val: normalized_features.green_energy, color: 'bg-emerald-400' },
              { label: 'BLUE ENERGY PROPORTION', val: normalized_features.blue_energy, color: 'bg-sky-400' },
              { label: 'HUE MEAN (0° to 360°)', val: normalized_features.hue_mean, color: 'bg-amber-400' },
              { label: 'SATURATION MEAN', val: normalized_features.saturation_mean, color: 'bg-purple-400' },
              { label: 'COLOR SHANNON ENTROPY', val: normalized_features.color_entropy, color: 'bg-teal-400' },
              { label: 'CENTROID X (Horizontal)', val: normalized_features.centroid_x, color: 'bg-indigo-400' },
              { label: 'CENTROID Y (Vertical)', val: normalized_features.centroid_y, color: 'bg-blue-400' },
              { label: 'EDGE COMPLEXITY (Laplacian)', val: normalized_features.edge_density, color: 'bg-rose-400' },
              { label: 'CONTRAST DISPERSION', val: normalized_features.contrast, color: 'bg-yellow-400' },
            ].map((f, i) => (
              <div key={i} className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-slate-400">{f.label}</span>
                  <span className="text-slate-200 font-bold">{f.val}</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${f.color} rounded-full`}
                    style={{ width: `${f.val * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center text-[11px] font-mono text-slate-500">
            <span>DIAGNOSTICS: Processed in {processing_diagnostics.processing_time_ms} ms</span>
            <span>PIXELS: {processing_diagnostics.total_analyzed_pixels}</span>
          </div>
        </GlassPanel>
      )}

    </div>
  )
}
