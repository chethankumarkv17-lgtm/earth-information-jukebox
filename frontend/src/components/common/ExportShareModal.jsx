import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Download,
  Share2,
  FileText,
  Music,
  Code,
  Copy,
  Check,
  X,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  Upload,
  Globe2,
  Sliders,
  Radio,
  FileCode
} from 'lucide-react'

import {
  renderObservationsToWav,
  generateScientificSummary,
  generateDatasetMetadataJson,
  downloadBlob
} from '../../services/audioExportService'
import {
  serializeExplorationUrl,
  copyShareableLink,
  exportExplorationBundle,
  parseImportedBundle
} from '../../services/shareService'
import { useAccessibility } from '../../context/AccessibilityContext'
import Button from '../common/Button'
import Badge from '../common/Badge'

export default function ExportShareModal({
  isOpen,
  onClose,
  explorationState = {},
  onImportConfig = null
}) {
  const { playEarcon, announce, highContrast } = useAccessibility()
  const [activeTab, setActiveTab] = useState('audio') // 'audio' | 'summary' | 'metadata' | 'share' | 'config'
  const [isRenderingAudio, setIsRenderingAudio] = useState(false)
  const [audioSuccess, setAudioSuccess] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedSummary, setCopiedSummary] = useState(false)
  const [importJsonText, setImportJsonText] = useState('')
  const [importError, setImportError] = useState(null)
  const [importSuccess, setImportSuccess] = useState(false)

  const modalRef = useRef(null)
  const closeButtonRef = useRef(null)

  // Focus trap & Escape key
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => closeButtonRef.current?.focus(), 50)
      const handleKey = (e) => {
        if (e.key === 'Escape') onClose()
      }
      window.addEventListener('keydown', handleKey)
      return () => window.removeEventListener('keydown', handleKey)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const {
    dataset = { name: 'Surface Temperature', unit: '°C', id: 'temperature' },
    location = { name: 'Amazon Basin Rainforest', coordinatesText: "03°28'S 62°13'W", id: 'amazon' },
    timeSeries = [],
    presetName = 'Scientific Analytic',
    comparisonLocation = null,
    comparisonDataset = null,
    tempoMs = 500
  } = explorationState

  // Generate artifacts
  const scientificSummaryMd = generateScientificSummary({
    dataset,
    location,
    timeSeries,
    presetName,
    comparisonLocation,
    comparisonDataset
  })

  const metadataJson = generateDatasetMetadataJson({
    dataset,
    location,
    timeSeries
  })

  const shareableUrl = serializeExplorationUrl({
    locationId: location.id,
    datasetId: dataset.id,
    comparisonLocationId: comparisonLocation?.id,
    comparisonDatasetId: comparisonDataset?.id,
    presetId: explorationState.presetId || 'scientific_analytic'
  })

  // Handle Audio WAV Rendering
  const handleExportWav = async () => {
    try {
      setIsRenderingAudio(true)
      setAudioSuccess(false)
      announce('Rendering procedural audio WAV file offline...')

      // Convert timeSeries to renderable observation notes
      const notes = timeSeries.map((item, idx) => ({
        date: item.date,
        frequencyHz: item.frequencyHz || (180 + (item.value * 12)),
        gainLinear: item.isDry ? 0.0 : 0.7,
        waveform: item.waveform || 'sine',
        isDry: item.isDry || false,
        isMissing: item.isMissing || false
      }))

      const wavBlob = await renderObservationsToWav(notes, {
        sampleRate: 44100,
        tempoMs: tempoMs || 500,
        masterVolume: 0.85
      })

      const filename = `nasa_earth_sonification_${location.id || 'station'}_${dataset.id || 'metric'}.wav`
      downloadBlob(wavBlob, filename)

      setIsRenderingAudio(false)
      setAudioSuccess(true)
      playEarcon('volume')
      announce(`Audio file ${filename} generated and downloaded successfully.`)
    } catch (err) {
      setIsRenderingAudio(false)
      announce(`Audio export error: ${err.message}`, true)
    }
  }

  // Handle Download Summary
  const handleDownloadSummary = (format = 'md') => {
    const blob = new Blob([scientificSummaryMd], { type: 'text/markdown;charset=utf-8' })
    const filename = `scientific_summary_${location.id || 'station'}_${dataset.id || 'metric'}.${format}`
    downloadBlob(blob, filename)
    playEarcon('seek')
    announce(`Scientific summary ${filename} downloaded.`)
  }

  // Handle Download Metadata JSON
  const handleDownloadMetadata = () => {
    const blob = new Blob([JSON.stringify(metadataJson, null, 2)], { type: 'application/json' })
    const filename = `dataset_metadata_${location.id || 'station'}_${dataset.id || 'metric'}.json`
    downloadBlob(blob, filename)
    playEarcon('seek')
    announce(`Metadata JSON ${filename} downloaded.`)
  }

  // Handle Copy Share Link
  const handleCopyLink = async () => {
    await copyShareableLink({
      locationId: location.id,
      datasetId: dataset.id,
      comparisonLocationId: comparisonLocation?.id,
      comparisonDatasetId: comparisonDataset?.id,
      presetId: explorationState.presetId || 'scientific_analytic'
    })
    setCopiedLink(true)
    playEarcon('seek')
    announce('Shareable link copied to clipboard.')
    setTimeout(() => setCopiedLink(false), 2500)
  }

  // Handle Export Configuration Bundle
  const handleExportBundle = () => {
    exportExplorationBundle({
      location,
      dataset,
      comparisonLocation,
      comparisonDataset,
      presetId: explorationState.presetId || 'scientific_analytic',
      speed: explorationState.speed || 1.0,
      timeSeries
    })
    playEarcon('volume')
    announce('Exploration configuration bundle downloaded.')
  }

  // Handle Import Configuration Bundle
  const handleImportBundle = () => {
    setImportError(null)
    setImportSuccess(false)
    const result = parseImportedBundle(importJsonText)
    if (!result.isValid) {
      setImportError(result.error)
      announce(`Configuration import failed: ${result.error}`, true)
      return
    }

    if (onImportConfig) {
      onImportConfig(result.config)
      setImportSuccess(true)
      playEarcon('accessibility_mode')
      announce('Reproducible exploration configuration loaded successfully!')
      setTimeout(() => {
        onClose()
      }, 1200)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-3xl rounded-2xl p-6 shadow-2xl border transition-all ${
          highContrast
            ? 'bg-black text-white border-2 border-yellow-400'
            : 'bg-slate-900/95 text-slate-100 border-cyan-500/30'
        }`}
      >
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-cyan-500/20 mb-4">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-xl ${highContrast ? 'bg-yellow-400 text-black' : 'bg-cyan-500/10 text-cyan-400'}`}>
              <Download className="w-6 h-6" />
            </div>
            <div>
              <h2 id="export-modal-title" className="text-xl font-extrabold tracking-tight">
                Export & Share Exploration
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                {location.name} • {dataset.name} ({dataset.unit})
              </p>
            </div>
          </div>

          <button
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="Close export and share dialog"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus:ring-2 focus:ring-cyan-400 focus:outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center gap-1.5 pb-4 border-b border-slate-800" role="tablist">
          {[
            { id: 'audio', label: 'Audio (.WAV)', icon: Music },
            { id: 'summary', label: 'Scientific Summary', icon: FileText },
            { id: 'metadata', label: 'Dataset Metadata', icon: Code },
            { id: 'share', label: 'Share URL', icon: Share2 },
            { id: 'config', label: 'Config Bundle', icon: Sliders },
          ].map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center space-x-1.5 transition-all focus:ring-2 focus:ring-cyan-400 focus:outline-none ${
                  isActive
                    ? highContrast
                      ? 'bg-yellow-400 text-black border border-white'
                      : 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                    : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Tab 1: Audio WAV Export */}
        {activeTab === 'audio' && (
          <div className="py-4 space-y-4">
            <div className={`p-4 rounded-xl border space-y-2 ${
              highContrast ? 'bg-black border-white' : 'bg-slate-950/70 border-slate-800'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-cyan-400 font-bold uppercase">
                  UNCOMPRESSED 16-BIT STEREO PCM WAV
                </span>
                <Badge variant="emerald" size="sm">44.1 kHz STUDIO MASTER</Badge>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                Render an authentic, uncompressed 16-bit WAV audio file directly from the active observation sequence using the browser's Web Audio <code className="text-cyan-300">OfflineAudioContext</code>. Generated sound strictly follows calibrated mathematical sonification mappings.
              </p>
              <div className="text-[11px] font-mono text-slate-400 pt-1">
                Format: 44,100 Hz • Stereo 2-Channel • Dynamics Limited (&lt; 0 dBFS)
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button
                variant="primary"
                size="md"
                icon={isRenderingAudio ? Sliders : Download}
                onClick={handleExportWav}
                disabled={isRenderingAudio}
                className="font-bold font-mono"
              >
                {isRenderingAudio ? 'Rendering Audio Buffer...' : 'Render & Download Audio (.WAV)'}
              </Button>

              {audioSuccess && (
                <span className="flex items-center space-x-1 text-xs font-mono text-emerald-400 font-bold">
                  <Check className="w-4 h-4" />
                  <span>WAV Download Initiated!</span>
                </span>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Scientific Summary */}
        {activeTab === 'summary' && (
          <div className="py-4 space-y-4">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span>Scientific Markdown Summary Report:</span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleDownloadSummary('md')}
                  className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 hover:text-white text-xs font-mono"
                >
                  Download .MD
                </button>
                <button
                  onClick={() => handleDownloadSummary('txt')}
                  className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 hover:text-white text-xs font-mono"
                >
                  Download .TXT
                </button>
              </div>
            </div>

            <textarea
              readOnly
              value={scientificSummaryMd}
              className={`w-full h-52 p-3 rounded-xl font-mono text-xs border focus:outline-none ${
                highContrast
                  ? 'bg-black text-white border-white'
                  : 'bg-slate-950 text-slate-300 border-slate-800'
              }`}
            />
          </div>
        )}

        {/* Tab 3: Dataset Metadata JSON */}
        {activeTab === 'metadata' && (
          <div className="py-4 space-y-4">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span>ISO 19115 / Schema.org Dataset Metadata (JSON):</span>
              <button
                onClick={handleDownloadMetadata}
                className="px-3 py-1 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 hover:bg-cyan-500/30 text-xs font-mono font-bold"
              >
                Download Metadata (.JSON)
              </button>
            </div>

            <textarea
              readOnly
              value={JSON.stringify(metadataJson, null, 2)}
              className={`w-full h-52 p-3 rounded-xl font-mono text-xs border focus:outline-none ${
                highContrast
                  ? 'bg-black text-white border-white'
                  : 'bg-slate-950 text-emerald-300 border-slate-800'
              }`}
            />
          </div>
        )}

        {/* Tab 4: Share URL */}
        {activeTab === 'share' && (
          <div className="py-4 space-y-4">
            <div className={`p-4 rounded-xl border space-y-2 ${
              highContrast ? 'bg-black border-white' : 'bg-slate-950/70 border-slate-800'
            }`}>
              <span className="text-xs font-mono text-cyan-400 font-bold uppercase block">
                SHAREABLE EXPLORATION LINK:
              </span>
              <p className="text-xs text-slate-300 font-sans">
                Share this exact scientific view, location, dataset, and sonification preset with colleagues, students, or fellow researchers via a reproducible URL.
              </p>
              
              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="text"
                  readOnly
                  value={shareableUrl}
                  className={`flex-1 p-2.5 rounded-lg font-mono text-xs border focus:outline-none ${
                    highContrast ? 'bg-black border-white text-white' : 'bg-slate-900 border-slate-700 text-cyan-300'
                  }`}
                />
                <button
                  onClick={handleCopyLink}
                  aria-label="Copy shareable URL link"
                  className="px-4 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-mono text-xs flex items-center space-x-1.5 transition-colors"
                >
                  {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedLink ? 'COPIED!' : 'COPY'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Configuration Bundle (Export / Import) */}
        {activeTab === 'config' && (
          <div className="py-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Export Bundle */}
              <div className={`p-4 rounded-xl border space-y-3 ${
                highContrast ? 'bg-black border-white' : 'bg-slate-950/70 border-slate-800'
              }`}>
                <span className="text-xs font-mono text-cyan-400 font-bold uppercase block">
                  EXPORT CONFIG BUNDLE (.JSON)
                </span>
                <p className="text-xs text-slate-300 font-sans">
                  Download a reproducible JSON configuration bundle that saves all parameters, mapping limits, and station references.
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={Download}
                  onClick={handleExportBundle}
                  className="font-mono text-xs w-full justify-center"
                >
                  Download Config (.JSON)
                </Button>
              </div>

              {/* Import Bundle */}
              <div className={`p-4 rounded-xl border space-y-3 ${
                highContrast ? 'bg-black border-white' : 'bg-slate-950/70 border-slate-800'
              }`}>
                <span className="text-xs font-mono text-emerald-400 font-bold uppercase block">
                  IMPORT CONFIG BUNDLE
                </span>
                <p className="text-xs text-slate-300 font-sans">
                  Paste a JSON configuration bundle below to restore an exact reproducible exploration state.
                </p>
                <textarea
                  placeholder="Paste configuration JSON here..."
                  value={importJsonText}
                  onChange={(e) => setImportJsonText(e.target.value)}
                  className={`w-full h-20 p-2 rounded-lg font-mono text-[11px] border focus:outline-none ${
                    highContrast ? 'bg-black border-white text-white' : 'bg-slate-900 border-slate-700 text-slate-200'
                  }`}
                />
                <Button
                  variant="primary"
                  size="sm"
                  icon={Upload}
                  onClick={handleImportBundle}
                  disabled={!importJsonText.trim()}
                  className="font-mono text-xs w-full justify-center font-bold"
                >
                  Load Exploration Config
                </Button>

                {importError && (
                  <p className="text-[11px] font-mono text-rose-400">{importError}</p>
                )}
                {importSuccess && (
                  <p className="text-[11px] font-mono text-emerald-400">Configuration loaded successfully!</p>
                )}
              </div>

            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
          <span>NASA Open Science & Reproducible Research Standard</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors focus:ring-2 focus:ring-cyan-400 focus:outline-none"
          >
            Close (Esc)
          </button>
        </div>

      </div>
    </div>
  )
}
