<script setup>
import { computed, onMounted, ref } from 'vue'
import ServiceMap from '@/components/map/ServiceMap.vue'
import {
  DEFAULT_ORIGIN,
  SERVICE_CATEGORIES,
  formatDistance,
  formatDuration,
  getRoute,
  getUserLocation,
  searchServices,
} from '@/utils/mapbox.js'

const origin = ref({ ...DEFAULT_ORIGIN })
const query = ref('')
const activeCategory = ref('all')
const results = ref([])
const selectedId = ref(null)
const route = ref(null)
const profile = ref('driving')

const searching = ref(false)
const routing = ref(false)
const locating = ref(false)
const searchError = ref('')
const routeError = ref('')

const selectedService = computed(
  () => results.value.find((service) => service.id === selectedId.value) ?? null,
)

const statusMessage = computed(() => {
  if (searching.value) return 'Searching for services…'
  if (searchError.value) return ''
  if (!results.value.length) return `No services found near ${origin.value.label}.`
  const count = results.value.length
  return `${count} ${count === 1 ? 'service' : 'services'} found near ${origin.value.label}.`
})

function resetRoute() {
  route.value = null
  routeError.value = ''
}

async function runSearch(searchText) {
  searching.value = true
  searchError.value = ''
  selectedId.value = null
  resetRoute()

  try {
    results.value = await searchServices(searchText, origin.value)
  } catch (error) {
    results.value = []
    searchError.value = error.message
  } finally {
    searching.value = false
  }
}

function submitSearch() {
  const text = query.value.trim()
  if (!text) return
  activeCategory.value = null
  runSearch(text)
}

function selectCategory(category) {
  if (!category.available) return
  activeCategory.value = category.id
  query.value = ''
  runSearch(category.query)
}

async function useMyLocation() {
  locating.value = true
  searchError.value = ''
  try {
    origin.value = await getUserLocation()
    const category = SERVICE_CATEGORIES.find((item) => item.id === activeCategory.value)
    await runSearch(query.value.trim() || category?.query || SERVICE_CATEGORIES[0].query)
  } catch (error) {
    searchError.value = error.message
  } finally {
    locating.value = false
  }
}

async function showDirections(service) {
  selectedId.value = service.id
  routing.value = true
  routeError.value = ''
  try {
    route.value = await getRoute(origin.value, service, profile.value)
  } catch (error) {
    route.value = null
    routeError.value = error.message
  } finally {
    routing.value = false
  }
}

function changeProfile(next) {
  profile.value = next
  if (selectedService.value) showDirections(selectedService.value)
}

onMounted(() => {
  runSearch(SERVICE_CATEGORIES[0].query)
})
</script>

<template>
  <div class="container map-view">
    <header class="page-header">
      <h1 class="page-title">Services near you</h1>
      <p class="page-subtitle">
        Find disability support services close to you and get directions
      </p>
    </header>

    <div class="filter-row" role="group" aria-label="Service categories">
      <button
        v-for="category in SERVICE_CATEGORIES"
        :key="category.id"
        type="button"
        class="filter-pill"
        :class="{ 'filter-pill--active': activeCategory === category.id }"
        :disabled="!category.available"
        :aria-pressed="activeCategory === category.id"
        @click="selectCategory(category)"
      >
        {{ category.label }}
        <span v-if="!category.available" class="pill-note">Coming soon</span>
      </button>
    </div>

    <div class="row g-4">
      <div class="col-12 col-lg-5">
        <section class="panel" aria-labelledby="results-heading">
          <h2 id="results-heading" class="panel-title">Search results</h2>

          <form class="search-form" @submit.prevent="submitSearch">
            <label for="service-search" class="visually-hidden">
              Search for a support service
            </label>
            <input
              id="service-search"
              v-model="query"
              type="search"
              class="search-input"
              placeholder="Search services..."
              autocomplete="off"
            />
            <button type="submit" class="btn-primary-cb" :disabled="searching">
              Search
            </button>
          </form>

          <div class="origin-row">
            <p class="origin-label">
              Searching near <strong>{{ origin.label }}</strong>
            </p>
            <button
              type="button"
              class="btn-link-cb"
              :disabled="locating"
              @click="useMyLocation"
            >
              {{ locating ? 'Locating…' : 'Use my location' }}
            </button>
          </div>

          <p class="status-line" role="status" aria-live="polite">
            {{ statusMessage }}
          </p>

          <p v-if="searchError" class="error-text" role="alert">
            <span aria-hidden="true">⚠ </span>{{ searchError }}
          </p>

          <ul v-if="results.length" class="result-list">
            <li v-for="service in results" :key="service.id">
              <article
                class="service-card"
                :class="{ 'service-card--selected': service.id === selectedId }"
              >
                <h3 class="service-name">{{ service.name }}</h3>
                <p v-if="service.address" class="service-address">{{ service.address }}</p>
                <p v-if="service.distanceMetres != null" class="service-distance">
                  {{ formatDistance(service.distanceMetres) }} away
                </p>
                <button
                  type="button"
                  class="btn-link-cb"
                  :aria-label="`Get directions to ${service.name}`"
                  @click="showDirections(service)"
                >
                  Get directions →
                </button>
              </article>
            </li>
          </ul>
        </section>
      </div>

      <div class="col-12 col-lg-7">
        <section class="panel" aria-labelledby="map-heading">
          <h2 id="map-heading" class="panel-title">Map</h2>
          <p class="visually-hidden">
            This map shows the same services listed under "Search results".
            All information on the map is available as text in that list.
          </p>
          <ServiceMap
            :origin="origin"
            :results="results"
            :selected-id="selectedId"
            :route-geometry="route?.geometry ?? null"
            @select="selectedId = $event"
          />
        </section>

        <section class="panel mt-4" aria-labelledby="route-heading">
          <h2 id="route-heading" class="panel-title">Directions</h2>

          <div class="profile-row" role="group" aria-label="Travel mode">
            <button
              v-for="mode in ['driving', 'walking']"
              :key="mode"
              type="button"
              class="filter-pill"
              :class="{ 'filter-pill--active': profile === mode }"
              :aria-pressed="profile === mode"
              @click="changeProfile(mode)"
            >
              {{ mode === 'driving' ? 'Driving' : 'Walking' }}
            </button>
          </div>

          <p v-if="routeError" class="error-text" role="alert">
            <span aria-hidden="true">⚠ </span>{{ routeError }}
          </p>

          <p v-else-if="!selectedService" class="status-line">
            Choose "Get directions" on a service to see the route, distance and travel time.
          </p>

          <div v-else class="route-summary" aria-live="polite">
            <p class="route-legs">
              <strong>{{ origin.label }}</strong> → <strong>{{ selectedService.name }}</strong>
            </p>
            <p v-if="routing" class="status-line">Calculating route…</p>
            <dl v-else-if="route" class="route-stats">
              <div>
                <dt>Distance</dt>
                <dd>{{ formatDistance(route.distanceMetres) }}</dd>
              </div>
              <div>
                <dt>Travel time</dt>
                <dd>{{ formatDuration(route.durationSeconds) }}</dd>
              </div>
            </dl>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>

