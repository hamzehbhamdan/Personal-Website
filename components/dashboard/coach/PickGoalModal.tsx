// components/dashboard/coach/PickGoalModal.tsx
//
// Ports coach.html:438-449 (`pickGoalForWeek`). Rendered wide (mirrors the
// artifact's `.modal-card.wide`). Every write goes through `mutate`, which
// re-derives a migrated draft from `prev` (never from the `db` snapshot prop)
// per the STATE-MUTATION CONVENTION.
"use client";
import { useState } from "react";
import type { CoachDB, Horizon } from "@/lib/dashboard/coach/types";
import type { Mutate } from "./overlay";
import { periodRange } from "@/lib/dashboard/coach/periods";
import { uid } from "@/lib/dashboard/coach/migrate";
import { Badge, Modal } from "@/components/dashboard/ui";

const mono = { fontFamily: "var(--font-geist-mono), monospace" };
const btnPrimary =
  "rounded-[8px] bg-[#A51C30] px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-white hover:bg-[#8a1728] disabled:opacity-50";
const btnGhost =
  "rounded-[8px] border border-stone-200 px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-stone-500 hover:border-stone-300 disabled:opacity-50";
const btnGhostSmall =
  "rounded-[6px] border border-stone-200 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-stone-500 hover:border-[#A51C30] hover:text-[#A51C30]";
const labelCls = "mb-1 block text-[11px] uppercase tracking-[0.05em] text-stone-500";
const inputCls =
  "w-full rounded-[8px] border border-stone-200 bg-white px-2.5 py-2 text-[13px] text-stone-800 outline-none focus:border-[#A51C30]";

// Same period-tier ordering used by the artifact's goal listings (coach.html:440).
const HORIZON_ORDER: Record<Horizon, number> = { week: 0, month: 1, quarter: 2, year: 3 };

export function PickGoalModal({
  db,
  mutate,
  today,
  horizon,
  offset,
  onClose,
}: {
  db: CoachDB;
  mutate: Mutate;
  today: Date;
  horizon: Horizon;
  offset: number;
  onClose: () => void;
}) {
  void horizon; // this modal always plans the CURRENT WEEK's plan (weekPlan is week-keyed); kept for overlay prop-shape parity

  const [newTitle, setNewTitle] = useState("");
  const wk = periodRange("week", offset, today).key;
  const goals = [...db.goals].sort((a, b) => HORIZON_ORDER[a.horizon] - HORIZON_ORDER[b.horizon]);

  function handleAdd(goalId: string) {
    mutate((draft) => {
      draft.weekPlan[wk] = draft.weekPlan[wk] || [];
      if (!draft.weekPlan[wk].includes(goalId)) draft.weekPlan[wk].push(goalId);
    });
    onClose();
  }

  function handleCreateAndAdd() {
    const v = newTitle.trim();
    if (!v) return;
    const id = uid("g");
    mutate((draft) => {
      draft.goals.push({
        id,
        horizon: "week",
        period: wk,
        title: v,
        parentId: "",
        recurring: false,
        useManual: false,
        manualProgress: 0,
        notes: "",
      });
      draft.weekPlan[wk] = draft.weekPlan[wk] || [];
      draft.weekPlan[wk].push(id);
    });
    onClose();
  }

  return (
    <Modal title="Work toward a goal this week" onClose={onClose} size="wide">
      <div className="mb-3 text-[12.5px] text-stone-500">
        Pick a goal to add as a section this week, then add its tasks. Or create a fresh week goal.
      </div>

      {goals.length === 0 ? (
        <div className="text-[12.5px] text-stone-400">No goals yet. Create one below or in the higher horizons.</div>
      ) : (
        <div className="divide-y divide-stone-200">
          {goals.map((g) => (
            <div key={g.id} className="flex items-center gap-2.5 py-2">
              <span className="flex-1 text-[13px] text-stone-800">{g.title}</span>
              <Badge tone="neutral">{g.horizon}</Badge>
              <button type="button" onClick={() => handleAdd(g.id)} className={btnGhostSmall} style={mono}>
                Add
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4">
        <label className={labelCls}>Or new week goal</label>
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleCreateAndAdd();
          }}
          placeholder="e.g. Reset the apartment"
          className={inputCls}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={handleCreateAndAdd} className={btnPrimary} style={mono}>
          Create &amp; add
        </button>
        <button type="button" onClick={onClose} className={btnGhost} style={mono}>
          Cancel
        </button>
      </div>
    </Modal>
  );
}
