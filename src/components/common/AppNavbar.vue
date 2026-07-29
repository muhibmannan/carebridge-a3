<script setup>
import { ref, computed } from "vue";
import { RouterLink, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const authStore = useAuthStore();
const router = useRouter();

const isOpen = ref(false);
const toggleNav = () => {
  isOpen.value = !isOpen.value;
};
const closeNav = () => {
  isOpen.value = false;
};

const initials = computed(() => {
  const name = authStore.profile?.displayName || "";
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
});

const allLinks = [
  { name: "resources", label: "Resources" },
  { name: "map", label: "Find Services" },
  { name: "appointments", label: "Appointments", requiresAuth: true },
  { name: "admin", label: "Admin", adminOnly: true },
];

const navLinks = computed(() =>
  allLinks.filter((link) => {
    if (!router.hasRoute(link.name)) return false;
    if (link.requiresAuth && !authStore.isAuthenticated) return false;
    if (link.adminOnly && !authStore.isAdmin) return false;
    return true;
  }),
);

async function handleLogout() {
  await authStore.logout();
  closeNav();
  router.push({ name: "home" });
}
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
            <li v-for="link in navLinks" :key="link.name" class="nav-item">
              <RouterLink
                class="nav-link"
                :to="{ name: link.name }"
                @click="closeNav"
              >
                {{ link.label }}
              </RouterLink>
            </li>

            <template v-if="!authStore.isAuthenticated">
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
            </template>

            <template v-else>
              <li class="nav-item d-flex align-items-center gap-2 ms-md-2">
                <span class="user-avatar" aria-hidden="true">{{
                  initials
                }}</span>

                <span class="visually-hidden">
                  Signed in as {{ authStore.profile?.displayName }},
                  {{ authStore.role }} account
                </span>

                <span class="user-meta d-none d-lg-flex" aria-hidden="true">
                  <span class="user-name">{{
                    authStore.profile?.displayName
                  }}</span>
                  <span class="user-role">{{ authStore.role }}</span>
                </span>

                <button
                  type="button"
                  class="btn btn-outline-secondary btn-logout"
                  @click="handleLogout"
                >
                  Log out
                </button>
              </li>
            </template>
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

.user-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #2f80ed;
  color: #ffffff;
  font-family: "Inter", sans-serif;
  font-weight: 600;
  font-size: 0.8rem;
}

.user-meta {
  flex-direction: column;
  line-height: 1.2;
}

.user-name {
  color: #101828;
  font-weight: 500;
  font-size: 0.9rem;
}

.user-role {
  color: #6a7282;
  font-size: 0.75rem;
  text-transform: capitalize;
}

.btn-logout {
  color: #364153;
  border-color: #e5e7eb;

  &:hover,
  &:focus-visible {
    color: #101828;
    background: #f3f4f6;
    border-color: #d1d5dc;
  }
}

.nav-link:focus-visible,
.navbar-brand:focus-visible,
.navbar-toggler:focus-visible,
.btn-logout:focus-visible {
  outline: 3px solid #2f80ed;
  outline-offset: 2px;
}
</style>
