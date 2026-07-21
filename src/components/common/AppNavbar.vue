<script setup>
import { ref } from "vue";
import { RouterLink } from "vue-router";

const isOpen = ref(false);
const toggleNav = () => {
  isOpen.value = !isOpen.value;
};
const closeNav = () => {
  isOpen.value = false;
};
</script>

<template>
  <header>
    <nav class="navbar navbar-expand-md app-navbar" aria-label="Primary">
      <div class="container">
        <RouterLink class="navbar-brand" to="/" @click="closeNav">
          <span class="brand-icon" aria-hidden="true">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 21s-7.5-4.6-10-9.3C0.3 8 2 4 6 4c2.2 0 3.7 1.2 6 4 2.3-2.8 3.8-4 6-4 4 0 5.7 4 4 7.7C19.5 16.4 12 21 12 21z"
                fill="white"
              />
            </svg>
          </span>
          CareBridge
        </RouterLink>

        <button
          class="navbar-toggler"
          type="button"
          :aria-expanded="isOpen"
          aria-controls="primaryNav"
          aria-label="Toggle navigation menu"
          @click="toggleNav"
        >
          <span class="navbar-toggler-icon"></span>
        </button>

        <div
          id="primaryNav"
          class="collapse navbar-collapse"
          :class="{ show: isOpen }"
        >
          <ul class="navbar-nav ms-auto align-items-md-center gap-md-2">
            <li class="nav-item">
              <RouterLink class="nav-link" to="/resources" @click="closeNav"
                >Resources</RouterLink
              >
            </li>
            <li class="nav-item">
              <RouterLink class="nav-link" to="/map" @click="closeNav"
                >Find Services</RouterLink
              >
            </li>
            <li class="nav-item">
              <RouterLink class="nav-link" to="/login" @click="closeNav"
                >Log in</RouterLink
              >
            </li>
            <li class="nav-item">
              <RouterLink
                class="btn btn-primary btn-nav-cta ms-md-2"
                to="/register"
                @click="closeNav"
              >
                Get Started
              </RouterLink>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  </header>
</template>

<style scoped lang="scss">
.app-navbar {
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  padding-block: 0.75rem;
}

.navbar-brand {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-family: "Poppins", sans-serif;
  font-weight: 700;
  font-size: 1.25rem;
  color: #101828;
}

.brand-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #2f80ed;
}

.nav-link {
  color: #364153;
  font-weight: 500;
  padding: 0.5rem 0.75rem;

  &:hover,
  &:focus-visible {
    color: #1447e6;
  }

  &.router-link-exact-active {
    color: #1447e6;
    font-weight: 600;
  }
}

.btn-nav-cta {
  background: #2f80ed;
  border-color: #2f80ed;

  &:hover,
  &:focus-visible {
    background: #1a65cf;
    border-color: #1a65cf;
  }
}

.nav-link:focus-visible,
.navbar-brand:focus-visible,
.navbar-toggler:focus-visible {
  outline: 3px solid #2f80ed;
  outline-offset: 2px;
}
</style>
