<script setup>
import { computed } from "vue";
import { RouterLink } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const authStore = useAuthStore();

const primaryCta = computed(() =>
  authStore.isAuthenticated
    ? { to: "/appointments", label: "Go to your appointments" }
    : { to: "/register", label: "Get Started" },
);

const features = computed(() => [
  {
    icon: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20 M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z",
    title: "Resource Library",
    text: "Search and filter guides on NDIS planning, equipment funding, housing and more - rated by the community that uses them.",
    link: "/resources",
    linkText: "Search the library",
    tint: "primary",
  },
  {
    icon: "M8 2v4 M16 2v4 M3 10h18 M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
    title: "Appointment Booking",
    text: "Book allied health and support appointments with real-time availability, and get an emailed summary automatically.",
    link: "/appointments",
    linkText: "Book an appointment",
    tint: "success",
  },
  {
    icon: "M12 21s-7.5-4.6-10-9.3C0.3 8 2 4 6 4c2.2 0 3.7 1.2 6 4 2.3-2.8 3.8-4 6-4 4 0 5.7 4 4 7.7C19.5 16.4 12 21 12 21z",
    title: "Find Local Services",
    text: "Search for disability support services near you and get step-by-step directions with distance and travel time.",
    link: "/map",
    linkText: "Open the services map",
    tint: "accent",
  },
]);
</script>

<template>
  <div class="home-view">
    <!-- Hero -->
    <section class="hero" aria-labelledby="hero-heading">
      <div class="container">
        <div class="row align-items-center">
          <div class="col-12 col-lg-7">
            <p class="hero-eyebrow">Enable Collective</p>
            <h1 id="hero-heading" class="hero-heading">
              One place to find support, connect and take control of your plan.
            </h1>
            <p class="hero-subtext">
              CareBridge connects people living with disabilities, their
              families, carers and support workers with essential healthcare
              services, community resources and support programs - all in one
              accessible platform.
            </p>
            <div class="hero-actions">
              <RouterLink
                :to="primaryCta.to"
                class="btn btn-light btn-lg hero-btn-primary"
              >
                {{ primaryCta.label }}
              </RouterLink>
              <RouterLink to="/resources" class="btn btn-outline-light btn-lg">
                Browse Resources
              </RouterLink>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section class="features" aria-labelledby="features-heading">
      <div class="container">
        <h2 id="features-heading" class="section-heading">
          Everything you need, in one place
        </h2>
        <p class="section-subheading">
          CareBridge brings together the tools people told us they were missing
          - built around real NDIS journeys, not generic forms.
        </p>

        <div class="row g-4 mt-2">
          <div
            v-for="feature in features"
            :key="feature.title"
            class="col-12 col-md-6 col-lg-4"
          >
            <div class="feature-card" :class="`feature-card--${feature.tint}`">
              <span class="feature-icon" aria-hidden="true">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path :d="feature.icon" />
                </svg>
              </span>
              <h3 class="feature-title">{{ feature.title }}</h3>
              <p class="feature-text">{{ feature.text }}</p>
              <RouterLink :to="feature.link" class="feature-link">
                {{ feature.linkText }}
                <span aria-hidden="true">→</span>
              </RouterLink>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- About / trust strip -->
    <section class="about" aria-labelledby="about-heading">
      <div class="container">
        <div class="row align-items-center g-4">
          <div class="col-12 col-lg-8">
            <h2 id="about-heading" class="section-heading">
              About Enable Collective
            </h2>
            <p class="about-text">
              Enable Collective is a charity dedicated to making disability
              support easier to find and easier to use. CareBridge was built
              with participants, carers and support workers to remove the
              friction between people and the services they're entitled to -
              from finding the right allied health provider, to booking an
              appointment, to understanding a funding plan.
            </p>
          </div>
          <div class="col-12 col-lg-4">
            <dl class="stats-list">
              <div class="stat">
                <dt class="stat-value">186+</dt>
                <dd class="stat-label">Curated resources</dd>
              </div>
              <div class="stat">
                <dt class="stat-value">WCAG 2.1 AA</dt>
                <dd class="stat-label">Accessibility standard</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </section>

    <section
      v-if="!authStore.isAuthenticated"
      class="cta-band"
      aria-labelledby="cta-heading"
    >
      <div class="container text-center">
        <h2 id="cta-heading" class="cta-heading">Ready to get started?</h2>
        <p class="cta-subtext">
          Create a free CareBridge account in under two minutes.
        </p>
        <RouterLink to="/register" class="btn btn-primary btn-lg">
          Create your account
        </RouterLink>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
