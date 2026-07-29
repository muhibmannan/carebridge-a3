<script setup>
import { useAuthStore } from "@/stores/auth";

const authStore = useAuthStore();
</script>

<template>
  <main id="main-content" class="admin-stub">
    <h1>Admin dashboard</h1>
    <p>
      Signed in as {{ authStore.profile?.displayName }} with role
      <strong>{{ authStore.role }}</strong
      >.
    </p>
    <p class="note">Dashboard content to be built.</p>
  </main>
</template>

<style scoped lang="scss">
.admin-stub {
  max-width: 1140px;
  margin: 0 auto;
  padding: 2.5rem 1rem;

  h1 {
    font-family: "Poppins", sans-serif;
    color: #101828;
  }

  .note {
    color: #6a7282;
  }
}
</style>
