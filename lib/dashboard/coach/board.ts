import type { Task, TaskStage } from "./types";

/** Kanban columns, left→right. `accent` colors the column header + card spine. */
export const STAGES: { key: TaskStage; label: string; accent: string }[] = [
  { key: "todo", label: "To Do", accent: "#8a8a83" },
  { key: "doing", label: "In Progress", accent: "#A51C30" },
  { key: "done", label: "Done", accent: "#1c7c54" },
];

/**
 * Stage a task should occupy given its effective done-ness (spec §4.1).
 * Un-done only demotes OUT of the done column — an in-progress task stays
 * in "doing".
 */
export function stageForDone(done: boolean, prev: TaskStage): TaskStage {
  return done ? "done" : prev === "done" ? "todo" : prev;
}

/**
 * Move `t` to `stage`, keeping the done/doneAt invariant intact for BOTH
 * plain and subbed tasks (taskDone() is the effective source of truth).
 * Entering Done marks every sub done; LEAVING Done un-marks every sub —
 * otherwise taskDone() would stay true and the board/week-list would
 * disagree again in reverse. A todo↔doing move never touches subs.
 */
export function applyStage(t: Task, stage: TaskStage, nowISO: string): void {
  const leavingDone = t.stage === "done" && stage !== "done";
  t.stage = stage;
  if (stage === "done") {
    t.done = true;
    t.subs.forEach((s) => { s.done = true; });
    if (!t.doneAt) t.doneAt = nowISO;
  } else {
    t.done = false;
    t.doneAt = null;
    if (leavingDone) t.subs.forEach((s) => { s.done = false; });
  }
}
