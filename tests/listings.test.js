import { describe, it, expect, vi, beforeEach } from "vitest";
import { call, makeEnv, bootstrap } from "./helpers/api.js";

beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

const staff = [
  { key: "agroMgr", role: "Agro Manager", division: "Food" },
  { key: "transMgr", role: "Transport Manager", division: "Transport" },
  { key: "hospMgr", role: "Hospitality Manager", division: "Hospitality" },
  { key: "acct", role: "Accountant" },
  { key: "director", role: "Director" },
  { key: "attendant", role: "Agro Attendant", division: "Food" },
];

describe("managing a division's website listings", () => {
  it("a division Manager can publish, edit and remove their own listing", async () => {
    const env = makeEnv();
    const t = await bootstrap(env, staff);
    const create = await call(env, "POST", "/api/listings", {
      token: t.agroMgr.token, body: { title: "Whole Chicken", description: "Fresh broiler", price: 450, meta: "per kg" },
    });
    expect(create.status).toBe(201);
    expect(create.body).toMatchObject({ division: "Food", title: "Whole Chicken", active: true });

    const edit = await call(env, "PUT", `/api/listings/${create.body.id}`, {
      token: t.agroMgr.token, body: { ...create.body, price: 500 },
    });
    expect(edit.status).toBe(200);
    expect(edit.body.price).toBe(500);

    const del = await call(env, "DELETE", `/api/listings/${create.body.id}`, { token: t.agroMgr.token });
    expect(del.status).toBe(200);
  });

  it("a manager can't publish, edit or delete another division's listing", async () => {
    const env = makeEnv();
    const t = await bootstrap(env, staff);
    const foodListing = await call(env, "POST", "/api/listings", { token: t.agroMgr.token, body: { title: "Eggs", price: 18 } });
    expect(foodListing.status).toBe(201);

    const wrongCreate = await call(env, "POST", "/api/listings", { token: t.transMgr.token, body: { division: "Food", title: "Sneaky" } });
    expect(wrongCreate.status).toBe(403);

    const wrongEdit = await call(env, "PUT", `/api/listings/${foodListing.body.id}`, { token: t.transMgr.token, body: { ...foodListing.body, price: 1 } });
    expect(wrongEdit.status).toBe(403);

    const wrongDelete = await call(env, "DELETE", `/api/listings/${foodListing.body.id}`, { token: t.transMgr.token });
    expect(wrongDelete.status).toBe(403);
  });

  it("the Accountant cannot manage listings, even though they can write everywhere else", async () => {
    const env = makeEnv();
    const t = await bootstrap(env, staff);
    const res = await call(env, "POST", "/api/listings", { token: t.acct.token, body: { division: "Transport", title: "Truck" } });
    expect(res.status).toBe(403);
  });

  it("a worker (writeOwn, not write) cannot manage listings", async () => {
    const env = makeEnv();
    const t = await bootstrap(env, staff);
    const res = await call(env, "POST", "/api/listings", { token: t.attendant.token, body: { title: "Eggs" } });
    expect(res.status).toBe(403);
  });

  it("Director/Super Admin (company-wide) can publish for any division", async () => {
    const env = makeEnv();
    const t = await bootstrap(env, staff);
    const res = await call(env, "POST", "/api/listings", { token: t.director.token, body: { division: "Hospitality", title: "Garden View Apartment", price: 10500 } });
    expect(res.status).toBe(201);
    // ...and edit/delete it too, across the division boundary that stops a Manager.
    const edit = await call(env, "PUT", `/api/listings/${res.body.id}`, { token: t.director.token, body: { ...res.body, price: 11000 } });
    expect(edit.status).toBe(200);
  });

  it("hides a bad photo URL rather than trusting whatever was pasted in", async () => {
    const env = makeEnv();
    const t = await bootstrap(env, staff);
    const res = await call(env, "POST", "/api/listings", {
      token: t.hospMgr.token, body: { title: "Room", imageUrl: "javascript:alert(1)" },
    });
    expect(res.status).toBe(201);
    expect(res.body.imageUrl).toBe("");
  });
});

describe("the public listings feed the marketing site reads", () => {
  it("needs no sign-in at all", async () => {
    const env = makeEnv();
    const res = await call(env, "GET", "/api/public/listings");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("only ever returns active listings, and only the public-safe fields", async () => {
    const env = makeEnv();
    const t = await bootstrap(env, staff);
    const live = await call(env, "POST", "/api/listings", { token: t.agroMgr.token, body: { title: "Live Chicken", price: 450, imageUrl: "https://example.com/a.jpg" } });
    const hidden = await call(env, "POST", "/api/listings", { token: t.agroMgr.token, body: { title: "Draft Item", active: false } });

    const res = await call(env, "GET", "/api/public/listings");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({ id: live.body.id, title: "Live Chicken", division: "Food", price: 450 });
    expect(res.body.some((l) => l.id === hidden.body.id)).toBe(false);
    // never leaks who created it or any internal bookkeeping field
    expect(res.body[0].createdBy).toBeUndefined();
  });

  it("can be filtered to one division, for the page that only wants its own", async () => {
    const env = makeEnv();
    const t = await bootstrap(env, staff);
    await call(env, "POST", "/api/listings", { token: t.agroMgr.token, body: { title: "Eggs" } });
    await call(env, "POST", "/api/listings", { token: t.transMgr.token, body: { title: "Truck" } });

    const food = await call(env, "GET", "/api/public/listings?division=Food");
    expect(food.body.every((l) => l.division === "Food")).toBe(true);
    expect(food.body).toHaveLength(1);
  });

  it("is reachable cross-origin even when the authenticated API is locked to one origin", async () => {
    const env = makeEnv({ ALLOWED_ORIGINS: "https://app.kash.co.ke" });
    const res = await call(env, "GET", "/api/public/listings", { origin: "https://kash-suppliers.pages.dev" });
    expect(res.status).toBe(200);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
  });

  it("is allowed to be cached briefly, unlike every authenticated response", async () => {
    const env = makeEnv();
    const pub = await call(env, "GET", "/api/public/listings");
    expect(pub.headers.get("Cache-Control")).toBe("public, max-age=60");
    const priv = await call(makeEnv(), "GET", "/api/health");
    expect(priv.headers.get("Cache-Control")).toBe("no-store");
  });
});
