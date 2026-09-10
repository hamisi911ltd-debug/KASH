/* Hospitality division: rooms, bookings, occupancy and guest revenue.
   Room "Occupied" state is derived from bookings, never set by hand. */
import React, { useMemo, useState } from "react";
import { Plus, BedDouble, TrendingUp, Coins, CalendarCheck, Pencil, Trash2, DoorOpen, LogIn, LogOut } from "lucide-react";
import { C } from "../lib/constants";
import { formatKES, formatDateShort } from "../lib/format";
import {
  resolvePeriod, computeMetrics, weeklySeries, weeklyOccupancy, occupancyRate,
  roomStates, inRange, CANCELLED,
} from "../lib/derive";
import { TODAY } from "../lib/seed";
import { useStore } from "../lib/store.jsx";
import { useActions } from "../lib/actions.jsx";
import { Card, StatCard, SectionTitle, Badge, Button, Segmented } from "../components/ui.jsx";
import { GroupedBars, BarSeries } from "../components/Charts.jsx";
import { useChartPalette } from "../lib/hooks.js";
import DataTable from "../components/DataTable.jsx";
import { PageHeader, Page } from "../components/Page.jsx";
import { statusTone } from "../lib/constants";

const STATE_TONE = { Occupied: "blue", Available: "emerald", Cleaning: "amber", Maintenance: "coral" };

