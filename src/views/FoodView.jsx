/* Food division: orders, menu, sales mix and kitchen margin. */
import React, { useMemo, useState } from "react";
import { Plus, UtensilsCrossed, TrendingUp, Coins, Clock, Pencil, Trash2, ShoppingBag, BookMarked } from "lucide-react";
import { C } from "../lib/constants";
import { formatKES, formatDateShort } from "../lib/format";
import { resolvePeriod, computeMetrics, weeklySeries, inRange, topBy, CANCELLED } from "../lib/derive";
import { TODAY } from "../lib/seed";
import { useStore } from "../lib/store.jsx";
import { useActions } from "../lib/actions.jsx";
import { Card, StatCard, SectionTitle, Badge, Button, Segmented } from "../components/ui.jsx";
import { GroupedBars, BarSeries } from "../components/Charts.jsx";
import { useChartPalette } from "../lib/hooks.js";
import DataTable from "../components/DataTable.jsx";
import { PageHeader, Page } from "../components/Page.jsx";
import { statusTone } from "../lib/constants";

export default function FoodView() {
  const { data, prefs } = useStore();
  const { openForm, editRecord, deleteRecord, caps } = useActions();
  const pal = useChartPalette();
  const [tab, setTab] = useState("orders");

  const range = useMemo(() => resolvePeriod(prefs.period, prefs.customRange, new Date(TODAY)), [prefs]);
  const m = useMemo(() => computeMetrics(data, range), [data, range]);
  const food = m.byDivision.find((d) => d.division === "Food");

  const ordersInRange = useMemo(
    () => data.orders.filter((o) => inRange(o.date, range.from, range.to)),
    [data.orders, range]
  );
  const series = useMemo(
    () => weeklySeries(m.ledger.filter((l) => l.division === "Food"), 12, new Date(TODAY)),
    [m.ledger]
  );
  const topItems = useMemo(
    () => topBy(ordersInRange.filter((o) => o.orderStatus !== CANCELLED), (o) => o.item.replace(/\s*\(\d+ pax\)$/, ""), (o) => o.amount, 6),
    [ordersInRange]
  );

  const openOrders = ordersInRange.filter((o) => ["Preparing", "Out for Delivery"].includes(o.orderStatus)).length;
  const avgOrder = ordersInRange.length ? Math.round(ordersInRange.reduce((s, o) => s + o.amount, 0) / ordersInRange.length) : 0;

  const orderColumns = [
    { key: "date", header: "Date", sortValue: (r) => r.date, render: (r) => formatDateShort(r.date), muted: true },
    { key: "customer", header: "Customer", render: (r) => <span className="font-semibold">{r.customer}</span> },
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
    { key: "cost", header: "Food cost", align: "right", sortValue: (r) => r.cost, render: (r) => formatKES(r.cost), muted: true },
    { key: "margin", header: "Margin", align: "right", sortValue: (r) => (r.price ? (r.price - r.cost) / r.price : 0), render: (r) => {
      const pct = r.price ? Math.round(((r.price - r.cost) / r.price) * 100) : 0;
      return <span style={{ color: pct >= 45 ? C.emerald : pct >= 25 ? C.amber : C.coral }}>{pct}%</span>;
    } },
    { key: "active", header: "Status", sortValue: (r) => (r.active ? 1 : 0), render: (r) => <Badge tone={r.active ? "emerald" : "slate"} size="sm">{r.active ? "Available" : "Hidden"}</Badge> },
  ];

  const rowActions = (collection) => caps.write ? [
    { label: "Edit", icon: Pencil, onClick: (r) => editRecord(collection, r.id) },
    { label: "Delete", icon: Trash2, tone: "danger", onClick: (r) => deleteRecord(collection, r.id) },
  ] : [];

  return (
    <Page>
      <PageHeader
        title="Food"
        subtitle="Orders, menu and kitchen margin."
        actions={caps.write && (
          <>
            <Button variant="outline" size="sm" onClick={() => openForm("menuItem")}><Plus size={14} /> Menu item</Button>
            <Button size="sm" onClick={() => openForm("order")}><Plus size={14} /> New order</Button>
          </>
        )}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={TrendingUp} label={`Revenue · ${range.label}`} value={formatKES(food?.income || 0)} trend={food?.incomeDelta} tint={C.emerald} />
        <StatCard icon={Coins} label="Net profit" value={formatKES(food?.profit || 0)} sub={`${Math.round(food?.margin || 0)}% margin`} tint={C.blue} />
        <StatCard icon={ShoppingBag} label="Orders" value={ordersInRange.length} sub={`avg ${formatKES(avgOrder)}`} tint={C.amber} />
        <StatCard icon={Clock} label="Open orders" value={openOrders} sub="preparing / delivering" tint={C.coral} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <SectionTitle title="Received vs spent" subtitle="Weekly, last 12 weeks" />
          <GroupedBars
            data={series}
            series={[
              { key: "income", label: "Received", color: pal.blue },
              { key: "expense", label: "Spent", color: pal.coral },
            ]}
            height={240}
          />
        </Card>
        <Card>
          <SectionTitle title="Best sellers" subtitle="By revenue in range" />
          <BarSeries data={topItems} horizontal height={240} color={C.amber} />
        </Card>
      </div>

      <Card padded={false}>
        <div className="p-5 pb-3 flex items-center justify-between flex-wrap gap-3">
          <SectionTitle title={tab === "orders" ? "Orders" : "Menu"} />
          <Segmented
            options={[
              { value: "orders", label: `Orders ${ordersInRange.length}` },
              { value: "menu", label: `Menu ${data.menu.length}` },
            ]}
            value={tab}
            onChange={setTab}
          />
        </div>
        <div className="px-5 pb-5">
          {tab === "orders" ? (
            <DataTable
              columns={orderColumns}
              rows={ordersInRange}
              actions={rowActions("orders")}
              exportName={`food-orders-${range.label}`}
              initialSort={{ key: "date", dir: "desc" }}
              emptyIcon={ShoppingBag}
              emptyText="No orders in this period."
            />
          ) : (
            <DataTable columns={menuColumns} rows={data.menu} actions={rowActions("menu")} exportName="menu" emptyIcon={BookMarked} emptyText="No menu items yet." />
          )}
        </div>
      </Card>
    </Page>
  );
}
