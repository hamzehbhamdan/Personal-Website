"use client";
import { useEffect, useState } from "react";
import { Modal } from "@/components/dashboard/ui";
import { RecipientAutocomplete } from "./RecipientAutocomplete";
import { fetchSentSearch, fetchSentBodies, askAi } from "@/lib/dashboard/people/client-ai";
import { buildDistillPrompt } from "@/lib/dashboard/people/ai-prompts";
import { normalizeDb } from "@/lib/dashboard/people/backup";
import type { CrmDB } from "@/lib/dashboard/people/types";

const mono = { fontFamily: "var(--font-geist-mono), monospace" };
const btnPrimary = "rounded-[8px] bg-[#A51C30] px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-white hover:bg-[#8a1728] disabled:opacity-50";
const btnGhost = "rounded-[8px] border border-stone-200 px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-stone-500 hover:border-stone-300 disabled:opacity-50";
const inputCls = "w-full rounded-[8px] border border-stone-200 px-2.5 py-1.5 text-[13px] text-stone-800 outline-none focus:border-[#A51C30]";
const labelCls = "font-mono text-[10px] uppercase tracking-[0.12em] text-stone-400";
const hintCls = "normal-case tracking-normal text-stone-400";
const MAX = 20;

type Row = { id: string; subject: string; to: string; date: string; snippet: string };

/**
 * Learn-my-voice wizard. On open it auto-loads the most recent SENT mail (via labelIds — works under
 * any Gmail read scope). A recipient triggers an explicit server-side `to:` search; the keyword box
 * filters the already-loaded list CLIENT-SIDE (no server call). Selection is by id and survives the
 * keyword filter. Only the ≤20 picked emails' bodies are read (at distill) — never stored; approve
 * persists only the distilled summary + each pick's {subject,date}. A real Gmail read failure (e.g.
 * missing readonly scope) surfaces a Reconnect prompt instead of a misleading "no results".
 */
