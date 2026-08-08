<script setup>
import { computed } from "vue";
import { Doughnut } from "vue-chartjs";
import { Chart as ChartJS, ArcElement, Tooltip } from "chart.js";

ChartJS.register(ArcElement, Tooltip);

const props = defineProps({
  categories: { type: Array, required: true },
  selectedCategory: { type: String, default: null },
});

const emit = defineEmits(["select-category"]);


const SEGMENT_COLOURS = [
  "#2F80ED",
  "#27AE60",
  "#9B51E0",
  "#F2C94C",
  "#EB5757",
  "#8200DB",
  "#BB4D00",
  "#1557B0",
];

const total = computed(() =>
  props.categories.reduce((sum, item) => sum + item.count, 0),
);

const chartData = computed(() => ({
  labels: props.categories.map((c) => c.category),
  datasets: [
    {
      data: props.categories.map((c) => c.count),
      backgroundColor: props.categories.map(
        (_, i) => SEGMENT_COLOURS[i % SEGMENT_COLOURS.length],
      ),
      borderColor: "#FFFFFF",
      borderWidth: 2,
      offset: props.categories.map((c) =>
        c.category === props.selectedCategory ? 10 : 0,
      ),
    },
  ],
}));

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  cutout: "72%",
  rotation: -90,
  circumference: 180,
  onClick: (event, elements) => {
    if (!elements.length) return;
    const item = props.categories[elements[0].index];
    if (item) selectCategory(item.category);
  },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: "#101828",
      padding: 10,
      callbacks: {
        label: (ctx) => {
          const item = props.categories[ctx.dataIndex];
          return `${item.category}: ${item.count} (${item.share}%)`;
        },
      },
    },
  },
}));

function selectCategory(category) {
  emit("select-category", props.selectedCategory === category ? null : category);
}

function colourFor(index) {
  return SEGMENT_COLOURS[index % SEGMENT_COLOURS.length];
}

const selected = computed(() =>
  props.categories.find((c) => c.category === props.selectedCategory),
);
</script>

<template>
  <div class="chart-block">
    <div class="chart-canvas">
      <Doughnut
        :data="chartData"
        :options="chartOptions"
        aria-hidden="true"
        role="presentation"
      />
      <p class="chart-centre">
        <span class="chart-centre-value">{{ total }}</span>
        <span class="chart-centre-label">
          Resource{{ total === 1 ? "" : "s" }}
        </span>
      </p>
    </div>


    <ul class="legend">
      <li v-for="(item, index) in categories" :key="item.category">
        <button
          type="button"
          class="legend-btn"
          :aria-pressed="item.category === selectedCategory"
          @click="selectCategory(item.category)"
        >
          <span
            class="legend-dot"
            :style="{ background: colourFor(index) }"
            aria-hidden="true"
          ></span>
          <span class="legend-label">{{ item.category }}</span>
          <span class="legend-value">{{ item.count }}</span>
        </button>
      </li>
    </ul>

    <p class="chart-detail" aria-live="polite">
      <template v-if="selected">
        <strong>{{ selected.category }}</strong> — {{ selected.count }}
        resource{{ selected.count === 1 ? "" : "s" }} ({{ selected.share }}%),
        mean rating
        {{ selected.avgRating ? selected.avgRating.toFixed(1) : "not yet rated"
        }}<template v-if="selected.avgRating"> out of 5</template>.
      </template>
      <template v-else>
        Select a category for its share and mean rating.
      </template>
    </p>
  </div>
</template>

<style scoped>
.chart-canvas {
  position: relative;
  height: 150px;
  padding-top: 0.25rem;
}

.chart-centre {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 0;
  pointer-events: none;
}

.chart-centre-value {
  font-family: "Poppins", sans-serif;
  font-size: 1.9rem;
  font-weight: 700;
  color: #101828;
  line-height: 1.1;
}

.chart-centre-label {
  font-size: 0.8rem;
  color: #6a7282;
}

.legend {
  list-style: none;
  margin: 0.75rem 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.legend-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  background: none;
  border: 1px solid transparent;
  border-radius: 0.375rem;
  padding: 0.3rem 0.4rem;
  font-size: 0.875rem;
  color: #4a5565;
  cursor: pointer;
  text-align: left;
}

.legend-btn:hover {
  background: #f8fafc;
}

.legend-btn[aria-pressed="true"] {
  background: #ebf4fd;
  border-color: #2f80ed;
  color: #101828;
  font-weight: 600;
}

.legend-btn:focus-visible {
  outline: 2px solid #2f80ed;
  outline-offset: 2px;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.legend-label {
  flex: 1;
}

.legend-value {
  color: #101828;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.chart-detail {
  margin: 0.75rem 0 0;
  font-size: 0.85rem;
  color: #6a7282;
  min-height: 2.4em;
}
</style>