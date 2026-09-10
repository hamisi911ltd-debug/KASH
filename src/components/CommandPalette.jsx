/* ============================================================
   Cmd/Ctrl-K command palette: jump to any view, run a quick action,
   or open any record found by the global search index.
   ============================================================ */
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Search, CornerDownLeft, ArrowRight } from "lucide-react";
import { C } from "../lib/constants";
import { searchAll } from "../lib/derive";
import { useStore } from "../lib/store.jsx";
import { NAV } from "./nav.js";
import { canOpenView } from "../lib/auth";

export default function CommandPalette({ open, onClose, role, onNavigate, onQuickAction, quickActions }) {
  const { data } = useStore();
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    if (open) {
      setQ("");
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [open]);

  const results = useMemo(() => {
    const navHits = NAV.filter((n) => canOpenView(role, n.key))
      .filter((n) => !q || n.label.toLowerCase().includes(q.toLowerCase()))
      .map((n) => ({ group: "Go to", label: n.label, icon: n.icon, run: () => onNavigate(n.key) }));

    const actionHits = quickActions
      .filter((a) => !q || a.label.toLowerCase().includes(q.toLowerCase()))
      .map((a) => ({ group: "Create", label: a.label, icon: a.icon, run: () => onQuickAction(a.key) }));

    const recordHits = q
      ? searchAll(data, q, 12).map((r) => ({
          group: r.type,
          label: r.label,
          sub: r.sub,
          run: () => onNavigate(r.view),
        }))
      : [];

    return [...navHits, ...actionHits, ...recordHits];
  }, [q, data, role, quickActions, onNavigate, onQuickAction]);

  useEffect(() => {
    setActive((a) => Math.min(a, Math.max(0, results.length - 1)));
  }, [results.length]);

  if (!open) return null;

  const runActive = () => {
    const item = results[active];
    if (item) {
      item.run();
      onClose();
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(results.length - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      runActive();
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  let lastGroup = null;

  return (
    <div
      className="fixed inset-0 flex items-start justify-center px-4 pt-[12vh] n1-fade"
      style={{ zIndex: 120, background: "rgba(6,10,20,0.55)", backdropFilter: "blur(2px)" }}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="n1-pop w-full max-w-lg rounded-2xl overflow-hidden"
        style={{ background: C.surface, boxShadow: C.shadowLg }}
      >
        <div className="flex items-center gap-3 px-4 py-3.5 border-b" style={{ borderColor: C.line }}>
          <Search size={17} style={{ color: C.muted }} />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search records, jump to a page, create something..."
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: C.ink }}
          />
          <kbd className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ background: C.surface2, color: C.faint }}>ESC</kbd>
        </div>

        <div ref={listRef} className="max-h-[52vh] overflow-y-auto n1-scroll py-2">
          {results.length === 0 && (
            <p className="px-4 py-8 text-center text-sm" style={{ color: C.faint }}>No matches for "{q}"</p>
          )}
          {results.map((item, i) => {
            const showGroup = item.group !== lastGroup;
            lastGroup = item.group;
            const Icon = item.icon;
            return (
              <div key={i}>
                {showGroup && (
                  <p className="px-4 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wide" style={{ color: C.faint }}>
                    {item.group}
                  </p>
                )}
                <button
                  onMouseEnter={() => setActive(i)}
                  onClick={runActive}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                  style={{ background: active === i ? C.surface2 : "transparent" }}
                >
                  <span
                    className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: active === i ? C.blueSoft : C.surface2, color: active === i ? C.blue : C.muted }}
                  >
                    {Icon ? <Icon size={14} /> : <ArrowRight size={14} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium truncate" style={{ color: C.ink }}>{item.label}</span>
                    {item.sub && <span className="block text-xs truncate" style={{ color: C.faint }}>{item.sub}</span>}
                  </span>
                  {active === i && <CornerDownLeft size={14} style={{ color: C.faint }} />}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
