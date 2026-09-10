/* ============================================================
   Overview - deliberately plain. Anyone should understand it in
   ten seconds: money in, money out, what's left, how each service
   is doing, the trend, and what needs a look.
   ============================================================ */
import React, { useMemo } from "react";
import {
  TrendingUp, TrendingDown, Wallet, ChevronRight, AlertTriangle, Activity,
  Truck, UtensilsCrossed, BedDouble, ArrowRight,
} from "lucide-react";
import { C } from "../lib/constants";
import { formatKES, formatDateShort } from "../lib/format";
import { computeMetrics, resolvePeriod, weeklySeries, buildAlerts, outstanding } from "../lib/derive";
import { TODAY } from "../lib/seed";
import { useStore } from "../lib/store.jsx";
import { useActions } from "../lib/actions.jsx";
import { useChartPalette } from "../lib/hooks.js";
import { Card, SectionTitle, Badge, Button, TrendPill, EmptyState } from "../components/ui.jsx";
import { GroupedBars } from "../components/Charts.jsx";
import { Page } from "../components/Page.jsx";

const DIV_TONE = { Transport: "emerald", Food: "amber", Hospitality: "coral", General: "violet" };
const SEV_VAR = { high: "var(--coral)", warn: "var(--amber)", info: "var(--blue)" };
const SERVICES = [
  { name: "Transport", key: "transport", icon: Truck, color: C.emerald },
  { name: "Food", key: "food", icon: UtensilsCrossed, color: C.amber },
  { name: "Hospitality", key: "hospitality", icon: BedDouble, color: C.coral },
];

function BigStat({ label, value, tone, trend, invert }) {
  return (
    <Card>
      <p className="text-sm font-medium" style={{ color: C.muted }}>{label}</p>
      <p className="mt-2 text-2xl md:text-[28px] font-bold font-display" style={{ color: tone }}>{value}</p>
      {trend != null && (
        <p className="mt-2 flex items-center gap-2 text-xs" style={{ color: C.faint }}>
          <TrendPill value={trend} invert={invert} /> vs last week
        </p>
      )}
    </Card>
  );
}

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
  const alerts = useMemo(() => buildAlerts(data, TODAY), [data]);
  const ar = useMemo(() => outstanding(data), [data]);
  const firstName = (session?.name || "there").split(" ")[0];

  const recent = m.current.slice(0, 6);

  return (
    <Page>
      {/* greeting */}
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold font-display" style={{ color: C.ink }}>Hi {firstName} 👋</h1>
          <p className="text-sm mt-1" style={{ color: C.muted }}>Here's your business at a glance.</p>
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

      {/* the three numbers that matter */}
      <div className="grid sm:grid-cols-3 gap-4">
        <BigStat label="Money in" value={formatKES(m.income)} tone={C.emerald} trend={m.incomeDelta} />
        <BigStat label="Money out" value={formatKES(m.expense)} tone={C.coral} trend={m.expenseDelta} invert />
        <BigStat label="What's left" value={formatKES(m.profit)} tone={m.profit >= 0 ? C.blue : C.coral} trend={m.profitDelta} />
      </div>

      {/* each service - tap to open */}
      <div className="grid sm:grid-cols-3 gap-4">
        {SERVICES.map((s) => {
          const d = m.byDivision.find((x) => x.division === s.name) || { income: 0, profit: 0 };
          return (
            <Card key={s.key} as="button" hover onClick={() => navigate(s.key)} className="text-left w-full">
              <div className="flex items-center gap-2.5">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: s.color + "22" }}>
                  <s.icon size={19} style={{ color: s.color }} />
                </div>
                <p className="font-bold" style={{ color: C.ink }}>{s.name}</p>
              </div>
              <p className="mt-3 text-lg font-bold font-display" style={{ color: C.ink }}>{formatKES(d.income)}</p>
              <p className="text-xs" style={{ color: C.muted }}>
                came in · <span style={{ color: d.profit >= 0 ? C.emerald : C.coral }}>{formatKES(d.profit)} left</span>
              </p>
              <p className="mt-3 text-xs font-bold flex items-center gap-1" style={{ color: s.color }}>
                Open {s.name} <ArrowRight size={13} />
              </p>
            </Card>
          );
        })}
      </div>

      {/* one simple chart */}
      <Card>
        <SectionTitle
          title="Money in vs money out"
          subtitle="Each week for the last 12 weeks"
          action={
            <div className="flex gap-4">
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
          height={260}
        />
      </Card>

      {/* what happened + what to check */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card padded={false}>
          <div className="p-5 pb-3">
            <SectionTitle
              title="Latest activity"
              action={<Button variant="ghost" size="sm" onClick={() => navigate("reports")}>See all</Button>}
            />
          </div>
          <div className="divide-y" style={{ borderColor: C.line }}>
            {recent.map((l) => (
              <div key={l.id} className="flex items-center gap-3 px-5 py-3">
                <span className="h-2 w-2 rounded-full shrink-0" style={{ background: l.kind === "income" ? C.emerald : C.coral }} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm truncate" style={{ color: C.ink }}>
                    {l.kind === "income" ? "Money received" : "Money spent"} · {l.division}
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
          <div className="space-y-2.5">
            {alerts.length === 0 && <EmptyState icon={TrendingUp} text="All good" sub="Nothing needs you right now." />}
            {alerts.slice(0, 4).map((a) => (
              <button
                key={a.id}
                onClick={() => navigate(a.view)}
                className="w-full text-left flex items-start gap-2.5 rounded-xl p-3 transition-colors"
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

function Legend({ color, label }) {
  return (
    <span className="flex items-center gap-1.5 text-xs" style={{ color: C.muted }}>
      <span className="h-2 w-2 rounded-full" style={{ background: color }} /> {label}
    </span>
  );
}
