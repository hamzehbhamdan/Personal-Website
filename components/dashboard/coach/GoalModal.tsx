// components/dashboard/coach/GoalModal.tsx
//
// Ports coach.html:521-559 (`parentSelect` + `openGoal`) plus the lazy-goal-creation
// portion of `suggestTasks` (:603-612) that fires when a suggested task is added
// before the (new) goal itself has ever been saved.
//
// Both new-goal and edit-goal flows share a STABLE id (`stableId`, mirrors the
// artifact's `g.id` — assigned once at open time, coach.html:525) so that tapping
// a "+ Add" suggestion can lazily insert the not-yet-saved goal into `draft.goals`
// (coach.html:611: `if(!getGoal(g.id)){ DB.goals.push({id:g.id,...}) }`) using a
// stable reference that later Save calls reconcile against instead of duplicating.
//
// Every write goes through `mutate`, which re-derives a migrated draft from `prev`
// (never from the `db` snapshot prop) per the STATE-MUTATION CONVENTION.
"use client";
import { useState } from "react";
import type { CoachDB, Horizon } from "@/lib/dashboard/coach/types";
import type { Mutate } from "./overlay";
import { periodRange, periodLabelOf, HORIZONS, NEXTUP, NEXTDOWN } from "@/lib/dashboard/coach/periods";
import { getGoal } from "@/lib/dashboard/coach/rollup";
import { uid } from "@/lib/dashboard/coach/migrate";
import { askAi } from "@/lib/dashboard/coach/ai";
import { parseList } from "@/lib/dashboard/coach/parse";
import { Modal } from "@/components/dashboard/ui";

const mono = { fontFamily: "var(--font-geist-mono), monospace" };
const btnPrimary =
  "rounded-[8px] bg-[#A51C30] px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-white hover:bg-[#8a1728] disabled:opacity-50";
const btnGhost =
  "rounded-[8px] border border-stone-200 px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-stone-500 hover:border-stone-300 disabled:opacity-50";
const btnCrimsonOutline =
  "rounded-[8px] border border-[#A51C30] px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-[#A51C30] hover:bg-[#A51C30] hover:text-white disabled:opacity-50";
const btnGhostSmall =
  "rounded-[6px] border border-stone-200 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-stone-500 hover:border-[#A51C30] hover:text-[#A51C30] disabled:opacity-50";
const labelCls = "mb-1 block text-[11px] uppercase tracking-[0.05em] text-stone-500";
const inputCls =
  "w-full rounded-[8px] border border-stone-200 bg-white px-2.5 py-2 text-[13px] text-stone-800 outline-none focus:border-[#A51C30]";

