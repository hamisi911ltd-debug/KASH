import { describe, it, expect, vi, beforeEach } from "vitest";
import { call, makeEnv, bootstrap } from "./helpers/api.js";
import { readFileSync } from "node:fs";
import { STANDARD_RATES, RATE_NOTES, RATE_ORIGIN, RATE_TARIFF, RATE_VAT_PERCENT, standardRates, sortRates, vatOn, withVat } from "../src/lib/rates.js";
import { canOpenView } from "../src/lib/auth.js";
import { canEditRates } from "../src/lib/constants.js";
import { buildSeedData } from "../src/lib/seed.js";
import { buildForms } from "../src/lib/forms.js";

beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

const staff = [
  { key: "it", role: "IT Officer", division: "All" },
  { key: "transMgr", role: "Transport Manager", division: "Transport" },
  { key: "agroMgr", role: "Agro Manager", division: "Food" },
  { key: "driver", role: "Driver", division: "Transport" },
  { key: "acct", role: "Accountant" },
];

describe("the standard rate card", () => {
  it("has the 47 destinations of the printed card, with whole-shilling rates", () => {
    expect(STANDARD_RATES).toHaveLength(47);
    expect(STANDARD_RATES.every(([name, kes]) => name && Number.isInteger(kes) && kes >= 20000 && kes <= 160000)).toBe(true);
    const byName = Object.fromEntries(STANDARD_RATES);
    expect(byName["Westlands"]).toBe(35100);
    expect(byName["JKIA"]).toBe(28600);
    expect(byName["Naivasha"]).toBe(74100);
    expect(byName["Mombasa - Nairobi"]).toBe(142500);
    expect(byName["Nairobi-Mombasa Exports"]).toBe(102700);
    expect(byName["ICD-Kisumu"]).toBe(158200);
    expect(STANDARD_RATES.at(0)).toEqual(["Airtel Area", 24700]);
    expect(STANDARD_RATES.at(-1)).toEqual(["ICD-Konza", 49400]);
  });

  it("adds 16% VAT to the rate", () => {
    expect(vatOn(35100)).toBe(5616);
    expect(withVat(35100)).toBe(40716);
    expect(withVat(0)).toBe(0);
    expect(RATE_NOTES.some((n) => n.includes("16% VAT"))).toBe(true);
  });

  it("keeps card order, and puts a destination staff add later at the end", () => {
    const rows = [...standardRates(), { id: "new", destination: "Aaa New Place", amount: 1, order: 1000 }];
    const sorted = sortRates([...rows].reverse());
    expect(sorted[0].destination).toBe("Airtel Area");
    expect(sorted.at(-1).destination).toBe("Aaa New Place");
  });

  it("is in the demo data", () => {
    expect(buildSeedData().rates).toHaveLength(47);
  });
});

describe("the website's built-in rate card", () => {
  const code = readFileSync(new URL("../marketing-site/js/data/rates.js", import.meta.url), "utf8");
  const site = new Function(`${code}; return { RATE_CARD, rateVat, rateWithVat };`)();

  it("matches the ERP's standard card destination for destination", () => {
    expect(site.RATE_CARD.rates.map((r) => [r.to, r.kes])).toEqual(STANDARD_RATES);
    expect(site.RATE_CARD.rates.map((r) => r.id)).toEqual(standardRates().map((r) => r.id));
  });

  it("uses the same VAT, origin, tariff line and terms", () => {
    expect(site.RATE_CARD.vat).toBe(RATE_VAT_PERCENT);
    expect(site.RATE_CARD.origin).toBe(RATE_ORIGIN);
    expect(site.RATE_CARD.tariff).toBe(RATE_TARIFF);
    expect(site.RATE_CARD.notes).toEqual(RATE_NOTES);
    expect(site.rateWithVat(35100)).toBe(withVat(35100));
  });
});

