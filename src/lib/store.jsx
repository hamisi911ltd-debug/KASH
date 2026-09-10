/* ============================================================
   Application state.

   One provider owns the business data, the user's preferences and
   the toast queue. Everything is persisted to localStorage, so the
   dashboard survives a refresh, a reboot and a closed laptop.
   ============================================================ */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { buildSeedData, TODAY } from "./seed";
import { genId, daysBetween, toISODate } from "./format";
import { STORAGE_KEY, PREFS_KEY, THEME_KEY, SESSION_KEY } from "./constants";

const StoreContext = createContext(null);

const COLLECTIONS = [
  "drivers", "vehicles", "trips", "menu", "orders",
  "rooms", "bookings", "expenses", "users", "reminders", "notifications",
];

const DEFAULT_PREFS = {
  period: "Last 7 days",
  customRange: null,
  density: "comfortable",
  notify: { bookings: true, orders: true, trips: true, expenses: true, alerts: true },
};

/* ---------------------------------------------------------- storage */

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false; // private mode / quota - the app keeps working in memory
  }
}

function loadData() {
  const stored = readJSON(STORAGE_KEY, null);
  if (!stored || typeof stored !== "object" || !Array.isArray(stored.trips)) return buildSeedData();
  const seed = buildSeedData();
  // Merge so a stored file from an older version still opens cleanly.
  const merged = { ...seed, ...stored, company: { ...seed.company, ...(stored.company || {}) } };
  COLLECTIONS.forEach((c) => {
    if (!Array.isArray(merged[c])) merged[c] = seed[c] || [];
  });
  return merged;
}

/* ---------------------------------------------------------- normalisers */

const num = (v) => (v === "" || v == null ? 0 : Number(v) || 0);

const normalisers = {
  trips: (v) => ({
    date: v.date || TODAY,
    vehicleId: v.vehicleId || "",
    driverId: v.driverId || "",
    origin: (v.origin || "").trim(),
    destination: (v.destination || "").trim(),
    distanceKm: num(v.distanceKm),
    client: (v.client || "").trim(),
    amount: num(v.amount),
    fuelCost: num(v.fuelCost),
    otherCost: num(v.otherCost),
    status: v.status || "Scheduled",
  }),
  vehicles: (v) => ({
    reg: (v.reg || "").trim().toUpperCase(),
    type: v.type || "Van",
    model: (v.model || "").trim(),
    driverId: v.driverId || "",
    status: v.status || "Active",
    mileage: num(v.mileage),
    serviceDueKm: num(v.serviceDueKm),
    insuranceExpiry: v.insuranceExpiry || "",
    capacity: num(v.capacity),
  }),
  drivers: (v) => ({
    name: (v.name || "").trim(),
    phone: (v.phone || "").trim(),
    licence: (v.licence || "").trim(),
    status: v.status || "On Duty",
    rating: num(v.rating) || 4.5,
    hiredOn: v.hiredOn || TODAY,
  }),
  orders: (v, data) => {
    const menuItem = data.menu.find((m) => m.id === v.menuItemId);
    const qty = num(v.qty) || 1;
    const unitPrice = num(v.unitPrice) || menuItem?.price || 0;
    return {
      date: v.date || TODAY,
      customer: (v.customer || "").trim(),
      channel: v.channel || "Walk-in",
      menuItemId: v.menuItemId || "",
      item: (v.item || menuItem?.name || "").trim(),
      qty,
      unitPrice,
      amount: num(v.amount) || unitPrice * qty,
      cost: num(v.cost) || (menuItem ? menuItem.cost * qty : 0),
      paymentStatus: v.paymentStatus || "Pending",
      orderStatus: v.orderStatus || "Preparing",
    };
  },
  menu: (v) => ({
    name: (v.name || "").trim(),
    category: v.category || "Mains",
    price: num(v.price),
    cost: num(v.cost),
    active: v.active === false || v.active === "false" ? false : true,
  }),
  rooms: (v) => ({
    number: (v.number || "").trim(),
    type: v.type || "Standard",
    price: num(v.price),
    status: v.status || "Available",
    floor: num(v.floor) || 1,
  }),
  bookings: (v, data) => {
    const room = data.rooms.find((r) => r.id === v.roomId);
    const nights = Math.max(1, daysBetween(v.checkIn, v.checkOut) || 1);
    const amount = num(v.amount) || (room ? room.price * nights : 0);
    const paymentStatus = v.paymentStatus || "Pending";
    return {
      guest: (v.guest || "").trim(),
      roomId: v.roomId || "",
      checkIn: v.checkIn || TODAY,
      checkOut: v.checkOut || toISODate(new Date()),
      nights,
      guests: num(v.guests) || 1,
      source: v.source || "Direct",
      amount,
      paid: paymentStatus === "Paid" ? amount : paymentStatus === "Partial" ? num(v.paid) || Math.round(amount / 2) : 0,
      paymentStatus,
      status: v.status || "Confirmed",
    };
  },
  expenses: (v) => ({
    date: v.date || TODAY,
    division: v.division || "General",
    category: v.category || "Other",
    vendor: (v.vendor || "").trim(),
    amount: num(v.amount),
    method: v.method || "M-Pesa",
    notes: (v.notes || "").trim(),
    source: "manual",
  }),
  users: (v) => ({
    name: (v.name || "").trim(),
    email: (v.email || "").trim().toLowerCase(),
    role: v.role || "Staff",
    division: v.division || "All",
    status: v.status || "Invited",
    lastActive: v.lastActive || null,
  }),
  reminders: (v) => ({
    title: (v.title || "").trim(),
    due: v.due || TODAY,
    division: v.division || "General",
    priority: v.priority || "Normal",
    done: !!v.done,
  }),
};

