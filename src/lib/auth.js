/* ============================================================
   Auth. Real accounts now (a Cloudflare Worker + KV backend at
   src/lib/api.js) - register/login hit the network and return a
   signed session token; there is no more fixed demo-account list.

   canOpenView / capsForRole / viewsForRole stay pure, dependency-free
   functions (just read constants.js) because the Worker imports them
   too, so client and server enforce the exact same rules.
   ============================================================ */
import { ROLE_VIEWS, ROLE_CAPS } from "./constants.js";
import { api } from "./api.js";

export function viewsForRole(role) {
  return ROLE_VIEWS[role] || ROLE_VIEWS.Staff;
}

export function canOpenView(role, key) {
  const allowed = viewsForRole(role);
  return allowed === "*" || allowed.includes(key);
}

export function capsForRole(role) {
  return ROLE_CAPS[role] || ROLE_CAPS.Staff;
}

/** Off by default; the demo deployment's build sets VITE_DEMO_MODE=true
    to show the one-click demo-account picker below. A real/production
    build (no env var set) gets a plain, empty sign-in form instead. */
export const DEMO_MODE = import.meta.env?.VITE_DEMO_MODE === "true";

/** Demo accounts a new visitor can try in one click - real accounts,
    same shared password, seeded by worker/seed-kv.mjs. Only ever shown
    when DEMO_MODE is on. */
export const DEMO_LOGINS = [
  { email: "wanjiku@kash.co.ke", name: "Wanjiku Kamande", role: "Super Admin" },
  { email: "peter.m@kash.co.ke", name: "Peter Mwangi", role: "Transport Manager" },
  { email: "kevin.mutua@gmail.com", name: "Kevin Mutua", role: "Driver" },
  { email: "aisha.n@kash.co.ke", name: "Aisha Noor", role: "Butchery Manager" },
  { email: "brian.o@kash.co.ke", name: "Brian Oduya", role: "Butchery Attendant" },
  { email: "daniel.k@kash.co.ke", name: "Daniel Kiprop", role: "Hospitality Manager" },
  { email: "linet.m@kash.co.ke", name: "Linet Moraa", role: "Hospitality Attendant" },
  { email: "victor.k@kash.co.ke", name: "Victor Kimani", role: "Accountant" },
  { email: "mercy.a@kash.co.ke", name: "Mercy Adhiambo", role: "Staff" },
];
export const DEMO_PASSWORD = "kash1234";

export function demoAccountForRole(role) {
  return DEMO_LOGINS.find((a) => a.role === role) || DEMO_LOGINS[0];
}

/** Both resolve to { token, user } or throw ApiError with a message
    fit to show the person directly. */
export const login = (email, password) => api.login({ email, password });
export const register = (name, email, phone, password) => api.register({ name, email, phone, password });
