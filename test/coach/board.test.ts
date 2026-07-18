import { describe, it, expect } from "vitest";
import { applyStage, STAGES } from "../../lib/dashboard/coach/board";
import type { Task } from "../../lib/dashboard/coach/types";

const NOW = "2026-07-17T12:00:00.000Z";
function task(over: Partial<Task> = {}): Task {
  return {
    id: "t", goalId: "", week: "W2026-07-13", label: "x", pts: 1, note: "", tag: "",
    done: false, doneAt: null, subs: [], collapsed: false, timeMs: 0, timerStart: null,
    createdAt: "2026-07-13T00:00:00.000Z", stage: "todo", ...over,
  };
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
