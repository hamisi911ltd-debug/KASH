/* Accounts: every business keeps its own books. Pick Transport, Agro,
   Hospitality or General (head office) to see only that business's income,
   expenses, cash book, money owed and transactions - or "Company" for all of
   them side by side. Built from the same ledger as Reports, so no figure here
   can disagree with another page. */
import React, { useMemo, useState } from "react";
import { Download, Printer, TrendingUp, TrendingDown, Wallet, HandCoins } from "lucide-react";
import { C, DIVISIONS, divisionLabel } from "../lib/constants";
import { formatKES, formatDateShort, formatDateLong, downloadCSV } from "../lib/format";
import { resolvePeriod, buildLedger, inRange, outstanding } from "../lib/derive";
import { TODAY } from "../lib/seed";
import { useStore } from "../lib/store.jsx";
import { Card, StatCard, SectionTitle, Badge, Button, Segmented } from "../components/ui.jsx";
import DataTable from "../components/DataTable.jsx";
import FilterBar, { selectFilter } from "../components/FilterBar.jsx";
import { PageHeader, Page } from "../components/Page.jsx";

const DIV_TONE = { Transport: "emerald", Food: "amber", Hospitality: "coral", General: "violet" };
const COMPANY = "All";

const sum = (rows, kind) => rows.filter((r) => r.kind === kind).reduce((s, r) => s + r.amount, 0);

/** Income, expense and net for each of the last `n` calendar months. */
function monthlyBooks(lines, n = 6, today = new Date(TODAY)) {
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const rows = lines.filter((l) => String(l.date).slice(0, 7) === key);
    const income = sum(rows, "income");
    const expense = sum(rows, "expense");
    out.push({ key, label: d.toLocaleString("en-GB", { month: "short", year: "numeric" }), income, expense, net: income - expense });
  }
  return out;
}

const Num = ({ children, tone, bold }) => (
  <span className={bold ? "font-bold" : "font-semibold"} style={{ color: tone || C.ink }}>{children}</span>
);

function StatementTable({ title, subtitle, groups, net, netLabel = "Net profit" }) {
  return (
    <Card>
      <SectionTitle title={title} subtitle={subtitle} />
      <table className="w-full text-sm">
        <tbody>
          {groups.map((g) => (
            <React.Fragment key={g.label}>
              <tr style={{ background: C.surface2 }}>
                <td className="px-3 py-2 text-xs font-bold uppercase tracking-wide" style={{ color: C.muted }}>{g.label}</td>
                <td />
              </tr>
              {g.rows.length === 0 && (
                <tr><td className="px-3 py-2.5 text-xs" style={{ color: C.faint }} colSpan={2}>Nothing recorded in this period.</td></tr>
              )}
              {g.rows.map((r) => (
                <tr key={r.label} className="border-t" style={{ borderColor: C.line }}>
                  <td className="px-3 py-2" style={{ color: C.ink2 }}>{r.label}</td>
                  <td className="px-3 py-2 text-right">{formatKES(r.amount)}</td>
                </tr>
              ))}
              <tr className="border-t" style={{ borderColor: C.lineStrong }}>
                <td className="px-3 py-2 font-bold" style={{ color: C.ink }}>Total {g.label.toLowerCase()}</td>
                <td className="px-3 py-2 text-right"><Num bold tone={g.tone}>{formatKES(g.total)}</Num></td>
              </tr>
            </React.Fragment>
          ))}
          <tr className="border-t-2" style={{ borderColor: C.lineStrong }}>
            <td className="px-3 py-3 font-bold" style={{ color: C.ink }}>{netLabel}</td>
            <td className="px-3 py-3 text-right text-base"><Num bold tone={net >= 0 ? C.emerald : C.coral}>{formatKES(net)}</Num></td>
          </tr>
        </tbody>
      </table>
    </Card>
  );
}

