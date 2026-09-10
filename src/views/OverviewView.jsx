/* ============================================================
   Overview - the single pane the owner opens first. Every number
   here is derived from the same ledger the division views use.
   ============================================================ */
import React, { useMemo } from "react";
import {
  Truck, UtensilsCrossed, BedDouble, Wallet, TrendingUp, ArrowUpRight,
  AlertTriangle, Bell, Clock, CircleDollarSign, Activity, Users, ChevronRight,
} from "lucide-react";
import { C } from "../lib/constants";
import { formatKES, formatCompact, formatDateShort, formatDateLong } from "../lib/format";
import {
  computeMetrics, resolvePeriod, seriesByDay, seriesByMonth, chartRange, occupancySeries, occupancyRate,
  buildAlerts, outstanding,
} from "../lib/derive";
import { TODAY } from "../lib/seed";
import { useStore } from "../lib/store.jsx";
import { useActions } from "../lib/actions.jsx";
import { useCountUp } from "../lib/hooks.js";
import { Card, StatCard, SectionTitle, Badge, Button, TrendPill, EmptyState, ProgressBar } from "../components/ui.jsx";
import { TrendArea, DonutChart, LineSeries } from "../components/Charts.jsx";
import { Page } from "../components/Page.jsx";

const SEV = {
  high: { tone: "coral", icon: AlertTriangle },
  warn: { tone: "amber", icon: AlertTriangle },
  info: { tone: "blue", icon: Activity },
};

const DIV_ICON = { Transport: Truck, Food: UtensilsCrossed, Hospitality: BedDouble, General: Wallet };
const DIV_VIEW = { Transport: "transport", Food: "food", Hospitality: "hospitality", General: "expenses" };

