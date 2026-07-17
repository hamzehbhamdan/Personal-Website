import { describe, it, expect } from "vitest";
import { taskPts, taskDonePts, taskDone, taskTime, subtree, progressOf, statusOf } from "../../lib/dashboard/coach/rollup";
import type { CoachDB } from "../../lib/dashboard/coach/types";

function scenario(t1Done: boolean): CoachDB {
  const g = (id: string, horizon: any, parentId: string) =>
    ({ id, horizon, period: "p", title: id, parentId, recurring: false, useManual: false, manualProgress: 0, notes: "" });
  return {
    version: 3, matters: "", memory: "", intakeDone: {}, weekPlan: {}, planDone: {},
    goals: [g("y", "year", ""), g("q", "quarter", "y"), g("m", "month", "q")],
    tasks: [
      { id: "t1", goalId: "m", week: "W", label: "Wire", pts: 3, note: "", tag: "", done: t1Done, doneAt: t1Done ? "x" : null, subs: [], collapsed: false, timeMs: 0, timerStart: null, createdAt: "x" },
      { id: "t2", goalId: "m", week: "W", label: "Laundry", pts: 0, note: "", tag: "", done: false, doneAt: null,
        subs: [{ id: "s1", label: "Fold", pts: 2, meta: "", done: true }, { id: "s2", label: "Put away", pts: 2, meta: "", done: false }],
        collapsed: false, timeMs: 0, timerStart: null, createdAt: "x" },
    ],
  };
}

describe("rollup (coach3harness oracle)", () => {
  it("task point/done helpers", () => {
    const db = scenario(false);
    const [t1, t2] = db.tasks;
    expect(taskPts(t1)).toBe(3); expect(taskDonePts(t1)).toBe(0); expect(taskDone(t1)).toBe(false);
    expect(taskPts(t2)).toBe(4); expect(taskDonePts(t2)).toBe(2); expect(taskDone(t2)).toBe(false);
  });
  it("month subtree = pts 7, done 2, n 2", () => {
    const s = subtree(scenario(false), scenario(false).goals[2]);
    expect(s.pts).toBe(7); expect(s.done).toBe(2); expect(s.n).toBe(2);
  });
  it("year progress rolls up ~29% (2/7)", () => {
    const db = scenario(false);
    expect(progressOf(db, db.goals[0])).toBe(29);
  });
  it("month progress after t1 done = 71% (5/7)", () => {
    const db = scenario(true);
    expect(progressOf(db, db.goals[2])).toBe(71);
  });
  it("useManual overrides subtree", () => {
    const db = scenario(false); db.goals[2].useManual = true; db.goals[2].manualProgress = 40;
    expect(progressOf(db, db.goals[2])).toBe(40);
    expect(statusOf(db, db.goals[2])).toBe("in");
  });
  it("taskTime adds live running span", () => {
    const t = { timeMs: 1000, timerStart: Date.now() - 5000 } as any;
    expect(taskTime(t)).toBeGreaterThanOrEqual(5900);
  });
});
