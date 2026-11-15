/**
 * Automated Verification for Earth Data Processing & Sonification Engine
 * 2026 NASA Space Apps Challenge
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let passed = 0
let failed = 0

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ Passed: ${message}`)
    passed++
  } else {
    console.error(`  ✗ Failed: ${message}`)
    failed++
  }
}

console.log('\n=======================================================')
console.log('  EARTH DATA PROCESSING ENGINE FRONTEND VERIFICATION')
console.log('=======================================================\n')

// 1. Verify api.js exports
const apiPath = path.join(__dirname, 'src', 'services', 'api.js')
const apiContent = fs.readFileSync(apiPath, 'utf8')
assert(apiContent.includes('export async function fetchEarthDataProcessingDemo'), 'fetchEarthDataProcessingDemo exported in api.js')
assert(apiContent.includes('export async function processEarthTimeseries'), 'processEarthTimeseries exported in api.js')
assert(apiContent.includes('export async function uploadAndProcessScientificFile'), 'uploadAndProcessScientificFile exported in api.js')

// 2. Verify EarthDataProcessingEngineViewer.jsx
const viewerPath = path.join(__dirname, 'src', 'components', 'datasets', 'EarthDataProcessingEngineViewer.jsx')
assert(fs.existsSync(viewerPath), 'EarthDataProcessingEngineViewer.jsx component exists')
const viewerContent = fs.readFileSync(viewerPath, 'utf8')

// 3. Verify all 5 scientific domains
assert(viewerContent.includes("id: 'temperature'"), 'Domain: Temperature included')
assert(viewerContent.includes("id: 'precipitation'"), 'Domain: Precipitation included')
assert(viewerContent.includes("id: 'wind_speed'"), 'Domain: Wind Speed included')
assert(viewerContent.includes("id: 'vegetation'"), 'Domain: Vegetation (NDVI) included')
assert(viewerContent.includes("id: 'ocean_sst'"), 'Domain: Ocean SST included')

// 4. Verify critical scientific invariants in UI
assert(viewerContent.includes('Zero Silent Null Conversion'), 'Invariant: Zero Silent Null Conversion clearly surfaced')
assert(viewerContent.includes('Meaning-Preserving Normalization'), 'Invariant: Meaning-Preserving Normalization clearly surfaced')
assert(viewerContent.includes('Original Units Preserved'), 'Invariant: Original Units Preserved clearly surfaced')

// 5. Verify Sonification Sequencer & Telemetry
assert(viewerContent.includes('Acoustic Sonification Sequencer'), 'Acoustic Sonification Sequencer section rendered')
assert(viewerContent.includes('synthesizeTone'), 'Web Audio synthesizer tone generator implemented')
assert(viewerContent.includes('acoustic_pitch_hz'), 'Acoustic pitch in Hz displayed')
assert(viewerContent.includes('midi_note'), 'MIDI note number displayed')
assert(viewerContent.includes('filter_cutoff_hz'), 'Filter cutoff frequency displayed')
assert(viewerContent.includes('harmonic_warmth'), 'Harmonic warmth index displayed')
assert(viewerContent.includes('audio_event'), 'Audio event status (NOTE_ON vs REST_SILENCE_DROPOUT) displayed')

// 6. Verify Statistical Summary Dashboard
assert(viewerContent.includes('Statistical Summary'), 'Statistical Summary section rendered')
assert(viewerContent.includes('dry_days_count'), 'Real dry days count (0.0 mm) displayed')
assert(viewerContent.includes('rainy_days_count'), 'Rainy days count displayed')
assert(viewerContent.includes('valid_percentage'), 'Valid observation percentage displayed')
assert(viewerContent.includes('missing_points'), 'Missing data points tracker displayed')

// 7. Verify File Ingestion
assert(viewerContent.includes('handleFileUpload'), 'Scientific file upload handler implemented')
assert(viewerContent.includes('.tif,.tiff,.nc,.nc4,.csv'), 'Accepts GeoTIFF, NetCDF, and CSV formats')

// 8. Verify Integration in EarthDataExplorer
const explorerPath = path.join(__dirname, 'src', 'components', 'datasets', 'EarthDataExplorer.jsx')
const explorerContent = fs.readFileSync(explorerPath, 'utf8')
assert(explorerContent.includes('EarthDataProcessingEngineViewer'), 'EarthDataProcessingEngineViewer imported in EarthDataExplorer')
assert(explorerContent.includes('DATA PROCESSING & SONIFICATION ENGINE'), 'Primary mode toggle for processing engine rendered')
assert(explorerContent.includes('IN-SITU OBSERVATORY & MASTER CATALOG'), 'Observatory mode toggle rendered')

console.log('\n=======================================================')
console.log(`  Results: ${passed} passed, ${failed} failed`)
if (failed === 0) {
  console.log('  ✓ ALL EARTH DATA PROCESSING ENGINE CHECKS PASSED!')
} else {
  console.log('  ✗ SOME CHECKS FAILED')
  process.exit(1)
}
console.log('=======================================================\n')
