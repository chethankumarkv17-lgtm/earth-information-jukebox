/**
 * NASA Earth Information Center (EIC) & Scientific Visualization Studio (SVS)
 * Reusable Data Structure for Earth Observation Visualizations & Sonification Profiles
 * 
 * Compliant with NASA Open Data Policy and authentic NASA SVS identifiers.
 */

/**
 * @typedef {Object} SonificationProfile
 * @property {string} baseFrequency - Frequency range in Hz
 * @property {string} waveform - Oscillator shape ('sine' | 'triangle' | 'sawtooth' | 'drone' | 'granular')
 * @property {string} parameterMapping - Mathematical mapping rules from sensor values to sound
 * @property {string} harmonicTimbre - Description of acoustic texture and harmonic behavior
 * @property {string} sampleId - Identifier connecting to playback engine
 * @property {string} sampleRate - Standard audio resolution
 */

/**
 * @typedef {Object} ScientificSource
 * @property {string} mission - NASA mission / constellation
 * @property {string} instrument - Sensor / instrument name
 * @property {string} center - Responsible NASA Center / Division
 * @property {string} svsId - NASA Scientific Visualization Studio ID
 * @property {string} eicReference - NASA Earth Information Center topic reference
 * @property {string} officialUrl - Verified NASA repository / portal URL
 * @property {string} datasetId - EOSDIS or NASA Earthdata catalog reference
 */

/**
 * @typedef {Object} EarthVisualization
 * @property {string} id - Unique visualization identifier
 * @property {string} title - Full descriptive title
 * @property {string} subtitle - Short subtitle
 * @property {string} category - One of the 6 official challenge categories
 * @property {string} phenomenon - Exact physical phenomenon tracked
 * @property {string} timeRange - Multi-decadal temporal range
 * @property {string} spatialResolution - Spatial resolution of instrument
 * @property {string} measurementUnits - Physical scientific units
 * @property {string} keyFinding - Key observation / trend from NASA data
 * @property {string} description - In-depth scientific explanation
 * @property {string} visualizationType - Diagram type for spectral preview
 * @property {ScientificSource} source - Official NASA attribution details
 * @property {SonificationProfile} sonification - Acoustic conversion profile
 * @property {Object} coordinates - Geographic focus or Global
 * @property {string[]} tags - Search keywords
 */

export const CATEGORIES = [
  "All Visualizations",
  "Global Temperature",
  "Ocean Circulation",
  "Ice Sheet Changes",
  "Atmospheric Carbon Dioxide",
  "Vegetation Changes",
  "Natural Earth Processes",
]

