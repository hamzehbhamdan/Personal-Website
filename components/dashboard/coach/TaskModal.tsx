// components/dashboard/coach/TaskModal.tsx
//
// Ports coach.html:562-584 (`openTask`). Every write goes through `mutate`,
// which re-derives a migrated draft from `prev` (never from the `db` snapshot
// prop) per the STATE-MUTATION CONVENTION.
"use client";
import { useState } from "react";
import type { CoachDB, Horizon } from "@/lib/dashboard/coach/types";
import type { Mutate } from "./overlay";
import { taskPts, taskTime } from "@/lib/dashboard/coach/rollup";
import { fmtHM } from "@/lib/dashboard/coach/timers";
import { uid } from "@/lib/dashboard/coach/migrate";
import { Modal } from "@/components/dashboard/ui";

const mono = { fontFamily: "var(--font-geist-mono), monospace" };
const btnPrimary =
  "rounded-[8px] bg-[#A51C30] px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-white hover:bg-[#8a1728] disabled:opacity-50";
const btnGhost =
  "rounded-[8px] border border-stone-200 px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-stone-500 hover:border-stone-300 disabled:opacity-50";
const labelCls = "mb-1 block text-[11px] uppercase tracking-[0.05em] text-stone-500";
const inputCls =
  "w-full rounded-[8px] border border-stone-200 bg-white px-2.5 py-2 text-[13px] text-stone-800 outline-none focus:border-[#A51C30] disabled:bg-stone-50 disabled:text-stone-400";

// Same period-tier ordering used by the artifact's `weekPlan`/goal-select sorts
// (coach.html:440, :564): week < month < quarter < year.
const HORIZON_ORDER: Record<Horizon, number> = { week: 0, month: 1, quarter: 2, year: 3 };

export function TaskModal({
  db,
  mutate,
  today,
  taskId,
  onClose,
}: {
  db: CoachDB;
  mutate: Mutate;
  today: Date;
  taskId: string;
  onClose: () => void;
}) {
  void today; // not needed for task-level fields; kept for prop-shape parity with the other overlay modals

  const task = db.tasks.find((t) => t.id === taskId);
  const grp = !!task && task.subs.length > 0;

  const [label, setLabel] = useState(task?.label ?? "");
  const [goalSel, setGoalSel] = useState(task?.goalId ?? "");
  const [pts, setPts] = useState(task ? (grp ? taskPts(task) : task.pts) : 0);
  const [tag, setTag] = useState(task?.tag ?? "");
  const [note, setNote] = useState(task?.note ?? "");

  if (!task) return null;

  const sortedGoals = [...db.goals].sort((a, b) => HORIZON_ORDER[a.horizon] - HORIZON_ORDER[b.horizon]);

  function handleSave() {
    mutate((draft) => {
      const t = draft.tasks.find((x) => x.id === taskId);
      if (!t) return;
      t.label = label.trim() || t.label;
      t.goalId = goalSel;
      if (!grp) t.pts = pts || 0;
      t.tag = tag.trim();
      t.note = note.trim();
      if (goalSel) {
        draft.weekPlan[t.week] = draft.weekPlan[t.week] || [];
        if (!draft.weekPlan[t.week].includes(goalSel)) draft.weekPlan[t.week].push(goalSel);
      }
    });
    onClose();
  }

  function handleAddSubtask() {
    mutate((draft) => {
      const t = draft.tasks.find((x) => x.id === taskId);
      if (!t) return;
      t.subs.push({ id: uid("s"), label: "New subtask", pts: 1, meta: "", done: false });
    });
  }

  function handleDelete() {
    mutate((draft) => {
      draft.tasks = draft.tasks.filter((x) => x.id !== taskId);
    });
    onClose();
  }

  return (
    <Modal title="Edit task" onClose={onClose}>
      <div className="mb-3">
        <label className={labelCls}>Task</label>
        <input value={label} onChange={(e) => setLabel(e.target.value)} className={inputCls} />
      </div>

      <div className="mb-3 grid grid-cols-2 gap-2.5">
        <div>
          <label className={labelCls}>Goal it feeds</label>
          <select value={goalSel} onChange={(e) => setGoalSel(e.target.value)} className={inputCls}>
            <option value="">— Unfiled —</option>
            {sortedGoals.map((g) => (
              <option key={g.id} value={g.id}>
                {g.title} ({g.horizon})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>{grp ? "Points (rolls up)" : "Points (effort estimate)"}</label>
          <input
            type="number"
            min={0}
            value={grp ? taskPts(task) : pts}
            onChange={(e) => setPts(+e.target.value)}
            disabled={grp}
            className={inputCls}
          />
        </div>
      </div>

      <div className="mb-3 grid grid-cols-2 gap-2.5">
        <div>
          <label className={labelCls}>Tag (optional)</label>
          <input
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            placeholder="e.g. today, admin"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Time tracked</label>
          <input value={fmtHM(taskTime(task))} disabled className={inputCls} />
        </div>
      </div>

      <div className="mb-3">
        <label className={labelCls}>Note (optional)</label>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className={inputCls} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={handleSave} className={btnPrimary} style={mono}>
          Save
        </button>
        <button type="button" onClick={handleAddSubtask} className={btnGhost} style={mono}>
          + Add subtask
        </button>
        <button type="button" onClick={handleDelete} className={btnGhost} style={mono}>
          Delete
        </button>
        <button type="button" onClick={onClose} className={btnGhost} style={mono}>
          Cancel
        </button>
      </div>
    </Modal>
  );
}
