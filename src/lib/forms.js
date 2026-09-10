/* ============================================================
   Form definitions for every create/edit modal, built from live
   data so selects always show current vehicles, rooms, menu, etc.
   Consumed by <FormModal>; keyed by action id.
   ============================================================ */
import {
  Truck, Wallet, UtensilsCrossed, BedDouble, Users, Bell, Car, DoorOpen, UserPlus, BookMarked,
  ArrowLeftRight,
} from "lucide-react";
import { TODAY } from "./seed";
import {
  VEHICLE_TYPES, ROOM_TYPES, TRIP_STATUSES, ORDER_STATUSES, BOOKING_STATUSES,
  PAYMENT_STATUSES, PAYMENT_METHODS, EXPENSE_CATEGORIES, DIVISIONS, ROLES,
  DRIVER_STATUSES, VEHICLE_STATUSES, ROOM_STATUSES, PAYMENT_DIRECTIONS,
} from "./constants";
import { daysBetween } from "./format";

const opt = (arr) => arr.map((v) => ({ value: v, label: v }));

export function buildForms(data) {
  const vehicleOpts = () => data.vehicles.map((v) => ({ value: v.id, label: `${v.reg} - ${v.model}` }));
  const driverOpts = () => data.drivers.map((d) => ({ value: d.id, label: d.name }));
  const roomOpts = () => data.rooms.map((r) => ({ value: r.id, label: `Room ${r.number} - ${r.type} (KSh ${r.price.toLocaleString()})` }));
  const menuOpts = () => data.menu.filter((m) => m.active).map((m) => ({ value: m.id, label: `${m.name} - KSh ${m.price.toLocaleString()}` }));

  return {
    /* ---------------- Transport ---------------- */
    trip: {
      key: "trip",
      collection: "trips",
      label: "New Trip",
      icon: Truck,
      title: "Log a trip",
      subtitle: "Fare and fuel post straight to the ledger.",
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
    vehicle: {
      key: "vehicle",
      collection: "vehicles",
      label: "Add Vehicle",
      icon: Car,
      title: "Add a vehicle",
      submitLabel: "Add vehicle",
      fields: [
        { key: "reg", label: "Registration", type: "text", placeholder: "KDE 100X", required: true },
        { key: "type", label: "Type", type: "select", options: opt(VEHICLE_TYPES) },
        { key: "model", label: "Make / model", type: "text", placeholder: "Toyota Hiace", required: true },
        { key: "driverId", label: "Assigned driver", type: "select", options: () => [{ value: "", label: "Unassigned" }, ...driverOpts()] },
        { key: "capacity", label: "Capacity (seats)", type: "number", min: 0, default: "" },
        { key: "mileage", label: "Odometer (km)", type: "number", min: 0, default: "" },
        { key: "serviceDueKm", label: "Next service at (km)", type: "number", min: 0, default: "" },
        { key: "insuranceExpiry", label: "Insurance expires", type: "date", default: "" },
        { key: "status", label: "Status", type: "select", options: opt(VEHICLE_STATUSES) },
      ],
    },
    driver: {
      key: "driver",
      collection: "drivers",
      label: "Add Driver",
      icon: UserPlus,
      title: "Add a driver",
      submitLabel: "Add driver",
      fields: [
        { key: "name", label: "Full name", type: "text", required: true },
        { key: "phone", label: "Phone", type: "tel", placeholder: "+254 7..", required: true },
        { key: "licence", label: "Licence no.", type: "text", placeholder: "DL-000000" },
        { key: "status", label: "Status", type: "select", options: opt(DRIVER_STATUSES) },
        { key: "rating", label: "Rating (1-5)", type: "number", min: 0, step: "0.1", default: "4.5" },
        { key: "hiredOn", label: "Hired on", type: "date", default: TODAY },
      ],
    },

    /* ---------------- Food ---------------- */
    order: {
      key: "order",
      collection: "orders",
      label: "New Order",
      icon: UtensilsCrossed,
      title: "Take an order",
      subtitle: "Pick a menu item and quantity - the total fills in.",
      submitLabel: "Add order",
      notify: { channel: "orders", message: (v) => `New order from ${v.customer || "walk-in"}`, type: "order", division: "Food" },
      fields: [
        { key: "date", label: "Date", type: "date", default: TODAY, required: true },
        { key: "customer", label: "Customer", type: "text", placeholder: "Walk-in customer", required: true },
        { key: "channel", label: "Channel", type: "select", options: opt(["Walk-in", "Phone", "WhatsApp", "Online", "Corporate"]) },
        { key: "menuItemId", label: "Menu item", type: "select", options: menuOpts, required: true },
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
      label: "Add Menu Item",
      icon: BookMarked,
      title: "Add a menu item",
      submitLabel: "Add item",
      fields: [
        { key: "name", label: "Name", type: "text", required: true },
        { key: "category", label: "Category", type: "select", options: opt(["Mains", "Grill", "Trays", "Corporate", "Events", "Drinks", "Sides"]) },
        { key: "price", label: "Selling price (KSh)", type: "number", min: 0, required: true },
        {
          key: "cost", label: "Food cost (KSh)", type: "number", min: 0,
          computed: (v) => {
            const margin = (Number(v.price) || 0) - (Number(v.cost) || 0);
            const pct = v.price ? Math.round((margin / Number(v.price)) * 100) : 0;
            return `${pct}% margin`;
          },
        },
        { key: "active", label: "Available", type: "toggle", default: true },
      ],
    },

    /* ---------------- Hospitality ---------------- */
    booking: {
      key: "booking",
      collection: "bookings",
      label: "New Booking",
      icon: BedDouble,
      title: "Create a booking",
      subtitle: "Nightly rate x nights fills the amount automatically.",
      submitLabel: "Add booking",
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
      label: "Add Room",
      icon: DoorOpen,
      title: "Add a room",
      submitLabel: "Add room",
      fields: [
        { key: "number", label: "Room number", type: "text", required: true },
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
        { key: "division", label: "Division", type: "select", options: opt(DIVISIONS) },
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
          placeholder: "e.g. Karim Butchery",
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
        { key: "division", label: "Which service?", type: "select", options: opt(DIVISIONS) },
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
        { key: "reference", label: "Reference (optional)", type: "text", placeholder: "Invoice / receipt no." },
        { key: "notes", label: "Notes (optional)", type: "textarea" },
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
        { key: "division", label: "Division", type: "select", options: opt(["All", ...DIVISIONS.filter((d) => d !== "General")]) },
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
        { key: "division", label: "Division", type: "select", options: opt(DIVISIONS) },
        { key: "priority", label: "Priority", type: "select", options: opt(["Low", "Normal", "High"]), default: "Normal" },
      ],
    },
  };
}

/** The subset shown in the top bar's quick-create menu and command palette. */
export const QUICK_ACTION_KEYS = ["payment", "trip", "order", "booking", "expense", "reminder", "vehicle", "room", "user"];
