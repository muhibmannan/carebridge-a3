<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from "vue";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/firebase";

const props = defineProps({
  recipients: { type: Array, required: true },
  maxRecipients: { type: Number, default: 50 },
});

const emit = defineEmits(["close", "sent"]);

const subject = ref("");
const message = ref("");
const sending = ref(false);
const formError = ref(null);
const fieldErrors = ref({ subject: null, message: null });

const dialogRef = ref(null);
const subjectRef = ref(null);
let previouslyFocused = null;

const tooMany = computed(() => props.recipients.length > props.maxRecipients);

const previewNames = computed(() =>
  props.recipients
    .slice(0, 5)
    .map((r) => r.displayName || r.email)
    .join(", "),
);

function validate() {
  fieldErrors.value = { subject: null, message: null };

  if (!subject.value.trim()) {
    fieldErrors.value.subject = "Enter a subject line.";
  } else if (subject.value.length > 150) {
    fieldErrors.value.subject = "Keep the subject under 150 characters.";
  }

  if (!message.value.trim()) {
    fieldErrors.value.message = "Enter a message.";
  } else if (message.value.length > 5000) {
    fieldErrors.value.message = "Keep the message under 5000 characters.";
  }

  return !fieldErrors.value.subject && !fieldErrors.value.message;
}

async function submit() {
  formError.value = null;
  if (!validate() || tooMany.value) return;

  sending.value = true;
  try {
    const sendBulkEmail = httpsCallable(functions, "sendBulkEmail");
    const result = await sendBulkEmail({
      uids: props.recipients.map((r) => r.uid),
      subject: subject.value.trim(),
      message: message.value.trim(),
    });
    emit("sent", result.data);
  } catch (err) {
    formError.value = err.message || "The email could not be sent.";
  } finally {
    sending.value = false;
  }
}

const FOCUSABLE =
  'button:not([disabled]), input:not([disabled]), textarea:not([disabled]),' +
  ' a[href], [tabindex]:not([tabindex="-1"])';

function onKeydown(event) {
  if (event.key === "Escape" && !sending.value) {
    emit("close");
    return;
  }
  if (event.key !== "Tab" || !dialogRef.value) return;

  const focusable = [...dialogRef.value.querySelectorAll(FOCUSABLE)];
  if (!focusable.length) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

onMounted(() => {
  previouslyFocused = document.activeElement;
  document.addEventListener("keydown", onKeydown);
  nextTick(() => subjectRef.value?.focus());
});

onBeforeUnmount(() => {
  document.removeEventListener("keydown", onKeydown);
  previouslyFocused?.focus?.();
});
</script>

<template>
  <div class="modal-scrim" @mousedown.self="!sending && emit('close')">
    <div
      ref="dialogRef"
      class="modal-card"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bulk-email-title"
    >
      <h2 id="bulk-email-title">Email selected users</h2>
      <p class="recipient-summary">
        {{ recipients.length }} recipient{{ recipients.length === 1 ? "" : "s" }}
        <span v-if="previewNames" class="recipient-names">
          — {{ previewNames
          }}<template v-if="recipients.length > 5">
            and {{ recipients.length - 5 }} more</template
          >
        </span>
      </p>

      <p v-if="tooMany" class="form-error" role="alert">
        A single send is limited to {{ maxRecipients }} recipients. Deselect
        {{ recipients.length - maxRecipients }} to continue.
      </p>

      <div class="field">
        <label for="bulk-subject">Subject</label>
        <input
          id="bulk-subject"
          ref="subjectRef"
          v-model="subject"
          type="text"
          class="form-control"
          maxlength="150"
          :aria-invalid="Boolean(fieldErrors.subject)"
          :aria-describedby="fieldErrors.subject ? 'bulk-subject-error' : undefined"
        />
        <p v-if="fieldErrors.subject" id="bulk-subject-error" class="field-error" role="alert">
          <span aria-hidden="true">⚠ </span>{{ fieldErrors.subject }}
        </p>
      </div>

      <div class="field">
        <label for="bulk-message">Message</label>
        <textarea
          id="bulk-message"
          v-model="message"
          class="form-control"
          rows="6"
          maxlength="5000"
          :aria-invalid="Boolean(fieldErrors.message)"
          :aria-describedby="fieldErrors.message ? 'bulk-message-error' : undefined"
        ></textarea>
        <p v-if="fieldErrors.message" id="bulk-message-error" class="field-error" role="alert">
          <span aria-hidden="true">⚠ </span>{{ fieldErrors.message }}
        </p>
      </div>

      <p v-if="formError" class="form-error" role="alert">
        <span aria-hidden="true">⚠ </span>{{ formError }}
      </p>

      <p class="privacy-note">
        Each recipient receives their own copy — addresses are never shared
        between participants.
      </p>

      <div class="modal-actions">
        <button
          type="button"
          class="btn-secondary"
          :disabled="sending"
          @click="emit('close')"
        >
          Cancel
        </button>
        <button
          type="button"
          class="btn-primary"
          :disabled="sending || tooMany || !recipients.length"
          @click="submit"
        >
          {{ sending ? "Sending…" : `Send to ${recipients.length}` }}
        </button>
      </div>
      <p v-if="sending" class="visually-hidden" aria-live="polite">
        Sending email, please wait.
      </p>
    </div>
  </div>
</template>

<style scoped>
.modal-scrim {
  position: fixed;
  inset: 0;
  background: rgba(31, 41, 55, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  z-index: 1050;
}

.modal-card {
  background: #ffffff;
  border-radius: 0.75rem;
  padding: 1.5rem;
  width: 100%;
  max-width: 34rem;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(16, 24, 40, 0.15);
}

.modal-card h2 {
  font-family: "Poppins", sans-serif;
  font-size: 1.25rem;
  color: #101828;
  margin-bottom: 0.25rem;
}

.recipient-summary {
  font-size: 0.875rem;
  color: #4a5565;
  margin-bottom: 1rem;
}

.recipient-names {
  color: #6a7282;
}

.field {
  margin-bottom: 1rem;
}

.field label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: #364153;
  margin-bottom: 0.25rem;
}

.form-control {
  width: 100%;
  border: 1px solid #d1d5dc;
  border-radius: 0.5rem;
  padding: 0.5rem 0.75rem;
  font-family: "Inter", sans-serif;
  font-size: 0.9rem;
  color: #101828;
}

.form-control:focus-visible {
  outline: 2px solid #2f80ed;
  outline-offset: 1px;
  border-color: #2f80ed;
}

.field-error,
.form-error {
  color: #b91c1c;
  font-size: 0.85rem;
  margin-top: 0.35rem;
}

.privacy-note {
  font-size: 0.8rem;
  color: #6a7282;
  margin-bottom: 1rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.btn-primary,
.btn-secondary {
  border-radius: 0.5rem;
  padding: 0.5rem 1.1rem;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
}

.btn-primary {
  background: #1a65cf;
  border: 1px solid #1a65cf;
  color: #ffffff;
}

.btn-primary:hover:not(:disabled) {
  background: #1557b0;
  border-color: #1a65cf;
}

.btn-secondary {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  color: #364153;
}

.btn-secondary:hover:not(:disabled) {
  background: #f3f4f6;
}

.btn-primary:disabled,
.btn-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary:focus-visible,
.btn-secondary:focus-visible {
  outline: 2px solid #2f80ed;
  outline-offset: 2px;
}
</style>
