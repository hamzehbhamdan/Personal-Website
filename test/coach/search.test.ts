import { describe, it, expect } from "vitest";
import { runSearch } from "../../lib/dashboard/coach/search";
import type { CoachDB } from "../../lib/dashboard/coach/types";

const db: CoachDB = {
  version: 3, matters: "", memory: "", intakeDone: {}, planDone: {}, weekPlan: {},
  goals: [{ id: "g1", horizon: "month", period: "2026-07", title: "Ship board", parentId: "", recurring: false, useManual: false, manualProgress: 0, notes: "" }],
  tasks: [{ id: "t1", goalId: "g1", week: "W", label: "Wire board", pts: 1, note: "", tag: "", done: false, doneAt: null,
    subs: [{ id: "s", label: "onboard flow", pts: 1, meta: "", done: false }], collapsed: false, timeMs: 0, timerStart: null, createdAt: "x" }],
};

describe("runSearch", () => {
  it("matches goals + tasks (incl. subtask labels), case-insensitive", () => {
    const r = runSearch(db, "board");
    expect(r.goals.map((g) => g.id)).toEqual(["g1"]);
    expect(r.tasks.map((t) => t.id)).toEqual(["t1"]);
  });
  it("empty query -> nothing", () => expect(runSearch(db, "  ")).toEqual({ goals: [], tasks: [] }));
});
