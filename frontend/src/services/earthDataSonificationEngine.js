/**
 * NASA Earth Information Jukebox — Core Real-Time Earth Data Sonification Engine
 * 2026 NASA Space Apps Challenge
 * 
 * Objective:
 * Convert real Earth science measurements into meaningful, understandable, and configurable audio
 * using the Web Audio API with sample-accurate scheduling, multi-instrument synthesis,
 * dynamic safety compression, and live waveform visualization.
 * 
 * Scientific Mappings:
 * 1. Temperature (°C)   -> Musical Pitch (MIDI 36 / 65.4 Hz to MIDI 84 / 1046.5 Hz)
 * 2. Precipitation (mm)  -> Sound Density, Rhythmic Cascade & Amplitude (Silent on dry 0.0 mm)
 * 3. Wind Speed (m/s)    -> LFO Modulation Rate (0.2 Hz to 8.0 Hz) & Filter Texture Cutoff
 * 4. Vegetation (NDVI)   -> Timbre & Harmonic Richness (Hollow Sine to Lush Sawtooth/Pad)
 * 5. Ocean SST (°C)      -> Deep Foundation Resonance (40 Hz to 130 Hz) & Tidal Chorusing
 */

// ============================================================================
// 1. PURE SCIENTIFIC DATA MAPPING FUNCTIONS (Documented & Testable)
// ============================================================================

export const MAPPING_SPECIFICATIONS = {
  temperature: {
    domain: 'temperature',
    name: 'Atmospheric & Surface Temperature',
    unit: '°C',
    physicalRange: [-30.0, 50.0],
    audiblePitchRangeHz: [65.41, 1046.50], // C2 (MIDI 36) to C6 (MIDI 84)
    midiRange: [36, 84],
    parameterExplanation: 'Acoustic pitch represents atmospheric kinetic energy: sub-zero cold produces deep, warm bass notes, while extreme heat ascends into bright high-register frequencies.'
  },
  precipitation: {
    domain: 'precipitation',
    name: 'Accumulated Liquid & Solid Precipitation',
    unit: 'mm',
    physicalRange: [0.0, 100.0],
    pulseDensityRange: [0.0, 1.0], // 0 = complete silence/rest, 1 = dense thunderstorm cascade
    amplitudeRangeDb: [-36.0, -6.0],
    parameterExplanation: 'Acoustic density, rhythmic pulse rate, and droplet amplitude represent precipitation depth: zero rain produces silence/rest, drizzle yields sparse gentle droplets, and monsoons trigger a dense polyrhythmic cascade.'
  },
  wind_speed: {
    domain: 'wind_speed',
    name: '10-Meter Neutral Wind Speed',
    unit: 'm/s',
    physicalRange: [0.0, 40.0],
    lfoRateRangeHz: [0.2, 8.5],
    filterCutoffRangeHz: [250.0, 4200.0],
    parameterExplanation: 'LFO modulation rate and resonant bandpass filter sweeping represent wind velocity and friction: calm air produces slow gentle breathing, while storm gales trigger rapid tremolo and turbulent friction sweeps.'
  },
  vegetation: {
    domain: 'vegetation',
    name: 'Normalized Difference Vegetation Index (NDVI)',
    unit: 'NDVI',
    physicalRange: [-0.2, 1.0],
    harmonicCountRange: [1, 8],
    timbreBrightnessRange: [0.0, 1.0],
    parameterExplanation: 'Timbral complexity, harmonic overtones, and waveform shape represent photosynthetic greenness: bare rock and water produce hollow pure tones, while dense rainforests produce rich multi-harmonic timbral pads.'
  },
  ocean_sst: {
    domain: 'ocean_sst',
    name: 'Sea Surface Foundation Temperature',
    unit: '°C',
    physicalRange: [0.0, 35.0],
    foundationFreqRangeHz: [43.65, 130.81], // F1 to C3 deep foundation drone
    tidalChorusRateHz: [0.1, 1.2],
    parameterExplanation: 'Sub-bass foundation frequency and tidal chorusing rate represent oceanic thermal storage and convective energy: colder waters evoke deep sub-bass drones, while equatorial warm pools create undulating tropical swells.'
  }
};

/**
 * 1. Temperature to Musical Pitch Mapping
 * Formula: Linear normalization within calibrated physical bounds, mapped to MIDI note range,
 * optionally quantized to a musical scale.
 * 
 * @param {number|null} tempC - Temperature in degrees Celsius
 * @param {string} scale - Scale for quantization ('chromatic', 'pentatonic_major', 'pentatonic_minor', 'dorian', 'lydian', 'continuous')
 * @param {number} octaveShift - Transposition in octaves (-1, 0, +1)
 * @returns {object} { midiNote, frequencyHz, normalized, isValid, isMissing }
 */
export function mapTemperatureToPitch(tempC, scale = 'pentatonic_major', octaveShift = 0) {
  if (tempC === null || tempC === undefined || isNaN(tempC)) {
    return { midiNote: null, frequencyHz: null, normalized: null, isValid: false, isMissing: true };
  }

  const spec = MAPPING_SPECIFICATIONS.temperature;
  const clampedTemp = Math.max(spec.physicalRange[0], Math.min(spec.physicalRange[1], tempC));
  const norm = (clampedTemp - spec.physicalRange[0]) / (spec.physicalRange[1] - spec.physicalRange[0]);

  const baseMidi = spec.midiRange[0] + octaveShift * 12;
  const midiSpan = spec.midiRange[1] - spec.midiRange[0];
  const rawMidi = baseMidi + norm * midiSpan;

  let finalMidi = rawMidi;
  if (scale !== 'continuous') {
    finalMidi = quantizeToScale(rawMidi, scale);
  }

  // Calculate frequency: f = 440 * 2^((midi - 69) / 12)
  const frequencyHz = 440.0 * Math.pow(2.0, (finalMidi - 69.0) / 12.0);

  return {
    midiNote: Math.round(finalMidi),
    frequencyHz: Number(frequencyHz.toFixed(2)),
    normalized: Number(norm.toFixed(4)),
    clampedValue: clampedTemp,
    originalValue: tempC,
    isValid: true,
    isMissing: false
  };
}

