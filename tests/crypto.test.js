import { describe, it, expect } from "vitest";
import {
  hashPassword, verifyPassword, passwordNeedsUpgrade, clampIterations, signToken, verifyToken, LEGACY_ITERATIONS,
} from "../worker/src/crypto.js";

/** Builds a hash exactly the way the app did before rounds were stored. */
async function legacyHash(password) {
  const enc = new TextEncoder();
  const b64 = (bytes) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: 10000, hash: "SHA-256" }, key, 256);
  return `${b64(salt)}.${b64(new Uint8Array(bits))}`;
}

describe("passwords", () => {
  it("verifies the right password and rejects a wrong one", async () => {
    const h = await hashPassword("Correct1Horse");
    expect(await verifyPassword("Correct1Horse", h)).toBe(true);
    expect(await verifyPassword("correct1horse", h)).toBe(false);
  });

  it("never stores the password and salts every hash differently", async () => {
    const a = await hashPassword("Same1Password");
    const b = await hashPassword("Same1Password");
    expect(a).not.toContain("Same1Password");
    expect(a).not.toBe(b);
  });

  it("still accepts hashes created before the round count was stored (nobody is locked out)", async () => {
    const old = await legacyHash("Old1Password");
    expect(await verifyPassword("Old1Password", old)).toBe(true);
    expect(await verifyPassword("Nope1Password", old)).toBe(false);
  });

  it("flags older hashes for a silent upgrade once stronger rounds are configured", async () => {
    const old = await legacyHash("Old1Password");
    expect(passwordNeedsUpgrade(old, 10000)).toBe(false);
    expect(passwordNeedsUpgrade(old, 100000)).toBe(true);
    const strong = await hashPassword("Old1Password", 50000);
    expect(passwordNeedsUpgrade(strong, 50000)).toBe(false);
    expect(await verifyPassword("Old1Password", strong)).toBe(true);
  });

  it("keeps the round count inside what Workers allows", () => {
    expect(clampIterations(undefined)).toBe(LEGACY_ITERATIONS);
    expect(clampIterations("abc")).toBe(LEGACY_ITERATIONS);
    expect(clampIterations(5)).toBe(LEGACY_ITERATIONS);
    expect(clampIterations(10_000_000)).toBe(100000);
  });

  it("returns false (not a crash) for garbage stored values", async () => {
    expect(await verifyPassword("x", "")).toBe(false);
    expect(await verifyPassword("x", undefined)).toBe(false);
    expect(await verifyPassword("x", "not-a-hash")).toBe(false);
  });
});

describe("session tokens", () => {
  const secret = "s".repeat(40);

  it("round-trips a payload", async () => {
    const t = await signToken({ sub: "u1" }, secret);
    expect((await verifyToken(t, secret)).sub).toBe("u1");
  });

  it("rejects a token signed with a different secret", async () => {
    const t = await signToken({ sub: "u1" }, secret);
    expect(await verifyToken(t, "z".repeat(40))).toBeNull();
  });

  it("rejects an expired token", async () => {
    const t = await signToken({ sub: "u1" }, secret, -10);
    expect(await verifyToken(t, secret)).toBeNull();
  });

  it("rejects a payload edited after signing", async () => {
    const t = await signToken({ sub: "u1" }, secret);
    const [h, , s] = t.split(".");
    const evil = btoa(JSON.stringify({ sub: "admin", exp: 9999999999 })).replace(/=+$/, "");
    expect(await verifyToken(`${h}.${evil}.${s}`, secret)).toBeNull();
  });

  it("rejects malformed tokens", async () => {
    for (const bad of ["", "a", "a.b", "a.b.c.d", null, undefined]) {
      expect(await verifyToken(bad, secret)).toBeNull();
    }
  });
});
