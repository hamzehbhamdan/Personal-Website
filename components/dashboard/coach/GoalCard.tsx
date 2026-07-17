// components/dashboard/coach/GoalCard.tsx
//
// Ports coach.html:468-488 (`goalCard`) plus the portion of `bindHigher`
// (:489-497) and `bindExpandedTasks` (:498-507) that are scoped to a single
// card: the `⋯` edit button, the "toward <parent>"/child-chip jump links, the
// `+ {NEXTDOWN}` sub-goal button, the `gexp` expand toggle, and (when expanded)
// one `TaskRow surface="expanded"` per task filed against this goal.
//
// CRITICAL: `expanded`/`onToggleExpand` are LOCAL UI state owned by the parent
// (HigherHorizon) — parity with the artifact's transient `g._exp` flag
// (coach.html:493: `g._exp=!g._exp;render()` — no `save()`). This component
// must never persist expansion via `mutate` or store it on the Goal object.
"use client";
import type { CoachDB, Goal } from "@/lib/dashboard/coach/types";
import type { Mutate, SetOverlay, JumpTo } from "./overlay";
import { childrenOf, getGoal, progressOf, subtree } from "@/lib/dashboard/coach/rollup";
import { findOffset, NEXTDOWN, NEXTUP } from "@/lib/dashboard/coach/periods";
import { fmtHM } from "@/lib/dashboard/coach/timers";
import { Card, Ring } from "@/components/dashboard/ui";
import { TaskRow } from "./TaskRow";

export function GoalCard({
  goal,
  db,
  expanded,
  onToggleExpand,
  mutate,
  tickNow,
  setOverlay,
  jumpTo,
  onEditGoal,
  today,
}: {
  goal: Goal;
  db: CoachDB;
  expanded: boolean;
  onToggleExpand: () => void;
  mutate: Mutate;
  tickNow: number;
  setOverlay: SetOverlay;
  jumpTo: JumpTo;
  onEditGoal: (id: string) => void;
  today: Date;
}) {
  const p = progressOf(db, goal, tickNow);
  const parent = goal.parentId ? getGoal(db, goal.parentId) : undefined;
  const kids = childrenOf(db, goal.id);
  const s = subtree(db, goal, {}, tickNow);
  const nextUp = NEXTUP[goal.horizon];
  const nextDown = NEXTDOWN[goal.horizon];
  const tasks = db.tasks.filter((t) => t.goalId === goal.id);

  // coach.html:510 (`jumpTo(id)`) resolves the offset with NO explicit
  // `today` arg — `findOffset`'s default (`new Date()`) is used there. Here we
  // thread the module-frozen `today` (CoachView's `TODAY`) instead, so a jump
  // lands on the period that contained the target goal at load time, not
  // whatever period a stale click-time `new Date()` would resolve to.
  function jumpToGoal(target: Goal) {
    jumpTo(target.horizon, findOffset(target.horizon, target.period, today));
  }

  const onEditTask = (id: string) => setOverlay({ kind: "task", id });
  const onEditSub = (taskId: string, subId: string) => setOverlay({ kind: "sub", taskId, subId });

  return (
    <Card className="mb-[11px] px-[15px] py-[14px]">
      <div className="flex items-start gap-3">
        <div className="flex-none">
          <Ring pct={p} size={46} />
        </div>

        <div className="min-w-0 flex-1">
          <div
            onClick={() => onEditGoal(goal.id)}
            className="cursor-pointer text-[15px] font-semibold text-stone-900 hover:text-[#A51C30]"
          >
            {goal.title} {goal.recurring && <span className="text-[11px] text-[#A51C30]">♻</span>}
          </div>

          {parent ? (
            <div className="mt-[2px] text-[11.5px] text-stone-400">
              toward{" "}
              <span
                onClick={() => jumpToGoal(parent)}
                className="cursor-pointer text-[#A51C30] no-underline"
              >
                {parent.title}
              </span>
            </div>
          ) : (
            nextUp && (
              <div className="mt-[2px] text-[11.5px] text-stone-400 opacity-70">no {nextUp} link</div>
            )
          )}

          {kids.length > 0 && (
            <div className="mb-[2px] mt-[9px] flex flex-wrap gap-[6px]">
              {kids.map((k) => (
                <span
                  key={k.id}
                  onClick={() => jumpToGoal(k)}
                  className="cursor-pointer rounded-full bg-stone-100 px-[9px] py-[3px] text-[11px] text-[#6b6450]"
                >
                  {k.title} · {progressOf(db, k, tickNow)}%
                </span>
              ))}
            </div>
          )}

          <div className="mt-[7px] text-[11.5px] text-stone-400">
            {s.n} task{s.n === 1 ? "" : "s"} · {s.dn} done · {fmtHM(s.ms)} tracked
          </div>

          {expanded && (
            <div className="mt-[11px] border-t border-stone-200 pt-[10px]">
              {tasks.length ? (
                tasks.map((t) => (
                  <TaskRow
                    key={t.id}
                    task={t}
                    surface="expanded"
                    db={db}
                    mutate={mutate}
                    tickNow={tickNow}
                    onEdit={onEditTask}
                    onEditSub={onEditSub}
                  />
                ))
              ) : (
                <div className="mt-0 text-[11.5px] leading-[1.6] text-stone-400">
                  No tasks attached to this goal yet. Add them from the Week view.
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-none flex-col items-end gap-[6px]">
          <button
            type="button"
            onClick={() => onEditGoal(goal.id)}
            title="Edit"
            className="border-none bg-transparent px-[2px] text-[17px] leading-none text-stone-400 hover:text-[#A51C30]"
          >
            ⋯
          </button>
          <button
            type="button"
            onClick={onToggleExpand}
            className="rounded-[8px] border border-stone-200 px-[9px] py-[3px] text-[11px] text-stone-400 hover:border-[#A51C30] hover:text-[#A51C30]"
          >
            {expanded ? "hide" : s.n ? `${s.n} tasks` : "tasks"}
          </button>
          {nextDown && (
            <button
              type="button"
              onClick={() => setOverlay({ kind: "goal", parentForNew: goal.id })}
              className="cursor-pointer rounded-full bg-stone-100 px-[9px] py-[3px] text-[11px] text-[#6b6450]"
            >
              + {nextDown}
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}
