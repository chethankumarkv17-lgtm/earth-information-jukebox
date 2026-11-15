# 🎙️ EARTH JUKEBOX — Live Demonstration Script
### *NASA Space Apps Challenge 2026 Presentation Walkthrough*

**Target Duration:** 3 to 4 Minutes  
**Demonstration URL:** `http://localhost:5173`  
**Presenters:** 1 Lead Speaker + 1 Navigator (or Solo Presenter)

---

## 🎬 Pre-Flight Checklist (1 Minute Before Going Live)
- [ ] Backend running: `http://127.0.0.1:8000` (FastAPI terminal active)
- [ ] Frontend running: `http://localhost:5173` (Vite dev server active)
- [ ] Audio volume set to 75% on laptop/projector speakers (Test earcon chime)
- [ ] Browser window sized to full screen ($1440 \times 900$ or $1920 \times 1080$)
- [ ] Browser zoom at 100%

---

## ⏱️ Step-by-Step Demonstration Flow

```
[ Step 1: Open Application ] ──► [ Step 2: Select Preset Sequence ]
                                               │
                                               ▼
[ Step 4: Generate Soundscape ] ◄── [ Step 3: Inspect CV Telemetry ]
               │
               ▼
[ Step 5: Synchronized Scrubbing ] ──► [ Step 6: Mutate Audio Styles ]
                                               │
                                               ▼
                                  [ Step 7: Accessibility & WCAG AAA ]
```

---

### Step 1: Open the Application
- **Action:** Open `http://localhost:5173/` in Google Chrome / Edge.
- **Visual Cue:** The dark space hero banner appears with the orbital mechanics animation and live mission counters (*24+ Earth Datasets, 14 Satellites, 0.05ms Latency*).
- **Presenter Spoken Script:**
  > *"Judges, welcome to EARTH JUKEBOX. Every day, NASA satellites capture petabytes of vital Earth observation data—from melting glaciers to ocean heat anomalies. But almost all of it is trapped in visual charts that exclude visually impaired communities.  
  > Today, we are transforming NASA space science into original, scientifically grounded, procedural sound."*
- **Navigation:** Click **"Launch Sound Studio"** in the hero section (or press `#studio`).

---

### Step 2: Select a NASA Earth Visualization
- **Action:** In the Dynamic Sequence Studio, click the **"Arctic Sea Ice Minimum Retreat"** preset card.
- **Visual Cue:** The 20-frame filmstrip loads showing satellite microwave observations from 1979 through 2024. The scientific metadata badge displays *NASA SVS / NSIDC CryoSat & ICESat-2 Laser Altimetry*.
- **Presenter Spoken Script:**
  > *"Here, we load 45 years of Arctic Sea Ice Minimum Extent, observed by NASA's CryoSat and ICESat-2 laser altimeters. We see the contiguous 7.5 million square kilometer polar ice shield fragmenting into dark open ocean water across the Beaufort and Laptev seas."*

---

### Step 3: Analyze the Image
- **Action:** Point out the live telemetry panel on the right side of the screen.
- **Visual Cue:** The numerical metrics update:
  - *Standard Luminance:* `198.4 / 255`
  - *Dominant Color Palette:* `#E2F1F8` (Glacial Ice Pack), `#9ED4E8` (Melt Pond Cyan), `#162846` (Deep Arctic Ocean)
  - *Surface Edge Complexity:* `8.4%`
  - *Spatial Centroid:* `X: 0.52, Y: 0.48`
- **Presenter Spoken Script:**
  > *"Our Python OpenCV and Pillow backend decomposes every satellite frame into an 11-dimensional normalized numerical feature vector. It extracts pixel luminance, K-Means dominant color clusters, Shannon entropy, and spatial centroids. We never guess colors—our legend calibration explicitly connects optical pixels to scientific sensor ground truth."*

---

### Step 4: Generate its Soundscape
- **Action:** Press the `Space` bar (or click the glowing blue **"Generate Dynamic Audio"** button).
- **Visual & Audio Cue:** A rising earcon chime ($440\text{ Hz} \to 554\text{ Hz}$) plays. Procedural audio synthesis starts immediately. The multi-band frequency spectrum visualizer and real-time waveform canvas begin animating.
- **Presenter Spoken Script:**
  > *"Notice what just happened: this is NOT a prerecorded MP3 or generic ambient loop. The Tone.js Web Audio engine is actively synthesizing sound waves from the satellite telemetry.  
  > The high-albedo reflective ice produces brilliant, crystalline high-frequency overtones, resonant filter peaks, and bright modal chords."*

