/* Transport division: fleet, drivers, trips, maintenance and
   trip-level P&L. A Driver session sees this same page, self-scoped
   to just their own trips/vehicle - see `restricted` below - and
   logs trips Uber-style: Start trip (pickup only) -> the trip sits
   "In Transit" -> End trip (drop-off + what was paid) rolls straight
   into Initiate Payment. */
import React, { useEffect, useMemo, useState } from "react";
import {
  Plus, Truck, Users, ArrowDownRight, ArrowUpRight, Coins, Pencil, Trash2, MapPin, Route,
  Wrench, PlayCircle, StopCircle, Navigation,
} from "lucide-react";
import { C } from "../lib/constants";
import { formatKES, formatNumber, formatDateShort, relativeTime } from "../lib/format";
import {
  resolvePeriod, computeMetrics, inRange, CANCELLED,
} from "../lib/derive";
import { TODAY } from "../lib/seed";
import { coordsFor } from "../lib/geo";
import { useStore } from "../lib/store.jsx";
import { useActions } from "../lib/actions.jsx";
import { Card, StatCard, SectionTitle, Badge, Button, Segmented } from "../components/ui.jsx";
import DataTable from "../components/DataTable.jsx";
import MapView from "../components/MapView.jsx";
import { PageHeader, Page } from "../components/Page.jsx";
import FilterBar, { selectFilter } from "../components/FilterBar.jsx";
import { statusTone, TRIP_STATUSES, VEHICLE_STATUSES, DRIVER_STATUSES } from "../lib/constants";

/** Where a vehicle last was, going purely off its most recent trip's
    destination (no live GPS feed here - this is the honest proxy). */
function lastKnownLocation(vehicle, trips) {
  const mine = trips.filter((t) => t.vehicleId === vehicle.id).sort((a, b) => (a.date < b.date ? 1 : -1));
  const at = mine[0]?.destination;
  return coordsFor(at) ? { coords: coordsFor(at), place: at } : { coords: coordsFor("Nairobi"), place: "Nairobi (base)" };
}

