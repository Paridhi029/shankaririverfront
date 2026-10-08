/* ==========================================================================
   ADMIN CONFIGURATION (public/front-end side only).
   The admin PASSWORD is never stored here. It lives in the database as a
   hashed value and is created by the backend seed script using the
   ADMIN_EMAIL / ADMIN_INITIAL_PASSWORD values in backend/.env
   ========================================================================== */

/* ==========================================================================
   ADMIN CONFIGURATION
   ========================================================================== */

const ADMIN_CONFIG = {
  LOGIN_URL: "/admin.html?view=login",
  DASHBOARD_URL: "/admin.html?view=dashboard",
  SHOW_ADMIN_LINK_IN_FOOTER: false,
};