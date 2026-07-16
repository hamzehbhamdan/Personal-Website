"use client";

import { useState } from "react";
import { LOG_ICON } from "@/lib/dashboard/people/interactions";
import { normalizeDb } from "@/lib/dashboard/people/backup";
import type { Contact, CrmDB, LogEntry } from "@/lib/dashboard/people/types";

const mono = { fontFamily: "var(--font-geist-mono), monospace" };
const btnPrimary = "rounded-[8px] bg-[#A51C30] px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-white hover:bg-[#8a1728]";
const btnGhost = "rounded-[8px] border border-stone-200 px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-stone-500 hover:border-stone-300";
const LOG_TYPES = Object.keys(LOG_ICON);

export function LogInteractionForm({ contact, setState, onDone }: {
  contact: Contact;
  setState: (u: (prev: CrmDB) => CrmDB) => void;
  onDone: () => void;
}) {
  const [type, setType] = useState(LOG_TYPES[0]);
  const [when, setWhen] = useState(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");

  // Save derives ONLY from `db` inside the updater (never the `db`/`contact` captured at
  // render) per the state-mutation convention — normalizeDb is cheap and safe to call here.
  const handleSave = () => {
    const date = when ? new Date(`${when}T12:00:00`).toISOString() : new Date().toISOString();
    const entry: LogEntry = { date, type, note: note.trim() };
    setState((prev) => {
      const db = normalizeDb(prev);
      return {
        ...db,
        contacts: db.contacts.map((x) => {
          if (x.id !== contact.id) return x;
          return {
            ...x,
            log: [...x.log, entry],
            lastTouch: !x.lastTouch || date > x.lastTouch ? date : x.lastTouch,
            snoozeUntil: null,
          };
        }),
      };
    });
    onDone();
  };

  return (
    <div className="mt-3 rounded-[10px] border border-stone-200 p-3">
      <div className="grid grid-cols-2 gap-2.5">
        <div>
          <label className="mb-1 block text-[11px] text-stone-500">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full rounded-[6px] border border-stone-200 px-2 py-1.5 text-[13px] text-stone-800 outline-none focus:border-[#A51C30]"
          >
            {LOG_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-[11px] text-stone-500">When</label>
          <input
            type="date"
            value={when}
            onChange={(e) => setWhen(e.target.value)}
            className="w-full rounded-[6px] border border-stone-200 px-2 py-1.5 text-[13px] text-stone-800 outline-none focus:border-[#A51C30]"
          />
        </div>
      </div>
      <div className="mt-2.5">
        <label className="mb-1 block text-[11px] text-stone-500">Note (optional)</label>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="What did you talk about?"
          className="w-full rounded-[6px] border border-stone-200 px-2 py-1.5 text-[13px] text-stone-800 outline-none focus:border-[#A51C30]"
        />
      </div>
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={handleSave} className={btnPrimary} style={mono}>
          Save interaction
        </button>
        <button type="button" onClick={onDone} className={btnGhost} style={mono}>
          Cancel
        </button>
      </div>
    </div>
  );
}