/**
 * 2. Precipitation to Sound Density, Rhythm & Amplitude
 * Formula: Logarithmic S-curve mapping that preserves true zero (dry day) as silence/rest.
 * 
 * @param {number|null} precipMm - Precipitation depth in millimeters
 * @returns {object} { pulseDensity, amplitudeDb, dropIntervalMs, gainLinear, isDry, isMissing }
 */
export function mapPrecipitationToAcousticRhythm(precipMm) {
  if (precipMm === null || precipMm === undefined || isNaN(precipMm)) {
    return { pulseDensity: 0.0, amplitudeDb: -100.0, dropIntervalMs: 0, gainLinear: 0.0, isDry: true, isMissing: true };
  }

  if (precipMm <= 0.0) {
    return {
      pulseDensity: 0.0,
      amplitudeDb: -100.0,
      dropIntervalMs: 0,
      gainLinear: 0.0,
      isDry: true,
      isMissing: false,
      description: 'Zero Precipitation (Dry Day) — Silent Dropout'
    };
  }

  const spec = MAPPING_SPECIFICATIONS.precipitation;
  const clampedPrecip = Math.min(spec.physicalRange[1], precipMm);
  // Logarithmic S-curve mapping: log(1 + x) / log(1 + max)
  const norm = Math.log1p(clampedPrecip) / Math.log1p(spec.physicalRange[1]);

  // Rhythm droplet interval: from 1200ms (sparse light drizzle) down to 80ms (thunderstorm deluge)
  const dropIntervalMs = Math.round(1200 - norm * 1120);

  // Amplitude range: -32 dB up to -6 dB
  const amplitudeDb = -32.0 + norm * 26.0;
  const gainLinear = Math.pow(10.0, amplitudeDb / 20.0);

  return {
    pulseDensity: Number(norm.toFixed(4)),
    amplitudeDb: Number(amplitudeDb.toFixed(1)),
    dropIntervalMs,
    gainLinear: Number(gainLinear.toFixed(4)),
    isDry: false,
    isMissing: false,
    originalValue: precipMm,
    description: precipMm < 2.5 ? 'Light Drizzle' : precipMm < 15.0 ? 'Moderate Rain' : 'Convective Storm'
  };
}

/**
 * 3. Wind Speed to Modulation & Texture
 * Formula: Linear & quadratic mapping of wind speed to LFO tremolo frequency and bandpass cutoff.
 * 
 * @param {number|null} windSpeedMs - Neutral 10-meter wind speed in meters/second
 * @returns {object} { lfoRateHz, filterCutoffHz, filterQ, beaufortScale, isMissing }
 */
export function mapWindSpeedToModulation(windSpeedMs) {
  if (windSpeedMs === null || windSpeedMs === undefined || isNaN(windSpeedMs)) {
    return { lfoRateHz: 0.2, filterCutoffHz: 250.0, filterQ: 1.0, beaufortScale: 0, isMissing: true };
  }

  const spec = MAPPING_SPECIFICATIONS.wind_speed;
  const clampedWind = Math.max(spec.physicalRange[0], Math.min(spec.physicalRange[1], windSpeedMs));
  const norm = (clampedWind - spec.physicalRange[0]) / (spec.physicalRange[1] - spec.physicalRange[0]);

  const lfoRateHz = spec.lfoRateRangeHz[0] + norm * (spec.lfoRateRangeHz[1] - spec.lfoRateRangeHz[0]);
  const filterCutoffHz = spec.filterCutoffRangeHz[0] + Math.pow(norm, 1.2) * (spec.filterCutoffRangeHz[1] - spec.filterCutoffRangeHz[0]);
  const filterQ = 1.0 + norm * 4.5; // Narrower resonance on high winds for howling wind effect

  // Beaufort scale classification
  let beaufort = 0;
  if (windSpeedMs >= 32.7) beaufort = 12; // Hurricane
  else if (windSpeedMs >= 24.5) beaufort = 10; // Storm
  else if (windSpeedMs >= 17.2) beaufort = 8; // Gale
  else if (windSpeedMs >= 10.8) beaufort = 6; // Strong breeze
  else if (windSpeedMs >= 5.5) beaufort = 4; // Moderate breeze
  else if (windSpeedMs >= 1.6) beaufort = 2; // Light breeze
  else beaufort = 0; // Calm

  return {
    lfoRateHz: Number(lfoRateHz.toFixed(2)),
    filterCutoffHz: Math.round(filterCutoffHz),
    filterQ: Number(filterQ.toFixed(2)),
    beaufortScale: beaufort,
    normalized: Number(norm.toFixed(4)),
    originalValue: windSpeedMs,
    isMissing: false
  };
}

