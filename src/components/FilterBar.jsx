/* ============================================================
   One filter row used across every list view: a search box, any
   number of dropdowns, an optional date range, and a Clear button
   that appears once something is set.
   ============================================================ */
import React from "react";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { C } from "../lib/constants";

/**
 * @param {object}   search   { value, onChange, placeholder }  (optional)
 * @param {object[]} selects  [{ key, label, value, onChange, options:[{value,label}] }]
 * @param {object}   range    { from, to, onFrom, onTo }  (optional date range)
 * @param {function} onClear  clears everything
 * @param {boolean}  dirty    whether any filter is active (shows Clear)
 * @param {number}   count    result count to show
 */
export default function FilterBar({ search, selects = [], range, onClear, dirty, count }) {
  const field = "rounded-lg border px-3 py-2 text-sm outline-none";
  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: C.muted }}>
        <SlidersHorizontal size={13} /> Filter
      </span>

      {search && (
        <div className="flex items-center gap-2 rounded-lg border px-3 py-2 w-full sm:w-56 order-first" style={{ borderColor: C.line, background: C.surface }}>
          <Search size={14} style={{ color: C.muted }} />
          <input
            value={search.value}
            onChange={(e) => search.onChange(e.target.value)}
            placeholder={search.placeholder || "Search..."}
            className="bg-transparent text-sm flex-1 outline-none"
            style={{ color: C.ink }}
          />
          {search.value && (
            <button onClick={() => search.onChange("")} style={{ color: C.faint }}><X size={13} /></button>
          )}
        </div>
      )}

      {selects.map((sel) => (
        <select
          key={sel.key}
          value={sel.value}
          onChange={(e) => sel.onChange(e.target.value)}
          className={`${field} flex-1 min-w-[46%] sm:min-w-0 sm:flex-none`}
          style={{ borderColor: sel.value && sel.value !== sel.all ? C.blue : C.line, background: C.surface, color: C.ink }}
          aria-label={sel.label}
        >
          {sel.options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      ))}

      {range && (
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <input type="date" value={range.from || ""} onChange={(e) => range.onFrom(e.target.value)} className={`${field} flex-1 sm:flex-none min-w-0`} style={{ borderColor: C.line, background: C.surface, color: C.ink }} />
          <span className="text-xs shrink-0" style={{ color: C.faint }}>to</span>
          <input type="date" value={range.to || ""} onChange={(e) => range.onTo(e.target.value)} className={`${field} flex-1 sm:flex-none min-w-0`} style={{ borderColor: C.line, background: C.surface, color: C.ink }} />
        </div>
      )}

      {dirty && (
        <button
          onClick={onClear}
          className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-2 rounded-lg"
          style={{ color: C.coral, background: C.coralSoft }}
        >
          <X size={12} /> Clear
        </button>
      )}

      {count != null && (
        <span className="ml-auto text-xs" style={{ color: C.faint }}>{count} result{count === 1 ? "" : "s"}</span>
      )}
    </div>
  );
}

/* Small helper: builds a select config with an "all" sentinel. */
export function selectFilter(key, label, values, state, setState, { allLabel } = {}) {
  return {
    key,
    label,
    all: "All",
    value: state,
    onChange: setState,
    options: [{ value: "All", label: allLabel || `All ${label.toLowerCase()}` }, ...values.map((v) => ({ value: v, label: v }))],
  };
}
