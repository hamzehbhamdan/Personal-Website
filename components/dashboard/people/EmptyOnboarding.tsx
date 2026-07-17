"use client";

import { useState } from "react";
import { parseCSV, importCsvInto } from "@/lib/dashboard/people/csv";
import { normalizeDb } from "@/lib/dashboard/people/backup";
import { SuggestedList } from "./SuggestedList";
import type { CrmDB } from "@/lib/dashboard/people/types";
import type { LiveState } from "./useLiveInteractions";

const serif = { fontFamily: "var(--font-playfair), Georgia, serif" };
const mono = { fontFamily: "var(--font-geist-mono), monospace" };
const btnGhost =
  "rounded-[8px] border border-stone-200 px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-stone-500 hover:border-stone-300 cursor-pointer inline-block";

/**
 * Empty-state onboarding (Task 16). Shown by PeopleView in place of the Segmented + lists when
 * `db.contacts.length === 0`. Purely presentational — every write goes through the passed
 * `setState` (CSV import, following the STATE-MUTATION CONVENTION: derive from `normalizeDb(prev)`,
 * never from the `db` snapshot) or the passed `onAdd`/`onDismiss` (same handlers PeopleView wires
 * to PeopleList, so adding/hiding a suggestion here behaves identically).
 */
export function EmptyOnboarding({ db, live, setState, onAdd, onDismiss }: {
  db: CrmDB;
  live: LiveState;
  setState: (updater: (prev: CrmDB) => CrmDB) => void;
  onAdd: (email: string) => void;
  onDismiss: (email: string) => void;
}) {
  const [csvMsg, setCsvMsg] = useState<string | null>(null);

  // Import contacts CSV: identical pattern to CrmSettingsModal.handleImportCsvChange — the counts
  // for the status message come from the read-only `db` snapshot, but the REAL write is derived
  // from `prev` inside the setState updater, never from `db`.
  function handleImportCsvChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setCsvMsg(null);
    const reader = new FileReader();
    reader.onload = () => {
      const rows = parseCSV(String(reader.result));
      if (rows.length < 2) { setCsvMsg("CSV looks empty."); return; }
      const { added, updated } = importCsvInto(normalizeDb(db), rows);
      setState((prev) => importCsvInto(normalizeDb(prev), rows).db);
      setCsvMsg(`Imported ${added} new, updated ${updated} contact(s).`);
    };
    reader.readAsText(file);
  }

  return (
    <div className="rounded-[14px] border border-stone-200 p-6">
      <h2 className="text-[22px] font-medium text-stone-900" style={serif}>Start your circle</h2>
      <p className="mt-1.5 text-[13px] text-stone-500">
        A few ways to get people into your CRM — connect Google, review who you already talk to, or import a list.
      </p>

      <div className="mt-6 flex flex-col gap-6">
        {!live.connected && (
          <div className="border-t border-stone-100 pt-5 first:border-0 first:pt-0">
            <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-stone-400" style={mono}>
              1 — Connect Google
            </div>
            <p className="mb-2.5 text-[12.5px] leading-relaxed text-stone-500">
              Sync Gmail + Calendar to surface the people you&apos;re already in touch with.
            </p>
            <a
              href="/api/google/connect"
              className="rounded-[8px] bg-[#A51C30] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-white hover:bg-[#8a1728]"
              style={mono}
            >
              Connect Google
            </a>
          </div>
        )}
        {live.connected && (
          <div className="border-t border-stone-100 pt-5 first:border-0 first:pt-0">
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-stone-400" style={mono}>
              Google connected ✓
            </div>
          </div>
        )}

        <div className="border-t border-stone-100 pt-5">
          <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-stone-400" style={mono}>
            2 — Review suggested people
          </div>
          <p className="mb-2.5 text-[12.5px] leading-relaxed text-stone-500">
            People you email or meet with who aren&apos;t in your CRM yet.
          </p>
          <SuggestedList db={db} live={live} onAdd={onAdd} onDismiss={onDismiss} />
        </div>

        <div className="border-t border-stone-100 pt-5">
          <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-stone-400" style={mono}>
            3 — Import contacts (.csv)
          </div>
          <p className="mb-2.5 text-[12.5px] leading-relaxed text-stone-500">
            Columns recognized: name, email, phone, tier, tags, notes, birthday.
          </p>
          <div className="flex flex-wrap items-center gap-2.5">
            <label className={btnGhost} style={mono}>
              ⬆ Import contacts (.csv)
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={handleImportCsvChange}
                className="hidden"
              />
            </label>
            {csvMsg && <span className="text-[11.5px] text-stone-500">{csvMsg}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
