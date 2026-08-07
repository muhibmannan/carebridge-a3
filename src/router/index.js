import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth";

import HomeView from "@/views/HomeView.vue";
import LoginView from "@/views/LoginView.vue";
import RegisterView from "@/views/RegisterView.vue";
import ForbiddenView from "@/views/ForbiddenView.vue";
import ResourcesView from "@/views/ResourcesView.vue";
import ResourceDetailView from "@/views/ResourceDetailView.vue";

const AccessibilityView = () => import("@/views/AccessibilityView.vue");
const AdminLayout = () => import("@/views/admin/AdminLayout.vue");
const AdminOverview = () => import("@/views/admin/AdminOverview.vue");
const AdminUsersView = () => import("@/views/admin/AdminUsers.vue");
const AdminAppointmentsView = () =>
  import("@/views/admin/AdminAppointments.vue");
const MapView = () => import("@/views/MapView.vue");
const AppointmentsView = () => import("@/views/AppointmentsView.vue");

const routes = [
  {
    path: "/",
    name: "home",
    component: HomeView,
    meta: { title: "CareBridge — Support, simplified" },
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
    path: "/accessibility",
    name: "accessibility",
    component: AccessibilityView,
    meta: { title: "Accessibility statement — CareBridge" },
  },
  {
    path: "/resources",
    name: "resources",
    component: ResourcesView,
    meta: { title: "Resources — CareBridge" },
  },
  {
    path: "/resources/:id",
    name: "resource-detail",
    component: ResourceDetailView,
    meta: { title: "Resource — CareBridge" },
  },
  {
    path: "/map",
    name: "map",
    component: MapView,
    meta: { title: "Services near you — CareBridge" },
  },
  {
    path: "/appointments",
    name: "appointments",
    component: AppointmentsView,
    meta: { title: "Appointments — CareBridge", requiresAuth: true },
  },
  {
    path: "/admin",
    component: AdminLayout,
    meta: { requiresAuth: true, roles: ["admin"] },
    children: [
      {
        path: "",
        name: "admin",
        component: AdminOverview,
        meta: { title: "Admin dashboard — CareBridge" },
      },
      {
        path: "users",
        name: "admin-users",
        component: AdminUsersView,
        meta: { title: "Users — Admin — CareBridge" },
      },
      {
        path: "appointments",
        name: "admin-appointments",
        component: AdminAppointmentsView,
        meta: { title: "Appointments — Admin — CareBridge" },
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from) {
    const sameSection = to.matched[0] && to.matched[0] === from.matched[0];
    if (sameSection) return false;
    return { top: 0 };
  },
});

router.beforeEach((to) => {
  document.title = to.meta.title || "CareBridge";
  const authStore = useAuthStore();

  if (to.meta.guestOnly && authStore.isAuthenticated) return { name: "home" };
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { name: "login", query: { redirect: to.fullPath } };
  }
  if (to.meta.roles && !to.meta.roles.includes(authStore.role))
    return { name: "forbidden" };

  return true;
});

export default router;