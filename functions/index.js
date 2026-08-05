const {onCall, onRequest, HttpsError} = require("firebase-functions/v2/https");
const {defineSecret} = require("firebase-functions/params");
const {setGlobalOptions} = require("firebase-functions/v2");
const admin = require("firebase-admin");
const sgMail = require("@sendgrid/mail");
const PDFDocument = require("pdfkit");
const express = require("express");

admin.initializeApp();
setGlobalOptions({region: "australia-southeast1"});

const SENDGRID_API_KEY = defineSecret("SENDGRID_API_KEY");
const SENDGRID_FROM_EMAIL = defineSecret("SENDGRID_FROM_EMAIL");

const MAX_BULK_RECIPIENTS = 50;

exports.sendAppointmentEmail = onCall(
    {secrets: [SENDGRID_API_KEY, SENDGRID_FROM_EMAIL]},
    async (request) => {
      if (!request.auth) {
        throw new HttpsError("unauthenticated", "You must be signed in.");
      }

      const {appointmentId} = request.data || {};
      if (!appointmentId) {
        throw new HttpsError("invalid-argument", "appointmentId is required.");
      }

      const apptSnap = await admin
          .firestore()
          .collection("appointments")
          .doc(appointmentId)
          .get();

      if (!apptSnap.exists) {
        throw new HttpsError("not-found", "Appointment not found.");
      }
      const appt = apptSnap.data();

      const callerRole = await getCallerRole(request.auth.uid);

      if (appt.userId !== request.auth.uid && callerRole !== "admin") {
        throw new HttpsError(
            "permission-denied",
            "You can only email your own appointments.",
        );
      }

      const recipient = await admin.auth().getUser(appt.userId);
      if (!recipient.email) {
        throw new HttpsError(
            "failed-precondition",
            "No email address on file for this user.",
        );
      }

      const pdfBuffer = await buildAppointmentPdf(appt);
      const {date, time, endTime} = formatAppointmentTimes(appt);

      sgMail.setApiKey(SENDGRID_API_KEY.value());

      await sgMail.send({
        to: recipient.email,
        from: SENDGRID_FROM_EMAIL.value(),
        subject: `Your CareBridge appointment summary — ${appt.service}`,
        text: `Your ${appt.service} appointment with ${appt.providerName} ` +
          `is confirmed for ${date} at ${time}. A PDF summary is attached.`,
        html: `
          <p>Hi,</p>
          <p>Your appointment is confirmed:</p>
          <ul>
            <li><strong>Service:</strong> ${appt.service}</li>
            <li><strong>Provider:</strong> ${appt.providerName}</li>
            <li><strong>When:</strong> ${date} at ${time} – ${endTime}</li>
          </ul>
          <p>Your full summary is attached as a PDF.</p>
          <p>— CareBridge</p>
        `,
        attachments: [
          {
            content: pdfBuffer.toString("base64"),
            filename: `carebridge-appointment-${appointmentId}.pdf`,
            type: "application/pdf",
            disposition: "attachment",
          },
        ],
      });

      return {success: true, sentTo: recipient.email};
    },
);

exports.sendBulkEmail = onCall(
    {secrets: [SENDGRID_API_KEY, SENDGRID_FROM_EMAIL]},
    async (request) => {
      if (!request.auth) {
        throw new HttpsError("unauthenticated", "You must be signed in.");
      }

      const callerRole = await getCallerRole(request.auth.uid);
      if (callerRole !== "admin") {
        throw new HttpsError(
            "permission-denied",
            "Only administrators can send bulk email.",
        );
      }

      const {uids, subject, message} = request.data || {};

      if (!Array.isArray(uids) || uids.length === 0) {
        throw new HttpsError(
            "invalid-argument",
            "Select at least one recipient.",
        );
      }
      if (uids.length > MAX_BULK_RECIPIENTS) {
        throw new HttpsError(
            "invalid-argument",
            `A single send is limited to ${MAX_BULK_RECIPIENTS} recipients.`,
        );
      }
      if (!uids.every((uid) => typeof uid === "string" && uid.length > 0)) {
        throw new HttpsError("invalid-argument", "Invalid recipient list.");
      }
      if (typeof subject !== "string" || subject.trim().length === 0) {
        throw new HttpsError("invalid-argument", "A subject is required.");
      }
      if (subject.length > 150) {
        throw new HttpsError("invalid-argument", "Subject is too long.");
      }
      if (typeof message !== "string" || message.trim().length === 0) {
        throw new HttpsError("invalid-argument", "A message is required.");
      }
      if (message.length > 5000) {
        throw new HttpsError("invalid-argument", "Message is too long.");
      }

      const uniqueUids = [...new Set(uids)];
      const lookup = await admin
          .auth()
          .getUsers(uniqueUids.map((uid) => ({uid})));

      const addresses = lookup.users
          .map((user) => user.email)
          .filter((email) => Boolean(email));

      if (addresses.length === 0) {
        throw new HttpsError(
            "failed-precondition",
            "None of the selected users have an email address on file.",
        );
      }

      const safeSubject = escapeHtml(subject.trim());
      const safeBody = escapeHtml(message.trim()).replace(/\n/g, "<br>");

      sgMail.setApiKey(SENDGRID_API_KEY.value());

      await sgMail.sendMultiple({
        to: addresses,
        from: SENDGRID_FROM_EMAIL.value(),
        subject: subject.trim(),
        text: `${message.trim()}\n\n— CareBridge, on behalf of ` +
          "Enable Collective",
        html: `
          <h2 style="font-family:Poppins,Arial,sans-serif;color:#101828;">
            ${safeSubject}
          </h2>
          <div style="font-family:Inter,Arial,sans-serif;color:#4A5565;">
            ${safeBody}
          </div>
          <p style="font-family:Inter,Arial,sans-serif;color:#6A7282;
             font-size:12px;">
            Sent by CareBridge on behalf of Enable Collective.
          </p>
        `,
      });

      return {
        success: true,
        sent: addresses.length,
        skipped: uniqueUids.length - addresses.length,
      };
    },
);

