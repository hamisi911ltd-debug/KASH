/* ============================================================
   Form definitions for every create/edit modal, built from live
   data so selects always show current vehicles, rooms, menu, etc.
   Consumed by <FormModal>; keyed by action id.
   ============================================================ */
import {
  Truck, Wallet, Drumstick, BedDouble, Users, Bell, Car, DoorOpen, UserPlus, BookMarked,
  ArrowLeftRight, MessagesSquare, Wrench, PlayCircle, StopCircle,
} from "lucide-react";
import { TODAY } from "./seed";
import {
  VEHICLE_TYPES, ROOM_TYPES, TRIP_STATUSES, ORDER_STATUSES, BOOKING_STATUSES,
  PAYMENT_STATUSES, PAYMENT_METHODS, EXPENSE_CATEGORIES, DIVISIONS, ROLES,
  DRIVER_STATUSES, VEHICLE_STATUSES, ROOM_STATUSES, PAYMENT_DIRECTIONS,
  divisionOptions,
} from "./constants";
import { capsForRole } from "./auth";
import { daysBetween } from "./format";

const opt = (arr) => arr.map((v) => ({ value: v, label: v }));

export function buildForms(data, session) {
  const vehicleOpts = () => data.vehicles.map((v) => ({ value: v.id, label: `${v.reg} - ${v.model}` }));
  const driverOpts = () => data.drivers.map((d) => ({ value: d.id, label: d.name }));
  const roomOpts = () => data.rooms.map((r) => ({ value: r.id, label: `Room ${r.number} - ${r.type} (KSh ${r.price.toLocaleString()})` }));
  const menuOpts = () => data.menu.filter((m) => m.active).map((m) => ({ value: m.id, label: `${m.name} - KSh ${m.price.toLocaleString()}` }));

  /* A worker (Driver / Chicken Attendant / Hospitality Attendant) messages
     up to their manager/admin, not sideways to every other worker. */
  const myCaps = capsForRole(session?.role);
  const userOpts = () => {
    const pool = data.users.filter((u) => u.name !== session?.name);
    const scoped = myCaps?.writeOwn ? pool.filter((u) => /Manager|Admin/i.test(u.role)) : pool;
    return scoped.map((u) => ({ value: u.name, label: `${u.name} - ${u.role}` }));
  };

  /* A driver logging their own trip doesn't pick a vehicle/driver -
     it's always their own, filled in automatically on submit. */
  const isOwnDriver = session?.role === "Driver" && session?.driverId;
  const myVehicle = isOwnDriver ? data.vehicles.find((v) => v.driverId === session.driverId) : null;

  return {
    /* ---------------- Messaging ---------------- */
    message: {
      key: "message",
      collection: "messages",
      label: "New Message",
      icon: MessagesSquare,
      title: "New message",
      submitLabel: "Send",
      fields: [
        { key: "to", label: "To", type: "select", options: userOpts, required: true },
        { key: "text", label: "Message", type: "textarea", rows: 4, required: true, placeholder: "Type your message..." },
      ],
    },

    /* ---------------- Transport ---------------- */
    trip: {
      key: "trip",
      collection: "trips",
      view: "transport",
      label: "New Trip",
      icon: Truck,
      title: "Log a trip",
      subtitle: "Fare and fuel post straight to the ledger. Drivers use Start/End trip instead - see below.",
      submitLabel: "Add trip",
      notify: { channel: "trips", message: (v) => `Trip logged: ${v.origin} to ${v.destination}`, type: "trip", division: "Transport" },
      fields: [
        { key: "date", label: "Date", type: "date", default: TODAY, required: true },
        { key: "vehicleId", label: "Vehicle", type: "select", options: vehicleOpts, required: true },
        { key: "driverId", label: "Driver", type: "select", options: driverOpts, required: true },
        { key: "origin", label: "Origin", type: "text", default: "Nairobi", required: true },
        { key: "destination", label: "Destination", type: "text", placeholder: "e.g. Kisumu", required: true },
        { key: "client", label: "Client / charter", type: "text", placeholder: "Walk-in" },
        { key: "distanceKm", label: "Distance (km)", type: "number", min: 0, default: "" },
        { key: "amount", label: "Fare received (KSh)", type: "number", min: 0, default: "", required: true },
        { key: "fuelCost", label: "Fuel cost (KSh)", type: "number", min: 0, default: "", hint: "Posted as a Transport expense automatically." },
        { key: "otherCost", label: "Tolls / other (KSh)", type: "number", min: 0, default: "" },
        {
          key: "status", label: "Status", type: "select", options: opt(TRIP_STATUSES), default: "Completed",
          computed: (v) => {
            const net = (Number(v.amount) || 0) - (Number(v.fuelCost) || 0) - (Number(v.otherCost) || 0);
            return `Net KSh ${net.toLocaleString()}`;
          },
        },
      ],
    },
    /* Uber-style two-step logging for a driver's own trips: start with
       just a pickup, end with the drop-off and what the app/customer
       actually paid. Both post to the same "trips" collection as the
       full manual "trip" form above - just entered in two moves instead
       of one, and only ever touching the driver's own record. */
    startTrip: {
      key: "startTrip",
      collection: "trips",
      view: "transport",
      label: "Start Trip",
      icon: PlayCircle,
      title: "Start a trip",
      subtitle: myVehicle ? `Logged against your vehicle, ${myVehicle.reg}.` : "Where are you picking up from?",
      submitLabel: "Start trip",
      ownAllowed: true,
      autofillFor: (s, d) => {
        if (s?.role !== "Driver" || !s?.driverId) return {};
        const veh = d.vehicles.find((v) => v.driverId === s.driverId);
        return { driverId: s.driverId, vehicleId: veh?.id, status: "In Transit", destination: "", amount: 0 };
      },
      fields: [
        { key: "origin", label: "Pickup location", type: "text", default: "Nairobi", required: true },
        { key: "client", label: "Client / passenger", type: "text", placeholder: "Walk-in / Uber app" },
      ],
    },
    endTrip: {
      key: "endTrip",
      collection: "trips",
      view: "transport",
      label: "End Trip",
      icon: StopCircle,
      title: "End trip",
      editTitle: "End trip",
      subtitle: "Enter where you dropped off and what the app or customer paid.",
      submitLabel: "End trip",
      editSubmitLabel: "End trip",
      ownAllowed: true,
      autofillFor: () => ({ status: "Completed" }),
      fields: [
        { key: "destination", label: "Drop-off location", type: "text", placeholder: "e.g. Westlands", required: true },
        { key: "amount", label: "Amount received (KSh)", type: "number", min: 0, required: true },
        { key: "distanceKm", label: "Distance (km)", type: "number", min: 0, default: "" },
        { key: "fuelCost", label: "Fuel cost (KSh)", type: "number", min: 0, default: "", hint: "Posted as a Transport expense automatically." },
      ],
    },
    maintenance: {
      key: "maintenance",
      collection: "maintenance",
      view: "transport",
      label: "Log Maintenance",
      icon: Wrench,
      title: "Log maintenance",
      subtitle: myVehicle ? `Logged against your vehicle, ${myVehicle.reg}.` : "Keeps the fleet's service history and books in sync.",
      submitLabel: "Log maintenance",
      ownAllowed: true,
      autofillFor: (s, d) => {
        if (s?.role !== "Driver" || !s?.driverId) return {};
        const veh = d.vehicles.find((v) => v.driverId === s.driverId);
        return { vehicleId: veh?.id };
      },
      fields: [
        { key: "date", label: "Date", type: "date", default: TODAY, required: true },
        ...(isOwnDriver ? [] : [{ key: "vehicleId", label: "Vehicle", type: "select", options: vehicleOpts, required: true }]),
        { key: "category", label: "Type", type: "select", options: opt(["Service", "Repair", "Tyres", "Inspection", "Other"]) },
        { key: "description", label: "What was done?", type: "text", placeholder: "e.g. Brake pads replaced", required: true },
        { key: "cost", label: "Cost (KSh)", type: "number", min: 0, required: true, hint: "Posted as a Transport expense automatically." },
      ],
    },
    vehicle: {
      key: "vehicle",
      collection: "vehicles",
      view: "transport",
      label: "Add Vehicle",
      icon: Car,
      title: "Add a vehicle",
      submitLabel: "Add vehicle",
      fields: [
        { key: "reg", label: "Plate number", type: "text", placeholder: "KDE 100X", required: true },
        { key: "type", label: "Type", type: "select", options: opt(VEHICLE_TYPES) },
        { key: "model", label: "Make / model", type: "text", placeholder: "Toyota Hiace", required: true },
        { key: "driverId", label: "Assigned driver", type: "select", options: () => [{ value: "", label: "Unassigned" }, ...driverOpts()] },
        { key: "capacity", label: "Capacity (seats)", type: "number", min: 0, default: "" },
        { key: "mileage", label: "Odometer (km)", type: "number", min: 0, default: "" },
        { key: "serviceDueKm", label: "Next service at (km)", type: "number", min: 0, default: "" },
        { key: "insuranceExpiry", label: "Insurance expires", type: "date", default: "" },
        { key: "gpsId", label: "GPS tracker ID", type: "text", placeholder: "Leave blank if not fitted" },
        { key: "status", label: "Status", type: "select", options: opt(VEHICLE_STATUSES) },
      ],
    },
    driver: {
      key: "driver",
      collection: "drivers",
      view: "transport",
      label: "Add Driver",
      icon: UserPlus,
      title: "Add a driver",
      submitLabel: "Add driver",
      fields: [
        { key: "name", label: "Full name", type: "text", required: true },
        { key: "idNumber", label: "ID number", type: "text", placeholder: "e.g. 23456789" },
        { key: "licence", label: "Driving licence no.", type: "text", placeholder: "DL-000000" },
        { key: "phone", label: "Phone", type: "tel", placeholder: "+254 7..", required: true },
        { key: "email", label: "Email", type: "email", placeholder: "e.g. name@gmail.com" },
        { key: "nextOfKin", label: "Next of kin phone", type: "tel", placeholder: "+254 7.." },
        { key: "status", label: "Status", type: "select", options: opt(DRIVER_STATUSES) },
        { key: "rating", label: "Rating (1-5)", type: "number", min: 0, step: "0.1", default: "4.5" },
        { key: "hiredOn", label: "Hired on", type: "date", default: TODAY },
      ],
    },

    /* ---------------- Food ---------------- */
    order: {
      key: "order",
      collection: "orders",
      view: "food",
      label: "New Order",
      icon: Drumstick,
      title: "Take an order",
      subtitle: "Pick a product and quantity - the total fills in.",
      submitLabel: "Add order",
      ownAllowed: true,
      notify: { channel: "orders", message: (v) => `New order from ${v.customer || "walk-in"}`, type: "order", division: "Food" },
      fields: [
        { key: "date", label: "Date", type: "date", default: TODAY, required: true },
        { key: "customer", label: "Customer name", type: "text", placeholder: "Leave blank for a walk-in / cash sale" },
        { key: "channel", label: "Channel", type: "select", options: opt(["Walk-in", "Phone", "WhatsApp", "Online", "Wholesale"]) },
        { key: "menuItemId", label: "Product", type: "select", options: menuOpts, required: true },
        { key: "qty", label: "Quantity", type: "number", min: 1, default: "1", required: true },
        {
          key: "amount", label: "Amount (KSh)", type: "number", min: 0, default: "",
          hint: "Leave blank to use menu price x quantity.",
          computed: (v) => {
            const item = data.menu.find((m) => m.id === v.menuItemId);
            const total = Number(v.amount) || (item ? item.price * (Number(v.qty) || 1) : 0);
            return `KSh ${total.toLocaleString()}`;
          },
        },
        { key: "paymentStatus", label: "Payment", type: "select", options: opt(PAYMENT_STATUSES), default: "Paid" },
        { key: "orderStatus", label: "Order status", type: "select", options: opt(ORDER_STATUSES), default: "Preparing" },
      ],
    },
    menuItem: {
      key: "menuItem",
      collection: "menu",
      view: "food",
      label: "Add Product",
      icon: BookMarked,
      title: "Add a product",
      submitLabel: "Add product",
      fields: [
        { key: "name", label: "Name", type: "text", placeholder: "e.g. Whole chicken (broiler)", required: true },
        { key: "category", label: "Category", type: "select", options: opt(["Whole birds", "Cuts", "Eggs", "Wholesale", "Live birds"]) },
        { key: "price", label: "Selling price (KSh)", type: "number", min: 0, required: true },
        {
          key: "cost", label: "Cost price (KSh)", type: "number", min: 0,
          computed: (v) => {
            const margin = (Number(v.price) || 0) - (Number(v.cost) || 0);
            const pct = v.price ? Math.round((margin / Number(v.price)) * 100) : 0;
            return `${pct}% margin`;
          },
        },
        { key: "active", label: "In stock", type: "toggle", default: true },
      ],
    },

    /* ---------------- Hospitality ---------------- */
    booking: {
      key: "booking",
      collection: "bookings",
      view: "hospitality",
      label: "New Booking",
      icon: BedDouble,
      title: "Create a booking",
      subtitle: "Nightly rate x nights fills the amount automatically.",
      submitLabel: "Add booking",
      ownAllowed: true,
      notify: { channel: "bookings", message: (v) => `New booking: ${v.guest}`, type: "booking", division: "Hospitality" },
      fields: [
        { key: "guest", label: "Guest name", type: "text", required: true },
        { key: "roomId", label: "Room", type: "select", options: roomOpts, required: true },
        { key: "checkIn", label: "Check-in", type: "date", default: TODAY, required: true },
        {
          key: "checkOut", label: "Check-out", type: "date", default: TODAY, required: true,
          validate: (v, all) => (v && all.checkIn && v <= all.checkIn ? "Must be after check-in" : null),
          computed: (v) => {
            const n = daysBetween(v.checkIn ?? "", v.checkOut ?? "");
            return n ? `${n} night${n === 1 ? "" : "s"}` : "";
          },
        },
        { key: "guests", label: "Guests", type: "number", min: 1, default: "1" },
        { key: "source", label: "Source", type: "select", options: opt(["Direct", "Booking.com", "Walk-in", "Corporate", "Agent"]) },
        {
          key: "amount", label: "Amount (KSh)", type: "number", min: 0, default: "",
          hint: "Blank = room rate x nights.",
          computed: (v) => {
            const room = data.rooms.find((r) => r.id === v.roomId);
            const nights = Math.max(1, daysBetween(v.checkIn ?? "", v.checkOut ?? "") || 1);
            const total = Number(v.amount) || (room ? room.price * nights : 0);
            return `KSh ${total.toLocaleString()}`;
          },
        },
        { key: "paymentStatus", label: "Payment", type: "select", options: opt(PAYMENT_STATUSES), default: "Pending" },
        { key: "status", label: "Status", type: "select", options: opt(BOOKING_STATUSES), default: "Confirmed" },
      ],
    },
    room: {
      key: "room",
      collection: "rooms",
      view: "hospitality",
      label: "Add Room",
      icon: DoorOpen,
      title: "Add a room",
      submitLabel: "Add room",
      fields: [
        { key: "number", label: "Room number", type: "text", required: true },
        { key: "property", label: "House / property", type: "text", placeholder: "e.g. Riverside House", default: "Main House" },
        { key: "type", label: "Type", type: "select", options: opt(ROOM_TYPES) },
        { key: "floor", label: "Floor", type: "number", min: 0, default: "1" },
        { key: "price", label: "Rate per night (KSh)", type: "number", min: 0, required: true },
        { key: "status", label: "Housekeeping status", type: "select", options: opt(ROOM_STATUSES) },
      ],
    },

    /* ---------------- Finance ---------------- */
    expense: {
      key: "expense",
      collection: "expenses",
      label: "New Expense",
      icon: Wallet,
      title: "Record an expense",
      submitLabel: "Add expense",
      notify: { channel: "expenses", message: (v) => `Expense logged: ${v.category} - KSh ${Number(v.amount || 0).toLocaleString()}`, type: "expense", division: "General" },
      fields: [
        { key: "date", label: "Date", type: "date", default: TODAY, required: true },
        { key: "division", label: "Division", type: "select", options: divisionOptions() },
        { key: "category", label: "Category", type: "select", options: opt(EXPENSE_CATEGORIES) },
        { key: "vendor", label: "Paid to", type: "text", placeholder: "Vendor / payee" },
        { key: "amount", label: "Amount (KSh)", type: "number", min: 0, required: true },
        { key: "method", label: "Method", type: "select", options: opt(PAYMENT_METHODS) },
        { key: "notes", label: "Notes", type: "textarea", placeholder: "What was this for?" },
      ],
    },

    /* ---------------- Payments (any worker) ---------------- */
    payment: {
      key: "payment",
      collection: "payments",
      label: "Record Payment",
      icon: ArrowLeftRight,
      title: "Record a payment",
      subtitle: "Money you paid out or money you received. It goes straight into the books.",
      submitLabel: "Record payment",
      notify: {
        channel: "expenses",
        message: (v) =>
          v.direction === "in"
            ? `Payment received from ${v.party || "customer"} - KSh ${Number(v.amount || 0).toLocaleString()}`
            : `Payment sent to ${v.party || "supplier"} - KSh ${Number(v.amount || 0).toLocaleString()}`,
        type: "payment",
        division: "General",
      },
      fields: [
        { key: "direction", label: "Type", type: "select", options: PAYMENT_DIRECTIONS, default: "out" },
        { key: "date", label: "Date", type: "date", default: TODAY, required: true },
        {
          key: "party",
          label: "Paid to / received from",
          type: "text",
          placeholder: "e.g. Kenchic Ltd",
          required: true,
        },
        {
          key: "amount",
          label: "Amount (KSh)",
          type: "number",
          min: 0,
          required: true,
          computed: (v) => `KSh ${(Number(v.amount) || 0).toLocaleString()}`,
        },
        { key: "division", label: "Which service?", type: "select", options: divisionOptions() },
        {
          key: "category",
          label: "What for?",
          type: "select",
          options: opt(EXPENSE_CATEGORIES),
          visibleIf: (v) => v.direction === "out",
        },
        { key: "method", label: "How?", type: "select", options: opt(PAYMENT_METHODS), default: "M-Pesa" },
        {
          key: "phone",
          label: "M-Pesa number",
          type: "tel",
          placeholder: "+254 7..",
          visibleIf: (v) => v.method === "M-Pesa",
          hint: "A payment prompt is sent to this number.",
          validate: (v, all) =>
            all.method === "M-Pesa" && !String(v || "").trim() ? "Enter the M-Pesa number" : null,
        },
        { key: "reference", label: "Reference", type: "text", placeholder: "Invoice / receipt no." },
        { key: "notes", label: "Notes", type: "textarea" },
      ],
    },

    /* ---------------- Admin ---------------- */
    user: {
      key: "user",
      collection: "users",
      label: "Add User",
      icon: Users,
      title: "Invite a user",
      submitLabel: "Send invite",
      fields: [
        { key: "name", label: "Full name", type: "text", required: true },
        { key: "email", label: "Work email", type: "email", required: true },
        { key: "role", label: "Role", type: "select", options: opt(ROLES) },
        { key: "division", label: "Division", type: "select", options: divisionOptions(["All", ...DIVISIONS.filter((d) => d !== "General")]) },
        { key: "status", label: "Status", type: "select", options: opt(["Invited", "Active", "Suspended"]), default: "Invited" },
      ],
    },
    reminder: {
      key: "reminder",
      collection: "reminders",
      label: "Add Reminder",
      icon: Bell,
      title: "Add a reminder",
      submitLabel: "Add reminder",
      fields: [
        { key: "title", label: "What needs doing?", type: "text", required: true },
        { key: "due", label: "Due date", type: "date", default: TODAY, required: true },
        { key: "division", label: "Division", type: "select", options: divisionOptions() },
        { key: "priority", label: "Priority", type: "select", options: opt(["Low", "Normal", "High"]), default: "Normal" },
      ],
    },
  };
}

/** The subset shown in the top bar's quick-create menu and command palette. */
export const QUICK_ACTION_KEYS = ["payment", "message", "trip", "startTrip", "maintenance", "order", "booking", "expense", "reminder", "vehicle", "room", "user"];
