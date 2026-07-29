<script setup>
import { ref, onMounted } from "vue";
import { useRoute, RouterLink } from "vue-router";
import { useResourcesStore } from "@/stores/resources";
import { useAuthStore } from "@/stores/auth";
import StarRating from "@/components/common/StarRating.vue";

const route = useRoute();
const store = useResourcesStore();
const authStore = useAuthStore();

const resource = ref(null);
const myRating = ref(0);
const loading = ref(true);
const notFound = ref(false);
const submitting = ref(false);
const feedback = ref("");

async function load() {
  loading.value = true;
  resource.value = await store.fetchOne(route.params.id);
  notFound.value = !resource.value;
  if (authStore.isAuthenticated && resource.value) {
    myRating.value = (await store.getMyRating(resource.value.id)) ?? 0;
  }
  loading.value = false;
}
onMounted(load);

async function submitRating(score) {
  submitting.value = true;
  feedback.value = "";
  try {
    await store.rateResource(resource.value.id, score);
    myRating.value = score;
    resource.value = await store.fetchOne(resource.value.id);
    feedback.value = "Thanks — your rating has been saved.";
  } catch (err) {
    feedback.value = "Could not save your rating. Please try again.";
    console.error(err);
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <main id="main-content" class="detail-page py-4">
    <div class="container" style="max-width: 720px">
      <RouterLink to="/resources" class="back-link"
        >← Back to Resources</RouterLink
      >

      <div v-if="loading" class="text-center py-5" role="status">Loading…</div>
      <div v-else-if="notFound" class="alert alert-danger" role="alert">
        Resource not found.
      </div>

      <article v-else class="detail-card">
        <span class="category-tag">{{ resource.category }}</span>
        <h1>{{ resource.title }}</h1>
        <p class="description">{{ resource.description }}</p>

        <div class="d-flex align-items-center gap-3 mb-3">
          <StarRating
            readonly
            :average="resource.ratingAvg"
            :count="resource.ratingCount"
          />
          <a
            :href="resource.url"
            target="_blank"
            rel="noopener"
            class="btn btn-primary btn-sm"
          >
            Visit resource ↗
          </a>
        </div>

        <hr />

        <section aria-labelledby="rate-heading">
          <h2 id="rate-heading" class="rate-heading">Rate this resource</h2>

          <p v-if="!authStore.isAuthenticated">
            <RouterLink
              :to="{ name: 'login', query: { redirect: route.fullPath } }"
              >Sign in</RouterLink
            >
            to leave a rating.
          </p>
          <template v-else>
            <StarRating
              :model-value="myRating"
              label="Your rating"
              @update:model-value="submitRating"
            />
            <p v-if="submitting" class="text-muted small mt-1">Saving…</p>
            <p v-if="feedback" role="status" class="small mt-1">
              {{ feedback }}
            </p>
          </template>
        </section>
      </article>
    </div>
  </main>
</template>

<style scoped>
.back-link {
  display: inline-block;
  margin-bottom: 1rem;
  color: #4a5565;
  text-decoration: none;
  font-size: 0.9rem;
}
.back-link:hover {
  color: #1447e6;
}
.detail-card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 2rem;
}
.category-tag {
  display: inline-block;
  background: #ebf4fd;
  color: #1447e6;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  margin-bottom: 0.75rem;
}
h1 {
  font-family: "Poppins", sans-serif;
  font-weight: 700;
  color: #101828;
}
.description {
  color: #4a5565;
}
.rate-heading {
  font-family: "Poppins", sans-serif;
  font-size: 1.1rem;
  color: #101828;
  margin-bottom: 0.75rem;
}
</style>
