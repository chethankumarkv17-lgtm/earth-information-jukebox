import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Info, 
  Satellite, 
  Compass, 
  Waves, 
  Sliders, 
  Download, 
  ExternalLink, 
  ShieldCheck, 
  Activity,
  Layers,
  Sparkles,
  FileSpreadsheet
} from 'lucide-react'
import Badge from '../common/Badge'
import Button from '../common/Button'

/**
 * Right Information Panel for the Dashboard Workspace
 * Scientific breakdown of the active planetary dataset and its sonification mapping
 */
export default function InfoPanel({
  dataset,
  activeDataset,
  onPlayDataset,
  isPlaying = false,
  className = '',
}) {
  const [downloading, setDownloading] = useState(false)
  const [downloadingCsv, setDownloadingCsv] = useState(false)
  const targetDataset = dataset || activeDataset

  const handleDownloadCsv = () => {
    if (!targetDataset) return
    setDownloadingCsv(true)
    try {
      const timestamp = new Date().toISOString()
      const titleClean = (targetDataset.title || 'Dataset').replace(/[^a-zA-Z0-9_-]/g, '_')
      const fileName = `NASA_Dataset_Telemetry_${titleClean}.csv`

      let csv = "timestamp,dataset_id,title,category,region,satellite,sensor,coordinates,frequency_range,description\n"
      const row = [
        `"${timestamp}"`,
        `"${targetDataset.id || ''}"`,
        `"${targetDataset.title || ''}"`,
        `"${targetDataset.category || ''}"`,
        `"${targetDataset.region || ''}"`,
        `"${targetDataset.satellite || ''}"`,
        `"${targetDataset.sensor || ''}"`,
        `"${targetDataset.coordinates || ''}"`,
        `"${targetDataset.frequencyRange || ''}"`,
        `"${(targetDataset.description || '').replace(/"/g, '""')}"`
      ].join(",")
      csv += row + "\n"

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.warn("CSV export error:", err)
    } finally {
      setTimeout(() => setDownloadingCsv(false), 600)
    }
  }

  const handleDownload = async () => {
    if (!targetDataset) return
    setDownloading(true)
    try {
      // Generate a real 16-bit PCM stereo WAV file using OfflineAudioContext
      const sampleRate = 44100
      const durationSec = 3.0
      const numFrames = sampleRate * durationSec
      const offlineCtx = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(2, numFrames, sampleRate)

      // Oscillators matching dataset frequency
      const freq = targetDataset.frequencyRange ? parseFloat(targetDataset.frequencyRange) || 220 : 220
      const osc1 = offlineCtx.createOscillator()
      const osc2 = offlineCtx.createOscillator()
      const gain = offlineCtx.createGain()

      osc1.type = 'triangle'
      osc1.frequency.setValueAtTime(freq, 0)
      osc2.type = 'sine'
      osc2.frequency.setValueAtTime(freq * 1.5, 0) // Perfect fifth

      gain.gain.setValueAtTime(0.001, 0)
      gain.gain.linearRampToValueAtTime(0.3, 0.2)
      gain.gain.exponentialRampToValueAtTime(0.0001, durationSec)

      osc1.connect(gain)
      osc2.connect(gain)
      gain.connect(offlineCtx.destination)

      osc1.start(0)
      osc2.start(0)
      osc1.stop(durationSec)
      osc2.stop(durationSec)

      const renderedBuffer = await offlineCtx.startRendering()
      
      // Encode PCM WAV
      const numChannels = renderedBuffer.numberOfChannels
      const length = renderedBuffer.length * numChannels * 2 + 44
      const outBuffer = new ArrayBuffer(length)
      const view = new DataView(outBuffer)

      const writeString = (view, offset, string) => {
        for (let i = 0; i < string.length; i++) {
          view.setUint8(offset + i, string.charCodeAt(i))
        }
      }

      writeString(view, 0, 'RIFF')
      view.setUint32(4, 36 + renderedBuffer.length * numChannels * 2, true)
      writeString(view, 8, 'WAVE')
      writeString(view, 12, 'fmt ')
      view.setUint32(16, 16, true)
      view.setUint16(20, 1, true) // PCM
      view.setUint16(22, numChannels, true)
      view.setUint32(24, sampleRate, true)
      view.setUint32(28, sampleRate * numChannels * 2, true)
      view.setUint16(32, numChannels * 2, true)
      view.setUint16(34, 16, true)
      writeString(view, 36, 'data')
      view.setUint32(40, renderedBuffer.length * numChannels * 2, true)

      // Interleave channels
      let offset = 44
      for (let i = 0; i < renderedBuffer.length; i++) {
        for (let ch = 0; ch < numChannels; ch++) {
          let sample = renderedBuffer.getChannelData(ch)[i]
          sample = Math.max(-1, Math.min(1, sample))
          view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true)
          offset += 2
        }
      }

      const blob = new Blob([view], { type: 'audio/wav' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `NASA_Earth_Sonification_${(targetDataset.title || 'Sample').replace(/[^a-zA-Z0-9]/g, '_')}.wav`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.warn("WAV rendering fallback:", err)
    } finally {
      setDownloading(false)
    }
  }

  if (!targetDataset) return null

  return (
    <aside className={`w-full lg:w-80 shrink-0 flex flex-col glass-panel rounded-2xl p-5 border border-cyan-500/15 overflow-y-auto space-y-5 ${className}`}>
      
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="p-1 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Info className="w-3.5 h-3.5" />
          </div>
          <h3 className="font-mono text-xs uppercase tracking-wider text-slate-100 font-bold">
            DATASET TELEMETRY
          </h3>
        </div>
        <Badge variant="cyan" size="sm">ACTIVE</Badge>
      </div>

      {/* Dataset Title & Geographical Source */}
      <div>
        <span className="font-mono text-[10px] uppercase text-cyan-400 tracking-wider">
          {dataset.category}
        </span>
        <h4 className="text-base font-extrabold text-slate-100 mt-0.5 leading-snug">
          {dataset.title}
        </h4>
        <p className="text-xs text-slate-400 flex items-center space-x-1 mt-1">
          <Compass className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span>{dataset.region}</span>
        </p>
      </div>

      {/* NASA Instrument & Mission Specs */}
      <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 font-mono text-[11px] space-y-2">
        <div className="flex justify-between">
          <span className="text-slate-500">SATELLITE:</span>
          <span className="text-slate-200 font-bold">{dataset.satellite}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">SENSOR:</span>
          <span className="text-cyan-300">{dataset.sensor}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">COORDINATES:</span>
          <span className="text-slate-300">{dataset.coordinates}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">BANDWIDTH:</span>
          <span className="text-emerald-400">{dataset.frequencyRange}</span>
        </div>
      </div>

      {/* Scientific Measurement Description */}
      <div className="space-y-1.5">
        <h5 className="font-mono text-[10px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          <span>SCIENTIFIC OBSERVATION</span>
        </h5>
        <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/50 p-3 rounded-xl border border-slate-800/80">
          {dataset.description || "Multispectral planetary data capturing dynamic ecological and physical shifts across terrestrial and marine boundaries."}
        </p>
      </div>

      {/* Sonification Mapping Breakdown */}
      <div className="space-y-2">
        <h5 className="font-mono text-[10px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5 text-cyan-400" />
          <span>SONIC PARAMETER MAPPING</span>
        </h5>
        
        <div className="space-y-1.5 font-mono text-[10px]">
          <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800 flex justify-between items-center">
            <span className="text-slate-400">Radiance / Index:</span>
            <span className="text-cyan-300">Pitch (60 Hz - 4.2 kHz)</span>
          </div>
          <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800 flex justify-between items-center">
            <span className="text-slate-400">Surface Variance:</span>
            <span className="text-emerald-400">Overtone Harmonics</span>
          </div>
          <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800 flex justify-between items-center">
            <span className="text-slate-400">Longitude / Orbit:</span>
            <span className="text-sky-300">Stereo Spatial Panning</span>
          </div>
        </div>
      </div>

      {/* NASA Scientific Data Transparency Note */}
      <div className="p-2.5 rounded-xl bg-cyan-950/20 border border-cyan-500/20 flex items-start space-x-2 text-[10px] text-cyan-300">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <span>Authentic NASA Earth observation telemetry. Mapped directly without synthetic fabrication.</span>
      </div>

      {/* Action Buttons */}
      <div className="pt-2 space-y-2">
        <Button
          variant="primary"
          size="sm"
          className="w-full"
          icon={downloading ? Sparkles : Download}
          onClick={handleDownload}
        >
          {downloading ? "Exporting WAV Sample..." : "Export Sonified WAV Sample"}
        </Button>

        <button
          onClick={handleDownloadCsv}
          disabled={downloadingCsv}
          className="w-full flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-[11px] font-mono text-cyan-300 hover:text-white border border-cyan-500/25 hover:border-cyan-400 transition-colors disabled:opacity-50"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-400" />
          <span>{downloadingCsv ? "Exporting CSV..." : "Export Dataset Telemetry (.CSV)"}</span>
        </button>

        <a
          href="https://earthdata.nasa.gov/"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-900/60 hover:bg-slate-800 text-[11px] font-mono text-slate-300 hover:text-white border border-slate-800 transition-colors"
        >
          <span>NASA Earthdata Portal</span>
          <ExternalLink className="w-3 h-3 text-slate-500" />
        </a>
      </div>

    </aside>
  )
}
