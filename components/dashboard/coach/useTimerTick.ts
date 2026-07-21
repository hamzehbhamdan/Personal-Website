// components/dashboard/coach/useTimerTick.ts
//
// Ports coach.html:435 (`ensureTick`). While rendering with `requestAnimationFrame`-
// style DOM patching, the artifact only needs to re-touch the DOM nodes showing a
// running timer; in React we instead re-publish the current wall-clock time once per
// second (via a `now` state bump) so any live `taskTime(...)` reads in the tree pick
// up fresh wall-clock time. The interval is armed only while some task has `timerStart
// != null` and is torn down the moment nothing is running, so idle boards don't tick.
// `now` is read from `Date.now()` in the (impure) interval callback and the lazy state
// seed rather than during render, keeping the hook's render path pure.
"use client";
import { useEffect, useState } from "react";
import type { CoachDB } from "@/lib/dashboard/coach/types";

export function useTimerTick(db: CoachDB): number {
  const [now, setNow] = useState(() => Date.now());
  const running = db.tasks.some((t) => t.timerStart != null);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [running]);

  return now;
}
