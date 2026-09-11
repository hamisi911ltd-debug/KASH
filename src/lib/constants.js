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
    blue: "#1E6CA8",
    emerald: "#12958A",
    amber: "#CE9114",
    coral: "#C82E58",
    violet: "#4B6C8A",
    grid: "#E8EDF4",
    axis: "#647689",
    tooltipBg: "#ffffff",
    tooltipLine: "#E4E9F0",
    tooltipInk: "#142230",
  },
  dark: {
    blue: "#5AA0D6",
    emerald: "#3FBFAE",
    amber: "#F0B44A",
    coral: "#E86A8C",
    violet: "#83A3BF",
    grid: "#1D3F53",
    axis: "#8DA6B4",
    tooltipBg: "#0F2C3E",
    tooltipLine: "#2A5266",
    tooltipInk: "#E7F1F6",
  },
};

export const DIVISIONS = ["Transport", "Food", "Hospitality", "General"];

/* The "Food" division is configured here as a chicken-selling business -
   the internal value stays "Food" (it's the key everything else joins
   on), but everywhere the user reads it, it should say "Chicken". */
export const DIVISION_LABEL = { Transport: "Transport", Food: "Chicken", Hospitality: "Hospitality", General: "General" };
export const divisionLabel = (d) => DIVISION_LABEL[d] || d;
export const divisionOptions = (arr = DIVISIONS) => arr.map((d) => ({ value: d, label: divisionLabel(d) }));

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
  "Transport Manager": ["overview", "transport", "payments", "expenses", "reports", "updates", "settings"],
  "Food Manager": ["overview", "food", "payments", "expenses", "reports", "updates", "settings"],
  "Hospitality Manager": ["overview", "hospitality", "payments", "expenses", "reports", "updates", "settings"],
  Accountant: ["overview", "all", "payments", "expenses", "reports", "updates", "settings"],
  Staff: ["overview", "payments", "updates", "settings"],
};

/* Roles allowed to create/edit/delete records, and to manage people. */
export const ROLE_CAPS = {
  "Super Admin": { write: true, manageUsers: true, deleteAny: true, settings: true, payments: true },
  Admin: { write: true, manageUsers: true, deleteAny: true, settings: true, payments: true },
  "Transport Manager": { write: true, manageUsers: false, deleteAny: true, settings: false, payments: true },
  "Food Manager": { write: true, manageUsers: false, deleteAny: true, settings: false, payments: true },
  "Hospitality Manager": { write: true, manageUsers: false, deleteAny: true, settings: false, payments: true },
  Accountant: { write: true, manageUsers: false, deleteAny: false, settings: false, payments: true },
  Staff: { write: false, manageUsers: false, deleteAny: false, settings: false, payments: true },
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
export const PAYMENT_DIRECTIONS = [
  { value: "out", label: "Money out - pay someone" },
  { value: "in", label: "Money in - receive a payment" },
];
export const PAYMENT_RECORD_STATUSES = ["Recorded", "Pending", "Failed"];
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
  Recorded: "emerald",
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
  Failed: "coral",
  Inactive: "coral",
  Suspended: "coral",
  Overdue: "coral",
};

export function statusTone(status) {
  return STATUS_TONES[status] || "slate";
}

export const STORAGE_KEY = "kash.data.v1";
export const PREFS_KEY = "kash.prefs.v1";
export const THEME_KEY = "kash.theme";
export const SESSION_KEY = "kash.session.v1";
