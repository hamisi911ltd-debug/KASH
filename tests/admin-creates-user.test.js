import { describe, it, expect, vi, beforeEach } from "vitest";
import { call, makeEnv, bootstrap } from "./helpers/api.js";

beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("An admin creates a person's account inside the ERP", () => {
  const email = "ops@kash.test";
  const password = "OpsPass2026";

  it("signs in straight away with the password the admin set, and the password is never stored or returned in plain text", async () => {
    const env = makeEnv();
    const t = await bootstrap(env);
    const made = await call(env, "POST", "/api/users", { token: t.owner.token, body: { name: "Ops", email, role: "Staff", division: "All", password } });
    expect(made.status).toBe(201);
    expect(made.body).toMatchObject({ email, status: "Active" });
    expect(JSON.stringify(made.body)).not.toContain(password);
    expect(made.body.passwordHash).toBeUndefined();

    const signedIn = await call(env, "POST", "/api/auth/login", { body: { email, password } });
    expect(signedIn.status).toBe(200);
    expect(signedIn.body.user.role).toBe("Staff");
  });

  it("refuses a weak password, and a wrong one can't sign in", async () => {
    const env = makeEnv();
    const t = await bootstrap(env);
    const weak = await call(env, "POST", "/api/users", { token: t.owner.token, body: { name: "Ops", email, role: "Staff", division: "All", password: "short" } });
    expect(weak.status).toBe(400);
    await call(env, "POST", "/api/users", { token: t.owner.token, body: { name: "Ops", email, role: "Staff", division: "All", password } });
    const wrong = await call(env, "POST", "/api/auth/login", { body: { email, password: "WrongPass2026" } });
    expect(wrong.status).toBe(401);
  });

  it("lets the admin reset that person's password later", async () => {
    const env = makeEnv();
    const t = await bootstrap(env);
    const made = await call(env, "POST", "/api/users", { token: t.owner.token, body: { name: "Ops", email, role: "Staff", division: "All", password } });
    const reset = await call(env, "PUT", `/api/users/${made.body.id}`, { token: t.owner.token, body: { ...made.body, password: "NewPass2027" } });
    expect(reset.status).toBe(200);
    expect(JSON.stringify(reset.body)).not.toContain("NewPass2027");
    expect((await call(env, "POST", "/api/auth/login", { body: { email, password } })).status).toBe(401);
    expect((await call(env, "POST", "/api/auth/login", { body: { email, password: "NewPass2027" } })).status).toBe(200);
  });
});
