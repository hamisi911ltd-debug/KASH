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
   the browser build (imported from src/lib/store.jsx), so a record
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

/** What a restricted role may see over the wire - never trust the client's
    idea of its own role; this is the real, server-side enforcement. Two
    layers: which DIVISIONS a role has no view into at all get zeroed out
    entirely (a Driver's session never even receives Chicken/Hospitality
    data), then within a division a "writeOwn" worker is narrowed further
    to just their own rows. */
function scopeData(full, user) {
  const caps = capsForRole(user.role);
  const d = { ...full };
  const sees = (view) =>
    canOpenView(user.role, view) || canOpenView(user.role, "overview") || canOpenView(user.role, "all");

  if (!caps.write) {
    d.payments = full.payments.filter((p) => p.createdBy === user.name);
  }

  if (user.role === "Driver" && user.driverId) {
    d.trips = full.trips.filter((t) => t.driverId === user.driverId);
    d.vehicles = full.vehicles.filter((v) => v.driverId === user.driverId);
    d.drivers = full.drivers.filter((dr) => dr.id === user.driverId);
  } else if (!sees("transport")) {
    d.trips = []; d.vehicles = []; d.drivers = [];
  }

  if (user.role === "Chicken Attendant") {
    d.orders = full.orders.filter((o) => o.createdBy === user.name);
  } else if (!sees("food")) {
    d.orders = [];
  }

  if (!sees("hospitality")) {
    d.bookings = []; d.rooms = [];
  }
  // Hospitality Attendant does see everyone's bookings/rooms (sees("hospitality")
  // is true for them) - front desk needs every guest, not just their own.

  d.users = full.users.map(stripSecret);
  return d;
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
        const user = {
          id, name, email, phone,
          role: "Staff", division: "All", status: "Active",
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
      const rows = await getCollection(env, collection);

      if (request.method === "POST") {
        const canOwn = caps.writeOwn && ["trips", "orders", "bookings"].includes(collection);
        const canPay = collection === "payments" && caps.payments;
        if (!caps.write && !canOwn && !canPay) return err("You don't have access to add that.", 403);

        const body = await request.json();
        let values = { ...body, createdBy: user.name };
        if (collection === "trips" && user.role === "Driver" && user.driverId) {
          const vehicles = await getCollection(env, "vehicles");
          const mine = vehicles.find((v) => v.driverId === user.driverId);
          values = { ...values, driverId: user.driverId, vehicleId: mine?.id };
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
        if (!caps.write) return err("You don't have access to edit that.", 403);
        const body = await request.json();
        const next = rows.map((r) => (r.id === id ? { ...r, ...(normalisers[collection] ? normalisers[collection]({ ...r, ...body }, {}) : body) } : r));
        await putCollection(env, collection, next);
        return json(next.find((r) => r.id === id));
      }

      if (request.method === "PATCH") {
        if (!caps.write && !FREE_PATCH_COLLECTIONS.has(collection)) return err("You don't have access to change that.", 403);
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
