/* ============================================================
   The analytics core.

   Everything the dashboard shows is derived here from one unified
   ledger, so Overview, the division views, Expenses and Reports can
   never disagree with each other.

   Money model
   -----------
   Income   trips (fare)        recognised on trip date
            orders (sale)       recognised on order date
            bookings (stay)     recognised on check-in date
   Cost     expenses            the manual ledger the owner keys in
            trip fuel/other     posted automatically from each trip
            order food cost     posted automatically from each order (COGS)

   Cancelled records contribute nothing on either side.
   ============================================================ */
import { parseDate, toISODate, addDays, daysBetween, delta } from "./format";

export const CANCELLED = "Cancelled";

/* ---------------------------------------------------------- periods */

/**
 * Turn a period name into a concrete range plus the comparable
 * preceding range used for trend arrows.
 */
export function resolvePeriod(period, custom, today = new Date()) {
  const to = toISODate(today);
  const startOfMonth = toISODate(new Date(today.getFullYear(), today.getMonth(), 1));
  const startOfYear = toISODate(new Date(today.getFullYear(), 0, 1));

  const span = (fromISO) => {
    const len = daysBetween(fromISO, to) + 1;
    return {
      from: fromISO,
      to,
      prevTo: toISODate(addDays(fromISO, -1)),
      prevFrom: toISODate(addDays(fromISO, -len)),
    };
  };

  switch (period) {
    case "Today":
      return { ...span(to), label: "Today" };
    case "Last 7 days":
      return { ...span(toISODate(addDays(to, -6))), label: "Last 7 days" };
    case "This Month": {
      const len = daysBetween(startOfMonth, to) + 1;
      const prevMonthStart = toISODate(new Date(today.getFullYear(), today.getMonth() - 1, 1));
      return {
        from: startOfMonth,
        to,
        prevFrom: prevMonthStart,
        prevTo: toISODate(addDays(prevMonthStart, len - 1)),
        label: "This month",
      };
    }
    case "Last 90 days":
      return { ...span(toISODate(addDays(to, -89))), label: "Last 90 days" };
    case "This Year":
      return { ...span(startOfYear), label: "This year" };
    case "Custom": {
      const from = custom?.from || toISODate(addDays(to, -29));
      const cTo = custom?.to || to;
      const len = daysBetween(from, cTo) + 1;
      return {
        from,
        to: cTo,
        prevFrom: toISODate(addDays(from, -len)),
        prevTo: toISODate(addDays(from, -1)),
        label: "Custom range",
      };
    }
    case "All Time":
    default:
      return { from: "1970-01-01", to, prevFrom: null, prevTo: null, label: "All time" };
  }
}

export const inRange = (date, from, to) => {
  if (!date) return false;
  const d = String(date).slice(0, 10);
  return (!from || d >= from) && (!to || d <= to);
};

/* ---------------------------------------------------------- the ledger */

/**
 * Flatten every business record into one list of money movements.
 * `source` marks where a line came from; anything other than "manual"
 * is auto-posted and therefore read-only in the Expenses view.
 */
