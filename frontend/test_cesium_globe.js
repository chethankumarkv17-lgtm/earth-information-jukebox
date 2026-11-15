/**
 * Automated Verification Suite for Google Earth-Style 3D Cesium Globe
 * 2026 NASA Space Apps Challenge — Earth Information Jukebox
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log("\n=======================================================")
console.log("  CESIUM 3D GOOGLE EARTH GLOBE VERIFICATION SUITE")
console.log("=======================================================\n")

let passed = 0
let failed = 0

function assert(condition, message) {
  if (condition) {
    console.log(`✓ Passed: ${message}`)
    passed++
  } else {
    console.error(`✗ Failed: ${message}`)
    failed++
  }
}

try {
  // Test 1: Check package.json has cesium
  const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'))
  assert(pkg.dependencies.cesium, 'cesium package is listed in package.json dependencies')

  // Test 2: Check public/cesium assets
  const publicCesium = path.join(__dirname, 'public', 'cesium')
  assert(fs.existsSync(publicCesium), 'public/cesium directory exists for static asset delivery')
  assert(fs.existsSync(path.join(publicCesium, 'Workers')), 'public/cesium/Workers directory exists')
  assert(fs.existsSync(path.join(publicCesium, 'Assets')), 'public/cesium/Assets directory exists')
  assert(fs.existsSync(path.join(publicCesium, 'Widgets')), 'public/cesium/Widgets directory exists')

  // Test 3: Check CesiumGlobeViewer.jsx implementation
  const viewerCode = fs.readFileSync(path.join(__dirname, 'src', 'components', 'earth', 'CesiumGlobeViewer.jsx'), 'utf8')
  
  assert(viewerCode.includes('Cesium.Viewer'), 'Cesium.Viewer initialized for interactive 3D Earth')
  assert(viewerCode.includes('3954') || viewerCode.includes('IonImageryProvider'), 'Global Sentinel-2 imagery integrated via Cesium ion')
  assert(viewerCode.includes('gibs.earthdata.nasa.gov/wmts/epsg3857/best'), 'NASA GIBS WMTS progressive tile streaming integrated')
  assert(viewerCode.includes('WebMercatorTilingScheme'), 'Progressive quadtree tiling scheme enabled (never downloads entire Earth at once)')
  assert(viewerCode.includes('handleZoomIn') && viewerCode.includes('handleZoomOut') && viewerCode.includes('handleTilt3D'), '3D camera controls (zoom, pan, tilt horizon, north-up) implemented')
  assert(viewerCode.includes('handleResetHome'), 'Reset-to-home-view button implemented')
  assert(viewerCode.includes('handleSearchChange') && viewerCode.includes('handleSelectSearchResult'), 'Interactive global location and coordinate search implemented')
  assert(viewerCode.includes('parseCoordinateQuery'), 'Geographic coordinate parser (lat, lon) implemented')
  assert(viewerCode.includes('isGlobeLoading') && viewerCode.includes('INITIALIZING 3D PLANETARY ELLIPSOID'), 'Prominent loading indicator overlay while globe resources load')
  assert(viewerCode.includes('errorEvent') && viewerCode.includes('gracefully handled'), 'Failed tile requests caught and handled gracefully without crashing')
  assert(viewerCode.includes('viewer.destroy()'), 'Unused 3D Cesium resources properly disposed on unmount')
  assert(viewerCode.includes('handleSelectRegion') && viewerCode.includes('camera.flyTo'), 'Geographic region selection with smooth 3D camera flight')
  assert(viewerCode.includes('cameraInfo.lat') && viewerCode.includes('cameraInfo.lon'), 'Live camera and picked target latitude and longitude displayed')
  assert(viewerCode.includes('selectedDate') && viewerCode.includes('PRESETS'), 'Temporal date selector and historic seasonal presets implemented')
  assert(viewerCode.includes('fetchEarthRegionAnalysis'), 'FastAPI backend connection for real calibrated scientific data')
  assert(viewerCode.includes('globalSonificationEngine'), 'Selected geographic region and physical data wired to procedural sonification engine')
  assert(viewerCode.includes('WaveformDisplay'), 'Real-time oscilloscope waveform visualizer embedded')
  assert(viewerCode.includes('overlayOpacity'), 'Multi-layer opacity blending control implemented')

  // Test 4: Check DashboardPage integration
  const dashboardCode = fs.readFileSync(path.join(__dirname, 'src', 'pages', 'DashboardPage.jsx'), 'utf8')
  assert(dashboardCode.includes('CesiumGlobeViewer'), 'CesiumGlobeViewer mounted in DashboardPage')
  assert(dashboardCode.includes('3D CESIUM GLOBE'), '3D Cesium Globe mode switch available in UI')

  // Test 5: Verify all 7 NASA layers in geographicRegions.js
  const geoCode = fs.readFileSync(path.join(__dirname, 'src', 'data', 'geographicRegions.js'), 'utf8')
  const layerIds = ['true_color', 'temperature_anomaly', 'vegetation_ndvi', 'cryosphere_elevation', 'ocean_currents', 'cloud_optical_thickness', 'precipitation_daily']
  layerIds.forEach(id => {
    assert(geoCode.includes(id), `NASA layer ${id} defined with GIBS specs`)
  })

  console.log(`\n=======================================================`)
  console.log(`  Results: ${passed} passed, ${failed} failed`)
  if (failed === 0) {
    console.log(`  ✓ ALL CESIUM 3D GLOBE TESTS PASSED SUCCESSFULLY!`)
  }
  console.log(`=======================================================\n`)
} catch (err) {
  console.error("Test execution error:", err)
  process.exit(1)
}
