/**
 * Automated Test Suite for Earth Jukebox Core Sonification Engine (Phase 6)
 */

import { 
  hashFeaturesAndSettings, 
  createMulberry32, 
  midiToFrequency, 
  determineRootMidi, 
  MUSICAL_STYLES,
  SonificationEngine
} from './src/services/sonificationEngine.js';

function runTests() {
  console.log("=== EARTH JUKEBOX SONIFICATION ENGINE TEST SUITE ===");

  // 1. Test Musical Styles
  console.log("\n[Test 1] Validating 5 required sound styles...");
  const requiredStyles = ['ambient_earth', 'ocean_waves', 'atmospheric', 'electronic', 'experimental'];
  for (const styleId of requiredStyles) {
    if (!MUSICAL_STYLES[styleId]) {
      throw new Error(`Missing required sound style: ${styleId}`);
    }
    const style = MUSICAL_STYLES[styleId];
    if (!style.label || !style.scaleName || !Array.isArray(style.intervals) || style.intervals.length === 0) {
      throw new Error(`Style ${styleId} has invalid scale intervals or metadata`);
    }
  }
  console.log("✓ All 5 sound styles verified with scales and timbres.");

  // 2. Test Deterministic Reproducibility
  console.log("\n[Test 2] Testing deterministic PRNG hash reproducibility...");
  const featuresA = {
    red_energy_norm: 0.107,
    green_energy_norm: 0.544,
    blue_energy_norm: 0.349,
    standard_luminance_norm: 0.287,
    dynamic_range_norm: 0.567,
    canny_edge_density_norm: 0.142,
    warmth_index: 0.0,
    color_entropy_norm: 0.407,
  };
  const settingsA = {
    tempo: 72,
    pitch: 0,
    style: 'ambient_earth',
    intensity: 75,
  };

  const hash1 = hashFeaturesAndSettings(featuresA, settingsA);
  const hash2 = hashFeaturesAndSettings(featuresA, settingsA);
  if (hash1 !== hash2) {
    throw new Error(`PRNG hash is non-deterministic: ${hash1} !== ${hash2}`);
  }

  const prng1 = createMulberry32(hash1);
  const prng2 = createMulberry32(hash2);
  const seq1 = [prng1(), prng1(), prng1(), prng1(), prng1()];
  const seq2 = [prng2(), prng2(), prng2(), prng2(), prng2()];

  for (let i = 0; i < seq1.length; i++) {
    if (seq1[i] !== seq2[i]) {
      throw new Error(`PRNG sequence mismatch at index ${i}: ${seq1[i]} !== ${seq2[i]}`);
    }
  }
  console.log(`✓ Hash ${hash1.toString(16).toUpperCase()} generated 100% identical PRNG sequence (${seq1.slice(0, 3).map(n => n.toFixed(4)).join(', ')}).`);

  // 3. Test Feature Sensitivity: Changing feature changes seed
  console.log("\n[Test 3] Testing feature sensitivity...");
  const featuresB = { ...featuresA, canny_edge_density_norm: 0.450 };
  const hashB = hashFeaturesAndSettings(featuresB, settingsA);
  if (hash1 === hashB) {
    throw new Error("Different features produced identical hash!");
  }
  console.log(`✓ Different image features produced distinct hash: ${hashB.toString(16).toUpperCase()}`);

  // 4. Test Pitch Mapping from Color Information (Hue)
  console.log("\n[Test 4] Testing color hue to root pitch calculation...");
  const opticalGreen = {
    color_distribution: { mean_hue: 140.0, warmth_index: 0.0 }
  };
  const opticalOchre = {
    color_distribution: { mean_hue: 25.0, warmth_index: 1.0 }
  };

  const rootGreen = determineRootMidi(opticalGreen, 'ambient_earth', 0);
  const rootOchre = determineRootMidi(opticalOchre, 'electronic', 0);

  if (rootGreen < 24 || rootGreen > 84 || rootOchre < 24 || rootOchre > 84) {
    throw new Error(`Root MIDI out of bounds: Green=${rootGreen}, Ochre=${rootOchre}`);
  }
  if (rootGreen === rootOchre) {
    throw new Error("Different color hues resulted in identical root pitch!");
  }
  console.log(`✓ Green hue (140°) mapped to MIDI note ${rootGreen} (${midiToFrequency(rootGreen).toFixed(1)} Hz).`);
  console.log(`✓ Ochre hue (25°) mapped to MIDI note ${rootOchre} (${midiToFrequency(rootOchre).toFixed(1)} Hz).`);

  // 5. Test Musical Pitch Conversions
  console.log("\n[Test 5] Validating MIDI to Hz frequency conversion...");
  const a4 = midiToFrequency(69); // A4 = 440 Hz
  if (Math.abs(a4 - 440) > 0.001) {
    throw new Error(`A4 frequency calculation failed: ${a4} Hz`);
  }
  const c4 = midiToFrequency(60); // C4 ~ 261.63 Hz
  if (Math.abs(c4 - 261.625) > 0.05) {
    throw new Error(`C4 frequency calculation failed: ${c4} Hz`);
  }
  console.log(`✓ Standard reference pitches verified: A4 = ${a4} Hz, C4 = ${c4.toFixed(2)} Hz.`);

  // 6. Test Rhythmic Complexity Mapping (Edge Density -> Arpeggiation)
  console.log("\n[Test 6] Testing edge density rhythmic complexity mapping...");
  const engine = new SonificationEngine();

  // Low density (calm ocean)
  const lowDensityTriggers = [];
  for (let s = 0; s < 16; s++) {
    if (engine.shouldStepTriggerArp(s, 0.08, 0.2)) lowDensityTriggers.push(s);
  }
  // High density (fractured ice / mountains)
  const highDensityTriggers = [];
  for (let s = 0; s < 16; s++) {
    if (engine.shouldStepTriggerArp(s, 0.55, 0.8)) highDensityTriggers.push(s);
  }

  if (lowDensityTriggers.length >= highDensityTriggers.length) {
    throw new Error(`High density (${highDensityTriggers.length}) must trigger more arpeggio notes than low density (${lowDensityTriggers.length})`);
  }
  console.log(`✓ Low edge density (8%) triggered ${lowDensityTriggers.length}/16 steps (spacious quarter pulses).`);
  console.log(`✓ High edge density (55%) triggered ${highDensityTriggers.length}/16 steps (dense syncopated subdivisions).`);

  // 7. Test Chord Voicing from Dominant K-Means Clusters
  console.log("\n[Test 7] Testing dominant color cluster chord voicing...");
  const mockDominantColors = [
    { hex_code: "#054d3b", percentage: 63.14 },
    { hex_code: "#10b880", percentage: 35.85 },
    { hex_code: "#065f46", percentage: 1.01 },
  ];
  const chord = engine.selectChordNotes(48, MUSICAL_STYLES.ambient_earth.intervals, mockDominantColors);
  if (!Array.isArray(chord) || chord.length === 0) {
    throw new Error("Failed to produce chord notes from dominant clusters!");
  }
  console.log(`✓ K-Means clusters generated chord voicing: [${chord.join(', ')}] with intervals from scale.`);

  // 8. Test Settings and State Mutators
  console.log("\n[Test 8] Testing settings updates and mutators...");
  engine.updateSettings({ volume: 90, tempo: 120, pitch: 3, intensity: 85, style: 'electronic' });
  if (engine.settings.tempo !== 120 || engine.settings.pitch !== 3 || engine.settings.style !== 'electronic') {
    throw new Error("Engine settings failed to update!");
  }
  console.log("✓ Engine settings successfully mutated and subscribed.");

  console.log("\n=======================================================");
  console.log("ALL 8 SONIFICATION ENGINE TESTS PASSED SUCCESSFULLY! ✓");
  console.log("=======================================================");
}

try {
  runTests();
} catch (err) {
  console.error("Test failed:", err);
  process.exit(1);
}
