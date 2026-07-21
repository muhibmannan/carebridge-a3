import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";
import "./firebase";
import { useAuthStore } from "./stores/auth";

import "bootstrap/dist/css/bootstrap.min.css";
import "./assets/styles/_tokens.scss";

const app = createApp(App);
app.use(createPinia());

(async () => {
  const authStore = useAuthStore();
  await authStore.initAuthListener();

  app.use(router);
  app.mount("#app");
})();
