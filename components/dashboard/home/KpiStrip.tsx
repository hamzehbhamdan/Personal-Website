"use client";
import { Stat } from "@/components/dashboard/ui";
import type { ViewKey } from "@/components/dashboard/ui";
import type { PeopleSnapshot } from "./usePeopleSnapshot";
import type { CoachSnapshot } from "./useCoachSnapshot";

/** Click-through KPI tiles across People + Coach. */
export function KpiStrip({
  people,
  coach,
  onNavigate,
}: {
  people: PeopleSnapshot;
  coach: CoachSnapshot;
  onNavigate: (v: ViewKey) => void;
}) {
  const nudge = people.counts.overdue + people.counts.owe;
  const pct = coach.weekTotal ? Math.round((coach.weekDone / coach.weekTotal) * 100) : 0;
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      <Stat
        label="Need a nudge"
        value={nudge}
        tone={nudge > 0 ? "attention" : "default"}
        hint={`${people.counts.owe} owed · ${people.counts.overdue} overdue`}
        onClick={() => onNavigate("people")}
      />
      <Stat label="Birthdays soon" value={people.counts.bdays} hint="next 30 days" onClick={() => onNavigate("people")} />
      <Stat label="Goals" value={coach.goalsCount} hint="in Coach" onClick={() => onNavigate("coach")} />
      <Stat
        label="Points this week"
        value={`${coach.weekDone}/${coach.weekTotal || 0}`}
        ring={pct}
        onClick={() => onNavigate("coach")}
      />
    </div>
  );
}
