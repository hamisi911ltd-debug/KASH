/* ============================================================
   KASH API - a Cloudflare Worker backed by Workers KV.

   Single-tenant (one business), REST-ish JSON API:
     POST /api/auth/register   {name,email,phone,password}
     POST /api/auth/login      {email,password}
     GET  /api/me
     GET  /api/sync                       -> { user, data }  (role-scoped)
     POST /api/:collection                -> create
     PUT  /api/:collection/:id            -> full update
     PATCH /api/:collection/:id           -> partial patch
     DELETE /api/:collection/:id          -> delete

   Every collection uses the exact same normaliser/id-prefix rules as
   the browser build (imported from src/lib/schema.js), so a record
   created here and one created client-side-before-sync are identical
   in shape. Role checks are re-derived from src/lib/constants.js -
   the same table the UI reads - so there is exactly one definition
   of "what can this role do", not two that can drift apart.
   ============================================================ */
import { COLLECTIONS, ID_PREFIX, normalisers } from "../../src/lib/schema.js";
import { capsForRole, canOpenView } from "../../src/lib/auth.js";
import { setToday } from "../../src/lib/seed.js";
import { toISODate } from "../../src/lib/format.js";
import { hashPassword, verifyPassword, signToken, verifyToken } from "./crypto.js";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...CORS } });
}
function err(message, status = 400) {
  return json({ error: message }, status);
}

/* ---------------------------------------------------------- KV data access */

async function getCollection(env, name) {
  const raw = await env.KASH_KV.get(`data:${name}`);
  return raw ? JSON.parse(raw) : [];
}
async function putCollection(env, name, rows) {
  await env.KASH_KV.put(`data:${name}`, JSON.stringify(rows));
}
async function getCompany(env) {
  const raw = await env.KASH_KV.get("data:company");
  return raw ? JSON.parse(raw) : { name: "KASH Group Ltd" };
}

/** First request ever: make sure every collection key at least exists.
    The rich demo dataset (~120 days of trips/orders/bookings) is loaded
    once via `worker/seed-kv.mjs` before launch, not computed here -
    generating it is too much CPU for a single free-plan Worker request,
    so this is only a safety net if the KV store is ever genuinely empty. */
async function ensureSeeded(env) {
  const marker = await env.KASH_KV.get("data:seeded");
  if (marker) return;
  for (const name of COLLECTIONS) {
    await putCollection(env, name, []);
  }
  await env.KASH_KV.put("data:company", JSON.stringify({ name: "KASH Group Ltd" }));
  await env.KASH_KV.put("data:seeded", "1");
}

/* ---------------------------------------------------------- auth */

function stripSecret(u) {
  const { passwordHash, ...rest } = u;
  return rest;
}

async function findUserByEmail(env, email) {
  const id = await env.KASH_KV.get(`email:${String(email || "").trim().toLowerCase()}`);
  if (!id) return null;
  const users = await getCollection(env, "users");
  return users.find((u) => u.id === id) || null;
}

