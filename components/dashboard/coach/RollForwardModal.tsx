// components/dashboard/coach/RollForwardModal.tsx
//
// Ports coach.html:736-769 (`openRollForward` / `rfGenerate` / `applyRollForward`).
// The "✦ Plan this week" button (WeekBoard, Task 16) already calls
// `setOverlay({kind:'rollforward'})`; this component only builds the modal itself —
// Task 23 mounts it in CoachView's overlay switch and wires `onApplied` to jump to
// the week view.
//
// Three groups, each row defaulting CHECKED (coach.html:743-745's `checked`
// attribute on every `.rfrow`): recurring goals to refresh, unfinished tasks from
// last week to carry over, and AI-suggested tasks pulled from the active higher
// goals. Selections are only ever collected into a `RollForwardSelections` and
// applied via `applyRollForward` on the explicit "Apply plan" click — this modal
// NEVER auto-applies. "Skip" instead just marks this week's plan done
// (coach.html:749) without touching any goal or task.
//
// Every write goes through `mutate`, which re-derives a migrated draft from `prev`
// (never from the `db` snapshot prop) per the STATE-MUTATION CONVENTION.
"use client";
import { useState } from "react";
import type { CoachDB } from "@/lib/dashboard/coach/types";
import type { Mutate } from "./overlay";
import { periodRange } from "@/lib/dashboard/coach/periods";
import { rollForwardPlan, applyRollForward, type RollForwardSelections } from "@/lib/dashboard/coach/rollforward";
import { getGoal, taskPts } from "@/lib/dashboard/coach/rollup";
import { askAi } from "@/lib/dashboard/coach/ai";
import { parseSuggestedTasks, type SuggestedTask } from "@/lib/dashboard/coach/parse";
import { Modal, Badge } from "@/components/dashboard/ui";

const mono = { fontFamily: "var(--font-geist-mono), monospace" };
const btnPrimary =
  "rounded-[8px] bg-[#A51C30] px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-white hover:bg-[#8a1728] disabled:opacity-50";
const btnGhost =
  "rounded-[8px] border border-stone-200 px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-stone-500 hover:border-stone-300 disabled:opacity-50";
const btnGhostSmall =
  "rounded-[8px] border border-stone-200 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-stone-500 hover:border-[#A51C30] hover:text-[#A51C30] disabled:opacity-50";
const groupTitleCls = "mb-2 text-[10px] font-bold uppercase tracking-[0.06em] text-stone-500";
const rowCls =
  "mb-1.5 flex items-center gap-2.5 rounded-[9px] border border-stone-200 bg-[#f9f8f6] px-2.5 py-2 text-[12.5px] text-stone-800";
const metaCls = "ml-auto shrink-0 text-[11px] text-stone-500";
const noteCls = "text-[12.5px] text-stone-400";