export default function OverviewView() {
  const { data, prefs, setPrefs } = useStore();
  const { navigate } = useActions();

  const range = useMemo(
    () => resolvePeriod(prefs.period, prefs.customRange, new Date(TODAY)),
    [prefs.period, prefs.customRange]
  );
  const m = useMemo(() => computeMetrics(data, range), [data, range]);
  const series = useMemo(() => {
    const cr = chartRange(range, m.current);
    return cr.monthly ? seriesByMonth(m.current, 12, new Date(TODAY)) : seriesByDay(m.current, cr.from, cr.to);
  }, [m.current, range]);
  const occ = useMemo(
    () => occupancySeries(data.rooms, data.bookings, range.from === "1970-01-01" ? range.to : range.from, range.to),
    [data.rooms, data.bookings, range]
  );
  const alerts = useMemo(() => buildAlerts(data, TODAY), [data]);
  const ar = useMemo(() => outstanding(data), [data]);

  const animatedRevenue = useCountUp(Math.round(m.income));
  const occNow = occupancyRate(data.rooms, data.bookings, TODAY);

  const donut = m.byDivision
    .filter((d) => d.income > 0)
    .map((d) => ({ name: d.division, value: d.income }));

  const activity = useMemo(
    () => m.current.filter((l) => l.kind === "income").slice(0, 8),
    [m.current]
  );

  const activeDivisions = m.byDivision.filter((d) => d.division !== "General" && (d.income > 0 || d.expense > 0)).length;

  return (
    <Page>
      {/* hero */}
      <div className="rounded-2xl p-6 md:p-8 text-white relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${C.navy}, ${C.navy3})` }}>
        <div className="absolute -right-10 -top-20 h-72 w-72 rounded-full" style={{ background: "radial-gradient(circle, rgba(47,111,237,0.3), transparent 70%)" }} />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-white/50">Total revenue · {range.label}</p>
            <p className="mt-2 text-4xl md:text-5xl font-bold font-display">{formatKES(animatedRevenue)}</p>
            <div className="mt-2 flex items-center gap-2">
              <TrendPill value={m.incomeDelta} />
              <span className="text-xs text-white/45">vs previous {range.label.toLowerCase()}</span>
            </div>
          </div>
          <select
            value={prefs.period}
            onChange={(e) => setPrefs((p) => ({ ...p, period: e.target.value }))}
            className="rounded-lg text-xs font-semibold px-3 py-2 border-0"
            style={{ background: "rgba(255,255,255,0.12)", color: "#fff" }}
          >
            {["Today", "Last 7 days", "This Month", "Last 90 days", "This Year", "All Time"].map((p) => (
              <option key={p} value={p} style={{ color: "#000" }}>{p}</option>
            ))}
          </select>
        </div>
        <div className="relative mt-7 grid grid-cols-2 sm:flex sm:flex-wrap gap-6 sm:gap-10">
          <div>
            <p className="text-xs text-white/50">Total expenses</p>
            <p className="text-lg font-semibold mt-1">{formatKES(m.expense)}</p>
          </div>
          <div>
            <p className="text-xs text-white/50">Net profit</p>
            <p className="text-lg font-semibold mt-1" style={{ color: m.profit >= 0 ? "#6EE7B7" : "#FCA5A5" }}>{formatKES(m.profit)}</p>
          </div>
          <div>
            <p className="text-xs text-white/50">Margin</p>
            <p className="text-lg font-semibold mt-1">{m.income ? `${Math.round(m.margin)}%` : "-"}</p>
          </div>
          <div>
            <p className="text-xs text-white/50">Active divisions</p>
            <p className="text-lg font-semibold mt-1">{activeDivisions} of 3</p>
          </div>
        </div>
      </div>

      {/* division cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        {m.byDivision.filter((d) => d.division !== "General").map((d) => {
          const Icon = DIV_ICON[d.division];
          return (
            <Card key={d.division} hover as="button" onClick={() => navigate(DIV_VIEW[d.division])} className="text-left w-full">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: DIV_META(d.division).soft }}>
                    <Icon size={18} style={{ color: DIV_META(d.division).color }} />
                  </div>
                  <p className="font-semibold text-sm" style={{ color: C.ink }}>{d.division}</p>
                </div>
                <TrendPill value={d.incomeDelta} />
              </div>
              <div className="mt-4 flex items-end justify-between">
                <div>
                  <p className="text-xs" style={{ color: C.muted }}>Revenue</p>
                  <p className="text-lg font-bold font-display" style={{ color: C.ink }}>{formatKES(d.income)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs" style={{ color: C.muted }}>Net</p>
                  <p className="text-sm font-semibold" style={{ color: d.profit >= 0 ? C.emerald : C.coral }}>{formatKES(d.profit)}</p>
                </div>
              </div>
              <div className="mt-3">
                <ProgressBar value={m.income ? (d.income / m.income) * 100 : 0} tone={DIV_META(d.division).color} height={6} />
              </div>
            </Card>
          );
        })}
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={CircleDollarSign} label="Outstanding invoices" value={formatKES(ar.total)} sub={`${ar.rows.length} unpaid`} tint={C.amber} onClick={() => navigate("reports")} />
        <StatCard icon={BedDouble} label="Occupancy today" value={`${occNow}%`} sub={`${data.rooms.length} rooms`} tint={C.coral} onClick={() => navigate("hospitality")} />
        <StatCard icon={Bell} label="Needs attention" value={alerts.length} sub={`${alerts.filter((a) => a.severity === "high").length} urgent`} tint={C.blue} onClick={() => navigate("updates")} />
        <StatCard icon={Users} label="Team" value={data.users.filter((u) => u.status === "Active").length} sub={`${data.users.length} total`} tint={C.violet} onClick={() => navigate("users")} />
      </div>

      {/* charts */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <SectionTitle title="Revenue vs expenses" subtitle={range.label} />
          <TrendArea data={series} />
          <div className="flex gap-5 mt-1">
            <Legend color={C.blue} label="Income" />
            <Legend color={C.coral} label="Expenses" />
          </div>
        </Card>
        <Card>
          <SectionTitle title="Revenue mix" />
          <DonutChart data={donut} centerLabel="Total" centerValue={formatCompact(m.income)} />
          <div className="space-y-2 mt-3">
            {m.byDivision.filter((d) => d.income > 0).map((d) => (
              <div key={d.division} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5" style={{ color: C.ink }}>
                  <span className="h-2 w-2 rounded-full" style={{ background: DIV_META(d.division).color }} />
                  {d.division}
                </span>
                <span style={{ color: C.muted }}>{Math.round((d.income / m.income) * 100)}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <SectionTitle title="Hospitality occupancy" subtitle="Share of rooms sold per day" />
          <LineSeries data={occ} dataKey="rate" color={C.coral} />
        </Card>
        <Card>
          <SectionTitle title="Needs attention" action={alerts.length > 0 && <Badge tone="coral" size="sm">{alerts.length}</Badge>} />
          <div className="space-y-3 max-h-[280px] overflow-y-auto n1-scroll pr-1">
            {alerts.length === 0 && <EmptyState icon={TrendingUp} text="All clear" sub="Nothing needs your attention right now." />}
            {alerts.map((a) => {
              const s = SEV[a.severity];
              const Icon = s.icon;
              return (
                <button
                  key={a.id}
                  onClick={() => navigate(a.view)}
                  className="w-full text-left flex items-start gap-2.5 rounded-xl p-2.5 transition-colors"
                  style={{ background: C.surface2 }}
                >
                  <Icon size={15} style={{ color: `var(--${s.tone === "coral" ? "coral" : s.tone === "amber" ? "amber" : "blue"})`, marginTop: 2 }} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium" style={{ color: C.ink }}>{a.title}</span>
                    <span className="block text-xs mt-0.5" style={{ color: C.muted }}>{a.detail}</span>
                  </span>
                  <ChevronRight size={14} style={{ color: C.faint, marginTop: 3 }} />
                </button>
              );
            })}
          </div>
        </Card>
      </div>

      {/* activity + reminders */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2" padded={false}>
          <div className="p-5 pb-3">
            <SectionTitle title="Recent income" action={<Button variant="ghost" size="sm" onClick={() => navigate("reports")}>All records <ArrowUpRight size={13} /></Button>} />
          </div>
          <div className="overflow-x-auto n1-scroll">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: C.surface2 }}>
                  {["Division", "Description", "Date", "Amount"].map((h) => (
                    <th key={h} className={`font-semibold px-5 py-2.5 text-xs ${h === "Amount" ? "text-right" : "text-left"}`} style={{ color: C.muted }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activity.map((a) => (
                  <tr key={a.id} className="border-t" style={{ borderColor: C.line }}>
                    <td className="px-5 py-2.5"><Badge tone={DIV_META(a.division).tone} size="sm">{a.division}</Badge></td>
                    <td className="px-5 py-2.5 max-w-[240px] truncate" style={{ color: C.ink }}>{a.desc}</td>
                    <td className="px-5 py-2.5" style={{ color: C.muted }}>{formatDateShort(a.date)}</td>
                    <td className="px-5 py-2.5 text-right font-semibold" style={{ color: C.ink }}>{formatKES(a.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {activity.length === 0 && <EmptyState icon={Activity} text="No income recorded in this period." />}
          </div>
        </Card>

        <Card>
          <SectionTitle title="Upcoming reminders" action={<Button variant="ghost" size="sm" onClick={() => navigate("updates")}>Manage</Button>} />
          <div className="space-y-2.5">
            {data.reminders.filter((r) => !r.done).sort((a, b) => (a.due < b.due ? -1 : 1)).slice(0, 5).map((r) => {
              const overdue = r.due < TODAY;
              return (
                <div key={r.id} className="flex items-start gap-2.5">
                  <Clock size={15} style={{ color: overdue ? C.coral : C.blue, marginTop: 2 }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate" style={{ color: C.ink }}>{r.title}</p>
                    <p className="text-xs" style={{ color: overdue ? C.coral : C.faint }}>
                      {overdue ? "Overdue · " : "Due "}{formatDateLong(r.due)}
                    </p>
                  </div>
                  {r.priority === "High" && <Badge tone="coral" size="sm">High</Badge>}
                </div>
              );
            })}
            {data.reminders.filter((r) => !r.done).length === 0 && <EmptyState text="No open reminders." />}
          </div>
        </Card>
      </div>
    </Page>
  );
}

function Legend({ color, label }) {
  return (
    <span className="flex items-center gap-1.5 text-xs" style={{ color: C.muted }}>
      <span className="h-2 w-2 rounded-full" style={{ background: color }} /> {label}
    </span>
  );
}

function DIV_META(division) {
  const map = {
    Transport: { color: C.emerald, soft: C.emeraldSoft, tone: "emerald" },
    Food: { color: C.amber, soft: C.amberSoft, tone: "amber" },
    Hospitality: { color: C.coral, soft: C.coralSoft, tone: "coral" },
    General: { color: C.violet, soft: C.violetSoft, tone: "violet" },
  };
  return map[division] || map.General;
}
