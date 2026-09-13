/* ============================================================
   Demo dataset. Generated across ~120 days ending today so every
   period filter, trend delta and chart has real history behind it.
   Deterministic (seeded PRNG) => the same demo on every first load.
   ============================================================ */
import { toISODate, addDays, genId } from "./format";

function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rnd = mulberry32(20260910);
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const between = (min, max) => Math.round(min + rnd() * (max - min));
const chance = (p) => rnd() < p;
const round50 = (n) => Math.round(n / 50) * 50;

/* --- shape helpers: make the generated history look like a real business --- */
// Gentle growth across the window: ~0.80 at the start -> ~1.18 now, with a soft quarterly ripple.
const trendAt = (offset) => {
  const t = (DAYS - offset) / DAYS; // 0 (oldest) .. 1 (today)
  const growth = 0.72 + 0.46 * t;   // clear, steady climb
  const ripple = 1 + 0.035 * Math.sin(t * Math.PI * 2);
  return growth * ripple;
};
// weekday weighting per division (Sun..Sat)
const DOW_TRANSPORT = [0.45, 1.2, 1.25, 1.2, 1.15, 1.05, 0.7];
const DOW_FOOD = [0.75, 0.9, 0.95, 1.0, 1.15, 1.4, 1.3];
const DOW_HOSP = [0.95, 0.75, 0.75, 0.85, 1.15, 1.45, 1.35];
// gentle triangular noise in [-1, 1]
const noise = () => rnd() + rnd() - 1;
// count with a mild proportional wobble (keeps weekly bars readable, not spiky)
const wobble = (mean) => Math.max(0, Math.round(mean * (1 + noise() * 0.26)));

export const TODAY = toISODate(new Date());
const DAYS = 120;
const dayOf = (offset) => toISODate(addDays(TODAY, -offset));

/* ---------------------------------------------------------- people */

export const SEED_DRIVERS = [
  { id: "d1", name: "Peter Mwangi", idNumber: "23456781", phone: "+254 712 345 678", email: "peter.mwangi@gmail.com", licence: "DL-448120", nextOfKin: "+254 712 345 001", status: "On Duty", rating: 4.8, hiredOn: dayOf(940) },
  { id: "d2", name: "James Otieno", idNumber: "23456782", phone: "+254 722 456 789", email: "james.otieno@gmail.com", licence: "DL-337091", nextOfKin: "+254 722 456 002", status: "On Duty", rating: 4.6, hiredOn: dayOf(610) },
  { id: "d3", name: "Samuel Kiptoo", idNumber: "23456783", phone: "+254 733 567 890", email: "samuel.kiptoo@gmail.com", licence: "DL-905233", nextOfKin: "+254 733 567 003", status: "Off Duty", rating: 4.4, hiredOn: dayOf(430) },
  { id: "d4", name: "Grace Wanjiru", idNumber: "23456784", phone: "+254 700 111 222", email: "grace.wanjiru@gmail.com", licence: "DL-661874", nextOfKin: "+254 700 111 004", status: "On Leave", rating: 4.9, hiredOn: dayOf(300) },
  { id: "d5", name: "Ibrahim Hassan", idNumber: "23456785", phone: "+254 745 909 100", email: "ibrahim.hassan@gmail.com", licence: "DL-220458", nextOfKin: "+254 745 909 005", status: "On Duty", rating: 4.7, hiredOn: dayOf(180) },
  { id: "d6", name: "Caroline Nduta", idNumber: "23456786", phone: "+254 719 220 337", email: "caroline.nduta@gmail.com", licence: "DL-118763", nextOfKin: "+254 719 220 006", status: "On Duty", rating: 4.5, hiredOn: dayOf(95) },
];