export function LearnVoiceModal({ db, setState, onClose }: { db: CrmDB; setState: (u: (prev: CrmDB) => CrmDB) => void; onClose: () => void }) {
  const [to, setTo] = useState("");
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState<Row[]>([]);
  const [pageToken, setPageToken] = useState<string | undefined>(undefined);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [loadedOnce, setLoadedOnce] = useState(false);
  const [connError, setConnError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [summary, setSummary] = useState("");

  // Fetch from the server. append=false is a fresh load (recent sent, or a recipient search);
  // append=true pages in more via nextPageToken. Keyword never hits the server — see `shown` below.
  const load = async (append: boolean) => {
    setBusy(true); setMsg(null); setConnError(null);
    try {
      const r = await fetchSentSearch({ to, pageToken: append ? pageToken : undefined });
      if (!r.connected) { setConnError("You're not connected to Google. Connect to read your sent mail."); return; }
      if (!r.ok) { setConnError("Couldn't read your sent mail — this needs Gmail read access. Make sure the readonly scope is granted, then reconnect."); return; }
      setResults((prev) => (append ? [...prev, ...r.messages] : r.messages));
      setPageToken(r.nextPageToken);
      if (!append) setSelected(new Set());
    } catch { setMsg("Something went wrong — try again in a moment."); }
    finally { setBusy(false); setLoadedOnce(true); }
  };

  // Auto-load the most recent sent mail on open (no recipient). Recipient search is explicit (button).
  useEffect(() => { load(false); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const kw = keyword.trim().toLowerCase();
  const shown = kw ? results.filter((r) => `${r.subject} ${r.to} ${r.snippet}`.toLowerCase().includes(kw)) : results;

  const toggle = (id: string) => setSelected((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id);
    else if (next.size < MAX) next.add(id);
    return next;
  });

  const distill = async () => {
    setBusy(true); setMsg(null); setConnError(null);
    try {
      const r = await fetchSentBodies([...selected]);
      if (!r.connected) { setConnError("You're not connected to Google. Connect to read your sent mail."); return; }
      if (!r.samples.length) { setConnError("Couldn't read the text of the selected emails — this needs Gmail read access. Make sure the readonly scope is granted, then reconnect."); return; }
      setSummary((await askAi("distill_voice", buildDistillPrompt(r.samples))).trim());
    } catch { setMsg("Something went wrong — try again in a moment."); }
    finally { setBusy(false); }
  };

  const approve = () => {
    setState((prev) => {
      const d = normalizeDb(prev);
      const rows = results.filter((r) => selected.has(r.id));
      const voice = { ...(d.settings.voice ?? {}), styleSummary: summary.trim(), sentSamples: rows.map((r) => ({ subject: r.subject, date: r.date })) };
      return { ...d, settings: { ...d.settings, voice } };
    });
    onClose();
  };

  return (
    <Modal title="Learn my voice from sent mail" onClose={onClose}>
      <div className="flex flex-col gap-3">
        <div className="text-[12px] text-stone-500">
          Pick up to {MAX} of your sent emails and I&apos;ll distill your writing voice from them. It loads your most recent sent mail below — add a recipient to find emails to a specific person, or type a keyword to narrow the list. The text of the emails you pick goes to Claude only for this step and is never stored — only the summary is kept.
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className={labelCls}>Recipient <span className={hintCls}>(searches your sent mail)</span></label>
            <RecipientAutocomplete db={db} value={to} onChange={setTo} placeholder="name or email (Tab to complete)" />
          </div>
          <button type="button" onClick={() => load(false)} disabled={busy} className={btnPrimary} style={mono}>{busy ? "…" : to.trim() ? "Search" : "Refresh"}</button>
        </div>
        <div>
          <label className={labelCls}>Keyword / subject <span className={hintCls}>(filters the list below)</span></label>
          <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="optional" className={inputCls} />
        </div>

        {connError ? (
          <div className="rounded-[8px] border border-[#A51C30]/40 bg-[#f9f8f6] p-3 text-[12px] text-stone-600">
            <div className="mb-2">{connError}</div>
            <a href="/api/google/connect" className={btnPrimary} style={mono}>Reconnect Google</a>
          </div>
        ) : (
          <>
            {busy && !results.length && <div className="text-[12px] text-stone-500">Loading your recent sent mail…</div>}
            {loadedOnce && !busy && !results.length && <div className="text-[12px] text-stone-500">{to.trim() ? "No sent emails found to that person." : "No sent mail found."}</div>}
            {results.length > 0 && (
              <>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11.5px] text-stone-500">Pick the emails to learn from{kw ? ` (${shown.length} of ${results.length} shown)` : ""}:</span>
                  <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.12em] text-stone-400" style={mono}>{selected.size} / {MAX} selected</span>
                </div>
                <ul className="flex max-h-[46vh] flex-col gap-1.5 overflow-auto">
                  {shown.map((r) => {
                    const on = selected.has(r.id);
                    const disabled = !on && selected.size >= MAX;
                    return (
                      <li key={r.id}>
                        <label className={`flex cursor-pointer gap-2.5 rounded-[8px] border p-2.5 ${on ? "border-[#A51C30]/50 bg-[#f9f8f6]" : "border-stone-200"} ${disabled ? "opacity-40" : ""}`}>
                          <input type="checkbox" checked={on} disabled={disabled} onChange={() => toggle(r.id)} className="mt-1 accent-[#A51C30]" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-baseline justify-between gap-2">
                              <span className="truncate text-[13px] font-medium text-stone-800">{r.subject || "(no subject)"}</span>
                              <span className="shrink-0 text-[11px] text-stone-400">{r.date}</span>
                            </div>
                            <div className="truncate text-[11.5px] text-stone-500">{r.to}</div>
                            <div className="mt-0.5 line-clamp-2 text-[11.5px] text-stone-500">{r.snippet}</div>
                          </div>
                        </label>
                      </li>
                    );
                  })}
                </ul>
                {kw && !shown.length && <div className="text-[11.5px] text-stone-500">No loaded emails match that keyword.</div>}
                {pageToken && (
                  <button type="button" onClick={() => load(true)} disabled={busy} className={btnGhost} style={mono}>Load more</button>
                )}
                <div className="flex flex-wrap items-center gap-2 border-t border-stone-100 pt-2.5">
                  <button type="button" onClick={distill} disabled={busy || selected.size < 1} className={btnPrimary} style={mono}>{busy ? "Distilling…" : `Distill ${selected.size || ""}`.trim()}</button>
                </div>
              </>
            )}
          </>
        )}

        {summary && (
          <div className="border-t border-stone-100 pt-2.5">
            <label className={labelCls}>Learned voice summary <span className={hintCls}>(editable)</span></label>
            <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={6} className={`${inputCls} min-h-[120px]`} />
            <div className="mt-2.5"><button type="button" onClick={approve} disabled={busy} className={btnPrimary} style={mono}>Approve &amp; save</button></div>
          </div>
        )}

        {msg && <div className="text-[11.5px] text-stone-500">{msg}</div>}
      </div>
    </Modal>
  );
}