/**
 * 4. Vegetation (NDVI) to Timbre & Instrument Variation
 * Formula: Normalizes photosynthetic greenness into harmonic overtone count, waveform shape, and detune spread.
 * 
 * @param {number|null} ndvi - Normalized Difference Vegetation Index (-0.2 to +1.0)
 * @returns {object} { waveform, harmonicOvertoneCount, brightness, detuneCents, isMissing }
 */
export function mapVegetationToTimbre(ndvi) {
  if (ndvi === null || ndvi === undefined || isNaN(ndvi)) {
    return { waveform: 'sine', harmonicOvertoneCount: 1, brightness: 0.1, detuneCents: 0, isMissing: true };
  }

  const spec = MAPPING_SPECIFICATIONS.vegetation;
  const clampedNdvi = Math.max(spec.physicalRange[0], Math.min(spec.physicalRange[1], ndvi));
  const norm = (clampedNdvi - spec.physicalRange[0]) / (spec.physicalRange[1] - spec.physicalRange[0]);

  let waveform = 'sine';
  let overtoneCount = 1;

  if (clampedNdvi < 0.1) {
    waveform = 'sine'; // Water or barren desert
    overtoneCount = 1;
  } else if (clampedNdvi < 0.4) {
    waveform = 'triangle'; // Shrubland / sparse grass
    overtoneCount = Math.max(2, Math.round(1 + norm * 5));
  } else if (clampedNdvi < 0.7) {
    waveform = 'sawtooth'; // Agricultural canopy / temperate woods
    overtoneCount = Math.max(4, Math.round(1 + norm * 6));
  } else {
    waveform = 'sawtooth'; // Lush rainforest
    overtoneCount = Math.min(8, Math.max(6, Math.round(1 + norm * 7)));
  }

  const brightness = Number(norm.toFixed(4));
  const detuneCents = Math.round(norm * 18); // Subtle chorus spread on dense canopies

  return {
    waveform,
    harmonicOvertoneCount: overtoneCount,
    brightness,
    detuneCents,
    normalized: Number(norm.toFixed(4)),
    originalValue: ndvi,
    canopyClass: clampedNdvi < 0.1 ? 'Water / Bare Soil' : clampedNdvi < 0.4 ? 'Sparse Vegetation' : clampedNdvi < 0.7 ? 'Moderate Canopy' : 'Dense Rainforest',
    isMissing: false
  };
}

/**
 * 5. Ocean SST to Deep Foundation Resonance & Tidal Chorusing
 * Formula: Maps SST to sub-bass drone fundamental and slow tidal modulation period.
 * 
 * @param {number|null} sstC - Sea surface temperature in degrees Celsius
 * @returns {object} { foundationFreqHz, tidalChorusRateHz, subBassGain, isMissing }
 */
export function mapOceanToFoundationDrone(sstC) {
  if (sstC === null || sstC === undefined || isNaN(sstC)) {
    return { foundationFreqHz: 55.0, tidalChorusRateHz: 0.2, subBassGain: 0.3, isMissing: true };
  }

  const spec = MAPPING_SPECIFICATIONS.ocean_sst;
  const clampedSst = Math.max(spec.physicalRange[0], Math.min(spec.physicalRange[1], sstC));
  const norm = (clampedSst - spec.physicalRange[0]) / (spec.physicalRange[1] - spec.physicalRange[0]);

  const foundationFreqHz = spec.foundationFreqRangeHz[0] + norm * (spec.foundationFreqRangeHz[1] - spec.foundationFreqRangeHz[0]);
  const tidalChorusRateHz = spec.tidalChorusRateHz[0] + norm * (spec.tidalChorusRateHz[1] - spec.tidalChorusRateHz[0]);
  const subBassGain = 0.25 + norm * 0.35;

  return {
    foundationFreqHz: Number(foundationFreqHz.toFixed(2)),
    tidalChorusRateHz: Number(tidalChorusRateHz.toFixed(3)),
    subBassGain: Number(subBassGain.toFixed(3)),
    normalized: Number(norm.toFixed(4)),
    originalValue: sstC,
    isMissing: false
  };
}

// ============================================================================
// 2. SCALE QUANTIZATION HELPER
// ============================================================================