---

### Step 5: Play the Visualization with Synchronized Audio
- **Action:** Click the **Play** button to run the animation automatically, then grab the timeline slider and scrub rapidly forward to **Frame 18 (Year 2024)**.
- **Visual & Audio Cue:** The satellite frame shifts to the sparse 2024 ice minimum. The soundscape immediately transforms: the bright crystalline frequencies dissolve, and a deep, resonant sub-bass ocean drone emerges.
- **Presenter Spoken Script:**
  > *"Now watch and listen as we progress across 45 years. As the planetary ice shield retreats and exposes dark open ocean water, the high-frequency albedo resonance fades, and our procedural engine transitions into a deep sub-bass ocean drone.  
  > Notice that there are zero audio clicks, pops, or stutters. Our shortest-arc circular interpolation algorithm and continuous exponential parameter ramps keep the soundscape musically pleasant and mathematically true."*

---

### Step 6: Change Sound Parameters
- **Action:**
  1. Click **"Electronic"** in the Sound Style selector.
  2. Click the **"2.0x"** speed button (or press `]`).
- **Visual & Audio Cue:** The timbre changes from ambient pads to rhythmic, syncopated minor pentatonic arpeggios that subdivide according to topological edge density. The timeline steps at double speed.
- **Presenter Spoken Script:**
  > *"EARTH JUKEBOX offers five distinct procedural audio profiles. Switching to 'Electronic' maps surface edge complexity into dynamic syncopated arpeggiators. We can also scale tempo to 2x speed for rapid decadal sweeps—all while preserving pitch integrity."*

---

### Step 7: Demonstrate Accessibility Features (WCAG 2.2 Level AAA)
- **Action:**
  1. Press `h` on the keyboard (High-Contrast Mode activates).
  2. Press `?` on the keyboard (Keyboard Shortcuts Cheatsheet modal opens).
  3. Press `Esc` to close modal.
  4. Press `a` on the keyboard (Audio Description begins speaking).
- **Visual & Audio Cue:**
  - High Contrast: Background turns stark `#000000`, text becomes `#FFFFFF`, borders turn `#00FFFF`, focus rings turn `#FFFF00` ($21.0:1$ contrast ratio).
  - Web Speech voice speaks the structured scientific audio description:
    *"This visualization documents 45 years of polar sea ice retreat... The generated sound maps high optical albedo to bright high-frequency bells, evolving into deep sub-bass ocean drones."*
- **Presenter Spoken Script:**
  > *"Finally, we come to the heart of the NASA challenge: Universal Accessibility.  
  > EARTH JUKEBOX is fully Section 508 and WCAG 2.2 Level AAA compliant. Pressing 'h' instantly engages our high-contrast mode with a 21-to-1 contrast ratio.  
  > Pressing '?' displays our hands-free keyboard shortcuts. And pressing 'a' triggers live Web Speech audio descriptions that answer the four fundamental scientific questions about what is happening on our planet.  
  > Sighted or visually impaired, every user experiences the living pulse of Earth."*

---

## 🏆 Closing Statement (15 Seconds)
- **Presenter Spoken Script:**
  > *"EARTH JUKEBOX bridges science, art, and universal accessibility. It turns passive satellite observation into an unforgettable, multisensory human experience. Thank you, and we welcome your questions!"*

---

## 🎹 Quick-Reference Demonstration Hotkeys

| Key | Result | When to Use |
| :---: | :--- | :--- |
| `Space` | Play / Pause Audio | At Step 4 to start sonification |
| `h` | Toggle High-Contrast (WCAG AAA) | At Step 7 to show visual accessibility |
| `a` | Trigger Spoken Audio Description | At Step 7 to demonstrate voice narration |
| `?` | Show Keyboard Shortcuts Modal | At Step 7 to prove hands-free navigation |
| `Esc` | Dismiss Modal Dialog | Immediately after showing cheatsheet |
| `m` | Mute / Unmute Audio | If needing to pause audio for judge questions |
| `↑` / `↓` | Adjust Master Volume | To adjust loudness in noisy presentation halls |
| `[` / `]` | Decrease / Increase Playback Speed | To show temporal scaling |

---
*Ready for live hackathon presentation and judges evaluation.*
