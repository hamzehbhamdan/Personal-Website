import type { CoachDB, Goal, Task } from "./types";

export const clamp = (n: number): number => Math.max(0, Math.min(100, Math.round(n || 0)));
export const avg = (a: number[]): number => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0);

export const getGoal = (db: CoachDB, id: string) => db.goals.find((g) => g.id === id);
export const childrenOf = (db: CoachDB, id: string) => db.goals.filter((g) => g.parentId === id);
export const tasksForGoal = (db: CoachDB, id: string) => db.tasks.filter((t) => t.goalId === id);

export function taskPts(t: Task): number {
  return t.subs && t.subs.length ? t.subs.reduce((s, x) => s + (+x.pts || 0), 0) : +t.pts || 0;
}
export function taskDonePts(t: Task): number {
  return t.subs && t.subs.length
    ? t.subs.filter((x) => x.done).reduce((s, x) => s + (+x.pts || 0), 0)
    : t.done ? +t.pts || 0 : 0;
}
export function taskDone(t: Task): boolean {
  return t.subs && t.subs.length ? t.subs.every((x) => x.done) : !!t.done;
}
export function taskTime(t: Task, now: number = Date.now()): number {
  return (+t.timeMs || 0) + (t.timerStart ? now - t.timerStart : 0);
}

export interface Subtree { pts: number; done: number; ms: number; n: number; dn: number; }
export function subtree(db: CoachDB, g: Goal, seen: Record<string, 1> = {}, now: number = Date.now()): Subtree {
  if (seen[g.id]) return { pts: 0, done: 0, ms: 0, n: 0, dn: 0 };
  seen[g.id] = 1;
  let pts = 0, done = 0, ms = 0, n = 0, dn = 0;
  tasksForGoal(db, g.id).forEach((t) => { pts += taskPts(t); done += taskDonePts(t); ms += taskTime(t, now); n++; if (taskDone(t)) dn++; });
  childrenOf(db, g.id).forEach((k) => { const s = subtree(db, k, seen, now); pts += s.pts; done += s.done; ms += s.ms; n += s.n; dn += s.dn; });
  return { pts, done, ms, n, dn };
}

export function progressOf(db: CoachDB, g: Goal, now: number = Date.now()): number {
  if (g.useManual) return clamp(g.manualProgress);
  const s = subtree(db, g, {}, now);
  if (s.pts > 0) return clamp((100 * s.done) / s.pts);
  return clamp(g.manualProgress);
}
export function statusOf(db: CoachDB, g: Goal): "done" | "in" | "none" {
  const p = progressOf(db, g);
  return p >= 100 ? "done" : p > 0 ? "in" : "none";
}
