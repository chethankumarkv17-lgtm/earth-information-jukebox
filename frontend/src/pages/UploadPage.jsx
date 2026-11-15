import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Upload, 
  Image as ImageIcon, 
  Trash2, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Cpu, 
  Layers, 
  Waves, 
  Sliders, 
  ShieldCheck, 
  FileText, 
  Maximize2,
  Minimize2,
  Activity,
  ArrowRight,
  Palette,
  BarChart3,
  Sun,
  Grid3X3,
  FileDiff
} from 'lucide-react'

import GlassPanel from '../components/common/GlassPanel'
import Button from '../components/common/Button'
import Badge from '../components/common/Badge'
import AudioMeter from '../components/common/AudioMeter'
import AnalysisDashboard from '../components/analysis/AnalysisDashboard'

import { 
  uploadAndProcessImage, 
  analyzeEarthFrame,
  removeUploadedImage, 
  fetchProcessorStatus 
} from '../services/api'

/**
 * Computer Vision Analysis Engine & Upload Module (Phases 4 & 5)
 * Powered by Python FastAPI, OpenCV, and Pillow.
 */
export default function UploadPage({ onNavigate, onSelectSonificationTrack }) {
  const fileInputRef = useRef(null)
  const compareInputRef = useRef(null)
  
  // File & Preview States
  const [selectedFile, setSelectedFile] = useState(null)
  const [secondaryFile, setSecondaryFile] = useState(null)
  const [localPreviewUrl, setLocalPreviewUrl] = useState(null)
  const [secondaryPreviewUrl, setSecondaryPreviewUrl] = useState(null)
  
  // Processing States: 'idle' | 'validating' | 'uploading' | 'processing' | 'completed' | 'error'
  const [processingStatus, setProcessingStatus] = useState('idle')
  const [statusMessage, setStatusMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState(null)
  
  // Active Calibration State
  const [calibrationSettings, setCalibrationSettings] = useState({
    scheme: 'None',
    customMin: null,
    customMax: null,
    customUnit: null,
  })

  // Full Computer Vision Analysis Result from Backend
  const [cvAnalysisResult, setCvAnalysisResult] = useState(null)
  const [backendHealth, setBackendHealth] = useState(null)
  
  // Drag-and-drop hover state
  const [isDragOver, setIsDragOver] = useState(false)
  const [activeViewMode, setActiveViewMode] = useState('dashboard') // 'dashboard' | 'compact'

  // Fetch backend processor specs on mount
  useEffect(() => {
    async function checkStatus() {
      const status = await fetchProcessorStatus()
      if (status) setBackendHealth(status)
    }
    checkStatus()
  }, [])

  // Clean up object URLs on unmount or replace
  useEffect(() => {
    return () => {
      if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl)
      if (secondaryPreviewUrl) URL.revokeObjectURL(secondaryPreviewUrl)
    }
  }, [localPreviewUrl, secondaryPreviewUrl])

  // Handle File Ingestion and run Computer Vision Engine
  const handleFile = async (file, secondary = null, calibration = calibrationSettings) => {
    if (!file) return

    setErrorMessage(null)
    setCvAnalysisResult(null)

    // 1. Client-Side Format Validation
    const validExtensions = ['.png', '.jpg', '.jpeg']
    const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()
    
    if (!validExtensions.includes(fileExt)) {
      setProcessingStatus('error')
      setErrorMessage(`Unsupported format '${fileExt}'. Only PNG, JPG, and JPEG images are supported.`)
      return
    }

    // 2. Client-Side Size Validation (15 MB maximum)
    const maxSizeBytes = 15 * 1024 * 1024
    if (file.size > maxSizeBytes) {
      setProcessingStatus('error')
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2)
      setErrorMessage(`File size (${sizeMb} MB) exceeds maximum allowed limit of 15 MB.`)
      return
    }

    if (file.size === 0) {
      setProcessingStatus('error')
      setErrorMessage("The uploaded file is empty (0 bytes).")
      return
    }

    // Set local preview immediately
    setSelectedFile(file)
    const previewUrl = URL.createObjectURL(file)
    setLocalPreviewUrl(previewUrl)

    if (secondary) {
      setSecondaryFile(secondary)
      const secUrl = URL.createObjectURL(secondary)
      setSecondaryPreviewUrl(secUrl)
    }

    // 3. Initiate Upload & Computer Vision Engine Processing
    setProcessingStatus('uploading')
    setStatusMessage('Uploading observation frame to FastAPI backend...')

    try {
      setProcessingStatus('processing')
      setStatusMessage('Executing OpenCV K-Means, Moments, Canny & Spectral Matrix Analysis...')

      const result = await analyzeEarthFrame(file, secondary, calibration)
      
      setCvAnalysisResult(result)
      setProcessingStatus('completed')
      setStatusMessage(`Completed in ${result.processing_diagnostics.processing_time_ms} ms with OpenCV & Pillow.`)
    } catch (err) {
      setProcessingStatus('error')
      setErrorMessage(err.message || 'Failed to complete computer vision analysis on server.')
    }
  }

  // Handle Recalibration from Dashboard
  const handleRecalibrate = (newCalibration) => {
    setCalibrationSettings(newCalibration)
    if (selectedFile) {
      handleFile(selectedFile, secondaryFile, newCalibration)
    }
  }

  // Handle Remove Image
  const handleRemove = async () => {
    if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl)
    if (secondaryPreviewUrl) URL.revokeObjectURL(secondaryPreviewUrl)

    setSelectedFile(null)
    setSecondaryFile(null)
    setLocalPreviewUrl(null)
    setSecondaryPreviewUrl(null)
    setCvAnalysisResult(null)
    setProcessingStatus('idle')
    setErrorMessage(null)
    setStatusMessage('')

    if (fileInputRef.current) fileInputRef.current.value = ''
    if (compareInputRef.current) compareInputRef.current.value = ''
  }

  // Handle Replace Image
  const handleReplace = () => {
    handleRemove()
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  // Drag and Drop Event Handlers
  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  // Pre-Loaded Multi-Spectral NASA Tiles for 1-Click Testing
  const sampleTiles = [
    {
      name: "Amazon Canopy MODIS NDVI Tile",
      format: "PNG",
      color: "Biosphere Green",
      desc: "Vegetation greenness phenology test",
      calibration: "NDVI",
      action: async () => {
        const canvas = document.createElement('canvas')
        canvas.width = 1600
        canvas.height = 1000
        const ctx = canvas.getContext('2d')
        ctx.fillStyle = '#064e3b'
        ctx.fillRect(0, 0, 1600, 1000)
        // Canopy leaf variation
        ctx.fillStyle = '#10b981'
        for (let i = 0; i < 60; i++) {
          ctx.beginPath()
          ctx.arc(Math.random() * 1600, Math.random() * 1000, Math.random() * 80 + 20, 0, Math.PI * 2)
          ctx.fill()
        }
        canvas.toBlob((blob) => {
          const file = new File([blob], "amazon_canopy_modis_tile.png", { type: "image/png" })
          handleFile(file, null, { scheme: 'NDVI' })
        }, "image/png")
      }
    },
    {
      name: "Sahara Desert TIRS-2 Thermal Tile",
      format: "JPG",
      color: "Thermal Ochre",
      desc: "Surface temperature kinetic radiance",
      calibration: "SST",
      action: async () => {
        const canvas = document.createElement('canvas')
        canvas.width = 1400
        canvas.height = 900
        const ctx = canvas.getContext('2d')
        ctx.fillStyle = '#92400e'
        ctx.fillRect(0, 0, 1400, 900)
        ctx.fillStyle = '#f59e0b'
        for (let i = 0; i < 50; i++) {
          ctx.fillRect(Math.random() * 1400, Math.random() * 900, Math.random() * 200 + 40, Math.random() * 14 + 4)
        }
        canvas.toBlob((blob) => {
          const file = new File([blob], "sahara_dune_thermal_tile.jpg", { type: "image/jpeg" })
          handleFile(file, null, { scheme: 'SST' })
        }, "image/jpeg")
      }
    },
    {
      name: "Greenland Ice Sheet CryoSat Tile",
      format: "PNG",
      color: "Glacial Cyan",
      desc: "Albedo and polar sea ice freeboard",
      calibration: "ICE_ALTIMETRY",
      action: async () => {
        const canvas = document.createElement('canvas')
        canvas.width = 1800
        canvas.height = 1200
        const ctx = canvas.getContext('2d')
        ctx.fillStyle = '#082f49'
        ctx.fillRect(0, 0, 1800, 1200)
        ctx.fillStyle = '#38bdf8'
        for (let i = 0; i < 70; i++) {
          ctx.beginPath()
          ctx.ellipse(Math.random() * 1800, Math.random() * 1200, Math.random() * 90 + 30, Math.random() * 20 + 5, Math.random(), 0, Math.PI * 2)
          ctx.fill()
        }
        canvas.toBlob((blob) => {
          const file = new File([blob], "greenland_ice_sheet_cryosat.png", { type: "image/png" })
          handleFile(file, null, { scheme: 'ICE_ALTIMETRY' })
        }, "image/png")
      }
    },
    {
      name: "SEN12MS Sentinel-1/2 Multi-Sensor Tile",
      format: "PNG",
      color: "Radar & Optical",
      desc: "SAR backscatter & Sentinel-2 vegetation canopy",
      calibration: "NDVI",
      action: async () => {
        const canvas = document.createElement('canvas')
        canvas.width = 1600
        canvas.height = 1000
        const ctx = canvas.getContext('2d')
        ctx.fillStyle = '#1e293b'
        ctx.fillRect(0, 0, 1600, 1000)
        ctx.fillStyle = '#22c55e'
        for (let i = 0; i < 45; i++) {
          ctx.beginPath()
          ctx.rect(Math.random() * 1500, Math.random() * 900, Math.random() * 120 + 30, Math.random() * 80 + 20)
          ctx.fill()
        }
        ctx.fillStyle = '#38bdf8'
        for (let i = 0; i < 20; i++) {
          ctx.fillRect(Math.random() * 1500, Math.random() * 900, Math.random() * 40 + 10, Math.random() * 200 + 40)
        }
        canvas.toBlob((blob) => {
          const file = new File([blob], "sen12ms_sar_optical_tile.png", { type: "image/png" })
          handleFile(file, null, { scheme: 'NDVI' })
        }, "image/png")
      }
    },
    {
      name: "NASA FIRMS Wildfire Radiance Tile",
      format: "PNG",
      color: "Thermal Radiative",
      desc: "Middle-infrared active fire radiative power (MW)",
      calibration: "SST",
      action: async () => {
        const canvas = document.createElement('canvas')
        canvas.width = 1400
        canvas.height = 900
        const ctx = canvas.getContext('2d')
        ctx.fillStyle = '#1c1917'
        ctx.fillRect(0, 0, 1400, 900)
        ctx.fillStyle = '#ef4444'
        for (let i = 0; i < 35; i++) {
          ctx.beginPath()
          ctx.arc(Math.random() * 1400, Math.random() * 900, Math.random() * 60 + 15, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.fillStyle = '#f97316'
        for (let i = 0; i < 25; i++) {
          ctx.beginPath()
          ctx.arc(Math.random() * 1400, Math.random() * 900, Math.random() * 30 + 10, 0, Math.PI * 2)
          ctx.fill()
        }
        canvas.toBlob((blob) => {
          const file = new File([blob], "firms_wildfire_radiance_tile.png", { type: "image/png" })
          handleFile(file, null, { scheme: 'SST' })
        }, "image/png")
      }
    }
  ]

  // Consecutive Frame Comparison Test
  const handleCompareConsecutiveFrames = async () => {
    // Generate Frame A (T0) and Frame B (T1 with motion/difference)
    const c1 = document.createElement('canvas')
    c1.width = 800
    c1.height = 600
    const ctx1 = c1.getContext('2d')
    ctx1.fillStyle = '#0284c7'
    ctx1.fillRect(0, 0, 800, 600)
    ctx1.fillStyle = '#38bdf8'
    ctx1.beginPath()
    ctx1.arc(300, 300, 120, 0, Math.PI * 2)
    ctx1.fill()

    const c2 = document.createElement('canvas')
    c2.width = 800
    c2.height = 600
    const ctx2 = c2.getContext('2d')
    ctx2.fillStyle = '#0284c7'
    ctx2.fillRect(0, 0, 800, 600)
    ctx2.fillStyle = '#f59e0b'
    ctx2.beginPath()
    ctx2.arc(420, 320, 140, 0, Math.PI * 2) // Displaced center & changed color
    ctx2.fill()

    c1.toBlob((blobA) => {
      c2.toBlob((blobB) => {
        const fileA = new File([blobA], "frame_T0_swath.png", { type: "image/png" })
        const fileB = new File([blobB], "frame_T1_swath.png", { type: "image/png" })
        handleFile(fileA, fileB, { scheme: 'None' })
      }, "image/png")
    }, "image/png")
  }

  return (
    <div className="space-y-8 py-4 max-w-7xl mx-auto">
      
      {/* Page Title & Status Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-cyan-500/10">
        <div>
          <div className="flex items-center space-x-2 text-cyan-400 font-mono text-xs uppercase tracking-wider mb-1.5">
            <Cpu className="w-4 h-4" />
            <span>COMPUTER VISION ANALYSIS ENGINE & SCIENTIFIC INGESTION</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">
            Earth Visualization Vision Engine
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
            Multispectral frame decomposition powered by <strong>Python FastAPI</strong>, <strong>OpenCV</strong>, and <strong>Pillow</strong>. Extracts RGB histograms, K-Means dominant clusters, spatial centroids, 3×3 regional partitions, and consecutive frame deltas with scientific legend calibration.
          </p>
        </div>

        {/* Engine Specs Pill */}
        <div className="flex items-center space-x-2.5 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-400 shrink-0">
          <div className="flex items-center space-x-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>FASTAPI</span>
          </div>
          <span className="text-slate-700">|</span>
          <span className="text-slate-300">OPENCV {backendHealth?.opencv_version || "5.0.0"}</span>
          <span className="text-slate-700">|</span>
          <span className="text-cyan-300">PILLOW {backendHealth?.pillow_version || "13.0.0"}</span>
        </div>
      </div>

      {/* Error Alert Banner */}
      <AnimatePresence>
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/40 text-xs text-rose-200 flex items-start justify-between shadow-lg"
          >
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-mono uppercase text-rose-300 mb-0.5">Validation Failure:</strong>
                <p>{errorMessage}</p>
              </div>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-400 hover:text-white font-mono text-xs p-1"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload & Dropzone Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column (5 cols): File Ingestion & Preview */}
        <div className="lg:col-span-5 space-y-5">
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".png,.jpg,.jpeg,image/png,image/jpeg"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFile(e.target.files[0])
              }
            }}
            className="hidden"
          />

          {!selectedFile ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-8 rounded-2xl glass-panel border-2 border-dashed transition-all duration-300 text-center flex flex-col items-center justify-center cursor-pointer relative overflow-hidden select-none ${
                isDragOver
                  ? 'border-cyan-400 bg-cyan-950/40 shadow-[0_0_30px_rgba(6,182,212,0.25)]'
                  : 'border-cyan-500/30 hover:border-cyan-400/60 bg-slate-950/60 hover:bg-slate-900/60'
              }`}
            >
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center mb-3">
                <Upload className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-100 mb-1">
                Upload Earth Visualization Frame
              </h3>
              <p className="text-xs text-slate-400 max-w-xs mb-4 leading-relaxed">
                Supports PNG, JPG, JPEG (Max 15 MB). Analyzed with OpenCV and Pillow.
              </p>
              <Button variant="primary" size="sm" icon={Upload}>
                Browse Local Files
              </Button>
            </div>
          ) : (
            /* Active Image Preview Box */
            <div className="glass-panel p-4 rounded-2xl space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <ImageIcon className="w-4 h-4 text-cyan-400" />
                  <span className="font-mono text-xs text-slate-200 font-bold truncate max-w-[200px]">
                    {selectedFile.name}
                  </span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <Button variant="secondary" size="sm" icon={RefreshCw} onClick={handleReplace}>
                    Replace
                  </Button>
                  <Button variant="danger" size="sm" icon={Trash2} onClick={handleRemove}>
                    Remove
                  </Button>
                </div>
              </div>

              {/* Viewport */}
              <div className="relative w-full h-56 rounded-xl overflow-hidden bg-slate-950/90 border border-slate-800 flex items-center justify-center telemetry-grid">
                <img
                  src={localPreviewUrl}
                  alt={selectedFile.name}
                  className="max-w-full max-h-full object-contain"
                />

                {processingStatus === 'uploading' || processingStatus === 'processing' ? (
                  <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center space-y-2">
                    <div className="radar-scan-line" />
                    <div className="w-10 h-10 rounded-full border-2 border-dashed border-cyan-400 animate-spin" />
                    <span className="font-mono text-xs uppercase text-cyan-300 font-bold">
                      {statusMessage}
                    </span>
                  </div>
                ) : null}
              </div>

              {/* Status footer */}
              <div className="flex justify-between items-center text-[11px] font-mono text-slate-400">
                <span className="flex items-center space-x-1.5">
                  <span className={`w-2 h-2 rounded-full ${processingStatus === 'completed' ? 'bg-emerald-400' : 'bg-cyan-400 animate-ping'}`} />
                  <strong className="text-slate-200 uppercase">{processingStatus}</strong>
                </span>
                <span>{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</span>
              </div>
            </div>
          )}

          {/* Quick-Test NASA Sample Satellite Tiles */}
          <div>
            <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-2">
              TEST WITH AUTHENTIC SATELLITE TILES:
            </span>

            <div className="space-y-2">
              {sampleTiles.map((t) => (
                <button
                  key={t.name}
                  onClick={t.action}
                  className="w-full p-2.5 rounded-xl text-left glass-panel-interactive border border-slate-800 hover:border-cyan-400/40 flex items-center justify-between select-none"
                >
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">{t.name}</span>
                    <span className="font-mono text-[10px] text-slate-400">{t.desc}</span>
                  </div>
                  <Badge variant="cyan" size="sm">{t.color}</Badge>
                </button>
              ))}

              {/* Consecutive Frame Difference Simulator */}
              <button
                onClick={handleCompareConsecutiveFrames}
                className="w-full p-2.5 rounded-xl text-left bg-gradient-to-r from-cyan-950/30 to-blue-950/30 border border-cyan-500/30 hover:border-cyan-400/60 flex items-center justify-between transition-all select-none"
              >
                <div>
                  <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                    <FileDiff className="w-3.5 h-3.5" />
                    <span>Test Consecutive Frame Difference (T0 vs T1)</span>
                  </span>
                  <span className="font-mono text-[10px] text-slate-400">
                    Calculates pixel absdiff, MSE, PSNR & motion delta heatmap
                  </span>
                </div>
                <Badge variant="emerald" size="sm">2 FRAMES</Badge>
              </button>
            </div>
          </div>

          {/* Sensor Ground Truth & Spatial GSD Clarity Guide */}
          <div className="p-4 rounded-2xl glass-panel border border-slate-800 space-y-3 font-mono text-xs">
            <div className="flex items-center space-x-2 text-cyan-400 font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>SENSOR CALIBRATION & RESOLUTION CLARITY</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed font-light">
              Uploaded imagery features are interpreted according to physical remote sensing ground sample distance (GSD):
            </p>
            <div className="space-y-1.5 text-[10.5px]">
              <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80 flex justify-between">
                <span className="text-amber-300 font-bold">VHR (&le;0.5m SpaceNet / xView):</span>
                <span className="text-slate-400">Canny edge density &gt;25% triggers 16th-note clock</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80 flex justify-between">
                <span className="text-emerald-300 font-bold">MSI (10m-30m EuroSAT / SEN12MS):</span>
                <span className="text-slate-400">Green energy (NDVI) sets 350Hz-2.4kHz bandpass</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80 flex justify-between">
                <span className="text-purple-300 font-bold">Radar SAR (Sentinel-1 / Capella):</span>
                <span className="text-slate-400">Backscatter variance controls 40-90Hz sub-bass drone</span>
              </div>
            </div>
            <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800/60 flex items-center justify-between">
              <span>PROVENANCE: AWESOME SATELLITE DATASETS</span>
              <span className="text-cyan-400 font-bold">100% OPEN SCIENCE</span>
            </div>
          </div>

        </div>

        {/* Right Column (7 cols): Live Computer Vision Analysis Dashboard */}
        <div className="lg:col-span-7 space-y-4">
          {cvAnalysisResult ? (
            <>
              {/* Quick Sonification Action Strip */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-cyan-950/60 via-blue-950/40 to-slate-950 border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                    <Waves className="w-4 h-4 animate-pulse" />
                  </div>
                  <div>
                    <span className="font-mono text-[10px] text-cyan-400 font-bold tracking-wider uppercase block">
                      SONIFICATION ENGINE READY
                    </span>
                    <span className="text-xs font-bold text-slate-100">
                      Convert Extracted Features into Procedural Sound
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={Waves}
                    onClick={() => {
                      if (onSelectSonificationTrack) {
                        onSelectSonificationTrack({
                          id: 'uploaded-' + Date.now(),
                          title: selectedFile ? selectedFile.name : "Custom Earth Observation",
                          region: "User Observation Swath",
                          satellite: "MISSION UPLOAD",
                          sensor: "Optical Multispectral",
                          analysisData: cvAnalysisResult,
                          suggestedStyle: "ambient_earth",
                          duration: "04:30",
                          currentTime: "00:00",
                        })
                      }
                      if (onNavigate) onNavigate('studio')
                    }}
                  >
                    Open in Sound Studio
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    icon={Activity}
                    onClick={() => {
                      if (onNavigate) onNavigate('studio')
                    }}
                  >
                    Time-Series Synchronizer
                  </Button>
                </div>
              </div>

              <AnalysisDashboard
                analysisData={cvAnalysisResult}
                onRecalibrate={handleRecalibrate}
                isRecalibrating={processingStatus === 'processing'}
                hasPreviousFrame={Boolean(secondaryFile)}
              />
            </>
          ) : (
            <div className="glass-panel p-12 rounded-2xl text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 text-slate-500 flex items-center justify-center mx-auto">
                <Activity className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-300">
                Awaiting Visualization Frame for Computer Vision Analysis
              </h4>
              <p className="text-xs font-mono text-slate-500 max-w-sm mx-auto leading-relaxed">
                Upload a satellite image frame or select a pre-loaded NASA tile to extract RGB channel statistics, dominant colors, luminance, 3×3 regional partitions, and normalized 11D features.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  )
}
