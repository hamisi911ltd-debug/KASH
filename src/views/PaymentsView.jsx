/* ============================================================
   Payments - where any worker records money paid out or money
   received. M-Pesa payments fire a prompt; once approved the
   amount lands in the books like everything else.
   ============================================================ */
import React, { useMemo, useState } from "react";
import {
  Plus, ArrowDownLeft, ArrowUpRight, Smartphone, Banknote, Landmark, CreditCard,
  Trash2, Clock, XCircle,
} from "lucide-react";
import { C, DIVISIONS, PAYMENT_METHODS, PAYMENT_RECORD_STATUSES, statusTone } from "../lib/constants";
import { formatKES, formatDateShort, relativeTime } from "../lib/format";
import { resolvePeriod, inRange } from "../lib/derive";
import { TODAY } from "../lib/seed";
import { useStore } from "../lib/store.jsx";
import { useActions } from "../lib/actions.jsx";
import { Card, StatCard, SectionTitle, Badge, Button, Segmented } from "../components/ui.jsx";
import DataTable from "../components/DataTable.jsx";
import FilterBar, { selectFilter } from "../components/FilterBar.jsx";
import { PageHeader, Page } from "../components/Page.jsx";

const METHOD_ICON = { "M-Pesa": Smartphone, Cash: Banknote, "Bank Transfer": Landmark, Card: CreditCard, Cheque: Landmark };
const DIV_TONE = { Transport: "emerald", Food: "amber", Hospitality: "coral", General: "violet" };

