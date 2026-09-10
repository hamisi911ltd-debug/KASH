/* Transport division: fleet, drivers, trips, and trip-level P&L. */
import React, { useMemo, useState } from "react";
import { Plus, Truck, Users, Fuel, TrendingUp, Coins, Pencil, Trash2, MapPin, Route } from "lucide-react";
import { C } from "../lib/constants";
import { formatKES, formatNumber, formatDateShort } from "../lib/format";
import {
  resolvePeriod, computeMetrics, weeklySeries, inRange, CANCELLED,
} from "../lib/derive";
import { TODAY } from "../lib/seed";
import { useStore } from "../lib/store.jsx";
import { useActions } from "../lib/actions.jsx";
import { Card, StatCard, SectionTitle, Badge, Button, Segmented } from "../components/ui.jsx";
import { GroupedBars } from "../components/Charts.jsx";
import { useChartPalette } from "../lib/hooks.js";
import DataTable from "../components/DataTable.jsx";
import { PageHeader, Page } from "../components/Page.jsx";
import FilterBar, { selectFilter } from "../components/FilterBar.jsx";
import { statusTone, TRIP_STATUSES, VEHICLE_STATUSES, DRIVER_STATUSES } from "../lib/constants";

export default function TransportView() {
  const { data, prefs } = useStore();
  const { openForm, editRecord, deleteRecord, caps } = useActions();
  const pal = useChartPalette();
  const [tab, setTab] = useState("trips");
  const [q, setQ] = useState("");
  const [tStatus, setTStatus] = useState("All");
  const [tVehicle, setTVehicle] = useState("All");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [vStatus, setVStatus] = useState("All");
  const [dStatus, setDStatus] = useState("All");

  const range = useMemo(() => resolvePeriod(prefs.period, prefs.customRange, new Date(TODAY)), [prefs]);
  const m = useMemo(() => computeMetrics(data, range), [data, range]);
  const transport = m.byDivision.find((d) => d.division === "Transport");

  const tripsInRange = useMemo(
    () => data.trips.filter((t) => inRange(t.date, range.from, range.to)),
    [data.trips, range]
  );
  const series = useMemo(
    () => weeklySeries(m.ledger.filter((l) => l.division === "Transport"), 8, new Date(TODAY)),
    [m.ledger]
  );
  const driverName = (id) => data.drivers.find((d) => d.id === id)?.name || "-";
  const vehicleReg = (id) => data.vehicles.find((v) => v.id === id)?.reg || "-";

  const ql = q.trim().toLowerCase();
  const shownTrips = useMemo(() => tripsInRange
    .filter((t) => tStatus === "All" || t.status === tStatus)
    .filter((t) => tVehicle === "All" || vehicleReg(t.vehicleId) === tVehicle)
    .filter((t) => (!from || t.date >= from) && (!to || t.date <= to))
    .filter((t) => !ql || `${t.origin} ${t.destination} ${t.client || ""} ${vehicleReg(t.vehicleId)} ${driverName(t.driverId)}`.toLowerCase().includes(ql)),
    [tripsInRange, tStatus, tVehicle, from, to, ql]);
  const shownVehicles = useMemo(() => data.vehicles
    .filter((v) => vStatus === "All" || v.status === vStatus)
    .filter((v) => !ql || `${v.reg} ${v.model} ${v.type}`.toLowerCase().includes(ql)),
    [data.vehicles, vStatus, ql]);
  const shownDrivers = useMemo(() => data.drivers
    .filter((d) => dStatus === "All" || d.status === dStatus)
    .filter((d) => !ql || `${d.name} ${d.phone} ${d.licence || ""}`.toLowerCase().includes(ql)),
    [data.drivers, dStatus, ql]);
  const dirty = ql || tStatus !== "All" || tVehicle !== "All" || vStatus !== "All" || dStatus !== "All" || from || to;
  const clearFilters = () => { setQ(""); setTStatus("All"); setTVehicle("All"); setVStatus("All"); setDStatus("All"); setFrom(""); setTo(""); };

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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        <StatCard icon={TrendingUp} label={`Revenue · ${range.label}`} value={formatKES(transport?.income || 0)} trend={transport?.incomeDelta} tint={C.emerald} />
        <StatCard icon={Coins} label="Net profit" value={formatKES(transport?.profit || 0)} sub={`${Math.round(transport?.margin || 0)}% margin`} tint={C.blue} />
        <StatCard icon={Truck} label="Fleet" value={`${activeVehicles}/${data.vehicles.length}`} sub="active vehicles" tint={C.violet} />
        <StatCard icon={Fuel} label="Fuel spend" value={formatKES(fuelSpend)} sub={`${onDuty} drivers on duty`} tint={C.coral} />
      </div>

      <Card className="lg:max-w-2xl">
        <SectionTitle title="Received vs spent" subtitle="Weekly, last 8 weeks" />
        <GroupedBars
          data={series}
          series={[
            { key: "income", label: "Received", color: pal.blue },
            { key: "expense", label: "Spent", color: pal.coral },
          ]}
          height={165}
          maxBarSize={26}
        />
      </Card>

      <Card padded={false}>
        <div className="p-4 sm:p-5 pb-3 flex items-center justify-between flex-wrap gap-3">
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
        <div className="px-3 sm:px-5 pb-5">
          <FilterBar
            search={{ value: q, onChange: setQ, placeholder: tab === "trips" ? "Route, client, vehicle..." : tab === "vehicles" ? "Reg or model..." : "Name or phone..." }}
            selects={
              tab === "trips"
                ? [
                    selectFilter("s", "Status", TRIP_STATUSES, tStatus, setTStatus),
                    selectFilter("v", "Vehicle", data.vehicles.map((v) => v.reg), tVehicle, setTVehicle),
                  ]
                : tab === "vehicles"
                  ? [selectFilter("vs", "Status", VEHICLE_STATUSES, vStatus, setVStatus)]
                  : [selectFilter("ds", "Status", DRIVER_STATUSES, dStatus, setDStatus)]
            }
            range={tab === "trips" ? { from, to, onFrom: setFrom, onTo: setTo } : undefined}
            dirty={!!dirty}
            onClear={clearFilters}
          />
          {tab === "trips" && (
            <DataTable columns={tripColumns} rows={shownTrips} actions={rowActions("trips")} exportName={`kash-trips-${range.label}`} initialSort={{ key: "date", dir: "desc" }} emptyIcon={MapPin} emptyText="No trips match these filters." />
          )}
          {tab === "vehicles" && (
            <DataTable columns={vehicleColumns} rows={shownVehicles} actions={rowActions("vehicles")} exportName="kash-vehicles" emptyIcon={Truck} emptyText="No vehicles match." />
          )}
          {tab === "drivers" && (
            <DataTable columns={driverColumns} rows={shownDrivers} actions={rowActions("drivers")} exportName="kash-drivers" emptyIcon={Users} emptyText="No drivers match." />
          )}
        </div>
      </Card>
    </Page>
  );
}