const ID_PREFIX = {
  trips: "t", vehicles: "v", drivers: "d", orders: "o", menu: "m",
  rooms: "r", bookings: "b", expenses: "e", users: "u", reminders: "rem", notifications: "n",
};

/* Human labels used in toasts and confirmation copy. */
export const SINGULAR = {
  trips: "Trip", vehicles: "Vehicle", drivers: "Driver", orders: "Order", menu: "Menu item",
  rooms: "Room", bookings: "Booking", expenses: "Expense", users: "User", reminders: "Reminder",
};

/* ---------------------------------------------------------- provider */

export function StoreProvider({ children }) {
  const [data, setData] = useState(loadData);
  const [prefs, setPrefs] = useState(() => {
    const stored = readJSON(PREFS_KEY, {});
    return { ...DEFAULT_PREFS, ...stored, notify: { ...DEFAULT_PREFS.notify, ...(stored.notify || {}) } };
  });
  const [theme, setThemeState] = useState(() => {
    try {
      return localStorage.getItem(THEME_KEY) || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    } catch {
      return "light";
    }
  });
  const [session, setSession] = useState(() => readJSON(SESSION_KEY, null));
  const [toasts, setToasts] = useState([]);
  const [storageOk, setStorageOk] = useState(true);
  const saveTimer = useRef(null);

  /* --- persistence (debounced so bulk edits do not thrash the disk) --- */
  useEffect(() => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => setStorageOk(writeJSON(STORAGE_KEY, data)), 250);
    return () => clearTimeout(saveTimer.current);
  }, [data]);

  useEffect(() => {
    writeJSON(PREFS_KEY, prefs);
  }, [prefs]);
  useEffect(() => {
    writeJSON(SESSION_KEY, session);
  }, [session]);

  useEffect(() => {
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  /* --- toasts --- */
  const dismissToast = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const toast = useCallback(
    (message, opts = {}) => {
      const id = genId("toast");
      setToasts((t) => [...t.slice(-3), { id, message, tone: opts.tone || "success", action: opts.action }]);
      setTimeout(() => dismissToast(id), opts.duration || (opts.action ? 6500 : 3200));
      return id;
    },
    [dismissToast]
  );

  /* --- notifications --- */
  const notify = useCallback(
    (message, { type = "info", division = "General" } = {}) => {
      setData((d) => ({
        ...d,
        notifications: [
          { id: genId("n"), message, ts: new Date().toISOString(), read: false, type, division },
          ...d.notifications,
        ].slice(0, 100),
      }));
    },
    []
  );

  const notifyIfEnabled = useCallback(
    (channel, message, meta) => {
      if (prefs.notify[channel] === false) return;
      notify(message, meta);
    },
    [notify, prefs.notify]
  );

  /* --- CRUD --- */
  const addRecord = useCallback((collection, values) => {
    let created = null;
    setData((d) => {
      const shape = normalisers[collection] ? normalisers[collection](values, d) : values;
      created = { id: genId(ID_PREFIX[collection] || "x"), ...shape };
      return { ...d, [collection]: [created, ...d[collection]] };
    });
    return created;
  }, []);

  const updateRecord = useCallback((collection, id, values) => {
    setData((d) => ({
      ...d,
      [collection]: d[collection].map((r) =>
        r.id === id
          ? { ...r, ...(normalisers[collection] ? normalisers[collection]({ ...r, ...values }, d) : values) }
          : r
      ),
    }));
  }, []);

  const patchRecord = useCallback((collection, id, patch) => {
    setData((d) => ({
      ...d,
      [collection]: d[collection].map((r) => (r.id === id ? { ...r, ...patch } : r)),
    }));
  }, []);

  /** Delete with a restore closure, so the toast can offer Undo. */
  const removeRecord = useCallback((collection, id) => {
    let removed = null;
    let index = -1;
    setData((d) => {
      index = d[collection].findIndex((r) => r.id === id);
      if (index === -1) return d;
      removed = d[collection][index];
      return { ...d, [collection]: d[collection].filter((r) => r.id !== id) };
    });
    return () =>
      setData((d) => {
        if (!removed || d[collection].some((r) => r.id === removed.id)) return d;
        const next = [...d[collection]];
        next.splice(Math.max(0, index), 0, removed);
        return { ...d, [collection]: next };
      });
  }, []);

  /* --- notifications helpers --- */
  const markNotificationRead = useCallback(
    (id) => setData((d) => ({ ...d, notifications: d.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) })),
    []
  );
  const markAllNotificationsRead = useCallback(
    () => setData((d) => ({ ...d, notifications: d.notifications.map((n) => ({ ...n, read: true })) })),
    []
  );
  const clearNotifications = useCallback(() => setData((d) => ({ ...d, notifications: [] })), []);

  const toggleReminder = useCallback(
    (id) => setData((d) => ({ ...d, reminders: d.reminders.map((r) => (r.id === id ? { ...r, done: !r.done } : r)) })),
    []
  );

  const updateCompany = useCallback((patch) => setData((d) => ({ ...d, company: { ...d.company, ...patch } })), []);

  /* --- data management --- */
  const resetDemoData = useCallback(() => setData(buildSeedData()), []);

  const exportBackup = useCallback(() => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kash-backup-${toISODate(new Date())}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }, [data]);

  const importBackup = useCallback(
    (file) =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const parsed = JSON.parse(String(reader.result));
            if (!parsed || !Array.isArray(parsed.trips)) throw new Error("Not a KASH backup file");
            const seed = buildSeedData();
            const merged = { ...seed, ...parsed, company: { ...seed.company, ...(parsed.company || {}) } };
            COLLECTIONS.forEach((c) => {
              if (!Array.isArray(merged[c])) merged[c] = seed[c] || [];
            });
            setData(merged);
            resolve(merged);
          } catch (err) {
            reject(err);
          }
        };
        reader.onerror = () => reject(new Error("Could not read that file"));
        reader.readAsText(file);
      }),
    []
  );

  const value = useMemo(
    () => ({
      data, setData, prefs, setPrefs, theme,
      setTheme: setThemeState,
      toggleTheme: () => setThemeState((t) => (t === "dark" ? "light" : "dark")),
      session, setSession,
      toasts, toast, dismissToast,
      notify, notifyIfEnabled,
      addRecord, updateRecord, patchRecord, removeRecord,
      markNotificationRead, markAllNotificationsRead, clearNotifications,
      toggleReminder, updateCompany,
      resetDemoData, exportBackup, importBackup,
      storageOk,
    }),
    [
      data, prefs, theme, session, toasts, storageOk, toast, dismissToast, notify, notifyIfEnabled,
      addRecord, updateRecord, patchRecord, removeRecord, markNotificationRead,
      markAllNotificationsRead, clearNotifications, toggleReminder, updateCompany,
      resetDemoData, exportBackup, importBackup,
    ]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}
