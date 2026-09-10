/* ============================================================
   Core UI kit. Every view is built from these primitives, so a
   single tweak here (radius, shadow, tone) reflows the whole app.
   ============================================================ */
import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { C } from "../lib/constants";
import { formatPercent } from "../lib/format";

/* ---------------------------------------------------------- Badge */

const TONES = {
  emerald: { bg: C.emeraldSoft, fg: C.emerald },
  amber: { bg: C.amberSoft, fg: C.amber },
  coral: { bg: C.coralSoft, fg: C.coral },
  blue: { bg: C.blueSoft, fg: C.blue },
  violet: { bg: C.violetSoft, fg: C.violet },
  slate: { bg: C.slateSoft, fg: C.muted },
};

export function Badge({ children, tone = "slate", dot = false, size = "md", className = "" }) {
  const t = TONES[tone] || TONES.slate;
  const pad = size === "sm" ? "px-2 py-0.5 text-[10.5px]" : "px-2.5 py-1 text-xs";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold whitespace-nowrap ${pad} ${className}`}
      style={{ background: t.bg, color: t.fg }}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full" style={{ background: t.fg }} />}
      {children}
    </span>
  );
}

/* ---------------------------------------------------------- Card */

export function Card({ children, className = "", padded = true, hover = false, as: As = "div", ...rest }) {
  return (
    <As
      className={`rounded-2xl border ${padded ? "p-5" : ""} ${hover ? "transition-transform duration-200 hover:-translate-y-0.5" : ""} ${className}`}
      style={{ background: C.surface, borderColor: C.line, boxShadow: C.shadowSm }}
      {...rest}
    >
      {children}
    </As>
  );
}

/* ---------------------------------------------------------- Trend pill */

export function TrendPill({ value, invert = false, size = "sm" }) {
  if (value == null || !Number.isFinite(value)) return null;
  const up = value > 0.4;
  const down = value < -0.4;
  const good = invert ? down : up;
  const bad = invert ? up : down;
  const tone = good ? "emerald" : bad ? "coral" : "slate";
  const Icon = up ? TrendingUp : down ? TrendingDown : Minus;
  return (
    <Badge tone={tone} size={size}>
      <Icon size={11} strokeWidth={2.5} />
      {formatPercent(Math.abs(value), Math.abs(value) < 10 ? 1 : 0)}
    </Badge>
  );
}

/* ---------------------------------------------------------- Stat tile */

export function StatCard({ icon: Icon, label, value, sub, tint = C.blue, trend, onClick }) {
  const Comp = onClick ? "button" : "div";
  return (
    <Card
      as={Comp}
      onClick={onClick}
      hover={!!onClick}
      className={onClick ? "text-left w-full cursor-pointer" : ""}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium truncate" style={{ color: C.muted }}>{label}</p>
          <p className="mt-2 text-xl font-bold truncate font-display" style={{ color: C.ink }}>{value}</p>
          {sub && <p className="mt-1 text-xs truncate" style={{ color: C.faint }}>{sub}</p>}
        </div>
        <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: tint + "1f" }}>
          <Icon size={18} style={{ color: tint }} />
        </div>
      </div>
      {trend !== undefined && (
        <div className="mt-3">
          <TrendPill value={trend} />
        </div>
      )}
    </Card>
  );
}

/* ---------------------------------------------------------- Section header */

export function SectionTitle({ title, subtitle, action, size = "md" }) {
  return (
    <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
      <div>
        <h2 className={`font-bold font-display ${size === "lg" ? "text-lg" : "text-base"}`} style={{ color: C.ink }}>{title}</h2>
        {subtitle && <p className="text-xs mt-0.5" style={{ color: C.muted }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/* ---------------------------------------------------------- Button */

export function Button({
  children, onClick, variant = "primary", type = "button", size = "md",
  disabled = false, className = "", title, as: As = "button", ...rest
}) {
  const styles = {
    primary: { background: C.blue, color: "#fff" },
    dark: { background: C.navy2, color: "#fff" },
    outline: { background: C.surface, color: C.ink, border: `1px solid ${C.lineStrong}` },
    ghost: { background: "transparent", color: C.ink },
    danger: { background: C.coralSoft, color: C.coral },
    subtle: { background: C.surface2, color: C.ink },
  };
  const sizes = { xs: "px-2.5 py-1.5 text-xs gap-1", sm: "px-3 py-1.5 text-xs gap-1.5", md: "px-4 py-2 text-sm gap-1.5", lg: "px-5 py-2.5 text-sm gap-2" };
  return (
    <As
      type={As === "button" ? type : undefined}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`rounded-lg font-semibold inline-flex items-center justify-center transition-all duration-150 hover:opacity-85 active:scale-[0.97] disabled:opacity-45 disabled:pointer-events-none ${sizes[size]} ${className}`}
      style={styles[variant]}
      {...rest}
    >
      {children}
    </As>
  );
}

export function IconButton({ icon: Icon, onClick, size = 17, className = "", title, active = false, tone }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`h-9 w-9 rounded-lg flex items-center justify-center transition-colors ${className}`}
      style={{ background: active ? C.blueSoft : C.surface2, color: tone || (active ? C.blue : C.ink) }}
    >
      <Icon size={size} />
    </button>
  );
}

/* ---------------------------------------------------------- Empty state */

export function EmptyState({ icon: Icon, text, sub, action }) {
  return (
    <div className="py-12 text-center flex flex-col items-center gap-2">
      {Icon && (
        <div className="h-11 w-11 rounded-2xl flex items-center justify-center mb-1" style={{ background: C.surface2 }}>
          <Icon size={20} style={{ color: C.faint }} />
        </div>
      )}
      <p className="text-sm font-medium" style={{ color: C.ink2 }}>{text}</p>
      {sub && <p className="text-xs max-w-xs" style={{ color: C.faint }}>{sub}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/* ---------------------------------------------------------- Skeleton / loading */

export function Skeleton({ className = "" }) {
  return <div className={`rounded-lg animate-pulse ${className}`} style={{ background: C.surface2 }} />;
}

export function Spinner({ size = 16, color = "currentColor" }) {
  return (
    <span
      className="inline-block rounded-full animate-spin shrink-0"
      style={{ width: size, height: size, border: "2px solid rgba(127,127,127,0.25)", borderTopColor: color }}
    />
  );
}

/* ---------------------------------------------------------- Avatar */

export function Avatar({ name = "", size = 36, tone }) {
  const initials = name.trim().split(/\s+/).map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
  return (
    <div
      className="rounded-full flex items-center justify-center font-bold text-white shrink-0 font-display"
      style={{ width: size, height: size, fontSize: size * 0.38, background: tone || C.navy3 }}
    >
      {initials || "?"}
    </div>
  );
}

/* ---------------------------------------------------------- Toggle switch */

export function Toggle({ checked, onChange, label, disabled = false }) {
  const body = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="w-11 h-6 rounded-full relative transition-colors shrink-0 disabled:opacity-50"
      style={{ background: checked ? C.blue : C.surface3 }}
    >
      <span
        className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all"
        style={{ left: checked ? 22 : 2 }}
      />
    </button>
  );
  if (!label) return body;
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm" style={{ color: C.ink }}>{label}</span>
      {body}
    </div>
  );
}

/* ---------------------------------------------------------- Progress bar */

export function ProgressBar({ value, tone = C.blue, height = 8, track }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="rounded-full overflow-hidden w-full" style={{ height, background: track || C.surface2 }}>
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: tone }} />
    </div>
  );
}

/* ---------------------------------------------------------- Segmented control */

export function Segmented({ options, value, onChange, size = "sm" }) {
  const pad = size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm";
  return (
    <div className="inline-flex rounded-xl p-1 gap-0.5" style={{ background: C.surface2 }}>
      {options.map((opt) => {
        const val = typeof opt === "string" ? opt : opt.value;
        const label = typeof opt === "string" ? opt : opt.label;
        const active = value === val;
        return (
          <button
            key={val}
            type="button"
            onClick={() => onChange(val)}
            className={`rounded-lg font-semibold transition-all ${pad}`}
            style={active ? { background: C.surface, color: C.ink, boxShadow: C.shadowSm } : { color: C.muted }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

/* ---------------------------------------------------------- Tooltip (hover hint) */

export function Hint({ children, text }) {
  return (
    <span className="relative group inline-flex">
      {children}
      <span
        className="pointer-events-none absolute z-50 left-1/2 -translate-x-1/2 bottom-full mb-1.5 whitespace-nowrap rounded-md px-2 py-1 text-[11px] font-medium opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all"
        style={{ background: C.navy, color: "#fff" }}
      >
        {text}
      </span>
    </span>
  );
}

/* ---------------------------------------------------------- Kbd */

export function Kbd({ children }) {
  return (
    <kbd
      className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold font-sans border"
      style={{ background: C.surface2, borderColor: C.line, color: C.muted }}
    >
      {children}
    </kbd>
  );
}

/* ---------------------------------------------------------- Select-like chip filter row */

export function ChipRow({ options, value, onChange }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {options.map((opt) => {
        const val = typeof opt === "string" ? opt : opt.value;
        const label = typeof opt === "string" ? opt : opt.label;
        const active = value === val;
        return (
          <button
            key={val}
            type="button"
            onClick={() => onChange(val)}
            className="px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors"
            style={active ? { background: C.blue, color: "#fff" } : { background: C.surface2, color: C.muted }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
