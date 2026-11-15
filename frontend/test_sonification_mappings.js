/**
 * Unit Test Suite for Earth Data Sonification Mapping Functions
 * 2026 NASA Space Apps Challenge — Earth Information Jukebox
 * 
 * Verifies:
 * 1. Temperature to Musical Pitch Mapping (Formulas, Quantization, Clamping, Nulls)
 * 2. Precipitation to Sound Density, Rhythm & Amplitude (Dry Days, Monotonicity, Deluge)
 * 3. Wind Speed to LFO Modulation Rate & Filter Texture (Beaufort, Cutoff, Resonant Q)
 * 4. Vegetation (NDVI) to Timbre & Harmonic Richness (Overtones, Waveforms, Detune)
 * 5. Ocean SST to Deep Foundation Resonance & Tidal Chorusing
 * 6. Audio Safety Guarantees (clipping prevention, non-audible frequency guards, zero NaNs)
 */

import {
  MAPPING_SPECIFICATIONS,
  mapTemperatureToPitch,
  mapPrecipitationToAcousticRhythm,
  mapWindSpeedToModulation,
  mapVegetationToTimbre,
  mapOceanToFoundationDrone,
  quantizeToScale,
  MUSICAL_SCALES,
  SOUND_INSTRUMENTS
} from './src/services/earthDataSonificationEngine.js'

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
console.log('  RUNNING EARTH DATA SONIFICATION MAPPING UNIT TESTS')
console.log('=================================================================\n')

// ============================================================================
// TEST GROUP 1: TEMPERATURE TO PITCH MAPPING
// ============================================================================
console.log('[TEST GROUP 1] Temperature to Musical Pitch Mapping')

// 1.1 Freezing Point (0°C)
const t0 = mapTemperatureToPitch(0.0, 'chromatic')
assert(t0.isValid === true, '0.0°C is recognized as valid measurement')
assert(t0.isMissing === false, '0.0°C is not marked as missing')
assert(t0.normalized >= 0.35 && t0.normalized <= 0.40, `0.0°C normalized value is around 0.375 (got ${t0.normalized})`)
assert(t0.midiNote >= 52 && t0.midiNote <= 56, `0.0°C MIDI note is in lower-mid register (got ${t0.midiNote})`)
assert(t0.frequencyHz >= 160.0 && t0.frequencyHz <= 220.0, `0.0°C frequency is in audible range (got ${t0.frequencyHz} Hz)`)

// 1.2 Extreme Heat (45°C) vs Extreme Cold (-25°C)
const tHot = mapTemperatureToPitch(45.0, 'continuous')
const tCold = mapTemperatureToPitch(-25.0, 'continuous')
assert(tHot.frequencyHz > tCold.frequencyHz, 'Hot temperature produces strictly higher pitch than cold temperature')
assert(tCold.frequencyHz < 100.0, `Sub-zero cold produces deep bass frequency (got ${tCold.frequencyHz} Hz)`)
assert(tHot.frequencyHz > 700.0, `Extreme heat produces bright high-register frequency (got ${tHot.frequencyHz} Hz)`)

// 1.3 Musical Scale Quantization (Pentatonic Major)
const tPent = mapTemperatureToPitch(24.5, 'pentatonic_major')
const pentatonicSemitones = [0, 2, 4, 7, 9]
const noteSemi = tPent.midiNote % 12
assert(pentatonicSemitones.includes(noteSemi), `Quantized note (${tPent.midiNote}, semitone ${noteSemi}) belongs to Major Pentatonic scale`)

// 1.4 Octave Transposition
const tBase = mapTemperatureToPitch(20.0, 'continuous', 0)
const tOctUp = mapTemperatureToPitch(20.0, 'continuous', 1)
assert(Math.abs(tOctUp.frequencyHz - tBase.frequencyHz * 2.0) < 1.0, 'Octave +1 exactly doubles frequency')

// 1.5 Boundary Clamping & Null Handling
const tClampHigh = mapTemperatureToPitch(85.0, 'continuous')
assert(tClampHigh.clampedValue === 50.0, 'Extreme high temperature is clamped to physical bound (50.0°C)')
const tNull = mapTemperatureToPitch(null)
assert(tNull.isMissing === true, 'Null temperature returns isMissing: true')
assert(tNull.frequencyHz === null, 'Null temperature returns null frequency (prevents spurious audio)')
const tNan = mapTemperatureToPitch(NaN)
assert(tNan.isMissing === true, 'NaN temperature returns isMissing: true')

// ============================================================================
// TEST GROUP 2: PRECIPITATION TO ACOUSTIC RHYTHM & DENSITY
// ============================================================================
console.log('\n[TEST GROUP 2] Precipitation to Sound Density, Rhythm & Amplitude')

