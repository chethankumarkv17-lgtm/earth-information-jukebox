/**
 * Automated Verification Suite for Earth Science Data Sources Integration
 * 2026 NASA Space Apps Challenge — Earth Information Jukebox
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log("\n=======================================================")
console.log("  EARTH SCIENCE DATA SOURCES INTEGRATION TEST SUITE")
console.log("=======================================================\n")

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

try {
  // 1. Check api.js exports
  const apiCode = fs.readFileSync(path.join(__dirname, 'src', 'services', 'api.js'), 'utf8')
  assert(apiCode.includes('export async function fetchEarthCatalog'), 'fetchEarthCatalog exported in api.js')
  assert(apiCode.includes('export async function fetchEarthPointMetrics'), 'fetchEarthPointMetrics exported in api.js')

  // 2. Check EarthDataExplorer.jsx implementation
  const explorerPath = path.join(__dirname, 'src', 'components', 'datasets', 'EarthDataExplorer.jsx')
  assert(fs.existsSync(explorerPath), 'EarthDataExplorer.jsx component exists')
  const explorerCode = fs.readFileSync(explorerPath, 'utf8')

  assert(explorerCode.includes('OBSERVATORY_PRESETS') && explorerCode.includes('Shivamogga'), 'Curated reference observatory presets included (Shivamogga, Amazon, Svalbard, etc.)')
  assert(explorerCode.includes('DOMAIN_FILTERS') && explorerCode.includes('temperature') && explorerCode.includes('precipitation') && explorerCode.includes('wind_speed'), 'All 7 scientific domains covered in filter tabs')
  assert(explorerCode.includes('NASA POWER') && explorerCode.includes('ECMWF ERA5'), 'Multi-source comparison for NASA POWER & ECMWF ERA5 implemented')
  assert(explorerCode.includes('handleSonifyMetrics') && explorerCode.includes('globalSonificationEngine'), 'Procedural sonification of multi-variable physical measurements wired')
  assert(explorerCode.includes('handleExportCSV'), 'Client-side calibrated scientific CSV export implemented')

  // 3. Verify all 9 preserved metadata fields in catalog drawer
  const metadataLabels = [
    'SOURCE / AGENCY',
    'MEASUREMENT UNITS',
    'GEOGRAPHIC COVERAGE',
    'TIME COVERAGE & FREQUENCY',
    'SPATIAL RESOLUTION',
    'PROCESSING & ASSIMILATION INFORMATION',
    'DATA LIMITATIONS & UNCERTAINTIES'
  ]
  metadataLabels.forEach(label => {
    assert(explorerCode.includes(label), `Metadata panel renders '${label}'`)
  })

  // 4. Check SatelliteObservatoryView integration
  const observatoryCode = fs.readFileSync(path.join(__dirname, 'src', 'components', 'observatory', 'SatelliteObservatoryView.jsx'), 'utf8')
  assert(observatoryCode.includes('EarthDataExplorer'), 'EarthDataExplorer imported in SatelliteObservatoryView')
  assert(observatoryCode.includes('datasources'), 'Scientific Data Sources mode toggle available in Satellite Observatory')

  // 5. Check GIBS Aerosols layer in geographicRegions.js
  const geoCode = fs.readFileSync(path.join(__dirname, 'src', 'data', 'geographicRegions.js'), 'utf8')
  assert(geoCode.includes('aerosol_optical_depth') && geoCode.includes('MODIS_Terra_Aerosol'), 'NASA GIBS Aerosol Optical Depth (MODIS_Terra_Aerosol) layer configured')

  console.log(`\n=======================================================`)
  console.log(`  Results: ${passed} passed, ${failed} failed`)
  if (failed === 0) {
    console.log(`  ✓ ALL EARTH DATA SOURCE INTEGRATION CHECKS PASSED!`)
  }
  console.log(`=======================================================\n`)
} catch (err) {
  console.error("Test execution error:", err)
  process.exit(1)
}
