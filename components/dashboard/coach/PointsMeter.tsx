// components/dashboard/coach/PointsMeter.tsx
//
// Ports coach.html:367 (`.wmeter` markup, inlined in `renderWeek`) — the week's
// points-progress bar shown above NextUpCard/FocusBar/goal sections. Source:
// `<div class="wmeter"><div class="wmeter-bar"><div class="wmeter-fill"
// style="width:${pct}%"></div></div><div class="wmeter-cap"><span>${pct}%
// cleared</span><span>${done} / ${total} pts${total?' · '+fmtHM(tasks.reduce(
// (s,t)=>s+taskTime(t),0))+' tracked':''}</span></div></div>`.
// The source fill is a tan->orange gradient; the ported palette collapses that
// to solid crimson per the task brief.
"use client";
import type { WeekModel } from "@/lib/dashboard/coach/week";
import { taskTime } from "@/lib/dashboard/coach/rollup";
import { fmtHM } from "@/lib/dashboard/coach/timers";

const mono = { fontFamily: "var(--font-geist-mono), monospace" };

export function PointsMeter({ m, tickNow }: { m: WeekModel; tickNow: number }) {
  const pct = m.total ? Math.round((m.done / m.total) * 100) : 0;
  const trackedMs = m.tasks.reduce((s, t) => s + taskTime(t, tickNow), 0);

  return (
    <div className="mb-2">
      <div className="h-[11px] overflow-hidden rounded-full border border-stone-200 bg-[#f0eeea]">
        <div
          className="h-full rounded-full bg-[#A51C30] transition-[width] duration-[400ms]"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-1 flex justify-between font-mono text-[11px] text-stone-400" style={mono}>
        <span>{pct}% cleared</span>
        <span>
          {m.done} / {m.total} pts{m.total ? ` · ${fmtHM(trackedMs)} tracked` : ""}
        </span>
      </div>
    </div>
  );
}
