/* ============================================================
   Chart wrappers around Recharts. Every chart pulls its colours
   from the active theme via useChartPalette(), so dark mode is
   handled once, here, not in each view.
   ============================================================ */
import React from "react";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell,
} from "recharts";
import { C } from "../lib/constants";
import { formatKES, formatCompact } from "../lib/format";
import { useChartPalette, useMediaQuery } from "../lib/hooks.js";
import { EmptyState } from "./ui.jsx";

function TooltipBox({ active, payload, label, pal, money = true }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl border px-3 py-2 text-xs"
      style={{ background: pal.tooltipBg, borderColor: pal.tooltipLine, color: pal.tooltipInk, boxShadow: C.shadowMd }}
    >
      {label != null && <p className="font-semibold mb-1">{label}</p>}
      {payload.map((p) => (
        <p key={p.dataKey} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color || p.fill }} />
          <span style={{ color: pal.axis }}>{p.name}:</span>
          <span className="font-semibold">{money ? formatKES(p.value) : p.value}</span>
        </p>
      ))}
    </div>
  );
}

const axisProps = (pal) => ({
  tick: { fontSize: 11, fill: pal.axis },
  axisLine: false,
  tickLine: false,
});

/* Shrink chart height on small screens so a page fits without endless scroll. */
function useChartHeight(h) {
  const small = useMediaQuery("(max-width: 640px)");
  return small ? Math.max(160, Math.round(h * 0.72)) : h;
}

/* ---------------------------------------------------------- Area trend */

