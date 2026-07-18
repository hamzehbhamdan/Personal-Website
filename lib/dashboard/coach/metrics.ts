import type { CoachDB } from "./types";
import { taskDone, taskDonePts, taskPts, taskTime } from "./rollup";
import { periodRange } from "./periods";

export interface WeekMetrics {
  total: number;
  done: number;
  completionPct: number; // 0..100, task-count based
  pointsEarned: number; // Σ effective done points (sub-rollup aware)
  pointsPlanned: number; // Σ effective planned points
  focusMs: number; // Σ tracked time (incl. a running timer)
  todo: number;
  doing: number;
}

/** KPI snapshot for a single week's tasks. `now` folds a running timer into focusMs. */
export function weekMetrics(db: CoachDB, weekKey: string, now: number = Date.now()): WeekMetrics {
  const tasks = db.tasks.filter((t) => t.week === weekKey);
  const total = tasks.length;
  const done = tasks.filter((t) => taskDone(t)).length;
  return {
    total,
    done,
    completionPct: total ? Math.round((100 * done) / total) : 0,
    pointsEarned: tasks.reduce((s, t) => s + taskDonePts(t), 0),
    pointsPlanned: tasks.reduce((s, t) => s + taskPts(t), 0),
    focusMs: tasks.reduce((s, t) => s + taskTime(t, now), 0),
    todo: tasks.filter((t) => t.stage === "todo").length,
    doing: tasks.filter((t) => t.stage === "doing").length,
  };
}

/** Consecutive completed weeks (planDone) ending at the current week. An
 *  in-progress current week (not yet planDone) does not break the streak. */
export function streak(db: CoachDB, today: Date = new Date()): number {
  const key = (off: number) => periodRange("week", off, today).key;
  let i = db.planDone[key(0)] ? 0 : 1;
  let n = 0;
  while (db.planDone[key(-i)]) {
    n++;
    i++;
  }
  return n;
}

export function statusLabel(pct: number): "On track" | "Building" | "Stalled" {
  if (pct >= 75) return "On track";
  if (pct >= 40) return "Building";
  return "Stalled";
}
