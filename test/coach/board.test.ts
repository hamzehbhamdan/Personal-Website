import { describe, it, expect } from "vitest";
import { applyStage, STAGES, stageForDone } from "../../lib/dashboard/coach/board";
import { taskDone } from "../../lib/dashboard/coach/rollup";
import type { Task, Sub } from "../../lib/dashboard/coach/types";

const NOW = "2026-07-17T12:00:00.000Z";
function task(over: Partial<Task> = {}): Task {
  return {
    id: "t", goalId: "", week: "W2026-07-13", label: "x", pts: 1, note: "", tag: "",
    done: false, doneAt: null, subs: [], collapsed: false, timeMs: 0, timerStart: null,
    createdAt: "2026-07-13T00:00:00.000Z", stage: "todo", ...over,
  };
}

let subN = 0;
function mkSub(over: Partial<Sub> = {}): Sub {
  return { id: `sub${subN++}`, label: "sub", pts: 1, meta: "", done: false, ...over };
}

describe("STAGES", () => {
  it("is todo, doing, done in order", () => {
    expect(STAGES.map((s) => s.key)).toEqual(["todo", "doing", "done"]);
  });
});

describe("applyStage", () => {
  it("moving to done sets done=true and stamps doneAt when absent", () => {
    const t = task({ stage: "todo", done: false, doneAt: null });
    applyStage(t, "done", NOW);
    expect(t.stage).toBe("done");
    expect(t.done).toBe(true);
    expect(t.doneAt).toBe(NOW);
  });

  it("moving to done preserves an existing doneAt", () => {
    const prior = "2026-07-14T09:00:00.000Z";
    const t = task({ stage: "done", done: true, doneAt: prior });
    applyStage(t, "done", NOW);
    expect(t.doneAt).toBe(prior);
    expect(t.done).toBe(true);
  });

  it("moving to doing clears done and doneAt", () => {
    const t = task({ stage: "done", done: true, doneAt: NOW });
    applyStage(t, "doing", NOW);
    expect(t.stage).toBe("doing");
    expect(t.done).toBe(false);
    expect(t.doneAt).toBe(null);
  });

  it("moving to todo clears done and doneAt", () => {
    const t = task({ stage: "doing", done: false, doneAt: null });
    applyStage(t, "todo", NOW);
    expect(t.stage).toBe("todo");
    expect(t.done).toBe(false);
    expect(t.doneAt).toBe(null);
  });
});

describe("stageForDone", () => {
  it("done always maps to the done column", () => {
    expect(stageForDone(true, "todo")).toBe("done");
    expect(stageForDone(true, "doing")).toBe("done");
    expect(stageForDone(true, "done")).toBe("done");
  });
  it("un-done leaves an in-progress task in place and only demotes out of done", () => {
    expect(stageForDone(false, "doing")).toBe("doing");
    expect(stageForDone(false, "todo")).toBe("todo");
    expect(stageForDone(false, "done")).toBe("todo");
  });
});

describe("applyStage with subtasks", () => {
  it("dragging a subbed task into Done marks every sub done (taskDone agrees)", () => {
    const t = task({ stage: "todo", done: false, subs: [mkSub({ done: false }), mkSub({ done: true })] });
    applyStage(t, "done", "2026-07-19T00:00:00Z");
    expect(t.subs.every((s) => s.done)).toBe(true);
    expect(taskDone(t)).toBe(true);
    expect(t.stage).toBe("done");
  });
  it("dragging a subbed task out of Done un-marks every sub (taskDone agrees)", () => {
    const t = task({ stage: "done", done: true, subs: [mkSub({ done: true }), mkSub({ done: true })] });
    applyStage(t, "doing", "2026-07-19T00:00:00Z");
    expect(t.subs.some((s) => s.done)).toBe(false);
    expect(taskDone(t)).toBe(false);
    expect(t.done).toBe(false);
    expect(t.doneAt).toBeNull();
  });
  it("a todo→doing move must NOT wipe partially-checked subs", () => {
    const t = task({ stage: "todo", done: false, subs: [mkSub({ done: true }), mkSub({ done: false })] });
    applyStage(t, "doing", "2026-07-19T00:00:00Z");
    expect(t.subs[0].done).toBe(true); // partial progress preserved
    expect(t.stage).toBe("doing");
  });
});