export function buildLedger(data) {
  const lines = [];
  const vehicleReg = (id) => data.vehicles.find((v) => v.id === id)?.reg || "Unassigned";
  const roomNo = (id) => data.rooms.find((r) => r.id === id)?.number || "-";

  data.trips.forEach((t) => {
    if (t.status === CANCELLED) return;
    if (t.amount) {
      lines.push({
        id: `${t.id}-inc`, refId: t.id, date: t.date, division: "Transport", kind: "income",
        category: "Trip fare", desc: `${t.origin} to ${t.destination} (${vehicleReg(t.vehicleId)})`,
        amount: Number(t.amount) || 0, source: "trip",
      });
    }
    if (t.fuelCost) {
      lines.push({
        id: `${t.id}-fuel`, refId: t.id, date: t.date, division: "Transport", kind: "expense",
        category: "Fuel", desc: `Fuel - ${t.origin} to ${t.destination}`,
        amount: Number(t.fuelCost) || 0, source: "trip", method: "Auto-posted",
      });
    }
    if (t.otherCost) {
      lines.push({
        id: `${t.id}-other`, refId: t.id, date: t.date, division: "Transport", kind: "expense",
        category: "Trip costs", desc: `Tolls / levies - ${t.destination}`,
        amount: Number(t.otherCost) || 0, source: "trip", method: "Auto-posted",
      });
    }
  });

  data.orders.forEach((o) => {
    if (o.orderStatus === CANCELLED) return;
    if (o.amount) {
      lines.push({
        id: `${o.id}-inc`, refId: o.id, date: o.date, division: "Food", kind: "income",
        category: "Food sale", desc: `${o.item} - ${o.customer}`,
        amount: Number(o.amount) || 0, source: "order",
      });
    }
    if (o.cost) {
      lines.push({
        id: `${o.id}-cogs`, refId: o.id, date: o.date, division: "Food", kind: "expense",
        category: "Food cost", desc: `Ingredients - ${o.item}`,
        amount: Number(o.cost) || 0, source: "order", method: "Auto-posted",
      });
    }
  });

  data.bookings.forEach((b) => {
    if (b.status === CANCELLED || !b.amount) return;
    lines.push({
      id: `${b.id}-inc`, refId: b.id, date: b.checkIn, division: "Hospitality", kind: "income",
      category: "Room revenue", desc: `${b.guest} - Room ${roomNo(b.roomId)} (${b.nights || 1}n)`,
      amount: Number(b.amount) || 0, source: "booking",
    });
  });

  data.expenses.forEach((e) => {
    lines.push({
      id: e.id, refId: e.id, date: e.date, division: e.division, kind: "expense",
      category: e.category, desc: e.notes || e.vendor || e.category,
      amount: Number(e.amount) || 0, source: "manual", method: e.method, vendor: e.vendor,
    });
  });

  return lines.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

const sum = (arr, f) => arr.reduce((s, x) => s + (f ? f(x) : x), 0);

function totals(lines) {
  const income = sum(lines.filter((l) => l.kind === "income"), (l) => l.amount);
  const expense = sum(lines.filter((l) => l.kind === "expense"), (l) => l.amount);
  return { income, expense, profit: income - expense, margin: income ? ((income - expense) / income) * 100 : 0 };
}

/* ---------------------------------------------------------- headline metrics */

export function computeMetrics(data, range) {
  const ledger = buildLedger(data);
  const current = ledger.filter((l) => inRange(l.date, range.from, range.to));
  const previous = range.prevFrom
    ? ledger.filter((l) => inRange(l.date, range.prevFrom, range.prevTo))
    : [];

  const now = totals(current);
  const before = totals(previous);

  const byDivision = ["Transport", "Food", "Hospitality", "General"].map((division) => {
    const cur = totals(current.filter((l) => l.division === division));
    const prv = totals(previous.filter((l) => l.division === division));
    return {
      division,
      ...cur,
      incomeDelta: delta(cur.income, prv.income),
      profitDelta: delta(cur.profit, prv.profit),
    };
  });

  return {
    ledger,
    current,
    previous,
    ...now,
    incomeDelta: delta(now.income, before.income),
    expenseDelta: delta(now.expense, before.expense),
    profitDelta: delta(now.profit, before.profit),
    byDivision,
    prev: before,
  };
}

/* ---------------------------------------------------------- time series */

/** Daily income/expense buckets across a range, gap-filled so charts do not lie. */
export function seriesByDay(lines, from, to, maxPoints = 62) {
  const start = parseDate(from);
  const end = parseDate(to);
  let days = daysBetween(from, to) + 1;
  if (!Number.isFinite(days) || days < 1) days = 1;

  // Long ranges roll up to weeks/months so the axis stays readable.
  const step = days > maxPoints ? Math.ceil(days / maxPoints) : 1;
  const buckets = new Map();
  for (let i = 0; i < days; i += step) {
    const d = toISODate(addDays(start, i));
    buckets.set(d, { key: d, label: bucketLabel(d, step), income: 0, expense: 0, profit: 0 });
  }

  lines.forEach((l) => {
    const offset = daysBetween(from, l.date);
    if (parseDate(l.date) < start || parseDate(l.date) > end) return;
    const bucketStart = toISODate(addDays(start, Math.floor(offset / step) * step));
    const b = buckets.get(bucketStart);
    if (!b) return;
    if (l.kind === "income") b.income += l.amount;
    else b.expense += l.amount;
    b.profit = b.income - b.expense;
  });

  return [...buckets.values()];
}

function bucketLabel(iso, step) {
  const d = parseDate(iso);
  if (step >= 28) return d.toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
  if (step >= 7) return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

/**
 * Pick a sensible chart window. For a bounded period we chart that period
 * day-by-day; for "All Time" we fall back to the first record and let the
 * caller switch to a monthly rollup when the span is long.
 */
export function chartRange(range, lines) {
  if (range.from !== "1970-01-01") return { from: range.from, to: range.to, monthly: false };
  const dates = lines.map((l) => l.date).filter(Boolean).sort();
  const from = dates[0] || toISODate(addDays(range.to, -89));
  return { from, to: range.to, monthly: daysBetween(from, range.to) > 180 };
}

/** Rolling 12-month income/expense, used for the long-range trend chart. */
export function seriesByMonth(lines, months = 12, today = new Date()) {
  const out = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    out.push({
      key,
      label: d.toLocaleDateString("en-GB", { month: "short" }),
      income: 0,
      expense: 0,
      profit: 0,
    });
  }
  const index = new Map(out.map((o) => [o.key, o]));
  lines.forEach((l) => {
    const row = index.get(String(l.date).slice(0, 7));
    if (!row) return;
    if (l.kind === "income") row.income += l.amount;
    else row.expense += l.amount;
    row.profit = row.income - row.expense;
  });
  return out;
}

/**
 * Trailing N weeks of income/expense, each week ending on `today`.
 * Fixed bucket count => the bars are always the same width and readable,
 * and it recomputes from the live ledger on every data change.
 */
export function weeklySeries(lines, weeks = 12, today = new Date()) {
  const out = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const end = addDays(today, -i * 7);
    const start = addDays(end, -6);
    out.push({
      key: toISODate(start),
      from: toISODate(start),
      to: toISODate(end),
      label: parseDate(start).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
      income: 0,
      expense: 0,
      profit: 0,
    });
  }
  lines.forEach((l) => {
    const d = String(l.date).slice(0, 10);
    const row = out.find((w) => d >= w.from && d <= w.to);
    if (!row) return;
    if (l.kind === "income") row.income += l.amount;
    else row.expense += l.amount;
    row.profit = row.income - row.expense;
  });
  return out;
}

