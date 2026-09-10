/* ============================================================
   Shared constants. Colours resolve to CSS custom properties so
   anything using them retints automatically in dark mode.
   ============================================================ */

export const C = {
  bg: "var(--bg)",
  surface: "var(--surface)",
  surface2: "var(--surface-2)",
  surface3: "var(--surface-3)",
  line: "var(--line)",
  lineStrong: "var(--line-strong)",
  ink: "var(--ink)",
  ink2: "var(--ink-2)",
  muted: "var(--muted)",
  faint: "var(--faint)",

  blue: "var(--blue)",
  blueSoft: "var(--blue-soft)",
  emerald: "var(--emerald)",
  emeraldSoft: "var(--emerald-soft)",
  amber: "var(--amber)",
  amberSoft: "var(--amber-soft)",
  coral: "var(--coral)",
  coralSoft: "var(--coral-soft)",
  violet: "var(--violet)",
  violetSoft: "var(--violet-soft)",
  slateSoft: "var(--slate-soft)",

  navy: "var(--navy)",
  navy2: "var(--navy-2)",
  navy3: "var(--navy-3)",

  shadowSm: "var(--shadow-sm)",
  shadowMd: "var(--shadow-md)",
  shadowLg: "var(--shadow-lg)",
};

/* Recharts renders to SVG attributes, which do not accept var(); these are
   the resolved hex values, picked per theme by useChartPalette(). */
export const CHART_PALETTE = {
  light: {
    blue: "#2f6fed",
    emerald: "#0ea678",
    amber: "#e08526",
    coral: "#ea5a4c",
    violet: "#7c5cf0",
    grid: "#e8edf5",
    axis: "#64748b",
    tooltipBg: "#ffffff",
    tooltipLine: "#e3e8f0",
    tooltipInk: "#0f172a",
  },
  dark: {
    blue: "#5b8def",
    emerald: "#2dd4a7",
    amber: "#f5a94e",
    coral: "#ff7c6e",
    violet: "#a48afb",
    grid: "#1e2a41",
    axis: "#8a97ab",
    tooltipBg: "#141d30",
    tooltipLine: "#2a3852",
    tooltipInk: "#e9eef7",
  },
};

export const DIVISIONS = ["Transport", "Food", "Hospitality", "General"];

export const DIVISION_META = {
  Transport: { color: C.emerald, chart: "emerald", tone: "emerald" },
  Food: { color: C.amber, chart: "amber", tone: "amber" },
  Hospitality: { color: C.coral, chart: "coral", tone: "coral" },
  General: { color: C.violet, chart: "violet", tone: "violet" },
};

export const ROLES = [
  "Super Admin",
  "Admin",
  "Transport Manager",
  "Food Manager",
  "Hospitality Manager",
  "Accountant",
  "Staff",
];

/* Which views each role may open. */
export const ROLE_VIEWS = {
  "Super Admin": "*",
  Admin: "*",
  "Transport Manager": ["overview", "transport", "expenses", "reports", "updates", "settings"],
  "Food Manager": ["overview", "food", "expenses", "reports", "updates", "settings"],
  "Hospitality Manager": ["overview", "hospitality", "expenses", "reports", "updates", "settings"],
  Accountant: ["overview", "all", "expenses", "reports", "updates", "settings"],
  Staff: ["overview", "updates", "settings"],
};

/* Roles allowed to create/edit/delete records, and to manage people. */
export const ROLE_CAPS = {
  "Super Admin": { write: true, manageUsers: true, deleteAny: true, settings: true },
  Admin: { write: true, manageUsers: true, deleteAny: true, settings: true },
  "Transport Manager": { write: true, manageUsers: false, deleteAny: true, settings: false },
  "Food Manager": { write: true, manageUsers: false, deleteAny: true, settings: false },
  "Hospitality Manager": { write: true, manageUsers: false, deleteAny: true, settings: false },
  Accountant: { write: true, manageUsers: false, deleteAny: false, settings: false },
  Staff: { write: false, manageUsers: false, deleteAny: false, settings: false },
};

export const PERIODS = ["Today", "Last 7 days", "This Month", "Last 90 days", "This Year", "All Time"];

export const PAYMENT_METHODS = ["M-Pesa", "Bank Transfer", "Cash", "Card", "Cheque"];

export const EXPENSE_CATEGORIES = [
  "Fuel",
  "Maintenance",
  "Supplies",
  "Utilities",
  "Salaries",
  "Rent",
  "Licensing",
  "Insurance",
  "Marketing",
  "Other",
];

export const VEHICLE_TYPES = ["Bus", "Shuttle", "Truck", "Van", "Saloon"];
export const ROOM_TYPES = ["Standard", "Deluxe", "Executive Suite", "Family"];
export const TRIP_STATUSES = ["Scheduled", "In Transit", "Completed", "Cancelled"];
export const ORDER_STATUSES = ["Preparing", "Out for Delivery", "Delivered", "Cancelled"];
export const BOOKING_STATUSES = ["Confirmed", "Checked In", "Checked Out", "Cancelled"];
export const PAYMENT_STATUSES = ["Paid", "Partial", "Pending"];
export const DRIVER_STATUSES = ["On Duty", "Off Duty", "On Leave"];
export const VEHICLE_STATUSES = ["Active", "Maintenance", "Inactive"];
export const ROOM_STATUSES = ["Available", "Cleaning", "Maintenance"];

/* Status -> badge tone. Occupied/In Transit read as "working", not "bad". */
const STATUS_TONES = {
  Completed: "emerald",
  Delivered: "emerald",
  "Checked In": "emerald",
  Active: "emerald",
  Paid: "emerald",
  Available: "emerald",
  "On Duty": "emerald",
  Occupied: "blue",
  "In Transit": "blue",
  Preparing: "blue",
  "Out for Delivery": "blue",
  Confirmed: "blue",
  Scheduled: "blue",
  Pending: "amber",
  Partial: "amber",
  Cleaning: "amber",
  Invited: "amber",
  Maintenance: "amber",
  "On Leave": "amber",
  "Checked Out": "slate",
  "Off Duty": "slate",
  Cancelled: "coral",
  Inactive: "coral",
  Suspended: "coral",
  Overdue: "coral",
};

export function statusTone(status) {
  return STATUS_TONES[status] || "slate";
}

export const STORAGE_KEY = "nexora.data.v1";
export const PREFS_KEY = "nexora.prefs.v1";
export const THEME_KEY = "nexora.theme";
export const SESSION_KEY = "nexora.session.v1";
