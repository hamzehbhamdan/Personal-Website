// components/dashboard/coach/WeekBoard.tsx
//
// Ports coach.html:344–380 (`renderWeek`, minus the pct/pace side-effects on
// `#pPct`/`#pPace`, which are PeriodBar's job — Task 14). Computes the week
// model via `weekModel(db, wk)` (lib/dashboard/coach/week.ts) and branches:
//   - empty week (coach.html:358–365): a calm centered Card with a target
//     glyph, "This week is open", a note, and the three actions.
//   - populated (coach.html:366–372): PointsMeter -> NextUpCard -> FocusBar ->
//     one GoalSection per `m.gids` -> UnfiledSection (if `m.hasUnfiled`) ->
//     the same three actions.
// Not yet mounted in CoachView — that's Task 23. Every write goes through the
// passed `mutate`, which re-derives a migrated draft from `prev` (never from
// the `db` snapshot prop) per the STATE-MUTATION CONVENTION.
"use client";
import type { CoachDB } from "@/lib/dashboard/coach/types";
import type { Mutate, SetOverlay } from "./overlay";
import { periodRange } from "@/lib/dashboard/coach/periods";
import { weekModel } from "@/lib/dashboard/coach/week";
import { getGoal } from "@/lib/dashboard/coach/rollup";
import { uid } from "@/lib/dashboard/coach/migrate";
import { useTimerTick } from "./useTimerTick";
import { Card } from "@/components/dashboard/ui";
import { PointsMeter } from "./PointsMeter";
import { NextUpCard } from "./NextUpCard";
import { FocusBar } from "./FocusBar";
import { GoalSection } from "./GoalSection";
import { UnfiledSection } from "./UnfiledSection";
import { cn } from "@/lib/utils";

const serif = { fontFamily: "var(--font-playfair), Georgia, serif" };
const mono = { fontFamily: "var(--font-geist-mono), monospace" };

const btnOutline =
  "rounded-[8px] border border-[#A51C30] px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-[#A51C30] hover:bg-[#A51C30] hover:text-white";
const btnGhost =
  "rounded-[8px] border border-stone-200 px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-stone-500 hover:border-stone-300";

// The three actions shared by both the empty (coach.html:363) and populated
// (coach.html:372) states: `+ Work toward a goal`, `✦ Plan this week`,
// `+ Quick task`.
function WeekActions({
  setOverlay,
  onQuickTask,
  center,
}: {
  setOverlay: SetOverlay;
  onQuickTask: () => void;
  center?: boolean;
}) {
  return (
    <div className={cn("flex flex-wrap gap-2", center ? "mt-4 justify-center" : "mt-2")}>
      <button type="button" onClick={() => setOverlay({ kind: "pickGoal" })} className={btnOutline} style={mono}>
        + Work toward a goal
      </button>
      <button type="button" onClick={() => setOverlay({ kind: "rollforward" })} className={btnGhost} style={mono}>
        ✦ Plan this week
      </button>
      <button type="button" onClick={onQuickTask} className={btnGhost} style={mono}>
        + Quick task
      </button>
    </div>
  );
}

export function WeekBoard({
  db,
  offset,
  today,
  mutate,
  setOverlay,
}: {
  db: CoachDB;
  offset: number;
  today: Date;
  mutate: Mutate;
  setOverlay: SetOverlay;
}) {
  const wk = periodRange("week", offset, today).key;
  const m = weekModel(db, wk);
  const tickNow = useTimerTick(db);

  const onEditTask = (id: string) => setOverlay({ kind: "task", id });
  const onEditGoal = (id: string) => setOverlay({ kind: "goal", id });
  const onEditSub = (taskId: string, subId: string) => setOverlay({ kind: "sub", taskId, subId });

  // Ports coach.html:430 (`addTask`) as invoked by `quickTask` (coach.html:450:
  // `addTask('New task','',wk)`).
  function addQuickTask() {
    mutate((draft) => {
      draft.tasks.push({
        id: uid("t"),
        goalId: "",
        week: wk,
        label: "New task",
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
    });
  }

  if (m.isEmpty) {
    return (
      <Card className="px-4 py-7 text-center">
        <div className="mx-auto mb-2.5 flex h-10 w-10 items-center justify-center rounded-full bg-crimson-tint text-[#A51C30]">
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx={12} cy={12} r={8} />
            <circle cx={12} cy={12} r={3} />
          </svg>
        </div>
        <div className="text-[17px] font-semibold text-stone-900" style={serif}>
          This week is open
        </div>
        <div className="mx-auto mt-1 max-w-[350px] text-[11.5px] text-stone-400">
          Pull in a goal to work toward, or let the coach plan it from last week and your month goals.
          Every task maps to a goal and rolls up.
        </div>
        <WeekActions setOverlay={setOverlay} onQuickTask={addQuickTask} center />
      </Card>
    );
  }

  return (
    <div>
      <PointsMeter m={m} tickNow={tickNow} />
      <NextUpCard db={db} wk={wk} />
      <FocusBar db={db} mutate={mutate} tickNow={tickNow} />

      {m.gids.map((gid) => {
        const g = getGoal(db, gid);
        if (!g) return null;
        return (
          <GoalSection
            key={gid}
            db={db}
            g={g}
            wk={wk}
            tickNow={tickNow}
            mutate={mutate}
            onEditGoal={onEditGoal}
            onEditTask={onEditTask}
            onEditSub={onEditSub}
          />
        );
      })}

      {m.hasUnfiled && (
        <UnfiledSection
          db={db}
          wk={wk}
          tickNow={tickNow}
          mutate={mutate}
          onEditTask={onEditTask}
          onEditSub={onEditSub}
        />
      )}

      <WeekActions setOverlay={setOverlay} onQuickTask={addQuickTask} />
    </div>
  );
}
