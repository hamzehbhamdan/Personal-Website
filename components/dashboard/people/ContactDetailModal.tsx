"use client";

import { useState } from "react";
import { Avatar, Badge, MonoLabel, Modal } from "@/components/dashboard/ui";
import { getContact } from "@/lib/dashboard/people/select";
import { state } from "@/lib/dashboard/people/state";
import { groupsForContact } from "@/lib/dashboard/people/groups";
import { interactionsFor, tlIcon, formatRecent, contactEmails } from "@/lib/dashboard/people/interactions";
import { fmtDate, initials } from "@/lib/dashboard/people/text";
import { normalizeDb } from "@/lib/dashboard/people/backup";
import { CheckinDraft } from "./CheckinDraft";
import { LogInteractionForm } from "./LogInteractionForm";
import type { CrmDB, Contact } from "@/lib/dashboard/people/types";
import type { LiveState } from "./useLiveInteractions";

const mono = { fontFamily: "var(--font-geist-mono), monospace" };
const btnPrimary = "rounded-[8px] bg-[#A51C30] px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-white hover:bg-[#8a1728]";
const btnGhost = "rounded-[8px] border border-stone-200 px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-stone-500 hover:border-stone-300";

export function ContactDetailModal({ id, db, live, now, setState, onClose, onEdit, onOpenGroup }: {
  id: string;
  db: CrmDB;
  live: LiveState;
  now: Date;
  setState: (u: (prev: CrmDB) => CrmDB) => void;
  onClose: () => void;
  onEdit: (id: string) => void;
  onOpenGroup: (id: string) => void;
}) {
  const [showLog, setShowLog] = useState(false);
  const [showDraft, setShowDraft] = useState(false);

  const contact = getContact(db, id);
  if (!contact) return null;

  const s = state(contact, live.gmail, live.cal, db, now);
  const overdueOf = (c: Contact) => state(c, live.gmail, live.cal, db, now).overdue;
  const groups = groupsForContact(db, contact.id, overdueOf);
  const timeline = interactionsFor(contact, live.gmail, live.cal).slice(0, 12);
  const primaryEmail = contactEmails(contact)[0];
  const phoneHref = contact.phone ? contact.phone.replace(/[^0-9+]/g, "") : "";

  // Snooze derives ONLY from `db` inside the updater (never the `db` prop captured at render)
  // per the state-mutation convention, so a stale render never clobbers a concurrent write.
  const handleSnooze = () => {
    setState((prev) => {
      const nextDb = normalizeDb(prev);
      return {
        ...nextDb,
        contacts: nextDb.contacts.map((x) =>
          x.id === contact.id ? { ...x, snoozeUntil: new Date(now.getTime() + 30 * 864e5).toISOString() } : x
        ),
      };
    });
    onClose();
  };

  return (
    <Modal title={contact.name} onClose={onClose}>
      <div className="mb-4 flex items-start gap-3">
        <Avatar initials={initials(contact.name)} src={contact.avatarImg ?? undefined} size={44} />
        <div className="min-w-0">
          <div className="text-[14px] font-medium text-stone-900">{contact.tier} · every {s.cad} days</div>
          <div className="mt-0.5 text-[12px] text-stone-500">
            last contact {fmtDate(s.last)}
            {s.last ? ` (${s.days}d ago)` : ""}
            {s.calNext ? ` · next meeting ${fmtDate(s.calNext)}` : ""}
          </div>
          {primaryEmail && (
            <div className="mt-0.5 text-[12px] text-stone-500">
              {"✉️"}{" "}
              <a href={`mailto:${primaryEmail}`} className="hover:text-[#A51C30]">{primaryEmail}</a>
            </div>
          )}
          {contact.phone && (
            <div className="mt-0.5 text-[12px] text-stone-500">
              {"📞"}{" "}
              <a href={`tel:${phoneHref}`} className="hover:text-[#A51C30]">{contact.phone}</a>
            </div>
          )}
        </div>
      </div>

      {contact.tags.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {contact.tags.map((t) => <MonoLabel key={t}>{t}</MonoLabel>)}
        </div>
      )}

      {groups.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-stone-400">Groups</span>
          {groups.map((g) => (
            <button key={g.id} type="button" onClick={() => onOpenGroup(g.id)} className="cursor-pointer">
              <Badge tone="neutral">{g.name}</Badge>
            </button>
          ))}
        </div>
      )}

      {contact.howWeMet && (
        <div className="mb-3 text-[13px] text-stone-600">How you met: {contact.howWeMet}</div>
      )}

      {contact.notes ? (
        <div className="mb-4 whitespace-pre-wrap text-[13px] leading-relaxed text-stone-700">{contact.notes}</div>
      ) : (
        <div className="mb-4 text-[13px] text-stone-400">No notes yet.</div>
      )}

      <div className="mb-1 flex flex-wrap gap-2">
        <button type="button" onClick={() => setShowDraft((v) => !v)} className={btnPrimary} style={mono}>
          Draft a check-in
        </button>
        <button type="button" onClick={() => setShowLog((v) => !v)} className={btnGhost} style={mono}>
          Log interaction
        </button>
        <button type="button" onClick={handleSnooze} className={btnGhost} style={mono}>
          Snooze 30d
        </button>
        <button type="button" onClick={() => onEdit(contact.id)} className={btnGhost} style={mono}>
          Edit
        </button>
      </div>

      {showLog && (
        <LogInteractionForm contact={contact} setState={setState} onDone={() => setShowLog(false)} />
      )}
      {showDraft && (
        <CheckinDraft
          contact={contact}
          recent={formatRecent(interactionsFor(contact, live.gmail, live.cal))}
          days={s.days}
        />
      )}

      <div className="mt-5">
        <MonoLabel className="mb-2 block">Recent interactions</MonoLabel>
        {timeline.length === 0 ? (
          <div className="text-[13px] text-stone-400">No synced emails or meetings with this person.</div>
        ) : (
          <div className="space-y-1.5">
            {timeline.map((m, i) => (
              <div key={i} className="flex items-baseline gap-2 text-[13px] text-stone-600">
                <span className="w-[64px] shrink-0 text-stone-400">{fmtDate(m.date)}</span>
                <span className="shrink-0">{tlIcon(m)}</span>
                <span className="min-w-0 flex-1 truncate">{m.text}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
