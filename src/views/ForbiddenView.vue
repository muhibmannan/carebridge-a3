<script setup>
import { RouterLink } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const authStore = useAuthStore();
</script>

<template>
  <div class="forbidden-page">
    <div class="forbidden-card">
      <span class="forbidden-icon" aria-hidden="true">⚠</span>
      <h1>Access denied</h1>
      <p>
        This area is restricted to CareBridge administrators. Your account
        <template v-if="authStore.profile">
          ({{ authStore.profile.displayName }}) has the
          <strong>{{ authStore.role }}</strong> role.
        </template>
        <template v-else>does not have the required permissions.</template>
      </p>
      <RouterLink to="/" class="btn btn-primary">Return to home</RouterLink>
    </div>
  </div>
</template>

<style scoped lang="scss">
.forbidden-page {
  min-height: calc(100vh - 72px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  background: #f9fafb;
}

.forbidden-card {
  max-width: 480px;
  text-align: center;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 1rem;
  padding: 2.5rem 2rem;
}

.forbidden-icon {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  margin: 0 auto 1rem;
  border-radius: 50%;
  background: #fee2e2;
  color: #fb2c36;
  font-size: 1.5rem;
}

h1 {
  font-family: "Poppins", sans-serif;
  font-size: 1.5rem;
  font-weight: 600;
  color: #101828;
  margin-bottom: 0.75rem;
}

p {
  color: #4a5565;
  margin-bottom: 1.5rem;
}

.btn-primary {
  background: #2f80ed;
  border-color: #2f80ed;
  border-radius: 0.5rem;
  padding: 0.625rem 1.5rem;
  font-weight: 600;
}
</style>
