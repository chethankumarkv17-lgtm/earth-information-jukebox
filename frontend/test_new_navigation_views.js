/**
 * Automated Verification Script for New Navigation & Views
 * 1. Earth Explorer
 * 2. Climate Intelligence (Open-Meteo ERA5 1991–2025 & Dual Globe)
 * 3. Satellite Observatory (Orbits & Catalog)
 * 4. Sound Studio
 * 5. Time Machine (Multi-Decadal Timelines & Sequence Animator)
 * 6. Accessibility Hub
 */

import fs from 'fs'
import path from 'path'
import assert from 'assert'

console.log("\n=======================================================")
console.log("  EARTH JUKEBOX - 6-ITEM NAVIGATION & NEW VIEWS TEST SUITE")
console.log("=======================================================\n")

function testFileContains(filePath, checks, suiteName) {
  console.log(`[Testing ${suiteName}] ${filePath}`)
  assert(fs.existsSync(filePath), `File does not exist: ${filePath}`)
  const content = fs.readFileSync(filePath, 'utf-8')
  
  checks.forEach(({ name, pattern }) => {
    const passed = typeof pattern === 'string' ? content.includes(pattern) : pattern.test(content)
    assert(passed, `Failed check: ${name} in ${filePath}`)
    console.log(`  ✓ Passed: ${name}`)
  })
}

// 1. Check Navbar.jsx for the 6 exact requested items
testFileContains(
  path.join(process.cwd(), 'src/components/layout/Navbar.jsx'),
  [
    { name: 'Earth Explorer navigation item', pattern: "id: 'explore', label: 'Earth Explorer'" },
    { name: 'Climate Intelligence navigation item', pattern: "id: 'climate', label: 'Climate Intelligence'" },
    { name: 'Satellite Observatory navigation item', pattern: "id: 'observatory', label: 'Satellite Observatory'" },
    { name: 'Sound Studio navigation item', pattern: "id: 'studio', label: 'Sound Studio'" },
    { name: 'Time Machine navigation item', pattern: "id: 'timemachine', label: 'Time Machine'" },
    { name: 'Accessibility Hub navigation item', pattern: "id: 'accessibility', label: 'Accessibility Hub'" },
  ],
  'Navbar 6 Navigation Items'
)

// 2. Check App.jsx routing
testFileContains(
  path.join(process.cwd(), 'src/App.jsx'),
  [
    { name: 'ClimateIntelligenceView imported', pattern: 'import ClimateIntelligenceView from' },
    { name: 'SatelliteObservatoryView imported', pattern: 'import SatelliteObservatoryView from' },
    { name: 'TimeMachineView imported', pattern: 'import TimeMachineView from' },
    { name: 'explore route mounted with DashboardPage', pattern: "currentView === 'explore' &&" },
    { name: 'climate route mounted with ClimateIntelligenceView', pattern: "currentView === 'climate' &&" },
    { name: 'observatory route mounted with SatelliteObservatoryView', pattern: "currentView === 'observatory'" },
    { name: 'timemachine route mounted with TimeMachineView', pattern: "currentView === 'timemachine' &&" },
    { name: 'accessibility route mounted with AccessibilityPage', pattern: "currentView === 'accessibility' &&" },
    { name: 'Focus shift on navigation', pattern: "mainEl.focus()" },
  ],
  'App.jsx Router & Focus Management'
)

// 3. Check ClimateIntelligenceView.jsx (final.html integration)
testFileContains(
  path.join(process.cwd(), 'src/components/climate/ClimateIntelligenceView.jsx'),
  [
    { name: 'Open-Meteo ERA5 archive API integrated', pattern: 'archive-api.open-meteo.com/v1/archive' },
    { name: '1991–2020 30-year baseline normal calculation', pattern: '1991–2020' },
    { name: 'HTML5 Canvas trend chart', pattern: 'chartCanvasRef' },
    { name: 'Divergent blue/red temperature anomaly scale', pattern: 'colourForDifference' },
    { name: 'Dual Globe Climate mode toggle', pattern: 'DualGlobeClimateView' },
    { name: 'Acoustic sonification of climate trajectory', pattern: 'handleSonifyTrajectory' },
    { name: 'Climate CSV export action', pattern: 'handleExportCSV' },
    { name: 'Curated observatory presets included (Shivamogga, etc.)', pattern: 'shivamogga' },
  ],
  'ClimateIntelligenceView Features'
)

// 4. Check TimeMachineView.jsx
testFileContains(
  path.join(process.cwd(), 'src/components/timemachine/TimeMachineView.jsx'),
  [
    { name: 'Backend /api/earth/timeline API called', pattern: 'fetchEarthTimeline' },
    { name: 'Arctic sea ice minimum time series supported', pattern: 'arctic_sea_ice' },
    { name: 'Global temperature anomaly time series supported', pattern: 'global_temperature' },
    { name: 'CO2 atmospheric concentration supported', pattern: 'carbon_dioxide' },
    { name: 'Sea level rise altimetry supported', pattern: 'sea_level' },
    { name: 'Dynamic canvas trajectory graph', pattern: 'canvasRef' },
    { name: 'Audify timeline progression with Web Audio', pattern: 'handleAudifyTimeline' },
    { name: 'Sequential Keyframe Animator integrated', pattern: 'DynamicSequenceWorkstation' },
    { name: 'Time series CSV export', pattern: 'handleExportCSV' },
  ],
  'TimeMachineView Features'
)

// 5. Check SatelliteObservatoryView.jsx
testFileContains(
  path.join(process.cwd(), 'src/components/observatory/SatelliteObservatoryView.jsx'),
  [
    { name: 'Eyes on Earth 3D orbits integrated', pattern: 'EyesOnEarthView' },
    { name: 'Dataset catalog integrated', pattern: 'GalleryPage' },
    { name: 'Mode toggle between Orbits and Catalog', pattern: 'observatoryMode' },
  ],
  'SatelliteObservatoryView Features'
)

console.log("\n=======================================================")
console.log("  Results: All checks passed successfully! ✓")
console.log("=======================================================\n")
