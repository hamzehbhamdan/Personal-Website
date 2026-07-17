import { describe, it, expect } from "vitest";
import { migrate } from "../../lib/dashboard/coach/migrate";
import { taskPts } from "../../lib/dashboard/coach/rollup";

const TODAY = new Date(2026, 6, 8);

const old: any = {
  version: 2, matters: "stuff", memory: "notes", intakeDone: {},
  goals: [{ id: "g1", horizon: "week", period: "W2026-06-29", title: "Reset apt", parentId: "", useManual: false, manualProgress: 0, notes: "" }],
  tasks: [{ id: "t1", goalId: "g1", title: "Trash", done: true, createdAt: "x" }, { id: "t2", goalId: "g1", title: "Dishes", done: false }],
  board: { sections: [{ id: "sec1", name: "Errands" }],
    tasks: [{ id: "bt1", sectionId: "sec1", label: "Groceries", pts: 2, tag: "", note: "", done: false, subs: [{ id: "bs1", label: "Milk", pts: 1, done: false }] }] },
};

describe("migrate v2 -> v3", () => {
  it("bumps version and drops board", () => {
    const db = migrate(structuredClone(old), TODAY);
    expect(db.version).toBe(3);
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
