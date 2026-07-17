"use client";

import { useState } from "react";
import { Modal } from "@/components/dashboard/ui";
import { cn } from "@/lib/utils";
import { TierManagerModal } from "@/components/dashboard/people/TierManagerModal";
import { normalizeDb, validateBackup } from "@/lib/dashboard/people/backup";
import { parseCSV, importCsvInto } from "@/lib/dashboard/people/csv";
import { interactionsFor } from "@/lib/dashboard/people/interactions";
import { buildTagsAllPrompt, parseTagsAllResponse, applyTagsAll, buildDistillPrompt, type TagsAllPerson } from "@/lib/dashboard/people/ai-prompts";
import { askAi, fetchSentSamples } from "@/lib/dashboard/people/client-ai";
import type { CrmDB } from "@/lib/dashboard/people/types";
import type { LiveState } from "@/components/dashboard/people/useLiveInteractions";

const mono = { fontFamily: "var(--font-geist-mono), monospace" };
const btnPrimary = "rounded-[8px] bg-[#A51C30] px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-white hover:bg-[#8a1728] disabled:opacity-50";
const btnAlt = "rounded-[8px] border border-stone-300 px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-stone-700 hover:border-[#A51C30] hover:text-[#A51C30] disabled:opacity-50";
const btnGhost = "rounded-[8px] border border-stone-200 px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-stone-500 hover:border-stone-300 disabled:opacity-50 cursor-pointer inline-block";
const labelCls = "mb-1 block text-[11px] uppercase tracking-[0.08em] text-stone-500";
const noteCls = "mt-2 text-[11.5px] leading-relaxed text-stone-500";
const sectionCls = "border-t border-stone-200 pt-4 mt-4 first:mt-0 first:border-0 first:pt-0";
const inputCls = "w-full rounded-[6px] border border-stone-200 px-2 py-1.5 text-[13px] text-stone-800 outline-none focus:border-[#A51C30]";

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

  // ---- your voice ----
  // Local form state seeded once from db.settings.voice. Only the owner-authored fields live
  // here (tone/styleGuide/styleNotes/examples) — styleSummary/sentSamples are written by the
  // separate learn-from-sent-mail flow (a later task) and are never touched by this form.
  const [voiceForm, setVoiceForm] = useState(() => ({
    tone: db.settings.voice?.tone ?? "",
    styleGuide: db.settings.voice?.styleGuide ?? "",
    styleNotes: db.settings.voice?.styleNotes ?? "",
    examples: db.settings.voice?.examples ?? [],
  }));
  const [voiceSavedMsg, setVoiceSavedMsg] = useState<string | null>(null);

  function handleAddExample() {
    setVoiceForm((f) => (f.examples.length >= 3 ? f : { ...f, examples: [...f.examples, ""] }));
  }

  function handleExampleChange(i: number, value: string) {
    setVoiceForm((f) => ({ ...f, examples: f.examples.map((e, idx) => (idx === i ? value : e)) }));
  }

  function handleRemoveExample(i: number) {
    setVoiceForm((f) => ({ ...f, examples: f.examples.filter((_, idx) => idx !== i) }));
  }

  // Save merges the owner-authored fields into whatever voice profile already exists,
  // PRESERVING styleSummary/sentSamples (written elsewhere) rather than clobbering them.
  function handleSaveVoice() {
    setState((prev) => {
      const d = normalizeDb(prev);
      const trimmedExamples = voiceForm.examples.map((e) => e.trim()).filter(Boolean);
      const voice = {
        ...(d.settings.voice ?? {}),
        tone: voiceForm.tone.trim() || undefined,
        styleGuide: voiceForm.styleGuide.trim() || undefined,
        styleNotes: voiceForm.styleNotes.trim() || undefined,
        examples: trimmedExamples.length ? trimmedExamples : undefined,
      };
      return { ...d, settings: { ...d.settings, voice } };
    });
    setVoiceSavedMsg("Voice saved ✓");
    setTimeout(() => setVoiceSavedMsg(null), 2500);
  }

  // ---- learn my voice from recent sent mail ----
  // SECURITY: raw sample BODIES live only in this in-memory state. They are sent to Claude once
  // (at distill) and never persisted — only the distilled styleSummary + {subject,date} metadata
  // are written to settings.voice, via the same normalizeDb(prev) state-mutation convention as the
  // rest of this modal. Never log bodies; render snippets as plain text (JSX-escaped), never
  // dangerouslySetInnerHTML.
  const [vSamples, setVSamples] = useState<{ subject: string; date: string; body: string }[] | null>(null);
  const [vSummary, setVSummary] = useState("");
  const [vBusy, setVBusy] = useState(false);
  const [vMsg, setVMsg] = useState<string | null>(null);

  async function learnFetch() {
    setVBusy(true);
    setVMsg(null);
    try {
      const r = await fetchSentSamples();
      if (!r.connected) {
        setVMsg("Reconnect Google to grant mail-reading access, then try again.");
        setVSamples(null);
      } else if (!r.samples.length) {
        setVMsg("No recent sent emails found. If you just enabled this, reconnect Google (broader scope) and retry.");
        setVSamples(null);
      } else {
        setVSamples(r.samples);
        setVSummary("");
      }
    } catch {
      setVMsg("Couldn't read recent sent mail.");
    } finally {
      setVBusy(false);
    }
  }

  async function learnDistill() {
    if (!vSamples?.length) return;
    setVBusy(true);
    setVMsg(null);
    try {
      setVSummary((await askAi("distill_voice", buildDistillPrompt(vSamples))).trim());
    } catch {
      setVMsg("Couldn't distill — try again.");
    } finally {
      setVBusy(false);
    }
  }

  // Approve: only the distilled summary + {subject,date} metadata are persisted — bodies are
  // discarded here (never written to settings).
  function learnApprove() {
    setState((prev) => {
      const d = normalizeDb(prev);
      const voice = {
        ...(d.settings.voice ?? {}),
        styleSummary: vSummary.trim() || undefined,
        sentSamples: vSamples ? vSamples.map((s) => ({ subject: s.subject, date: s.date })) : d.settings.voice?.sentSamples,
      };
      return { ...d, settings: { ...d.settings, voice } };
    });
    setVSamples(null);
    setVSummary("");
    setVMsg("Voice learned + saved ✓");
  }

  function learnClear() {
    setState((prev) => {
      const d = normalizeDb(prev);
      const voice = { ...(d.settings.voice ?? {}) };
      delete (voice as any).styleSummary;
      delete (voice as any).sentSamples;
      return { ...d, settings: { ...d.settings, voice: Object.keys(voice).length ? voice : undefined } };
    });
    setVMsg("Cleared learned voice.");
  }

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
  // Prompt size is bounded: buildTagsAllPrompt caps the flattened subjects list to 60 chars;
  // this component truncates each contact's notes to 200 chars to keep the roster bounded.
  // The roster itself includes all contacts (plan design); an oversized prompt still fails
  // gracefully via askAi's catch (the "Could not reach Claude" path).
  async function handleSuggestAll() {
    if (!db.contacts.length) { setSuggestMsg("No contacts yet."); return; }
    setSuggesting(true);
    setSuggestMsg(null);
    try {
      const people: TagsAllPerson[] = db.contacts.map((c) => ({
        name: c.name,
        tier: c.tier,
        notes: (c.notes || "").slice(0, 200),
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
          <label className={labelCls}>Your voice</label>
          <div className="mt-1 text-[11.5px] leading-relaxed text-stone-500">
            Shape how AI-drafted check-ins and group updates sound — this is woven into every draft.
          </div>
          <div className="mt-2.5 flex flex-col gap-3">
            <div>
              <label className={labelCls}>Tone</label>
              <input
                type="text"
                value={voiceForm.tone}
                onChange={(e) => setVoiceForm((f) => ({ ...f, tone: e.target.value }))}
                placeholder="warm, a little playful, concise"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Style guide</label>
              <textarea
                value={voiceForm.styleGuide}
                onChange={(e) => setVoiceForm((f) => ({ ...f, styleGuide: e.target.value }))}
                rows={5}
                placeholder="How you generally like check-ins and updates written — length, structure, things to always include or avoid…"
                className={cn(inputCls, "min-h-[100px]")}
              />
            </div>
            <div>
              <label className={labelCls}>Style notes</label>
              <textarea
                value={voiceForm.styleNotes}
                onChange={(e) => setVoiceForm((f) => ({ ...f, styleNotes: e.target.value }))}
                rows={2}
                placeholder="sign off with -H; avoid exclamation points"
                className={cn(inputCls, "min-h-[50px]")}
              />
            </div>
            <div>
              <label className={labelCls}>
                Example messages <span className="normal-case tracking-normal text-stone-400">(0–3)</span>
              </label>
              <div className="flex flex-col gap-2">
                {voiceForm.examples.map((ex, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <textarea
                      value={ex}
                      onChange={(e) => handleExampleChange(i, e.target.value)}
                      rows={2}
                      placeholder="Paste a message that sounds like you…"
                      className={cn(inputCls, "min-h-[44px] flex-1")}
                    />
                    <button type="button" onClick={() => handleRemoveExample(i)} className={btnGhost} style={mono}>
                      Remove
                    </button>
                  </div>
                ))}
                {voiceForm.examples.length < 3 && (
                  <button type="button" onClick={handleAddExample} className={btnGhost} style={mono}>
                    + Add example
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="mt-2.5 flex flex-wrap items-center gap-2.5">
            <button type="button" onClick={handleSaveVoice} className={btnPrimary} style={mono}>
              Save voice
            </button>
            {voiceSavedMsg && <span className="text-[11.5px] text-stone-500">{voiceSavedMsg}</span>}
          </div>

          <div className="mt-4 border-t border-stone-100 pt-3">
            <label className={labelCls}>Learn my voice from recent sent mail</label>
            <div className={noteCls}>
              Reads your last 5 sent emails once to learn your tone. The email text goes to Claude only for this step and is not stored — only the resulting summary is kept.
            </div>
            {db.settings.voice?.styleSummary && !vSamples && (
              <div className="mt-2 text-[11.5px] text-stone-500">
                A learned voice is currently saved and woven into drafts.
              </div>
            )}
            <div className="mt-2.5 flex flex-wrap items-center gap-2.5">
              <button type="button" onClick={learnFetch} disabled={vBusy} className={btnAlt} style={mono}>
                {vBusy && !vSamples ? "Reading…" : "Learn my voice from recent sent mail"}
              </button>
              {db.settings.voice?.styleSummary && (
                <button type="button" onClick={learnClear} disabled={vBusy} className={btnGhost} style={mono}>
                  Clear learned voice
                </button>
              )}
            </div>

            {vSamples && vSamples.length > 0 && (
              <div className="mt-3 flex flex-col gap-2">
                <div className="text-[11.5px] text-stone-500">
                  Review the emails this will learn from:
                </div>
                <ul className="flex flex-col gap-2">
                  {vSamples.map((s, i) => (
                    <li key={i} className="rounded-[6px] border border-stone-200 px-2.5 py-2 text-[12px] text-stone-700">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-medium text-stone-800">{s.subject || "(no subject)"}</span>
                        <span className="shrink-0 text-[11px] text-stone-400">{s.date}</span>
                      </div>
                      <div className="mt-1 text-stone-500">{s.body.slice(0, 160)}…</div>
                    </li>
                  ))}
                </ul>
                <div>
                  <button type="button" onClick={learnDistill} disabled={vBusy} className={btnPrimary} style={mono}>
                    {vBusy ? "Distilling…" : "Distill"}
                  </button>
                </div>
              </div>
            )}

            {vSummary && (
              <div className="mt-3">
                <label className={labelCls}>Learned voice summary <span className="normal-case tracking-normal text-stone-400">(editable)</span></label>
                <textarea
                  value={vSummary}
                  onChange={(e) => setVSummary(e.target.value)}
                  rows={5}
                  className={cn(inputCls, "min-h-[100px]")}
                />
                <div className="mt-2.5 flex flex-wrap items-center gap-2.5">
                  <button type="button" onClick={learnApprove} disabled={vBusy} className={btnPrimary} style={mono}>
                    Approve &amp; save
                  </button>
                </div>
              </div>
            )}

            {vMsg && <div className="mt-2 text-[11.5px] text-stone-500">{vMsg}</div>}
          </div>
        </div>

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
                type="file"
                accept="application/json,.json"
                onChange={handleImportBackupChange}
                className="hidden"
              />
            </label>
            <label className={btnGhost} style={mono}>
              ⬆ Import contacts (.csv)
              <input
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
