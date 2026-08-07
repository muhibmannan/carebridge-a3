<script setup>
import { computed, inject, ref } from "vue";
import { formatDate } from "@/utils/dates";
import ActivityBarChart from "@/components/charts/ActivityBarChart.vue";
import ResourceCategoryChart from "@/components/charts/ResourceCategoryChart.vue";
import { AdminDataKey } from "./adminDataKey";

const admin = inject(AdminDataKey);

const {
  months,
  rangeMonths,
  setRange,
  appointmentSeries,
  registrationSeries,
  categoryBreakdown,
  selectedMonthKey,
  selectedMonthLabel,
  recentRegistrations,
} = admin;

const selectedCategory = ref(null);

const totals = computed(() => ({
  appointments: appointmentSeries.value.reduce((sum, n) => sum + n, 0),
  registrations: registrationSeries.value.reduce((sum, n) => sum + n, 0),
}));

function initialsOf(user) {
  const source = user.displayName || user.email || "?";
  return source
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}
</script>

<template>
  <div class="admin-overview">
    <div class="chart-grid">
      <article class="card card--wide">
        <div class="card-head">
          <h2>Monthly appointments &amp; new registrations</h2>
          <div class="range-toggle" role="group" aria-label="Chart date range">
            <button
              type="button"
              class="range-btn"
              :aria-pressed="rangeMonths === 6"
              @click="setRange(6)"
            >
              6 months
            </button>
            <button
              type="button"
              class="range-btn"
              :aria-pressed="rangeMonths === 12"
              @click="setRange(12)"
            >
              12 months
            </button>
          </div>
        </div>

        <ActivityBarChart
          :months="months"
          :appointments="appointmentSeries"
          :registrations="registrationSeries"
          :selected-key="selectedMonthKey"
          @select-month="selectedMonthKey = $event"
        />

        <p class="chart-summary">
          {{ totals.appointments }} appointments and
          {{ totals.registrations }} new registrations across
          {{ rangeMonths }} months. Select a month to filter recent activity.
        </p>
      </article>

      <article class="card">
        <div class="card-head">
          <h2>Resources by category</h2>
        </div>
        <ResourceCategoryChart
          :categories="categoryBreakdown"
          :selected-category="selectedCategory"
          @select-category="selectedCategory = $event"
        />
      </article>
    </div>

    <article class="card recent-card">
      <div class="card-head">
        <h2>Recent registrations</h2>
        <p v-if="selectedMonthLabel" class="filter-chip">
          {{ selectedMonthLabel }}
          <button
            type="button"
            class="chip-clear"
            @click="selectedMonthKey = null"
          >
            <span aria-hidden="true">✕</span>
            <span class="visually-hidden">
              Clear {{ selectedMonthLabel }} filter
            </span>
          </button>
        </p>
      </div>

      <ul class="registration-list">
        <li
          v-for="user in recentRegistrations"
          :key="user.uid"
          class="registration"
        >
          <span class="avatar" aria-hidden="true">{{ initialsOf(user) }}</span>
          <span class="registration-body">
            <span class="registration-name">
              {{ user.displayName || user.email }}
            </span>
            <span class="registration-meta">
              {{ user.role === "admin" ? "Administrator" : "NDIS participant" }}
              · joined {{ formatDate(user.createdAt) }}
            </span>
          </span>
          <span class="badge" :class="`badge--${user.role}`">
            {{ user.role }}
          </span>
        </li>
        <li v-if="!recentRegistrations.length" class="registration-empty">
          No registrations in this period.
        </li>
      </ul>
    </article>
  </div>
</template>

<style scoped lang="scss">
.chart-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
  margin-bottom: 1rem;
}

.card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1.25rem;
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;

  h2 {
    font-family: "Poppins", sans-serif;
    font-size: 1.05rem;
    color: #101828;
    margin: 0;
  }
}

.chart-summary {
  color: #4a5565;
  font-size: 0.875rem;
  margin: 0.75rem 0 0;
}

.range-toggle {
  display: inline-flex;
  gap: 0.25rem;
  background: #f0f2f5;
  border-radius: 0.5rem;
  padding: 0.2rem;
}

.range-btn {
  background: none;
  border: none;
  border-radius: 0.375rem;
  padding: 0.25rem 0.7rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: #4a5565;
  cursor: pointer;

  &[aria-pressed="true"] {
    background: #ffffff;
    color: #2f80ed;
  }

  &:focus-visible {
    outline: 2px solid #2f80ed;
    outline-offset: 2px;
  }
}

.filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: #ebf4fd;
  color: #1447e6;
  border-radius: 999px;
  padding: 0.2rem 0.35rem 0.2rem 0.7rem;
  font-size: 0.8rem;
  font-weight: 600;
  margin: 0;
}

.chip-clear {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  line-height: 1;
  padding: 0.15rem 0.3rem;
  border-radius: 999px;

  &:hover {
    background: #dbeafe;
  }

  &:focus-visible {
    outline: 2px solid #2f80ed;
    outline-offset: 1px;
  }
}

.registration-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.registration {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.65rem 0;
  border-bottom: 1px solid #f3f4f6;

  &:last-child {
    border-bottom: none;
  }
}

.avatar {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 50%;
  background: #2f80ed;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 600;
  flex-shrink: 0;
}

.registration-body {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.registration-name {
  color: #101828;
  font-weight: 600;
  font-size: 0.9rem;
}

.registration-meta {
  color: #6a7282;
  font-size: 0.8rem;
}

.registration-empty {
  color: #6a7282;
  font-size: 0.9rem;
  padding: 1rem 0;
}

.badge {
  display: inline-block;
  padding: 0.15rem 0.6rem;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: capitalize;
}
.badge--admin {
  background: #f3eafd;
  color: #8200db;
}
.badge--user {
  background: #ebf4fd;
  color: #1447e6;
}

@media (max-width: 991px) {
  .chart-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>