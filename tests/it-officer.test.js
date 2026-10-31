import { describe, it, expect, vi, beforeEach } from "vitest";
import { call, makeEnv, bootstrap } from "./helpers/api.js";
import { canOpenView } from "../src/lib/auth.js";

beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

const staff = [
  { key: "it", role: "IT Officer", division: "All" },
  { key: "agroMgr", role: "Agro Manager", division: "Food" },
  { key: "driver", role: "Driver", division: "Transport" },
];

describe("IT Officer - signing in", () => {
  const password = "ItOfficer2026";
  const setUp = { name: "Ivy", phone: "+254700000000", acceptedTerms: true };

  it("an invited IT Officer can't sign in until they choose a password, then keeps the role and signs in", async () => {
    const env = makeEnv();
    const t = await bootstrap(env);
    const email = "ivy@kash.test";
    await call(env, "POST", "/api/users", { token: t.owner.token, body: { name: "Ivy", email, role: "IT Officer", division: "All" } });

    const early = await call(env, "POST", "/api/auth/login", { body: { email, password } });
    expect(early.status).toBe(401);

    const claimed = await call(env, "POST", "/api/auth/register", { body: { ...setUp, email, password } });
    expect(claimed.status).toBe(201);
    expect(claimed.body.user).toMatchObject({ role: "IT Officer", division: "All", status: "Active" });

    const back = await call(env, "POST", "/api/auth/login", { body: { email, password } });
    expect(back.status).toBe(200);
    expect(canOpenView(back.body.user.role, "website")).toBe(true);
  });

  it("the sign-up screen doesn't let an uninvited email in", async () => {
    const env = makeEnv();
    await bootstrap(env);
    const res = await call(env, "POST", "/api/auth/register", { body: { ...setUp, email: "stranger@kash.test", password } });
    expect(res.status).toBe(403);
  });
});

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

  it("cannot see or change money or approvals", async () => {
    const env = makeEnv();
    const t = await bootstrap(env, staff);
    expect((await call(env, "POST", "/api/expenses", { token: t.it.token, body: { amount: 100 } })).status).toBe(403);
    expect((await call(env, "POST", "/api/payments", { token: t.it.token, body: { amount: 100 } })).status).toBe(403);
    const exp = await call(env, "GET", "/api/sync", { token: t.it.token });
    expect(exp.body.data.approvals).toEqual([]);
  });

  it("can invite and manage user accounts, but can't touch a Super Admin or promote anyone into one", async () => {
    const env = makeEnv();
    const t = await bootstrap(env, staff);
    const invited = await call(env, "POST", "/api/users", { token: t.it.token, body: { name: "New Hire", email: "newhire@kash.test", role: "Staff" } });
    expect(invited.status).toBe(201);
    const promote = await call(env, "PATCH", `/api/users/${invited.body.id}`, { token: t.it.token, body: { role: "Super Admin" } });
    expect(promote.status).toBe(403);
    const suspend = await call(env, "PATCH", `/api/users/${invited.body.id}`, { token: t.it.token, body: { status: "Suspended" } });
    expect(suspend.status).toBe(200);
    const superAdmin = await call(env, "GET", "/api/sync", { token: t.it.token });
    const sa = superAdmin.body.data.users.find((u) => u.role === "Super Admin");
    const touchSa = await call(env, "PATCH", `/api/users/${sa.id}`, { token: t.it.token, body: { status: "Suspended" } });
    expect(touchSa.status).toBe(403);
  });

  it("a Driver still cannot publish", async () => {
    const env = makeEnv();
    const t = await bootstrap(env, staff);
    expect((await call(env, "POST", "/api/listings", { token: t.driver.token, body: { title: "x" } })).status).toBe(403);
  });
});
