/* Expenses ledger. Manual rows are editable; auto-posted rows
   (trip fuel, food cost) are shown read-only so the P&L reconciles. */
import React, { useMemo, useState } from "react";
import { Plus, Wallet, Pencil, Trash2, Lock, Receipt } from "lucide-react";
import { C, DIVISIONS } from "../lib/constants";
import { formatKES, formatDateShort } from "../lib/format";
import { resolvePeriod, computeMetrics, buildLedger, inRange, topBy } from "../lib/derive";
import { TODAY } from "../lib/seed";
import { useStore } from "../lib/store.jsx";
import { useActions } from "../lib/actions.jsx";
import { Card, StatCard, SectionTitle, Badge, Button, ChipRow, Segmented } from "../components/ui.jsx";
import { BarSeries, DonutChart } from "../components/Charts.jsx";
import DataTable from "../components/DataTable.jsx";
import { PageHeader, Page } from "../components/Page.jsx";

const DIV_TONE = { Transport: "emerald", Food: "amber", Hospitality: "coral", General: "violet" };

export default function ExpensesView() {
  const { data, prefs } = useStore();
  const { openForm, editRecord, deleteRecord, caps } = useActions();
  const [division, setDivision] = useState("All");
  const [scope, setScope] = useState("all"); // all | manual | auto

  const range = useMemo(() => resolvePeriod(prefs.period, prefs.customRange, new Date(TODAY)), [prefs]);
  const m = useMemo(() => computeMetrics(data, range), [data, range]);

  const expenseLines = useMemo(
    () => buildLedger(data).filter((l) => l.kind === "expense" && inRange(l.date, range.from, range.to)),
    [data, range]
  );

  const filtered = expenseLines
    .filter((l) => division === "All" || l.division === division)
    .filter((l) => scope === "all" || (scope === "manual" ? l.source === "manual" : l.source !== "manual"));

  const totalsByDivision = DIVISIONS.map((d) => ({
    division: d,
    total: expenseLines.filter((l) => l.division === d).reduce((s, l) => s + l.amount, 0),
  }));

  const byCategory = topBy(filtered, (l) => l.category, (l) => l.amount, 8);
  const donutData = totalsByDivision.filter((d) => d.total > 0).map((d) => ({ name: d.division, value: d.total }));
  const autoTotal = expenseLines.filter((l) => l.source !== "manual").reduce((s, l) => s + l.amount, 0);

  const columns = [
    { key: "date", header: "Date", sortValue: (r) => r.date, render: (r) => formatDateShort(r.date), muted: true },
    { key: "division", header: "Division", sortValue: (r) => r.division, render: (r) => <Badge tone={DIV_TONE[r.division]} size="sm">{r.division}</Badge> },
    { key: "category", header: "Category", sortValue: (r) => r.category, render: (r) => <span className="font-medium">{r.category}</span> },
    { key: "desc", header: "Details", sortValue: (r) => r.desc, wrap: true, muted: true },
    { key: "amount", header: "Amount", align: "right", sortValue: (r) => r.amount, render: (r) => <span className="font-semibold">{formatKES(r.amount)}</span> },
    { key: "source", header: "Source", sortValue: (r) => r.source, render: (r) =>
      r.source === "manual"
        ? <Badge tone="slate" size="sm">{r.method || "Manual"}</Badge>
        : <span className="inline-flex items-center gap-1 text-xs" style={{ color: C.faint }}><Lock size={11} /> Auto</span>
    },
  ];

  const actions = caps.write ? [
    { label: "Edit", icon: Pencil, onClick: (r) => editRecord("expenses", r.refId), hidden: (r) => r.source !== "manual" },
    { label: "Delete", icon: Trash2, tone: "danger", onClick: (r) => deleteRecord("expenses", r.refId), hidden: (r) => r.source !== "manual" },
  ] : [];

  return (
    <Page>
      <PageHeader
        title="Expenses"
        subtitle="Every cost, logged and categorised."
        actions={caps.write && <Button size="sm" onClick={() => openForm("expense")}><Plus size={14} /> New expense</Button>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {totalsByDivision.map((d) => (
          <StatCard
            key={d.division}
            icon={Wallet}
            label={d.division}
            value={formatKES(d.total)}
            tint={{ Transport: C.emerald, Food: C.amber, Hospitality: C.coral, General: C.violet }[d.division]}
          />
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <SectionTitle title="Spend by category" subtitle={range.label} />
          <BarSeries data={byCategory} horizontal height={260} color={C.coral} />
        </Card>
        <Card>
          <SectionTitle title="Split by division" />
          <DonutChart data={donutData} centerLabel="Total" centerValue={formatKES(m.expense).replace("KSh ", "")} />
          <p className="text-xs mt-3" style={{ color: C.faint }}>
            {formatKES(autoTotal)} of this is auto-posted from trips and orders.
          </p>
        </Card>
      </div>

      <Card padded={false}>
        <div className="p-5 pb-3 flex items-center justify-between flex-wrap gap-3">
          <SectionTitle title={`${filtered.length} expense line${filtered.length === 1 ? "" : "s"}`} />
          <Segmented
            options={[
              { value: "all", label: "All" },
              { value: "manual", label: "Manual" },
              { value: "auto", label: "Auto-posted" },
            ]}
            value={scope}
            onChange={setScope}
          />
        </div>
        <div className="px-5 pb-4">
          <ChipRow options={["All", ...DIVISIONS]} value={division} onChange={setDivision} />
        </div>
        <div className="px-5 pb-5">
          <DataTable
            columns={columns}
            rows={filtered}
            actions={actions}
            exportName={`expenses-${division}-${range.label}`}
            initialSort={{ key: "date", dir: "desc" }}
            emptyIcon={Receipt}
            emptyText="No expenses match this filter."
          />
        </div>
      </Card>
    </Page>
  );
}
