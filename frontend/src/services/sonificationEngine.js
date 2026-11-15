/**
 * EARTH JUKEBOX — Core Procedural Sonification Engine
 * 2026 NASA Space Apps Challenge
 * 
 * Converts satellite image analysis features (normalized numerical metrics,
 * dominant color clusters, spatial 3x3 grids, and frame differences) into
 * original, dynamically generated acoustic soundscapes.
 * 
 * Powered by the Web Audio API with oscillators, filters, gain nodes,
 * stereo panners, procedural noise generators, and sample-accurate lookahead scheduling.
 */

// ============================================================================
// 1. DETERMINISTIC PSEUDO-RANDOM NUMBER GENERATOR (PRNG)
// ============================================================================

/**
 * 32-bit FNV-1a Hash of Image Features & User Settings
 * Guarantees that the same image and settings produce identical, reproducible sound.
 */
export function hashFeaturesAndSettings(features = {}, settings = {}) {
  const payload = JSON.stringify({
    r: Number((features.red_energy_norm ?? 0.33).toFixed(4)),
    g: Number((features.green_energy_norm ?? 0.33).toFixed(4)),
    b: Number((features.blue_energy_norm ?? 0.33).toFixed(4)),
    lum: Number((features.standard_luminance_norm ?? 0.5).toFixed(4)),
    percep: Number((features.perceptual_luminance_norm ?? 0.5).toFixed(4)),
    dyn: Number((features.dynamic_range_norm ?? 0.5).toFixed(4)),
    edge: Number((features.canny_edge_density_norm ?? 0.2).toFixed(4)),
    warm: Number((features.warmth_index ?? 0.5).toFixed(4)),
    entropy: Number((features.color_entropy_norm ?? 0.5).toFixed(4)),
    shift: Number((features.centroid_shift_norm ?? 0.0).toFixed(4)),
    contrast: Number((features.rms_contrast_norm ?? 0.5).toFixed(4)),
    tempo: Number(settings.tempo ?? 90),
    pitch: Number(settings.pitch ?? 0),
    style: String(settings.style ?? 'ambient_earth'),
    intensity: Number(settings.intensity ?? 70),
  });

  let hash = 0x811c9dc5;
  for (let i = 0; i < payload.length; i++) {
    hash ^= payload.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/**
 * Mulberry32 PRNG instance generator
 */
export function createMulberry32(seed) {
  let s = (seed >>> 0) || 1337;
  return function nextRandom() {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ============================================================================
// 2. MUSICAL SCALES, ROOT FREQUENCIES, AND COLOR MAPPINGS
// ============================================================================

export const MUSICAL_STYLES = {
  ambient_earth: {
    id: 'ambient_earth',
    label: 'Ambient Earth',
    description: 'Serene, organic pentatonic drones and warm resonant harmonics inspired by planetary biosphere cycles.',
    scaleName: 'Major Pentatonic',
    intervals: [0, 2, 4, 7, 9], // Major Pentatonic
    baseOctave: 3,
    tempoRange: [50, 95],
    defaultTempo: 68,
    reverbDecay: 3.5,
    filterQ: 2.2,
    noiseMix: 0.15,
  },
  ocean_waves: {
    id: 'ocean_waves',
    label: 'Ocean Waves',
    description: 'Surging sub-bass undertones and low-frequency tidal noise swells mapping sea surface altimetry.',
    scaleName: 'Dorian Modal',
    intervals: [0, 2, 3, 5, 7, 9, 10], // Dorian
    baseOctave: 2,
    tempoRange: [40, 80],
    defaultTempo: 54,
    reverbDecay: 4.5,
    filterQ: 3.0,
    noiseMix: 0.38,
  },
  atmospheric: {
    id: 'atmospheric',
    label: 'Atmospheric',
    description: 'Ethereal high-register shimmer, resonant bandpass sweeps, and crystalline aerosol harmonics.',
    scaleName: 'Lydian Modal',
    intervals: [0, 2, 4, 6, 7, 9, 11], // Lydian
    baseOctave: 3,
    tempoRange: [60, 110],
    defaultTempo: 76,
    reverbDecay: 5.0,
    filterQ: 5.5,
    noiseMix: 0.22,
  },
  electronic: {
    id: 'electronic',
    label: 'Electronic',
    description: 'Crisp syncopated arpeggios, pulse-width modulation, and algorithmic rhythmic subdivisions.',
    scaleName: 'Phrygian Dominant',
    intervals: [0, 1, 4, 5, 7, 8, 10], // Phrygian Dominant
    baseOctave: 3,
    tempoRange: [80, 150],
    defaultTempo: 112,
    reverbDecay: 2.0,
    filterQ: 7.0,
    noiseMix: 0.08,
  },
  experimental: {
    id: 'experimental',
    label: 'Experimental',
    description: 'Frequency modulation, microtonal drift, and non-western chord structures derived from spectral variance.',
    scaleName: 'Octatonic / Microtonal',
    intervals: [0, 1, 3, 4, 6, 7, 9, 10], // Octatonic (Diminished)
    baseOctave: 2,
    tempoRange: [50, 140],
    defaultTempo: 84,
    reverbDecay: 4.0,
    filterQ: 8.5,
    noiseMix: 0.30,
  },
};

/**
 * Convert MIDI note number to Hz
 */
export function midiToFrequency(midiNote) {
  return 440 * Math.pow(2, (midiNote - 69) / 12);
}

/**
 * Compute root MIDI note from dominant hue and warmth index
 */
export function determineRootMidi(opticalFeatures, styleId, pitchTranspose = 0) {
  const style = MUSICAL_STYLES[styleId] || MUSICAL_STYLES.ambient_earth;
  const hue = opticalFeatures?.color_distribution?.mean_hue ?? 120; // 0-360
  const warmth = opticalFeatures?.color_distribution?.warmth_index ?? 0.5;

  // Base root octave selection
  let baseMidi = style.baseOctave * 12 + 12; // e.g. Octave 2 = 36 (C2), Octave 3 = 48 (C3)

  // Map 360-degree hue into 12 semitones of chromatic spectrum
  const hueSemis = Math.floor((hue / 360) * 12) % 12;
  
  // Warmth adds bias toward lower warm roots or bright high roots
  const warmthOffset = warmth > 0.6 ? -2 : warmth < 0.3 ? +2 : 0;

  const finalRoot = baseMidi + hueSemis + warmthOffset + pitchTranspose;
  return Math.max(24, Math.min(84, finalRoot)); // Clamp to C1 - C6
}

// ============================================================================
// 3. PROCEDURAL REVERB & NOISE GENERATOR HELPERS
// ============================================================================

/**
 * Generate synthetic stereo impulse response for smooth planetary reverb
 */
function createImpulseResponse(audioCtx, duration = 3.0, decay = 2.5) {
  const sampleRate = audioCtx.sampleRate;
  const length = Math.floor(sampleRate * duration);
  const impulse = audioCtx.createBuffer(2, length, sampleRate);
  const left = impulse.getChannelData(0);
  const right = impulse.getChannelData(1);

  for (let i = 0; i < length; i++) {
    const t = i / length;
    const factor = Math.exp(-t * decay);
    left[i] = (Math.random() * 2 - 1) * factor;
    right[i] = (Math.random() * 2 - 1) * factor;
  }
  return impulse;
}

/**
 * Generate 2-second looped pink/brown noise buffer for ocean and atmospheric surf
 */
function createNoiseBuffer(audioCtx) {
  const sampleRate = audioCtx.sampleRate;
  const bufferSize = sampleRate * 2;
  const noiseBuffer = audioCtx.createBuffer(1, bufferSize, sampleRate);
  const output = noiseBuffer.getChannelData(0);

  // Pink noise filter approximation (Paul Kellet's algorithm)
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.1538520;
    b3 = 0.86650 * b3 + white * 0.3104856;
    b4 = 0.55000 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.0168980;
    output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
    b6 = white * 0.115926;
  }
  return noiseBuffer;
}

/**
 * Waveshaper soft-clip transfer curve to prevent digital distortion
 */
function makeSoftClipCurve(amount = 2) {
  const samples = 1024;
  const curve = new Float32Array(samples);
  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1;
    curve[i] = (Math.PI + amount) * x / (Math.PI + amount * Math.abs(x));
  }
  return curve;
}

// ============================================================================
// 4. MAIN SONIFICATION ENGINE CLASS
// ============================================================================

export class SonificationEngine {
  constructor() {
    this.audioCtx = null;
    this.masterGain = null;
    this.limiter = null;
    this.analyser = null;
    this.convolver = null;
    this.convolverGain = null;
    this.noiseSource = null;
    this.noiseFilter = null;
    this.noiseGain = null;

    // Real-Time Dynamic Parameter Modulation Nodes (Phase 7)
    this.dynamicFilter = null;
    this.dynamicPanner = null;
    this.currentDynamicTelemetry = null;

    // Active scheduled voice tracking
    this.activeNodes = new Set();
    this.activeInterval = null;
    
    // Playback state
    this.isPlaying = false;
    this.isPaused = false;
    this.playbackTime = 0;
    this.startTime = 0;
    this.stepIndex = 0;

    // Engine Parameters
    this.settings = {
      volume: 80,         // 0 - 100
      tempo: 72,          // BPM: 40 - 180
      pitch: 0,           // Semitone shift: -12 to +12
      intensity: 75,      // Sound density & filter richness: 0 - 100
      style: 'ambient_earth',
    };

    // Current Analysis Data Reference
    this.analysisData = null;
    this.deterministicPrng = null;

    // Listeners for UI state notifications
    this.subscribers = new Set();
  }

  /**
   * Subscribe to playback status and timer ticks
   */
  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  notify(event, data) {
    this.subscribers.forEach(cb => {
      try {
        cb(event, data);
      } catch (e) {
        console.error('Sonification subscriber error:', e);
      }
    });
  }

  /**
   * Lazy-initialize AudioContext strictly upon explicit user interaction
   */
  initAudio() {
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      return this.audioCtx;
    }

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      throw new Error('Web Audio API is not supported in this browser environment.');
    }

    this.audioCtx = new AudioContextClass({ latencyHint: 'interactive' });

    // 1. Master Gain Node
    this.masterGain = this.audioCtx.createGain();
    this.masterGain.gain.setValueAtTime(0.8, this.audioCtx.currentTime);

    // 2. Soft-Clipper / Limiter Node
    this.limiter = this.audioCtx.createWaveShaper();
    this.limiter.curve = makeSoftClipCurve(3.0);
    this.limiter.oversample = '2x';

    // 3. Real-Time AnalyserNode for Waveform & FFT Visualizer
    this.analyser = this.audioCtx.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.85;

    // 4. Procedural Reverb Convolver
    try {
      this.convolver = this.audioCtx.createConvolver();
      this.convolver.buffer = createImpulseResponse(this.audioCtx, 3.2, 2.8);
      this.convolverGain = this.audioCtx.createGain();
      this.convolverGain.gain.setValueAtTime(0.35, this.audioCtx.currentTime);

      this.masterGain.connect(this.convolver);
      this.convolver.connect(this.convolverGain);
      this.convolverGain.connect(this.limiter);
    } catch (err) {
      console.warn('Convolver reverb initialization note:', err);
    }

    // Dynamic Filter (modulated continuously by frame luminance/brightness)
    this.dynamicFilter = this.audioCtx.createBiquadFilter();
    this.dynamicFilter.type = 'lowpass';
    this.dynamicFilter.frequency.setValueAtTime(4500, this.audioCtx.currentTime);
    this.dynamicFilter.Q.setValueAtTime(1.4, this.audioCtx.currentTime);

    // Dynamic Panner (modulated continuously by spatial centroid X)
    if (this.audioCtx.createStereoPanner) {
      this.dynamicPanner = this.audioCtx.createStereoPanner();
      this.dynamicPanner.pan.setValueAtTime(0, this.audioCtx.currentTime);
    }

    // Connect Audio Graph: masterGain -> dynamicFilter -> [dynamicPanner] -> limiter -> analyser -> destination
    this.masterGain.connect(this.dynamicFilter);
    if (this.dynamicPanner) {
      this.dynamicFilter.connect(this.dynamicPanner);
      this.dynamicPanner.connect(this.limiter);
    } else {
      this.dynamicFilter.connect(this.limiter);
    }
    this.limiter.connect(this.analyser);
    this.analyser.connect(this.audioCtx.destination);

    // 5. Ambient / Surf Noise Subsystem
    try {
      this.noiseBuffer = createNoiseBuffer(this.audioCtx);
      this.noiseFilter = this.audioCtx.createBiquadFilter();
      this.noiseFilter.type = 'lowpass';
      this.noiseFilter.frequency.setValueAtTime(650, this.audioCtx.currentTime);
      this.noiseFilter.Q.setValueAtTime(2.0, this.audioCtx.currentTime);

      this.noiseGain = this.audioCtx.createGain();
      this.noiseGain.gain.setValueAtTime(0.001, this.audioCtx.currentTime);

      this.noiseFilter.connect(this.noiseGain);
      this.noiseGain.connect(this.masterGain);
    } catch (err) {
      console.warn('Noise subsystem note:', err);
    }

    return this.audioCtx;
  }

  /**
   * Set or update image analysis data
   */
  loadAnalysis(analysisResult) {
    this.analysisData = analysisResult;
    this.updateSeed();
  }

  /**
   * Recalculate deterministic PRNG seed from current features & settings
   */
  updateSeed() {
    const norm = this.analysisData?.normalized_features || {};
    const seed = hashFeaturesAndSettings(norm, this.settings);
    this.deterministicPrng = createMulberry32(seed);
  }

  /**
   * Update Engine Settings (Volume, Tempo, Pitch, Intensity, Style)
   */
  updateSettings(newSettings = {}) {
    this.settings = { ...this.settings, ...newSettings };
    this.updateSeed();

    // Live update master volume
    if (this.masterGain && this.audioCtx) {
      const volLinear = (this.settings.volume / 100) * (this.getBrightnessFactor());
      this.masterGain.gain.setTargetAtTime(volLinear, this.audioCtx.currentTime, 0.05);
    }

    this.notify('settings_change', this.settings);
  }

  /**
   * Mapping 1: Brightness controls Volume & Filter Ceiling
   */
  getBrightnessFactor() {
    const lum = this.analysisData?.normalized_features?.standard_luminance_norm ?? 0.55;
    // Dark images sound softer (down to 0.45x); bright images open up to 1.0x
    return 0.45 + (lum * 0.55);
  }

  /**
   * Dynamic Frame Telemetry Update (Phase 7: Sequence Sonification)
   * Smoothly interpolates and glides Web Audio synthesis parameters in real time
   * as the visual Earth animation advances from frame to frame.
   * 
   * Avoids abrupt or unpleasant audio transitions using native AudioParam time-constant ramps.
   */
  updateDynamicFrame(telemetry, timeConstant = 0.08) {
    if (!telemetry) return;
    this.currentDynamicTelemetry = telemetry;

    const normLum = Number(telemetry.normalized_brightness ?? (
      telemetry.standard_luminance_bt601 ? telemetry.standard_luminance_bt601 / 255 : 0.5
    ));
    const centroidX = Number(telemetry.centroid_x_norm ?? (telemetry.centroid_x ?? 0.5));
    const edgeDensity = Number(telemetry.edge_density ?? 0.2);
    const hueDeg = Number(telemetry.hue_mean_deg ?? 180.0);
    const deltaMag = Number(telemetry.delta_from_previous ?? 0.0);

    // 1. AudioParam Continuous Smoothing on Web Audio Graph
    if (this.audioCtx && this.audioCtx.state === 'running') {
      const now = this.audioCtx.currentTime;

      // Filter Cutoff: Brightness opens acoustic spectrum (400 Hz -> 8500 Hz)
      if (this.dynamicFilter && this.dynamicFilter.frequency) {
        const targetCutoff = 400 + Math.pow(normLum, 1.35) * 8100;
        this.dynamicFilter.frequency.setTargetAtTime(
          Math.max(250, Math.min(14000, targetCutoff)),
          now,
          timeConstant
        );
      }

      // Spatial Stereo Pan: Centroid X glides listener perception (Left -> Right)
      if (this.dynamicPanner && this.dynamicPanner.pan) {
        const targetPan = Math.max(-0.88, Math.min(0.88, (centroidX - 0.5) * 1.76));
        this.dynamicPanner.pan.setTargetAtTime(targetPan, now, timeConstant);
      }

      // Master Gain: Brightness scaling
      if (this.masterGain && this.masterGain.gain) {
        const brightnessFactor = 0.45 + (normLum * 0.55);
        const targetGain = (this.settings.volume / 100) * brightnessFactor;
        this.masterGain.gain.setTargetAtTime(targetGain, now, timeConstant);
      }

      // Noise Subsystem: Scales with dynamic intensity & style
      if (this.noiseGain && this.noiseGain.gain && this.noiseFilter) {
        const style = MUSICAL_STYLES[this.settings.style] || MUSICAL_STYLES.ambient_earth;
        const noiseTarget = style.noiseMix * (0.35 + (this.settings.intensity / 100) * 0.65) * (0.5 + normLum * 0.5);
        this.noiseGain.gain.setTargetAtTime(noiseTarget, now, timeConstant * 1.5);
      }
    }

    // 2. Synchronize Analysis Reference for Lookahead Voice Generation
    if (!this.analysisData) this.analysisData = {};
    if (!this.analysisData.normalized_features) this.analysisData.normalized_features = {};
    if (!this.analysisData.optical_features) this.analysisData.optical_features = {};

    this.analysisData.normalized_features.standard_luminance_norm = normLum;
    this.analysisData.normalized_features.canny_edge_density_norm = edgeDensity;
    this.analysisData.normalized_features.color_entropy_norm = Number(telemetry.color_entropy ?? 0.5);
    this.analysisData.normalized_features.warmth_index = Number(telemetry.warmth_index ?? 0.5);
    this.analysisData.normalized_features.centroid_shift_norm = centroidX;
    this.analysisData.normalized_features.rms_contrast_norm = Number(telemetry.contrast_rms ?? 0.5);

    this.analysisData.optical_features.color_distribution = {
      mean_hue_deg: hueDeg,
      warmth_index: Number(telemetry.warmth_index ?? 0.5),
    };

    if (telemetry.dominant_colors && telemetry.dominant_colors.length > 0) {
      this.analysisData.optical_features.dominant_colors = telemetry.dominant_colors;
    }

    if (telemetry.quadrants) {
      this.analysisData.optical_features.spatial_distribution = {
        quadrant_energy: {
          q1_nw: Number(telemetry.quadrants.top_left ?? 0.25),
          q2_ne: Number(telemetry.quadrants.top_right ?? 0.25),
          q3_sw: Number(telemetry.quadrants.bottom_left ?? 0.25),
          q4_se: Number(telemetry.quadrants.bottom_right ?? 0.25),
        },
        centroid_x_norm: centroidX,
      };
    }

    this.analysisData.frame_difference = {
      has_comparison: true,
      normalized_change_magnitude: deltaMag,
    };

    // Emit live telemetry event to UI subscribers
    this.notify('dynamic_frame', telemetry);
  }

  /**
   * Play / Resume Sonification
   */
  async play() {
    this.initAudio();

    if (this.audioCtx.state === 'suspended') {
      await this.audioCtx.resume();
    }

    if (this.isPlaying) return;

    this.isPlaying = true;
    this.isPaused = false;
    this.startTime = this.audioCtx.currentTime - this.playbackTime;

    // Start Ocean / Atmospheric Noise loop
    this.startNoiseLayer();

    // Start lookahead audio scheduler
    this.startScheduler();

    this.notify('play', { isPlaying: true });
  }

  /**
   * Pause Sonification
   */
  pause() {
    if (!this.isPlaying) return;

    this.isPlaying = false;
    this.isPaused = true;
    
    if (this.audioCtx) {
      this.playbackTime = this.audioCtx.currentTime - this.startTime;
      // Gently ramp down active voices to prevent speaker pop
      this.fadeActiveNodes(0.08);
    }

    if (this.activeInterval) {
      clearInterval(this.activeInterval);
      this.activeInterval = null;
    }

    this.stopNoiseLayer();
    this.notify('pause', { isPlaying: false, playbackTime: this.playbackTime });
  }

  /**
   * Stop Sonification and reset playhead
   */
  stop() {
    this.isPlaying = false;
    this.isPaused = false;
    this.playbackTime = 0;
    this.stepIndex = 0;

    if (this.activeInterval) {
      clearInterval(this.activeInterval);
      this.activeInterval = null;
    }

    if (this.audioCtx) {
      this.fadeActiveNodes(0.05);
    }

    this.stopNoiseLayer();
    this.notify('stop', { isPlaying: false, playbackTime: 0 });
  }

  fadeActiveNodes(fadeTime = 0.05) {
    const now = this.audioCtx ? this.audioCtx.currentTime : 0;
    this.activeNodes.forEach(node => {
      try {
        if (node.gain) {
          node.gain.cancelScheduledValues(now);
          node.gain.setTargetAtTime(0, now, fadeTime);
        }
        if (node.stop) {
          node.stop(now + fadeTime + 0.02);
        }
      } catch (e) {
        // Voice might already be ended
      }
    });
    this.activeNodes.clear();
  }

  /**
   * Procedural Atmospheric / Ocean Noise Background
   */
  startNoiseLayer() {
    if (!this.audioCtx || !this.noiseBuffer) return;

    try {
      this.stopNoiseLayer();
      this.noiseSource = this.audioCtx.createBufferSource();
      this.noiseSource.buffer = this.noiseBuffer;
      this.noiseSource.loop = true;

      const style = MUSICAL_STYLES[this.settings.style] || MUSICAL_STYLES.ambient_earth;
      const intensityNorm = this.settings.intensity / 100;
      const targetGain = style.noiseMix * (0.4 + intensityNorm * 0.6) * this.getBrightnessFactor();

      this.noiseSource.connect(this.noiseFilter);
      this.noiseSource.start();

      const now = this.audioCtx.currentTime;
      this.noiseGain.gain.cancelScheduledValues(now);
      this.noiseGain.gain.setValueAtTime(0.001, now);
      this.noiseGain.gain.exponentialRampToValueAtTime(Math.max(0.001, targetGain), now + 1.2);
    } catch (err) {
      console.warn('Noise layer start note:', err);
    }
  }

  stopNoiseLayer() {
    if (this.noiseSource) {
      try {
        const now = this.audioCtx ? this.audioCtx.currentTime : 0;
        if (this.noiseGain && this.audioCtx) {
          this.noiseGain.gain.setTargetAtTime(0.0001, now, 0.1);
        }
        this.noiseSource.stop(now + 0.15);
      } catch (e) {
        // Ignore
      }
      this.noiseSource = null;
    }
  }

  // ============================================================================
  // 5. AUDIO SCHEDULING (LOOKAHEAD CLOCK)
  // ============================================================================

  startScheduler() {
    if (this.activeInterval) clearInterval(this.activeInterval);

    // Schedule 16th-note steps with a 25ms interval lookahead window
    let nextStepTime = this.audioCtx.currentTime + 0.05;
    const lookaheadMs = 25;
    const scheduleAheadSec = 0.12;

    this.activeInterval = setInterval(() => {
      if (!this.isPlaying || !this.audioCtx) return;

      const tempo = Math.max(40, Math.min(180, this.settings.tempo));
      // 16th note duration = (60 / BPM) / 4
      const stepDuration = (60 / tempo) / 4;

      // Update UI playback timer
      this.playbackTime = this.audioCtx.currentTime - this.startTime;
      this.notify('tick', {
        time: this.playbackTime,
        step: this.stepIndex % 16,
      });

      // Schedule all musical events occurring within the lookahead window
      while (nextStepTime < this.audioCtx.currentTime + scheduleAheadSec) {
        this.scheduleStep(this.stepIndex, nextStepTime, stepDuration);
        this.stepIndex++;
        nextStepTime += stepDuration;
      }
    }, lookaheadMs);
  }

  /**
   * Schedule one step of the composite sonification
   */
  scheduleStep(stepIndex, time, stepDuration) {
    const style = MUSICAL_STYLES[this.settings.style] || MUSICAL_STYLES.ambient_earth;
    const norm = this.analysisData?.normalized_features || {};
    const optical = this.analysisData?.optical_features || {};
    const regional = this.analysisData?.regional_statistics || [];
    const frameDiff = this.analysisData?.frame_difference || {};

    const rootMidi = determineRootMidi(optical, this.settings.style, this.settings.pitch);
    const intervals = style.intervals;
    const intensity = this.settings.intensity / 100;
    const prng = this.deterministicPrng || Math.random;

    // ------------------------------------------------------------------------
    // MAPPING 4: SPATIAL PATTERNS CONTROL SOUND LAYERS (Quadrants & 3x3 Grid)
    // ------------------------------------------------------------------------
    const quad = optical?.spatial_distribution?.quadrant_energy || { q1_nw: 0.25, q2_ne: 0.25, q3_sw: 0.25, q4_se: 0.25 };
    const centroidX = norm.centroid_shift_norm ?? 0.0;
    const stereoPan = Math.max(-0.95, Math.min(0.95, (optical?.spatial_distribution?.centroid_x_norm ?? 0.5 - 0.5) * 1.8));

    // ------------------------------------------------------------------------
    // MAPPING 5: IMAGE VARIATION INFLUENCES MUSICAL CHANGES (Frame Differences)
    // ------------------------------------------------------------------------
    const motionFactor = frameDiff?.has_comparison ? (frameDiff.normalized_change_magnitude ?? 0.05) : 0.02;
    const textureVariance = norm.rms_contrast_norm ?? 0.5;

    // ========================================================================
    // LAYER 1: SUB-BASS / DRONE (Every 16 steps / whole bar)
    // ========================================================================
    if (stepIndex % 16 === 0) {
      const droneNote = rootMidi - 12; // 1 Octave below root
      const droneFreq = midiToFrequency(droneNote);
      const droneVol = 0.28 * this.getBrightnessFactor() * (0.6 + quad.q4_se * 0.8) * intensity;
      const droneDuration = stepDuration * 16;
      this.playSubBassDrone(droneFreq, time, droneDuration, droneVol);
    }

    // ========================================================================
    // LAYER 2: HARMONIC PAD / CHORD VOICING (Every 8 steps / half bar)
    // Influenced by Dominant Colors (K-Means)
    // ========================================================================
    if (stepIndex % 8 === 0) {
      const dominantColors = optical?.dominant_colors || [];
      const chordNotes = this.selectChordNotes(rootMidi, intervals, dominantColors);
      const padVol = 0.16 * this.getBrightnessFactor() * (0.5 + quad.q3_sw * 0.8) * intensity;
      const padDuration = stepDuration * 9;
      this.playHarmonicPad(chordNotes, time, padDuration, padVol, stereoPan);
    }

    // ========================================================================
    // LAYER 3: MELODIC ARPEGGIATOR / LEAD
    // MAPPING 3: Pixel density controls rhythmic complexity & note density
    // ========================================================================
    const edgeDensity = norm.canny_edge_density_norm ?? 0.2;
    const entropy = norm.color_entropy_norm ?? 0.5;

    // Density threshold dictates whether this step fires a melodic pulse
    const shouldPlayMelody = this.shouldStepTriggerArp(stepIndex, edgeDensity, entropy);
    if (shouldPlayMelody) {
      // Pick note from scale intervals deterministically
      const intervalIdx = Math.floor(prng() * intervals.length);
      const octaveShift = (prng() > 0.65 ? 12 : 0) + (prng() > 0.9 ? 24 : 0);
      const arpNote = rootMidi + intervals[intervalIdx] + octaveShift;
      const arpFreq = midiToFrequency(arpNote);

      const arpVol = (0.12 + prng() * 0.08) * this.getBrightnessFactor() * (0.5 + quad.q2_ne * 0.8) * intensity;
      const arpDuration = stepDuration * (prng() > 0.5 ? 1.5 : 0.8);
      
      // Slight microtonal or dynamic drift from frame motion
      const pitchBend = (motionFactor * 15 * (prng() - 0.5));
      this.playMelodicLead(arpFreq + pitchBend, time, arpDuration, arpVol, stereoPan);
    }

    // ========================================================================
    // LAYER 4: 3×3 REGIONAL SPATIAL ACCENT PULSES (Sequential orbital scan)
    // ========================================================================
    if (regional && regional.length === 9) {
      const zoneIdx = (stepIndex % 9);
      const zone = regional[zoneIdx];
      if (zone && (stepIndex % 4 === 0)) {
        this.playRegionalSpatialPulse(zone, time, stepDuration * 2, intensity);
      }
    }
  }

  /**
   * Determine melodic trigger rate based on Canny edge density & entropy
   */
  shouldStepTriggerArp(stepIndex, edgeDensity, entropy) {
    const isEighth = (stepIndex % 2 === 0);
    const isQuarter = (stepIndex % 4 === 0);

    if (edgeDensity < 0.15) {
      // Low pixel density (smooth waters, uniform ice): minimal, meditative quarter notes
      return isQuarter && (stepIndex % 8 !== 4);
    } else if (edgeDensity < 0.40) {
      // Moderate pixel density: steady 8th-note pulse
      return isEighth;
    } else {
      // High pixel density / fractured complex edges: dense syncopated subdivisions
      const syncopatedPattern = [0, 2, 3, 5, 6, 8, 10, 11, 13, 14];
      return syncopatedPattern.includes(stepIndex % 16);
    }
  }

  /**
   * MAPPING 2: Dominant color information influences pitch & chord intervals
   */
  selectChordNotes(rootMidi, scaleIntervals, dominantColors) {
    if (!dominantColors || dominantColors.length === 0) {
      // Default triad in scale
      return [
        rootMidi,
        rootMidi + (scaleIntervals[2] ?? 4),
        rootMidi + (scaleIntervals[4] ?? 7),
      ];
    }

    // Map each of the 5 dominant K-Means clusters to scale degrees
    const notes = [];
    dominantColors.slice(0, 4).forEach((cluster, idx) => {
      // Map cluster pixel percentage & hex brightness to interval
      const hex = cluster.hex_code || '#888888';
      const r = parseInt(hex.slice(1, 3), 16) || 128;
      const g = parseInt(hex.slice(3, 5), 16) || 128;
      const b = parseInt(hex.slice(5, 7), 16) || 128;

      const chromaticIndex = Math.floor(((r * 0.3 + g * 0.59 + b * 0.11) / 255) * scaleIntervals.length);
      const interval = scaleIntervals[chromaticIndex % scaleIntervals.length] || 0;
      const octave = idx === 0 ? 0 : idx === 3 ? 12 : 0;
      notes.push(rootMidi + interval + octave);
    });

    return [...new Set(notes)]; // Deduplicate
  }

  // ============================================================================
  // 6. SYNTHESIZER VOICE IMPLEMENTATIONS
  // ============================================================================

  /**
   * Voice 1: Sub-Bass / Drone Voice
   */
  playSubBassDrone(frequency, startTime, duration, volume) {
    if (!this.audioCtx) return;

    try {
      const osc1 = this.audioCtx.createOscillator();
      const osc2 = this.audioCtx.createOscillator();
      const filter = this.audioCtx.createBiquadFilter();
      const gain = this.audioCtx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(frequency, startTime);

      // Subtle detune for rich analog chorusing
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(frequency * 1.002, startTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(Math.min(320, frequency * 3), startTime);
      filter.Q.setValueAtTime(2.0, startTime);

      // Soft envelope
      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(volume, startTime + 0.4);
      gain.gain.setValueAtTime(volume, startTime + duration - 0.4);
      gain.gain.linearRampToValueAtTime(0.0001, startTime + duration);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc1.start(startTime);
      osc2.start(startTime);
      osc1.stop(startTime + duration + 0.05);
      osc2.stop(startTime + duration + 0.05);

      this.activeNodes.add(gain);
      this.activeNodes.add(osc1);
      this.activeNodes.add(osc2);
      setTimeout(() => {
        this.activeNodes.delete(gain);
        this.activeNodes.delete(osc1);
        this.activeNodes.delete(osc2);
      }, (startTime - this.audioCtx.currentTime + duration + 0.1) * 1000);
    } catch (e) {
      console.warn('Sub-bass drone error:', e);
    }
  }

  /**
   * Voice 2: Harmonic Pad / Polyphonic Voicing
   */
  playHarmonicPad(chordNotes, startTime, duration, volume, pan = 0) {
    if (!this.audioCtx) return;

    chordNotes.forEach((midi, idx) => {
      try {
        const freq = midiToFrequency(midi);
        const osc = this.audioCtx.createOscillator();
        const filter = this.audioCtx.createBiquadFilter();
        const gain = this.audioCtx.createGain();
        let panner = null;

        if (this.audioCtx.createStereoPanner) {
          panner = this.audioCtx.createStereoPanner();
          const spread = (idx - (chordNotes.length / 2)) * 0.25 + pan;
          panner.pan.setValueAtTime(Math.max(-0.9, Math.min(0.9, spread)), startTime);
        }

        osc.type = this.settings.style === 'electronic' ? 'sawtooth' : 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);

        // Filter cutoff ceiling scales with brightness & style
        const baseCutoff = this.settings.style === 'atmospheric' ? 3200 : 1600;
        const filterCutoff = baseCutoff * this.getBrightnessFactor();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(filterCutoff * 0.6, startTime);
        filter.frequency.exponentialRampToValueAtTime(filterCutoff, startTime + duration * 0.4);
        filter.Q.setValueAtTime(1.8, startTime);

        const voiceVol = volume / Math.max(1, chordNotes.length);
        gain.gain.setValueAtTime(0.0001, startTime);
        gain.gain.linearRampToValueAtTime(voiceVol, startTime + 0.6);
        gain.gain.setValueAtTime(voiceVol, startTime + duration - 0.7);
        gain.gain.linearRampToValueAtTime(0.0001, startTime + duration);

        osc.connect(filter);
        filter.connect(gain);

        if (panner) {
          gain.connect(panner);
          panner.connect(this.masterGain);
        } else {
          gain.connect(this.masterGain);
        }

        osc.start(startTime);
        osc.stop(startTime + duration + 0.05);

        this.activeNodes.add(gain);
        this.activeNodes.add(osc);
        setTimeout(() => {
          this.activeNodes.delete(gain);
          this.activeNodes.delete(osc);
        }, (startTime - this.audioCtx.currentTime + duration + 0.1) * 1000);
      } catch (e) {
        // Ignore
      }
    });
  }

  /**
   * Voice 3: Melodic Lead / Plucked Arpeggiator
   */
  playMelodicLead(frequency, startTime, duration, volume, pan = 0) {
    if (!this.audioCtx) return;

    try {
      const osc = this.audioCtx.createOscillator();
      const filter = this.audioCtx.createBiquadFilter();
      const gain = this.audioCtx.createGain();
      let panner = null;

      if (this.audioCtx.createStereoPanner) {
        panner = this.audioCtx.createStereoPanner();
        panner.pan.setValueAtTime(pan, startTime);
      }

      const style = this.settings.style;
      osc.type = style === 'electronic' ? 'sawtooth' : style === 'ocean_waves' ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(frequency, startTime);

      // Resonant dynamic lowpass sweep
      const startCutoff = Math.min(8000, frequency * 4.5);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(startCutoff, startTime);
      filter.frequency.exponentialRampToValueAtTime(Math.max(200, frequency * 1.2), startTime + duration);
      filter.Q.setValueAtTime(MUSICAL_STYLES[style]?.filterQ || 3.0, startTime);

      // Percussive plucked ADSR envelope
      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(volume, startTime + 0.015); // Fast attack
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(filter);
      filter.connect(gain);

      if (panner) {
        gain.connect(panner);
        panner.connect(this.masterGain);
      } else {
        gain.connect(this.masterGain);
      }

      osc.start(startTime);
      osc.stop(startTime + duration + 0.02);

      this.activeNodes.add(gain);
      this.activeNodes.add(osc);
      setTimeout(() => {
        this.activeNodes.delete(gain);
        this.activeNodes.delete(osc);
      }, (startTime - this.audioCtx.currentTime + duration + 0.1) * 1000);
    } catch (e) {
      console.warn('Melodic lead error:', e);
    }
  }

  /**
   * Voice 4: 3×3 Regional Spatial Pulse (Orbiting around the listener)
   */
  playRegionalSpatialPulse(zone, startTime, duration, intensity) {
    if (!this.audioCtx) return;

    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      let panner = null;

      if (this.audioCtx.createStereoPanner) {
        panner = this.audioCtx.createStereoPanner();
        // Map 3x3 sector coordinates: col 0 = -0.75, col 1 = 0.0, col 2 = +0.75
        const panMap = {
          'NW': -0.75, 'N': -0.15, 'NE': 0.75,
          'W': -0.85, 'Center': 0.0, 'E': 0.85,
          'SW': -0.70, 'S': 0.15, 'SE': 0.70
        };
        const panVal = panMap[zone.zone_id] ?? 0.0;
        panner.pan.setValueAtTime(panVal, startTime);
      }

      // Zone brightness & contrast determine pitch harmonic
      const baseFreq = 220;
      const harmonicMul = 1 + ((zone.brightness ?? 50) / 100) * 3; // 1.0x to 4.0x
      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq * harmonicMul, startTime);

      const pulseVol = 0.04 * (zone.contrast_rms ? zone.contrast_rms / 60 : 0.5) * intensity;
      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.linearRampToValueAtTime(pulseVol, startTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(gain);
      if (panner) {
        gain.connect(panner);
        panner.connect(this.masterGain);
      } else {
        gain.connect(this.masterGain);
      }

      osc.start(startTime);
      osc.stop(startTime + duration + 0.02);

      this.activeNodes.add(gain);
      this.activeNodes.add(osc);
      setTimeout(() => {
        this.activeNodes.delete(gain);
        this.activeNodes.delete(osc);
      }, (startTime - this.audioCtx.currentTime + duration + 0.05) * 1000);
    } catch (e) {
      // Ignore
    }
  }

  /**
   * Get Real-Time Time-Domain (Oscilloscope) Data for Waveform Visualizer
   */
  getTimeDomainData(dataArray) {
    if (!this.analyser) {
      dataArray.fill(128);
      return dataArray;
    }
    this.analyser.getByteTimeDomainData(dataArray);
    return dataArray;
  }

  /**
   * Get Real-Time Frequency (FFT Spectrum) Data for Visualizer
   */
  getFrequencyData(dataArray) {
    if (!this.analyser) {
      dataArray.fill(0);
      return dataArray;
    }
    this.analyser.getByteFrequencyData(dataArray);
    return dataArray;
  }
}

// Global Singleton Instance for EARTH JUKEBOX App
export const globalSonificationEngine = new SonificationEngine();
export default globalSonificationEngine;
