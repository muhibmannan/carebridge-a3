import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import serviceAccount from "./serviceAccountKey.json" with { type: "json" };

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const day = (offset, hour, minute = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  d.setHours(hour, minute, 0, 0);
  return d;
};

const addMinutes = (date, minutes) =>
  new Date(date.getTime() + minutes * 60000);

const appointments = [
  [
    "seed-user-1",
    "Sarah Mitchell",
    "Physiotherapy",
    day(3, 10),
    60,
    "confirmed",
  ],
  [
    "seed-user-2",
    "Tom Walsh",
    "NDIS Planning Meeting",
    day(7, 14),
    45,
    "confirmed",
  ],
  [
    "seed-user-3",
    "Priya Nair",
    "Occupational Therapy",
    day(14, 11, 30),
    60,
    "pending",
  ],
  [
    "seed-user-1",
    "Amara Osei",
    "Support Coordination Review",
    day(-5, 9),
    30,
    "confirmed",
  ],
  ["seed-user-4", "Omar Khalil", "Speech Therapy", day(2, 13), 45, "confirmed"],
  [
    "seed-user-5",
    "Sara Rostami",
    "Physiotherapy",
    day(9, 15, 30),
    60,
    "confirmed",
  ],
  [
    "seed-user-2",
    "Grace Kim",
    "Assistive Technology Assessment",
    day(-2, 10),
    60,
    "cancelled",
  ],
  [
    "seed-user-6",
    "Tanvir Ahmed",
    "NDIS Planning Meeting",
    day(20, 9, 30),
    45,
    "pending",
  ],
  [
    "seed-user-3",
    "Layla Haddad",
    "Support Coordination Review",
    day(5, 11),
    30,
    "confirmed",
  ],
  [
    "seed-user-7",
    "Arjun Mehta",
    "Occupational Therapy",
    day(-10, 14, 30),
    60,
    "confirmed",
  ],
  ["seed-user-4", "Jordan Cole", "Speech Therapy", day(16, 10), 45, "pending"],
  ["seed-user-8", "Kian Farahani", "Physiotherapy", day(1, 9), 60, "confirmed"],
  [
    "seed-user-5",
    "Zanele Dlamini",
    "Assistive Technology Assessment",
    day(12, 13, 30),
    60,
    "confirmed",
  ],
  [
    "seed-user-6",
    "Lucas Novak",
    "Support Coordination Review",
    day(-1, 15),
    30,
    "cancelled",
  ],
  [
    "seed-user-7",
    "Emily Turner",
    "NDIS Planning Meeting",
    day(25, 10, 30),
    45,
    "pending",
  ],
];

const batch = db.batch();
appointments.forEach(
  ([userId, providerName, service, start, durationMin, status]) => {
    const ref = db.collection("appointments").doc();
    batch.set(ref, {
      userId,
      providerName,
      service,
      start: Timestamp.fromDate(start),
      end: Timestamp.fromDate(addMinutes(start, durationMin)),
      status,
      createdAt: Timestamp.now(),
    });
  },
);

await batch.commit();
console.log(`Seeded ${appointments.length} appointments.`);
