import { describe, it, expect } from "vitest";
import { buildLedger, computeMetrics, resolvePeriod, inRange } from "../src/lib/derive.js";
import { buildSeedData } from "../src/lib/seed.js";

const empty = () => ({ trips: [], orders: [], bookings: [], expenses: [], payments: [], maintenance: [], vehicles: [], rooms: [] });

describe("the ledger (the single source of every money figure)", () => {
  it("counts a trip fare as income and its fuel/tolls as expenses", () => {
    const data = { ...empty(), trips: [{ id: "t1", date: "2026-05-10", status: "Completed", origin: "A", destination: "B", amount: 10000, fuelCost: 2500, otherCost: 500 }] };
    const lines = buildLedger(data);
    const income = lines.filter((l) => l.kind === "income").reduce((s, l) => s + l.amount, 0);
    const expense = lines.filter((l) => l.kind === "expense").reduce((s, l) => s + l.amount, 0);
    expect(income).toBe(10000);
    expect(expense).toBe(3000);
  });

  it("ignores cancelled trips, orders and bookings on both sides", () => {
    const data = {
      ...empty(),
      trips: [{ id: "t1", date: "2026-05-10", status: "Cancelled", amount: 9000, fuelCost: 100 }],
      orders: [{ id: "o1", date: "2026-05-10", orderStatus: "Cancelled", amount: 500, cost: 200, item: "x", customer: "y" }],
      bookings: [{ id: "b1", checkIn: "2026-05-10", status: "Cancelled", amount: 7000, guest: "g", roomId: "r" }],
    };
    expect(buildLedger(data)).toHaveLength(0);
  });

  it("posts order value as income and product cost as an automatic expense", () => {
    const data = { ...empty(), orders: [{ id: "o1", date: "2026-05-10", orderStatus: "Delivered", amount: 1000, cost: 600, item: "Eggs", customer: "Jo" }] };
    const lines = buildLedger(data);
    expect(lines.find((l) => l.kind === "income").amount).toBe(1000);
    expect(lines.find((l) => l.kind === "expense")).toMatchObject({ amount: 600, source: "order" });
  });

  it("only lets Recorded payments reach the books - a pending M-Pesa prompt doesn't", () => {
    const data = {
      ...empty(),
      payments: [
        { id: "p1", date: "2026-05-10", direction: "in", amount: 5000, status: "Pending", party: "A" },
        { id: "p2", date: "2026-05-10", direction: "in", amount: 3000, status: "Recorded", party: "B" },
        { id: "p3", date: "2026-05-10", direction: "out", amount: 1000, status: "Failed", party: "C" },
      ],
    };
    const lines = buildLedger(data);
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({ kind: "income", amount: 3000 });
  });

  it("tolerates junk amounts instead of producing NaN", () => {
    const data = { ...empty(), expenses: [{ id: "e1", date: "2026-05-10", division: "General", category: "Other", amount: "abc" }] };
    expect(buildLedger(data)[0].amount).toBe(0);
  });
});

describe("headline metrics", () => {
  it("profit is income minus expense, and the divisions add up to the total", () => {
    const seed = buildSeedData();
    const range = { from: "0000-01-01", to: "9999-12-31" };
    const m = computeMetrics(seed, range);
    expect(m.profit).toBeCloseTo(m.income - m.expense, 5);
    const sumIncome = m.byDivision.reduce((s, d) => s + d.income, 0);
    const sumExpense = m.byDivision.reduce((s, d) => s + d.expense, 0);
    expect(sumIncome).toBeCloseTo(m.income, 5);
    expect(sumExpense).toBeCloseTo(m.expense, 5);
  });

  it("is deterministic for the same data", () => {
    const seed = buildSeedData();
    const range = { from: "0000-01-01", to: "9999-12-31" };
    expect(computeMetrics(seed, range).profit).toBe(computeMetrics(seed, range).profit);
  });
});

describe("periods", () => {
  const today = new Date(2026, 8, 26); // 26 Sep 2026 (local)

  it("'Last 7 days' spans exactly seven days ending today", () => {
    const r = resolvePeriod("Last 7 days", null, today);
    expect(r).toMatchObject({ from: "2026-09-20", to: "2026-09-26" });
    expect(r.prevTo).toBe("2026-09-19");
  });

  it("'This Month' starts on the 1st", () => {
    expect(resolvePeriod("This Month", null, today).from).toBe("2026-09-01");
  });

  it("inRange includes both ends and rejects empty dates", () => {
    expect(inRange("2026-09-20", "2026-09-20", "2026-09-26")).toBe(true);
    expect(inRange("2026-09-26", "2026-09-20", "2026-09-26")).toBe(true);
    expect(inRange("2026-09-27", "2026-09-20", "2026-09-26")).toBe(false);
    expect(inRange("", "2026-09-20", "2026-09-26")).toBe(false);
  });
});
