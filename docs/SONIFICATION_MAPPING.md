# Earth Data Sonification Mapping & Acoustic Architecture

The **Earth Information Jukebox** sonification engine translates numerical Earth science measurements into psychoacoustically calibrated, mathematically consistent audio. Rather than utilizing synthetic background music or random frequencies, every sound heard is a direct acoustic representation of verified Earth observation data.

---

## 1. Domain-Specific Acoustic Mappings

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                            SCIENTIFIC MEASUREMENT                             │
│  Temperature (°C)   Precipitation (mm)  Wind (m/s)  NDVI (Ratio)  SST (°C)   │
└────────┬───────────────────┬────────────────┬────────────┬───────────┬───────┘
         │                   │                │            │           │
         ▼                   ▼                ▼            ▼           ▼
┌──────────────────┐┌─────────────────┐┌────────────┐┌───────────┐┌───────────┐
│  Carrier Pitch   ││  Pulse Density  ││  Bandpass  ││ Overtones ││ Resonant  │
│  & MIDI Note     ││  & Droplet Gain ││ Modulation ││ & Timbre  ││ Sub-Bass  │
│  (65 - 1046 Hz)  ││ (0.01 - 25 Hz)  ││ (200-4kHz) ││ (1 - 6)   ││ (35-180Hz)│
└────────┬─────────┘└────────┬────────┘└─────┬──────┘└─────┬─────┘└─────┬─────┘
         │                   │               │             │            │
         └───────────────────┴───────┬───────┴─────────────┴────────────┘
                                     ▼
                      ┌─────────────────────────────┐
                      │    SONIFICATION PRESET      │
                      │  (Analytic / Documentary /  │
                      │   Minimal / Cinematic /     │
                      │   Binaural Spatial)         │
                      └──────────────┬──────────────┘
                                     ▼
                      ┌─────────────────────────────┐
                      │     DSP SAFETY CHAIN        │
                      │  Master Gain -> Compressor  │
                      │  -> Waveshaper Soft-Clipper │
                      └──────────────┬──────────────┘
                                     ▼
                                [ Destination ]
