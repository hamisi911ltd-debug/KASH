/* ============================================================
   Crash reporting. When the website itself breaks (a screen
   crashes, a script throws), tell the API, which writes it to the
   Worker logs beside server errors. Nothing here can throw or block
   the app: reporting is best-effort and silent.
   ============================================================ */
import { API_BASE } from "./api.js";
import { SESSION_KEY } from "./constants.js";

/** Which build is running. Set in vite.config.js; "dev" outside a build. */
export const RELEASE = typeof __APP_RELEASE__ !== "undefined" ? __APP_RELEASE__ : "dev";

const seen = new Set();
const MAX_REPORTS_PER_PAGE_LOAD = 10;

/** A short code the person can read out to you, and you can search the logs for. */
export const newRef = () => Math.random().toString(36).slice(2, 10);

function whoIsSignedIn() {
  try {
    const s = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
    return { userId: s?.id, role: s?.role };
  } catch {
    return {};
  }
}

// Browser noise that isn't a bug in KASH.
const IGNORED = [/ResizeObserver loop/i, /^Script error\.?$/i];

export function reportError(error, extra = {}) {
  try {
    // A refused request (wrong password, no access, 4xx) is the app working, not crashing.
    if (typeof error?.status === "number" && error.status < 500) return;
    const message = String(error?.message || error || "Unknown error");
    if (IGNORED.some((re) => re.test(message))) return;
    const stack = String(error?.stack || "");
    const key = message + stack.slice(0, 200);
    if (seen.has(key) || seen.size >= MAX_REPORTS_PER_PAGE_LOAD) return;
    seen.add(key);
    fetch(`${API_BASE}/api/client-error`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({ message, stack, page: location.pathname + location.hash, release: RELEASE, ...whoIsSignedIn(), ...extra }),
    }).catch(() => {});
  } catch {
    /* reporting must never cause a second crash */
  }
}

export function installGlobalErrorHandlers() {
  window.addEventListener("error", (e) => reportError(e.error || e.message));
  window.addEventListener("unhandledrejection", (e) => reportError(e.reason));
}
