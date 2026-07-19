import { describe, it, expect } from "vitest";
import { migrate } from "../../lib/dashboard/coach/migrate";
import { taskPts } from "../../lib/dashboard/coach/rollup";
import type { CoachDB, Sub, Task, TaskStage } from "../../lib/dashboard/coach/types";

const TODAY = new Date(2026, 6, 8);

let n = 0;
function mkSub(over: Partial<Sub> = {}): Sub {
  return { id: `s${n++}`, label: "s", pts: 1, meta: "", done: false, ...over };
}
function mkTask(over: Partial<Task> = {}): Task {
  return {
    id: `t${n++}`, goalId: "", week: "", label: "T", pts: 1, note: "", tag: "",
    done: false, doneAt: null, stage: "todo", subs: [], collapsed: false,
    timeMs: 0, timerStart: null, createdAt: "x", ...over,
  };
}
function mkDb(over: Partial<CoachDB> = {}): Partial<CoachDB> {
  return { version: 4, goals: [], tasks: [], ...over };
}

const old: any = {
  version: 2, matters: "stuff", memory: "notes", intakeDone: {},
  goals: [{ id: "g1", horizon: "week", period: "W2026-06-29", title: "Reset apt", parentId: "", useManual: false, manualProgress: 0, notes: "" }],
  tasks: [{ id: "t1", goalId: "g1", title: "Trash", done: true, createdAt: "x" }, { id: "t2", goalId: "g1", title: "Dishes", done: false }],
  board: { sections: [{ id: "sec1", name: "Errands" }],
    tasks: [{ id: "bt1", sectionId: "sec1", label: "Groceries", pts: 2, tag: "", note: "", done: false, subs: [{ id: "bs1", label: "Milk", pts: 1, done: false }] }] },
};

describe("migrate v2 -> v4", () => {
  it("bumps version and drops board", () => {
    const db = migrate(structuredClone(old), TODAY);
    expect(db.version).toBe(4);
    expect(db.board).toBeUndefined();
  });
  it("produces 3 tasks: 2 migrated + 1 board->unfiled", () => {
    const db = migrate(structuredClone(old), TODAY);
    expect(db.tasks.length).toBe(3);
    const unfiled = db.tasks.find((t) => t.label === "Groceries")!;
    expect(unfiled.goalId).toBe("");                 // board task -> unfiled
    expect(unfiled.tag).toBe("Errands");             // section name -> tag
    expect(unfiled.subs.length).toBe(1);
    expect(taskPts(unfiled)).toBe(1);                // subs present -> pts roll up
  });
  it("renames title->label, keeps matters/memory, sets rich defaults", () => {
    const db = migrate(structuredClone(old), TODAY);
    expect(db.tasks.every((t) => (t as any).title === undefined && t.label)).toBe(true);
    expect(db.matters).toBe("stuff"); expect(db.memory).toBe("notes");
    const t1 = db.tasks.find((t) => t.label === "Trash")!;
    expect(t1.pts).toBe(1); expect(t1.timeMs).toBe(0); expect(t1.timerStart).toBe(null);
    expect(t1.week).toBe("W2026-07-06");             // null week -> current week key
  });
});

describe("migrate v4 — Task.stage backfill + invariant", () => {
  it("backfills stage from done for legacy tasks", () => {
    const db = migrate(structuredClone(old), TODAY);
    expect(db.tasks.find((t) => t.label === "Trash")!.stage).toBe("done");   // done:true
    expect(db.tasks.find((t) => t.label === "Dishes")!.stage).toBe("todo");  // done:false
    expect(db.tasks.find((t) => t.label === "Groceries")!.stage).toBe("todo"); // board task, done:false
  });

  it("enforces stage==='done' ⇔ done===true even against a contradictory stored stage", () => {
    const bad: any = {
      version: 3, matters: "", memory: "", intakeDone: {}, goals: [],
      tasks: [
        { id: "a", goalId: "", week: "W2026-07-06", label: "done-but-todo", pts: 1, note: "", tag: "",
          done: true, doneAt: "x", stage: "todo", subs: [], collapsed: false, timeMs: 0, timerStart: null, createdAt: "x" },
        { id: "b", goalId: "", week: "W2026-07-06", label: "open-but-done", pts: 1, note: "", tag: "",
          done: false, doneAt: null, stage: "done", subs: [], collapsed: false, timeMs: 0, timerStart: null, createdAt: "x" },
        { id: "c", goalId: "", week: "W2026-07-06", label: "in-progress", pts: 1, note: "", tag: "",
          done: false, doneAt: null, stage: "doing", subs: [], collapsed: false, timeMs: 0, timerStart: null, createdAt: "x" },
      ],
    };
    const db = migrate(structuredClone(bad), TODAY);
    expect(db.tasks.find((t) => t.id === "a")!.stage).toBe("done"); // done:true wins
    expect(db.tasks.find((t) => t.id === "b")!.stage).toBe("todo"); // !done + stale "done" -> todo
    expect(db.tasks.find((t) => t.id === "c")!.stage).toBe("doing"); // valid mid-stage preserved
  });

  it("is idempotent on stage", () => {
    const once = migrate(structuredClone(old), TODAY);
    const twice = migrate(structuredClone(once), TODAY);
    expect(twice.tasks.map((t) => t.stage)).toEqual(once.tasks.map((t) => t.stage));
    expect(twice.version).toBe(4);
  });

  it("repairs a task whose subs are all done but whose stage is stale", () => {
    // legacy doc state produced by the pre-fix UI (report #5 scenario A)
    const db = mkDb({ tasks: [mkTask({ stage: "todo", done: false, subs: [mkSub({ done: true }), mkSub({ done: true })] })] });
    const out = migrate(db, TODAY);
    expect(out.tasks[0].stage).toBe("done");
    expect(out.tasks[0].done).toBe(true);
  });

  it("demotes a Done-column task whose subs were left undone (report #5 scenario B)", () => {
    const db = mkDb({ tasks: [mkTask({ stage: "done", done: true, subs: [mkSub({ done: false })] })] });
    const out = migrate(db, TODAY);
    expect(out.tasks[0].stage).toBe("todo");
    expect(out.tasks[0].done).toBe(false);
  });

  it("sanitizes a garbage stage on a not-done task to todo instead of passing it through", () => {
    const raw = { ...mkTask({ done: false, subs: [] }), stage: "backlog" as unknown as TaskStage };
    const db = mkDb({ tasks: [raw] });
    const out = migrate(db, TODAY);
    expect(out.tasks[0].stage).toBe("todo");
    expect(out.tasks[0].done).toBe(false);
  });
});
