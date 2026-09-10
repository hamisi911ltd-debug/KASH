/* ============================================================
   Demo authentication.

   There is no backend here, so "auth" means: a fixed set of demo
   accounts (one per role) that sign in with any non-empty password,
   plus a session persisted to localStorage. Swapping this for a real
   API later only touches this file and StoreProvider's `session`.
   ============================================================ */

export const DEMO_ACCOUNTS = [
  { email: "wanjiku@nexoraone.co.ke", name: "Wanjiku Kamande", role: "Super Admin" },
  { email: "peter.m@nexoraone.co.ke", name: "Peter Mwangi", role: "Transport Manager" },
  { email: "aisha.n@nexoraone.co.ke", name: "Aisha Noor", role: "Food Manager" },
  { email: "daniel.k@nexoraone.co.ke", name: "Daniel Kiprop", role: "Hospitality Manager" },
  { email: "victor.k@nexoraone.co.ke", name: "Victor Kimani", role: "Accountant" },
  { email: "mercy.a@nexoraone.co.ke", name: "Mercy Adhiambo", role: "Staff" },
];

export function findAccount(email) {
  const e = (email || "").trim().toLowerCase();
  return DEMO_ACCOUNTS.find((a) => a.email === e);
}

export function accountForRole(role) {
  return DEMO_ACCOUNTS.find((a) => a.role === role) || DEMO_ACCOUNTS[0];
}

import { ROLE_VIEWS, ROLE_CAPS } from "./constants";

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
