// components/dashboard/coach/UnfiledSection.tsx
//
// Ports coach.html:396–398 (`weekUnfiled`). Same shape as GoalSection but with
// no Ring (there's no goal), a stone "Unfiled" header + `no goal` badge, and a
// dashed hairline (source: `.unfiled .wsechead{border-bottom-style:dashed}`).
// The add-task row here always adds with `goalId: ""` (source's
// `data-tin="__unfiled__"` sentinel becomes an explicit empty goalId — see
// coach.html:422's `gid==='__unfiled__'?'':gid`), so nothing gets registered
// into `weekPlan`.
"use client";
import { useState } from "react";
import type { CoachDB } from "@/lib/dashboard/coach/types";
import type { Mutate } from "./overlay";
import { getGoal, taskDone } from "@/lib/dashboard/coach/rollup";
import { uid } from "@/lib/dashboard/coach/migrate";
import { Badge } from "@/components/dashboard/ui";
import { TaskRow } from "./TaskRow";

const mono = { fontFamily: "var(--font-geist-mono), monospace" };

export function UnfiledSection({
  db,
  wk,
  tickNow,
  mutate,
  onEditTask,
  onEditSub,
}: {
  db: CoachDB;
  wk: string;
  tickNow: number;
  mutate: Mutate;
  onEditTask: (id: string) => void;
  onEditSub: (taskId: string, subId: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const tasks = db.tasks.filter((t) => t.week === wk && (!t.goalId || !getGoal(db, t.goalId)));
  const doneCount = tasks.filter((t) => taskDone(t)).length;

  function commitAdd() {
    const label = draft.trim();
    if (!label) return;
    mutate((d) => {
      d.tasks.push({
        id: uid("t"),
        goalId: "",
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
    });
    setDraft("");
  }

  return (
    <div className="mb-5">
      <div className="mb-2 flex items-center gap-2.5 border-b border-dashed border-stone-300 pb-1.5">
        <span className="text-[13.5px] font-semibold text-stone-500">Unfiled</span>
        <Badge tone="neutral">no goal</Badge>
        <span className="ml-auto whitespace-nowrap font-mono text-[11px] text-stone-400" style={mono}>
          {doneCount}/{tasks.length}
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
          placeholder="quick task…"
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