export default function PaymentsView() {
  const { data, prefs, session } = useStore();
  const { openForm, deleteRecord, caps } = useActions();
  const mine = !caps.write; // a plain worker only sees and manages their own

  const [scope, setScope] = useState(mine ? "mine" : "all");
  const [q, setQ] = useState("");
  const [dir, setDir] = useState("All");
  const [method, setMethod] = useState("All");
  const [division, setDivision] = useState("All");
  const [status, setStatus] = useState("All");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const all = data.payments || [];
  const range = useMemo(() => resolvePeriod(prefs.period, prefs.customRange, new Date(TODAY)), [prefs]);

  const scoped = scope === "mine" ? all.filter((p) => p.createdBy === session?.name) : all;

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return scoped
      .filter((p) => (dir === "All" ? true : p.direction === (dir === "Money in" ? "in" : "out")))
      .filter((p) => method === "All" || p.method === method)
      .filter((p) => division === "All" || p.division === division)
      .filter((p) => status === "All" || p.status === status)
      .filter((p) => (!from || p.date >= from) && (!to || p.date <= to))
      .filter((p) => !query || `${p.party} ${p.reference || ""} ${p.notes || ""} ${p.createdBy || ""}`.toLowerCase().includes(query));
  }, [scoped, q, dir, method, division, status, from, to]);

  const dirty = q || dir !== "All" || method !== "All" || division !== "All" || status !== "All" || from || to;
  const clear = () => { setQ(""); setDir("All"); setMethod("All"); setDivision("All"); setStatus("All"); setFrom(""); setTo(""); };

  // headline numbers over the current period (Recorded only)
  const inPeriod = scoped.filter((p) => inRange(p.date, range.from, range.to));
  const received = inPeriod.filter((p) => p.direction === "in" && p.status === "Recorded").reduce((s, p) => s + p.amount, 0);
  const paidOut = inPeriod.filter((p) => p.direction === "out" && p.status === "Recorded").reduce((s, p) => s + p.amount, 0);
  const pending = scoped.filter((p) => p.status === "Pending");

  const columns = [
    { key: "date", header: "Date", sortValue: (r) => r.date, render: (r) => formatDateShort(r.date), muted: true },
    {
      key: "direction", header: "Type", sortValue: (r) => r.direction,
      render: (r) =>
        r.direction === "in" ? (
          <span className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: C.emerald }}><ArrowDownLeft size={13} /> In</span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: C.coral }}><ArrowUpRight size={13} /> Out</span>
        ),
    },
    { key: "party", header: "Party", render: (r) => <span className="font-semibold">{r.party}</span> },
    { key: "division", header: "Service", sortValue: (r) => r.division, render: (r) => <Badge tone={DIV_TONE[r.division]} size="sm">{r.division}</Badge> },
    {
      key: "amount", header: "Amount", align: "right", sortValue: (r) => (r.direction === "in" ? r.amount : -r.amount),
      render: (r) => <span className="font-bold" style={{ color: r.direction === "in" ? C.emerald : C.coral }}>{r.direction === "in" ? "+" : "−"}{formatKES(r.amount)}</span>,
    },
    {
      key: "method", header: "Method", sortValue: (r) => r.method,
      render: (r) => {
        const Icon = METHOD_ICON[r.method] || Banknote;
        return <span className="inline-flex items-center gap-1.5 text-xs" style={{ color: C.muted }}><Icon size={13} /> {r.method}</span>;
      },
    },
    { key: "status", header: "Status", sortValue: (r) => r.status, render: (r) => <Badge tone={statusTone(r.status)} size="sm">{r.status}</Badge> },
    { key: "createdBy", header: "By", sortValue: (r) => r.createdBy, muted: true, render: (r) => r.createdBy || "-" },
    { key: "reference", header: "Ref", sortValue: (r) => r.reference, muted: true, render: (r) => r.reference || "-" },
  ];

  const actions = caps.deleteAny
    ? [{ label: "Delete", icon: Trash2, tone: "danger", onClick: (r) => deleteRecord("payments", r.id) }]
    : [];

  return (
    <Page>
      <PageHeader
        title="Payments"
        subtitle={mine ? "Record money you pay out or receive." : "Every payment your team records."}
        actions={<Button size="sm" onClick={() => openForm("payment")}><Plus size={14} /> Record payment</Button>}
      />

      <div className="grid grid-cols-1 min-[430px]:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard icon={ArrowDownLeft} label={`Received · ${range.label}`} value={formatKES(received)} tint={C.emerald} />
        <StatCard icon={ArrowUpRight} label={`Paid out · ${range.label}`} value={formatKES(paidOut)} tint={C.coral} />
        <StatCard icon={Clock} label="Awaiting approval" value={pending.length} sub={pending.length ? formatKES(pending.reduce((s, p) => s + p.amount, 0)) : "all clear"} tint={C.amber} />
        <StatCard icon={Banknote} label="Net movement" value={formatKES(received - paidOut)} tint={C.blue} />
      </div>

      {pending.length > 0 && (
        <Card>
          <SectionTitle title="Waiting for approval" action={<Badge tone="amber" size="sm">{pending.length}</Badge>} />
          <div className="space-y-2">
            {pending.slice(0, 5).map((p) => (
              <div key={p.id} className="flex items-center gap-3 rounded-xl p-3" style={{ background: C.surface2 }}>
                <Smartphone size={15} style={{ color: C.amber }} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm truncate" style={{ color: C.ink }}>
                    {p.direction === "in" ? "From" : "To"} {p.party} · {formatKES(p.amount)}
                  </p>
                  <p className="text-xs" style={{ color: C.faint }}>{p.method} · {p.phone || "—"} · {relativeTime(new Date(p.date).toISOString())}</p>
                </div>
                <Badge tone="amber" size="sm">Pending</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card padded={false}>
        <div className="p-4 sm:p-5 pb-3 flex items-center justify-between flex-wrap gap-3">
          <SectionTitle title={`${filtered.length} payment${filtered.length === 1 ? "" : "s"}`} />
          {!mine && (
            <Segmented
              options={[{ value: "all", label: "Everyone" }, { value: "mine", label: "Just mine" }]}
              value={scope}
              onChange={setScope}
            />
          )}
        </div>
        <div className="px-3 sm:px-5 pb-5">
          <FilterBar
            search={{ value: q, onChange: setQ, placeholder: "Party, reference, person..." }}
            selects={[
              { key: "dir", label: "Type", value: dir, onChange: setDir, all: "All", options: [{ value: "All", label: "In & out" }, { value: "Money in", label: "Money in" }, { value: "Money out", label: "Money out" }] },
              selectFilter("method", "Method", PAYMENT_METHODS, method, setMethod),
              selectFilter("division", "Service", DIVISIONS, division, setDivision),
              selectFilter("status", "Status", PAYMENT_RECORD_STATUSES, status, setStatus),
            ]}
            range={{ from, to, onFrom: setFrom, onTo: setTo }}
            dirty={!!dirty}
            onClear={clear}
          />
          <DataTable
            columns={columns}
            rows={filtered}
            actions={actions}
            exportName="kash-payments"
            initialSort={{ key: "date", dir: "desc" }}
            pageSize={12}
            emptyIcon={XCircle}
            emptyText="No payments match these filters."
          />
        </div>
      </Card>
    </Page>
  );
}
