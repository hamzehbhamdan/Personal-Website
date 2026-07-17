// components/dashboard/coach/NextUpCard.tsx
//
// Ports coach.html:381–390 (`nextUpHtml`). The picking logic itself already
// lives in `nextUp(db, wk)` (lib/dashboard/coach/week.ts) — this component only
// renders its result: `.wnext` (olive-tinted card, crimson dot in this port),
// mono eyebrow (`next up · <goal>` / `week cleared` / `nothing yet`), the task
// label, and the hint/note line. The cleared branch (`.wnext.clear`) uses a
// calmer/neutral card instead of the crimson accent.
"use client";
import { nextUp } from "@/lib/dashboard/coach/week";
import { getGoal } from "@/lib/dashboard/coach/rollup";
import type { CoachDB } from "@/lib/dashboard/coach/types";
import { Card, MonoLabel } from "@/components/dashboard/ui";

export function NextUpCard({ db, wk }: { db: CoachDB; wk: string }) {
  const { picked, hint, hadTasks } = nextUp(db, wk);

  if (!picked) {
    return (
      <Card className="mb-4 mt-3 flex items-center gap-3 bg-stone-50 px-4 py-3">
        <div className="h-[9px] w-[9px] flex-none rounded-full bg-stone-300" />
        <div>
          <MonoLabel>{hadTasks ? "week cleared" : "nothing yet"}</MonoLabel>
          <div className="mt-0.5 text-[14.5px] font-semibold text-stone-500">
            {hadTasks ? "Everything this week is done." : "Add tasks to get going."}
          </div>
        </div>
      </Card>
    );
  }

  const g = picked.goalId ? getGoal(db, picked.goalId) : undefined;

  return (
    <Card className="mb-4 mt-3 flex items-center gap-3 px-4 py-3">
      <div className="h-[9px] w-[9px] flex-none rounded-full bg-[#A51C30] shadow-[0_0_0_5px_rgba(165,28,48,0.12)]" />
      <div className="min-w-0">
        <MonoLabel className="text-[#A51C30]">
          next up{g ? ` · ${g.title}` : ""}
        </MonoLabel>
        <div className="mt-0.5 text-[14.5px] font-semibold text-stone-900">{picked.label}</div>
        {(hint || picked.note) && (
          <div className="mt-0.5 text-[12px] text-stone-400">
            {hint ? `Start with ${hint}. ` : ""}
            {picked.note || ""}
          </div>
        )}
      </div>
    </Card>
  );
}