export const SEED_VEHICLES = [
  { id: "v1", reg: "KDA 245A", type: "Bus", model: "Scania K410", driverId: "d1", status: "Active", mileage: 182340, serviceDueKm: 186000, insuranceExpiry: dayOf(-21), gpsId: "GPS-10021", capacity: 49 },
  { id: "v2", reg: "KCB 102X", type: "Shuttle", model: "Toyota Hiace", driverId: "d2", status: "Active", mileage: 96500, serviceDueKm: 101000, insuranceExpiry: dayOf(-96), gpsId: "GPS-10022", capacity: 14 },
  { id: "v3", reg: "KDG 771B", type: "Truck", model: "Isuzu FRR", driverId: "d3", status: "Maintenance", mileage: 210800, serviceDueKm: 210000, insuranceExpiry: dayOf(-58), gpsId: "", capacity: 8 },
  { id: "v4", reg: "KDN 330F", type: "Van", model: "Nissan NV350", driverId: "d4", status: "Active", mileage: 54200, serviceDueKm: 60000, insuranceExpiry: dayOf(-134), gpsId: "GPS-10024", capacity: 12 },
  { id: "v5", reg: "KDJ 812K", type: "Shuttle", model: "Toyota Hiace", driverId: "d5", status: "Active", mileage: 71450, serviceDueKm: 73000, insuranceExpiry: dayOf(-12), gpsId: "GPS-10025", capacity: 14 },
  { id: "v6", reg: "KCX 559M", type: "Bus", model: "Yutong ZK6100", driverId: "d6", status: "Active", mileage: 133900, serviceDueKm: 140000, insuranceExpiry: dayOf(-175), gpsId: "", capacity: 41 },
];

/* ---------------------------------------------------------- transport */

const ROUTES = [
  { origin: "Nairobi", destination: "Mombasa", km: 485, fare: 186000 },
  { origin: "Nairobi", destination: "Kisumu", km: 350, fare: 142000 },
  { origin: "Nairobi", destination: "Eldoret", km: 310, fare: 96000 },
  { origin: "Nairobi", destination: "Nakuru", km: 160, fare: 34500 },
  { origin: "Nairobi CBD", destination: "Westlands", km: 9, fare: 8200 },
  { origin: "Nairobi", destination: "Nanyuki", km: 200, fare: 52000 },
  { origin: "Mombasa", destination: "Malindi", km: 120, fare: 41000 },
  { origin: "Nairobi", destination: "Kericho", km: 260, fare: 78000 },
  { origin: "JKIA", destination: "Naivasha", km: 120, fare: 26500 },
];

const CLIENTS = [
  "Zenith Africa Ltd", "Rift Valley Sacco", "Bluewave Logistics", "Kenmore Tours",
  "Private charter", "Summit Insurance", "Highland Tea Co.", "Coastal Cargo Ltd", "Walk-in",
];

function buildTrips() {
  const trips = [];
  const activeVehicles = SEED_VEHICLES.filter((v) => v.status === "Active");
  for (let offset = DAYS; offset >= 0; offset--) {
    const date = dayOf(offset);
    const dow = new Date(date).getDay();
    const count = wobble(2.0 * DOW_TRANSPORT[dow] * trendAt(offset));
    for (let i = 0; i < count; i++) {
      const route = pick(ROUTES);
      const vehicle = pick(activeVehicles);
      const charter = chance(0.022); // occasional big private charter
      const fare = round50(route.fare * (0.93 + rnd() * 0.14) * trendAt(offset) * (charter ? 1.9 + rnd() * 0.8 : 1));
      const fuel = round50(route.km * between(19, 26) * (charter ? 1.5 : 1));
      const other = chance(0.35) ? round50(between(1500, 9000)) : 0;
      const status =
        offset === 0
          ? pick(["Scheduled", "In Transit", "Completed"])
          : offset === 1
            ? pick(["In Transit", "Completed", "Completed"])
            : chance(0.04)
              ? "Cancelled"
              : "Completed";
      trips.push({
        id: genId("t"),
        date,
        vehicleId: vehicle.id,
        driverId: vehicle.driverId,
        origin: route.origin,
        destination: route.destination,
        distanceKm: route.km,
        client: pick(CLIENTS),
        amount: status === "Cancelled" ? 0 : fare,
        fuelCost: status === "Cancelled" ? 0 : fuel,
        otherCost: status === "Cancelled" ? 0 : other,
        status,
      });
    }
  }
  return trips.reverse();
}

/* ---------------------------------------------------------- food */

