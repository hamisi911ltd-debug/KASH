import { describe, it, expect, vi, beforeEach } from "vitest";
import { call, login, register, makeEnv, bootstrap, STRONG } from "./helpers/api.js";

beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {}); // audit lines
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("sign-up", () => {
  it("makes the very first account Super Admin", async () => {
    const env = makeEnv();
    const res = await register(env, { name: "Owner", email: "owner@kash.test" });
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe("Super Admin");
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it("requires the 18+/terms confirmation", async () => {
    const env = makeEnv();
    const res = await call(env, "POST", "/api/auth/register", {
      body: { name: "A", email: "a@kash.test", phone: "1", password: STRONG },
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/18/);
  });

  it.each([
    ["too short", "Ab1"],
    ["no number", "onlyletters"],
    ["no letter", "12345678"],
  ])("rejects a weak password (%s)", async (_label, password) => {
    const res = await register(makeEnv(), { name: "A", email: "a@kash.test", password });
    expect(res.status).toBe(400);
  });

  it("is closed to strangers once the business exists", async () => {
    const env = makeEnv();
    await bootstrap(env);
    const res = await register(env, { name: "Stranger", email: "stranger@evil.test" });
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/invitation/i);
  });

  it("lets an invited person claim their invitation, keeping the role chosen for them", async () => {
    const env = makeEnv();
    const t = await bootstrap(env, [{ key: "peter", role: "Transport Manager", division: "Transport" }]);
    expect(t.peter.user.role).toBe("Transport Manager");
    expect(t.peter.user.status).toBe("Active");
  });

  it("is open (as Staff) only when OPEN_SIGNUP is on, as on the public demo", async () => {
    const env = makeEnv({ OPEN_SIGNUP: "true" });
    await bootstrap(env);
    const res = await register(env, { name: "Visitor", email: "visitor@kash.test" });
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe("Staff");
  });

  it("doesn't reveal whether an email already has an account", async () => {
    const env = makeEnv();
    await bootstrap(env);
    const existing = await register(env, { name: "X", email: "owner@kash.test" });
    const unknown = await register(env, { name: "Y", email: "nobody@kash.test" }, { ip: "198.51.100.99" });
    expect(existing.status).toBe(unknown.status);
    expect(existing.body.error).toBe(unknown.body.error);
  });
});

describe("sign-in", () => {
  it("gives the same answer for a wrong password and an unknown email", async () => {
    const env = makeEnv();
    await bootstrap(env);
    const wrong = await login(env, "owner@kash.test", "WrongPass1");
    const unknown = await login(env, "ghost@kash.test", "WrongPass1", { ip: "198.51.100.5" });
    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(wrong.body.error).toBe(unknown.body.error);
  });

  it("locks an account after 5 wrong passwords - even for the right one afterwards", async () => {
    const env = makeEnv();
    await bootstrap(env);
    for (let i = 0; i < 5; i++) {
      expect((await login(env, "owner@kash.test", "WrongPass1")).status).toBe(401);
    }
    const blocked = await login(env, "owner@kash.test", STRONG);
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("Retry-After")).toBeTruthy();
  });

  it("blocks one IP that sprays many different emails", async () => {
    const env = makeEnv();
    await bootstrap(env);
    let last;
    for (let i = 0; i < 26; i++) last = await login(env, `guess${i}@kash.test`, "WrongPass1", { ip: "192.0.2.50" });
    expect(last.status).toBe(429);
  });

  it("a successful sign-in resets the failed-attempt counter", async () => {
    const env = makeEnv();
    await bootstrap(env);
    for (let i = 0; i < 4; i++) await login(env, "owner@kash.test", "WrongPass1");
    expect((await login(env, "owner@kash.test", STRONG)).status).toBe(200);
    for (let i = 0; i < 4; i++) expect((await login(env, "owner@kash.test", "WrongPass1")).status).toBe(401);
  });

  it("stops a suspended person's existing token working immediately", async () => {
    const env = makeEnv();
    const t = await bootstrap(env, [{ key: "sam", role: "Staff" }]);
    expect((await call(env, "GET", "/api/me", { token: t.sam.token })).status).toBe(200);
    const suspend = await call(env, "PATCH", `/api/users/${t.sam.id}`, { token: t.owner.token, body: { status: "Suspended" } });
    expect(suspend.status).toBe(200);
    expect((await call(env, "GET", "/api/me", { token: t.sam.token })).status).toBe(401);
    expect((await login(env, "sam@kash.test")).status).toBe(403);
  });

  it("rejects a forged or tampered token", async () => {
    const env = makeEnv();
    const t = await bootstrap(env);
    const [h, b, s] = t.owner.token.split(".");
    const forged = `${h}.${b}.${s.slice(0, -2)}xx`;
    expect((await call(env, "GET", "/api/me", { token: forged })).status).toBe(401);
    expect((await call(env, "GET", "/api/me")).status).toBe(401);
  });
});

describe("privilege escalation (the hole this suite exists to keep shut)", () => {
  const staff = [
    { key: "tm", role: "Transport Manager", division: "Transport" },
    { key: "acct", role: "Accountant" },
    { key: "adm", role: "Admin" },
    { key: "victim", role: "Staff" },
  ];

  it("a division Manager cannot promote themselves, invite anyone, or delete anyone", async () => {
    const env = makeEnv();
    const t = await bootstrap(env, staff);
    const promote = await call(env, "PATCH", `/api/users/${t.tm.id}`, { token: t.tm.token, body: { role: "Super Admin" } });
    expect(promote.status).toBe(403);
    const invite = await call(env, "POST", "/api/users", { token: t.tm.token, body: { name: "X", email: "x@kash.test", role: "Admin" } });
    expect(invite.status).toBe(403);
    const del = await call(env, "DELETE", `/api/users/${t.victim.id}`, { token: t.tm.token });
    expect(del.status).toBe(403);
    const me = await call(env, "GET", "/api/me", { token: t.tm.token });
    expect(me.body.user.role).toBe("Transport Manager");
  });

  it("an Accountant can't edit users either", async () => {
    const env = makeEnv();
    const t = await bootstrap(env, staff);
    const res = await call(env, "PUT", `/api/users/${t.victim.id}`, { token: t.acct.token, body: { role: "Admin" } });
    expect(res.status).toBe(403);
  });

  it("nobody can plant a password hash through the API to take over an account", async () => {
    const env = makeEnv();
    const t = await bootstrap(env, staff);
    const stored = JSON.parse(env.KASH_KV.store.get("data:users"));
    const ownerHash = stored.find((u) => u.email === "owner@kash.test").passwordHash;
    await call(env, "PATCH", `/api/users/${t.victim.id}`, { token: t.adm.token, body: { passwordHash: ownerHash, name: "Renamed" } });
    await call(env, "PUT", `/api/users/${t.victim.id}`, { token: t.adm.token, body: { passwordHash: ownerHash } });
    const after = JSON.parse(env.KASH_KV.store.get("data:users")).find((u) => u.id === t.victim.id);
    expect(after.passwordHash).not.toBe(ownerHash);
    expect(after.name).toBe("Renamed"); // ordinary fields still update
    // ...and the victim's own password still works.
    expect((await login(env, "victim@kash.test")).status).toBe(200);
  });

  it("an Admin can't create or promote a Super Admin - only a Super Admin can", async () => {
    const env = makeEnv();
    const t = await bootstrap(env, staff);
    const create = await call(env, "POST", "/api/users", { token: t.adm.token, body: { name: "Z", email: "z@kash.test", role: "Super Admin" } });
    expect(create.status).toBe(403);
    const promote = await call(env, "PATCH", `/api/users/${t.victim.id}`, { token: t.adm.token, body: { role: "Super Admin" } });
    expect(promote.status).toBe(403);
    const touchOwner = await call(env, "PATCH", `/api/users/${t.owner.user.id}`, { token: t.adm.token, body: { status: "Suspended" } });
    expect(touchOwner.status).toBe(403);
  });

  it("the last Super Admin can't be demoted, suspended or deleted, and nobody deletes themselves", async () => {
    const env = makeEnv();
    const t = await bootstrap(env, staff);
    const id = t.owner.user.id;
    expect((await call(env, "PATCH", `/api/users/${id}`, { token: t.owner.token, body: { role: "Admin" } })).status).toBe(400);
    expect((await call(env, "PATCH", `/api/users/${id}`, { token: t.owner.token, body: { status: "Suspended" } })).status).toBe(400);
    expect((await call(env, "DELETE", `/api/users/${id}`, { token: t.owner.token })).status).toBe(400);
    expect((await call(env, "DELETE", `/api/users/${t.adm.id}`, { token: t.adm.token })).status).toBe(400);
  });

  it("an invitation is always created as an unclaimed placeholder, whatever the request says", async () => {
    const env = makeEnv();
    const t = await bootstrap(env);
    const res = await call(env, "POST", "/api/users", {
      token: t.owner.token,
      body: { name: "Sneaky", email: "sneaky@kash.test", role: "Staff", status: "Active", passwordHash: "x.y" },
    });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe("Invited");
    expect(res.body.passwordHash).toBeUndefined();
    const stored = JSON.parse(env.KASH_KV.store.get("data:users")).find((u) => u.email === "sneaky@kash.test");
    expect(stored.passwordHash).toBeUndefined();
  });

  it("deleting a user frees their email for a fresh invitation", async () => {
    const env = makeEnv();
    const t = await bootstrap(env, [{ key: "temp", role: "Staff" }]);
    expect((await call(env, "DELETE", `/api/users/${t.temp.id}`, { token: t.owner.token })).status).toBe(200);
    expect(env.KASH_KV.store.has("email:temp@kash.test")).toBe(false);
  });

  it("a Driver with no linked driver record sees no trips, not the whole fleet", async () => {
    const env = makeEnv();
    const t = await bootstrap(env, [{ key: "dan", role: "Driver", division: "Transport" }]);
    await call(env, "POST", "/api/trips", { token: t.owner.token, body: { origin: "A", destination: "B", amount: 1000 } });
    const sync = await call(env, "GET", "/api/sync", { token: t.dan.token });
    expect(sync.body.data.trips).toEqual([]);
    expect(sync.body.data.orders).toEqual([]);
  });

  it("never sends password hashes to any browser", async () => {
    const env = makeEnv();
    const t = await bootstrap(env, staff);
    const sync = await call(env, "GET", "/api/sync", { token: t.owner.token });
    expect(JSON.stringify(sync.body)).not.toMatch(/passwordHash|pbkdf2\$/);
  });
});

describe("hardening of the transport itself", () => {
  it("answers bad JSON with 400, not a 500 that leaks internals", async () => {
    const env = makeEnv();
    const res = await call(env, "POST", "/api/auth/login", { raw: "{not json" });
    expect(res.status).toBe(400);
    expect(res.body.error).not.toMatch(/Unexpected|position|JSON\.parse/i);
  });

  it("refuses oversized bodies", async () => {
    const env = makeEnv();
    const res = await call(env, "POST", "/api/auth/login", { raw: JSON.stringify({ email: "a@b.co", password: "x".repeat(300_000) }) });
    expect(res.status).toBe(413);
  });

  it("refuses to run without a signing secret", async () => {
    const env = makeEnv({ JWT_SECRET: "" });
    const res = await login(env, "a@b.co");
    expect(res.status).toBe(500);
  });

  it("hides internal error details", async () => {
    const env = makeEnv();
    env.KASH_KV.get = async () => { throw new Error("secret internal detail: db host 10.0.0.1"); };
    const res = await login(env, "a@b.co");
    expect(res.status).toBe(500);
    expect(JSON.stringify(res.body)).not.toMatch(/10\.0\.0\.1|secret internal/);
  });

  it("only allows the configured websites to call it, when ALLOWED_ORIGINS is set", async () => {
    const env = makeEnv({ ALLOWED_ORIGINS: "https://app.kash.co.ke" });
    const ok = await call(env, "GET", "/api/me", { origin: "https://app.kash.co.ke" });
    const bad = await call(env, "GET", "/api/me", { origin: "https://evil.example" });
    expect(ok.headers.get("Access-Control-Allow-Origin")).toBe("https://app.kash.co.ke");
    expect(bad.headers.get("Access-Control-Allow-Origin")).toBeNull();
  });

  it("adds security headers to every response", async () => {
    const res = await call(makeEnv(), "GET", "/api/me");
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    expect(res.headers.get("Strict-Transport-Security")).toMatch(/max-age/);
  });

  it("answers CORS preflight", async () => {
    const res = await call(makeEnv(), "OPTIONS", "/api/sync");
    expect(res.status).toBe(204);
  });
});
