import { describe, it, expect } from "vitest";
import { ROLE_VIEWS, DIVISIONS } from "../src/lib/constants.js";
import { canOpenView } from "../src/lib/auth.js";
import { buildLedger } from "../src/lib/derive.js";
import { buildSeedData } from "../src/lib/seed.js";
import { NAV } from "../src/components/nav.js";

describe("Accounts - each business keeps its own books", () => {
  it("is on the menu, and only finance and management roles can open it", () => {
    expect(NAV.some((n) => n.key === "accounts")).toBe(true);
    for (const role of ["Super Admin", "Admin", "Director", "Accountant", "IT Officer", "Transport Manager", "Agro Manager", "Hospitality Manager"]) {
      expect(canOpenView(role, "accounts"), role).toBe(true);
    }
    for (const role of ["Driver", "Agro Attendant", "Hospitality Attendant", "Staff"]) {
      expect(canOpenView(role, "accounts"), role).toBe(false);
    }
    expect(ROLE_VIEWS.Accountant).toContain("accounts");
  });

  it("every ledger line belongs to exactly one business, so the businesses add up to the company", () => {
    const lines = buildLedger(buildSeedData());
    expect(lines.length).toBeGreaterThan(0);
    expect(lines.every((l) => DIVISIONS.includes(l.division))).toBe(true);
    const total = (ls) => ls.reduce((s, l) => s + (l.kind === "income" ? l.amount : -l.amount), 0);
    const perBusiness = DIVISIONS.reduce((s, d) => s + total(lines.filter((l) => l.division === d)), 0);
    expect(perBusiness).toBe(total(lines));
  });
});
