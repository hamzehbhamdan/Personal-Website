// components/dashboard/coach/CoachView.tsx
//
// Container that owns all Coach state (Task 14). Ports coach.html:190–220 (header),
// 321–341 (banner), 453–459 (period bar). Board content, the search overlay, and
// the modal switch are wired here (Task 23) using WeekBoard/HigherHorizon (Tasks
// 16–17) and the modal set (Tasks 18–22).
"use client";
import { useMemo, useState, useCallback, useEffect } from "react";
import { ViewHeader, Segmented } from "@/components/dashboard/ui";
import { useAppState } from "@/lib/dashboard/useAppState";
import { emptyCoachDB } from "@/lib/dashboard/coach/seed";
import { migrate } from "@/lib/dashboard/coach/migrate";
import { periodRange, HORIZONS, findOffset } from "@/lib/dashboard/coach/periods";
import { getGoal } from "@/lib/dashboard/coach/rollup";
import type { CoachDB, Horizon } from "@/lib/dashboard/coach/types";
import type { ViewIntent } from "@/lib/dashboard/nav";
import { PeriodBar } from "./PeriodBar";
import { IntakeBanner } from "./IntakeBanner";
import type { Overlay, JumpTo } from "./overlay";
import { SearchOverlay } from "./SearchOverlay";
import { WeekBoard } from "./WeekBoard";
import { HigherHorizon } from "./HigherHorizon";
import { GoalModal } from "./GoalModal";
import { TaskModal } from "./TaskModal";
import { SubtaskModal } from "./SubtaskModal";
import { PickGoalModal } from "./PickGoalModal";
import { CoachPanel } from "./CoachPanel";
import { IntakeModal } from "./IntakeModal";
import { RollForwardModal } from "./RollForwardModal";
import { InsightsModal } from "./InsightsModal";

const mono = { fontFamily: "var(--font-geist-mono), monospace" };
const btnPrimary =
  "rounded-[8px] bg-[#A51C30] px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-white hover:bg-[#8a1728]";
const btnGhost =
  "rounded-[8px] border border-stone-200 px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-stone-500 hover:border-stone-300";
const iconBtn =
  "flex h-[34px] w-[34px] items-center justify-center rounded-[9px] border border-stone-200 text-[16px] text-stone-500 hover:border-stone-300";

const TODAY = new Date();

