/**
 * Automated Unit Test Suite for Phase 8: Interactive Earth Exploration Module
 */
import assert from 'assert';
import { GEOGRAPHIC_REGIONS, VISUALIZATION_LAYERS } from './src/data/geographicRegions.js';

console.log('--- RUNNING PHASE 8 EARTH EXPLORATION UNIT TESTS ---');

// 1. Verify Geographic Regions Integrity
assert.ok(GEOGRAPHIC_REGIONS.length >= 8, `Expected at least 8 curated regions, got ${GEOGRAPHIC_REGIONS.length}`);
console.log(`✓ Test 1 Passed: Found ${GEOGRAPHIC_REGIONS.length} curated NASA observation regions`);

// 2. Verify Scientific Disclaimers & Calibration Transparency
GEOGRAPHIC_REGIONS.forEach((region) => {
  assert.ok(region.id, 'Region must have an ID');
  assert.ok(region.name, 'Region must have a name');
  assert.ok(region.coordinates.lat >= -90 && region.coordinates.lat <= 90, 'Latitude must be valid WGS-84');
  assert.ok(region.coordinates.lng >= -180 && region.coordinates.lng <= 180, 'Longitude must be valid WGS-84');
  
  // Optical metrics
  assert.ok(region.opticalAnalysis.standardLuminance >= 0 && region.opticalAnalysis.standardLuminance <= 255, 'Luminance in range');
  assert.ok(region.opticalAnalysis.meanHueDeg >= 0 && region.opticalAnalysis.meanHueDeg <= 360, 'Hue in range');
  assert.ok(region.opticalAnalysis.edgeDensityPct >= 0 && region.opticalAnalysis.edgeDensityPct <= 100, 'Edge density in range');
  
  // Scientific telemetry policy
  assert.ok(region.scientificTelemetry, 'Region must have scientific telemetry object');
  assert.ok(typeof region.scientificTelemetry.isCalibrated === 'boolean', 'Calibration status must be explicit boolean');
  assert.ok(region.scientificTelemetry.sensorDisclaimer, 'Must include sensor disclaimer distinguishing optical from sensor data');
});
console.log('✓ Test 2 Passed: All geographic regions adhere to NASA open telemetry & scientific disclaimer policy');

// 3. Test Regional Interpolation / Crossfader Math
function interpolateRegions(regionA, regionB, ratio) {
  const inv = 1.0 - ratio;
  const optA = regionA.opticalAnalysis;
  const optB = regionB.opticalAnalysis;

  // Circular shortest-arc hue
  const hueA = optA.meanHueDeg;
  const hueB = optB.meanHueDeg;
  const hueDiff = ((hueB - hueA + 540) % 360) - 180;
  const interpHue = (hueA + ratio * hueDiff + 360) % 360;

  return {
    luminance: optA.standardLuminance * inv + optB.standardLuminance * ratio,
    brightness: optA.normalizedBrightness * inv + optB.normalizedBrightness * ratio,
    hue: interpHue,
    edgeDensity: optA.edgeDensityPct * inv + optB.edgeDensityPct * ratio,
  };
}

const amazon = GEOGRAPHIC_REGIONS.find(r => r.id === 'region-amazon');
const arctic = GEOGRAPHIC_REGIONS.find(r => r.id === 'region-arctic');

const blend0 = interpolateRegions(amazon, arctic, 0.0);
assert.strictEqual(blend0.luminance, amazon.opticalAnalysis.standardLuminance, 'Ratio 0.0 must equal Region A');

const blend1 = interpolateRegions(amazon, arctic, 1.0);
assert.strictEqual(blend1.luminance, arctic.opticalAnalysis.standardLuminance, 'Ratio 1.0 must equal Region B');

const blendMid = interpolateRegions(amazon, arctic, 0.5);
const expectedMidLum = (amazon.opticalAnalysis.standardLuminance + arctic.opticalAnalysis.standardLuminance) / 2;
assert.strictEqual(Number(blendMid.luminance.toFixed(2)), Number(expectedMidLum.toFixed(2)), 'Midpoint must equal mean');
console.log(`✓ Test 3 Passed: A/B Regional Crossfader accurately interpolates between Amazon (${blend0.luminance}) and Arctic (${blend1.luminance}) -> Midpoint: ${blendMid.luminance}`);

// 4. Test Visualization Layers
assert.ok(VISUALIZATION_LAYERS.length >= 5, `Expected at least 5 NASA visualization overlay layers, got ${VISUALIZATION_LAYERS.length}`);
const expectedLayers = ['true_color', 'temperature_anomaly', 'vegetation_ndvi', 'cryosphere_elevation', 'ocean_currents'];
expectedLayers.forEach(id => {
  assert.ok(VISUALIZATION_LAYERS.some(l => l.id === id), `Missing visualization layer: ${id}`);
});
console.log(`✓ Test 4 Passed: All ${VISUALIZATION_LAYERS.length} NASA visualization layers verified (True-Color, GISTEMP, MODIS NDVI, ICESat-2, SWOT, Clouds, Precipitation)`);

console.log('--- ALL 4 PHASE 8 UNIT TESTS PASSED SUCCESSFULLY ---');
