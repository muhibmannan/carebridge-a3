<template>
  <div class="auth-page">
    <div class="auth-card">
      <router-link to="/" class="auth-brand">
        <span class="auth-brand-icon" aria-hidden="true">♥</span>
        <span>CareBridge</span>
      </router-link>

      <h1 class="auth-title">Create your account</h1>
      <p class="auth-subtitle">
        Join CareBridge to book appointments, save resources and connect with
        support.
      </p>

      <div
        v-if="submitted && errorList.length"
        ref="summaryRef"
        class="form-alert form-summary"
        role="alert"
        tabindex="-1"
      >
        <p class="summary-heading">
          <span aria-hidden="true">⚠</span>
          There
          {{
            errorList.length === 1
              ? "is 1 problem"
              : `are ${errorList.length} problems`
          }}
          with this form
        </p>
        <ul>
          <li v-for="item in errorList" :key="item.field">
            <button
              type="button"
              class="summary-link"
              @click="focusField(item.field)"
            >
              {{ item.label }}: {{ item.message }}
            </button>
          </li>
        </ul>
      </div>

      <form @submit.prevent="handleSubmit" novalidate>
        <div class="form-group">
          <label for="displayName">Full name</label>
          <input
            id="displayName"
            v-model="displayName"
            type="text"
            class="form-control"
            autocomplete="name"
            required
            :aria-invalid="!!fieldErrors.displayName"
            :aria-describedby="
              fieldErrors.displayName ? 'displayName-error' : undefined
            "
            @blur="handleBlur('displayName')"
            @input="handleInput('displayName')"
          />
          <p
            v-if="fieldErrors.displayName"
            id="displayName-error"
            class="field-error"
          >
            <span aria-hidden="true">⚠</span> {{ fieldErrors.displayName }}
          </p>
        </div>

        <div class="form-group">
          <label for="email">Email address</label>
          <input
            id="email"
            v-model="email"
            type="email"
            class="form-control"
            autocomplete="email"
            required
            :aria-invalid="!!fieldErrors.email"
            :aria-describedby="fieldErrors.email ? 'email-error' : undefined"
            @blur="handleBlur('email')"
            @input="handleInput('email')"
          />
          <p v-if="fieldErrors.email" id="email-error" class="field-error">
            <span aria-hidden="true">⚠</span> {{ fieldErrors.email }}
          </p>
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            class="form-control"
            autocomplete="new-password"
            required
            :aria-invalid="!!fieldErrors.password"
            :aria-describedby="
              fieldErrors.password
                ? 'password-error password-hint'
                : 'password-hint'
            "
            @blur="handleBlur('password')"
            @input="handleInput('password')"
          />
          <p id="password-hint" class="field-hint">
            At least 8 characters, with an uppercase letter, a lowercase letter
            and a number.
          </p>
          <p
            v-if="fieldErrors.password"
            id="password-error"
            class="field-error"
          >
            <span aria-hidden="true">⚠</span> {{ fieldErrors.password }}
          </p>
        </div>

        <div class="form-group">
          <label for="confirmPassword">Confirm password</label>
          <input
            id="confirmPassword"
            v-model="confirmPassword"
            type="password"
            class="form-control"
            autocomplete="new-password"
            required
            :aria-invalid="!!fieldErrors.confirmPassword"
            :aria-describedby="
              fieldErrors.confirmPassword ? 'confirmPassword-error' : undefined
            "
            @blur="handleBlur('confirmPassword')"
            @input="handleInput('confirmPassword')"
          />
          <p
            v-if="fieldErrors.confirmPassword"
            id="confirmPassword-error"
            class="field-error"
          >
            <span aria-hidden="true">⚠</span> {{ fieldErrors.confirmPassword }}
          </p>
        </div>

        <p v-if="authStore.error" class="form-alert" role="alert">
          <span aria-hidden="true">⚠</span> {{ authStore.error }}
        </p>

        <button type="submit" class="btn-primary" :disabled="authStore.loading">
          {{ authStore.loading ? "Creating account…" : "Create account" }}
        </button>
      </form>

      <p class="auth-switch">
        Already have an account?
        <router-link to="/login">Log in</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, nextTick } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import {
  validateRegisterForm,
  REGISTER_FIELDS,
  FIELD_LABELS,
} from "@/utils/validators";

const router = useRouter();
const authStore = useAuthStore();

const displayName = ref("");
const email = ref("");
const password = ref("");
const confirmPassword = ref("");

const fieldErrors = reactive({
  displayName: "",
  email: "",
  password: "",
  confirmPassword: "",
});

