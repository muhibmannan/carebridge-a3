import { defineStore } from "pinia";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/firebase";

export const useAppointmentsStore = defineStore("appointments", {
  state: () => ({
    items: [],
    loading: false,
    error: null,
  }),
  actions: {
    async fetchAll() {
      this.loading = true;
      this.error = null;
      try {
        const q = query(
          collection(db, "appointments"),
          orderBy("start", "desc"),
        );
        const snap = await getDocs(q);
        this.items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      } catch (err) {
        this.error = "Could not load appointments. " + err.message;
      } finally {
        this.loading = false;
      }
    },
  },
});
