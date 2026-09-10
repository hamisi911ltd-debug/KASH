/* ============================================================
   Overview - the one screen the business owner opens to see
   everything at once: money in, money out, position, what needs
   doing, and where revenue comes from.
   ============================================================ */
import React, { useMemo } from "react";
import {
  TrendingUp, TrendingDown, Wallet, Bell, ChevronRight, AlertTriangle,
  Activity, Clock, ArrowUpRight,
} from "lucide-react";
import { C } from "../lib/constants";
import { formatKES, formatCompact, formatDateShort, formatDateLong } from "../lib/format";
import {
  computeMetrics, resolvePeriod, weeklySeries, buildAlerts, outstanding,
} from "../lib/derive";
import { TODAY } from "../lib/seed";
import { useStore } from "../lib/store.jsx";
import { useActions } from "../lib/actions.jsx";
import { useChartPalette } from "../lib/hooks.js";
import { Card, StatCard, SectionTitle, Badge, Button, EmptyState } from "../components/ui.jsx";
import { GroupedBars, DonutChart } from "../components/Charts.jsx";
import { Page } from "../components/Page.jsx";

const DIV_TONE = { Transport: "emerald", Food: "amber", Hospitality: "coral", General: "violet" };
const TONE_VAR = { emerald: "var(--emerald)", amber: "var(--amber)", coral: "var(--coral)", violet: "var(--violet)" };
const SEV_VAR = { high: "var(--coral)", warn: "var(--amber)", info: "var(--blue)" };