export function GoalModal({
  db,
  mutate,
  today,
  horizon,
  offset,
  goalId,
  parentForNew,
  onClose,
}: {
  db: CoachDB;
  mutate: Mutate;
  today: Date;
  horizon: Horizon;
  offset: number;
  goalId?: string;
  parentForNew?: string;
  onClose: () => void;
}) {
  const existing = goalId ? getGoal(db, goalId) : undefined;
  const parentGoalForNew = parentForNew ? getGoal(db, parentForNew) : undefined;

  // Initial horizon (coach.html:525): a brand-new sub-goal (opened via
  // `parentForNew`) defaults one rung below its parent; otherwise it defaults to
  // the horizon currently being viewed.
  const initialHorizon: Horizon =
    existing?.horizon ?? (parentGoalForNew ? NEXTDOWN[parentGoalForNew.horizon] ?? horizon : horizon);
  // Initial period (coach.html:526): computed once at open time from the initial
  // horizon; only re-derived on Save if the horizon field actually changes.
  const initialPeriod: string =
    existing?.period ?? periodRange(initialHorizon, initialHorizon === horizon ? offset : 0, today).key;
  // Stable id assigned once at open time (mirrors `g.id`, coach.html:525) so the
  // suggest-tasks lazy-create path and the eventual Save both target the same row.
  const [stableId] = useState<string>(() => goalId ?? uid("g"));

  const [title, setTitle] = useState(existing?.title ?? "");
  const [selHorizon, setSelHorizon] = useState<Horizon>(initialHorizon);
  const [parentId, setParentId] = useState(existing?.parentId ?? parentForNew ?? "");
  const [recurring, setRecurring] = useState(existing?.recurring ?? false);
  const [useManual, setUseManual] = useState(existing?.useManual ?? false);
  const [manualProgress, setManualProgress] = useState(existing?.manualProgress ?? 0);
  const [notes, setNotes] = useState(existing?.notes ?? "");

  const [suggesting, setSuggesting] = useState(false);
  const [suggestItems, setSuggestItems] = useState<string[] | null>(null);
  const [addedIdx, setAddedIdx] = useState<Set<number>>(new Set());
  const [suggestError, setSuggestError] = useState<string | null>(null);

  const isNew = !goalId;
  const parentHorizon = NEXTUP[selHorizon];
  const parentOptions = parentHorizon ? db.goals.filter((g) => g.horizon === parentHorizon) : [];

  function handleHorizonChange(h: Horizon) {
    setSelHorizon(h);
    setParentId(""); // coach.html:546 — parentSelect(hz.value,'') resets the ladder-up choice
  }

  // Save (coach.html:553-558). `period` only changes from the original when the
  // horizon field itself changed; otherwise the original period is kept even if
  // the surrounding view has since scrolled to a different offset.
  function handleSave() {
    const finalTitle = title.trim() || "Untitled goal";
    const originalHorizon = existing?.horizon ?? initialHorizon;
    const originalPeriod = existing?.period ?? initialPeriod;
    const period =
      selHorizon === originalHorizon ? originalPeriod : periodRange(selHorizon, selHorizon === horizon ? offset : 0, today).key;

    mutate((draft) => {
      const g = draft.goals.find((x) => x.id === stableId);
      if (g) {
        g.title = finalTitle;
        g.horizon = selHorizon;
        g.period = period;
        g.parentId = parentId;
        g.recurring = recurring;
        g.useManual = useManual;
        g.manualProgress = manualProgress;
        g.notes = notes;
      } else {
        draft.goals.push({
          id: stableId,
          horizon: selHorizon,
          period,
          title: finalTitle,
          parentId,
          recurring,
          useManual,
          manualProgress,
          notes,
        });
      }
    });
    onClose();
  }

  // Delete cascade (coach.html:551): remove the goal, clear `parentId` on its
  // children, clear `goalId` on its tasks, and strip it out of every week's plan.
  function handleDelete() {
    mutate((draft) => {
      draft.goals = draft.goals.filter((x) => x.id !== stableId);
      draft.goals.forEach((x) => {
        if (x.parentId === stableId) x.parentId = "";
      });
      draft.tasks.forEach((t) => {
        if (t.goalId === stableId) t.goalId = "";
      });
      Object.keys(draft.weekPlan).forEach((w) => {
        draft.weekPlan[w] = draft.weekPlan[w].filter((id2) => id2 !== stableId);
      });
    });
    onClose();
  }

  // Suggest tasks (coach.html:603-609): ask the coach for 3-6 short task strings
  // for this goal. Task 19 will extract this into a shared hook reused by the
  // Coach panel — for now it's implemented inline here.
  async function handleSuggestTasks() {
    setSuggesting(true);
    setSuggestError(null);
    setSuggestItems(null);
    setAddedIdx(new Set());
    const goalTitle = title.trim() || existing?.title || "Untitled goal";
    const prompt = `Suggest 3-6 concrete, doable tasks that would move this ${selHorizon} goal forward: "${goalTitle}". Notes: ${notes || "none"}. Return ONLY a JSON array of short task strings.`;
    const text = await askAi("suggest_tasks", prompt, { goal: goalTitle, horizon: selHorizon, notes });
    setSuggesting(false);
    if (text === null) {
      setSuggestError("The coach is unavailable right now.");
      return;
    }
    setSuggestItems(parseList(text));
  }

  // Tap-to-add a suggested task (coach.html:611-612): lazily inserts the goal
  // (if it hasn't been saved yet) using the CURRENT form values, then pushes a
  // task for THIS week and registers the goal into that week's plan.
  function addSuggestedTask(label: string, idx: number) {
    const goalTitle = title.trim() || existing?.title || "Untitled goal";
    const wk = periodRange("week", 0, today).key;
    mutate((draft) => {
      if (!draft.goals.some((g) => g.id === stableId)) {
        draft.goals.push({
          id: stableId,
          horizon: selHorizon,
          period: initialPeriod,
          title: goalTitle,
          parentId,
          recurring: false,
          useManual: false,
          manualProgress: 0,
          notes,
        });
      }
      draft.tasks.push({
        id: uid("t"),
        goalId: stableId,
        week: wk,
        label,
        pts: 1,
        note: "",
        tag: "",
        done: false,
        doneAt: null,
        subs: [],
        collapsed: false,
        timeMs: 0,
        timerStart: null,
        createdAt: new Date().toISOString(),
      });
      draft.weekPlan[wk] = draft.weekPlan[wk] || [];
      if (!draft.weekPlan[wk].includes(stableId)) draft.weekPlan[wk].push(stableId);
    });
    setAddedIdx((prev) => new Set(prev).add(idx));
  }

  return (
    <Modal title={isNew ? "New goal" : "Edit goal"} onClose={onClose}>
      <div className="mb-3">
        <label className={labelCls}>Goal</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What outcome do you want?"
          className={inputCls}
        />
      </div>

      <div className="mb-3 grid grid-cols-2 gap-2.5">
        <div>
          <label className={labelCls}>Horizon</label>
          <select
            value={selHorizon}
            onChange={(e) => handleHorizonChange(e.target.value as Horizon)}
            className={inputCls}
          >
            {HORIZONS.map(([h, label]) => (
              <option key={h} value={h}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Ladders up to</label>
          {parentHorizon ? (
            <select value={parentId} onChange={(e) => setParentId(e.target.value)} className={inputCls}>
              <option value="">— none —</option>
              {parentOptions.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title} ({periodLabelOf(g)})
                </option>
              ))}
            </select>
          ) : (
            <div className="pt-2 text-[11.5px] text-stone-400">Top horizon — nothing to ladder up to.</div>
          )}
        </div>
      </div>

      <div className="mb-3">
        <label className="flex items-center gap-2 text-[13px] text-stone-700">
          <input type="checkbox" checked={recurring} onChange={(e) => setRecurring(e.target.checked)} />
          Recurring — carries into each new period (you confirm at the turn)
        </label>
      </div>

      <div className="mb-3">
        <label className={labelCls}>Progress</label>
        <label className="flex items-center gap-2 text-[13px] text-stone-700">
          <input type="checkbox" checked={useManual} onChange={(e) => setUseManual(e.target.checked)} />
          Set progress manually
        </label>
        {useManual ? (
          <div className="mt-2 flex items-center gap-2.5">
            <input
              type="range"
              min={0}
              max={100}
              value={manualProgress}
              onChange={(e) => setManualProgress(+e.target.value)}
              className="flex-1"
            />
            <span className="w-9 text-right text-[12.5px] text-stone-500" style={mono}>
              {manualProgress}%
            </span>
          </div>
        ) : (
          <div className="mt-2 text-[11.5px] text-stone-400">Auto: rolls up from tasks &amp; sub-goals.</div>
        )}
      </div>

      <div className="mb-3">
        <label className={labelCls}>Notes</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className={inputCls} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={handleSave} className={btnPrimary} style={mono}>
          Save
        </button>
        <button type="button" onClick={handleSuggestTasks} disabled={suggesting} className={btnCrimsonOutline} style={mono}>
          {suggesting ? "…" : "✦ Suggest tasks"}
        </button>
        {!isNew && (
          <button type="button" onClick={handleDelete} className={btnGhost} style={mono}>
            Delete
          </button>
        )}
        <button type="button" onClick={onClose} className={btnGhost} style={mono}>
          Cancel
        </button>
      </div>

      {suggesting && <div className="mt-3 text-[12.5px] text-stone-500">Thinking of tasks…</div>}
      {suggestError && <div className="mt-3 text-[12.5px] text-[#A51C30]">{suggestError}</div>}
      {suggestItems && suggestItems.length === 0 && (
        <div className="mt-3 text-[12.5px] text-stone-400">No suggestions — try rephrasing the goal.</div>
      )}
      {suggestItems && suggestItems.length > 0 && (
        <div className="mt-3 rounded-[11px] border border-stone-200 bg-stone-50 p-3">
          <div className="mb-2 text-[12.5px] text-stone-500">Tap to add as tasks in this week:</div>
          {suggestItems.map((label, i) => (
            <div key={i} className="flex items-center gap-2 border-b border-stone-200 py-1.5 text-[13px] last:border-b-0">
              <span className="flex-1">{label}</span>
              <button
                type="button"
                disabled={addedIdx.has(i)}
                onClick={() => addSuggestedTask(label, i)}
                className={btnGhostSmall}
                style={mono}
              >
                {addedIdx.has(i) ? "Added ✓" : "+ Add"}
              </button>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
