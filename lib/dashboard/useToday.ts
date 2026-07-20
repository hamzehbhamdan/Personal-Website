"use client";
// Live "today" for date-anchored views (review #22/#23). A module-level
// `new Date()` freezes the calendar day at first bundle load, so a tab left
// open across midnight (especially the Sunday→Monday week rollover) files new
// tasks and roll-forward plans into the previous period. This hook re-checks
// the calendar day on visibilitychange / window focus and on a timer armed
// for the next local midnight — but returns the SAME Date object until the
// day actually changes, so useMemo/useCallback deps that include it stay
// referentially stable within a day (one consistent frame per render).
import { useEffect, useState } from "react";

/** ms from `now` until just past the next local midnight (+1s safety margin
 *  so the new day has definitely started when the timer fires). DST-safe:
 *  the Date constructor rolls the local calendar, not fixed 24h. */
export function msUntilNextLocalMidnight(now: Date): number {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return next.getTime() - now.getTime() + 1000;
}

export function useToday(): Date {
  const [today, setToday] = useState(() => new Date());
  useEffect(() => {
    const check = () =>
      setToday((prev) => {
        const now = new Date();
        return now.toDateString() === prev.toDateString() ? prev : now;
      });
    let timer: ReturnType<typeof setTimeout>;
    const arm = () => {
      timer = setTimeout(() => { check(); arm(); }, msUntilNextLocalMidnight(new Date()));
    };
    arm(); // timers can fire late after laptop sleep — focus/visibility below cover wake
    document.addEventListener("visibilitychange", check);
    window.addEventListener("focus", check);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", check);
      window.removeEventListener("focus", check);
    };
  }, []);
  return today;
}
