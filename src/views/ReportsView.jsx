/* Reports: filter the unified ledger by range + division, see the
   P&L, and export. This is the same data as every other view. */
import React, { useMemo, useState } from "react";
import { Download, Printer, TrendingUp, TrendingDown, Wallet, Percent } from "lucide-react";
import { C, DIVISIONS } from "../lib/constants";
import { formatKES, formatDateShort, downloadCSV, formatDateLong } from "../lib/format";
import {
  resolvePeriod, buildLedger, inRange, seriesByMonth, computeMetrics, outstanding, topBy,
} from "../lib/derive";
import { TODAY } from "../lib/seed";
import { useStore } from "../lib/store.jsx";
import { Card, StatCard, SectionTitle, Badge, Button, Segmented } from "../components/ui.jsx";
import { GroupedBars, BarSeries } from "../components/Charts.jsx";
import DataTable from "../components/DataTable.jsx";
import FilterBar, { selectFilter } from "../components/FilterBar.jsx";
import { PageHeader, Page } from "../components/Page.jsx";
import { useChartPalette } from "../lib/hooks.js";

const DIV_TONE = { Transport: "emerald", Food: "amber", Hospitality: "coral", General: "violet" };

export default function ReportsView() {
  const { data, prefs, setPrefs } = useStore();
  const pal = useChartPalette();
  const [division, setDivision] = useState("All");
  const [kind, setKind] = useState("all"); // all | income | expense
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("All");
  const [source, setSource] = useState("All");

  const period = prefs.period;
  const range = useMemo(() => resolvePeriod(period, prefs.customRange, new Date(TODAY)), [period, prefs.customRange]);

  const ledger = useMemo(() => buildLedger(data), [data]);
  const ql = q.trim().toLowerCase();
  const rows = useMemo(
    () =>
      ledger
        .filter((l) => inRange(l.date, range.from, range.to))
        .filter((l) => division === "All" || l.division === division)
        .filter((l) => kind === "all" || l.kind === kind)
        .filter((l) => category === "All" || l.category === category)
        .filter((l) => source === "All" || (l.source || "manual") === source)
        .filter((l) => !ql || `${l.desc} ${l.category} ${l.division}`.toLowerCase().includes(ql)),
    [ledger, range, division, kind, category, source, ql]
  );
  const allCategories = useMemo(() => [...new Set(ledger.map((l) => l.category))].sort(), [ledger]);
  const tableDirty = ql || category !== "All" || source !== "All";

  const income = rows.filter((r) => r.kind === "income").reduce((s, r) => s + r.amount, 0);
  const expense = rows.filter((r) => r.kind === "expense").reduce((s, r) => s + r.amount, 0);
  const profit = income - expense;
  const margin = income ? (profit / income) * 100 : 0;

  const monthly = useMemo(
    () => seriesByMonth(division === "All" ? ledger : ledger.filter((l) => l.division === division), 8, new Date(TODAY)),
    [ledger, division]
  );

  const pnlByDivision = DIVISIONS.map((d) => {
    const inc = rows.filter((r) => r.division === d && r.kind === "income").reduce((s, r) => s + r.amount, 0);
    const exp = rows.filter((r) => r.division === d && r.kind === "expense").reduce((s, r) => s + r.amount, 0);
    return { division: d, income: inc, expense: exp, profit: inc - exp };
  }).filter((d) => d.income || d.expense);

  const ar = useMemo(() => outstanding(data), [data]);

  const exportLedger = () => {
    downloadCSV(
      `kash-report-${division.toLowerCase()}-${range.from}_${range.to}`,
      [
        { label: "Date", key: "date" },
        { label: "Division", key: "division" },
        { label: "Type", key: "kind" },
        { label: "Category", key: "category" },
        { label: "Description", key: "desc" },
        { label: "Income (KSh)", key: "income", map: (r) => (r.kind === "income" ? r.amount : "") },
        { label: "Expense (KSh)", key: "expense", map: (r) => (r.kind === "expense" ? r.amount : "") },
      ],
      rows
    );
  };

  const columns = [
    { key: "date", header: "Date", sortValue: (r) => r.date, render: (r) => formatDateShort(r.date), muted: true },
    { key: "division", header: "Division", sortValue: (r) => r.division, render: (r) => <Badge tone={DIV_TONE[r.division]} size="sm">{r.division}</Badge> },
    { key: "desc", header: "Description", sortValue: (r) => r.desc, wrap: true },
    { key: "category", header: "Category", sortValue: (r) => r.category, muted: true },
    { key: "income", header: "Income", align: "right", sortValue: (r) => (r.kind === "income" ? r.amount : 0), render: (r) => r.kind === "income" ? <span className="font-semibold" style={{ color: C.emerald }}>{formatKES(r.amount)}</span> : <span style={{ color: C.faint }}>-</span> },
    { key: "expense", header: "Expense", align: "right", sortValue: (r) => (r.kind === "expense" ? r.amount : 0), render: (r) => r.kind === "expense" ? <span className="font-semibold" style={{ color: C.coral }}>{formatKES(r.amount)}</span> : <span style={{ color: C.faint }}>-</span> },
  ];

  return (
    <Page>
      <PageHeader
        title="Reports"
        subtitle="Filter, review and export financial performance."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => window.print()}><Printer size={14} /> Print</Button>
            <Button size="sm" onClick={exportLedger}><Download size={14} /> Export CSV</Button>
          </>
        }
      />

      <Card>
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wide mb-1" style={{ color: C.faint }}>Period</label>
            <select
              value={period}
              onChange={(e) => setPrefs((p) => ({ ...p, period: e.target.value }))}
              className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: C.line }}
            >
              {["Today", "Last 7 days", "This Month", "Last 90 days", "This Year", "All Time"].map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wide mb-1" style={{ color: C.faint }}>Division</label>
            <select value={division} onChange={(e) => setDivision(e.target.value)} className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: C.line }}>
              {["All", ...DIVISIONS].map((d) => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wide mb-1" style={{ color: C.faint }}>Show</label>
            <Segmented
              options={[{ value: "all", label: "All" }, { value: "income", label: "Income" }, { value: "expense", label: "Expense" }]}
              value={kind}
              onChange={setKind}
            />
          </div>
          <div className="flex-1" />
          <p className="text-xs" style={{ color: C.faint }}>{formatDateLong(range.from)} → {formatDateLong(range.to)}</p>
        </div>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        <StatCard icon={TrendingUp} label="Income" value={formatKES(income)} tint={C.emerald} />
        <StatCard icon={TrendingDown} label="Expenses" value={formatKES(expense)} tint={C.coral} />
        <StatCard icon={Wallet} label="Net profit" value={formatKES(profit)} tint={C.blue} />
        <StatCard icon={Percent} label="Margin" value={income ? `${Math.round(margin)}%` : "-"} tint={C.violet} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <SectionTitle title="Monthly trend" subtitle={division === "All" ? "All divisions · last 8 months" : division} />
          <GroupedBars
            data={monthly}
            series={[
              { key: "income", label: "Income", color: pal.blue },
              { key: "expense", label: "Expenses", color: pal.coral },
            ]}
            height={220}
          />
        </Card>
        <Card>
          <SectionTitle title="Outstanding" subtitle="Invoiced, not yet paid" />
          <p className="text-2xl font-bold font-display" style={{ color: C.amber }}>{formatKES(ar.total)}</p>
          <div className="mt-3 space-y-2 max-h-[210px] overflow-y-auto n1-scroll">
            {ar.rows.slice(0, 8).map((r) => (
              <div key={r.id} className="flex items-center justify-between text-sm">
                <div className="min-w-0">
                  <p className="truncate" style={{ color: C.ink }}>{r.who}</p>
                  <p className="text-xs" style={{ color: C.faint }}>{r.division} · {formatDateShort(r.date)}</p>
                </div>
                <span className="font-semibold shrink-0" style={{ color: C.ink }}>{formatKES(r.due)}</span>
              </div>
            ))}
            {ar.rows.length === 0 && <p className="text-sm py-6 text-center" style={{ color: C.faint }}>Everything is paid up.</p>}
          </div>
        </Card>
      </div>

      {pnlByDivision.length > 0 && (
        <Card>
          <SectionTitle title="Profit & loss by division" subtitle={range.label} />
          <div className="overflow-x-auto n1-scroll">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: C.surface2 }}>
                  {["Division", "Income", "Expenses", "Net", "Margin"].map((h) => (
                    <th key={h} className={`px-4 py-2.5 text-xs font-semibold ${h === "Division" ? "text-left" : "text-right"}`} style={{ color: C.muted }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pnlByDivision.map((d) => (
                  <tr key={d.division} className="border-t" style={{ borderColor: C.line }}>
                    <td className="px-4 py-2.5"><Badge tone={DIV_TONE[d.division]} size="sm">{d.division}</Badge></td>
                    <td className="px-4 py-2.5 text-right" style={{ color: C.emerald }}>{formatKES(d.income)}</td>
                    <td className="px-4 py-2.5 text-right" style={{ color: C.coral }}>{formatKES(d.expense)}</td>
                    <td className="px-4 py-2.5 text-right font-semibold" style={{ color: d.profit >= 0 ? C.ink : C.coral }}>{formatKES(d.profit)}</td>
                    <td className="px-4 py-2.5 text-right" style={{ color: C.muted }}>{d.income ? `${Math.round((d.profit / d.income) * 100)}%` : "-"}</td>
                  </tr>
                ))}
                <tr className="border-t-2" style={{ borderColor: C.lineStrong }}>
                  <td className="px-4 py-2.5 font-bold" style={{ color: C.ink }}>Total</td>
                  <td className="px-4 py-2.5 text-right font-bold" style={{ color: C.emerald }}>{formatKES(income)}</td>
                  <td className="px-4 py-2.5 text-right font-bold" style={{ color: C.coral }}>{formatKES(expense)}</td>
                  <td className="px-4 py-2.5 text-right font-bold" style={{ color: profit >= 0 ? C.ink : C.coral }}>{formatKES(profit)}</td>
                  <td className="px-4 py-2.5 text-right font-bold" style={{ color: C.muted }}>{income ? `${Math.round(margin)}%` : "-"}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Card padded={false}>
        <div className="p-4 sm:p-5 pb-3"><SectionTitle title={`Transactions · ${rows.length}`} /></div>
        <div className="px-3 sm:px-5 pb-5">
          <FilterBar
            search={{ value: q, onChange: setQ, placeholder: "Description, category..." }}
            selects={[
              selectFilter("cat", "Category", allCategories, category, setCategory),
              { key: "src", label: "Source", all: "All", value: source, onChange: setSource, options: [
                { value: "All", label: "Any source" },
                { value: "manual", label: "Keyed in" },
                { value: "trip", label: "From trips" },
                { value: "order", label: "From orders" },
                { value: "booking", label: "From bookings" },
                { value: "payment", label: "From payments" },
              ] },
            ]}
            dirty={!!tableDirty}
            onClear={() => { setQ(""); setCategory("All"); setSource("All"); }}
          />
          <DataTable
            columns={columns}
            rows={rows}
            pageSize={15}
            initialSort={{ key: "date", dir: "desc" }}
            emptyText="No records match these filters."
          />
        </div>
      </Card>
    </Page>
  );
}
