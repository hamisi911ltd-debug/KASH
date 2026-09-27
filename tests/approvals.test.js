import { describe, it, expect, vi, beforeEach } from "vitest";
import { call, makeEnv, bootstrap } from "./helpers/api.js";

beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

const staff = [
  { key: "agroMgr", role: "Agro Manager", division: "Food" },
  { key: "agroMgr2", role: "Agro Manager", division: "Food" },
  { key: "transMgr", role: "Transport Manager", division: "Transport" },
  { key: "acct", role: "Accountant" },
  { key: "director", role: "Director" },
];

async function makeExpense(env, token, overrides = {}) {
  const res = await call(env, "POST", "/api/expenses", {
    token, body: { division: "Food", category: "Supplies", amount: 15000, vendor: "Feed Co", ...overrides },
  });
  expect(res.status).toBe(201);
  return res.body;
}

async function makeOrder(env, token, overrides = {}) {
  const res = await call(env, "POST", "/api/orders", {
    token, body: { item: "Bulk chicken order", customer: "Hotel X", amount: 25000, ...overrides },
  });
  expect(res.status).toBe(201);
  return res.body;
}

describe("who needs approval, from the moment a record is created", () => {
  it("a small expense or order never needs approval", async () => {
    const env = makeEnv();
    const t = await bootstrap(env, staff);
    const expense = await makeExpense(env, t.agroMgr.token, { amount: 500 });
    const order = await makeOrder(env, t.agroMgr.token, { amount: 500 });
    expect(expense.approval).toBeNull();
    expect(order.approval).toBeNull();
  });

  it("a big expense or order starts life Pending", async () => {
    const env = makeEnv();
    const t = await bootstrap(env, staff);
    const expense = await makeExpense(env, t.agroMgr.token);
    const order = await makeOrder(env, t.agroMgr.token);
    expect(expense.approval).toEqual({ status: "Pending" });
    expect(order.approval).toEqual({ status: "Pending" });
  });
});

describe("giving the go-ahead", () => {
  it("records exactly who, their role, and when - and it appears on the record itself", async () => {
    const env = makeEnv();
    const t = await bootstrap(env, staff);
    const expense = await makeExpense(env, t.agroMgr.token);
    const before = Date.now();
    const res = await call(env, "POST", `/api/expenses/${expense.id}/approve`, {
      token: t.director.token, body: { decision: "approve", note: "Fine, go ahead" },
    });
    expect(res.status).toBe(200);
    expect(res.body.approval).toMatchObject({ status: "Approved", by: t.director.user.name, role: "Director", note: "Fine, go ahead" });
    expect(new Date(res.body.approval.at).getTime()).toBeGreaterThanOrEqual(before);
  });

  it("rejecting is recorded the same way, distinctly from approving", async () => {
    const env = makeEnv();
    const t = await bootstrap(env, staff);
    const order = await makeOrder(env, t.agroMgr.token);
    const res = await call(env, "POST", `/api/orders/${order.id}/approve`, { token: t.director.token, body: { decision: "reject", note: "Too much stock already" } });
    expect(res.status).toBe(200);
    expect(res.body.approval.status).toBe("Rejected");
  });

  it("nobody can approve their own entry - a second person always has to", async () => {
    const env = makeEnv();
    const t = await bootstrap(env, staff);
    const expense = await makeExpense(env, t.agroMgr.token); // Agro Manager entered it
    const self = await call(env, "POST", `/api/expenses/${expense.id}/approve`, { token: t.agroMgr.token, body: { decision: "approve" } });
    expect(self.status).toBe(403);
    expect(self.body.error).toMatch(/own entry/i);
    // a second Agro Manager can
    const other = await call(env, "POST", `/api/expenses/${expense.id}/approve`, { token: t.agroMgr2.token, body: { decision: "approve" } });
    expect(other.status).toBe(200);
  });

  it("a department head may only approve their own division", async () => {
    const env = makeEnv();
    const t = await bootstrap(env, staff);
    const order = await makeOrder(env, t.agroMgr.token); // Agro/Food order
    const res = await call(env, "POST", `/api/orders/${order.id}/approve`, { token: t.transMgr.token, body: { decision: "approve" } });
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/own division/i);
  });

  it("Super Admin, Admin and Director can approve any division", async () => {
    const env = makeEnv();
    const t = await bootstrap(env, staff);
    const expense = await makeExpense(env, t.agroMgr.token);
    const res = await call(env, "POST", `/api/expenses/${expense.id}/approve`, { token: t.director.token, body: { decision: "approve" } });
    expect(res.status).toBe(200);
  });

  it("the Accountant can approve too - company-wide financial oversight, same as Super Admin/Director", async () => {
    const env = makeEnv();
    const t = await bootstrap(env, staff);
    const expense = await makeExpense(env, t.agroMgr.token);
    const res = await call(env, "POST", `/api/expenses/${expense.id}/approve`, { token: t.acct.token, body: { decision: "approve" } });
    expect(res.status).toBe(200);
    expect(res.body.approval).toMatchObject({ status: "Approved", by: t.acct.user.name, role: "Accountant" });
  });

  it("a Transport Manager still can't approve outside their own division, even though the Accountant can", async () => {
    const env = makeEnv();
    const t = await bootstrap(env, staff);
    const order = await makeOrder(env, t.agroMgr.token); // Agro/Food order
    const res = await call(env, "POST", `/api/orders/${order.id}/approve`, { token: t.transMgr.token, body: { decision: "approve" } });
    expect(res.status).toBe(403);
  });

  it("can't be decided twice", async () => {
    const env = makeEnv();
    const t = await bootstrap(env, staff);
    const expense = await makeExpense(env, t.agroMgr.token);
    await call(env, "POST", `/api/expenses/${expense.id}/approve`, { token: t.director.token, body: { decision: "approve" } });
    const again = await call(env, "POST", `/api/expenses/${expense.id}/approve`, { token: t.director.token, body: { decision: "reject" } });
    expect(again.status).toBe(409);
  });

  it("rejects a nonsense decision, an unapprovable collection, and an unknown record", async () => {
    const env = makeEnv();
    const t = await bootstrap(env, staff);
    const expense = await makeExpense(env, t.agroMgr.token);
    expect((await call(env, "POST", `/api/expenses/${expense.id}/approve`, { token: t.director.token, body: { decision: "maybe" } })).status).toBe(400);
    expect((await call(env, "POST", "/api/users/u1/approve", { token: t.director.token, body: { decision: "approve" } })).status).toBe(400);
    expect((await call(env, "POST", "/api/expenses/nope/approve", { token: t.director.token, body: { decision: "approve" } })).status).toBe(404);
  });
});

