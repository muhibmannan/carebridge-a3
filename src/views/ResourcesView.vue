<script setup>
import { onMounted, computed } from "vue";
import { useResourcesStore } from "@/stores/resources";
import StarRating from "@/components/common/StarRating.vue";

const store = useResourcesStore();
onMounted(store.fetchAll);

const badgeStyle = {
  PDF: { bg: "#EBF4FD", text: "#1447E6" },
  Guide: { bg: "#ECFDF5", text: "#007A55" },
  Article: { bg: "#F3F4F6", text: "#4A5565" },
  Directory: { bg: "#FAF5FF", text: "#8200DB" },
};
function styleFor(type) {
  const s = badgeStyle[type] || badgeStyle.Article;
  return { backgroundColor: s.bg, color: s.text };
}

const subtitle = computed(() => {
  const total = store.items.length;
  const cats = store.categories.length - 1;
  return `${total} resource${total === 1 ? "" : "s"} across ${cats} categor${cats === 1 ? "y" : "ies"}`;
});
</script>

<template>
  <main id="main-content" class="resources-page py-4">
    <div class="container">
      <h1 class="page-title">Resources</h1>
      <p class="page-subtitle">{{ subtitle }}</p>

      <div
        class="d-flex justify-content-between align-items-center gap-3 flex-wrap mb-3"
      >
        <div class="category-pills" 
        role="group" 
        aria-label="Filter resources by category"
        >
          <button
            v-for="cat in store.categories"
            :key="cat"
            type="button"
            class="pill"
            :class="{ 'pill--active': store.activeCategory === cat }"
            :aria-pressed="store.activeCategory === cat"
            @click="store.activeCategory = cat"
          >
            {{ cat }}
          </button>
        </div>
        <label class="search-box">
          <span class="visually-hidden">Search resources</span>
          <input
            v-model="store.searchQuery"
            type="search"
            placeholder="Search resources..."
          />
        </label>
      </div>

      <div v-if="store.loading" class="text-center py-5" role="status">
        Loading resources…
      </div>
      <div v-else-if="store.error" class="alert alert-danger" role="alert">
        {{ store.error }}
      </div>

      <template v-else>
        <section
          v-if="
            store.featured.length &&
            store.activeCategory === 'All' &&
            !store.searchQuery
          "
          class="mb-4"
        >
          <h2 class="section-title">Featured Resources</h2>
          <div class="row g-3">
            <div v-for="r in store.featured" :key="r.id" class="col-md-6">
              <RouterLink :to="`/resources/${r.id}`" class="featured-card">
                <span class="featured-star" aria-hidden="true">★</span>
                <div>
                  <h3>{{ r.title }}</h3>
                  <p>{{ r.description }}</p>
                  <div class="d-flex align-items-center gap-2 flex-wrap">
                    <StarRating
                      readonly
                      :average="r.ratingAvg"
                      :count="r.ratingCount"
                    />
                    <span class="category-tag">{{ r.category }}</span>
                  </div>
                </div>
              </RouterLink>
            </div>
          </div>
        </section>

        <section>
          <h2 class="section-title">
            All Resources ({{ store.filtered.length }})
          </h2>
          <p v-if="!store.filtered.length" class="text-muted">
            No resources match your search.
          </p>
          <div v-else class="row g-3">
            <div v-for="r in store.filtered" :key="r.id" class="col-md-4">
              <article class="resource-card">
                <div class="d-flex justify-content-between align-items-start">
                  <span class="type-badge" :style="styleFor(r.type)">{{
                    r.type
                  }}</span>
                  <button
                    type="button"
                    class="save-btn"
                    :aria-pressed="store.isSaved(r.id)"
                    :aria-label="
                      store.isSaved(r.id)
                        ? `Remove ${r.title} from saved resources`
                        : `Save ${r.title}`
                    "
                    @click="store.toggleSaved(r.id)"
                  >
                    {{ store.isSaved(r.id) ? "★" : "☆" }}
                  </button>
                </div>
                <h3>
                  <RouterLink :to="`/resources/${r.id}`">{{
                    r.title
                  }}</RouterLink>
                </h3>
                <p class="description">{{ r.description }}</p>
                <StarRating
                  readonly
                  :average="r.ratingAvg"
                  :count="r.ratingCount"
                />
                <div
                  class="d-flex justify-content-between align-items-center mt-2"
                >
                  <RouterLink
                    :to="`/resources?category=${r.category}`"
                    class="category-tag"
                    @click.prevent="store.activeCategory = r.category"
                  >
                    {{ r.category }}
                  </RouterLink>
                  <a
                    :href="r.url"
                    target="_blank"
                    rel="noopener"
                    class="download-link"
                    >Visit ↗</a
                  >
                </div>
              </article>
            </div>
          </div>
        </section>
      </template>
    </div>
  </main>
</template>

<style scoped>
.page-title {
  font-family: "Poppins", sans-serif;
  font-weight: 700;
  color: #101828;
}
.page-subtitle {
  color: #6a7282;
  margin-bottom: 1.5rem;
}
.section-title {
  font-family: "Poppins", sans-serif;
  font-weight: 600;
  font-size: 1.25rem;
  color: #101828;
  margin-bottom: 1rem;
}

.category-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.pill {
  border: 1px solid #e5e7eb;
  background: #ffffff;
  color: #4a5565;
  border-radius: 999px;
  padding: 0.4rem 1rem;
  font-size: 0.875rem;
  cursor: pointer;
}
.pill--active {
  background: #1a65cf;
  border-color: #1a65cf;
  color: #ffffff;
}
.pill:focus-visible {
  outline: 2px solid #2f80ed;
  outline-offset: 2px;
}

.search-box input {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 0.5rem 1rem;
  min-width: 260px;
  background: #f9fafb;
}

.featured-card {
  display: flex;
  gap: 1rem;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.25rem;
  text-decoration: none;
  color: inherit;
  height: 100%;
}
.featured-star {
  color: #2f80ed;
  font-size: 1.5rem;
}
.featured-card h3 {
  font-family: "Poppins", sans-serif;
  color: #101828;
  font-size: 1.05rem;
  margin-bottom: 0.25rem;
}
.featured-card p {
  color: #4a5565;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.resource-card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.25rem;
  height: 100%;
  display: flex;
  flex-direction: column;
}
.resource-card h3 {
  font-size: 1rem;
  font-family: "Poppins", sans-serif;
  margin: 0.5rem 0 0.25rem;
}
.resource-card h3 a {
  color: #101828;
  text-decoration: none;
}
.resource-card h3 a:hover {
  color: #1447e6;
}
.description {
  color: #4a5565;
  font-size: 0.875rem;
  flex-grow: 1;
}

.type-badge {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
}
.save-btn {
  background: none;
  border: none;
  font-size: 1.25rem;
  color: #99a1af;
  cursor: pointer;
  line-height: 1;
}
.save-btn[aria-pressed="true"] {
  color: #2f80ed;
}
.save-btn:focus-visible {
  outline: 2px solid #2f80ed;
  outline-offset: 2px;
}

.category-tag {
  color: #1447e6;
  font-size: 0.875rem;
  text-decoration: none;
  font-weight: 500;
}
.category-tag:hover {
  text-decoration: underline;
}
.download-link {
  color: #4a5565;
  font-size: 0.875rem;
  text-decoration: none;
}
.download-link:hover {
  color: #1447e6;
}
</style>
