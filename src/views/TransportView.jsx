/* Transport division: fleet, drivers, trips, and trip-level P&L. */
import React, { useMemo, useState } from "react";
import { Plus, Truck, Users, Fuel, TrendingUp, Coins, Pencil, Trash2, MapPin, Route } from "lucide-react";
import { C } from "../lib/constants";
import { formatKES, formatNumber, formatDateShort } from "../lib/format";
import {
  resolvePeriod, computeMetrics, seriesByDay, seriesByMonth, chartRange, inRange, topBy, CANCELLED,
} from "../lib/derive";
import { TODAY } from "../lib/seed";
import { useStore } from "../lib/store.jsx";
import { useActions } from "../lib/actions.jsx";
import { Card, StatCard, SectionTitle, Badge, Button, Segmented } from "../components/ui.jsx";
import { TrendArea, BarSeries } from "../components/Charts.jsx";
import DataTable from "../components/DataTable.jsx";
import { PageHeader, Page } from "../components/Page.jsx";
import { statusTone } from "../lib/constants";

export default function TransportView() {
  const { data, prefs } = useStore();
  const { openForm, editRecord, deleteRecord, caps } = useActions();
  const [tab, setTab] = useState("trips");

  const range = useMemo(() => resolvePeriod(prefs.period, prefs.customRange, new Date(TODAY)), [prefs]);
  const m = useMemo(() => computeMetrics(data, range), [data, range]);
  const transport = m.byDivision.find((d) => d.division === "Transport");

  const tripsInRange = useMemo(
    () => data.trips.filter((t) => inRange(t.date, range.from, range.to)),
    [data.trips, range]
  );
  const series = useMemo(() => {
    const lines = m.current.filter((l) => l.division === "Transport");
    const cr = chartRange(range, lines);
    return cr.monthly ? seriesByMonth(lines, 12, new Date(TODAY)) : seriesByDay(lines, cr.from, cr.to);
  }, [m.current, range]);
  const byRoute = useMemo(
    () => topBy(tripsInRange.filter((t) => t.status !== CANCELLED), (t) => `${t.origin}→${t.destination}`, (t) => t.amount, 6),
    [tripsInRange]
  );

  const driverName = (id) => data.drivers.find((d) => d.id === id)?.name || "-";
  const vehicleReg = (id) => data.vehicles.find((v) => v.id === id)?.reg || "-";

  const activeVehicles = data.vehicles.filter((v) => v.status === "Active").length;
  const onDuty = data.drivers.filter((d) => d.status === "On Duty").length;
  const fuelSpend = m.current.filter((l) => l.division === "Transport" && l.category === "Fuel").reduce((s, l) => s + l.amount, 0);

  const tripColumns = [
    { key: "date", header: "Date", sortValue: (r) => r.date, render: (r) => formatDateShort(r.date), muted: true },
    { key: "route", header: "Route", sortValue: (r) => r.destination, render: (r) => (
      <span className="flex items-center gap-1.5"><Route size={13} style={{ color: C.faint }} />{r.origin} → {r.destination}</span>
    ) },
    { key: "vehicleId", header: "Vehicle", sortValue: (r) => vehicleReg(r.vehicleId), render: (r) => vehicleReg(r.vehicleId) },
    { key: "driverId", header: "Driver", sortValue: (r) => driverName(r.driverId), render: (r) => driverName(r.driverId) },
    { key: "amount", header: "Fare", align: "right", sortValue: (r) => r.amount, render: (r) => <span className="font-semibold">{formatKES(r.amount)}</span> },
    { key: "net", header: "Net", align: "right", sortValue: (r) => r.amount - r.fuelCost - r.otherCost, render: (r) => {
      const net = r.amount - r.fuelCost - r.otherCost;
      return <span className="font-semibold" style={{ color: net >= 0 ? C.emerald : C.coral }}>{formatKES(net)}</span>;
    } },
    { key: "status", header: "Status", sortValue: (r) => r.status, render: (r) => <Badge tone={statusTone(r.status)} size="sm">{r.status}</Badge> },
  ];

  const vehicleColumns = [
    { key: "reg", header: "Reg", render: (r) => <span className="font-semibold">{r.reg}</span> },
    { key: "model", header: "Type / model", sortValue: (r) => r.model, render: (r) => `${r.type} · ${r.model}` },
    { key: "driverId", header: "Driver", sortValue: (r) => driverName(r.driverId), render: (r) => driverName(r.driverId) },
    { key: "mileage", header: "Odometer", align: "right", sortValue: (r) => r.mileage, render: (r) => `${formatNumber(r.mileage)} km`, muted: true },
    { key: "service", header: "Service", align: "right", sortValue: (r) => (r.serviceDueKm || 0) - r.mileage, render: (r) => {
      if (!r.serviceDueKm) return "-";
      const left = r.serviceDueKm - r.mileage;
      return <span style={{ color: left <= 0 ? C.coral : left < 2500 ? C.amber : C.muted }}>{left <= 0 ? `${formatNumber(-left)} km over` : `${formatNumber(left)} km`}</span>;
    } },
    { key: "status", header: "Status", sortValue: (r) => r.status, render: (r) => <Badge tone={statusTone(r.status)} size="sm">{r.status}</Badge> },
  ];

  const driverColumns = [
    { key: "name", header: "Name", render: (r) => <span className="font-semibold">{r.name}</span> },
    { key: "phone", header: "Phone", muted: true },
    { key: "licence", header: "Licence", muted: true },
    { key: "rating", header: "Rating", align: "right", sortValue: (r) => r.rating, render: (r) => `★ ${r.rating?.toFixed(1) ?? "-"}` },
    { key: "status", header: "Status", sortValue: (r) => r.status, render: (r) => <Badge tone={statusTone(r.status)} size="sm">{r.status}</Badge> },
  ];

  const rowActions = (collection) => caps.write ? [
    { label: "Edit", icon: Pencil, onClick: (r) => editRecord(collection, r.id) },
    { label: "Delete", icon: Trash2, tone: "danger", onClick: (r) => deleteRecord(collection, r.id) },
  ] : [];

  return (
    <Page>
      <PageHeader
        title="Transport"
        subtitle="Fleet, drivers and trip performance."
        actions={caps.write && (
          <>
            <Button variant="outline" size="sm" onClick={() => openForm("driver")}><Plus size={14} /> Driver</Button>
            <Button variant="outline" size="sm" onClick={() => openForm("vehicle")}><Plus size={14} /> Vehicle</Button>
            <Button size="sm" onClick={() => openForm("trip")}><Plus size={14} /> New trip</Button>
          </>
        )}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={TrendingUp} label={`Revenue · ${range.label}`} value={formatKES(transport?.income || 0)} trend={transport?.incomeDelta} tint={C.emerald} />
        <StatCard icon={Coins} label="Net profit" value={formatKES(transport?.profit || 0)} sub={`${Math.round(transport?.margin || 0)}% margin`} tint={C.blue} />
        <StatCard icon={Truck} label="Fleet" value={`${activeVehicles}/${data.vehicles.length}`} sub="active vehicles" tint={C.violet} />
        <StatCard icon={Fuel} label="Fuel spend" value={formatKES(fuelSpend)} sub={`${onDuty} drivers on duty`} tint={C.coral} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <SectionTitle title="Transport revenue vs cost" />
          <TrendArea data={series} height={240} />
        </Card>
        <Card>
          <SectionTitle title="Top routes" subtitle="By fare in range" />
          <BarSeries data={byRoute} horizontal height={240} color={C.emerald} />
        </Card>
      </div>

      <Card padded={false}>
        <div className="p-5 pb-3 flex items-center justify-between flex-wrap gap-3">
          <SectionTitle title={{ trips: "Trips", vehicles: "Vehicles", drivers: "Drivers" }[tab]} />
          <Segmented
            options={[
              { value: "trips", label: `Trips ${tripsInRange.length}` },
              { value: "vehicles", label: `Vehicles ${data.vehicles.length}` },
              { value: "drivers", label: `Drivers ${data.drivers.length}` },
            ]}
            value={tab}
            onChange={setTab}
          />
        </div>
        <div className="px-5 pb-5">
          {tab === "trips" && (
            <DataTable
              columns={tripColumns}
              rows={tripsInRange}
              actions={rowActions("trips")}
              exportName={`transport-trips-${range.label}`}
              initialSort={{ key: "date", dir: "desc" }}
              emptyIcon={MapPin}
              emptyText="No trips in this period."
            />
          )}
          {tab === "vehicles" && (
            <DataTable columns={vehicleColumns} rows={data.vehicles} actions={rowActions("vehicles")} exportName="fleet-vehicles" emptyIcon={Truck} emptyText="No vehicles yet." />
          )}
          {tab === "drivers" && (
            <DataTable columns={driverColumns} rows={data.drivers} actions={rowActions("drivers")} exportName="drivers" emptyIcon={Users} emptyText="No drivers yet." />
          )}
        </div>
      </Card>
    </Page>
  );
}
