/* Food division: orders, menu, sales mix and kitchen margin.
   A Chicken Attendant session sees this same page, self-scoped to
   just the orders they personally rang up - see `restricted` below. */
import React, { useMemo, useState } from "react";
import { Plus, Drumstick, ArrowDownRight, ArrowUpRight, Clock, Pencil, Trash2, ShoppingBag, BookMarked, Smartphone } from "lucide-react";
import { C } from "../lib/constants";
import { formatKES, formatDateShort } from "../lib/format";
import { resolvePeriod, computeMetrics, inRange, CANCELLED } from "../lib/derive";
import { TODAY } from "../lib/seed";
import { useStore } from "../lib/store.jsx";
import { useActions } from "../lib/actions.jsx";
import { Card, StatCard, SectionTitle, Badge, Button, Segmented } from "../components/ui.jsx";
import DataTable from "../components/DataTable.jsx";
import { PageHeader, Page } from "../components/Page.jsx";
import FilterBar, { selectFilter } from "../components/FilterBar.jsx";
import { statusTone, ORDER_STATUSES, PAYMENT_STATUSES } from "../lib/constants";

export default function FoodView() {
  const { data, prefs, session } = useStore();
  const { openForm, editRecord, deleteRecord, caps } = useActions();
  const restricted = !caps.write; // a Chicken Attendant only sees orders they rang up
  const [tab, setTab] = useState("orders");
  const [q, setQ] = useState("");
  const [oStatus, setOStatus] = useState("All");
  const [pStatus, setPStatus] = useState("All");
  const [channel, setChannel] = useState("All");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const range = useMemo(() => resolvePeriod(prefs.period, prefs.customRange, new Date(TODAY)), [prefs]);
  const m = useMemo(() => computeMetrics(data, range), [data, range]);
  const food = m.byDivision.find((d) => d.division === "Food");

  const ordersInRange = useMemo(
    () => data.orders
      .filter((o) => inRange(o.date, range.from, range.to))
      .filter((o) => !restricted || o.createdBy === session?.name),
    [data.orders, range, restricted, session?.name]
  );
  const openOrders = ordersInRange.filter((o) => ["Preparing", "Out for Delivery"].includes(o.orderStatus)).length;
  const avgOrder = ordersInRange.length ? Math.round(ordersInRange.reduce((s, o) => s + o.amount, 0) / ordersInRange.length) : 0;
  const myIncome = ordersInRange.reduce((s, o) => s + (o.amount || 0), 0);

  const ql = q.trim().toLowerCase();
  const shownOrders = useMemo(() => ordersInRange
    .filter((o) => oStatus === "All" || o.orderStatus === oStatus)
    .filter((o) => pStatus === "All" || o.paymentStatus === pStatus)
    .filter((o) => channel === "All" || o.channel === channel)
    .filter((o) => (!from || o.date >= from) && (!to || o.date <= to))
    .filter((o) => !ql || `${o.customer} ${o.item}`.toLowerCase().includes(ql)),
    [ordersInRange, oStatus, pStatus, channel, from, to, ql]);
  const shownMenu = useMemo(() => data.menu
    .filter((mi) => !ql || `${mi.name} ${mi.category}`.toLowerCase().includes(ql)),
    [data.menu, ql]);
  const dirty = ql || oStatus !== "All" || pStatus !== "All" || channel !== "All" || from || to;
  const clearFilters = () => { setQ(""); setOStatus("All"); setPStatus("All"); setChannel("All"); setFrom(""); setTo(""); };

  const orderColumns = [
    { key: "date", header: "Date", sortValue: (r) => r.date, render: (r) => formatDateShort(r.date), muted: true },
    { key: "customer", header: "Customer", render: (r) => <span className="font-semibold">{r.customer || "Walk-in"}</span> },
    { key: "item", header: "Item", sortValue: (r) => r.item, wrap: true },
    { key: "qty", header: "Qty", align: "right", sortValue: (r) => r.qty, muted: true },
    { key: "amount", header: "Amount", align: "right", sortValue: (r) => r.amount, render: (r) => <span className="font-semibold">{formatKES(r.amount)}</span> },
    { key: "paymentStatus", header: "Payment", sortValue: (r) => r.paymentStatus, render: (r) => <Badge tone={statusTone(r.paymentStatus)} size="sm">{r.paymentStatus}</Badge> },
    { key: "orderStatus", header: "Status", sortValue: (r) => r.orderStatus, render: (r) => <Badge tone={statusTone(r.orderStatus)} size="sm">{r.orderStatus}</Badge> },
  ];

  const menuColumns = [
    { key: "name", header: "Item", render: (r) => <span className="font-semibold">{r.name}</span> },
    { key: "category", header: "Category", sortValue: (r) => r.category, render: (r) => <Badge tone="slate" size="sm">{r.category}</Badge> },
    { key: "price", header: "Price", align: "right", sortValue: (r) => r.price, render: (r) => formatKES(r.price) },
    { key: "cost", header: "Cost price", align: "right", sortValue: (r) => r.cost, render: (r) => formatKES(r.cost), muted: true },
    { key: "margin", header: "Margin", align: "right", sortValue: (r) => (r.price ? (r.price - r.cost) / r.price : 0), render: (r) => {
      const pct = r.price ? Math.round(((r.price - r.cost) / r.price) * 100) : 0;
      return <span style={{ color: pct >= 45 ? C.emerald : pct >= 25 ? C.amber : C.coral }}>{pct}%</span>;
    } },
    { key: "active", header: "Status", sortValue: (r) => (r.active ? 1 : 0), render: (r) => <Badge tone={r.active ? "emerald" : "slate"} size="sm">{r.active ? "In stock" : "Out of stock"}</Badge> },
  ];

  const rowActions = (collection) => caps.write ? [
    { label: "Edit", icon: Pencil, onClick: (r) => editRecord(collection, r.id) },
    { label: "Delete", icon: Trash2, tone: "danger", onClick: (r) => deleteRecord(collection, r.id) },
  ] : [];

  const orderActions = caps.payments ? [
    {
      label: "Collect payment", icon: Smartphone,
      hidden: (r) => r.paymentStatus === "Paid",
      onClick: (r) => openForm("payment", { direction: "in", division: "Food", party: r.customer || "Walk-in customer", amount: r.amount, method: "M-Pesa" }),
    },
    ...rowActions("orders"),
  ] : rowActions("orders");

  return (
    <Page>
      <PageHeader
        title={restricted ? "My Sales" : "Chicken"}
        subtitle={restricted ? "Orders you've rung up." : "Orders, stock and margin."}
        actions={(caps.write || caps.writeOwn) && (
          <>
            {caps.write && <Button variant="outline" size="sm" onClick={() => openForm("menuItem")}><Plus size={14} /> Product</Button>}
            <Button size="sm" onClick={() => openForm("order")}><Plus size={14} /> New order</Button>
          </>
        )}
      />

      <div className={`grid grid-cols-2 ${restricted ? "sm:grid-cols-3" : "lg:grid-cols-4"} gap-2.5 sm:gap-3.5`}>
        {restricted ? (
          <>
            <StatCard icon={ArrowDownRight} label={`My sales · ${range.label}`} value={formatKES(myIncome)} tint={C.emerald} />
            <StatCard icon={ShoppingBag} label="Orders" value={ordersInRange.length} sub={`avg ${formatKES(avgOrder)}`} tint={C.amber} />
            <StatCard icon={Clock} label="Open orders" value={openOrders} sub="preparing / delivering" tint={C.violet} />
          </>
        ) : (
          <>
            <StatCard icon={ArrowDownRight} label={`Money in · ${range.label}`} value={formatKES(food?.income || 0)} trend={food?.incomeDelta} tint={C.emerald} />
            <StatCard icon={ArrowUpRight} label="Money out" value={formatKES(food?.expense || 0)} tint={C.coral} />
            <StatCard icon={ShoppingBag} label="Orders" value={ordersInRange.length} sub={`avg ${formatKES(avgOrder)}`} tint={C.amber} />
            <StatCard icon={Clock} label="Open orders" value={openOrders} sub="preparing / delivering" tint={C.violet} />
          </>
        )}
      </div>

      <Card padded={false}>
        {!restricted && (
          <div className="p-4 sm:p-5 pb-3 flex items-center justify-between flex-wrap gap-3">
            <SectionTitle title={tab === "orders" ? "Orders" : "Products"} />
            <Segmented
              options={[
                { value: "orders", label: `Orders ${ordersInRange.length}` },
                { value: "menu", label: `Products ${data.menu.length}` },
              ]}
              value={tab}
              onChange={setTab}
            />
          </div>
        )}
        {restricted && (
          <div className="p-4 sm:p-5 pb-3">
            <SectionTitle title={`My orders · ${ordersInRange.length}`} />
          </div>
        )}
        <div className="px-3 sm:px-5 pb-5">
          <FilterBar
            search={{ value: q, onChange: setQ, placeholder: (restricted || tab === "orders") ? "Customer or item..." : "Product..." }}
            selects={
              (restricted || tab === "orders")
                ? [
                    selectFilter("os", "Order status", ORDER_STATUSES, oStatus, setOStatus),
                    selectFilter("ps", "Payment", PAYMENT_STATUSES, pStatus, setPStatus),
                    selectFilter("ch", "Channel", ["Walk-in", "Phone", "WhatsApp", "Online", "Wholesale"], channel, setChannel),
                  ]
                : []
            }
            range={(restricted || tab === "orders") ? { from, to, onFrom: setFrom, onTo: setTo } : undefined}
            dirty={!!dirty}
            onClear={clearFilters}
          />
          {(restricted || tab === "orders") ? (
            <DataTable
              columns={orderColumns}
              rows={shownOrders}
              actions={orderActions}
              exportName={`kash-orders-${range.label}`}
              initialSort={{ key: "date", dir: "desc" }}
              emptyIcon={ShoppingBag}
              emptyText="No orders match these filters."
            />
          ) : (
            <DataTable columns={menuColumns} rows={shownMenu} actions={rowActions("menu")} exportName="kash-menu" emptyIcon={BookMarked} emptyText="No products match." />
          )}
        </div>
      </Card>
    </Page>
  );
}
