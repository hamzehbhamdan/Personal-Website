import { describe, it, expect } from "vitest";
import { startTimer, pauseTimer, resetTimer, fmtDur, fmtHM } from "../../lib/dashboard/coach/timers";
import { taskTime } from "../../lib/dashboard/coach/rollup";
import type { Task } from "../../lib/dashboard/coach/types";

const mk = (id: string, over: Partial<Task> = {}): Task =>
  ({ id, goalId: "", week: "W", label: id, pts: 1, note: "", tag: "", done: false, doneAt: null, stage: "todo", subs: [], collapsed: false, timeMs: 0, timerStart: null, createdAt: "x", ...over });

describe("timers (single-runner, pure)", () => {
  it("startTimer stops any other runner and starts the target", () => {
    const tasks = [mk("a", { timerStart: 1000, timeMs: 500 }), mk("b")];
    startTimer(tasks, "b", 10_000);
    expect(tasks[0].timerStart).toBe(null);
    expect(tasks[0].timeMs).toBe(500 + 9000);        // banked elapsed
    expect(tasks[1].timerStart).toBe(10_000);
  });
  it("pauseTimer banks elapsed and clears start", () => {
    const t = mk("a", { timerStart: 2000, timeMs: 100 });
    pauseTimer(t, 5000);
    expect(t.timeMs).toBe(3100); expect(t.timerStart).toBe(null);
  });
  it("resetTimer zeroes both", () => {
    const t = mk("a", { timerStart: 2000, timeMs: 100 });
    resetTimer(t); expect(t.timeMs).toBe(0); expect(t.timerStart).toBe(null);
  });
  it("fmtDur / fmtHM", () => {
    expect(fmtDur(65_000)).toBe("1:05");
    expect(fmtDur(3_665_000)).toBe("1:01:05");
    expect(fmtHM(90 * 60_000)).toBe("1h 30m");
    expect(fmtHM(20 * 60_000)).toBe("20m");
  });
});

describe("timer clock-regression safety", () => {
  it("pauseTimer banks 0, never negative, when the clock went backwards", () => {
    const t = mk("a", { timeMs: 1000, timerStart: 5000 }); // started 'in the future'
    pauseTimer(t, 4000);                                    // now < timerStart
    expect(t.timeMs).toBe(1000);                            // no time subtracted
    expect(t.timerStart).toBe(null);
  });
  it("taskTime never returns less than banked timeMs for a running timer", () => {
    const t = mk("a", { timeMs: 2000, timerStart: 5000 });
    expect(taskTime(t, 4000)).toBe(2000);                   // clamped, not 1000
  });
  it("startTimer banking a regressed running sibling adds 0, not negative", () => {
    const running = mk("r", { timeMs: 500, timerStart: 5000 });
    const other = mk("o");
    startTimer([running, other], "o", 4000);
    expect(running.timeMs).toBe(500);                       // sibling banked 0
    expect(running.timerStart).toBe(null);
  });
});
