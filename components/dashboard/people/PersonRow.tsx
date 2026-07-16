import type { ReactNode } from "react";
import { Avatar, Badge, MonoLabel } from "@/components/dashboard/ui";
import { fmtDate, initials } from "@/lib/dashboard/people/text";
import type { Contact, ContactState } from "@/lib/dashboard/people/types";

export function PersonRow({ contact, s, tone = "neutral", onClick }: {
  contact: Contact;
  s: ContactState;
  tone?: "neutral" | "attention";
  onClick: () => void;
}) {
  let badge: ReactNode;
  if (s.oweReply) badge = <Badge tone="attention">Reply owed</Badge>;
  else if (s.overdue) badge = <Badge tone="attention">Overdue {s.days == null ? "" : `${s.days}d`}</Badge>;
  else if (s.soon) badge = <Badge tone="attention">Due soon</Badge>;
  else badge = <Badge tone="neutral">In touch</Badge>;

  const bdayBadge = s.bdayIn != null && s.bdayIn <= 14
    ? <Badge tone="attention">{"🎂"} {s.bdayIn === 0 ? "today" : `${s.bdayIn}d`}</Badge>
    : null;

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 py-3 border-b border-[#f0eeea] cursor-pointer"
    >
      <Avatar initials={initials(contact.name)} tone={tone} src={contact.avatarImg ?? undefined} />
      <div className="min-w-0 flex-1">
        <div className="text-[14px] font-medium text-stone-900 truncate">{contact.name}</div>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <MonoLabel>{contact.tier}</MonoLabel>
          {(contact.tags || []).slice(0, 3).map((t) => (
            <MonoLabel key={t}>{t}</MonoLabel>
          ))}
          <span className="text-[11.5px] text-stone-500">
            last contact {fmtDate(s.last)}{s.last ? ` · ${s.days}d ago` : ""}
          </span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        {badge}
        {bdayBadge}
      </div>
    </div>
  );
}