export const SEED_MENU = [
  { id: "m1", name: "Whole chicken (broiler)", category: "Whole birds", price: 750, cost: 560, active: true },
  { id: "m2", name: "Kienyeji chicken (whole)", category: "Whole birds", price: 1200, cost: 870, active: true },
  { id: "m3", name: "Chicken breast (kg)", category: "Cuts", price: 600, cost: 420, active: true },
  { id: "m4", name: "Drumsticks (kg)", category: "Cuts", price: 500, cost: 350, active: true },
  { id: "m5", name: "Wings (kg)", category: "Cuts", price: 450, cost: 300, active: true },
  { id: "m6", name: "Gizzards (kg)", category: "Cuts", price: 400, cost: 260, active: true },
  { id: "m7", name: "Eggs (tray of 30)", category: "Eggs", price: 480, cost: 380, active: true },
  { id: "m8", name: "Bulk broilers (per bird)", category: "Wholesale", price: 700, cost: 520, active: true },
];

const CUSTOMERS = [
  "Mama Chichi Kiosk", "Amina Yusuf", "Greenspan Butchery", "Brian Kamau", "Highridge Hotel",
  "Njoki Wairimu", "Halisi Tech Hub Canteen", "Dennis Omondi", "Serene Gardens Restaurant", "Faith Chebet",
  "Kilimani Apartments", "Walk-in customer", "Mwangi & Sons Butchery", "Uzuri Salon Group",
];
const CHANNELS = ["Walk-in", "Phone", "WhatsApp", "Online", "Wholesale"];

function buildOrders() {
  const orders = [];
  for (let offset = DAYS; offset >= 0; offset--) {
    const date = dayOf(offset);
    const dow = new Date(date).getDay();
    const count = Math.max(1, wobble(3.3 * DOW_FOOD[dow] * trendAt(offset)));
    for (let i = 0; i < count; i++) {
      const item = pick(SEED_MENU);
      const bulk = item.category === "Wholesale";
      const mega = bulk && chance(0.045); // rare big wholesale order
      const qty = bulk ? Math.round(between(14, 80) * trendAt(offset) * (mega ? 2 : 1)) : between(1, 6);
      const amount = item.price * qty;
      const orderStatus =
        offset === 0
          ? pick(["Preparing", "Out for Delivery", "Delivered"])
          : chance(0.03)
            ? "Cancelled"
            : "Delivered";
      const paymentStatus =
        orderStatus === "Cancelled"
          ? "Pending"
          : chance(0.12)
            ? chance(0.4)
              ? "Partial"
              : "Pending"
            : "Paid";
      orders.push({
        id: genId("o"),
        date,
        customer: pick(CUSTOMERS),
        channel: pick(CHANNELS),
        menuItemId: item.id,
        item: bulk ? `${item.name} (${qty} birds)` : item.name,
        qty,
        unitPrice: item.price,
        amount: orderStatus === "Cancelled" ? 0 : amount,
        cost: orderStatus === "Cancelled" ? 0 : item.cost * qty,
        paymentStatus,
        orderStatus,
      });
    }
  }
  return orders.reverse();
}

/* ---------------------------------------------------------- hospitality */

export const SEED_ROOMS = [
  { id: "r1", number: "101", type: "Standard", price: 6500, status: "Available", floor: 1 },
  { id: "r2", number: "102", type: "Standard", price: 6500, status: "Available", floor: 1 },
  { id: "r3", number: "103", type: "Standard", price: 6500, status: "Cleaning", floor: 1 },
  { id: "r4", number: "201", type: "Deluxe", price: 11500, status: "Available", floor: 2 },
  { id: "r5", number: "202", type: "Deluxe", price: 11500, status: "Available", floor: 2 },
  { id: "r6", number: "203", type: "Family", price: 14500, status: "Available", floor: 2 },
  { id: "r7", number: "301", type: "Executive Suite", price: 22000, status: "Available", floor: 3 },
  { id: "r8", number: "302", type: "Executive Suite", price: 22000, status: "Maintenance", floor: 3 },
];

const GUESTS = [
  "David & Linda Achieng", "Tom Barasa", "Njeri Consulting Ltd", "Faith Chebet", "Ahmed Farah",
  "Sophie Muthoni", "Green Acres Sacco", "Martin Kariuki", "Elizabeth Wangari", "Joseph Mutinda",
  "Rehema Salim", "Kevin Oduor", "Patel Family", "Grace Atieno", "Horizon Auditors LLP",
];
const SOURCES = ["Direct", "Booking.com", "Walk-in", "Corporate", "Agent"];