export const MUSICAL_SCALES = {
  chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  pentatonic_major: [0, 2, 4, 7, 9],
  pentatonic_minor: [0, 3, 5, 7, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  natural_minor: [0, 2, 3, 5, 7, 8, 10]
};

export function quantizeToScale(midiNote, scaleName = 'pentatonic_major') {
  const intervals = MUSICAL_SCALES[scaleName] || MUSICAL_SCALES.pentatonic_major;
  const octave = Math.floor(midiNote / 12) * 12;
  const semitone = midiNote % 12;

  // Find nearest interval in scale
  let closest = intervals[0];
  let minDiff = Math.abs(semitone - closest);

  for (let i = 1; i < intervals.length; i++) {
    const diff = Math.abs(semitone - intervals[i]);
    if (diff < minDiff) {
      minDiff = diff;
      closest = intervals[i];
    }
  }

  return octave + closest;
}

// ============================================================================
// 3. SOUND INSTRUMENTS & TIMBRAL PRESETS
// ============================================================================

export const SOUND_INSTRUMENTS = {
  penta_synth: {
    id: 'penta_synth',
    name: 'Planetary Synthesizer',
    description: 'Analog dual-oscillator subtractive synth with resonant 24dB low-pass filter and warm saturation.',
    primaryOsc: 'sawtooth',
    secondaryOsc: 'triangle',
    detuneCents: 7,
    attack: 0.04,
    decay: 0.18,
    sustain: 0.65,
    release: 0.45,
    filterEnvelopeAmount: 1800
  },
  acoustic_marimba: {
    id: 'acoustic_marimba',
    name: 'Acoustic Earth Marimba',
    description: 'Resonant wooden percussive bars with sharp transient attack and warm organic decay.',
    primaryOsc: 'sine',
    secondaryOsc: 'triangle',
    detuneCents: 0,
    attack: 0.005,
    decay: 0.28,
    sustain: 0.05,
    release: 0.35,
    filterEnvelopeAmount: 800
  },
  planetary_drone: {
    id: 'planetary_drone',
    name: 'Cryosphere & Biosphere Drone',
    description: 'Slow-evolving ambient pad with sub-octave reinforcement and lush chorused harmonics.',
    primaryOsc: 'triangle',
    secondaryOsc: 'sine',
    detuneCents: 12,
    attack: 0.35,
    decay: 0.5,
    sustain: 0.85,
    release: 0.9,
    filterEnvelopeAmount: 1200
  },
  atmospheric_pad: {
    id: 'atmospheric_pad',
    name: 'Atmospheric Aerosol Shimmer',
    description: 'Ethereal high-register crystalline wash with gentle stereo panning and subtle bandpass sweeps.',
    primaryOsc: 'sawtooth',
    secondaryOsc: 'sine',
    detuneCents: 15,
    attack: 0.2,
    decay: 0.4,
    sustain: 0.75,
    release: 0.7,
    filterEnvelopeAmount: 2400
  },
  droplet_percussion: {
    id: 'droplet_percussion',
    name: 'Hydrological Droplet Sequencer',
    description: 'High-frequency water droplet synthesis modeled with frequency modulation chirps.',
    primaryOsc: 'sine',
    secondaryOsc: 'sine',
    detuneCents: 0,
    attack: 0.002,
    decay: 0.08,
    sustain: 0.0,
    release: 0.08,
    filterEnvelopeAmount: 500
  },
  scientific_pure_tone: {
    id: 'scientific_pure_tone',
    name: 'Scientific Pure Tone',
    description: 'Laboratory-grade sinusoidal tone with precise frequency calibration and zero harmonic distortion.',
    primaryOsc: 'sine',
    secondaryOsc: 'sine',
    detuneCents: 0,
    attack: 0.01,
    decay: 0.15,
    sustain: 0.7,
    release: 0.25,
    filterEnvelopeAmount: 0
  },
  granular_cloud: {
    id: 'granular_cloud',
    name: 'Granular Cloud',
    description: 'Micro-grain cluster synthesis modeling aerosol scattering and turbulent atmospheric eddies.',
    primaryOsc: 'sawtooth',
    secondaryOsc: 'triangle',
    detuneCents: 22,
    attack: 0.05,
    decay: 0.2,
    sustain: 0.4,
    release: 0.5,
    filterEnvelopeAmount: 1600
  },
  harmonic_organ: {
    id: 'harmonic_organ',
    name: 'Harmonic Organ',
    description: 'Additive multi-octave harmonic partials producing rich, church-organ-style acoustic textures.',
    primaryOsc: 'triangle',
    secondaryOsc: 'sawtooth',
    detuneCents: 5,
    attack: 0.03,
    decay: 0.25,
    sustain: 0.8,
    release: 0.6,
    filterEnvelopeAmount: 2200
  }
};

// ============================================================================
// 4. CONFIGURABLE SONIFICATION PRESETS (Feature 5)
// ============================================================================

export const SONIFICATION_PRESETS = {
  global_climate_pulse: {
    id: 'global_climate_pulse',
    name: 'Global Climate Pulse',
    badge: 'PLANETARY',
    description: 'Broadband multi-octave planetary resonance tracking planetary kinetic warming and decadal thermal shifts.',
    instrument: 'planetary_drone',
    scale: 'pentatonic_major',
    octaveShift: 0,
    tempoMs: 500,
    filterCutoff: 3200,
    spatialMode: 'stereo_wide'
  },
  diurnal_thermal: {
    id: 'diurnal_thermal',
    name: 'Diurnal Thermal Oscillation',
    badge: 'THERMAL',
    description: 'Pure analytic frequencies translating extreme diurnal heating, cooling curves, and infrared radiation.',
    instrument: 'scientific_pure_tone',
    scale: 'continuous',
    octaveShift: 0,
    tempoMs: 400,
    filterCutoff: 4500,
    spatialMode: 'mono_focused'
  },
  monsoonal_deluge: {
    id: 'monsoonal_deluge',
    name: 'Monsoonal Deluge',
    badge: 'HYDROLOGY',
    description: 'Dynamic percussive water droplet cascades with silence on dry days and accelerating polyrhythms on tropical downpours.',
    instrument: 'droplet_percussion',
    scale: 'pentatonic_minor',
    octaveShift: 0,
    tempoMs: 350,
    filterCutoff: 5000,
    spatialMode: 'stereo_chorus'
  },
  polar_albedo_decay: {
    id: 'polar_albedo_decay',
    name: 'Polar Albedo Decay',
    badge: 'CRYOSPHERE',
    description: 'High-register crystalline shimmer and wind flutter capturing polar sea ice extent retreat and glacial velocity.',
    instrument: 'atmospheric_pad',
    scale: 'lydian',
    octaveShift: 1,
    tempoMs: 650,
    filterCutoff: 2600,
    spatialMode: 'stereo_wide'
  },
  scientific_analytic: {
    id: 'scientific_analytic',
    name: 'Scientific Analytic (High Precision)',
    badge: 'ANALYTIC',
    description: 'Pure sine and acoustic marimba tones with sharp transients, strict mathematical scale quantization, focused frequency spectrum, zero reverb, optimized for precise data discernment and statistical analysis.',
    instrument: 'acoustic_marimba',
    scale: 'pentatonic_major',
    octaveShift: 0,
    tempoMs: 500,
    filterCutoff: 3800,
    spatialMode: 'mono_focused'
  },
  ambient_documentary: {
    id: 'ambient_documentary',
    name: 'Ambient Documentary (Storytelling)',
    badge: 'CINEMATIC',
    description: 'Warm planetary drone pads, gentle acoustic marimba, subtle chorus detuning, smooth slow ADSR release for museum exhibits, lectures, and scientific storytelling.',
    instrument: 'planetary_drone',
    scale: 'lydian',
    octaveShift: -1,
    tempoMs: 800,
    filterCutoff: 2200,
    spatialMode: 'stereo_chorus'
  },
  minimal_tactile: {
    id: 'minimal_tactile',
    name: 'Minimal Tactile (Screen-Reader Optimized)',
    badge: 'TACTILE',
    description: 'Short wooden clicks and focused micro-transients, high dynamic contrast, ideal for screen-readers, blind operators, and rapid timeline scrubbing without ear fatigue.',
    instrument: 'droplet_percussion',
    scale: 'chromatic',
    octaveShift: 0,
    tempoMs: 350,
    filterCutoff: 4200,
    spatialMode: 'mono_focused'
  },
  cinematic_resonance: {
    id: 'cinematic_resonance',
    name: 'Cinematic Resonance (Dramatic Range)',
    badge: 'DRAMATIC',
    description: 'Dynamic multi-harmonic sawtooth waves, resonant low-pass sweep, deep sub-bass foundation drone, dramatic velocity accents.',
    instrument: 'penta_synth',
    scale: 'dorian',
    octaveShift: 0,
    tempoMs: 650,
    filterCutoff: 2800,
    spatialMode: 'stereo_wide'
  },
  binaural_spatial: {
    id: 'binaural_spatial',
    name: 'Binaural Spatial (Comparative Separation)',
    badge: 'SPATIAL',
    description: 'Binaural spatialization with slight stereo phase offset separating baseline climatology in the left ear and anomalous deviations in the right ear.',
    instrument: 'atmospheric_pad',
    scale: 'pentatonic_minor',
    octaveShift: 0,
    tempoMs: 600,
    filterCutoff: 3200,
    spatialMode: 'binaural_split'
  }
};

// ============================================================================
// 5. CORE REAL-TIME WEB AUDIO SONIFICATION ENGINE CLASS
// ============================================================================

export class EarthDataSonificationEngine {
  constructor() {
    this.audioCtx = null;
    this.masterGain = null;
    this.limiter = null;
    this.analyser = null;
    this.compressor = null;
    this.softClipNode = null;

    // Active nodes registry for clean voice tracking & garbage collection
    this.activeVoices = new Set();
    
    // Playback Sequencer State
    this.isPlaying = false;
    this.isPaused = false;
    this.sequenceData = [];
    this.currentStep = 0;
    this.playbackTimer = null;
    
    // Configurable Settings
    this.settings = {
      volume: 0.75,
      isMuted: false,
      playbackSpeedMs: 500, // Duration per step in ms (adjustable 150ms to 2000ms)
      instrument: 'penta_synth',
      scale: 'pentatonic_major',
      octaveShift: 0,
      activeDomain: 'temperature',
      enableWindNoise: true,
      enableRainCascade: true,
      enableOceanDrone: true
    };

    // Observers/Listeners
    this.listeners = new Set();
  }

  /**
   * Initialize Web Audio Context and audio graph
   */
  async initAudioContext() {
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      if (this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume();
      }
      return this.audioCtx;
    }

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      throw new Error('Web Audio API is not supported by this browser.');
    }

    this.audioCtx = new AudioContextClass();
    if (this.audioCtx.state === 'suspended') {
      await this.audioCtx.resume();
    }

    // 1. Analyser Node for Live Waveform & Frequency FFT
    this.analyser = this.audioCtx.createAnalyser();
    this.analyser.fftSize = 1024;
    this.analyser.smoothingTimeConstant = 0.85;

    // 2. Master Gain
    this.masterGain = this.audioCtx.createGain();
    this.masterGain.gain.setValueAtTime(this.settings.isMuted ? 0.0 : this.settings.volume, this.audioCtx.currentTime);

    // 3. Dynamics Compressor (Anti-Clipping & Distortion Prevention)
    this.compressor = this.audioCtx.createDynamicsCompressor();
    this.compressor.threshold.setValueAtTime(-14.0, this.audioCtx.currentTime); // dB
    this.compressor.knee.setValueAtTime(25.0, this.audioCtx.currentTime);
    this.compressor.ratio.setValueAtTime(10.0, this.audioCtx.currentTime);
    this.compressor.attack.setValueAtTime(0.003, this.audioCtx.currentTime); // 3ms
    this.compressor.release.setValueAtTime(0.20, this.audioCtx.currentTime); // 200ms

    // 4. Soft-Clipping Waveshaper Curve (Guarantees <= 0 dBFS output)
    this.softClipNode = this.audioCtx.createWaveShaper();
    this.softClipNode.curve = this._generateSoftClipCurve();
    this.softClipNode.oversample = '2x';

    // Connect Audio Pipeline: Sources -> MasterGain -> Compressor -> SoftClip -> Analyser -> Destination
    this.masterGain.connect(this.compressor);
    this.compressor.connect(this.softClipNode);
    this.softClipNode.connect(this.analyser);
    this.analyser.connect(this.audioCtx.destination);

    return this.audioCtx;
  }

  _generateSoftClipCurve(amount = 2.0) {
    const samples = 1024;
    const curve = new Float32Array(samples);
    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      curve[i] = ((Math.PI + amount) * x) / (Math.PI + amount * Math.abs(x));
    }
    return curve;
  }

  /**
   * Load scientific sequence dataset into the engine
   * @param {Array<object>} sequence - Array of processed records from data_processing_engine
   * @param {string} domain - 'temperature', 'precipitation', 'wind_speed', 'vegetation', 'ocean_sst'
   */
  loadSequence(sequence = [], domain = 'temperature') {
    this.sequenceData = Array.isArray(sequence) ? sequence : [];
    this.settings.activeDomain = domain;
    this.currentStep = 0;
    this.notifyState();
  }

  /**
   * Start or resume sonification playback
   */
  async play() {
    await this.initAudioContext();
    if (!this.sequenceData.length) return;

    this.isPlaying = true;
    this.isPaused = false;
    this.notifyState();

    this._startScheduler();
  }

  /**
   * Pause playback retaining current frame position
   */
  pause() {
    this.isPlaying = false;
    this.isPaused = true;
    if (this.playbackTimer) {
      clearInterval(this.playbackTimer);
      this.playbackTimer = null;
    }
    this._stopActiveVoices();
    this.notifyState();
  }

  /**
   * Stop playback and reset to frame 0
   */
  stop() {
    this.isPlaying = false;
    this.isPaused = false;
    this.currentStep = 0;
    if (this.playbackTimer) {
      clearInterval(this.playbackTimer);
      this.playbackTimer = null;
    }
    this._stopActiveVoices();
    this.notifyState();
  }

  /**
   * Replay from the beginning
   */
  async replay() {
    this.stop();
    await this.play();
  }

  /**
   * Seek to a specific step
   */
  seek(stepIndex) {
    if (!this.sequenceData.length) return;
    const target = Math.max(0, Math.min(this.sequenceData.length - 1, stepIndex));
    this.currentStep = target;
    
    // If playing, render immediately
    if (this.isPlaying) {
      this._renderCurrentFrame();
    }
    this.notifyState();
  }

  /**
   * Step backward or forward one frame
   */
  step(delta = 1) {
    if (!this.sequenceData.length) return;
    const next = (this.currentStep + delta + this.sequenceData.length) % this.sequenceData.length;
    this.seek(next);
  }

  /**
   * Scheduler loop stepping through frames at playbackSpeedMs
   */
  _startScheduler() {
    if (this.playbackTimer) clearInterval(this.playbackTimer);

    // Render first frame immediately
    this._renderCurrentFrame();

    this.playbackTimer = setInterval(() => {
      if (!this.isPlaying) return;
      this.currentStep = (this.currentStep + 1) % this.sequenceData.length;
      this._renderCurrentFrame();
      this.notifyState();
    }, this.settings.playbackSpeedMs);
  }

  /**
   * Synthesize real physical sound for the current frame
   */
  _renderCurrentFrame() {
    if (!this.audioCtx || this.audioCtx.state !== 'running') return;
    const frame = this.sequenceData[this.currentStep];
    if (!frame) return;

    const ctx = this.audioCtx;
    const now = ctx.currentTime;
    const duration = Math.max(0.1, (this.settings.playbackSpeedMs / 1000) * 0.9);

    // Extract value & metadata
    const rawValue = frame.original_measurement ?? frame.value;
    const domain = this.settings.activeDomain || 'temperature';
    const instrument = SOUND_INSTRUMENTS[this.settings.instrument] || SOUND_INSTRUMENTS.penta_synth;

    // Check missing values: NEVER synthesize spurious note for missing data
    if (rawValue === null || rawValue === undefined || frame.quality_information?.is_missing) {
      // Missing data: silence / dropout
      return;
    }

    // 1. Calculate Primary Pitch from Temperature or Domain Value
    let pitchHz = 220.0;
    if (domain === 'temperature') {
      const p = mapTemperatureToPitch(rawValue, this.settings.scale, this.settings.octaveShift);
      pitchHz = p.frequencyHz || 220.0;
    } else if (domain === 'ocean_sst') {
      const ocean = mapOceanToFoundationDrone(rawValue);
      pitchHz = ocean.foundationFreqHz || 55.0;
    } else if (domain === 'vegetation') {
      // Map NDVI [-0.2, 1.0] to pitch C3 - C5
      const norm = Math.max(0, Math.min(1, (rawValue + 0.2) / 1.2));
      const midi = quantizeToScale(48 + norm * 24, this.settings.scale);
      pitchHz = 440.0 * Math.pow(2.0, (midi - 69.0) / 12.0);
    } else if (domain === 'wind_speed') {
      // Wind speed pitch modulation
      const norm = Math.max(0, Math.min(1, rawValue / 40.0));
      pitchHz = 110.0 + norm * 220.0;
    } else if (domain === 'precipitation') {
      // Precipitation pitch based on droplet intensity
      const r = mapPrecipitationToAcousticRhythm(rawValue);
      if (r.isDry) return; // Silent on dry day!
      pitchHz = 330.0 + r.pulseDensity * 440.0;
    }

    // 2. Synthesize Musical Voice (Instrument)
    this._playInstrumentVoice(pitchHz, now, duration, instrument, frame);

    // 3. Synthesize Precipitation Droplet Cascade (if active or precipitation domain)
    if (domain === 'precipitation' || (frame.precipitation !== undefined && this.settings.enableRainCascade)) {
      const precipVal = domain === 'precipitation' ? rawValue : frame.precipitation;
      this._playPrecipitationDroplet(precipVal, now, duration);
    }

    // 4. Synthesize Wind Friction & Modulated Noise (if active or wind_speed domain)
    if (domain === 'wind_speed' || (frame.wind_speed !== undefined && this.settings.enableWindNoise)) {
      const windVal = domain === 'wind_speed' ? rawValue : frame.wind_speed;
      this._playWindTexture(windVal, now, duration);
    }
  }

  /**
   * Synthesize Primary Polyphonic Instrument Voice with Anti-Click ADSR Envelope
   */
  _playInstrumentVoice(frequencyHz, startTime, duration, instSpec, frame) {
    const ctx = this.audioCtx;

    // Dual Oscillator Synthesizer
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const voiceGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;

    osc1.type = instSpec.primaryOsc || 'sawtooth';
    osc2.type = instSpec.secondaryOsc || 'triangle';

    osc1.frequency.setValueAtTime(frequencyHz, startTime);
    osc2.frequency.setValueAtTime(frequencyHz, startTime);
    osc2.detune.setValueAtTime(instSpec.detuneCents || 8, startTime);

    // Filter Setup
    filter.type = 'lowpass';
    const baseCutoff = Math.max(300, Math.min(8000, frequencyHz * 3.5));
    filter.frequency.setValueAtTime(baseCutoff, startTime);
    filter.frequency.exponentialRampToValueAtTime(
      Math.max(200, baseCutoff + instSpec.filterEnvelopeAmount),
      startTime + Math.min(0.08, duration * 0.3)
    );
    filter.frequency.exponentialRampToValueAtTime(Math.max(200, baseCutoff * 0.8), startTime + duration);

    // ADSR Envelope (Anti-Click guarantee)
    const attack = Math.min(instSpec.attack, duration * 0.25);
    const decay = Math.min(instSpec.decay, duration * 0.3);
    const sustain = instSpec.sustain;
    const release = Math.min(instSpec.release, duration * 0.4);
    const targetPeakGain = 0.25;

    voiceGain.gain.setValueAtTime(0.0001, startTime);
    voiceGain.gain.exponentialRampToValueAtTime(targetPeakGain, startTime + attack);
    voiceGain.gain.exponentialRampToValueAtTime(Math.max(0.001, targetPeakGain * sustain), startTime + attack + decay);
    voiceGain.gain.setValueAtTime(Math.max(0.001, targetPeakGain * sustain), startTime + duration - release);
    voiceGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    // Spatial Panning based on frame or center
    if (panner) {
      const panVal = frame.geographic_location?.longitude
        ? Math.max(-0.8, Math.min(0.8, frame.geographic_location.longitude / 180.0))
        : 0.0;
      panner.pan.setValueAtTime(panVal, startTime);
    }

    // Connect graph: Osc1 + Osc2 -> Filter -> VoiceGain -> (Panner) -> MasterGain
    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(voiceGain);

    if (panner) {
      voiceGain.connect(panner);
      panner.connect(this.masterGain);
    } else {
      voiceGain.connect(this.masterGain);
    }

    // Start and Stop
    osc1.start(startTime);
    osc2.start(startTime);
    osc1.stop(startTime + duration + 0.05);
    osc2.stop(startTime + duration + 0.05);

    this.activeVoices.add(osc1);
    this.activeVoices.add(osc2);
    this.activeVoices.add(voiceGain);

    setTimeout(() => {
      this.activeVoices.delete(osc1);
      this.activeVoices.delete(osc2);
      this.activeVoices.delete(voiceGain);
    }, (duration + 0.1) * 1000);
  }

  /**
   * Synthesize Precipitation Droplet Pulse (Zero rain = pure silence)
   */
  _playPrecipitationDroplet(precipMm, startTime, duration) {
    const r = mapPrecipitationToAcousticRhythm(precipMm);
    if (r.isDry) return;

    const ctx = this.audioCtx;
    const numDrops = Math.max(1, Math.min(8, Math.round(1 + r.pulseDensity * 7)));
    const interval = Math.min(duration / (numDrops + 1), (r.dropIntervalMs / 1000) * 0.25);

    for (let i = 0; i < numDrops; i++) {
      const dropTime = startTime + i * interval;
      if (dropTime >= startTime + duration) break;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Pitch chirp from 1200Hz to 600Hz simulating droplet impact
      const startFreq = 1100 + Math.random() * 300;
      const endFreq = 400 + Math.random() * 200;
      osc.frequency.setValueAtTime(startFreq, dropTime);
      osc.frequency.exponentialRampToValueAtTime(endFreq, dropTime + 0.04);

      const dropGain = Math.min(0.18, r.gainLinear * 0.8);
      gain.gain.setValueAtTime(0.0001, dropTime);
      gain.gain.exponentialRampToValueAtTime(dropGain, dropTime + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.0001, dropTime + 0.045);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(dropTime);
      osc.stop(dropTime + 0.05);

      this.activeVoices.add(osc);
      this.activeVoices.add(gain);
      setTimeout(() => {
        this.activeVoices.delete(osc);
        this.activeVoices.delete(gain);
      }, (interval * (i + 1) + 0.06) * 1000);
    }
  }

  /**
   * Synthesize Wind Friction & Resonant Atmosphere
   */
  _playWindTexture(windSpeedMs, startTime, duration) {
    if (windSpeedMs === null || windSpeedMs === undefined || windSpeedMs <= 0.5) return;
    const w = mapWindSpeedToModulation(windSpeedMs);
    const ctx = this.audioCtx;

    // Filtered noise synth
    const bufferSize = Math.floor(ctx.sampleRate * Math.min(duration, 0.8));
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(w.filterCutoffHz, startTime);
    bandpass.Q.setValueAtTime(w.filterQ, startTime);

    const gain = ctx.createGain();
    const windGain = Math.min(0.15, 0.02 + w.normalized * 0.12);

    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(windGain, startTime + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    noiseSource.connect(bandpass);
    bandpass.connect(gain);
    gain.connect(this.masterGain);

    noiseSource.start(startTime);
    noiseSource.stop(startTime + duration);

    this.activeVoices.add(noiseSource);
    this.activeVoices.add(gain);
    setTimeout(() => {
      this.activeVoices.delete(noiseSource);
      this.activeVoices.delete(gain);
    }, (duration + 0.05) * 1000);
  }

  _stopActiveVoices() {
    this.activeVoices.forEach((node) => {
      try {
        if (node.stop) node.stop();
        if (node.disconnect) node.disconnect();
      } catch (e) {}
    });
    this.activeVoices.clear();
  }

  /**
   * Set Master Volume (0.0 to 1.0) with logarithmic curve
   */
  setVolume(val) {
    const clamped = Math.max(0.0, Math.min(1.0, val));
    this.settings.volume = clamped;
    if (this.masterGain && this.audioCtx && !this.settings.isMuted) {
      // Logarithmic perceived loudness curve
      const gainVal = Math.pow(clamped, 2);
      this.masterGain.gain.setValueAtTime(gainVal, this.audioCtx.currentTime);
    }
    this.notifyState();
  }

  /**
   * Toggle Mute
   */
  setMute(isMuted) {
    this.settings.isMuted = !!isMuted;
    if (this.masterGain && this.audioCtx) {
      const target = this.settings.isMuted ? 0.0 : Math.pow(this.settings.volume, 2);
      this.masterGain.gain.setValueAtTime(target, this.audioCtx.currentTime);
    }
    this.notifyState();
  }

  /**
   * Set Playback Speed (Duration per step in milliseconds, e.g. 200ms - 2000ms)
   */
  setPlaybackSpeedMs(ms) {
    const clamped = Math.max(100, Math.min(2500, ms));
    this.settings.playbackSpeedMs = clamped;
    if (this.isPlaying) {
      this._startScheduler();
    }
    this.notifyState();
  }

  /**
   * Set Active Musical Instrument Voice
   */
  setInstrument(instId) {
    if (SOUND_INSTRUMENTS[instId]) {
      this.settings.instrument = instId;
      this.notifyState();
    }
  }

  /**
   * Set Sonification Preset (Feature 5)
   */
  setPreset(presetId) {
    const preset = SONIFICATION_PRESETS[presetId];
    if (preset) {
      this.settings.preset = presetId;
      if (preset.instrument && SOUND_INSTRUMENTS[preset.instrument]) {
        this.settings.instrument = preset.instrument;
      }
      if (preset.scale) {
        this.settings.scale = preset.scale;
      }
      if (typeof preset.octaveShift === 'number') {
        this.settings.octaveShift = preset.octaveShift;
      }
      if (typeof preset.tempoMs === 'number') {
        this.settings.playbackSpeedMs = preset.tempoMs;
      }
      this.notifyState();
    }
  }

  /**
   * Set Scale Quantization
   */
  setScale(scaleName) {
    if (MUSICAL_SCALES[scaleName] || scaleName === 'continuous') {
      this.settings.scale = scaleName;
      this.notifyState();
    }
  }

  /**
   * Set Octave Shift (-2 to +2)
   */
  setOctaveShift(shift) {
    this.settings.octaveShift = Math.max(-2, Math.min(2, shift));
    this.notifyState();
  }

  /**
   * Get Time-Domain Waveform Data for Live Oscilloscope Visualization
   */
  getWaveformData(outputArray) {
    if (!this.analyser) {
      if (outputArray) outputArray.fill(128);
      return outputArray;
    }
    this.analyser.getByteTimeDomainData(outputArray);
    return outputArray;
  }

  /**
   * Get Frequency Data for Live Spectrum Visualization
   */
  getFrequencyData(outputArray) {
    if (!this.analyser) {
      if (outputArray) outputArray.fill(0);
      return outputArray;
    }
    this.analyser.getByteFrequencyData(outputArray);
    return outputArray;
  }

  /**
   * Subscribe to engine state updates
   */
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notifyState() {
    const activeFrame = this.sequenceData[this.currentStep] || null;
    const state = {
      isPlaying: this.isPlaying,
      isPaused: this.isPaused,
      currentStep: this.currentStep,
      totalSteps: this.sequenceData.length,
      settings: { ...this.settings },
      activeFrame,
      activeDomain: this.settings.activeDomain
    };

    this.listeners.forEach((fn) => {
      try { fn(state); } catch (e) {}
    });
  }
}

// Global Singleton Instance
export const earthSonificationEngine = new EarthDataSonificationEngine();
export default earthSonificationEngine;
