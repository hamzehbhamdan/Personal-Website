import { describe, it, expect } from "vitest";
import { weekModel, nextUp } from "../../lib/dashboard/coach/week";
import type { CoachDB, Task } from "../../lib/dashboard/coach/types";

function db(): CoachDB {
  const t = (id: string, goalId: string, done = false): Task =>
    ({ id, goalId, week: "W", label: id, pts: 2, note: "", tag: "", done, doneAt: done ? "x" : null, stage: done ? "done" : "todo", subs: [], collapsed: false, timeMs: 0, timerStart: null, createdAt: "x" });
  return {
    version: 3, matters: "", memory: "", intakeDone: {}, planDone: {}, weekPlan: { W: ["g1"] },
    goals: [{ id: "g1", horizon: "week", period: "W", title: "Goal", parentId: "", recurring: false, useManual: false, manualProgress: 0, notes: "" }],
    tasks: [t("a", "g1", true), t("b", "g1", false), t("c", "", false)],
  };
}

describe("weekModel", () => {
  it("computes gids, unfiled, totals", () => {
    const m = weekModel(db(), "W");
    expect(m.gids).toEqual(["g1"]);
    expect(m.hasUnfiled).toBe(true);
    expect(m.isEmpty).toBe(false);
    expect(m.total).toBe(6); expect(m.done).toBe(2);
  });
  it("isEmpty when no goals and no unfiled", () => {
    const e = { ...db(), tasks: [], weekPlan: {} };
    expect(weekModel(e, "W").isEmpty).toBe(true);
  });
});

describe("nextUp", () => {
  it("picks first open task in weekPlan order, goal-first", () => {
    const n = nextUp(db(), "W");
    expect(n.picked?.id).toBe("b");
  });
  it("cleared state when all done", () => {
    const d = db(); d.tasks.forEach((t) => (t.done = true));
    expect(nextUp(d, "W").picked).toBe(null);
  });
});
