/**
 * NASA Earth Information Jukebox — State Sharing & Reproducibility Service
 * 2026 NASA Space Apps Challenge
 * 
 * Supports:
 * 1. Compact URL hash and query serialization
 * 2. URL deserialization on mount
 * 3. 1-click clipboard sharing
 * 4. Reproducible exploration configuration export and import (JSON bundle)
 */

export const SHARE_MODES = {
  EXPLORE: 'explore',
  COMPARE_LOCATION: 'compare_location',
  COMPARE_DATASET: 'compare_dataset',
  JOURNEY: 'journey',
  TIMEMACHINE: 'timemachine'
}

/**
 * Serializes an exploration state into a shareable URL string.
 */
export function serializeExplorationUrl(state) {
  const params = new URLSearchParams()

  if (state.mode) params.set('mode', state.mode)
  if (state.locationId) params.set('loc', state.locationId)
  if (state.comparisonLocationId) params.set('compLoc', state.comparisonLocationId)
  if (state.datasetId) params.set('ds', state.datasetId)
  if (state.comparisonDatasetId) params.set('compDs', state.comparisonDatasetId)
  if (state.presetId) params.set('preset', state.presetId)
  if (state.date) params.set('date', state.date)
  if (state.speed) params.set('spd', state.speed.toString())
  if (state.journeyId) params.set('jrn', state.journeyId)
  if (state.waypointIdx !== undefined) params.set('wp', state.waypointIdx.toString())

  const baseUrl = window.location.origin + window.location.pathname
  const hashTarget = state.viewRoute || (state.mode === 'compare_location' || state.mode === 'compare_dataset' ? 'compare' : state.mode === 'journey' ? 'journey' : 'explore')

  return `${baseUrl}#${hashTarget}?${params.toString()}`
}

/**
 * Parses URL query parameters from the browser's current hash or search.
 */
export function deserializeExplorationUrl() {
  const hash = window.location.hash || ''
  const queryIndex = hash.indexOf('?')
  
  if (queryIndex === -1 && !window.location.search) {
    return null
  }

  const queryString = queryIndex !== -1 ? hash.slice(queryIndex + 1) : window.location.search.slice(1)
  const params = new URLSearchParams(queryString)

  return {
    mode: params.get('mode') || null,
    locationId: params.get('loc') || null,
    comparisonLocationId: params.get('compLoc') || null,
    datasetId: params.get('ds') || null,
    comparisonDatasetId: params.get('compDs') || null,
    presetId: params.get('preset') || null,
    date: params.get('date') || null,
    speed: params.get('spd') ? parseFloat(params.get('spd')) : null,
    journeyId: params.get('jrn') || null,
    waypointIdx: params.get('wp') ? parseInt(params.get('wp'), 10) : null
  }
}

/**
 * Copies the shareable URL to the system clipboard.
 */
export async function copyShareableLink(state) {
  const shareUrl = serializeExplorationUrl(state)
  if (navigator.clipboard && navigator.clipboard.writeText) {
    await navigator.clipboard.writeText(shareUrl)
    return { success: true, url: shareUrl }
  }
  return { success: false, url: shareUrl }
}

/**
 * Exports a full reproducible exploration configuration JSON bundle.
 */
export function exportExplorationBundle(state) {
  const bundle = {
    version: '1.0.0',
    platform: 'NASA Earth Information Jukebox',
    timestamp: new Date().toISOString(),
    configuration: {
      mode: state.mode || 'explore',
      primaryLocation: state.location || { id: state.locationId },
      comparisonLocation: state.comparisonLocation || (state.comparisonLocationId ? { id: state.comparisonLocationId } : null),
      primaryDataset: state.dataset || { id: state.datasetId },
      comparisonDataset: state.comparisonDataset || (state.comparisonDatasetId ? { id: state.comparisonDatasetId } : null),
      sonificationPreset: state.presetId || 'scientific_analytic',
      playbackSpeed: state.speed || 1.0,
      activeDate: state.date || null,
      notes: state.notes || 'Reproducible scientific exploration bundle.'
    }
  }

  const jsonString = JSON.stringify(bundle, null, 2)
  const blob = new Blob([jsonString], { type: 'application/json' })
  const filename = `earth_jukebox_config_${state.locationId || 'global'}_${state.datasetId || 'data'}.json`

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)

  return bundle
}

/**
 * Validates and parses an imported reproducible exploration configuration JSON bundle.
 */
export function parseImportedBundle(jsonString) {
  try {
    const parsed = JSON.parse(jsonString)
    if (!parsed.configuration) {
      throw new Error('Invalid bundle format: Missing configuration block.')
    }
    return {
      isValid: true,
      config: parsed.configuration,
      metadata: {
        version: parsed.version,
        timestamp: parsed.timestamp
      }
    }
  } catch (err) {
    return {
      isValid: false,
      error: err.message
    }
  }
}
