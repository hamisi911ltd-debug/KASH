/* Rate card: container trucking from the Nairobi ICD / CFS depots, per
   destination. Staff quote from it here, pick a destination when logging a
   trip (it fills the fare), and the same list is published on the website's
   Transport page. Only roles in RATE_EDITORS can change it. */
import React, { useMemo, useState } from "react";
import { Download, Printer, Plus, Pencil, Trash2, Truck, TrendingDown, TrendingUp, ListOrdered, Globe } from "lucide-react";
import { C, canEditRates } from "../lib/constants";
import { formatKES } from "../lib/format";
import { RATE_NOTES, RATE_ORIGIN, RATE_TARIFF, RATE_VAT_PERCENT, sortRates, vatOn, withVat } from "../lib/rates";
import { api } from "../lib/api";
import { useStore } from "../lib/store.jsx";
import { useActions } from "../lib/actions.jsx";
import { Card, StatCard, SectionTitle, Badge, Button } from "../components/ui.jsx";
import DataTable from "../components/DataTable.jsx";
import FilterBar from "../components/FilterBar.jsx";
import { PageHeader, Page } from "../components/Page.jsx";

export default function RatesView() {
  const { data, session, resync, toast } = useStore();
  const { openForm, editRecord, deleteRecord } = useActions();
  const editor = canEditRates(session?.role);
  const [q, setQ] = useState("");
  const [pick, setPick] = useState("");
  const [loading, setLoading] = useState(false);

  const rates = useMemo(() => sortRates(data.rates || []), [data.rates]);
  const live = rates.filter((r) => r.active !== false);
  const shown = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return rates.filter((r) => !ql || r.destination.toLowerCase().includes(ql));
  }, [rates, q]);
  const amounts = live.map((r) => Number(r.amount) || 0).filter((n) => n > 0);
  const lowest = amounts.length ? Math.min(...amounts) : 0;
  const highest = amounts.length ? Math.max(...amounts) : 0;
  const chosen = rates.find((r) => r.id === pick);

  const loadStandard = async () => {
    setLoading(true);
    try {
      await api.loadStandardRates(session?.token);
      await resync();
      toast("The standard rate card is loaded");
    } catch (e) {
      toast(e.message || "Couldn't load the rate card", { tone: "warn" });
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { key: "order", header: "No.", sortValue: (r) => Number(r.order) || 1000, render: (r, i) => (Number(r.order) < 1000 ? r.order : "-"), muted: true },
    { key: "destination", header: "Destination", sortValue: (r) => r.destination, wrap: true, render: (r) => <span className="font-semibold">{r.destination}</span> },
    { key: "amount", header: "Rate", align: "right", sortValue: (r) => Number(r.amount) || 0, render: (r) => formatKES(r.amount), csv: (r) => r.amount },
    { key: "vat", header: `VAT ${RATE_VAT_PERCENT}%`, align: "right", sortValue: (r) => vatOn(r.amount), render: (r) => <span style={{ color: C.muted }}>{formatKES(vatOn(r.amount))}</span>, csv: (r) => vatOn(r.amount) },
    { key: "total", header: "Total with VAT", align: "right", sortValue: (r) => withVat(r.amount), render: (r) => <span className="font-semibold">{formatKES(withVat(r.amount))}</span>, csv: (r) => withVat(r.amount) },
    { key: "active", header: "On website", sortValue: (r) => (r.active === false ? 0 : 1), render: (r) => <Badge tone={r.active === false ? "slate" : "emerald"} size="sm">{r.active === false ? "Hidden" : "Shown"}</Badge>, csv: (r) => (r.active === false ? "Hidden" : "Shown") },
  ];
  const actions = editor ? [
    { label: "Edit", icon: Pencil, onClick: (r) => editRecord("rates", r.id) },
    { label: "Delete", icon: Trash2, tone: "danger", onClick: (r) => deleteRecord("rates", r.id) },
  ] : [];

  return (
    <Page>
      <PageHeader
        title="Rate card"
        subtitle={`Container trucking from ${RATE_ORIGIN}. Rates are before ${RATE_VAT_PERCENT}% VAT.`}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => window.print()}><Printer size={14} /> Print</Button>
            {editor && <Button size="sm" onClick={() => openForm("rate")}><Plus size={14} /> Add destination</Button>}
          </>
        }
      />

      {rates.length === 0 ? (
        <Card>
          <SectionTitle title="No rates loaded yet" subtitle="Start from the standard KASH rate card, then change anything you need." />
          {editor ? (
            <Button onClick={loadStandard} disabled={loading}><Download size={14} /> {loading ? "Loading..." : "Load the standard rate card"}</Button>
          ) : (
            <p className="text-sm" style={{ color: C.muted }}>The rate card has not been set up yet. Ask your administrator or the IT officer to load it.</p>
          )}
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
            <StatCard icon={ListOrdered} label="Destinations" value={String(live.length)} tint={C.blue} />
            <StatCard icon={TrendingDown} label="Lowest rate" value={formatKES(lowest)} tint={C.emerald} />
            <StatCard icon={TrendingUp} label="Highest rate" value={formatKES(highest)} tint={C.coral} />
            <StatCard icon={Globe} label="Tariff" value={RATE_TARIFF.replace("Rates adjusted tariff ", "")} tint={C.amber} />
          </div>

          <Card>
            <SectionTitle title="Quote a trip" subtitle="Pick a destination to see what to charge." />
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-[220px] flex-1">
                <label className="block text-[11px] font-bold uppercase tracking-wide mb-1" style={{ color: C.faint }}>Destination</label>
                <select value={pick} onChange={(e) => setPick(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm" style={{ borderColor: C.line }}>
                  <option value="">Choose a destination...</option>
                  {live.map((r) => <option key={r.id} value={r.id}>{r.destination}</option>)}
                </select>
              </div>
              {chosen && (
                <>
                  <div><p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: C.faint }}>Rate</p><p className="text-lg font-bold font-display">{formatKES(chosen.amount)}</p></div>
                  <div><p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: C.faint }}>VAT {RATE_VAT_PERCENT}%</p><p className="text-lg font-bold font-display" style={{ color: C.muted }}>{formatKES(vatOn(chosen.amount))}</p></div>
                  <div><p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: C.faint }}>Total</p><p className="text-lg font-bold font-display" style={{ color: C.blue }}>{formatKES(withVat(chosen.amount))}</p></div>
                  {session && ["Super Admin", "Admin", "Director", "Transport Manager"].includes(session.role) && (
                    <Button size="sm" onClick={() => openForm("trip", { rateId: chosen.id, destination: chosen.destination, amount: String(chosen.amount), origin: "Nairobi ICD / CFS depot" })}>
                      <Truck size={14} /> Log this trip
                    </Button>
                  )}
                </>
              )}
            </div>
          </Card>

          <Card padded={false}>
            <div className="p-4 sm:p-5 pb-3"><SectionTitle title={`${rates.length} destinations`} subtitle={RATE_TARIFF} /></div>
            <div className="px-3 sm:px-5 pb-5">
              <FilterBar search={{ value: q, onChange: setQ, placeholder: "Search a destination..." }} selects={[]} dirty={!!q} onClear={() => setQ("")} />
              <DataTable columns={columns} rows={shown} actions={actions} pageSize={50} exportName="kash-rate-card" initialSort={{ key: "order", dir: "asc" }} emptyIcon={Truck} emptyText="No destination matches that search." />
            </div>
          </Card>

          <Card>
            <SectionTitle title="Terms on the rate card" subtitle="Printed on every rate card and shown on the website." />
            <ol className="list-decimal pl-5 space-y-1 text-sm" style={{ color: C.ink2 }}>
              {RATE_NOTES.map((n) => <li key={n}>{n}</li>)}
            </ol>
          </Card>
        </>
      )}
    </Page>
  );
}
