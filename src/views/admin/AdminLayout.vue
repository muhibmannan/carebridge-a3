<script setup>
import { computed, onMounted, provide, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase";
import { useAppointmentsStore } from "@/stores/appointments";
import { toDate } from "@/utils/dates";
import { exportReportToPdf, dateStamp } from "@/utils/exporters";
import { AdminDataKey } from "./adminDataKey";

const route = useRoute();
const appointmentsStore = useAppointmentsStore();


const users = ref([]);
const resources = ref([]);
const loading = ref(true);
const error = ref(null);

onMounted(async () => {
  try {
    const [userSnap, resourceSnap] = await Promise.all([
      getDocs(collection(db, "users")),
      getDocs(collection(db, "resources")),
      appointmentsStore.fetchAll(),
    ]);
    users.value = userSnap.docs.map((d) => ({ uid: d.id, ...d.data() }));
    resources.value = resourceSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    error.value = "Could not load dashboard data. " + err.message;
  } finally {
    loading.value = false;
  }
});

const rangeMonths = ref(6);
const selectedMonthKey = ref(null);

function pad(n) {
  return String(n).padStart(2, "0");
}

function monthKeyOf(value) {
  const date = toDate(value);
  if (!date || Number.isNaN(date.getTime())) return null;
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

const months = computed(() => {
  const list = [];
  const now = new Date();
  for (let i = rangeMonths.value - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    list.push({
      key: `${d.getFullYear()}-${pad(d.getMonth() + 1)}`,
      label: d.toLocaleDateString("en-AU", { month: "short" }),
      fullLabel: d.toLocaleDateString("en-AU", {
        month: "long",
        year: "numeric",
      }),
    });
  }
  return list;
});

function countByMonth(items, getValue) {
  const counts = new Map(months.value.map((m) => [m.key, 0]));
  items.forEach((item) => {
    const key = monthKeyOf(getValue(item));
    if (key && counts.has(key)) counts.set(key, counts.get(key) + 1);
  });
  return months.value.map((m) => counts.get(m.key));
}

function countIn(items, getValue, key) {
  return items.filter((item) => monthKeyOf(getValue(item)) === key).length;
}

const activeAppointments = computed(() =>
  appointmentsStore.items.filter((a) => a.status !== "cancelled"),
);

const appointmentSeries = computed(() =>
  countByMonth(activeAppointments.value, (a) => a.start),
);

const registrationSeries = computed(() =>
  countByMonth(users.value, (u) => u.createdAt),
);

const thisMonthKey = computed(() => {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
});

const lastMonthKey = computed(() => {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
});

const roleCounts = computed(() => {
  const counts = { user: 0, admin: 0 };
  users.value.forEach((u) => {
    counts[u.role] = (counts[u.role] || 0) + 1;
  });
  return counts;
});

function deltaPercent(current, previous) {
  if (!previous) return null;
  return Math.round(((current - previous) / previous) * 100);
}

const apptsThisMonth = computed(() =>
  countIn(activeAppointments.value, (a) => a.start, thisMonthKey.value),
);
const apptsLastMonth = computed(() =>
  countIn(activeAppointments.value, (a) => a.start, lastMonthKey.value),
);
const usersThisMonth = computed(() =>
  countIn(users.value, (u) => u.createdAt, thisMonthKey.value),
);

const categoryBreakdown = computed(() => {
  const groups = new Map();
  resources.value.forEach((r) => {
    const key = r.category || "Uncategorised";
    if (!groups.has(key)) groups.set(key, { count: 0, ratingSum: 0, rated: 0 });
    const group = groups.get(key);
    group.count += 1;
    if (r.ratingAvg) {
      group.ratingSum += r.ratingAvg;
      group.rated += 1;
    }
  });

  const total = resources.value.length || 1;
  return [...groups.entries()]
    .map(([category, group]) => ({
      category,
      count: group.count,
      share: Math.round((group.count / total) * 100),
      avgRating: group.rated ? group.ratingSum / group.rated : null,
    }))
    .sort((a, b) => b.count - a.count);
});

const stats = computed(() => [
  {
    key: "users",
    value: users.value.length,
    label: "Registered users",
    note: `${usersThisMonth.value} joined this month`,
    delta: null,
    tone: "blue",
  },
  {
    key: "roles",
    value: roleCounts.value.user || 0,
    label: "Participants",
    note: `${roleCounts.value.admin || 0} administrator${
      (roleCounts.value.admin || 0) === 1 ? "" : "s"
    }`,
    delta: null,
    tone: "green",
  },
  {
    key: "appointments",
    value: apptsThisMonth.value,
    label: "Appointments this month",
    note: `${activeAppointments.value.length} total`,
    delta: deltaPercent(apptsThisMonth.value, apptsLastMonth.value),
    tone: "purple",
  },
  {
    key: "resources",
    value: resources.value.length,
    label: "Resources available",
    note: `${categoryBreakdown.value.length} categories`,
    delta: null,
    tone: "amber",
  },
]);

const selectedMonthLabel = computed(() => {
  const match = months.value.find((m) => m.key === selectedMonthKey.value);
  return match ? match.fullLabel : null;
});

const recentRegistrations = computed(() => {
  const sorted = [...users.value].sort(
    (a, b) => (toDate(b.createdAt) || 0) - (toDate(a.createdAt) || 0),
  );
  const filtered = selectedMonthKey.value
    ? sorted.filter((u) => monthKeyOf(u.createdAt) === selectedMonthKey.value)
    : sorted;
  return filtered.slice(0, 8);
});

function setRange(value) {
  rangeMonths.value = value;
  if (!months.value.some((m) => m.key === selectedMonthKey.value)) {
    selectedMonthKey.value = null;
  }
}

const currentPeriodLabel = computed(() =>
  new Date().toLocaleDateString("en-AU", { month: "long", year: "numeric" }),
);


provide(AdminDataKey, {
  users,
  resources,
  loading,
  error,
  months,
  rangeMonths,
  setRange,
  appointmentSeries,
  registrationSeries,
  categoryBreakdown,
  selectedMonthKey,
  selectedMonthLabel,
  recentRegistrations,
});

const tabs = [
  { name: "admin", label: "Overview" },
  { name: "admin-users", label: "Users" },
  { name: "admin-appointments", label: "Appointments" },
];

function isCurrent(tab) {
  return route.name === tab.name;
}

const transitionName = ref("admin-fade");

watch(
  () => route.name,
  (toName, fromName) => {
    const from = tabs.findIndex((t) => t.name === fromName);
    const next = tabs.findIndex((t) => t.name === toName);
    if (from === -1 || next === -1) {
      transitionName.value = "admin-fade";
      return;
    }
    transitionName.value =
      next > from ? "admin-slide-left" : "admin-slide-right";
  },
);

function exportReport() {
  exportReportToPdf({
    filename: `carebridge-admin-report-${dateStamp()}.pdf`,
    title: "CareBridge — Admin report",
    subtitle: `Enable Collective · ${currentPeriodLabel.value} · generated ${new Date().toLocaleString("en-AU")}`,
    sections: [
      {
        heading: "Platform summary",
        columns: [
          { key: "metric", label: "Metric" },
          { key: "value", label: "Value" },
        ],
        rows: stats.value.map((stat) => ({
          metric: stat.label,
          value: `${stat.value}${stat.note ? ` (${stat.note})` : ""}`,
        })),
      },
      {
        heading: `Activity — last ${rangeMonths.value} months`,
        columns: [
          { key: "month", label: "Month" },
          { key: "appointments", label: "Appointments" },
          { key: "registrations", label: "New users" },
        ],
        rows: months.value.map((month, index) => ({
          month: month.fullLabel,
          appointments: appointmentSeries.value[index],
          registrations: registrationSeries.value[index],
        })),
      },
      {
        heading: "Resources by category",
        columns: [
          { key: "category", label: "Category" },
          { key: "count", label: "Resources" },
          { key: "share", label: "Share" },
          { key: "rating", label: "Mean rating" },
        ],
        rows: categoryBreakdown.value.map((item) => ({
          category: item.category,
          count: item.count,
          share: `${item.share}%`,
          rating: item.avgRating ? item.avgRating.toFixed(1) : "—",
        })),
      },
    ],
  });
}
</script>

<template>
  <div class="admin-shell">
    <header class="admin-header">
      <div>
        <h1>Admin Dashboard</h1>
        <p class="admin-subtitle">
          Platform overview and management · {{ currentPeriodLabel }}
        </p>
      </div>
      <button
        type="button"
        class="btn-secondary"
        :disabled="loading || !!error"
        @click="exportReport"
      >
        Export Report
      </button>
    </header>

    <p v-if="loading" class="admin-status">Loading dashboard…</p>
    <p v-else-if="error" role="alert" class="error-text">{{ error }}</p>

    <template v-else>
      <ul class="stat-grid">
        <li v-for="stat in stats" :key="stat.key" class="stat-card">
          <div class="stat-top">
            <span
              class="stat-icon"
              :class="`stat-icon--${stat.tone}`"
              aria-hidden="true"
            ></span>
            <span
              v-if="stat.delta !== null"
              class="stat-delta"
              :class="stat.delta >= 0 ? 'stat-delta--up' : 'stat-delta--down'"
            >
              {{ stat.delta >= 0 ? "+" : "" }}{{ stat.delta }}%
              <span class="visually-hidden">compared with last month</span>
            </span>
          </div>
          <p class="stat-value">{{ stat.value }}</p>
          <p class="stat-label">{{ stat.label }}</p>
          <p class="stat-note">{{ stat.note }}</p>
        </li>
      </ul>

      <nav class="admin-tabs" aria-label="Admin sections">
        <RouterLink
          v-for="tab in tabs"
          :key="tab.name"
          :to="{ name: tab.name }"
          class="tab"
          :class="{ 'tab--active': isCurrent(tab) }"
          :aria-current="isCurrent(tab) ? 'page' : undefined"
        >
          {{ tab.label }}
        </RouterLink>
      </nav>

      <div class="admin-panel">
        <RouterView v-slot="{ Component, route: panelRoute }">
          <Transition :name="transitionName" mode="out-in">
            <KeepAlive>
              <component :is="Component" :key="panelRoute.name" />
            </KeepAlive>
          </Transition>
        </RouterView>
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
.admin-shell {
  max-width: 1140px;
  margin: 0 auto;
  padding: 2rem 1rem 3rem;
}

.admin-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1.5rem;

  h1 {
    font-family: "Poppins", sans-serif;
    color: #101828;
    margin: 0;
  }
}

.admin-subtitle {
  color: #6a7282;
  margin: 0.25rem 0 0;
}

.admin-status {
  color: #4a5565;
}

.error-text {
  color: #b91c1c;
}

.stat-grid {
  list-style: none;
  margin: 0 0 1.5rem;
  padding: 0;
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.stat-card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1.1rem;
}

.stat-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.stat-icon {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.6rem;
  display: block;

  &--blue {
    background: #ebf4fd;
  }
  &--green {
    background: #ecfdf5;
  }
  &--purple {
    background: #f3eafd;
  }
  &--amber {
    background: #fef9e7;
  }
}

.stat-delta {
  font-size: 0.8rem;
  font-weight: 600;
  border-radius: 999px;
  padding: 0.15rem 0.5rem;

  &--up {
    background: #ecfdf5;
    color: #007a55;
  }
  &--down {
    background: #fef3c6;
    color: #973c00;
  }
}

.stat-value {
  font-family: "Poppins", sans-serif;
  font-size: 1.75rem;
  font-weight: 700;
  color: #101828;
  margin: 0;
}

.stat-label {
  color: #4a5565;
  font-size: 0.9rem;
  margin: 0.1rem 0 0;
}

.stat-note {
  color: #6a7282;
  font-size: 0.8rem;
  margin: 0.35rem 0 0;
}

.admin-tabs {
  display: inline-flex;
  gap: 0.25rem;
  background: #f0f2f5;
  border-radius: 0.6rem;
  padding: 0.25rem;
  margin-bottom: 1.25rem;
  max-width: 100%;
  overflow-x: auto;
}

.tab {
  padding: 0.45rem 1rem;
  border-radius: 0.45rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: #4a5565;
  text-decoration: none;
  white-space: nowrap;

  &:hover {
    color: #101828;
  }

  &:focus-visible {
    outline: 2px solid #2f80ed;
    outline-offset: 2px;
  }
}

.tab--active {
  background: #ffffff;
  color: #2f80ed;
}

.admin-panel {
  min-width: 0;
  overflow-x: hidden;
}

.btn-secondary {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  color: #364153;
  border-radius: 0.5rem;
  padding: 0.5rem 1rem;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: #f3f4f6;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &:focus-visible {
    outline: 2px solid #2f80ed;
    outline-offset: 2px;
  }
}

.admin-slide-left-enter-active,
.admin-slide-left-leave-active,
.admin-slide-right-enter-active,
.admin-slide-right-leave-active,
.admin-fade-enter-active,
.admin-fade-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}

.admin-slide-left-enter-from {
  opacity: 0;
  transform: translateX(1.25rem);
}
.admin-slide-left-leave-to {
  opacity: 0;
  transform: translateX(-1.25rem);
}

.admin-slide-right-enter-from {
  opacity: 0;
  transform: translateX(-1.25rem);
}
.admin-slide-right-leave-to {
  opacity: 0;
  transform: translateX(1.25rem);
}

.admin-fade-enter-from,
.admin-fade-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .admin-slide-left-enter-active,
  .admin-slide-left-leave-active,
  .admin-slide-right-enter-active,
  .admin-slide-right-leave-active,
  .admin-fade-enter-active,
  .admin-fade-leave-active {
    transition: none;
  }

  .admin-slide-left-enter-from,
  .admin-slide-left-leave-to,
  .admin-slide-right-enter-from,
  .admin-slide-right-leave-to {
    transform: none;
  }
}

@media (max-width: 991px) {
  .stat-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 575px) {
  .stat-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>