export const nasaVisualizations = [
  // 1. GLOBAL TEMPERATURE
  {
    id: "vis-temp-gistemp",
    title: "GISTEMP Global Surface Temperature Anomaly Spiral",
    subtitle: "1880–2024 Long-Term Climatological Surface Warming Record",
    category: "Global Temperature",
    phenomenon: "Global mean surface air temperature deviations relative to the 1951–1980 baseline.",
    timeRange: "1880 to Present (144-Year Continuous Record)",
    spatialResolution: "250 km grid / Global Coverage",
    measurementUnits: "Degrees Celsius Departure (°C Anomaly)",
    keyFinding: "Global mean surface temperature has warmed by +1.36°C above the late 19th-century pre-industrial baseline, with 2023–2024 setting all-time historical peaks.",
    description: "Maintained by the NASA Goddard Institute for Space Studies (GISS), GISTEMP integrates meteorological station networks, shipborne buoys, and ARGO ocean floats to calculate planetary surface thermal anomalies. The resulting Climate Spiral visualization illustrates accelerating outward radial warming over the past 40 years.",
    visualizationType: "temperature-spiral",
    previewGradient: "from-blue-600 via-amber-500 to-rose-600",
    coordinates: { name: "Global Biosphere", lat: 0.0, lon: 0.0 },
    source: {
      mission: "NASA GISTEMP & AIRS (Aqua)",
      instrument: "Atmospheric Infrared Sounder & Ground Network",
      center: "NASA Goddard Institute for Space Studies (GISS)",
      svsId: "SVS-4964",
      eicReference: "Earth Information Center: Earth's Vital Signs - Temperature",
      officialUrl: "https://data.giss.nasa.gov/gistemp/",
      datasetId: "GISTEMP v4 / 10.5067/TEMPANOM-GISTEMP4",
    },
    sonification: {
      baseFrequency: "110 Hz - 920 Hz",
      waveform: "sawtooth",
      parameterMapping: "Temperature anomalies map directly to pitch frequency: +0.0°C baseline maps to 220 Hz (A3), with each +0.1°C departure raising pitch by a musical semitone. Thermal kinetic energy increases overtone distortion and amplitude.",
      harmonicTimbre: "Ascending continuous pitch glissando transitioning from calm consonant lows (1880s) to dissonant high-register metallic resonances (2020s).",
      sampleId: "track-temp-gistemp",
      sampleRate: "48.0 kHz 24-bit PCM",
    },
    tags: ["temperature", "climate spiral", "gistemp", "giss", "warming", "airs", "surface heat"],
  },
  {
    id: "vis-temp-marine-heatwave",
    title: "Global Marine Heatwaves & Sea Surface Temperature",
    subtitle: "High-Resolution Satellite Ocean Surface Kinetic Warming",
    category: "Global Temperature",
    phenomenon: "Upper ocean thermal absorption and extreme marine heatwave anomalies.",
    timeRange: "2002 to Present (Daily Multi-Sensor Composite)",
    spatialResolution: "1 km x 1 km Ultra-High Resolution",
    measurementUnits: "Sea Surface Temperature (°C) & Anomaly",
    keyFinding: "Earth's oceans have absorbed over 90% of excess planetary greenhouse heat, triggering prolonged marine heatwaves that stress coral ecosystems and alter hurricane intensification.",
    description: "The Multi-scale Ultra-high Resolution (MUR) Sea Surface Temperature project combines thermal and microwave infrared radiometers from NASA, NOAA, and international satellites to map fine-scale ocean thermal gradients and heatwave persistence.",
    visualizationType: "marine-heatwave",
    previewGradient: "from-cyan-600 via-blue-500 to-red-500",
    coordinates: { name: "Equatorial & North Pacific", lat: 18.5, lon: -140.2 },
    source: {
      mission: "MUR SST / Aqua & Terra MODIS / VIIRS",
      instrument: "MODIS, AMSR-E, AVHRR Radiometers",
      center: "NASA Jet Propulsion Laboratory (JPL) / PO.DAAC",
      svsId: "SVS-5012",
      eicReference: "Earth Information Center: Warming Oceans",
      officialUrl: "https://podaac.jpl.nasa.gov/dataset/MUR-JPL-L4-GLOB-v4.1",
      datasetId: "MUR-JPL-L4-GLOB-v4.1",
    },
    sonification: {
      baseFrequency: "65 Hz - 540 Hz",
      waveform: "triangle",
      parameterMapping: "Ocean surface temperature governs low-pass filter cutoff and fundamental sub-bass frequency. Marine heatwave anomalies trigger sharp resonant frequency swells.",
      harmonicTimbre: "Warm, pulsating oceanic drone modulated by thermal kinetic energy.",
      sampleId: "track-temp-marine",
      sampleRate: "48.0 kHz 24-bit PCM",
    },
    tags: ["ocean temperature", "sst", "marine heatwaves", "jpl", "mur", "coral bleaching"],
  },

  // 2. OCEAN CIRCULATION
  {
    id: "vis-ocean-perpetual",
    title: "Perpetual Ocean: Global Surface Ocean Currents",
    subtitle: "High-Resolution Supercomputer Ocean Circulation Model (ECCO)",
    category: "Ocean Circulation",
    phenomenon: "Mesoscale and sub-mesoscale ocean eddy kinetics, thermal transport, and surface current velocities.",
    timeRange: "Multi-Decadal ECCO Climatological Simulation",
    spatialResolution: "Approx. 1/12th degree (10 km) grid",
    measurementUnits: "Current Velocity (Meters / Second) & Kinetic Energy",
    keyFinding: "Global ocean current eddies transport colossal amounts of thermal energy from the tropics to the poles, regulating planetary weather patterns and marine nutrients.",
    description: "Created by the Estimating the Circulation and Climate of the Ocean (ECCO) project at NASA JPL and MIT, Perpetual Ocean synthesizes satellite altimetry with computational fluid dynamics to reveal the intricate circulatory system of Earth's oceans.",
    visualizationType: "ocean-vectors",
    previewGradient: "from-blue-700 via-cyan-500 to-indigo-800",
    coordinates: { name: "North Atlantic Gulf Stream & Kuroshio", lat: 35.0, lon: -65.0 },
    source: {
      mission: "ECCO Consortium / Jason-3 & SWOT Altimetry",
      instrument: "Radar Altimeter & Advanced Ocean Models",
      center: "NASA Jet Propulsion Laboratory (JPL)",
      svsId: "SVS-3827",
      eicReference: "Earth Information Center: Ocean Circulation",
      officialUrl: "https://www.ecco-group.org/",
      datasetId: "ECCO-V4r4 / NASA SVS-3827",
    },
    sonification: {
      baseFrequency: "40 Hz - 360 Hz",
      waveform: "drone",
      parameterMapping: "Eddy rotational velocity directly drives binaural stereo panning (L/R) and Doppler pitch modulation. Water flow velocity modulates pulse tempo and sub-bass resonance.",
      harmonicTimbre: "Hypnotic, flowing sub-bass currents with spatial stereo swirls matching oceanic vortex dynamics.",
      sampleId: "track-ocean-perpetual",
      sampleRate: "48.0 kHz 24-bit PCM",
    },
    tags: ["ocean circulation", "ecco", "gulf stream", "perpetual ocean", "jpl", "eddies", "currents"],
  },
  {
    id: "vis-ocean-swot-altimetry",
    title: "SWOT Ocean Surface Topography & Eddy Currents",
    subtitle: "Ka-Band Radar Interferometric Ocean Topography",
    category: "Ocean Circulation",
    phenomenon: "Centimeter-precision Sea Surface Height (SSH) and sub-mesoscale oceanic vortex formations.",
    timeRange: "2023 to Present (Operational Mission)",
    spatialResolution: "2 km x 2 km Spatial Resolution",
    measurementUnits: "Sea Surface Height Anomaly (Centimeters)",
    keyFinding: "The SWOT KaRIn radar reveals 10x smaller ocean eddies than prior missions, capturing the microscopic turbulent mixing where oceans absorb heat and carbon dioxide.",
    description: "The Surface Water and Ocean Topography (SWOT) mission utilizes the Ka-band Radar Interferometer (KaRIn) to measure sea surface elevation with unprecedented clarity, revolutionizing ocean dynamics and global sea level monitoring.",
    visualizationType: "topography-mesh",
    previewGradient: "from-teal-600 via-cyan-400 to-blue-700",
    coordinates: { name: "Equatorial Pacific", lat: 14.2, lon: -155.8 },
    source: {
      mission: "SWOT (Surface Water and Ocean Topography)",
      instrument: "KaRIn (Ka-band Radar Interferometer)",
      center: "NASA JPL & CNES (French Space Agency)",
      svsId: "SVS-5098",
      eicReference: "Earth Information Center: Sea Level & Fresh Water",
      officialUrl: "https://swot.jpl.nasa.gov/",
      datasetId: "SWOT_L2_SSH_1.0 / PO.DAAC",
    },
    sonification: {
      baseFrequency: "35 Hz - 480 Hz",
      waveform: "sine",
      parameterMapping: "Sea surface height elevations map to fundamental sine pitch (+15 cm elevation shifts frequency upward). Interferometric phase coherence modulates acoustic clarity.",
      harmonicTimbre: "Clean, resonant sub-bass oscillations with microtonal frequency shifts mirroring ocean wave swells.",
      sampleId: "track-ocean-swot",
      sampleRate: "48.0 kHz 24-bit PCM",
    },
    tags: ["swot", "radar altimetry", "karin", "sea surface height", "ocean topography", "jpl"],
  },

  // 3. ICE SHEET CHANGES
  {
    id: "vis-ice-grace-mass",
    title: "Greenland & Antarctic Ice Sheet Mass Loss",
    subtitle: "Twin-Satellite Gravitational Field Anomaly Measurements",
    category: "Ice Sheet Changes",
    phenomenon: "Terrestrial polar ice mass depletion and gravitational field variance.",
    timeRange: "2002 to Present (GRACE & GRACE-FO Twin Constellations)",
    spatialResolution: "300 km spatial gravitational footprint",
    measurementUnits: "Cumulative Ice Mass Change (Gigatons, Gt)",
    keyFinding: "Greenland has lost approximately 5,400 billion metric tons (Gigatons) of ice since 2002 (~270 Gt/year), directly contributing to 15 mm of global sea level rise.",
    description: "The Gravity Recovery and Climate Experiment (GRACE and GRACE-FO) twin satellites measure minute variations in Earth's gravitational pull to quantify monthly mass loss from melting glaciers and ice sheets in Antarctica and Greenland.",
    visualizationType: "ice-mass-decay",
    previewGradient: "from-sky-500 via-blue-600 to-indigo-900",
    coordinates: { name: "Greenland Ice Sheet", lat: 72.0, lon: -40.0 },
    source: {
      mission: "GRACE & GRACE-FO Constellations",
      instrument: "Microwave K-Band Ranging & Laser Interferometer",
      center: "NASA Jet Propulsion Laboratory (JPL) & GFZ Potsdam",
      svsId: "SVS-5037",
      eicReference: "Earth Information Center: Ice Mass & Sea Level",
      officialUrl: "https://gracefo.jpl.nasa.gov/",
      datasetId: "GRACETELL_JPL_L3_TELLUS_LAND_RL06_v04",
    },
    sonification: {
      baseFrequency: "50 Hz - 720 Hz",
      waveform: "granular",
      parameterMapping: "Cumulative ice mass loss is sonified as a slow downward cascading microtonal glissando. As mass diminishes, low-frequency density thins out, giving way to hollow, sparse acoustic textures.",
      harmonicTimbre: "Heavy, resonant low-end body that progressively loses acoustic mass and warmth, punctuated by seismic sub-bass rumbles.",
      sampleId: "track-ice-grace",
      sampleRate: "48.0 kHz 24-bit PCM",
    },
    tags: ["grace", "grace-fo", "greenland", "antarctica", "ice sheet", "mass loss", "gravity", "sea level"],
  },
  {
    id: "vis-ice-icesat2-extent",
    title: "Arctic Sea Ice Minimum Extent & Thickness Freeboard",
    subtitle: "Laser Altimetry Multi-Decadal Sea Ice Shrinkage",
    category: "Ice Sheet Changes",
    phenomenon: "Arctic multi-year sea ice extent contraction and freeboard thickness loss.",
    timeRange: "1979 to Present (Satellite Passive Microwave & Laser)",
    spatialResolution: "0.7 meter Laser Footprint / 25 km Composite",
    measurementUnits: "Million Square Kilometers (Extent) & Meters (Freeboard)",
    keyFinding: "Arctic summer minimum sea ice extent has shrunk by roughly 12.2% per decade since 1979, with thick, multi-year ice replaced by thin, vulnerable seasonal ice.",
    description: "Combining passive microwave satellite sensors with ICESat-2's Advanced Topographic Laser Altimeter System (ATLAS), this visualization tracks the seasonal pulse and long-term decline of Arctic sea ice.",
    visualizationType: "ice-extent-curve",
    previewGradient: "from-cyan-300 via-sky-500 to-slate-800",
    coordinates: { name: "Central Arctic Ocean", lat: 85.0, lon: 0.0 },
    source: {
      mission: "ICESat-2 & NSIDC / DMSP",
      instrument: "ATLAS (Advanced Topographic Laser Altimeter System)",
      center: "NASA Goddard Space Flight Center & NSIDC",
      svsId: "SVS-4940",
      eicReference: "Earth Information Center: Polar Ice",
      officialUrl: "https://icesat-2.gsfc.nasa.gov/",
      datasetId: "ATL10 / NSIDC Sea Ice Index",
    },
    sonification: {
      baseFrequency: "80 Hz - 4.2 kHz",
      waveform: "sawtooth",
      parameterMapping: "Sea ice extent governs harmonic breadth and reverb decay. Micro-pulse photon reflections are mapped to brittle crystalline acoustic clicks and fractures.",
      harmonicTimbre: "Glassy, crystalline tones with delicate granular fracturing textures.",
      sampleId: "track-ice-extent",
      sampleRate: "48.0 kHz 24-bit PCM",
    },
    tags: ["icesat-2", "arctic", "sea ice", "nsidc", "atlas", "polar", "albedo"],
  },

  // 4. ATMOSPHERIC CARBON DIOXIDE
  {
    id: "vis-co2-geos-fp",
    title: "Global Atmospheric CO2 Transport: Watching Earth Breathe",
    subtitle: "High-Resolution Supercomputer Carbon Plume Simulation",
    category: "Atmospheric Carbon Dioxide",
    phenomenon: "3D dispersion of carbon dioxide from fossil fuel combustion, wildfires, and seasonal biospheric respiration.",
    timeRange: "2014 to Present (Annual Seasonal Cycle)",
    spatialResolution: "12 km x 12 km Atmospheric Grid",
    measurementUnits: "Parts Per Million Dry Air Mole Fraction (ppm XCO2)",
    keyFinding: "Atmospheric CO2 concentrations exhibit a vivid annual sawtooth cycle driven by Northern Hemisphere spring photosynthesis ('inhalation') and winter decay ('exhalation'), layered atop a rising +2.5 ppm/year baseline now exceeding 426 ppm.",
    description: "Using the Goddard Earth Observing System (GEOS) atmospheric model driven by OCO-2 satellite measurements, this visualization shows carbon dioxide swirling through global jet streams, identifying major emissions from industry and biomass burning alongside vegetative sinks.",
    visualizationType: "co2-sawtooth",
    previewGradient: "from-amber-500 via-orange-600 to-purple-800",
    coordinates: { name: "Global Atmosphere", lat: 30.0, lon: -10.0 },
    source: {
      mission: "OCO-2 & GEOS-FP Atmospheric Model",
      instrument: "Three-Band High-Resolution Grating Spectrometer",
      center: "NASA Goddard Global Modeling & Assimilation Office (GMAO)",
      svsId: "SVS-5115",
      eicReference: "Earth Information Center: Greenhouse Gases",
      officialUrl: "https://gmao.gsfc.nasa.gov/weather_prediction/",
      datasetId: "OCO2_L2_Lite_FP_10r",
    },
    sonification: {
      baseFrequency: "120 Hz - 680 Hz",
      waveform: "sine",
      parameterMapping: "Atmospheric CO2 parts per million (ppm) directly establishes the master carrier frequency (400 ppm = 400 Hz). The seasonal photosynthesis cycle modulates a rhythmic low-pass filter sweep like a slow biological breath.",
      harmonicTimbre: "Deep, respiratory choral swells cycling through seasonal 'inhalation' (spectral filter closure) and 'exhalation' (bright harmonic opening).",
      sampleId: "track-co2-geos",
      sampleRate: "48.0 kHz 24-bit PCM",
    },
    tags: ["co2", "greenhouse gas", "oco-2", "geos", "gmao", "carbon cycle", "atmosphere"],
  },
  {
    id: "vis-co2-emit-methane",
    title: "EMIT Point-Source Methane Super-Emitter Detection",
    subtitle: "Imaging Spectroscopy of Greenhouse Gas Plumes from Space",
    category: "Atmospheric Carbon Dioxide",
    phenomenon: "Detection and concentration quantification of localized point-source methane (CH4) emissions.",
    timeRange: "2022 to Present (ISS Operational Instrument)",
    spatialResolution: "60 meters spatial footprint",
    measurementUnits: "Methane Absorption Depth & Emission Rate (kg / hr)",
    keyFinding: "Methane is over 80 times more potent than CO2 over a 20-year timescale. EMIT has identified hundreds of super-emitters from landfills, oil/gas basins, and agriculture leaking thousands of kg/hr.",
    description: "Mounted on the International Space Station, the Earth Surface Mineral Dust Source Investigation (EMIT) uses advanced imaging spectroscopy across 285 spectral wavelengths to detect shortwave infrared absorption fingerprints of methane and mineral dust.",
    visualizationType: "methane-plume",
    previewGradient: "from-purple-600 via-emerald-400 to-cyan-500",
    coordinates: { name: "Permian Basin & Central Asia", lat: 32.0, lon: -103.0 },
    source: {
      mission: "EMIT (on International Space Station)",
      instrument: "Dyson Imaging Spectrometer (380–2500 nm)",
      center: "NASA Jet Propulsion Laboratory (JPL)",
      svsId: "SVS-5089",
      eicReference: "Earth Information Center: Methane & Greenhouse Gases",
      officialUrl: "https://earth.jpl.nasa.gov/emit/",
      datasetId: "EMIT_L2B_CH4ENH / LP DAAC",
    },
    sonification: {
      baseFrequency: "320 Hz - 2.8 kHz",
      waveform: "triangle",
      parameterMapping: "Point-source plume emission rate (kg/hr) is sonified as concentrated harmonic overtone bursts at localized coordinates, with absorption depth modulating resonance buzz.",
      harmonicTimbre: "Piercing, resonant alert harmonics emerging abruptly over ambient background drones.",
      sampleId: "track-co2-methane",
      sampleRate: "48.0 kHz 24-bit PCM",
    },
    tags: ["emit", "methane", "greenhouse gases", "iss", "jpl", "spectroscopy", "super-emitters"],
  },

  // 5. VEGETATION CHANGES
  {
    id: "vis-veg-modis-ndvi",
    title: "Global Biosphere NDVI Phenology & Greenness Dynamics",
    subtitle: "24-Year Normalized Difference Vegetation Index Record",
    category: "Vegetation Changes",
    phenomenon: "Terrestrial vegetation canopy density, photosynthetic capacity, and seasonal greening/browning.",
    timeRange: "2000 to Present (Continuous Daily Observation)",
    spatialResolution: "250m to 1 km / Global Landmasses",
    measurementUnits: "NDVI Index (-0.20 to +1.00)",
    keyFinding: "Long-term NDVI captures planetary vegetative shifts including Arctic 'greening' from warming tundra, Amazon canopy stress during extreme drought cycles, and agricultural phenology.",
    description: "Calculated from the differential reflectance between red visible light (chlorophyll absorption) and near-infrared light (leaf mesophyll structure scatter), the MODIS NDVI product provides the definitive global record of planetary vegetation health.",
    visualizationType: "ndvi-spectrum",
    previewGradient: "from-emerald-600 via-teal-400 to-lime-500",
    coordinates: { name: "Amazon Basin & Global Forests", lat: -3.1, lon: -60.0 },
    source: {
      mission: "Terra & Aqua Constellation",
      instrument: "MODIS (Moderate Resolution Imaging Spectroradiometer)",
      center: "NASA Goddard Space Flight Center / LP DAAC",
      svsId: "SVS-4173",
      eicReference: "Earth Information Center: Biosphere & Life on Land",
      officialUrl: "https://modis.gsfc.nasa.gov/",
      datasetId: "MOD13A2 v061 / LP DAAC",
    },
    sonification: {
      baseFrequency: "80 Hz - 3.2 kHz",
      waveform: "sine",
      parameterMapping: "NDVI values (0.1 to 0.9) map to rich harmonic musical chords: barren soil (0.1) produces dry low fundamentals, while dense healthy forest (0.85+) triggers luxuriant polyphonic chord extensions and bright overtone shimmer.",
      harmonicTimbre: "Lush, consonant organic chord clusters with acoustic warmth directly reflecting canopy photosynthetic vitality.",
      sampleId: "track-veg-ndvi",
      sampleRate: "48.0 kHz 24-bit PCM",
    },
    tags: ["ndvi", "modis", "vegetation", "amazon", "canopy", "photosynthesis", "biosphere", "terra"],
  },
  {
    id: "vis-veg-pace-chlorophyll",
    title: "PACE Global Marine Phytoplankton & Chlorophyll-a Blooms",
    subtitle: "Hyperspectral Ocean Color & Marine Ecology Dynamics",
    category: "Vegetation Changes",
    phenomenon: "Marine photosynthetic phytoplankton concentrations and ocean color absorption signatures.",
    timeRange: "2024 to Present (Operational First-Light Data)",
    spatialResolution: "1 km x 1 km Spatial Footprint",
    measurementUnits: "Chlorophyll-a Concentration (mg / m³)",
    keyFinding: "Phytoplankton produce roughly 50% of the oxygen on Earth and form the base of the marine food web. PACE's hyperspectral sensor differentiates specific phytoplankton communities for the first time.",
    description: "Launched in February 2024, the Plankton, Aerosol, Cloud, ocean Ecosystem (PACE) mission features the Ocean Color Instrument (OCI), which measures continuous ultraviolet-to-near-infrared spectra to monitor ocean ecosystems and carbon sequestration.",
    visualizationType: "chlorophyll-swirl",
    previewGradient: "from-teal-500 via-emerald-400 to-cyan-600",
    coordinates: { name: "North Atlantic & Southern Ocean", lat: 56.3, lon: -30.2 },
    source: {
      mission: "PACE (Plankton, Aerosol, Cloud, ocean Ecosystem)",
      instrument: "OCI (Ocean Color Instrument)",
      center: "NASA Goddard Space Flight Center / Ocean Biology DAAC",
      svsId: "SVS-5192",
      eicReference: "Earth Information Center: Ocean Biology & Carbon",
      officialUrl: "https://pace.oceansciences.org/",
      datasetId: "PACE_OCI_L2_AOP_NRT",
    },
    sonification: {
      baseFrequency: "140 Hz - 4.5 kHz",
      waveform: "sawtooth",
      parameterMapping: "Hyperspectral chlorophyll absorption bands (443nm & 670nm) generate undulating arpeggiated melodic sequences. Bloom density accelerates arpeggiator rate.",
      harmonicTimbre: "Sparkling, fluid melodic clusters with rapid undulating arpeggios simulating microscopic marine blooms.",
      sampleId: "track-veg-pace",
      sampleRate: "48.0 kHz 24-bit PCM",
    },
    tags: ["pace", "ocean color", "chlorophyll", "plankton", "oci", "goddard", "marine ecology"],
  },

  // 6. NATURAL EARTH PROCESSES
  {
    id: "vis-nat-wildfire-smoke",
    title: "Global Wildfire Smoke Plumes & Aerosol Optical Depth",
    subtitle: "Active Fire Detection & Atmospheric Aerosol Radiative Forcing",
    category: "Natural Earth Processes",
    phenomenon: "Biomass burning thermal radiative power and transcontinental smoke aerosol transport.",
    timeRange: "2000 to Present (Near-Real-Time FIRMS Monitoring)",
    spatialResolution: "375 meters (VIIRS) / 1 km (MODIS)",
    measurementUnits: "Aerosol Optical Depth (AOD) & Fire Radiative Power (MW)",
    keyFinding: "Extreme pyrocumulonimbus wildfire events inject vast plumes of black carbon and aerosols into the stratosphere, circling the globe and modulating planetary atmospheric reflectivity.",
    description: "NASA's Fire Information for Resource Management System (FIRMS) integrates thermal anomaly detections from MODIS and VIIRS with aerosol optical depth measurements to track active wildfires and smoke dispersion worldwide.",
    visualizationType: "wildfire-smoke",
    previewGradient: "from-red-600 via-amber-500 to-orange-700",
    coordinates: { name: "Boreal Forests & California", lat: 55.0, lon: -115.0 },
    source: {
      mission: "Suomi NPP / NOAA-20 / Terra & Aqua",
      instrument: "VIIRS & MODIS Thermal Anomaly Detectors",
      center: "NASA Earth Applied Sciences & FIRMS",
      svsId: "SVS-5140",
      eicReference: "Earth Information Center: Wildfires & Air Quality",
      officialUrl: "https://firms.modaps.eosdis.nasa.gov/",
      datasetId: "VIIRS_375M_NRT / MODIS_C61_NRT",
    },
    sonification: {
      baseFrequency: "90 Hz - 5.8 kHz",
      waveform: "granular",
      parameterMapping: "Aerosol Optical Depth (AOD) controls broadband noise saturation and turbulence. Fire Radiative Power (Megawatts) triggers crackling granular distortion and sharp harmonic spikes.",
      harmonicTimbre: "Crackling, turbulent acoustic texture with rising friction noise and resonant thermal surges.",
      sampleId: "track-nat-wildfire",
      sampleRate: "48.0 kHz 24-bit PCM",
    },
    tags: ["wildfire", "smoke", "firms", "viirs", "aerosols", "modis", "air quality"],
  },
  {
    id: "vis-nat-saharan-dust",
    title: "Trans-Atlantic Saharan Mineral Dust Plumes",
    subtitle: "Aeolian Sediment Transport & Ocean-Canopy Fertilization",
    category: "Natural Earth Processes",
    phenomenon: "Atmospheric lofting and trans-oceanic transport of mineral dust from the Sahara Desert to the Americas.",
    timeRange: "Multi-Year Climatological Seasonal Cycle",
    spatialResolution: "1 km to 50 km Satellite Swath",
    measurementUnits: "Dust Mass Flux (Million Metric Tons / Year)",
    keyFinding: "Over 180 million tons of nutrient-rich Saharan mineral dust are lifted by trade winds each year, traversing 5,000 km across the Atlantic to deposit phosphorus that fertilizes the Amazon rainforest and ocean diatoms.",
    description: "Using CALIPSO LiDAR profiles, MODIS aerosol optical depth, and the DSCOVR EPIC camera, NASA scientists mapped the complete 3D trans-Atlantic trajectory of Saharan dust plumes, demonstrating deep planetary interconnectedness.",
    visualizationType: "dust-trajectory",
    previewGradient: "from-amber-600 via-yellow-500 to-stone-700",
    coordinates: { name: "Bodélé Depression to Amazon Basin", lat: 17.0, lon: -25.0 },
    source: {
      mission: "CALIPSO & Terra MODIS / DSCOVR EPIC",
      instrument: "CALIOP LiDAR & MODIS Aerosol Retrieval",
      center: "NASA Goddard Space Flight Center",
      svsId: "SVS-4272",
      eicReference: "Earth Information Center: Atmospheric Dust & Weather",
      officialUrl: "https://www-calipso.larc.nasa.gov/",
      datasetId: "CAL_LID_L2_VFM / SVS-4272",
    },
    sonification: {
      baseFrequency: "70 Hz - 2.4 kHz",
      waveform: "drone",
      parameterMapping: "Dust optical thickness and altitude govern sweeping bandpass filters and wide stereo panning from East to West across a 5,000-mile simulated soundstage.",
      harmonicTimbre: "Airy, sandy wind harmonics with shifting stereo panning and warm granular resonance.",
      sampleId: "track-nat-dust",
      sampleRate: "48.0 kHz 24-bit PCM",
    },
    tags: ["dust", "sahara", "calipso", "lidar", "aerosol", "amazon fertilization", "epic"],
  },
  {
    id: "vis-nat-aurora-magnetosphere",
    title: "Auroral Electrojet & Solar Wind Geomagnetic Coupling",
    subtitle: "Ultra-Low Frequency Magnetospheric Plasma Waves",
    category: "Natural Earth Processes",
    phenomenon: "Solar wind plasma disturbances triggering Alfvén waves and auroral substorms in Earth's ionosphere.",
    timeRange: "Continuous Real-Time Space Weather Tracking",
    spatialResolution: "Auroral Oval Latitudes (60°–75° N/S)",
    measurementUnits: "Magnetic Field Perturbation (Nanoteslas, nT)",
    keyFinding: "Solar wind coronal mass ejections perturb Earth's protective geomagnetic shield, channeling energetic electrons along magnetic field lines to excite atmospheric oxygen and nitrogen into luminous auroral curtains.",
    description: "NASA's THEMIS, GOLD, and Van Allen Probes missions measure electric and magnetic field oscillations in the magnetosphere, capturing natural radio emissions (whistler waves and chorus) directly convertible into sound.",
    visualizationType: "auroral-waves",
    previewGradient: "from-emerald-400 via-purple-600 to-cyan-400",
    coordinates: { name: "Auroral Oval (Tromsø / Fairbanks)", lat: 68.5, lon: -147.7 },
    source: {
      mission: "THEMIS & Van Allen Probes / GOLD",
      instrument: "Fluxgate Magnetometers & Electric Field Instruments",
      center: "NASA Heliophysics Division & Space Sciences Lab",
      svsId: "SVS-4482",
      eicReference: "Earth Information Center: Space Weather & Magnetosphere",
      officialUrl: "https://www.nasa.gov/mission_pages/themis/main/index.html",
      datasetId: "THEMIS_FGM_MAG / NASA Space Physics Data Facility",
    },
    sonification: {
      baseFrequency: "160 Hz - 8.4 kHz",
      waveform: "sawtooth",
      parameterMapping: "Magnetospheric plasma wave frequencies are directly frequency-shifted from radio spectrum into the human audio band without alteration, revealing natural cosmic whistlers and chorus chirps.",
      harmonicTimbre: "Ethereal, chirping cosmic glissandos and singing plasma resonances matching auroral curtain flickers.",
      sampleId: "track-nat-aurora",
      sampleRate: "48.0 kHz 24-bit PCM",
    },
    tags: ["aurora", "magnetosphere", "themis", "solar wind", "space weather", "plasma waves"],
  },
]
