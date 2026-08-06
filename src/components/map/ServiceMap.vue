<script setup>
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

const props = defineProps({
  origin: { type: Object, required: true },
  results: { type: Array, default: () => [] },
  selectedId: { type: String, default: null },
  routeGeometry: { type: Object, default: null },
})

const emit = defineEmits(['select'])

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN

const container = ref(null)
let map = null
let markers = []
let originMarker = null
let ready = false

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const flyDuration = reduceMotion ? 0 : 600

const EMPTY_GEOJSON = { type: 'FeatureCollection', features: [] }

function clearMarkers() {
  markers.forEach((marker) => marker.remove())
  markers = []
}

function renderOrigin() {
  if (!ready) return
  originMarker?.remove()
  const element = document.createElement('span')
  element.className = 'cb-marker cb-marker--origin'
  element.setAttribute('aria-hidden', 'true')
  originMarker = new mapboxgl.Marker({ element })
    .setLngLat([props.origin.lng, props.origin.lat])
    .addTo(map)
}

function renderMarkers() {
  if (!ready) return
  clearMarkers()

  props.results.forEach((service) => {
    const element = document.createElement('span')
    element.className = service.id === props.selectedId
      ? 'cb-marker cb-marker--selected'
      : 'cb-marker'
    element.setAttribute('aria-hidden', 'true')
    element.addEventListener('click', () => emit('select', service.id))

    markers.push(
      new mapboxgl.Marker({ element })
        .setLngLat([service.lng, service.lat])
        .addTo(map),
    )
  })

  fitToResults()
}

function fitToResults() {
  if (!ready) return
  if (!props.results.length) {
    map.easeTo({ center: [props.origin.lng, props.origin.lat], zoom: 12, duration: flyDuration })
    return
  }
  const bounds = new mapboxgl.LngLatBounds()
  bounds.extend([props.origin.lng, props.origin.lat])
  props.results.forEach((service) => bounds.extend([service.lng, service.lat]))
  map.fitBounds(bounds, { padding: 56, maxZoom: 15, duration: flyDuration })
}

function renderRoute() {
  if (!ready) return
  const source = map.getSource('route')
  if (!source) return

  if (!props.routeGeometry) {
    source.setData(EMPTY_GEOJSON)
    return
  }

  source.setData({ type: 'Feature', properties: {}, geometry: props.routeGeometry })

  const bounds = props.routeGeometry.coordinates.reduce(
    (acc, coord) => acc.extend(coord),
    new mapboxgl.LngLatBounds(
      props.routeGeometry.coordinates[0],
      props.routeGeometry.coordinates[0],
    ),
  )
  map.fitBounds(bounds, { padding: 64, duration: flyDuration })
}

onMounted(() => {
  map = new mapboxgl.Map({
    container: container.value,
    style: 'mapbox://styles/mapbox/streets-v12',
    center: [props.origin.lng, props.origin.lat],
    zoom: 12,
  })

  map.addControl(new mapboxgl.NavigationControl(), 'top-right')

  map.on('load', () => {
    map.addSource('route', { type: 'geojson', data: EMPTY_GEOJSON })
    map.addLayer({
      id: 'route-line',
      type: 'line',
      source: 'route',
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': '#2F80ED', 'line-width': 5, 'line-opacity': 0.85 },
    })
    ready = true
    renderOrigin()
    renderMarkers()
    renderRoute()
  })
})

onBeforeUnmount(() => {
  clearMarkers()
  originMarker?.remove()
  map?.remove()
})

watch(() => props.origin, renderOrigin, { deep: true })
watch(() => props.results, renderMarkers, { deep: true })
watch(() => props.selectedId, renderMarkers)
watch(() => props.routeGeometry, renderRoute)
</script>

<template>
  <div
    ref="container"
    class="service-map"
    role="region"
    aria-label="Map of nearby support services"
  ></div>
</template>

<style scoped>
.service-map {
  height: 32rem;
  min-height: 20rem;
  border-radius: 0.75rem;
  overflow: hidden;
  background-color: #F3F4F6;
}

@media (max-width: 767.98px) {
  .service-map {
    height: 22rem;
  }
}
</style>

<style>
.cb-marker {
  display: block;
  width: 1rem;
  height: 1rem;
  border-radius: 50%;
  background-color: #2F80ED;
  border: 2px solid #FFFFFF;
  box-shadow: 0 1px 4px rgb(16 24 40 / 35%);
  cursor: pointer;
}

.cb-marker--selected {
  width: 1.375rem;
  height: 1.375rem;
  background-color: #1447E6;
  border-width: 3px;
}

.cb-marker--origin {
  background-color: #27AE60;
  cursor: default;
}
</style>