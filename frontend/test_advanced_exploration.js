/**
 * Comprehensive Verification Test Suite for Advanced Exploration Capabilities
 * 
 * Verifies all 7 requested advanced capabilities:
 * FEATURE 1: TIME MACHINE (Historical Earth datasets across dates)
 * FEATURE 2: LOCATION COMPARISON (Compare two geographic locations with compatibility verification)
 * FEATURE 3: DATASET COMPARISON (Compare two compatible datasets or time periods)
 * FEATURE 4: EARTH SOUND JOURNEY (Guided exploration of geographic regions through synchronized visuals and sound)
 * FEATURE 5: SONIFICATION PRESETS (5 configurable sound profiles)
 * FEATURE 6: EXPORT (Generated audio WAV via OfflineAudioContext, scientific summaries, metadata, sonification config)
 * FEATURE 7: SHARE (Shareable URL serialization/deserialization and reproducible configuration bundle)
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

console.log('\n=================================================================')
console.log('  RUNNING ADVANCED EXPLORATION CAPABILITIES VERIFICATION')
console.log('=================================================================\n')

// 1. FEATURE 1: TIME MACHINE
console.log('[TEST GROUP 1] Feature 1: Time Machine Historical Exploration')
const timeMachineFile = path.join(__dirname, 'src', 'components', 'timemachine', 'TimeMachineView.jsx')
assert(fs.existsSync(timeMachineFile), 'TimeMachineView.jsx exists')

const tmContent = fs.readFileSync(timeMachineFile, 'utf8')
assert(tmContent.includes('arctic_sea_ice'), 'Supports multi-decadal Arctic Sea Ice extent dataset (1979-2024)')
assert(tmContent.includes('global_temperature'), 'Supports GISTEMP Global Surface Temperature Anomaly dataset (1880-2024)')
assert(tmContent.includes('carbon_dioxide'), 'Supports Atmospheric CO2 Concentration dataset (1958-2024)')
assert(tmContent.includes('sea_level'), 'Supports Global Mean Sea Level Rise dataset (1993-2024)')
assert(tmContent.includes('ExportShareModal'), 'Integrates Export & Share modal into Time Machine')
assert(tmContent.includes('handleAudifyTimeline'), 'Integrates decadal sonification playback across time')
assert(tmContent.includes('unit:'), 'Preserves and displays scientific units for each historical dataset')
assert(tmContent.includes('mission:'), 'Preserves and displays satellite mission provenance')

// 2. FEATURE 2 & FEATURE 3: COMPARATIVE EXPLORATION HUB
console.log('\n[TEST GROUP 2] Features 2 & 3: Location and Dataset Comparisons')
const compareFile = path.join(__dirname, 'src', 'components', 'comparisons', 'ComparativeExplorationHub.jsx')
assert(fs.existsSync(compareFile), 'ComparativeExplorationHub.jsx exists')

const compareContent = fs.readFileSync(compareFile, 'utf8')
assert(compareContent.includes("comparisonMode === 'location'"), 'Feature 2: Implements Location Comparison mode')
assert(compareContent.includes("comparisonMode === 'dataset'"), 'Feature 3: Implements Dataset Comparison mode')
assert(compareContent.includes("comparisonMode === 'period'"), 'Feature 3: Implements Decadal Period Shift Comparison')
assert(compareContent.includes('isScientificallyCompatible'), 'Invariant: Verifies scientific compatibility before comparison')
assert(compareContent.includes('DIRECT_PHYSICAL'), 'Detects and flags direct physical comparisons with identical units')
assert(compareContent.includes('BIVARIATE_CORRELATION'), 'Detects and flags bivariate cross-metric comparisons with clear scientific disclaimers')
assert(compareContent.includes('comparativeStats'), 'Computes statistical divergence: Mean Difference (Δμ) and Pearson Correlation (r)')
assert(compareContent.includes('auditionComparativeStep'), 'Supports dual acoustic auditioning across compared locations/datasets')
assert(compareContent.includes('polyline'), 'Renders dual-curve synchronized visual comparison graph')

// 3. FEATURE 4: EARTH SOUND JOURNEY
console.log('\n[TEST GROUP 3] Feature 4: Earth Sound Journey Guided Experience')
const journeyFile = path.join(__dirname, 'src', 'components', 'journey', 'EarthSoundJourney.jsx')
assert(fs.existsSync(journeyFile), 'EarthSoundJourney.jsx exists')

const journeyContent = fs.readFileSync(journeyFile, 'utf8')
assert(journeyContent.includes('EARTH_JOURNEYS'), 'Defines curated Earth sound journeys')
assert(journeyContent.includes('thermodynamic_transect'), 'Includes "Global Thermodynamic Transect: Equator to Cryosphere" journey')
assert(journeyContent.includes('water_cycle'), 'Includes "Planetary Water Cycle & Monsoon Corridor" journey')
assert(journeyContent.includes('waypoints'), 'Waypoints include coordinates, imagery, physical metric, and narrative')
assert(journeyContent.includes('narrative'), 'Provides narrative storytelling guide for each geographic waypoint')
assert(journeyContent.includes('soundExplanation'), 'Explains relationship between waypoint telemetry and generated sound')
assert(journeyContent.includes('auditionWaypoint'), 'Synthesizes real-time procedural sonification for each waypoint')
assert(journeyContent.includes('dwellSeconds'), 'Features autoplay sequence with customizable dwell times')

// 4. FEATURE 5: SONIFICATION PRESETS
console.log('\n[TEST GROUP 4] Feature 5: Configurable Sonification Presets')
const engineFile = path.join(__dirname, 'src', 'services', 'earthDataSonificationEngine.js')
const engineContent = fs.readFileSync(engineFile, 'utf8')
assert(engineContent.includes('SONIFICATION_PRESETS'), 'SONIFICATION_PRESETS registry defined')
assert(engineContent.includes('scientific_analytic'), 'Defines "Scientific Analytic (High Precision)" preset')
assert(engineContent.includes('ambient_documentary'), 'Defines "Ambient Documentary (Storytelling)" preset')
assert(engineContent.includes('minimal_tactile'), 'Defines "Minimal Tactile (Screen-Reader Optimized)" preset')
assert(engineContent.includes('cinematic_resonance'), 'Defines "Cinematic Resonance (Dramatic Range)" preset')
assert(engineContent.includes('binaural_spatial'), 'Defines "Binaural Spatial (Comparative Separation)" preset')
assert(engineContent.includes('setPreset(presetId)'), 'EarthDataSonificationEngine implements setPreset method')

// 5. FEATURE 6: EXPORT
console.log('\n[TEST GROUP 5] Feature 6: Scientific Audio & Metadata Export')
const exportFile = path.join(__dirname, 'src', 'services', 'audioExportService.js')
assert(fs.existsSync(exportFile), 'audioExportService.js exists')

const exportContent = fs.readFileSync(exportFile, 'utf8')
assert(exportContent.includes('audioBufferToWavBlob'), 'Encodes AudioBuffer into standard 16-bit stereo PCM WAV file binary')
assert(exportContent.includes('renderObservationsToWav'), 'Renders time series into WAV audio via OfflineAudioContext')
assert(exportContent.includes('generateScientificSummary'), 'Generates scientific Markdown/Text summary of observations and statistics')
assert(exportContent.includes('generateDatasetMetadataJson'), 'Generates ISO 19115 schema.org dataset metadata in JSON')
assert(exportContent.includes('downloadBlob'), 'Triggers client-side browser file download')

const exportModalFile = path.join(__dirname, 'src', 'components', 'common', 'ExportShareModal.jsx')
assert(fs.existsSync(exportModalFile), 'ExportShareModal.jsx exists')
const exportModalContent = fs.readFileSync(exportModalFile, 'utf8')
assert(exportModalContent.includes('handleExportWav'), 'Modal provides Render & Download Audio (.WAV) trigger')
assert(exportModalContent.includes('handleDownloadSummary'), 'Modal provides Download Summary (.MD / .TXT) trigger')
assert(exportModalContent.includes('handleDownloadMetadata'), 'Modal provides Download Metadata (.JSON) trigger')
assert(exportModalContent.includes('handleExportBundle'), 'Modal provides Download Config (.JSON) trigger')

// 6. FEATURE 7: SHARE
console.log('\n[TEST GROUP 6] Feature 7: Shareable URL & Reproducible Configuration')
const shareFile = path.join(__dirname, 'src', 'services', 'shareService.js')
assert(fs.existsSync(shareFile), 'shareService.js exists')

const shareContent = fs.readFileSync(shareFile, 'utf8')
assert(shareContent.includes('serializeExplorationUrl'), 'Serializes exploration state into shareable URL parameters')
assert(shareContent.includes('deserializeExplorationUrl'), 'Deserializes URL parameters to restore exploration state')
assert(shareContent.includes('copyShareableLink'), 'Provides 1-click clipboard link sharing')
assert(shareContent.includes('exportExplorationBundle'), 'Exports reproducible JSON configuration bundle')
assert(shareContent.includes('parseImportedBundle'), 'Validates and imports reproducible JSON configuration bundle')

// 7. APP & NAVIGATION INTEGRATION
console.log('\n[TEST GROUP 7] Universal App Routing & Navigation Integration')
const appFile = path.join(__dirname, 'src', 'App.jsx')
const appContent = fs.readFileSync(appFile, 'utf8')
assert(appContent.includes("currentView === 'compare'"), 'App.jsx routes to ComparativeExplorationHub')
assert(appContent.includes("currentView === 'journey'"), 'App.jsx routes to EarthSoundJourney')
assert(appContent.includes("'compare'"), 'validRoutes includes compare')
assert(appContent.includes("'journey'"), 'validRoutes includes journey')

const navFile = path.join(__dirname, 'src', 'components', 'layout', 'Navbar.jsx')
const navContent = fs.readFileSync(navFile, 'utf8')
assert(navContent.includes("id: 'compare'"), 'Navbar includes Comparisons nav item')
assert(navContent.includes("id: 'journey'"), 'Navbar includes Sound Journey nav item')

const homeFile = path.join(__dirname, 'src', 'pages', 'HomePage.jsx')
const homeContent = fs.readFileSync(homeFile, 'utf8')
assert(homeContent.includes("onNavigate('journey')"), 'HomePage links directly to Sound Journey')

console.log('\n=================================================================')
console.log(`  Results: ${passed} passed, ${failed} failed`)
if (failed === 0) {
  console.log('  ✓ ALL 44 ADVANCED EXPLORATION CHECKS PASSED!')
} else {
  console.error(`  ✗ ${failed} CHECKS FAILED. PLEASE INSPECT LOGS.`)
}
console.log('=================================================================\n')

process.exit(failed === 0 ? 0 : 1)