export function CoachView({
  initialSelect = null,
  onConsumed,
}: { initialSelect?: Extract<ViewIntent, { view: "coach" }> | null; onConsumed?: () => void } = {}) {
  const { state, setState, loaded } = useAppState<CoachDB>("execCoach", emptyCoachDB());
  const [horizon, setHorizon] = useState<Horizon>("week");
  const [offset, setOffset] = useState(0);
  const [overlay, setOverlay] = useState<Overlay>({ kind: "none" });
  // Backing state for the search toggle (⌕) — SearchOverlay mounts below the
  // header while true (coach.html:198,204-207's `searchWrap`/`show`).
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

  // Ports the artifact's global `jumpTo(id)` (coach.html:510,846) as a typed
  // (horizon, offset) pair — callers (GoalCard, SearchOverlay) resolve the
  // target goal/task's own offset via `findOffset` before calling this.
  const jumpTo: JumpTo = useCallback((h, o) => {
    setHorizon(h);
    setOffset(o);
  }, []);

  // ⌘K / search deep-link: jump to a goal's period + open its modal (tasks live on the week board).
  // Gate on `loaded` so a fresh mount re-runs once execCoach hydrates (getGoal would miss otherwise).
  useEffect(() => {
    if (!initialSelect || !loaded) return;
    if (initialSelect.kind === "goal") {
      const g = getGoal(db, initialSelect.id);
      if (g) {
        jumpTo(g.horizon, findOffset(g.horizon, g.period, TODAY));
        setOverlay({ kind: "goal", id: g.id });
      }
    } else if (initialSelect.kind === "task") {
      const t = db.tasks.find((x) => x.id === initialSelect.id);
      if (t) {
        jumpTo("week", findOffset("week", t.week, TODAY));
        setOverlay({ kind: "task", id: t.id });
      }
    }
    onConsumed?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSelect, loaded]);

  const r = periodRange(horizon, offset, TODAY);

  if (!loaded) {
    return (
      <div className="mx-auto w-full max-w-reading p-7 md:p-8 font-mono text-[11px] uppercase tracking-[0.18em] text-stone-400">Loading…</div>
    );
  }

  return (
    <div className="mx-auto w-full p-7 md:p-8 max-w-reading">
      <ViewHeader
        meta="Goals & Progress"
        title="Executive Coach"
        actions={
          <>
            <button
              type="button"
              onClick={() => setSearchOpen((o) => !o)}
              className={iconBtn}
              style={mono}
              aria-label="Search goals & tasks"
              title="Search goals & tasks"
            >
              ⌕
            </button>
            <button
              type="button"
              onClick={() => setOverlay({ kind: "insights" })}
              className={btnGhost}
              style={mono}
            >
              Insights
            </button>
            <button
              type="button"
              onClick={() => setOverlay({ kind: "coach" })}
              className={btnPrimary}
              style={mono}
            >
              ✦ Coach
            </button>
          </>
        }
      />

      {searchOpen && (
        <SearchOverlay db={db} today={TODAY} jumpTo={jumpTo} onClose={() => setSearchOpen(false)} />
      )}

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

        <div className="mt-6">
          {horizon === "week" ? (
            <WeekBoard db={db} offset={offset} today={TODAY} mutate={mutate} setOverlay={setOverlay} />
          ) : (
            <HigherHorizon
              db={db}
              horizon={horizon}
              offset={offset}
              today={TODAY}
              mutate={mutate}
              setOverlay={setOverlay}
              jumpTo={jumpTo}
            />
          )}
        </div>
      </div>

      {overlay.kind === "goal" && (
        <GoalModal
          key={overlay.id ? `goal:edit:${overlay.id}` : `goal:new:${overlay.parentForNew ?? "root"}`}
          db={db}
          mutate={mutate}
          today={TODAY}
          horizon={horizon}
          offset={offset}
          goalId={overlay.id}
          parentForNew={overlay.parentForNew}
          onClose={() => setOverlay({ kind: "none" })}
        />
      )}
      {overlay.kind === "task" && (
        <TaskModal
          key={`task:${overlay.id}`}
          db={db}
          mutate={mutate}
          today={TODAY}
          taskId={overlay.id}
          onClose={() => setOverlay({ kind: "none" })}
        />
      )}
      {overlay.kind === "sub" && (
        <SubtaskModal
          key={`sub:${overlay.taskId}:${overlay.subId}`}
          db={db}
          mutate={mutate}
          taskId={overlay.taskId}
          subId={overlay.subId}
          onClose={() => setOverlay({ kind: "none" })}
        />
      )}
      {overlay.kind === "pickGoal" && (
        <PickGoalModal
          db={db}
          mutate={mutate}
          today={TODAY}
          horizon={horizon}
          offset={offset}
          onClose={() => setOverlay({ kind: "none" })}
        />
      )}
      {overlay.kind === "coach" && (
        <CoachPanel
          db={db}
          mutate={mutate}
          today={TODAY}
          horizon={horizon}
          offset={offset}
          onClose={() => setOverlay({ kind: "none" })}
        />
      )}
      {overlay.kind === "intake" && (
        <IntakeModal
          db={db}
          mutate={mutate}
          today={TODAY}
          horizons={overlay.horizons}
          onClose={() => setOverlay({ kind: "none" })}
        />
      )}
      {overlay.kind === "rollforward" && (
        <RollForwardModal
          db={db}
          mutate={mutate}
          today={TODAY}
          onClose={() => setOverlay({ kind: "none" })}
          onApplied={() => {
            setHorizon("week");
            setOffset(0);
          }}
        />
      )}
      {overlay.kind === "insights" && (
        <InsightsModal db={db} today={TODAY} onClose={() => setOverlay({ kind: "none" })} />
      )}
    </div>
  );
}
