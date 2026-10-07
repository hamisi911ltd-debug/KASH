import { describe, it, expect, vi, beforeEach } from "vitest";
import { call, makeEnv, bootstrap } from "./helpers/api.js";

beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

const staff = [
  { key: "it", role: "IT Officer", division: "All" },
  { key: "agroMgr", role: "Agro Manager", division: "Food" },
  { key: "driver", role: "Driver", division: "Transport" },
];

describe("IT Officer - website publishing only", () => {
  it("can publish, edit and remove listings for every division", async () => {
    const env = makeEnv();
    const t = await bootstrap(env, staff);
    const made = await call(env, "POST", "/api/listings", { token: t.it.token, body: { division: "Transport", title: "Tuktuk tours" } });
    expect(made.status).toBe(201);
    const edit = await call(env, "PUT", `/api/listings/${made.body.id}`, { token: t.it.token, body: { ...made.body, price: 900 } });
    expect(edit.status).toBe(200);
    const patch = await call(env, "PATCH", `/api/listings/${made.body.id}`, { token: t.it.token, body: { active: false } });
    expect(patch.status).toBe(200);
    const del = await call(env, "DELETE", `/api/listings/${made.body.id}`, { token: t.it.token });
    expect(del.status).toBe(200);
  });

  it("can upload website photos", async () => {
    const env = makeEnv();
    const t = await bootstrap(env, staff);
    const res = await call(env, "POST", "/api/uploads?division=Food", { token: t.it.token, bytes: new Uint8Array([1, 2, 3]), contentType: "image/png" });
    expect(res.status).toBe(201);
  });

  it("cannot see or change money, users or approvals", async () => {
    const env = makeEnv();
    const t = await bootstrap(env, staff);
    expect((await call(env, "POST", "/api/expenses", { token: t.it.token, body: { amount: 100 } })).status).toBe(403);
    expect((await call(env, "POST", "/api/users", { token: t.it.token, body: { name: "X", email: "x@kash.test", role: "Staff" } })).status).toBe(403);
    const exp = await call(env, "GET", "/api/sync", { token: t.it.token });
    expect(exp.body.data.approvals).toEqual([]);
  });

  it("a Driver still cannot publish", async () => {
    const env = makeEnv();
    const t = await bootstrap(env, staff);
    expect((await call(env, "POST", "/api/listings", { token: t.driver.token, body: { title: "x" } })).status).toBe(403);
  });
});
