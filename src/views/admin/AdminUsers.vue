<script setup>
import { ref, onMounted } from "vue";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/firebase";
import { formatDate, toTimestampNumber } from "@/utils/dates";
import InteractiveTable from "@/components/tables/InteractiveTable.vue";

const users = ref([]);
const loading = ref(true);
const error = ref(null);

onMounted(async () => {
  try {
    const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    users.value = snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
  } catch (err) {
    error.value = "Could not load users. " + err.message;
  } finally {
    loading.value = false;
  }
});

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
</script>

<template>
  <section class="admin-users">
    <header class="admin-page-header">
      <h1>Users</h1>
      <p class="text-muted">{{ users.length }} registered users</p>
    </header>

    <p v-if="loading">Loading users…</p>
    <p v-else-if="error" role="alert" class="text-danger">{{ error }}</p>

    <InteractiveTable
      v-else
      :columns="columns"
      :rows="users"
      row-key="uid"
      caption="CareBridge registered users, sortable and searchable"
    >
      <template #cell-role="{ value }">
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
.badge--admin {
  background: #f3eafd;
  color: #8200db;
}
.badge--user {
  background: #ebf4fd;
  color: #1447e6;
}
</style>
