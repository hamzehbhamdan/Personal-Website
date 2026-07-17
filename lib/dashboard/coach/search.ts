import type { CoachDB, Goal, Task } from "./types";

export function runSearch(db: CoachDB, query: string): { goals: Goal[]; tasks: Task[] } {
  const q = query.trim().toLowerCase();
  if (!q) return { goals: [], tasks: [] };
  const goals = db.goals.filter((g) => g.title.toLowerCase().includes(q)).slice(0, 6);
  const tasks = db.tasks.filter((t) => t.label.toLowerCase().includes(q) || (t.subs || []).some((s) => s.label.toLowerCase().includes(q))).slice(0, 8);
  return { goals, tasks };
}
