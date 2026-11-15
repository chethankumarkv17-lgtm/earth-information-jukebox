/**
 * Automated Unit Test Suite for Dynamic Sequence Sonification (Phase 7)
 */
import assert from 'assert';

console.log('--- RUNNING PHASE 7 DYNAMIC SEQUENCE SONIFICATION UNIT TESTS ---');

// 1. Circular Shortest-Arc Hue Interpolation
function interpolateHue(hueA, hueB, alpha) {
  const diff = ((hueB - hueA + 540) % 360) - 180;
  return (hueA + alpha * diff + 360) % 360;
}

// Test: 350° (red) to 10° (red-orange) across 0°
const h1 = interpolateHue(350, 10, 0.5);
assert.strictEqual(h1, 0, `Expected 0 degrees crossing 360/0 boundary, got ${h1}`);
console.log('✓ Test 1 Passed: Circular hue interpolation across 0° boundary correctly yields 0°');

// Test: 120° (green) to 240° (blue) at midpoint
const h2 = interpolateHue(120, 240, 0.5);
assert.strictEqual(h2, 180, `Expected 180 degrees (cyan), got ${h2}`);
console.log('✓ Test 2 Passed: Circular hue interpolation at midpoint (120° to 240°) yields 180°');

// 2. Linear Feature Interpolation
function interpolateFeature(valA, valB, alpha) {
  return (valA * (1 - alpha)) + (valB * alpha);
}

const lumInterp = interpolateFeature(0.40, 0.80, 0.25);
assert.strictEqual(Number(lumInterp.toFixed(4)), 0.5000);
console.log('✓ Test 3 Passed: Luminance feature interpolation (0.40 -> 0.80 @ 0.25) yields 0.50');

// 3. Filter Cutoff Formula: 400 Hz + lum^1.35 * 8100 Hz
function calculateFilterCutoff(lumNorm) {
  return Math.round(400 + Math.pow(lumNorm, 1.35) * 8100);
}

const cutoffMin = calculateFilterCutoff(0.0);
const cutoffMax = calculateFilterCutoff(1.0);
const cutoffMid = calculateFilterCutoff(0.5);
assert.strictEqual(cutoffMin, 400, 'Minimum filter cutoff should be 400 Hz');
assert.strictEqual(cutoffMax, 8500, 'Maximum filter cutoff should be 8500 Hz');
assert.ok(cutoffMid > 3000 && cutoffMid < 4000, `Mid cutoff should be in 3-4 kHz range, got ${cutoffMid}`);
console.log(`✓ Test 4 Passed: Filter cutoff curve verified (Min: ${cutoffMin} Hz, Mid: ${cutoffMid} Hz, Max: ${cutoffMax} Hz)`);

// 4. Stereo Panning Formula: (centroidX - 0.5) * 1.76 clamped to [-0.88, +0.88]
function calculatePan(cx) {
  return Math.max(-0.88, Math.min(0.88, (cx - 0.5) * 1.76));
}

assert.strictEqual(calculatePan(0.5), 0, 'Centroid 0.5 should result in center pan');
assert.ok(calculatePan(0.1) < -0.7, 'Western centroid should pan hard left');
assert.ok(calculatePan(0.9) > +0.7, 'Eastern centroid should pan hard right');
console.log('✓ Test 5 Passed: Spatial stereo panning tracks satellite centroid accurately');

// 5. Sequence Timeline & Playback Speed Scaling
function calculateEffectiveDuration(framesCount, fps, speed) {
  const baseDuration = framesCount / fps;
  return baseDuration / speed;
}

const normalDur = calculateEffectiveDuration(24, 3.0, 1.0);
const fastDur = calculateEffectiveDuration(24, 3.0, 2.0);
const slowDur = calculateEffectiveDuration(24, 3.0, 0.5);
assert.strictEqual(normalDur, 8.0, '24 frames @ 3 fps = 8s');
assert.strictEqual(fastDur, 4.0, 'At 2x speed, duration is halved to 4s');
assert.strictEqual(slowDur, 16.0, 'At 0.5x speed, duration is doubled to 16s');
console.log('✓ Test 6 Passed: Timeline duration scales reciprocally with playback speed');

// 6. Arpeggio Subdivision Threshold Mapping from Canny Edge Density
function getArpSubdivision(edgeDensity) {
  if (edgeDensity < 0.15) return '1/4-note (sparse)';
  if (edgeDensity < 0.40) return '1/8-note (steady)';
  return '1/16-note (syncopated)';
}

assert.strictEqual(getArpSubdivision(0.08), '1/4-note (sparse)');
assert.strictEqual(getArpSubdivision(0.24), '1/8-note (steady)');
assert.strictEqual(getArpSubdivision(0.48), '1/16-note (syncopated)');
console.log('✓ Test 7 Passed: Edge density triggers progressive rhythmic complexity');

console.log('--- ALL 7 PHASE 7 DYNAMIC SEQUENCE UNIT TESTS PASSED SUCCESSFULLY ---');