export default function TransportView() {
  const { data, prefs, session } = useStore();
  const { openForm, editRecord, deleteRecord, caps, activeView } = useActions();
  const restricted = !caps.write; // a Driver only sees and logs their own trips
  const myVehicle = restricted ? data.vehicles.find((v) => v.driverId === session?.driverId) : null;
  const myDriver = restricted ? data.drivers.find((d) => d.id === session?.driverId) : null;
  const activeTrip = restricted ? data.trips.find((t) => t.driverId === session?.driverId && t.status === "In Transit") : null;

  // The sidebar's "Maintenance" entry is this same page, opened straight
  // to that tab - keep the tab in sync whenever that nav route is chosen.
  const [tab, setTab] = useState(activeView === "maintenance" ? "maintenance" : "trips");
  useEffect(() => {
    if (activeView === "maintenance" || activeView === "transport") {
      setTab(activeView === "maintenance" ? "maintenance" : "trips");
    }
  }, [activeView]);
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
    () => data.trips
      .filter((t) => inRange(t.date, range.from, range.to))
      .filter((t) => !restricted || t.driverId === session?.driverId),
    [data.trips, range, restricted, session?.driverId]
  );
  const driverName = (id) => data.drivers.find((d) => d.id === id)?.name || "-";
  const vehicleReg = (id) => data.vehicles.find((v) => v.id === id)?.reg || "-";

  const myIncome = tripsInRange.reduce((s, t) => s + (t.amount || 0), 0);
  const myExpense = tripsInRange.reduce((s, t) => s + (t.fuelCost || 0) + (t.otherCost || 0), 0);

  const maintenanceRows = useMemo(
    () => (restricted ? data.maintenance.filter((mx) => mx.vehicleId === myVehicle?.id) : data.maintenance),
    [data.maintenance, restricted, myVehicle]
  );

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
  const shownMaintenance = useMemo(() => maintenanceRows
    .filter((mx) => !ql || `${mx.description} ${mx.category} ${vehicleReg(mx.vehicleId)}`.toLowerCase().includes(ql)),
    [maintenanceRows, ql]);
  const dirty = ql || tStatus !== "All" || tVehicle !== "All" || vStatus !== "All" || dStatus !== "All" || from || to;
  const clearFilters = () => { setQ(""); setTStatus("All"); setTVehicle("All"); setVStatus("All"); setDStatus("All"); setFrom(""); setTo(""); };

  const activeVehicles = data.vehicles.filter((v) => v.status === "Active").length;
  const onDuty = data.drivers.filter((d) => d.status === "On Duty").length;

  const fleetPoints = useMemo(() => {
    const vehicles = restricted ? (myVehicle ? [myVehicle] : []) : data.vehicles.filter((v) => v.status !== "Inactive");
    return vehicles.map((v) => {
      const { coords, place } = lastKnownLocation(v, data.trips);
      return { coords, color: v.status === "Maintenance" ? "#CE9114" : "#12958A", label: `${v.reg} · ${v.model}`, sub: `Last seen near ${place} · ${driverName(v.driverId)}` };
    });
  }, [restricted, myVehicle, data.vehicles, data.trips]);

  const tripColumns = [
    { key: "date", header: "Date", sortValue: (r) => r.date, render: (r) => formatDateShort(r.date), muted: true },
    { key: "route", header: "Route", sortValue: (r) => r.destination, render: (r) => (
      <span className="flex items-center gap-1.5"><Route size={13} style={{ color: C.faint }} />{r.origin} → {r.destination || <span style={{ color: C.faint }}>in progress</span>}</span>
    ) },
    ...(restricted ? [] : [
      { key: "vehicleId", header: "Vehicle", sortValue: (r) => vehicleReg(r.vehicleId), render: (r) => vehicleReg(r.vehicleId) },
      { key: "driverId", header: "Driver", sortValue: (r) => driverName(r.driverId), render: (r) => driverName(r.driverId) },
    ]),
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
    { key: "insuranceExpiry", header: "Insurance", sortValue: (r) => r.insuranceExpiry || "", render: (r) => {
      if (!r.insuranceExpiry) return <span style={{ color: C.faint }}>-</span>;
      const days = Math.round((new Date(r.insuranceExpiry) - new Date(TODAY)) / 86400000);
      const tone = days < 0 ? C.coral : days <= 30 ? C.amber : C.muted;
      return <span style={{ color: tone }}>{formatDateShort(r.insuranceExpiry)}</span>;
    } },
    { key: "gpsId", header: "GPS", sortValue: (r) => r.gpsId || "", render: (r) => r.gpsId ? r.gpsId : <span style={{ color: C.faint }}>Not fitted</span>, muted: true },
    { key: "service", header: "Service status", align: "right", sortValue: (r) => (r.serviceDueKm || 0) - r.mileage, render: (r) => {
      if (!r.serviceDueKm) return "-";
      const left = r.serviceDueKm - r.mileage;
      return <span style={{ color: left <= 0 ? C.coral : left < 2500 ? C.amber : C.muted }}>{left <= 0 ? `${formatNumber(-left)} km over` : `${formatNumber(left)} km left`}</span>;
    } },
    { key: "status", header: "Status", sortValue: (r) => r.status, render: (r) => <Badge tone={statusTone(r.status)} size="sm">{r.status}</Badge> },
  ];

  const driverColumns = [
    { key: "name", header: "Name", render: (r) => <span className="font-semibold">{r.name}</span> },
    { key: "idNumber", header: "ID / Licence", sortValue: (r) => r.idNumber || "", render: (r) => (
      <span className="text-xs">
        <span style={{ color: C.ink }}>{r.idNumber || "-"}</span>
        <br /><span style={{ color: C.faint }}>{r.licence || "-"}</span>
      </span>
    ) },
    { key: "phone", header: "Contact", sortValue: (r) => r.phone || "", render: (r) => (
      <span className="text-xs">
        <span style={{ color: C.ink }}>{r.phone}</span>
        <br /><span style={{ color: C.faint }}>{r.email || "-"}</span>
      </span>
    ) },
    { key: "nextOfKin", header: "Next of kin", muted: true },
    { key: "rating", header: "Rating", align: "right", sortValue: (r) => r.rating, render: (r) => `★ ${r.rating?.toFixed(1) ?? "-"}` },
    { key: "status", header: "Status", sortValue: (r) => r.status, render: (r) => <Badge tone={statusTone(r.status)} size="sm">{r.status}</Badge> },
  ];

  const maintenanceColumns = [
    { key: "date", header: "Date", sortValue: (r) => r.date, render: (r) => formatDateShort(r.date), muted: true },
    ...(restricted ? [] : [{ key: "vehicleId", header: "Vehicle", sortValue: (r) => vehicleReg(r.vehicleId), render: (r) => vehicleReg(r.vehicleId) }]),
    { key: "category", header: "Type", sortValue: (r) => r.category, render: (r) => <Badge tone="slate" size="sm">{r.category}</Badge> },
    { key: "description", header: "Details", wrap: true },
    { key: "cost", header: "Cost", align: "right", sortValue: (r) => r.cost, render: (r) => <span className="font-semibold">{formatKES(r.cost)}</span> },
  ];

  const rowActions = (collection) => caps.write ? [
    { label: "Edit", icon: Pencil, onClick: (r) => editRecord(collection, r.id) },
    { label: "Delete", icon: Trash2, tone: "danger", onClick: (r) => deleteRecord(collection, r.id) },
  ] : [];

  const tripActions = caps.payments ? [
    {
      label: "Collect fare", icon: Coins,
      hidden: (r) => r.status === "Cancelled" || r.status === "In Transit",
      onClick: (r) => openForm("payment", { direction: "in", division: "Transport", party: r.client || "Passenger", amount: r.amount, method: "M-Pesa" }),
    },
    ...rowActions("trips"),
  ] : rowActions("trips");

  const TABS = restricted
    ? [
        { value: "trips", label: `My trips ${tripsInRange.length}` },
        { value: "maintenance", label: `Maintenance ${maintenanceRows.length}` },
      ]
    : [
        { value: "trips", label: `Trips ${tripsInRange.length}` },
        { value: "vehicles", label: `Vehicles ${data.vehicles.length}` },
        { value: "drivers", label: `Drivers ${data.drivers.length}` },
        { value: "maintenance", label: `Maintenance ${data.maintenance.length}` },
      ];

  return (
    <Page>
      <PageHeader
        title={activeView === "maintenance" ? "Maintenance" : restricted ? "My Transport" : "Transport"}
        subtitle={restricted ? "Your trips, vehicle and maintenance log." : "Fleet, drivers and trip performance."}
        actions={(caps.write || caps.writeOwn) && (
          <>
            {caps.write && <Button variant="outline" size="sm" onClick={() => openForm("driver")}><Plus size={14} /> Driver</Button>}
            {caps.write && <Button variant="outline" size="sm" onClick={() => openForm("vehicle")}><Plus size={14} /> Vehicle</Button>}
            {caps.write && <Button size="sm" onClick={() => openForm("trip")}><Plus size={14} /> New trip</Button>}
            {restricted && <Button variant="outline" size="sm" onClick={() => openForm("maintenance")}><Wrench size={14} /> Maintenance</Button>}
            {restricted && !activeTrip && <Button size="sm" onClick={() => openForm("startTrip")}><PlayCircle size={14} /> Start trip</Button>}
          </>
        )}
      />

      {restricted && activeTrip && (
        <Card className="relative overflow-hidden" style={{ borderColor: C.blue, background: C.blueSoft }}>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: C.blue }}>
                <Navigation size={18} style={{ color: "#fff" }} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: C.blue }}>Trip in progress</p>
                <p className="text-sm font-bold truncate" style={{ color: C.ink }}>
                  {activeTrip.origin} → <span style={{ color: C.muted }}>drop-off pending</span>
                </p>
                <p className="text-xs mt-0.5" style={{ color: C.muted }}>
                  {activeTrip.client ? `${activeTrip.client} · ` : ""}Started {relativeTime(new Date(activeTrip.date).toISOString())}
                </p>
              </div>
            </div>
            <Button onClick={() => openForm("endTrip", activeTrip)}><StopCircle size={14} /> End trip</Button>
          </div>
        </Card>
      )}

      {restricted && (myVehicle || myDriver) && (
        <Card>
          <SectionTitle title="Your details" subtitle="Only you and admins can see this." />
          <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
            {myDriver && <>
              <Row label="ID number" value={myDriver.idNumber || "-"} />
              <Row label="Licence" value={myDriver.licence || "-"} />
              <Row label="Next of kin" value={myDriver.nextOfKin || "-"} />
              <Row label="Status" value={<Badge tone={statusTone(myDriver.status)} size="sm">{myDriver.status}</Badge>} />
            </>}
            {myVehicle && <>
              <Row label="Vehicle" value={`${myVehicle.reg} · ${myVehicle.type} ${myVehicle.model}`} />
              <Row label="GPS" value={myVehicle.gpsId || "Not fitted"} />
              <Row label="Insurance expires" value={myVehicle.insuranceExpiry ? formatDateShort(myVehicle.insuranceExpiry) : "-"} />
              <Row label="Vehicle status" value={<Badge tone={statusTone(myVehicle.status)} size="sm">{myVehicle.status}</Badge>} />
            </>}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        {restricted ? (
          <>
            <StatCard icon={ArrowDownRight} label={`Money in · ${range.label}`} value={formatKES(myIncome)} tint={C.emerald} />
            <StatCard icon={ArrowUpRight} label="Money out" value={formatKES(myExpense)} tint={C.coral} />
            <StatCard icon={Coins} label="Net" value={formatKES(myIncome - myExpense)} tint={C.blue} />
            <StatCard icon={MapPin} label="Trips" value={tripsInRange.length} sub={range.label} tint={C.violet} />
          </>
        ) : (
          <>
            <StatCard icon={ArrowDownRight} label={`Money in · ${range.label}`} value={formatKES(transport?.income || 0)} trend={transport?.incomeDelta} tint={C.emerald} />
            <StatCard icon={ArrowUpRight} label="Money out" value={formatKES(transport?.expense || 0)} tint={C.coral} />
            <StatCard icon={Coins} label="Net profit" value={formatKES(transport?.profit || 0)} sub={`${Math.round(transport?.margin || 0)}% margin`} tint={C.blue} />
            <StatCard icon={Truck} label="Fleet" value={`${activeVehicles}/${data.vehicles.length}`} sub={`${onDuty} drivers on duty`} tint={C.violet} />
          </>
        )}
      </div>

      {fleetPoints.length > 0 && (
        <Card>
          <SectionTitle title={restricted ? "Your vehicle" : "Fleet map"} subtitle="Last known location, from each vehicle's most recent trip." />
          <MapView points={fleetPoints} height={restricted ? 220 : 300} />
        </Card>
      )}

      <Card padded={false}>
        <div className="p-4 sm:p-5 pb-3 flex items-center justify-between flex-wrap gap-3">
          <SectionTitle title={{ trips: restricted ? "My trips" : "Trips", vehicles: "Vehicles", drivers: "Drivers", maintenance: "Maintenance" }[tab]} />
          <Segmented options={TABS} value={tab} onChange={setTab} />
        </div>
        <div className="px-3 sm:px-5 pb-5">
          <FilterBar
            search={{
              value: q, onChange: setQ,
              placeholder: tab === "trips" ? "Route, client, vehicle..." : tab === "vehicles" ? "Reg or model..." : tab === "drivers" ? "Name or phone..." : "Vehicle, type, details...",
            }}
            selects={
              tab === "trips"
                ? restricted
                  ? [selectFilter("s", "Status", TRIP_STATUSES, tStatus, setTStatus)]
                  : [
                      selectFilter("s", "Status", TRIP_STATUSES, tStatus, setTStatus),
                      selectFilter("v", "Vehicle", data.vehicles.map((v) => v.reg), tVehicle, setTVehicle),
                    ]
                : tab === "vehicles"
                  ? [selectFilter("vs", "Status", VEHICLE_STATUSES, vStatus, setVStatus)]
                  : tab === "drivers"
                    ? [selectFilter("ds", "Status", DRIVER_STATUSES, dStatus, setDStatus)]
                    : []
            }
            range={tab === "trips" ? { from, to, onFrom: setFrom, onTo: setTo } : undefined}
            dirty={!!dirty}
            onClear={clearFilters}
          />
          {tab === "trips" && (
            <DataTable columns={tripColumns} rows={shownTrips} actions={tripActions} exportName={`kash-trips-${range.label}`} initialSort={{ key: "date", dir: "desc" }} emptyIcon={MapPin} emptyText="No trips match these filters." />
          )}
          {!restricted && tab === "vehicles" && (
            <DataTable columns={vehicleColumns} rows={shownVehicles} actions={rowActions("vehicles")} exportName="kash-vehicles" emptyIcon={Truck} emptyText="No vehicles match." />
          )}
          {!restricted && tab === "drivers" && (
            <DataTable columns={driverColumns} rows={shownDrivers} actions={rowActions("drivers")} exportName="kash-drivers" emptyIcon={Users} emptyText="No drivers match." />
          )}
          {tab === "maintenance" && (
            <DataTable columns={maintenanceColumns} rows={shownMaintenance} actions={rowActions("maintenance")} exportName="kash-maintenance" emptyIcon={Wrench} emptyText="No maintenance logged yet." />
          )}
        </div>
      </Card>
    </Page>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span style={{ color: C.muted }}>{label}</span>
      <span className="font-semibold" style={{ color: C.ink }}>{value}</span>
    </div>
  );
}