function buildBookings() {
  const bookings = [];
  // Track occupied day-ranges per room so the demo never double-books.
  // Offsets count backwards ("days ago"), so a stay spans [checkOutOffset, checkInOffset].
  const taken = {};
  const overlaps = (roomId, lo, hi) =>
    (taken[roomId] || []).some(([s, e]) => lo < e && hi > s);

  for (let offset = DAYS; offset >= -14; offset--) {
    const dow = new Date(dayOf(Math.max(0, offset))).getDay();
    const attempts = Math.max(1, wobble(2.0 * DOW_HOSP[dow] * trendAt(Math.max(0, offset))));
    for (let i = 0; i < attempts; i++) {
      const room = pick(SEED_ROOMS);
      const nights = dow === 5 || dow === 6 ? between(2, 6) : between(1, 4);
      const lo = offset - nights;
      const hi = offset;
      if (overlaps(room.id, lo, hi)) continue;
      taken[room.id] = [...(taken[room.id] || []), [lo, hi]];

      const amount = room.price * nights;
      const inFuture = offset < 0;
      const currentlyStaying = offset >= 0 && offset - nights < 0;
      const status = inFuture ? "Confirmed" : currentlyStaying ? "Checked In" : "Checked Out";
      const paymentStatus =
        status === "Confirmed" ? (chance(0.5) ? "Pending" : "Paid") : chance(0.1) ? "Partial" : "Paid";
      bookings.push({
        id: genId("b"),
        guest: pick(GUESTS),
        roomId: room.id,
        checkIn: dayOf(offset),
        checkOut: dayOf(offset - nights),
        nights,
        guests: between(1, room.type === "Family" ? 5 : 2),
        source: pick(SOURCES),
        amount,
        paid: paymentStatus === "Paid" ? amount : paymentStatus === "Partial" ? round50(amount * 0.5) : 0,
        paymentStatus,
        status,
      });
    }
  }
  return bookings.sort((a, b) => (a.checkIn < b.checkIn ? 1 : -1));
}

/* ---------------------------------------------------------- expenses */

const OVERHEADS = [
  { division: "General", category: "Salaries", amount: 186000, method: "Bank Transfer", notes: "Admin & support staff payroll", vendor: "Payroll" },
  { division: "General", category: "Rent", amount: 145000, method: "Bank Transfer", notes: "Head office & yard", vendor: "Sameer Business Park" },
  { division: "Hospitality", category: "Utilities", amount: 28500, method: "Bank Transfer", notes: "Electricity & water", vendor: "Kenya Power" },
  { division: "General", category: "Licensing", amount: 42000, method: "Bank Transfer", notes: "County business permits", vendor: "Nairobi County" },
];

const ADHOC = [
  { division: "Food", category: "Supplies", vendor: "Kenchic Ltd", range: [6000, 22000] },
  { division: "Food", category: "Supplies", vendor: "Local poultry farm", range: [4000, 14000] },
  { division: "Transport", category: "Maintenance", vendor: "Autoworks Garage", range: [8000, 48000] },
  { division: "Hospitality", category: "Supplies", vendor: "Linen & Co.", range: [3000, 18000] },
  { division: "General", category: "Marketing", vendor: "Digital Hub Agency", range: [5000, 30000] },
  { division: "Transport", category: "Insurance", vendor: "Summit Insurance", range: [20000, 60000] },
];

function buildExpenses() {
  const list = [];
  // Recurring monthly overheads across the window.
  for (let m = 0; m <= Math.floor(DAYS / 30); m++) {
    OVERHEADS.forEach((o) => {
      list.push({
        ...o,
        id: genId("e"),
        date: dayOf(m * 30 + 2),
        amount: round50(o.amount * (0.9 + rnd() * 0.08) * trendAt(m * 30)),
        source: "manual",
      });
    });
  }
  // Ad-hoc operating spend.
  for (let offset = DAYS; offset >= 0; offset--) {
    if (!chance(0.5 + 0.12 * trendAt(offset))) continue;
    const a = pick(ADHOC);
    list.push({
      id: genId("e"),
      date: dayOf(offset),
      division: a.division,
      category: a.category,
      vendor: a.vendor,
      amount: round50(between(a.range[0], a.range[1]) * (0.85 + 0.4 * trendAt(offset))),
      method: pick(["M-Pesa", "Bank Transfer", "Cash"]),
      notes: `${a.category} - ${a.vendor}`,
      source: "manual",
    });
  }
  return list.sort((a, b) => (a.date < b.date ? 1 : -1));
}

