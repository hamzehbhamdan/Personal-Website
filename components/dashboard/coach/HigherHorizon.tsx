// components/dashboard/coach/HigherHorizon.tsx
//
// Ports coach.html:453-465 (`renderHigher`, minus the #pPct/#pPace side-effects,
// which are PeriodBar's job — Task 14) and :466-467 (`emptyHigher`), plus the
// add-goal row (:461-463, `quickAddGoal` at :508-509). Mounted for "month" /
// "quarter" / "year" (WeekBoard covers "week") once CoachView wires it in
// (Task 23).
//
// CRITICAL: goal-card expansion is transient UI state — parity with the
// artifact's `g._exp` flag (coach.html:493), which toggles and re-renders
// WITHOUT `save()`. It is owned here as a local `Set<string>` and NEVER
// written through `mutate` or onto the Goal object itself.
"use client";
import { useState } from "react";
import type { CoachDB, Horizon } from "@/lib/dashboard/coach/types";
import type { Mutate, SetOverlay, JumpTo } from "./overlay";
import { periodRange } from "@/lib/dashboard/coach/periods";
import { unsetHorizons } from "@/lib/dashboard/coach/intake";
import { uid } from "@/lib/dashboard/coach/migrate";
import { useTimerTick } from "./useTimerTick";
import { GoalCard } from "./GoalCard";

const serif = { fontFamily: "var(--font-playfair), Georgia, serif" };
const mono = { fontFamily: "var(--font-geist-mono), monospace" };

const btnOutline =
  "rounded-[8px] border border-[#A51C30] px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-[#A51C30] hover:bg-[#A51C30] hover:text-white";
// `.btn.alt` in the artifact (coach.html:130-131) — solid crimson fill, white
// text. Used for the `Add` button in the add-goal row (:461), matching
// CoachView's `btnPrimary`.
const btnPrimary =
  "rounded-[8px] bg-[#A51C30] px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-white hover:bg-[#8a1728]";

export function HigherHorizon({
  db,
  horizon,
  offset,
  today,
  mutate,
  setOverlay,
  jumpTo,
}: {
  db: CoachDB;
  horizon: Horizon;
  offset: number;
  today: Date;
  mutate: Mutate;
  setOverlay: SetOverlay;
  jumpTo: JumpTo;
}) {
  // Transient, local-only — never persisted (see file header).
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const toggleExpand = (id: string) =>
    setExpanded((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const [draft, setDraft] = useState("");
  const tickNow = useTimerTick(db);

  const r = periodRange(horizon, offset, today);
  const goals = db.goals.filter((g) => g.horizon === horizon && g.period === r.key);
  const showIntake = offset === 0;

  const onEditGoal = (id: string) => setOverlay({ kind: "goal", id });

  function commitAddGoal() {
    const v = draft.trim();
    if (!v) return;
    mutate((d) => {
      d.goals.push({
        id: uid("g"),
        horizon,
        period: r.key,
        title: v,
        parentId: "",
        recurring: false,
        useManual: false,
        manualProgress: 0,
        notes: "",
      });
    });
    setDraft("");
  }

  return (
    <div>
      {goals.length === 0 ? (
        <div className="px-[2px] py-5 text-center text-[13.5px] text-stone-400">
          <span className="mb-1 block text-[16px] text-stone-900" style={serif}>
            No {horizon} goals for {r.label} yet.
          </span>
          What do you want to be true by the end of this {horizon}? Add one below
          {showIntake ? ", or set it up with the coach" : ""}.
          {showIntake && (
            <div className="mt-3 flex justify-center">
              <button
                type="button"
                onClick={() => setOverlay({ kind: "intake", horizons: unsetHorizons(db, today) })}
                className={btnOutline}
                style={mono}
              >
                ✦ Set it up with the coach
              </button>
            </div>
          )}
        </div>
      ) : (
        goals.map((g) => (
          <GoalCard
            key={g.id}
            goal={g}
            db={db}
            expanded={expanded.has(g.id)}
            onToggleExpand={() => toggleExpand(g.id)}
            mutate={mutate}
            tickNow={tickNow}
            setOverlay={setOverlay}
            jumpTo={jumpTo}
            onEditGoal={onEditGoal}
          />
        ))
      )}

      <div className="mt-2 flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitAddGoal();
          }}
          placeholder={`+ Add a ${horizon} goal for ${r.label}…`}
          className="flex-1 rounded-[11px] border border-stone-200 bg-white px-[14px] py-3 text-[14px] outline-none focus:border-[#A51C30]"
        />
        <button type="button" onClick={commitAddGoal} className={btnPrimary} style={mono}>
          Add
        </button>
      </div>
    </div>
  );
}
