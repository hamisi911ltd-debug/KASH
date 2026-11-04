import { describe, it, expect, vi, beforeEach } from "vitest";
import { call, makeEnv, bootstrap } from "./helpers/api.js";

beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("Audit log", () => {
  it("records what people do, newest first, without IP addresses", async () => {
    const env = makeEnv();
    const t = await bootstrap(env);
    await call(env, "POST", "/api/users", { token: t.owner.token, body: { name: "Ops", email: "ops@kash.test", role: "Staff", division: "All", password: "OpsPass2026" } });
    await call(env, "POST", "/api/auth/login", { body: { email: "ops@kash.test", password: "OpsPass2026" } });
    const res = await call(env, "GET", "/api/audit", { token: t.owner.token });
    expect(res.status).toBe(200);
    const events = res.body.entries.map((e) => e.audit);
    expect(events).toContain("user.created");
    expect(events).toContain("auth.login");
    expect(events.indexOf("auth.login")).toBeLessThan(events.indexOf("user.created"));
    expect(JSON.stringify(res.body)).not.toMatch(/"ip"/);
  });

  it("is only for admins and the IT Officer", async () => {
    const env = makeEnv();
    const t = await bootstrap(env);
    const staffKey = Object.keys(t).find((k) => k !== "owner");
    if (!staffKey) return;
    expect((await call(env, "GET", "/api/audit", { token: t[staffKey].token })).status).toBe(403);
    expect((await call(env, "GET", "/api/audit")).status).toBe(401);
  });
});
