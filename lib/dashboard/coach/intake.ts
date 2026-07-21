import type { CoachDB, Horizon } from "./types";
import { periodRange, periodLabelOf } from "./periods";
import { getGoal, tasksForGoal, progressOf, taskPts, taskDone, taskTime } from "./rollup";
import { uid } from "./migrate";
import type { ProposedGoal } from "./parse";

const INTAKE_ORDER: Horizon[] = ["year", "quarter", "month"];

export function unsetHorizons(db: CoachDB, today: Date = new Date()): Horizon[] {
  return INTAKE_ORDER.filter((h) => {
    const k = periodRange(h, 0, today).key;
    return !db.goals.some((g) => g.horizon === h && g.period === k) && !db.intakeDone[h + ":" + k];
  });
}

/** Create proposed goals parent-first, linking `laddersTo` by title, then mark the
 *  OPENED intake `horizons` done for the current period — parity with coach.html:703,
 *  which marks the horizons that were passed to openIntake (NOT the horizons derived
 *  from the AI's proposals), so the banner stops nagging even for un-proposed horizons. */
export function addProposedGoals(db: CoachDB, proposed: ProposedGoal[], horizons: Horizon[], today: Date = new Date()): void {
  const order: Record<string, number> = { year: 0, quarter: 1, month: 2, week: 3 };
  const picks = proposed.slice().sort((a, b) => (order[a.horizon] ?? 9) - (order[b.horizon] ?? 9));
  const titleToId: Record<string, string> = {};
  db.goals.forEach((g) => { titleToId[g.title.toLowerCase()] = g.id; });
  picks.forEach((g) => {
    if (typeof g.title !== "string" || !g.title.trim()) return; // skip malformed AI proposal
    const h = (order[g.horizon] != null ? g.horizon : "month") as Horizon;
    const per = periodRange(h, 0, today).key;
    let parentId = "";
    if (g.laddersTo && g.laddersTo !== "null") parentId = titleToId[String(g.laddersTo).toLowerCase()] || "";
    const id = uid("g");
    db.goals.push({ id, horizon: h, period: per, title: g.title, parentId, recurring: false, useManual: false, manualProgress: 0, notes: "" });
    titleToId[g.title.toLowerCase()] = id;
  });
  horizons.forEach((h) => { db.intakeDone[h + ":" + periodRange(h, 0, today).key] = true; });
}

export function isFirstRun(db: CoachDB): boolean { return !db.matters && db.goals.length === 0; }

/** Coach persona for the intake flow — travels as the `system` arg to /api/ai. */
export function intakeSystemPrompt(db: CoachDB, horizons: Horizon[], today: Date = new Date()): string {
  const periods = horizons.map((h) => h + " (" + periodRange(h, 0, today).label + ")").join(", ");
  const firstRun = isFirstRun(db);
  return `You are Hamzeh's executive coach running a goal-setting intake. Help him set goals for the horizons that aren't set yet: ${periods}. Work TOP-DOWN (year, then quarter, then month) so lower goals ladder up. Ask ONE focused question at a time; keep each message under ~80 words; warm and specific.
${firstRun ? "This is his FIRST session: begin by understanding what truly matters to him — priorities, values, what success looks like, what drains him — and reflect it back before proposing goals." : "Use WHAT MATTERS and MEMORY from the JSON to stay aligned."}
When you understand enough, PROPOSE goals for ALL target horizons at once in ONE fenced block EXACTLY like:
\`\`\`goals
[{"horizon":"year","title":"...","laddersTo":null},{"horizon":"quarter","title":"...","laddersTo":"<exact year goal title>"},{"horizon":"month","title":"...","laddersTo":"<exact quarter goal title>"}]
\`\`\`
1-3 goals per horizon; a lower goal must ladder up to a higher one you also propose. Don't propose until you've asked one or two questions.`;
}

/** The per-turn instruction — travels as `prompt`. Persona/templates travel separately
 *  as `system` (intakeSystemPrompt); structured data travels as the delimited `data` arg. */
export function intakeTurnPrompt(transcript: string, kick: boolean): string {
  return "Conversation so far:\n" + (transcript || "(none yet)") + "\n\n" +
    (kick ? "Begin now: greet briefly (1-2 sentences), reference what matters / memory if present, and ask your first question."
          : "Continue as Coach with your next single message.");
}

/** Coach persona for the free-form chat tab — travels as the `system` arg to /api/ai. */
export const COACH_CHAT_SYSTEM = `You are Hamzeh's executive coach. He is viewing his goals dashboard. Answer his question directly and specifically using the JSON context (his goals, progress, tasks, what matters, and memory) provided as untrusted data. Be concise (under ~120 words), warm, and concrete; reference actual goal titles and numbers. Never invent goals or data not present in the context.`;

export interface CoachCtxGoal {
  horizon: Horizon; period: string; title: string; progress: number; recurring: boolean;
  ladders_up_to: string | null;
  tasks: { title: string; done: boolean; pts: number; minutes: number }[];
}
export interface CoachCtx {
  today: string; what_matters: string; memory: string; viewing: { horizon: Horizon; period: string };
  goals: CoachCtxGoal[];
}
export function ctx(db: CoachDB, view: { horizon: Horizon; offset: number }, today: Date = new Date()): CoachCtx {
  const now = today.getTime();
  return {
    today: today.toISOString().slice(0, 10),
    what_matters: db.matters || "", memory: db.memory || "",
    viewing: { horizon: view.horizon, period: periodRange(view.horizon, view.offset, today).label },
    goals: db.goals.map((g) => ({
      horizon: g.horizon, period: periodLabelOf(g), title: g.title, progress: progressOf(db, g, now), recurring: g.recurring,
      ladders_up_to: g.parentId ? (getGoal(db, g.parentId)?.title ?? null) : null,
      tasks: tasksForGoal(db, g.id).map((t) => ({ title: t.label, done: taskDone(t), pts: taskPts(t), minutes: Math.round(taskTime(t, now) / 60000) })),
    })),
  };
}
