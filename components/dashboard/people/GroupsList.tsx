"use client";

import { Card } from "@/components/dashboard/ui";
import { GroupRow } from "./GroupRow";
import { state } from "@/lib/dashboard/people/state";
import { groupState, membersOf } from "@/lib/dashboard/people/groups";
import type { CrmDB, Contact } from "@/lib/dashboard/people/types";
import type { LiveState } from "./useLiveInteractions";

export function GroupsList({ db, now, live, onOpenGroup, onNewGroup }: {
  db: CrmDB;
  now: Date;
  live: LiveState;
  onOpenGroup: (id: string) => void;
  onNewGroup: () => void;
}) {
  const overdueOf = (c: Contact) => state(c, live.gmail, live.cal, db, now).overdue;

  return (
    <Card className="p-5">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <button
          onClick={onNewGroup}
          className="shrink-0 rounded-[8px] bg-[#A51C30] px-3.5 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-white hover:bg-[#8a1728]"
          style={{ fontFamily: "var(--font-geist-mono), monospace" }}
        >
          + New group
        </button>
        <span className="text-[11.5px] leading-relaxed text-stone-500">
          Manual lists or smart groups that fill automatically by rule.
        </span>
      </div>
      {db.groups.length === 0 ? (
        <div className="py-2 text-[13px] text-stone-500">No groups yet. Create a manual list or a smart group.</div>
      ) : (
        <div className="[&>*:last-child]:border-b-0">
          {db.groups.map((g) => (
            <GroupRow
              key={g.id}
              group={g}
              gs={groupState(g, now)}
              count={membersOf(db, g, overdueOf).length}
              onClick={() => onOpenGroup(g.id)}
            />
          ))}
        </div>
      )}
    </Card>
  );
}
