import type { Task, TaskStage } from "./types";

/** Kanban columns, left→right. `accent` colors the column header + card spine. */
export const STAGES: { key: TaskStage; label: string; accent: string }[] = [
  { key: "todo", label: "To Do", accent: "#8a8a83" },
  { key: "doing", label: "In Progress", accent: "#A51C30" },
  { key: "done", label: "Done", accent: "#1c7c54" },
];

/**
 * Move `t` to `stage`, keeping the done/doneAt invariant intact
 * (stage==="done" ⇔ done===true). Mutates the task in place — call inside a
 * coach `mutate` draft. Moving into Done stamps `doneAt` once (preserving an
 * existing timestamp); moving out of Done clears both `done` and `doneAt`.
 */
export function applyStage(t: Task, stage: TaskStage, nowISO: string): void {
  t.stage = stage;
  if (stage === "done") {
    t.done = true;
    if (!t.doneAt) t.doneAt = nowISO;
  } else {
    t.done = false;
    t.doneAt = null;
  }
}
