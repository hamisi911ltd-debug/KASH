/* ============================================================
   The shape of every record in KASH: which collections exist, how a
   raw form submission is normalised into a clean record, and the id
   prefix/singular label for each. Pure JS, no React/DOM - this is
   imported by both the browser build (store.jsx) and the Worker
   backend (worker/src/index.js), so client and server never disagree
   about what a valid record looks like.
   ============================================================ */
import { TODAY } from "./seed.js";
import { daysBetween, toISODate } from "./format.js";
import { needsApproval } from "./constants.js";

export const COLLECTIONS = [
  "drivers", "vehicles", "trips", "maintenance", "menu", "orders",
  "rooms", "bookings", "expenses", "payments", "users", "reminders", "messages", "notifications",
  // Append-only: written only by the /approve endpoint (worker/src/index.js),
  // never through the generic collection routes. See docs/APPROVALS.md.
  "approvals",
  // What a division Manager publishes about their department on the public
  // marketing site (kash-suppliers...) - see WebsiteView.jsx and the
  // worker's GET /api/public/listings.
  "listings",
];

const num = (v) => (v === "" || v == null ? 0 : Number(v) || 0);

export const normalisers = {
  trips: (v) => ({
    date: v.date || TODAY,
    vehicleId: v.vehicleId || "",
    driverId: v.driverId || "",
    origin: (v.origin || "").trim(),
    destination: (v.destination || "").trim(),
    distanceKm: num(v.distanceKm),
    client: (v.client || "").trim(),
    amount: num(v.amount),
    fuelCost: num(v.fuelCost),
    otherCost: num(v.otherCost),
    status: v.status || "Scheduled",
  }),
  vehicles: (v) => ({
    reg: (v.reg || "").trim().toUpperCase(),
    type: v.type || "Van",
    model: (v.model || "").trim(),
    driverId: v.driverId || "",
    status: v.status || "Active",
    mileage: num(v.mileage),
    serviceDueKm: num(v.serviceDueKm),
    insuranceExpiry: v.insuranceExpiry || "",
    gpsId: (v.gpsId || "").trim(),
    capacity: num(v.capacity),
  }),
  maintenance: (v) => ({
    date: v.date || TODAY,
    vehicleId: v.vehicleId || "",
    category: v.category || "Service",
    description: (v.description || "").trim(),
    cost: num(v.cost),
  }),
  drivers: (v) => ({
    name: (v.name || "").trim(),
    idNumber: (v.idNumber || "").trim(),
    phone: (v.phone || "").trim(),
    email: (v.email || "").trim().toLowerCase(),
    licence: (v.licence || "").trim(),
    nextOfKin: (v.nextOfKin || "").trim(),
    status: v.status || "On Duty",
    rating: num(v.rating) || 4.5,
    hiredOn: v.hiredOn || TODAY,
  }),
  orders: (v, data) => {
    const menuItem = (data.menu || []).find((m) => m.id === v.menuItemId);
    const qty = num(v.qty) || 1;
    const unitPrice = num(v.unitPrice) || menuItem?.price || 0;
    const amount = num(v.amount) || unitPrice * qty;
    return {
      date: v.date || TODAY,
      customer: (v.customer || "").trim(),
      channel: v.channel || "Walk-in",
      menuItemId: v.menuItemId || "",
      item: (v.item || menuItem?.name || "").trim(),
      qty,
      unitPrice,
      amount,
      cost: num(v.cost) || (menuItem ? menuItem.cost * qty : 0),
      paymentStatus: v.paymentStatus || "Pending",
      orderStatus: v.orderStatus || "Preparing",
      // A "big" order (see APPROVAL_THRESHOLDS) starts life needing a
      // Manager/Admin/Director/Super Admin's sign-off. Once decided,
      // v.approval carries that decision forward untouched.
      approval: v.approval || (needsApproval("orders", amount) ? { status: "Pending" } : null),
    };
  },
  menu: (v) => ({
    name: (v.name || "").trim(),
    category: v.category || "Mains",
    price: num(v.price),
    cost: num(v.cost),
    active: v.active === false || v.active === "false" ? false : true,
  }),
  rooms: (v) => ({
    number: (v.number || "").trim(),
    property: (v.property || "").trim() || "Main House",
    type: v.type || "Standard",
    price: num(v.price),
    status: v.status || "Available",
    floor: num(v.floor) || 1,
  }),
  bookings: (v, data) => {
    const room = (data.rooms || []).find((r) => r.id === v.roomId);
    const nights = Math.max(1, daysBetween(v.checkIn, v.checkOut) || 1);
    const amount = num(v.amount) || (room ? room.price * nights : 0);
    const paymentStatus = v.paymentStatus || "Pending";
    return {
      guest: (v.guest || "").trim(),
      guestPhone: (v.guestPhone || "").trim(),
      roomId: v.roomId || "",
      checkIn: v.checkIn || TODAY,
      checkOut: v.checkOut || toISODate(new Date()),
      nights,
      guests: num(v.guests) || 1,
      source: v.source || "Direct",
      amount,
      paid: paymentStatus === "Paid" ? amount : paymentStatus === "Partial" ? num(v.paid) || Math.round(amount / 2) : 0,
      paymentStatus,
      status: v.status || "Confirmed",
    };
  },
  payments: (v) => {
    const direction = v.direction === "in" ? "in" : "out";
    return {
      date: v.date || TODAY,
      direction,
      amount: num(v.amount),
      party: (v.party || "").trim(),
      division: v.division || "General",
      category: direction === "out" ? (v.category || "Other") : "Payment received",
      method: v.method || "M-Pesa",
      phone: (v.phone || "").trim(),
      reference: (v.reference || "").trim(),
      notes: (v.notes || "").trim(),
      status: v.status || "Recorded",
      createdBy: v.createdBy || "",
    };
  },
  expenses: (v) => ({
    date: v.date || TODAY,
    division: v.division || "General",
    category: v.category || "Other",
    vendor: (v.vendor || "").trim(),
    amount: num(v.amount),
    method: v.method || "M-Pesa",
    notes: (v.notes || "").trim(),
    source: "manual",
    // See the matching comment on the orders normaliser above.
    approval: v.approval || (needsApproval("expenses", num(v.amount)) ? { status: "Pending" } : null),
  }),
  users: (v) => ({
    name: (v.name || "").trim(),
    email: (v.email || "").trim().toLowerCase(),
    phone: (v.phone || "").trim(),
    role: v.role || "Staff",
    division: v.division || "All",
    driverId: v.driverId || "",
    status: v.status || "Invited",
    lastActive: v.lastActive || null,
  }),
  messages: (v) => ({
    from: (v.from || "").trim(),
    to: (v.to || "").trim(),
    text: (v.text || "").trim(),
    ts: v.ts || new Date().toISOString(),
    read: v.read === undefined ? false : !!v.read,
  }),
  reminders: (v) => ({
    title: (v.title || "").trim(),
    due: v.due || TODAY,
    division: v.division || "General",
    priority: v.priority || "Normal",
    done: !!v.done,
  }),
  listings: (v) => ({
    division: v.division || "Transport",
    title: (v.title || "").trim(),
    description: (v.description || "").trim(),
    price: num(v.price),
    // Free-form, so it fits whatever the division needs to say (beds/baths
    // for a property, kg/piece for a product, capacity for a vehicle)
    // without a different rigid schema per division.
    meta: (v.meta || "").trim(),
    // Only ever an http(s) link - never trust this as HTML, and never
    // resolve a bare/relative path someone pasted in by mistake.
    imageUrl: /^https?:\/\//.test(String(v.imageUrl || "").trim()) ? v.imageUrl.trim() : "",
    active: v.active === false || v.active === "false" ? false : true,
  }),
};

export const ID_PREFIX = {
  trips: "t", vehicles: "v", drivers: "d", maintenance: "mx", orders: "o", menu: "m",
  rooms: "r", bookings: "b", expenses: "e", payments: "pay", users: "u", reminders: "rem", messages: "msg", notifications: "n",
  approvals: "ap", listings: "li",
};

/* Human labels used in toasts and confirmation copy. */
export const SINGULAR = {
  trips: "Trip", vehicles: "Vehicle", drivers: "Driver", maintenance: "Maintenance record", orders: "Order", menu: "Menu item",
  rooms: "Room", bookings: "Booking", expenses: "Expense", payments: "Payment", users: "User", reminders: "Reminder", messages: "Message",
  listings: "Website listing",
};
