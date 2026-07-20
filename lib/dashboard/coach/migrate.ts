import type { CoachDB, Sub, Task, TaskStage } from "./types";
import { normalize } from "./seed";
import { periodRange } from "./periods";
import { taskDone } from "./rollup";
import { stageForDone } from "./board";

export const uid = (p = "x"): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? p + crypto.randomUUID()
    : p + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36);

/** v2->v4 migration. MUTATES `raw` (via normalize) — pass a structuredClone. */
export function migrate(raw: Partial<CoachDB>, today: Date = new Date()): CoachDB {
  const db = normalize(raw);
  const wk = periodRange("week", 0, today).key;
  db.goals.forEach((g) => {
    if (g.recurring == null) g.recurring = false;
    if (g.useManual == null) g.useManual = false;
    if (g.manualProgress == null) g.manualProgress = 0;
  });
  db.tasks.forEach((t: any) => {
    if (t.title != null && t.label == null) t.label = t.title;
    if (t.label == null) t.label = "Task"; delete t.title;
    if (t.pts == null) t.pts = 1;
    if (!Array.isArray(t.subs)) t.subs = [];
    if (t.week == null) t.week = wk;
    if (t.timeMs == null) t.timeMs = 0;
    if (t.timerStart === undefined) t.timerStart = null;
    if (t.tag == null) t.tag = "";
    if (t.note == null) t.note = "";
    if (t.goalId == null) t.goalId = "";
    if (t.collapsed == null) t.collapsed = false;
    if (t.doneAt === undefined) t.doneAt = t.done ? new Date().toISOString() : null;
    if (t.createdAt == null) t.createdAt = new Date().toISOString();
    // stage (v4): enforce the invariant stage==="done" ⇔ done===true, keyed off
    // EFFECTIVE done-ness (taskDone, which rolls up from subs) so legacy docs
    // where subs disagree with the stored `done`/`stage` self-heal on read.
    const effDone = taskDone(t);
    t.done = effDone;
    const prevStage: TaskStage =
      t.stage === "todo" || t.stage === "doing" || t.stage === "done"
        ? t.stage
        : effDone ? "done" : "todo";
    t.stage = stageForDone(effDone, prevStage);
  });
  const board: any = db.board;
  if (board && Array.isArray(board.tasks)) {
    const secName: Record<string, string> = {};
    (board.sections || []).forEach((s: any) => { secName[s.id] = s.name; });
    board.tasks.forEach((bt: any, i: number) => {
      // Deterministic ids derived from the legacy board item (review #31):
      // migrate() runs on every render AND inside every mutate(), so until the
      // migration is persisted, random uid()s make the rendered ids never match
      // the draft's (first click on a converted task no-ops) or the server
      // search index. "bt-" cannot collide with uid()'s "t…"/"s…" ids; sub ids
      // are scoped to the parent because legacy sub ids may repeat across
      // tasks; array indices cover items with no id.
      const btId = "bt-" + (bt.id ?? String(i));
      const subs: Sub[] = (bt.subs || []).map((s: any, j: number) => ({ id: btId + "-s-" + (s.id ?? String(j)), label: s.label, pts: +s.pts || 0, meta: s.meta || "", done: !!s.done }));
      const t: Task = {
        id: btId, goalId: "", week: wk, label: bt.label || "Task",
        pts: bt.subs && bt.subs.length ? 0 : +bt.pts || 1,
        note: bt.note || "", tag: bt.tag || secName[bt.sectionId] || "",
        done: !!bt.done, doneAt: bt.done ? new Date().toISOString() : null,
        stage: bt.done ? "done" : "todo",
        subs, collapsed: false, timeMs: 0, timerStart: null, createdAt: new Date().toISOString(),
      };
      db.tasks.push(t);
    });
    delete db.board;
  }
  db.version = 4;
  return db;
}
