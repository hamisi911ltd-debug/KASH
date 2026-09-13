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

export const COLLECTIONS = [
  "drivers", "vehicles", "trips", "menu", "orders",
  "rooms", "bookings", "expenses", "payments", "users", "reminders", "messages", "notifications",
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
    return {
      date: v.date || TODAY,
      customer: (v.customer || "").trim(),
      channel: v.channel || "Walk-in",
      menuItemId: v.menuItemId || "",
      item: (v.item || menuItem?.name || "").trim(),
      qty,
      unitPrice,
      amount: num(v.amount) || unitPrice * qty,
      cost: num(v.cost) || (menuItem ? menuItem.cost * qty : 0),
      paymentStatus: v.paymentStatus || "Pending",
      orderStatus: v.orderStatus || "Preparing",
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
};

export const ID_PREFIX = {
  trips: "t", vehicles: "v", drivers: "d", orders: "o", menu: "m",
  rooms: "r", bookings: "b", expenses: "e", payments: "pay", users: "u", reminders: "rem", messages: "msg", notifications: "n",
};

/* Human labels used in toasts and confirmation copy. */
export const SINGULAR = {
  trips: "Trip", vehicles: "Vehicle", drivers: "Driver", orders: "Order", menu: "Menu item",
  rooms: "Room", bookings: "Booking", expenses: "Expense", payments: "Payment", users: "User", reminders: "Reminder", messages: "Message",
};
