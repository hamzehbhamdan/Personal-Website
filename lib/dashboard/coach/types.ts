export type Horizon = "week" | "month" | "quarter" | "year";

export interface Sub {
  id: string;
  label: string;
  pts: number;
  meta: string;
  done: boolean;
}

export interface Task {
  id: string;
  goalId: string;            // "" = unfiled
  week: string;              // period key, e.g. "W2026-07-06"
  label: string;
  pts: number;               // effort estimate; ignored when subs.length (rolls up)
  note: string;
  tag: string;
  done: boolean;
  doneAt: string | null;     // ISO
  subs: Sub[];
  collapsed: boolean;        // persisted (coach.html:413)
  timeMs: number;            // accumulated tracked time
  timerStart: number | null; // wall-clock ms when running, else null
  createdAt: string;         // ISO
}

export interface Goal {
  id: string;
  horizon: Horizon;
  period: string;            // period key
  title: string;
  parentId: string;          // "" = unlinked
  recurring: boolean;
  useManual: boolean;
  manualProgress: number;    // 0..100
  notes: string;
}

export interface CoachDB {
  version: number;           // 3
  goals: Goal[];
  tasks: Task[];
  matters: string;
  memory: string;
  intakeDone: Record<string, boolean>;   // key `${horizon}:${periodKey}`
  weekPlan: Record<string, string[]>;    // weekKey -> goalId[]
  planDone: Record<string, boolean>;     // weekKey -> boolean
  board?: unknown;                        // only present pre-migration
}
