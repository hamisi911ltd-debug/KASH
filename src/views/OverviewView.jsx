/* ============================================================
   Overview - the owner's home screen. One glance shows the money
   trajectory, how each service is trending, and what needs a look.
   Numbers are paired with a picture, not stacked in bare boxes.
   ============================================================ */
import React, { useMemo } from "react";
import {
  TrendingUp, ChevronRight, AlertTriangle, Activity, ArrowUpRight, ArrowDownRight,
  Truck, UtensilsCrossed, BedDouble, ArrowRight,
} from "lucide-react";
import { C } from "../lib/constants";
import { formatKES, formatDateShort } from "../lib/format";
import { computeMetrics, resolvePeriod, weeklySeries, buildAlerts, outstanding } from "../lib/derive";
import { TODAY } from "../lib/seed";
import { useStore } from "../lib/store.jsx";
import { useActions } from "../lib/actions.jsx";
import { useChartPalette } from "../lib/hooks.js";
import { Card, SectionTitle, Badge, Button, TrendPill, EmptyState, ProgressBar } from "../components/ui.jsx";
import { GroupedBars, Sparkline } from "../components/Charts.jsx";
import { Page } from "../components/Page.jsx";

const DIV_TONE = { Transport: "emerald", Food: "amber", Hospitality: "coral", General: "violet" };
const SEV_VAR = { high: "var(--coral)", warn: "var(--amber)", info: "var(--blue)" };
const SERVICES = [
  { name: "Transport", key: "transport", icon: Truck, color: C.emerald },
  { name: "Food", key: "food", icon: UtensilsCrossed, color: C.amber },
  { name: "Hospitality", key: "hospitality", icon: BedDouble, color: C.coral },
];

