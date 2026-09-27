import { describe, it, expect, vi, beforeEach } from "vitest";
import { call, makeEnv, bootstrap } from "./helpers/api.js";

beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

const staff = [
  { key: "agroMgr", role: "Agro Manager", division: "Food" },
  { key: "transMgr", role: "Transport Manager", division: "Transport" },
  { key: "acct", role: "Accountant" },
  { key: "director", role: "Director" },
  { key: "attendant", role: "Agro Attendant", division: "Food" },
];

const PNG_BYTES = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 1, 2, 3, 4]); // not a real PNG, just distinct bytes

describe("uploading a listing photo", () => {
  it("a division Manager can upload one for their own division", async () => {
    const env = makeEnv();
    const t = await bootstrap(env, staff);
    const res = await call(env, "POST", "/api/uploads", { token: t.agroMgr.token, bytes: PNG_BYTES, contentType: "image/png" });
    expect(res.status).toBe(201);
    expect(res.body.url).toMatch(/^https:\/\/api\.test\/uploads\/listings\/Food\/.+\.png$/);
    expect(res.body.key).toMatch(/^listings\/Food\//);
  });

  it("rejects a non-image content type", async () => {
    const env = makeEnv();
    const t = await bootstrap(env, staff);
    const res = await call(env, "POST", "/api/uploads", { token: t.agroMgr.token, bytes: new TextEncoder().encode("<script>evil</script>"), contentType: "text/html" });
    expect(res.status).toBe(400);
  });

  it("rejects an oversized image before it ever reaches storage", async () => {
    const env = makeEnv();
    const t = await bootstrap(env, staff);
    const res = await call(env, "POST", "/api/uploads", { token: t.agroMgr.token, bytes: new Uint8Array(6 * 1024 * 1024), contentType: "image/png" });
    expect(res.status).toBe(413);
    expect(env.IMAGES.store.size).toBe(0);
  });

  it("rejects an empty body", async () => {
    const env = makeEnv();
    const t = await bootstrap(env, staff);
    const res = await call(env, "POST", "/api/uploads", { token: t.agroMgr.token, bytes: new Uint8Array(0), contentType: "image/png" });
    expect(res.status).toBe(400);
  });

  it("the Accountant and a worker role cannot upload, even though one can write and the other can't", async () => {
    const env = makeEnv();
    const t = await bootstrap(env, staff);
    const acctRes = await call(env, "POST", "/api/uploads", { token: t.acct.token, bytes: PNG_BYTES, contentType: "image/png" });
    expect(acctRes.status).toBe(403);
    const workerRes = await call(env, "POST", "/api/uploads", { token: t.attendant.token, bytes: PNG_BYTES, contentType: "image/png" });
    expect(workerRes.status).toBe(403);
  });

  it("a manager cannot upload for another division by asking for it explicitly", async () => {
    const env = makeEnv();
    const t = await bootstrap(env, staff);
    const res = await call(env, "POST", "/api/uploads?division=Hospitality", { token: t.transMgr.token, bytes: PNG_BYTES, contentType: "image/png" });
    expect(res.status).toBe(403);
  });

  it("a company-wide role can upload for whichever division it asks for", async () => {
    const env = makeEnv();
    const t = await bootstrap(env, staff);
    const res = await call(env, "POST", "/api/uploads?division=Hospitality", { token: t.director.token, bytes: PNG_BYTES, contentType: "image/png" });
    expect(res.status).toBe(201);
    expect(res.body.key).toMatch(/^listings\/Hospitality\//);
  });
});

describe("serving an uploaded image back", () => {
  it("needs no sign-in - the public website has to be able to show it", async () => {
    const env = makeEnv();
    const t = await bootstrap(env, staff);
    const uploaded = await call(env, "POST", "/api/uploads", { token: t.agroMgr.token, bytes: PNG_BYTES, contentType: "image/png" });
    const path = new URL(uploaded.body.url).pathname;
    const res = await call(env, "GET", path);
    expect(res.status).toBe(200);
  });

  it("404s for a key nobody uploaded", async () => {
    const res = await call(makeEnv(), "GET", "/uploads/listings/Food/does-not-exist.png");
    expect(res.status).toBe(404);
  });

  it("is cacheable long-term, since the key is never reused", async () => {
    const env = makeEnv();
    const t = await bootstrap(env, staff);
    const uploaded = await call(env, "POST", "/api/uploads", { token: t.agroMgr.token, bytes: PNG_BYTES, contentType: "image/png" });
    const res = await call(env, "GET", new URL(uploaded.body.url).pathname);
    expect(res.headers.get("Cache-Control")).toMatch(/immutable/);
  });
});

describe("deleting an uploaded image", () => {
  it("a division Manager can delete their own upload, and it's really gone", async () => {
    const env = makeEnv();
    const t = await bootstrap(env, staff);
    const uploaded = await call(env, "POST", "/api/uploads", { token: t.agroMgr.token, bytes: PNG_BYTES, contentType: "image/png" });
    const del = await call(env, "DELETE", `/api/uploads/${uploaded.body.key}`, { token: t.agroMgr.token });
    expect(del.status).toBe(200);
    const after = await call(env, "GET", new URL(uploaded.body.url).pathname);
    expect(after.status).toBe(404);
  });

  it("a manager cannot delete another division's upload", async () => {
    const env = makeEnv();
    const t = await bootstrap(env, staff);
    const uploaded = await call(env, "POST", "/api/uploads", { token: t.agroMgr.token, bytes: PNG_BYTES, contentType: "image/png" });
    const del = await call(env, "DELETE", `/api/uploads/${uploaded.body.key}`, { token: t.transMgr.token });
    expect(del.status).toBe(403);
  });

  it("the Accountant cannot delete images", async () => {
    const env = makeEnv();
    const t = await bootstrap(env, staff);
    const uploaded = await call(env, "POST", "/api/uploads", { token: t.agroMgr.token, bytes: PNG_BYTES, contentType: "image/png" });
    const del = await call(env, "DELETE", `/api/uploads/${uploaded.body.key}`, { token: t.acct.token });
    expect(del.status).toBe(403);
  });
});
