// components/dashboard/coach/FocusBar.tsx
//
// Ports coach.html:391–392 (`focusBarHtml`) + the pause handler wired at
// coach.html:426. Renders nothing unless some task in `db` has `timerStart`
// set. Source: `<div class="focusbar"><span>⏱ Focusing on <strong>${label}</strong>
// ${' · '+goalTitle}</span><span class="ft">${fmtDur(taskTime(t))}</span>
// <button data-pause>⏸</button></div>` — a crimson-filled bar (source used
// olive) with a live mono timer and a pause control.
"use client";
import type { CoachDB } from "@/lib/dashboard/coach/types";
import type { Mutate } from "./overlay";
import { getGoal, taskTime } from "@/lib/dashboard/coach/rollup";
import { fmtDur, pauseTimer } from "@/lib/dashboard/coach/timers";

const mono = { fontFamily: "var(--font-geist-mono), monospace" };

export function FocusBar({ db, mutate, tickNow }: { db: CoachDB; mutate: Mutate; tickNow: number }) {
  const t = db.tasks.find((x) => x.timerStart != null);
  if (!t) return null;

  const taskId = t.id;
  const g = t.goalId ? getGoal(db, t.goalId) : undefined;

  function handlePause() {
    mutate((draft) => {
      const dt = draft.tasks.find((x) => x.id === taskId);
      if (dt) pauseTimer(dt);
    });
  }

  return (
    <div className="mb-3.5 flex items-center gap-2.5 rounded-[10px] bg-[#A51C30] px-3 py-2 text-[12.5px] text-white">
      <span>
        ⏱ Focusing on <strong className="font-semibold">{t.label}</strong>
        {g ? ` · ${g.title}` : ""}
      </span>
      <span className="ml-auto font-mono text-[15px] font-semibold" style={mono}>
        {fmtDur(taskTime(t, tickNow))}
      </span>
      <button
        type="button"
        onClick={handlePause}
        title="Pause"
        aria-label="Pause timer"
        className="flex h-[26px] w-[26px] flex-none items-center justify-center rounded-[7px] border-none bg-white/20 text-[13px] text-white"
      >
        ⏸
      </button>
    </div>
  );
}
