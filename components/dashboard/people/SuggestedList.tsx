"use client";

import { Avatar } from "@/components/dashboard/ui";
import { fmtDate, initials, nameFromEmail } from "@/lib/dashboard/people/text";
import { buildSuggestions } from "@/lib/dashboard/people/suggestions";
import type { CrmDB } from "@/lib/dashboard/people/types";
import type { LiveState } from "./useLiveInteractions";

const mono = { fontFamily: "var(--font-geist-mono), monospace" };

export function SuggestedList({ db, live, onAdd, onDismiss }: {
  db: CrmDB;
  live: LiveState;
  onAdd: (email: string) => void;
  onDismiss: (email: string) => void;
}) {
  const suggestions = buildSuggestions(db, live.gmail, live.cal);

  return (
    <div>
      <div className="mb-3 text-[11.5px] leading-relaxed text-stone-500">
        People you email or meet with who aren&apos;t in your CRM yet. Newsletters and no-reply senders are filtered out.
      </div>
      {suggestions.length === 0 ? (
        <div className="py-2 text-[13px] text-stone-500">
          {live.synced ? "No new people found." : "Sync to discover people…"}
        </div>
      ) : (
        <div className="[&>*:last-child]:border-b-0">
          {suggestions.map((s) => (
            <div key={s.email} className="flex items-center gap-3 border-b border-[#f0eeea] py-3">
              <Avatar initials={initials(nameFromEmail(s.email))} tone="neutral" size={32} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14px] font-medium text-stone-900">{nameFromEmail(s.email)}</div>
                <div className="mt-1 truncate text-[11.5px] text-stone-500">
                  {s.email} · last {fmtDate(s.last)}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  onClick={() => onAdd(s.email)}
                  className="rounded-[8px] bg-[#A51C30] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-white hover:bg-[#8a1728]"
                  style={mono}
                >
                  Add
                </button>
                <button
                  onClick={() => onDismiss(s.email)}
                  className="rounded-[8px] border border-stone-200 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-stone-500 hover:border-stone-300"
                  style={mono}
                >
                  Hide
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