/* ---------------------------------------------------------- payments (worker-initiated) */

const PAY_OUT = [
  { party: "Kenchic Ltd", division: "Food", category: "Supplies" },
  { party: "Local poultry farm", division: "Food", category: "Supplies" },
  { party: "Autoworks Garage", division: "Transport", category: "Maintenance" },
  { party: "Shell Kilimani", division: "Transport", category: "Fuel" },
  { party: "Linen & Co.", division: "Hospitality", category: "Supplies" },
  { party: "Kenya Power", division: "Hospitality", category: "Utilities" },
  { party: "Digital Hub Agency", division: "General", category: "Marketing" },
  { party: "Casual crew wages", division: "General", category: "Salaries" },
];
const PAY_IN = [
  { party: "Zenith Africa Ltd", division: "Transport" },
  { party: "Rift Valley Sacco", division: "Food" },
  { party: "Walk-in customer", division: "Food" },
  { party: "Njeri Consulting Ltd", division: "Hospitality" },
  { party: "Coastal Weddings Co.", division: "Food" },
  { party: "Private charter", division: "Transport" },
];
const PAY_STAFF = ["Mercy Adhiambo", "Peter Mwangi", "Aisha Noor", "Daniel Kiprop", "Victor Kimani"];

function buildPayments() {
  const list = [];
  for (let offset = 90; offset >= 0; offset--) {
    if (!chance(0.35)) continue;
    const out = chance(0.62);
    const src = out ? pick(PAY_OUT) : pick(PAY_IN);
    const method = pick(["M-Pesa", "M-Pesa", "Cash", "Bank Transfer"]);
    const amount = out ? round50(between(1500, 45000)) : round50(between(3000, 60000));
    const status = offset === 0 && method === "M-Pesa" && chance(0.4) ? "Pending" : chance(0.03) ? "Failed" : "Recorded";
    list.push({
      id: genId("pay"),
      date: dayOf(offset),
      direction: out ? "out" : "in",
      amount,
      party: src.party,
      division: src.division,
      category: out ? src.category : "Payment received",
      method,
      phone: method === "M-Pesa" ? `+254 7${between(10, 99)} ${between(100, 999)} ${between(100, 999)}` : "",
      reference: method === "M-Pesa" ? `QK${between(10, 99)}${Math.random().toString(36).slice(2, 7).toUpperCase()}` : "",
      notes: out ? `Paid ${src.party}` : `Received from ${src.party}`,
      status,
      createdBy: pick(PAY_STAFF),
    });
  }
  return list.sort((a, b) => (a.date < b.date ? 1 : -1));
}

/* ---------------------------------------------------------- people & comms */

export const SEED_USERS = [
  { id: "u1", name: "Wanjiku Kamande", email: "wanjiku@kash.co.ke", role: "Super Admin", division: "All", status: "Active", lastActive: TODAY },
  { id: "u2", name: "Peter Mwangi", email: "peter.m@kash.co.ke", role: "Transport Manager", division: "Transport", status: "Active", lastActive: TODAY },
  { id: "u3", name: "Aisha Noor", email: "aisha.n@kash.co.ke", role: "Food Manager", division: "Food", status: "Active", lastActive: dayOf(1) },
  { id: "u4", name: "Daniel Kiprop", email: "daniel.k@kash.co.ke", role: "Hospitality Manager", division: "Hospitality", status: "Active", lastActive: dayOf(2) },
  { id: "u5", name: "Mercy Adhiambo", email: "mercy.a@kash.co.ke", role: "Staff", division: "Food", status: "Active", lastActive: TODAY },
  { id: "u6", name: "Victor Kimani", email: "victor.k@kash.co.ke", role: "Accountant", division: "All", status: "Active", lastActive: dayOf(1) },
];

