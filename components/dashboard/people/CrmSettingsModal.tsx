"use client";

import { useRef, useState } from "react";
import { Modal } from "@/components/dashboard/ui";
import { cn } from "@/lib/utils";
import { TierManagerModal } from "@/components/dashboard/people/TierManagerModal";
import { normalizeDb, validateBackup } from "@/lib/dashboard/people/backup";
import { parseCSV, importCsvInto } from "@/lib/dashboard/people/csv";
import { interactionsFor } from "@/lib/dashboard/people/interactions";
import { buildTagsAllPrompt, parseTagsAllResponse, applyTagsAll, type TagsAllPerson } from "@/lib/dashboard/people/ai-prompts";
import { askAi } from "@/lib/dashboard/people/client-ai";
import type { CrmDB } from "@/lib/dashboard/people/types";
import type { LiveState } from "@/components/dashboard/people/useLiveInteractions";

const mono = { fontFamily: "var(--font-geist-mono), monospace" };
const btnPrimary = "rounded-[8px] bg-[#A51C30] px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-white hover:bg-[#8a1728] disabled:opacity-50";
const btnAlt = "rounded-[8px] border border-stone-300 px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-stone-700 hover:border-[#A51C30] hover:text-[#A51C30] disabled:opacity-50";
const btnGhost = "rounded-[8px] border border-stone-200 px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-stone-500 hover:border-stone-300 disabled:opacity-50 cursor-pointer inline-block";
const labelCls = "mb-1 block text-[11px] uppercase tracking-[0.08em] text-stone-500";
const noteCls = "mt-2 text-[11.5px] leading-relaxed text-stone-500";
const sectionCls = "border-t border-stone-200 pt-4 mt-4 first:mt-0 first:border-0 first:pt-0";

/**
 * Settings modal. Port of openSettings (crm.html:632-660).
 *
 * `db`/`live` are read-only snapshots for seeding/rendering. All writes go through `setState`
 * using the STATE-MUTATION CONVENTION: every updater re-derives from `normalizeDb(prev)`, never
 * from the `db` prop captured at render — EXCEPT the "Import backup" path, which is an
 * intentional full-data REPLACE (confirm-gated) and so discards `prev` entirely, per the plan.
 */
