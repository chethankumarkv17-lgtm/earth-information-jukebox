/**
 * Comprehensive Accessible Descriptions for Earth Visualizations (Phase 9 & 10)
 * 
 * Provides structured non-visual sensory descriptions answering:
 * 1. What the visualization represents (Text alternative)
 * 2. What patterns are visible / measured
 * 3. What the generated sound represents (Acoustic mapping)
 * 4. How the sound changes over time (Acoustic evolution)
 * 5. Data change explainer (Scientific delta explanation)
 * 
 * Designed for screen-reader users, blind and low-vision researchers,
 * and Text-to-Speech audio narration under W3C WCAG 2.2 AAA & Section 508.
 */

export const ACCESSIBLE_DESCRIPTIONS = {
  surface_temperature: {
    id: 'surface_temperature',
    title: 'Land & Atmospheric Surface Temperature (2m)',
    mission: 'NASA MERRA-2 Reanalysis / Terra MODIS Land Surface Temperature',
    units: 'degrees Celsius (°C)',
    temporalResolution: 'Hourly to Daily',
    spatialResolution: '0.5° × 0.625° Grid',
    coverage: 'Global Terrestrial & Oceanic',
    whatItRepresents: 'This dataset measures near-surface atmospheric temperature two meters above the ground. It is fundamental to understanding planetary heat budgets, diurnal solar warming cycles, seasonal thermodynamics, and regional heatwaves.',
    patternsVisible: 'The temperature profile displays distinct diurnal oscillation curves: rapid thermal heating following local solar dawn, reaching peak temperatures in early afternoon, followed by steady radiative cooling through the night.',
    soundRepresentation: 'Temperature is mapped to musical pitch within the Major Pentatonic scale across an audible range from sixty-five Hertz (sub-zero freeze at minus thirty Celsius) to one thousand forty-six Hertz (extreme heat at fifty Celsius). Warmer temperatures produce higher pitches, while colder temperatures produce deeper bass tones.',
    soundChangesOverTime: 'As local daylight warms the planetary surface, the acoustic pitch smoothly ascends through the harmonic register. Extreme heatwave anomalies introduce harmonic brightness, while nighttime cooling results in a steady descent into calming lower octaves.',
    spokenNarrative: 'Land and Atmospheric Surface Temperature at two meters, derived from NASA MERRA-2 and MODIS telemetry. Near-surface temperature is translated into musical pitch: sub-zero temperatures produce deep resonant bass tones, moderate ambient warmth produces mid-register piano chords, and extreme heat generates high, bright synthesizer frequencies.',
    explainChange: (prevVal, newVal) => {
      if (prevVal === null || prevVal === undefined) return `Current surface temperature is ${newVal.toFixed(1)} degrees Celsius.`
      const delta = newVal - prevVal
      const absDelta = Math.abs(delta).toFixed(1)
      if (Math.abs(delta) < 0.2) return `Temperature remains stable at ${newVal.toFixed(1)} degrees Celsius.`
      if (delta > 0) return `Temperature increased by ${absDelta} degrees to ${newVal.toFixed(1)} degrees Celsius, indicating active surface solar heating.`
      return `Temperature decreased by ${absDelta} degrees to ${newVal.toFixed(1)} degrees Celsius, indicating atmospheric radiative cooling.`
    }
  },

  precipitation: {
    id: 'precipitation',
    title: 'Precipitation Accumulation & Rain Intensity',
    mission: 'NASA Global Precipitation Measurement (GPM) IMERG',
    units: 'millimeters (mm/day)',
    temporalResolution: 'Half-Hourly / Daily',
    spatialResolution: '0.1° × 0.1° (~10 km)',
    coverage: 'Global Latitude 60°N to 60°S',
    whatItRepresents: 'This dataset captures total liquid and frozen water falling from clouds to Earth. It tracks convective storm cells, tropical monsoons, atmospheric rivers, and regional drought conditions.',
    patternsVisible: 'Rainfall distribution is highly dynamic and episodic. Dry periods show zero precipitation across broad swathes, interrupted by intense convective storm bursts with rapid precipitation spikes reaching fifty to one hundred millimeters.',
    soundRepresentation: 'Precipitation is mapped logarithmically to acoustic rhythm, droplet density, and gain amplitude. Completely dry days produce total silence. Light drizzle produces gentle, sparse wooden clicks, while torrential downpours generate rapid polyrhythmic cascades with swelling white noise rain textures.',
    soundChangesOverTime: 'The sonification remains silent or quiet during dry intervals, providing acoustic contrast. When a rain system moves overhead, droplet frequencies accelerate into rapid percussive showers, swelling in volume as precipitation intensifies and fading back to silence as the front passes.',
    spokenNarrative: 'Precipitation Accumulation from NASA Global Precipitation Measurement IMERG telemetry. Rainfall intensity controls sound density and rhythm: dry days with zero rainfall produce complete silence, light rain creates gentle rhythmic droplet taps, and heavy storms generate dense, accelerating percussion showers.',
    explainChange: (prevVal, newVal) => {
      if (newVal === 0.0) return `No precipitation recorded. The region is experiencing completely dry conditions.`
      if (prevVal === null || prevVal === undefined) return `Precipitation is ${newVal.toFixed(1)} millimeters.`
      const delta = newVal - prevVal
      const absDelta = Math.abs(delta).toFixed(1)
      if (prevVal === 0.0 && newVal > 0.0) return `Rainfall initiated with ${newVal.toFixed(1)} millimeters recorded, ending the dry spell.`
      if (delta > 2.0) return `Rainfall surged by ${absDelta} millimeters to ${newVal.toFixed(1)} millimeters, indicating an intensifying convective storm cell.`
      if (delta < -2.0) return `Rainfall declined by ${absDelta} millimeters to ${newVal.toFixed(1)} millimeters as the storm system dissipated.`
      return `Precipitation steady at ${newVal.toFixed(1)} millimeters.`
    }
  },

  wind_speed: {
    id: 'wind_speed',
    title: 'Near-Surface Wind Speed & Kinetic Circulation (10m)',
    mission: 'NASA MERRA-2 Atmospheric Reanalysis',
    units: 'meters per second (m/s)',
    temporalResolution: 'Hourly to Daily',
    spatialResolution: '0.5° × 0.625° Grid',
    coverage: 'Global Terrestrial & Marine',
    whatItRepresents: 'This dataset measures kinetic atmospheric wind velocity ten meters above Earth surface. It reflects pressure gradients, frontal boundary passages, jet stream disturbances, and oceanic gale forces.',
    patternsVisible: 'Wind speeds vary from calm doldrums near zero to two meters per second up to powerful storm gales exceeding twenty-five meters per second, accompanied by rapid gust shifts during frontal passages.',
    soundRepresentation: 'Wind speed controls acoustic modulation and filter resonance. Gentle breezes produce a slow, breathing low-frequency tremolo and muffled filter cutoffs. High winds accelerate tremolo flutter up to eight Hertz and open resonant bandpass filters for whistling acoustic howling.',
    soundChangesOverTime: 'Acoustic texture shifts continuously with aerodynamic velocity. Gentle calm periods sound warm and tranquil, building into undulating aeroacoustic turbulence with whistling overtones as atmospheric pressure systems accelerate.',
    spokenNarrative: 'Surface Wind Speed at ten meters from NASA MERRA-2 telemetry. Wind speed controls acoustic texture and filter resonance: calm winds produce gentle low-frequency breathing tones, while gale-force winds generate rapid fluttering modulation and whistling resonant harmonics.',
    explainChange: (prevVal, newVal) => {
      if (prevVal === null || prevVal === undefined) return `Wind speed is ${newVal.toFixed(1)} meters per second.`
      const delta = newVal - prevVal
      const absDelta = Math.abs(delta).toFixed(1)
      if (Math.abs(delta) < 0.5) return `Wind speed steady at ${newVal.toFixed(1)} meters per second.`
      if (delta > 0) return `Wind velocity accelerated by ${absDelta} meters per second to ${newVal.toFixed(1)} meters per second, indicating an incoming atmospheric pressure disturbance.`
      return `Wind velocity eased by ${absDelta} meters per second to ${newVal.toFixed(1)} meters per second toward calmer aerodynamic flow.`
    }
  },

  vegetation_ndvi: {
    id: 'vegetation_ndvi',
    title: 'Vegetation Index (NDVI) Photosynthetic Canopy Density',
    mission: 'NASA Terra / Aqua MODIS 16-Day L3 Global (MOD13A2)',
    units: 'Normalized Difference Index (-0.2 to +1.0)',
    temporalResolution: '16-Day Composite',
    spatialResolution: '1 km Gridded',
    coverage: 'Global Continental Terrestrial',
    whatItRepresents: 'NDVI quantifies photosynthetic chlorophyll absorption and near-infrared canopy reflection. Values above zero point six represent dense tropical rainforest canopy, while values near zero indicate bare sand, rock, or snow.',
    patternsVisible: 'Vegetation undergoes profound seasonal green-up and senescence cycles, showing green flushes during wet monsoon periods and canopy browning during seasonal dry or winter periods.',
    soundRepresentation: 'NDVI directly dictates harmonic timbre, waveform shape, and overtone count. Water and barren soil produce pure, stark sine waves with only one fundamental harmonic. Sparse foliage introduces warm triangle waves, while dense rainforests generate rich multi-harmonic sawtooth pads with up to eight overtones and stereo chorus spread.',
    soundChangesOverTime: 'The acoustic spectrum breathes in alignment with seasonal phenology. During dry or senescent seasons, timbre simplifies into mellow fundamental tones. As the growing season peaks, lush overtones multiply, creating an expansive, multi-layered acoustic forest canopy.',
    spokenNarrative: 'Normalized Difference Vegetation Index from NASA MODIS satellite sensors. Photosynthetic vitality dictates acoustic timbre: barren ground produces pure, simple sine waves, while lush, dense rainforest canopy triggers rich multi-harmonic sawtooth waves with vibrant acoustic overtones.',
    explainChange: (prevVal, newVal) => {
      if (prevVal === null || prevVal === undefined) return `Vegetation Index is ${newVal.toFixed(2)}.`
      const delta = newVal - prevVal
      const absDelta = Math.abs(delta).toFixed(2)
      if (Math.abs(delta) < 0.03) return `Canopy foliage remains stable at NDVI ${newVal.toFixed(2)}.`
      if (delta > 0) return `Photosynthetic activity increased by ${absDelta} to NDVI ${newVal.toFixed(2)}, signaling seasonal green-up and leaf canopy expansion.`
      return `Vegetation index dropped by ${absDelta} to NDVI ${newVal.toFixed(2)}, indicating dry season canopy senescence or foliage loss.`
    }
  },

  sea_surface_temp: {
    id: 'sea_surface_temp',
    title: 'Sea Surface Temperature (SST) & Oceanic Heat Content',
    mission: 'NOAA / NASA Optimum Interpolation SST (OISST v2.1) & GHRSST',
    units: 'degrees Celsius (°C)',
    temporalResolution: 'Daily High-Resolution',
    spatialResolution: '0.25° × 0.25° (~25 km)',
    coverage: 'Global Ice-Free Oceans',
    whatItRepresents: 'Sea Surface Temperature measures thermodynamic heat energy in the upper ocean boundary layer. It drives hurricane genesis, marine heatwaves, coral bleaching, and planetary weather circulation.',
    patternsVisible: 'SST ranges from polar freezing points near minus one point eight Celsius up to equatorial tropical warm pools exceeding thirty-one Celsius, revealing seasonal thermocline migration and upwelling tongues.',
    soundRepresentation: 'Ocean SST is translated into a sub-bass foundation drone (forty-four to one hundred thirty-one Hertz) paired with slow tidal chorusing. Warmer ocean waters elevate the sub-bass foundation pitch and accelerate tidal chorus rates, while cold polar waters produce deep, glacial sub-audible rumbles.',
    soundChangesOverTime: 'Playback delivers a heavy, physical oceanic foundation that anchors the sonification. During warming marine heatwaves, the sub-bass drone ascends and pulses with faster tidal chorusing, conveying concentrated thermal energy in the ocean basin.',
    spokenNarrative: 'Sea Surface Temperature from NOAA and NASA satellite infrared and microwave radiometry. Ocean temperature anchors the sonification as a deep sub-bass drone: icy polar oceans generate deep glacial vibrations below fifty Hertz, while warm tropical waters produce elevated bass chords with swelling tidal modulation.',
    explainChange: (prevVal, newVal) => {
      if (prevVal === null || prevVal === undefined) return `Sea surface temperature is ${newVal.toFixed(1)} degrees Celsius.`
      const delta = newVal - prevVal
      const absDelta = Math.abs(delta).toFixed(1)
      if (Math.abs(delta) < 0.2) return `Ocean thermal temperature steady at ${newVal.toFixed(1)} degrees Celsius.`
      if (delta > 0) return `Ocean water warmed by ${absDelta} degrees to ${newVal.toFixed(1)} degrees Celsius, indicating elevated upper-ocean thermal absorption.`
      return `Ocean temperature cooled by ${absDelta} degrees to ${newVal.toFixed(1)} degrees Celsius, indicating marine upwelling or seasonal heat dissipation.`
    }
  },

  arctic_sea_ice: {
    id: 'arctic_sea_ice',
    title: 'Arctic Sea Ice Minimum Extent Retreat (1979 - 2024)',
    mission: 'NASA SVS / NSIDC Cryospheric Satellite Altimetry',
    units: 'million square kilometers (M km²)',
    temporalResolution: 'Annual September Minimum',
    spatialResolution: 'Circumpolar Arctic Basin',
    coverage: 'Northern Polar Cryosphere',
    whatItRepresents: 'This satellite visualization documents forty-five years of polar sea ice extent in the Arctic Ocean from 1979 to 2024. Sea ice is frozen ocean water that caps the Arctic, acting as a planetary mirror reflecting incoming solar radiation back into space. The visualization illustrates how multi-year thick ice pack has diminished by over forty percent due to polar amplification and rising planetary temperatures.',
    patternsVisible: 'Visually, early years show a massive, contiguous white and cyan circular shield covering virtually the entire central Arctic basin from Greenland to the Siberian coast. As decades progress toward 2024, the brilliant white core shrinks drastically into fragmented bands, exposing vast areas of deep navy and black open water, particularly in the Beaufort, Chukchi, and Laptev seas.',
    soundRepresentation: 'The sonification maps physical and optical cryospheric properties directly into acoustic frequencies. High-albedo white ice produces bright, open sound with a high filter cutoff around seven thousand Hertz and shimmering high-register arpeggios. In contrast, dark ocean water absorbs sound energy, creating a deep sub-bass drone below one hundred Hertz and a muffled low-pass filter ceiling.',
    soundChangesOverTime: 'Over the course of the time-lapse, the acoustic environment undergoes a profound transformation. The piece opens in 1979 with a bright, crystalline chorus of airy Major Pentatonic bells and high-frequency shimmer. As the ice sheet retreats across the decades, the high-frequency harmonics gradually melt away, replaced by an increasingly dominant, heavy sub-bass drone and rhythmic ocean swells as open water replaces the reflective ice pack.',
    spokenNarrative: 'Arctic Sea Ice Minimum Retreat from 1979 to 2024. This observation tracks forty-five years of polar ice loss. Visually, a brilliant white ice pack covering seven point five million square kilometers gradually shrinks into fragmented patches, exposing dark navy ocean waters. Acoustically, the soundscape transitions from bright, crystalline high-register arpeggios representing high-albedo ice into a deep, muffled oceanic sub-bass drone as dark open water absorbs solar heat.',
    explainChange: (prevVal, newVal) => {
      if (prevVal === null || prevVal === undefined) return `Sea ice extent is ${newVal.toFixed(2)} million square kilometers.`
      const delta = newVal - prevVal
      const absDelta = Math.abs(delta).toFixed(2)
      if (delta < 0) return `Arctic sea ice contracted by ${absDelta} million square kilometers to ${newVal.toFixed(2)} million square kilometers, exposing more open ocean.`
      return `Arctic sea ice expanded by ${absDelta} million square kilometers to ${newVal.toFixed(2)} million square kilometers.`
    }
  },

  temperature_anomaly: {
    id: 'temperature_anomaly',
    title: 'Global Surface Temperature Anomaly Decade Sweep (1880 - 2024)',
    mission: 'NASA GISS GISTEMP v4 Climate Telemetry',
    units: 'anomaly degrees Celsius (°C deviation)',
    temporalResolution: 'Decadal & Annual Means',
    spatialResolution: 'Global Surface Gridded 2° × 2°',
    coverage: 'Global Land and Ocean Combined',
    whatItRepresents: 'This visualization represents global surface temperature anomalies from 1880 to 2024 compiled by the NASA Goddard Institute for Space Studies. An anomaly measures how much warmer or cooler each geographical region was compared to the mid-twentieth century baseline average of fourteen degrees Celsius.',
    patternsVisible: 'The visual map uses a chromatic temperature colormap. From 1880 through the 1930s, the globe is dominated by cool blue, cyan, and neutral gray tones indicating cooler conditions. Beginning in the late twentieth century and accelerating into the 2020s, intense amber, orange, and deep crimson red warming anomalies spread rapidly across continents, with the northern polar regions exhibiting extreme localized warming known as Arctic amplification.',
    soundRepresentation: 'Dominant colors dictate the fundamental musical pitch and warmth. Cool blue anomalies map to low-register Dorian and Lydian modal chords. As regions warm into amber and red, the root pitch ascends the chromatic circle toward intense Phrygian dominant harmonies, while harmonic warmth and filter resonance increase.',
    soundChangesOverTime: 'The sonification begins with calm, cool, meditative blue chords with gentle harmonic movement. As the decades advance toward 2024, the harmony progressively shifts into fiery, high-energy Phrygian Dominant intervals with intense pulse-width modulation and soaring overtones that convey accelerated thermodynamic energy across the planetary surface.',
    spokenNarrative: 'Global Surface Temperature Anomaly Decade Sweep from 1880 to 2024. Compiling NASA GISTEMP telemetry, this record tracks deviations from baseline planetary temperatures. Visually, cool blue bands in the early twentieth century give way to pervasive crimson and amber warming anomalies across all continents. Acoustically, serene cool modal chords progressively ascend and intensify into complex, resonant harmonies as planetary heat content climbs.',
    explainChange: (prevVal, newVal) => {
      if (prevVal === null || prevVal === undefined) return `Temperature anomaly is ${newVal >= 0 ? '+' : ''}${newVal.toFixed(2)} degrees Celsius.`
      const delta = newVal - prevVal
      const absDelta = Math.abs(delta).toFixed(2)
      if (delta > 0) return `Planetary temperature anomaly escalated by ${absDelta} degrees to positive ${newVal.toFixed(2)} degrees Celsius above baseline.`
      return `Planetary anomaly decreased by ${absDelta} degrees to ${newVal.toFixed(2)} degrees Celsius.`
    }
  },

  amazon_phenology: {
    id: 'amazon_phenology',
    title: 'Amazon Rainforest Seasonal Phenology & Drought Cycle',
    mission: 'NASA Terra / Aqua MODIS (NDVI Vegetation Index)',
    units: 'Normalized Difference Index (-0.2 to +1.0)',
    temporalResolution: 'Monthly 12-Month Cycle',
    spatialResolution: '500m Surface Reflectance',
    coverage: 'Amazon River Basin, South America',
    whatItRepresents: 'This visualization depicts the annual seasonal heartbeat of the Amazon Rainforest basin over twelve months using the Normalized Difference Vegetation Index. NDVI tracks photosynthetic chlorophyll activity and canopy moisture across the largest tropical rainforest on Earth.',
    patternsVisible: 'During the wet season, the visual frame is saturated with vibrant emerald and deep forest green across the entire basin, interrupted only by winding dark river tributaries. During the dry season, the green canopy visibly browns into ochre and khaki hues, and fine fishbone lines emerge along forest edges, showing logging roads and fire clearings.',
    soundRepresentation: 'Photosynthetic greenness controls harmonic richness and master gain. Complex topological edges—such as branching river channels, deforested borders, and logging access roads—dictate rhythmic subdivisions. Smooth intact canopy produces meditative quarter-notes, while fractured edges trigger rapid, syncopated sixteenth-note arpeggiations.',
    soundChangesOverTime: 'The composition breathes in an organic twelve-month cycle. It opens with rich, deep Major Pentatonic forest pads during the wet flush. As the dry season arrives, the timbre dries out into warm ochre overtones, and the rhythmic arpeggiator suddenly accelerates into dense, syncopated pulses as deforestation scars and fire edges fracture the topological landscape.',
    spokenNarrative: 'Amazon Rainforest Seasonal Phenology Cycle over twelve months. Sourced from NASA MODIS NDVI vegetation telemetry. Visually, lush emerald canopy coverage during the wet season oscillates into dry ochre hues and fractured road scars during the dry season. Acoustically, calm organic forest pads accelerate into syncopated, polyrhythmic sixteenth-note pulses as forest edge complexity increases.',
    explainChange: (prevVal, newVal) => {
      if (prevVal === null || prevVal === undefined) return `Rainforest NDVI is ${newVal.toFixed(2)}.`
      const delta = newVal - prevVal
      if (delta > 0) return `Canopy foliage regenerated by ${Math.abs(delta).toFixed(2)} points to ${newVal.toFixed(2)}.`
      return `Rainforest canopy browned by ${Math.abs(delta).toFixed(2)} points to ${newVal.toFixed(2)} during dry period.`
    }
  },

  el_nino_sst: {
    id: 'el_nino_sst',
    title: 'Pacific El Niño Thermal Warm Pool Migration',
    mission: 'NOAA / NASA OISST Satellite Telemetry',
    units: 'degrees Celsius (°C)',
    temporalResolution: 'Weekly Telemetry',
    spatialResolution: 'Equatorial Pacific Ocean Basin',
    coverage: 'Tropical Pacific (120°E to 70°W)',
    whatItRepresents: 'This observation illustrates the eastward migration of equatorial Pacific warm water during a major El Niño Southern Oscillation event. It demonstrates how ocean-atmosphere coupling alters global precipitation and storm tracks across the world.',
    patternsVisible: 'A vast thermal tongue of amber, yellow, and red sea surface temperatures surges across the open Pacific Ocean from the maritime coast of Indonesia all the way to the Galapagos Islands and the coast of Peru, displacing normally cool upwelling waters.',
    soundRepresentation: 'The horizontal spatial centroid of the thermal warm pool is directly coupled to stereo panning. When the warm pool is in the western Pacific, sound emanates predominantly from the left channel; as it sweeps across the basin, the sound glides seamlessly to the right channel.',
    soundChangesOverTime: 'Playback features a distinct spatial traversal. The warm ocean pad begins positioned hard left. As the Kelvin wave surges east, the entire acoustic mass migrates across the listener’s stereo headphone field from left to right, accompanied by swelling tidal noise filters representing kinetic current velocity.',
    spokenNarrative: 'Pacific El Niño Thermal Warm Pool Migration. Sourced from NOAA and NASA satellite sea surface temperature telemetry. Visually, an intense amber thermal plume sweeps from the western Pacific to the South American coast. Acoustically, the soundscape glides across the stereo field from left to right in exact synchrony with the ocean warm pool.',
    explainChange: (prevVal, newVal) => {
      if (prevVal === null || prevVal === undefined) return `Pacific SST is ${newVal.toFixed(1)} degrees Celsius.`
      const delta = newVal - prevVal
      if (delta > 0) return `Equatorial Pacific warm pool intensified by ${Math.abs(delta).toFixed(1)} degrees to ${newVal.toFixed(1)} degrees Celsius.`
      return `Warm pool dissipated by ${Math.abs(delta).toFixed(1)} degrees to ${newVal.toFixed(1)} degrees Celsius.`
    }
  }
};
