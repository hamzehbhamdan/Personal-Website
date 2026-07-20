// components/dashboard/coach/GoalSection.tsx
//
// Ports coach.html:393–395 (`weekSection`). A bounded group under a hairline
// header: `Ring(progressOf(db,g),30)` + goal title (click -> onEditGoal) +
// horizon badge + recurring marker (♻) + `done/total · fmtHM(trackedMs)` meta,
// then one `TaskRow` per `week`+`goalId`-matching task, then an add-task row
// (Enter or `+`) that pushes a new task with this `goalId` AND registers the
// goal into `weekPlan[wk]` (parity with coach.html:422/430 — `bindWeek`'s
// `data-ta` handler calls `addTask(v, gid, wk)`, and `addTask` itself pushes
// `goalId` into `weekPlan[wk]`).
"use client";
import { useState } from "react";
import type { CoachDB, Goal } from "@/lib/dashboard/coach/types";
import type { Mutate } from "./overlay";
import { progressOf, taskDone, taskTime } from "@/lib/dashboard/coach/rollup";
import { fmtHM } from "@/lib/dashboard/coach/timers";
import { uid } from "@/lib/dashboard/coach/migrate";
import { Badge, Ring } from "@/components/dashboard/ui";
import { focusRing } from "./a11y";
import { TaskRow } from "./TaskRow";

const mono = { fontFamily: "var(--font-geist-mono), monospace" };

export function GoalSection({
  db,
  g,
  wk,
  tickNow,
  mutate,
  onEditGoal,
  onEditTask,
  onEditSub,
}: {
  db: CoachDB;
  g: Goal;
  wk: string;
  tickNow: number;
  mutate: Mutate;
  onEditGoal: (id: string) => void;
  onEditTask: (id: string) => void;
  onEditSub: (taskId: string, subId: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const tasks = db.tasks.filter((t) => t.week === wk && t.goalId === g.id);
  const pct = progressOf(db, g, tickNow);
  const doneCount = tasks.filter((t) => taskDone(t)).length;
  const trackedMs = tasks.reduce((s, t) => s + taskTime(t, tickNow), 0);

  function commitAdd() {
    const label = draft.trim();
    if (!label) return;
    mutate((d) => {
      d.tasks.push({
        id: uid("t"),
        goalId: g.id,
        week: wk,
        label,
        pts: 1,
        note: "",
        tag: "",
        done: false,
        doneAt: null,
        stage: "todo",
        subs: [],
        collapsed: false,
        timeMs: 0,
        timerStart: null,
        createdAt: new Date().toISOString(),
      });
      d.weekPlan[wk] = d.weekPlan[wk] || [];
      if (!d.weekPlan[wk].includes(g.id)) d.weekPlan[wk].push(g.id);
    });
    setDraft("");
  }

  return (
    <div className="mb-5">
      <div className="mb-2 flex items-center gap-2.5 border-b border-stone-200 pb-1.5">
        <Ring pct={pct} size={30} />
        <button
          type="button"
          onClick={() => onEditGoal(g.id)}
          aria-label={`Edit goal: ${g.title}`}
          className={`cursor-pointer rounded-[4px] text-left text-[13.5px] font-semibold text-stone-900 hover:text-[#A51C30] ${focusRing}`}
        >
          {g.title}
        </button>
        <Badge tone="neutral">{g.horizon}</Badge>
        {g.recurring && (
          <span className="text-[11px] text-[#A51C30]" title="recurring">
            ♻
          </span>
        )}
        <span className="ml-auto whitespace-nowrap font-mono text-[11px] text-stone-400" style={mono}>
          {doneCount}/{tasks.length} · {fmtHM(trackedMs)}
        </span>
      </div>

      {tasks.map((t) => (
        <TaskRow
          key={t.id}
          task={t}
          surface="week"
          db={db}
          mutate={mutate}
          tickNow={tickNow}
          onEdit={onEditTask}
          onEditSub={onEditSub}
        />
      ))}

      <div className="mt-1.5 flex gap-1.5">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitAdd();
          }}
          placeholder="add a task…"
          className="flex-1 rounded-[8px] border border-stone-200 bg-white px-[9px] py-1.5 text-[12.5px] outline-none focus:border-[#A51C30]"
        />
        <button
          type="button"
          onClick={commitAdd}
          className="rounded-[8px] border border-stone-200 px-[11px] font-semibold text-[#A51C30] hover:border-[#A51C30]"
        >
          +
        </button>
      </div>
    </div>
  );
}