const touched = reactive({});
const submitted = ref(false);
const summaryRef = ref(null);

const errorList = computed(() =>
  REGISTER_FIELDS.filter((field) => fieldErrors[field]).map((field) => ({
    field,
    label: FIELD_LABELS[field],
    message: fieldErrors[field],
  })),
);

function runValidation() {
  const errors = validateRegisterForm({
    displayName: displayName.value,
    email: email.value,
    password: password.value,
    confirmPassword: confirmPassword.value,
  });

  REGISTER_FIELDS.forEach((field) => {
    fieldErrors[field] =
      errors[field] && (submitted.value || touched[field]) ? errors[field] : "";
  });

  return Object.keys(errors).length === 0;
}

function handleBlur(field) {
  touched[field] = true;
  runValidation();
}

function handleInput(field) {
  if (fieldErrors[field]) runValidation();
}

async function handleSubmit() {
  submitted.value = true;

  if (!runValidation()) {
    await nextTick();
    summaryRef.value?.focus();
    return;
  }

  try {
    await authStore.register({
      displayName: displayName.value.trim(),
      email: email.value.trim(),
      password: password.value,
    });
    router.push({ name: "home" });
  } catch {}
}

function focusField(field) {
  document.getElementById(field)?.focus();
}
</script>

<style scoped>
.auth-page {
  min-height: calc(100vh - 72px);
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f9fafb;
  padding: 2rem 1rem;
}
.auth-card {
  width: 100%;
  max-width: 420px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 1rem;
  padding: 2.5rem 2rem;
}
.auth-brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: "Poppins", sans-serif;
  font-weight: 700;
  font-size: 1.25rem;
  color: #101828;
  text-decoration: none;
  margin-bottom: 2rem;
}
.auth-brand-icon {
  width: 2rem;
  height: 2rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #2f80ed;
  color: #ffffff;
  border-radius: 0.5rem;
}
.auth-title {
  font-family: "Poppins", sans-serif;
  font-weight: 600;
  font-size: 1.5rem;
  color: #101828;
  margin-bottom: 0.25rem;
}
.auth-subtitle {
  font-family: "Inter", sans-serif;
  color: #4a5565;
  margin-bottom: 1.5rem;
}
.form-group {
  margin-bottom: 1.25rem;
}
.form-group label {
  display: block;
  font-family: "Inter", sans-serif;
  font-weight: 500;
  color: #364153;
  margin-bottom: 0.375rem;
}
.form-control {
  width: 100%;
  padding: 0.625rem 0.875rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  font-family: "Inter", sans-serif;
  color: #101828;
}
.form-control:focus {
  outline: 2px solid #2f80ed;
  outline-offset: 1px;
  border-color: #2f80ed;
}
.form-control[aria-invalid="true"] {
  border-color: #fb2c36;
}
.field-hint {
  font-family: "Inter", sans-serif;
  font-size: 0.8125rem;
  color: #6a7282;
  margin: 0.375rem 0 0;
}
.field-error {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  color: #b91c1c;
  font-size: 0.875rem;
  font-weight: 500;
  margin-top: 0.375rem;
}
.form-alert {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #fee2e2;
  color: #b91c1c;
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
  font-size: 0.9rem;
  margin-bottom: 1rem;
}
.form-summary {
  display: block;
  border: 1px solid #fb2c36;
}
.form-summary .summary-heading {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  margin: 0 0 0.5rem;
}
.form-summary ul {
  margin: 0;
  padding-left: 1.125rem;
  font-size: 0.875rem;
}
.summary-link {
  background: none;
  border: 0;
  padding: 0;
  color: #b91c1c;
  text-align: left;
  text-decoration: underline;
  cursor: pointer;
}
.summary-link:focus-visible {
  outline: 2px solid #b91c1c;
  outline-offset: 2px;
}
.btn-primary {
  width: 100%;
  background: #1a65cf;
  color: #ffffff;
  border: none;
  border-radius: 0.5rem;
  padding: 0.75rem;
  font-family: "Inter", sans-serif;
  font-weight: 600;
  cursor: pointer;
}
.btn-primary:hover:not(:disabled) {
  background: #1a65cf;
}
.btn-primary:focus-visible {
  outline: 2px solid #1447e6;
  outline-offset: 2px;
}
.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
.auth-switch {
  text-align: center;
  margin-top: 1.5rem;
  font-family: "Inter", sans-serif;
  color: #4a5565;
}
.auth-switch a {
  color: #1447e6;
  font-weight: 500;
}
</style>
