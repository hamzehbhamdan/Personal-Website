"use client";
import { useEffect, useMemo, useState } from "react";
import { migrate } from "@/lib/dashboard/coach/migrate";
import { emptyCoachDB } from "@/lib/dashboard/coach/seed";
import { periodRange } from "@/lib/dashboard/coach/periods";
import { weekModel } from "@/lib/dashboard/coach/week";
import type { CoachDB } from "@/lib/dashboard/coach/types";

/** Read-only Executive Coach snapshot for Home — goals + this-week points. Defensive against un-migrated docs. */
export function useCoachSnapshot(now: Date) {
  const [raw, setRaw] = useState<unknown>(null);
  useEffect(() => {
    let alive = true;
    fetch("/api/state?app=execCoach")
      .then((r) => r.json())
      .then((j) => {
        if (alive) setRaw(j.data ?? {});
      })
      .catch(() => {
        if (alive) setRaw({});
      });
    return () => {
      alive = false;
    };
  }, []);
  return useMemo(() => {
    let db: CoachDB;
    try {
      db = migrate(structuredClone(raw ?? {}) as Partial<CoachDB>, now);
    } catch {
      db = emptyCoachDB();
    }
    const wk = periodRange("week", 0, now).key;
    const wm = weekModel(db, wk);
    return { goals: db.goals, goalsCount: db.goals.length, weekDone: wm.done, weekTotal: wm.total, loaded: raw !== null };
  }, [raw, now]);
}

export type CoachSnapshot = ReturnType<typeof useCoachSnapshot>;
