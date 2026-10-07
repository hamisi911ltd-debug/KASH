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
import { APPROVABLE_COLLECTIONS, MESSAGE_EVERYONE } from "../../src/lib/constants.js";
import { capsForRole, canOpenView } from "../../src/lib/auth.js";
import { setToday } from "../../src/lib/seed.js";
import { toISODate } from "../../src/lib/format.js";
import { passwordProblem, TERMS_VERSION } from "../../src/lib/policy.js";
import { hashPassword, verifyPassword, passwordNeedsUpgrade, clampIterations, signToken, verifyToken } from "./crypto.js";

/* Which websites may call this API from a browser. Set ALLOWED_ORIGINS to a
   comma-separated list (e.g. "https://app.kash.co.ke") in wrangler.toml.
   Unset = any origin, which is how it behaved before - fine for the demo,
   NOT for a real deployment. Sessions travel in an Authorization header (not
   cookies), so a wrong origin can't ride on someone's login either way. */
// Genuinely public, read-only, non-sensitive data - meant to be fetched
// from a different origin (the marketing site) even once ALLOWED_ORIGINS
// is locked to the app's own domain for everything else.
const PUBLIC_PATHS = ["/api/public/"];
const isPublicPath = (pathname) => PUBLIC_PATHS.some((p) => pathname.startsWith(p));

function corsHeaders(request, env) {
  const headers = {
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
  if (isPublicPath(new URL(request.url).pathname)) {
    headers["Access-Control-Allow-Origin"] = "*";
    return headers;
  }
  const allowed = String(env.ALLOWED_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean);
  const origin = request.headers.get("Origin") || "";
  if (!allowed.length) headers["Access-Control-Allow-Origin"] = "*";
  else if (allowed.includes(origin)) headers["Access-Control-Allow-Origin"] = origin;
  return headers;
}

/** Applied to every response on the way out. */
function decorate(response, request, env) {
  const res = new Response(response.body, response);
  for (const [k, v] of Object.entries(corsHeaders(request, env))) res.headers.set(k, v);
  res.headers.set("X-Content-Type-Options", "nosniff");
  // A public listing is fine to cache briefly at the edge/browser; every
  // authenticated response stays no-store, same as before.
  if (!res.headers.has("Cache-Control")) res.headers.set("Cache-Control", "no-store");
  res.headers.set("Referrer-Policy", "no-referrer");
  res.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  return res;
}

/** An error whose message is safe to show the person. Anything else that
    gets thrown is logged and answered with a generic 500. */
class HttpError extends Error {
  constructor(message, status = 400, headers) {
    super(message);
    this.status = status;
    this.headers = headers;
  }
}

function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...headers } });
}
function err(message, status = 400, headers) {
  return json({ error: message }, status, headers);
}

const MAX_BODY_BYTES = 200_000;

/* ---------------------------------------------------------- uploaded images */

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB
const IMAGE_EXT_FOR_TYPE = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" };
const SITE_DIVISIONS = ["Transport", "Food", "Hospitality"];

/** GET /uploads/<key> - public, no auth, so an image can show on the public
    marketing site as well as inside the app. Everything else about images
    (uploading, deleting) needs a session; only serving them is open. */
async function serveUpload(env, pathname) {
  const key = decodeURIComponent(pathname.slice("/uploads/".length));
  if (!key) return err("Not found.", 404);
  const obj = await env.IMAGES.get(key);
  if (!obj) return err("Not found.", 404);
  return new Response(obj.body, {
    headers: {
      "Content-Type": obj.httpMetadata?.contentType || "application/octet-stream",
      // The key is random and never reused, so a cached copy never goes stale.
      "Cache-Control": "public, max-age=31536000, immutable",
      ETag: obj.httpEtag,
    },
  });
}

async function readJson(request) {
  const declared = Number(request.headers.get("Content-Length") || 0);
  if (declared > MAX_BODY_BYTES) throw new HttpError("That request is too large.", 413);
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) throw new HttpError("That request is too large.", 413);
  try {
    const body = JSON.parse(text || "{}");
    if (body === null || typeof body !== "object" || Array.isArray(body)) throw new Error("not an object");
    return body;
  } catch {
    throw new HttpError("That request wasn't valid JSON.", 400);
  }
}

