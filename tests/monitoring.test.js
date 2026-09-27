import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { SourceMapGenerator } from "source-map-js";
import { call, login, register, makeEnv, bootstrap, STRONG } from "./helpers/api.js";
import { decodeStack } from "../scripts/decode-stack.mjs";

let logged;
beforeEach(() => {
  logged = [];
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation((...a) => logged.push(a.join(" ")));
});
afterEach(() => vi.unstubAllGlobals());

describe("human check (Turnstile)", () => {
  const stubTurnstile = (success) => {
    const mock = vi.fn(async () => new Response(JSON.stringify({ success }), { status: 200 }));
    vi.stubGlobal("fetch", mock);
    return mock;
  };

  it("is skipped when no secret is configured (local dev and the demo)", async () => {
    const env = makeEnv();
    const t = await bootstrap(env);
    expect((await login(env, "owner@kash.test")).status).toBe(200);
    expect(t.owner.token).toBeTruthy();
  });

  it("refuses sign-in and sign-up with no token once it's switched on", async () => {
    const env = makeEnv({ TURNSTILE_SECRET: "secret" });
    stubTurnstile(true);
    const signIn = await login(env, "owner@kash.test");
    expect(signIn.status).toBe(400);
    expect(signIn.body.error).toMatch(/human check/i);
    const signUp = await register(env, { name: "A", email: "a@kash.test" });
    expect(signUp.status).toBe(400);
  });

  it("lets a real person through, and checks the token with Cloudflare", async () => {
    const env = makeEnv({ TURNSTILE_SECRET: "secret" });
    const fetchMock = stubTurnstile(true);
    const res = await register(env, { name: "Owner", email: "owner@kash.test", turnstileToken: "good-token" });
    expect(res.status).toBe(201);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain("challenges.cloudflare.com/turnstile/v0/siteverify");
    expect(init.body.get("response")).toBe("good-token");
    expect(init.body.get("secret")).toBe("secret");
  });

  it("blocks a token Cloudflare rejects, and doesn't count it against a real person's lockout", async () => {
    const env = makeEnv({ TURNSTILE_SECRET: "secret" });
    stubTurnstile(false);
    for (let i = 0; i < 8; i++) {
      const r = await login(env, "owner@kash.test", STRONG, { ip: "192.0.2.9" }).catch(() => null);
      expect(r.status).toBe(400);
    }
    // Bots that fail the check never reached the database (no failure counters were written).
    expect([...env.KASH_KV.store.keys()].some((k) => k.startsWith("rl:"))).toBe(false);
  });

  it("says so, rather than crashing, if Cloudflare can't be reached", async () => {
    const env = makeEnv({ TURNSTILE_SECRET: "secret" });
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("network down"); }));
    const res = await login(env, "owner@kash.test", STRONG, { });
    // login sends no token here, so it's rejected before the network call
    expect([400, 503]).toContain(res.status);
    const withToken = await call(env, "POST", "/api/auth/login", { body: { email: "o@k.test", password: STRONG, turnstileToken: "t" } });
    expect(withToken.status).toBe(503);
  });
});

describe("free-plan safety", () => {
  it("sign-in still works if the failed-attempt counter can't be written (daily KV write cap)", async () => {
    const env = makeEnv();
    await bootstrap(env);
    const realPut = env.KASH_KV.put;
    env.KASH_KV.put = async (key, ...rest) => {
      if (key.startsWith("rl:")) throw new Error("KV put() limit exceeded for the day");
      return realPut(key, ...rest);
    };
    expect((await login(env, "owner@kash.test", "WrongPass1")).status).toBe(401);
    expect((await login(env, "owner@kash.test")).status).toBe(200);
  });
});

describe("health check", () => {
  it("reports ok for an uptime monitor, with no secrets in it", async () => {
    const res = await call(makeEnv(), "GET", "/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ ok: true, configured: true, storage: true });
    expect(JSON.stringify(res.body)).not.toContain("test-secret");
  });

  it("goes red when the signing secret is missing or storage is down", async () => {
    expect((await call(makeEnv({ JWT_SECRET: "" }), "GET", "/api/health")).status).toBe(503);
    const env = makeEnv();
    env.KASH_KV.get = async () => { throw new Error("down"); };
    expect((await call(env, "GET", "/api/health")).status).toBe(503);
  });
});

describe("finding a crash", () => {
  it("tags a server error with a reference that appears in both the reply and the log", async () => {
    const env = makeEnv();
    env.KASH_KV.get = async (k) => { if (k === "data:seeded") return "1"; throw new Error("boom: kv exploded"); };
    const res = await login(env, "a@b.co");
    expect(res.status).toBe(500);
    const ref = res.body.error.match(/Ref: (\w{8})/)?.[1];
    expect(ref).toBeTruthy();
    const line = logged.find((l) => l.includes(ref));
    expect(line).toContain("boom: kv exploded"); // the detail is in the log...
    expect(res.body.error).not.toContain("kv exploded"); // ...never in the reply
    expect(line).toContain("/api/auth/login");
  });

  it("logs a crash reported by the website, capped in size, without storing anything", async () => {
    const env = makeEnv();
    const res = await call(env, "POST", "/api/client-error", {
      body: { message: "x".repeat(5000), stack: "at Foo (index-abc.js:1:2)", page: "/reports", release: "1.0.0+2026", ref: "abc12345", role: "Accountant" },
    });
    expect(res.status).toBe(202);
    const entry = JSON.parse(logged.find((l) => l.includes("clientError")));
    expect(entry.clientError.message).toHaveLength(500);
    expect(entry.clientError).toMatchObject({ ref: "abc12345", release: "1.0.0+2026", role: "Accountant", page: "/reports" });
    // Only the empty first-run collections exist; the report itself wrote nothing.
    expect([...env.KASH_KV.store.values()].join("")).not.toContain("abc12345");
  });

  it("stops one visitor flooding the logs", async () => {
    const env = makeEnv();
    for (let i = 0; i < 40; i++) await call(env, "POST", "/api/client-error", { body: { message: `m${i}` }, ip: "192.0.2.77" });
    expect(logged.filter((l) => l.includes("clientError")).length).toBe(20);
  });

  it("turns a minified stack line back into the real file and line", () => {
    const dir = mkdtempSync(join(tmpdir(), "kash-maps-"));
    mkdirSync(join(dir, "build-1", "assets"), { recursive: true });
    const gen = new SourceMapGenerator({ file: "index-abc.js" });
    gen.addMapping({ generated: { line: 1, column: 100 }, source: "../../src/views/TransportView.jsx", original: { line: 212, column: 9 }, name: "saveTrip" });
    writeFileSync(join(dir, "build-1", "assets", "index-abc.js.map"), gen.toString());
    const root = pathToFileURL(dir + "/");

    const out = decodeStack("TypeError: x is undefined\n    at t (https://app.kash.co.ke/assets/index-abc.js:1:100)", root);
    expect(out).toContain("src/views/TransportView.jsx:212:9 (saveTrip)");
    expect(out).toContain("TypeError: x is undefined"); // other lines untouched
  });

  it("says plainly when it has no map for a file, instead of guessing", () => {
    const dir = mkdtempSync(join(tmpdir(), "kash-maps-"));
    expect(decodeStack("at f (index-zzz.js:1:1)", pathToFileURL(dir + "/"))).toContain("no source map found");
  });
});
