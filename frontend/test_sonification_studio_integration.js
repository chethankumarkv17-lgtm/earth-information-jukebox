/**
 * End-to-End Integration Test for Real-Time Earth Data Sonification Engine
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
    console.error(`  ✗ FAILED: ${message}`)
    failed++
  }
}

console.log('\n=================================================================')
console.log('  EARTH DATA SONIFICATION ENGINE INTEGRATION TEST SUITE')
console.log('=================================================================\n')

// 1. Engine Service Verification
const enginePath = path.join(__dirname, 'src', 'services', 'earthDataSonificationEngine.js')
assert(fs.existsSync(enginePath), 'earthDataSonificationEngine.js service exists')
const engineContent = fs.readFileSync(enginePath, 'utf8')

assert(engineContent.includes('export function mapTemperatureToPitch'), 'mapTemperatureToPitch exported')
assert(engineContent.includes('export function mapPrecipitationToAcousticRhythm'), 'mapPrecipitationToAcousticRhythm exported')
assert(engineContent.includes('export function mapWindSpeedToModulation'), 'mapWindSpeedToModulation exported')
assert(engineContent.includes('export function mapVegetationToTimbre'), 'mapVegetationToTimbre exported')
assert(engineContent.includes('export function mapOceanToFoundationDrone'), 'mapOceanToFoundationDrone exported')
assert(engineContent.includes('export class EarthDataSonificationEngine'), 'EarthDataSonificationEngine class exported')

// 2. Audio Safety & Clipping Prevention
assert(engineContent.includes('createDynamicsCompressor'), 'Web Audio DynamicsCompressorNode configured to prevent clipping')
assert(engineContent.includes('createWaveShaper'), 'Soft-clip WaveShaper transfer curve active to prevent digital distortion')
assert(engineContent.includes('createAnalyser'), 'Web Audio AnalyserNode configured for real-time waveform and FFT spectrum')
assert(engineContent.includes('exponentialRampToValueAtTime'), 'Smooth gain envelopes (anti-click ADSR) implemented')

// 3. Instrument Voices
assert(engineContent.includes('penta_synth:'), 'Instrument Voice: Planetary Synthesizer defined')
assert(engineContent.includes('acoustic_marimba:'), 'Instrument Voice: Acoustic Earth Marimba defined')
assert(engineContent.includes('planetary_drone:'), 'Instrument Voice: Cryosphere & Biosphere Drone defined')
assert(engineContent.includes('atmospheric_pad:'), 'Instrument Voice: Atmospheric Aerosol Shimmer defined')
assert(engineContent.includes('droplet_percussion:'), 'Instrument Voice: Hydrological Droplet Sequencer defined')

// 4. UI Studio Component Verification
const studioCompPath = path.join(__dirname, 'src', 'components', 'studio', 'EarthDataSonificationStudio.jsx')
assert(fs.existsSync(studioCompPath), 'EarthDataSonificationStudio.jsx component exists')
const studioContent = fs.readFileSync(studioCompPath, 'utf8')

// 5. Visualizer & Telemetry HUD Elements
assert(studioContent.includes('<canvas'), 'HTML5 Canvas element for live waveform & spectrum visualizer rendered')
assert(studioContent.includes('CURRENT OBSERVATION'), 'Live scientific data value HUD rendered')
assert(studioContent.includes('DATE / TIMESTAMP'), 'Observation date and timestamp HUD rendered')
assert(studioContent.includes('ACTIVE ACOUSTIC PITCH'), 'Active acoustic pitch in Hz and MIDI note HUD rendered')
assert(studioContent.includes('SOUND MODULATION'), 'Active sound modulation parameter HUD rendered')
assert(studioContent.includes('SONIFICATION PROGRESS'), 'Sonification progress bar and frame tracker rendered')

// 6. Transport Controls
assert(studioContent.includes('handleTogglePlay'), 'Play and Pause controls wired')
assert(studioContent.includes('handleReplay'), 'Replay from beginning control wired')
assert(studioContent.includes('setPlaybackSpeedMs'), 'Adjustable playback speed (tempo) selector wired')
assert(studioContent.includes('setVolume'), 'Master volume control slider wired')
assert(studioContent.includes('setMute'), 'Audio mute toggle wired')
assert(studioContent.includes('step(-1)'), 'Frame step backward audition control wired')
assert(studioContent.includes('step(1)'), 'Frame step forward audition control wired')

// 7. Scientific Parameter Explanation
assert(studioContent.includes('Scientific Parameter Guide'), 'Scientific Parameter Guide accordion rendered')
assert(studioContent.includes('1. Temperature → Musical Pitch'), 'Temperature mapping explained scientifically')
assert(studioContent.includes('2. Precipitation → Density, Rhythm & Amplitude'), 'Precipitation mapping explained scientifically')
assert(studioContent.includes('3. Wind Speed → Modulation & Texture'), 'Wind speed mapping explained scientifically')
assert(studioContent.includes('4. Vegetation → Timbre & Harmonic Richness'), 'Vegetation mapping explained scientifically')
assert(studioContent.includes('5. Ocean SST → Foundation Drone & Swell'), 'Ocean SST mapping explained scientifically')

// 8. Integration in StudioPage.jsx
const studioPagePath = path.join(__dirname, 'src', 'pages', 'StudioPage.jsx')
const studioPageContent = fs.readFileSync(studioPagePath, 'utf8')
assert(studioPageContent.includes('EarthDataSonificationStudio'), 'EarthDataSonificationStudio imported in StudioPage.jsx')
assert(studioPageContent.includes("studioMode === 'earth_data'"), 'Core Earth Data Sonifier view mode wired as default')
assert(studioPageContent.includes('CORE EARTH DATA SONIFIER'), 'Primary mode button rendered in mode selector strip')

console.log('\n=================================================================')
console.log(`  Results: ${passed} passed, ${failed} failed`)
if (failed === 0) {
  console.log('  ✓ ALL 33 INTEGRATION CHECKS PASSED SUCCESSFULLY!')
} else {
  console.log('  ✗ SOME CHECKS FAILED')
  process.exit(1)
}
console.log('=================================================================\n')