/** Average occupancy % per week across the trailing N weeks. */
export function weeklyOccupancy(rooms, bookings, weeks = 12, today = new Date()) {
  const out = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const end = addDays(today, -i * 7);
    let total = 0;
    for (let d = 0; d < 7; d++) total += occupancyRate(rooms, bookings, toISODate(addDays(end, -d)));
    out.push({
      key: toISODate(addDays(end, -6)),
      label: parseDate(addDays(end, -6)).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
      rate: Math.round(total / 7),
    });
  }
  return out;
}

/** Top N groups by summed amount. */
export function topBy(rows, keyFn, amountFn, n = 5) {
  const map = new Map();
  rows.forEach((r) => {
    const k = keyFn(r);
    if (k == null) return;
    map.set(k, (map.get(k) || 0) + (amountFn(r) || 0));
  });
  return [...map.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, n);
}

/* ---------------------------------------------------------- hospitality */

const stayCovers = (b, dateISO) =>
  b.status !== CANCELLED && b.checkIn <= dateISO && b.checkOut > dateISO;

/**
 * Live room state. Housekeeping status lives on the room; whether a room
 * is *occupied* is derived from bookings, so the two can never drift.
 */
export function roomStates(rooms, bookings, dateISO) {
  return rooms.map((room) => {
    const stay = bookings.find((b) => b.roomId === room.id && stayCovers(b, dateISO));
    const arriving = bookings.find(
      (b) => b.roomId === room.id && b.status !== CANCELLED && b.checkIn === dateISO && !stay
    );
    const state = stay
      ? "Occupied"
      : room.status === "Maintenance"
        ? "Maintenance"
        : room.status === "Cleaning"
          ? "Cleaning"
          : "Available";
    return { ...room, state, stay: stay || null, arriving: arriving || null };
  });
}

export function occupancyRate(rooms, bookings, dateISO) {
  if (!rooms.length) return 0;
  const occupied = roomStates(rooms, bookings, dateISO).filter((r) => r.state === "Occupied").length;
  return Math.round((occupied / rooms.length) * 100);
}

/** Occupancy % per day across a range - the shape of the hospitality business. */
export function occupancySeries(rooms, bookings, from, to, maxPoints = 45) {
  const days = daysBetween(from, to) + 1;
  const step = days > maxPoints ? Math.ceil(days / maxPoints) : 1;
  const out = [];
  for (let i = 0; i < days; i += step) {
    const iso = toISODate(addDays(from, i));
    out.push({
      key: iso,
      label: bucketLabel(iso, step),
      rate: occupancyRate(rooms, bookings, iso),
    });
  }
  return out;
}

/* ---------------------------------------------------------- receivables */

