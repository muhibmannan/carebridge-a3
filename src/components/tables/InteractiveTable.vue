<script setup>
import { ref, reactive, computed, watch } from "vue";
import {
  exportRowsToCsv,
  exportRowsToPdf,
  dateStamp,
} from "@/utils/exporters";

const props = defineProps({
  columns: { type: Array, required: true },
  rows: { type: Array, required: true },
  rowKey: { type: String, default: "id" },
  caption: { type: String, required: true },
  pageSize: { type: Number, default: 10 },
  selectable: { type: Boolean, default: false },
  selected: { type: Array, default: () => [] },
  selectionLabel: { type: Function, default: null },
  // E.4 — data export
  exportable: { type: Boolean, default: false },
  exportName: { type: String, default: "carebridge-export" },
  exportTitle: { type: String, default: "CareBridge export" },
});

const emit = defineEmits(["update:selected"]);

const sortKey = ref(null);
const sortDir = ref("asc");
const columnFilters = reactive({});
const currentPage = ref(1);

function cellText(col, row) {
  return col.format ? col.format(row) : row[col.key];
}

function toggleSort(col) {
  if (col.sortable === false) return;
  if (sortKey.value === col.key) {
    sortDir.value = sortDir.value === "asc" ? "desc" : "asc";
  } else {
    sortKey.value = col.key;
    sortDir.value = "asc";
  }
  currentPage.value = 1;
}

function ariaSortFor(col) {
  if (col.sortable === false) return undefined;
  if (sortKey.value !== col.key) return "none";
  return sortDir.value === "asc" ? "ascending" : "descending";
}

const filteredRows = computed(() => {
  return props.rows.filter((row) =>
    props.columns.every((col) => {
      const term = (columnFilters[col.key] || "").trim().toLowerCase();
      if (!term) return true;
      const text = String(cellText(col, row) ?? "").toLowerCase();
      return text.includes(term);
    }),
  );
});

const sortedRows = computed(() => {
  if (!sortKey.value) return filteredRows.value;
  const col = props.columns.find((c) => c.key === sortKey.value);
  if (!col) return filteredRows.value;

  const getValue = col.sortValue || ((row) => cellText(col, row));
  const dir = sortDir.value === "asc" ? 1 : -1;

  return [...filteredRows.value].sort((a, b) => {
    const av = getValue(a);
    const bv = getValue(b);
    if (av == null && bv == null) return 0;
    if (av == null) return -1 * dir;
    if (bv == null) return 1 * dir;
    if (typeof av === "number" && typeof bv === "number")
      return (av - bv) * dir;
    return String(av).localeCompare(String(bv)) * dir;
  });
});

const totalPages = computed(() =>
  Math.max(1, Math.ceil(sortedRows.value.length / props.pageSize)),
);

const pagedRows = computed(() => {
  const start = (currentPage.value - 1) * props.pageSize;
  return sortedRows.value.slice(start, start + props.pageSize);
});

watch(totalPages, (total) => {
  if (currentPage.value > total) currentPage.value = total;
});

const rangeLabel = computed(() => {
  if (!sortedRows.value.length) return "No matching results";
  const start = (currentPage.value - 1) * props.pageSize + 1;
  const end = Math.min(
    currentPage.value * props.pageSize,
    sortedRows.value.length,
  );
  return `Showing ${start}–${end} of ${sortedRows.value.length}`;
});

const selectedSet = computed(() => new Set(props.selected));

function isSelected(row) {
  return selectedSet.value.has(row[props.rowKey]);
}

function toggleRow(row) {
  const key = row[props.rowKey];
  const next = new Set(selectedSet.value);
  if (next.has(key)) next.delete(key);
  else next.add(key);
  emit("update:selected", [...next]);
}

const allFilteredSelected = computed(
  () =>
    filteredRows.value.length > 0 &&
    filteredRows.value.every((row) => isSelected(row)),
);

const someFilteredSelected = computed(
  () =>
    !allFilteredSelected.value &&
    filteredRows.value.some((row) => isSelected(row)),
);

