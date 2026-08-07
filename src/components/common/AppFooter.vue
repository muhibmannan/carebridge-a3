<script setup>
import { RouterLink } from "vue-router";
const year = new Date().getFullYear();
</script>

<template>
  <footer class="app-footer">
    <div class="container py-5">
      <div class="row gy-4">
        <div class="col-12 col-md-4">
          <div class="footer-brand">
            <span class="brand-icon" aria-hidden="true">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 21s-7.5-4.6-10-9.3C0.3 8 2 4 6 4c2.2 0 3.7 1.2 6 4 2.3-2.8 3.8-4 6-4 4 0 5.7 4 4 7.7C19.5 16.4 12 21 12 21z"
                  fill="white"
                />
              </svg>
            </span>
            CareBridge
          </div>
          <p class="footer-tagline">
            A platform by Enable Collective connecting people living with
            disabilities, families, carers and support workers with the services
            they need.
          </p>
        </div>

        <nav class="col-6 col-md-2" aria-label="Platform">
          <h2 class="footer-heading">Platform</h2>
          <ul class="footer-links">
            <li><RouterLink to="/resources">Resources</RouterLink></li>
            <li><RouterLink to="/map">Find Services</RouterLink></li>
            <li><RouterLink to="/register">Register</RouterLink></li>
            <li><RouterLink to="/login">Log in</RouterLink></li>
          </ul>
        </nav>

        <nav class="col-6 col-md-3" aria-label="Support">
          <h2 class="footer-heading">Support</h2>
          <ul class="footer-links">
            <li>
              <RouterLink to="/accessibility"
                >Accessibility statement</RouterLink
              >
            </li>
            <li>
              <a href="mailto:support@enablecollective.org.au"
                >Contact support</a
              >
            </li>
          </ul>
        </nav>

        <div class="col-12 col-md-3">
          <h2 class="footer-heading">Enable Collective</h2>
          <p class="footer-contact">
            42 Carlton St, Melbourne VIC 3053<br />
            <a href="mailto:hello@enablecollective.org.au"
              >hello@enablecollective.org.au</a
            >
          </p>
        </div>
      </div>

      <hr class="footer-divider" />

      <p class="footer-copy">
        © {{ year }} Enable Collective. All rights reserved.
      </p>
    </div>
  </footer>
</template>

<style scoped lang="scss">
.app-footer {
  background: #101828;
  color: #d1d5dc;
}

.footer-brand {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-family: "Poppins", sans-serif;
  font-weight: 700;
  font-size: 1.125rem;
  color: #ffffff;
  margin-bottom: 0.75rem;
}

.brand-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #2f80ed;
}

.footer-tagline {
  font-size: 0.9375rem;
  line-height: 1.6;
  max-width: 32ch;
}

.footer-heading {
  font-size: 0.8125rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #99a1af;
  font-weight: 600;
  margin-bottom: 0.9rem;
}

.footer-links {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;

  a {
    color: #d1d5dc;
    text-decoration: none;
    font-size: 0.9375rem;

    &:hover,
    &:focus-visible {
      color: #ffffff;
      text-decoration: underline;
    }
  }
}

.footer-contact {
  font-size: 0.9375rem;
  line-height: 1.6;

  a {
    color: #d1d5dc;
    &:hover,
    &:focus-visible {
      color: #ffffff;
    }
  }
}

.footer-divider {
  border-color: rgba(255, 255, 255, 0.1);
  margin: 2rem 0 1.5rem;
}

.footer-copy {
  font-size: 0.8125rem;
  color: #99a1af;
  margin: 0;
}

a:focus-visible {
  outline: 3px solid #2f80ed;
  outline-offset: 2px;
}
</style>