export const SEED_REMINDERS = [
  { id: "rem1", title: "Renew fleet insurance (KDJ 812K)", due: toISODate(addDays(TODAY, 12)), done: false, division: "Transport", priority: "High" },
  { id: "rem2", title: "File monthly VAT return", due: toISODate(addDays(TODAY, 6)), done: false, division: "General", priority: "High" },
  { id: "rem3", title: "Deep clean Room 302 after maintenance", due: toISODate(addDays(TODAY, 2)), done: false, division: "Hospitality", priority: "Normal" },
  { id: "rem4", title: "Review supplier contracts", due: toISODate(addDays(TODAY, 20)), done: false, division: "Food", priority: "Normal" },
  { id: "rem5", title: "Submit NSSF & NHIF returns", due: toISODate(addDays(TODAY, -3)), done: false, division: "General", priority: "High" },
  { id: "rem6", title: "Quarterly staff performance reviews", due: toISODate(addDays(TODAY, 34)), done: false, division: "General", priority: "Low" },
];

function buildNotifications() {
  const now = Date.now();
  const mk = (message, minsAgo, type, division, read) => ({
    id: genId("n"),
    message,
    ts: new Date(now - minsAgo * 60_000).toISOString(),
    read,
    type,
    division,
  });
  return [
    mk("Booking confirmed - Njeri Consulting Ltd, Room 201", 12, "booking", "Hospitality", false),
    mk("Expense approval needed - truck maintenance, KSh 31,000", 68, "expense", "Transport", false),
    mk("Trip scheduled - Nairobi to Kisumu, 6:00 AM departure", 145, "trip", "Transport", false),
    mk("Large catering order received - Coastal Weddings Co.", 400, "order", "Food", false),
    mk("Fleet insurance for KDJ 812K expires in 12 days", 1500, "alert", "Transport", true),
    mk("Room 302 flagged for maintenance by housekeeping", 2600, "alert", "Hospitality", true),
  ];
}


function buildMessages() {
  const now = Date.now();
  const min = (n) => new Date(now - n * 60_000).toISOString();
  const A = "Wanjiku Kamande", P = "Peter Mwangi", AN = "Aisha Noor", D = "Daniel Kiprop", V = "Victor Kimani", M = "Mercy Adhiambo";
  return [
    { id: genId("msg"), from: P, to: A, text: "Morning. KDG 771B is back from the garage, back on the road tomorrow.", ts: min(320), read: true },
    { id: genId("msg"), from: A, to: P, text: "Great. Please log the service cost under Payments.", ts: min(300), read: true },
    { id: genId("msg"), from: P, to: A, text: "Done - KSh 31,000, M-Pesa.", ts: min(180), read: false },
    { id: genId("msg"), from: AN, to: A, text: "Coastal Weddings confirmed the 150-pax order for Saturday.", ts: min(240), read: false },
    { id: genId("msg"), from: A, to: AN, text: "Perfect. Make sure the deposit is recorded.", ts: min(220), read: true },
    { id: genId("msg"), from: D, to: A, text: "Room 302 deep clean is done, marking it available.", ts: min(90), read: false },
    { id: genId("msg"), from: V, to: A, text: "VAT return is drafted, I'll file it before the 20th.", ts: min(1500), read: true },
    { id: genId("msg"), from: A, to: V, text: "Thanks Victor.", ts: min(1480), read: true },
    { id: genId("msg"), from: M, to: A, text: "Butchery paid - KSh 8,500 cash. Receipt with me.", ts: min(45), read: false },
  ];
}

/* ---------------------------------------------------------- assembly */

export function buildSeedData() {
  return {
    version: 1,
    company: {
      name: "KASH Group Ltd",
      tagline: "One Platform. Many Solutions.",
      email: "hello@kash.co.ke",
      phone: "+254 700 000 000",
      address: "Sameer Business Park, Mombasa Rd, Nairobi",
      taxId: "P051234567X",
    },
    drivers: SEED_DRIVERS,
    vehicles: SEED_VEHICLES,
    trips: buildTrips(),
    menu: SEED_MENU,
    orders: buildOrders(),
    rooms: SEED_ROOMS,
    bookings: buildBookings(),
    expenses: buildExpenses(),
    payments: buildPayments(),
    messages: buildMessages(),
    users: SEED_USERS,
    reminders: SEED_REMINDERS,
    notifications: buildNotifications(),
  };
}