function toggleAllFiltered() {
  const next = new Set(selectedSet.value);
  if (allFilteredSelected.value) {
    filteredRows.value.forEach((row) => next.delete(row[props.rowKey]));
  } else {
    filteredRows.value.forEach((row) => next.add(row[props.rowKey]));
  }
  emit("update:selected", [...next]);
}

function labelFor(row) {
  if (props.selectionLabel) return props.selectionLabel(row);
  return String(row[props.rowKey]);
}

const columnCount = computed(
  () => props.columns.length + (props.selectable ? 1 : 0),
);

const exportRows = computed(() => {
  if (props.selectable && props.selected.length) {
    return sortedRows.value.filter((row) => isSelected(row));
  }
  return sortedRows.value;
});

const exportScopeLabel = computed(() => {
  const count = exportRows.value.length;
  const noun = count === 1 ? "row" : "rows";
  if (props.selectable && props.selected.length) {
    return `Exporting ${count} selected ${noun}`;
  }
  const isFiltered = filteredRows.value.length !== props.rows.length;
  return `Exporting ${count} ${isFiltered ? "filtered " : ""}${noun}`;
});

const exportSubtitle = computed(
  () =>
    `${exportRows.value.length} records · generated ${new Date().toLocaleString("en-AU")}`,
);

function onExportCsv() {
  exportRowsToCsv({
    columns: props.columns,
    rows: exportRows.value,
    filename: `${props.exportName}-${dateStamp()}.csv`,
  });
}

function onExportPdf() {
  exportRowsToPdf({
    columns: props.columns,
    rows: exportRows.value,
    filename: `${props.exportName}-${dateStamp()}.pdf`,
    title: props.exportTitle,
    subtitle: exportSubtitle.value,
  });
}
</script>

<template>
  <div class="interactive-table">
    <div class="table-bar">
      <p class="range-label" aria-live="polite">{{ rangeLabel }}</p>

      <div v-if="exportable" class="export-actions">
        <p class="export-scope" aria-live="polite">{{ exportScopeLabel }}</p>
        <button
          type="button"
          class="btn-export"
          :disabled="!exportRows.length"
          @click="onExportCsv"
        >
          Export CSV
        </button>
        <button
          type="button"
          class="btn-export"
          :disabled="!exportRows.length"
          @click="onExportPdf"
        >
          Export PDF
        </button>
      </div>
    </div>

    <div class="table-scroll">
      <table class="table">
        <caption class="visually-hidden">
          {{
            caption
          }}
        </caption>
        <thead>
          <tr>
            <th v-if="selectable" scope="col" class="select-cell">
              <input
                id="select-all-rows"
                type="checkbox"
                class="form-check-input"
                :checked="allFilteredSelected"
                :indeterminate.prop="someFilteredSelected"
                :disabled="!filteredRows.length"
                @change="toggleAllFiltered"
              />
              <label for="select-all-rows" class="visually-hidden">
                Select all {{ filteredRows.length }} matching rows
              </label>
            </th>
            <th
              v-for="col in columns"
              :key="col.key"
              scope="col"
              :aria-sort="ariaSortFor(col)"
            >
              <button
                v-if="col.sortable !== false"
                type="button"
                class="th-sort-btn"
                @click="toggleSort(col)"
              >
                {{ col.label }}
                <span class="sort-icon" aria-hidden="true">
                  <template v-if="sortKey === col.key">{{
                    sortDir === "asc" ? "▲" : "▼"
                  }}</template>
                  <template v-else>↕</template>
                </span>
              </button>
              <span v-else>{{ col.label }}</span>
            </th>
          </tr>
          <tr class="filter-row">
            <th v-if="selectable" scope="col" class="select-cell"></th>
            <th v-for="col in columns" :key="`${col.key}-filter`" scope="col">
              <template v-if="col.searchable !== false">
                <label :for="`filter-${col.key}`" class="visually-hidden">
                  Search {{ col.label }}
                </label>
                <input
                  :id="`filter-${col.key}`"
                  v-model="columnFilters[col.key]"
                  type="search"
                  class="form-control form-control-sm"
                  :placeholder="`Search ${col.label}`"
                />
              </template>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in pagedRows"
            :key="row[rowKey]"
            :class="{ 'row--selected': selectable && isSelected(row) }"
          >
            <td v-if="selectable" class="select-cell">
              <input
                :id="`select-${row[rowKey]}`"
                type="checkbox"
                class="form-check-input"
                :checked="isSelected(row)"
                @change="toggleRow(row)"
              />
              <label :for="`select-${row[rowKey]}`" class="visually-hidden">
                Select {{ labelFor(row) }}
              </label>
            </td>
            <td v-for="col in columns" :key="col.key">
              <slot
                :name="`cell-${col.key}`"
                :row="row"
                :value="cellText(col, row)"
              >
                {{ cellText(col, row) }}
              </slot>
            </td>
          </tr>
          <tr v-if="!pagedRows.length">
            <td :colspan="columnCount" class="empty-row">
              No matching results.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <nav
      v-if="totalPages > 1"
      class="table-pagination"
      aria-label="Table pagination"
    >
      <button
        type="button"
        class="btn btn-outline-secondary btn-sm"
        :disabled="currentPage === 1"
        @click="currentPage--"
      >
        Previous
      </button>
      <span aria-live="polite">Page {{ currentPage }} of {{ totalPages }}</span>
      <button
        type="button"
        class="btn btn-outline-secondary btn-sm"
        :disabled="currentPage === totalPages"
        @click="currentPage++"
      >
        Next
      </button>
    </nav>
  </div>