const app = express();
const router = express.Router();

router.get("/resources", async (req, res) => {
  try {
    const limit = Math.min(
        Number.parseInt(req.query.limit, 10) || 50,
        100,
    );

    let ref = admin.firestore().collection("resources");
    if (req.query.category) {
      ref = ref.where("category", "==", String(req.query.category));
    }

    const snap = await ref.limit(limit).get();

    const resources = snap.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        title: d.title,
        category: d.category,
        description: d.description,
        url: d.url,
        ratingAvg: d.ratingAvg ?? null,
        ratingCount: d.ratingCount ?? 0,
      };
    });

    res.set("Cache-Control", "public, max-age=300");
    res.json({count: resources.length, resources});
  } catch (err) {
    console.error("GET /resources failed", err);
    res.status(500).json({error: "Could not load resources."});
  }
});

router.get("/appointments/stats", async (req, res) => {
  try {
    const snap = await admin.firestore().collection("appointments").get();

    const weeks = recentWeekKeys(8);
    const byWeek = Object.fromEntries(weeks.map((key) => [key, 0]));
    const byStatus = {};
    const earliest = weeks[0];

    snap.forEach((doc) => {
      const d = doc.data();

      const status = d.status || "unknown";
      byStatus[status] = (byStatus[status] || 0) + 1;

      const key = weekStartKey(toDate(d.start));
      if (key >= earliest && key in byWeek) {
        byWeek[key] += 1;
      }
    });

    res.set("Cache-Control", "public, max-age=300");
    res.json({
      total: snap.size,
      byStatus,
      byWeek,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("GET /appointments/stats failed", err);
    res.status(500).json({error: "Could not load appointment statistics."});
  }
});

app.use("/api", router);
app.use("/", router);

app.use((req, res) => {
  res.status(404).json({error: "Unknown endpoint."});
});

exports.api = onRequest({cors: true, invoker: "public"}, app);

async function getCallerRole(uid) {
  const snap = await admin.firestore().collection("users").doc(uid).get();
  return snap.exists ? snap.data().role || "user" : "user";
}

function escapeHtml(value) {
  return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
}

function weekStartKey(date) {
  const d = new Date(date.getTime());
  const offset = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - offset);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

function recentWeekKeys(count) {
  const keys = [];
  for (let i = count - 1; i >= 0; i -= 1) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i * 7);
    keys.push(weekStartKey(d));
  }
  return keys;
}

function toDate(value) {
  return value && value.toDate ? value.toDate() : new Date(value);
}

function formatAppointmentTimes(appt) {
  const start = toDate(appt.start);
  const end = toDate(appt.end);
  return {
    date: start.toLocaleDateString("en-AU", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    time: start.toLocaleTimeString("en-AU", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    endTime: end.toLocaleTimeString("en-AU", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}

function buildAppointmentPdf(appt) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({margin: 50});
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const {date, time, endTime} = formatAppointmentTimes(appt);

    doc.fontSize(20).fillColor("#2F80ED").text("CareBridge");
    doc.moveDown(0.3);
    doc.fontSize(14).fillColor("#101828").text("Appointment Summary");
    doc.moveDown();

    doc.fontSize(11).fillColor("#4A5565");
    doc.text(`Service: ${appt.service}`);
    doc.text(`Provider: ${appt.providerName}`);
    doc.text(`Date: ${date}`);
    doc.text(`Time: ${time} – ${endTime}`);
    doc.text(`Status: ${appt.status}`);
    doc.moveDown();

    doc
        .fontSize(9)
        .fillColor("#6A7282")
        .text(
            "This summary was generated automatically by CareBridge " +
          "on behalf of Enable Collective.",
        );

    doc.end();
  });
}
