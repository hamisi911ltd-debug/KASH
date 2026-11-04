import { describe, it, expect, vi, beforeEach } from "vitest";
import { call, makeEnv, bootstrap } from "./helpers/api.js";

beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

const good = { name: "Amina Wanjiru", email: "amina@example.com", service: "Hospitality & stays", rating: 5, body: "A lovely clean studio and a very warm welcome from the KASH team.", consent: true };

describe("Customer reviews wait for admin approval", () => {
  it("a review from the website is saved as Pending and is not public yet", async () => {
    const env = makeEnv();
    const t = await bootstrap(env);
    const sent = await call(env, "POST", "/api/public/reviews", { body: good });
    expect(sent.status).toBe(201);
    const feed = await call(env, "GET", "/api/public/reviews");
    expect(feed.body).toEqual([]);
    const sync = await call(env, "GET", "/api/sync", { token: t.owner.token });
    expect(sync.body.data.reviews).toHaveLength(1);
    expect(sync.body.data.reviews[0]).toMatchObject({ status: "Pending", email: "amina@example.com", rating: 5 });
  });

  it("an admin approves it, then it is public with a short name and no email", async () => {
    const env = makeEnv();
    const t = await bootstrap(env);
    await call(env, "POST", "/api/public/reviews", { body: good });
    const id = (await call(env, "GET", "/api/sync", { token: t.owner.token })).body.data.reviews[0].id;
    const ok = await call(env, "PATCH", `/api/reviews/${id}`, { token: t.owner.token, body: { status: "Approved" } });
    expect(ok.status).toBe(200);
    const feed = await call(env, "GET", "/api/public/reviews");
    expect(feed.body).toHaveLength(1);
    expect(feed.body[0]).toMatchObject({ name: "Amina W.", rating: 5, service: "Hospitality & stays" });
    expect(JSON.stringify(feed.body)).not.toContain("amina@example.com");
  });

  it("a rejected review never appears", async () => {
    const env = makeEnv();
    const t = await bootstrap(env);
    await call(env, "POST", "/api/public/reviews", { body: good });
    const id = (await call(env, "GET", "/api/sync", { token: t.owner.token })).body.data.reviews[0].id;
    await call(env, "PATCH", `/api/reviews/${id}`, { token: t.owner.token, body: { status: "Rejected" } });
    expect((await call(env, "GET", "/api/public/reviews")).body).toEqual([]);
  });

  it("asks for a name, a real email, a rating, enough words and consent", async () => {
    const env = makeEnv();
    await bootstrap(env);
    const post = (over) => call(env, "POST", "/api/public/reviews", { body: { ...good, ...over } });
    expect((await post({ name: "" })).status).toBe(422);
    expect((await post({ email: "not-an-email" })).status).toBe(422);
    expect((await post({ rating: 0 })).status).toBe(422);
    expect((await post({ body: "too short" })).status).toBe(422);
    expect((await post({ consent: false })).status).toBe(422);
  });

  it("only an admin can moderate: staff can neither read nor approve", async () => {
    const env = makeEnv();
    const t = await bootstrap(env);
    await call(env, "POST", "/api/public/reviews", { body: good });
    const id = (await call(env, "GET", "/api/sync", { token: t.owner.token })).body.data.reviews[0].id;
    const staffKey = Object.keys(t).find((k) => k !== "owner");
    if (!staffKey) return;
    const staff = t[staffKey];
    const sync = await call(env, "GET", "/api/sync", { token: staff.token });
    expect(sync.body.data.reviews).toEqual([]);
    const tryApprove = await call(env, "PATCH", `/api/reviews/${id}`, { token: staff.token, body: { status: "Approved" } });
    expect(tryApprove.status).toBe(403);
  });
});
