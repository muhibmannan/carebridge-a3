<script setup>
import { computed } from "vue";
import { Bar } from "vue-chartjs";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const props = defineProps({
  months: { type: Array, required: true },
  appointments: { type: Array, required: true },
  registrations: { type: Array, required: true },
  selectedKey: { type: String, default: null },
});

const emit = defineEmits(["select-month"]);

const chartData = computed(() => ({
  labels: props.months.map((m) => m.label),
  datasets: [
    {
      label: "Appointments",
      data: props.appointments,
      backgroundColor: "#2F80ED",
      borderRadius: 4,
      maxBarThickness: 28,
    },
    {
      label: "New users",
      data: props.registrations,
      backgroundColor: "#27AE60",
      borderRadius: 4,
      maxBarThickness: 28,
    },
  ],
}));

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  onClick: (event, elements) => {
    if (!elements.length) return;
    const month = props.months[elements[0].index];
    if (month) selectMonth(month.key);
  },
  plugins: {
    legend: {
      position: "bottom",
      labels: {
        usePointStyle: true,
        pointStyle: "circle",
        boxWidth: 8,
        color: "#4A5565",
        font: { family: "Inter, sans-serif", size: 12 },
      },
    },
    tooltip: {
      backgroundColor: "#101828",
      padding: 10,
      titleFont: { family: "Inter, sans-serif" },
      bodyFont: { family: "Inter, sans-serif" },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      border: { display: false },
      ticks: { color: "#6A7282", font: { family: "Inter, sans-serif" } },
    },
    y: {
      beginAtZero: true,
      border: { display: false },
      grid: { color: "#E5E7EB", drawTicks: false },
      ticks: {
        color: "#6A7282",
        precision: 0,
        font: { family: "Inter, sans-serif" },
      },
    },
  },
}));

function selectMonth(key) {
  emit("select-month", props.selectedKey === key ? null : key);
}

const totalAppointments = computed(() =>
  props.appointments.reduce((sum, n) => sum + n, 0),
);
const totalRegistrations = computed(() =>
  props.registrations.reduce((sum, n) => sum + n, 0),
);
</script>

<template>
  <div class="chart-block">
    <div class="chart-canvas">
      <Bar
        :data="chartData"
        :options="chartOptions"
        aria-hidden="true"
        role="presentation"
      />
    </div>

    <p class="chart-summary">
      {{ totalAppointments }} appointments and
      {{ totalRegistrations }} new registrations across
      {{ months.length }} months. Select a month to filter recent activity.
    </p>

    <details class="chart-data">
      <summary>View chart data as a table</summary>
      <table class="data-table">
        <caption class="visually-hidden">
          Appointments and new user registrations by month
        </caption>
        <thead>
          <tr>
            <th scope="col">Month</th>
            <th scope="col">Appointments</th>
            <th scope="col">New users</th>
            <th scope="col"><span class="visually-hidden">Filter</span></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(month, index) in months"
            :key="month.key"
            :class="{ 'row--active': month.key === selectedKey }"
          >
            <th scope="row">{{ month.fullLabel || month.label }}</th>
            <td>{{ appointments[index] }}</td>
            <td>{{ registrations[index] }}</td>
            <td>
              <button
                type="button"
                class="btn-filter"
                :aria-pressed="month.key === selectedKey"
                @click="selectMonth(month.key)"
              >
                Filter
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </details>
  </div>
</template>

<style scoped>
.chart-canvas {
  height: 260px;
}

.chart-summary {
  font-size: 0.85rem;
  color: #6a7282;
  margin: 0.75rem 0 0;
}

.chart-data {
  margin-top: 0.5rem;
  font-size: 0.85rem;
}

.chart-data summary {
  color: #1447e6;
  cursor: pointer;
  padding: 0.25rem 0;
}

.chart-data summary:focus-visible {
  outline: 2px solid #2f80ed;
  outline-offset: 2px;
  border-radius: 0.25rem;
}

.data-table {
  width: 100%;
  margin-top: 0.5rem;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  text-align: left;
  padding: 0.35rem 0.5rem;
  border-bottom: 1px solid #e5e7eb;
  color: #4a5565;
  font-weight: 400;
}

.data-table thead th {
  color: #101828;
  font-weight: 600;
}

.data-table .row--active {
  background: #ebf4fd;
}

.btn-filter {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  padding: 0.15rem 0.6rem;
  font-size: 0.8rem;
  color: #364153;
  cursor: pointer;
}

.btn-filter[aria-pressed="true"] {
  background: #2f80ed;
  border-color: #2f80ed;
  color: #ffffff;
}

.btn-filter:focus-visible {
  outline: 2px solid #2f80ed;
  outline-offset: 2px;
}
</style>