export function RollForwardModal({
  db,
  mutate,
  today,
  onClose,
  onApplied,
}: {
  db: CoachDB;
  mutate: Mutate;
  today: Date;
  onClose: () => void;
  /** Optional: jump the board to the (current) week view after applying. Task 23 wires this. */
  onApplied?: () => void;
}) {
  const plan = rollForwardPlan(db, today);

  // Every row defaults checked (coach.html:743-745) — snapshots of which ids/rows
  // start selected, taken once at open time via the lazy useState initializer
  // (mirrors GoalModal's `stableId` pattern). `plan` only changes if `db`/`today`
  // change, which doesn't happen while this modal is open (Apply/Skip both close it).
  const [recurChecked, setRecurChecked] = useState<Set<string>>(() => new Set(plan.recurringGoals.map((g) => g.id)));
  const [carryChecked, setCarryChecked] = useState<Set<string>>(() => new Set(plan.carry.map((t) => t.id)));

  const [aiItems, setAiItems] = useState<SuggestedTask[] | null>(null);
  const [aiChecked, setAiChecked] = useState<Set<number>>(new Set());
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  function toggleRecur(id: string) {
    setRecurChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }
  function toggleCarry(id: string) {
    setCarryChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }
  function toggleAi(i: number) {
    setAiChecked((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  }

  // coach.html:754 — only the active (current-period) month/quarter/year goals,
  // simplified per the brief's data payload to titles only.
  const activeHigher = db.goals.filter(
    (g) =>
      (g.horizon === "month" && g.period === periodRange("month", 0, today).key) ||
      (g.horizon === "quarter" && g.period === periodRange("quarter", 0, today).key) ||
      (g.horizon === "year" && g.period === periodRange("year", 0, today).key)
  );

  // coach.html:753-756 — ask for 3-6 concrete tasks against the active higher
  // goals; suggestion extraction never sends a `system` persona (mirrors every
  // other suggest_* call site).
  async function handleSuggest() {
    setAiLoading(true);
    setAiError(null);
    setAiItems(null);
    setAiChecked(new Set());
    const text = await askAi(
      "suggest_tasks",
      'Given Hamzeh\'s active higher goals, propose 3-6 concrete tasks he could do THIS WEEK to push them forward. Consider what matters and memory. Return ONLY a JSON array like [{"goal":"<exact goal title>","label":"<task>","pts":<1-5 effort>}].',
      { what_matters: db.matters || "", memory: db.memory || "", higher_goals: activeHigher.map((g) => g.title) }
    );
    setAiLoading(false);
    if (text === null) {
      setAiError("The coach is unavailable right now — you can still apply the rest of the plan.");
      return;
    }
    const items = parseSuggestedTasks(text);
    setAiItems(items);
    setAiChecked(new Set(items.map((_, i) => i))); // default checked (coach.html:760)
  }

  // Apply plan (coach.html:762-768): collect only the CHECKED rows into a
  // RollForwardSelections and hand off to applyRollForward. This is the ONLY path
  // that writes goals/tasks — nothing here runs until this button is clicked.
  function handleApply() {
    const sel: RollForwardSelections = {
      recurGoalIds: plan.recurringGoals.filter((g) => recurChecked.has(g.id)).map((g) => g.id),
      carryTaskIds: plan.carry.filter((t) => carryChecked.has(t.id)).map((t) => t.id),
      aiTasks: (aiItems || []).filter((_, i) => aiChecked.has(i)),
    };
    mutate((draft) => applyRollForward(draft, sel, today));
    onClose();
    onApplied?.();
  }

  // Skip (coach.html:749): mark this week's plan done without touching anything else.
  function handleSkip() {
    mutate((draft) => {
      draft.planDone[plan.wk] = true;
    });
    onClose();
  }

  return (
    <Modal title="✦ Plan this week" onClose={onClose} size="wide">
      <div className="mb-3.5 text-[12.5px] leading-[1.6] text-stone-500">
        Here&apos;s how I&apos;d set up this week. Uncheck anything you don&apos;t want, then apply.
      </div>

      <div className="mb-4">
        <div className={groupTitleCls}>Recurring goals — refresh</div>
        {plan.recurringGoals.length === 0 ? (
          <div className={noteCls}>No recurring goals yet. Mark a goal recurring to have it come back each period.</div>
        ) : (
          plan.recurringGoals.map((g) => (
            <label key={g.id} className={rowCls}>
              <input type="checkbox" checked={recurChecked.has(g.id)} onChange={() => toggleRecur(g.id)} />
              <span className="flex flex-1 items-center gap-1.5">
                {g.title}
                <Badge tone="neutral">{g.horizon}</Badge>
              </span>
              <span className={metaCls}>bring into this week</span>
            </label>
          ))
        )}
      </div>

      <div className="mb-4">
        <div className={groupTitleCls}>Unfinished last week — carry over</div>
        {plan.carry.length === 0 ? (
          <div className={noteCls}>Nothing left open from last week.</div>
        ) : (
          plan.carry.map((t) => {
            const goal = t.goalId ? getGoal(db, t.goalId) : undefined;
            return (
              <label key={t.id} className={rowCls}>
                <input type="checkbox" checked={carryChecked.has(t.id)} onChange={() => toggleCarry(t.id)} />
                <span className="flex-1">{t.label}</span>
                <span className={metaCls}>
                  {goal ? `→ ${goal.title}` : "Unfiled"} · {taskPts(t)}pt
                </span>
              </label>
            );
          })
        )}
      </div>

      <div className="mb-4">
        <div className={groupTitleCls}>From your higher goals — this week&apos;s tasks</div>
        {aiItems === null && !aiLoading && (
          <button type="button" onClick={handleSuggest} className={btnGhostSmall} style={mono}>
            ✦ Suggest tasks from my month &amp; quarter goals
          </button>
        )}
        {aiLoading && <div className={noteCls}>Looking at your month &amp; quarter goals…</div>}
        {aiError && <div className="text-[12.5px] text-[#A51C30]">{aiError}</div>}
        {aiItems !== null && aiItems.length === 0 && <div className={noteCls}>No suggestions right now.</div>}
        {aiItems !== null &&
          aiItems.map((s, i) => (
            <label key={i} className={rowCls}>
              <input type="checkbox" checked={aiChecked.has(i)} onChange={() => toggleAi(i)} />
              <span className="flex-1">{s.label}</span>
              <span className={metaCls}>
                → {s.goal || "Unfiled"} · {+(s.pts ?? 1) || 1}pt
              </span>
            </label>
          ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={handleApply} className={btnPrimary} style={mono}>
          Apply plan
        </button>
        <button type="button" onClick={handleSkip} className={btnGhost} style={mono}>
          Skip
        </button>
      </div>
    </Modal>
  );
}
