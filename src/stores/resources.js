import { defineStore } from "pinia";
import { ref, computed } from "vue";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  runTransaction,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "@/firebase";
import { useAuthStore } from "@/stores/auth";

const SAVED_KEY = "carebridge:savedResources";

function loadSaved() {
  try {
    const raw = localStorage.getItem(SAVED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export const useResourcesStore = defineStore("resources", () => {
  const items = ref([]);
  const loading = ref(false);
  const error = ref(null);
  const searchQuery = ref("");
  const activeCategory = ref("All");
  const savedIds = ref(loadSaved());

  async function fetchAll() {
    loading.value = true;
    error.value = null;
    try {
      const q = query(
        collection(db, "resources"),
        orderBy("createdAt", "desc"),
      );
      const snap = await getDocs(q);
      items.value = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (err) {
      error.value = "Could not load resources. Please try again shortly.";
      console.error(err);
    } finally {
      loading.value = false;
    }
  }

  const categories = computed(() => {
    const set = new Set(items.value.map((r) => r.category));
    return ["All", ...Array.from(set).sort()];
  });

  const featured = computed(() => items.value.filter((r) => r.featured));

  const filtered = computed(() => {
    const q = searchQuery.value.trim().toLowerCase();
    return items.value.filter((r) => {
      const matchesCategory =
        activeCategory.value === "All" || r.category === activeCategory.value;
      const matchesQuery =
        !q ||
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  });

  function isSaved(id) {
    return savedIds.value.includes(id);
  }

  function toggleSaved(id) {
    savedIds.value = isSaved(id)
      ? savedIds.value.filter((x) => x !== id)
      : [...savedIds.value, id];
    localStorage.setItem(SAVED_KEY, JSON.stringify(savedIds.value));
  }

  async function fetchOne(id) {
    const snap = await getDoc(doc(db, "resources", id));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  }

  async function getMyRating(resourceId) {
    const authStore = useAuthStore();
    if (!authStore.user) return null;
    const snap = await getDoc(
      doc(db, "resources", resourceId, "ratings", authStore.user.uid),
    );
    return snap.exists() ? snap.data().score : null;
  }

  async function rateResource(resourceId, score) {
    const authStore = useAuthStore();
    if (!authStore.user) throw new Error("Sign in to rate a resource.");
    const uid = authStore.user.uid;
    const resourceRef = doc(db, "resources", resourceId);
    const ratingRef = doc(db, "resources", resourceId, "ratings", uid);

    await runTransaction(db, async (tx) => {
      const [resourceSnap, ratingSnap] = await Promise.all([
        tx.get(resourceRef),
        tx.get(ratingRef),
      ]);
      if (!resourceSnap.exists()) throw new Error("Resource no longer exists.");

      const data = resourceSnap.data();
      const prevAvg = data.ratingAvg ?? 0;
      const prevCount = data.ratingCount ?? 0;
      const prevSum = prevAvg * prevCount;

      let newCount = prevCount;
      let newSum;

      if (ratingSnap.exists()) {
        newSum = prevSum - ratingSnap.data().score + score;
      } else {
        newSum = prevSum + score;
        newCount = prevCount + 1;
      }

      tx.set(ratingRef, { score, updatedAt: new Date() });
      tx.update(resourceRef, {
        ratingAvg: newCount ? newSum / newCount : 0,
        ratingCount: newCount,
      });
    });

    const target = items.value.find((r) => r.id === resourceId);
    if (target) Object.assign(target, await fetchOne(resourceId));
  }

  return {
    items,
    loading,
    error,
    searchQuery,
    activeCategory,
    categories,
    featured,
    filtered,
    savedIds,
    isSaved,
    toggleSaved,
    fetchAll,
    fetchOne,
    getMyRating,
    rateResource,
  };
});