```

### 1.1 Temperature Mapping: Musical Pitch & Fundamental Frequency
- **Scientific Parameter**: Air Temperature at 2m ($T_{2m}$, $^\circ\text{C}$).
- **Physical Bounds**: $-50.0^\circ\text{C}$ (Polar winter) to $+50.0^\circ\text{C}$ (Extreme desert).
- **Acoustic Dimension**: Carrier Oscillator Pitch ($f_0$ in Hz) and MIDI Note Number.
- **Pitch Range**: $\text{C}_2$ ($65.41\text{ Hz}$) to $\text{C}_6$ ($1046.50\text{ Hz}$) across a 4-octave span.
- **Normalization Formula**:
  $$\text{Norm}(T) = \frac{\text{clamp}(T, -50, 50) - (-50)}{50 - (-50)} = \frac{T + 50}{100} \in [0.0, 1.0]$$
- **Frequency Mapping**:
  $$f_0(T) = f_{\min} \cdot \left(\frac{f_{\max}}{f_{\min}}\right)^{\text{Norm}(T)} = 65.41 \cdot 16^{\text{Norm}(T)}$$
- **Acoustic Behavior**: Freezing temperatures ($<0^\circ\text{C}$) yield deep bass tones; temperate conditions ($15\text{--}25^\circ\text{C}$) land in warm mid-register melodic intervals; extreme heat ($>40^\circ\text{C}$) resonates as high-register alerts.

---

### 1.2 Precipitation Mapping: Pulse Density, Rhythm & Droplet Gain
- **Scientific Parameter**: Total Precipitation Rate / Accumulation ($P$, mm/day).
- **Physical Bounds**: $0.0\text{ mm}$ (Arid) to $250.0\text{ mm}$ (Tropical monsoon).
- **Acoustic Dimension**: Granular droplet pulse rate ($\text{pulses/sec}$), burst density, and droplet amplitude.
- **Logarithmic Normalization**:
  $$\text{Norm}(P) = \frac{\ln(1 + \text{clamp}(P, 0, 250))}{\ln(1 + 250)}$$
- **Pulse Density**:
  $$\text{Rate}(P) = 0.5 + 24.5 \cdot \text{Norm}(P) \quad [\text{Hz / pulses per second}]$$
- **Amplitude Scaling**:
  $$\text{Gain}_{\text{lin}}(P) = 10^{\frac{-40 + 40 \cdot \text{Norm}(P)}{20}}$$
- **Zero & Gap Integrity**:
  - A confirmed dry day ($0.0\text{ mm}$) produces a clean acoustic silence with a distinct subtle visual checkmark.
  - A missing observation (`NaN`) produces complete silence accompanied by an audible earcon flag indicating data absence.

---

### 1.3 Wind Speed Mapping: White/Pink Noise Modulation & Filtering
- **Scientific Parameter**: Wind Speed at 10m ($W$, m/s).
- **Physical Bounds**: $0.0\text{ m/s}$ (Calm) to $45.0\text{ m/s}$ (Tropical storm / Hurricane force).
- **Acoustic Dimension**: Filtered white noise gust density, bandpass center frequency sweep, and low-frequency oscillation (LFO) flutter.
- **Filter Cutoff Sweep**:
  $$f_{\text{cutoff}}(W) = 200 + 3800 \cdot \left(\frac{\text{clamp}(W, 0, 45)}{45}\right)^{1.5} \quad [\text{Hz}]$$
- **Resonance ($Q$)**: Dynamic $Q$ increases from $0.5$ (gentle breeze) to $6.0$ (focused howling gale).

---

### 1.4 Vegetation (NDVI) Mapping: Harmonic Complexity & Timbre
- **Scientific Parameter**: Normalized Difference Vegetation Index ($\text{NDVI}$, unitless ratio $[-0.2, 1.0]$).
- **Acoustic Dimension**: Harmonic overtone count, timbre brightness, and oscillator waveform blend.
- **Waveform Morphing**:
  - $\text{NDVI} < 0.1$ (Water, bare rock, barren desert): Pure pure sine wave with zero harmonics.
  - $0.1 \le \text{NDVI} < 0.4$ (Shrubland, grassland, sparse canopy): Warm triangle wave with low-order 3rd harmonic.
  - $0.4 \le \text{NDVI} < 0.7$ (Temperate forest, cultivated cropland): Dual oscillator blend with rich 5th and 7th harmonics.
  - $\text{NDVI} \ge 0.7$ (Dense tropical rainforest canopy): Lush overtone spectrum with resonant comb filtering.

---

### 1.5 Ocean Sea Surface Temperature (SST) Mapping: Sub-Bass & Filter Resonance
- **Scientific Parameter**: Foundation SST ($^\circ\text{C}$).
- **Physical Bounds**: $-2.0^\circ\text{C}$ (Polar freezing seawater) to $+35.0^\circ\text{C}$ (Equatorial Warm Pool).
- **Acoustic Dimension**: Deep sub-bass resonance ($35\text{--}180\text{ Hz}$), liquid chorus modulation, and stereo panning width.

---

## 2. Sonification Presets

Researchers can switch between 5 tailored sound profiles depending on analytical needs or accessibility context:

| Preset Identifier | Profile Name | Primary Use Case | Acoustic Architecture |
| :--- | :--- | :--- | :--- |
| `scientific_analytic` | **Scientific Analytic** | Precision data auditing | Pure triangle carrier, linear gain, zero reverb, sharp transients, maximum frequency resolution. |
| `ambient_documentary` | **Ambient Documentary** | Public demonstration & outreach | Warm sine blend, 200ms decay, gentle lowpass filter (1200 Hz), spatial stereo depth. |
| `minimal_tactile` | **Minimal Tactile** | Low-vision & screen-reader users | High-contrast square/sine clicks, rapid 15ms attacks, zero masking of speech synthesis. |
| `cinematic_resonance` | **Cinematic Resonance** | Large screen / planetarium display | Sawtooth/square layers with dynamic resonance sweeping and sub-bass reinforcement. |
| `binaural_spatial` | **Binaural Spatial** | Comparative multi-station analysis | Channel 1 hard-panned left (-0.85), Channel 2 hard-panned right (+0.85) for spatial separation. |

---

## 3. Audio Safety, Anti-Clipping & Distortion Prevention

1. **Active Dynamics Compressor Node**:
   - `threshold`: $-14.0\text{ dBFS}$
   - `knee`: $25.0\text{ dB}$
   - `ratio`: $10:1$ (hard limiting protection)
   - `attack`: $0.003\text{ s}$ ($3\text{ ms}$)
   - `release`: $0.20\text{ s}$ ($200\text{ ms}$)
2. **Soft-Clipping Waveshaper**:
   An oversampled ($2\times$) hyperbolic tangent transfer function:
   $$y = \tanh\left(\frac{2}{\pi} \cdot x\right)$$
   Guarantees that regardless of overlapping polyphonic voices, the output never exceeds $0\text{ dBFS}$, eliminating harsh digital speaker crackle.
3. **Voice Registry & Garbage Collection**:
   Active audio nodes are tracked in an internal Set (`activeVoices`). Completed nodes are detached and unreferenced at their scheduled stop times, preventing browser audio thread leaks.
