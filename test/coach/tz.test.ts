// Regression tests for the UTC/local week-key split (review #29/#30/#32/#63).
// vitest.config.ts pins TZ=UTC for the suite; these describes re-pin the
// process TZ at runtime (supported on POSIX Node) and each suite first
// asserts via getTimezoneOffset() that the pin actually took effect.
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { periodRange, periodLabelOf, parseDayKey } from "@/lib/dashboard/coach/periods";
import { computeInsights } from "@/lib/dashboard/coach/insights";
import type { CoachDB } from "@/lib/dashboard/coach/types";

const ORIG_TZ = process.env.TZ;
afterAll(() => { process.env.TZ = ORIG_TZ; });

function mkDb(week: string): CoachDB {
  return {
    version: 4, matters: "", memory: "", intakeDone: {}, planDone: {}, weekPlan: {}, goals: [],
    tasks: [{ id: "a", goalId: "", week, label: "a", pts: 2, note: "", tag: "", done: true,
      doneAt: "2026-06-02T12:00:00Z", stage: "done", subs: [], collapsed: false, timeMs: 60_000,
      timerStart: null, createdAt: "x" }],
  };
}

describe("behind UTC (America/Chicago — the owner's timezone)", () => {
  beforeAll(() => { process.env.TZ = "America/Chicago"; });
  it("TZ pin took effect", () => {
    expect(new Date(2026, 0, 15).getTimezoneOffset()).toBe(360); // CST = UTC-6
  });
  it("#29/#30: month insights include the week starting on the month's first Monday", () => {
    // June 1, 2026 is a Monday; today = June 15, 2026 (local).
    const ins = computeInsights(mkDb("W2026-06-01"), "month", new Date(2026, 5, 15));
    expect(ins.taskN).toBe(1);
    expect(ins.pts).toBe(2);
  });
  it("#32: week labels use the key's own calendar day", () => {
    expect(periodLabelOf({ period: "W2026-07-06" } as Pick<never, never> & { period: string })).toBe("Jul 6–12");
  });
  it("#63: week key generation matches the UTC-pinned output", () => {
    expect(periodRange("week", 0, new Date(2026, 6, 8)).key).toBe("W2026-07-06");
  });
});

describe("ahead of UTC (Asia/Dubai)", () => {
  beforeAll(() => { process.env.TZ = "Asia/Dubai"; });
  it("TZ pin took effect", () => {
    expect(new Date(2026, 0, 15).getTimezoneOffset()).toBe(-240); // GST = UTC+4
  });
  it("#63: week key is the local Monday, not the UTC Sunday", () => {
    expect(periodRange("week", 0, new Date(2026, 6, 8)).key).toBe("W2026-07-06");
  });
  it("parseDayKey stays on the key's calendar day", () => {
    const d = parseDayKey("2026-07-06");
    expect([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours()]).toEqual([2026, 6, 6, 0]);
  });
});