export default function AccountsView() {
  const { data, prefs, setPrefs, session } = useStore();
  // A business Manager's data is server-scoped to their own business: they only get theirs.
  const locked = session?.division && session.division !== "All" ? session.division : null;
  const [business, setBusiness] = useState(locked || COMPANY);
  const [kind, setKind] = useState("All");
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("All");

  const range = useMemo(() => resolvePeriod(prefs.period, prefs.customRange, new Date(TODAY)), [prefs.period, prefs.customRange]);
  const ledger = useMemo(() => buildLedger(data), [data]);
  const mine = useMemo(() => ledger.filter((l) => business === COMPANY || l.division === business), [ledger, business]);
  const rows = useMemo(() => mine.filter((l) => inRange(l.date, range.from, range.to)), [mine, range]);

  const income = sum(rows, "income");
  const expense = sum(rows, "expense");
  const profit = income - expense;

  const byCategory = (k) => {
    const map = new Map();
    rows.filter((r) => r.kind === k).forEach((r) => map.set(r.category, (map.get(r.category) || 0) + r.amount));
    return [...map].map(([label, amount]) => ({ label, amount })).sort((a, b) => b.amount - a.amount);
  };
  const groups = [
    { label: "Income", tone: C.emerald, rows: byCategory("income"), total: income },
    { label: "Expenses", tone: C.coral, rows: byCategory("expense"), total: expense },
  ];

  // Cash book: what actually moved through payments, by how it was paid.
  const cashBook = useMemo(() => {
    const map = new Map();
    rows.filter((r) => r.source === "payment").forEach((r) => {
      const m = r.method || "Other";
      const e = map.get(m) || { method: m, received: 0, paid: 0 };
      if (r.kind === "income") e.received += r.amount; else e.paid += r.amount;
      map.set(m, e);
    });
    return [...map.values()].sort((a, b) => b.received + b.paid - (a.received + a.paid));
  }, [rows]);

  const owed = useMemo(() => {
    const all = outstanding(data);
    const list = all.rows.filter((r) => business === COMPANY || r.division === business);
    return { rows: list, total: list.reduce((s, r) => s + r.due, 0) };
  }, [data, business]);

  const books = DIVISIONS.map((d) => {
    const lines = ledger.filter((l) => l.division === d && inRange(l.date, range.from, range.to));
    const i = sum(lines, "income");
    const e = sum(lines, "expense");
    return { division: d, income: i, expense: e, net: i - e, count: lines.length };
  }).filter((b) => b.count > 0);

  const months = useMemo(() => monthlyBooks(mine), [mine]);
  const categories = useMemo(() => [...new Set(mine.map((l) => l.category))].sort(), [mine]);
  const ql = q.trim().toLowerCase();
  const table = rows
    .filter((r) => kind === "All" || r.kind === kind)
    .filter((r) => category === "All" || r.category === category)
    .filter((r) => !ql || `${r.desc} ${r.category}`.toLowerCase().includes(ql));

  const name = business === COMPANY ? "Company" : divisionLabel(business);
  const exportBooks = () =>
    downloadCSV(
      `kash-accounts-${name.toLowerCase()}-${range.from}_${range.to}`,
      [
        { label: "Business", key: "division", map: (r) => divisionLabel(r.division) },
        { label: "Date", key: "date" },
        { label: "Type", key: "kind" },
        { label: "Category", key: "category" },
        { label: "Description", key: "desc" },
        { label: "Method", key: "method", map: (r) => r.method || "" },
        { label: "Income (KSh)", key: "income", map: (r) => (r.kind === "income" ? r.amount : "") },
        { label: "Expense (KSh)", key: "expense", map: (r) => (r.kind === "expense" ? r.amount : "") },
      ],
      table
    );

  const columns = [
    { key: "date", header: "Date", sortValue: (r) => r.date, render: (r) => formatDateShort(r.date), muted: true },
    ...(business === COMPANY ? [{ key: "division", header: "Business", sortValue: (r) => r.division, render: (r) => <Badge tone={DIV_TONE[r.division]} size="sm">{divisionLabel(r.division)}</Badge> }] : []),
    { key: "desc", header: "Description", sortValue: (r) => r.desc, wrap: true },
    { key: "category", header: "Category", sortValue: (r) => r.category, muted: true },
    { key: "income", header: "Money in", align: "right", sortValue: (r) => (r.kind === "income" ? r.amount : 0), render: (r) => (r.kind === "income" ? <Num tone={C.emerald}>{formatKES(r.amount)}</Num> : "") },
    { key: "expense", header: "Money out", align: "right", sortValue: (r) => (r.kind === "expense" ? r.amount : 0), render: (r) => (r.kind === "expense" ? <Num tone={C.coral}>{formatKES(r.amount)}</Num> : "") },
  ];

  const businessOptions = [{ value: COMPANY, label: "Company" }, ...DIVISIONS.map((d) => ({ value: d, label: divisionLabel(d) }))];

  return (
    <Page>
      <PageHeader
        title="Accounts"
        subtitle={locked ? `The books for ${divisionLabel(locked)}.` : "Every business keeps its own books. Pick one, or see the whole company."}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => window.print()}><Printer size={14} /> Print</Button>
            <Button size="sm" onClick={exportBooks}><Download size={14} /> Export CSV</Button>
          </>
        }
      />

      <Card>
        <div className="flex flex-wrap items-end gap-3">
          {!locked && (
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wide mb-1" style={{ color: C.faint }}>Business</label>
              <Segmented options={businessOptions} value={business} onChange={(v) => { setBusiness(v); setCategory("All"); }} />
            </div>
          )}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wide mb-1" style={{ color: C.faint }}>Period</label>
            <select
              value={prefs.period}
              onChange={(e) => setPrefs((p) => ({ ...p, period: e.target.value }))}
              className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: C.line }}
            >
              {["Today", "Last 7 days", "This Month", "Last 90 days", "This Year", "All Time"].map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div className="flex-1" />
          <p className="text-xs" style={{ color: C.faint }}>{name} · {formatDateLong(range.from)} → {formatDateLong(range.to)}</p>
        </div>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        <StatCard icon={TrendingUp} label="Income" value={formatKES(income)} tint={C.emerald} />
        <StatCard icon={TrendingDown} label="Expenses" value={formatKES(expense)} tint={C.coral} />
        <StatCard icon={Wallet} label="Net profit" value={formatKES(profit)} tint={profit >= 0 ? C.blue : C.coral} />
        <StatCard icon={HandCoins} label="Owed to us" value={formatKES(owed.total)} tint={C.amber} />
      </div>

      {business === COMPANY && books.length > 0 && (
        <Card>
          <SectionTitle title="The books of each business" subtitle="Tap a business to open its own accounts" />
          <div className="overflow-x-auto n1-scroll">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: C.surface2 }}>
                  {["Business", "Income", "Expenses", "Net"].map((h) => (
                    <th key={h} className={`px-3 py-2 text-xs font-semibold ${h === "Business" ? "text-left" : "text-right"}`} style={{ color: C.muted }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {books.map((b) => (
                  <tr key={b.division} className="border-t" style={{ borderColor: C.line }}>
                    <td className="px-3 py-2.5">
                      <button type="button" onClick={() => setBusiness(b.division)} aria-label={`Open the ${divisionLabel(b.division)} books`}>
                        <Badge tone={DIV_TONE[b.division]} size="sm">{divisionLabel(b.division)}</Badge>
                      </button>
                    </td>
                    <td className="px-3 py-2.5 text-right" style={{ color: C.emerald }}>{formatKES(b.income)}</td>
                    <td className="px-3 py-2.5 text-right" style={{ color: C.coral }}>{formatKES(b.expense)}</td>
                    <td className="px-3 py-2.5 text-right"><Num tone={b.net >= 0 ? C.ink : C.coral}>{formatKES(b.net)}</Num></td>
                  </tr>
                ))}
                <tr className="border-t-2" style={{ borderColor: C.lineStrong }}>
                  <td className="px-3 py-2.5 font-bold" style={{ color: C.ink }}>Company total</td>
                  <td className="px-3 py-2.5 text-right"><Num bold tone={C.emerald}>{formatKES(books.reduce((s, b) => s + b.income, 0))}</Num></td>
                  <td className="px-3 py-2.5 text-right"><Num bold tone={C.coral}>{formatKES(books.reduce((s, b) => s + b.expense, 0))}</Num></td>
                  <td className="px-3 py-2.5 text-right"><Num bold tone={C.ink}>{formatKES(books.reduce((s, b) => s + b.net, 0))}</Num></td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        <StatementTable title={`${name} income & expenses`} subtitle={range.label} groups={groups} net={profit} />

        <div className="space-y-4">
          <Card>
            <SectionTitle title="Cash book" subtitle="Payments recorded, by how they were paid" />
            {cashBook.length === 0 ? (
              <p className="text-sm py-4 text-center" style={{ color: C.faint }}>No payments recorded in this period.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: C.surface2 }}>
                    {["Method", "Received", "Paid out", "Balance"].map((h) => (
                      <th key={h} className={`px-3 py-2 text-xs font-semibold ${h === "Method" ? "text-left" : "text-right"}`} style={{ color: C.muted }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cashBook.map((m) => (
                    <tr key={m.method} className="border-t" style={{ borderColor: C.line }}>
                      <td className="px-3 py-2">{m.method}</td>
                      <td className="px-3 py-2 text-right" style={{ color: C.emerald }}>{formatKES(m.received)}</td>
                      <td className="px-3 py-2 text-right" style={{ color: C.coral }}>{formatKES(m.paid)}</td>
                      <td className="px-3 py-2 text-right"><Num tone={m.received - m.paid >= 0 ? C.ink : C.coral}>{formatKES(m.received - m.paid)}</Num></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>

          <Card>
            <SectionTitle title="Owed to this business" subtitle="Sold or booked, not yet paid" />
            <div className="max-h-[220px] overflow-y-auto n1-scroll">
              {owed.rows.length === 0 && <p className="text-sm py-4 text-center" style={{ color: C.faint }}>Everything is paid up.</p>}
              {owed.rows.slice(0, 12).map((r) => (
                <div key={r.id} className="flex items-center justify-between text-sm py-1.5">
                  <div className="min-w-0">
                    <p className="truncate" style={{ color: C.ink }}>{r.who}</p>
                    <p className="text-xs" style={{ color: C.faint }}>{divisionLabel(r.division)} · {formatDateShort(r.date)}</p>
                  </div>
                  <span className="font-semibold shrink-0" style={{ color: C.ink }}>{formatKES(r.due)}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <Card>
        <SectionTitle title={`${name}: last 6 months`} subtitle="Month by month, whatever period is picked above" />
        <div className="overflow-x-auto n1-scroll">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: C.surface2 }}>
                {["Month", "Income", "Expenses", "Net"].map((h) => (
                  <th key={h} className={`px-3 py-2 text-xs font-semibold ${h === "Month" ? "text-left" : "text-right"}`} style={{ color: C.muted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {months.map((m) => (
                <tr key={m.key} className="border-t" style={{ borderColor: C.line }}>
                  <td className="px-3 py-2">{m.label}</td>
                  <td className="px-3 py-2 text-right" style={{ color: C.emerald }}>{formatKES(m.income)}</td>
                  <td className="px-3 py-2 text-right" style={{ color: C.coral }}>{formatKES(m.expense)}</td>
                  <td className="px-3 py-2 text-right"><Num tone={m.net >= 0 ? C.ink : C.coral}>{formatKES(m.net)}</Num></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card padded={false}>
        <div className="p-4 sm:p-5 pb-3"><SectionTitle title={`${name} transactions · ${table.length}`} /></div>
        <div className="px-3 sm:px-5 pb-5">
          <FilterBar
            search={{ value: q, onChange: setQ, placeholder: "Description, category..." }}
            selects={[
              { key: "kind", label: "Type", all: "All", value: kind, onChange: setKind, options: [
                { value: "All", label: "Money in and out" }, { value: "income", label: "Money in" }, { value: "expense", label: "Money out" },
              ] },
              selectFilter("cat", "Category", categories, category, setCategory),
            ]}
            dirty={!!(ql || category !== "All" || kind !== "All")}
            onClear={() => { setQ(""); setCategory("All"); setKind("All"); }}
          />
          <DataTable columns={columns} rows={table} pageSize={15} initialSort={{ key: "date", dir: "desc" }} emptyText="No records match these filters." />
        </div>
      </Card>
    </Page>
  );
}