export default function HospitalityView() {
  const { data, prefs } = useStore();
  const { openForm, editRecord, deleteRecord, patchRoom, caps } = useActions();
  const pal = useChartPalette();
  const [tab, setTab] = useState("bookings");

  const range = useMemo(() => resolvePeriod(prefs.period, prefs.customRange, new Date(TODAY)), [prefs]);
  const m = useMemo(() => computeMetrics(data, range), [data, range]);
  const hosp = m.byDivision.find((d) => d.division === "Hospitality");

  const bookingsInRange = useMemo(
    () => data.bookings.filter((b) => inRange(b.checkIn, range.from, range.to) || (b.checkIn <= range.to && b.checkOut >= range.from)),
    [data.bookings, range]
  );
  const series = useMemo(
    () => weeklySeries(m.ledger.filter((l) => l.division === "Hospitality"), 12, new Date(TODAY)),
    [m.ledger]
  );
  const occ = useMemo(
    () => weeklyOccupancy(data.rooms, data.bookings, 12, new Date(TODAY)),
    [data.rooms, data.bookings]
  );
  const rooms = useMemo(() => roomStates(data.rooms, data.bookings, TODAY), [data.rooms, data.bookings]);

  const occNow = occupancyRate(data.rooms, data.bookings, TODAY);
  const avgOcc = occ.length ? Math.round(occ.reduce((s, d) => s + d.rate, 0) / occ.length) : 0;
  const arrivals = data.bookings.filter((b) => b.checkIn === TODAY && b.status !== CANCELLED).length;
  const departures = data.bookings.filter((b) => b.checkOut === TODAY && b.status !== CANCELLED).length;

  const roomNo = (id) => data.rooms.find((r) => r.id === id)?.number || "-";

  const bookingColumns = [
    { key: "guest", header: "Guest", render: (r) => <span className="font-semibold">{r.guest}</span> },
    { key: "roomId", header: "Room", sortValue: (r) => roomNo(r.roomId), render: (r) => `Room ${roomNo(r.roomId)}` },
    { key: "checkIn", header: "Check-in", sortValue: (r) => r.checkIn, render: (r) => formatDateShort(r.checkIn), muted: true },
    { key: "checkOut", header: "Check-out", sortValue: (r) => r.checkOut, render: (r) => formatDateShort(r.checkOut), muted: true },
    { key: "nights", header: "Nights", align: "right", sortValue: (r) => r.nights, muted: true },
    { key: "amount", header: "Amount", align: "right", sortValue: (r) => r.amount, render: (r) => <span className="font-semibold">{formatKES(r.amount)}</span> },
    { key: "paymentStatus", header: "Payment", sortValue: (r) => r.paymentStatus, render: (r) => <Badge tone={statusTone(r.paymentStatus)} size="sm">{r.paymentStatus}</Badge> },
    { key: "status", header: "Status", sortValue: (r) => r.status, render: (r) => <Badge tone={statusTone(r.status)} size="sm">{r.status}</Badge> },
  ];

  const rowActions = caps.write ? [
    { label: "Edit", icon: Pencil, onClick: (r) => editRecord("bookings", r.id) },
    { label: "Delete", icon: Trash2, tone: "danger", onClick: (r) => deleteRecord("bookings", r.id) },
  ] : [];

  return (
    <Page>
      <PageHeader
        title="Hospitality"
        subtitle="Rooms, bookings and guest revenue."
        actions={caps.write && (
          <>
            <Button variant="outline" size="sm" onClick={() => openForm("room")}><Plus size={14} /> Room</Button>
            <Button size="sm" onClick={() => openForm("booking")}><Plus size={14} /> New booking</Button>
          </>
        )}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={TrendingUp} label={`Revenue · ${range.label}`} value={formatKES(hosp?.income || 0)} trend={hosp?.incomeDelta} tint={C.emerald} />
        <StatCard icon={Coins} label="Net profit" value={formatKES(hosp?.profit || 0)} sub={`${Math.round(hosp?.margin || 0)}% margin`} tint={C.blue} />
        <StatCard icon={BedDouble} label="Occupancy today" value={`${occNow}%`} sub={`avg ${avgOcc}% / 12 weeks`} tint={C.coral} />
        <StatCard icon={CalendarCheck} label="Front desk today" value={`${arrivals} in · ${departures} out`} sub={`${data.rooms.length} rooms`} tint={C.violet} />
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
          <SectionTitle title="Occupancy" subtitle="Avg % of rooms sold, weekly" />
          <BarSeries data={occ} dataKey="rate" color={pal.coral} unit="%" money={false} maxValue={100} height={240} />
        </Card>
      </div>

      <Card>
        <SectionTitle title="Rooms right now" subtitle="Occupied is derived from live bookings" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {rooms.map((r) => (
            <div key={r.id} className="rounded-xl border p-3" style={{ borderColor: C.line, background: C.surface2 }}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold" style={{ color: C.ink }}>Room {r.number}</p>
                <Badge tone={STATE_TONE[r.state]} size="sm">{r.state}</Badge>
              </div>
              <p className="text-xs mt-1" style={{ color: C.muted }}>{r.type} · {formatKES(r.price)}/night</p>
              {r.stay && <p className="text-xs mt-1.5 truncate" style={{ color: C.ink }}>{r.stay.guest} → {formatDateShort(r.stay.checkOut)}</p>}
              {!r.stay && r.arriving && <p className="text-xs mt-1.5 truncate" style={{ color: C.blue }}>Arriving: {r.arriving.guest}</p>}
              {caps.write && r.state !== "Occupied" && (
                <div className="mt-2 flex gap-1">
                  {["Available", "Cleaning", "Maintenance"].filter((s) => s !== r.status).map((s) => (
                    <button
                      key={s}
                      onClick={() => patchRoom(r.id, s)}
                      className="text-[10px] font-semibold px-1.5 py-1 rounded-md transition-colors"
                      style={{ background: C.surface, color: C.muted }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Card padded={false}>
        <div className="p-5 pb-3 flex items-center justify-between flex-wrap gap-3">
          <SectionTitle title="Bookings" />
          <Segmented
            options={[
              { value: "bookings", label: `In range ${bookingsInRange.length}` },
              { value: "all", label: `All ${data.bookings.length}` },
            ]}
            value={tab}
            onChange={setTab}
          />
        </div>
        <div className="px-5 pb-5">
          <DataTable
            columns={bookingColumns}
            rows={tab === "bookings" ? bookingsInRange : data.bookings}
            actions={rowActions}
            exportName={`bookings-${tab}`}
            initialSort={{ key: "checkIn", dir: "desc" }}
            emptyIcon={DoorOpen}
            emptyText="No bookings to show."
          />
        </div>
      </Card>
    </Page>
  );
}
