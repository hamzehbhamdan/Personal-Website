import type { CoachDB, Goal } from "./types";

export function emptyCoachDB(): CoachDB {
  return { version: 3, goals: [], tasks: [], matters: "", memory: "",
    intakeDone: {}, weekPlan: {}, planDone: {} };
}

/** Idempotent field backfill — the artifact's DB-init block (coach.html:240–244)
 *  minus migrate() (which needs `today` and lives in migrate.ts).
 *  NOTE: `{ ...emptyCoachDB(), ...raw }` keeps raw.goals/raw.tasks by reference
 *  and the forEach mutates them in place. Callers that hold a live app_state
 *  object MUST pass a clone (all callers here pass structuredClone). */
export function normalize(raw: Partial<CoachDB> | null | undefined): CoachDB {
  const db = { ...emptyCoachDB(), ...(raw ?? {}) } as CoachDB;
  if (!Array.isArray(db.goals)) db.goals = [];
  if (!Array.isArray(db.tasks)) db.tasks = [];
  if (db.matters == null) db.matters = "";
  if (db.memory == null) db.memory = "";
  if (!db.intakeDone || typeof db.intakeDone !== "object") db.intakeDone = {};
  if (!db.weekPlan || typeof db.weekPlan !== "object") db.weekPlan = {};
  if (!db.planDone || typeof db.planDone !== "object") db.planDone = {};
  db.goals.forEach((g: Goal) => {
    if (g.recurring == null) g.recurring = false;
    if (g.useManual == null) g.useManual = false;
    if (g.manualProgress == null) g.manualProgress = 0;
  });
  return db;
}