describe("the company-wide trail (Super Admin / Admin / Director only)", () => {
  it("a department head's own sync never includes the cross-division log", async () => {
    const env = makeEnv();
    const t = await bootstrap(env, staff);
    const expense = await makeExpense(env, t.agroMgr.token);
    await call(env, "POST", `/api/expenses/${expense.id}/approve`, { token: t.director.token, body: { decision: "approve" } });
    const sync = await call(env, "GET", "/api/sync", { token: t.agroMgr.token });
    expect(sync.body.data.approvals).toEqual([]);
  });

  it("the Accountant sees the same company-wide log, same as Super Admin/Director", async () => {
    const env = makeEnv();
    const t = await bootstrap(env, staff);
    const expense = await makeExpense(env, t.agroMgr.token);
    await call(env, "POST", `/api/expenses/${expense.id}/approve`, { token: t.director.token, body: { decision: "approve" } });
    const sync = await call(env, "GET", "/api/sync", { token: t.acct.token });
    expect(sync.body.data.approvals).toHaveLength(1);
  });

  it("Director's sync shows who approved what, their role, and when", async () => {
    const env = makeEnv();
    const t = await bootstrap(env, staff);
    const expense = await makeExpense(env, t.agroMgr.token, { category: "Fuel", vendor: "Total" });
    await call(env, "POST", `/api/expenses/${expense.id}/approve`, { token: t.director.token, body: { decision: "approve", note: "ok" } });
    const sync = await call(env, "GET", "/api/sync", { token: t.director.token });
    expect(sync.body.data.approvals).toHaveLength(1);
    expect(sync.body.data.approvals[0]).toMatchObject({
      collection: "expenses", division: "Food", by: t.director.user.name, role: "Director", status: "Approved",
      requestedBy: t.agroMgr.user.name, note: "ok",
    });
  });

  it("the trail can never be written, edited or deleted directly - only through /approve", async () => {
    const env = makeEnv();
    const t = await bootstrap(env, staff);
    const attempts = await Promise.all([
      call(env, "POST", "/api/approvals", { token: t.director.token, body: { status: "Approved", by: "Nobody" } }),
      call(env, "PATCH", "/api/approvals/fake", { token: t.director.token, body: { status: "Rejected" } }),
      call(env, "DELETE", "/api/approvals/fake", { token: t.director.token }),
    ]);
    for (const res of attempts) expect([404, 405]).toContain(res.status);
  });
});
