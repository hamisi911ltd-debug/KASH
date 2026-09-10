/* ============================================================
   Small reusable hooks shared across the app.
   ============================================================ */
import { useEffect, useRef, useState } from "react";
import { CHART_PALETTE } from "./constants";
import { useStore } from "./store.jsx";

/** Animate a number counting up to `target` whenever it changes. */
export function useCountUp(target, duration = 700) {
  const [value, setValue] = useState(target);
  const prevTarget = useRef(target);
  useEffect(() => {
    const from = prevTarget.current;
    const to = target;
    prevTarget.current = target;
    if (from === to) {
      setValue(to);
      return;
    }
    let raf;
    let start = null;
    const step = (ts) => {
      if (start === null) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(from + (to - from) * eased));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);
  return value;
}

/** Resolved chart hex colours for the active theme (Recharts needs real hex, not var()). */
export function useChartPalette() {
  const { theme } = useStore();
  return CHART_PALETTE[theme] || CHART_PALETTE.light;
}

export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => (typeof window !== "undefined" ? window.matchMedia(query).matches : false));
  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e) => setMatches(e.matches);
    mql.addEventListener("change", handler);
    setMatches(mql.matches);
    return () => mql.removeEventListener("change", handler);
  }, [query]);
  return matches;
}

export function useDebouncedValue(value, delay = 250) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/** Fire `onOutside` on a click/tap or Escape outside `ref`. */
export function useOnDismiss(ref, onOutside, active = true) {
  useEffect(() => {
    if (!active) return;
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onOutside(e);
    };
    const handleKey = (e) => {
      if (e.key === "Escape") onOutside(e);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [ref, onOutside, active]);
}

/** True once, after first mount - used to skip enter animations on data updates. */
export function useMountedAfter(ms = 0) {
  const [mounted, setMounted] = useState(ms === 0);
  useEffect(() => {
    if (ms === 0) return;
    const t = setTimeout(() => setMounted(true), ms);
    return () => clearTimeout(t);
  }, [ms]);
  return mounted;
}

/** Global keyboard shortcut: press `key` (with optional meta/ctrl) to fire `handler`. */
export function useHotkey(combo, handler, deps = []) {
  useEffect(() => {
    const [mod, key] = combo.includes("+") ? combo.split("+") : [null, combo];
    const onKeyDown = (e) => {
      const wantsMod = mod === "mod";
      const hasMod = e.metaKey || e.ctrlKey;
      if (wantsMod && !hasMod) return;
      if (!wantsMod && hasMod) return;
      if (e.key.toLowerCase() !== key.toLowerCase()) return;
      // Don't hijack typing in inputs unless it's an explicit modifier combo.
      const tag = document.activeElement?.tagName;
      if (!wantsMod && (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT")) return;
      e.preventDefault();
      handler(e);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
