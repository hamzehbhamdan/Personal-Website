// components/dashboard/coach/CoachView.tsx
//
// Container that owns all Coach state (Task 14). Ports coach.html:190–220 (header),
// 321–341 (banner), 453–459 (period bar). Board content and modals are wired in
// Task 23 once WeekBoard/HigherHorizon (Tasks 16–17) and the modal set (Tasks
// 18–22) exist — see the placeholders below.
"use client";
import { useMemo, useState, useCallback } from "react";
import { ViewHeader, Segmented } from "@/components/dashboard/ui";
import { useAppState } from "@/lib/dashboard/useAppState";
import { emptyCoachDB } from "@/lib/dashboard/coach/seed";
import { migrate } from "@/lib/dashboard/coach/migrate";
import { periodRange, HORIZONS } from "@/lib/dashboard/coach/periods";
import type { CoachDB, Horizon } from "@/lib/dashboard/coach/types";
import { PeriodBar } from "./PeriodBar";
import { IntakeBanner } from "./IntakeBanner";
import type { Overlay } from "./overlay";
// Board (WeekBoard / HigherHorizon — Tasks 16–17) and the modal set (Tasks 18–22)
// don't exist yet. Task 23 imports and mounts them here, replacing the inline
// placeholders below — do NOT import them in this task.

const mono = { fontFamily: "var(--font-geist-mono), monospace" };
const btnPrimary =
  "rounded-[8px] bg-[#A51C30] px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-white hover:bg-[#8a1728]";
const btnGhost =
  "rounded-[8px] border border-stone-200 px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-stone-500 hover:border-stone-300";
const iconBtn =
  "flex h-[34px] w-[34px] items-center justify-center rounded-[9px] border border-stone-200 text-[16px] text-stone-500 hover:border-stone-300";

const TODAY = new Date();

export function CoachView() {
  const { state, setState, loaded } = useAppState<CoachDB>("execCoach", emptyCoachDB());
  const [horizon, setHorizon] = useState<Horizon>("week");
  const [offset, setOffset] = useState(0);
  const [overlay, setOverlay] = useState<Overlay>({ kind: "none" });
  // Backing state for the search toggle (⌕); the SearchOverlay itself is mounted
  // in Task 23 — this button is a non-wired placeholder for now (see actions below).
  const [searchOpen, setSearchOpen] = useState(false);

  // Read snapshot: run migration on every state change into a normalized v3 doc
  // (idempotent). Never mutate this directly — see `mutate` below.
  const db = useMemo(() => migrate(structuredClone(state), TODAY), [state]);

  // Every write: produce a fresh migrated draft from `prev` (never from the `db`
  // snapshot above), mutate it in place, and persist the draft.
  const mutate = useCallback(
    (fn: (draft: CoachDB) => void) => {
      setState((prev) => {
        const draft = migrate(structuredClone(prev), TODAY);
        fn(draft);
        return draft;
      });
    },
    [setState],
  );
  // `mutate` is not yet called from this file — the board/modals that call it
  // (WeekBoard, HigherHorizon, GoalModal, etc.) are wired in Task 23+.

  const r = periodRange(horizon, offset, TODAY);

  if (!loaded) {
    return (
      <div className="p-8 font-mono text-[11px] uppercase tracking-[0.18em] text-stone-400">Loading…</div>
    );
  }

  return (
    <div className="p-7 md:p-8 max-w-3xl">
      <ViewHeader
        meta="Goals & Progress"
        title="Executive Coach"
        actions={
          <>
            <button
              type="button"
              onClick={() => {} /* TODO(Task 23): toggle SearchOverlay */}
              className={iconBtn}
              style={mono}
              aria-label="Search goals & tasks"
              title="Search goals & tasks"
            >
              ⌕
            </button>
            <button
              type="button"
              onClick={() => {} /* TODO(Task 23): open Insights modal */}
              className={btnGhost}
              style={mono}
            >
              Insights
            </button>
            <button
              type="button"
              onClick={() => {} /* TODO(Task 23): open Coach panel */}
              className={btnPrimary}
              style={mono}
            >
              ✦ Coach
            </button>
          </>
        }
      />

      {/* SearchOverlay (Task 23) renders here when searchOpen */}

      <Segmented<Horizon>
        options={HORIZONS.map(([v, label]) => ({ value: v, label }))}
        value={horizon}
        onChange={(h) => {
          setHorizon(h);
          setOffset(0);
        }}
      />

      <div className="mt-5">
        <IntakeBanner
          db={db}
          horizon={horizon}
          offset={offset}
          today={TODAY}
          onStart={(hs) => setOverlay({ kind: "intake", horizons: hs })}
        />

        <PeriodBar
          label={r.label}
          now={offset === 0 ? "current " + horizon : offset > 0 ? "upcoming" : "past"}
          db={db}
          horizon={horizon}
          offset={offset}
          today={TODAY}
          onPrev={() => setOffset((o) => o - 1)}
          onNext={() => setOffset((o) => o + 1)}
        />

        {/* Board area: WeekBoard for "week", HigherHorizon for month/quarter/year
            (Tasks 16–17). Mounted in Task 23 — placeholder until then. */}
        <div className="mt-6 rounded-[10px] border border-dashed border-stone-200 p-8 text-center font-mono text-[10px] uppercase tracking-[0.14em] text-stone-300">
          Board — wired in Task 23
        </div>
      </div>

      {/* Modal switch on overlay.kind -> GoalModal / TaskModal / SubtaskModal /
          PickGoalModal / CoachPanel / IntakeModal / RollForwardModal / InsightsModal
          (Tasks 18–22). Wired in Task 23 — placeholder until then. */}
    </div>
  );
}