.hero {
  background: linear-gradient(135deg, #2f80ed 0%, #1557b0 100%);
  color: #ffffff;
  padding-block: 4rem;

  @media (min-width: 768px) {
    padding-block: 5.5rem;
  }
}

.hero-eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 600;
  font-size: 0.8125rem;
  color: rgba(255, 255, 255, 0.85);
  margin-bottom: 0.75rem;
}

.hero-heading {
  font-family: "Poppins", sans-serif;
  font-weight: 700;
  font-size: 2rem;
  line-height: 1.2;
  margin-bottom: 1.25rem;

  @media (min-width: 768px) {
    font-size: 2.75rem;
  }
}

.hero-subtext {
  font-size: 1.125rem;
  line-height: 1.6;
  max-width: 46ch;
  color: rgba(255, 255, 255, 0.95);
  margin-bottom: 2rem;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.hero-btn-primary {
  color: #1557b0;
  font-weight: 600;

  &:hover,
  &:focus-visible {
    color: #1a65cf;
  }
}

.btn-outline-light:focus-visible,
.hero-btn-primary:focus-visible {
  outline: 3px solid #ffffff;
  outline-offset: 2px;
}

.features,
.about {
  padding-block: 4rem;
}

.section-heading {
  font-family: "Poppins", sans-serif;
  font-weight: 700;
  font-size: 1.75rem;
  color: #101828;
}

.section-subheading {
  color: #4a5565;
  max-width: 60ch;
  font-size: 1.0625rem;
}

.feature-card {
  height: 100%;
  padding: 1.75rem;
  border-radius: 1rem;
  border: 1px solid #e5e7eb;
  background: #ffffff;
}

.feature-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 0.75rem;
  margin-bottom: 1rem;
}

.feature-card--primary .feature-icon {
  background: #ebf4fd;
  color: #1447e6;
}
.feature-card--success .feature-icon {
  background: #eafaf1;
  color: #007a55;
}
.feature-card--accent .feature-icon {
  background: #f3eafd;
  color: #8200db;
}

.feature-title {
  font-family: "Poppins", sans-serif;
  font-weight: 600;
  font-size: 1.125rem;
  color: #101828;
  margin-bottom: 0.5rem;
}

.feature-text {
  color: #4a5565;
  font-size: 0.9375rem;
  line-height: 1.6;
  margin-bottom: 1.25rem;
}

.feature-link {
  color: #1447e6;
  font-weight: 600;
  font-size: 0.9375rem;
  text-decoration: none;

  &:hover,
  &:focus-visible {
    text-decoration: underline;
  }
}

.about {
  background: #f8fafc;
}

.about-text {
  color: #364153;
  font-size: 1.0625rem;
  line-height: 1.7;
}

.stats-list {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  margin: 0;
}

.stat-value {
  font-family: "Poppins", sans-serif;
  font-weight: 700;
  font-size: 1.5rem;
  color: #1447e6;
}

.stat-label {
  color: #6a7282;
  font-size: 0.9375rem;
  margin: 0;
}

.cta-band {
  padding-block: 3.5rem;
  background: #ebf4fd;
}

.cta-heading {
  font-family: "Poppins", sans-serif;
  font-weight: 700;
  font-size: 1.5rem;
  color: #101828;
}

.cta-subtext {
  color: #4a5565;
  margin-bottom: 1.5rem;
}

.feature-link:focus-visible,
a:focus-visible {
  outline: 3px solid #2f80ed;
  outline-offset: 2px;
}
</style>