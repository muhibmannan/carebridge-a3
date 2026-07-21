<script setup></script>

<template>
  <a class="skip-link" href="#main-content">Skip to main content</a>
</template>

<style scoped lang="scss">
.skip-link {
  position: absolute;
  top: -48px;
  left: 0;
  z-index: 1050;
  padding: 0.75rem 1.25rem;
  background: #101828;
  color: #ffffff;
  font-weight: 600;
  text-decoration: none;
  border-radius: 0 0 0.5rem 0;
  transition: top 0.15s ease-in-out;

  &:focus {
    top: 0;
    outline: 3px solid #2f80ed;
    outline-offset: 2px;
  }
}
</style>
