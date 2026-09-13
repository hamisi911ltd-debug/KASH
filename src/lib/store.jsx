/* ============================================================
   Application state.

   Business data now lives in a real backend (a Cloudflare Worker +
   KV store, src/lib/api.js) - this provider fetches it on sign-in
   and keeps a local copy for the UI to read instantly, applying each
   mutation to that local copy as soon as the API confirms it. Only
   the signed-in session, UI preferences and theme stay in
   localStorage (purely client-side concerns).
   ============================================================ */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { COLLECTIONS, SINGULAR } from "./schema.js";
import { genId } from "./format";
import { PREFS_KEY, THEME_KEY, SESSION_KEY } from "./constants";
import { api } from "./api.js";

export { SINGULAR } from "./schema.js";

const StoreContext = createContext(null);

const EMPTY_DATA = {
  company: { name: "KASH Group Ltd" },
  ...Object.fromEntries(COLLECTIONS.map((c) => [c, []])),
};

const DEFAULT_PREFS = {
  period: "Last 7 days",
  customRange: null,
  density: "comfortable",
  notify: { bookings: true, orders: true, trips: true, expenses: true, alerts: true },
};

/* ---------------------------------------------------------- local-only storage */

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
  } catch {
    /* private mode / quota - session just won't survive a refresh */
  }
}

/* ---------------------------------------------------------- provider */

export function StoreProvider({ children }) {
  const [session, setSessionState] = useState(() => readJSON(SESSION_KEY, null));
  const [data, setData] = useState(EMPTY_DATA);
  const [dataLoading, setDataLoading] = useState(!!session);
  const [dataError, setDataError] = useState(null);
  const [prefs, setPrefs] = useState(() => {
    const stored = readJSON(PREFS_KEY, {});
    return { ...DEFAULT_PREFS, ...stored, notify: { ...DEFAULT_PREFS.notify, ...(stored.notify || {}) } };
  });
  const [theme, setThemeState] = useState(() => {
    try {
      return localStorage.getItem(THEME_KEY) || "light";
    } catch {
      return "light";
    }
  });
  const [toasts, setToasts] = useState([]);

  const token = session?.token;

  const setSession = useCallback((next) => {
    setSessionState((prev) => (typeof next === "function" ? next(prev) : next));
  }, []);

  useEffect(() => writeJSON(SESSION_KEY, session), [session]);
  useEffect(() => writeJSON(PREFS_KEY, prefs), [prefs]);
  useEffect(() => {
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(theme);
    writeJSON(THEME_KEY, theme);
  }, [theme]);

  /* --- pull the whole (role-scoped) dataset whenever the session changes --- */
  const resync = useCallback(async () => {
    if (!token) {
      setData(EMPTY_DATA);
      setDataLoading(false);
      return;
    }
    setDataLoading(true);
    try {
      const res = await api.sync(token);
      setData((d) => ({ ...EMPTY_DATA, ...res.data, notifications: d.notifications }));
      setSessionState((s) => (s ? { ...s, ...res.user, token: s.token } : s));
      setDataError(null);
    } catch (e) {
      if (e.status === 401) setSessionState(null); // dead/expired token - back to sign-in
      else setDataError(e.message || "Could not reach the server.");
    } finally {
      setDataLoading(false);
    }
  }, [token]);

  useEffect(() => {
    resync();
  }, [resync]);

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

  /* --- notifications: a purely local activity feed, never synced --- */
  const notify = useCallback((message, { type = "info", division = "General" } = {}) => {
    setData((d) => ({
      ...d,
      notifications: [
        { id: genId("n"), message, ts: new Date().toISOString(), read: false, type, division },
        ...d.notifications,
      ].slice(0, 100),
    }));
  }, []);

  const notifyIfEnabled = useCallback(
    (channel, message, meta) => {
      if (prefs.notify[channel] === false) return;
      notify(message, meta);
    },
    [notify, prefs.notify]
  );

  /* --- CRUD, backed by the API --- */
  const addRecord = useCallback(
    async (collection, values) => {
      const record = await api.create(token, collection, values);
      setData((d) => ({ ...d, [collection]: [record, ...d[collection]] }));
      return record;
    },
    [token]
  );

  const updateRecord = useCallback(
    async (collection, id, values) => {
      const record = await api.update(token, collection, id, values);
      setData((d) => ({ ...d, [collection]: d[collection].map((r) => (r.id === id ? record : r)) }));
      return record;
    },
    [token]
  );

  const patchRecord = useCallback(
    async (collection, id, patch) => {
      const record = await api.patch(token, collection, id, patch);
      setData((d) => ({ ...d, [collection]: d[collection].map((r) => (r.id === id ? record : r)) }));
      return record;
    },
    [token]
  );

  /** Delete, then hand back an async restore closure so the toast can
      offer Undo (the restored record gets a new id - the delete already
      really happened server-side, so undo re-creates rather than un-deletes). */
  const removeRecord = useCallback(
    async (collection, id) => {
      const removed = data[collection]?.find((r) => r.id === id);
      await api.remove(token, collection, id);
      setData((d) => ({ ...d, [collection]: d[collection].filter((r) => r.id !== id) }));
      return async () => {
        if (!removed) return;
        const { id: _drop, ...rest } = removed;
        const restored = await api.create(token, collection, rest);
        setData((d) => ({ ...d, [collection]: [restored, ...d[collection]] }));
      };
    },
    [token, data]
  );

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
    (id) => {
      const cur = data.reminders.find((r) => r.id === id);
      if (cur) return patchRecord("reminders", id, { done: !cur.done });
    },
    [data.reminders, patchRecord]
  );

  const patchRoom = useCallback((id, status) => patchRecord("rooms", id, { status }), [patchRecord]);

  const updateCompany = useCallback(
    async (patch) => {
      const company = await api.updateCompany(token, patch);
      setData((d) => ({ ...d, company }));
    },
    [token]
  );

  const exportBackup = useCallback(() => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kash-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }, [data]);

  const value = useMemo(
    () => ({
      data, dataLoading, dataError, resync,
      prefs, setPrefs, theme,
      setTheme: setThemeState,
      toggleTheme: () => setThemeState((t) => (t === "dark" ? "light" : "dark")),
      session, setSession,
      toasts, toast, dismissToast,
      notify, notifyIfEnabled,
      addRecord, updateRecord, patchRecord, removeRecord,
      markNotificationRead, markAllNotificationsRead, clearNotifications,
      toggleReminder, patchRoom, updateCompany, exportBackup,
    }),
    [
      data, dataLoading, dataError, resync, prefs, theme, session, toasts, toast, dismissToast, notify, notifyIfEnabled,
      addRecord, updateRecord, patchRecord, removeRecord, markNotificationRead,
      markAllNotificationsRead, clearNotifications, toggleReminder, patchRoom, updateCompany, exportBackup,
    ]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}