</template>

<style scoped>
.table-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.range-label {
  font-size: 0.875rem;
  color: #6a7282;
  margin: 0;
}

.export-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.export-scope {
  font-size: 0.8rem;
  color: #6a7282;
  margin: 0;
}

.btn-export {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  color: #364153;
  border-radius: 0.5rem;
  padding: 0.35rem 0.85rem;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-export:hover:not(:disabled) {
  background: #f3f4f6;
}

.btn-export:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-export:focus-visible {
  outline: 2px solid #2f80ed;
  outline-offset: 2px;
}

.table-scroll {
  overflow-x: auto;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
}

.table {
  width: 100%;
  margin-bottom: 0;
  border-collapse: collapse;
}

.table thead th {
  background: #f0f2f5;
  color: #101828;
  font-size: 0.85rem;
  text-align: left;
  padding: 0.6rem 0.75rem;
  border-bottom: 1px solid #e5e7eb;
  white-space: nowrap;
}

.filter-row th {
  background: #ffffff;
  padding: 0.4rem 0.5rem;
}

.select-cell {
  width: 2.75rem;
  text-align: center;
}

.select-cell .form-check-input {
  margin: 0;
  cursor: pointer;
}

.select-cell .form-check-input:focus-visible {
  outline: 2px solid #2f80ed;
  outline-offset: 2px;
}

.th-sort-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: none;
  border: none;
  padding: 0.15rem 0.25rem;
  font-weight: 600;
  color: inherit;
  cursor: pointer;
}

.th-sort-btn:focus-visible {
  outline: 2px solid #2f80ed;
  outline-offset: 2px;
  border-radius: 0.25rem;
}

.sort-icon {
  font-size: 0.7rem;
  color: #9ca3af;
}

.table tbody td {
  padding: 0.65rem 0.75rem;
  border-bottom: 1px solid #e5e7eb;
  color: #4a5565;
  font-size: 0.9rem;
}

.table tbody tr:hover {
  background: #f8fafc;
}

.table tbody tr.row--selected {
  background: #ebf4fd;
}

.empty-row {
  text-align: center;
  color: #6a7282;
  padding: 1.5rem;
}

.table-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-top: 0.75rem;
  font-size: 0.875rem;
  color: #4a5565;
}
</style>