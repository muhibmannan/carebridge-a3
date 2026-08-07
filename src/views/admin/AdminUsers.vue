<script setup>
import { ref, computed, inject } from "vue";
import { formatDate, toTimestampNumber } from "@/utils/dates";
import InteractiveTable from "@/components/tables/InteractiveTable.vue";
import BulkEmailModal from "@/components/admin/BulkEmailModal.vue";
import { AdminDataKey } from "./adminDataKey";

const admin = inject(AdminDataKey);

const users = computed(() =>
  [...admin.users.value].sort(
    (a, b) => toTimestampNumber(b.createdAt) - toTimestampNumber(a.createdAt),
  ),
);

const selectedUids = ref([]);
const showBulkEmail = ref(false);
const sendResult = ref(null);

const columns = [
  { key: "displayName", label: "Name" },
  { key: "email", label: "Email" },
  { key: "role", label: "Role" },
  {
    key: "createdAt",
    label: "Joined",
    format: (row) => formatDate(row.createdAt),
    sortValue: (row) => toTimestampNumber(row.createdAt),
  },
];

const selectedUsers = computed(() =>
  users.value.filter((u) => selectedUids.value.includes(u.uid)),
);

function selectionLabel(row) {
  return row.displayName || row.email;
}

function clearSelection() {
  selectedUids.value = [];
}

function onSent(result) {
  showBulkEmail.value = false;
  sendResult.value = result;
  clearSelection();
}
</script>

<template>
  <section class="admin-users" aria-labelledby="admin-users-heading">
    <header class="panel-header">
      <h2 id="admin-users-heading">Users</h2>
      <p class="panel-meta">{{ users.length }} registered users</p>
    </header>

    <div class="table-toolbar">
      <p class="selection-count" aria-live="polite">
        {{ selectedUids.length }} selected
      </p>
      <div class="toolbar-actions">
        <button
          v-if="selectedUids.length"
          type="button"
          class="btn-secondary"
          @click="clearSelection"
        >
          Clear selection
        </button>
        <button
          type="button"
          class="btn-primary"
          :disabled="!selectedUids.length"
          @click="showBulkEmail = true"
        >
          Email selected
        </button>
      </div>
    </div>

    <p v-if="sendResult" class="send-success" role="status">
      <span aria-hidden="true">✓ </span>Email sent to
      {{ sendResult.sent }} recipient{{ sendResult.sent === 1 ? "" : "s"
      }}<template v-if="sendResult.skipped">
        ({{ sendResult.skipped }} skipped — no email address on
        file)</template
      >.
    </p>

    <InteractiveTable
      v-model:selected="selectedUids"
      :columns="columns"
      :rows="users"
      row-key="uid"
      selectable
      exportable
      export-name="carebridge-users"
      export-title="CareBridge — Registered users"
      :selection-label="selectionLabel"
      caption="CareBridge registered users, sortable, searchable, selectable and exportable"
    >
      <template #cell-role="{ value }">
        <span class="badge" :class="`badge--${value}`">{{ value }}</span>
      </template>
    </InteractiveTable>

    <BulkEmailModal
      v-if="showBulkEmail"
      :recipients="selectedUsers"
      @close="showBulkEmail = false"
      @sent="onSent"
    />
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

.table-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 0.75rem;
}

.selection-count {
  font-size: 0.875rem;
  color: #4a5565;
  margin: 0;
}

.toolbar-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-primary,
.btn-secondary {
  border-radius: 0.5rem;
  padding: 0.45rem 1rem;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
}

.btn-primary {
  background: #2f80ed;
  border: 1px solid #2f80ed;
  color: #ffffff;
}

.btn-primary:hover:not(:disabled) {
  background: #1a65cf;
  border-color: #1a65cf;
}

.btn-secondary {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  color: #364153;
}

.btn-secondary:hover {
  background: #f3f4f6;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary:focus-visible,
.btn-secondary:focus-visible {
  outline: 2px solid #2f80ed;
  outline-offset: 2px;
}

.send-success {
  background: #ecfdf5;
  color: #007a55;
  border: 1px solid #27ae60;
  border-radius: 0.5rem;
  padding: 0.6rem 0.85rem;
  font-size: 0.875rem;
  margin-bottom: 0.75rem;
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
</style>