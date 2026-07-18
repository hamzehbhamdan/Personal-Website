"use client";
import { useMemo } from "react";
import { Stat, SectionHeader } from "@/components/dashboard/ui";
import type { CoachDB } from "@/lib/dashboard/coach/types";
import { weekMetrics, streak, statusLabel } from "@/lib/dashboard/coach/metrics";
import { progressOf } from "@/lib/dashboard/coach/rollup";

const mono = { fontFamily: "var(--font-geist-mono), monospace" };

function fmtDuration(ms: number): string {
  const m = Math.round(ms / 60000);
  if (m <= 0) return "0m";
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

export function MetricsPanel({ db, weekKey, today }: { db: CoachDB; weekKey: string; today: Date }) {
  const m = useMemo(() => weekMetrics(db, weekKey), [db, weekKey]);
  const s = useMemo(() => streak(db, today), [db, today]);
  const status = statusLabel(m.completionPct);

  const goals = useMemo(
    () => (db.weekPlan[weekKey] ?? []).map((id) => db.goals.find((g) => g.id === id)).filter((g): g is NonNullable<typeof g> => !!g),
    [db, weekKey],
  );

  return (
    <div>
      <SectionHeader index="01" label="This week" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Stat label="Completion" value={`${m.completionPct}%`} ring={m.completionPct} hint={status} tone={m.total > 0 && m.completionPct < 40 ? "attention" : "default"} />
        <Stat label="Tasks cleared" value={`${m.done}/${m.total}`} />
        <Stat label="Points" value={`${m.pointsEarned}/${m.pointsPlanned}`} />
        <Stat label="Focus time" value={fmtDuration(m.focusMs)} />
        <Stat label="Streak" value={`${s} wk${s === 1 ? "" : "s"}`} />
        <Stat label="In progress" value={m.doing} hint={`${m.todo} still to do`} />
      </div>

      {goals.length > 0 && (
        <div className="mt-8">
          <SectionHeader index="02" label="Goal progress" />
          <div className="space-y-2">
            {goals.map((g) => {
              const p = progressOf(db, g);
              return (
                <div key={g.id} className="flex items-center gap-3 rounded-[10px] border border-stone-200 bg-white px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] text-stone-800">{g.title}</p>
                    <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-stone-100">
                      <div className="h-full rounded-full bg-[#A51C30] transition-[width]" style={{ width: `${p}%` }} />
                    </div>
                  </div>
                  <span className="font-mono text-[11px] tabular-nums text-stone-500" style={mono}>{p}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
