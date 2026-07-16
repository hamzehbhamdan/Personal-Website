"use client";

import { Card, SectionHeader } from "@/components/dashboard/ui";
import { PersonRow } from "./PersonRow";
import { GroupRow } from "./GroupRow";
import { state } from "@/lib/dashboard/people/state";
import { groupState, membersOf } from "@/lib/dashboard/people/groups";
import { attentionList } from "@/lib/dashboard/people/select";
import type { CrmDB, Contact, Group } from "@/lib/dashboard/people/types";
import type { LiveState } from "./useLiveInteractions";

export function AttentionList({ db, live, now, onOpenContact, onOpenGroup }: {
  db: CrmDB;
  live: LiveState;
  now: Date;
  onOpenContact: (id: string) => void;
  onOpenGroup: (id: string) => void;
}) {
  const stateOf = (c: Contact) => state(c, live.gmail, live.cal, db, now);
  const overdueOf = (c: Contact) => stateOf(c).overdue;
  const groupOverdue = (g: Group) => groupState(g, now).overdue;
  const { contacts, groups } = attentionList(db, stateOf, groupOverdue);
  const count = contacts.length + groups.length;

  return (
    <Card className="p-5">
      <SectionHeader index="01" label="Needs attention" />
      <div className="-mt-2 mb-3 text-[12px] text-stone-500">
        {count ? `${count} to act on` : "all clear"}
      </div>
      {count === 0 ? (
        <div className="py-2 text-[13px] text-stone-500">Nobody is overdue. Nice work staying in touch. 🌿</div>
      ) : (
        <div className="[&>*:last-child]:border-b-0">
          {contacts.map(({ c, s }) => (
            <PersonRow key={c.id} contact={c} s={s} tone="attention" onClick={() => onOpenContact(c.id)} />
          ))}
          {groups.map((g) => (
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
