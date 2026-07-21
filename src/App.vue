<script setup>
import { RouterView } from "vue-router";
import AppNavbar from "@/components/common/AppNavbar.vue";
import AppFooter from "@/components/common/AppFooter.vue";
import SkipLink from "@/components/common/SkipLink.vue";
</script>

<template>
  <SkipLink />
  <AppNavbar />
  <main id="main-content">
    <RouterView />
  </main>
  <AppFooter />
</template>