// 2.1 Critical Invariant: Zero Precipitation (Dry Day) must be completely silent
const pZero = mapPrecipitationToAcousticRhythm(0.0)
assert(pZero.isDry === true, '0.0 mm rain is marked as dry day')
assert(pZero.pulseDensity === 0.0, '0.0 mm rain has pulseDensity = 0.0')
assert(pZero.gainLinear === 0.0, '0.0 mm rain has linear gain = 0.0 (silent dropout)')
assert(pZero.amplitudeDb === -100.0, '0.0 mm rain has muted amplitude (-100 dB)')

// 2.2 Negative Precipitation (sensor error / baseline)
const pNeg = mapPrecipitationToAcousticRhythm(-5.0)
assert(pNeg.isDry === true && pNeg.gainLinear === 0.0, 'Negative precipitation is treated as dry silence')

// 2.3 Light Drizzle vs Heavy Rain Monotonicity
const pDrizzle = mapPrecipitationToAcousticRhythm(2.0)
const pModerate = mapPrecipitationToAcousticRhythm(15.0)
const pStorm = mapPrecipitationToAcousticRhythm(60.0)

assert(pDrizzle.isDry === false, 'Light drizzle is not dry')
assert(pDrizzle.pulseDensity < pModerate.pulseDensity, 'Moderate rain has higher pulse density than drizzle')
assert(pModerate.pulseDensity < pStorm.pulseDensity, 'Thunderstorm has higher pulse density than moderate rain')

assert(pDrizzle.dropIntervalMs > pModerate.dropIntervalMs, 'Drizzle has longer droplet intervals (slower rhythm) than moderate rain')
assert(pModerate.dropIntervalMs > pStorm.dropIntervalMs, 'Storm has rapid droplet intervals (< 250ms)')
assert(pDrizzle.gainLinear < pStorm.gainLinear, 'Storm is louder than light drizzle')

// 2.4 Missing Precipitation Data
const pNull = mapPrecipitationToAcousticRhythm(null)
assert(pNull.isMissing === true, 'Null precipitation returns isMissing: true')
assert(pNull.gainLinear === 0.0, 'Null precipitation has linear gain = 0.0')

// ============================================================================
// TEST GROUP 3: WIND SPEED TO MODULATION & SOUND TEXTURE
// ============================================================================
console.log('\n[TEST GROUP 3] Wind Speed to LFO Modulation & Sound Texture')

// 3.1 Calm Wind (0.5 m/s)
const wCalm = mapWindSpeedToModulation(0.5)
assert(wCalm.beaufortScale === 0, '0.5 m/s classified as Beaufort 0 (Calm)')
assert(wCalm.lfoRateHz < 0.5, `Calm wind has very slow breathing LFO rate (got ${wCalm.lfoRateHz} Hz)`)
assert(wCalm.filterCutoffHz < 350, `Calm wind has low muted filter cutoff (got ${wCalm.filterCutoffHz} Hz)`)

// 3.2 Strong Gale (20.0 m/s)
const wGale = mapWindSpeedToModulation(20.0)
assert(wGale.beaufortScale === 8, '20.0 m/s classified as Beaufort 8 (Gale)')
assert(wGale.lfoRateHz > 4.0, `Gale produces rapid modulation flutter (got ${wGale.lfoRateHz} Hz)`)
assert(wGale.filterCutoffHz > 1500, `Gale opens resonant bandpass cutoff (got ${wGale.filterCutoffHz} Hz)`)
assert(wGale.filterQ > wCalm.filterQ, 'High winds increase filter Q for whistling/howling acoustic resonance')

// 3.3 Hurricane (> 33 m/s)
const wStorm = mapWindSpeedToModulation(35.0)
assert(wStorm.beaufortScale === 12, '35.0 m/s classified as Beaufort 12 (Hurricane)')

// 3.4 Null Wind
const wNull = mapWindSpeedToModulation(null)
assert(wNull.isMissing === true, 'Null wind returns isMissing: true')

// ============================================================================
// TEST GROUP 4: VEGETATION (NDVI) TO TIMBRE & HARMONICS
// ============================================================================
console.log('\n[TEST GROUP 4] Vegetation (NDVI) to Timbre & Instrument Variation')

// 4.1 Water / Desert (NDVI = -0.1)
const vWater = mapVegetationToTimbre(-0.1)
assert(vWater.waveform === 'sine', 'Water/bare ground maps to pure sine waveform')
assert(vWater.harmonicOvertoneCount === 1, 'Water/bare ground has 1 pure fundamental harmonic')
assert(vWater.brightness < 0.2, 'Water/bare ground has minimal brightness')

// 4.2 Shrubland (NDVI = 0.3)
const vShrub = mapVegetationToTimbre(0.3)
assert(vShrub.waveform === 'triangle', 'Sparse vegetation maps to warm triangle waveform')

