import { describe, it, expect, afterEach, vi } from "vitest";
import { migrate, uid } from "../../lib/dashboard/coach/migrate";
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

/** v2 (legacy) on-disk doc shape — deliberately missing v4-only fields (recurring,
 *  label, week, stage, ...) since that's exactly what migrate() must backfill. Fed
 *  to migrate() via a double-cast (not `any`) so the malformed shape still reaches
 *  it unchanged. */
interface LegacyV2Goal {
  id: string; horizon: string; period: string; title: string; parentId: string;
  useManual: boolean; manualProgress: number; notes: string;
}
interface LegacyV2Task { id: string; goalId: string; title: string; done: boolean; createdAt?: string; }
interface LegacyBoardSub { id?: string; label: string; pts: number; done: boolean; }
interface LegacyBoardTask {
  id?: string; sectionId: string; label: string; pts: number; tag: string; note: string;
  done: boolean; subs: LegacyBoardSub[];
}
interface LegacyV2Doc {
  version: number; matters: string; memory: string; intakeDone: Record<string, boolean>;
  goals: LegacyV2Goal[]; tasks: LegacyV2Task[];
  board: { sections: { id: string; name: string }[]; tasks: LegacyBoardTask[] };
}
const asCoachInput = (v: unknown): Partial<CoachDB> => v as unknown as Partial<CoachDB>;

const old: LegacyV2Doc = {
  version: 2, matters: "stuff", memory: "notes", intakeDone: {},
  goals: [{ id: "g1", horizon: "week", period: "W2026-06-29", title: "Reset apt", parentId: "", useManual: false, manualProgress: 0, notes: "" }],
  tasks: [{ id: "t1", goalId: "g1", title: "Trash", done: true, createdAt: "x" }, { id: "t2", goalId: "g1", title: "Dishes", done: false }],
  board: { sections: [{ id: "sec1", name: "Errands" }],
    tasks: [{ id: "bt1", sectionId: "sec1", label: "Groceries", pts: 2, tag: "", note: "", done: false, subs: [{ id: "bs1", label: "Milk", pts: 1, done: false }] }] },
};

describe("migrate v2 -> v4", () => {
  it("bumps version and drops board", () => {
    const db = migrate(asCoachInput(structuredClone(old)), TODAY);
    expect(db.version).toBe(4);
    expect(db.board).toBeUndefined();
  });
  it("produces 3 tasks: 2 migrated + 1 board->unfiled", () => {
    const db = migrate(asCoachInput(structuredClone(old)), TODAY);
    expect(db.tasks.length).toBe(3);
    const unfiled = db.tasks.find((t) => t.label === "Groceries")!;
    expect(unfiled.goalId).toBe("");                 // board task -> unfiled
    expect(unfiled.tag).toBe("Errands");             // section name -> tag
    expect(unfiled.subs.length).toBe(1);
    expect(taskPts(unfiled)).toBe(1);                // subs present -> pts roll up
  });
  it("renames title->label, keeps matters/memory, sets rich defaults", () => {
    const db = migrate(asCoachInput(structuredClone(old)), TODAY);
    expect(db.tasks.every((t) => (t as unknown as { title?: string }).title === undefined && t.label)).toBe(true);
    expect(db.matters).toBe("stuff"); expect(db.memory).toBe("notes");
    const t1 = db.tasks.find((t) => t.label === "Trash")!;
    expect(t1.pts).toBe(1); expect(t1.timeMs).toBe(0); expect(t1.timerStart).toBe(null);
    expect(t1.week).toBe("W2026-07-06");             // null week -> current week key
  });
});

describe("migrate v4 — Task.stage backfill + invariant", () => {
  it("backfills stage from done for legacy tasks", () => {
    const db = migrate(asCoachInput(structuredClone(old)), TODAY);
    expect(db.tasks.find((t) => t.label === "Trash")!.stage).toBe("done");   // done:true
    expect(db.tasks.find((t) => t.label === "Dishes")!.stage).toBe("todo");  // done:false
    expect(db.tasks.find((t) => t.label === "Groceries")!.stage).toBe("todo"); // board task, done:false
  });

  it("enforces stage==='done' ⇔ done===true even against a contradictory stored stage", () => {
    const bad: Partial<CoachDB> = {
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
    const once = migrate(asCoachInput(structuredClone(old)), TODAY);
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

describe("migrate — board id determinism (review #31)", () => {
  it("mints identical ids on repeated migration of the same unpersisted doc", () => {
    const a = migrate(asCoachInput(structuredClone(old)), TODAY);
    const b = migrate(asCoachInput(structuredClone(old)), TODAY);
    const gA = a.tasks.find((t) => t.label === "Groceries")!;
    const gB = b.tasks.find((t) => t.label === "Groceries")!;
    expect(gA.id).toBe(gB.id);                    // random uid() would differ per call
    expect(gA.id).toBe("bt-bt1");                 // derived from the source item id
    expect(gA.subs.map((s) => s.id)).toEqual(gB.subs.map((s) => s.id));
    expect(gA.subs[0].id).toBe("bt-bt1-s-bs1");   // sub ids scoped to the parent
  });
  it("falls back to array indices when a legacy board item has no id", () => {
    const raw = structuredClone(old);
    delete raw.board.tasks[0].id;
    delete raw.board.tasks[0].subs[0].id;
    const db = migrate(asCoachInput(raw), TODAY);
    const g = db.tasks.find((t) => t.label === "Groceries")!;
    expect(g.id).toBe("bt-0");
    expect(g.subs[0].id).toBe("bt-0-s-0");
  });
});

describe("uid", () => {
  const originalCrypto = globalThis.crypto;
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    Object.defineProperty(globalThis, "crypto", { value: originalCrypto, configurable: true, writable: true });
  });

  it("keeps the prefix", () => {
    expect(uid("s").startsWith("s")).toBe(true);
  });

  it("is collision-free across a tight bulk loop within one millisecond", () => {
    const ids = new Set<string>();
    for (let i = 0; i < 5000; i++) ids.add(uid("t"));
    expect(ids.size).toBe(5000); // no birthday collisions
  });

  it("uses crypto.randomUUID when available", () => {
    const id = uid("g");
    // crypto.randomUUID output: 8-4-4-4-12 hex, prefixed with "g"
    expect(id).toMatch(/^g[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });

  it("falls back to a unique prefixed id when crypto.randomUUID is unavailable", () => {
    // Disable crypto.randomUUID entirely so uid() must take the fallback branch.
    Object.defineProperty(globalThis, "crypto", { value: {}, configurable: true, writable: true });
    // The fallback's uniqueness depends on Date.now() varying between calls (it
    // reuses the legacy Date.now()+random-suffix scheme, which is exactly what
    // collides when Date.now() is constant across a tight loop). Advance the
    // mocked clock by 1ms per call so this test verifies the fallback branch
    // deterministically instead of relying on timing luck.
    let t = 1_700_000_000_000;
    vi.spyOn(Date, "now").mockImplementation(() => t++);
    const ids = new Set<string>();
    for (let i = 0; i < 5000; i++) ids.add(uid("f"));
    expect(ids.size).toBe(5000);
    expect([...ids].every((id) => id.startsWith("f"))).toBe(true);
  });
});
