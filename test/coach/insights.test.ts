import { describe, it, expect } from "vitest";
import { computeInsights } from "../../lib/dashboard/coach/insights";
import type { CoachDB } from "../../lib/dashboard/coach/types";

const TODAY = new Date(2026, 6, 8);
const wk = "W2026-07-06";

function db(): CoachDB {
  const t = (id: string, goalId: string, pts: number, done: boolean, timeMs: number, doneAt: string | null): any =>
    ({ id, goalId, week: wk, label: id, pts, note: "", tag: "", done, doneAt, subs: [], collapsed: false, timeMs, timerStart: null, createdAt: "x" });
  return {
    version: 3, matters: "", memory: "", intakeDone: {}, planDone: {}, weekPlan: {},
    goals: [
      { id: "m", horizon: "month", period: "2026-07", title: "Month", parentId: "", recurring: false, useManual: false, manualProgress: 0, notes: "" },
    ],
    tasks: [
      t("a", "m", 3, true, 60 * 60_000, "2026-07-07T00:00:00Z"),   // 1h, done, cleared this week
      t("b", "m", 2, false, 10 * 60_000, null),                     // 10m, open
      t("c", "", 1, false, 0, null),                                // unfiled, no time
    ],
  };
}

describe("computeInsights (week scope)", () => {
  it("headline metrics", () => {
    const ins = computeInsights(db(), "week", TODAY);
    expect(ins.totalMs).toBe(70 * 60_000);
    expect(ins.doneN).toBe(1);
    expect(ins.pts).toBe(6); expect(ins.donePts).toBe(3);
    expect(ins.minPerPt).toBeGreaterThan(0);
  });
  it("rows sorted by time desc; needs-more-time = lowest-time open non-unfiled goal", () => {
    const ins = computeInsights(db(), "week", TODAY);
    expect(ins.rows[0].name).toBe("Month");
    expect(ins.need?.name).toBe("Month");           // only goal with open tasks
  });
  it("8-week cumulative points ends at week's cleared points", () => {
    const ins = computeInsights(db(), "week", TODAY);
    expect(ins.cumPts.length).toBe(8);
    expect(ins.cumPts[ins.cumPts.length - 1]).toBe(3);
  });
});
