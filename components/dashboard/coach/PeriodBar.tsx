// components/dashboard/coach/PeriodBar.tsx
//
// Ports coach.html:212–215 (markup), 325–326 (label/sublabel), 355–356 (week
// pct/pace), 456–459 (higher-horizon pct/pace). The olive/amber/blue `.pace-*`
// tones map to: on/idle -> stone, behind -> crimson, done -> ink.
"use client";
import { periodRange, elapsedFrac } from "@/lib/dashboard/coach/periods";
import { weekModel } from "@/lib/dashboard/coach/week";
import { weekPace, higherPace, type PaceKind } from "@/lib/dashboard/coach/pace";
import { progressOf, avg } from "@/lib/dashboard/coach/rollup";
import type { CoachDB, Horizon } from "@/lib/dashboard/coach/types";

const serif = { fontFamily: "var(--font-playfair), Georgia, serif" };
const mono = { fontFamily: "var(--font-geist-mono), monospace" };

const navBtn =
  "flex h-[30px] w-[30px] items-center justify-center rounded-lg border border-stone-200 text-[15px] text-stone-400 hover:border-[#A51C30] hover:text-[#A51C30]";

const paceTone: Record<PaceKind, string> = {
  on: "text-stone-500",
  idle: "text-stone-400",
  behind: "text-[#A51C30]",
  done: "text-stone-900",
  none: "text-stone-400",
};

export function PeriodBar({
  label,
  now,
  db,
  horizon,
  offset,
  today,
  onPrev,
  onNext,
}: {
  label: string;
  now: string;
  db: CoachDB;
  horizon: Horizon;
  offset: number;
  today: Date;
  onPrev: () => void;
  onNext: () => void;
}) {
  const r = periodRange(horizon, offset, today);

  let pct: string;
  let pace: { kind: PaceKind; text: string };
  if (horizon === "week") {
    const m = weekModel(db, r.key);
    const p = weekPace(m);
    pct = p.pct;
    pace = { kind: p.kind, text: p.text };
  } else {
    const goals = db.goals.filter((g) => g.horizon === horizon && g.period === r.key);
    const overall = goals.length ? Math.round(avg(goals.map((g) => progressOf(db, g)))) : 0;
    const el = Math.round(elapsedFrac(r, today) * 100);
    pace = higherPace(overall, el, offset === 0, goals.length);
    pct = goals.length ? overall + "%" : "—";
  }

  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <button type="button" onClick={onPrev} className={navBtn} aria-label="Previous period">
          ‹
        </button>
        <div>
          <div className="text-[18px] font-semibold text-stone-900" style={serif}>{label}</div>
          <div className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-stone-400" style={mono}>{now}</div>
        </div>
        <button type="button" onClick={onNext} className={navBtn} aria-label="Next period">
          ›
        </button>
      </div>
      <div className="text-right">
        <div className="text-[22px] font-semibold text-stone-900" style={serif}>{pct}</div>
        {pace.text && <div className={`text-[11px] ${paceTone[pace.kind]}`}>{pace.text}</div>}
      </div>
    </div>
  );
}