.map-view {
  padding-block: 2rem;
}

.page-title {
  font-family: 'Poppins', sans-serif;
  font-weight: 700;
  font-size: 2rem;
  color: #101828;
  margin-bottom: 0.25rem;
}

.page-subtitle {
  color: #6A7282;
  margin-bottom: 1.5rem;
}

.filter-row,
.profile-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.filter-pill {
  border: 1px solid #E5E7EB;
  background-color: #FFFFFF;
  color: #4A5565;
  border-radius: 999px;
  padding: 0.5rem 1rem;
  font-size: 0.9375rem;
}

.filter-pill:hover:not(:disabled) {
  background-color: #F3F4F6;
}

.filter-pill--active {
  background-color: #1A65CF;
  border-color: #1A65CF;
  color: #FFFFFF;
}

.filter-pill:disabled {
  color: #99A1AF;
  cursor: not-allowed;
}

.filter-pill:focus-visible,
.btn-primary-cb:focus-visible,
.btn-link-cb:focus-visible,
.search-input:focus-visible {
  outline: 3px solid #1447E6;
  outline-offset: 2px;
}

.pill-note {
  display: block;
  font-size: 0.75rem;
  color: #973C00;
}

.panel {
  background-color: #FFFFFF;
  border: 1px solid #E5E7EB;
  border-radius: 0.75rem;
  padding: 1.5rem;
}

.panel-title {
  font-family: 'Poppins', sans-serif;
  font-weight: 600;
  font-size: 1.125rem;
  color: #101828;
  margin-bottom: 1rem;
}

.search-form {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.search-input {
  flex: 1 1 auto;
  min-width: 0;
  border: 1px solid #E5E7EB;
  border-radius: 0.75rem;
  padding: 0.625rem 0.875rem;
  color: #101828;
  background-color: #F8FAFC;
}

.search-input::placeholder {
  color: #99A1AF;
}

.btn-primary-cb {
  background-color: #1A65CF;
  color: #FFFFFF;
  border: none;
  border-radius: 0.75rem;
  padding: 0.625rem 1.25rem;
  font-weight: 600;
}

.btn-primary-cb:hover:not(:disabled) {
  background-color: #1557B0;
}

.btn-primary-cb:disabled {
  opacity: 0.65;
}

.btn-link-cb {
  background: none;
  border: none;
  padding: 0;
  color: #1447E6;
  font-weight: 600;
  font-size: 0.9375rem;
}

.origin-row {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.origin-label {
  color: #4A5565;
  margin: 0;
}

.status-line {
  color: #6A7282;
  font-size: 0.9375rem;
  margin-bottom: 1rem;
}

.error-text {
  color: #B91C1C;
  font-size: 0.9375rem;
  margin-bottom: 1rem;
}

.result-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.75rem;
  max-height: 30rem;
  overflow-y: auto;
}

.service-card {
  border: 1px solid #E5E7EB;
  border-radius: 0.75rem;
  padding: 1rem;
  background-color: #FFFFFF;
}

.service-card--selected {
  border-color: #2F80ED;
  background-color: #EBF4FD;
}

.service-name {
  font-family: 'Poppins', sans-serif;
  font-weight: 600;
  font-size: 1rem;
  color: #101828;
  margin-bottom: 0.25rem;
}

.service-address {
  color: #6A7282;
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
}

.service-distance {
  color: #007A55;
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.route-legs {
  color: #101828;
  margin-bottom: 0.75rem;
}

.route-stats {
  display: flex;
  gap: 2rem;
  margin: 0;
}

.route-stats dt {
  color: #6A7282;
  font-size: 0.875rem;
  font-weight: 400;
}

.route-stats dd {
  font-family: 'Poppins', sans-serif;
  font-size: 1.25rem;
  font-weight: 600;
  color: #101828;
  margin: 0;
}
</style>