describe("the rate card on the server", () => {
  it("is empty and public-readable before anything is loaded", async () => {
    const env = makeEnv();
    await bootstrap(env, staff);
    const res = await call(env, "GET", "/api/public/rates");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("loads the standard card once, and never over rates that are already there", async () => {
    const env = makeEnv();
    const t = await bootstrap(env, staff);
    const first = await call(env, "POST", "/api/rates/load-standard", { token: t.it.token });
    expect(first.status).toBe(201);
    expect(first.body).toHaveLength(47);
    const again = await call(env, "POST", "/api/rates/load-standard", { token: t.it.token });
    expect(again.status).toBe(409);
    const pub = await call(env, "GET", "/api/public/rates");
    expect(pub.body).toHaveLength(47);
    expect(pub.body[0]).toEqual({ id: "rt01", destination: "Airtel Area", amount: 24700 });
    expect(Object.keys(pub.body[0]).sort()).toEqual(["amount", "destination", "id"]); // nothing else is published
  });

  it("lets company leadership, the IT Officer and the Transport Manager change a rate, and the website feed follows", async () => {
    const env = makeEnv();
    const t = await bootstrap(env, staff);
    await call(env, "POST", "/api/rates/load-standard", { token: t.owner.token });
    for (const who of ["owner", "it", "transMgr"]) {
      const edit = await call(env, "PUT", "/api/rates/rt30", { token: t[who].token, body: { destination: "Westlands", amount: 36000 + (who === "it" ? 1 : 0), active: true } });
      expect(edit.status, who).toBe(200);
    }
    const pub = await call(env, "GET", "/api/public/rates");
    expect(pub.body.find((r) => r.id === "rt30").amount).toBe(36000); // the last editor's figure
    const add = await call(env, "POST", "/api/rates", { token: t.transMgr.token, body: { destination: "Nanyuki", amount: 61000 } });
    expect(add.status).toBe(201);
    expect(add.body).toMatchObject({ destination: "Nanyuki", amount: 61000, active: true, order: 1000 });
    expect((await call(env, "GET", "/api/public/rates")).body.at(-1).destination).toBe("Nanyuki");
    const del = await call(env, "DELETE", `/api/rates/${add.body.id}`, { token: t.it.token });
    expect(del.status).toBe(200);
  });

  it("refuses everyone else, even other managers who can write elsewhere", async () => {
    const env = makeEnv();
    const t = await bootstrap(env, staff);
    await call(env, "POST", "/api/rates/load-standard", { token: t.owner.token });
    for (const who of ["agroMgr", "driver", "acct"]) {
      expect((await call(env, "PUT", "/api/rates/rt30", { token: t[who].token, body: { destination: "Westlands", amount: 1 } })).status, who).toBe(403);
      expect((await call(env, "POST", "/api/rates", { token: t[who].token, body: { destination: "X", amount: 1 } })).status, who).toBe(403);
      expect((await call(env, "DELETE", "/api/rates/rt30", { token: t[who].token })).status, who).toBe(403);
      expect((await call(env, "POST", "/api/rates/load-standard", { token: t[who].token })).status, who).toBe(403);
    }
    expect((await call(env, "GET", "/api/public/rates")).body.find((r) => r.id === "rt30").amount).toBe(35100);
  });

  it("hides a destination from the website when it is switched off, but keeps it for staff", async () => {
    const env = makeEnv();
    const t = await bootstrap(env, staff);
    await call(env, "POST", "/api/rates/load-standard", { token: t.owner.token });
    await call(env, "PUT", "/api/rates/rt02", { token: t.it.token, body: { destination: "75 Area", amount: 26000, active: false } });
    expect((await call(env, "GET", "/api/public/rates")).body.some((r) => r.id === "rt02")).toBe(false);
    const sync = await call(env, "GET", "/api/sync", { token: t.transMgr.token });
    expect(sync.body.data.rates.find((r) => r.id === "rt02")).toMatchObject({ active: false });
  });

  it("cleans what is saved: trimmed text, whole shillings, never negative", async () => {
    const env = makeEnv();
    const t = await bootstrap(env, staff);
    const res = await call(env, "POST", "/api/rates", { token: t.it.token, body: { destination: "  Thika Road  ", amount: "-50.6" } });
    expect(res.body).toMatchObject({ destination: "Thika Road", amount: 0 });
  });
});

describe("the rate card in the ERP", () => {
  it("is on the menu for Transport, the Accountant and the Driver to read; only editors get the buttons", () => {
    for (const role of ["Transport Manager", "Driver", "Accountant", "Super Admin", "IT Officer"]) expect(canOpenView(role, "rates"), role).toBe(true);
    for (const role of ["Agro Manager", "Hospitality Manager", "Staff"]) expect(canOpenView(role, "rates"), role).toBe(false);
    expect(["Super Admin", "Admin", "Director", "IT Officer", "Transport Manager"].every(canEditRates)).toBe(true);
    expect(["Driver", "Accountant", "Agro Manager", "Staff"].some(canEditRates)).toBe(false);
  });

  it("filling a trip from the rate card sets its destination and fare", () => {
    const data = { ...buildSeedData(), rates: standardRates() };
    const forms = buildForms(data, { role: "Transport Manager", division: "Transport" });
    const field = forms.trip.fields.find((f) => f.key === "rateId");
    const opts = field.options();
    expect(opts[0].value).toBe("");
    expect(opts).toHaveLength(48);
    expect(field.onPick("rt30", { origin: "Nairobi" })).toEqual({ destination: "Westlands", amount: "35100", origin: "Nairobi ICD / CFS depot" });
    expect(field.onPick("rt30", { origin: "Mombasa" })).toEqual({ destination: "Westlands", amount: "35100" });
    expect(field.onPick("", {})).toEqual({});
  });
});
