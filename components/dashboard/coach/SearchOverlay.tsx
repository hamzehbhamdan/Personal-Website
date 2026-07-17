// components/dashboard/coach/SearchOverlay.tsx
//
// Ports coach.html:198-207 (`#searchWrap`/`#searchIn`/`#searchResults` markup),
// :839-848 (`toggleSearch`/`runSearch`), and the `searchIn` wiring at :856-857.
// CoachView (Task 23) owns the toggle itself (`searchOpen`/`setSearchOpen`,
// driven by the ⌕ header button) and only mounts this component while open —
// this component just owns the input + results list.
//
// Clicking a goal result jumps to that goal's own horizon/period
// (coach.html:846, `jumpTo(id)`). Clicking a task result always jumps to
// `week` at the task's `week` period (coach.html:847) since tasks only ever
// live on the week board. Both close the overlay afterward.
"use client";
import { useEffect, useRef, useState } from "react";
import type { CoachDB } from "@/lib/dashboard/coach/types";
import type { JumpTo } from "./overlay";
import { runSearch } from "@/lib/dashboard/coach/search";
import { findOffset } from "@/lib/dashboard/coach/periods";
import { getGoal, progressOf } from "@/lib/dashboard/coach/rollup";
import { Badge } from "@/components/dashboard/ui";

const mono = { fontFamily: "var(--font-geist-mono), monospace" };

export function SearchOverlay({
  db,
  today,
  jumpTo,
  onClose,
}: {
  db: CoachDB;
  today: Date;
  jumpTo: JumpTo;
  onClose: () => void;
}) {
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // coach.html:839 (`toggleSearch`) focuses the input the moment it opens.
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const { goals, tasks } = runSearch(db, q);
  const hasQuery = q.trim().length > 0;
  const noMatches = hasQuery && goals.length === 0 && tasks.length === 0;

  function jumpToGoal(id: string) {
    const g = getGoal(db, id);
    if (!g) return;
    jumpTo(g.horizon, findOffset(g.horizon, g.period, today));
    onClose();
  }

  function jumpToTask(week: string) {
    jumpTo("week", findOffset("week", week, today));
    onClose();
  }

  return (
    <div className="relative mb-4">
      <input
        ref={inputRef}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
        }}
        placeholder="Search goals and tasks…"
        autoComplete="off"
        className="w-full rounded-[11px] border border-stone-200 bg-white px-[14px] py-[11px] text-[14px] outline-none focus:border-[#A51C30]"
      />

      {hasQuery && (
        <div className="mt-2 overflow-hidden rounded-[11px] border border-stone-200 bg-white">
          {noMatches ? (
            <div className="px-3 py-2.5 text-[13px] text-stone-400">No matches.</div>
          ) : (
            <>
              {goals.map((g) => (
                <div
                  key={g.id}
                  onClick={() => jumpToGoal(g.id)}
                  className="flex cursor-pointer items-center gap-2.5 border-b border-stone-200 px-3 py-2.5 text-[13px] last:border-b-0 hover:bg-stone-50"
                >
                  <Badge>{g.horizon} goal</Badge>
                  <span className="flex-1 text-stone-800">{g.title}</span>
                  <span className="text-[11px] text-stone-400" style={mono}>
                    {progressOf(db, g)}%
                  </span>
                </div>
              ))}
              {tasks.map((t) => {
                const g = t.goalId ? getGoal(db, t.goalId) : undefined;
                return (
                  <div
                    key={t.id}
                    onClick={() => jumpToTask(t.week)}
                    className="flex cursor-pointer items-center gap-2.5 border-b border-stone-200 px-3 py-2.5 text-[13px] last:border-b-0 hover:bg-stone-50"
                  >
                    <Badge>task</Badge>
                    <span className="flex-1 text-stone-800">{t.label}</span>
                    <span className="text-[11px] text-stone-400" style={mono}>
                      {g ? g.title : "Unfiled"}
                    </span>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}
