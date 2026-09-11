/* ============================================================
   Overview - the owner's home screen. One glance shows the money
   trajectory, how each service is trending, and what needs a look.
   Numbers are paired with a picture, not stacked in bare boxes.
   ============================================================ */
import React, { useMemo } from "react";
import {
  TrendingUp, ChevronRight, AlertTriangle, Activity, ArrowUpRight, ArrowDownRight,
  Truck, Drumstick, BedDouble,
} from "lucide-react";
import { C, divisionLabel } from "../lib/constants";
import { formatKES, formatDateShort } from "../lib/format";
import { computeMetrics, resolvePeriod, buildAlerts, outstanding } from "../lib/derive";
import { TODAY } from "../lib/seed";
import { useStore } from "../lib/store.jsx";
import { useActions } from "../lib/actions.jsx";
import { Card, StatCard, SectionTitle, Badge, Button, EmptyState, ProgressBar } from "../components/ui.jsx";
import { Page } from "../components/Page.jsx";

const SEV_VAR = { high: "var(--coral)", warn: "var(--amber)", info: "var(--blue)" };
const SERVICES = [
  { name: "Transport", label: "Transport", key: "transport", icon: Truck, color: C.emerald },
  { name: "Food", label: "Chicken", key: "food", icon: Drumstick, color: C.amber },
  { name: "Hospitality", label: "Hospitality", key: "hospitality", icon: BedDouble, color: C.coral },
];

export default function OverviewView() {
  const { data, prefs, setPrefs, session } = useStore();
  const { navigate } = useActions();

  const range = useMemo(
    () => resolvePeriod(prefs.period, prefs.customRange, new Date(TODAY)),
    [prefs.period, prefs.customRange]
  );
  const m = useMemo(() => computeMetrics(data, range), [data, range]);
  const alerts = useMemo(() => buildAlerts(data, TODAY), [data]);
  const ar = useMemo(() => outstanding(data), [data]);
  const firstName = (session?.name || "there").split(" ")[0];

  const recent = m.current.slice(0, 8);

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

      {/* money in / money out / net position */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3.5">
        <StatCard icon={ArrowDownRight} label={`Money in · ${range.label}`} value={formatKES(m.income)} trend={m.incomeDelta} tint={C.emerald} />
        <StatCard icon={ArrowUpRight} label="Money out" value={formatKES(m.expense)} tint={C.coral} />
        <StatCard icon={TrendingUp} label="Net position" value={formatKES(m.profit)} trend={m.profitDelta} tint={C.blue} />
      </div>

      {/* per-service: revenue + share of the whole */}
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
                <p className="font-bold text-sm" style={{ color: C.ink }}>{sv.label}</p>
                <ChevronRight size={14} className="ml-auto" style={{ color: C.faint }} />
              </div>

              <p className="mt-2 text-[15px] sm:text-base font-bold font-display truncate" style={{ color: C.ink }}>
                {formatKES(d.income)}
              </p>

              <div className="mt-2 flex items-center gap-2">
                <ProgressBar value={share} tone={sv.color} height={5} />
                <span className="text-[10px] font-semibold shrink-0" style={{ color: C.muted }}>{share}% of revenue</span>
              </div>
            </Card>
          );
        })}
      </div>

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
                    {l.kind === "income" ? "Received" : "Spent"} · {divisionLabel(l.division)}
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
