/* Expenses ledger. Manual rows are editable; auto-posted rows
   (trip fuel, food cost) are shown read-only so the P&L reconciles. */
import React, { useMemo, useState } from "react";
import { Plus, Wallet, Pencil, Trash2, Lock, Receipt } from "lucide-react";
import { C, DIVISIONS, EXPENSE_CATEGORIES, PAYMENT_METHODS, divisionLabel, divisionOptions } from "../lib/constants";
import { formatKES, formatDateShort } from "../lib/format";
import { resolvePeriod, buildLedger, inRange } from "../lib/derive";
import { TODAY } from "../lib/seed";
import { useStore } from "../lib/store.jsx";
import { useActions } from "../lib/actions.jsx";
import { Card, StatCard, SectionTitle, Badge, Button, ChipRow, Segmented } from "../components/ui.jsx";
import DataTable from "../components/DataTable.jsx";
import FilterBar, { selectFilter } from "../components/FilterBar.jsx";
import { PageHeader, Page } from "../components/Page.jsx";

const DIV_TONE = { Transport: "emerald", Food: "amber", Hospitality: "coral", General: "violet" };

export default function ExpensesView() {
  const { data, prefs, session } = useStore();
  const { openForm, editRecord, deleteRecord, caps } = useActions();
  // A division Manager only ever has their own division's expenses to
  // begin with (the server already scopes it) - no point offering a
  // picker for divisions that will only ever show empty.
  const lockedDivision = session?.division && session.division !== "All" ? session.division : null;
  const [division, setDivision] = useState(lockedDivision || "All");
  const [scope, setScope] = useState("all"); // all | manual | auto
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("All");
  const [method, setMethod] = useState("All");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const range = useMemo(() => resolvePeriod(prefs.period, prefs.customRange, new Date(TODAY)), [prefs]);

  const expenseLines = useMemo(
    () => buildLedger(data).filter((l) => l.kind === "expense" && inRange(l.date, range.from, range.to)),
    [data, range]
  );

  const ql = q.trim().toLowerCase();
  const filtered = expenseLines
    .filter((l) => division === "All" || l.division === division)
    .filter((l) => scope === "all" || (scope === "manual" ? l.source === "manual" : l.source !== "manual"))
    .filter((l) => category === "All" || l.category === category)
    .filter((l) => method === "All" || l.method === method)
    .filter((l) => (!from || l.date >= from) && (!to || l.date <= to))
    .filter((l) => !ql || `${l.category} ${l.desc} ${l.vendor || ""}`.toLowerCase().includes(ql));
  const dirty = ql || division !== "All" || category !== "All" || method !== "All" || from || to;

  const totalsByDivision = (lockedDivision ? [lockedDivision] : DIVISIONS).map((d) => ({
    division: d,
    total: expenseLines.filter((l) => l.division === d).reduce((s, l) => s + l.amount, 0),
  }));

  const autoTotal = expenseLines.filter((l) => l.source !== "manual").reduce((s, l) => s + l.amount, 0);

  const columns = [
    { key: "date", header: "Date", sortValue: (r) => r.date, render: (r) => formatDateShort(r.date), muted: true },
    { key: "division", header: "Division", sortValue: (r) => r.division, render: (r) => <Badge tone={DIV_TONE[r.division]} size="sm">{divisionLabel(r.division)}</Badge> },
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

      <div className={`grid ${lockedDivision ? "grid-cols-1 max-w-xs" : "grid-cols-2 lg:grid-cols-4"} gap-2.5 sm:gap-3.5`}>
        {totalsByDivision.map((d) => (
          <StatCard
            key={d.division}
            icon={Wallet}
            label={divisionLabel(d.division)}
            value={formatKES(d.total)}
            tint={{ Transport: C.emerald, Food: C.amber, Hospitality: C.coral, General: C.violet }[d.division]}
          />
        ))}
      </div>
      <p className="text-xs -mt-1" style={{ color: C.faint }}>
        {formatKES(autoTotal)} of this is auto-posted from trips and orders.
      </p>

      <Card padded={false}>
        <div className="p-4 sm:p-5 pb-3 flex items-center justify-between flex-wrap gap-3">
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
        {!lockedDivision && (
          <div className="px-3 sm:px-5 pb-4">
            <ChipRow options={divisionOptions(["All", ...DIVISIONS])} value={division} onChange={setDivision} />
          </div>
        )}
        <div className="px-3 sm:px-5 pb-5">
          <FilterBar
            search={{ value: q, onChange: setQ, placeholder: "Category, vendor, note..." }}
            selects={[
              selectFilter("cat", "Category", EXPENSE_CATEGORIES, category, setCategory),
              selectFilter("mth", "Method", [...PAYMENT_METHODS, "Auto-posted"], method, setMethod),
            ]}
            range={{ from, to, onFrom: setFrom, onTo: setTo }}
            dirty={!!dirty}
            onClear={() => { setQ(""); setDivision("All"); setCategory("All"); setMethod("All"); setFrom(""); setTo(""); }}
          />
          <DataTable
            columns={columns}
            rows={filtered}
            actions={actions}
            exportName={`kash-expenses-${division}-${range.label}`}
            initialSort={{ key: "date", dir: "desc" }}
            emptyIcon={Receipt}
            emptyText="No expenses match these filters."
          />
        </div>
      </Card>
    </Page>
  );
}
