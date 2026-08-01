const {onCall, HttpsError} = require("firebase-functions/v2/https");
const {defineSecret} = require("firebase-functions/params");
const {setGlobalOptions} = require("firebase-functions/v2");
const admin = require("firebase-admin");
const sgMail = require("@sendgrid/mail");
const PDFDocument = require("pdfkit");

admin.initializeApp();
setGlobalOptions({region: "australia-southeast1"});

const SENDGRID_API_KEY = defineSecret("SENDGRID_API_KEY");
const SENDGRID_FROM_EMAIL = defineSecret("SENDGRID_FROM_EMAIL");

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

      const callerSnap = await admin
          .firestore()
          .collection("users")
          .doc(request.auth.uid)
          .get();
      const callerRole = callerSnap.exists ? callerSnap.data().role : "user";

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