/** Money invoiced but not yet collected, across food and hospitality. */
export function outstanding(data) {
  const orders = data.orders
    .filter((o) => o.orderStatus !== CANCELLED && o.paymentStatus !== "Paid")
    .map((o) => ({
      id: o.id, kind: "order", division: "Food", who: o.customer, date: o.date,
      total: o.amount, paid: o.paymentStatus === "Partial" ? Math.round(o.amount / 2) : 0,
    }));
  const bookings = data.bookings
    .filter((b) => b.status !== CANCELLED && b.paymentStatus !== "Paid")
    .map((b) => ({
      id: b.id, kind: "booking", division: "Hospitality", who: b.guest, date: b.checkIn,
      total: b.amount, paid: Number(b.paid) || 0,
    }));
  const rows = [...orders, ...bookings]
    .map((r) => ({ ...r, due: Math.max(0, r.total - r.paid) }))
    .filter((r) => r.due > 0)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
  return { rows, total: sum(rows, (r) => r.due) };
}

/* ---------------------------------------------------------- alerts */

/**
 * Everything competing for the owner's attention, ranked.
 * All of it is derived from live records - nothing is hardcoded.
 */
export function buildAlerts(data, todayISO) {
  const alerts = [];
  const push = (a) => alerts.push(a);

  // Fleet: service intervals and insurance expiry.
  data.vehicles.forEach((v) => {
    if (v.status === "Maintenance") {
      push({ id: `veh-${v.id}-m`, severity: "warn", division: "Transport", view: "transport",
        title: `${v.reg} is off the road`, detail: `${v.model} is currently in maintenance.` });
    } else if (v.serviceDueKm && v.mileage >= v.serviceDueKm) {
      push({ id: `veh-${v.id}-s`, severity: "high", division: "Transport", view: "transport",
        title: `${v.reg} is overdue for service`, detail: `${(v.mileage - v.serviceDueKm).toLocaleString()} km past the ${v.serviceDueKm.toLocaleString()} km interval.` });
    } else if (v.serviceDueKm && v.serviceDueKm - v.mileage <= 2500) {
      push({ id: `veh-${v.id}-sn`, severity: "warn", division: "Transport", view: "transport",
        title: `${v.reg} service due soon`, detail: `${(v.serviceDueKm - v.mileage).toLocaleString()} km remaining.` });
    }
    if (v.insuranceExpiry) {
      const days = daysBetween(todayISO, v.insuranceExpiry);
      const expired = v.insuranceExpiry < todayISO;
      if (expired) {
        push({ id: `veh-${v.id}-i`, severity: "high", division: "Transport", view: "transport",
          title: `Insurance expired on ${v.reg}`, detail: "Renew before the vehicle goes out again." });
      } else if (days <= 30) {
        push({ id: `veh-${v.id}-i`, severity: "warn", division: "Transport", view: "transport",
          title: `Insurance on ${v.reg} expires in ${days} day${days === 1 ? "" : "s"}`, detail: "Schedule the renewal." });
      }
    }
  });

  // Receivables.
  const ar = outstanding(data);
  if (ar.total > 0) {
    const stale = ar.rows.filter((r) => daysBetween(r.date, todayISO) > 14);
    push({
      id: "ar", severity: stale.length ? "high" : "warn", division: "General", view: "reports",
      title: `${ar.rows.length} unpaid invoice${ar.rows.length === 1 ? "" : "s"}`,
      detail: `KSh ${Math.round(ar.total).toLocaleString()} outstanding${stale.length ? ` - ${stale.length} over 14 days old` : ""}.`,
    });
  }

  // Overdue reminders.
  const overdue = data.reminders.filter((r) => !r.done && r.due < todayISO);
  if (overdue.length) {
    push({ id: "rem", severity: "high", division: "General", view: "updates",
      title: `${overdue.length} overdue reminder${overdue.length === 1 ? "" : "s"}`,
      detail: overdue.map((r) => r.title).slice(0, 2).join("; ") });
  }

  // Today's operations.
  const todaysTrips = data.trips.filter((t) => t.date === todayISO && t.status === "Scheduled");
  if (todaysTrips.length) {
    push({ id: "trips-today", severity: "info", division: "Transport", view: "transport",
      title: `${todaysTrips.length} trip${todaysTrips.length === 1 ? "" : "s"} scheduled today`,
      detail: todaysTrips.map((t) => `${t.origin}-${t.destination}`).slice(0, 3).join(", ") });
  }
  const openOrders = data.orders.filter(
    (o) => o.date === todayISO && ["Preparing", "Out for Delivery"].includes(o.orderStatus)
  );
  if (openOrders.length) {
    push({ id: "orders-open", severity: "info", division: "Food", view: "food",
      title: `${openOrders.length} order${openOrders.length === 1 ? "" : "s"} still open`,
      detail: "Kitchen and delivery still to complete these." });
  }
  const arrivals = data.bookings.filter((b) => b.checkIn === todayISO && b.status !== CANCELLED);
  const departures = data.bookings.filter((b) => b.checkOut === todayISO && b.status !== CANCELLED);
  if (arrivals.length || departures.length) {
    push({ id: "front-desk", severity: "info", division: "Hospitality", view: "hospitality",
      title: `${arrivals.length} arrival${arrivals.length === 1 ? "" : "s"}, ${departures.length} departure${departures.length === 1 ? "" : "s"} today`,
      detail: "Front desk should prepare keys and housekeeping." });
  }

  // Rooms blocked from selling.
  const blocked = data.rooms.filter((r) => r.status === "Maintenance");
  if (blocked.length) {
    push({ id: "rooms-blocked", severity: "warn", division: "Hospitality", view: "hospitality",
      title: `${blocked.length} room${blocked.length === 1 ? "" : "s"} out of service`,
      detail: `Room ${blocked.map((r) => r.number).join(", ")} cannot be sold.` });
  }

  // Margin health, current month vs the one before.
  const m = computeMetrics(data, resolvePeriod("This Month", null, parseDate(todayISO)));
  if (m.income > 0 && m.profit < 0) {
    push({ id: "loss", severity: "high", division: "General", view: "reports",
      title: "Running at a loss this month",
      detail: `Costs exceed income by KSh ${Math.abs(Math.round(m.profit)).toLocaleString()}.` });
  } else if (m.profitDelta != null && m.profitDelta < -20) {
    push({ id: "margin", severity: "warn", division: "General", view: "reports",
      title: `Profit down ${Math.abs(Math.round(m.profitDelta))}% on last month`,
      detail: "Check the expense breakdown in Reports." });
  }

  const rank = { high: 0, warn: 1, info: 2 };
  return alerts.sort((a, b) => rank[a.severity] - rank[b.severity]);
}

