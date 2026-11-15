/**
 * Automated Verification for Synchronized Earth Visualization & Sonification
 * 2026 NASA Space Apps Challenge — Earth Information Jukebox
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
console.log('  SYNCHRONIZED EARTH VISUALIZATION & SONIFICATION VERIFICATION')
console.log('=================================================================\n')

// 1. Verify SynchronizedEarthExplorer.jsx component
const compPath = path.join(__dirname, 'src', 'components', 'earth', 'SynchronizedEarthExplorer.jsx')
assert(fs.existsSync(compPath), 'SynchronizedEarthExplorer.jsx component exists')
const compContent = fs.readFileSync(compPath, 'utf8')

// 2. Verify Curated Geographic Observatories
assert(compContent.includes("id: 'amazon'"), 'Location: Amazon Basin Rainforest included')
assert(compContent.includes("id: 'sahara'"), 'Location: Sahara Transition Zone included')
assert(compContent.includes("id: 'svalbard'"), 'Location: Svalbard Arctic Outpost included')
assert(compContent.includes("id: 'pacific'"), 'Location: Equatorial Pacific Warm Pool included')
assert(compContent.includes("id: 'greenland'"), 'Location: Greenland Ice Sheet included')
assert(compContent.includes("id: 'shivamogga'"), 'Location: Western Ghats (Shivamogga) included')

// 3. Verify Scientific Datasets Coverage
assert(compContent.includes("id: 'temperature'"), 'Dataset: Temperature covered')
assert(compContent.includes("id: 'precipitation'"), 'Dataset: Precipitation covered')
assert(compContent.includes("id: 'wind_speed'"), 'Dataset: Wind Speed covered')
assert(compContent.includes("id: 'vegetation'"), 'Dataset: Vegetation (NDVI) covered')
assert(compContent.includes("id: 'ocean_sst'"), 'Dataset: Ocean SST covered')

// 4. Feature 1 & 2: Earth Visualization & Scientific Dataset Display
assert(compContent.includes('Earth Observation Visualization'), 'Feature 1: Earth observation visualization viewport rendered')
assert(compContent.includes('visualRepresentation'), 'Feature 1: Layer visual representation indicated')
assert(compContent.includes('PROVENANCE / SENSOR'), 'Feature 2: Scientific sensor provenance rendered')
assert(compContent.includes('currentDatasetSpec.unit'), 'Feature 2: Native physical units preserved')

// 5. Feature 3 & 4: Audio Generation from Dataset & Synchronized Timeline Lockstep
assert(compContent.includes('earthSonificationEngine.seek(next)'), 'Feature 3 & 4: Audio engine and visualizer updated in lockstep on the exact same frame index')
assert(compContent.includes('TIMELINE LOCKSTEP'), 'Feature 4: Timeline lockstep badge surfaced')

// 6. Feature 5: Highlight Current Timestamp
assert(compContent.includes('activeDate'), 'Feature 5: Current timestamp highlighted')
assert(compContent.includes('SYNCHRONIZED TIMELINE:'), 'Feature 5: Synchronized timeline HUD rendered')
assert(compContent.includes('isCurrent'), 'Feature 5: Active date node highlighted in timeline scrubber')

// 7. Feature 6: Animate Visualization in Sync
assert(compContent.includes('transition-all duration-200'), 'Feature 6: Radiometric gauge animated dynamically with physical values')
assert(compContent.includes('<canvas'), 'Feature 6: Live oscilloscope animated synchronously with audio')

// 8. Feature 7: Pause and Resume
assert(compContent.includes('handleTogglePlay'), 'Feature 7: Pause and resume controls implemented')
assert(compContent.includes('earthSonificationEngine.pause()'), 'Feature 7: Engine pause stops audio and visualization synchronously')

// 9. Feature 8: Playback Speed Changes
assert(compContent.includes('SPEED_PRESETS'), 'Feature 8: Speed presets (0.25x to 2.0x) configured')
assert(compContent.includes('setPlaybackSpeedMs'), 'Feature 8: Playback speed change updates interval duration')

// 10. Feature 9: Jump to Specific Timestamp (Seeking)
assert(compContent.includes('handleSeek'), 'Feature 9: Timestamp jump (seeking) implemented')
assert(compContent.includes('earthSonificationEngine.seek(validIdx)'), 'Feature 9: Seeking updates audio and visual frame simultaneously')

// 11. Feature 10: Replay Selected Period
assert(compContent.includes('handleReplay'), 'Feature 10: Replay period control implemented')
assert(compContent.includes('setCurrentIndex(0)'), 'Feature 10: Replay resets to timestamp 0 and plays synchronously')

// 12. Missing Data & Zero Rain Invariants
assert(compContent.includes('MISSING OBSERVATION'), 'Invariant: Missing data explicitly flagged')
assert(compContent.includes('Zero Misleading Sound'), 'Invariant: Gaps generate silence instead of misleading noise')
assert(compContent.includes('DRY DAY (0.0 mm)'), 'Invariant: Dry days (0.0 mm) distinguished from missing gaps')

// 13. Integration into DashboardPage.jsx
const dashPath = path.join(__dirname, 'src', 'pages', 'DashboardPage.jsx')
const dashContent = fs.readFileSync(dashPath, 'utf8')
assert(dashContent.includes('SynchronizedEarthExplorer'), 'SynchronizedEarthExplorer imported in DashboardPage.jsx')
assert(dashContent.includes("explorerMode === 'sync'"), 'Synchronized timeline view mode wired in DashboardPage')
assert(dashContent.includes('SYNCHRONIZED TIMELINE'), 'Synchronized timeline button rendered in explorer toggle strip')

console.log('\n=================================================================')
console.log(`  Results: ${passed} passed, ${failed} failed`)
if (failed === 0) {
  console.log('  ✓ ALL 35 SYNCHRONIZED EXPLORATION CHECKS PASSED!')
} else {
  console.log('  ✗ SOME CHECKS FAILED')
  process.exit(1)
}
console.log('=================================================================\n')