/** One structured line per security-relevant event. Read them with
    `wrangler tail` or the Workers logs dashboard (observability is on in
    wrangler.toml). Never log passwords, tokens or hashes. */
function audit(event, details = {}) {
  console.log(JSON.stringify({ audit: event, at: new Date().toISOString(), ...details }));
}

/* ---------------------------------------------------------- login throttling */

/* Failed sign-ins are counted per email and per IP in KV, with a sliding
   window. KV is eventually consistent and this is deliberately lightweight,
   so treat it as a brake on password-guessing bots, not a hard guarantee;
   Cloudflare's own rate-limiting rules (dashboard) are the second layer. */
const RL_WINDOW_SECONDS = 15 * 60;
const RL_MAX_PER_EMAIL = 5;
const RL_MAX_PER_IP = 25;

const clientIp = (request) => request.headers.get("CF-Connecting-IP") || "unknown";

async function readCount(env, key) {
  return Number((await env.KASH_KV.get(key)) || 0);
}
async function bump(env, key) {
  const next = (await readCount(env, key)) + 1;
  try {
    await env.KASH_KV.put(key, String(next), { expirationTtl: RL_WINDOW_SECONDS });
  } catch (e) {
    // The free KV plan caps daily writes. If the brake itself can't be
    // written, sign-in must keep working rather than fail for everyone.
    console.error("rate-limit write failed", e?.message);
  }
  return next;
}

/* ---------------------------------------------------------- human check (Cloudflare Turnstile) */

/* When TURNSTILE_SECRET is set, sign-in and sign-up need a token proving a
   real browser passed Cloudflare's "are you human" check. Not set = skipped,
   so local development and the demo keep working. The check runs BEFORE any
   database write, so a bot that can't pass it costs us nothing. */
async function assertHuman(env, request, token) {
  if (!env.TURNSTILE_SECRET) return;
  if (typeof token !== "string" || !token || token.length > 2048) {
    throw new HttpError("Please complete the human check and try again.", 400);
  }
  const form = new URLSearchParams({ secret: env.TURNSTILE_SECRET, response: token });
  const ip = clientIp(request);
  if (ip !== "unknown") form.set("remoteip", ip);
  let passed = false;
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: form });
    passed = (await res.json()).success === true;
  } catch (e) {
    console.error("turnstile unreachable", e?.message);
    throw new HttpError("We couldn't run the human check just now. Please try again in a moment.", 503);
  }
  if (!passed) {
    audit("auth.bot_check_failed", { ip });
    throw new HttpError("The human check failed. Please try again.", 400);
  }
}

/* ---------------------------------------------------------- crash reports from the website */

/* The browser reports its own crashes here so they show up in the Worker
   logs next to server errors. Nothing is stored (no KV writes); anything in
   a report is untrusted text, so it's length-capped, rate-limited per
   Worker instance, and only ever written to the log. */
