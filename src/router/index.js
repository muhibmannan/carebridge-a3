import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth";

import HomeView from "@/views/HomeView.vue";
import LoginView from "@/views/LoginView.vue";
import RegisterView from "@/views/RegisterView.vue";

const routes = [
  {
    path: "/",
    name: "home",
    component: HomeView,
    meta: { title: "CareBridge" },
  },
  {
    path: "/login",
    name: "login",
    component: LoginView,
    meta: { title: "Log in — CareBridge", guestOnly: true },
  },
  {
    path: "/register",
    name: "register",
    component: RegisterView,
    meta: { title: "Register — CareBridge", guestOnly: true },
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior() {
    return { top: 0 };
  },
});

router.beforeEach((to) => {
  document.title = to.meta.title || "CareBridge";

  const authStore = useAuthStore();
  if (to.meta.guestOnly && authStore.isAuthenticated) {
    return { name: "home" };
  }
  return true;
});

export default router;
