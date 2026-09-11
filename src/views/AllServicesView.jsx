/* Side-by-side comparison of all three divisions. */
import React, { useMemo } from "react";
import { Truck, Drumstick, BedDouble, ArrowRight } from "lucide-react";
import { C, divisionLabel } from "../lib/constants";
import { formatKES } from "../lib/format";
import { resolvePeriod, computeMetrics, seriesByDay } from "../lib/derive";
import { TODAY } from "../lib/seed";
import { useStore } from "../lib/store.jsx";
import { useActions } from "../lib/actions.jsx";
import { Card, SectionTitle, Button, TrendPill, ProgressBar } from "../components/ui.jsx";
import { Sparkline } from "../components/Charts.jsx";
import { PageHeader, Page } from "../components/Page.jsx";

const META = {
  Transport: { icon: Truck, color: C.emerald, view: "transport", unit: "trips" },
  Food: { icon: Drumstick, color: C.amber, view: "food", unit: "orders" },
  Hospitality: { icon: BedDouble, color: C.coral, view: "hospitality", unit: "bookings" },
};

export default function AllServicesView() {
  const { data, prefs } = useStore();
  const { navigate } = useActions();

  const range = useMemo(() => resolvePeriod(prefs.period, prefs.customRange, new Date(TODAY)), [prefs]);
  const m = useMemo(() => computeMetrics(data, range), [data, range]);

  const counts = {
    Transport: data.trips.length,
    Food: data.orders.length,
    Hospitality: data.bookings.length,
  };

  const rows = m.byDivision.filter((d) => d.division !== "General");

  return (
    <Page>
      <PageHeader title="All services" subtitle={`Every division compared · ${range.label.toLowerCase()}`} />

      <div className="grid md:grid-cols-3 gap-4">
        {rows.map((d) => {
          const meta = META[d.division];
          const Icon = meta.icon;
          const spark = seriesByDay(
            m.current.filter((l) => l.division === d.division && l.kind === "income"),
            range.from,
            range.to
          ).map((b) => ({ value: b.income }));
          return (
            <Card key={d.division} hover>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: meta.color + "1f" }}>
                    <Icon size={19} style={{ color: meta.color }} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: C.ink }}>{divisionLabel(d.division)}</p>
                    <p className="text-xs" style={{ color: C.muted }}>{counts[d.division]} {meta.unit}</p>
                  </div>
                </div>
                <TrendPill value={d.incomeDelta} />
              </div>

              <div className="mt-3 -mx-1">
                <Sparkline data={spark} color={meta.color} height={48} />
              </div>

              <div className="mt-3 space-y-2 text-sm">
                <Row label="Revenue" value={formatKES(d.income)} />
                <Row label="Expenses" value={formatKES(d.expense)} tone={C.coral} />
                <div className="flex justify-between border-t pt-2" style={{ borderColor: C.line }}>
                  <span style={{ color: C.muted }}>Net profit</span>
                  <span className="font-bold" style={{ color: d.profit >= 0 ? C.emerald : C.coral }}>{formatKES(d.profit)}</span>
                </div>
              </div>

              <div className="mt-3">
                <div className="flex justify-between text-xs mb-1" style={{ color: C.faint }}>
                  <span>Share of group revenue</span>
                  <span>{m.income ? Math.round((d.income / m.income) * 100) : 0}%</span>
                </div>
                <ProgressBar value={m.income ? (d.income / m.income) * 100 : 0} tone={meta.color} height={6} />
              </div>

              <div className="mt-4">
                <Button variant="outline" size="sm" onClick={() => navigate(meta.view)}>
                  Open {divisionLabel(d.division)} <ArrowRight size={13} />
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      <Card>
        <SectionTitle title="Group totals" subtitle={range.label} />
        <div className="grid sm:grid-cols-4 gap-4">
          <Big label="Revenue" value={formatKES(m.income)} trend={m.incomeDelta} />
          <Big label="Expenses" value={formatKES(m.expense)} trend={m.expenseDelta} invert />
          <Big label="Net profit" value={formatKES(m.profit)} trend={m.profitDelta} />
          <Big label="Margin" value={m.income ? `${Math.round(m.margin)}%` : "-"} />
        </div>
      </Card>
    </Page>
  );
}

function Row({ label, value, tone }) {
  return (
    <div className="flex justify-between">
      <span style={{ color: C.muted }}>{label}</span>
      <span className="font-semibold" style={{ color: tone || C.ink }}>{value}</span>
    </div>
  );
}

function Big({ label, value, trend, invert }) {
  return (
    <div>
      <p className="text-xs" style={{ color: C.muted }}>{label}</p>
      <p className="text-xl font-bold font-display mt-1" style={{ color: C.ink }}>{value}</p>
      {trend !== undefined && <div className="mt-1"><TrendPill value={trend} invert={invert} /></div>}
    </div>
  );
}
