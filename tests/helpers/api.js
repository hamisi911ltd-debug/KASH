/* Runs the real Worker in-process against an in-memory stand-in for
   Cloudflare KV, so security rules can be tested without a network. */
import worker from "../../worker/src/index.js";

export function fakeKV() {
  const store = new Map();
  return {
    store,
    async get(key) { return store.has(key) ? store.get(key) : null; },
    async put(key, value) { store.set(key, String(value)); },
    async delete(key) { store.delete(key); },
  };
}

/** A minimal stand-in for an R2 bucket - just enough of .get/.put/.delete
    for the image-upload routes, with the same shape a real R2Object's
    .get() reply has (body, httpMetadata, httpEtag). */
export function fakeR2() {
  const store = new Map();
  return {
    store,
    async put(key, value, opts = {}) { store.set(key, { value, httpMetadata: opts.httpMetadata || {} }); },
    async get(key) {
      const entry = store.get(key);
      if (!entry) return null;
      return { body: entry.value, httpMetadata: entry.httpMetadata, httpEtag: `"${key}"` };
    },
    async delete(key) { store.delete(key); },
  };
}

export const STRONG = "Sup3rSecret99";
export const TERMS = { acceptedTerms: true };

export function makeEnv(overrides = {}) {
  return { KASH_KV: fakeKV(), IMAGES: fakeR2(), JWT_SECRET: "test-secret-".repeat(4), ...overrides };
}

/** Call the API. Returns { status, body, headers }. Pass `bytes` (+ optional
    `contentType`) instead of `body`/`raw` to send a binary upload. */
export async function call(env, method, path, { token, body, ip = "203.0.113.7", origin, raw, bytes, contentType } = {}) {
  const headers = { "CF-Connecting-IP": ip };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (origin) headers.Origin = origin;
  if (bytes !== undefined) headers["Content-Type"] = contentType || "application/octet-stream";
  else if (body !== undefined || raw !== undefined) headers["Content-Type"] = "application/json";
  const res = await worker.fetch(
    new Request(`https://api.test${path}`, {
      method,
      headers,
      body: bytes !== undefined ? bytes : raw !== undefined ? raw : body !== undefined ? JSON.stringify(body) : undefined,
    }),
    env
  );
  let parsed = null;
  try { parsed = await res.json(); } catch { /* empty body */ }
  return { status: res.status, body: parsed, headers: res.headers };
}

export const register = (env, fields, opts) =>
  call(env, "POST", "/api/auth/register", { body: { phone: "0700000000", password: STRONG, ...TERMS, ...fields }, ...opts });

export const login = (env, email, password = STRONG, opts) =>
  call(env, "POST", "/api/auth/login", { body: { email, password }, ...opts });

/** Sets up a business: the first account (Super Admin) plus any invited staff. */
export async function bootstrap(env, staff = []) {
  const owner = await register(env, { name: "Owner One", email: "owner@kash.test" });
  const ownerToken = owner.body.token;
  const people = {};
  for (const [i, s] of staff.entries()) {
    const email = `${s.key}@kash.test`;
    const invited = await call(env, "POST", "/api/users", {
      token: ownerToken,
      body: { name: s.name || s.key, email, role: s.role, division: s.division || "All" },
    });
    if (invited.status !== 201) throw new Error(`invite failed: ${JSON.stringify(invited.body)}`);
    const claimed = await register(env, { name: s.name || s.key, email }, { ip: `198.51.100.${i + 1}` });
    if (claimed.status !== 201) throw new Error(`claim failed: ${JSON.stringify(claimed.body)}`);
    people[s.key] = { token: claimed.body.token, user: claimed.body.user, id: invited.body.id };
  }
  return { owner: { token: ownerToken, user: owner.body.user }, ...people };
}
