import type { CoachDB, Task } from "./types";
import { getGoal, taskPts, taskDonePts, taskDone } from "./rollup";

export interface WeekModel { gids: string[]; hasUnfiled: boolean; isEmpty: boolean; total: number; done: number; tasks: Task[]; }

export function weekModel(db: CoachDB, wk: string): WeekModel {
  const tasks = db.tasks.filter((t) => t.week === wk);
  const gids: string[] = [];
  (db.weekPlan[wk] || []).forEach((id) => { if (getGoal(db, id) && !gids.includes(id)) gids.push(id); });
  tasks.forEach((t) => { if (t.goalId && getGoal(db, t.goalId) && !gids.includes(t.goalId)) gids.push(t.goalId); });
  const hasUnfiled = tasks.some((t) => !t.goalId || !getGoal(db, t.goalId));
  const isEmpty = !gids.length && !hasUnfiled;
  let total = 0, done = 0;
  tasks.forEach((t) => { total += taskPts(t); done += taskDonePts(t); });
  return { gids, hasUnfiled, isEmpty, total, done, tasks };
}

export interface NextUp { picked: Task | null; hint: string | null; hadTasks: boolean; }
export function nextUp(db: CoachDB, wk: string): NextUp {
  const tasks = db.tasks.filter((t) => t.week === wk);
  let picked: Task | null = null, hint: string | null = null;
  const order = (db.weekPlan[wk] || []).slice();
  tasks.forEach((t) => { if (t.goalId && !order.includes(t.goalId)) order.push(t.goalId); });
  for (const gid of order) {
    for (const t of tasks.filter((x) => x.goalId === gid)) {
      if (!taskDone(t)) { picked = t; if (t.subs && t.subs.length) { const s = t.subs.find((x) => !x.done); hint = s ? s.label : null; } break; }
    }
    if (picked) break;
  }
  if (!picked) for (const t of tasks.filter((x) => !x.goalId || !getGoal(db, x.goalId))) { if (!taskDone(t)) { picked = t; break; } }
  return { picked, hint, hadTasks: tasks.length > 0 };
}
