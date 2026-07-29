<script setup>
import { onMounted } from "vue";
import { useAppointmentsStore } from "@/stores/appointments";
import { formatDate, formatTime, toTimestampNumber } from "@/utils/dates";
import InteractiveTable from "@/components/tables/InteractiveTable.vue";

const store = useAppointmentsStore();

onMounted(() => {
  store.fetchAll();
});

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
  <section class="admin-appointments">
    <header class="admin-page-header">
      <h1>Appointments</h1>
      <p class="text-muted">{{ store.items.length }} appointments</p>
    </header>

    <p v-if="store.loading">Loading appointments…</p>
    <p v-else-if="store.error" role="alert" class="text-danger">
      {{ store.error }}
    </p>

    <InteractiveTable
      v-else
      :columns="columns"
      :rows="store.items"
      row-key="id"
      caption="All CareBridge appointments, sortable and searchable"
    >
      <template #cell-status="{ value }">
        <span class="badge" :class="`badge--${value}`">{{ value }}</span>
      </template>
    </InteractiveTable>
  </section>
</template>

<style scoped>
.admin-page-header {
  margin-bottom: 1.25rem;
}
.admin-page-header h1 {
  font-family: "Poppins", sans-serif;
  color: #101828;
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
  color: #fb2c36;
}
</style>