const clientErrorHits = new Map();
function allowClientError(ip, now = Date.now()) {
  const hit = clientErrorHits.get(ip);
  if (!hit || hit.resetAt < now) {
    if (clientErrorHits.size > 500) clientErrorHits.clear();
    clientErrorHits.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  return ++hit.count <= 20;
}

function logClientError(request, body) {
  const cap = (v, n) => String(v ?? "").slice(0, n);
  console.error(JSON.stringify({
    clientError: {
      message: cap(body.message, 500),
      stack: cap(body.stack, 4000),
      componentStack: cap(body.componentStack, 2000),
      page: cap(body.page, 300),
      release: cap(body.release, 60),
      ref: cap(body.ref, 20),
      userId: cap(body.userId, 40),
      role: cap(body.role, 40),
      userAgent: cap(request.headers.get("User-Agent"), 200),
    },
  }));
}

/** For an uptime monitor. Reveals nothing secret. */
async function health(env) {
  const configured = !!env.JWT_SECRET;
  let storage = true;
  try {
    await env.KASH_KV.get("data:seeded");
  } catch {
    storage = false;
  }
  const ok = configured && storage;
  return json({ ok, configured, storage, time: new Date().toISOString() }, ok ? 200 : 503);
}

async function assertNotThrottled(env, request, email) {
  const [byEmail, byIp] = await Promise.all([
    readCount(env, `rl:email:${email}`),
    readCount(env, `rl:ip:${clientIp(request)}`),
  ]);
  if (byEmail >= RL_MAX_PER_EMAIL || byIp >= RL_MAX_PER_IP) {
    audit("auth.throttled", { email, ip: clientIp(request) });
    throw new HttpError("Too many failed attempts. Please wait 15 minutes and try again.", 429, {
      "Retry-After": String(RL_WINDOW_SECONDS),
    });
  }
}

async function recordFailure(env, request, email) {
  await Promise.all([bump(env, `rl:email:${email}`), bump(env, `rl:ip:${clientIp(request)}`)]);
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
  // A suspended person's existing token must stop working straight away,
  // not linger until it expires.
  if (!user || user.status === "Suspended") return null;
  return user;
}

const iterationsFor = (env) => clampIterations(env.PBKDF2_ITERATIONS);

/** Something to verify against when the email is unknown, so "no such
    account" takes about as long as "wrong password" and can't be told apart
    by timing. Built once per Worker instance. */
let dummyHash;
async function burnPasswordTime(env, password) {
  dummyHash ||= await hashPassword("not-a-real-password", iterationsFor(env));
  await verifyPassword(password, dummyHash);
}

const INVITE_ONLY =
  "Sign-up is by invitation. Ask your administrator to invite your email, or sign in if you already have an account.";

/** Only an existing, still-unclaimed invitation lets a new person in. */
const findInvite = (users, email) => users.find((u) => u.email === email && u.status === "Invited" && !u.passwordHash);

/* ---------------------------------------------------------- user management rules */

const activeSuperAdmins = (users) => users.filter((u) => u.role === "Super Admin" && u.status !== "Suspended" && u.status !== "Invited");

/** Fields on a user that only the server may ever set. */
const SERVER_ONLY_USER_FIELDS = ["id", "passwordHash", "createdAt", "termsAcceptedAt", "termsVersion"];

function stripServerFields(body, fields) {
  const clean = { ...body };
  for (const f of fields) delete clean[f];
  return clean;
}

/** A record's division, for the checks below. Orders don't carry a
    `division` field of their own (the whole collection is Agro); everything
    approvable does have one either directly or implicitly. */
const RECORD_DIVISION = { orders: "Food" };
const recordDivision = (collection, record) => record.division || RECORD_DIVISION[collection] || "General";

/** Throws unless `actor` may give the formal sign-off on `record`. A
    company-wide role (division "All": Super Admin/Admin/Director) may
    approve anything; a department head may only approve their own
    division's records. Nobody - department head or Super Admin alike - may
    approve something they themselves entered: "who gave the go-ahead" has
    to name a second person, every time. */
function assertMayApprove({ actor, record, collection }) {
  const division = recordDivision(collection, record);
  if (actor.division && actor.division !== "All" && actor.division !== division) {
    throw new HttpError("You can only approve records in your own division.", 403);
  }
  if (record.createdBy && record.createdBy === actor.name) {
    throw new HttpError("You can't approve your own entry - ask another approver to sign off on it.", 403);
  }
  if (record.approval && record.approval.status && record.approval.status !== "Pending") {
    throw new HttpError("This has already been decided.", 409);
  }
}

/** Throws unless `actor` may change `target` into `incoming` (or delete it
    when `incoming` is null). This is the wall that stops a division Manager
    from promoting themselves - manageUsers is checked separately, first. */
function assertMayChangeUser({ actor, target, incoming, users }) {
  const touchesSuperAdmin = target?.role === "Super Admin" || incoming?.role === "Super Admin";
  if (touchesSuperAdmin && actor.role !== "Super Admin") {
    throw new HttpError("Only a Super Admin can change a Super Admin.", 403);
  }
  if (target && target.id === actor.id && incoming === null) {
    throw new HttpError("You can't delete your own account.", 400);
  }
  if (target?.role === "Super Admin") {
    const losing = incoming === null || incoming.role !== "Super Admin" || incoming.status === "Suspended";
    const others = activeSuperAdmins(users).filter((u) => u.id !== target.id);
    if (losing && !others.length) throw new HttpError("There must always be at least one active Super Admin.", 400);
  }
  if (target?.passwordHash && incoming && incoming.email && incoming.email !== target.email) {
    throw new HttpError("An active account's email can't be changed.", 400);
  }
}

/** Whether a role can reach a given division's page at all - the same
    question the sidebar/top-tabs ask client-side, re-asked server-side
    so a Driver can't reach Agro/Hospitality data (or write to it)
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
    entirely (a Driver's session never even receives Agro/Hospitality
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
  // a siloed manager/worker only ever sees Admin/Super Admin/Director in
  // it, not their own department's colleagues and not any other
  // department - there's no view where a Driver would need James
  // Otieno's name.
  if (siloed) {
    d.users = full.users.filter((u) => u.role === "Super Admin" || u.role === "Admin" || u.role === "Director");
  }

  if (user.role === "Driver") {
    // A Driver account not yet linked to a driver record sees nothing,
    // rather than falling through to the whole fleet's trips.
    const own = user.driverId || null;
    d.trips = full.trips.filter((t) => own && t.driverId === own);
    d.vehicles = full.vehicles.filter((v) => own && v.driverId === own);
    d.drivers = full.drivers.filter((dr) => own && dr.id === own);
    d.maintenance = full.maintenance.filter((m) => d.vehicles[0] && m.vehicleId === d.vehicles[0].id);
  } else if (!sees(user.role, "transport")) {
    d.trips = []; d.vehicles = []; d.drivers = []; d.maintenance = [];
  }

  if (user.role === "Agro Attendant") {
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
  d.messages = full.messages.filter((m) => m.from === user.name || m.to === user.name || m.to === MESSAGE_EVERYONE);

  // The company-wide "who approved what" trail is for company-wide eyes
  // only (Super Admin/Admin/Director - division "All"). A department head
  // already sees a decision on the specific expense/order it belongs to;
  // they don't get the cross-division log.
  if (user.division && user.division !== "All") d.approvals = [];

  d.users = d.users.map(stripSecret);
  return d;
}

/** Whether a writeOwn user (a worker who can log their own records but
    not manage the whole division) owns this particular record. */
function ownsRecord(collection, record, user) {
  if (collection === "trips") return record.driverId === user.driverId;
  if (collection === "orders" || collection === "bookings" || collection === "maintenance") return record.createdBy === user.name;
  if (collection === "messages") return record.from === user.name || record.to === user.name || record.to === MESSAGE_EVERYONE;
  return false;
}

/** Messaging isn't a division privilege - anyone signed in can send one,
    same as reminders/notifications. Who you can reach is the real rule,
    and it's the same department wall everywhere else: only a
    company-wide role (Admin/Super Admin/Director/Accountant - division
    "All") messages anyone. Everyone tied to one division - a Transport
    Manager exactly as much as a Driver - can only ever reach Admin,
    Super Admin or a Director, never sideways to another department and
    never even down to their own workers over chat. Admin/Director are
    the hub every department raises things to; departments don't
    message each other directly. */
async function canMessage(env, user, toName) {
  // Staff can message any colleague directly, or the whole team at once.
  if (toName === MESSAGE_EVERYONE) return true;
  const users = await getCollection(env, "users");
  return users.some((u) => u.name === toName && u.status !== "Suspended");
}

const FREE_PATCH_COLLECTIONS = new Set(["notifications", "reminders"]);

/* ---------------------------------------------------------- router */

const app = {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null, { status: 204 });
    if (request.method === "GET" && new URL(request.url).pathname === "/api/health") return health(env);
    if (request.method === "GET" && new URL(request.url).pathname.startsWith("/uploads/")) {
      return serveUpload(env, new URL(request.url).pathname);
    }
    if (!env.JWT_SECRET) {
      console.error("JWT_SECRET is not set - refusing to serve requests.");
      return err("The server isn't configured yet.", 500);
    }

    try {
      setToday(toISODate(new Date())); // real time is only available inside a request
      await ensureSeeded(env);
      const url = new URL(request.url);
      const parts = url.pathname.replace(/^\/api\//, "").split("/").filter(Boolean);

      if (url.pathname === "/api/client-error" && request.method === "POST") {
        if (allowClientError(clientIp(request))) logClientError(request, await readJson(request));
        return json({ ok: true }, 202);
      }

      // The marketing site (a different, unauthenticated origin) reads a
      // division's published listings here - no sign-in, and only ever the
      // handful of fields that are meant to be public. This is the ONE
      // place the API answers a request with no session at all beyond
      // register/login, so it never touches anything but this one
      // read-only, already-public collection.
      if (url.pathname === "/api/public/listings" && request.method === "GET") {
        const division = url.searchParams.get("division") || "";
        const all = await getCollection(env, "listings");
        const pub = all
          .filter((l) => l.active && (!division || l.division === division))
          .map((l) => ({ id: l.id, division: l.division, title: l.title, description: l.description, price: l.price, meta: l.meta, imageUrl: l.imageUrl }));
        return json(pub, 200, { "Cache-Control": "public, max-age=60" });
      }

      if (url.pathname === "/api/auth/register" && request.method === "POST") {
        const body = await readJson(request);
        await assertHuman(env, request, body.turnstileToken);
        // Every attempt counts against the caller's IP, so sign-up can't be
        // used to spam accounts or to probe which emails are invited.
        if ((await bump(env, `rl:reg:${clientIp(request)}`)) > 10) {
          throw new HttpError("Too many sign-up attempts. Please wait 15 minutes and try again.", 429, {
            "Retry-After": String(RL_WINDOW_SECONDS),
          });
        }
        const name = String(body.name || "").trim();
        const email = String(body.email || "").trim().toLowerCase();
        const phone = String(body.phone || "").trim();
        const password = String(body.password || "");
        if (!name || !email || !phone || !password) return err("Name, email, contact and password are all required.");
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return err("Enter a valid email address.");
        const weak = passwordProblem(password, email);
        if (weak) return err(weak);
        if (body.acceptedTerms !== true) {
          return err("Please confirm you are 18 or older and accept the Terms and Privacy Policy.");
        }

        const users = await getCollection(env, "users");
        const openSignup = String(env.OPEN_SIGNUP) === "true"; // the public demo only
        // The very first account on a fresh instance has nobody to grant it
        // access - it has to start as Super Admin, or nobody could ever add
        // vehicles, rooms, staff, etc.
        const isFirstAccount = users.length === 0;
        const invite = isFirstAccount ? null : findInvite(users, email);

        if (await findUserByEmail(env, email)) {
          return openSignup ? err("An account with that email already exists.", 409) : err(INVITE_ONLY, 403);
        }
        if (!isFirstAccount && !openSignup && !invite) {
          audit("auth.signup_refused", { email, ip: clientIp(request) });
          return err(INVITE_ONLY, 403);
        }

        const now = new Date();
        const accepted = { termsAcceptedAt: now.toISOString(), termsVersion: TERMS_VERSION };
        const passwordHash = await hashPassword(password, iterationsFor(env));
        let user;
        let nextUsers;
        if (invite) {
          // Claiming an invitation keeps the role/division the admin chose.
          user = {
            ...invite, phone: invite.phone || phone, status: "Active", lastActive: toISODate(now), passwordHash, ...accepted,
          };
          nextUsers = users.map((u) => (u.id === invite.id ? user : u));
        } else {
          user = {
            id: `u${Date.now().toString(36)}`, name, email, phone,
            // Everyone after the first is Staff; an Admin promotes from there.
            role: isFirstAccount ? "Super Admin" : "Staff", division: "All", status: "Active",
            lastActive: toISODate(now), createdAt: now.toISOString(), passwordHash, ...accepted,
          };
          nextUsers = [user, ...users];
        }
        await putCollection(env, "users", nextUsers);
        await env.KASH_KV.put(`email:${email}`, user.id);
        audit("auth.registered", { userId: user.id, role: user.role, viaInvite: !!invite, first: isFirstAccount });

        const token = await signToken({ sub: user.id }, env.JWT_SECRET);
        return json({ token, user: stripSecret(user) }, 201);
      }

      if (url.pathname === "/api/auth/login" && request.method === "POST") {
        const body = await readJson(request);
        const email = String(body.email || "").trim().toLowerCase();
        const password = String(body.password || "");
        await assertNotThrottled(env, request, email);
        await assertHuman(env, request, body.turnstileToken);

        const user = await findUserByEmail(env, email);
        let passwordOk = false;
        if (user?.passwordHash) passwordOk = await verifyPassword(password, user.passwordHash);
        else await burnPasswordTime(env, password);

        if (!passwordOk) {
          await recordFailure(env, request, email);
          audit("auth.failed", { email, ip: clientIp(request) });
          return err("Incorrect email or password.", 401);
        }
        if (user.status === "Suspended") {
          audit("auth.suspended_login", { userId: user.id });
          return err("This account is suspended. Please contact your administrator.", 403);
        }

        await env.KASH_KV.delete(`rl:email:${email}`);
        if (passwordNeedsUpgrade(user.passwordHash, iterationsFor(env))) {
          const upgraded = { ...user, passwordHash: await hashPassword(password, iterationsFor(env)) };
          const users = await getCollection(env, "users");
          await putCollection(env, "users", users.map((u) => (u.id === user.id ? upgraded : u)));
        }
        audit("auth.login", { userId: user.id, role: user.role });
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
        const body = await readJson(request);
        const next = { ...(await getCompany(env)), ...body };
        await env.KASH_KV.put("data:company", JSON.stringify(next));
        return json(next);
      }

      if (url.pathname === "/api/sync" && request.method === "GET") {
        const full = { company: await getCompany(env) };
        for (const name of COLLECTIONS) full[name] = await getCollection(env, name);
        return json({ user: stripSecret(user), data: scopeData(full, user) });
      }

      // /api/uploads - a division Manager's photo for one of their website
      // listings. The file itself lives in R2 (see wrangler.toml); this just
      // hands back the URL that goes straight into a listing's imageUrl.
      if (url.pathname === "/api/uploads" && request.method === "POST") {
        if (!caps.manageListings) return err("You don't have access to upload images.", 403);
        const contentType = (request.headers.get("Content-Type") || "").split(";")[0].trim().toLowerCase();
        const ext = IMAGE_EXT_FOR_TYPE[contentType];
        if (!ext) return err("Only JPEG, PNG, WEBP or GIF images are accepted.", 400);
        const declared = Number(request.headers.get("Content-Length") || 0);
        if (declared > MAX_IMAGE_BYTES) return err("That image is too large (max 5MB).", 413);
        const bytes = await request.arrayBuffer();
        if (bytes.byteLength > MAX_IMAGE_BYTES) return err("That image is too large (max 5MB).", 413);
        if (bytes.byteLength === 0) return err("The image was empty.", 400);

        const requestedDivision = url.searchParams.get("division") || user.division || "Transport";
        if (!SITE_DIVISIONS.includes(requestedDivision)) return err("Unknown division.", 400);
        if (user.division && user.division !== "All" && user.division !== requestedDivision) {
          return err("You can only upload images for your own division.", 403);
        }

        const key = `listings/${requestedDivision}/${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        await env.IMAGES.put(key, bytes, { httpMetadata: { contentType } });
        audit("image.uploaded", { by: user.id, division: requestedDivision, key, bytes: bytes.byteLength });
        return json({ url: `${url.origin}/uploads/${key}`, key }, 201);
      }

      // DELETE /api/uploads/<key> - <key> itself contains slashes
      // (listings/<Division>/<file>), so this can't go through the generic
      // /api/:collection/:id router below.
      if (parts[0] === "uploads" && request.method === "DELETE") {
        if (!caps.manageListings) return err("You don't have access to delete images.", 403);
        const key = parts.slice(1).join("/");
        if (!key) return err("Missing image.", 400);
        const [, keyDivision] = key.split("/");
        if (user.division && user.division !== "All" && user.division !== keyDivision) {
          return err("You can only remove images for your own division.", 403);
        }
        await env.IMAGES.delete(key);
        audit("image.deleted", { by: user.id, key });
        return json({ ok: true });
      }

      // /api/:collection/:id/approve - checked before the generic routes
      // below, which never touch "approvals" at all (see the guard further
      // down): this is the one and only way that collection is written.
      if (parts.length === 3 && parts[2] === "approve" && request.method === "POST") {
        const [approveCollection, approveId] = parts;
        if (!APPROVABLE_COLLECTIONS.includes(approveCollection)) return err("That can't be approved.", 400);
        if (!caps.approve) return err("You don't have access to approve anything.", 403);
        const approveRows = await getCollection(env, approveCollection);
        const existing = approveRows.find((r) => r.id === approveId);
        if (!existing) return err("Not found.", 404);
        assertMayApprove({ actor: user, record: existing, collection: approveCollection });

        const body = await readJson(request);
        if (!["approve", "reject"].includes(body.decision)) return err("Say whether you approve or reject it.", 400);
        const approval = {
          status: body.decision === "approve" ? "Approved" : "Rejected",
          by: user.name,
          role: user.role,
          at: new Date().toISOString(),
          note: String(body.note || "").trim().slice(0, 500),
        };
        await putCollection(env, approveCollection, approveRows.map((r) => (r.id === approveId ? { ...r, approval } : r)));

        // One company-wide, append-only trail - so "who approved what, and
        // when" is a single list Super Admin/Admin/Director can read, not
        // something scattered across every division's own records.
        const division = recordDivision(approveCollection, existing);
        const summary =
          approveCollection === "expenses"
            ? `${existing.category}${existing.vendor ? ` - ${existing.vendor}` : ""}`
            : `${existing.item || "Order"}${existing.customer ? ` - ${existing.customer}` : ""}`;
        const entry = {
          id: `${ID_PREFIX.approvals}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
          collection: approveCollection, recordId: approveId, division, summary,
          amount: Number(existing.amount) || 0, requestedBy: existing.createdBy || "",
          ...approval,
        };
        const approvalsLog = await getCollection(env, "approvals");
        await putCollection(env, "approvals", [entry, ...approvalsLog]);
        audit("record.approved", { by: user.id, role: user.role, collection: approveCollection, recordId: approveId, decision: approval.status });

        return json({ ...existing, approval });
      }

      // /api/:collection[/:id]
      const [collection, id] = parts;
      if (!COLLECTIONS.includes(collection)) return err("Unknown collection.", 404);
      // The approval trail is written only through /approve above, by the
      // server, never through these generic routes - so nobody can create,
      // edit or erase an entry in it, including the person it's about.
      if (collection === "approvals" && request.method !== "GET") return err("This is a read-only record.", 405);
      const requiredView = COLLECTION_VIEW[collection];
      if (requiredView && !sees(user.role, requiredView)) {
        return err("You don't have access to that.", 403);
      }
      // People and their roles are the keys to everything else, so managing
      // them is its own permission - `write` (which every division Manager
      // and the Accountant hold) is deliberately not enough.
      if (collection === "users" && !caps.manageUsers) return err("You don't have access to manage users.", 403);
      // Same idea for the public website's listings: `write` isn't enough on
      // its own (it would let the Accountant publish to the site), and a
      // division Manager may only ever touch their own division's listings.
      if (collection === "listings" && !caps.manageListings) return err("You don't have access to manage the website's listings.", 403);
      const listingDivisionOk = (division) => !user.division || user.division === "All" || user.division === division;
      const rows = await getCollection(env, collection);

      if (request.method === "POST") {
        const canOwn = caps.writeOwn && ["trips", "orders", "bookings", "maintenance"].includes(collection);
        const canPay = collection === "payments" && caps.payments;
        const canMsg = collection === "messages"; // anyone signed in - checked properly below
        const canListing = collection === "listings" && caps.manageListings;
        if (!caps.write && !canOwn && !canPay && !canMsg && !canListing) return err("You don't have access to add that.", 403);

        let body = await readJson(request);
        if (collection === "messages") {
          if (!(await canMessage(env, user, body.to))) {
            return err("You can only message an Admin.", 403);
          }
          body.from = user.name; // never trust a client-supplied sender
        }
        if (collection === "users") {
          const email = String(body.email || "").trim().toLowerCase();
          if (!email) return err("An email is required to invite someone.");
          if (rows.some((u) => u.email === email)) return err("Someone with that email is already on the team.", 409);
          assertMayChangeUser({ actor: user, target: null, incoming: { role: body.role }, users: rows });
          // An invitation can only ever be an unclaimed, passwordless placeholder.
          body = { ...stripServerFields(body, SERVER_ONLY_USER_FIELDS), status: "Invited" };
          audit("user.invited", { by: user.id, email, role: body.role || "Staff" });
        }
        if (collection === "listings") {
          // A division-locked manager's own request may not even send a
          // division (it's implied); default to their own before checking,
          // rather than treating "not specified" as "not allowed".
          body.division = body.division || user.division || "Transport";
          if (!listingDivisionOk(body.division)) return err("You can only publish listings for your own division.", 403);
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
        const allowed = caps.write || (collection === "listings" && caps.manageListings) || (caps.writeOwn && ownsRecord(collection, existing, user));
        if (!allowed) return err("You don't have access to edit that.", 403);
        if (collection === "listings" && !listingDivisionOk(existing.division)) {
          return err("You can only edit listings for your own division.", 403);
        }
        const body = stripServerFields(await readJson(request), collection === "users" ? SERVER_ONLY_USER_FIELDS : ["id"]);
        const shaped = normalisers[collection] ? normalisers[collection]({ ...existing, ...body }, {}) : body;
        if (collection === "users") {
          assertMayChangeUser({ actor: user, target: existing, incoming: shaped, users: rows });
          audit("user.updated", { by: user.id, target: existing.id, role: shaped.role, status: shaped.status });
        }
        const next = rows.map((r) => (r.id === id ? { ...r, ...shaped } : r));
        await putCollection(env, collection, next);
        return json(next.find((r) => r.id === id));
      }

      if (request.method === "PATCH") {
        const existing = rows.find((r) => r.id === id);
        // Marking a message read is ownership-based for every role, not just
        // writeOwn workers - anyone in the thread (either side) can do it.
        const allowed =
          caps.write ||
          (collection === "listings" && caps.manageListings) ||
          FREE_PATCH_COLLECTIONS.has(collection) ||
          (existing && ownsRecord(collection, existing, user) && (collection === "messages" || caps.writeOwn));
        if (!allowed) return err("You don't have access to change that.", 403);
        if (!existing) return err("Not found.", 404);
        if (collection === "listings" && !listingDivisionOk(existing.division)) {
          return err("You can only edit listings for your own division.", 403);
        }
        // A patch can never rewrite who a record is, who made it, or (for
        // people) anything only the server sets - that includes passwordHash.
        const body = stripServerFields(await readJson(request), [...(collection === "users" ? SERVER_ONLY_USER_FIELDS : ["id"]), "createdBy"]);
        if (collection === "users") {
          assertMayChangeUser({ actor: user, target: existing, incoming: { ...existing, ...body }, users: rows });
          audit("user.updated", { by: user.id, target: existing.id, role: body.role, status: body.status });
        }
        const next = rows.map((r) => (r.id === id ? { ...r, ...body } : r));
        await putCollection(env, collection, next);
        return json(next.find((r) => r.id === id));
      }

      if (request.method === "DELETE") {
        if (collection === "listings") {
          if (!caps.manageListings) return err("You don't have access to delete that.", 403);
          const existing = rows.find((r) => r.id === id);
          if (!existing) return err("Not found.", 404);
          if (!listingDivisionOk(existing.division)) return err("You can only remove listings for your own division.", 403);
        } else if (!caps.deleteAny) {
          return err("You don't have access to delete that.", 403);
        }
        if (collection === "users") {
          const target = rows.find((r) => r.id === id);
          if (!target) return err("Not found.", 404);
          assertMayChangeUser({ actor: user, target, incoming: null, users: rows });
          await env.KASH_KV.delete(`email:${target.email}`); // free the address so it can be invited again
          audit("user.deleted", { by: user.id, target: target.id });
        }
        await putCollection(env, collection, rows.filter((r) => r.id !== id));
        return json({ ok: true });
      }

      return err("Not found.", 404);
    } catch (e) {
      if (e instanceof HttpError) return err(e.message, e.status, e.headers);
      // Details go to the logs, never to the person - an error message can
      // leak how the server is built. The short reference lets someone quote
      // what they saw, and you find that exact failure in the logs.
      const ref = crypto.randomUUID().slice(0, 8);
      console.error(JSON.stringify({
        unhandled: { ref, method: request.method, path: new URL(request.url).pathname, message: e?.message, stack: e?.stack },
      }));
      return err(`Something went wrong. Please try again. (Ref: ${ref})`, 500);
    }
  },
};

export default {
  async fetch(request, env) {
    return decorate(await app.fetch(request, env), request, env);
  },
};
