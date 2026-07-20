import { describe, it, expect } from "vitest";
import { rollForwardPlan, applyRollForward } from "../../lib/dashboard/coach/rollforward";
import type { CoachDB } from "../../lib/dashboard/coach/types";

const TODAY = new Date(2026, 6, 8);
const wk = "W2026-07-06", prev = "W2026-06-29";

function db(): CoachDB {
  return {
    version: 3, matters: "", memory: "", intakeDone: {}, planDone: {}, weekPlan: {},
    goals: [{ id: "g1", horizon: "month", period: "2026-07", title: "Ship", parentId: "", recurring: true, useManual: false, manualProgress: 0, notes: "" }],
    tasks: [
      { id: "t1", goalId: "g1", week: prev, label: "Recurring task", pts: 2, note: "", tag: "", done: true, doneAt: "x", stage: "done", subs: [], collapsed: false, timeMs: 0, timerStart: null, createdAt: "x" },
      { id: "t2", goalId: "g1", week: prev, label: "Unfinished", pts: 3, note: "n", tag: "", done: false, doneAt: null, stage: "todo", subs: [], collapsed: false, timeMs: 5000, timerStart: null, createdAt: "x" },
    ],
  };
}

describe("rollForwardPlan", () => {
  it("recurring goals own their unfinished tasks — not offered as carry rows (#33)", () => {
    const p = rollForwardPlan(db(), TODAY);
    expect(p.wk).toBe(wk); expect(p.prev).toBe(prev);
    expect(p.recurringGoals.map((g) => g.id)).toEqual(["g1"]);
    expect(p.carry).toEqual([]);   // t2 belongs to recurring g1 → refreshed via the recur group
  });
  it("carry lists unfinished tasks of non-recurring goals and unfiled tasks", () => {
    const d = db();
    d.goals.push({ id: "g2", horizon: "month", period: "2026-07", title: "Other", parentId: "", recurring: false, useManual: false, manualProgress: 0, notes: "" });
    d.tasks.push(
      { id: "t3", goalId: "g2", week: prev, label: "NonRec", pts: 1, note: "", tag: "", done: false, doneAt: null, stage: "todo", subs: [], collapsed: false, timeMs: 0, timerStart: null, createdAt: "x" },
      { id: "t4", goalId: "", week: prev, label: "UnfiledOpen", pts: 1, note: "", tag: "", done: false, doneAt: null, stage: "todo", subs: [], collapsed: false, timeMs: 0, timerStart: null, createdAt: "x" },
    );
    const p = rollForwardPlan(d, TODAY);
    expect(p.carry.map((t) => t.id)).toEqual(["t3", "t4"]);
  });
});

describe("applyRollForward", () => {
  it("clones recurring tasks fresh, carries selected, marks planDone", () => {
    const d = db();
    applyRollForward(d, { recurGoalIds: ["g1"], carryTaskIds: ["t2"], aiTasks: [] }, TODAY);
    const thisWeek = d.tasks.filter((t) => t.week === wk);
    // recurring clone of t1 (fresh, undone) + carried t2 clone
    expect(thisWeek.some((t) => t.label === "Recurring task" && !t.done && t.timeMs === 0)).toBe(true);
    expect(thisWeek.some((t) => t.label === "Unfinished" && t.timeMs === 0)).toBe(true);
    expect(d.weekPlan[wk]).toContain("g1");
    expect(d.planDone[wk]).toBe(true);
  });
  it("AI-suggested tasks resolve goal by title (case-insensitive), else unfiled", () => {
    const d = db();
    applyRollForward(d, { recurGoalIds: [], carryTaskIds: [], aiTasks: [{ goal: "ship", label: "New", pts: 4 }] }, TODAY);
    const nt = d.tasks.find((t) => t.label === "New")!;
    expect(nt.goalId).toBe("g1"); expect(nt.pts).toBe(4); expect(nt.week).toBe(wk);
  });
  it("default all-checked selections clone each prev-week task exactly ONCE (#33)", () => {
    const d = db();
    applyRollForward(d, { recurGoalIds: ["g1"], carryTaskIds: ["t2"], aiTasks: [] }, TODAY);
    const thisWeek = d.tasks.filter((t) => t.week === wk);
    expect(thisWeek).toHaveLength(2);
    expect(thisWeek.filter((t) => t.label === "Unfinished")).toHaveLength(1);
    expect(thisWeek.filter((t) => t.label === "Recurring task")).toHaveLength(1);
    expect(thisWeek.map((t) => t.sourceId).sort()).toEqual(["t1", "t2"]);
  });
  it("re-applying the same plan is a no-op (#34)", () => {
    const d = db();
    const sel = { recurGoalIds: ["g1"], carryTaskIds: ["t2"], aiTasks: [] };
    applyRollForward(d, sel, TODAY);
    const after1 = d.tasks.length;
    applyRollForward(d, sel, TODAY);           // e.g. modal re-opened Wednesday
    expect(d.tasks.length).toBe(after1);
    expect(d.planDone[wk]).toBe(true);
  });
  it("recurring goal unchecked → its unfinished task can still be carried explicitly", () => {
    const d = db();
    applyRollForward(d, { recurGoalIds: [], carryTaskIds: ["t2"], aiTasks: [] }, TODAY);
    const thisWeek = d.tasks.filter((t) => t.week === wk);
    expect(thisWeek).toHaveLength(1);
    expect(thisWeek[0].label).toBe("Unfinished");
    expect(thisWeek[0].sourceId).toBe("t2");
  });
});
