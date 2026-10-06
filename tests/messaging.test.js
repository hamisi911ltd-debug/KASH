import { describe, it, expect, vi, beforeEach } from "vitest";
import { call, makeEnv, bootstrap } from "./helpers/api.js";

beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

const staff = [
  { key: "driver", role: "Driver", division: "Transport" },
  { key: "agroMgr", role: "Agro Manager", division: "Food" },
  { key: "attendant", role: "Agro Attendant", division: "Food" },
];

describe("staff messaging", () => {
  it("anyone can message a colleague directly, whatever their department", async () => {
    const env = makeEnv();
    const t = await bootstrap(env, staff);
    const res = await call(env, "POST", "/api/messages", {
      token: t.driver.token, body: { to: t.agroMgr.user.name, text: "hi", ts: new Date().toISOString(), read: false },
    });
    expect(res.status).toBe(201);
    expect(res.body.from).toBe(t.driver.user.name);
  });

  it("a message to Everyone is delivered to every staff member's sync", async () => {
    const env = makeEnv();
    const t = await bootstrap(env, staff);
    const sent = await call(env, "POST", "/api/messages", {
      token: t.driver.token, body: { to: "Everyone", text: "Team meeting at 9", ts: new Date().toISOString(), read: false },
    });
    expect(sent.status).toBe(201);
    for (const who of ["agroMgr", "attendant", "driver"]) {
      const sync = await call(env, "GET", "/api/sync", { token: t[who].token });
      expect(sync.body.data.messages.some((m) => m.text === "Team meeting at 9"), who).toBe(true);
    }
  });

  it("a direct message is only in the sender's and recipient's sync, not anyone else's", async () => {
    const env = makeEnv();
    const t = await bootstrap(env, staff);
    await call(env, "POST", "/api/messages", {
      token: t.driver.token, body: { to: t.agroMgr.user.name, text: "private", ts: new Date().toISOString(), read: false },
    });
    const other = await call(env, "GET", "/api/sync", { token: t.attendant.token });
    expect(other.body.data.messages.some((m) => m.text === "private")).toBe(false);
    const recipient = await call(env, "GET", "/api/sync", { token: t.agroMgr.token });
    expect(recipient.body.data.messages.some((m) => m.text === "private")).toBe(true);
  });

  it("can't message a name that isn't on the team", async () => {
    const env = makeEnv();
    const t = await bootstrap(env, staff);
    const res = await call(env, "POST", "/api/messages", {
      token: t.driver.token, body: { to: "Nobody Here", text: "hello?", ts: new Date().toISOString(), read: false },
    });
    expect(res.status).toBe(403);
  });
});
