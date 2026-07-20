import type { CoachDB, Goal, Sub, Task } from "./types";
import { periodRange } from "./periods";
import { taskDone } from "./rollup";
import { uid } from "./migrate";
import type { SuggestedTask } from "./parse";

export interface RollForwardPlan { wk: string; prev: string; recurringGoals: Goal[]; carry: Task[]; }
export function rollForwardPlan(db: CoachDB, today: Date = new Date()): RollForwardPlan {
  const wk = periodRange("week", 0, today).key, prev = periodRange("week", -1, today).key;
  const recurringGoals = db.goals.filter((g) => g.recurring);
  // A recurring goal refreshes ALL of its prev-week tasks (done AND unfinished),
  // so its unfinished tasks must not also be offered as carry rows — with the
  // modal's all-checked defaults that double-cloned every one of them (#33).
  const recurIds = new Set(recurringGoals.map((g) => g.id));
  const carry = db.tasks.filter((t) => t.week === prev && !taskDone(t) && !recurIds.has(t.goalId));
  return { wk, prev, recurringGoals, carry };
}

export interface RollForwardSelections { recurGoalIds: string[]; carryTaskIds: string[]; aiTasks: SuggestedTask[]; }
const cloneSubs = (subs: Sub[] = []): Sub[] => subs.map((s) => ({ id: uid("s"), label: s.label, pts: s.pts, meta: s.meta, done: false }));
const freshTask = (over: Partial<Task>): Task => ({
  id: uid("t"), goalId: "", week: "", label: "Task", pts: 1, note: "", tag: "", done: false, doneAt: null,
  stage: "todo", subs: [], collapsed: false, timeMs: 0, timerStart: null, createdAt: new Date().toISOString(), ...over,
});
const ensurePlan = (db: CoachDB, wk: string, gid: string) => { if (gid) { (db.weekPlan[wk] ||= []); if (!db.weekPlan[wk].includes(gid)) db.weekPlan[wk].push(gid); } };

export function applyRollForward(db: CoachDB, sel: RollForwardSelections, today: Date = new Date()): void {
  const { wk, prev } = rollForwardPlan(db, today);
  // Re-apply idempotency (#34): clones are stamped with the id of the prev-week
  // task they came from; a source that already has a clone in the target week
  // is skipped, so re-opening "Plan this week" mid-week and applying again
  // adds nothing. (Deliberate divergence from coach.html:762-766.)
  const already = new Set(db.tasks.filter((t) => t.week === wk && t.sourceId).map((t) => t.sourceId!));
  const recurSel = new Set(sel.recurGoalIds);
  sel.recurGoalIds.forEach((id) => {
    ensurePlan(db, wk, id);
    db.tasks.filter((t) => t.week === prev && t.goalId === id && !already.has(t.id)).forEach((t) =>
      db.tasks.push(freshTask({ goalId: id, week: wk, label: t.label, pts: t.pts, note: t.note, tag: t.tag, subs: cloneSubs(t.subs), sourceId: t.id })));
  });
  sel.carryTaskIds.forEach((id) => {
    const t = db.tasks.find((x) => x.id === id);
    // Skip tasks owned by a selected recurring goal (defense for callers that
    // hand-build selections — the modal no longer offers these rows at all).
    if (t && !recurSel.has(t.goalId) && !already.has(t.id)) {
      db.tasks.push(freshTask({ goalId: t.goalId, week: wk, label: t.label, pts: t.pts, note: t.note, tag: t.tag, subs: cloneSubs(t.subs), sourceId: t.id }));
      ensurePlan(db, wk, t.goalId);
    }
  });
  sel.aiTasks.forEach((s) => {
    const g = db.goals.find((x) => x.title.toLowerCase() === String(s.goal || "").toLowerCase());
    const gid = g ? g.id : "";
    db.tasks.push(freshTask({ goalId: gid, week: wk, label: s.label, pts: +(s.pts ?? 1) || 1 }));
    ensurePlan(db, wk, gid);
  });
  db.planDone[wk] = true;
}