export function CrmSettingsModal({ db, live, setState, onClose }: {
  db: CrmDB;
  live: LiveState;
  setState: (u: (prev: CrmDB) => CrmDB) => void;
  onClose: () => void;
}) {
  const [showTiers, setShowTiers] = useState(false);

  // ---- auto-tags ----
  const [suggesting, setSuggesting] = useState(false);
  const [suggestMsg, setSuggestMsg] = useState<string | null>(null);

  function handleAutoTagsToggle(checked: boolean) {
    setState((prev) => {
      const nextDb = normalizeDb(prev);
      return { ...nextDb, settings: { ...nextDb.settings, autoTags: checked } };
    });
  }

  // Batch tag suggestion: port of suggestTagsAll (crm.html:669-675). Builds the roster from the
  // read-only `db`/`live` snapshot, then asks Claude via the tested prompt/parse pair — no inline
  // prompt-building or JSON parsing here. Graceful on AI failure; `system` is intentionally
  // omitted from askAi (never pass "").
  async function handleSuggestAll() {
    if (!db.contacts.length) { setSuggestMsg("No contacts yet."); return; }
    setSuggesting(true);
    setSuggestMsg(null);
    try {
      const people: TagsAllPerson[] = db.contacts.map((c) => ({
        name: c.name,
        tier: c.tier,
        notes: c.notes || "",
        subjects: interactionsFor(c, live.gmail, live.cal)
          .filter((i) => i.type === "email")
          .map((i) => i.text),
      }));
      const text = await askAi("suggest_tags", buildTagsAllPrompt(people));
      const parsed = parseTagsAllResponse(text);
      setState((prev) => applyTagsAll(normalizeDb(prev), parsed));
      setSuggestMsg(parsed.length ? `Suggested tags for ${parsed.length} contact(s).` : "No suggestions returned — try again.");
    } catch {
      setSuggestMsg("Could not reach Claude — try again.");
    } finally {
      setSuggesting(false);
    }
  }

  // ---- backup & data ----
  const backupInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const [backupMsg, setBackupMsg] = useState<string | null>(null);
  const [csvMsg, setCsvMsg] = useState<string | null>(null);

  // Export: this downloads the user's OWN CRM data to their own machine — no network call.
  // Port of exportBackup/download (crm.html:628).
  function handleExport() {
    const blob = new Blob([JSON.stringify(db, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `life-crm-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // Import backup: full-data REPLACE, so it is confirm-gated (port of importBackup, crm.html:629).
  // On confirm this intentionally discards `prev` — normalizeDb(obj) becomes the entire new db.
  function handleImportBackupChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBackupMsg(null);
    const reader = new FileReader();
    reader.onload = () => {
      let obj: unknown;
      try {
        obj = JSON.parse(String(reader.result));
      } catch {
        setBackupMsg("Not valid JSON.");
        return;
      }
      const check = validateBackup(obj);
      if (!check.ok) {
        setBackupMsg(check.reason ? `That file is not a CRM backup (${check.reason}).` : "That file is not a CRM backup.");
        return;
      }
      const contactCount = (obj as { contacts: unknown[] }).contacts.length;
      if (!window.confirm(`Replace ALL current data with this backup (${contactCount} contacts)? Export a backup first if unsure.`)) return;
      setState(() => normalizeDb(obj));
      onClose();
    };
    reader.readAsText(file);
  }

  // Import contacts CSV: compute counts ONCE from the read-only `db` snapshot for the summary
  // message, then apply the real write inside the setState updater derived from `prev` (port of
  // importCSV, crm.html:630-631). No confirm gate — unlike backup restore, this only adds/merges.
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
    <>
      <Modal title="Settings" onClose={onClose}>
        <div className={sectionCls}>
          <label className={labelCls}>Auto-tags <span className="normal-case tracking-normal text-stone-400">(uses Claude)</span></label>
          <label className="flex items-center gap-2 text-[13px] text-stone-700">
            <input
              type="checkbox"
              checked={db.settings.autoTags}
              onChange={(e) => handleAutoTagsToggle(e.target.checked)}
            />
            Suggest tags from each contact&apos;s email subjects and notes
          </label>
          <div className="mt-2.5 flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleSuggestAll}
              disabled={!db.settings.autoTags || suggesting}
              className={btnPrimary}
              style={mono}
            >
              {suggesting ? "Asking Claude…" : "Suggest tags for all contacts"}
            </button>
            {suggestMsg && <span className="text-[11.5px] text-stone-500">{suggestMsg}</span>}
          </div>
          <div className={noteCls}>
            When on, a "Suggest" button also appears next to Tags on each contact. Nothing is sent anywhere except to Claude to generate the tags.
          </div>
        </div>

        <div className={sectionCls}>
          <label className={labelCls}>Backup &amp; data</label>
          <div className="flex flex-wrap items-center gap-2.5">
            <button type="button" onClick={handleExport} className={btnAlt} style={mono}>
              ⬇ Export backup (.json)
            </button>
            <label className={btnGhost} style={mono}>
              ⬆ Import backup
              <input
                ref={backupInputRef}
                type="file"
                accept="application/json,.json"
                onChange={handleImportBackupChange}
                className="hidden"
              />
            </label>
            <label className={btnGhost} style={mono}>
              ⬆ Import contacts (.csv)
              <input
                ref={csvInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={handleImportCsvChange}
                className="hidden"
              />
            </label>
          </div>
          {backupMsg && <div className="mt-2 text-[11.5px] text-[#A51C30]">{backupMsg}</div>}
          {csvMsg && <div className="mt-2 text-[11.5px] text-stone-500">{csvMsg}</div>}
          <div className={noteCls}>
            Backup saves everything (contacts, groups, tiers, settings) to a file you can re-import later. CSV columns recognized: name, email, phone, tier, tags, notes, birthday. Your data otherwise lives only in this browser.
          </div>
          <div className={noteCls}>
            Currently storing {db.contacts.length} contact{db.contacts.length === 1 ? "" : "s"}, {db.groups.length} group{db.groups.length === 1 ? "" : "s"}.
          </div>
        </div>

        <div className={sectionCls}>
          <label className={labelCls}>Relationship tiers</label>
          <div className="flex flex-wrap items-center gap-2.5">
            <button type="button" onClick={() => setShowTiers(true)} className={btnGhost} style={mono}>
              Manage tiers
            </button>
          </div>
          <div className={noteCls}>
            Rename, add, or re-time your tiers (Inner circle, Friends, …) and their default cadence.
          </div>
        </div>
      </Modal>

      {showTiers && (
        <TierManagerModal db={db} setState={setState} onClose={() => setShowTiers(false)} />
      )}
    </>
  );
}
