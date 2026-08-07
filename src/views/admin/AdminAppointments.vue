<script setup>
import { useAppointmentsStore } from "@/stores/appointments";
import { formatDate, formatTime, toTimestampNumber } from "@/utils/dates";
import InteractiveTable from "@/components/tables/InteractiveTable.vue";

const store = useAppointmentsStore();

const columns = [
  { key: "providerName", label: "Provider" },
  { key: "service", label: "Service" },
  {
    key: "startDate",
    label: "Date",
    format: (row) => formatDate(row.start),
    sortValue: (row) => toTimestampNumber(row.start),
  },
  {
    key: "startTime",
    label: "Time",
    format: (row) => formatTime(row.start),
    sortValue: (row) => toTimestampNumber(row.start),
  },
  { key: "status", label: "Status" },
];
</script>

<template>
  <section
    class="admin-appointments"
    aria-labelledby="admin-appointments-heading"
  >
    <header class="panel-header">
      <h2 id="admin-appointments-heading">Appointments</h2>
      <p class="panel-meta">{{ store.items.length }} appointments</p>
    </header>

    <p v-if="store.loading" class="panel-status">Loading appointments…</p>
    <p v-else-if="store.error" role="alert" class="error-text">
      {{ store.error }}
    </p>

    <InteractiveTable
      v-else
      :columns="columns"
      :rows="store.items"
      row-key="id"
      exportable
      export-name="carebridge-appointments"
      export-title="CareBridge — Appointments"
      caption="All CareBridge appointments, sortable, searchable and exportable"
    >
      <template #cell-status="{ value }">
        <span class="badge" :class="`badge--${value}`">{{ value }}</span>
      </template>
    </InteractiveTable>
  </section>
</template>

<style scoped>
.panel-header {
  margin-bottom: 1rem;
}

.panel-header h2 {
  font-family: "Poppins", sans-serif;
  font-size: 1.25rem;
  color: #101828;
  margin: 0;
}

.panel-meta {
  color: #6a7282;
  font-size: 0.9rem;
  margin: 0.2rem 0 0;
}

.panel-status {
  color: #4a5565;
}

.error-text {
  color: #b91c1c;
}

.badge {
  display: inline-block;
  padding: 0.15rem 0.6rem;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: capitalize;
}
.badge--confirmed {
  background: #ecfdf5;
  color: #007a55;
}
.badge--pending {
  background: #fef9e7;
  color: #854d0e;
}
.badge--cancelled {
  background: #fee2e2;
  color: #b91c1c;
}
</style>