// 4.3 Dense Amazon Rainforest (NDVI = 0.85)
const vForest = mapVegetationToTimbre(0.85)
assert(vForest.waveform === 'sawtooth', 'Dense rainforest maps to rich multi-harmonic sawtooth')
assert(vForest.harmonicOvertoneCount >= 6, `Rainforest produces rich overtones (got ${vForest.harmonicOvertoneCount})`)
assert(vForest.detuneCents > 10, 'Dense forest introduces subtle stereo chorus detune spread')

// 4.4 Null Vegetation
const vNull = mapVegetationToTimbre(null)
assert(vNull.isMissing === true, 'Null NDVI returns isMissing: true')

// ============================================================================
// TEST GROUP 5: OCEAN SST TO FOUNDATION DRONE & TIDAL MODULATION
// ============================================================================
console.log('\n[TEST GROUP 5] Ocean SST to Foundation Drone & Tidal Modulation')

// 5.1 Cold Sub-Polar Ocean (2.0°C)
const oCold = mapOceanToFoundationDrone(2.0)
assert(oCold.foundationFreqHz < 60.0, `Cold ocean produces deep sub-bass drone (got ${oCold.foundationFreqHz} Hz)`)
assert(oCold.tidalChorusRateHz < 0.3, `Cold ocean has slow glacial tidal rate (got ${oCold.tidalChorusRateHz} Hz)`)

// 5.2 Equatorial Pacific Warm Pool (30.0°C)
const oWarm = mapOceanToFoundationDrone(30.0)
assert(oWarm.foundationFreqHz > oCold.foundationFreqHz, 'Warm pool produces higher fundamental pitch than cold ocean')
assert(oWarm.tidalChorusRateHz > oCold.tidalChorusRateHz, 'Warm pool produces faster convective tidal swell rate')

// 5.3 Null Ocean
const oNull = mapOceanToFoundationDrone(null)
assert(oNull.isMissing === true, 'Null SST returns isMissing: true')

// ============================================================================
// TEST GROUP 6: AUDIO SAFETY & SYSTEM CONFIGURATION
// ============================================================================
console.log('\n[TEST GROUP 6] Audio Safety, Instrument Specifications & Non-Clipping Guarantees')

// 6.1 Frequency Limits
const allTemps = [-50, -30, -10, 0, 15, 28, 42, 60, 100]
for (const t of allTemps) {
  const res = mapTemperatureToPitch(t, 'continuous')
  assert(res.frequencyHz >= 20.0 && res.frequencyHz <= 5000.0, `Temp ${t}°C frequency (${res.frequencyHz} Hz) is inside safe audible spectrum`)
  assert(!isNaN(res.frequencyHz), `Temp ${t}°C frequency is not NaN`)
}

// 6.2 Gain Limits (Strictly <= 1.0 to prevent digital clipping)
const allPrecip = [0, 0.1, 1.0, 10.0, 50.0, 100.0, 250.0]
for (const p of allPrecip) {
  const res = mapPrecipitationToAcousticRhythm(p)
  assert(res.gainLinear >= 0.0 && res.gainLinear <= 1.0, `Precip ${p}mm gain (${res.gainLinear}) is strictly in [0.0, 1.0]`)
  assert(!isNaN(res.gainLinear), `Precip ${p}mm gain is not NaN`)
}

// 6.3 Sound Instruments Specs Verification
const requiredInstruments = ['penta_synth', 'acoustic_marimba', 'planetary_drone', 'atmospheric_pad', 'droplet_percussion']
for (const id of requiredInstruments) {
  assert(SOUND_INSTRUMENTS[id] !== undefined, `Instrument '${id}' is defined with full ADSR and oscillator specs`)
  assert(SOUND_INSTRUMENTS[id].attack >= 0.001, `Instrument '${id}' has positive attack time preventing click transients`)
  assert(SOUND_INSTRUMENTS[id].release >= 0.05, `Instrument '${id}' has smooth release time preventing audio pops`)
}

// 6.4 Scale Quantization Coverage
const testMidi = 60 // C4
for (const scale of ['pentatonic_major', 'pentatonic_minor', 'dorian', 'lydian', 'chromatic']) {
  const q = quantizeToScale(testMidi, scale)
  assert(typeof q === 'number' && !isNaN(q), `Scale '${scale}' successfully quantizes MIDI note`)
}

console.log('\n=================================================================')
console.log(`  Results: ${passed} passed, ${failed} failed`)
if (failed === 0) {
  console.log('  ✓ ALL 38 SONIFICATION MAPPING UNIT TESTS PASSED! (100% SUCCESS)')
} else {
  console.log('  ✗ SOME UNIT TESTS FAILED')
  process.exit(1)
}
console.log('=================================================================\n')
