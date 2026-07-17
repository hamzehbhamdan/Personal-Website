"use client";
import { useState } from "react";
import { matchContacts } from "@/lib/dashboard/people/select";
import { cn } from "@/lib/utils";
import type { CrmDB } from "@/lib/dashboard/people/types";

const inputCls = "w-full rounded-[8px] border border-stone-200 px-2.5 py-1.5 text-[13px] text-stone-800 outline-none focus:border-[#A51C30]";

/**
 * Recipient input with autocomplete over CRM contacts PLUS `extra` candidates (e.g. recipients pulled
 * from already-fetched sent mail). Tab/Enter completes to the highlighted suggestion; ArrowUp/Down
 * move the highlight. Escape is intentionally NOT handled here so it closes the modal.
 */
export function RecipientAutocomplete({ db, value, onChange, placeholder, extra = [] }: {
  db: CrmDB; value: string; onChange: (v: string) => void; placeholder?: string; extra?: { name: string; email: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const suggestions = (() => {
    if (!open) return [];
    const q = value.trim().toLowerCase();
    const base = matchContacts(db, value, 8);
    const seen = new Set(base.map((s) => s.email));
    // Fold in recipients seen in fetched mail that aren't already CRM matches (only while typing).
    const fromMail = q
      ? extra.filter((e) => !seen.has(e.email) && (e.email.toLowerCase().includes(q) || e.name.toLowerCase().includes(q)))
      : [];
    return [...base, ...fromMail].slice(0, 8);
  })();
  const pick = (email: string) => { onChange(email); setOpen(false); setHi(0); };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!suggestions.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setHi((h) => Math.min(h + 1, suggestions.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHi((h) => Math.max(h - 1, 0)); }
    else if (e.key === "Tab" || e.key === "Enter") {
      const s = suggestions[hi] || suggestions[0];
      if (s) { e.preventDefault(); pick(s.email); }
    }
  };

  return (
    <div className="relative">
      <input
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); setHi(0); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className={inputCls}
      />
      {suggestions.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-[8px] border border-stone-200 bg-white shadow-sm">
          {suggestions.map((s, i) => (
            <li key={s.email}>
              <button type="button"
                onMouseDown={(e) => { e.preventDefault(); pick(s.email); }}
                className={cn("flex w-full items-baseline justify-between gap-2 px-2.5 py-1.5 text-left text-[12px] hover:bg-[#f9f8f6]", i === hi && "bg-[#f9f8f6]")}>
                <span className="font-medium text-stone-800">{s.name}</span>
                <span className="shrink-0 text-[11px] text-stone-400">{s.email}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