export function TrendArea({ data, keys, height = 260, money = true }) {
  const pal = useChartPalette();
  const H = useChartHeight(height);
  if (!data?.length) return <EmptyState text="No data for this range." />;
  const series = keys || [
    { key: "income", label: "Income", color: pal.blue },
    { key: "expense", label: "Expenses", color: pal.coral },
  ];
  return (
    <ResponsiveContainer width="100%" height={H}>
      <AreaChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
        <defs>
          {series.map((s) => (
            <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={s.color} stopOpacity={0.32} />
              <stop offset="95%" stopColor={s.color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={pal.grid} />
        <XAxis dataKey="label" {...axisProps(pal)} minTickGap={18} />
        <YAxis {...axisProps(pal)} tickFormatter={(v) => formatCompact(v)} width={52} />
        <Tooltip content={(p) => <TooltipBox {...p} pal={pal} money={money} />} />
        {series.map((s) => (
          <Area
            key={s.key}
            isAnimationActive={false}
            type="monotone"
            dataKey={s.key}
            name={s.label}
            stroke={s.color}
            strokeWidth={2.4}
            fill={`url(#grad-${s.key})`}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

/* ---------------------------------------------------------- Bars */

export function BarSeries({
  data, dataKey = "value", xKey = "label", color, height = 220,
  money = true, horizontal = false, unit = "", maxValue,
}) {
  const pal = useChartPalette();
  const H = useChartHeight(height);
  if (!data?.length) return <EmptyState text="No data yet." />;
  const fill = color || pal.blue;
  const fmt = unit ? (v) => `${Math.round(v)}${unit}` : (v) => formatCompact(v);
  return (
    <ResponsiveContainer width="100%" height={H}>
      <BarChart
        data={data}
        layout={horizontal ? "vertical" : "horizontal"}
        margin={{ top: 6, right: 12, left: 4, bottom: 0 }}
        barCategoryGap={horizontal ? "22%" : "16%"}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={horizontal} horizontal={!horizontal} stroke={pal.grid} />
        {horizontal ? (
          <>
            <XAxis type="number" {...axisProps(pal)} tickFormatter={fmt} />
            <YAxis type="category" dataKey={xKey} {...axisProps(pal)} width={128} tick={{ fontSize: 10.5, fill: pal.axis }} />
          </>
        ) : (
          <>
            <XAxis dataKey={xKey} {...axisProps(pal)} interval="preserveStartEnd" minTickGap={8} />
            <YAxis {...axisProps(pal)} tickFormatter={fmt} width={unit ? 40 : 52} domain={maxValue ? [0, maxValue] : undefined} allowDecimals={false} />
          </>
        )}
        <Tooltip cursor={{ fill: pal.grid, opacity: 0.35 }} content={(p) => <TooltipBox {...p} pal={pal} money={money} />} />
        <Bar dataKey={dataKey} isAnimationActive={false} fill={fill} radius={horizontal ? [0, 5, 5, 0] : [5, 5, 0, 0]} maxBarSize={horizontal ? 22 : 34} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ---------------------------------------------------------- Grouped bars */

export function GroupedBars({ data, series, xKey = "label", height = 240, money = true }) {
  const pal = useChartPalette();
  const H = useChartHeight(height);
  if (!data?.length) return <EmptyState text="No data for this range." />;
  return (
    <ResponsiveContainer width="100%" height={H}>
      <BarChart data={data} margin={{ top: 6, right: 12, left: 4, bottom: 0 }} barCategoryGap="20%" barGap={2}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={pal.grid} />
        <XAxis dataKey={xKey} {...axisProps(pal)} interval="preserveStartEnd" minTickGap={8} />
        <YAxis {...axisProps(pal)} tickFormatter={(v) => formatCompact(v)} width={52} />
        <Tooltip cursor={{ fill: pal.grid, opacity: 0.35 }} content={(p) => <TooltipBox {...p} pal={pal} money={money} />} />
        {series.map((s) => (
          <Bar key={s.key} dataKey={s.key} isAnimationActive={false} name={s.label} fill={s.color} radius={[3, 3, 0, 0]} maxBarSize={18} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ---------------------------------------------------------- Line */

export function LineSeries({ data, dataKey = "rate", xKey = "label", color, height = 220, suffix = "%", money = false }) {
  const pal = useChartPalette();
  const H = useChartHeight(height);
  if (!data?.length) return <EmptyState text="No data yet." />;
  return (
    <ResponsiveContainer width="100%" height={H}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={pal.grid} />
        <XAxis dataKey={xKey} {...axisProps(pal)} minTickGap={18} />
        <YAxis {...axisProps(pal)} width={44} tickFormatter={(v) => `${v}${suffix}`} domain={[0, 100]} allowDecimals={false} />
        <Tooltip content={(p) => <TooltipBox {...p} pal={pal} money={money} />} />
        <Line type="monotone" dataKey={dataKey} isAnimationActive={false} stroke={color || pal.violet} strokeWidth={2.6} dot={false} activeDot={{ r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

/* ---------------------------------------------------------- Donut */

export function DonutChart({ data, height = 200, money = true, centerLabel, centerValue }) {
  const pal = useChartPalette();
  const H = useChartHeight(height);
  const total = (data || []).reduce((s, d) => s + d.value, 0);
  if (!total) return <EmptyState text="No revenue in this range." />;
  const colorFor = (name) =>
    ({ Transport: pal.emerald, Food: pal.amber, Hospitality: pal.coral, General: pal.violet }[name] || pal.blue);
  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={H}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" isAnimationActive={false} innerRadius="62%" outerRadius="92%" paddingAngle={2} strokeWidth={0}>
            {data.map((d) => (
              <Cell key={d.name} fill={d.color || colorFor(d.name)} />
            ))}
          </Pie>
          <Tooltip content={(p) => <TooltipBox {...p} pal={pal} money={money} />} />
        </PieChart>
      </ResponsiveContainer>
      {centerValue != null && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[10px] font-medium" style={{ color: C.faint }}>{centerLabel}</span>
          <span className="text-base font-bold font-display" style={{ color: C.ink }}>{centerValue}</span>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------- Sparkline */

export function Sparkline({ data, dataKey = "value", color, height = 44 }) {
  const pal = useChartPalette();
  if (!data?.length) return null;
  return (
    <ResponsiveContainer width="100%" height={H}>
      <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`spark-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color || pal.blue} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color || pal.blue} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" isAnimationActive={false} dataKey={dataKey} stroke={color || pal.blue} strokeWidth={2} fill={`url(#spark-${dataKey})`} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
