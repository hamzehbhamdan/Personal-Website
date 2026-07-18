import { describe, it, expect } from "vitest";
import { weekMetrics, streak, statusLabel } from "../../lib/dashboard/coach/metrics";
import { emptyCoachDB } from "../../lib/dashboard/coach/seed";
import { periodRange } from "../../lib/dashboard/coach/periods";
import type { CoachDB, Task, TaskStage } from "../../lib/dashboard/coach/types";

const NOW = 1_800_000_000_000;
function mk(over: Partial<Task>): Task {
  return {
    id: Math.random().toString(36).slice(2), goalId: "", week: "W", label: "t", pts: 1, note: "", tag: "",
    done: false, doneAt: null, stage: "todo" as TaskStage, subs: [], collapsed: false, timeMs: 0,
    timerStart: null, createdAt: "x", ...over,
  };
}

describe("weekMetrics", () => {
  it("aggregates only the given week's tasks", () => {
    const db = emptyCoachDB();
    db.tasks = [
      mk({ week: "W", stage: "done", done: true, doneAt: "x", pts: 5 }),
      mk({ week: "W", stage: "todo", pts: 3 }),
      mk({ week: "W", stage: "doing", pts: 2, timeMs: 120000 }),
      mk({ week: "OTHER", stage: "todo", pts: 9 }),
    ];
    const m = weekMetrics(db, "W", NOW);
    expect(m.total).toBe(3);
    expect(m.done).toBe(1);
    expect(m.completionPct).toBe(33);
    expect(m.pointsEarned).toBe(5);
    expect(m.pointsPlanned).toBe(10);
    expect(m.focusMs).toBe(120000);
    expect(m.todo).toBe(1);
    expect(m.doing).toBe(1);
  });

  it("is empty-safe (no tasks in week)", () => {
    const m = weekMetrics(emptyCoachDB(), "W", NOW);
    expect(m).toMatchObject({ total: 0, done: 0, completionPct: 0, pointsEarned: 0, pointsPlanned: 0, focusMs: 0 });
  });
});

describe("statusLabel", () => {
  it("labels by completion threshold", () => {
    expect(statusLabel(90)).toBe("On track");
    expect(statusLabel(75)).toBe("On track");
    expect(statusLabel(50)).toBe("Building");
    expect(statusLabel(40)).toBe("Building");
    expect(statusLabel(10)).toBe("Stalled");
    expect(statusLabel(0)).toBe("Stalled");
  });
});

describe("streak", () => {
  const today = new Date(2026, 6, 8);
  const wk = (o: number) => periodRange("week", o, today).key;
  const withPlan = (plan: Record<string, boolean>): CoachDB => ({ ...emptyCoachDB(), planDone: plan });

  it("counts consecutive completed weeks including the current", () => {
    expect(streak(withPlan({ [wk(0)]: true, [wk(-1)]: true, [wk(-2)]: false }), today)).toBe(2);
  });

  it("does not break the streak when the current week is still in progress", () => {
    expect(streak(withPlan({ [wk(-1)]: true, [wk(-2)]: true, [wk(-3)]: false }), today)).toBe(2);
  });

  it("is 0 when nothing is completed", () => {
    expect(streak(emptyCoachDB(), today)).toBe(0);
  });
});
