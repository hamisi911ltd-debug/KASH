/* Hospitality division: rooms, bookings, occupancy and guest revenue.
   Room "Occupied" state is derived from bookings, never set by hand.
   A Hospitality Attendant sees the same front-desk view (they need
   the full guest list to do their job) but no company money figures -
   those stay an Admin/Manager concern. */
import React, { useMemo, useState } from "react";
import { Plus, BedDouble, ArrowDownRight, ArrowUpRight, CalendarCheck, Pencil, Trash2, DoorOpen, LogIn, LogOut, Smartphone } from "lucide-react";
import { C } from "../lib/constants";
import { formatKES, formatDateShort } from "../lib/format";
import {
  resolvePeriod, computeMetrics, weeklyOccupancy, occupancyRate,
  roomStates, inRange, CANCELLED,
} from "../lib/derive";
import { TODAY } from "../lib/seed";
import { useStore } from "../lib/store.jsx";
import { useActions } from "../lib/actions.jsx";
import { Card, StatCard, SectionTitle, Badge, Button, Segmented } from "../components/ui.jsx";
import DataTable from "../components/DataTable.jsx";
import FilterBar, { selectFilter } from "../components/FilterBar.jsx";
import { PageHeader, Page } from "../components/Page.jsx";
import { statusTone, BOOKING_STATUSES, PAYMENT_STATUSES, ROOM_TYPES } from "../lib/constants";

const STATE_TONE = { Occupied: "blue", Available: "emerald", Cleaning: "amber", Maintenance: "coral" };

export default function HospitalityView() {
  const { data, prefs } = useStore();
  const { openForm, editRecord, deleteRecord, patchRoom, caps } = useActions();
  const restricted = !caps.write; // a Hospitality Attendant logs bookings but doesn't see company money figures
  const [tab, setTab] = useState("bookings");
  const [q, setQ] = useState("");
  const [bStatus, setBStatus] = useState("All");
  const [pStatus, setPStatus] = useState("All");
  const [roomType, setRoomType] = useState("All");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const range = useMemo(() => resolvePeriod(prefs.period, prefs.customRange, new Date(TODAY)), [prefs]);
  const m = useMemo(() => computeMetrics(data, range), [data, range]);
  const hosp = m.byDivision.find((d) => d.division === "Hospitality");

  const bookingsInRange = useMemo(
    () => data.bookings.filter((b) => inRange(b.checkIn, range.from, range.to) || (b.checkIn <= range.to && b.checkOut >= range.from)),
    [data.bookings, range]
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

  const bookingActions = caps.payments ? [
    {
      label: "Collect payment", icon: Smartphone,
      hidden: (r) => r.paymentStatus === "Paid",
      onClick: (r) => openForm("payment", { direction: "in", division: "Hospitality", party: r.guest, amount: r.amount, method: "M-Pesa" }),
    },
    ...rowActions,
  ] : rowActions;

  return (
    <Page>
      <PageHeader
        title="Hospitality"
        subtitle={restricted ? "Rooms and bookings." : "Rooms, bookings and guest revenue."}
        actions={(caps.write || caps.writeOwn) && (
          <>
            {caps.write && <Button variant="outline" size="sm" onClick={() => openForm("room")}><Plus size={14} /> Room</Button>}
            <Button size="sm" onClick={() => openForm("booking")}><Plus size={14} /> New booking</Button>
          </>
        )}
      />

      <div className={`grid grid-cols-2 ${restricted ? "sm:grid-cols-2 max-w-md" : "lg:grid-cols-4"} gap-2.5 sm:gap-3.5`}>
        {!restricted && <StatCard icon={ArrowDownRight} label={`Money in · ${range.label}`} value={formatKES(hosp?.income || 0)} trend={hosp?.incomeDelta} tint={C.emerald} />}
        {!restricted && <StatCard icon={ArrowUpRight} label="Money out" value={formatKES(hosp?.expense || 0)} tint={C.coral} />}
        <StatCard icon={BedDouble} label="Occupancy today" value={`${occNow}%`} sub={`avg ${avgOcc}% / 12 weeks`} tint={C.blue} />
        <StatCard icon={CalendarCheck} label="Front desk today" value={`${arrivals} in · ${departures} out`} sub={`${data.rooms.length} rooms`} tint={C.violet} />
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
        <div className="p-4 sm:p-5 pb-3 flex items-center justify-between flex-wrap gap-3">
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
        <div className="px-3 sm:px-5 pb-5">
          {(() => {
            const ql = q.trim().toLowerCase();
            const base = tab === "bookings" ? bookingsInRange : data.bookings;
            const rows = base
              .filter((b) => bStatus === "All" || b.status === bStatus)
              .filter((b) => pStatus === "All" || b.paymentStatus === pStatus)
              .filter((b) => roomType === "All" || (data.rooms.find((r) => r.id === b.roomId)?.type === roomType))
              .filter((b) => (!from || b.checkIn >= from) && (!to || b.checkIn <= to))
              .filter((b) => !ql || `${b.guest} ${b.source || ""}`.toLowerCase().includes(ql));
            const dirty = ql || bStatus !== "All" || pStatus !== "All" || roomType !== "All" || from || to;
            return (
              <>
                <FilterBar
                  search={{ value: q, onChange: setQ, placeholder: "Guest or source..." }}
                  selects={[
                    selectFilter("bs", "Status", BOOKING_STATUSES, bStatus, setBStatus),
                    selectFilter("ps", "Payment", PAYMENT_STATUSES, pStatus, setPStatus),
                    selectFilter("rt", "Room type", ROOM_TYPES, roomType, setRoomType),
                  ]}
                  range={{ from, to, onFrom: setFrom, onTo: setTo }}
                  dirty={!!dirty}
                  onClear={() => { setQ(""); setBStatus("All"); setPStatus("All"); setRoomType("All"); setFrom(""); setTo(""); }}
                />
                <DataTable
                  columns={bookingColumns}
                  rows={rows}
                  actions={bookingActions}
                  exportName={`kash-bookings-${tab}`}
                  initialSort={{ key: "checkIn", dir: "desc" }}
                  emptyIcon={DoorOpen}
                  emptyText="No bookings match these filters."
                />
              </>
            );
          })()}
        </div>
      </Card>
    </Page>
  );
}
