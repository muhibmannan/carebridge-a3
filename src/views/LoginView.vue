<template>
  <div class="auth-page">
    <div class="auth-card">
      <router-link to="/" class="auth-brand">
        <span class="auth-brand-icon" aria-hidden="true">♥</span>
        <span>CareBridge</span>
      </router-link>

      <h1 class="auth-title">Welcome back</h1>
      <p class="auth-subtitle">
        Log in to manage your appointments, resources and support.
      </p>

      <form @submit.prevent="handleSubmit" novalidate>
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
          />
          <p
            v-if="fieldErrors.email"
            id="email-error"
            class="field-error"
            role="alert"
          >
            <span aria-hidden="true">⚠</span> {{ fieldErrors.email }}
          </p>
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <div class="password-field">
            <input
              id="password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              class="form-control"
              autocomplete="current-password"
              required
              :aria-invalid="!!fieldErrors.password"
              :aria-describedby="
                fieldErrors.password ? 'password-error' : undefined
              "
            />

            <button
              type="button"
              class="password-toggle"
              :aria-pressed="showPassword"
              :aria-label="showPassword ? 'Hide password' : 'Show password'"
              @click="showPassword = !showPassword"
            >
              {{ showPassword ? "Hide" : "Show" }}
            </button>
          </div>
          <p
            v-if="fieldErrors.password"
            id="password-error"
            class="field-error"
            role="alert"
          >
            <span aria-hidden="true">⚠</span> {{ fieldErrors.password }}
          </p>
        </div>

        <p v-if="authStore.error" class="form-alert" role="alert">
          <span aria-hidden="true">⚠</span> {{ authStore.error }}
        </p>

        <button type="submit" class="btn-primary" :disabled="authStore.loading">
          {{ authStore.loading ? "Logging in…" : "Log in" }}
        </button>
      </form>

      <p class="auth-switch">
        New to CareBridge?
        <router-link to="/register">Create an account</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const email = ref("");
const password = ref("");
const showPassword = ref(false);
const fieldErrors = reactive({ email: "", password: "" });

function validate() {
  fieldErrors.email = email.value ? "" : "Enter your email address.";
  fieldErrors.password = password.value ? "" : "Enter your password.";
  return !fieldErrors.email && !fieldErrors.password;
}

async function handleSubmit() {
  if (!validate()) return;
  try {
    await authStore.login({
      email: email.value.trim(),
      password: password.value,
    });

    const redirect = route.query.redirect;
    router.push(redirect ? { path: redirect } : { name: "home" });
  } catch {
  }
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
.password-field {
  position: relative;
}
.password-field .form-control {
  padding-right: 4rem;
}
.password-toggle {
  position: absolute;
  top: 50%;
  right: 0.5rem;
  transform: translateY(-50%);
  background: none;
  border: none;
  padding: 0.25rem 0.5rem;
  font-family: "Inter", sans-serif;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #1447e6;
  cursor: pointer;
  border-radius: 0.375rem;
}
.password-toggle:hover {
  background: #eff6ff;
}
.password-toggle:focus-visible {
  outline: 2px solid #2f80ed;
  outline-offset: 2px;
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
.btn-primary {
  width: 100%;
  background: #2f80ed;
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
