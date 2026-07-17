// components/dashboard/coach/IntakeBanner.tsx
//
// Ports coach.html:331–341. Shown only for higher horizons (never on "week") at
// offset===0, when there are unset horizons (year/quarter/month) for the current
// period and the user hasn't locally dismissed it this session. The artifact's
// warm-tan `.banner` gradient maps to the crimson tint token.
"use client";
import { useState } from "react";
import { unsetHorizons, isFirstRun } from "@/lib/dashboard/coach/intake";
import { periodRange } from "@/lib/dashboard/coach/periods";
import type { CoachDB, Horizon } from "@/lib/dashboard/coach/types";

const mono = { fontFamily: "var(--font-geist-mono), monospace" };

export function IntakeBanner({
  db,
  horizon,
  offset,
  today,
  onStart,
}: {
  db: CoachDB;
  horizon: Horizon;
  offset: number;
  today: Date;
  onStart: (horizons: Horizon[]) => void;
}) {
  const [dismissed, setDismissed] = useState(false);

  if (horizon === "week" || offset !== 0 || dismissed) return null;

  const unset = unsetHorizons(db, today);
  if (!unset.length) return null;

  const firstRun = isFirstRun(db);
  const labels = unset.map((h) => periodRange(h, 0, today).label).join(", ");

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2.5 rounded-xl bg-crimson-tint px-3.5 py-3 text-[13px] text-stone-700">
      <span>
        <span className="mr-1 text-[#A51C30]">✦</span>
        {firstRun
          ? "Welcome — let’s set up what matters to you and your goals for "
          : "Set your goals for "}
        <strong className="font-semibold text-stone-900">{labels}</strong> in a quick chat.
      </span>
      <span className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => onStart(unset)}
          className="rounded-[8px] border border-[#A51C30] px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-[#A51C30] hover:bg-[#A51C30] hover:text-white"
          style={mono}
        >
          {firstRun ? "Start" : "Start intake"}
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="font-mono text-[10px] uppercase tracking-[0.1em] text-stone-400 hover:text-stone-600"
          style={mono}
        >
          Not now
        </button>
      </span>
    </div>
  );
}