export default function OverviewView() {
  const { data, prefs, setPrefs, session } = useStore();
  const { navigate } = useActions();
  const pal = useChartPalette();

  const range = useMemo(
    () => resolvePeriod(prefs.period, prefs.customRange, new Date(TODAY)),
    [prefs.period, prefs.customRange]
  );
  const m = useMemo(() => computeMetrics(data, range), [data, range]);
  const alerts = useMemo(() => buildAlerts(data, TODAY), [data]);
  const ar = useMemo(() => outstanding(data), [data]);

  // Live 12-week bar chart, straight off the ledger - recomputes on every edit.
  const weekly = useMemo(() => weeklySeries(m.ledger, 12, new Date(TODAY)), [m.ledger]);

  const unread = data.notifications.filter((n) => !n.read).length;
  const firstName = (session?.name || "there").split(" ")[0];

  const activity = useMemo(
    () =>
      m.current.slice(0, 8).map((l) => ({
        id: l.id,
        date: l.date,
        division: l.division,
        action: l.kind === "income" ? "Amount received" : "Expense added",
        kind: l.kind,
        amount: l.amount,
      })),
    [m.current]
  );

  const revenueMix = m.byDivision.filter((d) => d.income > 0).map((d) => ({ name: d.division, value: d.income }));
  const mixTotal = revenueMix.reduce((s, d) => s + d.value, 0) || 1;

  const openReminders = data.reminders
    .filter((r) => !r.done)
    .sort((a, b) => (a.due < b.due ? -1 : 1))
    .slice(0, 5);

  return (
    <Page>
      {/* greeting + period */}
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold font-display" style={{ color: C.ink }}>Welcome, {firstName}</h1>
          <p className="text-sm mt-1" style={{ color: C.muted }}>
            Here's what's happening across all services · {range.label.toLowerCase()}.
          </p>
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

      {/* money at a glance */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={TrendingUp} label="Total received" value={formatKES(m.income)} trend={m.incomeDelta} tint={C.emerald} />
        <StatCard icon={TrendingDown} label="Total expenses" value={formatKES(m.expense)} trend={m.expenseDelta} trendInvert tint={C.coral} />
        <StatCard icon={Wallet} label="Net position" value={formatKES(m.profit)} trend={m.profitDelta} tint={C.blue} />
        <StatCard
          icon={Bell}
          label="Pending updates"
          value={unread}
          sub={`${alerts.length} need${alerts.length === 1 ? "s" : ""} attention`}
          tint={C.amber}
          onClick={() => navigate("updates")}
        />
      </div>

      {/* received vs spent - live weekly bars */}
      <Card>
        <SectionTitle
          title="Received vs spent"
          subtitle="Each week for the last 12 · updates as you add records"
          action={
            <div className="flex gap-4">
              <Legend color={pal.blue} label="Received" />
              <Legend color={pal.coral} label="Spent" />
            </div>
          }
        />
        <GroupedBars
          data={weekly}
          series={[
            { key: "income", label: "Received", color: pal.blue },
            { key: "expense", label: "Spent", color: pal.coral },
          ]}
          height={260}
        />
      </Card>

      {/* activity + revenue mix */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2" padded={false}>
          <div className="p-5 pb-3">
            <SectionTitle
              title="Recent activity"
              action={<Button variant="ghost" size="sm" onClick={() => navigate("reports")}>All records <ArrowUpRight size={13} /></Button>}
            />
          </div>
          <div className="overflow-x-auto n1-scroll">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: C.surface2 }}>
                  {["Date", "Service", "Action", "Amount"].map((h) => (
                    <th key={h} className={`font-semibold px-5 py-2.5 text-xs ${h === "Amount" ? "text-right" : "text-left"}`} style={{ color: C.muted }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activity.map((a) => (
                  <tr key={a.id} className="border-t" style={{ borderColor: C.line }}>
                    <td className="px-5 py-2.5" style={{ color: C.muted }}>{formatDateShort(a.date)}</td>
                    <td className="px-5 py-2.5"><Badge tone={DIV_TONE[a.division]} size="sm">{a.division}</Badge></td>
                    <td className="px-5 py-2.5" style={{ color: C.ink }}>
                      <span className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: a.kind === "income" ? C.emerald : C.coral }} />
                        {a.action}
                      </span>
                    </td>
                    <td className="px-5 py-2.5 text-right font-semibold" style={{ color: a.kind === "income" ? C.emerald : C.coral }}>
                      {a.kind === "income" ? "+" : "−"}{formatKES(a.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {activity.length === 0 && <EmptyState icon={Activity} text="No activity in this period." />}
          </div>
        </Card>

        <Card>
          <SectionTitle title="Where revenue comes from" />
          <DonutChart data={revenueMix} centerLabel="Total" centerValue={formatCompact(mixTotal)} />
          <div className="space-y-1 mt-3">
            {m.byDivision.filter((d) => d.income > 0).map((d) => (
              <button
                key={d.division}
                onClick={() => navigate(d.division === "General" ? "expenses" : d.division.toLowerCase())}
                className="w-full flex items-center justify-between text-xs py-1.5"
              >
                <span className="flex items-center gap-1.5" style={{ color: C.ink }}>
                  <span className="h-2 w-2 rounded-full" style={{ background: TONE_VAR[DIV_TONE[d.division]] }} />
                  {d.division}
                </span>
                <span style={{ color: C.muted }}>{Math.round((d.income / mixTotal) * 100)}% · {formatKES(d.income)}</span>
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* what to act on */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <SectionTitle title="Needs attention" action={alerts.length > 0 && <Badge tone="coral" size="sm">{alerts.length}</Badge>} />
          <div className="space-y-2.5 max-h-[300px] overflow-y-auto n1-scroll">
            {alerts.length === 0 && <EmptyState icon={TrendingUp} text="All clear" sub="Nothing needs you right now." />}
            {alerts.map((a) => (
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

        <Card>
          <SectionTitle
            title="Upcoming reminders"
            action={
              <span className="flex items-center gap-2">
                {ar.total > 0 && <Badge tone="amber" size="sm">{formatKES(ar.total)} owed</Badge>}
                <Button variant="ghost" size="sm" onClick={() => navigate("updates")}>Manage</Button>
              </span>
            }
          />
          <div className="space-y-2.5">
            {openReminders.map((r) => {
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
            {openReminders.length === 0 && <EmptyState text="No open reminders." />}
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
