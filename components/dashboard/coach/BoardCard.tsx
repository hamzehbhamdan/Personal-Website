"use client";
import type { CoachDB, Task } from "@/lib/dashboard/coach/types";
import { getGoal, taskPts } from "@/lib/dashboard/coach/rollup";

const mono = { fontFamily: "var(--font-geist-mono), monospace" };

/** Presentational kanban card. Drag + click are wired by the wrapper in BoardPanel. */
export function BoardCard({ db, task, accent }: { db: CoachDB; task: Task; accent: string }) {
  const goal = task.goalId ? getGoal(db, task.goalId) : undefined;
  const subTotal = task.subs.length;
  const subDone = task.subs.filter((s) => s.done).length;
  const pts = taskPts(task);
  const running = task.timerStart != null;
  const pct = subTotal ? Math.round((subDone / subTotal) * 100) : 0;

  return (
    <div
      className="relative rounded-[10px] border border-stone-200 bg-white p-3 pl-3.5 hover:border-stone-300"
      style={{ boxShadow: "0 1px 1px rgba(0,0,0,0.03)" }}
    >
      <span className="absolute left-0 top-2.5 bottom-2.5 w-[3px] rounded-full" style={{ background: accent }} />
      <div className="flex items-start justify-between gap-2">
        <p className="text-[13px] leading-snug text-stone-800">{task.label}</p>
        {running && (
          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#A51C30]" title="Timer running" />
        )}
      </div>
      {(goal || task.tag || pts > 0) && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {goal ? (
            <span className="max-w-[150px] truncate rounded bg-[#faf0f1] px-1.5 py-0.5 text-[9px] uppercase tracking-[0.12em] text-[#A51C30]" style={mono}>
              {goal.title}
            </span>
          ) : task.tag ? (
            <span className="rounded bg-stone-100 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.12em] text-stone-500" style={mono}>
              {task.tag}
            </span>
          ) : null}
          {pts > 0 && (
            <span className="text-[9px] uppercase tracking-[0.12em] text-stone-400" style={mono}>
              {pts} pt{pts === 1 ? "" : "s"}
            </span>
          )}
        </div>
      )}
      {subTotal > 0 && (
        <div className="mt-2">
          <div className="h-1 overflow-hidden rounded-full bg-stone-100">
            <div className="h-full rounded-full bg-[#A51C30] transition-[width]" style={{ width: `${pct}%` }} />
          </div>
          <span className="mt-1 block text-[9px] uppercase tracking-[0.12em] text-stone-400" style={mono}>
            {subDone}/{subTotal} subtasks
          </span>
        </div>
      )}
    </div>
  );
}
