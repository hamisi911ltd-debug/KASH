/* ============================================================
   Formatting, date maths and CSV export helpers.
   ============================================================ */

export const formatKES = (n) => `KSh ${Math.round(Number(n) || 0).toLocaleString("en-US")}`;

/** Compact money for chart axes and tight tiles: 1.2M / 486k / 940 */
export function formatCompact(n) {
  const v = Number(n) || 0;
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return `${(v / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)}M`;
  if (abs >= 1_000) return `${Math.round(v / 1000)}k`;
  return `${Math.round(v)}`;
}

export const formatNumber = (n) => (Number(n) || 0).toLocaleString("en-US");

export function formatPercent(n, digits = 0) {
  const v = Number(n);
  return Number.isFinite(v) ? `${v.toFixed(digits)}%` : "-";
}

/* ---------- dates ---------- */

/** Parse a YYYY-MM-DD string as a *local* date (avoids UTC off-by-one). */
export function parseDate(d) {
  if (d instanceof Date) return new Date(d.getTime()); // always a fresh copy - never mutate the caller's Date
  if (!d) return new Date(NaN);
  const [y, m, day] = String(d).slice(0, 10).split("-").map(Number);
  return new Date(y, (m || 1) - 1, day || 1);
}

export const toISODate = (d) => {
  const dt = d instanceof Date ? d : parseDate(d);
  const p = (n) => String(n).padStart(2, "0");
  return `${dt.getFullYear()}-${p(dt.getMonth() + 1)}-${p(dt.getDate())}`;
};

export function formatDateShort(d) {
  const dt = parseDate(d);
  if (Number.isNaN(dt.getTime())) return "-";
  return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

export function formatDateLong(d) {
  const dt = parseDate(d);
  if (Number.isNaN(dt.getTime())) return "-";
  return dt.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "long", year: "numeric" });
}

export const daysBetween = (a, b) =>
  Math.max(0, Math.round((parseDate(b) - parseDate(a)) / 86_400_000));

export function addDays(d, n) {
  const dt = parseDate(d);
  dt.setDate(dt.getDate() + n);
  return dt;
}

export function monthLabel(d) {
  return parseDate(d).toLocaleDateString("en-GB", { month: "short" });
}

/** Human "3 days ago" / "in 2 weeks" relative to `now`. */
export function relativeTime(iso, now = new Date()) {
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return "";
  const diff = now - then;
  const mins = Math.round(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  const days = Math.round(hrs / 24);
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  return then.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

export const genId = (prefix) =>
  `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export const initials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

/** Percentage change from `prev` to `curr`; null when there is no baseline. */
export function delta(curr, prev) {
  if (!prev) return curr ? null : 0;
  return ((curr - prev) / Math.abs(prev)) * 100;
}

/* ---------- CSV ---------- */

const csvCell = (v) => {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/**
 * Download `rows` as a CSV file.
 * @param {string} filename
 * @param {{key:string,label:string,map?:Function}[]} columns
 * @param {object[]} rows
 */
export function downloadCSV(filename, columns, rows) {
  const header = columns.map((c) => csvCell(c.label)).join(",");
  const body = rows
    .map((r) => columns.map((c) => csvCell(c.map ? c.map(r) : r[c.key])).join(","))
    .join("\n");
  // BOM keeps Excel happy with UTF-8.
  const blob = new Blob([`\uFEFF${header}\n${body}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
