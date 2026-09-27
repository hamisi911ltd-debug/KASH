/* Company-wide "who gave the go-ahead" trail. Only Super Admin, Admin and
   Director see this page (see ROLE_VIEWS in lib/constants.js) - a
   department head sees their own division's decisions on the record
   itself (ExpensesView / FoodView), not this cross-division log. Every row
   here was written by the server the moment someone approved or rejected
   something (worker/src/index.js) - nothing on this page can be edited. */
import React, { useMemo, useState } from "react";
import { ShieldCheck, ShieldX, ClipboardCheck } from "lucide-react";
import { C, DIVISIONS, divisionLabel } from "../lib/constants";
import { formatKES, formatDateLong } from "../lib/format";
import { useStore } from "../lib/store.jsx";
import { Card, StatCard, SectionTitle, Badge } from "../components/ui.jsx";
import DataTable from "../components/DataTable.jsx";
import FilterBar, { selectFilter } from "../components/FilterBar.jsx";
import { PageHeader, Page } from "../components/Page.jsx";

const APPROVAL_TONE = { Approved: "emerald", Rejected: "coral" };
const KIND_LABEL = { expenses: "Expense", orders: "Order" };

export default function ApprovalsView() {
  const { data } = useStore();
  const [q, setQ] = useState("");
  const [division, setDivision] = useState("All");
  const [decision, setDecision] = useState("All");

  const rows = data.approvals || [];
  const ql = q.trim().toLowerCase();
  const filtered = useMemo(
    () => rows
      .filter((r) => division === "All" || r.division === division)
      .filter((r) => decision === "All" || r.status === decision)
      .filter((r) => !ql || `${r.summary} ${r.by} ${r.requestedBy || ""}`.toLowerCase().includes(ql)),
    [rows, division, decision, ql]
  );
  const dirty = ql || division !== "All" || decision !== "All";

  const approvedTotal = rows.filter((r) => r.status === "Approved").reduce((s, r) => s + (r.amount || 0), 0);
  const rejectedCount = rows.filter((r) => r.status === "Rejected").length;

  const columns = [
    { key: "at", header: "When", sortValue: (r) => r.at, render: (r) => formatDateLong(r.at), muted: true },
    { key: "kind", header: "What", sortValue: (r) => r.collection, render: (r) => <Badge tone="slate" size="sm">{KIND_LABEL[r.collection] || r.collection}</Badge> },
    { key: "summary", header: "Details", sortValue: (r) => r.summary, wrap: true, render: (r) => (
      <div className="min-w-0">
        <p className="font-medium truncate">{r.summary}</p>
        {r.requestedBy && <p className="text-[11px]" style={{ color: C.faint }}>Entered by {r.requestedBy}</p>}
      </div>
    ) },
    { key: "division", header: "Division", sortValue: (r) => r.division, render: (r) => divisionLabel(r.division) },
    { key: "amount", header: "Amount", align: "right", sortValue: (r) => r.amount, render: (r) => <span className="font-semibold">{formatKES(r.amount)}</span> },
    { key: "status", header: "Decision", sortValue: (r) => r.status, render: (r) => (
      <Badge tone={APPROVAL_TONE[r.status]} size="sm">
        {r.status === "Approved" ? <ShieldCheck size={11} className="inline mr-1" /> : <ShieldX size={11} className="inline mr-1" />}
        {r.status}
      </Badge>
    ) },
    { key: "by", header: "Decided by", sortValue: (r) => r.by, render: (r) => (
      <div className="min-w-0">
        <p className="font-semibold truncate">{r.by}</p>
        <p className="text-[11px] truncate" style={{ color: C.faint }}>{r.role}</p>
      </div>
    ) },
    { key: "note", header: "Note", sortValue: (r) => r.note || "", wrap: true, muted: true, render: (r) => r.note || "-" },
  ];

  return (
    <Page>
      <PageHeader
        title="Approvals"
        subtitle="Every big expense or order that needed a head of department's sign-off - who decided, their role, and when."
      />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3.5">
        <StatCard icon={ClipboardCheck} label="Total decisions" value={rows.length} tint={C.blue} />
        <StatCard icon={ShieldCheck} label="Approved value" value={formatKES(approvedTotal)} tint={C.emerald} />
        <StatCard icon={ShieldX} label="Rejected" value={rejectedCount} tint={C.coral} />
      </div>

      <Card padded={false}>
        <div className="p-4 sm:p-5 pb-3">
          <SectionTitle title={`${filtered.length} decision${filtered.length === 1 ? "" : "s"}`} />
        </div>
        <div className="px-3 sm:px-5 pb-5">
          <FilterBar
            search={{ value: q, onChange: setQ, placeholder: "Who approved, who requested, what for..." }}
            selects={[
              selectFilter("div", "Division", DIVISIONS, division, setDivision, { labelFor: divisionLabel }),
              selectFilter("dec", "Decision", ["Approved", "Rejected"], decision, setDecision),
            ]}
            dirty={!!dirty}
            onClear={() => { setQ(""); setDivision("All"); setDecision("All"); }}
          />
          <DataTable
            columns={columns}
            rows={filtered}
            exportName="kash-approvals"
            initialSort={{ key: "at", dir: "desc" }}
            emptyIcon={ClipboardCheck}
            emptyText={rows.length ? "No decisions match these filters." : "Nothing has needed approval yet."}
          />
        </div>
      </Card>
    </Page>
  );
}
