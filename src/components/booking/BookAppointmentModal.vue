<template>
  <div
    v-if="modelValue"
    class="modal-scrim"
    @click.self="close"
    @keydown.esc="close"
  >
    <div
      class="modal-card"
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-modal-title"
      @keydown.tab="trapFocus"
    >
      <div class="modal-head">
        <h2 id="booking-modal-title">Book Appointment</h2>
        <button type="button" class="close-btn" aria-label="Close" @click="close" ref="closeBtnRef">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
      </div>

      <form @submit.prevent="submit">
        <div class="field">
          <label for="provider">Provider &amp; service</label>
          <select id="provider" ref="firstFieldRef" v-model="providerId" required>
            <option value="" disabled>Select a provider</option>
            <option v-for="p in PROVIDERS" :key="p.id" :value="p.id">
              {{ p.name }} — {{ p.service }} ({{ p.durationMin }} min)
            </option>
          </select>
        </div>

        <div class="field">
          <label for="booking-date">Date</label>
          <input
            id="booking-date"
            type="date"
            v-model="selectedDate"
            :min="todayStr"
            required
          />
        </div>

        <div class="field" v-if="selectedDate && providerId">
          <label id="time-label">Available times</label>
          <div class="time-grid" role="group" aria-labelledby="time-label">
            <button
              v-for="t in candidateTimes"
              :key="t.value"
              type="button"
              class="time-chip"
              :class="{ selected: selectedTime === t.value, taken: t.taken }"
              :disabled="t.taken"
              :aria-pressed="selectedTime === t.value"
              @click="selectedTime = t.value"
            >
              {{ t.label }}
            </button>
          </div>
          <p v-if="!candidateTimes.length" class="hint">
            No times fit business hours (Mon–Fri, 9:00 AM–5:00 PM) for this service on that day.
          </p>
        </div>

        <p v-if="errorMsg" class="error-text" role="alert">{{ errorMsg }}</p>

        <div class="modal-actions">
          <button type="button" class="btn-secondary" @click="close">Cancel</button>
          <button type="submit" class="btn-primary" :disabled="!canSubmit || submitting">
            {{ submitting ? "Booking…" : "Confirm booking" }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from "vue";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/firebase";
import { useAuthStore } from "@/stores/auth";
import { useAppointmentsStore } from "@/stores/appointments";
import { PROVIDERS, providerById } from "@/data/providers";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
});
const emit = defineEmits(["update:modelValue", "booked"]);

const authStore = useAuthStore();
const appointmentsStore = useAppointmentsStore();

const providerId = ref("");
const selectedDate = ref("");
const selectedTime = ref("");
const takenTimes = ref(new Set());
const errorMsg = ref("");
const submitting = ref(false);
const firstFieldRef = ref(null);
const closeBtnRef = ref(null);

const todayStr = new Date().toISOString().slice(0, 10);

const BUSINESS_START = 9 * 60;
const BUSINESS_END = 17 * 60;

const candidateTimes = computed(() => {
  const provider = providerById(providerId.value);
  if (!provider) return [];
  const times = [];
  for (let m = BUSINESS_START; m + provider.durationMin <= BUSINESS_END; m += 15) {
    const hh = String(Math.floor(m / 60)).padStart(2, "0");
    const mm = String(m % 60).padStart(2, "0");
    const value = `${hh}${mm}`;
    const label = new Date(2000, 0, 1, Math.floor(m / 60), m % 60).toLocaleTimeString("en-AU", {
      hour: "numeric",
      minute: "2-digit",
    });
    times.push({ value, label, taken: takenTimes.value.has(value) });
  }
  return times;
});

const canSubmit = computed(
  () => providerId.value && selectedDate.value && selectedTime.value,
);

watch([providerId, selectedDate], async ([pid, dateStr]) => {
  selectedTime.value = "";
  takenTimes.value = new Set();
  if (!pid || !dateStr) return;
  const [y, m, d] = dateStr.split("-").map(Number);
  const dateKeyStr = `${y}-${m}-${d}`;
  takenTimes.value = await appointmentsStore.fetchTakenTimes({
    providerId: pid,
    dateKeyStr,
  });
});

