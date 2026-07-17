// components/dashboard/coach/SubtaskModal.tsx
//
// Ports coach.html:585-596 (`editSub`). Every write goes through `mutate`, which
// re-derives a migrated draft from `prev` (never from the `db` snapshot prop)
// per the STATE-MUTATION CONVENTION: Save/Delete both locate the task then the
// sub fresh inside the draft rather than trusting the `task`/`sub` read below.
"use client";
import { useState } from "react";
import type { CoachDB } from "@/lib/dashboard/coach/types";
import type { Mutate } from "./overlay";
import { Modal } from "@/components/dashboard/ui";

const mono = { fontFamily: "var(--font-geist-mono), monospace" };
const btnPrimary =
  "rounded-[8px] bg-[#A51C30] px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-white hover:bg-[#8a1728] disabled:opacity-50";
const btnGhost =
  "rounded-[8px] border border-stone-200 px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-stone-500 hover:border-stone-300 disabled:opacity-50";
const labelCls = "mb-1 block text-[11px] uppercase tracking-[0.05em] text-stone-500";
const inputCls =
  "w-full rounded-[8px] border border-stone-200 bg-white px-2.5 py-2 text-[13px] text-stone-800 outline-none focus:border-[#A51C30]";

export function SubtaskModal({
  db,
  mutate,
  taskId,
  subId,
  onClose,
}: {
  db: CoachDB;
  mutate: Mutate;
  taskId: string;
  subId: string;
  onClose: () => void;
}) {
  const task = db.tasks.find((t) => t.id === taskId);
  const sub = task?.subs.find((s) => s.id === subId);

  const [label, setLabel] = useState(sub?.label ?? "");
  const [pts, setPts] = useState(sub?.pts ?? 0);
  const [meta, setMeta] = useState(sub?.meta ?? "");

  if (!task || !sub) return null;

  function handleSave() {
    mutate((draft) => {
      const t = draft.tasks.find((x) => x.id === taskId);
      if (!t) return;
      const s = t.subs.find((x) => x.id === subId);
      if (!s) return;
      s.label = label.trim() || s.label;
      s.pts = pts || 0;
      s.meta = meta.trim();
    });
    onClose();
  }

  function handleDelete() {
    mutate((draft) => {
      const t = draft.tasks.find((x) => x.id === taskId);
      if (!t) return;
      t.subs = t.subs.filter((x) => x.id !== subId);
    });
    onClose();
  }

  return (
    <Modal title="Edit subtask" onClose={onClose}>
      <div className="mb-3">
        <label className={labelCls}>Subtask</label>
        <input value={label} onChange={(e) => setLabel(e.target.value)} className={inputCls} />
      </div>

      <div className="mb-3 grid grid-cols-2 gap-2.5">
        <div>
          <label className={labelCls}>Points</label>
          <input
            type="number"
            min={0}
            value={pts}
            onChange={(e) => setPts(+e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Meta (optional)</label>
          <input value={meta} onChange={(e) => setMeta(e.target.value)} placeholder="detail…" className={inputCls} />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={handleSave} className={btnPrimary} style={mono}>
          Save
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
