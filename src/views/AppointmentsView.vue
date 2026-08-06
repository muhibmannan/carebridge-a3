<template>
  <div class="appointments-page">
    <div class="page-head">
      <div>
        <h1>Appointments</h1>
        <p class="subtitle">Manage your schedule and upcoming bookings</p>
      </div>
      <button type="button" class="btn-primary" @click="showModal = true">
        <span aria-hidden="true">+</span> Book Appointment
      </button>
    </div>

    <div v-if="store.error" class="error-banner" role="alert">{{ store.error }}</div>

    <div class="layout">
      <BookingCalendar
        :marked-dates="store.datesWithAppointments"
        :selected-date="selectedDateKey"
        @date-click="onDateClick"
      />

      <div class="side-column">
        <section class="card-surface" aria-labelledby="upcoming-heading">
          <h2 id="upcoming-heading">Upcoming Appointments</h2>
          <p v-if="!store.upcomingMine.length" class="hint">
            No upcoming appointments. Book one to get started.
          </p>
          <ul class="appt-list">
            <li
              v-for="appt in store.upcomingMine.slice(0, 5)"
              :key="appt.id"
              class="appt-row"
              :class="{ active: selectedAppointment?.id === appt.id }"
            >
              <button type="button" class="appt-row-btn" @click="selectAppointment(appt)">
                <span class="avatar" :style="{ background: avatarColour(appt.providerName) }">
                  {{ initials(appt.providerName) }}
                </span>
                <span class="appt-row-info">
                  <strong>{{ appt.service }}</strong>
                  <span class="muted">{{ formatDateTime(appt.start) }}</span>
                </span>
                <span class="status-badge" :class="appt.status">{{ appt.status }}</span>
              </button>
            </li>
          </ul>
        </section>

        <section class="card-surface" aria-labelledby="details-heading">
          <div class="details-head">
            <h2 id="details-heading">Appointment Details</h2>
            <span v-if="selectedAppointment" class="status-badge" :class="selectedAppointment.status">
              {{ selectedAppointment.status }}
            </span>
          </div>

          <template v-if="selectedAppointment">
            <div class="details-provider">
              <span class="avatar large" :style="{ background: avatarColour(selectedAppointment.providerName) }">
                {{ initials(selectedAppointment.providerName) }}
              </span>
              <div>
                <strong>{{ selectedAppointment.service }}</strong>
                <p class="muted">{{ selectedAppointment.providerName }}</p>
              </div>
            </div>

            <dl class="details-list">
              <div><dt>Date</dt><dd>{{ formatDate(selectedAppointment.start) }}</dd></div>
              <div><dt>Time</dt><dd>{{ formatTimeRange(selectedAppointment) }}</dd></div>
            </dl>

            <div class="modal-actions" v-if="selectedAppointment.status !== 'cancelled'">
              <button type="button" class="btn-secondary" @click="cancel(selectedAppointment)">
                Cancel appointment
              </button>
            </div>
          </template>
          <p v-else class="hint">Select an appointment to see its details.</p>
        </section>
      </div>
    </div>

    <BookAppointmentModal v-model="showModal" @booked="onBooked" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useAppointmentsStore } from "@/stores/appointments";
import BookingCalendar from "@/components/booking/BookingCalendar.vue";
import BookAppointmentModal from "@/components/booking/BookAppointmentModal.vue";

const authStore = useAuthStore();
const store = useAppointmentsStore();

const showModal = ref(false);
const selectedAppointment = ref(null);
const selectedDateKey = ref(null);

onMounted(async () => {
  if (authStore.user) {
    await store.fetchMine(authStore.user.uid);
    selectedAppointment.value = store.upcomingMine[0] || null;
  }
});

function toDate(value) {
  return value && typeof value.toDate === "function" ? value.toDate() : new Date(value);
}

function onDateClick(dateKey) {
  selectedDateKey.value = dateKey;
  const [y, m, d] = dateKey.split("-").map(Number);
  const match = store.mine.find((a) => {
    const dt = toDate(a.start);
    return dt.getFullYear() === y && dt.getMonth() + 1 === m && dt.getDate() === d;
  });
  if (match) selectedAppointment.value = match;
}