async function requireUser(request, env) {
  const auth = request.headers.get("Authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return null;
  const payload = await verifyToken(token, env.JWT_SECRET);
  if (!payload?.sub) return null;
  const users = await getCollection(env, "users");
  const user = users.find((u) => u.id === payload.sub);
  return user || null;
}

/** Whether a role can reach a given division's page at all - the same
    question the sidebar/top-tabs ask client-side, re-asked server-side
    so a Driver can't reach Chicken/Hospitality data (or write to it)
    just by calling the API directly instead of clicking through the UI. */
function sees(role, view) {
  return canOpenView(role, view) || canOpenView(role, "overview") || canOpenView(role, "all");
}

/** Which division a collection belongs to, for the check above. Anything
    not listed here (payments, expenses, reminders, messages, users, ...)
    isn't tied to one division and skips this check entirely. */
const COLLECTION_VIEW = {
  trips: "transport", vehicles: "transport", drivers: "transport", maintenance: "transport",
  orders: "food", menu: "food",
  bookings: "hospitality", rooms: "hospitality",
};

/** What a restricted role may see over the wire - never trust the client's
    idea of its own role; this is the real, server-side enforcement. Two
    layers: which DIVISIONS a role has no view into at all get zeroed out
    entirely (a Driver's session never even receives Chicken/Hospitality
    data), then within a division a "writeOwn" worker is narrowed further
    to just their own rows. */
function scopeData(full, user) {
  const caps = capsForRole(user.role);
  const d = { ...full };
  // A Manager (caps.write) tied to one division - not "All" - oversees
  // only that division: their own Expenses/Reports/Payments never show
  // another department's money, matching a division Worker who's scoped
  // the same way by the blocks below.
  const isDivisionManager = caps.write && user.division && user.division !== "All";
  const siloed = isDivisionManager || (!caps.write && caps.writeOwn);

  if (!caps.write) {
    d.payments = full.payments.filter((p) => p.createdBy === user.name);
  } else if (isDivisionManager) {
    d.payments = full.payments.filter((p) => p.division === user.division);
  }

  if (isDivisionManager) {
    d.expenses = full.expenses.filter((e) => e.division === user.division);
  }

  // The roster mirrors who canMessage() would actually let them reach:
  // a siloed manager/worker only ever sees Admin/Super Admin in it, not
  // their own department's colleagues and not any other department -
  // there's no view where a Driver would need James Otieno's name.
  if (siloed) {
    d.users = full.users.filter((u) => u.role === "Super Admin" || u.role === "Admin");
  }

  if (user.role === "Driver" && user.driverId) {
    d.trips = full.trips.filter((t) => t.driverId === user.driverId);
    d.vehicles = full.vehicles.filter((v) => v.driverId === user.driverId);
    d.drivers = full.drivers.filter((dr) => dr.id === user.driverId);
    d.maintenance = full.maintenance.filter((m) => m.vehicleId === (d.vehicles[0]?.id));
  } else if (!sees(user.role, "transport")) {
    d.trips = []; d.vehicles = []; d.drivers = []; d.maintenance = [];
  }

  if (user.role === "Chicken Attendant") {
    d.orders = full.orders.filter((o) => o.createdBy === user.name);
  } else if (!sees(user.role, "food")) {
    d.orders = [];
  }

  if (!sees(user.role, "hospitality")) {
    d.bookings = []; d.rooms = [];
  }
  // Hospitality Attendant does see everyone's bookings/rooms (sees("hospitality")
  // is true for them) - front desk needs every guest, not just their own.

  // Messages are private to the two people in the thread, always - even
  // an Admin only sees threads they're personally part of.
  d.messages = full.messages.filter((m) => m.from === user.name || m.to === user.name);

  d.users = d.users.map(stripSecret);
  return d;
}

/** Whether a writeOwn user (a worker who can log their own records but
    not manage the whole division) owns this particular record. */
function ownsRecord(collection, record, user) {
  if (collection === "trips") return record.driverId === user.driverId;
  if (collection === "orders" || collection === "bookings" || collection === "maintenance") return record.createdBy === user.name;
  if (collection === "messages") return record.from === user.name || record.to === user.name;
  return false;
}

/** Messaging isn't a division privilege - anyone signed in can send one,
    same as reminders/notifications. Who you can reach is the real rule,
    and it's the same department wall everywhere else: only a
    company-wide role (Admin/Super Admin/Accountant - division "All")
    messages anyone. Everyone tied to one division - a Transport
    Manager exactly as much as a Driver - can only ever reach Admin,
    never sideways to another department and never even down to their
    own workers over chat. Admin is the one hub every department raises
    things to; departments don't message each other directly. */
async function canMessage(env, user, toName) {
  const caps = capsForRole(user.role);
  if (caps.write && (!user.division || user.division === "All")) return true;
  const users = await getCollection(env, "users");
  const recipient = users.find((u) => u.name === toName);
  return !!recipient && (recipient.role === "Super Admin" || recipient.role === "Admin");
}

const FREE_PATCH_COLLECTIONS = new Set(["notifications", "reminders"]);

/* ---------------------------------------------------------- router */

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null, { headers: CORS });

    try {
      setToday(toISODate(new Date())); // real time is only available inside a request
      await ensureSeeded(env);
      const url = new URL(request.url);
      const parts = url.pathname.replace(/^\/api\//, "").split("/").filter(Boolean);

      if (url.pathname === "/api/auth/register" && request.method === "POST") {
        const body = await request.json();
        const name = String(body.name || "").trim();
        const email = String(body.email || "").trim().toLowerCase();
        const phone = String(body.phone || "").trim();
        const password = String(body.password || "");
        if (!name || !email || !phone || !password) return err("Name, email, contact and password are all required.");
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return err("Enter a valid email address.");
        if (password.length < 6) return err("Password must be at least 6 characters.");
        if (await findUserByEmail(env, email)) return err("An account with that email already exists.", 409);

        const users = await getCollection(env, "users");
        const id = `u${Date.now().toString(36)}`;
        // The very first account on a fresh instance has nobody to grant it
        // access - it has to start as Super Admin, or nobody could ever add
        // vehicles, rooms, staff, etc. Every account after that is Staff by
        // default; an Admin promotes people from there.
        const isFirstAccount = users.length === 0;
        const user = {
          id, name, email, phone,
          role: isFirstAccount ? "Super Admin" : "Staff", division: "All", status: "Active",
          lastActive: toISODate(new Date()), createdAt: new Date().toISOString(),
          passwordHash: await hashPassword(password),
        };
        await putCollection(env, "users", [user, ...users]);
        await env.KASH_KV.put(`email:${email}`, id);

        const token = await signToken({ sub: id }, env.JWT_SECRET);
        return json({ token, user: stripSecret(user) }, 201);
      }

      if (url.pathname === "/api/auth/login" && request.method === "POST") {
        const body = await request.json();
        const email = String(body.email || "").trim().toLowerCase();
        const password = String(body.password || "");
        const user = await findUserByEmail(env, email);
        if (!user || user.status === "Suspended") return err("No account for that email, or it's suspended.", 401);
        if (!(await verifyPassword(password, user.passwordHash))) return err("Wrong password.", 401);
        const token = await signToken({ sub: user.id }, env.JWT_SECRET);
        return json({ token, user: stripSecret(user) });
      }

      // Everything past this point needs a valid session.
      const user = await requireUser(request, env);
      if (!user) return err("Sign in required.", 401);
      const caps = capsForRole(user.role);

      if (url.pathname === "/api/me" && request.method === "GET") {
        return json({ user: stripSecret(user) });
      }

      if (url.pathname === "/api/company" && request.method === "PATCH") {
        if (!caps.settings) return err("You don't have access to change company settings.", 403);
        const body = await request.json();
        const next = { ...(await getCompany(env)), ...body };
        await env.KASH_KV.put("data:company", JSON.stringify(next));
        return json(next);
      }

      if (url.pathname === "/api/sync" && request.method === "GET") {
        const full = { company: await getCompany(env) };
        for (const name of COLLECTIONS) full[name] = await getCollection(env, name);
        return json({ user: stripSecret(user), data: scopeData(full, user) });
      }

      // /api/:collection[/:id]
      const [collection, id] = parts;
      if (!COLLECTIONS.includes(collection)) return err("Unknown collection.", 404);
      const requiredView = COLLECTION_VIEW[collection];
      if (requiredView && !sees(user.role, requiredView)) {
        return err("You don't have access to that.", 403);
      }
      const rows = await getCollection(env, collection);

      if (request.method === "POST") {
        const canOwn = caps.writeOwn && ["trips", "orders", "bookings", "maintenance"].includes(collection);
        const canPay = collection === "payments" && caps.payments;
        const canMsg = collection === "messages"; // anyone signed in - checked properly below
        if (!caps.write && !canOwn && !canPay && !canMsg) return err("You don't have access to add that.", 403);

        const body = await request.json();
        if (collection === "messages") {
          if (!(await canMessage(env, user, body.to))) {
            return err("You can only message an Admin.", 403);
          }
          body.from = user.name; // never trust a client-supplied sender
        }
        let values = { ...body, createdBy: user.name };
        if ((collection === "trips" || collection === "maintenance") && user.role === "Driver" && user.driverId) {
          const vehicles = await getCollection(env, "vehicles");
          const mine = vehicles.find((v) => v.driverId === user.driverId);
          values = collection === "trips" ? { ...values, driverId: user.driverId, vehicleId: mine?.id } : { ...values, vehicleId: mine?.id };
        }
        if (collection === "payments") {
          values.reference = values.reference || `MP${Math.random().toString(36).slice(2, 9).toUpperCase()}`;
          values.status = values.method === "M-Pesa" ? "Pending" : "Recorded";
        }
        const shaped = normalisers[collection] ? normalisers[collection](values, { menu: await getCollection(env, "menu"), rooms: await getCollection(env, "rooms") }) : values;
        const record = { id: `${ID_PREFIX[collection] || "x"}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, ...shaped, createdBy: user.name };
        await putCollection(env, collection, [record, ...rows]);
        return json(record, 201);
      }

      if (!id) return err("Missing record id.", 400);

      if (request.method === "PUT") {
        const existing = rows.find((r) => r.id === id);
        if (!existing) return err("Not found.", 404);
        const allowed = caps.write || (caps.writeOwn && ownsRecord(collection, existing, user));
        if (!allowed) return err("You don't have access to edit that.", 403);
        const body = await request.json();
        const next = rows.map((r) => (r.id === id ? { ...r, ...(normalisers[collection] ? normalisers[collection]({ ...r, ...body }, {}) : body) } : r));
        await putCollection(env, collection, next);
        return json(next.find((r) => r.id === id));
      }

      if (request.method === "PATCH") {
        const existing = rows.find((r) => r.id === id);
        // Marking a message read is ownership-based for every role, not just
        // writeOwn workers - anyone in the thread (either side) can do it.
        const allowed =
          caps.write ||
          FREE_PATCH_COLLECTIONS.has(collection) ||
          (existing && ownsRecord(collection, existing, user) && (collection === "messages" || caps.writeOwn));
        if (!allowed) return err("You don't have access to change that.", 403);
        const body = await request.json();
        const next = rows.map((r) => (r.id === id ? { ...r, ...body } : r));
        await putCollection(env, collection, next);
        return json(next.find((r) => r.id === id));
      }

      if (request.method === "DELETE") {
        if (!caps.deleteAny) return err("You don't have access to delete that.", 403);
        await putCollection(env, collection, rows.filter((r) => r.id !== id));
        return json({ ok: true });
      }

      return err("Not found.", 404);
    } catch (e) {
      return err(e?.message || "Something went wrong.", 500);
    }
  },
};
