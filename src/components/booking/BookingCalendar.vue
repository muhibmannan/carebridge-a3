<template>
  <div class="booking-calendar card-surface">
    <div class="calendar-header">
      <h2 class="calendar-title">{{ title }}</h2>
      <div class="calendar-nav">
        <button
          type="button"
          class="nav-btn"
          aria-label="Previous month"
          @click="go(-1)"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <button
          type="button"
          class="nav-btn"
          aria-label="Next month"
          @click="go(1)"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    </div>

    <FullCalendar ref="calRef" :options="calendarOptions" />

    <div class="calendar-legend">
      <span class="legend-item"><span class="dot has-appt" aria-hidden="true"></span> Has appointment</span>
      <span class="legend-item"><span class="dot is-today" aria-hidden="true"></span> Today</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import FullCalendar from "@fullcalendar/vue3";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";

const props = defineProps({
  markedDates: { type: Set, default: () => new Set() },
  selectedDate: { type: String, default: null },
});
const emit = defineEmits(["date-click"]);

const calRef = ref(null);
const title = ref("");

function dateKeyFromDate(d) {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

const calendarOptions = computed(() => ({
  plugins: [dayGridPlugin, interactionPlugin],
  initialView: "dayGridMonth",
  headerToolbar: false,
  dayHeaderFormat: { weekday: "narrow" },
  fixedWeekCount: false,
  height: "auto",
  dayCellContent: (arg) => {
    const key = dateKeyFromDate(arg.date);
    const hasAppt = props.markedDates.has(key);
    const wrapper = document.createElement("span");
    wrapper.className = "fc-day-number";
    wrapper.textContent = String(arg.dayNumberText).replace(/\D/g, "");
    const container = document.createElement("span");
    container.className = "fc-day-cell-inner";
    container.appendChild(wrapper);
    if (hasAppt) {
      const dot = document.createElement("span");
      dot.className = "fc-day-dot";
      dot.setAttribute("aria-hidden", "true");
      container.appendChild(dot);
    }
    return { domNodes: [container] };
  },
  dayCellClassNames: (arg) => {
    const classes = [];
    const today = dateKeyFromDate(new Date());
    const key = dateKeyFromDate(arg.date);
    if (key === today) classes.push("is-today");
    if (props.selectedDate && key === props.selectedDate) classes.push("is-selected");
    return classes;
  },
  dateClick: (info) => {
    emit("date-click", dateKeyFromDate(info.date));
  },
  datesSet: (arg) => {
    title.value = arg.view.title;
  },
}));

function go(offset) {
  const api = calRef.value.getApi();
  if (offset < 0) api.prev();
  else api.next();
}

onMounted(() => {
  title.value = calRef.value.getApi().view.title;
});
</script>

<style scoped>
.card-surface {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 24px;
}

.calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.calendar-title {
  font-family: "Poppins", sans-serif;
  font-size: 1.25rem;
  font-weight: 600;
  color: #101828;
  margin: 0;
}
.calendar-nav {
  display: flex;
  gap: 4px;
}
.nav-btn {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: #4a5565;
  border-radius: 8px;
  cursor: pointer;
}
.nav-btn:hover {
  background: #f3f4f6;
}
.nav-btn:focus-visible {
  outline: 2px solid #2f80ed;
  outline-offset: 2px;
}

.booking-calendar :deep(.fc) {
  --fc-border-color: transparent;
  --fc-today-bg-color: transparent;
  font-family: "Inter", sans-serif;
}
.booking-calendar :deep(.fc-col-header-cell) {
  border: none;
  padding-bottom: 8px;
}
.booking-calendar :deep(.fc-col-header-cell-cushion) {
  color: #6a7282;
  font-weight: 500;
  text-decoration: none;
  font-size: 0.85rem;
}
.booking-calendar :deep(.fc-daygrid-day-frame) {
  padding: 4px 0;
  display: grid;
  place-items: center;
}
.booking-calendar :deep(.fc-daygrid-day-top) {
  display: flex;
  justify-content: center;
}
.booking-calendar :deep(.fc-daygrid-day-number) {
  text-decoration: none;
  color: inherit;
}
.booking-calendar :deep(.fc-day-cell-inner) {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  width: 40px;
  height: 40px;
  justify-content: center;
  border-radius: 10px;
  color: #101828;
  font-size: 0.95rem;
  cursor: pointer;
}
.booking-calendar :deep(.fc-daygrid-day):hover .fc-day-cell-inner {
  background: #f3f4f6;
}
.booking-calendar :deep(.fc-day-dot) {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #2f80ed;
}
.booking-calendar :deep(.is-today .fc-day-cell-inner) {
  background: #1a65cf;
  color: #ffffff;
  font-weight: 600;
}
.booking-calendar :deep(.is-today .fc-day-dot) {
  background: #ffffff;
}
.booking-calendar :deep(.is-selected:not(.is-today) .fc-day-cell-inner) {
  background: #ebf4fd;
  color: #1447e6;
  font-weight: 600;
}
.booking-calendar :deep(.fc-daygrid-day-frame:focus-within .fc-day-cell-inner) {
  outline: 2px solid #2f80ed;
  outline-offset: 2px;
}
.booking-calendar :deep(.fc-day-other .fc-day-cell-inner) {
  color: #99a1af;
}

.calendar-legend {
  display: flex;
  gap: 20px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
  font-size: 0.85rem;
  color: #4a5565;
}
.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #2f80ed;
}
</style>