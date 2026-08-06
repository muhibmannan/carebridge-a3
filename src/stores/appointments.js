import { defineStore } from "pinia";
import {
  collection,
  getDocs,
  orderBy,
  query,
  where,
  doc,
  writeBatch,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/firebase";

const SLOT_MINUTES = 15;
const BUSINESS_START_HOUR = 9;
const BUSINESS_END_HOUR = 17;

function slugify(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function pad(n) {
  return String(n).padStart(2, "0");
}

function dateKey(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function timeKey(d) {
  return `${pad(d.getHours())}${pad(d.getMinutes())}`;
}

function slotsFor(providerId, start, end) {
  const slots = [];
  const cursor = new Date(start);
  while (cursor < end) {
    slots.push({
      id: `${providerId}__${dateKey(cursor)}__${timeKey(cursor)}`,
      dateKey: dateKey(cursor),
      timeKey: timeKey(cursor),
    });
    cursor.setMinutes(cursor.getMinutes() + SLOT_MINUTES);
  }
  return slots;
}

export function isWithinBusinessHours(start, end) {
  if (end <= start) return false;
  const day = start.getDay();
  if (day === 0 || day === 6) return false;
  const startMinutes = start.getHours() * 60 + start.getMinutes();
  const endMinutes = end.getHours() * 60 + end.getMinutes();
  return (
    startMinutes >= BUSINESS_START_HOUR * 60 &&
    endMinutes <= BUSINESS_END_HOUR * 60 &&
    start.getMinutes() % SLOT_MINUTES === 0
  );
}

export const useAppointmentsStore = defineStore("appointments", {
  state: () => ({
    items: [],
    mine: [],
    loading: false,
    error: null,
    booking: false,
    bookingError: null,
  }),
  getters: {
    upcomingMine(state) {
      const now = new Date();
      return state.mine
        .filter((a) => a.status !== "cancelled" && toDate(a.start) >= now)
        .sort((a, b) => toDate(a.start) - toDate(b.start));
    },
    datesWithAppointments(state) {
      return new Set(state.mine.map((a) => dateKey(toDate(a.start))));
    },
  },
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

    async fetchMine(uid) {
      this.loading = true;
      this.error = null;
      try {
        const q = query(
          collection(db, "appointments"),
          where("userId", "==", uid),
          orderBy("start", "desc"),
        );
        const snap = await getDocs(q);
        this.mine = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      } catch (err) {
        this.error = "Could not load your appointments. " + err.message;
      } finally {
        this.loading = false;
      }
    },

    async fetchTakenTimes({ providerId, dateKeyStr }) {
      const q = query(
        collection(db, "appointmentSlots"),
        where("providerId", "==", providerId),
        where("dateKey", "==", dateKeyStr),
      );
      const snap = await getDocs(q);
      return new Set(snap.docs.map((d) => d.data().timeKey));
    },

    async bookAppointment({ uid, providerId, providerName, service, start, durationMin }) {
      this.booking = true;
      this.bookingError = null;
      try {
        const end = new Date(start.getTime() + durationMin * 60000);

        if (!isWithinBusinessHours(start, end)) {
          throw new Error(
            "Appointments must fall within business hours (Mon–Fri, 9:00 AM–5:00 PM) on a 15-minute grid.",
          );
        }

        const batch = writeBatch(db);

        const apptRef = doc(collection(db, "appointments"));
        batch.set(apptRef, {
          userId: uid,
          providerName,
          service,
          start: Timestamp.fromDate(start),
          end: Timestamp.fromDate(end),
          status: "confirmed",
          createdAt: Timestamp.now(),
        });

        slotsFor(providerId, start, end).forEach((slot) => {
          const slotRef = doc(db, "appointmentSlots", slot.id);
          batch.set(slotRef, {
            appointmentId: apptRef.id,
            userId: uid,
            providerId,
            dateKey: slot.dateKey,
            timeKey: slot.timeKey,
            createdAt: Timestamp.now(),
          });
        });

        await batch.commit();
        return apptRef.id;
      } catch (err) {
        this.bookingError = mapBookingError(err);
        throw err;
      } finally {
        this.booking = false;
      }
    },

    async cancelAppointment(appointment) {
      const start = toDate(appointment.start);
      const end = toDate(appointment.end);
      const providerId = appointment.providerId || slugify(appointment.providerName);

      const batch = writeBatch(db);
      batch.update(doc(db, "appointments", appointment.id), { status: "cancelled" });

      slotsFor(providerId, start, end).forEach((slot) => {
        batch.delete(doc(db, "appointmentSlots", slot.id));
      });

      await batch.commit();

      const idx = this.mine.findIndex((a) => a.id === appointment.id);
      if (idx !== -1) this.mine[idx].status = "cancelled";
    },
  },
});

function toDate(value) {
  return value && typeof value.toDate === "function" ? value.toDate() : new Date(value);
}

function mapBookingError(err) {
  const code = err && err.code ? err.code : "";
  const msg = String(err && err.message ? err.message : err);
  if (
    code === "permission-denied" ||
    code === "PERMISSION_DENIED" ||
    msg.toLowerCase().includes("permission")
  ) {
    return "That time is no longer available. Please choose another slot.";
  }
  return msg;
}

export { dateKey, slugify };