function selectAppointment(appt) {
  selectedAppointment.value = appt;
  const dt = toDate(appt.start);
  selectedDateKey.value = `${dt.getFullYear()}-${dt.getMonth() + 1}-${dt.getDate()}`;
}

async function onBooked() {
  if (authStore.user) {
    await store.fetchMine(authStore.user.uid);
    selectedAppointment.value = store.upcomingMine[0] || null;
  }
}

async function cancel(appt) {
  if (!confirm(`Cancel your ${appt.service} appointment on ${formatDate(appt.start)}?`)) return;
  await store.cancelAppointment(appt);
}

function initials(name) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const AVATAR_COLOURS = ["#2F80ED", "#27AE60", "#9B51E0", "#BB4D00", "#8200DB"];
function avatarColour(name) {
  const hash = [...name].reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_COLOURS[hash % AVATAR_COLOURS.length];
}

function formatDate(value) {
  return toDate(value).toLocaleDateString("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
function formatDateTime(value) {
  const d = toDate(value);
  return `${formatDate(d)} · ${d.toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" })}`;
}
function formatTimeRange(appt) {
  const start = toDate(appt.start);
  const end = toDate(appt.end);
  const fmt = (d) => d.toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" });
  const minutes = Math.round((end - start) / 60000);
  return `${fmt(start)} · ${minutes} min`;
}
</script>

<style scoped>
.appointments-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 24px;
}
.page-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}
.page-head h1 {
  font-family: "Poppins", sans-serif;
  color: #101828;
  margin: 0;
}
.subtitle {
  color: #6a7282;
  margin: 4px 0 0;
}
.btn-primary {
  background: #2f80ed;
  color: #ffffff;
  border: none;
  padding: 10px 18px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.btn-primary:focus-visible,
.btn-secondary:focus-visible,
.appt-row-btn:focus-visible {
  outline: 2px solid #2f80ed;
  outline-offset: 2px;
}

.error-banner {
  background: #fee2e2;
  color: #b91c1c;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.layout {
  display: grid;
  grid-template-columns: 1.6fr 1fr;
  gap: 24px;
}
@media (max-width: 900px) {
  .layout {
    grid-template-columns: 1fr;
  }
}

.side-column {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.card-surface {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 24px;
}
.card-surface h2 {
  font-family: "Poppins", sans-serif;
  font-size: 1.05rem;
  color: #101828;
  margin: 0 0 16px;
}
.hint {
  color: #6a7282;
  font-size: 0.9rem;
}

.appt-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.appt-row-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  border: 1px solid transparent;
  border-radius: 10px;
  background: transparent;
  cursor: pointer;
  text-align: left;
}
.appt-row.active .appt-row-btn {
  background: #ebf4fd;
  border-color: #2f80ed;
}
.appt-row-btn:hover {
  background: #f3f4f6;
}
.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  color: #ffffff;
  display: grid;
  place-items: center;
  font-weight: 600;
  font-size: 0.8rem;
  flex-shrink: 0;
}
.avatar.large {
  width: 48px;
  height: 48px;
  font-size: 1rem;
}
.appt-row-info {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}
.appt-row-info strong {
  color: #101828;
  font-size: 0.9rem;
}
.muted {
  color: #6a7282;
  font-size: 0.8rem;
}

.status-badge {
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: capitalize;
  flex-shrink: 0;
}
.status-badge.confirmed {
  background: #eafaf1;
  color: #007a55;
}
.status-badge.pending {
  background: #fef9e7;
  color: #854d0e;
}
.status-badge.cancelled {
  background: #fee2e2;
  color: #b91c1c;
}

.details-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.details-provider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 16px 0;
}
.details-provider strong {
  color: #101828;
}
.details-list {
  margin: 16px 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.details-list div {
  display: flex;
  justify-content: space-between;
  border-bottom: 1px solid #f3f4f6;
  padding-bottom: 8px;
}
.details-list dt {
  color: #6a7282;
  font-size: 0.85rem;
}
.details-list dd {
  margin: 0;
  color: #101828;
  font-weight: 500;
  font-size: 0.85rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}
.btn-secondary {
  background: transparent;
  color: #b91c1c;
  border: 1px solid #fee2e2;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
}
</style>