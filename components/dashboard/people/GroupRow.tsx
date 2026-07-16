import type { ReactNode } from "react";
import { Avatar, Badge } from "@/components/dashboard/ui";
import { fmtDate, initials } from "@/lib/dashboard/people/text";
import type { Group, GroupStateResult } from "@/lib/dashboard/people/types";

export function GroupRow({ group, gs, count, onClick }: {
  group: Group;
  gs: GroupStateResult;
  count: number;
  onClick: () => void;
}) {
  let badge: ReactNode;
  if (gs.overdue) badge = <Badge tone="attention">Due update</Badge>;
  else if (group.cadenceDays) badge = <Badge tone="neutral">On track</Badge>;
  else badge = <Badge tone="attention">No cadence</Badge>;

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 py-3 border-b border-[#f0eeea] cursor-pointer"
    >
      <Avatar initials={initials(group.name)} tone="neutral" src={group.avatarImg ?? undefined} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-[14px] font-medium text-stone-900 truncate">
          {group.type === "smart" && <Badge tone="neutral">Smart</Badge>}
          <span className="truncate">{group.name}</span>
          <span className="text-[12px] font-normal text-stone-500">
            · {count} {count === 1 ? "person" : "people"}
          </span>
        </div>
        <div className="mt-1 text-[11.5px] text-stone-500">
          last update {fmtDate(group.lastTouch)}{group.cadenceDays ? ` · every ${group.cadenceDays}d` : ""}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">{badge}</div>
    </div>
  );
}