/* ---------------------------------------------------------- global search */

/** One search index across every record type, for the command palette. */
export function searchAll(data, query, limit = 24) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const hits = [];
  const add = (type, view, label, sub, id) => hits.push({ type, view, label, sub, id });

  data.trips.forEach((t) => {
    if (`${t.origin} ${t.destination} ${t.client || ""}`.toLowerCase().includes(q))
      add("Trip", "transport", `${t.origin} to ${t.destination}`, `${t.date} - ${t.status}`, t.id);
  });
  data.orders.forEach((o) => {
    if (`${o.customer} ${o.item}`.toLowerCase().includes(q))
      add("Order", "food", o.item, `${o.customer} - ${o.date}`, o.id);
  });
  data.bookings.forEach((b) => {
    if (b.guest.toLowerCase().includes(q))
      add("Booking", "hospitality", b.guest, `${b.checkIn} to ${b.checkOut}`, b.id);
  });
  data.vehicles.forEach((v) => {
    if (`${v.reg} ${v.model} ${v.type}`.toLowerCase().includes(q))
      add("Vehicle", "transport", v.reg, `${v.type} - ${v.model}`, v.id);
  });
  data.drivers.forEach((d) => {
    if (`${d.name} ${d.phone}`.toLowerCase().includes(q))
      add("Driver", "transport", d.name, d.status, d.id);
  });
  data.rooms.forEach((r) => {
    if (`${r.number} ${r.type}`.toLowerCase().includes(q))
      add("Room", "hospitality", `Room ${r.number}`, r.type, r.id);
  });
  data.expenses.forEach((e) => {
    if (`${e.category} ${e.notes || ""} ${e.vendor || ""}`.toLowerCase().includes(q))
      add("Expense", "expenses", e.notes || e.category, `${e.division} - ${e.date}`, e.id);
  });
  data.users.forEach((u) => {
    if (`${u.name} ${u.email}`.toLowerCase().includes(q))
      add("User", "users", u.name, u.role, u.id);
  });
  data.menu.forEach((m) => {
    if (m.name.toLowerCase().includes(q)) add("Menu item", "food", m.name, m.category, m.id);
  });
  return hits.slice(0, limit);
}
