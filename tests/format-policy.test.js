import { describe, it, expect } from "vitest";
import {
  formatKES, formatCompact, formatPercent, parseDate, toISODate, daysBetween, addDays, initials, delta, relativeTime, genId,
} from "../src/lib/format.js";
import { passwordProblem, MIN_AGE } from "../src/lib/policy.js";
import { canOpenView, capsForRole } from "../src/lib/auth.js";
import { ROLES, ROLE_CAPS, ROLE_VIEWS } from "../src/lib/constants.js";

describe("money and number formatting", () => {
  it("formats shillings with thousands separators and never shows NaN", () => {
    expect(formatKES(1234567.8)).toBe("KSh 1,234,568");
    expect(formatKES("oops")).toBe("KSh 0");
    expect(formatKES(undefined)).toBe("KSh 0");
  });

  it("compacts big figures for tight spaces", () => {
    expect(formatCompact(1_200_000)).toBe("1.2M");
    expect(formatCompact(486_000)).toBe("486k");
    expect(formatCompact(940)).toBe("940");
    expect(formatCompact(12_000_000)).toBe("12M");
  });

  it("percent handles bad input", () => {
    expect(formatPercent(12.345, 1)).toBe("12.3%");
    expect(formatPercent(NaN)).toBe("-");
  });

  it("percentage change guards against dividing by zero", () => {
    expect(delta(120, 100)).toBe(20);
    expect(delta(50, 100)).toBe(-50);
    expect(delta(0, 0)).toBe(0);
    expect(delta(10, 0)).toBeNull();
  });
});

describe("dates", () => {
  it("parses YYYY-MM-DD as a local date (no off-by-one from time zones)", () => {
    const d = parseDate("2026-09-05");
    expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2026, 8, 5]);
  });

  it("round-trips through toISODate and pads single digits", () => {
    expect(toISODate("2026-09-05")).toBe("2026-09-05");
    expect(toISODate(new Date(2026, 0, 3))).toBe("2026-01-03");
  });

  it("counts days and adds days across a month end", () => {
    expect(daysBetween("2026-09-01", "2026-09-26")).toBe(25);
    expect(toISODate(addDays("2026-09-30", 1))).toBe("2026-10-01");
  });

  it("does not mutate the Date it is given", () => {
    const original = new Date(2026, 8, 26);
    const before = original.getTime();
    parseDate(original).setDate(1);
    expect(original.getTime()).toBe(before);
  });

  it("says things in plain words", () => {
    const now = new Date("2026-09-26T12:00:00Z");
    expect(relativeTime("2026-09-26T11:59:40Z", now)).toBe("Just now");
    expect(relativeTime("2026-09-26T11:30:00Z", now)).toBe("30 min ago");
    expect(relativeTime("2026-09-25T09:00:00Z", now)).toBe("Yesterday");
    expect(relativeTime("garbage", now)).toBe("");
  });
});

describe("small helpers", () => {
  it("makes initials", () => {
    expect(initials("Wanjiku Kamande")).toBe("WK");
    expect(initials("  madonna ")).toBe("M");
    expect(initials("")).toBe("");
  });

  it("makes ids that don't repeat", () => {
    const ids = new Set(Array.from({ length: 500 }, () => genId("t")));
    expect(ids.size).toBe(500);
  });
});

describe("password policy", () => {
  it("accepts a reasonable password", () => {
    expect(passwordProblem("Sunrise2026")).toBeNull();
  });
  it("rejects short, single-type, and email-as-password", () => {
    expect(passwordProblem("a1")).toMatch(/8 characters/);
    expect(passwordProblem("abcdefgh")).toMatch(/letter and one number/);
    expect(passwordProblem("12345678")).toMatch(/letter and one number/);
    expect(passwordProblem("Owner@kash1", "owner@kash1")).toMatch(/email/);
    expect(passwordProblem("a1".repeat(150))).toMatch(/too long/);
  });
  it("age limit is 18", () => expect(MIN_AGE).toBe(18));
});

describe("role permissions (the rules the server enforces)", () => {
  it("every role has capabilities and a view list", () => {
    for (const role of ROLES) {
      expect(ROLE_CAPS[role], role).toBeTruthy();
      expect(ROLE_VIEWS[role], role).toBeTruthy();
    }
  });

  it("only Super Admin, Admin and Director can manage users or settings", () => {
    const allowed = ROLES.filter((r) => ROLE_CAPS[r].manageUsers);
    expect(allowed.sort()).toEqual(["Admin", "Director", "Super Admin"]);
    expect(ROLES.filter((r) => ROLE_CAPS[r].settings).sort()).toEqual(["Admin", "Director", "Super Admin"]);
  });

  it("no worker role can write to the whole division or delete", () => {
    for (const role of ["Driver", "Agro Attendant", "Hospitality Attendant", "Staff"]) {
      expect(capsForRole(role).write, role).toBe(false);
      expect(capsForRole(role).deleteAny, role).toBe(false);
    }
  });

  it("a Driver can't open Agro or Hospitality; a Transport Manager can't open Users", () => {
    expect(canOpenView("Driver", "food")).toBe(false);
    expect(canOpenView("Driver", "hospitality")).toBe(false);
    expect(canOpenView("Transport Manager", "users")).toBe(false);
    expect(canOpenView("Super Admin", "users")).toBe(true);
  });

  it("an unknown role falls back to the least-privileged one", () => {
    expect(capsForRole("Hacker")).toEqual(capsForRole("Staff"));
  });
});
