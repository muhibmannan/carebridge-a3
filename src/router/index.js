import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth";

import HomeView from "@/views/HomeView.vue";
import LoginView from "@/views/LoginView.vue";
import RegisterView from "@/views/RegisterView.vue";
import ForbiddenView from "@/views/ForbiddenView.vue";

const AdminDashboardView = () => import("@/views/admin/AdminDashboardView.vue");

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
  {
    path: "/forbidden",
    name: "forbidden",
    component: ForbiddenView,
    meta: { title: "Access denied — CareBridge" },
  },

  {
    path: "/admin",
    name: "admin",
    component: AdminDashboardView,
    meta: {
      title: "Admin dashboard — CareBridge",
      requiresAuth: true,
      roles: ["admin"],
    },
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

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { name: "login", query: { redirect: to.fullPath } };
  }

  if (to.meta.roles && !to.meta.roles.includes(authStore.role)) {
    return { name: "forbidden" };
  }

  return true;
});

export default router;
