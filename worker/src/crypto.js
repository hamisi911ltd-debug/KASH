/* ============================================================
   Password hashing (PBKDF2) and session tokens (HMAC-signed JWT),
   built entirely on the Workers runtime's native Web Crypto - no
   npm dependency, nothing to bundle.
   ============================================================ */

const enc = new TextEncoder();

function toB64Url(bytes) {
  let str = "";
  bytes.forEach((b) => { str += String.fromCharCode(b); });
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function fromB64Url(b64url) {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/").padEnd(b64url.length + ((4 - (b64url.length % 4)) % 4), "=");
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

/* ---------------------------------------------------------- passwords */

/* Legacy hashes are "salt.hash" and always used 10,000 rounds. New ones are
   "pbkdf2$<rounds>$salt$hash", so the round count travels with the hash and
   can be raised later (see PBKDF2_ITERATIONS in wrangler.toml) without
   locking anybody out. The Workers runtime caps PBKDF2 at 100,000 rounds. */
export const LEGACY_ITERATIONS = 10000;
export const MAX_ITERATIONS = 100000;

export function clampIterations(value) {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n) || n < LEGACY_ITERATIONS) return LEGACY_ITERATIONS;
  return Math.min(n, MAX_ITERATIONS);
}

async function derive(password, salt, iterations) {
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations, hash: "SHA-256" }, key, 256);
  return toB64Url(new Uint8Array(bits));
}

function parseStored(stored) {
  const s = String(stored || "");
  if (s.startsWith("pbkdf2$")) {
    const [, iter, saltB64, hashB64] = s.split("$");
    return { iterations: clampIterations(iter), saltB64, hashB64 };
  }
  const [saltB64, hashB64] = s.split(".");
  return { iterations: LEGACY_ITERATIONS, saltB64, hashB64 };
}

export async function hashPassword(password, iterations = LEGACY_ITERATIONS) {
  const rounds = clampIterations(iterations);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return `pbkdf2$${rounds}$${toB64Url(salt)}$${await derive(password, salt, rounds)}`;
}

export async function verifyPassword(password, stored) {
  const { iterations, saltB64, hashB64 } = parseStored(stored);
  if (!saltB64 || !hashB64) return false;
  const computed = await derive(password, fromB64Url(saltB64), iterations);
  // constant-time-ish compare
  if (computed.length !== hashB64.length) return false;
  let diff = 0;
  for (let i = 0; i < computed.length; i++) diff |= computed.charCodeAt(i) ^ hashB64.charCodeAt(i);
  return diff === 0;
}

/** True when a stored hash was made with fewer rounds than we now want,
    so a successful login can quietly re-hash it stronger. */
export function passwordNeedsUpgrade(stored, wantedIterations) {
  return parseStored(stored).iterations < clampIterations(wantedIterations);
}

/* ---------------------------------------------------------- session tokens (HS256 JWT) */

async function hmacKey(secret) {
  return crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

export async function signToken(payload, secret, expiresInSeconds = 60 * 60 * 24 * 14) {
  const header = { alg: "HS256", typ: "JWT" };
  const body = { ...payload, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + expiresInSeconds };
  const headerB64 = toB64Url(enc.encode(JSON.stringify(header)));
  const bodyB64 = toB64Url(enc.encode(JSON.stringify(body)));
  const data = `${headerB64}.${bodyB64}`;
  const key = await hmacKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return `${data}.${toB64Url(new Uint8Array(sig))}`;
}

export async function verifyToken(token, secret) {
  const parts = String(token || "").split(".");
  if (parts.length !== 3) return null;
  const [headerB64, bodyB64, sigB64] = parts;
  const key = await hmacKey(secret);
  const valid = await crypto.subtle.verify("HMAC", key, fromB64Url(sigB64), enc.encode(`${headerB64}.${bodyB64}`));
  if (!valid) return null;
  try {
    const body = JSON.parse(new TextDecoder().decode(fromB64Url(bodyB64)));
    if (body.exp && body.exp < Math.floor(Date.now() / 1000)) return null;
    return body;
  } catch {
    return null;
  }
}
