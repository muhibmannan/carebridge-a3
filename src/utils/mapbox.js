
const ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN

const SEARCH_ENDPOINT = 'https://api.mapbox.com/search/searchbox/v1/forward'
const DIRECTIONS_ENDPOINT = 'https://api.mapbox.com/directions/v5/mapbox'

export const DEFAULT_ORIGIN = Object.freeze({
  lng: 144.9631,
  lat: -37.8136,
  label: 'Melbourne CBD',
})

export const SERVICE_CATEGORIES = Object.freeze([
  { id: 'all', label: 'All', query: 'disability support service', available: true },
  { id: 'coordination', label: 'Support Coordination', query: 'NDIS support coordination', available: true },
  { id: 'allied-health', label: 'Allied Health', query: 'physiotherapy clinic', available: true },
  { id: 'home-mods', label: 'Home Modifications', query: 'accessible home modifications', available: true },
  { id: 'transport', label: 'Transport Assistance', query: 'community transport service', available: true },
  { id: 'assistive-tech', label: 'Assistive Technology', query: 'mobility equipment supplier', available: true },
  { id: 'employment', label: 'Employment Support', query: 'disability employment services', available: false },
])

function requireToken() {
  if (!ACCESS_TOKEN) {
    throw new Error(
      'Mapbox access token is missing. Add VITE_MAPBOX_TOKEN to .env.local and restart the dev server.',
    )
  }
  return ACCESS_TOKEN
}

function toService(feature) {
  const coordinates = feature?.geometry?.coordinates
  if (!Array.isArray(coordinates) || coordinates.length < 2) return null

  const props = feature.properties ?? {}
  return {
    id: props.mapbox_id ?? `${coordinates[0]},${coordinates[1]}`,
    name: props.name ?? 'Unnamed service',
    address: props.full_address ?? props.place_formatted ?? '',
    category: Array.isArray(props.poi_category) && props.poi_category.length
      ? props.poi_category[0]
      : '',
    lng: coordinates[0],
    lat: coordinates[1],
    distanceMetres: typeof props.distance === 'number' ? props.distance : null,
  }
}

export async function searchServices(query, origin, { limit = 8, signal } = {}) {
  const params = new URLSearchParams({
    q: query,
    access_token: requireToken(),
    proximity: `${origin.lng},${origin.lat}`,
    country: 'au',
    types: 'poi',
    language: 'en',
    limit: String(limit),
  })

  const response = await fetch(`${SEARCH_ENDPOINT}?${params}`, { signal })
  if (!response.ok) {
    throw new Error(`Search failed (${response.status}). Please try again.`)
  }

  const data = await response.json()
  return (data.features ?? []).map(toService).filter(Boolean)
}

export async function getRoute(origin, destination, profile = 'driving') {
  const coordinates = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`
  const params = new URLSearchParams({
    access_token: requireToken(),
    geometries: 'geojson',
    overview: 'full',
    alternatives: 'false',
  })

  const response = await fetch(`${DIRECTIONS_ENDPOINT}/${profile}/${coordinates}?${params}`)
  if (!response.ok) {
    throw new Error(`Directions request failed (${response.status}).`)
  }

  const data = await response.json()
  const route = data.routes?.[0]
  if (!route) {
    throw new Error('No route could be found between those two points.')
  }

  return {
    distanceMetres: route.distance,
    durationSeconds: route.duration,
    geometry: route.geometry,
    profile,
  }
}

export function getUserLocation({ timeout = 8000 } = {}) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('This browser does not support location sharing.'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({
        lng: position.coords.longitude,
        lat: position.coords.latitude,
        label: 'Your location',
      }),
      () => reject(new Error('Location access was denied or unavailable.')),
      { timeout, enableHighAccuracy: false, maximumAge: 300000 },
    )
  })
}

export function formatDistance(metres) {
  if (metres == null) return ''
  return metres < 1000 ? `${Math.round(metres)} m` : `${(metres / 1000).toFixed(1)} km`
}

export function formatDuration(seconds) {
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  return remainder ? `${hours} hr ${remainder} min` : `${hours} hr`
}