export default function OverviewView() {
  const { data, prefs, setPrefs, session } = useStore();
  const { navigate } = useActions();
  const pal = useChartPalette();

  const range = useMemo(
    () => resolvePeriod(prefs.period, prefs.customRange, new Date(TODAY)),
    [prefs.period, prefs.customRange]
  );
  const m = useMemo(() => computeMetrics(data, range), [data, range]);
  const weekly = useMemo(() => weeklySeries(m.ledger, 12, new Date(TODAY)), [m.ledger]);
  const divWeekly = useMemo(() => {
    const map = {};
    SERVICES.forEach((sv) => {
      map[sv.name] = weeklySeries(
        m.ledger.filter((l) => l.division === sv.name && l.kind === "income"),
        10,
        new Date(TODAY)
      ).map((w) => ({ v: w.income }));
    });
    return map;
  }, [m.ledger]);
  const alerts = useMemo(() => buildAlerts(data, TODAY), [data]);
  const ar = useMemo(() => outstanding(data), [data]);
  const firstName = (session?.name || "there").split(" ")[0];

  const recent = m.current.slice(0, 6);
  const netTone = m.profit >= 0 ? C.blue : C.coral;

  return (
    <Page>
      {/* greeting */}
      <div className="flex items-end justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-lg sm:text-xl font-bold font-display" style={{ color: C.ink }}>Hi {firstName} 👋</h1>
          <p className="text-xs sm:text-sm mt-0.5" style={{ color: C.muted }}>Here's your business at a glance.</p>
        </div>
        <select
          value={prefs.period}
          onChange={(e) => setPrefs((p) => ({ ...p, period: e.target.value }))}
          className="rounded-lg border px-3 py-2 text-sm font-medium"
          style={{ borderColor: C.line, background: C.surface }}
        >
          {["Today", "Last 7 days", "This Month", "Last 90 days", "This Year", "All Time"].map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
      </div>

      {/* hero: net position + trajectory */}
      <Card
        className="relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${C.blueSoft}, ${C.surface} 62%)` }}
      >
        <div className="relative flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
          <div className="min-w-0">
            <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-wide" style={{ color: C.muted }}>
              Net position · {range.label}
            </p>
            <p className="mt-1 text-[26px] sm:text-3xl md:text-[34px] font-bold font-display leading-none" style={{ color: netTone }}>
              {formatKES(m.profit)}
            </p>
            <div className="mt-2.5 flex items-center gap-2 flex-wrap">
              <TrendPill value={m.profitDelta} />
              <span className="text-xs" style={{ color: C.faint }}>vs previous period</span>
            </div>
          </div>

          <div className="flex gap-2 sm:gap-3">
            <MoneyChip icon={ArrowDownRight} label="Money in" value={formatKES(m.income)} tone={C.emerald} />
            <MoneyChip icon={ArrowUpRight} label="Money out" value={formatKES(m.expense)} tone={C.coral} />
          </div>
        </div>

        {/* trajectory sparkline bleeds to the card edges */}
        <div className="mt-4 -mx-3.5 sm:-mx-4 -mb-3.5 sm:-mb-4">
          <Sparkline data={weekly.map((w) => ({ v: w.profit }))} dataKey="v" color={pal.blue} height={70} />
        </div>
      </Card>

      {/* per-service: revenue + its own trend + share of the whole */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3.5">
        {SERVICES.map((sv, i) => {
          const d = m.byDivision.find((x) => x.division === sv.name) || { income: 0, profit: 0, incomeDelta: null };
          const share = m.income ? Math.round((d.income / m.income) * 100) : 0;
          return (
            <Card
              key={sv.key}
              as="button"
              hover
              onClick={() => navigate(sv.key)}
              className={`text-left w-full ${i === 2 ? "col-span-2 sm:col-span-1" : ""}`}
            >
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: sv.color + "22" }}>
                  <sv.icon size={14} style={{ color: sv.color }} />
                </div>
                <p className="font-bold text-sm" style={{ color: C.ink }}>{sv.name}</p>
                <ChevronRight size={14} className="ml-auto" style={{ color: C.faint }} />
              </div>

              <p className="mt-2 text-[15px] sm:text-base font-bold font-display truncate" style={{ color: C.ink }}>
                {formatKES(d.income)}
              </p>

              <div className="mt-1 -mx-1" style={{ height: 30 }}>
                <Sparkline data={divWeekly[sv.name]} dataKey="v" color={sv.color} height={30} />
              </div>

              <div className="mt-1.5 flex items-center gap-2">
                <ProgressBar value={share} tone={sv.color} height={5} />
                <span className="text-[10px] font-semibold shrink-0" style={{ color: C.muted }}>{share}%</span>
              </div>
            </Card>
          );
        })}
      </div>

      {/* money in vs money out */}
      <Card>
        <SectionTitle
          title="Money in vs money out"
          subtitle="Each week for the last 12 weeks"
          action={
            <div className="flex gap-3">
              <Legend color={pal.blue} label="In" />
              <Legend color={pal.coral} label="Out" />
            </div>
          }
        />
        <GroupedBars
          data={weekly}
          series={[
            { key: "income", label: "Money in", color: pal.blue },
            { key: "expense", label: "Money out", color: pal.coral },
          ]}
          height={220}
        />
      </Card>

      {/* what happened + what to check */}
      <div className="grid lg:grid-cols-2 gap-3 sm:gap-4">
        <Card padded={false}>
          <div className="p-4 sm:p-5 pb-3">
            <SectionTitle
              title="Latest activity"
              action={<Button variant="ghost" size="sm" onClick={() => navigate("reports")}>See all</Button>}
            />
          </div>
          <div className="divide-y" style={{ borderColor: C.line }}>
            {recent.map((l) => (
              <div key={l.id} className="flex items-center gap-3 px-4 sm:px-5 py-2.5">
                <span
                  className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: (l.kind === "income" ? C.emerald : C.coral) + "1f" }}
                >
                  {l.kind === "income" ? <ArrowDownRight size={13} style={{ color: C.emerald }} /> : <ArrowUpRight size={13} style={{ color: C.coral }} />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm truncate" style={{ color: C.ink }}>
                    {l.kind === "income" ? "Received" : "Spent"} · {l.division}
                  </p>
                  <p className="text-xs" style={{ color: C.faint }}>{formatDateShort(l.date)}</p>
                </div>
                <span className="text-sm font-bold shrink-0" style={{ color: l.kind === "income" ? C.emerald : C.coral }}>
                  {l.kind === "income" ? "+" : "−"}{formatKES(l.amount)}
                </span>
              </div>
            ))}
            {recent.length === 0 && <div className="px-5"><EmptyState icon={Activity} text="Nothing yet in this period." /></div>}
          </div>
        </Card>

        <Card>
          <SectionTitle
            title="Needs a look"
            action={
              <span className="flex items-center gap-2">
                {ar.total > 0 && <Badge tone="amber" size="sm">{formatKES(ar.total)} unpaid</Badge>}
                {alerts.length > 4 && <Button variant="ghost" size="sm" onClick={() => navigate("updates")}>See all</Button>}
              </span>
            }
          />
          <div className="space-y-2">
            {alerts.length === 0 && <EmptyState icon={TrendingUp} text="All good" sub="Nothing needs you right now." />}
            {alerts.slice(0, 4).map((a) => (
              <button
                key={a.id}
                onClick={() => navigate(a.view)}
                className="w-full text-left flex items-start gap-2.5 rounded-xl p-2.5 transition-colors"
                style={{ background: C.surface2 }}
              >
                <AlertTriangle size={15} style={{ color: SEV_VAR[a.severity], marginTop: 2 }} />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium" style={{ color: C.ink }}>{a.title}</span>
                  <span className="block text-xs mt-0.5" style={{ color: C.muted }}>{a.detail}</span>
                </span>
                <ChevronRight size={14} style={{ color: C.faint, marginTop: 3 }} />
              </button>
            ))}
          </div>
        </Card>
      </div>
    </Page>
  );
}

function MoneyChip({ icon: Icon, label, value, tone }) {
  return (
    <div className="rounded-xl border px-3 py-2" style={{ borderColor: C.line, background: C.surface }}>
      <p className="text-[10px] font-semibold flex items-center gap-1" style={{ color: C.muted }}>
        <Icon size={11} style={{ color: tone }} /> {label}
      </p>
      <p className="mt-0.5 text-sm font-bold font-display" style={{ color: C.ink }}>{value}</p>
    </div>
  );
}

function Legend({ color, label }) {
  return (
    <span className="flex items-center gap-1.5 text-xs" style={{ color: C.muted }}>
      <span className="h-2 w-2 rounded-full" style={{ background: color }} /> {label}
    </span>
  );
}
