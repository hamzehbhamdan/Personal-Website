"use client";
import { Card, MonoLabel } from "@/components/dashboard/ui";
import type { ViewKey } from "@/components/dashboard/ui";
import type { PeopleSnapshot } from "./usePeopleSnapshot";
import { mono } from "./styles";

type AttentionContact = PeopleSnapshot["attention"]["contacts"][number];

function reasonFor(s: AttentionContact["s"]): string {
  if (s.oweReply) return "owes a reply";
  if (s.bdayIn === 0) return "birthday today";
  if (s.bdayIn != null && s.bdayIn <= 14) return `birthday in ${s.bdayIn}d`;
  if (s.days != null) return `${s.days}d quiet`;
  return "reach out";
}

/** Top few people to reach out to today (from CRM attention). */
export function ReachOutToday({
  attention,
  connected,
  onNavigate,
}: {
  attention: PeopleSnapshot["attention"];
  connected: boolean;
  onNavigate: (v: ViewKey) => void;
}) {
  const items = attention.contacts.slice(0, 5);
  return (
    <Card className="h-full p-5">
      <MonoLabel>Reach out today</MonoLabel>
      <div className="mt-3 space-y-2">
        {items.length === 0 ? (
          <p className="text-[13px] text-stone-400">{connected ? "You're all caught up." : "Nobody flagged yet."}</p>
        ) : (
          items.map(({ c, s }) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onNavigate("people")}
              className="flex w-full items-center justify-between gap-2 text-left"
            >
              <span className="truncate text-[13.5px] text-stone-700">{c.name}</span>
              <span className="shrink-0 font-mono text-[9px] uppercase tracking-[0.08em] text-stone-400" style={mono}>
                {reasonFor(s)}
              </span>
            </button>
          ))
        )}
      </div>
    </Card>
  );
}