watch(
  () => props.modelValue,
  async (open) => {
    if (open) {
      providerId.value = "";
      selectedDate.value = "";
      selectedTime.value = "";
      errorMsg.value = "";
      await nextTick();
      firstFieldRef.value?.focus();
    }
  },
);

function close() {
  emit("update:modelValue", false);
}

function trapFocus(e) {
  const focusables = e.currentTarget.querySelectorAll(
    "select, input, button:not([disabled])",
  );
  if (!focusables.length) return;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

async function submit() {
  if (!canSubmit.value || !authStore.user) return;
  errorMsg.value = "";
  submitting.value = true;
  try {
    const provider = providerById(providerId.value);
    const [y, m, d] = selectedDate.value.split("-").map(Number);
    const hh = Number(selectedTime.value.slice(0, 2));
    const mm = Number(selectedTime.value.slice(2, 4));
    const start = new Date(y, m - 1, d, hh, mm);

    const appointmentId = await appointmentsStore.bookAppointment({
      uid: authStore.user.uid,
      providerId: provider.id,
      providerName: provider.name,
      service: provider.service,
      start,
      durationMin: provider.durationMin,
    });

    try {
      await httpsCallable(functions, "sendAppointmentEmail")({ appointmentId });
    } catch (emailErr) {
      console.warn("Booking confirmed, but summary email failed:", emailErr);
    }

    emit("booked", appointmentId);
    close();
  } catch (err) {
    errorMsg.value = appointmentsStore.bookingError || err.message || "Could not book that appointment.";
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.modal-scrim {
  position: fixed;
  inset: 0;
  background: rgba(31, 41, 55, 0.5);
  display: grid;
  place-items: center;
  z-index: 1000;
  padding: 16px;
}
.modal-card {
  background: #ffffff;
  border-radius: 16px;
  width: 100%;
  max-width: 460px;
  max-height: 90vh;
  overflow-y: auto;
  padding: 24px;
}
.modal-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.modal-head h2 {
  font-family: "Poppins", sans-serif;
  font-size: 1.15rem;
  color: #101828;
  margin: 0;
}
.close-btn {
  border: none;
  background: transparent;
  color: #4a5565;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  cursor: pointer;
}
.close-btn:hover {
  background: #f3f4f6;
}
.close-btn:focus-visible,
select:focus-visible,
input:focus-visible,
.time-chip:focus-visible,
button:focus-visible {
  outline: 2px solid #2f80ed;
  outline-offset: 2px;
}

.field {
  margin-bottom: 18px;
}
.field label {
  display: block;
  font-size: 0.85rem;
  font-weight: 500;
  color: #364153;
  margin-bottom: 6px;
}
.field select,
.field input[type="date"] {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5dc;
  border-radius: 8px;
  font-family: "Inter", sans-serif;
  font-size: 0.95rem;
  color: #101828;
}

.time-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
  gap: 8px;
}
.time-chip {
  padding: 8px 4px;
  border: 1px solid #d1d5dc;
  border-radius: 8px;
  background: #ffffff;
  font-size: 0.85rem;
  color: #364153;
  cursor: pointer;
}
.time-chip.selected {
  background: #1a65cf;
  color: #ffffff;
  border-color: #1a65cf;
}
.time-chip.taken {
  background: #f3f4f6;
  color: #99a1af;
  text-decoration: line-through;
  cursor: not-allowed;
}
.hint {
  font-size: 0.85rem;
  color: #6a7282;
  margin-top: 8px;
}

.error-text {
  color: #b91c1c;
  font-size: 0.9rem;
  margin-bottom: 12px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 8px;
}
.btn-primary {
  background: #1a65cf;
  color: #ffffff;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}
.btn-primary:disabled {
  background: #99a1af;
  cursor: not-allowed;
}
.btn-secondary {
  background: transparent;
  color: #4a5565;
  border: 1px solid #d1d5dc;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
}
</style>