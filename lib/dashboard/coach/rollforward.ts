import type { CoachDB, Goal, Sub, Task } from "./types";
import { periodRange } from "./periods";
import { taskDone } from "./rollup";
import { uid } from "./migrate";
import type { SuggestedTask } from "./parse";

export interface RollForwardPlan { wk: string; prev: string; recurringGoals: Goal[]; carry: Task[]; }
export function rollForwardPlan(db: CoachDB, today: Date = new Date()): RollForwardPlan {
  const wk = periodRange("week", 0, today).key, prev = periodRange("week", -1, today).key;
  const recurringGoals = db.goals.filter((g) => g.recurring);
  const carry = db.tasks.filter((t) => t.week === prev && !taskDone(t));
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
  sel.recurGoalIds.forEach((id) => {
    ensurePlan(db, wk, id);
    db.tasks.filter((t) => t.week === prev && t.goalId === id).forEach((t) =>
      db.tasks.push(freshTask({ goalId: id, week: wk, label: t.label, pts: t.pts, note: t.note, tag: t.tag, subs: cloneSubs(t.subs) })));
  });
  sel.carryTaskIds.forEach((id) => {
    const t = db.tasks.find((x) => x.id === id);
    if (t) { db.tasks.push(freshTask({ goalId: t.goalId, week: wk, label: t.label, pts: t.pts, note: t.note, tag: t.tag, subs: cloneSubs(t.subs) })); ensurePlan(db, wk, t.goalId); }
  });
  sel.aiTasks.forEach((s) => {
    const g = db.goals.find((x) => x.title.toLowerCase() === String(s.goal || "").toLowerCase());
    const gid = g ? g.id : "";
    db.tasks.push(freshTask({ goalId: gid, week: wk, label: s.label, pts: +(s.pts ?? 1) || 1 }));
    ensurePlan(db, wk, gid);
  });
  db.planDone[wk] = true;
}
