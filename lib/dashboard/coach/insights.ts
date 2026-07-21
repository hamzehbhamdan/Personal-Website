import type { CoachDB, Goal } from "./types";
import { parseDayKey, periodRange, type PeriodRange } from "./periods";
import { getGoal, subtree, taskPts, taskDonePts, taskDone, taskTime, progressOf } from "./rollup";

export type InsScope = "week" | "month" | "quarter" | "year" | "all";
export interface GoalRow { k: string; name: string; horizon: string; ms: number; n: number; done: number; pts: number; }
export interface Insights {
  totalMs: number; doneN: number; taskN: number; pts: number; donePts: number; minPerPt: number;
  rows: GoalRow[]; need: GoalRow | null; cumPts: number[]; maxCum: number;
  proj: { title: string; horizon: string; pct: number; wks: number; remaining: number }[];
}

function scopeRange(scope: InsScope, today: Date): PeriodRange | null {
  return scope === "all" ? null : periodRange(scope, 0, today);
}
function insTasks(db: CoachDB, scope: InsScope, today: Date) {
  const r = scopeRange(scope, today);
  if (!r) return db.tasks.slice();
  if (scope === "week") return db.tasks.filter((t) => t.week === r.key);
  return db.tasks.filter((t) => { if (!/^W/.test(t.week)) return false; const d = parseDayKey(t.week.slice(1)); return d >= r.start && d <= r.end; });
}

export function computeInsights(db: CoachDB, scope: InsScope, today: Date = new Date()): Insights {
  const now = today.getTime();
  const tasks = insTasks(db, scope, today);
  let totalMs = 0, doneN = 0, pts = 0, donePts = 0;
  tasks.forEach((t) => { totalMs += taskTime(t, now); pts += taskPts(t); donePts += taskDonePts(t); if (taskDone(t)) doneN++; });

  const byGoal: Record<string, { ms: number; n: number; done: number; pts: number }> = {};
  tasks.forEach((t) => {
    const key = t.goalId && getGoal(db, t.goalId) ? t.goalId : "__un";
    (byGoal[key] ||= { ms: 0, n: 0, done: 0, pts: 0 });
    byGoal[key].ms += taskTime(t, now); byGoal[key].n++; if (taskDone(t)) byGoal[key].done++; byGoal[key].pts += taskPts(t);
  });
  const rows: GoalRow[] = Object.keys(byGoal).map((k) => ({
    k, name: k === "__un" ? "Unfiled" : getGoal(db, k)!.title, horizon: k === "__un" ? "" : getGoal(db, k)!.horizon, ...byGoal[k],
  })).sort((a, b) => b.ms - a.ms);

  const openRows = rows.filter((r) => r.k !== "__un" && r.done < r.n);
  const need = openRows.length ? openRows.reduce((a, b) => (a.ms < b.ms ? a : b)) : null;

  const weeks: PeriodRange[] = [];
  for (let o = -7; o <= 0; o++) weeks.push(periodRange("week", o, today));
  const clearedByWeek = weeks.map((w) => {
    let p = 0;
    db.tasks.forEach((t) => { if (t.doneAt) { const dt = new Date(t.doneAt); if (dt >= w.start && dt <= new Date(w.end.getTime() + 86400000)) p += taskDonePts(t); } });
    return p;
  });
  let cum = 0; const cumPts = clearedByWeek.map((p) => (cum += p));
  const maxCum = Math.max(1, ...cumPts);

  const timedTasks = tasks.filter((t) => taskTime(t, now) > 0 && taskPts(t) > 0);
  const minPerPt = timedTasks.length ? Math.round(timedTasks.reduce((s, t) => s + taskTime(t, now) / 60000 / taskPts(t), 0) / timedTasks.length) : 0;

  const higher = db.goals.filter((g: Goal) => g.horizon !== "week");
  const totalDone = cumPts[cumPts.length - 1] || 0;
  const perWk = Math.max(0.1, totalDone / 8);
  const proj = higher.map((g) => {
    const s = subtree(db, g, {}, now); const remaining = s.pts - s.done;
    const wks = remaining <= 0 ? 0 : Math.ceil(remaining / perWk);
    return { title: g.title, horizon: g.horizon, pct: progressOf(db, g, now), wks, remaining };
  }).filter((x) => x.remaining > 0).slice(0, 4);

  return { totalMs, doneN, taskN: tasks.length, pts, donePts, minPerPt, rows, need, cumPts, maxCum, proj };
}
